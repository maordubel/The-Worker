import type { ItemId, PlayerIdentity } from '../types'

import type { Say } from './script'

/**
 * 1986 — the chapter's frame: what the player is told at the start, what they are left
 * with at the end, and what the things in their pockets are called.
 *
 * REBASED, by six years. The master timeline moves the protagonist's birth forward, so
 * the Saturday he is eight on lands in the season the archive can actually back: the
 * club were champions, at confidence 2, with a source. The prologue moved with him, and
 * changed owner while it did — it is no longer his father's youth, it is HIS first
 * memory, at five, of a cup final he was carried to rather than one he chose.
 *
 * Both anchors carry one canonical fact and nothing else. No score, no opponent, no
 * scorer, no date: the archive holds no match rows at all from this decade, only the
 * trophies, and a scene may not know more than the archive does (rule 11). The years
 * printed below are the only years this chapter is allowed to name, and a test asserts
 * it. See `lib/life/anchor-server.ts`.
 */

/**
 * פוגי.
 *
 * He had no name for two passes and was written as "הילד" — which reads as a placeholder
 * because it IS one, and a life simulation whose protagonist is called "the child" is a
 * life simulation nobody has decided about yet. Maor named him in the September pass and gave him
 * a face at three ages: eight here, the conscript, and the young man.
 *
 * The architecture still supports a name and a boy/girl choice (brief §9) and Stage A
 * still does not ask for either — a character creator before the game is proven is the
 * wrong order of work. The day the chooser exists, this becomes its default and nothing
 * else changes.
 */
export const DEFAULT_IDENTITY: PlayerIdentity = { name: 'פוגי', sex: 'boy', birthYear: 1978 }

/** `{anchor}` is filled from the canonical anchor's headline; nothing else is. */
export const PROLOGUE: Say[] = [
  { who: null, text: 'דרום תל אביב. 1983.' },
  { who: null, text: 'אתה בן חמש, ואתה על הכתפיים של מישהו. אתה לא רואה כלום חוץ מראשים.' },
  { who: null, text: 'ריח של סיגריה, של זיעה, של גראס יבש. רדיו טרנזיסטור צורח באוזן של מישהו אחר.' },
  { who: null, text: '{anchor}' },
  { who: null, text: 'ואז כולם צועקים בבת אחת, והכתפיים שאתה יושב עליהן קופצות, ואתה נאחז בשיער של אבא כדי לא ליפול.' },
  { who: null, text: 'אתה לא מבין מה קרה. אתה בוכה. ואז אתה צוחק, כי כולם צוחקים.' },
  { who: null, text: 'זה הזיכרון הראשון שלך. לא בחרת בו.' },
  { who: null, text: '· · ·' },
  { who: null, text: 'דרום תל אביב. שבת, 1986.' },
  { who: null, text: 'אתה בן שמונה. ואת זה כבר תבחר לבד.' },
]

/**
 * מי מדבר — the speaker's printed plate.
 *
 * Keyed by the name the content layer puts in `who`, because that is the only thing a
 * line knows about itself. A speaker with no plate simply gets none; the box is designed
 * to read either way, so a new character is a line of dialogue rather than a blocked one.
 */
export const PORTRAIT: Record<string, string> = {
  'פוגי': 'facePogi',
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
  // The hero on the bedroom wall. He never speaks in this chapter — he is a poster, a
  // name three children argue over, and the reason a father stands in a doorway at
  // night — but the plate exists so the day he does speak, it is one line of content.
  'משה סיני': 'faceSinai',
  'יוסף': 'faceOldMan',
  'שכן': 'faceOldMan',
}

