import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * B5 · "המספר שבע על הקיר" · 1994–1995 — the childhood hero becomes the decade's most
 * personal argument. Two evenings, a year apart: the night of a cup final lost to the
 * neighbours (June 1994), when a boy defends the man on his wall and it is reasonable to;
 * and a night in August 1995, after a European trip nobody talks about, when the facts
 * pile up on the kiosk counter and defending starts to cost him people.
 *
 * The arc is defence → doubt; the rupture belongs to the winter of 1996 (B6). Nothing here
 * says a score or a name of an opponent. Sinai is a name — the man on the poster — and
 * the rule of this chapter is that the love for the player is never made foolish.
 */

export const S1 = 'life:sinai:d1'
export const S2 = 'life:sinai:d2'

export const PORTRAIT_SINAI: Record<string, string> = {
  'פוגי': 'faceHero80',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel90',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'רפי מהקיוסק': 'faceOldMan',
  'בארי': 'faceOldMan',
  'פרדי': 'faceFan',
  'אוהד צעיר': 'faceFan',
  'אוהד': 'faceFan',
}

export function objectiveSinai(state: LifeState): string | null {
  if (state.chapterDone) return null
  if (state.flags[S2]) return state.flags['s2:done'] ? null : 'הקיוסק. העובדות על הדלפק.'
  if (state.flags['s1:argued']) return 'הביתה. הפוסטר על הקיר.'
  if (state.flags['s1:heard']) return 'הקיוסק. כולם מדברים.'
  return 'ערב גמר. הרדיו אצל רפי.'
}

export const ENDINGS_SINAI: Record<string, EndingCard> = {
  defending: {
    id: 'defending',
    titleHe: 'המספר שבע נשאר על הקיר',
    bodyHe:
      'שנה אחת, שני ערבים, והפוסטר עדיין תלוי. הגנת עליו כשזה היה קל, והגנת עליו כשזה כבר עלה לך בחברים. אבא מבין. אופיר פחות. בלילה אתה מסתכל על הפוסטר ויודע שאתה לא מגן על מאמן — אתה מגן על ילד בן שמונה על כתפיים.',
    memoryHe: 'הפוסטר. אותו פוסטר, אותו מסמר, אותו קיר.',
    memoryItem: 'clipping',
    presence: 'radio',
  },
  doubting: {
    id: 'doubting',
    titleHe: 'הפוסטר מקופל',
    bodyHe:
      'לא זרקת. קיפלת. שמת במגירה עם דברים שלא זורקים. יש הבדל בין להפסיק להאמין למישהו ולהפסיק לאהוב אותו, ובגיל שבע־עשרה מצאת אותו לבד, בלילה, עם נעץ ביד.',
    memoryHe: 'הפוסטר, מקופל לארבע, במגירה. הפינות שלו כבר לא ישרות לעולם.',
    memoryItem: 'clipping',
    presence: 'radio',
  },
  torn: {
    id: 'torn',
    titleHe: 'הקיר ריק',
    bodyHe:
      'הורדת. מהר, כדי שלא תספיק לחשוב. על הקיר נשאר ריבוע בהיר בצורת פוסטר, ואמא שאלה למחרת אם אתה בסדר. אמרת שכן. הריבוע הבהיר נשאר שם שנים.',
    memoryHe: 'ריבוע בהיר על קיר. אין חפץ. יש צורה.',
    memoryItem: 'folded-paper',
    presence: 'radio',
  },
}

const DAY = (flag: string, year: number, weekday: number, minute: number, dateHe?: string) =>
  [{ t: 'day.entered', dayId: flag, year, weekday, minute, ...(dateHe ? { dateHe } : {}) } as const, { t: 'flag.raised', flag } as const]

