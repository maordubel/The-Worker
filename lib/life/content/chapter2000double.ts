import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * B11 · "ארבעה ימים" · 13–17.5.2000 — the two-part final exam, and the walk after it.
 *
 * Part I (`2000-title`): a Saturday at a small ground in the Hatikva quarter, where a draw
 * is enough. Who stands beside him; whether Kobi is there and an embrace is earned;
 * whether he looks for football friends, basketball friends or both; how 1998 changed
 * his ability to believe the news. No credits: the cup final is four days away.
 *
 * Part II (`2000-double`): four days of consequence as a compact schedule — two things
 * out of seven, and the exhaustion of the championship in the passenger seat — then the
 * national stadium again, penalties again, and a walk home that is one of seven outcome
 * families computed from the whole decade. Every one of them includes the Double. What
 * changes is who is beside him and what it means.
 *
 * **No score, scorer or opponent in a line.** The archive holds both days.
 */

export const PORTRAIT_2000: Record<string, string> = {
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
  'סוקו': 'faceSoko',
  'לימור': 'faceLimor',
  'הבוס': 'faceBoss',
  'אוהד': 'faceSupporter',
}

// ------------------------------------------------------------------ Part I ------

export function objectiveTitle(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['t:over']) return null
  if (state.flags['t:route']) return sceneId === 'hatikva' ? null : 'שכונת התקווה. שלוש.'
  return 'תיקו מספיק. איך מגיעים — ועם מי.'
}

export const ENDINGS_TITLE: Record<string, EndingCard> = {
  inside: {
    id: 'inside',
    titleHe: 'אלופים. אין קרדיטים.',
    bodyHe:
      'תיקו במגרש קטן בשכונה, ואתם אלופים. לא האמנת עד שאבא — או מי שהיה לידך — הסתכל עליך ואמר את המילה. שתיים ותשעים למדו אותך לא להאמין למספרים לפני השריקה. השריקה באה. האמנת. ועוד ארבעה ימים גמר גביע — אז אף אחד לא הולך לישון.',
    memoryHe: 'כרטיס ממגרש שכונתי, מודפס עקום. שמרת אותו ישר.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  working: {
    id: 'working',
    titleHe: 'אלופים, במשמרת',
    bodyHe:
      'חוב ישן הבשיל: משמרת שאי אפשר היה לזוז ממנה. שמעת את זה מרדיו של לקוח. כשזה נגמר, מישהו שלא הכרת חיבק אותך מעל הדלפק. עוד ארבעה ימים גמר גביע — ואת המשמרת הזאת כבר סידרת.',
    memoryHe: 'קבלה מהמשמרת עם השעה של השריקה מסומנת בעט.',
    memoryItem: 'folded-paper',
    presence: 'working',
  },
}

export const BEATS_TITLE: Beat[] = [
  {
    id: 't-open',
    at: 'home',
    trigger: 'enter',
    when: { none: [{ flag: 't:opened' }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: 't:opened' },
      { a: 'events', events: [{ t: 'money.changed', agorot: 8000, why: 'משכורת' }] },
      { a: 'lines', lines: [{ who: null, text: 'שבת, אמצע מאי. עשרים ושתיים. תיקו היום במגרש קטן בשכונת התקווה — ואתם אלופים. תיקו. רק תיקו.' }, { who: null, text: 'שתיים ותשעים לימדו אותך לא לחשב לפני. אז אתה לא מחשב. אתה רק לא מצליח לאכול.' }] },
    ],
  },
  {
    id: 't-work-debt',
    at: 'home',
    trigger: 'enter',
    when: { flag: 't:opened', armyAbove: { key: 'leaveDebt', min: 3 }, none: [{ flag: 't:route' }, { flag: 't:debt' }] },
    delayMs: 1500,
    do: [{ a: 'flag', flag: 't:debt' }, { a: 'talk', conversation: 't-boss' }],
  },
  {
    id: 't-kickoff-away',
    trigger: 'clock',
    when: { afterMinute: at(15, 0), none: [{ flag: 't:route' }, { flag: 't:over' }] },
    do: [{ a: 'flag', flag: 't:route' }, { a: 'talk', conversation: 't-radio' }],
  },
  {
    id: 't-ground',
    at: 'hatikva',
    trigger: 'enter',
    when: { flag: 't:route', none: [{ flag: 't:over' }] },
    delayMs: 1000,
    do: [
      { a: 'card', titleHe: 'שכונת התקווה', subHe: 'המחזור שמכריע', ms: 2600, art: 'plate-2000-title' },
      { a: 'match', script: 'title-00' },
    ],
  },
]

