import 'server-only'

import lineupsFile from '@/content/manual/lineups.json'
import playerFactsFile from '@/content/manual/player-facts.json'
import squadsFile from '@/content/manual/squads.json'
import { CONFIDENCE_FLOOR, archive } from './archive'
import { fold } from './roster-search'

/**
 * סינון השחקנים — position and origin, only where a source says so.
 *
 * Maor: *"אני רוצה שתעשה סינון של כל רשימות השחקנים לפי עמדה. לפי זר/ישראלי… קשה
 * שמופיעים כל רשימות השחקנים בבת אחת."* He is right about the problem — 637 names in
 * one column is a wall — and the honest answer to it is narrower than it looks.
 *
 * **The archive holds 637 names and almost no positions.** `players-roster.json` has
 * exactly four fields and three of them are the name. Rule 24 already recorded the
 * consequence for the polls wing: *"a 'goalkeepers' shortlist would have to be guessed,
 * and one striker in it would make the wing untrustworthy."* Guessing a position from a
 * shirt number, from an era, or from a name is the same mistake wearing a better hat.
 *
 * So the facets are built ONLY from rows that state them, and every one of them says
 * where it came from:
 *
 *   · **`squad`** — `squads.json` carries `position` and `nationalityHe` per player.
 *     That is the strongest evidence there is, and it covers the current squad.
 *   · **`database`** — `player-facts.json`, the merged research file. It is built from
 *     five sources by `scripts/players/pipeline.sh`, and every row says which one
 *     decided it:
 *
 *       vikipoel  · **ויקיפועל**, the club's own encyclopedia (`wiki.red-fans.com`) —
 *                   638 players, and the list our own roster was born from. It is the
 *                   strongest source for two of the three questions: "foreign or
 *                   Israeli", because its `שחקנים זרים (כדורגל)` category is the CLUB's
 *                   own record of who took a foreign slot rather than a guess from
 *                   citizenship; and the years, because every page carries a
 *                   `סגל הפועל ת"א (כדורגל) YYYY/YY` category for each season he was in
 *                   the squad. Cloudflare blocks it to automated access, so it was read
 *                   through Maor's own browser and checked against it by SHA-256.
 *       wiki-he   · ויקיפדיה העברית, קטגוריה "כדורגלני הפועל תל אביב" — 433 articles.
 *                   The position is the man's career position in his own article, and
 *                   the years are the years he is listed at the club.
 *       wiki-en   · English Wikipedia, Category:Hapoel Tel Aviv F.C. players — 418
 *                   articles, of which 58 have no Hebrew article at all.
 *       wf-all    · worldfootball's all-time table — 552 players, position and
 *                   nationality each.
 *       wf-season · worldfootball's 73 season squads, 1933/34 → 2025/26 — the weakest
 *                   for position (one season's squad slot) and the strongest for the
 *                   question of WHICH seasons he was actually in the squad.
 *       archive-qualifier · the archive itself, where it distinguishes two men of the
 *                   same name by naming the position ("עומר פרץ (חלוץ)").
 *
 *     Nothing is guessed. A Hebrew name enters only through a match that was unique in
 *     both directions, and the ones that were not are printed by name — see
 *     `docs/09-player-facts.md` and the `refusedMatches` array in the file. Where the
 *     sources disagree, the strongest wins and the others are kept in `conflicts`
 *     rather than deleted.
 *   · **`lineup`** — `lineups.json` places eleven named men in `GK`/`D`/`M`/`F` slots.
 *     Those files carry `positionsInferred: true`, which the source itself is telling
 *     us: the slot is where he played THAT night, not a career position. It is recorded
 *     as an inference, labelled as one on screen, and any `database` row overrides it.
 *   · **`name`** — `shirt-numbers.json` marks `hebrewIsTransliteration` and sometimes
 *     carries `personNameLatin`. That is a documented fact about the SPELLING, so it
 *     supports "the source wrote this man's name in Latin" and nothing stronger. It is
 *     used for origin at the weakest tier, and a squad row always overrides it.
 *
 * Everything else comes back `null` and is shown as **לא מתועד** — a real bucket with a
 * real count, not a silent omission. That bucket is also the shopping list: it is the
 * exact set of players the archive would gain most from.
 *
 * **Measured over the 663 people the archive knows, before this research and after:**
 * position 64 → **633**, Israeli-or-foreign 103 → **654**, years-worn 137 → **648**, and
 * all three together 32 → **632**. Every one of the 653 players in the roster now has a
 * row. The **20** still without a position are the ones whose `תפקיד` field is empty on
 * ויקיפועל AND whose opening sentence states no role either — they read `לא מתועד`,
 * because that is what is true. (It was 23 until 17.9.2026, when the lead sentence
 * started being read as its own source; see `docs/12-player-roles.md`.)
 *
 * **`positions` is the same fact in its honest shape.** `תפקיד` is a LIST — 48 pages
 * write more than one role in it — so a man who played two positions carries both, with
 * `position` staying the single display value. Asking the sheet for defenders finds
 * שייע פייגנבוים, who was one before he was the club's greatest striker; asking for
 * strikers finds him too, and neither answer throws the other away.
 */

