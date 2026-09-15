'use server'

import { gradeInsert, type InsertVerdict } from '@/lib/game/timeline'

/**
 * Server authority. The date of the card in hand is derived here from the seed and
 * never travels to the client before it is earned; the board that comes back holds
 * only cards that have already been resolved.
 */
export async function submitInsert(
  seed: number,
  placed: number,
  slot: number,
  cursor = 0,
): Promise<InsertVerdict | null> {
  // A round is addressed by seed AND cursor once rotation is on; grading has to
  // re-derive with both or it grades a different deal than the one on screen.
  return gradeInsert(seed, placed, slot, cursor)
}
