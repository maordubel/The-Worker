import type { LocationId } from '../types'

import type { HotspotDef } from './scenes'
import type { Condition } from './types'

/**
 * ============================================ pass D — המבוגר מחליט במקום (28.9.2026) ====
 *
 * `IMPLEMENTATION-PASS-PROGRAMMER-2026-09-27` §41–§63: *"expose the primary hotspot/actor/exit
 * in the world; do not open a menu before the player sees the scene"*. אלה הנקודות שפרקי
 * 2013–2026 מדליקים בחדרים — ארבע הגישות של המשרד, ההכנות בדרייב-אין, השבוע על המקרר —
 * כל אחת עם `when` שנפתח מההתחייבות ונסגר מהמעשה, באותה לולאה של `quests90e.ts`
 * (`scenes.ts`). התוכן בקבצי הפרקים; כאן רק המקום.
 */

const f = (flag: string): Condition => ({ flag })
const no = (flag: string): Condition => ({ notFlag: flag })
const all = (...conditions: Condition[]): Condition => ({ all: conditions })

/** 2025 · O02 — the seller's hour: open while it runs, and each corner only until it is closed */
const HOUR = all(f('o:brief'), no('o:verdict'))
const MONEY_OPEN = all(HOUR, no('o:tri:money'), no('o:tri:partner'))

export const PASS_D_SPOTS: Partial<Record<LocationId, HotspotDef[]>> = {
  office: [
    { id: 'o-spot-money', era: '2025-owner', x: 0.39, y: 0.62, w: 0.08, act: 'o-tri-money', verb: 'look', labelHe: 'הלוח של מיכל — העתודה', when: MONEY_OPEN, priority: 4 },
    { id: 'o-spot-partner', era: '2025-owner', x: 0.52, y: 0.66, w: 0.05, act: 'o-tri-partner', verb: 'talk', labelHe: 'פרדי — הדרך המהירה', when: MONEY_OPEN, priority: 3 },
    { id: 'o-spot-squad', era: '2025-owner', x: 0.6, y: 0.72, w: 0.05, act: 'o-tri-squad', verb: 'watch', labelHe: 'המחשב — המנהל המקצועי בווידאו', when: all(HOUR, no('o:tri:squad')), priority: 4 },
    { id: 'o-spot-fans', era: '2025-owner', x: 0.9, y: 0.7, w: 0.06, act: 'o-tri-fans', verb: 'talk', labelHe: 'יבגני, ליד החלון', when: all(HOUR, no('o:tri:fans')), priority: 4 },
  ],
}
