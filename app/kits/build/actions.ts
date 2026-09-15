'use server'

import { gradeKitPuzzle, type KitVerdict, type PartKind } from '@/lib/game/kitBuild'

/**
 * The grade happens on the server, from the seed (rule 4).
 *
 * The client is dealt drawers of parts with hashed ids and no marker of which one is
 * right; the answer is never in the payload, so the only way to know is to place a part
 * and ask. `placed` is a map of kind → part id, which is exactly what the table holds.
 */
export async function submitKit(
  seed: number,
  index: number,
  placed: Partial<Record<PartKind, string>>,
  cursor = 0,
): Promise<KitVerdict | null> {
  // A round is addressed by seed AND cursor once rotation is on; grading has to
  // re-derive with both or it grades a different deal than the one on screen.
  return gradeKitPuzzle(seed, index, placed, cursor)
}
