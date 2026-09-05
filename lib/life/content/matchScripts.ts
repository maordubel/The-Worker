/**
 * תסריטי משחק — the ~60 seconds a match takes, as data.
 *
 * A match in this game was two things until 5.9.2026: the 1986 final, directed minute by
 * minute in the scene class, and every match after it, told in a conversation the player
 * read. The upgrade brief asks for one shape for all of them: a fast, DIRECTED sequence —
 * the board and the minute, cinematic jumps between the moments that matter, two or
 * three short things the player does with his body, the terrace answering, and a way out
 * that leads straight to a consequence. About sixty seconds. No waiting.
 *
 * So a match is a list of steps. Each step waits, then does a few things at once: moves
 * the board, moves the crowd, says one line, asks one short question. The runner is
 * `lib/life/runtime/matchDirector.ts`; a scene hands it a script and gets it back when the
 * whistle goes. `tests/life-match.test.ts` walks every script without a browser.
 *
 * Three rules the scripts obey, and the tests check:
 * · **The board is the archive's.** A step may move the score, and the LAST score of a
 *   script must equal the anchor's `scoredFor / scoredAgainst`. A minute appears on the
 *   board only where the archive holds a goal minute (1986: the 86th). Everywhere else the
 *   board carries a phase word — המשחק, הארכה, פנדלים, סיום — and never a number this
 *   game made up.
 * · **No result in a spoken line.** The lines say what the ground felt; the board says
 *   what happened. (`tests/life-stage-b.test.ts` already bans a scoreline in dialogue.)
 * · **Under a minute of clock.** The waits of a regular match add up to at most 62 s. The
 *   1986 final is the brief's named exception — a terrace mission, not a regular match —
 *   and even there nothing waits passively.
 */
import type { CrowdState, SampleKey } from '../runtime/audio'
import type { LifeEvent } from '../events'

import { FULL_TIME, KICKOFF } from '../world/scenes'
import { FULL_98, HALF_98 } from './chapter1998laces'

export type MatchStep = {
  /** ms after the previous step ended (a `talk` pause does not count) */
  wait: number
  id?: string
  /** a board minute — only from the archive; the runner refuses one the anchor does not hold */
  minute?: number
  /** the board's word when there is no minute: המשחק · מחצית · הארכה · פנדלים · סיום */
  phaseHe?: string
  /** the score after this step, in the club's terms (for / against) */
  board?: { for: number; against: number }
  /** shorthand: one goal, ours or theirs — the board moves, the crowd answers, the picture reacts */
  goal?: 'for' | 'against'
  /** the scene stages this goal itself (1986: the archive film, or the authored 86th minute) */
  authored?: boolean
  crowd?: CrowdState
  text?: string
  tone?: 'plain' | 'red'
  sfx?: SampleKey
  level?: number
  whistle?: number
  /** a short conversation — the player's hands; the timeline waits for it */
  talk?: string
  /** advance the day clock to this minute (absolute), so the world outside agrees */
  clock?: number
  flag?: string
  events?: readonly LifeEvent[]
  /** the whistle: the board holds, the crowd empties, the host closes the match */
  end?: boolean
}

export type MatchScript = {
  id: string
  sport: 'football' | 'basketball'
  /** the brief's named exception: a terrace mission may run longer than a regular match */
  exempt?: boolean
  /** the board shows two numbers; false for a hall night the archive holds as a season, not a score */
  scored: boolean
  /** which side of the board we are on when the chapter's anchor is another night (the 1993 series) */
  atHome?: boolean
  steps: readonly MatchStep[]
}

/** the sum of the waits — what the clock spends, prompts aside */
export const scriptMs = (script: MatchScript) => script.steps.reduce((sum, step) => sum + step.wait, 0)

/** the board after the last step that moved it */
export function finalBoard(script: MatchScript): { for: number; against: number } | null {
  let board: { for: number; against: number } | null = null
  for (const step of script.steps) {
    if (step.board) board = { ...step.board }
    else if (step.goal) {
      const previous: { for: number; against: number } = board ?? { for: 0, against: 0 }
      board = { for: previous.for + (step.goal === 'for' ? 1 : 0), against: previous.against + (step.goal === 'against' ? 1 : 0) }
    }
  }
  return board
}

