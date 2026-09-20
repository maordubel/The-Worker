import 'server-only'

import { createHash } from 'node:crypto'

import { positionOf, takeFrom } from '@/lib/rotation/deck'
import { rng, shuffle } from './archive'
import { exactArchivePhoto } from '@/lib/kit/archive-dna'
import { historicalMasterFor } from '@/lib/kit/assembly'
import { crestMark } from '@/lib/kit/crestMarks'
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
  /** Stable, opaque and season-free. It is also the key for the archive reference proxy. */
  id: string
  kind: PartKind
  labelHe: string
  patch: Partial<KitSpec>
  /** true only when at least one exactly dated real shirt demonstrates this part */
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

function partId(kind: string, signature: string): string {
  return `${kind}-${createHash('sha256').update(`${kind}:${signature}`).digest('hex').slice(0, 10)}`
}

function labelFrom<T extends string>(rows: readonly { id: T; he: string }[], id: T): string {
  return rows.find((row) => row.id === id)?.he ?? id
}

function rawParts(spec: KitSpec): Partial<Record<PartKind, Omit<KitPart, 'hasReference'>>> {
  const base: Omit<KitPart, 'hasReference'> = {
    id: partId('base', spec.base), kind: 'base', labelHe: COLOUR_NAME[spec.base], patch: { base: spec.base },
  }
  const secondary: Omit<KitPart, 'hasReference'> = {
    id: partId('secondary', spec.patternInk), kind: 'secondary', labelHe: COLOUR_NAME[spec.patternInk], patch: { patternInk: spec.patternInk },
  }
  const pattern: Omit<KitPart, 'hasReference'> = {
    id: partId('pattern', spec.pattern), kind: 'pattern', labelHe: labelFrom(PATTERNS, spec.pattern), patch: { pattern: spec.pattern },
  }
  const collarSignature = `${spec.collar}|${spec.collarInk}`
  const collar: Omit<KitPart, 'hasReference'> = {
    id: partId('collar', collarSignature), kind: 'collar', labelHe: `${labelFrom(COLLARS, spec.collar)} · ${COLOUR_NAME[spec.collarInk]}`, patch: { collar: spec.collar, collarInk: spec.collarInk },
  }
  const sleeveSignature = `${spec.sleeves}|${spec.sleeveInk}`
  const sleeve: Omit<KitPart, 'hasReference'> = {
    id: partId('sleeve', sleeveSignature), kind: 'sleeve', labelHe: `${labelFrom(SLEEVES, spec.sleeves)} · ${COLOUR_NAME[spec.sleeveInk]}`, patch: { sleeves: spec.sleeves, sleeveInk: spec.sleeveInk },
  }
  const maker = spec.makerHe ? {
    id: partId('maker', spec.makerHe), kind: 'maker' as const, labelHe: spec.makerHe, patch: { makerHe: spec.makerHe },
  } : undefined
  const sponsor = spec.sponsorHe ? {
    id: partId('sponsor', spec.sponsorHe), kind: 'sponsor' as const, labelHe: spec.sponsorHe, patch: { sponsorHe: spec.sponsorHe },
  } : undefined
  const mark = crestMark(spec.crestKey)
  const crest = spec.crestKey ? {
    id: partId('crest', spec.crestKey), kind: 'crest' as const, labelHe: mark ? `${mark.nameHe} · ${mark.tellHe}` : 'סמל המועדון', patch: { crestKey: spec.crestKey },
  } : undefined
  return { base, secondary, pattern, collar, sleeve, maker, sponsor, crest }
}

function eligible(): SeasonKit[] {
  return seasonKits().filter(
    (kit) => kit.spec.sponsorHe !== null && kit.spec.makerHe !== null && kit.spec.crestKey !== null,
  )
}

/**
 * Real-photo evidence by opaque part id. Only exact-season archive rows qualify. The URL
 * sent to the browser is `/api/kits/reference/<hash>` — never `1989`, never a source slug.
 */
function referenceMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const kit of eligible()) {
    const photo = exactArchivePhoto(kit.seasonLabel, kit.variant)
    if (!photo) continue
    const parts = rawParts(kit.spec)
    for (const kind of PART_ORDER) {
      const part = parts[kind]
      if (part && !map.has(part.id)) map.set(part.id, photo.src)
    }
  }
  return map
}

function partsOf(kit: SeasonKit, refs = referenceMap()): Partial<Record<PartKind, KitPart>> {
  const raw = rawParts(kit.spec)
  return Object.fromEntries(
    PART_ORDER.flatMap((kind) => {
      const part = raw[kind]
      return part ? [[kind, { ...part, hasReference: refs.has(part.id) }]] : []
    }),
  ) as Partial<Record<PartKind, KitPart>>
}

function blankOf(spec: KitSpec): KitSpec {
  return {
    ...spec,
    base: 'paper' as KitColour,
    pattern: 'solid' as PatternId,
    patternInk: 'ink' as KitColour,
    sleeves: 'plain' as SleeveId,
    sleeveInk: 'paper' as KitColour,
    collar: 'crew' as CollarId,
    collarInk: 'paper' as KitColour,
    sponsorHe: null,
    makerHe: null,
    crestKey: null,
  }
}

export function kitPuzzleCount(): number { return eligible().length }

