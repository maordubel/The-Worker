import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_EUROPE } from './chapter2002europe'

/**
 * H01–H04 · "ריח של בית" · 2004–2006 — וזה הפרק שבו הייסוד מתחיל, בלי שאיש אומר את המילה.
 *
 * התסריט בונה כאן קשת: **H01 נותן לבית הישן רגע שמחה לפני קשת האובדן** (זו הלשון של
 * מאור), **H02 מודד מה נשאר כשהבית כבר אינו מקום המשחק הרגיל**, ו-`founding.outreach_seed`
 * — הרשימה של מי שהיה ונעלם — נכתב שם, שנה לפני 2007. H03 הוא עבודה אמיתית אצל לירון,
 * ו-H04 מכיר את **אולי**, הנהג של 2010, *"לפני הנסיעה של 2010"*.
 *
 * **העוגן הוא 8.3.2004, והוא לא היה בארכיון.** `H01` כותב 96:71 ו"עשרים וחמש הפרש",
 * והארכיון החזיק שש שורות כדורסל מ-1991–1993 בלבד. כלל 49 אומר מה עושים: מוסיפים את
 * השורה, לא מקלידים את התוצאה בתסריט. היא נקראה מדוח המשחק של **מכבי תל אביב עצמה**.
 *
 * **החדרים, וההחלפה האחת שהיא פשרה מוצהרת:**
 * · H01 → `ussishkin-hall` (הפרקט, `ussMain`) — בדיוק החדר שהסצנה כתובה בו.
 * · H02 → `ussishkin-outside` — *"מחוץ לאוסישקין"*, ככתוב.
 * · H03 → `workshop` — **הסדנה של לירון** (`workshopFix`, 21.9.2026), מאחורי חלון
 *   הסלולר באלנבי. עד שהציור נחת היא ישבה במשרד הכרטיסים, כפשרה כתובה; היום היא יושבת
 *   במקום שהתסריט כתב, ועל השולחן שם מונח טרנזיסטור פתוח — *"פעם היית בא עם רדיו"*.
 * · H04 → `bus-station` — *"נקודת מפגש לנסיעה"*, וזה מה שהציור מראה.
 */

export const PORTRAIT_HOME: Record<string, string> = {
  ...PORTRAIT_EUROPE,
  'אולי': 'faceSupporter',
  'שלומי': 'faceSupporterB',
  'אזולאי': 'faceSupporterB',
}

/**
 * יום אצל לירון — שמונה שעות אצל **בעל מקצוע**, ולכן `skilled`.
 *
 * יוצא כ-200 ₪; התסריט כתב 220. ההפרש הוא הכיול של `WAGE` מול מה שמאור זכר, ושניהם
 * באותה מציאות — ולכן המספר **נגזר** ולא מוקלד: ביום שהכיול ישתנה, הוא יזוז איתו.
 */
import { shiftAgorot } from '../income'
const LIRON_AGOROT = shiftAgorot(2006, 8, true)

export function objectiveHome(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['h:derby']) return sceneId === 'ussishkin-hall' ? null : 'אפי גורר אותך לאולם. יש דרבי.'
  if (!state.flags['h:door']) return sceneId === 'ussishkin-outside' ? null : 'אוסישקין. מבחוץ, הפעם.'
  if (!state.flags['h:work']) return sceneId === 'workshop' ? null : 'לירון קרא לך. הסדנה באלנבי, מאחורי חלון הסלולר.'
  if (!state.flags['h:oli']) return sceneId === 'bus-station' ? null : 'יש נסיעה. מישהו נוהג.'
  return null
}

/**
 * שלושה סיומים, והם על **מה שנשאר אחרי שהבית מפסיק להיות הבית**.
 *
 * זו הקשת שהתסריט מבקש, ולכן אין כאן סיום "ניצחת": הדרבי נגמר בשמחה בהתחלה, והפרק
 * נגמר שנתיים אחריו, ליד דלת נעולה. מה שמפריד בין השלושה הוא מה שפוגי עשה עם זה —
 * רשם אנשים, צילם, או פשוט הלך לצד אפי.
 */
