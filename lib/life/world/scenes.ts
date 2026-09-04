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
export type Verb = 'talk' | 'look' | 'take' | 'buy' | 'enter' | 'exit' | 'play' | 'watch'

/**
 * לאיזה עידן — which chapter a thing in a room belongs to.
 *
 * The rooms are shared between chapters; the people in them are not. An actor, hotspot or
 * layer with no `era` belongs to 1986 — the chapter every room was written for — so that
 * adding a second chapter did not mean touching four hundred lines that were already
 * right. `'*'` is for the things that are true in every year: a wall, a pole, a rail.
 */
export type EraTag = string | '*'

export function inEra(def: { era?: EraTag }, chapter: string, fallback: EraTag = '1986'): boolean {
  const era = def.era ?? fallback
  return era === '*' || era === chapter
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
  /** walking in triggers after a short dwell; the button always works immediately */
  dwellMs?: number
  priority?: number
}

export type Ambience = 'interior' | 'kitchen' | 'day' | 'dusk' | 'tunnel' | 'stadium'

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

/** the arrival card this room plays in this chapter, if any */
export function arrivalFor(scene: SceneDef, chapter: string): { art: string; ms: number; flag: string } | null {
  if (scene.arrivalByEra && chapter in scene.arrivalByEra) return scene.arrivalByEra[chapter] ?? null
  return scene.arrival ?? null
}

export function stuckFor(scene: SceneDef, chapter: string): string | null {
  return scene.stuckByEra?.[chapter] ?? scene.stuckHe ?? null
}

