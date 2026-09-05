import { at } from '../clock'
import type { LifeState } from '../types'
import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * שלב א׳ — ששת הימים שלפני השבת (A2–A7).
 *
 * The Stage A brief turned one Saturday into eight days: the first memory on a father's
 * shoulders (A1 — the prologue that already plays), the neighbourhood becoming a game,
 * a second red house, a shirt saved for, a match got ready for alone, a winter heard on
 * the radio, and the week of a refusal — and then 24.5.1986, the day this game shipped
 * with. These six are written the way the decade after them is: as beats and rows, in
 * the rooms that exist, with the boy the sheets already drew. The five-year-old, the
 * six-year-old and the seven-year-old are on the art list; until they arrive the
 * eight-year-old stands in, and the card names the year so nobody is lied to.
 *
 * Every day is short — ten minutes of a childhood — and every day teaches one thing
 * the Saturday will need: an errand and a clock, a hall and a name, a tin and a price,
 * a shirt and a key, a radio and a normal disappointment, a promise and a "no".
 *
 * Nothing here states a result, a scorer or an opponent.
 */

export const A2 = 'life:a:d2'
export const A3 = 'life:a:d3'
export const A4 = 'life:a:d4'
export const A5 = 'life:a:d5'
export const A6 = 'life:a:d6'
export const A7 = 'life:a:d7'

export const PORTRAIT_STAGE_A: Record<string, string> = {
  'פוגי': 'facePogi',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'אפי': 'faceEfi',
  'קרן': 'faceKeren',
  'רפי מהקיוסק': 'faceOldMan',
  'אילן השכן': 'faceOldMan',
  'סדרן': 'faceUsher',
  'לירון': 'faceLiron',
  'עליזה': 'faceAliza',
  'בארי': 'faceBarry',
}

// ------------------------------------------------------------------- A2 · the alley ---

export function objectiveA2(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a2:played'] || state.flags['a2:late']) return null
  if (state.flags['a2:errand'] && !state.flags['a2:bread']) return 'לחם מהקיוסק. ואז — הסמטה, לפני שהקבוצות מלאות.'
  if (sceneId === 'home') return 'אחר הצהריים. בסמטה משחקים. אמא רוצה משהו.'
  return 'הסמטה. לפני שהקבוצות מלאות.'
}

export const ENDINGS_A2: Record<string, EndingCard> = {
  played: {
    id: 'played',
    titleHe: 'שיחקת',
    bodyHe: 'הגעת בזמן, נכנסת לקבוצה של אופיר, ובעטת פעם אחת בדיוק כמו שצריך. הלחם הגיע הביתה בשמונה, מעוך. אמא לא אמרה כלום. היא שמרה את זה.',
    memoryHe: 'הפעם הראשונה שהיית בקבוצה.',
    memoryItem: 'football-card',
  },
  late: {
    id: 'late',
    titleHe: 'הקבוצות היו מלאות',
    bodyHe: 'הלחם קודם, כמו שאמא ביקשה. הגעת לסמטה כשכבר היו שניים בכל צד ואחד בשער. עמדת ליד הקיר וספרת. עמית אמר שזה גם משהו. זה לא היה.',
    memoryHe: 'לעמוד ליד הקיר ולספור.',
    memoryItem: 'coin',
  },
  home: {
    id: 'home',
    titleHe: 'נשארת בבית',
    bodyHe: 'בסוף לא יצאת. שמעת אותם מהחלון, את הכדור על הפח ואת אופיר צועק. אמא נתנה לך את העודף מהלחם. שמרת אותו בכיס עד שהלך לאיבוד.',
    memoryHe: 'הכדור על הפח, מהחלון.',
    memoryItem: 'coin',
  },
}

