import type { LifeState } from '../types'
import type { LifeEvent } from '../events'
import { careerEntry } from '../work'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { ChoiceDef, Conversation, Say } from './script'
import { PORTRAIT_TEAM } from './chapterTeam'

/**
 * חלון CAREER — T01–T03 (היציע) ו-J01–J03 (העיתונות). שישה פרקים קטנים, כי התסריט
 * פורש אותם על עשרים ושלוש שנה: 2001, 2002, 2006, 2012, 2024, 2025.
 *
 * **איך הם נפתחים — לפי המסלול שכבר מוחזק** (ההכרעה שהוצעה למאור כ-A). מערכת המסלולים
 * (`lib/life/routes.ts`) כבר מציעה את הדרגות — כניסה, תרגול, שיא — ברגע שהשחקן זכאי. מה
 * שחסר לה עד היום הוא **העבודה עצמה**: `practice` מבקש שתי הוכחות מסוג המסלול בשני פרקים
 * שונים, ו-`apex` ארבע בארבעה — ובכל המשחק היה מקור אחד בלבד ל-`leadership_proof` ושניים
 * ל-`journalism_proof`. החלונות האלה הם המקורות: כל פרק כאן נפתח רק למי שמחזיק את הדרגה
 * שלפניו, ומי שעושה בו את העבודה מתקדם לדרגה שאחריו — **אבל אף פרק לא מעניק דרגה**. הדרגה
 * נשארת הזמנה שנאמרת בקול ושאפשר לדחות (`eligibleFor` / `acceptEvents`, הכלל הראשון שם).
 *
 * · `2001-terrace` (T01) — למי שמחזיק `ULTRAS:entry`. התפקיד הראשון, בשער 5 הישן.
 * · `2012-terrace` (T02) — למי שלקח תפקיד ב-T01 (`life:terrace:role`). להאציל.
 * · `2024-terrace` (T03) — למי שמחזיק `ULTRAS:practice`. על הרחבה של בלומפילד המחודש,
 *   כי שער 5 של 2001 נבנה מחדש עם כל השאר (לוח בלומפילד ב-`world/scenes.ts`).
 * · `2002-desk` (J01) — למי שמחזיק `JOURNALIST:entry`. הפרסום הראשון, בבית הקפה באלנבי.
 * · `2006-desk` (J02) — למי שפרסם ב-J01 (`life:desk`). **פרק אחר ולא אותו פרק**, כי תיקון
 *   נכתב אחרי הדבר שהוא מתקן: `tests/life-ledger` דורש ש-`public_correction` יבוא בפרק
 *   מאוחר מה-`written_account` שעל אותו נושא, וזה בדיוק מה שהתסריט אומר ב-J02.
 * · `2025-interview` (J03) — למי שהגיע ל-`JOURNALIST:apex` (*"route.journalist_peak"*).
 *
 * **המרות מהתסריט:** `documentation` → `communication`; `mediation` → `communication`;
 * *"אמון קהילה terrace"* → קהל `gate5`; *"media"* → `public`. *"תואר מתקבל רק עם שער"*
 * (T03) — כלומר הפרק לא כותב תואר; הוא כותב הוכחה, והתואר בא מההצעה של המסלול.
 */

export const PORTRAIT_CAREER: Record<string, string> = {
  ...PORTRAIT_TEAM,
  'אסף': 'faceAsaf',
  'מלמד': 'faceMelamed',
}

export const TERRACE_ROLE = 'life:terrace:role'
export const DESK = 'life:desk'
export const DESK_UNVERIFIED = 'life:desk:unverified'

// ================================================================ T01 · 2001 ====

export function objectiveTerrace01(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone || state.flags['t:first']) return null
  return sceneId === 'gate5' ? null : 'שער 5. אסף מחפש ידיים, לא צעקות.'
}

