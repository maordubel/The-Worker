import { describe, expect, it } from 'vitest'

import goalsFile from '@/content/manual/goals.json'
import messages from '@/messages/he.json'
import { LANDMARKS, PITCH, UNITS_PER_METRE, zoneCenter } from '@/lib/game/goal-zones'
import { dealRun, goalCount, goalRejections, gradeGoal, seasonOfDate } from '@/lib/game/goal'
import { GAP, alignSequences } from '@/lib/game/replay/align'
import {
  PRECISION,
  anchorScore,
  envelopeDistance,
  envelopeFor,
  envelopeScore,
  insideEnvelope,
  normalise,
  precisionRadii,
  type Envelope,
  type ReplayPoint,
  type TruthTouch,
  type UserTouch,
} from '@/lib/game/replay/envelope'
import { continuityOf, judgeReplay, pairScore, routeShape } from '@/lib/game/replay/judge'
import {
  POSITION_PRECISION,
  readTruth,
  type GoalSourceRecord,
} from '@/lib/game/replay/truth'
import { REPLAY_ACTIONS, actionSimilarity, isReplayAction } from '@/lib/game/replay/vocab'

/**
 * שער 8 — המעטפת, היישור והשופט.
 *
 * Three things are being held to a property rather than to a table, because all three are
 * arithmetic that has to behave the same way for inputs nobody thought of:
 *
 *   · an ENVELOPE has to score its own centre highest, fall away monotonically, and never
 *     punish a player for landing somewhere the source admits;
 *   · an ALIGNMENT has to score a perfect replay perfectly, a replay one touch long in
 *     between, and a shuffled one worse than both — in that order, for every goal in the
 *     archive rather than for a seed somebody picked;
 *   · a wider envelope must never score a given point LOWER than a narrower one around the
 *     same anchor, which is the whole honesty claim stated as an inequality: admitting
 *     you do not know cannot cost the player anything.
 */

type GoalFile = { confidence: number; note: string; records: GoalSourceRecord[] }
const ARCHIVE = (goalsFile as unknown as GoalFile).records
const CATALOGUE = messages as Record<string, string>

const CENTRE: Envelope = { x: 0.5, y: 0.5, rx: 0.1, ry: 0.08 }

function at(x: number, y: number): ReplayPoint {
  return { x, y }
}

