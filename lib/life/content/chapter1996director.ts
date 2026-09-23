import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * B6 — Director's Cut.
 *
 * The old version had the right ingredients and the wrong seam: 16.11.1996 was used as a
 * home Saturday at Bloomfield although the historical fixture was away, and Gate 5 could
 * become an objective without giving the player a clean physical action that actually
 * took them there. The corrected sequence moves the first-home-in-uniform beat to
 * 23.11.1996 and makes the terrace decision an explicit travel choice.
 *
 * No score/opponent/scorer is authored here. Those remain archive facts.
 */
export const A1 = 'life:army:d1'
export const A2 = 'life:army:d2'
export const A3 = 'life:army:d3'
export const A4 = 'life:army:d4'
export const A5 = 'life:army:d5'

export const PORTRAIT_ARMY: Record<string, string> = {
  'פוגי': 'faceHero80',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel90',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'רפי מהקיוסק': 'faceOldMan',
  'בארי': 'faceBarry',
  'אסף': 'faceAsaf',
  'מלמד': 'faceMelamed',
  'פרדי': 'faceFreddy',
  'לירון': 'faceLiron',
  'ירון': 'faceYaron',
  'המפקד': 'faceCommander',
  'נהג': 'faceDriver',
  'אוהד': 'faceSupporter',
  'חייל': 'faceSupporterB',
  'סדרן': 'faceUsher',
  'קופאית': 'faceWoman',
  'המוכר': 'faceVendor',
  'הגבר': 'faceSupporterB',
}

export function objectiveArmy(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags[A5]) return state.flags['a5:done'] ? null : 'החורף נגמר. תחליט מה לוקחים ממנו הלאה.'
  if (state.flags[A4]) return state.flags['a4:road'] ? null : 'לירון מחכה ליד הקיוסק. יש נסיעה, ויש בסיס בבוקר.'
  if (state.flags[A3]) return state.flags['a3:decided'] ? null : 'האוטובוס כבר מעלה נוסעים. לבחור עכשיו.'
  if (state.flags[A2]) {
    if (state.flags['a2:gate5-intent'] && !state.flags['a2:gate5-seen']) return 'להיכנס לשער 5. לא רק לדבר עליו.'
    if (!state.flags['a2:chose']) return 'שער 7, שער 5 — או להישאר רגע בין שניהם.'
    return null
  }
  return state.flags['a1:packed'] ? null : sceneId === 'home' ? 'לסגור את התיק. מחר בבוקר — הצבא.' : 'הערב האחרון בבית.'
}

export const ENDINGS_ARMY: Record<string, EndingCard> = {
  home: {
    id: 'home',
    titleHe: 'החורף נגמר',
    bodyHe: 'המדים נשארו, היציע השתנה, והדרך לבסיס התחילה להתחרות בדרך למשחקים. אף בחירה לא סגרה אותך בתוך מסלול אחד — היא רק נתנה לאנשים משהו לזכור.',
    memoryHe: 'טופס חופשה מקופל. בפינה, שעה שנמחקה ונכתבה מחדש.',
    memoryItem: 'folded-paper',
    presence: 'army',
  },
  road: {
    id: 'road',
    titleHe: 'הדרך חזרה',
    bodyHe: 'לילה, רדיו חלש, כביש ארוך. היציע כבר לא מקום שקובי בוחר בשבילך, והבסיס לא מקום שמחכה בסבלנות. מעכשיו כמעט לכל שבת יש מחיר.',
    memoryHe: 'קבלה מתחנת דלק. מאחור נכתב בעט: "שווה".',
    memoryItem: 'folded-paper',
    presence: 'travelling',
  },
}

const DAY = (flag: string, year: number, weekday: number, minute: number, dateHe: string) => [
  { t: 'day.entered', dayId: flag, year, weekday, minute, dateHe } as const,
  { t: 'flag.raised', flag } as const,
]

