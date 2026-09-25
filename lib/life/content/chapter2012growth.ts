import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_CHAMPIONS } from './chapter2010champions'

/**
 * N01–N04 · "הצלחה אינה מנוחה" · 2011–2013, בשני פרקים.
 *
 * **`2012-cups`** הוא N01 — הגביע השלישי ברצף, והשאלה מי מודיע למי מראש.
 * **`2012-five`** הוא N02–N04 — חמש שנים מאז ההקמה, מה זה "בעלים", ומה קורה בחדר
 * שבו לא כולם באותו קצב.
 *
 * **שלוש שורות ארכיון, ואחת מהן נקראה היום.**
 * · גמר הגביע של 25.5.2011 (מול מכבי חיפה) וזה של 15.5.2012 — שניהם ב-`matches.json`
 *   בביטחון 2 מלפני התסריט, ושני גביעי המדינה ב-`trophies.json`.
 * · **העלייה בכדורסל של 16.5.2012 לא הייתה בארכיון.** התסריט נוקב בה כעובדה `H30`
 *   עם מקור (`S11`), וכלל 49 אומר מה עושים: קוראים את המקור ומוסיפים שורה, ואז הסצנה
 *   מרימה אותה בלי שינוי קוד. וואלה ספורט מדווחת בזמן האירוע, והכותרת והגוף מסכימים
 *   (כלל 77): "הפועל תל אביב חוזרת לליגת העל", 83:56 מול מכבי באר יעקב, שלוש-אחת
 *   בסדרה, אחרי שש שנים. האולם אינו נקוב במקור ולכן נשאר `null`.
 *
 * **ואוסישקין אינו חדר בסצנה הזאת, כי הוא לא היה קיים.** `ussishkin.json` אומר
 * ב-`homeless` שמהריסת האולם ובמשך שבע שנים לא היה למועדון בית, ו-`drivein` שהאולם
 * החדש נחנך ב-2015. לחגוג עלייה של 2012 בתוך אולם שנהרס ב-2007 זו טענה על העולם
 * שהארכיון שלנו עצמו סותר, ולכן N02 יושבת בפינת אלנבי — אצל אותם אנשים בדיוק שעמדו
 * שם ב-`2007-registered`.
 *
 * **וחדר החזרות של N04 הוא רגע ולא חדר**, כמו טדי ב-2010: `life:places` מדפיס אותו
 * כ-`needs-painting`, והצורה הכנה לזה היא ביט על השעון.
 *
 * **תואר המייסד הוא ענף, לא בחירה.** התסריט: *"תואר מייסד מוצג רק למי שהשלים את שער
 * הייסוד; שאר השחקנים מקבלים זיכרון הצטרפות שמתאים להם."* בחירה מושבתת עם הערה הייתה
 * מספרת לכולם שיש תואר כזה — ולכן זה `when` על ה**ענף**, ומי שלא היה שם שומע שיחה
 * אחרת לגמרי. הדגל הוא `own:route:USSISHKIN_FOUNDER:entry`, כי `own:` הוא מה ששורד
 * מעבר פרק (כלל 71).
 */

export const PORTRAIT_GROWTH: Record<string, string> = {
  ...PORTRAIT_CHAMPIONS,
  'שחור': 'faceShachor',
  'פרדי': 'faceFreddy',
  'מלמד': 'faceMelamed',
  /** נטע, גור ויונתן — אין להם פיגורה, וניצב כללי הוא הצורה הכנה לזה עד שהציור ינחת (כלל 67) */
  'נטע': 'faceWoman',
  'גור': 'faceYoung',
  'יונתן': 'faceYoung',
}

/** מי שעבר את שער הייסוד ב-2007 — `own:` שורד מעבר פרק, `u:` לא */
const FOUNDER = 'own:route:USSISHKIN_FOUNDER:entry'

// ------------------------------------------------------------------- Part I ------

export function objectiveCups(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['n:cups']) return sceneId === 'home' ? null : 'בבית. אבא סופר גמרים, ואמא סופרת ימי שישי.'
  return null
}

export const ENDINGS_CUPS: Record<string, EndingCard> = {
  there: {
    id: 'there',
    titleHe: 'אמרת עכשיו, אז הסתדר',
    bodyHe:
      'הלכת, ולפני שהלכת אמרת. רחל אמרה שאם אומרים עכשיו אפשר להסתדר, ואתה אמרת שאתה רושם את המשפט — ורשמת. זה הפרש של שלוש דקות בין ערב שמח לערב שמישהו שילם עליו.',
    memoryHe: 'כרטיס, ולידו פתק עם תאריך של יום שישי.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  sofa: {
    id: 'sofa',
    titleHe: 'אל תמהר עם העברת בעלות',
    bodyHe:
      'ראית עם קובי, במקום הקבוע. שאלת אם הספה שלו או שלך והוא אמר שלא למהר, ושניכם ידעתם שהוא לא מדבר על הספה.',
    memoryHe: 'שלט, על המשענת, בצד שלו.',
    memoryItem: 'folded-paper',
    presence: 'television',
  },
  elsewhere: {
    id: 'elsewhere',
    titleHe: 'אני לא מוכיח. אני רוצה להיות פה',
    bodyHe:
      'לא ראית, ולא בגלל שלא יכולת. רחל אמרה שהיא לא צריכה שתוכיח משהו, ואמרת שאתה לא מוכיח — שאתה רוצה להיות פה. ערב אחד, ולא ויתור על שום דבר.',
    memoryHe: 'צלחת נוספת, שכבר הייתה על השולחן.',
    memoryItem: 'folded-paper',
    presence: 'late',
  },
}

