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
export const S3 = 'life:sinai:d3'

export const PORTRAIT_SINAI: Record<string, string> = {
  'פוגי': 'faceHero80',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel90',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'רפי מהקיוסק': 'faceOldMan',
  'בארי': 'faceBarry',
  'פרדי': 'faceFreddy',
  'אוהד צעיר': 'faceYoung',
  'אוהד': 'faceSupporter',
}

export function objectiveSinai(state: LifeState): string | null {
  if (state.chapterDone) return null
  if (state.flags[S3]) return null
  if (state.flags['s2:done']) return 'החדר. הקיר.'
  if (state.flags[S2]) return 'הקיוסק. העובדות על הדלפק.'
  if (state.flags['s1:argued']) return 'הביתה. הפוסטר על הקיר.'
  if (state.flags['s1:heard']) return 'הקיוסק. כולם מדברים.'
  return 'ערב גמר. הרדיו אצל רפי.'
}

export const ENDINGS_SINAI: Record<string, EndingCard> = {
  defending: {
    id: 'defending',
    titleHe: 'המספר שבע נשאר על הקיר',
    bodyHe:
      'שנה, שני ערבים, ואותו מסמר. הגנת עליו כשזה היה קל, והגנת עליו כשזה כבר עלה לך באופיר. אבא הבין. אופיר לא. בלילה, לפני שכיבית את האור, חשבת על הכדור הקטן שהוא נתן בדקה שמונים ושש — ועל זה שהוא בכלל לא הבקיע אותו.',
    memoryHe: 'הפוסטר. אותו מסמר, אותו קיר, ופינה אחת שכבר לא מתיישרת.',
    memoryItem: 'clipping',
    presence: 'radio',
  },
  doubting: {
    id: 'doubting',
    titleHe: 'הפוסטר מקופל',
    bodyHe:
      'לא זרקת. קיפלת. שמת במגירה עם הדברים שלא זורקים. יש הבדל בין להפסיק להאמין למישהו ובין להפסיק לאהוב אותו, ובגיל שבע־עשרה מצאת אותו לבד, בלילה, עם נעץ בין האצבעות.',
    memoryHe: 'הפוסטר, מקופל לארבע, במגירה. הקפל עובר לו בדיוק על הפנים.',
    memoryItem: 'clipping',
    presence: 'radio',
  },
  torn: {
    id: 'torn',
    titleHe: 'הקיר ריק',
    bodyHe:
      'הורדת. מהר, כדי שלא תספיק לחשוב. על הקיר נשאר ריבוע בהיר בצורת פוסטר. אמא ראתה אותו למחרת ולא שאלה עליו — שאלה אם אכלת. הריבוע נשאר שם שנים.',
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
      { a: 'lines', lines: [{ who: null, text: 'ערב של יוני. גמר גביע נגד השכנים, באצטדיון הגדול בצד השני של העיר. כרטיס עולה כסף, כסף אין, ולרפי יש רדיו על הדלפק.' }, { who: null, text: 'שש־עשרה. מעל המיטה שלך תלוי מגיל שמונה פוסטר של מספר שבע. הוא כבר לא משחק. עכשיו הוא זה שמחליף.' }] },
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
      { a: 'lines', lines: [{ who: null, text: 'שנה אחרי. שבע־עשרה. עונה שלמה של "עוד לא" ו"בשבוע הבא", ואז שני משחקים באירופה, שבועיים ביניהם, וחזרה הביתה.' }, { who: null, text: 'הקיוסק נהיה בית משפט. רפי מוכר גרעינים, ובין קפה לקפה פוסק.' }] },
      { a: 'talk', conversation: 's2-court' },
    ],
  },
  {
    /**
     * ----------------------------------------------- S3 · הקרע ---
     *
     * היום השלישי — the break, in the chapter it belongs to.
     *
     * Stage B §7 B5 asks for three slices — defence, doubt, rupture — across 1993–1996, and
     * the third one was living inside the ARMY chapter as one choice in a kiosk
     * conversation about a sale. So the arc the brief calls "the decade's most personal
     * conflict" had its ending filed under somebody else's crisis, and a player who defended
     * him for two evenings never got a third to stop.
     *
     * The break is not an event and there is nothing to attend. It is a bad season, a wall
     * with a poster on it or a square where one used to be, and a sentence a seventeen-year-
     * old finally says out loud in his own room. Nobody else is present, which is the
     * point: §7 B5 says the rupture is "gradual and remembered", and remembered means it
     * happened where nobody could see it.
     */
    id: 's3-open',
    at: 'bedroom',
    trigger: 'enter',
    when: { flag: S2, all: [{ flag: 's2:done' }], none: [{ flag: S3 }] },
    delayMs: 800,
    do: [
      { a: 'events', events: DAY(S3, 1996, 6, at(22, 10), 'אביב 1996') },
      { a: 'talk', conversation: 's3-room' },
    ],
  },

]

