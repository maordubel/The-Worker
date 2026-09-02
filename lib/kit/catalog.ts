import 'server-only'

import { crestMark } from './crestMarks'
import { seasonKits, type SeasonKit } from './seasons'
import { COLOUR_NAME, PATTERNS, type KitSpec } from './spec'

/**
 * הקטלוג — every shirt the archive can draw, as the collection reads it.
 *
 * The mockup's collection screen shows 24 shirts. The archive holds **33**, each read
 * off a photograph Maor supplied, each with its own source and confidence. There was no
 * reason to ship the smaller number: the mockup was drawn before the data existed.
 *
 * This is a read-model (rule 1). It copies nothing — it projects the same
 * `content/manual/kit-designs.json` rows the kit game deals from, adds the labels a card
 * needs, and sorts them the way a wardrobe is read: newest first.
 */

export type CatalogKit = {
  /** `1984/85|home` — the collection's key, and stable */
  key: string
  seasonLabel: string
  variant: 'home' | 'away' | 'third'
  spec: KitSpec
  /** the season's decade, for the filter rail */
  decade: number
  /** what the card prints under the shirt */
  makerHe: string | null
  sponsorHe: string | null
  patternHe: string
  baseHe: string
  crestHe: string | null
  noteHe: string
  sourceTitle: string
  sourceUrl: string | null
  confidence: number
  /** true when the archive knows all five graded parts — i.e. gate 4 can deal it */
  playable: boolean
}

export type Facet = 'all' | 'home' | 'away' | 'third'

function label(kit: SeasonKit): Pick<CatalogKit, 'patternHe' | 'baseHe' | 'crestHe'> {
  return {
    patternHe: PATTERNS.find((row) => row.id === kit.spec.pattern)?.he ?? 'חלק',
    baseHe: COLOUR_NAME[kit.spec.base],
    crestHe: crestMark(kit.spec.crestKey)?.nameHe ?? null,
  }
}

export function kitCatalog(): CatalogKit[] {
  return seasonKits()
    .map((kit) => {
      return {
        key: `${kit.seasonLabel}|${kit.variant}`,
        seasonLabel: kit.seasonLabel,
        variant: kit.variant,
        spec: kit.spec,
        decade: Math.floor(Number(kit.seasonLabel.slice(0, 4)) / 10) * 10,
        makerHe: kit.spec.makerHe,
        sponsorHe: kit.spec.sponsorHe,
        ...label(kit),
        noteHe: kit.noteHe,
        sourceTitle: kit.sourceTitle,
        sourceUrl: kit.sourceUrl,
        confidence: kit.confidence,
        playable:
          kit.spec.sponsorHe !== null && kit.spec.makerHe !== null && kit.spec.crestKey !== null,
      }
    })
    // Newest first — a wardrobe is read from the shirt you wore last.
    .sort((a, b) => b.seasonLabel.localeCompare(a.seasonLabel) || a.variant.localeCompare(b.variant))
}

export function facetCounts(kits: CatalogKit[]): Record<Facet, number> {
  return {
    all: kits.length,
    home: kits.filter((kit) => kit.variant === 'home').length,
    away: kits.filter((kit) => kit.variant === 'away').length,
    third: kits.filter((kit) => kit.variant === 'third').length,
  }
}
