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
 *
 * ---------------------------------------------------------------------------------
 * **VERSION 2 — the real game systems pass.**
 *
 * The first state was big enough for one Saturday and too small for forty years. This
 * one carries the domains the whole life needs: resources you spend, wellbeing you
 * cannot read off a bar, a personality that emerges from repetition, a Red Heart that
 * is the club rather than a fan level, relationships with more than one axis, a Red Box
 * of real objects, live opportunities, and a seeded random cursor so a QA run is
 * reproducible.
 *
 * It is **additive**. Every field the old state had is still here, still written by the
 * same events, so a save recorded before this pass folds into the new shape with no
 * migration step and no lost life: the save is a log, and a log read by a richer reducer
 * simply produces a richer state. `bonds` and `traits` survive as the legacy surface the
 * existing chapter writes through, and each of them now ALSO feeds the model that
 * replaced it — a line that says `trait: 'footballAffinity'` moves the Red Heart.
 */

/** Every place the game can put you. The list grows with the decades. */
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

/**
 * מי — a character is a string, deliberately.
 *
 * The old union `'kobi' | 'rachel' | 'ofir'` meant every new person in 1996 was an edit
 * to a type the whole engine depends on. A character is now an ID registered in
 * `lib/life/characters.ts`; adding somebody is adding a row.
 */
export type CharacterId = string

/** Kept as a name for the same thing, so existing content reads unchanged. */
export type BondId = CharacterId

/**
 * The quiet numbers of the first pass. They are never printed on screen and the only
 * way a player learns one moved is that somebody behaved differently.
 *
 * They are now a WRITING SURFACE rather than the model: each one maps onto a
 * personality axis or a Red Heart dimension (see `TRAIT_ROUTE` below), so authored
 * content keeps its vocabulary while the systems underneath got real.
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
  /** the architecture supports both from day one; Stage A ships one figure */
  sex: 'boy' | 'girl'
  birthYear: number
}

// ---------------------------------------------------------------------------------
// RESOURCES — three things you spend, and every one of them is felt in 1986.
// ---------------------------------------------------------------------------------

export type ResourceState = {
  /** אגורות, so no float ever touches money */
  money: number
  /** 0..100; walking is free, running and playing are not */
  energy: number
  /** minutes left before the thing you are trying to reach stops mattering */
  availableTime: number
}

// ---------------------------------------------------------------------------------
// WELLBEING — never a bar on the HUD. It changes what people say to you.
// ---------------------------------------------------------------------------------

export type WellbeingState = {
  happiness: number
  stress: number
  loneliness: number
  belonging: number
  exhaustion: number
  regret: number
}

export type WellbeingId = keyof WellbeingState

export const WELLBEING_IDS: readonly WellbeingId[] = [
  'happiness',
  'stress',
  'loneliness',
  'belonging',
  'exhaustion',
  'regret',
]

// ---------------------------------------------------------------------------------
// PERSONALITY — no morality. High is not good. It emerges from repetition.
// ---------------------------------------------------------------------------------

export type PersonalityState = {
  independence: number
  courage: number
  responsibility: number
  reliability: number
  empathy: number
  streetSmarts: number
  curiosity: number
  impulsiveness: number
  stubbornness: number
  sociability: number
  riskTolerance: number
}

export type PersonalityId = keyof PersonalityState

export const PERSONALITY_IDS: readonly PersonalityId[] = [
  'independence',
  'courage',
  'responsibility',
  'reliability',
  'empathy',
  'streetSmarts',
  'curiosity',
  'impulsiveness',
  'stubbornness',
  'sociability',
  'riskTolerance',
]

// ---------------------------------------------------------------------------------
// RED HEART — the permanent identity system. Not a fan level.
// ---------------------------------------------------------------------------------

export type RedHeartState = {
  footballLove: number
  basketballLove: number
  troubleAffinity: number
  professionalFootball: number
  community: number
  terraceCulture: number
  travelDrive: number
  historyMemory: number
  familyTradition: number
  loyaltyReturn: number
}

export type RedHeartId = keyof RedHeartState

export const RED_HEART_IDS: readonly RedHeartId[] = [
  'footballLove',
  'basketballLove',
  'troubleAffinity',
  'professionalFootball',
  'community',
  'terraceCulture',
  'travelDrive',
  'historyMemory',
  'familyTradition',
  'loyaltyReturn',
]

// ---------------------------------------------------------------------------------
// RELATIONSHIPS — one number was a lie. Somebody can be your whole world and not
// trust you at all, and 1986 needs to be able to say so.
// ---------------------------------------------------------------------------------

export type RelationshipState = {
  bond: number
  trust: number
  familiarity: number
  sharedHistory: number
  tension: number
  distance: number
  /** minutes-since-midnight of the last thing that mattered, within the chapter's day */
  lastMeaningfulContact?: number
}

export type RelationshipAxis = keyof Omit<RelationshipState, 'lastMeaningfulContact'>

export const RELATIONSHIP_AXES: readonly RelationshipAxis[] = [
  'bond',
  'trust',
  'familiarity',
  'sharedHistory',
  'tension',
  'distance',
]

/**
 * זיכרון של מישהו אחר — what a person remembers you doing.
 *
 * Not a scene flag. A flag says the world changed; this says *somebody* changed their
 * mind about you, and it is queryable by any later conversation in any later decade:
 * did the player lie to Kobi, keep a promise, walk away from Ofir.
 */
