import { CONFLICT_CHOICES, conflictFlag } from '../routes'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_CAREER } from './chapterCareer'

/**
 * חלון OWNER — O01–O05 · "ענף בעלות בדיוני", קיץ 2025.
 *
 * **איך הוא נפתח:** `own:route:OWNER:practice` — מי שכבר שותף בעסק (הדרגה השנייה של מסלול
 * היוזם). O01 היא שאלה, לא פרס: *"לבדוק כשירות לעסקת שליטה בלי לקנות תואר במילה"*.
 *
 * **הפיצול מוצהר ומבוקש.** התסריט: *"הכניסה למסלול העסקה דורשת אישור מפורש של ענף
 * היסטוריה חלופית ... הכדורגל שאחריו בדיוני"*. לכן O01.1 כותבת `life:owner:fork` רק אחרי
 * שהשחקן אמר במפורש שזה ענף בדיוני, ושתי התשובות האחרות נשארות בהיסטוריה המתועדת. *"נשמרת
 * שמירה היסטורית לפני הפיצול"* — ההתחלה של הפרק הזה היא הנקודה הזאת: הפרק מתחיל לפני
 * O01, ומי שמתחיל אותו מחדש חוזר להיסטוריה.
 *
 * **השערים של התסריט, בשפה של המנוע — ובלי להמציא כלכלה.** התסריט מונה *"P=100, R=40
 * יחידות עסקיות בדיוניות; F חייב להיות לפחות 140"*, ו*"אמון 75"* עם מיכל ואדם. למנוע אין
 * יחידות עסקיות, ולהמציא אותן כאן היה לבנות מערכת שנייה של כסף לצד הארנק (כלל 59). מה
 * שיש לו הוא דרגת השיא של אותו מסלול, `OWNER:apex` — *"שלושה שותפים: trust>=65"*, *"ללא
 * חוב שהגיע זמנו"*, עסקים 75 וארגון 55 (`routes.ts`) — כלומר בדיוק צוות שמסכים וכיסוי
 * שאינו סופר פעמיים את אותו כסף. **O02.1 ו-O03.1 פתוחות רק למי שבשיא**, ואפורות לכל השאר
 * עם המשפט שאומר מה חסר. כל האחרות פתוחות, ורובן עוצרות את העסקה בכבוד — וזו כוונת
 * התסריט: *"זו החלטה עסקית. לא בושה."*
 *
 * **O04 — הערב שהובטח.** `PARTNER_OR_KEREN` בתסריט: בן/בת הזוג אם יש (`life:partner`,
 * `partner.ts`), ואחרת קרן. שני ענפים, אותן בחירות.
 */

export const PORTRAIT_OWNER: Record<string, string> = {
  ...PORTRAIT_CAREER,
  'פרדי': 'faceFreddy',
}

const APEX = { flag: 'own:route:OWNER:apex' } as const
/** the conflict, already settled by the route's own scene — `conflictFlag` in `routes.ts` */
const SETTLED = CONFLICT_CHOICES.map((choice) => ({ flag: conflictFlag(choice) }))
const APEX_NOTE_TEAM = 'צוות כזה נבנה בשותפות — מי שכבר שותף בעלות (השיא של המסלול) מכיר מי יסכים.'
const APEX_NOTE_MONEY = 'כיסוי מלא בלי חוב שהגיע זמנו — זה השער של שותף בעלות, והוא עוד לא שם.'

export function objectiveOwner(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['o:fork']) return sceneId === 'office' ? null : 'במשרד. עמית ופרדי, וסכום שהוא לא תוצאה.'
  if (!state.flags['o:team']) return sceneId === 'office' ? null : 'מי יעבוד איתך. מיכל ואדם במשרד.'
  if (!state.flags['o:money']) return sceneId === 'office' ? null : 'שולחן העבודה. כסף שיש וכסף שנראה שיש.'
  if (!state.flags['o:sign']) return sceneId === 'home' ? null : 'בבית. הערב שהובטח, והעסקה.'
  const unsettled = state.flags['own:route:JOURNALIST:entry'] && !state.flags['o:conflict'] && !SETTLED.some((row) => state.flags[row.flag])
  if (state.flags['o:signGo'] && unsettled) return sceneId === 'newsroom' ? null : 'במערכת. שני, ומי כותב על הבעלים.'
  if (!state.flags['o:monday']) return sceneId === 'ticket-office' ? null : 'יום שני. הקופה, והשירות לאוהדים.'
  return null
}

