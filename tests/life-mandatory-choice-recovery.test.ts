import { describe, expect, it } from 'vitest'

import { BUS_AT } from '@/lib/life/content/chapter1996army'
import { CHAPTERS } from '@/lib/life/content/chapters'
import { DIALOGUE } from '@/lib/life/content/dialogue'
import { eraFor } from '@/lib/life/content/era'
import { CHECKLISTS } from '@/lib/life/checklist'
import type { Effect } from '@/lib/life/content/script'
import { ALL_SCENES, inEra, sceneIn } from '@/lib/life/world/scenes'
import type { Condition } from '@/lib/life/world/types'

import { WorldSim } from './fixtures/lifeWorldSim'

/**
 * בחירת חובה לעולם לא תלויה בשיחה חד־פעמית — Director V3 §7 "Recovery rule", §14.
 *
 * 23.11.1996, the Director's Cut: the arrival box at Bloomfield held the terrace decision in
 * its buttons, the box was one-shot, and closing it left `a2:chose` down for ever with Kobi
 * and Asaf standing in the world pointing at conversations nobody had registered. Two tests
 * here. The first is structural and covers every chapter: a flag a checklist step waits on
 * must be raisable from something STANDING in the world (a person or a thing), not only
 * from a conversation a beat opens once. The second plays 1996 as the V3 Definition of Done
 * describes it — close the box, walk to Kobi, walk to gate five and back, reload anywhere.
 */

/** the flags a checklist step is ticked by */
function doneFlags(condition: Condition | undefined, out: Set<string> = new Set()): Set<string> {
  if (!condition) return out
  if (condition.flag) out.add(condition.flag)
  for (const part of condition.any ?? []) doneFlags(part, out)
  for (const part of condition.all ?? []) doneFlags(part, out)
  return out
}

/** every flag a conversation (and whatever it `goto`s) can raise */
function raisedFrom(roots: readonly string[]): Set<string> {
  const out = new Set<string>()
  const seen = new Set<string>()
  const queue = [...roots]
  const take = (effects: readonly Effect[] | undefined) => {
    for (const effect of effects ?? []) {
      if (effect.e === 'flag') out.add(effect.flag)
      if (effect.e === 'flagValue' && effect.value !== false) out.add(effect.flag)
      if (effect.e === 'goto') queue.push(effect.node)
    }
  }
  while (queue.length) {
    const id = queue.shift() as string
    if (seen.has(id)) continue
    seen.add(id)
    const conversation = DIALOGUE[id]
    if (!conversation) continue
    for (const branch of conversation.branches) {
      take(branch.then)
      for (const choice of branch.choices ?? []) take(choice.then)
    }
  }
  return out
}

/** the chapters V3 has been applied to — the rest are listed in the delta report */
const RECOVERABLE = ['1996-army', '1997-basket', '1999-basket', '2000-title']

describe('a mandatory choice lives in the world, not only in a one-shot beat', () => {
  for (const chapter of RECOVERABLE) {
    it(`${chapter}: every checklist flag can be raised from a person or a thing standing in a room`, () => {
      const roots: string[] = []
      for (const base of ALL_SCENES) {
        const room = sceneIn(base, chapter)
        for (const actor of room.actors) if (actor.talk && inEra(actor, chapter)) roots.push(actor.talk)
        for (const spot of room.hotspots) if (inEra(spot, chapter)) roots.push(spot.act)
      }
      const fromWorld = raisedFrom(roots)
      // flags a beat raises by itself are not choices; flags raised by the scene after a
      // played chore/passage are listed by the chapter as engine flags
      const byBeat = new Set<string>()
      for (const beat of eraFor(chapter).beats ?? []) {
        for (const action of beat.do) {
          if (action.a === 'flag') byBeat.add(action.flag)
          if (action.a === 'events') for (const event of action.events) if (event.t === 'flag.raised') byBeat.add(event.flag)
        }
      }
      // a beat that is ARMED AGAIN until its conversation raised the flag (rule 42: a beat
      // whose `when` still holds after it ran comes back) is not one-shot: it keeps asking
      const rearmed = new Set<string>()
      for (const beat of eraFor(chapter).beats ?? []) {
        const talks = beat.do.flatMap((action) => (action.a === 'talk' ? [action.conversation] : []))
        if (!talks.length) continue
        const guards = new Set((beat.when?.none ?? []).flatMap((part) => (part.flag ? [part.flag] : [])))
        const selfGuarded = beat.do.some((action) => action.a === 'flag' && guards.has(action.flag))
        if (selfGuarded) continue
        for (const flag of raisedFrom(talks)) if (guards.has(flag)) rearmed.add(flag)
      }
      const missing: string[] = []
      for (const step of CHECKLISTS[chapter] ?? []) {
        const flags = [...doneFlags(step.doneWhen)]
        if (!flags.length) continue
        if (flags.some((flag) => fromWorld.has(flag) || byBeat.has(flag) || rearmed.has(flag))) continue
        missing.push(`${step.id}: ${flags.join(' | ')}`)
      }
      expect(missing, `${chapter}: steps only a one-shot beat can finish`).toEqual([])
    })
  }

  it('knows every chapter it is asked about', () => {
    const ids = new Set(CHAPTERS.map((chapter) => chapter.id))
    for (const chapter of RECOVERABLE) expect(ids.has(chapter), chapter).toBe(true)
  })
})

