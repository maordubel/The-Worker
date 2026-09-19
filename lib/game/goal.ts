import 'server-only'

import goalsFile from '@/content/manual/goals.json'
import squadsFile from '@/content/manual/squads.json'
import { positionOf, takeFrom } from '@/lib/rotation/deck'
import { rng, shuffle } from './archive'
import { GOALS_PER_RUN, MAX_TOUCHES } from './goal-zones'
import { seasonLabelOf } from './seasons'
import {
  judgeReplay,
  type ReplayJudgement,
} from './replay/judge'
import { readTruth, type GoalSourceRecord, type TruthRejection } from './replay/truth'
import type { TruthTouch, UserTouch } from './replay/envelope'
import { isReplayAction } from './replay/vocab'

/**
 * שחזור השער — rebuild a real, sourced goal on the pitch, touch by touch.
 *
 * The honesty constraint the schema cannot carry: a match report says "מ-40 מטר ליד שער
 * 7", not a coordinate. Every record declares `approximateCoords`, every touch keeps the
 * reporter's own wording in `positionHe`, and from those words — and only from those
 * words — `lib/game/replay/truth.ts` derives an uncertainty ENVELOPE. A goal whose move no
 * source describes is simply not in the game; twelve were checked and dropped for exactly
 * that, and `content/manual/match-scorers.json` is not a way back in, because a scorer and
 * a minute are not a move (rule 77).
 *
 * Server authority, and it is stricter than it was. The old deal shipped the touch LIST —
 * who touched it and how, in order — and asked only where. That handed over the move's
 * whole skeleton: its length, its cast, its verbs. This one ships the fixture, a pool of
 * names, and nothing else. How many touches there were is part of the question.
 */

type GoalFile = { confidence: number; note: string; records: GoalSourceRecord[] }
type SquadFile = { records: Array<{ personName: string; seasonLabel: string }> }

const FLOOR = 2

/** Everything in the archive that is sourced well enough AND that the model can read. */
function records(): GoalSourceRecord[] {
  const file = goalsFile as unknown as GoalFile
  return file.records.filter(
    (record) =>
      (record.confidence ?? file.confidence) >= FLOOR && readTruth(record).rejections.length === 0,
  )
}

/** Every record this gate refuses, with the step and the raw text that refused it. */
export function goalRejections(): TruthRejection[] {
  const file = goalsFile as unknown as GoalFile
  return file.records.flatMap((record) => readTruth(record).rejections)
}

export function goalCount(): number {
  return records().length
}

export function hasGoals(): boolean {
  return records().length >= GOALS_PER_RUN
}

/** `2010-08-18` → `2010/11`. August onwards belongs to the season that is starting. */
export function seasonOfDate(iso: string): string {
  const year = Number(iso.slice(0, 4))
  const month = Number(iso.slice(5, 7))
  return seasonLabelOf(month >= 8 ? year : year - 1)
}

/**
 * The names a run offers, and why none of them is invented.
 *
 * The move's own actors go in first — they are the answer, and a pool that did not
 * contain them would be a trick. The rest are team-mates from `squads.json` for the
 * season the match was played in: real men who really were in that dressing room, at
 * confidence 2, never a name assembled for the occasion.
 *
 * **A squad name that shares a whole word with an actor is dropped.** `גילי ורמוט` and
 * `גיל ורמוט` are one man with two spellings, and so are `בן סהר`/`בן שהר`,
 * `סרגיי קלשצ'נקו`/`סרגיי קלשנקו`, `לאלה`/`מהראן לאלה`. Rule 64 §5 deleted family-name
 * bridging because it was ~50% wrong at CLAIMING two records are the same person; this is
 * the same test pointed the other way, where the errors land on the safe side — an
 * over-suppression costs one distractor, an under-suppression puts the same footballer in
 * the pool twice and makes the whole list look made up.
 */
function poolFor(record: GoalSourceRecord, seed: number, size = 7): string[] {
  const actors: string[] = []
  for (const step of record.sequence) {
    if (!actors.includes(step.actorHe)) actors.push(step.actorHe)
  }

  const season = seasonOfDate(record.playedOn)
  const words = new Set(actors.flatMap((name) => name.split(/\s+/).filter(Boolean)))
  const squad = (squadsFile as unknown as SquadFile).records
    .filter((row) => row.seasonLabel === season)
    .map((row) => row.personName)
    .filter((name) => !actors.includes(name))
    .filter((name) => !name.split(/\s+/).some((word) => words.has(word)))

  const unique = [...new Set(squad)].sort()
  const fill = shuffle(unique, rng(seed + record.goalId.length * 31 + record.sequence.length))
  const pool = [...actors, ...fill.slice(0, Math.max(0, size - actors.length))]
  // shuffled once more so the answer is never the head of the list
  return shuffle(pool, rng(seed * 7 + record.playedOn.length))
}

