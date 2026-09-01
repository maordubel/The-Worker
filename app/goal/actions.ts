'use server'

import { gradeGoal, type GoalVerdict } from '@/lib/game/goal'

/**
 * The real path stays on the server until the player has committed to theirs.
 *
 * One round trip per GOAL, not per touch: a per-touch call would put the network between
 * the finger and the feedback, and the whole point of the rebuilt loop is that a tap
 * resolves in the same frame.
 */
export async function submitGoal(
  seed: number,
  goalIndex: number,
  picks: string[],
): Promise<GoalVerdict | null> {
  return gradeGoal(seed, goalIndex, picks)
}
