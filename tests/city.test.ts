import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { isYellow } from '@/lib/isYellow'
import { DISC_FACTOR, nearEdge, PANOS, PLACE_ORDER, walkLimit } from '@/lib/life/city/pano'
import { STREETS } from '@/lib/life/city/street'
import { SLABS } from '@/lib/life/city/slab'

const ART = join(process.cwd(), 'public', 'life', 'art')
const manifest = JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8')) as {
  panoramas?: Record<
    string,
    {
      w: number; h: number; horizon: number; nearRgb: number[]; yellowLeft: number; source: string
      tile?: { key: string; wide: number; deep: number }
    }
  >
}

/**
 * העיר — השומרים.
 *
 * שלב 1 נשען על שרשרת קצרה של מספרים שכולם נמדדו מהתמונה: קו האופק, שדה הראייה, וצבע
 * הכביש. אם אחד מהם ייצא מסנכרון עם הקובץ שנשמר, שום דבר לא ייפול — הרחוב פשוט יתעקם
 * קצת, וזה בדיוק סוג הבאג שאף אחד לא רואה עד שמסתכלים על צילום מסך חודש אחר כך. לכן
 * המספרים נבדקים מול המניפסט שכתב סקריפט הקליטה, ולא מול עצמם.
 */
describe('העיר — הפנורמות מדויקות מול מה שנשמר', () => {
  it('רושמת כל פנורמה במניפסט, עם המקור שלה', () => {
    for (const key of Object.keys(PANOS)) {
      const row = manifest.panoramas?.[key]
      expect(row, `${key} is not registered in the art manifest`).toBeDefined()
      expect(row?.source, `${key} has no provenance`).toBeTruthy()
    }
  })

  it('נושאת בדיוק את קו האופק ואת יחס התמונה שנמדדו', () => {
    for (const [key, spec] of Object.entries(PANOS)) {
      const row = manifest.panoramas?.[key]
      if (!row) continue
      expect(spec.horizon, `${key} horizon drifted from the measured value`).toBeCloseTo(row.horizon, 3)
      expect(spec.aspect, `${key} aspect does not match the saved file`).toBeCloseTo(row.w / row.h, 3)
    }
  })

  it('נושאת את צבע הכביש הנמדד, ולא צבע שנבחר', () => {
    // Rule 11 applies to a colour exactly as it applies to a name: this one is the median
    // of the saved file's bottom band, and the ingest script is what measured it.
    for (const [key, spec] of Object.entries(PANOS)) {
      const row = manifest.panoramas?.[key]
      if (!row) continue
      expect(spec.nearRgb, `${key} near colour is not the measured one`).toEqual(row.nearRgb)
    }
  })

  it('לא נושאת צהוב — נמדד על הבייטים שנשמרו', () => {
    for (const [key] of Object.entries(PANOS)) {
      expect(manifest.panoramas?.[key]?.yellowLeft, `${key} still carries yellow`).toBe(0)
    }
  })

  it('נושאת מרצף מיושר לכל פנורמה, בקנה המידה שנמדד', () => {
    // המרצף הוא מה שמכסה את המרחק הקצר, שבו הקרן משיקה לרצפה וההיטל מותח חמישה פיקסלים על
    // עשרה מטר. אם המידות שלו יסטו ממה שהסקריפט ייצר, הרצפה תזוז מתחת לרגליים בקצב הלא נכון
    // — וזה בדיוק סוג הבאג שלא נראה בתמונה סטטית.
    for (const [key, spec] of Object.entries(PANOS)) {
      const row = manifest.panoramas?.[key]
      expect(spec.tile, `${key} has no rectified ground`).toBeDefined()
      expect(spec.tile?.wide, `${key} tile width drifted`).toBeCloseTo(row?.tile?.wide ?? -1, 2)
      expect(spec.tile?.deep, `${key} tile depth drifted`).toBeCloseTo(row?.tile?.deep ?? -1, 2)
    }
  })

  it('שומרת את הכיס בתוך הדיסקה', () => {
    // The pocket is how far the player may walk from the point the panorama was shot. The
    // floor under him is the disc, and if he can reach its rim the frame shows the void —
    // which is exactly what the first screenshot of a five-metre walk showed. The margin is
    // doubled rather than exact: he walks to the rim of the pocket and then looks AROUND
    // from there, and the far side of the disc has to still be under the picture.
    for (const [key, spec] of Object.entries(PANOS)) {
      expect(nearEdge(spec) * DISC_FACTOR, `${key} can walk to the rim of its own floor`).toBeGreaterThan(
        walkLimit(spec) * 2,
      )
      expect(walkLimit(spec), `${key} allows no walk at all`).toBeGreaterThan(1)
    }
  })

  it('מציגה כל מקום בבורר, ואף מקום שאינו קיים', () => {
    // הבורר הוא הדרך היחידה של מאור להגיע למקום בלי להקליד כתובת. מקום שנקלט ולא נרשם בו
    // פשוט לא קיים בשבילו, ומקום שנרשם ואין לו תמונה נותן מסך שחור.
    for (const key of PLACE_ORDER) {
      expect(PANOS[key], `${key} is in the chooser but not in the table`).toBeDefined()
    }
    for (const key of Object.keys(PANOS)) {
      expect(PLACE_ORDER, `${key} exists but the chooser never shows it`).toContain(key)
    }
  })

  it('בונה כל רחוב מתחנות שקיימות, בסדר עולה', () => {
    // תחנה שיושבת לפני קודמתה שוברת את המסירה: הדעיכה מחושבת על הקטע, וקטע שלילי הופך
    // את השקיפות לשלילית — כלומר תחנה שנעלמת בדיוק כשצריך להיכנס.
    for (const [key, street] of Object.entries(STREETS)) {
      expect(street.stops.length, `${key} is not a chain`).toBeGreaterThan(1)
      let previous = -Infinity
      for (const stop of street.stops) {
        expect(PANOS[stop.pano], `${key} stops at ${stop.pano}, which does not exist`).toBeDefined()
        expect(stop.at, `${key} stops are out of order`).toBeGreaterThan(previous)
        previous = stop.at
      }
    }
  })

  it('לא צובעת בצבע גולמי — הכל בייטים נמדדים', () => {
    for (const file of ['lib/life/city/pano.ts', 'lib/life/city/slab.ts', 'lib/life/city/street.ts']) {
      const text = readFileSync(join(process.cwd(), file), 'utf8')
      expect(/#[0-9a-fA-F]{6}\b/.test(text), `${file} contains a raw hex`).toBe(false)
      expect([...text.matchAll(/0x[0-9a-fA-F]{6}/g)].map((m) => m[0]), `${file} contains a raw colour`).toEqual([])
    }
  })

  it('בונה כל מישור מציור שקיים, ובסדר מהרחוק לקרוב', () => {
    for (const [key, spec] of Object.entries(SLABS)) {
      let previous = -Infinity
      for (const plane of spec.planes) {
        expect(plane.z, `${key} planes are not ordered far to near`).toBeGreaterThan(previous)
        previous = plane.z
      }
      expect(spec.planes[0]?.opaque, `${key} has no opaque backdrop`).toBe(true)
      expect(spec.horizon, `${key} horizon is outside the picture`).toBeGreaterThan(0.3)
      expect(spec.horizon, `${key} horizon is outside the picture`).toBeLessThan(0.9)
    }
  })

  it('מכסה את הפריים האנכי בשדה הראייה שהוכרז', () => {
    // A 2.56:1 painting filling an upright phone is necessarily wide horizontally. When the
    // declared field of view is too narrow the planes simply do not reach the edge of the
    // frame and black bands appear above and below — which is what the first slab shot did.
    for (const [key, spec] of Object.entries(SLABS)) {
      const vertical = 2 * Math.atan(Math.tan((spec.hFovDeg * Math.PI) / 360) / spec.aspect)
      expect((vertical * 180) / Math.PI, `${key} cannot fill an upright frame`).toBeGreaterThan(52)
    }
  })

  it('לא מכריזה על צהוב בלוח', () => {
    for (const [key, spec] of Object.entries(PANOS)) {
      const [r, g, b] = spec.nearRgb
      expect(isYellow(r, g, b), `${key}'s road colour landed inside the yellow band`).toBe(false)
    }
  })
})