export const CONVERSATIONS_TITLE: Conversation[] = [
  {
    id: 't-boss',
    nameHe: 'הבוס',
    branches: [
      {
        lines: [
          { who: 'הבוס', text: '(בטלפון.) שבת. אני יודע שזה שבת. ואני יודע מה יש היום. ואני יודע גם כמה פעמים לא הגעת השנה. משמרת. שלוש עד עשר. אין דיון.' },
          { who: null, text: 'החוב הישן — כל חופשה שסחטת, כל פעם שמישהו כיסה עליך — הבשיל היום.' },
        ],
        choices: [
          { id: 'go', text: '"אני בא."', then: [{ e: 'flag', flag: 't:route' }, { e: 'flag', flag: 't:working' }, { e: 'personality', key: 'reliability', delta: 4 }, { e: 'wellbeing', key: 'regret', delta: 8 }, { e: 'presence', mode: 'working' }, { e: 'goto', node: 't-shift' }] },
          { id: 'no', text: '"לא. לא היום."', then: [{ e: 'flag', flag: 'life:quit:2000' }, { e: 'personality', key: 'riskTolerance', delta: 4 }, { e: 'personality', key: 'reliability', delta: -4 }, { e: 'toast', text: 'הוא ניתק. לא ידעת אם יש לך עבודה ביום ראשון.', tone: 'red' }] },
        ],
      },
    ],
  },
  {
    id: 't-shift',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'המשמרת. רדיו של לקוח. השריקה. מישהו שלא הכרת חיבק אותך מעל הדלפק.' }, { who: null, text: 'אלופים. לא היית שם. עוד ארבעה ימים.' }], then: [{ e: 'flag', flag: 't:over' }, { e: 'ending', id: 'working' }] }],
  },
  {
    id: 't-radio',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'שלוש. לא יצאת. איפשהו בשכונת התקווה זה מתחיל בלעדיך.' }, { who: null, text: 'התיקו הגיע ברדיו. אלופים. צעקת לבד בסלון. אמא נכנסה מהמטבח ושאלה "מה?" ואמרת "אלופים" ובכית.' }], then: [{ e: 'flag', flag: 't:over' }, { e: 'presence', mode: 'radio' }, { e: 'ending', id: 'working' }] }],
  },
  {
    id: 'kobi-title',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 't:route' }, lines: [{ who: 'קובי', text: 'נתראה שם. או שלא. יש שם רק שש אלף, נתראה.' }] },
      {
        lines: [{ who: 'קובי', text: 'תיקו. רק תיקו. אני לא מאמין למילה הזאת מאז שתיים ותשעים. אתה בא איתי? מגרש קטן. הולכים ברגל חצי דרך.' }],
        choices: [
          { id: 'yes', text: '"בא."', then: [{ e: 'flag', flag: 't:route' }, { e: 'flag', flag: 't:with-kobi' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 4 }, { e: 'time', minutes: 60 }, { e: 'travel', to: 'hatikva', spawn: 'start' }] },
          { id: 'later', text: '"אני מגיע לבד."', then: [{ e: 'toast', text: '"לבד." הוא הסתכל עליך רגע ארוך.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'michel-title',
    nameHe: 'מישל',
    branches: [
      { when: { flag: 't:route' }, lines: [{ who: 'מישל', text: 'יצאנו. נתראה.' }] },
      { when: { gateEver: 'gate5' }, lines: [{ who: 'מישל', text: 'מיניבוס. חינם היום. אסף אמר שאלופים לא משלמים.' }], choices: [{ id: 'go', text: '"בא."', then: [{ e: 'flag', flag: 't:route' }, { e: 'flag', flag: 't:with-gate5' }, { e: 'time', minutes: 50 }, { e: 'travel', to: 'hatikva', spawn: 'start' }] }, { id: 'no', text: '"לא הפעם."', then: [] }] },
      { lines: [{ who: 'מישל', text: 'מיניבוס של שער 5. מלא.' }] },
    ],
  },
  {
    id: 'efi-title',
    nameHe: 'אפי',
    branches: [
      { when: { relationship: { who: 'efi', axis: 'trust', min: 45 } }, lines: [{ who: 'אפי', text: 'אלופים היום? כדורגל, אבל אלופים. אני בא איתך. אל תגיד לשחור.' }], choices: [{ id: 'go', text: '"בוא."', then: [{ e: 'flag', flag: 't:route' }, { e: 'flag', flag: 't:with-efi' }, { e: 'rel', who: 'efi', axis: 'bond', delta: 6 }, { e: 'remember', who: 'efi', eventId: 'came-to-football-2000', significance: 'major' }, { e: 'time', minutes: 60 }, { e: 'travel', to: 'hatikva', spawn: 'start' }] }] },
      { lines: [{ who: 'אפי', text: 'אלופים היום, אה. יפה לכם.' }, { who: null, text: '"לכם."' }] },
    ],
  },
  {
    id: 't-match',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'השריקה. שש אלף איש לא בטוחים שמותר.' }],
        choices: [
          { id: 'believe', text: 'להאמין. עכשיו.', then: [{ e: 'wellbeing', key: 'happiness', delta: 12 }, { e: 'goto', node: 't-champions' }] },
          { id: 'wait', text: 'לחכות. שמישהו יגיד את המילה.', when: { lacesIs: 'witness' }, hidden: true, then: [{ e: 'goto', node: 't-champions' }] },
          { id: 'wait2', text: 'לחכות. שמישהו יגיד את המילה.', when: { none: [{ lacesIs: 'witness' }] }, hidden: true, then: [{ e: 'goto', node: 't-champions' }] },
        ],
      },
    ],
  },
  {
    id: 't-champions',
    nameHe: null,
    branches: [
      { when: { flag: 't:with-kobi' }, lines: [{ who: 'קובי', text: 'אלופים.' }, { who: null, text: 'הוא אמר את זה אליך. לא למגרש. אליך. ואז חיבק, וזה היה הרבה יותר ממה שהיה בשמונים ושש, כי עכשיו היית בגובה שלו.' }], then: [{ e: 'sfx', key: 'crowd-goal', level: 0.8 }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 8 }, { e: 'remember', who: 'kobi', eventId: 'champions-hug-2000', significance: 'major' }, { e: 'flag', flag: 'life:title:kobi' }, { e: 'goto', node: 't-close' }] },
      { when: { flag: 't:with-efi' }, lines: [{ who: 'אפי', text: 'אז ככה זה אצלכם.' }, { who: 'פוגי', text: 'ככה.' }, { who: 'אפי', text: 'טוב. יפה.' }, { who: null, text: 'הוא חיבק אותך כמו אחרי הגביע ההוא. שבע שנים. אתה קפצת עליו הפעם.' }], then: [{ e: 'rel', who: 'efi', axis: 'sharedHistory', delta: 8 }, { e: 'flag', flag: 'life:title:efi' }, { e: 'goto', node: 't-close' }] },
      { when: { flag: 't:with-gate5' }, lines: [{ who: null, text: 'הבד עלה. אסף לא חייך — אסף אף פעם לא מחייך — אבל הוא הניח יד על הראש שלך רגע.' }], then: [{ e: 'rel', who: 'asaf', axis: 'bond', delta: 6 }, { e: 'flag', flag: 'life:title:gate5' }, { e: 'goto', node: 't-close' }] },
      { lines: [{ who: null, text: 'לבד באמצע שש אלף. אלופים. חיפשת פנים מוכרות ולא מצאת, ואז מצאת אחת, ואז זה לא היה משנה.' }], then: [{ e: 'wellbeing', key: 'loneliness', delta: 3 }, { e: 'goto', node: 't-close' }] },
    ],
  },
  {
    id: 't-close',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'אין קרדיטים. עוד ארבעה ימים גמר גביע.' }], then: [{ e: 'flag', flag: 't:over' }, { e: 'ending', id: 'inside' }] }],
  },
]

