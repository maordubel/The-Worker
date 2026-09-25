import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import { meets, type Condition } from '../world/types'
import type { Branch, ChoiceDef, Conversation, Effect } from './script'
import { PORTRAIT_HOME } from './chapter2006home'

/**
 * U01–U05 · "מי פותח מחר" · 2007–2009 — **וזו הסיבה שזה ארבעה פרקים ולא אחד.**
 *
 * `USSISHKIN_FOUNDER.apex` מבקש **שלוש ראיות בשלושה פרקים שונים** בתוך חלון ההקמה
 * (`FOUNDING_YEAR = 2007`). זה נכתב ב-`routes.ts` הרבה לפני התסריט, ו-`achievements.ts`
 * אמר את זה בקול מאז 16.9.2026: *"כשייכתב, הוא חייב להיכתב כשלושה פרקים, כי הפסגה
 * מבקשת שלוש הוכחות בפרקים שונים — שנה שהיא פרק אחד הופכת אותה לבלתי-אפשרית במבנה."*
 *
 * אז 2007 הוא שלושה פרקים, וכל אחד מהם נושא **נקודה חמה אחת** של `route-proof-found`:
 *
 * · **`2007-table` · U01 · "הדף מהקיוסק"** — השיחה הישנה הופכת לתפקיד. מטרת התסריט
 *   מפורשת: *"בלי לטעון שפוגי הקים לבדו"*, ולכן אחת משלוש הבחירות היא להצטרף כצופה.
 * · **`2007-registered` · U02 + U03** — 25.6.2007, הקבוצה נרשמה; ו-25.7.2007, האולם
 *   נהרס. חודש בין שניהם, ושניהם בארכיון. *"אין מנגנון הצלה. אין פרס על איסוף הריסות."*
 * · **`2007-key` · U04 · "מי פותח מחר"** — המסירה השלישית, ושני העדים.
 * · **`2009-up` · U05** — *"לראות מה גדל מתוך העבודה"*. שנתיים אחר כך, וזה כבר לא ייסוד.
 *
 * **מה שהארכיון מחזיק, ומה שלא.** ההקמה והרישום ב-25.6.2007 מאומתים מאתר המועדון
 * (`association-events.json`, `dateConfirmed`), ההריסה ב-25.7.2007 יושבת ב-`moments.json`
 * וב-`ussishkin.json` עם ציטוטי ynet, והעלייה הראשונה — *"22 ניצחונות ללא הפסד"* — היא
 * שורה בלי תאריך מדויק, ולכן `2009-up` נתלה על **עוגן סיכום** ולא על משחק. שום סצנה
 * כאן לא נוקבת בתוצאה, ואף אחת לא נוקבת בשעת ההריסה — היא סתירה פתוחה בארכיון
 * (6:39 מול 12:00) והיא נשארת כזאת (כלל 60 §3).
 *
 * **החדרים (21.9.2026, מהציורים שמאור מסר):** שולחן הקהילה (U01) ומפגש המתנדבים (U02)
 * יושבים ב-`community-room` — שולחן ארוך, לוח שעם, קומקום; אולם האימון של הקבוצה החדשה
 * (U04) ואחרי משחק העלייה (U05) ב-`hall-new`, אולם שכור — ולא עוד ב-`ussishkin-hall`,
 * שהיה אנכרוניזם מוצהר: אוסישקין נהרס חודש לפני שהמפתח הראשון נמסר. עד שהציורים הגיעו
 * אלה ישבו בקיוסק, באלנבי ובאולם שכבר איננו, כתחליפים שמאור אישר.
 */

/**
 * ============================================ דלתא 90 — עושים את ההקמה, לא אומרים אותה ====
 *
 * `NARRATIVE-QUEST-DESIGN-PASS-v2` §7 (2007–2009, HIGH-PRIORITY EXPAND) ו-§13 ("Conversion
 * example — 2007 calls"). עד היום שלוש השיחות, מיון הציוד והרשימה היו **משפט שבוחרים**, וכל
 * אחד מהם נתן מיד זמן, ארגון ואמון — בדיוק האנטי-דפוס של §11.4. עכשיו השרשרת היא:
 *
 * `שולחן → תפקיד → לבדוק מה חסר (U01) → שיחה אחת בכל פעם, מישהו מבטל, להחליף או לצמצם →
 *  למסור את הרשימה ביד (U02) → לסחוב/לרשום → להראות לענבל / לתלות ליד הדלת (U04) →
 *  למחרת בשמונה מישהו משתמש במה שהכנת → 2009 זוכר (U05)`
 *
 * · **U01** — "תפעול" שולח למחסן (`chore:story:count-07`, לספור בידיים מה יש ומה אין);
 *   "אנשים" פוגש את האנשים בדרך לדלת (`returns-07`); "רק בא" נשאר צופה, בלי עונש.
 * · **U02** — ההתחייבות היא *כמה*: ארבעה (מה שהבטחת) או שלושה ("שלוש שיחות, לא שלושים").
 *   הדף עם המספרים עומד בחדר, שיחה בכל לחיצה, וליד כל שם מה שפוגי יודע עליו — שניים
 *   בטוחים, שלושה עם "אבל". כשהרשימה מלאה, אחד מבעלי ה"אבל" מתקשר ומבטל (`u-cancel`),
 *   ואז בוחרים שוב, עם יותר מידע: שם אחר, או ליוסף את המספר האמיתי. הדף נמסר ביד.
 * · **U04** — לסדר (`kit-07`, מהדלתות לכלוב) או לרשום (`labels-07`, פתק על כל דבר), ואז
 *   להראות לענבל / לתלות ליד הדלת. **למחרת בשמונה** (`u-key-close`) מישהו אחר פותח, והוא
 *   מוצא — או מחפש עשר דקות — בדיוק לפי מה שנעשה.
 * · **U05** — "הפעם לא לבד" קיים רק למי שעשה משהו ב-2007 (`FOUNDING_WORKED`), "להחזיר את
 *   המפתח" רק למי שהחזיק אחד, ומי שלא עשה כלום עומד בשורה האחורית — חיים שלמים גם הם.
 *
 * **הראיה.** `route-proof-found` (שיחת המסלולים, `content/routes.ts`) עומדת פעם אחת בכל פרק
 * של 2007, בחדר של הפרק, ורק אחרי שנעשתה בו עבודה (`u:hands` בידיים; ב-U02 — `u:did`, המסירה ליוסף) — *"הסצנה מאשרת את התרומה
 * בפועל"*, מה שהפסגה עצמה כותבת. תגמול על עבודה ניתן בתגובה שאחרי העבודה (branch `then`),
 * ולעולם לא בבחירה (`tests/life-adult-quests-a.test.ts`).
 */

/**
 * התפקיד שנלקח ב-U01, כדגל חיים — כי `u:roleKind` הוא דגל יום ו-`2007-registered` הוא
 * פרק אחר. בלעדיו U02 הציעה *"למסור את מה שהבטחת"* גם למי שלא הבטיח דבר.
 */
