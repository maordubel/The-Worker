import 'server-only'

import { archive, nameOf, rng, shuffle } from './archive'

/**
 * ציר הזמן — order five dated facts. Every card is a real dated row from the archive,
 * so the mode costs no new content: it is the same facts, asked a different way.
 *
 * The correct order never reaches the client — only the shuffled cards do.
 */

export type TimelineCard = { id: string; title: string; hint: string }

type Dated = { id: string; title: string; hint: string; on: string }

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
    .replace(/[·,]\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function pool(): Dated[] {
  const out: Dated[] = []

  for (const moment of archive.moments) {
    if (!moment.happenedOn) continue
    out.push({
      id: `moment:${moment.slug}`,
      title: moment.titleHe,
      hint: safeHint(moment.sourceTitle),
      on: moment.happenedOn,
    })
  }
  for (const match of archive.matches) {
    if (!match.playedOn) continue
    out.push({
      id: `match:${match.seasonLabel}:${match.awayClubSlug}`,
      title: `${nameOf.club(match.homeClubSlug)} ${match.homeScore}:${match.awayScore} ${nameOf.club(match.awayClubSlug)}`,
      hint: safeHint(nameOf.competition(match.competitionSlug)),
      on: match.playedOn,
    })
  }

  // One card per date, so two cards can never be tied and both "right".
  // A card whose own title states a year is dropped rather than mangled — rewriting a
  // fact to hide its date would be worse than not asking about it.
  const byDate = new Map<string, Dated>()
  for (const item of out) {
    if (YEAR.test(item.title)) continue
    if (!byDate.has(item.on)) byDate.set(item.on, item)
  }
  return [...byDate.values()]
}

export const TIMELINE_LENGTH = 5

function round(seed: number): Dated[] {
  return shuffle(pool(), rng(seed)).slice(0, TIMELINE_LENGTH)
}

/** Public shape: shuffled, undated. */
export function dealTimeline(seed: number): TimelineCard[] {
  const random = rng(seed * 7 + 1)
  return shuffle(
    round(seed).map(({ id, title, hint }) => ({ id, title, hint })),
    random,
  )
}

export type TimelineVerdict = {
  correct: boolean
  /** ids oldest-first, with the date now revealed */
  solution: Array<{ id: string; title: string; on: string }>
}

/** Graded on the server against the real dates. */
export function gradeTimeline(seed: number, order: string[]): TimelineVerdict {
  const solution = [...round(seed)].sort((a, b) => a.on.localeCompare(b.on))
  const expected = solution.map((item) => item.id)
  return {
    correct: expected.length === order.length && expected.every((id, index) => id === order[index]),
    solution: solution.map(({ id, title, on }) => ({ id, title, on })),
  }
}

export function timelineAvailable(): boolean {
  return pool().length >= TIMELINE_LENGTH
}
