import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * B9 · "זה לא נגמר כשעולים" · 1998/99 — the second relegation, and the seed.
 *
 * One long evening at Ussishkin and the kiosk after it: the hall goes down again, a
 * year after coming back; Shachor and Limor turn grief into a list; Freddy talks about
 * structures without a lecture; Soko keeps the record; and a young man writes the first
 * list of his own — people, resources, principles — which is the prehistory of something
 * this stage does not found. At the kiosk, the Gate 5 people: organisation is work before
 * it is iconography. Eisenberg is an "enemy" only in the mouths of supporters.
 */

export const PORTRAIT_SEED: Record<string, string> = {
  'פוגי': 'faceHero80',
  'שחור': 'faceFan',
  'לימור': 'faceFan',
  'פרדי': 'faceFan',
  'סוקו': 'faceFan',
  'אסף': 'faceFan',
  'מלמד': 'faceFan',
  'מישל': 'faceFan',
  'דודו': 'faceFan',
  'עומר': 'faceFan',
  'רפי מהקיוסק': 'faceOldMan',
  'אוהד': 'faceFan',
}

export function objectiveSeed(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['seed:list']) return null
  if (state.flags['seed:hall']) return sceneId === 'kiosk' ? null : 'הקיוסק. שער 5 מחכה.'
  return 'ערב ירידה. שוב. האולם.'
}

export const ENDINGS_SEED: Record<string, EndingCard> = {
  list: {
    id: 'list',
    titleHe: 'הרשימה הראשונה',
    bodyHe:
      'ירדו שוב, ובמקום לשבור משהו כתבת דף. שמות. מה יש. מה חסר. מה לא מוכנים לוותר עליו. לא ידעת בשביל מה. סוקו אמר "תשמור". שמרת. הדף הזה ישן כבר שנים במגירה לפני שמישהו יקרא אותו בקול.',
    memoryHe: 'דף משבצות, שלוש כותרות, כתב יד רועד בשורה הראשונה ויציב בשלישית.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  anger: {
    id: 'anger',
    titleHe: 'רק כעס',
    bodyHe:
      'ירדו שוב, וכעסת. על הבעלים, על השופטים, על מי שלא בא. כעס זה אמיתי וזה גם קל. סוקו הציע דף. לא לקחת. שנים אחר כך תחפש את הדף הזה ולא תמצא, כי לא כתבת אותו.',
    memoryHe: 'כרטיס מהערב. קרוע לשניים בכוונה.',
    memoryItem: 'hall-ticket',
    presence: 'inside',
  },
}

export const BEATS_SEED: Beat[] = [
  {
    id: 'seed-open',
    at: 'ussishkin-outside',
    trigger: 'enter',
    when: { none: [{ flag: 'seed:opened' }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: 'seed:opened' },
      { a: 'events', events: [{ t: 'money.changed', agorot: 5000, why: 'משכורת ראשונה' }] },
      { a: 'lines', lines: [{ who: null, text: 'עשרים ואחת. אחרי הצבא. עבודה בבוקר, אולם בערב. והאולם — שוב בערב האחרון של עונה שנגמרת רע.' }, { who: null, text: 'שנה אחרי שעלו. אף אחד לא אמר "הבראנו". צדקו.' }] },
      { a: 'talk', conversation: 'seed-corner' },
    ],
  },
  {
    id: 'seed-hall',
    at: 'ussishkin-hall',
    trigger: 'enter',
    when: { flag: 'seed:opened', none: [{ flag: 'seed:hall' }] },
    delayMs: 900,
    do: [
      { a: 'card', titleHe: 'הערב האחרון', subHe: 'שוב', ms: 2200 },
      { a: 'talk', conversation: 'seed-inside' },
      { a: 'flag', flag: 'seed:hall' },
      { a: 'toast', text: 'הקיוסק. אסף אמר שיהיו שם.', tone: 'plain' },
    ],
  },
  {
    id: 'seed-kiosk',
    at: 'kiosk',
    trigger: 'enter',
    when: { flag: 'seed:hall', none: [{ flag: 'seed:list' }] },
    delayMs: 800,
    do: [{ a: 'talk', conversation: 'seed-gate5' }],
  },
]

