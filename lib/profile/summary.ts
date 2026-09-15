'use client'

/**
 * מה שנשמר במכשיר הזה — everything the app remembers about you, read in one place.
 *
 * The four stores that existed before the profile did — the ballot, the kit collection,
 * the member book and the LIFE save — are not migrated into it and are not going to be.
 * Each one is the right shape for what it holds, two of them have interfaces built for
 * the day a table lands behind them (`BallotStore.countable`, `CollectionStore.remote`),
 * and a migration that loses a member number loses the one thing on the card that
 * cannot be re-earned.
 *
 * What was missing is anybody who READS all of them at once. That is this file: the
 * personal area asks it one question — *what has this person actually got here?* — and
 * gets one answer, so the screen is a single truthful list rather than five widgets
 * that each know a fifth of it.
 *
 * **The LIFE save is read by key rather than through `lib/life/save.ts`.** That module
 * pulls in the engine's types, and the personal area does not want a dependency on the
 * game runtime to print one line about it. What it needs is the version, the year and
 * whether the file is there at all, and those are three fields off the front of the JSON.
 */

const LIFE_KEY = 'the-worker:life'
const KIT_KEY = 'worker.kits.v1'
const BALLOT_KEY = 'worker.ballot.v1'

export type DeviceSummary = {
  /** shirts assembled in gate 4 */
  kits: number
  /** poll questions answered */
  ballot: number
  /** the LIFE save, if there is one */
  life: { year: number | null; events: number } | null
}

function readJson(key: string): unknown {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    // Blocked storage, private mode, corrupt JSON. A device that cannot be read is a
    // device with nothing on it — never a crash on the one screen that is about them.
    return null
  }
}

function countKeys(value: unknown): number {
  return typeof value === 'object' && value !== null ? Object.keys(value).length : 0
}

export function readDevice(): DeviceSummary {
  const life = readJson(LIFE_KEY) as { year?: unknown; events?: unknown } | null
  return {
    kits: countKeys(readJson(KIT_KEY)),
    ballot: countKeys(readJson(BALLOT_KEY)),
    life:
      life === null
        ? null
        : {
            year: typeof life.year === 'number' ? life.year : null,
            events: Array.isArray(life.events) ? life.events.length : 0,
          },
  }
}

/** Wipe everything this device holds. Only ever called behind an explicit confirm. */
export function forgetDevice(): void {
  if (typeof window === 'undefined') return
  for (const key of [
    'worker.profile.v1',
    KIT_KEY,
    BALLOT_KEY,
    'worker.member.v1',
    LIFE_KEY,
  ]) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // nothing to do, and nothing worth breaking the page over
    }
  }
}