export const FOUNDING_ROLE = 'life:founding:role'
const HAS_ROLE: Condition = { any: [{ flagIs: { flag: FOUNDING_ROLE, value: 'operations' } }, { flagIs: { flag: FOUNDING_ROLE, value: 'people' } }] }

/** מה שהמפתח של U04 השאיר — `held` = פוגי מחזיק אחד, ו-2009 יכול לבקש אותו בחזרה */
export const FOUNDING_KEY = 'life:founding:key'
/** מה ש-U02 מסר ליוסף — `replaced` / `reduced` */
export const FOUNDING_CALLS = 'life:founding:calls'

export const PORTRAIT_FOUNDING: Record<string, string> = {
  ...PORTRAIT_HOME,
  // יוסף מדבר כאן חמש שורות, והפלייט שלו קיים מאז הביבליה. `tests/life-portraits`
  // תפס שהוא חסר במפה ברגע שהפרק נכתב — בדיוק מה שהשומר ההוא קיים בשבילו (כלל 67).
  'יוסף': 'faceYosef',
  'ענבל': 'faceLimor',
}

// ------------------------------------------------------------ הרשימה של U02 ----

/**
 * חמישה שמות, וליד כל אחד **מה שפוגי יודע עליו** — כך שהסיבוך מובן לפני שהוא קורה
 * (§15 Conflict: *"Is the constraint understandable before consequence?"*). שניים בלי
 * "אבל", שלושה עם. מי שבוחר שלושה חייב לפחות אחד עם "אבל", ומי שבוחר ארבעה — שניים,
 * ולכן **תמיד** מישהו מבטל (§5.5), והראשון מבין בעלי ה"אבל" שנבחרו הוא זה שמבטל.
 */
type Callee = { id: string; who: string; textHe: string; yesHe: string; cancelHe: string; risky: boolean }
export const CALLEES: readonly Callee[] = [
  { id: 'batya', who: 'בתיה', textHe: '(בתיה — באה תמיד. אין לה נייד, רק הטלפון בבית.)', yesHe: 'בתיה: "ביום ראשון? אני מביאה עוגה, אתם מביאים כיסאות."', cancelHe: 'הברך. ביום ראשון אני לא עולה מדרגות, סליחה.', risky: false },
  { id: 'yaron', who: 'ירון', textHe: '(ירון — ידיים טובות. אמר שיבוא, ובא.)', yesHe: 'ירון: "שמונה? אני שם ברבע לשמונה."', cancelHe: 'הילד חולה. אני לא משאיר אותו.', risky: false },
  { id: 'shlomi', who: 'שלומי', textHe: '(שלומי — נוהג, עובד במשמרות. תלוי בסידור.)', yesHe: 'שלומי: "אם הסידור יוצא — כן. אני אגיד לך."', cancelHe: 'יצא לי משמרת ביום ראשון. אמרתי שאגיד לך — אז אני אומר.', risky: true },
  { id: 'azulay', who: 'אזולאי', textHe: '(אזולאי — אמר "אולי" גם בשנה שעברה.)', yesHe: 'אזולאי: "כן, כן. בטח. כנראה."', cancelHe: 'תשמע, ביום ראשון זה לא ילך. בפעם הבאה, בטוח.', risky: true },
  { id: 'melamed', who: 'מלמד', textHe: '(מלמד — בא, כשאין הופעה.)', yesHe: 'מלמד: "אם אין לי הופעה, אני הראשון שם."', cancelHe: 'קיבלתי הופעה בחיפה. אני לא אומר לא לכסף, לא עכשיו.', risky: true },
]
const calledFlag = (id: string) => `u:call:${id}`
const SLOT = [1, 2, 3, 4] as const
const slotFlag = (k: number) => `u:c${k}`
const ORDINAL = ['', 'הראשונה', 'השנייה', 'השלישית', 'הרביעית']

/** הרשימה מלאה — שלוש שיחות למי שאמר שלוש, ארבע למי שהבטיח את מה שהבטיח */
const ENOUGH: Condition = {
  any: [
    { all: [{ flagIs: { flag: 'u:want', value: 3 } }, { flag: slotFlag(3) }] },
    { all: [{ flagIs: { flag: 'u:want', value: 4 } }, { flag: slotFlag(4) }] },
  ],
}

/**
 * מי מבטל: הראשון (לפי הסדר של `CALLEES`) מבעלי ה"אבל" שנרשם — ואם, בלתי אפשרי במבנה,
 * אף אחד מהם, הראשון בכלל. תנאי לכל אחד, כדי שהשיחה עצמה תכריע ותרשום (ולא פונקציה
 * שאף מכשיר לא רואה) — ומי שסוגר אותה בטעות שומע את הטלפון שוב.
 */
export function cancelWhen(id: string): Condition {
  const order = [...CALLEES.filter((c) => c.risky), ...CALLEES.filter((c) => !c.risky)]
  const at = order.findIndex((c) => c.id === id)
  return { all: [{ flag: calledFlag(id) }], none: order.slice(0, at).map((c) => ({ flag: calledFlag(c.id) })) }
}

export function cancellerOf(state: LifeState): string {
  return (CALLEES.find((callee) => meets(state, cancelWhen(callee.id))) ?? CALLEES[0]!).id
}

export function objectiveTable(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['u:role']) return sceneId === 'community-room' ? null : 'חדר הקהילה. יוסף ושחור מחכים עם הדף.'
  if (state.flags['u:roleKind'] === 'operations' && !state.flags['u:counted']) {
    return sceneId === 'storeroom' ? 'המדפים. מה יש, ומה חסר — לספור, לא לנחש.' : 'המחסן, בדלת מימין. מה יש ומה אין.'
  }
  return null
}

export function objectiveRegistered(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['u:deliver'] && !state.flags['u:calls']) return sceneId === 'community-room' ? null : 'המתנדבים. חדר הקהילה.'
  if (!state.flags['u:deliver']) {
    if (state.flags['u:adapted']) return 'יוסף מחכה לרשימה. ביד, לא בהודעה.'
    if (state.flags['u:cancelled']) return 'מישהו ביטל. שם אחר — או ליוסף את המספר האמיתי.'
    if (meets(state, ENOUGH)) return 'הרשימה מלאה. עכשיו הטלפון יחזור.'
    return 'הדף עם המספרים. שיחה אחת בכל פעם.'
  }
  if (!state.flags['u:loss']) return sceneId === 'ussishkin-outside' ? null : 'אוסישקין. היום.'
  return null
}

export function objectiveKey(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['u:keyPlan'] && !state.flags['u:key']) return sceneId === 'hall-new' ? null : 'מחר בשמונה, באולם האימונים. מישהו צריך לפתוח.'
  if (!state.flags['u:key']) return state.flags['u:keyPlan'] === 'list' ? 'הרשימה — ליד הדלתות, בגובה העיניים.' : 'ענבל. להראות לה איפה הכול.'
  return null
}

export function objectiveUp(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['u:after']) return sceneId === 'hall-new' ? null : 'עלינו. באולם — יש מי שיסגור?'
  return null
}

