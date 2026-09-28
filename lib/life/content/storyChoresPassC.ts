import type { LifeEvent } from '../events'

import type { StoryChore } from './storyChores'

/**
 * עבודה בעלילה — מעבר ג׳, 2000–2012 (28.9.2026, `IMPLEMENTATION-PASS-PROGRAMMER` §21–§40).
 *
 * The same contract as `storyChores.ts` and `storyChoresAdult.ts`: no wage slot, can be stopped
 * halfway, `finish` pays in what the work changed and never more than was carried, and what it
 * writes is what the next conversation reads. This file does not import `income.ts` (the
 * `income → prices → chapters` cycle, `storyChoresAdult.ts`).
 */

const clamp = (done: number, target: number) => Math.max(0, Math.min(done, target))

/** L02 · 2012 — Amit's move: from the pavement to the van at the corner, one box at a time */
function move(id: string, target: number, hintHe: string): StoryChore {
  return {
    id,
    where: 'street',
    drop: { x: 0.12, y: 0.74 },
    labelHe: 'הארגזים של עמית',
    shape: { mode: 'carry', art: 'propCrate', target, seconds: 20 + 5 * target, hintHe },
    returnSpawn: 'fromHome',
    finish: (done, total) => {
      const carried = clamp(done, total)
      const events: LifeEvent[] = [{ t: 'flag.raised', flag: 'n:moved' }, { t: 'clock.advanced', minutes: 5 * carried + 5 }]
      if (carried > 0) events.push({ t: 'energy.changed', delta: -2 * carried }, { t: 'relationship.changed', who: 'amit', axis: 'bond', delta: carried >= total ? 3 : 1 })
      if (carried >= total) events.push({ t: 'flag.raised', flag: 'n:moved-all' })
      return events
    },
    toastHe: (done, total) =>
      done >= total ? 'הטנדר מלא. עמית סגר את הדלת האחורית ברגל ואמר "עכשיו בירה".' : done > 0 ? `${done} ארגזים בטנדר. את השאר עמית והשכן גררו לבד.` : 'עמית הרים את הראשון בעצמו, ולא הסתכל אם אתה בא.',
  }
}

export const STORY_CHORES_PASS_C: Record<string, StoryChore> = {
  /** I01 · 2010 — the sofa cleared for two guests: newspapers, the remote, Kobi's coat, a box */
  'sofa-10': {
    id: 'sofa-10',
    where: 'home',
    drop: { x: 0.73, y: 0.74 },
    labelHe: 'הספה, לשניים',
    shape: { mode: 'collect', art: 'propPaperFolded', target: 4, seconds: 30, hintHe: 'עיתונים, שלט, המעיל של אבא, קופסה. לגשת לכל אחד ולהרים. כפתור — לעצור.' },
    returnSpawn: 'start',
    finish: (done, target) => {
      const cleared = clamp(done, target)
      const events: LifeEvent[] = [{ t: 'flag.set', flag: 'i:need:bed', value: cleared > 0 ? 'self' : 'dropped' }, { t: 'clock.advanced', minutes: 5 * cleared + 5 }]
      if (cleared > 0) events.push({ t: 'flag.raised', flag: 'life:intl:hosted' }, { t: 'relationship.changed', who: 'lina', axis: 'trust', delta: cleared >= target ? 3 : 1 })
      return events
    },
    toastHe: (done, target) => (done >= target ? 'הספה פנויה. רחל הביאה שמיכה נוספת בלי שביקשת.' : done > 0 ? 'חצי ספה. ניקו אמר שהוא ישן גם על חצי.' : 'הספה נשארה כמו שהיא. רומא ימצא מיטה אחרת.'),
  },
  'move-12': move('move-12', 8, 'שמונה ארגזים מהמדרכה לטנדר בפינה. אחד כל פעם. כפתור — להפסיק.'),
  'move-12-late': move('move-12-late', 3, 'שלושה שנשארו. אחד כל פעם, לטנדר. כפתור — להפסיק.'),
}
