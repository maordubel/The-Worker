import 'server-only'

import { positionOf, rotate } from '@/lib/rotation/deck'
import { archive, rng, shuffle } from './archive'
import { DUEL_COUNT, type Enemy } from './hate-run'

/**
 * משחק השנאה — the draw.
 *
 * Eleven names: one to open on the hill and ten to come for him, in order. The duels
 * are not dealt because they cannot be — who holds the hill at duel 7 depends on what
 * you did at duel 6. The queue is what is deterministic, and the queue is what a `seed`
 * has to reproduce for a shared link to hand over the same run.
 *
 * The queue is drawn across the whole of Maor's fifty-six, alternating between the top
 * half of his ranking and the bottom half, so a run is never ten household names in a
 * row and never ten obscure ones. Every run pulls a different eleven.
 *
 * The roster is deliberately cross-sport. Rule 14 keeps FOOTBALL QUESTIONS clean; it
 * was never a rule about who the club's enemies are, and `sport` travels on every row.
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

/** The eleven who appear in this run, in the order they walk on. */
export function dealQueue(
  seed: number,
  cursor = 0,
): { enemies: Enemy[]; order: string[] } {
  const all = roster().sort((a, b) => a.terraceRank - b.terraceRank)
  // Fifty-six names, eleven to a hill. The alternation between the two halves of the
  // ranking is what makes the duels feel graded rather than random, so the cursor
  // advances INSIDE each half rather than over the merged order — five rounds use the
  // whole file, and the sixth is a different shuffle of it.
  const at = positionOf(seed, cursor, all.length, DUEL_COUNT + 1)
  const random = rng(at.seed)
  const midpoint = Math.ceil(all.length / 2)
  const half = Math.ceil((DUEL_COUNT + 1) / 2)
  const top = rotate(shuffle(all.slice(0, midpoint), random), at.slot * half)
  const rest = rotate(shuffle(all.slice(midpoint), random), at.slot * half)

  const order: Enemy[] = []
  const taken = new Set<string>()
  for (let index = 0; index <= DUEL_COUNT; index += 1) {
    const pool = index % 2 === 0 ? top : rest
    // A rotated half can hand back somebody the other half already produced only if the
    // ranking split moved; guarding here costs nothing and a duel against oneself is
    // the kind of thing that is only ever found by a player.
    let next = pool.shift()
    while (next && taken.has(next.slug)) next = pool.shift()
    if (next) {
      taken.add(next.slug)
      order.push(next)
    }
  }
  return { enemies: order, order: order.map((enemy) => enemy.slug) }
}
