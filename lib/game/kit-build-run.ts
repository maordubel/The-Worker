/**
 * Gate 4 client constants. Keep archive/server code out of the browser bundle.
 */
export type PartKind =
  | 'base'
  | 'secondary'
  | 'pattern'
  | 'collar'
  | 'sleeve'
  | 'maker'
  | 'sponsor'

export const PART_ORDER: readonly PartKind[] = [
  'base',
  'secondary',
  'pattern',
  'collar',
  'sleeve',
  'maker',
  'sponsor',
] as const

export const PART_POINTS = 40
export const PERFECT_BONUS = 100
export const KIT_ROUND = 5
export const KIT_HINT_PENALTY = 20
