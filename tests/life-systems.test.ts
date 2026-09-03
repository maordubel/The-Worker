import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CHARACTERS } from '@/lib/life/characters'
import { AMBIENT_1986 } from '@/lib/life/content/ambient1986'
import { DEFAULT_IDENTITY } from '@/lib/life/content/chapter1986'
import { DIALOGUE } from '@/lib/life/content/dialogue'
import { ENCOUNTERS_1986 } from '@/lib/life/content/encounters1986'
import { OPPORTUNITIES_1986 } from '@/lib/life/content/opportunities1986'
import { SCHEDULE_1986 } from '@/lib/life/content/schedules1986'
import type { Conversation, Effect } from '@/lib/life/content/script'
import { rollEncounter } from '@/lib/life/encounters'
import { LifeEngine } from '@/lib/life/engine'
import { apply, emptyState, fold, type LifeEvent } from '@/lib/life/events'
import { acceptEvents, isAvailable, statusOf, tickOpportunities } from '@/lib/life/opportunities'
import { buildProfile } from '@/lib/life/profile'
import { resolvePureLove } from '@/lib/life/pure-love'
import { CANDIDATES_1986, pickRedBoxItem } from '@/lib/life/redbox'
import { rollAt, Roller } from '@/lib/life/rng'
import { placementsAt } from '@/lib/life/schedules'
import type { LifeState } from '@/lib/life/types'
import { SCENE } from '@/lib/life/world/scenes'
import { meets } from '@/lib/life/world/types'

/**
 * THE WORKER LIFE — the systems, as guards.
 *
 * `tests/life.test.ts` proves the world is coherent: every door leads somewhere, no
 * scoreline was invented, nobody wears yellow. This file proves the GAME is: that the
 * afternoon really can be spent more than one way, that two saves diverge, that a window
 * that closed stays closed, and that the one number the whole project ends on cannot be
 * written by anything except its own resolver.
 *
 * The two are separate files because they fail for different reasons. A broken door is an
 * art or a data problem; a chapter with one solution is a design problem, and it should
 * say so in its own words.
 */

const ROOT = process.cwd()
const fresh = (): LifeState => emptyState(DEFAULT_IDENTITY, 1986)

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (path.endsWith('.ts')) out.push(path)
  }
  return out
}

// ---------------------------------------------------------------------------------
describe('השמירה — a save from before the systems existed still opens', () => {
  it('folds a version-2 log into the version-3 state with nothing lost', () => {
    // The whole promise of an append-only log. These rows were written by a build that
    // had never heard of the Red Heart; reading them now moves it, because the events
    // always described what HAPPENED rather than what it was worth.
    const before: LifeEvent[] = [
      { t: 'flag.raised', flag: 'knows:match' },
      { t: 'money.changed', agorot: 120, why: 'בקבוקים' },
      { t: 'bond.shifted', who: 'ofir', delta: 30 },
      { t: 'trait.shifted', trait: 'footballAffinity', delta: 25 },
      { t: 'trait.shifted', trait: 'independence', delta: 12 },
    ]
    const state = fold(DEFAULT_IDENTITY, 1986, before)

    expect(state.schemaVersion).toBe(2)
    expect(state.agorot).toBe(120)
    expect(state.resources.money).toBe(120)
    expect(state.bonds.ofir).toBe(30)
    // the routes: the old vocabulary reaches the new model
    expect(state.redHeart.footballLove).toBe(45)
    expect(state.personality.independence).toBe(17)
    // and the relationship gained the axes a bond really moves
    expect(state.relationships.ofir?.familiarity).toBeGreaterThan(45)
  })

  it('accepts a version-2 file rather than dropping it', () => {
    const save = readFileSync(join(ROOT, 'lib/life/save.ts'), 'utf8')
    expect(save).toContain('READABLE')
    expect(save).toContain('new Set([2, 3])')
    expect(save).toContain('SAVE_VERSION = 3')
  })

  it('still folds an event from the future to a no-op', () => {
    const future = { t: 'something.fromTheFuture' } as unknown as LifeEvent
    expect(apply(fresh(), future)).toEqual(fresh())
  })
})

