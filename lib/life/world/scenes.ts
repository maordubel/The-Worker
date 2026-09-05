import { at } from '../clock'
import type { LocationId } from '../types'

import type { Condition } from './types'

/**
 * העולם המצויר — a painted place, a strip of floor you may stand on, and a door you can
 * see from across the room.
 *
 * The second version of this file exists because of one sentence in a playtest: the
 * player stayed in the house, because leaving was not obvious, and the clock took his
 * father to the match while he was still learning to walk. Nothing about that is the
 * player's fault. So every interactive thing in the world now carries a VERB and a NAME,
 * every exit carries a light you can see from anywhere in the room, and the clock does
 * not start until the child is in the street.
 *
 * Everything is a fraction of the backdrop, never a pixel — a better cut of the same
 * painting must move no door and no person.
 */

export const KICKOFF = at(16, 0)
export const KOBI_LEAVES = at(15, 10)
export const FULL_TIME = at(17, 45)

/** What pressing the button will DO. The prompt is built from this plus the name. */
export type Verb = 'talk' | 'look' | 'take' | 'buy' | 'enter' | 'exit' | 'play' | 'watch' | 'gaze' | 'sit'

/**
 * לאיזה עידן — which chapter a thing in a room belongs to.
 *
 * The rooms are shared between chapters; the people in them are not. An actor, hotspot or
 * layer with no `era` belongs to 1986 — the chapter every room was written for — so that
 * adding a second chapter did not mean touching four hundred lines that were already
 * right. `'*'` is for the things that are true in every year: a wall, a pole, a rail.
 */
export type EraTag = string | '*' | readonly string[]

/**
 * העשור של פרק — `1993-cup` is a chapter of the nineties, `2000-double` of the two
 * thousands. A thing tagged with a decade (`'1990s'`) is in every chapter of it; a
 * thing tagged `'B'` is in every chapter of Stage B. Chapters after 1991 borrow the
 * nineties' paintings and people by default, so a room written once for 1990 is a room
 * in 1998 without a second copy of every line.
 */
export function decadeOf(chapter: string): string {
  const year = Number(chapter.slice(0, 4))
  if (!Number.isFinite(year)) return '1980s'
  return year >= 2000 ? '2000s' : year >= 1990 ? '1990s' : '1980s'
}

export function stageOf(chapter: string): 'A' | 'B' {
  return chapter === '1986' || chapter === 'prologue' || /^a\d/.test(chapter) ? 'A' : 'B'
}

function eraMatches(era: string, chapter: string): boolean {
  return era === '*' || era === chapter || era === decadeOf(chapter) || era === stageOf(chapter)
}

export function inEra(def: { era?: EraTag }, chapter: string, fallback: EraTag = '1986'): boolean {
  const era = def.era ?? fallback
  if (Array.isArray(era)) return (era as readonly string[]).some((e) => eraMatches(e, chapter))
  return eraMatches(era as string, chapter)
}

/** the keys a per-era table is read by, most specific first */
export function eraKeys(chapter: string): string[] {
  return [chapter, decadeOf(chapter), stageOf(chapter)]
}

/** Doors are geography: a door with no era is a door in every year. */
export function exitInEra(exit: ExitDef, chapter: string): boolean {
  return inEra(exit, chapter, '*')
}

export type ActorDef = {
  id: string
  era?: EraTag
  figure: string
  x: number
  y: number
  size: number
  nameHe: string
  talk?: string
  when?: Condition
  flip?: boolean
  sway?: number
}

export type HotspotDef = {
  id: string
  era?: EraTag
  x: number
  y: number
  w?: number
  act: string
  /** what the prompt says you will do; a hotspot with no verb is scenery */
  verb: Verb
  labelHe: string
  when?: Condition
  /**
   * A thing drawn in the world for this hotspot. `at` is where it is DRAWN when that is
   * not where you stand to use it — a radio on a table is drawn on the tabletop and
   * reached from the floor in front of it.
   */
  prop?: { key: string; size: number; at?: { x: number; y: number } }
  /** higher wins when two things are within reach at once */
  priority?: number
}

/**
 * A door is not a trigger volume. It is a place in the painting with a light on it, a
 * name, and a promise about where it goes — and it works whether you walk into it or
 * press the button next to it, because a player who has just learned to walk should not
 * also have to learn which doors need a keypress.
 */
export type ExitDef = {
  id: string
  era?: EraTag
  x: number
  y: number
  w: number
  h: number
  to: LocationId
  spawn: string
  labelHe: string
  when?: Condition
  /** the glow drawn on the doorway itself, so the way out is visible from anywhere */
  light?: { x: number; y: number; w: number; h: number; tone: 'inside' | 'daylight' }
  /**
   * What the child needs before this door means anything.
   *
   * A locked door is not hidden and it is not silent: the light dims, the prompt keeps
   * the door's name, and pressing the button gets a sentence explaining what is missing.
   * "You cannot go out without the key" is a game; a door that does nothing is a bug.
   */
  needs?: Condition
  blockedHe?: string
  /**
   * The lock by chapter. `null` means the door is simply open that year: the 1986 key
   * on the string is a fact about an eight-year-old, and the twelve-year-old of 1990
   * walked out of the flat for a week with the door telling him to find a key that was
   * not in any drawer — the first bug Maor met in Stage B.
   */
  needsByEra?: Record<string, Condition | null>
  /** the door's VISIBILITY by chapter — `null` means the door is simply there that year */
  whenByEra?: Record<string, Condition | null>
  /**
   * ...and what the door SAYS when it is shut, by chapter.
   *
   * A lock is only information if the sentence beside it is true. "Without the key your
   * mother will not let you out" is the right sentence for an eight-year-old and the
   * wrong one for a thirteen-year-old who was told no an hour ago, and the difference
   * between them is the difference between a game and a bug report.
   */
  blockedByEra?: Record<string, string>
  /** walking in triggers after a short dwell; the button always works immediately */
  dwellMs?: number
  priority?: number
}

export type Ambience = 'interior' | 'kitchen' | 'day' | 'dusk' | 'tunnel' | 'stadium' | 'hall' | 'station' | 'base' | 'classroom'

/**
 * A painted object separated from its room, drawn in front of or behind the player.
 *
 * The systems pass used this for one thing: splitting the street's foreground plate so a
 * child could walk behind a pole. The living pass asks it to do a second, larger job —
 * DRESSING. A backdrop is a photograph of a place with nobody in it; the dressing is
 * what says people were here this morning. A car left at the kerb, a bin by the kiosk,
 * pennants over the road, a supporters' coach that is not there at noon and is there at
 * four. So a layer gained three things, all optional and all additive:
 *
 *   · `when` — the same `Condition` vocabulary everything else in this file speaks, so a
 *     street can change without a line of scene code changing with it;
 *   · `foot` — anchor the plate by the point it STANDS on rather than its top-left,
 *     which is the only way to place a car on a pavement that recedes;
 *   · `flip` / `alpha` / `tint` — the cheap variations, so one 56KB car is two cars.
 *
 * `depth` stays explicit and stays in band units (× H, like every actor), because a prop
 * the child walks behind and a prop he walks in front of differ by one number and that
 * number should be readable in the content, not inferred.
 */
export type LayerDef = {
  art: string
  era?: EraTag
  x: number
  y: number
  w: number
  depth: number
  /**
   * How far this piece of dressing lifts, as a fraction of the backdrop height.
   *
   * Almost every layer in this game is a thing — a table, a bin, a bus — and a thing that
   * moves is a bug. One case is not: a terrace at full time. The championship crowd is
   * drawn as dressing rather than as actors, because none of those eight thousand people
   * can be talked to and an actor you cannot talk to is a conversation the player keeps
   * walking into. But a still crowd at the moment the title is won is worse than no crowd,
   * so a layer may bounce. Amplitude in band units, phase derived from its own x so no two
   * of them are in step.
   */
  bob?: number
  /** treat (x, y) as the point the object stands on, not its top-left corner */
  foot?: boolean
  /** dressing that is only there when the world says it is */
  when?: Condition
  flip?: boolean
  alpha?: number
  tint?: number
}

export type SceneDef = {
  id: LocationId
  titleHe: string
  art: string
  /** the same room painted in another year — `bedroom90`, `street90` */
  artByEra?: Record<string, string>
  band: { far: number; near: number }
  size: { far: number; near: number }
  spawns: Record<string, { x: number; y: number; facing?: 'left' | 'right' }>
  actors: ActorDef[]
  hotspots: HotspotDef[]
  exits: ExitDef[]
  layers?: LayerDef[]
  ambience: Ambience
  arrival?: { art: string; ms: number; flag: string }
  /**
   * The arrival card by chapter, where a chapter needs a different one — or none. `null`
   * means the room plays NO card in that year: in 1990 the boy is not seeing the road or
   * the terrace for the first time (brief §12: "he knows this place").
   */
  arrivalByEra?: Record<string, { art: string; ms: number; flag: string } | null>
  /** what somebody in the room says if the player has been lost for a while */
  stuckHe?: string
  /** the same line, for a chapter whose locks are different */
  stuckByEra?: Record<string, string>
}

/** whether this door is drawn at all in this chapter — `undefined` is always */
export function whenFor(exit: ExitDef, chapter: string): Condition | undefined {
  if (exit.whenByEra) for (const key of eraKeys(chapter)) if (key in exit.whenByEra) return exit.whenByEra[key] ?? undefined
  return exit.when
}

/** what this door needs in this chapter — `undefined` is an open door */
export function needsFor(exit: ExitDef, chapter: string): Condition | undefined {
  if (exit.needsByEra) for (const key of eraKeys(chapter)) if (key in exit.needsByEra) return exit.needsByEra[key] ?? undefined
  return exit.needs
}

/** what this door says when it refuses, in this chapter */
export function blockedFor(exit: ExitDef, chapter: string): string | null {
  if (exit.blockedByEra) for (const key of eraKeys(chapter)) if (exit.blockedByEra[key] !== undefined) return exit.blockedByEra[key] ?? null
  return exit.blockedHe ?? null
}

/** the painting under this room in this chapter */
export function artFor(scene: SceneDef, chapter: string): string {
  if (scene.artByEra) for (const key of eraKeys(chapter)) if (scene.artByEra[key]) return scene.artByEra[key]!
  return scene.art
}

/** the arrival card this room plays in this chapter, if any */
export function arrivalFor(scene: SceneDef, chapter: string): { art: string; ms: number; flag: string } | null {
  if (scene.arrivalByEra) for (const key of eraKeys(chapter)) if (key in scene.arrivalByEra) return scene.arrivalByEra[key] ?? null
  return scene.arrival ?? null
}

export function stuckFor(scene: SceneDef, chapter: string): string | null {
  if (scene.stuckByEra) for (const key of eraKeys(chapter)) if (scene.stuckByEra[key] !== undefined) return scene.stuckByEra[key] ?? null
  return scene.stuckHe ?? null
}

