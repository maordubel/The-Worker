import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { isYellow } from '@/lib/isYellow'
import { resolveChapterAnchor, resolvePrologueAnchor } from '@/lib/life/anchor-server'
import { isPlaceholder } from '@/lib/life/anchors'
import { DIALOGUE } from '@/lib/life/content/dialogue'
import { DEFAULT_IDENTITY, ENDINGS, PROLOGUE } from '@/lib/life/content/chapter1980'
import type { Conversation } from '@/lib/life/content/script'
import { LifeEngine } from '@/lib/life/engine'
import { apply, emptyState, fold, type LifeEvent } from '@/lib/life/events'
import { cast } from '@/lib/life/runtime/figures'
import { LIFE_PALETTE } from '@/lib/life/runtime/palette'
import { MAPS } from '@/lib/life/world/maps'
import { meets } from '@/lib/life/world/types'

/**
 * THE WORKER LIFE — the guards.
 *
 * The brief's non-negotiables are mostly not things a screenshot can show: that no
 * historical fact was invented, that no core character wears yellow, that a save is a
 * log rather than a snapshot, that every door in the world leads somewhere that exists.
 * Those are exactly the class of claim this repo turns into a test rather than a
 * sentence in a handoff (rule 29), so here they are.
 */

const ROOT = process.cwd()
const state = () => emptyState(DEFAULT_IDENTITY, 1980)

// ---------------------------------------------------------------------------------
describe('חוק הצהוב — the world has no yellow in it', () => {
  it('has no yellow value in the palette', () => {
    for (const [name, colour] of Object.entries(LIFE_PALETTE)) {
      const r = (colour >> 16) & 0xff
      const g = (colour >> 8) & 0xff
      const b = colour & 0xff
      expect(isYellow(r, g, b), `${name} is yellow`).toBe(false)
    }
  })

  it('dresses every character out of the palette and nowhere else', () => {
    // Rule 8 has no exemption for generated artwork (rule 27). A figure that picked its
    // own colour would be a yellow shirt one refactor away.
    const allowed = new Set<number>(Object.values(LIFE_PALETTE))
    for (const figure of Object.values(cast(LIFE_PALETTE))) {
      for (const [field, value] of Object.entries(figure)) {
        if (typeof value !== 'number' || field === 'height') continue
        expect(allowed.has(value), `${figure.id}.${field} is not a palette colour`).toBe(true)
      }
    }
  })

  it('draws no raw colour literal in the runtime outside the palette file', () => {
    const runtime = walk(join(ROOT, 'lib/life'))
    for (const path of runtime) {
      if (path.endsWith('palette.ts')) continue
      const text = readFileSync(path, 'utf8')
      const hits = [...text.matchAll(/0x[0-9a-fA-F]{6}/g)].map((match) => match[0])
      // 0x000000 is the eyes: pure ink at an alpha, and it cannot be a hue.
      const bad = hits.filter((hit) => hit.toLowerCase() !== '0x000000')
      expect(bad, `${path} uses raw colours ${bad.join(', ')}`).toEqual([])
    }
  })
})

