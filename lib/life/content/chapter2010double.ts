import type { LifeEvent } from '../events'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { ChoiceDef, Conversation } from './script'
import type { Condition } from '../world/types'
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

/**
 * ============================================ דלתא 90 — תוכנית לפני הערב הכי גדול ====
 *
 * `NARRATIVE-QUEST-DESIGN-PASS-v2` §7 (2010, HIGH-PRIORITY EXPAND): *"I made a plan before
 * the biggest night, the night exploded, and then I had to live with what I promised."*
 * עד היום התוכנית הייתה משפט אחד (*"לסגור רשימה: מי עולה, מי חוזר, ואיך"*) שגבה כרטיס,
 * נתן ארגון ואמון והרים הבטחה — כלומר השחקן **אמר** שהלוגיסטיקה נעשתה. עכשיו:
 *
 * `מי בא (אולי) → המקום האחרון ברכב: אופיר (איסוף מהמשרד בשלוש וחצי) או מתוקי (להוריד
 *  בצד השני בחזרה) → הכסף ביד של אולי (כרטיס ודלק) → עמית: "איך חוזרים?" — להבטיח, או
 *  להגיד את האמת → [איסוף] → המשחק, בלי שום ממשק → השריקה → הכאוס (סוללה אחת, הכיכר,
 *  מתוקי נבלע) → לקיים / לשנות מראש, ובקול / לשכוח → התגובה ברכב → המטבח בבוקר`
 *
 * שלושת הצעדים הראשונים הם דברים שעומדים ברחוב (`world/scenes.ts`, `d10-roster` /
 * `d10-pay` / `d10-promise`), כל אחד נדלק כשהקודם נעשה; המשחק עצמו נשאר כרטיס וזמן, כמו
 * שהיה, והשאלה היחידה אחרי השריקה היא ההבטחה. **התגמול ניתן בתגובה** (`d10-car`), כשעמית
 * רואה אותך מגיע — לא בבחירה. והתוצאה נשארת בחיים (`life:teddy2010`), כדי שפרק מאוחר יזכור.
 *
 * ובחלק הראשון: הבד של אופיר נצבע בידיים ליד הקיוסק (`chore:story:banner-10`), והראיה
 * `group_delivered` נרשמת כשהבד **עולה ביציע** (`d10-banner`), לא כשאמרת שתעזור.
 */

export const PORTRAIT_2010: Record<string, string> = {
  ...PORTRAIT_FOUNDING,
}

/** הנושא של ההבטחה — אותו משפט בדיוק בשני הצדדים, כי זה מה שהמנוע מצליב (כלל 59) */
const RETURN_PROMISE = 'החזרה מטדי'

/** מה שנשאר מהלילה הזה בחיים — `kept` / `renegotiated` / `broken` / `unpromised` / `home` */
export const TEDDY_2010 = 'life:teddy2010'

/** כרטיס לטדי ב-2010 — 120 ₪ (התסריט; פי שניים מ-`TICKET['00s']`, כי זה משחק אליפות באחרון) + 20 דלק לאולי */
const TICKET_TEDDY = 12000
const FUEL_SHARE = 2000
/** מונית חזרה מטדי — 80 ₪, כפי שהתסריט כתב. גם זה מחיר ולא שכר. */
const TAXI_TEDDY = 8000

const VENUE: Condition = { flagIs: { flag: 'd10:mode', value: 'venue' } }

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
  /**
   * הבד עולה ביציע — רק אם נצבע עד הסוף (`d10:banner-full`), ולפני שהדרבי נסגר. הוא
   * ראשון ברשימה כדי שלא יורעב ע"י הדרבי, ושומר על עצמו בדגל שלו (כלל 42).
   */
  { id: 'd10-banner', trigger: 'clock', when: { all: [{ flag: 'd10:banner-full' }], none: [{ flag: 'd10:bannerUp' }, { flag: 'd10:derby' }] }, delayMs: 900, do: [{ a: 'talk', conversation: 'd10-banner' }] },
  /** הדרבי והגמר הם רגעים, לא חדרים — שניהם על השעון (כלל 67); כרטיס הוא חתך של יום */
  { id: 'd10-derby', trigger: 'clock', when: { all: [{ flag: 'd10:math' }], none: [{ flag: 'd10:derby' }, { all: [{ flag: 'd10:banner-full' }], none: [{ flag: 'd10:bannerUp' }] }] }, delayMs: 1200, do: [{ a: 'card', titleHe: 'הדרבי', subHe: '8.5.2010', ms: 2000 }, { a: 'talk', conversation: 'd10-derby' }] },
  { id: 'd10-cup', trigger: 'clock', when: { all: [{ flag: 'd10:derby' }], none: [{ flag: 'd10:cup' }] }, delayMs: 1400, do: [{ a: 'card', titleHe: 'גמר הגביע', subHe: '11.5.2010', ms: 2000 }, { a: 'talk', conversation: 'd10-cup' }] },
]

