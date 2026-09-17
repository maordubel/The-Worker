import 'server-only'

import squadsFile from '@/content/manual/squads.json'
import { archive } from '@/lib/game/archive'
import { fold } from '@/lib/game/roster-search'
import { kitForSeason, type SeasonKit } from './seasons'

/**
 * החולצה של האיש — the shirt a player is given, from a season he was actually in.
 *
 * Maor, 17.9.2026:
 * *"אני רוצה להצמיד חולצה מעונה שבה שיחק שחקן מסויים לכל שחקן, בהתאם לעונות ולחולצות
 * מהארכיון. למשל לשלום תקוה להצמיד חולצה 99-00. למשה סיני להצמיד חולצה מ86."*
 *
 * This is a JOIN, not a table (rule 1). Three archives already hold every fact it needs
 * and none of them is copied here:
 *
 *   · **`squads.json`** — 1,788 memberships across 98 seasons, read off each player's
 *     own ויקיפועל categories (rule 37). This is the only thing that may put a man in a
 *     season.
 *   · **`kit-designs.json`** — 33 kit specs, 21 of them home shirts, each read off a
 *     photograph. `lib/kit/seasons.ts` turns one into the eight-layer `KitSpec` that
 *     `KitPlate` draws (rule 20), with the era's crest printed on it (rule 25).
 *   · **`trophies.json`** — 32 dated honours, which is what decides WHICH of his seasons.
 *
 * **Only a season the squad table puts him in.** Never the nearest season, never an
 * era's typical shirt, never "he was around in the eighties so here is an eighties
 * shirt". A shirt is a claim about a man — *this is what he wore* — and the archive
 * either holds the season or it does not (rule 11).
 *
 * ## The rule, stated so it can be argued with and tested
 *
 * A man's seasons are split into unbroken RUNS, and the longest run is his spell — the
 * years he is identified with. Inside that spell:
 *
 *   1. **a season the club won something** (`why: 'trophy'`) — the most honours first,
 *      so a double outranks a single cup, and the earliest of those, which is his first
 *      honour rather than his last;
 *   2. otherwise **the first season of the spell that has a shirt** (`why: 'run'`);
 *   3. and if the spell has no shirt in the archive at all, the same test over every
 *      other season he played (`why: 'other'`), because a shirt from a season he was in
 *      beats no shirt at all.
 *
 * **Why the spell comes before the trophy**, which is the one decision here that is not
 * obvious: ערן זהבי is in the 2006/07 squad as a teenager — a cup season with a shirt on
 * file — and in 2008/09–2010/11 as the player people remember. Trophy-first hands him a
 * shirt from a season he barely played. Spell-first hands him 2008/09, which is the
 * three years he is actually identified with. Tested by name in `tests/kit.test.ts`,
 * because it is the case that decided the order.
 *
 * Checked against the two Maor named: שלום תקווה → **1999/00**, the double, inside his
 * five-year spell. משה סיני → **1984/85**, the first shirt the archive holds inside his
 * ten-year run; he asked for "a shirt from 86" and 1985/86 is a season with no kit on
 * file, so the honest answer is the nearest season HE PLAYED that the archive can draw,
 * and the screen says which season it is.
 *
 * **265 of the 654 get nothing**, and the screen says nothing rather than guessing.
 *
 * Confidence: the memberships read from ויקיפועל carry **confidence 1** — one source,
 * the wiki's own category, not cross-checked — and this join admits them, because
 * refusing them would leave 27 men with a shirt and 627 without. So every row carries
 * the source it came from and the screen prints it (rule 16), and nothing here may feed
 * the trivia generator, which is what rule 2's floor protects.
 */

export type ShirtReason = 'trophy' | 'run' | 'other'

type SquadRow = {
  personName: string
  personSlug?: string | null
  seasonLabel: string
  confidence?: number
  sourceTitle?: string | null
}

export type PlayerShirt = {
  personName: string
  personSlug: string | null
  seasonLabel: string
  why: ShirtReason
  /** every season the squad table puts him in, oldest first */
  seasons: string[]
  /** how many seasons his longest unbroken run holds */
  spell: number
  kit: SeasonKit
  /** what the club won that season, in the archive's words. Empty unless `why` is trophy. */
  wonHe: string[]
  /** where the membership came from, so the screen can say it */
  sourceTitle: string
  confidence: number
}

/** A season label's opening year. `1999/00` → 1999. */
function seasonYear(label: string): number {
  return Number(label.slice(0, 4))
}

/** Unbroken runs of consecutive seasons, longest first, earliest breaking the tie. */
function runsOf(seasons: string[]): string[][] {
  const runs: string[][] = []
  let current: string[] = []
  for (const season of seasons) {
    const previous = current[current.length - 1]
    if (previous !== undefined && seasonYear(season) !== seasonYear(previous) + 1) {
      runs.push(current)
      current = []
    }
    current.push(season)
  }
  if (current.length > 0) runs.push(current)
  return runs.sort((a, b) => b.length - a.length || seasonYear(a[0] as string) - seasonYear(b[0] as string))
}

