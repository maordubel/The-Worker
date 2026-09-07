import * as THREE from 'three'

import { buildPano, PANOS, type Pano } from './pano'

/**
 * רחוב — שרשרת של תחנות, וזאת התשובה ל"למה הוא סתם עומד במקום".
 *
 * פנורמה אחת היא **נקודה אחת** בחלל. אפשר להתרחק ממנה כמה מטרים ועדיין להאמין, אבל לא
 * יותר: מה שקרוב ומה שרחוק זזים באותו קצב, והעין קוראת את זה מיד כ"התמונה מתקרבת" ולא
 * כ"אני הולך". זה לא באג שאפשר לתקן בקוד — לתמונה שטוחה פשוט אין עומק לתת.
 *
 * מה שכן פותר את זה הוא בדיוק מה ש-Street View עושה: **לא ללכת רחוק מנקודה אחת, אלא לעבור
 * בין הרבה נקודות.** הרחוב מצולם כל כמה מטרים; ההליכה היא צעד קצר בתוך תחנה, ואז מסירה
 * לתחנה הבאה. כל תחנה נצפית רק מהאזור שבו היא עוד נכונה, ולכן אפשר ללכת מאה מטר בלי
 * שאף תחנה תימתח.
 *
 * המסירה: שתי התחנות הסמוכות חיות בו־זמנית, והמעבר הוא דעיכה של רבע השנייה סביב נקודת
 * האמצע. שלוש סיבות שזה כמעט בלתי נראה — הרצפה משותפת ובמרחב העולם, שתי התחנות מיושרות
 * לאותו ציר, והדעיכה קורית בזמן שהמצלמה עצמה בתנועה.
 *
 * מה שחסר כדי שזה יהיה רחוב אמיתי ולא הדגמה: **התמונות.** תחנה כל עשרה עד שנים־עשר מטר,
 * מאותו גובה, באותה שעה, לאורך אותו רחוב. הקוד כאן לא יודע ולא אכפת לו כמה תחנות יש.
 */

export type Stop = {
  /** מפתח הפנורמה */
  pano: string
  /** כמה מטרים לאורך הרחוב, מהתחנה הראשונה */
  at: number
}

export type Street = {
  nameHe: string
  /** הערה שנאמרת למי שמסתכל, כשהשרשרת היא הדגמה ולא רחוב מצולם */
  noteHe?: string
  stops: Stop[]
}

/**
 * `jaffa` היא **הדגמת מנגנון**, ואמור להיאמר בפירוש: אותה פנורמה יושבת בארבע תחנות, ולכן
 * הרחוב חוזר על עצמו כל שנים־עשר מטר. מה שהיא מוכיחה זה שההליכה עצמה בלתי מוגבלת ושהמסירה
 * לא נראית. ברגע שיהיו ארבע תמונות שונות לאורך אותו רחוב, אותה שורה בדיוק הופכת לשדרות
 * ירושלים באמת.
 */
export const STREETS: Record<string, Street> = {
  jaffa: {
    nameHe: 'שדרות ירושלים — הליכה',
    noteHe: 'אותה תמונה בארבע תחנות: הרחוב חוזר על עצמו כל 12 מטר. עם ארבע תמונות שונות זה רחוב.',
    stops: [
      { pano: 'panoJaffa', at: 0 },
      { pano: 'panoJaffa', at: 12 },
      { pano: 'panoJaffa', at: 24 },
      { pano: 'panoJaffa', at: 36 },
    ],
  },
  bloomfield: {
    nameHe: 'בלומפילד — מהרחוב אל השער',
    noteHe: 'שתי תמונות אמיתיות של אותו מקום, במרחק 18 מטר.',
    stops: [
      { pano: 'panoBloomFacade', at: 0 },
      { pano: 'panoBloomGate', at: 18 },
    ],
  },
}

export type Walk = {
  group: THREE.Group
  eye: number
  /** כמה רחוק אפשר ללכת לאורך הרחוב, במטרים */
  length: number
  /**
   * לעדכן לפי מיקום המצלמה. מחזיר את התחנה הפעילה, כדי שמי שקורא יוכל לדעת איפה הוא.
   * `along` הוא המרחק לאורך הרחוב; ההצטברות עצמה היא באחריות הקורא.
   */
  update: (along: number) => number
  dispose: () => void
}

/** רבע מהמרווח: מספיק ארוך שלא ייראה כהבהוב, קצר מספיק שלא ייראו שתי תחנות זו דרך זו */
const BLEND = 0.25

export function buildStreet(street: Street, loader: THREE.TextureLoader): Walk {
  const group = new THREE.Group()
  const made: Pano[] = []
  let eye = 1.7

  for (const stop of street.stops) {
    const spec = PANOS[stop.pano]
    if (!spec) continue
    // כל תחנה נבנית סביב **נקודת הצילום שלה**, ולכן ה-shader של הרצפה ממשיך לקרוא נכון:
    // הוא מודד מרחק מהמרכז שלה, לא מהמצלמה.
    const origin = new THREE.Vector3(0, 0, -stop.at)
    const pano = buildPano(spec, loader, origin)
    eye = pano.eye
    pano.setAlpha(0)
    group.add(pano.group)
    made.push(pano)
  }

  const stops = street.stops.slice(0, made.length)
  const length = stops.length > 1 ? (stops[stops.length - 1]?.at ?? 0) : 0

  return {
    group,
    eye,
    length,
    update(along: number) {
      // הקטע שבו אנחנו נמצאים. הניסיון הראשון דעך את שתי התחנות זו כנגד זו, ובנקודת האמצע
      // התקבלו שני רפאים בחמישים אחוז שרואים זה דרך זה. מה שעובד הוא הפוך: **התחנה שיוצאת
      // נשארת אטומה לגמרי, והנכנסת נצבעת מעליה ומתמלאת.** בכל רגע יש תמונה שלמה אחת, ומעליה
      // תמונה שנכנסת — אף פעם לא שתי חצאים.
      let index = 0
      while (index + 1 < stops.length && along >= (stops[index + 1]?.at ?? Infinity)) index += 1

      const here = stops[index]?.at ?? 0
      const next = stops[index + 1]?.at
      const span = next === undefined ? 0 : next - here
      const t = span > 0 ? (along - here) / span : 0
      const rise = span > 0 ? Math.max(0, t - (1 - BLEND)) / BLEND : 0
      // חלקה, לא ליניארית — התחלה וסוף רכים, כדי שהמעבר לא ייראה כמו מתג
      const incoming = rise * rise * (3 - 2 * rise)

      for (let i = 0; i < made.length; i += 1) {
        made[i]?.setAlpha(i === index ? 1 : i === index + 1 ? incoming : 0)
        made[i]?.setOrder(i)
      }
      return incoming > 0.5 ? index + 1 : index
    },
    dispose() {
      for (const pano of made) pano.dispose()
    },
  }
}
