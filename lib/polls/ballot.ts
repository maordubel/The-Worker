import type { MessageKey } from '@/lib/i18n'

/**
 * שער 7 — אגף הסקרים.
 *
 * The gate Maor cut the crest game for. Eight questions, and every one of them is an
 * argument this terrace has already had a thousand times: the keeper, the centre back,
 * the number you would wear.
 *
 * **What this wing is honest about.** A poll is a count, and a count needs other people.
 * Until the wing has a live table behind it there is exactly one voter — you — and the
 * screen says so rather than drawing bars that mean nothing. So the thing the wing gives
 * back today is not a percentage, it is a BALLOT: your eight picks on one printed slip,
 * with your name on it, made to be shared. That is also what fills the count when the
 * table arrives, which is the right order to build it in. Inventing a baseline so the
 * bars look busy would be inventing data (rule 11), and it would be the kind of lie that
 * is very hard to take back once people have seen it.
 *
 * **What the questions can and cannot ask.** The archive holds 637 names and NO
 * positions for almost any of them. So "who is the all-time keeper" cannot offer a
 * filtered list of goalkeepers — there is no such list, and building one by guessing
 * would put a striker in the keeper's shortlist and make the whole wing untrustworthy.
 * Every player question therefore opens the WHOLE roster with the search behind it. The
 * supporter knows who the keepers are; the archive does not, and it does not pretend to.
 */

export type PollKind = 'roster' | 'number' | 'position'

export type PollQuestion = {
  id: string
  kind: PollKind
  /** the question, in the voice of somebody asking it across a table */
  ask: MessageKey
  /** the Latin line on the slip's row */
  latin: string
}

/**
 * The order is deliberate. It opens on the one question everybody already has an answer
 * to and closes on the two that are about the voter rather than the club — a slip that
 * ends on "which number would you wear" ends on the voter's own shirt.
 */
export const BALLOT: readonly PollQuestion[] = [
  { id: 'favourite', kind: 'roster', ask: 'poll.favourite', latin: 'ALL-TIME FAVOURITE' },
  { id: 'keeper', kind: 'roster', ask: 'poll.keeper', latin: 'GOALKEEPER' },
  { id: 'centreback', kind: 'roster', ask: 'poll.centreback', latin: 'CENTRE BACK' },
  { id: 'midfield', kind: 'roster', ask: 'poll.midfield', latin: 'MIDFIELD' },
  { id: 'striker', kind: 'roster', ask: 'poll.striker', latin: 'STRIKER' },
  { id: 'foreign', kind: 'roster', ask: 'poll.foreign', latin: 'BEST FOREIGNER' },
  { id: 'number', kind: 'number', ask: 'poll.number', latin: 'YOUR NUMBER' },
  { id: 'position', kind: 'position', ask: 'poll.position', latin: 'YOUR POSITION' },
] as const

/**
 * The shirt numbers on offer.
 *
 * 1 to 99, because that is the range a squad number lives in and cutting it at 11 would
 * decide for the voter that they are a starter. The picker is a grid, not a list.
 */
export const NUMBERS: readonly number[] = Array.from({ length: 99 }, (_, index) => index + 1)

/**
 * The positions, as the pitch already names them.
 *
 * These are the role labels the lineup formations use, lifted by hand rather than
 * imported: `lib/game/lineup.ts` is `server-only` and this file is read by the client.
 * Ten roles, one line of the pitch each, no invented specialisations.
 */
export const POSITIONS: readonly { id: string; he: MessageKey }[] = [
  { id: 'GK', he: 'pos.gk' },
  { id: 'CB', he: 'pos.cb' },
  { id: 'FB', he: 'pos.fb' },
  { id: 'DM', he: 'pos.dm' },
  { id: 'CM', he: 'pos.cm' },
  { id: 'AM', he: 'pos.am' },
  { id: 'W', he: 'pos.w' },
  { id: 'ST', he: 'pos.st' },
] as const

/** questionId → the pick, as the label that will be printed on the slip */
export type Ballot = Record<string, string>

export function ballotFilled(ballot: Ballot): number {
  return BALLOT.filter((question) => (ballot[question.id] ?? '') !== '').length
}

export function ballotComplete(ballot: Ballot): boolean {
  return ballotFilled(ballot) === BALLOT.length
}

/**
 * A tally row. Nothing produces these yet on the client — see `store.ts` — but the
 * shape is fixed here so the screen that will draw the bars is written against it now
 * rather than being rewritten when the table lands.
 */
export type TallyRow = { pick: string; votes: number }
export type Tally = { total: number; rows: TallyRow[] }