describe('מעטפת אי-ודאות — the ellipse that replaced a point', () => {
  it('scores its own anchor highest, and nothing higher', () => {
    expect(envelopeScore(at(0.5, 0.5), CENTRE)).toBe(100)
    for (const point of [at(0.52, 0.5), at(0.5, 0.53), at(0.44, 0.46), at(0.9, 0.2)]) {
      expect(envelopeScore(point, CENTRE)).toBeLessThan(100)
    }
  })

  it('falls away monotonically along any ray — no cliff, no plateau', () => {
    for (const angle of [0, 0.7, 1.4, 2.6, 4.2, 5.9]) {
      let previous = Number.POSITIVE_INFINITY
      for (let step = 0; step <= 40; step += 1) {
        const d = step / 10
        const point = at(
          CENTRE.x + Math.cos(angle) * CENTRE.rx * d,
          CENTRE.y + Math.sin(angle) * CENTRE.ry * d,
        )
        const score = envelopeScore(point, CENTRE)
        expect(score, `angle ${angle} at ${d}`).toBeLessThanOrEqual(previous + 1e-9)
        previous = score
      }
    }
  })

  it('treats everywhere inside the envelope as a right answer', () => {
    // Inside the envelope the archive does not know better than the player does, so the
    // floor in there is 90 — a real answer, not a consolation.
    const inside: Array<[number, number]> = [
      [0, 0],
      [0.9, 0],
      [0, -0.99],
      [0.6, 0.6],
      [-0.7, 0.7],
    ]
    for (const [dx, dy] of inside) {
      const point = at(CENTRE.x + dx * CENTRE.rx, CENTRE.y + dy * CENTRE.ry)
      expect(insideEnvelope(point, CENTRE)).toBe(true)
      expect(envelopeScore(point, CENTRE)).toBeGreaterThanOrEqual(90 - 1e-9)
    }
  })

  it('reaches zero at three radii and never goes negative', () => {
    expect(envelopeScore(at(CENTRE.x + 3 * CENTRE.rx, CENTRE.y), CENTRE)).toBeCloseTo(0, 6)
    expect(envelopeScore(at(CENTRE.x + 9 * CENTRE.rx, CENTRE.y), CENTRE)).toBe(0)
    expect(envelopeScore(at(0, 0), CENTRE)).toBeGreaterThanOrEqual(0)
  })

  it('never punishes honesty: a wider envelope scores every point at least as well', () => {
    // This is the rule the whole gate turns on, written as an inequality. If saying "the
    // source only pins him to the box" ever scored a player LOWER than pretending we knew
    // the metre, the incentive would run the wrong way and the data would follow it.
    const narrow: Envelope = { x: 0.5, y: 0.4, rx: 0.05, ry: 0.04 }
    const wide: Envelope = { x: 0.5, y: 0.4, rx: 0.18, ry: 0.13 }
    for (let x = 0; x <= 1.0001; x += 0.05) {
      for (let y = 0; y <= 1.0001; y += 0.05) {
        expect(
          envelopeScore(at(x, y), wide),
          `(${x.toFixed(2)},${y.toFixed(2)})`,
        ).toBeGreaterThanOrEqual(envelopeScore(at(x, y), narrow) - 1e-9)
      }
    }
  })

  it('measures the two axes separately, because the two sentences are different', () => {
    // "מ-25 מטר" pins the depth and says nothing about the bearing; "אגף ימין" does the
    // opposite. One radius would have lost the difference between those two sentences.
    const range = precisionRadii('range')
    const flank = precisionRadii('flank')
    expect(range.rx).toBeGreaterThan(range.ry)
    expect(flank.ry).toBeGreaterThan(flank.rx)
    expect(flank.rx).toBeLessThan(range.rx)
    expect(range.ry).toBeLessThan(flank.ry)
    // the box is the widest thing the archive names and one of the shallowest
    const box = precisionRadii('box')
    expect(box.rx).toBeGreaterThan(flank.rx)
    expect(box.ry).toBeLessThan(flank.ry)
  })

  it('keeps the tiers ordered by how much the source actually says', () => {
    // Area is the wrong ordering and finding that out was worth the test: the penalty
    // area is the WIDEST region in the table and one of the shallowest, so "the box"
    // covers less ground than "midfield" while admitting twice the lateral spread. The
    // ordering that means something is containment on each axis separately.
    const area = (id: keyof typeof PRECISION) => PRECISION[id].across * PRECISION[id].deep
    const tiers = Object.keys(PRECISION) as Array<keyof typeof PRECISION>
    for (const id of tiers) {
      if (id !== 'spot') expect(area('spot'), id).toBeLessThan(area(id))
      if (id !== 'ownHalf') expect(area('ownHalf'), id).toBeGreaterThan(area(id))
    }
    // naming a side strictly narrows a stated distance; nothing else about it changes
    expect(PRECISION.rangeNamed.across).toBeLessThan(PRECISION.range.across)
    expect(PRECISION.rangeNamed.deep).toBe(PRECISION.range.deep)
    // the penalty spot is inside the goal-line tier, which is inside a stated distance
    expect(PRECISION.spot.across).toBeLessThan(PRECISION.line.across)
    expect(PRECISION.line.across).toBeLessThan(PRECISION.range.across)
  })

  it('proves the honesty claim: widening an envelope can never lower a score', () => {
    // This is the sentence the whole gate turns on, as a theorem rather than a hope.
    // Both terms of a placement's score — the envelope and the precision bonus inside it
    // — are measured in the envelope's own radii, so a record that admits more room can
    // only ever be kinder. The first version of `anchorScore` measured a PLAIN distance
    // against a fixed reach and broke exactly this: honesty cost the player more the
    // more honest the record was.
    const narrow: TruthTouch = {
      step: 1,
      actorHe: 'x',
      action: 'pass',
      origin: { x: 0.5, y: 0.4, rx: 0.04, ry: 0.03 },
      target: { x: 0.5, y: 0.1, rx: 0.04, ry: 0.03 },
      targetFrom: 'goal',
      positionHe: '',
      precision: 'spot',
      noteHe: '',
    }
    const wide: TruthTouch = {
      ...narrow,
      origin: { ...narrow.origin, rx: 0.22, ry: 0.15 },
      target: { ...narrow.target, rx: 0.22, ry: 0.15 },
    }
    for (let x = 0; x <= 1.0001; x += 0.1) {
      for (let y = 0; y <= 1.0001; y += 0.1) {
        const guess: UserTouch = {
          actorHe: 'x',
          action: 'pass',
          origin: at(x, y),
          target: at(1 - x, 1 - y),
        }
        expect(
          pairScore(guess, wide),
          `(${x.toFixed(1)},${y.toFixed(1)})`,
        ).toBeGreaterThanOrEqual(pairScore(guess, narrow) - 1e-9)
      }
    }
  })

  it('converts a metre into the board with the board’s own two scales', () => {
    // 68 metres across 276 units and 52.5 metres of depth across 376: a radius typed
    // straight into normalised units would mean two different distances on two axes.
    expect(UNITS_PER_METRE.x).toBeCloseTo((PITCH.right - PITCH.left) / 68, 6)
    expect(UNITS_PER_METRE.y).toBeCloseTo((PITCH.halfY - PITCH.goalY) / 52.5, 6)
    const box = precisionRadii('box')
    // the penalty area is 40.3m wide, so its half-width has to land on 40.3/2 metres
    expect((box.rx * PITCH.w) / UNITS_PER_METRE.x).toBeCloseTo(20.15, 6)
  })

  it('puts the penalty spot where the laws put it, not where the grid does', () => {
    const spot = envelopeFor('C1', 'spot')
    const zone = zoneCenter('C1')
    expect(spot).not.toBeNull()
    expect(zone).not.toBeNull()
    expect(spot?.y).toBeCloseTo(LANDMARKS.penaltySpot.y / PITCH.h, 9)
    // and that is a DIFFERENT place from the middle of the cell the words were read into
    expect(Math.abs((spot as Envelope).y - normalise(zone as { x: number; y: number }).y))
      .toBeGreaterThan(0.01)
  })

  it('scales the precision bonus with the envelope, so it is the same ask everywhere', () => {
    // "Did you find the middle HALF of what the source admits" — the same question for a
    // penalty spot and for the whole penalty area, which is what stops it punishing the
    // records that are honest about knowing less.
    expect(anchorScore(at(CENTRE.x, CENTRE.y), CENTRE)).toBe(100)
    expect(anchorScore(at(CENTRE.x + CENTRE.rx * 0.5, CENTRE.y), CENTRE)).toBeCloseTo(90, 6)
    expect(anchorScore(at(CENTRE.x + CENTRE.rx * 1.6, CENTRE.y), CENTRE)).toBe(0)
    const wide: Envelope = { ...CENTRE, rx: CENTRE.rx * 4, ry: CENTRE.ry * 4 }
    expect(anchorScore(at(CENTRE.x + wide.rx * 0.5, CENTRE.y), wide)).toBeCloseTo(90, 6)
    expect(anchorScore(at(CENTRE.x + CENTRE.rx, CENTRE.y), wide)).toBeGreaterThan(
      anchorScore(at(CENTRE.x + CENTRE.rx, CENTRE.y), CENTRE),
    )
  })
})

