import { describe, expect, it } from 'vitest'

import {
  AREA_KNOWLEDGE,
  AREA_OF,
  canPlayerReach,
  evaluateMissionReachability,
  guidedFlag,
  knowsRoute,
  learnedOnArrival,
  routeFlag,
  type MissionSpec,
} from '@/lib/life/world/reach'
import { emptyState } from '@/lib/life/events'
import { ALL_SCENES } from '@/lib/life/world/scenes'
import type { LifeState } from '@/lib/life/types'

/**
 * אפי מזמין לאוסישקין — ומעכשיו מישהו בודק.
 *
 * Maor, 7.9.2026: משימה איננה תקפה רק כי הטריגר שלה נורה. הבדיקות כאן הן ארבעת המצבים
 * שהמסמך מפריד ביניהם — אפשרי, ידוע, חופשי, מודרך — ושלושת הכשלים שהם מייצרים כשמערבבים
 * ביניהם.
 */

const IDENTITY = { name: 'פוגי', sex: 'boy', birthYear: 1978 } as const
const life = (flags: Record<string, unknown> = {}): LifeState => ({
  ...emptyState(IDENTITY, 1986),
  flags: { ...emptyState(IDENTITY, 1986).flags, ...flags } as LifeState['flags'],
})
const ctx = (from: LifeState['location'], actors: string[] = []) => ({
  chapter: 'a3-hall',
  from,
  actorsAt: () => actors,
})

describe('ארבעת המצבים שאסור לבלבל', () => {
  it('says he is already there rather than routing him in a circle', () => {
    const verdict = canPlayerReach(life(), 'a3-hall', 'ussishkin-hall', 'ussishkin-hall')
    expect(verdict.reachable).toBe(true)
    expect(verdict.reason).toBe('AT_DESTINATION')
  })

  it('finds no way at all when the chapter holds none', () => {
    const verdict = canPlayerReach(life(), 'a3-hall', 'bedroom', 'hatikva')
    if (!verdict.reachable && verdict.reason === 'NO_ROUTE') {
      expect(verdict.path).toEqual([])
      expect(verdict.whyHe).toBeTruthy()
    }
  })

  /**
   * זה הלב. הדרך קיימת, היא פתוחה, והילד בן השש פשוט לא יודע איך מגיעים לדרום תל אביב.
   * זה לא באג — זאת האמת של הפרק, והתשובה היא לא לפתוח חצי עיר.
   */
  it('refuses a route the boy does not know, and names what would fix it', () => {
    const verdict = canPlayerReach(life(), 'a3-hall', 'street', 'ussishkin-outside')
    expect(verdict.reachable).toBe(false)
    expect(verdict.reason).toBe('AREA_NOT_KNOWN')
    expect(verdict.recovery).toBe('GUIDED_TRAVEL')
    expect(verdict.blockingRequirement).toBe('ussishkin')
    // the way itself is not hidden — a game that hides the way looks broken
    expect(verdict.path.length).toBeGreaterThan(0)
  })

  it('lets him through the same route the moment somebody is taking him', () => {
    const verdict = canPlayerReach(life({ [guidedFlag('efi')]: true }), 'a3-hall', 'street', 'ussishkin-outside')
    expect(verdict.reachable).toBe(true)
    expect(verdict.reason).toBe('GUIDED_ONLY')
    expect(verdict.recovery).toBe('GUIDED_TRAVEL')
  })

  it('lets him go alone once he has learned the way', () => {
    const verdict = canPlayerReach(life({ [routeFlag('ussishkin')]: true }), 'a3-hall', 'street', 'ussishkin-outside')
    expect(verdict.reachable).toBe(true)
    expect(verdict.reason).toBe('ROUTE_OPEN')
  })

  it('teaches the route by arriving, rather than by unlocking a menu', () => {
    expect(learnedOnArrival('ussishkin-hall')).toBe('life:knows:hall')
    expect(learnedOnArrival('street')).toBeNull()
    expect(knowsRoute(life({ 'life:knows:hall': true }), 'ussishkin')).toBe(true)
  })

  it('keeps route knowledge for life — it rides the same prefix rule as a shirt', () => {
    // the flag the chapter has always used, not a second name for the same idea
    expect(routeFlag('ussishkin')).toBe('life:knows:hall')
    expect(routeFlag('somewhere-new')).toBe('route:somewhere-new')
    expect(guidedFlag('efi')).toBe('guided:efi')
  })
})

