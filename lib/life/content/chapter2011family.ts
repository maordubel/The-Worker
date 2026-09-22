import type { LifeState } from '../types'
import { PARTNER_TAG } from '../partner'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_GROWTH } from './chapter2012growth'

/**
 * L01–L06 · "חיי בית — בחירה, זוגיות והורות" · בשני פרקים.
 *
 * **`2011-people`** (L01–L03) — שלושה מפגשים, ואף אחד מהם אינו סף משיכה.
 * **`2013-household`** (L04–L06) — היומן שעל המקרר, השיחה על הורות, והערב הראשון.
 *
 * **הכלל של הענף, ומה שהוא אוסר.** *"כניסה לקשר מחייבת שלושה מפגשים שונים והסכמה
 * הדדית, לא סף משיכה"*, ו*"אין קשר רומנטי אוטומטי; היכרות יכולה להישאר חברות"*.
 * לכן שלוש הסצנות תמיד קורות, כל אחת יכולה להיגמר בחברות, ובן/בת הזוג נקבע
 * **בסוף** מתוך מי שהיה הדדי — לא לפי מספר.
 *
 * **ו-`L01.3` קיימת בכוונה.** התסריט כותב בחירה שבה פוגי לוחץ על תמונה אחרי
 * שסירבה, והיא נענית ב*"אמרתי לא. זה מספיק."* — עם מחיר ביחסים. משחק שאין בו את
 * הבחירה הזאת הוא משחק שמונע ממך לטעות, ושמירה עליה היא מה שנותן משמעות לשתיים
 * האחרות. היא אינה נסתרת ואינה מוצגת כהישג.
 *
 * **`PARTNER` הוא תפקיד, לא דמות.** התסריט כותב אותו כך ואומר שהדמות הפעילה
 * מחליפה אותו. `lib/life/partner.ts` הוא מי שמחליף, פעם אחת, ברדיוסר —
 * במקום שלוש העתקות של כל שיחה שאחת מהן תיסחף (כלל 59).
 *
 * **ואין כאן סימולציית פוריות.** *"רצון אינו יוצר לידה בלחיצה. מעבר זמן מוסכם
 * מתאר הגעה להורות בלי סימולציית פוריות או הבטחת תוצאה רפואית."* לכן `L05` קובעת
 * **כוונה** בלבד, ו-`L06` היא מעבר זמן שקורה רק כששני התנאים מתקיימים — כוונה,
 * ובן/בת זוג. `life:child` מורם שם, ובשום מקום אחר.
 */

export const PORTRAIT_FAMILY: Record<string, string> = {
  ...PORTRAIT_GROWTH,
  /** שלוש הדמויות של הענף — אין להן פיגורה, וניצב כללי הוא הצורה הכנה (כלל 67) */
  'מלאני': 'faceWoman',
  'דור': 'faceYoung',
  'תמר': 'faceLimor',
}

// ------------------------------------------------------------------- Part I ------

export function objectivePeople(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['l:melanie']) return sceneId === 'allenby' ? null : 'פינת אלנבי. מישהי מחכה, והטלפון בכיס.'
  if (!state.flags['l:dor']) return sceneId === 'street' ? null : 'ברחוב. דור מארגנת משהו, ולא ביקשה עזרה.'
  if (!state.flags['l:tamar']) return sceneId === 'kiosk' ? null : 'בקיוסק. תמר שאלה שאלה, ולא על הפועל.'
  return null
}

export const ENDINGS_PEOPLE: Record<string, EndingCard> = {
  chose: {
    id: 'chose',
    titleHe: 'שלושה ערבים, ואחד מהם המשיך',
    bodyHe:
      'שלושה אנשים, שלושה ערבים, ואחד מהם לא נגמר בסוף הערב. אף אחד לא נבחר לפי מספר ואף אחד לא היה פרס — היה מישהו שרצית לראות שוב, וגם הוא רצה.',
    memoryHe: 'הודעה קצרה, שנשלחה אחרי.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  friends: {
    id: 'friends',
    titleHe: 'זה מותר, אתה יודע',
    bodyHe:
      'שלושה ערבים, ושלושתם נשארו חברות. אין פה החמצה: אחת אמרה שזה מותר, ואמרת שטוב שהבהרנו לפני שעמית פותח טבלה — והיא צחקה, ואתם עדיין מדברים.',
    memoryHe: 'שלושה מספרים, שכולם עונים.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  alone: {
    id: 'alone',
    titleHe: 'אמרתי לא. זה מספיק',
    bodyHe:
      'אחד משלושת הערבים נגמר בשורה שלא ביקשת לשמוע, והיא הייתה צודקת. אמרת "הבנתי", ולא הוספת. זה לא הופך אותך לאדם רע, וגם לא נמחק.',
    memoryHe: 'שיחה שלא נמשכה.',
    memoryItem: 'folded-paper',
    presence: 'late',
  },
}