export const ENDINGS_HOME: Record<string, EndingCard> = {
  list: {
    id: 'list',
    titleHe: 'גם להם חסר',
    bodyHe:
      'כתבת רשימה. לא רק את מי שבא תמיד — גם את אלה שנעלמו, כי אפי אמר שאולי גם להם חסר. לא ידעת אז מה הרשימה הזאת, ושנה אחר כך היא הייתה הדבר היחיד שהיה לכם.',
    memoryHe: 'דף עם שמות, וחצי מהם לא ענו.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  photo: {
    id: 'photo',
    titleHe: 'משם באנו',
    bodyHe:
      'צילמת את הכניסה, לא רק את המקום שצעקתם בו — כי בתיה אמרה שמשם באנו. התמונה הזאת יצאה מטושטשת ואף אחד לא ביקש אחרת.',
    memoryHe: 'הכניסה, מטושטשת, ובכל זאת שמורה.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  walk: {
    id: 'walk',
    titleHe: 'הקול המקורי',
    bodyHe:
      'הלכתם, שניכם, בלי תוף ובלי רשימה. אפי אמר שמוזר לשמוע אותך בלי תוף, ואמרת שזה הקול המקורי. באותה שנה זה עוד נשמע כמו בדיחה.',
    memoryHe: 'הליכה, ושום דבר שנשאר ממנה חוץ ממנה.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

export const BEATS_HOME: Beat[] = [
  /**
   * ...והביט הזה מרים גם את **הידיעה על המקום**, וזו לא נוחות.
   *
   * `life:knows:hall` הורם עד היום רק ב-`a3-hall`, שהוא פרק **מותנה**
   * (`when: ['life:a2:efi']`). כלומר חצי מהחיים הגיעו ל-2007 בלי לדעת איפה אוסישקין,
   * ו-`life:worldlines` דיווח בדיוק את זה: `GOAL_UNREACHABLE` על `2007-registered`
   * בתשעה קווי חיים מתוך עשרה (כלל 75).
   *
   * מי שעמד על הפרקט ב-2004 יודע איפה זה, והתחילית `life:` שורדת מעבר פרק בכוונה —
   * ולכן פעם אחת מספיקה. הדגל מורם **כאן**, בקובץ התוכן, ולא ב-`chapters.ts`:
   * `carryableBefore` סורק את קובץ הפרק, ודגל שנולד במרשם אינו נראה לו בכלל.
   */
  {
    id: 'h-derby',
    at: 'ussishkin-hall',
    trigger: 'enter',
    when: { none: [{ flag: 'h:derby' }] },
    delayMs: 800,
    do: [{ a: 'flag', flag: 'life:knows:hall' }, { a: 'talk', conversation: 'h-derby' }],
  },
  {
    id: 'h-door',
    at: 'ussishkin-outside',
    trigger: 'enter',
    when: { all: [{ flag: 'h:derby' }], none: [{ flag: 'h:door' }] },
    delayMs: 700,
    do: [{ a: 'talk', conversation: 'h-door' }],
  },
  {
    id: 'h-work',
    at: 'workshop',
    trigger: 'enter',
    when: { all: [{ flag: 'h:door' }], none: [{ flag: 'h:work' }] },
    delayMs: 600,
    do: [{ a: 'talk', conversation: 'h-liron' }],
  },
  {
    id: 'h-oli',
    at: 'bus-station',
    trigger: 'enter',
    when: { all: [{ flag: 'h:work' }], none: [{ flag: 'h:oli' }] },
    delayMs: 600,
    do: [{ a: 'talk', conversation: 'h-oli' }],
  },
  /** והסגירה על השעון, מאותה סיבה כמו בשני הפרקים הקודמים (כלל 67) */
  {
    id: 'h-close',
    trigger: 'clock',
    when: { all: [{ flag: 'h:oli' }], none: [{ flag: 'h:done' }] },
    delayMs: 1000,
    do: [{ a: 'flag', flag: 'h:done' }, { a: 'talk', conversation: 'h-close' }],
  },
]

export const CONVERSATIONS_HOME: Conversation[] = [
  {
    id: 'h-derby',
    nameHe: 'אפי',
    branches: [
      {
        lines: [
          { who: 'אפי', text: 'עכשיו אתה מבין למה אני גורר אותך לפה?' },
          { who: 'פוגי', text: 'חשבתי בגלל הריח.' },
          { who: 'אפי', text: 'גם. אי אפשר להסביר הכול בטלפון.' },
          { who: 'שחור', text: 'מי מסביר? תזוזו מהדלת.' },
        ],
        choices: [
          {
            id: 'help',
            text: '(להישאר אחרי, לעזור בפירוק.)',
            then: [
              { e: 'flag', flag: 'h:derby' },
              { e: 'time', minutes: 30 },
              { e: 'energy', delta: -10 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'אחרי שהאולם מתרוקן' },
              { e: 'rel', who: 'efi', axis: 'trust', delta: 3 },
              { e: 'proof', kind: 'community_help', proofId: 'community_help:{chapter}:hall', subjectHe: 'הצד הכבד של הארגז', audience: 'ussishkin', delta: 3 },
              { e: 'attend' },
              { e: 'toast', text: 'שחור: "אותם ארגזים, אנשים אחרים." — "אני עדיין פה."', tone: 'plain' },
            ],
          },
          {
            id: 'photo',
            text: '(לצלם את אפי בלי שהוא מסתכל.)',
            then: [
              { e: 'flag', flag: 'h:derby' },
              { e: 'flag', flag: 'own:photo:ussishkin2004' },
              { e: 'time', minutes: 10 },
              { e: 'skill', skill: 'knowledge', delta: 3, why: 'לתעד שמחה' },
              { e: 'attend' },
              { e: 'toast', text: 'אפי: "למה בלי שאני מסתכל?" — "כי ככה אתה נראה כשאתה באמת שמח."', tone: 'plain' },
            ],
          },
          {
            id: 'tv',
            text: '(לראות מהבית, ולהתקשר אחרי.)',
            then: [
              { e: 'flag', flag: 'h:derby' },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'presence', mode: 'television' },
              { e: 'toast', text: 'אפי: "שמעת את האולם?" — "גם כשהנמכתי."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'h-door',
    nameHe: 'אפי',
    branches: [
      {
        lines: [
          { who: 'אפי', text: 'אני עוד בא לפה לפני שאני נזכר.' },
          { who: 'פוגי', text: 'גם כשאין משחק?' },
          { who: 'אפי', text: 'במיוחד.' },
          { who: 'בתיה', text: 'אם אתם עומדים, תעמדו בצל. געגועים לא נותנים פטור משמש.' },
        ],
        choices: [
          {
            id: 'list',
            text: '(לכתוב רשימת אנשים למפגש.)',
            then: [
              { e: 'flag', flag: 'h:door' },
              { e: 'flagValue', flag: 'h:kept', value: 'list' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'מי היה ומי נעלם' },
              /**
               * `founding.outreach_seed` בתסריט → `community_help` במנוע, **ולא**
               * `founding_proof`.
               *
               * ההפרש אינו סמנטיקה: `founding_proof` הוא מה ש-`USSISHKIN_FOUNDER.apex`
               * סופר, והאפקס דורש **שלוש ראיות בשלושה פרקים** בחלון 2007. ראיה מ-2006
               * שנספרת שם הייתה פותחת את הפסגה לפני שהעמותה קיימת — כלומר תואר מייסד
               * שנקנה במילה (כלל 71, בדיוק הפגם שכרטיס המסלול נבנה נגדו).
               * זו עזרה לקהילה, והיא **הזרע** של 2007 ולא ההוכחה שלו.
               */
              { e: 'proof', kind: 'community_help', proofId: 'community_help:{chapter}:outreach', subjectHe: 'הרשימה של מי שהיה ונעלם', audience: 'ussishkin', delta: 4 },
              { e: 'toast', text: 'אפי: "אל תכתוב רק את מי שבא תמיד. אולי גם להם חסר."', tone: 'plain' },
            ],
          },
          {
            id: 'photo',
            text: '(לצלם את הדלת ואת הכניסה.)',
            then: [
              { e: 'flag', flag: 'h:door' },
              { e: 'flagValue', flag: 'h:kept', value: 'photo' },
              { e: 'flag', flag: 'own:photo:ussishkinDoor' },
              { e: 'time', minutes: 30 },
              { e: 'skill', skill: 'knowledge', delta: 3, why: 'הכניסה, לא רק היציע' },
              { e: 'toast', text: 'בתיה: "תצלם גם את הכניסה, לא רק איפה שצעקתם." — "למה?" — "כי משם באנו."', tone: 'plain' },
            ],
          },
          {
            id: 'walk',
            text: '(פשוט ללכת איתו.)',
            then: [
              { e: 'flag', flag: 'h:door' },
              { e: 'flagValue', flag: 'h:kept', value: 'walk' },
              { e: 'time', minutes: 30 },
              { e: 'energy', delta: -5 },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'אפי: "מוזר לשמוע אותך בלי תוף." — "תתרגל. זה הקול המקורי."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'h-liron',
    nameHe: 'לירון',
    branches: [
      {
        lines: [
          { who: 'לירון', text: 'פעם היית בא עם רדיו. עכשיו כולם באים עם מספר טלפון.' },
          { who: 'פוגי', text: 'יותר קל?' },
          { who: 'לירון', text: 'הרדיו לפחות היה שותק כשהוצאתי סוללות.' },
          { who: 'ירון', text: 'אני שומע אותך.' },
          { who: 'לירון', text: 'הנה, דוגמה.' },
        ],
        choices: [
          {
            id: 'sort',
            text: '"אני ממיין לפי דחיפות. לא לפי מי שאני אוהב."',
            then: [
              { e: 'flag', flag: 'h:work' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -10 },
              { e: 'money', agorot: LIRON_AGOROT, why: 'יום אצל לירון' },
              // `enterprise` בתסריט → `business` במנוע (`SKILL_OF`)
              { e: 'skill', skill: 'business', delta: 3, why: 'שלוש הזמנות, סדר אחד' },
              { e: 'proof', kind: 'adult_shift', proofId: 'adult_shift:{chapter}:liron', subjectHe: 'שלוש הזמנות שיצאו בזמן', audience: 'work', delta: 3 },
              { e: 'toast', text: 'לירון: "אל תופתע. ככה אמור להיראות יום רגיל."', tone: 'plain' },
            ],
          },
          {
            id: 'hands',
            text: '(לעזור לירון עם הידיים, בלי קשרים.)',
            then: [
              { e: 'flag', flag: 'h:work' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -10 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'זוג ידיים' },
              { e: 'rel', who: 'yaron', axis: 'trust', delta: 3 },
              { e: 'toast', text: 'ירון: "לא ביקשתי קשרים. ביקשתי זוג ידיים."', tone: 'plain' },
            ],
          },
          {
            id: 'no',
            text: '"היום לא. עדיף שתדע עכשיו."',
            then: [
              { e: 'flag', flag: 'h:work' },
              { e: 'personality', key: 'honesty', delta: 3 },
              { e: 'toast', text: 'לירון: "עדיף לא היום מכבר־מגיע עד מחר."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'h-oli',
    nameHe: 'אולי',
    branches: [
      {
        lines: [
          { who: 'אולי', text: 'אני אולי.' },
          { who: 'פוגי', text: 'אולי מה?' },
          { who: 'אולי', text: 'הנה, עשית את זה. אפשר להתקדם.' },
          { who: 'אופיר', text: 'הוא נוהג.' },
          { who: 'אולי', text: 'רק אם אני יודע מי בא איתי.' },
        ],
        choices: [
          {
            id: 'roster',
            text: '(לעזור לו עם הרשימה.)',
            then: [
              { e: 'flag', flag: 'h:oli' },
              { e: 'time', minutes: 20 },
              { e: 'rel', who: 'uli', axis: 'trust', delta: 3 },
              { e: 'skill', skill: 'organization', delta: 2, why: 'מי באמת עולה לאוטובוס' },
              { e: 'proof', kind: 'route_plan', proofId: 'route_plan:{chapter}:oli', subjectHe: 'רשימת הנוסעים, עם שמות', audience: 'gate7', delta: 3 },
              { e: 'toast', text: 'אולי: "זה שאמר \'אני איתך\' לא נחשב שם."', tone: 'plain' },
            ],
          },
          {
            id: 'sit',
            text: '(לשבת עם החבורה.)',
            then: [
              { e: 'flag', flag: 'h:oli' },
              { e: 'rel', who: 'uli', axis: 'bond', delta: 3 },
              { e: 'wellbeing', key: 'belonging', delta: 4 },
              { e: 'toast', text: 'שלומי: "גם כשאתם מפסידים אתם עושים רעש כזה?" — "זאת התוכנית הבסיסית."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'h-close',
    nameHe: null,
    branches: [
      {
        when: { flagIs: { flag: 'h:kept', value: 'list' } },
        lines: [{ who: null, text: 'הרשימה נשארה בכיס ימין עד שהתרככה בקצוות. חצי מהשמות עליה לא ענו, וזה לא הפך אותה לפחות רשימה.' }],
        then: [{ e: 'ending', id: 'list' }],
      },
      {
        when: { flagIs: { flag: 'h:kept', value: 'photo' } },
        lines: [{ who: null, text: 'התמונה של הכניסה יצאה מטושטשת, ואף אחד לא ביקש אחרת.' }],
        then: [{ e: 'ending', id: 'photo' }],
      },
      {
        lines: [{ who: null, text: 'הלכתם עד הפינה ואז עוד אחת, ואז אפי אמר שהוא ממשיך לבד.' }],
        then: [{ e: 'ending', id: 'walk' }],
      },
    ],
  },
]
