import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_FOUNDING } from './chapter2007founding'

/**
 * D01–D09 · "עד שהטלפון נופל" · 2010 — הדאבל השני, ושני פרקים מאותה סיבה שהראשון היה.
 *
 * `2000-title` ו-`2000-double` הם דאבל אחד בשני ימים, כי אליפות וגביע הם שני ימים שונים
 * בחיים גם כשהם בשבוע אחד. התסריט כותב את 2010 כפרק אחד בן תשע סצנות, והמנוע מפצל אותו
 * לשניים באותו קו: **`2010-cup`** — החורף, החשבון בקיוסק, הדרבי שנגמר באפס, והגמר — ו-
 * **`2010-teddy`**, ארבעה ימים אחר כך.
 *
 * **שלוש השורות בארכיון, שלושתן בביטחון 2 מוויקיפועל:** 8.5.2010, הדרבי, 0:0; 11.5.2010,
 * גמר הגביע מול בני יהודה, 3:1; 15.5.2010, בטדי, 1:2. אף שורת דיאלוג כאן לא נוקבת
 * בתוצאה — הכרטיס ההיסטורי קורא אותה.
 *
 * **והמשחק המקביל אינו בארכיון, ולכן אינו נאמר.** האליפות הוכרעה ביום האחרון כשמשחק
 * אחר רץ במקביל, ו-`D06` בנוי על *"עדכון מקביל מאומת"*. `matches.json` מחזיק רק את
 * המשחקים של הפועל, כלומר התוצאה המקבילה אינה שורה — ולפי כלל 60 §2 אירוע שאף מקור
 * פומבי כאן לא נושא רשאי להריץ את היום, **ואסור לו לשים מספר בפה של אף אחד**. העדכון
 * הוא עדכון; מה שהוא אומר נשאר בחוץ.
 *
 * **הבטחה שחוצה סצנות.** `D05` מסכם תוכנית חזרה מטדי, ו-`D08` בודק אם היא קוימה. זו
 * הצורה שהמנוע כבר מכיר (`promise_kept`, `promise_renegotiated`, עם `subjectHe` משותף),
 * וזה גם מה ש-`ACH_NEW_PLAN` סופר: שינוי מראש **שאחריו קיום**, על אותו נושא.
 *
 * **החדרים.** `D01` הוא *"מגרש החברים"* ויושב על `pitch` של 1986 עד ש-`pitchSmall` ינחת
 * (`life:places` מדפיס את זה בשמו). טדי אינו חדר, ולכן מי שנוסע למגרש חווה אותו ככרטיס
 * וזמן — אותה החלטה של צ׳לסי ב-E01 — והסלון הוא החלופה שהתסריט עצמו כתב.
 */

export const PORTRAIT_2010: Record<string, string> = {
  ...PORTRAIT_FOUNDING,
}

/** הנושא של ההבטחה — אותו משפט בדיוק בשני הצדדים, כי זה מה שהמנוע מצליב (כלל 59) */
const RETURN_PROMISE = 'החזרה מטדי'

// ------------------------------------------------------------------- Part I ------

export function objectiveCup10(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['d10:photo']) return sceneId === 'pitch' ? null : 'המגרש של החבר׳ה. תמונה, לפני שהכול משתנה.'
  if (!state.flags['d10:math']) return sceneId === 'kiosk' ? null : 'בקיוסק עמית כבר מחשב.'
  if (!state.flags['d10:derby']) return 'אחרי הדרבי. אפס אפס, והכול רועש.'
  if (!state.flags['d10:cup']) return 'גמר הגביע. הוא לא חימום.'
  return null
}

