import { describe, expect, it } from 'vitest'

import { resolveStageBAnchors, STAGE_B_ANCHOR_KEYS } from '@/lib/life/anchor-server'
import { CHAPTERS } from '@/lib/life/content/chapters'

/**
 * העוגנים של העשור — every Stage B chapter hangs on a row the archive holds, and the
 * rows say what the sources say. The scores here are the verification ledger of the
 * brief (§14) written as assertions: if a row drifts, this is where it is caught, and
 * no line of dialogue is ever the place a score lives.
 */
describe('Stage B anchors — the archive answers, in the right orientation', () => {
  const anchors = resolveStageBAnchors()

  it('resolves every key a chapter names', () => {
    for (const chapter of CHAPTERS) {
      if (['1986', '1990', '1991'].includes(chapter.id) || chapter.stage === 'A') continue
      expect(STAGE_B_ANCHOR_KEYS, `${chapter.id} → ${chapter.anchorKey}`).toContain(chapter.anchorKey)
    }
  })

  it('1993 — the cup won, the finals lost 1–3, scores home/away not winner-first', () => {
    const cup = anchors['1993-cup']!
    expect(cup.sport).toBe('basketball')
    expect(cup.match?.scoredFor).toBe(71)
    expect(cup.match?.scoredAgainst).toBe(65)
    expect(cup.match?.opponentHe).toBe('הפועל גבעתיים')
    const galil = anchors['1993-galil']!
    expect(galil.match?.playedOn).toBe('1993-05-19')
    expect(galil.match?.atHome).toBe(false)
    expect(galil.match?.scoredFor).toBe(85)
    expect(galil.match?.scoredAgainst).toBe(89)
  })

  it('1994 — the derby final lost 0–2 at Ramat Gan', () => {
    const a = anchors['1994-cup']!
    expect(a.match?.opponentHe).toBe('מכבי תל אביב')
    expect(a.match?.scoredFor).toBe(0)
    expect(a.match?.scoredAgainst).toBe(2)
    expect(a.match?.venueHe).toBe('אצטדיון רמת גן')
  })

  it('1998 — the last round: a win at home, and a title lost by one point elsewhere', () => {
    const a = anchors['1998']!
    expect(a.match?.playedOn).toBe('1998-05-02')
    expect(a.match?.atHome).toBe(true)
    expect(a.match?.scoredFor).toBe(1)
    expect(a.match?.scoredAgainst).toBe(0)
    expect(a.match?.opponentHe).toBe('הפועל פתח תקווה')
  })

  it('1999 and 2000 — 1:1 then 3:1, 1:1 at the Hatikva, 2:2 then 4:2; the cups counted, not typed', () => {
    const cup99 = anchors['1999-cup']!
    expect(cup99.match?.scoredFor).toBe(1)
    expect(cup99.match?.scoredAgainst).toBe(1)
    expect(cup99.match?.opponentHe).toBe('בית"ר ירושלים')
    expect(cup99.titlesSoFar).toBe(10)
    const title = anchors['2000-title']!
    expect(title.match?.playedOn).toBe('2000-05-13')
    expect(title.match?.atHome).toBe(false)
    expect(title.match?.scoredFor).toBe(1)
    expect(title.match?.scoredAgainst).toBe(1)
    expect(title.titlesSoFar).toBe(12)
    const cup00 = anchors['2000-cup']!
    expect(cup00.match?.scoredFor).toBe(2)
    expect(cup00.match?.scoredAgainst).toBe(2)
    expect(cup00.titlesSoFar).toBe((cup99.titlesSoFar ?? 0) + 1)
  })

  it('never hands a chapter a placeholder for a row the archive holds', () => {
    for (const key of ['1993-cup', '1993-galil', '1994-cup', '1998', '1999-cup', '2000-title', '2000-cup']) {
      expect(anchors[key]!.placeholder, key).toBeNull()
      expect(anchors[key]!.confidence).toBeGreaterThanOrEqual(2)
    }
  })
})
