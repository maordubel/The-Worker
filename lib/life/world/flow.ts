import { beatFlag, type Beat } from '../content/beats'
import type { Era } from '../content/era'
import type { Condition } from './types'
import type { LifeState } from '../types'
import { unmet } from './why'

/**
 * שהמשחק לא יחכה לשעון במקום השחקן — the flow layer.
 *
 * The rule is deliberately player-facing rather than technical: if the next meaningful
 * thing is waiting only for a clock, the player must be able to continue immediately
 * instead of walking in circles. If the day still wants an action, the room nudges toward
 * that action instead. `lastResort.ts` remains an invisible safety net, never the intended
 * way a chapter advances.
 *
 * This file stays pure so every chapter can be probed without booting Phaser.
 */

export type TimeGate = {
  /** the beat that is only waiting for the clock */
  beatId: string
  /** the minute it starts wanting to happen */
  minute: number
  /** what the beat calls itself while it waits, when it says */
  waitingHe?: string
}

/** every clause of a condition that is not met right now, as `why.ts` phrases them */
const needsOf = (state: LifeState, when?: Condition) => unmet(state, when)

/** a need phrased as a time — the only kind this file is allowed to skip forward to */
const isTimeNeed = (need: string) => need.startsWith('אחרי ')

/**
 * The minute a beat is waiting for, dug back out of its condition.
 *
 * `unmet` gives sentences, not numbers, so the number is read from the condition tree
 * instead: the LATEST `afterMinute` anywhere in it, because a beat gated on two of them
 * is waiting for the later one.
 */
function waitsUntil(when: Condition | undefined, best = -1): number {
  if (!when) return best
  let out = best
  if (when.afterMinute !== undefined) out = Math.max(out, when.afterMinute)
  for (const part of when.all ?? []) out = Math.max(out, waitsUntil(part, best))
  for (const part of when.any ?? []) out = Math.max(out, waitsUntil(part, best))
  return out
}

/**
 * מה הדבר הבא שהיום רוצה, אם הוא רק שעה.
 *
 * The earliest beat whose every unmet clause is a time. A beat that also wants a flag, an
 * item or a room is NOT a time gate: it is a requirement, and skipping the clock forward
 * would not bring it any closer — it would just take the afternoon away from the player.
 */
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
  /** the chapter's own objective line, or null when the day wants nothing more */
  objectiveHe: string | null
  /** game-minutes the room has offered nothing new — reset by any change of state */
  quietFor: number
  /** a scene is mid-beat, mid-match or mid-conversation: never interrupt that */
  busy: boolean
  /** how many things the room currently offers a thumb (people, hotspots, doors) */
  reachable: number
}

/**
 * One game-minute is enough to establish that nothing new happened. At the base world
 * clock this is roughly a second or two of real play, not the old 25-game-minute wait.
 * The player still gets a choice to stay when optional content is around; this only makes
 * the choice visible before waiting itself becomes gameplay.
 */
export const QUIET_MINUTES = 1

/**
 * האם להציע לדלג — the whole rule, in one place.
 *
 * Four things have to be true at once:
 *   - a time gate exists, otherwise there is nothing honest to skip TO;
 *   - the room has been still for one game-minute, enough to avoid flashing during entry;
 *   - nothing is busy — dialogue, a match or a beat already IS the day happening;
 *   - the room still has a way to act/leave. Literally nothing is a dead end and belongs
 *     to `lastResort`, not to a time jump.
 */
export function shouldOfferPass(input: FlowInput): TimeGate | null {
  const move = flowMove(input)
  return move?.kind === 'pass' ? move.gate : null
}

export type FlowMove = { kind: 'pass'; gate: TimeGate } | { kind: 'nudge' }

/**
 * מה לעשות עם מי שעומד.
 *
 *   quiet + a clock to skip to  → offer the jump now
 *   quiet + something to do     → say what is here
 *   busy, or nothing at all     → say nothing; another system owns that state
 *
 * Difficulty must come from choosing between meaningful things, never from discovering
 * that the game secretly wanted the player to wait for a number.
 */
export function flowMove(input: FlowInput): FlowMove | null {
  if (input.busy) return null
  if (input.quietFor < QUIET_MINUTES) return null
  if (input.reachable === 0) return null
  const gate = nextTimeGate(input.state, input.era)
  if (gate) return { kind: 'pass', gate }
  // a day that still has an objective is a day with something to do in it
  if (!input.objectiveHe) return null
  return { kind: 'nudge' }
}

/** the minute the jump lands on: just before the beat, so the beat still plays */
export const LANDS_BEFORE = 3
export const landingMinute = (gate: TimeGate) => Math.max(0, gate.minute - LANDS_BEFORE)
