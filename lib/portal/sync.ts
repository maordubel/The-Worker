'use client'

/**
 * התפר — the only file that puts the device's card and the account's card in the same
 * room, and the only one that knows a Supabase client exists outside `lib/supabase/`.
 *
 * Everything hard about this is in `lib/portal/merge.ts`, which is pure and tested. What
 * is left here is plumbing, and plumbing is kept deliberately thin: read both sides,
 * hand them to the merge, write the answer back to both. No arithmetic, no field rules,
 * no "if this is newer" — every one of those belongs to the pure function, because every
 * one of them is a decision somebody will want to read the reasoning for later.
 *
 * Three properties this seam holds to, and each is a rule this repo already has:
 *
 *  · **The device never waits for the network.** Nothing here is on the path of a round.
 *    A gate records into `localStorage` first and always (`components/play/RecordRun.tsx`),
 *    and the push is a fire-and-forget afterwards. A supporter on the 61 bus with no
 *    signal plays exactly the app he played yesterday.
 *  · **Every failure is silent and local.** A sync that cannot reach the server leaves
 *    the device's card exactly as it was and says so in its return value. Nothing throws
 *    at a screen, because losing a sync is much smaller than losing the page a person is
 *    on — the same reasoning every `localStorage` call in this codebase is wrapped with.
 *  · **Nothing is invented on the way up.** The remote side of a merge is assembled from
 *    REAL rows in `gate_run`, counted, not estimated. A person who has played nothing has
 *    an empty remote profile and merges to exactly what their device already held.
 */

import { storedBook, writeBook } from '@/lib/game/member'
import { readProfile, writeProfile, emptyStat, type GateStat, type Profile } from '@/lib/profile/store'
import { createClient } from '@/lib/supabase/client'
import { portalDb } from './db'
import { portalConfigured } from './env'
import {
  emptyIdentity,
  mergeProfiles,
  remoteProfile,
  type PortalIdentity,
  type PortalProfile,
} from './merge'

export type Account = {
  id: string
  email: string | null
  displayName: string | null
}

/**
 * `off` — this build has no keys, so there is no account to have.
 * `signed-out` — there is a server and nobody is signed in. The device is the card.
 * `synced` — both sides were read, merged, and written back.
 * `failed` — the network or the server said no. The device's card is untouched.
 */
export type SyncState = 'off' | 'signed-out' | 'synced' | 'failed'

export type SyncResult = {
  state: SyncState
  account: Account | null
  /** the merged card, for a screen that wants to print it without re-reading storage */
  merged: PortalProfile | null
}

/** Who is signed in on this device, or null. Never throws. */
export async function currentAccount(): Promise<Account | null> {
  if (!portalConfigured()) return null
  try {
    const { data, error } = await createClient().auth.getUser()
    if (error || !data.user) return null
    const meta = data.user.user_metadata as { full_name?: unknown; name?: unknown }
    return {
      id: data.user.id,
      email: data.user.email ?? null,
      displayName: text(meta?.full_name) ?? text(meta?.name),
    }
  } catch {
    return null
  }
}

/**
 * Google, and the redirect back through `/auth/callback`.
 *
 * `redirectTo` is built from the window's own origin rather than from `SITE_URL`, so a
 * Vercel preview deployment signs in against itself instead of bouncing the person to
 * production. Both origins have to be listed in Supabase's redirect allow-list — that is
 * a click in the dashboard and it is written down in `docs/14-portal-identity.md`.
 */
export async function signInWithGoogle(next = '/tik'): Promise<void> {
  if (!portalConfigured() || typeof window === 'undefined') return
  try {
    await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
  } catch {
    // the button simply does nothing rather than throwing on the personal area
  }
}

export async function signOut(): Promise<void> {
  if (!portalConfigured()) return
  try {
    await createClient().auth.signOut()
  } catch {
    // already gone, or offline. Either way the next `currentAccount()` answers null.
  }
}

/**
 * Read both cards, merge them, write the answer back to both.
 *
 * The device is written first and unconditionally, so a push that fails halfway still
 * leaves the person holding the better of the two cards rather than the older one.
 */
