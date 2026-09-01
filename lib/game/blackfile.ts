import 'server-only'

import { archive, rng, shuffle } from './archive'

/**
 * התיק השחור — gate 11.
 *
 * Maor asked for a "hatred game", ranking the figures Hapoel supporters resent. The
 * research pass changed what that game could honestly be, and the change made it
 * better:
 *
 *   · Three of the six names he listed do not belong here. Ofer Yanai and Shaul
 *     Eisenberg have no documented connection to the FOOTBALL club — both are
 *     basketball, and rule 14 keeps the sports apart. Shimon Gershon never played for
 *     Maccabi at all: he left for Beitar Jerusalem, and he retired at 33 on medical
 *     grounds, which is not terrace material under any framing.
 *   · Eran Zahavi did not move Hapoel → Maccabi. He left for Palermo in 2011 and
 *     signed for Maccabi from Palermo nineteen months later.
 *
 * So the game is not "rank these people by how much you hate them" — a ranking of
 * feeling cannot be graded, and a ranking of PEOPLE invites the app to publish
 * judgements about named individuals that no source supports. It is
 * **"מי חצה את הכביש"**: a fast binary on documented transfers, where the traps are
 * exactly the two beliefs the record contradicts. It is more fun than a hate-ranking
 * because the player is wrong about things they were sure of, and it leaves them
 * knowing something true.
 *
 * Every card carries its own source, and the reveal is the story.
 */

export type Verdict = 'crossed' | 'did_not'

export type FileCard = {
  slug: string
  /** the name on the card, or the headline for a dated event */
  subjectHe: string
  /** what the player is being asked to judge */
  promptHe: string
  kind: 'crossing' | 'myth' | 'event'
}

export type CardVerdict = {
  slug: string
  correct: boolean
  answer: Verdict
  titleHe: string
  bodyHe: string
  toClubHe: string | null
  feeEur: number | null
  happenedOn: string | null
  sourceTitle: string
  sourceUrl: string | null
}

export const ROUND_SIZE = 8

/** Only the cards that can be judged crossed / did-not — the transfer questions. */
function transferCards() {
  return archive.grievances.filter((row) => row.kind === 'crossing' || row.kind === 'myth')
}

/** The dated events, which drive the second half of the round: what came first. */
function datedEvents() {
  return archive.grievances.filter(
    (row) => row.kind === 'event' && row.happenedOn !== null,
  )
}

export function dealFile(seed: number): FileCard[] {
  const random = rng(seed)
  return shuffle([...transferCards()], random).map((row) => ({
    slug: row.slug,
    subjectHe: row.personNameHe ?? row.titleHe,
    promptHe: row.titleHe,
    kind: row.kind,
  }))
}

/** Graded on the server. A `myth` row is the card whose true answer is "did not". */
export function judge(slug: string, answer: Verdict): CardVerdict | null {
  const row = archive.grievances.find((item) => item.slug === slug)
  if (!row) return null
  const truth: Verdict = row.kind === 'crossing' ? 'crossed' : 'did_not'
  return {
    slug: row.slug,
    correct: answer === truth,
    answer: truth,
    titleHe: row.titleHe,
    bodyHe: row.bodyHe,
    toClubHe: row.toClubHe ?? null,
    feeEur: row.feeEur ?? null,
    happenedOn: row.happenedOn,
    sourceTitle: row.sourceTitle,
    sourceUrl: row.sourceUrl,
  }
}

/* ------------------------------------------------------------- what came first */

export type PairCard = {
  id: string
  aSlug: string
  bSlug: string
  aTitleHe: string
  bTitleHe: string
}

/**
 * The second half: two dated events, which came first. Ordering the whole decade at
 * once is a memory test; two at a time is a judgement, and it moves fast enough to
 * keep a round alive.
 */
export function dealPairs(seed: number, count = 4): PairCard[] {
  const events = shuffle([...datedEvents()], rng(seed * 7 + 3))
  const pairs: PairCard[] = []
  for (let index = 0; index + 1 < events.length && pairs.length < count; index += 2) {
    const a = events[index]
    const b = events[index + 1]
    if (!a || !b) continue
    pairs.push({
      id: `${a.slug}|${b.slug}`,
      aSlug: a.slug,
      bSlug: b.slug,
      aTitleHe: a.titleHe,
      bTitleHe: b.titleHe,
    })
  }
  return pairs
}

export type PairVerdict = {
  correct: boolean
  firstSlug: string
  aDate: string | null
  bDate: string | null
  aBodyHe: string
  bBodyHe: string
}

export function judgePair(id: string, pickedSlug: string): PairVerdict | null {
  const [aSlug, bSlug] = id.split('|')
  const a = archive.grievances.find((row) => row.slug === aSlug)
  const b = archive.grievances.find((row) => row.slug === bSlug)
  if (!a || !b || !a.happenedOn || !b.happenedOn) return null
  const first = a.happenedOn <= b.happenedOn ? a : b
  return {
    correct: pickedSlug === first.slug,
    firstSlug: first.slug,
    aDate: a.happenedOn,
    bDate: b.happenedOn,
    aBodyHe: a.bodyHe,
    bBodyHe: b.bodyHe,
  }
}

export function fileSize(): number {
  return transferCards().length + datedEvents().length
}