export const BEATS_A2: Beat[] = [
  {
    id: 'a2-open',
    at: 'home',
    trigger: 'enter',
    when: { none: [{ flag: A2 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A2 },
      { a: 'events', events: [{ t: 'money.changed', agorot: 300, why: 'לחם' }] },
      {
        a: 'lines',
        lines: [
          { who: null, text: 'אביב. שש. הסלון בצהריים, והחלון פתוח, ומהסמטה שומעים כדור על פח.' },
          { who: 'רחל', text: 'פוגי. לפני שאתה נעלם — לחם מרפי. תגיד לו על החשבון, אני עוברת מחר.' },
        ],
      },
    ],
  },
  {
    id: 'a2-teams-full',
    trigger: 'clock',
    when: { flag: A2, afterMinute: at(16, 25), none: [{ flag: 'a2:played' }, { flag: 'a2:late' }, { flag: 'a2:full' }] },
    do: [{ a: 'flag', flag: 'a2:full' }, { a: 'toast', text: 'מהסמטה: "שניים־שניים! מי בשער?" הקבוצות מלאות.', tone: 'red' }],
  },
  {
    // back on the pitch after the two-on-two: the evening closes on its own
    id: 'a2-after',
    at: 'pitch',
    trigger: 'enter',
    when: { all: [{ flag: 'a2:played' }, { flag: 'played:football' }], none: [{ flag: 'a2:done' }] },
    delayMs: 900,
    do: [{ a: 'flag', flag: 'a2:done' }, { a: 'talk', conversation: 'a2-after-game' }],
  },
  {
    id: 'a2-night',
    trigger: 'clock',
    when: { flag: A2, afterMinute: at(19, 30), none: [{ flag: 'a2:played' }, { flag: 'a2:late' }] },
    do: [{ a: 'lines', lines: [{ who: null, text: 'חושך. הכדור נגמר. מהחלון עוד רואים את הפח.' }] }, { a: 'ending', id: 'home' }],
  },
]

export const CONVERSATIONS_A2: Conversation[] = [
  {
    id: 'rachel-a2',
    nameHe: 'רחל',
    branches: [
      { when: { flag: 'a2:bread' }, lines: [{ who: 'רחל', text: 'תודה. עכשיו לך, לפני שאני מוצאת לך עוד משהו.' }] },
      {
        lines: [{ who: 'רחל', text: 'לחם. רפי. על החשבון. ואל תרוץ בכביש.' }],
        choices: [
          { id: 'ok', text: '"טוב."', then: [{ e: 'flag', flag: 'a2:errand' }, { e: 'rel', who: 'rachel', axis: 'bond', delta: 2 }, { e: 'personality', key: 'reliability', delta: 2 }] },
          { id: 'after', text: '"אחרי המשחק, טוב?"', then: [{ e: 'flag', flag: 'a2:errand' }, { e: 'flag', flag: 'a2:after' }, { e: 'rel', who: 'rachel', axis: 'tension', delta: 2 }, { e: 'toast', text: '"אחרי המשחק אין לחם." היא אמרה את זה לגב שלך.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'rafi-a2',
    nameHe: 'רפי מהקיוסק',
    branches: [
      { when: { flag: 'a2:bread' }, lines: [{ who: 'רפי מהקיוסק', text: 'עוד לחם? אמא שלך אופה מכם או מה.' }] },
      {
        when: { flag: 'a2:errand' },
        lines: [{ who: 'רפי מהקיוסק', text: 'לחם לרחל. על החשבון. תגיד לה שהחשבון כבר לא זוכר את עצמו.' }],
        then: [{ e: 'flag', flag: 'a2:bread' }, { e: 'time', minutes: 6 }, { e: 'sfx', key: 'bell-shop', level: 0.5 }, { e: 'toast', text: 'לחם חם. הנייר נרטב מהחום.', tone: 'plain' }],
      },
      { lines: [{ who: 'רפי מהקיוסק', text: 'ילד. אתה מחפש משהו או מסתכל?' }] },
    ],
  },
  {
    id: 'alley-a2',
    nameHe: null,
    branches: [
      { when: { flag: 'a2:played' }, lines: [{ who: null, text: 'שיחקת. הרגליים עוד זוכרות.' }] },
      {
        when: { flag: 'a2:full' },
        lines: [{ who: 'אופיר', text: 'מלא! שניים־שניים ואחד בשער. תעמוד, תספור, מי שמפסיד יוצא.' }, { who: 'עמית', text: 'ספירה זה גם תפקיד.' }],
        then: [{ e: 'flag', flag: 'a2:late' }, { e: 'rel', who: 'ofir', axis: 'familiarity', delta: 1 }, { e: 'rel', who: 'amit', axis: 'bond', delta: 2 }, { e: 'time', minutes: 40 }, { e: 'ending', id: 'late' }],
      },
      {
        lines: [{ who: 'אופיר', text: 'פוגי! איתי. אתה בהגנה. לא לגעת ביד.' }],
        choices: [
          { id: 'play', text: 'להיכנס.', then: [{ e: 'flag', flag: 'a2:played' }, { e: 'rel', who: 'ofir', axis: 'bond', delta: 4 }, { e: 'rel', who: 'efi', axis: 'familiarity', delta: 2 }, { e: 'remember', who: 'ofir', eventId: 'first-team-1984', significance: 'major' }, { e: 'wellbeing', key: 'happiness', delta: 6 }, { e: 'sfx', key: 'ball-kick', level: 0.7 }, { e: 'minigame', id: 'football' }] },
          { id: 'watch', text: 'לעמוד ולראות קודם.', then: [{ e: 'personality', key: 'curiosity', delta: 1 }, { e: 'toast', text: '"תעמוד. אבל תעמוד רחוק מהשער."', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'a2-after-game',
    nameHe: null,
    branches: [
      { when: { flag: 'a2:after' }, lines: [{ who: null, text: 'חושך כמעט. הלחם. רפי סוגר בשבע.' }], then: [{ e: 'time', minutes: 30 }, { e: 'ending', id: 'played' }] },
      { lines: [{ who: null, text: 'חושך כמעט. הלחם בבית, הרגליים כואבות, וזה הרגיש כמו משהו שתרצה שוב.' }], then: [{ e: 'time', minutes: 30 }, { e: 'ending', id: 'played' }] },
    ],
  },
]

// -------------------------------------------------------------- A3 · the second house ---

export function objectiveA3(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a3:inside']) return null
  if (sceneId === 'ussishkin-outside') return 'הדלת. אפי מכיר את הסדרן.'
  return 'אפי אמר שיש משהו אחרי הקיר. תלך איתו.'
}

export const ENDINGS_A3: Record<string, EndingCard> = {
  hall: {
    id: 'hall',
    titleHe: 'הבית האדום השני',
    bodyHe: 'הסדרן ידע את השם של אפי. ואז שאל את שלך, ואמר אותו בקול, כאילו זה דבר שאומרים. בפנים היה פרקט, ורעש שנשמע כמו גשם, וכדור שעשה קול אחר מכל כדור ששמעת. לא ראית משחק. ראית מקום.',
    memoryHe: 'הסדרן שאמר את השם שלך.',
    memoryItem: 'ticket-stub',
  },
  door: {
    id: 'door',
    titleHe: 'עד הדלת',
    bodyHe: 'הגעת עד הדלת ולא נכנסת. אפי נכנס. שמעת מבחוץ את הרעש שנשמע כמו גשם, וחיכית לו על המדרגה. כשיצא הוא לא שאל למה. הוא אמר "בפעם הבאה", וזה נשמע כמו הבטחה של מישהו שמקיים.',
    memoryHe: 'הרעש מבחוץ, כמו גשם.',
    memoryItem: 'coin',
  },
}

export const BEATS_A3: Beat[] = [
  {
    id: 'a3-open',
    at: 'street',
    trigger: 'enter',
    when: { none: [{ flag: A3 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A3 },
      { a: 'lines', lines: [{ who: null, text: 'אותו רחוב, שנה אחרי. אתה כבר יודע איפה הבור במדרכה.' }, { who: 'אפי', text: 'פוגי. יש מקום שאתה לא מכיר. אחרי הקיר, ימינה. בוא.' }] },
    ],
  },
  {
    id: 'a3-hall',
    at: 'ussishkin-hall',
    trigger: 'enter',
    when: { flag: A3, none: [{ flag: 'a3:inside' }] },
    delayMs: 900,
    do: [
      { a: 'flag', flag: 'a3:inside' },
      { a: 'sfx', key: 'ball-bounce', level: 0.6 },
      { a: 'lines', lines: [{ who: null, text: 'פרקט. גובה. אור מהחלונות למעלה. ורעש של הרבה אנשים בחדר סגור — כמו גשם על גג פח.' }, { who: 'אפי', text: 'זה אוסישקין. גם זה הפועל. אבא שלך לא סיפר לך?' }] },
      { a: 'ending', id: 'hall' },
    ],
  },
  {
    id: 'a3-night',
    trigger: 'clock',
    when: { flag: A3, afterMinute: at(20, 0), none: [{ flag: 'a3:inside' }] },
    do: [{ a: 'lines', lines: [{ who: null, text: 'חושך. אפי יצא מהדלת ולא שאל למה חיכית בחוץ.' }] }, { a: 'ending', id: 'door' }],
  },
]

export const CONVERSATIONS_A3: Conversation[] = [
  {
    id: 'efi-a3',
    nameHe: 'אפי',
    branches: [
      { when: { at: 'ussishkin-outside' }, lines: [{ who: 'אפי', text: 'זה פה. הסדרן מכיר אותי. תגיד לו את השם שלך, הוא אוהב שמות.' }] },
      // `life:` as well as the day flag: a place you have been told about stays told
      // about. `knows:hall` is cleared with every other flag at midnight (§day.entered),
      // which is right for a beat and wrong for a street that now exists in his head.
      { lines: [{ who: 'אפי', text: 'אחרי הקיר, ימינה. אני הולך. אתה בא או לא?' }], then: [{ e: 'flag', flag: 'knows:hall' }, { e: 'flag', flag: 'life:knows:hall' }] },
    ],
  },
  {
    id: 'usher-a3',
    nameHe: 'סדרן',
    branches: [
      { when: { flag: 'a3:named' }, lines: [{ who: 'סדרן', text: 'פוגי. יאללה, פנימה. תישאר ליד אפי.' }] },
      {
        lines: [{ who: 'סדרן', text: 'אפי. ומי זה?' }],
        choices: [
          { id: 'name', text: '"פוגי."', then: [{ e: 'flag', flag: 'a3:named' }, { e: 'flag', flag: 'entry:granted' }, { e: 'redheart', key: 'basketballLove', delta: 4 }, { e: 'redheart', key: 'community', delta: 3 }, { e: 'remember', who: 'usher', eventId: 'said-my-name-1984', significance: 'major' }, { e: 'toast', text: '"פוגי." הוא אמר את זה בקול. כאילו זה דבר שאומרים.', tone: 'plain' }] },
          { id: 'quiet', text: 'לשתוק ולהסתכל על הרצפה.', then: [{ e: 'personality', key: 'courage', delta: -1 }, { e: 'toast', text: '"ביישן. בסדר. אפי, הוא איתך?" אפי אמר שכן.', tone: 'plain' }, { e: 'flag', flag: 'entry:granted' }] },
        ],
      },
    ],
  },
]

// ------------------------------------------------------------------- A4 · the shirt ---

export const SHIRT_PRICE = 1800

export function objectiveA4(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['own:shirt85']) return null
  if (state.savings + state.agorot >= SHIRT_PRICE) return 'יש מספיק. רפי סוגר בשבע.'
  if (sceneId === 'bedroom') return 'קיץ. החולצה בחלון של רפי. הקופה מתחת למיטה.'
  return 'בקבוקים, שליחויות, ומה שאבא נותן. עד שבע.'
}

export const ENDINGS_A4: Record<string, EndingCard> = {
  shirt: {
    id: 'shirt',
    titleHe: 'החולצה',
    bodyHe: 'ספרת את הפחית שלוש פעמים. רפי ספר פעם אחת ונתן. אדומה, בלי מספר, גדולה עליך בשתי מידות כי "תגדל". ישנת איתה על הכיסא ליד המיטה, שתראה אותה בבוקר.',
    memoryHe: 'החולצה על הכיסא, לפני שהיא הייתה שלך באמת.',
    memoryItem: 'folded-paper',
  },
  notYet: {
    id: 'notYet',
    titleHe: 'עוד לא',
    bodyHe: 'לא הספיק. רפי אמר "בשבוע הבא היא עוד פה", ואתה ידעת שהוא אומר את זה כדי שתלך הביתה. הפחית חזרה מתחת למיטה עם עוד קצת. זה לא היה הפסד. זה היה תרגול.',
    memoryHe: 'הפחית, כבדה יותר.',
    memoryItem: 'coin',
  },
  gave: {
    id: 'gave',
    titleHe: 'ויתרת על משהו',
    bodyHe: 'אמא הייתה צריכה את מה שבפחית, ולא ביקשה. ראית את הפנים שלה ליד הארנק ונתת. החולצה נשארה בחלון עוד חודש. כשקנית אותה בסוף, היא הייתה עוד יותר גדולה עליך.',
    memoryHe: 'הפחית ריקה על השולחן במטבח.',
    memoryItem: 'coin',
  },
}

export const BEATS_A4: Beat[] = [
  {
    id: 'a4-open',
    at: 'bedroom',
    trigger: 'enter',
    when: { none: [{ flag: A4 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A4 },
      { a: 'events', events: [{ t: 'savings.changed', agorot: 900, why: 'הפחית' }, { t: 'money.changed', agorot: 200, why: 'מהכיס' }] },
      { a: 'lines', lines: [{ who: null, text: 'קיץ. שבע. בחלון של רפי תלויה חולצה אדומה בלי מספר, ומתחת למיטה שלך יש פחית עם חריץ.' }, { who: null, text: 'רפי סוגר בשבע.' }] },
    ],
  },
  {
    id: 'a4-close',
    trigger: 'clock',
    when: { flag: A4, afterMinute: at(19, 0), none: [{ flag: 'own:shirt85' }, { flag: 'a4:gave' }, { flag: 'a4:done' }] },
    do: [{ a: 'flag', flag: 'a4:done' }, { a: 'lines', lines: [{ who: null, text: 'התריס של רפי ירד. החולצה נשארה בפנים.' }] }, { a: 'ending', id: 'notYet' }],
  },
]

export const CONVERSATIONS_A4: Conversation[] = [
  {
    id: 'tin-a4',
    nameHe: null,
    branches: [
      { when: { flag: 'own:shirt85' }, lines: [{ who: null, text: 'הפחית ריקה. החולצה על הכיסא.' }] },
      { when: { flag: 'a4:tin' }, lines: [{ who: null, text: 'הפחית ריקה. הכל בכיס.' }] },
      {
        lines: [{ who: null, text: 'הפחית. מנערים — יש. לא הרבה, אבל יש.' }],
        choices: [
          { id: 'take', text: 'לרוקן הכל לכיס.', then: [{ e: 'flag', flag: 'a4:tin' }, { e: 'goto', node: 'tin-a4-out' }] },
          { id: 'leave', text: 'להשאיר. עוד לא.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'tin-a4-out',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'המטבעות בכיס. הכיס כבד. זה מרגיש כמו משהו.' }], then: [{ e: 'withdraw', agorot: 900, why: 'הפחית' }, { e: 'sfx', key: 'coins', level: 0.6 }, { e: 'flagValue', flag: 'a4:tin', value: true }] }],
  },
  {
    id: 'bottles-a4',
    nameHe: null,
    branches: [
      { when: { flag: 'a4:bottles' }, lines: [{ who: null, text: 'הסמטה ריקה מבקבוקים. אספת הכל.' }] },
      {
        lines: [{ who: null, text: 'שלושה בקבוקי פיקדון ליד הפח. מישהו לא רצה ללכת לרפי.' }],
        choices: [
          { id: 'collect', text: 'לאסוף.', then: [{ e: 'flag', flag: 'a4:bottles' }, { e: 'give', item: 'bottle', count: 3 }, { e: 'time', minutes: 8 }, { e: 'toast', text: 'שלושה בקבוקים. מלוכלכים. שווים.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'rafi-a4',
    nameHe: 'רפי מהקיוסק',
    branches: [
      { when: { flag: 'own:shirt85' }, lines: [{ who: 'רפי מהקיוסק', text: 'תלבש אותה בכבוד. ותכבס ביד.' }] },
      {
        when: { hasItem: 'bottle' },
        lines: [{ who: 'רפי מהקיוסק', text: 'בקבוקים? תביא. שקל אחד. ואל תביא לי את המלוכלכים של הסמטה — טוב, תביא.' }],
        then: [{ e: 'take', item: 'bottle', count: 3 }, { e: 'money', agorot: 300, why: 'פיקדון' }, { e: 'sfx', key: 'coins', level: 0.6 }, { e: 'toast', text: '3 ₪. הכיס מצלצל.', tone: 'plain' }],
      },
      {
        when: { minAgorot: SHIRT_PRICE },
        lines: [{ who: 'רפי מהקיוסק', text: 'החולצה? שמונה־עשרה. יש לך? תספור על הדלפק, לא בכיס.' }],
        choices: [
          { id: 'buy', text: 'לספור על הדלפק. הכל.', then: [{ e: 'money', agorot: -SHIRT_PRICE, why: 'החולצה' }, { e: 'own', item: 'shirt85' }, { e: 'redheart', key: 'footballLove', delta: 5 }, { e: 'personality', key: 'reliability', delta: 3 }, { e: 'remember', who: 'shopkeeper', eventId: 'bought-shirt-1985', significance: 'major' }, { e: 'sfx', key: 'coins', level: 0.7 }, { e: 'toast', text: 'הוא קיפל אותה פעמיים והכניס לשקית של לחם.', tone: 'red' }, { e: 'goto', node: 'rafi-a4-bought' }] },
          { id: 'wait', text: '"עוד לא. בשבוע הבא."', then: [{ e: 'toast', text: '"בשבוע הבא היא עוד פה." הוא לא היה בטוח.', tone: 'plain' }] },
        ],
      },
      {
        lines: [{ who: 'רפי מהקיוסק', text: 'החולצה? שמונה־עשרה. אין לך שמונה־עשרה. יש לך פנים של ילד שסופר.' }],
        choices: [
          { id: 'work', text: '"יש משהו לעשות? לסדר, לסחוב?"', when: { none: [{ flag: 'a4:worked' }] }, noteHe: 'כבר סידרת לו את הארגזים היום.', then: [{ e: 'flag', flag: 'a4:worked' }, { e: 'time', minutes: 50 }, { e: 'energy', delta: -15 }, { e: 'money', agorot: 400, why: 'ארגזים' }, { e: 'personality', key: 'reliability', delta: 2 }, { e: 'toast', text: 'שעה של ארגזים. 4 ₪ ובקבוק קולה פתוח.', tone: 'plain' }] },
          { id: 'no', text: '"רק מסתכל."', then: [] },
        ],
      },
    ],
  },
  {
    id: 'rafi-a4-bought',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'השקית ביד. הביתה, לא בריצה. בריצה היא יכולה ליפול.' }], then: [{ e: 'ending', id: 'shirt' }] }],
  },
  {
    id: 'kobi-a4',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'a4:kobi' }, lines: [{ who: 'קובי', text: 'נתתי מה שיש. השאר — שלך.' }] },
      {
        lines: [{ who: 'קובי', text: 'החולצה מהחלון של רפי? יפה. כמה חסר לך?' }],
        choices: [
          { id: 'ask', text: '"הרבה."', then: [{ e: 'flag', flag: 'a4:kobi' }, { e: 'money', agorot: 500, why: 'מאבא' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'toast', text: 'הוא הוציא מהכיס בלי לספור. "השאר שלך."', tone: 'plain' }] },
          { id: 'alone', text: '"אני אסתדר לבד."', then: [{ e: 'flag', flag: 'a4:kobi' }, { e: 'personality', key: 'stubbornness', delta: 2 }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 2 }, { e: 'toast', text: 'הוא הנהן. אצלו זה מחמאה.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'rachel-a4',
    nameHe: 'רחל',
    branches: [
      { when: { flag: 'a4:gave' }, lines: [{ who: 'רחל', text: 'אני מחזירה לך. כל שקל. שמעת?' }] },
      {
        when: { flag: 'a4:tin' },
        lines: [{ who: null, text: 'אמא ליד הארנק. הארנק פתוח, ואין בו הרבה. היא לא ביקשה. היא רק הסתכלה על הכיס שלך ואז על הרצפה.' }],
        choices: [
          { id: 'give', text: 'לשים את הכל על השולחן.', then: [{ e: 'flag', flag: 'a4:gave' }, { e: 'money', agorot: -1200, why: 'לאמא' }, { e: 'rel', who: 'rachel', axis: 'bond', delta: 8 }, { e: 'remember', who: 'rachel', eventId: 'gave-the-tin-1985', significance: 'major' }, { e: 'personality', key: 'empathy', delta: 4 }, { e: 'ending', id: 'gave' }] },
          { id: 'keep', text: 'להחזיק את הכיס ולשתוק.', then: [{ e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'personality', key: 'stubbornness', delta: 1 }] },
        ],
      },
      { lines: [{ who: 'רחל', text: 'החולצה? יפה. רק שתדע — ארבע כביסות והיא ורודה.' }] },
    ],
  },
]

// ----------------------------------------------------------------- A5 · in your shirt ---

export function objectiveA5(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a5:there']) return null
  if (!state.flags['a5:dressed']) return 'שבת. משחק. אבא מחכה למטה. תתלבש לבד.'
  if (sceneId === 'bloomfield-outside') return 'שער 7. אבא.'
  return 'לבלומפילד. בחולצה.'
}

export const ENDINGS_A5: Record<string, EndingCard> = {
  there: {
    id: 'there',
    titleHe: 'בחולצה שלך',
    bodyHe: 'התלבשת לבד, לקחת את המפתח לבד, ירדת לבד. אבא חיכה ליד האוטו ולא אמר על החולצה כלום, רק הסתכל שנייה יותר מדי. בשער 7 מישהו אמר "הנה עוד אחד" והתכוון אליך. זה הזיכרון.',
    memoryHe: '"הנה עוד אחד."',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  late: {
    id: 'late',
    titleHe: 'אחרי שהתחיל',
    bodyHe: 'לקח לך זמן. החולצה הפוכה, המפתח לא במקום, השרוך. אבא חיכה ואחר כך לא חיכה. הגעתם אחרי השריקה, ובשער 7 מישהו הזיז את עצמו כדי שתראה. את המשחק לא זכרת. את החולצה כן.',
    memoryHe: 'החולצה הפוכה, והתווית מגרדת.',
    memoryItem: 'ticket-stub',
    presence: 'late',
  },
}

export const BEATS_A5: Beat[] = [
  {
    id: 'a5-open',
    at: 'bedroom',
    trigger: 'enter',
    when: { none: [{ flag: A5 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A5 },
      { a: 'events', events: [{ t: 'money.changed', agorot: 200, why: 'לדרך' }] },
      { a: 'lines', lines: [{ who: null, text: 'שבת. אחת. החולצה על הכיסא. מהרחוב — צפירה של האוטו של אבא, פעם אחת, קצרה.' }, { who: 'קובי', text: '(מלמטה) פוגי! רבע שעה!' }] },
    ],
  },
  {
    id: 'a5-ground',
    at: 'bloomfield-outside',
    trigger: 'enter',
    when: { flag: A5, flagIs: { flag: 'a5:dressed', value: true }, none: [{ flag: 'a5:there' }] },
    delayMs: 900,
    do: [
      { a: 'flag', flag: 'a5:there' },
      { a: 'sfx', key: 'crowd-swell', level: 0.6 },
      { a: 'lines', lines: [{ who: null, text: 'שער 7. אבא ליד הברזל, מדבר עם מישהו. מסתכל עליך שנייה יותר מדי.' }, { who: 'בארי', text: 'הנה עוד אחד.' }] },
      { a: 'derive', events: (state) => [{ t: 'flag.raised', flag: state.minute > at(15, 40) ? 'a5:late' : 'a5:ontime' }] },
      { a: 'talk', conversation: 'a5-close' },
    ],
  },
  {
    id: 'a5-gone',
    trigger: 'clock',
    when: { flag: A5, afterMinute: at(15, 0), none: [{ flag: 'a5:kobi-left' }, { flag: 'a5:there' }] },
    do: [{ a: 'flag', flag: 'a5:kobi-left' }, { a: 'flag', flag: 'kobi:left' }, { a: 'sfx', key: 'car-door', level: 0.6 }, { a: 'toast', text: 'צפירה ארוכה. ואז מנוע. אבא נסע.', tone: 'red' }],
  },
]

export const CONVERSATIONS_A5: Conversation[] = [
  {
    id: 'shirt-a5',
    nameHe: null,
    branches: [
      { when: { flag: 'a5:dressed' }, lines: [{ who: null, text: 'אתה בחולצה. היא גדולה. זה בסדר.' }] },
      {
        lines: [{ who: null, text: 'החולצה. אדומה. עוד לא לבשת אותה למשחק.' }],
        choices: [
          { id: 'wear', text: 'ללבוש.', then: [{ e: 'flagValue', flag: 'a5:dressed', value: true }, { e: 'flag', flag: 'knows:match' }, { e: 'time', minutes: 4 }, { e: 'toast', text: 'התווית מגרדת בצוואר. לא משנה.', tone: 'plain' }] },
          { id: 'inside-out', text: 'ללבוש מהר. הפוך. לא לשים לב.', then: [{ e: 'flagValue', flag: 'a5:dressed', value: true }, { e: 'flag', flag: 'a5:inside-out' }, { e: 'flag', flag: 'knows:match' }, { e: 'time', minutes: 2 }, { e: 'toast', text: 'התפרים בחוץ. תגלה את זה בשער.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'kobi-a5',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'a5:kobi-left' }, lines: [{ who: null, text: 'האוטו לא פה.' }] },
      { when: { flag: 'a5:dressed' }, lines: [{ who: 'קובי', text: '…' }, { who: null, text: 'הוא הסתכל על החולצה. שנייה יותר מדי. ואז פתח את הדלת.' }], then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'remember', who: 'kobi', eventId: 'saw-the-shirt-1985', significance: 'major' }, { e: 'time', minutes: 25 }, { e: 'travel', to: 'bloomfield-outside', spawn: 'fromRoute' }] },
      { lines: [{ who: 'קובי', text: 'ככה אתה בא? לך תתלבש. יש לך רבע שעה.' }] },
    ],
  },
  {
    id: 'kobi-a5-gate',
    nameHe: 'קובי',
    branches: [{ lines: [{ who: 'קובי', text: 'תעמוד לידי. לא לזוז. אם אתה מאבד אותי — פה, ליד הברזל.' }], then: [{ e: 'rel', who: 'kobi', axis: 'familiarity', delta: 1 }] }],
  },
  {
    id: 'barry-a5',
    nameHe: 'בארי',
    branches: [{ lines: [{ who: 'בארי', text: 'הנה עוד אחד. בן כמה? שבע? בגילך אבא שלך עמד בדיוק פה. אותו ברזל.' }], then: [{ e: 'rel', who: 'barry', axis: 'familiarity', delta: 2 }, { e: 'redheart', key: 'historyMemory', delta: 2 }] }],
  },
  {
    id: 'a5-close',
    nameHe: null,
    branches: [
      { when: { flag: 'a5:late' }, lines: [{ who: null, text: 'מאחורי השער כבר צועקים. התחיל בלעדיך.' }], then: [{ e: 'presence', mode: 'late' }, { e: 'ending', id: 'late' }] },
      { lines: [{ who: null, text: 'אבא שם יד על הכתף ומכניס אותך פנימה. אתה בחולצה. אף אחד לא צוחק.' }], then: [{ e: 'presence', mode: 'inside' }, { e: 'redheart', key: 'footballLove', delta: 4 }, { e: 'redheart', key: 'loyaltyReturn', delta: 3 }, { e: 'ending', id: 'there' }] },
    ],
  },
]

// -------------------------------------------------------------------- A6 · the radio ---

export function objectiveA6(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a6:heard']) return null
  if (state.flags['a6:radio-dead']) return 'הרדיו מת. לירון ברחוב מתקן רדיו.'
  if (sceneId === 'home') return 'חורף. גשם. אבא נסע לבד. יש רדיו.'
  return 'לשמוע את המשחק. איפשהו.'
}

export const ENDINGS_A6: Record<string, EndingCard> = {
  heard: {
    id: 'heard',
    titleHe: 'אכזבה רגילה',
    bodyHe: 'שמעת עד הסוף, עם הרעש, עם הידיים על הטרנזיסטור כמו על תנור. לא נגמר טוב. אמא אמרה "יש עוד שבת" בלי להרים את הראש מהעיתון, וזה היה בדיוק מה שצריך. זו הפעם הראשונה שהבנת שזה קורה גם ככה. הרבה.',
    memoryHe: 'הידיים על הטרנזיסטור, כמו על תנור.',
    memoryItem: 'folded-paper',
    presence: 'radio',
  },
  liron: {
    id: 'liron',
    titleHe: 'הרדיו של לירון',
    bodyHe: 'הרדיו בבית מת בדקה שלושים. רצת בגשם ללירון, והוא פתח את הגב שלו על השולחן ואמר "תחזיק פה". שמעתם ביחד, בין החוטים, עם מברג. לא נגמר טוב. הוא אמר "ככה זה", וזה נשמע כמו מישהו שאמר את זה הרבה פעמים.',
    memoryHe: 'הגב הפתוח של הרדיו, והמברג.',
    memoryItem: 'transistor',
    presence: 'radio',
  },
  quiet: {
    id: 'quiet',
    titleHe: 'לא שמעת',
    bodyHe: 'הרדיו מת ולא הלכת בגשם. שמעת מאבא בערב, במילה אחת, כשהוריד את המעיל. לא שאלת יותר. למדת משהו על השקט שאחרי.',
    memoryHe: 'המעיל הרטוב על הכיסא.',
    memoryItem: 'coin',
    presence: 'heard-from-friend',
  },
}

export const BEATS_A6: Beat[] = [
  {
    id: 'a6-open',
    at: 'home',
    trigger: 'enter',
    when: { none: [{ flag: A6 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A6 },
      { a: 'flag', flag: 'kobi:left' },
      { a: 'flag', flag: 'knows:match' },
      { a: 'lines', lines: [{ who: null, text: 'חורף. שבת. גשם על התריס. אבא נסע לבד — "בגשם הזה? לא." — ובמטבח יש טרנזיסטור.' }] },
    ],
  },
  {
    id: 'a6-dies',
    trigger: 'clock',
    when: { flag: 'a6:on', afterMinute: at(15, 35), none: [{ flag: 'a6:radio-dead' }, { flag: 'a6:heard' }] },
    do: [{ a: 'flag', flag: 'a6:radio-dead' }, { a: 'sound', kind: 'radio', on: false }, { a: 'toast', text: 'רעש. ואז כלום. הטרנזיסטור מת באמצע משפט.', tone: 'red' }],
  },
  {
    id: 'a6-end',
    trigger: 'clock',
    when: { flag: A6, afterMinute: at(16, 50), none: [{ flag: 'a6:heard' }] },
    do: [
      { a: 'derive', events: (state) => [{ t: 'flag.raised', flag: state.flags['a6:with-liron'] ? 'a6:end-liron' : state.flags['a6:on'] && !state.flags['a6:radio-dead'] ? 'a6:end-heard' : 'a6:end-quiet' }] },
      { a: 'talk', conversation: 'a6-close' },
    ],
  },
]

export const CONVERSATIONS_A6: Conversation[] = [
  {
    id: 'radio-a6',
    nameHe: null,
    branches: [
      { when: { flag: 'a6:radio-dead' }, lines: [{ who: null, text: 'מת. מנערים — כלום. הסוללות חמות.' }] },
      { when: { flag: 'a6:on' }, lines: [{ who: null, text: 'השדר צועק לפני שקורה משהו. אתה מחזיק את הטרנזיסטור בשתי ידיים.' }] },
      {
        lines: [{ who: null, text: 'הטרנזיסטור. האנטנה עקומה. מישהו הדביק אותה בסלוטייפ.' }],
        choices: [
          { id: 'on', text: 'להדליק.', then: [{ e: 'flag', flag: 'a6:on' }, { e: 'sfx', key: 'radio-tune', level: 0.6 }, { e: 'toast', text: 'רעש. ואז קול. ואז רעש. תחזיק את האנטנה.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'rachel-a6',
    nameHe: 'רחל',
    branches: [
      { when: { flag: 'a6:radio-dead' }, lines: [{ who: 'רחל', text: 'מת? לירון ברחוב. עם מטרייה. ואם לא — יש עוד שבת.' }] },
      { lines: [{ who: 'רחל', text: 'תוריד את הקול. אני שומעת את השדר בכל הבית. הוא צועק יותר מהמשחק.' }] },
    ],
  },
  {
    id: 'liron-a6',
    nameHe: 'לירון',
    branches: [
      { when: { flag: 'a6:with-liron' }, lines: [{ who: 'לירון', text: 'תחזיק פה. לא לזוז.' }] },
      {
        when: { flag: 'a6:radio-dead' },
        lines: [{ who: 'לירון', text: 'הטרנזיסטור מת? כולם מתים בגשם. בוא, יש לי פה אחד פתוח. תחזיק את החוט האדום.' }],
        choices: [
          { id: 'hold', text: 'להחזיק את החוט.', then: [{ e: 'flag', flag: 'a6:with-liron' }, { e: 'rel', who: 'liron', axis: 'bond', delta: 5 }, { e: 'remember', who: 'liron', eventId: 'held-the-wire-1986', significance: 'major' }, { e: 'sfx', key: 'radio-tune', level: 0.6 }, { e: 'redheart', key: 'community', delta: 3 }, { e: 'time', minutes: 40 }, { e: 'toast', text: 'בין החוטים — קול. הוא חייך בלי להסתכל עליך.', tone: 'plain' }] },
          { id: 'no', text: '"לא, אני אלך הביתה."', then: [{ e: 'wellbeing', key: 'loneliness', delta: 2 }] },
        ],
      },
      { lines: [{ who: 'לירון', text: 'גשם כזה — הקליטה הולכת. אם הרדיו שלכם ימות, אתה יודע איפה אני.' }] },
    ],
  },
  {
    id: 'a6-close',
    nameHe: null,
    branches: [
      { when: { flag: 'a6:end-liron' }, lines: [{ who: 'לירון', text: 'ככה זה.' }, { who: null, text: 'הוא אמר את זה כמו מישהו שאמר את זה הרבה פעמים.' }], then: [{ e: 'flag', flag: 'a6:heard' }, { e: 'redheart', key: 'loyaltyReturn', delta: 2 }, { e: 'ending', id: 'liron' }] },
      { when: { flag: 'a6:end-heard' }, lines: [{ who: 'רחל', text: 'יש עוד שבת.' }, { who: null, text: 'היא לא הרימה את הראש מהעיתון. זה היה בדיוק מה שצריך.' }], then: [{ e: 'flag', flag: 'a6:heard' }, { e: 'rel', who: 'rachel', axis: 'bond', delta: 2 }, { e: 'redheart', key: 'loyaltyReturn', delta: 3 }, { e: 'ending', id: 'heard' }] },
      { lines: [{ who: null, text: 'אבא חזר רטוב. מילה אחת. הוריד את המעיל.' }], then: [{ e: 'flag', flag: 'a6:heard' }, { e: 'wellbeing', key: 'loneliness', delta: 2 }, { e: 'ending', id: 'quiet' }] },
    ],
  },
]

// ------------------------------------------------------------- A7 · the week before ---

export function objectiveA7(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a7:refused']) return null
  if (!state.flags['a7:knows']) return 'שבת. ברחוב מדברים על שבת הבאה. תבין על מה.'
  if (sceneId === 'home') return 'אבא. לשאול.'
  return 'עמית יודע. אופיר בטוח. אבא — בבית.'
}

export const ENDINGS_A7: Record<string, EndingCard> = {
  refused: {
    id: 'refused',
    titleHe: '"לא השבוע"',
    bodyHe: 'שאלת. הוא אמר לא. "זה לא משחק לילדים. יהיו שם יותר מדי אנשים." אמא אמרה שהוא צודק, וזה היה יותר גרוע. הלכת לחדר ולא בכית. ידעת כבר מה תעשה בשבת, רק עוד לא ידעת שאתה יודע.',
    memoryHe: '"לא השבוע."',
    memoryItem: 'newspaper',
  },
  promised: {
    id: 'promised',
    titleHe: 'הבטחה',
    bodyHe: 'הוא אמר "נראה". אצל אבא "נראה" זה כן, בדרך כלל. הלכת לישון עם זה. בשבת בצהריים הוא יצא בלעדיך, ו"נראה" הפך למילה שאתה לא סומך עליה. עד היום.',
    memoryHe: '"נראה."',
    memoryItem: 'newspaper',
  },
  silent: {
    id: 'silent',
    titleHe: 'לא שאלת',
    bodyHe: 'לא שאלת. ידעת מה יגיד. ישבת עם העיתון של עמית מתחת למיטה וקראת את הכותרת עשרים פעם. בשבת בצהריים, כשיצא, לא היה לך על מה לכעוס. זה היה יותר קשה.',
    memoryHe: 'העיתון מתחת למיטה.',
    memoryItem: 'newspaper',
  },
}

export const BEATS_A7: Beat[] = [
  {
    id: 'a7-open',
    at: 'street',
    trigger: 'enter',
    when: { none: [{ flag: A7 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A7 },
      { a: 'lines', lines: [{ who: null, text: 'שבת. שבוע לפני. ברחוב אף אחד לא הולך מזרחה. כולם עומדים ומדברים על השבת הבאה, בקול של אנשים שמפחדים להגיד את זה.' }] },
    ],
  },
  {
    id: 'a7-night',
    trigger: 'clock',
    when: { flag: A7, afterMinute: at(20, 30), none: [{ flag: 'a7:refused' }] },
    do: [{ a: 'lines', lines: [{ who: null, text: 'לילה. לא שאלת. העיתון מתחת למיטה.' }] }, { a: 'flag', flag: 'a7:refused' }, { a: 'ending', id: 'silent' }],
  },
]

export const CONVERSATIONS_A7: Conversation[] = [
  {
    id: 'amit-a7',
    nameHe: 'עמית',
    branches: [
      { when: { flag: 'a7:knows' }, lines: [{ who: 'עמית', text: 'שבת הבאה. הכל. תשמור את העיתון, תראה שאני צודק.' }] },
      {
        lines: [{ who: 'עמית', text: 'אתה לא יודע? שבת הבאה. משחק שיכול לסגור הכל. כתוב פה. אני לא ממציא.' }, { who: null, text: 'הוא הראה לך כותרת. לא הבנת את כל המילים. הבנת את הגודל של האותיות.' }],
        then: [{ e: 'flag', flag: 'a7:knows' }, { e: 'give', item: 'newspaper' }, { e: 'rel', who: 'amit', axis: 'bond', delta: 3 }, { e: 'redheart', key: 'historyMemory', delta: 2 }, { e: 'toast', text: 'העיתון. הוא נתן לך אותו. "תשמור."', tone: 'plain' }],
      },
    ],
  },
  {
    id: 'ofir-a7',
    nameHe: 'אופיר',
    branches: [
      { lines: [{ who: 'אופיר', text: 'שבת הבאה אני הולך. לא משנה מה. גם אם צריך לטפס. אתה?' }], choices: [
        { id: 'me-too', text: '"גם אני."', then: [{ e: 'flag', flag: 'a7:said-yes' }, { e: 'rel', who: 'ofir', axis: 'bond', delta: 3 }, { e: 'personality', key: 'courage', delta: 2 }, { e: 'toast', text: '"יאללה." הוא לחץ לך את היד כמו גדולים.', tone: 'plain' }] },
        { id: 'dad', text: '"תלוי באבא שלי."', then: [{ e: 'personality', key: 'reliability', delta: 1 }, { e: 'toast', text: '"תלוי באבא." הוא אמר את זה בקול שלך ולא צחק.', tone: 'plain' }] },
      ] },
    ],
  },
  {
    id: 'kobi-a7',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'a7:refused' }, lines: [{ who: 'קובי', text: 'אמרתי. לא השבוע.' }] },
      {
        when: { flag: 'a7:knows' },
        lines: [{ who: 'קובי', text: 'מה, עמית כבר סיפר לך. כן. שבת הבאה.' }],
        choices: [
          { id: 'ask', text: '"קח אותי."', then: [{ e: 'flag', flag: 'a7:refused' }, { e: 'flag', flag: 'life:a7:refused' }, { e: 'rel', who: 'kobi', axis: 'tension', delta: 4 }, { e: 'wellbeing', key: 'stress', delta: 4 }, { e: 'remember', who: 'kobi', eventId: 'said-no-1986', significance: 'major' }, { e: 'toast', text: '"לא השבוע. זה לא משחק לילדים."', tone: 'red' }, { e: 'ending', id: 'refused' }] },
          { id: 'hint', text: '"אופיר הולך."', then: [{ e: 'flag', flag: 'a7:refused' }, { e: 'flag', flag: 'life:a7:promised' }, { e: 'rel', who: 'kobi', axis: 'familiarity', delta: 2 }, { e: 'toast', text: '"נראה." הוא חזר לעיתון.', tone: 'plain' }, { e: 'ending', id: 'promised' }] },
          { id: 'quiet', text: 'לא לשאול.', then: [{ e: 'personality', key: 'stubbornness', delta: 1 }, { e: 'wellbeing', key: 'loneliness', delta: 2 }] },
        ],
      },
      { lines: [{ who: 'קובי', text: 'מה אתה עומד? לך לשחק.' }] },
    ],
  },
  {
    id: 'rachel-a7',
    nameHe: 'רחל',
    branches: [
      { when: { flag: 'a7:refused' }, lines: [{ who: 'רחל', text: 'הוא צודק. יהיו שם יותר מדי אנשים.' }, { who: null, text: 'זה היה יותר גרוע מה"לא" שלו.' }] },
      { lines: [{ who: 'רחל', text: 'שבת הבאה? אל תתחיל. תדבר עם אבא, לא איתי.' }] },
    ],
  },
]
