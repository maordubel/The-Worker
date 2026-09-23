import { beatFlag, type Beat } from '../content/beats'
import type { Era } from '../content/era'
import type { Condition } from './types'
import type { LifeState } from '../types'
import { unmet } from './why'
import { actionsNow } from './actions'

/**
 * שהמשחק לא יחכה לשעון במקום השחקן — the flow layer.
 *
 * The rule is deliberately player-facing rather than technical: if the next meaningful
 * thing is waiting only for a clock, the player must be able to continue immediately
 * instead of walking in circles. If the chapter still declares an objective, the room
 * nudges toward the actions the world has already revealed. `lastResort.ts` remains an
 * invisible safety net, never the intended way a chapter advances.
 */

export type TimeGate = {
  beatId: string
  minute: number
  waitingHe?: string
}

const needsOf = (state: LifeState, when?: Condition) => unmet(state, when)
const isTimeNeed = (need: string) => need.startsWith('אחרי ')

function waitsUntil(when: Condition | undefined, best = -1): number {
  if (!when) return best
  let out = best
  if (when.afterMinute !== undefined) out = Math.max(out, when.afterMinute)
  for (const part of when.all ?? []) out = Math.max(out, waitsUntil(part, best))
  for (const part of when.any ?? []) out = Math.max(out, waitsUntil(part, best))
  return out
}

/** The earliest beat blocked by time and by nothing else. */
export function nextTimeGate(state: LifeState, era: Era): TimeGate | null {
  let best: TimeGate | null = null
  for (const beat of (era.beats ?? []) as Beat[]) {
    if (state.flags[beatFlag(beat.id)]) continue
    const needs = needsOf(state, beat.when)
    if (needs.length === 0 || !needs.every(isTimeNeed)) continue
    const minute = waitsUntil(beat.when)
    if (minute < 0 || minute <= state.minute) continue
    if (!best || minute < best.minute) {
      best = { beatId: beat.id, minute, ...(beat.waitingHe ? { waitingHe: beat.waitingHe } : {}) }
    }
  }
  return best
}

export type FlowInput = {
  state: LifeState
  era: Era
  /** authoritative: null means the chapter itself says it wants nothing more */
  objectiveHe: string | null
  quietFor: number
  busy: boolean
  /** physical targets/exits; zero with no time gate is a dead-end check, not a hint */
  reachable: number
}

/** Roughly a second or two of real play at the base world clock — never 25 game-minutes. */
export const QUIET_MINUTES = 1

export function shouldOfferPass(input: FlowInput): TimeGate | null {
  const move = flowMove(input)
  return move?.kind === 'pass' ? move.gate : null
}

export type FlowMove = { kind: 'pass'; gate: TimeGate } | { kind: 'nudge' }

/**
 * Flow has two sources of truth with different jobs:
 *
 * - the chapter objective says WHETHER the authored day still wants an action;
 * - `actionsNow` says WHAT already-revealed story/route/opportunity actions explain it.
 *
 * A pure time gate is checked BEFORE physical reachability. That ordering is the promise
 * "never wait for the clock": a room whose last hotspot disappeared is exactly the room
 * that must be allowed to cut forward when time is the only remaining condition. With no
 * time gate, `reachable === 0` still belongs to the dead-end watchdog.
 */
export function flowMove(input: FlowInput): FlowMove | null {
  if (input.busy) return null
  if (input.quietFor < QUIET_MINUTES) return null

  const gate = nextTimeGate(input.state, input.era)
  if (gate) return { kind: 'pass', gate }

  if (input.reachable === 0) return null
  if (!input.objectiveHe) return null

  // Resolve now even though the visual nudge is still composed by WorldScene. This makes
  // the flow decision depend on semantic actions, not on raw hotspot count, and gives QA
  // one canonical snapshot to inspect when an objective has no visible action behind it.
  void actionsNow(input.state, input.era)
  return { kind: 'nudge' }
}

/** the minute the jump lands on: just before the beat, so the beat still plays */
export const LANDS_BEFORE = 3
export const landingMinute = (gate: TimeGate) => Math.max(0, gate.minute - LANDS_BEFORE)
