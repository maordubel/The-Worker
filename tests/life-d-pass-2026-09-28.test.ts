import { describe, expect, it } from 'vitest'

import { DIALOGUE } from '@/lib/life/content/dialogue'
import { RIDES, RIDE_PREFIX } from '@/lib/life/content/passages'
import { meets } from '@/lib/life/world/types'
import type { LifeEvent } from '@/lib/life/events'
import type { DialogueChoice } from '@/lib/life/runtime/bus'

import { WALK_AWAY, WorldSim } from './fixtures/lifeWorldSim'

/**
 * pass D (28.9.2026) — `IMPLEMENTATION-PASS-PROGRAMMER-2026-09-27` §41–§63, the adult chapters
 * 2013–2026, walked in the headless world (`fixtures/lifeWorldSim.ts`: the real engine and the
 * real dialogue runner over the rooms of `scenes.ts`).
 *
 * Each block holds a chapter to what the brief asked of it in its own words — a strategy with
 * no maximum, a cost per option, a named fail-forward, a world that changes before the close —
 * and never to a sentence count.
 */

const pick =
  (...ids: string[]) =>
  (choices: readonly DialogueChoice[]) =>
    ids.find((id) => choices.some((c) => c.id === id && c.enabled)) ?? choices.find((c) => c.enabled)?.id ?? WALK_AWAY

function seed(sim: WorldSim, flags: Record<string, boolean | string | number>) {
  const events: LifeEvent[] = Object.entries(flags).map(([flag, value]) => ({ t: 'flag.set', flag, value }))
  if (events.length) sim.engine.dispatch(...events)
}

function choicesOf(sim: WorldSim, conversation: string): DialogueChoice[] {
  let seen: DialogueChoice[] = []
  sim.converse(conversation, (choices) => {
    seen = [...choices]
    return WALK_AWAY
  })
  return seen
}

// ======================================================= 2025-owner — the triangle ===

describe('2025-owner — money, sport, trust: two corners before eight', () => {
  function office(flags: Record<string, boolean | string | number> = {}, answer = pick('fork', 'go', 'agree', 'delegate', 'service')) {
    const sim = new WorldSim('2025-owner')
    seed(sim, flags)
    sim.beatAnswer = answer
    sim.go('office')
    return sim
  }

  it('after the fork the room holds four approaches at once, and the door is shut until the seller answers', () => {
    const sim = office()
    expect(sim.state.flags['o:brief']).toBe(true)
    const spots = sim.things().filter((t) => t.kind === 'spot').map((t) => t.id)
    for (const id of ['o-spot-money', 'o-spot-partner', 'o-spot-squad', 'o-spot-fans']) expect(spots).toContain(id)
    const door = sim.things().find((t) => t.kind === 'exit')
    expect(door && door.kind === 'exit' && door.locked).toBe(true)
  })

  it('covered money needs the route apex; the bridge does not, and it is remembered', () => {
    const sim = office()
    const money = choicesOf(sim, 'o-tri-money')
    expect(money.find((c) => c.id === 'covered')?.enabled).toBe(false)
    expect(money.find((c) => c.id === 'bridge')?.enabled).toBe(true)
  })

  it('money + squad passes the seller and leaves the fans out — the meeting says so, and Monday too', () => {
    const sim = office({ 'own:route:OWNER:apex': true })
    sim.press('o-spot-money', pick('covered'))
    sim.press('o-spot-squad', pick('two'))
    expect(sim.state.flags['o:verdict']).toBe(true)
    expect(sim.state.flags['life:owner:triangle']).toBe('money_squad')
    expect(sim.state.flags['o:dealGo']).toBe(true)
    expect(sim.state.flags['o:team']).toBe(true)
    expect(sim.state.flags['o:moneyGo']).toBe(true)
    // the exit opens once the seller has answered
    const door = sim.things().find((t) => t.kind === 'exit')
    expect(door && door.kind === 'exit' && door.locked).toBe(false)
  })

  it('without the apex, only the hour at the window buys the team — money alone does not solve trust', () => {
    const moneyOnly = office({}, pick('fork', 'go', 'agree', 'pilot'))
    moneyOnly.press('o-spot-money', pick('bridge'))
    moneyOnly.press('o-spot-squad', pick('two'))
    expect(moneyOnly.state.flags['o:dealGo']).toBe(true)
    // agree is greyed without the apex or the fans' corner → the meeting ends in the pilot
    expect(moneyOnly.endings).toEqual(['pilot'])

    const withFans = office({}, pick('fork', 'go', 'agree'))
    withFans.press('o-spot-money', pick('bridge'))
    withFans.press('o-spot-fans', pick('books'))
    expect(withFans.state.flags['life:owner:triangle']).toBe('money_trust')
    expect(withFans.state.flags['o:teamGo']).toBe(true)
    expect(withFans.state.flags['life:owner:bridge']).toBe(true)
    expect(withFans.endings).toEqual([])
  })

  it('no combination closes all three corners: the third approach is gone once two are closed', () => {
    const sim = office({ 'own:route:OWNER:apex': true }, pick('fork', 'withdraw'))
    sim.press('o-spot-partner', pick('partner'))
    sim.press('o-spot-fans', pick('seat'))
    expect(sim.state.flags['o:verdict']).toBe(true)
    expect(sim.find('o-spot-squad')).toBeUndefined()
  })

  it('trust without money: the deal falls and the table stays (a named fail-forward)', () => {
    const sim = office({}, pick('fork', 'table'))
    sim.press('o-spot-squad', pick('two'))
    sim.press('o-spot-fans', pick('books'))
    expect(sim.endings).toEqual(['trust_first'])
    expect(sim.state.flags['life:owner:triangle']).toBe('squad_trust')
  })

  it('doing nothing is a life too: eight o’clock comes, and the seller is answered for him', () => {
    const sim = office({}, pick('fork', 'pass'))
    sim.wait(90)
    expect(sim.state.flags['o:verdict']).toBe(true)
    expect(sim.endings).toEqual(['missed'])
  })

  it('a late approach is greyed with the minutes it needs, not hidden', () => {
    const sim = office()
    sim.wait(50) // 19:25 — forty minutes with Yevgeny no longer fit
    const fans = choicesOf(sim, 'o-tri-fans')
    expect(fans.find((c) => c.id === 'books')?.enabled).toBe(false)
    const squad = choicesOf(sim, 'o-tri-squad')
    expect(squad.find((c) => c.id === 'two')?.enabled).toBe(true)
  })
})