export const ENDINGS_TERRACE01: Record<string, EndingCard> = {
  gear: {
    id: 'gear',
    titleHe: 'מה שאתה יכול לקחת עד הסוף',
    bodyHe:
      'לקחת תפקיד הכנה והחזרת את הציוד מסודר. ארז ביקש שתראה לבא איפה הכול, ואמרת שלא שומרים ידע רק בשביל שיצטרכו אותך — וזה היה התפקיד, לא הדגל.',
    memoryHe: 'מפתח של ארגז, על שרוך.',
    memoryItem: 'folded-paper',
  },
  people: {
    id: 'people',
    titleHe: 'אחד אחד',
    bodyHe:
      'תיאמת מתנדבים במקום לסחוב. יבגני אמר לוודא שכל אחד אישר ולא רק נקרא בקבוצה, ועברת אחד אחד — ובערב היו שם כל מי שאמר שיהיה.',
    memoryHe: 'רשימה עם וי ליד כל שם.',
    memoryItem: 'folded-paper',
  },
  fan: {
    id: 'fan',
    titleHe: 'כשתוכל לקחת משהו',
    bodyHe:
      'אמרת שאין לך קיבולת לתפקיד מתמשך. אסף אמר שתבוא כאוהד, ושכשתוכל לקחת משהו תדברו — והיציע לא נהיה קטן יותר בגלל זה.',
    memoryHe: 'מקום ביציע, בלי תפקיד.',
    memoryItem: 'ticket-stub',
  },
}

export const BEATS_TERRACE01: Beat[] = [
  { id: 't-first', at: 'gate5', trigger: 'enter', when: { none: [{ flag: 't:first' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 't-first' }] },
]

// ================================================================ T02 · 2012 ====

export function objectiveTerrace02(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone || state.flags['t:hand']) return null
  return sceneId === 'gate5' ? null : 'שער 5. יבגני רוצה להוביל — באמת.'
}

