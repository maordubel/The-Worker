'use server'

import { gradeCrest, type CrestVerdict } from '@/lib/game/crestRun'

/** Server authority: the answer is derived from the seed, never sent ahead. */
export async function submitCrest(
  seed: number,
  index: number,
  answer: string,
): Promise<CrestVerdict | null> {
  return gradeCrest(seed, index, answer)
}
