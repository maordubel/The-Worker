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
  if (!state.flags['n:five']) return sceneId === 'allenby' ? null : 'פינת אלנבי. כולם שם, וכל אחד זוכר התחלה אחרת.'
  if (!state.flags['n:own']) return sceneId === 'gate5' ? null : 'מתחת ליציע. פרדי הביא דפים.'
  if (state.flags['n:toRoom'] && !state.flags['n:room']) return sceneId === 'rehearsal' ? null : 'חדר החזרות. מישהו כבר מכוון.'
  if (!state.flags['n:room']) return 'חדר החזרות. הערב.'
  return null
}

export const ENDINGS_FIVE: Record<string, EndingCard> = {
  credit: {
    id: 'credit',
    titleHe: 'תכתוב מי עשה מה',
    bodyHe:
      'הפקת ערב, וכתבת את השמות — גם של מי שהביא כבלים. נטע ביקשה שתכתוב מי יצר, וזה מה שכתבת: לא "בהפקת", אלא שורה לכל אחד.',
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
  { id: 'n-five', at: 'allenby', trigger: 'enter', when: { none: [{ flag: 'n:five' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'n-five' }] },
  { id: 'n-own', at: 'gate5', trigger: 'enter', when: { all: [{ flag: 'n:five' }], none: [{ flag: 'n:own' }] }, delayMs: 650, do: [{ a: 'talk', conversation: 'n-own' }] },
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
  { id: 'n-room', at: 'rehearsal', trigger: 'enter', when: { all: [{ flag: 'n:toRoom' }], none: [{ flag: 'n:room' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'n-room' }] },
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
            id: 'mentor',
            text: '(להכיר מתנדב חדש, ולהראות לו איך מצטרפים.)',
            then: [
              { e: 'flag', flag: 'n:five' },
              { e: 'time', minutes: 30 },
              // `mediation` בתסריט → `communication` במנוע (טבלת המיפוי)
              { e: 'skill', skill: 'communication', delta: 3, why: 'קודם תן לו מקום' },
              { e: 'proof', kind: 'mentored', proofId: 'mentored:{chapter}:volunteer', subjectHe: 'המתנדב החדש', audience: 'ussishkin', delta: 4, noteHe: 'חמש דקות ולא שעה, ואחר כך נתן לו לעשות.' },
              { e: 'heard', proofId: 'mentored:{chapter}:volunteer' },
              { e: 'toast', text: 'ענבל: "אל תספר לו שעה על פעם." — "חמש דקות?" — "קודם תן לו מקום."', tone: 'plain' },
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
            id: 'mentor',
            text: '(להכיר מתנדב חדש, ולהראות לו איך מצטרפים.)',
            then: [
              { e: 'flag', flag: 'n:five' },
              { e: 'time', minutes: 30 },
              { e: 'skill', skill: 'communication', delta: 3, why: 'קודם תן לו מקום' },
              { e: 'proof', kind: 'mentored', proofId: 'mentored:{chapter}:volunteer', subjectHe: 'המתנדב החדש', audience: 'ussishkin', delta: 4, noteHe: 'מי שהצטרף אחר כך יודע הכי טוב איך מצטרפים.' },
              { e: 'heard', proofId: 'mentored:{chapter}:volunteer' },
              { e: 'toast', text: 'ענבל: "אל תספר לו שעה על פעם." — "חמש דקות?" — "קודם תן לו מקום."', tone: 'plain' },
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
            id: 'read',
            text: '(לקרוא את המסמך, ולהכין שאלות לפני שמחליטים.)',
            then: [
              { e: 'flag', flag: 'n:own' },
              { e: 'time', minutes: 45 },
              // `documentation`→`knowledge`, `enterprise`→`business` (טבלת המיפוי, לא ניחוש)
              { e: 'skill', skill: 'knowledge', delta: 3, why: 'קרא לפני שהחליט' },
              { e: 'skill', skill: 'business', delta: 2, why: 'סעיף, לא צעקה' },
              { e: 'proof', kind: 'read_document', proofId: 'read_document:{chapter}:offer', subjectHe: 'מה שהוצע לאוהדים', noteHe: 'שאלות כתובות, לפני ההחלטה ולא אחריה.' },
              { e: 'toast', text: 'פרדי: "עכשיו יש שאלה שאפשר לענות עליה." — "קודם הייתה רק צעקה." — "גם לה יש מקום. לא במקום סעיף."', tone: 'plain' },
            ],
          },
          {
            id: 'work',
            text: '(לקחת על עצמי מפגש אחד. בלי להבטיח שנה.)',
            then: [
              { e: 'flag', flag: 'n:own' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'מפגש אחד, מוגדר' },
              // `terrace` בתסריט → `gate5` במנוע
              { e: 'proof', kind: 'community_work', proofId: 'community_work:{chapter}:meeting', subjectHe: 'המפגש שלקחת', audience: 'gate5', delta: 4, noteHe: 'הבטיח מפגש אחד, והוא היה מוגדר לפני שהתחיל.' },
              { e: 'heard', proofId: 'community_work:{chapter}:meeting' },
              { e: 'toast', text: 'יוסף: "מה אתה לוקח על עצמך?" — "מפגש אחד. בלי להבטיח שנה שלמה."', tone: 'plain' },
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
            id: 'credit',
            text: '(לעזור בהפקת הערב — ולכתוב מי עשה מה.)',
            then: [
              { e: 'flag', flag: 'n:room' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -10 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'ערב שמישהו צריך להפיק' },
              { e: 'skill', skill: 'creativity', delta: 2, why: 'קרדיט הוא חלק מהיצירה' },
              { e: 'proof', kind: 'culture_delivery', proofId: 'culture_delivery:{chapter}:evening', subjectHe: 'ערב החזרות', audience: 'gate5', delta: 3, noteHe: 'שורה לכל אחד, כולל מי שהביא כבלים.' },
              { e: 'heard', proofId: 'culture_delivery:{chapter}:evening' },
              { e: 'memory', item: 'folded-paper', id: 'n-rehearsal-note' },
              { e: 'ending', id: 'credit' },
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
]
