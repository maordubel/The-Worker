import { describe, expect, it } from 'vitest'

import { GIGS } from '@/lib/life/gigs'
import { MAP_PLACES } from '@/lib/life/map'
import { ALL_SCENES, SCENE } from '@/lib/life/world/scenes'
import { DIALOGUE } from '@/lib/life/content/dialogue'

/**
 * הדלתות — 6.9.2026, and the three photographs behind them.
 *
 * Maor opened the game on his phone, walked to a door and sent the frame back with the
 * marker floating in the middle of a concrete wall: "הדלת היא בתוך הקיר". Then a second
 * frame with a red box round the shopfront the school gate belongs to, and "ולדייק
 * במיקום!". Then a third, round the avenue that should lead into town.
 *
 * Every one of those is a coordinate, and a coordinate is testable. So are the two things
 * the audit found while fixing them: the supporters' shop and every street job were both
 * being offered from inside the KITCHEN, four hundred lines from the rooms they belong to,
 * and both passed the orphan-conversation audit because the ids WERE used — in the wrong
 * place. A hotspot in the wrong room is not a missing hotspot, which is why it survived a
 * year of tests. It does not survive this one.
 */

const street = SCENE['street']
const allenby = SCENE['allenby']
const exitOf = (scene: typeof street, id: string) => scene.exits.find((exit) => exit.id === id)

describe('הרחוב — the five doors Maor listed, and only those', () => {
  it('has the kiosk, the alley pitch, the school, south Tel Aviv and the city centre', () => {
    const ids = street.exits.map((exit) => exit.id)
    for (const id of ['kiosk', 'pitch', 'school', 'route', 'centre', 'home']) {
      expect(ids, `the street has no ${id}`).toContain(id)
    }
  })

  it('no longer opens onto the hall from the child’s own pavement', () => {
    expect(street.exits.some((exit) => exit.to === 'ussishkin-outside')).toBe(false)
  })

  it('puts the school gate on the shopfront he drew a box round, not inside the wall', () => {
    const school = exitOf(street, 'school')
    expect(school).toBeDefined()
    // his rectangle, measured back to street90.png: 0.7859–0.8595
    expect(school!.x).toBeGreaterThanOrEqual(0.7859 - 0.006)
    expect(school!.x + school!.w).toBeLessThanOrEqual(0.8595 + 0.006)
    // and it is a door in every era now, not only in 1991
    expect(school!.era).toBeUndefined()
  })

  it('names east for the quarter it is, not for one errand', () => {
    expect(exitOf(street, 'route')!.labelHe).toBe('לדרום תל אביב')
    expect(SCENE['route'].titleHe).toBe('דרום תל אביב')
    expect(MAP_PLACES.find((place) => place.id === 'route')!.labelHe).toBe('דרום תל אביב')
  })

  it('sends the city-centre turning to Allenby, with no flag on it', () => {
    const centre = exitOf(street, 'centre')!
    expect(centre.to).toBe('allenby')
    expect(centre.when).toBeUndefined()
  })

  it('never draws two doors on top of each other', () => {
    // era-tagged doors may share a footprint (only one exists at a time); the rest may not
    const always = street.exits.filter((exit) => !exit.era)
    for (const a of always) {
      for (const b of always) {
        if (a === b) continue
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
        expect(overlapX > 0 && overlapY > 0, `${a.id} overlaps ${b.id}`).toBe(false)
      }
    }
  })
})

