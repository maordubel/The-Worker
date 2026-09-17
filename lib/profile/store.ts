/**
 * המנוי — one record per device, and the thing every gate writes to.
 *
 * Before this existed the app remembered four unrelated things in four unrelated
 * places: the poll ballot (`worker.ballot.v1`), the kit collection (`worker.kits.v1`),
 * the member punches (`worker.member.v1`) and the LIFE save. Nothing knew that the
 * person who built a kit was the person who played the trivia, so there was no such
 * thing as "your" anything — and therefore no reason on earth to sign up for an
 * account. A personal area that holds nothing is not a reason to register.
 *
 * So this is the spine: **one record that every gate reports into**, holding what you
 * played, when, how well, and where you are in each gate's deck. The older records are
 * left exactly where they are and read alongside it (see `lib/profile/summary.ts`) —
 * this file adds, it does not migrate, because a migration that loses a member number
 * loses the only thing on the card that cannot be re-earned.
 *
 * Two hard rules carried over from `lib/game/member.ts`, and they are product rules,
 * not storage ones:
 *   · **Nothing here can be bought.** Every number is something you did.
 *   · **A book that cannot be read is a new book, never a crash.** Private mode,
 *     blocked storage and corrupted JSON all resolve to an empty profile.
 */

const KEY = 'worker.profile.v1'

/** How many days of history the streak grid prints. Matches the member card's quarter. */
export const HISTORY_DAYS = 90

export type GateStat = {
  /** how many rounds finished at this gate */
  plays: number
  /** best score. A gate with no score (the wings) leaves it 0 and prints plays only. */
  best: number
  /** best as a fraction of what was askable, 0–1. The only fair cross-gate comparison. */
  bestRate: number
  /** ISO date of the last round */
  lastOn: string
  /** total right answers, across every round — the number the card leads with */
  correct: number
  /** total questions asked */
  asked: number
}

/** Where this device is in a gate's deck. See `lib/rotation/deck.ts`. */
export type Rotation = { seed: number; cursor: number }

export type Profile = {
  v: 1
  /** ISO date the device first played anything */
  since: string
  /** ISO dates, one per day with at least one finished round. Never erased. */
  days: string[]
  gates: Record<string, GateStat>
  rotation: Record<string, Rotation>
  /**
   * Things collected rather than scored — the Ussishkin cards a reader has turned
   * over, and anything else that is a set to complete. Stored as ids, not counts, so
   * completing the set twice does not read as ninety cards out of forty-five.
   */
  collections: Record<string, string[]>
  /** how many times a result was shared from this device */
  shares: number
  /** how many rounds were opened from somebody else's challenge link */
  duelsTaken: number
}

export function emptyProfile(): Profile {
  return {
    v: 1,
    since: today(),
    days: [],
    gates: {},
    rotation: {},
    collections: {},
    shares: 0,
    duelsTaken: 0,
  }
}

export function emptyStat(): GateStat {
  return { plays: 0, best: 0, bestRate: 0, lastOn: '', correct: 0, asked: 0 }
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function readProfile(): Profile {
  if (typeof window === 'undefined') return emptyProfile()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptyProfile()
    const parsed = JSON.parse(raw) as Partial<Profile>
    return {
      ...emptyProfile(),
      ...parsed,
      days: Array.isArray(parsed.days) ? parsed.days : [],
      gates: parsed.gates ?? {},
      rotation: parsed.rotation ?? {},
      collections: parsed.collections ?? {},
    }
  } catch {
    return emptyProfile()
  }
}

export function writeProfile(profile: Profile): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    // private mode, blocked storage — the app keeps working, the profile just does not persist
  }
}

/** Read, change, write. Every mutation below goes through here so nothing half-writes. */
function update(change: (profile: Profile) => Profile): Profile {
  const next = change(readProfile())
  writeProfile(next)
  return next
}

export type RunResult = {
  gate: string
  /** points, where the gate scores. 0 where it does not. */
  score?: number
  correct?: number
  asked?: number
}

/**
 * Report a finished round.
 *
 * Called from the result screen of every gate — which is the only moment the app can
 * honestly say you played something, as opposed to opened it.
 */
