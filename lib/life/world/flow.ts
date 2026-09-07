import { beatFlag, type Beat } from '../content/beats'
import type { Era } from '../content/era'
import type { Condition } from './types'
import type { LifeState } from '../types'
import { unmet } from './why'

/**
 * שהמשחק לא יחכה לשעון במקום השחקן — the flow layer.
 *
 * Maor, 7.9.2026: *"אפשר שפעם אחת תוודא שאין שום תקלה? שהמשחק פעיל זורם ועובד?"* The two
 * documents he sent name the same failure twice: a day where the player has done
 * everything reachable and the next thing is a clock, so the only move left is to walk in
 * circles until a number arrives. `lastResort.ts` already knows this shape — it refuses to
 * call it a stall, correctly, because the chapter is early rather than broken. What it did
 * not do is DO anything about it.
 *
 * This file is the missing half. It answers one question with a number attached:
 *
 *   > Is the next thing this day wants blocked by nothing but the clock, and if so, when?
 *
 * The runtime uses that to offer the player a short contextual jump — sitting on a wall,
 * a bus going past — instead of eighty virtual minutes of pacing. The offer is never
 * forced: optional content stays reachable, and the card has a "stay" on it.
 *
 * It is a pure function of the state and the era, so `tests/life-flow.test.ts` can put
 * every chapter through it without a canvas.
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

/** game-minutes of nothing happening before the game offers to move the clock itself */
export const QUIET_MINUTES = 25

/**
 * האם להציע לדלג — the whole rule, in one place.
 *
 * Four things have to be true at once, and each one is there to stop a different way of
 * being wrong:
 *
 *   - a time gate exists — otherwise there is nothing to skip TO, and a jump would be the
 *     game skipping its own content;
 *   - the room is quiet — a player mid-errand is not waiting, he is playing;
 *   - nothing is busy — a beat, a match or an open dialogue is the day happening;
 *   - the room still has doors — if it offers literally nothing at all the problem is not
 *     the clock, it is a dead end, and `lastResort` is the thing that answers that.
 */
export function shouldOfferPass(input: FlowInput): TimeGate | null {
  if (input.busy) return null
  if (input.quietFor < QUIET_MINUTES) return null
  if (input.reachable === 0) return null
  return nextTimeGate(input.state, input.era)
}

/** the minute the jump lands on: just before the beat, so the beat still plays */
export const LANDS_BEFORE = 3
export const landingMinute = (gate: TimeGate) => Math.max(0, gate.minute - LANDS_BEFORE)
