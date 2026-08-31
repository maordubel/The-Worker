import 'server-only'

import { archive, nameOf } from './archive'

/**
 * Kit data. A kit is a vector SPEC, never a photograph: it renders as flat SVG, so it
 * carries no image rights, compares cleanly across seasons, and can be built by a
 * player. These colour values are archive content, not interface chrome — which is why
 * they live here and not in a component.
 */

export type KitPattern = 'solid' | 'stripes' | 'hoops' | 'sash'
export type KitCollar = 'crew' | 'v' | 'polo'

export type KitSpec = {
  primary: string
  secondary: string
  detail: string
  pattern: KitPattern
  collar: KitCollar
  longSleeve: boolean
  number: string
}

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
  primary: 'אדום',
  secondary: 'לבן',
  detail: 'לבן',
  pattern: 'solid',
  collar: 'crew',
  longSleeve: false,
  number: '10',
}

/** Seasons with a verified maker, newest first — the strip the kit screen scrolls. */
export function verifiedKitSeasons(): Array<{
  season: string
  maker: string
  sponsor: string | null
  sourceTitle: string
  sourceUrl: string | null
}> {
  return archive.kitSupply
    .filter((row) => row.fromLabel !== null)
    .map((row) => {
      const season = row.fromLabel as string
      const deal = archive.sponsorDeals.find((sponsor) => sponsor.fromLabel === season)
      return {
        season,
        maker: nameOf.manufacturer(row.manufacturerSlug),
        sponsor: deal ? nameOf.sponsor(deal.sponsorSlug) : null,
        sourceTitle: row.sourceTitle,
        sourceUrl: row.sourceUrl,
      }
    })
    .sort((a, b) => b.season.localeCompare(a.season))
}
