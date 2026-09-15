import 'server-only'

import { footballPeople } from './archive'
import { FORMATIONS, DEFAULT_FORMATION, type Formation } from './lineup'
import { facetIndex } from './roster-facets'
import { byInitial, fold, splitName, type Searchable } from './roster-search'

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
 * list is not a feature, it is a wall. So the roster ships pre-split into given and
 * family name and bucketed by the FAMILY initial, with a ranked search, and the payload
 * carries names only — the archive knows nothing else about most of them, and pretending
 * otherwise would be inventing.
 */

export type RosterEntry = Searchable

export type RosterIndex = {
  /** every name, sorted the way a Hebrew reader expects */
  all: RosterEntry[]
  /** family-name initial → the names under it, for the letter rail */
  letters: { letter: string; names: RosterEntry[] }[]
  total: number
  /** how many of the 637 the archive can actually place — printed, not hidden */
  withPosition: number
  withOrigin: number
}

export function rosterIndex(): RosterIndex {
  // `footballPeople` is the merged set — the curated records plus the all-time roster,
  // sport-scoped. Reading the roster file directly would drop the twenty players the
  // archive actually knows something about.
  //
  // The split happens HERE, once, at build time. Doing it in the component meant 637
  // regex splits on every keystroke, which is most of why the sheet felt heavy.
  //
  // The facets are attached HERE for the same reason the split is: once, at build time.
  // They are what lets the sheet be narrowed by position, by origin and by decade —
  // and most of them are `null`, deliberately. See `lib/game/roster-facets.ts`: the
  // archive states a position for a few dozen men and for nobody else, and a guessed
  // position in a roster of 637 would make every one of them untrustworthy.
  const facets = facetIndex()
  const all: RosterEntry[] = footballPeople
    .map((row) => {
      const found = facets.get(fold(row.fullNameHe))
      return {
        slug: row.slug,
        nameHe: row.fullNameHe,
        ...splitName(row.fullNameHe),
        position: found?.position ?? null,
        positionFrom: found?.positionFrom ?? null,
        origin: found?.origin ?? null,
        originFrom: found?.originFrom ?? null,
        fromYear: found?.fromYear ?? null,
        toYear: found?.toYear ?? null,
      }
    })
    .sort((a, b) => fold(a.familyHe).localeCompare(fold(b.familyHe), 'he'))

  return {
    all,
    letters: byInitial(all),
    total: all.length,
    withPosition: all.filter((entry) => entry.position !== null).length,
    withOrigin: all.filter((entry) => entry.origin !== null).length,
  }
}

export function formationList(): Formation[] {
  return Object.values(FORMATIONS)
}

export { DEFAULT_FORMATION }