export type RelationshipMemory = {
  characterId: CharacterId
  eventId: string
  significance: 'minor' | 'notable' | 'major'
  year: number
  atMinute: number
}

// ---------------------------------------------------------------------------------
// RED BOX — the objects a life keeps.
// ---------------------------------------------------------------------------------

export type RedBoxRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'unique_memory'

export type RedBoxItem = {
  id: string
  year: number
  atMinute: number
  sourceEventId: string
  titleHe: string
  noteHe?: string
  /** the item it is physically made of, so the box can draw it */
  item: ItemId
  rarity: RedBoxRarity
}

// ---------------------------------------------------------------------------------
// OPPORTUNITIES — several things worth doing, one afternoon.
// ---------------------------------------------------------------------------------

export type OpportunityStatus = 'open' | 'taken' | 'missed'

export type OpportunityRuntimeState = {
  id: string
  status: OpportunityStatus
  /** minute it was first offered to the player, for the log and the profile */
  offeredAt: number
  resolvedAt?: number
}

// ---------------------------------------------------------------------------------
// RANDOMNESS — reproducible, stored, and never applied to history.
// ---------------------------------------------------------------------------------

export type SeededRandomState = {
  seed: string
  cursor: number
}

export type HistoricalMemoryState = {
  attended: string[]
  missed: string[]
}

// ---------------------------------------------------------------------------------

export type LifeState = {
  /** the shape of this object, not the shape of the save file */
  readonly schemaVersion: 2

  readonly identity: PlayerIdentity
  year: number
  /** age in whole years at `year` */
  age: number
  /** 0 = Sunday … 6 = Saturday, the Israeli week */
  weekday: number
  /** minutes since midnight */
  minute: number

  /** אגורות — the same number `resources.money` carries, kept for the old surface */
  agorot: number
  /** 0..100 — the same number `resources.energy` carries */
  energy: number
  resources: ResourceState

  location: LocationId

  wellbeing: WellbeingState
  personality: PersonalityState
  redHeart: RedHeartState

  /** legacy single-number bonds; mirrors `relationships[id].bond` */
  bonds: Record<BondId, number>
  relationships: Record<CharacterId, RelationshipState>
  relationshipMemory: RelationshipMemory[]

  /** legacy traits; every one of them routes into personality or the Red Heart */
  traits: Record<TraitId, number>

  inventory: Partial<Record<ItemId, number>>
  flags: Record<FlagId, boolean | string | number>
  memories: Memory[]
  redBox: RedBoxItem[]

  opportunities: OpportunityRuntimeState[]
  /** encounter id → minute it last fired, so a pool can hold a cooldown */
  encounters: Record<string, number>
  rng: SeededRandomState

  /** canonical anchor IDs — never a match description */
  attendedAnchors: string[]
  missedAnchors: string[]

  /** the chapter the runtime should be showing */
  chapter: string
  /** true once the chapter's closing beat has played */
  chapterDone: boolean
}

export const BOND_IDS: readonly BondId[] = ['kobi', 'rachel', 'ofir', 'amit', 'efi', 'keren']

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

/**
 * The old vocabulary, routed into the new model.
 *
 * Content written before this pass says `trait: 'footballAffinity'`. That sentence is
 * still the right sentence — it is what the scene means — so instead of rewriting a
 * hundred lines of dialogue, the reducer reads this table and moves the Red Heart. New
 * content can address either surface; both end up in the same place.
 */
export const TRAIT_ROUTE: Record<
  TraitId,
  { personality?: PersonalityId; redHeart?: RedHeartId }
> = {
  independence: { personality: 'independence' },
  courage: { personality: 'courage' },
  responsibility: { personality: 'responsibility' },
  streetSmarts: { personality: 'streetSmarts' },
  knowledge: { personality: 'curiosity' },
  footballAffinity: { redHeart: 'footballLove' },
  basketballAffinity: { redHeart: 'basketballLove' },
  cultureAffinity: { redHeart: 'terraceCulture' },
}

/** Bonds and traits are 0..100 and clamp rather than throw. A life does not overflow. */
export function clamp(value: number, low = 0, high = 100): number {
  return Math.max(low, Math.min(high, value))
}

/** A relationship that has never happened yet: known to nobody, owed to nobody. */
export function blankRelationship(bond = 0): RelationshipState {
  return {
    bond,
    trust: bond > 0 ? Math.round(bond * 0.6) : 0,
    familiarity: bond > 0 ? Math.round(bond * 0.8) : 0,
    sharedHistory: 0,
    tension: 0,
    distance: bond > 0 ? 0 : 40,
  }
}

export function relationshipOf(state: LifeState, who: CharacterId): RelationshipState {
  return state.relationships[who] ?? blankRelationship(state.bonds[who] ?? 0)
}

export function bondOf(state: LifeState, who: CharacterId): number {
  return state.bonds[who] ?? 0
}

/** A flag can now hold a value; `hasFlag` is still the common question. */
export function flagOn(state: LifeState, flag: FlagId): boolean {
  const value = state.flags[flag]
  return value === true || (typeof value === 'number' && value > 0) || (typeof value === 'string' && value.length > 0)
}
