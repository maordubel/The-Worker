import 'server-only'

import { createHmac } from 'node:crypto'

import { archive } from './archive'
import { facetsFor, type Position } from './roster-facets'
import { royalRumbleMatchSeed } from './royal-rumble-seeds'

export const ROYAL_RUMBLE_BUDGET = 15
export const ROYAL_RUMBLE_LINEUP_SIZE = 5
export const ROYAL_RUMBLE_OFFERS_PER_SLOT = 3
export const ROYAL_RUMBLE_FORMATION: readonly Position[] = ['GK', 'DF', 'MF', 'MF', 'FW']

export type RoyalRumblePublicPlayer = {
  slug: string
  nameHe: string
  position: Position
  positions: Position[]
  price: 1 | 2 | 3 | 4 | 5
  fromYear: number | null
  toYear: number | null
}

export type RoyalRumbleDraftSlot = {
  index: number
  position: Position
  offers: RoyalRumblePublicPlayer[]
}

export type RoyalRumbleDraft = {
  seed: number
  budget: number
  formation: readonly Position[]
  slots: RoyalRumbleDraftSlot[]
}

export type RoyalRumblePitchPlayer = {
  slug: string
  nameHe: string
  position: Position
  x: number
  y: number
}

export type RoyalRumbleFrame = {
  at: number
  scoreFor: number
  scoreAgainst: number
  commentaryHe: string
  ball: { x: number; y: number }
  us: RoyalRumblePitchPlayer[]
  them: RoyalRumblePitchPlayer[]
}

export type RoyalRumbleResult = {
  opponent: RoyalRumblePublicPlayer[]
  scoreFor: number
  scoreAgainst: number
  winner: 'us' | 'them' | 'draw'
  frames: RoyalRumbleFrame[]
}

type RatedPlayer = RoyalRumblePublicPlayer & {
  /** SERVER ONLY. Never return this object through a server action. */
  rating: number
}

/**
 * Price is intentionally coarse. Maor's rule is the product:
 *  9-29 => €1m, 30-49 => €2m, 50-64 => €3m, 65-79 => €4m, 80-99 => €5m.
 *
 * That means two €5m players may be nineteen rating points apart and the supporter can
 * never reverse-engineer the hidden score from the card price alone.
 */
export function priceForRating(rating: number): 1 | 2 | 3 | 4 | 5 {
  if (rating >= 80) return 5
  if (rating >= 65) return 4
  if (rating >= 50) return 3
  if (rating >= 30) return 2
  return 1
}

function clampRating(value: number): number {
  return Math.max(9, Math.min(99, Math.round(value)))
}

function seasonYear(label: string): number | null {
  const match = label.match(/(\d{4})/)
  return match ? Number(match[1]) : null
}

function countTitles(fromYear: number | null, toYear: number | null): number {
  if (fromYear === null || toYear === null) return 0
  return archive.trophies.filter((row) => {
    if (row.sport !== 'football' || row.result !== 'won') return false
    const year = seasonYear(row.seasonLabel)
    return year !== null && year >= fromYear && year <= toYear
  }).length
}

function countShirtSeasons(nameHe: string): number {
  return new Set(
    archive.shirtNumbers.filter((row) => row.personNameHe === nameHe).map((row) => row.seasonLabel),
  ).size
}

function countSongs(nameHe: string): number {
  return archive.songs.filter((row) => row.personNameHe === nameHe && row.sport !== 'basketball').length
}

function countRecordedBigMoments(slug: string, nameHe: string): number {
  const events = archive.matchEvents.filter(
    (row) => row.personSlug === slug || row.relatedPersonSlug === slug,
  ).length
  const rebuiltGoals = archive.goals.reduce(
    (sum, goal) => sum + goal.sequence.filter((step) => step.actorHe === nameHe).length,
    0,
  )
  return events + rebuiltGoals
}

/**
 * A tiny keyed nudge prevents the public repository from being an exact lookup table
 * for the 9-99 score. It is deliberately only +/-2: history decides the rating; the
 * key only breaks ties inside that historical estimate.
 *
 * Production should set ROYAL_RUMBLE_RATING_KEY to a private Vercel/Supabase secret.
 * The fallback keeps local/test builds deterministic without changing the public UI.
 */
function privateNudge(slug: string): number {
  const key = process.env.ROYAL_RUMBLE_RATING_KEY ?? 'royal-rumble-local-development'
  const hex = createHmac('sha256', key).update(slug).digest('hex').slice(0, 8)
  return (Number.parseInt(hex, 16) % 5) - 2
}

