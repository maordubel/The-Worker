import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
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
import { LIFE_PALETTE } from '@/lib/life/runtime/palette'
import { ALL_SCENES, SCENE } from '@/lib/life/world/scenes'
import { BACKDROP, FIGURE, PROP } from '@/lib/life/runtime/art'
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
const ART = join(ROOT, 'public/life/art')
const artManifest = JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8')) as Record<
  string,
  Record<string, { w: number; h: number; bytes: number; source: string; box: number[]; deyellowed: number; yellowLeft: number }>
>

describe('חוק הצהוב — neither the palette nor the artwork has yellow in it', () => {
  it('has no yellow value in the runtime palette', () => {
    for (const [name, colour] of Object.entries(LIFE_PALETTE)) {
      const r = (colour >> 16) & 0xff
      const g = (colour >> 8) & 0xff
      const b = colour & 0xff
      expect(isYellow(r, g, b), `${name} is yellow`).toBe(false)
    }
  })

  it('ships not one yellow pixel of concept art', () => {
    // Rule 8 has no exemption for artwork and rule 27 says lossy formats put it back at
    // decode. `scripts/life/build-art.py` rotates every pixel in the yellow hue band onto
    // hue 33 at the same saturation and value — the badge's own treatment — and writes a
    // palette PNG, then records the count here. A non-zero number means somebody shipped
    // an asset without running the build.
    let assets = 0
    for (const group of Object.values(artManifest)) {
      for (const [key, row] of Object.entries(group)) {
        assets += 1
        expect(row.yellowLeft, `${key} ships ${row.yellowLeft} yellow pixels`).toBe(0)
      }
    }
    expect(assets).toBeGreaterThan(20)
  })

  it('has a real file behind every asset the manifest claims', () => {
    for (const group of Object.values(artManifest)) {
      for (const key of Object.keys(group)) {
        expect(existsSync(join(ART, `${key}.png`)), `${key}.png is missing`).toBe(true)
      }
    }
  })

  it('keeps the art folder small enough to load a room at a time', () => {
    let bytes = 0
    for (const group of Object.values(artManifest)) {
      for (const row of Object.values(group)) bytes += row.bytes
    }
    // The whole set, not the load: a scene pulls one backdrop plus its people.
    expect(bytes / 1024 / 1024).toBeLessThan(9)
  })

  it('draws no raw colour literal in the runtime outside the palette file', () => {
    const runtime = walk(join(ROOT, 'lib/life'))
    for (const path of runtime) {
      if (path.endsWith('palette.ts')) continue
      const text = readFileSync(path, 'utf8')
      const hits = [...text.matchAll(/0x[0-9a-fA-F]{6}/g)].map((match) => match[0])
      const bad = hits.filter((hit) => hit.toLowerCase() !== '0x000000')
      expect(bad, `${path} uses raw colours ${bad.join(', ')}`).toEqual([])
    }
  })
})

