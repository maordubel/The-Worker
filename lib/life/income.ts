import { decadeOfYear, WAGE } from './prices'
import { trackAtLeast } from './tracks'
import type { LifeState } from './types'

/**
 * הכנסה של מבוגר — ומה שהיה שבור בלי זה (21.9.2026).
 *
 * מאור, כשראה את הכלכלה של הפרקים הבוגרים: *"תסדר שנושא הכסף יהיה יותר לגיטימי
 * ונורמלי."* הוא צדק, והתקלה הייתה עמוקה יותר ממספר אחד.
 *
 * **הארנק ידע סכום ולא ידע קצב** — זה כתוב במילים האלה ב-`NEEDS_A_HOME` מאז שהתסריט
 * מופה. התוצאה: בן עשרים־וארבע שעובד שנה וחצי הגיע ל-2002 עם אותו סדר גודל של ילד
 * בן שמונה שאוסף בקבוקים, כי המקור היחיד לכסף במשחק הוא **ג׳וב אחד לפרק**. `life:budget`
 * מדד את זה בלי להתכוון: כל הכסף שאפשר להרוויח בחיים עד 2002 היה **692 ₪**, בזמן
 * שכרטיס טיסה עולה 1,800 — כלומר שליש מפרק שאיש לא יכול לקחת (כלל 66).
 *
 * **ושתי הטעויות שלי בדרך, כי שתיהן קלות לעשות שוב:**
 *
 * 1. **שישים דקות משחק אינן שעת עבודה.** `gigPay` מתמחר `hours × WAGE`, ו"משמרת" של
 *    שישים דקות **בשעון המשחק** היא יום עבודה בעולם, לא שעה. תמחרתי אותה כשעה וקיבלתי
 *    18 ₪ — ואז התסריט, שכתב 180, נראה כאילו הוא הזה. הוא לא: 180 ₪ הם יום עבודה
 *    ב-2002, וזה בדיוק מה ש-`WAGE` נותן כשסופרים נכון.
 * 2. **סכום קבוע ב-`entry` הוא לא קצב.** התיקון הראשון היה לשים 90,000 אגורות בכניסה
 *    לפרק. זה עבד ולא היה נכון — מספר מוקלד שאינו יודע כמה זמן עבר, מה הוא עושה
 *    לפרנסה, או איפה הוא גר.
 *
 * **המודל, ושלושת המספרים שלו — כולם נגזרים מ-`WAGE` ולא מוקלדים:**
 *
 * · `MONTH_HOURS` — חודש עבודה מלא. 186 שעות, שזו המשרה המלאה הישראלית.
 * · `KEPT` — **מה שנשאר אחרי שחיים**, כשיעור מהשכר, לפי איפה הוא גר. מי שגר אצל
 *   ההורים שומר הרבה; מי שמחזיק בית שומר מעט; מי שמגדל ילד שומר פחות. זה מה שהופך
 *   את מסלולי החיים לדבר שמרגישים בארנק, ולא רק בכרטיס.
 * · `CARRY_MONTHS` — **תקרה על מה שנצבר**, וזו ההכרעה החשובה ביותר כאן. אנשים לא
 *   אוגרים הכול: חמש שנים בין פרקים אינן חמש שנות חיסכון. בלי התקרה, פוגי היה מגיע
 *   ל-2007 עם ארבעים אלף שקל וכל בחירה כספית בתסריט הייתה מתה — כלומר בדיוק אותה
 *   תקלה מהכיוון ההפוך: סף שאי-אפשר **לא** לעבור.
 *
 * מה שיוצא: בערך 2,000–5,000 ₪ בכיס בפרק בוגר. כרטיס לאירופה ב-1,800 הוא שליש מזה —
 * החלטה אמיתית — ומשמרת יום היא 108 ₪, שזה מה שיום עבודה שווה, ולא מה שנוח למשחק.
 */

/** שעות בחודש עבודה מלא */
const MONTH_HOURS = 186

/** מה שנשאר בכיס אחרי שחיים, לפי איפה הוא גר */
const KEPT = {
  withParents: 0.4,
  ownPlace: 0.15,
  family: 0.08,
} as const

/**
 * תקרת הצבירה, בחודשים. שנתיים בין פרקים אינן שנתיים של חיסכון — הן שנתיים של חיים,
 * ומה ששורד אותן הוא מה שלא הלך על כלום מסוים.
 */
const CARRY_MONTHS = 2.5

/**
 * ...וכמה מזה **גדל עם הזמן**, תת-ליניארית.
 *
 * תקרה שטוחה אומרת שארבע שנים שוות לשנה, וזה לא נכון וגם לא מעניין. חיסכון כן גדל
 * כשעובר זמן — הוא פשוט לא גדל פי ארבע, כי חיים אוכלים אותו. `0.35` לכל שנה נוספת,
 * חסום בחצי שנה של שכר: זה ההבדל בין "מה שיש לי עכשיו" ל"כל מה שהרווחתי מאז".
 */
