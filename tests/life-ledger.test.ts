import { describe, expect, it } from 'vitest'

import { ACHIEVEMENTS, waiting } from '@/lib/life/achievements'
import { CHAPTERS } from '@/lib/life/content/chapters'
import { BEATS_ARMY } from '@/lib/life/content/chapter1996army'
import { DIALOGUE } from '@/lib/life/content/dialogue'
import { eraFor } from '@/lib/life/content/era'
import { emptyState } from '@/lib/life/events'
import type { LifeState } from '@/lib/life/types'
import { ALL_SCENES, inEra } from '@/lib/life/world/scenes'

/**
 * הפנקס — and whether anything in the world actually writes in it.
 *
 * Three of the thirty achievements were waiting on evidence rather than on fiction: the
 * promise renegotiated in advance, four promises kept, two money debts settled on two
 * different dates. The scenes for all three already existed — the bread, the hour Rachel
 * named, *"מה שלא יהיה"*, the winter in uniform, the coins over your head at a bus door,
 * the half tank of petrol somebody else paid for. **Nobody was writing them down.**
 *
 * So this suite is not about whether the rows are correct; `tests/life-achievements.test.ts`
 * owns that. It asks the one question a predicate cannot ask about itself: **can a life
 * reach the evidence?** It walks the same reachable set `tests/life-reachable.test.ts`
 * walks — the conversations a chapter can actually open, from its scenes, its beats, its
 * windows — and reads the proofs out of the content, so a row that goes back to being
 * unreachable fails here rather than in a year of nobody noticing.
 *
 * Rule 66, from the other end: that file proves a THRESHOLD is not above the ceiling;
 * this one proves the EVIDENCE exists in a room somebody can walk into.
 */

const PLAYABLE = CHAPTERS.filter((chapter) => chapter.playable !== false)

type Effect = Record<string, unknown> & { e: string }

const effectsOf = (id: string): Effect[] => {
  const out: Effect[] = []
  for (const branch of DIALOGUE[id]?.branches ?? []) {
    for (const effect of branch.then ?? []) out.push(effect as never)
    for (const choice of branch.choices ?? []) for (const effect of choice.then) out.push(effect as never)
  }
  return out
}

/** every conversation id a chapter can open — scenes, beats, windows, and their `goto`s */
const conversationsIn = (chapter: string): Set<string> => {
  const roots: string[] = []
  for (const scene of ALL_SCENES) {
    for (const actor of scene.actors) if (inEra(actor, chapter) && actor.talk) roots.push(actor.talk)
    for (const spot of scene.hotspots) {
      const act = (spot as { act?: string }).act
      if (inEra(spot, chapter) && act) roots.push(act)
    }
  }
  const era = eraFor(chapter) as unknown as Record<string, unknown>
  const scan = (value: unknown, depth = 0): void => {
    if (depth > 12 || !value) return
    if (Array.isArray(value)) return void value.forEach((item) => scan(item, depth + 1))
    if (typeof value !== 'object') return
    const node = value as Record<string, unknown>
    for (const key of ['talk', 'node', 'act', 'conversation']) {
      if (typeof node[key] === 'string') roots.push(node[key] as string)
    }
    for (const child of Object.values(node)) scan(child, depth + 1)
  }
  for (const key of ['beats', 'opportunities', 'encounters', 'ambient']) scan(era[key])

  const seen = new Set<string>()
  const queue = [...roots]
  while (queue.length) {
    const id = queue.shift() as string
    if (seen.has(id) || !DIALOGUE[id]) continue
    seen.add(id)
    for (const effect of effectsOf(id)) if (effect.e === 'goto') queue.push(effect.node as string)
  }
  return seen
}

type Recorded = { chapter: string; kind: string; proofId: string; subject: string | null }

/**
 * ראיות שביט כותב — נקראות בהרצה, כי `a: 'derive'` היא פונקציה ולא נתון.
 *
 * A beat can write events from state, which is how a promise that spans a whole chapter
 * closes at its end rather than inside one branch. Reading its source would be guessing;
 * running it over an empty state of that chapter is the same thing the runtime does.
 */
