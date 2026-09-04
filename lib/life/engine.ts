import { apply, emptyState, type LifeEvent } from './events'
import { freshSeed } from './rng'
import { lifeStore, SAVE_VERSION, type SaveFile } from './save'
import {
  relationshipOf,
  type CharacterId,
  type ItemId,
  type LifeState,
  type PersonalityId,
  type PlayerIdentity,
  type RedHeartId,
  type RelationshipAxis,
  type RelationshipMemory,
  type TraitId,
} from './types'

/**
 * מנוע החיים — what is true, and who is allowed to change it.
 *
 * The Phaser runtime owns pixels. This owns the life. A scene never writes a number:
 * it dispatches an event and re-reads the state, which is what stops the same rule
 * being implemented twice, differently, in a scene and in a minigame.
 *
 * It is a plain class with a subscribe list rather than a store library, because the
 * consumers are one React shell and a handful of scenes, and a dependency to notify
 * three listeners is a dependency to maintain forever.
 *
 * **Autosave is debounced, not per-event.** A walking player emits a clock event every
 * frame's worth of minutes; writing `localStorage` at that rate janks the game loop on
 * a phone. Saving on a 2s trailing edge — and immediately on anything structural —
 * keeps the save honest without paying for it in frames.
 */

export type LifeListener = (state: LifeState) => void

const AUTOSAVE_MS = 2000

/** Events worth writing the disk for at once, rather than on the trailing edge. */
const IMMEDIATE: ReadonlySet<LifeEvent['t']> = new Set([
  'life.started',
  'moved',
  'memory.kept',
  'anchor.attended',
  'anchor.missed',
  'chapter.entered',
  'chapter.completed',
  'item.gained',
  'redbox.item_added',
  'opportunity.accepted',
  'opportunity.missed',
  'relationship.memory_added',
  'rng.seeded',
])

export class LifeEngine {
  private events: LifeEvent[]
  private listeners = new Set<LifeListener>()
  private timer: ReturnType<typeof setTimeout> | null = null
  private dirty = false

  state: LifeState

  constructor(
    readonly identity: PlayerIdentity,
    readonly year: number,
    events: readonly LifeEvent[] = [],
  ) {
    this.events = [...events]
    this.state = this.events.reduce<LifeState>(apply, emptyState(identity, year))
  }

  /** The log itself — the thing that gets saved, and one day inserted into a table. */
  log(): readonly LifeEvent[] {
    return this.events
  }

  dispatch(...events: LifeEvent[]): LifeState {
    let immediate = false
    for (const event of events) {
      this.events.push(event)
      this.state = apply(this.state, event)
      if (IMMEDIATE.has(event.t)) immediate = true
    }
    for (const listener of this.listeners) listener(this.state)
    this.markDirty(immediate)
    return this.state
  }

  subscribe(listener: LifeListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // ---- selectors the runtime asks, so a scene never re-derives a rule -------------

  has(item: ItemId, count = 1): boolean {
    return (this.state.inventory[item] ?? 0) >= count
  }

  canAfford(agorot: number): boolean {
    return this.state.agorot >= agorot
  }

  bond(who: CharacterId): number {
    return this.state.bonds[who] ?? 0
  }

  relationship(who: CharacterId, axis: RelationshipAxis): number {
    return relationshipOf(this.state, who)[axis]
  }

  trait(trait: TraitId): number {
    return this.state.traits[trait]
  }

  personality(key: PersonalityId): number {
    return this.state.personality[key]
  }

  redHeart(key: RedHeartId): number {
    return this.state.redHeart[key]
  }

  flag(name: string): boolean {
    return this.state.flags[name] === true
  }

  /**
   * מישהו יזכור את זה — the one call that writes another person's memory.
   *
   * Everything downstream of it (what Kobi says on the terrace, whether Ofir waits for
   * you at the gate) reads the same list, which is the whole point: NPC memory is one
   * queryable structure, not scene flags scattered through a Phaser file.
   */
  remember(who: CharacterId, eventId: string, significance: RelationshipMemory['significance'] = 'notable') {
    this.dispatch({
      t: 'relationship.memory_added',
      memory: {
        characterId: who,
        eventId,
        significance,
        year: this.state.year,
        atMinute: this.state.minute,
      },
    })
  }

  // ---- checkpoints ---------------------------------------------------------------

  /**
   * להתחיל את היום מחדש — the log cut back to the moment the chapter began.
   *
   * There is no separate checkpoint store, because the log IS the checkpoint store:
   * `chapter.entered` is written once at the top of every chapter, and everything after
   * the last one is "today". Cutting there keeps the identity, the seed, the prologue and
   * every earlier chapter exactly as they were, which is what makes the restarted day the
   * same day with the same Pogi rather than a new life. Returns false when there is no
   * chapter to return to — the caller must not pretend otherwise.
   */
  restartDay(): boolean {
    let at = -1
    for (let i = this.events.length - 1; i >= 0; i -= 1) {
      if (this.events[i]?.t === 'chapter.entered') {
        at = i
        break
      }
    }
    if (at < 0) return false
    this.events = this.events.slice(0, at + 1)
    this.state = this.events.reduce<LifeState>(apply, emptyState(this.identity, this.year))
    for (const listener of this.listeners) listener(this.state)
    this.markDirty(true)
    return true
  }

  // ---- persistence ---------------------------------------------------------------

  private markDirty(immediate: boolean) {
    this.dirty = true
    if (immediate) {
      void this.save()
      return
    }
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = null
      void this.save()
    }, AUTOSAVE_MS)
  }

  async save(): Promise<boolean> {
    if (!this.dirty) return true
    this.dirty = false
    const file: SaveFile = {
      version: SAVE_VERSION,
      identity: this.identity,
      year: this.year,
      events: this.events,
      savedAt: new Date().toISOString(),
    }
    return lifeStore.write(file)
  }

  destroy() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.listeners.clear()
  }
}

/**
 * Open the saved life, or start one. The caller never touches the store directly.
 *
 * A brand new life gets its seed here, as the first row in its own log — which is the
 * only place in the game `Math.random` is allowed to be called. From that moment the
 * whole playthrough is reproducible from the save alone, and the second playthrough is
 * different because it is a different seed rather than because anything is unpredictable.
 */
export async function loadLife(fallback: PlayerIdentity, year: number): Promise<LifeEngine> {
  const file = await lifeStore.read()
  if (!file) {
    const engine = new LifeEngine(fallback, year)
    engine.dispatch({ t: 'rng.seeded', seed: freshSeed(year) })
    return engine
  }
  return new LifeEngine(file.identity, file.year, file.events)
}
