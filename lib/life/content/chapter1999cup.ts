import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * B10 · "שש־עשרה שנה" · 26.5.1999 — the first convergence after the fractures.
 *
 * Getting there is the play: army or work, money, transport, and who will still ride
 * with you. Gate 7 and Gate 5 arrive separately. The basketball-first friends have
 * reasons to be hurt. During the penalties the input controls breath, looking, holding
 * a friend's shoulder or turning away — never the kicks. After the victory the group may
 * reunite, remain divided, or share one temporary embrace. A trophy does not force
 * reconciliation.
 *
 * **No score, no scorer, no opponent's name in a line.** The archive holds 26.5.1999.
 */

export const KICKOFF_99 = at(20, 0)

export const PORTRAIT_CUP99: Record<string, string> = {
  'פוגי': 'faceHero80',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel90',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'אפי': 'faceEfi',
  'לירון': 'faceFan',
  'מישל': 'faceFan',
  'אסף': 'faceFan',
  'שחור': 'faceFan',
  'המפקד': 'faceFan',
  'הבוס': 'faceFan',
  'אוהד': 'faceFan',
}

export function objectiveCup99(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['c99:over']) return null
  if (state.flags['c99:route']) return sceneId === 'ramat-gan' ? null : 'רמת גן. שמונה.'
  return 'גמר גביע. איך מגיעים, ועם מי.'
}

export const ENDINGS_CUP99: Record<string, EndingCard> = {
  together: {
    id: 'together',
    titleHe: 'שש־עשרה שנה',
    bodyHe:
      'היית שם. וכשזה נגמר — כשהשריקה האחרונה סוף־סוף באה — מצאת אותם: את מי שעמד בשער 7 ואת מי שעמד בשער 5, באותו חיבוק, לרגע. לרגע. בדרך הביתה כבר נפרדו לשני אוטובוסים. אבל הרגע היה. שש־עשרה שנה חיכית לו ולא ידעת.',
    memoryHe: 'כרטיס הגמר. שלם. לא קרוע — הסדרן לא הספיק.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  divided: {
    id: 'divided',
    titleHe: 'גביע, בנפרד',
    bodyHe:
      'היית שם. וכשזה נגמר חיפשת אותם ולא מצאת — או מצאת, ולא ניגשת. שער 7 חגג בצד אחד, שער 5 בשני, ואתה באמצע, עם גביע ששייך לכולם ושמחה שלא. הדרך הביתה הייתה ארוכה יותר משהייתה צריכה.',
    memoryHe: 'כרטיס הגמר. בפינה, בעט, שם של מישהו שלא בא.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  late: {
    id: 'late',
    titleHe: 'הגעת לפנדלים',
    bodyHe:
      'הגעת אחרי שהתחילו — הצבא, העבודה, האוטובוס, לא משנה. הגעת לפנדלים. וזה, מסתבר, מה שהיית צריך: לעמוד בכניסה, לא לנשום, ולראות אנשים שאתה אוהב לא נושמים.',
    memoryHe: 'כרטיס קרוע חצי. הסדרן היה עסוק.',
    memoryItem: 'ticket-stub',
    presence: 'late',
  },
  away: {
    id: 'away',
    titleHe: 'גביע מרחוק',
    bodyHe:
      'לא היית. שמעת — או ראית במסך קטן במקום שלא בחרת — ובסוף צעקת לבד. גביע ראשון מאז שהיית בן חמש על הכתפיים, ולא היית. מישהו יתקשר. מישהו יספר. זה לא אותו דבר. גם זה יישאר.',
    memoryHe: 'דף עם שעות שכתבת בזמן ששמעת. בסוף, בכתב גדול: !!!',
    memoryItem: 'folded-paper',
    presence: 'radio',
  },
}

