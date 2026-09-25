import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_RETURN } from './chapter2018return'

/**
 * Z01–Z07 · "שני סיפורים באותו צבע" · 2023–2025, בשלושה פרקים.
 *
 * **`2023-tournament`** (Z01–Z03) — היצורניר, הדרבי של 11.6, ומי מחליט כשגדלים.
 * **`2023-quiet`** (Z04–Z05) — מה שאין לו משימה, והמילה שחוזרת ב-2024.
 * **`2025-eurocup`** (Z06–Z07) — מהאולם הקטן לאירופה, ולעלות זה להתחיל שוב.
 *
 * **ארבע שורות ארכיון נקראו היום, וכל אחת נגד המקור שלה:**
 * · 11.6.2023 — הדרבי, 74:112, **המשחק השני בסדרת הגמר, שהשווה אותה 1:1.** הכותרת
 *   והגוף של המקור מסכימים על שני הדברים, והשורה אינה אומרת מילה על מי זכה בסדרה:
 *   *"112:74 משווה סדרה; לא מוצגת אליפות"*, בלשון התסריט.
 * · 2023/24 — ירידה נוספת (RSSSF). אין ערב, אין תאריך.
 * · 2024/25 — אלופת הלאומית ועלייה (RSSSF). גם כאן אין ערב.
 * · 11.4.2025 — 94:103 בגראן קנאריה, 0:2 בסדרה, היורוקאפ. המקור הרשמי נוקב בתוצאה
 *   ובסדרה ולא בתאריך; התאריך מוצלב מול ynet (כלל 77).
 *
 * ---
 *
 * **Z04 — ומה שהיא לא עושה.**
 *
 * הוראת הסצנה, מילה במילה: *"עומר חרמש מוזכר בהתאם לחומר הנצחה שאושר. אין דיאלוג
 * חדש מפיו, נסיבות מומצאות, מנגנון הצלה או הישג שכול. אפשר לדלג על ההצגה בלי
 * השפעת מדדים."* כל חמשת התנאים מתקיימים כאן, והחמישי הוא זה שקל לשבור בטעות:
 * הבחירה "לא עכשיו" **אינה עולה דבר ואינה מקנה דבר** — לא יחסים, לא מדד, לא ראיה.
 * היא שורת דגל ודי.
 *
 * הסצנה אינה מזכירה אותו בשמו, והאדם שמדבר בה הוא **מאיה**, שמתאמת עזרה. מה שהיא
 * מבקשת הוא *"להיות עם מישהו שלא רוצה להיות לבד"*, ומה שהיא אומרת על הזיכרון הוא
 * שלא צריך לסדר אותו עכשיו. זה כל מה שיש כאן, וזה מספיק.
 */

export const PORTRAIT_LATE: Record<string, string> = {
  ...PORTRAIT_RETURN,
  /** מאיה — מתאמת עזרה, בלי פיגורה משלה (כלל 67: ניצב כללי, לא פנים של אדם אחר) */
  'מאיה': 'faceWoman',
}

/** הנסיעה של 2025, במספר של התסריט — מחיר הוא עובדה על העולם ולא שכר (כלל 78) */
const TRIP_2025_AGOROT = 240_000

// ------------------------------------------------------------------- Part I ------

/**
 * ================================================== היצורניר — מפיקים ומשחקים (90-E) ====
 *
 * `NARRATIVE-QUEST-DESIGN-PASS-v2` §7 Stage E: *"squad → invite → one dropout → replace /
 * play short → equipment → pitch → rotating friend choice → short real football action →
 * aftermath"*. עד היום Z01 היה שאלה אחת ששלחה 45 דקות ו-`accepted_rotation` על חילוף
 * שלא קרה. עכשיו:
 *
 * 1. **תפקיד** (`z-role`, מילה במילה) — לשחק, לאמן/לצלם, או רק לבוא אחרי. זו ההתחייבות.
 * 2. **הזמנה** — הטלפון על הספסל: הקבוצה בוואטסאפ, חסרים שניים.
 * 3. **ביטול אחד** (`z-replies`) — מתוקי בא; אפי: "הגב. לא היום." — להחליף (הבן, למי שיש;
 *    רומא בטלפון), או לשחק חסרים ולהחליף כל חמש דקות.
 * 4. **ציוד** — התיק: גופיות, קונוסים, בקבוק לקובי. `chore:story:kit-23` (collect), וכמה
 *    שנאסף הוא מה שיש על הדשא.
 * 5. **מי בחוץ ראשון** (`z-rotate`) — הדף של קובי: "אני אומר לכם מי לפתוח."
 * 6. **משחק** — `FootballScene`, קצר, אמיתי. מי שמאמן/מצלם — צופה מהקו.
 * 7. **אחרי** (`z-after`) — מה שקרה, בשורות של מי שהיה שם: מי יצא, מי נכנס, התוצאה.
 *    `accepted_rotation` רק למי שבאמת יצא ראשון ושיחק אחר כך.
 *
 * ואז הערב (`z-derby`) והמפגש (`z-grow`) — כמו שהיו.
 */
