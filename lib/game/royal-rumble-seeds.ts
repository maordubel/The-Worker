/** One legal whole-board shuffle. Both offer seeds collapse to one stable match seed. */
export const ROYAL_RUMBLE_SHUFFLE_MASK = 0x5f3759df

export function alternateRoyalRumbleOfferSeed(seed: number): number {
  return ((seed >>> 0) ^ ROYAL_RUMBLE_SHUFFLE_MASK) >>> 0
}

export function royalRumbleMatchSeed(offerSeed: number): number {
  const first = offerSeed >>> 0
  const second = alternateRoyalRumbleOfferSeed(first)
  return Math.min(first, second) >>> 0
}
