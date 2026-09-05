/**
 * הרשימה — one clear objective, and the steps under it, discovered one at a time.
 *
 * The red cloth says the shape of the day in one line and never gives an instruction.
 * Under the "?" the player finds this: the steps of the day as a list, but a list that
 * GROWS — a step appears only once the world has shown it (a name heard, a door seen, a
 * flag raised) and is ticked once it is done. Nothing is spelled out in advance, nothing
 * is a waiting task, and a player who never opens the sheet loses nothing: the world
 * itself is the checklist.
 *
 * Every step is two conditions on the state (`revealWhen`, `doneWhen`), which are the
 * same `Condition` shape doors and beats use, so `tests/life-checklist.test.ts` can walk
 * a chapter's flags and watch the list grow and tick without a browser.
 */
import { meets, type Condition } from './world/types'
import type { LifeState } from './types'

export type ChecklistStep = {
  id: string
  textHe: string
  /** the step shows only once this holds; omit for a step known from the first minute */
  revealWhen?: Condition
  /** ticked once this holds */
  doneWhen: Condition
}

export type ChecklistItem = { id: string; textHe: string; done: boolean }

const F = (flag: string): Condition => ({ flag })
const ANY = (...flags: string[]): Condition => ({ any: flags.map((flag) => ({ flag })) })