export const REGULAR_MATCH_MAX_MS = 62_000

// -------------------------------------------------------------------------- 1986 ---
/**
 * The final. Exempt from the minute rule by name in the brief, and the one script with
 * a minute on the board: the 86th, which `content/manual/match-events.json` holds with
 * a scorer and a source. The goal step is `authored` — the scene plays the archive film
 * if it has not been seen, else its own eighty-sixth minute — and the script picks up
 * after it for the celebration and the whistle.
 */
const FINAL_86: MatchScript = {
  id: 'final-86',
  sport: 'football',
  exempt: true,
  scored: true,
  steps: [
    { wait: 0, id: 'kickoff', minute: 0, board: { for: 0, against: 0 }, crowd: 'LOW_MURMUR', whistle: 1, text: 'המשחק מתחיל.', tone: 'red', clock: KICKOFF },
    { wait: 2600, id: 'stand', talk: 'm86-stand' },
    { wait: 900, id: 'song', minute: 12, crowd: 'CHANT', clock: KICKOFF + 12 },
    { wait: 5200, id: 'first-half', minute: 41, crowd: 'LOW_MURMUR', text: 'ארבעים דקות של כלום. הרגליים כואבות. אבא לא מוריד את העיניים מהמגרש.', clock: KICKOFF + 41 },
    { wait: 3800, id: 'half', phaseHe: 'מחצית', crowd: 'LOW_MURMUR', whistle: 1, text: 'מחצית. מישהו מעביר גרעינים לאורך השורה.', clock: KICKOFF + 46 },
    { wait: 3200, id: 'second', minute: 46, crowd: 'CHANT', whistle: 1, clock: KICKOFF + 61 },
    { wait: 4200, id: 'build', minute: 74, crowd: 'BUILDING_TENSION', text: 'היציע כבר לא שר. כולם רק מסתכלים.', clock: KICKOFF + 89 },
    { wait: 3600, id: 'breath', talk: 'm86-breath' },
    { wait: 600, id: 'near', minute: 81, crowd: 'NEAR_MISS', text: 'כמעט. כל היציע נשען קדימה ונופל חזרה.', clock: KICKOFF + 96 },
    { wait: 3400, id: 'goal', goal: 'for', authored: true, minute: 86, crowd: 'GOAL_BURST', clock: KICKOFF + 101 },
    { wait: 2400, id: 'after', phaseHe: 'סיום', crowd: 'AFTERMATH', text: 'ארבע דקות שאף אחד לא זוכר.', clock: FULL_TIME },
    { wait: 2200, id: 'end', end: true, crowd: 'FINAL_WHISTLE', whistle: 3 },
  ],
}

// -------------------------------------------------------------------------- 1998 ---
/**
 * The last round, 2.5.1998. The match on the pitch is won — the archive says 1:0 at home —
 * and the title is lost by a point somewhere else, through a transistor. The board here
 * is OUR match; the other one has no board, because nobody in the ground could see it.
 */
const LACES_98: MatchScript = {
  id: 'laces-98',
  sport: 'football',
  scored: true,
  steps: [
    { wait: 0, id: 'kickoff', phaseHe: 'המשחק', board: { for: 0, against: 0 }, crowd: 'BUILDING_TENSION', whistle: 1, text: 'שני משחקים בבת אחת: אחד על הדשא, אחד בטרנזיסטור של האיש מאחוריך.', clock: HALF_98 - 44 },
    { wait: 3200, id: 'where', talk: 'm98-where' },
    { wait: 800, id: 'goal', goal: 'for', crowd: 'GOAL_BURST', text: 'שער. שלנו. היציע קופץ — ומיד מסתובב לטרנזיסטור.', tone: 'red', clock: HALF_98 - 20 },
    { wait: 6400, id: 'half', phaseHe: 'מחצית', crowd: 'LOW_MURMUR', whistle: 1, text: 'מאחור, טרנזיסטור: "שם — יתרון להם." ואז מישהו אחר: "לא, לא, שוויון." ואז: "מי אמר?"', clock: HALF_98 },
    { wait: 6000, id: 'second', phaseHe: 'המשחק', crowd: 'CHANT', whistle: 1, clock: HALF_98 + 20 },
    { wait: 3600, id: 'listen', talk: 'm98-listen' },
    { wait: 800, id: 'late', crowd: 'BUILDING_TENSION', text: 'פייג׳ר אצל מישהו. "שוויון שם! שוויון!" היציע עולה באוויר על משחק שלא רואים.', tone: 'red', sfx: 'crowd-swell', level: 0.8, clock: FULL_98 - 8 },
    { wait: 6400, id: 'near', crowd: 'NEAR_MISS', text: 'הדקות האחרונות. אף אחד לא מסתכל על המגרש.' },
    { wait: 4800, id: 'end', end: true, phaseHe: 'סיום', crowd: 'FINAL_WHISTLE', whistle: 3, clock: FULL_98 },
    { wait: 1800, id: 'hush', sfx: 'crowd-hush', level: 0.8, talk: 'l1-whistle' },
  ],
}

