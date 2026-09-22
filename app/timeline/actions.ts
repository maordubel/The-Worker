'use server'

import { gradeInsert, type InsertVerdict } from '@/lib/game/timeline'
import { closeRoute, routeAnchors, tryLink } from '@/lib/game/thread'
import type { CloseResult, LinkResult } from '@/lib/game/thread-run'

/**
 * Server authority for both games behind gate 13.
 *
 * **החוט האדום** — `linkThread` asks whether a card really connects to the last stop
 * (rule 4: the adjacency never travels to the client), `closeThread` re-checks the whole
 * route onto the end and scores it against the optimum.
 *
 * **סדר כרונולוגי** (`/timeline/order`) — the date of the card in hand is derived here
 * from the seed and never travels before it is earned.
 */
const ids = (path: unknown): string[] => (Array.isArray(path) ? path.slice(0, 12).map((id) => String(id).slice(0, 160)) : [])

export async function linkThread(ref: string, path: string[], candidate: string): Promise<LinkResult> {
  return tryLink(String(ref).slice(0, 40), ids(path), String(candidate).slice(0, 160))
}

export async function closeThread(ref: string, path: string[], integrityLeft: number): Promise<CloseResult> {
  return closeRoute(String(ref).slice(0, 40), ids(path), Number(integrityLeft) || 0)
}

export async function submitInsert(
  seed: number,
  placed: number,
  slot: number,
  cursor = 0,
): Promise<InsertVerdict | null> {
  // A round is addressed by seed AND cursor once rotation is on; grading has to
  // re-derive with both or it grades a different deal than the one on screen.
  return gradeInsert(seed, placed, slot, cursor)
}

/** Gate 10: the device's closed routes as their anchors. */
export async function describeRoutes(routeIds: string[]) {
  return routeAnchors(Array.isArray(routeIds) ? routeIds.slice(0, 500).map((id) => String(id).slice(0, 80)) : [])
}