describe('מהמילים אל הגאומטריה — the phrase table is the whole claim', () => {
  it('holds every phrase the archive uses, and uses every phrase it holds', () => {
    const used = new Set(
      ARCHIVE.flatMap((record) => record.sequence.map((step) => step.positionHe)),
    )
    const unknown = [...used].filter((phrase) => !(phrase in POSITION_PRECISION))
    expect(unknown, `no tier for: ${unknown.join(' · ')}`).toEqual([])
    const orphan = Object.keys(POSITION_PRECISION).filter((phrase) => !used.has(phrase))
    expect(orphan, `tier with no touch: ${orphan.join(' · ')}`).toEqual([])
  })

  it('reads every record in the archive without a single refusal', () => {
    // A refusal is not a failure of this test — it is the honest outcome for a record the
    // model cannot represent. It IS a failure that one exists and nobody was told.
    expect(goalRejections()).toEqual([])
    expect(goalCount()).toBe(ARCHIVE.length)
  })

  it('derives every target but the last from the next origin — continuity, not a guess', () => {
    for (const record of ARCHIVE) {
      const { touches } = readTruth(record)
      expect(touches.length, record.goalId).toBe(record.sequence.length)
      for (let i = 0; i < touches.length - 1; i += 1) {
        const here = touches[i] as TruthTouch
        const next = touches[i + 1] as TruthTouch
        expect(here.targetFrom, `${record.goalId} #${i}`).toBe('continuity')
        expect(here.target).toEqual(next.origin)
      }
      const last = touches[touches.length - 1] as TruthTouch
      expect(last.targetFrom, record.goalId).toBe('goal')
      expect(last.target.x).toBeCloseTo(LANDMARKS.goalMouth.x / PITCH.w, 9)
      expect(last.target.y).toBeCloseTo(LANDMARKS.goalMouth.y / PITCH.h, 9)
    }
  })

  it('ends every recorded move with an attempt on goal, or refuses the record', () => {
    for (const record of ARCHIVE) {
      const last = record.sequence[record.sequence.length - 1]
      expect(['shot', 'header'], record.goalId).toContain(last?.action)
    }
    const bent: GoalSourceRecord = {
      ...(ARCHIVE[0] as GoalSourceRecord),
      sequence: (ARCHIVE[0] as GoalSourceRecord).sequence.map((step, index, all) =>
        index === all.length - 1 ? { ...step, action: 'pass' } : step,
      ),
    }
    const reading = readTruth(bent)
    expect(reading.touches).toEqual([])
    expect(reading.rejections[0]?.reason).toBe('no-finish')
  })

  it('refuses a phrase it has never seen rather than defaulting it', () => {
    const invented: GoalSourceRecord = {
      ...(ARCHIVE[0] as GoalSourceRecord),
      sequence: (ARCHIVE[0] as GoalSourceRecord).sequence.map((step, index) =>
        index === 0 ? { ...step, positionHe: 'איפשהו על יד הדשא' } : step,
      ),
    }
    const reading = readTruth(invented)
    expect(reading.touches).toEqual([])
    expect(reading.rejections[0]?.reason).toBe('unreadable-position')
    expect(reading.rejections[0]?.text).toBe('איפשהו על יד הדשא')
  })

  it('never cites the scorers file — a scorer and a minute are not a move (rule 77)', () => {
    for (const record of ARCHIVE) {
      expect(record.sourceTitle, record.goalId).not.toContain('match-scorers')
      expect(record.sourceUrl ?? '', record.goalId).not.toContain('match-scorers')
    }
  })

  it('states a date that its own subtitle already said', () => {
    for (const record of ARCHIVE) {
      expect(record.playedOn, record.goalId).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(record.subtitleHe, record.goalId).toContain(record.playedOn.slice(0, 4))
    }
    expect(seasonOfDate('2010-08-18')).toBe('2010/11')
    expect(seasonOfDate('2010-05-15')).toBe('2009/10')
    expect(seasonOfDate('1986-05-24')).toBe('1985/86')
    expect(seasonOfDate('2026-01-25')).toBe('2025/26')
  })
})

