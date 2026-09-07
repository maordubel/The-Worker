import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * B8 · "השרוכים" · 2.5.1998 — the day the world feels dishonest and nothing he does can
 * change the table. The decade's character forge (brief §7, B8).
 *
 * Their own match is lived directly, at Bloomfield, and it goes well — that is the
 * cruelty. The other match, far away, reaches the terrace only through delay and
 * contradiction: a transistor, a pager, a man who heard from a man. At the decisive
 * change the screen stops explaining. Then ten minutes outside with no objective, and a
 * choice that is a human act rather than an ideology; then a lesson the next morning in
 * which a teacher says an ordinary word and a boy hears it through the wound.
 *
 * **No score, no scorer, no opponent in any line.** The archive holds both rows of that
 * day (`content/manual/matches.json`, 2.5.1998). The laces are named because the day is.
 */

export const L1 = 'life:laces:d1'
export const L2 = 'life:laces:d2'
export const KICKOFF_98 = at(17, 0)
export const HALF_98 = at(17, 47)
export const FULL_98 = at(18, 50)

export const PORTRAIT_LACES: Record<string, string> = {
  'פוגי': 'faceHero80',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel90',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'סוקו': 'faceSoko',
  'אסף': 'faceAsaf',
  'שחור': 'faceShachor',
  'המורה': 'faceTeacher',
  'אוהד': 'faceSupporter',
  'אוהד ותיק': 'faceOldMan',
  'קול מהרדיו': 'faceSupporterB',
}

export function objectiveLaces(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags[L2]) return state.flags['l2:done'] ? null : 'יום ראשון. שיעור ערבית, שעה שנייה.'
  if (state.flags['l1:after']) return null
  if (state.flags['l1:inside']) return null
  if (sceneId === 'home') return 'שבת. המחזור לפני האחרון. אבא זהיר, החבר\'ה בטוחים.'
  return 'לבלומפילד. חמש.'
}

export const ENDINGS_LACES: Record<string, EndingCard> = {
  witness: {
    id: 'witness',
    titleHe: 'ראית. זה מה שנשאר.',
    bodyHe:
      'לא צעקת ולא רצת. עמדת וראית — את הפנים, את השקט שבא אחרי הרעש, את האיש עם הטרנזיסטור שהמשיך להקשיב לתחנה שכבר עברה לפרסומות. למחרת, בשיעור, מילה רגילה אחת נכנסה לך דרך הפצע. עוד לא ידעת מה תעשה עם היום הזה. ידעת שתזכור אותו.',
    memoryHe: 'העיתון של מחרת. לא קראת. קיפלת.',
    memoryItem: 'newspaper',
    presence: 'inside',
  },
  protector: {
    id: 'protector',
    titleHe: 'החזקת מישהו',
    bodyHe:
      'כשכולם רצו לאיזשהו כיוון, נשארת עם מי שלא יכול היה לזוז. ישבתם על מדרגות הבטון עד שכיבו את הזרקורים. אמרתם אולי חמישה משפטים. למחרת בשיעור, מילה רגילה נשמעה לך כמו לעג, ועצרת את עצמך שנייה לפני. השנייה הזאת — זה מה שהיום הזה עשה ממך.',
    memoryHe: 'כרטיס מקומט. לא שלך. של מי שהחזקת.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  organizer: {
    id: 'organizer',
    titleHe: 'אז נכתוב את זה',
    bodyHe:
      'הלכת עם סוקו לאסוף עיתונים — של היום, ושל מחר בבוקר. "אם לא נכתוב, בעוד שנה יגידו שזה לא היה." אתם עוד לא יודעים בשביל מה. אתם יודעים שמישהו צריך. למחרת, בשיעור, כשמילה רגילה נשמעה לך אחרת — שאלת מה היא אומרת. זו הייתה השאלה הראשונה מסוג חדש.',
    memoryHe: 'קטע עיתון, גזור ישר, עם תאריך בעט למעלה. הכתב של סוקו.',
    memoryItem: 'clipping',
    presence: 'inside',
  },
  avenger: {
    id: 'avenger',
    titleHe: 'רצת',
    bodyHe:
      'רצת לאיזשהו כיוון עם אנשים שרצו. מישהו משך אותך חזרה בחולצה. לא קרה כלום — כלום חוץ מזה שידעת שאתה יכול. למחרת, בשיעור, מילה רגילה נשמעה לך כמו לעג, וקמת. את השאר אתה מעדיף לא לזכור. אתה זוכר.',
    memoryHe: 'חולצה עם תפר קרוע בצוואר. לא זרקת.',
    memoryItem: 'scarf',
    presence: 'inside',
  },
  withdrawn: {
    id: 'withdrawn',
    titleHe: 'הביתה',
    bodyHe:
      'הלכת הביתה לפני שהאצטדיון התרוקן. אבא היה שם, בכורסה, עם הרדיו כבוי. לא דיברתם. הוא שם יד על הכתף שלך כשעברת. למחרת, בשיעור, מילה רגילה נכנסה לך דרך הפצע, ושתקת. השתיקה הזאת נמשכה הרבה זמן.',
    memoryHe: 'כלום. הכורסה של אבא, וריח של רדיו כבוי.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  radio: {
    id: 'radio',
    titleHe: 'מרחוק',
    bodyHe:
      'לא היית באצטדיון. שמעת את שני המשחקים בבת אחת, מרדיו שקפץ בין תחנות, במקום שלא בחרת להיות בו. כשזה נגמר לא היה למי לצעוק. למחרת, בשיעור, מילה רגילה עשתה לך משהו שלא ציפית.',
    memoryHe: 'דף עם שני טורים של מספרים שכתבת ומחקת. הרדיו לא ידע לספור.',
    memoryItem: 'folded-paper',
    presence: 'radio',
  },
}

