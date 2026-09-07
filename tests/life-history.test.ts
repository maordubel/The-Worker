import { describe, expect, it } from 'vitest'

import {
  DAY_1990,
  DAY_1998,
  HISTORY_DAYS,
  ParallelHistoricalDirector,
  PRESET_1990,
  PRESET_1998,
  conflictsOf,
} from '@/lib/life/history'
import { LACES_LINES, eventById, terrace } from '@/lib/life/history/terrace'
import { BANDS_1990 } from '@/lib/life/history/presets'

/**
 * שני הימים, בלי דפדפן — 12.5.1990 and 2.5.1998 played end to end in a few milliseconds.
 *
 * The point of extracting the director was that a documentary mission should be provable
 * rather than played by hand and hoped over. Three things get proved here, in order of
 * how badly they would hurt if they broke:
 *
 * 1. **Rule 11 holds in the data.** No claim without a source, no minute the archive does
 *    not carry, no conflict quietly resolved, and — the one that matters most — nothing a
 *    character can say that a named source does not support.
 * 2. **The machine behaves.** Latency, the inversion that the whole of 1990 hangs on, the
 *    crowd wave, and an ending policy that refuses to close 2.5.1998 at its own whistle.
 * 3. **Nothing was lost in the move.** The six goals still land on the six game-minutes
 *    they landed on before the extraction, so a save from before it plays the same chapter.
 */

const ALL_EVENTS = Object.values(HISTORY_DAYS).flatMap((day) => day.venues.flatMap((v) => v.events))

describe('כלל 11 — הארכיון, לא הדמיון', () => {
  it('gives every claim at least one source that the day actually names', () => {
    for (const day of Object.values(HISTORY_DAYS)) {
      const known = new Set(day.sources.map((s) => s.id))
      for (const venue of day.venues) {
        for (const event of venue.events) {
          expect(event.sourceIds.length, `${event.id} carries no source`).toBeGreaterThan(0)
          for (const id of event.sourceIds) expect(known.has(id), `${event.id} cites "${id}", which the day does not list`).toBe(true)
        }
      }
    }
  })

  it('never lets a disputed claim speak', () => {
    for (const event of ALL_EVENTS) {
      if (event.confidence === 'disputed') expect(event.speakable, `${event.id} is disputed and speakable`).toBe(false)
    }
  })

  it('never carries a minute for a claim it also calls disputed', () => {
    for (const event of ALL_EVENTS) {
      if (event.confidence === 'disputed') expect(event.minute, `${event.id} is disputed but claims minute ${event.minute}`).toBeNull()
    }
  })

  it('stores every conflict instead of resolving it', () => {
    for (const event of ALL_EVENTS) {
      if (event.confidence !== 'verified') expect(event.conflictNote, `${event.id} is not verified and explains nothing`).toBeTruthy()
    }
    // the two the project actually argues about
    const notes = [...conflictsOf(DAY_1990), ...conflictsOf(DAY_1998)].map((row) => row.noteHe).join(' ')
    expect(notes).toContain('אלבז')
    expect(notes).toContain('93')
  })

  /**
   * הכלל שמחזיק את הכול — an impression is not a fact.
   *
   * `lineHe` is what a fallible man on a terrace says. It may not contain a number, a
   * scorer's name, or a scoreline, because those are archive claims and most of them are
   * claims this archive refuses to make. Anything that IS sourced — Pisont, our own final
   * whistle — travels in `personHe` / `minute` / `scoreAfter`, which only a `speakable`
   * event exposes.
   */
  it('keeps every spoken impression free of numbers, names and scorelines', () => {
    const names = new Set(ALL_EVENTS.map((e) => e.personHe).filter(Boolean) as string[])
    for (const event of ALL_EVENTS) {
      if (!event.lineHe) continue
      expect(/\d/.test(event.lineHe), `${event.id}: "${event.lineHe}" carries a number`).toBe(false)
      for (const name of names) expect(event.lineHe.includes(name), `${event.id}: "${event.lineHe}" names ${name}`).toBe(false)
      if (event.scoreAfter) expect(event.lineHe.includes(event.scoreAfter), `${event.id} speaks its scoreline`).toBe(false)
    }
  })

  it('refuses an event id it does not hold, at module load', () => {
    expect(() => terrace('1998-parallel-goal-9')).toThrow()
    expect(eventById('1990-yavne-goal-1')).toBeTruthy()
  })

  it('builds the 1998 terrace lines out of the canonical stream', () => {
    expect(LACES_LINES.half).toContain(terrace('1998-parallel-goal-1'))
    expect(LACES_LINES.half).toContain(terrace('1998-parallel-standing'))
    expect(LACES_LINES.late).toContain(terrace('1998-parallel-goal-4'))
    expect(LACES_LINES.oursOver).toBe(terrace('1998-bloomfield-full'))
  })

  it('holds no result for the ground the archive holds no result for', () => {
    const yavne = DAY_1990.venues.find((v) => v.venueId === 'yavne')
    expect(yavne?.finalHe).toBeNull()
    expect(DAY_1990.silenceHe).toContain('יבנה')
  })
})

