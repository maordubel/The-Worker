import { describe, expect, it } from 'vitest'

import { CONFIDENCE_FLOOR, archive } from '@/lib/game/archive'
import { buildBoard } from '@/lib/game/memory'
import { ROUND_LENGTH, availableQuestionCount, deal, grade } from '@/lib/game/trivia'
import { verifiedKitSeasons } from '@/lib/game/kits'
import { dealKitChallenge, gradeKitChallenge, kitChallengeCount } from '@/lib/game/kitChallenge'
import {
  seasonLabelOf,
  seasonStartYear,
  seasonsInSpell,
  spellCoversSeason,
} from '@/lib/game/seasons'
import { TIMELINE_LENGTH, dealTimeline, gradeTimeline } from '@/lib/game/timeline'
import { dealGoal, gradeGoal } from '@/lib/game/goal'
import {
  FORMATIONS,
  dealChallenge,
  freeBuildBank,
  gradeLineup,
  hasVerifiedLineup,
} from '@/lib/game/lineup'

describe('archive', () => {
  it('exposes only facts at or above the confidence floor', () => {
    const everything = [
      ...archive.clubs,
      ...archive.people,
      ...archive.matches,
      ...archive.matchEvents,
      ...archive.trophies,
      ...archive.kitSupply,
      ...archive.sponsorDeals,
      ...archive.crests,
    ]
    expect(everything.length).toBeGreaterThan(30)
    for (const row of everything) {
      expect(row.confidence).toBeGreaterThanOrEqual(CONFIDENCE_FLOOR)
    }
  })

  it('gives every exposed fact a named source', () => {
    for (const row of [...archive.matches, ...archive.trophies, ...archive.kitSupply]) {
      expect(row.sourceTitle.length).toBeGreaterThan(0)
    }
  })
})

describe('trivia — the client never receives the answer', () => {
  it('deals a question with no correct-answer field on it', () => {
    const question = deal(1, 0)
    expect(question).not.toBeNull()
    expect(Object.keys(question ?? {})).not.toContain('correct')
    expect(JSON.stringify(question)).not.toContain('"correct"')
  })

  it('grades on the server from the seed, not from the payload', () => {
    const question = deal(1, 0)
    const verdict = grade(1, 0, question?.options[0] ?? '')
    expect(verdict).not.toBeNull()
    expect(question?.options).toContain(verdict?.correctAnswer)
  })

  it('marks exactly one option correct', () => {
    const question = deal(5, 2)
    if (!question) return
    const correct = question.options.filter(
      (option) => grade(5, 2, option)?.correct === true,
    )
    expect(correct).toHaveLength(1)
  })

  it('rejects a fabricated answer', () => {
    expect(grade(1, 0, 'לא-קיים')?.correct).toBe(false)
  })
})

describe('trivia — question quality', () => {
  it('produces a full round from the archive', () => {
    expect(availableQuestionCount()).toBeGreaterThanOrEqual(ROUND_LENGTH)
    for (let index = 0; index < ROUND_LENGTH; index += 1) {
      expect(deal(3, index), `question ${index}`).not.toBeNull()
    }
  })

  it('is deterministic — the same seed deals the same round', () => {
    expect(deal(9, 4)).toEqual(deal(9, 4))
  })

  it('offers four distinct options every time', () => {
    for (let index = 0; index < ROUND_LENGTH; index += 1) {
      const question = deal(11, index)
      if (!question) continue
      expect(new Set(question.options).size, question.prompt).toBe(question.options.length)
      expect(question.options.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('attaches a source at or above the floor to every question', () => {
    for (let index = 0; index < ROUND_LENGTH; index += 1) {
      const question = deal(13, index)
      if (!question) continue
      expect(question.source.title.length).toBeGreaterThan(0)
      expect(question.source.confidence).toBeGreaterThanOrEqual(CONFIDENCE_FLOOR)
    }
  })

  it('never asks the same question twice in one round', () => {
    const ids = Array.from({ length: ROUND_LENGTH }, (_, index) => deal(17, index)?.id)
    const present = ids.filter((id): id is string => Boolean(id))
    expect(new Set(present).size).toBe(present.length)
  })

  it('caps the Ussishkin question at one per round', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const templates = Array.from({ length: ROUND_LENGTH }, (_, index) =>
        deal(seed, index)?.template,
      ).filter((template) => template === 'ussishkin')
      expect(templates.length, `seed ${seed}`).toBeLessThanOrEqual(1)
    }
  })

  it('never uses the founder as a distractor — he appears only as the answer', () => {
    const FOUNDER = 'מאור הראל'
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      for (let index = 0; index < ROUND_LENGTH; index += 1) {
        const question = deal(seed, index)
        if (!question?.options.includes(FOUNDER)) continue
        // Present as an option means he must be the correct answer, never a decoy.
        expect(grade(seed, index, FOUNDER)?.correct, question.prompt).toBe(true)
      }
    }
  })

  it('keeps the whole Ussishkin family to one question per round', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const ussishkin = Array.from({ length: ROUND_LENGTH }, (_, index) =>
        deal(seed, index)?.template,
      ).filter((template) => template?.startsWith('ussishkin'))
      expect(ussishkin.length, `seed ${seed}`).toBeLessThanOrEqual(1)
    }
  })
})

