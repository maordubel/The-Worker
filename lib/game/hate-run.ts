/**
 * משחק השנאה — king of the hill.
 *
 * The first version was a knockout bracket in three rounds. Maor asked for something
 * simpler and better: **always head to head, and whoever you pick stays for the next
 * one.** That single change fixes the thing a bracket gets wrong — in a bracket your
 * champion beats three people and you never learn whether he'd beat the other four. A
 * king of the hill runs your pick against ten challengers in a row, so the name left
 * standing at the end actually earned it against the field.
 *
 * Ten duels, ten different challengers, no stages and no clock. There is no right
 * answer to any of it; what comes back is who survived and how far your run tracked
 * the terrace's own ranking.
 *
 * This half runs on the CLIENT — `lib/game/hate.ts` reads the archive and is
 * `server-only`. Nothing here is secret, which is why a swipe can resolve in the same
 * frame instead of waiting on a round trip.
 */

export type Enemy = {
  slug: string
  nameHe: string
  latin: string
  category: 'owner' | 'crossed' | 'rival' | 'official'
  sport: 'football' | 'basketball'
  eraHe: string
  chargeHe: string
  detailHe: string
  keyFactHe: string
  terraceRank: number
}

/** Ten challengers, so eleven names appear in a run. */
export const DUEL_COUNT = 10

export type Duel = {
  id: string
  /** the one still standing */
  holderSlug: string
  /** the one coming for him */
  challengerSlug: string
}

/**
 * The queue for a run: the opening holder, then ten challengers in order.
 *
 * The duels themselves cannot be precomputed, because who holds the hill at duel 7
 * depends on what you did at duel 6. The QUEUE can, and that is what the server deals.
 */
export function duelAt(order: string[], picks: string[], index: number): Duel | null {
  const challenger = order[index + 1]
  if (challenger === undefined) return null
  const holder = picks[index - 1] ?? order[0]
  if (holder === undefined) return null
  return { id: `d${index}`, holderSlug: holder, challengerSlug: challenger }
}

export type Verdict = {
  /** the name left standing */
  champion: Enemy
  /** how many challengers he saw off in a row at the end of the run */
  streak: number
  /** everyone who held the hill, longest reign first */
  standings: { enemy: Enemy; held: number }[]
  /** how often the pick matched the terrace ranking, 0..100 */
  agreement: number
  duelsJudged: number
  terraceChampion: Enemy
}

export function judgeRun(enemies: Enemy[], order: string[], picks: string[]): Verdict | null {
  if (picks.length === 0) return null
  const bySlug = new Map(enemies.map((enemy) => [enemy.slug, enemy]))
  const champion = bySlug.get(picks[picks.length - 1] as string)
  if (!champion) return null

  const held = new Map<string, number>()
  let matched = 0
  let streak = 0

  picks.forEach((winner, index) => {
    const duel = duelAt(order, picks, index)
    if (!duel) return
    held.set(winner, (held.get(winner) ?? 0) + 1)
    const holder = bySlug.get(duel.holderSlug)
    const challenger = bySlug.get(duel.challengerSlug)
    if (holder && challenger) {
      const terraceWinner =
        holder.terraceRank < challenger.terraceRank ? holder.slug : challenger.slug
      if (terraceWinner === winner) matched += 1
    }
    streak = winner === champion.slug ? streak + 1 : 0
  })

  const seen = new Set<string>([order[0] as string, ...picks, ...order.slice(1)])
  const standings = [...held.entries()]
    .map(([slug, count]) => ({ enemy: bySlug.get(slug), held: count }))
    .filter((row): row is { enemy: Enemy; held: number } => row.enemy !== undefined)
    .sort((a, b) => b.held - a.held || a.enemy.terraceRank - b.enemy.terraceRank)

  const terraceChampion = [...seen]
    .map((slug) => bySlug.get(slug))
    .filter((enemy): enemy is Enemy => enemy !== undefined)
    .sort((a, b) => a.terraceRank - b.terraceRank)[0]
  if (!terraceChampion) return null

  return {
    champion,
    streak,
    standings,
    agreement: Math.round((matched / picks.length) * 100),
    duelsJudged: picks.length,
    terraceChampion,
  }
}

/** What the terrace calls you, by how closely your run tracked its own ranking. */
export function standingKey(agreement: number): string {
  if (agreement >= 100) return 'hate.standing.capo'
  if (agreement >= 72) return 'hate.standing.north'
  if (agreement >= 45) return 'hate.standing.member'
  return 'hate.standing.own'
}