describe('שפת המגע — seven verbs, read from the reporter’s own word', () => {
  it('names every verb in both lengths, in the catalogue', () => {
    for (const action of REPLAY_ACTIONS) {
      expect(CATALOGUE[`goal.action.${action}`], action).toBeTruthy()
      expect(CATALOGUE[`goal.act.${action}`], action).toBeTruthy()
    }
  })

  it('uses only verbs the vocabulary declares', () => {
    for (const record of ARCHIVE) {
      for (const step of record.sequence) {
        expect(isReplayAction(step.action), `${record.goalId} ${step.action}`).toBe(true)
      }
    }
  })

  it('is symmetric, self-identical and never transitive by accident', () => {
    for (const a of REPLAY_ACTIONS) {
      expect(actionSimilarity(a, a)).toBe(100)
      for (const b of REPLAY_ACTIONS) {
        expect(actionSimilarity(a, b)).toBe(actionSimilarity(b, a))
        if (a !== b) expect(actionSimilarity(a, b)).toBeLessThan(100)
      }
    }
    // a cross is a pass and a pass is a ball in behind; a cross is NOT a ball in behind
    expect(actionSimilarity('cross', 'pass')).toBeGreaterThan(0)
    expect(actionSimilarity('pass', 'throughBall')).toBeGreaterThan(
      actionSimilarity('cross', 'throughBall'),
    )
    expect(actionSimilarity('shot', 'save')).toBe(0)
  })

  it('kept the two verbs the four-verb vocabulary had nowhere to put', () => {
    const verbs = new Set(ARCHIVE.flatMap((r) => r.sequence.map((s) => s.action)))
    expect(verbs.has('header')).toBe(true)
    expect(verbs.has('save')).toBe(true)
  })
})

