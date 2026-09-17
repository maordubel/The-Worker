'use client'

/**
 * הגיליון — the elevens this device has put its name to.
 *
 * Gate 1 kept nothing until 17.9.2026. You argued with yourself for ten minutes, picked
 * eleven men out of six hundred and sixty, shared the card — and a refresh emptied the
 * pitch. `recordDeed('/xi')` lit the plate on the wall and then had nothing to point at,
 * which is the shape of a gate that says it remembers you and does not.
 *
 * Shaped exactly like `lib/kit/collection.ts` and `lib/polls/store.ts`, for the reason
 * stated there: an async interface with one local implementation, so the day an account
 * exists this is one line and not a rewrite of the screen. The screen never names a
 * storage API.
 *
 * **Slugs are stored, never names.** A saved sheet is a list of eleven men, and the man
 * is the roster row; storing his name would freeze a spelling the archive is still
 * correcting, and storing anything richer would make this a second copy of the roster.
 * A slug that no longer exists is dropped on read — a retired row is not a crash.
 */

import type { Formation } from '@/lib/game/lineup'

const KEY = 'worker.xi.v1'

/**
 * Two sheets, and the second one is not a ranking.
 *
 * `best` is הרכב כל הזמנים. `worst` is ההרכב הגרוע בכל הזמנים — **the supporter's own
 * choice, never the app's**. See `app/xi/XIBuilder.tsx` for why that distinction is
 * load-bearing rather than a nicety.
 */
export type XITab = 'best' | 'worst'

export const XI_TABS: readonly XITab[] = ['best', 'worst']

export type SavedXI = {
  /** the formation's name, as `lib/game/lineup.ts` writes it */
  formation: string
  /** slot id → roster slug */
  picks: Record<string, string>
  /** ISO date it was last saved */
  savedOn: string
}

export type XIBook = Partial<Record<XITab, SavedXI>>

export interface XIStore {
  /** true when this store can see other people's sheets. Local cannot. */
  readonly remote: boolean
  read(): Promise<XIBook>
  save(tab: XITab, sheet: { formation: string; picks: Record<string, string> }): Promise<void>
  clear(): Promise<void>
}

function isTab(value: string): value is XITab {
  return value === 'best' || value === 'worst'
}

export class LocalXIStore implements XIStore {
  readonly remote = false

  async read(): Promise<XIBook> {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (!raw) return {}
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) return {}
      const out: XIBook = {}
      for (const [tab, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (!isTab(tab) || typeof value !== 'object' || value === null) continue
        const sheet = value as Partial<SavedXI>
        if (typeof sheet.formation !== 'string' || typeof sheet.picks !== 'object') continue
        const picks: Record<string, string> = {}
        for (const [slot, slug] of Object.entries(sheet.picks ?? {})) {
          if (typeof slug === 'string' && slug !== '') picks[slot] = slug
        }
        out[tab] = { formation: sheet.formation, picks, savedOn: sheet.savedOn ?? '' }
      }
      return out
    } catch {
      // private mode, blocked storage, corrupt JSON. An unreadable sheet is an empty
      // pitch, never a throw on the screen the whole gate is.
      return {}
    }
  }

  /**
   * Saved on every change, not on a button.
   *
   * There is no "save" in this gate and there should not be: the eleven is the thing
   * you are making, so a sheet that is only kept if you remember to press something is
   * a sheet that is usually lost. An empty pitch saves as an empty pitch — clearing a
   * slot is a decision too.
   */
  async save(
    tab: XITab,
    sheet: { formation: string; picks: Record<string, string> },
  ): Promise<void> {
    try {
      const current = await this.read()
      const next: XIBook = {
        ...current,
        [tab]: { ...sheet, savedOn: new Date().toISOString().slice(0, 10) },
      }
      window.localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // a sheet that cannot be written is a smaller problem than a throw mid-pick
    }
  }

  async clear(): Promise<void> {
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      // nothing to do
    }
  }
}

/** The store this build saves into. One line changes when an account exists. */
export function activeXI(): XIStore {
  return new LocalXIStore()
}

/**
 * Rebuild a saved sheet against the formation it was saved in.
 *
 * A formation that no longer exists, or a slot that moved, drops the picks that no
 * longer have a home rather than putting a man in the wrong place: a defender who wakes
 * up on the wing because a formation was renamed is worse than an empty slot.
 */
export function restore(
  sheet: SavedXI | undefined,
  formations: readonly Formation[],
): { formation: Formation; picks: Record<string, string> } | null {
  if (!sheet) return null
  const formation = formations.find((option) => option.name === sheet.formation)
  if (!formation) return null
  const slots = new Set(formation.slots.map((slot) => slot.slotId))
  const picks: Record<string, string> = {}
  for (const [slot, slug] of Object.entries(sheet.picks)) if (slots.has(slot)) picks[slot] = slug
  return { formation, picks }
}