describe('memory', () => {
  it('deals two cards for every pair', () => {
    const cards = buildBoard(7)
    const counts = new Map<string, number>()
    for (const card of cards) counts.set(card.pair, (counts.get(card.pair) ?? 0) + 1)
    for (const [pair, count] of counts) expect(count, pair).toBe(2)
  })

  it('never shows two cards with the same face', () => {
    const cards = buildBoard(7)
    expect(new Set(cards.map((card) => card.face)).size).toBe(cards.length)
  })

  it('is deterministic per seed and different across seeds', () => {
    expect(buildBoard(7)).toEqual(buildBoard(7))
    expect(buildBoard(7)).not.toEqual(buildBoard(8))
  })
})

describe('kits', () => {
  it('lists only seasons with a verified maker', () => {
    const seasons = verifiedKitSeasons()
    expect(seasons.length).toBeGreaterThan(5)
    for (const season of seasons) {
      expect(season.maker.length).toBeGreaterThan(0)
      expect(season.sourceTitle.length).toBeGreaterThan(0)
    }
  })

  it('leaves the seasons the archive does not cover out of the strip', () => {
    const seasons = verifiedKitSeasons().map((row) => row.season)
    expect(seasons).not.toContain('1981/82')
    expect(seasons).not.toContain('2003/04')
  })

  it('covers the seasons inside a supply spell, not only the season it starts in', () => {
    // Umbro ran 2006/07 to 2010/11. Matching sponsor to maker on the start label alone
    // hid every season in between — including the one Maor verified.
    const seasons = verifiedKitSeasons().map((row) => row.season)
    expect(seasons).toContain('2006/07')
    expect(seasons).toContain('2008/09')
    expect(seasons).toContain('2010/11')
  })

  it('carries both 2010/11 sponsors, each scoped to its competition', () => {
    const season = verifiedKitSeasons().find((row) => row.season === '2010/11')
    expect(season?.maker).toBe('אמברו')

    const scoped = (season?.sponsors ?? []).map((s) => `${s.name}|${s.competition ?? 'all'}`)
    expect(scoped).toContain('כתר|ליגת האלופות')
    expect(scoped).toContain('בוני התיכון|ליגת העל')
  })

  it('puts Subaru on the double-winning season', () => {
    const season = verifiedKitSeasons().find((row) => row.season === '2009/10')
    expect(season?.sponsors.map((s) => s.name)).toContain('סובארו')
  })
})

