import { at } from '../clock'

import { CURFEW, TIP_OFF } from './chapter1991'
import type { Conversation } from './script'

/**
 * 11.3.1991 — what people say on the day the boy has to arrange his own night.
 *
 * The rules of `dialogue.ts` and `dialogue1990.ts` are unchanged and one of them is the
 * whole reason this file reads the way it does: **no authored line states a result, a
 * score, a margin, a quarter, an official or a player's name.** The derby is a row in the
 * archive; the crowd in this hall reacts to a game whose numbers the game itself never
 * says out loud, and the one number a person is allowed to speak is read off the anchor
 * by the director at the horn.
 *
 * The other rule is the brief's, and it is the design of the whole evening: no menu ever
 * says PERMISSION GRANTED. Rachel says a time. The time arrives while the game is alive,
 * and what the player does with his own legs at that moment is the choice (§41).
 */

const BREAK = at(8, 55)

export const CONVERSATIONS_1991: Conversation[] = [
  // ================================================================= the classroom ==
  {
    id: 'note-1991',
    nameHe: null,
    branches: [
      // --- it has been answered and is on its way back --------------------------------
      {
        when: { flag: 'note:answered' },
        lines: [
          { who: null, text: 'הפתק כבר לא אצלך. הוא איפשהו בין השורה השנייה לשלישית, מתחת לשולחנות.' },
          { who: null, text: 'מישהו מאחוריך צוחק בלי קול.' },
        ],
      },
      // --- confiscated ---------------------------------------------------------------
      {
        when: { flag: 'note:caught' },
        lines: [
          { who: null, text: 'הפתק על השולחן שלה, מקופל בדיוק כמו שהיה. היא לא פתחה אותו שוב.' },
          { who: null, text: 'זה איכשהו יותר גרוע מזה שהיא כן.' },
        ],
      },
      // --- the note, and the only real decision of the morning ------------------------
      {
        when: { flag: 'note:read' },
        lines: [
          { who: null, text: 'הפתק פתוח על הברכיים שלך. שתי מילים, סימן שאלה, ומתחת — שלוש תשובות מוכנות שצריך רק להקיף.' },
          { who: null, text: 'כן · ברור · נראה לך שלא?' },
          { who: null, text: 'המורה כותבת על הלוח. הגב שלה אליך. לא לאורך זמן.' },
        ],
        choices: [
          {
            id: 'now',
            text: 'להעביר עכשיו, מהר.',
            then: [
              { e: 'flag', flag: 'note:caught' },
              { e: 'take', item: 'school-note' },
              { e: 'time', minutes: 12 },
              { e: 'personality', key: 'impulsiveness', delta: 5 },
              { e: 'toast', text: 'היד שלך באוויר כשהיא מסתובבת. היא לא צועקת. זה יותר גרוע.', tone: 'plain' },
              { e: 'goto', node: 'note-caught' },
            ],
          },
          {
            id: 'wait',
            text: 'לחכות שהיא תכתוב עוד שורה.',
            then: [
              { e: 'flag', flag: 'note:answered' },
              { e: 'flag', flag: 'plan:tonight' },
              { e: 'time', minutes: 6 },
              { e: 'personality', key: 'streetSmarts', delta: 5 },
              { e: 'bond', who: 'ofir', delta: 3 },
              { e: 'toast', text: 'הקפת "ברור", חיכית לגיר, והעברת. הפתק נעלם קדימה.', tone: 'plain' },
            ],
          },
          {
            id: 'keep',
            text: 'לקפל ולשים בכיס.',
            then: [
              { e: 'flag', flag: 'note:kept' },
              { e: 'flag', flag: 'plan:tonight' },
              { e: 'personality', key: 'responsibility', delta: 4 },
              { e: 'toast', text: 'שמת אותו בכיס. תענה בהפסקה. זה גם תשובה.', tone: 'plain' },
            ],
          },
        ],
      },
      {
        lines: [{ who: null, text: 'נייר מקופל לארבע על השולחן שלך.' }],
        then: [{ e: 'flag', flag: 'note:read' }, { e: 'give', item: 'school-note' }],
      },
    ],
  },
  {
    id: 'note-caught',
    nameHe: 'המורה',
    branches: [
      {
        lines: [
          { who: 'המורה', text: 'תודה. אני אשמור עליו.' },
          { who: null, text: 'היא מקפלת אותו שוב לארבע ומניחה על השולחן שלה, ליד הגיר.' },
          { who: 'המורה', text: 'אוסישקין.' },
          { who: null, text: 'היא לא שואלת. היא אומרת את זה כמו מישהי שכבר שמעה את המילה הזאת בכיתה הזאת.' },
          { who: 'המורה', text: 'אתה נשאר חמש דקות אחרי השיעור. ויש שיעורי בית.' },
        ],
        then: [
          { e: 'flag', flag: 'hw:given' },
          { e: 'rel', who: 'teacher', axis: 'familiarity', delta: 4 },
          { e: 'remember', who: 'teacher', eventId: 'note-confiscated', significance: 'minor' },
        ],
      },
    ],
  },
  {
    id: 'teacher-1991',
    nameHe: 'המורה',
    branches: [
      {
        when: { flag: 'note:caught' },
        lines: [
          { who: 'המורה', text: 'אתה עדיין כאן.' },
          { who: 'פוגי', text: 'אמרת חמש דקות.' },
          { who: 'המורה', text: 'אמרתי. שיעורי הבית לעמוד ארבעים ואחת. לא בגלל הפתק.' },
          { who: null, text: 'היא מסתכלת עליך מעל המשקפיים עוד שנייה אחת, ואז חוזרת ללוח.', },
          { who: 'המורה', text: 'תלך. אתה תאחר.' },
        ],
        then: [{ e: 'flag', flag: 'school:done' }, { e: 'time', minutes: 5 }],
      },
      {
        when: { afterMinute: BREAK },
        lines: [
          { who: 'המורה', text: 'צלצל. עמוד ארבעים ואחת להיום.' },
          { who: null, text: 'היא מוחקת את הלוח באותה תנועה כל בוקר. חצי מעגל, ואז שורה.' },
        ],
        then: [{ e: 'flag', flag: 'hw:given' }, { e: 'flag', flag: 'school:done' }],
      },
      {
        lines: [
          { who: 'המורה', text: 'אנחנו באמצע.' },
          { who: null, text: 'נכון. אתה לא.' },
        ],
      },
    ],
  },
  {
    id: 'class-board',
    branches: [
      {
        lines: [
          { who: null, text: 'הלוח מלא בסימנים לבנים. אתה מעתיק אותם למחברת בלי לקרוא אותם.' },
          { who: null, text: 'בעמוד ליד, בשוליים, אתה מצייר אולם קטן עם גג פח.' },
        ],
        then: [{ e: 'personality', key: 'curiosity', delta: 2 }],
      },
    ],
  },
  {
    id: 'class-window',
    branches: [
      {
        lines: [
          { who: null, text: 'החלונות גבוהים, ומהמקום שלך רואים רק שמיים ופינה של גג.' },
          { who: null, text: 'ככה זה בנוי. כדי שלא תסתכל החוצה.' },
        ],
      },
    ],
  },
  {
    id: 'class-bag',
    branches: [
      {
        lines: [
          { who: null, text: 'התיק בין הרגליים. ספר חשבון, קלמר, וקצה של צעיף אדום שאתה דוחף פנימה כל בוקר.' },
          { who: null, text: 'הוא תמיד מציץ החוצה. אתה כבר לא באמת מנסה.' },
        ],
        then: [{ e: 'redheart', key: 'terraceCulture', delta: 2 }],
      },
    ],
  },
  {
    id: 'keren-class',
    nameHe: 'קרן',
    branches: [
      {
        when: { flag: 'note:caught' },
        lines: [
          { who: 'קרן', text: 'איזה גאון.' },
          { who: 'פוגי', text: 'היא הסתובבה.' },
          { who: 'קרן', text: 'היא תמיד מסתובבת. זה התפקיד שלה.' },
        ],
        then: [{ e: 'bond', who: 'keren', delta: 2 }],
      },
      {
        when: { flag: 'plan:tonight' },
        lines: [
          { who: 'קרן', text: 'אתה הולך?' },
          { who: 'פוגי', text: 'אני צריך לשאול.' },
          { who: 'קרן', text: 'אז תשאל יפה. אמא שלך לא אמא שלי.' },
        ],
      },
      {
        lines: [
          { who: 'קרן', text: 'תפסיק לזוז. היא מסתכלת לכיוון שלנו.' },
          { who: null, text: 'אתה קופא. היא לא מסתכלת. קרן צוחקת בלי קול.' },
        ],
      },
    ],
  },

  // ================================================================== the schoolyard ==
  {
    id: 'ofir-yard',
    nameHe: 'אופיר',
    branches: [
      {
        when: { flag: 'note:caught' },
        lines: [
          { who: 'אופיר', text: 'שמעתי שהמורה קוראת פתקים עכשיו.' },
          { who: 'פוגי', text: 'היא לא קראה.' },
          { who: 'אופיר', text: 'ברור שהיא קראה.' },
          { who: 'אופיר', text: 'לא משנה. בשמונה בערב. אתה מכיר את הדרך.' },
        ],
        then: [{ e: 'flag', flag: 'plan:tonight' }, { e: 'bond', who: 'ofir', delta: 3 }],
      },
      {
        when: { flag: 'plan:tonight' },
        lines: [
          { who: 'אופיר', text: 'קיבלתי "ברור". יופי.' },
          { who: 'אופיר', text: 'עמית שומר מקומות. אבל עמית שומר מקומות כמו שעמית שומר סודות.' },
          { who: null, text: 'הוא צוחק מהבדיחה של עצמו כל הדרך לכיתה.' },
        ],
        then: [{ e: 'redheart', key: 'basketballLove', delta: 4 }],
      },
      {
        lines: [
          { who: 'אופיר', text: 'נו? קיבלת את הפתק או לא?' },
          { who: 'פוגי', text: 'קיבלתי.' },
          { who: 'אופיר', text: 'אז זהו. בערב.' },
        ],
        then: [{ e: 'flag', flag: 'plan:tonight' }],
      },
    ],
  },
  {
    id: 'amit-yard',
    nameHe: 'עמית',
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'תשמע, אני נכנס מוקדם. אני תמיד נכנס מוקדם.' },
          { who: 'עמית', text: 'תגיע לפני שמכניסים את כולם, אחרת תעמוד ליד הדלת עם הסדרן.' },
          { who: null, text: 'הוא אומר את זה כאילו הוא מסביר משהו טכני לילד קטן. הוא בן שתים עשרה וחצי.' },
        ],
        then: [{ e: 'flag', flag: 'knows:early' }, { e: 'trait', trait: 'knowledge', delta: 3 }],
      },
    ],
  },
  {
    id: 'keren-yard',
    nameHe: 'קרן',
    branches: [
      {
        lines: [
          { who: 'קרן', text: 'אני לא הולכת. יש לי מבחן.' },
          { who: 'פוגי', text: 'גם לי יש מבחן.' },
          { who: 'קרן', text: 'אני יודעת.' },
          { who: null, text: 'היא לא אומרת את זה רע. זה יותר גרוע.' },
        ],
        then: [{ e: 'wellbeing', key: 'stress', delta: 4 }],
      },
    ],
  },
  {
    id: 'yard-ball',
    branches: [
      {
        when: { flag: 'played:yard' },
        lines: [{ who: null, text: 'הכדור אצל מישהו אחר עכשיו. גם ככה נגמרה ההפסקה.' }],
      },
      {
        lines: [
          { who: null, text: 'כדור גומי מקרטע על אספלט, וסל בלי רשת בקצה החצר.' },
          { who: null, text: 'אחד־על־אחד עד חמש. אף פעם לא נגמר בחמש.' },
        ],
        choices: [
          {
            id: 'play',
            text: 'לשחק. משחק אחד.',
            then: [
              { e: 'flag', flag: 'played:yard' },
              { e: 'time', minutes: 20 },
              { e: 'redheart', key: 'basketballLove', delta: 6 },
              { e: 'personality', key: 'impulsiveness', delta: 3 },
              { e: 'toast', text: 'משחק אחד. ואז עוד אחד. ואז הצלצול.', tone: 'plain' },
            ],
          },
          {
            id: 'watch',
            text: 'להסתכל מהצד.',
            then: [
              { e: 'time', minutes: 5 },
              { e: 'personality', key: 'curiosity', delta: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'yard-fence',
    branches: [
      {
        lines: [
          { who: null, text: 'הגדר של החצר, ומעבר לה הרחוב שאתה הולך בו הביתה כל יום.' },
          { who: null, text: 'מכאן זה נראה קצר. זה לא קצר.' },
        ],
      },
    ],
  },

  {
    id: 'ofir-afternoon-1991',
    nameHe: 'אופיר',
    branches: [
      {
        when: { flag: 'permission:no' },
        lines: [
          { who: 'אופיר', text: 'אז מה, אתה לא בא?' },
          { who: 'פוגי', text: 'לא יודע.' },
          { who: 'אופיר', text: 'תגיד לי עד שבע. אני לא מחכה לך ברחוב כמו אידיוט.' },
        ],
      },
      {
        when: { afterMinute: 17 * 60 },
        lines: [
          { who: 'אופיר', text: 'אני הולך מוקדם. בשבע וחצי אני שם.' },
          { who: null, text: 'הוא כבר הולך אחורה בזמן שהוא מדבר, כמו שהוא עושה מאז כיתה ב׳.' },
        ],
      },
      {
        lines: [
          { who: 'אופיר', text: 'גמרת שיעורים?' },
          { who: 'פוגי', text: 'לא התחלתי.' },
          { who: 'אופיר', text: 'יופי. גם אני.' },
          { who: null, text: 'זה לא באמת מנחם, אבל זה משהו.' },
        ],
        then: [{ e: 'bond', who: 'ofir', delta: 2 }],
      },
    ],
  },

  // ======================================================================== at home ==
  {
    id: 'homework-1991',
    branches: [
      {
        when: { flag: 'hw:done' },
        lines: [{ who: null, text: 'המחברת סגורה על השולחן. עמוד ארבעים ואחת, כולו, בכתב יד שלך.' }],
      },
      {
        when: { notFlag: 'hw:given' },
        lines: [{ who: null, text: 'השולחן. אין מה לעשות עליו עכשיו.' }],
      },
      {
        lines: [
          { who: null, text: 'עמוד ארבעים ואחת. שלוש עשרה שאלות, וכל אחת מהן ארוכה יותר מהקודמת.' },
          { who: null, text: 'מהמטבח נשמע רדיו. השעון בסלון עושה את הקול שלו.' },
        ],
        choices: [
          {
            id: 'all',
            text: 'לעשות הכול. באמת.',
            then: [
              { e: 'flag', flag: 'hw:done' },
              { e: 'time', minutes: 50 },
              { e: 'personality', key: 'responsibility', delta: 8 },
              { e: 'wellbeing', key: 'exhaustion', delta: 6 },
              { e: 'toast', text: 'שלוש עשרה שאלות. הידיים כואבות. אבל זה גמור.', tone: 'plain' },
            ],
          },
          {
            id: 'half',
            text: 'לעשות חצי, ולהשאיר פתוח באמצע.',
            then: [
              { e: 'flag', flag: 'hw:half' },
              { e: 'time', minutes: 20 },
              { e: 'personality', key: 'streetSmarts', delta: 4 },
              { e: 'toast', text: 'שש שאלות, והמחברת נשארת פתוחה על השולחן כאילו קמת לרגע.', tone: 'plain' },
            ],
          },
          {
            id: 'fake',
            text: 'לכתוב משהו שנראה כמו תשובות.',
            then: [
              { e: 'flag', flag: 'hw:faked' },
              { e: 'time', minutes: 8 },
              { e: 'personality', key: 'riskTolerance', delta: 5 },
              { e: 'wellbeing', key: 'stress', delta: 5 },
              { e: 'toast', text: 'שורות מלאות. אם לא מסתכלים מקרוב, זה עובד.', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'rachel-1991',
    nameHe: 'רחל',
    branches: [
      // ---- the night is over: the consequence (§44) ---------------------------------
      {
        when: { all: [{ flag: 'derby:over' }, { flag: 'curfew:broken' }] },
        lines: [
          { who: 'פוגי', text: 'ניצחנו.' },
          { who: 'רחל', text: 'ראיתי מה השעה.', closeUp: 'cuRachelWatch' },
          { who: 'פוגי', text: 'בדרבי.' },
          { who: 'רחל', text: 'ראיתי מה השעה.' },
          { who: null, text: 'היא לא מרימה את הקול. היא לא צריכה.' },
          { who: 'רחל', text: 'לך תישן. מחר בית ספר.' },
        ],
        then: [
          { e: 'flag', flag: 'walked:home' },
          { e: 'rel', who: 'rachel', axis: 'trust', delta: -8 },
          { e: 'rel', who: 'rachel', axis: 'tension', delta: 6 },
          { e: 'remember', who: 'rachel', eventId: 'came-home-late-1991', significance: 'major' },
          { e: 'keep' },
          { e: 'ending', id: 'hall' },
        ],
      },
      {
        when: { all: [{ flag: 'derby:over' }, { flag: 'curfew:kept' }] },
        lines: [
          { who: 'רחל', text: 'ראית עד הסוף?' },
          { who: 'פוגי', text: 'לא.' },
          { who: null, text: 'היא מסתכלת עליך שנייה יותר מדי.' },
          { who: 'רחל', text: 'טוב.' },
          { who: null, text: 'זה כואב קצת. שניכם יודעים.' },
        ],
        then: [
          { e: 'flag', flag: 'walked:home' },
          { e: 'rel', who: 'rachel', axis: 'trust', delta: 10 },
          { e: 'remember', who: 'rachel', eventId: 'came-home-on-time-1991', significance: 'major' },
          { e: 'keep' },
          { e: 'ending', id: 'wall' },
        ],
      },
      {
        when: { all: [{ flag: 'derby:over' }, { notFlag: 'uss:arrived' }] },
        lines: [
          { who: 'רחל', text: 'נגמר?' },
          { who: 'פוגי', text: 'נגמר.' },
          { who: 'רחל', text: 'שמעתי מהרדיו של השכנים. כל הבניין שמע.' },
          { who: null, text: 'היא מכבה את האור במטבח.' },
        ],
        then: [{ e: 'keep' }, { e: 'ending', id: 'missed' }],
      },

      // ---- the boss fight (§30) ------------------------------------------------------
      {
        when: { all: [{ flag: 'permission:yes' }, { beforeMinute: TIP_OFF }] },
        lines: [
          { who: 'רחל', text: 'בתשע וחצי אתה בבית. לא בתשע וארבעים.' },
          { who: 'פוגי', text: 'טוב.' },
          { who: 'רחל', text: 'תגיד "טוב" עוד פעם, ככה שאני אאמין.' },
          { who: 'פוגי', text: 'טוב!' },
        ],
      },
      {
        when: { all: [{ flag: 'permission:no' }, { beforeMinute: TIP_OFF }] },
        lines: [
          { who: 'רחל', text: 'אמרתי לא.' },
          { who: null, text: 'היא לא מוסיפה למה. יש ערבים שבהם אין למה.' },
        ],
      },
      {
        when: { flag: 'hw:done' },
        lines: [
          { who: 'רחל', text: 'שיעורים.' },
          { who: 'פוגי', text: 'עשיתי.' },
          { who: 'רחל', text: 'הכול?' },
          { who: 'פוגי', text: 'הכול.' },
          { who: null, text: 'היא הולכת לחדר, פותחת את המחברת, ומסתכלת בעמוד שלוש שניות.' },
          { who: 'רחל', text: 'יש היום משחק, נכון.' },
        ],
        choices: [
          {
            id: 'ask',
            text: '"אפשר?"',
            then: [
              { e: 'flag', flag: 'asked:mum' },
              { e: 'flag', flag: 'permission:yes' },
              { e: 'rel', who: 'rachel', axis: 'trust', delta: 6 },
              { e: 'toast', text: 'רחל: "בתשע וחצי בבית. אני לא אומרת את זה פעמיים."', tone: 'red' },
            ],
          },
          {
            id: 'wait',
            text: 'לא לשאול. לחכות שהיא תגיד.',
            then: [
              { e: 'flag', flag: 'asked:mum' },
              { e: 'flag', flag: 'permission:yes' },
              { e: 'personality', key: 'stubbornness', delta: 4 },
              { e: 'toast', text: 'רחל: "לך כבר. בתשע וחצי בבית."', tone: 'red' },
            ],
          },
        ],
      },
      {
        when: { any: [{ flag: 'hw:half' }, { flag: 'hw:faked' }] },
        lines: [
          { who: 'רחל', text: 'שיעורים.' },
          { who: 'פוגי', text: 'עשיתי.' },
          { who: null, text: 'היא הולכת לחדר. את המחברת היא לא פותחת — היא רק מסתכלת עליה מהדלת.' },
          { who: 'רחל', text: 'יש היום משחק.' },
          { who: 'פוגי', text: 'יש.' },
        ],
        choices: [
          {
            id: 'truth',
            text: '"לא גמרתי. אני אגמור מחר בבוקר."',
            then: [
              { e: 'flag', flag: 'asked:mum' },
              { e: 'flag', flag: 'permission:yes' },
              { e: 'rel', who: 'rachel', axis: 'trust', delta: 8 },
              { e: 'remember', who: 'rachel', eventId: 'told-the-truth-1991', significance: 'notable' },
              { e: 'toast', text: 'רחל: "בתשע וחצי. ובבוקר אתה קם לפני כולם."', tone: 'red' },
            ],
          },
          {
            id: 'push',
            text: '"גמרתי, נשבע."',
            then: [
              { e: 'flag', flag: 'asked:mum' },
              { e: 'flag', flag: 'permission:no' },
              { e: 'rel', who: 'rachel', axis: 'tension', delta: 6 },
              { e: 'remember', who: 'rachel', eventId: 'lied-about-homework-1991', significance: 'notable' },
              { e: 'toast', text: 'רחל: "אז אתה גם לא צריך ללכת לשום מקום. לא הערב."', tone: 'red' },
            ],
          },
        ],
      },
      {
        lines: [
          { who: 'רחל', text: 'שיעורים.' },
          { who: 'פוגי', text: 'יש היום משחק.' },
          { who: 'רחל', text: 'יופי.' },
          { who: null, text: 'שתיקה.' },
          { who: 'רחל', text: 'שיעורים.' },
        ],
        then: [{ e: 'flag', flag: 'hw:given' }],
      },
    ],
  },
  {
    id: 'kobi-1991',
    nameHe: 'קובי',
    branches: [
      {
        when: { all: [{ flag: 'permission:no' }, { relationship: { who: 'kobi', axis: 'bond', min: 45 } }] },
        lines: [
          { who: 'קובי', text: 'שמעתי.' },
          { who: 'פוגי', text: 'היא אמרה לא.' },
          { who: 'קובי', text: 'היא אמרה לא כי אמרת לה משהו שהיא ידעה שהוא לא נכון.' },
          { who: null, text: 'הוא מקפל את העיתון על הברך.' },
          { who: 'קובי', text: 'אני לא הולך לדבר בשבילך. אבל אם תלך אליה ותגיד את זה בלי לשקר — אני לא אפריע.' },
        ],
        then: [{ e: 'flag', flag: 'kobi:nudged' }, { e: 'rel', who: 'kobi', axis: 'trust', delta: 4 }],
      },
      {
        when: { beforeMinute: TIP_OFF },
        lines: [
          { who: 'קובי', text: 'כדורסל זה לא אותו דבר.' },
          { who: 'פוגי', text: 'זה אותה קבוצה.' },
          { who: 'קובי', text: 'זה אותה קבוצה.' },
          { who: null, text: 'הוא לא מרים את העיניים מהעיתון, אבל הוא אומר את זה פעמיים.' },
        ],
        then: [{ e: 'redheart', key: 'familyTradition', delta: 3 }],
      },
      {
        lines: [
          { who: 'קובי', text: 'נו? היה?' },
          { who: 'פוגי', text: 'היה.' },
          { who: 'קובי', text: 'אז היה.' },
        ],
      },
    ],
  },
  {
    id: 'kitchen-note-1991',
    branches: [
      {
        when: { flag: 'sneak:ready' },
        lines: [{ who: null, text: 'הפתק שלך על השולחן, מתחת לכוס. "חוזר בעשר. פוגי."' }],
      },
      {
        when: { flag: 'permission:no' },
        lines: [
          { who: null, text: 'שולחן המטבח. עיפרון, ופנקס שאמא כותבת בו רשימות.' },
          { who: null, text: 'אפשר לצאת בלי להגיד כלום. אפשר גם לא לצאת.' },
        ],
        choices: [
          {
            id: 'note',
            text: 'להשאיר פתק ולצאת.',
            then: [
              { e: 'flag', flag: 'sneak:ready' },
              { e: 'personality', key: 'riskTolerance', delta: 6 },
              { e: 'wellbeing', key: 'stress', delta: 8 },
              { e: 'toast', text: 'כתבת "חוזר בעשר" ושמת מתחת לכוס. הדלת נסגרת בשקט.', tone: 'plain' },
            ],
          },
          {
            id: 'stay',
            text: 'להשאיר את זה. להישאר.',
            then: [
              { e: 'flag', flag: 'night:home' },
              { e: 'personality', key: 'responsibility', delta: 6 },
              { e: 'toast', text: 'החזרת את העיפרון למקום.', tone: 'plain' },
            ],
          },
        ],
      },
      {
        lines: [{ who: null, text: 'שולחן המטבח. פנקס, עיפרון, וכוס הפוכה על מגבת.' }],
      },
    ],
  },

  // ============================================================== outside the hall ==
  {
    id: 'usher-night',
    nameHe: 'סדרן',
    branches: [
      {
        when: { flag: 'derby:over' },
        lines: [
          { who: 'סדרן', text: 'לילה טוב, פוגי.', closeUp: 'cuUsherNight' },
          { who: null, text: 'הוא לא שאל אותך איך קוראים לך. אף פעם. פשוט יודע.' },
        ],
        then: [{ e: 'redheart', key: 'community', delta: 5 }],
      },
      {
        when: { flag: 'uss:arrived' },
        lines: [
          { who: 'סדרן', text: 'פנימה, פנימה. תעמוד ליד המדרגה, לא על המדרגה.' },
          { who: null, text: 'הוא אומר את זה לכל מי שנכנס. אף אחד לא מקשיב, כולל אתה.' },
        ],
      },
      {
        lines: [
          { who: 'סדרן', text: 'היום יש. אתה יודע שיש.' },
          { who: 'סדרן', text: 'תיכנס מוקדם אם אתה רוצה לראות משהו. אחר כך זה קיר של אנשים.' },
        ],
        then: [{ e: 'flag', flag: 'knows:early' }],
      },
    ],
  },
  {
    id: 'uss-queue',
    branches: [
      {
        lines: [
          { who: null, text: 'תור קצר וצפוף לפני הדלת. אנשים מכירים אנשים; אף אחד לא באמת עומד בתור.' },
          { who: 'אוהד', text: 'מה קורה פוגי.' },
          { who: null, text: 'אתה לא יודע איך קוראים לו. הוא יודע איך קוראים לך. ככה זה כאן.' },
        ],
        then: [{ e: 'redheart', key: 'community', delta: 4 }, { e: 'flag', flag: 'uss:known' }],
      },
    ],
  },

  // ================================================================ inside the hall ==
  {
    id: 'amit-hall',
    nameHe: 'עמית',
    branches: [
      {
        when: { flag: 'spot:lost' },
        lines: [
          { who: 'עמית', text: 'איפה היית?' },
          { who: 'פוגי', text: 'הלכתי רגע.' },
          { who: 'עמית', text: 'רגע.' },
          { who: null, text: 'עכשיו אתם עומדים מאחורי בן אדם ששני ראשים יותר גבוה ממך, וזה המקום שלכם.' },
        ],
        then: [{ e: 'bond', who: 'amit', delta: -2 }, { e: 'wellbeing', key: 'happiness', delta: -4 }],
      },
      {
        when: { flag: 'spot:held' },
        lines: [
          { who: 'עמית', text: 'שמרת.' },
          { who: 'פוגי', text: 'שמרתי.' },
          { who: 'עמית', text: 'אתה בסדר.' },
          { who: null, text: 'זה כל מה שהוא אומר, וזה מספיק לכל הערב.' },
        ],
        then: [{ e: 'bond', who: 'amit', delta: 6 }, { e: 'redheart', key: 'community', delta: 5 }],
      },
      {
        when: { flag: 'spot:asked' },
        lines: [
          { who: 'עמית', text: 'אני חוזר עוד רגע. אל תזוז מהמקום.' },
          { who: null, text: 'הוא נעלם בין האנשים. המקום ריק מצדך אחד ומלא מהצד השני.' },
        ],
      },
      {
        lines: [
          { who: 'עמית', text: 'טוב, זה המקום. משם רואים את כל המגרש חוץ מהפינה.' },
          { who: 'עמית', text: 'אני הולך להביא משהו. תשמור.' },
          { who: null, text: 'הוא לא מחכה לתשובה.' },
        ],
        then: [{ e: 'flag', flag: 'spot:asked' }],
      },
    ],
  },
  {
    id: 'hall-spot',
    branches: [
      {
        when: { flag: 'spot:held' },
        lines: [{ who: null, text: 'המקום שלכם. שני זוגות רגליים על מדרגה אחת, וזה בסדר.' }],
      },
      {
        when: { flag: 'spot:asked' },
        lines: [
          { who: null, text: 'המדרגה. אתה עומד רחב כמה שילד בן שתים עשרה יכול לעמוד רחב.' },
          { who: null, text: 'מישהו נדחף. אתה לא זז. הוא מוצא מקום אחר.' },
        ],
        then: [
          { e: 'flag', flag: 'spot:held' },
          { e: 'personality', key: 'stubbornness', delta: 5 },
          { e: 'toast', text: 'שמרת על המקום. הכתף כואבת קצת.', tone: 'plain' },
        ],
      },
      {
        lines: [
          { who: null, text: 'מדרגת בטון, שחוקה באמצע מרגליים. מכאן רואים.' },
        ],
      },
    ],
  },
  {
    id: 'hall-vendor',
    nameHe: 'מוכר',
    branches: [
      {
        when: { flag: 'bought:food' },
        lines: [{ who: 'מוכר', text: 'נגמר. תבוא במחצית.' }],
      },
      {
        when: { minAgorot: 50 },
        lines: [
          { who: 'מוכר', text: 'יש חם, יש קר, יש מה שנשאר.' },
          { who: null, text: 'הריח של הגריל נכנס לך לחולצה ויישאר שם עד מחר.' },
        ],
        choices: [
          {
            id: 'buy',
            text: 'לקנות משהו חם.',
            then: [
              { e: 'money', agorot: -50, why: 'בקיוסק של האולם' },
              { e: 'flag', flag: 'bought:food' },
              { e: 'give', item: 'wrapper' },
              { e: 'time', minutes: 8 },
              { e: 'wellbeing', key: 'happiness', delta: 6 },
            ],
          },
          {
            id: 'phone',
            text: '"יש לך טלפון?"',
            when: { flag: 'permission:yes' },
            noteHe: 'רק אם יש למי להתקשר.',
            then: [
              { e: 'flag', flag: 'told:home' },
              { e: 'time', minutes: 6 },
              { e: 'rel', who: 'rachel', axis: 'trust', delta: 5 },
              { e: 'toast', text: 'הוא נותן לך את הטלפון של המזנון. שתי צלצולים, ואמא עונה. אמרת איפה אתה.', tone: 'plain' },
            ],
          },
          { id: 'no', text: 'לא עכשיו.', then: [] },
        ],
      },
      {
        lines: [
          { who: 'מוכר', text: 'בלי כסף אין כלום, ילד. אבל אתה יכול לעמוד ליד ולהריח.' },
          { who: null, text: 'אתה עומד ליד ומריח.' },
        ],
      },
    ],
  },
  {
    id: 'hall-rail',
    branches: [
      {
        lines: [
          { who: null, text: 'מעקה ברזל בקצה המדרגה, קר וחלק מאלף ידיים.' },
          { who: null, text: 'מכאן עד הקו הלבן יש פחות ממטר. אתה יכול לשמוע נעליים חורקות על הפרקט.' },
        ],
        then: [{ e: 'redheart', key: 'basketballLove', delta: 4 }],
      },
    ],
  },
  {
    id: 'hall-clock',
    branches: [
      {
        when: { afterMinute: CURFEW },
        lines: [
          { who: null, text: 'השעון על הקיר. אתה מסתכל עליו ומיד מסתכל למגרש, כאילו זה יעזור.' },
        ],
        then: [{ e: 'wellbeing', key: 'stress', delta: 5 }],
      },
      {
        lines: [{ who: null, text: 'שעון קיר עגול מעל הדלת. המחוג הגדול קופץ, לא זז.' }],
      },
    ],
  },

  // ---------------------------------------------------------------- the derby beats --
  // Started by the director (`derby1991.ts`), never by a hotspot: these are moments the
  // night produces, and a moment you can walk up to and press is not a moment.
  {
    id: 'derby:chant',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'מישהו מתחיל, שתי מדרגות מעליך. אחר כך עוד שניים. אחר כך כל הצד הזה.' },
          { who: 'אופיר', text: 'זה מה שאני שר.' },
          { who: 'פוגי', text: 'זה לא המילים.' },
          { who: 'אוהד ותיק', text: 'שניכם שרים לא נכון.' },
        ],
        choices: [
          {
            id: 'join',
            text: 'לשיר. חזק, גם אם לא נכון.',
            then: [
              { e: 'flag', flag: 'chant:joined' },
              { e: 'redheart', key: 'terraceCulture', delta: 8 },
              { e: 'wellbeing', key: 'belonging', delta: 8 },
              { e: 'toast', text: 'עד סוף השורה כולכם שרים את אותו הדבר. בערך.', tone: 'red' },
            ],
          },
          {
            id: 'help',
            text: 'ללחוש לאופיר את המילים.',
            then: [
              { e: 'flag', flag: 'chant:helped' },
              { e: 'bond', who: 'ofir', delta: 5 },
              { e: 'redheart', key: 'community', delta: 6 },
              { e: 'toast', text: 'אתה לוחש. הוא חוזר אחריך בקול רם מדי. הוותיק מרים גבה ולא מתקן.', tone: 'plain' },
            ],
          },
          {
            id: 'clap',
            text: 'רק למחוא כפיים.',
            then: [
              { e: 'flag', flag: 'chant:quiet' },
              { e: 'wellbeing', key: 'belonging', delta: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'derby:curfew',
    nameHe: null,
    branches: [
      {
        when: { flag: 'told:home' },
        lines: [
          { who: null, text: 'תשע וחצי. אתה יודע את זה בלי להסתכל על השעון.' },
          { who: null, text: 'אבל התקשרת. אמרת איפה אתה. זה לא הופך את זה למותר — זה רק הופך את זה למשהו שסיפרת.' },
        ],
      },
      {
        lines: [
          { who: null, text: 'תשע וחצי. השעה שהיא אמרה, והמשחק עוד חי.' },
          { who: 'אופיר', text: 'אתה הולך עכשיו?' },
          { who: null, text: 'הדלת מאחוריך. המגרש לפניך. אף אחד לא יבחר בשבילך.' },
        ],
        then: [{ e: 'wellbeing', key: 'stress', delta: 6 }],
      },
    ],
  },
  {
    id: 'derby:friend',
    nameHe: 'אופיר',
    branches: [
      {
        when: { flag: 'curfew:now' },
        lines: [
          { who: 'אופיר', text: 'אמא שלך אמרה שעה?' },
          { who: 'פוגי', text: 'אמרה.' },
          { who: 'אופיר', text: 'אז זה עניין שלך.' },
          { who: null, text: 'הוא לא מנסה לשכנע אותך להישאר. זה מה שהופך את זה לקשה.' },
        ],
      },
      {
        lines: [
          { who: 'אופיר', text: 'תראה את זה. תראה!' },
          { who: null, text: 'אתה לא מספיק לראות מה. כולם קמים באותו רגע, וגם אתה.' },
        ],
        then: [{ e: 'wellbeing', key: 'happiness', delta: 5 }],
      },
    ],
  },

  // ================================================================ the way home =====
  {
    id: 'street-night-1991',
    branches: [
      {
        when: { flag: 'heard:wall' },
        lines: [
          { who: null, text: 'רחוב ריק. מאחוריך, מבעד לקיר, גל של קול עולה ונשבר ועולה שוב.' },
          { who: null, text: 'אתה עומד. אתה לא חוזר. אתה גם לא ממשיך ללכת.' },
        ],
        then: [{ e: 'wellbeing', key: 'regret', delta: 6 }, { e: 'redheart', key: 'loyaltyReturn', delta: 6 }],
      },
      {
        lines: [
          { who: null, text: 'הרחוב בלילה קצר יותר מהרחוב ביום. אותו רחוב.' },
        ],
      },
    ],
  },
]
