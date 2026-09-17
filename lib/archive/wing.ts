import 'server-only'

import pressFile from '@/content/manual/press-columns.json'
import { archive, rng, shuffle } from '@/lib/game/archive'
import { positionOf, takeFrom } from '@/lib/rotation/deck'

/**
 * שער 12 — אגף הארכיון. Two corners, both read-models (rule 1).
 *
 * The wing exists because the archive finally holds something dated enough to answer a
 * question about TODAY: 1,385 press columns from ויקיפועל's "בשער" series, every one
 * with a full ISO date, beside 3,068 dated matches. Nothing here is a new dataset —
 * `content/manual/press-columns.json` is the ingest's output and everything else is the
 * canon the whole app reads.
 *
 * ## היום לפני
 *
 * What happened on today's date, from the archive, or **nothing**. A wing that invents
 * an anniversary is worse than one that says the archive holds nothing for today, so
 * `empty` is a real state with its own sentence and the screen prints it (rule 11).
 *
 * **Trophies are not in it, and that is a decision rather than an omission.** A trophy
 * row carries a SEASON (`1999/00`, `1938`) and no day. "On this day the club won the
 * double" would be a date this archive does not hold — the exact shape of invention this
 * project refuses — so the corner answers from the two tables that carry a day.
 *
 * ## הידעת
 *
 * A fact with its source on screen (rule 16 — bring the source, never the bare claim).
 * The deck is built from rows that carry one: a press column, a curated moment, a
 * season the club won something in. Every card names where it came from.
 *
 * **A press column is somebody's copyrighted writing.** The card shows the headline, the
 * date, the byline and the ONE short quotation the ingest cut — and there is no second
 * quotation anywhere in the file it reads, so a piece cannot be reassembled across
 * several cards (rule 12, applied to journalism; the guarantee is structural and lives
 * in `scripts/ingest/sources/vikipoel-turim.ts`).
 *
 * ## The rotation
 *
 * Rule 24's standing demand — a different deal per visit, and a different one again the
 * same day — through `lib/rotation/deck.ts` and nothing of its own: the seed picks the
 * shuffle, the cursor walks the deck, and `PlayLink` on the wall steps the cursor on
 * every entry. Nothing repeats until the deck is used up, and the deal is reproducible
 * from the two numbers in the URL.
 */

export type PressColumnRow = {
  slug: string
  pageHe: string
  publishedOn: string
  decade: number
  titleHe: string
  bylineHe: string
  quoteHe: string | null
  quoteFrom: 'pull' | 'opening' | null
  words: number
  confidence: number
  sourceTitle: string
  sourceUrl: string
}

export const pressColumns: PressColumnRow[] = (
  pressFile as { records: PressColumnRow[] }
).records

/* --------------------------------------------------------------- היום לפני */

export type DayMatch = {
  playedOn: string
  year: number
  seasonLabel: string
  homeHe: string
  awayHe: string
  homeScore: number | null
  awayScore: number | null
  competitionHe: string
  sourceTitle: string
  sourceUrl: string | null
}

export type DayColumn = {
  slug: string
  publishedOn: string
  year: number
  titleHe: string
  bylineHe: string
  quoteHe: string | null
  words: number
  sourceTitle: string
  sourceUrl: string
}

export type OnThisDay = {
  /** the `MM-DD` the archive was asked about */
  monthDay: string
  matches: DayMatch[]
  columns: DayColumn[]
  /** true when the archive holds nothing at all for this date — a real answer */
  empty: boolean
}

const clubName = new Map(archive.clubs.map((row) => [row.slug, row.nameHe]))
const competitionName = new Map(archive.competitions.map((row) => [row.slug, row.nameHe]))

/**
 * What the archive holds for one day of the year.
 *
 * The date is a parameter, never `new Date()` inside the model: a read-model that reads
 * the clock cannot be tested, and the one thing this corner must be is checkable on a
 * day when the archive is empty.
 */
export function onThisDay(isoDate: string): OnThisDay {
  const monthDay = isoDate.slice(5, 10)

  const matches: DayMatch[] = archive.matches
    .filter((row) => typeof row.playedOn === 'string' && row.playedOn.slice(5, 10) === monthDay)
    .map((row) => ({
      playedOn: row.playedOn as string,
      year: Number((row.playedOn as string).slice(0, 4)),
      seasonLabel: row.seasonLabel,
      homeHe: clubName.get(row.homeClubSlug) ?? row.homeClubSlug,
      awayHe: clubName.get(row.awayClubSlug) ?? row.awayClubSlug,
      homeScore: row.homeScore ?? null,
      awayScore: row.awayScore ?? null,
      competitionHe: competitionName.get(row.competitionSlug) ?? row.competitionSlug,
      sourceTitle: row.sourceTitle,
      sourceUrl: row.sourceUrl,
    }))
    .sort((a, b) => b.year - a.year)

  const columns: DayColumn[] = pressColumns
    .filter((row) => row.publishedOn.slice(5, 10) === monthDay)
    .map((row) => ({
      slug: row.slug,
      publishedOn: row.publishedOn,
      year: Number(row.publishedOn.slice(0, 4)),
      titleHe: row.titleHe,
      bylineHe: row.bylineHe,
      quoteHe: row.quoteHe,
      words: row.words,
      sourceTitle: row.sourceTitle,
      sourceUrl: row.sourceUrl,
    }))
    .sort((a, b) => b.year - a.year)

  return { monthDay, matches, columns, empty: matches.length === 0 && columns.length === 0 }
}

