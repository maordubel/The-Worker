import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildBoard, buildRound, type MemoryCard } from '@/lib/game/memory'
import {
  ECHO_STREAK,
  closeOpen,
  echoMate,
  finished,
  flip,
  morale,
  numericFace,
  spendEcho,
  spendFlash,
  startRun,
  verdict,
  wallLit,
  type MemoryRun,
} from '@/lib/game/memory-run'
import messages from '@/messages/he.json'

const ROOT = join(__dirname, '..')
const catalogue = messages as Record<string, string>

/** Play a whole board correctly: turn each pair's two cards, in order, with no miss. */
function perfectRun(cards: readonly MemoryCard[], pairs: readonly { id: string }[]): MemoryRun {
  let run = startRun()
  for (const pair of pairs) {
    for (const card of cards.filter((item) => item.pair === pair.id)) {
      const outcome = flip(run, cards, card.id)
      run = outcome.run
    }
  }
  return run
}

/** The two cards of the first pair that is NOT `avoid` — a guaranteed wrong move. */
function mismatched(cards: readonly MemoryCard[]): [string, string] {
  const a = cards[0]!
  const b = cards.find((card) => card.pair !== a.pair)!
  return [a.id, b.id]
}

describe('שער 6 — the deck', () => {
  it('deals the pairs and the cards from one address into the rotation', () => {
    const round = buildRound(7)
    expect(round.pairs).toHaveLength(6)
    expect(round.cards).toHaveLength(12)
    // `buildBoard` must be exactly this round's card list — two entry points into the
    // same pool would each have to call `positionOf` and could drift apart (rule 59).
    expect(buildBoard(7)).toEqual(round.cards)
  })

  it('gives every pair both its faces, and each face its own object', () => {
    const { pairs, cards } = buildRound(19)
    for (const pair of pairs) {
      const both = cards.filter((card) => card.pair === pair.id)
      expect(both, pair.id).toHaveLength(2)
      expect(both.map((card) => card.side).sort()).toEqual(['answer', 'memory'])
      // The memory face carries the pair's own object; the answer face carries what
      // dates or counts it. Same object on both would make the closed board uniform.
      const memory = both.find((card) => card.side === 'memory')!
      const answer = both.find((card) => card.side === 'answer')!
      expect(memory.object).toBe(pair.object)
      expect(memory.face).toBe(pair.a)
      expect(answer.face).toBe(pair.b)
      expect(answer.object === 'season' || answer.object === 'count').toBe(true)
    }
  })

  it('never derives an object from anything but the row it came from', () => {
    // The object is a statement about which archive table the candidate is from, so the
    // file may not contain a random or a rotating choice (rule 11's shape, for artwork).
    const source = readFileSync(join(ROOT, 'lib/game/memory.ts'), 'utf8')
    expect(source).not.toContain('Math.random')
  })

  it('keeps the shelf in the deal order so a slot never moves under the player', () => {
    // The cards are shuffled; the pairs are not. A shelf that re-sorted with the board
    // would move a slot the player had already learned the position of.
    const first = buildRound(31)
    const second = buildRound(31)
    expect(first.pairs.map((pair) => pair.id)).toEqual(second.pairs.map((pair) => pair.id))
  })
})

