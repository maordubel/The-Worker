import { at } from '../clock'
import type { RandomEncounter } from '../encounters'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

/**
 * B3 · "הגביע אדום" · 19.4.1993 — the first joy that feels complete, and the first
 * time the joy belongs to a group he chose rather than a father he followed.
 *
 * The day is a Monday. The final is in the evening, in a hall that is not theirs (a big
 * one, across the city), and the play is BEFORE the hall: money, a route, a banner that
 * needs carrying, a choice of who to go with — Efi and Limor's planned route by bus from
 * the Ussishkin corner, Ofir and Amit's improvised one, or the television at home with
 * Kobi, who does not do basketball but does do his son. The final itself is not a scene
 * the player controls: it is a cut — the big hall in a card, the sound, the boy's own
 * lines — and then the walk after, which is where the chapter actually lives.
 *
 * **No line here states a score, an opponent or a scorer.** The archive holds the row
 * (`content/manual/basketball-matches.json`, 19.4.1993), the finale reads it, and the
 * crowd in this chapter reacts to a game whose numbers the game never says out loud.
 */

export const BUS_LEAVES = at(18, 30)
export const TIP_OFF_93 = at(20, 0)
export const FINAL_HORN_93 = at(21, 40)

export const PORTRAIT_1993: Record<string, string> = {
  'פוגי': 'faceHero80',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel90',
  'אפי': 'faceEfi',
  'לימור': 'faceLimor',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'רפי מהקיוסק': 'faceOldMan',
  'שחור': 'faceShachor',
  'אוהד': 'faceSupporter',
  'אוהדת': 'faceWoman',
  'אוהד ותיק': 'faceOldMan',
}

export const OBJECTIVES_1993 = {
  morning: 'ערב גמר. איך מגיעים?',
  money: 'צריך כסף לכרטיס ולנסיעה.',
  route: 'להחליט עם מי הולכים.',
  bus: 'האוטובוס יוצא מהפינה של אוסישקין.',
  tv: 'הטלוויזיה בסלון. אבא בכורסה.',
  after: 'הלילה עוד לא נגמר.',
  home: 'הביתה.',
}

export function objective1993(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['final:over']) return state.flags['walked:home'] ? null : OBJECTIVES_1993.after
  if (state.flags['route:tv']) return OBJECTIVES_1993.tv
  if (state.flags['route:efi'] || state.flags['route:ofir']) return sceneId === 'ussishkin-outside' ? OBJECTIVES_1993.bus : OBJECTIVES_1993.bus
  if (state.agorot < 1200 && !state.flags['money:enough']) return OBJECTIVES_1993.money
  return OBJECTIVES_1993.route
}

// ---------------------------------------------------------------------------------
// ENDINGS — every route ends with something. Presence is how he was there.
// ---------------------------------------------------------------------------------
export const ENDINGS_1993: Record<string, EndingCard> = {
  inside: {
    id: 'inside',
    titleHe: 'הגביע אדום',
    bodyHe:
      'חזרת הביתה בשתים־עשרה בלילה עם קול צרוד וריח של אולם על החולצה. אמא לא שאלה כלום. אבא הרים עין מהעיתון ואמר "נו?" ואתה אמרת "נו" בחזרה, ושניכם הבנתם. בחוץ מישהו עוד צפר.',
    memoryHe: 'קרע של נייר אדום מהיציע. שמרת אותו בכיס עד הבית.',
    memoryItem: 'hall-ticket',
    presence: 'inside',
  },
  late: {
    id: 'late',
    titleHe: 'בחצי השני',
    bodyHe:
      'הגעת כשהאולם כבר רעד. פספסת את ההתחלה ואת הפחד של ההתחלה, אבל את הסוף לא. הסוף היה שלך כמו של כולם, ובדרך הביתה אפי לא הזכיר שאיחרת. הוא רק שר.',
    memoryHe: 'כרטיס מקומט, קרוע בקצה. הסדרן קרע אותו מהר כי כבר התחילו.',
    memoryItem: 'hall-ticket',
    presence: 'late',
  },
  television: {
    id: 'television',
    titleHe: 'מהסלון',
    bodyHe:
      'ראית את זה מהכורסה, עם אבא, שלא מבין את החוקים ושאל ארבע פעמים "למה זה שלוש?". בסוף הוא קם ועמד ליד הטלוויזיה כאילו זה יעזור. כשזה נגמר הוא אמר "יפה" ונגע לך בכתף. זה לא היה האולם. זה היה משהו אחר, וגם אותו שווה לשמור.',
    memoryHe: 'העמוד מהעיתון של מחרת. אבא גזר אותו בשבילך בלי להגיד.',
    memoryItem: 'clipping',
    presence: 'television',
  },
  missed: {
    id: 'missed',
    titleHe: 'מהרחוב',
    bodyHe:
      'לא הגעת לאולם ולא לסלון. שמעת את זה מהחלונות של השכונה — ברגע אחד כל הרחוב צעק, ואתה עמדת על המדרכה והבנת. למחרת אפי סיפר לך הכול פעמיים. בפעם השנייה כבר ידעת מה יבוא, ועדיין רצית לשמוע.',
    memoryHe: 'כלום ביד. הסיפור של אפי, שאתה יודע בעל פה.',
    memoryItem: 'folded-paper',
    presence: 'heard-from-friend',
  },
}

