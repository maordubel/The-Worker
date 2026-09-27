import { at } from '../clock'
import type { LifeState } from '../types'
import type { LifeEvent } from '../events'
import { careerEntry } from '../work'
import type { Condition } from '../world/types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { ChoiceDef, Conversation, Effect, Say } from './script'
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
  if (state.chapterDone) return null
  const f = state.flags
  if (!f['t:first']) return sceneId === 'gate5' ? null : 'שער 5. אסף מחפש ידיים, לא צעקות.'
  if (f[TERRACE_ROLE] !== 'active') return null
  if (f['t:open']) return f['t:credit'] ? null : 'השער נפתח. מי עשה מה.'
  if (sceneId !== 'gate5-stand') return 'דרך הקרוסלות, מתחת ליציע. בחמש פותחים.'
  const done = T01_TASKS.filter((task) => f[`t:task:${task}`]).length
  return done === 0 ? 'שלוש עבודות מתחת ליציע, וזמן לשתיים. בחמש פותחים.' : 'עוד אחת. השער נפתח בחמש, עם או בלי.'
}

/**
 * T01 · S1–S3 מתחת ליציע (27.9.2026, `gate5-stand`): שלוש עבודות — הדגלים, הבד, החבלים — וזמן
 * לשתיים; כשהשתיים נגמרו, או בחמש, השער נפתח (`t:open`) והחדר נבנה מחדש עם מה שנעשה ומה שלא
 * (`world/city2027/stadiumSide.ts`). ואז השאלה שהיציע תמיד שואל: מי עשה את זה (`t-credit`).
 */
export const T01_TASKS = ['flags', 'banner', 'rope'] as const
export const T01_GATE = at(17, 0)
/** how he answered "who did it" — read by Yevgeny in 2012 (`t-hand`) */
export const TERRACE_CREDIT = 'life:terrace:credit'
/** 2012 — whether he let Yevgeny's decision stand; read by Asaf in 2024 (`t-lead`) */
export const TERRACE_HANDOFF = 'life:terrace:handoff'

