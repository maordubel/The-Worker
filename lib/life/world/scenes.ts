import { at } from '../clock'
import type { LocationId } from '../types'

import type { Condition } from './types'

/**
 * העולם המצויר — a location is a painted board plus a strip of floor you may stand on.
 *
 * The first build drew rooms out of rectangles. The approved concept boards are painted
 * 3/4 interiors and streets, so the world is now what the boards actually are: one
 * backdrop image per place, a WALK BAND across it, and people standing in it at a scale
 * that comes from how far up the band they are. That is the whole trick behind every
 * hand-painted 2D adventure, and it costs one image per room instead of a tile set.
 *
 * **Everything is a fraction of the backdrop**, never a pixel. Re-cutting a crop at a
 * different size, or dropping in a bigger final painting later, must not move a single
 * door or person — so `x`, `y`, `band` and `size` are all 0..1 and the runtime multiplies
 * by whatever the loaded image turns out to be.
 *
 * **On Kobi and Rachel.** The board draws the children full-length and the parents from
 * the hips up. Rather than mixing in a second art style for two legs, the scenes place
 * them where a half-figure is the truth: Kobi seated on the sofa, Rachel behind the
 * kitchen table, Kobi again inside a packed terrace. When full-length parents are drawn
 * they drop into the same slots.
 */

export const KICKOFF = at(16, 0)
export const KOBI_LEAVES = at(15, 10)
export const FULL_TIME = at(17, 45)

export type ActorDef = {
  id: string
  figure: string
  /** 0..1 across the backdrop; y is where the FEET stand */
  x: number
  y: number
  /** display height as a fraction of the backdrop height */
  size: number
  nameHe: string
  talk?: string
  when?: Condition
  /** the figure is drawn mirrored — a crowd of one sprite must not look like a chorus */
  flip?: boolean
  /** small idle drift, in fractions per second, so nobody is a statue */
  sway?: number
}

export type HotspotDef = {
  id: string
  x: number
  y: number
  /** half-width of the reach zone, in fractions */
  w?: number
  act: string
  when?: Condition
  /** an object drawn on top of the painting — a collectible that appears in the room */
  prop?: { key: string; size: number }
}

export type ExitDef = {
  id: string
  /** the zone that sends you on, in fractions */
  x: number
  y: number
  w: number
  h: number
  to: LocationId
  spawn: string
  when?: Condition
  /** true = press the button; false = walk into it */
  manual?: boolean
}

export type Ambience = 'interior' | 'kitchen' | 'day' | 'dusk' | 'tunnel' | 'stadium'

export type SceneDef = {
  id: LocationId
  titleHe: string
  art: string
  /** the walkable strip, as fractions of the backdrop height */
  band: { far: number; near: number }
  /** the child's height at the far and near edge of the band */
  size: { far: number; near: number }
  /** where the player enters from, in fractions */
  spawns: Record<string, { x: number; y: number }>
  actors: ActorDef[]
  hotspots: HotspotDef[]
  exits: ExitDef[]
  ambience: Ambience
  /** a full-screen cinematic played the first time you arrive */
  arrival?: { art: string; ms: number; flag: string }
}

