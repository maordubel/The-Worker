import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { ChoiceDef, Conversation } from './script'
import { CRATES_1997 } from './storyChores'

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
  // שני הקבועים של אלנבי — שני השחקנים האלה מתויגים `era: '*'` ב-`scenes.ts`, כלומר הם
  // עומדים שם בכל פרק, ולכן כל מפה צריכה את הפלייטים שלהם.
  'המוכר': 'faceVendor',
  'הגבר': 'faceSupporterB',
}

export function objectiveHall(state: LifeState): string | null {
  if (state.chapterDone) return null
  if (state.flags[H2]) return state.flags['h2:done'] ? null : 'שנה אחרי. אותו אולם. עולים.'
  if (state.flags['h1:decided']) return null
  return '27 במרץ. עדיין אפשר להישאר בחיים. שחור צריך ידיים; אבא מחכה במקום אחר.'
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
      { a: 'lines', lines: [{ who: null, text: 'אביב. חופשה של ארבעים ושמונה שעות. הגעת ישר מהתחנה, עם התיק, לפינה של אוסישקין.' }, { who: null, text: '27 במרץ 1997. עוד לא ערב הירידה. זה ערב שבו עדיין אפשר להשאיר את הסיפור פתוח. ובאותו זמן אבא מחכה לך במקום אחר.' }] },
      { a: 'talk', conversation: 'h1-corner' },
    ],
  },
  /** back from the crates: the corner asks its question again, now that he has carried */
  {
    id: 'h1-after-crates',
    at: 'ussishkin-outside',
    trigger: 'enter',
    when: { flag: CRATES_1997, none: [{ flag: 'h1:decided' }, { flag: 'h1:asked-after' }] },
    delayMs: 500,
    do: [{ a: 'flag', flag: 'h1:asked-after' }, { a: 'talk', conversation: 'h1-corner' }],
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
      { a: 'card', titleHe: '27.3.1997', subHe: 'אוסישקין · נשארים בחיים', ms: 2400 },
      { a: 'talk', conversation: 'h1-chain' },
    ],
  },
  /**
   * (V3 recovery) the parallel result is asked until it is answered: `h1-hall` raises
   * `h1:decided` before it opens `h1-chain`, so a box walked out of used to leave the night
   * with no way to `h1:chain-complete`. This beat stays armed while the hall night is open.
   */
  {
    id: 'h1-chain-again',
    trigger: 'clock',
    when: { flag: 'h1:hall', none: [{ flag: 'h1:chain-complete' }, { flag: H2 }] },
    delayMs: 600,
    do: [{ a: 'talk', conversation: 'h1-chain' }],
  },
  {
    id: 'h1-football',
    trigger: 'clock',
    when: { flag: 'h1:football', none: [{ flag: H2 }] },
    do: [
      { a: 'card', titleHe: '27.3.1997', subHe: 'אתה במקום אחר', ms: 2400 },
      { a: 'talk', conversation: 'h1-bloomfield' },
    ],
  },
  {
    id: 'h1-chain-to-h2',
    trigger: 'clock',
    when: { flag: 'h1:chain-complete', none: [{ flag: H2 }] },
    delayMs: 700,
    do: [
      { a: 'events', events: DAY(H2, 1998, 2, at(19, 30), 'אביב 1998') },
      { a: 'card', titleHe: 'שנה אחרי', subHe: 'אוסישקין', ms: 2200 },
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

/** ללכת לאבא — the same answer before the crates and after them */
const FOOTBALL_1997: ChoiceDef['then'] = [{ e: 'flag', flag: 'h1:decided' }, { e: 'flag', flag: 'h1:football' }, { e: 'flag', flag: 'life:hall:football-night' }, { e: 'rel', who: 'shachor', axis: 'trust', delta: -5 }, { e: 'remember', who: 'shachor', eventId: 'left-relegation-night-1997', significance: 'major' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 4 }, { e: 'institution', key: 'ussishkinWound', delta: 4 }, { e: 'time', minutes: 40 }]

export const CONVERSATIONS_HALL: Conversation[] = [
  {
    id: 'h1-corner',
    nameHe: null,
    branches: [
      /** after the crates — the choice is the same, and now he has worked for one side of it */
      {
        when: { flag: CRATES_1997 },
        lines: [
          { who: 'שחור', text: 'עוד אחד. (הוא לא אומר תודה. הוא מחזיק את הדלת פתוחה.)' },
          { who: 'לימור', text: 'שמונה. אבא שלך בשער 7, והוא מחכה.' },
        ],
        choices: [
          { id: 'inside', text: 'להישאר. פנימה, לאולם.', then: [{ e: 'redheart', key: 'basketballLove', delta: 2 }, { e: 'travel', to: 'ussishkin-hall', spawn: 'fromOut' }] },
          { id: 'football', text: 'להניח את הידיים. ללכת לאבא.', then: FOOTBALL_1997 },
        ],
      },
      {
        lines: [
          { who: null, text: 'שחור ליד שני ארגזים. לימור עם פנקס. פרדי בחליפה, מדבר עם מישהו בטלפון נייד בגודל של לבנה.' },
          { who: 'שחור', text: 'אתה. יופי. שני ארגזים צריכים להיכנס לפני הקהל, ואין לי גב. אני לא מבקש פעמיים.' },
          { who: 'לימור', text: 'ואבא שלך התקשר לקיוסק של רפי. רפי אמר לשחור, שחור אמר לי. הוא בשער 7 בשמונה, והוא מחכה.' },
          { who: null, text: 'שמונה. בשני המקומות.' },
        ],
        choices: [
          /**
           * (Director V3 §10, 24.9.2026) "לסחוב את הארגזים" is carried now, not chosen: the
           * answer commits (`h1:crates`, Kobi waiting at eight, Shachor remembering), and
           * the two crates are `ChoreScene` — one at a time, to the hall door, and it can be
           * put down halfway (`content/storyChores.ts`). The hall-or-father choice comes
           * AFTER the work, in `h1-corner`'s first branch, so it costs what it should.
           */
          { id: 'crates', text: 'לסחוב את הארגזים.', then: [{ e: 'flag', flag: 'h1:crates' }, { e: 'remember', who: 'shachor', eventId: 'crates-relegation-1997', significance: 'major' }, { e: 'rel', who: 'kobi', axis: 'tension', delta: 4 }, { e: 'minigame', id: 'chore:story:crates-97' }] },
          { id: 'football', text: 'להתנצל. ללכת לאבא.', then: FOOTBALL_1997 },
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
  // (23.9.2026) `h1-inside`/`h1-efi`/`h1-out` removed: the overlay moved this night from
  // inside the hall to `h1-chain` (outside, via the parallel Herzliya result), and nothing
  // pointed at this trio any more once its `match`/`hall-97` step stopped being played
  // (life-orphans, life-match).
  {
    id: 'h1-chain',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הערב באוסישקין השאיר את הקבוצה בחיים. לא יותר.' },
          { who: null, text: '30 במרץ. אילת. הפסד בחוץ, והשליטה כבר לא בידיים שלכם.' },
          { who: null, text: 'המחזור האחרון מגיע, והפועל בכלל לא משחקת. קבוצה אחת נעלמה מהליגה, והחיים שלכם תלויים עכשיו במשחק של מישהו אחר.' },
          { who: null, text: 'הידיעה מהרצליה מגיעה בלי כדור ביד ובלי פרקט מתחת לרגליים. הפעם זה סופי: הירידה הראשונה.' },
        ],
        choices: [
          { id: 'write', text: 'לבקש מלימור לרשום את התאריך.', then: [{ e: 'rel', who: 'crowd-limor', axis: 'sharedHistory', delta: 4 }, { e: 'institution', key: 'ussishkinWound', delta: 8 }, { e: 'redheart', key: 'historyMemory', delta: 4 }, { e: 'goto', node: 'h1-after-chain' }] },
          { id: 'carry', text: 'לעזור לשחור לסגור את הערב.', then: [{ e: 'rel', who: 'shachor', axis: 'bond', delta: 4 }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 5 }, { e: 'institution', key: 'ussishkinWound', delta: 8 }, { e: 'goto', node: 'h1-after-chain' }] },
          { id: 'home', text: 'ללכת לאבא. אין מה לפתור עכשיו.', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'institution', key: 'ussishkinWound', delta: 7 }, { e: 'goto', node: 'h1-after-chain' }] },
        ],
      },
    ],
  },
  {
    id: 'h1-after-chain',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'שנה עוברת. העלייה חזרה לא מוחקת את הדרך שבה ירדתם.' }], then: [{ e: 'flag', flag: 'h1:chain-complete' }] }],
  },
  {
    id: 'h1-bloomfield',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'שער 7. אבא, ו"טוב שבאת" בשתי מילים. המשחק היה משחק של הישרדות — לא שלהם, שלכם. כל כדור היה שאלה.' },
          { who: null, text: 'מישהו עם טרנזיסטור מאחור מעביר את הידיעה מאוסישקין: עוד נשארו בחיים. אבא שמע. הסתכל עליך. לא אמר כלום.' },
          { who: 'קובי', text: 'רצית להיות שם?' },
        ],
        choices: [
          { id: 'yes', text: '"כן."', then: [{ e: 'rel', who: 'kobi', axis: 'trust', delta: 3 }, { e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'presence', mode: 'heard-from-friend' }, { e: 'goto', node: 'h1-chain' }] },
          { id: 'here', text: '"הייתי צריך להיות פה."', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'redheart', key: 'familyTradition', delta: 3 }, { e: 'presence', mode: 'heard-from-friend' }, { e: 'goto', node: 'h1-chain' }] },
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
        /**
         * שבע שנים אחורה — the brief (§16) asks that the decade be one life and not ten
         * episodes, and the promotion of 1990 is the obvious debt: a twelve-year-old
         * learned that word standing outside a gate that opened late. `went:withKobi`
         * survives the chapter cut since 6.9.2026, which is what makes this line possible
         * at all.
         */
        choices: [
          { id: 'hope', text: '"אולי הפעם זה באמת מתחיל."', then: [{ e: 'wellbeing', key: 'happiness', delta: 4 }, { e: 'institution', key: 'basketballOwnershipTrust', delta: 4 }, { e: 'goto', node: 'h2-inside' }] },
          { id: 'doubt', text: '"עלינו. זה הכל."', then: [{ e: 'rel', who: 'shachor', axis: 'trust', delta: 3 }, { e: 'personality', key: 'curiosity', delta: 1 }, { e: 'goto', node: 'h2-inside' }] },
          { id: 'tired', text: 'לשתוק. עייף.', then: [{ e: 'wellbeing', key: 'exhaustion', delta: 5 }, { e: 'goto', node: 'h2-inside' }] },
          {
            id: 'ninety',
            text: '"בפעם הראשונה ששמעתי \'עולים\' הייתי בן שתים־עשרה."',
            when: { flag: 'went:withKobi' },
            // hidden, not greyed: a line about your own twelfth birthday is not a door you
            // can see and cannot open — to a player who went with his friends in 1990 it is
            // simply not a thing he would say
            hidden: true,
            then: [
              { e: 'redheart', key: 'historyMemory', delta: 4 },
              { e: 'rel', who: 'shachor', axis: 'sharedHistory', delta: 3 },
              { e: 'toast', text: 'שחור הניח ארגז ולא הרים אותו. "ואיפה היית עומד אז?" "בחוץ. השער נפתח מאוחר."', tone: 'plain' },
              { e: 'goto', node: 'h2-inside' },
            ],
          },
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
