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
  /** walking in triggers after a short dwell; the button always works immediately */
  dwellMs?: number
  priority?: number
}

export type Ambience = 'interior' | 'kitchen' | 'day' | 'dusk' | 'tunnel' | 'stadium'

/** A painted object separated from its room, drawn in front of or behind the player. */
export type LayerDef = { art: string; x: number; y: number; w: number; depth: number }

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
    stuckHe: 'הדלת לסלון בצד שמאל של החדר.',
    spawns: { start: { x: 0.3, y: 0.93, facing: 'left' }, fromHome: { x: 0.14, y: 0.9, facing: 'right' } },
    actors: [],
    hotspots: [
      { id: 'bed', x: 0.47, y: 0.92, w: 0.14, act: 'bed', verb: 'look', labelHe: 'המיטה' },
      { id: 'poster', x: 0.72, y: 0.9, w: 0.1, act: 'poster', verb: 'look', labelHe: 'הכרזה' },
      { id: 'desk', x: 0.17, y: 0.9, w: 0.08, act: 'desk', verb: 'look', labelHe: 'המגירה' },
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
        dwellMs: 200,
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
    stuckHe: 'הדלת החוצה בקצה שמאל של הסלון.',
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
        figure: 'kobi',
        x: 0.62,
        y: 0.7,
        size: 0.4,
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
  {
    id: 'street',
    titleHe: 'הרחוב',
    art: 'street',
    band: { far: 0.7, near: 0.94 },
    size: { far: 0.2, near: 0.32 },
    ambience: 'day',
    stuckHe: 'הכל פה: הקיוסק משמאל, המגרש בסמטה, והדרך מזרחה.',
    spawns: {
      // Far enough from the front door that arriving in the street does not immediately
      // offer to send you back inside. A place you have just entered should not greet you
      // with its exit.
      fromHome: { x: 0.1, y: 0.9, facing: 'right' },
      fromKiosk: { x: 0.25, y: 0.9, facing: 'right' },
      fromPitch: { x: 0.66, y: 0.86, facing: 'left' },
      fromRoute: { x: 0.94, y: 0.86, facing: 'left' },
    },
    actors: [
      {
        id: 'ofir',
        figure: 'ofir',
        x: 0.3,
        y: 0.88,
        size: 0.3,
        nameHe: 'אופיר',
        talk: 'ofir-wall',
        when: { beforeMinute: KOBI_LEAVES },
        sway: 0.008,
      },
      {
        id: 'ofir-later',
        figure: 'ofir',
        x: 0.62,
        y: 0.86,
        size: 0.29,
        nameHe: 'אופיר',
        talk: 'ofir-matchday',
        when: { afterMinute: KOBI_LEAVES },
      },
      {
        id: 'neighbour',
        figure: 'oldMan',
        x: 0.44,
        y: 0.83,
        size: 0.26,
        nameHe: 'שכן',
        talk: 'neighbour',
        sway: 0.005,
      },
      {
        id: 'fan-passing',
        figure: 'fanD',
        x: 0.78,
        y: 0.88,
        size: 0.3,
        nameHe: 'אוהד',
        talk: 'route-fan',
        when: { afterMinute: KOBI_LEAVES },
      },
    ],
    hotspots: [
      { id: 'wall', x: 0.68, y: 0.84, w: 0.08, act: 'wall-writing', verb: 'look', labelHe: 'הכתובת על הקיר' },
      {
        id: 'coin',
        x: 0.5,
        y: 0.92,
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
        y: 0.7,
        w: 0.032,
        h: 0.28,
        to: 'home',
        spawn: 'fromStreet',
        labelHe: 'הביתה',
        light: { x: 0.0, y: 0.6, w: 0.05, h: 0.36, tone: 'inside' },
        dwellMs: 300,
      },
      {
        id: 'kiosk',
        x: 0.13,
        y: 0.86,
        w: 0.08,
        h: 0.12,
        to: 'kiosk',
        spawn: 'fromStreet',
        labelHe: 'לקיוסק',
        light: { x: 0.075, y: 0.5, w: 0.11, h: 0.42, tone: 'daylight' },
        // A shop is somewhere you STOP, so its door takes a moment of standing still.
        // Walking past a kiosk on your way east must never put you inside it.
        dwellMs: 900,
      },
      {
        id: 'pitch',
        x: 0.5,
        y: 0.7,
        w: 0.1,
        h: 0.06,
        to: 'pitch',
        spawn: 'fromStreet',
        labelHe: 'לסמטה ולמגרש',
        light: { x: 0.52, y: 0.42, w: 0.07, h: 0.36, tone: 'inside' },
        dwellMs: 900,
      },
      {
        id: 'route',
        x: 0.955,
        y: 0.68,
        w: 0.045,
        h: 0.3,
        to: 'route',
        spawn: 'fromStreet',
        labelHe: 'מזרחה, אחרי האנשים',
        light: { x: 0.95, y: 0.55, w: 0.05, h: 0.42, tone: 'daylight' },
        dwellMs: 420,
        priority: 2,
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
        talk: 'pitch-kids',
        sway: 0.01,
      },
      { id: 'amit', figure: 'amit', x: 0.83, y: 0.86, size: 0.26, nameHe: 'עמית', talk: 'pitch-kids', flip: true },
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
  {
    id: 'route',
    titleHe: 'בדרך לבלומפילד',
    art: 'approach',
    band: { far: 0.72, near: 0.94 },
    size: { far: 0.2, near: 0.32 },
    ambience: 'dusk',
    stuckHe: 'כולם הולכים מזרחה. פשוט אל תעצור.',
    spawns: { fromStreet: { x: 0.05, y: 0.86, facing: 'right' }, fromGround: { x: 0.94, y: 0.86, facing: 'left' } },
    actors: [
      { id: 'fan1', figure: 'fanA', x: 0.26, y: 0.88, size: 0.3, nameHe: 'אוהד', talk: 'route-fan' },
      { id: 'fan2', figure: 'fanC', x: 0.58, y: 0.84, size: 0.28, nameHe: 'אוהד ותיק', talk: 'route-veteran', flip: true },
      { id: 'fan3', figure: 'fanF', x: 0.78, y: 0.9, size: 0.31, nameHe: 'אוהד', talk: 'route-fan' },
    ],
    hotspots: [{ id: 'banner', x: 0.42, y: 0.82, w: 0.08, act: 'route-banner', verb: 'look', labelHe: 'השלט' }],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.72,
        w: 0.035,
        h: 0.26,
        to: 'street',
        spawn: 'fromRoute',
        labelHe: 'חזרה לרחוב',
        dwellMs: 500,
      },
      {
        id: 'ground',
        x: 0.965,
        y: 0.72,
        w: 0.035,
        h: 0.26,
        to: 'bloomfield-outside',
        spawn: 'fromRoute',
        labelHe: 'לאצטדיון',
        light: { x: 0.955, y: 0.5, w: 0.045, h: 0.46, tone: 'daylight' },
        dwellMs: 300,
        priority: 2,
      },
    ],
  },

  // -------------------------------------------------------------------- outside ---
  {
    id: 'bloomfield-outside',
    titleHe: 'בלומפילד — מבחוץ',
    art: 'gate7',
    band: { far: 0.78, near: 0.96 },
    size: { far: 0.18, near: 0.27 },
    ambience: 'day',
    stuckHe: 'תדבר עם מישהו. מישהו פה ייקח אותך פנימה.',
    spawns: { fromRoute: { x: 0.05, y: 0.88, facing: 'right' }, fromTunnel: { x: 0.7, y: 0.92, facing: 'left' } },
    actors: [
      { id: 'steward', figure: 'fanB', x: 0.57, y: 0.86, size: 0.24, nameHe: 'סדרן', talk: 'steward' },
      { id: 'ticket', figure: 'fanG', x: 0.86, y: 0.92, size: 0.26, nameHe: 'הקופאי', talk: 'ticket-window', flip: true },
      {
        id: 'veteran',
        figure: 'fanC',
        x: 0.24,
        y: 0.9,
        size: 0.26,
        nameHe: 'אוהד ותיק',
        talk: 'gate-veteran',
        sway: 0.004,
      },
      {
        id: 'ofir-ground',
        figure: 'ofir',
        x: 0.4,
        y: 0.92,
        size: 0.24,
        nameHe: 'אופיר',
        talk: 'ofir-ground',
        when: { bond: { who: 'ofir', min: 40 } },
      },
      { id: 'crowd-a', figure: 'fanE', x: 0.7, y: 0.94, size: 0.27, nameHe: 'אוהד', talk: 'route-fan', flip: true },
    ],
    hotspots: [
      { id: 'gate7', x: 0.5, y: 0.8, w: 0.1, act: 'gate-seven', verb: 'look', labelHe: 'שער 7' },
      { id: 'fence', x: 0.14, y: 0.82, w: 0.08, act: 'fence-look', verb: 'look', labelHe: 'הגדר' },
    ],
    exits: [
      {
        id: 'back',
        x: 0.0,
        y: 0.78,
        w: 0.035,
        h: 0.2,
        to: 'route',
        spawn: 'fromGround',
        labelHe: 'חזרה',
        dwellMs: 600,
      },
      {
        id: 'in',
        x: 0.44,
        y: 0.78,
        w: 0.18,
        h: 0.12,
        to: 'bloomfield-tunnel',
        spawn: 'start',
        labelHe: 'פנימה, בשער 7',
        when: { flag: 'entry:granted' },
        light: { x: 0.46, y: 0.42, w: 0.14, h: 0.42, tone: 'inside' },
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
        figure: 'kobi',
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
