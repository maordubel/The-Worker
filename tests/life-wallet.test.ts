import { describe, expect, it } from 'vitest'

import { apply, emptyState } from '@/lib/life/events'
import type { LifeState, PlayerIdentity } from '@/lib/life/types'
import { CHAPTERS } from '@/lib/life/content/chapters'
import { DIALOGUE } from '@/lib/life/content/dialogue'
import { eraFor } from '@/lib/life/content/era'
import { SHIRT_PRICE } from '@/lib/life/content/chapterStageA'
import { ALL_SCENES, inEra } from '@/lib/life/world/scenes'

/**
 * הארנק ממשיך איתו — Maor, 16.9.2026:
 *
 *   "כל הקטע בארנק זה שהכסף צריך להישמר ולהמשיך עם הדמות. והוא מחליט מתי ואיפה ועל מה
 *    להוציא. הארנק לא מתאפס בסיום משימה אלא ממשיך איתך."
 *
 * Before that sentence both `day.entered` and `year.entered` wrote `agorot: 0`, one word
 * away from a comment claiming the transition "keeps the till" — which was true of
 * `savings`, the tin under the bed, and false of the pocket beside it in the same object.
 *
 * This is a DESIGN decision, so it is tested as one. A guard on a design decision does not
 * stop the design changing; it stops it changing by accident, in a refactor, at three in
 * the morning, in a file whose comment already says the opposite of what its code does.
 */
const PLAYABLE = CHAPTERS.filter((chapter) => chapter.playable !== false)
/** rule 45: a life suite never types a year — it reads the one `CHAPTERS` declares */
const YEAR = (id: string): number => CHAPTERS.find((chapter) => chapter.id === id)?.year ?? 0
const IDENTITY = { birthYear: (PLAYABLE[0]?.year ?? 0) - 6, nameHe: 'פוגי' } as unknown as PlayerIdentity

const withMoney = (agorot: number): LifeState => ({
  ...emptyState(IDENTITY, PLAYABLE[0]?.year ?? 0),
  agorot,
  savings: 1200,
  inventory: { bottle: 3 },
})

describe('הארנק', () => {
  it('שורד יום חדש', () => {
    const after = apply(withMoney(1850), {
      t: 'day.entered',
      dayId: 'a4-shirt',
      year: YEAR('a4-shirt'),
      weekday: 4,
      minute: 900,
    })
    expect(after.agorot).toBe(1850)
  })

  it('שורד מעבר שנים', () => {
    const after = apply(withMoney(2400), { t: 'year.entered', year: YEAR('1990'), weekday: 6, minute: 800 })
    expect(after.agorot).toBe(2400)
  })

  it('והפחית לא נוגעים בה בשני המקרים', () => {
    for (const event of [
      { t: 'day.entered', dayId: 'a5-first', year: YEAR('a5-first'), weekday: 6, minute: 780 } as const,
      { t: 'year.entered', year: YEAR('1996-army'), weekday: 6, minute: 780 } as const,
    ]) {
      expect(apply(withMoney(500), event).savings).toBe(1200)
    }
  })

  /**
   * ומה שכן מתאפס, ובכוונה. Bottles for deposit and a loaf of bread are an afternoon's
   * props, not possessions. What he OWNS survives by its own route — `own:` flags and
   * `clothing` — which is why a shirt bought in 1985 is still in the wardrobe in 2000.
   */
  it('החפצים של אחר הצהריים כן מתאפסים, והבגדים לא', () => {
    const before = { ...withMoney(700), clothing: ['shirt:1985'], flags: { 'own:shirt85': true } }
    const after = apply(before, { t: 'year.entered', year: YEAR('1991'), weekday: 1, minute: 480 })
    expect(after.inventory).toEqual({})
    expect(after.clothing).toContain('shirt:1985')
    expect(after.flags['own:shirt85']).toBe(true)
  })

  /**
   * ולמה זה לא ניואנס: **החולצה הייתה בלתי-אפשרית מתמטית.**
   *
   * `a4-shirt` is named after a thirty-shekel shirt and its whole afternoon — the tin,
   * the pocket money, the bottles, the boxes at Rafi's — yields twenty-seven. With the
   * pocket emptied at every `day.entered` that was the entire budget, so `own:shirt85`
   * could not be raised by anybody, ever; and with it went the A6 echo that reads that
   * flag, the `tveria85` shirt in the wardrobe, and the chapter's own `shirt` ending.
   *
   * Carrying the wallet is what closes the three-shekel gap, which is why this number is
   * asserted rather than remembered: the day somebody re-balances the chapter and the
   * afternoon covers thirty on its own, this test says so and can be deleted on purpose
   * instead of passing for a reason nobody checked.
   */
  it('הפרק לבדו לא מגיע למחיר החולצה — ולכן ההעברה היא מה שמאפשרת אותה', () => {
    const effectsOf = (id: string) => {
      const out: Array<Record<string, unknown> & { e: string }> = []
      for (const branch of DIALOGUE[id]?.branches ?? []) {
        for (const effect of branch.then ?? []) out.push(effect as never)
        for (const choice of branch.choices ?? []) for (const effect of choice.then) out.push(effect as never)
      }
      return out
    }
    const roots: string[] = []
    for (const scene of ALL_SCENES) {
      for (const actor of scene.actors) if (inEra(actor, 'a4-shirt') && actor.talk) roots.push(actor.talk)
      for (const spot of scene.hotspots) {
        const act = (spot as { act?: string }).act
        if (inEra(spot, 'a4-shirt') && act) roots.push(act)
      }
    }
    const era = eraFor('a4-shirt') as { beats?: readonly unknown[] }
    const seen = new Set<string>()
    while (roots.length) {
      const id = roots.shift() as string
      if (seen.has(id) || !DIALOGUE[id]) continue
      seen.add(id)
      for (const effect of effectsOf(id)) if (effect.e === 'goto') roots.push(effect.node as string)
    }
    let pocket = 0
    for (const id of seen) {
      for (const effect of effectsOf(id)) {
        const agorot = effect.agorot as number
        if ((effect.e === 'money' || effect.e === 'withdraw') && agorot > 0) pocket += agorot
      }
    }
    for (const beat of era.beats ?? []) {
      const actions = (beat as { do?: unknown }).do
      for (const action of Array.isArray(actions) ? actions : []) {
        const a = action as { a?: string; events?: readonly { t?: string; agorot?: number }[] }
        if (a.a !== 'events') continue
        for (const event of a.events ?? []) {
          if ((event.t === 'money.gained' || event.t === 'money.changed') && (event.agorot ?? 0) > 0) {
            pocket += event.agorot as number
          }
        }
      }
    }
    expect(pocket).toBeLessThan(SHIRT_PRICE)
  })
})