export const BEATS_CUPS: Beat[] = [
  { id: 'n-cups', at: 'home', trigger: 'enter', when: { none: [{ flag: 'n:cups' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'n-cups' }] },
]

// ------------------------------------------------------------------ Part II ------

export function objectiveFive(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['n:mentor'] === 'pending' && !state.flags['n:five']) return 'המתנדב החדש, עם הטופס ביד. באלנבי.'
  if (!state.flags['n:five']) return sceneId === 'allenby' ? null : 'פינת אלנבי. כולם שם, וכל אחד זוכר התחלה אחרת.'
  if (state.flags['n:gov'] === 'reading' && !state.flags['n:own']) {
    if (!state.flags['n:page:vote'] || !state.flags['n:page:money']) return 'שני הדפים של פרדי, על המדרגה. לקרוא לפני ששואלים.'
    return 'קראת. עכשיו השאלה — לפרדי.'
  }
  if (state.flags['n:gov'] === 'meeting' && !state.flags['n:own']) return 'המפגש שלקחת. על המדרגות, עכשיו.'
  if (!state.flags['n:own']) return sceneId === 'gate5' ? null : 'מתחת ליציע. פרדי הביא דפים.'
  if (state.flags['n:credit'] === 'writing' && !state.flags['n:room']) return 'הדף של הקרדיטים: לשאול כל אחד מה הוא עשה — ואז לתלות על הדלת.'
  if (state.flags['n:toRoom'] && !state.flags['n:room']) return sceneId === 'rehearsal' ? null : 'חדר החזרות. מישהו כבר מכוון.'
  if (!state.flags['n:room']) return 'חדר החזרות. הערב.'
  return null
}

