import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { BALLOT, NUMBERS, POSITIONS, ballotComplete, ballotFilled } from '@/lib/polls/ballot'
import messages from '@/messages/he.json'

const ROOT = join(__dirname, '..')
const catalogue = messages as Record<string, string>

describe('שער 7 — אגף הסקרים', () => {
  it('asks each question once', () => {
    const ids = BALLOT.map((question) => question.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has every question in the catalogue, in both languages the slip prints', () => {
    for (const question of BALLOT) {
      expect(catalogue[question.ask], `${question.id} has no Hebrew`).toBeTruthy()
      // The Latin line is printed on the share card, so an empty one is a hole in the
      // artwork rather than a missing translation — it is checked here, not in i18n.
      expect(question.latin.trim().length, `${question.id} has no Latin line`).toBeGreaterThan(0)
      expect(question.latin).toMatch(/^[A-Z0-9 ·'-]+$/)
    }
  })

  it('gives every position a Hebrew name and a distinct code', () => {
    for (const position of POSITIONS) {
      expect(catalogue[position.he], `${position.id}`).toBeTruthy()
    }
    expect(new Set(POSITIONS.map((position) => position.id)).size).toBe(POSITIONS.length)
  })

  it('offers a squad number, not a starting eleven', () => {
    expect(NUMBERS[0]).toBe(1)
    expect(NUMBERS[NUMBERS.length - 1]).toBe(99)
    expect(NUMBERS).toHaveLength(99)
  })

  it('counts a partly filled slip and knows when it is finished', () => {
    expect(ballotFilled({})).toBe(0)
    expect(ballotComplete({})).toBe(false)
    const half = Object.fromEntries(
      BALLOT.slice(0, 3).map((question) => [question.id, 'שם'] as const),
    )
    expect(ballotFilled(half)).toBe(3)
    expect(ballotComplete(half)).toBe(false)
    const all = Object.fromEntries(BALLOT.map((question) => [question.id, 'שם'] as const))
    expect(ballotComplete(all)).toBe(true)
  })

  it('ignores a stale key and an empty pick when counting', () => {
    // The local store reads back whatever the browser kept, which may be a ballot from
    // a build with different questions in it. A count that trusted the object's keys
    // would report 9/8 to somebody who last voted a version ago.
    expect(ballotFilled({ retired: 'שם', [BALLOT[0]!.id]: '' })).toBe(0)
  })
})

describe('הקלפי — the storage seam', () => {
  const store = readFileSync(join(ROOT, 'lib/polls/store.ts'), 'utf8')

  it('keeps localStorage behind the interface, so the screen never sees it', () => {
    const screen = readFileSync(join(ROOT, 'app/polls/BallotSheet.tsx'), 'utf8')
    expect(screen).not.toContain('localStorage')
    expect(store).toContain('localStorage')
  })

  it('is async on every call, so the screen is already written for a round trip', () => {
    for (const signature of [
      'read(): Promise<Ballot>',
      'save(questionId: string, pick: string): Promise<void>',
      'clear(): Promise<void>',
      'tally(questionId: string): Promise<Tally | null>',
    ]) {
      expect(store, signature).toContain(signature)
    }
  })

  it('never wraps a browser API without a catch', () => {
    // A poll that throws during render because the browser blocks site data is a worse
    // failure than a poll that forgets a vote.
    const uses = store.split('\n').filter((line) => line.includes('window.localStorage'))
    expect(uses.length).toBeGreaterThan(0)
    expect(store.match(/catch\s*\{/g)?.length ?? 0).toBeGreaterThanOrEqual(uses.length)
  })

  it('reports honestly that it cannot count a terrace', () => {
    expect(store).toContain('readonly countable = false')
  })
})

describe('הפתק לא ממציא קולות', () => {
  it('ships no seeded or baseline vote anywhere in the wing', () => {
    for (const path of ['lib/polls/ballot.ts', 'lib/polls/store.ts', 'app/polls/BallotSheet.tsx']) {
      const text = readFileSync(join(ROOT, path), 'utf8')
      // A tally that arrives from anywhere other than a store is a fabricated one. The
      // whole wing is built on there being no such thing (rule 11).
      expect(text, path).not.toMatch(/votes:\s*\d/)
      expect(text, path).not.toMatch(/Math\.random/)
    }
  })

  it('says out loud, in the catalogue, that there is no count yet', () => {
    expect(catalogue['poll.noCount']).toBeTruthy()
    expect(catalogue['poll.noCountBody']).toContain('ממציאים')
  })
})