// ---------------------------------------------------------------------------------
// BEATS — what the day does by itself.
// ---------------------------------------------------------------------------------
export const BEATS_1993: Beat[] = [
  {
    id: '93-open',
    at: 'home',
    trigger: 'enter',
    when: { notFlag: 'beat:93-open' },
    delayMs: 600,
    do: [
      {
        a: 'lines',
        lines: [
          { who: null, text: 'יום שני. שלוש וחצי. התיק זרוק ליד הדלת, והבית שקט כמו לפני משהו.' },
          { who: null, text: 'הערב יש גמר. לא כדורגל — כדורסל. ולא בבית — באולם הגדול בצד השני של העיר.' },
          { who: null, text: 'אפי אמר: "שש וחצי בפינה של אוסישקין. לימור יודעת את הדרך." ואמא עוד לא יודעת כלום.' },
        ],
      },
    ],
  },
  // the bus leaves from the corner of Ussishkin at half past six, with or without him
  {
    id: '93-bus-gone',
    trigger: 'clock',
    when: { afterMinute: BUS_LEAVES + 12, none: [{ flag: 'on:bus' }, { flag: 'route:tv' }] },
    do: [{ a: 'toast', text: 'שש וארבעים. אם היה אוטובוס, הוא כבר יצא.', tone: 'red' }, { a: 'flag', flag: 'bus:gone' }],
  },
  // eight o'clock: somewhere across the city a hall goes off
  {
    id: '93-tipoff',
    trigger: 'clock',
    when: { afterMinute: TIP_OFF_93, none: [{ flag: 'on:bus' }, { flag: 'route:tv' }] },
    do: [{ a: 'toast', text: 'שמונה. איפשהו בצד השני של העיר, זה התחיל בלעדיך.', tone: 'plain' }, { a: 'flag', flag: 'tipoff:93' }],
  },
  // the television route: the family, the chair, the final in the living room
  {
    id: '93-tv',
    at: 'home',
    trigger: 'clock',
    when: { afterMinute: TIP_OFF_93, flag: 'route:tv' },
    do: [
      { a: 'sound', kind: 'radio', on: true },
      { a: 'card', titleHe: 'שמונה בערב', subHe: 'הסלון', ms: 2200 },
      { a: 'talk', conversation: 'tv-final-1993' },
      { a: 'flag', flag: 'final:over' },
      { a: 'ending', id: 'television' },
    ],
  },
  // the street at nine forty: the whole neighbourhood shouts at once
  {
    id: '93-street-roar',
    trigger: 'clock',
    when: { afterMinute: FINAL_HORN_93, none: [{ flag: 'on:bus' }, { flag: 'route:tv' }] },
    do: [
      { a: 'sound', kind: 'roar', big: 2 },
      { a: 'lines', lines: [{ who: null, text: 'מהחלונות, בבת אחת: כל הרחוב צועק. אתה על המדרכה, ואתה מבין בלי שמישהו אמר.' }] },
      { a: 'flag', flag: 'final:over' },
      { a: 'ending', id: 'missed' },
    ],
  },
]