/* ------------------------------------------------------------------ הידעת */

export type FactKind = 'column' | 'moment' | 'trophy'

export type FactCard = {
  /** unique across the whole deck, and checked — rule 31 */
  id: string
  kind: FactKind
  /** the heading of the card */
  titleHe: string
  /** the fact itself, in the archive's own words where it has any */
  bodyHe: string | null
  /** a press column's one short quotation. Never more than one per column. */
  quoteHe: string | null
  /** who wrote it, where the source names a person or a paper */
  bylineHe: string | null
  /** the date or the season, as the archive holds it — never both, never invented */
  whenHe: string
  sourceTitle: string
  sourceUrl: string | null
}

const HE_MONTHS = [
  'בינואר',
  'בפברואר',
  'במרץ',
  'באפריל',
  'במאי',
  'ביוני',
  'ביולי',
  'באוגוסט',
  'בספטמבר',
  'באוקטובר',
  'בנובמבר',
  'בדצמבר',
]

/** `1986-05-23` → `23 במאי 1986`. A date the archive holds, spelled out. */
export function longDateHe(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number]
  return `${day} ${HE_MONTHS[month - 1]} ${year}`
}

let deckCache: FactCard[] | null = null

/** Everything the wing can deal, built once. */
export function factDeck(): FactCard[] {
  if (deckCache) return deckCache
  const cards: FactCard[] = []

  for (const column of pressColumns) {
    // A column with no quotation is still a card: a headline, a date and a name are a
    // fact about the archive. What it is not is an excuse to go and find more text.
    cards.push({
      id: `column:${column.slug}`,
      kind: 'column',
      titleHe: column.titleHe,
      bodyHe: null,
      quoteHe: column.quoteHe,
      bylineHe: column.bylineHe,
      whenHe: longDateHe(column.publishedOn),
      sourceTitle: column.sourceTitle,
      sourceUrl: column.sourceUrl,
    })
  }

  for (const moment of archive.moments) {
    cards.push({
      id: `moment:${moment.slug}`,
      kind: 'moment',
      titleHe: moment.titleHe,
      bodyHe: moment.bodyHe,
      quoteHe: null,
      bylineHe: null,
      whenHe: moment.happenedOn ? longDateHe(moment.happenedOn) : '',
      sourceTitle: moment.sourceTitle,
      sourceUrl: moment.sourceUrl,
    })
  }

  for (const trophy of archive.trophies) {
    if (trophy.result !== 'won') continue
    if (trophy.sport !== undefined && trophy.sport !== 'football') continue
    cards.push({
      id: `trophy:${trophy.competitionSlug}:${trophy.seasonLabel}`,
      kind: 'trophy',
      titleHe: competitionName.get(trophy.competitionSlug) ?? trophy.competitionSlug,
      bodyHe: trophy.noteHe ?? null,
      quoteHe: null,
      bylineHe: null,
      // A trophy row holds a SEASON and no day, so the card says a season. Dressing it
      // as a date would be inventing the one field the source did not write.
      whenHe: trophy.seasonLabel,
      sourceTitle: trophy.sourceTitle,
      sourceUrl: trophy.sourceUrl,
    })
  }

  deckCache = cards
  return cards
}

export const DEAL_SIZE = 6

/**
 * The deal — `size` cards from this device's place in this shuffle of the deck.
 *
 * Pure arithmetic over `lib/rotation/deck.ts`, exactly like every other gate: no second
 * rotation engine, no `Math.random()` inside a deal, and the same two numbers always
 * produce the same cards.
 */
export function dealFacts(
  seed: number,
  cursor: number,
  size: number = DEAL_SIZE,
): { cards: FactCard[]; cycle: number; slices: number } {
  const pool = factDeck()
  const position = positionOf(seed, cursor, pool.length, size)
  const shuffled = shuffle(pool, rng(position.seed))
  return {
    cards: takeFrom(shuffled, position.slot * size, size),
    cycle: position.cycle,
    slices: position.slices,
  }
}

/** What the wing holds, counted — printed on the screen rather than promised. */
export function archiveFigures(): {
  columns: number
  datedMatches: number
  moments: number
  trophies: number
  earliest: string | null
  latest: string | null
} {
  const dates = pressColumns.map((row) => row.publishedOn).sort()
  return {
    columns: pressColumns.length,
    datedMatches: archive.matches.filter((row) => typeof row.playedOn === 'string').length,
    moments: archive.moments.length,
    trophies: archive.trophies.filter((row) => row.result === 'won').length,
    earliest: dates[0] ?? null,
    latest: dates[dates.length - 1] ?? null,
  }
}