describe('יישור רצפים — alignment, not position', () => {
  const same = (a: number, b: number) => (a === b ? 100 : 0)

  it('pairs two identical sequences straight through', () => {
    const pairs = alignSequences([1, 2, 3], [1, 2, 3], same)
    expect(pairs).toHaveLength(3)
    expect(pairs.every((pair) => pair.left !== null && pair.right !== null)).toBe(true)
    expect(pairs.map((pair) => pair.score)).toEqual([100, 100, 100])
  })

  it('opens exactly one gap for one extra item, and keeps everything else paired', () => {
    const pairs = alignSequences([9, 1, 2, 3], [1, 2, 3], same)
    const gaps = pairs.filter((pair) => pair.left === null || pair.right === null)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]?.right).toBeNull()
    expect(pairs.filter((pair) => pair.score === 100)).toHaveLength(3)
  })

  it('opens exactly one gap for one missing item', () => {
    const pairs = alignSequences([1, 3], [1, 2, 3], same)
    const gaps = pairs.filter((pair) => pair.left === null)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]?.right).toBe(1)
  })

  it('keeps order: it can never pair a later item with an earlier one', () => {
    const pairs = alignSequences([3, 2, 1], [1, 2, 3], same)
    const matched = pairs.filter((p) => p.left !== null && p.right !== null)
    let lastLeft = -1
    let lastRight = -1
    for (const pair of matched) {
      expect(pair.left as number).toBeGreaterThan(lastLeft)
      expect(pair.right as number).toBeGreaterThan(lastRight)
      lastLeft = pair.left as number
      lastRight = pair.right as number
    }
  })

  it('handles an empty side without inventing a pair', () => {
    expect(alignSequences([], [1, 2], same)).toHaveLength(2)
    expect(alignSequences([1, 2], [], same)).toHaveLength(2)
    expect(alignSequences([], [], same)).toEqual([])
  })

  it('prices a gap so that one is survivable and a free one is impossible', () => {
    expect(GAP).toBeGreaterThan(0)
    expect(GAP).toBeLessThan(100)
    // with a free gap the algorithm would rather skip everything than match anything
    const pairs = alignSequences([1, 2], [1, 2], (a, b) => (a === b ? GAP + 1 : 0))
    expect(pairs.every((pair) => pair.left !== null && pair.right !== null)).toBe(true)
  })
})

/* ------------------------------------------------------------------ the Smart Judge */

function asUser(touch: TruthTouch): UserTouch {
  return {
    actorHe: touch.actorHe,
    action: touch.action,
    origin: { x: touch.origin.x, y: touch.origin.y },
    target: { x: touch.target.x, y: touch.target.y },
  }
}

function truthOf(record: GoalSourceRecord): TruthTouch[] {
  return readTruth(record).touches
}