describe('הקאנון החזותי — the boards decide who these people are', () => {
  const figures = artManifest['figures'] ?? {}

  it('cuts every core character out of the approved cast row', () => {
    // Brief §4: the approved character identities are not a style note, they are the
    // canon. Cutting them from the cast board rather than drawing them is what guarantees
    // Ofir keeps his buzz cut and Amit never acquires glasses — nobody is redrawing them.
    for (const key of ['kid', 'ofir', 'amit', 'efi', 'keren', 'kobi', 'rachel']) {
      const row = figures[key]
      expect(row, `${key} is not cut from any board`).toBeDefined()
      expect(row?.source, `${key} comes from the wrong board`).toBe('stageA2')
    }
  })

  it('cuts the children full-length and never crops one at the knee', () => {
    for (const key of ['kid', 'ofir', 'amit', 'efi', 'keren']) {
      const row = figures[key]
      expect(row && row.h / row.w > 2.1, `${key} is not a full-length figure`).toBe(true)
    }
  })

  it('never invents a figure the build did not produce', () => {
    for (const key of FIGURE) {
      expect(figures[key], `${key} is named by the runtime but never cut`).toBeDefined()
    }
  })
})

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
  const scenes = ALL_SCENES

  it('resolves every exit to a real scene and a real spawn point', () => {
    for (const scene of scenes) {
      for (const exit of scene.exits) {
        const target = SCENE[exit.to as keyof typeof SCENE]
        expect(target, `${scene.id}/${exit.id} → ${exit.to}`).toBeDefined()
        expect(
          target && exit.spawn in target.spawns,
          `${scene.id}/${exit.id} → ${exit.to}:${exit.spawn}`,
        ).toBe(true)
      }
    }
  })

  it('spawns everybody inside the walk band', () => {
    // A spawn above the band puts the child on a wall; below it puts them off the
    // painting. Both are invisible in a screenshot and obvious in ten seconds of play.
    for (const scene of scenes) {
      for (const [name, point] of Object.entries(scene.spawns)) {
        expect(point.x > 0 && point.x < 1, `${scene.id}:${name} x`).toBe(true)
        expect(
          point.y >= scene.band.far - 0.02 && point.y <= scene.band.near + 0.02,
          `${scene.id}:${name} y ${point.y} outside band ${scene.band.far}..${scene.band.near}`,
        ).toBe(true)
      }
    }
  })

  it('keeps every actor and hotspot on the painting', () => {
    for (const scene of scenes) {
      for (const actor of scene.actors) {
        expect(actor.x > 0 && actor.x < 1 && actor.y > 0.4 && actor.y < 1.01, `${scene.id}/${actor.id}`).toBe(true)
        expect(actor.size > 0.05 && actor.size < 0.8, `${scene.id}/${actor.id} size`).toBe(true)
      }
      for (const spot of scene.hotspots) {
        expect(spot.x > 0 && spot.x < 1 && spot.y > 0.4 && spot.y < 1.01, `${scene.id}/${spot.id}`).toBe(true)
      }
    }
  })

  it('names only art that the build script actually produced', () => {
    const backdrops = new Set<string>(BACKDROP)
    const figures = new Set<string>(FIGURE)
    const props = new Set<string>(PROP)
    for (const scene of scenes) {
      expect(backdrops.has(scene.art), `${scene.id} → ${scene.art}`).toBe(true)
      if (scene.arrival) expect(backdrops.has(scene.arrival.art), `${scene.id} arrival`).toBe(true)
      for (const actor of scene.actors) {
        expect(figures.has(actor.figure), `${scene.id}/${actor.id} → ${actor.figure}`).toBe(true)
      }
      for (const spot of scene.hotspots) {
        if (spot.prop) expect(props.has(spot.prop.key), `${scene.id}/${spot.id} → ${spot.prop.key}`).toBe(true)
      }
    }
  })

  it('points every interaction at a conversation that exists', () => {
    for (const scene of scenes) {
      for (const spot of scene.hotspots) {
        expect(DIALOGUE[spot.act], `${scene.id}/${spot.id} → ${spot.act}`).toBeDefined()
      }
      for (const actor of scene.actors) {
        if (!actor.talk) continue
        expect(DIALOGUE[actor.talk], `${scene.id}/${actor.id} → ${actor.talk}`).toBeDefined()
      }
    }
  })

  it('walks from the bedroom to the terrace', () => {
    const seen = new Set<string>(['bedroom'])
    const queue = ['bedroom']
    while (queue.length > 0) {
      const id = queue.shift() as keyof typeof SCENE
      for (const exit of SCENE[id]?.exits ?? []) {
        if (seen.has(exit.to)) continue
        seen.add(exit.to)
        queue.push(exit.to)
      }
    }
    for (const scene of scenes) {
      expect(seen.has(scene.id), `${scene.id} is unreachable from the bedroom`).toBe(true)
    }
  })
})

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