// -------------------------------------------------------------------------- 1999 ---
/**
 * The cup final, 26.5.1999, Ramat Gan. The archive: 1:1 after extra time, the shootout
 * won. The order the goals came in is what the chapter has said since it was written —
 * theirs first, the equaliser after. No minute is claimed for either. The shootout is
 * the player's hands (`c99-pens`), and the rest of the night follows from it.
 */
const CUP_99: MatchScript = {
  id: 'cup-99',
  sport: 'football',
  scored: true,
  steps: [
    { wait: 0, id: 'kickoff', phaseHe: 'המשחק', board: { for: 0, against: 0 }, crowd: 'CHANT', whistle: 1, text: 'ארבעים אלף. הצבע שלכם בצד אחד, הצבע שלהם בשני, והרעש — לא רעש. לחץ. כמו מים.' },
    { wait: 3400, id: 'scarf', talk: 'm99-scarf' },
    { wait: 900, id: 'theirs', goal: 'against', crowd: 'AFTERMATH', sfx: 'crowd-groan', level: 0.9, text: 'הם קודם. הצד השני של הקערה עולה באוויר. אצלכם — שקט של אנשים שסופרים דקות.' },
    { wait: 5200, id: 'react', talk: 'm99-behind' },
    { wait: 800, id: 'build', crowd: 'BUILDING_TENSION', text: 'ואז זה מתחיל לזוז. לא על המגרש — ביציע. מישהו מתחיל, ואלף ממשיכים.' },
    { wait: 5400, id: 'near', crowd: 'NEAR_MISS', text: 'קרוב. הקערה נושמת פנימה ולא החוצה.' },
    { wait: 3600, id: 'equaliser', goal: 'for', crowd: 'GOAL_BURST', text: 'השוויון. האצטדיון עולה באוויר ונשאר שם.', tone: 'red' },
    { wait: 6200, id: 'extra', phaseHe: 'הארכה', crowd: 'LOW_MURMUR', whistle: 2, text: 'הארכה. שקט של אנשים שאין להם כבר מה לצעוק.' },
    { wait: 5600, id: 'clock', crowd: 'BUILDING_TENSION', text: 'ואז השופט מסתכל בשעון, ואתה יודע מה זה אומר.' },
    { wait: 3400, id: 'pens', phaseHe: 'פנדלים', crowd: 'LOW_MURMUR', whistle: 1, talk: 'c99-pens' },
    { wait: 0, id: 'end', end: true, phaseHe: 'סיום', crowd: 'FINAL_WHISTLE' },
  ],
}

// --------------------------------------------------------------------- 13.5.2000 ---
/**
 * The title, 13.5.2000, at the Hatikva. 1:1 away, and the draw is the championship. The
 * chapter has always said theirs came first; it says no minute, and neither does this.
 */