export const ENDINGS_OWNER: Record<string, EndingCard> = {
  influence: {
    id: 'influence',
    titleHe: 'בלי לקרוא לעצמי בעלים',
    bodyHe:
      'נשארת בהיסטוריה המתועדת ובחרת השפעה בלי שליטה. פרדי אמר שתבדקו תפקיד שמתאים לזה, ואמרת שאתה לא צריך לקרוא לעצמך בעלים כדי לעשות משהו.',
    memoryHe: 'דף אחד, בלי חתימה.',
    memoryItem: 'folded-paper',
  },
  declined: {
    id: 'declined',
    titleHe: 'לא היום',
    bodyHe:
      'ויתרת על העסקה והמשכת בחיים שבנית. עמית שאל אם אתה בטוח, ואמרת שאתה בטוח שאתה לא רוצה לחתום היום — וזה היה מספיק ביטחון.',
    memoryHe: 'הצעה, מקופלת לשניים.',
    memoryItem: 'folded-paper',
  },
  pilot: {
    id: 'pilot',
    titleHe: 'בלי לדרוש שתאמיני מראש',
    bodyHe:
      'התחלתם מפרויקט ניסיון לפני עסקה. מיכל אמרה שתבצעו משהו קטן יחד ותראו איך אתה עובד, ואמרת שבלי לדרוש שתאמין מראש. העסקה חיכתה; האמון התחיל.',
    memoryHe: 'חוזה קטן, לעבודה אחת.',
    memoryItem: 'folded-paper',
  },
  deferred: {
    id: 'deferred',
    titleHe: 'עדיף לדעת עכשיו',
    bodyHe:
      'הבנת שאין צוות זמין ועצרת את העסקה הזאת. אדם אמר שעדיף שתדע את זה עכשיו, והוא צדק.',
    memoryHe: 'רשימת תפקידים, ריקה.',
    memoryItem: 'folded-paper',
  },
  partner: {
    id: 'partner',
    titleHe: 'שותף. בלי לנפח',
    bodyHe:
      'הכנסתם שותף, והסכמת שאולי לא תהיה בעל שליטה. עמית אמר שתכתבו את התואר האמיתי, ואמרת: שותף. בלי לנפח.',
    memoryHe: 'כרטיס ביקור, עם התואר הנכון.',
    memoryItem: 'folded-paper',
  },
  withdrawn: {
    id: 'withdrawn',
    titleHe: 'לא בכל מחיר',
    bodyHe:
      'נסוגת כי העתודה לא הספיקה. מיכל אמרה שזו החלטה עסקית ולא בושה, ואמרת שזה כואב מספיק גם בלי לקרוא לזה בושה.',
    memoryHe: 'גיליון מספרים, עם עמודה אחת קצרה מדי.',
    memoryItem: 'folded-paper',
  },
  missed: {
    id: 'missed',
    titleHe: 'הפעם אני מוותר',
    bodyHe:
      'ויתרת על חלון העסקה הזה. עמית אמר שלא יוכלו להבטיח שאותה הצעה תחזור, ואמרת שאתה מבין — ושהפעם אתה מוותר.',
    memoryHe: 'לוח זמנים, עם שבוע מחוק.',
    memoryItem: 'folded-paper',
  },
  service: {
    id: 'service',
    titleHe: 'לא רק מספר אנשים שענו להם',
    bodyHe:
      'השקעתם שתים-עשרה בשירות ושמונה בפיתוח. אדם אמר שיקצרו את ההמתנה וימדדו תלונות שנפתרו, ואמרת: לא רק מספר אנשים שענו להם. ביום שני פתחתם.',
    memoryHe: 'המפתח של הקופה.',
    memoryItem: 'folded-paper',
  },
  balanced: {
    id: 'balanced',
    titleHe: 'נסביר מה עוד לא נעשה',
    bodyHe:
      'שמונה בשירות, שש בפיתוח, ושש נשמרו לעתודה. מיכל אמרה פחות הבטחות היום ויותר גמישות אחר כך, ואמרת שתסבירו מה עוד לא נעשה.',
    memoryHe: 'תקציב, עם שורה שנשארה ריקה בכוונה.',
    memoryItem: 'folded-paper',
  },
  delegated: {
    id: 'delegated',
    titleHe: 'לא נעלם מאחורי המינוי',
    bodyHe:
      'מינית הנהלה לביצוע ופיקחת על שלושה יעדים. אדם אמר שהם מבצעים ואתה עדיין אחראי לבדוק, ואמרת שאתה לא נעלם מאחורי המינוי.',
    memoryHe: 'שלושה יעדים, עם תאריך בדיקה.',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_OWNER: Beat[] = [
  // O01–O03 — המשרד (`officeOwner`, 21.9.2026); עד שהציור הגיע, פינת אלנבי ושולחן המטבח
  { id: 'o-fork', at: 'office', trigger: 'enter', when: { none: [{ flag: 'o:fork' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'o-fork' }] },
  /** each step after the fork is a room of its own, and the step before it had to say "yes" (`o:*Go`) */
  { id: 'o-team', at: 'office', trigger: 'clock', when: { all: [{ flag: 'o:forkGo' }], none: [{ flag: 'o:team' }] }, delayMs: 1300, do: [{ a: 'talk', conversation: 'o-team' }] },
  { id: 'o-money', at: 'office', trigger: 'clock', when: { all: [{ flag: 'o:teamGo' }], none: [{ flag: 'o:money' }] }, delayMs: 1300, do: [{ a: 'talk', conversation: 'o-money' }] },
  { id: 'o-sign', at: 'home', trigger: 'enter', when: { all: [{ flag: 'o:moneyGo' }], none: [{ flag: 'o:sign' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'o-sign' }] },
  /**
   * `Q06` (COMBINATIONS) — *"מי כותב על הבעלים"*. רק למי שהיה פעם עיתונאי
   * (`JOURNALIST:entry` — "ever", כמו `conflictOfInterest`) ועוד לא הכריע את ניגוד העניינים.
   * התסריט סוגר דלת אחת במפורש: *"אין אפשרות להיות גם בעל שליטה וגם כתב עצמאי המסקר את
   * אותו מועדון"* — ולכן שלוש הבחירות כאן הן שתיים מתוך `CONFLICT_CHOICES`, ו-
   * `disclose_and_pay` לא מוצע. זו אותה הכרעה של `route-conflict-of-interest`, בפי שני.
   */
  {
    id: 'o-conflict',
    // Q06 *"מערכת / שיחה עם שני"* — במערכת שמעל בית הקפה, לא בבית
    at: 'newsroom',
    trigger: 'enter',
    when: { all: [{ flag: 'o:signGo' }, { flag: 'own:route:JOURNALIST:entry' }], none: [{ flag: 'o:conflict' }, ...SETTLED] },
    delayMs: 1200,
    do: [{ a: 'talk', conversation: 'o-conflict' }],
  },
  {
    id: 'o-monday',
    at: 'ticket-office',
    trigger: 'enter',
    when: { all: [{ flag: 'o:signGo' }], none: [{ flag: 'o:monday' }], any: [{ flag: 'o:conflict' }, { notFlag: 'own:route:JOURNALIST:entry' }, ...SETTLED] },
    delayMs: 700,
    do: [{ a: 'talk', conversation: 'o-monday' }],
  },
]

const SIGN_CHOICES = (who: 'PARTNER' | 'קרן') => [
  {
    id: 'delegate',
    text: '(להאציל את החלק המוסכם — ולשמור את הערב.)',
    then: [
      { e: 'flag' as const, flag: 'o:sign' },
      { e: 'flag' as const, flag: 'o:signGo' },
      { e: 'flagValue' as const, flag: 'life:owner:role', value: 'controlling_owner' },
      { e: 'proof' as const, kind: 'business_proof', proofId: 'business_proof:{chapter}:transaction', subjectHe: 'העסקה', audience: 'work' as const, delta: 4, noteHe: 'כל השערים, הסכמת מוכר, לוח זמנים ומימון — ולא שמועה שהומרה להסכם.' },
      { e: 'toast' as const, text: 'אדם: "אני מטפל בחלק שלי. החתימה שלך נשארת במועד שקבענו." — "תודה. זה בדיוק ההסכם."', tone: 'plain' as const },
    ],
  },
  {
    id: 'reschedule',
    text: '(לתאם שינוי בערב בהסכמה — ולבצע את העסקה.)',
    then: [
      { e: 'flag' as const, flag: 'o:sign' },
      { e: 'flag' as const, flag: 'o:signGo' },
      { e: 'flagValue' as const, flag: 'life:owner:role', value: 'controlling_owner' },
      { e: 'proof' as const, kind: 'business_proof', proofId: 'business_proof:{chapter}:transaction', subjectHe: 'העסקה', audience: 'work' as const, delta: 4, noteHe: 'בוצעה אחרי שהערב הוזז בהסכמה, לא בניחוש.' },
      { e: 'toast' as const, text: `${who === 'PARTNER' ? '' : 'קרן: '}"אפשר להזיז למחר. אני מסכימה, לא ניחשתי בשבילך." — "תודה. מחר רשום."`, tone: 'plain' as const },
    ],
  },
  {
    id: 'pass',
    text: '(לוותר על חלון העסקה הזה.)',
    then: [
      { e: 'flag' as const, flag: 'o:sign' },
      { e: 'flagValue' as const, flag: 'life:owner:offer', value: 'missed_by_choice' },
      { e: 'toast' as const, text: 'עמית: "לא נוכל להבטיח שאותה הצעה תחזור." — "אני מבין. הפעם אני מוותר."', tone: 'plain' as const },
      { e: 'ending' as const, id: 'missed' },
    ],
  },
]

export const CONVERSATIONS_OWNER: Conversation[] = [
  {
    id: 'o-fork',
    nameHe: 'פרדי',
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'הפעם זה באמת סכום, לא תוצאה.' },
          { who: 'פוגי', text: 'אני רואה.' },
          { who: 'פרדי', text: 'ואתה רואה מה לא מופיע בשורה הראשונה?' },
          { who: 'פוגי', text: 'ההפעלה שאחרי.' },
          { who: 'פרדי', text: 'יופי. עכשיו אפשר להתחיל.' },
          { who: null, text: 'מכאן והלאה זה ענף בדיוני: עסקת שליטה בהפועל בכדורגל שלא קרתה. ההיסטוריה המתועדת נשארת בנקודה שבה הפרק התחיל.' },
        ],
        choices: [
          {
            id: 'fork',
            text: '(לאשר את הענף הבדיוני — ולבדוק את התנאים.)',
            then: [
              { e: 'flag', flag: 'o:fork' },
              { e: 'flag', flag: 'o:forkGo' },
              { e: 'flag', flag: 'life:owner:fork' },
              { e: 'proof', kind: 'fork_acknowledged', proofId: 'fork_acknowledged:{chapter}:owner', subjectHe: 'הענף הבדיוני', noteHe: 'אישר במפורש שמה שאחרי הוא בדיון.' },
              { e: 'toast', text: 'עמית: "בודקים לפני שמתחייבים." — "הפעם אני רוצה לדעת גם מה יקרה בבוקר שאחרי."', tone: 'plain' },
            ],
          },
          {
            id: 'influence',
            text: '(להישאר בהיסטוריה המתועדת — ולבחור השפעה בלי שליטה.)',
            then: [
              { e: 'flag', flag: 'o:fork' },
              { e: 'flagValue', flag: 'life:owner:interest', value: 'influence' },
              { e: 'toast', text: 'פרדי: "אז נבדוק תפקיד שמתאים לזה." — "אני לא צריך לקרוא לעצמי בעלים כדי לעשות משהו."', tone: 'plain' },
              { e: 'ending', id: 'influence' },
            ],
          },
          {
            id: 'decline',
            text: '(לוותר על העסקה — ולהמשיך בחיים שבניתי.)',
            then: [
              { e: 'flag', flag: 'o:fork' },
              { e: 'flagValue', flag: 'life:owner:interest', value: 'declined' },
              { e: 'toast', text: 'עמית: "אתה בטוח?" — "אני בטוח שאני לא רוצה לחתום היום."', tone: 'plain' },
              { e: 'ending', id: 'declined' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'o-team',
    nameHe: 'מיכל',
    branches: [
      {
        lines: [
          { who: 'מיכל', text: 'אתה רוצה אותי בצוות או רק את השם שלי במצגת?' },
          { who: 'פוגי', text: 'בצוות.' },
          { who: 'אדם', text: 'אז מי מחליט כשאתה לא בארץ?' },
          { who: 'פוגי', text: 'צריך לכתוב את זה.' },
          { who: 'מיכל', text: 'לפני שאני אומרת כן.' },
        ],
        choices: [
          {
            id: 'agree',
            text: '(להגדיר סמכויות — ולסכם עבודה עם מי שמוכן.)',
            when: APEX,
            noteHe: APEX_NOTE_TEAM,
            then: [
              { e: 'flag', flag: 'o:team' },
              { e: 'flag', flag: 'o:teamGo' },
              { e: 'rel', who: 'michal', axis: 'trust', delta: 3 },
              { e: 'rel', who: 'adam', axis: 'trust', delta: 3 },
              { e: 'proof', kind: 'operations_agreed', proofId: 'operations_agreed:{chapter}:owner', subjectHe: 'הצוות של העסקה', noteHe: 'סמכויות כתובות — כולל מי מחליט כשהוא לא בארץ.' },
              { e: 'toast', text: 'אדם: "עכשיו אני יודע למה הסכמתי." — "וגם למה לא."', tone: 'plain' },
            ],
          },
          {
            id: 'pilot',
            text: '(להתחיל מפרויקט ניסיון — לפני עסקה.)',
            then: [
              { e: 'flag', flag: 'o:team' },
              { e: 'flagValue', flag: 'life:owner:team', value: 'apprenticeship' },
              { e: 'rel', who: 'michal', axis: 'bond', delta: 2 },
              { e: 'toast', text: 'מיכל: "נבצע משהו קטן יחד ונראה איך אתה עובד." — "בלי לדרוש שתאמיני מראש."', tone: 'plain' },
              { e: 'ending', id: 'pilot' },
            ],
          },
          {
            id: 'stop',
            text: '(להבין שאין צוות זמין — ולעצור את העסקה הזאת.)',
            then: [
              { e: 'flag', flag: 'o:team' },
              { e: 'flagValue', flag: 'life:owner:team', value: 'not_ready' },
              { e: 'toast', text: 'אדם: "עדיף שתדע את זה עכשיו." — "נכון."', tone: 'plain' },
              { e: 'ending', id: 'deferred' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'o-money',
    nameHe: 'מיכל',
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'מאה זה המחיר.' },
          { who: 'פוגי', text: 'ויש מאה.' },
          { who: 'מיכל', text: 'ואז ביום שני מה משלמים?' },
          { who: 'פוגי', text: 'עוד ארבעים עתודה.' },
          { who: 'מיכל', text: 'עכשיו זאת אותה שיחה.' },
        ],
        choices: [
          {
            id: 'covered',
            text: '(להתקדם עם מימון מחויב — וכיסוי מלא.)',
            when: APEX,
            noteHe: APEX_NOTE_MONEY,
            then: [
              { e: 'flag', flag: 'o:money' },
              { e: 'flag', flag: 'o:moneyGo' },
              { e: 'proof', kind: 'business_proof', proofId: 'business_proof:{chapter}:coverage', subjectHe: 'הכיסוי לעסקה', audience: 'work', delta: 3, noteHe: 'מחיר ועתודה, וקופת החברים והחיסכון של הבית לא נספרו.' },
              { e: 'toast', text: 'מיכל: "הכסף הזה זמין, והעתודה נשארת להפעלה." — "לא חגיגה לפני שהמספרים נסגרים."', tone: 'plain' },
            ],
          },
          {
            id: 'partner',
            text: '(להכניס שותף — ולהסכים שאולי לא אהיה בעל שליטה.)',
            then: [
              { e: 'flag', flag: 'o:money' },
              { e: 'flagValue', flag: 'life:owner:role', value: 'minority_partner' },
              { e: 'toast', text: 'עמית: "אז נכתוב את התואר האמיתי." — "שותף. בלי לנפח."', tone: 'plain' },
              { e: 'ending', id: 'partner' },
            ],
          },
          {
            id: 'withdraw',
            text: '(לסגת — העתודה לא מספיקה.)',
            then: [
              { e: 'flag', flag: 'o:money' },
              { e: 'flagValue', flag: 'life:owner:offer', value: 'withdrawn' },
              { e: 'proof', kind: 'not_at_any_price', proofId: 'not_at_any_price:{chapter}:owner', subjectHe: 'העסקה שלא בכל מחיר', noteHe: 'נסוג כשהעתודה לא הספיקה.' },
              { e: 'toast', text: 'מיכל: "זו החלטה עסקית. לא בושה." — "כואב מספיק גם בלי לקרוא לזה בושה."', tone: 'plain' },
              { e: 'ending', id: 'withdrawn' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'o-sign',
    nameHe: 'עמית',
    // הערב של PARTNER בבית; עמית על הקו, על העסקה
    remote: { 'עמית': 'phone' },
    branches: [
      {
        when: { flag: 'life:partner' },
        lines: [
          { who: 'PARTNER', text: 'אמרת שהערב הזה שלנו.' },
          { who: 'פוגי', text: 'ואני צריך לסגור את העסקה.' },
          { who: 'PARTNER', text: 'אתה צריך, או שאף אחד אחר לא קיבל ממך רשות?' },
          { who: 'פוגי', text: 'זאת שאלה טובה.' },
          { who: 'עמית', text: 'בשביל זה בנינו צוות.' },
        ],
        choices: SIGN_CHOICES('PARTNER'),
      },
      {
        lines: [
          { who: 'קרן', text: 'אמרת שהערב הזה שלנו.' },
          { who: 'פוגי', text: 'ואני צריך לסגור את העסקה.' },
          { who: 'קרן', text: 'אתה צריך, או שאף אחד אחר לא קיבל ממך רשות?' },
          { who: 'פוגי', text: 'זאת שאלה טובה.' },
          { who: 'עמית', text: 'בשביל זה בנינו צוות.' },
        ],
        choices: SIGN_CHOICES('קרן'),
      },
    ],
  },
  {
    id: 'o-conflict',
    nameHe: 'שני',
    branches: [
      {
        lines: [
          { who: 'שני', text: 'אתה לא יכול לפרסם ״למקורב להנהלה נודע״ כשהמקורב זה אתה.' },
          { who: 'פוגי', text: 'לא כתבתי את זה.' },
          { who: 'שני', text: 'אני מונעת לך את הפסקה הבאה.' },
          { who: 'פוגי', text: 'ומה כן אפשר?' },
          { who: 'שני', text: 'קודם להגיד לקורא מאיפה אתה מדבר.' },
        ],
        choices: [
          {
            id: 'other',
            text: '(להמשיך לכתוב בנושאים אחרים — עם גילוי נאות.)',
            then: [
              { e: 'flag', flag: 'o:conflict' },
              { e: 'conflict', choice: 'personal_column' },
              { e: 'flagValue', flag: 'life:desk:scope', value: 'other_subjects_disclosed' },
              { e: 'toast', text: 'שני: "והקבוצה שלך?" — "מישהו אחר יסקר. בלי שאני מאשר לו טיוטות."', tone: 'plain' },
            ],
          },
          {
            id: 'comms',
            text: '(להפסיק כתיבה עצמאית — ולעבור לדוברות מסומנת.)',
            then: [
              { e: 'flag', flag: 'o:conflict' },
              { e: 'conflict', choice: 'stop_covering' },
              { e: 'flagValue', flag: 'life:desk:scope', value: 'club_communications' },
              { e: 'toast', text: 'שני: "אז זו הודעה מטעם המועדון." — "נכתוב את זה למעלה, לא באותיות הקטנות."', tone: 'plain' },
            ],
          },
          {
            id: 'pause',
            text: '(להשהות פרסום — ולשמור את הארכיון האישי.)',
            then: [
              { e: 'flag', flag: 'o:conflict' },
              { e: 'conflict', choice: 'stop_covering' },
              { e: 'flagValue', flag: 'life:desk:scope', value: 'paused' },
              { e: 'toast', text: 'שני: "כל מה שכתבת לא נעלם." — "רק הכיסא במערכת." — "אותו כבר לקחו. הוא היחיד שלא חרק."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'o-monday',
    nameHe: 'אדם',
    branches: [
      {
        lines: [
          { who: 'אדם', text: 'שירות לאוהדים, תפעול או פיתוח?' },
          { who: 'פוגי', text: 'הכול.' },
          { who: 'מיכל', text: 'יש עשרים אחרי ההתחייבויות.' },
          { who: 'פוגי', text: 'תמיד עמית צדק עם המספרים?' },
          { who: 'אדם', text: 'אל תגיד לו. אי אפשר יהיה לחיות איתו.' },
        ],
        choices: [
          {
            id: 'service',
            text: '(שתים-עשרה לשירות, שמונה לפיתוח.)',
            then: [
              { e: 'flag', flag: 'o:monday' },
              { e: 'flagValue', flag: 'life:owner:plan', value: 'service' },
              { e: 'proof', kind: 'business_proof', proofId: 'business_proof:{chapter}:plan', subjectHe: 'התוכנית הראשונה', audience: 'work', delta: 2, noteHe: 'עשרים להתחייבויות, ועוד עשרים לפי בחירה — ובסבב הבא בודקים תוצר.' },
              { e: 'toast', text: 'אדם: "נקצר את ההמתנה ונמדוד תלונות שנפתרו." — "לא רק מספר אנשים שענו להם."', tone: 'plain' },
              { e: 'ending', id: 'service' },
            ],
          },
          {
            id: 'balanced',
            text: '(שמונה לשירות, שש לפיתוח — ושש לעתודה.)',
            then: [
              { e: 'flag', flag: 'o:monday' },
              { e: 'flagValue', flag: 'life:owner:plan', value: 'balanced' },
              { e: 'proof', kind: 'business_proof', proofId: 'business_proof:{chapter}:plan', subjectHe: 'התוכנית הראשונה', audience: 'work', delta: 2, noteHe: 'שש נשמרו לעתודה, והוסבר מה עוד לא נעשה.' },
              { e: 'toast', text: 'מיכל: "פחות הבטחות היום, יותר גמישות אחר כך." — "ונסביר מה עדיין לא נעשה."', tone: 'plain' },
              { e: 'ending', id: 'balanced' },
            ],
          },
          {
            id: 'delegated',
            text: '(למנות הנהלה לביצוע — ולפקח על שלושה יעדים.)',
            then: [
              { e: 'flag', flag: 'o:monday' },
              { e: 'flagValue', flag: 'life:owner:plan', value: 'delegated' },
              { e: 'proof', kind: 'business_proof', proofId: 'business_proof:{chapter}:plan', subjectHe: 'התוכנית הראשונה', audience: 'work', delta: 2, noteHe: 'הנהלה מבצעת, והבעלים בודק שלושה יעדים.' },
              { e: 'toast', text: 'אדם: "אנחנו מבצעים. אתה עדיין אחראי לבדוק." — "אני לא נעלם מאחורי המינוי."', tone: 'plain' },
              { e: 'ending', id: 'delegated' },
            ],
          },
        ],
      },
    ],
  },
]