function puzzles(seed: number, cursor: number): { puzzle: KitPuzzle; truth: Record<PartKind, string>; kit: SeasonKit }[] {
  const all = eligible()
  const at = positionOf(seed, cursor, all.length, KIT_ROUND)
  const random = rng(at.seed)
  const refs = referenceMap()
  const pool = new Map<PartKind, Map<string, KitPart>>()
  for (const kind of PART_ORDER) pool.set(kind, new Map())

  // Prefer a version backed by a real photograph when the same part occurs many times.
  for (const kit of all) {
    const parts = partsOf(kit, refs)
    for (const kind of PART_ORDER) {
      const part = parts[kind]
      if (!part) continue
      const current = pool.get(kind)?.get(part.id)
      if (!current || (!current.hasReference && part.hasReference)) pool.get(kind)?.set(part.id, part)
    }
  }

  return takeFrom(shuffle([...all], random), at.slot * KIT_ROUND, KIT_ROUND).map((kit) => {
    const parts = partsOf(kit, refs)
    const truth = {} as Record<PartKind, string>
    const drawers: KitPuzzle['drawers'] = []
    for (const kind of PART_ORDER) {
      const right = parts[kind] as KitPart
      truth[kind] = right.id
      const others = shuffle(
        [...(pool.get(kind)?.values() ?? [])].filter((part) => part.id !== right.id),
        random,
      ).slice(0, OPTIONS - 1)
      drawers.push({ kind, parts: shuffle([right, ...others], random) })
    }
    return {
      kit,
      truth,
      puzzle: {
        id: partId('kit', `${kit.seasonLabel}:${kit.variant}`),
        seasonLabel: kit.seasonLabel,
        variant: kit.variant,
        blank: blankOf(kit.spec),
        drawers,
      },
    }
  })
}

export function dealKitRound(seed: number, cursor = 0): KitPuzzle[] {
  return puzzles(seed, cursor).map((row) => row.puzzle)
}

export function kitPartReference(token: string): string | null {
  if (!/^[a-z]+-[a-f0-9]{10}$/.test(token)) return null
  return referenceMap().get(token) ?? null
}

function realEvidence(kit: SeasonKit): { realSrc: string | null; sourceTitle: string; sourceUrl: string | null } {
  const exact = exactArchivePhoto(kit.seasonLabel, kit.variant)
  if (exact) return { realSrc: exact.src, sourceTitle: exact.sourceTitle, sourceUrl: exact.sourceUrl }
  return {
    realSrc: historicalMasterFor(kit.seasonLabel, kit.variant) ?? historicalMasterFor(kit.seasonLabel, kit.variant === 'third' ? 'away' : kit.variant),
    sourceTitle: kit.sourceTitle,
    sourceUrl: kit.sourceUrl,
  }
}

export function gradeKitPuzzle(
  seed: number,
  index: number,
  placed: Partial<Record<PartKind, string>>,
  cursor = 0,
  hintsUsed = 0,
): KitVerdict | null {
  const row = puzzles(seed, cursor)[index]
  if (!row) return null
  const parts: PartVerdict[] = PART_ORDER.map((kind) => ({
    kind,
    correct: placed[kind] === row.truth[kind],
    chosen: placed[kind] ?? null,
    truth: row.truth[kind],
  }))
  const right = parts.filter((part) => part.correct).length
  const perfect = right === PART_ORDER.length
  const baseScore = right * PART_POINTS + (perfect ? PERFECT_BONUS : 0)
  const used = Math.max(0, Math.min(3, Math.floor(hintsUsed)))
  return {
    parts,
    right,
    perfect,
    baseScore,
    hintsUsed: used,
    score: Math.max(0, baseScore - used * KIT_HINT_PENALTY),
    answer: row.kit.spec,
    seasonLabel: row.kit.seasonLabel,
    variant: row.kit.variant,
    noteHe: row.kit.noteHe,
    ...realEvidence(row.kit),
  }
}

export function kitHint(seed: number, index: number, kind: KitHintKind, cursor = 0): KitHintAnswer | null {
  const row = puzzles(seed, cursor)[index]
  if (!row) return null
  if (kind === 'whisper') return { kind, textHe: 'תחשוב קודם על הזהות. את העונה מזהים בפרטים הקטנים.', penalty: KIT_HINT_PENALTY }
  if (kind === 'detail') {
    const chooseCollar = (seed + cursor + index) % 2 === 0
    return {
      kind,
      textHe: chooseCollar
        ? `הצווארון היה ${labelFrom(COLLARS, row.kit.spec.collar)}.`
        : `העיצוב היה ${labelFrom(PATTERNS, row.kit.spec.pattern)}.`,
      penalty: KIT_HINT_PENALTY,
    }
  }
  const showCrest = (seed + cursor + index) % 3 === 2
  if (showCrest) return { kind, textHe: `הסמל: ${crestMark(row.kit.spec.crestKey)?.tellHe ?? 'סמל התקופה'}.`, penalty: KIT_HINT_PENALTY }
  return {
    kind,
    textHe: (seed + cursor + index) % 2 === 0
      ? `היצרן: ${row.kit.spec.makerHe ?? 'לא מתועד'}.`
      : `הספונסר בחזית: ${row.kit.spec.sponsorHe ?? 'ללא ספונסר'}.`,
    penalty: KIT_HINT_PENALTY,
  }
}