const DAY = (flag: string, year: number, weekday: number, minute: number, dateHe?: string) =>
  [{ t: 'day.entered', dayId: flag, year, weekday, minute, ...(dateHe ? { dateHe } : {}) } as const, { t: 'flag.raised', flag } as const]

export const BEATS_LACES: Beat[] = [
  {
    id: 'l1-open',
    at: 'home',
    trigger: 'enter',
    when: { none: [{ flag: L1 }, { flag: L2 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: L1 },
      { a: 'events', events: [{ t: 'money.changed', agorot: 4000, why: 'שבת' }] },
      { a: 'lines', lines: [{ who: null, text: 'שבת, המחזור ה-29 — עוד אחד אחריו. אתם ראשונים בנקודה אחת, או שהם — תלוי את מי שואלים ומתי. המשחק שלכם בבלומפילד. שלהם — רחוק, בעיר שאתה לא בטוח איפה היא על המפה.' }, { who: null, text: 'עשרים. שתים־עשרה שנה מאז המשחק הראשון שלך, שמונה מאז השבת שבבית לא מזכירים. אבא בכורסה, בגרביים, לא נוגע ברדיו. מלמטה שורקים לך.' }] },
    ],
  },
  // the match — ours on the grass, theirs in a transistor — directed in one minute (`laces-98`)
  {
    id: 'l1-match',
    at: 'bloomfield-inside',
    trigger: 'enter',
    when: { flag: L1, none: [{ flag: 'l1:match' }] },
    delayMs: 900,
    do: [
      { a: 'flag', flag: 'l1:match' },
      { a: 'card', titleHe: 'בלומפילד', subHe: 'המחזור ה-29', ms: 2200 },
      { a: 'match', script: 'laces-98' },
      { a: 'flag', flag: 'l1:end' },
    ],
  },
  // radio route: not at the ground when it happens
  {
    id: 'l1-radio',
    trigger: 'clock',
    when: { flag: L1, afterMinute: FULL_98 + 4, none: [{ flag: 'l1:inside' }, { flag: 'l1:after' }] },
    do: [
      { a: 'flag', flag: 'l1:after' },
      { a: 'sound', kind: 'radio', on: true },
      { a: 'talk', conversation: 'l1-radio-end' },
      { a: 'sound', kind: 'radio', on: false },
    ],
  },
  /** הרגע השני של הצעיף — אופיר על המדרגות, ואין לו כלום ביד */
  {
    id: 'l1-scarf',
    trigger: 'clock',
    when: { all: [{ flag: 'l1:after' }, { flag: 'scarf:given' }], none: [{ flag: 'scarf:asked:98' }, { flag: 'l1:cut' }] },
    do: [{ a: 'flag', flag: 'scarf:asked:98' }, { a: 'talk', conversation: 'scarf-ofir-98' }],
  },
  // the morning after: a lesson
  {
    id: 'l1-to-class',
    trigger: 'clock',
    when: { flag: 'l1:cut', none: [{ flag: L2 }] },
    do: [
      { a: 'card', titleHe: 'יום ראשון', subHe: 'שיעור ערבית', ms: 2600 },
      { a: 'events', events: DAY(L2, 1998, 0, at(9, 0), '3 במאי 1998') },
      { a: 'travel', to: 'classroom', spawn: 'start' },
    ],
  },
  {
    id: 'l2-class',
    at: 'classroom',
    trigger: 'enter',
    when: { flag: L2, none: [{ flag: 'l2:done' }] },
    delayMs: 900,
    do: [{ a: 'talk', conversation: 'l2-tayeb' }],
  },
]

export const CONVERSATIONS_LACES: Conversation[] = [
  {
    id: 'kobi-laces',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'l1:after' }, lines: [{ who: 'קובי', text: '…' }, { who: null, text: 'הרדיו כבוי. הוא לא כיבה אותו. הוא נגמר.' }] },
      {
        lines: [
          { who: 'קובי', text: 'לא לחגוג. לא לנאחס. לא לפני שזה נגמר גם שם. בתשעים הסתובבתי בין שערים ושאלתי אנשים מה קרה, ואף אחד לא ידע.' },
          { who: 'קובי', text: 'היום יש פייג׳ר. אז מה. פייג׳ר לא יודע יותר ממה שמישהו אמר לו.' },
        ],
        choices: [
          { id: 'calc', text: '"עשיתי חשבון. אם אנחנו מנצחים והם לא—"', then: [{ e: 'rel', who: 'kobi', axis: 'familiarity', delta: 2 }, { e: 'personality', key: 'curiosity', delta: 1 }, { e: 'toast', text: '"אם. אם. אם." הוא לא רצה לשמוע את החשבון. הוא ידע אותו.', tone: 'plain' }] },
          { id: 'fear', text: '"אני מפחד."', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 4 }, { e: 'remember', who: 'kobi', eventId: 'said-afraid-1998', significance: 'notable' }, { e: 'toast', text: '"גם אני." הוא לא אמר את זה. הוא אמר "קח ז\'קט".', tone: 'plain' }] },
          { id: 'sure', text: '"זה שלנו. אני יודע."', then: [{ e: 'personality', key: 'impulsiveness', delta: 2 }, { e: 'rel', who: 'kobi', axis: 'tension', delta: 2 }, { e: 'toast', text: 'הוא הסתכל עליך כמו על מישהו שעוד לא הפסיד מספיק.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'ofir-laces',
    nameHe: 'אופיר',
    branches: [
      { when: { flag: 'l1:after' }, lines: [{ who: 'אופיר', text: 'אל תדבר איתי. לא עכשיו. לא הערב.' }] },
      { lines: [{ who: 'אופיר', text: 'זהו. היום. אני מרגיש את זה. אתה מרגיש?' }, { who: 'עמית', text: 'הוא מרגיש. אני סופר. ההפרש הוא נקודה, ולשניהם יש משחק. יש הבדל.' }], then: [{ e: 'rel', who: 'ofir', axis: 'familiarity', delta: 1 }] },
    ],
  },
  /**
   * אסף, אחרי — the gate-5 organiser at the moment the stand has just understood. He is
   * the only person outside who is not standing still, and what he wants from Pogi
   * depends on what Pogi did at the ten-year-olds a minute ago.
   */
  {
    id: 'asaf-laces',
    nameHe: 'אסף',
    branches: [
      { when: { lacesIs: 'avenger' }, lines: [{ who: 'אסף', text: 'ראית? ראית מה הם עשו לילדים? מחר בבוקר אני ליד ההנהלה. אתה בא.' }], choices: [{ id: 'yes', text: '"בא."', then: [{ e: 'rel', who: 'asaf', axis: 'bond', delta: 4 }, { e: 'institution', key: 'protestEscalation', delta: 6 }, { e: 'flag', flag: 'l1:promised-asaf' }] }, { id: 'no', text: '"לא ככה. לא הלילה."', then: [{ e: 'rel', who: 'asaf', axis: 'tension', delta: 3 }, { e: 'personality', key: 'reliability', delta: 1 }] }] },
      { when: { lacesIs: 'protector' }, lines: [{ who: 'אסף', text: 'נשארת עם החבר שלך. יפה. אני נשארתי עם ארבעים ילדים. גם יפה.' }, { who: 'אסף', text: 'מחר אנחנו מתחילים משהו. לא צעקות. משהו.' }], then: [{ e: 'rel', who: 'asaf', axis: 'familiarity', delta: 2 }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 2 }] },
      { when: { lacesIs: 'organizer' }, lines: [{ who: 'אסף', text: 'אתה וסוקו. עיתונים. טוב. מישהו צריך לכתוב מה קרה פה לפני שיכתבו את זה בשבילנו.' }], then: [{ e: 'rel', who: 'asaf', axis: 'bond', delta: 3 }] },
      { when: { lacesIs: 'withdrawn' }, lines: [{ who: 'אסף', text: 'הביתה? לך. אף אחד לא שופט. רק תזכור איך זה נראה פה. תצטרך את זה.' }], then: [{ e: 'rel', who: 'asaf', axis: 'familiarity', delta: 1 }] },
      { lines: [{ who: 'אסף', text: 'עמדת והסתכלת. גם זה משהו. תשאל מה עשו לשלום תקוה — לא תמצא שורה בשום עיתון, תמצא אנשים שראו. עדים זה כל מה שיש לנו.' }], then: [{ e: 'redheart', key: 'historyMemory', delta: 2 }] },
    ],
  },
  {
    id: 'soko-laces',
    nameHe: 'סוקו',
    branches: [
      { when: { flag: 'l1:after' }, lines: [{ who: 'סוקו', text: 'מה אנחנו יודעים. מה שמענו. מה אנחנו ממציאים. שלוש רשימות. אני עושה את הראשונה.' }] },
      { lines: [{ who: 'סוקו', text: 'אני יושב ליד מי שיש לו טרנזיסטור. לא בשביל הרעש — בשביל לדעת מי אמר מה, ובאיזו דקה.' }] },
    ],
  },
  /**
   * השרוכים — the moment the day is named after, and the hardest one in the game to write.
   *
   * The screenplay's rule is the whole craft of it (§25): *"אסור להפוך את זה למם. אסור
   * Zoom קומי."* Nobody in Bloomfield saw anything. What reached them was a commentator
   * describing confusion and a sentence that made no sense, and the horror is precisely
   * that it made no sense YET. So: no camera move, no stinger, no accusation. A man asks
   * what is happening, somebody answers with a fact about a shoe, and nobody says anything
   * after that. The player supplies the rest, which is exactly what happened to everyone
   * who was there.
   *
   * What the game must never do here is state as fact what the archive holds as a claim.
   * The line says what was heard. The archive card (`2.5.1998`) keeps verified events,
   * contemporary accusations and later testimony in three separate lists, and that is the
   * only place any of it is weighed.
   *
   * Named `l1-` rather than `m98-` on purpose: in this codebase an `m…` prompt is one the
   * player answers, and the point of this one is that there is nothing to answer.
   */
  {
    id: 'l1-laces',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: 'אוהד עם רדיו', text: 'מה הוא עושה?' },
          { who: 'פוגי', text: 'מי?' },
          { who: 'אוהד עם רדיו', text: 'שם. אחד מהם.' },
          { who: 'פוגי', text: 'מה הוא עושה?' },
          { who: null, text: 'הוא לא עונה מיד. הוא מקרב את הרדיו לאוזן, כאילו זה יעזור.' },
          { who: 'אוהד עם רדיו', text: 'קושר נעל.' },
          { who: 'פוגי', text: 'עכשיו?' },
          { who: null, text: 'אף אחד לא עונה. מאחוריכם היציע עוד שר.' },
        ],
        then: [{ e: 'flag', flag: 'm98:laces' }, { e: 'redheart', key: 'historyMemory', delta: 3 }],
      },
    ],
  },
  {
    id: 'l1-whistle',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'עוד כדור. הרחקה. עוד כדור.' },
          { who: null, text: 'לירון מחזיק את הרדיו בשתי ידיים. קובי מאחוריך. עמית הגיע. אופיר הגיע. כולם פה עכשיו, בלי שאף אחד קרא להם.' },
          { who: 'קול מהרדיו', text: '…פישונט—' },
          { who: null, text: 'ואז הקול של השדר עולה, ומקריית אליעזר עולה רעש דרך רמקול בגודל של מטבע.' },
          { who: null, text: 'האיש עם הטרנזיסטור הוריד אותו. לא כיבה. הוריד.' },
          { who: null, text: 'ואז ראית איך זה עובר ביציע: לא צעקה. גל של פנים שמבינות, שורה אחרי שורה, כמו כשמכבים אורות.' },
        ],
        then: [{ e: 'flag', flag: 'l1:inside' }, { e: 'flag', flag: 'l1:after' }, { e: 'wellbeing', key: 'stress', delta: 12 }, { e: 'wellbeing', key: 'happiness', delta: -10 }, { e: 'goto', node: 'l1-ten' }],
      },
    ],
  },
  {
    id: 'l1-ten',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'עשר דקות. אין מטרה. אין שורה על המסך שאומרת מה לעשות.' },
          { who: null, text: 'אופיר על המדרגות, לא זז. אסף ואנשים שלו הולכים לאיזשהו כיוון, מהר. סוקו כותב. מישהו צועק על מישהו שלא היה שם.' },
        ],
        choices: [
          { id: 'stay', text: 'לשבת ליד אופיר. לא לזוז.', then: [{ e: 'laces', response: 'protector' }, { e: 'rel', who: 'ofir', axis: 'bond', delta: 6 }, { e: 'remember', who: 'ofir', eventId: 'stayed-with-me-1998', significance: 'major' }, { e: 'personality', key: 'empathy', delta: 3 }, { e: 'flag', flag: 'l1:cut' }] },
          { id: 'run', text: 'ללכת אחרי אסף.', then: [{ e: 'laces', response: 'avenger' }, { e: 'institution', key: 'protestEscalation', delta: 12 }, { e: 'rel', who: 'asaf', axis: 'familiarity', delta: 4 }, { e: 'army', key: 'commanderTrust', delta: -5 }, { e: 'personality', key: 'riskTolerance', delta: 4 }, { e: 'goto', node: 'l1-pulled' }] },
          { id: 'soko', text: 'ללכת עם סוקו. לאסוף עיתונים.', then: [{ e: 'laces', response: 'organizer' }, { e: 'rel', who: 'soko', axis: 'bond', delta: 6 }, { e: 'redheart', key: 'historyMemory', delta: 5 }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 6 }, { e: 'flag', flag: 'l1:cut' }] },
          { id: 'home', text: 'הביתה. לאבא.', then: [{ e: 'laces', response: 'withdrawn' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 4 }, { e: 'wellbeing', key: 'loneliness', delta: 4 }, { e: 'flag', flag: 'l1:cut' }] },
          { id: 'look', text: 'לעמוד. לראות. לזכור.', then: [{ e: 'laces', response: 'witness' }, { e: 'redheart', key: 'historyMemory', delta: 4 }, { e: 'personality', key: 'curiosity', delta: 2 }, { e: 'flag', flag: 'l1:cut' }] },
        ],
      },
    ],
  },
  {
    id: 'l1-pulled',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'רצת. מישהו משך אותך חזרה בחולצה — שחור, מאיפה בכלל. "לא אתה. לא היום." התפר בצוואר נקרע. לא קרה כלום.' }], then: [{ e: 'rel', who: 'shachor', axis: 'bond', delta: 3 }, { e: 'flag', flag: 'l1:cut' }] }],
  },
  {
    id: 'l1-radio-end',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'לא היית שם. הרדיו קפץ בין שני משחקים ולא ידע לספור. כשזה נגמר, נגמר בשקט.' },
          { who: null, text: 'ידעת שאתה אמור להרגיש משהו גדול. הרגשת בעיקר שאתה לא שם.' },
        ],
        then: [{ e: 'laces', response: 'unresolved' }, { e: 'wellbeing', key: 'regret', delta: 6 }, { e: 'flag', flag: 'l1:radio' }, { e: 'flag', flag: 'l1:cut' }],
      },
    ],
  },
  {
    id: 'l2-tayeb',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'יום ראשון, שעה שנייה. ערבית. ריח גיר, חלון פתוח לרחוב, והראש שלך עדיין ביציע — ובעיר ההיא שאתה לא בטוח איפה היא.' },
          { who: 'המורה', text: 'טַיֵּב. (כותבת על הלוח, מימין לשמאל, לאט.) זה "טוב". תגידו אחריי. טַיֵּב.' },
          { who: null, text: 'המילה נכנסה דרך הפצע. השם ההוא. השרוכים. היא אמרה את זה ישר אליך? היא הסתכלה עליך?' },
        ],
        choices: [
          { id: 'snap', text: 'לקום. "מה זה אמור להיות?!"', when: { lacesIs: 'avenger' }, hidden: true, then: [{ e: 'rel', who: 'teacher', axis: 'tension', delta: 8 }, { e: 'personality', key: 'impulsiveness', delta: 3 }, { e: 'goto', node: 'l2-after' }] },
          { id: 'snap-any', text: 'לקום. "מה זה אמור להיות?!"', when: { none: [{ lacesIs: 'avenger' }] }, hidden: true, then: [{ e: 'rel', who: 'teacher', axis: 'tension', delta: 8 }, { e: 'personality', key: 'impulsiveness', delta: 4 }, { e: 'wellbeing', key: 'regret', delta: 4 }, { e: 'goto', node: 'l2-after' }] },
          { id: 'ask', text: '"מה זה אומר?" (לשאול. באמת.)', then: [{ e: 'rel', who: 'teacher', axis: 'trust', delta: 4 }, { e: 'personality', key: 'curiosity', delta: 3 }, { e: 'flag', flag: 'l2:asked' }, { e: 'goto', node: 'l2-after' }] },
          { id: 'leave', text: 'לקחת את התיק ולצאת.', then: [{ e: 'personality', key: 'independence', delta: 2 }, { e: 'wellbeing', key: 'loneliness', delta: 4 }, { e: 'goto', node: 'l2-after' }] },
          { id: 'silent', text: 'לשתוק. לכתוב את המילה.', then: [{ e: 'personality', key: 'stubbornness', delta: 2 }, { e: 'wellbeing', key: 'stress', delta: 3 }, { e: 'flag', flag: 'l2:silent' }, { e: 'goto', node: 'l2-after' }] },
        ],
      },
    ],
  },
  {
    id: 'l2-after',
    nameHe: null,
    branches: [
      { when: { flag: 'l2:asked' }, lines: [{ who: 'המורה', text: '"טוב." זה אומר "טוב". למה?' }, { who: null, text: 'לא ידעת איך להסביר. אמרת "לא משנה". היא אמרה "משנה", וחיכתה. לא סיפרת. אבל שאלת. זה היה חדש.' }], then: [{ e: 'flag', flag: 'l2:done' }, { e: 'goto', node: 'l2-close' }] },
      { when: { flag: 'l2:silent' }, lines: [{ who: null, text: 'כתבת את המילה. יפה, ישר. היא לא הסתכלה עליך. היא לא ידעה כלום. זה לקח לך שבוע להבין את זה.' }], then: [{ e: 'flag', flag: 'l2:done' }, { e: 'goto', node: 'l2-close' }] },
      { lines: [{ who: null, text: 'הכיתה הסתכלה. היא הסתכלה. "מה קרה?" היא לא ידעה. היא באמת לא ידעה. זה היה הכי גרוע — שהיא לא ידעה.' }], then: [{ e: 'flag', flag: 'l2:done' }, { e: 'goto', node: 'l2-close' }] },
    ],
  },
  {
    id: 'l2-close',
    nameHe: null,
    branches: [
      { when: { lacesIs: 'protector' }, lines: [{ who: null, text: 'משחק אחד שינה איך שאתה שומע מילה. את זה למדת ביום ראשון, בכיתה, בלי אף אחד מהמדרגות.' }], then: [{ e: 'ending', id: 'protector' }] },
      { when: { lacesIs: 'organizer' }, lines: [{ who: null, text: 'משחק אחד שינה איך שאתה שומע מילה. סוקו היה אומר: תרשום גם את זה. רשמת.' }], then: [{ e: 'ending', id: 'organizer' }] },
      { when: { lacesIs: 'avenger' }, lines: [{ who: null, text: 'משחק אחד שינה איך שאתה שומע מילה. את זה למדת ביום ראשון, אחרי שכבר קמת פעם אחת.' }], then: [{ e: 'ending', id: 'avenger' }] },
      { when: { lacesIs: 'withdrawn' }, lines: [{ who: null, text: 'משחק אחד שינה איך שאתה שומע מילה. את זה למדת ביום ראשון, אחרי לילה שלם של שקט בסלון.' }], then: [{ e: 'ending', id: 'withdrawn' }] },
      { when: { flag: 'l1:radio' }, lines: [{ who: null, text: 'משחק אחד שינה איך שאתה שומע מילה. גם ממי שלא היה שם. במיוחד ממי שלא היה שם.' }], then: [{ e: 'ending', id: 'radio' }] },
      { lines: [{ who: null, text: 'משחק אחד שינה איך שאתה שומע מילה. את זה למדת ביום ראשון, בשעה שנייה.' }], then: [{ e: 'ending', id: 'witness' }] },
    ],
  },
]
