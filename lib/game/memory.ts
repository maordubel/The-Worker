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
export type MemoryObject = 'trophy' | 'shirt' | 'clipping' | 'ballot' | 'season' | 'count'

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
export function buildRound(seed: number, pairs = 6, cursor = 0): MemoryRound {
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
  // The window slides AFTER the de-duplication, so a later board is still six distinct
  // faces rather than six rows that happen to sit next to each other in the raw pool.
  const chosen = takeFrom(distinct, at.slot * pairs, pairs)

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
