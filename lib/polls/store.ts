'use client'

import { BALLOT, type Ballot, type Tally } from './ballot'

/**
 * איפה הקול נשמר.
 *
 * Maor's call was "מקומי עכשיו, Supabase כשיהיה" — local now, the database when it is
 * there. The risk in that instruction is the obvious one: "local now" usually means
 * `localStorage.getItem` sprinkled through a component, and then "the database when it
 * is there" means rewriting the screen. So the seam is drawn here, once, and the screen
 * never learns which side of it it is talking to.
 *
 * Three things make the swap real rather than aspirational:
 *
 *  · **The interface is async.** A synchronous local store would let the screen be
 *    written without a pending state, and every one of those is a bug the day the
 *    network is on the other end.
 *  · **The tally is a separate call from the ballot.** Your own picks are yours and
 *    read instantly; the count is everybody's and will be a round trip. Fusing them
 *    into one read is what makes a local prototype impossible to promote.
 *  · **`countable` is honest.** The local store cannot count a terrace — it has one
 *    voter. It says so, and the screen shows the slip instead of drawing a bar chart
 *    of a sample of one. Nothing in this app invents a number (rule 11), and a poll
 *    with fabricated baseline votes would be the worst possible place to start.
 *
 * When the table exists, `SupabaseBallotStore` implements this same interface against
 * `poll_vote (device_id, question_id, pick, voted_at)` with a unique key on
 * `(device_id, question_id)` so a changed mind updates rather than stuffs the box, and
 * `activeStore()` returns it when the keys are present. Not written yet, because a
 * stub that reads no table is dead code pretending to be progress.
 */
export interface BallotStore {
  /** true when this store can report what OTHER people voted */
  readonly countable: boolean
  read(): Promise<Ballot>
  save(questionId: string, pick: string): Promise<void>
  clear(): Promise<void>
  tally(questionId: string): Promise<Tally | null>
}

const KEY = 'worker.ballot.v1'

/**
 * The local store. One device, one ballot, kept across visits.
 *
 * Everything is wrapped: a browser in private mode, with site data blocked, or simply
 * out of quota throws on `localStorage`, and a poll losing its saved picks is a much
 * smaller problem than a poll throwing during render.
 */
export class LocalBallotStore implements BallotStore {
  readonly countable = false

  async read(): Promise<Ballot> {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (!raw) return {}
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) return {}
      // Only the questions that exist today are read back, so a renamed question in a
      // later version cannot resurrect a pick under a heading nobody asked for.
      const known = new Set(BALLOT.map((question) => question.id))
      const out: Ballot = {}
      for (const [id, pick] of Object.entries(parsed as Record<string, unknown>)) {
        if (known.has(id) && typeof pick === 'string' && pick !== '') out[id] = pick
      }
      return out
    } catch {
      return {}
    }
  }

  async save(questionId: string, pick: string): Promise<void> {
    try {
      const current = await this.read()
      const next: Ballot = { ...current, [questionId]: pick }
      window.localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // an unsaved vote is still a cast vote for this session
    }
  }

  async clear(): Promise<void> {
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      // nothing to do and nothing worth throwing over
    }
  }

  async tally(): Promise<Tally | null> {
    return null
  }
}

/** The store this build votes into. One line changes when the table lands. */
export function activeStore(): BallotStore {
  return new LocalBallotStore()
}
