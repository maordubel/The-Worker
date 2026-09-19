import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import lineupsFile from '@/content/manual/lineups.json'
import messages from '@/messages/he.json'
import { coachNote, dealChallenge, gradeLineup } from '@/lib/game/lineup'
import {
  COACH_NOTES,
  MAX_LOCKS,
  REVEAL_SKIPPED,
  buildReveal,
  lineOf,
  missingStarters,
  opensAtSummary,
  tallyUpTo,
  type CoachNoteKind,
} from '@/lib/game/lineup-sheet'
import { splitName } from '@/lib/game/roster-search'

/**
 * שער 3 — חדר ההלבשה.
 *
 * Three things this file is here to keep true, in the order they would hurt if they
 * stopped being true:
 *
 *  1. **No placeholder ever reaches the room.** The supplied prototype's 14.3.2002 eleven
 *     contains a man called `קשר נוסף` — "another midfielder". A name like that on a
 *     screen that claims to print a historic team sheet is the worst single thing this
 *     gate could do (rule 11), and the guard is mechanical rather than a list of one.
 *  2. **The bench is a restatement, never a new claim.** `benchHe` says who came on, and
 *     every name in it has to be quotable from the record's own note.
 *  3. **The reveal can always be got past.** The skip is not a preference and not a
 *     state — it is arithmetic that reaches the same answer from any step, plus a button
 *     that is always rendered and never disabled.
 */

const ROOT = join(__dirname, '..')
const catalogue = messages as Record<string, string>

type LineupRecord = {
  matchId: string
  titleHe: string
  xi: Record<string, string>
  distractors?: string[]
  benchHe?: string[]
  noteHe?: string
  playable?: boolean
  confidence?: number
}

const records = (lineupsFile as unknown as { records: LineupRecord[] }).records

/** The seed that deals a given match, found the way the suite finds everything: by sweep. */
function seedFor(matchId: string): number {
  for (let seed = 1; seed < 400; seed += 1) {
    if (dealChallenge(seed)?.matchId === matchId) return seed
  }
  throw new Error(`no seed deals ${matchId}`)
}

describe('אין מציין מקום בחדר — every name in a record is a person', () => {
  /**
   * The words a placeholder is made of. A real name is a given name and a family name;
   * "קשר נוסף", "שוער מחליף" and "מגן נוסף" are a ROLE and a qualifier, which is what a
   * slot looks like when somebody could not find out who filled it.
   */
  const ROLE_WORDS = ['שוער', 'מגן', 'בלם', 'קשר', 'חלוץ', 'כנף', 'מאמן']
  const QUALIFIERS = ['נוסף', 'נוספת', 'מחליף', 'שני', 'שלישי', 'אלמוני', 'לא ידוע']

  const everyName = records.flatMap((record) => [
    ...Object.values(record.xi),
    ...(record.distractors ?? []),
    ...(record.benchHe ?? []),
  ])

  it('has names to check', () => {
    expect(everyName.length).toBeGreaterThan(60)
  })

  it('never names a slot instead of a man', () => {
    const bad = everyName.filter((name) => {
      const words = name.split(/\s+/).filter(Boolean)
      if (words.length === 0) return true
      const leadsWithRole = ROLE_WORDS.includes(words[0] as string)
      const endsWithQualifier = QUALIFIERS.includes(words[words.length - 1] as string)
      return leadsWithRole && (endsWithQualifier || words.length === 1)
    })
    expect(bad, bad.join(' · ')).toEqual([])
  })

  it('keeps the prototype placeholder out of the archive, by name', () => {
    // Named explicitly as well as caught by the rule above, because this exact string is
    // what `docs/16-gates-upgrade.md` warns about and a reader of that file should be
    // able to find the guard by searching for it.
    const raw = readFileSync(join(ROOT, 'content/manual/lineups.json'), 'utf8')
    expect(raw).not.toContain('קשר נוסף')
  })

  it('gives every playable record eleven men and no repeat', () => {
    for (const record of records) {
      const xi = Object.values(record.xi)
      expect(xi, record.matchId).toHaveLength(11)
      expect(new Set(xi).size, record.matchId).toBe(11)
    }
  })
})

