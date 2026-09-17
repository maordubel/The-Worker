import 'server-only'

import type { RosterIndex } from '@/lib/game/allTimeXI'
import { fold } from '@/lib/game/roster-search'
import { shirtIndex, type PlayerShirt, type ShirtReason } from '@/lib/kit/playerKit'
import type { KitSpec } from '@/lib/kit/spec'

/**
 * לוח החולצות — the shirt join, in the shape a client screen can hold.
 *
 * `lib/kit/playerKit.ts` is the read-model and knows nothing about screens; this turns
 * it into a payload, and the shape is the whole point of the file:
 *
 *   · **the seasons are sent ONCE.** Twenty-one home shirts serve three hundred and
 *     eighty-nine men, so a spec per player would ship the same eight layers a hundred
 *     times over to a phone.
 *   · **a player is two fields** — which season, and why that season — because the
 *     screen has to be able to say the reason out loud. A shirt that appears with no
 *     explanation is a claim the reader cannot check.
 *   · **a man with no shirt is ABSENT**, not a null row. 272 of them; the screen shows
 *     his name, as it always did, and says nothing else.
 */

export type ShirtSeason = {
  seasonLabel: string
  spec: KitSpec
  /** what the archive says the shirt looked like, from the photograph it was read off */
  noteHe: string
  /** the photograph, named on screen (rule 16) */
  sourceTitle: string
  /** what the club won that season, named — empty where it won nothing */
  wonHe: string[]
}

export type ShirtBoard = {
  /** roster slug → the season he is given and why */
  bySlug: Record<string, { seasonLabel: string; why: ShirtReason }>
  /** season label → the shirt itself */
  seasons: Record<string, ShirtSeason>
  /** how many of the roster the archive can dress, and how many it cannot */
  withShirt: number
  withoutShirt: number
}

export function shirtBoard(roster: RosterIndex): ShirtBoard {
  const index = shirtIndex()
  // One pass to key the join by slug as well as by folded name: the squad rows carry a
  // slug for every man the wiki wrote one for, and the fold is how the archive's
  // spellings of the rest are reconciled (rule 7). Both are built once, here, rather
  // than searched per roster row.
  const bySlugKey = new Map<string, PlayerShirt>()
  for (const shirt of index.values()) {
    if (shirt.personSlug) bySlugKey.set(shirt.personSlug, shirt)
  }

  const bySlug: ShirtBoard['bySlug'] = {}
  const seasons: Record<string, ShirtSeason> = {}

  for (const entry of roster.all) {
    const found = bySlugKey.get(entry.slug) ?? index.get(fold(entry.nameHe))
    if (!found) continue
    bySlug[entry.slug] = { seasonLabel: found.seasonLabel, why: found.why }
    seasons[found.seasonLabel] ??= {
      seasonLabel: found.seasonLabel,
      spec: found.kit.spec,
      noteHe: found.kit.noteHe,
      sourceTitle: found.kit.sourceTitle,
      wonHe: found.wonHe,
    }
  }

  const withShirt = Object.keys(bySlug).length
  return { bySlug, seasons, withShirt, withoutShirt: roster.all.length - withShirt }
}
