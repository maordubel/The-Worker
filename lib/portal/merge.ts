/**
 * המיזוג — what happens when the same person arrives from two devices.
 *
 * This is the whole of the "exact synchronisation" Maor asked for, and it is a pure
 * function on purpose: no `window`, no Supabase client, no clock. Every decision it
 * makes is the kind that is impossible to check by playing the app — you would need two
 * phones, two evenings and a memory of which one had the higher streak — so it is the
 * one part of the portal that is settled in a test instead of in a screenshot.
 *
 * **The device stays authoritative.** Offline, signed out, blocked storage: the profile
 * in `localStorage` is the profile. Signing in does not hand the card over to the server;
 * it merges the two and writes the result back to BOTH sides. Nothing is ever replaced
 * wholesale, in either direction, because both directions have been wrong in this app's
 * short history — a server that overwrites loses the evening you just played, a device
 * that overwrites loses the other phone entirely.
 *
 * ---------------------------------------------------------------------------
 * The three kinds of field, and why they merge differently
 * ---------------------------------------------------------------------------
 *
 *  1. **Counters take `max()`, never `sum()`.** `plays`, `correct`, `asked`, `best`,
 *     `bestRate`, `shares`, `duelsTaken`. Summing looks obviously right and is the one
 *     thing that cannot be allowed: a sync is not a one-off event, it runs every time
 *     the person opens the app, and summing two totals that each already contain the
 *     other doubles the card on every visit. `max()` cannot invent — it says "at least
 *     this many", which is a true sentence after any number of syncs in any order.
 *     What `max()` does instead is UNDERCOUNT: forty rounds on the phone and thirty on
 *     the laptop merge to forty, not seventy. That is the honest failure of the two, and
 *     it is why `gate_run` stores a ROW per round with an idempotency key — the exact
 *     total is recoverable by counting rows, and no arithmetic here has to guess at it.
 *
 *  2. **Sets take a union.** `days` and `collections` are sets of ids, not counts, so
 *     merging them is exact rather than approximate: two devices that played on the same
 *     day contribute one day, and the Ussishkin card you turned over on the laptop is in
 *     the collection on the phone. This is the same reason `lib/profile/store.ts` stores
 *     `days` as dates and `collections` as ids in the first place — "completing the set
 *     twice does not read as ninety cards out of forty-five".
 *
 *  3. **Identity is never overwritten. Ever.** `member_no` and `since` are the two
 *     fields a newer device can only damage:
 *
 *     · **`member_no`** is the file number on the card, and `lib/game/member.ts` says the
 *       only thing about it that matters — *nothing here can be bought*, and a number
 *       cannot be re-earned. A phone that opens the app for the first time mints itself a
 *       fresh `TIK-0417`; if that were allowed to travel up to an account that already
 *       has one, the person would lose the number they have had since the beginning, in
 *       exchange for one they got by installing a browser. So: once either side has one,
 *       that one wins, and the SERVER's wins a tie, because the server's is the one every
 *       other device has already seen.
 *
 *     · **`since`** takes the EARLIEST of the two, which is the case a `max()` merge gets
 *       exactly backwards. It is not a counter and it is not a "latest wins" field: it is
 *       the day this person started, and a new laptop signing in today carries today's
 *       date. Taking the later of the two would quietly reset a card that began a year
 *       ago every time somebody opened the app somewhere new. The database enforces the
 *       same rule in a trigger (`app_profile_keep_identity`) rather than trusting this
 *       file, because the next person to write a sync path will not have read it.
 */

import { emptyProfile, emptyStat, type GateStat, type Profile, type Rotation } from '@/lib/profile/store'

/**
 * The two fields that live on `app_profile` rather than in the device's `Profile`.
 * Kept beside it here, and not folded into it, because they are the fields with the
 * different merge rule — putting them in the same record as the counters is how somebody
 * ends up running `Math.max` over a date.
 */
export type PortalIdentity = {
  /** the file number from `lib/game/member.ts`. Null until a card claims one. */
  memberNo: string | null
  displayName: string | null
  /** ISO date, `YYYY-MM-DD` */
  since: string
}

export type PortalProfile = {
  identity: PortalIdentity
  profile: Profile
}

export function emptyIdentity(): PortalIdentity {
  return { memberNo: null, displayName: null, since: '' }
}

/**
 * Merge the device's side and the account's side into the one that goes back to both.
 *
 * `remote` is null for a person who has signed in for the first time — there is nothing
 * on the server yet — and the answer then is the device's own card, unchanged. That is
 * not a special case bolted on: it is what the rules below produce anyway, and it is
 * written out so the first sign-in is obviously non-destructive rather than provably so.
 */
export function mergeProfiles(local: PortalProfile, remote: PortalProfile | null): PortalProfile {
  if (remote === null) return { identity: { ...local.identity }, profile: { ...local.profile } }

  return {
    identity: mergeIdentity(local.identity, remote.identity),
    profile: mergeDeviceProfiles(local.profile, remote.profile),
  }
}

