/**
 * מעברונים — nine seconds of 1989 between one room and the next.
 *
 * Maor found the film (Meir Mendelssohn, Tel Aviv 1989), found the promenade in it at
 * minute sixteen, and said what it was: the road between Bloomfield and Ussishkin. The
 * clips were cut on 5.9.2026 and then sat in `public/life/film` unplayed, which is the
 * worst state a thing can be in.
 *
 * The rules that keep a transition from becoming an interruption:
 *
 *  1. **Only where the journey means something.** South to north, the walk out of the
 *     house on the morning of a big day, the road to the ground. Not every door.
 *  2. **Once per chapter, per clip.** `own:film:*` survives the day, so a boy who walks
 *     the promenade four times on the same Saturday sees it the first time and remembers
 *     it the other three. The flag prefix is `own:` for exactly that reason.
 *  3. **Four seconds, and it cannot be paused.** It is a breath between rooms, not a
 *     cutscene: the archive film has its own channel and its own rules.
 *  4. **The clip fits the hour.** A morning street in the morning, lights at night. The
 *     window is checked against the clock, so the game never cuts to daylight at ten.
 *  5. **It has to be a door that exists.** The first version of this table routed the
 *     promenade between `route` and `ussishkin-outside` — a journey nobody can make,
 *     because there is no door between them. Three of nine cuts could never have played,
 *     which is the exact failure the clips were sitting in already. `tests/life-keys`
 *     now checks every cut against the world's own door graph.
 */

import type { LocationId } from '../types'

export type FilmCut = {
  /** the clip's key in `public/life/film` */
  clip: string
  from: LocationId
  to: LocationId
  /** the hours it may play in, as minutes from midnight */
  after?: number
  before?: number
  /** chapters it belongs to; omitted means every chapter */
  eras?: readonly string[]
  /** what the player is looking at, for the caption under it */
  captionHe: string
}

const HOUR = (h: number, m = 0) => h * 60 + m

export const FILM_CUTS: readonly FilmCut[] = [
  // ------------------------------------------------ דרום → צפון, ובחזרה ------------
  //
  // The one journey this film was cut for. Maor found it himself: the promenade at minute
  // sixteen is the road between Bloomfield and Ussishkin, and in this world that road is
  // the street — every door out of the neighbourhood goes through it.
  {
    clip: 'promenade-dusk',
    from: 'street',
    to: 'ussishkin-outside',
    captionHe: 'הטיילת, בדרך צפונה',
  },
  {
    clip: 'promenade-walk',
    from: 'ussishkin-outside',
    to: 'street',
    captionHe: 'הטיילת, בדרך חזרה',
  },

  // ------------------------------------------------------- הדרך למגרש -------------
  {
    clip: 'sea-wall',
    from: 'route',
    to: 'bloomfield-outside',
    captionHe: 'הולכים אל משהו',
  },
  {
    clip: 'night-lights',
    from: 'street',
    to: 'route',
    after: HOUR(18, 30),
    captionHe: 'הרחוב בערב משחק',
  },
  {
    clip: 'palms-evening',
    from: 'route',
    to: 'street',
    after: HOUR(19),
    captionHe: 'הדרך הביתה',
  },

  // ------------------------------------------------------- היציאה מהבית -----------
  {
    clip: 'street-morning',
    from: 'home',
    to: 'street',
    before: HOUR(11),
    captionHe: 'בוקר, בחוץ',
  },
  {
    clip: 'market',
    from: 'street',
    to: 'kiosk',
    before: HOUR(15),
    captionHe: 'הדרך לקיוסק',
  },
  {
    clip: 'alley-shade',
    from: 'street',
    to: 'pitch',
    captionHe: 'הסמטה',
  },
  {
    clip: 'plaza-evening',
    from: 'street',
    to: 'bus-station',
    captionHe: 'העיר, בדרך החוצה',
  },
]

/** the flag that says this clip has already played in this chapter */
export const filmFlag = (clip: string, chapter: string) => `own:film:${clip}:${chapter}`

/**
 * Which clip, if any, belongs between these two rooms right now.
 *
 * Returns nothing far more often than it returns something, and that is the design: a
 * transition that plays on every door is a loading screen with a view.
 */
export function cutFor(
  from: LocationId,
  to: LocationId,
  minute: number,
  chapter: string,
  flags: Record<string, unknown>,
): FilmCut | null {
  for (const cut of FILM_CUTS) {
    if (cut.from !== from || cut.to !== to) continue
    if (cut.eras && !cut.eras.includes(chapter)) continue
    if (cut.after !== undefined && minute < cut.after) continue
    if (cut.before !== undefined && minute >= cut.before) continue
    if (flags[filmFlag(cut.clip, chapter)]) continue
    return cut
  }
  return null
}
