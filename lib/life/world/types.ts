import type { PaintOp } from '../runtime/painter'
import type { BondId, FlagId, ItemId, LifeState, LocationId } from '../types'

/**
 * העולם כנתונים — a location is data, not code.
 *
 * Brief §8 asks for a compact hub world whose places can evolve across decades and be
 * recognised again as an adult. That is only true if a place is a DESCRIPTION — geometry,
 * paint, people, doors — rather than a scene class. `WorldScene` is one scene; there are
 * as many locations as there are entries in `MAPS`, and 1990's street is the same file
 * with a different layer list.
 *
 * Conditions are data too. A door that opens only after Kobi has left, an NPC who is
 * only there in the afternoon, a choice you can see but cannot take — all of them are a
 * `Condition` object the engine evaluates, never a callback baked into a map. That is
 * what keeps saves portable and what lets a test assert a route is reachable.
 */

export type Rect = { x: number; y: number; w: number; h: number }
export type Point = { x: number; y: number }

export type Condition = {
  flag?: FlagId
  notFlag?: FlagId
  hasItem?: ItemId
  lacksItem?: ItemId
  minAgorot?: number
  afterMinute?: number
  beforeMinute?: number
  bond?: { who: BondId; min: number }
}

export function meets(state: LifeState, condition?: Condition): boolean {
  if (!condition) return true
  if (condition.flag && state.flags[condition.flag] !== true) return false
  if (condition.notFlag && state.flags[condition.notFlag] === true) return false
  if (condition.hasItem && (state.inventory[condition.hasItem] ?? 0) < 1) return false
  if (condition.lacksItem && (state.inventory[condition.lacksItem] ?? 0) > 0) return false
  if (condition.minAgorot !== undefined && state.agorot < condition.minAgorot) return false
  if (condition.afterMinute !== undefined && state.minute < condition.afterMinute) return false
  if (condition.beforeMinute !== undefined && state.minute >= condition.beforeMinute) return false
  if (condition.bond && state.bonds[condition.bond.who] < condition.bond.min) return false
  return true
}

export type NpcDef = {
  id: string
  /** a key in `cast()` — the figure spec, never a sprite path */
  figure: string
  x: number
  y: number
  facing?: 'down' | 'up' | 'left' | 'right'
  /** a loop of places to stand. Empty means the person stays put. */
  route?: Array<Point & { wait?: number }>
  /** conversation id in `content/dialogue.ts` */
  talk?: string
  /** the name shown in the dialogue box, from the content layer */
  nameHe: string
  when?: Condition
}

export type PropDef = {
  id: string
  x: number
  y: number
  w: number
  h: number
  /** interaction id in `content/interactions.ts` */
  act?: string
  solid?: boolean
  when?: Condition
  /** painted only while `when` holds — how the red box fills up */
  layers?: PaintOp[]
}

export type ExitDef = {
  id: string
  x: number
  y: number
  w: number
  h: number
  to: LocationId
  spawn: string
  when?: Condition
  /** shown instead of walking through, when the condition fails */
  blockedTalk?: string
  /** true = you must press the action button; false = walking in is enough */
  manual?: boolean
}

export type MapDef = {
  id: LocationId
  titleHe: string
  width: number
  height: number
  base: 'sky' | 'night' | 'interior'
  /** painted under everything that moves */
  layers: PaintOp[]
  /** painted over everything that moves — a near wall, a doorway, a foreground crowd */
  overlay?: PaintOp[]
  /** conditional paint, so a room can change without a second map */
  extra?: Array<{ when: Condition; layers: PaintOp[] }>
  solids: Rect[]
  spawns: Record<string, Point>
  npcs: NpcDef[]
  props: PropDef[]
  exits: ExitDef[]
  /** how far the camera pulls back — bigger rooms want a wider view */
  zoom?: number
}
