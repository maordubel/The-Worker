import {
  flagOn,
  relationshipOf,
  type CharacterId,
  type FlagId,
  type ItemId,
  type LifeState,
  type LocationId,
  type PersonalityId,
  type RedHeartId,
  type RelationshipAxis,
  type WellbeingId,
} from '../types'

/**
 * העולם כנתונים — a location is data, not code, and so is a rule.
 *
 * Brief §8 asks for a compact hub world whose places can evolve across decades and be
 * recognised again as an adult. That is only true if a place is a DESCRIPTION — geometry,
 * paint, people, doors — rather than a scene class. `WorldScene` is one scene; there are
 * as many locations as there are entries in `SCENE`, and 1990's street is the same file
 * with a different layer list.
 *
 * Conditions are data too, and this is the file the systems pass grew the most. A door
 * that opens only after Kobi has left, a supporter who only talks to a child who has
 * been to the ground before, a choice that appears because you kept a promise three
 * hours ago — all of them are a `Condition` object, composed from a small vocabulary,
 * evaluated in one place. Content composes; it never writes an `if`.
 *
 * Everything is additive: a condition written before this pass is still exactly as valid
 * and means exactly the same thing.
 */

export type Rect = { x: number; y: number; w: number; h: number }
export type Point = { x: number; y: number }

export type Condition = {
  // --- the original vocabulary ------------------------------------------------------
  flag?: FlagId
  notFlag?: FlagId
  hasItem?: ItemId
  lacksItem?: ItemId
  minAgorot?: number
  afterMinute?: number
  beforeMinute?: number
  bond?: { who: CharacterId; min: number }

  // --- the callback engine (brief §17) ----------------------------------------------
  /** a flag that carries a value, rather than a flag that is merely raised */
  flagIs?: { flag: FlagId; value: boolean | string | number }
  /** the player kept this in the red box, or this exact memory */
  hasMemory?: string
  lacksMemory?: string
  /** somebody remembers you doing this */
  relationshipMemory?: { who: CharacterId; eventId: string }
  lacksRelationshipMemory?: { who: CharacterId; eventId: string }
  /** any axis of a relationship, above or below a line */
  relationship?: { who: CharacterId; axis: RelationshipAxis; min?: number; max?: number }
  personalityAbove?: { key: PersonalityId; min: number }
  personalityBelow?: { key: PersonalityId; max: number }
  redHeartAbove?: { key: RedHeartId; min: number }
  wellbeingAbove?: { key: WellbeingId; min: number }
  wellbeingBelow?: { key: WellbeingId; max: number }
  minEnergy?: number
  /** an opportunity the player took, or let go */
  opportunityTaken?: string
  opportunityMissed?: string
  attendedAnchor?: string
  missedAnchor?: string
  at?: LocationId

  // --- composition ------------------------------------------------------------------
  /** every one of these must hold */
  all?: Condition[]
  /** at least one of these must hold */
  any?: Condition[]
  /** none of these may hold */
  none?: Condition[]
}

function opportunityStatus(state: LifeState, id: string): string | null {
  return state.opportunities.find((entry) => entry.id === id)?.status ?? null
}

