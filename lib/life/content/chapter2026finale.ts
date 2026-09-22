import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_LATE } from './chapter2023late'

/**
 * F00–F04 · "היום אתה אחריי" · 2025–2026 — **סוף הציר הראשי**, בשני פרקים.
 *
 * **`2026-plan`** (F00–F01) — תקציב שנסגר לפני שמבטיחים, ותוכנית שמראים.
 * **`2026-finale`** (F02–F04) — הנסיעה, האולם, ועם מי חוזרים.
 *
 * **הערב עצמו הוא שורת ארכיון, והיא נקראה היום.** 7.5.2026, בוטבגרד: הפועל תל אביב
 * 81, ריאל מדריד 87, המשחק הרביעי ברבע הגמר של היורוליג. שני מקורות בלתי-תלויים
 * מסכימים על היום, על התוצאה ועל האולם, והשני מהם נוקב גם בסדרה (כלל 77). התסריט
 * מסמן את הרשומה `immutable`, ובצדק: **התוצאה אינה תנאי לסיום האישי, ואין סצנת
 * אליפות חלופית.**
 *
 * **הילד מופיע רק אם הוא קיים — ועכשיו יש דרך שהוא יהיה.**
 *
 * ארבע הבחירות שבהן הילד מצטרף (`F00.3`, `F01.2`, `F02.2`, `F04.2`) והסיום השלישי
 * `generations` הוסרו כאן פעם אחת, כי `life:deadends` מצא ששום דבר במשחק לא מרים
 * את `life:child`. ענף חיי הבית (`2013-household`) נבנה בדיוק בשביל זה, והדגל
 * מורם בו במקום אחד בלבד — מעבר הזמן אחרי שהכוונה נאמרה על ידי שניהם. אז הבחירות
 * חזרו.
 *
 * הן `hidden` ולא מושבתות-עם-הערה, וזה ההפך המדויק מהכלל הרגיל (כלל 42: דלת סגורה
 * שרואים אותה היא מידע): כאן הודעה מושבתת הייתה **מספרת לשחקן על ילד שאין לו**.
 *
 * **הדרך, חדר אחרי חדר (21.9.2026).** עד שהציורים הגיעו לא היה נמל באירופה, לא
 * דרך לבוטבגרד ולא אולם, והנסיעה הייתה כרטיס וזמן על הרציף. עכשיו יש: הרציף (Q10),
 * האוטובוס לשדה התעופה, נמל ההגעה (F02 — *"נמל הגעה באירופה והדרך לבוטבגרד"*), מחוץ
 * לאולם (F03), המושבים (F03, *"ובמושבים"*), ושוב בחוץ (F04). כל שיחה נפתחת בחדר שהתסריט
 * כותב לה, וקובי עומד בכל אחד מהם (`world/rooms2000.ts`). התוצאה של הערב היא שורת
 * הארכיון (`{anchor}`), ולא שורה שנכתבה כאן.
 */

/**
 * מי נוסע — **הדגל שעובר לפרק הבא** (21.9.2026). `f:party` הוא דגל יום, ו-`year.entered`
 * של `2026-finale` מוחק אותו, כך שהפרק של הנסיעה לא ידע מי נסע: "לתת לילד להוביל קטע
 * קצר" (F02.2) ו"שלושה דורות" (F04.2) נפתחו לכל מי **שיש לו** ילד, גם אם הילד נשאר
 * בבית ותוכננה נסיעה לשניים. התסריט כותב `flag.finale_party == three` — וזה מה שנבדק עכשיו.
 */
export const PARTY = 'life:finale:party'
const party = (value: string) => ({ flagIs: { flag: PARTY, value } }) as const
const abroad = { flag: 'life:abroad' } as const

export const PORTRAIT_FINALE: Record<string, string> = {
  ...PORTRAIT_LATE,
}

/** שלושת המחירים שהתסריט נוקב בהם — מחיר הוא עובדה על העולם, לא שכר (כלל 78) */
const SHARE_AGOROT = 120_000
const TWO_AGOROT = 360_000
const THREE_AGOROT = 480_000

