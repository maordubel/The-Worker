import type { LifeEvent } from './events'
import type { PlayerIdentity } from './types'

/**
 * השמירה — the seam, and the only file that knows where a life is kept.
 *
 * Shaped like `lib/polls/store.ts` on purpose: an async interface with a local
 * implementation behind it, so the screen never names a storage API and the day the
 * table lands in Supabase is the day this file changes and nothing else does.
 *
 * What is written is the EVENT LOG plus the identity needed to fold it. Not the state.
 * A snapshot would have to be migrated field by field; a log is re-read by whatever
 * reducer is current, which is how a save survives a chapter being rewritten.
 *
 * Quota, private mode and a browser with storage switched off all throw here. A life
 * that cannot be saved must still be playable — every write is guarded and a failure
 * is reported, never thrown at the game loop.
 */

const KEY = 'the-worker:life'
export const SAVE_VERSION = 1

export type SaveFile = {
  version: number
  identity: PlayerIdentity
  year: number
  events: LifeEvent[]
  savedAt: string
}

export type LifeStore = {
  read(): Promise<SaveFile | null>
  write(file: SaveFile): Promise<boolean>
  clear(): Promise<void>
  /** false in a server render, a private window with storage off, or a full quota */
  usable(): boolean
}

function browserStore(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    const probe = '__life__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * A file from a future version folds fine (unknown events are no-ops) but a file from a
 * version this build has never heard of is not something to guess at. Older versions get
 * a migration branch here; today there is one version, so the check is an equality and
 * the branch is a comment rather than dead code pretending to be a plan.
 */
function migrate(raw: unknown): SaveFile | null {
  if (!raw || typeof raw !== 'object') return null
  const file = raw as Partial<SaveFile>
  if (typeof file.version !== 'number' || file.version > SAVE_VERSION) return null
  if (!Array.isArray(file.events) || !file.identity || typeof file.year !== 'number') return null
  return {
    version: SAVE_VERSION,
    identity: file.identity,
    year: file.year,
    events: file.events as LifeEvent[],
    savedAt: typeof file.savedAt === 'string' ? file.savedAt : new Date().toISOString(),
  }
}

export const lifeStore: LifeStore = {
  async read() {
    const store = browserStore()
    if (!store) return null
    try {
      const raw = store.getItem(KEY)
      return raw ? migrate(JSON.parse(raw)) : null
    } catch {
      return null
    }
  },

  async write(file) {
    const store = browserStore()
    if (!store) return false
    try {
      store.setItem(KEY, JSON.stringify(file))
      return true
    } catch {
      return false
    }
  },

  async clear() {
    const store = browserStore()
    if (!store) return
    try {
      store.removeItem(KEY)
    } catch {
      /* a life that cannot be deleted is still a life that can be played */
    }
  },

  usable() {
    return browserStore() !== null
  },
}
