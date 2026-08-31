'use server'

import { gradeGoal, type GoalVerdict } from '@/lib/game/goal'

/** The real path stays on the server until the player has committed to theirs. */
export async function submitPath(
  seed: number,
  placed: Array<{ x: number; y: number }>,
): Promise<GoalVerdict | null> {
  return gradeGoal(seed, placed)
}
