'use client'

/**
 * האוסף — which shirts you have actually assembled.
 *
 * This is the seam between gate 4 and gate 5, and it is the reason the two are worth
 * having as separate gates at all. Gate 4 is the act — five parts, one shirt, one
 * verdict. Gate 5 is what the act leaves behind. Without a record connecting them, the
 * kit game is a score that evaporates and the archive is a list you scroll.
 *
 * **A shirt enters the collection when it is assembled, not when it is seen.** A locked
 * card in the grid is not a paywall or a tease — it is a shirt of the club's that you
 * have not yet been able to build from memory, which is exactly the thing the mode is
 * about. Maor's mockup draws them as dashed outlines and that reading is the right one.
 *
 * Storage follows `lib/polls/store.ts` exactly: an async interface with one local
 * implementation, so the day a life or an account exists this becomes one line. The
 * screen never names a storage API — `tests/kit.test.ts` asserts it.
 */

const KEY = 'worker.kits.v1'

/** One assembled shirt. `best` is the highest score this shirt has ever been built for. */
export type BuiltKit = {
  seasonLabel: string
  variant: 'home' | 'away' | 'third'
  /** ISO date it was first completed */
  firstBuiltOn: string
  /** how many of the five parts were right, best ever */
  bestParts: number
  /** how many times it has been assembled */
  times: number
}

export type Collection = Record<string, BuiltKit>

export function kitKey(seasonLabel: string, variant: string): string {
  return `${seasonLabel}|${variant}`
}

export interface CollectionStore {
  /** true when this store can see other people's collections. Local cannot. */
  readonly remote: boolean
  read(): Promise<Collection>
  record(entry: { seasonLabel: string; variant: BuiltKit['variant']; parts: number }): Promise<void>
  clear(): Promise<void>
}

export class LocalCollectionStore implements CollectionStore {
  readonly remote = false

  async read(): Promise<Collection> {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (!raw) return {}
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) return {}
      const out: Collection = {}
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        const row = value as Partial<BuiltKit>
        if (typeof row?.seasonLabel !== 'string') continue
        out[key] = {
          seasonLabel: row.seasonLabel,
          variant: (row.variant ?? 'home') as BuiltKit['variant'],
          firstBuiltOn: row.firstBuiltOn ?? '',
          bestParts: typeof row.bestParts === 'number' ? row.bestParts : 0,
          times: typeof row.times === 'number' ? row.times : 1,
        }
      }
      return out
    } catch {
      return {}
    }
  }

  /**
   * A shirt is recorded on every assembly, at any score.
   *
   * Recording only perfect builds looked tidier and is wrong: a shirt you got four
   * parts of is a shirt you have handled, and the collection's job is to remember what
   * you have been through rather than to certify what you got right. `bestParts` keeps
   * the distinction without hiding the attempt.
   */
  async record(entry: {
    seasonLabel: string
    variant: BuiltKit['variant']
    parts: number
  }): Promise<void> {
    try {
      const current = await this.read()
      const key = kitKey(entry.seasonLabel, entry.variant)
      const existing = current[key]
      const next: BuiltKit = existing
        ? {
            ...existing,
            bestParts: Math.max(existing.bestParts, entry.parts),
            times: existing.times + 1,
          }
        : {
            seasonLabel: entry.seasonLabel,
            variant: entry.variant,
            firstBuiltOn: new Date().toISOString().slice(0, 10),
            bestParts: entry.parts,
            times: 1,
          }
      window.localStorage.setItem(KEY, JSON.stringify({ ...current, [key]: next }))
    } catch {
      // a collection that cannot be written is a smaller problem than a throw mid-run
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

/** The store this build collects into. One line changes when an account exists. */
export function activeCollection(): CollectionStore {
  return new LocalCollectionStore()
}
