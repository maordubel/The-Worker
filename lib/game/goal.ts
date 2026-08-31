import 'server-only'

import goalsFile from '@/content/manual/goals.json'
import { rng } from './archive'

/**
 * שחזור השער — replay a goal by placing each pass and the finish on the pitch.
 *
 * Follows the GoalReenactment schema: an ordered sequence of movement vectors in
 * percentage coordinates, graded against a tolerance radius.
 *
 * One honesty constraint the schema does not carry: a match report says "40 metres,
 * near Gate 7", not a coordinate. Every sequence therefore declares
 * `approximateCoords`, the tolerance is generous, and the screen states it. A goal
 * whose path we cannot describe from a source simply is not in the game.
 */

export type Action = 'pass' | 'dribble' | 'cross' | 'shot'
export type Point = { x: number; y: number }

type Step = {
  step: number
  actorHe: string
  action: Action
  from: Point
  to: Point
  targetHe?: string
  goalQuadrant?: number
  noteHe: string
}

type GoalRecord = {
  goalId: string
  titleHe: string
  subtitleHe: string
  matchNaturalKey: string
  approximateCoords: boolean
  narrativeHe: string
  sequence: Step[]
  confidence?: number
}

type GoalFile = {
  confidence: number
  source: { title: string; url?: string | null }
  records: GoalRecord[]
}

const FLOOR = 2
/** Percentage of the pitch diagonal. Wide, because the source is a narrative. */
export const TOLERANCE = 11

function records(): GoalRecord[] {
  const file = goalsFile as unknown as GoalFile
  return file.records.filter((record) => (record.confidence ?? file.confidence) >= FLOOR)
}

function pick(seed: number): GoalRecord | undefined {
  const all = records()
  return all[Math.floor(rng(seed)() * all.length)]
}

/** Public shape: the start point and the actor of each step, never the destination. */
export type GoalChallenge = {
  goalId: string
  titleHe: string
  subtitleHe: string
  approximateCoords: boolean
  tolerance: number
  sourceTitle: string
  sourceUrl: string | null
  steps: Array<{
    step: number
    actorHe: string
    action: Action
    from: Point
    targetHe: string | null
  }>
}

export function dealGoal(seed: number): GoalChallenge | null {
  const record = pick(seed)
  if (!record) return null
  const file = goalsFile as unknown as GoalFile
  return {
    goalId: record.goalId,
    titleHe: record.titleHe,
    subtitleHe: record.subtitleHe,
    approximateCoords: record.approximateCoords,
    tolerance: TOLERANCE,
    sourceTitle: file.source.title,
    sourceUrl: file.source.url ?? null,
    steps: record.sequence.map((step) => ({
      step: step.step,
      actorHe: step.actorHe,
      action: step.action,
      from: step.from,
      targetHe: step.targetHe ?? null,
    })),
  }
}

export type StepVerdict = {
  step: number
  hit: boolean
  /** how far off, in percent of the pitch */
  distance: number
  actual: Point
  noteHe: string
}

export type GoalVerdict = {
  hits: number
  total: number
  steps: StepVerdict[]
  narrativeHe: string
  sourceTitle: string
  sourceUrl: string | null
}

function distance(a: Point, b: Point): number {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 10) / 10
}

/** Graded on the server: the real destinations never travel before they are earned. */
export function gradeGoal(seed: number, placed: Point[]): GoalVerdict | null {
  const record = pick(seed)
  if (!record) return null
  const file = goalsFile as unknown as GoalFile

  const steps: StepVerdict[] = record.sequence.map((step, index) => {
    const guess = placed[index]
    const away = guess ? distance(guess, step.to) : Number.POSITIVE_INFINITY
    return {
      step: step.step,
      hit: away <= TOLERANCE,
      distance: Number.isFinite(away) ? away : -1,
      actual: step.to,
      noteHe: step.noteHe,
    }
  })

  return {
    hits: steps.filter((step) => step.hit).length,
    total: steps.length,
    steps,
    narrativeHe: record.narrativeHe,
    sourceTitle: file.source.title,
    sourceUrl: file.source.url ?? null,
  }
}

export function hasGoals(): boolean {
  return records().length > 0
}
