/**
 * אזורי המגרש — the grid שחזור השער is played on.
 *
 * The first version asked for a PIXEL: tap the exact spot the ball went, graded on a
 * distance tolerance. That was the wrong ask twice over. A match report says "מ-40 מטר
 * ליד שער 7", never a coordinate, so a pixel target invents a precision the source does
 * not have; and on a phone a fingertip covers about 44px, so the player was being graded
 * on aim rather than on knowledge.
 *
 * So the pitch is twenty zones — five columns across, four bands of depth — off the Goal
 * Rebuild handoff. A tap can no longer be nearly right by accident, and "you had the
 * depth, not the side" becomes something the game can actually SAY.
 *
 * Pure and client-safe: `lib/game/goal.ts` reads the archive and is server-only.
 */

export const COLS = ['A', 'B', 'C', 'D', 'E'] as const
export const ROWS = [1, 2, 3, 4] as const
export type ZoneId = string

/** Every zone, reading order: the row nearest the goal first. */
export const ZONES: ZoneId[] = ROWS.flatMap((row) => COLS.map((col) => `${col}${row}`))

export function isZone(id: string): boolean {
  return ZONES.includes(id)
}

/** Column index 0..4 and depth index 0..3, or null for anything malformed. */
export function zoneParts(id: ZoneId): { col: number; row: number } | null {
  const col = COLS.indexOf(id[0] as (typeof COLS)[number])
  const row = Number(id.slice(1)) - 1
  if (col < 0 || !Number.isInteger(row) || row < 0 || row > 3) return null
  return { col, row }
}

/** Geometry of the handoff pitch: viewBox 0 0 300 400, zones 55×82 from (13,12). */
export const PITCH = { w: 300, h: 400, x0: 13, y0: 12, cw: 55, ch: 82 } as const

export function zoneRect(id: ZoneId): { x: number; y: number; w: number; h: number } | null {
  const parts = zoneParts(id)
  if (!parts) return null
  return {
    x: PITCH.x0 + parts.col * PITCH.cw,
    y: PITCH.y0 + parts.row * PITCH.ch,
    w: PITCH.cw,
    h: PITCH.ch,
  }
}

export function zoneCenter(id: ZoneId): { x: number; y: number } | null {
  const rect = zoneRect(id)
  return rect ? { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 } : null
}

export type Grade = 'hit' | 'near' | 'miss'

/**
 * How a placement scores.
 *
 * `near` is the honest middle the old tolerance was groping for: one zone out is not
 * knowing the move, but it is not ignorance either — "העומק נכון, הצד לא" is a real
 * thing to be told, and it costs points without costing a life. Diagonals count as near
 * too; a diagonal neighbour is still touching the right square.
 */
export function gradeZone(picked: ZoneId | undefined, truth: ZoneId): Grade {
  if (!picked) return 'miss'
  if (picked === truth) return 'hit'
  const a = zoneParts(picked)
  const b = zoneParts(truth)
  if (!a || !b) return 'miss'
  return Math.abs(a.col - b.col) <= 1 && Math.abs(a.row - b.row) <= 1 ? 'near' : 'miss'
}

/** Why a placement missed, as a message key — the verdict has to say something real. */
export function reasonKey(picked: ZoneId | undefined, truth: ZoneId): string {
  if (!picked) return 'goal.reason.unplaced'
  if (picked === truth) return 'goal.reason.exact'
  const a = zoneParts(picked)
  const b = zoneParts(truth)
  if (!a || !b) return 'goal.reason.far'
  if (a.row === b.row) return 'goal.reason.depthRight'
  if (a.col === b.col) return 'goal.reason.sideRight'
  return gradeZone(picked, truth) === 'near' ? 'goal.reason.close' : 'goal.reason.far'
}

/** Three goals to a run, so a run is three whole moves and not twelve loose taps. */
export const GOALS_PER_RUN = 3
/** Seconds for a whole goal, tightening per stage. */
export const GOAL_SECONDS = [34, 27, 21] as const
