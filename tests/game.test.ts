import { describe, expect, it } from 'vitest'

import { CONFIDENCE_FLOOR, archive, footballPeople } from '@/lib/game/archive'
import {
  EMPTY_RUN,
  MAX_STREAK_BONUS,
  applyAnswer,
  decodeRun,
  encodeRun,
  lampsFor,
  perfectScore,
  rankFor,
} from '@/lib/game/score'
import { buildBoard } from '@/lib/game/memory'
import { dealFile, dealPairs, judge, judgePair } from '@/lib/game/blackfile'
import { dealBracket } from '@/lib/game/hate'
import { BRACKET_SIZE, judgeRun } from '@/lib/game/hate-run'
import {
  COLLARS,
  COLOUR_VAR,
  DEFAULT_SPEC,
  LAYERS,
  PATTERNS,
  SLEEVES,
  compareSpecs,
} from '@/lib/kit/spec'
import {
  OPTION_COUNT,
  ROUND_LENGTH,
  auditRound,
  availableQuestionCount,
  deal,
  grade,
  roundDifficulties,
} from '@/lib/game/trivia'
import { verifiedKitSeasons } from '@/lib/game/kits'
import { dealKitChallenge, gradeKitChallenge, kitChallengeCount } from '@/lib/game/kitChallenge'
import {
  seasonLabelOf,
  seasonStartYear,
  seasonsInSpell,
  spellCoversSeason,
} from '@/lib/game/seasons'
import { TIMELINE_LENGTH, dealTimeline, gradeTimeline } from '@/lib/game/timeline'
import { dealGoal, gradeGoal } from '@/lib/game/goal'
import {
  FORMATIONS,
  dealChallenge,
  freeBuildBank,
  gradeLineup,
  hasVerifiedLineup,
} from '@/lib/game/lineup'

describe('archive', () => {
  it('exposes only facts at or above the confidence floor', () => {
    const everything = [
      ...archive.clubs,
      ...archive.people,
      ...archive.matches,
      ...archive.matchEvents,
      ...archive.trophies,
      ...archive.kitSupply,
      ...archive.sponsorDeals,
      ...archive.crests,
    ]
    expect(everything.length).toBeGreaterThan(30)
    for (const row of everything) {
      expect(row.confidence).toBeGreaterThanOrEqual(CONFIDENCE_FLOOR)
    }
  })

  it('gives every exposed fact a named source', () => {
    for (const row of [...archive.matches, ...archive.trophies, ...archive.kitSupply]) {
      expect(row.sourceTitle.length).toBeGreaterThan(0)
    }
  })
})

describe('trivia — the client never receives the answer', () => {
  it('deals a question with no correct-answer field on it', () => {
    const question = deal(1, 0)
    expect(question).not.toBeNull()
    expect(Object.keys(question ?? {})).not.toContain('correct')
    expect(JSON.stringify(question)).not.toContain('"correct"')
  })

  it('grades on the server from the seed, not from the payload', () => {
    const question = deal(1, 0)
    const verdict = grade(1, 0, question?.options[0] ?? '')
    expect(verdict).not.toBeNull()
    expect(question?.options).toEqual(expect.arrayContaining(verdict?.correctAnswers ?? []))
  })

  it('marks exactly one option correct', () => {
    const question = deal(5, 2)
    if (!question) return
    const correct = question.options.filter(
      (option) => grade(5, 2, option)?.correct === true,
    )
    expect(correct).toHaveLength(1)
  })

  it('rejects a fabricated answer', () => {
    expect(grade(1, 0, 'לא-קיים')?.correct).toBe(false)
  })
})