export const BEATS_PEOPLE: Beat[] = [
  { id: 'l-melanie', at: 'allenby', trigger: 'enter', when: { none: [{ flag: 'l:melanie' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'l-melanie' }] },
  { id: 'l-dor', at: 'street', trigger: 'enter', when: { all: [{ flag: 'l:melanie' }], none: [{ flag: 'l:dor' }] }, delayMs: 650, do: [{ a: 'talk', conversation: 'l-dor' }] },
  { id: 'l-tamar', at: 'kiosk', trigger: 'enter', when: { all: [{ flag: 'l:dor' }], none: [{ flag: 'l:tamar' }] }, delayMs: 650, do: [{ a: 'talk', conversation: 'l-tamar' }] },
  { id: 'l-close', trigger: 'clock', when: { all: [{ flag: 'l:tamar' }], none: [{ flag: 'l:done' }] }, delayMs: 1300, do: [{ a: 'flag', flag: 'l:done' }, { a: 'talk', conversation: 'l-close' }] },
]

// ------------------------------------------------------------------ Part II ------

export function objectiveHousehold(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['hh:diary']) return sceneId === 'home' ? null : 'בבית. היומן על המקרר, ויש בו הכול חוץ מכם.'
  if (!state.flags['hh:parent']) return sceneId === 'home' ? null : 'שיחה אחת, ולא "מתישהו".'
  return null
}

