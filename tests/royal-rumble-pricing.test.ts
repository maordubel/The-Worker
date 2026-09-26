import { describe, expect, it } from 'vitest'

import { allPlayers } from '@/lib/archive/player-master'
import { dealRoyalRumbleDraft, priceForPlayer, royalRumbleAuditView, royalRumblePlayerCount } from '@/lib/game/royal-rumble'
import { ROYAL_RUMBLE_BALANCE_VERSION, ROYAL_RUMBLE_PRICE_OVERRIDES } from '@/lib/game/royal-rumble-prices'

/**
 * Pricing V2 (spec §9–§15): the pipeline's output against its targets, and the override
 * list against the Player Master. The distribution bands are the spec's, read with a
 * little room — they are a target, not a quota (§10).
 */
describe('priceForPlayer', () => {
  const { players } = royalRumbleAuditView()

  it('prices every man in the pool 1–5, and nobody outside it', () => {
    expect(players.length).toBe(royalRumblePlayerCount())
    for (const player of players) {
      const price = priceForPlayer(player.slug)
      expect(price).toBe(player.price)
      expect(price).toBeGreaterThanOrEqual(1)
      expect(price).toBeLessThanOrEqual(5)
    }
    expect(priceForPlayer('nobody-at-all')).toBeNull()
  })

  it('lands the pool on the target distribution — €1 12–17% · €2 23–27% · €3 28–32% · €4 18–22% · €5 8–12%', () => {
    const share = (tier: number) => players.filter((player) => player.price === tier).length / players.length
    expect(share(1)).toBeGreaterThanOrEqual(0.11)
    expect(share(1)).toBeLessThanOrEqual(0.18)
    expect(share(2)).toBeGreaterThanOrEqual(0.22)
    expect(share(2)).toBeLessThanOrEqual(0.28)
    expect(share(3)).toBeGreaterThanOrEqual(0.27)
    expect(share(3)).toBeLessThanOrEqual(0.33)
    expect(share(4)).toBeGreaterThanOrEqual(0.17)
    expect(share(4)).toBeLessThanOrEqual(0.23)
    expect(share(5)).toBeGreaterThanOrEqual(0.07)
    expect(share(5)).toBeLessThanOrEqual(0.13)
  })

  it('gives every position depth at every price — no position that always costs a premium (§15)', () => {
    for (const position of ['GK', 'DF', 'MF', 'FW'] as const) {
      for (const tier of [1, 2, 3, 4, 5]) {
        const depth = players.filter((player) => player.positions.includes(position) && player.price === tier).length
        expect(depth, `${position} at €${tier}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('keeps price a coarse zone of the hidden rating, ordered but overlapping', () => {
    const avg = (tier: number) => {
      const rows = players.filter((player) => player.price === tier)
      return rows.reduce((sum, row) => sum + row.rating, 0) / rows.length
    }
    expect(avg(1)).toBeLessThan(avg(2))
    expect(avg(2)).toBeLessThan(avg(3))
    expect(avg(3)).toBeLessThan(avg(4))
    expect(avg(4)).toBeLessThan(avg(5))
    // a €5 and a €4 may be far apart in strength (§9): the top tier spans twenty points
    const fives = players.filter((player) => player.price === 5).map((player) => player.rating)
    expect(Math.max(...fives) - Math.min(...fives)).toBeGreaterThanOrEqual(15)
    // and the budget's strategies are real: five €3s stand with 5+4+3+2+1
    const flat = 5 * avg(3)
    const spread = avg(5) + avg(4) + avg(3) + avg(2) + avg(1)
    expect(Math.abs(flat - spread) / spread).toBeLessThan(0.12)
  })

  it('keeps every era priced across the ladder — the sparse decades are not all premium, the dense ones not all cheap', () => {
    const era = (from: number, to: number) => players.filter((player) => player.fromYear !== null && player.fromYear >= from && player.fromYear < to)
    const share = (rows: typeof players, tiers: number[]) => rows.filter((player) => tiers.includes(player.price)).length / Math.max(1, rows.length)
    for (const [from, to] of [
      [1927, 1980],
      [1980, 2000],
      [2000, 2030],
    ] as const) {
      const rows = era(from, to)
      expect(rows.length).toBeGreaterThan(30)
      expect(share(rows, [4, 5]), `${from}–${to} premium`).toBeLessThan(0.8)
      expect(share(rows, [4, 5]), `${from}–${to} premium`).toBeGreaterThan(0.1)
      expect(share(rows, [1, 2]), `${from}–${to} value`).toBeGreaterThan(0.05)
    }
    // V1's longevity weight put a 1960s seven-season man at the top by default; the seasons
    // term is now a quarter of the score, so a pre-1980 spell alone does not buy a €5
    const pre = era(1927, 1980)
    expect(share(pre, [5])).toBeLessThan(0.4)
  })

})

describe('value discovery (§9, §51)', () => {
  it('prices fame, not the rating: a €2 can out-rate a €3, and a dealt slot holds a real bargain often enough', () => {
    const { players } = royalRumbleAuditView()
    const threes = players.filter((player) => player.price === 3).map((player) => player.rating).sort((a, b) => a - b)
    const medianThree = threes[Math.floor(threes.length / 2)] ?? 0
    const bargains = players.filter((player) => player.price === 2 && player.rating >= medianThree)
    expect(bargains.length).toBeGreaterThanOrEqual(10)
    // and on dealt boards: a cheaper card within eight rating points of a dearer one, in a fair share of slots
    const rating = new Map(players.map((player) => [player.slug, player.rating]))
    let slots = 0
    let near = 0
    for (let seed = 0; seed < 300; seed += 1) {
      for (const slot of dealRoyalRumbleDraft(seed).slots) {
        slots += 1
        const cards = slot.offers.map((offer) => ({ price: offer.player.price, rating: rating.get(offer.player.slug) ?? 0 }))
        if (cards.some((a) => cards.some((b) => a.price < b.price && a.rating >= b.rating - 8))) near += 1
      }
    }
    expect(near / slots).toBeGreaterThan(0.12)
  })
})

describe('canonical overrides', () => {
  it('name real Player Master men only, thirty to sixty of them, and every override took', () => {
    const known = new Set(allPlayers().map((player) => player.slug))
    const entries = Object.entries(ROYAL_RUMBLE_PRICE_OVERRIDES)
    expect(entries.length).toBeGreaterThanOrEqual(30)
    expect(entries.length).toBeLessThanOrEqual(60)
    for (const [slug, price] of entries) {
      expect(known.has(slug), slug).toBe(true)
      expect(priceForPlayer(slug)).toBe(price)
    }
    expect(ROYAL_RUMBLE_BALANCE_VERSION).toBe(2)
  })
})