// ------------------------------------------------------------------ Part II ------

export function objectiveTeddy(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['d10:plan']) {
    if (state.flags['d10:mode'] !== 'venue') return sceneId === 'street' ? null : 'אולי ליד הרכב. מי בא איתו?'
    if (!state.flags['d10:seated']) return 'הרשימה של אולי, על הגג של הרכב. מקום אחד נשאר.'
    if (!state.flags['d10:paid']) return 'אולי מחכה לכסף — כרטיס ודלק.'
    return 'עמית רוצה לדעת איך חוזרים.'
  }
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
  unpromised: {
    id: 'unpromised',
    titleHe: 'לא הבטחת, ואמרת',
    bodyHe:
      'דאבל. לא הבטחת לעמית חזרה, ואמרת את זה לפני — אז הוא סגר עם אולי ולא חיכה לך. לא הייתה אכזבה, כי לא היה על מה. זה פחות מחייב, וזה גם פחות.',
    memoryHe: 'כרטיס לטדי, בלי קמט.',
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

/**
 * §6 — *"A2 promise to bring bread before five → young adult promises a pickup after Teddy"*.
 * The bread of 1984 is in the ledger as proofs (`promise_renegotiated` when he named the hour,
 * `promise_kept` when the loaf was on the counter in time — `chapterStageA.ts`), and they cross
 * every chapter. The day flag this raises is only what `d10-promise` remembers of it, in
 * Pugi's own head: nobody in the street knows about a loaf of bread from 1984.
 */
function breadMemory(state: LifeState): LifeEvent[] {
  const bread = (kind: string) => state.proofs.some((row) => row.proofId.startsWith(`${kind}:`) && row.proofId.endsWith(':bread'))
  if (bread('promise_kept')) return [{ t: 'flag.raised', flag: 'd10:bread-kept' }]
  if (bread('promise_renegotiated')) return [{ t: 'flag.raised', flag: 'd10:bread-late' }]
  return []
}

export const BEATS_TEDDY: Beat[] = [
  /** המחויבות — מצב, ועוד לא תוכנית. היא שומרת על עצמה בשני הדגלים, ולכן חוזרת עד שנענתה */
  {
    id: 'd10-plan',
    at: 'street',
    trigger: 'enter',
    when: { none: [{ flag: 'd10:plan' }, { flag: 'd10:mode' }] },
    delayMs: 700,
    do: [{ a: 'derive', events: breadMemory }, { a: 'talk', conversation: 'd10-plan' }],
  },
  /** האיסוף מהמשרד — נסיעה שגרתית, דחוסה לכרטיס ושלוש שורות (§7: "compress routine travel") */
  {
    id: 'd10-pickup',
    trigger: 'clock',
    when: { all: [{ flag: 'd10:plan' }, { flag: 'd10:needsPickup' }, VENUE], none: [{ flag: 'd10:pickedUp' }] },
    delayMs: 1200,
    do: [{ a: 'flag', flag: 'd10:pickedUp' }, { a: 'card', titleHe: 'המשרד של אופיר', subHe: '15:40', ms: 2200 }, { a: 'talk', conversation: 'd10-pickup' }],
  },
  // D06 — טדי אינו מצויר: כרטיס שאומר לאן נסענו, ותג מקום בתיבה לאורך שלוש השיחות שם
  {
    id: 'd10-title',
    trigger: 'clock',
    when: {
      all: [{ flag: 'd10:plan' }, { any: [{ notFlag: 'd10:needsPickup' }, { flag: 'd10:pickedUp' }, { none: [VENUE] }] }],
      none: [{ flag: 'd10:title' }],
    },
    delayMs: 1400,
    do: [{ a: 'card', titleHe: 'שבת', subHe: 'טדי', ms: 2400 }, { a: 'talk', conversation: 'd10-title' }],
  },
  { id: 'd10-call', trigger: 'clock', when: { all: [{ flag: 'd10:title' }], none: [{ flag: 'd10:call' }] }, delayMs: 1200, do: [{ a: 'card', titleHe: 'השריקה', subHe: 'אלופים', ms: 1800 }, { a: 'talk', conversation: 'd10-call' }] },
  /** הסיבוך — הלילה מתפוצץ. רק למי שנסע; מי שבסלון לא צריך לאסוף אף אחד מאף חניה */
  { id: 'd10-chaos', trigger: 'clock', when: { all: [{ flag: 'd10:call' }, VENUE], none: [{ flag: 'd10:chaos' }] }, delayMs: 900, do: [{ a: 'flag', flag: 'd10:chaos' }, { a: 'talk', conversation: 'd10-chaos' }] },
  {
    id: 'd10-back',
    trigger: 'clock',
    when: { all: [{ flag: 'd10:call' }, { any: [{ flag: 'd10:chaos' }, { none: [VENUE] }] }], none: [{ flag: 'd10:back' }] },
    delayMs: 1200,
    do: [{ a: 'talk', conversation: 'd10-back' }],
  },
  /** ברכב — העולם מגיב למה שנעשה עם ההבטחה, והראיה נרשמת כאן (§13) */
  { id: 'd10-car', trigger: 'clock', when: { all: [{ flag: 'd10:back' }, VENUE], none: [{ flag: 'd10:carDone' }] }, delayMs: 1000, do: [{ a: 'talk', conversation: 'd10-car' }] },
  {
    id: 'd10-morning',
    at: 'kitchen',
    trigger: 'enter',
    when: { all: [{ flag: 'd10:back' }, { any: [{ flag: 'd10:carDone' }, { none: [VENUE] }] }], none: [{ flag: 'd10:morning' }] },
    delayMs: 700,
    do: [{ a: 'talk', conversation: 'd10-morning' }],
  },
]

// -------------------------------------------------------------- conversations ------

const TITLE_CHOICES: ChoiceDef[] = [
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
]

const TITLE_LINES = [
  { who: null, text: 'שבת. שני מגרשים, ואחד מהם הוא שלך.' },
  { who: 'עמית', text: 'יש עדכון.' },
  { who: 'אופיר', text: 'אל תגיד לפני שבדקת.' },
  { who: 'פוגי', text: 'זה אתה אומר?' },
  { who: 'אופיר', text: 'למדתי. כואב, אבל למדתי.' },
  { who: 'קובי', text: 'תראו את המשחק שלכם רגע.' },
]

const PROMISE_LINES = [
  { who: 'עמית', text: 'אני צריך לדעת איך חוזרים. בשש בבוקר אני בעבודה.' },
  { who: 'פוגי', text: 'אחרי האליפות?' },
  { who: 'עמית', text: 'במיוחד אחרי.' },
]

const PROMISE_CHOICES: ChoiceDef[] = [
  {
    id: 'promise',
    text: '"מהשריקה — ישר לרכב. אני מביא אותך הביתה."',
    then: [
      { e: 'flag', flag: 'd10:plan' },
      { e: 'flag', flag: 'promise:return2010' },
      { e: 'toast', text: 'עמית: "רשמתי." — "אתה לא רושם." — "הפעם כן."', tone: 'plain' },
    ],
  },
  {
    id: 'honest',
    text: '"אני לא מבטיח מה שאני לא יודע. תסגור חזרה עם אולי, לא איתי."',
    then: [
      { e: 'flag', flag: 'd10:plan' },
      { e: 'flag', flag: 'd10:unpromised' },
      { e: 'personality', key: 'honesty', delta: 2 },
      { e: 'toast', text: 'עמית: "לפחות אמרת לפני. זה כבר משהו."', tone: 'plain' },
    ],
  },
]

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
            /**
             * (דלתא 90) הבד נצבע בידיים, על המדרכה ליד הקיוסק (`chore:story:banner-10`), וזה
             * מה שמרים את `d10:math`. הראיה — `terrace.delivery2010` בתסריט →
             * `group_delivered` במנוע — נרשמת רק כשהבד עולה ביציע (`d10-banner`).
             */
            id: 'banner',
            text: '(לעזור לאופיר עם הבד.)',
            then: [{ e: 'minigame', id: 'chore:story:banner-10' }],
          },
        ],
      },
    ],
  },
  {
    /** הבד עולה — ומה שנצבע ליד הקיוסק הוא מה ששער 5 רואה */
    id: 'd10-banner',
    nameHe: 'אופיר',
    where: 'בלומפילד, שער 5',
    branches: [
      {
        lines: [
          { who: null, text: 'בשער 5 הבד עלה, והאותיות שצבעת על המדרכה החזיקו גם מרחוק.' },
          { who: 'אופיר', text: 'רואה? לזה אין נוסחה.' },
        ],
        then: [
          { e: 'flag', flag: 'd10:bannerUp' },
          { e: 'proof', kind: 'group_delivered', proofId: 'group_delivered:{chapter}:banner', subjectHe: 'הבד של 2010', audience: 'gate5', delta: 3 },
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
            /**
             * (דלתא 90) ההתחייבות, ולא התוכנית. הרשימה, הכסף והחזרה נעשים ברחוב, אחד
             * אחרי השני. הכסף נבדק כבר כאן — מגבלה צריכה להיות מובנת לפני שהיא עולה (§15).
             */
            id: 'venue',
            text: '(לסגור רשימה: מי עולה, מי חוזר, ואיך.)',
            when: { minAgorot: TICKET_TEDDY + FUEL_SHARE },
            noteHe: 'אין לך כסף לכרטיס ודלק.',
            then: [
              { e: 'flagValue', flag: 'd10:mode', value: 'venue' },
              { e: 'toast', text: 'אולי: "אם מישהו נשאר, הוא אומר. אף אחד לא מנחש."', tone: 'plain' },
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
    /** המקום האחרון ברכב — שתי אפשרויות, ולכל אחת מחיר שכתוב לידה לפני שבוחרים */
    id: 'd10-roster',
    nameHe: 'אולי',
    branches: [
      {
        lines: [
          { who: 'אולי', text: 'ארבעה מקומות. אני נוהג, אתה לידי, עמית מאחורה — הוא צריך לדעת איך חוזרים.' },
          { who: 'אולי', text: 'נשאר מקום אחד. אני לא מחליט בשבילך.' },
        ],
        choices: [
          {
            id: 'ofir',
            text: '(אופיר. יוצא מהעבודה בשלוש וחצי — לאסוף אותו מהמשרד בדרך.)',
            then: [
              { e: 'flagValue', flag: 'd10:seat', value: 'ofir' },
              { e: 'flag', flag: 'd10:seated' },
              { e: 'flag', flag: 'd10:needsPickup' },
              { e: 'toast', text: 'אופיר: "שלוש וחצי. אני יוצא עם העניבה ביד." — מתוקי ייסע באוטובוס.', tone: 'plain' },
            ],
          },
          {
            id: 'metuki',
            text: '(מתוקי. גר בצד השני של העיר — להוריד אותו בדרך חזרה.)',
            then: [
              { e: 'flagValue', flag: 'd10:seat', value: 'metuki' },
              { e: 'flag', flag: 'd10:seated' },
              { e: 'toast', text: 'מתוקי: "להוריד אותי זה עשרים דקות. אני אזכיר לך." — אופיר ייסע באוטובוס.', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    /** הכסף עובר ביד — או שהמקום עובר למישהו אחר, ואומרים את זה עכשיו */
    id: 'd10-pay',
    nameHe: 'אולי',
    branches: [
      {
        lines: [{ who: 'אולי', text: 'כרטיס מאה עשרים. דלק עשרים לראש. חניה — מה שיוצא.' }],
        choices: [
          {
            id: 'pay',
            text: '(לתת לו מאה ארבעים.)',
            when: { minAgorot: TICKET_TEDDY + FUEL_SHARE },
            noteHe: 'אין לך מאה ארבעים.',
            then: [
              { e: 'money', agorot: -TICKET_TEDDY, why: 'כרטיס לטדי' },
              { e: 'money', agorot: -FUEL_SHARE, why: 'דלק לאולי' },
              { e: 'flag', flag: 'd10:paid' },
              { e: 'toast', text: 'אולי: "סיכמנו." — הוא מקפל את השטרות לתוך הרשימה.', tone: 'plain' },
            ],
          },
          {
            id: 'home',
            text: '(להשאיר את המקום. לראות עם אבא.)',
            then: [
              { e: 'flag', flag: 'd10:plan' },
              { e: 'flagValue', flag: 'd10:mode', value: 'home' },
              { e: 'flag', flag: 'd10:gaveSeat' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'אולי: "אז המקום למי שנשאר ברשימה. טוב שאמרת עכשיו."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    /**
     * ההבטחה — הבגרות של A2 (*"לחם לפני חמש"*): הפעם מישהו צריך לקום בשש לעבודה, והוא
     * שואל עכשיו, לפני, כי אחרי אליפות אף אחד לא שואל. אפשר גם לא להבטיח, ולהגיד את זה.
     */
    id: 'd10-promise',
    nameHe: 'עמית',
    branches: [
      {
        when: { flag: 'd10:bread-kept' },
        lines: [...PROMISE_LINES, { who: null, text: 'פעם, בסמטה, אמרת "לפני חמש" — והלחם היה על השיש. זה היה מזמן. זה אותו משפט.' }],
        choices: PROMISE_CHOICES,
      },
      {
        when: { flag: 'd10:bread-late' },
        lines: [...PROMISE_LINES, { who: null, text: 'פעם, בסמטה, אמרת "לפני חמש", וחמש עברה בלי לחם על השיש. אמא לא כעסה. היא רשמה.' }],
        choices: PROMISE_CHOICES,
      },
      { lines: PROMISE_LINES, choices: PROMISE_CHOICES },
    ],
  },
  {
    id: 'd10-pickup',
    nameHe: 'אופיר',
    where: 'המשרד של אופיר',
    branches: [
      {
        lines: [
          { who: null, text: 'שלוש וארבעים. אופיר יוצא מהבניין עם העניבה ביד ורץ לרכב.' },
          { who: 'אופיר', text: 'הבוס שאל אם זה דחוף. אמרתי שזאת אליפות.' },
          { who: 'אולי', text: 'עכשיו תתפללו לאיילון.' },
        ],
        then: [{ e: 'time', minutes: 25 }],
      },
    ],
  },
  {
    id: 'd10-title',
    nameHe: 'עמית',
    where: 'טדי',
    branches: [
      {
        when: { flagIs: { flag: 'd10:seat', value: 'ofir' } },
        lines: [{ who: null, text: 'הגעתם עם השריקה הראשונה. אופיר עוד מחזיק את העניבה.' }, ...TITLE_LINES],
        choices: TITLE_CHOICES,
      },
      { lines: TITLE_LINES, choices: TITLE_CHOICES },
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
  {
    /** הלילה מתפוצץ — ומה שנבחר ברחוב (מי ברכב) הוא מה שמסתבך עכשיו */
    id: 'd10-chaos',
    nameHe: null,
    where: 'טדי, אחרי',
    branches: [
      {
        when: { flagIs: { flag: 'd10:seat', value: 'ofir' } },
        lines: [
          { who: null, text: 'המגרש מתמלא באנשים. מישהו שר לך בפרצוף, והטלפון מראה פס אחד של סוללה.' },
          { who: 'אופיר', text: 'אף אחד לא נוסע עכשיו. כולם בכיכר.' },
        ],
      },
      {
        when: { flagIs: { flag: 'd10:seat', value: 'metuki' } },
        lines: [
          { who: null, text: 'המגרש מתמלא באנשים. מישהו שר לך בפרצוף, והטלפון מראה פס אחד של סוללה.' },
          { who: null, text: 'מתוקי היה לידך לפני דקה. עכשיו יש שם עשרים אנשים שאתה לא מכיר.' },
        ],
      },
      { lines: [{ who: null, text: 'המגרש מתמלא באנשים. מישהו שר לך בפרצוף, והטלפון מראה פס אחד של סוללה.' }] },
    ],
  },
  /**
   * מי נשאר מאחור — **ההבטחה של `d10-promise` נבדקת כאן**, ורק למי שהבטיח.
   *
   * מי שראה מהסלון או מרחוק לא הבטיח שום חזרה, ולכן הענף שלו הוא ערב מקומי ולא
   * בדיקה — "לא צריך לאסוף אותנו מאף חניה". מבחן על הבטחה שלא ניתנה הוא עונש על
   * משהו שלא קרה. (דלתא 90) ומי שנסע ואמר מראש שהוא לא מבטיח — גם הוא לא נבחן.
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
            ],
          },
          {
            id: 'change',
            text: '"אולי, קח את עמית. אני חוזר אחרת, ויש לי סיכום."',
            when: { minAgorot: TAXI_TEDDY },
            noteHe: 'אין לך כסף למונית.',
            then: [
              { e: 'flag', flag: 'd10:back' },
              { e: 'flagValue', flag: 'd10:return', value: 'renegotiated' },
              { e: 'time', minutes: 30 },
              { e: 'money', agorot: -TAXI_TEDDY, why: 'מונית מטדי' },
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
        when: { flag: 'd10:unpromised' },
        lines: [
          { who: 'אולי', text: 'עמית איפה?' },
          { who: 'אופיר', text: 'עם כולם.' },
          { who: 'עמית', text: 'אני ליד הרכב. לא הבטחת — אז לא חיכיתי.' },
        ],
        then: [{ e: 'flag', flag: 'd10:back' }, { e: 'flagValue', flag: 'd10:return', value: 'unpromised' }],
      },
      {
        lines: [
          { who: 'קובי', text: 'לא צריך לאסוף אותנו מאף חניה.' },
          { who: 'פוגי', text: 'רק לעזור לסדר את השולחן.' },
        ],
        then: [{ e: 'flag', flag: 'd10:back' }, { e: 'flagValue', flag: 'd10:return', value: 'home' }, { e: 'flagValue', flag: TEDDY_2010, value: 'home' }],
      },
    ],
  },
  {
    /**
     * ברכב — מה שנעשה עם ההבטחה, כפי שעמית רואה אותו. הראיה של ההבטחה נרשמת **כאן**,
     * כשהוא רואה אותך מגיע (או את המונית שסיכמת), ולא ברגע שבחרת ללכת.
     *
     * **אותו `proofId` בשני הענפים שקיימו, ובכוונה.** זו אותה הבטחה שקוימה, לא שנייה.
     * `tests/life-ledger` סופר ראיות לפי מזהה ודורש שלכל מזהה יהיה נושא משלו — *"להבטיח
     * את אותו דבר ארבע פעמים זו הבטחה אחת"* — ושני מזהים על "החזרה מטדי" היו הופכים
     * לילה אחד לשתי הבטחות בפנקס של `ACH_RELIABLE`.
     */
    id: 'd10-car',
    nameHe: 'עמית',
    where: 'ביציאה מטדי',
    branches: [
      {
        when: { all: [{ flagIs: { flag: 'd10:return', value: 'kept' } }, { flagIs: { flag: 'd10:seat', value: 'metuki' } }] },
        lines: [
          { who: 'עמית', text: 'חשבתי שאצטרך לרדוף אחריך.' },
          { who: 'פוגי', text: 'גם אני. החלטתי להפתיע.' },
          { who: null, text: 'את מתוקי מצאתם ליד השער, עם צעיף של מישהו אחר. הורדתם אותו בצד השני של העיר, ועמית נרדם במושב האחורי.' },
        ],
        then: [
          { e: 'flag', flag: 'd10:carDone' },
          { e: 'flagValue', flag: TEDDY_2010, value: 'kept' },
          { e: 'remember', who: 'amit', eventId: 'teddy2010-kept', significance: 'major' },
          { e: 'time', minutes: 20 },
          { e: 'rel', who: 'amit', axis: 'trust', delta: 5 },
          { e: 'rel', who: 'metuki', axis: 'bond', delta: 2 },
          { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:return', subjectHe: RETURN_PROMISE, noteHe: 'הגיע לרכב לפני שמישהו התחיל לחפש.' },
        ],
      },
      {
        when: { flagIs: { flag: 'd10:return', value: 'kept' } },
        lines: [
          { who: 'עמית', text: 'חשבתי שאצטרך לרדוף אחריך.' },
          { who: 'פוגי', text: 'גם אני. החלטתי להפתיע.' },
          { who: null, text: 'אופיר נשאר בכיכר. "תגיד לעמית שהוא מפסיד." עמית אמר שהוא לא.' },
        ],
        then: [
          { e: 'flag', flag: 'd10:carDone' },
          { e: 'flagValue', flag: TEDDY_2010, value: 'kept' },
          { e: 'remember', who: 'amit', eventId: 'teddy2010-kept', significance: 'major' },
          { e: 'rel', who: 'amit', axis: 'trust', delta: 5 },
          { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:return', subjectHe: RETURN_PROMISE, noteHe: 'הגיע לרכב לפני שמישהו התחיל לחפש.' },
        ],
      },
      {
        when: { flagIs: { flag: 'd10:return', value: 'renegotiated' } },
        lines: [
          { who: 'אולי', text: 'אני לוקח את עמית. אתה מאשר שאתה חוזר אחרת?' },
          { who: 'פוגי', text: 'כן, יש לי סיכום. לא "יהיה בסדר".' },
          { who: null, text: 'עמית הרים יד מהחלון האחורי. במונית ספרת את העודף פעמיים.' },
        ],
        then: [
          { e: 'flag', flag: 'd10:carDone' },
          { e: 'flagValue', flag: TEDDY_2010, value: 'renegotiated' },
          { e: 'remember', who: 'amit', eventId: 'teddy2010-renegotiated', significance: 'minor' },
          { e: 'rel', who: 'amit', axis: 'trust', delta: 2 },
          { e: 'proof', kind: 'promise_renegotiated', proofId: 'promise_renegotiated:{chapter}:return', subjectHe: RETURN_PROMISE, noteHe: 'שינה את התוכנית לפני, ובקול.' },
          { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:return', subjectHe: RETURN_PROMISE, noteHe: 'שינה את הדרך מראש, והגיע בה.' },
        ],
      },
      {
        when: { flagIs: { flag: 'd10:return', value: 'broken' } },
        lines: [
          { who: null, text: 'כשהגעת לחניה, הרכב של אולי כבר לא היה שם.' },
          { who: null, text: 'בטלפון, על הפס האחרון: "הסתדרתי."' },
        ],
        then: [{ e: 'flag', flag: 'd10:carDone' }, { e: 'flagValue', flag: TEDDY_2010, value: 'broken' }, { e: 'remember', who: 'amit', eventId: 'teddy2010-broken', significance: 'major' }],
      },
      {
        lines: [{ who: null, text: 'הרכב של אולי יצא בלעדיך, כמו שסיכמתם. חזרת באוטובוס של שתיים, עם כל העיר.' }],
        then: [{ e: 'flag', flag: 'd10:carDone' }, { e: 'flagValue', flag: TEDDY_2010, value: 'unpromised' }],
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
      { when: { flagIs: { flag: 'd10:return', value: 'kept' } }, lines: [{ who: null, text: 'הרשימה של אולי נשארה ברכב. וי ליד כל שם.' }], then: [{ e: 'flag', flag: 'd10:done' }, { e: 'ending', id: 'kept' }] },
      { when: { flagIs: { flag: 'd10:return', value: 'renegotiated' } }, lines: [{ who: null, text: 'המונית עצרה ליד הבית, בדיוק כמו שאמרת לאולי.' }], then: [{ e: 'flag', flag: 'd10:done' }, { e: 'ending', id: 'renegotiated' }] },
      { when: { flagIs: { flag: 'd10:return', value: 'broken' } }, lines: [{ who: null, text: 'במטבח זה עוד ישב שם.' }], then: [{ e: 'flag', flag: 'd10:done' }, { e: 'ending', id: 'broken' }] },
      { when: { flagIs: { flag: 'd10:return', value: 'unpromised' } }, lines: [{ who: null, text: 'הכרטיס נשאר בכיס של המעיל, מקופל פעם אחת.' }], then: [{ e: 'flag', flag: 'd10:done' }, { e: 'ending', id: 'unpromised' }] },
      { lines: [{ who: null, text: 'השלט נשאר על השולחן כל הערב.' }], then: [{ e: 'flag', flag: 'd10:done' }, { e: 'ending', id: 'home' }] },
    ],
  },
]

/** הסגירה של החלק השני — על השעון, אחרי הבוקר (כלל 67); `d10:done` מורם בשיחה, כך שהיא חוזרת אם נסגרה */
BEATS_TEDDY.push({
  id: 'd10-close',
  trigger: 'clock',
  when: { all: [{ flag: 'd10:morning' }], none: [{ flag: 'd10:done' }] },
  delayMs: 1000,
  do: [{ a: 'talk', conversation: 'd10-close' }],
})