describe('שער 6 — הריצה', () => {
  const { cards, pairs } = buildRound(7)

  it('opens one card and waits, and counts a move only on the second', () => {
    const run = startRun()
    const first = flip(run, cards, cards[0]!.id)
    expect(first.kind).toBe('open')
    expect(first.run.moves).toBe(0)
    const [, other] = mismatched(cards)
    const second = flip(first.run, cards, other)
    expect(second.kind).toBe('miss')
    expect(second.run.moves).toBe(1)
  })

  it('ignores a tap that cannot mean anything', () => {
    let run = startRun()
    run = flip(run, cards, cards[0]!.id).run
    // the same card again, a third card while two are up, and an unknown id
    expect(flip(run, cards, cards[0]!.id).kind).toBe('ignored')
    const [a, b] = mismatched(cards)
    const two = flip(flip(startRun(), cards, a).run, cards, b).run
    expect(flip(two, cards, cards[4]!.id).kind).toBe('ignored')
    expect(flip(startRun(), cards, 'nothing:like:this').kind).toBe('ignored')
  })

  it('never lets a matched pair be flipped again', () => {
    const pair = pairs[0]!
    const [a, b] = cards.filter((card) => card.pair === pair.id)
    let run = startRun()
    run = flip(run, cards, a!.id).run
    const closed = flip(run, cards, b!.id)
    expect(closed.kind).toBe('pair')
    expect(flip(closed.run, cards, a!.id).kind).toBe('ignored')
  })

  it('calls a pair perfect only when nothing was missed since the previous one', () => {
    const pair = pairs[0]!
    const [a, b] = cards.filter((card) => card.pair === pair.id)
    const clean = flip(flip(startRun(), cards, a!.id).run, cards, b!.id)
    expect(clean.kind === 'pair' && clean.perfect).toBe(true)

    // the same pair, after one wrong move
    const [x, y] = mismatched(cards)
    let dirty = closeOpen(flip(flip(startRun(), cards, x).run, cards, y).run)
    dirty = flip(dirty, cards, a!.id).run
    const after = flip(dirty, cards, b!.id)
    expect(after.kind === 'pair' && after.perfect).toBe(false)
    // and the NEXT pair is perfect again — the counter resets with the pair, not the run
    expect(after.run.missesSincePair).toBe(0)
  })

  it('arms the echo on the third pair in a row and never on the second', () => {
    let run = startRun()
    for (const [index, pair] of pairs.entries()) {
      for (const card of cards.filter((item) => item.pair === pair.id)) {
        run = flip(run, cards, card.id).run
      }
      if (index + 1 < ECHO_STREAK) expect(run.echo, `after ${index + 1} pairs`).toBe('idle')
      else expect(run.echo, `after ${index + 1} pairs`).not.toBe('idle')
    }
  })

  it('a miss breaks the streak, so three pairs with a miss between them arm nothing', () => {
    let run = startRun()
    for (const pair of pairs.slice(0, 3)) {
      // A deliberate wrong move first, using two cards from OTHER pairs that are still
      // in play — the miss has to actually register, or this test proves nothing.
      const open = cards.filter((card) => !run.done.includes(card.pair) && card.pair !== pair.id)
      const x = open[0]!
      const y = open.find((card) => card.pair !== x.pair)!
      const missed = flip(flip(run, cards, x.id).run, cards, y.id)
      expect(missed.kind).toBe('miss')
      run = closeOpen(missed.run)

      for (const card of cards.filter((item) => item.pair === pair.id)) {
        run = flip(run, cards, card.id).run
      }
    }
    expect(run.done).toHaveLength(3)
    expect(run.misses).toBe(3)
    expect(run.streak).toBe(1)
    expect(run.echo).toBe('idle')
  })

  it('points the echo at the partner, and at nothing once the pair is closed', () => {
    const armed: MemoryRun = { ...startRun(), echo: 'armed' }
    const card = cards[0]!
    const mate = cards.find((item) => item.pair === card.pair && item.id !== card.id)!
    expect(echoMate(armed, cards, card.id)).toBe(mate.id)

    // a hint about a pair already found would spend the run's one charge on nothing
    const closed: MemoryRun = { ...armed, done: [card.pair] }
    expect(echoMate(closed, cards, card.id)).toBeNull()
    // and an idle or spent run never echoes at all
    expect(echoMate(startRun(), cards, card.id)).toBeNull()
    expect(echoMate({ ...armed, echo: 'spent' }, cards, card.id)).toBeNull()

    // nor on the SECOND card of a move: the partner it would point at is the card
    // already face up, and the run's one charge would be spent on a hint about it
    const mid: MemoryRun = { ...armed, open: [card.id] }
    expect(echoMate(mid, cards, mate.id)).toBeNull()
  })

  it('spends the echo once and cannot re-arm it in the same run', () => {
    const armed: MemoryRun = { ...startRun(), echo: 'armed' }
    const spent = spendEcho(armed)
    expect(spent.echo).toBe('spent')
    expect(spendEcho(spent).echo).toBe('spent')

    // a long streak on a run that has already spent it does not bank a second charge
    let run: MemoryRun = { ...startRun(), echo: 'spent' }
    for (const pair of pairs) {
      for (const card of cards.filter((item) => item.pair === pair.id)) {
        run = flip(run, cards, card.id).run
      }
    }
    expect(run.echo).toBe('spent')
  })

  it('gives one extra flash per run', () => {
    const once = spendFlash(startRun())
    expect(once.flashUsed).toBe(true)
    expect(spendFlash(once)).toBe(once)
  })

  it('reports morale as a fraction of the count and lights the wall at half', () => {
    const run = startRun()
    expect(morale(run, 6)).toBe(0)
    expect(morale({ ...run, done: ['a', 'b', 'c'] }, 6)).toBe(0.5)
    expect(wallLit({ ...run, done: ['a', 'b'] }, 6)).toBe(false)
    expect(wallLit({ ...run, done: ['a', 'b', 'c'] }, 6)).toBe(true)
    // an empty board can never divide by zero into a percentage
    expect(morale(run, 0)).toBe(0)
    expect(finished(run, 0)).toBe(false)
  })

  it('finishes a whole board, in the fewest moves there are', () => {
    const run = perfectRun(cards, pairs)
    expect(finished(run, pairs.length)).toBe(true)
    expect(run.moves).toBe(pairs.length)
    expect(run.misses).toBe(0)
    expect(run.bestStreak).toBe(pairs.length)
    expect(run.perfect).toHaveLength(pairs.length)
    expect(verdict(run, pairs.length)).toBe('flawless')
  })

  it('grades the closing line off counters, never off a mood', () => {
    const base = startRun()
    expect(verdict({ ...base, misses: 0, moves: 6 }, 6)).toBe('flawless')
    expect(verdict({ ...base, misses: 2, moves: 8 }, 6)).toBe('sharp')
    expect(verdict({ ...base, misses: 5, moves: 14 }, 6)).toBe('solid')
    expect(verdict({ ...base, misses: 9, moves: 20 }, 6)).toBe('lit')
  })

  it('has every closing line and hint in the catalogue', () => {
    for (const key of [
      'memory.verdict.flawless',
      'memory.verdict.sharp',
      'memory.verdict.solid',
      'memory.verdict.lit',
      'memory.hint.start',
      'memory.hint.photograph',
      'memory.hint.find',
      'memory.hint.remember',
      'memory.hint.wrong',
      'memory.hint.locked',
      'memory.hint.hot',
      'memory.hint.echo',
      'memory.echo.idle',
      'memory.echo.armed',
      'memory.echo.spent',
      'memory.fusion.perfect',
      'memory.shelf.locked',
    ]) {
      expect(catalogue[key], key).toBeTruthy()
    }
  })
})

