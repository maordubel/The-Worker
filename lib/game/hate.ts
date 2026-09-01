import 'server-only'

import { archive, rng, shuffle } from './archive'
import { BRACKET_SIZE, type Duel, type Enemy } from './hate-run'

/**
 * משחק השנאה — the draw.
 *
 * Eight enemies, a straight knockout, seven taps. You are not being asked a question
 * with a right answer — you are being asked who you hate more, and there is no such
 * thing as a wrong answer to that. What the game gives back is a verdict: YOUR number
 * one, printed as a wanted bill, and how far your bracket ran with the terrace's own
 * ranking.
 *
 * Only the DRAW lives here, because only the draw needs the archive; the rules run on
 * the client (`hate-run.ts`) so a tap resolves in the same frame.
 *
 * The roster is deliberately cross-sport. Rule 14 keeps FOOTBALL QUESTIONS clean; it
 * was never a rule about who the club's enemies are. Ofer Yanai and Shaul Eisenberg sit
 * in this bracket because Maor — who founded Hapoel Ussishkin and stood as a capo of
 * Ultras Hapoel — says the terrace hates them, and on that question he is the source.
 * The `sport` field travels with every row, so the wall between the sports is a field
 * rather than an omission.
 */

export type { Duel, Enemy } from './hate-run'

function roster(): Enemy[] {
  return archive.enemies.map((row) => ({
    slug: row.slug,
    nameHe: row.nameHe,
    latin: row.latin,
    category: row.category,
    sport: row.sport,
    eraHe: row.eraHe,
    chargeHe: row.chargeHe,
    detailHe: row.detailHe,
    keyFactHe: row.keyFactHe,
    terraceRank: row.terraceRank,
  }))
}

export function rosterSize(): number {
  return archive.enemies.length
}

/**
 * The eight who make this bracket, and the four opening duels.
 *
 * The draw is seeded but not flat: the terrace's top four are spread one per quarter,
 * exactly as a cup draw seeds its favourites, so the big names cannot knock each other
 * out in the first round. A bracket where Taviv meets Yanai at the quarters is a
 * bracket that wasted its best fight.
 */
export function dealBracket(seed: number): { enemies: Enemy[]; duels: Duel[] } {
  const random = rng(seed)
  const all = roster().sort((a, b) => a.terraceRank - b.terraceRank)
  const half = BRACKET_SIZE / 2
  const seeded = shuffle(all.slice(0, half), random)
  const rest = shuffle(all.slice(half), random).slice(0, half)

  const enemies: Enemy[] = []
  const duels: Duel[] = []
  for (let index = 0; index < half; index += 1) {
    const top = seeded[index]
    const other = rest[index]
    if (!top || !other) continue
    // coin-flip which side of the plate each one is printed on, so the seeding is not
    // readable from the layout
    const [a, b] = random() < 0.5 ? [top, other] : [other, top]
    if (!a || !b) continue
    enemies.push(a, b)
    duels.push({ id: `r0-${index}`, round: 0, aSlug: a.slug, bSlug: b.slug })
  }
  return { enemies, duels }
}
