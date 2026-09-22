import { CAST_2000 } from '../world/castFigures'

import { AMBIENT_1990, type AmbientActor } from './ambient1986'

/**
 * הרקע החי של החיים הבוגרים (21.9.2026).
 *
 * שני דברים, ושניהם אותו כלל של `ambient1986.ts` — *"ambient people are drawn from the crowd
 * sheets and never from the cast"* — שנשבר בשקט ב-2000: מאותה שנה גיליונות הקהל **הם** הקאסט.
 * קרן עומדת על `adultB3`, ניקו על `adultA1`, אילן על `adultB1` (`castFigures.ts`), ואותם
 * גופים המשיכו לחצות את הרחוב כעוברי אורח. אישה שחוצה את הרחוב בזמן שקרן מדברת איתך בקיוסק,
 * בדיוק באותו גוף, היא "קרן הייתה בשני מקומות" — הבאג שהקובץ ההוא נכתב כדי למנוע.
 *
 * לכן מכאן: עוברי האורח של השכונה בלי אף גוף של הקאסט (וגם לא `manCap`, המוכר בפינה של
 * אלנבי), ואנשים במקומות שבהם החיים הבוגרים עומדים ביום משחק — היציע, שער 5, התחנה,
 * הנמל והאולם של 2026. מי שחוצה הוא מי שהולך **הצידה** בציור (`youngA1`, `youngA7`,
 * `youngB1` הולכים שמאלה, `adultA7` ימינה — `FACES_LEFT` ב-`art.ts`), כי גוף שצויר מהגב
 * וגולש לרוחב המסך נראה כמו מישהו על מסוע. ילדים ביציע עם אבא הם העלילה של המשחק הזה.
 */

const CAST_BODIES = new Set(
  Object.values(CAST_2000).flatMap((body) => [body.figure, ...Object.values(body.fromYear ?? {})]),
)

const walker = (row: Omit<AmbientActor, 'size'>): AmbientActor => ({ size: 0.3, ...row })

const MATCH_DAY: AmbientActor[] = [
  // ---- בלומפילד מבפנים: המעבר מאחורי המושבים (הרצועה 0.68–0.9)
  walker({ id: 'bf-in-kid-programme', figure: 'youngA7', location: 'bloomfield-inside', from: 1.06, to: -0.08, y: 0.73, ms: 21000, everyMs: 26000, offsetMs: 4000, pauseAt: 0.4, pauseMs: 2600 }),
  walker({ id: 'bf-in-kid-late', figure: 'youngB1', location: 'bloomfield-inside', from: 1.08, to: -0.1, y: 0.87, ms: 14000, everyMs: 33000, offsetMs: 17000 }),
  walker({ id: 'bf-in-old-fan', figure: 'adultA7', location: 'bloomfield-inside', from: -0.08, to: 1.06, y: 0.76, ms: 30000, everyMs: 41000, offsetMs: 11000, pauseAt: 0.55, pauseMs: 3200 }),
  // ---- שער 5 (0.74–0.95)
  walker({ id: 'g5-kid-bag', figure: 'youngA1', location: 'gate5', from: 1.06, to: -0.08, y: 0.8, ms: 17000, everyMs: 29000, offsetMs: 6000 }),
  walker({ id: 'g5-old-fan', figure: 'adultA7', location: 'gate5', from: -0.08, to: 1.06, y: 0.9, ms: 26000, everyMs: 38000, offsetMs: 15000 }),
  // ---- התחנה המרכזית (0.705–0.86)
  walker({ id: 'bus-bag', figure: 'youngA1', location: 'bus-station', from: 1.06, to: -0.08, y: 0.76, ms: 16000, everyMs: 24000, offsetMs: 3000 }),
  walker({ id: 'bus-old', figure: 'adultA7', location: 'bus-station', from: -0.08, to: 1.06, y: 0.84, ms: 27000, everyMs: 35000, offsetMs: 12000, pauseAt: 0.35, pauseMs: 2400 }),
  // ---- נמל ההגעה, 2026 (0.58–0.84): נוסעים עם תיקים
  walker({ id: 'port-bag', figure: 'youngA1', location: 'port-europe', from: 1.06, to: -0.08, y: 0.64, ms: 18000, everyMs: 22000, offsetMs: 2000 }),
  walker({ id: 'port-old', figure: 'adultA7', location: 'port-europe', from: -0.08, to: 1.06, y: 0.8, ms: 25000, everyMs: 31000, offsetMs: 9000 }),
  // ---- מחוץ לאולם, 2026 (0.69–0.9)
  walker({ id: 'arena-out-kid', figure: 'youngA7', location: 'arena-out', from: 1.06, to: -0.08, y: 0.74, ms: 19000, everyMs: 21000, offsetMs: 5000 }),
  walker({ id: 'arena-out-old', figure: 'adultA7', location: 'arena-out', from: -0.08, to: 1.06, y: 0.86, ms: 24000, everyMs: 29000, offsetMs: 13000 }),
  // ---- המושבים (0.72–0.94)
  walker({ id: 'arena-seat-kid', figure: 'youngB1', location: 'arena-seats', from: 1.06, to: -0.08, y: 0.78, ms: 15000, everyMs: 27000, offsetMs: 8000, pauseAt: 0.5, pauseMs: 2000 }),
]

export const AMBIENT_2000: readonly AmbientActor[] = [
  ...AMBIENT_1990.filter((row) => !CAST_BODIES.has(row.figure) && row.figure !== 'manCap'),
  ...MATCH_DAY,
]
