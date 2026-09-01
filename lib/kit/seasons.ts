import 'server-only'

import { archive } from '@/lib/game/archive'
import { DEFAULT_SPEC, type CollarId, type KitColour, type KitSpec, type NamesetId, type PatternId, type SleeveId } from './spec'

/**
 * ארון החולצות — the archive's own kits, as specs.
 *
 * This closes the oldest hole in the project. CLAUDE.md carried a line for weeks saying
 * no source stated the collar, sleeve or pattern of any given season, so the drawn
 * figure wore the club's colours plain and the screen admitted it. Maor's reference
 * images changed that: `content/manual/kit-designs.json` now records 32 season kits,
 * every field read off a picture, and this module turns them into the same `KitSpec`
 * the designer and the story card already speak.
 *
 * Which means the rack in the designer is now the club's actual history rather than a
 * set of house presets, and "rebuild the 1993 shirt" is a question with a real answer.
 */

export type SeasonKit = {
  seasonLabel: string
  variant: 'home' | 'away' | 'third'
  noteHe: string
  spec: KitSpec
}

export function seasonKits(): SeasonKit[] {
  return archive.kitDesigns.map((row) => ({
    seasonLabel: row.seasonLabel,
    variant: row.variant,
    noteHe: row.noteHe,
    spec: {
      ...DEFAULT_SPEC,
      seasonLabel: row.seasonLabel,
      variant: row.variant === 'third' ? 'away' : row.variant,
      base: row.base as KitColour,
      pattern: row.pattern as PatternId,
      patternInk: row.patternInk as KitColour,
      sleeves: row.sleeves as SleeveId,
      sleeveInk: row.sleeveInk as KitColour,
      collar: row.collar as CollarId,
      collarInk: row.collarInk as KitColour,
      sponsorHe: row.sponsorHe,
      makerHe: null,
      nameset: DEFAULT_SPEC.nameset as NamesetId,
      number: null,
      shorts: row.shorts as KitColour,
      socks: row.socks as KitColour,
    },
  }))
}

/** The home kits, newest first — what the rack shows. */
export function homeKits(): SeasonKit[] {
  return seasonKits()
    .filter((kit) => kit.variant === 'home')
    .sort((a, b) => b.seasonLabel.localeCompare(a.seasonLabel))
}

export function kitForSeason(seasonLabel: string): SeasonKit | null {
  return seasonKits().find((kit) => kit.seasonLabel === seasonLabel && kit.variant === 'home') ?? null
}