// ------------------------------------------------------------------ Part II -----

export type OutcomeFamily = 'inherited-chosen' | 'gate5-builder' | 'gate7-keeper' | 'two-halls' | 'always-travelling' | 'heard-elsewhere' | 'alone-in-crowd'

/**
 * משפחות הסיום — the walk home is one of seven, read off the whole decade.
 * Not good/bad. Each includes the Double; each says who was beside him.
 */
export function outcomeFamily(state: LifeState): OutcomeFamily {
  const kobi = state.relationships['kobi']?.bond ?? 50
  const asaf = state.relationships['asaf']?.bond ?? 0
  const shachor = state.relationships['shachor']?.bond ?? 0
  const missed = state.missedAnchors.length
  const attended = state.attendedAnchors.length
  const gate = state.gate.identity
  const seed = state.institution.supporterOwnershipSeed
  const travel = state.redHeart.travelDrive
  const lonely = state.wellbeing.loneliness
  if (missed >= attended + 2) return 'heard-elsewhere'
  if (lonely >= 45 && kobi < 45 && asaf < 20) return 'alone-in-crowd'
  if (seed >= 25 && shachor >= 12 && state.redHeart.basketballLove >= 25) return 'two-halls'
  if (gate === 'gate5' && asaf >= 8) return kobi >= 55 ? 'inherited-chosen' : 'gate5-builder'
  if (travel >= 22) return 'always-travelling'
  if (gate === 'gate7' || gate === 'between') return kobi >= 55 && asaf >= 6 ? 'inherited-chosen' : 'gate7-keeper'
  return 'inherited-chosen'
}