export function recordRun(result: RunResult): Profile {
  const date = today()
  return update((profile) => {
    const prior = profile.gates[result.gate] ?? emptyStat()
    const asked = result.asked ?? 0
    const correct = result.correct ?? 0
    const rate = asked > 0 ? correct / asked : 0
    return {
      ...profile,
      days: profile.days.includes(date) ? profile.days : [...profile.days, date],
      gates: {
        ...profile.gates,
        [result.gate]: {
          plays: prior.plays + 1,
          best: Math.max(prior.best, result.score ?? 0),
          bestRate: Math.max(prior.bestRate, rate),
          lastOn: date,
          correct: prior.correct + correct,
          asked: prior.asked + asked,
        },
      },
    }
  })
}

/**
 * מעשה — a wing has no round to finish, and it still has to be able to light its plate.
 *
 * `recordRun` exists because the only moment the app can honestly say you PLAYED
 * something is the moment a round ended. Four gates have no rounds: gate 1 is free play
 * over the whole roster, gate 5 is a collection, gate 7 is a ballot, and until 17.9.2026
 * none of the three could ever be recorded — so `stillToDo()` nagged about gates that
 * could not be cleared and the wall printed 7 of 11 for a device that had done everything.
 *
 * A deed is the wing's equivalent of a finished round, and it is deliberately the same
 * shape: something was MADE — an eleven saved, a shirt designed, a slip sealed. It
 * carries no score and no denominator, so a wing can never climb the correct/asked
 * figures that belong to the quizzes.
 */
export function recordDeed(gate: string): Profile {
  return recordRun({ gate })
}

/**
 * Add to a collection. Idempotent — the same card twice is still one card, which is
 * what makes "45 מתוך 45" a sentence about the archive rather than about tapping.
 */
export function collect(set: string, ids: readonly string[]): Profile {
  return update((profile) => {
    const have = new Set(profile.collections[set] ?? [])
    for (const id of ids) have.add(id)
    return { ...profile, collections: { ...profile.collections, [set]: [...have] } }
  })
}

export function collected(profile: Profile, set: string): string[] {
  return profile.collections[set] ?? []
}

export function recordShare(): void {
  update((profile) => ({ ...profile, shares: profile.shares + 1 }))
}

export function recordDuelTaken(): void {
  update((profile) => ({ ...profile, duelsTaken: profile.duelsTaken + 1 }))
}

/** Where the device is in a gate's deck, or the start of a brand-new deck. */
export function rotationFor(gate: string, mint: () => number): Rotation {
  const profile = readProfile()
  const found = profile.rotation[gate]
  if (found && Number.isFinite(found.seed) && found.seed > 0) return found
  const fresh = { seed: mint(), cursor: 0 }
  writeProfile({ ...profile, rotation: { ...profile.rotation, [gate]: fresh } })
  return fresh
}

/** Walk one slice forward. Called when a round is entered, not when it ends. */
export function advanceRotation(gate: string, mint: () => number): Rotation {
  const current = rotationFor(gate, mint)
  const next = { seed: current.seed, cursor: current.cursor + 1 }
  update((profile) => ({ ...profile, rotation: { ...profile.rotation, [gate]: next } }))
  return next
}

/** Consecutive days up to and including today. Yesterday still counts as alive. */
export function streak(profile: Profile, from: Date = new Date()): number {
  const days = new Set(profile.days)
  const cursor = new Date(from)
  // A streak survives until the end of the next day: somebody who played last night and
  // opens the app at nine in the morning has not "broken" anything.
  if (!days.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (days.has(iso(cursor))) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

/** The last ninety days, newest last — the grid the card prints. */
export function historyGrid(profile: Profile, from: Date = new Date()): boolean[] {
  const days = new Set(profile.days)
  const out: boolean[] = []
  for (let back = HISTORY_DAYS - 1; back >= 0; back -= 1) {
    const day = new Date(from)
    day.setDate(from.getDate() - back)
    out.push(days.has(iso(day)))
  }
  return out
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function totalPlays(profile: Profile): number {
  return Object.values(profile.gates).reduce((sum, stat) => sum + stat.plays, 0)
}

export function totalCorrect(profile: Profile): number {
  return Object.values(profile.gates).reduce((sum, stat) => sum + stat.correct, 0)
}

export function gatesTouched(profile: Profile): number {
  return Object.values(profile.gates).filter((stat) => stat.plays > 0).length
}
