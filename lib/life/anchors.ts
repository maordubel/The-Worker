/**
 * עוגן היסטורי — the ONE place a fact enters THE WORKER LIFE.
 *
 * Brief §4 and §24, and rule 11 of this repo, all point at the same discipline: the
 * life simulation is fiction, the history is not, and the join between them is a typed
 * interface rather than a sentence somebody wrote in a dialogue file.
 *
 * So an anchor carries only what the canonical archive actually holds, plus its source,
 * plus — and this is the part that matters — an explicit note about what it does NOT
 * hold. The 1980/81 championship is a sourced row in `content/manual/trophies.json` at
 * confidence 2. The MATCH that decided it is not in the archive: no date, no opponent,
 * no score, no scorer. Nothing in this game may state one.
 *
 * That is why `PlaceholderNote` exists and why it is rendered rather than hidden. A
 * placeholder you can see is a placeholder somebody replaces; a placeholder you cannot
 * see is an invented fact with a comment above it.
 */

export type PlaceholderNote = {
  /** what is standing in */
  what: string
  /** what the archive would have to supply to retire it */
  needs: string
}

/**
 * המשחק עצמו — the deciding match, once the archive can actually answer.
 *
 * Every field here is copied out of `content/manual/*` and nothing is computed from a
 * sentence. `decidedBy` is the row in `match-events.json` that says a goal was scored, by
 * whom, in which minute, from whose pass — which is why the scene can put the ball in the
 * net at exactly the minute it went in, and could not have before this row existed.
 *
 * `null` on an anchor means the archive still cannot answer, and the placeholder note
 * says so on screen. That is the state the 1985/86 anchor was in until 3.9.2026.
 */
export type AnchorGoal = {
  minute: number
  scorerHe: string
  assistHe: string | null
}

export type AnchorMatch = {
  playedOn: string
  opponentHe: string
  /** goals for the club this product is about, and against — never a "0:1" string */
  scoredFor: number
  scoredAgainst: number
  atHome: boolean
  venueHe: string | null
  decidedBy: AnchorGoal | null
  sourceTitle: string
  sourceUrl: string | null
}

export type HistoricalAnchor = {
  /** stable ID stored in the save — never a description */
  id: string
  sport: 'football' | 'basketball'
  seasonLabel: string
  year: number
  competitionSlug: string
  /** the canonical headline, built only from canonical fields */
  headlineHe: string
  /** venue slug from the archive, or null when the archive does not say */
  venueSlug: string | null
  sourceTitle: string
  sourceUrl: string | null
  confidence: number
  /**
   * How many times the club had won this competition, counting this one.
   *
   * COMPUTED from `trophies.json`, never typed in. The archive holds ten league titles at
   * or before 1985/86 and the sources call this one the tenth, which is the agreement
   * worth having: the number on the celebration screen is a count of rows a reader can go
   * and check, not a sentence somebody copied out of an article.
   * Null when the archive cannot count them.
   */
  titlesSoFar: number | null
  /** the deciding match, when the archive holds one; null when it does not */
  match: AnchorMatch | null
  /** null once the archive can answer the whole question */
  placeholder: PlaceholderNote | null
}

/**
 * The anchor the runtime falls back to when the archive cannot answer at all.
 *
 * It is not a fact and it does not pretend to be one: it is marked, it carries no
 * opponent and no score, and `tests/life.test.ts` asserts that a placeholder anchor
 * never reaches the celebration copy as though it were sourced.
 */
export const DEVELOPMENT_ANCHOR: HistoricalAnchor = {
  id: 'DEV-PLACEHOLDER',
  sport: 'football',
  seasonLabel: '1980/81',
  year: 1981,
  competitionSlug: 'ליגת-העל',
  headlineHe: 'עוגן היסטורי — ממלא מקום לפיתוח',
  venueSlug: 'בלומפילד',
  sourceTitle: 'DEVELOPMENT PLACEHOLDER — לא מקור',
  sourceUrl: null,
  confidence: 0,
  titlesSoFar: null,
  match: null,
  placeholder: {
    what: 'אין עוגן היסטורי מאושר מהארכיון; המסך מציג ממלא מקום מסומן.',
    needs: 'שורת גביע או משחק עונת 1980/81 בארכיון הקנוני, ברמת ודאות 2 ומעלה.',
  },
}

/** True when nothing in the anchor may be printed as a fact. */
export function isPlaceholder(anchor: HistoricalAnchor): boolean {
  return anchor.placeholder !== null || anchor.confidence < 2
}
