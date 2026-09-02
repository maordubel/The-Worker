import { apply, emptyState, type LifeEvent } from './events'
import { lifeStore, SAVE_VERSION, type SaveFile } from './save'
import type { BondId, ItemId, LifeState, PlayerIdentity, TraitId } from './types'

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

  bond(who: BondId): number {
    return this.state.bonds[who]
  }

  trait(trait: TraitId): number {
    return this.state.traits[trait]
  }

  flag(name: string): boolean {
    return this.state.flags[name] === true
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

/** Open the saved life, or start one. The caller never touches the store directly. */
export async function loadLife(fallback: PlayerIdentity, year: number): Promise<LifeEngine> {
  const file = await lifeStore.read()
  if (!file) return new LifeEngine(fallback, year)
  return new LifeEngine(file.identity, file.year, file.events)
}
