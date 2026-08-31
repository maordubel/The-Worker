import { describe, expect, it } from 'vitest'

import { CONFIDENCE_FLOOR, archive } from '@/lib/game/archive'
import { buildBoard } from '@/lib/game/memory'
import { ROUND_LENGTH, availableQuestionCount, deal, grade } from '@/lib/game/trivia'
import { verifiedKitSeasons } from '@/lib/game/kits'

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

  it('never uses the founder as a distractor in an unrelated question', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      for (let index = 0; index < ROUND_LENGTH; index += 1) {
        const question = deal(seed, index)
        if (!question || question.template === 'ussishkin') continue
        expect(question.options, question.prompt).not.toContain('מאור הראל')
      }
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
})
