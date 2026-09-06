import { describe, expect, it } from 'vitest'

import { CAST_CARDS, cardForName, metFlag } from '@/lib/life/castCards'
import { CHARACTERS } from '@/lib/life/characters'
import { DIALOGUE } from '@/lib/life/content/dialogue'
import { SHIRTS, onSale, wearingAt, wornFlag, wornIn } from '@/lib/life/shirts'
import { FILM_CUTS, cutFor, filmFlag } from '@/lib/life/world/transitions'
import { fold } from '@/lib/life/events'
import { DEFAULT_IDENTITY } from '@/lib/life/content/chapter1986'
import type { LifeEvent } from '@/lib/life/events'

/**
 * שלושת המפתחות — the three things Maor asked for after delta 28, tested where they can
 * actually go wrong: the shirt that remembers a day, the plot holes that were reported and
 * not silently patched, and nine clips that were cut and never played.
 */

const base: LifeEvent[] = [
  { t: 'flag.raised', flag: 'life:opening' },
  { t: 'chapter.entered', chapter: '1999-cup' },
]

describe('הזיכרון של החולצה — a wardrobe that is a biography', () => {
  it('wears the newest shirt you own that already existed', () => {
    const log: LifeEvent[] = [
      ...base,
      { t: 'flag.raised', flag: 'own:shirt:visa86' },
      { t: 'flag.raised', flag: 'own:shirt:king' },
    ]
    const state = fold(DEFAULT_IDENTITY, 1999, log)
    expect(wearingAt(state, log, '1999-cup')?.id).toBe('king')
  })

  it('never wears a shirt from a season that has not happened', () => {
    // `crt` first hangs in 2000; a boy in 1993 cannot be wearing it even if the save says so
    const log: LifeEvent[] = [
      { t: 'flag.raised', flag: 'life:opening' },
      { t: 'chapter.entered', chapter: '1993-cup' },
      { t: 'flag.raised', flag: 'own:shirt:visa86' },
      { t: 'flag.raised', flag: 'own:shirt:crt' },
    ]
    const state = fold(DEFAULT_IDENTITY, 1993, log)
    expect(wearingAt(state, log, '1993-cup')?.id).toBe('visa86')
  })

  it('wears nothing when you own nothing, and says so by saying nothing', () => {
    const state = fold(DEFAULT_IDENTITY, 1999, base)
    expect(wearingAt(state, base, '1999-cup')).toBeNull()
  })

  it('reads back every day a shirt was worn to', () => {
    const log: LifeEvent[] = [
      ...base,
      { t: 'flag.raised', flag: 'own:shirt:king' },
      { t: 'flag.raised', flag: wornFlag('king', '1998-laces') },
      { t: 'flag.raised', flag: wornFlag('king', '1999-cup') },
    ]
    const state = fold(DEFAULT_IDENTITY, 1999, log)
    expect(wornIn(state, 'king').sort()).toEqual(['1998-laces', '1999-cup'])
    expect(wornIn(state, 'visa86')).toEqual([])
  })

  it('the memory flag survives a new day, because it carries the own: prefix', () => {
    const log: LifeEvent[] = [
      ...base,
      { t: 'flag.raised', flag: 'own:shirt:king' },
      { t: 'flag.raised', flag: wornFlag('king', '1999-cup') },
      { t: 'day.entered', weekday: 4, minute: 8 * 60 },
    ]
    const state = fold(DEFAULT_IDENTITY, 1999, log)
    expect(state.flags[wornFlag('king', '1999-cup')]).toBe(true)
  })
})