const beatProofs = (chapter: { id: string; year: number }): Recorded[] => {
  const era = eraFor(chapter.id) as unknown as { beats?: readonly { do?: readonly unknown[] }[] }
  const state: LifeState = {
    ...emptyState({ birthYear: 1978, nameHe: 'פוגי' } as never, chapter.year),
    chapter: chapter.id,
  }
  const rows: Recorded[] = []
  for (const beat of era.beats ?? []) {
    for (const action of beat.do ?? []) {
      const derive = action as { a?: string; events?: (state: LifeState) => readonly Record<string, unknown>[] }
      if (derive.a !== 'derive' || typeof derive.events !== 'function') continue
      for (const event of derive.events(state)) {
        if (event.t !== 'proof.recorded') continue
        const proof = event.proof as Record<string, unknown>
        rows.push({
          chapter: chapter.id,
          kind: String(proof.kind),
          proofId: String(proof.proofId),
          subject: (proof.subjectHe as string | undefined) ?? null,
        })
      }
    }
  }
  return rows
}

/** every proof the reachable content of every chapter can record */
const LEDGER: Recorded[] = PLAYABLE.flatMap((chapter) => {
  const rows: Recorded[] = [...beatProofs(chapter)]
  for (const id of conversationsIn(chapter.id)) {
    for (const effect of effectsOf(id)) {
      if (effect.e !== 'proof') continue
      rows.push({
        chapter: chapter.id,
        kind: effect.kind as string,
        proofId: (effect.proofId as string).replace('{chapter}', chapter.id),
        subject: (effect.subjectHe as string | undefined) ?? null,
      })
    }
  }
  return rows
})

const of = (kind: string) => LEDGER.filter((row) => row.kind === kind)
const idsOf = (kind: string) => new Set(of(kind).map((row) => row.proofId))
const chaptersOf = (kind: string) => new Set(of(kind).map((row) => row.chapter))
const subjectsOf = (kind: string) => new Set(of(kind).map((row) => row.subject ?? row.proofId))

describe('הפנקס — ראיה שאפשר להגיע אליה', () => {
  it('records four different promises kept, in more than one chapter', () => {
    // ACH_RELIABLE: four distinct proof ids, two chapters. The ids are what is counted,
    // so promising the same thing four times is one promise — and the subjects say it
    // out loud: bread, an hour, a bus north, a winter.
    expect(idsOf('promise_kept').size, [...idsOf('promise_kept')].join('\n')).toBeGreaterThanOrEqual(4)
    expect(chaptersOf('promise_kept').size).toBeGreaterThanOrEqual(2)
    expect(subjectsOf('promise_kept').size).toBe(idsOf('promise_kept').size)
  })

  it('offers a promise renegotiated in advance, on a subject that can then be kept', () => {
    // ACH_NEW_PLAN crosses SUBJECT, never key: the new time has to be agreed and then met
    // on the same thing. A renegotiation nobody can keep is a branch, not a mechanism.
    const renegotiated = subjectsOf('promise_renegotiated')
    expect(renegotiated.size).toBeGreaterThan(0)
    const kept = subjectsOf('promise_kept')
    const both = [...renegotiated].filter((subject) => kept.has(subject))
    expect(both, `renegotiated: ${[...renegotiated].join(', ')} · kept: ${[...kept].join(', ')}`).not.toEqual([])
  })

  it('settles two money debts on two different dates', () => {
    // ACH_BALANCE: two settlements in two chapters. Two repayments in one evening is one
    // evening; the second chapter is what makes it a habit rather than a tidy-up.
    expect(idsOf('debt_settled').size).toBeGreaterThanOrEqual(2)
    expect(chaptersOf('debt_settled').size, [...chaptersOf('debt_settled')].join(', ')).toBeGreaterThanOrEqual(2)
  })
})

