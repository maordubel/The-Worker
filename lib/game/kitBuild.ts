import 'server-only'

import { createHash } from 'node:crypto'

import { positionOf, takeFrom } from '@/lib/rotation/deck'
import { rng, shuffle } from './archive'
import { archiveShirts } from '@/lib/kit/archive'
import { historicalMasterFor } from '@/lib/kit/assembly'
import { seasonKits, type SeasonKit } from '@/lib/kit/seasons'
import {
  COLLARS,
  COLOUR_NAME,
  PATTERNS,
  SLEEVES,
  type CollarId,
  type KitColour,
  type KitSpec,
  type PatternId,
  type SleeveId,
} from '@/lib/kit/spec'
import {
  KIT_HINT_PENALTY,
  KIT_ROUND,
  PART_ORDER,
  PART_POINTS,
  PERFECT_BONUS,
  type PartKind,
} from './kit-build-run'

export {
  KIT_HINT_PENALTY,
  KIT_ROUND,
  PART_ORDER,
  PART_POINTS,
  PERFECT_BONUS,
  type PartKind,
} from './kit-build-run'

const OPTIONS = 3

export type KitPart = {
  id: string
  kind: PartKind
  labelHe: string
  patch: Partial<KitSpec>
}

export type KitPuzzle = {
  id: string
  seasonLabel: string
  variant: 'home' | 'away' | 'third'
  blank: KitSpec
  crestKey: string | null
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

function partId(kind: string, signature: string): string {
  return `${kind}-${createHash('sha256').update(`${kind}:${signature}`).digest('hex').slice(0, 10)}`
}

function labelFrom<T extends string>(rows: readonly { id: T; he: string }[], id: T): string {
  return rows.find((row) => row.id === id)?.he ?? id
}

function basePart(spec: KitSpec): KitPart {
  return { id: partId('base', spec.base), kind: 'base', labelHe: COLOUR_NAME[spec.base], patch: { base: spec.base } }
}
function secondaryPart(spec: KitSpec): KitPart {
  return { id: partId('secondary', spec.patternInk), kind: 'secondary', labelHe: COLOUR_NAME[spec.patternInk], patch: { patternInk: spec.patternInk } }
}
function patternPart(spec: KitSpec): KitPart {
  return { id: partId('pattern', spec.pattern), kind: 'pattern', labelHe: labelFrom(PATTERNS, spec.pattern), patch: { pattern: spec.pattern } }
}
function collarPart(spec: KitSpec): KitPart {
  const signature = `${spec.collar}|${spec.collarInk}`
  return { id: partId('collar', signature), kind: 'collar', labelHe: `${labelFrom(COLLARS, spec.collar)} · ${COLOUR_NAME[spec.collarInk]}`, patch: { collar: spec.collar, collarInk: spec.collarInk } }
}
function sleevePart(spec: KitSpec): KitPart {
  const signature = `${spec.sleeves}|${spec.sleeveInk}`
  return { id: partId('sleeve', signature), kind: 'sleeve', labelHe: `${labelFrom(SLEEVES, spec.sleeves)} · ${COLOUR_NAME[spec.sleeveInk]}`, patch: { sleeves: spec.sleeves, sleeveInk: spec.sleeveInk } }
}
function sponsorPart(spec: KitSpec): KitPart | null {
  if (!spec.sponsorHe) return null
  return { id: partId('sponsor', spec.sponsorHe), kind: 'sponsor', labelHe: spec.sponsorHe, patch: { sponsorHe: spec.sponsorHe } }
}
function makerPart(spec: KitSpec): KitPart | null {
  if (!spec.makerHe) return null
  return { id: partId('maker', spec.makerHe), kind: 'maker', labelHe: spec.makerHe, patch: { makerHe: spec.makerHe } }
}

function partsOf(kit: SeasonKit): Partial<Record<PartKind, KitPart>> {
  return { base: basePart(kit.spec), secondary: secondaryPart(kit.spec), pattern: patternPart(kit.spec), collar: collarPart(kit.spec), sleeve: sleevePart(kit.spec), maker: makerPart(kit.spec) ?? undefined, sponsor: sponsorPart(kit.spec) ?? undefined }
}

function blankOf(spec: KitSpec): KitSpec {
  return { ...spec, base: 'paper' as KitColour, pattern: 'solid' as PatternId, patternInk: 'ink' as KitColour, sleeves: 'plain' as SleeveId, sleeveInk: 'paper' as KitColour, collar: 'crew' as CollarId, collarInk: 'paper' as KitColour, sponsorHe: null, makerHe: null, crestKey: null }
}

function eligible(): SeasonKit[] {
  return seasonKits().filter((kit) => kit.spec.sponsorHe !== null && kit.spec.makerHe !== null && kit.spec.crestKey !== null)
}
export function kitPuzzleCount(): number { return eligible().length }

function puzzles(seed: number, cursor: number): { puzzle: KitPuzzle; truth: Record<PartKind, string>; kit: SeasonKit }[] {
  const all = eligible()
  const at = positionOf(seed, cursor, all.length, KIT_ROUND)
  const random = rng(at.seed)
  const pool = new Map<PartKind, Map<string, KitPart>>()
  for (const kind of PART_ORDER) pool.set(kind, new Map())
  for (const kit of all) {
    const parts = partsOf(kit)
    for (const kind of PART_ORDER) { const part = parts[kind]; if (part) pool.get(kind)?.set(part.id, part) }
  }
  return takeFrom(shuffle([...all], random), at.slot * KIT_ROUND, KIT_ROUND).map((kit) => {
    const parts = partsOf(kit)
    const truth = {} as Record<PartKind, string>
    const drawers: KitPuzzle['drawers'] = []
    for (const kind of PART_ORDER) {
      const right = parts[kind] as KitPart
      truth[kind] = right.id
      const others = shuffle([...(pool.get(kind)?.values() ?? [])].filter((part) => part.id !== right.id), random).slice(0, OPTIONS - 1)
      drawers.push({ kind, parts: shuffle([right, ...others], random) })
    }
    return { kit, truth, puzzle: { id: partId('kit', `${kit.seasonLabel}:${kit.variant}`), seasonLabel: kit.seasonLabel, variant: kit.variant, blank: blankOf(kit.spec), crestKey: kit.spec.crestKey, drawers } }
  })
}

export function dealKitRound(seed: number, cursor = 0): KitPuzzle[] { return puzzles(seed, cursor).map((row) => row.puzzle) }

function realEvidence(kit: SeasonKit): { realSrc: string | null; sourceTitle: string; sourceUrl: string | null } {
  const exact = archiveShirts().find((shirt) => shirt.seasonLabel === kit.seasonLabel && shirt.variant === kit.variant)
  if (exact) return { realSrc: exact.src, sourceTitle: exact.sourceTitle, sourceUrl: exact.sourceUrl }
  return { realSrc: historicalMasterFor(kit.seasonLabel, kit.variant) ?? historicalMasterFor(kit.seasonLabel, kit.variant === 'third' ? 'away' : kit.variant), sourceTitle: kit.sourceTitle, sourceUrl: kit.sourceUrl }
}

export function gradeKitPuzzle(seed: number, index: number, placed: Partial<Record<PartKind, string>>, cursor = 0, hintsUsed = 0): KitVerdict | null {
  const row = puzzles(seed, cursor)[index]
  if (!row) return null
  const parts: PartVerdict[] = PART_ORDER.map((kind) => ({ kind, correct: placed[kind] === row.truth[kind], chosen: placed[kind] ?? null, truth: row.truth[kind] }))
  const right = parts.filter((part) => part.correct).length
  const perfect = right === PART_ORDER.length
  const baseScore = right * PART_POINTS + (perfect ? PERFECT_BONUS : 0)
  const used = Math.max(0, Math.min(3, Math.floor(hintsUsed)))
  return { parts, right, perfect, baseScore, hintsUsed: used, score: Math.max(0, baseScore - used * KIT_HINT_PENALTY), answer: row.kit.spec, seasonLabel: row.kit.seasonLabel, variant: row.kit.variant, noteHe: row.kit.noteHe, ...realEvidence(row.kit) }
}

export function kitHint(seed: number, index: number, kind: KitHintKind, cursor = 0): KitHintAnswer | null {
  const row = puzzles(seed, cursor)[index]
  if (!row) return null
  if (kind === 'whisper') return { kind, textHe: 'תחשוב קודם על הזהות. את העונה מזהים בפרטים הקטנים.', penalty: KIT_HINT_PENALTY }
  if (kind === 'detail') {
    const chooseCollar = (seed + cursor + index) % 2 === 0
    return { kind, textHe: chooseCollar ? `הצווארון היה ${labelFrom(COLLARS, row.kit.spec.collar)}.` : `הדגם היה ${labelFrom(PATTERNS, row.kit.spec.pattern)}.`, penalty: KIT_HINT_PENALTY }
  }
  return { kind, textHe: (seed + cursor + index) % 2 === 0 ? `היצרן: ${row.kit.spec.makerHe ?? 'לא מתועד'}.` : `הספונסר בחזית: ${row.kit.spec.sponsorHe ?? 'ללא ספונסר'}.`, penalty: KIT_HINT_PENALTY }
}