// ============================================ 2026-finale — the walk and the last word ===

describe('2026-finale — the walk after F04, and the last word is Kobi’s', () => {
  function outside(flags: Record<string, boolean | string | number>, close = 'father') {
    const sim = new WorldSim('2026-finale')
    seed(sim, { 'f:name': true, 'f:road': true, 'f:seats': true, 'f:inside': true, ...flags })
    const heard: string[] = []
    sim.onMinigame = (id, world) => {
      const ride = RIDES[id.replace(RIDE_PREFIX, '')]
      if (!ride) return
      for (const stop of ride.stops) {
        if (!stop.conversation) continue
        heard.push(stop.conversation)
        world.converse(stop.conversation, pick())
      }
      for (const flag of ride.flags) world.engine.dispatch({ t: 'flag.raised', flag })
      world.go(ride.land.mapId as never)
    }
    sim.beatAnswer = pick(close)
    sim.go('arena-out')
    return { sim, heard }
  }

  it('the answer outside the hall starts a walk; the card comes only after it', () => {
    const { sim, heard } = outside({ 'life:finale:party': 'two' })
    expect(heard).toEqual(['f-walk-step', 'f-walk-shirt', 'f-walk-phone', 'f-walk-sign', 'f-walk-road'])
    expect(sim.state.flags['f:walked']).toBe(true)
    expect(sim.endings).toEqual(['together'])
  })

  it('every walk stop answers the life it is walked in — and has its own line for a life without the thing', () => {
    for (const id of ['f-walk-step', 'f-walk-shirt', 'f-walk-phone', 'f-walk-sign']) {
      const conversation = DIALOGUE[id]
      expect(conversation, id).toBeDefined()
      expect(conversation!.branches.length, id).toBeGreaterThan(2)
      // the last branch has no `when`: nobody walks past a stop in silence
      expect(conversation!.branches[conversation!.branches.length - 1]!.when, id).toBeUndefined()
    }
  })

  it('the shirt, the shoulders, the child, the work: the branch chosen is the life', () => {
    const state = (flags: Record<string, boolean | string | number>) => {
      const sim = new WorldSim('2026-finale')
      seed(sim, flags)
      return sim.state
    }
    const first = (id: string, flags: Record<string, boolean | string | number>) =>
      DIALOGUE[id]!.branches.findIndex((branch) => meets(state(flags), branch.when))
    expect(first('f-walk-shirt', { 'own:outfit:2026-finale': 'visa86', 'life:first-shirt:gift': true })).toBe(0)
    expect(first('f-walk-shirt', { 'own:outfit:2026-finale': 'plain' })).toBe(3)
    expect(first('f-walk-step', { 'life:a1:grip': 'caught' })).toBe(0)
    expect(first('f-walk-phone', { 'life:finale:party': 'three', 'life:child': true })).toBe(0)
    expect(first('f-walk-sign', { 'life:owner:role': 'controlling_owner', 'life:owner:triangle': 'money_squad' })).toBe(0)
  })

  it('three generations close on the child’s word, and a life elsewhere on "ותתקשר גם משם"', () => {
    const three = outside({ 'life:finale:party': 'three', 'life:child': true }, 'three')
    expect(three.sim.endings).toEqual(['generations'])
    const abroad = outside({ 'life:finale:party': 'reunion', 'life:abroad': true }, 'mine')
    expect(abroad.sim.endings).toEqual(['mine'])
  })

  it('a reload in the middle of the walk offers the walk again, never a room without a door', () => {
    const sim = new WorldSim('2026-finale')
    seed(sim, { 'f:name': true, 'f:road': true, 'f:seats': true, 'f:inside': true, 'f:back': true, 'life:finale:close': 'together' })
    let offered = 0
    sim.onMinigame = (id) => {
      if (id === 'ride:walk-26') offered += 1
    }
    sim.beatAnswer = pick()
    sim.go('arena-out')
    sim.wait(2)
    expect(offered).toBeGreaterThan(0)
    expect(sim.endings).toEqual([])
  })
})
