import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { GALIL_PROMISE } from './chapter1993galil'

/**
 * B10 · "שש־עשרה שנה" · 19.5.1999 — the first convergence after the fractures.
 *
 * Getting there is the play: army or work, money, transport, and who will still ride
 * with you. Gate 7 and Gate 5 arrive separately. The basketball-first friends have
 * reasons to be hurt. During the penalties the input controls breath, looking, holding
 * a friend's shoulder or turning away — never the kicks. After the victory the group may
 * reunite, remain divided, or share one temporary embrace. A trophy does not force
 * reconciliation.
 *
 * **No score, no scorer, no opponent's name in a line.** The archive holds 19.5.1999.
 */

export const KICKOFF_99 = at(20, 0)

/**
 * שני מספרים ושני נושאים, במקום אחד.
 *
 * `FINAL_TICKET_AGOROT` הוא מה שכרטיס לגמר עולה — אותם שישים שקל שפרק 2000 נוקב בהם,
 * כי זה אותו אצטדיון ואותו מפעל. `SEAT_SUBJECT` ו-`BUS_SUBJECT` הם ה-`subjectHe` שכל
 * צמד ראיות חולק: מקום שנמסר ומקום שנעשה בו שימוש, ואנשים שנרשמו ואנשים שהגיעו.
 */
export const FINAL_TICKET_AGOROT = 6000
const SEAT_SUBJECT = 'הכרטיס לגמר הגביע'
const BUS_SUBJECT = 'המיניבוס של שער 5'

export const PORTRAIT_CUP99: Record<string, string> = {
  'פוגי': 'faceHero80',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel90',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'אפי': 'faceEfi',
  'לירון': 'faceLiron',
  'מישל': 'faceMichel',
  'אסף': 'faceAsaf',
  'שחור': 'faceShachor',
  'המפקד': 'faceCommander',
  'הבוס': 'faceBoss',
  'אוהד': 'faceSupporter',
  'סדרן': 'faceUsher',
  // שני הקבועים של אלנבי — שני השחקנים האלה מתויגים `era: '*'` ב-`scenes.ts`, כלומר הם
  // עומדים שם בכל פרק, ולכן כל מפה צריכה את הפלייטים שלהם.
  'המוכר': 'faceVendor',
  'הגבר': 'faceSupporterB',
}

export function objectiveCup99(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['c99:over']) return null
  if (state.flags['c99:route']) return sceneId === 'ramat-gan' ? null : 'רמת גן. שמונה.'
  return 'גמר גביע. איך מגיעים, ועם מי.'
}

export const ENDINGS_CUP99: Record<string, EndingCard> = {
  together: {
    id: 'together',
    titleHe: 'שש־עשרה שנה',
    bodyHe:
      'היית שם. וכשזה נגמר — כשהשריקה האחרונה סוף־סוף באה — מצאת אותם: את מי שעמד בשער 7 ואת מי שעמד בשער 5, באותו חיבוק, לרגע. לרגע. בדרך הביתה כבר נפרדו לשני אוטובוסים. אבל הרגע היה. שש־עשרה שנה חיכית לו ולא ידעת.',
    memoryHe: 'כרטיס הגמר. שלם. לא קרוע — הסדרן לא הספיק.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  divided: {
    id: 'divided',
    titleHe: 'גביע, בנפרד',
    bodyHe:
      'היית שם. וכשזה נגמר חיפשת אותם ולא מצאת — או מצאת, ולא ניגשת. שער 7 חגג בצד אחד, שער 5 בשני, ואתה באמצע, עם גביע ששייך לכולם ושמחה שלא. הדרך הביתה הייתה ארוכה יותר משהייתה צריכה.',
    memoryHe: 'כרטיס הגמר. בפינה, בעט, שם של מישהו שלא בא.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  late: {
    id: 'late',
    titleHe: 'הגעת לפנדלים',
    bodyHe:
      'הגעת אחרי שהתחילו — הצבא, העבודה, האוטובוס, לא משנה. הגעת לפנדלים. וזה, מסתבר, מה שהיית צריך: לעמוד בכניסה, לא לנשום, ולראות אנשים שאתה אוהב לא נושמים.',
    memoryHe: 'כרטיס קרוע חצי. הסדרן היה עסוק.',
    memoryItem: 'ticket-stub',
    presence: 'late',
  },
  away: {
    id: 'away',
    titleHe: 'גביע מרחוק',
    bodyHe:
      'לא היית. שמעת — או ראית במסך קטן במקום שלא בחרת — ובסוף צעקת לבד. גביע ראשון מאז שהיית בן חמש על הכתפיים, ולא היית. מישהו יתקשר. מישהו יספר. זה לא אותו דבר. גם זה יישאר.',
    memoryHe: 'דף עם שעות שכתבת בזמן ששמעת. בסוף, בכתב גדול: !!!',
    memoryItem: 'folded-paper',
    presence: 'radio',
  },
}