/**
 * Historical rating v1.
 *
 * This is intentionally evidence-driven, not fame-by-memory: years at Hapoel, trophies
 * won while the player was in the squad, documented shirt seasons, player songs and
 * sourced big-match involvement already present in the archive. The Vikipoel research
 * pass is what supplies almost every player's years/position; sparse older sources are
 * never filled by guessing.
 *
 * The score is calibrated as a FIRST PASS over all eligible archive players. Individual
 * page research can replace the estimate later without changing any game code; the
 * public contract is only price + player identity, never the rating itself.
 */
function historicalRating(slug: string, nameHe: string, position: Position): number {
  const facets = facetsFor(nameHe)
  const fromYear = facets?.fromYear ?? null
  const toYear = facets?.toYear ?? null
  const seasons =
    fromYear !== null && toYear !== null && toYear >= fromYear ? Math.max(1, toYear - fromYear + 1) : 1

  const titles = countTitles(fromYear, toYear)
  const shirtSeasons = countShirtSeasons(nameHe)
  const songs = countSongs(nameHe)
  const bigMoments = countRecordedBigMoments(slug, nameHe)

  const longevity = Math.min(42, seasons * 3)
  const honours = Math.min(24, titles * 4)
  const continuity = Math.min(10, shirtSeasons * 2)
  const terrace = Math.min(8, songs * 4)
  const moments = Math.min(15, bigMoments * 3)
  const positionBalance = position === 'GK' ? 6 : position === 'DF' ? 3 : 0

  return clampRating(10 + longevity + honours + continuity + terrace + moments + positionBalance + privateNudge(slug))
}

let ratedCache: RatedPlayer[] | null = null

function ratedPlayers(): RatedPlayer[] {
  if (ratedCache) return ratedCache

  const seen = new Set<string>()
  const rows: RatedPlayer[] = []

  for (const person of archive.people) {
    if (seen.has(person.slug)) continue
    seen.add(person.slug)

    const facets = facetsFor(person.fullNameHe)
    if (!facets?.position) continue

    const positions = facets.positions?.length ? facets.positions : [facets.position]
    const rating = historicalRating(person.slug, person.fullNameHe, facets.position)

    rows.push({
      slug: person.slug,
      nameHe: person.fullNameHe,
      position: facets.position,
      positions,
      price: priceForRating(rating),
      fromYear: facets.fromYear,
      toYear: facets.toYear,
      rating,
    })
  }

  ratedCache = rows
  return rows
}

function publicPlayer(player: RatedPlayer): RoyalRumblePublicPlayer {
  const { rating: _rating, ...safe } = player
  return safe
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items]
  const random = mulberry32(seed)
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[out[index], out[swap]] = [out[swap] as T, out[index] as T]
  }
  return out
}

function poolFor(position: Position): RatedPlayer[] {
  return ratedPlayers().filter((player) => player.positions.includes(position))
}

export function royalRumblePlayerCount(): number {
  return ratedPlayers().length
}

/**
 * Five fixed positions, three cards each. Offers are dealt before the supporter picks,
 * so the server can later validate that every submitted player really was on their
 * screen. A player cannot appear in two slots in the same draft.
 */
export function dealRoyalRumbleDraft(seed: number): RoyalRumbleDraft {
  const used = new Set<string>()
  const slots = ROYAL_RUMBLE_FORMATION.map((position, index) => {
    const candidates = shuffle(poolFor(position), seed + index * 104729).filter(
      (player) => !used.has(player.slug),
    )
    const offers = candidates.slice(0, ROYAL_RUMBLE_OFFERS_PER_SLOT)
    for (const player of offers) used.add(player.slug)
    return { index, position, offers: offers.map(publicPlayer) }
  })

  return { seed, budget: ROYAL_RUMBLE_BUDGET, formation: ROYAL_RUMBLE_FORMATION, slots }
}

function validateSelection(seed: number, slugs: readonly string[]): RatedPlayer[] | null {
  if (slugs.length !== ROYAL_RUMBLE_LINEUP_SIZE || new Set(slugs).size !== slugs.length) return null

  const draft = dealRoyalRumbleDraft(seed)
  const bySlug = new Map(ratedPlayers().map((player) => [player.slug, player]))
  const selected: RatedPlayer[] = []

  for (let index = 0; index < draft.slots.length; index += 1) {
    const slug = slugs[index]
    const slot = draft.slots[index]
    if (!slug || !slot?.offers.some((offer) => offer.slug === slug)) return null
    const player = bySlug.get(slug)
    if (!player) return null
    selected.push(player)
  }

  const cost = selected.reduce((sum, player) => sum + player.price, 0)
  return cost <= ROYAL_RUMBLE_BUDGET ? selected : null
}

