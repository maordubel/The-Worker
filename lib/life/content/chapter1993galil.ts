import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * B4 · "הבית נשבר" · 9–19.5.1993 — the championship that was supposed to follow the cup.
 *
 * One escalating arc over four evenings, not four matches: the first game in their own
 * hall, which they lose and cannot believe; the second, away, heard through a radio in
 * a kitchen; the third, home, won big — and a boy who promises too much about the
 * fourth; the fourth, far north, where getting there IS the game. The aftermath is in
 * the corner outside Ussishkin, where Shachor stacks chairs and Efi does not speak.
 *
 * Days inside a chapter are `day.entered` events dispatched by beats. A day clears the
 * afternoon's flags, so every day marker is a `life:` flag and every beat says which day
 * it belongs to. **No line here states a score, a margin or an opponent's name.**
 */

export const D1 = 'life:galil:d1'
export const D2 = 'life:galil:d2'
export const D3 = 'life:galil:d3'
export const D4 = 'life:galil:d4'
export const D5 = 'life:galil:after'

export const PORTRAIT_GALIL: Record<string, string> = {
  'פוגי': 'faceHero80',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel90',
  'אפי': 'faceEfi',
  'לימור': 'faceLimor',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'שחור': 'faceShachor',
  'סוקו': 'faceSoko',
  'אוהד': 'faceSupporter',
  'אוהד ותיק': 'faceOldMan',
}

export function objectiveGalil(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags[D5]) return state.flags['after:done'] ? null : 'הפינה של אוסישקין. אחרי.'
  if (state.flags[D4]) {
    if (state.flags['g4:decided']) return null
    return 'המשחק הרביעי. בצפון. איך מגיעים?'
  }
  if (state.flags[D3]) return sceneId === 'ussishkin-hall' ? null : 'המשחק השלישי. הביתה, לאולם.'
  if (state.flags[D2]) return 'משחק חוץ. הרדיו במטבח.'
  return sceneId === 'ussishkin-hall' ? null : 'המשחק הראשון. בבית.'
}

export const ENDINGS_GALIL: Record<string, EndingCard> = {
  inside: {
    id: 'inside',
    titleHe: 'הגביע היה אמיתי',
    bodyHe:
      'הייתם שם, בצפון, בסוף. ראית את זה נגמר מקרוב, ראית את הפנים של אנשים שלא הכרת ושיכולת לצייר בעל פה. בדרך חזרה האוטובוס היה שקט כמו כיתה בבחינה. לימור לא רשמה כלום. אפי ישן, או העמיד פנים.',
    memoryHe: 'פתק הנסיעה, מקופל ארבע. עליו, בכתב של לימור, שעת היציאה. שום דבר על שעת החזרה.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  late: {
    id: 'late',
    titleHe: 'הגעת. מאוחר.',
    bodyHe:
      'האוטובוס איחר, או הטרמפ, או אתה. הגעת לאולם בצפון כשהמשחק כבר ידע איך הוא נגמר. עמדת בכניסה ושמעת מבפנים את הדבר שלא רצית, ואז נכנסת בכל זאת, כי ללכת עד לשם ולא להיכנס — זה לא.',
    memoryHe: 'קרע מכרטיס אוטובוס עם חותמת של עיר שלא היית בה קודם.',
    memoryItem: 'ticket-stub',
    presence: 'late',
  },
  radio: {
    id: 'radio',
    titleHe: 'מהמטבח',
    bodyHe:
      'שמעת את זה ברדיו, במטבח, עם אמא שעשתה שהיא לא מקשיבה ואבא שעשה שהוא קורא. כשזה נגמר הרדיו המשיך לדבר על משהו אחר, ואתה ישבת מול הטרנזיסטור עד שהוא נגמר לבד. "היה משחק טוב," אמא אמרה. היא לא שמעה משחק.',
    memoryHe: 'הטרנזיסטור. אתה יודע איזה תחנה, בלי להסתכל.',
    memoryItem: 'transistor',
    presence: 'radio',
  },
  heard: {
    id: 'heard',
    titleHe: 'מפי אפי',
    bodyHe:
      'לא הלכת ולא שמעת. אפי סיפר לך למחרת, בחצר, בשלושה משפטים. בשלישי הקול שלו נשבר והוא הפסיק. לא שאלת עוד. את השאר ידעת מהפנים של כולם.',
    memoryHe: 'כלום. אבל שלושה משפטים של אפי, ואחד שהוא לא סיים.',
    memoryItem: 'folded-paper',
    presence: 'heard-from-friend',
  },
}

