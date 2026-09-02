import { KOBI_LEAVES } from '../world/scenes'

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
        lines: [
          { who: 'קובי', text: 'אתה בן שמונה.' },
          { who: null, text: 'הוא מניח את העיתון על הברך. זה הרגע שבו הוא בדרך כלל מתרכך.' },
          { who: 'קובי', text: 'שם יש עשרים אלף איש. אתה נעלם לי בשתי שניות.' },
          { who: 'קובי', text: 'עוד שנה־שנתיים. תבטיח לי שתחכה.' },
        ],
        then: [{ e: 'flag', flag: 'asked:ticket' }],
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
    branches: [{ lines: [{ who: null, text: 'שולחן מכוסה בשעוונית. פירורים, וסכין לחם.' }] }],
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
    nameHe: 'שכן',
    branches: [
      {
        when: { afterMinute: KOBI_LEAVES },
        lines: [
          { who: 'שכן', text: 'אבא שלך יצא לפני עשר דקות. רץ כמו ילד.' },
          { who: 'שכן', text: 'כולם הולכים מזרחה היום. יש משחק.' },
        ],
        then: [{ e: 'flag', flag: 'knows:match' }],
      },
      {
        lines: [{ who: 'שכן', text: 'תגיד לאמא שלך שהמים חזרו.' }],
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
        then: [{ e: 'trait', trait: 'footballAffinity', delta: 2 }],
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
          { e: 'trait', trait: 'streetSmarts', delta: 2 },
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
        lines: [
          { who: null, text: 'הוא עומד ליד הגדר ומעשן, ורואה אותך כבר כמה דקות.' },
          { who: 'אוהד ותיק', text: 'לבד, מה?' },
          { who: null, text: 'הוא נאנח, מכבה את הסיגריה בסוליה, ומניח יד על הכתף שלך.' },
          { who: 'אוהד ותיק', text: 'תעמוד לידי ותשתוק. הילד איתי.' },
          { who: null, text: 'לוקח זמן עד שמגיעים לתור. הרבה זמן.' },
        ],
        then: [
          { e: 'flag', flag: 'entry:granted' },
          { e: 'flag', flag: 'entry:kindness' },
          { e: 'time', minutes: 22 },
          { e: 'trait', trait: 'courage', delta: 3 },
          { e: 'toast', text: 'אתה נכנס', tone: 'red' },
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
    branches: [
      {
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
          { e: 'ending', id: 'home' },
        ],
      },
    ],
  },
]

export const DIALOGUE: Record<string, Conversation> = Object.fromEntries(
  CONVERSATIONS.map((conversation) => [conversation.id, conversation]),
)