/** day flags are cleared by the next day, so "it happened" is read off the log */
function ever(sim: WorldSim, flag: string): boolean {
  return sim.engine.log().some((event) => (event.t === 'flag.raised' || event.t === 'flag.set') && (event as { flag: string }).flag === flag && (event.t === 'flag.raised' || (event as { value: unknown }).value !== false))
}

/** from the street on the eve to the arrival box at Bloomfield, packing by hand */
function toTheGates(): WorldSim {
  const sim = new WorldSim('1996-army')
  expect(sim.location).toBe('street')
  expect(sim.state.flags['life:army:d1']).toBe(true)
  sim.go('home')
  // Rachel says what is missing; the confused player closes it — and she is still there
  expect(sim.find('rachel-army')).toBeDefined()
  expect(sim.press('pack-socks', 'read')).toBe(true)
  expect(sim.press('pack-bag', 'read')).toBe(true)
  expect(sim.state.flags['a1:bag']).toBeFalsy() // the radio is not decided yet
  expect(sim.press('pack-radio', 'take')).toBe(true)
  expect(sim.press('pack-bag', 'read')).toBe(true)
  expect(sim.state.flags['a1:bag']).toBe(true)
  expect(sim.press('rachel-army', 'promise')).toBe(true)
  // `a1:packed` is a day flag and the Saturday has already cleared it; the promise carries
  expect(sim.state.flags['promise:rachel-army']).toBe(true)
  // no clock to burn after the goodbye: the Saturday opens at once
  expect(sim.location).toBe('bloomfield-outside')
  expect(sim.state.flags['life:army:d2']).toBe(true)
  expect(sim.state.flags['a2:seen']).toBe(true)
  return sim
}