/**
 * The three goals of a run, shortest move first.
 *
 * "Shortest" is still the difficulty ramp, and it is no longer a leak: the player is not
 * told the count, so a shorter move is simply a shorter move to find.
 */
function drawn(seed: number, cursor: number): GoalSourceRecord[] {
  const all = records()
  const at = positionOf(seed, cursor, all.length, GOALS_PER_RUN)
  const deck = shuffle(all, rng(at.seed))
  const picked = takeFrom(deck, at.slot * GOALS_PER_RUN, GOALS_PER_RUN)
  return picked.sort((a, b) => a.sequence.length - b.sequence.length)
}

/**
 * What the client is allowed to see before it commits: the fixture, and a room full of
 * names. Not the cast, not the verbs, not the order, and not how many.
 */
export type GoalChallenge = {
  goalId: string
  titleHe: string
  subtitleHe: string
  competitionHe: string
  opponentHe: string
  scoreHe: string
  seasonLabel: string
  approximateCoords: true
  pool: string[]
}

export function dealRun(seed: number, cursor = 0): GoalChallenge[] {
  return drawn(seed, cursor).map((record) => ({
    goalId: record.goalId,
    titleHe: record.titleHe,
    subtitleHe: record.subtitleHe,
    competitionHe: record.competitionHe,
    opponentHe: record.opponentHe,
    scoreHe: record.scoreHe,
    seasonLabel: seasonOfDate(record.playedOn),
    approximateCoords: true as const,
    pool: poolFor(record, seed + cursor),
  }))
}

export type GoalHint = 'start' | 'count'

/**
 * A hint is a piece of the answer, so it comes from here and it is paid for.
 *
 * `start` gives the reporter's own words for where the move began — the wording, never
 * the zone. `count` gives how many touches the source describes. Neither reveals the
 * cast, the verbs or the order, which is what "a hint must never silently reveal the
 * whole solution" means in practice.
 */
export function goalHint(
  seed: number,
  goalIndex: number,
  which: GoalHint,
  cursor = 0,
): string | null {
  const record = drawn(seed, cursor)[goalIndex]
  if (!record) return null
  if (which === 'count') return String(record.sequence.length)
  return record.sequence[0]?.positionHe ?? null
}

export type GoalVerdict = ReplayJudgement & {
  goalId: string
  truth: TruthTouch[]
  narrativeHe: string
  sourceTitle: string
  sourceUrl: string | null
}

/** At most five touches, and every name has to come from the pool the deal handed out. */
function clean(point: { x: number; y: number }): { x: number; y: number } | null {
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return null
  // the board carries air above the goal line, so y runs a little below zero
  return { x: Math.max(0, Math.min(1, point.x)), y: Math.max(-0.2, Math.min(1, point.y)) }
}

export function gradeGoal(
  seed: number,
  goalIndex: number,
  touches: UserTouch[],
  cursor = 0,
): GoalVerdict | null {
  const record = drawn(seed, cursor)[goalIndex]
  if (!record) return null
  const reading = readTruth(record)
  if (reading.rejections.length > 0) return null

  // Never trust the shape that came back over the wire: a name that was not offered, an
  // action that is not a verb, a coordinate that is not a number, or a sixth touch.
  const pool = new Set(poolFor(record, seed + cursor))
  const safe: UserTouch[] = []
  for (const touch of touches.slice(0, MAX_TOUCHES)) {
    if (!touch || !pool.has(touch.actorHe) || !isReplayAction(touch.action)) continue
    const origin = clean(touch.origin)
    const target = clean(touch.target)
    if (!origin || !target) continue
    safe.push({ actorHe: touch.actorHe, action: touch.action, origin, target })
  }

  return {
    ...judgeReplay(safe, reading.touches),
    goalId: record.goalId,
    truth: reading.touches,
    narrativeHe: record.narrativeHe,
    sourceTitle: record.sourceTitle,
    sourceUrl: record.sourceUrl,
  }
}
