import 'server-only'

import { matchLine } from '@/components/ui/Num'

import { createHash } from 'node:crypto'

import { archive, nameOf, rng, shuffle } from './archive'
import { TIMELINE_LENGTH, type BlindCard, type DatedCard } from './timeline-run'

/**
 * ציר הזמן — build the timeline one card at a time.
 *
 * The old version dealt five cards, let you reorder them with arrows, and finished with
 * a "שלח" button. Maor called it urgent, and he was right: that is a FORM. Nothing
 * happens until you press the button, there is no cost to being wrong, and five arrows
 * of fiddling produce one verdict at the end.
 *
 * This is the card game the mode was always trying to be. One card at a time, and the
 * only question is WHERE it goes on the timeline you have already built. That single
 * change fixes everything the form got wrong:
 *
 *  · **It resolves instantly.** Choosing a slot IS the answer — there is no button
 *    between the decision and the consequence (rule 21).
 *  · **It gets harder as it goes.** Slotting card two between two dates is a coin flip;
 *    slotting card nine into one of ten gaps is knowledge.
 *  · **A wrong answer still teaches.** The card is inserted at its TRUE position either
 *    way, so the board is always a truthful timeline and you can see what you got wrong
 *    still sitting there.
 *
 * That last rule is also what makes the whole thing server-authoritative for free: since
 * a card lands in its real place whatever the player did, the board after `k` cards is a
 * pure function of the seed. The client is told the dates of cards already resolved —
 * they have been earned — and never the date of the card in hand.
 */

/**
 * The public id is a HASH, not a key.
 *
 * The natural keys carry dates — `euro:2012-el-groups:2012-11-22`, `match:2001/02:צלסי`
 * — and an id travels to the client with every card. Stripping the `on` field while
 * shipping the date inside the identifier is not hiding it; a player reading the DOM
 * would have had the answer to every card in hand. Caught by the test that asserts no
 * ISO date appears anywhere in the dealt queue.
 *
 * A hash keeps it deterministic (the board is re-derived from the seed on every grade,
 * so ids must be stable across calls) while carrying no information at all.
 */
function publicId(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 12)
}

// The shapes and the run length live in the client half, so a component can import
// them without dragging the archive and `node:crypto` into the browser bundle.
export { TIMELINE_LENGTH, type BlindCard, type DatedCard } from './timeline-run'

/**
 * A hint must not leak the answer. Source titles routinely carry the date
 * ("ספורט1/מעריב, 12.6.2015"), which would hand the ordering away, so every number
 * that could be a year or a date is stripped before the hint is shown.
 */
const YEAR = /\b(1[89]|20)\d{2}\b/