describe('1996 — Definition of Done (Director V3 §17), played headless', () => {
  it('1. the arrival box can be closed without choosing anything', () => {
    const sim = toTheGates()
    expect(sim.opened).toContain('a2-arrive')
    expect(sim.state.flags['a2:chose']).toBeFalsy()
    expect(sim.find('kobi-gate7')).toBeDefined()
    expect(sim.find('a2-between')).toBeDefined()
    const door = sim.things().find((thing) => thing.kind === 'exit' && thing.to === 'gate5')
    expect(door && door.kind === 'exit' && !door.locked).toBe(true)
  })

  it('2. walk to Kobi and stand with him: gate seven', () => {
    const sim = toTheGates()
    expect(sim.press('kobi-gate7', 'stay')).toBe(true)
    expect(sim.state.gate.identity).toBe('gate7')
    expect(ever(sim, 'a2:chose')).toBe(true)
    expect(sim.location).toBe('bus-station')
  })

  it('3–4. walk to gate five, do something there, walk back without sticking, and stay the second time', () => {
    const sim = toTheGates()
    expect(sim.exit('gate5')).toBe(true)
    expect(sim.location).toBe('gate5')
    expect(sim.find('asaf-gate5')).toBeDefined()
    expect(sim.press('a2-gate5-bag', 'read')).toBe(true)
    expect(sim.state.flags['a2:bag-moved']).toBe(true)
    expect(sim.press('a2-banner', 'read')).toBe(true)
    // back out, undecided: nothing is lost, the forecourt still holds all three answers
    expect(sim.exit('back')).toBe(true)
    expect(sim.location).toBe('bloomfield-outside')
    expect(sim.state.flags['a2:chose']).toBeFalsy()
    expect(sim.find('kobi-gate7')).toBeDefined()
    expect(sim.find('a2-between')).toBeDefined()
    expect(sim.exit('gate5')).toBe(true)
    expect(sim.press('asaf-gate5', 'join')).toBe(true)
    expect(sim.state.gate.identity).toBe('gate5')
    expect(sim.location).toBe('bus-station')
  })

  it('the middle is a place: the fence between five and seven', () => {
    const sim = toTheGates()
    expect(sim.press('a2-between', 'read')).toBe(true)
    expect(sim.state.gate.identity).toBe('between')
    expect(sim.location).toBe('bus-station')
  })

  it('5. a reload at any of those points keeps a way on', () => {
    const outside = toTheGates().reload()
    expect(outside.location).toBe('bloomfield-outside')
    expect(outside.find('kobi-gate7')).toBeDefined()
    expect(outside.press('kobi-gate7', 'stay')).toBe(true)
    expect(outside.location).toBe('bus-station')

    const under = toTheGates()
    under.exit('gate5')
    const again = under.reload()
    expect(again.location).toBe('gate5')
    expect(again.find('asaf-gate5')).toBeDefined()
    expect(again.exit('back')).toBe(true)
    expect(again.press('a2-between', 'read')).toBe(true)
    expect(again.location).toBe('bus-station')

    const station = toTheGates()
    station.press('kobi-gate7', 'stay')
    const platform = station.reload()
    expect(platform.state.flags['a3:bus-here']).toBe(true)
    expect(platform.find('bus-walk-away')).toBeDefined()
  })

  it('6–7. the bus is there on arrival, and the decision is made in the station, not in a menu', () => {
    const sim = toTheGates()
    sim.press('kobi-gate7', 'stay')
    expect(sim.state.minute).toBe(BUS_AT)
    expect(sim.state.flags['a3:bus-here']).toBe(true)
    const acts = sim.things().flatMap((thing) => (thing.kind === 'exit' ? [] : [thing.act]))
    expect(acts).toEqual(expect.arrayContaining(['a3-bus', 'a3-walk-away', 'a3-bench', 'a3-timetable']))
    // walking off the platform is the refusal; there is no quiet way home around it
    expect(sim.things().some((thing) => thing.kind === 'exit' && thing.to === 'street')).toBe(false)
    expect(sim.press('bus-walk-away', (choices) => (choices.some((c) => c.id === 'truth') ? 'truth' : 'leave'))).toBe(true)
    expect(sim.state.flags['life:bus:refused']).toBe(true)
    expect(ever(sim, 'a3:done')).toBe(true)
    expect(sim.location).toBe('kiosk')
  })

  it('the bench twice is hesitation; the bus door is boarding', () => {
    const bench = toTheGates()
    bench.press('kobi-gate7', 'stay')
    bench.press('bus-bench', 'read')
    expect(bench.state.flags['a3:decided']).toBeFalsy()
    bench.beatAnswer = 'read'
    bench.press('bus-bench', 'read')
    expect(ever(bench, 'a3:hesitated')).toBe(true)
    expect(ever(bench, 'a3:done')).toBe(true)

    const door = toTheGates()
    door.press('kobi-gate7', 'stay')
    door.press('bus', 'board')
    expect(ever(door, 'life:bus:boarded')).toBe(true)
    expect(ever(door, 'a3:done')).toBe(true)
  })

  it('8. the chapter asks for at least three things done with the hands, not three sentences', () => {
    const sim = toTheGates()
    const verbs = new Set<string>()
    for (const id of ['pack-socks', 'pack-radio', 'pack-bag', 'a2-between', 'bus', 'bus-walk-away', 'bus-bench']) {
      for (const base of ALL_SCENES) for (const spot of base.hotspots) if (spot.id === id && inEra(spot, '1996-army')) verbs.add(spot.verb)
    }
    expect(verbs.size).toBeGreaterThanOrEqual(3)
    const raised = sim.engine.log().filter((event) => event.t === 'flag.raised').map((event) => (event as { flag: string }).flag)
    expect(raised).toEqual(expect.arrayContaining(['a1:pack:socks', 'a1:pack:radio', 'a1:bag']))
  })
})
