import { at } from '../clock'
import { KOBI_LEAVES } from '../world/scenes'

import { CONVERSATIONS_1990 } from './dialogue1990'
import { CONVERSATIONS_USSISHKIN } from './dialogueUssishkin'
import { CONVERSATIONS_PANORAMAS } from './dialoguePanoramas'
import type { Conversation } from './script'

/**
 * שבת אחת ב-1986 — the chapter's words.
 *
 * Written to brief §7: dialogue supports the game, it is not the game. Nothing here
 * hands out a quest, nothing prints a number, and no line tells the player where to go.
 * Kobi says there is a match; the street fills with people walking one way; the child
 * works out the rest. That is the difference between a life and a menu.
 *
 * And nothing here states a historical fact — see the note in `script.ts`.
 */

const CONVERSATIONS: Conversation[] = [
  // ---------------------------------------------------------------- the bedroom ----
  {
    id: 'bed',
    branches: [
      {
        // The day can also simply end. Brief §26: there is no Game Over, there is a
        // Saturday you were not at. Going to bed is a real choice with a real ending.
        when: { flag: 'match:over', notFlag: 'found:kobi' },
        lines: [
          { who: null, text: 'המיטה. בחוץ כבר חושך, ואבא עוד לא חזר.' },
          { who: null, text: 'אתה יכול לחכות לו ער. או לא.' },
        ],
        choices: [
          { id: 'sleep', text: 'לישון', then: [{ e: 'ending', id: 'missed' }] },
          { id: 'wait', text: 'לחכות', then: [] },
        ],
      },
      { lines: [{ who: null, text: 'המיטה שלך. השמיכה עוד חמה מהלילה.' }] },
    ],
  },
  {
    id: 'window',
    branches: [
      {
        when: { afterMinute: KOBI_LEAVES },
        lines: [
          { who: null, text: 'מהחלון רואים את הרחוב. אנשים הולכים מזרחה. לא אחד, לא שניים.' },
          { who: null, text: 'כולם לאותו כיוון.' },
        ],
        then: [{ e: 'trait', trait: 'knowledge', delta: 2 }],
      },
      {
        lines: [
          { who: null, text: 'שבת בצהריים. חתול על גדר, מכונית אחת, וכביסה על כל מרפסת.' },
          { who: null, text: 'מהחלון הזה אתה מכיר את כל הרחוב.' },
        ],
      },
    ],
  },
  {
    id: 'poster',
    branches: [
      {
        lines: [
          { who: null, text: 'כרזה אדומה על הקיר. קרעת אותה מעמוד חשמל ברחוב סלמה והדבקת פה.' },
          { who: null, text: 'משה סיני. שבע. הוא עומד שם עם הידיים על המותניים כאילו הוא יודע משהו שאתה לא.' },
          { who: null, text: 'אבא אמר שזה לא מכובד לתלות דברים מהרחוב. אמא אמרה שיישאר.' },
          { who: null, text: 'אבא עומד מולה לפעמים כשהוא חושב שאתה ישן.' },
        ],
        then: [
          { e: 'trait', trait: 'footballAffinity', delta: 3 },
          { e: 'flag', flag: 'knows:sinai' },
        ],
      },
    ],
  },
  {
    id: 'desk',
    branches: [
      {
        when: { notFlag: 'has:key' },
        lines: [
          { who: null, text: 'במגירה: עיפרון, גומייה, ומפתח הבית על חוט.' },
          { who: null, text: 'אמא תולה אותו על הצוואר שלך כשאתה יוצא לבד.' },
        ],
        then: [
          { e: 'give', item: 'house-key' },
          { e: 'flag', flag: 'has:key' },
          { e: 'toast', text: 'מפתח הבית' },
        ],
      },
      { lines: [{ who: null, text: 'מגירה פתוחה, עיפרון שבור, וקצת חול שנכנס מהחלון.' }] },
    ],
  },
  {
    id: 'redbox',
    branches: [
      {
        when: { flag: 'memory:first' },
        lines: [
          { who: null, text: 'הקופסה האדומה. עד היום היא הייתה ריקה.' },
          { who: null, text: 'עכשיו יש בה משהו, ואתה יודע בדיוק מאיפה הוא.' },
        ],
        choices: [
          { id: 'open', text: 'לפתוח את הקופסה', then: [{ e: 'flag', flag: 'open:redbox' }] },
          { id: 'shut', text: 'להשאיר סגורה', then: [] },
        ],
      },
      {
        lines: [
          { who: null, text: 'קופסת פח ישנה מתחת לשולחן. ריקה.' },
          { who: null, text: 'אתה שומר אותה בשביל משהו. עוד לא ברור מה.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------- the home ----
  {
    id: 'kobi-morning',
    nameHe: 'קובי',
    branches: [
      {
        // He has already said no once, and the child has come back. What happens now
        // depends on the relationship — not on a persuasion check the player can see.
        when: { flag: 'asked:ticket', bond: { who: 'kobi', min: 66 } },
        lines: [
          { who: 'קובי', text: 'שוב אתה.' },
          { who: null, text: 'הוא מקפל את העיתון ומסתכל עליך רגע ארוך.' },
          { who: 'קובי', text: 'לא היום. אבל קח, תקנה לך משהו בקיוסק. ותהיה בבית.' },
        ],
        then: [
          { e: 'money', agorot: 50, why: 'קובי' },
          { e: 'flag', flag: 'kobi:softened' },
          { e: 'bond', who: 'kobi', delta: 3 },
          { e: 'toast', text: 'קובי נתן לך חמישים אגורות' },
        ],
      },
      {
        when: { flag: 'asked:ticket' },
        lines: [
          { who: 'קובי', text: 'אמרתי לא, ולא נדבר על זה יותר.' },
          { who: null, text: 'הוא לא כועס. הוא פשוט לא זז.' },
        ],
      },
      {
        when: { flag: 'knows:match' },
        lines: [{ who: 'קובי', text: 'תן לי לקרוא בשקט חמש דקות, נו.' }],
        choices: [
          {
            id: 'ask',
            text: 'קח אותי איתך.',
            then: [
              { e: 'goto', node: 'kobi-refuse' },
            ],
          },
          { id: 'leave', text: 'להסתובב', then: [] },
        ],
      },
      {
        lines: [
          { who: null, text: 'אבא בכורסה עם העיתון. הרדיו דולק חלש.' },
          { who: 'קובי', text: 'התלבשת כבר? יופי.' },
        ],
        choices: [
          {
            id: 'match',
            text: 'יש היום משחק?',
            then: [{ e: 'goto', node: 'kobi-match' }],
          },
          {
            id: 'nothing',
            text: 'שום דבר.',
            then: [{ e: 'bond', who: 'kobi', delta: 1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'kobi-match',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'קובי', text: 'יש.' },
          { who: null, text: 'הוא לא מרים את העיניים מהעיתון, אבל הקול משתנה קצת.' },
          { who: 'קובי', text: 'אני הולך בארבע עם יעקב. אנחנו עומדים בשער שבע, איפה שתמיד.' },
          { who: 'קובי', text: 'ואתה נשאר עם אמא.' },
        ],
        then: [
          { e: 'flag', flag: 'knows:match' },
          { e: 'bond', who: 'kobi', delta: 2 },
          { e: 'trait', trait: 'footballAffinity', delta: 4 },
        ],
      },
    ],
  },
  {
    id: 'kobi-refuse',
    nameHe: 'קובי',
    branches: [
      {
        shot: { focus: 'kobi', framing: 'close', ambienceDuck: 0.55 },
        lines: [
          { who: 'קובי', text: 'אתה בן שמונה.' },
          { who: null, text: 'הוא מניח את העיתון על הברך. זה הרגע שבו הוא בדרך כלל מתרכך.' },
          { who: 'קובי', text: 'שם יש עשרים אלף איש. אתה נעלם לי בשתי שניות.' },
          { who: 'קובי', text: 'עוד שנה־שנתיים. תבטיח לי שתחכה.' },
        ],
        // ההבטחה. It costs nothing now and it is the single line the last scene of the
        // chapter is built on: a father who was promised, and a child who came anyway,
        // are a different reunion from a father who was told the truth in the doorway.
        choices: [
          {
            id: 'promise',
            text: 'אני מבטיח.',
            then: [
              { e: 'flag', flag: 'asked:ticket' },
              { e: 'personality', key: 'reliability', delta: 6 },
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 8 },
              { e: 'remember', who: 'kobi', eventId: 'promised-to-wait', significance: 'major' },
            ],
          },
          {
            id: 'silence',
            text: 'לא לענות.',
            then: [
              { e: 'flag', flag: 'asked:ticket' },
              { e: 'personality', key: 'stubbornness', delta: 6 },
              { e: 'rel', who: 'kobi', axis: 'tension', delta: 6 },
              { e: 'remember', who: 'kobi', eventId: 'would-not-promise', significance: 'notable' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'rachel-kitchen',
    nameHe: 'רחל',
    branches: [
      {
        when: { flag: 'chore:done', afterMinute: KOBI_LEAVES, bond: { who: 'rachel', min: 60 } },
        lines: [
          { who: null, text: 'היא מסתכלת עליך, ואז על הדלת שאבא יצא ממנה.' },
          { who: 'רחל', text: 'אתה חושב שאני לא רואה אותך מסתובב פה כמו חתול.' },
          { who: null, text: 'היא פותחת את הארנק ושמה משהו בכף היד שלך, וסוגרת עליו את האצבעות.' },
          { who: 'רחל', text: 'לא סיפרתי לאבא. ואתה גם לא.' },
        ],
        then: [
          { e: 'money', agorot: 100, why: 'רחל' },
          { e: 'flag', flag: 'rachel:secret' },
          { e: 'bond', who: 'rachel', delta: 4 },
          { e: 'trait', trait: 'independence', delta: 3 },
        ],
      },
      {
        // אמא בדלת — the fork the reunion reads, and the player does not know it yet.
        // Telling her the truth is expensive and telling her a story is free, which is
        // exactly the shape of the decision at eight years old.
        when: { all: [{ afterMinute: KOBI_LEAVES }, { notFlag: 'told:rachel' }, { flag: 'knows:match' }] },
        shot: { focus: 'rachel', framing: 'medium', ambienceDuck: 0.4 },
        lines: [
          { who: null, text: 'היא עומדת בפתח המטבח עם המגבת ביד ורואה שאתה כבר בנעליים.' },
          { who: 'רחל', text: 'לאן?' },
        ],
        choices: [
          {
            id: 'truth',
            text: 'לבלומפילד. אחרי אבא.',
            then: [
              { e: 'flag', flag: 'told:rachel' },
              { e: 'flag', flag: 'rachel:knows' },
              { e: 'rel', who: 'rachel', axis: 'trust', delta: 10 },
              { e: 'rel', who: 'rachel', axis: 'tension', delta: 14 },
              { e: 'personality', key: 'courage', delta: 6 },
              { e: 'remember', who: 'rachel', eventId: 'told-the-truth', significance: 'major' },
              { e: 'goto', node: 'rachel-doorway' },
            ],
          },
          {
            id: 'lie',
            text: 'לאופיר, למטה.',
            then: [
              { e: 'flag', flag: 'told:rachel' },
              { e: 'flag', flag: 'lied:rachel' },
              { e: 'rel', who: 'rachel', axis: 'trust', delta: -12 },
              { e: 'personality', key: 'impulsiveness', delta: 5 },
              { e: 'wellbeing', key: 'stress', delta: 12 },
              { e: 'remember', who: 'rachel', eventId: 'lied-about-bloomfield', significance: 'major' },
              { e: 'toast', text: 'היא מהנהנת ולא מורידה ממך את העיניים.' },
            ],
          },
        ],
      },
      {
        when: { flag: 'chore:bottles', hasItem: 'bottle' },
        lines: [
          { who: 'רחל', text: 'הבקבוקים עוד אצלך. הקיוסק סוגר בשלוש וחצי, לא בחמש.' },
        ],
      },
      {
        when: { flag: 'chore:bottles' },
        lines: [{ who: 'רחל', text: 'יופי. תודה, מותק.' }],
      },
      {
        lines: [
          { who: null, text: 'ריח של אוכל שבת. היא מנגבת ידיים במגבת ומסתכלת עליך.' },
          { who: 'רחל', text: 'אתה משעמם לך? יש לי בדיוק עבודה בשבילך.' },
        ],
        choices: [
          {
            id: 'help',
            text: 'מה צריך?',
            then: [{ e: 'goto', node: 'rachel-chore' }],
          },
          {
            id: 'no',
            text: 'לא עכשיו.',
            then: [{ e: 'bond', who: 'rachel', delta: -2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'rachel-chore',
    nameHe: 'רחל',
    branches: [
      {
        lines: [
          { who: 'רחל', text: 'הארגז ליד הדלת. שלושה בקבוקים, לקיוסק, ומה שהוא נותן לך — שלך.' },
          { who: 'רחל', text: 'ולא לרוץ עם זכוכית ביד.' },
        ],
        then: [
          { e: 'flag', flag: 'chore:bottles' },
          { e: 'bond', who: 'rachel', delta: 4 },
          { e: 'trait', trait: 'responsibility', delta: 3 },
        ],
      },
    ],
  },
  {
    id: 'bottles',
    branches: [
      {
        when: { flag: 'chore:bottles', lacksItem: 'bottle', notFlag: 'chore:done' },
        lines: [{ who: null, text: 'ארגז עץ עם שלושה בקבוקי זכוכית. כבדים.' }],
        then: [
          { e: 'give', item: 'bottle', count: 3 },
          { e: 'toast', text: 'שלושה בקבוקים' },
        ],
      },
      { lines: [{ who: null, text: 'ארגז ריק ליד הדלת.' }] },
    ],
  },
  {
    id: 'radio',
    branches: [
      {
        when: { beforeMinute: KOBI_LEAVES },
        lines: [
          { who: null, text: 'הרדיו על השידה. מוזיקה, ואז קול של גבר שמדבר מהר על ספורט.' },
          { who: null, text: 'הוא מזכיר את בלומפילד. את השאר אתה לא מספיק לתפוס.' },
        ],
        then: [
          { e: 'time', minutes: 4 },
          { e: 'trait', trait: 'knowledge', delta: 3 },
          { e: 'flag', flag: 'heard:radio' },
        ],
      },
      {
        lines: [
          { who: null, text: 'מהרדיו נשמע רעש של קהל, רחוק, כאילו מתחת למים.' },
          { who: null, text: 'זה קורה עכשיו. בלעדיך.' },
        ],
        then: [{ e: 'time', minutes: 3 }],
      },
    ],
  },
  {
    id: 'family-photo',
    branches: [
      {
        lines: [
          { who: null, text: 'תמונה בשחור־לבן. אבא צעיר, בלי שפם, עם עוד שני בחורים.' },
          { who: null, text: 'מאחוריהם גדר, ומעל הגדר משהו גדול שלא נכנס לפריים.' },
        ],
      },
    ],
  },
  {
    id: 'coffee-table',
    branches: [
      {
        lines: [
          { who: null, text: 'שולחן נמוך: מאפרה מלאה, ספל קפה הפוך, וקופסת סיגריות ריקה למחצה.' },
          { who: null, text: 'אבא יושב פה כל ערב ולא מזיז את זה אף פעם.' },
        ],
      },
    ],
  },
  {
    id: 'kitchen-table',
    branches: [
      /**
       * העיתון של אבא — the stakes, in 1986's own words, on a Saturday morning table.
       *
       * This is the pre-match page of מעריב ספורט: both line-ups printed in boxes, the
       * league table down the middle, and a headline that says the whole season is
       * decided tomorrow at Bloomfield. Nothing in this game had to write that sentence,
       * and nothing in this game is allowed to — so the child picks up his father's paper
       * and reads it, which is how an eight-year-old would have found out anyway.
       *
       * It is also the honest way to raise `knows:match`: the flag that opens the road
       * east is now something the player LEARNED rather than something the game granted.
       */
      {
        when: { notFlag: 'knows:match' },
        lines: [
          { who: null, text: 'העיתון של אבא פתוח על השעוונית, בעמוד האמצעי. הוא קרא את זה הבוקר שלוש פעמים.' },
        ],
        then: [
          { e: 'doc', art: 'paperBefore', captionHe: 'מעריב ספורט, 23.5.1986 — מארכיון מאור דובל' },
          { e: 'flag', flag: 'knows:match' },
          { e: 'redheart', key: 'footballLove', delta: 4 },
          { e: 'toast', text: 'מחר. בבלומפילד.', tone: 'red' },
        ],
      },
      {
        lines: [{ who: null, text: 'שולחן מכוסה בשעוונית. פירורים, סכין לחם, והעיתון של אבא.' }],
        then: [{ e: 'doc', art: 'paperBefore', captionHe: 'מעריב ספורט, 23.5.1986 — מארכיון מאור דובל' }],
      },
    ],
  },

  // ----------------------------------------------------------------- the street ----
  {
    id: 'ofir-wall',
    nameHe: 'אופיר',
    branches: [
      {
        when: { flag: 'played:football' },
        lines: [
          { who: 'אופיר', text: 'שיחקת יפה. בשבוע הבא אתה בקבוצה שלי.' },
        ],
        then: [{ e: 'bond', who: 'ofir', delta: 2 }],
      },
      {
        lines: [
          { who: null, text: 'אופיר יושב על הקיר עם רגליים באוויר. הוא תמיד יושב על משהו.' },
          { who: 'אופיר', text: 'מה, יצאת סוף סוף? חשבתי שאמא שלך קשרה אותך למיטה.' },
        ],
        choices: [
          {
            id: 'pitch',
            text: 'מה קורה במגרש?',
            then: [
              { e: 'goto', node: 'ofir-pitch' },
            ],
          },
          {
            id: 'match',
            text: 'יש היום משחק בבלומפילד.',
            when: { flag: 'knows:match' },
            noteHe: 'עוד לא שמעת על משחק',
            then: [{ e: 'goto', node: 'ofir-knows' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ofir-pitch',
    nameHe: 'אופיר',
    branches: [
      {
        lines: [
          { who: 'אופיר', text: 'שלושה על שלושה, מאחורי הבניין. אפי כבר שם.' },
          { who: 'אופיר', text: 'תיכנס מהסמטה. לך ראשון, אני בא אחריך.' },
        ],
        then: [
          { e: 'bond', who: 'ofir', delta: 3 },
          { e: 'flag', flag: 'knows:pitch' },
          { e: 'trait', trait: 'streetSmarts', delta: 2 },
        ],
      },
    ],
  },
  {
    id: 'ofir-knows',
    nameHe: 'אופיר',
    branches: [
      {
        lines: [
          { who: 'אופיר', text: 'ברור שיש. כל הרחוב הולך.' },
          { who: 'אופיר', text: 'אבא שלך לוקח אותך?' },
          { who: null, text: 'אתה לא עונה. הוא לא שואל שוב.' },
          { who: 'אופיר', text: 'אז נסתדר.' },
        ],
        then: [
          { e: 'bond', who: 'ofir', delta: 5 },
          { e: 'flag', flag: 'ofir:knows' },
          { e: 'trait', trait: 'courage', delta: 2 },
        ],
      },
    ],
  },
  {
    id: 'ofir-matchday',
    nameHe: 'אופיר',
    branches: [
      {
        lines: [
          { who: null, text: 'אופיר עומד באמצע המדרכה, פונה מזרחה, כאילו חיכה לך.' },
          { who: 'אופיר', text: 'הם כבר הולכים. אם נצא עכשיו נגיע לפני שסוגרים.' },
          { who: 'אופיר', text: 'לך אחרי האנשים. פשוט אל תעצור.' },
        ],
        then: [
          { e: 'flag', flag: 'route:known' },
          { e: 'flag', flag: 'knows:match' },
          { e: 'bond', who: 'ofir', delta: 4 },
          { e: 'trait', trait: 'courage', delta: 3 },
        ],
      },
    ],
  },
  {
    id: 'neighbour',
    nameHe: 'יוסף',
    branches: [
      {
        when: { afterMinute: KOBI_LEAVES },
        lines: [
          { who: 'יוסף', text: 'אבא שלך יצא לפני עשר דקות. רץ כמו ילד.' },
          { who: 'יוסף', text: 'כולם הולכים מזרחה היום. יש משחק.' },
        ],
        then: [
          { e: 'flag', flag: 'knows:match' },
          { e: 'trait', trait: 'streetSmarts', delta: 4 },
          { e: 'redheart', key: 'community', delta: 4 },
        ],
      },
      {
        lines: [
          { who: 'יוסף', text: 'תגיד לאמא שלך שהמים חזרו.' },
          { who: 'יוסף', text: 'ואל תעבור את הכביש הגדול לבד. שמעת?' },
        ],
        then: [{ e: 'trait', trait: 'streetSmarts', delta: 3 }],
      },
    ],
  },
  {
    id: 'wall-writing',
    branches: [
      {
        lines: [
          { who: null, text: 'על הקיר, באדום, בכתב יד גדול: משהו שנכתב בלילה ולא נמחק מאז.' },
          { who: null, text: 'אתה יודע מה כתוב שם גם בלי לקרוא.' },
        ],
        then: [
          { e: 'trait', trait: 'footballAffinity', delta: 2 },
          { e: 'trait', trait: 'streetSmarts', delta: 3 },
          { e: 'redheart', key: 'terraceCulture', delta: 4 },
        ],
      },
    ],
  },
  {
    id: 'gutter-coin',
    branches: [
      {
        lines: [
          { who: null, text: 'משהו נוצץ בין האבן לשורש של העץ.' },
          { who: null, text: 'עשרים אגורות. שלך.' },
        ],
        then: [
          { e: 'money', agorot: 20, why: 'מציאה' },
          { e: 'flag', flag: 'found:coin' },
          { e: 'trait', trait: 'streetSmarts', delta: 4 },
          { e: 'toast', text: 'עשרים אגורות' },
        ],
      },
    ],
  },
  {
    id: 'alley-look',
    branches: [
      {
        lines: [{ who: null, text: 'הסמטה בין הבניינים. מאחוריה שומעים כדור נחבט בקיר.' }],
      },
    ],
  },
  {
    id: 'kiosk-look',
    branches: [
      {
        lines: [{ who: null, text: 'עיתונים, מסטיקים, גזוז. השלט האדום דהוי מהשמש.' }],
      },
    ],
  },

  // ------------------------------------------------------------------ the kiosk ----
  {
    id: 'kiosk-man',
    nameHe: 'בעל הקיוסק',
    branches: [
      {
        lines: [
          { who: 'בעל הקיוסק', text: 'נו, מה אתה רוצה. אני סוגר בשלוש וחצי היום.' },
        ],
        choices: [
          {
            id: 'bottles',
            text: 'הבאתי בקבוקים.',
            when: { hasItem: 'bottle' },
            noteHe: 'אין לך בקבוקים',
            then: [{ e: 'goto', node: 'kiosk-bottles' }],
          },
          {
            id: 'paper',
            text: 'עיתון. (30)',
            when: { minAgorot: 30 },
            noteHe: 'אין לך מספיק',
            then: [{ e: 'goto', node: 'kiosk-paper' }],
          },
          {
            id: 'card',
            text: 'קלף שחקן. (25)',
            when: { minAgorot: 25 },
            noteHe: 'אין לך מספיק',
            then: [{ e: 'goto', node: 'kiosk-card' }],
          },
          { id: 'nothing', text: 'רק מסתכל.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'kiosk-bottles',
    nameHe: 'בעל הקיוסק',
    branches: [
      {
        lines: [
          { who: null, text: 'הוא סופר אותם באצבע, אחד־שניים־שלושה, ומוציא מטבעות מקופסת פח.' },
          { who: 'בעל הקיוסק', text: 'תגיד לאמא שלך שהיא צודקת תמיד.' },
        ],
        then: [
          { e: 'take', item: 'bottle', count: 3 },
          { e: 'money', agorot: 60, why: 'בקבוקים' },
          { e: 'flag', flag: 'chore:done' },
          { e: 'toast', text: 'שישים אגורות' },
        ],
      },
    ],
  },
  {
    id: 'kiosk-paper',
    nameHe: 'בעל הקיוסק',
    branches: [
      {
        lines: [
          { who: null, text: 'עיתון של יום שישי, מקופל, עמוד הספורט כלפי חוץ.' },
          { who: null, text: 'יש שם תמונה של שחקן באמצע קפיצה, ומתחתיה שורות שאתה לא מספיק לקרוא.' },
        ],
        then: [
          { e: 'money', agorot: -30, why: 'עיתון' },
          { e: 'give', item: 'newspaper' },
          { e: 'trait', trait: 'knowledge', delta: 4 },
          { e: 'toast', text: 'עיתון' },
        ],
      },
    ],
  },
  {
    id: 'kiosk-card',
    nameHe: 'בעל הקיוסק',
    branches: [
      {
        lines: [
          { who: null, text: 'קלף קרטון בעטיפת נייר. אתה קורע אותה בשיניים.' },
          { who: null, text: 'שחקן באדום. אתה לא מכיר את הפנים, אבל את החולצה אתה מכיר.' },
        ],
        then: [
          { e: 'money', agorot: -25, why: 'קלף' },
          { e: 'give', item: 'football-card' },
          { e: 'trait', trait: 'footballAffinity', delta: 3 },
          { e: 'toast', text: 'קלף שחקן' },
        ],
      },
    ],
  },
  {
    id: 'kiosk-counter',
    branches: [{ lines: [{ who: null, text: 'דלפק דביק, קופסת פח עם מטבעות, ומאוורר שלא עובד.' }] }],
  },

  // ------------------------------------------------------------------ the pitch ----
  {
    id: 'pitch-kids',
    nameHe: 'ילד מהשכונה',
    branches: [
      {
        when: { flag: 'played:football' },
        lines: [{ who: 'ילד מהשכונה', text: 'מספיק להיום, אני הולך לאכול.' }],
      },
      {
        lines: [
          { who: 'ילד מהשכונה', text: 'שלושה על שלושה. עד שלוש שערים.' },
          { who: 'ילד מהשכונה', text: 'אני סיני. אמרתי ראשון.' },
          { who: null, text: 'תמיד מישהו אומר ראשון. אף פעם לא אתה.' },
        ],
        choices: [
          {
            id: 'play',
            text: 'בוא נשחק.',
            then: [{ e: 'minigame', id: 'football' }],
          },
          {
            id: 'sinai',
            text: 'אז אני סיני אחריו.',
            when: { flag: 'knows:sinai' },
            noteHe: 'צריך להכיר אותו',
            then: [
              { e: 'trait', trait: 'footballAffinity', delta: 4 },
              { e: 'trait', trait: 'courage', delta: 2 },
              { e: 'minigame', id: 'football' },
            ],
          },
          { id: 'later', text: 'אחר כך.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'pitch-ball',
    branches: [
      {
        when: { flag: 'played:football' },
        lines: [{ who: null, text: 'הכדור מונח ליד האבן. עייף כמוך.' }],
      },
      {
        lines: [{ who: null, text: 'כדור פלסטיק חבוט. מספיק כדי לשחק שלושה על שלושה.' }],
        choices: [
          { id: 'play', text: 'לשחק', then: [{ e: 'minigame', id: 'football' }] },
          { id: 'no', text: 'להשאיר', then: [] },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------- the route ---
  {
    id: 'route-fan',
    nameHe: 'אוהד',
    branches: [
      {
        lines: [
          { who: 'אוהד', text: 'לאן אתה רץ, קטן? יש עוד זמן.' },
          { who: null, text: 'הוא צוחק ומזיז אותך מהכביש ביד אחת.' },
        ],
      },
    ],
  },
  {
    id: 'route-veteran',
    nameHe: 'אוהד ותיק',
    branches: [
      {
        lines: [
          { who: 'אוהד ותיק', text: 'לבד?' },
          { who: null, text: 'אתה מהנהן. הוא לא אומר כלום, רק ממשיך ללכת לידך עוד קצת.' },
        ],
        then: [{ e: 'trait', trait: 'courage', delta: 2 }],
      },
    ],
  },
  {
    id: 'route-banner',
    branches: [
      {
        lines: [{ who: null, text: 'סדין קשור לגדר. אדום, מלוכלך, ומישהו תפר עליו אותיות.' }],
      },
    ],
  },

  // ------------------------------------------------------------ outside the ground -
  {
    id: 'steward',
    nameHe: 'סדרן',
    branches: [
      {
        when: { flag: 'entry:granted' },
        lines: [{ who: 'סדרן', text: 'קדימה, פנימה. לא לעמוד בפתח.' }],
      },
      {
        lines: [
          { who: 'סדרן', text: 'ילד, אתה לא נכנס לבד. תמצא את מי שהביא אותך.' },
          { who: null, text: 'הוא לא רשע. הוא פשוט עומד שם.' },
        ],
      },
    ],
  },
  {
    id: 'ticket-window',
    nameHe: 'הקופאי',
    branches: [
      {
        when: { flag: 'entry:granted' },
        lines: [{ who: 'הקופאי', text: 'כבר סידרת. לך.' }],
      },
      {
        when: { minAgorot: 150 },
        lines: [
          { who: 'הקופאי', text: 'ילד — מאה וחמישים.' },
          { who: null, text: 'אתה שם את הכסף על השיש. הוא סופר, ומעביר לך פתק קרטון קטן.' },
        ],
        then: [
          { e: 'money', agorot: -150, why: 'כרטיס' },
          { e: 'give', item: 'ticket-stub' },
          { e: 'flag', flag: 'entry:granted' },
          { e: 'flag', flag: 'entry:ticket' },
          { e: 'trait', trait: 'independence', delta: 4 },
          { e: 'toast', text: 'כרטיס', tone: 'red' },
        ],
      },
      {
        lines: [
          { who: 'הקופאי', text: 'מאה וחמישים לילד.' },
          { who: null, text: 'אתה סופר בכיס בלי להוציא את היד. זה לא מספיק, וזה לא ישתנה מספירה שנייה.' },
        ],
      },
    ],
  },
  {
    id: 'ofir-ground',
    nameHe: 'אופיר',
    branches: [
      {
        when: { flag: 'entry:granted' },
        lines: [{ who: 'אופיר', text: 'תיכנס כבר, אני שומר לך מקום.' }],
      },
      {
        lines: [
          { who: null, text: 'אופיר יושב על מעקה כאילו הוא גר פה.' },
          { who: 'אופיר', text: 'בן דוד שלי עובד פה. אמרתי לו שאני בא עם עוד אחד.' },
          { who: 'אופיר', text: 'תישאר לידי ואל תדבר.' },
        ],
        then: [
          { e: 'flag', flag: 'entry:granted' },
          { e: 'flag', flag: 'entry:ofir' },
          { e: 'bond', who: 'ofir', delta: 6 },
          { e: 'trait', trait: 'streetSmarts', delta: 4 },
          { e: 'toast', text: 'אתה נכנס', tone: 'red' },
        ],
      },
    ],
  },
  {
    id: 'gate-veteran',
    nameHe: 'אוהד ותיק',
    branches: [
      {
        when: { flag: 'entry:granted' },
        lines: [{ who: 'אוהד ותיק', text: 'נו, מה אתה מחכה. זה מתחיל.' }],
      },
      {
        when: { hasItem: 'newspaper', bond: { who: 'kobi', min: 60 } },
        lines: [
          { who: null, text: 'הוא מסתכל על העיתון המקופל ביד שלך, ואז על הפנים שלך.' },
          { who: 'אוהד ותיק', text: 'רגע. אתה של קובי?' },
          { who: null, text: 'אתה מהנהן.' },
          { who: 'אוהד ותיק', text: 'הוא עומד בשבע. בוא, הילד איתי.' },
        ],
        then: [
          { e: 'flag', flag: 'entry:granted' },
          { e: 'flag', flag: 'entry:name' },
          { e: 'bond', who: 'kobi', delta: 2 },
          { e: 'toast', text: 'אתה נכנס', tone: 'red' },
        ],
      },
      {
        /**
         * הרשת — the way in that needs nothing, and is not therefore free.
         *
         * A chapter that can dead-lock is not a chapter (rule 42), so one route must
         * always be open. But `talk → entry granted` is not a route, it is a hotspot
         * wearing a face, and the production directive (§3.2) names it as a defect: a
         * fail-safe is not a free solution. So the old man does not simply take the
         * child in. He asks him the one question a stranger would ask, the child has to
         * answer it out loud, and only then does the old man decide — and it still costs
         * twenty-two minutes of queue, which at ten to four is most of what is left.
         *
         * Neither answer refuses him. Refusing would reintroduce the dead end this
         * branch exists to prevent. What changes is what the man believes he is doing,
         * what he remembers, and what the reunion later reads off it.
         */
        lines: [
          { who: null, text: 'הוא עומד ליד הגדר ומעשן, ורואה אותך כבר כמה דקות. בסוף הוא מכבה את הסיגריה בסוליה.' },
          { who: 'אוהד ותיק', text: 'לבד, מה?' },
          { who: null, text: 'הוא לא שואל את זה כמו מבוגר שעומד להגיד לך לחזור הביתה. הוא שואל כמו מישהו שבודק משהו.' },
          { who: 'אוהד ותיק', text: 'ומי מחכה לך בפנים?' },
        ],
        choices: [
          {
            id: 'father',
            text: 'אבא שלי. בשער שבע.',
            then: [
              { e: 'goto', node: 'gate-veteran-in' },
              { e: 'flag', flag: 'entry:kindness' },
              { e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 6 },
              { e: 'remember', who: 'veteran', eventId: 'told-him-about-kobi', significance: 'notable' },
            ],
          },
          {
            id: 'nobody',
            text: 'אף אחד.',
            then: [
              { e: 'goto', node: 'gate-veteran-in' },
              { e: 'flag', flag: 'entry:kindness' },
              { e: 'flag', flag: 'entry:alone' },
              { e: 'personality', key: 'independence', delta: 8 },
              { e: 'wellbeing', key: 'loneliness', delta: 6 },
              { e: 'remember', who: 'veteran', eventId: 'said-nobody', significance: 'major' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gate-veteran-in',
    nameHe: 'אוהד ותיק',
    branches: [
      {
        // The cost is the same either way, and it is real: twenty-two minutes in a
        // queue at ten to four is most of what is left of the afternoon. That is what
        // makes the fail-safe a decision rather than a door.
        when: { flag: 'entry:alone' },
        shot: { focus: 'both', framing: 'ots', ambienceDuck: 0.5 },
        lines: [
          { who: null, text: 'הוא מסתכל עליך עוד שנייה, ואז מניח יד גדולה על הכתף שלך ולא מוריד אותה.' },
          { who: 'אוהד ותיק', text: 'אז היום אני. תעמוד לידי ותשתוק.' },
          { who: null, text: 'לוקח זמן עד שמגיעים לתור. הרבה זמן. הוא לא מדבר איתך ולא עוזב את הכתף.' },
        ],
        then: [
          { e: 'flag', flag: 'entry:granted' },
          { e: 'time', minutes: 22 },
          { e: 'trait', trait: 'courage', delta: 4 },
          { e: 'redheart', key: 'community', delta: 10 },
          { e: 'toast', text: 'אתה נכנס', tone: 'red' },
        ],
      },
      {
        shot: { focus: 'both', framing: 'ots', ambienceDuck: 0.5 },
        lines: [
          { who: 'אוהד ותיק', text: 'שער שבע. אז אתה יודע לפחות איפה אתה.' },
          { who: null, text: 'הוא מהנהן לעצמו, מניח יד על הכתף שלך, ומכניס אותך לתור לפניו.' },
          { who: 'אוהד ותיק', text: 'תעמוד לידי ותשתוק. ואם הוא לא שם — אתה נשאר איתי עד שהוא בא.' },
          { who: null, text: 'לוקח זמן עד שמגיעים לתור. הרבה זמן.' },
        ],
        then: [
          { e: 'flag', flag: 'entry:granted' },
          { e: 'time', minutes: 22 },
          { e: 'trait', trait: 'courage', delta: 3 },
          { e: 'redheart', key: 'community', delta: 8 },
          { e: 'toast', text: 'אתה נכנס', tone: 'red' },
        ],
      },
    ],
  },
  {
    id: 'street-pole',
    branches: [
      {
        when: { flag: 'knows:match' },
        lines: [
          { who: null, text: 'העמוד. מדבקה אדומה שמישהו הדביק גבוה מדי בשביל ילד, ומתחתיה שכבות של מודעות קרועות.' },
          { who: null, text: 'אתה יודע מה כתוב עליה בעל פה, וזה אף פעם לא נמאס.' },
        ],
        then: [{ e: 'redheart', key: 'terraceCulture', delta: 4 }],
      },
      {
        lines: [
          { who: null, text: 'עמוד חשמל עם מדבקות. אחת מהן אדומה, וקרועה בדיוק במקום שבו כתוב מתי.' },
          { who: null, text: 'מישהו קרע אותה בכוונה, או שהגשם עשה את זה. אין דרך לדעת.' },
        ],
        then: [{ e: 'personality', key: 'curiosity', delta: 3 }],
      },
    ],
  },
  {
    id: 'route-shelter',
    branches: [
      {
        when: { afterMinute: KOBI_LEAVES },
        lines: [
          { who: null, text: 'תחנת האוטובוס ריקה. הספסל חם מהשמש ויש עליו קליפות של גרעינים.' },
          { who: null, text: 'אף אחד לא מחכה כאן היום. כולם כבר הולכים ברגל, וזה מהר יותר.' },
        ],
        then: [{ e: 'trait', trait: 'streetSmarts', delta: 3 }],
      },
      {
        lines: [
          { who: null, text: 'תחנת אוטובוס עם גג פח ושלוש ספסלים. מישהו חרט משהו בצד ומישהו אחר מחק חצי ממנו.' },
        ],
      },
    ],
  },
  {
    id: 'gate-seven',
    branches: [
      {
        lines: [
          { who: null, text: 'שער שבע. אבא עומד שם בכל שבת, באותו מקום, עם יעקב.' },
          { who: null, text: 'מפה זה נראה קטן בהרבה משדמיינת.' },
        ],
        then: [{ e: 'trait', trait: 'knowledge', delta: 2 }],
      },
    ],
  },
  {
    id: 'fence-look',
    branches: [
      {
        lines: [
          { who: null, text: 'דרך הגדר רואים פס של דשא וקצה של יציע.' },
          { who: null, text: 'הרעש מבפנים לא נשמע כמו אנשים. הוא נשמע כמו מזג אוויר.' },
        ],
      },
    ],
  },

  // ----------------------------------------------------------- inside the ground ---
  {
    id: 'terrace-fan',
    nameHe: 'אוהד',
    branches: [
      {
        when: { flag: 'match:over' },
        lines: [{ who: 'אוהד', text: 'תזכור את היום הזה, ילד. שומע? תזכור אותו.' }],
      },
      {
        lines: [{ who: 'אוהד', text: 'זוז קצת קדימה, ככה לא תראה כלום.' }],
      },
    ],
  },
  {
    id: 'terrace-rail',
    branches: [
      {
        lines: [
          { who: null, text: 'המעקה קר ורועד קצת. לא מהרוח.' },
        ],
      },
    ],
  },
  {
    id: 'kobi-found',
    nameHe: 'קובי',
    /**
     * המפגש — the same four feelings every time, in a different order.
     *
     * Brief §31: fear, anger, disbelief and love, and never a speech. What changes is
     * WHICH of them arrives first, and that is read off the save rather than off a
     * dialogue tree the player can feel branching: whether he was promised, whether he
     * was lied to at home, whether somebody he knows brought the child in, and how long
     * he has been looking. Every branch is six lines or fewer.
     */
    branches: [
      {
        // He has been searching. The mother told him the truth on the phone at the
        // kiosk, or a neighbour did, and the match went past him.
        when: { flag: 'rachel:knows' },
        shot: { focus: 'kobi', framing: 'close', ambienceDuck: 0.7 },
        lines: [
          { who: null, text: 'הוא מוצא אותך לפני שאתה מוצא אותו. הוא כבר חיפש.' },
          { who: 'קובי', text: 'אמא אמרה לי.' },
          { who: null, text: 'הוא לא מרים את הקול. הוא מוריד אותו, וזה הרבה יותר גרוע.' },
          { who: 'קובי', text: 'תסתכל עליי. שאני אראה שאתה שלם.' },
          { who: null, text: 'ואז הוא מחבק אותך חזק מדי, ולא אומר כלום עוד הרבה זמן.' },
        ],
        then: [
          { e: 'flag', flag: 'found:kobi' },
          { e: 'rel', who: 'kobi', axis: 'trust', delta: 10 },
          { e: 'rel', who: 'kobi', axis: 'tension', delta: 10 },
          { e: 'bond', who: 'kobi', delta: 12 },
          { e: 'trait', trait: 'independence', delta: 10 },
          { e: 'remember', who: 'kobi', eventId: 'came-anyway', significance: 'major' },
          { e: 'keep' },
          { e: 'ending', id: 'home' },
        ],
      },
      {
        // He was promised, and the promise is standing next to him in a red t-shirt.
        when: { relationshipMemory: { who: 'kobi', eventId: 'promised-to-wait' } },
        shot: { focus: 'kobi', framing: 'close', ambienceDuck: 0.7 },
        lines: [
          { who: null, text: 'הוא מסתובב עם כולם ואז נעצר, כי משהו בשורה מתחת לא במקום.' },
          { who: 'קובי', text: 'הבטחת לי.' },
          { who: null, text: 'אתה לא עונה. אין מה לענות.' },
          { who: null, text: 'הוא מרים אותך באוויר, וזה לוקח לו שנייה יותר מדי לשים אותך בחזרה.' },
          { who: 'קובי', text: 'טעיתי. לא אתה.' },
        ],
        then: [
          { e: 'flag', flag: 'found:kobi' },
          { e: 'bond', who: 'kobi', delta: 14 },
          { e: 'rel', who: 'kobi', axis: 'tension', delta: 8 },
          { e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 12 },
          { e: 'trait', trait: 'independence', delta: 12 },
          { e: 'remember', who: 'kobi', eventId: 'broke-the-promise', significance: 'major' },
          { e: 'keep' },
          { e: 'ending', id: 'home' },
        ],
      },
      {
        // Somebody at the gate said his name, and word travels along a terrace faster
        // than a child does.
        when: { flag: 'entry:name' },
        shot: { focus: 'both', framing: 'medium', ambienceDuck: 0.6 },
        lines: [
          { who: null, text: 'הוא כבר יודע. מישהו אמר לו לפני עשר דקות ששאלו עליו בשער.' },
          { who: 'קובי', text: 'אמרו לי שיש פה ילד ששואל את השם שלי.' },
          { who: null, text: 'הוא מנסה להיראות כועס. הוא לא מצליח, כי כל מי שסביבו מסתכל עליכם.' },
          { who: 'קובי', text: 'אמא הולכת להרוג את שנינו.' },
        ],
        then: [
          { e: 'flag', flag: 'found:kobi' },
          { e: 'bond', who: 'kobi', delta: 12 },
          { e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 14 },
          { e: 'redheart', key: 'community', delta: 10 },
          { e: 'trait', trait: 'independence', delta: 9 },
          { e: 'keep' },
          { e: 'ending', id: 'home' },
        ],
      },
      {
        // The child lied on the way out and has been carrying it up the stairs.
        when: { flag: 'lied:rachel' },
        shot: { focus: 'kobi', framing: 'ots', ambienceDuck: 0.7 },
        lines: [
          { who: null, text: 'הוא מסתובב, ולרגע אחד הפנים שלו לא מבינות מה הן רואות.' },
          { who: 'קובי', text: 'איך…' },
          { who: null, text: 'ואז הוא נזכר לשאול את השאלה השנייה, וזאת הקשה.' },
          { who: 'קובי', text: 'מה אמרת לאמא?' },
          { who: null, text: 'אתה מסתכל על הנעליים. הוא לא שואל שוב.' },
        ],
        then: [
          { e: 'flag', flag: 'found:kobi' },
          { e: 'bond', who: 'kobi', delta: 9 },
          { e: 'rel', who: 'kobi', axis: 'trust', delta: -6 },
          { e: 'rel', who: 'kobi', axis: 'tension', delta: 16 },
          { e: 'wellbeing', key: 'regret', delta: 12 },
          { e: 'trait', trait: 'independence', delta: 10 },
          { e: 'remember', who: 'kobi', eventId: 'came-anyway', significance: 'major' },
          { e: 'keep' },
          { e: 'ending', id: 'home' },
        ],
      },
      {
        shot: { focus: 'kobi', framing: 'close', ambienceDuck: 0.7 },
        lines: [
          { who: null, text: 'הוא עומד עם הגב אליך, הידיים על הראש, וצועק משהו לאוויר.' },
          { who: null, text: 'ואז הוא מסתובב.' },
          { who: 'קובי', text: '...' },
          { who: null, text: 'הוא לא צועק עליך. הוא לא שואל איך הגעת.' },
          { who: null, text: 'הוא מרים אותך באוויר, וזה לוקח לו שנייה יותר מדי לשים אותך בחזרה.' },
          { who: 'קובי', text: 'אמרתי לך עוד שנה־שנתיים.' },
          { who: 'קובי', text: 'טעיתי.' },
        ],
        then: [
          { e: 'flag', flag: 'found:kobi' },
          { e: 'bond', who: 'kobi', delta: 12 },
          { e: 'trait', trait: 'independence', delta: 10 },
          { e: 'keep' },
          { e: 'ending', id: 'home' },
        ],
      },
    ],
  },

  // =================================================================================
  // ההתנגשות — the people who are only there for part of the afternoon.
  // =================================================================================

  {
    id: 'rachel-doorway',
    nameHe: 'רחל',
    branches: [
      {
        shot: { focus: 'rachel', framing: 'close', ambienceDuck: 0.5 },
        lines: [
          { who: null, text: 'היא לא אומרת לא. היא גם לא אומרת כן.' },
          { who: 'רחל', text: 'אתה יודע איפה שער שבע?' },
          { who: null, text: 'אתה מהנהן, וזה חצי נכון.' },
          { who: 'רחל', text: 'אם משהו — אתה עומד במקום אחד ולא זז עד שהוא מוצא אותך. שמעת?' },
        ],
        then: [
          { e: 'flag', flag: 'knows:gate7' },
          { e: 'bond', who: 'rachel', delta: 6 },
          { e: 'wellbeing', key: 'stress', delta: -6 },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ המידע: עמית ---
  {
    id: 'amit-kiosk',
    nameHe: 'עמית',
    branches: [
      {
        when: { flag: 'knows:gate7' },
        lines: [
          { who: 'עמית', text: 'כבר אמרתי לך הכול. תלך כבר.' },
        ],
      },
      {
        // Before one o'clock, and he is twenty agorot short. What the player does here
        // is remembered for the rest of the afternoon.
        when: { minAgorot: 20 },
        shot: { focus: 'amit', framing: 'medium' },
        lines: [
          { who: null, text: 'עמית עומד ליד הדלפק וסופר מטבעות בכף היד. שוב.' },
          { who: 'עמית', text: 'חסר לי עשרים. תמיד חסר לי עשרים.' },
        ],
        choices: [
          {
            id: 'pay',
            text: 'קח, יש לי.',
            then: [
              { e: 'money', agorot: -20, why: 'לעמית' },
              { e: 'bond', who: 'amit', delta: 14 },
              { e: 'personality', key: 'empathy', delta: 8 },
              { e: 'remember', who: 'amit', eventId: 'paid-for-the-paper', significance: 'major' },
              { e: 'toast', text: 'הוא לא אומר תודה. הוא יזכור.' },
            ],
          },
          { id: 'watch', text: 'לא להגיד כלום.', then: [{ e: 'personality', key: 'curiosity', delta: 2 }] },
        ],
      },
      {
        lines: [
          { who: null, text: 'עמית סופר מטבעות ליד הדלפק, ובעל הקיוסק מחכה בסבלנות של מישהו שראה את זה כבר.' },
          { who: 'עמית', text: 'העיתון עולה יותר מאתמול. אני נשבע לך.' },
        ],
      },
    ],
  },
  {
    id: 'amit-street',
    nameHe: 'עמית',
    branches: [
      {
        when: { flag: 'knows:gate7' },
        lines: [{ who: 'עמית', text: 'מה, שכחת? שער שבע. לך.' }],
      },
      {
        // He remembers the twenty agorot, and the information is free.
        when: { relationshipMemory: { who: 'amit', eventId: 'paid-for-the-paper' } },
        shot: { focus: 'amit', framing: 'ots', ambienceDuck: 0.4 },
        lines: [
          { who: null, text: 'הוא רואה אותך מרחוק ומקפל את העיתון כך שהעמוד הנכון למעלה.' },
          { who: 'עמית', text: 'בגלל שנתת לי — תשמע טוב.' },
          { who: 'עמית', text: 'זה לא סתם משחק היום. אם מנצחים, נגמר. אם לא — לא נגמר.' },
          { who: 'עמית', text: 'והשער שבו כולם מהשכונה עומדים זה שבע. לא שש, לא שמונה.' },
        ],
        then: [
          { e: 'seize', opportunity: 'amit-paper' },
          { e: 'give', item: 'newspaper' },
          { e: 'toast', text: 'קרעת את עמוד הספורט. הוא נתן לך.' },
        ],
      },
      {
        when: { minAgorot: 30 },
        shot: { focus: 'amit', framing: 'medium' },
        lines: [
          { who: null, text: 'עמית יושב על המדרכה עם עיתון פתוח על הברכיים, ומכסה חצי ממנו ביד.' },
          { who: 'עמית', text: 'מה, אתה רוצה לדעת? זה שלי, קניתי אותו.' },
        ],
        choices: [
          {
            id: 'buy',
            text: 'שלושים אגורות, ואני קורא איתך.',
            then: [
              { e: 'money', agorot: -30, why: 'עמית' },
              { e: 'seize', opportunity: 'amit-paper' },
              { e: 'give', item: 'newspaper' },
            ],
          },
          {
            id: 'ask',
            text: 'רק תגיד לי מה כתוב.',
            then: [
              { e: 'seize', opportunity: 'amit-paper' },
              { e: 'rel', who: 'amit', axis: 'tension', delta: 4 },
            ],
          },
          { id: 'go', text: 'עזוב.', then: [] },
        ],
      },
      {
        shot: { focus: 'amit', framing: 'medium' },
        lines: [
          { who: null, text: 'עמית יושב על המדרכה עם עיתון פתוח על הברכיים.' },
          { who: 'עמית', text: 'אתה יודע לקרוא מהר? כי אני לא נותן לך אותו ביד.' },
        ],
        choices: [
          {
            id: 'read',
            text: 'להסתכל מעבר לכתף שלו.',
            then: [
              { e: 'seize', opportunity: 'amit-paper' },
              { e: 'personality', key: 'curiosity', delta: 6 },
            ],
          },
          { id: 'go', text: 'אחר כך.', then: [] },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------- קרן ---------
  {
    id: 'keren-street',
    nameHe: 'קרן',
    branches: [
      {
        when: { bond: { who: 'keren', min: 20 } },
        lines: [
          { who: 'קרן', text: 'אם אתה הולך — תלך כבר, לפני שאמא שלך תראה אותך.' },
        ],
      },
      {
        shot: { focus: 'keren', framing: 'medium', ambienceDuck: 0.3 },
        lines: [
          { who: null, text: 'קרן יושבת על המדרגה עם צעיף אדום על הברכיים ומותחת חוט שיצא ממנו.' },
          { who: 'קרן', text: 'זה של אח שלי. הוא שכח אותו והוא ימות.' },
          { who: null, text: 'היא מסתכלת עליך כמו מישהי שכבר יודעת לאן אתה הולך.' },
        ],
        choices: [
          {
            id: 'ask',
            text: 'איך זה שם? ביציע.',
            then: [
              { e: 'bond', who: 'keren', delta: 12 },
              { e: 'redheart', key: 'terraceCulture', delta: 10 },
              { e: 'wellbeing', key: 'belonging', delta: 6 },
              { e: 'goto', node: 'keren-terrace' },
            ],
          },
          {
            id: 'scarf',
            text: 'אני יכול לקחת לו אותו.',
            when: { flag: 'knows:match' },
            noteHe: 'צריך לדעת שיש היום משחק',
            then: [
              { e: 'give', item: 'scarf' },
              { e: 'bond', who: 'keren', delta: 16 },
              { e: 'personality', key: 'responsibility', delta: 6 },
              { e: 'remember', who: 'keren', eventId: 'took-the-scarf', significance: 'notable' },
              { e: 'toast', text: 'צעיף אדום, מקופל לרבע, בתוך החולצה.', tone: 'red' },
            ],
          },
          { id: 'nothing', text: 'להמשיך.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'keren-terrace',
    nameHe: 'קרן',
    branches: [
      {
        lines: [
          { who: 'קרן', text: 'רועש. ואף אחד לא יושב, גם כשיש כיסא.' },
          { who: 'קרן', text: 'ואם מבקיעים אתה לא רואה כלום, כי כולם קופצים עליך.' },
          { who: null, text: 'היא אומרת את זה כאילו זה חיסרון. אתה שומע את זה אחרת.' },
        ],
        then: [{ e: 'redheart', key: 'travelDrive', delta: 6 }],
      },
    ],
  },

  // --------------------------------------------------------------------- אפי --------
  {
    id: 'efi-hall',
    nameHe: 'אפי',
    branches: [
      {
        when: { flag: 'saw:hall' },
        lines: [{ who: 'אפי', text: 'אמרתי לך שזה שווה. עכשיו תלך לאבא שלך.' }],
      },
      {
        when: { afterMinute: at(14, 0) },
        lines: [
          { who: null, text: 'אפי כבר לא פה. הכדור שלו נשאר ליד האבן, והוא לא כזה שמשאיר כדור.' },
        ],
      },
      {
        // The other life. It closes at two, and the player almost certainly does not
        // know that — which is the point of a missable thing.
        shot: { focus: 'efi', framing: 'medium' },
        lines: [
          { who: null, text: 'אפי מחזיק כדור שהוא לא בועט בו. הוא מקפיץ אותו על הרצפה, פעם, ועוד פעם.' },
          { who: 'אפי', text: 'זה לא כדורגל. זה אחר.' },
          { who: 'אפי', text: 'יש אולם. אני הולך לשם עוד רגע, זה חמש דקות מפה.' },
        ],
        choices: [
          {
            id: 'go',
            text: 'בוא נלך.',
            then: [
              { e: 'seize', opportunity: 'efi-hall' },
              { e: 'goto', node: 'efi-hall-after' },
            ],
          },
          {
            id: 'no',
            text: 'היום יש משחק.',
            when: { flag: 'knows:match' },
            noteHe: 'צריך לדעת שיש היום משחק',
            then: [
              { e: 'redheart', key: 'footballLove', delta: 5 },
              { e: 'rel', who: 'efi', axis: 'distance', delta: 8 },
            ],
          },
          { id: 'later', text: 'אולי אחר כך.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'efi-hall-after',
    nameHe: 'אפי',
    branches: [
      {
        lines: [
          { who: null, text: 'אולם קטן, ריח של גומי ושל פרקט. הכדור נשמע אחרת פה — גבוה, יבש, מהיר.' },
          { who: 'אפי', text: 'תראה. אני זורק מפה ואתה תופס.' },
          { who: null, text: 'אתה לא תופס. אתם צוחקים. חוזרים על זה עשרים פעם.' },
          { who: null, text: 'כשאתה יוצא החוצה השמש כבר נמוכה, והרחוב מלא אנשים שהולכים לכיוון אחד.' },
        ],
        then: [
          { e: 'flag', flag: 'saw:hall' },
          { e: 'wellbeing', key: 'happiness', delta: 10 },
          { e: 'wellbeing', key: 'exhaustion', delta: 8 },
        ],
      },
    ],
  },

  // ============================================================ הדרך לבלומפילד =======
  {
    id: 'route-shortcut',
    branches: [
      {
        when: { flag: 'used:shortcut' },
        lines: [{ who: null, text: 'הרווח בין הבתים. אתה כבר יודע לאן הוא יוצא.' }],
      },
      {
        // The street family's payoff: two minutes and a piece of knowledge, for a child
        // who has been paying attention to his own neighbourhood.
        when: { personalityAbove: { key: 'streetSmarts', min: 14 } },
        lines: [
          { who: null, text: 'רווח בין שני בתים, רחב בדיוק כמו ילד. מהצד השני שומעים את אותו רעש, רק קרוב יותר.' },
          { who: null, text: 'אתה נכנס, מסובב את הכתפיים, ויוצא שלושה בניינים אחרי כולם.' },
        ],
        then: [
          { e: 'flag', flag: 'used:shortcut' },
          { e: 'flag', flag: 'knows:route' },
          { e: 'trait', trait: 'streetSmarts', delta: 8 },
          { e: 'toast', text: 'קיצור דרך. חסכת כמה דקות.' },
        ],
      },
      {
        lines: [
          { who: null, text: 'רווח צר בין שני בתים, מלא ארגזים. אולי הוא מוביל לאנשהו ואולי לא.' },
          { who: null, text: 'אתה לא מכיר את הצד השני מספיק טוב כדי להיכנס לבד.' },
        ],
      },
    ],
  },
  {
    id: 'gate-turnstile',
    branches: [
      {
        lines: [
          { who: null, text: 'קרוסלת ברזל, גבוהה ממך. כל אחד שנכנס דוחף אותה פעם אחת והיא מקרקשת.' },
          { who: null, text: 'ילדים עוברים עם מבוגר, מתחת ליד שלו. סדרן מסתכל ולא אומר כלום.' },
        ],
        then: [{ e: 'trait', trait: 'streetSmarts', delta: 3 }],
      },
    ],
  },
  {
    id: 'gate-family',
    nameHe: 'אבא עם ילד',
    branches: [
      {
        when: { flag: 'entry:granted' },
        lines: [{ who: 'אבא עם ילד', text: 'נו, קדימה, זה מתחיל.' }],
      },
      {
        // The RESOURCE route ends here too: a child with a ticket and no adult still
        // needs somebody to walk in beside.
        when: { hasItem: 'ticket-stub' },
        shot: { focus: 'both', framing: 'medium' },
        lines: [
          { who: null, text: 'אבא ובן, בערך בגיל שלך, בתור לקרוסלה. הוא רואה את הכרטיס ביד שלך.' },
          { who: 'אבא עם ילד', text: 'לבד עם כרטיס? יאללה, תיכנס לידנו, שלא ידחפו אותך.' },
        ],
        then: [
          { e: 'flag', flag: 'entry:granted' },
          { e: 'flag', flag: 'entry:ticket' },
          { e: 'wellbeing', key: 'belonging', delta: 8 },
          { e: 'toast', text: 'אתה נכנס', tone: 'red' },
        ],
      },
      {
        // The STREET route: no ticket, no name, no friend. Just a child who knows how a
        // queue works and is willing to ask. Nothing is climbed and nothing is stolen.
        when: { personalityAbove: { key: 'streetSmarts', min: 20 } },
        shot: { focus: 'both', framing: 'ots' },
        lines: [
          { who: null, text: 'אתה עומד ליד הבן שלו ומחזיק את הקצה של החולצה שלך, כאילו אתה מחכה למישהו.' },
          { who: null, text: 'האבא סופר ראשים כמו כל אבא, מגיע לשלושה במקום שניים, ועוצר.' },
          { who: 'אבא עם ילד', text: 'ואתה של מי?' },
        ],
        choices: [
          {
            id: 'truth',
            text: 'אבא שלי בפנים. בשער שבע.',
            then: [
              { e: 'flag', flag: 'entry:granted' },
              { e: 'flag', flag: 'entry:family' },
              { e: 'personality', key: 'courage', delta: 8 },
              { e: 'redheart', key: 'community', delta: 8 },
              { e: 'toast', text: 'הוא מניח לך יד על הכתף ומעביר אותך איתם.', tone: 'red' },
            ],
          },
          {
            id: 'silent',
            text: 'לא לענות.',
            then: [
              { e: 'wellbeing', key: 'stress', delta: 10 },
              { e: 'toast', text: 'הוא מושך את הבן שלו קדימה ואתה נשאר מאחור.' },
            ],
          },
        ],
      },
      {
        lines: [
          { who: null, text: 'אבא ובן בתור לקרוסלה. האבא מחזיק שני כרטיסים ומסתכל קדימה.' },
          { who: null, text: 'אתה לא מצליח לומר כלום, והתור זז.' },
        ],
        then: [{ e: 'wellbeing', key: 'loneliness', delta: 5 }],
      },
    ],
  },
]

/**
 * One registry, every chapter. A conversation id is global on purpose — `steward` is the
 * 1986 steward and `steward-1990` the 1990 one, and a scene names which it wants — so a
 * second chapter is a second content file and not a second runner (brief §52).
 */
export const DIALOGUE: Record<string, Conversation> = Object.fromEntries(
  [...CONVERSATIONS, ...CONVERSATIONS_1990, ...CONVERSATIONS_USSISHKIN, ...CONVERSATIONS_PANORAMAS].map((conversation) => [conversation.id, conversation]),
)
