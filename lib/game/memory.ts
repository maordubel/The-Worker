import 'server-only'

import { positionOf, takeFrom } from '@/lib/rotation/deck'
import { archive, nameOf, rng, shuffle } from './archive'
import { currentSeasonStartYear, seasonsInSpell } from './seasons'

/**
 * Memory pairs, drawn from the archive rather than invented.
 *
 * Maor's report was that the board never produces a pair. The matching mechanic works —
 * the game was unplayable for a different reason. A pair here is two DIFFERENT faces
 * (a maker and a season, a trophy and the year it was won), so unlike a picture-matching
 * game there is no way to tell from a face which other face belongs with it. Twelve
 * unrelated-looking cards with no category on them is not a memory board, it is a
 * guessing board, and a player can turn every card and still be no closer.
 *
 * Two changes make it a game:
 *   1. Every card shows its CATEGORY. A maker card and its season card are visibly of
 *      the same kind, so twelve cards become three small groups of four.
 *   2. The two faces of a pair are a complete, self-explaining fact once both are up —
 *      a maker with the FULL span it supplied, not just the season the span opened in.
 */

/**
 * איזה חפץ מהארכיון הכרטיס הזה.
 *
 * The prototype's second rule for this board — "ARCHIVE OBJECTS · לא כל הקלפים נראים
 * אותו דבר" — is the thing that turns twelve identical tiles into a wall. It is only
 * worth having if the object is DERIVED rather than decorated: a card backed by a
 * trophy row is a trophy, a card backed by a kit-supply row is a shirt, a moment is a
 * newspaper clipping, an association election is a ballot. Nothing here is chosen for
 * variety — each value is a statement about which archive table the row came from, so
 * a new source gets a new object or it gets none.
 *
 * The two faces of a pair are deliberately DIFFERENT objects: the memory side is the
 * thing, the answer side is the date or the count that pins it down. That asymmetry is
 * also what lets the closed board be read at a glance — six things and six dates,
 * rather than twelve shapes with nothing to say.
 */
export type MemoryObject = 'trophy' | 'shirt' | 'clipping' | 'ballot' | 'season' | 'count' | 'goal' | 'ticket'

/** which face of the pair a card is: the thing, or what dates it */
export type MemorySide = 'memory' | 'answer'

export type MemoryCard = {
  id: string
  pair: string
  face: string
  /** the second line on the card — what kind of fact this is */
  kind: string
  /** which archive object this face is, for the closed card's drawing */
  object: MemoryObject
  side: MemorySide
}

/**
 * הזיכרון עצמו — one pair, as the shelf and the fusion plate need it.
 *
 * `buildBoard` deals CARDS, which is what the grid wants and all it ever wanted. The
 * souvenir shelf, the fusion plate and the mural all want the PAIR — both faces and the
 * category together — and deriving that back out of a shuffled card list in a component
 * would be re-assembling in the screen something the deck already knew. So the deck
 * hands over both shapes at once (`buildRound`) and `buildBoard` stays exactly the
 * function it was.
 */
export type MemoryPair = {
  id: string
  /** the thing — a trophy, a maker, a moment, a candidate */
  a: string
  /** what dates or counts it — a season, a year, a vote count */
  b: string
  kind: string
  object: MemoryObject
}

export type MemoryRound = {
  pairs: MemoryPair[]
  cards: MemoryCard[]
}

type Candidate = {
  pair: string
  a: string
  b: string
  kind: string
  /** the object the memory face draws */
  object: MemoryObject
  /** the object the answer face draws */
  answer: MemoryObject
  /**
   * the last year the fact touches — a span's end, a season's second year. THE WORKER LIFE's
   * window keeps a pair only when the whole of it had happened (`MemoryWindow`); null for a
   * row the archive does not date, which a window never deals.
   */
  year?: number | null
}

function kitCandidates(): Candidate[] {
  const openThrough = currentSeasonStartYear()
  return archive.kitSupply
    .filter((row) => row.fromLabel !== null)
    .map((row) => {
      const seasons = seasonsInSpell(row, openThrough)
      const first = seasons[0]
      const last = seasons[seasons.length - 1]
      // A one-season spell reads as one season, not as a range from itself to itself.
      const span = first === last ? (first ?? '') : `${first}–${last}`
      return {
        pair: `kit:${row.manufacturerSlug}:${row.fromLabel}`,
        a: nameOf.manufacturer(row.manufacturerSlug),
        b: span,
        kind: 'יצרן ותקופה',
        object: 'shirt' as const,
        answer: 'season' as const,
        year: seasonEnd(last ?? ''),
      }
    })
    .filter((candidate) => candidate.b !== '')
}

