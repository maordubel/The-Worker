import {
  clamp,
  type BondId,
  type FlagId,
  type ItemId,
  type LifeState,
  type LocationId,
  type Memory,
  type PlayerIdentity,
  type TraitId,
} from './types'

/**
 * יומן החיים — the append-only log a life is made of.
 *
 * The save file is not a snapshot of `LifeState`; it is the ORDERED LIST OF THINGS THAT
 * HAPPENED, and the state is what you get by folding it. That choice costs nothing today
 * and buys three things the brief asks for by name:
 *
 *  · **Migration without a rewrite.** Moving to Supabase later is inserting the same
 *    rows into a table. A snapshot save would have to be reverse-engineered into events.
 *  · **A biography, not a score.** "You went to Bloomfield alone at eight" is a row in
 *    this log. A `LifeState` with `independence: 34` has thrown that away.
 *  · **Forward compatibility.** An unknown event type from a newer build folds to a
 *    no-op instead of corrupting a save, which is what `apply`'s default branch is for.
 *
 * Every event is small, past-tense and self-describing. Nothing here computes; the
 * reducer is the only place a number changes, so there is exactly one story about how
 * a life got the way it is.
 */
export type LifeEvent =
  | { t: 'life.started'; identity: PlayerIdentity; year: number; weekday: number; minute: number }
  | { t: 'clock.advanced'; minutes: number }
  | { t: 'moved'; to: LocationId }
  | { t: 'money.changed'; agorot: number; why: string }
  | { t: 'energy.changed'; delta: number }
  | { t: 'item.gained'; item: ItemId; count?: number }
  | { t: 'item.lost'; item: ItemId; count?: number }
  | { t: 'bond.shifted'; who: BondId; delta: number }
  | { t: 'trait.shifted'; trait: TraitId; delta: number }
  | { t: 'flag.raised'; flag: FlagId }
  | { t: 'memory.kept'; memory: Memory }
  | { t: 'anchor.attended'; anchorId: string }
  | { t: 'anchor.missed'; anchorId: string }
  | { t: 'chapter.entered'; chapter: string }
  | { t: 'chapter.completed'; chapter: string }

/** A day is 24×60. The clock wraps rather than running past midnight into nonsense. */
export const MINUTES_IN_DAY = 24 * 60

export function emptyState(identity: PlayerIdentity, year: number): LifeState {
  return {
    identity,
    year,
    age: year - identity.birthYear,
    weekday: 6,
    minute: 12 * 60 + 35,
    agorot: 0,
    energy: 100,
    location: 'prologue-1972',
    bonds: { kobi: 50, rachel: 50, ofir: 0 },
    traits: {
      independence: 5,
      courage: 10,
      knowledge: 5,
      streetSmarts: 5,
      responsibility: 10,
      footballAffinity: 20,
      basketballAffinity: 5,
      cultureAffinity: 5,
    },
    inventory: {},
    flags: {},
    memories: [],
    attendedAnchors: [],
    missedAnchors: [],
    chapter: 'prologue',
    chapterDone: false,
  }
}

/**
 * One event, one state. Pure, total, and tolerant of an event it has never seen —
 * a save written by a newer build must open, not explode.
 */
export function apply(state: LifeState, event: LifeEvent): LifeState {
  switch (event.t) {
    case 'life.started': {
      const fresh = emptyState(event.identity, event.year)
      return { ...fresh, weekday: event.weekday, minute: event.minute }
    }

    case 'clock.advanced': {
      const minute = (state.minute + Math.max(0, Math.round(event.minutes))) % MINUTES_IN_DAY
      const daysPassed = Math.floor(
        (state.minute + Math.max(0, Math.round(event.minutes))) / MINUTES_IN_DAY,
      )
      return {
        ...state,
        minute,
        weekday: (state.weekday + daysPassed) % 7,
      }
    }

    case 'moved':
      return { ...state, location: event.to }

    case 'money.changed':
      // Money floors at zero. A child does not carry a debt, and a scene that tries to
      // charge more than the player has has a bug the clamp makes visible in a test.
      return { ...state, agorot: Math.max(0, state.agorot + Math.round(event.agorot)) }

    case 'energy.changed':
      return { ...state, energy: clamp(state.energy + event.delta) }

    case 'item.gained': {
      const count = event.count ?? 1
      return {
        ...state,
        inventory: { ...state.inventory, [event.item]: (state.inventory[event.item] ?? 0) + count },
      }
    }

    case 'item.lost': {
      const count = event.count ?? 1
      const left = (state.inventory[event.item] ?? 0) - count
      const inventory = { ...state.inventory }
      if (left > 0) inventory[event.item] = left
      else delete inventory[event.item]
      return { ...state, inventory }
    }

    case 'bond.shifted':
      return {
        ...state,
        bonds: { ...state.bonds, [event.who]: clamp(state.bonds[event.who] + event.delta) },
      }

    case 'trait.shifted':
      return {
        ...state,
        traits: {
          ...state.traits,
          [event.trait]: clamp(state.traits[event.trait] + event.delta),
        },
      }

    case 'flag.raised':
      return { ...state, flags: { ...state.flags, [event.flag]: true } }

    case 'memory.kept':
      // Idempotent on id: replaying a log must not stack the same ticket stub twice.
      return state.memories.some((memory) => memory.id === event.memory.id)
        ? state
        : { ...state, memories: [...state.memories, event.memory] }

    case 'anchor.attended':
      return state.attendedAnchors.includes(event.anchorId)
        ? state
        : {
            ...state,
            attendedAnchors: [...state.attendedAnchors, event.anchorId],
            missedAnchors: state.missedAnchors.filter((id) => id !== event.anchorId),
          }

    case 'anchor.missed':
      return state.attendedAnchors.includes(event.anchorId) || state.missedAnchors.includes(event.anchorId)
        ? state
        : { ...state, missedAnchors: [...state.missedAnchors, event.anchorId] }

    case 'chapter.entered':
      return { ...state, chapter: event.chapter, chapterDone: false }

    case 'chapter.completed':
      return { ...state, chapterDone: true }

    default:
      // An event this build does not know about. Folding it to a no-op is the whole
      // reason the save is a log: a newer chapter cannot corrupt an older reader.
      return state
  }
}

export function fold(identity: PlayerIdentity, year: number, events: readonly LifeEvent[]): LifeState {
  return events.reduce<LifeState>(apply, emptyState(identity, year))
}