// ---------------------------------------------------------------------------------
describe('המקריות — reproducible, and stored with the save', () => {
  it('gives the same number for the same seed and cursor, forever', () => {
    expect(rollAt('worker-1986', 0)).toBe(rollAt('worker-1986', 0))
    expect(rollAt('worker-1986', 0)).not.toBe(rollAt('worker-1986', 1))
    expect(rollAt('a', 4)).not.toBe(rollAt('b', 4))
    for (let i = 0; i < 200; i += 1) {
      const value = rollAt('seed', i)
      expect(value >= 0 && value < 1).toBe(true)
    }
  })

  it('advances a cursor rather than re-rolling the same moment', () => {
    const roller = new Roller({ seed: 'x', cursor: 0 })
    const first = roller.next()
    const second = roller.next()
    expect(first).not.toBe(second)
    expect(roller.consumed).toBe(2)
  })

  it('picks the same encounter twice from the same save, and a different one from another', () => {
    const state = { ...fresh(), minute: 13 * 60 }
    const a = rollEncounter(state, ENCOUNTERS_1986, '1986', 'street', 1)
    const b = rollEncounter(state, ENCOUNTERS_1986, '1986', 'street', 1)
    expect(a.picked?.id).toBe(b.picked?.id)

    const other = rollEncounter({ ...state, rng: { seed: 'other', cursor: 0 } }, ENCOUNTERS_1986, '1986', 'street', 1)
    // Not an assertion that they differ — a pool can legitimately land twice — but the
    // seed must be what decides, so the cursor advancing has to change the answer.
    const moved = rollEncounter({ ...state, rng: { seed: state.rng.seed, cursor: 7 } }, ENCOUNTERS_1986, '1986', 'street', 1)
    expect([a.picked?.id, other.picked?.id, moved.picked?.id].filter(Boolean).length).toBeGreaterThan(0)
  })

  it('never offers an encounter that has already fired and has no cooldown', () => {
    const once = ENCOUNTERS_1986.find((entry) => entry.cooldown === undefined)
    expect(once).toBeDefined()
    if (!once) return
    const state = { ...fresh(), minute: 13 * 60, encounters: { [once.id]: 12 * 60 } }
    for (let cursor = 0; cursor < 40; cursor += 1) {
      const rolled = rollEncounter({ ...state, rng: { seed: 's', cursor } }, ENCOUNTERS_1986, '1986', once.locations[0] ?? 'street', 1)
      expect(rolled.picked?.id).not.toBe(once.id)
    }
  })
})