export const BEATS_ARMY: Beat[] = [
  {
    id: 'army-d1-open',
    at: 'street',
    trigger: 'enter',
    when: { none: [{ flag: A1 }] },
    delayMs: 500,
    do: [
      { a: 'flag', flag: A1 },
      { a: 'card', titleHe: '18 בנובמבר 1996', subHe: 'הערב האחרון לפני הגיוס', ms: 2100 },
      { a: 'lines', lines: [
        { who: null, text: 'אותו רחוב. אותו קיוסק. מחר בבוקר כבר יהיו לך שעות שמישהו אחר קובע.' },
        { who: null, text: 'בבית מחכה תיק פתוח. רחל כבר הכניסה לתוכו יותר גרביים ממה שאדם אחד יכול ללבוש.' },
      ] },
      { a: 'travel', to: 'home', spawn: 'start' },
    ],
  },
  {
    id: 'army-d1-home',
    at: 'home',
    trigger: 'enter',
    when: { flag: A1, none: [{ flag: 'a1:packed' }] },
    delayMs: 350,
    do: [{ a: 'talk', conversation: 'rachel-army' }],
  },
  {
    id: 'army-d1-to-gates',
    trigger: 'clock',
    when: { flag: 'a1:packed', none: [{ flag: A2 }] },
    do: [
      { a: 'card', titleHe: '23 בנובמבר 1996', subHe: 'השבת הראשונה שאתה מגיע אליה במדים', ms: 2600 },
      { a: 'events', events: DAY(A2, 1996, 6, at(14, 30), '23 בנובמבר 1996') },
      { a: 'travel', to: 'bloomfield-outside', spawn: 'start' },
    ],
  },
  {
    id: 'army-d2-open',
    at: 'bloomfield-outside',
    trigger: 'enter',
    when: { flag: A2, none: [{ flag: 'a2:seen' }] },
    delayMs: 600,
    do: [
      { a: 'flag', flag: 'a2:seen' },
      { a: 'talk', conversation: 'a2-arrive' },
    ],
  },
  {
    id: 'army-d2-gate5',
    at: 'gate5',
    trigger: 'enter',
    when: { flag: 'a2:gate5-intent', none: [{ flag: 'a2:gate5-seen' }] },
    delayMs: 350,
    do: [
      { a: 'flag', flag: 'a2:gate5-seen' },
      { a: 'talk', conversation: 'a2-gate5' },
    ],
  },
  {
    id: 'army-d2-close',
    trigger: 'clock',
    when: { all: [{ flag: A2 }, { flag: 'a2:chose' }], none: [{ flag: A3 }] },
    do: [
      { a: 'card', titleHe: 'דצמבר 1996', subHe: 'התחנה המרכזית · לפני הזריחה', ms: 2400 },
      { a: 'events', events: DAY(A3, 1996, 0, at(5, 52), 'דצמבר 1996') },
      { a: 'travel', to: 'bus-station', spawn: 'start' },
    ],
  },
  {
    id: 'army-d3-open',
    at: 'bus-station',
    trigger: 'enter',
    when: { flag: A3, none: [{ flag: 'a3:seen' }] },
    delayMs: 400,
    do: [
      { a: 'flag', flag: 'a3:seen' },
      { a: 'sfx', key: 'bus-door', level: 0.7 },
      { a: 'talk', conversation: 'a3-bus-now' },
    ],
  },
  {
    id: 'army-d3-to-winter',
    trigger: 'clock',
    when: { flag: 'a3:done', none: [{ flag: A4 }] },
    do: [
      { a: 'card', titleHe: 'חורף 1997', subHe: 'הצבא לא עוצר. גם המועדון לא.', ms: 2500 },
      { a: 'events', events: DAY(A4, 1997, 6, at(13, 0), 'חורף 1997') },
      { a: 'travel', to: 'kiosk', spawn: 'start' },
    ],
  },
  {
    id: 'army-d4-kiosk',
    at: 'kiosk',
    trigger: 'enter',
    when: { flag: A4, none: [{ flag: 'a4:drive' }, { flag: 'a4:stayed' }] },
    delayMs: 350,
    do: [{ a: 'talk', conversation: 'a4-liron' }],
  },
  {
    id: 'army-d4-road',
    at: 'route',
    trigger: 'enter',
    when: { flag: 'a4:drive', none: [{ flag: 'a4:road' }] },
    delayMs: 350,
    do: [
      { a: 'flag', flag: 'a4:road' },
      { a: 'lines', lines: [
        { who: null, text: 'האוטו של לירון רועד מעל שמונים. הרדיו תופס תחנה, מאבד אותה, ותופס אחרת.' },
        { who: 'לירון', text: 'אתה מסתכל כל הדרך על השעון. זה לא גורם לנו להגיע מהר יותר.' },
      ] },
      { a: 'events', events: DAY(A5, 1997, 2, at(19, 10), 'אביב 1997') },
      { a: 'travel', to: 'kiosk', spawn: 'start' },
    ],
  },
  {
    id: 'army-d4-stay',
    trigger: 'clock',
    when: { flag: 'a4:stayed', none: [{ flag: A5 }] },
    do: [
      { a: 'flag', flag: 'a4:road' },
      { a: 'events', events: DAY(A5, 1997, 2, at(19, 10), 'אביב 1997') },
      { a: 'travel', to: 'kiosk', spawn: 'start' },
    ],
  },
  {
    id: 'army-d5-open',
    at: 'kiosk',
    trigger: 'enter',
    when: { flag: A5, none: [{ flag: 'a5:seen' }] },
    delayMs: 450,
    do: [
      { a: 'flag', flag: 'a5:seen' },
      { a: 'talk', conversation: 'a5-close-army' },
    ],
  },
]