/**
 * How many pairs this pool can really field — one per distinct face, counted the way the
 * de-duplication in `buildBoard` counts, in file order so the answer never moves.
 */
function distinctCount(candidates: readonly { a: string; b: string }[]): number {
  const seen = new Set<string>()
  let count = 0
  for (const candidate of candidates) {
    if (seen.has(candidate.a) || seen.has(candidate.b)) continue
    seen.add(candidate.a)
    seen.add(candidate.b)
    count += 1
  }
  return count
}

/**
 * The round, in both the shapes the screen needs — see `MemoryPair`.
 *
 * `buildBoard` is this function's card list and nothing else, so there is exactly one
 * deck, one address into the rotation and one shuffle (rule 59). Splitting them was
 * tempting and wrong: two entry points into the same pool would each have to call
 * `positionOf` with the same arguments, and the day one of them drifted the shelf would
 * be describing a different board from the one on screen.
 */
/**
 * חלון של חיים (21.9.2026, `lib/mechanics/types.ts`) — the old fan at the bus stop in THE
 * WORKER LIFE deals from what had happened by then: only pairs whose last year is before
 * `before` (and not before `from`). Elections carry no date and are never in a window.
 * Absent, the board is dealt exactly as it was.
 */
export type MemoryWindow = { before: number; from?: number }

/** the year a season label ends in — `1985/86` → 1986, `1999/00` → 2000 */
function seasonEnd(label: string): number | null {
  const match = /^(\d{4})\/(\d{2})/.exec(label)
  if (!match) {
    const year = Number(label.slice(0, 4))
    return Number.isFinite(year) && year > 0 ? year : null
  }
  const start = Number(match[1])
  const end = Number(match[2])
  return Math.floor(start / 100) * 100 + end + (end < start % 100 ? 100 : 0)
}

