/**
 * משחק השנאה — the bracket's rules, with no archive behind them.
 *
 * This half runs on the CLIENT. `lib/game/hate.ts` reads the archive and is
 * `server-only` (the archive holds trivia answers, so it can never cross); everything
 * here works on the eight plain enemy objects the page already handed down, so a tap
 * resolves in the same frame instead of waiting on a round trip. There is nothing to
 * hide in a game with no right answer — that is exactly why it can be this fast.
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

export type Duel = {
  /** `r{round}-{index}` — stable, so a pick can be replayed */
  id: string
  round: 0 | 1 | 2
  aSlug: string
  bSlug: string
}

export const BRACKET_SIZE = 8
export const DUEL_COUNT = BRACKET_SIZE - 1

/** The next round, built from the winners of the one before it. */
export function nextRound(winners: string[], round: 1 | 2): Duel[] {
  const duels: Duel[] = []
  for (let index = 0; index + 1 < winners.length; index += 2) {
    const a = winners[index]
    const b = winners[index + 1]
    if (!a || !b) continue
    duels.push({ id: `r${round}-${index / 2}`, round, aSlug: a, bSlug: b })
  }
  return duels
}

export type Verdict = {
  champion: Enemy
  standings: { enemy: Enemy; wins: number }[]
  /** how often the player's pick matched the terrace's ranking, 0..100 */
  agreement: number
  duelsJudged: number
  terraceChampion: Enemy
}

/**
 * The verdict. `agreement` counts, over every duel actually fought, how often the
 * player put the higher-ranked enemy through — a measure of how close your terrace is
 * to the house terrace, never a score you can fail.
 */
export function judgeRun(
  enemies: Enemy[],
  picks: { aSlug: string; bSlug: string; winner: string }[],
): Verdict | null {
  if (picks.length === 0) return null
  const bySlug = new Map(enemies.map((enemy) => [enemy.slug, enemy]))
  const last = picks[picks.length - 1]
  if (!last) return null
  const champion = bySlug.get(last.winner)
  if (!champion) return null

  const wins = new Map<string, number>()
  const drawn = new Set<string>()
  let matched = 0
  for (const pick of picks) {
    drawn.add(pick.aSlug)
    drawn.add(pick.bSlug)
    wins.set(pick.winner, (wins.get(pick.winner) ?? 0) + 1)
    const a = bySlug.get(pick.aSlug)
    const b = bySlug.get(pick.bSlug)
    if (!a || !b) continue
    const terraceWinner = a.terraceRank < b.terraceRank ? a.slug : b.slug
    if (terraceWinner === pick.winner) matched += 1
  }

  const standings = [...drawn]
    .map((slug) => bySlug.get(slug))
    .filter((enemy): enemy is Enemy => enemy !== undefined)
    .map((enemy) => ({ enemy, wins: wins.get(enemy.slug) ?? 0 }))
    .sort((x, y) => y.wins - x.wins || x.enemy.terraceRank - y.enemy.terraceRank)

  const terraceChampion = [...standings].sort(
    (x, y) => x.enemy.terraceRank - y.enemy.terraceRank,
  )[0]?.enemy
  if (!terraceChampion) return null

  return {
    champion,
    standings,
    agreement: Math.round((matched / picks.length) * 100),
    duelsJudged: picks.length,
    terraceChampion,
  }
}

/** What the terrace calls you, by how closely your bracket ran with its own. */
export function standingKey(agreement: number): string {
  if (agreement >= 100) return 'hate.standing.capo'
  if (agreement >= 72) return 'hate.standing.north'
  if (agreement >= 45) return 'hate.standing.member'
  return 'hate.standing.own'
}
