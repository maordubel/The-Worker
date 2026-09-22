import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_2010 } from './chapter2010double'

/**
 * C01–C07 · "המנגינה הזאת" · המסע האירופי של 2010, בשני פרקים.
 *
 * התסריט כותב שבע סצנות תחת כותרת אחת. המנוע מפצל אותן באותו קו שכבר פיצל את הדאבל:
 * **`2010-qualify`** הוא הקיץ — שלושה סיבובי מוקדמות ובחירה אחת של חופשה — ו-
 * **`2010-anthem`** הוא הסתיו, שישה משחקים בשלב הבתים, מליסבון ועד ליון.
 *
 * **כל שבע הסצנות יושבות על שורות שהיו בארכיון לפני התסריט**, כולן ויקיפועל בביטחון 2:
 * 25.8 מול זלצבורג (1:1, והעלייה לשלב הבתים), 14.9 בליסבון, 29.9 מול ליון בבית, 20.10
 * בגלזנקירכן, 2.11 מול שאלקה בבית, 24.11 מול בנפיקה בבית, 7.12 בליון. **אף שורת דיאלוג
 * כאן אינה נוקבת בתוצאה** — הכרטיס ההיסטורי קורא אותה מהעוגן.
 *
 * **שתי הערות על הארכיון שנמצאו כאן ולא תוקנו מכאן** (נתוני שערים, לא נתוני LIFE):
 * · מוקדמות הפלייאוף מול זלצבורג מופיעות **פעמיים**, עם בית/חוץ הפוכים ותאריך שנבדל
 *   ביום (17/18.8 ו-24/25.8). שתי השורות נרשמו כסתירה ב-`fact-conflicts.json`;
 *   העוגן קורא את זו שנושאת אצטדיון והערה, ולא מכריע בשם הארכיון.
 * · בנפיקה יושבת תחת **שני סלאגים** — `בנפיקה-ליסבון` (14.9) ו-`בנפיקה` (24.11).
 *   איחוד ישויות הוא הכרעה של בעל הבית ב-`entity_alias` (כלל 7), לא ניחוש של הפרק.
 *
 * **מה שאין לו חדר נשאר כרטיס וזמן.** אין ליסבון, אין גלזנקירכן ואין ליון בעולם הזה,
 * בדיוק כמו שאין טדי — ולכן נסיעה היא מחיר, שעה וקלף, והסלון הוא החלופה שהתסריט עצמו
 * כתב בכל אחת משלוש הסצנות האלה.
 *
 * **המחיר, ולמה הוא לא נגזר.** 220,000 אגורות זה מה שהתסריט כותב, וטיסה היא **עובדה
 * על העולם** ולא שכר — בדיוק ההבחנה של `chapter2002europe.ts` (שם 180,000 ב-2002).
 * שכר נגזר מ-`WAGE`; מחיר נכתב. ושלוש הבחירות שעולות כסף נושאות `minAgorot` עם
 * `noteHe` — דלת שרואים שהיא סגורה היא מידע, דלת שלא מצוירת היא מבוי סתום (כלל 42).
 */

export const PORTRAIT_CHAMPIONS: Record<string, string> = {
  ...PORTRAIT_2010,
  /**
   * לינה וניקו — `I01` מציגה אותם במילים שלה: *"הם מארגנים מפגש נגד גזענות"*. אין להם
   * פיגורה משלהם, ולכן הם יושבים על פלייט כללי כמו `אולי` ו-`שלומי` לפניהם. כלל 67 אוסר
   * לחתוך פנים של דמות בעלת שם מ**מישהו אחר** בעל שם; ניצב כללי הוא הצורה הכנה לזה עד
   * שהציור שלהם ינחת.
   */
  'לינה': 'faceWoman',
  'ניקו': 'faceYoung',
}

/** מחיר נסיעה אחת, כפי שהתסריט כותב אותו */
const TRIP_AGOROT = 220_000

/** הנושא של ההבטחה לקרן — אותו משפט בשני הצדדים, כי זה מה שהמנוע מצליב (כלל 59) */
const CALL_PROMISE = 'השיחה עם קרן'

