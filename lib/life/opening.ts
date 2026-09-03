import type { HistoricalAnchor } from './anchors'
import { longDateHe } from './cutscenes'

/**
 * הפתיח — six moments before the player is allowed to touch anything.
 *
 * The vision document (§4) sets the job of this sequence in one sentence, and it is worth
 * keeping in front of whoever edits this file: **it has to explain why Hapoel already has
 * a place in this child's life before he is old enough to choose it.** Nothing here is
 * gameplay and nothing here is exposition. It is a father, a radio, a scarf on a cot, and
 * a boy who ends up at a window looking at a floodlight.
 *
 * ## Why it is data and not a scene
 *
 * The sequence is DOM — six beats, two of them short films — for the same reason the
 * dialogue is DOM: Hebrew in a WebGL canvas gets no bidi handling, no selection, no
 * screen reader, and reflows badly on a narrow phone. It also means the whole opening
 * costs the game nothing until it plays: no Phaser scene, no texture atlas, no boot.
 *
 * ## The one rule it shares with everything else
 *
 * A beat may hold a caption written for it, and it may hold a line READ OFF THE ARCHIVE,
 * and it may not hold a caption that states a fact. The cup final of 1983 is the case: on
 * 3.9.2026 `content/manual` gained 1.6.1983, הפועל תל אביב 3 מכבי תל אביב 2, and Gili
 * Landau's 67th-minute goal — so beat three names the date, the opponent and the score by
 * resolving `prologueAnchor`, and if that row ever leaves the archive the beat quietly
 * goes back to being a photograph of a man lifting a child. Nothing in this file will
 * ever have to be edited for that to happen, which is the entire point of writing it
 * this way rather than typing `1.6.1983` into a caption.
 */

export type OpeningBeat = {
  id: string
  /** a painting held with a slow drift, or a few seconds of film */
  kind: 'still' | 'clip'
  /** file stem under `/life/opening` — `.png`, or `.mp4` plus `-poster.png` */
  art: string
  /** how long it holds, in milliseconds, when nobody touches anything */
  ms: number
  /** the line under the picture. Written for the beat; never a fact. */
  captionHe: string
  /**
   * A second line, built from the archive at render time.
   *
   * `fixture` is `הפועל תל אביב — מכבי תל אביב · 3:2`, `date` is `1 ביוני 1983`. Both come
   * from the prologue anchor and both are null when the archive cannot answer, in which
   * case the beat simply has one line.
   */
  archiveLine?: 'fixture' | 'date'
}

/**
 * The order, and it is the order the vision document proposed.
 *
 * 1978 · the cot — the family on the way — 1983 · the shoulders — the crest at the table —
 * the window. Five pictures and no explanation, and then the game starts on the morning
 * after the cup, with the streets still carrying the night before.
 */
export const OPENING: OpeningBeat[] = [
  {
    id: 'born',
    kind: 'still',
    art: 'born',
    ms: 5200,
    // The one caption the vision document wrote itself, kept word for word.
    captionHe: 'עוד לפני שידע לדבר, כבר החליטו בשבילו איפה הלב שלו יהיה.',
  },
  {
    id: 'first-time',
    kind: 'clip',
    art: 'clip-family',
    ms: 6000,
    captionHe: 'בפעם הראשונה הוא לא זכר כלום. אבא זוכר הכול.',
  },
  {
    id: 'cup',
    kind: 'still',
    art: 'shoulders',
    ms: 6400,
    captionHe: 'הוא לא הבין את החוקים. הוא הבין את אבא.',
    archiveLine: 'fixture',
  },
  {
    id: 'crest',
    kind: 'still',
    art: 'drawing',
    ms: 5000,
    captionHe: 'אחר כך ציירו אותו שוב ושוב, עד שהילד ידע לצייר אותו לבד.',
  },
  {
    id: 'window',
    kind: 'clip',
    art: 'clip-memory',
    ms: 6400,
    captionHe: 'ומהחלון שלו רואים את הזרקורים.',
  },
]

export type OpeningLines = {
  captionHe: string
  /** the archive's line, or null when the archive cannot answer */
  archiveHe: string | null
}

const US_HE = 'הפועל תל אביב'

export function openingLines(beat: OpeningBeat, anchor: HistoricalAnchor): OpeningLines {
  if (!beat.archiveLine) return { captionHe: beat.captionHe, archiveHe: null }
  const match = anchor.match
  if (!match) return { captionHe: beat.captionHe, archiveHe: null }

  if (beat.archiveLine === 'date') {
    return { captionHe: beat.captionHe, archiveHe: longDateHe(match.playedOn) }
  }

  const home = match.atHome ? US_HE : match.opponentHe
  const away = match.atHome ? match.opponentHe : US_HE
  // Goals for and against, in that order, never a "3:2" string typed by hand — the archive
  // holds two numbers and the direction they belong to.
  const scoreHe = match.atHome
    ? `${match.scoredFor}:${match.scoredAgainst}`
    : `${match.scoredAgainst}:${match.scoredFor}`
  const date = longDateHe(match.playedOn)
  return {
    captionHe: beat.captionHe,
    archiveHe: `${home} — ${away} · ${scoreHe}${date ? ` · ${date}` : ''}`,
  }
}

/** Total run time if nobody skips, for the loading estimate and for the tests. */
export function openingMs(): number {
  return OPENING.reduce((total, beat) => total + beat.ms, 0)
}

/**
 * The key the shell writes when the sequence has played.
 *
 * `sessionStorage`, deliberately, and not the save file. A player who reloads the tab
 * during one sitting has already watched it; a player who comes back next week is opening
 * this game again, and the opening is what this game opens with. It also keeps the
 * sequence entirely out of the append-only life log, which records what the CHILD did.
 */
export const OPENING_SEEN = 'the-worker:life:opening'