describe('שער 6 — פנים שהן מספר מבודדות LTR', () => {
  it('isolates a season, a year and a span, and leaves a sentence alone', () => {
    // The bug this exists for: `2017/18–2021/22` printed in an RTL line puts the en
    // dash on the wrong side, because a neutral between two numbers resolves to the
    // paragraph's direction. Seen in a browser at 390px on seed 7.
    expect(numericFace('2017/18–2021/22')).toBe(true)
    expect(numericFace('1987/88')).toBe(true)
    expect(numericFace('1938')).toBe(true)
    expect(numericFace('2004/05–2005/06')).toBe(true)
    // and a sentence is left alone — isolating a whole Hebrew run MOVES the words in it
    // (rule 69 §7: `<Num>` isolates a digit, not a sentence)
    expect(numericFace('210 קולות')).toBe(false)
    expect(numericFace('גביע המדינה')).toBe(false)
    expect(numericFace('')).toBe(false)
    expect(numericFace('—')).toBe(false)
  })

  it('prints every face the deck can deal through that decision', () => {
    // Not a sample: every face on every board of twenty seeds is either a pure figure
    // that gets isolated or a phrase that does not — the point is that no third case
    // exists for a component to guess about.
    for (let seed = 1; seed <= 20; seed += 1) {
      for (const card of buildRound(seed).cards) {
        expect(typeof numericFace(card.face), card.face).toBe('boolean')
        if (/^[0-9/–]+$/.test(card.face)) expect(numericFace(card.face), card.face).toBe(true)
      }
    }
  })

  it('wires that decision into every place a face is printed', () => {
    for (const path of [
      'components/memory/ArchiveCard.tsx',
      'components/memory/FusionPlate.tsx',
      'components/memory/SouvenirShelf.tsx',
      'app/memory/MemoryBoard.tsx',
    ]) {
      expect(readFileSync(join(ROOT, path), 'utf8'), path).toContain('numericFace')
    }
  })
})

describe('שער 6 — המדף לא מדליף את התשובה', () => {
  it('prints the category, never the memory, under a locked slot', () => {
    // The same rule gate 5 arrived at for a shirt nobody has built (rule 24): a locked
    // souvenir showing its pair's second face would be the board's answer sheet sitting
    // beside the board.
    const shelf = readFileSync(join(ROOT, 'components/memory/SouvenirShelf.tsx'), 'utf8')
    expect(shelf).toContain("unlocked ? face(pair.a) : pair.kind")
    expect(shelf).toContain("unlocked ? face(pair.b) : t('memory.shelf.locked')")
  })

  it('keeps the shelf count in the profile rather than in a store of its own', () => {
    const board = readFileSync(join(ROOT, 'app/memory/MemoryBoard.tsx'), 'utf8')
    expect(board).toContain("from '@/lib/profile/store'")
    expect(board).not.toContain('localStorage')
  })
})
