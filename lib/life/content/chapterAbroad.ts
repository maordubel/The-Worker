import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_WINDOWS } from './chapterWindows'

/**
 * חלון ABROAD — X01–X05, ו-Q05. **שתיים קורות בתל אביב, שלוש בדירה שם** (21.9.2026).
 *
 * **איך הוא נפתח:** `life:distance` — מי שלקח ב-2017 הפסקה (`P06.3`, `2017-distance`) ולא
 * חזר ממנה ב-`K03`. *"אני צריך עשור אחר"* הוא המשפט של K01; X01 היא השאלה מה נכנס
 * למזוודה כשהעשור האחר הוא מקום אחר. זו ההכרעה שהוצעה למאור כ-A: לפי מה שהחיים כבר בחרו.
 * *"לבחור מעבר בתוכנית מוסכמת, לא לקבל מדינה כבונוס"* — ולכן X01 היא שיחה עם קובי ורחל,
 * ואחת משלוש התשובות היא להישאר.
 *
 * **ולמה שלוש מהן חיכו.** X02 (*"דירה בחו״ל"*), X03 (*"מקום העבודה / מפגש חברים בחו״ל"*)
 * ו-X05 (*"הדירה בחו״ל, לקראת 2026"*) קורות **שם**, ועד 21.9.2026 לא היה למשחק חדר אחד
 * שאינו תל אביב: להעמיד אותן באלנבי היה לשקר על איפה הוא גר. `flatAway` הגיע, והן בחדר
 * `flat-abroad` — שני פרקים:
 *
 *   · **`2023-abroad`** (X02, X03, ו-Q05 למי שהוא גם עיתונאי וגם בינלאומי) — ערב הדרבי של
 *     סדרת הגמר, 11.6.2023, בדירה שם. קובי מתקשר (*"אצלכם כבר התחיל?"*), אלכס בא, ולמי שזה
 *     שייך — רומא עם חבר. לפני השיחה עם קובי **רואים אם יש הבטחה** (התסריט: *"לפני הבחירה
 *     רואים אם יש הבטחה קיימת"*): הודעה ממנו על השולחן, והתשובה שלך היא ההבטחה או לא.
 *   · **`2025-abroad`** (X05) — *"הפעם אני מחכה לך"*: ההזמנה להיפגש באירופה, שהיא מה
 *     ש-`F01` פותח כ-`reunion` — רק למי שבאמת גר במקום השני (`life:abroad`).
 *
 * ובתל אביב, כמו קודם: הבית של קובי ורחל בערב שלפני (X01), והקיוסק ביומיים של ביקור (X04).
 */

export const PORTRAIT_ABROAD: Record<string, string> = {
  ...PORTRAIT_WINDOWS,
}

export const ABROAD = 'life:abroad'

// =================================================================== X01 · 2021 ====

export function objectiveSuitcase(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone || state.flags['x:suitcase']) return null
  return sceneId === 'home' ? null : 'אצל אבא ואמא. מה נכנס למזוודה.'
}