// ------------------------------------------------------------------- Part I ------

export function objectivePlan(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['f:money']) return sceneId === 'kiosk' ? null : 'בקיוסק. יש תוכנית, ועכשיו שואלים מי משלם.'
  if (!state.flags['f:plan']) return sceneId === 'home' ? null : 'אבא ביקש לראות את התוכנית.'
  return null
}

export const ENDINGS_PLAN: Record<string, EndingCard> = {
  two: {
    id: 'two',
    titleHe: 'שנוכל ללכת בקצב שלנו',
    bodyHe:
      'נסיעה של שניים, בתקציב שסגרתם. הוא אמר שלא צריך הכי יקר ואמרת שצריך שנוכל ללכת בקצב שלנו, והוא אמר "את זה דווקא תכתוב" — וכתבת.',
    memoryHe: 'דף תוכנית, עם שורה על קצב.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  reunion: {
    id: 'reunion',
    titleHe: 'בנקודה שנקבע',
    bodyHe:
      'אתם באים משני מקומות ונפגשים שם. הוא שאל איפה אתה מחכה לו ואמרת בנקודה שנקבע, עם תמונה שלה — כי שם של רחוב הוא ישכח, וזה הוא שאמר.',
    memoryHe: 'תמונה של פינה, בלי אנשים.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  saving: {
    id: 'saving',
    titleHe: 'בוחרים להן ימים',
    bodyHe:
      'לא אישרת נסיעה לפני שהיה ממה. עמית פרס את זה לשש מסירות עבודה ואמר שבוחרים להן ימים ולא מגרילים כסף, ואמרת שבסוף בודקים שהכול באמת פנוי.',
    memoryHe: 'שש שורות, אחת מסומנת.',
    memoryItem: 'folded-paper',
    presence: 'late',
  },
}