export const CONVERSATIONS_ARMY: Conversation[] = [
  {
    id: 'rachel-army',
    nameHe: 'רחל',
    branches: [
      {
        when: { flag: 'a1:packed' },
        lines: [{ who: 'רחל', text: 'התיק סגור. תאכל משהו. מחר כבר אף אחד שם לא ישאל אם אכלת.' }],
      },
      {
        lines: [
          { who: 'רחל', text: 'שמתי גרביים. ועוד גרביים. ואל תתחיל עם המשחקים בשבת לפני שאתה יודע איפה אתה עומד עם המפקד.' },
          { who: 'רחל', text: 'הצבא זה לא שער 7. אי אפשר פשוט להגיע כשמתחשק.' },
        ],
        choices: [
          {
            id: 'pack', text: 'לסגור את התיק ולשבת איתה עוד קצת.',
            then: [
              { e: 'flag', flag: 'a1:packed' },
              { e: 'rel', who: 'rachel', axis: 'bond', delta: 4 },
              { e: 'personality', key: 'responsibility', delta: 2 },
              { e: 'remember', who: 'rachel', eventId: 'last-night-before-army', significance: 'major' },
            ],
          },
          {
            id: 'joke', text: '"אם יתנו לי לצאת למשחק — אני מסודר."',
            then: [
              { e: 'flag', flag: 'a1:packed' },
              { e: 'rel', who: 'rachel', axis: 'tension', delta: 2 },
              { e: 'redheart', key: 'footballLove', delta: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ofir-army',
    nameHe: 'אופיר',
    branches: [{
      lines: [
        { who: 'אופיר', text: 'יש ליד שער 5 חבר\'ה צעירים. פחות עומדים ומסתכלים, יותר עושים רעש ודברים בעצמם.' },
        { who: 'אופיר', text: 'אבא שלך בטח יגיד שזה שטויות. בגלל זה כדאי לפחות לראות בעיניים.' },
      ],
      then: [{ e: 'flag', flag: 'knows:gate5' }, { e: 'redheart', key: 'terraceCulture', delta: 1 }],
    }],
  },
  {
    id: 'a2-arrive',
    nameHe: null,
    branches: [{
      lines: [
        { who: null, text: 'בלומפילד. מדים על הגוף. קובי הולך כמעט אוטומטית לכיוון המקום שהוא מכיר.' },
        { who: null, text: 'מהצד השני שומעים תוף וקול צעיר יותר. בפעם הראשונה שתי הדרכים נמצאות מולך באותו רגע.' },
      ],
      choices: [
        {
          id: 'gate7', text: 'ללכת עם קובי. שער 7.',
          then: [
            { e: 'gate', to: 'gate7', reason: 'family' },
            { e: 'flag', flag: 'a2:chose' },
            { e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 4 },
            { e: 'remember', who: 'kobi', eventId: 'chose-gate7-in-uniform', significance: 'notable' },
          ],
        },
        {
          id: 'gate5', text: 'ללכת לראות בעצמך מה קורה בשער 5.',
          then: [
            { e: 'flag', flag: 'a2:gate5-intent' },
            { e: 'gate', to: 'gate5', reason: 'culture' },
            { e: 'rel', who: 'kobi', axis: 'distance', delta: 2 },
            { e: 'travel', to: 'gate5', spawn: 'start' },
          ],
        },
        {
          id: 'between', text: 'להישאר בחוץ עוד רגע. לא לבחור בשביל שמישהו אחר יהיה רגוע.',
          then: [
            { e: 'gate', to: 'between', reason: 'conflict' },
            { e: 'flag', flag: 'a2:chose' },
            { e: 'personality', key: 'independence', delta: 2 },
          ],
        },
      ],
    }],
  },
  {
    id: 'a2-gate5',
    nameHe: 'אסף',
    branches: [{
      lines: [
        { who: null, text: 'מתחת ליציע יש פחות מקום ממה שדמיינת. בד מקופל, תוף, כמה אנשים שמכירים אחד את השני בשם.' },
        { who: 'אסף', text: 'אם באת רק לראות — תראה. אם אתה נשאר, תזיז את התיק מהמעבר.' },
        { who: 'מלמד', text: 'עזוב אותו. פעם ראשונה. גם אנחנו היינו פעם ראשונה.' },
      ],
      choices: [
        {
          id: 'stay', text: 'להישאר כאן הערב.',
          then: [
            { e: 'flag', flag: 'a2:chose' },
            { e: 'redheart', key: 'terraceCulture', delta: 5 },
            { e: 'rel', who: 'asaf', axis: 'familiarity', delta: 4 },
            { e: 'remember', who: 'asaf', eventId: 'first-night-gate5', significance: 'major' },
          ],
        },
        {
          id: 'back', text: 'ראיתי. לחזור לכיוון קובי לפני שזה נהיה ריב.',
          then: [
            { e: 'gate', to: 'between', reason: 'family' },
            { e: 'flag', flag: 'a2:chose' },
            { e: 'redheart', key: 'terraceCulture', delta: 2 },
            { e: 'travel', to: 'bloomfield-outside', spawn: 'start' },
          ],
        },
      ],
    }],
  },
  {
    id: 'a3-bus-now',
    nameHe: 'נהג',
    branches: [{
      lines: [
        { who: null, text: 'האוטובוס כבר ברציף. הדלת פתוחה. אם תעלה עכשיו — תגיע בזמן.' },
        { who: null, text: 'על הצדדים שלו עדיין נשארו סימנים מימי משחק. אתה יודע בדיוק של מי.' },
        { who: 'נהג', text: 'עולה או לא? אני סוגר.' },
      ],
      choices: [
        {
          id: 'board', text: 'לעלות. הבסיס קודם הפעם.',
          then: [
            { e: 'flag', flag: 'a3:decided' }, { e: 'flag', flag: 'a3:done' },
            { e: 'armyRoute', route: 'trusted' },
            { e: 'army', key: 'commanderTrust', delta: 5 },
            { e: 'personality', key: 'reliability', delta: 2 },
          ],
        },
        {
          id: 'refuse', text: 'לא לעלות. למצוא דרך אחרת, גם אם תאחר.',
          then: [
            { e: 'flag', flag: 'a3:decided' }, { e: 'flag', flag: 'a3:done' }, { e: 'flag', flag: 'life:army:refused-bus' },
            { e: 'armyRoute', route: 'punished' },
            { e: 'army', key: 'commanderTrust', delta: -12 },
            { e: 'army', key: 'leaveDebt', delta: 120 },
            { e: 'redheart', key: 'terraceCulture', delta: 3 },
            { e: 'remember', who: 'kobi', eventId: 'refused-bus-to-base', significance: 'major' },
            { e: 'toast', text: 'שעתיים אחר כך, בשער הבסיס, הסיפור כבר נשמע פחות מצחיק.', tone: 'red' },
          ],
        },
        {
          id: 'hesitate', text: 'לעמוד עוד עשר שניות ולהפסיד אותו.',
          then: [
            { e: 'flag', flag: 'a3:decided' }, { e: 'flag', flag: 'a3:done' },
            { e: 'armyRoute', route: 'negotiator' },
            { e: 'army', key: 'commanderTrust', delta: -6 },
            { e: 'wellbeing', key: 'stress', delta: 5 },
          ],
        },
      ],
    }],
  },
  {
    id: 'a4-liron',
    nameHe: 'לירון',
    branches: [{
      lines: [
        { who: 'לירון', text: 'יש מקום באוטו. אין הרבה דלק, אין הרבה זמן, ויש לך בסיס בבוקר. מושלם.' },
        { who: 'רפי מהקיוסק', text: 'מושלם למי שאין לו שכל.' },
      ],
      choices: [
        {
          id: 'drive', text: 'לנסוע. את הבוקר נפתור בבוקר.',
          then: [
            { e: 'flag', flag: 'a4:drive' },
            { e: 'army', key: 'fatigue', delta: 10 },
            { e: 'redheart', key: 'travelDrive', delta: 5 },
            { e: 'travel', to: 'route', spawn: 'start' },
          ],
        },
        {
          id: 'stay', text: 'להישאר. פעם אחת לא להסתבך.',
          then: [
            { e: 'flag', flag: 'a4:stayed' },
            { e: 'army', key: 'commanderTrust', delta: 3 },
            { e: 'personality', key: 'responsibility', delta: 2 },
          ],
        },
      ],
    }],
  },
  {
    id: 'a5-close-army',
    nameHe: 'רפי מהקיוסק',
    branches: [{
      lines: [
        { who: 'רפי מהקיוסק', text: 'אז מה למדת בצבא?' },
        { who: 'פוגי', text: 'שהכול רחוק יותר ממה שנראה במפה.' },
        { who: 'רפי מהקיוסק', text: 'יפה. עכשיו תלמד שזה נכון גם לגבי מועדון.' },
      ],
      choices: [
        {
          id: 'road', text: 'להסתכל על הכביש. "עוד לא סיימתי לנסוע."',
          then: [
            { e: 'flag', flag: 'a5:done' },
            { e: 'redheart', key: 'travelDrive', delta: 2 },
            { e: 'ending', id: 'road' },
          ],
        },
        {
          id: 'home', text: 'להסתכל לכיוון הבית. "מספיק להיום."',
          then: [
            { e: 'flag', flag: 'a5:done' },
            { e: 'redheart', key: 'familyTradition', delta: 2 },
            { e: 'ending', id: 'home' },
          ],
        },
      ],
    }],
  },
  // Compatibility ids used by old actors/hotspots in this era. They all lead back into
  // the Director's Cut instead of failing because an older scene still points at them.
  { id: 'kobi-army', nameHe: 'קובי', branches: [{ lines: [{ who: 'קובי', text: 'מדים זה מדים. במשחק אתה עדיין עומד לידי רק אם אתה רוצה.' }] }] },
  { id: 'a3-left-behind', nameHe: null, branches: [{ lines: [{ who: null, text: 'האוטובוס נסגר ויוצא. הפעם ההיסוס עצמו היה הבחירה.' }], then: [{ e: 'flag', flag: 'a3:decided' }, { e: 'flag', flag: 'a3:done' }] }] },
]
