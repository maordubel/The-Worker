import type { LocationId } from '../types'

import { cast, partner } from './rooms2000'
import type { ActorDef, HotspotDef } from './scenes'
import type { Condition } from './types'

/**
 * ============================================ מעבר ג׳ — 2000–2012, בעולם (28.9.2026) ====
 *
 * `IMPLEMENTATION-PASS-PROGRAMMER` §21–§40: *"expose the primary hotspot/actor/exit in the
 * world; do not open a menu before the player sees the scene."* What the twenty chapters of
 * 2000–2012 ask of the hands stands here — the diary on the fridge, the sofa beside Kobi, the
 * chair at the café, the evidence on the café table, the correction on the proof — each with a
 * `when` that opens it when it can be done and closes it once it was.
 *
 * Same mechanism as `STAGED` and `QUEST_SPOTS` (`scenes.ts`, one loop): a row goes into the
 * room, or into the painting the room stands on in that year. The words live in the chapter
 * files; only the place lives here.
 */

const f = (flag: string): Condition => ({ flag })
const no = (flag: string): Condition => ({ notFlag: flag })
const is = (flag: string, value: string | number): Condition => ({ flagIs: { flag, value } })
const all = (...conditions: Condition[]): Condition => ({ all: conditions })
const any = (...conditions: Condition[]): Condition => ({ any: conditions })

const HAS_PARTNER = f('life:partner')
const NO_PARTNER = no('life:partner')
/** 2012-cups — the evening goes to whoever was promised the hour */
const CUPS_GOING = any(f('n:go'), is('n:plan', 'elsewhere'))

export const PASS_C_SPOTS: Partial<Record<LocationId, HotspotDef[]>> = {
  kitchen: [
    // 2012-cups · N01.1 — "לתאם את הבית מראש": the diary on the fridge, before the door
    { id: 'n-fridge', era: '2012-cups', x: 0.67, y: 0.8, w: 0.07, act: 'n-fridge', verb: 'hold', labelHe: 'היומן על המקרר — לכתוב את הערב', when: all(is('n:plan', 'there'), no('n:fridge'), no('n:final')), prop: { key: 'propPlanner', size: 0.03, at: { x: 0.672, y: 0.47 } }, priority: 4 },
  ],
  home: [
    // 2012-cups · N01.2 — the sofa, beside Kobi's armchair
    { id: 'n-sofa', era: '2012-cups', x: 0.73, y: 0.74, w: 0.12, act: 'n-tv', verb: 'sit', labelHe: 'הספה — לשבת עם אבא לגמר', when: all(is('n:plan', 'sofa'), no('n:watching')), priority: 4 },
  ],
  allenby: [
    // 2012-cups · L02 S3 — the café table where the partner waits
    { id: 'n-table', era: '2012-cups', x: 0.82, y: 0.77, w: 0.06, act: 'n-table', verb: 'sit', labelHe: 'השולחן בבית הקפה — לשבת', when: all(HAS_PARTNER, f('n:arrived'), no('n:sat')), priority: 4 },
  ],
  street: [
    // 2012-cups · L02 S3 — Amit's boxes, if the first box was closed before the work started
    { id: 'n-boxes', era: '2012-cups', x: 0.56, y: 0.74, w: 0.06, act: 'n-boxes', verb: 'take', labelHe: 'הארגזים של עמית — לטנדר', when: all(NO_PARTNER, f('n:arrived'), no('n:moved')), priority: 4 },
  ],
}

export const PASS_C_STAGED: Partial<Record<LocationId, ActorDef[]>> = {
  allenby: [
    // 2012-cups · L02 — the partner at the café, from the moment the evening goes there
    ...partner('2012-cups', all(HAS_PARTNER, CUPS_GOING), { x: 0.75, y: 0.77, flip: true }),
  ],
  street: [
    // 2012-cups · L02 — Amit and his boxes, on the pavement in front of the wall
    ...cast('2012-cups', all(NO_PARTNER, CUPS_GOING), [{ who: 'עמית', x: 0.62, y: 0.745, flip: true }]),
  ],
}
