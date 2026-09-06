import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * B7 · "גם האולם יכול לרדת" · 1996/97 – 1997/98 — the hall goes down while the ground
 * nearly does, and the next season's way back up heals nothing.
 *
 * Two nights at Ussishkin a year apart. The first is the relegation night: Shachor and
 * Limor need hands more than they need a crowd, Freddy connects the money without a
 * lecture, and a soldier on leave has to choose between the hall and a football call
 * from his father the same evening. The second is the night they come back up — "עלינו"
 * is not "הבראנו", and everybody in the corner knows it.
 */

export const H1 = 'life:hall:d1'
export const H2 = 'life:hall:d2'

export const PORTRAIT_HALL: Record<string, string> = {
  'פוגי': 'faceHero80',
  'קובי': 'faceKobi',
  'שחור': 'faceShachor',
  'לימור': 'faceLimor',
  'פרדי': 'faceFreddy',
  'אפי': 'faceEfi',
  'סוקו': 'faceSoko',
  'סדרן': 'faceUsher',
  'אוהד': 'faceSupporter',
}

export function objectiveHall(state: LifeState): string | null {
  if (state.chapterDone) return null
  if (state.flags[H2]) return state.flags['h2:done'] ? null : 'שנה אחרי. אותו אולם. עולים.'
  if (state.flags['h1:decided']) return null
  return 'ערב ירידה. שחור צריך ידיים. אבא צריך אותך בבלומפילד.'
}

export const ENDINGS_HALL: Record<string, EndingCard> = {
  hall: {
    id: 'hall',
    titleHe: 'עלינו. לא הבראנו.',
    bodyHe:
      'היית באולם בלילה שירדו — הראשון בתולדות הקבוצה — ובאולם בלילה שעלו חזרה. בשני הלילות סחבת משהו. בשני מישהו אמר "עלינו" ואף אחד לא ענה, כי כולם ידעו מה זה שווה. הגג עוד עומד. על מה הוא עומד — זו השאלה שהתחילה בך הערב.',
    memoryHe: 'כרטיס מהלילה של הירידה, ומאחוריו, בעט, כמה עלו שני הארגזים. לימור כתבה.',
    memoryItem: 'hall-ticket',
    presence: 'inside',
  },
  football: {
    id: 'football',
    titleHe: 'בבלומפילד, כשהאולם ירד',
    bodyHe:
      'בחרת באבא ובכדורגל בערב שהאולם ירד בפעם הראשונה בתולדותיו. שמעת את זה במחצית, מטרנזיסטור של מישהו מאחור. שחור לא הזכיר את זה אף פעם. זה היה יותר גרוע מאשר אם היה מזכיר. שנה אחרי היית שם כשעלו, וזה תיקן חצי.',
    memoryHe: 'כרטיס לבלומפילד מאותו ערב. מישהו כתב עליו בעט שעה, ומחק.',
    memoryItem: 'ticket-stub',
    presence: 'heard-from-friend',
  },
}

const DAY = (flag: string, year: number, weekday: number, minute: number, dateHe?: string) =>
  [{ t: 'day.entered', dayId: flag, year, weekday, minute, ...(dateHe ? { dateHe } : {}) } as const, { t: 'flag.raised', flag } as const]