describe('הבמאי — זמן, השהיה, וידיעה', () => {
  const run = (director: ParallelHistoricalDirector, seconds: number) => {
    for (let i = 0; i < seconds * 10; i += 1) director.advance(100)
  }

  it('plays 12.5.1990 to full time in a little over two real minutes', () => {
    const director = new ParallelHistoricalDirector(PRESET_1990)
    run(director, 200)
    expect(director.phaseOf('bloomfield')).toBe('over')
    expect(director.goalsFor('bloomfield', 'הפועל-תל-אביב')).toBe(6)
  })

  it('gives the last five minutes nearly as much real time as the first half', () => {
    const first = 45 / (BANDS_1990[0]?.pace ?? 1)
    const last = 6 / (BANDS_1990[3]?.pace ?? 1)
    expect(last).toBeGreaterThan(first * 0.6)
  })

  it('makes the slow radio slower than the fast one, and the certain man slowest of all', () => {
    const director = new ParallelHistoricalDirector(PRESET_1990)
    expect(director.latencyOf('kobi')).toBe(1)
    expect(director.latencyOf('radio')).toBe(3)
    // he repeats the far radio and adds nothing of his own, which is the joke
    expect(director.latencyOf('brain')).toBe(3)
    expect(director.latencyOf('kobi-held')).toBe(0)
  })

  /**
   * ההיפוך — the minute the boy knows something his father's radio has not played yet.
   * The whole chapter is built on it, so it gets an assertion of its own.
   */
  it('opens a window where the far radio is AHEAD of the near one', () => {
    const director = new ParallelHistoricalDirector(PRESET_1990)
    director.seek(22)
    const near = director.heardOn('kobi', 'yavne').length
    const far = director.heardOn('radio', 'yavne').length
    expect(near).toBeGreaterThanOrEqual(far)
    // …and at the moment the news is two minutes old, the near radio has it and the far one does not
    expect(director.heardOn('kobi', 'yavne').some((e) => e.id === '1990-yavne-goal-1')).toBe(true)
    expect(director.heardOn('radio', 'yavne').some((e) => e.id === '1990-yavne-goal-1')).toBe(false)
  })

  it('does the promotion arithmetic off the real numbers, and gets 1990 right', () => {
    const director = new ParallelHistoricalDirector(PRESET_1990)
    director.seek(95)
    const us = director.goalsFor('bloomfield', 'הפועל-תל-אביב')
    const them = director.goalsFor('yavne', 'מכבי-יבנה')
    expect(us).toBe(6)
    expect(them).toBe(4)
    expect(us > them, 'הפועל עלתה ליגה ב-12.5.1990').toBe(true)
  })

  it('picks the match up mid-flight for a boy the stewards let in at half-time', () => {
    const director = new ParallelHistoricalDirector(PRESET_1990)
    director.seek(50)
    expect(director.goalsFor('bloomfield', 'הפועל-תל-אביב')).toBe(3)
    expect(director.advance(0)).toEqual([])
  })
})