const TITLE_00: MatchScript = {
  id: 'title-00',
  sport: 'football',
  scored: true,
  steps: [
    { wait: 0, id: 'kickoff', phaseHe: 'המשחק', board: { for: 0, against: 0 }, crowd: 'LOW_MURMUR', whistle: 1, text: 'מגרש קטן. יציע בטון, רשת, שכונה מסביב שמסתכלת מהמרפסות. שש אלף איש שלא נושמים.' },
    { wait: 3400, id: 'stand', talk: 'm00-stand' },
    { wait: 900, id: 'theirs', goal: 'against', crowd: 'AFTERMATH', sfx: 'crowd-groan', level: 0.9, text: 'הם קודם. כמובן שהם קודם. אתה לא מחשב. אתה מסתכל על מי שלידך ורואה שגם הוא לא.' },
    { wait: 6400, id: 'build', crowd: 'BUILDING_TENSION', text: 'היציע לא שר. הוא דוחף. שש אלף איש דוחפים כדור בעיניים.' },
    { wait: 4600, id: 'equaliser', goal: 'for', crowd: 'GOAL_BURST', text: 'השוויון.', tone: 'red' },
    { wait: 6800, id: 'twenty', crowd: 'CHANT', text: 'ואז עשרים דקות שהן שנתיים.' },
    { wait: 4200, id: 'hold', talk: 'm00-hold' },
    { wait: 800, id: 'near', crowd: 'NEAR_MISS', text: 'הדקה האחרונה. אף אחד לא מסתכל על השעון, כולם מסתכלים על השופט.' },
    { wait: 5200, id: 'end', end: true, phaseHe: 'סיום', crowd: 'FINAL_WHISTLE', whistle: 3, talk: 't-match' },
  ],
}

// --------------------------------------------------------------------- 17.5.2000 ---
/**
 * The double, 17.5.2000, Ramat Gan again. 2:2 after extra time, the shootout won. The
 * archive gives the score and the fact that the second of ours came in extra time; it
 * does not give an order for the first two, so the board moves to level in one cut and
 * to level again in the extra half hour — a time jump, not a claim.
 */
const DOUBLE_00: MatchScript = {
  id: 'double-00',
  sport: 'football',
  scored: true,
  steps: [
    { wait: 0, id: 'kickoff', phaseHe: 'המשחק', board: { for: 0, against: 0 }, crowd: 'CHANT', whistle: 1, text: 'רמת גן. שוב. אותה קערה, אותו יריב, שנה אחרי. ארבעים אלף שכבר יודעים שזה יכול להיגמר בפנדלים, ומקללים את הידיעה.' },
    { wait: 3600, id: 'memory', talk: 'm00-memory' },
    { wait: 900, id: 'level', board: { for: 1, against: 1 }, crowd: 'NEAR_MISS', sfx: 'crowd-swell', level: 0.9, text: 'שער, ושער. תשעים דקות ואף אחד לא מוותר.' },
    { wait: 6400, id: 'extra', phaseHe: 'הארכה', crowd: 'BUILDING_TENSION', whistle: 2, text: 'הארכה. הרגליים של השחקנים נגמרות. הקולות ביציע לא.' },
    { wait: 4800, id: 'ours', goal: 'for', crowd: 'GOAL_BURST', text: 'שלנו. הבמה זזה. ארבעים אלף בבת אחת.', tone: 'red' },
    { wait: 5400, id: 'theirs', goal: 'against', crowd: 'AFTERMATH', sfx: 'crowd-groan', level: 0.9, text: 'ואז שלהם. הקערה נחתכת לשניים: צד שצועק וצד ששותק.' },
    { wait: 6000, id: 'clock', crowd: 'BUILDING_TENSION', text: 'ואף אחד לא מוותר. ואז השופט מסתכל בשעון.' },
    { wait: 3400, id: 'pens', phaseHe: 'פנדלים', crowd: 'LOW_MURMUR', whistle: 1, talk: 'd-match' },
    { wait: 0, id: 'end', end: true, phaseHe: 'סיום', crowd: 'FINAL_WHISTLE' },
  ],
}

// --------------------------------------------------------------------- the hall ---
/**
 * Ussishkin nights. The archive holds the final score of the 1993 games and only a
 * season for 1997 and 1999, so the hall boards carry no numbers the lines do not: the
 * game is told by the room — the bounce, the horn, the murmur that turns — and by the
 * conversation each night already has, which the script wraps rather than replaces.
 */
