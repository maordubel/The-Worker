import 'server-only'

import { archive, nameOf } from './archive'
import { currentSeasonStartYear, seasonsInSpell, spellCoversSeason } from './seasons'

/**
 * Kit data. A kit is a vector SPEC, never a photograph: it renders as flat SVG, so it
 * carries no image rights, compares cleanly across seasons, and can be built by a
 * player. These colour values are archive content, not interface chrome — which is why
 * they live here and not in a component.
 */

/** Follows the KitComponent / KitDesign schema Maor supplied. */
export type KitPattern =
  | 'solid'
  | 'stripes_vertical'
  | 'stripes_horizontal'
  | 'chevron'
  | 'checkered'
  | 'sash'

export type KitCollar = 'crew' | 'v' | 'polo'

export type KitComponent = {
  base: string
  secondary: string
  accent: string
  pattern: KitPattern
}

export type KitSpec = {
  jersey: KitComponent
  shorts: KitComponent
  socks: KitComponent
  collar: KitCollar
  longSleeve: boolean
  number: string
  numberColour: string
}

export const KIT_PATTERNS: KitPattern[] = [
  'solid',
  'stripes_vertical',
  'stripes_horizontal',
  'chevron',
  'checkered',
  'sash',
]

/** The only palette a Hapoel kit may use. Named, so the UI never types a hex. */
export const KIT_COLOURS: Record<string, string> = {
  אדום: '#CE1410',
  לבן: '#F7F5F0',
  שחור: '#121110',
  כחול: '#14357E',
  בטון: '#A9A49B',
}

export const KIT_COLOUR_NAMES = Object.keys(KIT_COLOURS)

/** The fallback when a name does not resolve — the club colour, never an empty fill. */
export const DEFAULT_KIT_COLOUR = KIT_COLOUR_NAMES[0] as string

export const DEFAULT_KIT: KitSpec = {
  jersey: { base: 'אדום', secondary: 'לבן', accent: 'לבן', pattern: 'solid' },
  shorts: { base: 'לבן', secondary: 'אדום', accent: 'אדום', pattern: 'solid' },
  socks: { base: 'אדום', secondary: 'לבן', accent: 'לבן', pattern: 'stripes_horizontal' },
  collar: 'crew',
  longSleeve: false,
  number: '10',
  numberColour: 'לבן',
}

export type SeasonKit = {
  season: string
  maker: string
  /** one entry per competition-scoped deal; `competition` null = all competitions */
  sponsors: Array<{ name: string; competition: string | null; noteHe: string | null }>
  sourceTitle: string
  sourceUrl: string | null
}

/** Seasons with a verified maker, newest first — the strip the kit screen scrolls. */
export function verifiedKitSeasons(): SeasonKit[] {
  const openThrough = currentSeasonStartYear()

  // One row per season, not per supply spell. A spell is the sourced fact ("Umbro,
  // 2006/07 to 2010/11"), but a season is what a sponsor attaches to — 2010/11 sits
  // in the middle of the Umbro spell and carries two different sponsors.
  const rows = new Map<string, SeasonKit>()

  for (const supply of archive.kitSupply) {
    for (const season of seasonsInSpell(supply, openThrough)) {
      // First spell wins a contested season; the archive holds no overlaps, and
      // inventing a resolution here would be the pipeline picking a winner.
      if (rows.has(season)) continue
      rows.set(season, {
        season,
        maker: nameOf.manufacturer(supply.manufacturerSlug),
        sponsors: archive.sponsorDeals
          .filter((deal) => spellCoversSeason(deal, season))
          .map((deal) => ({
            name: nameOf.sponsor(deal.sponsorSlug),
            competition: deal.competitionSlug
              ? nameOf.competition(deal.competitionSlug)
              : null,
            noteHe: deal.noteHe ?? null,
          })),
        sourceTitle: supply.sourceTitle,
        sourceUrl: supply.sourceUrl,
      })
    }
  }

  return [...rows.values()].sort((a, b) => b.season.localeCompare(a.season))
}
