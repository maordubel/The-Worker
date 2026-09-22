import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_CHAMPIONS } from './chapter2010champions'

/**
 * חלון INTERNATIONAL — I01–I03 (סתיו 2010) ו-I04 (2024).
 *
 * **איך הוא נפתח:** `C02` שואל *"באיזו עיר אתה יכול?"*, ואחת התשובות היא *"אני נשאר.
 * תביא אנשים אליי."* — לארח בארץ. מי שבחר בה מרים `life:international`, ורומא מביא אנשים
 * אליו: לינה וניקו (I01). זה החלון, ואין לו דלת אחרת — הוא ההמשך של הבחירה לארח, לא
 * פרס על עניין פוליטי. (ההכרעה שהוצעה למאור כ-A — לפי מה שהחיים כבר בחרו.)
 *
 * **ומה שהתסריט אוסר, נשמר כאן במפורש:**
 * · לינה וניקו הם *"דמויות בדיוניות של אוהדים אנטי־פשיסטים"*; *"אין ייחוס ברית
 *   היסטורית לקבוצה אמיתית ללא מקור"*. אף שורה כאן לא נוקבת בשם של קבוצה אמיתית.
 * · השלט של I02 הוא *"רכיב קוד עם נוסח מקורי, לא טקסט בתוך תמונת רקע"*, ו*"שיוך פוליטי
 *   נשמר רק כבחירה עלילתית מקומית"* — ולכן הבחירה נרשמת כ-`life:intl:banner` ולא נוגעת
 *   במוניטין, באישיות או באף מד. המשחק לא מנקד עמדה.
 * · I04: *"המשחק אינו מסיק עמדות של קהילה אמיתית ולא מנקד אידאולוגיה"* — מה שנמדד שם
 *   הוא איך מתווכחים (תקשורת, קשר), לא על מה.
 *
 * **ושני דברים שהתסריט קושר בין החלונות:** I03 עוסקת בהבטחה למתוקי (*"חשבתי שהיום אני
 * בפנים"*) — ההבטחה נאמרת בשורות הפתיחה של הסצנה עצמה, כך שהיא עומדת גם בחיים שלא
 * עברו בחלון TOURNAMENT; ומי שהחליף את מתוקי בלי לשאול (I03.3) נושא `life:metuki:benched`
 * — עניין פתוח, בדיוק כמו שהתסריט קורא לו.
 */

export const PORTRAIT_FRIENDS: Record<string, string> = {
  ...PORTRAIT_CHAMPIONS,
}

export const INTERNATIONAL = 'life:international'

// ================================================================ I01–I03 · 2010 ====

export function objectiveFriends(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['i:meet']) return sceneId === 'allenby' ? null : 'באלנבי. רומא מביא אנשים.'
  if (!state.flags['i:banner']) return sceneId === 'street' ? null : 'ברחוב, על המדרכה. השם של מי על הבד.'
  if (!state.flags['i:lineup']) return sceneId === 'pitch' ? null : 'המגרש. אימון ידידות — ומתוקי חשב שהיום הוא בפנים.'
  return null
}