// ---------------------------------------------------------------------------------
// ENCOUNTERS — small, seeded, period.
// ---------------------------------------------------------------------------------
export const ENCOUNTERS_1993: RandomEncounter[] = [
  {
    id: '93-paper',
    era: '1993-cup',
    locations: ['street', 'kiosk'],
    weight: 3,
    lineHe: 'על עמוד חשמל, כרזה של המשחק הערב. מישהו כבר קרע ממנה פינה.',
    who: null,
    effects: [{ e: 'redheart', key: 'basketballLove', delta: 1 }],
  },
  {
    id: '93-radio-shop',
    era: '1993-cup',
    locations: ['street'],
    weight: 2,
    requirements: [{ afterMinute: at(17, 0) }],
    lineHe: 'מחנות הרדיו: "...הערב, בשמונה, שידור חי..." — ואז מוזיקה.',
    who: null,
    effects: [{ e: 'flag', flag: 'heard:live' }],
  },
]

// ---------------------------------------------------------------------------------
// CONVERSATIONS
// ---------------------------------------------------------------------------------
export const CONVERSATIONS_1993: Conversation[] = [
  // ================================================================== the house ==
  {
    id: 'rachel-1993',
    nameHe: 'רחל',
    branches: [
      {
        when: { flag: 'final:over' },
        lines: [{ who: 'רחל', text: 'שתים־עשרה. אמרתי שתים־עשרה. לך לישון, מחר בית ספר.' }, { who: null, text: 'היא לא שאלה מה היה. הפנים שלך כבר סיפרו.' }],
      },
      {
        when: { flag: 'route:tv' },
        lines: [{ who: 'רחל', text: 'נשארת? יופי. תביא כיסא מהמטבח, אבא לא יזוז מהכורסה.' }],
      },
      {
        when: { flag: 'asked:money' },
        lines: [{ who: 'רחל', text: 'אמרתי מה שאמרתי. בשמונה־עשרה החוצה, בשתים־עשרה בבית, ולא לחזור ברגל.' }],
      },
      {
        lines: [
          { who: 'רחל', text: 'גמר? של כדורסל? ביום שני?' },
          { who: 'פוגי', text: 'באולם הגדול. עם אפי ולימור. יש אוטובוס.' },
          { who: 'רחל', text: 'ומי משלם על האוטובוס ועל הכרטיס ועל מה שתאכל שם?' },
        ],
        choices: [
          {
            id: 'ask',
            text: 'לבקש ממנה.',
            then: [
              { e: 'flag', flag: 'asked:money' },
              { e: 'money', agorot: 800, why: 'מאמא, בפרצוף' },
              { e: 'rel', who: 'rachel', axis: 'trust', delta: -2 },
              { e: 'personality', key: 'independence', delta: -1 },
              { e: 'toast', text: 'שמונה שקלים, וההבעה שבאה איתם.', tone: 'plain' },
            ],
          },
          {
            id: 'own',
            text: 'יש לי. חסכתי.',
            when: { minAgorot: 1200 },
            noteHe: 'אין לך מספיק.',
            then: [
              { e: 'flag', flag: 'money:enough' },
              { e: 'rel', who: 'rachel', axis: 'trust', delta: 4 },
              { e: 'personality', key: 'independence', delta: 2 },
              { e: 'toast', text: 'היא לא אמרה כלום. זה היה הכי הרבה שהיא יכלה להגיד.', tone: 'plain' },
            ],
          },
          {
            id: 'stay',
            text: 'אולי אני אשאר. יש טלוויזיה.',
            then: [
              { e: 'flag', flag: 'route:tv' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'wellbeing', key: 'belonging', delta: 2 },
              { e: 'toast', text: 'אבא, מאחורי העיתון, לא אמר כלום. אבל העיתון ירד קצת.', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'kobi-1993',
    nameHe: 'קובי',
    branches: [
      {
        when: { flag: 'route:tv' },
        lines: [
          { who: 'קובי', text: 'מתי זה מתחיל? שמונה? יופי. אני לא מבין בזה כלום, אבל אני יודע לזהות מתי צריך לצעוק.' },
        ],
      },
      {
        lines: [
          { who: 'קובי', text: 'כדורסל.' },
          { who: 'פוגי', text: 'כדורסל.' },
          { who: 'קובי', text: 'תגיד לי דבר אחד. כשהם מנצחים, זה מרגיש אותו דבר?' },
        ],
        choices: [
          {
            id: 'same',
            text: 'אותו דבר בדיוק.',
            then: [{ e: 'rel', who: 'kobi', axis: 'tension', delta: 2 }, { e: 'redheart', key: 'basketballLove', delta: 2 }, { e: 'toast', text: 'הוא הנהן לאט. לא הסכים. לא התווכח.', tone: 'plain' }],
          },
          {
            id: 'different',
            text: 'אחרת. אבל גם.',
            then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'redheart', key: 'familyTradition', delta: 1 }, { e: 'toast', text: '"גם," הוא חזר. כאילו הוא בודק אם המילה מחזיקה.', tone: 'plain' }],
          },
          {
            id: 'dont-know',
            text: 'אני לא יודע עוד.',
            then: [{ e: 'personality', key: 'curiosity', delta: 1 }, { e: 'toast', text: '"אז לך תדע," הוא אמר, וחזר לעיתון.', tone: 'plain' }],
          },
        ],
      },
    ],
  },
  {
    id: 'tv-1993',
    nameHe: null,
    branches: [
      { when: { flag: 'route:tv' }, lines: [{ who: null, text: 'הטלוויזיה כבויה עדיין. בשמונה. אבא כבר הזיז את הכורסה עשרה סנטימטר קדימה.' }] },
      { lines: [{ who: null, text: 'טלוויזיה. שני ערוצים וחצי. הערב אחד מהם ישדר את האולם, ומי שיישאר פה יראה את זה מרחוק.' }] },
    ],
  },
  {
    id: 'tv-final-1993',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'האולם על המסך קטן ולבן ורועד. הקול מגיע חצי שנייה אחרי התמונה.' },
          { who: 'קובי', text: 'למה זה שלוש? הרגע היה שתיים.' },
          { who: 'פוגי', text: 'כי מרחוק זה שלוש.' },
          { who: 'קובי', text: 'אז שיזרקו מרחוק.' },
          { who: null, text: 'אמא הביאה תה ולא ישבה. עמדה בפתח המטבח עם הכוס ביד, מסתכלת עליכם יותר מאשר על המסך.' },
          { who: null, text: 'בדקות האחרונות אבא קם ועמד ליד הטלוויזיה. כאילו זה יעזור. כאילו הוא בשער.' },
        ],
        choices: [
          {
            id: 'stand',
            text: 'לקום לידו.',
            then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 5 }, { e: 'remember', who: 'kobi', eventId: 'stood-by-tv-1993', significance: 'notable' }, { e: 'redheart', key: 'familyTradition', delta: 3 }],
          },
          {
            id: 'sit',
            text: 'להישאר בכיסא. לא לזוז. שלא יקרה כלום.',
            then: [{ e: 'personality', key: 'stubbornness', delta: 2 }, { e: 'redheart', key: 'basketballLove', delta: 2 }],
          },
        ],
      },
    ],
  },

  // ================================================================== the street ==
  {
    id: 'efi-1993',
    nameHe: 'אפי',
    branches: [
      {
        when: { flag: 'route:efi' },
        lines: [{ who: 'אפי', text: 'שש וחצי. הפינה של אוסישקין. לימור מחזיקה לנו מקום בתור לאוטובוס. אל תאחר, אני לא אחכה.' }, { who: 'אפי', text: '...אני אחכה. אבל אל תאחר.' }],
      },
      {
        when: { flag: 'route:ofir' },
        lines: [{ who: 'אפי', text: 'עם אופיר? בסדר. תגיד לו שהשער הצדדי נסגר בשמונה, לא בתשע כמו שהוא חושב.' }],
      },
      {
        when: { flag: 'route:tv' },
        lines: [{ who: 'אפי', text: 'טלוויזיה.' }, { who: 'אפי', text: 'טוב. תצעק חזק, אולי נשמע.' }],
      },
      {
        lines: [
          { who: 'אפי', text: 'הערב. אתה בא?' },
          { who: null, text: 'אפי גדל השנה עשרה סנטימטר וכל הסנטימטרים האלה עצבניים.' },
          { who: 'אפי', text: 'לימור מכירה את הנהג של האוטובוס מהפינה. שש וחצי, יש מקומות, יש כרטיסים בכניסה אם מגיעים מוקדם.' },
        ],
        choices: [
          {
            id: 'with-efi',
            text: 'בא איתך. שש וחצי.',
            then: [{ e: 'flag', flag: 'route:efi' }, { e: 'rel', who: 'efi', axis: 'bond', delta: 4 }, { e: 'redheart', key: 'basketballLove', delta: 2 }, { e: 'toast', text: 'הוא חייך כמו מישהו שהחזירו לו חוב.', tone: 'plain' }],
          },
          {
            id: 'with-ofir',
            text: 'אופיר אמר שיש דרך אחרת.',
            then: [{ e: 'flag', flag: 'route:ofir' }, { e: 'rel', who: 'efi', axis: 'tension', delta: 3 }, { e: 'toast', text: '"דרך אחרת." הוא הסתכל לכיוון הקיוסק ולא אמר עוד כלום.', tone: 'plain' }],
          },
          {
            id: 'later',
            text: 'עוד לא יודע.',
            then: [{ e: 'toast', text: '"שש וחצי," הוא חזר, והלך.', tone: 'plain' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ofir-1993',
    nameHe: 'אופיר',
    branches: [
      {
        when: { flag: 'route:ofir' },
        lines: [{ who: 'אופיר', text: 'הדרך שלי: טרמפ עד הצומת, משם ברגל. חוסכים את הכרטיס לאוטובוס. עמית בא. אתה בא?' }],
      },
      {
        lines: [
          { who: 'אופיר', text: 'כדורסל, אה? אתה ואפי והאולם הקטן שלכם.' },
          { who: 'אופיר', text: 'אבל הערב זה אולם גדול. ואולם גדול זה כבר מעניין אותי.' },
          { who: 'אופיר', text: 'יש לי דרך בלי אוטובוס. אם אתה רוצה לחסוך.' },
        ],
        choices: [
          { id: 'ok', text: 'ספר.', then: [{ e: 'toast', text: 'טרמפ, צומת, רגליים. ועמית עם הטרנזיסטור, ליתר ביטחון.', tone: 'plain' }] },
          { id: 'no', text: 'אני עם אפי.', then: [{ e: 'rel', who: 'ofir', axis: 'distance', delta: 2 }, { e: 'toast', text: '"בסדר. נתראה שם. או שלא."', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'amit-1993',
    nameHe: 'עמית',
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'אתה יודע מה זה גמר? זה משחק אחד. לא סדרה. משחק אחד ונגמר.' },
          { who: 'עמית', text: 'אז מה שקורה בו קורה פעם אחת. אין תיקון.' },
          { who: 'פוגי', text: 'תודה, עמית.' },
          { who: 'עמית', text: 'אני רק אומר.' },
        ],
        then: [{ e: 'personality', key: 'curiosity', delta: 1 }],
      },
    ],
  },

  // ================================================================== the kiosk ==
  {
    id: 'rafi-1993',
    nameHe: 'רפי מהקיוסק',
    branches: [
      {
        when: { flag: 'rafi:work' },
        lines: [{ who: 'רפי מהקיוסק', text: 'סידרת את הארגזים? יפה. הנה. לך תראה כדורסל, אני אשמע ברדיו.' }],
      },
      {
        lines: [
          { who: 'רפי מהקיוסק', text: 'ערב גדול, אה? רואים לך על הפנים.' },
          { who: 'רפי מהקיוסק', text: 'יש לי ארגזים מאחור שמחכים למישהו עם גב צעיר. עשר דקות. משהו לכיס.' },
        ],
        choices: [
          {
            id: 'work',
            text: 'לסדר את הארגזים.',
            then: [{ e: 'flag', flag: 'rafi:work' }, { e: 'time', minutes: 25 }, { e: 'money', agorot: 600, why: 'ארגזים אצל רפי' }, { e: 'personality', key: 'responsibility', delta: 2 }, { e: 'toast', text: 'שש שקלים ורבע שעה. הגב שלך יזכור את זה באולם.', tone: 'plain' }],
          },
          { id: 'no', text: 'אין זמן, רפי.', then: [{ e: 'toast', text: '"תמיד אין זמן. לך."', tone: 'plain' }] },
        ],
      },
    ],
  },

  // ================================================================== the corner ==
  {
    id: 'limor-1993',
    nameHe: 'לימור',
    branches: [
      {
        when: { flag: 'on:bus' },
        lines: [{ who: 'לימור', text: 'עלית? יופי. שב ליד החלון, בצד הזה רואים את העיר.' }],
      },
      {
        when: { afterMinute: BUS_LEAVES + 12 },
        lines: [{ who: 'לימור', text: 'האוטובוס יצא. אמרתי לאפי לחכות לך, הוא חיכה עד שהנהג צפר.' }, { who: 'לימור', text: 'יש עוד אחד בשבע. אם תגיע לאולם אחרי שהתחילו, הכניסה מהצד. אני אגיד לסדרן.' }],
        then: [{ e: 'flag', flag: 'late:route' }],
      },
      {
        lines: [
          { who: 'לימור', text: 'שמעת שיש כניסה בצד, נכון? לא בחזית. בחזית יש תור של שעה.' },
          { who: null, text: 'לימור יודעת דברים. לימור תמיד יודעת דברים לפני שהם קורים.' },
          { who: 'לימור', text: 'ואם אין לך כרטיס, אל תנסה להשוויץ שיש. הסדרן שם מכיר את כולם.' },
        ],
        choices: [
          { id: 'thanks', text: 'תודה. באמת.', then: [{ e: 'rel', who: 'crowd-limor', axis: 'bond', delta: 3 }, { e: 'flag', flag: 'knows:side' }] },
          { id: 'bluff', text: 'יש לי כרטיס.', when: { lacksItem: 'hall-ticket' }, noteHe: 'יש לך כרטיס אמיתי. אין מה לבלף.', then: [{ e: 'flag', flag: 'bluffed' }, { e: 'personality', key: 'impulsiveness', delta: 2 }, { e: 'toast', text: 'היא הרימה גבה ולא אמרה כלום. זה היה יותר גרוע.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'shachor-1993',
    nameHe: 'שחור',
    branches: [
      {
        when: { flag: 'helped:banner' },
        lines: [{ who: 'שחור', text: 'אתה הילד של הבד. תזכור את זה, כי אני אזכור.' }],
      },
      {
        lines: [
          { who: null, text: 'איש גדול, בטרנינג אדום, עם בד מקופל בגודל של סלון תחת הזרוע.' },
          { who: 'שחור', text: 'אתה. כן, אתה. אתה נוסע באוטובוס? הבד הזה לא נכנס לי לאוטובוס לבד.' },
          { who: 'שחור', text: 'מי שעוזר לי לסחוב, נכנס איתי מהצד. מי שלא, שיעמוד בתור כמו בן אדם.' },
        ],
        choices: [
          {
            id: 'help',
            text: 'לסחוב את הבד.',
            then: [{ e: 'flag', flag: 'helped:banner' }, { e: 'rel', who: 'shachor', axis: 'bond', delta: 6 }, { e: 'remember', who: 'shachor', eventId: 'carried-the-banner-1993', significance: 'major' }, { e: 'redheart', key: 'community', delta: 3 }, { e: 'energy', delta: -10 }, { e: 'toast', text: 'הבד כבד כמו אדם. שחור לא אמר תודה. הוא אמר "יופי".', tone: 'plain' }],
          },
          {
            id: 'no',
            text: 'אני צריך מקום טוב, לא בד.',
            then: [{ e: 'rel', who: 'shachor', axis: 'tension', delta: 2 }, { e: 'personality', key: 'independence', delta: 1 }, { e: 'toast', text: '"מקום טוב," הוא חזר, כאילו זו מילה בשפה זרה.', tone: 'plain' }],
          },
        ],
      },
    ],
  },
  {
    id: 'bus-1993',
    nameHe: null,
    branches: [
      {
        when: { afterMinute: BUS_LEAVES + 12 },
        lines: [{ who: null, text: 'המקום שבו האוטובוס עמד. שמן על הכביש וכרטיס קרוע. הוא יצא.' }],
      },
      {
        when: { any: [{ flag: 'route:efi' }, { flag: 'route:ofir' }], minAgorot: 1200 },
        lines: [
          { who: null, text: 'אוטובוס לבן, מנוע דולק, הנהג מעשן בחלון. אפי בפנים דופק על הזכוכית. לימור בדלת עם שתי אצבעות: שתיים־עשרה שקל.' },
        ],
        choices: [
          {
            id: 'board',
            text: 'לעלות. שתים־עשרה שקל.',
            then: [
              { e: 'money', agorot: -1200, why: 'אוטובוס וכרטיס' },
              { e: 'give', item: 'hall-ticket' },
              { e: 'flag', flag: 'on:bus' },
              { e: 'time', minutes: 35 },
              { e: 'goto', node: 'ride-1993' },
            ],
          },
          { id: 'wait', text: 'עוד רגע.', then: [] },
        ],
      },
      {
        when: { any: [{ flag: 'route:efi' }, { flag: 'route:ofir' }] },
        lines: [{ who: null, text: 'האוטובוס. שתים־עשרה שקל, אומרת לימור באצבעות. אין לך.' }, { who: 'אפי', text: 'תגיד שאין לך! מישהו ישלים!' }],
        choices: [
          {
            id: 'admit',
            text: 'להגיד שאין לי.',
            then: [{ e: 'flag', flag: 'admitted:broke' }, { e: 'rel', who: 'efi', axis: 'trust', delta: 3 }, { e: 'personality', key: 'empathy', delta: 1 }, { e: 'goto', node: 'chip-in-1993' }],
          },
          { id: 'walk', text: 'לרדת. ללכת ברגל. זה רחוק, אבל.', then: [{ e: 'flag', flag: 'walking:far' }, { e: 'time', minutes: 90 }, { e: 'energy', delta: -30 }, { e: 'goto', node: 'walked-1993' }] },
        ],
      },
      { lines: [{ who: null, text: 'האוטובוס לאולם. שש וחצי. עוד לא החלטת עם מי אתה.' }] },
    ],
  },
  {
    id: 'chip-in-1993',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'שקט של שנייה. ואז שחור, מאחור, בלי להסתכל: "כמה חסר לו?"' },
          { who: null, text: 'מטבעות עברו ידיים. לימור ספרה. הנהג צפר. עלית.' },
        ],
        then: [{ e: 'give', item: 'hall-ticket' }, { e: 'flag', flag: 'on:bus' }, { e: 'flag', flag: 'owe:group' }, { e: 'redheart', key: 'community', delta: 4 }, { e: 'wellbeing', key: 'belonging', delta: 4 }, { e: 'time', minutes: 35 }, { e: 'goto', node: 'ride-1993' }],
      },
    ],
  },
  {
    id: 'walked-1993',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הלכת. דרך יפו, דרך שדרות, דרך רחובות שלא ידעת שיש להם שמות. הרגליים למדו את העיר בערב אחד.' },
          { who: null, text: 'כשהגעת, האולם כבר רעד מבחוץ. הסדרן בצד — לימור אמרה לו. הוא הסתכל עליך ופתח סנטימטר.' },
        ],
        then: [{ e: 'flag', flag: 'arrived:late' }, { e: 'flag', flag: 'on:bus' }, { e: 'redheart', key: 'travelDrive', delta: 4 }, { e: 'personality', key: 'stubbornness', delta: 2 }, { e: 'goto', node: 'hall-1993' }],
      },
    ],
  },
  {
    id: 'ride-1993',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'האוטובוס מלא ואף אחד לא יושב. מישהו מאחור התחיל שיר, ומישהו מקדימה ענה לו בשיר אחר, ובאמצע, איפשהו, זה הפך לשיר אחד.' },
          { who: 'לימור', text: 'תראה מהחלון. זו העיר. כולה. ואנחנו נוסעים דרכה כאילו היא שלנו.' },
          { who: null, text: 'האולם הגדול מגיע מאחורי בניין, ואז עוד אחד, ואז הוא שם — לבן, ענק, עם אורות מכל הצדדים. לא הבית. אבל הערב, כן.' },
        ],
        then: [{ e: 'goto', node: 'hall-1993' }],
      },
    ],
  },
  {
    id: 'hall-1993',
    nameHe: null,
    branches: [
      {
        when: { flag: 'arrived:late' },
        lines: [
          { who: null, text: 'פספסת את ההתחלה. את הפחד של ההתחלה, את הרגע שבו כולם עומדים ולא יודעים.' },
          { who: null, text: 'מה שלא פספסת: הסוף. הסוף היה של כולם. גם שלך.' },
        ],
        then: [{ e: 'flag', flag: 'inside:hall' }, { e: 'goto', node: 'horn-1993' }],
      },
      {
        lines: [
          { who: null, text: 'האולם הגדול. תקרה שאי אפשר לגעת בה, אור שלא נגמר, ואלפים. אלפים. הצבע שלכם בצד אחד, הצבע שלהם בצד השני.' },
          { who: null, text: 'זה לא אוסישקין. באוסישקין הקול חוזר אליך מהקיר. פה הקול הולך ולא חוזר. צריך לצעוק פי שניים כדי לשמוע את עצמך.' },
          { who: 'אפי', text: 'תעמוד. אל תשב. מי שיושב פה לא רואה.' },
        ],
        choices: [
          { id: 'stand', text: 'לעמוד כל המשחק.', then: [{ e: 'energy', delta: -20 }, { e: 'redheart', key: 'terraceCulture', delta: 3 }, { e: 'flag', flag: 'inside:hall' }, { e: 'goto', node: 'quarters-1993' }] },
          { id: 'spot', text: 'לחפש מקום ליד הבד של שחור.', when: { flag: 'helped:banner' }, noteHe: 'לא עזרת עם הבד. אין לך מקום שם.', then: [{ e: 'rel', who: 'shachor', axis: 'bond', delta: 3 }, { e: 'redheart', key: 'community', delta: 2 }, { e: 'flag', flag: 'inside:hall' }, { e: 'goto', node: 'quarters-1993' }] },
          { id: 'sit', text: 'לשבת. הרגליים.', then: [{ e: 'flag', flag: 'inside:hall' }, { e: 'goto', node: 'quarters-1993' }] },
        ],
      },
    ],
  },
  {
    id: 'quarters-1993',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'רבע ראשון: רועדים. מישהו מאחוריך אומר "זה ייגמר מהר" ואתה לא יודע לאיזה כיוון הוא התכוון.' },
          { who: null, text: 'שני: הבד של שחור נפתח. הוא ענק. מישהו ליד צועק על מישהו שמחזיק לא ישר.' },
          { who: null, text: 'שלישי: שקט. השקט של אולם שלא נושם. אפי אוחז לך במרפק ולא יודע שהוא אוחז.' },
          { who: null, text: 'רביעי: הדקות הופכות לשניות, והשניות לא זזות.' },
        ],
        then: [{ e: 'goto', node: 'horn-1993' }],
      },
    ],
  },
  {
    id: 'horn-1993',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הצפירה.' },
          { who: null, text: 'אתה לא זוכר מה עשית בשנייה שאחריה. אתה זוכר את שנייה אחרי זה: אפי על הגב שלך, שחור בוכה עם הבד על הכתפיים, לימור רושמת משהו בפנקס קטן כאילו גם את זה צריך לתעד.' },
          { who: null, text: 'הגביע. אדום.' },
        ],
        then: [{ e: 'flag', flag: 'final:over' }, { e: 'redheart', key: 'basketballLove', delta: 6 }, { e: 'wellbeing', key: 'happiness', delta: 12 }, { e: 'wellbeing', key: 'belonging', delta: 8 }, { e: 'goto', node: 'after-1993' }],
      },
    ],
  },
  {
    id: 'after-1993',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'בחוץ, האוויר קר והעיר רועשת. האוטובוס חזרה לא נוסע — הוא רוקד.' },
          { who: 'לימור', text: 'תזכור את הערב הזה. תזכור אותו בדיוק. כי הליגה עוד לא נגמרה, ובחודש הבא—' },
          { who: 'אפי', text: 'לימור. לא הערב.' },
          { who: 'לימור', text: 'לא הערב.' },
          { who: null, text: 'ואז מי לספר? למי לרוץ? יש רק לילה אחד כזה.' },
        ],
        choices: [
          { id: 'home', text: 'הביתה. לספר לאבא.', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 4 }, { e: 'redheart', key: 'familyTradition', delta: 2 }, { e: 'flag', flag: 'after:home' }, { e: 'goto', node: 'close-1993' }] },
          { id: 'stay', text: 'להישאר עם החבר\'ה עד שהאוטובוס נגמר.', then: [{ e: 'rel', who: 'efi', axis: 'sharedHistory', delta: 6 }, { e: 'redheart', key: 'community', delta: 3 }, { e: 'wellbeing', key: 'exhaustion', delta: 10 }, { e: 'flag', flag: 'after:group' }, { e: 'goto', node: 'close-1993' }] },
          { id: 'ofir', text: 'לחפש את אופיר. שיֵדע.', then: [{ e: 'rel', who: 'ofir', axis: 'bond', delta: 4 }, { e: 'flag', flag: 'after:ofir' }, { e: 'goto', node: 'close-1993' }] },
        ],
      },
    ],
  },
  {
    id: 'close-1993',
    nameHe: null,
    branches: [
      {
        when: { flag: 'arrived:late' },
        lines: [{ who: null, text: 'הדרך הביתה ארוכה, וקצרה. כל הרחוב יודע כבר. אתה יודע קודם.' }],
        then: [{ e: 'flag', flag: 'walked:home' }, { e: 'ending', id: 'late' }],
      },
      {
        lines: [{ who: null, text: 'הדרך הביתה ארוכה, וקצרה. כל הרחוב יודע כבר. אתה ידעת קודם.' }],
        then: [{ e: 'flag', flag: 'walked:home' }, { e: 'ending', id: 'inside' }],
      },
    ],
  },
]
