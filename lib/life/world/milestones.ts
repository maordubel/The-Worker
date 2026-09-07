import type { LifeState } from '../types'

/**
 * מה פוגי חווה, לא איפה הוא לחץ — semantic milestones and the reconciliation that repairs
 * them.
 *
 * Maor, 7.9.2026, quoting his own audit: *"The story should track what Pugi experienced,
 * not which polygon the player clicked."* The bug that document is about is real and it is
 * in this repository: the evening at Ussishkin ends when `saw:parquet` AND `saw:stand` are
 * both raised, and those are two small hotspots on a floor and a rail. A boy who walked in
 * with Efi, was shown the place, talked to him at the rail and stood there for half an hour
 * has unarguably HAD the experience — and the chapter would keep him until the 20:40
 * backstop because he never pressed the floor.
 *
 * A milestone is the experience written down once, with more than one way to satisfy it:
 *
 *   - the FLAVOR route (look at the two things) — still the richest, still rewarded;
 *   - the SCENE route (be in the room, with the person, for the beat) — always available.
 *
 * `reconcile` is run on scene entry and on load. It only ever RAISES a milestone whose
 * condition the world already proves; it never removes anything and never grants an item,
 * a bond or a memory, because those are consequences of choices and this is repair of
 * technical state (audit §7).
 */

const flag = (state: LifeState, name: string) => Boolean(state.flags[name])

export type Milestone = {
  /** the flag the chapter should gate on; `life:` so it survives the year change */
  id: string
  /** what it means, in the words the audit used */
  meaningHe: string
  /** every way the world can prove it happened */
  when: (state: LifeState) => boolean
}

export const MILESTONES: readonly Milestone[] = [
  {
    id: 'life:seen:ussishkin',
    meaningHe: 'פוגי היה בפעם הראשונה באולם אוסישקין, ואפי הראה לו אותו',
    when: (state) =>
      flag(state, 'a3:inside') &&
      // the two hotspots, or the scene itself: Efi at the rail is the introduction the
      // chapter is actually about, and it cannot be missed by looking the wrong way
      ((flag(state, 'saw:parquet') && flag(state, 'saw:stand')) || flag(state, 'a3:shown')),
  },
]

/** the flags reconciliation would raise right now — empty when nothing needs repair */
export function reconcile(state: LifeState): string[] {
  return MILESTONES.filter((one) => !flag(state, one.id) && one.when(state)).map((one) => one.id)
}

/** has the boy had this experience, whichever way he had it */
export const reached = (state: LifeState, id: string) =>
  flag(state, id) || (MILESTONES.find((one) => one.id === id)?.when(state) ?? false)
