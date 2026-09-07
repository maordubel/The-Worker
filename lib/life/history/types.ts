/**
 * ההיסטוריה כנתון — the shape a documented match takes when a game has to play it.
 *
 * Until 7.9.2026 the two days this game is really about — 12.5.1990 and 2.5.1998 — were
 * each a hand-written table inside the file that played them. `GOAL_AT = [12, 29, 44, 58,
 * 71, 84]` sat in `runtime/match1990.ts` looking exactly like history, and Yavne existed
 * only as three words, `level → ahead → further`. Maor's audit put the objection in one
 * sentence: internal pacing is not the historical record, and a mission whose whole
 * mechanic is documentary information cannot keep its documents in its head.
 *
 * So the record moves out here, and the record is careful about one thing above all:
 *
 *   **`minute` is what a source says. `pacingMinute` is what the game does.**
 *
 * They are different fields because they are different kinds of claim, and no amount of
 * convenience is allowed to merge them. Where no source gives a minute — which is most of
 * 12.5.1990, because the Walla retrospective names the scorers and not the clock —
 * `minute` is `null` and stays `null`. The game still needs to put those goals somewhere
 * in ninety minutes, and it does, in `pacingMinute`, which is a directing decision with a
 * directing decision's status: never shown, never spoken, never asserted.
 *
 * The second rule is the one rule 11 turns into code. An event whose confidence is
 * `disputed` — a scorer only Maor's internal brief names, a scoreline no source confirms —
 * is not `speakable`. The director will happily run the day off it, because the SHAPE of
 * the day (somebody is ahead, the status quo held at half-time) is what the verified
 * sources do support. It will not let anybody on the terrace say the name. That is the
 * difference between a game built on an archive and a game that decorates itself with one.
 *
 * The third rule: conflicts are stored, never resolved. Walla counts two for Zano and a
 * sixth for Elbaz; Maor's audit counts three for Zano and no Elbaz. Both claims live in
 * the same record with `conflictNote` naming them, exactly as `content/manual/
 * fact-conflicts.json` already does for the championship count.
 */

/** how much weight a claim carries — the same three words the audit asked for */
export type EventConfidence = 'verified' | 'high' | 'disputed'

export type HistoricalEventType =
  | 'kickoff'
  | 'goal'
  | 'penalty_awarded'
  | 'penalty_missed'
  | 'corner'
  | 'half_time'
  | 'full_time'
  | 'state'
  | 'other'

export type HistoricalMatchEvent = {
  id: string
  matchId: string
  venueId: string
  /**
   * The archive's minute, or `null` when no source gives one. Never a guess, never
   * back-filled from `pacingMinute`, and never rendered when `null`.
   */
  minute: number | null
  /** what a source PRINTS, when that is not a bare number ("93׳", "תוספת זמן") */
  displayMinute?: string
  /** the order within the venue, where a source gives an order but no clock */
  sequence: number
  type: HistoricalEventType
  /** club slug, in the archive's Hebrew keys */
  teamSlug?: string
  /** the scorer, as a source names him — only ever spoken when `speakable` */
  personHe?: string
  assistHe?: string
  /** running score after this event, in the venue's home–away order */
  scoreAfter?: string
  sourceIds: string[]
  confidence: EventConfidence
  conflictNote?: string
  /**
   * May a character in the game say this out loud? False for anything a named external
   * source does not carry. The director enforces it; `tests/life-history.test.ts` proves
   * no `disputed` event is ever speakable.
   */
  speakable: boolean
  /**
   * המקום בתסריט — where the GAME plays this, in venue minutes. Pacing, not history.
   * Present on every event because the director has to run a clock; meaningless as a
   * historical claim and never displayed.
   */
  pacingMinute: number
  /** a short Hebrew line the terrace may use — only where `speakable` */
  lineHe?: string
}

/** a named source, resolved by id from every event that leans on it */
export type HistorySource = {
  id: string
  titleHe: string
  url: string | null
  /** `archive` — a public source; `brief` — Maor's own documents, which are evidence about intent, not about football */
  kind: 'archive' | 'brief'
}

/** one ground on one day: its own kickoff, its own clock, its own stream */
export type VenueTimeline = {
  venueId: string
  matchId: string
  nameHe: string
  /** minutes after the PRIMARY venue's kickoff that this ground starts — 1998's parallel ground kicked off later */
  kickoffOffset: number
  /** the archive's final score, home–away, or null where the archive refuses to hold one */
  finalHe: string | null
  /**
   * איזה מחזור — as a number, not as a sentence.
   *
   * 7.9.2026: the game called 2.5.1998 "המחזור ה-29" in its narration and `מחזור 30` in its
   * archive at the same time, and both were strings nobody could test. It was the
   * penultimate round — Ballerz: *"שני מחזורים לסיום העונה"*, and *"במחזור הסיום שתי הקבוצות
   * ניצחו"* about the week after. So the round is data now, and
   * `tests/life-history.test.ts` reads it here rather than grepping prose.
   */
  round?: { number: number; ofTotal: number; isFinal: boolean }
  events: HistoricalMatchEvent[]
  /** why this ground matters to the boy standing in the other one */
  stakeHe: string
}

export type HistoryDay = {
  id: string
  dateHe: string
  primaryVenueId: string
  venues: VenueTimeline[]
  sources: HistorySource[]
  /** what the archive will not say about this day, in one sentence, for the debug panel */
  silenceHe: string
}
