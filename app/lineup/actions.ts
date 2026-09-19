'use server'

import { coachNote, gradeLineup } from '@/lib/game/lineup'
import type { CoachNote, LineupVerdict } from '@/lib/game/lineup-sheet'

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

/**
 * פתק מהמאמן — the hint, and it crosses the wire for exactly the same reason the grade
 * does.
 *
 * A coach's note is a count over the verified XI: how many starters are still hanging
 * up, how many men on the board were on the bench that night, how many are sitting in
 * the right line. Every one of those is derived from the answer, so every one of them
 * has to be computed where the answer lives. What comes back is a kind and a number —
 * never a name, never a slot — and the screen turns it into a sentence out of
 * `messages/he.json`.
 */
export async function askCoach(
  seed: number,
  picks: Record<string, string | null>,
  cursor = 0,
  index = 0,
): Promise<CoachNote | null> {
  return coachNote(seed, picks, cursor, index)
}