describe('השופט החכם — a near miss graded as a near miss', () => {
  it('gives a perfect rebuild a perfect score, on every goal in the archive', () => {
    for (const record of ARCHIVE) {
      const truth = truthOf(record)
      const judgement = judgeReplay(truth.map(asUser), truth)
      expect(judgement.metrics.overall, record.goalId).toBe(100)
      expect(judgement.metrics.sequence, record.goalId).toBe(100)
      expect(judgement.metrics.players, record.goalId).toBe(100)
      expect(judgement.metrics.actions, record.goalId).toBe(100)
      expect(judgement.metrics.continuity, record.goalId).toBe(100)
      expect(judgement.metrics.extra + judgement.metrics.missing, record.goalId).toBe(0)
      expect(judgement.touches.every((line) => line.kind === 'matched')).toBe(true)
    }
  })

  it('ranks perfect above one-touch-long above shuffled, on every goal in the archive', () => {
    // The ordering IS the requirement. A shifted replay is a supporter who remembered one
    // touch too many; a shuffled one is a supporter who remembered a different move.
    for (const record of ARCHIVE) {
      const truth = truthOf(record)
      if (truth.length < 3) continue
      const exact = truth.map(asUser)

      // one extra touch at the front, everything after it correct and still joined up
      const first = exact[0] as UserTouch
      const shifted: UserTouch[] = [{ ...first, target: { ...first.origin } }, ...exact]

      // the same touches, in the wrong order
      const shuffled = [...exact].reverse()

      const perfect = judgeReplay(exact, truth).metrics.overall
      const late = judgeReplay(shifted, truth).metrics.overall
      const wrong = judgeReplay(shuffled, truth).metrics.overall

      expect(perfect, record.goalId).toBe(100)
      expect(late, `${record.goalId} shifted`).toBeLessThan(perfect)
      expect(wrong, `${record.goalId} shuffled`).toBeLessThan(late)
      // and a shifted replay is still recognisably the move, not a wipeout
      expect(late, `${record.goalId} shifted floor`).toBeGreaterThan(55)
    }
  })

  it('calls the extra touch an extra and the missing touch missing, by name', () => {
    const truth = truthOf(ARCHIVE[0] as GoalSourceRecord)
    const exact = truth.map(asUser)

    const added = judgeReplay([...exact, exact[0] as UserTouch], truth)
    expect(added.metrics.extra).toBe(1)
    expect(added.metrics.missing).toBe(0)
    expect(added.touches.some((line) => line.kind === 'extra')).toBe(true)

    const dropped = judgeReplay(exact.slice(0, -1), truth)
    expect(dropped.metrics.missing).toBe(1)
    expect(dropped.metrics.extra).toBe(0)
    const gap = dropped.touches.find((line) => line.kind === 'missing')
    expect(gap?.truthActorHe).toBe((truth[truth.length - 1] as TruthTouch).actorHe)
    // a missing touch still carries the reporter's words, because the reveal has to teach
    expect(gap?.positionHe).toBeTruthy()
  })

  it('reads the ENVELOPE and not the centre — anywhere the source admits scores', () => {
    const record = ARCHIVE.find((r) => r.sequence.some((s) => s.positionHe === 'בתוך הרחבה'))
    expect(record).toBeTruthy()
    const truth = truthOf(record as GoalSourceRecord)
    const index = truth.findIndex((touch) => touch.precision === 'box')
    const touch = truth[index] as TruthTouch

    // a point well away from the anchor but still inside the box the source names
    const offCentre = { x: touch.origin.x + touch.origin.rx * 0.85, y: touch.origin.y }
    expect(insideEnvelope(offCentre, touch.origin)).toBe(true)
    expect(envelopeDistance(offCentre, touch.origin)).toBeGreaterThan(0.5)

    // the ball that ARRIVES at this touch has to move with it, or the move stops joining
    // up — which is continuity doing its job, not the envelope failing to do its
    const moved = truth.map(asUser)
    ;(moved[index] as UserTouch).origin = offCentre
    if (index > 0) (moved[index - 1] as UserTouch).target = offCentre
    const judged = judgeReplay(moved, truth)
    expect(judged.metrics.overall).toBeGreaterThanOrEqual(90)
    expect(judged.metrics.continuity).toBe(100)

    // and the same displacement, outside the envelope, costs a great deal more
    const outside = { x: touch.origin.x + touch.origin.rx * 2.6, y: touch.origin.y }
    const far = truth.map(asUser)
    ;(far[index] as UserTouch).origin = outside
    if (index > 0) (far[index - 1] as UserTouch).target = outside
    expect(judgeReplay(far, truth).metrics.overall).toBeLessThan(
      judged.metrics.overall - 8,
    )
  })

  it('costs a wrong verb less when the two verbs are nearly the same football', () => {
    const record = ARCHIVE.find((r) => r.sequence.some((s) => s.action === 'cross'))
    const truth = truthOf(record as GoalSourceRecord)
    const index = truth.findIndex((touch) => touch.action === 'cross')
    const near = truth.map(asUser)
    ;(near[index] as UserTouch).action = 'pass'
    const far = truth.map(asUser)
    ;(far[index] as UserTouch).action = 'save'
    expect(judgeReplay(near, truth).metrics.overall).toBeGreaterThan(
      judgeReplay(far, truth).metrics.overall,
    )
  })

  it('measures continuity on the player’s own move, and the archive’s is continuous already', () => {
    const truth = truthOf(ARCHIVE[0] as GoalSourceRecord)
    const joined = truth.map(asUser)
    expect(continuityOf(joined)).toBeCloseTo(100, 6)

    const broken = joined.map((touch, index) =>
      index === 0 ? { ...touch, target: { x: 0.05, y: 0.95 } } : touch,
    )
    expect(continuityOf(broken)).toBeLessThan(60)
    expect(judgeReplay(broken, truth).metrics.continuity).toBeLessThan(60)
  })

  it('does not score a direction the source never states', () => {
    // Five records put two consecutive touches in the same zone, so the truth's own route
    // there is a point. Awarding 100 for matching a direction nobody stated would be the
    // envelope mistake wearing a different hat.
    const still: TruthTouch[] = [
      {
        ...(truthOf(ARCHIVE[0] as GoalSourceRecord)[0] as TruthTouch),
      },
    ]
    const flat = { ...(still[0] as TruthTouch) }
    flat.target = { ...flat.origin }
    expect(routeShape(asUser(flat), flat)).toBeNull()

    const moving = truthOf(ARCHIVE[0] as GoalSourceRecord)[0] as TruthTouch
    expect(routeShape(asUser(moving), moving)).toBeCloseTo(100, 6)
    // a player who says the ball did not move when the source says it did gets nothing
    expect(
      routeShape({ ...asUser(moving), target: { ...moving.origin } }, moving),
    ).toBe(0)
  })

  it('never returns a score outside 0..100, for any move a client could send', () => {
    const truth = truthOf(ARCHIVE[3] as GoalSourceRecord)
    const wild: UserTouch[] = [
      { actorHe: 'לא קיים', action: 'save', origin: { x: 0, y: 1 }, target: { x: 1, y: 0 } },
      { actorHe: 'גם לא', action: 'dribble', origin: { x: 1, y: 1 }, target: { x: 0, y: 0 } },
      { actorHe: 'שלישי', action: 'header', origin: { x: 0.5, y: 0 }, target: { x: 0.5, y: 1 } },
    ]
    for (const move of [[], wild, truth.map(asUser), [...wild, ...truth.map(asUser)]]) {
      const judged = judgeReplay(move, truth)
      expect(judged.metrics.overall).toBeGreaterThanOrEqual(0)
      expect(judged.metrics.overall).toBeLessThanOrEqual(100)
      for (const line of judged.touches) {
        expect(line.score).toBeGreaterThanOrEqual(0)
        expect(line.score).toBeLessThanOrEqual(100)
      }
    }
  })

  it('weighs a matched pair to exactly one hundred and no more', () => {
    const truth = truthOf(ARCHIVE[0] as GoalSourceRecord)
    const touch = truth[0] as TruthTouch
    expect(pairScore(asUser(touch), touch)).toBeCloseTo(100, 6)
    const nobody: UserTouch = {
      actorHe: 'אף אחד',
      action: 'save',
      origin: { x: 0.02, y: 0.98 },
      target: { x: 0.98, y: 0.98 },
    }
    expect(pairScore(nobody, touch)).toBeGreaterThanOrEqual(0)
    expect(pairScore(nobody, touch)).toBeLessThan(20)
  })
})