describe('כרטיסי היכרות — nineteen people, once each', () => {
  it('every card names a character the registry knows', () => {
    for (const card of CAST_CARDS) {
      expect(CHARACTERS[card.id], `${card.id} is not in characters.ts`).toBeDefined()
    }
  })

  it('never writes comedy about a real person', () => {
    for (const card of CAST_CARDS) {
      const who = CHARACTERS[card.id]
      expect(who?.provenance ?? 'fiction', `${card.id} is real`).not.toBe('real')
      expect(who?.category, `${card.id} is historical`).not.toBe('historical')
    }
  })

  it('is reachable — every name it answers to is spoken by a conversation', () => {
    const spoken = new Set(Object.values(DIALOGUE).map((row) => row.nameHe).filter(Boolean))
    for (const card of CAST_CARDS) {
      const hit = card.namesHe.some((name) => spoken.has(name))
      expect(hit, `nobody in the game is called ${card.namesHe.join('/')}`).toBe(true)
    }
  })

  it('holds three lines and a stamp, and matches by the name a line carries', () => {
    for (const card of CAST_CARDS) {
      expect(card.linesHe).toHaveLength(3)
      expect(card.sinceHe.length).toBeGreaterThan(2)
      for (const line of card.linesHe) expect(line.length).toBeLessThan(140)
    }
    expect(cardForName('רפי')?.id).toBe('shopkeeper')
    expect(cardForName('קובי')?.id).toBe('kobi')
    expect(cardForName('מישהו שלא קיים')).toBeNull()
    expect(metFlag('kobi').startsWith('own:')).toBe(true)
  })
})

describe('מעברונים — nine clips, and the rules that stop them becoming a loading screen', () => {
  it('says nothing on an ordinary door', () => {
    expect(cutFor('kiosk', 'street', 12 * 60, '1986', {})).toBeNull()
    expect(cutFor('bedroom', 'home', 12 * 60, '1986', {})).toBeNull()
  })

  it('plays the promenade going north, and a different one coming back', () => {
    expect(cutFor('street', 'ussishkin-outside', 12 * 60, '1991', {})?.clip).toBe('promenade-dusk')
    expect(cutFor('ussishkin-outside', 'street', 12 * 60, '1991', {})?.clip).toBe('promenade-walk')
  })

  it('plays once per chapter and then remembers', () => {
    const cut = cutFor('street', 'ussishkin-outside', 12 * 60, '1991', {})
    expect(cut).not.toBeNull()
    const seen = { [filmFlag(cut!.clip, '1991')]: true }
    expect(cutFor('street', 'ussishkin-outside', 12 * 60, '1991', seen)).toBeNull()
    // …and a new chapter is a new first time
    expect(cutFor('street', 'ussishkin-outside', 12 * 60, '1993-cup', seen)).not.toBeNull()
  })

  it('never cuts to a morning street at night', () => {
    expect(cutFor('home', 'street', 9 * 60, '1986', {})?.clip).toBe('street-morning')
    expect(cutFor('home', 'street', 20 * 60, '1986', {})).toBeNull()
    expect(cutFor('street', 'route', 20 * 60, '1986', {})?.clip).toBe('night-lights')
    expect(cutFor('street', 'route', 12 * 60, '1986', {})).toBeNull()
  })

  it('every cut is a door that exists in the world', async () => {
    const { ALL_SCENES } = await import('@/lib/life/world/scenes')
    const doors = new Set<string>()
    for (const scene of ALL_SCENES) for (const exit of scene.exits) doors.add(`${scene.id}→${exit.to}`)
    for (const cut of FILM_CUTS) {
      expect(doors.has(`${cut.from}→${cut.to}`), `${cut.from} → ${cut.to} is not a door`).toBe(true)
    }
  })

  it('every clip it names is a file that was actually cut', async () => {
    const { existsSync } = await import('node:fs')
    for (const cut of FILM_CUTS) {
      expect(existsSync(`public/life/film/${cut.clip}.mp4`), `${cut.clip}.mp4`).toBe(true)
      expect(existsSync(`public/life/film/${cut.clip}.jpg`), `${cut.clip}.jpg`).toBe(true)
    }
  })
})

