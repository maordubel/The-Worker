'use server'

import { gradeKit, type KitVerdictRun } from '@/lib/game/kitRun'

/** Server authority: the season is derived here from the seed, never sent ahead. */
export async function submitKitGuess(
  seed: number,
  index: number,
  answer: string,
): Promise<KitVerdictRun | null> {
  return gradeKit(seed, index, answer)
}
