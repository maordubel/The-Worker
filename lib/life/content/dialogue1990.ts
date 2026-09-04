import type { Conversation } from './script'

/**
 * 1990 — what people say, and what they will not.
 *
 * The rule of `dialogue.ts` — no date, no opponent, no score, no scorer, no attendance in
 * an authored line — is kept, and it bites harder here because the whole day is people
 * doing arithmetic out loud. They do it in WORDS: "the same points, the same difference,
 * they scored more". Every number the archive holds is read off the anchor by the match
 * director at runtime; every number the archive does not hold is a rumour, and the log
 * records it as one.
 *
 * The other rule of this chapter is the brief's: never `+5 KNOWLEDGE`. A child who
 * worked out the race carefully has an easier afternoon at the radio; a child who said
 * "let them score six" has a joke waiting for him. Nothing says which was right.
 */

export const CONVERSATIONS_1990: Conversation[] = [
  // ============================================================== the kitchen ======
  {
    id: 'table-1990',
    nameHe: null,
    branches: [
      {
        when: { flag: 'knows:math' },
        lines: [
          { who: null, text: 'הטבלה, העיתון, העיפרון. החשבון כבר עשוי — בראש שלך, או של אבא.' },
          { who: null, text: 'מה שנשאר זה לראות אם הוא נכון.' },
        ],
      },
      {
        lines: [
          { who: null, text: 'העיתון פתוח על הטבלה. שתי שורות מסומנות בעיפרון: שלנו, ושל יבנה.' },
          { who: null, text: 'אותן נקודות. אותו הפרש. ליד השורה שלהם אבא כתב מספר קטן ועיגל אותו פעמיים.' },
        ],
        choices: [
          {
            id: 'careful',
            text: 'לקרוא את כל הטבלה. לאט.',
            then: [
              { e: 'time', minutes: 10 },
              { e: 'flag', flag: 'knows:math' },
              { e: 'flag', flag: 'math:careful' },
              { e: 'personality', key: 'curiosity', delta: 6 },
              { e: 'trait', trait: 'knowledge', delta: 5 },
              { e: 'toast', text: 'הבנת: הם כבשו יותר. לנצח לא מספיק — צריך לנצח בגדול יותר מהם.', tone: 'plain' },
            ],
          },
          {
            id: 'six',
            text: '"שישימו שש וזהו."',
            then: [
              { e: 'flag', flag: 'knows:math' },
              { e: 'flag', flag: 'math:six' },
              { e: 'personality', key: 'impulsiveness', delta: 6 },
              { e: 'redheart', key: 'footballLove', delta: 4 },
              { e: 'toast', text: 'אבא מרים את העיניים מהעיתון. לא אומר כלום.', tone: 'plain' },
            ],
          },
          {
            id: 'wrong',
            text: '"אם מנצחים — עולים. נקודה."',
            then: [
              { e: 'flag', flag: 'knows:math' },
              { e: 'flag', flag: 'math:wrong' },
              { e: 'personality', key: 'stubbornness', delta: 5 },
              { e: 'toast', text: 'אבא: "לא בטוח." אתה: "בטוח." הוא לא מתווכח. זה גרוע יותר.', tone: 'plain' },
            ],
          },
          {
            id: 'ask',
            text: 'לשאול את אבא.',
            then: [{ e: 'goto', node: 'kobi-table-1990' }],
          },
        ],
      },
    ],
  },
  {
    id: 'kobi-table-1990',
    nameHe: 'קובי',
    branches: [
      {
        when: { flag: 'kobi:leaving' },
        lines: [{ who: 'קובי', text: 'יוצאים.' }],
        choices: [
          {
            id: 'now',
            text: 'לקום וללכת איתו.',
            then: [
              { e: 'flag', flag: 'went:withKobi' },
              { e: 'flag', flag: 'kobi:left' },
              { e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 6 },
              { e: 'redheart', key: 'familyTradition', delta: 6 },
              { e: 'time', minutes: 30 },
              { e: 'toast', text: 'הלכתם. הוא לא החזיק לך את היד.', tone: 'plain' },
              { e: 'travel', to: 'bloomfield-outside', spawn: 'fromRoute' },
            ],
          },
          {
            id: 'five',
            text: '"חמש דקות."',
            when: { notFlag: 'asked:five' },
            noteHe: 'כבר ביקשת חמש',
            then: [
              { e: 'flag', flag: 'asked:five' },
              { e: 'rel', who: 'kobi', axis: 'tension', delta: 3 },
              { e: 'toast', text: '"חמש. ואני לא סופר עד שש."', tone: 'plain' },
            ],
          },
          {
            id: 'friends',
            text: '"אני בא עם אופיר. שער 7."',
            when: { flag: 'ofir:invited' },
            noteHe: 'אופיר עוד לא הזמין',
            then: [
              { e: 'flag', flag: 'going:friends' },
              { e: 'flag', flag: 'kobi:left' },
              { e: 'personality', key: 'independence', delta: 6 },
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 3 },
              { e: 'toast', text: '"שער 7. ליד העמוד. אל תאחר." הדלת נסגרת.', tone: 'plain' },
            ],
          },
        ],
      },
      {
        when: { flag: 'knows:math' },
        lines: [
          { who: 'קובי', text: 'יוצאים בשלוש ועשרה. אל תיעלם לי.' },
          { who: null, text: 'הוא חוזר לעיתון. הטרנזיסטור לידו, כבוי, כמו כלב שמחכה.' },
        ],
      },
      {
        lines: [
          { who: 'קובי', text: 'תראה. אותן נקודות. אותו הפרש.' },
          { who: 'קובי', text: 'הם כבשו יותר מאיתנו במשך העונה. אז אם שניהם מנצחים באותו דבר — הם עולים.' },
          { who: 'קובי', text: 'אנחנו צריכים לנצח יותר ממה שהם מנצחים. וזה לא תלוי רק בנו.' },
          { who: 'פוגי', text: 'אז איך נדע?' },
          { who: 'קובי', text: 'ככה.' },
          { who: null, text: 'הוא מקיש באצבע על הטרנזיסטור.' },
        ],
        then: [
          { e: 'time', minutes: 8 },
          { e: 'flag', flag: 'knows:math' },
          { e: 'flag', flag: 'math:kobi' },
          { e: 'flag', flag: 'knows:radio' },
          { e: 'rel', who: 'kobi', axis: 'familiarity', delta: 5 },
          { e: 'redheart', key: 'familyTradition', delta: 5 },
        ],
      },
    ],
  },
  {
    id: 'radio-table-1990',
    branches: [
      {
        when: { flag: 'knows:radio' },
        lines: [
          { who: null, text: 'הטרנזיסטור. האנטנה מכופפת מהפעם שנפל בשנה שעברה.' },
          { who: 'קובי', text: 'הרדיו בא איתי. אתה בא איתי, הרדיו בא איתך.' },
        ],
      },
      {
        lines: [
          { who: null, text: 'טרנזיסטור קטן, שחור, עם אנטנה מכופפת. אתה מסובב את הכפתור.' },
          { who: null, text: 'רעש. קול. רעש. מישהו אומר "שבת" ו"מחזור אחרון" ונעלם ברעש.' },
          { who: 'קובי', text: 'עזוב את זה. בארבע זה ידבר.' },
        ],
        then: [
          { e: 'flag', flag: 'knows:radio' },
          { e: 'personality', key: 'curiosity', delta: 3 },
        ],
      },
    ],
  },
  {
    id: 'rachel-1990',
    nameHe: 'רחל',
    branches: [
      // In through the gate after the whistle: he saw the pitch full of people and not
      // one minute of football, and found his father in it. The ending is "late".
      {
        when: { all: [{ flag: 'found:kobi' }, { flag: 'entry:late' }] },
        lines: [
          { who: 'רחל', text: 'נו?' },
          { who: 'קובי', text: 'עלינו. הוא הגיע לחגיגה.' },
          { who: 'רחל', text: 'העיקר שהגיע. נעליים בחוץ.' },
        ],
        then: [{ e: 'flag', flag: 'walked:home' }, { e: 'keep' }, { e: 'ending', id: 'late' }],
      },
      {
        when: { flag: 'found:kobi' },
        lines: [
          { who: 'רחל', text: 'נו?', closeUp: 'cuRachelNu' },
          { who: null, text: 'שניכם, ביחד:' },
          { who: 'פוגי', text: 'עלינו.' },
          { who: 'רחל', text: 'יופי. נעליים בחוץ.' },
          { who: null, text: 'יום היסטורי. אמא רגילה.' },
        ],
        then: [{ e: 'flag', flag: 'walked:home' }, { e: 'keep' }, { e: 'ending', id: 'home' }],
      },
      {
        when: { all: [{ flag: 'match:over' }, { notFlag: 'entry:granted' }] },
        lines: [
          { who: 'רחל', text: 'לא הלכת?' },
          { who: 'פוגי', text: 'הלכתי. לא נכנסתי.' },
          { who: 'רחל', text: 'אבא יחזור צרוד. תשים לו מים.' },
        ],
        then: [{ e: 'keep' }, { e: 'ending', id: 'missed' }],
      },
      {
        when: { flag: 'got:pocket' },
        lines: [
          { who: 'רחל', text: 'שיעורים יש מחר. אני לא שוכחת.' },
          { who: 'רחל', text: 'ואל תבזבז את הכסף על שטויות.' },
        ],
      },
      {
        lines: [
          { who: 'רחל', text: 'שניכם עוד פה?' },
          { who: null, text: 'היא עוברת מאחוריך עם סל כביסה, ומניחה משהו על השולחן בלי להסתכל.' },
          { who: 'רחל', text: 'קח. תקנה משהו לאכול שם. ותחזור עם אבא, לא לבד.' },
        ],
        then: [
          { e: 'flag', flag: 'got:pocket' },
          { e: 'money', agorot: 300, why: 'מאמא' },
          { e: 'give', item: 'pocket-money' },
          { e: 'rel', who: 'rachel', axis: 'trust', delta: 4 },
          { e: 'toast', text: 'שטר אחד, מקופל לארבע', tone: 'red' },
        ],
      },
    ],
  },

  // ============================================================== the flat ========
  {
    id: 'phone-1990',
    branches: [
      {
        when: { flag: 'ofir:invited' },
        lines: [{ who: null, text: 'הטלפון שקט. אופיר אמר קיוסק, ואופיר לא מתקשר פעמיים.' }],
      },
      {
        when: { notFlag: 'kobi:left' },
        lines: [
          { who: null, text: 'הטלפון מצלצל בדיוק כשאתה עובר לידו. כאילו חיכה.' },
          { who: 'אופיר', text: 'פוגי? באים בשלוש. קיוסק. עמית מביא כסף, אני מביא את הראש.' },
          { who: 'פוגי', text: 'אבא לוקח אותי.' },
          { who: 'אופיר', text: 'אבא לוקח אותך. יופי. גם אותנו לוקחים. הרגליים.' },
          { who: null, text: 'הוא מנתק. הוא תמיד מנתק ראשון.' },
        ],
        then: [
          { e: 'flag', flag: 'ofir:invited' },
          { e: 'bond', who: 'ofir', delta: 3 },
        ],
      },
      {
        lines: [{ who: null, text: 'הטלפון. שקט. כולם כבר בדרך.' }],
      },
    ],
  },
  {
    id: 'photo-1990',
    branches: [
      {
        lines: [
          { who: null, text: 'התמונה על המזנון. אתה בן חמש, על הכתפיים של מישהו, ורואה רק ראשים.' },
          { who: null, text: 'היום אתה רואה מעל רוב הראשים. לא מעל של אבא.' },
        ],
        then: [{ e: 'redheart', key: 'historyMemory', delta: 3 }],
      },
    ],
  },
  {
    id: 'bed-1990',
    branches: [
      {
        lines: [
          { who: null, text: 'המיטה. הפוסטר מעליה החליף ידיים לפני שנה. הפינות שלו כבר מתקלפות.' },
        ],
      },
    ],
  },
  {
    id: 'drawer-1990',
    branches: [
      {
        when: { hasItem: 'scarf' },
        lines: [{ who: null, text: 'המגירה ריקה. הצעיף על הצוואר שלך.' }],
      },
      {
        lines: [
          { who: null, text: 'הצעיף. אדום, קצת דהוי, עם ריח של ארון. מישהו שם לך אותו על הצוואר לפני ארבע שנים ולא ביקש אותו בחזרה.' },
        ],
        choices: [
          {
            id: 'take',
            text: 'לקחת.',
            then: [
              { e: 'give', item: 'scarf' },
              { e: 'redheart', key: 'terraceCulture', delta: 4 },
              { e: 'toast', text: 'הצעיף', tone: 'red' },
            ],
          },
          { id: 'leave', text: 'להשאיר. חם היום.', then: [{ e: 'personality', key: 'independence', delta: 2 }] },
        ],
      },
    ],
  },

  // ============================================================== the street =====
  {
    id: 'ofir-1990',
    nameHe: 'אופיר',
    branches: [
      {
        when: { flag: 'went:withFriends' },
        lines: [{ who: 'אופיר', text: 'נו, זזים. הרגליים לא הולכות לבד.' }],
      },
      {
        when: { flag: 'going:friends' },
        lines: [
          { who: 'אופיר', text: 'אמרת לאבא שלך? יופי. אז הוא לא יחפש אותך בקהל.' },
          { who: 'אופיר', text: 'עמית — הכסף.' },
          { who: 'עמית', text: 'יש. ספרתי שלוש פעמים.' },
          { who: 'אופיר', text: 'הוא טעה שלוש פעמים. יאללה.' },
        ],
        then: [
          { e: 'flag', flag: 'went:withFriends' },
          { e: 'bond', who: 'ofir', delta: 8 },
          { e: 'bond', who: 'amit', delta: 5 },
          { e: 'personality', key: 'sociability', delta: 5 },
          { e: 'time', minutes: 25 },
          { e: 'travel', to: 'route', spawn: 'fromStreet' },
        ],
      },
      {
        when: { flag: 'ofir:invited' },
        lines: [
          { who: 'אופיר', text: 'נו? עם אבא או עם בני אדם?' },
        ],
        choices: [
          {
            id: 'friends',
            text: '"איתכם."',
            then: [
              { e: 'flag', flag: 'going:friends' },
              { e: 'toast', text: 'אופיר מהנהן כאילו ידע. הוא תמיד "ידע".', tone: 'plain' },
            ],
          },
          {
            id: 'dad',
            text: '"עם אבא. נתראה בשער 7."',
            then: [
              { e: 'bond', who: 'ofir', delta: -2 },
              { e: 'rel', who: 'ofir', axis: 'distance', delta: 3 },
              { e: 'toast', text: '"שער 7. כמו תמיד."', tone: 'plain' },
            ],
          },
        ],
      },
      {
        lines: [
          { who: 'אופיר', text: 'פוגי. כמה צריך?' },
          { who: 'פוגי', text: 'תלוי ביבנה.' },
          { who: 'אופיר', text: 'הכל תלוי ביבנה. אני לא סובל את יבנה. לא הייתי שם אף פעם.' },
        ],
        then: [{ e: 'bond', who: 'ofir', delta: 2 }],
      },
    ],
  },
  {
    id: 'amit-1990',
    nameHe: 'עמית',
    branches: [
      {
        lines: [
          { who: null, text: 'עמית מחשב בקול. הוא טועה בכל שורה, ובטוח בכל שורה.' },
          { who: 'עמית', text: 'אז אם הם מנצחים ואנחנו מנצחים אז זה תלוי מי מנצח יותר, אלא אם כן…' },
          { who: 'אופיר', text: 'אלא אם כן תשתוק.' },
          { who: 'עמית', text: '…אלא אם כן זה שוויון, ואז אני לא יודע.' },
        ],
        then: [
          { e: 'wellbeing', key: 'happiness', delta: 4 },
          { e: 'bond', who: 'amit', delta: 2 },
        ],
      },
    ],
  },
  {
    id: 'kiosk-man-1990',
    nameHe: 'רפי מהקיוסק',
    branches: [
      {
        when: { hasItem: 'newspaper' },
        lines: [
          { who: 'רפי מהקיוסק', text: 'קנית עיתון, קרא עיתון. הטבלה לא משתנה מלהסתכל עליה.' },
          { who: 'רפי מהקיוסק', text: 'ואם אתה שואל — יבנה בבית. בבית לא מפסידים במחזור אחרון. אף אחד.' },
        ],
      },
      {
        when: { minAgorot: 120 },
        lines: [
          { who: 'רפי מהקיוסק', text: 'עיתון? מאה ועשרים. יש שם טבלה, ויש שם עמוד שלם שמסביר למה זה לא פשוט.' },
        ],
        choices: [
          {
            id: 'buy',
            text: 'לקנות עיתון.',
            then: [
              { e: 'money', agorot: -120, why: 'עיתון' },
              { e: 'give', item: 'newspaper' },
              { e: 'flag', flag: 'knows:table' },
              { e: 'trait', trait: 'knowledge', delta: 3 },
              { e: 'toast', text: 'עיתון', tone: 'red' },
            ],
          },
          {
            id: 'snack',
            text: 'משהו לאכול במקום.',
            then: [
              { e: 'money', agorot: -80, why: 'גרעינים' },
              { e: 'flag', flag: 'bought:snack' },
              { e: 'wellbeing', key: 'happiness', delta: 3 },
              { e: 'toast', text: 'שקית גרעינים', tone: 'red' },
            ],
          },
          { id: 'no', text: 'לשמור את הכסף.', then: [{ e: 'personality', key: 'responsibility', delta: 3 }] },
        ],
      },
      {
        lines: [
          { who: 'רפי מהקיוסק', text: 'בלי כסף אין עיתון. אבל אני אגיד לך בחינם: יבנה בבית.' },
          { who: null, text: 'זה לא מידע. זה מה שכולם אומרים, ולכן זה נשמע כמו מידע.' },
        ],
        then: [{ e: 'flagValue', flag: 'rumor:home', value: true }],
      },
    ],
  },
  {
    id: 'veteran-1990',
    nameHe: 'אוהד ותיק',
    branches: [
      {
        when: { flag: 'knows:pillar' },
        lines: [{ who: 'אוהד ותיק', text: 'ליד העמוד. תגיד לו שיוסי שאל.' }],
      },
      {
        lines: [
          { who: null, text: 'אדם עם צעיף ביד, לא על הצוואר. חם מדי בשביל זה, וקר מדי בשבילו בלי.' },
          { who: 'אוהד ותיק', text: 'אתה הבן של קובי. אתם בשער 7, ליד העמוד השני. כמו תמיד.' },
          { who: 'אוהד ותיק', text: 'ואם תאבד אותו — הוא לא זז מהעמוד. שנים.' },
        ],
        then: [
          { e: 'flag', flag: 'knows:pillar' },
          { e: 'redheart', key: 'community', delta: 5 },
          { e: 'redheart', key: 'terraceCulture', delta: 3 },
        ],
      },
    ],
  },
  {
    id: 'poster-1990',
    branches: [
      {
        lines: [
          { who: null, text: 'מודעה על העמוד, מודבקת מעל מודעה מעל מודעה. "מחזור אחרון". מישהו כתב עליה בטוש: כולם.' },
        ],
        then: [{ e: 'redheart', key: 'terraceCulture', delta: 2 }],
      },
    ],
  },

  // ============================================================== the road ========
  {
    id: 'radio-walker-1990',
    nameHe: 'אוהד עם רדיו',
    branches: [
      {
        lines: [
          { who: null, text: 'אדם הולך עם טרנזיסטור צמוד לאוזן, ומדבר אליו כאילו הוא שומע.' },
          { who: 'אוהד עם רדיו', text: 'עוד לא התחיל כלום. בארבע. תלך, תלך, אחרי האדומים.' },
        ],
        then: [{ e: 'flag', flag: 'saw:radio-walker' }],
      },
    ],
  },
  {
    id: 'route-stream-1990',
    branches: [
      {
        lines: [
          { who: null, text: 'יותר אדום מכל שבת. אנשים שלא הולכים בדרך כלל הולכים היום, ואתה מזהה חצי מהם.' },
        ],
      },
    ],
  },

  // ============================================================== the ground ======
  {
    id: 'kobi-gate-1990',
    nameHe: 'קובי',
    branches: [
      {
        when: { flag: 'entry:granted' },
        lines: [{ who: 'קובי', text: 'פנימה. שער 7, ליד העמוד. אני אחריך.' }],
      },
      {
        lines: [
          { who: 'קובי', text: 'הנה אתה.' },
          { who: null, text: 'הוא מוציא שני כרטיסים מהכיס של החולצה. הוא הוציא אותם משם כבר שלוש פעמים היום.' },
          { who: 'קובי', text: 'תחזיק את שלך. אם נתפזר — שער 7, העמוד השני.' },
        ],
        then: [
          { e: 'flag', flag: 'entry:granted' },
          { e: 'flag', flag: 'entry:kobi' },
          { e: 'flag', flag: 'knows:pillar' },
          { e: 'give', item: 'ticket-stub' },
          { e: 'rel', who: 'kobi', axis: 'trust', delta: 4 },
          { e: 'toast', text: 'כרטיס', tone: 'red' },
        ],
      },
    ],
  },
  {
    id: 'steward-1990',
    nameHe: 'סדרן',
    branches: [
      {
        when: { flag: 'entry:granted' },
        lines: [{ who: 'סדרן', text: 'קדימה, פנימה, לא לעצור בקרוסלה.' }],
      },
      // The old mercy of Israeli grounds: at half-time the gates open and whoever is
      // still outside walks in for the second half. A boy with no ticket, no father at
      // the gate and no friends inside is not stuck — he is early for the half.
      {
        when: { afterMinute: 16 * 60 + 48 },
        lines: [
          { who: 'סדרן', text: 'מחצית. פותחים. תיכנס, רק לא לרוץ.' },
          { who: null, text: 'הקרוסלה מסתובבת בלי כרטיס. מאחוריך עוד עשרים ילדים שחיכו לזה.' },
        ],
        then: [
          { e: 'flag', flag: 'entry:granted' },
          { e: 'flag', flag: 'entry:half' },
          { e: 'toast', text: 'המחצית. נכנסים.', tone: 'red' },
        ],
      },
      {
        when: { flag: 'went:withKobi' },
        lines: [{ who: 'סדרן', text: 'הבן של קובי? הוא מחכה לך ליד הקופה. תמיד אותו דבר אתם.' }],
      },
      {
        lines: [
          { who: 'סדרן', text: 'כרטיס. אין כרטיס — אין שער. היום לא.' },
          { who: null, text: 'הוא לא רשע. היום פשוט יש יותר אנשים ממקומות.' },
        ],
      },
    ],
  },
  {
    id: 'ticket-window-1990',
    nameHe: 'הקופאי',
    branches: [
      {
        when: { flag: 'entry:granted' },
        lines: [{ who: 'הקופאי', text: 'יש לך. לך.' }],
      },
      {
        when: { minAgorot: 250 },
        lines: [
          { who: 'הקופאי', text: 'ילד — מאתיים וחמישים. היום זה המחיר.' },
          { who: null, text: 'השטר של אמא. מקופל לארבע. אתה פותח אותו לאט, כאילו זה יעזור.' },
        ],
        then: [
          { e: 'money', agorot: -250, why: 'כרטיס' },
          { e: 'take', item: 'pocket-money' },
          { e: 'give', item: 'ticket-stub' },
          { e: 'flag', flag: 'entry:granted' },
          { e: 'flag', flag: 'entry:ticket' },
          { e: 'personality', key: 'independence', delta: 5 },
          { e: 'toast', text: 'כרטיס', tone: 'red' },
        ],
      },
      {
        lines: [
          { who: 'הקופאי', text: 'מאתיים וחמישים לילד. היום.' },
          { who: null, text: 'אין לך. לא היום, לא בכיס הזה.' },
        ],
      },
    ],
  },
  {
    id: 'ofir-ground-1990',
    nameHe: 'אופיר',
    branches: [
      {
        when: { flag: 'entry:granted' },
        lines: [{ who: 'אופיר', text: 'תיכנס. אנחנו בשער 7, למעלה, איפה שרואים את הרדיו של כולם.' }],
      },
      {
        when: { flag: 'went:withFriends' },
        lines: [
          { who: 'אופיר', text: 'עמית שילם על שלושה. אל תשאל מאיפה.' },
          { who: 'עמית', text: 'מהחיסכון.' },
          { who: 'אופיר', text: 'אמרתי אל תשאל.' },
        ],
        then: [
          { e: 'flag', flag: 'entry:granted' },
          { e: 'flag', flag: 'entry:friends' },
          { e: 'give', item: 'ticket-stub' },
          { e: 'bond', who: 'amit', delta: 8 },
          { e: 'toast', text: 'אתה נכנס', tone: 'red' },
        ],
      },
      {
        lines: [
          { who: 'אופיר', text: 'אתה לבד? איפה אבא שלך?' },
          { who: 'פוגי', text: 'בפנים.' },
          { who: 'אופיר', text: 'אז תיכנס. אתה כבר לא בן שמונה.' },
          { who: null, text: 'הוא לא מציע כלום. זו לא רשעות. זה 1990.' },
        ],
        then: [{ e: 'rel', who: 'ofir', axis: 'distance', delta: 2 }],
      },
    ],
  },
  {
    id: 'vendor-1990',
    nameHe: 'מוכר',
    branches: [
      {
        when: { minAgorot: 60 },
        lines: [{ who: 'מוכר', text: 'גרעינים, שישים. גזוז, שמונים. רדיו — אין, תשאל את השכן.' }],
        choices: [
          {
            id: 'seeds',
            text: 'גרעינים.',
            then: [
              { e: 'money', agorot: -60, why: 'גרעינים' },
              { e: 'flag', flag: 'bought:snack' },
              { e: 'wellbeing', key: 'happiness', delta: 3 },
              { e: 'toast', text: 'שקית גרעינים', tone: 'red' },
            ],
          },
          { id: 'no', text: 'לא עכשיו.', then: [] },
        ],
      },
      {
        lines: [{ who: 'מוכר', text: 'בלי כסף, בלי גרעינים. אבל הרעש חינם.' }],
      },
    ],
  },

  // ============================================================== after ==========
  {
    id: 'kobi-found-1990',
    nameHe: 'קובי',
    branches: [
      {
        when: { flag: 'found:kobi' },
        lines: [{ who: 'קובי', text: 'הביתה. ביחד. אמא מחכה.' }],
      },
      {
        lines: [
          { who: 'פוגי', text: 'איפה היית?!', closeUp: 'cuKobiWhere' },
          { who: 'קובי', text: 'אני?! איפה אתה היית?!' },
          { who: 'פוגי', text: 'עלינו!' },
          { who: 'קובי', text: 'אני יודע!' },
          { who: null, text: 'חיבוק קצר. לא יותר מזה. לא צריך יותר מזה.' },
        ],
        then: [
          { e: 'flag', flag: 'found:kobi' },
          { e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 12 },
          { e: 'rel', who: 'kobi', axis: 'bond', delta: 8 },
          { e: 'redheart', key: 'familyTradition', delta: 10 },
          { e: 'remember', who: 'kobi', eventId: '1990-found', significance: 'major' },
          { e: 'toast', text: 'הביתה. ביחד.', tone: 'red' },
        ],
      },
    ],
  },
]
