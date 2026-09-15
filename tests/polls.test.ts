import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { BALLOT, NUMBERS, POSITIONS, ballotComplete, ballotFilled, type Tally } from '@/lib/polls/ballot'
import { boardDisplay, histogramBars, positionBars, rankRows, MIN_BALLOTS_FOR_PERCENT } from '@/lib/polls/board'
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
    for (const path of [
      'app/polls/BallotSheet.tsx',
      'components/ballot/BallotSlip.tsx',
      'app/polls/board/page.tsx',
      'app/polls/board/CountBoard.tsx',
      'lib/polls/board.ts',
    ]) {
      expect(readFileSync(join(ROOT, path), 'utf8'), path).not.toContain('localStorage')
    }
    expect(store).toContain('localStorage')
  })

  it('is async on every call, so the screen is already written for a round trip', () => {
    for (const signature of [
      'read(): Promise<Ballot>',
      'save(questionId: string, pick: string): Promise<void>',
      'clear(): Promise<void>',
      'tally(questionId: string): Promise<Tally | null>',
      // Sealing is a fifth call, added for the committee-sheet document (B1): a
      // separate fact from the picks, so `read()` never had to change shape to carry
      // it, and the count board's own route can ask for it without touching a picks.
      'sealed(): Promise<boolean>',
      'seal(): Promise<void>',
    ]) {
      expect(store, signature).toContain(signature)
    }
  })

  it('clears the seal along with the picks, so "פתק חדש" is a clean slate', () => {
    // Two keys, so `read()` never had to grow a wrapper shape — but `clear()` has to
    // know about both, or a fresh slip would open already sealed.
    expect(store).toMatch(/SEAL_KEY/)
    const clearBody = store.slice(store.indexOf('async clear'), store.indexOf('async tally'))
    expect(clearBody, 'clear() must drop the seal, not only the picks').toContain('SEAL_KEY')
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
    for (const path of [
      'lib/polls/ballot.ts',
      'lib/polls/store.ts',
      'lib/polls/board.ts',
      'app/polls/BallotSheet.tsx',
      'components/ballot/BallotSlip.tsx',
      'app/polls/board/page.tsx',
      'app/polls/board/CountBoard.tsx',
    ]) {
      const text = readFileSync(join(ROOT, path), 'utf8')
      // A tally that arrives from anywhere other than a store is a fabricated one. The
      // whole wing is built on there being no such thing (rule 11).
      expect(text, path).not.toMatch(/votes:\s*\d/)
      expect(text, path).not.toMatch(/Math\.random/)
    }
  })

  it('ships no "מוקאפ" badge — there is no demo data to warn anybody about', () => {
    // Checked as the reference's own badge phrase, not the bare word "מוקאפ" — this
    // file's doc comment above uses that word to EXPLAIN the omission, which is not
    // the same thing as shipping the badge it is explaining.
    for (const path of ['app/polls/board/page.tsx', 'app/polls/board/CountBoard.tsx']) {
      const text = readFileSync(join(ROOT, path), 'utf8')
      expect(text, path).not.toContain('נתוני הדגמה')
    }
  })

  it('says out loud, in the catalogue, that there is no count yet', () => {
    expect(catalogue['poll.noCount']).toBeTruthy()
    expect(catalogue['poll.noCountBody']).toContain('ממציאים')
  })
})

/**
 * לוח הספירה — the count board's arithmetic, exercised entirely with fixture tallies.
 *
 * `LocalBallotStore.tally()` always resolves `null` (see the describe block above), so
 * these three shapes never actually render from real data in this build. That is the
 * point: the brief asks for the ≥100 and <100 renderers to be "covered by tests with
 * fixture data rather than by seeded rows in the product", and this is that coverage —
 * `lib/polls/board.ts` never reads a store, so nothing here touches one either.
 */