export function objectiveDouble(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['d:over']) return null
  if (state.flags['d:final']) return sceneId === 'ramat-gan' ? null : 'רמת גן. הגמר.'
  return 'ארבעה ימים. שני דברים. לא יותר.'
}

export const ENDINGS_DOUBLE: Record<string, EndingCard> = {
  'inherited-chosen': {
    id: 'inherited-chosen',
    titleHe: 'ירשת. ובחרת.',
    bodyHe:
      'דאבל. הלכת הביתה עם אבא בצד אחד ועם האנשים שבחרת בצד השני, ובאמצע — אתה, שהצליח להחזיק את שניהם בלי להפיל. זה לא היה נוח. זה לא יהיה נוח. אבל זה שלך: הבית שירשת, והבית שבנית, באותו רחוב.',
    memoryHe: 'שני כרטיסים: של האליפות ושל הגביע. באותו כיס.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  'gate5-builder': {
    id: 'gate5-builder',
    titleHe: 'בנית משהו',
    bodyHe:
      'דאבל. הלכת הביתה עם הבד על הכתף, עם אנשים שלפני ארבע שנים לא הכרת ושהיום מכירים אותך בשם. עייף עד העצם. ובבית — אבא, שראה את זה מהצד השני של האצטדיון, ושתיקה שעוד לא נסגרה. שני הדברים אמיתיים. גם זה בנית.',
    memoryHe: 'חתיכה מהבד. אסף חתך לכולם.',
    memoryItem: 'scarf',
    presence: 'inside',
  },
  'gate7-keeper': {
    id: 'gate7-keeper',
    titleHe: 'שומר השער',
    bodyHe:
      'דאבל. שער 7, אבא, השירים האיטיים, האנשים שיודעים אותם עשרים שנה. הלכת הביתה עם מה שקיבלת, שלם. ומהצד השני של היציע, כל הדרך, שמעת תוף שלא היית איתו. יום אחד תדע אם זה חסר לך.',
    memoryHe: 'צעיף ישן. של אבא. הוא נתן לך אותו בדרך הביתה בלי להגיד למה.',
    memoryItem: 'scarf',
    presence: 'inside',
  },
  'two-halls': {
    id: 'two-halls',
    titleHe: 'שני בתים, חיים אחד',
    bodyHe:
      'דאבל. חגגת — ובאמצע החגיגה חשבת על אולם קטן על הירקון שירד פעמיים ועל דף משבצות במגירה. שחור לא היה בגמר. הלכת אליו אחרי, עם הגביע בראש ועם האולם בלב. "מזל טוב," הוא אמר. "עכשיו תחזור לעבודה."',
    memoryHe: 'כרטיס הגמר, ובתוכו, מקופל, הדף עם שלוש הכותרות.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  'always-travelling': {
    id: 'always-travelling',
    titleHe: 'תמיד בדרך',
    bodyHe:
      'דאבל. הגעת לגמר כמו שהגעת לכל מקום בעשור הזה: באוטו של מישהו, במיניבוס, בטרמפ, ברגל. אנשים זוכרים אותך גם מהפעמים שהצלת מישהו וגם מהפעמים שלא הגעת. הלכת הביתה לבד ברגל, כי זה מה שאתה עושה, ובדרך שרת.',
    memoryHe: 'ערימת כרטיסי אוטובוס, מגומיים. עשור.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  'heard-elsewhere': {
    id: 'heard-elsewhere',
    titleHe: 'שמעת ממקום אחר',
    bodyHe:
      'דאבל. ולא היית — לא בזה, ולא ברוב הגדולים של העשור. בסיס, משמרת, הבטחה, כסף. אבל היית מישהו שאפשר לסמוך עליו, ומישהו התקשר להגיד לך את זה בשתיים בלילה, בוכה. זה אדם אחר ממי שהיה שם. גם הוא בנה משהו.',
    memoryHe: 'פתק ליד הטלפון: "התקשרו. אלופים. גביע. אמרו שאתה בסדר."',
    memoryItem: 'folded-paper',
    presence: 'radio',
  },
  'alone-in-crowd': {
    id: 'alone-in-crowd',
    titleHe: 'לבד בתוך הקהל',
    bodyHe:
      'דאבל. היית שם, כמו תמיד. הכי אדום באצטדיון. ובדרך הביתה לא היה למי לצלצל. אבא רחוק, החברים בצד אחר, האולם — עזבת. השמחה הייתה אמיתית. גם הבדידות. זה מה שהעשור עשה ממך, ועוד יש עשור.',
    memoryHe: 'כרטיס הגמר. אף שם עליו.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
}

export const BEATS_DOUBLE: Beat[] = [
  // the walk home: the family is read off the decade, once, and the conversation follows
  {
    id: 'd-after',
    trigger: 'clock',
    when: { flag: 'd:over', none: [{ flag: 'd:walked' }] },
    do: [
      { a: 'flag', flag: 'd:walked' },
      { a: 'derive', events: (state) => [{ t: 'flag.raised', flag: `life:family:${outcomeFamily(state)}` }] },
      { a: 'talk', conversation: 'd-walk' },
    ],
  },
  {
    id: 'd-open',
    at: 'home',
    trigger: 'enter',
    when: { none: [{ flag: 'd:opened' }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: 'd:opened' },
      { a: 'events', events: [{ t: 'money.changed', agorot: 6000, why: 'מה שנשאר' }, { t: 'energy.changed', delta: -35 }] },
      { a: 'talk', conversation: 'd-days' },
    ],
  },
  {
    id: 'd-stadium',
    at: 'ramat-gan',
    trigger: 'enter',
    when: { flag: 'd:final', none: [{ flag: 'd:over' }] },
    delayMs: 1000,
    do: [
      { a: 'card', titleHe: 'אצטדיון רמת גן', subHe: 'גמר גביע המדינה · הדאבל', ms: 2600, art: 'plate-2000-double' },
      { a: 'match', script: 'double-00' },
    ],
  },
]

export const CONVERSATIONS_DOUBLE: Conversation[] = [
  {
    id: 'd-days',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'ארבעה ימים בין אליפות לגמר. לא ישנת בראשון. הגוף מבקש חשבון.' },
          { who: null, text: 'יש שבעה דברים שצריך. יש זמן לשניים.' },
        ],
        choices: [
          { id: 'sleep', text: 'לישון. יום שלם.', then: [{ e: 'energy', delta: 40 }, { e: 'flag', flag: 'd:pick1' }, { e: 'goto', node: 'd-days-2' }] },
          { id: 'work', text: 'משמרת כפולה. כסף לכרטיס.', then: [{ e: 'money', agorot: 9000, why: 'משמרת כפולה' }, { e: 'energy', delta: -15 }, { e: 'flag', flag: 'd:pick1' }, { e: 'goto', node: 'd-days-2' }] },
          { id: 'family', text: 'ערב עם אבא ואמא. לתקן משהו.', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 6 }, { e: 'rel', who: 'rachel', axis: 'bond', delta: 6 }, { e: 'energy', delta: 10 }, { e: 'flag', flag: 'd:pick1' }, { e: 'goto', node: 'd-days-2' }] },
          { id: 'gate5', text: 'להכין בד עם שער 5. לילה שלם.', when: { gateEver: 'gate5' }, noteHe: 'אף פעם לא עמדת בשער 5. הבד לא שלך.', then: [{ e: 'rel', who: 'asaf', axis: 'bond', delta: 6 }, { e: 'redheart', key: 'terraceCulture', delta: 5 }, { e: 'energy', delta: -20 }, { e: 'flag', flag: 'd:pick1' }, { e: 'goto', node: 'd-days-2' }] },
        ],
      },
    ],
  },
  {
    id: 'd-days-2',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'עוד דבר אחד. רק אחד.' }],
        choices: [
          { id: 'uss', text: 'ערב באוסישקין. שחור צריך עזרה, גם השבוע.', then: [{ e: 'rel', who: 'shachor', axis: 'bond', delta: 6 }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 6 }, { e: 'energy', delta: -10 }, { e: 'flag', flag: 'd:final' }, { e: 'goto', node: 'd-go' }] },
          { id: 'ticket', text: 'לסדר כרטיס והסעה. ברור.', then: [{ e: 'give', item: 'ticket-stub' }, { e: 'flag', flag: 'd:ticket' }, { e: 'flag', flag: 'd:final' }, { e: 'goto', node: 'd-go' }] },
          { id: 'box', text: 'לפתוח את הקופסה האדומה. לעבור על הכל.', then: [{ e: 'redheart', key: 'historyMemory', delta: 6 }, { e: 'wellbeing', key: 'happiness', delta: 4 }, { e: 'flag', flag: 'd:final' }, { e: 'goto', node: 'd-go' }] },
          { id: 'army', text: 'לסגור חוב עם מישהו שכיסה עליך פעם.', when: { armyAbove: { key: 'coveredForOthers', min: 0 } }, noteHe: 'אף אחד לא כיסה עליך בצבא. אין חוב.', then: [{ e: 'army', key: 'leaveDebt', delta: -2 }, { e: 'personality', key: 'reliability', delta: 3 }, { e: 'flag', flag: 'd:final' }, { e: 'goto', node: 'd-go' }] },
        ],
      },
    ],
  },
  {
    id: 'd-go',
    nameHe: null,
    branches: [
      { when: { flag: 'd:ticket' }, lines: [{ who: null, text: 'יום רביעי. הכרטיס בכיס. ההסעה בשש. רמת גן.' }], then: [{ e: 'time', minutes: 120 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
      { lines: [{ who: null, text: 'יום רביעי. אין כרטיס מסודר. יש דרך — אם מישהו ידאג לך. מישל אמר שיש. אבא אמר שיש. מישהו ידאג.' }], then: [{ e: 'flag', flag: 'arrived:late' }, { e: 'time', minutes: 150 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
    ],
  },
  {
    id: 'd-match',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'השופט מסתכל בשעון. ארבעים אלף מקללים את הידיעה.' },
        ],
        choices: [
          { id: 'breathe', text: 'לנשום. להסתכל. הפעם עד הסוף.', then: [{ e: 'personality', key: 'courage', delta: 3 }, { e: 'goto', node: 'd-pens' }] },
          { id: 'hold', text: 'להחזיק במי שלידך.', then: [{ e: 'redheart', key: 'community', delta: 3 }, { e: 'goto', node: 'd-pens' }] },
          { id: 'trap', text: '"זו מלכודת. תמיד מלכודת." (לא להאמין.)', when: { lacesIs: 'witness' }, hidden: true, then: [{ e: 'wellbeing', key: 'stress', delta: 5 }, { e: 'goto', node: 'd-pens' }] },
          { id: 'trap2', text: '"זו מלכודת. תמיד מלכודת." (לא להאמין.)', when: { none: [{ lacesIs: 'witness' }] }, hidden: true, then: [{ e: 'wellbeing', key: 'stress', delta: 5 }, { e: 'goto', node: 'd-pens' }] },
        ],
      },
    ],
  },
  {
    id: 'd-pens',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'פנדלים. שוב. השוער שלכם ניגש לקו כמו מישהו שעשה את זה כבר, כי עשה.' },
          { who: null, text: 'בעיטה. עוד בעיטה. השוער שלכם — עצירה. האצטדיון לא צועק, הוא נושף. עוד אחת. הם מפספסים לבד. ואז—' },
          { who: null, text: 'זה נגמר. דאבל.' },
        ],
        then: [{ e: 'sfx', key: 'crowd-goal', level: 1 }, { e: 'sfx', key: 'crowd-claps', level: 0.6, delayMs: 2600 }, { e: 'wellbeing', key: 'happiness', delta: 20 }, { e: 'redheart', key: 'footballLove', delta: 8 }, { e: 'redheart', key: 'loyaltyReturn', delta: 5 }, { e: 'flag', flag: 'd:over' }],
      },
    ],
  },
  {
    id: 'd-walk',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'בחוץ. לא על מסך תוצאות — בחוץ, ברחוב שמוביל מהאצטדיון, עם ארבעים אלף איש שהולכים לכל הכיוונים.' },
          { who: null, text: 'מי לידך.' },
        ],
        then: [{ e: 'presence', mode: 'inside' }, { e: 'goto', node: 'd-family' }],
      },
    ],
  },
  {
    id: 'd-family',
    nameHe: null,
    branches: [
      { when: { flag: 'life:family:inherited-chosen' }, lines: [{ who: null, text: 'אבא מצד אחד. אסף מהצד השני. אתה באמצע, מחזיק את שניהם.' }], then: [{ e: 'ending', id: 'inherited-chosen' }] },
      { when: { flag: 'life:family:gate5-builder' }, lines: [{ who: null, text: 'הבד על הכתף. אנשים שמכירים אותך בשם. ובבית — אבא, ושתיקה.' }], then: [{ e: 'ending', id: 'gate5-builder' }] },
      { when: { flag: 'life:family:gate7-keeper' }, lines: [{ who: null, text: 'אבא. השירים האיטיים. ומהצד השני — תוף.' }], then: [{ e: 'ending', id: 'gate7-keeper' }] },
      { when: { flag: 'life:family:two-halls' }, lines: [{ who: null, text: 'הגביע בראש, האולם בלב. שחור לא היה פה. הולכים אליו.' }], then: [{ e: 'ending', id: 'two-halls' }] },
      { when: { flag: 'life:family:always-travelling' }, lines: [{ who: null, text: 'ברגל. כמו תמיד. שרים.' }], then: [{ e: 'ending', id: 'always-travelling' }] },
      { when: { flag: 'life:family:heard-elsewhere' }, lines: [{ who: null, text: 'הטלפון בשתיים בלילה. בוכים. "אתה בסדר."' }], then: [{ e: 'ending', id: 'heard-elsewhere' }] },
      { lines: [{ who: null, text: 'הכי אדום באצטדיון. ואין למי לצלצל.' }], then: [{ e: 'ending', id: 'alone-in-crowd' }] },
    ],
  },
  /**
   * קובי, ארבעה ימים אחרי האליפות — the last time in this decade the father is a person
   * in a kitchen and not a hand on a shoulder in a crowd. He does not talk about the
   * final. He talks about 1990, which is how he talks about everything.
   */
  {
    id: 'kobi-double',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'd:over' }, lines: [{ who: 'קובי', text: '…' }, { who: null, text: 'הוא לא מדבר. הוא מחזיק את הצלחת ולא שוטף אותה.' }] },
      {
        when: { flag: 'd:final' },
        lines: [{ who: 'קובי', text: 'יום רביעי. אתה יודע איפה אתה יושב?' }, { who: 'קובי', text: 'לא משנה איפה. תהיה שם. זה כל מה שביקשתי ממך אי פעם.' }],
        then: [{ e: 'rel', who: 'kobi', axis: 'familiarity', delta: 1 }],
      },
      {
        when: { relationship: { who: 'kobi', axis: 'bond', min: 60 } },
        lines: [
          { who: 'קובי', text: 'אלופים. אמרתי את זה בקול היום בעבודה, סתם, לראות איך זה נשמע.' },
          { who: 'קובי', text: 'תשעים לא נגמר ככה. תשעים נגמר עם אנשים שמחפשים אחד את השני בין שערים. תבטיח לי שביום רביעי אנחנו לא מחפשים.' },
        ],
        choices: [
          { id: 'promise', text: '"מבטיח. אני איתך."', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 6 }, { e: 'remember', who: 'kobi', eventId: 'promised-together-2000', significance: 'major' }, { e: 'redheart', key: 'loyaltyReturn', delta: 3 }, { e: 'toast', text: 'הוא הנהן. פעם אחת. אצלו זה חיבוק.', tone: 'plain' }] },
          { id: 'gate5', text: '"אני עם שער 5. אבל אני אמצא אותך אחרי."', then: [{ e: 'rel', who: 'kobi', axis: 'distance', delta: 2 }, { e: 'rel', who: 'asaf', axis: 'bond', delta: 2 }, { e: 'toast', text: '"אחרי." הוא חזר על המילה כאילו היא חדשה.', tone: 'plain' }] },
          { id: 'joke', text: '"אבא, זה 2000. יש פלאפונים."', then: [{ e: 'rel', who: 'kobi', axis: 'familiarity', delta: 2 }, { e: 'wellbeing', key: 'happiness', delta: 2 }, { e: 'toast', text: '"בתשעים גם היו טלפונים. לא היה את מי לתפוס." הוא כמעט חייך.', tone: 'plain' }] },
        ],
      },
      {
        lines: [
          { who: 'קובי', text: 'אלופים. שמעת? לא ממני. מהרדיו, מהשכנים, מהעיתון. ממני לא שמעת, כי לא היית פה.' },
          { who: 'קובי', text: 'יום רביעי יש עוד אחד. תעשה מה שאתה רוצה עם זה.' },
        ],
        choices: [
          { id: 'come', text: '"בוא נלך ביחד. פעם אחת."', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 5 }, { e: 'rel', who: 'kobi', axis: 'distance', delta: -3 }, { e: 'remember', who: 'kobi', eventId: 'asked-together-2000', significance: 'major' }, { e: 'toast', text: 'הוא שתק הרבה זמן. ואז: "בשש. לא בשש וחמישה."', tone: 'plain' }] },
          { id: 'shrug', text: '"נראה."', then: [{ e: 'rel', who: 'kobi', axis: 'distance', delta: 2 }, { e: 'wellbeing', key: 'loneliness', delta: 2 }] },
        ],
      },
    ],
  },
]
