import 'server-only'

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

export type MemoryCard = {
  id: string
  pair: string
  face: string
  /** the second line on the card — what kind of fact this is */
  kind: string
}

type Candidate = { pair: string; a: string; b: string; kind: string }

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
      }
    })
    .filter((candidate) => candidate.b !== '')
}

export function buildBoard(seed: number, pairs = 6): MemoryCard[] {
  const random = rng(seed)

  const candidates: Candidate[] = [
    ...kitCandidates(),
    ...archive.trophies
      .filter((row) => row.result === 'won')
      .map((row) => ({
        pair: `trophy:${row.competitionSlug}:${row.seasonLabel}`,
        a: nameOf.competition(row.competitionSlug),
        b: row.seasonLabel,
        kind: 'תואר ועונה',
      })),
    ...archive.moments
      .filter((row) => row.happenedOn !== null)
      .map((row) => ({
        pair: `moment:${row.slug}`,
        a: row.titleHe,
        b: (row.happenedOn as string).slice(0, 4),
        kind: 'רגע ושנה',
      })),
    ...archive.electionCandidates
      .filter((row) => row.votes !== null && row.rank !== null && row.rank <= 6)
      .map((row) => ({
        pair: `election:${row.electionSlug}:${row.personNameHe}`,
        a: row.personNameHe,
        b: `${row.votes} קולות`,
        kind: 'בחירות העמותה',
      })),
  ]

  // One pair per distinct face value, so two cards can never read identically — and
  // one competition per board, so "גביע המדינה" never appears twice wanting two
  // different years.
  const seen = new Set<string>()
  const chosen = shuffle(candidates, random)
    .filter((candidate) => {
      if (seen.has(candidate.a) || seen.has(candidate.b)) return false
      seen.add(candidate.a)
      seen.add(candidate.b)
      return true
    })
    .slice(0, pairs)

  return shuffle(
    chosen.flatMap((candidate) => [
      { id: `${candidate.pair}:a`, pair: candidate.pair, face: candidate.a, kind: candidate.kind },
      { id: `${candidate.pair}:b`, pair: candidate.pair, face: candidate.b, kind: candidate.kind },
    ]),
    random,
  )
}