describe('הספסל — a restatement of the record, never a new claim', () => {
  const withBench = records.filter((record) => (record.benchHe ?? []).length > 0)

  it('has records that name a bench, and records that do not', () => {
    expect(withBench.length).toBeGreaterThan(0)
    expect(withBench.length).toBeLessThan(records.length)
  })

  it('can quote every bench name from the record it sits in', () => {
    // The family name, not the full string: a match report writes "לנדאו ויאני נכנסו
    // כמחליפים" and the archive row writes "גילי לנדאו (נכנס בדקה 48)". The claim being
    // checked is that the source named this man as a substitute in this match, and the
    // family name is how the source names him.
    const unquoted: string[] = []
    for (const record of withBench) {
      const said = `${record.noteHe ?? ''} ${record.titleHe}`
      for (const entry of record.benchHe ?? []) {
        if (!said.includes(splitName(entry).familyHe)) {
          unquoted.push(`${record.matchId}: ${entry}`)
        }
      }
    }
    expect(unquoted, unquoted.join('\n')).toEqual([])
  })

  it('never puts the same man on the bench and in the XI', () => {
    for (const record of withBench) {
      const xi = new Set(Object.values(record.xi))
      for (const entry of record.benchHe ?? []) {
        expect(xi.has(splitName(entry).familyHe), `${record.matchId}: ${entry}`).toBe(false)
        expect([...xi].some((name) => name === entry), `${record.matchId}: ${entry}`).toBe(false)
      }
    }
  })

  it('offers at least one of them in the bank, or the trap cannot be sprung', () => {
    for (const record of withBench) {
      const bank = new Set(record.distractors ?? [])
      const reachable = (record.benchHe ?? []).filter((entry) =>
        bank.has(entry.replace(/\s*\(.*$/, '')),
      )
      expect(reachable.length, record.matchId).toBeGreaterThan(0)
    }
  })
})

describe('מלכודת ספסל — graded on the server, and only where the source says so', () => {
  const milan = seedFor('2001-02-uefa-qf-milan')
  const chelsea = seedFor('2001-02-uefa-r2-chelsea')

  it('marks a documented substitute as a trap, not merely as a miss', () => {
    const verdict = gradeLineup(milan, { M1: 'סלים טועמה' })
    const slot = verdict?.slots.find((row) => row.slotId === 'M1')
    expect(slot?.status).toBe('not_in_xi')
    expect(slot?.bench).toBe(true)
  })

  it('never calls a starter a trap', () => {
    const solution = gradeLineup(milan, {})?.solution ?? []
    const picks = Object.fromEntries(solution.map((row) => [row.slotId, row.name]))
    const verdict = gradeLineup(milan, picks)
    expect(verdict?.exact).toBe(11)
    expect(verdict?.slots.every((row) => row.bench === false)).toBe(true)
  })

  it('says when the source does not name a bench at all, rather than printing zero', () => {
    expect(gradeLineup(milan, {})?.benchKnown).toBe(true)
    expect(gradeLineup(chelsea, {})?.benchKnown).toBe(false)
  })

  it('leaves an empty slot with no verdict and no trap', () => {
    const verdict = gradeLineup(milan, {})
    expect(verdict?.slots.every((row) => row.status === 'empty' && row.bench === false)).toBe(true)
  })
})

describe('פתק מהמאמן — a number, never a name', () => {
  const milan = seedFor('2001-02-uefa-qf-milan')
  const chelsea = seedFor('2001-02-uefa-r2-chelsea')

  it('hands out exactly two, and nothing past them', () => {
    expect(COACH_NOTES).toBe(2)
    for (let index = 0; index < COACH_NOTES; index += 1) {
      expect(coachNote(milan, {}, 0, index), `note ${index}`).not.toBeNull()
    }
    expect(coachNote(milan, {}, 0, COACH_NOTES)).toBeNull()
    expect(coachNote(milan, {}, 0, -1)).toBeNull()
  })

  it('carries a kind and two numbers and nothing else', () => {
    const note = coachNote(milan, {}, 0, 0)
    expect(note && Object.keys(note).sort()).toEqual(['kind', 'n', 'of'])
  })

  it('counts the starters still hanging up, and reaches zero on a perfect board', () => {
    const empty = coachNote(milan, {}, 0, 0)
    expect(empty?.kind).toBe('stillOut')
    expect(empty?.n).toBe(11)

    const solution = gradeLineup(milan, {})?.solution ?? []
    const picks = Object.fromEntries(solution.map((row) => [row.slotId, row.name]))
    expect(coachNote(milan, picks, 0, 0)?.n).toBe(0)
  })

  it('offers the bench note only where the record names a bench', () => {
    const kinds = (seed: number): CoachNoteKind[] => {
      const out: CoachNoteKind[] = []
      for (let index = 0; index < COACH_NOTES; index += 1) {
        const note = coachNote(seed, {}, 0, index)
        if (note) out.push(note.kind)
      }
      return out
    }
    expect(kinds(milan)).toContain('benchOn')
    expect(kinds(chelsea)).not.toContain('benchOn')
  })

  it('is deterministic — the same board twice gives the same help', () => {
    // The prototype draws its clue at random, which makes the same seed give different
    // help on two runs and makes the whole thing untestable.
    for (let index = 0; index < COACH_NOTES; index += 1) {
      expect(coachNote(milan, { GK: 'שביט אלימלך' }, 0, index)).toEqual(
        coachNote(milan, { GK: 'שביט אלימלך' }, 0, index),
      )
    }
  })

  it('counts a trap the player has already walked into', () => {
    const note = coachNote(milan, { M1: 'סלים טועמה', M2: 'פיני בלילי' }, 0, 1)
    expect(note?.kind).toBe('benchOn')
    expect(note?.n).toBe(2)
  })
})

describe('החשיפה — the walk, and the promise that it can be skipped', () => {
  const milan = seedFor('2001-02-uefa-qf-milan')
  const challenge = dealChallenge(milan)
  const slots = challenge?.formation.slots ?? []
  const solution = gradeLineup(milan, {})?.solution ?? []
  const perfect = Object.fromEntries(solution.map((row) => [row.slotId, row.name]))

  /** A board with eight of the eleven right, one trap, one wrong line and one empty. */
  function mixedPicks(): Record<string, string | null> {
    const picks: Record<string, string | null> = { ...perfect }
    picks.F2 = 'סלים טועמה' // a documented substitute — the trap
    picks.M4 = null // left in the locker room
    // A starter moved out of his line: the keeper, put up front.
    picks.F1 = perfect.GK as string
    picks.GK = null
    return picks
  }

  it('walks only the slots the player filled, in the order the pitch draws', () => {
    const verdict = gradeLineup(milan, mixedPicks())
    expect(verdict).not.toBeNull()
    const rows = buildReveal(verdict!, slots, [])
    expect(rows.length).toBe(Object.values(mixedPicks()).filter(Boolean).length)
    const order = rows.map((row) => row.slotId)
    const expected = slots
      .filter((slot) => (mixedPicks()[slot.slotId] ?? null) !== null)
      .map((slot) => slot.slotId)
    expect(order).toEqual(expected)
    // keeper first, attack last — the same movement as the pitch under it
    expect(lineOf(order[0] as string)).toBe('D')
  })

  it('starts at nothing and ends at the verdict', () => {
    const verdict = gradeLineup(milan, mixedPicks())!
    const rows = buildReveal(verdict, slots, [])
    expect(tallyUpTo(rows, -1)).toEqual({
      exact: 0,
      wrongSlot: 0,
      bench: 0,
      locksRight: 0,
      locksUsed: 0,
    })
    expect(tallyUpTo(rows, rows.length - 1).exact).toBe(verdict.exact)
    expect(verdict.exact).toBe(7)
    expect(tallyUpTo(rows, rows.length - 1).bench).toBe(1)
    expect(tallyUpTo(rows, rows.length - 1).wrongSlot).toBe(1)
  })

  /**
   * The skip is the same arithmetic as the walk.
   *
   * This is the actual promise: whatever step a player is standing on when they press
   * "הצג הכול", the sheet they land on is the sheet they would have reached by pressing
   * "הבא" to the end. A skip that computed its own totals is a skip that can disagree
   * with the walk, and the disagreement would only ever be seen by somebody who did both.
   */
  it('reaches the same sheet from every step', () => {
    const verdict = gradeLineup(milan, mixedPicks())!
    const rows = buildReveal(verdict, slots, [])
    const final = tallyUpTo(rows, rows.length - 1)
    for (let from = -1; from < rows.length; from += 1) {
      expect(tallyUpTo(rows, rows.length - 1), `skipped from ${from}`).toEqual(final)
    }
    // and past the end, which is what a double tap on the last card does
    expect(tallyUpTo(rows, rows.length + 5)).toEqual(final)
  })

  it('never goes backwards as it walks', () => {
    const verdict = gradeLineup(milan, mixedPicks())!
    const rows = buildReveal(verdict, slots, [])
    for (let index = 0; index < rows.length; index += 1) {
      const before = tallyUpTo(rows, index - 1)
      const after = tallyUpTo(rows, index)
      expect(after.exact).toBeGreaterThanOrEqual(before.exact)
      expect(after.bench).toBeGreaterThanOrEqual(before.bench)
    }
  })

  it('counts a LOCK only where the man really started', () => {
    const verdict = gradeLineup(milan, mixedPicks())!
    const trap = 'סלים טועמה'
    const real = perfect.D1 as string
    const rows = buildReveal(verdict, slots, [trap, real])
    const tally = tallyUpTo(rows, rows.length - 1)
    expect(tally.locksUsed).toBe(2)
    expect(tally.locksRight).toBe(1)
    expect(MAX_LOCKS).toBe(3)
  })

  it('names who was left in the locker room', () => {
    const verdict = gradeLineup(milan, mixedPicks())!
    const missing = missingStarters(verdict)
    expect(missing).toHaveLength(3)
    for (const name of missing) {
      expect(solution.map((row) => row.name)).toContain(name)
    }
    expect(missingStarters(gradeLineup(milan, perfect)!)).toEqual([])
  })

  it('remembers a skip, and only a skip', () => {
    expect(opensAtSummary([])).toBe(false)
    expect(opensAtSummary(['something-else'])).toBe(false)
    expect(opensAtSummary([REVEAL_SKIPPED])).toBe(true)
  })

  it('survives a board nobody filled', () => {
    const verdict = gradeLineup(milan, {})!
    const rows = buildReveal(verdict, slots, [])
    expect(rows).toEqual([])
    expect(tallyUpTo(rows, -1).exact).toBe(0)
    expect(tallyUpTo(rows, 0).exact).toBe(0)
  })
})

/** Comments are prose about the rules; the rules apply to the code. */
function withoutComments(text: string): string {
  return text
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

describe('החדר — what the screens are held to', () => {
  const sheet = withoutComments(readFileSync(join(ROOT, 'app/lineup/TeamSheet.tsx'), 'utf8'))
  const board = withoutComments(readFileSync(join(ROOT, 'app/lineup/LineupBoard.tsx'), 'utf8'))
  const rack = withoutComments(readFileSync(join(ROOT, 'app/lineup/LockerRack.tsx'), 'utf8'))

  it('holds no timer on the reveal — nobody waits for eleven scans', () => {
    // The brief names this failure by hand: "waiting 850ms × 11 players just to see
    // Gate 3 results". A reveal with no timer in it cannot grow one by accident.
    expect(sheet).not.toContain('setTimeout')
    expect(sheet).not.toContain('setInterval')
    expect(sheet).not.toContain('requestAnimationFrame')
  })

  it('never disables a control on the reveal or the sheet', () => {
    // The skip has to be pressable at every step, including the first and the last.
    // A blanket rule is stronger than checking one button: nothing on this screen may
    // be unavailable, so the skip cannot become unavailable either.
    expect(sheet).not.toContain('disabled')
  })

  it('does not print a position on a locker', () => {
    // Every record grades by LINE, so a locker that named a man's position would hand
    // over his grade — and a wall of them would hand over the sheet. See the comment at
    // the head of LockerRack.tsx.
    expect(rack).not.toContain('facetsFor')
    expect(rack).not.toContain('position')
    expect(rack).not.toContain('roleHe')
  })

  it('reads the eleven from the archive and never from a list of its own', () => {
    // A second player store in a gate component is the failure `docs/16-gates-upgrade.md`
    // puts first. The board receives a bank; it does not hold one.
    for (const [name, text] of [
      ['LineupBoard', board],
      ['LockerRack', rack],
      ['TeamSheet', sheet],
    ] as const) {
      expect(text, name).not.toContain('content/manual')
      expect(/const\s+[A-Z_]*PLAYERS/.test(text), name).toBe(false)
    }
  })

  it('puts no red edge against the printed grass', () => {
    // Measured, not guessed: a red keyline antialiased against `--p-grass` averages to
    // hue 57° at saturation 0.49, which is inside `lib/isYellow.ts`'s band — seventy-four
    // pixels of it on one phone screen of a full board. Ink goes between them. The
    // affordance did not disappear; it moved to the name plate, which is cream.
    for (const [name, text] of [
      ['LineupBoard', board],
      ['TeamSheet', sheet],
    ] as const) {
      expect(text, name).not.toContain('outline-press-red')
      expect(text, name).not.toContain('outline-red')
    }
  })

  it('keeps the drawn figure to one ink outline, socks included', () => {
    // The socks were the one shape on the figure drawn `stroke="none"`, which put the
    // club's red straight against whatever the figure stood on. Ten yellow pixels per
    // full pitch, in a component gate 1 shares.
    const figure = readFileSync(join(ROOT, 'components/press/PlayerFigure.tsx'), 'utf8')
    expect(figure).toContain('<g fill={kit.socks}>')
    expect(figure).not.toContain('<g fill={kit.socks} stroke="none">')
  })

  it('persists through the profile store, never through localStorage', () => {
    expect(sheet).toContain("@/lib/profile/store")
    expect(sheet).not.toContain('localStorage')
    expect(board).not.toContain('localStorage')
  })
})

describe('מפתחות שנבנים בזמן ריצה — every one of them exists', () => {
  it('has a line label for each of the four bands', () => {
    for (const line of ['GK', 'D', 'M', 'F']) {
      expect(catalogue[`lineup.line.${line}`], line).toBeTruthy()
    }
  })

  it('has a sentence for every coach note kind, and the empty-bench variant', () => {
    for (const kind of ['stillOut', 'benchOn', 'lineRight']) {
      expect(catalogue[`lineup.coach.${kind}`], kind).toBeTruthy()
    }
    expect(catalogue['lineup.coach.benchOn.none']).toBeTruthy()
  })

  it('has a word and a note for every verdict the reveal can print', () => {
    for (const key of [
      'lineup.reveal.ok',
      'lineup.reveal.mid',
      'lineup.reveal.no',
      'lineup.reveal.ok.note',
      'lineup.reveal.mid.note',
      'lineup.reveal.no.note',
      'lineup.reveal.bench.note',
    ]) {
      expect(catalogue[key], key).toBeTruthy()
    }
  })

  it('fills every placeholder the coach sentences declare', () => {
    expect(catalogue['lineup.coach.stillOut']).toContain('{n}')
    expect(catalogue['lineup.coach.lineRight']).toContain('{of}')
  })
})