describe('trivia — question quality', () => {
  it('produces a full round from the archive', () => {
    expect(availableQuestionCount()).toBeGreaterThanOrEqual(ROUND_LENGTH)
    for (let index = 0; index < ROUND_LENGTH; index += 1) {
      expect(deal(3, index), `question ${index}`).not.toBeNull()
    }
  })

  it('is deterministic — the same seed deals the same round', () => {
    expect(deal(9, 4)).toEqual(deal(9, 4))
  })

  it('offers four distinct options every time', () => {
    for (let index = 0; index < ROUND_LENGTH; index += 1) {
      const question = deal(11, index)
      if (!question) continue
      expect(new Set(question.options).size, question.prompt).toBe(question.options.length)
      expect(question.options.length).toBe(OPTION_COUNT)
    }
  })

  it('always offers exactly four distinct choices', () => {
    // A template that cannot field three real distractors is dropped, never padded:
    // an invented option is a fact no source supports.
    for (const seed of [1, 2, 3, 13, 29, 101]) {
      for (let index = 0; index < ROUND_LENGTH; index += 1) {
        const question = deal(seed, index)
        if (!question) continue
        expect(question.options.length, `${question.id}`).toBe(4)
        expect(new Set(question.options).size, `${question.id} repeats an option`).toBe(4)
      }
    }
  })

  it('keeps the source off the client payload but on the record', () => {
    // Maor asked for source and confidence lines to come off the screen. The gate they
    // enforce is untouched — it just lives server-side now.
    for (let index = 0; index < ROUND_LENGTH; index += 1) {
      const question = deal(13, index)
      if (!question) continue
      expect(Object.keys(question)).not.toContain('source')
      expect(JSON.stringify(question)).not.toContain('ודאות')
    }

    const audit = auditRound(13)
    expect(audit.length).toBeGreaterThan(0)
    for (const row of audit) {
      expect(row.source.title.length, `${row.id}`).toBeGreaterThan(0)
      expect(row.source.confidence, `${row.id}`).toBeGreaterThanOrEqual(CONFIDENCE_FLOOR)
    }
  })

  it('never asks the same question twice in one round', () => {
    const ids = Array.from({ length: ROUND_LENGTH }, (_, index) => deal(17, index)?.id)
    const present = ids.filter((id): id is string => Boolean(id))
    expect(new Set(present).size).toBe(present.length)
  })

  it('caps the Ussishkin question at one per round', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const templates = Array.from({ length: ROUND_LENGTH }, (_, index) =>
        deal(seed, index)?.template,
      ).filter((template) => template === 'ussishkin')
      expect(templates.length, `seed ${seed}`).toBeLessThanOrEqual(1)
    }
  })

  it('never uses the founder as a distractor — he appears only as the answer', () => {
    const FOUNDER = 'מאור הראל'
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      for (let index = 0; index < ROUND_LENGTH; index += 1) {
        const question = deal(seed, index)
        if (!question?.options.includes(FOUNDER)) continue
        // Present as an option means he must be the correct answer, never a decoy.
        expect(grade(seed, index, FOUNDER)?.correct, question.prompt).toBe(true)
      }
    }
  })

  it('keeps the whole Ussishkin family to one question per round', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const ussishkin = Array.from({ length: ROUND_LENGTH }, (_, index) =>
        deal(seed, index)?.template,
      ).filter((template) => template?.startsWith('ussishkin'))
      expect(ussishkin.length, `seed ${seed}`).toBeLessThanOrEqual(1)
    }
  })
})

describe('memory', () => {
  it('gives every card a category, so a pair is findable', () => {
    // Both faces of a pair are different values. Without the category on the card the
    // player cannot tell which four cards could possibly belong together, and turning
    // all twelve teaches them nothing — which is why no pair was ever formed.
    const board = buildBoard(7)
    for (const card of board) {
      expect(card.kind.length, card.face).toBeGreaterThan(0)
    }
    const byPair = new Map<string, string[]>()
    for (const card of board) byPair.set(card.pair, [...(byPair.get(card.pair) ?? []), card.kind])
    for (const [pair, kinds] of byPair) {
      expect(kinds.length, pair).toBe(2)
      expect(new Set(kinds).size, `${pair} shows two different categories`).toBe(1)
    }
  })

  it('never puts the same face on two cards', () => {
    for (const seed of [1, 7, 19, 42]) {
      const faces = buildBoard(seed).map((card) => card.face)
      expect(new Set(faces).size, `seed ${seed}`).toBe(faces.length)
    }
  })

  it('deals two cards for every pair', () => {
    const cards = buildBoard(7)
    const counts = new Map<string, number>()
    for (const card of cards) counts.set(card.pair, (counts.get(card.pair) ?? 0) + 1)
    for (const [pair, count] of counts) expect(count, pair).toBe(2)
  })

  it('never shows two cards with the same face', () => {
    const cards = buildBoard(7)
    expect(new Set(cards.map((card) => card.face)).size).toBe(cards.length)
  })

  it('is deterministic per seed and different across seeds', () => {
    expect(buildBoard(7)).toEqual(buildBoard(7))
    expect(buildBoard(7)).not.toEqual(buildBoard(8))
  })
})