export const BEATS_HALL: Beat[] = [
  {
    id: 'h1-open',
    at: 'ussishkin-outside',
    trigger: 'enter',
    when: { none: [{ flag: H2 }, { flag: H1 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: H1 },
      { a: 'events', events: [{ t: 'money.changed', agorot: 3000, why: 'חופשה' }] },
      { a: 'lines', lines: [{ who: null, text: 'אביב. חופשה של ארבעים ושמונה שעות. הגעת ישר מהתחנה, עם התיק, לפינה של אוסישקין.' }, { who: null, text: 'הערב, אם זה נגמר רע, הקבוצה הזאת יורדת ליגה בפעם הראשונה מאז שנוסדה ב-1935. ובאותו ערב בדיוק, בבלומפילד, משחק שאבא אמר עליו "אתה חייב להיות".' }] },
      { a: 'talk', conversation: 'h1-corner' },
    ],
  },
  {
    id: 'h1-hall',
    at: 'ussishkin-hall',
    trigger: 'enter',
    when: { flag: H1, none: [{ flag: 'h1:decided' }] },
    delayMs: 900,
    do: [
      { a: 'flag', flag: 'h1:decided' },
      { a: 'flag', flag: 'h1:hall' },
      { a: 'card', titleHe: 'הערב האחרון', subHe: 'אוסישקין · ליגה', ms: 2400 },
      { a: 'match', script: 'hall-97' },
      { a: 'events', events: DAY(H2, 1998, 2, at(19, 30), 'אביב 1998') },
      { a: 'card', titleHe: 'שנה אחרי', subHe: 'אוסישקין', ms: 2600 },
      { a: 'travel', to: 'ussishkin-outside', spawn: 'start' },
    ],
  },
  {
    id: 'h1-football',
    trigger: 'clock',
    when: { flag: 'h1:football', none: [{ flag: H2 }] },
    do: [
      { a: 'card', titleHe: 'בלומפילד', subHe: 'באותו ערב', ms: 2400 },
      { a: 'talk', conversation: 'h1-bloomfield' },
      { a: 'events', events: DAY(H2, 1998, 2, at(19, 30), 'אביב 1998') },
      { a: 'card', titleHe: 'שנה אחרי', subHe: 'אוסישקין', ms: 2600 },
      { a: 'travel', to: 'ussishkin-outside', spawn: 'start' },
    ],
  },
  {
    id: 'h2-open',
    at: 'ussishkin-outside',
    trigger: 'enter',
    when: { flag: H2, none: [{ flag: 'h2:done' }] },
    delayMs: 800,
    do: [{ a: 'talk', conversation: 'h2-corner' }],
  },
]

export const CONVERSATIONS_HALL: Conversation[] = [
  {
    id: 'h1-corner',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'שחור ליד שני ארגזים. לימור עם פנקס. פרדי בחליפה, מדבר עם מישהו בטלפון נייד בגודל של לבנה.' },
          { who: 'שחור', text: 'אתה. יופי. שני ארגזים צריכים להיכנס לפני הקהל, ואין לי גב. אני לא מבקש פעמיים.' },
          { who: 'לימור', text: 'ואבא שלך התקשר לקיוסק של רפי. רפי אמר לשחור, שחור אמר לי. הוא בשער 7 בשמונה, והוא מחכה.' },
          { who: null, text: 'שמונה. בשני המקומות.' },
        ],
        choices: [
          { id: 'crates', text: 'לסחוב את הארגזים. להישאר באולם.', then: [{ e: 'rel', who: 'shachor', axis: 'bond', delta: 6 }, { e: 'remember', who: 'shachor', eventId: 'crates-relegation-1997', significance: 'major' }, { e: 'energy', delta: -12 }, { e: 'rel', who: 'kobi', axis: 'tension', delta: 4 }, { e: 'redheart', key: 'basketballLove', delta: 4 }, { e: 'flag', flag: 'h1:crates' }, { e: 'toast', text: 'לארגז השני חסרה ידית. שחור לא אמר תודה — אמר "עוד אחד".', tone: 'plain' }] },
          { id: 'football', text: 'להתנצל. ללכת לאבא.', then: [{ e: 'flag', flag: 'h1:decided' }, { e: 'flag', flag: 'h1:football' }, { e: 'flag', flag: 'life:hall:football-night' }, { e: 'rel', who: 'shachor', axis: 'trust', delta: -5 }, { e: 'remember', who: 'shachor', eventId: 'left-relegation-night-1997', significance: 'major' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 4 }, { e: 'institution', key: 'ussishkinWound', delta: 4 }, { e: 'time', minutes: 40 }] },
          { id: 'freddy', text: 'לשאול את פרדי מה קורה עם הכסף.', then: [{ e: 'goto', node: 'h1-freddy' }] },
        ],
      },
    ],
  },
  {
    id: 'h1-freddy',
    nameHe: 'פרדי',
    branches: [
      {
        lines: [
          { who: 'פרדי', text: 'מה קורה עם הכסף. (מקפל את הטלפון.) אין. זה מה שקורה. הכדורגל עבר לידיים שיש להן אינטרס לשמור עליו. לאולם אין ידיים כאלה.' },
          { who: 'פרדי', text: 'ומי שרוצה שיהיו — יצטרך להיות הידיים. לא הערב. אבל שיתחיל לחשוב מי זה "מישהו".' },
        ],
        then: [{ e: 'institution', key: 'supporterOwnershipSeed', delta: 8 }, { e: 'institution', key: 'basketballOwnershipTrust', delta: -8 }, { e: 'goto', node: 'h1-corner' }],
      },
    ],
  },
  {
    id: 'h1-inside',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'גג הפח, החום, ריח של גרעינים ונקניקיות מהמזנון. הפרקט שוקע בדיוק במקום שהוא תמיד שוקע.' },
          { who: null, text: 'אלפיים מקומות באולם הזה. הערב אפשר לספור אחד־אחד את מי שבא, ואף אחד לא רוצה.' },
          { who: 'לימור', text: 'תעמוד לידי. אני סופרת כמה אנחנו. אני רוצה שיהיה רשום.' },
          { who: null, text: 'שתי דקות על השעון והאולם כבר שותק. לא שקט של אבל — של אנשים שמחשבים כמה עולה להישאר.' },
          { who: 'שחור', text: 'הארגזים. אותו סדר, הפוך.' },
        ],
        choices: [
          { id: 'carry', text: 'לסחוב חזרה. עד הסוף.', then: [{ e: 'rel', who: 'shachor', axis: 'sharedHistory', delta: 6 }, { e: 'institution', key: 'ussishkinWound', delta: 8 }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 6 }, { e: 'presence', mode: 'inside' }, { e: 'goto', node: 'h1-out' }] },
          { id: 'efi', text: 'לחפש את אפי קודם.', then: [{ e: 'goto', node: 'h1-efi' }] },
        ],
      },
    ],
  },
  {
    id: 'h1-efi',
    nameHe: 'אפי',
    branches: [
      {
        when: { relationship: { who: 'efi', axis: 'trust', max: 45 } },
        lines: [{ who: null, text: 'אפי לא היה. לימור אמרה שהוא "בא פחות". לא שאלת מאז מתי.' }],
        then: [{ e: 'wellbeing', key: 'loneliness', delta: 4 }, { e: 'presence', mode: 'inside' }, { e: 'goto', node: 'h1-out' }],
      },
      {
        lines: [{ who: 'אפי', text: 'ירדנו.' }, { who: 'פוגי', text: 'ירדנו.' }, { who: 'אפי', text: 'הקבוצה הזאת קיימת מ-1935 ואף פעם לא ירדה. ואני זוכר אותך על הגב שלי אחרי הגביע. ארבע שנים.' }],
        then: [{ e: 'rel', who: 'efi', axis: 'sharedHistory', delta: 4 }, { e: 'institution', key: 'ussishkinWound', delta: 6 }, { e: 'presence', mode: 'inside' }, { e: 'goto', node: 'h1-out' }],
      },
    ],
  },
  {
    id: 'h1-out',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'בחוץ, בפינה, סוקו רשם בפנקס. את התאריך קודם. גם את זה כותבים.' }] }],
  },
  {
    id: 'h1-bloomfield',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'שער 7. אבא, ו"טוב שבאת" בשתי מילים. המשחק היה משחק של הישרדות — לא שלהם, שלכם. כל כדור היה שאלה.' },
          { who: null, text: 'במחצית, מישהו עם טרנזיסטור מאחור: "באוסישקין נגמר. ירדו." אבא שמע. הסתכל עליך. לא אמר כלום.' },
          { who: 'קובי', text: 'היית צריך להיות שם?' },
        ],
        choices: [
          { id: 'yes', text: '"כן."', then: [{ e: 'rel', who: 'kobi', axis: 'trust', delta: 3 }, { e: 'institution', key: 'ussishkinWound', delta: 8 }, { e: 'wellbeing', key: 'regret', delta: 6 }, { e: 'presence', mode: 'heard-from-friend' }] },
          { id: 'here', text: '"הייתי צריך להיות פה."', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'redheart', key: 'familyTradition', delta: 3 }, { e: 'institution', key: 'ussishkinWound', delta: 5 }, { e: 'presence', mode: 'heard-from-friend' }] },
        ],
      },
    ],
  },
  {
    id: 'h2-corner',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'שנה. אותה פינה, אותו ריח, ארגזים אחרים. הערב, אם זה נגמר טוב, חוזרים לליגה שירדו ממנה.' },
          { who: 'שחור', text: 'עולים. אל תגיד לי "הבראנו". עולים.' },
          { who: 'לימור', text: 'שלושה עשר אנשים עבדו השנה בשביל הערב הזה. אני יודעת כי רשמתי.' },
        ],
        choices: [
          { id: 'hope', text: '"אולי הפעם זה באמת מתחיל."', then: [{ e: 'wellbeing', key: 'happiness', delta: 4 }, { e: 'institution', key: 'basketballOwnershipTrust', delta: 4 }, { e: 'goto', node: 'h2-inside' }] },
          { id: 'doubt', text: '"עלינו. זה הכל."', then: [{ e: 'rel', who: 'shachor', axis: 'trust', delta: 3 }, { e: 'personality', key: 'curiosity', delta: 1 }, { e: 'goto', node: 'h2-inside' }] },
          { id: 'tired', text: 'לשתוק. עייף.', then: [{ e: 'wellbeing', key: 'exhaustion', delta: 5 }, { e: 'goto', node: 'h2-inside' }] },
        ],
      },
    ],
  },
  {
    id: 'h2-inside',
    nameHe: null,
    branches: [
      {
        when: { flag: 'life:hall:football-night' },
        lines: [{ who: null, text: 'האולם מלא. עלו. שרו. שחור עמד לידך שנה שלמה אחרי, ולא הזכיר את הערב ההוא אף במילה. זה היה יותר גרוע מאשר אם היה מזכיר.' }, { who: null, text: '"עלינו," מישהו אמר. אף אחד לא ענה.' }],
        then: [{ e: 'flag', flag: 'h2:done' }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 4 }, { e: 'ending', id: 'football' }],
      },
      {
        lines: [{ who: null, text: 'האולם מלא. עלו. שרו. ובסוף, במקום לחגוג, אנשים התחילו לקפל כיסאות ולסחוב ארגזים, כי מחר יש עוד שנה.' }, { who: null, text: '"עלינו," מישהו אמר. אף אחד לא ענה.' }],
        then: [{ e: 'flag', flag: 'h2:done' }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 6 }, { e: 'redheart', key: 'basketballLove', delta: 3 }, { e: 'ending', id: 'hall' }],
      },
    ],
  },
]
