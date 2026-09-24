import { describe, expect, it } from 'vitest'

import { RIDES, RIDE_PREFIX } from '@/lib/life/content/passages'
import { STORY_CHORES } from '@/lib/life/content/storyChores'
import type { DialogueChoice } from '@/lib/life/runtime/bus'

import { WALK_AWAY, WorldSim, type Thing } from './fixtures/lifeWorldSim'

/**
 * שחקן מבולבל — Director V3 §14 (`life-confused-player`).
 *
 * A player who does not know the history: he goes to what stands out in the room, he
 * closes the first box every beat opens at him by mistake, he never uses the debug panel,
 * and he does not hunt for hidden hotspots — only what is on the list of things the room
 * offers right now. He has to reach the end of the chapter without a softlock.
 *
 * `npm run life:play` drives the browser; this drives the same data headless
 * (`fixtures/lifeWorldSim.ts`), so the question can be asked for every chapter V3 rebuilt
 * and for every way he might answer. Three temperaments: he takes the first answer, he
 * takes the last, and he walks away from every box once before he answers it.
 */

type Temper = 'first' | 'last' | 'hesitant'

function answerFor(temper: Temper, asked: Map<string, number>, id: string) {
  return (choices: readonly DialogueChoice[]) => {
    const open = choices.filter((choice) => choice.enabled)
    if (!open.length) return WALK_AWAY
    const times = asked.get(id) ?? 0
    asked.set(id, times + 1)
    if (temper === 'hesitant' && times === 0) return WALK_AWAY
    return (temper === 'last' ? open[open.length - 1] : open[0])!.id
  }
}

/** the scenes the sim does not play: a chore is half done, a ride is ridden to the end */
function playMinigames(sim: WorldSim, temper: Temper) {
  sim.onMinigame = (id, world) => {
    if (id.startsWith(`chore:story:`)) {
      const chore = STORY_CHORES[id.slice('chore:story:'.length)]
      if (!chore) return
      const done = temper === 'last' ? 0 : Math.ceil(chore.shape.target / 2)
      const events = chore.finish(done, chore.shape.target)
      if (events.length) world.engine.dispatch(...events)
      world.go(chore.where)
      return
    }
    if (id.startsWith(RIDE_PREFIX)) {
      const ride = RIDES[id.slice(RIDE_PREFIX.length)]
      if (!ride) return
      const asked = new Map<string, number>()
      for (const stop of ride.stops) if (stop.conversation) world.converse(stop.conversation, answerFor(temper === 'hesitant' ? 'first' : temper, asked, stop.conversation))
      for (const flag of ride.flags) world.engine.dispatch({ t: 'flag.raised', flag })
      world.go(ride.land.mapId as never)
    }
  }
}

/** walk the day like somebody reading only what the room shows him */
function play(chapter: string, temper: Temper, budget = 400): { sim: WorldSim; path: string[] } {
  const sim = new WorldSim(chapter)
  playMinigames(sim, temper)
  const asked = new Map<string, number>()
  // the first box a beat opens at him he closes by mistake; the next time it comes back he
  // answers it the way he answers everything (a beat left undone is armed again, rule 42)
  const beatAsked = new Map<string, number>()
  sim.beatAnswer = (choices) => {
    const key = choices.map((choice) => choice.id).join('|')
    const times = beatAsked.get(key) ?? 0
    beatAsked.set(key, times + 1)
    if (times === 0) return WALK_AWAY
    const open = choices.filter((choice) => choice.enabled)
    if (!open.length) return WALK_AWAY
    return (temper === 'last' ? open[open.length - 1] : open[0])!.id
  }
  const pressed = new Set<string>()
  const walked = new Map<string, number>()
  const path: string[] = [sim.location]
  for (let step = 0; step < budget && sim.endings.length === 0; step += 1) {
    const here = sim.location
    const things = sim.things()
    // what stands out: people and things first, in the order the room lists them
    const fresh = things.find((thing) => thing.kind !== 'exit' && !pressed.has(`${here}|${thing.id}|${stateKey(sim)}`))
    if (fresh && fresh.kind !== 'exit') {
      pressed.add(`${here}|${fresh.id}|${stateKey(sim)}`)
      sim.press(fresh.id, answerFor(temper, asked, fresh.act))
      if (sim.location !== here) path.push(sim.location)
      // walking up to something and reading it is not free: the clock runs while he does
      sim.wait(1)
      continue
    }
    // then the door he has used least — a person who is lost tries the other door
    const doors = things.filter((thing): thing is Extract<Thing, { kind: 'exit' }> => thing.kind === 'exit' && !thing.locked)
    if (doors.length) {
      doors.sort((a, b) => (walked.get(`${here}>${a.to}`) ?? 0) - (walked.get(`${here}>${b.to}`) ?? 0))
      const door = doors[0]!
      walked.set(`${here}>${door.to}`, (walked.get(`${here}>${door.to}`) ?? 0) + 1)
      sim.exit(door.id)
      path.push(sim.location)
      sim.wait(2)
      continue
    }
    // nothing to do and nowhere to go: time passes, the way it does when a player waits
    sim.wait(20)
  }
  return { sim, path }
}

/** a coarse fingerprint of "has anything changed since I last pressed this" */
function stateKey(sim: WorldSim): string {
  // flags only: the clock moves on every step, and a changed minute is not a changed room
  return String(Object.entries(sim.state.flags).filter(([key, value]) => value !== false && !key.startsWith('beat:') && !key.startsWith('own:heard:')).length)
}

const CHAPTERS_V3 = ['1996-army', '1997-basket', '1999-basket', '2000-title']
const TEMPERS: Temper[] = ['first', 'last', 'hesitant']

describe('a player who does not know the history still reaches the end of the chapter', () => {
  for (const chapter of CHAPTERS_V3) {
    for (const temper of TEMPERS) {
      it(`${chapter} · ${temper}`, () => {
        const { sim, path } = play(chapter, temper)
        expect(sim.endings.length, `${chapter}/${temper} never ended — last rooms: ${path.slice(-12).join(' → ')}`).toBeGreaterThan(0)
      })
    }
  }

  it('1996 goes through every day of the winter for the hesitant player', () => {
    const { sim } = play('1996-army', 'hesitant')
    for (const day of ['life:army:d2', 'life:army:d3', 'life:army:d4', 'life:army:d5']) expect(sim.state.flags[day], day).toBe(true)
  })
})
