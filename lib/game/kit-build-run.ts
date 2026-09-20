export type PartKind =
  | 'base'
  | 'secondary'
  | 'pattern'
  | 'collar'
  | 'sleeve'
  | 'maker'
  | 'sponsor'
  | 'crest'

export const PART_ORDER: readonly PartKind[] = [
  'base',
  'secondary',
  'pattern',
  'collar',
  'sleeve',
  'maker',
  'sponsor',
  'crest',
]

export const PART_LABEL: Record<PartKind, string> = {
  base: 'צבע בסיס',
  secondary: 'צבע משני',
  pattern: 'עיצוב',
  collar: 'צווארון',
  sleeve: 'שרוולים',
  maker: 'לוגו מלבישה',
  sponsor: 'ספונסר',
  crest: 'סמל',
}

export const KIT_ROUND = 3
export const PART_POINTS = 25
export const PERFECT_BONUS = 75
export const KIT_HINT_PENALTY = 25
