'use server'

import { gradeLineup, type LineupVerdict } from '@/lib/game/lineup'

/** The verified XI stays on the server; only the verdict crosses. */
export async function submitLineup(
  seed: number,
  picks: Record<string, string | null>,
): Promise<LineupVerdict | null> {
  return gradeLineup(seed, picks)
}
