import type { KitSpec } from '@/lib/kit/spec'

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

export const KIT_ROUND = 5
export const PART_POINTS = 25
export const PERFECT_BONUS = 75
export const KIT_HINT_PENALTY = 25


export type KitPart = {
  id: string
  kind: PartKind
  labelHe: string
  patch: Partial<KitSpec>
  hasReference: boolean
}

export type KitPuzzle = {
  id: string
  seasonLabel: string
  variant: 'home' | 'away' | 'third'
  blank: KitSpec
  drawers: { kind: PartKind; parts: KitPart[] }[]
}

export type PartVerdict = {
  kind: PartKind
  correct: boolean
  chosen: string | null
  truth: string
}

export type KitVerdict = {
  parts: PartVerdict[]
  right: number
  perfect: boolean
  score: number
  baseScore: number
  hintsUsed: number
  answer: KitSpec
  seasonLabel: string
  variant: 'home' | 'away' | 'third'
  noteHe: string
  realSrc: string | null
  sourceTitle: string
  sourceUrl: string | null
}

export type KitHintKind = 'whisper' | 'detail' | 'front'
export type KitHintAnswer = { kind: KitHintKind; textHe: string; penalty: number }