// ------------------------------------------------------------------- Part I ------

export function objectiveQualify(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['c10:qualify']) return sceneId === 'kiosk' ? null : 'בקיוסק. עמית כבר פתח את היומן.'
  if (!state.flags['c10:trip']) return sceneId === 'allenby' ? null : 'רומא מחכה בבית קפה. יש לו לוח.'
  return null
}

export const ENDINGS_QUALIFY: Record<string, EndingCard> = {
  away: {
    id: 'away',
    titleHe: 'עיר אחת, בכיס',
    bodyHe:
      'בחרת אחת מהשלוש ושילמת עליה, ורומא כתב את השם על המפית לפני שהספקת להתחרט. זה אומר שאת שתי האחרות תראה מהסלון, וידעת את זה כשאמרת.',
    memoryHe: 'מפית עם שם של עיר.',
    memoryItem: 'folded-paper',
    presence: 'late',
  },
  host: {
    id: 'host',
    titleHe: 'אני מביא אנשים אליך',
    bodyHe:
      'לא נסעת, והערב הזה עדיין יהיה שלך — רק שהוא קורה כאן. רומא אמר אחד אחד, ואתה אמרת שלמדנו מהספה, ושניכם ידעתם על איזו ספה מדובר.',
    memoryHe: 'רשימת שמות, בלי טלפונים.',
    memoryItem: 'folded-paper',
    presence: 'late',
  },
  none: {
    id: 'none',
    titleHe: 'תביא סיפור, לא מתנה',
    bodyHe:
      'ויתרת על שלושתן, בלי להתחייב גם לאירוח. זה לא ויתור קטן ואתה לא הפכת אותו לגדול — אמרת מה שיש לך, וביקשת שמי שנוסע יחזור עם סיפור.',
    memoryHe: 'הודעה אחת, קצרה.',
    memoryItem: 'folded-paper',
    presence: 'late',
  },
}

export const BEATS_QUALIFY: Beat[] = [
  { id: 'c10-qualify', at: 'kiosk', trigger: 'enter', when: { none: [{ flag: 'c10:qualify' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'c10-qualify' }] },
  { id: 'c10-trip', at: 'allenby', trigger: 'enter', when: { all: [{ flag: 'c10:qualify' }], none: [{ flag: 'c10:trip' }] }, delayMs: 650, do: [{ a: 'talk', conversation: 'c10-trip' }] },
  { id: 'c10-close1', trigger: 'clock', when: { all: [{ flag: 'c10:trip' }], none: [{ flag: 'c10:done1' }] }, delayMs: 1200, do: [{ a: 'flag', flag: 'c10:done1' }, { a: 'talk', conversation: 'c10-close1' }] },
]

// ------------------------------------------------------------------ Part II ------

export function objectiveAnthem(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['c10:debut']) return sceneId === 'home' ? null : 'הערב הראשון. הסלון, או מה שקנית במקומו.'
  if (!state.flags['c10:host']) return sceneId === 'allenby' ? null : 'הערב עם האורחים. סיכמת מקום.'
  if (!state.flags['c10:call']) return sceneId === 'kitchen' ? null : 'קרן התקשרה. המטבח.'
  if (!state.flags['c10:benfica']) return sceneId === 'bloomfield-inside' ? null : 'בלומפילד. אבא כבר שם.'
  if (!state.flags['c10:lyon']) return sceneId === 'home' ? null : 'המשחק האחרון בבית. הסלון.'
  return null
}