export const ENDINGS_CUP10: Record<string, EndingCard> = {
  there: {
    id: 'there',
    titleHe: 'גביע הוא לא חימום',
    bodyHe:
      'היית שם, עם אבא, ומה שקרה באותו ערב קרה באותו ערב — לא כהקדמה לשבת. קובי שאל אם גם לזה יהיה מקום בקופסה, ואמרת שכן, לא על חשבון שבת.',
    memoryHe: 'כרטיס לגמר, בלי קמט.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  screen: {
    id: 'screen',
    titleHe: 'מי קופץ ראשון',
    bodyHe:
      'ראיתם מול המסך, ואופיר קפץ ראשון והפיל את השולחן, כמו שאמרת שהוא יעשה. גביע בסלון הוא עדיין גביע, והשולחן שנשבר הוא הוכחה.',
    memoryHe: 'רגל שולחן, מודבקת.',
    memoryItem: 'folded-paper',
    presence: 'television',
  },
  late: {
    id: 'late',
    titleHe: 'עכשיו אפשר לצעוק',
    bodyHe:
      'לא ראית. עמית לא התקשר באמצע, כמו שביקשת, ורק כשהכול נגמר שמעת. צעקת לבד, מאוחר, וזה לא היה פחות.',
    memoryHe: 'הודעה אחת, שנשלחה בזמן הנכון.',
    memoryItem: 'folded-paper',
    presence: 'late',
  },
}

export const BEATS_CUP10: Beat[] = [
  { id: 'd10-photo', at: 'pitch', trigger: 'enter', when: { none: [{ flag: 'd10:photo' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'd10-photo' }] },
  { id: 'd10-math', at: 'kiosk', trigger: 'enter', when: { all: [{ flag: 'd10:photo' }], none: [{ flag: 'd10:math' }] }, delayMs: 600, do: [{ a: 'talk', conversation: 'd10-math' }] },
  /** הדרבי והגמר הם רגעים, לא חדרים — שניהם על השעון (כלל 67) */
  { id: 'd10-derby', trigger: 'clock', when: { all: [{ flag: 'd10:math' }], none: [{ flag: 'd10:derby' }] }, delayMs: 1200, do: [{ a: 'talk', conversation: 'd10-derby' }] },
  { id: 'd10-cup', trigger: 'clock', when: { all: [{ flag: 'd10:derby' }], none: [{ flag: 'd10:cup' }] }, delayMs: 1400, do: [{ a: 'talk', conversation: 'd10-cup' }] },
]

// ------------------------------------------------------------------ Part II ------

export function objectiveTeddy(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['d10:plan']) return sceneId === 'street' ? null : 'אולי ליד הרכב. מי בא איתו?'
  if (!state.flags['d10:title']) return 'שבת. שני מגרשים, לב אחד.'
  if (!state.flags['d10:call']) return 'אחרי השריקה. למי אתה מתקשר.'
  if (!state.flags['d10:back']) return 'מי נשאר מאחור.'
  if (!state.flags['d10:morning']) return sceneId === 'kitchen' ? null : 'בבוקר. מחר עדיין יש כביסה.'
  return null
}

export const ENDINGS_TEDDY: Record<string, EndingCard> = {
  kept: {
    id: 'kept',
    titleHe: 'החלטתי להפתיע',
    bodyHe:
      'דאבל, ובלילה הכי מפתה לשכוח — לא שכחת. עמית חיכה ליד הרכב ואתה הגעת לפני שהוא התחיל לרדוף אחריך. הוא אמר שחשב שיצטרך, ואמרת שגם אתה חשבת.',
    memoryHe: 'הרשימה של אולי, עם וי ליד כל שם.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  renegotiated: {
    id: 'renegotiated',
    titleHe: 'סיכום, לא "יהיה בסדר"',
    bodyHe:
      'דאבל, ושינית את התוכנית — אבל לפני, ובקול. אולי לקח את עמית, ואתה חזרת אחרת, ושניהם ידעו איך. זה פחות מרגש מלנסוע יחד, וזה בדיוק העניין.',
    memoryHe: 'קבלה של מונית, מקופלת לשניים.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  broken: {
    id: 'broken',
    titleHe: 'זה לא אומר שזה היה בסדר',
    bodyHe:
      'דאבל. ועמית הסתדר בסוף לבד, ואמר את זה בלי לכעוס, מה שהיה גרוע יותר. בבוקר, במטבח, זה עוד ישב שם. יש לילות שהם הכי טובים שהיו לך ובכל זאת חייבים משהו למישהו.',
    memoryHe: 'הודעה שלא ענית עליה בזמן.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  home: {
    id: 'home',
    titleHe: 'לסדר את השולחן',
    bodyHe:
      'דאבל, מהסלון, עם אבא. לא היה צריך לאסוף אף אחד מאף חניה. עזרת לסדר את השולחן ואחר כך ישבתם עוד שעה בלי להדליק שום דבר.',
    memoryHe: 'השלט, שאף אחד לא נגע בו כל הערב.',
    memoryItem: 'folded-paper',
    presence: 'television',
  },
}

