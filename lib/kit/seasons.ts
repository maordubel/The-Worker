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

/**
 * Which crest a season's shirt wears.
 *
 * Resolved from the crest timeline rather than typed on every kit row: a season belongs
 * to exactly one crest era, and duplicating that mapping into 33 kit rows would be 33
 * chances to get it wrong. `1978/79` → the worker mark, `2002/03` → the one with KETER
 * inside it, `2008/09` → the badge that said 1927, `2018/19` → the badge that says 1923.
 */
function crestForSeason(seasonLabel: string): string | null {
  const year = Number(seasonLabel.slice(0, 4))
  if (!Number.isFinite(year)) return null
  // The club's own stages share boundary years — 2007—2008 and 2008—2015 both contain
  // 2008 — so `find` would return whichever came first in the file and the 2008/09
  // shirt would wear no crest at all. Take the LATEST era that contains the season, and
  // fall back to the most recent era before it that actually has a variant.
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
      // Lettered, never traced. Naming the maker of a kit is a fact about the kit;
      // reproducing another company's trademark artwork is a different thing, and this
      // project letters the name in its own Latin face instead.
      makerHe: row.makerHe,
      nameset: DEFAULT_SPEC.nameset as NamesetId,
      number: null,
      shorts: row.shorts as KitColour,
      socks: row.socks as KitColour,
      crestKey: crestForSeason(row.seasonLabel),
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
