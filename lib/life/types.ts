/**
 * THE WORKER LIFE — the shape of a life.
 *
 * This file is the contract between the simulation and everything that renders it.
 * It holds NO Hebrew, NO React and NO Phaser: the engine has to be runnable in a test
 * with nothing but Node, or the day comes when the only way to check whether Saturday
 * works is to play until Saturday.
 *
 * Two separations are load-bearing and both are in the brief:
 *
 *  · **Canon vs fiction.** Nothing here describes a historical fact. Facts arrive as a
 *    `HistoricalAnchor`, resolved server-side from the canonical archive, and the life
 *    layer only ever holds the anchor's ID. A championship is not a string in a
 *    dialogue file.
 *  · **State vs rendering.** `LifeState` is what is TRUE. The Phaser runtime draws it
 *    and sends events back; it never owns a number. That is what lets the same save
 *    survive a rewritten scene, and it is what will let 1990 be a different map over
 *    the same life.
 */

/** Every place the vertical slice can put you. Stage 1 is eight of them. */
export type LocationId =
  | 'prologue-1972'
  | 'bedroom'
  | 'home'
  | 'kitchen'
  | 'street'
  | 'kiosk'
  | 'pitch'
  | 'route'
  | 'bloomfield-outside'
  | 'bloomfield-tunnel'
  | 'bloomfield-inside'

/** The people Stage 1 tracks. The list grows; the shape does not. */
export type BondId = 'kobi' | 'rachel' | 'ofir'

/**
 * The quiet numbers. They are never printed on screen — rule 15 of the brief — and the
 * only way a player learns one moved is that somebody behaved differently.
 */
export type TraitId =
  | 'independence'
  | 'courage'
  | 'knowledge'
  | 'streetSmarts'
  | 'responsibility'
  | 'footballAffinity'
  | 'basketballAffinity'
  | 'cultureAffinity'

/** Small, physical, period. No RPG loot. */
export type ItemId =
  | 'house-key'
  | 'coin'
  | 'newspaper'
  | 'football-card'
  | 'bottle'
  | 'folded-paper'
  | 'ticket-stub'
  | 'scarf'

/** A flag is a thing that happened once and can never un-happen. */
export type FlagId = string

/** What ends up in the red box. A memory is a save you can look at. */
export type Memory = {
  id: string
  /** the item it is made of, so the bedroom knows what to draw */
  item: ItemId
  /** minutes-since-midnight on the day it was kept */
  atMinute: number
  year: number
  /** canonical anchor this memory is attached to, if any — an ID, never a fact */
  anchorId: string | null
}

export type PlayerIdentity = {
  name: string
  /** the architecture supports both from day one; Stage 1 ships one figure */
  sex: 'boy' | 'girl'
  birthYear: number
}

export type LifeState = {
  readonly identity: PlayerIdentity
  year: number
  /** age in whole years at `year` */
  age: number
  /** 0 = Sunday … 6 = Saturday, the Israeli week */
  weekday: number
  /** minutes since midnight */
  minute: number
  /** אגורות, so no float ever touches money */
  agorot: number
  /** 0..100; walking costs nothing, running and playing do */
  energy: number
  location: LocationId
  bonds: Record<BondId, number>
  traits: Record<TraitId, number>
  inventory: Partial<Record<ItemId, number>>
  flags: Record<FlagId, true>
  memories: Memory[]
  /** canonical anchor IDs — never a match description */
  attendedAnchors: string[]
  missedAnchors: string[]
  /** the chapter the runtime should be showing */
  chapter: string
  /** true once the chapter's closing beat has played */
  chapterDone: boolean
}

export const BOND_IDS: readonly BondId[] = ['kobi', 'rachel', 'ofir']

export const TRAIT_IDS: readonly TraitId[] = [
  'independence',
  'courage',
  'knowledge',
  'streetSmarts',
  'responsibility',
  'footballAffinity',
  'basketballAffinity',
  'cultureAffinity',
]

/** Bonds and traits are 0..100 and clamp rather than throw. A life does not overflow. */
export function clamp(value: number, low = 0, high = 100): number {
  return Math.max(low, Math.min(high, value))
}
