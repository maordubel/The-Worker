import 'server-only'

import { footballPeople } from './archive'
import { FORMATIONS, DEFAULT_FORMATION, type Formation } from './lineup'

/**
 * הרכב כל הזמנים — the free-play builder.
 *
 * Not a quiz. There is no right answer, no clock and no score: you pick eleven men from
 * everyone who has ever worn the shirt, argue with yourself about the second centre
 * back, and post it. That is the oldest game football supporters play and it needed no
 * inventing — it needed the 637 names Maor supplied to be reachable in a way that does
 * not fight the player.
 *
 * Which is the whole engineering problem here. Six hundred and thirty-seven names in a
 * list is not a feature, it is a wall. So the roster ships pre-bucketed by first letter
 * with a search that matches on any part of the name, and the payload carries names
 * only — the archive knows nothing else about most of them, and pretending otherwise
 * would be inventing.
 */

export type RosterEntry = { slug: string; nameHe: string }

export type RosterIndex = {
  /** every name, sorted the way a Hebrew reader expects */
  all: RosterEntry[]
  /** first letter → the names under it, for the A–Z rail */
  letters: { letter: string; names: RosterEntry[] }[]
  total: number
}

/** Strip the article and any bracketed qualifier so "ה" does not swallow the index. */
function sortKey(name: string): string {
  return name.replace(/[("].*$/, '').trim()
}

export function rosterIndex(): RosterIndex {
  // `footballPeople` is the merged set — the curated records plus the all-time roster,
  // sport-scoped. Reading the roster file directly would drop the twenty players the
  // archive actually knows something about.
  const all: RosterEntry[] = footballPeople
    .map((row) => ({ slug: row.slug, nameHe: row.fullNameHe }))
    .sort((a, b) => sortKey(a.nameHe).localeCompare(sortKey(b.nameHe), 'he'))

  const buckets = new Map<string, RosterEntry[]>()
  for (const entry of all) {
    // bucket on the FAMILY name's first letter where there is one, because that is how
    // a supporter looks a player up — "בוזגלו", not "מאור"
    const parts = sortKey(entry.nameHe).split(/\s+/)
    const key = (parts.length > 1 ? parts[parts.length - 1] : parts[0])?.[0] ?? '·'
    const bucket = buckets.get(key) ?? []
    bucket.push(entry)
    buckets.set(key, bucket)
  }

  return {
    all,
    letters: [...buckets.entries()]
      .map(([letter, names]) => ({ letter, names }))
      .sort((a, b) => a.letter.localeCompare(b.letter, 'he')),
    total: all.length,
  }
}

export function formationList(): Formation[] {
  return Object.values(FORMATIONS)
}

export { DEFAULT_FORMATION }
