'use server'

import { playRoyalRumble, type RoyalRumbleResult, type RoyalRumbleSelection, type RumbleWindow } from '@/lib/game/royal-rumble'
import { parseSelection } from '@/lib/game/royal-rumble-public'
import { resolvePlayerId } from '@/lib/archive/player-master'
import { recommend, type NextAction, type ResultContext } from '@/lib/results/context'

/**
 * Resolve a locked Royal Rumble five on the server.
 * Hidden 9-99 ratings never enter the browser: the action returns only the opponent's
 * public cards, the resolved formations and the already-resolved match animation frames.
 * V2 (25.9.2026): the selection carries `offeredAs`, and the server re-deals the board from
 * the seed to check every card against the slot it was dealt in (spec §6).
 */
export async function submitRoyalRumble(
  seed: number,
  selection: RoyalRumbleSelection[],
  window?: RumbleWindow,
): Promise<RoyalRumbleResult | null> {
  const picks = parseSelection(selection)
  if (!picks) return null
  // `window` is THE WORKER LIFE's pack: the same match, over the men of the life's years only
  const cut = window && Number.isFinite(window.before) ? { before: Math.round(window.before) } : undefined
  return playRoyalRumble(seed, picks, cut)
}

/**
 * The Universal Exit after the whistle (ONE RED WORLD §5, §6, §38): the five he chose, as
 * Player Master ids resolved HERE (slugs only cross the wire), and at most two doors from
 * `recommend()` — his man's archive card, "הוא נכנס להרכב שלך?".
 */
export async function nextAfterRumble(slugs: string[], runId: string): Promise<NextAction[]> {
  const playerIds = (Array.isArray(slugs) ? slugs : [])
    .filter((slug): slug is string => typeof slug === 'string')
    .slice(0, 5)
    .map((slug) => resolvePlayerId(slug))
    .filter((id): id is string => Boolean(id))
  const context: ResultContext = { gateId: 9, runId: typeof runId === 'string' ? runId.slice(0, 32) : undefined, playerIds }
  return recommend(context)
}