const SCENES: SceneDef[] = [
  // ------------------------------------------------------------------- bedroom ----
  {
    id: 'bedroom',
    titleHe: 'החדר שלך',
    art: 'bedroom',
    // The same room in three chapters. 1991 is the 1990 painting again on purpose: ten
    // months is not a repaint, and the boy who sleeps here is the same boy.
    artByEra: { '1990': 'bedroom90', '1991': 'bedroom90', '1990s': 'bedroom90', '2000s': 'bedroom90' },
    band: { far: 0.84, near: 0.97 },
    size: { far: 0.3, near: 0.38 },
    ambience: 'interior',
    stuckHe: 'המפתח במגירה, בקצה שמאל. משם גם הדלת לסלון.',
    stuckByEra: { '1990': 'הדלת לסלון — משמאל. אבא במטבח.', '1991': 'המחברת על השולחן. הדלת לסלון — משמאל.' },
    spawns: { start: { x: 0.3, y: 0.93, facing: 'left' }, fromHome: { x: 0.14, y: 0.9, facing: 'right' } },
    actors: [],
    hotspots: [
      { id: 'tin-a4', era: 'a4-shirt', x: 0.45, y: 0.92, w: 0.14, act: 'tin-a4', verb: 'look', labelHe: 'הפחית מתחת למיטה' },
      { id: 'shirt-a5', era: 'a5-first', x: 0.63, y: 0.9, w: 0.1, act: 'shirt-a5', verb: 'look', labelHe: 'החולצה על הכיסא', priority: 3 },
      { id: 'poster-sinai', era: '1995-sinai', x: 0.5, y: 0.82, w: 0.12, act: 'poster-look', verb: 'look', labelHe: 'הפוסטר' },
      { id: 'bed', x: 0.45, y: 0.92, w: 0.14, act: 'bed', verb: 'look', labelHe: 'המיטה' },
      // the wall of pictures over the bed, 0.35–0.65 in the 4.9 painting
      { id: 'poster', x: 0.63, y: 0.9, w: 0.08, act: 'poster', verb: 'look', labelHe: 'הכרזה' },
      // 1990: the same room, four years on. The drawer holds the scarf now, not a key.
      { id: 'bed-1990', era: '1990', x: 0.45, y: 0.92, w: 0.14, act: 'bed-1990', verb: 'look', labelHe: 'המיטה' },
      { id: 'drawer-1990', era: '1990', x: 0.17, y: 0.9, w: 0.16, act: 'drawer-1990', verb: 'look', labelHe: 'המגירה' },
      // 1991: the notebook, page forty-one, and the whole evening hanging off it (§30).
      {
        id: 'desk-1991',
        era: '1991',
        x: 0.17,
        y: 0.9,
        w: 0.16,
        act: 'homework-1991',
        verb: 'sit',
        labelHe: 'המחברת',
        priority: 3,
        prop: { key: 'propNote', size: 0.05, at: { x: 0.19, y: 0.7 } },
      },
      { id: 'bed-1991', era: '1991', x: 0.45, y: 0.92, w: 0.14, act: 'bed-1990', verb: 'look', labelHe: 'המיטה' },
      // Wider than a drawer needs to be: it is the one thing in this room the chapter
      // cannot start without, so a child crossing the room at any speed is offered it.
      // It is NOT given priority — the door beside it must still win in the doorway, or
      // the way out of the first room disappears behind the furniture.
      { id: 'desk', x: 0.17, y: 0.9, w: 0.16, act: 'desk', verb: 'look', labelHe: 'המגירה' },
      {
        id: 'redbox',
        x: 0.89,
        y: 0.95,
        w: 0.08,
        act: 'redbox',
        verb: 'look',
        labelHe: 'הקופסה',
        // `propScarfRed`, not `propScarf`. The seven props this game shipped with were
        // cut from a concept board and every one of them arrived with a piece of
        // somebody else in the frame — the old scarf carries a red fragment of a
        // figure beside it. The September sheet drew the objects themselves.
        // Draped over the corner of the bedside cabinet in the 4.9 painting, reached
        // from the floor beside it.
        prop: { key: 'propScarfRed', size: 0.085, at: { x: 0.905, y: 0.69 } },
      },
    ],
    exits: [
      {
        id: 'out',
        x: 0.0,
        y: 0.82,
        w: 0.09,
        h: 0.18,
        to: 'home',
        spawn: 'fromBedroom',
        labelHe: 'לסלון',
        light: { x: 0.0, y: 0.62, w: 0.075, h: 0.36, tone: 'inside' },
        // Half a second, not a fifth of one. This is the first door in the game and the
        // drawer beside it is the thing the morning needs — sliding out of your own room
        // before you have looked at anything is how a chapter starts locked.
        dwellMs: 520,
      },
    ],
  },

  // ---------------------------------------------------------------------- home ----
  {
    id: 'home',
    titleHe: 'הסלון',
    art: 'living',
    band: { far: 0.73, near: 0.97 },
    size: { far: 0.33, near: 0.43 },
    ambience: 'interior',
    stuckHe: 'בלי מפתח אמא לא נותנת לצאת. ואבא בכורסה — תשאל אותו מה יש היום.',
    // The coffee table is the room's own foreground: walk up to the sofa and you pass
    // behind it. One separated object is what turns a painting into a place.
    layers: [{ art: 'livingTable', x: 0.3659, y: 0.5625, w: 0.1751, depth: 0.79 }],
    spawns: {
      // Every one of these sits CLEAR of the door it came through. A spawn inside its
      // own exit zone walks the player straight back where they came from, forever —
      // `tests/life.test.ts` fails the build on it now, because it happened here.
      fromBedroom: { x: 0.77, y: 0.9, facing: 'left' },
      fromStreet: { x: 0.14, y: 0.93, facing: 'right' },
      fromKitchen: { x: 0.35, y: 0.87, facing: 'right' },
      // Stage B mornings begin in the middle of the room, facing the table.
      start: { x: 0.5, y: 0.9, facing: 'left' },
    },
    actors: [
      // ---- שלב א׳, הימים שלפני השבת (chapterStageA.ts) ----
      { id: 'rachel-a2', era: 'a2-alley', figure: 'rachel', x: 0.3, y: 0.9, size: 0.42, nameHe: 'רחל', talk: 'rachel-a2', sway: 0.004 },
      { id: 'kobi-a4', era: 'a4-shirt', figure: 'kobi-chair', x: 0.63, y: 0.78, size: 0.34, nameHe: 'קובי', talk: 'kobi-a4' },
      { id: 'rachel-a4', era: 'a4-shirt', figure: 'rachel', x: 0.3, y: 0.9, size: 0.42, nameHe: 'רחל', talk: 'rachel-a4', sway: 0.004 },
      { id: 'rachel-a6', era: 'a6-radio', figure: 'rachel-tray', x: 0.3, y: 0.9, size: 0.42, nameHe: 'רחל', talk: 'rachel-a6', sway: 0.004 },
      { id: 'kobi-a7', era: 'a7-week', figure: 'kobi-chair', x: 0.63, y: 0.78, size: 0.34, nameHe: 'קובי', talk: 'kobi-a7' },
      { id: 'rachel-a7', era: 'a7-week', figure: 'rachel', x: 0.3, y: 0.9, size: 0.42, nameHe: 'רחל', talk: 'rachel-a7', sway: 0.004 },
      {
        id: 'kobi',
        // He sits in his own chair with the sports page, which is the pose the sheet was
        // drawn for and the reason the living room has somebody in it rather than a
        // cut-out standing on a rug.
        figure: 'kobi-chair',
        x: 0.63,
        y: 0.78,
        size: 0.34,
        nameHe: 'קובי',
        talk: 'kobi-morning',
        when: { beforeMinute: KOBI_LEAVES },
        sway: 0.003,
      },
      // 1990: Rachel moves through the flat; the schedule puts her here after half past one.
      // 1991: the same two people in the same room, on a Monday evening that has a
      // question in it. Rachel is the chapter's boss fight (§30) and Kobi is not a
      // second key to the same door — he can nudge, once, and only if he is close.
      {
        id: 'rachel-1991',
        era: '1991',
        figure: 'rachel90-arms',
        x: 0.6,
        y: 0.84,
        size: 0.45,
        nameHe: 'רחל',
        talk: 'rachel-1991',
        sway: 0.004,
      },
      {
        id: 'kobi-1991',
        era: '1991',
        figure: 'kobi90-sitA',
        x: 0.28,
        y: 0.8,
        size: 0.36,
        nameHe: 'קובי',
        talk: 'kobi-1991',
        when: { afterMinute: 17 * 60 + 40 },
        sway: 0.003,
      },
      // 19.4.1993 — the same two, at the table and in the chair, on the evening of a final
      // that is not football.
      {
        id: 'rachel-1993',
        era: '1993-cup',
        figure: 'rachel90-apron',
        x: 0.6,
        y: 0.84,
        size: 0.426,
        nameHe: 'רחל',
        talk: 'rachel-1993',
        sway: 0.004,
      },
      {
        id: 'kobi-1993',
        era: '1993-cup',
        figure: 'kobi90-paper',
        x: 0.28,
        y: 0.8,
        size: 0.4,
        nameHe: 'קובי',
        talk: 'kobi-1993',
        sway: 0.002,
      },
      {
        id: 'rachel-army',
        era: '1996-army',
        figure: 'rachel90-hips',
        x: 0.6,
        y: 0.84,
        size: 0.426,
        nameHe: 'רחל',
        talk: 'rachel-army',
        sway: 0.004,
      },
      {
        id: 'kobi-army',
        era: '1996-army',
        figure: 'kobi90-paper',
        x: 0.28,
        y: 0.8,
        size: 0.4,
        nameHe: 'קובי',
        talk: 'kobi-army',
        sway: 0.002,
      },
      // 2.5.1998 — the careful father; 1999 and 2000 — the father with the old scarf
      { id: 'kobi-laces', era: '1998-laces', figure: 'kobi90-paper', x: 0.28, y: 0.8, size: 0.4, nameHe: 'קובי', talk: 'kobi-laces', sway: 0.002 },
      { id: 'rachel-laces', era: '1998-laces', figure: 'rachel90-watch', x: 0.6, y: 0.84, size: 0.426, nameHe: 'רחל', talk: 'rachel-1993', sway: 0.004 },
      { id: 'kobi-cup99', era: '1999-cup', figure: 'kobi90-bag', x: 0.28, y: 0.82, size: 0.42, nameHe: 'קובי', talk: 'kobi-cup99', sway: 0.002 },
      { id: 'kobi-title', era: '2000-title', figure: 'kobi90-stand', x: 0.28, y: 0.82, size: 0.42, nameHe: 'קובי', talk: 'kobi-title', sway: 0.002 },
      { id: 'kobi-double', era: '2000-double', figure: 'kobi90-cheer', x: 0.28, y: 0.82, size: 0.42, nameHe: 'קובי', talk: 'kobi-double', sway: 0.002 },
      {
        id: 'rachel-home',
        era: '1990',
        figure: 'rachel90',
        // By the sofa, not on the kitchen doorway's spawn — a mother the boy walked
        // out of the kitchen INTO was the first thing the 1990 board showed.
        x: 0.6,
        y: 0.84,
        size: 0.45,
        nameHe: 'רחל',
        talk: 'rachel-1990',
        sway: 0.004,
      },
    ],
    hotspots: [
      { id: 'radio', x: 0.13, y: 0.78, w: 0.1, act: 'radio', verb: 'watch', labelHe: 'הטלוויזיה' },
      { id: 'photo', x: 0.42, y: 0.76, w: 0.08, act: 'family-photo', verb: 'look', labelHe: 'התמונות' },
      { id: 'table', x: 0.45, y: 0.84, w: 0.1, act: 'coffee-table', verb: 'look', labelHe: 'השולחן' },
      // 1990: the phone rings when you pass it, and the photograph is four years older.
      { id: 'phone-1990', era: '1990', x: 0.13, y: 0.78, w: 0.1, act: 'phone-1990', verb: 'look', labelHe: 'הטלפון' },
      { id: 'photo-1990', era: '1990', x: 0.42, y: 0.76, w: 0.08, act: 'photo-1990', verb: 'look', labelHe: 'התמונות' },
      { id: 'tv-1993', era: '1993-cup', x: 0.13, y: 0.78, w: 0.1, act: 'tv-1993', verb: 'watch', labelHe: 'הטלוויזיה' },
    ],
    exits: [
      {
        id: 'street',
        x: 0.0,
        y: 0.73,
        w: 0.075,
        h: 0.27,
        to: 'street',
        spawn: 'fromHome',
        labelHe: 'לרחוב',
        // The way out of the flat: daylight on the floor at the edge of the frame. It is
        // the only cold-warm light in a room lit by an afternoon window, which is the
        // whole reason it reads as OUTSIDE rather than as another room.
        light: { x: 0.0, y: 0.6, w: 0.085, h: 0.4, tone: 'daylight' },
        // The first lock in the game, and it is the reason the bedroom is not scenery: a
        // child in 1986 does not leave the flat without the key on the string.
        needs: { hasItem: 'house-key' },
        /**
         * 1991 is the first year the front door is locked by a SENTENCE rather than by an
         * object. Until seven in the evening it is an ordinary door; after that it needs
         * either the permission Rachel gave or the note left under the glass on the
         * kitchen table (§32). Refusing is a branch, not a wall: the note is always there.
         */
        needsByEra: {
          '1990': null,
          // the decade: a teenager and a man do not need the key on the string
          '1990s': null,
          '2000s': null,
          // the days before the Saturday: somebody is home, the door is open
          'a2-alley': null,
          'a3-hall': null,
          'a4-shirt': null,
          'a5-first': null,
          'a6-radio': null,
          'a7-week': null,
          '1991': {
            any: [
              { beforeMinute: 19 * 60 },
              { flag: 'permission:yes' },
              { flag: 'sneak:ready' },
              { flag: 'derby:over' },
            ],
          },
        },
        blockedHe: 'בלי המפתח אמא לא נותנת לצאת. הוא במגירה בחדר שלך.',
        blockedByEra: { '1991': 'אמא אמרה לא. לא הערב. (במטבח יש פנקס ועיפרון.)' },
        dwellMs: 260,
        priority: 2,
      },
      {
        id: 'kitchen',
        // the doorway in the back wall of the 4.9 painting: 0.33–0.44
        x: 0.325,
        y: 0.73,
        w: 0.12,
        h: 0.055,
        to: 'kitchen',
        spawn: 'fromHome',
        labelHe: 'למטבח',
        light: { x: 0.335, y: 0.14, w: 0.1, h: 0.6, tone: 'inside' },
        dwellMs: 420,
      },
      {
        id: 'bedroom',
        x: 0.895,
        y: 0.73,
        w: 0.105,
        h: 0.06,
        to: 'bedroom',
        spawn: 'fromHome',
        labelHe: 'לחדר שלך',
        light: { x: 0.9, y: 0.06, w: 0.095, h: 0.66, tone: 'inside' },
        dwellMs: 420,
      },
    ],
  },

  // ------------------------------------------------------------------- kitchen ----
  {
    id: 'kitchen',
    titleHe: 'המטבח',
    art: 'kitchen',
    // Repainted 3.9.2026. The old kitchen was a 4.3× upscale of one panel of a concept
    // board — the example `docs/life/ART-PROMPTS.md` opened with — and it was framed at a
    // three-quarter angle onto a cluttered corner, which left a walk band eight percent of
    // the frame deep. This one is straight-on with an empty floor, so the band nearly
    // doubles, and its doorway is on the LEFT and shows a corner of the living room
    // through it. That is why the exit, the spawn and both hotspots move: the room turned
    // around, and the scene turns around with it.
    band: { far: 0.68, near: 0.985 },
    size: { far: 0.24, near: 0.38 },
    ambience: 'kitchen',
    stuckHe: 'חזרה לסלון — משמאל.',
    stuckByEra: {
      '1990': 'הטבלה על השולחן, אבא לידה. חזרה לסלון — משמאל.',
      '1991': 'פנקס ועיפרון על השולחן. חזרה לסלון — משמאל.',
    },
    spawns: { fromHome: { x: 0.2, y: 0.9, facing: 'right' } , start: { x: 0.2, y: 0.9, facing: 'right' } },
    actors: [
      {
        id: 'rachel',
        figure: 'rachel',
        x: 0.55,
        y: 0.9,
        size: 0.42,
        nameHe: 'רחל',
        talk: 'rachel-kitchen',
        sway: 0.004,
      },
      // ---- 1990: the kitchen table is where the chapter opens ----
      {
        id: 'kobi-table',
        era: '1990',
        figure: 'kobi90-paper',
        // At the table, on the near chair, at the back of the room — the table in the
        // painting stands against the far wall, so a father "at the table" sits on the
        // far line of the band, small, not in the middle of the floor at full size.
        // On the near chair itself — the chairs in the painting stand at 0.77–0.8, feet
        // on the 0.68 line, the band's far edge. Actor size is absolute, not banded: a
        // man sitting that far back is drawn at the far line's size, times a sitting man.
        x: 0.785,
        y: 0.68,
        size: 0.2,
        nameHe: 'קובי',
        talk: 'kobi-table-1990',
      },
      {
        id: 'rachel-kitchen',
        era: '1990',
        figure: 'rachel90-apron',
        // At the sink, on the far line — out of the doorway the boy walks in through.
        // At 0.3/0.9 she stood on the spawn's path and he walked into her.
        x: 0.42,
        y: 0.73,
        size: 0.32,
        nameHe: 'רחל',
        talk: 'rachel-1990',
        sway: 0.004,
      },
    ],
    hotspots: [
      { id: 'radio-a6', era: 'a6-radio', x: 0.93, y: 0.78, w: 0.05, act: 'radio-a6', verb: 'look', labelHe: 'הטרנזיסטור', prop: { key: 'propRadio', size: 0.032, at: { x: 0.855, y: 0.485 } } },
      // On the floor at the end of the run of cupboards, which is where a crate of empties
      // lives in a flat that takes them back for the deposit.
      { id: 'crate', x: 0.3, y: 0.92, w: 0.11, act: 'bottles', verb: 'take', labelHe: 'הבקבוקים' },
      // The little table under the mirror, with the oilcloth on it and the chairs pushed in.
      { id: 'table', x: 0.86, y: 0.9, w: 0.12, act: 'kitchen-table', verb: 'look', labelHe: 'השולחן' },
      // 1990: the paper open on the table, and the radio beside it.
      { id: 'table-1990', era: '1990', x: 0.86, y: 0.78, w: 0.07, act: 'table-1990', verb: 'look', labelHe: 'הטבלה', priority: 2 },
      // sit down at the table: the kitchen from the boy's own chair
      { id: 'chair-1990', era: '1990', x: 0.7, y: 0.8, w: 0.06, act: 'pano:panoKitchen90', verb: 'sit', labelHe: 'לשולחן' },
      // ON the table, beside the paper: drawn on the oilcloth, reached from the floor in
      // front of it.
      { id: 'radio-1990', era: '1990', x: 0.93, y: 0.78, w: 0.05, act: 'radio-table-1990', verb: 'look', labelHe: 'הטרנזיסטור', prop: { key: 'propRadio', size: 0.032, at: { x: 0.855, y: 0.485 } } },
      { id: 'radio-galil', era: '1993-galil', x: 0.93, y: 0.78, w: 0.05, act: 'g4-radio', verb: 'look', labelHe: 'הטרנזיסטור', prop: { key: 'propRadio', size: 0.032, at: { x: 0.855, y: 0.485 } }, when: { flag: 'life:galil:d4' } },
      // 1991: the pad and the pencil Rachel writes her lists with — and the only way out
      // of a "no" that is not a lie (§32).
      { id: 'pad-1991', era: '1991', x: 0.86, y: 0.82, w: 0.08, act: 'kitchen-note-1991', verb: 'look', labelHe: 'הפנקס' },
    ],
    exits: [
      {
        id: 'out',
        x: 0.0,
        y: 0.66,
        w: 0.09,
        h: 0.32,
        to: 'home',
        spawn: 'fromKitchen',
        labelHe: 'לסלון',
        light: { x: 0.0, y: 0.38, w: 0.095, h: 0.6, tone: 'inside' },
        dwellMs: 220,
      },
    ],
  },

  // -------------------------------------------------------------------- street ----
  //
  // Repainted 2.9.2026 to a purpose-drawn frame (`docs/life/street-backdrop-spec.png`).
  // The picture that came before it was a beautiful painting with twelve people in it,
  // and every one of them was frozen for the whole afternoon — which is why a street
  // with a schedule and an ambient system still read as dead. This one is empty on
  // purpose: everybody standing in it is drawn by the game.
  //
  // It ships in three plates. `streetGround` is the near paving, drawn BEHIND everyone;
  // the backdrop is the buildings; `streetFore` is the doorway column, the utility pole
  // and the gate pillar, drawn in FRONT. A child who walks behind a pole is the whole
  // difference between a painting and a place (brief §27).
  {
    id: 'street',
    titleHe: 'הרחוב',
    art: 'street',
    artByEra: { '1990': 'street90', '1991': 'street90', '1990s': 'street90', '2000s': 'street90' },
    band: { far: 0.705, near: 0.86 },
    size: { far: 0.185, near: 0.29 },
    ambience: 'day',
    stuckHe: 'הקיוסק משמאל, המגרש בסמטה. מזרחה הולכים רק כשיודעים לאן — תשאל מישהו.',
    stuckByEra: {
      '1990': 'אופיר ועמית ליד הקיוסק. מזרחה — אחרי האדומים.',
      '1991': 'בית הספר משמאל, האולם מזרחה, הבית מאחורייך.',
    },
    layers: [
      // Behind everybody: the near paving and the kerb, with the tree shadows on it.
      { art: 'streetGround', x: 0, y: 0, w: 1, depth: 0.69 },

      // --- הרחוב ביום משחק — the dressing -----------------------------------------
      //
      // Nothing below changes what the street DOES. It changes what the street is: a
      // painted set becomes somewhere people live, and — this is the part worth the
      // work — it changes across the afternoon. Pennants and a flag off a balcony are
      // up all day, because the neighbourhood knew before the child did. The car at the
      // kerb belongs to somebody who has not left yet, so it is gone once Kobi goes and
      // the street empties eastward. A player who crosses this street at noon and again
      // at four is looking at two different afternoons, and never reads a word about it.
      { art: 'propBunting', x: 0.245, y: 0.1, w: 0.62, depth: 0.1 },
      { art: 'propBunting', x: 0.455, y: 0.212, w: 0.56, depth: 0.11, flip: true, alpha: 0.93 },
      // hung over the wall the graffiti is on, at the height a person hangs a thing
      { art: 'propBanner', x: 0.598, y: 0.398, w: 0.138, depth: 0.66 },
      { art: 'propPlanter', x: 0.552, y: 0.736, w: 0.05, depth: 0.736, foot: true },
      { art: 'propBin', x: 0.352, y: 0.742, w: 0.021, depth: 0.742, foot: true },
      {
        art: 'propCar',
        x: 0.845,
        y: 0.786,
        w: 0.1,
        depth: 0.786,
        foot: true,
        when: { beforeMinute: KOBI_LEAVES },
      },

      // In front of everybody: the pole, the pillar, the doorway column, the canopy.
      { art: 'streetFore', x: 0, y: 0, w: 1, depth: 0.995 },
    ],
    spawns: {
      fromHome: { x: 0.115, y: 0.79, facing: 'right' },
      fromKiosk: { x: 0.37, y: 0.8, facing: 'right' },
      fromPitch: { x: 0.55, y: 0.79, facing: 'left' },
      fromRoute: { x: 0.935, y: 0.81, facing: 'left' },
      fromUss: { x: 0.82, y: 0.81, facing: 'left' },
      fromSchool: { x: 0.7, y: 0.8, facing: 'left' },
      fromBus: { x: 0.8, y: 0.8, facing: 'right' },
      fromFar: { x: 0.8, y: 0.81, facing: 'right' },
    },
    actors: [
      // ---- שלב א׳, הימים שלפני השבת ----
      { id: 'efi-a3', era: 'a3-hall', figure: 'efi', x: 0.62, y: 0.79, size: 0.26, nameHe: 'אפי', talk: 'efi-a3', sway: 0.006 },
      { id: 'kobi-a5', era: 'a5-first', figure: 'kobi-side', x: 0.78, y: 0.8, size: 0.32, nameHe: 'קובי', talk: 'kobi-a5', flip: true, when: { none: [{ flag: 'a5:kobi-left' }] } },
      { id: 'liron-a6', era: 'a6-radio', figure: 'adultB2', x: 0.56, y: 0.8, size: 0.29, nameHe: 'לירון', talk: 'liron-a6' },
      { id: 'amit-a7', era: 'a7-week', figure: 'amit', x: 0.36, y: 0.79, size: 0.26, nameHe: 'עמית', talk: 'amit-a7' },
      { id: 'ofir-a7', era: 'a7-week', figure: 'ofir', x: 0.56, y: 0.79, size: 0.26, nameHe: 'אופיר', talk: 'ofir-a7', flip: true, sway: 0.006 },
      {
        id: 'ofir',
        figure: 'ofir',
        x: 0.185,
        y: 0.775,
        size: 0.26,
        nameHe: 'אופיר',
        talk: 'ofir-wall',
        when: { beforeMinute: KOBI_LEAVES },
        sway: 0.006,
      },
      {
        id: 'amit-street',
        figure: 'amit',
        x: 0.375,
        y: 0.755,
        size: 0.28,
        nameHe: 'עמית',
        talk: 'amit-street',
        sway: 0.003,
      },
      {
        id: 'neighbour',
        // Moved left of the planter on 3.9.2026, by a guard rather than by an eye: at
        // 0.525 he stood at the back of the band with the planter drawn one thousandth of
        // a band in front of him and overlapping. Nobody had noticed, because he is
        // visible from the shoulders up — which is exactly the failure mode a person you
        // are supposed to talk to should never have.
        figure: 'adultB1',
        x: 0.468,
        y: 0.735,
        size: 0.22,
        nameHe: 'אילן השכן',
        talk: 'neighbour',
        sway: 0.004,
      },
      {
        id: 'ofir-later',
        figure: 'ofir',
        x: 0.665,
        y: 0.79,
        size: 0.26,
        nameHe: 'אופיר',
        talk: 'ofir-matchday',
        when: { afterMinute: KOBI_LEAVES },
      },
      {
        id: 'keren',
        figure: 'keren',
        x: 0.715,
        y: 0.815,
        size: 0.27,
        nameHe: 'קרן',
        talk: 'keren-street',
        sway: 0.003,
      },
      // ---- 1991: the same street after school, on a day with a night in it ----
      {
        id: 'ofir-street-1991',
        era: '1991',
        figure: 'ofir90-walk',
        // West of the kiosk door, so a boy walking home from the school gate passes him.
        x: 0.16,
        y: 0.79,
        size: 0.28,
        nameHe: 'אופיר',
        talk: 'ofir-afternoon-1991',
        sway: 0.005,
      },
      // 19.4.1993 — the street on the afternoon of the cup final. Efi and Limor have no
      // grown figure yet (KNOWN-GAPS); they stand in the nineties' clothes until they do.
      {
        id: 'efi-1993',
        era: '1993-cup',
        figure: 'youngA2',
        x: 0.32,
        y: 0.8,
        size: 0.262,
        nameHe: 'אפי',
        talk: 'efi-1993',
        sway: 0.003,
      },
      {
        id: 'ofir-1993',
        era: '1993-cup',
        figure: 'ofir90-3q',
        x: 0.56,
        y: 0.79,
        size: 0.275,
        nameHe: 'אופיר',
        talk: 'ofir-1993',
        sway: 0.003,
      },
      {
        id: 'amit-1993',
        era: '1993-cup',
        figure: 'amit90',
        x: 0.63,
        y: 0.8,
        size: 0.283,
        nameHe: 'עמית',
        talk: 'amit-1993',
        flip: true,
      },
      {
        id: 'ofir-galil',
        era: '1993-galil',
        figure: 'ofir90-arms',
        x: 0.56,
        y: 0.79,
        size: 0.275,
        nameHe: 'אופיר',
        talk: 'g4-ofir',
        sway: 0.003,
        when: { flag: 'life:galil:d4' },
      },
      {
        id: 'ofir-army',
        era: '1996-army',
        figure: 'ofir90-smoke',
        x: 0.56,
        y: 0.79,
        size: 0.275,
        nameHe: 'אופיר',
        talk: 'ofir-army',
        when: { flag: 'life:army:d1' },
      },
      { id: 'ofir-laces', era: '1998-laces', figure: 'ofir90-smoke', x: 0.56, y: 0.79, size: 0.275, nameHe: 'אופיר', talk: 'ofir-laces' },
      { id: 'amit-laces', era: '1998-laces', figure: 'amit90-point', x: 0.63, y: 0.8, size: 0.283, nameHe: 'עמית', talk: 'ofir-laces', flip: true },
      { id: 'soko-laces', era: '1998-laces', figure: 'soko', x: 0.3, y: 0.8, size: 0.283, nameHe: 'סוקו', talk: 'soko-laces' },
      { id: 'liron-cup99', era: '1999-cup', figure: 'adultB2', x: 0.3, y: 0.8, size: 0.283, nameHe: 'לירון', talk: 'liron-cup99' },
      { id: 'michel-cup99', era: '1999-cup', figure: 'adultA3', x: 0.44, y: 0.8, size: 0.283, nameHe: 'מישל', talk: 'michel-cup99' },
      { id: 'ofir-cup99', era: '1999-cup', figure: 'ofir90-arms', x: 0.58, y: 0.79, size: 0.275, nameHe: 'אופיר', talk: 'ofir-cup99' },
      { id: 'efi-cup99', era: '1999-cup', figure: 'youngA2', x: 0.72, y: 0.8, size: 0.262, nameHe: 'אפי', talk: 'efi-cup99', flip: true },
      { id: 'michel-title', era: '2000-title', figure: 'adultA3', x: 0.44, y: 0.8, size: 0.283, nameHe: 'מישל', talk: 'michel-title' },
      { id: 'efi-title', era: '2000-title', figure: 'youngA2', x: 0.72, y: 0.8, size: 0.262, nameHe: 'אפי', talk: 'efi-title', flip: true },
      // ---- 1990: the same street, older children ----
      {
        id: 'ofir-street',
        era: '1990',
        figure: 'ofir90',
        x: 0.2,
        y: 0.78,
        size: 0.28,
        nameHe: 'אופיר',
        talk: 'ofir-1990',
        sway: 0.004,
      },
      {
        id: 'amit-street',
        era: '1990',
        figure: 'amit90',
        x: 0.57,
        y: 0.79,
        size: 0.31,
        nameHe: 'עמית',
        talk: 'amit-1990',
      },
      { id: 'kobi-walk', era: '1990', figure: 'kobi90-side', x: 0.15, y: 0.8, size: 0.32, nameHe: 'קובי', talk: 'kobi-found-1990', flip: true, when: { flag: 'found:kobi' } },
      {
        id: 'veteran',
        era: '1990',
        figure: 'adultA3',
        x: 0.66,
        y: 0.8,
        size: 0.32,
        nameHe: 'אוהד ותיק',
        talk: 'veteran-1990',
        flip: true,
        sway: 0.003,
      },
    ],
    hotspots: [
      { id: 'wall', era: '*', x: 0.6, y: 0.745, w: 0.09, act: 'wall-writing', verb: 'look', labelHe: 'הכתובת על הקיר' },
      { id: 'poster-1990', era: '1990', x: 0.82, y: 0.82, w: 0.05, act: 'poster-1990', verb: 'look', labelHe: 'המודעה על העמוד' },
      // The pole the whole near side of the street hangs off — stickers, a scrap of a
      // torn notice, and the one place a child would stop and read something.
      { id: 'pole', x: 0.82, y: 0.82, w: 0.05, act: 'street-pole', verb: 'look', labelHe: 'העמוד' },
      {
        id: 'coin',
        x: 0.47,
        y: 0.83,
        w: 0.05,
        act: 'gutter-coin',
        verb: 'take',
        labelHe: 'משהו נוצץ',
        when: { notFlag: 'found:coin' },
        priority: 3,
      },
    ],
    exits: [
      {
        id: 'home',
        x: 0.0,
        y: 0.705,
        w: 0.085,
        h: 0.155,
        to: 'home',
        spawn: 'fromStreet',
        labelHe: 'הביתה',
        light: { x: 0.008, y: 0.44, w: 0.066, h: 0.3, tone: 'inside' },
        dwellMs: 300,
      },
      {
        id: 'kiosk',
        x: 0.235,
        y: 0.72,
        w: 0.1,
        h: 0.14,
        to: 'kiosk',
        spawn: 'fromStreet',
        labelHe: 'לקיוסק',
        light: { x: 0.24, y: 0.42, w: 0.115, h: 0.32, tone: 'inside' },
        // A shop is somewhere you STOP, so its door takes a moment of standing still.
        // Walking past a kiosk on your way east must never put you inside it.
        dwellMs: 900,
      },
      {
        id: 'pitch',
        // Shallow on purpose: the alley mouth sits at the BACK of the band, so a child
        // walking the pavement never falls into it. You go up to it, or you press the
        // button. A back alley you enter by accident is not a back alley.
        x: 0.425,
        y: 0.705,
        w: 0.08,
        h: 0.05,
        to: 'pitch',
        spawn: 'fromStreet',
        labelHe: 'לסמטה ולמגרש',
        light: { x: 0.425, y: 0.44, w: 0.07, h: 0.3, tone: 'inside' },
        dwellMs: 900,
      },
      {
        /**
         * בית הספר — the gate in the gap between the painted wall and the pole (0.62–0.69).
         *
         * Tagged 1991 and not `*`, which is the one place this file bends its own rule
         * that a door is geography. The gap is exactly where the 1990 street stands its
         * veteran with the radio, and a door drawn through a person is worse than a door
         * that is not there on a Saturday — when the school is shut anyway. The day this
         * neighbourhood gets a weekday in 1986, this gate gets that era too and a lock
         * with a sentence on it, like every other shut door in the game.
         */
        id: 'school',
        era: '1991',
        x: 0.62,
        y: 0.705,
        w: 0.07,
        h: 0.15,
        to: 'schoolyard',
        spawn: 'fromStreet',
        labelHe: 'לחצר בית הספר',
        light: { x: 0.625, y: 0.5, w: 0.06, h: 0.26, tone: 'daylight' },
        dwellMs: 900,
      },
      {
        // The neighbourhood sports hall, Ussishkin. Not a door in this frame — the hall is
        // down the side street that opens east of the painted wall, so the exit sits in
        // that gap (0.725–0.79), between the wall's end and the pole. It was first placed
        // ON the wall (0.64–0.72): a doorway through the graffiti, on top of the `wall`
        // hotspot and on the exact spot where Ofir (14:50) and Keren stand — the
        // schedule guard in life-systems caught it. A place you STOP (dwell 900), so
        // walking east never pulls the child in. Its real home is a dedicated 1980s
        // basketball beat; for now the way is open so the hall can be walked to and seen.
        id: 'ussishkin',
        x: 0.725,
        y: 0.705,
        w: 0.065,
        h: 0.15,
        to: 'ussishkin-outside',
        spawn: 'fromStreet',
        labelHe: 'לאולם אוסישקין',
        light: { x: 0.73, y: 0.5, w: 0.055, h: 0.26, tone: 'daylight' },
        dwellMs: 900,
      },
      {
        id: 'route',
        x: 0.945,
        y: 0.705,
        w: 0.055,
        h: 0.155,
        to: 'route',
        spawn: 'fromStreet',
        labelHe: 'מזרחה, אחרי האנשים',
        light: { x: 0.935, y: 0.52, w: 0.065, h: 0.4, tone: 'daylight' },
        dwellMs: 420,
        priority: 2,
        // You cannot follow a crowd you have not noticed. Either Kobi told you there is a
        // match, or Ofir did — otherwise east is just a street, and the child says so.
        needs: { flag: 'knows:match' },
        // 1990: the table told him there is a match before he had control. East is open.
        needsByEra: { '1990': null, '1990s': null, '2000s': null },
        blockedHe: 'לאן? אתה בכלל לא יודע מה קורה שם היום.',
      },
      /**
       * Three doors that exist in one chapter each. They are not geography — the central
       * bus station, Ramat Gan and Hatikva are a bus ride away — they are the WAY a
       * chapter leaves the neighbourhood, and a beat may also carry the player there. A
       * door is still drawn, because a room the player can only be teleported into is a
       * room he can never choose to go back to.
       */
      {
        id: 'busStation',
        era: '1996-army',
        x: 0.85,
        y: 0.705,
        w: 0.075,
        h: 0.155,
        to: 'bus-station',
        spawn: 'start',
        labelHe: 'לתחנה המרכזית',
        light: { x: 0.855, y: 0.52, w: 0.065, h: 0.38, tone: 'daylight' },
        dwellMs: 900,
      },
      {
        id: 'ramatGan',
        era: ['1999-cup', '2000-double'],
        x: 0.85,
        y: 0.705,
        w: 0.075,
        h: 0.155,
        to: 'ramat-gan',
        spawn: 'start',
        labelHe: 'לרמת גן, לגמר',
        light: { x: 0.855, y: 0.52, w: 0.065, h: 0.38, tone: 'daylight' },
        dwellMs: 900,
      },
      {
        id: 'hatikva',
        era: '2000-title',
        x: 0.85,
        y: 0.705,
        w: 0.075,
        h: 0.155,
        to: 'hatikva',
        spawn: 'start',
        labelHe: 'לשכונת התקווה',
        light: { x: 0.855, y: 0.52, w: 0.065, h: 0.38, tone: 'daylight' },
        dwellMs: 900,
      },
    ],
  },

  // --------------------------------------------------------------------- kiosk ----
  {
    id: 'kiosk',
    titleHe: 'הקיוסק',
    art: 'kiosk',
    // Repainted 3.9.2026, and the old one was not a worse painting of this place — it was
    // a painting of a DIFFERENT place. `kiosk` has always been an interior the child walks
    // into, and the art was a shopfront seen from the pavement, so the backdrop and the
    // scene disagreed about where the player was standing. This is the inside: the
    // counter, the scale and the till, shelves of boxes, the ice-cream chest, and the
    // doorway back out to the street. It is mirrored at ingest so that doorway is on the
    // right, where this scene's exit has always been.
    band: { far: 0.7, near: 0.985 },
    size: { far: 0.2, near: 0.32 },
    ambience: 'day',
    stuckHe: 'רפי מחכה. לצאת — ימינה.',
    stuckByEra: { '1990': 'אופיר ועמית פה. הרחוב — ימינה, ומשם מזרחה.' },
    spawns: { fromStreet: { x: 0.74, y: 0.93, facing: 'left' } , start: { x: 0.74, y: 0.93, facing: 'left' } },
    actors: [
      { id: 'ofir-a2', era: 'a2-alley', figure: 'ofir', x: 0.6, y: 0.92, size: 0.3, nameHe: 'אופיר', talk: 'alley-a2', sway: 0.009 },
      { id: 'amit-a2', era: 'a2-alley', figure: 'amit', x: 0.83, y: 0.87, size: 0.26, nameHe: 'עמית', talk: 'alley-a2', flip: true },
      { id: 'efi-a2', era: 'a2-alley', figure: 'efi', x: 0.26, y: 0.74, size: 0.28, nameHe: 'אפי', talk: 'alley-a2', sway: 0.01 },
      { id: 'rafi-a2', era: 'a2-alley', figure: 'oldMan', x: 0.3, y: 0.9, size: 0.34, nameHe: 'רפי מהקיוסק', talk: 'rafi-a2', sway: 0.004 },
      { id: 'rafi-a4', era: 'a4-shirt', figure: 'oldMan', x: 0.3, y: 0.9, size: 0.34, nameHe: 'רפי מהקיוסק', talk: 'rafi-a4', sway: 0.004 },
      {
        id: 'shopkeeper',
        // 4.9.2026: the kiosk owner drawn at last — heavy, grey moustache, white shirt over
        // a vest, reading glasses pushed up. For a week he was one of the September adults
        // because the old `oldMan` was a chibi cut from the first concept board.
        figure: 'oldMan',
        x: 0.3,
        y: 0.9,
        size: 0.34,
        nameHe: 'רפי מהקיוסק',
        talk: 'kiosk-man',
        sway: 0.004,
      },
      // Before one o'clock he is in here spending his own money on the paper. Catch him
      // at the counter and the information costs you nothing; catch him in the street an
      // hour later and he has already read it and wants something for it.
      {
        id: 'amit-kiosk',
        figure: 'amit',
        x: 0.66,
        y: 0.9,
        size: 0.31,
        nameHe: 'עמית',
        talk: 'amit-kiosk',
        flip: true,
      },
      // ---- 1990 ----
      {
        id: 'shopkeeper-1990',
        era: '1990',
        figure: 'oldMan-arms',
        x: 0.3,
        y: 0.9,
        size: 0.38,
        nameHe: 'רפי מהקיוסק',
        talk: 'kiosk-man-1990',
        sway: 0.004,
      },
      {
        id: 'shopkeeper-1993',
        era: '1993-cup',
        figure: 'oldMan-lean',
        x: 0.5,
        y: 0.8,
        size: 0.275,
        nameHe: 'רפי מהקיוסק',
        talk: 'rafi-1993',
        sway: 0.003,
      },
      // the winter of 1996/97 at the kiosk: the court sits again, with a lawyer in it
      { id: 'shopkeeper-army', era: '1996-army', figure: 'oldMan-wipe', x: 0.5, y: 0.8, size: 0.275, nameHe: 'רפי מהקיוסק', talk: 'a4-winter', sway: 0.003 },
      { id: 'amit-army', era: '1996-army', figure: 'amit90-point', x: 0.3, y: 0.84, size: 0.294, nameHe: 'עמית', talk: 'a4-winter', when: { flag: 'life:army:d4' } },
      { id: 'freddy-army', era: '1996-army', figure: 'freddy-glass', x: 0.72, y: 0.85, size: 0.298, nameHe: 'פרדי', talk: 'a4-freddy', when: { flag: 'life:army:d4' }, flip: true },
      { id: 'liron-army', era: '1996-army', figure: 'adultB2', x: 0.86, y: 0.86, size: 0.303, nameHe: 'לירון', talk: 'a4-liron', when: { flag: 'life:army:d4' }, flip: true },
      { id: 'yaron-army', era: '1996-army', figure: 'adultA4', x: 0.14, y: 0.86, size: 0.303, nameHe: 'ירון', talk: 'yaron-base', when: { flag: 'life:army:d4' } },
      // the same kiosk, June 1994 and August 1995: the court of the poster
      { id: 'shopkeeper-sinai', era: '1995-sinai', figure: 'oldMan-lean', x: 0.5, y: 0.8, size: 0.275, nameHe: 'רפי מהקיוסק', talk: 'rafi-sinai', sway: 0.003 },
      { id: 'ofir-sinai', era: '1995-sinai', figure: 'ofir90-arms', x: 0.28, y: 0.84, size: 0.294, nameHe: 'אופיר', talk: 'ofir-sinai' },
      { id: 'amit-sinai', era: '1995-sinai', figure: 'amit90', x: 0.74, y: 0.85, size: 0.298, nameHe: 'עמית', talk: 'amit-sinai', flip: true, when: { flag: 'life:sinai:d2' } },
      { id: 'freddy-sinai', era: '1995-sinai', figure: 'freddy', x: 0.86, y: 0.86, size: 0.303, nameHe: 'פרדי', talk: 'freddy-sinai', flip: true, when: { flag: 'life:sinai:d2' } },
      // 1999 — the kiosk at night: Gate 5 as work before it is iconography
      { id: 'asaf-seed', era: '1999-basket', figure: 'asaf-back', x: 0.5, y: 0.84, size: 0.294, nameHe: 'אסף', talk: 'seed-gate5' },
      { id: 'melamed-seed', era: '1999-basket', figure: 'melamed', x: 0.3, y: 0.85, size: 0.298, nameHe: 'מלמד', talk: 'seed-gate5' },
      { id: 'michel-seed', era: '1999-basket', figure: 'adultA3', x: 0.72, y: 0.85, size: 0.298, nameHe: 'מישל', talk: 'seed-gate5', flip: true },
      { id: 'dudu-seed', era: '1999-basket', figure: 'adultA5', x: 0.86, y: 0.86, size: 0.303, nameHe: 'דודו', talk: 'seed-gate5', flip: true },
      { id: 'omer-seed', era: '1999-basket', figure: 'hermesh', x: 0.14, y: 0.86, size: 0.303, nameHe: 'עומר', talk: 'seed-gate5' },
      { id: 'ofir-kiosk', era: '1990', figure: 'ofir90', x: 0.6, y: 0.92, size: 0.3, nameHe: 'אופיר', talk: 'ofir-1990', flip: true },
      { id: 'amit-kiosk', era: '1990', figure: 'amit90', x: 0.5, y: 0.95, size: 0.33, nameHe: 'עמית', talk: 'amit-1990' },
    ],
    hotspots: [
      { id: 'bottles-a4', era: 'a4-shirt', x: 0.82, y: 0.88, w: 0.1, act: 'bottles-a4', verb: 'look', labelHe: 'הבקבוקים ליד הפח', when: { none: [{ flag: 'a4:bottles' }] } },{ id: 'counter', era: '*', x: 0.55, y: 0.92, w: 0.14, act: 'kiosk-counter', verb: 'look', labelHe: 'הדלפק' }],
    exits: [
      {
        id: 'out',
        x: 0.9,
        y: 0.7,
        w: 0.1,
        h: 0.3,
        to: 'street',
        spawn: 'fromKiosk',
        labelHe: 'לרחוב',
        light: { x: 0.9, y: 0.6, w: 0.1, h: 0.38, tone: 'daylight' },
        dwellMs: 240,
      },
    ],
  },

  // --------------------------------------------------------------------- pitch ----
  {
    id: 'pitch',
    titleHe: 'המגרש',
    art: 'pitch',
    // Repainted 3.9.2026, for the same reason the street was repainted a day earlier: the
    // old pitch had TEN BOYS painted onto it, and every one of them was frozen there for
    // the whole afternoon. A place with people painted into it cannot have people in it.
    // This one is empty earth between a wall and a fence, and the children on it are the
    // game's — which is also why the band goes back nearly to the far wall now, and why
    // the size range widens with it: a pitch is the one place in this chapter with real
    // depth in it, and a child at the far end should read as a child at the far end.
    band: { far: 0.56, near: 0.945 },
    /**
     * 1.68×, not 2.31×, and the pitch is the screen this was found on.
     *
     * A walk band is a ground plane, and a ground plane has a scale ratio the camera
     * decides. 0.13→0.30 is a 2.3× ramp across a band that fills a third of the frame,
     * which is not perspective — it is a zoom, and it is why crossing this yard read as
     * being pushed towards the camera rather than as walking. Every other scene in this
     * game sits between 1.27× and 1.68×; the yard is the deepest space in the chapter and
     * it now sits at the top of that range instead of half again beyond it.
     */
    size: { far: 0.17, near: 0.285 },
    ambience: 'day',
    stuckHe: 'הכדור באמצע. חזרה לרחוב — שמאלה.',
    spawns: { fromStreet: { x: 0.13, y: 0.84, facing: 'right' } , start: { x: 0.13, y: 0.84, facing: 'right' } },
    actors: [
      {
        id: 'efi',
        figure: 'efi',
        // Pushed to the back of the new band on purpose. The pitch is the one place in
        // this chapter with real depth in it, and three people standing on the same line
        // is what makes a deep band look like a shallow one.
        x: 0.26,
        y: 0.74,
        size: 0.28,
        nameHe: 'אפי',
        talk: 'efi-hall',
        sway: 0.01,
      },
      { id: 'amit', figure: 'amit', x: 0.83, y: 0.87, size: 0.26, nameHe: 'עמית', talk: 'pitch-kids', flip: true },
      // Ofir moves here at twenty to two. The street he was leaning on is empty by then,
      // and a player who goes looking for him where he was is a player learning that
      // people have afternoons of their own.
      {
        id: 'ofir-pitch',
        figure: 'ofir',
        x: 0.6,
        y: 0.92,
        size: 0.3,
        nameHe: 'אופיר',
        talk: 'ofir-pitch',
        sway: 0.009,
      },
    ],
    hotspots: [
      {
        id: 'ball',
        x: 0.5,
        y: 0.81,
        w: 0.1,
        act: 'pitch-ball',
        verb: 'play',
        labelHe: 'הכדור',
        // The old `propBall` was not a ball. It was a 126×100 mis-cut of a CHILD with
        // his arm raised, and it has been standing on this pitch at seven percent of
        // the frame — a tiny malformed person where the football should be — since
        // the day the scene was written. Found by looking at a screenshot.
        prop: { key: 'propBallReal', size: 0.075 },
        priority: 3,
      },
    ],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.6,
        w: 0.06,
        h: 0.38,
        to: 'street',
        spawn: 'fromPitch',
        labelHe: 'לרחוב',
        light: { x: 0.0, y: 0.55, w: 0.05, h: 0.42, tone: 'daylight' },
        dwellMs: 300,
      },
    ],
  },

  // --------------------------------------------------------------------- route ----
  //
  // The road east, repainted to `docs/life/route-backdrop-spec.png`: an empty avenue
  // with crowd barriers stacked against the far pavement, bunting overhead, and — over
  // the rooftops on the right — the first sight of the ground. Two lattice floodlight
  // pylons and the curve of one stand, and nothing else of it. That restraint is the
  // point: the gate is the next scene and the inside is two after that, so this frame
  // may only promise.
  {
    id: 'route',
    titleHe: 'בדרך לבלומפילד',
    art: 'approach',
    band: { far: 0.69, near: 0.875 },
    size: { far: 0.185, near: 0.3 },
    ambience: 'dusk',
    // The one arrival card that is not the stadium. Stepping out of your own
    // neighbourhood for the first time deserves a frame of its own, and it is the same
    // street from further east — a place you know, seen from somewhere you have never
    // stood (brief §33).
    arrival: { art: 'streetEast', ms: 3200, flag: 'saw:road' },
    arrivalByEra: { '1990': null, '1990s': null, '2000s': null },
    stuckHe: 'כולם הולכים מזרחה. פשוט אל תעצור.',
    stuckByEra: { '1990': 'שער 7 בקצה הדרך. אבא כבר שם.' },
    // The road fills up. A coach parks halfway along it once the ground starts pulling
    // people in, and the barrier the stewards drag out is there from the moment the
    // child first walks this way — one of them is a clock, the other is a place.
    layers: [
      { art: 'propBarrier', x: 0.6, y: 0.712, w: 0.075, depth: 0.712, foot: true },
      {
        art: 'propBus',
        x: 0.275,
        y: 0.748,
        w: 0.205,
        depth: 0.748,
        foot: true,
        when: { afterMinute: KOBI_LEAVES },
      },
    ],
    spawns: { fromStreet: { x: 0.085, y: 0.78, facing: 'right' }, fromGround: { x: 0.915, y: 0.78, facing: 'left' } , start: { x: 0.085, y: 0.78, facing: 'right' } },
    actors: [
      { id: 'fan1', figure: 'adultA1', x: 0.135, y: 0.76, size: 0.26, nameHe: 'אוהד', talk: 'route-fan' },
      { id: 'fan2', figure: 'adultB1', x: 0.45, y: 0.735, size: 0.24, nameHe: 'אוהד ותיק', talk: 'route-veteran' },
      { id: 'fan3', figure: 'youngA4', x: 0.78, y: 0.8, size: 0.28, nameHe: 'אוהד', talk: 'route-fan' },
      // ---- 1990: a man walking with a radio to his ear, and Kobi beside you on the way home ----
      { id: 'radio-walker', era: '1990', figure: 'adultA5', x: 0.5, y: 0.8, size: 0.32, nameHe: 'אוהד עם רדיו', talk: 'radio-walker-1990', sway: 0.03 },
      { id: 'kobi-walk', era: '1990', figure: 'kobi90-side', x: 0.84, y: 0.8, size: 0.3, nameHe: 'קובי', talk: 'kobi-found-1990', flip: true, when: { flag: 'found:kobi' } },
    ],
    hotspots: [
      { id: 'banner', era: '*', x: 0.2, y: 0.715, w: 0.09, act: 'route-banner', verb: 'look', labelHe: 'השלט' },
      { id: 'stream-1990', era: '1990', x: 0.5, y: 0.86, w: 0.12, act: 'route-stream-1990', verb: 'look', labelHe: 'הנהר האדום' },
      // The street family's reward: a gap between two buildings that everybody who grew
      // up here uses and nobody who did not would see.
      {
        id: 'shortcut',
        x: 0.31,
        y: 0.7,
        w: 0.05,
        act: 'route-shortcut',
        verb: 'look',
        labelHe: 'הרווח בין הבתים',
        priority: 2,
      },
      { id: 'shelter', x: 0.7, y: 0.71, w: 0.08, act: 'route-shelter', verb: 'look', labelHe: 'תחנת האוטובוס' },
    ],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.69,
        w: 0.055,
        h: 0.185,
        to: 'street',
        spawn: 'fromRoute',
        labelHe: 'חזרה לרחוב',
        dwellMs: 500,
      },
      {
        id: 'ground',
        x: 0.945,
        y: 0.69,
        w: 0.055,
        h: 0.185,
        to: 'bloomfield-outside',
        spawn: 'fromRoute',
        labelHe: 'לאצטדיון',
        light: { x: 0.935, y: 0.5, w: 0.065, h: 0.4, tone: 'daylight' },
        dwellMs: 300,
        priority: 2,
      },
    ],
  },

  // -------------------------------------------------------------------- outside ---
  //
  // Gate seven, repainted to `docs/life/gate7-backdrop-spec.png` from Maor's approved
  // 1986 board. Everything in the perimeter is an interaction at the x it is drawn at:
  // the green palisade, the bank of turnstiles, the barred ticket hatch, and the dark
  // portal in the middle. The portal is painted DARK on purpose — the engine lights it
  // from inside, and a doorway that is already bright burns out when the glow lands.
  {
    id: 'bloomfield-outside',
    titleHe: 'בלומפילד — מבחוץ',
    art: 'gate7',
    band: { far: 0.8, near: 0.95 },
    size: { far: 0.2, near: 0.29 },
    ambience: 'day',
    // The first sight of the ground: a wide establishing frame of Bloomfield from the
    // street outside — played once, the moment the child first reaches it, then it cuts
    // to the turnstiles. Same mechanism as the road's `streetEast` and the terrace's
    // `reveal`; the arrival is the arrival, not a place you stand.
    arrival: { art: 'ground', ms: 3200, flag: 'saw:ground' },
    arrivalByEra: { '1990s': null, '2000s': null },
    stuckHe: 'תדבר עם מישהו. מישהו פה ייקח אותך פנימה.',
    stuckByEra: { '1990': 'שער 7. אבא אמר ליד העמוד. הקופה — מימין.' },
    // Outside a ground on a matchday: barriers stacked where the stewards left them, a
    // wall somebody has been fly-posting for twenty years, and — taped up by a hand, not
    // printed by a club — the only line of Hebrew in this frame.
    layers: [
      { art: 'propBarriers', x: 0.232, y: 0.826, w: 0.086, depth: 0.826, foot: true },
      { art: 'propPosters', x: 0.688, y: 0.748, w: 0.084, depth: 0.6, foot: true },
      { art: 'propSign', x: 0.622, y: 0.63, w: 0.048, depth: 0.6, foot: true },
    ],
    spawns: { fromRoute: { x: 0.06, y: 0.87, facing: 'right' }, fromTunnel: { x: 0.66, y: 0.93, facing: 'left' }, fromGate5: { x: 0.9, y: 0.88, facing: 'left' }, start: { x: 0.22, y: 0.9, facing: 'right' } },
    actors: [
      { id: 'barry-a5', era: 'a5-first', figure: 'adultA6', x: 0.44, y: 0.91, size: 0.3, nameHe: 'בארי', talk: 'barry-a5', sway: 0.003 },
      { id: 'kobi-a5-gate', era: 'a5-first', figure: 'kobi', x: 0.36, y: 0.9, size: 0.3, nameHe: 'קובי', talk: 'kobi-a5-gate', sway: 0.002 },
      // 16.11.1996 — the two gates. Kobi and Barry at seven; Barry has no figure yet.
      {
        id: 'kobi-gate7',
        era: '1996-army',
        figure: 'kobi90-stand',
        x: 0.36,
        y: 0.9,
        size: 0.29,
        nameHe: 'קובי',
        talk: 'kobi-gate7',
        sway: 0.002,
      },
      {
        id: 'barry-gate7',
        era: '1996-army',
        figure: 'adultA6',
        x: 0.44,
        y: 0.91,
        size: 0.302,
        nameHe: 'בארי',
        talk: 'barry-gate7',
        flip: true,
      },
      { id: 'asaf-laces', era: '1998-laces', figure: 'asaf', x: 0.86, y: 0.9, size: 0.3, nameHe: 'אסף', talk: 'asaf-laces', flip: true, when: { flag: 'l1:after' } },

      {
        id: 'veteran',
        figure: 'adultB1',
        x: 0.17,
        y: 0.88,
        size: 0.24,
        nameHe: 'אוהד ותיק',
        talk: 'gate-veteran',
        sway: 0.003,
      },
      {
        id: 'ofir-ground',
        figure: 'ofir',
        x: 0.27,
        y: 0.91,
        size: 0.29,
        nameHe: 'אופיר',
        talk: 'ofir-ground',
        when: { bond: { who: 'ofir', min: 40 } },
      },
      { id: 'steward', figure: 'adultA4', x: 0.62, y: 0.86, size: 0.23, nameHe: 'סדרן', talk: 'steward' },
      { id: 'ticket', figure: 'adultA2', x: 0.7, y: 0.9, size: 0.26, nameHe: 'הקופאי', talk: 'ticket-window', flip: true },
      // The safe way in, and the one the brief insists on (§42): a child goes through a
      // turnstile with a family, in front of a steward, in daylight. Nobody climbs
      // anything. What it costs is the nerve to ask a stranger.
      { id: 'family', figure: 'adultA3', x: 0.8, y: 0.92, size: 0.27, nameHe: 'אבא עם ילד', talk: 'gate-family' },
      { id: 'crowd-a', figure: 'youngB4', x: 0.9, y: 0.94, size: 0.28, nameHe: 'אוהד', talk: 'route-fan', flip: true },
      // ---- 1990: gate seven is home ----
      { id: 'kobi-gate', era: '1990', figure: 'kobi90-stand', x: 0.62, y: 0.9, size: 0.33, nameHe: 'קובי', talk: 'kobi-gate-1990', flip: true },
      { id: 'steward-1990', era: '1990', figure: 'adultA4', x: 0.5, y: 0.86, size: 0.3, nameHe: 'סדרן', talk: 'steward-1990' },
      { id: 'ticket-1990', era: '1990', figure: 'adultA2', x: 0.7, y: 0.9, size: 0.32, nameHe: 'הקופאי', talk: 'ticket-window-1990', flip: true },
      { id: 'ofir-ground', era: '1990', figure: 'ofir90', x: 0.33, y: 0.93, size: 0.3, nameHe: 'אופיר', talk: 'ofir-ground-1990' },
      { id: 'vendor-1990', era: '1990', figure: 'adultA6', x: 0.88, y: 0.93, size: 0.34, nameHe: 'מוכר', talk: 'vendor-1990', flip: true },
    ],
    hotspots: [
      { id: 'gate7', era: '*', x: 0.515, y: 0.86, w: 0.07, act: 'gate-seven', verb: 'look', labelHe: 'שער 7' },
      { id: 'look-gate', era: '1990', x: 0.25, y: 0.9, w: 0.07, act: 'pano:panoGate7', verb: 'gaze', labelHe: 'סביב' },
      { id: 'fence', era: '*', x: 0.08, y: 0.85, w: 0.07, act: 'fence-look', verb: 'look', labelHe: 'הגדר' },
      { id: 'turnstile', era: '*', x: 0.36, y: 0.85, w: 0.09, act: 'gate-turnstile', verb: 'look', labelHe: 'הקרוסלה' },
    ],
    exits: [
      {
        id: 'gate5',
        era: ['1996-army', '1998-laces', '1999-basket'],
        x: 0.93,
        y: 0.82,
        w: 0.07,
        h: 0.16,
        to: 'gate5',
        spawn: 'start',
        labelHe: 'מתחת ליציע, לשער 5',
        light: { x: 0.92, y: 0.55, w: 0.08, h: 0.4, tone: 'inside' },
        dwellMs: 500,
        priority: 2,
      },

      {
        id: 'back',
        x: 0.0,
        y: 0.8,
        w: 0.04,
        h: 0.15,
        to: 'route',
        spawn: 'fromGround',
        labelHe: 'חזרה',
        dwellMs: 600,
      },
      {
        id: 'in',
        x: 0.45,
        y: 0.8,
        w: 0.13,
        h: 0.13,
        to: 'bloomfield-tunnel',
        spawn: 'start',
        labelHe: 'פנימה, בשער 7',
        when: { flag: 'entry:granted' },
        // An adult with a ticket walks in. The 1996 chapter keeps him outside on purpose
        // (the gates are the scene); every later evening the turnstile is just a door.
        whenByEra: { '1998-laces': null, '1999-cup': null, '2000-title': null, '2000-double': null },
        light: { x: 0.455, y: 0.55, w: 0.125, h: 0.28, tone: 'inside' },
        dwellMs: 260,
        priority: 3,
      },
    ],
  },

  // --------------------------------------------------------------------- tunnel ---
  {
    id: 'bloomfield-tunnel',
    titleHe: 'המנהרה',
    art: 'corridor',
    // `corridor` was a placeholder from the day this scene was written: a dim interior
    // that stood in for a tunnel because there was no tunnel. On 3.9.2026 it became one —
    // the mouth of the players' tunnel, the light at the end of it, and a full stand
    // beyond — and the band had to move with it, because 0.6 put the child THROUGH the
    // opening and standing on the pitch. The concrete under his feet starts at 0.76.
    band: { far: 0.76, near: 0.985 },
    // 1.79×, and it stays: a tunnel is a genuinely deep space seen down its own axis, and
    // this is the one frame in the game where the vanishing point is dead centre.
    size: { far: 0.2, near: 0.358 },
    ambience: 'tunnel',
    stuckHe: 'קדימה, לכיוון האור.',
    spawns: { start: { x: 0.5, y: 0.95 } },
    actors: [],
    hotspots: [],
    exits: [
      {
        id: 'up',
        // At the MOUTH now, not out on the grass: the opening is the exit, and the child
        // reaches it by walking to the back of the band rather than by leaving it.
        x: 0.36,
        y: 0.72,
        w: 0.28,
        h: 0.06,
        to: 'bloomfield-inside',
        spawn: 'start',
        labelHe: 'אל האור',
        light: { x: 0.4, y: 0.52, w: 0.2, h: 0.24, tone: 'daylight' },
        dwellMs: 120,
        priority: 3,
      },
      {
        id: 'back',
        x: 0.0,
        y: 0.84,
        w: 0.07,
        h: 0.16,
        to: 'bloomfield-outside',
        spawn: 'fromTunnel',
        labelHe: 'חזרה החוצה',
        dwellMs: 700,
      },
    ],
  },

  // --------------------------------------------------------------------- inside ---
  {
    id: 'bloomfield-inside',
    titleHe: 'בלומפילד',
    art: 'stand',
    // The most important repaint in the delivery, and the one that was most obviously
    // wrong before it. `stand` was an ILLUSTRATED AERIAL of the whole bowl — a map, drawn
    // from somewhere no eight-year-old has ever been — and the child stood at 86 minutes
    // on a drawing with no ground in it and nothing to hold onto. This is the terrace at
    // his own eye level: concrete underfoot, a crash barrier across the frame, and
    // somebody's red-and-white scarf knotted round it. The `rail` hotspot below has been
    // labelled המעקה since the scene was written; there is finally a railing there.
    band: { far: 0.872, near: 0.99 },
    size: { far: 0.2, near: 0.27 },
    ambience: 'stadium',
    arrival: { art: 'reveal', ms: 5200, flag: 'saw:reveal' },
    // 1990: he knows this terrace. The card is the arithmetic in his head, not the bowl.
    arrivalByEra: { '1990': null, '1990s': null, '2000s': null },
    stuckHe: 'הוא איפשהו ביציע. תסתכל טוב.',
    stuckByEra: { '1990': 'מי שיודע משהו — אומר. הרדיו, הילדים, הוותיקים. אבא ליד העמוד.' },
    spawns: { start: { x: 0.08, y: 0.96, facing: 'right' } },
    /**
     * היציע אחרי השריקה — sixteen people who appear the moment the title is won.
     *
     * They are DRESSING and not actors, and the distinction is the whole design of the
     * ending. The chapter's last objective is `למצוא את אבא`, and the player has to walk a
     * terrace and find one man in a crowd. An actor is somebody you can talk to; sixteen
     * of them would turn a search into sixteen dialogue boxes opening as you brush past,
     * and the two supporters who ARE actors would stop being worth talking to. Dressing is
     * scenery you have to look through, which is precisely the obstacle this moment wants.
     *
     * They bounce, on their own phases, because a still crowd at the instant a
     * championship is won is the one thing on this terrace that would read as a mistake.
     * The `depth` of each is its own `y`, so the child walks in front of the ones nearer
     * the rail and BEHIND the ones nearer the camera — which is what makes his father hard
     * to see rather than merely far away.
     *
     * Every one of them is a different figure from the twenty-eight-person crowd sheets.
     * Nobody in this stadium is standing next to himself.
     */
    layers: [
      // Along the rail, backs to the pitch, smallest — the far row.
      { art: 'youngA2', x: 0.215, y: 0.888, w: 0.036, depth: 0.888, foot: true, bob: 0.008, era: '*', when: { flag: 'match:over' } },
      { art: 'adultA3', x: 0.305, y: 0.884, w: 0.04, depth: 0.884, foot: true, bob: 0.005, era: '*', when: { flag: 'match:over' } },
      { art: 'youngB5', x: 0.4, y: 0.89, w: 0.037, depth: 0.89, foot: true, bob: 0.009, flip: true, era: '*', when: { flag: 'match:over' } },
      { art: 'adultB2', x: 0.585, y: 0.886, w: 0.041, depth: 0.886, foot: true, bob: 0.004, era: '*', when: { flag: 'match:over' } },
      { art: 'youngA6', x: 0.66, y: 0.892, w: 0.036, depth: 0.892, foot: true, bob: 0.01, era: '*', when: { flag: 'match:over' } },
      { art: 'adultA5', x: 0.83, y: 0.885, w: 0.04, depth: 0.885, foot: true, bob: 0.006, flip: true, era: '*', when: { flag: 'match:over' } },
      { art: 'youngB1', x: 0.915, y: 0.891, w: 0.036, depth: 0.891, foot: true, bob: 0.008, era: '*', when: { flag: 'match:over' } },

      // The middle of the terrace, where the child is walking.
      { art: 'adultB6', x: 0.26, y: 0.925, w: 0.047, depth: 0.925, foot: true, bob: 0.007, flip: true, era: '*', when: { flag: 'match:over' } },
      { art: 'youngA4', x: 0.44, y: 0.932, w: 0.044, depth: 0.932, foot: true, bob: 0.011, era: '*', when: { flag: 'match:over' } },
      { art: 'adultA1', x: 0.63, y: 0.928, w: 0.048, depth: 0.928, foot: true, bob: 0.005, era: '*', when: { flag: 'match:over' } },
      { art: 'youngB3', x: 0.79, y: 0.935, w: 0.045, depth: 0.935, foot: true, bob: 0.01, flip: true, era: '*', when: { flag: 'match:over' } },
      { art: 'youngB7', x: 0.9, y: 0.938, w: 0.046, depth: 0.938, foot: true, bob: 0.013, era: '*', when: { flag: 'match:over' } },

      // Nearest the camera, biggest, and the ones he has to go round.
      { art: 'adultB4', x: 0.135, y: 0.972, w: 0.058, depth: 0.972, foot: true, bob: 0.006, era: '*', when: { flag: 'match:over' } },
      { art: 'youngA1', x: 0.41, y: 0.98, w: 0.055, depth: 0.98, foot: true, bob: 0.012, flip: true, era: '*', when: { flag: 'match:over' } },
      { art: 'adultA7', x: 0.6, y: 0.975, w: 0.059, depth: 0.975, foot: true, bob: 0.005, era: '*', when: { flag: 'match:over' } },
      { art: 'adultB5', x: 0.885, y: 0.978, w: 0.058, depth: 0.978, foot: true, bob: 0.007, flip: true, era: '*', when: { flag: 'match:over' } },
    ],
    actors: [
      {
        id: 'kobi-crowd',
        figure: 'kobi-cheer',
        // Between two rows of the celebrating crowd, on the far side of the terrace from
        // where the child comes in. He is not hidden — nothing in this game hides the
        // thing it is asking for — he is just one more man in a red shirt among sixteen,
        // and the player has to walk over and look. That walk IS the ending.
        x: 0.695,
        y: 0.912,
        size: 0.3,
        nameHe: 'קובי',
        talk: 'kobi-found',
        when: { flag: 'match:over' },
      },
      { id: 'terrace-a', figure: 'fanD', x: 0.34, y: 0.935, size: 0.22, nameHe: 'אוהד', talk: 'terrace-fan' },
      { id: 'terrace-b', figure: 'fanF', x: 0.52, y: 0.965, size: 0.23, nameHe: 'אוהד', talk: 'terrace-fan', flip: true },
      /**
       * ---- 1990: the transistor network ----
       * Every `net:*` conversation is GENERATED by the match director from the anchor and
       * the rumour state, never authored: these people say what their radio says, at the
       * delay their radio has, and the kids say what kids say. Kobi stands by the second
       * pillar, as the veteran promised, until the whistle — then he is one man in a
       * crowd again, and the walk to him is the ending, as it was in 1986.
       */
      { id: 'net-kobi', era: '1990', figure: 'kobi90-lean', x: 0.34, y: 0.905, size: 0.18, nameHe: 'קובי', talk: 'net:kobi', when: { notFlag: 'match:over' } },
      { id: 'net-radio', era: '1990', figure: 'fanC', x: 0.52, y: 0.9, size: 0.29, nameHe: 'אוהד עם רדיו', talk: 'net:radio', flip: true, when: { notFlag: 'match:over' } },
      { id: 'net-brain', era: '1990', figure: 'adultB3', x: 0.71, y: 0.902, size: 0.29, nameHe: 'אוהד שיודע', talk: 'net:brain', when: { notFlag: 'match:over' } },
      { id: 'net-kids', era: '1990', figure: 'youngB5', x: 0.96, y: 0.9, size: 0.23, nameHe: 'ילדים', talk: 'net:kids', flip: true, when: { notFlag: 'match:over' } },
      { id: 'net-ofir', era: '1990', figure: 'ofir90', x: 0.2, y: 0.9, size: 0.26, nameHe: 'אופיר', talk: 'net:ofir', when: { all: [{ flag: 'went:withFriends' }, { notFlag: 'match:over' }] } },
      { id: 'kobi-lost', era: '1990', figure: 'kobi90-cheer', x: 0.695, y: 0.912, size: 0.3, nameHe: 'קובי', talk: 'kobi-found-1990', when: { flag: 'match:over' } },
    ],
    // The scarf is tied to the barrier at the left of the frame — somebody left it there,
    // which is the whole reason to walk over and look at it.
    hotspots: [
      { id: 'rail', era: '*', x: 0.155, y: 0.92, w: 0.12, act: 'terrace-rail', verb: 'look', labelHe: 'המעקה' },
      { id: 'look-terrace', era: '1986', x: 0.3, y: 0.93, w: 0.08, act: 'pano:panoTerrace1986', verb: 'gaze', labelHe: 'סביב', when: { flag: 'saw:reveal' } },
      // 1990: the radio on the concrete, only while it is there (see the director).
      { id: 'radio-floor', era: '1990', x: 0.38, y: 0.96, w: 0.09, act: 'net:floor', verb: 'take', labelHe: 'הטרנזיסטור על הרצפה', when: { flag: 'radio:dropped' }, priority: 5, prop: { key: 'propRadio', size: 0.04 } },
    ],
    exits: [
      // The way home. It opens the moment the chapter's last objective is met — you found
      // him — and not before: nobody walks out of a final. Straight to the street outside
      // the ground; the tunnel is a way IN.
      {
        id: 'home',
        era: '*',
        x: 0.0,
        y: 0.87,
        w: 0.05,
        h: 0.12,
        to: 'bloomfield-outside',
        spawn: 'fromTunnel',
        labelHe: 'החוצה, הביתה',
        when: { flag: 'found:kobi' },
        light: { x: 0.006, y: 0.6, w: 0.05, h: 0.28, tone: 'daylight' },
        dwellMs: 700,
      },
    ],
  },

  // ------------------------------------------------------ אולם אוסישקין — מבחוץ ----
  // The three Ussishkin backdrops (`ussExt`, `ussHall`, `ussHallPre`) shipped as art in
  // September and had NO scene, so nothing in the game ever drew them — a backdrop with
  // no room is invisible by construction. These two scenes give them a room. Kept
  // deliberately bare (no actors, no hotspots): the point of this first pass is to walk
  // in and SEE the hall in-engine. The basketball night that belongs here is authored
  // next, to the directing standard the football Saturday is held to.
  {
    id: 'ussishkin-outside',
    titleHe: 'אולם אוסישקין — מבחוץ',
    art: 'ussExt',
    band: { far: 0.82, near: 0.96 },
    size: { far: 0.19, near: 0.28 },
    ambience: 'dusk',
    stuckHe: 'הכניסה לאולם באמצע, מתחת לגג. חזרה לרחוב — משמאל.',
    stuckByEra: { '1991': 'הסדרן ליד הדלת, המוכר מימין. פנימה — באמצע.' },
    spawns: {
      fromStreet: { x: 0.12, y: 0.9, facing: 'right' },
      fromHall: { x: 0.5, y: 0.93, facing: 'left' },
      // evenings that begin at the hall (1993, 1997, 1999): outside the doors, facing them
      start: { x: 0.62, y: 0.92, facing: 'left' },
    },
    actors: [
      { id: 'usher-a3', era: 'a3-hall', figure: 'usher-wave', x: 0.2, y: 0.9, size: 0.3, nameHe: 'סדרן', talk: 'usher-a3', sway: 0.004 },
      { id: 'efi-a3-door', era: 'a3-hall', figure: 'efi', x: 0.55, y: 0.92, size: 0.27, nameHe: 'אפי', talk: 'efi-a3', flip: true },
      // ---- 11.3.1991, an hour before the doors ----
      // The usher stands BESIDE the door and not in it: a person in a doorway wins the
      // prompt over the door, and the way into the room disappears behind a conversation.
      {
        id: 'usher-night',
        era: '1991',
        figure: 'usher-wave',
        x: 0.55,
        y: 0.9,
        size: 0.3,
        nameHe: 'סדרן',
        talk: 'usher-night',
        flip: true,
        sway: 0.003,
      },
      // The corridor kiosk (§36). It is OUT here and not inside the hall, because that is
      // what makes it cost something: history does not wait for a queue.
      {
        id: 'hall-vendor',
        era: '1991',
        figure: 'hallVendor',
        x: 0.72,
        y: 0.92,
        size: 0.31,
        nameHe: 'מוכר',
        talk: 'hall-vendor',
        flip: true,
        sway: 0.004,
      },
      // 19.4.1993 — the corner the bus to the big hall leaves from
      {
        id: 'limor-1993',
        era: '1993-cup',
        figure: 'youngB3',
        x: 0.62,
        y: 0.9,
        size: 0.263,
        nameHe: 'לימור',
        talk: 'limor-1993',
        sway: 0.003,
      },
      {
        id: 'shachor-1993',
        era: '1993-cup',
        figure: 'shachor',
        x: 0.8,
        y: 0.92,
        size: 0.297,
        nameHe: 'שחור',
        talk: 'shachor-1993',
        flip: true,
        when: { beforeMinute: 18 * 60 + 42 },
      },
      // 9–19.5.1993 — the finals. The same corner on four evenings, and the morning after.
      {
        id: 'efi-galil',
        era: '1993-galil',
        figure: 'youngA2',
        x: 0.68,
        y: 0.9,
        size: 0.263,
        nameHe: 'אפי',
        talk: 'efi-galil',
        sway: 0.003,
      },
      {
        id: 'limor-galil',
        era: '1993-galil',
        figure: 'youngB3',
        x: 0.58,
        y: 0.92,
        size: 0.275,
        nameHe: 'לימור',
        talk: 'g4-limor',
        sway: 0.003,
        when: { flag: 'life:galil:d4', none: [{ flag: 'life:galil:after' }] },
      },
      {
        id: 'shachor-galil',
        era: '1993-galil',
        figure: 'shachor-back',
        x: 0.84,
        y: 0.92,
        size: 0.297,
        nameHe: 'שחור',
        talk: 'shachor-galil',
        when: { flag: 'life:galil:after' },
      },
      {
        id: 'soko-galil',
        era: '1993-galil',
        figure: 'soko',
        x: 0.2,
        y: 0.92,
        size: 0.297,
        nameHe: 'סוקו',
        talk: 'after-soko',
        when: { flag: 'life:galil:after' },
      },
      // 1997 and 1999 — the two relegation nights, and the corner that works through them
      { id: 'shachor-hall97', era: '1997-basket', figure: 'shachor', x: 0.8, y: 0.92, size: 0.297, nameHe: 'שחור', talk: 'h1-corner', flip: true, when: { none: [{ flag: 'life:hall:d2' }] } },
      { id: 'shachor-hall98', era: '1997-basket', figure: 'shachor-back', x: 0.8, y: 0.92, size: 0.297, nameHe: 'שחור', talk: 'h2-corner', when: { flag: 'life:hall:d2' } },
      { id: 'limor-hall', era: '1997-basket', figure: 'youngB3', x: 0.62, y: 0.9, size: 0.263, nameHe: 'לימור', talk: 'h1-corner', sway: 0.003 },
      { id: 'freddy-hall', era: '1997-basket', figure: 'freddy-drink', x: 0.16, y: 0.92, size: 0.297, nameHe: 'פרדי', talk: 'h1-freddy', when: { none: [{ flag: 'life:hall:d2' }] } },
      { id: 'shachor-seed', era: '1999-basket', figure: 'shachor', x: 0.8, y: 0.92, size: 0.297, nameHe: 'שחור', talk: 'seed-corner', flip: true },
      { id: 'limor-seed', era: '1999-basket', figure: 'youngB3', x: 0.62, y: 0.9, size: 0.263, nameHe: 'לימור', talk: 'seed-corner', sway: 0.003 },
      { id: 'soko-seed', era: '1999-basket', figure: 'soko', x: 0.2, y: 0.92, size: 0.297, nameHe: 'סוקו', talk: 'seed-inside' },
    ],
    hotspots: [
      { id: 'bus-1993', era: '1993-cup', x: 0.15, y: 0.84, w: 0.14, act: 'bus-1993', verb: 'enter', labelHe: 'האוטובוס', priority: 3 },

      { id: 'queue', era: '1991', x: 0.25, y: 0.9, w: 0.12, act: 'uss-queue', verb: 'look', labelHe: 'התור' },
    ],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.82,
        w: 0.05,
        h: 0.14,
        to: 'street',
        spawn: 'fromUss',
        labelHe: 'חזרה לרחוב',
        light: { x: 0.006, y: 0.55, w: 0.05, h: 0.3, tone: 'daylight' },
        dwellMs: 500,
      },
      {
        // The glass doors under the canopy, at 0.33–0.45 of the frame. First placed at
        // 0.47–0.59 — the corner pillar, where the painting has three men standing and
        // no door at all. Rendered with the boxes on 3.9.2026 and moved.
        id: 'in',
        x: 0.33,
        y: 0.8,
        w: 0.12,
        h: 0.15,
        to: 'ussishkin-hall',
        spawn: 'fromOut',
        labelHe: 'פנימה, לאולם',
        // 1984: the door is the usher. Six years old, you do not walk past him.
        needsByEra: { 'a3-hall': { flag: 'entry:granted' } },
        blockedByEra: { 'a3-hall': 'הסדרן בדלת. אפי מכיר אותו — תדבר.' },
        light: { x: 0.335, y: 0.5, w: 0.11, h: 0.3, tone: 'inside' },
        dwellMs: 300,
        priority: 2,
      },
    ],
  },

  // ------------------------------------------------------- אולם אוסישקין — פנים ----
  //
  // 4.9.2026: the hall is the RECONSTRUCTION now — five angles of one room rebuilt from
  // the weinstocka footage (`USSISHKIN-RECONSTRUCTION-V2`): the red-and-charcoal stand,
  // the cream stand opposite, the end wall with the old basket, the high corner, the
  // floor at a child's eye. The roof, the beams and the window strip never move between
  // them, which is what makes them one place. The main stand is the room you walk; the
  // high corner is how you first see it; the end wall is where the basket is, one door
  // along. Empty on purpose: on a Saturday in 1986 the hall IS empty, the parquet is
  // reflecting the windows, and two men are shooting around. The derby night (11.3.1991)
  // layers its crowd over this same geometry.
  {
    id: 'ussishkin-hall',
    titleHe: 'אולם אוסישקין',
    art: 'ussMain',
    band: { far: 0.72, near: 0.96 },
    size: { far: 0.17, near: 0.3 },
    ambience: 'hall',
    // The first sight of the hall, from the high corner — almost all of it at once — held
    // for a breath, then the cut down to the sideline at the boy's height.
    arrival: { art: 'ussHigh', ms: 3800, flag: 'saw:ussHigh' },
    /**
     * 11.3.1991 — a different arrival, and deliberately the opposite one (§34).
     *
     * The empty hall is met from the high corner: almost all of it at once, held, then
     * the cut down to the floor. A derby night may not use that card. Bloomfield says
     * the world is bigger than the boy; Ussishkin says the world is TOO CLOSE to him —
     * so the night arrives on `ussLow`, the floor at a child's eye height, where the
     * court is a strip of light between other people's shoulders.
     */
    arrivalByEra: { '1991': { art: 'ussLow', ms: 2600, flag: 'saw:ussNight' } },
    stuckHe: 'הפרקט מבריק, הסל בקצה. היציאה משמאל, מאיפה שנכנסת.',
    stuckByEra: { '1991': 'עמית שמר מדרגה. המעקה לפניך, השעון מעל הדלת, והיציאה — משמאל.' },
    spawns: { fromOut: { x: 0.12, y: 0.93, facing: 'right' }, fromEnd: { x: 0.9, y: 0.9, facing: 'left' } , start: { x: 0.12, y: 0.93, facing: 'right' } },
    /**
     * הקהל — eight hundred people, drawn the way the terrace at full time is drawn.
     *
     * Dressing, not actors, for the reason the 1986 terrace gives at length: a crowd you
     * can talk to is a crowd that opens a dialogue box every time you brush past it. The
     * far rows sit BEHIND the walk band, packed along the base of the stand, so the boy
     * moves along the sideline in front of them; the four nearest are inside the band,
     * so he has to go round them. Every one of them bounces on its own phase, because a
     * still crowd in a hall this size is the one thing that would read as a mistake.
     *
     * Over all of it: two plates from the September package — the floodlight haze that
     * a tin roof's lamps make of the dust, and, once it is won, red smoke.
     */
    layers: [
      { art: 'fanC', era: '1991', x: 0.035, y: 0.648, w: 0.046, depth: 0.648, foot: true, bob: 0.004, flip: true },
      { art: 'fanB', era: '1991', x: 0.071, y: 0.676, w: 0.046, depth: 0.676, foot: true, bob: 0.006 },
      { art: 'youngB3', era: '1991', x: 0.106, y: 0.648, w: 0.046, depth: 0.648, foot: true, bob: 0.008 },
      { art: 'fanD', era: '1991', x: 0.142, y: 0.676, w: 0.046, depth: 0.676, foot: true, bob: 0.01, flip: true },
      { art: 'adultB2', era: '1991', x: 0.177, y: 0.648, w: 0.046, depth: 0.648, foot: true, bob: 0.012 },
      { art: 'fanG', era: '1991', x: 0.213, y: 0.676, w: 0.046, depth: 0.676, foot: true, bob: 0.004 },
      { art: 'youngA4', era: '1991', x: 0.248, y: 0.648, w: 0.046, depth: 0.648, foot: true, bob: 0.006, flip: true },
      { art: 'fanA', era: '1991', x: 0.284, y: 0.676, w: 0.046, depth: 0.676, foot: true, bob: 0.008 },
      { art: 'adultA1', era: '1991', x: 0.319, y: 0.648, w: 0.046, depth: 0.648, foot: true, bob: 0.01 },
      { art: 'fanF', era: '1991', x: 0.354, y: 0.676, w: 0.046, depth: 0.676, foot: true, bob: 0.012, flip: true },
      { art: 'youngB5', era: '1991', x: 0.39, y: 0.648, w: 0.046, depth: 0.648, foot: true, bob: 0.004 },
      { art: 'adultB6', era: '1991', x: 0.425, y: 0.676, w: 0.046, depth: 0.676, foot: true, bob: 0.006 },
      { art: 'fanC', era: '1991', x: 0.461, y: 0.648, w: 0.046, depth: 0.648, foot: true, bob: 0.008, flip: true },
      { art: 'youngA6', era: '1991', x: 0.496, y: 0.676, w: 0.046, depth: 0.676, foot: true, bob: 0.01 },
      { art: 'fanD', era: '1991', x: 0.532, y: 0.648, w: 0.046, depth: 0.648, foot: true, bob: 0.012 },
      { art: 'adultA3', era: '1991', x: 0.567, y: 0.676, w: 0.046, depth: 0.676, foot: true, bob: 0.004, flip: true },
      { art: 'fanB', era: '1991', x: 0.603, y: 0.648, w: 0.046, depth: 0.648, foot: true, bob: 0.006 },
      { art: 'youngB1', era: '1991', x: 0.638, y: 0.676, w: 0.046, depth: 0.676, foot: true, bob: 0.008 },
      { art: 'fanG', era: '1991', x: 0.674, y: 0.648, w: 0.046, depth: 0.648, foot: true, bob: 0.01, flip: true },
      { art: 'adultB5', era: '1991', x: 0.709, y: 0.676, w: 0.046, depth: 0.676, foot: true, bob: 0.012 },

      // Two on the boy's own step, at the far end, so there is somebody to walk behind.
      { art: 'adultB4', era: '1991', x: 0.78, y: 0.79, w: 0.062, depth: 0.79, foot: true, bob: 0.006 },
      { art: 'youngB7', era: '1991', x: 0.87, y: 0.83, w: 0.06, depth: 0.83, foot: true, bob: 0.011, flip: true },

      // The air of the room, and then the smoke that only exists once it is over.
      { art: 'overlayHaze', era: '1991', x: 0, y: 0, w: 1, depth: 0.995, alpha: 0.5 },
      { art: 'overlaySmoke', era: '1991', x: 0, y: 0, w: 1, depth: 0.996, alpha: 0.55, when: { flag: 'derby:over' } },
    ],
    actors: [
      // Two men in plain red, shooting around at the far end of the floor: the hall is
      // used, not abandoned. Nameless, no number, no talk — scenery that breathes.
      { id: 'hooper-a', era: '*', figure: 'hooperRed-dribble', x: 0.62, y: 0.74, size: 0.17, nameHe: 'שחקן', sway: 0.006 },
      { id: 'hooper-b', era: '*', figure: 'hooperRed-stretch', x: 0.45, y: 0.73, size: 0.16, nameHe: 'שחקן', sway: 0.004 },
      // The usher by the door: the one person who talks, and what he says depends on
      // whether there is a game tonight.
      { id: 'usher', era: '*', figure: 'usher', x: 0.2, y: 0.9, size: 0.3, nameHe: 'סדרן', talk: 'usher-hall', sway: 0.003 },
      // ---- 11.3.1991: the two people you came with ----
      { id: 'amit-hall', era: '1991', figure: 'amit90-cheer', x: 0.42, y: 0.9, size: 0.29, nameHe: 'עמית', talk: 'amit-hall', sway: 0.006 },
      { id: 'ofir-hall', era: '1991', figure: 'ofir90-arms', x: 0.3, y: 0.93, size: 0.3, nameHe: 'אופיר', talk: 'derby:friend', flip: true, sway: 0.007 },
    ],
    hotspots: [
      { id: 'look-hall', era: '*', x: 0.62, y: 0.9, w: 0.16, act: 'pano:panoUssHall', verb: 'gaze', labelHe: 'סביב', priority: 3, when: { notFlag: 'uss:arrived' } },
      // 1991: the same look, on a night when the hall is full of people (§38).
      { id: 'look-derby', era: '1991', x: 0.62, y: 0.9, w: 0.16, act: 'pano:panoUssDerby', verb: 'gaze', labelHe: 'סביב', priority: 3, when: { flag: 'uss:arrived' } },
      // The step Amit asked you to hold, the rail a metre from the line, and the clock
      // over the door that this whole chapter is really about.
      // Priority 5: higher than a person, because a boy standing on the step he promised
      // to hold should not have to push past his own friend to press the button.
      { id: 'the-spot', era: '1991', x: 0.5, y: 0.88, w: 0.09, act: 'hall-spot', verb: 'sit', labelHe: 'המדרגה', priority: 5 },
      { id: 'hall-rail', era: '1991', x: 0.68, y: 0.84, w: 0.1, act: 'hall-rail', verb: 'look', labelHe: 'המעקה' },
      { id: 'hall-clock', era: '1991', x: 0.86, y: 0.8, w: 0.08, act: 'hall-clock', verb: 'look', labelHe: 'השעון' },
      { id: 'parquet', era: '*', x: 0.4, y: 0.88, w: 0.1, act: 'uss-parquet', verb: 'look', labelHe: 'הפרקט' },
      { id: 'stand', era: '*', x: 0.55, y: 0.78, w: 0.12, act: 'uss-stand', verb: 'look', labelHe: 'היציע' },
      { id: 'windows', era: '*', x: 0.75, y: 0.8, w: 0.1, act: 'uss-windows', verb: 'look', labelHe: 'החלונות' },
    ],
    exits: [
      {
        // Wider than the room needs on an empty Saturday, because on 11.3.1991 this door
        // IS the choice (§41): half past nine arrives while the hall is shaking, and a
        // way out that has to be hunted for is not an answer a thirteen-year-old can give.
        id: 'back',
        x: 0.0,
        y: 0.78,
        w: 0.085,
        h: 0.2,
        to: 'ussishkin-outside',
        spawn: 'fromHall',
        labelHe: 'החוצה',
        light: { x: 0.006, y: 0.55, w: 0.06, h: 0.3, tone: 'inside' },
        dwellMs: 500,
        priority: 3,
      },
      {
        // along the sideline to the end wall, where the basket is
        id: 'end',
        x: 0.94,
        y: 0.74,
        w: 0.06,
        h: 0.22,
        to: 'ussishkin-end',
        spawn: 'fromMain',
        labelHe: 'לקצה, אל הסל',
        light: { x: 0.9, y: 0.5, w: 0.1, h: 0.2, tone: 'inside' },
        dwellMs: 420,
      },
    ],
  },
  {
    id: 'ussishkin-end',
    titleHe: 'אוסישקין — קיר הקצה',
    art: 'ussEnd',
    band: { far: 0.74, near: 0.96 },
    size: { far: 0.17, near: 0.3 },
    ambience: 'hall',
    stuckHe: 'הסל מעליך. חזרה לאורך הקו — משמאל.',
    spawns: { fromMain: { x: 0.08, y: 0.9, facing: 'right' } , start: { x: 0.08, y: 0.9, facing: 'right' } },
    actors: [
      { id: 'hooper-c', era: '*', figure: 'hooperRed-shoot', x: 0.5, y: 0.76, size: 0.2, nameHe: 'שחקן', sway: 0.004 },
      { id: 'hooper-d', era: '*', figure: 'hooperRed-bent', x: 0.7, y: 0.8, size: 0.18, nameHe: 'שחקן', sway: 0.005 },
    ],
    hotspots: [
      { id: 'basket', era: '*', x: 0.5, y: 0.9, w: 0.12, act: 'uss-basket', verb: 'look', labelHe: 'הסל' },
      { id: 'board', era: '*', x: 0.28, y: 0.86, w: 0.1, act: 'uss-board', verb: 'look', labelHe: 'לוח התוצאות' },
    ],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.78,
        w: 0.05,
        h: 0.2,
        to: 'ussishkin-hall',
        spawn: 'fromEnd',
        labelHe: 'חזרה לאורך הקו',
        light: { x: 0.006, y: 0.55, w: 0.05, h: 0.3, tone: 'inside' },
        dwellMs: 500,
      },
    ],
  },

  // ------------------------------------------------------------------ הכיתה ------
  //
  // 11.3.1991, and the first room in this game that is not a Saturday.
  //
  // The painting is a real classroom with nobody in it: windows down the left wall, the
  // board and the teacher's desk in the middle, two clusters of desks, and — this is what
  // makes it a room rather than a picture — an empty floor across the whole front, from
  // the near desks to the camera. That strip is the walk band, so the boy moves along the
  // front of the class in front of everybody, which is exactly the wrong place to be
  // holding a folded piece of paper.
  //
  // The children are DRESSING and not actors, for the same reason as the terrace at full
  // time: eight seated twelve-year-olds who each open a dialogue box would turn a lesson
  // into a corridor of text. Two people in this room talk, and one of them is the teacher.
  {
    id: 'classroom',
    titleHe: 'הכיתה',
    art: 'classroom',
    band: { far: 0.74, near: 0.97 },
    size: { far: 0.22, near: 0.32 },
    ambience: 'classroom',
    stuckHe: 'הפתק על השולחן שלך. המורה ליד הלוח. הדלת למסדרון — ימינה.',
    spawns: {
      start: { x: 0.34, y: 0.88, facing: 'right' },
      fromYard: { x: 0.8, y: 0.9, facing: 'left' },
    },
    actors: [
      {
        // In the aisle in front of her own desk, where a teacher stands when she is
        // talking and not writing.
        id: 'teacher',
        era: '1991',
        figure: 'teacher',
        x: 0.47,
        y: 0.76,
        size: 0.3,
        nameHe: 'המורה',
        talk: 'teacher-1991',
        sway: 0.004,
      },
      {
        id: 'keren-desk',
        era: '1991',
        figure: 'keren90-sit',
        x: 0.78,
        y: 0.745,
        size: 0.24,
        nameHe: 'קרן',
        talk: 'keren-class',
        flip: true,
        sway: 0.003,
      },
      { id: 'teacher-1998', era: '1998-laces', figure: 'teacher-hand', x: 0.47, y: 0.76, size: 0.259, nameHe: 'המורה', talk: 'l2-tayeb' },
    ],
    layers: [
      // Seated children at the two clusters. Their depth is BEHIND the band on purpose:
      // the boy walks along the front of the class, never between the rows.
      { art: 'pupil-back1', era: '1991', x: 0.16, y: 0.7, w: 0.055, depth: 0.7, foot: true },
      { art: 'pupil-back2', era: '1991', x: 0.27, y: 0.71, w: 0.055, depth: 0.71, foot: true },
      { art: 'pupil-sideA', era: '1991', x: 0.35, y: 0.69, w: 0.05, depth: 0.69, foot: true, flip: true },
      { art: 'pupil-back3', era: '1991', x: 0.68, y: 0.7, w: 0.055, depth: 0.7, foot: true },
      { art: 'pupil-pass', era: '1991', x: 0.88, y: 0.71, w: 0.055, depth: 0.71, foot: true, flip: true },
      { art: 'pupil-turn', era: '1991', x: 0.6, y: 0.68, w: 0.05, depth: 0.68, foot: true },
    ],
    hotspots: [
      {
        id: 'my-desk',
        era: '1991',
        x: 0.3,
        y: 0.82,
        w: 0.1,
        act: 'note-1991',
        verb: 'look',
        labelHe: 'השולחן שלך',
        priority: 3,
        prop: { key: 'propNote', size: 0.04, at: { x: 0.29, y: 0.645 } },
      },
      { id: 'board', era: '1991', x: 0.52, y: 0.79, w: 0.1, act: 'class-board', verb: 'look', labelHe: 'הלוח' },
      { id: 'class-window', era: '1991', x: 0.1, y: 0.8, w: 0.09, act: 'class-window', verb: 'look', labelHe: 'החלון' },
      { id: 'class-bag', era: '1991', x: 0.21, y: 0.9, w: 0.08, act: 'class-bag', verb: 'look', labelHe: 'התיק' },
      { id: 'look-class', era: '1991', x: 0.42, y: 0.9, w: 0.09, act: 'pano:panoClassroom', verb: 'gaze', labelHe: 'סביב' },
    ],
    exits: [
      {
        id: 'yard',
        x: 0.93,
        y: 0.72,
        w: 0.07,
        h: 0.26,
        to: 'schoolyard',
        spawn: 'fromSchool',
        labelHe: 'למסדרון ולחצר',
        light: { x: 0.95, y: 0.5, w: 0.05, h: 0.32, tone: 'inside' },
        // A lesson you can slide out of is not a lesson: the door works, and it takes a
        // decision to walk through it.
        dwellMs: 800,
      },
    ],
  },

  // ------------------------------------------------------------------ החצר -------
  {
    id: 'schoolyard',
    titleHe: 'החצר',
    art: 'schoolyard',
    band: { far: 0.68, near: 0.95 },
    size: { far: 0.18, near: 0.28 },
    ambience: 'day',
    stuckHe: 'הכיתה מאחורייך, דרך הדלת. השער לרחוב — משמאל. הסל בקצה החצר.',
    spawns: {
      fromSchool: { x: 0.34, y: 0.86, facing: 'right' },
      fromStreet: { x: 0.14, y: 0.9, facing: 'right' },
    },
    actors: [
      { id: 'ofir-yard', era: '1991', figure: 'ofir90', x: 0.36, y: 0.82, size: 0.26, nameHe: 'אופיר', talk: 'ofir-yard', sway: 0.005 },
      { id: 'amit-yard', era: '1991', figure: 'amit90', x: 0.6, y: 0.86, size: 0.27, nameHe: 'עמית', talk: 'amit-yard', flip: true },
      { id: 'keren-yard', era: '1991', figure: 'keren90', x: 0.82, y: 0.8, size: 0.25, nameHe: 'קרן', talk: 'keren-yard', flip: true },
    ],
    hotspots: [
      {
        id: 'hoop',
        era: '1991',
        x: 0.66,
        y: 0.74,
        w: 0.1,
        act: 'yard-ball',
        verb: 'play',
        labelHe: 'הסל בחצר',
        prop: { key: 'propBasketball', size: 0.03, at: { x: 0.62, y: 0.72 } },
      },
      // Clear of the gate's own zone: a thing to look at must never stand in a doorway.
      { id: 'fence', era: '1991', x: 0.15, y: 0.76, w: 0.06, act: 'yard-fence', verb: 'look', labelHe: 'הגדר' },
    ],
    exits: [
      {
        // Wide, because it is the way OUT of a school and because a child walking left
        // along a yard at six frames a second should meet it, not miss it by a thumb.
        id: 'street',
        x: 0.0,
        y: 0.68,
        w: 0.1,
        h: 0.28,
        to: 'street',
        spawn: 'fromSchool',
        labelHe: 'מהשער, לרחוב',
        light: { x: 0.005, y: 0.42, w: 0.06, h: 0.4, tone: 'daylight' },
        dwellMs: 420,
        priority: 2,
      },
      {
        // the dark doorway in the middle of the building, at 0.22–0.27 of the painting
        id: 'school',
        x: 0.2,
        y: 0.66,
        w: 0.09,
        h: 0.16,
        to: 'classroom',
        spawn: 'fromYard',
        labelHe: 'חזרה לכיתה',
        light: { x: 0.215, y: 0.44, w: 0.07, h: 0.2, tone: 'inside' },
        dwellMs: 900,
      },
    ],
  },
  // --------------------------------------------------------------- שער 5 (1996+) ----
  // Under the stand: concrete, a drum, a hand-painted cloth. `undercroft` was painted for
  // the road plan of 1983–2000 and had no scene; the Gate 5 approach is what it is.
  {
    id: 'gate5',
    titleHe: 'שער 5',
    art: 'undercroft',
    band: { far: 0.74, near: 0.95 },
    size: { far: 0.24, near: 0.32 },
    ambience: 'stadium',
    stuckHe: 'מתחת ליציע. התוף לא מפסיק.',
    layers: [{ art: 'overlaySmoke', x: 0.5, y: 0.5, w: 1.0, depth: 0.1, era: '*' }],
    actors: [
      {
        id: 'asaf-gate5',
        era: '1996-army',
        figure: 'asaf',
        x: 0.5,
        y: 0.86,
        size: 0.324,
        nameHe: 'אסף',
        talk: 'asaf-gate5',
      },
      {
        id: 'melamed-gate5',
        era: '1996-army',
        figure: 'melamed-play',
        x: 0.68,
        y: 0.9,
        size: 0.341,
        nameHe: 'מלמד',
        talk: 'asaf-gate5',
        flip: true,
      },
    ],
    hotspots: [],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.76,
        w: 0.08,
        h: 0.22,
        to: 'bloomfield-outside',
        spawn: 'fromGate5',
        labelHe: 'החוצה, לשער 7',
        light: { x: 0.0, y: 0.5, w: 0.08, h: 0.45, tone: 'daylight' },
        dwellMs: 400,
      },
    ],
    spawns: { start: { x: 0.2, y: 0.88 } },
  },

  // -------------------------------------------------------- התחנה המרכזית (1996) ----
  // A platform at dawn. The painting is the nineties' street standing in until the
  // station is drawn (GRAPHICS-REQUESTS); the scene, the clock and the bus are real.
  {
    id: 'bus-station',
    titleHe: 'התחנה המרכזית — רציף',
    art: 'street90',
    band: { far: 0.705, near: 0.86 },
    size: { far: 0.185, near: 0.29 },
    ambience: 'station',
    stuckHe: 'רציף. שעון. אוטובוס אחד שמגיע בזמן.',
    actors: [],
    hotspots: [
      { id: 'bus', era: '1996-army', x: 0.5, y: 0.8, w: 0.18, act: 'a3-bus', verb: 'look', labelHe: 'האוטובוס', priority: 3 },
    ],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.7,
        w: 0.08,
        h: 0.3,
        to: 'street',
        spawn: 'fromBus',
        labelHe: 'חזרה לשכונה',
        light: { x: 0.005, y: 0.45, w: 0.07, h: 0.4, tone: 'daylight' },
        dwellMs: 600,
      },
    ],
    spawns: { start: { x: 0.25, y: 0.8, facing: 'right' } },
  },

  // ------------------------------------------------------- אצטדיון רמת גן (1999, 2000) ----
  // Stand-in: the terrace painting under a card that names the ground. The national
  // stadium's own painting is in GRAPHICS-REQUESTS; the two finals are played here.
  {
    id: 'ramat-gan',
    titleHe: 'אצטדיון רמת גן',
    art: 'stand',
    band: { far: 0.872, near: 0.99 },
    size: { far: 0.2, near: 0.27 },
    ambience: 'stadium',
    stuckHe: 'ארבעים אלף. אתה אחד מהם.',
    layers: [
      { art: 'overlayHaze', x: 0.5, y: 0.5, w: 1.0, depth: 0.1, era: '*' },
      { art: 'overlaySmoke', x: 0.5, y: 0.5, w: 1.0, depth: 0.1, era: '*' },
    ],
    actors: [],
    hotspots: [],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.7,
        w: 0.08,
        h: 0.3,
        to: 'street',
        spawn: 'fromFar',
        labelHe: 'הביתה, אחרי המשחק',
        light: { x: 0.005, y: 0.45, w: 0.07, h: 0.4, tone: 'daylight' },
        dwellMs: 600,
      },
    ],
    spawns: { start: { x: 0.3, y: 0.96, facing: 'right' } },
  },

  // ------------------------------------------------------ שכונת התקווה (13.5.2000) ----
  // Stand-in: the ground outside Bloomfield, under a card that names the quarter.
  {
    id: 'hatikva',
    titleHe: 'שכונת התקווה',
    art: 'ground',
    band: { far: 0.8, near: 0.95 },
    size: { far: 0.2, near: 0.29 },
    ambience: 'stadium',
    stuckHe: 'מגרש קטן. שכונה שמסתכלת מהמרפסות.',
    layers: [{ art: 'overlaySmoke', x: 0.5, y: 0.5, w: 1.0, depth: 0.1, era: '*' }],
    actors: [],
    hotspots: [],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.7,
        w: 0.08,
        h: 0.3,
        to: 'street',
        spawn: 'fromFar',
        labelHe: 'הביתה, אחרי המשחק',
        light: { x: 0.005, y: 0.45, w: 0.07, h: 0.4, tone: 'daylight' },
        dwellMs: 600,
      },
    ],
    spawns: { start: { x: 0.3, y: 0.9, facing: 'right' } },
  },
]

export const SCENE: Record<Exclude<LocationId, 'prologue-1972'>, SceneDef> = Object.fromEntries(
  SCENES.map((scene) => [scene.id, scene]),
) as Record<Exclude<LocationId, 'prologue-1972'>, SceneDef>

export function sceneFor(id: LocationId): SceneDef {
  return SCENE[id as Exclude<LocationId, 'prologue-1972'>] ?? (SCENES[0] as SceneDef)
}

export const ALL_SCENES: readonly SceneDef[] = SCENES