export const BEATS_CUP99: Beat[] = [
  {
    id: 'c99-open',
    at: 'home',
    trigger: 'enter',
    when: { none: [{ flag: 'c99:opened' }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: 'c99:opened' },
      { a: 'events', events: [{ t: 'money.changed', agorot: 7000, why: 'משכורת' }] },
      { a: 'lines', lines: [{ who: null, text: 'יום רביעי, סוף מאי. גמר גביע, הערב, ברמת גן. שש־עשרה שנה מאז שאבא הרים אותך מעל קהל בגמר גביע. אתה לא זוכר אותו. הוא זוכר.' }, { who: null, text: 'יש כרטיס, אולי. יש דרך, אולי. יש אנשים שיסעו איתך — כל אחד באוטו אחר.' }] },
    ],
  },
  // the routes close at their hours
  {
    id: 'c99-late-route',
    trigger: 'clock',
    when: { afterMinute: KICKOFF_99 - 20, none: [{ flag: 'c99:route' }, { flag: 'c99:over' }] },
    do: [{ a: 'flag', flag: 'c99:route' }, { a: 'flag', flag: 'c99:away' }, { a: 'card', titleHe: 'שמונה', subHe: 'לא שם', ms: 2200 }, { a: 'talk', conversation: 'c99-away' }],
  },
  {
    id: 'c99-stadium',
    at: 'ramat-gan',
    trigger: 'enter',
    when: { flag: 'c99:route', none: [{ flag: 'c99:over' }, { flag: 'arrived:late' }] },
    delayMs: 1000,
    do: [
      { a: 'card', titleHe: 'אצטדיון רמת גן', subHe: 'גמר גביע המדינה', ms: 2600, art: 'plate-1999-cup' },
      { a: 'match', script: 'cup-99' },
    ],
  },
  // in after it started: no ninety minutes to direct — straight to the shootout
  {
    id: 'c99-stadium-late',
    at: 'ramat-gan',
    trigger: 'enter',
    when: { all: [{ flag: 'c99:route' }, { flag: 'arrived:late' }], none: [{ flag: 'c99:over' }] },
    delayMs: 1000,
    do: [
      { a: 'card', titleHe: 'אצטדיון רמת גן', subHe: 'גמר גביע המדינה', ms: 2600, art: 'plate-1999-cup' },
      { a: 'talk', conversation: 'c99-match' },
    ],
  },
]