export const CHECKLISTS: Record<string, readonly ChecklistStep[]> = {
  '1986': [
    { id: 'key', textHe: 'המפתח. במגירה.', doneWhen: { hasItem: 'house-key' } },
    { id: 'dad', textHe: 'לדבר עם אבא.', revealWhen: { hasItem: 'house-key' }, doneWhen: F('knows:match') },
    { id: 'east', textHe: 'לרחוב. אחרי האנשים, מזרחה.', revealWhen: F('kobi:left'), doneWhen: ANY('entry:granted', 'entry:ticket') },
    { id: 'gate', textHe: 'שער 7. להיכנס.', revealWhen: F('kobi:left'), doneWhen: F('entry:granted') },
    { id: 'match', textHe: 'המשחק.', revealWhen: F('entry:granted'), doneWhen: F('match:over') },
    { id: 'kobi', textHe: 'למצוא את אבא.', revealWhen: F('saw:goal'), doneWhen: F('found:kobi') },
  ],
  '1990': [
    { id: 'math', textHe: 'להבין כמה צריך היום.', doneWhen: F('knows:math') },
    { id: 'go', textHe: 'לצאת. מזרחה.', revealWhen: F('kobi:left'), doneWhen: ANY('entry:granted', 'entry:ticket', 'saw:goal') },
    { id: 'gate', textHe: 'שער 7. אבא, או כרטיס, או חצי־שער.', revealWhen: F('kobi:left'), doneWhen: ANY('entry:granted', 'entry:ticket') },
    { id: 'kobi', textHe: 'למצוא את אבא.', revealWhen: F('entry:granted'), doneWhen: F('found:kobi') },
    { id: 'home', textHe: 'הביתה.', revealWhen: F('found:kobi'), doneWhen: F('walked:home') },
  ],
  '1991': [
    { id: 'school', textHe: 'בית ספר. עד הצלצול.', doneWhen: F('school:done') },
    { id: 'hw', textHe: 'שיעורי בית — או משהו שנראה כמו.', revealWhen: F('hw:given'), doneWhen: ANY('hw:done', 'hw:half', 'hw:faked') },
    { id: 'permission', textHe: 'רשות מאמא. או דרך אחרת.', revealWhen: ANY('hw:done', 'hw:half', 'hw:faked'), doneWhen: ANY('permission:yes', 'sneak:ready') },
    { id: 'hall', textHe: 'אוסישקין. הדלת.', revealWhen: ANY('permission:yes', 'sneak:ready'), doneWhen: F('spot:asked') },
    { id: 'derby', textHe: 'הדרבי.', revealWhen: F('spot:asked'), doneWhen: F('derby:over') },
    { id: 'home', textHe: 'הביתה. לפני שמישהו שם לב.', revealWhen: F('derby:over'), doneWhen: F('walked:home') },
  ],
  '1993-cup': [
    { id: 'money', textHe: 'כסף לאוטובוס.', doneWhen: ANY('money:enough', 'route:tv') },
    { id: 'route', textHe: 'עם מי נוסעים — אפי, אופיר, או הטלוויזיה.', revealWhen: F('money:enough'), doneWhen: ANY('route:efi', 'route:ofir', 'route:tv') },
    { id: 'corner', textHe: 'הפינה של אוסישקין לפני שש.', revealWhen: ANY('route:efi', 'route:ofir'), doneWhen: F('on:bus') },
    { id: 'final', textHe: 'הגמר.', revealWhen: ANY('on:bus', 'route:tv'), doneWhen: F('final:over') },
    { id: 'home', textHe: 'הביתה.', revealWhen: F('final:over'), doneWhen: F('walked:home') },
  ],
  '1993-galil': [
    { id: 'g1', textHe: 'משחק 1. האולם.', doneWhen: F('life:galil:d2') },
    { id: 'g2', textHe: 'משחק 2. הרדיו.', revealWhen: F('life:galil:d2'), doneWhen: F('life:galil:d3') },
    { id: 'g3', textHe: 'משחק 3. האולם.', revealWhen: F('life:galil:d3'), doneWhen: F('life:galil:d4') },
    { id: 'g4', textHe: 'המשחק המכריע. בצפון. איך מגיעים?', revealWhen: F('life:galil:d4'), doneWhen: F('g4:decided') },
    { id: 'after', textHe: 'הפינה. אחרי.', revealWhen: F('life:galil:after'), doneWhen: F('after:done') },
  ],
  '1995-sinai': [
    { id: 'radio', textHe: 'הרדיו אצל רפי.', doneWhen: F('s1:heard') },
    { id: 'argue', textHe: 'להגיד מה אתה מרגיש.', revealWhen: F('s1:heard'), doneWhen: F('s1:argued') },
    { id: 'poster', textHe: 'הפוסטר על הקיר.', revealWhen: F('s1:argued'), doneWhen: F('life:sinai:d2') },
    { id: 'facts', textHe: 'הקיוסק. העובדות.', revealWhen: F('life:sinai:d2'), doneWhen: F('s2:done') },
  ],
  '1996-army': [
    { id: 'pack', textHe: 'לארוז. להיפרד.', doneWhen: F('a1:packed') },
    { id: 'gate', textHe: 'שער 7 או שער 5. לבחור איפה עומדים.', revealWhen: F('life:army:d2'), doneWhen: F('a2:chose') },
    { id: 'bus', textHe: 'האוטובוס ברציף. להסתכל טוב.', revealWhen: F('life:army:d3'), doneWhen: F('a3:decided') },
    { id: 'road', textHe: 'האוטו של לירון.', revealWhen: F('life:army:d4'), doneWhen: F('a4:road') },
  ],
  '1997-basket': [
    { id: 'corner', textHe: 'שחור, לימור, פרדי. בפינה.', doneWhen: ANY('h1:crates', 'h1:decided') },
    { id: 'choose', textHe: 'האולם — או בלומפילד. לא שניהם.', revealWhen: ANY('h1:crates', 'h1:decided'), doneWhen: F('h1:decided') },
    { id: 'after', textHe: 'שנה אחרי. אותו אולם.', revealWhen: F('life:hall:d2'), doneWhen: F('h2:done') },
  ],
  '1998-laces': [
    { id: 'dad', textHe: 'אבא זהיר. להגיד לו משהו.', doneWhen: ANY('l1:match', 'l1:after') },
    { id: 'ground', textHe: 'בלומפילד לפני חמש.', revealWhen: F('life:laces:d1'), doneWhen: ANY('l1:match', 'l1:after') },
    { id: 'match', textHe: 'המשחק. ומה שקורה במקום אחר.', revealWhen: F('l1:match'), doneWhen: F('l1:inside') },
    { id: 'class', textHe: 'יום ראשון. שיעור.', revealWhen: F('life:laces:d2'), doneWhen: F('l2:done') },
  ],
  '1999-basket': [
    { id: 'corner', textHe: 'שחור וסוקו בפינה.', doneWhen: F('seed:opened') },
    { id: 'hall', textHe: 'לעבוד באולם. לשאול למה.', revealWhen: F('seed:opened'), doneWhen: F('seed:hall') },
    { id: 'kiosk', textHe: 'הקיוסק. מי יושב שם.', revealWhen: F('seed:hall'), doneWhen: F('seed:list') },
  ],
  '1999-cup': [
    { id: 'route', textHe: 'עם מי נוסעים לרמת גן.', doneWhen: F('c99:route') },
    { id: 'ground', textHe: 'רמת גן. שמונה.', revealWhen: F('c99:route'), doneWhen: F('c99:over') },
  ],
  '2000-title': [
    { id: 'route', textHe: 'איך מגיעים לשכונת התקווה — ועם מי.', doneWhen: F('t:route') },
    { id: 'ground', textHe: 'המגרש. שלוש.', revealWhen: F('t:route'), doneWhen: F('t:over') },
  ],
  '2000-double': [
    { id: 'days', textHe: 'ארבעה ימים. שני דברים. לא יותר.', doneWhen: F('d:final') },
    { id: 'final', textHe: 'רמת גן. הגמר.', revealWhen: F('d:final'), doneWhen: F('d:over') },
    { id: 'walk', textHe: 'החוצה. מי לידך.', revealWhen: F('d:over'), doneWhen: F('d:walked') },
  ],
  'a2-alley': [
    { id: 'mom', textHe: 'אמא רוצה משהו.', doneWhen: F('a2:errand') },
    { id: 'bread', textHe: 'לחם מהקיוסק.', revealWhen: F('a2:errand'), doneWhen: F('a2:bread') },
    { id: 'alley', textHe: 'הסמטה. לפני שהקבוצות מלאות.', revealWhen: F('a2:errand'), doneWhen: ANY('a2:played', 'a2:late') },
  ],
  'a3-hall': [
    { id: 'efi', textHe: 'אפי אמר שיש משהו אחרי הקיר.', doneWhen: F('a3:inside') },
  ],
  'a4-shirt': [
    { id: 'tin', textHe: 'הקופה מתחת למיטה.', doneWhen: F('a4:tin') },
    { id: 'earn', textHe: 'בקבוקים, שליחויות, מה שאבא נותן.', revealWhen: F('a4:tin'), doneWhen: ANY('a4:worked', 'a4:kobi', 'own:shirt85') },
    { id: 'shirt', textHe: 'רפי סוגר בשבע.', revealWhen: F('a4:tin'), doneWhen: ANY('own:shirt85', 'a4:gave') },
  ],
  'a5-first': [
    { id: 'dress', textHe: 'להתלבש לבד.', doneWhen: F('a5:dressed') },
    { id: 'gate', textHe: 'שער 7. אבא.', revealWhen: F('a5:dressed'), doneWhen: F('a5:there') },
  ],
  'a6-radio': [
    { id: 'radio', textHe: 'יש רדיו.', doneWhen: ANY('a6:radio-dead', 'a6:heard') },
    { id: 'liron', textHe: 'לירון ברחוב מתקן רדיו.', revealWhen: F('a6:radio-dead'), doneWhen: F('a6:heard') },
  ],
  'a7-week': [
    { id: 'hear', textHe: 'ברחוב מדברים על שבת הבאה.', doneWhen: F('a7:knows') },
    { id: 'dad', textHe: 'אבא. לשאול.', revealWhen: F('a7:knows'), doneWhen: F('a7:refused') },
  ],
}

/** the steps the player has discovered, in order, each with its tick */
export function checklistFor(state: LifeState): ChecklistItem[] {
  const steps = CHECKLISTS[state.chapter] ?? []
  const out: ChecklistItem[] = []
  for (const step of steps) {
    const done = meets(state, step.doneWhen)
    // a step that is done is known by definition; otherwise it must have been revealed
    if (!done && step.revealWhen && !meets(state, step.revealWhen)) continue
    out.push({ id: step.id, textHe: step.textHe, done })
  }
  return out
}

/** the step the player is on now — the first discovered, undone one */
export function nextStep(state: LifeState): ChecklistItem | null {
  return checklistFor(state).find((item) => !item.done) ?? null
}

/** every chapter id that has a list, for the tests */
export const CHECKLIST_CHAPTERS = Object.keys(CHECKLISTS)

