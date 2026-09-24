import type { LifeEvent } from '../events'
import type { LocationId } from '../types'

/**
 * עבודה בעלילה — a story beat done with the hands (Director V3 §10, 24.9.2026).
 *
 * `ChoreScene` was built for the paid jobs of `gigs.ts`: an afternoon offered, agreed to,
 * played and paid. V3 asked for the same room to carry the story, because the best
 * moments of the decade were a button that lowered energy and raised a flag: *"לסחוב את
 * הארגזים"* was a sentence you chose, not crates you carried. A story chore is the same
 * shape of work — `carry`: one at a time, from the pile to the door, the walk back is the
 * cost — with no wage and no once-a-chapter job slot. It pays in what it changes, scaled by
 * how much of it was done, and it can be stopped halfway: the half that was carried counts.
 *
 * Content only: the runtime reads the row, plays it, and dispatches `finish(done, target)`.
 * It is opened as `{ e: 'minigame', id: 'chore:story:<id>' }`.
 */
export type StoryChore = {
  id: string
  /** the room the work happens in — its painting, band and size */
  where: LocationId
  /** where the pieces are carried TO */
  drop: { x: number; y: number }
  labelHe: string
  /** `carry` — one at a time to the drop; `serve` — people arrive, wait a little, and go */
  shape: { mode: 'carry' | 'serve'; art?: string; target: number; seconds: number; hintHe: string }
  /** where the room is rebuilt afterwards */
  returnSpawn: string
  /** what the work changed; `done` is what was carried, never more than `target` */
  finish: (done: number, target: number) => LifeEvent[]
  toastHe: (done: number, target: number) => string
}

export const STORY_CHORE_PREFIX = 'story:'

/** 27.3.1997 — "שני ארגזים צריכים להיכנס לפני הקהל, ואין לי גב." (שחור) */
export const CRATES_1997 = 'h1:crates-carried'

/** 29.3.1999 — "אני עושה את הסדרן הערב. אתה עושה את התור." (לימור) */
export const QUEUE_1999 = 'seed:queue-worked'

export const STORY_CHORES: Record<string, StoryChore> = {
  'queue-99': {
    id: 'queue-99',
    where: 'ussishkin-outside',
    drop: { x: 0.62, y: 0.9 },
    labelHe: 'התור לקופה',
    shape: { mode: 'serve', target: 8, seconds: 40, hintHe: 'הם מגיעים לתור ולא מחכים הרבה. להגיע לכל אחד וללחוץ — כרטיס, עודף, "הבא".' },
    returnSpawn: 'start',
    finish: (done, target) => {
      const served = Math.max(0, Math.min(done, target))
      const events: LifeEvent[] = [{ t: 'flag.raised', flag: QUEUE_1999 }]
      if (served > 0) {
        events.push(
          { t: 'relationship.changed', who: 'crowd-limor', axis: 'trust', delta: Math.min(5, 1 + Math.floor(served / 2)) },
          { t: 'relationship.changed', who: 'shachor', axis: 'bond', delta: served >= target ? 3 : 1 },
          { t: 'personality.shifted', key: 'responsibility', delta: served >= target / 2 ? 3 : 1 },
          { t: 'energy.changed', delta: -Math.ceil(served) },
        )
      }
      return events
    },
    toastHe: (done, target) =>
      done >= target
        ? 'התור נגמר לפני השריקה. לימור סימנה לך וי באוויר.'
        : done > 0
          ? `${done} מתוך ${target}. השאר נכנסו בלי כרטיס, ולימור עשתה את עצמה שלא ראתה.`
          : 'התור עבר לידך. לימור לקחה אותו בעצמה.',
  },
  'crates-97': {
    id: 'crates-97',
    where: 'ussishkin-outside',
    // the glass doors under the canopy (`ussishkin-outside/in`, 0.33–0.45)
    drop: { x: 0.39, y: 0.86 },
    labelHe: 'שני ארגזים לפני הקהל',
    shape: { mode: 'carry', art: 'propCrate', target: 2, seconds: 40, hintHe: 'ארגז אחד כל פעם, עד הדלת של האולם. כפתור — להפסיק באמצע.' },
    returnSpawn: 'start',
    finish: (done, target) => {
      const carried = Math.max(0, Math.min(done, target))
      const events: LifeEvent[] = [{ t: 'flag.raised', flag: CRATES_1997 }]
      if (carried >= target) events.push({ t: 'flag.raised', flag: 'h1:crates-all' })
      if (carried > 0) {
        events.push(
          { t: 'relationship.changed', who: 'shachor', axis: 'bond', delta: carried >= target ? 6 : 3 },
          { t: 'energy.changed', delta: -6 * carried },
          { t: 'redheart.changed', key: 'basketballLove', delta: 2 * carried },
        )
      }
      return events
    },
    toastHe: (done, target) =>
      done >= target
        ? 'לארגז השני חסרה ידית. שחור לא אמר תודה — אמר "עוד אחד".'
        : done > 0
          ? 'ארגז אחד בפנים. את השני שחור לקח בעצמו, בלי מילה.'
          : 'שחור הרים את הראשון בעצמו. הוא לא ביקש פעמיים.',
  },
}
