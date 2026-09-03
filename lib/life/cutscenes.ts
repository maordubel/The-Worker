import type { HistoricalAnchor } from './anchors'

/**
 * הארכיון נפתח — the moment the illustrated memory opens onto real footage.
 *
 * This game has spent four passes insisting on one rule: the life is fiction, the history
 * is not, and the join between them is a typed interface rather than a sentence somebody
 * wrote in a dialogue file (rule 11, brief §4 and §24). `HistoricalAnchor` is that join
 * for FACTS. This is the same join for FILM.
 *
 * A cutscene is a configuration, not a scene. It names a video, says which flag it raises
 * and which objective comes after it, and says nothing at all about what happened in the
 * match — because the thing on screen is the match, and the game has no business
 * narrating over it. Everything printed on the card around the film is read off the
 * anchor: the date, the two clubs, the ground. If the archive stops holding the 1986 row,
 * the card goes back to saying less, exactly as every other screen in this chapter does.
 *
 * **It is a system and not a one-off, and that is the point.** Bloomfield 1986 is the
 * first of these. The strike of 1970, the cup runs, the season the club nearly folded,
 * a demonstration, an interview with a man who is now dead — every one of them is a
 * `HistoricalCutscene` entry and a video id, and none of them needs a line of new code.
 *
 * ## What it may never do
 *
 * Trap the player. YouTube is somebody else's server, and it fails in at least six ways:
 * embedding disabled by the uploader, video pulled, network down, autoplay with sound
 * blocked by the browser, the iframe API failing to load at all, and the player simply
 * choosing to skip. Every one of those ends the same way — the flag is raised, the next
 * objective appears, the chapter continues — and the difference between them is only what
 * the player saw. `CutsceneOutcome` is that difference, and nothing else in the game
 * branches on it except the memory kept.
 */

/** How a cutscene ended. The chapter continues identically in all three cases. */
export type CutsceneOutcome =
  /** played to the end, or close enough that the player saw the thing */
  | 'watched'
  /** the player pressed דלג */
  | 'skipped'
  /** YouTube could not play it: embedding off, video gone, offline, API dead */
  | 'unavailable'

export type HistoricalCutscene = {
  /** stable id, stored in the save as part of a flag — never a description */
  id: string
  /** the YouTube video id, not a URL */
  youtubeId: string
  /** what this piece of film IS, in the game's voice — never a claim about the match */
  titleHe: string
  /** optional second line under the title on the intro card */
  subtitleHe?: string
  /** seconds into the video to begin; omit to start at the beginning */
  startSeconds?: number
  /** seconds at which to stop; omit to play to the end */
  endSeconds?: number
  /** who this footage belongs to, shown under the frame — attribution is not optional */
  sourceTitle: string
  /** the original, so a player can go and watch it where it lives */
  sourceUrl: string
  /** raised however the cutscene ends, including skipped and unavailable */
  completionFlag: string
  /** raised ONLY when the player actually watched it — the difference is a memory */
  watchedFlag: string
  /** the HUD objective the chapter shows next; the cutscene never ends into nothing */
  nextObjectiveHe: string
  /**
   * What the game says instead, when the film cannot play.
   *
   * Deliberately not a description of the match. It is one line that hands the player
   * back to the game, because the fallback for missing footage is the FOOTAGE being
   * missing — and in this chapter the thing behind it is a ninety-minute scene the game
   * can play by itself.
   */
  fallbackHe: string
}

/**
 * הכרטיס — what is printed around the film, built from the anchor and from nothing else.
 *
 * `null` for every field the archive cannot answer. A cutscene whose anchor has no match
 * row shows its title and its date-less self rather than a guessed line, which is the
 * same discipline `resolveChapterAnchor` applies to the celebration screen.
 */
export type CutsceneCard = {
  titleHe: string
  subtitleHe: string | null
  /** `הפועל תל אביב — מכבי חיפה`, or null when the archive holds no opponent */
  fixtureHe: string | null
  /** `24 במאי 1986`, or null */
  dateHe: string | null
  /** `אצטדיון בלומפילד`, or null — a cup final on neutral ground genuinely has none */
  placeHe: string | null
}

const US_HE = 'הפועל תל אביב'

const MONTHS_HE = [
  'בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני',
  'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר',
] as const

/**
 * `1986-05-24` → `24 במאי 1986`.
 *
 * Written out rather than punctuated, because this string is the first thing on a black
 * screen before archival film and `24.5.1986` reads as a receipt. Returns null rather
 * than guessing at anything it cannot parse.
 */
export function longDateHe(iso: string | null | undefined): string | null {
  if (!iso) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const [, year, month, day] = match
  const name = MONTHS_HE[Number(month) - 1]
  if (!name) return null
  return `${Number(day)} ${name} ${year}`
}

export function cutsceneCard(scene: HistoricalCutscene, anchor: HistoricalAnchor): CutsceneCard {
  const match = anchor.match
  return {
    titleHe: scene.titleHe,
    subtitleHe: scene.subtitleHe ?? null,
    fixtureHe: match ? (match.atHome ? `${US_HE} — ${match.opponentHe}` : `${match.opponentHe} — ${US_HE}`) : null,
    dateHe: longDateHe(match?.playedOn),
    placeHe: match?.venueHe ?? null,
  }
}

/**
 * The whole registry. One entry today, and it is written the way the tenth will be.
 *
 * `dFykPEa8NAE` is the full televised summary of the match rather than the goal on its
 * own, and that was Maor's call: an eight-year-old on that terrace did not see a clip of
 * the eighty-sixth minute, he saw an afternoon. The cutscene therefore plays what the
 * broadcast showed, and the game's own eighty-sixth minute happens on the other side of
 * it, in the world, with the child in it.
 */
export const CUTSCENES: Record<string, HistoricalCutscene> = {
  '1986-championship': {
    id: '1986-championship',
    youtubeId: 'dFykPEa8NAE',
    titleHe: 'משחק האליפות',
    subtitleHe: 'שידור מהארכיון',
    sourceTitle: 'ארכיון וידאו — סיכום המשחק, YouTube',
    sourceUrl: 'https://www.youtube.com/watch?v=dFykPEa8NAE',
    completionFlag: 'cutscene:1986-championship',
    watchedFlag: 'watched:1986-championship',
    nextObjectiveHe: 'מצא את אבא',
    fallbackHe: 'הסרט מהארכיון לא נפתח. תסתכל על המגרש — המשחק עוד רץ.',
  },
}

export function cutsceneFor(id: string): HistoricalCutscene | null {
  return CUTSCENES[id] ?? null
}

/**
 * The URL the embed loads, with every parameter this game actually wants.
 *
 * `enablejsapi` is what lets the shell hear the video end instead of guessing at it.
 * `rel=0` keeps YouTube from offering three other videos over the last frame of a
 * historical document. `modestbranding` is deliberately NOT set — it was deprecated, and
 * more to the point the attribution belongs on screen (it is under the frame) rather than
 * scrubbed off it. `origin` is required by the iframe API when `enablejsapi` is on.
 */
export function embedUrl(scene: HistoricalCutscene, origin: string): string {
  const params = new URLSearchParams({
    enablejsapi: '1',
    rel: '0',
    playsinline: '1',
    autoplay: '1',
    fs: '0',
    cc_load_policy: '0',
    iv_load_policy: '3',
    origin,
  })
  if (scene.startSeconds) params.set('start', String(Math.round(scene.startSeconds)))
  if (scene.endSeconds) params.set('end', String(Math.round(scene.endSeconds)))
  return `https://www.youtube-nocookie.com/embed/${scene.youtubeId}?${params.toString()}`
}