export const ENDINGS_FIVE: Record<string, EndingCard> = {
  credit: {
    id: 'credit',
    titleHe: 'תכתוב מי עשה מה',
    bodyHe:
      'עזרת להפיק ערב, והלכת לכל אחד לשאול מה הוא עשה. נטע ביקשה שתכתוב מי יצר, וזה מה שכתבת: לא "בהפקת", אלא שורה לכל מי ששאלת.',
    memoryHe: 'דף חזרות, עם שמות בצד.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  friend: {
    id: 'friend',
    titleHe: 'בלי כדורגל עשר דקות',
    bodyHe:
      'נשארת לדבר עם יונתן. הוא אוהד של מי שהוא אוהד וזה מעולם לא היה השאלה — הוא הכין שיר, ואתה אמרת שאמרנו בלי כדורגל, ושניכם צחקתם על זה יותר מדי.',
    memoryHe: 'הקלטה, שלושים ושתיים שניות.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  listener: {
    id: 'listener',
    titleHe: 'גם להקשיב זו מיומנות',
    bodyHe:
      'באת, הקשבת, ולא לקחת על עצמך עוד דבר. מלמד אמר שגם זו מיומנות ואמרת שיגיד את זה לעמית — וזה היה מצחיק, וגם נכון, ובאמת לא לקחת.',
    memoryHe: 'כיסא בקצה החדר.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

export const BEATS_FIVE: Beat[] = [
  { id: 'n-five', at: 'allenby', trigger: 'enter', when: { none: [{ flag: 'n:five' }, { flag: 'n:mentor' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'n-five' }] },
  /** (90-E) the new volunteer, in front of you — the introduction is the act */
  { id: 'n-mentor', at: 'allenby', trigger: 'clock', when: { all: [{ flagIs: { flag: 'n:mentor', value: 'pending' } }], none: [{ flag: 'n:five' }] }, delayMs: 900, do: [{ a: 'talk', conversation: 'n-mentor' }] },
  { id: 'n-own', at: 'gate5', trigger: 'enter', when: { all: [{ flag: 'n:five' }], none: [{ flag: 'n:own' }, { flag: 'n:gov' }] }, delayMs: 650, do: [{ a: 'talk', conversation: 'n-own' }] },
  /** (90-E) the meeting he took — opened now, on the stairs under the stand */
  { id: 'n-meeting', at: 'gate5', trigger: 'clock', when: { all: [{ flagIs: { flag: 'n:gov', value: 'meeting' } }], none: [{ flag: 'n:own' }] }, delayMs: 1100, do: [{ a: 'talk', conversation: 'n-meeting' }] },
  /**
   * **חדר החזרות — מ-21.9.2026 חדר** (`rehearsal`, מהציור שמאור מסר). עד היום הוא היה רגע
   * על השעון, כי לא היה לו ציור; עכשיו הזמן קופץ לשם (כרטיס, ואז הדרך), והשיחה נפתחת
   * כשנכנסים — עם מלמד על הדרבוקה, נטע, גור ויונתן בחדר, ולא בסלון של מי שהשעון תפס.
   * שני ביטים ולא אחד, כי `travel` מסיים את הביט שלו (`WorldScene`, `case 'travel'`).
   */
  {
    id: 'n-to-room',
    trigger: 'clock',
    when: { all: [{ flag: 'n:own' }], none: [{ flag: 'n:toRoom' }] },
    delayMs: 1400,
    do: [{ a: 'flag', flag: 'n:toRoom' }, { a: 'card', titleHe: '2013', subHe: 'חדר החזרות', ms: 2200 }, { a: 'travel', to: 'rehearsal', spawn: 'start' }],
  },
  { id: 'n-room', at: 'rehearsal', trigger: 'enter', when: { all: [{ flag: 'n:toRoom' }], none: [{ flag: 'n:room' }, { flag: 'n:credit' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'n-room' }] },
]

// ---------------------------------------------------------------- the words ------

export const CONVERSATIONS_GROWTH: Conversation[] = [
  {
    id: 'n-cups',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'קובי', text: 'עוד גמר.' },
          { who: 'פוגי', text: 'אתה אומר את זה כאילו יש מבצע.' },
          { who: 'קובי', text: 'אני אומר את זה כי פעם לא היה.' },
          { who: 'רחל', text: 'ויש גם ארוחה ביום שישי. לזה עדיין צריך להודיע.' },
        ],
        choices: [
          {
            id: 'venue',
            text: '(לבחור משחק — ולתאם את הבית מראש.)',
            then: [
              { e: 'flag', flag: 'n:cups' },
              { e: 'flagValue', flag: 'n:cupsKind', value: 'there' },
              { e: 'time', minutes: 90 },
              { e: 'energy', delta: -10 },
              { e: 'memory', item: 'ticket-stub', id: 'n-cups-ticket' },
              /**
               * `life.planned_commitment` בתסריט → ראיה עם נושא ובלי קהל.
               * אין כאן קהל שראה: מה שנעשה נעשה **לפני**, בשיחה בסלון, ובדיוק זה העניין.
               */
              { e: 'proof', kind: 'planned_commitment', proofId: 'planned_commitment:{chapter}:friday', subjectHe: 'הערב של יום שישי', noteHe: 'הודיע מראש, ולא התנצל אחרי.' },
              { e: 'rel', who: 'rachel', axis: 'trust', delta: 4 },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'toast', text: 'רחל: "אתה אומר עכשיו, אז אפשר להסתדר." — "אני רושם את המשפט הזה."', tone: 'plain' },
              { e: 'ending', id: 'there' },
            ],
          },
          {
            id: 'sofa',
            text: '(לצפות עם קובי, ולהשאיר ערב אחר לחיים שלי.)',
            then: [
              { e: 'flag', flag: 'n:cups' },
              { e: 'flagValue', flag: 'n:cupsKind', value: 'sofa' },
              { e: 'time', minutes: 90 },
              { e: 'energy', delta: -5 },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'presence', mode: 'television' },
              { e: 'ending', id: 'sofa' },
            ],
          },
          {
            id: 'elsewhere',
            text: '"הפעם אני מדלג. יש התחייבות אחרת, והיא שלי."',
            then: [
              { e: 'flag', flag: 'n:cups' },
              { e: 'flagValue', flag: 'n:cupsKind', value: 'elsewhere' },
              { e: 'flagValue', flag: 'n:cups2012', value: 'personal_priority' },
              { e: 'rel', who: 'rachel', axis: 'bond', delta: 3 },
              { e: 'presence', mode: 'late' },
              { e: 'ending', id: 'elsewhere' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'n-five',
    nameHe: 'שחור',
    branches: [
      /**
       * הענף של מי שהיה שם ב-2007. **התואר לא מוזכר במילה אחת** — הוא נשמע בזה שאף
       * אחד לא מסביר לו כלום, ושחור זוכר מי החזיר מפתח.
       */
      {
        when: { flag: FOUNDER },
        lines: [
          { who: 'אפי', text: 'זוכר את ההתחלה?' },
          { who: 'יוסף', text: 'רגע, כל אחד זוכר התחלה אחרת.' },
          { who: 'שחור', text: 'אני זוכר מי החזיר מפתח.' },
          { who: 'פוגי', text: 'אתה לא תוותר על זה?' },
          { who: 'שחור', text: 'בדיוק.' },
        ],
        choices: [
          {
            id: 'together',
            text: '(לחגוג עם מי שעבד איתי לאורך הדרך.)',
            then: [
              { e: 'flag', flag: 'n:five' },
              { e: 'flag', flag: 'own:photo:basket2012' },
              { e: 'rel', who: 'yosef', axis: 'bond', delta: 3 },
              { e: 'proof', kind: 'community_help', proofId: 'community_help:{chapter}:five', subjectHe: 'חמש שנים, ומי היה בהן', audience: 'ussishkin', delta: 4, noteHe: 'לא סיפר מי התחיל; ספר מי החזיק.' },
              { e: 'heard', proofId: 'community_help:{chapter}:five' },
              { e: 'toast', text: 'יוסף: "עכשיו אפשר להגיד שזה החזיק." — "ועכשיו?" — "עכשיו צריך שזה יחזיק גם מחר."', tone: 'plain' },
            ],
          },
          {
            // (90-E) the introduction happens: `n-mentor`, with the new volunteer in front of you
            id: 'mentor',
            text: '(להכיר מתנדב חדש, ולהראות לו איך מצטרפים.)',
            then: [
              { e: 'flagValue', flag: 'n:mentor', value: 'pending' },
              { e: 'toast', text: 'ענבל מצביעה על בחור עם טופס ביד: "הוא. והוא לחוץ."', tone: 'plain' },
            ],
          },
          {
            id: 'afar',
            text: '(לשמוח מרחוק, ולהקשיב לאפי.)',
            then: [
              { e: 'flag', flag: 'n:five' },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'memory', item: 'folded-paper', id: 'n-five-photo' },
              { e: 'toast', text: 'אפי: "אתה צריך לראות את הפרצופים פה." — "תשלח אחד בלי שהאצבע שלך על העדשה."', tone: 'plain' },
            ],
          },
        ],
      },
      /**
       * ומי שלא היה שם ב-2007 שומע **שיחה אחרת**, לא גרסה מוחלשת שלה. זה הזיכרון
       * שמתאים לו: הוא הצטרף אחר כך, ואיש לא מנסה להראות לו שהוא פספס משהו.
       */
      {
        lines: [
          { who: 'אפי', text: 'זוכר מתי הצטרפת?' },
          { who: 'פוגי', text: 'לא בהתחלה.' },
          { who: 'אפי', text: 'אף אחד לא היה בהתחלה חוץ מארבעה, ושניים מהם רבו.' },
          { who: 'יוסף', text: 'אנחנו לא סופרים ותק. אנחנו סופרים מי בא שוב.' },
        ],
        choices: [
          {
            id: 'joined',
            text: '(לחגוג עם מי שכן הכרת בדרך.)',
            then: [
              { e: 'flag', flag: 'n:five' },
              { e: 'flag', flag: 'own:photo:basket2012' },
              { e: 'rel', who: 'yosef', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'יוסף: "עכשיו אפשר להגיד שזה החזיק." — "ועכשיו?" — "עכשיו צריך שזה יחזיק גם מחר."', tone: 'plain' },
            ],
          },
          {
            // (90-E) the introduction happens: `n-mentor`, with the new volunteer in front of you
            id: 'mentor',
            text: '(להכיר מתנדב חדש, ולהראות לו איך מצטרפים.)',
            then: [
              { e: 'flagValue', flag: 'n:mentor', value: 'pending' },
              { e: 'toast', text: 'ענבל מצביעה על בחור עם טופס ביד: "הוא. והוא לחוץ."', tone: 'plain' },
            ],
          },
          {
            id: 'afar',
            text: '(לשמוח מרחוק, ולהקשיב לאפי.)',
            then: [
              { e: 'flag', flag: 'n:five' },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'memory', item: 'folded-paper', id: 'n-five-photo' },
              { e: 'toast', text: 'אפי: "אתה צריך לראות את הפרצופים פה." — "תשלח אחד בלי שהאצבע שלך על העדשה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'n-own',
    nameHe: 'פרדי',
    branches: [
      {
        lines: [
          { who: 'פוגי', text: 'אז אנחנו הבעלים?' },
          { who: 'פרדי', text: 'תלוי למה אתה מתכוון ב״אנחנו״ וב״בעלים״.' },
          { who: 'אופיר', text: 'הוא מתכוון שאפשר להעיף מאמן.' },
          { who: 'פרדי', text: 'אז להתחיל מהתחלה.' },
          { who: 'יוסף', text: 'קודם תקרא מה מציעים לך.' },
        ],
        choices: [
          {
            // (90-E) the reading is done on the pages themselves (`n-page-*`), and the question is asked of Fredi (`n-ask`)
            id: 'read',
            text: '(לקרוא את המסמך, ולהכין שאלות לפני שמחליטים.)',
            then: [
              { e: 'flagValue', flag: 'n:gov', value: 'reading' },
              { e: 'toast', text: 'פרדי מניח שני דפים על המדרגה: "קודם תקרא. אחר כך תשאל."', tone: 'plain' },
            ],
          },
          {
            // (90-E) the meeting is opened now, with the people on the stairs (`n-meeting`)
            id: 'work',
            text: '(לקחת על עצמי את המפגש של הערב. בלי להבטיח שנה.)',
            then: [
              { e: 'flagValue', flag: 'n:gov', value: 'meeting' },
              { e: 'toast', text: 'יוסף: "מה אתה לוקח על עצמך?" — "מפגש אחד. בלי להבטיח שנה שלמה." — "אז הוא עכשיו."', tone: 'plain' },
            ],
          },
          {
            id: 'observer',
            text: '"אני רוצה להבין, לא בהכרח לנהל."',
            then: [
              { e: 'flag', flag: 'n:own' },
              { e: 'flagValue', flag: 'n:governance', value: 'observer' },
              { e: 'personality', key: 'honesty', delta: 2 },
              { e: 'toast', text: 'פרדי: "גם זו תשובה ברורה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'n-room',
    nameHe: 'נטע',
    branches: [
      {
        lines: [
          { who: null, text: 'חדר חזרות. מישהו כבר מכוון, ומישהו עוד לא הגיע.' },
          { who: 'גור', text: 'הוא נכנס מוקדם.' },
          { who: 'יונתן', text: 'אני היחיד שנכנס בזמן.' },
          { who: 'נטע', text: 'אתם מדברים על התיבה או על הדרבי?' },
          { who: 'פוגי', text: 'פה צריך לבחור?' },
          { who: 'מלמד', text: 'קודם תקשיבו אחד לשני. אחר כך תעשו רעש.' },
        ],
        choices: [
          {
            // (90-E) the credits are written by asking each of them (`n-cr-*`), and pinned on the door (`n-credit-done`)
            id: 'credit',
            text: '(לעזור בהפקת הערב — ולכתוב מי עשה מה.)',
            then: [
              { e: 'flagValue', flag: 'n:credit', value: 'writing' },
              { e: 'toast', text: 'נטע נותנת לך דף ועט: "תכתוב מי יצר. לא ״בהפקת״." — ארבעה אנשים בחדר, וכל אחד יודע מה הוא עשה.', tone: 'plain' },
            ],
          },
          {
            id: 'friend',
            text: '(להישאר לדבר עם יונתן אחרי החזרה.)',
            then: [
              { e: 'flag', flag: 'n:room' },
              { e: 'time', minutes: 30 },
              { e: 'rel', who: 'yonatan', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'יונתן: "בלי כדורגל עשר דקות?" — "אתה מתחיל." — "הכנתי שיר." — "אמרנו בלי כדורגל."', tone: 'plain' },
              { e: 'ending', id: 'friend' },
            ],
          },
          {
            id: 'listen',
            text: '(לבוא להקשיב. בלי לקחת עוד עבודה.)',
            then: [
              { e: 'flag', flag: 'n:room' },
              { e: 'time', minutes: 30 },
              { e: 'flagValue', flag: 'n:culture', value: 'listener' },
              { e: 'wellbeing', key: 'exhaustion', delta: -6 },
              { e: 'toast', text: 'מלמד: "גם להקשיב זו מיומנות." — "תגיד את זה לעמית."', tone: 'plain' },
              { e: 'ending', id: 'listener' },
            ],
          },
        ],
      },
    ],
  },
  // ============================================ עושים, לא אומרים — 2012 (90-E) ====
  //
  // `NARRATIVE-QUEST-DESIGN-PASS-v2` §11.4: שלוש בחירות כאן טענו שעבודה נעשתה — הכרת מתנדב,
  // קראת מסמך, הפקת ערב — ושילמו מיומנות וראיה ברגע הלחיצה. עכשיו כל אחת מהן היא הפועל
  // עצמו, בחדר שבו האנשים עומדים: שיחה עם המתנדב, שני דפים ושאלה, מפגש שנפתח, ודף קרדיטים
  // שנכתב מפה לפה. הראיה נכתבת על מה שנעשה, ורק עליו.

  // ---- N02 · המתנדב החדש ----
  {
    id: 'n-mentor',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'בחור בן עשרים, עם חולצה של הקבוצה עוד מקופלת בשקית, וטופס הרשמה שהוא מחזיק כמו כרטיס.' },
          { who: null, text: 'הוא שואל איך מצטרפים. מאחוריו ענבל מרימה יד — חמש אצבעות.' },
        ],
        choices: [
          {
            id: 'five',
            text: '(חמש דקות — ואז לתת לו משהו לעשות: לחלק את הדפים.)',
            then: [
              { e: 'flag', flag: 'n:five' },
              { e: 'flagValue', flag: 'n:mentor', value: 'done' },
              { e: 'time', minutes: 20 },
              // `mediation` בתסריט → `communication` במנוע (טבלת המיפוי)
              { e: 'skill', skill: 'communication', delta: 3, why: 'קודם תן לו מקום' },
              { e: 'proof', kind: 'mentored', proofId: 'mentored:{chapter}:volunteer', subjectHe: 'המתנדב החדש', audience: 'ussishkin', delta: 4, noteHe: 'חמש דקות ולא שעה, ואחר כך נתן לו לעשות.' },
              { e: 'heard', proofId: 'mentored:{chapter}:volunteer' },
              { e: 'toast', text: 'ענבל: "אל תספר לו שעה על פעם." — "חמש דקות?" — "קודם תן לו מקום." — והוא כבר מחלק דפים, לא בטוח למי.', tone: 'plain' },
            ],
          },
          {
            id: 'ask',
            text: '(לשאול אותו למה הוא בא — ולהקשיב עד הסוף.)',
            then: [
              { e: 'flag', flag: 'n:five' },
              { e: 'flagValue', flag: 'n:mentor', value: 'done' },
              { e: 'time', minutes: 20 },
              { e: 'skill', skill: 'communication', delta: 3, why: 'שאל, ושתק' },
              { e: 'proof', kind: 'mentored', proofId: 'mentored:{chapter}:volunteer', subjectHe: 'המתנדב החדש', audience: 'ussishkin', delta: 4, noteHe: 'שאל למה הוא בא, והקשיב לתשובה לפני שהסביר משהו.' },
              { e: 'heard', proofId: 'mentored:{chapter}:volunteer' },
              { e: 'toast', text: 'הוא: "כי אבא שלי היה בא, ואז הפסיק." — "אז אתה כבר יודע איך מצטרפים." — "איך?" — "באים שוב."', tone: 'plain' },
            ],
          },
          {
            id: 'story',
            text: '(לספר לו איך זה התחיל. מההתחלה.)',
            then: [
              { e: 'flag', flag: 'n:five' },
              { e: 'flagValue', flag: 'n:mentor', value: 'story' },
              { e: 'time', minutes: 40 },
              { e: 'toast', text: 'אחרי עשרים דקות הוא הסתכל בטלפון. ענבל, בשקט: "אמרתי לך. חמש."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },

  // ---- N03 · שני דפים, ושאלה אחת ----
  {
    id: 'n-page-vote',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הדף הראשון, סעיף 3: ״זכות הצבעה — לכל חבר עמותה ששילם דמי חבר.״' },
          { who: null, text: 'ובשוליים, בעט של פרדי, סימן שאלה אחד. בלי מילים.' },
        ],
        then: [{ e: 'flag', flag: 'n:page:vote' }, { e: 'time', minutes: 5 }],
      },
    ],
  },
  {
    id: 'n-page-money',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הדף השני, סעיף 7: ״העמותה תממן את חלקה מדמי חבר ומתרומות.״' },
          { who: null, text: 'חיפשת את הסעיף על שנה של הפסד. אין כזה. יש רווח בין סעיף 7 לסעיף 8.' },
        ],
        then: [{ e: 'flag', flag: 'n:page:money' }, { e: 'time', minutes: 5 }],
      },
    ],
  },
  {
    id: 'n-ask',
    nameHe: 'פרדי',
    branches: [
      {
        lines: [
          { who: 'פרדי', text: 'קראת?' },
          { who: 'אופיר', text: 'הוא קרא. אני ראיתי.' },
          { who: 'פרדי', text: 'אז מה השאלה?' },
        ],
        choices: [
          {
            id: 'vote',
            text: '(מי מצביע — מי ששילם, או מי שבא? הדף אומר רק את הראשון.)',
            when: { flag: 'n:page:vote' },
            noteHe: 'עוד לא קראת את הדף על ההצבעה.',
            then: [
              { e: 'flag', flag: 'n:own' },
              { e: 'flagValue', flag: 'n:gov', value: 'questions' },
              // `documentation`→`knowledge`, `enterprise`→`business` (טבלת המיפוי, לא ניחוש)
              { e: 'skill', skill: 'knowledge', delta: 3, why: 'קרא לפני שהחליט' },
              { e: 'skill', skill: 'business', delta: 2, why: 'סעיף, לא צעקה' },
              { e: 'proof', kind: 'read_document', proofId: 'read_document:{chapter}:offer', subjectHe: 'מה שהוצע לאוהדים', noteHe: 'שאלות כתובות, לפני ההחלטה ולא אחריה.' },
              { e: 'toast', text: 'פרדי: "עכשיו יש שאלה שאפשר לענות עליה." — "קודם הייתה רק צעקה." — "גם לה יש מקום. לא במקום סעיף."', tone: 'plain' },
            ],
          },
          {
            id: 'loss',
            text: '(ומה קורה בשנה של הפסד? אין על זה סעיף.)',
            when: { flag: 'n:page:money' },
            noteHe: 'עוד לא קראת את הדף על הכסף.',
            then: [
              { e: 'flag', flag: 'n:own' },
              { e: 'flagValue', flag: 'n:gov', value: 'questions' },
              { e: 'skill', skill: 'knowledge', delta: 3, why: 'קרא לפני שהחליט' },
              { e: 'skill', skill: 'business', delta: 2, why: 'מה שלא כתוב הוא גם סעיף' },
              { e: 'proof', kind: 'read_document', proofId: 'read_document:{chapter}:offer', subjectHe: 'מה שהוצע לאוהדים', noteHe: 'מצא את מה שחסר במסמך, ושאל עליו לפני ההחלטה.' },
              { e: 'toast', text: 'פרדי, אחרי שתיקה: "זו השאלה שקיוו שאף אחד לא ישאל." — יוסף כותב אותה בראש הדף.', tone: 'plain' },
            ],
          },
          {
            id: 'coach',
            text: '(אז אפשר להעיף מאמן?)',
            then: [
              { e: 'flag', flag: 'n:own' },
              { e: 'flagValue', flag: 'n:gov', value: 'shouted' },
              { e: 'toast', text: 'אופיר: "סוף סוף שאלה טובה." — פרדי: "זה לא כתוב באף דף. וזה בדיוק מה שמדאיג אותי."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },

  // ---- N03 · המפגש שלקחת ----
  {
    id: 'n-meeting',
    nameHe: 'יוסף',
    branches: [
      {
        lines: [
          { who: null, text: 'שנים־עשר אנשים על המדרגות מתחת ליציע. פרדי מחזיק את הדפים, ואופיר כבר עומד.' },
          { who: 'אופיר', text: 'אני אומר את זה פעם אחת: להעיף מאמן.' },
          { who: 'יוסף', text: 'יש לך סדר יום?' },
          { who: 'פוגי', text: 'יש לי שלוש שורות.' },
        ],
        choices: [
          {
            id: 'agenda',
            text: '(לתת לאופיר דקה — ואז לחזור לשלוש השורות.)',
            then: [
              { e: 'flag', flag: 'n:own' },
              { e: 'flagValue', flag: 'n:gov', value: 'ran' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'מפגש אחד, מוגדר' },
              // `terrace` בתסריט → `gate5` במנוע
              { e: 'proof', kind: 'community_work', proofId: 'community_work:{chapter}:meeting', subjectHe: 'המפגש שלקחת', audience: 'gate5', delta: 4, noteHe: 'פתח מפגש אחד, נתן לצעקה דקה, וחזר לסדר היום.' },
              { e: 'heard', proofId: 'community_work:{chapter}:meeting' },
              { e: 'toast', text: 'אופיר קיבל דקה, ובסופה אמר "טוב, תמשיך". יוסף כתב פרוטוקול בשוליים של הדף של פרדי.', tone: 'plain' },
            ],
          },
          {
            id: 'hand',
            text: '(לתת ליוסף לפתוח. אני סופר ידיים.)',
            then: [
              { e: 'flag', flag: 'n:own' },
              { e: 'flagValue', flag: 'n:gov', value: 'delegated' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -3 },
              { e: 'rel', who: 'yosef', axis: 'trust', delta: 3 },
              { e: 'toast', text: 'יוסף פתח, ואתה ספרת ידיים: תשע בעד, שלוש "נראה". מספר אחד אמיתי יותר מערב של צעקות.', tone: 'plain' },
            ],
          },
          {
            id: 'floor',
            text: '(לתת לכולם לדבר. הסדר יבוא לבד.)',
            then: [
              { e: 'flag', flag: 'n:own' },
              { e: 'flagValue', flag: 'n:gov', value: 'loud' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -6 },
              { e: 'toast', text: 'שעה של צעקות. בסוף מישהו שאל מתי המפגש הבא, ואף אחד לא ידע — כולל אתה.', tone: 'red' },
            ],
          },
        ],
      },
    ],
  },

  // ---- N04 · מי עשה מה — לשאול כל אחד ----
  {
    id: 'n-cr-melamed',
    nameHe: 'מלמד',
    branches: [
      { when: { flag: 'n:cr:melamed' }, lines: [{ who: 'מלמד', text: 'כתבת כבר. דרבוקה. לא יותר.' }] },
      {
        lines: [
          { who: 'מלמד', text: 'תכתוב ״מלמד — דרבוקה״.' },
          { who: 'פוגי', text: 'לא ״ניהול מוזיקלי״?' },
          { who: 'מלמד', text: 'אני מתופף. מי שמנהל, מנהל רעש.' },
        ],
        then: [{ e: 'flag', flag: 'n:cr:melamed' }, { e: 'time', minutes: 5 }],
      },
    ],
  },
  {
    id: 'n-cr-neta',
    nameHe: 'נטע',
    branches: [
      { when: { flag: 'n:cr:neta' }, lines: [{ who: 'נטע', text: 'אני כבר על הדף. תמשיך.' }] },
      {
        lines: [
          { who: 'נטע', text: 'המילים של הפזמון השני. והלחן של הראשון — זה של גור, אל תיתן לו להגיד שלא.' },
          { who: 'פוגי', text: 'אז שני שמות על שיר אחד.' },
          { who: 'נטע', text: 'ככה נראה שיר.' },
        ],
        then: [{ e: 'flag', flag: 'n:cr:neta' }, { e: 'time', minutes: 5 }],
      },
    ],
  },
  {
    id: 'n-cr-gur',
    nameHe: 'גור',
    branches: [
      { when: { flag: 'n:cr:gur' }, lines: [{ who: 'גור', text: 'אחרון. אמרתי.' }] },
      {
        lines: [
          { who: 'גור', text: 'אותי תכתוב אחרון.' },
          { who: 'גור', text: 'ואת הכבלים — זה לא אני. זה אח של יונתן. הוא הביא, חיבר, והלך הביתה לפני שהתחלנו.' },
        ],
        then: [{ e: 'flag', flag: 'n:cr:gur' }, { e: 'flag', flag: 'n:cr:cables' }, { e: 'time', minutes: 5 }],
      },
    ],
  },
  {
    id: 'n-cr-yonatan',
    nameHe: 'יונתן',
    branches: [
      { when: { flag: 'n:cr:yonatan' }, lines: [{ who: 'יונתן', text: 'שיר אחד. ואח אחד, אם שאלת.' }] },
      {
        when: { flag: 'n:cr:cables' },
        lines: [
          { who: 'יונתן', text: 'תכתוב ״יונתן — שיר אחד״.' },
          { who: 'פוגי', text: 'והכבלים? גור אומר שזה אח שלך.' },
          { who: 'יונתן', text: 'הוא יתבייש. תכתוב אותו גדול. ״עידו — כבלים, חשמל, ושתיקה.״' },
        ],
        then: [{ e: 'flag', flag: 'n:cr:yonatan' }, { e: 'flag', flag: 'n:cr:brother' }, { e: 'time', minutes: 5 }],
      },
      {
        lines: [
          { who: 'יונתן', text: 'תכתוב ״יונתן — שיר אחד״.' },
          { who: 'יונתן', text: 'הכנתי שיר. על כדורגל. אל תגיד לאף אחד.' },
        ],
        then: [{ e: 'flag', flag: 'n:cr:yonatan' }, { e: 'time', minutes: 5 }],
      },
    ],
  },
  {
    /**
     * הדף על הדלת — **מה שנכתב הוא מה ששאלת** (`n:cr:*`). ארבעה אנשים בחדר, ואחד שהלך:
     * את הכבלים יודעים רק מגור, ואת השם — רק מיונתן. הראיה רק לדף שיש בו שורה לכל מי
     * שהיה בחדר; דף חלקי הוא ערב אמיתי, בלי ראיה.
     */
    id: 'n-credit-done',
    nameHe: 'נטע',
    branches: [
      {
        when: { all: [{ flag: 'n:cr:melamed' }, { flag: 'n:cr:neta' }, { flag: 'n:cr:gur' }, { flag: 'n:cr:yonatan' }] },
        lines: [
          { who: null, text: 'הדף על הדלת, בנייר דבק של חשמלאים.' },
          { who: 'נטע', text: 'שורה לכל אחד.' },
        ],
        then: [
          { e: 'flag', flag: 'n:room' },
          { e: 'flagValue', flag: 'n:credit', value: 'full' },
          { e: 'energy', delta: -10 },
          { e: 'skill', skill: 'organization', delta: 3, why: 'ערב שמישהו צריך להפיק' },
          { e: 'skill', skill: 'creativity', delta: 2, why: 'קרדיט הוא חלק מהיצירה' },
          { e: 'proof', kind: 'culture_delivery', proofId: 'culture_delivery:{chapter}:evening', subjectHe: 'ערב החזרות', audience: 'gate5', delta: 3, noteHe: 'שאל כל אחד מה עשה, וכתב שורה לכל אחד.' },
          { e: 'heard', proofId: 'culture_delivery:{chapter}:evening' },
          { e: 'memory', item: 'folded-paper', id: 'n-rehearsal-note' },
          { e: 'toast', text: 'נטע קוראת את הדף מלמעלה עד למטה, ולא מתקנת כלום.', tone: 'plain' },
          { e: 'ending', id: 'credit' },
        ],
      },
      {
        when: { any: [{ flag: 'n:cr:melamed' }, { flag: 'n:cr:neta' }, { flag: 'n:cr:gur' }, { flag: 'n:cr:yonatan' }] },
        lines: [
          { who: null, text: 'הדף על הדלת. יש בו שורות, ויש בו רווח — מי שלא שאלת נשאר בלי שם.' },
          { who: 'נטע', text: 'זה התחלה. בפעם הבאה — כולם.' },
        ],
        then: [
          { e: 'flag', flag: 'n:room' },
          { e: 'flagValue', flag: 'n:credit', value: 'partial' },
          { e: 'energy', delta: -6 },
          { e: 'memory', item: 'folded-paper', id: 'n-rehearsal-note' },
          { e: 'ending', id: 'credit' },
        ],
      },
      {
        lines: [
          { who: null, text: 'הדף נשאר ריק על הדלת.' },
          { who: 'מלמד', text: 'גם להקשיב זו מיומנות. אבל אז לא לוקחים עט.' },
        ],
        then: [{ e: 'flag', flag: 'n:room' }, { e: 'flagValue', flag: 'n:credit', value: 'empty' }, { e: 'ending', id: 'listener' }],
      },
    ],
  },
]