describe('שער 8 — the deal, the hold-back and the pool', () => {
  it('hands the client the fixture and a room full of names, and nothing else', () => {
    const payload = JSON.stringify(dealRun(1))
    for (const secret of ['"zone"', 'noteHe', 'narrativeHe', 'positionHe', '"sequence"', '"steps"', 'actorHe', '"action"']) {
      expect(payload, secret).not.toContain(secret)
    }
    expect(payload).toContain('pool')
  })

  it('never tells the player how many touches the move had', () => {
    // The count is the hardest part of the question and it used to be printed on the
    // screen: the old deal shipped one row per touch.
    for (const challenge of dealRun(7, 2)) {
      expect(Object.keys(challenge)).not.toContain('steps')
      expect(challenge.pool.length).toBeGreaterThanOrEqual(6)
      expect(challenge.pool.length).toBeLessThanOrEqual(7)
      expect(new Set(challenge.pool).size).toBe(challenge.pool.length)
    }
  })

  it('offers every man who touched the ball, and fills the rest from that season’s squad', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      for (let index = 0; index < 3; index += 1) {
        const challenge = dealRun(seed)[index]
        if (!challenge) continue
        const record = ARCHIVE.find((r) => r.goalId === challenge.goalId) as GoalSourceRecord
        for (const step of record.sequence) {
          expect(challenge.pool, `${challenge.goalId} ${step.actorHe}`).toContain(step.actorHe)
        }
      }
    }
  })

  it('never stands a man beside another spelling of himself', () => {
    // `גילי ורמוט`/`גיל ורמוט`, `בן סהר`/`בן שהר`, `לאלה`/`מהראן לאלה` — one man,
    // two rows, and the pool would have printed both. Rule 64 §5 deleted family-name
    // bridging for CLAIMING two records are one person; this is the same test pointed the
    // safe way, where over-suppressing costs one distractor.
    //
    // It is scoped to ACTOR against fill, deliberately. Two different men may share a
    // given name — גל שיש and גל מאיו were both in the 2011/12 squad — and a rule
    // that forbade that would be inventing a conflict, not preventing one.
    for (let seed = 1; seed <= 60; seed += 1) {
      for (const challenge of dealRun(seed)) {
        const record = ARCHIVE.find((r) => r.goalId === challenge.goalId) as GoalSourceRecord
        const actors = new Set(record.sequence.map((step) => step.actorHe))
        const actorWords = new Set(
          [...actors].flatMap((name) => name.split(/\s+/).filter(Boolean)),
        )
        for (const name of challenge.pool) {
          if (actors.has(name)) continue
          const clash = name.split(/\s+/).filter((word) => actorWords.has(word))
          expect(clash, `${challenge.goalId}: ${name}`).toEqual([])
        }
      }
    }
  })

  it('grades a perfect rebuild of a dealt goal as a hundred, through the server path', () => {
    const verdict = gradeGoal(1, 0, [])
    expect(verdict).not.toBeNull()
    const truth = (verdict as { truth: TruthTouch[] }).truth
    const perfect = gradeGoal(1, 0, truth.map(asUser))
    expect(perfect?.metrics.overall).toBe(100)
    expect(perfect?.sourceTitle.length).toBeGreaterThan(4)
    expect(perfect?.narrativeHe.length).toBeGreaterThan(20)
  })

  it('throws away a touch the deal never offered, rather than grading it', () => {
    const truth = (gradeGoal(1, 0, []) as { truth: TruthTouch[] }).truth
    const forged = truth.map(asUser).map((touch, index) =>
      index === 0 ? { ...touch, actorHe: 'שחקן שלא הוצע' } : touch,
    )
    const verdict = gradeGoal(1, 0, forged)
    // the forged touch is dropped, so the move is one short — never silently accepted
    expect(verdict?.metrics.missing).toBe(1)
  })

  it('refuses a coordinate that is not a number, and a sixth touch', () => {
    const truth = (gradeGoal(1, 0, []) as { truth: TruthTouch[] }).truth
    const poisoned = truth.map(asUser)
    ;(poisoned[0] as UserTouch).origin = { x: Number.NaN, y: 0.5 }
    expect(() => gradeGoal(1, 0, poisoned)).not.toThrow()
    const many = [...truth.map(asUser), ...truth.map(asUser)]
    const verdict = gradeGoal(1, 0, many)
    expect((verdict?.metrics.extra ?? 0) + truth.length).toBeLessThanOrEqual(5 + truth.length)
  })

  it('returns null for a goal index the run does not hold', () => {
    expect(gradeGoal(1, 99, [])).toBeNull()
  })
})