const T01_TWO: Condition = {
  any: [
    { all: [{ flag: 't:task:flags' }, { flag: 't:task:banner' }] },
    { all: [{ flag: 't:task:flags' }, { flag: 't:task:rope' }] },
    { all: [{ flag: 't:task:banner' }, { flag: 't:task:rope' }] },
  ],
}
const T01_ROLE: Condition = { flagIs: { flag: TERRACE_ROLE, value: 'active' } }

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
  blamed: {
    id: 'blamed',
    titleHe: 'מה שנשאר על הרצפה',
    bodyHe:
      'כששאלו מה לא נגמר, אמרת שם של מישהו אחר. זה היה נכון בחצי, וכולם שמעו את החצי השני. אסף לא אמר כלום. בערב הבא הוא נתן לך אותה עבודה, ועמד לידך עד שנגמרה.',
    memoryHe: 'חבל אחד, לא קשור.',
    memoryItem: 'folded-paper',
  },
  late: {
    id: 'late',
    titleHe: 'השער לא חיכה',
    bodyHe:
      'לקחת תפקיד, ובחמש השער נפתח בלעדיך. מלמד וארז סחבו את מה שהיה שלך, ואף אחד לא עשה מזה עניין. שאלת מי סחב, ואסף אמר: בפעם הבאה — אתה. זה לא היה עונש. זה היה תור.',
    memoryHe: 'דגל שמישהו אחר העלה.',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_TERRACE01: Beat[] = [
  { id: 't-first', at: 'gate5', trigger: 'enter', when: { none: [{ flag: 't:first' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 't-first' }] },
  // S1 — under the stand: three jobs, time for two, and the gate at five
  {
    id: 't-prep',
    at: 'gate5-stand',
    trigger: 'enter',
    when: { all: [{ flag: 't:first' }, T01_ROLE], none: [{ flag: 't:prep' }, { flag: 't:open' }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: 't:prep' },
      {
        a: 'lines',
        lines: [
          { who: null, text: 'מתחת ליציע. ריח של צבע ושל בטון רטוב. הדגלים עוד על הגדר, הבד על הרצפה עם שלוש אותיות חסרות, והחבלים על הקיר.' },
          { who: 'אסף', text: 'בחמש פותחים. שלוש עבודות, ויש לך זמן לשתיים. תבחר, ותגמור מה שבחרת.' },
        ],
      },
    ],
  },
  // S3 — the gate opens: two jobs done, or five o'clock came first. The room is rebuilt with it.
  {
    id: 't-gate',
    at: 'gate5-stand',
    trigger: 'clock',
    when: { all: [{ flag: 't:first' }, T01_ROLE, { any: [T01_TWO, { afterMinute: T01_GATE }] }], none: [{ flag: 't:open' }] },
    delayMs: 900,
    do: [
      { a: 'flag', flag: 't:open' },
      { a: 'crowd', state: 'CHANT' },
      { a: 'card', titleHe: 'חמש', subHe: 'השער נפתח', ms: 2000 },
      { a: 'travel', to: 'gate5-stand', spawn: 'stairs' },
    ],
  },
  // and a man who never went in: the gate opens without him, and he is carried down the stairs by it
  {
    id: 't-gate-late',
    at: 'gate5',
    trigger: 'clock',
    when: { all: [{ flag: 't:first' }, T01_ROLE, { afterMinute: T01_GATE + 15 }], none: [{ flag: 't:open' }] },
    do: [
      { a: 'flag', flag: 't:open' },
      { a: 'flag', flag: 't:late' },
      { a: 'toast', text: 'חמש ורבע. השער נפתח בלעדיך — מישהו אחר סחב את מה שהיה שלך.', tone: 'red' },
      { a: 'travel', to: 'gate5-stand', spawn: 'stairs' },
    ],
  },
  {
    id: 't-open',
    at: 'gate5-stand',
    trigger: 'enter',
    when: { all: [{ flag: 't:open' }], none: [{ flag: 't:credit' }] },
    delayMs: 1400,
    do: [{ a: 'talk', conversation: 't-credit' }],
  },
]

// ================================================================ T02 · 2012 ====

export function objectiveTerrace02(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  const f = state.flags
  if (!f['t:hand']) return sceneId === 'gate5-stand' ? 'יבגני ליד המדרגות.' : 'שער 5, מתחת ליציע. יבגני רוצה להוביל — באמת.'
  if (!f['t:test']) return 'הדגל הגדול. מה יבגני מחליט — ומה אתה עושה עם זה.'
  return null
}

/** the two modes Yevgeny's first decision is tested under (the handover closes at once) */
const T02_TESTED: Condition = { any: [{ flagIs: { flag: 't:mode', value: 'trust' } }, { flagIs: { flag: 't:mode', value: 'small' } }] }

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
  stepped: {
    id: 'stepped',
    titleHe: 'הדגל על המעקה',
    bodyHe:
      'נתת לו סמכות, ובהחלטה הראשונה שלו נכנסת. הדגל עלה למעקה, כמו תמיד, ויבגני לא התווכח. זה היה נכון על הדגל ולא נכון על יבגני — ושניכם ידעתם את זה עוד לפני שהשער נפתח.',
    memoryHe: 'דף גבולות, עם סעיף אחד מחוק.',
    memoryItem: 'folded-paper',
  },
}

export const BEATS_TERRACE02: Beat[] = [
  // S1 — Yevgeny does not come out to ask; he waits by the stairs, under the stand
  {
    id: 't-hand-wait',
    at: 'gate5',
    trigger: 'enter',
    when: { none: [{ flag: 't:hand' }, { flag: 't:waited' }] },
    delayMs: 700,
    do: [{ a: 'flag', flag: 't:waited' }, { a: 'toast', text: 'יבגני לא בחוץ. הוא מחכה מתחת ליציע, ליד המדרגות — ולא יבוא לבקש.', tone: 'plain' }],
  },
  // S3 — the test: somebody else makes a small decision while he watches
  {
    id: 't-test',
    at: 'gate5-stand',
    trigger: 'clock',
    when: { all: [{ flag: 't:hand' }, T02_TESTED], none: [{ flag: 't:test' }] },
    delayMs: 1800,
    do: [{ a: 'actorCue', actorId: 'stand-yevgeny', cue: 'gesture' }, { a: 'talk', conversation: 't-test' }],
  },
  // the consequence is seen: the room is rebuilt with the flag where it ended up, then the day closes
  {
    id: 't-test-seen',
    at: 'gate5-stand',
    trigger: 'clock',
    when: { all: [{ flag: 't:test' }], none: [{ flag: 't:seen' }] },
    delayMs: 1200,
    do: [{ a: 'flag', flag: 't:seen' }, { a: 'card', titleHe: 'חמש', subHe: 'השער נפתח', ms: 1800 }, { a: 'travel', to: 'gate5-stand', spawn: 'stairs' }],
  },
  {
    id: 't-close-let',
    at: 'gate5-stand',
    trigger: 'enter',
    when: { all: [{ flag: 't:seen' }, { flagIs: { flag: 't:mode', value: 'trust' } }, { flagIs: { flag: TERRACE_HANDOFF, value: 'let' } }] },
    delayMs: 1600,
    do: [
      { a: 'lines', lines: [{ who: null, text: 'הדגל הגדול על הקיר, לא על המעקה. המדרגות פנויות, והזרם עולה בלי להיתקע. זה לא איך שאתה היית עושה. זה עובד.' }] },
      { a: 'ending', id: 'trust' },
    ],
  },
  {
    id: 't-close-small',
    at: 'gate5-stand',
    trigger: 'enter',
    when: { all: [{ flag: 't:seen' }, { flagIs: { flag: 't:mode', value: 'small' } }] },
    delayMs: 1600,
    do: [{ a: 'lines', lines: [{ who: null, text: 'שניכם מחזיקים את הקצוות של הדגל, ואחד מכם מחליט איפה הוא נתלה. קטן, ומבוצע.' }] }, { a: 'ending', id: 'small' }],
  },
  {
    id: 't-close-stepped',
    at: 'gate5-stand',
    trigger: 'enter',
    when: { all: [{ flag: 't:seen' }, { flagIs: { flag: 't:mode', value: 'trust' } }, { flagIs: { flag: TERRACE_HANDOFF, value: 'stepped' } }] },
    delayMs: 1600,
    do: [{ a: 'lines', lines: [{ who: null, text: 'הדגל על המעקה, כמו תמיד. הזרם נתקע עליו שנייה בכל מדרגה. יבגני מחזיק את הקצה ולא מסתכל עליך.' }] }, { a: 'ending', id: 'stepped' }],
  },
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

const T_HAND_CHOICES: ChoiceDef[] = [
  {
    id: 'trust',
    text: '(לתת לו סמכות — ולסכם גבולות מראש.)',
    // the commit (27.9.2026): whether he meant it is tested on the stairs (`t-test`)
    then: [
      { e: 'flag', flag: 't:hand' },
      { e: 'flagValue', flag: 't:mode', value: 'trust' },
      { e: 'time', minutes: 20 },
      { e: 'rel', who: 'yevgeny', axis: 'trust', delta: 3 },
      { e: 'toast', text: 'יבגני: "אז מהרגע הזה אני מחליט. גם על הדגל הגדול."', tone: 'plain' },
    ],
  },
  {
    id: 'small',
    text: '(לנהל יחד תפקיד מצומצם יותר.)',
    then: [
      { e: 'flag', flag: 't:hand' },
      { e: 'flagValue', flag: 't:mode', value: 'small' },
      { e: 'time', minutes: 20 },
      { e: 'energy', delta: -10 },
      { e: 'toast', text: 'אסף: "קטן ומבוצע עדיף מגדול שמחכה לך." — "מסכים."', tone: 'plain' },
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
]

const T_LEAD_CHOICES: ChoiceDef[] = [
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
]

/**
 * ------------------------------------------ T01 · מתחת ליציע, והשער שנפתח (27.9.2026) ---
 *
 * The proof of a role is written when the gate opens and he answers for the work — not when he
 * says yes to Asaf. Which proof and which ending follow the role he took (`t:kind`); what he said
 * about who did it is `life:terrace:credit`, and Yevgeny remembers it in 2012 (`t-hand`).
 */
const T01_PROOF: Record<'gear' | 'people', Effect[]> = {
  gear: [
    { e: 'skill', skill: 'organization', delta: 3, why: 'החזיר ציוד מסודר, והראה לבא איפה הכול' },
    { e: 'proof', kind: 'leadership_proof', proofId: 'leadership_proof:{chapter}:gear', subjectHe: 'הציוד של היציע', audience: 'gate5', delta: 4, noteHe: 'תפקיד הכנה שנלקח עד הסוף, וציוד שחזר מסודר.' },
    { e: 'heard', proofId: 'leadership_proof:{chapter}:gear' },
  ],
  people: [
    // `mediation` בתסריט → `communication` במנוע
    { e: 'skill', skill: 'communication', delta: 3, why: 'וידא שכל אחד אישר, אחד אחד' },
    { e: 'proof', kind: 'leadership_proof', proofId: 'leadership_proof:{chapter}:volunteers', subjectHe: 'המתנדבים של הערב', audience: 'gate5', delta: 4, noteHe: 'כל מי שאמר שיהיה — היה, כי מישהו שאל אותו.' },
    { e: 'heard', proofId: 'leadership_proof:{chapter}:volunteers' },
  ],
}

const KIND = (kind: 'gear' | 'people'): Condition => ({ all: [{ flagIs: { flag: 't:kind', value: kind } }], none: [{ flag: 't:late' }] })

function creditChoices(): ChoiceDef[] {
  const out: ChoiceDef[] = []
  for (const kind of ['gear', 'people'] as const) {
    out.push(
      {
        id: `took-${kind}`,
        text: '"אני."',
        when: KIND(kind),
        hidden: true,
        then: [
          { e: 'flag', flag: 't:credit' },
          { e: 'flagValue', flag: TERRACE_CREDIT, value: 'took' },
          ...T01_PROOF[kind],
          { e: 'rel', who: 'melamed', axis: 'tension', delta: 3 },
          { e: 'toast', text: 'מלמד, מהמדרגה העליונה: "אתה. בטח." אסף לא אמר כלום.', tone: 'plain' },
          { e: 'ending', id: kind },
        ],
      },
      {
        id: `shared-${kind}`,
        text: '"כולנו. ארז הביא את הצבע, מלמד את הסולם."',
        when: KIND(kind),
        hidden: true,
        then: [
          { e: 'flag', flag: 't:credit' },
          { e: 'flagValue', flag: TERRACE_CREDIT, value: 'shared' },
          ...T01_PROOF[kind],
          { e: 'rel', who: 'asaf', axis: 'trust', delta: 3 },
          { e: 'redheart', key: 'community', delta: 2 },
          { e: 'toast', text: 'ארז: "עכשיו תראה למי הבא איפה הכול." — "לא שומרים ידע רק בשביל שיצטרכו אותי."', tone: 'plain' },
          { e: 'ending', id: kind },
        ],
      },
      {
        id: `quiet-${kind}`,
        text: '(לשתוק, ולהמשיך לסחוב.)',
        when: KIND(kind),
        hidden: true,
        then: [
          { e: 'flag', flag: 't:credit' },
          { e: 'flagValue', flag: TERRACE_CREDIT, value: 'quiet' },
          ...T01_PROOF[kind],
          { e: 'toast', text: 'אף אחד לא שאל שוב. בסוף הערב אסף נתן לך את המפתח של הארגז.', tone: 'plain' },
          { e: 'ending', id: kind },
        ],
      },
    )
  }
  out.push(
    {
      id: 'blamed',
      text: '"מלמד היה אמור לגמור את מה שנשאר."',
      when: { none: [{ flag: 't:late' }] },
      hidden: true,
      then: [
        { e: 'flag', flag: 't:credit' },
        { e: 'flagValue', flag: TERRACE_CREDIT, value: 'blamed' },
        { e: 'rel', who: 'melamed', axis: 'tension', delta: 6 },
        { e: 'repLoss', audience: 'gate5', delta: -3, why: 'הפיל על אחר את מה שלא נגמר' },
        { e: 'toast', text: 'מלמד לא ענה. הוא ירד, הרים את מה שנשאר, והלך איתו למעלה.', tone: 'red' },
        { e: 'ending', id: 'blamed' },
      ],
    },
    {
      id: 'absent',
      text: '"לא הייתי פה. מי סחב?"',
      when: { flag: 't:late' },
      hidden: true,
      then: [
        { e: 'flag', flag: 't:credit' },
        { e: 'flagValue', flag: TERRACE_CREDIT, value: 'absent' },
        { e: 'rel', who: 'asaf', axis: 'trust', delta: 1 },
        { e: 'toast', text: 'אסף: "מלמד וארז. בפעם הבאה — אתה."', tone: 'plain' },
        { e: 'ending', id: 'late' },
      ],
    },
  )
  return out
}

/** S2 — the banner is made by hand: a stencil that is slow and straight, or a brush that is fast */
const T_BANNER_CHOICES: ChoiceDef[] = [
  {
    id: 'stencil',
    text: '(לגזור שבלונה, להניח, ולצבוע אות אחרי אות.)',
    then: [
      { e: 'flag', flag: 't:task:banner' },
      { e: 'flagValue', flag: 't:banner', value: 'stencil' },
      { e: 'time', minutes: 25 },
      { e: 'energy', delta: -8 },
      { e: 'toast', text: 'שלוש אותיות, ישרות כמו בדפוס. הצבע עוד רטוב כשמרימים.', tone: 'plain' },
    ],
  },
  {
    id: 'brush',
    text: '(ביד חופשית, מהר — שיתייבש עד חמש.)',
    then: [
      { e: 'flag', flag: 't:task:banner' },
      { e: 'flagValue', flag: 't:banner', value: 'brush' },
      { e: 'time', minutes: 12 },
      { e: 'energy', delta: -4 },
      { e: 'toast', text: 'האות האחרונה עקומה קצת. מרחוק, מהיציע ממול, אף אחד לא יראה.', tone: 'plain' },
    ],
  },
]

/** T02 · S3 — Yevgeny's first decision, and whether it stands */
const LET_PROOF: Record<'trust' | 'small', Effect[]> = {
  trust: [
    { e: 'skill', skill: 'organization', delta: 5, why: 'האציל סמכות אמיתית, ולא נכנס בהחלטה הראשונה' },
    { e: 'proof', kind: 'leadership_proof', proofId: 'leadership_proof:{chapter}:delegated', subjectHe: 'הסמכות שנתתי ליבגני', audience: 'gate5', delta: 4, noteHe: 'ציוד, מידע ותנאי החלטה — ואת ההחלטה הראשונה השארתי לו.' },
    { e: 'heard', proofId: 'leadership_proof:{chapter}:delegated' },
  ],
  small: [
    { e: 'skill', skill: 'organization', delta: 3, why: 'קטן ומבוצע' },
    { e: 'proof', kind: 'leadership_proof', proofId: 'leadership_proof:{chapter}:shared', subjectHe: 'התפקיד שהוקטן', audience: 'gate5', delta: 4, noteHe: 'תפקיד מצומצם שבוצע, במקום גדול שחיכה.' },
    { e: 'heard', proofId: 'leadership_proof:{chapter}:shared' },
  ],
}

function testChoices(): ChoiceDef[] {
  const out: ChoiceDef[] = []
  for (const mode of ['trust', 'small'] as const) {
    const when: Condition = { flagIs: { flag: 't:mode', value: mode } }
    out.push(
      {
        id: `let-${mode}`,
        text: '(לתת לזה לעמוד.)',
        when,
        hidden: true,
        then: [
          { e: 'flag', flag: 't:test' },
          { e: 'flagValue', flag: TERRACE_HANDOFF, value: 'let' },
          ...LET_PROOF[mode],
          { e: 'rel', who: 'yevgeny', axis: 'trust', delta: 3 },
          { e: 'toast', text: 'יבגני: "עכשיו אני יודע מתי להחליט ומתי להתקשר." — "ואני יודע מתי לא להפריע."', tone: 'plain' },
        ],
      },
      {
        id: `step-${mode}`,
        text: '"על המעקה. כמו תמיד."',
        when,
        hidden: true,
        then: [
          { e: 'flag', flag: 't:test' },
          { e: 'flagValue', flag: TERRACE_HANDOFF, value: 'stepped' },
          ...(mode === 'small' ? LET_PROOF.small : []),
          { e: 'rel', who: 'yevgeny', axis: 'trust', delta: -4 },
          { e: 'toast', text: 'יבגני לא התווכח. הוא הרים את הקצה ועלה.', tone: 'red' },
        ],
      },
    )
  }
  return out
}

const T_EXTRA: Conversation[] = [
  {
    id: 't-task-flags',
    nameHe: null,
    branches: [
      {
        when: { flagIs: { flag: 't:kind', value: 'people' } },
        lines: [
          { who: null, text: 'אתה לא סוחב. אתה מתקשר לשניים שאמרו שיבואו, ואחד מהם באמת בא. שישה דגלים, שלוש עליות, ואתה סופר אותם למעלה.' },
        ],
        then: [{ e: 'flag', flag: 't:task:flags' }, { e: 'time', minutes: 20 }, { e: 'energy', delta: -3 }, { e: 'toast', text: 'הדגלים למעלה. השני שלא בא — שלח הודעה בשש.', tone: 'plain' }],
      },
      {
        lines: [
          { who: null, text: 'שישה דגלים על הגדר, כל אחד כבד מכפי שהוא נראה. שלוש עליות במדרגות, שניים בכל פעם, והמעקה החלוד תחת היד.' },
        ],
        then: [{ e: 'flag', flag: 't:task:flags' }, { e: 'time', minutes: 20 }, { e: 'energy', delta: -10 }, { e: 'toast', text: 'הדגלים למעלה. הכתפיים יזכרו את זה מחר.', tone: 'plain' }],
      },
    ],
  },
  {
    id: 't-task-banner',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הבד על הרצפה. "הפועל" כבר שם, ושלוש אותיות בסוף עוד חסרות. פח צבע אדום אחד, שני מכחולים, ודף קרטון.' },
        ],
        choices: T_BANNER_CHOICES,
      },
    ],
  },
  {
    id: 't-task-rope',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'החבלים על הקיר. למעלה, בראש המדרגות, המעקה שהבד נקשר אליו כל שבת. קשר כפול, ועוד אחד ליתר ביטחון — כמו שאסף לימד מישהו פעם.' },
        ],
        then: [{ e: 'flag', flag: 't:task:rope' }, { e: 'time', minutes: 20 }, { e: 'energy', delta: -6 }, { e: 'toast', text: 'המעקה קשור. כשהבד יעלה, יהיה לו במה להיאחז.', tone: 'plain' }],
      },
    ],
  },
  {
    id: 't-credit',
    nameHe: 'אסף',
    branches: [
      {
        when: { flag: 't:late' },
        lines: [
          { who: null, text: 'השער פתוח. הזרם עולה במדרגות, ואתה עומד בתחתית כמו מי שהגיע לבד.' },
          { who: 'אסף', text: 'הדגלים עלו. מישהו אחר סחב.' },
        ],
        choices: creditChoices(),
      },
      {
        when: { flag: 't:task:banner' },
        lines: [
          { who: null, text: 'השער נפתח. הזרם עולה במדרגות, צעיפים ורעש, והבד שצבעת כבר על הקיר.' },
          { who: 'אסף', text: 'מי עשה את זה?' },
        ],
        choices: creditChoices(),
      },
      {
        lines: [
          { who: null, text: 'השער נפתח. הזרם עולה במדרגות, והבד עוד מגולגל על הרצפה עם שלוש אותיות חסרות. מה שלא נגמר — לא נגמר.' },
          { who: 'אסף', text: 'אז מה נגמר, ומי עשה אותו?' },
        ],
        choices: creditChoices(),
      },
    ],
  },
  {
    id: 't-test',
    nameHe: 'יבגני',
    branches: [
      {
        lines: [
          { who: null, text: 'סדרן יורד במדרגות עם הדגל הגדול מגולגל על הכתף, ושואל את החלל: על המעקה או על הקיר?' },
          { who: 'יבגני', text: 'על הקיר. על המעקה הוא חוסם את המדרגות.' },
          { who: null, text: 'תמיד הוא היה על המעקה. אתה תלית אותו שם שתים־עשרה שנה. יבגני לא מסתכל עליך.' },
        ],
        choices: testChoices(),
      },
    ],
  },
]

