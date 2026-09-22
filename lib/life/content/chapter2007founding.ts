import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Condition } from '../world/types'
import type { Conversation } from './script'
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
 * התפקיד שנלקח ב-U01, כדגל חיים — כי `u:roleKind` הוא דגל יום ו-`2007-registered` הוא
 * פרק אחר. בלעדיו U02 הציעה *"למסור את מה שהבטחת"* גם למי שלא הבטיח דבר.
 */
export const FOUNDING_ROLE = 'life:founding:role'
const HAS_ROLE: Condition = { any: [{ flagIs: { flag: FOUNDING_ROLE, value: 'operations' } }, { flagIs: { flag: FOUNDING_ROLE, value: 'people' } }] }

export const PORTRAIT_FOUNDING: Record<string, string> = {
  ...PORTRAIT_HOME,
  // יוסף מדבר כאן חמש שורות, והפלייט שלו קיים מאז הביבליה. `tests/life-portraits`
  // תפס שהוא חסר במפה ברגע שהפרק נכתב — בדיוק מה שהשומר ההוא קיים בשבילו (כלל 67).
  'יוסף': 'faceYosef',
  'ענבל': 'faceLimor',
}

export function objectiveTable(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['u:role']) return sceneId === 'community-room' ? null : 'חדר הקהילה. יוסף ושחור מחכים עם הדף.'
  return null
}

export function objectiveRegistered(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['u:deliver']) return sceneId === 'community-room' ? null : 'המתנדבים. חדר הקהילה.'
  if (!state.flags['u:loss']) return sceneId === 'ussishkin-outside' ? null : 'אוסישקין. היום.'
  return null
}

export function objectiveKey(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['u:key']) return sceneId === 'hall-new' ? null : 'מחר בשמונה, באולם האימונים. מישהו צריך לפתוח.'
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
}

// --------------------------------------------------------------------------- beats