export function meets(state: LifeState, condition?: Condition): boolean {
  if (!condition) return true

  if (condition.flag && !flagOn(state, condition.flag)) return false
  if (condition.notFlag && flagOn(state, condition.notFlag)) return false
  if (condition.hasItem && (state.inventory[condition.hasItem] ?? 0) < 1) return false
  if (condition.lacksItem && (state.inventory[condition.lacksItem] ?? 0) > 0) return false
  if (condition.minAgorot !== undefined && state.agorot < condition.minAgorot) return false
  if (condition.afterMinute !== undefined && state.minute < condition.afterMinute) return false
  if (condition.beforeMinute !== undefined && state.minute >= condition.beforeMinute) return false
  if (condition.bond && (state.bonds[condition.bond.who] ?? 0) < condition.bond.min) return false

  if (condition.flagIs && state.flags[condition.flagIs.flag] !== condition.flagIs.value) return false

  if (condition.hasMemory && !state.memories.some((memory) => memory.id === condition.hasMemory)) return false
  if (condition.lacksMemory && state.memories.some((memory) => memory.id === condition.lacksMemory)) return false

  if (condition.relationshipMemory) {
    const wanted = condition.relationshipMemory
    const found = state.relationshipMemory.some(
      (entry) => entry.characterId === wanted.who && entry.eventId === wanted.eventId,
    )
    if (!found) return false
  }
  if (condition.lacksRelationshipMemory) {
    const unwanted = condition.lacksRelationshipMemory
    const found = state.relationshipMemory.some(
      (entry) => entry.characterId === unwanted.who && entry.eventId === unwanted.eventId,
    )
    if (found) return false
  }

  if (condition.relationship) {
    const { who, axis, min, max } = condition.relationship
    const value = relationshipOf(state, who)[axis]
    if (min !== undefined && value < min) return false
    if (max !== undefined && value > max) return false
  }

  if (condition.personalityAbove && state.personality[condition.personalityAbove.key] < condition.personalityAbove.min)
    return false
  if (condition.personalityBelow && state.personality[condition.personalityBelow.key] > condition.personalityBelow.max)
    return false
  if (condition.redHeartAbove && state.redHeart[condition.redHeartAbove.key] < condition.redHeartAbove.min) return false
  if (condition.wellbeingAbove && state.wellbeing[condition.wellbeingAbove.key] < condition.wellbeingAbove.min)
    return false
  if (condition.wellbeingBelow && state.wellbeing[condition.wellbeingBelow.key] > condition.wellbeingBelow.max)
    return false
  if (condition.minEnergy !== undefined && state.energy < condition.minEnergy) return false

  if (condition.opportunityTaken && opportunityStatus(state, condition.opportunityTaken) !== 'taken') return false
  if (condition.opportunityMissed && opportunityStatus(state, condition.opportunityMissed) !== 'missed') return false

  if (condition.attendedAnchor && !state.attendedAnchors.includes(condition.attendedAnchor)) return false
  if (condition.missedAnchor && !state.missedAnchors.includes(condition.missedAnchor)) return false
  if (condition.at && state.location !== condition.at) return false

  if (condition.all && !condition.all.every((child) => meets(state, child))) return false
  if (condition.any && condition.any.length > 0 && !condition.any.some((child) => meets(state, child))) return false
  if (condition.none && condition.none.some((child) => meets(state, child))) return false

  return true
}

// ---------------------------------------------------------------------------------
// The named questions content asks. They exist so a dialogue file reads like a
// sentence — `hasRelationshipMemory(state, 'kobi', 'lied-about-bloomfield')` — instead
// of like a lookup, and so there is exactly one implementation of each of them.
// ---------------------------------------------------------------------------------

export function hasMemory(state: LifeState, id: string): boolean {
  return state.memories.some((memory) => memory.id === id)
}

export function hasRelationshipMemory(state: LifeState, who: CharacterId, eventId: string): boolean {
  return state.relationshipMemory.some((entry) => entry.characterId === who && entry.eventId === eventId)
}

export function attendedAnchor(state: LifeState, anchorId: string): boolean {
  return state.attendedAnchors.includes(anchorId)
}

export function missedAnchor(state: LifeState, anchorId: string): boolean {
  return state.missedAnchors.includes(anchorId)
}

export function ownsItem(state: LifeState, item: ItemId, count = 1): boolean {
  return (state.inventory[item] ?? 0) >= count
}

export function hasFlag(state: LifeState, flag: FlagId): boolean {
  return flagOn(state, flag)
}

export function redHeartAbove(state: LifeState, key: RedHeartId, min: number): boolean {
  return state.redHeart[key] >= min
}

export function personalityAbove(state: LifeState, key: PersonalityId, min: number): boolean {
  return state.personality[key] >= min
}