export const CONVERSATIONS_SINAI: Conversation[] = [
  { id: 'rafi-sinai', nameHe: 'רפי מהקיוסק', branches: [
    { when: { flag: S2 }, lines: [{ who: 'רפי מהקיוסק', text: 'שוב בית משפט אצלי. אם עומדים פה שעה — קונים משהו.' }] },
    { when: { flag: 's1:heard' }, lines: [{ who: 'רפי מהקיוסק', text: 'מה שנאמר פה — נאמר פה. אני לא מספר לאבא שלך.' }] },
    { lines: [{ who: 'רפי מהקיוסק', text: 'הרדיו על הדלפק, כמו תמיד. בשבע מתחילים. תזיז את המרפק, יש פה אנשים שקונים.' }] },
  ] },
  { id: 'ofir-sinai', nameHe: 'אופיר', branches: [
    { when: { sinaiIs: 'defending', flag: S2 }, lines: [{ who: 'אופיר', text: 'אתה עדיין שם. בסדר. רק תדע שאתה שם לבד.' }] },
    { when: { flag: S2 }, lines: [{ who: 'אופיר', text: 'טוב שהתעוררת. לא כיף, אבל טוב.' }] },
    { lines: [{ who: 'אופיר', text: 'גרעינים? קח, קח. הערב יהיה ארוך.' }] },
  ] },
  { id: 'amit-sinai', nameHe: 'עמית', branches: [{ lines: [{ who: 'עמית', text: 'אני לא אומר כלום. העיתון אומר. תקרא לבד, זה יותר משכנע.' }] }] },
  { id: 'freddy-sinai', nameHe: 'פרדי', branches: [{ lines: [{ who: 'פרדי', text: '"מי אשם" זו שאלה של קיוסק. "מי מחליט" זו שאלה של עורך דין. תזכור את ההבדל, הוא יעבוד בשבילך עוד עשרים שנה.' }], then: [{ e: 'institution', key: 'legalUnderstanding', delta: 2 }] }] },
  { id: 'poster-look', nameHe: null, branches: [
    { when: { flag: 'life:poster:gone' }, lines: [{ who: null, text: 'ריבוע בהיר על הקיר.' }] },
    { when: { flag: 'life:poster:drawer' }, lines: [{ who: null, text: 'הקיר. הפוסטר במגירה. אתה יודע בדיוק איפה.' }] },
    { lines: [{ who: null, text: 'מספר שבע. צעיר, עם כדור, מחייך. תלוי שם מגיל שמונה.' }] },
  ] },
  {
    id: 's1-radio',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הרדיו על הדלפק, בין המקרר לקופה. רפי מגביר, מנמיך, מגביר. אופיר על הארגז עם גרעינים, ובחור שלא ראית פה קודם עומד בדלת ומקלל בשקט.' },
          { who: null, text: 'זה נגמר כמו שזה נגמר. השדר אמר את זה בנימוס. הבחור בדלת לא.' },
          { who: 'אוהד צעיר', text: 'שבע. מספר שבע שלכם. כששיחק הוא היה שחקן. מאמן הוא לא. שיילך הביתה.' },
          { who: null, text: 'אופיר הנהן. רפי הוריד את הרדיו ולא אמר כלום. ואז כולם הסתכלו עליך, כי בשכונה הזאת כולם יודעים מה תלוי לך מעל המיטה.' },
        ],
        choices: [
          {
            id: 'defend',
            text: '"אתה לא היית שם כשהוא נתן את הכדור ההוא."',
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
          { who: null, text: 'הבחור בדלת צחק. אופיר לא. רפי שם לפניך קפה שלא ביקשת, ולא רשם אותו על הפתק.' },
          { who: 'רפי מהקיוסק', text: 'אבא שלך היה אומר אותו דבר. בדיוק אותו דבר. עם אותו פרצוף.' },
          { who: null, text: 'זו הייתה מחמאה. זו גם הייתה אזהרה.' },
        ],
        then: [{ e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 3 }],
      },
      {
        lines: [
          { who: null, text: 'הבחור בדלת יצא. אופיר קם אחריו. רפי כיבה את הרדיו ואמר "ערב טוב" בקול של סוף משמרת.' },
          { who: null, text: 'הלכת הביתה עם משפט שלא אמרת. הוא כבד יותר ממשפט שאומרים.' },
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
          { who: null, text: 'החדר. הפוסטר מעל המיטה, מגיל שמונה, בחולצה שכבר לא מייצרים. הנייר התכהה בפינות ואחד הנעצים נשען.' },
          { who: null, text: 'מהסלון: אבא ואמא, בקול נמוך. שמעת את השם שלו פעם אחת.' },
        ],
        choices: [
          { id: 'look', text: 'להסתכל עליו רגע ולכבות את האור.', then: [{ e: 'redheart', key: 'historyMemory', delta: 2 }, { e: 'toast', text: 'כיבית את האור והוא המשיך לחייך. זה מה שפוסטרים עושים.', tone: 'plain' }] },
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
          { who: 'קובי', text: 'ראיתי אותו משחק כשעוד סחבתי אותך על הכתפיים. ובדקה שמונים ושש, כשכבר עמדת לידי, ראיתי אותו נותן את הכדור במקום לקחת אותו.' },
          { who: 'קובי', text: 'והערב הוא היה מאמן גרוע. שני הדברים, באותו ראש. תתרגל, זה החיים.' },
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
          { who: 'עמית', text: 'אני לא מתווכח איתך. אני שם עובדות על הדלפק. עונה שלמה. תסתכל בעצמך.' },
          { who: null, text: 'עמית פותח עיתון על הדלפק, בעמוד שכבר היה מקופל שם. הטבלה לא צריכה הסבר.' },
          { who: 'פרדי', text: 'עובדות זה יפה. תשאלו שאלה אחרת: מי נתן לו את התפקיד, ומי משאיר אותו בו. המאמן הוא לא הבעיה. המאמן הוא הכיסוי.' },
          { who: null, text: 'פרדי. עורך דין. חליפה מקומטת, תיק על הרצפה, ומשפטים שיש להם סעיפי משנה.' },
          { who: 'אוהד צעיר', text: 'כיסוי־שמיסוי. שיילך.' },
        ],
        choices: [
          { id: 'cut', text: 'לקטוע את פרדי: "מה השורה התחתונה?"', then: [{ e: 'institution', key: 'legalUnderstanding', delta: 3 }, { e: 'rel', who: 'freddy', axis: 'familiarity', delta: 4 }, { e: 'goto', node: 's2-verdict' }] },
          { id: 'listen', text: 'לתת לו לסיים.', then: [{ e: 'institution', key: 'legalUnderstanding', delta: 6 }, { e: 'personality', key: 'curiosity', delta: 2 }, { e: 'time', minutes: 20 }, { e: 'goto', node: 's2-verdict' }] },
          { id: 'defend', text: '"תנו לו עוד עונה. מגיע לו."', then: [{ e: 'sinai', stance: 'defending' }, { e: 'rel', who: 'ofir', axis: 'tension', delta: 5 }, { e: 'rel', who: 'amit', axis: 'tension', delta: 3 }, { e: 'wellbeing', key: 'loneliness', delta: 6 }, { e: 'redheart', key: 'loyaltyReturn', delta: 4 }, { e: 'goto', node: 's2-verdict' }] },
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
          { who: null, text: 'השורה התחתונה של פרדי הייתה שלוש מילים: "זה לא עליו." אחר כך הקיוסק התפזר. אופיר יצא בלי להגיד לילה טוב, ועמית אחריו.' },
          { who: null, text: 'רפי ניגב את הדלפק. "אתה יודע שאתה לבד בזה." אמרת שכן. הוא הנהן. "גם אבא שלך היה."' },
        ],
        then: [{ e: 'flag', flag: 's2:done' }, { e: 'goto', node: 's2-poster' }],
      },
      {
        lines: [
          { who: null, text: 'השורה התחתונה של פרדי הייתה שלוש מילים: "זה לא עליו." ואתה שמעת את עצמך אומר, בפעם הראשונה, בקול שקט מאוד: אולי.' },
          { who: null, text: 'זה לא הרגיש כמו בגידה. זה הרגיש כמו לגדול, ולא אהבת את זה.' },
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
        lines: [{ who: null, text: 'בלילה, בחדר. אתה עומד מול הקיר עם נעץ בין האצבעות ולא זוכר מתי שלפת אותו.' }],
        choices: [
          /**
           * The poster night stopped being the end of the chapter on 6.9.2026. It decides
           * what is on the wall; the third day (S3) decides what he believes, which is the
           * rupture Stage B §7 B5 asks for and which was living in the army chapter.
           */
          { id: 'keep', text: 'משאיר. על הקיר.', then: [{ e: 'flag', flag: 'life:poster:wall' }, { e: 'redheart', key: 'loyaltyReturn', delta: 3 }, { e: 'flag', flag: 's2:done' }] },
          { id: 'fold', text: 'מקפל. למגירה.', then: [{ e: 'flag', flag: 'life:poster:drawer' }, { e: 'redheart', key: 'historyMemory', delta: 3 }, { e: 'flag', flag: 's2:done' }] },
          { id: 'tear', text: 'מוריד.', then: [{ e: 'flag', flag: 'life:poster:gone' }, { e: 'personality', key: 'impulsiveness', delta: 3 }, { e: 'wellbeing', key: 'regret', delta: 5 }, { e: 'flag', flag: 's2:done' }] },
        ],
      },
    ],
  },
  {
    id: 's3-room',
    nameHe: null,
    branches: [
      {
        when: { flag: 'life:poster:gone' },
        lines: [
          { who: null, text: 'עוד עונה. הריבוע הבהיר על הקיר עדיין שם, ואתה עדיין יודע בדיוק מה היה בו.' },
          { who: null, text: 'ברדיו מהמטבח מישהו אמר את השם שלו, ולא בטוב.' },
        ],
        choices: [
          {
            id: 'broken',
            text: '"הוא לימד אותי מה זו החולצה. הוא כבר לא התשובה."',
            then: [
              { e: 'sinai', stance: 'broken' },
              { e: 'flag', flag: 'life:sinai:broken' },
              { e: 'wellbeing', key: 'regret', delta: 4 },
              { e: 'redheart', key: 'historyMemory', delta: 4 },
              { e: 'ending', id: 'torn' },
            ],
          },
          {
            id: 'memory',
            text: '"את השחקן אני עדיין אוהב. על המאמן — בעוד עשר שנים."',
            then: [
              { e: 'sinai', stance: 'reconciled-memory' },
              { e: 'flag', flag: 'life:sinai:reconciled' },
              { e: 'personality', key: 'empathy', delta: 3 },
              { e: 'redheart', key: 'loyaltyReturn', delta: 3 },
              { e: 'ending', id: 'doubting' },
            ],
          },
        ],
      },
      {
        when: { sinaiIs: 'defending' },
        lines: [
          { who: null, text: 'עוד עונה, וגרועה מהקודמת. הפוסטר עדיין על הקיר, ואתה כבר לא מסתכל עליו כשאתה נכנס.' },
          { who: null, text: 'זה לא קרה בערב אחד. זה קרה כמו שדברים כאלה קורים — קצת בכל פעם, עד שיום אחד אתה שומע את עצמך.' },
        ],
        choices: [
          {
            id: 'hold',
            text: 'הוא נשאר. גם עכשיו.',
            then: [
              { e: 'redheart', key: 'loyaltyReturn', delta: 5 },
              { e: 'wellbeing', key: 'loneliness', delta: 4 },
              { e: 'remember', who: 'kobi', eventId: 'never-took-it-down', significance: 'major' },
              { e: 'ending', id: 'defending' },
            ],
          },
          {
            id: 'broken',
            text: '"הוא לימד אותי מה זו החולצה. הוא כבר לא התשובה."',
            then: [
              { e: 'sinai', stance: 'broken' },
              { e: 'flag', flag: 'life:sinai:broken' },
              { e: 'wellbeing', key: 'regret', delta: 5 },
              { e: 'redheart', key: 'historyMemory', delta: 4 },
              { e: 'ending', id: 'torn' },
            ],
          },
          {
            id: 'memory',
            text: '"את השחקן אני עדיין אוהב. על המאמן — בעוד עשר שנים."',
            then: [
              { e: 'sinai', stance: 'reconciled-memory' },
              { e: 'flag', flag: 'life:sinai:reconciled' },
              { e: 'personality', key: 'empathy', delta: 3 },
              { e: 'redheart', key: 'loyaltyReturn', delta: 4 },
              { e: 'ending', id: 'doubting' },
            ],
          },
        ],
      },
      {
        lines: [
          { who: null, text: 'עוד עונה. הפוסטר במגירה, ואתה לא הוצאת אותו אף פעם, וגם לא זרקת.' },
          { who: null, text: 'ברדיו מהמטבח מישהו אמר את השם שלו. חיכית לראות מה אתה מרגיש, וזה לקח יותר זמן מפעם.' },
        ],
        choices: [
          {
            id: 'memory',
            text: '"את השחקן אני עדיין אוהב. על המאמן — בעוד עשר שנים."',
            then: [
              { e: 'sinai', stance: 'reconciled-memory' },
              { e: 'flag', flag: 'life:sinai:reconciled' },
              { e: 'personality', key: 'empathy', delta: 3 },
              { e: 'redheart', key: 'loyaltyReturn', delta: 3 },
              { e: 'ending', id: 'doubting' },
            ],
          },
          {
            id: 'broken',
            text: '"הוא כבר לא התשובה."',
            then: [
              { e: 'sinai', stance: 'broken' },
              { e: 'flag', flag: 'life:sinai:broken' },
              { e: 'wellbeing', key: 'regret', delta: 3 },
              { e: 'redheart', key: 'historyMemory', delta: 4 },
              { e: 'ending', id: 'torn' },
            ],
          },
        ],
      },
    ],
  },
]
