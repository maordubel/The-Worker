import { trackStageFlag } from '../tracks'
import type { LifeState } from '../types'

/**
 * מה פוגי חווה, לא איפה הוא לחץ — semantic milestones and the reconciliation that repairs
 * them.
 *
 * A milestone records a fact the world already proves. Reconciliation never invents a
 * consequence and never awards money, reputation or a relationship; it only raises a
 * persistent flag that says the same fact in the vocabulary the rest of the simulation
 * understands.
 *
 * This is also the compatibility seam for the three LIFE tracks. The 2000–2026 screenplay
 * predates `tracks.ts` and already stores durable facts such as `life:partner` and
 * `life:child`. Rewriting every old choice would fork the truth and break old saves. So the
 * existing story remains authoritative and this layer translates facts that have ALREADY
 * happened into `own:track:*` milestones.
 */

const flag = (state: LifeState, name: string) => Boolean(state.flags[name])
const value = (state: LifeState, name: string) => state.flags[name]

export type Milestone = {
  /** the flag later content should gate on; `life:`/`own:` survive day and year changes */
  id: string
  /** what it means, in player/story language */
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

  // ---------------------------------------------------------------- LIFE tracks ---
  // Partnership is a mutual story choice in L01–L03. The existing durable fact is the
  // selected partner id; it is enough to say the relationship began and became mutual.
  {
    id: trackStageFlag('PARTNERSHIP', 'first'),
    meaningHe: 'נוצר קשר זוגי בהסכמה הדדית',
    when: (state) => typeof value(state, 'life:partner') === 'string' && String(value(state, 'life:partner')).length > 0,
  },
  {
    id: trackStageFlag('PARTNERSHIP', 'together'),
    meaningHe: 'פוגי ובן/בת הזוג בחרו להמשיך ביחד',
    when: (state) => typeof value(state, 'life:partner') === 'string' && String(value(state, 'life:partner')).length > 0,
  },

  // B02 is the first adult commitment in the continuation screenplay. Only the work
  // choice counts: roads/people are equally valid lives but they are not employment.
  {
    id: trackStageFlag('WORK', 'first-job'),
    meaningHe: 'פוגי לקח על עצמו עבודה ראשונה כחלק מחיי המבוגר',
    when: (state) => value(state, 'b:commitKind') === 'work',
  },

  // Parenthood is deliberately NOT inferred from intent. The screenplay explicitly says
  // wanting a child is not a birth. `life:child` is raised only after the consensual time
  // passage in L06, so that durable fact is the honest seam into the track.
  {
    id: trackStageFlag('PARENTHOOD', 'born'),
    meaningHe: 'לפוגי יש ילד והוא נכנס בפועל לחיי הורות',
    when: (state) => flag(state, 'life:child'),
  },
]

/** the flags reconciliation would raise right now — empty when nothing needs repair */
export function reconcile(state: LifeState): string[] {
  return MILESTONES.filter((one) => !flag(state, one.id) && one.when(state)).map((one) => one.id)
}

/** has the player had this experience, whichever way it was recorded */
export const reached = (state: LifeState, id: string) =>
  flag(state, id) || (MILESTONES.find((one) => one.id === id)?.when(state) ?? false)
