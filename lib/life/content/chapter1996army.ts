import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * B6 · "אין מקום אחד לעמוד בו" · 1996 – אביב 1997 — the centre of the decade.
 *
 * Four days across a winter: the eve of conscription; a Saturday at the ground where the
 * crowd splits around two gates and a boy has to stand somewhere; a dawn at the central
 * bus station where the bus that would get him back to base on time is a bus he will not
 * board; and a Saturday in February when the club is broke, the hero leaves, the club is
 * sold, and Liron's old car goes to an away match with a curfew in the passenger seat.
 *
 * The oral history in the third day is Maor's own and its core is kept exactly: a real
 * deadline, a bus that would make it, the wrong supporters on it, a refusal, two hours
 * late. Everything around it is fiction and says so by being a choice. **No amounts, no
 * scores, no names of buyers or opponents in any line.** The archive holds the season.
 */

export const A1 = 'life:army:d1'
export const A2 = 'life:army:d2'
export const A3 = 'life:army:d3'
export const A4 = 'life:army:d4'
export const A5 = 'life:army:d5'

export const BUS_DEADLINE = at(6, 30)
export const BUS_AT = at(5, 55)

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
}

export function objectiveArmy(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags[A5]) return state.flags['a5:done'] ? null : 'שתי נסיעות, ואפשר אחת. הקיוסק.'
  if (state.flags[A4]) return state.flags['a4:road'] ? null : 'שבת של חורף. הקיוסק, ואוטו של לירון.'
  if (state.flags[A3]) return state.flags['a3:decided'] ? null : 'שש וחצי בבסיס. האוטובוס ברציף.'
  if (state.flags[A2]) {
    if (state.gate.identity !== 'gate7' || state.flags['a2:chose']) return null
    return sceneId === 'gate5' ? 'שער 5. תחליט איפה אתה עומד.' : 'שבת. שער 7 — או שער 5.'
  }
  return state.flags['a1:packed'] ? 'עוד ערב אחד בבית.' : 'מחר בבוקר — הצבא.'
}