export const ENDINGS_HOUSEHOLD: Record<string, EndingCard> = {
  shared: {
    id: 'shared',
    titleHe: 'עם הבטחה שנדבר לפני',
    bodyHe:
      'ערב משותף, וזמן לכל אחד בנפרד. לא הבטחת שלא יהיה שינוי — הבטחת שנדבר לפני, וזה מה שהתבקש מלכתחילה.',
    memoryHe: 'יומן, עם שתי כתבי יד.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  separate: {
    id: 'separate',
    titleHe: 'טוב שאמרת',
    bodyHe:
      'אמרת בכנות שאתה לא רוצה בית משותף עכשיו. זה כאב לשמוע, ונאמר — ולא בנית משהו שאתה לא מוכן אליו כדי לא לאכזב.',
    memoryHe: 'שני מפתחות, שנשארו נפרדים.',
    memoryItem: 'house-key',
    presence: 'inside',
  },
  parent: {
    id: 'parent',
    titleHe: 'אז נצטרך לבחור באמת',
    bodyHe:
      'אמרת שאתה רוצה להיות הורה, בקול, ביחד. נשאלת מה יקרה כשזה לא יסתדר עם שבת, ואמרת שאז נצטרך לבחור באמת — וזו הייתה התשובה הנכונה היחידה.',
    memoryHe: 'דף עם שתי רשימות, אחת ריקה.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

export const BEATS_HOUSEHOLD: Beat[] = [
  { id: 'hh-diary', at: 'home', trigger: 'enter', when: { none: [{ flag: 'hh:diary' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'hh-diary' }] },
  // באותו חדר כמו היומן (`homeAdult`: המטבח הוא הפינה של הסלון) — ולכן שעון ולא דלת: אין דלת לעבור בה
  { id: 'hh-parent', at: 'home', trigger: 'clock', when: { all: [{ flag: 'hh:diary' }], none: [{ flag: 'hh:parent' }] }, delayMs: 1400, do: [{ a: 'talk', conversation: 'hh-parent' }] },
  /**
   * **מעבר הזמן, ורק כששני התנאים מתקיימים.** כוונה להורות **ובן/בת זוג** —
   * ולא "רצה, ולכן קרה". הוא רץ אחרי `hh:parent`, והוא המקום היחיד במשחק
   * ש-`life:child` מורם בו.
   */
  { id: 'hh-first', trigger: 'clock', when: { all: [{ flag: 'hh:parent' }, { flagIs: { flag: 'hh:intent', value: 'yes' } }, { flag: 'life:partner' }], none: [{ flag: 'hh:first' }] }, delayMs: 1600, do: [{ a: 'talk', conversation: 'hh-first' }] },
]

// ---------------------------------------------------------------- the words ------

export const CONVERSATIONS_FAMILY: Conversation[] = [
  {
    id: 'l-melanie',
    nameHe: 'מלאני',
    branches: [
      {
        lines: [
          { who: 'מלאני', text: 'אתה מדבר איתי או עם המצלמה?' },
          { who: 'פוגי', text: 'איתך.' },
          { who: 'מלאני', text: 'אז למה אתה בודק איך יצא?' },
          { who: 'פוגי', text: 'הרגל.' },
          { who: 'מלאני', text: 'אפשר להכיר גם בלי להעלות הוכחה.' },
        ],
        choices: [
          {
            id: 'listen',
            text: '(להניח את הטלפון. לשאול מה היא רוצה לעשות.)',
            then: [
              { e: 'flag', flag: 'l:melanie' },
              { e: 'time', minutes: 45 },
              { e: 'rel', who: 'melanie', axis: 'bond', delta: 3 },
              { e: 'flag', flag: 'l:mutual:melanie' },
              { e: 'toast', text: 'מלאני: "קפה במקום שאפשר לשמוע בו." — "דרישה מוגזמת, אבל אנסה."', tone: 'plain' },
            ],
          },
          {
            id: 'friend',
            text: '(להציע חברות. בלי ציפייה לרומן.)',
            then: [
              { e: 'flag', flag: 'l:melanie' },
              { e: 'rel', who: 'melanie', axis: 'bond', delta: 3 },
              { e: 'flagValue', flag: 'l:melanieKind', value: 'friend' },
              { e: 'toast', text: 'מלאני: "זה מותר, אתה יודע." — "טוב שהבהרנו לפני שעמית פותח טבלה."', tone: 'plain' },
            ],
          },
          {
            /**
             * **הטעות נשמרת, ויש לה מחיר.** התסריט כותב אותה, והיא נענית במילים
             * שלה עצמה. משחק שמסיר את הבחירה הזאת הוא משחק שמונע ממך לטעות, ואז
             * שתי האחרות לא אומרות כלום.
             */
            id: 'push',
            text: '(ללחוץ על התמונה. היא כבר אמרה לא.)',
            then: [
              { e: 'flag', flag: 'l:melanie' },
              { e: 'rel', who: 'melanie', axis: 'bond', delta: -2 },
              { e: 'rel', who: 'melanie', axis: 'trust', delta: -4 },
              { e: 'flag', flag: 'l:crossed' },
              { e: 'wellbeing', key: 'regret', delta: 6 },
              { e: 'toast', text: 'מלאני: "אמרתי לא. זה מספיק." — "הבנתי."', tone: 'red' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'l-dor',
    nameHe: 'דור',
    branches: [
      {
        lines: [
          { who: 'דור', text: 'מי אמר שאני באה איתך?' },
          { who: 'פוגי', text: 'חשבתי שאנחנו באותו ראש.' },
          { who: 'דור', text: 'אנחנו באותה קבוצה. זה לא אותו דבר.' },
          { who: 'פוגי', text: 'אז בואי נתחיל מחדש.' },
          { who: 'דור', text: 'רעיון טוב.' },
        ],
        choices: [
          {
            id: 'join',
            text: '(לשאול מה התוכנית שלה — ולהצטרף אם מתאים.)',
            then: [
              { e: 'flag', flag: 'l:dor' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'rel', who: 'dor', axis: 'bond', delta: 2 },
              { e: 'rel', who: 'dor', axis: 'trust', delta: 3 },
              { e: 'flag', flag: 'l:mutual:dor' },
              { e: 'toast', text: 'דור: "אני מארגנת, אתה עוזר. מתאים?" — "מתאים. בלי לגנוב את ההגה."', tone: 'plain' },
            ],
          },
          {
            id: 'other',
            text: '(להציע ערב אחר. בלי כדורגל.)',
            then: [
              { e: 'flag', flag: 'l:dor' },
              { e: 'time', minutes: 45 },
              { e: 'rel', who: 'dor', axis: 'bond', delta: 3 },
              { e: 'flag', flag: 'l:mutual:dor' },
              { e: 'toast', text: 'דור: "אתה יודע לעשות את זה?" — "עוד לא ניסינו." — "אז נבדוק."', tone: 'plain' },
            ],
          },
          {
            id: 'friend',
            text: '(להישאר חברים, ולסכם שלא תכננו יחד.)',
            then: [
              { e: 'flag', flag: 'l:dor' },
              { e: 'rel', who: 'dor', axis: 'bond', delta: 2 },
              { e: 'flagValue', flag: 'l:dorKind', value: 'friend' },
              { e: 'toast', text: 'דור: "מעולה. עכשיו אין מה לנחש." — "פחות מצחיק, יותר נוח."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'l-tamar',
    nameHe: 'תמר',
    branches: [
      {
        lines: [
          { who: 'תמר', text: 'שאלתי מה אתה אוהב לעשות.' },
          { who: 'פוגי', text: 'אמרתי.' },
          { who: 'תמר', text: 'אמרת לאיזו קבוצה אתה הולך.' },
          { who: 'פוגי', text: 'זה תופס די הרבה זמן.' },
          { who: 'תמר', text: 'אז מעניין אותי מה אתה עושה בשאר.' },
        ],
        choices: [
          {
            id: 'personal',
            text: '(לספר על משהו אישי, שלא קשור לספורט.)',
            then: [
              { e: 'flag', flag: 'l:tamar' },
              { e: 'time', minutes: 45 },
              { e: 'rel', who: 'tamar', axis: 'bond', delta: 3 },
              { e: 'flag', flag: 'l:mutual:tamar' },
              { e: 'toast', text: 'תמר: "עכשיו יש לי עוד שאלה." — "זה סימן טוב?" — "בדרך כלל."', tone: 'plain' },
            ],
          },
          {
            id: 'searching',
            text: '"אני עוד מחפש את זה."',
            then: [
              { e: 'flag', flag: 'l:tamar' },
              { e: 'rel', who: 'tamar', axis: 'bond', delta: 3 },
              { e: 'flag', flag: 'l:mutual:tamar' },
              { e: 'personality', key: 'honesty', delta: 3 },
              { e: 'toast', text: 'תמר: "גם זו תשובה." — "חשבתי שצריך להגיע מוכן." — "זה לא מבחן קבלה."', tone: 'plain' },
            ],
          },
          {
            id: 'friend',
            text: '(להישאר בקשר. כחברים.)',
            then: [
              { e: 'flag', flag: 'l:tamar' },
              { e: 'rel', who: 'tamar', axis: 'bond', delta: 2 },
              { e: 'flagValue', flag: 'l:tamarKind', value: 'friend' },
              { e: 'toast', text: 'תמר: "בשמחה. בלי שיעורי בית." — "עכשיו אני רגוע."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    /**
     * **ההסכמה ההדדית, ורק אחרי שלושת המפגשים.** אין כאן "בחר אחת משלוש" — יש
     * שאלה אחת על מי שכבר היה הדדי, והיא מוצעת רק למי שיש לו את מי להציע.
     */
    id: 'l-close',
    nameHe: null,
    branches: [
      {
        when: { any: [{ flag: 'l:mutual:melanie' }, { flag: 'l:mutual:dor' }, { flag: 'l:mutual:tamar' }] },
        lines: [
          { who: null, text: 'שלושה ערבים, ואחד מהם עוד לא נגמר בראש שלך.' },
        ],
        choices: [
          {
            id: 'melanie',
            text: '(לכתוב למלאני.)',
            when: { flag: 'l:mutual:melanie' },
            hidden: true,
            then: [{ e: 'flagValue', flag: 'life:partner', value: 'melanie' }, { e: 'ending', id: 'chose' }],
          },
          {
            id: 'dor',
            text: '(לכתוב לדור.)',
            when: { flag: 'l:mutual:dor' },
            hidden: true,
            then: [{ e: 'flagValue', flag: 'life:partner', value: 'dor' }, { e: 'ending', id: 'chose' }],
          },
          {
            id: 'tamar',
            text: '(לכתוב לתמר.)',
            when: { flag: 'l:mutual:tamar' },
            hidden: true,
            then: [{ e: 'flagValue', flag: 'life:partner', value: 'tamar' }, { e: 'ending', id: 'chose' }],
          },
          {
            id: 'none',
            text: '(לא לכתוב לאף אחד הערב.)',
            then: [{ e: 'ending', id: 'friends' }],
          },
        ],
      },
      { when: { flag: 'l:crossed' }, lines: [{ who: null, text: 'ההודעה נשארה לא נשלחת. זה היה הדבר הנכון.' }], then: [{ e: 'ending', id: 'alone' }] },
      { lines: [{ who: null, text: 'שלושה מספרים חדשים בטלפון, וכולם עונים.' }], then: [{ e: 'ending', id: 'friends' }] },
    ],
  },

  // ----------------------------------------------------------------- L04–L06 ------
  {
    id: 'hh-diary',
    nameHe: null,
    branches: [
      {
        when: { flag: 'life:partner' },
        lines: [
          { who: PARTNER_TAG, text: 'יש ביומן שלך הכול חוץ מאיתנו.' },
          { who: 'פוגי', text: 'חשבתי שברור שאנחנו נפגשים.' },
          { who: PARTNER_TAG, text: 'גם לי. ואז גיליתי שקבעת נסיעה באותו ערב.' },
          { who: 'פוגי', text: 'צריך לדבר על זה.' },
          { who: PARTNER_TAG, text: 'זה מה שאני עושה.' },
        ],
        choices: [
          {
            id: 'calendar',
            text: '(ערב משותף — ולכל אחד זמן משלו.)',
            then: [
              { e: 'flag', flag: 'hh:diary' },
              { e: 'time', minutes: 25 },
              { e: 'flagValue', flag: 'hh:home', value: 'shared_calendar' },
              { e: 'proof', kind: 'family_agreement', proofId: 'family_agreement:{chapter}:calendar', subjectHe: 'הערב שלנו', noteHe: 'לא הבטיח שלא ישתנה; הבטיח שידברו לפני.' },
              { e: 'toast', text: '"בלי הבטחה שבחיים לא יהיה שינוי." — "עם הבטחה שנדבר לפני."', tone: 'plain' },
            ],
          },
          {
            id: 'separate',
            text: '"אני לא רוצה בית משותף עכשיו." (בכנות.)',
            then: [
              { e: 'flag', flag: 'hh:diary' },
              { e: 'flagValue', flag: 'hh:home', value: 'separate' },
              { e: 'personality', key: 'honesty', delta: 4 },
              { e: 'toast', text: '"זה כואב לשמוע, אבל טוב שאמרת." — "לא רציתי לבנות משהו שאני לא מוכן אליו."', tone: 'plain' },
            ],
          },
          {
            id: 'promise',
            text: '"ערב קבוע. אני מבטיח." (בלי לבדוק את היומן.)',
            then: [
              { e: 'flag', flag: 'hh:diary' },
              { e: 'flag', flag: 'promise:householdEvening' },
              { e: 'flagValue', flag: 'hh:home', value: 'promise_needs_capacity' },
              { e: 'toast', text: '"אז תכתוב אותו." — "כתבתי."', tone: 'plain' },
            ],
          },
        ],
      },
      /**
       * **בית עצמאי, וקרן חברה לשיחה — לא בת זוג אוטומטית.** זו שורה מפורשת
       * בתסריט, והיא מה שמאפשר לפרק להיגמר גם בלי שנבחר אף אחד (כלל 75) בלי
       * להמציא קשר שלא נוצר.
       */
      {
        lines: [
          { who: 'קרן', text: 'יש לך יומן על המקרר ואין בו אף אחד.' },
          { who: 'פוגי', text: 'יש בו אותי.' },
          { who: 'קרן', text: 'זה מה שאמרתי.' },
          { who: 'פוגי', text: 'זה לא נשמע כמו מחמאה.' },
          { who: 'קרן', text: 'זו שאלה. הן נשמעות ככה.' },
        ],
        choices: [
          {
            id: 'own',
            text: '(לכתוב ביומן גם דברים שהם לא משחקים.)',
            then: [
              { e: 'flag', flag: 'hh:diary' },
              { e: 'time', minutes: 25 },
              { e: 'flagValue', flag: 'hh:home', value: 'own_place' },
              { e: 'rel', who: 'keren', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'קרן: "שתי שורות זה התחלה." — "שלוש, אם סופרים כביסה."', tone: 'plain' },
            ],
          },
          {
            id: 'as-is',
            text: '"ככה טוב לי עכשיו."',
            then: [
              { e: 'flag', flag: 'hh:diary' },
              { e: 'flagValue', flag: 'hh:home', value: 'own_place' },
              { e: 'personality', key: 'honesty', delta: 2 },
              { e: 'toast', text: 'קרן: "בסדר גמור." — "חיכיתי שתתווכחי." — "לא על זה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hh-parent',
    nameHe: null,
    branches: [
      {
        when: { flag: 'life:partner' },
        lines: [
          { who: PARTNER_TAG, text: 'כשאתה אומר מתישהו, אתה מתכוון למשהו?' },
          { who: 'פוגי', text: 'אני מתכוון שאני חושב על זה.' },
          { who: PARTNER_TAG, text: 'אז תחשוב איתי בקול.' },
          { who: 'פוגי', text: 'אני מפחד שאהיה אבא שלי.' },
          { who: PARTNER_TAG, text: 'איזה חלק ממנו?' },
        ],
        choices: [
          {
            id: 'yes',
            text: '"אני רוצה להיות הורה. בואו נבנה תוכנית יחד."',
            then: [
              { e: 'flag', flag: 'hh:parent' },
              { e: 'flagValue', flag: 'hh:intent', value: 'yes' },
              { e: 'proof', kind: 'parenthood_consent', proofId: 'parenthood_consent:{chapter}:both', subjectHe: 'ההחלטה להיות הורים', noteHe: 'נאמר בקול, על ידי שניהם, ולא "מתישהו".' },
              // **בלי סיום כאן.** הסיום של המסלול הזה הוא `hh-first` — מעבר הזמן —
              // וסיום שנפלט עכשיו היה סוגר את הפרק לפני שהערב הראשון מגיע.
              { e: 'toast', text: '"וגם כשזה לא מסתדר עם שבת?" — "אז נצטרך לבחור באמת."', tone: 'plain' },
            ],
          },
          {
            id: 'no',
            text: '"אני לא רוצה ילדים."',
            then: [
              { e: 'flag', flag: 'hh:parent' },
              { e: 'flagValue', flag: 'hh:intent', value: 'no' },
              { e: 'personality', key: 'honesty', delta: 4 },
              { e: 'toast', text: '"אני צריכה לחשוב מה זה אומר בשבילי." — "אני מבין. לא אעמיד פנים כדי להשאיר אותך."', tone: 'plain' },
              { e: 'ending', id: 'shared' },
            ],
          },
          {
            id: 'undecided',
            text: '"אני עדיין לא יודע. נקבע שיחה נוספת, בלי הבטחה."',
            then: [
              { e: 'flag', flag: 'hh:parent' },
              { e: 'flagValue', flag: 'hh:intent', value: 'undecided' },
              { e: 'toast', text: '"בסדר, אבל לא נעמיד פנים שהחלטנו." — "מסכים."', tone: 'plain' },
              { e: 'ending', id: 'shared' },
            ],
          },
        ],
      },
      {
        lines: [
          { who: null, text: 'הדירה שקטה. השאלה עולה לבד, בלי שאף אחד שואל.' },
          { who: 'פוגי', text: 'מתישהו.' },
          { who: null, text: 'אף אחד לא ענה, כי אין פה מי שיענה. זה גם סוג של תשובה.' },
        ],
        choices: [
          {
            id: 'later',
            text: '(להשאיר את השאלה פתוחה. בלי להחליט לבד על חיים של שניים.)',
            then: [
              { e: 'flag', flag: 'hh:parent' },
              { e: 'flagValue', flag: 'hh:intent', value: 'undecided' },
              { e: 'ending', id: 'separate' },
            ],
          },
          {
            id: 'content',
            text: '"ככה טוב לי. וזה לא סיפור עצוב."',
            then: [
              { e: 'flag', flag: 'hh:parent' },
              { e: 'flagValue', flag: 'hh:intent', value: 'no' },
              { e: 'wellbeing', key: 'regret', delta: -5 },
              { e: 'ending', id: 'separate' },
            ],
          },
        ],
      },
    ],
  },
  {
    /**
     * `L06` — מעבר הזמן המוסכם, ולא לידה בלחיצה. הוא רץ רק אחרי שהכוונה נאמרה
     * בקול על ידי שניהם, והוא **המקום היחיד** ש-`life:child` מורם בו.
     */
    id: 'hh-first',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: null, text: 'עבר זמן. לא הרבה, ולא מעט — בדיוק כמה שהתסריט של החיים לוקח.' },
          { who: 'קובי', text: 'הוא קטן.' },
          { who: 'פוגי', text: 'גם אני הייתי.' },
          { who: 'קובי', text: 'אתה עשית יותר רעש.' },
          { who: 'רחל', text: 'הוא זוכר רק כשהיה כדורגל.' },
          { who: 'פוגי', text: 'אני פה, כן?' },
        ],
        choices: [
          {
            id: 'evening',
            text: '(לקחת את הערב — ולתת למי שאיתך לנוח.)',
            then: [
              { e: 'flag', flag: 'hh:first' },
              { e: 'flag', flag: 'life:child' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -15 },
              { e: 'proof', kind: 'first_evening', proofId: 'first_evening:{chapter}:child', subjectHe: 'הערב הראשון', noteHe: 'לקח את הערב כולו, ולא ביקש שיגידו לו תודה.' },
              { e: 'toast', text: '"אם אתה צריך עזרה, תקרא." — "גם אני יכול ללמוד."', tone: 'plain' },
              { e: 'ending', id: 'parent' },
            ],
          },
          /**
           * **L06.2 ו-L06.3 — עד 21.9.2026 הן לא היו כאן.** במקומן עמדה בחירה אחת שהומצאה
           * מתוך שורת הפעולות (*"הכנת תיק ותיאום יציאה"*), כלומר שתי בחירות שנכתבו הוחלפו
           * בפעולה שלא נכתבה כבחירה. `life:screenplay-coverage` מצא את זה.
           *
           * *"לבקש עזרה מקובי ורחל אם הם מסכימים"* — ההסכמה **היא השורה של רחל**: *"הערב
           * כן. זה לא אומר שכל שבת."* היא אומרת כן לערב אחד, בקול, ולכן אין כאן סף.
           */
          {
            id: 'grandparents',
            text: '(לבקש עזרה מקובי ורחל — אם הם מסכימים.)',
            then: [
              { e: 'flag', flag: 'hh:first' },
              { e: 'flag', flag: 'life:child' },
              { e: 'time', minutes: 30 },
              { e: 'flagValue', flag: 'life:family:help', value: 'one_evening' },
              { e: 'proof', kind: 'asked_not_assumed', proofId: 'asked_not_assumed:{chapter}:grandparents', subjectHe: 'עזרה מקובי ורחל', noteHe: 'שאל, ולא הניח שזה מובן מאליו.' },
              { e: 'rel', who: 'rachel', axis: 'trust', delta: 2 },
              { e: 'toast', text: 'רחל: "הערב כן. זה לא אומר שכל שבת." — "הבנתי." — קובי: "תכתוב גם את זה ביומן."', tone: 'plain' },
              { e: 'ending', id: 'parent' },
            ],
          },
          {
            id: 'home',
            text: '(לבטל יציאה בזמן — ולהסביר לחברים.)',
            then: [
              { e: 'flag', flag: 'hh:first' },
              { e: 'flag', flag: 'life:child' },
              { e: 'flagValue', flag: 'life:family:firstEvening', value: 'home' },
              // אותו `proofId` כמו `evening`: שתי הבחירות הן `family.care1` בתסריט — ערב אחד, לא שניים.
              { e: 'proof', kind: 'first_evening', proofId: 'first_evening:{chapter}:child', subjectHe: 'הערב הראשון', noteHe: 'ביטל בזמן, ואמר לחברים למה.' },
              { e: 'toast', text: 'אופיר: "תשמור על עצמך. אנחנו נסתדר." — "תשלח תמונה." — "רק של התוצאה?"', tone: 'plain' },
              { e: 'ending', id: 'parent' },
            ],
          },
        ],
      },
    ],
  },
]