export const BEATS_PLAN: Beat[] = [
  { id: 'f-money', at: 'kiosk', trigger: 'enter', when: { none: [{ flag: 'f:money' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'f-money' }] },
  { id: 'f-plan', at: 'home', trigger: 'enter', when: { all: [{ flag: 'f:money' }], none: [{ flag: 'f:plan' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'f-plan' }] },
]

// ------------------------------------------------------------------ Part II ------

export function objectiveFinale(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['f:road']) return sceneId === 'port-europe' ? null : sceneId === 'bus-station' ? 'האוטובוס לשדה התעופה.' : 'הרציף. היום יוצאים.'
  if (!state.flags['f:seats']) return sceneId === 'arena-out' ? null : 'האוטובוס לבוטבגרד. מחוץ לאולם — היום אתה אחריי.'
  if (!state.flags['f:inside']) return sceneId === 'arena-seats' ? null : 'פנימה, למושבים.'
  if (!state.flags['f:back']) return sceneId === 'arena-out' ? null : 'ואחר כך — בחוץ. עם מי חוזרים.'
  return null
}

export const ENDINGS_FINALE: Record<string, EndingCard> = {
  together: {
    id: 'together',
    titleHe: 'היום רציתי להיות לידך מהצד הזה',
    bodyHe:
      'ארבעים שנה אחרי שהוא לקח אותך לראשון, לקחת אותו. הוא שאל "והיום?" ואמרת שהיום רצית להיות לידו מהצד הזה — והוא לא ענה, וזאת הייתה התשובה.',
    memoryHe: 'שני כרטיסים, באותו כיס.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  generations: {
    id: 'generations',
    titleHe: 'אתה שומע איך הוא אומר ״בואו״',
    bodyHe:
      'שלושה דורות, והדרך חזרה נבחרה בידי הצעיר שבהם. קובי שאל אם אתה שומע איך הוא אומר "בואו", ואמרת כן — ולא היה צריך להוסיף.',
    memoryHe: 'שלוש כוסות, אחת קטנה.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  mine: {
    id: 'mine',
    titleHe: 'מחר אני חוזר לחיים שלי',
    bodyHe:
      'נהנית, ולא הבטחת להיות מי שהיית. הוא שאל אם נהנית ואמרת מאוד, ושמחר אתה חוזר לחיים שלך — והוא אמר טוב, תתקשר גם משם.',
    memoryHe: 'כרטיס טיסה, עם שעה מוקדמת.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
}

export const BEATS_FINALE: Beat[] = [
  /**
   * `Q10` — *"חלון לפני F02"*: איך קובי יציג אותו שם. רק למי שנוסע איתו (`PARTY` שאינו
   * `saving`) — ולכן F02 מחכה לה כשהיא עוד לא נאמרה, ולא מחכה לה כשאין לה מקום.
   */
  { id: 'f-name', at: 'bus-station', trigger: 'enter', when: { any: [party('two'), party('three'), party('reunion')], none: [{ flag: 'f:name' }] }, delayMs: 800, do: [{ a: 'talk', conversation: 'f-name' }] },
  /**
   * F02 — נמל ההגעה. הרציף נשאר של Q10; *"יש לי את הכרטיסים"* נאמר אחרי הטיסה, מול
   * דלתות הזכוכית שהאוטובוס לבוטבגרד עומד מאחוריהן. הכרטיס של הרגע אומר איפה ומתי.
   */
  {
    id: 'f-road',
    at: 'port-europe',
    trigger: 'enter',
    when: { none: [{ flag: 'f:road' }], any: [{ flag: 'f:name' }, party('saving'), { notFlag: PARTY }] },
    delayMs: 300,
    do: [{ a: 'card', titleHe: 'אירופה', subHe: 'נמל ההגעה · 7 במאי 2026', ms: 2600 }, { a: 'talk', conversation: 'f-road' }],
  },
  /** F03 — *"מחוץ לאולם"*: הוא נכנס רק אחרי שאמרת לאן הולכים */
  { id: 'f-seats', at: 'arena-out', trigger: 'enter', when: { all: [{ flag: 'f:road' }], none: [{ flag: 'f:seats' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'f-seats' }] },
  /**
   * *"ובמושבים"* — המשחק עצמו. שורה אחת, והיא שורת הארכיון (`{anchor}` — העוגן של
   * `2026-botevgrad`), לא תיאור שנכתב כאן: *"מציגים רק פתיחה, מקטע ותוצאה"*, ואין סצנת
   * אליפות חלופית. הקהל נשמע, קובי יושב לידך, ואז יוצאים.
   */
  {
    id: 'f-inside',
    at: 'arena-seats',
    trigger: 'enter',
    when: { all: [{ flag: 'f:seats' }], none: [{ flag: 'f:inside' }] },
    delayMs: 600,
    do: [
      { a: 'flag', flag: 'f:inside' },
      { a: 'crowd', state: 'BUILDING_TENSION' },
      { a: 'lines', lines: [{ who: null, text: '{anchor}.' }, { who: null, text: 'קובי לידך. הפעם אתה זה שידע איפה המושבים.' }] },
      { a: 'crowd', state: 'AFTERMATH' },
    ],
  },
  /** F04 — *"מחוץ לאולם, אחרי המשחק"* */
  { id: 'f-back', at: 'arena-out', trigger: 'enter', when: { all: [{ flag: 'f:seats' }, { flag: 'f:inside' }], none: [{ flag: 'f:back' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'f-back' }] },
]

// ---------------------------------------------------------------- the words ------

export const CONVERSATIONS_FINALE: Conversation[] = [
  {
    id: 'f-name',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'קובי', text: 'איך אני מציג אותך שם?' },
          { who: 'פוגי', text: 'תלוי את מי שואלים.' },
          { who: 'קובי', text: 'אני שואל אותך.' },
          { who: 'פוגי', text: 'הבן שלך זה בסדר.' },
          { who: 'קובי', text: 'יופי. את זה אני זוכר בלי שתשלח לי רשימה.' },
        ],
        choices: [
          {
            id: 'now',
            text: '(לספר לו באיזה תפקיד אני פעיל עכשיו.)',
            then: [
              { e: 'flag', flag: 'f:name' },
              { e: 'flagValue', flag: 'life:finale:introduction', value: 'current_roles' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'קובי: "אז כשצריכים אותך, יודעים איפה למצוא." — "היום אתה יודע."', tone: 'plain' },
            ],
          },
          {
            id: 'former',
            text: '(לספר על משהו שעזבתי — בלי למחוק אותו.)',
            then: [
              { e: 'flag', flag: 'f:name' },
              { e: 'flagValue', flag: 'life:finale:introduction', value: 'former_roles' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'קובי: "ואתה מתגעגע?" — "לפעמים. אבל אני לא רוצה לחזור לכל דבר." — "גם זו תשובה."', tone: 'plain' },
            ],
          },
          {
            id: 'family',
            text: '(להשאיר את התארים בבית — ולבדוק שיש לשנינו כרטיסים.)',
            then: [
              { e: 'flag', flag: 'f:name' },
              { e: 'flagValue', flag: 'life:finale:introduction', value: 'family' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'קובי: "שלי אצלך?" — "כן." — "מוזר." — "תתרגל קצת."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'f-money',
    nameHe: 'עמית',
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'יש תוכנית. עכשיו מה ממומן?' },
          { who: 'פוגי', text: 'חשבתי שאספיק לחסוך.' },
          { who: 'קובי', text: 'אפשר גם להתחלק. לא ביקשתי שתוכיח שאתה בנק.' },
          { who: 'פוגי', text: 'רציתי לקחת אותך.' },
          { who: 'קובי', text: 'אז תיקח אחריות. זה יותר מכרטיס.' },
        ],
        choices: [
          {
            id: 'share',
            text: '(לשלם את חלקי בנסיעה צנועה ומוסכמת.)',
            when: { minAgorot: SHARE_AGOROT },
            noteHe: 'גם חלק אחד עולה כסף. התוכנית הרביעית היא איך משיגים אותו.',
            then: [
              { e: 'flag', flag: 'f:money' },
              { e: 'money', agorot: -SHARE_AGOROT, why: 'החלק שלי בנסיעה' },
              { e: 'flag', flag: 'f:ready' },
              { e: 'flagValue', flag: 'f:funding', value: 'shared_confirmed' },
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 3 },
              { e: 'toast', text: 'קובי: "החלק שלי סגור. שלך?" — "עכשיו סגור."', tone: 'plain' },
            ],
          },
          {
            id: 'two',
            text: '(לממן את הנסיעה לשנינו, מכסף פנוי.)',
            when: { minAgorot: TWO_AGOROT },
            noteHe: 'אין בארנק מה שנסיעה לשניים עולה, ואין מה לנופף בחשבונית שאין.',
            then: [
              { e: 'flag', flag: 'f:money' },
              { e: 'money', agorot: -TWO_AGOROT, why: 'נסיעה לשניים' },
              { e: 'flag', flag: 'f:ready' },
              { e: 'flagValue', flag: 'f:funding', value: 'self_two' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'קובי: "תודה. עכשיו בלי לנופף בחשבונית." — "היא הולכת לעמית."', tone: 'plain' },
            ],
          },
          {
            id: 'three',
            text: '(לממן שלושה. הוא ביקש להצטרף.)',
            when: { all: [{ flag: 'life:child' }, { minAgorot: THREE_AGOROT }] },
            hidden: true,
            then: [
              { e: 'flag', flag: 'f:money' },
              { e: 'money', agorot: -THREE_AGOROT, why: 'נסיעה לשלושה' },
              { e: 'flag', flag: 'f:ready' },
              { e: 'flagValue', flag: 'f:funding', value: 'self_three' },
              { e: 'toast', text: 'הילד: "שמרת גם זמן לטיול?" — "הוא בתוך התוכנית."', tone: 'plain' },
            ],
          },
          {
            id: 'prepare',
            text: '(קודם תוכנית חיסכון ועבודה. אחר כך מאשרים.)',
            then: [
              { e: 'flag', flag: 'f:money' },
              { e: 'flagValue', flag: 'f:funding', value: 'preparation' },
              { e: 'time', minutes: 30 },
              { e: 'skill', skill: 'business', delta: 3, why: 'בוחרים ימים, לא מגרילים כסף' },
              { e: 'toast', text: 'עמית: "בוחרים להן ימים, לא מגרילים כסף." — "ובסוף בודקים שהכול באמת פנוי."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'f-plan',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'קובי', text: 'כמה כרטיסים?' },
          { who: 'פוגי', text: 'לנו. ואם מצטרף עוד מישהו, רק אחרי ששאלנו אותו.' },
          { who: 'קובי', text: 'טוב. לא מחליטים בשביל אנשים.' },
          { who: 'פוגי', text: 'למדתי.' },
          { who: 'קובי', text: 'אז עכשיו תראה לי את התוכנית.' },
        ],
        choices: [
          {
            id: 'two',
            text: '(נסיעה של אבא ושלי.)',
            when: { flag: 'f:ready' },
            noteHe: 'התקציב לא נסגר, ותוכנית בלי כיסוי היא הבטחה.',
            then: [
              { e: 'flag', flag: 'f:plan' },
              { e: 'flagValue', flag: 'f:party', value: 'two' },
              { e: 'flagValue', flag: PARTY, value: 'two' },
              { e: 'proof', kind: 'plan_confirmed', proofId: 'plan_confirmed:{chapter}:trip', subjectHe: 'הנסיעה עם אבא', noteHe: 'תוכנית כתובה, אחרי שהתקציב נסגר ולא לפני.' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'קובי: "לא צריך הכי יקר." — "צריך שנוכל ללכת בקצב שלנו." — "את זה דווקא תכתוב."', tone: 'plain' },
              { e: 'ending', id: 'two' },
            ],
          },
          {
            id: 'three',
            text: '(לשאול את הילד — ולקבל את הבחירה שלו.)',
            when: { all: [{ flag: 'life:child' }, { flag: 'f:ready' }] },
            hidden: true,
            then: [
              { e: 'flag', flag: 'f:plan' },
              { e: 'flagValue', flag: 'f:party', value: 'three' },
              { e: 'flagValue', flag: PARTY, value: 'three' },
              { e: 'proof', kind: 'plan_confirmed', proofId: 'plan_confirmed:{chapter}:trip', subjectHe: 'הנסיעה עם אבא', noteHe: 'נשאל לפני שנרשם, ובחר בעצמו.' },
              { e: 'toast', text: 'הילד: "אני רוצה לבוא. אפשר גם משהו שהוא לא משחק?" — "ברור." — קובי: "אני בעד אוכל."', tone: 'plain' },
              { e: 'ending', id: 'two' },
            ],
          },
          {
            id: 'reunion',
            text: '(להיפגש באירופה, משני מקומות.)',
            /**
             * *"משני מקומות"* — ורק מי שגר במקום השני (`life:abroad`, X01) יכול לבוא מהמקום
             * השני. עד 21.9.2026 המשפט הוצע לכל חיים, כולל מי שגר שלושה רחובות מקובי;
             * התסריט קושר אותו ל-X05 (*"מציע F01 עם reunion"*). לא אפור אלא **חסר**, כי
             * בחיים שלא עברו זה לא משפט שאפשר להגיד (`ChoiceDef.hidden`).
             */
            // X05 הציע את זה (`2025-abroad`); בלי ההזמנה, זה לא משפט שנאמר
            when: { all: [{ flag: 'f:ready' }, { flag: 'life:abroad' }, { flag: 'life:finale:reunionOffered' }] },
            hidden: true,
            then: [
              { e: 'flag', flag: 'f:plan' },
              { e: 'flagValue', flag: 'f:party', value: 'reunion' },
              { e: 'flagValue', flag: PARTY, value: 'reunion' },
              { e: 'proof', kind: 'plan_confirmed', proofId: 'plan_confirmed:{chapter}:trip', subjectHe: 'הנסיעה עם אבא', noteHe: 'נקודת מפגש עם תמונה, כי שם של רחוב הוא ישכח.' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'קובי: "איפה אתה מחכה לי?" — "בנקודה שנקבע, עם תמונה שלה." — "טוב. שם של רחוב אני אשכח."', tone: 'plain' },
              { e: 'ending', id: 'reunion' },
            ],
          },
          {
            id: 'later',
            text: '"עוד לא. אני לא מבטיח לפני שסוגרים."',
            then: [
              { e: 'flag', flag: 'f:plan' },
              { e: 'flagValue', flag: 'f:party', value: 'saving' },
              { e: 'flagValue', flag: PARTY, value: 'saving' },
              { e: 'personality', key: 'honesty', delta: 3 },
              { e: 'toast', text: 'קובי: "זה בסדר." — "אני יודע. בגללך."', tone: 'plain' },
              { e: 'ending', id: 'saving' },
            ],
          },
        ],
      },
    ],
  },

  // ----------------------------------------------------------------- F02–F04 ------
  {
    id: 'f-road',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: null, text: 'נמל ההגעה. שני תיקים, ושעה מוקדמת.' },
          { who: 'קובי', text: 'יש לי את הכרטיסים.' },
          { who: 'פוגי', text: 'גם לי יש עותק.' },
          { who: 'קובי', text: 'אתה לא סומך עליי?' },
          { who: 'פוגי', text: 'למדתי ממך.' },
          { who: 'קובי', text: 'טוב. תשובה מעצבנת אבל טובה.' },
        ],
        choices: [
          {
            id: 'together',
            text: '(ללכת יחד — ולתת לו לבחור איפה עוצרים.)',
            then: [
              { e: 'flag', flag: 'f:road' },
              { e: 'time', minutes: 20 },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'flagValue', flag: 'f:pace', value: 'together' },
              { e: 'toast', text: 'קובי: "פה נשב רגע." — "יש עוד זמן." — "אז עוד יותר טוב."', tone: 'plain' },
            ],
          },
          {
            id: 'child',
            text: '(לתת לו להוביל קטע קצר, בהסכמה.)',
            when: party('three'),
            hidden: true,
            then: [
              { e: 'flag', flag: 'f:road' },
              { e: 'flagValue', flag: 'f:pace', value: 'third_generation' },
              { e: 'toast', text: 'הילד: "אתם באים?" — קובי: "עכשיו אתה מבין אותי?" — "קצת יותר מדי."', tone: 'plain' },
            ],
          },
          {
            id: 'wait',
            text: '(לחכות לו במקום שסיכמנו.)',
            // F02.3 — *"במפגש מחו״ל, לחכות לקובי במקום שסיכמנו"*: rest of the lives left together
            when: abroad,
            hidden: true,
            then: [
              { e: 'flag', flag: 'f:road' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'flagValue', flag: 'f:pace', value: 'reunion' },
              { e: 'toast', text: 'קובי: "חשבתי שתעמוד עם שלט." — "אתה מזהה אותי גם בלי?" — "לצערך."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'f-seats',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: null, text: 'מחוץ לאולם. אנשים בשתי שפות, ואף אחת מהן לא שלכם.' },
          { who: 'קובי', text: 'אז איפה הולכים?' },
          { who: 'פוגי', text: 'היום אתה אחריי.' },
          { who: 'קובי', text: 'ארבעים שנה חיכית להגיד את זה.' },
          { who: 'פוגי', text: 'קצת יותר.' },
          { who: 'קובי', text: 'אל תתחיל להיות עמית.' },
        ],
        choices: [
          {
            /**
             * `inventory.has_selected_legacy_object` (F03.1) — **ואין כאן `when`, בכוונה.**
             * הקופסה האדומה מתמלאת ב-`{ e: 'keep' }` בסוף 1986, ו-24.5.1986 הוא יום חובה
             * (כלל 58) שהמועמד האחרון שלו תמיד זכאי — כלומר אין חיים שמגיעים ל-2026 עם
             * קופסה ריקה. תנאי שתמיד מתקיים הוא רעש; אם יום חובה ייפתח אי-פעם, זה המקום.
             */
            id: 'object',
            text: '(לתת לו את המזכרת שבחרתי מהקופסה.)',
            then: [
              { e: 'flag', flag: 'f:seats' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'memory', item: 'folded-paper', id: 'f-2026-object' },
              { e: 'flagValue', flag: 'f:gesture', value: 'old_object' },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'toast', text: 'קובי: "אתה זוכר את זה?" — "בגלל זה הבאתי." — "אז תשאיר אצלך. יש לך עוד למי לספר."', tone: 'plain' },
            ],
          },
          {
            id: 'photo',
            text: '(לצלם את מי שהגיע איתי.)',
            then: [
              { e: 'flag', flag: 'f:seats' },
              { e: 'flag', flag: 'own:photo:finale2026' },
              { e: 'flagValue', flag: 'f:gesture', value: 'photo' },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'toast', text: 'קובי: "רגע, עוד לא הסתכלתי." — "דווקא ככה." — "אתה וכל התמונות שלך."', tone: 'plain' },
            ],
          },
          {
            id: 'present',
            text: '(להניח את הטלפון. פשוט להיות איתו.)',
            then: [
              { e: 'flag', flag: 'f:seats' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'memory', item: 'folded-paper', id: 'f-2026-present' },
              { e: 'flagValue', flag: 'f:gesture', value: 'present' },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'toast', text: 'קובי: "אתה בסדר?" — "כן. רציתי להיות פה איתך." — "אז תהיה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'f-back',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: null, text: 'מחוץ לאולם, אחרי. הרחוב מתרוקן לאט.' },
          { who: 'קובי', text: 'נו, מה אתה אומר?' },
          { who: 'פוגי', text: 'על המשחק?' },
          { who: 'קובי', text: 'על הכול.' },
          { who: 'פוגי', text: 'אני עוד חושב.' },
          { who: 'קובי', text: 'אז בוא נאכל בינתיים.' },
        ],
        choices: [
          {
            id: 'father',
            text: '"פעם אתה הובלת אותי. היום רציתי להיות לידך מהצד הזה."',
            then: [
              { e: 'flag', flag: 'f:back' },
              { e: 'flagValue', flag: 'life:ending', value: 'father_and_child' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 4 },
              { e: 'remember', who: 'kobi', eventId: 'finale-2026', significance: 'major' },
              { e: 'ending', id: 'together' },
            ],
          },
          {
            id: 'three',
            text: '(לתת לו לבחור את הדרך חזרה.)',
            when: party('three'),
            hidden: true,
            then: [
              { e: 'flag', flag: 'f:back' },
              { e: 'flagValue', flag: 'life:ending', value: 'three_generations' },
              { e: 'remember', who: 'kobi', eventId: 'finale-2026', significance: 'major' },
              { e: 'ending', id: 'generations' },
            ],
          },
          {
            id: 'mine',
            text: '"נהנית מאוד. ומחר אני חוזר לחיים שלי."',
            // F04.3 — *"residence.abroad or flag.armchair_active"*: the life that is elsewhere
            when: { any: [abroad, { flag: 'life:armchair' }] },
            hidden: true,
            then: [
              { e: 'flag', flag: 'f:back' },
              { e: 'flagValue', flag: 'life:ending', value: 'reunion_in_europe' },
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 3 },
              { e: 'remember', who: 'kobi', eventId: 'finale-2026', significance: 'major' },
              { e: 'ending', id: 'mine' },
            ],
          },
        ],
      },
    ],
  },
]