export const ENDINGS_SUITCASE: Record<string, EndingCard> = {
  move: {
    id: 'move',
    titleHe: 'נשאר עם כתובת',
    bodyHe:
      'לקחת מזכרת שכבר הייתה לך וסגרת תוכנית מעבר. רחל שאלה מה עם מה שלא לקחת, ואמרת שזה נשאר עם כתובת ולא נזרק — וקובי לא שאל על הצעיף עוד פעם, כי ראה אותו במזוודה.',
    memoryHe: 'הצעיף, מקופל בין חולצות.',
    memoryItem: 'scarf',
  },
  prepare: {
    id: 'prepare',
    titleHe: 'גם כשאסע לא נפרדים ככה',
    bodyHe:
      'ביקשת עוד תקופת הכנה, כדי לחסוך ולא לנסוע בחוב. קובי אמר שאז עוד לא נפרדים, ואמרת שגם כשתיסע לא תיפרדו ככה.',
    memoryHe: 'דף חיסכון, עם תאריך בעיפרון.',
    memoryItem: 'folded-paper',
  },
  stay: {
    id: 'stay',
    titleHe: 'כרגע',
    bodyHe:
      'החלטת להישאר. רחל שאלה אם זו ההחלטה שלך, ואמרת שכן — כרגע. והיא אמרה שזה מספיק, ובאמת היה.',
    memoryHe: 'מזוודה ריקה, בחזרה על הארון.',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_SUITCASE: Beat[] = [
  { id: 'x-suitcase', at: 'home', trigger: 'enter', when: { none: [{ flag: 'x:suitcase' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'x-suitcase' }] },
]

// =================================================================== X04 · 2023 ====

export function objectiveVisit(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone || state.flags['x:visit']) return null
  return sceneId === 'kiosk' ? null : 'יומיים בארץ. בקיוסק כבר מחכים.'
}

export const ENDINGS_VISIT: Record<string, EndingCard> = {
  family: {
    id: 'family',
    titleHe: 'בלי להבטיח משחק לפני הטיסה',
    bodyHe:
      'בחרת ערב משפחה והודעת לחברים מראש. אופיר הציע קפה מחר אם מתאים, ואמרת כן — בלי להבטיח משחק לפני הטיסה. יומיים הם יומיים, והפעם הם הספיקו.',
    memoryHe: 'כרטיס טיסה, עם קפה על השוליים.',
    memoryItem: 'ticket-stub',
  },
  friends: {
    id: 'friends',
    titleHe: 'מחר אני אצלכם',
    bodyHe:
      'בחרת ערב חברים ותיאמת עם המשפחה. רחל שאלה על ארוחת בוקר מחר, ואמרת שמחר אתה אצלם — והיא אמרה שתיהנה הערב, והתכוונה.',
    memoryHe: 'שולחן בקיוסק, ארבעה כיסאות.',
    memoryItem: 'folded-paper',
  },
  overbooked: {
    id: 'overbooked',
    titleHe: 'זאת בדיוק הבעיה',
    bodyHe:
      'הבטחת שני ערבים חופפים. קרן אמרה שרשמת את אותה שעה פעמיים, ואמרת שתספיק — והיא אמרה שזאת בדיוק הבעיה. היא צדקה, ואחד מהם חיכה.',
    memoryHe: 'יומן עם אותה שעה, פעמיים.',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_VISIT: Beat[] = [
  { id: 'x-visit', at: 'kiosk', trigger: 'enter', when: { none: [{ flag: 'x:visit' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'x-visit' }] },
]

// ========================================================== X02–X03, Q05 · 2023 ====

/** קובי ביקש, והתשובה שלך היא ההבטחה — הדגל ש-X02.1 ו-X02.3 קוראים (`promise.kobi_call_pending`) */
export const KOBI_CALL = 'promise:kobiCall'
const FOUNDING_JOURNALIST = { flag: 'own:route:JOURNALIST:entry' } as const
const INTERNATIONAL = { flag: 'life:international' } as const

export function objectiveAbroad(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (sceneId !== 'flat-abroad') return 'הדירה שם. הערב הזה בבית.'
  if (!state.flags['x:phone']) return 'הטלפון על השולחן. הודעה מאבא.'
  if (!state.flags['x:call']) return 'אצלם כבר התחיל.'
  if (!state.flags['x:alex']) return 'מישהו דופק בדלת.'
  return null
}

export const ENDINGS_ABROAD: Record<string, EndingCard> = {
  host: {
    id: 'host',
    titleHe: 'הפעם אני יודע להגיד מה',
    bodyHe:
      'אירחת ערב קטן, והזמנת רק את מי שיכולת לארח. אלכס שאל אם להביא משהו ואמרת כן — והפעם ידעת להגיד מה. זו הייתה התמונה הראשונה בדירה הזאת שמישהו אחר צילם.',
    memoryHe: 'תמונה ראשונה בדירה שם, ארבעה ספלים על השולחן.',
    memoryItem: 'folded-paper',
  },
  work: {
    id: 'work',
    titleHe: 'ניהלתי את החלק הזה',
    bodyHe:
      'השלמת פרויקט בעבודה והצגת אותו לצוות. אלכס ביקש שתגיד מה עשית בלי "רק עזרתי", ואמרת שניהלת את החלק הזה — וזה היה נכון, ובשפה שעוד לא שלך.',
    memoryHe: 'תג עובד, עם שם שכתבו קצת לא נכון.',
    memoryItem: 'folded-paper',
  },
  mine: {
    id: 'mine',
    titleHe: 'גם זה נקרא לגור פה',
    bodyHe:
      'בחרת משהו שהוא רק שלך, בלי עבודה נוספת. אלכס אמר שגם זה נקרא לגור פה, ואמרת שאתה עוד מתרגל — והוא אמר שכולם, רק שאתה אומר את זה בקול.',
    memoryHe: 'מפתח שני, על אותו צרור.',
    memoryItem: 'house-key',
  },
}

export const BEATS_ABROAD: Beat[] = [
  /** קודם ההודעה — כך ש-X02 יודע אם יש הבטחה, והשחקן יודע שהוא יודע */
  { id: 'x-phone', at: 'flat-abroad', trigger: 'enter', when: { none: [{ flag: 'x:phone' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'x-phone' }] },
  { id: 'x-call', at: 'flat-abroad', trigger: 'clock', when: { all: [{ flag: 'x:phone' }], none: [{ flag: 'x:call' }] }, delayMs: 1600, do: [{ a: 'talk', conversation: 'x-call' }] },
  /** X03 — אלכס נכנס מהדלת (`world/rooms2000.ts` מעמיד אותו שם מרגע `x:call`) */
  { id: 'x-alex', at: 'flat-abroad', trigger: 'clock', when: { all: [{ flag: 'x:call' }], none: [{ flag: 'x:alex' }] }, delayMs: 1400, do: [{ a: 'talk', conversation: 'x-alex' }] },
  /** Q05 — רק לחיים שהם גם עיתונאי וגם בינלאומי: רומא מביא חבר, והחבר הוא לא כתבה */
  {
    id: 'q-soup',
    at: 'flat-abroad',
    trigger: 'clock',
    when: { all: [{ flag: 'x:alex' }, FOUNDING_JOURNALIST, INTERNATIONAL], none: [{ flag: 'q:soup' }] },
    delayMs: 1400,
    do: [{ a: 'talk', conversation: 'q-soup' }],
  },
  {
    id: 'x-close',
    trigger: 'clock',
    when: { all: [{ flag: 'x:alex' }], none: [{ flag: 'x:done' }], any: [{ flag: 'q:soup' }, { notFlag: 'own:route:JOURNALIST:entry' }, { notFlag: 'life:international' }] },
    delayMs: 1200,
    do: [{ a: 'flag', flag: 'x:done' }, { a: 'talk', conversation: 'x-close' }],
  },
]

// ================================================================== X05 · 2025 ====

export function objectiveReunion(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone || state.flags['x:reunion']) return null
  return sceneId === 'flat-abroad' ? 'הפעם אתה מתקשר אליו.' : 'הדירה שם.'
}

export const ENDINGS_REUNION: Record<string, EndingCard> = {
  invite: {
    id: 'invite',
    titleHe: 'הפעם לא תצטרך לחפש ביציע',
    bodyHe:
      'הזמנת אותו להיפגש באירופה, משני מקומות. הוא שאל אם אתה מחכה לו, ואמרת שבנקודה שתסכמו — והפעם הוא לא יצטרך לחפש אותך ביציע, כמו שאתה חיפשת אותו פעם.',
    memoryHe: 'צילום מסך של שיחת וידאו, שני חלונות.',
    memoryItem: 'folded-paper',
  },
  repair: {
    id: 'repair',
    titleHe: 'בגלל זה התקשרתי עכשיו',
    bodyHe:
      'קודם השיחה שלא עשיתם, ורק אחר כך הכרטיס. הוא אמר שכרטיס לא פותר אותה, ואמרת שאתה יודע — ובגלל זה התקשרת עכשיו ולא אחרי שקנית.',
    memoryHe: 'פתק עם שעה, ובלי מחיר.',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_REUNION: Beat[] = [
  { id: 'x-reunion', at: 'flat-abroad', trigger: 'enter', when: { none: [{ flag: 'x:reunion' }] }, delayMs: 900, do: [{ a: 'talk', conversation: 'x-reunion' }] },
]

// ==================================================================== the words ====

export const CONVERSATIONS_ABROAD: Conversation[] = [
  {
    id: 'x-suitcase',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'קובי', text: 'את הצעיף אתה לוקח?' },
          { who: 'פוגי', text: 'אבא, אוגוסט.' },
          { who: 'קובי', text: 'לא שאלתי על מזג האוויר.' },
          { who: 'רחל', text: 'שאלת כבר אם הוא לקח מטען?' },
          { who: 'קובי', text: 'בשביל זה את פה.' },
        ],
        choices: [
          {
            id: 'move',
            text: '(לקחת מזכרת שכבר יש — ולסגור תוכנית מעבר.)',
            then: [
              { e: 'flag', flag: 'x:suitcase' },
              { e: 'flag', flag: ABROAD },
              { e: 'flagValue', flag: 'life:abroad:plan', value: 'planning' },
              { e: 'wellbeing', key: 'stress', delta: 10 },
              { e: 'proof', kind: 'residence_plan', proofId: 'residence_plan:{chapter}:move', subjectHe: 'המעבר', noteHe: 'תוכנית מוסכמת עם עיר, מועד ותקציב — לא מדינה כבונוס.' },
              { e: 'toast', text: 'רחל: "ומה שלא לקחת?" — "נשאר עם כתובת. לא נזרק."', tone: 'plain' },
              { e: 'ending', id: 'move' },
            ],
          },
          {
            id: 'prepare',
            text: '(לבקש עוד תקופת הכנה — ולחסוך.)',
            then: [
              { e: 'flag', flag: 'x:suitcase' },
              { e: 'flagValue', flag: 'life:abroad:plan', value: 'preparation' },
              { e: 'proof', kind: 'prepared_instead_of_debt', proofId: 'prepared_instead_of_debt:{chapter}:move', subjectHe: 'המעבר שנדחה', noteHe: 'חסך קודם, במקום לנסוע בחוב.' },
              { e: 'toast', text: 'קובי: "אז עוד לא נפרדים." — "גם כשאסע לא נפרדים ככה."', tone: 'plain' },
              { e: 'ending', id: 'prepare' },
            ],
          },
          {
            id: 'stay',
            text: '(להחליט, כרגע, להישאר.)',
            then: [
              { e: 'flag', flag: 'x:suitcase' },
              { e: 'flagValue', flag: 'life:abroad:plan', value: 'not_now' },
              { e: 'toast', text: 'רחל: "זו ההחלטה שלך?" — "כן. כרגע." — "אז זה מספיק."', tone: 'plain' },
              { e: 'ending', id: 'stay' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'x-visit',
    nameHe: 'עמית',
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'שלחת ״מי באזור״ לשבע קבוצות.' },
          { who: 'פוגי', text: 'אני פה רק יומיים.' },
          { who: 'אופיר', text: 'אז למה חילקת הבטחות לשבוע?' },
          { who: 'פוגי', text: 'אני מנסה להספיק.' },
          { who: 'קרן', text: 'תנסה להיות איפה שאתה נמצא.' },
        ],
        choices: [
          {
            id: 'family',
            text: '(לבחור ערב משפחה — ולהודיע לחברים מראש.)',
            then: [
              { e: 'flag', flag: 'x:visit' },
              { e: 'flagValue', flag: 'life:abroad:visit', value: 'family' },
              { e: 'time', minutes: 90 },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'אופיר: "אז ניפגש לקפה מחר, אם מתאים." — "כן. בלי להבטיח משחק לפני הטיסה."', tone: 'plain' },
              { e: 'ending', id: 'family' },
            ],
          },
          {
            id: 'friends',
            text: '(לבחור ערב חברים — ולתאם עם המשפחה.)',
            then: [
              { e: 'flag', flag: 'x:visit' },
              { e: 'flagValue', flag: 'life:abroad:visit', value: 'friends' },
              { e: 'time', minutes: 90 },
              { e: 'rel', who: 'ofir', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'רחל: "מחר ארוחת בוקר?" — "מחר אני אצלכם." — "אז תהנה הערב."', tone: 'plain' },
              { e: 'ending', id: 'friends' },
            ],
          },
          {
            id: 'both',
            text: '(להבטיח שני ערבים חופפים.)',
            then: [
              { e: 'flag', flag: 'x:visit' },
              { e: 'flagValue', flag: 'life:abroad:visit', value: 'overbooked' },
              { e: 'wellbeing', key: 'stress', delta: 10 },
              { e: 'rel', who: 'keren', axis: 'trust', delta: -2 },
              { e: 'toast', text: 'קרן: "רשמת את אותה שעה פעמיים." — "אני אספיק." — "זאת בדיוק הבעיה."', tone: 'red' },
              { e: 'ending', id: 'overbooked' },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ X02 · 2023 ----
  {
    id: 'x-phone',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הטלפון על השולחן הנמוך. הודעה מאבא: "השבת יש דרבי. מדברים בשמונה, שלך?"' },
          { who: null, text: 'שמונה אצלו היא שעה אחרת אצלך. גם זה עוד לא נכנס לך לגוף.' },
        ],
        choices: [
          {
            id: 'yes',
            text: '(לכתוב לו: "כן. בשמונה שלך.")',
            then: [
              { e: 'flag', flag: 'x:phone' },
              { e: 'flag', flag: KOBI_CALL },
              { e: 'toast', text: 'אבא: "סגור." — ואחרי דקה, בהודעה נפרדת: "טוב."', tone: 'plain' },
            ],
          },
          {
            id: 'maybe',
            text: '(לכתוב: "נראה איך יהיה פה בערב.")',
            then: [
              { e: 'flag', flag: 'x:phone' },
              { e: 'toast', text: 'אבא: "בסדר. תגיד."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'x-call',
    nameHe: 'קובי',
    // שיחת וידאו מתל אביב — הוא לא בחדר, והתיבה אומרת את זה (`Conversation.remote`)
    remote: { 'קובי': 'video' },
    branches: [
      {
        lines: [
          { who: 'קובי', text: 'אצלכם כבר התחיל?' },
          { who: 'פוגי', text: 'פה עוד עובדים.' },
          { who: 'קובי', text: 'התכוונתי למשחק.' },
          { who: 'פוגי', text: 'אני יודע. אני מנסה להסביר למה אני בחולצה הזאת.' },
          { who: 'קובי', text: 'לפחות היא מגוהצת.' },
        ],
        choices: [
          {
            // X02.1
            id: 'keep',
            text: '(לקיים את השיחה שהבטחתי.)',
            when: { flag: KOBI_CALL },
            hidden: true,
            then: [
              { e: 'flag', flag: 'x:call' },
              { e: 'flagValue', flag: 'life:abroad:call', value: 'kept' },
              { e: 'time', minutes: 30 },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 2 },
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 5 },
              { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:kobi', subjectHe: 'השיחה עם אבא', noteHe: 'הבטיח שמונה, ובשמונה ענה.' },
              { e: 'toast', text: 'קובי: "לא צריך לראות את כל המשחק." — "הבטחתי לדבר איתך. לזה אני פה."', tone: 'plain' },
            ],
          },
          {
            // X02.2
            id: 'move',
            text: '(לבקש להזיז את השיחה — בהסכמה.)',
            then: [
              { e: 'flag', flag: 'x:call' },
              { e: 'flagValue', flag: 'life:abroad:call', value: 'renegotiated' },
              { e: 'toast', text: 'קובי: "מחר אני פנוי." — "אז מחר. היום אני נפגש עם אנשים פה."', tone: 'plain' },
            ],
          },
          {
            // X02.3
            id: 'go',
            text: '(לא להודיע, וללכת.)',
            when: { flag: KOBI_CALL },
            hidden: true,
            then: [
              { e: 'flag', flag: 'x:call' },
              { e: 'flagValue', flag: 'life:abroad:call', value: 'broken' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: -4 },
              { e: 'rel', who: 'kobi', axis: 'trust', delta: -8 },
              { e: 'toast', text: 'קובי, אחר כך: "חיכיתי. הייתי יכול לקבוע משהו אחר." — "הייתי צריך להודיע."', tone: 'red' },
            ],
          },
          {
            // X02.4 — *"אם לא הבטחתי שיחה, לבחור במפגש המקומי"*
            id: 'local',
            text: '(לא הבטחתי שיחה. לבחור במפגש שפה.)',
            when: { notFlag: KOBI_CALL },
            hidden: true,
            then: [
              { e: 'flag', flag: 'x:call' },
              { e: 'flagValue', flag: 'life:abroad:call', value: 'local_life' },
              { e: 'toast', text: 'קובי: "תיהנה. תספר מי פגשת." — "מחר, עם קפה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ X03 · 2023 ----
  {
    id: 'x-alex',
    nameHe: 'אלכס',
    branches: [
      {
        lines: [
          { who: 'אלכס', text: 'אתה תמיד אומר ״אצלנו״.' },
          { who: 'פוגי', text: 'הרגל.' },
          { who: 'אלכס', text: 'גם פה יש לך מפתח.' },
          { who: 'פוגי', text: 'נכון.' },
          { who: 'אלכס', text: 'אז בשישי אצלך?' },
        ],
        choices: [
          {
            // X03.1
            id: 'host',
            text: '(לארח ערב קטן — ולהזמין רק את מי שאוכל לארח.)',
            when: { minAgorot: 6000 },
            noteHe: 'גם ערב קטן עולה משהו, ואין בארנק.',
            then: [
              { e: 'flag', flag: 'x:alex' },
              { e: 'flagValue', flag: 'life:abroad:belonging', value: 'hosted' },
              { e: 'money', agorot: -6000, why: 'ערב קטן בדירה שם' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -5 },
              { e: 'rel', who: 'alex', axis: 'bond', delta: 3 },
              { e: 'proof', kind: 'local_delivery', proofId: 'local_delivery:{chapter}:host', subjectHe: 'הערב הראשון בדירה', noteHe: 'אירח רק כמה שיכול לארח.' },
              { e: 'toast', text: 'אלכס: "להביא משהו?" — "כן. הפעם אני יודע להגיד מה."', tone: 'plain' },
            ],
          },
          {
            // X03.2
            id: 'work',
            text: '(להשלים פרויקט בעבודה — ולהציג אותו לצוות.)',
            then: [
              { e: 'flag', flag: 'x:alex' },
              { e: 'flagValue', flag: 'life:abroad:belonging', value: 'work' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -10 },
              { e: 'skill', skill: 'business', delta: 3, why: 'פרויקט שהוצג, לא "רק עזרתי"' },
              { e: 'proof', kind: 'local_delivery', proofId: 'local_delivery:{chapter}:work', subjectHe: 'הפרויקט שהוצג לצוות', noteHe: 'אמר מה עשה, בלי "רק עזרתי".' },
              { e: 'toast', text: 'אלכס: "עכשיו תגיד מה עשית. בלי ״רק עזרתי״." — "ניהלתי את החלק הזה."', tone: 'plain' },
            ],
          },
          {
            // X03.3
            id: 'mine',
            text: '(לבחור משהו שהוא רק שלי — בלי עבודה נוספת.)',
            then: [
              { e: 'flag', flag: 'x:alex' },
              { e: 'flagValue', flag: 'life:abroad:belonging', value: 'chosen_activity' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'proof', kind: 'personal_project', proofId: 'personal_project:{chapter}:abroad', subjectHe: 'משהו שהוא רק שלו, שם', noteHe: 'לא עבודה ולא אירוח — רק לגור.' },
              { e: 'toast', text: 'אלכס: "גם זה נקרא לגור פה." — "אני עוד מתרגל."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ Q05 · 2023 ----
  {
    id: 'q-soup',
    nameHe: 'רומא',
    branches: [
      {
        lines: [
          { who: 'רומא', text: 'הוא בא כחבר שלי, לא ככתבה שלך.' },
          { who: 'פוגי', text: 'ואם אשאל?' },
          { who: 'רומא', text: 'אז הוא יכול להגיד לא.' },
          { who: 'פוגי', text: 'ואתה?' },
          { who: 'רומא', text: 'אני יכול להגיד לך שהמרק נשרף.' },
        ],
        choices: [
          {
            // Q05.1
            id: 'host',
            text: '(לארח — בלי להפוך את השיחה לכתבה.)',
            then: [
              { e: 'flag', flag: 'q:soup' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -5 },
              { e: 'rel', who: 'roma', axis: 'bond', delta: 2 },
              { e: 'rel', who: 'roma', axis: 'trust', delta: 3 },
              { e: 'proof', kind: 'private_hospitality', proofId: 'private_hospitality:{chapter}:roma', subjectHe: 'האורח של רומא', noteHe: 'אירח, ולא שאל שאלה אחת לכתבה.' },
              { e: 'toast', text: 'רומא: "טוב. עכשיו אפשר לדבר בלי כותרת." — "את המרק בכל זאת הייתי מתקן."', tone: 'plain' },
            ],
          },
          {
            // Q05.2 — *"schedule.later_window_available"*: מחר פנוי תמיד, כי הערב הוא הערב
            id: 'later',
            text: '(לקבוע שיחה נפרדת, בהסכמה — ולבדוק מקור נוסף.)',
            then: [
              { e: 'flag', flag: 'q:soup' },
              { e: 'flagValue', flag: 'life:journalism:separateInterview', value: 'requested' },
              { e: 'toast', text: 'רומא: "מחר. היום הוא אורח." — "מחר אשאל אותו, לא אותך."', tone: 'plain' },
            ],
          },
          {
            // Q05.3 — *"delegation.named_person_consents"*: רומא עצמו מסכים, בשורה שלו
            id: 'hand',
            text: '(הערב שייך לבית — לקשר אותו למארח אחר, בהסכמה.)',
            then: [
              { e: 'flag', flag: 'q:soup' },
              { e: 'time', minutes: 15 },
              { e: 'proof', kind: 'consenting_handover', proofId: 'consenting_handover:{chapter}:roma', subjectHe: 'המארח האחר', noteHe: 'רומא סגר איתו בעצמו.' },
              { e: 'toast', text: 'רומא: "סגרתי איתו. לך הביתה." — "אני כבר בבית. זו בדיוק הבעיה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'x-close',
    nameHe: null,
    branches: [
      { when: { flagIs: { flag: 'life:abroad:belonging', value: 'hosted' } }, lines: [{ who: null, text: 'ארבעה ספלים בכיור. בפעם הראשונה, מישהו אחר שטף.' }], then: [{ e: 'ending', id: 'host' }] },
      { when: { flagIs: { flag: 'life:abroad:belonging', value: 'work' } }, lines: [{ who: null, text: 'המצגת עוד פתוחה על המחשב. השם שלך בשקף הראשון, מאוית קצת לא נכון.' }], then: [{ e: 'ending', id: 'work' }] },
      { lines: [{ who: null, text: 'הערב נגמר בשקט. בעיר הזאת, זה כבר לא מרגיש כמו לבד.' }], then: [{ e: 'ending', id: 'mine' }] },
    ],
  },

  // ------------------------------------------------------------ X05 · 2025 ----
  {
    id: 'x-reunion',
    nameHe: 'קובי',
    remote: { 'קובי': 'video' },
    branches: [
      {
        lines: [
          { who: 'פוגי', text: 'אבא, בוא ניפגש למשחק.' },
          { who: 'קובי', text: 'אתה מגיע לארץ?' },
          { who: 'פוגי', text: 'הפעם אתה ואני נפגשים באירופה.' },
          { who: 'קובי', text: 'לזכר הימים?' },
          { who: 'פוגי', text: 'וגם בשביל יום חדש אחד.' },
        ],
        choices: [
          {
            // X05.1
            id: 'invite',
            text: '(להזמין אותו — ולתכנן יחד.)',
            then: [
              { e: 'flag', flag: 'x:reunion' },
              { e: 'flag', flag: 'life:finale:reunionOffered' },
              { e: 'proof', kind: 'finale_invited', proofId: 'finale_invited:{chapter}:kobi', subjectHe: 'ההזמנה לאירופה', noteHe: 'הזמין, ואמר איפה יחכה.' },
              { e: 'toast', text: 'קובי: "אתה מחכה לי?" — "בנקודה שנסכם. הפעם לא תצטרך לחפש ביציע."', tone: 'plain' },
              { e: 'ending', id: 'invite' },
            ],
          },
          {
            // X05.2
            id: 'repair',
            text: '(קודם שיחת תיקון — ורק אחר כך כרטיס.)',
            then: [
              { e: 'flag', flag: 'x:reunion' },
              { e: 'flag', flag: 'life:finale:reunionOffered' },
              { e: 'flag', flag: 'life:finale:repair' },
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 3 },
              { e: 'toast', text: 'קובי: "כרטיס לא פותר את השיחה שלא עשינו." — "אני יודע. בגלל זה התקשרתי עכשיו."', tone: 'plain' },
              { e: 'ending', id: 'repair' },
            ],
          },
        ],
      },
    ],
  },
]
