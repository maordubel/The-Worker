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
  DIFFICULTY_OPTIONS,
  KIT_HINT_PENALTY,
  KIT_ROUND,
  PART_ORDER,
  PART_POINTS,
  PART_WEIGHT,
  PERFECT_BONUS,
  type KitDifficulty,
  type PartKind,
} from './kit-build-run'

export {
  DIFFICULTY_OPTIONS,
  KIT_HINT_PENALTY,
  KIT_ROUND,
  PART_ORDER,
  PART_POINTS,
  PART_WEIGHT,
  PERFECT_BONUS,
  type PartKind,
} from './kit-build-run'

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

function seasonYear(label: string): number {
  const year = Number(label.slice(0, 4))
  return Number.isFinite(year) ? year : 9999
}

/**
 * Distractors are memory challenges, not random trivia:
 * prefer the same variant and neighboring seasons so every wrong answer is plausible.
 */
function neighborKits(target: SeasonKit, all: SeasonKit[]): SeasonKit[] {
  const year = seasonYear(target.seasonLabel)
  return all
    .filter((row) => row !== target)
    .sort((a, b) => {
      const variantA = a.variant === target.variant ? 0 : 10
      const variantB = b.variant === target.variant ? 0 : 10
      return (Math.abs(seasonYear(a.seasonLabel) - year) + variantA) - (Math.abs(seasonYear(b.seasonLabel) - year) + variantB)
    })
}

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

function difficultyFor(index: number): KitDifficulty {
  if (index === 0) return 'warmup'
  if (index === KIT_ROUND - 1) return 'expert'
  return 'memory'
}

function optionSet(
  target: SeasonKit,
  kind: PartKind,
  right: KitPart,
  all: SeasonKit[],
  refs: Map<string, string>,
  count: number,
  random: () => number,
): KitPart[] {
  const seen = new Set([right.id])
  const plausible: KitPart[] = []
  for (const kit of neighborKits(target, all)) {
    const part = partsOf(kit, refs)[kind]
    if (!part || seen.has(part.id)) continue
    seen.add(part.id)
    plausible.push(part)
    if (plausible.length >= count - 1) break
  }

  if (plausible.length < count - 1) {
    const fallback: KitPart[] = []
    for (const kit of all) {
      const part = partsOf(kit, refs)[kind]
      if (!part || seen.has(part.id)) continue
      seen.add(part.id)
      fallback.push(part)
    }
    plausible.push(...shuffle(fallback, random).slice(0, count - 1 - plausible.length))
  }
  return shuffle([right, ...plausible.slice(0, count - 1)], random)
}

function puzzles(seed: number, cursor: number): { puzzle: KitPuzzle; truth: Record<PartKind, string>; kit: SeasonKit }[] {
  const all = eligible()
  const at = positionOf(seed, cursor, all.length, KIT_ROUND)
  const random = rng(at.seed)
  const refs = referenceMap()
  const round = takeFrom(shuffle([...all], random), at.slot * KIT_ROUND, KIT_ROUND)

  return round.map((kit, index) => {
    const parts = partsOf(kit, refs)
    const truth = {} as Record<PartKind, string>
    const drawers: KitPuzzle['drawers'] = []
    const difficulty = difficultyFor(index)
    const optionCount = DIFFICULTY_OPTIONS[difficulty]

    for (const kind of PART_ORDER) {
      const right = parts[kind] as KitPart
      truth[kind] = right.id
      drawers.push({ kind, parts: optionSet(kit, kind, right, all, refs, optionCount, random) })
    }

    return {
      kit,
      truth,
      puzzle: {
        id: partId('kit', `${kit.seasonLabel}:${kit.variant}`),
        seasonLabel: kit.seasonLabel,
        variant: kit.variant,
        blank: blankOf(kit.spec),
        difficulty,
        optionCount,
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
    points: placed[kind] === row.truth[kind] ? PART_WEIGHT[kind] : 0,
  }))
  const right = parts.filter((part) => part.correct).length
  const perfect = right === PART_ORDER.length
  const baseScore = parts.reduce((sum, part) => sum + part.points, 0) + (perfect ? PERFECT_BONUS : 0)
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
    difficulty: row.puzzle.difficulty,
    ...realEvidence(row.kit),
  }
}

export function kitHint(seed: number, index: number, kind: KitHintKind, cursor = 0): KitHintAnswer | null {
  const row = puzzles(seed, cursor)[index]
  if (!row) return null
  if (kind === 'whisper') return { kind, textHe: 'אל תחפש את השנה. חפש את התקופה: גזרה, צווארון, מלבישה ואז החזית.', penalty: KIT_HINT_PENALTY }
  if (kind === 'detail') {
    const chooseCollar = (seed + cursor + index) % 2 === 0
    return {
      kind,
      textHe: chooseCollar
        ? `הצווארון היה ${labelFrom(COLLARS, row.kit.spec.collar)}.`
        : `מבנה החולצה היה ${labelFrom(PATTERNS, row.kit.spec.pattern)}.`,
      penalty: KIT_HINT_PENALTY,
    }
  }
  const showCrest = (seed + cursor + index) % 3 === 2
  if (showCrest) return { kind, textHe: `שים לב לגרסת הסמל: ${crestMark(row.kit.spec.crestKey)?.tellHe ?? 'סמל התקופה'}.`, penalty: KIT_HINT_PENALTY }
  return {
    kind,
    textHe: (seed + cursor + index) % 2 === 0
      ? `המלבישה: ${row.kit.spec.makerHe ?? 'לא מתועד'}.`
      : `הספונסר בחזית: ${row.kit.spec.sponsorHe ?? 'ללא ספונסר'}.`,
    penalty: KIT_HINT_PENALTY,
  }
}