describe('2.5.1998 — השריקה איננה סוף', () => {
  const played = () => {
    const director = new ParallelHistoricalDirector(PRESET_1998)
    for (let i = 0; i < 4000; i += 1) director.advance(100)
    return director
  }

  it('refuses to complete while our own ground has not finished', () => {
    const director = new ParallelHistoricalDirector(PRESET_1998)
    director.advance(100)
    expect(director.completion().done).toBe(false)
    expect(director.completion().reasonHe).toContain('רץ')
  })

  it('refuses to complete at our full time, because their ground kicked off later', () => {
    const director = new ParallelHistoricalDirector(PRESET_1998)
    director.seek(96)
    director.advance(0)
    expect(director.phaseOf('bloomfield')).toBe('over')
    const verdict = director.completion()
    expect(verdict.done).toBe(false)
    expect(verdict.reasonHe).toContain('עוד משחקת')
  })

  it('refuses to complete after their whistle while he has not been told', () => {
    const director = played()
    expect(director.phaseOf('bloomfield')).toBe('over')
    const verdict = director.completion()
    expect(verdict.done).toBe(false)
    expect(verdict.reasonHe).toContain('לא יודע')
  })

  it('completes only once he knows — and a garbled telling is not knowing', () => {
    const director = played()
    const goal = eventById('1998-parallel-goal-5')
    expect(goal).toBeTruthy()
    director.learn(goal!, 'heard', true)
    expect(director.completion().done).toBe(false)
    director.learn(goal!, 'transistor')
    expect(director.completion().done).toBe(true)
    expect(director.completion().reasonHe).toContain('יודע')
  })

  /**
   * גל הידיעה — the audit's four states, and the assertion that matters: the stand holds
   * more than one of them at the same second. A switch would make every face change at
   * once, and that is precisely what did not happen.
   */
  it('spreads the news outward through the stand instead of flipping it', () => {
    const director = new ParallelHistoricalDirector(PRESET_1998)
    director.seek(105)
    const goal = eventById('1998-parallel-goal-5')
    director.learn(goal!, 'transistor')
    const seen = new Set<string>()
    let mixed = false
    for (let i = 0; i < 400; i += 1) {
      director.advance(100)
      const states = new Set(director.crowdBoard().map((row) => row.state))
      for (const state of states) seen.add(state)
      if (states.size >= 3) mixed = true
    }
    expect(mixed, 'the stand never held three states at once').toBe(true)
    expect(seen.has('heard_rumour')).toBe(true)
    expect(seen.has('confirmed')).toBe(true)
    expect(director.crowdOf('row')).toBe('reacting')
    expect(director.crowdOf('far')).toBe('reacting')
  })

  it('makes the far side of the stand understand after the row that is holding the radio', () => {
    const director = new ParallelHistoricalDirector(PRESET_1998)
    director.seek(105)
    director.learn(eventById('1998-parallel-goal-5')!, 'transistor')
    const at: Record<string, number> = {}
    for (let tick = 0; tick < 400; tick += 1) {
      director.advance(100)
      for (const row of director.crowdBoard()) if (row.state === 'confirmed' && at[row.id] === undefined) at[row.id] = tick
    }
    expect(at['row']!).toBeLessThan(at['block']!)
    expect(at['block']!).toBeLessThan(at['stand']!)
    expect(at['stand']!).toBeLessThan(at['far']!)
  })
})

describe('מה שלא אבד במעבר', () => {
  /**
   * The six game-minutes the goals used to land on, when they were a `GOAL_AT` table
   * inside `runtime/match1990.ts`. They are pacing and they are labelled as pacing, and
   * they must not move: a save from before 7.9.2026 has to play the chapter it played.
   */
  it('keeps the six goals on the six minutes the chapter always played them on', () => {
    const bloomfield = DAY_1990.venues.find((v) => v.venueId === 'bloomfield')
    const goals = (bloomfield?.events ?? []).filter((e) => e.type === 'goal').map((e) => e.pacingMinute)
    expect(goals).toEqual([12, 29, 44, 58, 71, 84])
  })

  it('keeps every pacing minute strictly a directing decision, never a historical one', () => {
    for (const event of ALL_EVENTS) {
      if (event.minute !== null) continue
      // the field exists and drives the clock; it is simply not a claim about the past
      expect(typeof event.pacingMinute).toBe('number')
      expect(event.confidence).not.toBe('verified')
    }
  })

  it('agrees with the archive about both final scores of 2.5.1998', () => {
    expect(DAY_1998.venues.find((v) => v.venueId === 'bloomfield')?.finalHe).toBe('1–0')
    expect(DAY_1998.venues.find((v) => v.venueId === 'beit-shean')?.finalHe).toBe('2–3')
  })
})
