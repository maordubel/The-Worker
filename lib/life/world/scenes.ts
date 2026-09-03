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

export type ActorDef = {
  id: string
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
  x: number
  y: number
  w?: number
  act: string
  /** what the prompt says you will do; a hotspot with no verb is scenery */
  verb: Verb
  labelHe: string
  when?: Condition
  prop?: { key: string; size: number }
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
  x: number
  y: number
  w: number
  depth: number
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
  /** what somebody in the room says if the player has been lost for a while */
  stuckHe?: string
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
    spawns: { start: { x: 0.3, y: 0.93, facing: 'left' }, fromHome: { x: 0.14, y: 0.9, facing: 'right' } },
    actors: [],
    hotspots: [
      { id: 'bed', x: 0.47, y: 0.92, w: 0.14, act: 'bed', verb: 'look', labelHe: 'המיטה' },
      { id: 'poster', x: 0.72, y: 0.9, w: 0.1, act: 'poster', verb: 'look', labelHe: 'הכרזה' },
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
        prop: { key: 'propScarf', size: 0.1 },
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
    ],
    hotspots: [
      { id: 'radio', x: 0.13, y: 0.78, w: 0.1, act: 'radio', verb: 'watch', labelHe: 'הטלוויזיה' },
      { id: 'photo', x: 0.42, y: 0.76, w: 0.08, act: 'family-photo', verb: 'look', labelHe: 'התמונות' },
      { id: 'table', x: 0.45, y: 0.84, w: 0.1, act: 'coffee-table', verb: 'look', labelHe: 'השולחן' },
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
        // child in 1980 does not leave the flat without the key on the string.
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
    band: { far: 0.76, near: 0.95 },
    size: { far: 0.27, near: 0.37 },
    ambience: 'kitchen',
    stuckHe: 'חזרה לסלון — מימין.',
    spawns: { fromHome: { x: 0.86, y: 0.9, facing: 'left' } },
    actors: [
      {
        id: 'rachel',
        figure: 'rachel',
        x: 0.55,
        y: 0.88,
        size: 0.42,
        nameHe: 'רחל',
        talk: 'rachel-kitchen',
        sway: 0.004,
      },
    ],
    hotspots: [
      { id: 'crate', x: 0.16, y: 0.9, w: 0.1, act: 'bottles', verb: 'take', labelHe: 'הבקבוקים' },
      { id: 'table', x: 0.84, y: 0.93, w: 0.1, act: 'kitchen-table', verb: 'look', labelHe: 'השולחן' },
    ],
    exits: [
      {
        id: 'out',
        x: 0.93,
        y: 0.76,
        w: 0.07,
        h: 0.22,
        to: 'home',
        spawn: 'fromKitchen',
        labelHe: 'לסלון',
        light: { x: 0.93, y: 0.5, w: 0.07, h: 0.48, tone: 'inside' },
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
        size: 0.25,
        nameHe: 'עמית',
        talk: 'amit-street',
        sway: 0.003,
      },
      {
        id: 'neighbour',
        figure: 'adultB1',
        x: 0.525,
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
    ],
    hotspots: [
      { id: 'wall', x: 0.6, y: 0.745, w: 0.09, act: 'wall-writing', verb: 'look', labelHe: 'הכתובת על הקיר' },
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
    band: { far: 0.84, near: 0.96 },
    size: { far: 0.24, near: 0.3 },
    ambience: 'day',
    stuckHe: 'בעל הקיוסק מחכה. לצאת — ימינה.',
    spawns: { fromStreet: { x: 0.74, y: 0.93, facing: 'left' } },
    actors: [
      {
        id: 'shopkeeper',
        figure: 'oldMan',
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
        size: 0.27,
        nameHe: 'עמית',
        talk: 'amit-kiosk',
        flip: true,
      },
    ],
    hotspots: [{ id: 'counter', x: 0.55, y: 0.92, w: 0.14, act: 'kiosk-counter', verb: 'look', labelHe: 'הדלפק' }],
    exits: [
      {
        id: 'out',
        x: 0.9,
        y: 0.84,
        w: 0.1,
        h: 0.16,
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
    band: { far: 0.68, near: 0.94 },
    size: { far: 0.2, near: 0.3 },
    ambience: 'day',
    stuckHe: 'הכדור באמצע. חזרה לרחוב — שמאלה.',
    spawns: { fromStreet: { x: 0.1, y: 0.82, facing: 'right' } },
    actors: [
      {
        id: 'efi',
        figure: 'efi',
        x: 0.26,
        y: 0.9,
        size: 0.28,
        nameHe: 'אפי',
        talk: 'efi-hall',
        sway: 0.01,
      },
      { id: 'amit', figure: 'amit', x: 0.83, y: 0.86, size: 0.26, nameHe: 'עמית', talk: 'pitch-kids', flip: true },
      // Ofir moves here at twenty to two. The street he was leaning on is empty by then,
      // and a player who goes looking for him where he was is a player learning that
      // people have afternoons of their own.
      {
        id: 'ofir-pitch',
        figure: 'ofir',
        x: 0.6,
        y: 0.88,
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
        y: 0.9,
        w: 0.1,
        act: 'pitch-ball',
        verb: 'play',
        labelHe: 'הכדור',
        prop: { key: 'propBall', size: 0.07 },
        priority: 3,
      },
    ],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.68,
        w: 0.05,
        h: 0.3,
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
    stuckHe: 'כולם הולכים מזרחה. פשוט אל תעצור.',
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
    ],
    hotspots: [
      { id: 'banner', x: 0.2, y: 0.715, w: 0.09, act: 'route-banner', verb: 'look', labelHe: 'השלט' },
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
  // 1980s board. Everything in the perimeter is an interaction at the x it is drawn at:
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
    stuckHe: 'תדבר עם מישהו. מישהו פה ייקח אותך פנימה.',
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
        size: 0.26,
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
    ],
    hotspots: [
      { id: 'gate7', x: 0.515, y: 0.86, w: 0.07, act: 'gate-seven', verb: 'look', labelHe: 'שער 7' },
      { id: 'fence', x: 0.08, y: 0.85, w: 0.07, act: 'fence-look', verb: 'look', labelHe: 'הגדר' },
      { id: 'turnstile', x: 0.36, y: 0.85, w: 0.09, act: 'gate-turnstile', verb: 'look', labelHe: 'הקרוסלה' },
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
    band: { far: 0.6, near: 0.94 },
    size: { far: 0.14, near: 0.34 },
    ambience: 'tunnel',
    stuckHe: 'קדימה, לכיוון האור.',
    spawns: { start: { x: 0.5, y: 0.92 } },
    actors: [],
    hotspots: [],
    exits: [
      {
        id: 'up',
        x: 0.36,
        y: 0.6,
        w: 0.28,
        h: 0.06,
        to: 'bloomfield-inside',
        spawn: 'start',
        labelHe: 'אל האור',
        light: { x: 0.4, y: 0.4, w: 0.2, h: 0.24, tone: 'daylight' },
        dwellMs: 120,
        priority: 3,
      },
      {
        id: 'back',
        x: 0.0,
        y: 0.88,
        w: 0.07,
        h: 0.12,
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
    band: { far: 0.86, near: 0.97 },
    size: { far: 0.18, near: 0.24 },
    ambience: 'stadium',
    arrival: { art: 'reveal', ms: 5200, flag: 'saw:reveal' },
    stuckHe: 'הוא איפשהו ביציע. תסתכל טוב.',
    spawns: { start: { x: 0.12, y: 0.93, facing: 'right' } },
    actors: [
      {
        id: 'kobi-crowd',
        figure: 'kobi-cheer',
        x: 0.74,
        y: 0.9,
        size: 0.3,
        nameHe: 'קובי',
        talk: 'kobi-found',
        when: { flag: 'match:over' },
      },
      { id: 'terrace-a', figure: 'fanD', x: 0.34, y: 0.94, size: 0.22, nameHe: 'אוהד', talk: 'terrace-fan' },
      { id: 'terrace-b', figure: 'fanF', x: 0.52, y: 0.96, size: 0.23, nameHe: 'אוהד', talk: 'terrace-fan', flip: true },
    ],
    hotspots: [{ id: 'rail', x: 0.2, y: 0.9, w: 0.1, act: 'terrace-rail', verb: 'look', labelHe: 'המעקה' }],
    exits: [],
  },
]

export const SCENE: Record<Exclude<LocationId, 'prologue-1972'>, SceneDef> = Object.fromEntries(
  SCENES.map((scene) => [scene.id, scene]),
) as Record<Exclude<LocationId, 'prologue-1972'>, SceneDef>

export function sceneFor(id: LocationId): SceneDef {
  return SCENE[id as Exclude<LocationId, 'prologue-1972'>] ?? (SCENES[0] as SceneDef)
}

export const ALL_SCENES: readonly SceneDef[] = SCENES