export function mergeIdentity(local: PortalIdentity, remote: PortalIdentity): PortalIdentity {
  return {
    // The server's number wins whenever it has one — see the header. A device number is
    // only ever ADOPTED upward, into an account that has none.
    memberNo: firstOf(remote.memberNo, local.memberNo),
    // A name is the one identity field a person edits on purpose, and the account's copy
    // is the one their other devices have already seen. A device name fills a blank.
    displayName: firstOf(remote.displayName, local.displayName),
    // Earliest, always. The single most important line in this file.
    since: earlier(local.since, remote.since),
  }
}

export function mergeDeviceProfiles(local: Profile, remote: Profile): Profile {
  const gates: Record<string, GateStat> = {}
  for (const key of keysOf(local.gates, remote.gates)) {
    gates[key] = mergeStat(local.gates[key], remote.gates[key])
  }

  const rotation: Record<string, Rotation> = {}
  for (const key of keysOf(local.rotation, remote.rotation)) {
    const merged = mergeRotation(local.rotation[key], remote.rotation[key])
    if (merged !== null) rotation[key] = merged
  }

  const collections: Record<string, string[]> = {}
  for (const key of keysOf(local.collections, remote.collections)) {
    collections[key] = union(local.collections[key] ?? [], remote.collections[key] ?? [])
  }

  return {
    v: 1,
    // `since` on the device profile is the same claim as `identity.since` and takes the
    // same rule. It is stored twice because `lib/profile/store.ts` predates the account;
    // the two are merged the same way, so they cannot disagree after a sync.
    since: earlier(local.since, remote.since),
    days: union(local.days, remote.days).sort(),
    gates,
    rotation,
    collections,
    shares: Math.max(local.shares, remote.shares),
    duelsTaken: Math.max(local.duelsTaken, remote.duelsTaken),
  }
}

/** Counters take the higher of the two; the last day played takes the later. */
export function mergeStat(local: GateStat | undefined, remote: GateStat | undefined): GateStat {
  const a = local ?? emptyStat()
  const b = remote ?? emptyStat()
  return {
    plays: Math.max(a.plays, b.plays),
    best: Math.max(a.best, b.best),
    bestRate: Math.max(a.bestRate, b.bestRate),
    // The only field on a stat that is a DATE, and the only one where "later" is right:
    // "when did you last play this gate" is answered by whichever device played it last.
    lastOn: later(a.lastOn, b.lastOn),
    correct: Math.max(a.correct, b.correct),
    asked: Math.max(a.asked, b.asked),
  }
}

/**
 * איפה אתה בחפיסה — and the one field that is not merged at all when the two disagree.
 *
 * A rotation is this DEVICE's place in a shuffle (`lib/rotation/deck.ts`): the seed says
 * which shuffle, the cursor says how far in. Two devices that were handed different
 * seeds are walking two different decks, and taking the higher cursor across them would
 * skip a stranger's worth of rounds you have never seen — the deck's whole purpose is
 * that nothing repeats until the pool is exhausted, and a cursor from another shuffle
 * makes it skip instead.
 *
 * So: same seed, take the further cursor. Different seeds, the LOCAL device keeps its own
 * deck, because it is the one mid-walk. Nothing is lost by that — a deck is a position,
 * not a possession, and the other device keeps walking its own.
 */
export function mergeRotation(
  local: Rotation | undefined,
  remote: Rotation | undefined,
): Rotation | null {
  if (!isRotation(local)) return isRotation(remote) ? { ...remote } : null
  if (!isRotation(remote)) return { ...local }
  if (local.seed !== remote.seed) return { ...local }
  return { seed: local.seed, cursor: Math.max(local.cursor, remote.cursor) }
}

function isRotation(value: Rotation | undefined): value is Rotation {
  return !!value && Number.isFinite(value.seed) && value.seed > 0 && Number.isFinite(value.cursor)
}

/**
 * The earlier of two ISO dates, ignoring the empty string.
 *
 * An empty `since` is what an untouched profile carries before anything is written to
 * it, and treating `''` as "the beginning of time" would make every merge answer `''`.
 * It means "nothing known", which is the opposite.
 */
export function earlier(a: string, b: string): string {
  if (a === '') return b
  if (b === '') return a
  return a < b ? a : b
}

export function later(a: string, b: string): string {
  if (a === '') return b
  if (b === '') return a
  return a > b ? a : b
}

function firstOf(preferred: string | null, fallback: string | null): string | null {
  const first = (preferred ?? '').trim()
  if (first !== '') return first
  const second = (fallback ?? '').trim()
  return second === '' ? null : second
}

/** Local order first, then whatever the other side had and this one did not. */
function union(a: readonly string[], b: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of [...a, ...b]) {
    if (typeof value !== 'string' || value === '' || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

function keysOf(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])]
}

/**
 * The device profile as it comes back from the account.
 *
 * Assembled by `lib/portal/sync.ts` from real rows and handed here as a plain `Profile`,
 * so this file never learns what a Supabase response looks like and the tests never need
 * one. Anything the server does not hold falls back to an empty profile rather than to a
 * guess.
 */
export function remoteProfile(partial: Partial<Profile>): Profile {
  return {
    ...emptyProfile(),
    ...partial,
    since: partial.since ?? '',
    days: Array.isArray(partial.days) ? partial.days : [],
    gates: partial.gates ?? {},
    rotation: partial.rotation ?? {},
    collections: partial.collections ?? {},
  }
}