export const BEATS_TEDDY: Beat[] = [
  { id: 'd10-plan', at: 'street', trigger: 'enter', when: { none: [{ flag: 'd10:plan' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'd10-plan' }] },
  // D06 — טדי אינו מצויר: כרטיס שאומר לאן נסענו, ותג מקום בתיבה לאורך שלוש השיחות שם
  { id: 'd10-title', trigger: 'clock', when: { all: [{ flag: 'd10:plan' }], none: [{ flag: 'd10:title' }] }, delayMs: 1400, do: [{ a: 'card', titleHe: 'שבת', subHe: 'טדי', ms: 2400 }, { a: 'talk', conversation: 'd10-title' }] },
  { id: 'd10-call', trigger: 'clock', when: { all: [{ flag: 'd10:title' }], none: [{ flag: 'd10:call' }] }, delayMs: 1200, do: [{ a: 'talk', conversation: 'd10-call' }] },
  { id: 'd10-back', trigger: 'clock', when: { all: [{ flag: 'd10:call' }], none: [{ flag: 'd10:back' }] }, delayMs: 1200, do: [{ a: 'talk', conversation: 'd10-back' }] },
  { id: 'd10-morning', at: 'kitchen', trigger: 'enter', when: { all: [{ flag: 'd10:back' }], none: [{ flag: 'd10:morning' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'd10-morning' }] },
]

// -------------------------------------------------------------- conversations ------

export const CONVERSATIONS_2010: Conversation[] = [
  {
    id: 'd10-photo',
    nameHe: 'אפי',
    branches: [
      {
        lines: [
          { who: 'אפי', text: 'תעמדו כמו בפעם הקודמת.' },
          { who: 'אופיר', text: 'בפעם הקודמת הייתי יותר רזה.' },
          { who: 'עמית', text: 'גם התמונה.' },
          { who: 'מתוקי', text: 'מי מצלם?' },
          { who: 'פוגי', text: 'הפעם אתה בפנים. נמצא על מה להניח את המצלמה.' },
        ],
        choices: [
          {
            id: 'metuki',
            text: '(להכניס את מתוקי לתמונה.)',
            then: [
              { e: 'flag', flag: 'd10:photo' },
              { e: 'flag', flag: 'own:photo:group2010' },
              { e: 'rel', who: 'metuki', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'מתוקי: "להביא משהו?" — "נעליים." — "אני אשאל שוב כדי להיות בטוח."', tone: 'plain' },
            ],
          },
          {
            id: 'wait',
            text: '"מחכים שכולם יאשרו. נעשה את זה שבוע הבא."',
            then: [
              { e: 'flag', flag: 'd10:photo' },
              { e: 'skill', skill: 'organization', delta: 2, why: 'מי אישר ומי לא' },
              { e: 'toast', text: 'עמית: "אז באמת מחכים לאישור?" — "למדתי משהו מהקלסר."', tone: 'plain' },
            ],
          },
          {
            id: 'who-came',
            text: '(לצלם את מי שבא. בלי להוסיף, בלי להוריד.)',
            then: [
              { e: 'flag', flag: 'd10:photo' },
              { e: 'flag', flag: 'own:photo:group2010' },
              { e: 'personality', key: 'honesty', delta: 2 },
              { e: 'toast', text: 'אפי: "לא נוסיף אחר כך אנשים שלא באו." — "גם לא נוריד."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'd10-math',
    nameHe: 'עמית',
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'מתמטית יש כאן—' },
          { who: 'אופיר', text: 'לא.' },
          { who: 'עמית', text: 'עוד לא אמרתי כלום.' },
          { who: 'קובי', text: 'בגלל זה עצרו אותך בזמן.' },
          { who: 'פוגי', text: 'רגע, תן לראות.' },
        ],
        choices: [
          {
            id: 'check',
            text: '(לבדוק שתי עובדות. רק שתיים.)',
            then: [
              { e: 'flag', flag: 'd10:math' },
              { e: 'time', minutes: 15 },
              // `documentation` בתסריט → `knowledge` במנוע
              { e: 'skill', skill: 'knowledge', delta: 2, why: 'תנאי, לא תחזית' },
              { e: 'toast', text: 'עמית: "זה תנאי, לא תחזית." — "תכתוב את זה גדול. בשבילנו."', tone: 'plain' },
            ],
          },
          {
            id: 'leave-it',
            text: '"תשאיר לו את החישוב. אני מסתכל על המשחק הבא."',
            then: [
              { e: 'flag', flag: 'd10:math' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'קובי: "החלטה בריאה." — "ממך?"', tone: 'plain' },
            ],
          },
          {
            id: 'banner',
            text: '(לעזור לאופיר עם הבד.)',
            then: [
              { e: 'flag', flag: 'd10:math' },
              { e: 'time', minutes: 30 },
              { e: 'energy', delta: -10 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'בד שצריך להרים' },
              /**
               * `terrace.delivery2010` בתסריט → `group_delivered` במנוע.
               * בד שהורם ביציע הוא עבודה שקבוצה קיבלה, והקהל שראה אותה הוא שער 5.
               */
              { e: 'proof', kind: 'group_delivered', proofId: 'group_delivered:{chapter}:banner', subjectHe: 'הבד של 2010', audience: 'gate5', delta: 3 },
              { e: 'toast', text: 'אופיר: "יש בד שצריך להרים." — "לזה יש נוסחה?"', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'd10-derby',
    nameHe: 'אופיר',
    branches: [
      {
        lines: [
          { who: null, text: 'הדרבי נגמר. אפס אפס.' },
          { who: 'אופיר', text: 'זהו.' },
          { who: 'עמית', text: 'זה לא זהו.' },
          { who: 'אופיר', text: 'תן לי להגיד זהו חמש דקות.' },
          { who: 'פוגי', text: 'חמש. אחר כך נוסעים הביתה.' },
          { who: 'קרן', text: 'מי מכם זוכר שמחר צריך לקום?' },
        ],
        choices: [
          {
            id: 'walk',
            text: '(ללכת ליד אופיר. בלי לעודד.)',
            then: [
              { e: 'flag', flag: 'd10:derby' },
              { e: 'time', minutes: 20 },
              { e: 'rel', who: 'ofir', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'אופיר: "אל תעודד אותי." — "לא תכננתי. אני רק הולך לידך."', tone: 'plain' },
            ],
          },
          {
            id: 'home',
            text: '"אני הולך. מחר צריך לקום."',
            then: [
              { e: 'flag', flag: 'd10:derby' },
              { e: 'wellbeing', key: 'exhaustion', delta: -5 },
              { e: 'toast', text: 'קרן: "אז תגיד שאתה הולך. אל תמציא כאב ראש."', tone: 'plain' },
            ],
          },
          {
            id: 'check',
            text: '(לבדוק מה באמת נשאר. בלי סימני קריאה.)',
            then: [
              { e: 'flag', flag: 'd10:derby' },
              { e: 'skill', skill: 'knowledge', delta: 2, why: 'מה נשאר, בלי לנחש' },
              { e: 'toast', text: 'עמית: "בלי סימני קריאה?" — "היום נגמרו."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'd10-cup',
    nameHe: 'אפי',
    branches: [
      {
        lines: [
          { who: 'אפי', text: 'אתם מדברים רק על שבת.' },
          { who: 'פוגי', text: 'ומה אתה מציע?' },
          { who: 'אפי', text: 'שיש היום גביע.' },
          { who: 'קובי', text: 'פעם היינו מחכים שנים בשביל להגיד את המשפט הזה.' },
          { who: 'עמית', text: 'יש לי נתונים—' },
        ],
        choices: [
          {
            id: 'go',
            text: '(ללכת לגמר, עם אבא.)',
            then: [
              { e: 'flag', flag: 'd10:cup' },
              { e: 'time', minutes: 90 },
              { e: 'energy', delta: -8 },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'ending', id: 'there' },
            ],
          },
          {
            id: 'tv',
            text: '(לראות מהסלון, עם אופיר.)',
            then: [
              { e: 'flag', flag: 'd10:cup' },
              { e: 'time', minutes: 90 },
              { e: 'energy', delta: -5 },
              { e: 'rel', who: 'ofir', axis: 'bond', delta: 3 },
              { e: 'presence', mode: 'television' },
              { e: 'toast', text: 'אופיר: "מי קופץ ראשון מפיל את השולחן." — "תזיז אותו עכשיו."', tone: 'plain' },
              { e: 'ending', id: 'screen' },
            ],
          },
          {
            id: 'later',
            text: '"תגיד לי כשזה נגמר. לא באמצע."',
            then: [
              { e: 'flag', flag: 'd10:cup' },
              { e: 'presence', mode: 'late' },
              { e: 'ending', id: 'late' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'd10-plan',
    nameHe: 'אולי',
    branches: [
      {
        lines: [
          { who: 'אולי', text: 'מי בא איתנו?' },
          { who: 'פוגי', text: 'כולם בסדר.' },
          { who: 'אולי', text: 'לא שאלתי מה שלומם.' },
          { who: 'עמית', text: 'אני צריך לדעת איך חוזרים.' },
          { who: 'אופיר', text: 'אחרי האליפות.' },
          { who: 'אולי', text: 'יופי. זה לא כתוב בלוח האוטובוסים.' },
        ],
        choices: [
          {
            id: 'venue',
            text: '(לסגור רשימה: מי עולה, מי חוזר, ואיך.)',
            // כרטיס לטדי ב-2010 — התסריט כותב 120 ₪, וזה פי שניים מ-`TICKET['00s']` (60),
            // כי משחק אליפות באחרון הוא לא משחק רגיל. מספר שנוקב בעובדה על העולם ולא בשכר.
            when: { minAgorot: 12000 },
            noteHe: 'אין לך כסף לכרטיס.',
            then: [
              { e: 'flag', flag: 'd10:plan' },
              { e: 'flagValue', flag: 'd10:mode', value: 'venue' },
              { e: 'flag', flag: 'promise:return2010' },
              { e: 'time', minutes: 30 },
              { e: 'money', agorot: -12000, why: 'כרטיס לטדי' },
              { e: 'skill', skill: 'organization', delta: 3, why: 'אף אחד לא מנחש' },
              { e: 'rel', who: 'uli', axis: 'trust', delta: 3 },
              { e: 'toast', text: 'אולי: "אם מישהו נשאר, הוא אומר. אף אחד לא מנחש." — "סיכמנו."', tone: 'plain' },
            ],
          },
          {
            id: 'kobi',
            text: '"אני רואה עם אבא. בסלון."',
            then: [
              { e: 'flag', flag: 'd10:plan' },
              { e: 'flagValue', flag: 'd10:mode', value: 'home' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'קובי: "תשב כבר. אתה מסתיר עוד לפני שהתחיל."', tone: 'plain' },
            ],
          },
          {
            id: 'remote',
            text: '"תעדכן אותי. הכול, בלי \'תקשיב\'."',
            then: [
              { e: 'flag', flag: 'd10:plan' },
              { e: 'flagValue', flag: 'd10:mode', value: 'remote' },
              { e: 'toast', text: 'עמית: "תוצאה בלבד או הכול?" — "הכול."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'd10-title',
    nameHe: 'עמית',
    where: 'טדי',
    branches: [
      {
        lines: [
          { who: null, text: 'שבת. שני מגרשים, ואחד מהם הוא שלך.' },
          { who: 'עמית', text: 'יש עדכון.' },
          { who: 'אופיר', text: 'אל תגיד לפני שבדקת.' },
          { who: 'פוגי', text: 'זה אתה אומר?' },
          { who: 'אופיר', text: 'למדתי. כואב, אבל למדתי.' },
          { who: 'קובי', text: 'תראו את המשחק שלכם רגע.' },
        ],
        choices: [
          {
            id: 'ours',
            text: '(להסתכל על המשחק שלנו. רק עליו.)',
            then: [
              { e: 'flag', flag: 'd10:title' },
              { e: 'rel', who: 'amit', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'עמית: "כשיהיה משהו ודאי אני אגיד." — "הפעם אני מאמין לזה."', tone: 'plain' },
            ],
          },
          {
            id: 'verify',
            text: '"רגע. זאת הודעה ישנה."',
            then: [
              { e: 'flag', flag: 'd10:title' },
              { e: 'skill', skill: 'knowledge', delta: 3, why: 'עדכון ישן הוא לא עדכון' },
              { e: 'toast', text: 'אופיר: "אז אל תרים אותי בשביל הודעה ישנה."', tone: 'plain' },
            ],
          },
          {
            id: 'beside',
            text: '(להישאר ליד אבא.)',
            then: [
              { e: 'flag', flag: 'd10:title' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'קובי: "אל תעזוב רגע." — "אני פה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'd10-call',
    nameHe: 'אופיר',
    where: 'טדי',
    branches: [
      {
        lines: [
          { who: null, text: 'השריקה. אלופים.' },
          { who: 'פוגי', text: 'אני לא יודע למי להתקשר.' },
          { who: 'אופיר', text: 'למי שאתה רוצה.' },
          { who: 'פוגי', text: 'כולם מתקשרים.' },
          { who: 'אופיר', text: 'אז פעם אחת לא עמית יחליט לפי טבלה.' },
        ],
        choices: [
          {
            id: 'kobi',
            text: '(להתקשר לאבא.)',
            then: [
              { e: 'flag', flag: 'd10:call' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'remember', who: 'kobi', eventId: 'first-call-2010', significance: 'major' },
              { e: 'toast', text: '"אבא?" — "ראיתי." — "אני לא יודע מה להגיד." — "אז אל תגיד. תשאיר רגע."', tone: 'plain' },
            ],
          },
          {
            id: 'efi',
            text: '(להתקשר לאפי.)',
            then: [
              { e: 'flag', flag: 'd10:call' },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'remember', who: 'efi', eventId: 'first-call-2010', significance: 'major' },
              { e: 'toast', text: 'אפי: "אני שומע אתכם עד לפה." — "רציתי שתהיה רגע בפנים."', tone: 'plain' },
            ],
          },
          {
            id: 'here',
            text: '(להכניס את הטלפון לכיס.)',
            then: [
              { e: 'flag', flag: 'd10:call' },
              { e: 'rel', who: 'ofir', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'אופיר: "תכניס את הטלפון לכיס." — "הוא נפל כבר פעמיים."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  /**
   * מי נשאר מאחור — **ההבטחה של `d10-plan` נבדקת כאן**, ורק למי שהבטיח.
   *
   * מי שראה מהסלון או מרחוק לא הבטיח שום חזרה, ולכן הענף שלו הוא ערב מקומי ולא
   * בדיקה — "לא צריך לאסוף אותנו מאף חניה". מבחן על הבטחה שלא ניתנה הוא עונש על
   * משהו שלא קרה.
   */
  {
    id: 'd10-back',
    nameHe: 'אולי',
    where: 'ביציאה מטדי',
    branches: [
      {
        when: { flag: 'promise:return2010' },
        lines: [
          { who: 'אולי', text: 'עמית איפה?' },
          { who: 'אופיר', text: 'עם כולם.' },
          { who: 'אולי', text: 'שוב המילה הזאת.' },
          { who: 'פוגי', text: 'רגע. אני מתקשר.' },
          { who: 'עמית', text: 'אני ליד הרכב. אתם ליד "כולם".' },
        ],
        choices: [
          {
            id: 'keep',
            text: '(ללכת לרכב. עכשיו.)',
            then: [
              { e: 'flag', flag: 'd10:back' },
              { e: 'flagValue', flag: 'd10:return', value: 'kept' },
              { e: 'time', minutes: 30 },
              { e: 'energy', delta: -10 },
              { e: 'rel', who: 'amit', axis: 'trust', delta: 5 },
              { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:return', subjectHe: RETURN_PROMISE, noteHe: 'הגיע לרכב לפני שמישהו התחיל לחפש.' },
              { e: 'toast', text: 'עמית: "חשבתי שאצטרך לרדוף אחריך." — "גם אני. החלטתי להפתיע."', tone: 'plain' },
            ],
          },
          {
            id: 'change',
            text: '"אולי, קח את עמית. אני חוזר אחרת, ויש לי סיכום."',
            // מונית חזרה מטדי — 80 ₪, כפי שהתסריט כתב. גם זה מחיר ולא שכר.
            when: { minAgorot: 8000 },
            noteHe: 'אין לך כסף למונית.',
            then: [
              { e: 'flag', flag: 'd10:back' },
              { e: 'flagValue', flag: 'd10:return', value: 'renegotiated' },
              { e: 'time', minutes: 30 },
              { e: 'money', agorot: -8000, why: 'מונית מטדי' },
              { e: 'proof', kind: 'promise_renegotiated', proofId: 'promise_renegotiated:{chapter}:return', subjectHe: RETURN_PROMISE, noteHe: 'שינה את התוכנית לפני, ובקול.' },
              /**
               * **אותו `proofId` כמו בענף שמעליו, ובכוונה.**
               *
               * זו אותה הבטחה שקוימה, לא שנייה. `tests/life-ledger` סופר ראיות לפי
               * מזהה ודורש שלכל מזהה יהיה נושא משלו — *"להבטיח את אותו דבר ארבע פעמים
               * זו הבטחה אחת"* — ושני מזהים על "החזרה מטדי" היו הופכים לילה אחד לשתי
               * הבטחות בפנקס של `ACH_RELIABLE`. שני הענפים סוגרים את אותה הבטחה בשתי
               * דרכים, ורק אחד מהם רץ בחיים אחד.
               */
              { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:return', subjectHe: RETURN_PROMISE, noteHe: 'שינה את הדרך מראש, והגיע בה.' },
              { e: 'toast', text: 'אולי: "אני לוקח את עמית. אתה מאשר שאתה חוזר אחרת?" — "כן, יש לי סיכום. לא ״יהיה בסדר״."', tone: 'plain' },
            ],
          },
          {
            id: 'forget',
            text: '(להישאר עם כולם.)',
            then: [
              { e: 'flag', flag: 'd10:back' },
              { e: 'flagValue', flag: 'd10:return', value: 'broken' },
              { e: 'rel', who: 'amit', axis: 'bond', delta: -4 },
              { e: 'rel', who: 'amit', axis: 'trust', delta: -8 },
              { e: 'wellbeing', key: 'regret', delta: 6 },
              { e: 'toast', text: 'עמית: "בסוף הסתדרתי. זה לא אומר שזה היה בסדר."', tone: 'red' },
            ],
          },
        ],
      },
      {
        lines: [
          { who: 'קובי', text: 'לא צריך לאסוף אותנו מאף חניה.' },
          { who: 'פוגי', text: 'רק לעזור לסדר את השולחן.' },
        ],
        then: [{ e: 'flag', flag: 'd10:back' }, { e: 'flagValue', flag: 'd10:return', value: 'home' }],
      },
    ],
  },
  {
    id: 'd10-morning',
    nameHe: 'רחל',
    branches: [
      {
        lines: [
          { who: 'רחל', text: 'אכלת משהו?' },
          { who: 'פוגי', text: 'אמא, לקחנו דאבל.' },
          { who: 'רחל', text: 'שמעתי. שאלתי אם אכלת.' },
          { who: 'פוגי', text: 'לא יודע.' },
          { who: 'רחל', text: 'אז תתחיל מזה. את הטבלה נסדר אחר כך.' },
        ],
        choices: [
          {
            id: 'sit',
            text: '(לשבת איתה ולספר.)',
            then: [
              { e: 'flag', flag: 'd10:morning' },
              { e: 'time', minutes: 15 },
              { e: 'rel', who: 'rachel', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'רחל: "עכשיו, מה אתה זוכר?" — "את מי שהיה איתי."', tone: 'plain' },
            ],
          },
          /**
           * **רחל אינה נותנת מחילה במקום עמית** — זו השורה של התסריט, והיא הסיבה שהבחירה
           * הזאת פונה אל עמית ולא אליה. היא מופיעה רק למי שהשאיר אותו מאחור: הודאה על
           * משהו שלא קרה היא דרמה בלי סיבה.
           */
          {
            id: 'amit',
            text: '(להתקשר לעמית ולהגיד מה קרה.)',
            when: { flagIs: { flag: 'd10:return', value: 'broken' } },
            hidden: true,
            then: [
              { e: 'flag', flag: 'd10:morning' },
              { e: 'rel', who: 'amit', axis: 'bond', delta: 1 },
              { e: 'personality', key: 'honesty', delta: 3 },
              { e: 'toast', text: 'עמית: "קודם תגיד מה קרה." — "אמרתי שאדאג לחזרה ולא דאגתי."', tone: 'plain' },
            ],
          },
          {
            id: 'sleep',
            text: '(ללכת לישון עוד קצת.)',
            then: [
              { e: 'flag', flag: 'd10:morning' },
              { e: 'energy', delta: 25 },
              { e: 'wellbeing', key: 'exhaustion', delta: -10 },
              { e: 'toast', text: 'רחל: "לך. הסיפור לא בורח." — "הפעם אני יודע."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'd10-close',
    nameHe: null,
    branches: [
      { when: { flagIs: { flag: 'd10:return', value: 'kept' } }, lines: [{ who: null, text: 'הרשימה של אולי נשארה ברכב. וי ליד כל שם.' }], then: [{ e: 'ending', id: 'kept' }] },
      { when: { flagIs: { flag: 'd10:return', value: 'renegotiated' } }, lines: [{ who: null, text: 'המונית עצרה ליד הבית, בדיוק כמו שאמרת לאולי.' }], then: [{ e: 'ending', id: 'renegotiated' }] },
      { when: { flagIs: { flag: 'd10:return', value: 'broken' } }, lines: [{ who: null, text: 'במטבח זה עוד ישב שם.' }], then: [{ e: 'ending', id: 'broken' }] },
      { lines: [{ who: null, text: 'השלט נשאר על השולחן כל הערב.' }], then: [{ e: 'ending', id: 'home' }] },
    ],
  },
]

/** הסגירה של החלק השני — על השעון, אחרי הבוקר (כלל 67) */
BEATS_TEDDY.push({
  id: 'd10-close',
  trigger: 'clock',
  when: { all: [{ flag: 'd10:morning' }], none: [{ flag: 'd10:done' }] },
  delayMs: 1000,
  do: [{ a: 'flag', flag: 'd10:done' }, { a: 'talk', conversation: 'd10-close' }],
})