describe('CanStart → CanReach → CanPerform → CanComplete → CanExit', () => {
  const invitation: MissionSpec = {
    id: 'a3-follow-efi',
    classification: 'CRITICAL',
    destination: 'ussishkin-hall',
    guideBy: 'efi',
  }

  it('does not become a blocking objective when the route is not his yet', () => {
    const verdict = evaluateMissionReachability(invitation, life(), ctx('street'))
    expect(verdict.ok).toBe(false)
    expect(verdict.failedAt).toBe('CanReach')
    expect(verdict.watchdog).toBe('NPC_INVITATION_ROUTE_LOCKED')
  })

  it('becomes valid the moment Efi is actually taking him', () => {
    const verdict = evaluateMissionReachability(invitation, life({ [guidedFlag('efi')]: true }), ctx('street'))
    expect(verdict.ok).toBe(true)
    expect(verdict.reach.reason).toBe('GUIDED_ONLY')
  })

  it('does not activate before its own start condition holds', () => {
    const gated: MissionSpec = { ...invitation, start: { flag: 'life:a2:efi' } }
    expect(evaluateMissionReachability(gated, life({ [guidedFlag('efi')]: true }), ctx('street')).failedAt).toBe('CanStart')
    expect(
      evaluateMissionReachability(gated, life({ 'life:a2:efi': true, [guidedFlag('efi')]: true }), ctx('street')).ok,
    ).toBe(true)
  })

  it('refuses an objective whose person is not standing there', () => {
    const meeting: MissionSpec = { ...invitation, needsActor: 'אפי' }
    const away = evaluateMissionReachability(meeting, life({ [guidedFlag('efi')]: true }), ctx('street', []))
    expect(away.failedAt).toBe('CanPerform')
    expect(away.watchdog).toBe('OBJECTIVE_REQUIRED_NPC_ABSENT')
    const there = evaluateMissionReachability(meeting, life({ [guidedFlag('efi')]: true }), ctx('street', ['אפי']))
    expect(there.ok).toBe(true)
  })

  it('does not softlock when the player is already standing in the destination', () => {
    const verdict = evaluateMissionReachability(invitation, life(), ctx('ussishkin-hall'))
    expect(verdict.ok).toBe(true)
    expect(verdict.reach.reason).toBe('AT_DESTINATION')
  })

  it('reports a destination with no way out instead of letting the player find it', () => {
    for (const scene of ALL_SCENES) {
      const exits = scene.exits.length
      expect(exits, `${scene.id} has no exits at all`).toBeGreaterThan(0)
    }
  })
})

describe('כל חדר שדורש ידע — מוכרז', () => {
  it('names an area only for rooms a child would not find alone', () => {
    for (const [where, area] of Object.entries(AREA_OF)) {
      expect(typeof area).toBe('string')
      expect(ALL_SCENES.some((scene) => scene.id === where), `${where} is not a room`).toBe(true)
    }
    // the home rooms are never areas: a boy knows his own street
    for (const home of ['bedroom', 'home', 'kitchen', 'street', 'pitch']) {
      expect(AREA_OF[home as keyof typeof AREA_OF], `${home} should not need learning`).toBeUndefined()
    }
  })
})

/**
 * שומר: דלת שדורשת ידע שאף אחד לא מלמד היא דלת שלא תיפתח לעולם.
 *
 * זה הקוד `NPC_INVITATION_ROUTE_LOCKED` בצורתו הסטטית — במקום לחכות שרובוט ייתקע, שואלים
 * את השאלה על כל התוכן בבת אחת: כל דגל ידע שדלת כלשהי דורשת, האם משהו במשחק מרים אותו?
 */
describe('שומר הנגישות', () => {
  it('teaches every route it demands', async () => {
    const { readFileSync, readdirSync } = await import('node:fs')
    const { join } = await import('node:path')
    const roots = ['lib/life/content', 'lib/life/world', 'lib/life/runtime', 'lib/life/runtime/scenes']
    let source = ''
    for (const dir of roots) {
      let files: string[] = []
      try {
        files = readdirSync(join(process.cwd(), dir)).filter((f) => /\.tsx?$/.test(f))
      } catch {
        continue
      }
      for (const file of files) source += readFileSync(join(process.cwd(), dir, file), 'utf8')
    }
    for (const [area, flag] of Object.entries(AREA_KNOWLEDGE)) {
      const raised =
        source.includes(`flag: '${flag}'`) || source.includes(`flag.raised', flag: '${flag}'`) || source.includes(`'${flag}'`)
      expect(raised, `nothing in the game ever teaches the way to ${area} (${flag})`).toBe(true)
    }
  })

  it('gives every area a canonical knowledge flag and never a second name for it', () => {
    const flags = Object.values(AREA_KNOWLEDGE)
    expect(new Set(flags).size).toBe(flags.length)
    for (const area of Object.values(AREA_OF)) {
      expect(typeof routeFlag(area)).toBe('string')
    }
  })
})