export const ENDINGS_ARMY: Record<string, EndingCard> = {
  home: {
    id: 'home',
    titleHe: 'החורף נגמר',
    bodyHe:
      'חזרת לבסיס בזמן, או לא. עמדת בשער 7, או בשער 5, או בפינה שאין לה שם. המועדון נאבק להישאר בליגה, עבר לידיים חדשות, ומספר שבע כבר לא עומד על הקו. בחוץ אביב. בפנים עוד לא.',
    memoryHe: 'טופס חופשה, מקופל. השעה שכתובה בו והשעה שהגעת בה הן לא אותה שעה.',
    memoryItem: 'folded-paper',
    presence: 'radio',
  },
  road: {
    id: 'road',
    titleHe: 'הדרך חזרה',
    bodyHe:
      'האוטו של לירון, בלילה, על כביש ארוך, עם רדיו שתופס תחנה כל שני קילומטר. דיברתם על שער 7 של פעם, כשידיעה עברה מאיש לאיש עם טרנזיסטור. עכשיו יש פייג׳ר. יודעים מהר ולא יודעים יותר טוב. הבסיס חיכה. או שלא.',
    memoryHe: 'קבלה מתחנת דלק. מאחור, בכתב של לירון: "שווה".',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

const DAY = (flag: string, year: number, weekday: number, minute: number, dateHe?: string) =>
  [{ t: 'day.entered', dayId: flag, year, weekday, minute, ...(dateHe ? { dateHe } : {}) } as const, { t: 'flag.raised', flag } as const]

export const BEATS_ARMY: Beat[] = [
  // ---------------------------------------------------------------- A1 · the eve ---
  {
    id: 'a1-open',
    at: 'street',
    trigger: 'enter',
    when: { none: [{ flag: A2 }, { flag: A3 }, { flag: A4 }, { flag: A1 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A1 },
      { a: 'lines', lines: [{ who: null, text: 'נובמבר. שמונה־עשרה. מחר בבוקר אוטובוס, ומחרתיים כבר יגידו לך מתי לקום.' }, { who: null, text: 'אותו רחוב, אותו ריח של שמן עמוק מהפינה. רק שהערב אתה סופר אותו במקום ללכת בו.' }] },
    ],
  },
  {
    id: 'a1-night',
    trigger: 'clock',
    when: { flag: A1, afterMinute: at(21, 0), none: [{ flag: A2 }] },
    do: [
      { a: 'card', titleHe: 'שבת', subHe: 'הראשונה שאתה בא אליה במדים', ms: 2600 },
      { a: 'events', events: DAY(A2, 1996, 6, at(14, 30), '16 בנובמבר 1996') },
      { a: 'travel', to: 'bloomfield-outside', spawn: 'start' },
    ],
  },
  // ---------------------------------------------------------------- A2 · the gates ---
  {
    id: 'a2-open',
    at: 'bloomfield-outside',
    trigger: 'enter',
    when: { flag: A2, none: [{ flag: 'a2:seen' }] },
    delayMs: 800,
    do: [
      { a: 'flag', flag: 'a2:seen' },
      { a: 'talk', conversation: 'a2-arrive' },
    ],
  },
  {
    id: 'a2-close',
    trigger: 'clock',
    when: { all: [{ flag: A2 }, { flag: 'a2:chose' }], none: [{ flag: A3 }] },
    do: [
      { a: 'card', titleHe: 'דצמבר', subHe: 'התחנה המרכזית · שש בבוקר', ms: 2600 },
      { a: 'events', events: DAY(A3, 1996, 0, at(5, 40), 'דצמבר 1996') },
      { a: 'travel', to: 'bus-station', spawn: 'start' },
    ],
  },
  // ---------------------------------------------------------------- A3 · the bus ---
  {
    id: 'a3-open',
    at: 'bus-station',
    trigger: 'enter',
    when: { flag: A3, none: [{ flag: 'a3:seen' }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: 'a3:seen' },
      { a: 'lines', lines: [{ who: null, text: 'התחנה המרכזית. חמש וארבעים. אוויר של סיגריות ודלק ולחם. בשש וחצי אתה צריך להיות בשער של הבסיס, וזה שעה נסיעה.' }, { who: null, text: 'יש אוטובוס אחד שמגיע בזמן, והוא כבר ברציף. אגד רגיל, קו רגיל — רק שהצדדים שלו צבועים בסמלים של בית"ר ירושלים. בימי משחק הוא מסיע אותם. היום הוא מסיע את כולם.' }] },
    ],
  },
  {
    id: 'a3-bus-arrives',
    trigger: 'clock',
    when: { flag: A3, afterMinute: BUS_AT, none: [{ flag: 'a3:decided' }, { flag: 'a3:bus-here' }] },
    do: [{ a: 'flag', flag: 'a3:bus-here' }, { a: 'sfx', key: 'bus-door', level: 0.7 }, { a: 'toast', text: 'הנהג מתניע. הדלת פתוחה. חמש חמישים וחמש.', tone: 'red' }],
  },
  {
    id: 'a3-bus-leaves',
    trigger: 'clock',
    when: { flag: A3, afterMinute: BUS_AT + 8, none: [{ flag: 'a3:decided' }] },
    do: [{ a: 'flag', flag: 'a3:decided' }, { a: 'flag', flag: 'a3:hesitated' }, { a: 'talk', conversation: 'a3-left-behind' }],
  },
  {
    id: 'a3-to-a4',
    trigger: 'clock',
    when: { flag: 'a3:done', none: [{ flag: A4 }] },
    do: [
      { a: 'card', titleHe: 'פברואר', subHe: 'החורף של המועדון', ms: 2600, art: 'plate-1996-army' },
      { a: 'events', events: DAY(A4, 1997, 6, at(13, 0), 'חורף 1997') },
      { a: 'travel', to: 'kiosk', spawn: 'start' },
    ],
  },
  // ---------------------------------------------------------------- A4 · the winter ---
  {
    id: 'a4-open',
    at: 'kiosk',
    trigger: 'enter',
    when: { flag: A4, none: [{ flag: 'a4:seen' }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: 'a4:seen' },
      { a: 'events', events: [{ t: 'money.changed', agorot: 6000, why: 'משכורת של חייל' }] },
      { a: 'talk', conversation: 'a4-winter' },
    ],
  },

  /**
   * ---------------------------------------------------- A5 · שני מסעות ---
   *
   * שתי הנסיעות — the two journeys, and they are the user's, not the game's.
   *
   * Stage B §19 is the personal oral-history layer, and it lists two confirmed 1990s
   * memories with their details still pending: hitchhiking north to a Toto Cup match
   * because only about ten supporters went and no bus left, and a promised lift that was
   * forgotten, after which supporters in the stand collected taxi money so he reached the
   * match. Maor asked on 6.9.2026 that both be built now, WITHOUT dates.
   *
   * So neither states a date, an opponent, a competition round or a result. The Toto Cup
   * and the road north are his words; everything around them is the journey, the people and
   * the money, which is what §6 says supporter culture actually is — "seats, calls, coins,
   * and a noticed absence".
   *
   * They are also a choice and not a checklist. One winter afternoon, one wallet, one
   * curfew: taking one is giving up the other, which is §11 — no route attends everything
   * without paying time, trust, money or a relationship.
   */
  {
    id: 'a5-open',
    at: 'kiosk',
    trigger: 'enter',
    when: { flag: 'a4:done', none: [{ flag: A5 }] },
    delayMs: 700,
    do: [
      { a: 'events', events: DAY(A5, 1997, 4, at(14, 30), 'חורף 1997') },
      { a: 'lines', lines: [
        { who: null, text: 'אחרי הצבא ולפני האוטובוס. שעתיים בכיס, ארבעים שקל, ושתי שיחות שקורות באותו רגע ליד הדלפק.' },
      ] },
    ],
  },
  {
    id: 'a5-night',
    trigger: 'clock',
    waitingHe: 'ממתין: מישהו יחליט משהו',
    when: { flag: A5, afterMinute: at(21, 30), none: [{ flag: 'a5:done' }] },
    do: [
      { a: 'flag', flag: 'a5:done' },
      { a: 'lines', lines: [{ who: null, text: 'בסוף לא נסעת לשום מקום. בבוקר, בבסיס, שאלו איך היה, ואמרת "לא הלכתי", וזה נשמע כמו משהו אחר ממה שהתכוונת.' }] },
      { a: 'ending', id: 'home' },
    ],
  },

]

export const CONVERSATIONS_ARMY: Conversation[] = [
  // ================================================================== A1 ==
  {
    id: 'rachel-army',
    nameHe: 'רחל',
    branches: [
      { when: { flag: 'a1:packed' }, lines: [{ who: 'רחל', text: 'ארזת? יופי. תאכל. לא, לא "אחר כך". עכשיו.' }] },
      {
        lines: [
          { who: 'רחל', text: 'שמתי לך גרביים. שמתי לך עוד גרביים. אמרו לי שאף פעם אין מספיק גרביים.' },
          { who: 'רחל', text: 'ותשמע. שם, בבסיס, כשיהיה משחק בשבת — לא לעשות שטויות. שומע? הצבא זה לא שער 7.' },
        ],
        choices: [
          { id: 'promise', text: '"לא אעשה שטויות."', then: [{ e: 'flag', flag: 'a1:packed' }, { e: 'flag', flag: 'promise:rachel-army' }, { e: 'rel', who: 'rachel', axis: 'trust', delta: 3 }] },
          { id: 'honest', text: '"אני לא מבטיח."', then: [{ e: 'flag', flag: 'a1:packed' }, { e: 'rel', who: 'rachel', axis: 'trust', delta: -1 }, { e: 'personality', key: 'independence', delta: 2 }, { e: 'toast', text: 'היא לא כעסה. היא ידעה.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'ofir-army',
    nameHe: 'אופיר',
    branches: [
      {
        lines: [
          { who: 'אופיר', text: 'מחר, אה. תשמע, יש בשער משהו חדש. חבר\'ה צעירים, מהצד השני של היציע. שער 5. שרים אחרת. עומדים אחרת.' },
          { who: 'אופיר', text: 'אבא שלך לא אוהב את זה. בארי לא אוהב את זה. אני? אני אוהב את מה שעושה רעש.' },
        ],
        then: [{ e: 'flag', flag: 'knows:gate5' }, { e: 'rel', who: 'ofir', axis: 'familiarity', delta: 2 }],
      },
    ],
  },
  {
    id: 'kobi-army',
    nameHe: 'קובי',
    branches: [
      {
        lines: [{ who: 'קובי', text: 'בשבת אני בשער 7. אם תצא — תדע איפה אני. אני לא זז משם. לא זזתי עשרים שנה.' }],
        then: [{ e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 2 }],
      },
    ],
  },
  // ================================================================== A2 ==
  {
    id: 'a2-arrive',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'בלומפילד בשבת, במדים. הסדרן הסתכל על המדים ולא על הכרטיס.' },
          { who: null, text: 'מבחוץ שומעים שני קולות. מימין, שער 7: שתי מילים חוזרות שאתה יודע מגיל שמונה, איטיות, של אנשים ששרים אותן עשרים שנה. משמאל, מתחת ליציע, תוף.' },
          { who: 'קובי', text: 'פוגי! פה!' },
          { who: null, text: 'ומהצד השני, מישהו שאתה לא מכיר: "חייל! בוא תראה משהו."' },
        ],
      },
    ],
  },
  {
    id: 'kobi-gate7',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'a2:chose', gateIs: 'gate7' }, lines: [{ who: 'קובי', text: 'פה. איפה שתמיד.' }, { who: null, text: 'הוא לא שאל למה. הוא לא היה צריך.' }] },
      { when: { flag: 'a2:chose', gateIs: 'gate5' }, lines: [{ who: 'קובי', text: 'לך. לך לשם. אני לא אחזיק אותך.' }, { who: null, text: 'הוא הסתכל למגרש כשאמר את זה. לא עליך.' }] },
      { when: { flag: 'a2:chose' }, lines: [{ who: 'קובי', text: 'אתה לא פה ולא שם. תחליט מתישהו. זה לא מקום, זה בין.' }] },
      {
        lines: [
          { who: 'קובי', text: 'שמעת אותם? מתחת ליציע? עשרים שנה שרים פה אותו שיר, ופתאום צריך תוף.' },
          { who: 'בארי', text: 'תעזוב, קובי. גם אנחנו היינו פעם רעש.' },
          { who: 'קובי', text: 'היינו רעש בשער 7. לא מתחתיו.' },
        ],
        choices: [
          { id: 'stay', text: 'להישאר פה. ליד אבא.', then: [{ e: 'flag', flag: 'a2:chose' }, { e: 'gate', to: 'gate7', reason: 'family' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 4 }, { e: 'redheart', key: 'familyTradition', delta: 4 }, { e: 'remember', who: 'kobi', eventId: 'stayed-gate7-1996', significance: 'major' }, { e: 'goto', node: 'a2-after' }] },
          { id: 'look', text: '"אני הולך לראות. אני חוזר."', then: [{ e: 'flag', flag: 'a2:looked' }, { e: 'toast', text: '"תחזור," הוא אמר, כמו שאומרים משהו שלא בטוחים בו.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'barry-gate7',
    nameHe: 'בארי',
    branches: [
      {
        lines: [{ who: 'בארי', text: 'אבא שלך צודק וטועה באותו משפט. ראיתי את זה קורה פה לאנשים טובים. תעמוד איפה שתעמוד — רק שזה יהיה אתה שהחלטת.' }],
        then: [{ e: 'rel', who: 'barry', axis: 'familiarity', delta: 4 }, { e: 'personality', key: 'independence', delta: 1 }],
      },
    ],
  },
  {
    id: 'asaf-gate5',
    nameHe: 'אסף',
    branches: [
      { when: { gateIs: 'gate5' }, lines: [{ who: 'אסף', text: 'אתה פה. יופי. בשבוע הבא אתה מגיע שעה לפני ומחזיק בד. אין "אני רק בא לשיר".' }] },
      {
        lines: [
          { who: null, text: 'מתחת ליציע. תוף, עשרים בחורים, בד שמישהו צייר ביד. אסף באמצע, לא שר — מסתכל.' },
          { who: 'אסף', text: 'חייל. תשמע טוב: פה לא באים לראות משחק. פה עובדים. סוחבים, תולים, מגיעים שעה לפני. כבוד מקבלים אחר כך, אם בכלל.' },
          { who: 'מלמד', text: 'תן לו לשמוע קודם. (מלמד, עם דרבוקה בין הברכיים, מנסה קצב.) ככה? או ככה?' },
        ],
        choices: [
          { id: 'join', text: '"אני איתכם."', then: [{ e: 'flag', flag: 'a2:chose' }, { e: 'gate', to: 'gate5', reason: 'friends' }, { e: 'rel', who: 'asaf', axis: 'trust', delta: 3 }, { e: 'rel', who: 'kobi', axis: 'tension', delta: 5 }, { e: 'redheart', key: 'terraceCulture', delta: 5 }, { e: 'remember', who: 'asaf', eventId: 'joined-gate5-1996', significance: 'major' }, { e: 'goto', node: 'a2-after' }] },
          { id: 'rhythm', text: 'לענות למלמד: "ככה." (הראשון)', then: [{ e: 'sfx', key: 'darbuka-three-two', level: 0.8 }, { e: 'flag', flag: 'life:melamed:rhythm' }, { e: 'rel', who: 'melamed', axis: 'bond', delta: 4 }, { e: 'redheart', key: 'terraceCulture', delta: 2 }, { e: 'toast', text: 'מלמד ניגן את זה שוב. ושוב. אתה לא יודע עוד מה עשית.', tone: 'plain' }] },
          { id: 'back', text: '"אני חוזר לאבא."', then: [{ e: 'flag', flag: 'a2:chose' }, { e: 'gate', to: 'gate7', reason: 'family' }, { e: 'rel', who: 'asaf', axis: 'distance', delta: 3 }, { e: 'goto', node: 'a2-after' }] },
          { id: 'neither', text: 'ללכת. לא לפה ולא לשם.', then: [{ e: 'flag', flag: 'a2:chose' }, { e: 'gate', to: 'outside', reason: 'conflict' }, { e: 'wellbeing', key: 'loneliness', delta: 6 }, { e: 'goto', node: 'a2-after' }] },
        ],
      },
    ],
  },
  {
    id: 'a2-after',
    nameHe: null,
    branches: [
      { when: { gateIs: 'gate5' }, lines: [{ who: null, text: 'מהמקום החדש רואים את שער 7 באלכסון. בהפסקה אנשים נצמדים לגדר שבין 5 ל-7 ומדברים דרכה. אבא לא בא לגדר.' }, { who: null, text: 'התוף לא הפסיק תשעים דקות. בסוף לא שמעת אותו. הוא היה בפנים.' }] },
      { when: { gateIs: 'outside' }, lines: [{ who: null, text: 'עמדת ליד הגדר שבין 5 ל-7 — מקום שעוברים בו בהפסקה ולא עומדים בו במשחק. ראית תשעים דקות לבד. זה היה הדבר הכי לא־בלומפילד שעשית.' }] },
      { lines: [{ who: null, text: 'שער 7. השיר האיטי. הכתף של אבא ליד הכתף שלך. ומתחת ליציע, כל המשחק, תוף שאתה שומע ולא רואה.' }] },
    ],
  },
  // ================================================================== A3 ==
  {
    id: 'a3-bus',
    nameHe: null,
    branches: [
      { when: { flag: 'a3:decided' }, lines: [{ who: null, text: 'הרציף ריק. החלטת.' }] },
      {
        when: { flag: 'a3:bus-here' },
        lines: [
          { who: null, text: 'האוטובוס. הנהג בדלת: "חייל, עולה? אני נוסע דרך הצומת שלך. בזמן."' },
          { who: null, text: 'אגד רגיל, קו רגיל — והצדדים שלו צבועים בסמלים של בית"ר ירושלים, כי בימי משחק הוא מסיע אותם. השעון בתחנה אומר חמש חמישים ושש, וזה שלושים וארבע דקות לשער של הבסיס.' },
        ],
        choices: [
          { id: 'refuse', text: '"לא. לא על האוטובוס הזה."', then: [{ e: 'sfx', key: 'bus-door', level: 0.6, delayMs: 900 }, { e: 'consequence', id: 'a3:refused', text: 'האוטובוס יצא. בלעדיך.', laterText: 'שעתיים איחור. זה יירשם.', afterMinutes: 30 }, { e: 'plate', art: 'armyRoom', titleHe: 'הבסיס', subHe: 'שעתיים אחרי השעה', ms: 2600 }, { e: 'flag', flag: 'a3:decided' }, { e: 'flag', flag: 'life:bus:refused' }, { e: 'redheart', key: 'loyaltyReturn', delta: 6 }, { e: 'personality', key: 'stubbornness', delta: 4 }, { e: 'goto', node: 'a3-refused' }] },
          { id: 'board', text: 'לעלות. לשתוק. להגיע בזמן.', then: [{ e: 'flag', flag: 'a3:decided' }, { e: 'flag', flag: 'life:bus:boarded' }, { e: 'wellbeing', key: 'regret', delta: 8 }, { e: 'redheart', key: 'loyaltyReturn', delta: -3 }, { e: 'personality', key: 'responsibility', delta: 2 }, { e: 'goto', node: 'a3-boarded' }] },
          { id: 'other', text: 'לרוץ לחפש רציף אחר.', then: [{ e: 'flag', flag: 'a3:decided' }, { e: 'flag', flag: 'life:bus:searched' }, { e: 'personality', key: 'streetSmarts', delta: 2 }, { e: 'goto', node: 'a3-searched' }] },
          { id: 'wait', text: 'לעמוד. עוד רגע.', then: [{ e: 'personality', key: 'impulsiveness', delta: -1 }, { e: 'toast', text: 'הנהג הסתכל בשעון. אתה הסתכלת באוטובוס.', tone: 'plain' }] },
        ],
      },
      { lines: [{ who: null, text: 'הרציף. עוד אין אוטובוס. יש שעון, ויש לך תחושה שאתה כבר יודע מה תעשה.' }] },
    ],
  },
  {
    id: 'a3-refused',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הנהג משך בכתפיים וסגר. האוטובוס יצא עם השירים שלו. הרציף נשאר עם השעון.' },
          { who: null, text: 'קו אחר, צומת אחר, והמתנה על מעקה. איך הגעת זה כבר לא הסיפור. הגעת שעתיים אחרי השעה.' },
          { who: 'המפקד', text: 'שעתיים.' },
          { who: 'פוגי', text: 'שעתיים.' },
          { who: 'המפקד', text: 'סיבה?' },
        ],
        choices: [
          { id: 'truth', text: '"האוטובוס בזמן היה ממותג בית"ר. לא עליתי."', then: [{ e: 'army', key: 'commanderTrust', delta: -15 }, { e: 'army', key: 'leaveDebt', delta: 1 }, { e: 'armyRoute', route: 'rebellious' }, { e: 'flag', flag: 'a3:done' }, { e: 'toast', text: 'הוא הסתכל עליך זמן ארוך. ואז כתב משהו. לא ידעת אם זה עונש או סיפור.', tone: 'plain' }] },
          { id: 'lie', text: '"האוטובוס התקלקל."', then: [{ e: 'army', key: 'commanderTrust', delta: -5 }, { e: 'flag', flag: 'life:lied:army' }, { e: 'personality', key: 'streetSmarts', delta: 1 }, { e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'flag', flag: 'a3:done' }, { e: 'toast', text: 'עבד. פעם אחת זה עובד.', tone: 'plain' }] },
          { id: 'silent', text: 'לשתוק.', then: [{ e: 'army', key: 'commanderTrust', delta: -20 }, { e: 'armyRoute', route: 'punished' }, { e: 'army', key: 'leaveDebt', delta: 2 }, { e: 'flag', flag: 'a3:done' }, { e: 'toast', text: 'שבת הבאה — בבסיס. הוא לא צעק. הוא רק אמר.', tone: 'red' }] },
        ],
      },
    ],
  },
  {
    id: 'a3-boarded',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'ישבת מאחור, עם התיק על הברכיים, ושתקת שעה. הם שרו כל הדרך. אחד הציע לך גרעינים. לקחת. זה היה הדבר הכי גרוע.' },
          { who: null, text: 'הגעת בזמן. המפקד לא ידע כלום. אתה ידעת.' },
        ],
        then: [{ e: 'army', key: 'commanderTrust', delta: 3 }, { e: 'armyRoute', route: 'trusted' }, { e: 'flag', flag: 'a3:done' }],
      },
    ],
  },
  {
    id: 'a3-searched',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'רצת בין הרציפים. אין. יש אחד בשש וחצי לעיר אחרת, ומשם — לא ידעת. עלית עליו בכל זאת.' },
          { who: null, text: 'הגעת בשמונה ורבע. שעה ושלושת רבעי. המפקד שאל. אמרת "אוטובוסים". זה היה נכון, בערך.' },
        ],
        then: [{ e: 'army', key: 'commanderTrust', delta: -8 }, { e: 'armyRoute', route: 'negotiator' }, { e: 'redheart', key: 'travelDrive', delta: 2 }, { e: 'flag', flag: 'a3:done' }],
      },
    ],
  },
  {
    id: 'a3-left-behind',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'לא עלית ולא ירדת. עמדת. הנהג סגר את הדלת בעצמו. האוטובוס יצא, והחלטת בלי להחליט.' },
          { who: null, text: 'שעתיים איחור. המפקד שאל "למה". לא היה לך סיפור. זה היה יותר גרוע מלא להיות שם.' },
        ],
        then: [{ e: 'army', key: 'commanderTrust', delta: -12 }, { e: 'army', key: 'leaveDebt', delta: 1 }, { e: 'personality', key: 'impulsiveness', delta: -2 }, { e: 'flag', flag: 'a3:done' }],
      },
    ],
  },
  {
    id: 'yaron-base',
    nameHe: 'ירון',
    branches: [
      { when: { flag: 'life:bus:refused' }, lines: [{ who: 'ירון', text: 'שמעתי. האוטובוס. אתה יודע שזה או הסיפור הכי טוב שלך או הכי מטומטם, ותלוי מי מספר.' }, { who: 'פוגי', text: 'תלוי מי מספר.' }], then: [{ e: 'rel', who: 'yaron', axis: 'familiarity', delta: 5 }] },
      { lines: [{ who: 'ירון', text: 'ירון, מהאוהל ליד. אם מישהו יספר לך מי אבא שלי — תגיד שכבר שמעת ותעבור נושא. אתה מהפועל? אז אנחנו מסתדרים.' }], then: [{ e: 'rel', who: 'yaron', axis: 'familiarity', delta: 4 }] },
    ],
  },
  // ================================================================== A4 ==
  {
    id: 'a4-winter',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'פברואר. הקיוסק, שבת בצהריים. הפעם לא מדברים על מאמן. מדברים על כסף.' },
          { who: 'עמית', text: 'אל תסתכל עלי, תסתכל בטבלה. אנחנו נאבקים להישאר בליגה. והמאמן הלך באמצע השבוע, אחרי כל השנים.' },
          { who: 'פרדי', text: 'וזה עוד לא הכל. ההסתדרות מוכרת, ויש קבוצת אנשי עסקים. זה יכול להציל את המועדון וזה יכול לקנות אותו. שני הדברים נכונים באותו רגע.' },
          { who: 'רפי מהקיוסק', text: 'העיקר שיהיה מועדון. לא אכפת לי של מי.' },
          { who: 'אוהד', text: 'לי אכפת.' },
        ],
        choices: [
          { id: 'sinai', text: 'על המאמן: "הוא לימד אותי מה זו החולצה הזאת. הוא כבר לא התשובה."', then: [{ e: 'sinai', stance: 'broken' }, { e: 'flag', flag: 'life:sinai:broken' }, { e: 'wellbeing', key: 'regret', delta: 4 }, { e: 'redheart', key: 'historyMemory', delta: 3 }, { e: 'goto', node: 'a4-liron' }] },
          { id: 'reconcile', text: '"אני עדיין אוהב את השחקן. על המאמן — נדבר בעוד עשר שנים."', then: [{ e: 'sinai', stance: 'reconciled-memory' }, { e: 'flag', flag: 'life:sinai:reconciled' }, { e: 'personality', key: 'empathy', delta: 2 }, { e: 'redheart', key: 'loyaltyReturn', delta: 3 }, { e: 'goto', node: 'a4-liron' }] },
          { id: 'protest', text: 'על המכירה: "אז נלך למשרדים. שיראו אותנו."', then: [{ e: 'institution', key: 'protestEscalation', delta: 8 }, { e: 'institution', key: 'footballOwnershipTrust', delta: -5 }, { e: 'rel', who: 'freddy', axis: 'tension', delta: 3 }, { e: 'goto', node: 'a4-freddy' }] },
          { id: 'legal', text: 'לפרדי: "מה חוקי לעשות, ומה לא?"', then: [{ e: 'institution', key: 'legalUnderstanding', delta: 8 }, { e: 'rel', who: 'freddy', axis: 'trust', delta: 4 }, { e: 'goto', node: 'a4-freddy' }] },
        ],
      },
    ],
  },
  {
    id: 'a4-freddy',
    nameHe: 'פרדי',
    branches: [
      {
        lines: [
          { who: 'פרדי', text: 'חוקי: לעמוד, לצעוק, לכתוב, לחתום. לא חוקי: לשבור, לאיים, לחסום. ההבדל הוא לא מוסר, הוא מה שיישאר לכם למחרת.' },
          { who: 'פרדי', text: 'ומי שרוצה שיהיה לו יום אחד מה להגיד על המועדון הזה — שילמד לקרוא מאזן. לא היום. אבל שיתחיל.' },
        ],
        then: [{ e: 'institution', key: 'supporterOwnershipSeed', delta: 6 }, { e: 'goto', node: 'a4-liron' }],
      },
    ],
  },
  {
    id: 'a4-liron',
    nameHe: 'לירון',
    branches: [
      {
        lines: [
          { who: null, text: 'בדלת, גבר עם צרור מפתחות ביד ומעיל שראה חורפים. לירון. פתח לך פעם טרנזיסטור על שולחן המטבח שלו, בחיים אחרים.' },
          { who: 'לירון', text: 'משחק חוץ הערב. יש לי אוטו, יש לי רדיו שתופס חצי, ויש לי מקום אחד. אתה חייל, יש לך שעה שצריך לחזור בה?' },
        ],
        choices: [
          { id: 'go', text: '"יש. אני נוסע."', when: { armyAbove: { key: 'commanderTrust', min: 25 } }, noteHe: 'אחרי מה שהיה — אין חופשה.', then: [{ e: 'flag', flag: 'a4:road' }, { e: 'army', key: 'leaveDebt', delta: 1 }, { e: 'redheart', key: 'travelDrive', delta: 4 }, { e: 'plate', art: 'lironCar', titleHe: 'האוטו של לירון', subHe: 'לילה. כביש. רדיו.', ms: 2600 }, { e: 'goto', node: 'road-1' }] },
          { id: 'go-anyway', text: '"אין לי חופשה. נוסע בכל זאת."', when: { armyBelow: { key: 'commanderTrust', max: 24 } }, noteHe: 'המפקד סומך עליך. אתה לא זורק את זה על משחק.', then: [{ e: 'flag', flag: 'a4:road' }, { e: 'flag', flag: 'life:awol' }, { e: 'army', key: 'commanderTrust', delta: -20 }, { e: 'armyRoute', route: 'punished' }, { e: 'personality', key: 'riskTolerance', delta: 4 }, { e: 'plate', art: 'lironCar', titleHe: 'האוטו של לירון', subHe: 'לילה. כביש. רדיו.', ms: 2600 }, { e: 'goto', node: 'road-1' }] },
          { id: 'stay', text: '"לא הפעם. אני חוזר לבסיס."', then: [{ e: 'army', key: 'commanderTrust', delta: 6 }, { e: 'personality', key: 'reliability', delta: 3 }, { e: 'wellbeing', key: 'regret', delta: 4 }, { e: 'flag', flag: 'a4:road' }, { e: 'presence', mode: 'army' }, { e: 'ending', id: 'home' }] },
        ],
      },
    ],
  },
  {
    id: 'road-1',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'האוטו של לירון: ישן, נקי, עם שקית סוכריות בדלת ומברג בתא הכפפות. הרדיו תופס תחנה, מאבד, תופס.' },
          { who: 'לירון', text: 'פעם, בשער 7, ידיעה עברה מאיש לאיש. אחד עם טרנזיסטור, אחד שמעביר הלאה. היום יש פייג׳ר. יודעים מהר, לא יודעים יותר טוב.' },
          { who: null, text: 'חצי דרך. מחוג הדלק נמוך, ותחנה אחת לפני הכביש הארוך. חייל מקבל שישים שקל בחודש, ודלק לחצי דרך עולה שלושים.' },
        ],
        choices: [
          { id: 'fuel', text: 'לשלם חצי דלק. שלושים שקל.', when: { minAgorot: 3000 }, noteHe: 'אין.', then: [{ e: 'money', agorot: -3000, why: 'דלק, חצי' }, { e: 'rel', who: 'liron', axis: 'trust', delta: 4 }, { e: 'goto', node: 'road-2' }] },
          { id: 'food', text: 'לקנות אוכל לשניכם בתחנה. חמישה־עשר.', when: { minAgorot: 1500 }, noteHe: 'אין.', then: [{ e: 'money', agorot: -1500, why: 'אוכל בתחנה' }, { e: 'rel', who: 'liron', axis: 'bond', delta: 3 }, { e: 'goto', node: 'road-2' }] },
          { id: 'nothing', text: 'לשתוק. הוא הציע, לא אתה.', then: [{ e: 'rel', who: 'liron', axis: 'trust', delta: -2 }, { e: 'goto', node: 'road-2' }] },
        ],
      },
    ],
  },
  {
    id: 'road-2',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הכביש הארוך. לירון מדבר על המכירה, אתה על המאמן, ובאמצע זה נהיה ויכוח. לא צעקות. גרוע יותר — שקט.' },
          { who: 'לירון', text: 'אני יכול לעצור בצומת. יש משם אוטובוס. אני לא נעלב. אני רק שואל.' },
        ],
        choices: [
          { id: 'stay', text: '"תמשיכי. אני איתך."', then: [{ e: 'rel', who: 'liron', axis: 'sharedHistory', delta: 6 }, { e: 'personality', key: 'empathy', delta: 2 }, { e: 'goto', node: 'road-3' }] },
          { id: 'bus', text: '"תעצרי. אני אמשיך באוטובוס."', then: [{ e: 'rel', who: 'liron', axis: 'distance', delta: 5 }, { e: 'personality', key: 'stubbornness', delta: 3 }, { e: 'flag', flag: 'road:bus' }, { e: 'goto', node: 'road-3' }] },
        ],
      },
    ],
  },
  {
    id: 'road-3',
    nameHe: null,
    branches: [
      {
        when: { flag: 'road:bus' },
        lines: [{ who: null, text: 'האוטובוס איחר. הגעת אחרי שהתחילו. לירון עמד בשער וחיכה לך, עם הכרטיס שלך ביד. לא אמר כלום.' }, { who: null, text: 'המשחק היה מה שהיה. הדרך חזרה — כל אחד לחוד.' }],
        then: [{ e: 'presence', mode: 'late' }, { e: 'goto', node: 'road-back' }],
      },
      {
        lines: [{ who: null, text: 'הגעתם בזמן. משחק חוץ של חורף, קהל של מאה, וכל אחד מהמאה מכיר את השני. הרדיו של לירון סיפר לכם על המשחק שלכם בזמן שעמדתם בו.' }],
        then: [{ e: 'presence', mode: 'inside' }, { e: 'redheart', key: 'community', delta: 3 }, { e: 'goto', node: 'road-back' }],
      },
    ],
  },
  {
    id: 'road-back',
    nameHe: null,
    branches: [
      {
        when: { flag: 'life:awol' },
        lines: [{ who: null, text: 'הדרך חזרה, בלילה, כשאתה יודע שבשער של הבסיס מחכה שיחה. לירון הוריד אותך שני רחובות לפני. "היה שווה?" "היה." "טוב. תגיד להם שהיה."' }],
        then: [{ e: 'army', key: 'leaveDebt', delta: 2 }, { e: 'flag', flag: 'a4:done' }, { e: 'ending', id: 'road' }],
      },
      {
        lines: [{ who: null, text: 'הדרך חזרה. תחנת דלק אחת, רדיו אחד, שיחה אחת שלא נגמרה. הגעת לבסיס בדקה האחרונה של החופשה, כמו שצריך.' }],
        then: [{ e: 'army', key: 'commanderTrust', delta: 2 }, { e: 'flag', flag: 'a4:done' }, { e: 'ending', id: 'road' }],
      },
    ],
  },
  {
    id: 'a5-kiosk',
    nameHe: 'רפי מהקיוסק',
    branches: [
      {
        when: { flag: 'a5:done' },
        lines: [{ who: 'רפי מהקיוסק', text: 'נסעת? יופי. עכשיו לך לישון, יש לך בסיס בבוקר.' }],
      },
      {
        lines: [
          { who: 'רפי מהקיוסק', text: 'שניים ביקשו ממני להעביר לך הודעה, ואני לא דואר.' },
          { who: 'רפי מהקיוסק', text: 'אחד: יש משחק בצפון, גביע הטוטו, ואין הסעה כי נוסעים בערך עשרה. אם אתה רוצה — אתה מוצא דרך.' },
          { who: 'רפי מהקיוסק', text: 'שתיים: מישהו הבטיח לאסוף אותך למשחק ולא בא. הוא הבטיח, ולא בא.' },
          { who: null, text: 'אתה יכול להספיק אחד. לא שניים.' },
        ],
        choices: [
          {
            id: 'north',
            text: 'לצאת צפונה. בטרמפים.',
            then: [
              { e: 'flag', flag: 'a5:north' },
              { e: 'redheart', key: 'travelDrive', delta: 6 },
              { e: 'personality', key: 'riskTolerance', delta: 3 },
              { e: 'goto', node: 'a5-north-1' },
            ],
          },
          {
            id: 'wait',
            text: 'לחכות להסעה שהבטיחו.',
            then: [{ e: 'flag', flag: 'a5:pickup' }, { e: 'goto', node: 'a5-pickup-1' }],
          },
          { id: 'neither', text: 'לחזור לבסיס מוקדם.', then: [{ e: 'army', key: 'commanderTrust', delta: 5 }, { e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'flag', flag: 'a5:done' }, { e: 'ending', id: 'home' }] },
        ],
      },
    ],
  },
  {
    /** the road north — the journey IS the unit, per §7 B6 */
    id: 'a5-north-1',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'בצומת שבקצה העיר עומדים שניים שאתה מכיר מהיציע ואחד שלא. ארבעה אנשים, יד אחת מורמת, וכל אוטו שעובר הוא הימור.' },
          { who: null, text: 'הראשון שעצר לקח שניים. אמרו לך "תמשיך אחרינו" והלכו.' },
        ],
        choices: [
          {
            id: 'alone',
            text: 'להישאר בצומת לבד.',
            then: [
              { e: 'personality', key: 'stubbornness', delta: 3 },
              { e: 'wellbeing', key: 'loneliness', delta: 3 },
              { e: 'time', minutes: 55 },
              { e: 'goto', node: 'a5-north-2' },
            ],
          },
          {
            id: 'pair',
            text: 'לעצור עם השלישי ולנסות ביחד.',
            then: [
              { e: 'redheart', key: 'community', delta: 4 },
              { e: 'rel', who: 'shachor', axis: 'familiarity', delta: 2 },
              { e: 'time', minutes: 35 },
              { e: 'goto', node: 'a5-north-2' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'a5-north-2',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'משאית, אחר כך מסחרית, אחר כך אחד שנסע לחתונה והוריד אותך במקום הלא נכון. שלוש שעות, ארבעה אוטואים, וגשם קטן שלא הפסיק.' },
          { who: null, text: 'בשער היו בערך עשרה. אתה הכרת שמונה מהם.' },
          { who: null, text: 'אחד מהם אמר "אתה הגעת בטרמפים?" ואז לא אמר כלום, וזה היה הדבר הכי טוב ששמעת באותו חורף.' },
        ],
        then: [
          { e: 'presence', mode: 'inside' },
          { e: 'flag', flag: 'life:north:hitched' },
          { e: 'redheart', key: 'travelDrive', delta: 5 },
          { e: 'redheart', key: 'community', delta: 4 },
          { e: 'remember', who: 'shachor', eventId: 'hitched-north', significance: 'major' },
          { e: 'flag', flag: 'a5:done' },
          { e: 'ending', id: 'road' },
        ],
      },
    ],
  },
  {
    /** the lift that never came, and the coins that made up for it */
    id: 'a5-pickup-1',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'עמדת בפינה שסיכמתם עליה. ארבע וחצי, חמש פחות רבע, חמש. האוטו לא בא.' },
          { who: null, text: 'בטלפון הציבורי אין תשובה. בכיס יש ארבעים שקל, ומונית לשם עולה יותר.' },
        ],
        choices: [
          {
            id: 'ask',
            text: 'ללכת לשער ולהגיד שאין לך.',
            then: [
              { e: 'personality', key: 'courage', delta: 3 },
              { e: 'goto', node: 'a5-pickup-2' },
            ],
          },
          {
            id: 'home',
            text: 'ללכת הביתה ולא להגיד לאף אחד.',
            then: [
              { e: 'wellbeing', key: 'loneliness', delta: 5 },
              { e: 'wellbeing', key: 'regret', delta: 4 },
              { e: 'flag', flag: 'a5:done' },
              { e: 'ending', id: 'home' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'a5-pickup-2',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'אמרת את זה מהר, כדי לגמור. מישהו הוציא עשרים. מישהו אחר עשר. אחד נתן חמישה ואמר "זה מה שיש".' },
          { who: null, text: 'תוך שתי דקות היה מספיק למונית, ועוד עשרה שהוא לא לקח בחזרה.' },
          { who: null, text: 'הנהג שאל למה אתם ממהרים. אף אחד לא ענה לו.' },
        ],
        then: [
          { e: 'presence', mode: 'inside' },
          { e: 'flag', flag: 'life:carried:taxi' },
          { e: 'flag', flag: 'owe:stand' },
          { e: 'redheart', key: 'community', delta: 7 },
          { e: 'wellbeing', key: 'belonging', delta: 5 },
          { e: 'personality', key: 'empathy', delta: 3 },
          { e: 'remember', who: 'asaf', eventId: 'stand-paid-my-taxi', significance: 'major' },
          { e: 'flag', flag: 'a5:done' },
          { e: 'ending', id: 'road' },
        ],
      },
    ],
  },
]