export const ENDINGS_TERRACE02: Record<string, EndingCard> = {
  trust: {
    id: 'trust',
    titleHe: 'מתי לא להפריע',
    bodyHe:
      'נתת ליבגני סמכות וסיכמתם גבולות מראש. הוא יודע עכשיו מתי להחליט ומתי להתקשר, ואתה יודע מתי לא להפריע — וזה היה החלק הקשה מבין השניים.',
    memoryHe: 'דף גבולות, חתום בשני שמות.',
    memoryItem: 'folded-paper',
  },
  small: {
    id: 'small',
    titleHe: 'קטן ומבוצע',
    bodyHe:
      'ניהלתם יחד תפקיד מצומצם יותר. אסף אמר שקטן ומבוצע עדיף מגדול שמחכה לך, והסכמת — והערב עבד, בלי שאף אחד חיכה לך.',
    memoryHe: 'לוח משמרות של שני אנשים.',
    memoryItem: 'folded-paper',
  },
  handed: {
    id: 'handed',
    titleHe: 'הכול כאן',
    bodyHe:
      'ויתרת על האחריות ומסרת אותה לפני האירוע, עם הציוד, המידע ותנאי ההחלטה. יבגני אמר שהוא לוקח, ואמרת שהכול כאן — ובאמת היה.',
    memoryHe: 'תיק מסירה, מלא.',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_TERRACE02: Beat[] = [
  { id: 't-hand', at: 'gate5', trigger: 'enter', when: { none: [{ flag: 't:hand' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 't-hand' }] },
]

// ================================================================ T03 · 2024 ====

export function objectiveTerrace03(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone || state.flags['t:lead']) return null
  return sceneId === 'bloomfield-inside' ? null : 'ביציע של בלומפילד. הם מחכים שתסביר מה עושים.'
}

export const ENDINGS_TERRACE03: Record<string, EndingCard> = {
  lead: {
    id: 'lead',
    titleHe: 'תתחיל מעצמך',
    bodyHe:
      'חילקת שלושה צוותים, שאלת מי יכול, ופתרת מחסור אחד. אסף אמר לתת להם לעבוד, ואמרת שאתה כבר רוצה לתקן הכול — והוא אמר שתתחיל מעצמך. זו הייתה ההחלטה על אנשים, לא הכותרת.',
    memoryHe: 'שלוש רשימות, ושם אחד מחוק ומתוקן.',
    memoryItem: 'folded-paper',
  },
  mentored: {
    id: 'mentored',
    titleHe: 'אנחנו לא בצבא',
    bodyHe:
      'ביקשת חניכה בתפקיד אחד במקום להעמיד פנים שאתה מוכן. שאלת אם הוא הוריד לך דרגה, ואסף אמר שאתם לא בצבא — וזו הייתה התחלה טובה, כמו שאמר.',
    memoryHe: 'תפקיד אחד, ומישהו לידו.',
    memoryItem: 'folded-paper',
  },
  exit: {
    id: 'exit',
    titleHe: 'השנים שלך נשארות',
    bodyHe:
      'בחרת לסיים תקופה והשארת מחליף שהסכים. אסף אמר שהתפקיד עובר והשנים שלך נשארות, ואמרת שזה מה שהיה חשוב לך.',
    memoryHe: 'צעיף ישן, שעבר יד.',
    memoryItem: 'scarf',
  },
}

export const BEATS_TERRACE03: Beat[] = [
  // T03 — ביציע החדש (`bloomNewTerrace`), לא על הרחבה: *"תראה אותם"* נאמר מול אנשים שיושבים
  { id: 't-lead', at: 'bloomfield-inside', trigger: 'enter', when: { none: [{ flag: 't:lead' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 't-lead' }] },
]

// ================================================================ J01 · 2002 ====

export function objectiveDesk01(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone || state.flags['j:first']) return null
  return sceneId === 'allenby' ? null : 'באלנבי. עמית ושני, והפרסום הראשון.'
}

export const ENDINGS_DESK01: Record<string, EndingCard> = {
  verified: {
    id: 'verified',
    titleHe: 'מה שלא הצלחתי לאמת נשאר בחוץ',
    bodyHe:
      'בדקת את העובדות וביקשת רשות לתמונה לפני שפרסמת. שני קיבלה קרדיט כמו שצריך, ומה שלא הצלחת לאמת נשאר בחוץ — וזה היה הפרסום הראשון שלך, קצר מכפי שרצית ונכון מכפי שפחדת.',
    memoryHe: 'הכתבה הראשונה, עם שם הצלמת מתחת לתמונה.',
    memoryItem: 'clipping',
  },
  memoir: {
    id: 'memoir',
    titleHe: 'כך אני זוכר',
    bodyHe:
      'פרסמת זיכרון אישי, בלי תמונה ובלי טענה שראית מה שלא ראית. עמית אמר "כך אני זוכר", לא "כך היה", והשארת את ההבדל בכותרת.',
    memoryHe: 'כותרת שמתחילה ב"כך אני זוכר".',
    memoryItem: 'clipping',
  },
  rumour: {
    id: 'rumour',
    titleHe: 'עוד לא עניתי',
    bodyHe:
      'פרסמת את השמועה כאילו בדקת. שאלו על המקור, ועמית שאל מה ענית — ואמרת שעוד לא ענית. זה נשאר פתוח, ואתה ידעת בדיוק איפה.',
    memoryHe: 'הודעה שלא נענתה: "מה המקור?"',
    memoryItem: 'folded-paper',
  },
}

/** `career:media:organic|assisted|late` — a day flag for the branch the desk opens on; nothing before eighteen */
function careerEntryEvents(state: LifeState): LifeEvent[] {
  const entry = careerEntry(state, 'JOURNALIST')
  return entry ? [{ t: 'flag.raised', flag: `career:media:${entry}` }] : []
}

export const BEATS_DESK01: Beat[] = [
  {
    id: 'j-first',
    at: 'allenby',
    trigger: 'enter',
    when: { none: [{ flag: 'j:first' }] },
    delayMs: 700,
    // delta 91 — how he arrives at the desk is derived from the evidence (MASTER §83), never stored
    do: [{ a: 'derive', events: careerEntryEvents }, { a: 'talk', conversation: 'j-first' }],
  },
]

// ================================================================ J02 · 2006 ====

export function objectiveDesk02(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone || state.flags['j:fix']) return null
  return sceneId === 'newsroom' ? null : 'במערכת, מעל בית הקפה. מה נשאר מהפרסום ההוא.'
}

export const ENDINGS_DESK02: Record<string, EndingCard> = {
  corrected: {
    id: 'corrected',
    titleHe: 'שיראו',
    bodyHe:
      'פרסמת תיקון גלוי וצירפת מקור, באותו מקום שבו פורסמה הטעות. עמית אמר שעכשיו הקורא יכול להבין מה השתנה, ואמרת שאתה צריך לחיות עם זה שיראו — וחיית.',
    memoryHe: 'התיקון, באותיות באותו גודל.',
    memoryItem: 'clipping',
  },
  second: {
    id: 'second',
    titleHe: 'השם שלה נשאר מתחתיה',
    bodyHe:
      'הפקת פרסום שני עם מקור עצמאי. שני אמרה שהסכימו לשימוש בתמונה, ואמרת שהשם שלה נשאר מתחתיה — כי זה מה שמבדיל עבודה מלקיחה.',
    memoryHe: 'הפרסום השני, עם שני שמות.',
    memoryItem: 'clipping',
  },
  held: {
    id: 'held',
    titleHe: 'עדיף שזה לא יופיע ככה',
    bodyHe:
      'דחית פרסום כי לא היה מספיק בסיס. עמית אמר שזה לא יופיע היום, ואמרת שעדיף שלא יופיע ככה — וזה לא הופיע, ואף אחד לא היה צריך לתקן כלום.',
    memoryHe: 'טיוטה, בתיקייה "לא עכשיו".',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_DESK02: Beat[] = [
  // J02 *"מערכת קטנה"* — המערכת שמעל בית הקפה (`deskNewsroom`, 21.9.2026)
  { id: 'j-fix', at: 'newsroom', trigger: 'enter', when: { none: [{ flag: 'j:fix' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'j-fix' }] },
]

// ================================================================ J03 · 2025 ====

export function objectiveInterview(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone || state.flags['j:asked']) return null
  return sceneId === 'allenby' ? null : 'באלנבי. פעם אחת שואלים אותך.'
}

export const ENDINGS_INTERVIEW: Record<string, EndingCard> = {
  asked: {
    id: 'asked',
    titleHe: 'אחד שיש לי רשות להראות',
    bodyHe:
      'דיברת על העבודה ושמרת על הגבולות של החברים. היא ביקשה פריט מהארכיון, והראית אחד שיש לך רשות להראות — וזה היה הראיון, ולא יותר.',
    memoryHe: 'קטע מהראיון, גזור.',
    memoryItem: 'clipping',
  },
  team: {
    id: 'team',
    titleHe: 'הפעם לא הייתי צריכה לבקש',
    bodyHe:
      'ביקשת שהכתבה תתמקד בצוות שנתן קרדיט זה לזה. שני אמרה שהפעם היא לא הייתה צריכה לבקש, ואמרת שלמדת.',
    memoryHe: 'כתבה על צוות, עם כל השמות.',
    memoryItem: 'clipping',
  },
  declined: {
    id: 'declined',
    titleHe: 'בצד השני',
    bodyHe:
      'ויתרת על הראיון והמשכת לעבוד. היא אמרה שאם תשנה דעתך תגיד, ואמרת תודה — ושכרגע נוח לך בצד השני של השאלות.',
    memoryHe: 'כרטיס ביקור, בלי פגישה.',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_INTERVIEW: Beat[] = [
  { id: 'j-asked', at: 'allenby', trigger: 'enter', when: { none: [{ flag: 'j:asked' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'j-asked' }] },
]

// ================================================================== the words ====

/**
 * הכניסה לעיתונות (delta 91, MASTER §27, §83) — organic, assisted, or neither, said in
 * Amit's first sentence. `careerEntry` reads the evidence already in the ledger (a checked
 * rumour, a written account, papers delivered) and the beat below writes ONE day flag;
 * the scene is the same scene, the branch is the modifier (MASTER §34).
 */
const J_FIRST_LINES: Say[] = [
  { who: 'שני', text: 'התמונה שלי. המשפט שלך.' },
  { who: 'פוגי', text: 'חשבתי שאם היית איתנו—' },
  { who: 'שני', text: 'אז היית יכול לשאול.' },
  { who: 'עמית', text: 'גם העובדה בפסקה השנייה לא בטוחה.' },
  { who: 'פוגי', text: 'אז טוב שעוד לא לחצתי פרסם.' },
]
const J_FIRST_CHOICES: ChoiceDef[] = [
  {
    id: 'verify',
    text: '(לבדוק את העובדות — ולקבל רשות לתמונה לפני פרסום.)',
    then: [
      { e: 'flag', flag: 'j:first' },
      { e: 'flag', flag: DESK },
      { e: 'time', minutes: 60 },
      { e: 'energy', delta: -5 },
      // `documentation` בתסריט → `communication` במנוע
      { e: 'skill', skill: 'communication', delta: 3, why: 'שתי עובדות ממקורות, ורשות לתמונה' },
      { e: 'proof', kind: 'journalism_proof', proofId: 'journalism_proof:{chapter}:first', subjectHe: 'הפרסום הראשון', audience: 'public', delta: 4, noteHe: 'שתי עובדות ממקורות, עדות מסומנת, ודעה בנפרד. התמונה עם קרדיט.' },
      { e: 'heard', proofId: 'journalism_proof:{chapter}:first' },
      { e: 'rel', who: 'crowd-shani', axis: 'trust', delta: 3 },
      { e: 'memory', item: 'clipping', id: 'j-first-verified' },
      { e: 'toast', text: 'שני: "עכשיו אפשר לתת קרדיט כמו שצריך." — "ומה שלא הצלחתי לאמת נשאר בחוץ."', tone: 'plain' },
      { e: 'ending', id: 'verified' },
    ],
  },
  {
    id: 'memoir',
    text: '(לפרסם זיכרון אישי — בלי תמונה ובלי לטעון שראיתי מה שלא ראיתי.)',
    then: [
      { e: 'flag', flag: 'j:first' },
      { e: 'flag', flag: DESK },
      { e: 'time', minutes: 45 },
      { e: 'skill', skill: 'communication', delta: 3, why: 'השאיר את ההבדל בין זיכרון לעובדה בכותרת' },
      { e: 'proof', kind: 'written_account', proofId: 'written_account:{chapter}:memoir', subjectHe: 'כך אני זוכר', audience: 'public', delta: 1, noteHe: '"כך אני זוכר", ולא "כך היה".' },
      { e: 'toast', text: 'עמית: "״כך אני זוכר״, לא ״כך היה״." — "השארתי את ההבדל בכותרת."', tone: 'plain' },
      { e: 'ending', id: 'memoir' },
    ],
  },
  {
    id: 'rumour',
    text: '(לפרסם את השמועה כאילו בדקתי.)',
    then: [
      { e: 'flag', flag: 'j:first' },
      { e: 'flag', flag: DESK },
      { e: 'flag', flag: DESK_UNVERIFIED },
      { e: 'proof', kind: 'written_account', proofId: 'written_account:{chapter}:rumour', subjectHe: 'השמועה שפרסמתי ב-2002', noteHe: 'פורסם כאילו נבדק. לא נבדק.' },
      { e: 'repLoss', audience: 'public', delta: -8, why: 'פרסם שמועה כאילו בדק' },
      { e: 'toast', text: 'עמית: "שאלו על המקור. מה ענית?" — "עוד לא עניתי."', tone: 'red' },
      { e: 'ending', id: 'rumour' },
    ],
  },
]

export const CONVERSATIONS_CAREER: Conversation[] = [
  {
    id: 't-first',
    nameHe: 'אסף',
    branches: [
      {
        lines: [
          { who: 'אסף', text: 'אתה רוצה לעזור?' },
          { who: 'פוגי', text: 'כן.' },
          { who: 'אסף', text: 'אז מה אתה יכול לקחת עד הסוף?' },
          { who: 'מלמד', text: 'הוא יודע לצעוק.' },
          { who: 'אסף', text: 'יש לי מספיק צעקות. חסרות לי ידיים.' },
        ],
        choices: [
          {
            id: 'gear',
            text: '(לבצע תפקיד הכנה — ולהחזיר את הציוד מסודר.)',
            then: [
              { e: 'flag', flag: 't:first' },
              { e: 'flagValue', flag: TERRACE_ROLE, value: 'active' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -15 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'החזיר ציוד מסודר, והראה לבא איפה הכול' },
              { e: 'proof', kind: 'leadership_proof', proofId: 'leadership_proof:{chapter}:gear', subjectHe: 'הציוד של היציע', audience: 'gate5', delta: 4, noteHe: 'תפקיד הכנה שנלקח עד הסוף, וציוד שחזר מסודר.' },
              { e: 'heard', proofId: 'leadership_proof:{chapter}:gear' },
              { e: 'toast', text: 'ארז: "עכשיו תראה למי הבא איפה הכול." — "לא שומרים ידע רק בשביל שיצטרכו אותי."', tone: 'plain' },
              { e: 'ending', id: 'gear' },
            ],
          },
          {
            id: 'people',
            text: '(לתאם מתנדבים — במקום עבודה פיזית.)',
            then: [
              { e: 'flag', flag: 't:first' },
              { e: 'flagValue', flag: TERRACE_ROLE, value: 'active' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              // `mediation` בתסריט → `communication` במנוע
              { e: 'skill', skill: 'communication', delta: 3, why: 'וידא שכל אחד אישר, אחד אחד' },
              { e: 'proof', kind: 'leadership_proof', proofId: 'leadership_proof:{chapter}:volunteers', subjectHe: 'המתנדבים של הערב', audience: 'gate5', delta: 4, noteHe: 'כל מי שאמר שיהיה — היה, כי מישהו שאל אותו.' },
              { e: 'heard', proofId: 'leadership_proof:{chapter}:volunteers' },
              { e: 'toast', text: 'יבגני: "תוודא שכל אחד אישר, לא רק נקרא בקבוצה." — "אחד אחד."', tone: 'plain' },
              { e: 'ending', id: 'people' },
            ],
          },
          {
            id: 'no',
            text: '"אין לי קיבולת לתפקיד מתמשך."',
            then: [
              { e: 'flag', flag: 't:first' },
              { e: 'flagValue', flag: 'life:terrace:offer', value: 'declined' },
              { e: 'toast', text: 'אסף: "אז תבוא כאוהד. כשתוכל לקחת משהו, נדבר." — "תודה."', tone: 'plain' },
              { e: 'ending', id: 'fan' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 't-hand',
    nameHe: 'יבגני',
    branches: [
      {
        lines: [
          { who: 'יבגני', text: 'אם אתה נותן לי להוביל, אני מחליט חלק מהדברים.' },
          { who: 'פוגי', text: 'ברור.' },
          { who: 'יבגני', text: 'גם אם זה לא בדיוק איך שאתה עושה.' },
          { who: 'פוגי', text: 'לזה הגעתי קצת פחות מוכן.' },
          { who: 'אסף', text: 'אז בשביל זה אנחנו פה.' },
        ],
        choices: [
          {
            id: 'trust',
            text: '(לתת לו סמכות — ולסכם גבולות מראש.)',
            then: [
              { e: 'flag', flag: 't:hand' },
              { e: 'time', minutes: 45 },
              { e: 'skill', skill: 'organization', delta: 5, why: 'האציל סמכות אמיתית, עם גבולות שסוכמו' },
              { e: 'proof', kind: 'leadership_proof', proofId: 'leadership_proof:{chapter}:delegated', subjectHe: 'הסמכות שנתתי ליבגני', audience: 'gate5', delta: 4, noteHe: 'ציוד, מידע ותנאי החלטה — לא רק שם ברשימה.' },
              { e: 'heard', proofId: 'leadership_proof:{chapter}:delegated' },
              { e: 'rel', who: 'yevgeny', axis: 'trust', delta: 3 },
              { e: 'toast', text: 'יבגני: "עכשיו אני יודע מתי להחליט ומתי להתקשר." — "ואני יודע מתי לא להפריע."', tone: 'plain' },
              { e: 'ending', id: 'trust' },
            ],
          },
          {
            id: 'small',
            text: '(לנהל יחד תפקיד מצומצם יותר.)',
            then: [
              { e: 'flag', flag: 't:hand' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -10 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'קטן ומבוצע' },
              { e: 'proof', kind: 'leadership_proof', proofId: 'leadership_proof:{chapter}:shared', subjectHe: 'התפקיד שהוקטן', audience: 'gate5', delta: 4, noteHe: 'תפקיד מצומצם שבוצע, במקום גדול שחיכה.' },
              { e: 'heard', proofId: 'leadership_proof:{chapter}:shared' },
              { e: 'toast', text: 'אסף: "קטן ומבוצע עדיף מגדול שמחכה לך." — "מסכים."', tone: 'plain' },
              { e: 'ending', id: 'small' },
            ],
          },
          {
            id: 'handover',
            text: '(לוותר על האחריות — ולמסור אותה לפני האירוע.)',
            then: [
              { e: 'flag', flag: 't:hand' },
              { e: 'flagValue', flag: TERRACE_ROLE, value: 'former' },
              { e: 'proof', kind: 'handover', proofId: 'handover:{chapter}:terrace', subjectHe: 'התפקיד שמסרתי ליבגני', audience: 'gate5', delta: 2, noteHe: 'נמסר לפני האירוע, עם כל מה שצריך כדי להחליט.' },
              { e: 'heard', proofId: 'handover:{chapter}:terrace' },
              { e: 'toast', text: 'יבגני: "אני לוקח. תעביר את המידע." — "הכול כאן."', tone: 'plain' },
              { e: 'ending', id: 'handed' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 't-lead',
    nameHe: 'אסף',
    branches: [
      {
        lines: [
          { who: 'אסף', text: 'תראה אותם.' },
          { who: 'פוגי', text: 'מה?' },
          { who: 'אסף', text: 'מחכים שתסביר מה עושים.' },
          { who: 'פוגי', text: 'חשבתי שאתה מסביר.' },
          { who: 'אסף', text: 'היום אני עוזר לך.' },
        ],
        choices: [
          {
            id: 'lead',
            text: '(לחלק תפקידים, לשאול מי יכול — ולבצע.)',
            then: [
              { e: 'flag', flag: 't:lead' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -15 },
              { e: 'skill', skill: 'organization', delta: 5, why: 'שלושה צוותים ומחסור אחד' },
              { e: 'proof', kind: 'leadership_proof', proofId: 'leadership_proof:{chapter}:teams', subjectHe: 'שלושה צוותים ומחסור אחד', audience: 'gate5', delta: 6, noteHe: 'החלטה על אנשים: מי יכול, מה חסר, ומי סוגר את זה.' },
              { e: 'heard', proofId: 'leadership_proof:{chapter}:teams' },
              { e: 'toast', text: 'אסף: "עכשיו תן להם לעבוד." — "אני כבר רוצה לתקן הכול." — "אז תתחיל מעצמך."', tone: 'plain' },
              { e: 'ending', id: 'lead' },
            ],
          },
          {
            id: 'mentor',
            text: '(לבקש חניכה בתפקיד אחד — במקום להעמיד פנים שאני מוכן.)',
            then: [
              { e: 'flag', flag: 't:lead' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -10 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'ביקש חניכה במקום להעמיד פנים' },
              { e: 'proof', kind: 'mentored_role', proofId: 'mentored_role:{chapter}:terrace', subjectHe: 'תפקיד אחד, עם חונך', audience: 'gate5', delta: 2, noteHe: 'ביקש ללמוד תפקיד אחד לפני שלקח שלושה.' },
              { e: 'toast', text: 'אסף: "זאת התחלה טובה." — "לא הורדת לי דרגה?" — "אנחנו לא בצבא."', tone: 'plain' },
              { e: 'ending', id: 'mentored' },
            ],
          },
          {
            id: 'exit',
            text: '(לסיים תקופה — ולהשאיר מחליף שהסכים.)',
            then: [
              { e: 'flag', flag: 't:lead' },
              { e: 'flagValue', flag: TERRACE_ROLE, value: 'former' },
              { e: 'proof', kind: 'clean_exit', proofId: 'clean_exit:{chapter}:terrace', subjectHe: 'התקופה שסיימתי ביציע', audience: 'gate5', delta: 2, noteHe: 'יצא עם מחליף שהסכים, ולא דרך דלת אחורית.' },
              { e: 'heard', proofId: 'clean_exit:{chapter}:terrace' },
              { e: 'toast', text: 'אסף: "התפקיד עובר. השנים שלך נשארות." — "זה מה שהיה חשוב לי."', tone: 'plain' },
              { e: 'ending', id: 'exit' },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ J01 ------
  {
    id: 'j-first',
    nameHe: 'שני',
    branches: [
      {
        when: { flag: 'career:media:organic' },
        lines: [{ who: 'עמית', text: 'אתה ממילא כל הזמן מתקן אותנו. תכתוב.' }, ...J_FIRST_LINES],
        choices: J_FIRST_CHOICES,
      },
      {
        when: { flag: 'career:media:assisted' },
        lines: [{ who: 'עמית', text: 'צריך שני טורים. רוצה לנסות?' }, ...J_FIRST_LINES],
        choices: J_FIRST_CHOICES,
      },
      {
        lines: J_FIRST_LINES,
        choices: J_FIRST_CHOICES,
      },
    ],
  },

  // ------------------------------------------------------------------ J02 ------
  {
    id: 'j-fix',
    nameHe: 'עמית',
    branches: [
      {
        lines: [
          { who: 'עמית', text: 'זה לא סוף העולם שטעית.' },
          { who: 'פוגי', text: 'ככה זה מרגיש.' },
          { who: 'עמית', text: 'סוף האמון זה אם תעמיד פנים שלא.' },
          { who: 'שני', text: 'תשאיר מקום לתיקון. לא באותיות שאף אחד לא רואה.' },
        ],
        choices: [
          {
            id: 'correct',
            text: '(לפרסם תיקון גלוי — ולצרף מקור.)',
            when: { flag: DESK_UNVERIFIED },
            noteHe: 'אין מה לתקן. מה שפרסמת עמד.',
            then: [
              { e: 'flag', flag: 'j:fix' },
              { e: 'time', minutes: 30 },
              { e: 'skill', skill: 'communication', delta: 3, why: 'תיקן באותו מקום ובאותו גודל' },
              { e: 'proof', kind: 'public_correction', proofId: 'public_correction:{chapter}:rumour', subjectHe: 'השמועה שפרסמתי ב-2002', audience: 'public', delta: 4, noteHe: 'תיקון גלוי עם מקור, בלי למחוק את מה שנכתב.' },
              { e: 'heard', proofId: 'public_correction:{chapter}:rumour' },
              { e: 'toast', text: 'עמית: "עכשיו הקורא יכול להבין מה השתנה." — "ואני צריך לחיות עם זה שיראו."', tone: 'plain' },
              { e: 'ending', id: 'corrected' },
            ],
          },
          {
            id: 'second',
            text: '(להפיק פרסום שני — עם מקור עצמאי.)',
            then: [
              { e: 'flag', flag: 'j:fix' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -5 },
              { e: 'skill', skill: 'communication', delta: 3, why: 'מקור עצמאי, ורשות לתמונה' },
              { e: 'proof', kind: 'journalism_proof', proofId: 'journalism_proof:{chapter}:second', subjectHe: 'הפרסום השני', audience: 'public', delta: 4, noteHe: 'מקור עצמאי, ושם הצלמת מתחת לתמונה.' },
              { e: 'heard', proofId: 'journalism_proof:{chapter}:second' },
              { e: 'toast', text: 'שני: "הסכימו לשימוש בתמונה הזאת." — "והשם שלה נשאר מתחתיה."', tone: 'plain' },
              { e: 'ending', id: 'second' },
            ],
          },
          {
            id: 'hold',
            text: '(לדחות את הפרסום — אין מספיק בסיס.)',
            then: [
              { e: 'flag', flag: 'j:fix' },
              { e: 'flag', flag: 'life:desk:held' },
              { e: 'toast', text: 'עמית: "זה לא יופיע היום." — "עדיף שזה לא יופיע ככה."', tone: 'plain' },
              { e: 'ending', id: 'held' },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ J03 ------
  {
    id: 'j-asked',
    nameHe: 'מראיינת',
    branches: [
      {
        lines: [
          { who: 'מראיינת', text: 'למה אתה ממשיך לתעד גם כשאין ניצחונות?' },
          { who: 'פוגי', text: 'כי אנחנו לא נעלמים כשהם מפסידים.' },
          { who: 'מראיינת', text: 'ומה אתה לא מפרסם?' },
          { who: 'פוגי', text: 'דברים שמישהו סיפר לי כי הייתי חבר שלו.' },
        ],
        choices: [
          {
            id: 'work',
            text: '(לדבר על העבודה — ולשמור על הגבולות של החברים.)',
            then: [
              { e: 'flag', flag: 'j:asked' },
              { e: 'time', minutes: 45 },
              { e: 'proof', kind: 'interview_completed', proofId: 'interview_completed:{chapter}:work', subjectHe: 'הראיון על העבודה', audience: 'public', delta: 2, noteHe: 'שלוש שאלות על העבודה; החברים נשארו פרטיים.' },
              { e: 'heard', proofId: 'interview_completed:{chapter}:work' },
              { e: 'memory', item: 'clipping', id: 'j-interview' },
              { e: 'toast', text: 'מראיינת: "אפשר לראות פריט מהארכיון?" — "אחד שיש לי רשות להראות."', tone: 'plain' },
              { e: 'ending', id: 'asked' },
            ],
          },
          {
            id: 'team',
            text: '(לבקש שהכתבה תתמקד בצוות שנתן קרדיט זה לזה.)',
            then: [
              { e: 'flag', flag: 'j:asked' },
              { e: 'time', minutes: 45 },
              { e: 'rel', who: 'crowd-shani', axis: 'bond', delta: 2 },
              { e: 'rel', who: 'crowd-shani', axis: 'trust', delta: 3 },
              { e: 'memory', item: 'clipping', id: 'j-team-profile' },
              { e: 'toast', text: 'שני: "הפעם לא הייתי צריכה לבקש." — "למדתי."', tone: 'plain' },
              { e: 'ending', id: 'team' },
            ],
          },
          {
            id: 'decline',
            text: '(לוותר על הראיון — ולהמשיך לעבוד.)',
            then: [
              { e: 'flag', flag: 'j:asked' },
              { e: 'flagValue', flag: 'life:desk:interview', value: 'declined' },
              { e: 'toast', text: 'מראיינת: "אם תשנה דעתך, תגיד." — "תודה. כרגע נוח לי בצד השני."', tone: 'plain' },
              { e: 'ending', id: 'declined' },
            ],
          },
        ],
      },
    ],
  },
]
