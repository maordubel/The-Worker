import 'server-only'

import { archive, nameOf, rng, shuffle } from './archive'

/**
 * Memory pairs, drawn from the archive rather than invented: a maker and the season it
 * supplied, a competition and the season it was won, a moment and its year. Both faces
 * of a pair are shown once flipped, so there is nothing to protect — the board is built
 * on the server only to keep pair selection consistent with the confidence floor.
 */

export type MemoryCard = { id: string; pair: string; face: string; kind: string }

export function buildBoard(seed: number, pairs = 6): MemoryCard[] {
  const random = rng(seed)

  const candidates: Array<{ pair: string; a: string; b: string; kind: string }> = [
    ...archive.kitSupply
      .filter((row) => row.fromLabel !== null)
      .map((row) => ({
        pair: `kit:${row.manufacturerSlug}:${row.fromLabel}`,
        a: nameOf.manufacturer(row.manufacturerSlug),
        b: row.fromLabel as string,
        kind: 'מדים',
      })),
    ...archive.trophies
      .filter((row) => row.result === 'won')
      .map((row) => ({
        pair: `trophy:${row.competitionSlug}:${row.seasonLabel}`,
        a: nameOf.competition(row.competitionSlug),
        b: row.seasonLabel,
        kind: 'תארים',
      })),
    ...archive.moments
      .filter((row) => row.happenedOn !== null)
      .map((row) => ({
        pair: `moment:${row.slug}`,
        a: row.titleHe,
        b: (row.happenedOn as string).slice(0, 4),
        kind: 'רגעים',
      })),
  ]

  // One pair per distinct face value, so two cards can never read identically.
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
