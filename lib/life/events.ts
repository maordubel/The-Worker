import {
  blankRelationship,
  clamp,
  RELATIONSHIP_AXES,
  TRAIT_ROUTE,
  type BondId,
  type CharacterId,
  type FlagId,
  type ItemId,
  type LifeState,
  type LocationId,
  type Memory,
  type PersonalityId,
  type PlayerIdentity,
  type RedBoxItem,
  type RedHeartId,
  type RelationshipAxis,
  type RelationshipMemory,
  type TraitId,
  type WellbeingId,
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
 * It also buys the whole of the systems pass for free. A save written before the Red
 * Heart existed contains `trait.shifted` rows; the reducer that reads them now moves a
 * Red Heart dimension as well. Nothing had to be migrated, because nothing was stored
 * that had to be converted — only things that happened, read by a reducer that now knows
 * more about what they mean.
 *
 * Every event is small, past-tense and self-describing. Nothing here computes; the
 * reducer is the only place a number changes, so there is exactly one story about how
 * a life got the way it is.
 */
export type LifeEvent =
  | { t: 'life.started'; identity: PlayerIdentity; year: number; weekday: number; minute: number; seed?: string }
  | { t: 'clock.advanced'; minutes: number }
  | { t: 'moved'; to: LocationId }
  | { t: 'money.changed'; agorot: number; why: string }
  | { t: 'energy.changed'; delta: number }
  | { t: 'item.gained'; item: ItemId; count?: number }
  | { t: 'item.lost'; item: ItemId; count?: number }
  | { t: 'bond.shifted'; who: BondId; delta: number }
  | { t: 'trait.shifted'; trait: TraitId; delta: number }
  | { t: 'flag.raised'; flag: FlagId }
  | { t: 'flag.set'; flag: FlagId; value: boolean | string | number }
  | { t: 'memory.kept'; memory: Memory }
  | { t: 'anchor.attended'; anchorId: string }
  | { t: 'anchor.missed'; anchorId: string }
  | { t: 'chapter.entered'; chapter: string }
  | { t: 'chapter.completed'; chapter: string }
  // --- version 2 --------------------------------------------------------------------
  | { t: 'rng.seeded'; seed: string }
  | { t: 'rng.consumed'; count: number }
  | { t: 'wellbeing.changed'; key: WellbeingId; delta: number }
  | { t: 'personality.shifted'; key: PersonalityId; delta: number }
  | { t: 'redheart.changed'; key: RedHeartId; delta: number }
  | { t: 'relationship.changed'; who: CharacterId; axis: RelationshipAxis; delta: number }
  | { t: 'relationship.memory_added'; memory: RelationshipMemory }
  | { t: 'opportunity.offered'; id: string }
  | { t: 'opportunity.accepted'; id: string }
  | { t: 'opportunity.missed'; id: string }
  | { t: 'encounter.triggered'; id: string }
  | { t: 'redbox.item_added'; item: RedBoxItem }
  | { t: 'dialogue.choice_made'; conversation: string; choice: string }
  // --- version 3, Stage B ------------------------------------------------------------
  /**
   * ארבע שנים עוברות — the calendar moves, and the life does not start again.
   *
   * Everything that is HIM stays: personality, the Red Heart, every relationship and every
   * memory, the Red Box, the seed. Everything that is the DAY resets: the clock, the
   * weekday, the pockets, the energy, the flags of an afternoon that ended. Age is
   * arithmetic off the identity, as it always was. A save that folds this event is one
   * biography four years on, not two biographies stapled together (brief §52).
   */
  | { t: 'year.entered'; year: number; weekday: number; minute: number }

/** A day is 24×60. The clock wraps rather than running past midnight into nonsense. */
export const MINUTES_IN_DAY = 24 * 60

/**
 * The seed a life gets before anybody has rolled anything.
 *
 * Deterministic on purpose: two folds of the same log must produce the same state, and a
 * test that starts a life must be able to predict it. A real new game overwrites this in
 * its first event (`rng.seeded`), which is what makes two playthroughs differ while
 * keeping each of them replayable.
 */
export const DEFAULT_SEED = 'worker-1986'

export function emptyState(identity: PlayerIdentity, year: number): LifeState {
  return {
    schemaVersion: 2,
    identity,
    year,
    age: year - identity.birthYear,
    weekday: 6,
    minute: 12 * 60 + 35,
    agorot: 0,
    energy: 100,
    resources: { money: 0, energy: 100, availableTime: 0 },
    location: 'prologue',
    wellbeing: {
      happiness: 55,
      stress: 10,
      loneliness: 20,
      belonging: 25,
      exhaustion: 0,
      regret: 0,
    },
    personality: {
      independence: 5,
      courage: 10,
      responsibility: 10,
      reliability: 20,
      empathy: 25,
      streetSmarts: 5,
      curiosity: 5,
      impulsiveness: 30,
      stubbornness: 25,
      sociability: 30,
      riskTolerance: 15,
    },
    redHeart: {
      footballLove: 20,
      basketballLove: 5,
      troubleAffinity: 0,
      professionalFootball: 0,
      community: 10,
      terraceCulture: 5,
      travelDrive: 5,
      historyMemory: 5,
      familyTradition: 30,
      loyaltyReturn: 0,
    },
    bonds: { kobi: 50, rachel: 50, ofir: 0 },
    relationships: {
      kobi: { ...blankRelationship(50), sharedHistory: 60, familiarity: 90, trust: 55 },
      rachel: { ...blankRelationship(50), sharedHistory: 60, familiarity: 90, trust: 60 },
      ofir: { ...blankRelationship(0), familiarity: 45, distance: 20 },
    },
    relationshipMemory: [],
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
    redBox: [],
    opportunities: [],
    encounters: {},
    rng: { seed: DEFAULT_SEED, cursor: 0 },
    attendedAnchors: [],
    missedAnchors: [],
    chapter: 'prologue',
    chapterDone: false,
  }
}

// ---------------------------------------------------------------------------------

function withRelationship(
  state: LifeState,
  who: CharacterId,
  change: (current: ReturnType<typeof blankRelationship>) => ReturnType<typeof blankRelationship>,
): LifeState {
  const current = state.relationships[who] ?? blankRelationship(state.bonds[who] ?? 0)
  const next = change({ ...current })
  for (const axis of RELATIONSHIP_AXES) next[axis] = clamp(next[axis])
  return {
    ...state,
    relationships: { ...state.relationships, [who]: next },
    bonds: { ...state.bonds, [who]: next.bond },
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
      return {
        ...fresh,
        weekday: event.weekday,
        minute: event.minute,
        rng: event.seed ? { seed: event.seed, cursor: 0 } : fresh.rng,
      }
    }

    case 'clock.advanced': {
      const total = state.minute + Math.max(0, Math.round(event.minutes))
      return {
        ...state,
        minute: total % MINUTES_IN_DAY,
        weekday: (state.weekday + Math.floor(total / MINUTES_IN_DAY)) % 7,
      }
    }

    case 'moved':
      // The one place the retired prologue id is folded forward. A save recorded before
      // the timeline was rebased still opens, and opens in the right room.
      return { ...state, location: event.to === 'prologue-1972' ? 'prologue' : event.to }

    case 'money.changed': {
      // Money floors at zero. A child does not carry a debt, and a scene that tries to
      // charge more than the player has has a bug the clamp makes visible in a test.
      const agorot = Math.max(0, state.agorot + Math.round(event.agorot))
      return { ...state, agorot, resources: { ...state.resources, money: agorot } }
    }

    case 'energy.changed': {
      const energy = clamp(state.energy + event.delta)
      return {
        ...state,
        energy,
        resources: { ...state.resources, energy },
        // Running yourself down is the same event as getting tired. One number moves,
        // two systems read it, and nobody has to remember to write both.
        wellbeing:
          event.delta < 0
            ? { ...state.wellbeing, exhaustion: clamp(state.wellbeing.exhaustion - event.delta * 0.6) }
            : state.wellbeing,
      }
    }

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
      // The old surface. It still means what it always meant, and it now also carries
      // the two axes that move with a bond in real life: you know somebody better, and
      // you stand slightly closer to them.
      return withRelationship(state, event.who, (rel) => ({
        ...rel,
        bond: rel.bond + event.delta,
        familiarity: rel.familiarity + Math.abs(event.delta) * 0.4,
        distance: rel.distance - event.delta * 0.3,
      }))

    case 'trait.shifted': {
      const route = TRAIT_ROUTE[event.trait]
      const traits = { ...state.traits, [event.trait]: clamp(state.traits[event.trait] + event.delta) }
      const personality = route.personality
        ? { ...state.personality, [route.personality]: clamp(state.personality[route.personality] + event.delta) }
        : state.personality
      const redHeart = route.redHeart
        ? { ...state.redHeart, [route.redHeart]: clamp(state.redHeart[route.redHeart] + event.delta) }
        : state.redHeart
      return { ...state, traits, personality, redHeart }
    }

    case 'flag.raised':
      return { ...state, flags: { ...state.flags, [event.flag]: true } }

    case 'flag.set':
      return { ...state, flags: { ...state.flags, [event.flag]: event.value } }

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

    case 'year.entered': {
      const kept: Record<string, boolean | string | number> = {}
      // Flags that describe the PERSON rather than the afternoon survive the years.
      for (const [flag, value] of Object.entries(state.flags)) {
        if (
          flag.startsWith('life:') ||
          flag.startsWith('onboard:') ||
          flag.startsWith('cutscene:') ||
          flag.startsWith('prologue:')
        )
          kept[flag] = value
      }
      return {
        ...state,
        year: event.year,
        age: event.year - state.identity.birthYear,
        weekday: event.weekday,
        minute: event.minute,
        energy: 100,
        resources: { ...state.resources, energy: 100, availableTime: 0 },
        agorot: 0,
        inventory: {},
        flags: kept,
        opportunities: [],
        encounters: {},
        wellbeing: { ...state.wellbeing, exhaustion: 0, stress: Math.round(state.wellbeing.stress * 0.5) },
      }
    }

    case 'chapter.completed':
      return { ...state, chapterDone: true }

    // --- version 2 ------------------------------------------------------------------

    case 'rng.seeded':
      return { ...state, rng: { seed: event.seed, cursor: 0 } }

    case 'rng.consumed':
      return { ...state, rng: { ...state.rng, cursor: state.rng.cursor + Math.max(0, event.count) } }

    case 'wellbeing.changed':
      return {
        ...state,
        wellbeing: { ...state.wellbeing, [event.key]: clamp(state.wellbeing[event.key] + event.delta) },
      }

    case 'personality.shifted':
      return {
        ...state,
        personality: { ...state.personality, [event.key]: clamp(state.personality[event.key] + event.delta) },
      }

    case 'redheart.changed':
      return {
        ...state,
        redHeart: { ...state.redHeart, [event.key]: clamp(state.redHeart[event.key] + event.delta) },
      }

    case 'relationship.changed':
      return withRelationship(state, event.who, (rel) => ({
        ...rel,
        [event.axis]: rel[event.axis] + event.delta,
      }))

    case 'relationship.memory_added': {
      const already = state.relationshipMemory.some(
        (entry) => entry.characterId === event.memory.characterId && entry.eventId === event.memory.eventId,
      )
      if (already) return state
      const withMemory = {
        ...state,
        relationshipMemory: [...state.relationshipMemory, event.memory],
      }
      // Anything worth remembering is, by definition, meaningful contact — and a major
      // one leaves a mark on how much history the two of you have.
      return withRelationship(withMemory, event.memory.characterId, (rel) => ({
        ...rel,
        sharedHistory: rel.sharedHistory + (event.memory.significance === 'major' ? 8 : 3),
        lastMeaningfulContact: event.memory.atMinute,
      }))
    }

    case 'opportunity.offered': {
      if (state.opportunities.some((entry) => entry.id === event.id)) return state
      return {
        ...state,
        opportunities: [...state.opportunities, { id: event.id, status: 'open', offeredAt: state.minute }],
      }
    }

    case 'opportunity.accepted':
    case 'opportunity.missed': {
      const status = event.t === 'opportunity.accepted' ? 'taken' : 'missed'
      const known = state.opportunities.some((entry) => entry.id === event.id)
      const opportunities = known
        ? state.opportunities.map((entry) =>
            entry.id === event.id && entry.status === 'open'
              ? { ...entry, status, resolvedAt: state.minute }
              : entry,
          )
        : [...state.opportunities, { id: event.id, status, offeredAt: state.minute, resolvedAt: state.minute }]
      return {
        ...state,
        opportunities: opportunities as LifeState['opportunities'],
        // A missed afternoon is a real feeling and the only place the game keeps it.
        wellbeing:
          status === 'missed' ? { ...state.wellbeing, regret: clamp(state.wellbeing.regret + 4) } : state.wellbeing,
      }
    }

    case 'encounter.triggered':
      return { ...state, encounters: { ...state.encounters, [event.id]: state.minute } }

    case 'redbox.item_added':
      return state.redBox.some((entry) => entry.id === event.item.id)
        ? state
        : { ...state, redBox: [...state.redBox, event.item] }

    case 'dialogue.choice_made':
      // Recorded so the log reads as a biography rather than a diff, and so telemetry
      // and the second-playthrough test can see what was actually chosen. It changes
      // nothing on its own — every consequence is its own event.
      return state

    default:
      // An event this build does not know about. Folding it to a no-op is the whole
      // reason the save is a log: a newer chapter cannot corrupt an older reader.
      return state
  }
}

export function fold(identity: PlayerIdentity, year: number, events: readonly LifeEvent[]): LifeState {
  return events.reduce<LifeState>(apply, emptyState(identity, year))
}