export async function syncProfile(): Promise<SyncResult> {
  if (!portalConfigured()) return { state: 'off', account: null, merged: null }

  const account = await currentAccount()
  if (account === null) return { state: 'signed-out', account: null, merged: null }

  const local = localSide()

  try {
    const supabase = portalDb()

    const card = await supabase
      .from('app_profile')
      .select('display_name, member_no, since')
      .eq('id', account.id)
      .maybeSingle()
    if (card.error) return { state: 'failed', account, merged: null }

    const runs = await supabase
      .from('gate_run')
      .select('gate, score, asked, correct, played_on')
      .eq('user_id', account.id)
    if (runs.error) return { state: 'failed', account, merged: null }

    const remote: PortalProfile | null =
      card.data === null
        ? null
        : {
            identity: {
              memberNo: text(card.data.member_no),
              displayName: text(card.data.display_name) ?? account.displayName,
              since: text(card.data.since) ?? '',
            },
            profile: remoteProfile(foldRuns(runs.data ?? [])),
          }

    const merged = mergeProfiles(local, remote)

    writeProfile(merged.profile)
    adoptMemberNo(merged.identity.memberNo)

    const push = await supabase
      .from('app_profile')
      .update({
        display_name: merged.identity.displayName,
        // Sending the merged number is safe by construction: the merge prefers the
        // server's whenever it has one, so this is either the same value or the first
        // one this card has ever had. `app_profile_keep_identity` refuses anything else.
        member_no: merged.identity.memberNo,
        ...(merged.identity.since === '' ? {} : { since: merged.identity.since }),
      })
      .eq('id', account.id)
    if (push.error) return { state: 'failed', account, merged }

    return { state: 'synced', account, merged }
  } catch {
    return { state: 'failed', account, merged: null }
  }
}

/**
 * דיווח על סבב — one finished round, up to the account, exactly once.
 *
 * `p_key` is minted by the caller when the round ends and re-sent on every retry, so a
 * dropped response, a double-invoked effect and a reload all resolve to one row. The
 * whole call is best-effort: the device has already recorded the round by the time this
 * runs, and a failed push is a row that the next sync simply does not know about.
 */
export async function recordRunRemote(run: {
  key: string
  gate: string
  score?: number
  correct?: number
  asked?: number
  seed?: number | null
}): Promise<boolean> {
  if (!portalConfigured()) return false
  try {
    const supabase = portalDb()
    const { data } = await supabase.auth.getUser()
    if (!data.user) return false
    const { error } = await supabase.rpc('rpc_record_run', {
      p_key: run.key,
      p_gate: run.gate,
      p_score: run.score ?? 0,
      p_asked: run.asked ?? 0,
      p_correct: run.correct ?? 0,
      p_seed: run.seed ?? null,
    })
    return !error
  } catch {
    return false
  }
}

/** The device's own card, in the shape the merge expects. */
function localSide(): PortalProfile {
  const profile = readProfile()
  const book = storedBook()
  const identity: PortalIdentity = {
    ...emptyIdentity(),
    // `storedBook()` and not `readBook()`: a number this device minted a second ago and
    // nobody has ever seen must not be carried into an account (see `lib/game/member.ts`).
    memberNo: book === null ? null : text(book.tik),
    displayName: book === null ? null : text(book.nameHe),
    since: profile.since,
  }
  return { identity, profile }
}

/** Write the merged file number back onto the device's book, if it had none. */
function adoptMemberNo(memberNo: string | null): void {
  if (memberNo === null) return
  const book = storedBook()
  if (book === null || book.tik === memberNo) return
  writeBook({ ...book, tik: memberNo })
}

/**
 * The account's `gate_run` rows, folded into the same shape the device keeps.
 *
 * This is the read model rule 1 asks for: the rows are the canonical thing and the
 * counters are derived from them, rather than the counters being stored twice and
 * drifting. It is also why the merge can afford to be conservative — an exact total is
 * always recoverable here, from rows nobody had to trust.
 */
type RunRow = { gate: string; score: number; asked: number; correct: number; played_on: string }

export function foldRuns(rows: readonly RunRow[]): Partial<Profile> {
  const gates: Record<string, GateStat> = {}
  const days = new Set<string>()
  let since = ''

  for (const row of rows) {
    if (typeof row.gate !== 'string' || row.gate === '') continue
    const day = typeof row.played_on === 'string' ? row.played_on : ''
    if (day !== '') {
      days.add(day)
      since = since === '' || day < since ? day : since
    }
    const prior = gates[row.gate] ?? emptyStat()
    const asked = row.asked ?? 0
    const correct = row.correct ?? 0
    gates[row.gate] = {
      plays: prior.plays + 1,
      best: Math.max(prior.best, row.score ?? 0),
      bestRate: Math.max(prior.bestRate, asked > 0 ? correct / asked : 0),
      lastOn: day > prior.lastOn ? day : prior.lastOn,
      correct: prior.correct + correct,
      asked: prior.asked + asked,
    }
  }

  return { since, days: [...days].sort(), gates }
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
