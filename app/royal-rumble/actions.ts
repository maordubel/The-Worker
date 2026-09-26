'use server'

import { playRoyalRumble, type RoyalRumbleResult, type RoyalRumbleSelection, type RumbleWindow } from '@/lib/game/royal-rumble'
import { parseSelection } from '@/lib/game/royal-rumble-public'

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