describe('kits', () => {
  it('lists only seasons with a verified maker', () => {
    const seasons = verifiedKitSeasons()
    expect(seasons.length).toBeGreaterThan(5)
    for (const season of seasons) {
      expect(season.maker.length).toBeGreaterThan(0)
      expect(season.sourceTitle.length).toBeGreaterThan(0)
    }
  })

  it('leaves the seasons the archive does not cover out of the strip', () => {
    const seasons = verifiedKitSeasons().map((row) => row.season)
    expect(seasons).not.toContain('1981/82')
    expect(seasons).not.toContain('2003/04')
  })

  it('covers the seasons inside a supply spell, not only the season it starts in', () => {
    // Umbro ran 2006/07 to 2010/11. Matching sponsor to maker on the start label alone
    // hid every season in between — including the one Maor verified.
    const seasons = verifiedKitSeasons().map((row) => row.season)
    expect(seasons).toContain('2006/07')
    expect(seasons).toContain('2008/09')
    expect(seasons).toContain('2010/11')
  })

  it('carries both 2010/11 sponsors, each scoped to its competition', () => {
    const season = verifiedKitSeasons().find((row) => row.season === '2010/11')
    expect(season?.maker).toBe('אמברו')

    const scoped = (season?.sponsors ?? []).map((s) => `${s.name}|${s.competition ?? 'all'}`)
    expect(scoped).toContain('כתר|ליגת האלופות')
    expect(scoped).toContain('בוני התיכון|ליגת העל')
  })

  it('puts Subaru on the double-winning season', () => {
    const season = verifiedKitSeasons().find((row) => row.season === '2009/10')
    expect(season?.sponsors.map((s) => s.name)).toContain('סובארו')
  })
})

describe('season ranges', () => {
  it('reads and writes a season label, century wrap included', () => {
    expect(seasonStartYear('2010/11')).toBe(2010)
    expect(seasonStartYear('1999/00')).toBe(1999)
    expect(seasonStartYear(null)).toBeNull()
    expect(seasonStartYear('בערך 2010')).toBeNull()
    expect(seasonLabelOf(1999)).toBe('1999/00')
    expect(seasonLabelOf(2010)).toBe('2010/11')
  })

  it('treats an open spell as still running and a closed one as bounded', () => {
    const open = { fromLabel: '2024/25', toLabel: null }
    const closed = { fromLabel: '2006/07', toLabel: '2010/11' }

    expect(spellCoversSeason(open, '2026/27')).toBe(true)
    expect(spellCoversSeason(open, '2023/24')).toBe(false)
    expect(spellCoversSeason(closed, '2008/09')).toBe(true)
    expect(spellCoversSeason(closed, '2011/12')).toBe(false)

    expect(seasonsInSpell(closed, 2026)).toEqual([
      '2006/07',
      '2007/08',
      '2008/09',
      '2009/10',
      '2010/11',
    ])
    // An open spell is capped at the cap, never run to infinity.
    expect(seasonsInSpell(open, 2026).at(-1)).toBe('2026/27')
  })
})

describe('kit challenge', () => {
  it('deals a season and a bank, and never the answer', () => {
    const challenge = dealKitChallenge(11)
    expect(challenge).not.toBeNull()
    expect(challenge?.makers.length).toBeGreaterThan(2)
    expect(challenge?.sponsors.length).toBeGreaterThan(2)
    expect(JSON.stringify(challenge)).not.toContain('correct')
  })

  it('grades on the server and is stable for a seed', () => {
    const verdict = gradeKitChallenge(11, { maker: null, sponsor: null })
    expect(verdict).not.toBeNull()
    expect(verdict?.makerCorrect).toBe(false)

    const right = gradeKitChallenge(11, {
      maker: verdict?.maker ?? null,
      sponsor: verdict?.sponsor ?? null,
    })
    expect(right?.makerCorrect).toBe(true)
    expect(right?.sponsorCorrect).toBe(true)
    // Same seed, same target.
    expect(dealKitChallenge(11)?.challengeId).toBe(dealKitChallenge(11)?.challengeId)
  })

  it('asks about the competition-scoped 2010/11 pairs', () => {
    const ids = new Set<string>()
    for (let seed = 1; seed < 400; seed += 1) ids.add(dealKitChallenge(seed)?.challengeId ?? '')
    expect(ids).toContain('2010/11:ליגת-האלופות')
    expect(ids).toContain('2010/11:ליגת-העל')
  })

  it('never asks about a season where two sponsors are both true', () => {
    // Arkia ended early and Hachshara came in during 2019/20 — the archive holds both,
    // so the pair has no single answer and must not be a question.
    for (let seed = 1; seed < 400; seed += 1) {
      const challenge = dealKitChallenge(seed)
      expect(challenge?.challengeId).not.toBe('2019/20:all')
    }
    expect(kitChallengeCount()).toBeGreaterThan(5)
  })
})