describe('לוח הספירה — כלל המאה, על נתוני בדיקה בלבד', () => {
  it('shows the honesty plate with no tally at all', () => {
    expect(boardDisplay(null, null).kind).toBe('honest')
  })

  it('shows the honesty plate when the only vote on record is your own', () => {
    const tally: Tally = { total: 1, rows: [{ pick: 'יוסי אבוקסיס', votes: 1 }] }
    expect(boardDisplay(tally, 'יוסי אבוקסיס').kind).toBe('honest')
  })

  it('does not call a single vote "yours" when it belongs to somebody else', () => {
    // one real ballot that is not yours is a raw count of one, not the honesty plate —
    // and never printed as a lonely 100%
    const tally: Tally = { total: 1, rows: [{ pick: 'שמעון גרשון', votes: 1 }] }
    const display = boardDisplay(tally, 'יוסי אבוקסיס')
    expect(display.kind).toBe('raw')
    if (display.kind === 'raw') expect(display.remaining).toBe(MIN_BALLOTS_FOR_PERCENT - 1)
  })

  it('prints exact integers, no bar and no percent, under a hundred ballots', () => {
    const tally: Tally = {
      total: 63,
      rows: [
        { pick: 'ציקי קוטלר', votes: 29 },
        { pick: 'ערן זהבי', votes: 11 },
      ],
    }
    const display = boardDisplay(tally, 'ציקי קוטלר')
    expect(display.kind).toBe('raw')
    if (display.kind === 'raw') {
      expect(display.remaining).toBe(37)
      expect(display.myMajority).toBe(true)
    }
  })

  it('only earns a percentage at a hundred ballots, not at ninety-nine', () => {
    const under: Tally = { total: 99, rows: [{ pick: 'א', votes: 99 }] }
    const over: Tally = { total: 100, rows: [{ pick: 'א', votes: 100 }] }
    expect(boardDisplay(under, 'א').kind).toBe('raw')
    expect(boardDisplay(over, 'א').kind).toBe('percent')
  })

  it('marks your pick with or against the lead once there is a real count', () => {
    const tally: Tally = {
      total: 200,
      rows: [
        { pick: 'יוסי אבוקסיס', votes: 120 },
        { pick: 'שמעון גרשון', votes: 80 },
      ],
    }
    const withLead = boardDisplay(tally, 'יוסי אבוקסיס')
    const against = boardDisplay(tally, 'שמעון גרשון')
    if (withLead.kind === 'percent') expect(withLead.myMajority).toBe(true)
    else throw new Error('expected percent')
    if (against.kind === 'percent') expect(against.myMajority).toBe(false)
    else throw new Error('expected percent')
  })

  it('ranks rows by votes, rounds a percentage and marks only the top three', () => {
    const rows = rankRows(
      [
        { pick: 'א', votes: 31 },
        { pick: 'ב', votes: 22 },
        { pick: 'ג', votes: 17 },
        { pick: 'ד', votes: 11 },
        { pick: 'ה', votes: 8 },
      ],
      89,
    )
    expect(rows.map((row) => row.pick)).toEqual(['א', 'ב', 'ג', 'ד', 'ה'])
    expect(rows[0]!.top).toBe(true)
    expect(rows[2]!.top).toBe(true)
    expect(rows[3]!.top).toBe(false)
    expect(rows[0]!.pct).toBe(35) // 31 / 89, rounded
  })

  it('draws the shirt-number histogram over the full picker range, not only the numbers somebody chose', () => {
    const tally: Tally = {
      total: 3,
      rows: [
        { pick: '7', votes: 2 },
        { pick: '99', votes: 1 },
      ],
    }
    const bars = histogramBars(tally, NUMBERS)
    expect(bars).toHaveLength(NUMBERS.length)
    expect(bars.find((bar) => bar.n === 7)?.votes).toBe(2)
    expect(bars.find((bar) => bar.n === 50)?.votes).toBe(0)
  })

  it('lists every position even when some of the eight never received a vote', () => {
    const tally: Tally = { total: 4, rows: [{ pick: catalogue['pos.gk']!, votes: 4 }] }
    const rows = positionBars(tally, POSITIONS, (he) => catalogue[he] ?? he)
    expect(rows).toHaveLength(POSITIONS.length)
    expect(rows.find((row) => row.pick === catalogue['pos.cb'])?.votes).toBe(0)
    expect(rows.find((row) => row.pick === catalogue['pos.gk'])?.votes).toBe(4)
  })
})