export const BEATS_TABLE: Beat[] = [
  { id: 'u-table', at: 'community-room', trigger: 'enter', when: { none: [{ flag: 'u:role' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'u-table' }] },
  { id: 'u-table-close', trigger: 'clock', when: { all: [{ flag: 'u:role' }], none: [{ flag: 'u:done' }] }, delayMs: 1100, do: [{ a: 'flag', flag: 'u:done' }, { a: 'talk', conversation: 'u-table-close' }] },
]

export const BEATS_REGISTERED: Beat[] = [
  { id: 'u-deliver', at: 'community-room', trigger: 'enter', when: { none: [{ flag: 'u:deliver' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'u-deliver' }] },
  { id: 'u-loss', at: 'ussishkin-outside', trigger: 'enter', when: { all: [{ flag: 'u:deliver' }], none: [{ flag: 'u:loss' }] }, delayMs: 900, do: [{ a: 'talk', conversation: 'u-loss' }] },
  { id: 'u-reg-close', trigger: 'clock', when: { all: [{ flag: 'u:loss' }], none: [{ flag: 'u:done' }] }, delayMs: 1200, do: [{ a: 'flag', flag: 'u:done' }, { a: 'talk', conversation: 'u-loss-close' }] },
]

export const BEATS_KEY: Beat[] = [
  { id: 'u-key', at: 'hall-new', trigger: 'enter', when: { none: [{ flag: 'u:key' }] }, delayMs: 800, do: [{ a: 'talk', conversation: 'u-key' }] },
  { id: 'u-key-close', trigger: 'clock', when: { all: [{ flag: 'u:key' }], none: [{ flag: 'u:done' }] }, delayMs: 1100, do: [{ a: 'flag', flag: 'u:done' }, { a: 'talk', conversation: 'u-key-close' }] },
]

export const BEATS_UP: Beat[] = [
  { id: 'u-after', at: 'hall-new', trigger: 'enter', when: { none: [{ flag: 'u:after' }] }, delayMs: 800, do: [{ a: 'talk', conversation: 'u-after' }] },
  { id: 'u-up-close', trigger: 'clock', when: { all: [{ flag: 'u:after' }], none: [{ flag: 'u:done' }] }, delayMs: 1100, do: [{ a: 'flag', flag: 'u:done' }, { a: 'talk', conversation: 'u-up-close' }] },
]

// -------------------------------------------------------------------- conversations

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
            id: 'ops',
            text: '"אני לוקח את התפעול. אולם, ציוד, שעות."',
            then: [
              { e: 'flag', flag: 'u:role' },
              { e: 'flagValue', flag: 'u:roleKind', value: 'operations' },
              { e: 'flagValue', flag: FOUNDING_ROLE, value: 'operations' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'מה שיש ומה שאין' },
              { e: 'rel', who: 'shachor', axis: 'trust', delta: 4 },
              { e: 'toast', text: 'שחור: "מה שלא אצלך, אל תרשום כאילו כבר קנינו."', tone: 'plain' },
            ],
          },
          {
            id: 'people',
            text: '"אני לוקח את האנשים. מי חוזר ומי רק הקשיב."',
            then: [
              { e: 'flag', flag: 'u:role' },
              { e: 'flagValue', flag: 'u:roleKind', value: 'people' },
              { e: 'flagValue', flag: FOUNDING_ROLE, value: 'people' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              // `mediation` בתסריט → `communication` במנוע
              { e: 'skill', skill: 'communication', delta: 3, why: 'שני טורים שונים' },
              { e: 'rel', who: 'yosef', axis: 'trust', delta: 4 },
              { e: 'toast', text: 'אפי: "התקדמנו מהקיוסק."', tone: 'plain' },
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
    id: 'u-table-close',
    nameHe: null,
    branches: [
      { when: { flagIs: { flag: 'u:roleKind', value: 'supporter' } }, lines: [{ who: null, text: 'הלכת הביתה בלי כלום ביד, ועם תאריך בראש.' }], then: [{ e: 'ending', id: 'watcher' }] },
      { lines: [{ who: null, text: 'הדף נשאר אצלך. בצד שלו, בכתב שלך, היה עכשיו משהו שצריך לעשות ביום ראשון.' }], then: [{ e: 'ending', id: 'role' }] },
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
             */
            id: 'deliver',
            when: HAS_ROLE,
            hidden: true,
            text: '(למסור את מה שהבטחת, היום.)',
            then: [
              { e: 'flag', flag: 'u:deliver' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -10 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'מסירה בזמן' },
              { e: 'rel', who: 'yosef', axis: 'trust', delta: 5 },
              { e: 'toast', text: 'יוסף: "זה הרבה יותר מאני־אטפל."', tone: 'plain' },
            ],
          },
          {
            id: 'late',
            text: '"שלוש שיחות היום. לא שלושים."',
            then: [
              { e: 'flag', flag: 'u:deliver' },
              { e: 'time', minutes: 30 },
              { e: 'energy', delta: -5 },
              { e: 'skill', skill: 'organization', delta: 2, why: 'פחות ממה שהבטחת, ובזמן' },
              { e: 'rel', who: 'metuki', axis: 'trust', delta: 3 },
              { e: 'personality', key: 'honesty', delta: 3 },
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
      { when: { flagIs: { flag: 'u:lossKind', value: 'documented' } }, lines: [{ who: null, text: 'חודש בין השניים. אחד נרשם, אחד נהרס.' }], then: [{ e: 'ending', id: 'documented' }] },
      { when: { flagIs: { flag: 'u:lossKind', value: 'remote' } }, lines: [{ who: null, text: 'חודש בין השניים, ואת השני לא ראית.' }], then: [{ e: 'ending', id: 'remote' }] },
      { lines: [{ who: null, text: 'חודש בין השניים. אחד נרשם, אחד נהרס, ועמדתם שם עד שהחשיך.' }], then: [{ e: 'ending', id: 'together' }] },
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
            id: 'sort',
            text: '(לסדר את הציוד, ואז להראות לענבל איפה הכול.)',
            then: [
              { e: 'flag', flag: 'u:key' },
              { e: 'flagValue', flag: 'u:keyKind', value: 'opened' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -15 },
              { e: 'skill', skill: 'organization', delta: 5, why: 'מחר בשמונה' },
              { e: 'rel', who: 'yosef', axis: 'trust', delta: 5 },
              { e: 'rel', who: 'shachor', axis: 'trust', delta: 5 },
              { e: 'rel', who: 'crowd-inbal', axis: 'trust', delta: 4 },
              { e: 'toast', text: 'ענבל: "עכשיו תראה לי איפה הכול. אני לא קוראת מחשבות."', tone: 'plain' },
            ],
          },
          {
            id: 'list',
            text: '(לכתוב רשימה שמישהו אחר יוכל לקרוא.)',
            then: [
              { e: 'flag', flag: 'u:key' },
              { e: 'flagValue', flag: 'u:keyKind', value: 'opened' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'skill', skill: 'knowledge', delta: 5, why: 'רשימה שאפשר להשתמש בה' },
              { e: 'rel', who: 'yosef', axis: 'trust', delta: 4 },
              { e: 'rel', who: 'shachor', axis: 'trust', delta: 4 },
              { e: 'toast', text: 'מתוקי: "זו רשימה שאפשר להשתמש בה."', tone: 'plain' },
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
    id: 'u-key-close',
    nameHe: null,
    branches: [
      { when: { flagIs: { flag: 'u:keyKind', value: 'stood' } }, lines: [{ who: null, text: 'האולם היה ריק, והאקוסטיקה שלו כבר הייתה שם.' }], then: [{ e: 'ending', id: 'stood' }] },
      { lines: [{ who: null, text: 'מחר בשמונה היה פה משהו.' }], then: [{ e: 'ending', id: 'opened' }] },
    ],
  },
  {
    id: 'u-after',
    nameHe: 'יוסף',
    branches: [
      {
        lines: [
          { who: 'יוסף', text: 'אתם זוכרים כמה היו בהתחלה?' },
          { who: 'שחור', text: 'אני זוכר מי שכח לסגור.' },
          { who: 'פוגי', text: 'זה היה פעם אחת.' },
          { who: 'שחור', text: 'אז אתה זוכר.' },
          { who: 'אפי', text: 'יופי. עכשיו תחייכו לתמונה.' },
        ],
        choices: [
          {
            id: 'share',
            text: '"הפעם אני לא עושה הכול לבד."',
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
               * נוכח היא דחייה בלי סיבה.
               */
              { e: 'proof', kind: 'community_help', proofId: 'community_help:{chapter}:shared', subjectHe: 'שנתיים של עבודה, ולא לבד', audience: 'ussishkin', delta: 4 },
              { e: 'heard', proofId: 'community_help:{chapter}:shared' },
              { e: 'toast', text: 'יוסף: "עם מי אתה מתחלק?"', tone: 'plain' },
            ],
          },
          {
            id: 'handover',
            text: '(להחזיר את המפתח.)',
            then: [
              { e: 'flag', flag: 'u:after' },
              { e: 'flagValue', flag: 'u:afterKind', value: 'handover' },
              { e: 'flag', flag: 'own:photo:foundingGroup' },
              { e: 'personality', key: 'responsibility', delta: 3 },
              { e: 'toast', text: 'שחור: "אתה נשאר משלנו." — "רק בלי המפתח."', tone: 'plain' },
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
        ],
      },
    ],
  },
  {
    id: 'u-up-close',
    nameHe: null,
    branches: [
      { when: { flagIs: { flag: 'u:afterKind', value: 'handover' } }, lines: [{ who: null, text: 'התמונה יצאה טוב. אתה בשורה האחורית, וזה לא היה במקרה.' }], then: [{ e: 'ending', id: 'handover' }] },
      { when: { flagIs: { flag: 'u:afterKind', value: 'remote' } }, lines: [{ who: null, text: 'הוא התחיל משמונה בבוקר לפני שנתיים, וזה לקח לו שעה.' }], then: [{ e: 'ending', id: 'remote' }] },
      { lines: [{ who: null, text: 'התמונה יצאה טוב, וכולם בה.' }], then: [{ e: 'ending', id: 'active' }] },
    ],
  },
]
