import 'server-only'

import goalsFile from '@/content/manual/goals.json'
import { positionOf, takeFrom } from '@/lib/rotation/deck'
import { rng, shuffle } from './archive'
import { GOALS_PER_RUN, gradeZone, reasonKey, type Grade, type ZoneId } from './goal-zones'

/**
 * שחזור השער — rebuild a real, sourced goal on the pitch, one touch at a time.
 *
 * The honesty constraint the schema cannot carry: a match report says "מ-40 מטר ליד
 * שער 7", not a coordinate. So every record declares `approximateCoords`, every touch
 * keeps the reporter's own wording in `positionHe`, and the ZONE is stated to be an
 * interpretation of those words. A goal whose move no source describes is simply not in
 * the game — twelve were checked and dropped for exactly that (see the ingest notes).
 *
 * Server authority: the zones never leave this module until the player has committed.
 * `dealRun` strips `zone`, `noteHe` and `narrativeHe`; `gradeGoal` re-reads the record
 * from the seed and grades there.
 */

export type Action = 'pass' | 'dribble' | 'cross' | 'shot'

type Step = {
  step: number
  actorHe: string
  action: Action
  zone: ZoneId
  positionHe: string
  noteHe: string
}

type GoalRecord = {
  goalId: string
  titleHe: string
  subtitleHe: string
  competitionHe: string
  opponentHe: string
  scoreHe: string
  narrativeHe: string
  sequence: Step[]
  sourceTitle: string
  sourceUrl: string | null
  confidence?: number
}

type GoalFile = { confidence: number; records: GoalRecord[] }

const FLOOR = 2

function records(): GoalRecord[] {
  const file = goalsFile as unknown as GoalFile
  return file.records.filter((record) => (record.confidence ?? file.confidence) >= FLOOR)
}

export function goalCount(): number {
  return records().length
}

export function hasGoals(): boolean {
  return records().length >= GOALS_PER_RUN
}

/**
 * The three goals of a run, easiest move first.
 *
 * "Easiest" is the number of touches: a three-touch move is one decision shorter than a
 * four-touch one, and the clock tightens on top of that. The difficulty rises in the
 * ASK as well as in the seconds, which is the thing that separates a stage from a
 * countdown.
 */
function drawn(seed: number, cursor: number): GoalRecord[] {
  // 21 goals and three to a run: without a cursor, a player saw the same three every
  // time the wall was tapped, because the gate link pinned `?seed=1`. The cursor slides
  // a three-wide window along the same shuffled deck, so seven runs use every goal in
  // the archive before one comes round again.
  const all = records()
  const at = positionOf(seed, cursor, all.length, GOALS_PER_RUN)
  const deck = shuffle(all, rng(at.seed))
  const picked = takeFrom(deck, at.slot * GOALS_PER_RUN, GOALS_PER_RUN)
  return picked.sort((a, b) => a.sequence.length - b.sequence.length)
}

/** What the client is allowed to see: who touched it and how, never where it went. */
export type GoalChallenge = {
  goalId: string
  titleHe: string
  subtitleHe: string
  competitionHe: string
  opponentHe: string
  scoreHe: string
  approximateCoords: true
  steps: Array<{ step: number; actorHe: string; action: Action; positionHe: string }>
}

export function dealRun(seed: number, cursor = 0): GoalChallenge[] {
  return drawn(seed, cursor).map((record) => ({
    goalId: record.goalId,
    titleHe: record.titleHe,
    subtitleHe: record.subtitleHe,
    competitionHe: record.competitionHe,
    opponentHe: record.opponentHe,
    scoreHe: record.scoreHe,
    approximateCoords: true as const,
    steps: record.sequence.map((step) => ({
      step: step.step,
      actorHe: step.actorHe,
      action: step.action,
      positionHe: step.positionHe,
    })),
  }))
}

export type StepVerdict = {
  step: number
  actorHe: string
  grade: Grade
  picked: ZoneId | null
  truth: ZoneId
  reasonKey: string
  noteHe: string
  positionHe: string
}

export type GoalVerdict = {
  goalId: string
  hits: number
  nears: number
  total: number
  steps: StepVerdict[]
  truthZones: ZoneId[]
  narrativeHe: string
  sourceTitle: string
  sourceUrl: string | null
}

export function gradeGoal(
  seed: number,
  goalIndex: number,
  picks: ZoneId[],
  cursor = 0,
): GoalVerdict | null {
  // The cursor is part of the round's ADDRESS, so grading has to re-derive with it or
  // it grades a different three goals than the ones on screen. It is last and defaults
  // to zero so a link with no cursor on it still means what it always meant.
  const record = drawn(seed, cursor)[goalIndex]
  if (!record) return null

  const steps: StepVerdict[] = record.sequence.map((step, index) => {
    const picked = picks[index]
    return {
      step: step.step,
      actorHe: step.actorHe,
      grade: gradeZone(picked, step.zone),
      picked: picked ?? null,
      truth: step.zone,
      reasonKey: reasonKey(picked, step.zone),
      noteHe: step.noteHe,
      positionHe: step.positionHe,
    }
  })

  return {
    goalId: record.goalId,
    hits: steps.filter((step) => step.grade === 'hit').length,
    nears: steps.filter((step) => step.grade === 'near').length,
    total: steps.length,
    steps,
    truthZones: record.sequence.map((step) => step.zone),
    narrativeHe: record.narrativeHe,
    sourceTitle: record.sourceTitle,
    sourceUrl: record.sourceUrl,
  }
}