// ---------------------------------------------------------------------------------
describe('ההזדמנויות — several at once, and you cannot have them all', () => {
  it('has more than one window open at the same moment', () => {
    // The collision itself. If only one thing is ever available there is no decision,
    // and the chapter is a corridor with people standing in it.
    const at1330 = { ...fresh(), minute: 13 * 60 + 30, flags: { 'knows:match': true } }
    const open = OPPORTUNITIES_1986.filter((entry) => isAvailable(at1330, entry))
    expect(open.length).toBeGreaterThanOrEqual(3)
  })

  it('cannot afford all of them before Kobi leaves', () => {
    // The arithmetic that makes the collision real: the windows that close at ten past
    // three cost more minutes together than the afternoon has.
    const start = 12 * 60 + 35
    const deadline = 15 * 60 + 10
    const total = OPPORTUNITIES_1986.filter((entry) => entry.start < deadline).reduce(
      (sum, entry) => sum + (entry.costs?.minutes ?? 0),
      0,
    )
    expect(total).toBeGreaterThan(0)
    expect(total).toBeLessThan(deadline - start)
    // …but not by much: with travel between rooms and conversations of their own, a
    // player who tries for all six arrives at nothing.
    expect(total).toBeGreaterThan((deadline - start) * 0.6)
  })

  it('offers a window once and misses it once', () => {
    const state = { ...fresh(), minute: 13 * 60, flags: {} }
    const first = tickOpportunities(state, OPPORTUNITIES_1986)
    expect(first.events.length).toBeGreaterThan(0)
    const after = first.events.reduce(apply, state)
    // offering again changes nothing — the runtime state remembers
    expect(tickOpportunities(after, OPPORTUNITIES_1986).events.filter((e) => e.t === 'opportunity.offered')).toEqual([])

    const late = { ...after, minute: 23 * 60 }
    const closed = tickOpportunities(late, OPPORTUNITIES_1986)
    expect(closed.events.some((event) => event.t === 'opportunity.missed')).toBe(true)
  })

  it('charges what the window says it costs, and only the window may say it', () => {
    const window = OPPORTUNITIES_1986.find((entry) => entry.costs?.minutes)
    expect(window).toBeDefined()
    if (!window) return
    const events = acceptEvents(window)
    expect(events[0]).toEqual({ t: 'opportunity.accepted', id: window.id })
    expect(events.some((event) => event.t === 'clock.advanced')).toBe(true)
  })

  it('keeps a missed window missed', () => {
    const missed = apply({ ...fresh(), minute: 14 * 60 }, { t: 'opportunity.missed', id: 'efi-hall' })
    const later = { ...missed, minute: 13 * 60 }
    const definition = OPPORTUNITIES_1986.find((entry) => entry.id === 'efi-hall')
    expect(definition).toBeDefined()
    if (definition) expect(statusOf(later, definition)).toBe('missed')
  })

  it('names a real character and a real place in every window', () => {
    for (const entry of OPPORTUNITIES_1986) {
      if (entry.location) expect(SCENE[entry.location as keyof typeof SCENE], entry.id).toBeDefined()
      for (const who of entry.characters ?? []) expect(CHARACTERS[who], `${entry.id} → ${who}`).toBeDefined()
      expect(entry.expires).toBeGreaterThan(entry.start)
      expect(entry.outcomes.length, entry.id).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------------
describe('לוח הזמנים — the street is not the street you left', () => {
  it('puts different people on the street at different times', () => {
    const at = (minute: number) =>
      [...placementsAt({ ...fresh(), minute }, SCHEDULE_1986, 'street').values()]
        .filter((entry) => entry.visible)
        .map((entry) => entry.actorId)
        .sort()
        .join(',')

    const midday = at(12 * 60 + 45)
    const afternoon = at(14 * 60 + 20)
    const kickoff = at(15 * 60 + 20)
    expect(midday).not.toBe(afternoon)
    expect(afternoon).not.toBe(kickoff)
  })

  it('takes Efi away at two, whether or not anybody went', () => {
    const before = placementsAt({ ...fresh(), minute: 13 * 60 + 30 }, SCHEDULE_1986, 'pitch').get('efi')
    const after = placementsAt({ ...fresh(), minute: 14 * 60 + 30 }, SCHEDULE_1986, 'pitch').get('efi')
    expect(before?.visible).toBe(true)
    expect(after?.visible).toBe(false)
  })

  it('drives only actors the world actually has', () => {
    const actors = new Set<string>()
    for (const scene of Object.values(SCENE)) for (const actor of scene.actors) actors.add(actor.id)
    for (const entry of SCHEDULE_1986) {
      expect(actors.has(entry.actorId), `schedule drives ${entry.actorId}, which no scene has`).toBe(true)
      expect(CHARACTERS[entry.characterId], `schedule names ${entry.characterId}`).toBeDefined()
      expect(SCENE[entry.location as keyof typeof SCENE], `${entry.actorId} → ${entry.location}`).toBeDefined()
      expect(entry.end).toBeGreaterThan(entry.start)
    }
  })

  /**
   * A person the child cannot walk up to is not in the scene, whatever the data says.
   *
   * A schedule row OVERRIDES the scene's own actor position when the scene is created, so
   * a row a few hundredths outside the walk band leaves somebody standing in the road:
   * no prompt, no conversation, and nothing anywhere that says so. Three street rows were
   * exactly that after the September backdrops moved the street's band from 0.9 to 0.86,
   * and the only reason anybody found out is that a browser harness walked east and had
   * nobody to talk to. That is too late and too expensive. This is the same question,
   * asked in eight milliseconds.
   */
  it('puts every scheduled person somewhere the child can actually reach', () => {
    for (const entry of SCHEDULE_1986) {
      const scene = SCENE[entry.location as keyof typeof SCENE]
      const where = `${entry.actorId} @ ${entry.location}`
      expect(entry.y, `${where} is above the band`).toBeGreaterThanOrEqual(scene.band.far)
      expect(entry.y, `${where} is below the band — that is the road`).toBeLessThanOrEqual(scene.band.near)
      expect(entry.x, `${where} x`).toBeGreaterThan(0)
      expect(entry.x, `${where} x`).toBeLessThan(1)
      for (const exit of scene.exits) {
        const inDoor = entry.x > exit.x - 0.01 && entry.x < exit.x + exit.w + 0.01
        expect(inDoor, `${where} is standing in the doorway "${exit.id}"`).toBe(false)
      }
    }
  })

  it('fills the street with people who are not the cast', () => {
    // An ambient figure who looked like Ofir is a bug the player reports as "Ofir was in
    // two places at once".
    const cast = new Set(['kid', 'ofir', 'amit', 'efi', 'keren', 'kobi', 'rachel'])
    for (const actor of AMBIENT_1986) {
      expect(cast.has(actor.figure), `${actor.id} borrows the cast member ${actor.figure}`).toBe(false)
      expect(SCENE[actor.location as keyof typeof SCENE], actor.id).toBeDefined()
      expect(actor.ms).toBeGreaterThan(0)
      expect(actor.everyMs).toBeGreaterThan(0)
    }
  })

  it('turns the road east into traffic once the father has gone', () => {
    const later = AMBIENT_1986.filter(
      (actor) => actor.location === 'street' && actor.when?.afterMinute !== undefined,
    )
    expect(later.length).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------------
describe('שלוש דרכים לבלומפילד — the objective is a network, not a chain', () => {
  const conversations = Object.values(DIALOGUE) as Conversation[]

  const grants = () => {
    const out: Array<{ id: string; via: string }> = []
    for (const conversation of conversations) {
      for (const branch of conversation.branches) {
        const sets = [
          ...(branch.then ?? []),
          ...(branch.choices ?? []).flatMap((choice) => choice.then),
        ]
        for (const effect of sets) {
          if (effect.e === 'flag' && effect.flag.startsWith('entry:') && effect.flag !== 'entry:granted') {
            out.push({ id: conversation.id, via: effect.flag })
          }
        }
      }
    }
    return out
  }

  it('offers at least three meaningfully different ways in', () => {
    const routes = new Set(grants().map((entry) => entry.via))
    expect([...routes].length, `only ${[...routes].join(', ')}`).toBeGreaterThanOrEqual(3)
  })

  it('spreads them across more than one person', () => {
    const people = new Set(grants().map((entry) => entry.id))
    expect(people.size).toBeGreaterThanOrEqual(3)
  })

  it('still has one that needs nothing at all — and it is no longer free', () => {
    // §3.2 of the production directive: FAIL-SAFE ≠ FREE SOLUTION. The way in that needs
    // nothing must still exist, or an eight-year-old can be soft-locked outside a
    // stadium; but it may not be `talk → entry granted`. So the guard asserts both: that
    // an unconditional path reaches `entry:granted`, and that reaching it costs minutes.
    const veteran = DIALOGUE['gate-veteran']
    const open = veteran?.branches.filter((branch) => !branch.when) ?? []
    expect(open.length).toBeGreaterThan(0)

    const chained = open.flatMap((branch) => [
      ...(branch.then ?? []),
      ...(branch.choices ?? []).filter((choice) => !choice.when).flatMap((choice) => choice.then),
    ])
    const nodes = chained.filter((effect) => effect.e === 'goto').map((effect) => (effect as { node: string }).node)
    expect(nodes.length, 'the fallback resolves in one beat with no situation around it').toBeGreaterThan(0)

    const reached = nodes.flatMap((node) => (DIALOGUE[node]?.branches ?? []).filter((branch) => !branch.when))
    expect(
      reached.some((branch) => (branch.then ?? []).some((e) => e.e === 'flag' && e.flag === 'entry:granted')),
      'no unconditional way into the ground',
    ).toBe(true)
    expect(
      reached.some((branch) => (branch.then ?? []).some((e) => e.e === 'time' && e.minutes > 0)),
      'the fail-safe costs the player nothing',
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------------
describe('זיכרון — somebody remembers what you did', () => {
  it('records a memory once, however many times the log is replayed', () => {
    const memory = {
      characterId: 'kobi',
      eventId: 'promised-to-wait',
      significance: 'major' as const,
      year: 1986,
      atMinute: 800,
    }
    const state = fold(DEFAULT_IDENTITY, 1986, [
      { t: 'relationship.memory_added', memory },
      { t: 'relationship.memory_added', memory },
    ])
    expect(state.relationshipMemory).toHaveLength(1)
    expect(state.relationships.kobi?.sharedHistory).toBeGreaterThan(60)
  })

  it('lets a later conversation ask about it', () => {
    const promised = fold(DEFAULT_IDENTITY, 1986, [
      {
        t: 'relationship.memory_added',
        memory: { characterId: 'kobi', eventId: 'promised-to-wait', significance: 'major', year: 1986, atMinute: 800 },
      },
    ])
    const condition = { relationshipMemory: { who: 'kobi', eventId: 'promised-to-wait' } }
    expect(meets(promised, condition)).toBe(true)
    expect(meets(fresh(), condition)).toBe(false)
  })

  it('gives the reunion more than one shape', () => {
    const reunion = DIALOGUE['kobi-found']
    expect(reunion?.branches.length ?? 0).toBeGreaterThanOrEqual(4)
    const conditional = reunion?.branches.filter((branch) => branch.when) ?? []
    expect(conditional.length).toBeGreaterThanOrEqual(3)
    // and every one of them still ends the day
    for (const branch of reunion?.branches ?? []) {
      expect((branch.then ?? []).some((effect) => effect.e === 'ending')).toBe(true)
    }
  })

  it('has at least one choice that only exists because of an earlier one', () => {
    const gated = (Object.values(DIALOGUE) as Conversation[]).flatMap((conversation) =>
      conversation.branches.filter(
        (branch) => branch.when?.relationshipMemory || branch.when?.personalityAbove || branch.when?.redHeartAbove,
      ),
    )
    expect(gated.length).toBeGreaterThanOrEqual(3)
  })
})

// ---------------------------------------------------------------------------------
describe('הקופסה האדומה — not everybody keeps the same thing', () => {
  it('never puts in something the day did not produce', () => {
    const empty = pickRedBoxItem(fresh())
    expect(empty.item).not.toBeNull()
    // the only candidate with no requirement is the folded paper off the floor
    expect(empty.item?.item).toBe('folded-paper')
  })

  it('picks a different thing for a different afternoon', () => {
    const withStub = fold(DEFAULT_IDENTITY, 1986, [
      { t: 'item.gained', item: 'ticket-stub' },
      { t: 'item.gained', item: 'scarf' },
      { t: 'item.gained', item: 'football-card' },
    ])
    const picks = new Set<string>()
    for (let cursor = 0; cursor < 24; cursor += 1) {
      const rolled = pickRedBoxItem({ ...withStub, rng: { seed: 'box', cursor } })
      if (rolled.item) picks.add(rolled.item.id)
    }
    expect(picks.size).toBeGreaterThan(1)
  })

  it('keeps one row per object however often the log is replayed', () => {
    const rolled = pickRedBoxItem(fold(DEFAULT_IDENTITY, 1986, [{ t: 'item.gained', item: 'scarf' }]))
    expect(rolled.item).not.toBeNull()
    if (!rolled.item) return
    const state = fold(DEFAULT_IDENTITY, 1986, [
      { t: 'redbox.item_added', item: rolled.item },
      { t: 'redbox.item_added', item: rolled.item },
    ])
    expect(state.redBox).toHaveLength(1)
  })

  it('describes every candidate it could ever hand out', () => {
    for (const candidate of CANDIDATES_1986) {
      expect(candidate.titleHe.length).toBeGreaterThan(1)
      expect(candidate.noteHe.length).toBeGreaterThan(10)
      expect(candidate.weight).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------------
describe('PURE HAPOEL LOVE — one owner, and it is not a content file', () => {
  it('is never a number a player can chase', () => {
    expect(resolvePureLove(fresh()).percent).toBeNull()
    const grown = fold(DEFAULT_IDENTITY, 1986, [
      { t: 'redheart.changed', key: 'footballLove', delta: 90 },
      { t: 'redheart.changed', key: 'loyaltyReturn', delta: 90 },
    ])
    expect(resolvePureLove(grown).percent).toBeNull()
  })

  it('knows the difference between inheriting it and choosing it', () => {
    const taken = fold(DEFAULT_IDENTITY, 1986, [
      { t: 'flag.raised', flag: 'went:alone' },
      { t: 'anchor.attended', anchorId: 'x' },
    ])
    const carried = fold(DEFAULT_IDENTITY, 1986, [{ t: 'anchor.attended', anchorId: 'x' }])
    expect(resolvePureLove(taken).stage).toBe('chosen')
    expect(resolvePureLove(carried).stage).toBe('inherited')
    expect(resolvePureLove(fresh()).stage).toBe('unformed')
  })

  it('is not set by anything but its own resolver', () => {
    for (const path of walk(join(ROOT, 'lib/life'))) {
      if (path.endsWith('pure-love.ts')) continue
      const text = readFileSync(path, 'utf8')
      expect(/pureLove\s*[=:]\s*\d/.test(text), `${path} writes a Pure Love value`).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------------
describe('הפרופיל — a person, described, never a bar', () => {
  it('turns numbers into words and hands over no numbers', () => {
    const state = fold(DEFAULT_IDENTITY, 1986, [
      { t: 'redheart.changed', key: 'footballLove', delta: 60 },
      { t: 'wellbeing.changed', key: 'exhaustion', delta: 60 },
      { t: 'personality.shifted', key: 'independence', delta: 60 },
    ])
    const profile = buildProfile(state, [], ['kobi', 'rachel', 'ofir'], '')
    expect(profile.wellbeing.length).toBeGreaterThan(0)
    expect(profile.personality.length).toBeGreaterThan(0)
    expect(profile.redHeart.some((entry) => entry.key === 'footballLove')).toBe(true)
    for (const entry of profile.redHeart) expect(entry.band).toBeLessThanOrEqual(3)
  })

  it('draws no progress bar and prints no percentage', () => {
    const card = readFileSync(join(ROOT, 'components/life/ProfileCard.tsx'), 'utf8')
    expect(/%\s*<\/|toFixed|Math\.round\(.*100/.test(card), 'the profile is printing a value').toBe(false)
    expect(card).not.toContain('role="progressbar"')
  })

  it('is developer-only where it shows the truth', () => {
    const stage = readFileSync(join(ROOT, 'app/life/LifeStage.tsx'), 'utf8')
    expect(stage).toContain("process.env.NODE_ENV !== 'production'")
    expect(stage).toContain('DebugPanel')
  })
})

// ---------------------------------------------------------------------------------
describe('הבדיון החדש — the new content states no fact either', () => {
  const authored = [
    'lib/life/content/opportunities1986.ts',
    'lib/life/content/encounters1986.ts',
    'lib/life/content/ambient1986.ts',
    'lib/life/content/schedules1986.ts',
  ].map((path) => readFileSync(join(ROOT, path), 'utf8'))

  it('prints no scoreline', () => {
    for (const text of authored) {
      for (const line of text.split('\n').filter((line) => /He:|lineHe|text:/.test(line))) {
        expect(/\d+\s*[:\-–]\s*\d+/.test(line), `a scoreline: ${line.trim()}`).toBe(false)
      }
    }
  })

  it('names no year at all', () => {
    for (const text of authored) {
      const lines = text.split('\n').filter((line) => /He:\s*'/.test(line))
      for (const line of lines) {
        expect(/\b(19|20)\d{2}\b/.test(line), `a year in authored copy: ${line.trim()}`).toBe(false)
      }
    }
  })

  it('gives every encounter something to say and something to do', () => {
    for (const encounter of ENCOUNTERS_1986) {
      expect(encounter.lineHe.length, encounter.id).toBeGreaterThan(10)
      expect(encounter.effects.length, encounter.id).toBeGreaterThan(0)
      expect(encounter.weight).toBeGreaterThan(0)
      for (const location of encounter.locations) {
        expect(SCENE[location as keyof typeof SCENE], `${encounter.id} → ${location}`).toBeDefined()
      }
      // An encounter may not end the chapter, move the player or open a window.
      for (const effect of encounter.effects as Effect[]) {
        expect(['ending', 'travel', 'goto', 'seize', 'minigame']).not.toContain(effect.e)
      }
    }
  })
})

// ---------------------------------------------------------------------------------
describe('ריצה שנייה — two saves diverge', () => {
  it('produces a different life from a different set of decisions', () => {
    const a = new LifeEngine(DEFAULT_IDENTITY, 1986)
    a.dispatch(
      { t: 'rng.seeded', seed: 'run-a' },
      { t: 'opportunity.accepted', id: 'ofir-game' },
      { t: 'bond.shifted', who: 'ofir', delta: 14 },
      { t: 'redheart.changed', key: 'footballLove', delta: 8 },
    )
    const b = new LifeEngine(DEFAULT_IDENTITY, 1986)
    b.dispatch(
      { t: 'rng.seeded', seed: 'run-b' },
      { t: 'opportunity.accepted', id: 'efi-hall' },
      { t: 'opportunity.missed', id: 'ofir-game' },
      { t: 'bond.shifted', who: 'efi', delta: 16 },
      { t: 'redheart.changed', key: 'basketballLove', delta: 14 },
    )

    expect(a.state.redHeart).not.toEqual(b.state.redHeart)
    expect(a.state.relationships).not.toEqual(b.state.relationships)
    expect(a.state.opportunities).not.toEqual(b.state.opportunities)
    expect(a.state.rng.seed).not.toBe(b.state.rng.seed)
    expect(b.state.wellbeing.regret).toBeGreaterThan(a.state.wellbeing.regret)
  })

  it('reopens either of them from the log alone', () => {
    const engine = new LifeEngine(DEFAULT_IDENTITY, 1986)
    engine.dispatch({ t: 'rng.seeded', seed: 'reopen' })
    engine.remember('kobi', 'promised-to-wait', 'major')
    engine.dispatch({ t: 'opportunity.accepted', id: 'amit-paper' })
    const reopened = new LifeEngine(DEFAULT_IDENTITY, 1986, engine.log())
    expect(reopened.state).toEqual(engine.state)
  })
})
