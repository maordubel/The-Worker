import 'server-only'

import { archive } from '@/lib/game/archive'
import { kitAssemblySeasons } from './assembly'
import {
  DEFAULT_SPEC,
  type CollarId,
  type KitColour,
  type KitSpec,
  type KitVariant,
  type NamesetId,
  type PatternId,
  type SleeveId,
} from './spec'

export type SeasonKit = {
  seasonLabel: string
  variant: KitVariant
  noteHe: string
  spec: KitSpec
  sourceTitle: string
  sourceUrl: string | null
  confidence: number
}

function crestForSeason(seasonLabel: string): string | null {
  const year = Number(seasonLabel.slice(0, 4))
  if (!Number.isFinite(year)) return null
  const containing = archive.crests
    .filter((row) => year >= row.fromYear && (row.toYear === null || year <= row.toYear))
    .sort((a, b) => b.fromYear - a.fromYear)
  const withImage = containing.find((row) => row.imageKey !== null)
  if (withImage) return withImage.imageKey
  const earlier = archive.crests
    .filter((row) => row.fromYear <= year && row.imageKey !== null)
    .sort((a, b) => b.fromYear - a.fromYear)[0]
  return earlier?.imageKey ?? null
}

function archiveSeasonKits(): SeasonKit[] {
  return archive.kitDesigns.map((row) => ({
    seasonLabel: row.seasonLabel,
    variant: row.variant,
    noteHe: row.noteHe,
    sourceTitle: row.sourceTitle,
    sourceUrl: row.sourceUrl,
    confidence: row.confidence,
    spec: {
      ...DEFAULT_SPEC,
      seasonLabel: row.seasonLabel,
      variant: row.variant,
      base: row.base as KitColour,
      pattern: row.pattern as PatternId,
      patternInk: row.patternInk as KitColour,
      sleeves: row.sleeves as SleeveId,
      sleeveInk: row.sleeveInk as KitColour,
      collar: row.collar as CollarId,
      collarInk: row.collarInk as KitColour,
      sponsorHe: row.sponsorHe,
      makerHe: row.makerHe,
      nameset: DEFAULT_SPEC.nameset as NamesetId,
      number: null,
      shorts: row.shorts as KitColour,
      socks: row.socks as KitColour,
      crestKey: crestForSeason(row.seasonLabel),
    },
  }))
}

/**
 * High-fidelity masters supplied later than the original archive are first-class season
 * records, not Royal-Rumble-only exceptions. Gate 4, Gate 5 and every future kit surface
 * therefore receive the same 1985/86 and 2009/10 facts automatically.
 */
function assemblySeasonKits(): SeasonKit[] {
  return kitAssemblySeasons().map((row) => ({
    seasonLabel: row.seasonLabel,
    variant: row.variant,
    noteHe: row.noteHe,
    sourceTitle: row.sourceTitle,
    sourceUrl: row.sourceUrl,
    confidence: row.confidence,
    spec: {
      ...DEFAULT_SPEC,
      ...row.spec,
      seasonLabel: row.seasonLabel,
      variant: row.variant,
      crestKey: row.spec.crestKey ?? crestForSeason(row.seasonLabel),
      number: null,
    },
  }))
}

export function seasonKits(): SeasonKit[] {
  const merged = new Map<string, SeasonKit>()
  for (const kit of archiveSeasonKits()) merged.set(`${kit.seasonLabel}:${kit.variant}`, kit)
  // A later supplied master wins over an older generic reconstruction of the same kit.
  for (const kit of assemblySeasonKits()) merged.set(`${kit.seasonLabel}:${kit.variant}`, kit)
  return [...merged.values()]
}

export function homeKits(): SeasonKit[] {
  return seasonKits()
    .filter((kit) => kit.variant === 'home')
    .sort((a, b) => b.seasonLabel.localeCompare(a.seasonLabel))
}

export function kitForSeason(seasonLabel: string): SeasonKit | null {
  return seasonKits().find((kit) => kit.seasonLabel === seasonLabel && kit.variant === 'home') ?? null
}
