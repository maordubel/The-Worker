/**
 * מזהה משחק קנוני — a stable id that survives a correction to the record.
 *
 * There are two identifiers for a match and confusing them is the bug this file exists
 * to prevent.
 *
 * **`MatchNaturalKey`** — `sport|season|competition|home|away|stage`. It is what the
 * INGESTION layer deduplicates and idempotently updates on, and it is the same tuple the
 * schema already declares unique (`match_natural_key` in the core migration) and that
 * `content/manual/match-events.json` already keys every event on. It is derived from the
 * record's own fields, which is exactly what makes it useful — and exactly what makes it
 * unsafe to persist anywhere outside ingestion: **normalise a club slug, correct a
 * misread stage, fix a competition name, and the key changes.**
 *
 * **`CanonicalMatchId`** — an opaque, stable handle. It is minted once from a natural
 * key and then never moves again. When a record is corrected, the id keeps pointing at
 * the same match and the OLD natural key is kept as an alias, so a second import of the
 * uncorrected source resolves to the same match instead of creating a duplicate.
 *
 * The rule, and it is the whole point:
 *
 *   · **Natural keys belong to ingestion and canonical resolution.**
 *   · **Stable ids belong in anything persisted** — above all a saved life
 *     (`LifeEvent[]`), which a player keeps for years while the archive underneath it is
 *     corrected many times.
 *
 * A saved life that stored `football|1980/81|ליגה-לאומית|הפועל-תל-אביב|מכבי-נתניה|מחזור 18`
 * would silently lose that memory the day somebody fixed the competition slug. Storing
 * `m_9f2c0a41b7d3` cannot.
 *
 * This module is pure and client-safe: no archive, no `node:crypto`, no I/O. The
 * registry is data (`content/manual/match-ids.json`) and the minting side lives in the
 * ingestion layer, which is the only thing allowed to create one.
 */

export type Sport = 'football' | 'basketball'

/** Opaque by intention: nothing may parse it, and nothing may derive it at read time. */
export type CanonicalMatchId = string & { readonly __brand: 'CanonicalMatchId' }

/** `sport|season|competition|home|away|stage` — ingestion's deduplication key. */
export type MatchNaturalKey = string & { readonly __brand: 'MatchNaturalKey' }

export const MATCH_ID_PREFIX = 'm_'

/** Shape of one registry row. Append-only; `aliases` grows, `id` never changes. */
export type MatchIdEntry = {
  id: CanonicalMatchId
  sport: Sport
  /** the CURRENT natural key */
  naturalKey: MatchNaturalKey
  /** every natural key this match has ever had, oldest first */
  aliases: MatchNaturalKey[]
  /** when the id was minted — a correction never updates this */
  mintedOn: string
}

/**
 * Build the natural key. The one place the tuple's order and separator are decided.
 *
 * `sport` leads because a club slug is unique only WITHIN a sport — the schema says so
 * (`club_slug_sport_idx on club (slug, sport)`), so `הפועל-תל-אביב` names two different
 * clubs and a key without the sport is not a key.
 */
export function matchNaturalKey(parts: {
  sport: Sport
  seasonLabel: string
  competitionSlug: string
  homeClubSlug: string
  awayClubSlug: string
  stage: string | null
}): MatchNaturalKey {
  return [
    parts.sport,
    parts.seasonLabel,
    parts.competitionSlug,
    parts.homeClubSlug,
    parts.awayClubSlug,
    parts.stage ?? '',
  ].join('|') as MatchNaturalKey
}

/** True for a well-formed id. Used by the guards; never used to extract meaning. */
export function isCanonicalMatchId(value: string): value is CanonicalMatchId {
  return new RegExp(`^${MATCH_ID_PREFIX}[0-9a-f]{12}$`).test(value)
}

/**
 * Resolve a natural key — current or historical — to its stable id.
 *
 * Checking aliases is what makes a correction non-destructive: re-importing the source
 * that produced the old key finds the same match rather than minting a second one.
 */
export function idForNaturalKey(
  registry: readonly MatchIdEntry[],
  key: MatchNaturalKey,
): CanonicalMatchId | null {
  const hit = registry.find(
    (entry) => entry.naturalKey === key || entry.aliases.includes(key),
  )
  return hit?.id ?? null
}

export function entryForId(
  registry: readonly MatchIdEntry[],
  id: CanonicalMatchId,
): MatchIdEntry | null {
  return registry.find((entry) => entry.id === id) ?? null
}
