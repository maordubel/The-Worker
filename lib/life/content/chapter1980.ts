import type { ItemId, PlayerIdentity } from '../types'

import type { Say } from './script'

/**
 * 1980 — the chapter's frame: what the player is told at the start, what they are left
 * with at the end, and what the things in their pockets are called.
 *
 * The prologue is 1972 and it is a MEMORY, not a match report. It carries one canonical
 * fact — the cup the club won that season, resolved from the archive and handed in as an
 * anchor — and everything around it is a child's-eye impression of a father who was
 * young once. No score, no opponent, no scorer: see `content/script.ts`.
 */

/**
 * מי אתה, עד שתבחר.
 *
 * The architecture supports a name and a boy/girl choice (brief §9) and Stage 1 does not
 * ask for either — a character creator before the game is proven is the wrong order of
 * work. The default lives here, in the content layer, because "הילד" is a piece of
 * writing rather than a piece of interface: the day the chooser exists, this becomes its
 * placeholder value and nothing else changes.
 */
export const DEFAULT_IDENTITY: PlayerIdentity = { name: 'הילד', sex: 'boy', birthYear: 1972 }

/** `{anchor}` is filled from the canonical anchor's headline; nothing else is. */
export const PROLOGUE: Say[] = [
  { who: null, text: 'תל אביב. 1972.' },
  { who: null, text: 'גבר בן עשרים ושתיים עומד ביציע, בין אלפי אנשים שלא מכירים אותו.' },
  { who: null, text: 'הוא לא יודע שעוד שמונה שנים יהיה לו ילד שישאל אותו למה הוא צועק ככה.' },
  { who: null, text: '{anchor}' },
  { who: null, text: 'הוא לא זוכר את הדרך הביתה באותו לילה.' },
  { who: null, text: 'אבל הוא זוכר את הרגע הזה כל חייו — וזה מה שהוא ינסה להסביר לך.' },
  { who: null, text: '· · ·' },
  { who: null, text: 'דרום תל אביב. שבת, 1980.' },
  { who: null, text: 'אתה בן שמונה.' },
]

/**
 * מי מדבר — the speaker's printed plate.
 *
 * Keyed by the name the content layer puts in `who`, because that is the only thing a
 * line knows about itself. A speaker with no plate simply gets none; the box is designed
 * to read either way, so a new character is a line of dialogue rather than a blocked one.
 */
export const PORTRAIT: Record<string, string> = {
  'קובי': 'faceKobi',
  'רחל': 'faceRachel',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'אפי': 'faceEfi',
  'קרן': 'faceKeren',
  'ילד מהשכונה': 'faceEfi',
  'אוהד': 'faceFan',
  'אוהד ותיק': 'faceFan',
  'סדרן': 'faceFan',
  'הקופאי': 'faceFan',
  'בעל הקיוסק': 'faceOldMan',
  'שכן': 'faceOldMan',
}

export type EndingCard = {
  id: string
  titleHe: string
  bodyHe: string
  memoryHe: string
  memoryItem: ItemId
}

/**
 * There is no Game Over (brief §26). There are different Saturdays. A player who never
 * got in, or got in too late, still ends the day with something — because that is what
 * the biography is made of, and because a screen that says you failed is a screen that
 * says the last twenty minutes did not count.
 */
export const ENDINGS: Record<string, EndingCard> = {
  home: {
    id: 'home',
    titleHe: 'הביתה',
    bodyHe:
      'חזרתם ברגל, שניכם, בלי לדבר הרבה. הוא החזיק לך את היד בכביש כמו תמיד, אבל קצת פחות חזק — כאילו הבין שזה כבר לא בשביל שלא תלך לאיבוד.',
    memoryHe: 'שמת את זה בקופסה האדומה. הדבר הראשון שיש בה.',
    memoryItem: 'ticket-stub',
  },
  late: {
    id: 'late',
    titleHe: 'אחרי המשחק',
    bodyHe:
      'הגעת כשכבר יצאו. עמדת בצד ונתת לאנשים לעבור, ומצאת אותו בין כולם. הוא ראה אותך לפני שראית אותו.',
    memoryHe: 'הרמת מהרצפה פיסה של משהו שמישהו זרק. שמת את זה בקופסה האדומה.',
    memoryItem: 'folded-paper',
  },
  missed: {
    id: 'missed',
    titleHe: 'שבת רגילה',
    bodyHe:
      'נשארת ברחוב עד שהחשיך. הוא חזר מאוחר, צרוד, ולא סיפר כלום — ואתה לא שאלת, כי ידעת שלא היית שם.',
    memoryHe: 'שמת בקופסה האדומה משהו קטן מהיום הזה. יום שהיה, גם אם לא היית בו.',
    memoryItem: 'football-card',
  },
}

export const ITEMS: Record<ItemId, { nameHe: string; noteHe: string }> = {
  'house-key': { nameHe: 'מפתח הבית', noteHe: 'על חוט, בתוך החולצה' },
  coin: { nameHe: 'מטבע', noteHe: 'נמצא ברחוב' },
  newspaper: { nameHe: 'עיתון', noteHe: 'עמוד הספורט כלפי חוץ' },
  'football-card': { nameHe: 'קלף שחקן', noteHe: 'שחקן באדום' },
  bottle: { nameHe: 'בקבוק זכוכית', noteHe: 'להחזיר לקיוסק' },
  'folded-paper': { nameHe: 'נייר מקופל', noteHe: 'נאסף מהרצפה' },
  'ticket-stub': { nameHe: 'ספח כרטיס', noteHe: 'קרטון קטן, נקרע בכניסה' },
  scarf: { nameHe: 'צעיף', noteHe: 'אדום' },
}

/**
 * The only objectives the game ever states, and they are deliberately vague. Brief §25
 * is explicit: no giant QUEST marker. This is the difference between "the day has a
 * shape" and "do this next".
 */
export const OBJECTIVES = {
  morning: 'שבת. הבית ער.',
  afterKobi: 'אבא יצא.',
  onTheWay: 'ללכת אחרי האנשים.',
  atGround: 'למצוא דרך פנימה.',
  findKobi: 'למצוא את אבא.',
} as const
