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
): Promise<InsertVerdict | null> {
  return gradeInsert(seed, placed, slot)
}