export type Position = 'GK' | 'DF' | 'MF' | 'FW'
export type Origin = 'israeli' | 'foreign'
export type FacetSource = 'squad' | 'lineup' | 'database' | 'name'

export type PlayerFacets = {
  position: Position | null
  /**
   * Every playing position a source states, display value first — only where there is
   * more than one. `player-facts.json` carries it for the men whose ויקיפועל page lists
   * several roles (`מגן שמאלי, חלוץ` — שייע פייגנבוים, a left back who became the club's
   * greatest striker). The display value stays one; the others are not thrown away.
   */
  positions: Position[] | null
  positionFrom: FacetSource | null
  origin: Origin | null
  originFrom: FacetSource | null
  /** first and last season the archive can place him in, as four-digit years */
  fromYear: number | null
  toYear: number | null
}

type PlayerFactRow = {
  personNameHe: string
  personNameLatin: string
  position?: string | null
  positions?: string[] | null
  origin?: string | null
  fromYear?: number | null
  toYear?: number | null
  matchedBy?: string | null
  confidence?: number
}

type SquadRow = {
  personName: string
  position?: string | null
  nationalityHe?: string | null
  confidence?: number
}

type LineupRow = {
  xi: Record<string, string>
  benchHe?: string[] | null
  positionsInferred?: boolean
  confidence?: number
}

/** `D1` → DF, `M3` → MF, `F2` → FW, `GK` → GK. Anything else is not a position. */
function slotToPosition(slot: string): Position | null {
  if (slot.startsWith('GK') || slot.startsWith('G')) return 'GK'
  if (slot.startsWith('D')) return 'DF'
  if (slot.startsWith('M')) return 'MF'
  if (slot.startsWith('F')) return 'FW'
  return null
}

function normalisePosition(raw: string | null | undefined): Position | null {
  if (raw === 'GK' || raw === 'DF' || raw === 'MF' || raw === 'FW') return raw
  return null
}

/** The season label's opening year. "1980/81" → 1980; a bare "1980" → 1980. */
function seasonYear(label: string): number | null {
  const match = label.match(/(\d{4})/)
  return match ? Number(match[1]) : null
}

let cache: Map<string, PlayerFacets> | null = null