describe('אין שיחות יתומות — every conversation has a way in', () => {
  it('names no conversation that nothing in the game can open', async () => {
    const { ALL_SCENES, PANO_SPOTS } = await import('@/lib/life/world/scenes')
    const { readFileSync, readdirSync } = await import('node:fs')
    const used = new Set<string>()
    for (const scene of ALL_SCENES) {
      for (const spot of scene.hotspots) used.add(spot.act)
      for (const actor of scene.actors) if (actor.talk) used.add(actor.talk)
    }
    for (const look of Object.values(PANO_SPOTS ?? {})) {
      for (const mark of look?.spots ?? []) used.add(mark.act)
    }
    // …or named anywhere in the content and runtime source (a beat, a `goto`, a director)
    const files: string[] = []
    for (const dir of ['lib/life', 'lib/life/content', 'lib/life/runtime', 'lib/life/runtime/scenes']) {
      for (const file of readdirSync(dir)) if (file.endsWith('.ts')) files.push(`${dir}/${file}`)
    }
    const source = files.map((file) => readFileSync(file, 'utf8')).join('\n')
    const orphans = Object.keys(DIALOGUE).filter((id) => !used.has(id) && !source.includes(`'${id}'`))
    /**
     * This audit found seventeen on 6.9.2026 — every `gig-alley-coin-*`, because the coin
     * game was written, generated, tested and then never given a hotspot in the alley. A
     * conversation nothing can open is content that does not exist.
     */
    expect(orphans, `unreachable: ${orphans.slice(0, 8).join(', ')}`).toEqual([])
  })
})

describe('הבאגים שדווחו — and were fixed rather than filed', () => {
  const text = (id: string) => JSON.stringify(DIALOGUE[id])

  it('a5: the father who drove off does not put a hand on your shoulder', () => {
    const close = DIALOGUE['a5-close']
    expect(close).toBeDefined()
    const alone = close?.branches.find((branch) => JSON.stringify(branch.when).includes('a5:kobi-left'))
    expect(alone, 'a5-close has no branch for arriving alone').toBeDefined()
    expect(JSON.stringify(alone)).toContain('לבד')
  })

  it('a5: the two conversations at the gate exist and are now placed in the scene', async () => {
    const { SCENE } = await import('@/lib/life/world/scenes')
    const talks = SCENE['bloomfield-outside'].actors.map((actor) => actor.talk)
    expect(talks).toContain('kobi-a5-gate')
    expect(talks).toContain('barry-a5')
  })

  it('1993: running home, staying, or finding Ofir are three different endings', () => {
    const close = text('close-1993')
    expect(close).toContain('after:home')
    expect(close).toContain('after:group')
    expect(close).toContain('after:ofir')
  })

  it("1993: Ofir's route is a different way in, not the same bus", () => {
    const bus = text('bus-1993')
    expect(bus).toContain('in:sideGate')
    // …and it is cheaper than the bus, and it shuts
    expect(bus).toContain('"agorot":-3000')
    expect(bus).toContain('"agorot":-3600')
  })

  it('1993 galil: asking for help does not require having signed up three days earlier', () => {
    const bus = DIALOGUE['g4-limor']
    const last = bus?.branches[bus.branches.length - 1]
    expect(JSON.stringify(last)).toContain('g4-broke')
  })

  it('1991: the doorman is still there when the derby ends', async () => {
    const { SCHEDULE_1991 } = await import('@/lib/life/content/schedules1991')
    const usher = SCHEDULE_1991.find((row) => row.actorId === 'usher-night')
    expect(usher).toBeDefined()
    // the derby runs past ten; a window that closes at 20:20 could never hear its own line
    expect(usher!.end).toBeGreaterThan(22 * 60)
  })

  it('the match scripts assert no crowd size the archive cannot source', () => {
    const scripts = JSON.stringify(Object.values(DIALOGUE))
    expect(scripts).not.toContain('ארבעים אלף')
    expect(scripts).not.toContain('שש אלף')
  })

  it('every shirt in the collection is priced and named', () => {
    for (const shirt of SHIRTS) {
      expect(shirt.price, shirt.id).toBeGreaterThan(0)
      expect(shirt.nameHe.length, shirt.id).toBeGreaterThan(2)
    }
    expect(onSale('a2-alley').length).toBeGreaterThan(0)
  })
})
