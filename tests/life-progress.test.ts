import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { chapterFor, lastPlayable, nextPlayable, playableChapters } from '@/lib/life/content/chapters'
import { GIGS, gigChapters, gigConversations, gigPay, gigsIn } from '@/lib/life/gigs'
import { SHIRT, TICKET, WAGE, decadeOf, decadeOfYear } from '@/lib/life/prices'
import { SHIRTS } from '@/lib/life/shirts'
import { DIALOGUE } from '@/lib/life/content/dialogue'

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

  it('walks from the first chapter to the last without a gap', () => {
    const chapters = playableChapters()
    let at = chapters[0]!
    const walked = [at.id]
    for (let i = 0; i < 60 && nextPlayable(at.id); i += 1) {
      at = nextPlayable(at.id)!
      walked.push(at.id)
    }
    expect(walked.length).toBe(chapters.length)
    expect(at.id).toBe(lastPlayable().id)
    expect(new Set(walked).size).toBe(walked.length)
  })

  it('every playable chapter but the last has a playable chapter after it', () => {
    for (const chapter of playableChapters()) {
      if (chapter.id === lastPlayable().id) continue
      expect(nextPlayable(chapter.id), `${chapter.id} leads nowhere`).not.toBeNull()
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

  it('prices every shirt off the decade it first hangs in', () => {
    for (const shirt of SHIRTS) {
      expect(shirt.price, shirt.id).toBe(SHIRT[decadeOf(shirt.from)])
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
  it('pays the decade wage for the hours worked', () => {
    for (const gig of GIGS) {
      for (const chapter of gigChapters(gig)) {
        const pay = gigPay(gig, chapter)
        expect(pay, `${gig.id} in ${chapter}`).toBeGreaterThan(0)
        if (gig.id !== 'bottles-round') {
          expect(pay).toBe(Math.max(1, Math.round(WAGE[decadeOf(chapter)] * gig.hours)))
        }
      }
    }
  })

  it('gives a1985 boy enough afternoons to buy the thirty-shekel shirt', () => {
    const rooms = ['street', 'kiosk', 'ussishkin-hall', 'ussishkin-outside', 'bloomfield-outside']
    const day = rooms.flatMap((room) => gigsIn('a4-shirt', room)).reduce((sum, gig) => sum + gigPay(gig, 'a4-shirt'), 0)
    expect(day).toBeGreaterThan(0)
    // the tin (12) plus a pocket (2) plus a day of work has to clear thirty
    expect(14 + day).toBeGreaterThanOrEqual(SHIRT['80s'])
  })

  it('generates one conversation per gig per chapter, and every one starts the minigame', () => {
    const conversations = gigConversations()
    expect(conversations.length).toBe(GIGS.reduce((n, gig) => n + gigChapters(gig).length, 0))
    for (const conversation of conversations) {
      const json = JSON.stringify(conversation)
      expect(json, conversation.id).toContain('"e":"minigame"')
      expect(json, conversation.id).toContain('"id":"chore:')
    }
  })

  it('is reachable — every gig conversation is registered', () => {
    for (const conversation of gigConversations()) {
      expect(DIALOGUE[conversation.id], conversation.id).toBeTruthy()
    }
  })
})