export const BEATS_CUP99: Beat[] = [
  {
    id: 'c99-open',
    at: 'home',
    trigger: 'enter',
    when: { none: [{ flag: 'c99:opened' }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: 'c99:opened' },
      { a: 'events', events: [{ t: 'money.changed', agorot: 7000, why: 'משכורת' }] },
      { a: 'lines', lines: [{ who: null, text: 'יום רביעי, סוף מאי. גמר גביע, הערב, ברמת גן. שש־עשרה שנה מאז שאבא הרים אותך מעל קהל בגמר גביע. אתה לא זוכר אותו. הוא זוכר.' }, { who: null, text: 'יש כרטיס, אולי. יש דרך, אולי. יש אנשים שיסעו איתך — כל אחד באוטו אחר.' }] },
    ],
  },
  // the routes close at their hours
  {
    id: 'c99-late-route',
    trigger: 'clock',
    when: { afterMinute: KICKOFF_99 - 20, none: [{ flag: 'c99:route' }, { flag: 'c99:over' }] },
    do: [{ a: 'flag', flag: 'c99:route' }, { a: 'flag', flag: 'c99:away' }, { a: 'card', titleHe: 'שמונה', subHe: 'לא שם', ms: 2200 }, { a: 'talk', conversation: 'c99-away' }],
  },
  {
    id: 'c99-stadium',
    at: 'ramat-gan',
    trigger: 'enter',
    when: { flag: 'c99:route', none: [{ flag: 'c99:over' }] },
    delayMs: 1000,
    do: [
      { a: 'card', titleHe: 'אצטדיון רמת גן', subHe: 'גמר גביע המדינה', ms: 2600, art: 'plate-1999-cup' },
      { a: 'talk', conversation: 'c99-match' },
    ],
  },
]

