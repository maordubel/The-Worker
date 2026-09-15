'use server'

import { gradeLineup, type LineupVerdict } from '@/lib/game/lineup'

/** The verified XI stays on the server; only the verdict crosses. */
export async function submitLineup(
  seed: number,
  picks: Record<string, string | null>,
  cursor = 0,
): Promise<LineupVerdict | null> {
  // A round is addressed by seed AND cursor once rotation is on; grading has to
  // re-derive with both or it grades a different deal than the one on screen.
  return gradeLineup(seed, picks, cursor)
}