export const ENDINGS_FRIENDS: Record<string, EndingCard> = {
  kept: {
    id: 'kept',
    titleHe: 'הבטחה, לא תזכורת',
    bodyHe:
      'שמרת את ההרכב שהובטח והוספת אימון אחר בשביל ניקו. מתוקי אמר תודה שזכרת, ואמרת שזאת הייתה הבטחה ולא תזכורת — וניקו שיחק באימון שאחרי, ברמה שעליה הזהיר.',
    memoryHe: 'שני הרכבים על אותו דף.',
    memoryItem: 'folded-paper',
  },
  asked: {
    id: 'asked',
    titleHe: 'נשארים עם מה שסיכמנו',
    bodyHe:
      'ביקשת חילוף מוסכם, ומתוקי אמר שהוא רוצה לשחק היום, כי לזה התכונן. נשארתם עם מה שסיכמתם — ושאלת, וזה מה שהוא יזכור.',
    memoryHe: 'שאלה אחת, ותשובה שכובדה.',
    memoryItem: 'folded-paper',
  },
  benched: {
    id: 'benched',
    titleHe: 'נדבר אחר כך',
    bodyHe:
      'החלפת את מתוקי בלי לשאול. הוא אמר שהוא חוזר הביתה ושתסתדרו עם הסידורים, ואמר "נדבר אחר כך" — ואחר כך עוד לא הגיע.',
    memoryHe: 'הודעה שלא נשלחה.',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_FRIENDS: Beat[] = [
  { id: 'i-meet', at: 'allenby', trigger: 'enter', when: { none: [{ flag: 'i:meet' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'i-meet' }] },
  { id: 'i-banner', at: 'street', trigger: 'enter', when: { all: [{ flag: 'i:meet' }], none: [{ flag: 'i:banner' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'i-banner' }] },
  { id: 'i-lineup', at: 'pitch', trigger: 'enter', when: { all: [{ flag: 'i:banner' }], none: [{ flag: 'i:lineup' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'i-lineup' }] },
]

// ======================================================================= I04 · 2024 ====

export function objectiveLina(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone || state.flags['i:call']) return null
  return sceneId === 'home' ? null : 'בבית. לינה קראה מה כתבת.'
}

export const ENDINGS_LINA: Record<string, EndingCard> = {
  understood: {
    id: 'understood',
    titleHe: 'עכשיו אני מבין למה',
    bodyHe:
      'הסברת את העמדה שלך ושאלת מה היא שמעה. היא עדיין לא הסכימה עם הכול, וגם אתה לא — אבל עכשיו הבנת למה היא מתכוונת, והיא שמעה אותך ולא את כל מי שהגיב שם.',
    memoryHe: 'שיחה ארוכה, בלי מנצח.',
    memoryItem: 'folded-paper',
  },
  paused: {
    id: 'paused',
    titleHe: 'כשנוכל להקשיב',
    bodyHe:
      'הגדרת גבול והפסקתם את השיחה בהסכמה. היא אמרה שלא תפתרו את זה בכוח, ואמרת שתדברו כשתוכלו להקשיב. החברות לא נגמרה; היא עצרה.',
    memoryHe: 'מספר טלפון, שעוד לא נמחק.',
    memoryItem: 'folded-paper',
  },
  bounded: {
    id: 'bounded',
    titleHe: 'בלי להעמיד פנים',
    bodyHe:
      'המשכתם סביב הביקור שתכננתם, בלי להעמיד פנים שהכול נפתר. זה התאים לשניכם, וזה היה כנה יותר מהסכמה.',
    memoryHe: 'תאריך לביקור, בעיפרון.',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_LINA: Beat[] = [
  { id: 'i-call', at: 'home', trigger: 'enter', when: { none: [{ flag: 'i:call' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'i-call' }] },
]

// ======================================================================== the words ====

export const CONVERSATIONS_FRIENDS: Conversation[] = [
  {
    id: 'i-meet',
    nameHe: 'רומא',
    branches: [
      {
        lines: [
          { who: 'רומא', text: 'זאת לינה, זה ניקו. הם מארגנים מפגש נגד גזענות.' },
          { who: 'ניקו', text: 'וגם משחק. אבל למשחק אני פחות מוכן.' },
          { who: 'פוגי', text: 'אז אתה כבר מתאים לחבורה.' },
          { who: 'לינה', text: 'קודם קפה. אחרי זה נריב על הרכב.' },
        ],
        choices: [
          {
            id: 'listen',
            text: '(לשאול מה הם עושים — ולהקשיב.)',
            then: [
              { e: 'flag', flag: 'i:meet' },
              { e: 'flag', flag: 'life:intl:met' },
              { e: 'time', minutes: 30 },
              { e: 'rel', who: 'lina', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'לינה: "אנחנו מתחילים ממה שקורה סביבנו, לא מסיסמה." — "תני לי דוגמה מהפעילות שלכם."', tone: 'plain' },
            ],
          },
          {
            id: 'friends',
            text: '(לבוא בשביל החברות — בלי להצטרף להתארגנות.)',
            then: [
              { e: 'flag', flag: 'i:meet' },
              { e: 'flag', flag: 'life:intl:met' },
              { e: 'time', minutes: 30 },
              { e: 'rel', who: 'nico', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'ניקו: "בסדר. אתה רוצה לשחק?" — "כן. ברמה שעליה הזהרתי."', tone: 'plain' },
            ],
          },
          {
            id: 'later',
            text: '(לסרב לפעילות — ולשמור אפשרות לפגישה אחרת.)',
            then: [
              { e: 'flag', flag: 'i:meet' },
              { e: 'flagValue', flag: 'i:meeting', value: 'later' },
              { e: 'toast', text: 'רומא: "ניפגש מחר לאוכל?" — "מתאים."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'i-banner',
    nameHe: 'לינה',
    branches: [
      {
        lines: [
          { who: 'לינה', text: 'אפשר גם את השם של הקבוצה שלכם?' },
          { who: 'פוגי', text: 'נראה לי.' },
          { who: 'רומא', text: 'מי זה ״נראה לי״?' },
          { who: 'לינה', text: 'אפשר גם רק את השם שלך. אני שואלת.' },
        ],
        choices: [
          {
            id: 'personal',
            text: '(לחתום בשמי בלבד — אחרי שקראתי את הנוסח.)',
            then: [
              { e: 'flag', flag: 'i:banner' },
              { e: 'flagValue', flag: 'life:intl:banner', value: 'personal' },
              { e: 'proof', kind: 'personal_consent', proofId: 'personal_consent:{chapter}:banner', subjectHe: 'השם שלי על הבד', noteHe: 'חתם בשמו בלבד, אחרי שקרא. החברים לא נהיו חתומים.' },
              { e: 'toast', text: 'לינה: "ככה נרשום." — "בלי להפוך את החברים שלי לחתומים."', tone: 'plain' },
            ],
          },
          {
            id: 'group',
            text: '(לבקש את הסכמת החבורה — לפני שמשתמשים בשם.)',
            then: [
              { e: 'flag', flag: 'i:banner' },
              { e: 'flagValue', flag: 'life:intl:banner', value: 'group-asked' },
              { e: 'time', minutes: 30 },
              // `mediation` בתסריט → `communication` במנוע
              { e: 'skill', skill: 'communication', delta: 3, why: 'אין חתימה עד שכולם מבינים' },
              { e: 'proof', kind: 'group_consent_process', proofId: 'group_consent_process:{chapter}:banner', subjectHe: 'השם של החבורה', noteHe: 'כל אחד ראה מה כתוב לפני שמישהו חתם בשמו.' },
              { e: 'toast', text: 'אפי: "אני רוצה לראות מה כתוב." — "ברור. אין חתימה עד שכולם מבינים."', tone: 'plain' },
            ],
          },
          {
            id: 'help',
            text: '(לעזור בהקמה — בלי חתימה ובלי שיוך.)',
            then: [
              { e: 'flag', flag: 'i:banner' },
              { e: 'flagValue', flag: 'life:intl:banner', value: 'helped' },
              { e: 'time', minutes: 30 },
              { e: 'energy', delta: -5 },
              { e: 'rel', who: 'lina', axis: 'bond', delta: 2 },
              { e: 'rel', who: 'lina', axis: 'trust', delta: 3 },
              { e: 'proof', kind: 'practical_help', proofId: 'practical_help:{chapter}:banner', subjectHe: 'ההקמה, בלי השם שלי', noteHe: 'עזר בידיים, ולא חתם.' },
              { e: 'toast', text: 'לינה: "אפשר. נדע להודות על מה שבאמת עשית." — "זה כל מה שביקשתי."', tone: 'plain' },
            ],
          },
          {
            id: 'no',
            text: '(לא להשתתף בפעילות הזאת.)',
            then: [
              { e: 'flag', flag: 'i:banner' },
              { e: 'flagValue', flag: 'life:intl:banner', value: 'declined' },
              { e: 'toast', text: 'רומא: "נתראה אחר כך." — "בשעה שסיכמנו."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'i-lineup',
    nameHe: 'רומא',
    branches: [
      {
        lines: [
          { who: 'רומא', text: 'ניקו רוצה לשחק.' },
          { who: 'מתוקי', text: 'חשבתי שהיום אני בפנים.' },
          { who: 'פוגי', text: 'נכון. אמרתי לך.' },
          { who: 'ניקו', text: 'אז אל תוציא אותו בגללי. אפשר עוד משחק.' },
          { who: 'אופיר', text: 'סוף סוף מישהו עם פתרון שאני מבין.' },
        ],
        choices: [
          {
            id: 'kept',
            text: '(לשמור את ההרכב שהובטח — ולהוסיף אימון אחר.)',
            then: [
              { e: 'flag', flag: 'i:lineup' },
              { e: 'rel', who: 'metuki', axis: 'bond', delta: 2 },
              { e: 'rel', who: 'metuki', axis: 'trust', delta: 5 },
              { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:lineup', subjectHe: 'ההרכב שהובטח למתוקי באימון הידידות', noteHe: 'אמר לו שהוא בפנים, והוא היה בפנים. ניקו קיבל אימון משלו.' },
              { e: 'toast', text: 'מתוקי: "תודה שזכרת." — "זאת הייתה הבטחה, לא תזכורת."', tone: 'plain' },
              { e: 'ending', id: 'kept' },
            ],
          },
          {
            id: 'asked',
            text: '(לבקש חילוף מוסכם — ולכבד סירוב.)',
            then: [
              { e: 'flag', flag: 'i:lineup' },
              { e: 'rel', who: 'metuki', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'מתוקי: "אני רוצה לשחק היום. לזה התכוננתי." — "אז נשארים עם מה שסיכמנו."', tone: 'plain' },
              { e: 'ending', id: 'asked' },
            ],
          },
          {
            id: 'swap',
            text: '(להחליף בלי לשאול.)',
            then: [
              { e: 'flag', flag: 'i:lineup' },
              { e: 'flag', flag: 'life:metuki:benched' },
              { e: 'rel', who: 'metuki', axis: 'bond', delta: -4 },
              { e: 'rel', who: 'metuki', axis: 'trust', delta: -8 },
              { e: 'toast', text: 'מתוקי: "אני חוזר הביתה. אתם תסתדרו עם הסידורים." — "מתוקי—" — "נדבר אחר כך."', tone: 'red' },
              { e: 'ending', id: 'benched' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'i-call',
    nameHe: 'לינה',
    // "בגלל זה התקשרתי" — ורומא על אותו קו
    remote: { 'לינה': 'phone', 'רומא': 'phone' },
    branches: [
      {
        lines: [
          { who: 'לינה', text: 'קראתי מה כתבת, ולא הבנתי למה התכוונת.' },
          { who: 'פוגי', text: 'אז תשאלי אותי, לא את כל מי שמגיב שם.' },
          { who: 'לינה', text: 'בגלל זה התקשרתי.' },
          { who: 'רומא', text: 'אני נשאר רק אם שניכם רוצים.' },
          { who: 'פוגי', text: 'בואו נדבר לאט.' },
        ],
        choices: [
          {
            id: 'explain',
            text: '(להסביר את העמדה שלי — ולשאול מה היא שמעה.)',
            then: [
              { e: 'flag', flag: 'i:call' },
              { e: 'time', minutes: 30 },
              // `mediation` בתסריט → `communication` במנוע. **לא** אישיות ולא מוניטין: איך
              // מתווכחים נמדד, על מה — לא (*"לא מנקד אידאולוגיה"*).
              { e: 'skill', skill: 'communication', delta: 3, why: 'התווכח עם חברה, לא עם קהל' },
              { e: 'rel', who: 'lina', axis: 'bond', delta: 2 },
              { e: 'proof', kind: 'disagreed_without_proxy', proofId: 'disagreed_without_proxy:{chapter}:lina', subjectHe: 'המחלוקת עם לינה', noteHe: 'דיבר בשם עצמו, לא בשם ציבור.' },
              { e: 'toast', text: 'לינה: "אני עדיין לא מסכימה עם הכול." — "גם אני. אבל עכשיו אני מבין למה את מתכוונת."', tone: 'plain' },
              { e: 'ending', id: 'understood' },
            ],
          },
          {
            id: 'pause',
            text: '(להגדיר גבול — ולהפסיק כרגע את השיחה.)',
            then: [
              { e: 'flag', flag: 'i:call' },
              { e: 'flagValue', flag: 'life:lina', value: 'paused' },
              { e: 'toast', text: 'לינה: "בסדר. לא נפתור את זה בכוח." — "נדבר כשנוכל להקשיב."', tone: 'plain' },
              { e: 'ending', id: 'paused' },
            ],
          },
          {
            id: 'bounded',
            text: '(להמשיך את החברות — סביב תחום מוסכם אחר.)',
            then: [
              { e: 'flag', flag: 'i:call' },
              { e: 'flagValue', flag: 'life:lina', value: 'bounded' },
              { e: 'rel', who: 'lina', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'לינה: "אפשר לדבר על הביקור שתכננו, בלי להעמיד פנים שהכול נפתר." — "זה מתאים לי."', tone: 'plain' },
              { e: 'ending', id: 'bounded' },
            ],
          },
        ],
      },
    ],
  },
]
