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
 *
 * **Everything after `picks` is optional, and that is the upgrade path** (19.9.2026).
 * The sheet grew a version per slot, an armband, a twelfth man, a last man cut and a
 * shortlist; a sheet written before any of them existed reads back as a sheet without
 * them rather than as a sheet that fails to parse. Nothing is versioned and nothing is
 * migrated, because an absent field already means the only thing it could mean.
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
  /**
   * slot id → the version of that man the sheet was built around, as `lib/xi/board.ts`
   * spells the id (`1979-1988`). Absent for the men who have only one, which is most of
   * them — an entry here would be a stored fact the archive never stated.
   */
  versions?: Record<string, string>
  /** the slot wearing the armband, or absent */
  captain?: string
  /** roster slugs — the twelfth man and the last man cut, each one a real decision */
  twelfth?: string
  cut?: string
  /** roster slugs the supporter is still arguing with himself about */
  shortlist?: string[]
  /** ISO date it was last saved */
  savedOn: string
}

export type XIBook = Partial<Record<XITab, SavedXI>>

/** Everything a sheet holds except the date the device stamps on it. */
export type XISheet = Omit<SavedXI, 'savedOn'>

export interface XIStore {
  /** true when this store can see other people's sheets. Local cannot. */
  readonly remote: boolean
  read(): Promise<XIBook>
  save(tab: XITab, sheet: XISheet): Promise<void>
  clear(): Promise<void>
}

function isTab(value: string): value is XITab {
  return value === 'best' || value === 'worst'
}

/** A stored map of string→string, with anything that is not one dropped. */
function stringMap(value: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (typeof value !== 'object' || value === null) return out
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'string' && entry !== '') out[key] = entry
  }
  return out
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
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
        // A sheet written before the versions, the armband and the bench existed reads
        // back as a sheet with none of them, not as a sheet that fails to read. That is
        // the whole reason every field after `picks` is optional.
        out[tab] = {
          formation: sheet.formation,
          picks: stringMap(sheet.picks),
          versions: stringMap(sheet.versions),
          captain: stringOrUndefined(sheet.captain),
          twelfth: stringOrUndefined(sheet.twelfth),
          cut: stringOrUndefined(sheet.cut),
          shortlist: Array.isArray(sheet.shortlist)
            ? sheet.shortlist.filter((slug): slug is string => typeof slug === 'string')
            : [],
          savedOn: sheet.savedOn ?? '',
        }
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
  async save(tab: XITab, sheet: XISheet): Promise<void> {
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
): {
  formation: Formation
  picks: Record<string, string>
  versions: Record<string, string>
  captain: string | null
  twelfth: string | null
  cut: string | null
  shortlist: string[]
} | null {
  if (!sheet) return null
  const formation = formations.find((option) => option.name === sheet.formation)
  if (!formation) return null
  const slots = new Set(formation.slots.map((slot) => slot.slotId))
  const picks: Record<string, string> = {}
  for (const [slot, slug] of Object.entries(sheet.picks)) if (slots.has(slot)) picks[slot] = slug
  // A version is a fact about a SLOT's occupant, so it goes when the occupant does: a
  // stored `1990-1992` hanging on an empty slot would dress the next man picked there in
  // a spell that belongs to somebody else.
  const versions: Record<string, string> = {}
  for (const [slot, id] of Object.entries(sheet.versions ?? {})) {
    if (picks[slot] !== undefined) versions[slot] = id
  }
  // The armband belongs to a slot that still has a man in it. A captain of an empty
  // shirt is a C drawn on nothing.
  const captain = sheet.captain !== undefined && picks[sheet.captain] !== undefined
    ? sheet.captain
    : null
  return {
    formation,
    picks,
    versions,
    captain,
    twelfth: sheet.twelfth ?? null,
    cut: sheet.cut ?? null,
    shortlist: sheet.shortlist ?? [],
  }
}