let cache: Map<string, PlayerShirt> | null = null

/**
 * Every player the archive can hand a shirt to, keyed on the FOLDED name — the same key
 * `lib/game/roster-facets.ts` uses, because the same man is spelled three ways across
 * the files.
 */
export function shirtIndex(): Map<string, PlayerShirt> {
  if (cache) return cache

  // What the club won, per season, named. `archive.trophies` is already at the
  // confidence floor and already sport-scoped.
  const competitionName = new Map(archive.competitions.map((row) => [row.slug, row.nameHe]))
  const wonIn = new Map<string, string[]>()
  for (const trophy of archive.trophies) {
    if (trophy.result !== 'won') continue
    if (trophy.sport !== undefined && trophy.sport !== 'football') continue
    const named = wonIn.get(trophy.seasonLabel) ?? []
    named.push(competitionName.get(trophy.competitionSlug) ?? trophy.competitionSlug)
    wonIn.set(trophy.seasonLabel, named)
  }

  // Every season a player is in the squad, oldest first. Read straight from the file
  // rather than through `archive`, which enforces the confidence floor — see the note
  // at the top of this module about why confidence 1 is admitted here.
  const rows = (squadsFile as { records: SquadRow[] }).records
  const byPlayer = new Map<
    string,
    { personName: string; personSlug: string | null; seasons: Set<string>; sourceTitle: string; confidence: number }
  >()
  for (const row of rows) {
    const key = fold(row.personName)
    const found = byPlayer.get(key) ?? {
      personName: row.personName,
      personSlug: row.personSlug ?? null,
      seasons: new Set<string>(),
      sourceTitle: row.sourceTitle ?? '',
      confidence: row.confidence ?? 1,
    }
    found.seasons.add(row.seasonLabel)
    // The strongest membership row wins the citation, so a man with one curated season
    // and twelve wiki ones is not described as better sourced than he is.
    if ((row.confidence ?? 1) > found.confidence) {
      found.confidence = row.confidence ?? 1
      found.sourceTitle = row.sourceTitle ?? found.sourceTitle
    }
    if (found.personSlug === null && row.personSlug) found.personSlug = row.personSlug
    byPlayer.set(key, found)
  }

  /** The best of a set of seasons that all have shirts: most honours, then earliest. */
  function best(candidates: string[]): { seasonLabel: string; why: ShirtReason } | null {
    if (candidates.length === 0) return null
    const honoured = candidates.filter((season) => (wonIn.get(season) ?? []).length > 0)
    if (honoured.length > 0) {
      const sorted = [...honoured].sort(
        (a, b) =>
          (wonIn.get(b)?.length ?? 0) - (wonIn.get(a)?.length ?? 0) || seasonYear(a) - seasonYear(b),
      )
      return { seasonLabel: sorted[0] as string, why: 'trophy' }
    }
    const sorted = [...candidates].sort((a, b) => seasonYear(a) - seasonYear(b))
    return { seasonLabel: sorted[0] as string, why: 'run' }
  }

  const index = new Map<string, PlayerShirt>()
  for (const [key, player] of byPlayer) {
    const seasons = [...player.seasons].sort((a, b) => seasonYear(a) - seasonYear(b))
    const drawable = seasons.filter((season) => kitForSeason(season) !== null)
    if (drawable.length === 0) continue

    const spell = runsOf(seasons)[0] ?? []
    const inSpell = best(spell.filter((season) => drawable.includes(season)))
    const picked = inSpell ?? { ...(best(drawable) as { seasonLabel: string; why: ShirtReason }), why: 'other' as const }
    const kit = kitForSeason(picked.seasonLabel)
    if (kit === null) continue

    index.set(key, {
      personName: player.personName,
      personSlug: player.personSlug,
      seasonLabel: picked.seasonLabel,
      why: picked.why,
      seasons,
      spell: spell.length,
      kit,
      wonHe: picked.why === 'trophy' ? (wonIn.get(picked.seasonLabel) ?? []) : [],
      sourceTitle: player.sourceTitle,
      confidence: player.confidence,
    })
  }

  cache = index
  return index
}

export function shirtFor(nameHe: string): PlayerShirt | null {
  return shirtIndex().get(fold(nameHe)) ?? null
}

/**
 * What the join can and cannot do, counted — printed on the screen rather than kept in
 * a comment, because a player who gets no shirt deserves to know the archive is missing
 * the season and not that he is missing from it.
 */
export function shirtCoverage(roster: ReadonlyArray<{ nameHe: string }>): {
  total: number
  withShirt: number
  withoutShirt: number
} {
  const index = shirtIndex()
  const withShirt = roster.filter((entry) => index.has(fold(entry.nameHe))).length
  return { total: roster.length, withShirt, withoutShirt: roster.length - withShirt }
}