describe('season ranges', () => {
  it('reads and writes a season label, century wrap included', () => {
    expect(seasonStartYear('2010/11')).toBe(2010)
    expect(seasonStartYear('1999/00')).toBe(1999)
    expect(seasonStartYear(null)).toBeNull()
    expect(seasonStartYear('בערך 2010')).toBeNull()
    expect(seasonLabelOf(1999)).toBe('1999/00')
    expect(seasonLabelOf(2010)).toBe('2010/11')
  })

  it('treats an open spell as still running and a closed one as bounded', () => {
    const open = { fromLabel: '2024/25', toLabel: null }
    const closed = { fromLabel: '2006/07', toLabel: '2010/11' }

    expect(spellCoversSeason(open, '2026/27')).toBe(true)
    expect(spellCoversSeason(open, '2023/24')).toBe(false)
    expect(spellCoversSeason(closed, '2008/09')).toBe(true)
    expect(spellCoversSeason(closed, '2011/12')).toBe(false)

    expect(seasonsInSpell(closed, 2026)).toEqual([
      '2006/07',
      '2007/08',
      '2008/09',
      '2009/10',
      '2010/11',
    ])
    // An open spell is capped at the cap, never run to infinity.
    expect(seasonsInSpell(open, 2026).at(-1)).toBe('2026/27')
  })
})

describe('kit challenge', () => {
  it('deals a season and a bank, and never the answer', () => {
    const challenge = dealKitChallenge(11)
    expect(challenge).not.toBeNull()
    expect(challenge?.makers.length).toBeGreaterThan(2)
    expect(challenge?.sponsors.length).toBeGreaterThan(2)
    expect(JSON.stringify(challenge)).not.toContain('correct')
  })

  it('grades on the server and is stable for a seed', () => {
    const verdict = gradeKitChallenge(11, { maker: null, sponsor: null })
    expect(verdict).not.toBeNull()
    expect(verdict?.makerCorrect).toBe(false)

    const right = gradeKitChallenge(11, {
      maker: verdict?.maker ?? null,
      sponsor: verdict?.sponsor ?? null,
    })
    expect(right?.makerCorrect).toBe(true)
    expect(right?.sponsorCorrect).toBe(true)
    // Same seed, same target.
    expect(dealKitChallenge(11)?.challengeId).toBe(dealKitChallenge(11)?.challengeId)
  })

  it('asks about the competition-scoped 2010/11 pairs', () => {
    const ids = new Set<string>()
    for (let seed = 1; seed < 400; seed += 1) ids.add(dealKitChallenge(seed)?.challengeId ?? '')
    expect(ids).toContain('2010/11:ליגת-האלופות')
    expect(ids).toContain('2010/11:ליגת-העל')
  })

  it('never asks about a season where two sponsors are both true', () => {
    // Arkia ended early and Hachshara came in during 2019/20 — the archive holds both,
    // so the pair has no single answer and must not be a question.
    for (let seed = 1; seed < 400; seed += 1) {
      const challenge = dealKitChallenge(seed)
      expect(challenge?.challengeId).not.toBe('2019/20:all')
    }
    expect(kitChallengeCount()).toBeGreaterThan(5)
  })
})

