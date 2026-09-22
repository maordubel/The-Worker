'use server'

import {
  gradeGoal,
  goalHint,
  receptionHint,
  type GoalHint,
  type GoalVerdict,
} from '@/lib/game/goal'
import type { Envelope, UserTouch } from '@/lib/game/replay/envelope'

/**
 * The real move stays on the server until the player has committed to theirs.
 *
 * One round trip per GOAL, not per touch: a per-touch call would put the network between
 * the finger and the feedback, and the whole point of the rebuilt loop is that a tap
 * resolves in the same frame.
 *
 * What crosses the wire back is the WHOLE truth — anchors, envelopes, the reporter's
 * wording — because the reveal's entire job is to show the player what the archive
 * actually knows and how wide it is. It crosses after the whistle and never before.
 *
 * Every action takes the round's `pin` too (`/goal?g=<goalId>`), because the deal is
 * re-derived here from what the page was given and a pinned run is a different deal.
 */
export async function submitGoal(
  seed: number,
  goalIndex: number,
  touches: UserTouch[],
  cursor = 0,
  pin: string | null = null,
): Promise<GoalVerdict | null> {
  // A round is addressed by seed AND cursor once rotation is on; grading has to
  // re-derive with both or it grades a different deal than the one on screen.
  return gradeGoal(seed, goalIndex, touches, cursor, pin)
}

/**
 * A hint is a piece of the answer, so it is fetched rather than shipped with the deal.
 *
 * Sending both hints down with the challenge and hiding them behind a button would put
 * the answer in the page source, which is the trivia wing's rule 4 in a different gate.
 */
export async function askGoalHint(
  seed: number,
  goalIndex: number,
  which: GoalHint,
  cursor = 0,
  pin: string | null = null,
): Promise<string | null> {
  return goalHint(seed, goalIndex, which, cursor, pin)
}

/**
 * The reception hint: ONE envelope — anchor and radii — for the touch being built, and
 * never a bare point. See `receptionHint` for why it is shaped exactly like that.
 */
export async function askReceptionHint(
  seed: number,
  goalIndex: number,
  touchIndex: number,
  cursor = 0,
  pin: string | null = null,
): Promise<Envelope | null> {
  return receptionHint(seed, goalIndex, touchIndex, cursor, pin)
}
