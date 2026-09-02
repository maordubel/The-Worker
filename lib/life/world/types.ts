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