export function objectiveTournament(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['z:role']) return sceneId === 'pitch' ? null : 'במגרש. החבורה מתחממת, ואבא כבר מסדר הרכב.'
  const social = state.flags['z:tournament'] === 'social'
  if (!social && !state.flags['z:after']) {
    if (sceneId !== 'pitch') return 'המגרש. הטורניר לא יתחיל לבד.'
    if (!state.flags['z:invited']) return 'חסרים שניים. הטלפון על הספסל — להודיע לחבורה.'
    if (!state.flags['z:sub']) return 'מחכים לתשובות.'
    if (!state.flags['z:kit']) return 'התיק של הציוד, ליד השער. גופיות, קונוסים, מים לאבא.'
    if (!state.flags['z:kickoff']) return 'הדף של קובי. מי יוצא ראשון.'
    return 'המשחק. ואחריו — מה נשאר ממנו.'
  }
  if (!state.flags['z:derby']) return 'הדרבי. הערב.'
  if (!state.flags['z:grow']) return sceneId === 'community-room' ? null : 'חדר הקהילה. מפגש אוהדים — מדברים על מה שגדל.'
  return null
}

export const ENDINGS_TOURNAMENT: Record<string, EndingCard> = {
  asked: {
    id: 'asked',
    titleHe: 'נבדוק לפני הסיסמה',
    bodyHe:
      'שאלת איזה קול נשאר, ופרדי אמר שזו שאלה שאפשר לבדוק במסמך — ואמרת שנבדוק לפני הסיסמה. אף אחד לא הצביע באותו ערב, וזה היה בדיוק העניין.',
    memoryHe: 'דף עם שלוש שאלות, מסומנות.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  concrete: {
    id: 'concrete',
    titleHe: 'עם שם ומועד',
    bodyHe:
      'תמכת בצמיחה, וביקשת דבר אחד קונקרטי: שיהיה ברור מי אחראי לשירות לאוהדים. יוסף אמר "עם שם ומועד. טוב", ורשם. זה מה שהופך תמיכה להתחייבות.',
    memoryHe: 'שורה אחת בפרוטוקול.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  fan: {
    id: 'fan',
    titleHe: 'למשחק שנבחר',
    bodyHe:
      'אמרת שאתה רוצה להישאר אוהד בלי לעסוק בניהול. אפי שאל אם אתה עדיין בא איתו ואמרת למשחק שנבחר, לא לכל ישיבה — והוא אמר שזה בסדר, ובאמת חשב כך.',
    memoryHe: 'כיסא שנשאר ריק בישיבה.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

export const BEATS_TOURNAMENT: Beat[] = [
  { id: 'z-role', at: 'pitch', trigger: 'enter', when: { none: [{ flag: 'z:role' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'z-role' }] },
  /** התשובות מגיעות אחרי ההודעה — ואחת מהן ביטול. שומר על עצמו ב-`z:sub` (V3 כלל 3) */
  { id: 'z-replies', at: 'pitch', trigger: 'clock', when: { all: [{ flag: 'z:invited' }], none: [{ flag: 'z:sub' }] }, delayMs: 1400, do: [{ a: 'talk', conversation: 'z-replies' }] },
  /** חזרה מהמשחק (`FootballScene` מחזיר למגרש) — או מי שצפה מהקו */
  { id: 'z-after', at: 'pitch', trigger: 'enter', when: { all: [{ flag: 'z:kickoff' }], none: [{ flag: 'z:after' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'z-after' }] },
  {
    id: 'z-derby',
    trigger: 'clock',
    when: { all: [{ flag: 'z:role' }], any: [{ flag: 'z:after' }, { flagIs: { flag: 'z:tournament', value: 'social' } }], none: [{ flag: 'z:derby' }] },
    delayMs: 1300,
    do: [{ a: 'talk', conversation: 'z-derby' }],
  },
  /**
   * `Z03` היא *"מפגש אוהדים, 2023–2024"* — ישיבה עם פרוטוקול, לא ערב משחק. עד 21.9.2026
   * היא ישבה בשער 5 של בלומפילד **הישן**, שנבנה מחדש ב-2016–2019; עכשיו בפינת אלנבי,
   * התחליף של `communityRoom` כמו `U02` (ART-PROMPTS, נספח ב׳).
   */
  // Z03 *"מפגש אוהדים"* — חדר הקהילה (`communityRoom`, 21.9.2026)
  { id: 'z-grow', at: 'community-room', trigger: 'enter', when: { all: [{ flag: 'z:derby' }], none: [{ flag: 'z:grow' }] }, delayMs: 650, do: [{ a: 'talk', conversation: 'z-grow' }] },
]

// ------------------------------------------------------------------ Part II ------

export function objectiveQuiet(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['z:aid']) return sceneId === 'home' ? null : 'מאיה כתבה. אין פה משימה.'
  if (!state.flags['z:again']) return sceneId === 'home' ? null : 'אבא אצלך, בפינת המטבח. שוב המילה הזאת.'
  return null
}

export const ENDINGS_QUIET: Record<string, EndingCard> = {
  balanced: {
    id: 'balanced',
    titleHe: 'בלי להפוך את זה למבחן',
    bodyHe:
      'ממשיך עם הכדורגל, בקצב שמתאים לך. הוא אמר שנלך מתי שיתאים ואמרת בלי להפוך את זה למבחן — והוא הבין, כי הוא כבר היה שם פעם.',
    memoryHe: 'לוח משחקים, בלי סימונים.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  basketball: {
    id: 'basketball',
    titleHe: 'רק רציתי לשאול מתי נפגשים',
    bodyHe:
      'התמקדת בכדורסל, ולא הסברת למה. אפי אמר שאתה לא חייב להסביר לו, ואתה רק שאלת מתי נפגשים — וזאת הייתה כל השיחה.',
    memoryHe: 'כרטיס לאולם, על השיש.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  smaller: {
    id: 'smaller',
    titleHe: 'גם כשאין תוצאה',
    bodyHe:
      'הקטנת את המקום של שני הענפים. קובי אמר שהוא יתקשר גם כשאין תוצאה, ואמרת שזה מה שאתה רוצה — והוא התקשר, ובאמת לא הייתה תוצאה.',
    memoryHe: 'שיחה שלא נמשכה שעה.',
    memoryItem: 'folded-paper',
    presence: 'late',
  },
}

export const BEATS_QUIET: Beat[] = [
  { id: 'z-aid', at: 'home', trigger: 'enter', when: { none: [{ flag: 'z:aid' }] }, delayMs: 800, do: [{ a: 'talk', conversation: 'z-aid' }] },
  // קובי אצלו, בפינת המטבח של `homeAdult` — אותו חדר כמו ההודעה של מאיה, ולכן שעון
  { id: 'z-again', at: 'home', trigger: 'clock', when: { all: [{ flag: 'z:aid' }], none: [{ flag: 'z:again' }] }, delayMs: 1400, do: [{ a: 'talk', conversation: 'z-again' }] },
]

// ----------------------------------------------------------------- Part III ------

export function objectiveEurocup(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['z:euro']) return sceneId === 'home' ? null : 'הגמר באירופה. איפה אתה בערב הזה.'
  if (!state.flags['z:up']) return sceneId === 'kiosk' ? null : 'אבא בקיוסק. חזרנו לליגה, והוא כבר מסתכל קדימה.'
  return null
}

export const ENDINGS_EUROCUP: Record<string, EndingCard> = {
  take: {
    id: 'take',
    titleHe: 'הפעם אני לוקח אותך',
    bodyHe:
      'הצעת שתראו את הפועל יחד בחו״ל. הוא שאל אם אתה רציני ואמרת שהפעם אתה לוקח אותו, והוא אמר קודם תבדוק שלא פג התוקף — וזו הייתה הדרך שלו להגיד כן.',
    memoryHe: 'דרכון, פתוח בעמוד התוקף.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  meet: {
    id: 'meet',
    titleHe: 'אנחנו נפגשים שם',
    bodyHe:
      'אתה בחו״ל, והזמנת אותו להיפגש שם. הוא שאל אם הוא בא אליך ואמרת שאתם נפגשים — למשחק, ולכם. הוא לא תיקן אותך.',
    memoryHe: 'שתי כרטיסיות, לאותו יום.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  ask: {
    id: 'ask',
    titleHe: 'רוצה',
    bodyHe:
      'פתחת את זה בשיחה רגועה, בלי להבטיח כלום. הוא אמר שלא חייבים לסגור הכול עכשיו, ואמרת שרק רצית לדעת אם הוא רוצה — והוא אמר רוצה, מילה אחת.',
    memoryHe: 'הערה בטלפון, בלי תאריך.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

export const BEATS_EUROCUP: Beat[] = [
  { id: 'z-euro', at: 'home', trigger: 'enter', when: { none: [{ flag: 'z:euro' }] }, delayMs: 800, do: [{ a: 'talk', conversation: 'z-euro' }] },
  { id: 'z-up', at: 'kiosk', trigger: 'enter', when: { all: [{ flag: 'z:euro' }], none: [{ flag: 'z:up' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'z-up' }] },
]

// ----------------------------------------------- the tournament words (90-E) ------

type Branches = Conversation['branches']
const Z = (flag: string, value: string) => ({ flagIs: { flag, value } }) as const

/** אחרי המשחק — שורה על מי יצא ראשון, ושורה על מי נכנס במקום אפי */
function afterBranches(): Branches {
  const bench: Record<string, string> = {
    me: 'יצאת ראשון, כמו שכתבת, וחמש דקות על הקו היו ארוכות יותר ממה שחשבת.',
    ofir: 'אופיר יצא ראשון, ונכנס אחר כך כאילו חיכה לזה שנה.',
    kobi: 'קובי הוציא את עמית ראשון. עמית לא התווכח — עם קובי אף אחד לא מתווכח.',
  }
  const sub: Record<string, string> = {
    child: 'הבן שלך נגע בכדור פעמיים. בפעם השנייה הוא הסתכל עליך, ולא על השער.',
    roma: 'רומא הגיע בדקה השמינית, בנעליים הלא נכונות, ושיחק כאילו זה גמר.',
    short: 'ארבעה, והחלפתם כל חמש דקות. אף אחד לא נשאר בחוץ יותר מדי.',
  }
  const rows: Branches = []
  for (const [b, benchLine] of Object.entries(bench)) {
    for (const [k, subLine] of Object.entries(sub)) {
      rows.push({
        when: { all: [{ flag: 'played:football' }, Z('z:bench', b), Z('z:sub', k)] },
        lines: [
          { who: null, text: benchLine },
          { who: null, text: subLine },
          { who: 'אופיר', text: 'פעם היינו מתחממים בדרך.' },
          { who: 'קובי', text: 'והיום התחממתם על הספסל. גם זה משהו.' },
        ],
        then: [
          { e: 'flag', flag: 'z:after' },
          { e: 'flagValue', flag: 'life:tournament:sub', value: k },
          { e: 'rel', who: 'ofir', axis: 'bond', delta: 2 },
          ...(b === 'me'
            ? ([
                { e: 'proof', kind: 'accepted_rotation', proofId: 'accepted_rotation:{chapter}:tournament', subjectHe: 'זמן המשחק שלי', audience: 'gate5', delta: 3, noteHe: 'כתב מראש שהוא יוצא בחילוף, ויצא.' },
                { e: 'heard', proofId: 'accepted_rotation:{chapter}:tournament' },
                { e: 'toast', text: 'אפי, מהגדר: "אתה באמת יוצא בחילוף?" — "כתבתי את זה מול עדים."', tone: 'plain' },
              ] as const)
            : b === 'kobi'
              ? ([{ e: 'rel', who: 'kobi', axis: 'bond', delta: 2 }] as const)
              : ([{ e: 'rel', who: 'ofir', axis: 'trust', delta: 2 }] as const)),
        ] as Branches[number]['then'],
      })
    }
  }
  return [
    {
      when: Z('z:tournament', 'support'),
      lines: [
        { who: null, text: 'מהקו זה נראה אחרת: אופיר מבקש כדור שלא יגיע, ועמית צועק על עצמו.' },
        { who: 'קובי', text: 'ראית? ככה אני רואה אתכם כבר ארבעים שנה.' },
        { who: 'פוגי', text: 'ועכשיו אני.' },
      ],
      then: [
        { e: 'flag', flag: 'z:after' },
        { e: 'energy', delta: -5 },
        { e: 'rel', who: 'metuki', axis: 'bond', delta: 3 },
        { e: 'toast', text: 'מתוקי: "אז הפעם אתה מחזיק לי תיק?" — "מגיע לי."', tone: 'plain' },
      ],
    },
    ...rows,
    {
      // המשחק לא נגמר על המגרש הזה (הלשונית נסגרה, או שלא נכנס) — הערב ממשיך בלעדיו
      lines: [{ who: null, text: 'הכדור נשאר ליד השער. מישהו כבר מקפל את הגופיות.' }],
      then: [{ e: 'flag', flag: 'z:after' }],
    },
  ]
}

export const CONVERSATIONS_TOURNAMENT_QUEST: Conversation[] = [
  {
    id: 'z-invite',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הקבוצה בוואטסאפ עוד נקראת ״יצורניר״. שמונה אנשים, ואף אחד לא כתב בה מאז מרץ.' },
          { who: 'פוגי', text: 'חסרים שניים. היום, במגרש, בשש.' },
        ],
        then: [{ e: 'flag', flag: 'z:invited' }, { e: 'time', minutes: 5 }],
      },
    ],
  },
  {
    id: 'z-replies',
    nameHe: 'מתוקי',
    remote: { 'מתוקי': 'phone', 'אפי': 'phone' },
    branches: [
      {
        lines: [
          { who: 'מתוקי', text: 'בא. מביא מים.' },
          { who: 'אפי', text: 'הגב. לא היום. סליחה.' },
          { who: 'אפי', text: 'אבל אני בא לראות מהגדר.' },
        ],
        choices: [
          {
            id: 'child',
            text: '(לקרוא לבן. הוא על הקו ממילא.)',
            when: { flag: 'life:child' },
            hidden: true,
            then: [
              { e: 'flagValue', flag: 'z:sub', value: 'child' },
              { e: 'toast', text: 'הבן: "באמת?" — "באמת. רק תעמוד איפה שאני אומר." — "אני אעמוד איפה שהכדור."', tone: 'plain' },
            ],
          },
          {
            id: 'roma',
            text: '(להתקשר לרומא. הוא אמר פעם שהוא תמיד פנוי.)',
            then: [
              { e: 'flagValue', flag: 'z:sub', value: 'roma' },
              { e: 'time', minutes: 5 },
              { e: 'toast', text: 'רומא: "רבע שעה. אל תתחילו בלעדיי." — "נתחיל. תיכנס באמצע."', tone: 'plain' },
            ],
          },
          {
            id: 'short',
            text: '(לשחק ארבעה — ולהחליף כל חמש דקות.)',
            then: [
              { e: 'flagValue', flag: 'z:sub', value: 'short' },
              { e: 'toast', text: 'עמית: "ארבעה זה פחות ריצה." — "זה יותר חילופים."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'z-kit',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'התיק מהאוטו: גופיות, קונוסים, בקבוק מים לקובי. חצי מזה כבר מפוזר על הדשא.' },
        ],
        choices: [
          { id: 'collect', text: '(לאסוף ולסדר — לפני שמתחילים.)', then: [{ e: 'minigame', id: 'chore:story:kit-23' }] },
          {
            id: 'as-is',
            text: '(לשחק עם מה שיש. גופיות למי שמגיע ראשון.)',
            then: [{ e: 'flagValue', flag: 'z:kit', value: 'none' }, { e: 'toast', text: 'שלוש גופיות לחמישה. אופיר לקח שתיים, "אחת לגיבוי".', tone: 'plain' }],
          },
        ],
      },
    ],
  },
  {
    id: 'z-rotate',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'קובי', text: 'אמרתי שאני אומר מי פותח.' },
          { who: 'פוגי', text: 'אז תגיד.' },
          { who: 'קובי', text: 'קודם תגיד אתה מי יוצא ראשון. את זה אני רוצה לשמוע ממך.' },
        ],
        choices: [
          {
            id: 'me',
            text: '(אני בחוץ ראשון. כמו שכתבתי.)',
            when: Z('z:tournament', 'player'),
            hidden: true,
            then: [
              { e: 'flag', flag: 'z:kickoff' },
              { e: 'flagValue', flag: 'z:bench', value: 'me' },
              { e: 'minigame', id: 'football' },
            ],
          },
          {
            id: 'ofir',
            text: '(אופיר בחוץ ראשון. הוא אמר שהברך.)',
            then: [
              { e: 'flag', flag: 'z:kickoff' },
              { e: 'flagValue', flag: 'z:bench', value: 'ofir' },
              { e: 'minigame', id: 'football' },
            ],
            when: Z('z:tournament', 'player'),
            hidden: true,
          },
          {
            id: 'kobi',
            text: '(לפי הדף של קובי.)',
            when: Z('z:tournament', 'player'),
            hidden: true,
            then: [
              { e: 'flag', flag: 'z:kickoff' },
              { e: 'flagValue', flag: 'z:bench', value: 'kobi' },
              { e: 'minigame', id: 'football' },
            ],
          },
          {
            // מי שמאמן — הוא זה שכותב את הדף, והמשחק נראה מהקו
            id: 'coach',
            text: '(לכתוב את הסבב בעצמי — ולעמוד על הקו.)',
            when: Z('z:tournament', 'support'),
            hidden: true,
            then: [
              { e: 'flag', flag: 'z:kickoff' },
              { e: 'flagValue', flag: 'z:bench', value: 'coach' },
              { e: 'time', minutes: 30 },
              { e: 'travel', to: 'pitch', spawn: 'start' },
            ],
          },
        ],
      },
    ],
  },
  { id: 'z-after', nameHe: 'קובי', branches: afterBranches() },
]

// ---------------------------------------------------------------- the words ------

export const CONVERSATIONS_LATE: Conversation[] = [
  ...CONVERSATIONS_TOURNAMENT_QUEST,
  {
    id: 'z-role',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'אופיר', text: 'פעם היינו מתחממים בדרך.' },
          { who: 'עמית', text: 'פעם הדרך לא הייתה החימום היחיד.' },
          { who: 'קובי', text: 'אני אומר לכם מי לפתוח.' },
          { who: 'פוגי', text: 'אתה לא המאמן.' },
          { who: 'קובי', text: 'גם אתה לא, אבל זה לא עצר אותך.' },
        ],
        choices: [
          {
            /**
             * (90-E) **התחייבות, לא דיווח.** 45 הדקות, האנרגיה וה-`accepted_rotation` עברו לאן
             * שהם קורים: ההזמנה, התיק, הדף של קובי, המשחק — וה-`z-after` שאחריו.
             */
            id: 'play',
            text: '(לשחק זמן מוגדר — ולצאת בחילוף.)',
            then: [
              { e: 'flag', flag: 'z:role' },
              { e: 'flagValue', flag: 'z:tournament', value: 'player' },
              { e: 'toast', text: 'קובי: "שלושה. צריך חמישה." — הטלפון על הספסל.', tone: 'plain' },
            ],
          },
          {
            id: 'support',
            text: '(לאמן או לצלם — ולהשאיר מקום בהרכב.)',
            then: [
              { e: 'flag', flag: 'z:role' },
              { e: 'flagValue', flag: 'z:tournament', value: 'support' },
              { e: 'toast', text: 'קובי: "אז אתה מביא אותם, והם משחקים." — הטלפון על הספסל.', tone: 'plain' },
            ],
          },
          {
            id: 'social',
            text: '(לבוא רק למפגש שאחרי.)',
            then: [
              { e: 'flag', flag: 'z:role' },
              { e: 'flagValue', flag: 'z:tournament', value: 'social' },
              { e: 'time', minutes: 20 },
              { e: 'toast', text: 'אופיר: "גם לזה צריך חימום?" — "תלוי מה אוכלים."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'z-derby',
    nameHe: 'עמית',
    branches: [
      {
        lines: [
          { who: null, text: 'הערב נגמר. הלוח עוד דולק, ואף אחד לא זז.' },
          { who: 'אופיר', text: 'עכשיו אני מצלם את הלוח.' },
          { who: 'עמית', text: 'תצלם. רק אל תכתוב ״אלופים״.' },
          { who: 'פוגי', text: 'תן לו לפחות להחזיק את המספר.' },
          { who: 'אפי', text: 'הערב הזה אמיתי גם בלי להמציא לו סוף.' },
        ],
        choices: [
          {
            id: 'caption',
            text: '(לשמור את התמונה — עם כיתוב מדויק.)',
            then: [
              { e: 'flag', flag: 'z:derby' },
              { e: 'memory', item: 'clipping', id: 'z-derby-2023' },
              { e: 'skill', skill: 'knowledge', delta: 2, why: '"הערב הזה", ולא "אלופים"' },
              { e: 'toast', text: 'עמית: "״הערב הזה״. טוב." — "אפילו אתה לא יכול לתקן את זה."', tone: 'plain' },
            ],
          },
          {
            id: 'share',
            text: '(לחלוק את השמחה עם מי שלא הגיע.)',
            then: [
              { e: 'flag', flag: 'z:derby' },
              { e: 'flagValue', flag: 'z:derbyShared', value: true },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'אפי: "אני שם אותך על רמקול?" — "רק אל תזרוק את הטלפון כמו בפעם ההיא."', tone: 'plain' },
            ],
          },
          {
            id: 'boundary',
            text: '"הערב גדול. גם ההבטחה שלי קיימת."',
            then: [
              { e: 'flag', flag: 'z:derby' },
              { e: 'proof', kind: 'kept_boundary', proofId: 'kept_boundary:{chapter}:derby', subjectHe: 'ההבטחה שהייתה לפני הערב', noteHe: 'הלך באמצע הכי טוב, כי כבר סיכם.' },
              { e: 'personality', key: 'honesty', delta: 3 },
              { e: 'toast', text: 'אופיר: "כבר הולך?" — "הערב גדול. גם ההבטחה שלי קיימת."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'z-grow',
    nameHe: 'יוסף',
    branches: [
      {
        lines: [
          { who: 'יוסף', text: 'אתה רוצה שנגדל?' },
          { who: 'פוגי', text: 'כן.' },
          { who: 'אפי', text: 'אתה רוצה שנישאר אותו דבר?' },
          { who: 'פוגי', text: 'גם.' },
          { who: 'יוסף', text: 'טוב, לפחות מצאנו את הבעיה.' },
        ],
        choices: [
          {
            id: 'question',
            text: '(לשאול איזה קול נשאר לחברים.)',
            then: [
              { e: 'flag', flag: 'z:grow' },
              { e: 'time', minutes: 30 },
              { e: 'skill', skill: 'knowledge', delta: 3, why: 'בדק במסמך, לא בסיסמה' },
              { e: 'skill', skill: 'communication', delta: 2, why: 'שאל לפני שהצביעו' },
              { e: 'proof', kind: 'questioned_structure', proofId: 'questioned_structure:{chapter}:voice', subjectHe: 'הקול שנשאר לחברים', audience: 'ussishkin', delta: 3, noteHe: 'שאלה שאפשר לבדוק במסמך, ונבדקה לפני ההצבעה.' },
              { e: 'heard', proofId: 'questioned_structure:{chapter}:voice' },
              { e: 'toast', text: 'פרדי: "זו שאלה שאפשר לבדוק במסמך." — "אז נבדוק לפני הסיסמה."', tone: 'plain' },
              { e: 'ending', id: 'asked' },
            ],
          },
          {
            id: 'concrete',
            text: '(לתמוך בצמיחה — ולדרוש התחייבות אחת קונקרטית.)',
            then: [
              { e: 'flag', flag: 'z:grow' },
              { e: 'skill', skill: 'organization', delta: 3, why: 'שם ומועד, לא כוונה' },
              { e: 'proof', kind: 'concrete_request', proofId: 'concrete_request:{chapter}:service', subjectHe: 'מי אחראי לשירות לאוהדים', audience: 'ussishkin', delta: 3, noteHe: 'התחייבות אחת, עם שם ועם מועד.' },
              { e: 'heard', proofId: 'concrete_request:{chapter}:service' },
              { e: 'toast', text: 'יוסף: "מה אתה רוצה שיקרה בפועל?" — "שיהיה ברור מי אחראי לשירות לאוהדים." — "עם שם ומועד. טוב."', tone: 'plain' },
              { e: 'ending', id: 'concrete' },
            ],
          },
          {
            id: 'observer',
            text: '"אני רוצה להישאר אוהד. לא לעסוק בניהול."',
            then: [
              { e: 'flag', flag: 'z:grow' },
              { e: 'flagValue', flag: 'z:governanceLate', value: 'observer' },
              { e: 'rel', who: 'efi', axis: 'trust', delta: 2 },
              { e: 'toast', text: 'אפי: "אתה עדיין בא איתי?" — "למשחק שנבחר. לא לכל ישיבה."', tone: 'plain' },
              { e: 'ending', id: 'fan' },
            ],
          },
        ],
      },
    ],
  },

  // ----------------------------------------------------------------- Z04–Z05 ------
  {
    id: 'z-aid',
    nameHe: 'מאיה',
    // "מאיה כתבה" — המטרה של הפרק
    remote: { 'מאיה': 'phone' },
    branches: [
      {
        lines: [
          { who: 'מאיה', text: 'אנחנו מתאמים עזרה. אני יכולה להגיד מה חסר, אם מתאים לך.' },
          { who: 'פוגי', text: 'תגידי משהו אחד.' },
          { who: 'מאיה', text: 'להיות עם מישהו שלא רוצה להיות לבד.' },
          { who: 'פוגי', text: 'ואת הזיכרון?' },
          { who: 'מאיה', text: 'לא צריך לסדר אותו עכשיו.' },
        ],
        choices: [
          {
            id: 'stay',
            text: '(להישאר עם מי שביקש חברה.)',
            then: [
              { e: 'flag', flag: 'z:aid' },
              { e: 'time', minutes: 60 },
              { e: 'flagValue', flag: 'z:community2023', value: 'present_without_recording' },
              { e: 'toast', text: 'מאיה: "תודה. אין צורך לצלם." — "ברור."', tone: 'plain' },
            ],
          },
          {
            id: 'task',
            text: '(משימה אחת קטנה ומוסכמת.)',
            then: [
              { e: 'flag', flag: 'z:aid' },
              { e: 'time', minutes: 30 },
              { e: 'flagValue', flag: 'z:community2023', value: 'bounded_help' },
              { e: 'toast', text: 'מאיה: "אני שולחת רק מה שסיכמנו." — "דבר אחד שאוכל לקיים."', tone: 'plain' },
            ],
          },
          {
            /**
             * **הדילוג אינו עולה דבר ואינו מקנה דבר** — לא זמן, לא יחסים, לא מדד, לא
             * ראיה. זו הוראת הסצנה במפורש (*"אפשר לדלג על ההצגה בלי השפעת מדדים"*),
             * וזה גם הדבר הקל ביותר לשבור בטעות: כל אפקט שיתווסף כאן הופך בחירה
             * לוויתור, ובסצנה הזאת זה בדיוק מה שאסור.
             */
            id: 'not-now',
            text: '"לא עכשיו."',
            then: [
              { e: 'flag', flag: 'z:aid' },
              { e: 'flagValue', flag: 'z:memorial', value: 'skipped' },
              { e: 'toast', text: 'מאיה: "בסדר. אין מה להסביר." — "תודה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'z-again',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'פוגי', text: 'עוד פעם.' },
          { who: 'קובי', text: 'כן.' },
          { who: 'פוגי', text: 'אתה זוכר מה אמרת לי אז?' },
          { who: 'קובי', text: 'אני זוכר מה הרגשת. המשפט פחות חשוב.' },
          { who: 'פוגי', text: 'עכשיו אני מבין כמה קשה לא למצוא מיד משפט.' },
        ],
        choices: [
          {
            id: 'balanced',
            text: '(להמשיך עם הכדורגל, בקצב שמתאים לי.)',
            then: [
              { e: 'flag', flag: 'z:again' },
              { e: 'flagValue', flag: 'life:football', value: 'balanced' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'קובי: "אז נלך מתי שיתאים." — "בלי להפוך את זה למבחן."', tone: 'plain' },
              { e: 'ending', id: 'balanced' },
            ],
          },
          {
            id: 'basket',
            text: '(להתמקד כרגע בכדורסל.)',
            then: [
              { e: 'flag', flag: 'z:again' },
              { e: 'flagValue', flag: 'life:football', value: 'peripheral' },
              { e: 'flagValue', flag: 'life:basketball', value: 'central' },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'אפי: "אתה לא חייב להסביר לי למה." — "רק רציתי לשאול מתי נפגשים."', tone: 'plain' },
              { e: 'ending', id: 'basketball' },
            ],
          },
          {
            id: 'smaller',
            text: '(להקטין את המקום של שניהם.)',
            then: [
              { e: 'flag', flag: 'z:again' },
              { e: 'flagValue', flag: 'life:football', value: 'peripheral' },
              { e: 'flagValue', flag: 'life:basketball', value: 'peripheral' },
              { e: 'flag', flag: 'life:armchair' },
              { e: 'wellbeing', key: 'stress', delta: -6 },
              { e: 'toast', text: 'קובי: "אני אתקשר גם כשאין תוצאה." — "זה מה שאני רוצה."', tone: 'plain' },
              { e: 'ending', id: 'smaller' },
            ],
          },
        ],
      },
    ],
  },

  // ----------------------------------------------------------------- Z06–Z07 ------
  {
    id: 'z-euro',
    nameHe: 'אפי',
    branches: [
      {
        lines: [
          { who: 'אפי', text: 'אתה זוכר את הקלסר?' },
          { who: 'פוגי', text: 'אל תתחיל עם קלסר עכשיו.' },
          { who: 'יוסף', text: 'זה דווקא הזמן.' },
          { who: 'מתוקי', text: 'אני רק אומר שהוא עדיין אצלי.' },
          { who: 'אפי', text: 'ברור שהוא אצלך.' },
        ],
        choices: [
          {
            id: 'together',
            text: '(לראות עם אנשי הדרך — ולשמור צילום משותף.)',
            then: [
              { e: 'flag', flag: 'z:euro' },
              { e: 'time', minutes: 90 },
              { e: 'flag', flag: 'own:photo:eurocup2025' },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'presence', mode: 'television' },
              { e: 'toast', text: 'יוסף: "לא כולנו היינו בכל רגע." — "אבל הנה מי שכאן עכשיו."', tone: 'plain' },
            ],
          },
          {
            id: 'travel',
            text: '(לצאת למסע. יש תקציב ויש הסכמה.)',
            when: { minAgorot: TRIP_2025_AGOROT },
            noteHe: 'אין בארנק מה שהנסיעה עולה. לא נוסעים על חשבון מישהו אחר.',
            then: [
              { e: 'flag', flag: 'z:euro' },
              { e: 'money', agorot: -TRIP_2025_AGOROT, why: 'הנסיעה לגמר' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -15 },
              { e: 'memory', item: 'ticket-stub', id: 'z-eurocup-trip' },
              { e: 'proof', kind: 'travel_preparation', proofId: 'travel_preparation:{chapter}:eurocup', subjectHe: 'הנסיעה לגמר', audience: 'international', delta: 3, noteHe: 'תוכנית כתובה, ומי אחראי על החזרה כתוב בה בשם.' },
              { e: 'heard', proofId: 'travel_preparation:{chapter}:eurocup' },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'toast', text: 'רומא: "מי אחראי על החזרה?" — "אני. ויש תוכנית כתובה." — "אתה באמת התבגרת."', tone: 'plain' },
            ],
          },
          {
            id: 'call',
            text: '(שיחה קצרה, ולהמשיך ביום שלי.)',
            then: [
              { e: 'flag', flag: 'z:euro' },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 2 },
              { e: 'presence', mode: 'late' },
              { e: 'toast', text: 'אפי: "רציתי שתדע." — "טוב שהתקשרת. אני שמח בשבילכם ובשבילנו."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'z-up',
    nameHe: 'קובי',
    branches: [
      /**
       * **A04 — "משחק אחד בשבילנו", גרסת הכורסה של אותו רגע.** עד היום היא הייתה
       * "התמזגה ב-Z07", כלומר מי שבחר ב-P06 כורסה שמע את השאלה של כולם ואף מילה מהסצנה
       * שנכתבה לו. מיזוג אמיתי הוא ענף: אותה שיחה, אותו קובי, אותה החלטה על הסיום —
       * במילים של A04. *"אין צורך לשנות football_priority"*, ולכן אף בחירה כאן אינה
       * מחזירה אותו ליציע.
       */
      {
        when: { flag: 'life:armchair' },
        lines: [
          { who: 'קובי', text: 'אתה בכלל יודע נגד מי?' },
          { who: 'פוגי', text: 'את השם שלך בכרטיס בדקתי שלוש פעמים.' },
          { who: 'קובי', text: 'זה לא עונה.' },
          { who: 'פוגי', text: 'זה עונה לשאלה אחרת.' },
          { who: 'קובי', text: 'בסדר. את התשובה הזאת אהבתי.' },
        ],
        choices: [
          {
            id: 'evening',
            text: '"אני רוצה את הערב הזה איתך."',
            then: [
              { e: 'flag', flag: 'z:up' },
              { e: 'flag', flag: 'life:finale' },
              { e: 'proof', kind: 'invited_kobi', proofId: 'invited_kobi:{chapter}:trip', subjectHe: 'הנסיעה עם אבא', noteHe: 'ערב אחד בשבילם, בלי להצהיר על חזרה ליציע.' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'קובי: "אז נלך בקצב שלנו." — "בדיוק."', tone: 'plain' },
              { e: 'ending', id: 'take' },
            ],
          },
          {
            id: 'plan',
            text: '"אני צריך קודם לתכנן את הנסיעה. לא להבטיח סתם."',
            then: [
              { e: 'flag', flag: 'z:up' },
              { e: 'flag', flag: 'life:finale' },
              { e: 'flagValue', flag: 'life:finalePlan', value: 'needed' },
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 3 },
              { e: 'toast', text: 'קובי: "תבדוק. אני כאן." — "הפעם אני חוזר עם תשובה."', tone: 'plain' },
              { e: 'ending', id: 'ask' },
            ],
          },
        ],
      },
      {
        lines: [
          { who: 'קובי', text: 'חזרנו לליגה.' },
          { who: 'פוגי', text: 'ואתה כבר מסתכל על שנה הבאה.' },
          { who: 'קובי', text: 'מה אתה מסתכל?' },
          { who: 'פוגי', text: 'על הדרכון שלך.' },
          { who: 'קובי', text: 'למה, גם הוא עלה?' },
        ],
        choices: [
          {
            id: 'take',
            text: '"הפעם אני לוקח אותך. נראה אותם בחו״ל."',
            then: [
              { e: 'flag', flag: 'z:up' },
              { e: 'flag', flag: 'life:finale' },
              { e: 'proof', kind: 'invited_kobi', proofId: 'invited_kobi:{chapter}:trip', subjectHe: 'הנסיעה עם אבא', noteHe: 'הזמין, ולא רק אמר שצריך פעם.' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'קובי: "אתה רציני?" — "הפעם אני לוקח אותך." — "קודם תבדוק שלא פג התוקף."', tone: 'plain' },
              { e: 'ending', id: 'take' },
            ],
          },
          {
            /**
             * *"אם אני בחו״ל"* — `residence.abroad` (Z07.2). *"אני שם ממילא"* הוא משפט של מי
             * שגר שם, ובלי התנאי הוא הוצע גם למי שמעולם לא ארז מזוודה. `life:abroad` נכתב
             * ב-X01, וזה אותו תנאי שהסיום כבר שואל (F01.3, F02.3).
             */
            id: 'meet',
            when: { flag: 'life:abroad' },
            hidden: true,
            text: '"אני שם ממילא. נפגשים באירופה."',
            then: [
              { e: 'flag', flag: 'z:up' },
              { e: 'flag', flag: 'life:finale' },
              { e: 'flag', flag: 'life:finaleReunion' },
              { e: 'proof', kind: 'invited_kobi', proofId: 'invited_kobi:{chapter}:trip', subjectHe: 'הנסיעה עם אבא', noteHe: 'קבע מקום ומועד, לא "פעם נראה".' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'קובי: "אז אני בא אליך?" — "אנחנו נפגשים שם. למשחק, ולנו."', tone: 'plain' },
              { e: 'ending', id: 'meet' },
            ],
          },
          {
            id: 'ask',
            text: '(רק לשאול אם הוא רוצה. בלי להבטיח כסף.)',
            then: [
              { e: 'flag', flag: 'z:up' },
              { e: 'flag', flag: 'life:finale' },
              { e: 'flagValue', flag: 'life:finalePlan', value: 'needed' },
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 3 },
              { e: 'toast', text: 'קובי: "לא חייבים לסגור הכול עכשיו." — "רק רציתי לדעת אם אתה רוצה." — "רוצה."', tone: 'plain' },
              { e: 'ending', id: 'ask' },
            ],
          },
        ],
      },
    ],
  },
]