// ---------------------------------------------------------------------------------
describe('אופיר, עמית, קובי — the visual canon the brief already fixed', () => {
  const figures = cast(LIFE_PALETTE)

  it('gives Ofir a buzz cut, and only Ofir', () => {
    expect(figures['ofir']?.hairStyle).toBe('buzz')
    const buzzed = Object.values(figures).filter((figure) => figure.hairStyle === 'buzz')
    expect(buzzed.map((figure) => figure.id)).toEqual(['ofir'])
  })

  it('keeps Kobi in his approved direction', () => {
    const kobi = figures['kobi']
    expect(kobi?.moustache).toBe(true)
    expect(kobi?.shirt).toBe(LIFE_PALETTE.workShirt)
    expect(kobi?.legs).toBe(LIFE_PALETTE.denimDark)
  })

  it('has no glasses layer at all, so Amit can never get a pair by accident', () => {
    // Comments are prose about the rule; the rule applies to the code — the same split
    // `tests/brand.test.ts` makes, and for the same reason.
    const source = readFileSync(join(ROOT, 'lib/life/runtime/figures.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    expect(/glasses|spectacle/i.test(source)).toBe(false)
    expect(source.includes('hairStyle')).toBe(true)
  })

  it('puts the child in Hapoel red', () => {
    expect(figures['kid']?.shirt).toBe(LIFE_PALETTE.red)
  })
})

// ---------------------------------------------------------------------------------
describe('העוגן ההיסטורי — canonical, sourced, and honest about the gap', () => {
  it('resolves the chapter anchor from the archive at confidence 2', () => {
    const anchor = resolveChapterAnchor()
    expect(anchor.confidence).toBeGreaterThanOrEqual(2)
    expect(anchor.sport).toBe('football')
    expect(anchor.seasonLabel).toBe('1980/81')
    expect(anchor.sourceTitle.length).toBeGreaterThan(3)
    expect(anchor.id).not.toBe('DEV-PLACEHOLDER')
  })

  it('marks the missing match as a placeholder rather than filling it in', () => {
    // The archive has the championship and not the game that decided it. Until a curated
    // 1980/81 match row exists, the game must say so on screen.
    const anchor = resolveChapterAnchor()
    expect(anchor.placeholder).not.toBeNull()
    expect(anchor.placeholder?.needs).toContain('1980/81')
    expect(isPlaceholder(anchor)).toBe(true)
  })

  it('builds the headline from canonical fields only — no opponent, no score', () => {
    for (const anchor of [resolveChapterAnchor(), resolvePrologueAnchor()]) {
      expect(anchor.headlineHe).toContain(anchor.seasonLabel)
      expect(/\d+\s*[:\-–]\s*\d+/.test(anchor.headlineHe), 'a scoreline reached the headline').toBe(
        false,
      )
    }
  })
})

// ---------------------------------------------------------------------------------
describe('הבדיון אינו היסטוריה — the content layer invents no facts', () => {
  const authored = [
    readFileSync(join(ROOT, 'lib/life/content/dialogue.ts'), 'utf8'),
    readFileSync(join(ROOT, 'lib/life/content/chapter1980.ts'), 'utf8'),
  ].join('\n')

  it('never prints a scoreline', () => {
    const lines = authored.split('\n').filter((line) => line.includes('text:'))
    for (const line of lines) {
      expect(/\d+\s*[:\-–]\s*\d+/.test(line), `a scoreline appears: ${line.trim()}`).toBe(false)
    }
  })

  it('names no year but the two the chapter is set in', () => {
    const years = new Set([...authored.matchAll(/\b(19|20)\d{2}\b/g)].map((match) => match[0]))
    for (const year of years) {
      expect(['1972', '1980', '1981'], `unexpected year ${year} in authored content`).toContain(year)
    }
  })

  it('substitutes the canonical anchor into the prologue rather than writing it out', () => {
    expect(PROLOGUE.some((line) => line.text.includes('{anchor}'))).toBe(true)
  })

  it('gives every ending a memory, so no day ends with nothing', () => {
    for (const ending of Object.values(ENDINGS)) {
      expect(ending.memoryItem.length).toBeGreaterThan(0)
      expect(ending.bodyHe.length).toBeGreaterThan(30)
    }
  })
})

// ---------------------------------------------------------------------------------
describe('מנוע החיים — the log is the save', () => {
  it('folds to the same state every time', () => {
    const events: LifeEvent[] = [
      { t: 'money.changed', agorot: 60, why: 'בקבוקים' },
      { t: 'item.gained', item: 'newspaper' },
      { t: 'bond.shifted', who: 'ofir', delta: 12 },
      { t: 'clock.advanced', minutes: 95 },
    ]
    const a = fold(DEFAULT_IDENTITY, 1980, events)
    const b = fold(DEFAULT_IDENTITY, 1980, events)
    expect(a).toEqual(b)
    expect(a.agorot).toBe(60)
    expect(a.minute).toBe(12 * 60 + 35 + 95)
  })

  it('never lets money go negative', () => {
    const after = apply(state(), { t: 'money.changed', agorot: -400, why: 'test' })
    expect(after.agorot).toBe(0)
  })

  it('clamps a bond to 0..100 however hard a scene pushes', () => {
    let current = state()
    for (let i = 0; i < 40; i += 1) {
      current = apply(current, { t: 'bond.shifted', who: 'kobi', delta: 9 })
    }
    expect(current.bonds.kobi).toBe(100)
  })

  it('wraps the clock over midnight instead of running past 24:00', () => {
    const after = apply(state(), { t: 'clock.advanced', minutes: 15 * 60 })
    expect(after.minute).toBe((12 * 60 + 35 + 15 * 60) % 1440)
    expect(after.weekday).toBe(0)
  })

  it('keeps one memory when the same one is replayed', () => {
    const memory = { id: 'x', item: 'ticket-stub' as const, atMinute: 10, year: 1980, anchorId: null }
    const after = fold(DEFAULT_IDENTITY, 1980, [
      { t: 'memory.kept', memory },
      { t: 'memory.kept', memory },
    ])
    expect(after.memories).toHaveLength(1)
  })

  it('folds an event from a newer build to a no-op rather than corrupting the save', () => {
    const future = { t: 'something.fromTheFuture' } as unknown as LifeEvent
    expect(apply(state(), future)).toEqual(state())
  })

  it('rebuilds the whole life from the log alone', () => {
    const engine = new LifeEngine(DEFAULT_IDENTITY, 1980)
    engine.dispatch(
      { t: 'flag.raised', flag: 'knows:match' },
      { t: 'money.changed', agorot: 150, why: 'test' },
      { t: 'item.gained', item: 'ticket-stub' },
    )
    const reopened = new LifeEngine(DEFAULT_IDENTITY, 1980, engine.log())
    expect(reopened.state).toEqual(engine.state)
    expect(reopened.has('ticket-stub')).toBe(true)
    expect(reopened.flag('knows:match')).toBe(true)
  })
})

// ---------------------------------------------------------------------------------
describe('העולם — every door leads somewhere that exists', () => {
  const maps = Object.values(MAPS)

  it('resolves every exit to a real map and a real spawn point', () => {
    for (const map of maps) {
      for (const exit of map.exits) {
        const target = MAPS[exit.to as keyof typeof MAPS]
        expect(target, `${map.id}/${exit.id} → ${exit.to}`).toBeDefined()
        expect(
          target && exit.spawn in target.spawns,
          `${map.id}/${exit.id} → ${exit.to}:${exit.spawn}`,
        ).toBe(true)
      }
    }
  })

  it('spawns nobody inside a wall', () => {
    for (const map of maps) {
      for (const [name, point] of Object.entries(map.spawns)) {
        for (const solid of map.solids) {
          const inside =
            point.x > solid.x &&
            point.x < solid.x + solid.w &&
            point.y > solid.y &&
            point.y < solid.y + solid.h
          expect(inside, `${map.id}:${name} spawns inside a solid`).toBe(false)
        }
      }
    }
  })

  it('keeps every prop, person and spawn inside the map', () => {
    for (const map of maps) {
      for (const prop of map.props) {
        expect(prop.x >= 0 && prop.x + prop.w <= map.width, `${map.id}/${prop.id} is off the map`).toBe(true)
      }
      for (const npc of map.npcs) {
        expect(npc.x > 0 && npc.x < map.width && npc.y > 0 && npc.y < map.height, `${map.id}/${npc.id}`).toBe(true)
      }
    }
  })

  it('points every interaction at a conversation that exists', () => {
    for (const map of maps) {
      for (const prop of map.props) {
        if (!prop.act) continue
        expect(DIALOGUE[prop.act], `${map.id}/${prop.id} → ${prop.act}`).toBeDefined()
      }
      for (const npc of map.npcs) {
        if (!npc.talk) continue
        expect(DIALOGUE[npc.talk], `${map.id}/${npc.id} → ${npc.talk}`).toBeDefined()
      }
    }
  })

  it('walks from the bedroom to the terrace', () => {
    // The vertical slice is only a slice if it is connected. This is the whole of brief
    // §30's flow reduced to a graph search: every location must be reachable from the
    // room the game starts in.
    const seen = new Set<string>(['bedroom'])
    const queue = ['bedroom']
    while (queue.length > 0) {
      const id = queue.shift() as keyof typeof MAPS
      for (const exit of MAPS[id]?.exits ?? []) {
        if (seen.has(exit.to)) continue
        seen.add(exit.to)
        queue.push(exit.to)
      }
    }
    for (const map of maps) {
      expect(seen.has(map.id), `${map.id} is unreachable from the bedroom`).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------------
describe('השיחות — a conversation always has a way out', () => {
  const conversations = Object.values(DIALOGUE) as Conversation[]

  it('resolves every goto', () => {
    for (const conversation of conversations) {
      for (const branch of conversation.branches) {
        for (const effect of [...(branch.then ?? []), ...(branch.choices ?? []).flatMap((c) => c.then)]) {
          if (effect.e !== 'goto') continue
          expect(DIALOGUE[effect.node], `${conversation.id} → ${effect.node}`).toBeDefined()
        }
      }
    }
  })

  it('always has a branch that matches a fresh life', () => {
    // A prop whose every branch is conditional is a prop that silently does nothing the
    // first time a player touches it, which reads as a broken game rather than a locked one.
    const fresh = state()
    for (const conversation of conversations) {
      const last = conversation.branches[conversation.branches.length - 1]
      expect(last, `${conversation.id} has no branches`).toBeDefined()
      expect(meets(fresh, last?.when), `${conversation.id} has no unconditional fallback`).toBe(true)
    }
  })

  it('explains every choice it disables', () => {
    for (const conversation of conversations) {
      for (const branch of conversation.branches) {
        for (const choice of branch.choices ?? []) {
          if (!choice.when) continue
          expect(choice.noteHe, `${conversation.id}/${choice.id} locks without saying why`).toBeTruthy()
        }
      }
    }
  })

  it('offers a way into the ground that needs nothing', () => {
    // Brief §23: the finale may be reached in several believable ways, and §26 says the
    // game does not dead-end. So at least one entry route must be unconditional.
    const veteran = DIALOGUE['gate-veteran']
    const open = veteran?.branches.filter((branch) => !branch.when) ?? []
    expect(open.length).toBeGreaterThan(0)
    const grants = open.some((branch) =>
      (branch.then ?? []).some((effect) => effect.e === 'flag' && effect.flag === 'entry:granted'),
    )
    expect(grants, 'no unconditional way into the ground').toBe(true)
  })
})

// ---------------------------------------------------------------------------------
describe('הגבול — the life layer reads history only through the archive', () => {
  it('never imports the curated files directly', () => {
    for (const path of walk(join(ROOT, 'lib/life'))) {
      const text = readFileSync(path, 'utf8')
      expect(text.includes('@/content/manual'), `${path} reads the archive files directly`).toBe(false)
      expect(text.includes('red-fans'), `${path} names the wiki`).toBe(false)
    }
  })

  it('keeps the archive import in exactly one file, and that file is server-only', () => {
    const readers = walk(join(ROOT, 'lib/life')).filter((path) =>
      readFileSync(path, 'utf8').includes("@/lib/game/archive"),
    )
    expect(readers.map((path) => path.replace(`${ROOT}/`, ''))).toEqual(['lib/life/anchor-server.ts'])
    expect(readFileSync(join(ROOT, 'lib/life/anchor-server.ts'), 'utf8')).toContain("import 'server-only'")
  })

  it('keeps Phaser out of everything but the runtime', () => {
    // The engine has to be runnable in this test file with no canvas anywhere.
    for (const path of walk(join(ROOT, 'lib/life'))) {
      if (path.includes('/runtime/')) continue
      expect(readFileSync(path, 'utf8').includes("from 'phaser'"), `${path} imports Phaser`).toBe(false)
    }
  })
})

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (path.endsWith('.ts')) out.push(path)
  }
  return out
}