export const BEATS_SINAI: Beat[] = [
  {
    id: 's1-open',
    at: 'kiosk',
    trigger: 'enter',
    when: { none: [{ flag: S2 }, { flag: 's1:heard' }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: S1 },
      { a: 'lines', lines: [{ who: null, text: 'יוני. ערב גמר גביע, נגד השכנים, באצטדיון הגדול בצד השני של העיר. אין כרטיס, אין כסף לכרטיס, ויש רדיו על הדלפק של רפי.' }, { who: null, text: 'שש־עשרה. הפוסטר של מספר שבע עדיין תלוי מעל המיטה מגיל שמונה. הוא כבר לא שחקן. הוא המאמן.' }] },
      { a: 'sound', kind: 'radio', on: true },
      { a: 'talk', conversation: 's1-radio' },
      { a: 'sound', kind: 'radio', on: false },
    ],
  },
  {
    id: 's1-to-home',
    trigger: 'clock',
    when: { flag: 's1:argued', none: [{ flag: S2 }] },
    do: [{ a: 'card', titleHe: 'בלילה', subHe: 'החדר', ms: 2000 }, { a: 'travel', to: 'bedroom', spawn: 'start' }],
  },
  {
    id: 's1-poster',
    at: 'bedroom',
    trigger: 'enter',
    when: { flag: 's1:argued', none: [{ flag: S2 }] },
    delayMs: 800,
    do: [
      { a: 'talk', conversation: 'poster-1994' },
      { a: 'events', events: DAY(S2, 1995, 2, at(19, 0), 'סתיו 1995') },
      { a: 'card', titleHe: '1995', subHe: 'אוגוסט. שנה אחרי.', ms: 2600, art: 'plate-1995-sinai' },
      { a: 'travel', to: 'kiosk', spawn: 'start' },
    ],
  },
  {
    id: 's2-open',
    at: 'kiosk',
    trigger: 'enter',
    when: { flag: S2, none: [{ flag: 's2:done' }] },
    delayMs: 700,
    do: [
      { a: 'lines', lines: [{ who: null, text: 'שנה אחרי. שבע־עשרה. עונה שלמה של "עוד לא" ו"בשבוע הבא", ואז נסיעה לאירופה שחזרו ממנה מהר.' }, { who: null, text: 'הקיוסק הפך לבית משפט. רפי מוכר, ובין קפה לקפה פוסק.' }] },
      { a: 'talk', conversation: 's2-court' },
    ],
  },
]