/**
 * The opponent is determined from the round seed alone — never from the supporter's
 * picks. It obeys the same €15m cap, so the game cannot secretly counter-pick a strong
 * lineup after seeing it.
 */
function dealOpponent(seed: number): RatedPlayer[] {
  const random = mulberry32((seed ^ 0x51f15e) >>> 0)
  const used = new Set<string>()
  const team: RatedPlayer[] = []
  let spent = 0

  for (let index = 0; index < ROYAL_RUMBLE_FORMATION.length; index += 1) {
    const position = ROYAL_RUMBLE_FORMATION[index] as Position
    const remainingSlots = ROYAL_RUMBLE_FORMATION.length - index - 1
    const maxPrice = ROYAL_RUMBLE_BUDGET - spent - remainingSlots
    const legal = poolFor(position).filter(
      (player) => !used.has(player.slug) && player.price <= maxPrice,
    )
    const candidates = legal.length > 0 ? legal : poolFor(position).filter((player) => !used.has(player.slug))
    const player = candidates[Math.floor(random() * candidates.length)]
    if (!player) continue
    used.add(player.slug)
    team.push(player)
    spent += player.price
  }

  return team
}

function baseShape(side: 'us' | 'them', team: RatedPlayer[]): RoyalRumblePitchPlayer[] {
  const x = side === 'us' ? [10, 28, 47, 47, 70] : [90, 72, 53, 53, 30]
  const y = [50, 50, 34, 66, 50]
  return team.map((player, index) => ({
    slug: player.slug,
    nameHe: player.nameHe,
    position: ROYAL_RUMBLE_FORMATION[index] ?? player.position,
    x: x[index] ?? 50,
    y: y[index] ?? 50,
  }))
}

function moveShape(
  shape: RoyalRumblePitchPlayer[],
  random: () => number,
  attackDirection: 1 | -1,
): RoyalRumblePitchPlayer[] {
  return shape.map((player, index) => {
    if (index === 0) return player
    const forward = (5 + random() * 8) * attackDirection
    const vertical = (random() - 0.5) * 16
    return {
      ...player,
      x: Math.max(6, Math.min(94, player.x + forward)),
      y: Math.max(12, Math.min(88, player.y + vertical)),
    }
  })
}

function scorer(team: RatedPlayer[], random: () => number): RatedPlayer {
  const weighted = team.flatMap((player, index) => {
    const weight = index === 4 ? 5 : index >= 2 ? 3 : index === 1 ? 2 : 1
    return Array.from({ length: weight }, () => player)
  })
  return weighted[Math.floor(random() * weighted.length)] ?? team[team.length - 1]!
}

function partner(team: RatedPlayer[], scorerPlayer: RatedPlayer, random: () => number): RatedPlayer {
  const candidates = team.filter((player) => player.slug !== scorerPlayer.slug && player.position !== 'GK')
  return candidates[Math.floor(random() * candidates.length)] ?? scorerPlayer
}