const GALIL_93_G1: MatchScript = {
  id: 'galil-93-g1',
  sport: 'basketball',
  scored: false,
  atHome: true,
  steps: [
    { wait: 0, id: 'tip', phaseHe: 'המשחק', crowd: 'CHANT', sfx: 'ball-bounce', level: 0.6, text: 'האולם מלא עד הקירות. הביטחון של אחרי גביע.' },
    { wait: 2800, id: 'inside', talk: 'g1-inside' },
    { wait: 600, id: 'turn', crowd: 'AFTERMATH', sfx: 'crowd-groan', level: 0.7, text: 'זה בא לאט. סל, ועוד סל, והאולם שמפסיק לצעוק ומתחיל להסתכל.' },
    { wait: 4600, id: 'near', crowd: 'NEAR_MISS', sfx: 'ball-bounce', level: 0.5 },
    { wait: 3200, id: 'end', end: true, phaseHe: 'סיום', crowd: 'FINAL_WHISTLE', sfx: 'buzzer', level: 0.7 },
  ],
}

const GALIL_93_G3: MatchScript = {
  id: 'galil-93-g3',
  sport: 'basketball',
  scored: false,
  atHome: true,
  steps: [
    { wait: 0, id: 'tip', phaseHe: 'המשחק', crowd: 'BUILDING_TENSION', sfx: 'ball-bounce', level: 0.6, text: 'אולם של גב אל הקיר. אנשים לא שרים — הם צורחים.' },
    { wait: 3200, id: 'run', crowd: 'GOAL_BURST', sfx: 'crowd-swell', level: 0.9, text: 'ואז זה בא. לא לאט — בבת אחת.' },
    { wait: 4200, id: 'chant', crowd: 'CHANT' },
    { wait: 3000, id: 'inside', talk: 'g3-inside' },
    { wait: 0, id: 'end', end: true, phaseHe: 'סיום', crowd: 'FINAL_WHISTLE', sfx: 'buzzer', level: 0.7 },
  ],
}

const HALL_NIGHT = (id: string, talk: string, openHe: string): MatchScript => ({
  id,
  sport: 'basketball',
  scored: false,
  atHome: true,
  steps: [
    { wait: 0, id: 'tip', phaseHe: 'המשחק', crowd: 'LOW_MURMUR', sfx: 'ball-bounce', level: 0.5, text: openHe },
    { wait: 4200, id: 'long', crowd: 'AFTERMATH', text: 'זה לא היה קרוב. זה מה שהפך את זה לארוך.' },
    { wait: 3800, id: 'near', crowd: 'NEAR_MISS', sfx: 'ball-bounce', level: 0.5, text: 'סל, ועוד סל. האולם מסתכל בשעון.' },
    { wait: 3400, id: 'inside', talk },
    { wait: 0, id: 'end', end: true, phaseHe: 'סיום', crowd: 'FINAL_WHISTLE', sfx: 'buzzer', level: 0.7 },
  ],
})

export const MATCH_SCRIPTS: Record<string, MatchScript> = {
  'final-86': FINAL_86,
  'laces-98': LACES_98,
  'cup-99': CUP_99,
  'title-00': TITLE_00,
  'double-00': DOUBLE_00,
  'galil-93-g1': GALIL_93_G1,
  'galil-93-g3': GALIL_93_G3,
  'hall-97': HALL_NIGHT('hall-97', 'h1-inside', 'האולם חצי מלא. חצי מלא באולם הזה נשמע כמו ריק.'),
  'hall-99': HALL_NIGHT('hall-99', 'seed-inside', 'פחות אנשים מבפעם הקודמת, ויותר שקט.'),
}

export const matchScriptFor = (id: string): MatchScript | null => MATCH_SCRIPTS[id] ?? null

/** the chapter each script belongs to, for the tests that hold a script's last board to its anchor */
export const SCRIPT_CHAPTER: Record<string, string> = {
  'final-86': '1986',
  'laces-98': '1998-laces',
  'cup-99': '1999-cup',
  'title-00': '2000-title',
  'double-00': '2000-double',
  'galil-93-g1': '1993-galil',
  'galil-93-g3': '1993-galil',
  'hall-97': '1997-basket',
  'hall-99': '1999-basket',
}