describe('אלנבי — the junction the map turns on', () => {
  it('exists, and carries the hall and the ground', () => {
    expect(allenby).toBeDefined()
    const ids = allenby.exits.map((exit) => exit.to)
    expect(ids).toContain('ussishkin-outside')
    expect(ids).toContain('bloomfield-outside')
    expect(ids).toContain('street')
  })

  it('keeps the hall a discovery — the flag moved with the turning', () => {
    expect(JSON.stringify(exitOf(allenby, 'ussishkin')!.when)).toContain('life:knows:hall')
  })

  it('is reachable from both sides of town', () => {
    const ways = ALL_SCENES.filter((scene) => scene.exits.some((exit) => exit.to === 'allenby')).map((scene) => scene.id)
    expect(ways).toContain('street')
    expect(ways).toContain('route')
  })

  it('every door it names lands on a spawn that exists', () => {
    for (const scene of ALL_SCENES) {
      for (const exit of scene.exits) {
        const target = SCENE[exit.to]
        expect(target, `${scene.id} → ${exit.to} is not a scene`).toBeDefined()
        expect(target.spawns[exit.spawn], `${scene.id} → ${exit.to}: no spawn "${exit.spawn}"`).toBeDefined()
      }
    }
  })

  it('spawns and doors stand inside the walk band', () => {
    for (const [name, spawn] of Object.entries(allenby.spawns)) {
      expect(spawn.y, `spawn ${name} is above the band`).toBeGreaterThanOrEqual(allenby.band.far)
      expect(spawn.y, `spawn ${name} is below the band`).toBeLessThanOrEqual(allenby.band.near + 0.02)
    }
  })

  it('has the supporters’ shop, and it is the only room that does', () => {
    const rooms = ALL_SCENES.filter((scene) => scene.hotspots.some((spot) => spot.act.startsWith('fan-shop-')))
    expect(rooms.map((room) => room.id)).toEqual(['allenby'])
  })

  it('is on the map, with its own pin', () => {
    const pin = MAP_PLACES.find((place) => place.id === 'allenby')
    expect(pin).toBeDefined()
    expect(pin!.scene).toBe('allenby')
  })
})

describe('כל עבודה בחדר שלה — the audit that would have caught the kitchen', () => {
  it('every gig has its hotspot in the room the gig says it is in', () => {
    for (const gig of GIGS) {
      const room = SCENE[gig.where as keyof typeof SCENE]
      expect(room, `${gig.id} names a room that does not exist: ${gig.where}`).toBeDefined()
      const here = room.hotspots.some((spot) => spot.act.startsWith(`gig:${gig.id}:`) || spot.act.includes(gig.id))
      expect(here, `${gig.id} is offered nowhere in ${gig.where}`).toBe(true)
    }
  })

  it('and nowhere else', () => {
    for (const gig of GIGS) {
      for (const scene of ALL_SCENES) {
        if (scene.id === gig.where) continue
        const stray = scene.hotspots.some((spot) => spot.act.includes(gig.id))
        expect(stray, `${gig.id} is also offered in ${scene.id}`).toBe(false)
      }
    }
  })

  it('every conversation a room names is a conversation that exists', () => {
    for (const scene of ALL_SCENES) {
      for (const spot of scene.hotspots) {
        // namespaced acts are systems rather than conversations: `pano:` is the
        // first-person look-around, `net:` is the goal net at Bloomfield
        if (spot.act.includes(':') && !spot.act.startsWith('gig:')) continue
        expect(DIALOGUE[spot.act], `${scene.id}/${spot.id} opens "${spot.act}", which nothing wrote`).toBeDefined()
      }
      for (const actor of scene.actors) {
        if (!actor.talk || (actor.talk.includes(':') && !actor.talk.startsWith('gig:'))) continue
        expect(DIALOGUE[actor.talk], `${scene.id}/${actor.id} talks "${actor.talk}", which nothing wrote`).toBeDefined()
      }
    }
  })

  it('every backdrop a room asks for is a file on disk', async () => {
    const { existsSync } = await import('node:fs')
    for (const scene of ALL_SCENES) {
      const arts = [scene.art, ...Object.values(scene.artByEra ?? {})]
      for (const art of arts) {
        expect(existsSync(`public/life/art/${art}.png`), `${scene.id} wants ${art}.png`).toBe(true)
      }
      for (const layer of scene.layers ?? []) {
        expect(existsSync(`public/life/art/${layer.art}.png`), `${scene.id} draws ${layer.art}.png`).toBe(true)
      }
    }
  })
})