describe('timeline', () => {
  it('deals five undated cards — the dates stay on the server', () => {
    const cards = dealTimeline(4)
    expect(cards).toHaveLength(TIMELINE_LENGTH)
    expect(JSON.stringify(cards)).not.toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  it('leaks no year in a card title or hint', () => {
    for (const seed of [1, 4, 6, 9]) {
      for (const card of dealTimeline(seed)) {
        expect(`${card.title} ${card.hint}`, card.title).not.toMatch(/\b(1[89]|20)\d{2}\b/)
      }
    }
  })

  it('grades the true chronological order as correct', () => {
    const solution = gradeTimeline(4, []).solution.map((item) => item.id)
    expect(gradeTimeline(4, solution).correct).toBe(true)
  })

  it('rejects a wrong order and still reveals the real one', () => {
    const solution = gradeTimeline(4, []).solution.map((item) => item.id)
    const swapped = [solution[1], solution[0], ...solution.slice(2)] as string[]
    const verdict = gradeTimeline(4, swapped)
    expect(verdict.correct).toBe(false)
    expect(verdict.solution).toHaveLength(TIMELINE_LENGTH)
  })

  it('returns the solution sorted oldest first', () => {
    const dates = gradeTimeline(4, []).solution.map((item) => item.on)
    expect([...dates].sort()).toEqual(dates)
  })

  it('never shows two cards from the same date', () => {
    const dates = gradeTimeline(6, []).solution.map((item) => item.on)
    expect(new Set(dates).size).toBe(dates.length)
  })
})

describe('lineup', () => {
  it('keeps every slot inside the pitch on the narrowest screen', () => {
    for (const formation of Object.values(FORMATIONS)) {
      for (const slot of formation.slots) {
        // chip is 22% wide, centred — so its centre must stay 11% off each touchline
        expect(slot.x, `${formation.name} ${slot.slotId}`).toBeGreaterThanOrEqual(11)
        expect(slot.x, `${formation.name} ${slot.slotId}`).toBeLessThanOrEqual(89)
      }
    }
  })

  it('gives every formation eleven slots with unique ids', () => {
    for (const formation of Object.values(FORMATIONS)) {
      expect(formation.slots, formation.name).toHaveLength(11)
      expect(new Set(formation.slots.map((slot) => slot.slotId)).size).toBe(11)
    }
  })

  it('never offers a basketball name on a football pitch', () => {
    expect(freeBuildBank()).not.toContain('מאור הראל')
    expect(freeBuildBank()).not.toContain('אורי שלף')
    // Small on purpose: only players a source actually names reach the bank.
    expect(freeBuildBank().length).toBeGreaterThanOrEqual(4)
  })

  it('never invents an XI — every record traces to a source', () => {
    const challenge = dealChallenge(2)
    expect(challenge?.sourceUrl).toContain('red-fans')
  })
})

describe('goal re-enactment', () => {
  it('deals the steps without their destinations', () => {
    const challenge = dealGoal(1)
    expect(challenge).not.toBeNull()
    expect(challenge?.steps.length).toBeGreaterThanOrEqual(3)
    // `to` is the answer and must never be in the payload
    expect(JSON.stringify(challenge)).not.toContain('"to"')
  })

  it('accepts a placement inside the tolerance and rejects one outside', () => {
    const truth = gradeGoal(1, [])?.steps.map((step) => step.actual) ?? []
    expect(truth.length).toBeGreaterThan(0)

    const exact = gradeGoal(1, truth)
    expect(exact?.hits).toBe(exact?.total)

    const wayOff = gradeGoal(
      1,
      truth.map((point) => ({ x: (point.x + 50) % 100, y: (point.y + 60) % 100 })),
    )
    expect(wayOff?.hits).toBe(0)
  })

  it('reveals the real path and the narrative only after grading', () => {
    const verdict = gradeGoal(1, [])
    expect(verdict?.narrativeHe).toContain('קלשצ')
    expect(verdict?.steps.every((step) => step.actual.x >= 0 && step.actual.y >= 0)).toBe(true)
  })

  it('scores an empty submission as zero rather than throwing', () => {
    const verdict = gradeGoal(1, [])
    expect(verdict?.hits).toBe(0)
  })
})

describe('the verified Chelsea XI', () => {
  it('turns the lineup game on', () => {
    expect(hasVerifiedLineup()).toBe(true)
    const challenge = dealChallenge(2)
    expect(challenge?.formation.slots).toHaveLength(11)
    expect(challenge?.bank.length).toBeGreaterThanOrEqual(11)
  })

  it('grades a correct XI as eleven exact', () => {
    const solution = gradeLineup(2, {})?.solution ?? []
    expect(solution).toHaveLength(11)
    const picks = Object.fromEntries(solution.map((row) => [row.slotId, row.name]))
    expect(gradeLineup(2, picks)?.exact).toBe(11)
  })

  it('marks a bench player as not in the XI', () => {
    const verdict = gradeLineup(2, { GK: 'ניר רחמין' })
    expect(verdict?.slots.find((slot) => slot.slotId === 'GK')?.status).toBe('not_in_xi')
  })

  it('marks a keeper played outfield as the wrong line', () => {
    const verdict = gradeLineup(2, { F1: 'שביט אלימלך' })
    expect(verdict?.slots.find((slot) => slot.slotId === 'F1')?.status).toBe('wrong_slot')
  })
})