const CARRY_GROWTH = 0.35
const CARRY_CEILING = 6

/** מי שעבודה היא חלק מהחיים שלו מרוויח יציב יותר, ולכן שומר יותר */
const STEADY_WORK = 1.35

export type LivingStage = keyof typeof KEPT

/**
 * איפה הוא גר — נקרא מהמסלולים ומהגיל, ולא מטבלה לפי פרק.
 *
 * `PARENTHOOD` גובר על `PARTNERSHIP` כי ילד הוא ההוצאה הגדולה; מי שהגיע לשלב `home`
 * בזוגיות מחזיק בית; וכל השאר גר אצל ההורים, מה שנכון לפוגי עד שהתסריט אומר אחרת.
 */
export function livingStage(state: LifeState): LivingStage {
  if (trackAtLeast(state, 'PARENTHOOD')) return 'family'
  if (trackAtLeast(state, 'PARTNERSHIP', 'home')) return 'ownPlace'
  return 'withParents'
}

/** מה שחודש עבודה מלא משאיר בכיס, באגורות */
export function monthlyKeptAgorot(year: number, stage: LivingStage, steady: boolean): number {
  // `decadeOfYear` ולא `decadeOf` — השני מקבל **מזהה פרק** ומחזיר 1980 לכל מה שאינו
  // במרשם. `decadeOf(String(2002))` החזיר '80s' בשקט, כלומר שכר של ילד בשנת אלפיים.
  const hourly = WAGE[decadeOfYear(year)]
  const gross = hourly * MONTH_HOURS * 100
  return Math.round(gross * KEPT[stage] * (steady ? STEADY_WORK : 1))
}

/**
 * מה שנשאר בכיס בין שני פרקים — **וזה מה שפרק בוגר נפתח איתו**.
 *
 * `months` הוא הזמן שבאמת עבר, חסום ב-`CARRY_MONTHS`. `steady` הוא האם עבודה היא
 * חלק מהחיים שלו: מסלול `WORK` שהתחיל, או התחייבות עבודה שנלקחה בפרק קודם.
 */
export function carriedBetween(fromYear: number, toYear: number, state: LifeState, steady: boolean): number {
  const years = Math.max(0, toYear - fromYear)
  const allowed = Math.min(CARRY_CEILING, CARRY_MONTHS * (1 + CARRY_GROWTH * Math.max(0, years - 1)))
  const months = Math.max(0, Math.min(allowed, years * 12))
  if (months === 0) return 0
  // שקלים שלמים — ארנק שמראה 4,519.8 ₪ הוא ארנק שסופר אגורות שאיש לא נתן לו
  return Math.round((monthlyKeptAgorot(toYear, livingStage(state), steady) * months) / 100) * 100
}

/**
 * הכניסה של פרק בוגר, כפונקציה — **וזה מה ש-`ChapterDef.entry` קורא**.
 *
 * `steady` נקרא מהעולם ולא מנוחש: מסלול `WORK` שהתחיל, או `b:commitKind === 'work'`
 * (ההתחייבות אצל רפי בלילה שאחרי הדאבל, שזו הבחירה שמחליטה אם אפשר לטוס למילאן).
 */
export function adultEntry(fromYear: number, toYear: number) {
  return (state: LifeState) => {
    const steady = trackAtLeast(state, 'WORK') || state.flags['b:commitKind'] === 'work'
    const agorot = carriedBetween(fromYear, toYear, state, steady)
    if (agorot <= 0) return []
    return [{ t: 'money.changed' as const, agorot, why: steady ? 'מה שנשאר מהמשכורות' : 'מה שנשאר' }]
  }
}

/**
 * משמרת של מבוגר — **ושישים דקות משחק אינן שעת עבודה.**
 *
 * זו הטעות שהפילה את כל החשבון: `gigPay` מתמחר `hours × WAGE`, וכתבתי "משמרת" של
 * שישים דקות **בשעון המשחק** כשעה אחת. שישים דקות בשעון המשחק הן יום עבודה בעולם,
 * ולכן המשמרת אצל רפי שילמה 18 ₪ במקום 180 — והמספר של התסריט נראה מופרך כשדווקא הוא
 * היה הנכון. `WAGE['00s']` הוא 18 ₪ לשעה, שזה בערך שכר המינימום הישראלי של 2002;
 * עשר שעות בקיוסק הן 180 ₪, בדיוק כפי שנכתב.
 *
 * `skilled` הוא עבודה אצל בעל מקצוע — אצל לירון, לא ארגזים — ומשלמת יותר משכר מינימום.
 * המכפיל כתוב פעם אחת, ולא מוקלד לתוך סצנה: מספר שמוקלד בסצנה הוא מספר שלא יודע
 * באיזה עשור הוא (כלל 78).
 */
const SKILLED = 1.4

export function shiftAgorot(year: number, hours: number, skilled = false): number {
  const hourly = WAGE[decadeOfYear(year)]
  return Math.round(hourly * hours * (skilled ? SKILLED : 1)) * 100
}