export const CONVERSATIONS_SINAI: Conversation[] = [
  { id: 'rafi-sinai', nameHe: 'רפי מהקיוסק', branches: [
    { when: { flag: S2 }, lines: [{ who: 'רפי מהקיוסק', text: 'שוב בית משפט אצלי. תשתה משהו לפחות.' }] },
    { when: { flag: 's1:heard' }, lines: [{ who: 'רפי מהקיוסק', text: 'מה שנאמר פה — נאמר פה. אני לא מספר לאבא שלך.' }] },
    { lines: [{ who: 'רפי מהקיוסק', text: 'הרדיו על הדלפק, כמו תמיד. בשבע מתחילים.' }] },
  ] },
  { id: 'ofir-sinai', nameHe: 'אופיר', branches: [
    { when: { sinaiIs: 'defending', flag: S2 }, lines: [{ who: 'אופיר', text: 'אתה עדיין שם. בסדר. רק תדע שאתה שם לבד.' }] },
    { when: { flag: S2 }, lines: [{ who: 'אופיר', text: 'טוב שהתעוררת. לא כיף, אבל טוב.' }] },
    { lines: [{ who: 'אופיר', text: 'גרעינים? קח. הערב נצטרך.' }] },
  ] },
  { id: 'amit-sinai', nameHe: 'עמית', branches: [{ lines: [{ who: 'עמית', text: 'אני לא אומר כלום. העיתון אומר. תקרא.' }] }] },
  { id: 'freddy-sinai', nameHe: 'פרדי', branches: [{ lines: [{ who: 'פרדי', text: 'השאלה היא אף פעם לא "מי אשם". השאלה היא "מי מחליט". תזכור את זה, יהיה לך שימושי.' }], then: [{ e: 'institution', key: 'legalUnderstanding', delta: 2 }] }] },
  { id: 'poster-look', nameHe: null, branches: [
    { when: { flag: 'life:poster:gone' }, lines: [{ who: null, text: 'ריבוע בהיר על הקיר.' }] },
    { when: { flag: 'life:poster:drawer' }, lines: [{ who: null, text: 'הקיר. הפוסטר במגירה. אתה יודע בדיוק איפה.' }] },
    { lines: [{ who: null, text: 'מספר שבע. מחייך. מגיל שמונה.' }] },
  ] },
  {
    id: 's1-radio',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הרדיו על הדלפק. רפי מגביר, מנמיך, מגביר. אופיר בפינה עם גרעינים. בחור צעיר שלא הכרת עומד ליד הדלת ומקלל בשקט.' },
          { who: null, text: 'זה נגמר כמו שזה נגמר. הרדיו אמר את זה בנימוס. הבחור ליד הדלת לא.' },
          { who: 'אוהד צעיר', text: 'שבע! מספר שבע הזה. כשהוא שיחק היה שחקן, עכשיו הוא שום דבר. שיילך.' },
          { who: null, text: 'אופיר הנהן. רפי שתק. כולם הסתכלו עליך, כי כולם יודעים מה תלוי לך מעל המיטה.' },
        ],
        choices: [
          {
            id: 'defend',
            text: '"אתה לא יודע מה הוא נתן לקבוצה הזאת."',
            then: [{ e: 'flag', flag: 's1:argued' }, { e: 'flag', flag: 's1:heard' }, { e: 'sinai', stance: 'defending' }, { e: 'rel', who: 'ofir', axis: 'tension', delta: 4 }, { e: 'redheart', key: 'loyaltyReturn', delta: 4 }, { e: 'personality', key: 'courage', delta: 2 }, { e: 'goto', node: 's1-after' }],
          },
          {
            id: 'quiet',
            text: 'לשתוק. לא הערב.',
            then: [{ e: 'flag', flag: 's1:argued' }, { e: 'flag', flag: 's1:heard' }, { e: 'personality', key: 'reliability', delta: 1 }, { e: 'wellbeing', key: 'stress', delta: 3 }, { e: 'goto', node: 's1-after' }],
          },
          {
            id: 'agree',
            text: '"אולי הוא צודק."',
            then: [{ e: 'flag', flag: 's1:argued' }, { e: 'flag', flag: 's1:heard' }, { e: 'sinai', stance: 'doubting' }, { e: 'rel', who: 'ofir', axis: 'bond', delta: 2 }, { e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'goto', node: 's1-after' }],
          },
        ],
      },
    ],
  },
  {
    id: 's1-after',
    nameHe: null,
    branches: [
      {
        when: { sinaiIs: 'defending' },
        lines: [
          { who: null, text: 'הבחור ליד הדלת צחק. אופיר לא. רפי הגיש לך קפה שלא ביקשת.' },
          { who: 'רפי מהקיוסק', text: 'אבא שלך היה אומר אותו דבר. בדיוק אותו דבר. עם אותו פרצוף.' },
          { who: null, text: 'זו הייתה מחמאה. זו גם הייתה אזהרה.' },
        ],
        then: [{ e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 3 }],
      },
      {
        lines: [
          { who: null, text: 'הבחור ליד הדלת יצא. אופיר קם אחריו. רפי כיבה את הרדיו ואמר "ערב טוב" בקול של סוף משמרת.' },
          { who: null, text: 'הלכת הביתה עם משהו שלא אמרת, וזה שוקל יותר ממשהו שאמרת.' },
        ],
      },
    ],
  },
  {
    id: 'poster-1994',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'החדר. הפוסטר מעל המיטה, מגיל שמונה. הוא מחייך שם, צעיר, עם כדור, בחולצה שאין כבר.' },
          { who: null, text: 'מהסלון: אבא ואמא, בקול נמוך. שמעת את השם שלו פעם אחת.' },
        ],
        choices: [
          { id: 'look', text: 'להסתכל עליו רגע ולכבות את האור.', then: [{ e: 'redheart', key: 'historyMemory', delta: 2 }, { e: 'toast', text: 'בחושך הוא עדיין מחייך. זה מה שפוסטרים עושים.', tone: 'plain' }] },
          { id: 'kobi', text: 'לצאת לסלון. לשאול את אבא מה הוא חושב.', then: [{ e: 'goto', node: 'kobi-sinai-1994' }] },
        ],
      },
    ],
  },
  {
    id: 'kobi-sinai-1994',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'קובי', text: 'מה אני חושב.' },
          { who: 'קובי', text: 'אני חושב שראיתי אותו משחק כשאתה היית על הכתפיים שלי. ואני חושב שהערב הוא היה מאמן גרוע.' },
          { who: 'קובי', text: 'שני הדברים. באותו ראש. תתרגל, זה החיים.' },
        ],
        then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 4 }, { e: 'remember', who: 'kobi', eventId: 'two-things-one-head-1994', significance: 'notable' }, { e: 'redheart', key: 'familyTradition', delta: 2 }],
      },
    ],
  },
  {
    id: 's2-court',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'אני לא אומר כלום. אני רק שם עובדות על הדלפק. עונה שלמה. תסתכל בעצמך.' },
          { who: null, text: 'עמית מניח עיתון מקופל. הטבלה בו לא צריכה הסבר.' },
          { who: 'פרדי', text: 'עובדות זה יפה. אבל תשאלו את השאלה הנכונה: מי נתן לו את התפקיד, ומי משאיר אותו בו? המאמן הוא לא הבעיה. המאמן הוא הכיסוי.' },
          { who: null, text: 'פרדי. עורך דין, בחליפה, בקיוסק. מדבר במשפטים שיש להם סעיפים.' },
          { who: 'אוהד צעיר', text: 'כיסוי־שמיסוי. שיילך.' },
        ],
        choices: [
          { id: 'cut', text: 'לקטוע את פרדי: "מה השורה התחתונה?"', then: [{ e: 'institution', key: 'legalUnderstanding', delta: 3 }, { e: 'rel', who: 'freddy', axis: 'familiarity', delta: 4 }, { e: 'goto', node: 's2-verdict' }] },
          { id: 'listen', text: 'לתת לו לסיים.', then: [{ e: 'institution', key: 'legalUnderstanding', delta: 6 }, { e: 'personality', key: 'curiosity', delta: 2 }, { e: 'time', minutes: 20 }, { e: 'goto', node: 's2-verdict' }] },
          { id: 'defend', text: '"תנו לו עוד עונה. הוא מגיע לו."', then: [{ e: 'sinai', stance: 'defending' }, { e: 'rel', who: 'ofir', axis: 'tension', delta: 5 }, { e: 'rel', who: 'amit', axis: 'tension', delta: 3 }, { e: 'wellbeing', key: 'loneliness', delta: 6 }, { e: 'redheart', key: 'loyaltyReturn', delta: 4 }, { e: 'goto', node: 's2-verdict' }] },
        ],
      },
    ],
  },
  {
    id: 's2-verdict',
    nameHe: null,
    branches: [
      {
        when: { sinaiIs: 'defending' },
        lines: [
          { who: null, text: 'הקיוסק התפזר. אופיר יצא בלי להגיד לילה טוב. עמית נשאר לרגע, ואז גם.' },
          { who: null, text: 'רפי: "אתה יודע שאתה לבד בזה." אמרת שכן. הוא הנהן. "גם אבא שלך היה."' },
        ],
        then: [{ e: 'flag', flag: 's2:done' }, { e: 'goto', node: 's2-poster' }],
      },
      {
        lines: [
          { who: null, text: 'שאלת את עצמך, בפעם הראשונה, בקול שקט מאוד: אולי.' },
          { who: null, text: 'זה לא הרגיש כמו בגידה. זה הרגיש כמו לגדול. ולא אהבת את זה.' },
        ],
        then: [{ e: 'sinai', stance: 'doubting' }, { e: 'flag', flag: 's2:done' }, { e: 'wellbeing', key: 'regret', delta: 4 }, { e: 'goto', node: 's2-poster' }],
      },
    ],
  },
  {
    id: 's2-poster',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'בלילה, בחדר. הפוסטר. מה עושים איתו.' }],
        choices: [
          { id: 'keep', text: 'משאיר. על הקיר.', then: [{ e: 'flag', flag: 'life:poster:wall' }, { e: 'redheart', key: 'loyaltyReturn', delta: 3 }, { e: 'ending', id: 'defending' }] },
          { id: 'fold', text: 'מקפל. למגירה.', then: [{ e: 'flag', flag: 'life:poster:drawer' }, { e: 'redheart', key: 'historyMemory', delta: 3 }, { e: 'ending', id: 'doubting' }] },
          { id: 'tear', text: 'מוריד.', then: [{ e: 'flag', flag: 'life:poster:gone' }, { e: 'personality', key: 'impulsiveness', delta: 3 }, { e: 'wellbeing', key: 'regret', delta: 5 }, { e: 'ending', id: 'torn' }] },
        ],
      },
    ],
  },
]