export const CONVERSATIONS_CUP99: Conversation[] = [
  {
    id: 'kobi-cup99',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'c99:route' }, lines: [{ who: 'קובי', text: 'שער 7 נוסע באוטובוס של בארי. אני שם. אתה — איפה שאתה.' }] },
      {
        lines: [
          { who: 'קובי', text: 'שמונים ושלוש. היית על הכתפיים שלי. אתה לא זוכר. אני זוכר כל דקה.' },
          { who: 'קובי', text: 'הערב אני נוסע עם החבר\'ה של שער 7. יש מקום. אתה בא איתנו?' },
        ],
        choices: [
          { id: 'with-kobi', text: '"בא איתך."', then: [{ e: 'flag', flag: 'c99:route' }, { e: 'flag', flag: 'c99:with-kobi' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 5 }, { e: 'redheart', key: 'familyTradition', delta: 4 }, { e: 'time', minutes: 90 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
          { id: 'other', text: '"אני מסתדר. נתראה שם."', then: [{ e: 'rel', who: 'kobi', axis: 'distance', delta: 2 }, { e: 'toast', text: '"נתראה שם." הוא לא שאל עם מי.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'liron-cup99',
    nameHe: 'לירון',
    branches: [
      { when: { flag: 'c99:route' }, lines: [{ who: 'לירון', text: 'החלטת. יופי. תדליק רדיו בדרך, שלא תפספס כלום.' }] },
      {
        when: { relationship: { who: 'liron', axis: 'sharedHistory', min: 4 } },
        lines: [{ who: 'לירון', text: 'אותו אוטו. אותו רדיו. הפעם בלי ויכוח בדרך, בסדר? בסדר.' }],
        choices: [
          { id: 'go', text: '"בסדר. נוסעים."', then: [{ e: 'flag', flag: 'c99:route' }, { e: 'flag', flag: 'c99:with-liron' }, { e: 'rel', who: 'liron', axis: 'bond', delta: 4 }, { e: 'time', minutes: 80 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
          { id: 'no', text: '"לא הפעם."', then: [] },
        ],
      },
      { lines: [{ who: 'לירון', text: 'יש לי מקום. אבל אתה לא ממש מכיר אותי, נכון? חבל. בפעם הבאה.' }] },
    ],
  },
  {
    id: 'michel-cup99',
    nameHe: 'מישל',
    branches: [
      { when: { flag: 'c99:route' }, lines: [{ who: 'מישל', text: 'המיניבוס מלא. נתראה ביציע.' }] },
      {
        when: { gateEver: 'gate5' },
        lines: [{ who: 'מישל', text: 'מיניבוס של שער 5. עשרים שקל, יוצאים בשש וחצי מהקיוסק. אסף כבר בפנים עם הבד.' }],
        choices: [
          { id: 'go', text: '"עשרים. בא."', when: { minAgorot: 2000 }, noteHe: 'אין עשרים.', then: [{ e: 'money', agorot: -2000, why: 'מיניבוס של שער 5' }, { e: 'flag', flag: 'c99:route' }, { e: 'flag', flag: 'c99:with-gate5' }, { e: 'rel', who: 'michel', axis: 'bond', delta: 3 }, { e: 'rel', who: 'asaf', axis: 'bond', delta: 3 }, { e: 'time', minutes: 90 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
          { id: 'no', text: '"לא הפעם."', then: [] },
        ],
      },
      { lines: [{ who: 'מישל', text: 'המיניבוס של שער 5. אתה לא משלנו, אבל אם יש מקום — נראה.' }] },
    ],
  },
  {
    id: 'ofir-cup99',
    nameHe: 'אופיר',
    branches: [
      { when: { flag: 'c99:route' }, lines: [{ who: 'אופיר', text: 'תראה אותי שם. או שלא. יש שם ארבעים אלף.' }] },
      {
        lines: [{ who: 'אופיר', text: 'אוטובוס רגיל. עשר שקל, שתי החלפות, ואם מאחרים — מאחרים. אבל זה אנחנו, כמו פעם.' }],
        choices: [
          { id: 'go', text: '"כמו פעם."', when: { minAgorot: 1000 }, noteHe: 'אין עשרה.', then: [{ e: 'money', agorot: -1000, why: 'אוטובוס' }, { e: 'flag', flag: 'c99:route' }, { e: 'flag', flag: 'c99:with-ofir' }, { e: 'flag', flag: 'arrived:late' }, { e: 'rel', who: 'ofir', axis: 'sharedHistory', delta: 5 }, { e: 'time', minutes: 150 }, { e: 'travel', to: 'ramat-gan', spawn: 'start' }] },
          { id: 'no', text: '"לא הפעם."', then: [] },
        ],
      },
    ],
  },
  {
    id: 'efi-cup99',
    nameHe: 'אפי',
    branches: [
      { when: { relationship: { who: 'efi', axis: 'trust', max: 44 } }, lines: [{ who: 'אפי', text: 'כדורגל. יופי. תהנה.' }, { who: null, text: 'הוא לא בא. לא הזמנת. שניכם ידעתם.' }], then: [{ e: 'wellbeing', key: 'regret', delta: 3 }] },
      { lines: [{ who: 'אפי', text: 'אני לא בא. לא בגלל משהו. פשוט — זה שלכם. אני אשמח בשבילכם מפה.' }, { who: null, text: 'הוא אמר "שלכם". פעם היה "שלנו".' }], then: [{ e: 'wellbeing', key: 'regret', delta: 2 }] },
    ],
  },
  {
    id: 'c99-away',
    nameHe: null,
    branches: [
      {
        when: { armyRoute: 'punished' },
        lines: [{ who: null, text: 'הבסיס. שמונה בערב. רדיו של מישהו במסדרון. המפקד עבר, שמע, לא אמר כלום. "שבת הבאה" מאז דצמבר עוד לא נגמרה.' }],
        then: [{ e: 'flag', flag: 'c99:over' }, { e: 'army', key: 'fatigue', delta: 5 }, { e: 'ending', id: 'away' }],
      },
      {
        lines: [{ who: null, text: 'לא יצאת. איפשהו ברמת גן ארבעים אלף אנשים, ואתה עם רדיו. כשזה נגמר צעקת לבד, ומישהו מהקומה למעלה דפק ברצפה.' }],
        then: [{ e: 'flag', flag: 'c99:over' }, { e: 'ending', id: 'away' }],
      },
    ],
  },
  {
    id: 'c99-match',
    nameHe: null,
    branches: [
      {
        when: { flag: 'arrived:late' },
        lines: [{ who: null, text: 'הגעת אחרי שהתחילו. שני האוטובוסים, ההחלפות, אופיר שאמר "זה בסדר" שבע פעמים. נכנסתם בהארכה. האצטדיון היה בתוך משהו שלא ידעת לקרוא.' }],
        then: [{ e: 'goto', node: 'c99-pens' }],
      },
      {
        lines: [
          { who: null, text: 'ארבעים אלף. הקערה הגדולה. הצבע שלכם בצד אחד, הצבע שלהם בשני, והרעש — לא רעש. לחץ. כמו מים.' },
          { who: null, text: 'התשעים דקות: הם קודם. אתם אחר כך. השוויון — האצטדיון עולה באוויר ונשאר שם. הארכה. שקט של אנשים שאין להם כבר קול.' },
          { who: null, text: 'ואז השופט מסתכל בשעון, ואתה יודע מה זה אומר.' },
        ],
        then: [{ e: 'goto', node: 'c99-pens' }],
      },
    ],
  },
  {
    id: 'c99-pens',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'פנדלים.' },
          { who: null, text: 'אין לך שליטה על שום דבר שקורה עכשיו. יש לך שליטה על דבר אחד: מה אתה עושה עם הגוף שלך.' },
        ],
        choices: [
          { id: 'breathe', text: 'לנשום. לאט. להסתכל.', then: [{ e: 'personality', key: 'courage', delta: 2 }, { e: 'flag', flag: 'pens:looked' }, { e: 'goto', node: 'c99-pens-2' }] },
          { id: 'shoulder', text: 'להחזיק כתף של מי שלידך.', then: [{ e: 'redheart', key: 'community', delta: 3 }, { e: 'wellbeing', key: 'belonging', delta: 4 }, { e: 'flag', flag: 'pens:held' }, { e: 'goto', node: 'c99-pens-2' }] },
          { id: 'turn', text: 'להסתובב. לא לראות.', then: [{ e: 'personality', key: 'riskTolerance', delta: -1 }, { e: 'flag', flag: 'pens:turned' }, { e: 'goto', node: 'c99-pens-2' }] },
        ],
      },
    ],
  },
  {
    id: 'c99-pens-2',
    nameHe: null,
    branches: [
      {
        when: { flag: 'pens:turned' },
        lines: [{ who: null, text: 'שמעת את זה בגב. פעם, ופעמיים — השוער. הקהל מאחוריך עשה קול שלא שמעת קודם. ואז השקט הכי ארוך בעולם, ואז—' }, { who: null, text: 'הסתובבת. בזמן.' }],
        then: [{ e: 'goto', node: 'c99-won' }],
      },
      {
        lines: [{ who: null, text: 'השוער. פעם. ואז עוד פעם. אתה לא יודע איך אדם עומד שם. השני, שלכם, ניגש לאט. הרעש נעלם. יש רק את הרגליים שלו.' }, { who: null, text: 'ואז—' }],
        then: [{ e: 'goto', node: 'c99-won' }],
      },
    ],
  },
  {
    id: 'c99-won',
    nameHe: null,
    branches: [
      {
        when: { flag: 'pens:held' },
        lines: [{ who: null, text: 'הכתף שהחזקת קפצה. אתה קפצת איתה. אתה לא יודע מי זה היה. אחר כך התברר שזה היה שחור. או אסף. או אבא. כולם אומרים שזה היה הם.' }],
        then: [{ e: 'sfx', key: 'crowd-goal', level: 0.9 }, { e: 'wellbeing', key: 'happiness', delta: 15 }, { e: 'redheart', key: 'footballLove', delta: 6 }, { e: 'goto', node: 'c99-after' }],
      },
      {
        lines: [{ who: null, text: 'ארבעים אלף אנשים באוויר. אתה ביניהם. גביע. הראשון מאז הכתפיים.' }],
        then: [{ e: 'sfx', key: 'crowd-goal', level: 0.9 }, { e: 'wellbeing', key: 'happiness', delta: 15 }, { e: 'redheart', key: 'footballLove', delta: 6 }, { e: 'goto', node: 'c99-after' }],
      },
    ],
  },
  {
    id: 'c99-after',
    nameHe: null,
    branches: [
      {
        when: { flag: 'arrived:late' },
        lines: [{ who: null, text: 'עמדת בכניסה. אופיר לידך. לא הספקת לחפש אף אחד. זה היה מספיק.' }],
        then: [{ e: 'flag', flag: 'c99:over' }, { e: 'ending', id: 'late' }],
      },
      {
        lines: [
          { who: null, text: 'אחר כך. שער 7 בצד אחד עם הדגלים הישנים. שער 5 בצד השני עם הבד. ובאמצע — אתה.' },
        ],
        choices: [
          { id: 'both', text: 'ללכת לאבא, ואז לאסף. לחבק את שניהם.', when: { gateEver: 'gate5' }, noteHe: 'אף פעם לא עמדת בשער 5. אסף לא מחכה לך.', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 5 }, { e: 'rel', who: 'asaf', axis: 'bond', delta: 4 }, { e: 'redheart', key: 'loyaltyReturn', delta: 5 }, { e: 'flag', flag: 'c99:over' }, { e: 'flag', flag: 'life:cup99:together' }, { e: 'ending', id: 'together' }] },
          { id: 'kobi', text: 'לאבא.', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 6 }, { e: 'remember', who: 'kobi', eventId: 'cup-hug-1999', significance: 'major' }, { e: 'flag', flag: 'c99:over' }, { e: 'flag', flag: 'life:cup99:together' }, { e: 'ending', id: 'together' }] },
          { id: 'gate5', text: 'לאסף ולבד.', when: { gateEver: 'gate5' }, hidden: true, then: [{ e: 'rel', who: 'asaf', axis: 'bond', delta: 5 }, { e: 'rel', who: 'kobi', axis: 'distance', delta: 4 }, { e: 'flag', flag: 'c99:over' }, { e: 'ending', id: 'divided' }] },
          { id: 'alone', text: 'להישאר באמצע. לראות את שניהם מרחוק.', then: [{ e: 'wellbeing', key: 'loneliness', delta: 5 }, { e: 'personality', key: 'independence', delta: 2 }, { e: 'flag', flag: 'c99:over' }, { e: 'ending', id: 'divided' }] },
        ],
      },
    ],
  },
]