function safeHint(raw: string): string {
  return raw
    .replace(/\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}/g, '')
    .replace(/\b(1[89]|20)\d{2}\b/g, '')
    .replace(/\d{2,4}\s*\/\s*\d{2,4}/g, '')
    .replace(/[·,]\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function pool(): DatedCard[] {
  const out: DatedCard[] = []

  for (const moment of archive.moments) {
    if (!moment.happenedOn) continue
    out.push({
      id: publicId(`moment:${moment.slug}`),
      title: moment.titleHe,
      hint: safeHint(moment.sourceTitle),
      on: moment.happenedOn,
    })
  }

  for (const match of archive.matches) {
    if (!match.playedOn) continue
    out.push({
      id: publicId(`match:${match.seasonLabel}:${match.awayClubSlug}`),
      title: matchLine(
        nameOf.club(match.homeClubSlug),
        match.homeScore,
        nameOf.club(match.awayClubSlug),
        match.awayScore,
      ),
      hint: safeHint(nameOf.competition(match.competitionSlug)),
      on: match.playedOn,
    })
  }

  // The European record is the deepest dated material the archive holds — every leg of
  // every tie, with a real date. It is also the material this terrace can actually
  // order, which is what makes the mode playable rather than a lottery.
  for (const tie of archive.euroTies) {
    for (const leg of tie.legs) {
      if (!leg.playedOn) continue
      // Through `matchLine`, not hand-built: reversed scorelines were a real bug in
      // this project once, and one helper owning the convention is what fixed it.
      const score = leg.home
        ? matchLine('הפועל', leg.forHapoel, tie.opponentHe, leg.against)
        : matchLine(tie.opponentHe, leg.against, 'הפועל', leg.forHapoel)
      out.push({
        id: publicId(`euro:${tie.slug}:${leg.playedOn}`),
        title: score,
        hint: safeHint(`${tie.competitionHe} · ${tie.stageHe}`),
        on: leg.playedOn,
      })
    }
  }

  for (const grievance of archive.grievances) {
    if (!grievance.happenedOn || grievance.dateConfirmed !== true) continue
    out.push({
      id: publicId(`grievance:${grievance.slug}`),
      title: grievance.titleHe,
      hint: safeHint(grievance.sourceTitle),
      on: grievance.happenedOn,
    })
  }

  // One card per date, so two cards can never be tied and both "right".
  // A card whose own title states a year is dropped rather than mangled — rewriting a
  // fact to hide its date would be worse than not asking about it.
  const byDate = new Map<string, DatedCard>()
  for (const item of out) {
    if (YEAR.test(item.title)) continue
    if (!byDate.has(item.on)) byDate.set(item.on, item)
  }
  return [...byDate.values()].sort((a, b) => a.on.localeCompare(b.on))
}

export function timelineAvailable(): boolean {
  return pool().length >= TIMELINE_LENGTH + 1
}

export function timelinePoolSize(): number {
  return pool().length
}

/**
 * The cards of one run: an anchor to open the board, then ten to place.
 *
 * The anchor is drawn from the MIDDLE of the chronology rather than at random. Opening
 * on the club's oldest or newest fact makes the first three placements trivially
 * one-sided — every card lands on the same end — and a game whose opening moves cannot
 * be got wrong has thrown away its opening moves.
 */
function runCards(seed: number): DatedCard[] {
  const all = pool()
  const drawn = shuffle(all, rng(seed)).slice(0, TIMELINE_LENGTH + 1)
  const byDate = [...drawn].sort((a, b) => a.on.localeCompare(b.on))
  const middle = byDate[Math.floor(byDate.length / 2)] as DatedCard
  return [middle, ...drawn.filter((card) => card.id !== middle.id)]
}

function blind({ id, title, hint }: DatedCard): BlindCard {
  return { id, title, hint }
}

export type TimelineDeal = {
  anchor: DatedCard
  /** the ten to place, in the order they are dealt — dates stripped */
  queue: BlindCard[]
}

export function dealTimelineRun(seed: number): TimelineDeal {
  const cards = runCards(seed)
  const [anchor, ...queue] = cards
  return {
    anchor: anchor as DatedCard,
    queue: queue.slice(0, TIMELINE_LENGTH).map(blind),
  }
}

/**
 * The board after `placed` cards have been resolved, oldest first, with their dates.
 *
 * Safe to send to the client: every card on it has already been played, and the one in
 * hand is never in it. This is derivable purely from the seed BECAUSE a card is inserted
 * at its true position whether or not the player was right — which is the design
 * decision that makes the run honest and the grading cheap at the same time.
 */
export function boardAfter(seed: number, placed: number): DatedCard[] {
  const cards = runCards(seed)
  const anchor = cards[0] as DatedCard
  const resolved = cards.slice(1, 1 + Math.max(0, Math.min(placed, TIMELINE_LENGTH)))
  return [anchor, ...resolved].sort((a, b) => a.on.localeCompare(b.on))
}

export type InsertVerdict = {
  correct: boolean
  /** the card that was in hand, with its date now shown */
  card: DatedCard
  /** the slot it actually belonged in, 0..board.length */
  position: number
  /** the board as it now stands */
  board: DatedCard[]
  /** true once every card has been placed */
  done: boolean
}

/**
 * Grade one placement. `slot` is the gap index: 0 is before the first card on the
 * board, `board.length` is after the last.
 */
export function gradeInsert(seed: number, placed: number, slot: number): InsertVerdict | null {
  const cards = runCards(seed)
  const card = cards[placed + 1]
  if (!card) return null

  const board = boardAfter(seed, placed)
  // Where it belongs: the number of cards already on the board that are older than it.
  const position = board.filter((other) => other.on.localeCompare(card.on) < 0).length

  return {
    correct: slot === position,
    card,
    position,
    board: boardAfter(seed, placed + 1),
    done: placed + 1 >= TIMELINE_LENGTH,
  }
}