export const CONVERSATIONS_CUP99: Conversation[] = [
  {
    id: 'kobi-cup99',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'c99:route' }, lines: [{ who: 'קובי', text: 'שער 7 נוסע באוטובוס של בארי. אני שם. אתה — איפה שאתה.' }] },
      {
        lines: [
          { who: 'קובי', text: 'שמונים ושלוש. היית על הכתפיים שלי. אתה לא זוכר. אני זוכר כל דקה.' },
          { who: 'קובי', text: 'הערב אני נוסע עם החבר\'ה של שער 7. יש מקום. אתה בא איתנו?' },
        ],
        choices: [
          { id: 'with-kobi', text: '"בא איתך."', then: [{ e: 'flag', flag: 'c99:route' }, { e: 'flag', flag: 'c99:with-kobi' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 5 }, { e: 'redheart', key: 'familyTradition', delta: 4 }, { e: 'time', minutes: 90 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
          { id: 'other', text: '"אני מסתדר. נתראה שם."', then: [{ e: 'rel', who: 'kobi', axis: 'distance', delta: 2 }, { e: 'toast', text: '"נתראה שם." הוא לא שאל עם מי.', tone: 'plain' }, { e: 'consequence', id: 'c99:alone', text: 'אבא נסע בלעדיך.', laterText: 'אולי כבר לא יחכו לך בשער.', afterMinutes: 50 }] },
        ],
      },
    ],
  },
  {
    id: 'liron-cup99',
    nameHe: 'לירון',
    branches: [
      /**
       * שלושים שקל משנת תשעים ושש, באותו אוטו.
       *
       * בחורף ההוא, בדרך למשחק חוץ, מחוג הדלק היה נמוך ומי ששתק — לירון שילם עליו. זה
       * נרשם כ-`owe:liron` וכחוב בכיס, והמקום היחיד ההגיוני לסגור אותו הוא כאן: אותו
       * אדם, אותו רכב, שלוש שנים אחרי, כשיש משכורת.
       *
       * הענף עומד **לפני** שאר הענפים כי הוא לא מציע נסיעה — הוא סוגר חשבון, ואחריו
       * השיחה ממשיכה כרגיל. וזה גם הפרעון היחיד שקורה מחוץ לפינה של אוסישקין, כלומר
       * הפרק השני ש-`ACH_BALANCE` מבקש ("שני פרעונות בשני מועדים").
       */
      {
        when: { all: [{ flag: 'owe:liron' }], minAgorot: 3000 },
        lines: [
          { who: null, text: 'הוצאת שלושים שקל והנחת על לוח המחוונים, ליד המברג.' },
          { who: 'פוגי', text: 'חצי דלק. מתשעים ושש.' },
          { who: 'לירון', text: '(מסתכל על השטרות, לא עליך.) אני לא זוכר.' },
          { who: 'פוגי', text: 'אני זוכר.' },
          { who: null, text: 'הוא לקח, קיפל, ושם בכיס החולצה. ואז הדליק את הרדיו, כאילו לא קרה כלום.' },
        ],
        then: [
          { e: 'money', agorot: -3000, why: 'חצי דלק, מתשעים ושש' },
          { e: 'flagValue', flag: 'owe:liron', value: false },
          { e: 'debt', agorot: -3000, why: 'חצי הדלק של לירון, נסגר' },
          { e: 'proof', kind: 'debt_settled', proofId: 'debt_settled:{chapter}:liron', subjectHe: 'חצי הדלק שלירון שילם', noteHe: 'שלוש שנים אחרי, באותו אוטו.' },
          { e: 'rel', who: 'liron', axis: 'trust', delta: 5 },
          { e: 'rel', who: 'liron', axis: 'sharedHistory', delta: 3 },
          { e: 'personality', key: 'reliability', delta: 2 },
          { e: 'time', minutes: 5 },
        ],
      },
      { when: { flag: 'c99:route' }, lines: [{ who: 'לירון', text: 'החלטת. יופי. תדליק רדיו בדרך, שלא תפספס כלום.' }] },
      {
        when: { relationship: { who: 'liron', axis: 'sharedHistory', min: 4 } },
        lines: [{ who: 'לירון', text: 'אותו אוטו. אותו רדיו. הפעם בלי ויכוח בדרך, בסדר? בסדר.' }],
        choices: [
          { id: 'go', text: '"בסדר. נוסעים."', then: [{ e: 'flag', flag: 'c99:route' }, { e: 'flag', flag: 'c99:with-liron' }, { e: 'rel', who: 'liron', axis: 'bond', delta: 4 }, { e: 'time', minutes: 80 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
          { id: 'no', text: '"לא הפעם."', then: [] },
        ],
      },
      { lines: [{ who: 'לירון', text: 'יש לי מקום. אבל אתה לא ממש מכיר אותי, נכון? חבל. בפעם הבאה.' }] },
    ],
  },
  {
    id: 'michel-cup99',
    nameHe: 'מישל',
    branches: [
      { when: { flag: 'c99:route' }, lines: [{ who: 'מישל', text: 'המיניבוס מלא. נתראה ביציע.' }] },
      {
        when: { gateEver: 'gate5' },
        lines: [{ who: 'מישל', text: 'מיניבוס של שער 5. עשרים שקל לראש, יוצאים בשש וחצי מהקיוסק. אסף כבר בפנים עם הבד על הברכיים.' }],
        /**
         * הפנקס של מישל, והמחיר שלו.
         *
         * *"מי נסע, מי איחר, כמה עלה"* — הפנקס הזה קיים בסיפור מ-1993, ואף פעם לא היה
         * אפשר להחזיק אותו. לקחת אותו זה לקחת אחריות **על אנשים בשמם**, וזה מה
         * ש-`ACH_TEAM` מבקש: לא לארגן, אלא **להביא**. ההתחייבות נרשמת כאן והתוצאה
         * נרשמת ברמת גן — כי מי שממלא מקומות ואז נוסע באוטו של אבא שלו הבטיח לאנשים
         * שהוא יהיה שם. הענף השני של אותה שורה קיים בדיוק בשביל זה.
         */
        choices: [
          { id: 'notebook', text: 'לקחת את הפנקס. למלא את המקומות האחרונים בעצמך.', when: { minAgorot: 2000, none: [{ flag: 'c99:notebook' }] }, noteHe: 'אין עשרים, ובלי מקום משלך אי אפשר לרשום אחרים.', then: [{ e: 'goto', node: 'michel-notebook' }] },
          { id: 'go', text: '"עשרים. בא."', when: { minAgorot: 2000 }, noteHe: 'אין עשרים.', then: [{ e: 'money', agorot: -2000, why: 'מיניבוס של שער 5' }, { e: 'flag', flag: 'c99:route' }, { e: 'flag', flag: 'c99:with-gate5' }, { e: 'rel', who: 'michel', axis: 'bond', delta: 3 }, { e: 'rel', who: 'asaf', axis: 'bond', delta: 3 }, { e: 'time', minutes: 90 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
          { id: 'no', text: '"לא הפעם."', then: [] },
        ],
      },
      { lines: [{ who: 'מישל', text: 'המיניבוס של שער 5. אתה לא משלנו, אבל אם יש מקום — נראה.' }] },
    ],
  },
  {
    id: 'michel-notebook',
    nameHe: 'מישל',
    branches: [
      {
        lines: [
          { who: 'מישל', text: '(מושיט את הפנקס בלי להרים את הראש.) ארבעה מקומות. שמות, לא "חברים".' },
          { who: null, text: 'כתבת שלושה שמות של אנשים שאתה יודע שיבואו, והשארת שורה ריקה למי שתמיד מאחר.' },
          { who: 'מישל', text: 'מי שרשום — באחריותך. אני סופר ראשים בשש ועשרים ונוסע בשש וחצי. מה שחסר, חסר.' },
        ],
        then: [
          { e: 'flag', flag: 'c99:notebook' },
          { e: 'time', minutes: 20 },
          { e: 'skill', skill: 'organization', delta: 2, why: 'לקח פנקס ומילא מקומות' },
          { e: 'rel', who: 'michel', axis: 'trust', delta: 4 },
          { e: 'toast', text: 'שלושה שמות בכתב שלך, בפנקס שאתה לא מחזיק.', tone: 'plain' },
        ],
        choices: [
          { id: 'ride', text: '"עשרים. אני ראשון במיניבוס."', when: { minAgorot: 2000 }, noteHe: 'אין עשרים.', then: [{ e: 'money', agorot: -2000, why: 'מיניבוס של שער 5' }, { e: 'flag', flag: 'c99:route' }, { e: 'flag', flag: 'c99:with-gate5' }, { e: 'rel', who: 'michel', axis: 'bond', delta: 3 }, { e: 'rel', who: 'asaf', axis: 'bond', delta: 3 }, { e: 'time', minutes: 90 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
          { id: 'later', text: 'להחזיק את הפנקס ולהחליט אחר כך איך אתה מגיע.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'ofir-cup99',
    nameHe: 'אופיר',
    branches: [
      { when: { flag: 'c99:route' }, lines: [{ who: 'אופיר', text: 'תראה אותי שם. או שלא. הקערה הזאת בולעת אנשים.' }] },
      {
        lines: [{ who: 'אופיר', text: 'אוטובוס רגיל. עשרה שקלים, שתי החלפות, ואם מאחרים — מאחרים. אבל זה אנחנו, כמו פעם.' }],
        choices: [
          { id: 'go', text: '"כמו פעם."', when: { minAgorot: 1000 }, noteHe: 'אין עשרה.', then: [{ e: 'money', agorot: -1000, why: 'אוטובוס' }, { e: 'flag', flag: 'c99:route' }, { e: 'flag', flag: 'c99:with-ofir' }, { e: 'flag', flag: 'arrived:late' }, { e: 'rel', who: 'ofir', axis: 'sharedHistory', delta: 5 }, { e: 'time', minutes: 150 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
          { id: 'no', text: '"לא הפעם."', then: [] },
        ],
      },
    ],
  },
  {
    /**
     * אפי, שש שנים אחרי הלילה בצפון.
     *
     * שתי השורות שהיו כאן הן אותן שתי שורות; מה שנוסף הוא **דלת**. מי שאפי זוכר שהפר לו
     * הבטחה יכול לומר את זה בקול — וזה `ACH_REPAIR`, שמצליב תיקון מול ההפרה שנרשמה
     * ב-1993 על אותו נושא. ומי שיש לו שישים שקל יכול לתת לו מקום, וזה `ACH_GAVE`, שמצליב
     * מסירה מול **שימוש**: הראיה השנייה נרשמת רק ברמת גן, כשרואים אותו שם.
     *
     * שתיהן אופציונליות, ואף אחת מהן לא נדרשת לשנייה. אפשר להתנצל ולא לשלם, ואפשר לתת
     * מקום בלי לפתוח את 1993 בכלל — למי שמעולם לא הפר כלום אין מה לתקן.
     */
    id: 'efi-cup99',
    nameHe: 'אפי',
    branches: [
      {
        when: { relationship: { who: 'efi', axis: 'trust', max: 44 } },
        lines: [{ who: 'אפי', text: 'כדורגל. יופי. תהנה.' }, { who: null, text: 'הוא לא בא. לא הזמנת. שניכם ידעתם.' }],
        then: [{ e: 'wellbeing', key: 'regret', delta: 3 }],
        choices: [
          { id: 'repair', text: '"אפי. תשעים ושלוש. אמרתי \'מה שלא יהיה\' ולא הגעתי."', when: { relationshipMemory: { who: 'efi', eventId: 'broke-promise-1993' } }, hidden: true, then: [{ e: 'goto', node: 'efi-cup99-93' }] },
          { id: 'seat', text: '"יש לי מקום. ויש לי שישים שקל. בוא."', when: { minAgorot: FINAL_TICKET_AGOROT }, noteHe: 'אין שישים.', then: [{ e: 'goto', node: 'efi-cup99-seat' }] },
          { id: 'leave', text: 'לא להגיד כלום.', then: [] },
        ],
      },
      {
        lines: [{ who: 'אפי', text: 'אני לא בא. לא בגלל משהו. פשוט — זה שלכם. אני אשמח בשבילכם מפה.' }, { who: null, text: 'הוא אמר "שלכם". פעם היה "שלנו".' }],
        then: [{ e: 'wellbeing', key: 'regret', delta: 2 }],
        choices: [
          { id: 'seat', text: '"זה גם שלך. יש לי מקום, ושישים שקל."', when: { minAgorot: FINAL_TICKET_AGOROT }, noteHe: 'אין שישים.', then: [{ e: 'goto', node: 'efi-cup99-seat' }] },
          { id: 'leave', text: 'לא להתווכח איתו.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'efi-cup99-93',
    nameHe: 'אפי',
    branches: [
      {
        lines: [
          { who: null, text: 'הוא לא ענה מיד. הוא הסתכל על הרחוב, ואז עליך.' },
          { who: 'אפי', text: 'אני יודע למה לא הגעת. זה לא היה הכסף.' },
          { who: 'פוגי', text: 'לא.' },
          { who: 'אפי', text: 'טוב. שש שנים לקח לך להגיד את זה, וזה עדיין קצר יותר ממה שחשבתי.' },
        ],
        then: [
          { e: 'rel', who: 'efi', axis: 'trust', delta: 8 },
          { e: 'rel', who: 'efi', axis: 'distance', delta: -5 },
          { e: 'proof', kind: 'repair_completed', proofId: 'repair_completed:{chapter}:galil', subjectHe: GALIL_PROMISE, noteHe: 'שש שנים אחרי, על המדרכה, לפני גמר אחר.' },
          { e: 'remember', who: 'efi', eventId: 'came-back-to-1993', significance: 'major' },
          { e: 'personality', key: 'honesty', delta: 3 },
        ],
        choices: [
          { id: 'seat', text: '"ויש לי מקום. ושישים שקל. בוא."', when: { minAgorot: FINAL_TICKET_AGOROT }, noteHe: 'אין שישים.', then: [{ e: 'goto', node: 'efi-cup99-seat' }] },
          { id: 'enough', text: 'להשאיר את זה כאן.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'efi-cup99-seat',
    nameHe: 'אפי',
    branches: [
      {
        lines: [
          { who: null, text: 'הוצאת שישים שקל וסידרת לו כרטיס. הוא לא אמר תודה ולא אמר לא.' },
          { who: 'אפי', text: 'כדורגל, אה.' },
          { who: 'פוגי', text: 'כדורגל.' },
          { who: 'אפי', text: '(מקפל את הכרטיס לארבע ושם בכיס החולצה.) אז נתראה שם.' },
        ],
        then: [
          { e: 'money', agorot: -FINAL_TICKET_AGOROT, why: 'כרטיס לאפי' },
          { e: 'flag', flag: 'c99:seat-efi' },
          { e: 'proof', kind: 'ticket_shared', proofId: 'ticket_shared:{chapter}:efi', subjectHe: SEAT_SUBJECT, noteHe: 'אפי. שישים שקל, ומקום ביציע שהוא לא ביקש.' },
          { e: 'rel', who: 'efi', axis: 'bond', delta: 5 },
          { e: 'redheart', key: 'community', delta: 4 },
          { e: 'personality', key: 'empathy', delta: 2 },
        ],
      },
    ],
  },
  {
    id: 'c99-away',
    nameHe: null,
    branches: [
      {
        when: { armyRoute: 'punished' },
        lines: [{ who: null, text: 'הבסיס. שמונה בערב. רדיו של מישהו במסדרון. המפקד עבר, שמע, לא אמר כלום. "שבת הבאה" מאז דצמבר עוד לא נגמרה.' }],
        then: [{ e: 'flag', flag: 'c99:over' }, { e: 'army', key: 'fatigue', delta: 5 }, { e: 'ending', id: 'away' }],
      },
      {
        lines: [{ who: null, text: 'לא יצאת. איפשהו ברמת גן אצטדיון מלא, ואתה עם רדיו על השיש. כשזה נגמר צעקת לבד, ומישהו מהקומה למעלה דפק ברצפה.' }],
        then: [{ e: 'flag', flag: 'c99:over' }, { e: 'ending', id: 'away' }],
      },
    ],
  },
  {
    /**
     * מי שאיחר — and only him.
     *
     * This conversation had a second branch, three paragraphs long, describing the ninety
     * minutes for a player who arrived on time. It could never run: a player who arrives
     * on time gets `{ a: 'match', script: 'cup-99' }`, the directed match, which describes
     * those ninety minutes minute by minute. Two versions of the same night, one of them
     * unreachable, and the unreachable one was the better written — which is exactly how
     * dead content survives. It is gone; the fallback is one line, and it goes where the
     * night goes anyway.
     */
    id: 'c99-match',
    nameHe: null,
    branches: [
      {
        when: { flag: 'arrived:late' },
        lines: [{ who: null, text: 'הגעת אחרי שהתחילו. שני האוטובוסים, ההחלפות, אופיר שאמר "זה בסדר" שבע פעמים. נכנסתם בהארכה. האצטדיון היה בתוך משהו שלא ידעת לקרוא.' }],
        then: [{ e: 'goto', node: 'c99-pens' }],
      },
      {
        lines: [{ who: null, text: 'ואז השופט מסתכל בשעון, ואתה יודע מה זה אומר.' }],
        then: [{ e: 'goto', node: 'c99-pens' }],
      },
    ],
  },
  {
    id: 'c99-pens',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'פנדלים. ומהיציע עולה שם אחד, שוב ושוב, כמו תוף: שביט. שביט.' },
          { who: null, text: 'אין לך שליטה על שום דבר שקורה עכשיו. יש לך שליטה על דבר אחד: מה אתה עושה עם הגוף שלך.' },
        ],
        choices: [
          { id: 'breathe', text: 'לנשום. לאט. להסתכל.', then: [{ e: 'personality', key: 'courage', delta: 2 }, { e: 'flag', flag: 'pens:looked' }, { e: 'goto', node: 'c99-pens-2' }] },
          { id: 'shoulder', text: 'להחזיק כתף של מי שלידך.', then: [{ e: 'redheart', key: 'community', delta: 3 }, { e: 'wellbeing', key: 'belonging', delta: 4 }, { e: 'flag', flag: 'pens:held' }, { e: 'goto', node: 'c99-pens-2' }] },
          { id: 'turn', text: 'להסתובב. לא לראות.', then: [{ e: 'personality', key: 'riskTolerance', delta: -1 }, { e: 'flag', flag: 'pens:turned' }, { e: 'goto', node: 'c99-pens-2' }] },
        ],
      },
    ],
  },
  {
    id: 'c99-pens-2',
    nameHe: null,
    branches: [
      {
        when: { flag: 'pens:turned' },
        lines: [{ who: null, text: 'שמעת את זה בגב. פעם, ופעמיים — שביט. הקהל מאחוריך עשה קול שלא שמעת קודם. ואז השקט הכי ארוך בעולם, ואז—' }, { who: null, text: 'הסתובבת. בזמן.' }],
        then: [{ e: 'goto', node: 'c99-won' }],
      },
      {
        lines: [{ who: null, text: 'שביט. פעם. ואז עוד פעם. אתה לא יודע איך אדם עומד שם לבד מול כל זה. אחר כך אחד משלכם ניגש לאט. הרעש נעלם. יש רק את הרגליים שלו.' }, { who: null, text: 'ואז—' }],
        then: [{ e: 'goto', node: 'c99-won' }],
      },
    ],
  },
  {
    id: 'c99-won',
    nameHe: null,
    branches: [
      {
        when: { flag: 'pens:held' },
        lines: [{ who: null, text: 'הכתף שהחזקת קפצה. אתה קפצת איתה. אתה לא יודע מי זה היה. אחר כך התברר שזה היה שחור. או אסף. או אבא. כולם אומרים שזה היה הם.' }],
        then: [{ e: 'sfx', key: 'crowd-goal', level: 0.9 }, { e: 'wellbeing', key: 'happiness', delta: 15 }, { e: 'redheart', key: 'footballLove', delta: 6 }, { e: 'goto', node: 'c99-seat' }],
      },
      {
        lines: [{ who: null, text: 'אצטדיון שלם באוויר בבת אחת. אתה ביניהם. גביע. הראשון מאז הכתפיים.' }],
        then: [{ e: 'sfx', key: 'crowd-goal', level: 0.9 }, { e: 'wellbeing', key: 'happiness', delta: 15 }, { e: 'redheart', key: 'footballLove', delta: 6 }, { e: 'goto', node: 'c99-seat' }],
      },
    ],
  },
  {
    /**
     * מה שקרה למה שנתת — ולא לְמה שהתכוונת לתת.
     *
     * `ticket_shared` נרשם ברחוב, כשהכרטיס עבר מיד ליד; `ticket_used` נרשם **רק כאן**,
     * כשרואים את האיש בפנים. זו כל ההבחנה של ההישג: מקום שנמסר אינו מקום שנעשה בו
     * שימוש, ובין שני המשפטים האלה עומדת ערב שלם שבו אדם יכול לא לבוא.
     */
    id: 'c99-seat',
    nameHe: null,
    branches: [
      {
        when: { flag: 'c99:seat-efi' },
        lines: [
          { who: null, text: 'ואז ראית אותו. שתי שורות מעליך ומעט שמאלה, בין אנשים שהוא לא מכיר, עומד על הכיסא כמו כולם.' },
          { who: null, text: 'הכרטיס המקופל לארבע עוד בכיס החולצה שלו. הוא הוציא אותו אחר כך, והסתכל עליו, והחזיר.' },
        ],
        then: [
          { e: 'proof', kind: 'ticket_used', proofId: 'ticket_used:{chapter}:efi', subjectHe: SEAT_SUBJECT, noteHe: 'הוא עמד על הכיסא. הוא לא עושה את זה.' },
          { e: 'rel', who: 'efi', axis: 'sharedHistory', delta: 6 },
          { e: 'wellbeing', key: 'belonging', delta: 4 },
          { e: 'goto', node: 'c99-bus' },
        ],
      },
      { lines: [], then: [{ e: 'goto', node: 'c99-bus' }] },
    ],
  },
  {
    /**
     * הפנקס, ברמת גן — ושתי התשובות שיש לו.
     *
     * מי שמילא מקומות **ונסע במיניבוס** הביא אותם: `group_delivered`. מי שמילא מקומות
     * ואז הגיע בדרך אחרת רשם אנשים והפקיר את הרשימה — `group_unresolved` על אותו נושא,
     * וההישג קורא את שניהם ולכן הוא לא ניתן. אין קנס ואין הודעה: יש שורה שנייה בפנקס.
     */
    id: 'c99-bus',
    nameHe: null,
    branches: [
      {
        when: { all: [{ flag: 'c99:notebook' }, { flag: 'c99:with-gate5' }] },
        lines: [
          { who: 'מישל', text: '(מקפל את הפנקס.) ארבעה רשומים, ארבעה עלו. אף אחד לא נשאר בקיוסק.' },
          { who: null, text: 'הוא כתב את השם שלך למעלה, בראש העמוד, ולא אמר על זה כלום.' },
        ],
        then: [
          { e: 'proof', kind: 'group_delivered', proofId: 'group_delivered:{chapter}:minibus', subjectHe: BUS_SUBJECT, noteHe: 'ארבעה רשומים, ארבעה עלו.' },
          { e: 'rel', who: 'michel', axis: 'trust', delta: 6 },
          { e: 'redheart', key: 'community', delta: 5 },
          { e: 'goto', node: 'c99-after' },
        ],
      },
      {
        when: { flag: 'c99:notebook' },
        lines: [
          { who: null, text: 'בפינה, אחרי, מישל עם הפנקס. הוא לא כועס. זה יותר גרוע.' },
          { who: 'מישל', text: 'שלושה שמות בכתב שלך. שניים חיכו בקיוסק עד שבע. אתה כבר היית בדרך אחרת.' },
        ],
        then: [
          { e: 'proof', kind: 'group_unresolved', proofId: 'group_unresolved:{chapter}:minibus', subjectHe: BUS_SUBJECT, noteHe: 'רשם אנשים, והגיע בלעדיהם.' },
          { e: 'rel', who: 'michel', axis: 'trust', delta: -4 },
          { e: 'wellbeing', key: 'regret', delta: 5 },
          { e: 'goto', node: 'c99-after' },
        ],
      },
      { lines: [], then: [{ e: 'goto', node: 'c99-after' }] },
    ],
  },
  {
    id: 'c99-after',
    nameHe: null,
    branches: [
      {
        when: { flag: 'arrived:late' },
        lines: [{ who: null, text: 'עמדת בכניסה. אופיר לידך. לא הספקת לחפש אף אחד. זה היה מספיק.' }],
        then: [{ e: 'flag', flag: 'c99:over' }, { e: 'ending', id: 'late' }],
      },
      {
        lines: [
          { who: null, text: 'אחר כך. שער 7 בצד אחד עם הדגלים הישנים, שער 5 בצד השני עם הבד, ובאמצע — אתה. ליד המעקה בוכה מישהו זקן ואומר "שלום תקוה", ולא מסביר למה.' },
        ],
        choices: [
          { id: 'both', text: 'ללכת לאבא, ואז לאסף. לחבק את שניהם.', when: { gateEver: 'gate5' }, noteHe: 'אף פעם לא עמדת בשער 5. אסף לא מחכה לך.', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 5 }, { e: 'rel', who: 'asaf', axis: 'bond', delta: 4 }, { e: 'redheart', key: 'loyaltyReturn', delta: 5 }, { e: 'flag', flag: 'c99:over' }, { e: 'flag', flag: 'life:cup99:together' }, { e: 'ending', id: 'together' }] },
          { id: 'kobi', text: 'לאבא.', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 6 }, { e: 'remember', who: 'kobi', eventId: 'cup-hug-1999', significance: 'major' }, { e: 'flag', flag: 'c99:over' }, { e: 'flag', flag: 'life:cup99:together' }, { e: 'ending', id: 'together' }] },
          { id: 'gate5', text: 'לאסף ולבד.', when: { gateEver: 'gate5' }, hidden: true, then: [{ e: 'rel', who: 'asaf', axis: 'bond', delta: 5 }, { e: 'rel', who: 'kobi', axis: 'distance', delta: 4 }, { e: 'flag', flag: 'c99:over' }, { e: 'ending', id: 'divided' }] },
          { id: 'alone', text: 'להישאר באמצע. לראות את שניהם מרחוק.', then: [{ e: 'wellbeing', key: 'loneliness', delta: 5 }, { e: 'personality', key: 'independence', delta: 2 }, { e: 'flag', flag: 'c99:over' }, { e: 'ending', id: 'divided' }] },
        ],
      },
    ],
  },
]
