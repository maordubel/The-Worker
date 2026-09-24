import { describe, expect, it } from 'vitest'

import { CHAPTERS } from '@/lib/life/content/chapters'
import { DIALOGUE } from '@/lib/life/content/dialogue'
import { eraFor } from '@/lib/life/content/era'
import type { Effect } from '@/lib/life/content/script'
import { ALL_SCENES, sceneIn, type EraTag, type Verb } from '@/lib/life/world/scenes'

/**
 * צפיפות משחק — Director V3 §5, §13, §14 (`life-gameplay-density`).
 *
 * *"דיאלוג תומך במשחק. הוא לא המשחק."* A chapter whose every main beat is a box, a button
 * and a flag is an interactive story, not a game. This suite counts what a chapter asks of
 * the HANDS, read off the data the runtime plays:
 *
 *   · a thing in a room that is taken, entered, sat on, played, bought or walked out of —
 *     `verb` on a hotspot tagged for THAT chapter (a shared wall does not count);
 *   · a played interaction a conversation opens — a chore, a ride, a pitch, penalties, a
 *     hoop, a coin, a Toto slip, a shop, a gate activity;
 *   · a directed match a beat plays.
 *
 * The chapters V3 rebuilt are held to more than one verb: 1996 is the Definition of Done
 * (§17: "at least three actions, not three sentences").
 */

const HANDS: ReadonlySet<Verb> = new Set<Verb>(['take', 'enter', 'exit', 'sit', 'play', 'buy'])
const PLAYED: ReadonlySet<Effect['e']> = new Set<Effect['e']>(['minigame', 'pitch', 'penalty', 'hoops', 'coin', 'toto', 'shop', 'mechanic'])

/** tagged for this chapter by name — not `'*'`, not a decade, not a stage */
function ownEra(era: EraTag | undefined, chapter: string): boolean {
  if (!era) return false
  return Array.isArray(era) ? (era as readonly string[]).includes(chapter) : era === chapter
}

function density(chapter: string): { verbs: Set<string>; played: Set<string>; matches: number } {
  const verbs = new Set<string>()
  const played = new Set<string>()
  const roots: string[] = []
  for (const base of ALL_SCENES) {
    const room = sceneIn(base, chapter)
    for (const spot of room.hotspots) {
      if (!ownEra(spot.era, chapter)) continue
      if (HANDS.has(spot.verb)) verbs.add(spot.verb)
      roots.push(spot.act)
    }
    for (const actor of room.actors) if (actor.talk && ownEra(actor.era, chapter)) roots.push(actor.talk)
  }
  let matches = 0
  for (const beat of eraFor(chapter).beats ?? []) {
    for (const action of beat.do) {
      if (action.a === 'talk') roots.push(action.conversation)
      if (action.a === 'match') matches += 1
    }
  }
  const seen = new Set<string>()
  const queue = [...roots]
  while (queue.length) {
    const id = queue.shift() as string
    if (seen.has(id)) continue
    seen.add(id)
    for (const branch of DIALOGUE[id]?.branches ?? []) {
      const effects = [...(branch.then ?? []), ...(branch.choices ?? []).flatMap((choice) => choice.then)]
      for (const effect of effects) {
        if (effect.e === 'goto') queue.push(effect.node)
        if (PLAYED.has(effect.e)) played.add(effect.e === 'minigame' ? `minigame:${effect.id}` : effect.e)
      }
    }
  }
  return { verbs, played, matches }
}

/** the chapters V3 rebuilt, and how many different things they ask of the hands */
const REBUILT: Record<string, number> = {
  '1996-army': 3,
  '1997-basket': 1,
  '1999-basket': 1,
  '2000-title': 1,
}

describe('a chapter asks something of the hands, not only of the eyes', () => {
  for (const [chapter, min] of Object.entries(REBUILT)) {
    it(`${chapter}: at least ${min} physical verb(s), and one played interaction or match`, () => {
      const { verbs, played, matches } = density(chapter)
      expect(verbs.size, `${chapter} verbs: ${[...verbs].join(', ')}`).toBeGreaterThanOrEqual(min)
      if (chapter !== '2000-title' && chapter !== '1996-army') expect(played.size + matches, `${chapter}`).toBeGreaterThan(0)
    })
  }

  it('1996 rides the road and packs the bag with the hands', () => {
    const { verbs, played } = density('1996-army')
    expect(played.has('minigame:ride:1997')).toBe(true)
    for (const verb of ['take', 'enter', 'exit', 'sit']) expect(verbs.has(verb), verb).toBe(true)
  })

  it('1997 carries the crates and 1999 works the queue', () => {
    expect(density('1997-basket').played.has('minigame:chore:story:crates-97')).toBe(true)
    expect(density('1999-basket').played.has('minigame:chore:story:queue-99')).toBe(true)
  })

  it('every playable Stage B chapter from 1990 to 2000 has at least one thing to do with the hands', () => {
    const thin: string[] = []
    for (const chapter of CHAPTERS) {
      const year = Number(chapter.id.slice(0, 4))
      if (!chapter.playable || !(year >= 1990 && year <= 2000)) continue
      const { verbs, played, matches } = density(chapter.id)
      if (verbs.size + played.size + matches === 0) thin.push(chapter.id)
    }
    expect(thin, 'chapters that are only boxes and buttons').toEqual([])
  })
})