export const CONVERSATIONS_CAREER: Conversation[] = [
  ...T_EXTRA,
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
            // the commit (27.9.2026): the work itself is under the stand (`gate5-stand`), and the
            // proof is written when the gate opens and he answers for it (`t-credit`)
            then: [
              { e: 'flag', flag: 't:first' },
              { e: 'flagValue', flag: TERRACE_ROLE, value: 'active' },
              { e: 'flagValue', flag: 't:kind', value: 'gear' },
              { e: 'toast', text: 'אסף: "מתחת ליציע, דרך הקרוסלות. בחמש פותחים."', tone: 'plain' },
            ],
          },
          {
            id: 'people',
            text: '(לתאם מתנדבים — במקום עבודה פיזית.)',
            then: [
              { e: 'flag', flag: 't:first' },
              { e: 'flagValue', flag: TERRACE_ROLE, value: 'active' },
              { e: 'flagValue', flag: 't:kind', value: 'people' },
              { e: 'toast', text: 'יבגני: "תוודא שכל אחד אישר, לא רק נקרא בקבוצה. כולם מתחת ליציע."', tone: 'plain' },
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
        // what he said in 2001 when the gate opened (`t-credit`) — Yevgeny was there
        when: { flagIs: { flag: TERRACE_CREDIT, value: 'took' } },
        lines: [
          { who: 'יבגני', text: 'ב־2001, כששאלו מי תלה את הבד, אמרת "אני".' },
          { who: 'פוגי', text: 'תלינו כמה.' },
          { who: 'יבגני', text: 'אז היום אני רוצה שישאלו אותי. ואם אני מחליט, אני מחליט גם כשזה לא איך שאתה עושה.' },
          { who: 'אסף', text: 'אז בשביל זה אנחנו פה.' },
        ],
        choices: T_HAND_CHOICES,
      },
      {
        lines: [
          { who: 'יבגני', text: 'אם אתה נותן לי להוביל, אני מחליט חלק מהדברים.' },
          { who: 'פוגי', text: 'ברור.' },
          { who: 'יבגני', text: 'גם אם זה לא בדיוק איך שאתה עושה.' },
          { who: 'פוגי', text: 'לזה הגעתי קצת פחות מוכן.' },
          { who: 'אסף', text: 'אז בשביל זה אנחנו פה.' },
        ],
        choices: T_HAND_CHOICES,
      },
    ],
  },
  {
    id: 't-lead',
    nameHe: 'אסף',
    branches: [
      {
        // 2012, on the gate-5 stairs: he let Yevgeny's first decision stand (`t-test`)
        when: { flagIs: { flag: TERRACE_HANDOFF, value: 'let' } },
        lines: [
          { who: 'אסף', text: 'תראה אותם.' },
          { who: 'אסף', text: 'ב־2012 נתת ליבגני להחליט על הדגל, ולא נכנסת. הוא עוד מספר את זה לחדשים.' },
          { who: 'פוגי', text: 'הוא צדק על הדגל.' },
          { who: 'אסף', text: 'לא בגלל הדגל הוא מספר. היום אני עוזר לך.' },
        ],
        choices: T_LEAD_CHOICES,
      },
      {
        when: { flagIs: { flag: TERRACE_HANDOFF, value: 'stepped' } },
        lines: [
          { who: 'אסף', text: 'תראה אותם.' },
          { who: 'אסף', text: 'ב־2012 נכנסת ליבגני בהחלטה הראשונה שלו. הם זוכרים את זה יותר ממה שאתה חושב.' },
          { who: 'פוגי', text: 'אז?' },
          { who: 'אסף', text: 'אז היום תסביר, ותשאיר להם מקום לטעות. אני עוזר לך.' },
        ],
        choices: T_LEAD_CHOICES,
      },
      {
        lines: [
          { who: 'אסף', text: 'תראה אותם.' },
          { who: 'פוגי', text: 'מה?' },
          { who: 'אסף', text: 'מחכים שתסביר מה עושים.' },
          { who: 'פוגי', text: 'חשבתי שאתה מסביר.' },
          { who: 'אסף', text: 'היום אני עוזר לך.' },
        ],
        choices: T_LEAD_CHOICES,
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