export function buildRound(seed: number, pairs = 6, cursor = 0, window?: MemoryWindow): MemoryRound {
  // The board used to be one board: the gate linked `?seed=7`, the route defaulted to
  // 7, and there was no replay link at all, so every player on every visit turned over
  // the same twelve cards.
  const candidates: Candidate[] = [
    ...kitCandidates(),
    ...archive.trophies
      .filter((row) => row.result === 'won')
      .map((row) => ({
        pair: `trophy:${row.competitionSlug}:${row.seasonLabel}`,
        a: nameOf.competition(row.competitionSlug),
        b: row.seasonLabel,
        kind: 'תואר ועונה',
        object: 'trophy' as const,
        answer: 'season' as const,
        year: seasonEnd(row.seasonLabel),
      })),
    ...archive.moments
      .filter((row) => row.happenedOn !== null)
      .map((row) => ({
        pair: `moment:${row.slug}`,
        a: row.titleHe,
        b: (row.happenedOn as string).slice(0, 4),
        kind: 'רגע ושנה',
        object: 'clipping' as const,
        answer: 'season' as const,
        year: Number((row.happenedOn as string).slice(0, 4)),
      })),
    // v3 (21.9.2026): three more pairings, each one a row that dates itself. A shirt and
    // its season is deliberately NOT one of them — it would be gate 4's answer sheet
    // (rule 24); the maker and its span above is a fact about a supplier, not a shirt.
    ...archive.goals
      .map((goal) => ({ goal, year: ((goal as { playedOn?: string }).playedOn ?? '').slice(0, 4) }))
      // title ↔ year only: the 2010/2012 cup-final OPPONENTS are contested, the day is not
      .filter(({ year }) => /^\d{4}$/.test(year))
      .map(({ goal, year }) => ({
        pair: `goal:${goal.goalId}`,
        a: goal.titleHe,
        b: year,
        kind: 'שער ושנה',
        object: 'goal' as const,
        answer: 'season' as const,
        year: Number(year),
      })),
    ...archive.euroTies
      .filter((tie) => !tie.opponentHe.includes(' · '))
      .map((tie) => ({
        pair: `euro:${tie.slug}`,
        a: tie.opponentHe,
        b: tie.seasonLabel,
        kind: 'לילה אירופי ועונה',
        object: 'ticket' as const,
        answer: 'season' as const,
        year: seasonEnd(tie.seasonLabel),
      })),
    ...archive.crests
      .filter((row) => row.toYear !== null && row.toYear !== row.fromYear)
      .map((row) => ({
        pair: `crest:${row.fromYear}`,
        a: row.nameHe,
        b: `${row.fromYear}–${row.toYear}`,
        kind: 'סמל ושנים',
        object: 'clipping' as const,
        answer: 'season' as const,
        year: row.toYear,
      })),
    ...archive.electionCandidates
      .filter((row) => row.votes !== null && row.rank !== null && row.rank <= 6)
      .map((row) => ({
        pair: `election:${row.electionSlug}:${row.personNameHe}`,
        a: row.personNameHe,
        b: `${row.votes} קולות`,
        kind: 'בחירות העמותה',
        object: 'ballot' as const,
        answer: 'count' as const,
      })),
  ]

  // The pool is assembled BEFORE the deck is addressed, because the address needs its
  // size: `positionOf` decides which lap of the pool this is, and a lap of an unknown
  // pool is one slice long — which would re-seed the shuffle on every single visit and
  // let a pair from the previous board come back on the next one.
  //
  // And the size it needs is the size of the pool it can actually FIELD, not the raw
  // candidate count: the de-duplication below collapses every competition to one row, so
  // 65 candidates yield 29 usable pairs. Addressed over 65 the lap ran eleven boards long
  // over a pool that fills four, `takeFrom` wrapped, and every board from the fifth on
  // re-dealt a pair the same lap had already dealt — the one guarantee
  // `lib/rotation/deck.ts` exists to make. 17.9.2026.
  if (window) {
    const kept = candidates.filter((candidate) => {
      const year = candidate.year
      return typeof year === 'number' && Number.isFinite(year) && year < window.before && (window.from === undefined || year >= window.from)
    })
    candidates.length = 0
    candidates.push(...kept)
  }
  const at = positionOf(seed, cursor, distinctCount(candidates), pairs)
  const random = rng(at.seed)

  // One pair per distinct face value, so two cards can never read identically — and
  // one competition per board, so "גביע המדינה" never appears twice wanting two
  // different years.
  const seen = new Set<string>()
  const distinct = shuffle(candidates, random).filter((candidate) => {
    if (seen.has(candidate.a) || seen.has(candidate.b)) return false
    seen.add(candidate.a)
    seen.add(candidate.b)
    return true
  })
  // Dealt round-robin across KINDS (v3, 21.9.2026): fifty European ties would otherwise
  // be two or three pairs of every board, and a wall of three "לילה אירופי" tabs is one
  // question asked three times. The order is still one fixed permutation of the pool, so
  // consecutive windows stay disjoint — the rotation promise is unchanged.
  const byKind = new Map<string, Candidate[]>()
  for (const candidate of distinct) byKind.set(candidate.kind, [...(byKind.get(candidate.kind) ?? []), candidate])
  const spread: Candidate[] = []
  for (let depth = 0; spread.length < distinct.length; depth += 1) {
    for (const list of byKind.values()) {
      const next = list[depth]
      if (next) spread.push(next)
    }
  }

  // The window slides AFTER the de-duplication, so a later board is still six distinct
  // faces rather than six rows that happen to sit next to each other in the raw pool.
  const chosen = takeFrom(spread, at.slot * pairs, pairs)

  const cards = shuffle(
    chosen.flatMap((candidate): MemoryCard[] => [
      {
        id: `${candidate.pair}:a`,
        pair: candidate.pair,
        face: candidate.a,
        kind: candidate.kind,
        object: candidate.object,
        side: 'memory',
      },
      {
        id: `${candidate.pair}:b`,
        pair: candidate.pair,
        face: candidate.b,
        kind: candidate.kind,
        object: candidate.answer,
        side: 'answer',
      },
    ]),
    random,
  )

  // The pairs are returned in the deal's own order, not the shuffle's: the shelf is a
  // fixed row of slots that fill up as you find them, so its order must not change
  // when the board is shuffled — and must be the same on every device dealt this seed.
  return {
    pairs: chosen.map((candidate) => ({
      id: candidate.pair,
      a: candidate.a,
      b: candidate.b,
      kind: candidate.kind,
      object: candidate.object,
    })),
    cards,
  }
}

/** The board as twelve cards — what the grid has always been handed. */
export function buildBoard(seed: number, pairs = 6, cursor = 0): MemoryCard[] {
  return buildRound(seed, pairs, cursor).cards
}