/** Keyed on the FOLDED name, because the same man is spelled three ways across files. */
export function facetIndex(): Map<string, PlayerFacets> {
  if (cache) return cache
  const index = new Map<string, PlayerFacets>()

  function entry(nameHe: string): PlayerFacets {
    const key = fold(nameHe)
    const found = index.get(key)
    if (found) return found
    const fresh: PlayerFacets = {
      position: null,
      positions: null,
      positionFrom: null,
      origin: null,
      originFrom: null,
      fromYear: null,
      toYear: null,
    }
    index.set(key, fresh)
    return fresh
  }

  // --- weakest first, so a stronger source simply overwrites it ------------------
  // The Latin spelling. A documented fact about how the source wrote the name, which is
  // evidence of a foreign player and is never treated as more than that.
  for (const row of archive.shirtNumbers) {
    const facets = entry(row.personNameHe)
    const year = seasonYear(row.seasonLabel)
    if (year !== null) {
      facets.fromYear = facets.fromYear === null ? year : Math.min(facets.fromYear, year)
      facets.toYear = facets.toYear === null ? year : Math.max(facets.toYear, year)
    }
    if (row.hebrewIsTransliteration === true && facets.originFrom === null) {
      facets.origin = 'foreign'
      facets.originFrom = 'name'
    }
  }

  // The XIs. `positionsInferred` is the file telling us this is where he played that
  // night — so it is recorded, and labelled, as an inference.
  const lineups = (lineupsFile as { records: LineupRow[]; confidence: number }).records
  for (const lineup of lineups) {
    if ((lineup.confidence ?? 0) < CONFIDENCE_FLOOR) continue
    for (const [slot, nameHe] of Object.entries(lineup.xi)) {
      const position = slotToPosition(slot)
      if (position === null) continue
      const facets = entry(nameHe)
      if (facets.positionFrom === null || facets.positionFrom === 'lineup') {
        facets.position = position
        facets.positions = null
        facets.positionFrom = 'lineup'
      }
    }
  }

  // `player-facts.json` — the merged research file, and the reason this index stopped
  // being a handful of men. 653 rows across six sources: position, Israeli or foreign,
  // and the years he wore the shirt. It outranks a single recorded XI (which says where
  // a man stood on ONE night) and is outranked by our own squad sheet. The precedence
  // BETWEEN the five sources is already settled inside the file — `positionFrom` and
  // `originFrom` there name the one that decided, and `conflicts` keeps what the others
  // said rather than throwing it away.
  const facts = (playerFactsFile as { records: PlayerFactRow[] }).records
  for (const row of facts) {
    if ((row.confidence ?? 0) < CONFIDENCE_FLOOR) continue
    const entry_ = entry(row.personNameHe)
    const position = normalisePosition(row.position)
    if (position !== null) {
      entry_.position = position
      const every = (row.positions ?? [])
        .map((code) => normalisePosition(code))
        .filter((code): code is Position => code !== null)
      entry_.positions = every.length > 1 ? every : null
      entry_.positionFrom = 'database'
    }
    if (row.origin === 'israeli' || row.origin === 'foreign') {
      entry_.origin = row.origin
      entry_.originFrom = 'database'
    }
    // The source knows which SEASONS he was in the squad, which is a better answer
    // than the seasons we happen to hold a shirt number for — so it widens the span
    // rather than replacing it. A man can be in a squad without a number on file.
    if (typeof row.fromYear === 'number') {
      entry_.fromYear = entry_.fromYear === null ? row.fromYear : Math.min(entry_.fromYear, row.fromYear)
    }
    if (typeof row.toYear === 'number') {
      entry_.toYear = entry_.toYear === null ? row.toYear : Math.max(entry_.toYear, row.toYear)
    }
  }

  // The squad sheet. Position and nationality, stated, per player. It wins outright.
  const squads = (squadsFile as { records: SquadRow[]; confidence: number }).records
  for (const row of squads) {
    if ((row.confidence ?? 0) < CONFIDENCE_FLOOR) continue
    const facets = entry(row.personName)
    const position = normalisePosition(row.position)
    if (position !== null) {
      facets.position = position
      // The squad sheet states one position per season and wins outright, so it also
      // replaces the list rather than being merged into somebody else's.
      facets.positions = null
      facets.positionFrom = 'squad'
    }
    if (typeof row.nationalityHe === 'string' && row.nationalityHe !== '') {
      facets.origin = row.nationalityHe === 'ישראל' ? 'israeli' : 'foreign'
      facets.originFrom = 'squad'
    }
  }

  cache = index
  return index
}

export function facetsFor(nameHe: string): PlayerFacets | undefined {
  return facetIndex().get(fold(nameHe))
}
