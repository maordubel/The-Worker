'use server'

import { playRoyalRumble, type RoyalRumbleResult, type RumbleWindow } from '@/lib/game/royal-rumble'

/**
 * Resolve a locked Royal Rumble five on the server.
 * Hidden 9-99 ratings never enter the browser: the action returns only the opponent's
 * public cards and the already-resolved match animation frames.
 */
export async function submitRoyalRumble(
  seed: number,
  slugs: string[],
  window?: RumbleWindow,
): Promise<RoyalRumbleResult | null> {
  // `window` is THE WORKER LIFE's pack: the same match, over the men of the life's years only
  const cut = window && Number.isFinite(window.before) ? { before: Math.round(window.before) } : undefined
  return playRoyalRumble(seed, slugs, cut)
}