function simulate(seed: number, us: RatedPlayer[], them: RatedPlayer[]): RoyalRumbleResult {
  const random = mulberry32((seed ^ 0x9e3779b9) >>> 0)
  const usPower = us.reduce((sum, player) => sum + player.rating, 0)
  const themPower = them.reduce((sum, player) => sum + player.rating, 0)
  const delta = usPower - themPower

  const usChance = Math.max(0.18, Math.min(0.72, 0.45 + delta / 850))
  const totalGoals = 1 + Math.floor(random() * 5)
  let scoreFor = 0
  let scoreAgainst = 0
  let usShape = baseShape('us', us)
  let themShape = baseShape('them', them)

  const frames: RoyalRumbleFrame[] = [
    {
      at: 0,
      scoreFor,
      scoreAgainst,
      commentaryHe: 'השריקה. רויאל ראמבל יוצא לדרך.',
      ball: { x: 50, y: 50 },
      us: usShape,
      them: themShape,
    },
  ]

  for (let goal = 0; goal < totalGoals; goal += 1) {
    const ours = random() < usChance
    const attack = ours ? us : them
    const player = scorer(attack, random)
    const helper = partner(attack, player, random)
    const baseMinute = 6 + goal * 9

    usShape = moveShape(usShape, random, ours ? 1 : -1)
    themShape = moveShape(themShape, random, ours ? -1 : 1)

    frames.push({
      at: baseMinute,
      scoreFor,
      scoreAgainst,
      commentaryHe: ours
        ? `${helper.nameHe} מרוויח מטר, מרים את הראש ומוצא את ${player.nameHe}.`
        : `${helper.nameHe} מושך את הלחץ ומשחרר את ${player.nameHe} קדימה.`,
      ball: { x: ours ? 68 + random() * 10 : 32 - random() * 10, y: 30 + random() * 40 },
      us: usShape,
      them: themShape,
    })

    frames.push({
      at: baseMinute + 1,
      scoreFor,
      scoreAgainst,
      commentaryHe: ours
        ? `${player.nameHe} נכנס למצב. היציע כבר עומד.`
        : `${player.nameHe} מול השער. החמישייה שלך נסוגה עד הקו.`,
      ball: { x: ours ? 84 + random() * 5 : 16 - random() * 5, y: 38 + random() * 24 },
      us: usShape,
      them: themShape,
    })

    if (ours) scoreFor += 1
    else scoreAgainst += 1

    frames.push({
      at: baseMinute + 2,
      scoreFor,
      scoreAgainst,
      commentaryHe: ours ? `שער! ${player.nameHe} שם את זה בפנים.` : `היריבה כובשת. ${player.nameHe}.`,
      ball: { x: ours ? 94 : 6, y: 44 + random() * 12 },
      us: usShape,
      them: themShape,
    })

    if (goal < totalGoals - 1) {
      const recovering = random() < 0.5
      frames.push({
        at: baseMinute + 4,
        scoreFor,
        scoreAgainst,
        commentaryHe: recovering
          ? 'הקצב לא יורד. תיקול באמצע, הכדור שוב חופשי והזירה נפתחת.'
          : 'החמישיות מסתדרות מחדש. אין זמן לנשום במשחק של דקה.',
        ball: { x: 45 + random() * 10, y: 35 + random() * 30 },
        us: baseShape('us', us),
        them: baseShape('them', them),
      })
      usShape = baseShape('us', us)
      themShape = baseShape('them', them)
    }
  }

  frames.push({
    at: 60,
    scoreFor,
    scoreAgainst,
    commentaryHe:
      scoreFor > scoreAgainst ? 'נגמר. החמישייה שלך לוקחת את הקרב.' : scoreFor < scoreAgainst ? 'נגמר. הפעם היריבה נשארה עומדת.' : 'נגמר. תיקו בזירה.',
    ball: { x: 50, y: 50 },
    us: usShape,
    them: themShape,
  })

  return {
    opponent: them.map(publicPlayer),
    scoreFor,
    scoreAgainst,
    winner: scoreFor === scoreAgainst ? 'draw' : scoreFor > scoreAgainst ? 'us' : 'them',
    frames,
  }
}

function mirrorPitchPlayer(player: RoyalRumblePitchPlayer): RoyalRumblePitchPlayer {
  return { ...player, x: 100 - player.x }
}

function awayPerspective(result: RoyalRumbleResult, home: RatedPlayer[]): RoyalRumbleResult {
  return {
    opponent: home.map(publicPlayer),
    scoreFor: result.scoreAgainst,
    scoreAgainst: result.scoreFor,
    winner: result.winner === 'draw' ? 'draw' : result.winner === 'us' ? 'them' : 'us',
    frames: result.frames.map((frame) => ({
      ...frame,
      scoreFor: frame.scoreAgainst,
      scoreAgainst: frame.scoreFor,
      ball: { x: 100 - frame.ball.x, y: frame.ball.y },
      us: frame.them.map(mirrorPitchPlayer),
      them: frame.us.map(mirrorPitchPlayer),
    })),
  }
}

export function playRoyalRumbleHeadToHead(
  matchSeed: number,
  homeOfferSeed: number,
  homeSlugs: readonly string[],
  guestOfferSeed: number,
  guestSlugs: readonly string[],
): { home: RoyalRumbleResult; away: RoyalRumbleResult } | null {
  const home = validateSelection(homeOfferSeed, homeSlugs)
  const away = validateSelection(guestOfferSeed, guestSlugs)
  if (!home || !away) return null
  const resolved = simulate(matchSeed >>> 0, home, away)
  return { home: resolved, away: awayPerspective(resolved, home) }
}

/** The only solo function a server action needs. Ratings never cross this boundary. */
export function playRoyalRumble(seed: number, slugs: readonly string[]): RoyalRumbleResult | null {
  const selected = validateSelection(seed, slugs)
  if (!selected) return null
  const matchSeed = royalRumbleMatchSeed(seed)
  const opponent = dealOpponent(matchSeed)
  if (opponent.length !== ROYAL_RUMBLE_LINEUP_SIZE) return null
  return simulate(matchSeed, selected, opponent)
}
