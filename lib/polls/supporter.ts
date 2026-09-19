import type { MessageKey } from '@/lib/i18n'

import { BALLOT, type Ballot } from './ballot'
import { reasonCount, type Reasons } from './reasons'

/**
 * תעודת אוהד — the slip, read back as a person.
 *
 * Eight picks are an argument. The same eight picks plus a name and a number are an
 * IDENTITY, and that is the whole of what the reference's "Supporter ID" adds: your
 * favourite, the number on your back, where you would play, and the reasons you gave.
 * It is the thing gate 10 wants as an input (the brief's §18 — "Gate 7 should become one
 * of the inputs to Worker Card identity") and the thing a share card can be about.
 *
 * **It stores nothing.** Every field is derived from state that already exists:
 *
 *  · the picks are the ballot, which `lib/polls/store.ts` already keeps;
 *  · the reasons are `lib/polls/reasons.ts`, kept beside them;
 *  · the NAME and the NUMBER are the member book's (`lib/game/member.ts`) —
 *    `nameHe` and `number`, the two fields gate 10 has printed on a shirt since it was
 *    built and `lib/portal/sync.ts` already carries up to `app_profile.display_name`.
 *
 * That last one is the decision worth writing down. The obvious build is a `supporter`
 * record of its own, and it would have been a second place the app keeps somebody's name
 * — so signing in would have carried up one of them and the shirt in gate 10 would have
 * quietly disagreed with the shirt in gate 7. The brief says it in one line: *"do not
 * duplicate these fields separately if the profile already stores them."* So gate 7 does
 * not own a name; it is a second door onto the one the card already has (rule 59).
 *
 * Nothing in this file touches the browser. The caller reads the book and hands the two
 * fields in, which is what lets the whole derivation be tested against fixtures.
 */

export type SupporterReason = {
  questionId: string
  /** the question, as the slip prints it */
  ask: MessageKey
  /** what was picked */
  pick: string
  /** why — one of that question's own chips, never free text */
  reason: MessageKey
}

export type SupporterId = {
  /** the name on the shirt, or null when the supporter has not put one there */
  nameHe: string | null
  /** the number on the back, 1–99, or null */
  number: number | null
  /** where they would play, in the pitch's own words */
  positionHe: string | null
  /** the one name the whole slip is really about */
  favourite: string | null
  reasons: SupporterReason[]
  /** how many of the eight carry a reason — printed as a count, never as a score */
  reasoned: number
  /** how many of the eight are answered */
  filled: number
}

/** the ballot rows the ID reads by name, rather than by position in the array */
const FAVOURITE = 'favourite'
const NUMBER = 'number'
const POSITION = 'position'

/**
 * The number on the back, or null.
 *
 * The ballot keeps every pick as the label that is printed on the slip, so the shirt
 * number arrives as a string. It is parsed back rather than trusted: a slip saved by a
 * build whose picker offered something else — or edited in storage — must not put an
 * arbitrary string on a shirt, and `KitSpec.number` is a number or nothing.
 */
export function shirtNumber(ballot: Ballot): number | null {
  const raw = ballot[NUMBER]
  if (raw === undefined) return null
  if (!/^\d{1,2}$/.test(raw)) return null
  const value = Number(raw)
  return value >= 1 && value <= 99 ? value : null
}

/** A name for a shirt: trimmed, collapsed, and capped at what the garment can carry. */
export function shirtName(raw: string | null | undefined, max = 18): string | null {
  const name = (raw ?? '').replace(/\s+/g, ' ').trim()
  return name === '' ? null : name.slice(0, max)
}

export function supporterId(
  ballot: Ballot,
  reasons: Reasons,
  book: { nameHe?: string | null; number?: number | null },
): SupporterId {
  const rows: SupporterReason[] = []
  for (const question of BALLOT) {
    const pick = ballot[question.id]
    const reason = reasons[question.id]
    if (pick === undefined || pick === '' || reason === undefined) continue
    rows.push({ questionId: question.id, ask: question.ask, pick, reason })
  }

  // The ballot's own answer wins over the book's saved number: the number question IS
  // the one being asked here, and a card that printed last month's shirt beside this
  // afternoon's answer would be describing two different people.
  const number = shirtNumber(ballot) ?? (typeof book.number === 'number' ? book.number : null)

  return {
    nameHe: shirtName(book.nameHe),
    number,
    positionHe: ballot[POSITION] ?? null,
    favourite: ballot[FAVOURITE] ?? null,
    reasons: rows,
    reasoned: reasonCount(reasons),
    filled: BALLOT.filter((question) => (ballot[question.id] ?? '') !== '').length,
  }
}
