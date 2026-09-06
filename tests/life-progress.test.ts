import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CHAPTERS, chapterFor, lastPlayable, nextPlayable, playableChapters } from '@/lib/life/content/chapters'
import { GIGS, gigChapters, gigConversations, gigPay, gigsIn, isPaid, offeredIn } from '@/lib/life/gigs'
import { SHIRT, TICKET, WAGE, decadeOf, decadeOfYear } from '@/lib/life/prices'
import { SHIRTS } from '@/lib/life/shirts'
import { DIALOGUE } from '@/lib/life/content/dialogue'
import { SCENE } from '@/lib/life/world/scenes'

const ROOT = process.cwd()

/**
 * שאין תקיעה — Maor, 5.9.2026: "אחרי סיום משימת עליית ליגה לא עובר למשימה הבא. בבקשה
 * לבדוק על כל המשימות שאין שום תקיעה שוב."
 *
 * The fault was one clause: `dismissFinale` advanced every chapter EXCEPT 1990, because
 * 1990 was the last chapter that existed the day the line was written. A person met it as
 * a promotion that ends in a bedroom, forever. These tests are the audit he asked for, in
 * the only form that keeps: the chain has to be walkable end to end, and the code that
 * walks it must not name a chapter.
 */
describe('הרצף — every chapter leads somewhere', () => {
  const source = readFileSync('lib/life/runtime/scenes/WorldScene.ts', 'utf8')

  /**
   * שני מסלולים, ושניהם שלמים.
   *
   * Since 6.9.2026 a chapter can be conditional on the life: `a3-hall` — the Ussishkin
   * branch — happens only for a boy who stood with Efi in the spring of 1984, which is what
   * Stage A §7 asks for and what makes the discovery worth anything. So there is no single
   * chain any more; there are two, and both have to arrive.
   *
   * The test walks each. The full life reaches every chapter that exists; the life that
   * never answered Efi reaches every chapter but that one, in the same order, ending in the
   * same place. Neither may stall, and neither may repeat.
   */
  const walk = (flags: Record<string, boolean>) => {
    const chapters = playableChapters()
    let at = chapters[0]!
    const walked = [at.id]
    for (let i = 0; i < 60 && nextPlayable(at.id, flags); i += 1) {
      at = nextPlayable(at.id, flags)!
      walked.push(at.id)
    }
    return walked
  }

  it('walks from the first chapter to the last without a gap — the full life', () => {
    const walked = walk({ 'life:a2:efi': true })
    expect(walked.length).toBe(playableChapters().length)
    expect(walked[walked.length - 1]).toBe(lastPlayable().id)
    expect(new Set(walked).size).toBe(walked.length)
  })

  it('walks to the same end for a life that never answered Efi, one chapter shorter', () => {
    const walked = walk({})
    expect(walked).not.toContain('a3-hall')
    expect(walked.length).toBe(playableChapters().length - 1)
    expect(walked[walked.length - 1]).toBe(lastPlayable().id)
    expect(new Set(walked).size).toBe(walked.length)
  })

  it('every playable chapter but the last has a playable chapter after it', () => {
    for (const chapter of playableChapters()) {
      if (chapter.id === lastPlayable().id) continue
      expect(nextPlayable(chapter.id, { 'life:a2:efi': true }), `${chapter.id} leads nowhere`).not.toBeNull()
    }
  })

  it('the end-of-chapter card does not exclude a chapter from advancing', () => {
    // The exact shape of the bug, so it cannot come back as a different chapter id.
    expect(source).not.toMatch(/chapterFor\(this\.chapter\) && this\.chapter !== '/)
    expect(source).toContain('if (chapterFor(this.chapter)) {')
  })

  it('1990 — the promotion — advances to 1991', () => {
    expect(nextPlayable('1990')?.id).toBe('1991')
    expect(chapterFor('1991')?.playable).toBe(true)
  })
})

describe('המחירים — one table, every decade', () => {
  it('is the table Maor gave', () => {
    expect(TICKET).toEqual({ '80s': 15, '90s': 30, '00s': 60, '10s': 90 })
    expect(SHIRT).toEqual({ '80s': 30, '90s': 60, '00s': 110, '10s': 160 })
    expect(WAGE).toEqual({ '80s': 5, '90s': 10, '00s': 18, '10s': 26 })
  })

  it('reads a decade off a chapter and off a year', () => {
    expect(decadeOf('a4-shirt')).toBe('80s')
    expect(decadeOf('1986')).toBe('80s')
    expect(decadeOf('1990')).toBe('90s')
    expect(decadeOf('1999-cup')).toBe('90s')
    expect(decadeOf('2000-double')).toBe('00s')
    expect(decadeOfYear(2014)).toBe('10s')
  })

  it('prices every shirt off its own decade', () => {
    for (const shirt of SHIRTS) {
      // A shirt out of the club's archive is priced by the SEASON it was worn, not by the
      // chapter it first appears in: the 1988/89 kit cost 1980s money even though a boy
      // who missed it does not see it on a rail until 1990. A photographed shirt has no
      // season, so it takes the decade of the chapter it hangs in.
      const want = shirt.seasonLabel
        ? SHIRT[decadeOfYear(Number(shirt.seasonLabel.slice(0, 4)))]
        : SHIRT[decadeOf(shirt.from)]
      expect(shirt.price, shirt.id).toBe(want)
    }
    expect(SHIRTS.find((s) => s.id === 'visa86')?.price).toBe(30)
    expect(SHIRTS.find((s) => s.id === 'crt')?.price).toBe(110)
  })

  it('no ticket in a conversation is priced off the table', () => {
    // Every purchase whose reason is a ticket costs the decade's ticket, in agorot.
    const cases: Array<[string, string, number]> = [
      ['ticket-window', '1986', 1500],
      ['ticket-window-1990', '1990', 3000],
    ]
    for (const [id, chapter, agorot] of cases) {
      const conversation = DIALOGUE[id]
      expect(conversation, id).toBeTruthy()
      const spends = JSON.stringify(conversation).match(/"agorot":-(\d+)/g) ?? []
      expect(spends, `${id} in ${chapter}`).toContain(`"agorot":-${agorot}`)
    }
  })
})

describe('הג׳ובים — a boy with no money has somewhere to earn it', () => {
  it('pays the decade wage for the hours worked — and nothing at all for the two contests', () => {
    for (const gig of GIGS) {
      for (const chapter of gigChapters(gig)) {
        const pay = gigPay(gig, chapter)
        if (!isPaid(gig)) {
          // penalties and free throws are play, not work (Maor, 6.9.2026)
          expect(pay, `${gig.id} in ${chapter} is a contest and must not pay`).toBe(0)
          continue
        }
        expect(pay, `${gig.id} in ${chapter}`).toBeGreaterThan(0)
        if (gig.id !== 'bottles-round') {
          expect(pay).toBe(Math.max(1, Math.round(WAGE[decadeOf(chapter)] * gig.hours)))
        }
      }
    }
  })

  /**
   * הרוטציה — a chapter offers SOME of its work, never all of it, and never none of it.
   *
   * Maor, 6.9.2026: *"וכל פעם הצעות רנדומליות, לא תמיד כל האופציות קיימות… ליצור שוני ביום
   * יום של פוגי."* The two failure modes are equally bad and this pins both: a chapter that
   * offers everything is a menu, and a chapter that offers nothing is a boy who cannot earn
   * the shirt. Different seeds must also actually differ, or the rotation is decoration.
   */
  it('rotates the work: some of it, never all of it, never none of it', () => {
    const chapters = [...new Set(GIGS.flatMap((gig) => gigChapters(gig)))]
    for (const chapter of chapters) {
      const eligible = GIGS.filter((gig) => isPaid(gig) && gigChapters(gig).includes(chapter))
      if (eligible.length === 0) continue
      const offered = offeredIn(chapter, 'seed-one')
      expect(offered.size, `${chapter} offers nothing`).toBeGreaterThan(0)
      if (eligible.length > 2) {
        expect(offered.size, `${chapter} offers everything`).toBeLessThan(eligible.length)
      }
      for (const id of offered) {
        expect(eligible.some((gig) => gig.id === id), `${chapter} offers ${id}, which is not in it`).toBe(true)
      }
    }
    // the same save always sees the same week; a different save does not
    const a = [...offeredIn('1990', 'seed-one')].sort().join(',')
    const again = [...offeredIn('1990', 'seed-one')].sort().join(',')
    expect(again, 'the rotation is not stable within a save').toBe(a)
    const seeds = ['s1', 's2', 's3', 's4', 's5', 's6'].map((seed) => [...offeredIn('1990', seed)].sort().join(','))
    expect(new Set(seeds).size, 'every save gets the same week').toBeGreaterThan(1)
  })

  it('gives a1985 boy enough afternoons to buy the thirty-shekel shirt', () => {
    const rooms = ['street', 'kiosk', 'ussishkin-hall', 'ussishkin-outside', 'bloomfield-outside']
    const day = rooms.flatMap((room) => gigsIn('a4-shirt', room)).reduce((sum, gig) => sum + gigPay(gig, 'a4-shirt'), 0)
    expect(day).toBeGreaterThan(0)
    // the tin (12) plus a pocket (2) plus a day of work has to clear thirty
    expect(14 + day).toBeGreaterThanOrEqual(SHIRT['80s'])
  })

  it('generates one conversation per gig per chapter, and every one opens something playable', () => {
    const conversations = gigConversations()
    expect(conversations.length).toBe(GIGS.reduce((n, gig) => n + gigChapters(gig).length, 0))
    for (const conversation of conversations) {
      const gig = GIGS.find((row) => conversation.id.startsWith(`gig-${row.id}-`))
      const json = JSON.stringify(conversation)
      if (gig?.opens === 'toto') expect(json, conversation.id).toContain('"e":"toto"')
      else if (gig?.opens === 'coin') expect(json, conversation.id).toContain('"e":"coin"')
      else if (gig?.opens === 'penalty') expect(json, conversation.id).toContain('"e":"penalty"')
      else if (gig?.opens === 'hoops') expect(json, conversation.id).toContain('"e":"hoops"')
      else {
        expect(json, conversation.id).toContain('"e":"minigame"')
        expect(json, conversation.id).toContain('"id":"chore:')
      }
    }
  })

  it('the two money cards are Maor\'s numbers', () => {
    // 5.9.2026: a Toto slip is five questions at two shekels; the coin is one in, five out.
    const toto = gigConversations().find((row) => row.id.startsWith('gig-toto-slip-'))
    const coin = gigConversations().find((row) => row.id.startsWith('gig-alley-coin-'))
    expect(JSON.stringify(toto)).toContain('"e":"toto"')
    expect(JSON.stringify(coin)).toContain('"e":"coin"')
    expect(GIGS.find((row) => row.id === 'alley-coin')?.where).toBe('pitch')
    expect(GIGS.find((row) => row.id === 'toto-slip')?.where).toBe('kiosk')
  })

  it('is reachable — every gig conversation is registered', () => {
    for (const conversation of gigConversations()) {
      expect(DIALOGUE[conversation.id], conversation.id).toBeTruthy()
    }
  })
})

/**
 * השעון חייב לזוז — the class of bug behind two of Maor's reports in one day.
 *
 * 11.3.1991 froze at ten past eight because the clock was gated on `onboard:street`, a
 * 1986 tutorial flag raised only by walking into the street — a room that chapter never
 * visits. Every scheduled person in the day was then waiting for an hour that could not
 * arrive, which is what "אמא בכלל לא מגיעה… השלב הזה לא זורם" looks like from the inside.
 */
describe('הזמן עובר בכל פרק — a day that cannot reach its own evening is not a day', () => {
  const world = readFileSync(join(ROOT, 'lib/life/runtime/scenes/WorldScene.ts'), 'utf8')

  it('never gates the clock on the street flag alone', () => {
    // the guard belongs in one place, and it has to know which chapter it is in
    expect(world, 'the clock is gated on a raw flag read again').not.toMatch(
      /private tickClock\(delta: number\) \{\s*if \(!this\.ctx\.engine\.state\.flags\['onboard:street'\]\)/,
    )
    expect(world, 'the clock guard is not chapter-aware').toContain('private clockWaiting()')
    expect(world, 'the guard does not consult the chapter it is in').toMatch(
      /clockWaiting\(\)[\s\S]{0,400}chapterFor\(this\.chapter\)\?\.start\.location/,
    )
  })

  it('starts every playable chapter in a room it can leave', () => {
    for (const chapter of CHAPTERS.filter((row) => row.playable)) {
      const scene = SCENE[chapter.start.location]
      expect(scene, `${chapter.id} starts in ${chapter.start.location}, which is not a room`).toBeTruthy()
      const ways = (scene?.exits ?? []).filter((exit) => !exit.era || exit.era === '*' || exit.era === chapter.id)
      expect(ways.length, `${chapter.id} starts in a room with no way out`).toBeGreaterThan(0)
    }
  })
})