export const ENDINGS_ANTHEM: Record<string, EndingCard> = {
  together: {
    id: 'together',
    titleHe: 'גם בלי משחק',
    bodyHe:
      'המסע נגמר ואתה נשארת עם מי שהגעת איתו. רומא שאל אם נפגשים גם בלי משחק, ואמרת שכן — אם ידע לדבר על משהו אחר. הוא אמר שהוא יכול ללמוד, וזה מה שנשאר מהסתיו הזה.',
    memoryHe: 'דף מקופל מהערב האחרון.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  written: {
    id: 'written',
    titleHe: 'התוצאה בשורה נפרדת',
    bodyHe:
      'כתבת סיכום, ובדקת עובדות לפני שפרסמת. עמית ביקש שתכתוב גם שהיינו קרובים; כתבת, ושמת את התוצאה בשורה משלה, כי זיכרון ותוצאה הם שני דברים ומי שמערבב אותם מאבד את שניהם.',
    memoryHe: 'העמוד, עם התיקונים בצד.',
    memoryItem: 'clipping',
    presence: 'inside',
  },
  sabbath: {
    id: 'sabbath',
    titleHe: 'תגיד שבת, לא הספד',
    bodyHe:
      'ביקשת לעצמך שבת. אופיר שאל אם אתה פורש ואמרת שלא, ואז הוא ביקש שתגיד את זה בלי לוויה בקול. אמרת שבת, והוא אמר שזה בסדר, ובאמת היה.',
    memoryHe: 'לוח שנה עם שבוע אחד ריק.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

export const BEATS_ANTHEM: Beat[] = [
  { id: 'c10-debut', at: 'home', trigger: 'enter', when: { none: [{ flag: 'c10:debut' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'c10-debut' }] },
  { id: 'c10-host', at: 'allenby', trigger: 'enter', when: { all: [{ flag: 'c10:debut' }], none: [{ flag: 'c10:host' }] }, delayMs: 650, do: [{ a: 'talk', conversation: 'c10-host' }] },
  { id: 'c10-call', at: 'kitchen', trigger: 'enter', when: { all: [{ flag: 'c10:host' }], none: [{ flag: 'c10:call' }] }, delayMs: 650, do: [{ a: 'talk', conversation: 'c10-call' }] },
  /**
   * "מחר בערב, אם מתאים לך" — ההבטחה של `C05.2`, שנפרעת בתוך הפרק.
   *
   * התסריט כותב `due: "L08"`, וחלון החיים הזה עדיין לא נבנה. הבטחה שאין לה סצנה
   * שפורעת אותה היא חוט פתוח, ו**להמציא את L08 גרוע מלפרוע את ההבטחה במילים שהיא
   * עצמה אמרה**: הדיאלוג עצמו קובע "מחר בערב". ביום שבו L08 ייבנה, הביט הזה עובר
   * לשם ושומר את אותו `proofId`.
   */
  { id: 'c10-callback', trigger: 'clock', when: { all: [{ flag: 'c10:call' }, { flag: 'promise:callKeren' }], none: [{ flag: 'c10:callback' }] }, delayMs: 1500, do: [{ a: 'talk', conversation: 'c10-callback' }] },
  { id: 'c10-benfica', at: 'bloomfield-inside', trigger: 'enter', when: { all: [{ flag: 'c10:call' }], none: [{ flag: 'c10:benfica' }] }, delayMs: 800, do: [{ a: 'talk', conversation: 'c10-benfica' }] },
  { id: 'c10-lyon', at: 'home', trigger: 'enter', when: { all: [{ flag: 'c10:benfica' }], none: [{ flag: 'c10:lyon' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'c10-lyon' }] },
]

// ---------------------------------------------------------------- the words ------

export const CONVERSATIONS_CHAMPIONS: Conversation[] = [
  {
    id: 'c10-qualify',
    nameHe: 'עמית',
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'קודם עולים.' },
          { who: 'אופיר', text: 'כבר בחרתי עיר.' },
          { who: 'פוגי', text: 'עוד לא הוגרלה עיר.' },
          { who: 'אופיר', text: 'אני מוכן לכל תוצאה.' },
          { who: 'מתוקי', text: 'חוץ מזאת שאין טיסה.' },
        ],
        choices: [
          {
            id: 'organise',
            text: '(לקחת אחריות על ערב הצפייה. לכתוב את עצמך ראשון.)',
            then: [
              { e: 'flag', flag: 'c10:qualify' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'בכל פעם מישהו אחר מסדר בסוף' },
              /** `organization.qualifiers2010` בתסריט → ראיה עם נושא, בלי קהל: אף אחד חיצוני לא ראה */
              { e: 'proof', kind: 'organised_evening', proofId: 'organised_evening:{chapter}:qualifiers', subjectHe: 'ערב הצפייה החוזר', noteHe: 'שלושה סיבובים, אותה דירה, ומי שמסדר רשום מראש.' },
              { e: 'toast', text: 'מתוקי: "בכל פעם מישהו אחר מסדר בסוף." — "תכתוב אותי ראשון."', tone: 'plain' },
            ],
          },
          {
            id: 'venue',
            text: '(ללכת למשחק בית מתוך המוקדמות.)',
            then: [
              { e: 'flag', flag: 'c10:qualify' },
              { e: 'time', minutes: 90 },
              { e: 'energy', delta: -10 },
              { e: 'flag', flag: 'own:ticket:qualifier2010' },
              { e: 'memory', item: 'ticket-stub', id: 'c10-qualifier-ticket' },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'toast', text: 'אופיר: "עכשיו מותר לדבר על אירופה?" — "אחרי השריקה."', tone: 'plain' },
            ],
          },
          {
            id: 'summary',
            text: '"תעדכנו אותי בקצרה. יש לי יום."',
            then: [
              { e: 'flag', flag: 'c10:qualify' },
              { e: 'flagValue', flag: 'c10:qualifiers', value: 'summary' },
              { e: 'presence', mode: 'late' },
              { e: 'toast', text: 'עמית: "עלינו. עכשיו אתה יכול לפתוח את ההודעה הארוכה." — "כמה ארוכה?" — "שלושה סיבובים."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'c10-trip',
    nameHe: 'רומא',
    branches: [
      {
        lines: [
          { who: 'רומא', text: 'באיזו עיר אתה רוצה לראות אותם?' },
          { who: 'פוגי', text: 'בכולן.' },
          { who: 'רומא', text: 'באיזו עיר אתה יכול?' },
          { who: 'פוגי', text: 'אתה לא האיש שמסדר?' },
          { who: 'רומא', text: 'פגישה. את החיים שלך אתה מסדר.' },
        ],
        choices: [
          {
            id: 'lisbon',
            text: '(ליסבון. לשלם ולתאם חופשה.)',
            when: { minAgorot: TRIP_AGOROT },
            noteHe: 'אין בארנק מה שטיסה עולה. רומא לא יזמין בשבילך.',
            then: [
              { e: 'flag', flag: 'c10:trip' },
              { e: 'flagValue', flag: 'c10:tripTo', value: 'lisbon' },
              { e: 'money', agorot: -TRIP_AGOROT, why: 'טיסה אחת, ואחת בלבד' },
              { e: 'time', minutes: 30 },
              { e: 'rel', who: 'roma', axis: 'trust', delta: 3 },
              { e: 'toast', text: 'רומא: "שם מארח זה לא הזמנה. אני שואל אותו קודם." — "ואני שואל בעבודה."', tone: 'plain' },
            ],
          },
          {
            id: 'gelsenkirchen',
            text: '(גלזנקירכן. לשלם ולתאם חופשה.)',
            when: { minAgorot: TRIP_AGOROT },
            noteHe: 'אין בארנק מה שטיסה עולה. רומא לא יזמין בשבילך.',
            then: [
              { e: 'flag', flag: 'c10:trip' },
              { e: 'flagValue', flag: 'c10:tripTo', value: 'gelsenkirchen' },
              { e: 'money', agorot: -TRIP_AGOROT, why: 'טיסה אחת, ואחת בלבד' },
              { e: 'time', minutes: 30 },
              { e: 'skill', skill: 'organization', delta: 2, why: 'קודם בודקים מסלול' },
              { e: 'toast', text: 'רומא: "קודם בודקים מסלול. העיר היא לא שדה תעופה." — "טוב שאתה אומר לפני ההזמנה."', tone: 'plain' },
            ],
          },
          {
            id: 'lyon',
            text: '(לשמור את הנסיעה לליון, בסוף.)',
            when: { minAgorot: TRIP_AGOROT },
            noteHe: 'אין בארנק מה שטיסה עולה. רומא לא יזמין בשבילך.',
            then: [
              { e: 'flag', flag: 'c10:trip' },
              { e: 'flagValue', flag: 'c10:tripTo', value: 'lyon' },
              { e: 'money', agorot: -TRIP_AGOROT, why: 'טיסה אחת, ואחת בלבד' },
              { e: 'time', minutes: 30 },
              { e: 'rel', who: 'amit', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'עמית: "עד אז תצטרך לראות אותנו דרך המסך." — "גם ככה אתם מתווכחים כאילו אני לא פה."', tone: 'plain' },
            ],
          },
          {
            id: 'host',
            text: '"אני נשאר. תביא אנשים אליי."',
            then: [
              { e: 'flag', flag: 'c10:trip' },
              { e: 'flagValue', flag: 'c10:tripTo', value: 'host' },
              { e: 'flag', flag: 'c10:hosting' },
              // הדלת לחלון INTERNATIONAL (`chapterFriends.ts`): מי שמארח, רומא מביא אליו אנשים
              { e: 'flag', flag: 'life:international' },
              // `mediation` בתסריט → `communication` במנוע (טבלת המיפוי, לא ניחוש)
              { e: 'skill', skill: 'communication', delta: 2, why: 'אחד אחד, לא כולם ביחד' },
              { e: 'rel', who: 'roma', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'רומא: "אז הפעם אני מביא אנשים אליך." — "אחד אחד. למדנו מהספה."', tone: 'plain' },
            ],
          },
          {
            id: 'none',
            text: '"אני מוותר על שלושתן. ובלי להתחייב לאירוח."',
            then: [
              { e: 'flag', flag: 'c10:trip' },
              { e: 'flagValue', flag: 'c10:tripTo', value: 'none' },
              { e: 'personality', key: 'honesty', delta: 2 },
              { e: 'toast', text: 'רומא: "אז ניפגש כשאחזור." — "תביא סיפור, לא מתנה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'c10-close1',
    nameHe: null,
    branches: [
      { when: { flagIs: { flag: 'c10:tripTo', value: 'host' } }, lines: [{ who: null, text: 'המפית נשארה על השולחן, ועליה שמות ולא ערים.' }], then: [{ e: 'ending', id: 'host' }] },
      { when: { flagIs: { flag: 'c10:tripTo', value: 'none' } }, lines: [{ who: null, text: 'רומא קיפל את הלוח ולא אמר כלום. זה היה בסדר.' }], then: [{ e: 'ending', id: 'none' }] },
      { lines: [{ who: null, text: 'על המפית נשאר שם אחד, בעט של בית הקפה.' }], then: [{ e: 'ending', id: 'away' }] },
    ],
  },

  // ----------------------------------------------------------------- C03–C07 ------
  {
    id: 'c10-debut',
    nameHe: 'אופיר',
    branches: [
      {
        lines: [
          { who: 'אופיר', text: 'זאת המנגינה.' },
          { who: 'עמית', text: 'אנחנו שומעים.' },
          { who: 'אופיר', text: 'לא בטלוויזיה. שלנו.' },
          { who: 'פוגי', text: 'רגע, תן לשמוע.' },
          { who: 'אופיר', text: 'אני מנסה.' },
        ],
        choices: [
          {
            id: 'keep',
            text: '(לשמור את הרגע. גם אחרי שזה נגמר ככה.)',
            then: [
              { e: 'flag', flag: 'c10:debut' },
              { e: 'flagValue', flag: 'c10:debutMood', value: 'kept' },
              { e: 'memory', item: 'folded-paper', id: 'c10-first-night' },
              { e: 'redheart', key: 'terraceCulture', delta: 3 },
              { e: 'toast', text: 'רומא: "הפסדנו." — "אני עדיין שמח שבאתי." — "שני דברים יכולים להיות נכונים."', tone: 'plain' },
            ],
          },
          {
            id: 'company',
            text: '(למצוא את מי שאיתי, ולדבר על מחר.)',
            then: [
              { e: 'flag', flag: 'c10:debut' },
              { e: 'flagValue', flag: 'c10:debutMood', value: 'company' },
              { e: 'rel', who: 'amit', axis: 'bond', delta: 3 },
              { e: 'toast', text: 'עמית: "מחר יש לך פגישה, נכון?" — "אל תגיד לי שעשית גם לזה טבלה." — "רק רשימה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'c10-host',
    nameHe: 'לינה',
    branches: [
      {
        lines: [
          { who: 'לינה', text: 'חשבתי שלא תרצו להיפגש אחרי המשחק.' },
          { who: 'פוגי', text: 'אנחנו יודעים לאכול גם אחרי הפסד.' },
          { who: 'מתוקי', text: 'בפועל אנחנו מאוד מנוסים.' },
          { who: 'רומא', text: 'מישהו סוף סוף מצא תחום שאנחנו מובילים בו.' },
        ],
        choices: [
          {
            id: 'hosted',
            text: '(לקיים את האירוח שסיכמתי.)',
            then: [
              { e: 'flag', flag: 'c10:host' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -5 },
              { e: 'money', agorot: -6000, why: 'מה שקונים לערב עם אורחים' },
              { e: 'rel', who: 'lina', axis: 'bond', delta: 2 },
              { e: 'rel', who: 'lina', axis: 'trust', delta: 5 },
              /**
               * הקהל הזה הוא `international` — יציע בהמבורג שמכיר אותך אינו הציבור
               * הישראלי, **וגם אינו שער 7**: שער 7 הם האוהדים שלנו בחוץ, וזה אוהדים של
               * מישהו אחר שעומדים אִתנו (כלל 79 ב׳). והם היו בחדר, אז `heard` משלם מיד.
               */
              { e: 'proof', kind: 'hosted_guests', proofId: 'hosted_guests:{chapter}:evening', subjectHe: 'הערב שלא בוטל', audience: 'international', delta: 4, noteHe: 'סוכם לפני המשחק, התקיים אחרי, ולא הוזכר בו מה קרה במגרש.' },
              { e: 'heard', proofId: 'hosted_guests:{chapter}:evening' },
              { e: 'toast', text: 'לינה: "תודה שלא ביטלת." — "הזמנתי אותך, לא את התוצאה."', tone: 'plain' },
            ],
          },
          {
            id: 'helped',
            text: '(לעזור למתוקי, ואז להושיב אותו.)',
            then: [
              { e: 'flag', flag: 'c10:host' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'rel', who: 'metuki', axis: 'bond', delta: 2 },
              { e: 'rel', who: 'metuki', axis: 'trust', delta: 3 },
              { e: 'proof', kind: 'community_help', proofId: 'community_help:{chapter}:evening', subjectHe: 'הצלחות של מתוקי', noteHe: 'לקח צלחות, ואחר כך הושיב אותו.' },
              { e: 'toast', text: 'מתוקי: "אתה יכול לקחת צלחות?" — "כן. ואחר כך אתה יושב."', tone: 'plain' },
            ],
          },
          {
            id: 'handover',
            text: '"אני לא אוכל. אני מודיע עכשיו, ויש מחליף מוסכם."',
            then: [
              { e: 'flag', flag: 'c10:host' },
              { e: 'flagValue', flag: 'c10:hostEnd', value: 'handed_over' },
              { e: 'personality', key: 'honesty', delta: 3 },
              { e: 'rel', who: 'roma', axis: 'trust', delta: 2 },
              { e: 'toast', text: 'רומא: "אני לוקח את זה. פעם הבאה נדבר מראש." — "תודה. אני לא אכתוב ״מסודר״ עד שאתה אומר."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'c10-call',
    nameHe: 'קרן',
    // "קרן התקשרה" — המטרה של הפרק
    remote: { 'קרן': 'phone' },
    branches: [
      {
        lines: [
          { who: 'קרן', text: 'אתה מספר לי מה עשית בכל דקה במשחק.' },
          { who: 'פוגי', text: 'זה רע?' },
          { who: 'קרן', text: 'שאלתי מה שלומך.' },
          { who: 'פוגי', text: 'אה.' },
          { who: 'קרן', text: 'גם ״אה״ זה יותר אישי מהתוצאה.' },
        ],
        choices: [
          {
            id: 'tell',
            text: '(לספר לה מה באמת עובר עליי.)',
            then: [
              { e: 'flag', flag: 'c10:call' },
              { e: 'time', minutes: 15 },
              { e: 'rel', who: 'keren', axis: 'bond', delta: 3 },
              { e: 'wellbeing', key: 'regret', delta: -4 },
              { e: 'toast', text: 'קרן: "הנה. אותך רציתי לשמוע." — "עם פרשנות?" — "תנסה בלי."', tone: 'plain' },
            ],
          },
          {
            id: 'later',
            text: '"עכשיו אין לי מילים. מחר בערב, אם מתאים לך."',
            then: [
              { e: 'flag', flag: 'c10:call' },
              { e: 'flag', flag: 'promise:callKeren' },
              { e: 'toast', text: 'קרן: "בסדר. רק אל תכתוב ״נדבר״ ותיעלם." — "מחר בערב, אם מתאים לך." — "מתאים."', tone: 'plain' },
            ],
          },
          {
            id: 'result',
            text: '(להחזיר את השיחה לתוצאה.)',
            then: [
              { e: 'flag', flag: 'c10:call' },
              { e: 'rel', who: 'keren', axis: 'bond', delta: -1 },
              { e: 'flagValue', flag: 'c10:kerenUnheard', value: true },
              { e: 'toast', text: 'קרן: "אז תתקשר כשתרצה לדבר איתי."', tone: 'red' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'c10-callback',
    nameHe: 'קרן',
    // "הטלפון על השיש" — הקריאה חזרה
    remote: { 'קרן': 'phone' },
    branches: [
      {
        lines: [
          { who: null, text: 'מחר בערב. הטלפון על השיש, והשעה היא השעה שאמרת.' },
          { who: 'קרן', text: 'אז זה לא היה ״נדבר״.' },
          { who: 'פוגי', text: 'לא.' },
        ],
        choices: [
          {
            id: 'kept',
            text: '(להתקשר. עכשיו.)',
            then: [
              { e: 'flag', flag: 'c10:callback' },
              { e: 'time', minutes: 20 },
              { e: 'rel', who: 'keren', axis: 'trust', delta: 6 },
              { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:call', subjectHe: CALL_PROMISE, noteHe: 'התקשר בערב שאמר, בלי שביקשו ממנו שוב.' },
              { e: 'remember', who: 'keren', eventId: 'call-kept-2010', significance: 'major' },
              { e: 'toast', text: 'קרן: "דיברת בלי פרשנות." — "ניסיתי."', tone: 'plain' },
            ],
          },
          {
            id: 'moved',
            text: '"אני לא יכול הערב. שבת בבוקר, ואני אומר את זה עכשיו."',
            then: [
              { e: 'flag', flag: 'c10:callback' },
              { e: 'proof', kind: 'promise_renegotiated', proofId: 'promise_renegotiated:{chapter}:call', subjectHe: CALL_PROMISE, noteHe: 'הזיז את השיחה לפני המועד, ונקב במועד אחר.' },
              { e: 'personality', key: 'honesty', delta: 2 },
              { e: 'toast', text: 'קרן: "זה יותר טוב מ״נדבר״." — "זה גם מה שהתכוונתי."', tone: 'plain' },
            ],
          },
          {
            id: 'skip',
            text: '(לא הערב. הוא לא ישאל.)',
            then: [
              { e: 'flag', flag: 'c10:callback' },
              { e: 'rel', who: 'keren', axis: 'trust', delta: -8 },
              { e: 'wellbeing', key: 'regret', delta: 6 },
              { e: 'toast', text: 'קרן לא התקשרה למחרת. גם לא ביום שאחריו.', tone: 'red' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'c10-benfica',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'קובי', text: 'אל תתחיל להגיד לי שזה חלום.' },
          { who: 'פוגי', text: 'לא אמרתי.' },
          { who: 'קובי', text: 'אתה עושה את הפרצוף.' },
          { who: 'פוגי', text: 'איזה?' },
          { who: 'קובי', text: 'זה שהיה לך כשהחולצה סוף סוף הייתה שלך.' },
        ],
        choices: [
          {
            id: 'photo',
            text: '(לצלם. "תעמוד רגע, אבא.")',
            then: [
              { e: 'flag', flag: 'c10:benfica' },
              { e: 'flag', flag: 'own:photo:benfica2010' },
              { e: 'memory', item: 'folded-paper', id: 'c10-benfica-photo' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'toast', text: 'קובי: "אני עומד פה מאז לפני שנולדת." — "בשביל התמונה, אבא."', tone: 'plain' },
            ],
          },
          {
            id: 'inside',
            text: '(בלי מצלמה. לזכור מבפנים.)',
            then: [
              { e: 'flag', flag: 'c10:benfica' },
              { e: 'flagValue', flag: 'c10:benficaMemory', value: 'unphotographed' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'redheart', key: 'terraceCulture', delta: 3 },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'toast', text: 'קובי: "לא מצלם?" — "היום אני רוצה לזכור מבפנים."', tone: 'plain' },
            ],
          },
          {
            id: 'abroad',
            text: '(לשלוח הודעה למי שרחוק.)',
            then: [
              { e: 'flag', flag: 'c10:benfica' },
              { e: 'flagValue', flag: 'c10:benficaShared', value: true },
              { e: 'rel', who: 'roma', axis: 'bond', delta: 2 },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'toast', text: 'רומא: "גם פה שמעו." — "טוב. לא רציתי לצעוק לבד."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'c10-lyon',
    nameHe: 'רומא',
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'אם זה נשאר—' },
          { who: 'פוגי', text: 'אל תסיים.' },
          { who: 'אופיר', text: 'אף אחד לא זז.' },
          { who: 'רומא', text: 'אתם יודעים שזה לא משפיע.' },
          { who: 'אופיר', text: 'אז גם אין לך סיבה לזוז.' },
        ],
        choices: [
          {
            id: 'stay',
            text: '(אחרי הסיום, להישאר עם מי שהגעתי איתו.)',
            then: [
              { e: 'flag', flag: 'c10:lyon' },
              { e: 'time', minutes: 40 },
              { e: 'rel', who: 'roma', axis: 'bond', delta: 3 },
              { e: 'memory', item: 'folded-paper', id: 'c10-europe-page' },
              { e: 'proof', kind: 'nonmatch_contact', proofId: 'nonmatch_contact:{chapter}:lyon', subjectHe: 'להיפגש גם בלי משחק', audience: 'international', delta: 3, noteHe: 'נשאר אחרי השריקה, עם אותם אנשים, בלי תוצאה על השולחן.' },
              { e: 'heard', proofId: 'nonmatch_contact:{chapter}:lyon' },
              { e: 'ending', id: 'together' },
            ],
          },
          {
            id: 'write',
            text: '(לכתוב סיכום אישי, ולבדוק עובדות לפני פרסום.)',
            then: [
              { e: 'flag', flag: 'c10:lyon' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -8 },
              // `documentation` בתסריט → `knowledge` במנוע; `creativity` הוא הכתיבה עצמה
              { e: 'skill', skill: 'knowledge', delta: 3, why: 'בדק לפני שפרסם' },
              { e: 'skill', skill: 'creativity', delta: 2, why: 'סיכום אישי, לא דוח' },
              { e: 'proof', kind: 'publication_proof', proofId: 'publication_proof:{chapter}:europe', subjectHe: 'הסיכום מהסתיו', audience: 'public', delta: 4, noteHe: 'שתי עובדות נבדקו לפני הפרסום, והתוצאה הודפסה בשורה נפרדת מהזיכרון.' },
              { e: 'heard', proofId: 'publication_proof:{chapter}:europe' },
              { e: 'ending', id: 'written' },
            ],
          },
          {
            id: 'rest',
            text: '"בתקופה הקרובה אני מוריד קצב."',
            then: [
              { e: 'flag', flag: 'c10:lyon' },
              { e: 'flagValue', flag: 'c10:reflection', value: true },
              { e: 'wellbeing', key: 'exhaustion', delta: -8 },
              { e: 'energy', delta: 15 },
              { e: 'toast', text: 'אופיר: "אתה פורש?" — "אני מבקש לעצמי שבת." — "אז תגיד שבת, לא הספד."', tone: 'plain' },
              { e: 'ending', id: 'sabbath' },
            ],
          },
        ],
      },
    ],
  },
]
