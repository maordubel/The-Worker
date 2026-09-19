'use server'

import { playRoyalRumble, type RoyalRumbleResult } from '@/lib/game/royal-rumble'

/**
 * Resolve a locked Royal Rumble five on the server.
 * Hidden 9-99 ratings never enter the browser: the action returns only the opponent's
 * public cards and the already-resolved match animation frames.
 */
export async function submitRoyalRumble(
  seed: number,
  slugs: string[],
): Promise<RoyalRumbleResult | null> {
  return playRoyalRumble(seed, slugs)
}