export const ENDINGS_TABLE: Record<string, EndingCard> = {
  role: {
    id: 'role',
    titleHe: 'תפקיד, לא חידה',
    bodyHe:
      'יצאת מהקיוסק עם משהו שצריך לעשות ביום ראשון, ולא עם הרגשה. אפי אמר "תן לו תפקיד, לא חידה", ויוסף נתן. זה כל ההבדל בין שיחה על מועדון לבין מועדון.',
    memoryHe: 'הדף, עם משהו כתוב בצד שלך.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  watcher: {
    id: 'watcher',
    titleHe: 'לא כל מי שנכנס יוצא עם ארגז',
    bodyHe:
      'לא לקחת כלום הפעם, ויוסף לא עשה מזה עניין. "אז תהיה," הוא אמר. יש דרכים להיות בפנים שלא דורשות שתחזיק מפתח, וזו אחת מהן — והיא לא פחות.',
    memoryHe: 'כיסא, ושיחה ששמעת עד הסוף.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

export const ENDINGS_REGISTERED: Record<string, EndingCard> = {
  together: {
    id: 'together',
    titleHe: 'נשארת עוד קצת',
    bodyHe:
      'חודש אחרי שנרשמה קבוצה, נהרס האולם שבו התחיל הכול. אפי שאל אם אתה נשאר עוד קצת ואמרת כן, ולא אמרת שום משפט יפה, כי הוא ביקש שלא.',
    memoryHe: 'שעה שלמה שאין עליה מה לספר.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  documented: {
    id: 'documented',
    titleHe: 'את המקום, כן',
    bodyHe:
      'צילמת את המקום ולא את האנשים, כי אפי ביקש. שנים אחר כך זו הייתה התמונה היחידה שמישהו יכול היה להראות לילד שלא היה שם.',
    memoryHe: 'תמונה של קיר שאיננו.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  remote: {
    id: 'remote',
    titleHe: 'אני לא ממהר',
    bodyHe:
      'לא היית שם. דיברתם בטלפון והוא אמר שאין לו הרבה מה להגיד, ואמרת שאתה לא ממהר. הייתם בשקט כמה דקות וזה היה בסדר.',
    memoryHe: 'שיחה ארוכה שרובה שתיקה.',
    memoryItem: 'folded-paper',
    presence: 'late',
  },
}

export const ENDINGS_KEY: Record<string, EndingCard> = {
  opened: {
    id: 'opened',
    titleHe: 'מי פותח מחר',
    bodyHe:
      'מחר בשמונה יהיה פה משהו, כי סידרת ציוד עד שידעת איפה כל דבר, ואז הראית לענבל. "אני לא קוראת מחשבות," היא אמרה. גם שלך לא מסודרות, אמרת, וסידרת אותן.',
    memoryHe: 'מפתח, ורשימה שמישהו אחר יכול לקרוא.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  listed: {
    id: 'listed',
    titleHe: 'רשימה ליד הדלת',
    bodyHe:
      'לא סידרת כלום. כתבת איפה כל דבר, ותלית את זה ליד הדלתות בגובה העיניים. בשמונה בבוקר מישהו שלא היה פה אתמול קרא, ומצא לבד. זה סוג אחר של לפתוח אולם — כזה שלא צריך אותך בו.',
    memoryHe: 'הדף ליד הדלת, עם טביעת אצבע של מישהו אחר.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  half: {
    id: 'half',
    titleHe: 'שמונה ורבע',
    bodyHe:
      'בשמונה היה פה משהו, אבל לא הכול. ענבל חיפשה את מה שלא הספקת, ומצאה, ואמרה שבפעם הבאה את כל הרשימה. היא לא כעסה. היא פשוט ידעה בדיוק מה חסר, כי זה בדיוק מה שלא נעשה.',
    memoryHe: 'חצי רשימה, ועוד חצי בכתב שלה.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  stood: {
    id: 'stood',
    titleHe: 'דווקא פה שומעים יפה',
    bodyHe:
      'אפי מצא את המקום שבו שומעים יפה, באולם שעוד אין בו כלום. "צריך להתחיל ממשהו," הוא אמר. עמדת שם איתו ולא סידרת שום דבר, וזה היה הדבר הנכון באותו ערב.',
    memoryHe: 'מקום באולם, שרק שניכם יודעים עליו.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

export const ENDINGS_UP: Record<string, EndingCard> = {
  active: {
    id: 'active',
    titleHe: 'הפעם לא לבד',
    bodyHe:
      'עליתם. ויוסף שאל עם מי אתה מתחלק, ואמרת שהפעם אתה לא עושה הכול לבד — וזה היה הדבר הכי קשה להגיד באותו ערב, ולא הדבר הכי קשה לעשות.',
    memoryHe: 'תמונה קבוצתית, ואתה לא במרכז.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  handover: {
    id: 'handover',
    titleHe: 'את המפתח תחזיר עכשיו',
    bodyHe:
      'עליתם, והחזרת את המפתח. "אתה נשאר משלנו," אמר שחור, "רק בלי המפתח." יש דרך לעזוב שאינה עזיבה, ומצאת אותה בערב שכולם חגגו בו.',
    memoryHe: 'תמונה קבוצתית, ומפתח שכבר לא אצלך.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  remote: {
    id: 'remote',
    titleHe: 'מאיפה להתחיל',
    bodyHe:
      'לא היית. אפי אמר שהיה חסר לו שתראה את זה, וביקשת שיספר, והוא שאל מאיפה להתחיל. הוא התחיל משמונה בבוקר לפני שנתיים.',
    memoryHe: 'סיפור ארוך, בטלפון.',
    memoryItem: 'folded-paper',
    presence: 'late',
  },
  guest: {
    id: 'guest',
    titleHe: 'בשורה האחורית',
    bodyHe:
      'עליתם, ואתה לא סחבת לזה אף ארגז. עמדת בשורה האחורית ומחאת כפיים כמו כל מי שבא, ויוסף הנהן אליך מהצד השני של התמונה. יש מועדונים שבנויים מאנשים שבאים — וזה מועדון כזה.',
    memoryHe: 'תמונה קבוצתית, ואתה בקצה שלה.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

// --------------------------------------------------------------------------- beats

export const BEATS_TABLE: Beat[] = [
  { id: 'u-table', at: 'community-room', trigger: 'enter', when: { none: [{ flag: 'u:role' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'u-table' }] },
  /**
   * הסגירה — רק אחרי שמה שנלקח נעשה (או נעזב באמצע), ולא ברגע שנאמר. הדגל `u:done`
   * מורם **בשיחה**, כך שמי שסוגר את התיבה בטעות מקבל אותה שוב (כלל 42).
   */
  {
    id: 'u-table-close',
    trigger: 'clock',
    when: {
      all: [{ flag: 'u:role' }, { any: [{ flagIs: { flag: 'u:roleKind', value: 'supporter' } }, { flag: 'u:counted' }, { flag: 'u:asked' }] }],
      none: [{ flag: 'u:done' }],
    },
    delayMs: 1100,
    do: [{ a: 'talk', conversation: 'u-table-close' }],
  },
]

export const BEATS_REGISTERED: Beat[] = [
  { id: 'u-deliver', at: 'community-room', trigger: 'enter', when: { none: [{ flag: 'u:deliver' }, { flag: 'u:calls' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'u-deliver' }] },
  /**
   * הסיבוך — מישהו מתקשר בחזרה ומבטל. מי — השיחה מכריעה לפי היומן (`cancelWhen`) ורושמת;
   * הביט שומר על עצמו בדגל שהיא מרימה, ולכן מי שסוגר אותה בטעות שומע את הטלפון שוב.
   */
  {
    id: 'u-cancel',
    trigger: 'clock',
    when: { all: [{ flag: 'u:calls' }, ENOUGH], none: [{ flag: 'u:cancelled' }, { flag: 'u:deliver' }] },
    delayMs: 1400,
    do: [{ a: 'talk', conversation: 'u-cancel' }],
  },
  { id: 'u-loss', at: 'ussishkin-outside', trigger: 'enter', when: { all: [{ flag: 'u:deliver' }], none: [{ flag: 'u:loss' }] }, delayMs: 900, do: [{ a: 'talk', conversation: 'u-loss' }] },
  { id: 'u-reg-close', trigger: 'clock', when: { all: [{ flag: 'u:loss' }], none: [{ flag: 'u:done' }] }, delayMs: 1200, do: [{ a: 'talk', conversation: 'u-loss-close' }] },
]

export const BEATS_KEY: Beat[] = [
  { id: 'u-key', at: 'hall-new', trigger: 'enter', when: { none: [{ flag: 'u:key' }, { flag: 'u:keyPlan' }] }, delayMs: 800, do: [{ a: 'talk', conversation: 'u-key' }] },
  /** אפי והאקוסטיקה — עוד באותו ערב */
  { id: 'u-key-close', trigger: 'clock', when: { all: [{ flagIs: { flag: 'u:keyKind', value: 'stood' } }], none: [{ flag: 'u:done' }] }, delayMs: 1100, do: [{ a: 'talk', conversation: 'u-key-close' }] },
  /** ...וכל השאר — למחרת בשמונה, כשמישהו אחר פותח ומשתמש במה שהוכן (§13) */
  {
    id: 'u-key-morning',
    trigger: 'clock',
    when: { all: [{ flag: 'u:key' }], none: [{ flag: 'u:done' }, { flagIs: { flag: 'u:keyKind', value: 'stood' } }] },
    delayMs: 1100,
    do: [{ a: 'card', titleHe: 'למחרת', subHe: 'שמונה בבוקר', ms: 2200 }, { a: 'talk', conversation: 'u-key-close' }],
  },
]

export const BEATS_UP: Beat[] = [
  { id: 'u-after', at: 'hall-new', trigger: 'enter', when: { none: [{ flag: 'u:after' }] }, delayMs: 800, do: [{ a: 'talk', conversation: 'u-after' }] },
  { id: 'u-up-close', trigger: 'clock', when: { all: [{ flag: 'u:after' }], none: [{ flag: 'u:done' }] }, delayMs: 1100, do: [{ a: 'talk', conversation: 'u-up-close' }] },
]

// -------------------------------------------------------------------- conversations

/** a call, as a choice: one per press of the sheet, the answer is the voice on the line */
function callChoice(callee: Callee, extra: Effect[]): ChoiceDef {
  return {
    id: `call-${callee.id}`,
    text: callee.textHe,
    when: { notFlag: calledFlag(callee.id) },
    hidden: true,
    then: [{ e: 'flag', flag: calledFlag(callee.id) }, ...extra, { e: 'time', minutes: 10 }, { e: 'toast', text: callee.yesHe, tone: 'plain' }],
  }
}

/** the sheet with the numbers — the slots are the order of the calls, the branches read the log */
function callBranches(): Branch[] {
  const branches: Branch[] = [
    { when: { flag: 'u:adapted' }, lines: [{ who: null, text: 'הרשימה סגורה. עכשיו היא צריכה להגיע ליוסף — ביד.' }] },
    {
      when: { flag: 'u:cancelled' },
      lines: [
        { who: null, text: 'שורה אחת ריקה, וליד שם אחד — קו.' },
        { who: null, text: 'אפשר להתקשר למישהו אחר. אפשר גם להשאיר ריק, ולהגיד ליוסף כמה באמת.' },
      ],
      choices: [
        ...CALLEES.map((callee) => ({ ...callChoice(callee, [{ e: 'flag', flag: 'u:replaced' }, { e: 'flag', flag: 'u:adapted' }]), id: `replace-${callee.id}` })),
        { id: 'reduce', text: '(לא להחליף. להגיד ליוסף את המספר האמיתי.)', then: [{ e: 'flag', flag: 'u:reduced' }, { e: 'flag', flag: 'u:adapted' }] },
      ],
    },
    { when: ENOUGH, lines: [{ who: null, text: 'כולם אמרו כן. עכשיו מחכים לראות מי מהם באמת.' }] },
  ]
  for (const k of SLOT) {
    const when: Condition = k === 1 ? { none: [{ flag: slotFlag(1) }] } : { all: [{ flag: slotFlag(k - 1) }], none: [{ flag: slotFlag(k) }] }
    // no "not now" among the names: walking away from the sheet is always allowed, and applies nothing
    const choices = CALLEES.map((callee) => callChoice(callee, [{ e: 'flag', flag: slotFlag(k) }]))
    if (k === 1) {
      // ההמשך של U01: מי שפגש את האנשים בדרך לדלת כתב את הטור הזה בעצמו
      branches.push({
        when: { all: [when, { flag: 'life:founding:asked-all' }] },
        lines: [
          { who: null, text: 'הטור של "חוזר" מהשולחן ההוא, בכתב שלך. חמישה שמות, וליד כל אחד משהו שאתה יודע עליו.' },
          { who: null, text: 'שיחה אחת בכל פעם.' },
        ],
        choices,
      })
      branches.push({
        when,
        lines: [
          { who: null, text: 'הדף עם המספרים. חמישה שמות, וליד כל אחד משהו שאתה יודע עליו.' },
          { who: null, text: 'שיחה אחת בכל פעם.' },
        ],
        choices,
      })
      continue
    }
    branches.push({ when, lines: [{ who: null, text: `השיחה ${ORDINAL[k]}. מי עוד?` }], choices })
  }
  // the way out every conversation must have (tests/life.test.ts): a sheet picked up in any
  // state the slots don't describe is still a sheet of names — said, and put down
  branches.push({ lines: [{ who: null, text: 'הדף עם המספרים. עוד לא הזמן להתקשר.' }] })
  return branches
}

/**
 * U05 — הבחירות, פעם אחת לשני הענפים של `u-after`.
 *
 * "הפעם לא לבד" הוא משפט על שנתיים של עבודה, ולכן הוא קיים רק למי שעשה ב-2007 משהו
 * בידיים (`life:founding:worked`); "להחזיר את המפתח" — רק למי שהחזיק אחד (`FOUNDING_KEY`).
 * מי שלא עשה כלום אינו נענש: הוא עומד בשורה האחורית ומוחא כפיים, וזה סוף משלו.
 */
const AFTER_CHOICES: ChoiceDef[] = [
  {
    id: 'share',
    text: '"הפעם אני לא עושה הכול לבד."',
    when: { flag: 'life:founding:worked' },
    hidden: true,
    then: [
      { e: 'flag', flag: 'u:after' },
      { e: 'flagValue', flag: 'u:afterKind', value: 'active' },
      { e: 'rel', who: 'yosef', axis: 'trust', delta: 4 },
      /**
       * מוניטין אינו אפקט ישיר — הוא ראיה ואז **ידיעה**.
       *
       * הניסיון הראשון כאן היה `{ e: 'standing' }`, ואין דבר כזה, בכוונה:
       * *"מוניטין אינו תכונה שלך — הוא תכונה של מה שקבוצה מסוימת שמעה."*
       * לכן זו ראיה עם קהל, ו-`heard` משלם אותה **באותו רגע** כי כל מי
       * שהיה צריך לראות עומד באותו חדר בערב העלייה. עדות נדחית שיש לה עד
       * נוכח היא דחייה בלי סיבה. (דלתא 90: והיא קיימת רק למי שהעבודה ביומן שלו.)
       */
      { e: 'proof', kind: 'community_help', proofId: 'community_help:{chapter}:shared', subjectHe: 'שנתיים של עבודה, ולא לבד', audience: 'ussishkin', delta: 4 },
      { e: 'heard', proofId: 'community_help:{chapter}:shared' },
      { e: 'toast', text: 'יוסף: "עם מי אתה מתחלק?"', tone: 'plain' },
    ],
  },
  {
    id: 'handover',
    text: '(להחזיר את המפתח.)',
    when: { flagIs: { flag: FOUNDING_KEY, value: 'held' } },
    hidden: true,
    then: [
      { e: 'flag', flag: 'u:after' },
      { e: 'flagValue', flag: 'u:afterKind', value: 'handover' },
      { e: 'flag', flag: 'own:photo:foundingGroup' },
      { e: 'flagValue', flag: FOUNDING_KEY, value: 'returned' },
      { e: 'personality', key: 'responsibility', delta: 3 },
      { e: 'toast', text: 'שחור: "אתה נשאר משלנו." — "רק בלי המפתח."', tone: 'plain' },
    ],
  },
  {
    id: 'guest',
    text: '(לעמוד בשורה האחורית, ולמחוא כפיים.)',
    when: { notFlag: 'life:founding:worked' },
    hidden: true,
    then: [
      { e: 'flag', flag: 'u:after' },
      { e: 'flagValue', flag: 'u:afterKind', value: 'guest' },
      { e: 'rel', who: 'yosef', axis: 'bond', delta: 2 },
      { e: 'toast', text: 'יוסף: "גם מי שבא נחשב. במיוחד מי שבא."', tone: 'plain' },
    ],
  },
  {
    id: 'remote',
    text: '"לא הגעתי. תספר לי."',
    then: [
      { e: 'flag', flag: 'u:after' },
      { e: 'flagValue', flag: 'u:afterKind', value: 'remote' },
      { e: 'rel', who: 'efi', axis: 'bond', delta: 2 },
      { e: 'presence', mode: 'late' },
      { e: 'toast', text: 'אפי: "היה חסר לי שתראה את זה." — "מאיפה להתחיל?"', tone: 'plain' },
    ],
  },
]

export const CONVERSATIONS_FOUNDING: Conversation[] = [
  {
    id: 'u-table',
    nameHe: 'יוסף',
    branches: [
      {
        lines: [
          { who: 'יוסף', text: 'יש לנו הרבה אנשים שאומרים "צריך".' },
          { who: 'שחור', text: 'צריך גם מישהו שיגיע בשמונה.' },
          { who: 'פוגי', text: 'מה יש בשמונה?' },
          { who: 'יוסף', text: 'עוד לא יודע. אבל אם כולם יגיעו בתשע נדע פחות.' },
          { who: 'אפי', text: 'תן לו תפקיד, לא חידה.' },
        ],
        choices: [
          {
            /** התפקיד הוא התחייבות. העבודה עצמה — במחסן, בידיים (`count-07`) */
            id: 'ops',
            text: '"אני לוקח את התפעול. אולם, ציוד, שעות."',
            then: [
              { e: 'flag', flag: 'u:role' },
              { e: 'flagValue', flag: 'u:roleKind', value: 'operations' },
              { e: 'flagValue', flag: FOUNDING_ROLE, value: 'operations' },
              { e: 'toast', text: 'שחור: "מה שלא אצלך, אל תרשום כאילו כבר קנינו."', tone: 'plain' },
            ],
          },
          {
            /** הכיסאות כבר זזים: מי שלקח את האנשים פוגש אותם עכשיו, בדרך לדלת (`returns-07`) */
            id: 'people',
            text: '"אני לוקח את האנשים. מי חוזר ומי רק הקשיב."',
            then: [
              { e: 'flag', flag: 'u:role' },
              { e: 'flagValue', flag: 'u:roleKind', value: 'people' },
              { e: 'flagValue', flag: FOUNDING_ROLE, value: 'people' },
              { e: 'minigame', id: 'chore:story:returns-07' },
            ],
          },
          {
            /**
             * *"בלי לטעון שפוגי הקים לבדו"* — וזו הבחירה שמחזיקה את המשפט הזה.
             *
             * היא לא מעניקה תפקיד, לא מרימה `founding`-כלום, ולא מפחיתה כלום. היא
             * קיימת כי הסצנה קיימת בשבילה, וכי כלל 17 אומר שההיסטוריה של אוסישקין
             * אינה צריכה עזרה כדי להיות אישית.
             */
            id: 'watch',
            text: '"אני רק בא. בלי תפקיד."',
            then: [
              { e: 'flag', flag: 'u:role' },
              { e: 'flagValue', flag: 'u:roleKind', value: 'supporter' },
              { e: 'flagValue', flag: FOUNDING_ROLE, value: 'supporter' },
              { e: 'rel', who: 'yosef', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'יוסף: "אז תהיה. לא כל מי שנכנס צריך לצאת עם ארגז."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    /** U01, תפעול — המדפים במחסן. לספור, לא לנחש */
    id: 'u-shelves',
    nameHe: null,
    branches: [
      { when: { flag: 'u:counted' }, lines: [{ who: null, text: 'ספרת. מה שיש — יש, ומה שאין כתוב "אין", בכתב שלך.' }] },
      {
        lines: [
          { who: null, text: 'כדורים ברשתות, קונוסים, רשת מקופלת. חצי מהדברים פה, וחצי כתובים על פתק של מישהו שכבר הבטיח.' },
          { who: null, text: 'שחור אמר: מה שלא אצלך, אל תרשום.' },
        ],
        choices: [
          { id: 'count', text: '(לספור. דבר־דבר, בידיים.)', then: [{ e: 'minigame', id: 'chore:story:count-07' }] },
        ],
      },
    ],
  },
  {
    /** U04, סידור — מי שבחר לסדר ועוד לא סחב: הארגזים עומדים ליד הדלתות ומחכים לו */
    id: 'u-crates',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'הארגזים עוד ליד הדלתות, כמו שהגיעו. מחר בשמונה מישהו יחפש בהם.' }],
        choices: [{ id: 'carry', text: '(לסחוב. ארגז אחד כל פעם, לכלוב.)', then: [{ e: 'minigame', id: 'chore:story:kit-07' }] }],
      },
    ],
  },
  {
    /** U04, רשימה — מי שבחר לכתוב ועוד לא כתב: הדף הריק על הספסל */
    id: 'u-notes',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'דף ועט, על הספסל. מחר בשמונה יעמוד מולו מישהו שלא היה פה אתמול.' }],
        choices: [{ id: 'write', text: '(לכתוב. ללכת לכל דבר ולרשום איפה הוא.)', then: [{ e: 'minigame', id: 'chore:story:labels-07' }] }],
      },
    ],
  },
  {
    id: 'u-table-close',
    nameHe: null,
    branches: [
      { when: { flagIs: { flag: 'u:roleKind', value: 'supporter' } }, lines: [{ who: null, text: 'הלכת הביתה בלי כלום ביד, ועם תאריך בראש.' }], then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'watcher' }] },
      {
        when: { flag: 'life:founding:count-full' },
        lines: [
          { who: 'שחור', text: 'שישה דברים, וליד שלושה מהם — "אין".' },
          { who: 'שחור', text: 'זה הדף הראשון פה שאפשר לקנות לפיו.' },
          { who: null, text: 'הדף נשאר אצלך. בצד שלו, בכתב שלך, היה עכשיו משהו שצריך לעשות ביום ראשון.' },
        ],
        then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'role' }],
      },
      {
        when: { flag: 'life:founding:asked-all' },
        lines: [
          { who: 'אפי', text: 'התקדמנו מהקיוסק.' },
          { who: null, text: 'הדף נשאר אצלך. בצד שלו, בכתב שלך, שני טורים: מי חוזר, ומי רק הקשיב.' },
        ],
        then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'role' }],
      },
      {
        when: { flag: 'u:hands' },
        lines: [
          { who: 'יוסף', text: 'חצי. את השאר נעשה ביום ראשון, ביחד.' },
          { who: null, text: 'הדף נשאר אצלך. בצד שלו, בכתב שלך, היה עכשיו משהו שצריך לעשות ביום ראשון.' },
        ],
        then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'role' }],
      },
      {
        lines: [
          { who: null, text: 'הצד שלך בדף נשאר ריק. התפקיד — עדיין שלך.' },
          { who: null, text: 'ויום ראשון, כמו תמיד, מגיע בכל מקרה.' },
        ],
        then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'role' }],
      },
    ],
  },
  {
    id: 'u-deliver',
    nameHe: 'יוסף',
    branches: [
      {
        lines: [
          { who: 'יוסף', text: 'הקבוצה נרשמה.' },
          { who: 'פוגי', text: 'אז עכשיו יש קבוצה?' },
          { who: 'שחור', text: 'עכשיו יש עוד דברים לעשות.' },
          { who: 'מתוקי', text: 'הבאתי קלסר.' },
          { who: 'אפי', text: 'טוב. מישהו סוף סוף הביא ספסל לעיתונים.' },
        ],
        choices: [
          {
            /**
             * *"למסור את החלק שלי"* — `flag.founding_role in equipment,people` (U02.1).
             * מי שאמר ב-U01 *"אני רק בא. בלי תפקיד."* לא הבטיח כלום, ולכן אין לו מה
             * למסור. `u:roleKind` נמחק במעבר הפרק, ולכן התפקיד נשמר גם ב-`FOUNDING_ROLE`.
             *
             * (דלתא 90) מה שהבטחת = ארבעה אנשים ביום ראשון. זו התחייבות, לא דיווח: השיחות
             * עצמן נעשות בדף עם המספרים, אחת בכל פעם.
             */
            id: 'deliver',
            when: HAS_ROLE,
            hidden: true,
            text: '(למסור את מה שהבטחת, היום.)',
            then: [
              { e: 'flag', flag: 'u:calls' },
              { e: 'flagValue', flag: 'u:want', value: 4 },
              { e: 'toast', text: 'יוסף: "מה שהבטחת צריך ידיים. ארבעה, ביום ראשון בשמונה."', tone: 'plain' },
            ],
          },
          {
            id: 'late',
            text: '"שלוש שיחות היום. לא שלושים."',
            then: [
              { e: 'flag', flag: 'u:calls' },
              { e: 'flagValue', flag: 'u:want', value: 3 },
              { e: 'toast', text: 'מתוקי: "שלוש שיחות, לא שלושים."', tone: 'plain' },
            ],
          },
          {
            /** להעביר אחריות אפשר רק כשיש אחריות — אותו תנאי, מאותה סיבה. */
            id: 'handover',
            when: HAS_ROLE,
            hidden: true,
            text: '"אני לא יכול. דיברתי עם ענבל, היא לוקחת."',
            then: [
              { e: 'flag', flag: 'u:deliver' },
              { e: 'flag', flag: 'u:handover' },
              { e: 'rel', who: 'crowd-inbal', axis: 'trust', delta: 3 },
              { e: 'personality', key: 'responsibility', delta: 2 },
              { e: 'toast', text: 'שחור: "אז זו העברה. לא היעלמות."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    /** הדף עם המספרים — שיחה בכל לחיצה, וכל תשובה היא קול בקו (`callBranches`) */
    id: 'u-calls',
    nameHe: null,
    branches: callBranches(),
  },
  {
    /** מי שביטל — בטלפון, בקולו, עם הסיבה שכבר הייתה כתובה ליד השם שלו */
    id: 'u-cancel',
    nameHe: null,
    remote: Object.fromEntries(CALLEES.map((callee) => [callee.who, 'phone' as const])),
    branches: [
      ...CALLEES.map((callee): Branch => ({
        when: cancelWhen(callee.id),
        lines: [
          { who: null, text: 'הטלפון מצלצל. זה לא יוסף.' },
          { who: callee.who, text: callee.cancelHe },
        ],
        then: [{ e: 'flag', flag: 'u:cancelled' }, { e: 'flagValue', flag: 'u:cancel', value: callee.id }],
      })),
      { lines: [{ who: null, text: 'מישהו ביטל. שורה אחת נשארה ריקה.' }], then: [{ e: 'flag', flag: 'u:cancelled' }] },
    ],
  },
  {
    /**
     * המסירה — הדף עובר ביד, ויוסף קורא **מה שבאמת קרה**: שם אחר במקום זה שביטל, או
     * שורה ריקה שנאמרה בקול. זו התגובה, והתגמול כאן ולא בבחירה (§13: *"deliver final list"*).
     */
    id: 'u-list',
    nameHe: 'יוסף',
    branches: [
      {
        when: { flag: 'u:replaced' },
        lines: [
          { who: null, text: 'הרשימה מלאה. ליד שם אחד — קו, ושם אחר בכתב שלך.' },
          { who: 'יוסף', text: 'זה הרבה יותר מאני־אטפל.' },
          { who: 'שחור', text: 'מחיקה זה בסדר. מחיקה אומרת שמישהו התקשר.' },
        ],
        then: [
          { e: 'flag', flag: 'u:deliver' },
          { e: 'flagValue', flag: FOUNDING_CALLS, value: 'replaced' },
          { e: 'skill', skill: 'organization', delta: 3, why: 'מסירה בזמן' },
          { e: 'rel', who: 'yosef', axis: 'trust', delta: 5 },
          { e: 'flag', flag: 'u:did' },
          { e: 'flag', flag: 'life:founding:worked' },
        ],
      },
      {
        when: { flag: 'u:reduced' },
        lines: [
          { who: null, text: 'שורה אחת ריקה, ולא מילאת אותה בשם של מישהו שלא אמר כן.' },
          { who: 'יוסף', text: 'טוב שאמרת עכשיו, ולא ביום ראשון בשמונה.' },
          { who: 'מתוקי', text: 'פחות, ובזמן. אני רושם את זה בקלסר.' },
        ],
        then: [
          { e: 'flag', flag: 'u:deliver' },
          { e: 'flagValue', flag: FOUNDING_CALLS, value: 'reduced' },
          { e: 'skill', skill: 'organization', delta: 2, why: 'פחות ממה שהבטחת, ובזמן' },
          { e: 'personality', key: 'honesty', delta: 3 },
          { e: 'rel', who: 'metuki', axis: 'trust', delta: 3 },
          { e: 'rel', who: 'yosef', axis: 'trust', delta: 2 },
          { e: 'flag', flag: 'u:did' },
          { e: 'flag', flag: 'life:founding:worked' },
        ],
      },
      { lines: [{ who: 'יוסף', text: 'כשהרשימה סגורה — תביא. לא לפני.' }] },
    ],
  },
  {
    id: 'u-loss',
    nameHe: 'אפי',
    branches: [
      {
        lines: [
          { who: 'אפי', text: 'ידעתי שזה בא.' },
          { who: 'פוגי', text: 'גם אני.' },
          { who: 'אפי', text: 'זה לא עוזר.' },
          { who: 'פוגי', text: 'לא.' },
          { who: 'אפי', text: 'אל תמצא לי עכשיו משפט יפה.' },
        ],
        choices: [
          {
            id: 'stay',
            text: '"אני נשאר עוד קצת."',
            then: [
              { e: 'flag', flag: 'u:loss' },
              { e: 'flagValue', flag: 'u:lossKind', value: 'together' },
              { e: 'time', minutes: 30 },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'wellbeing', key: 'regret', delta: 4 },
              { e: 'attend' },
            ],
          },
          {
            id: 'photo',
            text: '(לצלם את המקום. לא אותו.)',
            then: [
              { e: 'flag', flag: 'u:loss' },
              { e: 'flagValue', flag: 'u:lossKind', value: 'documented' },
              { e: 'flag', flag: 'own:photo:ussishkinLoss' },
              { e: 'time', minutes: 15 },
              { e: 'skill', skill: 'knowledge', delta: 2, why: 'מה שהיה פה' },
              { e: 'attend' },
              { e: 'toast', text: 'אפי: "את המקום, כן. אותי לא עכשיו."', tone: 'plain' },
            ],
          },
          {
            id: 'call',
            text: '(לא ללכת. להתקשר.)',
            then: [
              { e: 'flag', flag: 'u:loss' },
              { e: 'flagValue', flag: 'u:lossKind', value: 'remote' },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'presence', mode: 'late' },
              { e: 'toast', text: 'אפי: "אין לי הרבה מה להגיד." — "אני לא ממהר."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'u-loss-close',
    nameHe: null,
    branches: [
      { when: { flagIs: { flag: 'u:lossKind', value: 'documented' } }, lines: [{ who: null, text: 'חודש בין השניים. אחד נרשם, אחד נהרס.' }], then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'documented' }] },
      { when: { flagIs: { flag: 'u:lossKind', value: 'remote' } }, lines: [{ who: null, text: 'חודש בין השניים, ואת השני לא ראית.' }], then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'remote' }] },
      { lines: [{ who: null, text: 'חודש בין השניים. אחד נרשם, אחד נהרס, ועמדתם שם עד שהחשיך.' }], then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'together' }] },
    ],
  },
  {
    id: 'u-key',
    nameHe: 'ענבל',
    branches: [
      {
        lines: [
          { who: 'ענבל', text: 'מי שומר את המפתח?' },
          { who: 'פוגי', text: 'מי שגר הכי קרוב?' },
          { who: 'שחור', text: 'מי שבא בזמן.' },
          { who: 'יוסף', text: 'מחר אנשים באים כי הבטחנו שיהיה פה משהו.' },
          { who: 'מתוקי', text: 'אז כדאי שיהיה פה משהו.' },
        ],
        choices: [
          {
            /** הסידור עצמו — ארגז אחד כל פעם, מהדלתות לכלוב (`kit-07`); ענבל אחר כך */
            id: 'sort',
            text: '(לסדר את הציוד, ואז להראות לענבל איפה הכול.)',
            then: [
              { e: 'flagValue', flag: 'u:keyPlan', value: 'sort' },
              { e: 'minigame', id: 'chore:story:kit-07' },
            ],
          },
          {
            /** פתק על כל דבר, במקום שבו הוא עומד (`labels-07`); הרשימה נתלית אחר כך */
            id: 'list',
            text: '(לכתוב רשימה שמישהו אחר יוכל לקרוא.)',
            then: [
              { e: 'flagValue', flag: 'u:keyPlan', value: 'list' },
              { e: 'minigame', id: 'chore:story:labels-07' },
            ],
          },
          {
            id: 'stand',
            text: '(לעמוד עם אפי במקום ששומעים בו יפה.)',
            then: [
              { e: 'flag', flag: 'u:key' },
              { e: 'flagValue', flag: 'u:keyKind', value: 'stood' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'אפי: "צריך להתחיל ממשהו."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    /** המסירה של U04, דרך הסידור — ענבל שואלת, ומה שנסחב הוא מה שאפשר להראות */
    id: 'u-show',
    nameHe: 'ענבל',
    branches: [
      {
        when: { flag: 'life:founding:kit-full' },
        lines: [
          { who: 'ענבל', text: 'עכשיו תראה לי איפה הכול. אני לא קוראת מחשבות.' },
          { who: 'פוגי', text: 'כדורים בכלוב. המשאבה מתחת לספסל. הקונוסים בארגז ליד הסולמות.' },
          { who: 'ענבל', text: 'ואת המפתח?' },
          { who: null, text: 'המפתח נשאר על השרוך שלך. היא רשמה את המספר שלך על הלוח.' },
        ],
        then: [
          { e: 'flag', flag: 'u:key' },
          { e: 'flagValue', flag: 'u:keyKind', value: 'opened' },
          { e: 'flagValue', flag: FOUNDING_KEY, value: 'held' },
          { e: 'rel', who: 'crowd-inbal', axis: 'trust', delta: 4 },
          { e: 'rel', who: 'yosef', axis: 'trust', delta: 3 },
          { e: 'rel', who: 'shachor', axis: 'trust', delta: 3 },
        ],
      },
      {
        when: { flag: 'u:hands' },
        lines: [
          { who: 'ענבל', text: 'עכשיו תראה לי איפה הכול. אני לא קוראת מחשבות.' },
          { who: 'פוגי', text: 'חצי. מה שבכלוב — מסודר. מה שליד הדלת — עוד לא.' },
          { who: 'ענבל', text: 'אז את החצי השני אני אמצא בשמונה.' },
        ],
        then: [
          { e: 'flag', flag: 'u:key' },
          { e: 'flagValue', flag: 'u:keyKind', value: 'half' },
          { e: 'flagValue', flag: FOUNDING_KEY, value: 'held' },
          { e: 'rel', who: 'crowd-inbal', axis: 'trust', delta: 2 },
        ],
      },
      {
        lines: [
          { who: 'ענבל', text: 'אני לא קוראת מחשבות.' },
          { who: null, text: 'הציוד נשאר ליד הדלתות, כמו שהגיע. המפתח עבר אליה.' },
        ],
        then: [{ e: 'flag', flag: 'u:key' }, { e: 'flagValue', flag: 'u:keyKind', value: 'half' }],
      },
    ],
  },
  {
    /** המסירה של U04, דרך הרשימה — נתלית ליד הדלתות, בגובה העיניים */
    id: 'u-pin',
    nameHe: null,
    branches: [
      {
        when: { flag: 'life:founding:labels-full' },
        lines: [
          { who: null, text: 'תלית את הרשימה ליד הדלתות, בגובה העיניים. שישה דברים, ואיפה כל אחד.' },
          { who: 'מתוקי', text: 'זו רשימה שאפשר להשתמש בה.' },
        ],
        then: [
          { e: 'flag', flag: 'u:key' },
          { e: 'flagValue', flag: 'u:keyKind', value: 'listed' },
          { e: 'flagValue', flag: FOUNDING_KEY, value: 'held' },
          { e: 'rel', who: 'yosef', axis: 'trust', delta: 4 },
          { e: 'rel', who: 'shachor', axis: 'trust', delta: 4 },
        ],
      },
      {
        when: { flag: 'u:hands' },
        lines: [
          { who: null, text: 'תלית חצי רשימה ליד הדלתות.' },
          { who: 'מתוקי', text: 'חצי רשימה. מי שיבוא ראשון ימצא את השאר.' },
        ],
        then: [
          { e: 'flag', flag: 'u:key' },
          { e: 'flagValue', flag: 'u:keyKind', value: 'half' },
          { e: 'flagValue', flag: FOUNDING_KEY, value: 'held' },
          { e: 'rel', who: 'metuki', axis: 'trust', delta: 1 },
        ],
      },
      {
        lines: [{ who: null, text: 'הדף נשאר ריק. תלית אותו בכל זאת — שמישהו יידע שהיה פה מקום לרשימה.' }],
        then: [{ e: 'flag', flag: 'u:key' }, { e: 'flagValue', flag: 'u:keyKind', value: 'half' }],
      },
    ],
  },
  {
    /**
     * "מי פותח מחר" — **ולמחרת, מישהו פותח** (§13: *"tomorrow another character uses it"*).
     * אותו מזהה כמו הסגירה הישנה, כדי שמה שנכתב עליה (סוכן A) ימצא אותה.
     */
    id: 'u-key-close',
    nameHe: null,
    branches: [
      { when: { flagIs: { flag: 'u:keyKind', value: 'stood' } }, lines: [{ who: null, text: 'האולם היה ריק, והאקוסטיקה שלו כבר הייתה שם.' }], then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'stood' }] },
      {
        when: { flagIs: { flag: 'u:keyKind', value: 'opened' } },
        lines: [
          { who: null, text: 'שמונה בבוקר. ענבל פתחה בשבע וחמישים, והכדורים חיכו בכלוב.' },
          { who: 'ענבל', text: 'מצאתי את המשאבה בפעם הראשונה. זה נחשב נס פה.' },
          { who: null, text: 'מחר בשמונה היה פה משהו.' },
        ],
        then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'opened' }],
      },
      {
        when: { flagIs: { flag: 'u:keyKind', value: 'listed' } },
        lines: [
          { who: null, text: 'שמונה בבוקר. מישהו שלא היה פה אתמול עמד מול הדף ליד הדלתות, קרא, והלך ישר לכלוב.' },
          { who: 'מתוקי', text: 'הוא אפילו לא שאל. זה הכי טוב שרשימה יכולה לקבל.' },
          { who: null, text: 'מחר בשמונה היה פה משהו.' },
        ],
        then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'listed' }],
      },
      {
        lines: [
          { who: null, text: 'שמונה ורבע. ענבל מצאה את הכדורים, וחיפשה את המשאבה עשר דקות.' },
          { who: 'ענבל', text: 'בפעם הבאה — את כל הרשימה.' },
        ],
        then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'half' }],
      },
    ],
  },
  {
    id: 'u-after',
    nameHe: 'יוסף',
    branches: [
      {
        /** מי שעשה משהו ב-2007 — העולם זוכר את זה לפני שהוא שואל (§15 Payoff) */
        when: { flag: 'life:founding:worked' },
        lines: [
          { who: 'יוסף', text: 'אתם זוכרים כמה היו בהתחלה?' },
          { who: 'שחור', text: 'אני זוכר מי שכח לסגור.' },
          { who: 'פוגי', text: 'זה היה פעם אחת.' },
          { who: 'שחור', text: 'אז אתה זוכר.' },
          { who: 'יוסף', text: 'והדף מאז עוד בארגז. עם המחיקות.' },
          { who: 'אפי', text: 'יופי. עכשיו תחייכו לתמונה.' },
        ],
        choices: AFTER_CHOICES,
      },
      {
        lines: [
          { who: 'יוסף', text: 'אתם זוכרים כמה היו בהתחלה?' },
          { who: 'שחור', text: 'אני זוכר מי שכח לסגור.' },
          { who: 'פוגי', text: 'זה היה פעם אחת.' },
          { who: 'שחור', text: 'אז אתה זוכר.' },
          { who: 'אפי', text: 'יופי. עכשיו תחייכו לתמונה.' },
        ],
        choices: AFTER_CHOICES,
      },
    ],
  },
  {
    id: 'u-up-close',
    nameHe: null,
    branches: [
      { when: { flagIs: { flag: 'u:afterKind', value: 'handover' } }, lines: [{ who: null, text: 'התמונה יצאה טוב. אתה בשורה האחורית, וזה לא היה במקרה.' }], then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'handover' }] },
      { when: { flagIs: { flag: 'u:afterKind', value: 'remote' } }, lines: [{ who: null, text: 'הוא התחיל משמונה בבוקר לפני שנתיים, וזה לקח לו שעה.' }], then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'remote' }] },
      { when: { flagIs: { flag: 'u:afterKind', value: 'guest' } }, lines: [{ who: null, text: 'התמונה יצאה טוב. אתה בקצה שלה, ומוחא כפיים.' }], then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'guest' }] },
      { lines: [{ who: null, text: 'התמונה יצאה טוב, וכולם בה.' }], then: [{ e: 'flag', flag: 'u:done' }, { e: 'ending', id: 'active' }] },
    ],
  },
]