export const CONVERSATIONS_SEED: Conversation[] = [
  {
    id: 'seed-corner',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: 'לימור', text: 'תור. קופה. סדרן שלא שילמו לו. אני עושה את הסדרן הערב. אתה עושה את התור.' },
          { who: 'שחור', text: 'ומי שמדבר על הבעלים — שידבר אחרי. הערב עובדים.' },
          { who: 'אוהד', text: 'הבעלים הזה הורג את המועדון!' },
          { who: 'שחור', text: 'אחרי.' },
        ],
        choices: [
          { id: 'work', text: 'לעשות את התור.', then: [{ e: 'rel', who: 'crowd-limor', axis: 'trust', delta: 5 }, { e: 'rel', who: 'shachor', axis: 'bond', delta: 3 }, { e: 'personality', key: 'responsibility', delta: 3 }, { e: 'energy', delta: -8 }, { e: 'flag', flag: 'seed:worked' }] },
          { id: 'owner', text: '"הוא באמת הורג את המועדון."', then: [{ e: 'institution', key: 'basketballOwnershipTrust', delta: -10 }, { e: 'institution', key: 'protestEscalation', delta: 4 }, { e: 'rel', who: 'shachor', axis: 'tension', delta: 3 }, { e: 'toast', text: '"אחרי," שחור חזר. לא הסתכל עליך.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'seed-inside',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'האולם. פחות אנשים מבפעם הקודמת, ויותר שקט — שקט של אנשים שכבר יודעים איך זה נגמר ובאו בכל זאת.' },
          { who: null, text: 'זה נגמר כמו שידעו. הצפירה לא הפתיעה אף אחד. זה מה שהיה נורא.' },
          { who: 'סוקו', text: 'פעם שנייה בשלוש שנים. אני רושם את התאריך ליד הקודם. הם ייראו כמו זוג.' },
        ],
        choices: [
          { id: 'why', text: '"למה אתה עוד רושם?"', then: [{ e: 'rel', who: 'soko', axis: 'bond', delta: 3 }, { e: 'redheart', key: 'historyMemory', delta: 3 }, { e: 'toast', text: '"כי יום אחד מישהו ישאל מה היה. ואני לא רוצה שהתשובה תהיה \'לא זוכר\'."', tone: 'plain' }] },
          { id: 'help', text: '"תן, אני אכתוב את הערב."', then: [{ e: 'rel', who: 'soko', axis: 'trust', delta: 5 }, { e: 'remember', who: 'soko', eventId: 'wrote-the-night-1999', significance: 'notable' }, { e: 'redheart', key: 'historyMemory', delta: 5 }, { e: 'flag', flag: 'seed:wrote' }] },
        ],
      },
    ],
  },
  {
    id: 'seed-gate5',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הקיוסק בלילה. רפי השאיר פתוח. אסף על ארגז הפוך, מלמד עם הדרבוקה, בחור עם מפתחות של מיניבוס (מישל), אחד גדול ורועש (דודו), ואחד עם תקליט מתחת לבית השחי (עומר).' },
          { who: 'אסף', text: 'הכדורגל בסדר. יש לו מי שידאג. האולם — ירד פעמיים. אז השאלה היא לא "מי אשם". השאלה היא: אם היינו צריכים לעשות את זה בעצמנו — מה היינו צריכים?' },
          { who: 'פרדי', text: 'מבנה. לא כעס. אנשים, תפקידים, כסף שיודעים מאיפה הוא בא. זה משעמם. הדברים שמחזיקים תמיד משעממים.' },
          { who: 'מישל', text: 'מיניבוס. אני יכול להשיג מיניבוס לכל משחק חוץ. זה לא כסף, זה אנשים שמכירים אנשים.' },
          { who: 'דודו', text: 'ואני מביא רעש! (כולם צוחקים.) מה? רעש זה חשוב!' },
          { who: 'עומר', text: 'ומוזיקה. אם כבר עושים משהו, שיהיה עם מוזיקה טובה.' },
          { who: 'מלמד', text: '(דרבוקה, שלוש מכות, הפסקה, שתיים.) זוכר? מ-96. אתה בחרת את הקצב הזה.' },
        ],
        choices: [
          { id: 'list', text: 'לקחת דף. "אז נכתוב: אנשים. מה יש. מה לא מוותרים עליו."', then: [{ e: 'flag', flag: 'seed:list' }, { e: 'flag', flag: 'life:seed:list' }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 14 }, { e: 'redheart', key: 'community', delta: 6 }, { e: 'rel', who: 'asaf', axis: 'trust', delta: 5 }, { e: 'rel', who: 'freddy', axis: 'trust', delta: 4 }, { e: 'personality', key: 'responsibility', delta: 3 }, { e: 'goto', node: 'seed-close' }] },
          { id: 'anger', text: '"מה שצריך זה שהבעלים ילך."', then: [{ e: 'flag', flag: 'seed:list' }, { e: 'institution', key: 'protestEscalation', delta: 6 }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 2 }, { e: 'rel', who: 'freddy', axis: 'tension', delta: 4 }, { e: 'goto', node: 'seed-close' }] },
          { id: 'rhythm', text: 'לענות למלמד. אותו קצב.', when: { flag: 'life:melamed:rhythm' }, noteHe: 'לא למדת את הקצב שלו ב־96. אין לך מה לענות.', then: [{ e: 'sfx', key: 'darbuka-three-two', level: 0.8 }, { e: 'sfx', key: 'crowd-claps', level: 0.5, delayMs: 1700 }, { e: 'rel', who: 'melamed', axis: 'bond', delta: 6 }, { e: 'remember', who: 'melamed', eventId: 'rhythm-returned-1999', significance: 'major' }, { e: 'redheart', key: 'terraceCulture', delta: 5 }, { e: 'toast', text: 'שלוש, הפסקה, שתיים. כל הקיוסק הצטרף. ככה מתחיל שיר.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'seed-close',
    nameHe: null,
    branches: [
      { when: { flag: 'life:seed:list' }, lines: [{ who: null, text: 'שלוש כותרות על דף משבצות. סוקו אמר "תשמור". שמרת.' }], then: [{ e: 'presence', mode: 'inside' }, { e: 'ending', id: 'list' }] },
      { lines: [{ who: null, text: 'סוקו הציע דף. לא לקחת. הלכת הביתה עם הכעס, שהיה חם ונוח כמו מעיל.' }], then: [{ e: 'presence', mode: 'inside' }, { e: 'ending', id: 'anger' }] },
    ],
  },
]
