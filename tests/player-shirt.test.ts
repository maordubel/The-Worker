import { describe, expect, it } from 'vitest'

import { allPlayers } from '@/lib/archive/player-master'
import { archiveShirts } from '@/lib/kit/archive'
import { playerShirt, wardrobe } from '@/lib/kit/playerShirt'
import photosFile from '@/content/manual/kit-photos.json'

/**
 * Delta 88 — every man wears a shirt, and a real photograph of his era beats a drawing
 * (Maor, 24.9.2026: "אסור שיהיה שחקן ללא חולצה").
 */
describe('playerShirt — the one resolver', () => {
  const players = allPlayers()
  const looks = players.map((player) => ({ player, look: playerShirt(player) }))

  it('never returns null, for all 657 men', () => {
    expect(players.length).toBe(657)
    for (const { look } of looks) {
      expect(look).toBeTruthy()
      if (look.kind === 'photo') expect(look.src).toMatch(/^\/kits\/.+\.webp$/)
      else expect(look.spec).toBeTruthy()
    }
    // an unknown ref still gets a shirt
    expect(playerShirt('no-such-man').kind).toBe('engine')
    expect(playerShirt(null).kind).toBe('engine')
  })

  it('dresses most men in a real photograph (coverage reported)', () => {
    const photo = looks.filter(({ look }) => look.kind === 'photo')
    const exact = photo.filter(({ look }) => !look.approx)
    // printed so the report can quote it
    console.info(`player-shirt coverage: ${photo.length}/${players.length} photo (${exact.length} in-era, ${photo.length - exact.length} a few seasons off), ${players.length - photo.length} engine`)
    expect(photo.length).toBeGreaterThan(players.length / 2)
  })

  it('only serves photographs that are in the measured ledger (no new images)', () => {
    const ledger = new Set(archiveShirts().map((shirt) => shirt.src))
    expect(ledger.size).toBe((photosFile as { records: unknown[] }).records.length)
    for (const { look } of looks) if (look.kind === 'photo') expect(ledger.has(look.src)).toBe(true)
  })

  it('a 1990s man gets a ויקיפועל photograph from inside his spell', () => {
    const nineties = players.find(
      (player) =>
        player.spells.length === 1 &&
        player.spells[0]!.seasons.length > 0 &&
        player.spells[0]!.seasons.every((season) => season >= '1993/94' && season <= '1998/99'),
    )
    expect(nineties).toBeTruthy()
    const look = playerShirt(nineties!)
    expect(look.kind).toBe('photo')
    if (look.kind === 'photo') {
      expect(look.src).toMatch(/\/kits\/vp-199\d/)
      expect(nineties!.spells[0]!.seasons).toContain(look.seasonLabel)
      expect(look.approx).toBe(false)
    }
  })

  it('a pinned season wears that season (gate 3 match, an XI version)', () => {
    const look = playerShirt(null, { season: '2016/17' })
    expect(look.kind).toBe('photo')
    if (look.kind === 'photo') {
      expect(look.seasonLabel).toBe('2016/17')
      expect(look.variant).toBe('home')
      expect(look.src).toBe('/kits/fka-2016-17-home.webp')
    }
  })

  it('never hands out a one-off special shirt', () => {
    for (const { look } of looks) if (look.kind === 'photo') expect(look.variant).not.toBe('special')
  })

  it('is deterministic, and the wardrobe dedupes', () => {
    const a = playerShirt(players[42]!)
    const b = playerShirt(players[42]!)
    expect(a).toEqual(b)
    const wd = wardrobe(players.map((player) => ({ key: player.slug, player })))
    expect(Object.keys(wd.by).length).toBe(new Set(players.map((p) => p.slug)).size)
    expect(wd.shirts.length).toBeLessThan(200)
  })
})

describe('playerShirt — THE WORKER LIFE year', () => {
  it('never dresses a man in a season that had not begun before the life year', () => {
    for (const player of allPlayers()) {
      const first = player.spells.flatMap((spell) => spell.seasons).sort()[0]
      if (!first) continue
      const before = Number(first.slice(0, 4)) + 1
      const look = playerShirt(player, { before })
      if (look.seasonLabel !== '') expect(Number(look.seasonLabel.slice(0, 4))).toBeLessThan(before)
    }
  })
})