const SCENES: SceneDef[] = [
  // ------------------------------------------------------------------- bedroom ----
  {
    id: 'bedroom',
    titleHe: 'החדר שלך',
    art: 'bedroom',
    band: { far: 0.84, near: 0.97 },
    size: { far: 0.3, near: 0.38 },
    ambience: 'interior',
    stuckHe: 'המפתח במגירה, בקצה שמאל. משם גם הדלת לסלון.',
    stuckByEra: { '1990': 'הדלת לסלון — משמאל. אבא במטבח.' },
    spawns: { start: { x: 0.3, y: 0.93, facing: 'left' }, fromHome: { x: 0.14, y: 0.9, facing: 'right' } },
    actors: [],
    hotspots: [
      { id: 'bed', x: 0.47, y: 0.92, w: 0.14, act: 'bed', verb: 'look', labelHe: 'המיטה' },
      { id: 'poster', x: 0.72, y: 0.9, w: 0.1, act: 'poster', verb: 'look', labelHe: 'הכרזה' },
      // 1990: the same room, four years on. The drawer holds the scarf now, not a key.
      { id: 'bed-1990', era: '1990', x: 0.47, y: 0.92, w: 0.14, act: 'bed-1990', verb: 'look', labelHe: 'המיטה' },
      { id: 'drawer-1990', era: '1990', x: 0.17, y: 0.9, w: 0.16, act: 'drawer-1990', verb: 'look', labelHe: 'המגירה' },
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
        prop: { key: 'propScarfRed', size: 0.1 },
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
    },
    actors: [
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
      {
        id: 'rachel-home',
        era: '1990',
        figure: 'rachel',
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
        blockedHe: 'בלי המפתח אמא לא נותנת לצאת. הוא במגירה בחדר שלך.',
        dwellMs: 260,
        priority: 2,
      },
      {
        id: 'kitchen',
        x: 0.185,
        y: 0.73,
        w: 0.11,
        h: 0.055,
        to: 'kitchen',
        spawn: 'fromHome',
        labelHe: 'למטבח',
        light: { x: 0.195, y: 0.2, w: 0.09, h: 0.55, tone: 'inside' },
        dwellMs: 420,
      },
      {
        id: 'bedroom',
        x: 0.84,
        y: 0.73,
        w: 0.13,
        h: 0.06,
        to: 'bedroom',
        spawn: 'fromHome',
        labelHe: 'לחדר שלך',
        light: { x: 0.848, y: 0.1, w: 0.105, h: 0.62, tone: 'inside' },
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
    stuckByEra: { '1990': 'הטבלה על השולחן, אבא לידה. חזרה לסלון — משמאל.' },
    spawns: { fromHome: { x: 0.2, y: 0.9, facing: 'right' } },
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
        figure: 'rachel',
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
      // On the floor at the end of the run of cupboards, which is where a crate of empties
      // lives in a flat that takes them back for the deposit.
      { id: 'crate', x: 0.3, y: 0.92, w: 0.11, act: 'bottles', verb: 'take', labelHe: 'הבקבוקים' },
      // The little table under the mirror, with the oilcloth on it and the chairs pushed in.
      { id: 'table', x: 0.86, y: 0.9, w: 0.12, act: 'kitchen-table', verb: 'look', labelHe: 'השולחן' },
      // 1990: the paper open on the table, and the radio beside it.
      { id: 'table-1990', era: '1990', x: 0.86, y: 0.78, w: 0.07, act: 'table-1990', verb: 'look', labelHe: 'הטבלה', priority: 2 },
      // ON the table, beside the paper: drawn on the oilcloth, reached from the floor in
      // front of it.
      { id: 'radio-1990', era: '1990', x: 0.93, y: 0.78, w: 0.05, act: 'radio-table-1990', verb: 'look', labelHe: 'הטרנזיסטור', prop: { key: 'propRadio', size: 0.032, at: { x: 0.855, y: 0.485 } } },
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
    band: { far: 0.705, near: 0.86 },
    size: { far: 0.185, near: 0.29 },
    ambience: 'day',
    stuckHe: 'הקיוסק משמאל, המגרש בסמטה. מזרחה הולכים רק כשיודעים לאן — תשאל מישהו.',
    stuckByEra: { '1990': 'אופיר ועמית ליד הקיוסק. מזרחה — אחרי האדומים.' },
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
      fromRoute: { x: 0.9, y: 0.81, facing: 'left' },
      fromUss: { x: 0.83, y: 0.81, facing: 'left' },
    },
    actors: [
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
        nameHe: 'יוסף',
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
        blockedHe: 'לאן? אתה בכלל לא יודע מה קורה שם היום.',
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
    stuckHe: 'בעל הקיוסק מחכה. לצאת — ימינה.',
    stuckByEra: { '1990': 'אופיר ועמית פה. הרחוב — ימינה, ומשם מזרחה.' },
    spawns: { fromStreet: { x: 0.74, y: 0.93, facing: 'left' } },
    actors: [
      {
        id: 'shopkeeper',
        // `oldMan` is a chibi cut from the first concept board — big head, painted
        // outline — standing in a photoreal kiosk beside a photoreal Amit. Until a drawn
        // shopkeeper arrives (ART-PROMPTS §2.3) he is one of the September adults: a man
        // in a white shirt and glasses, which is what a kiosk owner in Jaffa looks like.
        figure: 'adultB2',
        x: 0.3,
        y: 0.9,
        size: 0.34,
        nameHe: 'בעל הקיוסק',
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
        figure: 'adultB2',
        x: 0.3,
        y: 0.9,
        size: 0.38,
        nameHe: 'בעל הקיוסק',
        talk: 'kiosk-man-1990',
        sway: 0.004,
      },
      { id: 'ofir-kiosk', era: '1990', figure: 'ofir90', x: 0.6, y: 0.92, size: 0.3, nameHe: 'אופיר', talk: 'ofir-1990', flip: true },
      { id: 'amit-kiosk', era: '1990', figure: 'amit90', x: 0.5, y: 0.95, size: 0.33, nameHe: 'עמית', talk: 'amit-1990' },
    ],
    hotspots: [{ id: 'counter', era: '*', x: 0.55, y: 0.92, w: 0.14, act: 'kiosk-counter', verb: 'look', labelHe: 'הדלפק' }],
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
    spawns: { fromStreet: { x: 0.13, y: 0.84, facing: 'right' } },
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
    arrivalByEra: { '1990': null },
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
    spawns: { fromStreet: { x: 0.085, y: 0.78, facing: 'right' }, fromGround: { x: 0.915, y: 0.78, facing: 'left' } },
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
    spawns: { fromRoute: { x: 0.06, y: 0.87, facing: 'right' }, fromTunnel: { x: 0.66, y: 0.93, facing: 'left' } },
    actors: [
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
      { id: 'fence', era: '*', x: 0.08, y: 0.85, w: 0.07, act: 'fence-look', verb: 'look', labelHe: 'הגדר' },
      { id: 'turnstile', era: '*', x: 0.36, y: 0.85, w: 0.09, act: 'gate-turnstile', verb: 'look', labelHe: 'הקרוסלה' },
    ],
    exits: [
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
    arrivalByEra: { '1990': null },
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
    spawns: {
      fromStreet: { x: 0.12, y: 0.9, facing: 'right' },
      fromHall: { x: 0.5, y: 0.93, facing: 'left' },
    },
    actors: [],
    hotspots: [],
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
        light: { x: 0.335, y: 0.5, w: 0.11, h: 0.3, tone: 'inside' },
        dwellMs: 300,
        priority: 2,
      },
    ],
  },

  // ------------------------------------------------------- אולם אוסישקין — פנים ----
  {
    id: 'ussishkin-hall',
    titleHe: 'אולם אוסישקין',
    art: 'ussHall',
    band: { far: 0.86, near: 0.98 },
    size: { far: 0.2, near: 0.3 },
    ambience: 'stadium',
    // The hall fills before it roars: `ussHallPre` is the warm-up, played once as the
    // arrival card, then it cuts to `ussHall`, the game. Same room, fifteen minutes apart.
    arrival: { art: 'ussHallPre', ms: 3600, flag: 'saw:ussPre' },
    stuckHe: 'המשחק על הפרקט. היציאה משמאל, מאיפה שנכנסת.',
    spawns: { fromOut: { x: 0.12, y: 0.93, facing: 'right' } },
    actors: [],
    hotspots: [],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.86,
        w: 0.05,
        h: 0.12,
        to: 'ussishkin-outside',
        spawn: 'fromHall',
        labelHe: 'החוצה',
        light: { x: 0.006, y: 0.6, w: 0.05, h: 0.28, tone: 'inside' },
        dwellMs: 500,
      },
    ],
  },
]

export const SCENE: Record<Exclude<LocationId, 'prologue-1972'>, SceneDef> = Object.fromEntries(
  SCENES.map((scene) => [scene.id, scene]),
) as Record<Exclude<LocationId, 'prologue-1972'>, SceneDef>

export function sceneFor(id: LocationId): SceneDef {
  return SCENE[id as Exclude<LocationId, 'prologue-1972'>] ?? (SCENES[0] as SceneDef)
}

export const ALL_SCENES: readonly SceneDef[] = SCENES