describe('חוב — נלקח בכסף, ונסגר באותו כסף', () => {
  /**
   * *"חוב שאי אפשר לפרוע הוא לא חוב, הוא עונש."*
   *
   * Every positive `debt` a chapter can declare is a favour somebody did in money. This
   * asks the only question that keeps that honest: is there a branch, anywhere later,
   * that gives back exactly that amount. Not a smaller one, and not a generic
   * "settle everything" screen — the same number, from the room it was taken in.
   */
  const debts = PLAYABLE.flatMap((chapter) =>
    [...conversationsIn(chapter.id)].flatMap((id) =>
      effectsOf(id)
        .filter((effect) => effect.e === 'debt')
        .map((effect) => ({ chapter: chapter.id, agorot: effect.agorot as number, why: effect.why as string })),
    ),
  )

  it('takes at least one debt and repays every amount it takes', () => {
    const taken = debts.filter((row) => row.agorot > 0)
    const repaid = debts.filter((row) => row.agorot < 0).map((row) => -row.agorot)
    expect(taken.length).toBeGreaterThan(0)
    for (const debt of taken) {
      expect(repaid.includes(debt.agorot), `${debt.why} (${debt.agorot}) can be taken and never repaid`).toBe(true)
    }
  })

  it('never lets the ledger say a debt was settled without money moving', () => {
    for (const chapter of PLAYABLE) {
      for (const id of conversationsIn(chapter.id)) {
        for (const branch of DIALOGUE[id]?.branches ?? []) {
          const groups = [branch.then ?? [], ...(branch.choices ?? []).map((choice) => choice.then)]
          for (const group of groups) {
            const settles = group.some(
              (effect) => (effect as Effect).e === 'proof' && (effect as Effect).kind === 'debt_settled',
            )
            if (!settles) continue
            const money = group.filter((effect) => (effect as Effect).e === 'money') as Effect[]
            const debt = group.filter((effect) => (effect as Effect).e === 'debt') as Effect[]
            expect(money.some((effect) => (effect.agorot as number) < 0), `${id} settles without paying`).toBe(true)
            expect(debt.some((effect) => (effect.agorot as number) < 0), `${id} settles without clearing debt`).toBe(true)
          }
        }
      }
    }
  })
})

describe('ההבטחה של החורף — beat, ולא ענף', () => {
  /**
   * *"לא אעשה שטויות"* is made on one evening and tested across a whole winter, so it
   * cannot close inside a branch. The beat closes it, and only when the two things it was
   * about did not happen. This checks the beat by RUNNING its derive over a state, which
   * is the only way to see what a function-shaped action actually writes.
   */
  const beat = BEATS_ARMY.find((row) => row.id === 'a5-promise-kept')

  it('exists, and is fenced by the two things the promise was about', () => {
    expect(beat, 'the winter promise never closes').toBeTruthy()
    const none = JSON.stringify(beat?.when ?? {})
    expect(none).toContain('life:awol')
    expect(none).toContain('life:lied:army')
  })

  it('writes a promise kept, with its own subject', () => {
    const chapter = PLAYABLE.find((row) => row.id === '1996-army')
    const state: LifeState = {
      ...emptyState({ birthYear: 1978, nameHe: 'פוגי' } as never, chapter?.year ?? 1996),
      chapter: '1996-army',
    }
    const derive = (beat?.do ?? []).find((action) => (action as { a: string }).a === 'derive') as
      | { events: (state: LifeState) => readonly { t: string; proof?: Record<string, unknown> }[] }
      | undefined
    const events = derive?.events(state) ?? []
    const proof = events.find((event) => event.t === 'proof.recorded')?.proof
    expect(proof?.kind).toBe('promise_kept')
    expect(String(proof?.proofId)).toContain('1996-army')
    expect(String(proof?.subjectHe ?? '').length).toBeGreaterThan(0)
  })
})

describe('מה שעוד ממתין — והשורה שאומרת למה', () => {
  it('has taken the three the ledger just opened off the waiting list', () => {
    const waitingIds = new Set(waiting().map((row) => row.id))
    for (const id of ['ACH_NEW_PLAN', 'ACH_RELIABLE', 'ACH_BALANCE']) {
      expect(waitingIds.has(id), `${id} is still reported as waiting`).toBe(false)
    }
  })

  it('still names a reason for every row that is still waiting', () => {
    for (const row of ACHIEVEMENTS) {
      if (row.waitingHe === null) continue
      expect(row.waitingHe.trim().length, row.id).toBeGreaterThan(20)
    }
  })
})