const SCENES: SceneDef[] = [
  // ------------------------------------------------------------------- bedroom ----
  {
    id: 'bedroom',
    titleHe: 'החדר שלך',
    art: 'bedroom',
    band: { far: 0.84, near: 0.97 },
    size: { far: 0.30, near: 0.38 },
    ambience: 'interior',
    // Never spawn on top of a hotspot: the first button press of the game would open a
    // cupboard instead of moving the child.
    spawns: { start: { x: 0.28, y: 0.93 }, fromHome: { x: 0.12, y: 0.9 } },
    actors: [],
    hotspots: [
      { id: 'bed', x: 0.47, y: 0.92, w: 0.14, act: 'bed' },
      { id: 'poster', x: 0.72, y: 0.9, w: 0.1, act: 'poster' },
      { id: 'desk', x: 0.15, y: 0.9, w: 0.09, act: 'desk' },
      {
        id: 'redbox',
        x: 0.89,
        y: 0.95,
        w: 0.08,
        act: 'redbox',
        prop: { key: 'propScarf', size: 0.1 },
      },
      { id: 'window', x: 0.62, y: 0.88, w: 0.08, act: 'window' },
    ],
    exits: [{ id: 'out', x: 0.0, y: 0.82, w: 0.07, h: 0.18, to: 'home', spawn: 'fromBedroom' }],
  },

  // ---------------------------------------------------------------------- home ----
  {
    id: 'home',
    titleHe: 'הבית',
    art: 'living',
    band: { far: 0.76, near: 0.95 },
    size: { far: 0.28, near: 0.38 },
    ambience: 'interior',
    spawns: {
      fromBedroom: { x: 0.9, y: 0.88 },
      fromStreet: { x: 0.1, y: 0.92 },
      fromKitchen: { x: 0.2, y: 0.82 },
    },
    actors: [
      {
        id: 'kobi',
        figure: 'kobi',
        x: 0.76,
        y: 0.82,
        size: 0.44,
        nameHe: 'קובי',
        talk: 'kobi-morning',
        when: { beforeMinute: KOBI_LEAVES },
        sway: 0.004,
      },
    ],
    hotspots: [
      { id: 'radio', x: 0.16, y: 0.82, w: 0.1, act: 'radio' },
      { id: 'photo', x: 0.44, y: 0.8, w: 0.08, act: 'family-photo' },
      { id: 'table', x: 0.42, y: 0.93, w: 0.1, act: 'coffee-table' },
    ],
    exits: [
      { id: 'bedroom', x: 0.94, y: 0.74, w: 0.06, h: 0.24, to: 'bedroom', spawn: 'fromHome' },
      { id: 'kitchen', x: 0.0, y: 0.74, w: 0.05, h: 0.14, to: 'kitchen', spawn: 'fromHome' },
      {
        id: 'street',
        x: 0.24,
        y: 0.93,
        w: 0.22,
        h: 0.07,
        to: 'street',
        spawn: 'fromHome',
        manual: true,
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
    spawns: { fromHome: { x: 0.88, y: 0.9 } },
    actors: [
      {
        id: 'rachel',
        figure: 'rachel',
        x: 0.6,
        y: 0.88,
        size: 0.36,
        nameHe: 'רחל',
        talk: 'rachel-kitchen',
        sway: 0.005,
      },
    ],
    hotspots: [
      { id: 'crate', x: 0.15, y: 0.9, w: 0.1, act: 'bottles' },
      { id: 'table', x: 0.82, y: 0.92, w: 0.12, act: 'kitchen-table' },
    ],
    exits: [{ id: 'out', x: 0.95, y: 0.76, w: 0.05, h: 0.22, to: 'home', spawn: 'fromKitchen' }],
  },

  // -------------------------------------------------------------------- street ----
  {
    id: 'street',
    titleHe: 'הרחוב',
    art: 'street',
    band: { far: 0.7, near: 0.94 },
    size: { far: 0.2, near: 0.32 },
    ambience: 'day',
    spawns: {
      fromHome: { x: 0.06, y: 0.86 },
      fromKiosk: { x: 0.14, y: 0.9 },
      fromPitch: { x: 0.56, y: 0.82 },
      fromRoute: { x: 0.95, y: 0.86 },
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
        sway: 0.01,
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
        sway: 0.006,
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
      { id: 'wall', x: 0.68, y: 0.84, w: 0.08, act: 'wall-writing' },
      {
        id: 'coin',
        x: 0.5,
        y: 0.92,
        w: 0.05,
        act: 'gutter-coin',
        when: { notFlag: 'found:coin' },
      },
      { id: 'alley', x: 0.55, y: 0.78, w: 0.06, act: 'alley-look' },
    ],
    exits: [
      { id: 'home', x: 0.0, y: 0.72, w: 0.04, h: 0.26, to: 'home', spawn: 'fromStreet' },
      { id: 'kiosk', x: 0.09, y: 0.86, w: 0.1, h: 0.12, to: 'kiosk', spawn: 'fromStreet', manual: true },
      { id: 'pitch', x: 0.53, y: 0.74, w: 0.07, h: 0.1, to: 'pitch', spawn: 'fromStreet', manual: true },
      { id: 'route', x: 0.97, y: 0.7, w: 0.03, h: 0.28, to: 'route', spawn: 'fromStreet', manual: true },
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
    spawns: { fromStreet: { x: 0.72, y: 0.93 } },
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
    hotspots: [{ id: 'counter', x: 0.55, y: 0.92, w: 0.14, act: 'kiosk-counter' }],
    exits: [{ id: 'out', x: 0.9, y: 0.84, w: 0.1, h: 0.16, to: 'street', spawn: 'fromKiosk' }],
  },

  // --------------------------------------------------------------------- pitch ----
  {
    id: 'pitch',
    titleHe: 'המגרש',
    art: 'pitch',
    band: { far: 0.68, near: 0.94 },
    size: { far: 0.2, near: 0.3 },
    ambience: 'day',
    spawns: { fromStreet: { x: 0.08, y: 0.82 } },
    actors: [
      {
        id: 'efi',
        figure: 'efi',
        x: 0.24,
        y: 0.9,
        size: 0.28,
        nameHe: 'אפי',
        talk: 'pitch-kids',
        sway: 0.012,
      },
      { id: 'amit', figure: 'amit', x: 0.83, y: 0.86, size: 0.26, nameHe: 'עמית', talk: 'pitch-kids', flip: true },
    ],
    hotspots: [{ id: 'ball', x: 0.5, y: 0.9, w: 0.1, act: 'pitch-ball', prop: { key: 'propBall', size: 0.07 } }],
    exits: [{ id: 'back', x: 0.0, y: 0.68, w: 0.04, h: 0.3, to: 'street', spawn: 'fromPitch' }],
  },

  // --------------------------------------------------------------------- route ----
  {
    id: 'route',
    titleHe: 'בדרך לבלומפילד',
    art: 'approach',
    band: { far: 0.72, near: 0.94 },
    size: { far: 0.2, near: 0.32 },
    ambience: 'dusk',
    spawns: { fromStreet: { x: 0.04, y: 0.86 }, fromGround: { x: 0.95, y: 0.86 } },
    actors: [
      { id: 'fan1', figure: 'fanA', x: 0.26, y: 0.88, size: 0.3, nameHe: 'אוהד', talk: 'route-fan' },
      { id: 'fan2', figure: 'fanC', x: 0.58, y: 0.84, size: 0.28, nameHe: 'אוהד ותיק', talk: 'route-veteran', flip: true },
      { id: 'fan3', figure: 'fanF', x: 0.78, y: 0.9, size: 0.31, nameHe: 'אוהד', talk: 'route-fan' },
    ],
    hotspots: [{ id: 'banner', x: 0.42, y: 0.82, w: 0.08, act: 'route-banner' }],
    exits: [
      { id: 'back', x: 0.0, y: 0.72, w: 0.03, h: 0.26, to: 'street', spawn: 'fromRoute' },
      { id: 'ground', x: 0.97, y: 0.72, w: 0.03, h: 0.26, to: 'bloomfield-outside', spawn: 'fromRoute' },
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
    spawns: { fromRoute: { x: 0.05, y: 0.88 }, fromTunnel: { x: 0.6, y: 0.86 } },
    actors: [
      { id: 'steward', figure: 'fanB', x: 0.57, y: 0.86, size: 0.24, nameHe: 'סדרן', talk: 'steward' },
      { id: 'ticket', figure: 'fanG', x: 0.86, y: 0.92, size: 0.26, nameHe: 'הקופאי', talk: 'ticket-window', flip: true },
      { id: 'veteran', figure: 'fanC', x: 0.24, y: 0.9, size: 0.26, nameHe: 'אוהד ותיק', talk: 'gate-veteran', sway: 0.005 },
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
      { id: 'gate7', x: 0.5, y: 0.8, w: 0.1, act: 'gate-seven' },
      { id: 'fence', x: 0.14, y: 0.82, w: 0.08, act: 'fence-look' },
    ],
    exits: [
      { id: 'back', x: 0.0, y: 0.78, w: 0.03, h: 0.2, to: 'route', spawn: 'fromGround' },
      {
        id: 'in',
        x: 0.46,
        y: 0.78,
        w: 0.14,
        h: 0.1,
        to: 'bloomfield-tunnel',
        spawn: 'start',
        when: { flag: 'entry:granted' },
        manual: true,
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
    spawns: { start: { x: 0.5, y: 0.92 } },
    actors: [],
    hotspots: [],
    exits: [
      // Walking INTO the picture: the exit is the far end of the corridor, not a side.
      { id: 'up', x: 0.4, y: 0.6, w: 0.2, h: 0.05, to: 'bloomfield-inside', spawn: 'start' },
      { id: 'back', x: 0.0, y: 0.9, w: 0.06, h: 0.1, to: 'bloomfield-outside', spawn: 'fromTunnel' },
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
    spawns: { start: { x: 0.12, y: 0.93 } },
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
    hotspots: [{ id: 'rail', x: 0.2, y: 0.9, w: 0.1, act: 'terrace-rail' }],
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
