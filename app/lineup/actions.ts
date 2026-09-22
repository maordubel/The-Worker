'use server'

import { coachNote, gradeLineup, type LineupWindow } from '@/lib/game/lineup'
import type { CoachNote, LineupVerdict, Placement } from '@/lib/game/lineup-sheet'

/**
 * The verified XI stays on the server; only the verdict crosses.
 *
 * The board sends what it holds — `{playerId, line, order}` per man, the four bands and
 * nothing else — and the grade is by LINE (players.md §2, Gate 3 V3). A round is
 * addressed by seed AND cursor, so grading re-derives the same deal the screen shows.
 */
export async function submitLineup(
  seed: number,
  placements: Placement[],
  cursor = 0,
  window?: LineupWindow,
): Promise<LineupVerdict | null> {
  // `window` is THE WORKER LIFE's: the same grade, re-derived over the match the life dealt
  return gradeLineup(seed, placements, cursor, cleanWindow(window))
}

/** what a client may send as a window: a year and an opaque match id, nothing else */
function cleanWindow(window?: LineupWindow): LineupWindow | undefined {
  if (!window || !Number.isFinite(window.before)) return undefined
  const pin = typeof window.pin === 'string' && /^m_[0-9a-f]{6,}$/.test(window.pin) ? window.pin : null
  return { before: Math.round(window.before), pin }
}

/**
 * פתק מהמאמן — a count over the verified XI (starters still hanging up, bench men on the
 * board, men in the right band), so it is computed where the answer lives. A kind and a
 * number cross; never a name, never a band.
 */
export async function askCoach(
  seed: number,
  placements: Placement[],
  cursor = 0,
  index = 0,
  window?: LineupWindow,
): Promise<CoachNote | null> {
  return coachNote(seed, placements, cursor, index, cleanWindow(window))
}