const DAY = (flag: string, year: number, weekday: number, minute: number, dateHe?: string) =>
  [{ t: 'day.entered', dayId: flag, year, weekday, minute, ...(dateHe ? { dateHe } : {}) } as const, { t: 'flag.raised', flag } as const]

export const BEATS_GALIL: Beat[] = [
  // ------------------------------------------------------------------ day 1 · game 1 ---
  {
    id: 'g1-open',
    at: 'ussishkin-outside',
    trigger: 'enter',
    when: { none: [{ flag: D2 }, { flag: D3 }, { flag: D4 }, { flag: D5 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: D1 },
      {
        a: 'lines',
        lines: [
          { who: null, text: 'שלושה שבועות אחרי הגביע. אותה פינה, אותם אנשים, ואוויר אחר לגמרי: עכשיו זה לא חג, זה סדרה.' },
          { who: 'אפי', text: 'ארבעה משחקים. מי שמנצח שלושה. אנחנו בבית ראשונים. מה כבר יכול לקרות.' },
          { who: 'לימור', text: 'אל תגיד "מה כבר יכול לקרות". זה משפט שהמשחקים שומעים.' },
        ],
      },
    ],
  },
  {
    id: 'g1-hall',
    at: 'ussishkin-hall',
    trigger: 'enter',
    when: { flag: D1, none: [{ flag: D2 }] },
    delayMs: 900,
    do: [
      { a: 'card', titleHe: 'משחק 1', subHe: 'אוסישקין', ms: 2200 },
      { a: 'match', script: 'galil-93-g1' },
      { a: 'lines', lines: [{ who: null, text: 'הצפירה. האולם לא מבין. אנשים עומדים ולא יוצאים, כאילו אם לא יוצאים זה לא נגמר.' }, { who: 'אפי', text: 'זה רק אחד. זה רק אחד מארבעה.' }, { who: null, text: 'הוא אמר את זה לעצמו. לא לך.' }] },
      { a: 'events', events: DAY(D2, 1993, 3, at(19, 30), '12 במאי 1993') },
      { a: 'card', titleHe: 'יום רביעי', subHe: 'משחק 2 · בחוץ', ms: 2400 },
      { a: 'travel', to: 'kitchen', spawn: 'start' },
    ],
  },
  // ------------------------------------------------------------------ day 2 · game 2 ---
  {
    id: 'g2-kitchen',
    at: 'kitchen',
    trigger: 'enter',
    when: { flag: D2, none: [{ flag: D3 }] },
    delayMs: 700,
    do: [
      { a: 'sound', kind: 'radio', on: true },
      { a: 'talk', conversation: 'g2-radio' },
      { a: 'sound', kind: 'radio', on: false },
      { a: 'events', events: DAY(D3, 1993, 0, at(18, 0), '16 במאי 1993') },
      { a: 'card', titleHe: 'יום ראשון', subHe: 'משחק 3 · אוסישקין', ms: 2400 },
      { a: 'travel', to: 'ussishkin-outside', spawn: 'start' },
    ],
  },
  // ------------------------------------------------------------------ day 3 · game 3 ---
  {
    id: 'g3-hall',
    at: 'ussishkin-hall',
    trigger: 'enter',
    when: { flag: D3, none: [{ flag: D4 }] },
    delayMs: 900,
    do: [
      { a: 'card', titleHe: 'משחק 3', subHe: 'אוסישקין', ms: 2200 },
      { a: 'match', script: 'galil-93-g3' },
      { a: 'events', events: DAY(D4, 1993, 3, at(14, 0), '19 במאי 1993') },
      { a: 'card', titleHe: 'יום רביעי', subHe: 'משחק 4 · בצפון', ms: 2600 },
      { a: 'travel', to: 'street', spawn: 'start' },
    ],
  },
  // ------------------------------------------------------------------ day 4 · game 4 ---
  {
    id: 'g4-open',
    at: 'street',
    trigger: 'enter',
    when: { flag: D4, none: [{ flag: D5 }, { flag: 'g4:decided' }] },
    delayMs: 700,
    do: [
      { a: 'events', events: [{ t: 'money.changed', agorot: 4500, why: 'מה שיש בכיס באמצע שבוע' }] },
      { a: 'lines', lines: [{ who: null, text: 'המשחק המכריע. שלוש שעות נסיעה צפונה, ואף אחד לא מסדר לך אותן.' }, { who: null, text: 'יש אוטובוס מאורגן מהפינה בארבע, אם נרשמת. יש בן דוד של אופיר עם אוטו, אם יש כסף לדלק. ויש מטבח עם רדיו.' }] },
    ],
  },
  // four o'clock: the bus leaves; five: the car; eight: the radio
  {
    id: 'g4-bus-gone',
    trigger: 'clock',
    when: { flag: D4, afterMinute: at(16, 10), none: [{ flag: 'g4:decided' }] },
    do: [{ a: 'toast', text: 'ארבע ועשרה. האוטובוס המאורגן יצא. מי שלא היה עליו, לא עליו.', tone: 'red' }, { a: 'flag', flag: 'g4:bus-gone' }],
  },
  {
    id: 'g4-radio-time',
    trigger: 'clock',
    when: { flag: D4, afterMinute: at(20, 0), none: [{ flag: 'g4:decided' }] },
    do: [{ a: 'flag', flag: 'g4:decided' }, { a: 'flag', flag: 'g4:heard' }, { a: 'lines', lines: [{ who: null, text: 'שמונה. לא נסעת ולא הדלקת רדיו. איפשהו רחוק זה קורה, ואתה תשמע מחר.' }] }, { a: 'events', events: DAY(D5, 1993, 4, at(18, 30), '20 במאי 1993') }, { a: 'card', titleHe: 'למחרת', subHe: 'הפינה', ms: 2400 }, { a: 'travel', to: 'ussishkin-outside', spawn: 'start' }],
  },
  // the night ends however it ended; the next evening is the corner
  {
    id: 'g4-to-after',
    trigger: 'clock',
    when: { flag: 'g4:cut', none: [{ flag: D5 }] },
    do: [{ a: 'events', events: DAY(D5, 1993, 4, at(18, 30), '20 במאי 1993') }, { a: 'card', titleHe: 'למחרת', subHe: 'הפינה', ms: 2400 }, { a: 'travel', to: 'ussishkin-outside', spawn: 'start' }],
  },
  // ------------------------------------------------------------------ the aftermath ---
  {
    id: 'after-open',
    at: 'ussishkin-outside',
    trigger: 'enter',
    when: { flag: D5, none: [{ flag: 'after:done' }] },
    delayMs: 800,
    do: [
      { a: 'talk', conversation: 'after-galil' },
    ],
  },
]

export const CONVERSATIONS_GALIL: Conversation[] = [
  {
    id: 'efi-galil',
    nameHe: 'אפי',
    branches: [
      { when: { flag: D5 }, lines: [{ who: 'אפי', text: '…' }, { who: null, text: 'הוא לא מדבר. עוד לא.' }] },
      { when: { flag: D4 }, lines: [{ who: 'אפי', text: 'אני על האוטובוס. תהיה עליו.' }] },
      { when: { flag: D3 }, lines: [{ who: 'אפי', text: 'הערב. הבית. אין ברירה, וזה טוב שאין.' }] },
      { lines: [{ who: 'אפי', text: 'ארבעה משחקים. אנחנו בבית ראשונים. מה כבר יכול לקרות.' }] },
    ],
  },
  {
    id: 'shachor-galil',
    nameHe: 'שחור',
    branches: [
      { when: { relationshipMemory: { who: 'shachor', eventId: 'stacked-chairs-1993' } }, lines: [{ who: 'שחור', text: 'יש עוד כיסאות. תמיד יש עוד כיסאות.' }] },
      { lines: [{ who: 'שחור', text: 'לא מדברים. סוחבים.' }] },
    ],
  },
  // --------------------------------------------------------------------- game 1 ---
  {
    id: 'g1-inside',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'האולם מלא עד הקירות. הביטחון של אחרי גביע: אנשים מדברים על המשחק הבא לפני שהזה התחיל.' },
          { who: 'לימור', text: 'איפה עומדים? למעלה רואים הכל. למטה מרגישים הכל.' },
        ],
        choices: [
          { id: 'high', text: 'למעלה. לראות.', then: [{ e: 'flag', flag: 'g1:high' }, { e: 'personality', key: 'curiosity', delta: 1 }, { e: 'goto', node: 'g1-turn' }] },
          { id: 'low', text: 'למטה. להרגיש.', then: [{ e: 'flag', flag: 'g1:low' }, { e: 'redheart', key: 'terraceCulture', delta: 2 }, { e: 'goto', node: 'g1-turn' }] },
          { id: 'efi', text: 'איפה שאפי.', then: [{ e: 'rel', who: 'efi', axis: 'bond', delta: 2 }, { e: 'goto', node: 'g1-turn' }] },
        ],
      },
    ],
  },
  {
    id: 'g1-turn',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'זה מתחיל טוב. ואז זה מפסיק להיות טוב, לאט, בלי רגע אחד שאפשר להצביע עליו.' },
          { who: null, text: 'האולם מנסה. שר יותר חזק, ואז עוד יותר חזק, ואז מגלה שיש רמת רעש שממנה זה כבר לא עוזר.' },
          { who: 'אפי', text: 'זה יתהפך. זה תמיד מתהפך אצלנו.' },
          { who: null, text: 'זה לא התהפך.' },
        ],
        then: [{ e: 'wellbeing', key: 'stress', delta: 6 }],
      },
    ],
  },
  // --------------------------------------------------------------------- game 2 ---
  {
    id: 'g2-radio',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'המטבח. הטרנזיסטור על השולחן, האנטנה מכוונת לצפון כאילו זה עוזר. אמא מקלפת משהו שלא צריך קילוף.' },
          { who: 'קובי', text: 'שמעתי שהפסדתם בבית.' },
          { who: 'פוגי', text: 'הפסדנו.' },
          { who: 'קובי', text: '"הפסדנו." טוב. אז זה כבר "אנחנו".' },
          { who: null, text: 'השדר צועק לפני שקורה משהו ומשתתק כשקורה. אתה לומד לשמוע את המשחק דרך השתיקות שלו.' },
        ],
        choices: [
          { id: 'stay', text: 'להישאר ליד הרדיו עד הסוף.', then: [{ e: 'flag', flag: 'g2:radio' }, { e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 3 }, { e: 'goto', node: 'g2-end' }] },
          { id: 'call', text: 'לרוץ לטלפון. אפי.', then: [{ e: 'flag', flag: 'g2:phone' }, { e: 'rel', who: 'efi', axis: 'bond', delta: 3 }, { e: 'goto', node: 'g2-end' }] },
          { id: 'off', text: 'לכבות. לא יכול.', then: [{ e: 'flag', flag: 'g2:off' }, { e: 'personality', key: 'impulsiveness', delta: 2 }, { e: 'wellbeing', key: 'stress', delta: 4 }, { e: 'goto', node: 'g2-end' }] },
        ],
      },
    ],
  },
  {
    id: 'g2-end',
    nameHe: null,
    branches: [
      {
        when: { flag: 'g2:off' },
        lines: [{ who: null, text: 'אמא הדליקה בחזרה אחרי עשר דקות. "אני רוצה לדעת," היא אמרה. לא ידעת שהיא רוצה.' }, { who: null, text: 'השתיקה של השדר בסוף אמרה הכל. שניים מאחור.' }],
        then: [{ e: 'wellbeing', key: 'stress', delta: 4 }],
      },
      {
        lines: [{ who: null, text: 'השתיקה של השדר בסוף אמרה הכל. שניים מאחור, ומשחק אחד בבית להציל את זה.' }, { who: 'קובי', text: 'ביום ראשון אתה הולך?' }, { who: 'פוגי', text: 'ביום ראשון אני הולך.' }, { who: 'קובי', text: 'יופי.' }],
        then: [{ e: 'wellbeing', key: 'stress', delta: 3 }],
      },
    ],
  },
  // --------------------------------------------------------------------- game 3 ---
  {
    id: 'g3-inside',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'אולם של גב אל הקיר. אנשים לא שרים — הם צורחים, ובין צרחה לצרחה שומעים נשימות.' },
          { who: null, text: 'ואז זה בא. לא לאט כמו במשחק הראשון — בבת אחת. הם לא יכולים לפספס והאחרים לא יכולים לקלוע, והאולם מגלה שיש עוד רמת רעש.' },
          { who: null, text: 'הצפירה. שחור מרים את לימור באוויר. אפי בוכה וצוחק וטוען שלא.' },
          { who: 'אפי', text: 'יום רביעי! יום רביעי בצפון! אנחנו באים! כולנו!' },
          { who: 'לימור', text: 'אפי. שלוש שעות נסיעה. תשעים שקל. אמצע שבוע.' },
        ],
        choices: [
          { id: 'promise', text: '"אני בא. מה שלא יהיה."', then: [{ e: 'flag', flag: 'life:promise:g4' }, { e: 'personality', key: 'impulsiveness', delta: 3 }, { e: 'rel', who: 'efi', axis: 'bond', delta: 4 }, { e: 'toast', text: 'לימור רשמה משהו בפנקס. אולי את זה.', tone: 'plain' }] },
          { id: 'signup', text: '"תרשמי אותי לאוטובוס." (לימור)', then: [{ e: 'flag', flag: 'life:signed:bus' }, { e: 'personality', key: 'responsibility', delta: 2 }, { e: 'rel', who: 'crowd-limor', axis: 'trust', delta: 3 }, { e: 'toast', text: 'שם, שעה, "ארבע בפינה". רשום.', tone: 'plain' }] },
          { id: 'quiet', text: 'לשתוק. לחגוג את הערב הזה.', then: [{ e: 'personality', key: 'reliability', delta: 1 }, { e: 'wellbeing', key: 'happiness', delta: 6 }] },
        ],
      },
    ],
  },
  // --------------------------------------------------------------------- game 4 ---
  {
    id: 'g4-limor',
    nameHe: 'לימור',
    branches: [
      {
        when: { flag: 'g4:bus-gone' },
        lines: [{ who: 'לימור', text: 'יצא. בארבע ועשרה, כמו שאמרתי. יש רכבת? אין רכבת. יש טרמפ. יש רדיו.' }],
      },
      {
        when: { flag: 'life:signed:bus' },
        lines: [{ who: 'לימור', text: 'אתה רשום. תשעים שקל בעלייה. יש לך?' }],
        choices: [
          { id: 'pay', text: 'לשלם. לעלות.', when: { minAgorot: 9000 }, noteHe: 'אין תשעים שקל.', then: [{ e: 'money', agorot: -9000, why: 'אוטובוס לצפון' }, { e: 'flag', flag: 'g4:decided' }, { e: 'flag', flag: 'g4:bus' }, { e: 'time', minutes: 200 }, { e: 'goto', node: 'g4-north' }] },
          { id: 'broke', text: 'אין לי.', then: [{ e: 'goto', node: 'g4-broke' }] },
        ],
      },
      {
        lines: [{ who: 'לימור', text: 'לא נרשמת. יש מקום אחד אם מישהו לא יגיע. תשעים שקל. תחכה פה עד ארבע.' }],
        choices: [
          { id: 'wait', text: 'לחכות ולקוות.', when: { minAgorot: 9000 }, noteHe: 'אין תשעים שקל.', then: [{ e: 'money', agorot: -9000, why: 'אוטובוס לצפון' }, { e: 'flag', flag: 'g4:decided' }, { e: 'flag', flag: 'g4:bus' }, { e: 'flag', flag: 'arrived:late' }, { e: 'time', minutes: 230 }, { e: 'goto', node: 'g4-north' }] },
          { id: 'no', text: 'לא.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'g4-broke',
    nameHe: null,
    branches: [
      {
        when: { relationship: { who: 'shachor', axis: 'bond', min: 5 } },
        lines: [{ who: null, text: 'שחור, מאחור, בלי להסתכל: "הילד של הבד נוסע. אני משלים." לימור לא התווכחה.' }],
        then: [{ e: 'flag', flag: 'g4:decided' }, { e: 'flag', flag: 'g4:bus' }, { e: 'flag', flag: 'owe:shachor' }, { e: 'redheart', key: 'community', delta: 4 }, { e: 'time', minutes: 200 }, { e: 'goto', node: 'g4-north' }],
      },
      {
        lines: [{ who: null, text: 'לימור הנהנה. "אז רדיו. אין בושה ברדיו." יש קצת.' }],
      },
    ],
  },
  {
    id: 'g4-ofir',
    nameHe: 'אופיר',
    branches: [
      {
        when: { flag: 'g4:decided' },
        lines: [{ who: 'אופיר', text: 'החלטת? יופי. אני לא אוהב אנשים שלא מחליטים.' }],
      },
      {
        lines: [
          { who: 'אופיר', text: 'לבן דוד שלי יש אוטו. הוא לא אוהד, הוא אוהב לנסוע. שלושים שקל דלק ואתה נוסע, ואנחנו יוצאים בחמש.' },
          { who: 'אופיר', text: 'ואם הוא מאחר, הוא מאחר. זה בן דוד, לא אוטובוס.' },
        ],
        choices: [
          { id: 'car', text: 'שלושים שקל. נוסעים.', when: { minAgorot: 3000 }, noteHe: 'אין שלושים.', then: [{ e: 'money', agorot: -3000, why: 'דלק לבן דוד' }, { e: 'flag', flag: 'g4:decided' }, { e: 'flag', flag: 'g4:car' }, { e: 'rel', who: 'ofir', axis: 'sharedHistory', delta: 4 }, { e: 'time', minutes: 240 }, { e: 'goto', node: 'g4-car' }] },
          { id: 'no', text: 'לא הפעם.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'g4-car',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'בן הדוד איחר. עשרים דקות, ואז עוד עשר. אחר כך נסע כאילו הוא מנסה להחזיר אותן.' },
          { who: null, text: 'הצפון בחלון: ירוק, ואז יותר ירוק, ואז חושך. עמית מאחור עם הטרנזיסטור מדווח על משחק שעוד לא התחיל.' },
          { who: null, text: 'הגעתם כשהאולם כבר בפנים. הסדרן הסתכל על שלושה ילדים מתל אביב ופתח.' },
        ],
        then: [{ e: 'flag', flag: 'arrived:late' }, { e: 'redheart', key: 'travelDrive', delta: 4 }, { e: 'goto', node: 'g4-north' }],
      },
    ],
  },
  {
    id: 'g4-radio',
    nameHe: null,
    branches: [
      {
        when: { flag: 'g4:decided' },
        lines: [{ who: null, text: 'הטרנזיסטור. כבר החלטת מה אתה עושה הערב.' }],
      },
      {
        lines: [{ who: null, text: 'הטרנזיסטור על השולחן. שמונה בערב, תחנה שלושים ושתיים, ואמא שתעשה שהיא לא מקשיבה.' }],
        choices: [
          { id: 'radio', text: 'להישאר. לשמוע.', then: [{ e: 'flag', flag: 'g4:decided' }, { e: 'flag', flag: 'g4:radio' }, { e: 'time', minutes: 60 }, { e: 'goto', node: 'g4-radio-night' }] },
          { id: 'not-yet', text: 'עוד לא.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'g4-radio-night',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'השדר הרחוק, בקול של אדם בתוך ארון. אמא בפתח. אבא עם עיתון שהוא לא קורא.' },
          { who: null, text: 'זה קרוב. זה קרוב כל הזמן, וזה הדבר הכי גרוע שרדיו יודע לעשות.' },
          { who: null, text: 'ואז השתיקה. הארוכה. השדר נשם פעם אחת, ואמר את זה.' },
        ],
        then: [{ e: 'wellbeing', key: 'stress', delta: 6 }, { e: 'wellbeing', key: 'regret', delta: 4 }, { e: 'goto', node: 'g4-done' }],
      },
    ],
  },
  {
    id: 'g4-north',
    nameHe: null,
    branches: [
      {
        when: { flag: 'arrived:late' },
        lines: [
          { who: null, text: 'פספסת את ההתחלה. מבפנים, דרך הדלת, שמעת אולם שלם של אנשים שלא אתה.' },
          { who: null, text: 'נכנסת בכל זאת. עמדת מאחור. ראית איך זה נגמר, ואיך אנשים בצבע שלך אוספים דגלים בשקט.' },
        ],
        then: [{ e: 'wellbeing', key: 'stress', delta: 5 }, { e: 'flag', flag: 'life:galil:there' }, { e: 'goto', node: 'g4-done' }],
      },
      {
        lines: [
          { who: null, text: 'אולם זר. תקרה נמוכה, ריח אחר, וקהל שיודע לצעוק את השם של העיר שלו כמו שאתם צועקים את שלכם.' },
          { who: 'אפי', text: 'זה כמו בבית. רק הפוך.' },
          { who: null, text: 'זה היה קרוב. קרוב מדי. יש רגע, לקראת הסוף, שבו כולם עומדים ואף אחד לא נושם, ואתה יודע שאת הרגע הזה תזכור יותר מהתוצאה.' },
          { who: null, text: 'הצפירה. לא שלכם.' },
        ],
        then: [{ e: 'wellbeing', key: 'stress', delta: 5 }, { e: 'redheart', key: 'travelDrive', delta: 3 }, { e: 'flag', flag: 'life:galil:there' }, { e: 'goto', node: 'g4-done' }],
      },
    ],
  },
  {
    id: 'g4-done',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'הגביע היה אמיתי. וגם זה. אחד לא מוחק את השני, אבל הערב הם יושבים לך על החזה ביחד.' }],
        then: [{ e: 'goto', node: 'g4-cut' }],
      },
    ],
  },
  {
    id: 'g4-cut',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'למחרת בערב, הפינה של אוסישקין.' }], then: [{ e: 'flag', flag: 'g4:cut' }] }],
  },
  // ------------------------------------------------------------------ aftermath ---
  {
    id: 'after-galil',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הפינה. שחור סוחב כיסאות מהאולם לרחוב ובחזרה, בלי סיבה, כי הידיים צריכות משהו.' },
          { who: null, text: 'לימור עם הפנקס, משחזרת: מי נסע, מי איחר, כמה עלה. כאילו אם הלוגיסטיקה תסתדר, גם התוצאה.' },
          { who: null, text: 'אפי עומד בצד. לא מדבר.' },
        ],
        choices: [
          { id: 'shachor', text: 'לעזור לשחור עם הכיסאות.', then: [{ e: 'rel', who: 'shachor', axis: 'bond', delta: 5 }, { e: 'remember', who: 'shachor', eventId: 'stacked-chairs-1993', significance: 'notable' }, { e: 'institution', key: 'ussishkinWound', delta: 3 }, { e: 'goto', node: 'after-efi' }] },
          { id: 'limor', text: 'לשבת עם לימור והפנקס.', then: [{ e: 'rel', who: 'crowd-limor', axis: 'bond', delta: 4 }, { e: 'personality', key: 'curiosity', delta: 1 }, { e: 'goto', node: 'after-efi' }] },
          { id: 'efi', text: 'ללכת לאפי.', then: [{ e: 'goto', node: 'after-efi' }] },
        ],
      },
    ],
  },
  {
    id: 'after-efi',
    nameHe: null,
    branches: [
      {
        when: { flag: 'life:promise:g4', none: [{ flag: 'life:galil:there' }] },
        lines: [{ who: 'אפי', text: '"מה שלא יהיה," אמרת. ולא היית.' }, { who: null, text: 'הוא לא צעק. זה היה יותר גרוע.' }],
        choices: [
          { id: 'sorry', text: 'לא הצלחתי. סליחה.', then: [{ e: 'rel', who: 'efi', axis: 'trust', delta: -4 }, { e: 'rel', who: 'efi', axis: 'bond', delta: 1 }, { e: 'remember', who: 'efi', eventId: 'broke-promise-1993', significance: 'major' }, { e: 'goto', node: 'after-soko' }] },
          { id: 'excuse', text: 'לא היה כסף. לא היה איך.', then: [{ e: 'rel', who: 'efi', axis: 'trust', delta: -6 }, { e: 'rel', who: 'efi', axis: 'distance', delta: 5 }, { e: 'remember', who: 'efi', eventId: 'broke-promise-1993', significance: 'major' }, { e: 'goto', node: 'after-soko' }] },
        ],
      },
      {
        when: { flag: 'life:galil:there' },
        lines: [{ who: 'אפי', text: 'היית שם.' }, { who: 'פוגי', text: 'הייתי שם.' }, { who: 'אפי', text: 'טוב.' }, { who: null, text: 'זה כל מה שהוא היה מסוגל. זה היה הרבה.' }],
        then: [{ e: 'rel', who: 'efi', axis: 'sharedHistory', delta: 6 }, { e: 'goto', node: 'after-soko' }],
      },
      {
        lines: [{ who: 'אפי', text: 'שמעת ברדיו?' }, { who: 'פוגי', text: 'שמעתי.' }, { who: 'אפי', text: 'אז אתה יודע.' }, { who: null, text: 'הוא לא הסתכל עליך כשאמר את זה.' }],
        then: [{ e: 'rel', who: 'efi', axis: 'distance', delta: 2 }, { e: 'goto', node: 'after-soko' }],
      },
    ],
  },
  {
    id: 'after-soko',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'בפינה, על מדרגה, בחור עם משקפיים ומחברת. כותב. בזמן שכולם צועקים, הוא כותב.' },
          { who: 'סוקו', text: 'אתה זוכר מי זרק אחרון במשחק הראשון? לא? אף אחד לא זוכר. עוד שנה כולם יגידו שזה היה מישהו אחר.' },
          { who: 'סוקו', text: 'אז אני כותב. שיהיה מישהו שיודע מה באמת היה.' },
        ],
        choices: [
          { id: 'ask', text: 'מה כתבת עליי?', then: [{ e: 'rel', who: 'soko', axis: 'familiarity', delta: 5 }, { e: 'redheart', key: 'historyMemory', delta: 3 }, { e: 'toast', text: '"שהיית." הוא הראה לך את השורה. שורה אחת. מספיק.', tone: 'plain' }, { e: 'goto', node: 'after-close' }] },
          { id: 'why', text: 'למה זה משנה מה באמת היה?', then: [{ e: 'rel', who: 'soko', axis: 'bond', delta: 2 }, { e: 'personality', key: 'curiosity', delta: 2 }, { e: 'toast', text: '"כי ההפסד אמיתי. הגביע אמיתי. אם תשכח אחד, תשכח את שניהם."', tone: 'plain' }, { e: 'goto', node: 'after-close' }] },
        ],
      },
    ],
  },
  {
    id: 'after-close',
    nameHe: null,
    branches: [
      { when: { flag: 'g4:bus', none: [{ flag: 'arrived:late' }] }, lines: [{ who: null, text: 'הלכת הביתה דרך הרחוב הרגיל. הוא נראה אותו דבר. זה מה שהיה מוזר.' }], then: [{ e: 'flag', flag: 'after:done' }, { e: 'ending', id: 'inside' }] },
      { when: { flag: 'arrived:late' }, lines: [{ who: null, text: 'הלכת הביתה. הכרטיס הקרוע בכיס, עם חותמת של עיר.' }], then: [{ e: 'flag', flag: 'after:done' }, { e: 'ending', id: 'late' }] },
      { when: { flag: 'g4:radio' }, lines: [{ who: null, text: 'הלכת הביתה. הטרנזיסטור עוד על השולחן במטבח, כבוי.' }], then: [{ e: 'flag', flag: 'after:done' }, { e: 'ending', id: 'radio' }] },
      { lines: [{ who: null, text: 'הלכת הביתה. שלושה משפטים של אפי בראש, ואחד שהוא לא סיים.' }], then: [{ e: 'flag', flag: 'after:done' }, { e: 'ending', id: 'heard' }] },
    ],
  },
]