describe('timeline', () => {
  it('deals five undated cards — the dates stay on the server', () => {
    const cards = dealTimeline(4)
    expect(cards).toHaveLength(TIMELINE_LENGTH)
    expect(JSON.stringify(cards)).not.toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  it('leaks no year in a card title or hint', () => {
    for (const seed of [1, 4, 6, 9]) {
      for (const card of dealTimeline(seed)) {
        expect(`${card.title} ${card.hint}`, card.title).not.toMatch(/\b(1[89]|20)\d{2}\b/)
      }
    }
  })

  it('grades the true chronological order as correct', () => {
    const solution = gradeTimeline(4, []).solution.map((item) => item.id)
    expect(gradeTimeline(4, solution).correct).toBe(true)
  })

  it('rejects a wrong order and still reveals the real one', () => {
    const solution = gradeTimeline(4, []).solution.map((item) => item.id)
    const swapped = [solution[1], solution[0], ...solution.slice(2)] as string[]
    const verdict = gradeTimeline(4, swapped)
    expect(verdict.correct).toBe(false)
    expect(verdict.solution).toHaveLength(TIMELINE_LENGTH)
  })

  it('returns the solution sorted oldest first', () => {
    const dates = gradeTimeline(4, []).solution.map((item) => item.on)
    expect([...dates].sort()).toEqual(dates)
  })

  it('never shows two cards from the same date', () => {
    const dates = gradeTimeline(6, []).solution.map((item) => item.on)
    expect(new Set(dates).size).toBe(dates.length)
  })
})

describe('lineup', () => {
  it('keeps every slot inside the pitch on the narrowest screen', () => {
    for (const formation of Object.values(FORMATIONS)) {
      for (const slot of formation.slots) {
        // chip is 22% wide, centred — so its centre must stay 11% off each touchline
        expect(slot.x, `${formation.name} ${slot.slotId}`).toBeGreaterThanOrEqual(11)
        expect(slot.x, `${formation.name} ${slot.slotId}`).toBeLessThanOrEqual(89)
      }
    }
  })

  it('gives every formation eleven slots with unique ids', () => {
    for (const formation of Object.values(FORMATIONS)) {
      expect(formation.slots, formation.name).toHaveLength(11)
      expect(new Set(formation.slots.map((slot) => slot.slotId)).size).toBe(11)
    }
  })

  it('never offers a basketball name on a football pitch', () => {
    expect(freeBuildBank()).not.toContain('מאור הראל')
    expect(freeBuildBank()).not.toContain('אורי שלף')
    // Small on purpose: only players a source actually names reach the bank.
    expect(freeBuildBank().length).toBeGreaterThanOrEqual(4)
  })

  it('never invents an XI — every record traces to a source', () => {
    const challenge = dealChallenge(2)
    expect(challenge?.sourceUrl).toContain('red-fans')
  })
})

describe('goal re-enactment', () => {
  it('deals the steps without their destinations', () => {
    const challenge = dealGoal(1)
    expect(challenge).not.toBeNull()
    expect(challenge?.steps.length).toBeGreaterThanOrEqual(3)
    // `to` is the answer and must never be in the payload
    expect(JSON.stringify(challenge)).not.toContain('"to"')
  })

  it('accepts a placement inside the tolerance and rejects one outside', () => {
    const truth = gradeGoal(1, [])?.steps.map((step) => step.actual) ?? []
    expect(truth.length).toBeGreaterThan(0)

    const exact = gradeGoal(1, truth)
    expect(exact?.hits).toBe(exact?.total)

    const wayOff = gradeGoal(
      1,
      truth.map((point) => ({ x: (point.x + 50) % 100, y: (point.y + 60) % 100 })),
    )
    expect(wayOff?.hits).toBe(0)
  })

  it('reveals the real path and the narrative only after grading', () => {
    const verdict = gradeGoal(1, [])
    expect(verdict?.narrativeHe).toContain('קלשצ')
    expect(verdict?.steps.every((step) => step.actual.x >= 0 && step.actual.y >= 0)).toBe(true)
  })

  it('scores an empty submission as zero rather than throwing', () => {
    const verdict = gradeGoal(1, [])
    expect(verdict?.hits).toBe(0)
  })
})

describe('the verified Chelsea XI', () => {
  it('turns the lineup game on', () => {
    expect(hasVerifiedLineup()).toBe(true)
    const challenge = dealChallenge(2)
    expect(challenge?.formation.slots).toHaveLength(11)
    expect(challenge?.bank.length).toBeGreaterThanOrEqual(11)
  })

  it('grades a correct XI as eleven exact', () => {
    const solution = gradeLineup(2, {})?.solution ?? []
    expect(solution).toHaveLength(11)
    const picks = Object.fromEntries(solution.map((row) => [row.slotId, row.name]))
    expect(gradeLineup(2, picks)?.exact).toBe(11)
  })

  it('marks a bench player as not in the XI', () => {
    const verdict = gradeLineup(2, { GK: 'ניר רחמין' })
    expect(verdict?.slots.find((slot) => slot.slotId === 'GK')?.status).toBe('not_in_xi')
  })

  it('marks a keeper played outfield as the wrong line', () => {
    // Seed-agnostic: the archive now holds several XIs, so the test finds a round that
    // actually contains this keeper rather than assuming which seed deals which match.
    let seed = 1
    while (seed < 200 && !(dealChallenge(seed)?.bank ?? []).includes('שביט אלימלך')) seed += 1
    expect(seed, 'no dealt XI contains the keeper').toBeLessThan(200)

    const verdict = gradeLineup(seed, { F1: 'שביט אלימלך' })
    expect(verdict?.slots.find((slot) => slot.slotId === 'F1')?.status).toBe('wrong_slot')
  })
})

describe('the run — difficulty, streak and rank', () => {
  it('ramps a round from easy to hard', () => {
    for (const seed of [1, 5, 23]) {
      const ladder = roundDifficulties(seed)
      expect(ladder.length).toBe(ROUND_LENGTH)
      // Non-decreasing: a round opens on what a casual fan knows and closes on what
      // only the archive knows.
      for (let index = 1; index < ladder.length; index += 1) {
        expect(ladder[index], `seed ${seed} step ${index}`).toBeGreaterThanOrEqual(
          ladder[index - 1] as number,
        )
      }
      expect(new Set(ladder).size, `seed ${seed} is all one difficulty`).toBeGreaterThan(1)
    }
  })

  it('pays more for a longer streak, and never punishes below zero', () => {
    expect(lampsFor(3, 0)).toBe(3)
    expect(lampsFor(3, 4)).toBe(7)
    // The bonus caps, so a long round cannot run away with the score.
    expect(lampsFor(3, 40)).toBe(lampsFor(3, MAX_STREAK_BONUS))

    let run = EMPTY_RUN
    run = applyAnswer(run, false, 5)
    expect(run.lamps).toBe(0)
    expect(run.streak).toBe(0)
    expect(run.answered).toBe(1)
  })

  it('breaks the streak on a wrong answer but keeps the best', () => {
    let run = EMPTY_RUN
    run = applyAnswer(run, true, 2)
    run = applyAnswer(run, true, 2)
    run = applyAnswer(run, true, 2)
    expect(run.streak).toBe(3)
    run = applyAnswer(run, false, 4)
    expect(run.streak).toBe(0)
    expect(run.bestStreak).toBe(3)
    expect(run.correct).toBe(3)
  })

  it('gives a perfect run the top rank and an empty one the bottom', () => {
    const ladder = roundDifficulties(1)
    const perfect = perfectScore(ladder)

    let run = EMPTY_RUN
    for (const difficulty of ladder) run = applyAnswer(run, true, difficulty)
    expect(run.lamps).toBe(perfect)
    expect(rankFor(run.lamps, perfect).key).toBe('rank.archivist')
    expect(rankFor(0, perfect).key).toBe('rank.newcomer')
  })

  it('round-trips a run through the URL', () => {
    const run = { lamps: 41, streak: 0, bestStreak: 6, correct: 8, answered: 10 }
    const code = encodeRun(run, 55, 12)
    const back = decodeRun(code)
    expect(back?.seed).toBe(12)
    expect(back?.perfect).toBe(55)
    expect(back?.run.lamps).toBe(41)
    expect(back?.run.bestStreak).toBe(6)
    // Junk decodes to nothing rather than to a fabricated score.
    expect(decodeRun('')).toBeNull()
    expect(decodeRun('1-2-3')).toBeNull()
    expect(decodeRun('a-b-c-d-e-f')).toBeNull()
  })
})

describe('the all-time roster', () => {
  it('holds every player the list names, football only', () => {
    // 637 names went in. They exist so a player question draws its distractors from
    // people who actually wore the shirt.
    expect(footballPeople.length).toBeGreaterThan(600)
  })

  it('keeps two players of the same name apart', () => {
    const names = archive.people.map((person) => person.fullNameHe)
    expect(names).toContain('עומר פרץ (חלוץ)')
    expect(names).toContain('עומר פרץ (קשר)')
    expect(new Set(names).size).toBe(names.length)
  })

  it('never lets an Ussishkin name into a football distractor pool', () => {
    const football = new Set(footballPeople.map((person) => person.fullNameHe))
    for (const candidate of archive.electionCandidates) {
      expect(football.has(candidate.personNameHe), candidate.personNameHe).toBe(false)
    }
  })
})

describe('the research-master corpus', () => {
  it('holds the shirt-number archive with the season always attached', () => {
    expect(archive.shirtNumbers.length).toBeGreaterThan(70)
    for (const row of archive.shirtNumbers) {
      expect(row.seasonLabel).toMatch(/^\d{4}\/\d{2}$/)
      expect(row.shirtNumber).toBeGreaterThan(0)
    }
  })

  it('never asks about a shirt two players wore in one season', () => {
    // 1984/85 had both שבתאי לוי and דב רמלר in 11 — a real mid-season fact and a
    // broken question.
    const asked = new Set<string>()
    for (let seed = 1; seed < 200; seed += 1) {
      for (let index = 0; index < ROUND_LENGTH; index += 1) {
        const question = deal(seed, index)
        if (question?.template === 'shirt-number') asked.add(question.id)
      }
    }
    expect(asked.has('shirt:11:1984/85')).toBe(false)
    expect(asked.size).toBeGreaterThan(5)
  })

  it('keeps a bare-year sponsor label out of any season-phrased question', () => {
    // "1998" is not a season. Every row that carries a bare year says so, and the
    // question it feeds is phrased "בשנת", never "בעונת".
    const bare = archive.sponsorYears.filter((row) => row.seasonAmbiguous)
    expect(bare.length).toBeGreaterThan(15)
    for (const row of bare) expect(row.yearLabelRaw).not.toContain('/')

    for (let seed = 1; seed < 120; seed += 1) {
      for (let index = 0; index < ROUND_LENGTH; index += 1) {
        const question = deal(seed, index)
        if (question?.template !== 'sponsor-year') continue
        expect(question.prompt).toContain('בשנת')
        expect(question.prompt).not.toContain('בעונת')
      }
    }
  })

  it('never asks about a gate the source disputes', () => {
    // Parma at home: the page says 16,300 and the article text says 17,500.
    const disputed = archive.matches.filter((row) => row.attendanceDisputed)
    expect(disputed.length).toBeGreaterThan(0)
    for (let seed = 1; seed < 150; seed += 1) {
      for (let index = 0; index < ROUND_LENGTH; index += 1) {
        const question = deal(seed, index)
        if (question?.template !== 'attendance') continue
        expect(question.id).not.toContain('שמינית גמר משחק 1')
      }
    }
  })

  it('plays four historic XIs and withholds the one the source cannot verify', () => {
    expect(hasVerifiedLineup()).toBe(true)
    const ids = new Set<string>()
    for (let seed = 1; seed < 200; seed += 1) ids.add(dealChallenge(seed)?.matchId ?? '')
    expect(ids).toContain('2001-02-uefa-qf-milan')
    expect(ids).toContain('2010-11-ucl-po-salzburg-2')
    // The source stamps VERIFY on one slot of the Stamford Bridge eleven.
    expect(ids).not.toContain('2001-02-uefa-r2-chelsea-away')
  })

  it('separates songs by type and keeps unverified terrace titles below the floor', () => {
    const types = new Set(archive.songs.map((row) => row.songType))
    expect(types).toContain('player_song')
    expect(types).toContain('terrace_song')
    // A title with no melody and no season is archive material, not a question.
    for (const row of archive.songs) {
      if (row.songType === 'player_song') expect(row.personNameHe).toBeTruthy()
    }
  })
})

describe('התיק השחור — gate 11', () => {
  it('grades a crossing as crossed and a myth as not', () => {
    // The two myth rows exist because the belief is widespread and the record is not.
    expect(judge('vermouth-2015', 'crossed')?.correct).toBe(true)
    expect(judge('vermouth-2015', 'did_not')?.correct).toBe(false)
    expect(judge('gershon-beitar', 'did_not')?.correct).toBe(true)
    expect(judge('zahavi-palermo', 'did_not')?.correct).toBe(true)
    // Gershon went to Beitar, not Maccabi — the card says so.
    expect(judge('gershon-beitar', 'did_not')?.toClubHe).toBe('בית"ר ירושלים')
  })

  it('never puts the answer in the dealt payload', () => {
    const dealt = dealFile(11)
    expect(dealt.length).toBeGreaterThan(3)
    expect(JSON.stringify(dealt)).not.toContain('crossed')
    expect(JSON.stringify(dealt)).not.toContain('did_not')
  })

  it('orders two dated events by their real dates', () => {
    const pairs = dealPairs(11)
    expect(pairs.length).toBeGreaterThan(2)
    for (const pair of pairs) {
      const verdict = judgePair(pair.id, pair.aSlug)
      expect(verdict).not.toBeNull()
      const first = verdict?.firstSlug
      expect([pair.aSlug, pair.bSlug]).toContain(first)
      // The earlier date really is earlier.
      const [a, b] = [verdict?.aDate as string, verdict?.bDate as string]
      expect(first === pair.aSlug ? a <= b : b <= a).toBe(true)
    }
  })

  it('keeps the basketball figures out of the football file', () => {
    // Two of the names Maor listed have no documented connection to the football club:
    // rule 14 is what keeps them out, not editorial taste.
    const names = archive.grievances
      .map((row) => `${row.personNameHe ?? ''} ${row.titleHe} ${row.bodyHe}`)
      .join(' ')
    expect(names).not.toContain('עופר ינאי')
    expect(names).not.toContain('שאול אייזנברג')
  })

  it('carries a source on every card in the file', () => {
    for (const row of archive.grievances) {
      expect(row.sourceTitle.length, row.slug).toBeGreaterThan(0)
      expect(row.confidence, row.slug).toBeGreaterThanOrEqual(CONFIDENCE_FLOOR)
    }
  })
})

describe('משחק השנאה — gate 11', () => {
  it('draws eight enemies and four opening duels', () => {
    const { enemies, duels } = dealBracket(11)
    expect(enemies).toHaveLength(BRACKET_SIZE)
    expect(duels).toHaveLength(BRACKET_SIZE / 2)
    expect(new Set(enemies.map((enemy) => enemy.slug)).size).toBe(BRACKET_SIZE)
  })

  it('spreads the terrace top four one per quarter, so the best fight is not a quarter-final', () => {
    // Every opening duel must contain exactly one of the four highest-ranked enemies.
    for (const seed of [1, 7, 11, 42, 99]) {
      const { enemies, duels } = dealBracket(seed)
      const bySlug = new Map(enemies.map((enemy) => [enemy.slug, enemy]))
      const ranks = [...enemies].sort((a, b) => a.terraceRank - b.terraceRank).slice(0, 4)
      const top = new Set(ranks.map((enemy) => enemy.slug))
      for (const duel of duels) {
        const seeded = [duel.aSlug, duel.bSlug].filter((slug) => top.has(slug))
        expect(seeded, `seed ${seed}: ${duel.aSlug} vs ${duel.bSlug}`).toHaveLength(1)
        expect(bySlug.get(duel.aSlug)).toBeDefined()
        expect(bySlug.get(duel.bSlug)).toBeDefined()
      }
    }
  })

  it('carries the enemies Maor named, across both sports', () => {
    const names = archive.enemies.map((row) => row.nameHe)
    for (const name of ['עופר ינאי', 'שאול אייזנברג', 'ערן זהבי', 'שמעון גרשון', 'גילי ורמוט', 'חיים רמון']) {
      expect(names, name).toContain(name)
    }
    // and the wall between the sports is a FIELD, not an omission
    const yanai = archive.enemies.find((row) => row.slug === 'yanai')
    expect(yanai?.sport).toBe('basketball')
  })

  it('gives every enemy a charge, a fact and a source', () => {
    for (const row of archive.enemies) {
      expect(row.chargeHe.length, row.slug).toBeGreaterThan(20)
      expect(row.detailHe.length, row.slug).toBeGreaterThan(60)
      expect(row.keyFactHe.length, row.slug).toBeGreaterThan(2)
      expect(row.sourceTitle.length, row.slug).toBeGreaterThan(2)
      expect(row.terraceRank, row.slug).toBeGreaterThan(0)
    }
  })

  it('scores a run that always follows the terrace at 100%, and one that never does at 0%', () => {
    const { enemies } = dealBracket(11)
    const [a, b] = [...enemies].sort((x, y) => x.terraceRank - y.terraceRank)
    if (!a || !b) throw new Error('bracket too small')
    const withTerrace = judgeRun(enemies, [{ aSlug: a.slug, bSlug: b.slug, winner: a.slug }])
    expect(withTerrace?.agreement).toBe(100)
    expect(withTerrace?.champion.slug).toBe(a.slug)
    const against = judgeRun(enemies, [{ aSlug: a.slug, bSlug: b.slug, winner: b.slug }])
    expect(against?.agreement).toBe(0)
    expect(against?.champion.slug).toBe(b.slug)
  })

  it('ranks the standings by how far the player carried each enemy', () => {
    const { enemies, duels } = dealBracket(11)
    const first = duels[0]
    const second = duels[1]
    if (!first || !second) throw new Error('bracket too small')
    const picks = [
      { aSlug: first.aSlug, bSlug: first.bSlug, winner: first.aSlug },
      { aSlug: second.aSlug, bSlug: second.bSlug, winner: second.aSlug },
      { aSlug: first.aSlug, bSlug: second.aSlug, winner: first.aSlug },
    ]
    const verdict = judgeRun(enemies, picks)
    expect(verdict?.standings[0]?.enemy.slug).toBe(first.aSlug)
    expect(verdict?.standings[0]?.wins).toBe(2)
  })

  it('never hands the bracket a name the roster does not carry', () => {
    expect(judgeRun([], [{ aSlug: 'nobody', bSlug: 'nobody', winner: 'nobody' }])).toBeNull()
  })
})

describe('ציטוטים ובחירה מרובה — the new question shapes', () => {
  it('asks the Berkovic call against four real fixtures', () => {
    const call = archive.calls.find((row) => row.slug === 'berkovic-hine-lala')
    expect(call?.distractorsHe).toHaveLength(3)
    expect(call?.answerHe).toContain('2009/10')
    // the source is Maor, and it says so rather than dressing up as a press citation
    expect(call?.sourceTitle).toContain('מאור הראל')
  })

  it('gives a multi-select six options, exactly three of them right', () => {
    let seen = 0
    for (let seed = 1; seed < 40 && seen < 3; seed += 1) {
      for (let index = 0; index < ROUND_LENGTH; index += 1) {
        const question = deal(seed, index)
        if (question?.kind !== 'multi') continue
        seen += 1
        expect(question.options).toHaveLength(6)
        expect(new Set(question.options).size).toBe(6)
        expect(question.pickCount).toBe(3)
        const verdict = grade(seed, index, question.options)
        // ticking everything is not an answer
        expect(verdict?.correct).toBe(false)
        const truth = grade(seed, index, verdict?.correctAnswers ?? [])
        expect(truth?.correct).toBe(true)
        expect(truth?.hits).toBe(3)
        for (const answer of verdict?.correctAnswers ?? []) {
          expect(question.options).toContain(answer)
        }
      }
    }
    expect(seen, 'no multi-select question was dealt in 40 seeds').toBeGreaterThan(0)
  })

  it('never marks a shirt-number distractor as someone who wore it', () => {
    const wore = new Map<number, Set<string>>()
    for (const row of archive.shirtNumbers) {
      const set = wore.get(row.shirtNumber) ?? new Set<string>()
      set.add(row.personNameHe)
      wore.set(row.shirtNumber, set)
    }
    for (let seed = 1; seed < 25; seed += 1) {
      for (let index = 0; index < ROUND_LENGTH; index += 1) {
        const question = deal(seed, index)
        if (question?.template !== 'shirt-multi') continue
        const number = Number(question.id.split(':')[1])
        const holders = wore.get(number) ?? new Set<string>()
        const verdict = grade(seed, index, [])
        const wrong = question.options.filter(
          (option) => !(verdict?.correctAnswers ?? []).includes(option),
        )
        for (const name of wrong) {
          expect(holders.has(name), `${name} is recorded on ${number}`).toBe(false)
        }
      }
    }
  })
})

describe('מערכת השכבות — the kit stack', () => {
  it('scores a rebuild layer by layer, not as a similarity percentage', () => {
    const truth = { ...DEFAULT_SPEC, pattern: 'stripe-wide' as const, collar: 'v-neck' as const }
    const attempt = { ...truth, collar: 'crew' as const }
    const result = compareSpecs(attempt, truth)
    expect(result.pattern).toBe(true)
    expect(result.collar).toBe(false)
    expect(Object.values(result).filter(Boolean)).toHaveLength(LAYERS.length - 1)
  })

  it('offers every cut, collar and sleeve the handoff specifies', () => {
    expect(PATTERNS).toHaveLength(12)
    expect(COLLARS).toHaveLength(5)
    expect(SLEEVES).toHaveLength(5)
    expect(LAYERS).toHaveLength(8)
  })

  it('draws every colour from a token, never a literal — except the one tonal red', () => {
    for (const [name, value] of Object.entries(COLOUR_VAR)) {
      if (name === 'deep') continue
      expect(value, name).toMatch(/^rgb\(var\(--/)
    }
  })
})
