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
/** Kept for compatibility with old callers. V5 grading uses PART_WEIGHT. */
export const PART_POINTS = 12.5
export const PART_WEIGHT: Record<PartKind, number> = {
  base: 10,
  secondary: 7,
  pattern: 15,
  collar: 10,
  sleeve: 10,
  maker: 13,
  sponsor: 18,
  crest: 17,
}
export const PERFECT_BONUS = 15
export const KIT_HINT_PENALTY = 8

export type KitDifficulty = 'warmup' | 'memory' | 'expert'
export const DIFFICULTY_OPTIONS: Record<KitDifficulty, number> = {
  warmup: 3,
  memory: 4,
  expert: 5,
}

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
  difficulty: KitDifficulty
  optionCount: number
  drawers: { kind: PartKind; parts: KitPart[] }[]
}

export type PartVerdict = {
  kind: PartKind
  correct: boolean
  chosen: string | null
  truth: string
  points: number
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
  difficulty: KitDifficulty
}

export type KitHintKind = 'whisper' | 'detail' | 'front'
export type KitHintAnswer = { kind: KitHintKind; textHe: string; penalty: number }