export type EndingCard = {
  id: string
  titleHe: string
  bodyHe: string
  memoryHe: string
  memoryItem: ItemId
  /**
   * כעבור חמש־עשרה שנה — the last thing the day shows you is the same person, older.
   *
   * This is the hinge the whole life simulation turns on, and it is cheaper and truer to
   * show it than to explain it: two plates of one man, one from the Saturday you just
   * played and one from a decade you have not reached yet, in the same frame. Nothing is
   * claimed about what happened in between — the caption says only how long it was — so
   * the epilogue costs the archive nothing while making the chapter feel like a chapter
   * rather than a level.
   */
  after?: {
    fromArt: string
    toArt: string
    /** one sentence, present tense, about the gap between the two pictures */
    lineHe: string
  }
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
    after: {
      fromArt: 'kobi-chair',
      toArt: 'kobi90-paper',
      lineHe: 'הוא ימשיך לקרוא את עמוד הספורט בשבת בבוקר עוד הרבה מאוד שנים. הכורסה תישאר. אתה תגדל.',
    },
  },
  late: {
    id: 'late',
    titleHe: 'אחרי המשחק',
    bodyHe:
      'הגעת כשכבר יצאו. עמדת בצד ונתת לאנשים לעבור, ומצאת אותו בין כולם. הוא ראה אותך לפני שראית אותו.',
    memoryHe: 'הרמת מהרצפה פיסה של משהו שמישהו זרק. שמת את זה בקופסה האדומה.',
    memoryItem: 'folded-paper',
    after: {
      fromArt: 'kobi-cheer',
      toArt: 'kobi90-cheer',
      lineHe: 'הוא יעמוד באותו מקום ביציע עוד הרבה שבתות. בשלב מסוים תעמוד לידו בגובה שלו.',
    },
  },
  missed: {
    id: 'missed',
    titleHe: 'שבת רגילה',
    bodyHe:
      'נשארת ברחוב עד שהחשיך. הוא חזר מאוחר, צרוד, ולא סיפר כלום — ואתה לא שאלת, כי ידעת שלא היית שם.',
    memoryHe: 'שמת בקופסה האדומה משהו קטן מהיום הזה. יום שהיה, גם אם לא היית בו.',
    memoryItem: 'football-card',
    after: {
      fromArt: 'ofir',
      toArt: 'ofir90-smoke',
      lineHe: 'אופיר ילך לבד לבלומפילד גם בפעם הבאה, וגם בשנים הבאות. יבוא יום שתלך איתו.',
    },
  },
}

/**
 * מה זה נראה — the art each object is drawn with, where there is art for it.
 *
 * The red box was a list of nouns on a card. An object you can LOOK at is a memory; a
 * noun is a receipt, and the whole of §50 is about the difference. Anything with no
 * plate simply gets none and the card still reads.
 */
export const ITEM_ART: Partial<Record<ItemId, string>> = {
  scarf: 'propScarfRed',
  newspaper: 'propPapers',
  'folded-paper': 'propPapers',
  'football-card': 'propSticker',
  // The REAL one. `propTicket` was a mis-cut of a coin and a fragment of a coat; the
  // child's own ticket to משחק 15 is in this repository, scanned, because somebody
  // kept it for forty years. A memory of a ticket drawn as the ticket is the whole
  // argument of §50, and there was never a reason to draw a worse one beside it.
  'ticket-stub': 'docTicket',
  coin: 'propCoins',
  transistor: 'propRadio',
  'promotion-table': 'propPapers',
  'pocket-money': 'propCoins',
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
  // --- 1990 ---
  transistor: { nameHe: 'טרנזיסטור', noteHe: 'של אבא. האנטנה מכופפת' },
  'promotion-table': { nameHe: 'טבלה מקופלת', noteHe: 'החשבון של הבוקר, בעיפרון' },
  'pocket-money': { nameHe: 'דמי כיס', noteHe: 'שטר אחד, מקופל לארבע' },
}

/**
 * The only objectives the game ever states, and they are deliberately vague. Brief §25
 * is explicit: no giant QUEST marker. This is the difference between "the day has a
 * shape" and "do this next".
 */
export const OBJECTIVES = {
  findKey: 'שבת בבוקר. המפתח במגירה.',
  askDad: 'אבא בסלון.',
  matchToday: 'היום יש משחק.',
  afterKobi: 'אבא יצא.',
  onTheWay: 'ללכת אחרי האנשים, מזרחה.',
  atGround: 'למצוא דרך פנימה.',
  findKobi: 'למצוא את אבא.',
} as const
