import { describe, expect, it } from 'vitest'

import { DEFAULT_IDENTITY } from '@/lib/life/content/chapter1986'
import { CONVERSATIONS_A1 } from '@/lib/life/content/chapterStageA'
import { fold } from '@/lib/life/events'
import type { LifeEvent } from '@/lib/life/events'
import {
  keptStub,
  reversalComplete,
  STUB_1983,
  TICKETS_1983,
  ticketsIn1983,
  ticketsIn2026,
} from '@/lib/life/tickets'

/**
 * הכרטיסים — 1983 → 2026.
 *
 * The canon's two ends are one act in opposite directions: in 1983 somebody got the
 * tickets and carried the child in; around 2026 the child gets the tickets and carries
 * him. This suite protects the FIRST end, because the second one does not exist yet and
 * a test that pretends otherwise would be the most expensive kind of green.
 *
 * What it actually proves is the thing that is easy to get wrong and impossible to see:
 * that a fact written at five is still readable after the year changes. `personFlags()`
 * empties the save at every chapter cut except for a named handful of prefixes, and a
 * fact spelled without one of them is gone before anything can ever pay it off.
 */
describe('הכרטיסים — 1983', () => {
  const stubTaking = ['take-stub', 'ask-stub'] as const

  it('נכתב בפרולוג כערך, לא כדגל בוליאני', () => {
    // A boolean cannot answer the question 2026 asks, which is WHO held them.
    const node = CONVERSATIONS_A1.find((c) => c.id === 'a1-stub')
    expect(node, 'a1-stub missing from the prologue').toBeDefined()

    const branch = node?.branches[0]
    const written = branch?.then?.find(
      (e) => e.e === 'flagValue' && e.flag === TICKETS_1983,
    )
    expect(written, `${TICKETS_1983} is not written by a1-stub`).toBeDefined()
    expect(written && 'value' in written && written.value).toBe('kobi')
  })

  it('נכתב ללא תנאי — ילד בן חמש לא מרוויח את הכרטיסים ולא יכול לטעות בהם', () => {
    const branch = CONVERSATIONS_A1.find((c) => c.id === 'a1-stub')?.branches[0]
    // It sits on the branch's own `then`, which runs before any choice is offered —
    // not inside one of the choices, where a player could miss it.
    expect(branch?.when, 'the ticket fact must not be behind a condition').toBeUndefined()
    expect(branch?.then?.some((e) => e.e === 'flagValue' && e.flag === TICKETS_1983)).toBe(true)
  })

  it('כל דרך מהצומת מגיעה הביתה — אין בחירה שמאבדת את הפרולוג', () => {
    const choices = CONVERSATIONS_A1.find((c) => c.id === 'a1-stub')?.branches[0]?.choices ?? []
    expect(choices.length).toBeGreaterThanOrEqual(2)
    for (const choice of choices) {
      const goes = choice.then.some((e) => e.e === 'goto' && e.node === 'a1-home')
      expect(goes, `choice ${choice.id} does not reach a1-home`).toBe(true)
    }
  })

  it('רק חלק מהבחירות משאירות ספח, ומי שמשאיר מסמן own:', () => {
    const choices = CONVERSATIONS_A1.find((c) => c.id === 'a1-stub')?.branches[0]?.choices ?? []
    for (const choice of choices) {
      const gives = choice.then.some((e) => e.e === 'give' && e.item === 'ticket-stub')
      const marks = choice.then.some((e) => e.e === 'flag' && e.flag === STUB_1983)
      expect(gives, `${choice.id}: item and flag must agree`).toBe(marks)
      if (stubTaking.includes(choice.id as (typeof stubTaking)[number])) expect(gives).toBe(true)
    }
  })
})

describe('הכרטיסים — מה ששורד ארבעים ושלוש שנה', () => {
  /** The prologue's own write, as the engine would record it. */
  const planted: LifeEvent[] = [
    // Exactly what the engine writes: `flagValue` emits `flag.set` (dialogue.ts:662),
    // and `flag.raised` would silently coerce the holder to `true` — which is precisely
    // the bug this suite exists to make impossible.
    { t: 'flag.set', flag: TICKETS_1983, value: 'kobi' } as LifeEvent,
    { t: 'flag.raised', flag: STUB_1983 } as LifeEvent,
  ]

  function after(years: readonly number[]): ReturnType<typeof fold> {
    const events: LifeEvent[] = [...planted]
    for (const year of years) {
      events.push({ t: 'year.entered', year, weekday: 6, minute: 0 } as LifeEvent)
    }
    return fold(DEFAULT_IDENTITY, 1983, events)
  }

  it('נקרא מיד אחרי הפרולוג', () => {
    const state = after([])
    expect(ticketsIn1983(state)).toBe('kobi')
    expect(keptStub(state)).toBe(true)
  })

  it('שורד מעבר שנה אחד — זה מה ש-own: קונה', () => {
    const state = after([1986])
    expect(ticketsIn1983(state)).toBe('kobi')
    expect(keptStub(state)).toBe(true)
  })

  it('שורד את כל הדרך ל-2026', () => {
    // Every chapter cut the game currently knows about, and then some.
    const state = after([1984, 1985, 1986, 1990, 1991, 1993, 1994, 1996, 1997, 1998, 1999, 2000, 2026])
    expect(ticketsIn1983(state), 'the fact the ending is built on did not survive').toBe('kobi')
    expect(keptStub(state)).toBe(true)
  })

  it('2026 עדיין לא כתוב, והבדיקה לא מעמידה פנים שכן', () => {
    // `chapters.ts` ends on 2000-double with `next: null`. The contract is declared in
    // lib/life/tickets.ts so whoever writes the closing chapter inherits it; until then
    // the honest answer to "who holds them at the end" is nobody.
    const state = after([2026])
    expect(ticketsIn2026(state)).toBeNull()
    expect(reversalComplete(state)).toBe(false)
  })

  it('שמירה ישנה לא מנחשת — היעדר ראיה אינו ראיה להיעדר', () => {
    // A save written before this beat shipped says nothing about 1983. It must answer
    // null rather than assume kobi: rule 11 applies to our own saves too.
    const state = fold(DEFAULT_IDENTITY, 1983, [])
    expect(ticketsIn1983(state)).toBeNull()
    expect(keptStub(state)).toBe(false)
    expect(reversalComplete(state)).toBe(false)
  })
})
