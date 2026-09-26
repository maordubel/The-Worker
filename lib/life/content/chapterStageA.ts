import { at } from '../clock'
import { shirtAgorot } from '../prices'
import type { LifeState, LocationId } from '../types'
import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { ChoiceDef, Conversation } from './script'
import { BOTTLES_ALL_85 } from './storyChores'

/**
 * ההבטחה של A2, והשעה שהיא נמדדת בה — שתי שורות שהבחירה, הראיה והבדיקה חולקות.
 *
 * `BREAD_PROMISE` הוא ה-`subjectHe` שגם הסיכום מראש וגם הקיום נושאים, כי `sameSubject`
 * בהישגים מצליב נושא ולא מפתח. `BREAD_BY` היא חמש — השעה שהילד עצמו נוקב בה מול אמו.
 */
export const BREAD_PROMISE = 'הלחם של אמא'
export const BREAD_BY = at(17, 0)

/**
 * שלב א׳ — ששת הימים שלפני השבת (A2–A7).
 *
 * The Stage A brief turned one Saturday into eight days: the first memory on a father's
 * shoulders (A1 — the prologue that already plays), the neighbourhood becoming a game,
 * a second red house, a shirt saved for, a match got ready for alone, a winter heard on
 * the radio, and the week of a refusal — and then 24.5.1986, the day this game shipped
 * with. These six are written the way the decade after them is: as beats and rows, in
 * the rooms that exist, with the boy the sheets already drew. The five-year-old, the
 * six-year-old and the seven-year-old are on the art list; until they arrive the
 * eight-year-old stands in, and the card names the year so nobody is lied to.
 *
 * Every day is short — ten minutes of a childhood — and every day teaches one thing
 * the Saturday will need: an errand and a clock, a hall and a name, a tin and a price,
 * a shirt and a key, a radio and a normal disappointment, a promise and a "no".
 *
 * Nothing here states a result, a scorer or an opponent.
 */

export const A2 = 'life:a:d2'
export const A3 = 'life:a:d3'
export const A4 = 'life:a:d4'
export const A5 = 'life:a:d5'
export const A6 = 'life:a:d6'
export const A7 = 'life:a:d7'

export const PORTRAIT_STAGE_A: Record<string, string> = {
  'פוגי': 'facePogi',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'אפי': 'faceEfi',
  'קרן': 'faceKeren',
  'רפי מהקיוסק': 'faceOldMan',
  'אילן השכן': 'faceOldMan',
  'סדרן': 'faceUsher',
  'לירון': 'faceLiron',
  'עליזה': 'faceAliza',
  'בארי': 'faceBarry',
  'אוהד ותיק': 'faceOldMan',
  // שני הקבועים של אלנבי — שני השחקנים האלה מתויגים `era: '*'` ב-`scenes.ts`, כלומר הם
  // עומדים שם בכל פרק, ולכן כל מפה צריכה את הפלייטים שלהם.
  'המוכר': 'faceVendor',
  'הגבר': 'faceSupporterB',
}

// ------------------------------------------------------------------- A2 · the alley ---

export function objectiveA2(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  // (V3 §12) after the game the evening is closed at home, where the bread is or is not
  if (state.flags['a2:played'] && !state.flags['a2:done']) return 'הביתה. אמא מחכה.'
  if (state.flags['a2:played'] || state.flags['a2:late']) return null
  if (state.flags['a2:errand'] && !state.flags['a2:bread']) {
    // (delta 90, §7 A2) the promise the boy framed is the one the line repeats back
    if (state.flags['a2:agreed']) return 'הבטחת: לחם לפני חמש. והקבוצות בסמטה לא מחכות.'
    if (state.flags['a2:after']) return 'אמרת "אחרי המשחק". הסמטה — לפני שהקבוצות מתמלאות.'
    return 'לחם מהקיוסק. ואז — הסמטה, לפני שהקבוצות מתמלאות.'
  }
  if (sceneId === 'home') return 'אמא רוצה לחם. בסמטה כבר מתחילים לבחור קבוצות.'
  return 'הסמטה. לפני שהקבוצות מתמלאות.'
}

export const ENDINGS_A2: Record<string, EndingCard> = {
  played: {
    id: 'played',
    titleHe: 'שיחקת',
    bodyHe: 'הגעת בזמן, נכנסת לקבוצה של אופיר, ובעטת פעם אחת בדיוק כמו שצריך. עם הלחם זה הסתדר איך שהסתדר. אמא לא אמרה על זה כלום, וזה לא אומר ששכחה.',
    memoryHe: 'הפעם הראשונה שהיית בקבוצה.',
    memoryItem: 'football-card',
  },
  late: {
    id: 'late',
    titleHe: 'הקבוצות היו מלאות',
    bodyHe: 'משהו לקח לך את הזמן — הלחם, או הדרך. הגעת לסמטה כשכבר היו שניים בכל צד ואחד בשער. עמדת ליד הקיר וספרת בקול, כמו שאמרו לך. עמית אמר שגם זה תפקיד. זה לא היה.',
    memoryHe: 'לעמוד ליד הקיר ולספור.',
    memoryItem: 'coin',
  },
  home: {
    id: 'home',
    titleHe: 'נשארת בבית',
    bodyHe: 'בסוף לא ירדת לסמטה. שמעת אותם מהחלון — את הכדור על הפח ואת אופיר צועק שמות. הכסף של הלחם נשאר בכיס, כי אצל רפי הכל על החשבון. שמרת אותו שם עד שהלך לאיבוד.',
    memoryHe: 'הכדור על הפח, מהחלון.',
    memoryItem: 'coin',
  },
}

export const BEATS_A2: Beat[] = [
  {
    id: 'a2-open',
    at: 'home',
    trigger: 'enter',
    when: { none: [{ flag: A2 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A2 },
      { a: 'events', events: [{ t: 'money.changed', agorot: 300, why: 'לחם' }] },
      {
        a: 'lines',
        lines: [
          { who: null, text: 'אביב. אתה בן שש. הסלון אחרי הצהריים, החלון פתוח, ומהסמטה שומעים כדור על פח.' },
          { who: 'רחל', text: 'פוגי. לפני שאתה נעלם — לחם מרפי. תגיד לו על החשבון, אני עוברת מחר.' },
        ],
      },
    ],
  },
  {
    id: 'a2-teams-full',
    trigger: 'clock',
    when: { flag: A2, afterMinute: at(16, 25), none: [{ flag: 'a2:played' }, { flag: 'a2:late' }, { flag: 'a2:full' }] },
    do: [{ a: 'flag', flag: 'a2:full' }, { a: 'toast', text: 'מהסמטה: "שניים־שניים! מי בשער?" הקבוצות נסגרו בלעדיך.', tone: 'red' }],
  },
  {
    /**
     * After the two-on-two the evening closes on its own — and it has to close from where
     * the boy IS. This used to be `trigger: 'enter'` on the pitch, which meant the one
     * beat that ends the day waited for the player to walk into the room he was already
     * standing in. Nothing else could end it either, because the night ending below
     * excludes `a2:played` by name: play football in 1984 and the afternoon ran to
     * midnight with nothing left to press. (Found by the robot, 6.9.2026.)
     */
    id: 'a2-after',
    /**
     * (Director V3 §12, 25.9.2026) "consequence at home": the evening used to close
     * wherever the boy happened to be standing after the kickabout, so the bread — or its
     * absence — was a line read on the pitch. It closes in the flat now: he walks home
     * with the knee scraped, and the table is laid with bread or without it.
     */
    at: 'home',
    trigger: 'enter',
    /**
     * `played:football` used to be required here as well. It is raised by the street-
     * football minigame, and a boy who joined the game in the alley has not necessarily
     * played THAT — so the one beat that ends the day was waiting on a flag the day does
     * not have to produce. Joining is the beat; the kickabout is a bonus.
     */
    when: { flag: 'a2:played', none: [{ flag: 'a2:done' }] },
    delayMs: 900,
    // (delta 90) `a2:done` is raised by the conversation's own ending, not before it: a boy
    // who closed the box by mistake used to have the evening marked done and no card, ever
    do: [{ a: 'talk', conversation: 'a2-after-game' }],
  },
  {
    /** and a boy who stays out until it is dark is called in: the day still closes */
    id: 'a2-after-dark',
    trigger: 'clock',
    when: { flag: 'a2:played', afterMinute: at(19, 45), none: [{ flag: 'a2:done' }, { flag: 'a2:called' }] },
    // called home, and he goes — the flat's own beat (`a2-after`) closes the evening there
    do: [{ a: 'flag', flag: 'a2:called' }, { a: 'toast', text: 'מהחלון, בקול של כל השכונה: "פוגי! הביתה!"', tone: 'plain' }, { a: 'travel', to: 'home', spawn: 'fromStreet' }],
  },
  {
    id: 'a2-night',
    trigger: 'clock',
    when: { flag: A2, afterMinute: at(19, 30), none: [{ flag: 'a2:played' }, { flag: 'a2:late' }] },
    do: [{ a: 'lines', lines: [{ who: null, text: 'חושך. הכדור נגמר. מהחלון עוד רואים את הפח, ואף אחד כבר לא עומד לידו.' }] }, { a: 'ending', id: 'home' }],
  },
]

/**
 * -------------------------------------------------------------- A1 · 1 ביוני 1983 ---
 *
 * הזיכרון הראשון — the minute before the game, and the first minute the player owns.
 *
 * It was a narrated title card: seven lines that told you what you felt on your father's
 * shoulders. Stage A §6 asks for the opposite — "a 5–8 minute interactive prologue, not a
 * passive movie" — and it is right, because a memory you are TOLD is somebody else's.
 *
 * So it is the same painting and the same half-minute of drift, played as a conversation:
 * a five-year-old on a pair of shoulders who can only do three things. He can look — and
 * what he looks at is what he keeps. He can copy the crowd, or fail to. He can notice the
 * red thing on the concrete, or not. None of it is a test, none of it is scored, and
 * there is no way to get it wrong: §6 says the gestures are "emotional gestures, not QTE
 * success checks", so every branch continues and every branch leaves a different child.
 *
 * What it actually sets is the shape of the boy the player will then play for fifteen
 * years — clinging (family), reaching (terrace), covering his ears (caution) — and
 * whether there is a scrap of red cloth in his pocket in 1984. That scrap is the first
 * Red Box candidate in the game, and it is the only object in it whose provenance is
 * "you picked it up off the floor when you were five".
 *
 * Rule 11 is tighter here than anywhere: this is a REAL final, and a five-year-old on
 * shoulders is exactly where a fabricated match fact would slip past unnoticed. So the
 * one factual line is `{anchor}`, substituted by the dialogue runner from the canonical
 * archive, and everything else is backs, smoke, concrete, cloth, hands and noise.
 */
/**
 * ------------------------------------------------------------------ לאן ללכת ---
 *
 * The room the day currently wants, per Stage A chapter. `world/route.ts` turns that into
 * the next DOOR — by the label painted on it — for the hint and for the arrow at the edge
 * of the glass.
 *
 * Maor, 6.9.2026, in the middle of A3: *"אפי אומר לך ללכת אחרי הקיר ימינה, אין לי מושג מה
 * הכוונה במשפט הזה."* Efi's line is exactly right for a six-year-old and exactly useless as
 * navigation, and the fix is not to make Efi talk like a signpost. It is that the chapter
 * knows where it is sending him, and the room reads the label off the actual door.
 *
 * Every one of these returns null once the day's want is satisfied, so a chapter with
 * nothing left to reach stops pointing anywhere.
 */
export const goalA2 = (state: LifeState): LocationId | null => {
  if (state.flags['a2:played'] && !state.flags['a2:done']) return 'home'
  if (state.flags['a2:played'] || state.flags['a2:late']) return null
  if (state.flags['a2:errand'] && !state.flags['a2:bread']) return 'kiosk'
  return 'pitch'
}

export const goalA3 = (state: LifeState): LocationId | null => {
  if (state.flags['a3:done'] || state.flags['a3:inside']) return null
  // Only once Efi has named it. Before that the hall is not a place the boy knows exists,
  // and an arrow pointing at it would be the game telling him a secret he was about to be
  // told properly.
  if (!state.flags['knows:hall'] && !state.flags['life:knows:hall']) return null
  return state.flags['entry:granted'] ? 'ussishkin-hall' : 'ussishkin-outside'
}

export const goalA4 = (state: LifeState): LocationId | null => {
  if (state.flags['own:shirt85'] || state.flags['a4:gave']) return null
  // with the thirty in hand the day has one destination; before that it has a job, not a
  // place, and pointing at a door would be the game inventing an errand
  if (state.savings + state.agorot < SHIRT_PRICE) return null
  /**
   * הכסף בפחית הוא לא כסף ביד — the arrow has to know the difference.
   *
   * `minAgorot`, which is what Rafi's counter asks, reads the POCKET. `savings` is a
   * second pocket no condition in the vocabulary can see. So a boy with twelve in the
   * tin and eighteen in his hand was sent to the kiosk by this arrow and told "אין לך
   * 30" when he got there — the game pointing at a door it had already locked.
   */
  return state.agorot >= SHIRT_PRICE ? 'kiosk' : 'bedroom'
}

export const goalA5 = (state: LifeState): LocationId | null => {
  if (state.flags['a5:there']) return null
  if (!state.flags['a5:dressed']) return null
  return 'bloomfield-outside'
}

export const goalA6 = (state: LifeState): LocationId | null => {
  if (state.flags['a6:heard'] || state.flags['a6:gave-up'] || state.flags['a6:revived']) return null
  // only once he has chosen the rain: a dead radio alone is a decision, not a destination
  if (state.flags['a6:carried'] && !state.flags['a6:with-liron']) return 'street'
  return null
}

export const goalA7 = (state: LifeState): LocationId | null => {
  if (state.flags['a7:refused']) return null
  return state.flags['a7:knows'] ? 'home' : 'street'
}

/** what a five-year-old answers his father in the noise — the same three, held or caught */
const A1_KOBI_CHOICES: ChoiceDef[] = [
  { id: 'cling', text: 'להיצמד אליו.', then: [{ e: 'flagValue', flag: 'life:a1:instinct', value: 'family' }, { e: 'rel', who: 'kobi', axis: 'trust', delta: 3 }, { e: 'redheart', key: 'familyTradition', delta: 2 }, { e: 'goto', node: 'a1-after-kobi' }] },
  { id: 'again', text: 'להצביע חזרה למגרש. "עוד פעם."', then: [{ e: 'flagValue', flag: 'life:a1:instinct', value: 'terrace' }, { e: 'redheart', key: 'footballLove', delta: 2 }, { e: 'redheart', key: 'terraceCulture', delta: 2 }, { e: 'personality', key: 'courage', delta: 1 }, { e: 'goto', node: 'a1-after-kobi' }] },
  { id: 'what-happened', text: '"מה קרה?"', then: [{ e: 'flagValue', flag: 'life:a1:instinct', value: 'question' }, { e: 'personality', key: 'curiosity', delta: 3 }, { e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 2 }, { e: 'goto', node: 'a1-after-kobi' }] },
]

export const CONVERSATIONS_A1: Conversation[] = [
  {
    id: 'a1-1983',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'דרום תל אביב. אתה בן חמש.' },
          { who: null, text: 'העולם שלך כרגע הוא שתי כתפיים, ראשים, ורעש.' },
          { who: null, text: 'ריח של סיגריה, של זיעה, של עשב יבש. רדיו טרנזיסטור צורח באוזן של מישהו אחר.' },
        ],
        choices: [
          {
            id: 'look-down',
            text: 'להסתכל למטה, על מי שנושא אותך.',
            then: [
              { e: 'flag', flag: 'life:a1:father' },
              { e: 'rel', who: 'kobi', axis: 'familiarity', delta: 3 },
              { e: 'redheart', key: 'familyTradition', delta: 3 },
              { e: 'goto', node: 'a1-crowd' },
            ],
          },
          {
            id: 'look-out',
            text: 'להסתכל קדימה, לאן שכולם מסתכלים.',
            then: [
              { e: 'flag', flag: 'life:a1:crowd' },
              { e: 'redheart', key: 'terraceCulture', delta: 3 },
              { e: 'personality', key: 'curiosity', delta: 3 },
              { e: 'goto', node: 'a1-crowd' },
            ],
          },
          {
            id: 'look-floor',
            text: 'להסתכל על הרצפה, בין הנעליים.',
            then: [
              { e: 'flag', flag: 'life:a1:floor' },
              { e: 'flag', flag: 'life:a1:noticed-red' },
              { e: 'personality', key: 'curiosity', delta: 2 },
              { e: 'goto', node: 'a1-crowd' },
            ],
          },
        ],
      },
    ],
  },
  {
    /** the red thing: only offered to somebody who looked at the floor, and never twice */
    id: 'a1-red',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'כשהרעש קצת יורד אתה רואה אותו שוב. הדבר האדום שעל הבטון.' },
          { who: null, text: 'הוא כמעט נעלם מתחת לנעל של מישהו.' },
        ],
        /**
         * (Director V3 §12, 25.9.2026) the reach is the hand's, not a button's: a mark on
         * the concrete, one press to bend down and take it, and a scrap left under a shoe
         * for the child who kept both hands on his father (`content/gestures.ts`,
         * `red-1983` — the same effects this choice carried, the same `a1-stub` after).
         */
        then: [{ e: 'minigame', id: 'gesture:red-1983' }],
      },
    ],
  },
  {
    /** copy the crowd — three ways to be five years old, and none of them is wrong */
    id: 'a1-crowd',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הרעש עולה. כולם סביבך עושים אותו דבר, ואף אחד לא הסביר לך מה.' },
        ],
        choices: [
          {
            id: 'clap',
            text: 'למחוא כפיים כמו כולם.',
            then: [
              { e: 'flagValue', flag: 'life:a1:body', value: 'join' },
              { e: 'sfx', key: 'crowd-claps', level: 0.6 },
              { e: 'redheart', key: 'community', delta: 4 },
              { e: 'wellbeing', key: 'belonging', delta: 4 },
              { e: 'minigame', id: 'gesture:grip-1983' },
            ],
          },
          {
            id: 'reach',
            text: 'להרים ידיים אל הרעש.',
            then: [
              { e: 'flagValue', flag: 'life:a1:body', value: 'reach' },
              { e: 'sfx', key: 'crowd-swell', level: 0.6 },
              { e: 'redheart', key: 'terraceCulture', delta: 4 },
              { e: 'personality', key: 'courage', delta: 3 },
              { e: 'minigame', id: 'gesture:grip-1983' },
            ],
          },
          {
            id: 'ears',
            text: 'לכסות את האוזניים.',
            then: [
              { e: 'flagValue', flag: 'life:a1:body', value: 'protect' },
              { e: 'minigame', id: 'gesture:grip-1983' },
            ],
          },
        ],
      },
    ],
  },
  {
    /** the eruption, the fall that does not happen, and the laugh */
    id: 'a1-goal',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: '{anchor}' },
          { who: null, text: 'ואז כולם צועקים בבת אחת, והכתפיים שאתה יושב עליהן קופצות, ואתה נאחז בשיער של אבא כדי לא ליפול.' },
          { who: null, text: 'אתה לא מבין מה קרה. אתה בוכה.' },
          { who: null, text: 'ואז אתה צוחק, כי כולם צוחקים.' },
        ],
        then: [
          { e: 'sfx', key: 'crowd-real-goal', level: 0.8 },
          { e: 'redheart', key: 'footballLove', delta: 6 },
          { e: 'remember', who: 'kobi', eventId: 'shoulders-1983', significance: 'major' },
          { e: 'goto', node: 'a1-kobi' },
        ],
      },
    ],
  },
  {
    id: 'a1-kobi',
    nameHe: 'קובי',
    branches: [
      /** the child who did not hold on was caught — the grip is remembered in the next line */
      {
        when: { flagIs: { flag: 'life:a1:grip', value: 'caught' } },
        lines: [
          { who: null, text: 'היד שלו עוד סגורה על הקרסול שלך. הוא לא מסתכל למטה.' },
          { who: 'קובי', text: 'תחזיק חזק, פוגי.' },
          { who: null, text: 'בתוך כל הרעש אתה שומע אותו ברור. הוא לא מסביר מה קרה. הוא רק בודק שאתה עדיין שם.' },
        ],
        shot: { focus: 'both', framing: 'close', duration: 900, ambienceDuck: 0.45 },
        choices: A1_KOBI_CHOICES,
      },
      {
        lines: [
          { who: 'קובי', text: 'תחזיק חזק, פוגי.' },
          { who: null, text: 'בתוך כל הרעש אתה שומע אותו ברור. הוא לא מסביר מה קרה. הוא רק בודק שאתה עדיין שם.' },
        ],
        shot: { focus: 'both', framing: 'close', duration: 900, ambienceDuck: 0.45 },
        choices: A1_KOBI_CHOICES,
      },
    ],
  },
  {
    id: 'a1-after-kobi',
    nameHe: null,
    branches: [
      /*
       * (delta 90) the Kobi ticket fact is written HERE, on the way to the stub, because a
       * branch that offers choices never runs its own `then` (the runner applies the
       * chosen answer's effects only) — `a1-stub`'s "set unconditionally" was never set.
       * Every path of the memory passes through this node.
       */
      { when: { flag: 'life:a1:noticed-red' }, lines: [{ who: null, text: 'כשהקהל נפתח לרגע, אתה מחפש בעיניים את הדבר שראית קודם.' }], then: [{ e: 'flagValue', flag: 'own:tickets-1983', value: 'kobi' }, { e: 'goto', node: 'a1-red' }] },
      { lines: [{ who: null, text: 'היד של אבא עדיין על הרגל שלך. הרעש יורד מדרגה אחת.' }], then: [{ e: 'flagValue', flag: 'own:tickets-1983', value: 'kobi' }, { e: 'goto', node: 'a1-stub' }] },
    ],
  },
  {
    /**
     * שני הספחים — the fact the whole life is hung on, planted where it actually happened.
     *
     * The canon has two ends and they are the same act in opposite directions: in 1983
     * somebody got the tickets and carried you in, and around 2026 you get the tickets and
     * carry him. For the second one to land, the first one has to be a thing the save
     * remembers rather than a thing the script asserts later — so this beat writes
     * `own:tickets-1983`, and it writes it as a VALUE (`kobi`), not as a boolean, because
     * the question 2026 asks is *who held them*, and a true/false cannot answer it.
     *
     * It is set unconditionally. That is deliberate: a five-year-old did not earn the
     * tickets and cannot have got them wrong, and making it a reward for a correct choice
     * would be the game congratulating a child for being carried. What the player chooses
     * is only what happens to the torn half afterwards.
     *
     * The prologue never names him — "somebody", "the shoulders", "dad's hair" — because a
     * child of five does not narrate a father. The flag knows who it was; the scene still
     * does not say it.
     */
    id: 'a1-stub',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הרעש נרגע לאט. היד שמחזיקה אותך משחררת רגע אחד ונכנסת לכיס.' },
          { who: null, text: 'שני ספחים. קרועים ביד של מישהו בשער, לפני שעה, כשעוד היה אור.' },
          { who: null, text: 'אחד מהם מושט אליך.' },
        ],
        // `own:tickets-1983` is raised in `a1-after-kobi` — see there
        choices: [
          {
            id: 'take-stub',
            text: 'לקחת אותו.',
            then: [
              { e: 'give', item: 'ticket-stub' },
              /** `own:` — the prefix a year change does not erase. Same reason as the scrap. */
              { e: 'flag', flag: 'own:stub-1983' },
              { e: 'flag', flag: 'life:a1:stub' },
              { e: 'redheart', key: 'historyMemory', delta: 3 },
              { e: 'remember', who: 'kobi', eventId: 'stub-1983', significance: 'minor' },
              { e: 'goto', node: 'a1-home' },
            ],
          },
          {
            id: 'refuse-stub',
            text: 'לא לקחת. הידיים תפוסות.',
            then: [
              // He keeps both, which is the honest version of 1983 too. Nothing is lost:
              // 2026 asks who HELD them, and the answer is the same either way.
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 2 },
              { e: 'goto', node: 'a1-home' },
            ],
          },
          {
            id: 'ask-stub',
            text: 'לשאול מה זה.',
            then: [
              { e: 'give', item: 'ticket-stub' },
              { e: 'flag', flag: 'own:stub-1983' },
              { e: 'flag', flag: 'life:a1:stub' },
              { e: 'personality', key: 'curiosity', delta: 3 },
              { e: 'remember', who: 'kobi', eventId: 'stub-1983', significance: 'minor' },
              { e: 'goto', node: 'a1-home' },
            ],
          },
        ],
      },
    ],
  },
  {
    /** carried home asleep, and the object that becomes 1984 */
    id: 'a1-home',
    nameHe: null,
    branches: [
      {
        when: { flag: 'life:a1:red' },
        lines: [
          { who: null, text: 'אתה לא זוכר את הדרך הביתה. אתה זוכר את היד סביב הרגל שלך שלא הרפתה.' },
          { who: null, text: 'בבוקר מצאת בכיס פיסת בד אדומה שלא שלך, והחזקת אותה עד שהיא הפכה לסמרטוט.' },
          { who: null, text: 'לא בחרת להגיע לשם. את מה שלקחת משם — כבר כן.' },
        ],
        then: [{ e: 'flag', flag: 'life:a1:done' }, { e: 'travel', to: 'home', spawn: 'start' }],
      },
      {
        lines: [
          { who: null, text: 'אתה לא זוכר את הדרך הביתה. אתה זוכר את היד סביב הרגל שלך שלא הרפתה.' },
          { who: null, text: 'לא בחרת להגיע לשם. מה נשאר לך ממנו — זה כבר שלך.' },
        ],
        then: [{ e: 'flag', flag: 'life:a1:done' }, { e: 'travel', to: 'home', spawn: 'start' }],
      },
    ],
  },
]

export const CONVERSATIONS_A2: Conversation[] = [
  {
    /**
     * הסמרטוט האדום — the only thing in 1984 that came out of 1983.
     *
     * A flag nobody reads is a promise the game made to itself and forgot, so the scrap of
     * cloth a five-year-old picked up off the concrete has to be findable in the bedroom
     * two years later. It does nothing: it is not a key, it does not open a door and
     * nothing about the day changes because of it. It is a thing you kept, and the game's
     * position on things you kept is that keeping them is the point.
     *
     * The `when` reads `life:a1:red`, which is the prefix that survives a year change.
     */
    id: 'a2-scrap',
    nameHe: null,
    branches: [
      {
        when: { flag: 'life:a1:red' },
        lines: [
          { who: null, text: 'מתחת לכרית, פיסת בד אדומה. היא הייתה גדולה יותר כשהבאת אותה.' },
          { who: null, text: 'אתה לא זוכר מאיפה. אתה זוכר שהיה רועש, ושהיית גבוה.' },
        ],
        then: [{ e: 'redheart', key: 'historyMemory', delta: 2 }],
      },
      {
        lines: [{ who: null, text: 'מיטה, שמיכה, וקיר. מתחת לכרית אין כלום.' }],
      },
    ],
  },

  {
    id: 'rachel-a2',
    nameHe: 'רחל',
    branches: [
      { when: { flag: 'a2:bread' }, lines: [{ who: 'רחל', text: 'תודה. תשים על השיש. עכשיו לך, לפני שאני מוצאת לך עוד משהו.' }] },
      {
        lines: [{ who: 'רחל', text: 'לחם. רפי. על החשבון. ואל תרוץ בכביש.' }],
        /**
         * שלוש תשובות לאותה בקשה, ושתיים מהן אומרות "כן" — ההבדל ביניהן הוא מה שקורה
         * לשעה.
         *
         * *"טוב"* מקבל את הבקשה כמו שהיא. *"אחרי המשחק, טוב?"* דוחה אותה בלי לנקוב בשום
         * דבר, והיא עונה לגב שלך. השלישית היא הבחירה שלא הייתה כאן: **לנקוב בשעה מראש.**
         * לא לבקש רשות לאחר — להציע מועד אחר ולעמוד בו.
         *
         * זה מה ש-`ACH_NEW_PLAN` ("שיניתי בלי להיעלם") ביקש מאז שנכתב, והסיבה שהוא חיכה
         * כתובה בשורת ההמתנה שלו: *"אין עדיין מנגנון של סיכום מחדש לפני המועד."* עכשיו יש,
         * והוא בן שש: הילד הראשון שמבין שאפשר לא לוותר על המגרש **ולא** להפר — צריך רק
         * להגיד את זה לפני, ואז להגיע.
         *
         * `promise_renegotiated` ו-`promise_kept` נושאים את אותו `subjectHe` בדיוק, כי
         * ההישג מצליב נושא ולא מפתח (`sameSubject`), וההבטחה הזאת היא דבר אחד: הלחם.
         */
        choices: [
          { id: 'ok', text: '"טוב."', then: [{ e: 'flag', flag: 'a2:errand' }, { e: 'rel', who: 'rachel', axis: 'bond', delta: 2 }, { e: 'personality', key: 'reliability', delta: 2 }] },
          { id: 'five', text: '"אני קודם יורד למגרש. הלחם יהיה פה לפני חמש."', then: [{ e: 'flag', flag: 'a2:errand' }, { e: 'flag', flag: 'a2:agreed' }, { e: 'proof', kind: 'promise_renegotiated', proofId: 'promise_renegotiated:{chapter}:bread', subjectHe: BREAD_PROMISE, noteHe: 'לא ביקש לאחר. נקב בשעה, מראש.' }, { e: 'personality', key: 'honesty', delta: 3 }, { e: 'rel', who: 'rachel', axis: 'trust', delta: 2 }, { e: 'toast', text: '"לפני חמש," היא חזרה אחריך. ככה היא סוגרת דברים.', tone: 'plain' }] },
          { id: 'after', text: '"אחרי המשחק, טוב?"', then: [{ e: 'flag', flag: 'a2:errand' }, { e: 'flag', flag: 'a2:after' }, { e: 'rel', who: 'rachel', axis: 'tension', delta: 2 }, { e: 'toast', text: '"אחרי המשחק אין לחם." היא אמרה את זה לגב שלך.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'rafi-a2',
    nameHe: 'רפי מהקיוסק',
    branches: [
      { when: { flag: 'a2:bread' }, lines: [{ who: 'רפי מהקיוסק', text: 'עוד לחם? מה אתם עושים איתו, בונים?' }] },
      /**
         * אותו לחם, ושתי שורות בפנקס — לפי השעה שעל הקיר מאחורי רפי.
         *
         * מי שהגיע לפני חמש קיים את מה שאמר, ולכן נרשמת `promise_kept` על **אותו נושא**
         * שהסיכום מראש נרשם עליו. מי שהגיע אחרי — הלחם עדיין נכנס לשקית, הפרק לא נעצר,
         * ושום דבר לא מודיע לו שהוא איחר: הפנקס פשוט לא רושם ראיה שלא קרתה (כלל 11).
         *
         * חמש היא השעה שהילד עצמו נקב בה בענף `five`, והיא נכתבת פעם אחת (`BREAD_BY`).
         */
      {
        when: { flag: 'a2:errand', beforeMinute: BREAD_BY },
        lines: [{ who: 'רפי מהקיוסק', text: 'לחם לרחל. על החשבון — תשאיר את המטבעות בכיס. ותגיד לה שהחשבון כבר לא זוכר את עצמו.' }],
        then: [{ e: 'flag', flag: 'a2:bread' }, { e: 'time', minutes: 6 }, { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:bread', subjectHe: BREAD_PROMISE, noteHe: 'הלחם היה על השיש לפני חמש.' }, { e: 'personality', key: 'reliability', delta: 2 }, { e: 'sfx', key: 'bell-shop', level: 0.5 }, { e: 'toast', text: 'לחם חם. הנייר נרטב מהחום.', tone: 'plain' }],
      },
      {
        when: { flag: 'a2:errand' },
        lines: [{ who: 'רפי מהקיוסק', text: 'לחם לרחל. האחרון. על החשבון, כמו תמיד — ותגיד לה שהגעת עכשיו.' }],
        then: [{ e: 'flag', flag: 'a2:bread' }, { e: 'time', minutes: 6 }, { e: 'sfx', key: 'bell-shop', level: 0.5 }, { e: 'toast', text: 'לחם, כבר לא חם. הוא הוציא אותו מתחת לדלפק.', tone: 'plain' }],
      },
      {
        lines: [{ who: 'רפי מהקיוסק', text: 'ילד. אתה קונה, או שאתה עומד לי בשמש?' }],
        choices: [
          {
            id: 'packet',
            text: 'מעטפת סופרגול. 1 ₪.',
            when: { minAgorot: 100 },
            noteHe: 'אין לך מספיק',
            then: [{ e: 'packet' }],
          },
          {
            id: 'album',
            text: 'לפתוח את האלבום.',
            when: { flag: 'album:seen' },
            hidden: true,
            then: [{ e: 'album' }],
          },
          { id: 'no', text: 'רק עומד.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'alley-a2',
    nameHe: null,
    branches: [
      { when: { flag: 'a2:played' }, lines: [{ who: null, text: 'שיחקת. הברך שרוטה והרגליים עוד זוכרות.' }] },
      {
        when: { flag: 'a2:full' },
        lines: [{ who: 'אופיר', text: 'מלא. שניים־שניים ואחד בשער. תעמוד בצד, תספור, מי שמפסיד יוצא.' }, { who: 'עמית', text: 'ספירה זה גם תפקיד. השאלה היא מי נותן לך אותו.' }],
        then: [{ e: 'flag', flag: 'a2:late' }, { e: 'rel', who: 'ofir', axis: 'familiarity', delta: 1 }, { e: 'rel', who: 'amit', axis: 'bond', delta: 2 }, { e: 'time', minutes: 40 }, { e: 'ending', id: 'late' }],
      },
      {
        lines: [{ who: 'אופיר', text: 'פוגי, איתי. אתה מאחורה. לא לגעת ביד, ולא לברוח מהכדור.' }],
        choices: [
          { id: 'play', text: 'להיכנס.', then: [{ e: 'flag', flag: 'a2:played' }, { e: 'rel', who: 'ofir', axis: 'bond', delta: 4 }, { e: 'rel', who: 'efi', axis: 'familiarity', delta: 2 }, { e: 'remember', who: 'ofir', eventId: 'first-team-1984', significance: 'major' }, { e: 'wellbeing', key: 'happiness', delta: 6 }, { e: 'sfx', key: 'ball-kick', level: 0.7 }, { e: 'minigame', id: 'football' }] },
          { id: 'watch', text: 'לעמוד ולראות קודם.', then: [{ e: 'personality', key: 'curiosity', delta: 1 }, { e: 'toast', text: '"תעמוד. אבל תעמוד רחוק מהשער."', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    /**
     * אפי, באביב 1984 — the sentence that decides whether the autumn happens.
     *
     * Stage A §7 asks that the Ussishkin branch open "only after meaningful Efi engagement
     * in A2" and that skipping it cost something real. This is the engagement: a boy with a
     * basketball under his arm at the edge of a football game he will not be picked for,
     * saying the thing children say when they want to be asked about the thing they love.
     * Answering him raises `life:a2:efi`, which is what `a3-hall`'s `when` reads two
     * autumns later.
     *
     * There is no prompt and no marker on him, and that is the cost working both ways: a
     * player who talks to everybody finds it, and a player who goes straight to the
     * football — which is exactly what the day is asking him to do — does not, and gets a
     * different childhood. Efi remembers either way.
     */
    id: 'efi-a2',
    nameHe: 'אפי',
    branches: [
      {
        when: { flag: 'life:a2:efi' },
        lines: [{ who: 'אפי', text: 'אמרתי לך. באחד הימים.' }],
      },
      {
        lines: [
          { who: null, text: 'אפי לא נכנס. הוא עומד בצד עם כדור אחר — כתום, גדול, מנוקד.' },
          { who: 'אפי', text: 'אתה יודע שיש עוד משחק? לא כזה. בפנים, על עץ.' },
        ],
        choices: [
          {
            id: 'ask',
            text: '"איפה בפנים?"',
            then: [
              { e: 'flag', flag: 'life:a2:efi' },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 4 },
              { e: 'redheart', key: 'basketballLove', delta: 3 },
              { e: 'remember', who: 'efi', eventId: 'asked-about-the-hall-1984', significance: 'major' },
              { e: 'toast', text: '"לא עכשיו. באחד הימים אני לוקח אותך." הוא אמר את זה כמו הבטחה, ולא כמו תירוץ.', tone: 'plain' },
            ],
          },
          {
            id: 'shrug',
            text: '"כדורסל זה לבנות."',
            then: [
              { e: 'rel', who: 'efi', axis: 'distance', delta: 3 },
              { e: 'remember', who: 'efi', eventId: 'said-that-in-1984', significance: 'major' },
              { e: 'toast', text: 'הוא לא ענה. הוא הלך לקיר עם הכדור הכתום והמשיך לבד.', tone: 'plain' },
            ],
          },
          { id: 'later', text: 'לא עכשיו. הקבוצות מתמלאות.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'a2-after-game',
    nameHe: null,
    branches: [
      { when: { flag: 'a2:after' }, lines: [{ who: null, text: 'חושך כמעט. התריס של רפי כבר למטה. הלחם יחכה למחר, והיא לא תגיד כלום.' }], then: [{ e: 'flag', flag: 'a2:done' }, { e: 'time', minutes: 30 }, { e: 'ending', id: 'played' }] },
      /**
       * ומי שנקב בשעה ולא עמד בה — הערב נגמר אותו דבר, והיא אומרת משפט אחד.
       *
       * בלי דגל, בלי קנס ובלי הודעה: הראיה פשוט לא נרשמה. מה שכן — הילד שמע את עצמו
       * מבטיח שעה, ולכן הוא שומע גם מה קרה לשעה הזאת. הבטחה שאיש לא מזכיר היא הבטחה
       * שלא הייתה.
       */
      { when: { all: [{ flag: 'a2:agreed' }], none: [{ flag: 'a2:bread' }] }, lines: [{ who: null, text: 'חושך כמעט. התריס של רפי למטה, ובמטבח אמא מסדרת את השולחן לארוחה בלי לחם.' }, { who: 'רחל', text: 'אמרת לפני חמש.' }, { who: null, text: 'היא לא אמרה את זה בכעס. היא אמרה את זה כמו מישהי שרשמה.' }], then: [{ e: 'flag', flag: 'a2:done' }, { e: 'rel', who: 'rachel', axis: 'trust', delta: -3 }, { e: 'time', minutes: 30 }, { e: 'ending', id: 'played' }] },
      { lines: [{ who: null, text: 'חושך כמעט. הלחם בבית, הרגליים כואבות, וזה הרגיש כמו משהו שתרצה שוב מחר.' }], then: [{ e: 'flag', flag: 'a2:done' }, { e: 'time', minutes: 30 }, { e: 'ending', id: 'played' }] },
    ],
  },
]

// -------------------------------------------------------------- A3 · the second house ---

export function objectiveA3(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a3:done']) return null
  if (state.flags['a3:inside']) {
    // inside, and the day is no longer about getting in — it is about being here. The
    // lines still point at the floor and the stand, because that is what a boy does in a
    // hall he has never been in; none of them is a requirement any more (§milestones).
    if (state.flags['a3:ready'] || state.flags['life:seen:ussishkin']) return 'ראית. להישאר עוד — או לאפי: "בוא נלך."'
    if (state.flags['a3:experienced']) return 'אתה בפנים. אפשר להסתובב; אפי לידך.'
    if (!state.flags['a3:experienced']) return 'נכנסת. תן למקום לקרות.'
    return 'האולם סביבך. אפי לידך.'
  }
  if (sceneId === 'ussishkin-outside') return 'התור לדלת. אפי מכיר את הסדרן, והסדרן אוהב שמות.'
  if (state.flags['knows:hall'] || state.flags['life:knows:hall']) return 'ללכת עם אפי — דרך מרכז תל אביב.'
  return 'אפי מחכה ברחוב. תשאל אותו לאן.'
}

export const ENDINGS_A3: Record<string, EndingCard> = {
  hall: {
    id: 'hall',
    titleHe: 'הבית האדום השני',
    bodyHe: 'הסדרן ידע את השם של אפי. ואז שאל את שלך, ואמר אותו בקול, כאילו זה דבר שאומרים. בפנים: פרקט ששוקע, גג פח שמטפטף על השורה הראשונה, וכדור שעשה קול אחר מכל כדור ששמעת. לא ראית משחק. ראית מקום.',
    memoryHe: 'הסדרן שאמר את השם שלך.',
    memoryItem: 'ticket-stub',
  },
  door: {
    id: 'door',
    titleHe: 'עד הדלת',
    bodyHe: 'הגעת עד הדלת ולא נכנסת. אפי נכנס. שמעת מבחוץ את הרעש שנשמע כמו גשם, וחיכית לו על המדרגה. כשיצא הוא לא שאל למה. הוא אמר "בפעם הבאה", וזה נשמע כמו הבטחה של מישהו שמקיים.',
    memoryHe: 'הרעש מבחוץ, כמו גשם.',
    memoryItem: 'coin',
  },
}

export const BEATS_A3: Beat[] = [
  {
    id: 'a3-open',
    at: 'street',
    trigger: 'enter',
    when: { none: [{ flag: A3 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A3 },
      { a: 'lines', lines: [{ who: null, text: 'אותו רחוב, שנה אחרי. אתה כבר יודע איפה הבור במדרכה.' }, { who: 'אפי', text: 'פוגי. יש מקום שאתה לא מכיר ואני כן. אחרי הקיר, ימינה — למרכז תל אביב. בוא.' }] },
    ],
  },
  {
    /**
     * להיכנס לאולם — and then to be in it.
     *
     * This beat used to end the chapter nine hundred milliseconds after the boy walked
     * through the door. Everything the hall is made of — the parquet, the stand, the
     * windows, the usher, the smell off the counter, all of it already painted and already
     * written — was on the far side of an ending card nobody could get past. Maor's
     * sentence for the whole of Stage A, *"המשימות לא זורמות"*, is largely this: rooms that
     * end instead of rooms you are in.
     *
     * So arriving is now a MILESTONE and not a curtain. The day closes when the boy has
     * actually looked at the place (`a3-seen`), or when Efi decides it is time
     * (`efi-a3-hall`), or when the evening runs out (`a3-late`). Three ways out of one
     * room, and the room is open the whole time.
     */
    id: 'a3-hall',
    at: 'ussishkin-hall',
    trigger: 'enter',
    when: { flag: A3, none: [{ flag: 'a3:inside' }] },
    delayMs: 900,
    do: [
      { a: 'flag', flag: 'a3:inside' },
      { a: 'sfx', key: 'ball-bounce', level: 0.6 },
      { a: 'lines', lines: [{ who: null, text: 'פרקט. גובה. אור מהחלונות למעלה, ריח של גרעינים ונקניקיות מהמזנון, ורעש של הרבה אנשים בחדר סגור — כמו גשם על גג פח.' }, { who: 'אפי', text: 'זה אוסישקין. גם זה הפועל. אבא שלך לא סיפר לך?' }, { who: 'אפי', text: 'תסתובב. תראה. אני פה, לא בורח.' }] },
      /**
       * (delta 90, §7 A3) the embodied memory arrives by itself: a warm-up ball gets away
       * and stops on his shoes. The WORLD hands it to him — he does not have to find it —
       * and what his body does with it is `a3-ball` (the hotspot at his feet).
       */
      { a: 'toast', text: 'כדור כתום בורח מהחימום, מתגלגל לאורך הקו ונעצר על הנעליים שלך.', tone: 'red' },
      { a: 'events', events: [{ t: 'redheart.changed', key: 'basketballLove', delta: 4 }] },
    ],
  },
  {
    /**
     * שראה את המקום — the day ends when the boy has actually looked at three things.
     *
     * Not a checklist he is shown: the room simply notices. Two of the four are enough to
     * have been somewhere; the third is what makes it a memory, and the number is small
     * enough that anybody who wanders at all will reach it without being told to.
     */
    // (delta 90, §12 authored exit) seeing the place no longer closes the evening FOR him:
    // it used to end the day 1.2 s after the second thing he looked at, and "בוא נלך" —
    // the one sentence §12 names for A3 — was never his to say. Now the room tells him the
    // evening is his to end (Efi at the rail); `a3-late` (20:40) is still the floor.
    id: 'a3-seen',
    trigger: 'clock',
    /*
     * 7.9.2026 — this used to read `saw:parquet` AND `saw:stand`, two hotspots on a floor
     * and a rail, and a boy who missed them stood in the hall until the 20:40 backstop
     * closed the day for him. The milestone (`world/milestones.ts`) is the experience:
     * either he looked at both things, or Efi showed him the place. Looking is still the
     * richer route and still what the conversation rewards; it is no longer the only key.
     */
    when: {
      flag: 'a3:inside',
      all: [{ flag: 'life:seen:ussishkin' }],
      none: [{ flag: 'a3:done' }, { flag: 'a3:ready' }],
    },
    delayMs: 1200,
    do: [{ a: 'flag', flag: 'a3:ready' }, { a: 'toast', text: 'אפי ליד המעקה מסמן לך בסנטר: "נו? מתי שתרצה."', tone: 'plain' }],
  },
  {
    /** and if he stands there until they turn the lights off, that is also an evening */
    id: 'a3-late',
    trigger: 'clock',
    when: { flag: 'a3:inside', afterMinute: at(20, 40), none: [{ flag: 'a3:done' }] },
    // (delta 90) `a3:done` is raised by `a3-leaving` itself: a boy who closed that box by
    // mistake used to have the evening marked over and no card, ever (the A2 fix, again)
    do: [{ a: 'talk', conversation: 'a3-leaving' }],
  },
  {
    id: 'a3-night',
    trigger: 'clock',
    when: { flag: A3, afterMinute: at(20, 0), none: [{ flag: 'a3:inside' }, { flag: 'a3:done' }] },
    do: [{ a: 'lines', lines: [{ who: null, text: 'חושך. אפי יצא מהדלת מזיע ולא שאל למה חיכית בחוץ.' }] }, { a: 'ending', id: 'door' }],
  },
]

export const CONVERSATIONS_A3: Conversation[] = [
  /**
   * (Director V3 §12, 25.9.2026) A3 — "למצוא דרך / כניסה / מקום באולם בפועל". Three things
   * the body does in the second red house: squeeze through the queue to the usher, find a
   * step in the stand, and send a ball back to the floor. Each is new; the usher, Efi and
   * the evening's close are the chapter's own words.
   */
  {
    id: 'a3-queue',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'התור צפוף, וכולם בו גבוהים ממך. אפי מושך אותך בשרוול בין שני מעילים, צעד ועוד צעד, עד שהדלת כבר מולך.' }],
        then: [{ e: 'flag', flag: 'a3:queued' }, { e: 'time', minutes: 4 }, { e: 'goto', node: 'usher-a3' }],
      },
    ],
  },
  {
    id: 'a3-step',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'מצאת מקום על מדרגה, בין ברך של מישהו לתיק של מישהו אחר. מפה רואים את כל הפרקט, ואת הטיפות מהגג נופלות על השורה הראשונה.' },
          { who: 'אפי', text: 'פה. מפה רואים הכל, ואף אחד לא מזיז אותך.' },
        ],
        then: [{ e: 'flag', flag: 'a3:seat' }, { e: 'flag', flag: 'saw:stand' }, { e: 'rel', who: 'efi', axis: 'bond', delta: 2 }, { e: 'redheart', key: 'community', delta: 2 }],
      },
    ],
  },
  {
    /**
     * הכדור שהגיע אליך — §7 A3's one embodied memory. Three things a six-year-old's body
     * does with a ball that is suddenly his, and none of them is wrong: send it back the
     * way it came, bounce it once on the parquet to hear the hall answer, or hold it until
     * somebody comes for it. Each is remembered differently; all three are "I touched it".
     */
    id: 'a3-ball',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הכדור על הנעליים שלך. הוא כבד יותר ממה שנראה, והעור שלו מחוספס כמו קיר. מהקו מסתכלים לראות מי יחזיר אותו.' },
        ],
        choices: [
          {
            id: 'roll',
            text: 'לגלגל אותו בחזרה לפרקט.',
            then: [{ e: 'flag', flag: 'a3:ball' }, { e: 'flagValue', flag: 'life:a3:ball', value: 'rolled' }, { e: 'flag', flag: 'saw:parquet' }, { e: 'sfx', key: 'ball-bounce', level: 0.5 }, { e: 'redheart', key: 'basketballLove', delta: 3 }, { e: 'toast', text: 'שחקן בגובה של דלת מרים יד, בלי להסתכל מי.', tone: 'plain' }],
          },
          {
            id: 'bounce',
            text: 'להקפיץ אותו פעם אחת. בשתי ידיים.',
            then: [{ e: 'flag', flag: 'a3:ball' }, { e: 'flagValue', flag: 'life:a3:ball', value: 'bounced' }, { e: 'flag', flag: 'saw:parquet' }, { e: 'sfx', key: 'ball-bounce', level: 0.8 }, { e: 'redheart', key: 'basketballLove', delta: 4 }, { e: 'personality', key: 'courage', delta: 1 }, { e: 'toast', text: 'בום. הרצפה ענתה לך, וחצי יציע הסתובב לראות. מישהו מחא כף אחת.', tone: 'red' }],
          },
          {
            id: 'hold',
            text: 'להחזיק אותו חזק עד שיבואו לקחת.',
            then: [{ e: 'flag', flag: 'a3:ball' }, { e: 'flagValue', flag: 'life:a3:ball', value: 'held' }, { e: 'flag', flag: 'saw:parquet' }, { e: 'redheart', key: 'basketballLove', delta: 3 }, { e: 'rel', who: 'efi', axis: 'bond', delta: 1 }, { e: 'toast', text: 'שחקן כורע מולך ומושיט ידיים. "תודה, גבר." הוא לוקח אותו כמו שלוקחים ממישהו משהו חשוב.', tone: 'plain' }],
          },
        ],
      },
    ],
  },
  {
    id: 'efi-a3',
    nameHe: 'אפי',
    branches: [
      { when: { at: 'ussishkin-outside' }, lines: [{ who: 'אפי', text: 'זה פה. הסדרן מכיר אותי בשם. תגיד לו את שלך, הוא אוהב שמות.' }] },
      // `life:` as well as the day flag: a place you have been told about stays told
      // about. `knows:hall` is cleared with every other flag at midnight (§day.entered),
      // which is right for a beat and wrong for a street that now exists in his head.
      /**
       * "אחרי הקיר, ימינה" is how a six-year-old gives directions and it is the right line.
       * It is also, on its own, not navigation — Maor stood in that street on 6.9.2026 and
       * could not tell which of six painted doorways it meant. So Efi says it and then says
       * the name of the turning, the way a child who has actually been somewhere does:
       * first the landmark he remembers, then the words the grown-ups use.
       */
      {
        lines: [
          { who: 'אפי', text: 'אחרי הקיר, ימינה. זה מרכז תל אביב, ומשם אלנבי.' },
          { who: 'אפי', text: 'אני הולך. אתה בא או לא?' },
        ],
        then: [
          { e: 'flag', flag: 'knows:hall' },
          { e: 'flag', flag: 'life:knows:hall' },
          { e: 'toast', text: 'בקצה הרחוב, ליד הקיר: "למרכז תל אביב".', tone: 'plain' },
        ],
      },
    ],
  },
  {
    /**
     * אפי, בפנים — the person you came with, in the room you came to.
     *
     * A3's whole point is that somebody your own age knows a door you do not, and that
     * behind it is a second red house. Until 6.9.2026 he said one line outside and then the
     * chapter ended on the threshold. Now he is standing at the rail, and he is the way
     * out of the evening as well as the way into it: talk to him when you have seen enough
     * and the night closes on what you actually looked at.
     */
    id: 'efi-a3-hall',
    nameHe: 'אפי',
    branches: [
      {
        when: { any: [{ flag: 'life:seen:ussishkin' }, { all: [{ flag: 'saw:parquet' }, { flag: 'saw:stand' }] }] },
        lines: [{ who: 'אפי', text: 'נו? אמרתי לך.' }],
        choices: [
          {
            id: 'go',
            text: '"בוא נלך."',
            then: [{ e: 'goto', node: 'a3-leaving' }],
          },
          {
            id: 'stay',
            text: '"עוד קצת."',
            then: [{ e: 'redheart', key: 'basketballLove', delta: 2 }, { e: 'rel', who: 'efi', axis: 'bond', delta: 2 }, { e: 'toast', text: '"בסדר. אני פה." הוא חוזר להסתכל על החימום.', tone: 'plain' }],
          },
        ],
      },
      {
        when: { flag: 'saw:parquet' },
        lines: [
          { who: 'אפי', text: 'הרצפה, כן. עכשיו תסתכל למעלה — על היציע. שם עומדים אלה שבאים כל שבוע.' },
        ],
      },
      {
        lines: [
          { who: 'אפי', text: 'אל תעמוד בדלת. תיכנס. תסתכל על הרצפה קודם, כולם מסתכלים על הרצפה קודם.' },
          { who: null, text: 'הוא אמר את זה כמו מישהו שמראה לך את הבית שלו, ולא כמו מישהו שהביא אותך למקום.' },
        ],
        // being shown the place by the person who brought you here is the visit
        then: [{ e: 'flag', flag: 'a3:shown' }],
      },
    ],
  },
  {
    /** the way the evening ends, whichever of the three doors closed it */
    id: 'a3-leaving',
    nameHe: null,
    branches: [
      {
        when: { flag: 'saw:windows' },
        lines: [
          { who: null, text: 'בחוץ כבר חושך, והחלונות שהסתכלת עליהם מבפנים נראים עכשיו כמו פס אור צהוב מעל הרחוב.' },
          { who: 'אפי', text: 'בשבוע הבא יש עוד. אל תשאל את אבא שלך, פשוט תבוא.' },
        ],
        then: [{ e: 'flag', flag: 'a3:done' }, { e: 'flag', flag: 'life:knows:hall' }, { e: 'rel', who: 'efi', axis: 'bond', delta: 3 }, { e: 'ending', id: 'hall' }],
      },
      {
        lines: [
          { who: null, text: 'יצאתם כשעוד שמעו את הכדור מבפנים. ברחוב היה קר, ולא היה אכפת לך.' },
          { who: 'אפי', text: 'בשבוע הבא יש עוד.' },
        ],
        then: [{ e: 'flag', flag: 'a3:done' }, { e: 'flag', flag: 'life:knows:hall' }, { e: 'rel', who: 'efi', axis: 'bond', delta: 2 }, { e: 'ending', id: 'hall' }],
      },
    ],
  },
  {
    id: 'usher-a3',
    nameHe: 'סדרן',
    branches: [
      { when: { flag: 'a3:named' }, lines: [{ who: 'סדרן', text: 'פוגי. יאללה פנימה. תישאר ליד אפי, ואל תשב מתחת לחור בגג.' }] },
      {
        lines: [{ who: 'סדרן', text: 'אפי. ומי זה איתך?' }],
        choices: [
          { id: 'name', text: '"פוגי."', then: [{ e: 'flag', flag: 'a3:named' }, { e: 'flag', flag: 'entry:granted' }, { e: 'redheart', key: 'basketballLove', delta: 4 }, { e: 'redheart', key: 'community', delta: 3 }, { e: 'remember', who: 'usher', eventId: 'said-my-name-1984', significance: 'major' }, { e: 'toast', text: '"פוגי." הוא אמר את זה בקול. כאילו זה דבר שאומרים.', tone: 'plain' }] },
          { id: 'quiet', text: 'לשתוק ולהסתכל על הרצפה.', then: [{ e: 'personality', key: 'courage', delta: -1 }, { e: 'toast', text: '"ביישן. בסדר. אפי, הוא איתך?" אפי אמר שכן.', tone: 'plain' }, { e: 'flag', flag: 'entry:granted' }] },
        ],
      },
    ],
  },
]

// ------------------------------------------------------------------- A4 · the shirt ---

/**
 * מה שרפי מבקש — thirty shekels, from the table, not from a guess.
 *
 * It was 1800 (eighteen shekels) until 5.9.2026, which made the chapter about counting a
 * tin winnable without counting anything. Maor set the price of a shirt in the eighties at
 * thirty, and the afternoon around it grew the work to match (`lib/life/gigs.ts`).
 */
export const SHIRT_PRICE = shirtAgorot('a4-shirt')

export function objectiveA4(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['own:shirt85']) return null
  if (state.agorot >= SHIRT_PRICE) return 'יש את ה־30. לרפי, לפני שבע.'
  // the thirty exists, but part of it is still under the bed — and Rafi counts hands
  if (state.savings + state.agorot >= SHIRT_PRICE) return 'יש את ה־30, אבל חלק בפחית. לרוקן, ואז לרפי.'
  if (sceneId === 'bedroom') return 'החולצה עולה 30. מה שחסכת עוד לא מספיק. רפי סוגר בשבע.'
  return 'צריך 30. בקבוקים, שליחויות, ומה שאבא נותן — עד שבע.'
}

export const ENDINGS_A4: Record<string, EndingCard> = {
  shirt: {
    id: 'shirt',
    titleHe: 'החולצה',
    bodyHe: 'ספרת את הפחית שלוש פעמים. רפי ספר פעם אחת ונתן. אדומה, צווארון וי לבן, בלי מספר ובלי שם, גדולה עליך בשתי מידות כי "תגדל". לא לבשת אותה. השארת אותה על הכיסא ליד המיטה, שתראה אותה בבוקר.',
    memoryHe: 'החולצה על הכיסא, לפני שהיא הייתה שלך באמת.',
    memoryItem: 'folded-paper',
  },
  notYet: {
    id: 'notYet',
    titleHe: 'עוד לא',
    bodyHe: 'לא הספיק. רפי הוריד את התריס ואמר "בשבוע הבא היא עוד פה", ואתה ידעת שהוא אומר את זה כדי שתלך הביתה. הפחית חזרה מתחת למיטה כבדה יותר מבבוקר. זה לא היה הפסד. זה היה תרגול.',
    memoryHe: 'הפחית, כבדה יותר.',
    memoryItem: 'coin',
  },
  gave: {
    id: 'gave',
    titleHe: 'ויתרת על משהו',
    bodyHe: 'אמא הייתה צריכה את מה שבפחית ולא ביקשה. ראית את הפנים שלה מעל הארנק הפתוח, ושמת הכל על השולחן. החולצה נשארה בחלון עוד חודש. כשקנית אותה בסוף, היא הייתה עוד יותר גדולה עליך.',
    memoryHe: 'הפחית ריקה על השולחן במטבח.',
    memoryItem: 'coin',
  },
}

export const BEATS_A4: Beat[] = [
  {
    id: 'a4-open',
    at: 'bedroom',
    trigger: 'enter',
    when: { none: [{ flag: A4 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A4 },
      { a: 'events', events: [{ t: 'savings.changed', agorot: 1200, why: 'הפחית' }, { t: 'money.changed', agorot: 200, why: 'מהכיס' }] },
      { a: 'lines', lines: [{ who: null, text: 'קיץ. אתה בן שבע. בחלון של רפי תלויה חולצה אדומה עם צווארון וי לבן, בלי מספר ובלי שם.' }, { who: null, text: 'מתחת למיטה שלך יש פחית עם חריץ. רפי סוגר בשבע.' }] },
      // The tin is the decision, not a scavenger-hunt hotspot.
      { a: 'talk', conversation: 'tin-a4' },
    ],
  },
  {
    /**
     * (delta 90, §7 A4 "make the family-wallet decision emotionally visible") — the purse
     * on the table used to be a branch of `rachel-a4` that only a boy who happened to talk
     * to his mother after emptying the tin ever saw. It is the one moment in the chapter
     * where the thirty shekels have a second owner, so it now happens where he walks: the
     * first time he comes into the flat with the tin's coins in his pocket, she is at the
     * table with it open. Keep or give is still his; nobody asks.
     */
    id: 'a4-wallet',
    at: 'home',
    trigger: 'enter',
    when: { flag: 'a4:tin', none: [{ flag: 'a4:wallet-seen' }, { flag: 'own:shirt85' }, { flag: 'a4:gave' }] },
    delayMs: 800,
    do: [{ a: 'flag', flag: 'a4:wallet-seen' }, { a: 'talk', conversation: 'rachel-a4' }],
  },
  {
    id: 'a4-close',
    trigger: 'clock',
    when: { flag: A4, afterMinute: at(19, 0), none: [{ flag: 'own:shirt85' }, { flag: 'a4:gave' }, { flag: 'a4:done' }] },
    do: [{ a: 'flag', flag: 'a4:done' }, { a: 'lines', lines: [{ who: null, text: 'התריס של רפי ירד בשבע, עם רעש. החולצה נשארה בפנים, בחושך.' }] }, { a: 'ending', id: 'notYet' }],
  },
]

export const CONVERSATIONS_A4: Conversation[] = [
  {
    id: 'tin-a4',
    nameHe: null,
    branches: [
      { when: { flag: 'own:shirt85' }, lines: [{ who: null, text: 'הפחית ריקה. החולצה על הכיסא.' }] },
      { when: { flag: 'a4:tin' }, lines: [{ who: null, text: 'הפחית ריקה. הכל בכיס עכשיו, וכל צעד מצלצל.' }] },
      {
        lines: [{ who: null, text: 'הפחית. מנערים ושופכים על השמיכה — 12 שקל במטבעות. עד 30 זה עוד הרבה.' }],
        choices: [
          { id: 'take', text: 'לרוקן הכל לכיס.', then: [{ e: 'flag', flag: 'a4:tin' }, { e: 'goto', node: 'tin-a4-out' }] },
          { id: 'leave', text: 'להשאיר. עוד לא.', then: [] },
        ],
      },
    ],
  },
  {
    id: 'tin-a4-out',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'המטבעות בכיס, והכיס מצלצל בכל צעד. זו עוד לא חולצה. זו התחלה.' }], then: [{ e: 'withdraw', agorot: 1200, why: 'הפחית' }, { e: 'sfx', key: 'coins', level: 0.6 }, { e: 'flagValue', flag: 'a4:tin', value: true }] }],
  },
  {
    id: 'bottles-a4',
    nameHe: null,
    branches: [
      { when: { flag: 'a4:bottles-all' }, lines: [{ who: null, text: 'הסמטה נקייה. אספת הכל, ועוד אף אחד לא שתה מאז.' }] },
      {
        lines: [{ who: null, text: 'חמישה בקבוקי פיקדון ליד הפח. מישהו לא רצה ללכת לרפי.' }],
        /**
         * (Director V3 §12, 25.9.2026) "עבודות אמיתיות דרך ChoreScene": the five bottles are
         * lying about the alley and collected by walking into them (`chore:story:bottles-85`),
         * and what is in the hand is what Rafi pays for at the counter.
         */
        choices: [
          { id: 'collect', text: 'לאסוף.', then: [{ e: 'minigame', id: 'chore:story:bottles-85' }] },
        ],
      },
    ],
  },
  {
    id: 'rafi-a4',
    nameHe: 'רפי מהקיוסק',
    branches: [
      { when: { flag: 'own:shirt85' }, lines: [{ who: 'רפי מהקיוסק', text: 'תלבש אותה בכבוד. ותכבס ביד.' }] },
      {
        when: { hasItem: 'bottle', flag: BOTTLES_ALL_85 },
        lines: [{ who: 'רפי מהקיוסק', text: 'בקבוקים? תביא. שקל לבקבוק. ואל תביא לי את המלוכלכים של הסמטה — טוב, תביא.' }],
        then: [{ e: 'take', item: 'bottle', count: 5 }, { e: 'flag', flag: 'a4:bottles-paid' }, { e: 'money', agorot: 500, why: 'פיקדון' }, { e: 'sfx', key: 'coins', level: 0.6 }, { e: 'toast', text: '5 ₪. הכיס מצלצל.', tone: 'plain' }],
      },
      /** fewer than five in the hand: a crate is five, and the rest are still by the bin */
      {
        when: { hasItem: 'bottle' },
        lines: [{ who: 'רפי מהקיוסק', text: 'בקבוקים? תביא. שקל לבקבוק.' }, { who: null, text: 'הוא סופר אותם על הדלפק באצבע אחת, ועוצר.' }, { who: 'רפי מהקיוסק', text: 'לא חמישה. אני לא פותח ארגז בשביל פחות. השאר עוד ליד הפח.' }],
      },
      {
        when: { minAgorot: SHIRT_PRICE },
        lines: [{ who: 'רפי מהקיוסק', text: 'החולצה? 30 שקל. יש לך? תספור על הדלפק, לא בכיס.' }],
        choices: [
          { id: 'buy', text: 'לספור על הדלפק. הכל.', then: [{ e: 'money', agorot: -SHIRT_PRICE, why: 'החולצה' }, { e: 'own', item: 'shirt85' }, { e: 'shirt', id: 'tveria85' }, { e: 'proof', kind: 'first_shirt_bought', proofId: 'first_shirt_bought:{chapter}', subjectHe: 'החולצה מהחלון של רפי', noteHe: 'נספרה על הדלפק, מטבע־מטבע' }, { e: 'redheart', key: 'footballLove', delta: 5 }, { e: 'personality', key: 'reliability', delta: 3 }, { e: 'remember', who: 'shopkeeper', eventId: 'bought-shirt-1985', significance: 'major' }, { e: 'sfx', key: 'coins', level: 0.7 }, { e: 'toast', text: 'הוא קיפל אותה פעמיים והכניס לשקית של לחם.', tone: 'red' }, { e: 'goto', node: 'rafi-a4-bought' }] },
          { id: 'wait', text: '"עוד לא. בשבוע הבא."', then: [{ e: 'toast', text: '"בשבוע הבא היא עוד פה." הוא לא היה בטוח.', tone: 'plain' }] },
        ],
      },
      {
        lines: [{ who: 'רפי מהקיוסק', text: 'החולצה? 30 שקל. אין לך 30. יש לך פנים של ילד שסופר בראש.' }],
        choices: [
          /**
           * (V3 §12) the crates are carried, one at a time, from the pile to the back door
           * (`chore:story:crates-85`), and the pay is counted per crate. The agreement is
           * what this choice says; the hour is what the hands do after it.
           */
          { id: 'work', text: '"יש משהו לעשות? לסדר, לסחוב?"', when: { none: [{ flag: 'a4:worked' }] }, noteHe: 'כבר סידרת לו את הארגזים היום.', then: [{ e: 'flag', flag: 'a4:worked' }, { e: 'proof', kind: 'paid_shift', proofId: 'paid_shift:{chapter}', subjectHe: 'הארגזים של רפי', noteHe: 'שעה וחצי של ארגזים, ושכר שנספר ביד' }, { e: 'personality', key: 'reliability', delta: 2 }, { e: 'minigame', id: 'chore:story:crates-85' }] },
          /**
           * הטובה — המשלוח למעלה (owner, 25.9.2026: "לאפשר להרוויח יותר").
           *
           * The chapter's own afternoon reached 29 ₪ against a 30 ₪ shirt, so the shirt hung
           * on the week's street job. This is the second money slot the anti-grind rule
           * allows (`favour:paid:<chapter>`, `activities.ts`): one paid favour, after the
           * crates, paid by the neighbour and not by Rafi — a run upstairs is not a shift.
           * Once a chapter, and only for a boy who already carried the crates: Rafi does not
           * send a stranger up with the milk.
           */
          {
            id: 'favour',
            text: '"יש עוד משהו? אני מהיר."',
            when: { flag: 'a4:worked', none: [{ flag: 'a4:favour' }] },
            noteHe: 'רפי כבר שלח אותך למעלה היום.',
            then: [
              { e: 'flag', flag: 'a4:favour' },
              { e: 'flag', flag: 'favour:paid:a4-shirt' },
              { e: 'time', minutes: 15 },
              { e: 'energy', delta: -6 },
              { e: 'money', agorot: 400, why: 'המשלוח למעלה' },
              { e: 'personality', key: 'reliability', delta: 1 },
              { e: 'rel', who: 'rafi', axis: 'trust', delta: 2 },
              { e: 'sfx', key: 'coins', level: 0.5 },
              { e: 'toast', text: '"למעלה, שלישית. חלב ולחם. היא משלמת, לא אני." היא שילמה לך בדלת — 4 ₪ — ואמרה: "תגיד לו שהחלב של אתמול היה חמוץ."', tone: 'plain' },
            ],
          },
          /**
           * המעטפה מול החולצה — the whole economy of this chapter in one row of choices.
           *
           * It sits UNDER the "is there anything to do" line on purpose. A shekel spent
           * here is a shekel that does not go into the thirty, and the boy is standing in
           * front of the shirt while he decides. That is the feature.
           */
          {
            id: 'packet',
            text: 'מעטפת סופרגול. 1 ₪.',
            when: { minAgorot: 100 },
            noteHe: 'אין לך מספיק',
            then: [{ e: 'packet' }],
          },
          {
            id: 'album',
            text: 'לפתוח את האלבום.',
            when: { flag: 'album:seen' },
            hidden: true,
            then: [{ e: 'album' }],
          },
          { id: 'no', text: '"רק מסתכל."', then: [] },
        ],
      },
    ],
  },
  {
    id: 'rafi-a4-bought',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'השקית ביד. הביתה, לא בריצה. בריצה היא יכולה ליפול.' }], then: [{ e: 'ending', id: 'shirt' }] }],
  },
  {
    /**
     * שני דגלים, לא אחד — ולמה זה לא קוסמטיקה.
     *
     * `a4:kobi` היה מורם בשני הענפים: זה שלוקח את החמישה שקל וזה שמסרב להם. הוא נכון
     * לשאלה שהוא נשאל עליה ("דיברנו על זה"), והוא חסר־ערך לכל שאלה על מימון — ולכן
     * `ACH_SHIRT_GIFT` לא היה ניתן להשגה בידי אף אחד: התנאי שלו הצביע על דגל שעלה גם
     * כשלא הייתה מתנה, אז הוא נכתב מלכתחילה מול `a4:kobi-gave`, דגל שלא קיים.
     *
     * `a4:kobi-gave` עולה עכשיו רק בענף שלוקח, לצד `gift_received` בפנקס. הענף שמסרב
     * לא רושם כלום — וזאת בדיוק הראיה השלילית ש-`ACH_SHIRT_SELF` דורש: הוא לא נשען על
     * "לא ראינו מתנה", הוא נשען על פנקס שרושם מתנה בכל פעם שיש אחת.
     */
    id: 'kobi-a4',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'a4:kobi' }, lines: [{ who: 'קובי', text: 'דיברנו על זה. השאר — שלך.' }] },
      {
        lines: [{ who: 'קובי', text: 'החולצה מהחלון של רפי? יפה. כמה חסר לך?' }],
        choices: [
          { id: 'ask', text: '"הרבה."', then: [{ e: 'flag', flag: 'a4:kobi' }, { e: 'flag', flag: 'a4:kobi-gave' }, { e: 'money', agorot: 500, why: 'מאבא' }, { e: 'proof', kind: 'gift_received', proofId: 'gift_received:{chapter}', subjectHe: 'קובי', noteHe: 'חמישה שקל מהכיס שלו, בלי לספור' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'toast', text: 'הוא הוציא 5 שקל מהכיס בלי לספור. "השאר שלך."', tone: 'plain' }] },
          { id: 'alone', text: '"אני אסתדר לבד."', then: [{ e: 'flag', flag: 'a4:kobi' }, { e: 'personality', key: 'stubbornness', delta: 2 }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 2 }, { e: 'toast', text: 'הוא הנהן. אצלו זה מחמאה.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'rachel-a4',
    nameHe: 'רחל',
    branches: [
      { when: { flag: 'a4:gave' }, lines: [{ who: 'רחל', text: 'אני מחזירה לך. כל שקל. שמעת?' }] },
      {
        when: { flag: 'a4:tin' },
        lines: [{ who: null, text: 'אמא ליד הארנק. הארנק פתוח, ואין בו הרבה. היא לא ביקשה. היא רק הסתכלה על הכיס שלך ואז על הרצפה.' }],
        choices: [
          { id: 'keep', text: 'להחזיק את הכיס ולשתוק.', then: [{ e: 'flag', flag: 'a4:kept' }, { e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'personality', key: 'stubbornness', delta: 1 }, { e: 'toast', text: 'היא סגרה את הארנק בלי קול. המטבעות בכיס שלך כבדים יותר ממה שהיו.', tone: 'plain' }] },
          { id: 'give', text: 'לשים את הכל על השולחן.', then: [{ e: 'flag', flag: 'a4:gave' }, { e: 'money', agorot: -1200, why: 'לאמא' }, { e: 'rel', who: 'rachel', axis: 'bond', delta: 8 }, { e: 'remember', who: 'rachel', eventId: 'gave-the-tin-1985', significance: 'major' }, { e: 'personality', key: 'empathy', delta: 4 }, { e: 'ending', id: 'gave' }] },
        ],
      },
      { lines: [{ who: 'רחל', text: 'החולצה? יפה. רק שתדע — ארבע כביסות והיא ורודה, ואני לא קונה לך שנייה.' }] },
    ],
  },
]

// ----------------------------------------------------------------- A5 · in your shirt ---

export function objectiveA5(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a5:there']) return null
  if (!state.flags['a5:dressed']) return 'שבת. משחק. אבא מחכה למטה. תתלבש לבד.'
  if (state.flags['a5:in']) return 'הברזל שאבא אמר. בפתח המנהרה.'
  if (sceneId === 'bloomfield-outside') return 'שער 7. אבא. הקרוסלה.'
  return 'לבלומפילד. בחולצה.'
}

export const ENDINGS_A5: Record<string, EndingCard> = {
  there: {
    id: 'there',
    titleHe: 'בחולצה שלך',
    bodyHe: 'התלבשת לבד, קשרת שרוכים לבד, ירדת את המדרגות לבד. אבא חיכה ליד האוטו ולא אמר על החולצה כלום, רק הסתכל שנייה יותר מדי. בשער 7 מישהו אמר "הנה עוד אחד" והתכוון אליך. זה הזיכרון.',
    memoryHe: '"הנה עוד אחד."',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
  late: {
    id: 'late',
    titleHe: 'אחרי שהתחיל',
    bodyHe: 'לקח לך זמן. החולצה הפוכה, הנעל השנייה, השרוך. אבא חיכה ואחר כך לא חיכה. הגעת אחרי השריקה, ובשער 7 מישהו הזיז את עצמו כדי שתראה. את המשחק לא זכרת. את החולצה כן.',
    memoryHe: 'החולצה הפוכה, והתווית מגרדת.',
    memoryItem: 'ticket-stub',
    presence: 'late',
  },
}

export const BEATS_A5: Beat[] = [
  {
    id: 'a5-open',
    at: 'bedroom',
    trigger: 'enter',
    when: { none: [{ flag: A5 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A5 },
      { a: 'events', events: [{ t: 'money.changed', agorot: 200, why: 'לדרך' }] },
      { a: 'lines', lines: [{ who: null, text: 'שבת, אחת בצהריים. החולצה על הכיסא, מקופלת כמו שרפי קיפל אותה. מהרחוב — צפירה של האוטו של אבא, פעם אחת, קצרה.' }, { who: 'קובי', text: '(מלמטה) פוגי! רבע שעה!' }] },
      // Dressing is the scene's dramatic decision. Do not require the player to find the chair.
      { a: 'talk', conversation: 'shirt-a5' },
    ],
  },
  {
    id: 'a5-ground',
    at: 'bloomfield-outside',
    trigger: 'enter',
    when: { flag: A5, flagIs: { flag: 'a5:dressed', value: true }, none: [{ flag: 'a5:there' }] },
    delayMs: 900,
    do: [
      { a: 'flag', flag: 'a5:there' },
      { a: 'sfx', key: 'crowd-swell', level: 0.6 },
      { a: 'lines', lines: [{ who: null, text: 'שער 7. ברזל, ריח של גרעינים, וגברים שעומדים בדיוק איפה שהם עומדים כל שבת.' }, { who: 'אוהד ותיק', text: 'הנה עוד אחד.' }] },
      { a: 'derive', events: (state) => [{ t: 'flag.raised', flag: state.minute > at(15, 40) ? 'a5:late' : 'a5:ontime' }] },
      /**
       * …ולא לסגור את הפרק כאן.
       *
       * `a5-close` used to run in this same beat, which meant the chapter ended on the
       * frame the child arrived — and `kobi-a5-gate` and `barry-a5`, the two conversations
       * this whole scene exists for, could never happen. The close now waits at the mouth
       * of the tunnel (`a5-in`), where going in is something the player does.
       */
    ],
  },
  {
    /** נכנסים — the chapter closes when he actually walks in, not when he arrives */
    id: 'a5-in',
    at: 'bloomfield-tunnel',
    trigger: 'enter',
    /**
     * (Director V3 §12, 25.9.2026) walking in is no longer the whole of it. The tunnel is
     * where Kobi's iron is — "פה, ליד הברזל הזה" — and the chapter closes on the kick-off at
     * that rail (`a5-iron` → `a5-kickoff`): a place recognised, and the terrace's first push.
     */
    when: { flag: 'a5:there', none: [{ flag: 'a5:in' }] },
    delayMs: 400,
    do: [{ a: 'flag', flag: 'a5:in' }, { a: 'toast', text: 'המנהרה. בפתח שלה — הברזל שאבא אמר.', tone: 'plain' }],
  },
  {
    /** and a boy who stands in the tunnel until the whistle still has his Saturday */
    id: 'a5-in-late',
    trigger: 'clock',
    when: { flag: 'a5:in', afterMinute: at(16, 12), none: [{ flag: 'a5:closed' }] },
    do: [{ a: 'flag', flag: 'a5:closed' }, { a: 'talk', conversation: 'a5-close' }],
  },
  {
    /**
     * …ואם הוא נשאר בחוץ עד השריקה, הפרק נסגר בלעדיו.
     *
     * `none: [{ flag: 'a5:in' }]` נוסף ב-17.9.2026 יחד עם פתיחת המנהרה. כל עוד `a5-in`
     * לא היה נגיש, הביט הזה היה הדרך היחידה ל-`a5-close` ולכן לא היה לו במי להתנגש;
     * מרגע שיש שתי דרכים, ביט שעון שמרים `a5:late` ומדבר שוב על ילד שכבר בפנים הוא
     * בדיוק הצורה של "הפרק נסגר פעמיים", ועם הסוף הלא נכון בפעם השנייה.
     */
    id: 'a5-outside',
    trigger: 'clock',
    when: { flag: 'a5:there', afterMinute: at(16, 5), none: [{ flag: 'a5:in' }] },
    do: [{ a: 'flag', flag: 'a5:late' }, { a: 'flag', flag: 'a5:closed' }, { a: 'talk', conversation: 'a5-close' }],
  },
  {
    id: 'a5-gone',
    trigger: 'clock',
    when: { flag: A5, afterMinute: at(15, 0), none: [{ flag: 'a5:kobi-left' }, { flag: 'a5:there' }] },
    do: [{ a: 'flag', flag: 'a5:kobi-left' }, { a: 'flag', flag: 'kobi:left' }, { a: 'sfx', key: 'car-door', level: 0.6 }, { a: 'toast', text: 'צפירה ארוכה. ואז מנוע. הוא לא חיכה יותר.', tone: 'red' }],
  },
]

/** the terrace's first push — a shout, or two hands on the iron; either way the day closes */
const A5_KICKOFF: ChoiceDef[] = [
  { id: 'shout', text: 'לצעוק "אדום" עם כולם.', then: [{ e: 'flag', flag: 'a5:closed' }, { e: 'flag', flag: 'a5:shouted' }, { e: 'redheart', key: 'terraceCulture', delta: 3 }, { e: 'sfx', key: 'crowd-swell', level: 0.6 }, { e: 'goto', node: 'a5-close' }] },
  { id: 'hold', text: 'להחזיק את הברזל בשתי ידיים.', then: [{ e: 'flag', flag: 'a5:closed' }, { e: 'redheart', key: 'familyTradition', delta: 2 }, { e: 'goto', node: 'a5-close' }] },
]

export const CONVERSATIONS_A5: Conversation[] = [
  {
    id: 'shirt-a5',
    nameHe: null,
    branches: [
      { when: { flag: 'a5:dressed' }, lines: [{ who: null, text: 'אתה בחולצה. השרוולים עד המרפק. זה בסדר, תגדל.' }] },
      /**
       * מי שלא קנה אותה בקיץ — the branch A4's two other endings needed and never had.
       *
       * `shirt-a5` was gated on the era alone, so a boy who put the tin on the table for
       * his mother (`a4:gave`) or ran out of summer (`notYet`) was told, in September,
       * "you bought it in the summer" — and then wore a shirt he does not own. Both of
       * A4's non-purchase endings were cosmetic; a whole day's saving decided nothing.
       *
       * It decides something now. Without the shirt he goes in what he has, and the day
       * still happens: the point of 28.9.1985 is being there, and a boy in a plain shirt at
       * Gate 7 is a different memory, not a missing one.
       */
      {
        when: { none: [{ flag: 'own:shirt85' }] },
        lines: [
          { who: null, text: 'על הכיסא: החולצה האדומה של אבא, גדולה עליך בשלוש מידות, ולידה חולצה רגילה שלך.' },
          { who: null, text: 'את החולצה מהקיץ לא קנית. אתה יודע בדיוק כמה חסר היה.' },
        ],
        choices: [
          {
            id: 'plain',
            text: 'ללבוש את שלך ולרדת.',
            then: [
              { e: 'flagValue', flag: 'a5:dressed', value: true },
              { e: 'flag', flag: 'a5:plain' },
              { e: 'flag', flag: 'knows:match' },
              { e: 'time', minutes: 4 },
              { e: 'toast', text: 'אין סמל מעל הלב. יש אותך.', tone: 'plain' },
            ],
          },
          {
            id: 'fathers',
            text: 'ללבוש את של אבא.',
            then: [
              { e: 'flagValue', flag: 'a5:dressed', value: true },
              { e: 'flag', flag: 'a5:fathers' },
              { e: 'flag', flag: 'knows:match' },
              { e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 3 },
              { e: 'redheart', key: 'familyTradition', delta: 4 },
              { e: 'time', minutes: 6 },
              { e: 'toast', text: 'הכתפיים נופלות עד המרפקים. קיפלת פעמיים ויצאת.', tone: 'plain' },
            ],
          },
        ],
      },
      {
        lines: [{ who: null, text: 'החולצה. אדומה, וי לבן, סמל מעל הלב. קנית אותה בקיץ ועוד לא לבשת אותה למשחק.' }],
        choices: [
          { id: 'wear', text: 'ללבוש.', then: [{ e: 'flagValue', flag: 'a5:dressed', value: true }, { e: 'flag', flag: 'knows:match' }, { e: 'time', minutes: 4 }, { e: 'toast', text: 'התווית מגרדת בצוואר. לא משנה.', tone: 'plain' }] },
          { id: 'inside-out', text: 'ללבוש מהר. הפוך. לא לשים לב.', then: [{ e: 'flagValue', flag: 'a5:dressed', value: true }, { e: 'flag', flag: 'a5:inside-out' }, { e: 'flag', flag: 'knows:match' }, { e: 'time', minutes: 2 }, { e: 'toast', text: 'התפרים בחוץ. תגלה את זה בשער.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'kobi-a5',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'a5:kobi-left' }, lines: [{ who: null, text: 'האוטו לא פה. הכתם של השמן על האספלט עוד רטוב.' }] },
      { when: { flag: 'a5:fathers' }, lines: [{ who: 'קובי', text: 'זאת שלי.' }, { who: null, text: 'הוא לא אמר לך להוריד אותה. הוא קיפל לך את השרוול פעם שלישית, בלי להסתכל עליך, ופתח את הדלת.' }], then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 4 }, { e: 'remember', who: 'kobi', eventId: 'wore-my-shirt-1985', significance: 'major' }, { e: 'time', minutes: 25 }, { e: 'travel', to: 'bloomfield-outside', spawn: 'fromRoute' }] },
      { when: { flag: 'a5:plain' }, lines: [{ who: 'קובי', text: 'בסדר. בשנה הבאה.' }, { who: null, text: 'הוא אמר את זה קצר מדי, כמו מישהו שכבר חישב כמה זה עולה ולא רצה שתראה שהוא מחשב.' }], then: [{ e: 'rel', who: 'kobi', axis: 'trust', delta: 2 }, { e: 'wellbeing', key: 'regret', delta: 2 }, { e: 'time', minutes: 25 }, { e: 'travel', to: 'bloomfield-outside', spawn: 'fromRoute' }] },
      { when: { flag: 'a5:dressed' }, lines: [{ who: 'קובי', text: '…' }, { who: null, text: 'הוא הסתכל על החולצה. שנייה יותר מדי. ואז פתח את הדלת.' }], then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'remember', who: 'kobi', eventId: 'saw-the-shirt-1985', significance: 'major' }, { e: 'time', minutes: 25 }, { e: 'travel', to: 'bloomfield-outside', spawn: 'fromRoute' }] },
      { lines: [{ who: 'קובי', text: 'ככה אתה בא? לך תתלבש. אמרתי רבע שעה, ורבע שעה זה רבע שעה.' }] },
    ],
  },
  /**
   * (Director V3 §12, 25.9.2026) A5 — the turnstile pushed once, and the kick-off at the
   * iron Kobi named. New lines in the chapter's voice; the close is `a5-close`, unchanged.
   */
  {
    id: 'a5-turnstile',
    nameHe: null,
    branches: [
      {
        when: { flag: 'a5:kobi-left' },
        lines: [{ who: null, text: 'הקרוסלה גבוהה ממך. אתה דוחף אותה לבד, בשתי ידיים, והיא זזה רק כשמישהו מאחוריך נשען עליה. היא מקרקשת.' }],
        then: [{ e: 'personality', key: 'independence', delta: 2 }, { e: 'travel', to: 'bloomfield-tunnel', spawn: 'start' }],
      },
      {
        lines: [{ who: null, text: 'הקרוסלה גבוהה ממך. אבא שם יד על הכתף ודוחף איתך, פעם אחת. היא מקרקשת, ואתה בצד השני.' }],
        then: [{ e: 'rel', who: 'kobi', axis: 'familiarity', delta: 1 }, { e: 'travel', to: 'bloomfield-tunnel', spawn: 'start' }],
      },
    ],
  },
  {
    id: 'a5-kickoff',
    nameHe: null,
    branches: [
      {
        when: { flag: 'a5:kobi-left' },
        lines: [{ who: null, text: 'שריקה. כל הגדר נדחפת קדימה סנטימטר אחד, ואתה איתה. אין לידך אף אחד שאתה מכיר, והברזל קר.' }],
        choices: A5_KICKOFF,
      },
      {
        lines: [{ who: null, text: 'שריקה. כל הגדר נדחפת קדימה סנטימטר אחד, ואתה איתה. היד של אבא על הברזל, ליד שלך.' }],
        choices: A5_KICKOFF,
      },
    ],
  },
  {
    id: 'kobi-a5-gate',
    nameHe: 'קובי',
    branches: [{ lines: [{ who: 'קובי', text: 'תעמוד לידי, לא לזוז. אם אתה מאבד אותי — פה, ליד הברזל הזה. לא בשער אחר.' }], then: [{ e: 'rel', who: 'kobi', axis: 'familiarity', delta: 1 }] }],
  },
  {
    // לא בארי — Stage A Director's Cut §21/§53, 6.9.2026: Barry's canonical entry is
    // 1986, Gate 7 (`gate-veteran` in `content/dialogue.ts`), not this 1985 line. The boy
    // doesn't have his name yet — he is just a familiar face at the gate, same as every
    // other Saturday's stranger — so the line stays and the identity moves.
    id: 'barry-a5',
    nameHe: 'אוהד ותיק',
    branches: [{ lines: [{ who: 'אוהד ותיק', text: 'בן שבע? אבא שלך עמד פה בדיוק בגובה הזה. תשאל אותו אם הוא זוכר איך קראו לאיש שמכר לו גרעינים.' }], then: [{ e: 'redheart', key: 'historyMemory', delta: 2 }] }],
  },
  {
    id: 'a5-close',
    nameHe: null,
    branches: [
      { when: { flag: 'a5:late' }, lines: [{ who: null, text: 'מאחורי הברזל כבר צועקים "אדום, אדום". התחיל בלעדיך.' }], then: [{ e: 'presence', mode: 'late' }, { e: 'ending', id: 'late' }] },
      /**
       * בלי אבא — the branch that was missing, and it was the more likely one.
       *
       * If the car left at three (`a5:kobi-left`) and the boy walked, he still arrives, and
       * the line said his father put a hand on his shoulder. He is not there. He drove off
       * and the oil is still wet on the asphalt.
       */
      { when: { flag: 'a5:kobi-left' }, lines: [{ who: null, text: 'נכנסת לבד. אף אחד לא שם יד על הכתף, ואף אחד גם לא עצר אותך. אתה בחולצה, ובפנים כולם בחולצה, וזה מספיק.' }], then: [{ e: 'presence', mode: 'inside' }, { e: 'redheart', key: 'footballLove', delta: 4 }, { e: 'personality', key: 'independence', delta: 4 }, { e: 'ending', id: 'there' }] },
      /**
       * בלי החולצה — 28.9.1985 for a boy whose summer did not add up to thirty shekels.
       *
       * The day is not smaller. What is different is the one line about the shirt, and
       * that line is the point of A4: a saving day whose two other endings decided nothing
       * was a saving day that did not exist. `a5:plain` and `a5:fathers` are what those two
       * endings buy, and they buy a different September rather than a worse one.
       */
      { when: { flag: 'a5:plain' }, lines: [{ who: null, text: 'אבא שם יד על הכתף ומכניס אותך פנימה, לפני הצעקה הראשונה. אתה בחולצה רגילה, ואף אחד לא מסתכל עליה חוץ ממך.' }], then: [{ e: 'presence', mode: 'inside' }, { e: 'redheart', key: 'footballLove', delta: 4 }, { e: 'wellbeing', key: 'belonging', delta: 3 }, { e: 'ending', id: 'there' }] },
      { when: { flag: 'a5:fathers' }, lines: [{ who: null, text: 'אבא שם יד על הכתף ומכניס אותך פנימה. אתה בחולצה שלו, מקופלת שלוש פעמים, ומישהו ליד הגדר אמר "יש לך אחד קטן" והוא לא ענה.' }], then: [{ e: 'presence', mode: 'inside' }, { e: 'redheart', key: 'footballLove', delta: 4 }, { e: 'redheart', key: 'familyTradition', delta: 5 }, { e: 'ending', id: 'there' }] },
      { lines: [{ who: null, text: 'אבא שם יד על הכתף ומכניס אותך פנימה, לפני הצעקה הראשונה. אתה בחולצה. אף אחד לא צוחק.' }], then: [{ e: 'presence', mode: 'inside' }, { e: 'redheart', key: 'footballLove', delta: 4 }, { e: 'redheart', key: 'loyaltyReturn', delta: 3 }, { e: 'ending', id: 'there' }] },
    ],
  },
]

// -------------------------------------------------------------------- A6 · the radio ---

export function objectiveA6(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a6:heard']) return null
  if (state.flags['a6:gave-up']) return null
  if (state.flags['a6:revived'] || state.flags['a6:with-liron']) return 'לשמוע עד השריקה.'
  if (state.flags['a6:radio-dead']) return state.flags['a6:carried'] ? 'הרדיו מתחת לחולצה. לירון, ברחוב.' : 'הרדיו מת. לתקן, לרוץ ללירון — או לכבות.'
  if (sceneId === 'home') return 'חורף. גשם. אבא נסע לבד. יש רדיו.'
  return 'לשמוע את המשחק. איפשהו.'
}

export const ENDINGS_A6: Record<string, EndingCard> = {
  heard: {
    id: 'heard',
    titleHe: 'אכזבה רגילה',
    bodyHe: 'שמעת עד הסוף, עם הרעש, עם הידיים על הטרנזיסטור כמו על תנור. לא נגמר טוב. אמא אמרה "יש עוד שבת" בלי להרים את הראש מהעיתון, וזה היה בדיוק מה שצריך. זו הפעם הראשונה שהבנת שזה קורה גם ככה. שזה קורה הרבה.',
    memoryHe: 'הידיים על הטרנזיסטור, כמו על תנור.',
    memoryItem: 'folded-paper',
    presence: 'radio',
  },
  liron: {
    id: 'liron',
    titleHe: 'הרדיו של לירון',
    bodyHe: 'הרדיו בבית מת בדקה שלושים. רצת בגשם ללירון, והוא פתח לו את הגב על השולחן ואמר "תחזיק פה". שמעתם ביחד, בין החוטים, עם מברג ביד שלו וחוט אדום ביד שלך. לא נגמר טוב. הוא אמר "ככה זה", וזה נשמע כמו מישהו שאמר את זה הרבה פעמים.',
    memoryHe: 'הגב הפתוח של הרדיו, והמברג.',
    memoryItem: 'transistor',
    presence: 'radio',
  },
  quiet: {
    id: 'quiet',
    titleHe: 'לא שמעת',
    bodyHe: 'הרדיו מת ולא יצאת בגשם. שמעת מאבא בערב, במילה אחת, כשהוריד את המעיל הרטוב. לא שאלת עוד. למדת באיזה שקט לא שואלים.',
    memoryHe: 'המעיל הרטוב על הכיסא.',
    memoryItem: 'coin',
    presence: 'heard-from-friend',
  },
}

export const BEATS_A6: Beat[] = [
  {
    id: 'a6-open',
    at: 'home',
    trigger: 'enter',
    when: { none: [{ flag: A6 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A6 },
      { a: 'flag', flag: 'kobi:left' },
      { a: 'flag', flag: 'knows:match' },
      { a: 'lines', lines: [{ who: null, text: 'חורף. שבת. גשם על התריס. אבא נסע לבד — "בגשם הזה? לא." — ובמטבח, על השיש, נשאר הטרנזיסטור.' }] },
      // The radio is the situation. It should present itself; the player should not hunt it.
      { a: 'talk', conversation: 'radio-a6' },
    ],
  },
  {
    id: 'a6-dies',
    trigger: 'clock',
    waitingHe: 'מקשיב לשידור',
    when: { flag: 'a6:on', afterMinute: at(15, 35), none: [{ flag: 'a6:radio-dead' }, { flag: 'a6:heard' }] },
    do: [{ a: 'flag', flag: 'a6:radio-dead' }, { a: 'sound', kind: 'radio', on: false }, { a: 'toast', text: 'רעש. ואז כלום. הוא מת באמצע משפט, במילה "ו".', tone: 'red' }],
  },
  {
    /**
     * (delta 90, §7 A6) the failure asks its question at once, where the radio is: repair
     * it, run it through the rain to Liron, or switch it off. It used to be a dead object on
     * the counter and an hour and a quarter of rain until the clock closed the day — the
     * quest §7 calls persistence played as waiting. The hotspot (`radio-a6-dead`) asks the
     * same question again to the boy who walked away from it.
     */
    id: 'a6-dead-choice',
    at: 'kitchen',
    trigger: 'clock',
    when: { flag: 'a6:radio-dead', none: [{ flag: 'a6:asked-dead' }, { flag: 'a6:heard' }, { flag: 'a6:carried' }, { flag: 'a6:revived' }, { flag: 'a6:gave-up' }] },
    do: [{ a: 'flag', flag: 'a6:asked-dead' }, { a: 'talk', conversation: 'radio-a6-dead' }],
  },
  {
    /** keep listening, on purpose: the rest of the match passes in one breath, to the whistle */
    id: 'a6-listen-on',
    trigger: 'clock',
    when: { flag: 'a6:listen-on', beforeMinute: at(16, 50), none: [{ flag: 'a6:heard' }] },
    do: [
      { a: 'lines', lines: [{ who: null, text: 'אתה לא זז ממנו. הקול בא והולך עם הגשם, והדקות עוברות בחצאי משפטים — עד שהשדר מנמיך את הקול, כמו שעושים בסוף.' }] },
      { a: 'derive', events: (state) => [{ t: 'clock.advanced', minutes: Math.max(0, at(16, 50) - state.minute) }] },
    ],
  },
  {
    /** switching it off is an ending of the thought, not a failure: the afternoon closes now */
    id: 'a6-stop',
    trigger: 'clock',
    when: { flag: 'a6:gave-up', none: [{ flag: 'a6:heard' }] },
    do: [
      { a: 'lines', lines: [{ who: null, text: 'כיבית אותו. ישבת ליד החלון עם המצח על הזכוכית, עד שהאור ירד והמכונית של אבא נכנסה לרחוב.' }] },
      { a: 'derive', events: (state) => [{ t: 'clock.advanced', minutes: Math.max(0, at(17, 15) - state.minute) }, { t: 'flag.raised', flag: 'a6:end-quiet' }] },
      { a: 'talk', conversation: 'a6-close' },
    ],
  },
  {
    id: 'a6-end',
    trigger: 'clock',
    waitingHe: 'מקשיב עד השריקה',
    when: { flag: A6, afterMinute: at(16, 50), none: [{ flag: 'a6:heard' }, { flag: 'a6:gave-up' }] },
    do: [
      { a: 'derive', events: (state) => [{ t: 'flag.raised', flag: state.flags['a6:with-liron'] ? 'a6:end-liron' : state.flags['a6:on'] && (!state.flags['a6:radio-dead'] || state.flags['a6:revived']) ? 'a6:end-heard' : 'a6:end-quiet' }] },
      { a: 'talk', conversation: 'a6-close' },
    ],
  },
]

/** the torch's two batteries in the radio: it lives again, and he took them from his father's torch */
const TORCH_A6: ChoiceDef['then'] = [{ e: 'flag', flag: 'a6:revived' }, { e: 'sfx', key: 'radio-tune', level: 0.6 }, { e: 'personality', key: 'stubbornness', delta: 2 }, { e: 'remember', who: 'kobi', eventId: 'took-the-torch-batteries-1986', significance: 'minor' }]

/** holding Liron's red wire — the same hour whether or not the dead radio came with you */
const LIRON_HOLD_A6: ChoiceDef['then'] = [{ e: 'flag', flag: 'a6:with-liron' }, { e: 'flag', flag: 'a6:listen-on' }, { e: 'rel', who: 'liron', axis: 'bond', delta: 5 }, { e: 'remember', who: 'liron', eventId: 'held-the-wire-1986', significance: 'major' }, { e: 'sfx', key: 'radio-tune', level: 0.6 }, { e: 'redheart', key: 'community', delta: 3 }, { e: 'time', minutes: 40 }, { e: 'toast', text: 'בין החוטים — קול. הוא חייך בלי להרים את העיניים מהמברג.', tone: 'plain' }]

export const CONVERSATIONS_A6: Conversation[] = [
  {
    id: 'radio-a6',
    nameHe: null,
    branches: [
      { when: { flag: 'a6:radio-dead' }, lines: [{ who: null, text: 'מת. מנערים — כלום. הסוללות חמות ומריחות.' }] },
      /**
       * החולצה, בחורף — A4 was a whole day about thirty shekels and the shirt was never
       * spoken of again outside the September it was bought for.
       *
       * This is where it comes back, and it comes back in the least useful possible way:
       * at home, in the rain, with his father gone and nobody in the flat to see it. That
       * is the whole point — a thing you bought for a ground you are not at is what owning
       * it actually feels like at eight. It grants nothing, costs nothing and opens
       * nothing; `a6:shirt` exists only so it is said once rather than on every look.
       *
       * `own:shirt85` is the flag the purchase writes (`{ e: 'own', item: 'shirt85' }`),
       * and it survives a year change, so a boy who put the tin on his mother's table or
       * ran out of summer hears the ordinary line below and is told nothing he did not do.
       */
      {
        when: { flag: 'own:shirt85', all: [{ flag: 'a6:on' }], none: [{ flag: 'a6:shirt' }] },
        lines: [{ who: null, text: 'אתה מחזיק את הטרנזיסטור בשתי ידיים. לבשת בשבילו את החולצה, בבית, ואין פה אף אחד שיראה.' }],
        then: [{ e: 'flag', flag: 'a6:shirt' }],
      },
      { when: { flag: 'a6:on' }, lines: [{ who: null, text: 'השדר צועק לפני שקורה משהו, וזה בכל פעם עובד עליך. אתה מחזיק את הטרנזיסטור בשתי ידיים.' }] },
      {
        lines: [{ who: null, text: 'הטרנזיסטור. האנטנה עקומה, מישהו הדביק אותה בסלוטייפ, ובגשם צריך להחזיק אותה לכיוון החלון.' }],
        /**
         * (Director V3 §12, 25.9.2026) "לכוון / להחזיק / להעביר רדיו + מידע חלקי". The answer
         * is still where he sits with it; what follows is the kitchen as a passage of the
         * hands (`ride:radio-86`): the antenna turned until a voice comes through, both
         * hands on the case, and the match assembled out of half-sentences.
         */
        choices: [
          { id: 'on', text: 'להדליק ולהישאר לידו.', then: [{ e: 'flag', flag: 'a6:on' }, { e: 'sfx', key: 'radio-tune', level: 0.6 }, { e: 'minigame', id: 'ride:radio-86' }] },
          { id: 'window', text: 'לקחת אותו לחלון ולחפש קליטה.', then: [{ e: 'flag', flag: 'a6:on' }, { e: 'flag', flag: 'a6:window' }, { e: 'time', minutes: 5 }, { e: 'sfx', key: 'radio-tune', level: 0.6 }, { e: 'toast', text: 'ליד החלון יש קצת פחות רעש. קצת.', tone: 'plain' }, { e: 'minigame', id: 'ride:radio-86' }] },
        ],
      },
    ],
  },
  {
    /**
     * המת — and the three things a boy does about it (§7 A6: repair / help / give up).
     *
     * The batteries are the repair and they cost something real: the only two in the flat
     * are in his father's torch, and he takes them. Liron is the help, through the rain.
     * Switching it off is giving up, and it is allowed to be — the afternoon closes on it
     * at once instead of making him wait out a match he has chosen not to hear.
     */
    id: 'radio-a6-dead',
    nameHe: null,
    branches: [
      {
        when: { none: [{ flag: 'a6:torch' }] },
        lines: [{ who: null, text: 'מת. מנערים — כלום. הסוללות חמות ומריחות.' }],
        choices: [
          { id: 'batteries', text: 'לחפש סוללות. בפנס של אבא יש.', then: [{ e: 'flag', flag: 'a6:torch' }, { e: 'time', minutes: 6 }, { e: 'goto', node: 'a6-torch' }] },
          { id: 'carry', text: 'לקחת אותו מתחת לחולצה, ללירון בגשם.', then: [{ e: 'flag', flag: 'a6:carried' }, { e: 'give', item: 'transistor' }, { e: 'personality', key: 'courage', delta: 1 }, { e: 'toast', text: 'הוא חם על הבטן, כמו משהו חי. לירון — ברחוב.', tone: 'plain' }] },
          { id: 'leave', text: 'לכבות. מספיק.', then: [{ e: 'flag', flag: 'a6:gave-up' }, { e: 'wellbeing', key: 'loneliness', delta: 1 }] },
        ],
      },
      {
        // the torch is already empty: what is left is the rain, or the window
        lines: [{ who: null, text: 'מת שוב. הסוללות של הפנס גמרו את מה שהיה בהן.' }],
        choices: [
          { id: 'carry', text: 'לקחת אותו מתחת לחולצה, ללירון בגשם.', then: [{ e: 'flag', flag: 'a6:carried' }, { e: 'give', item: 'transistor' }, { e: 'toast', text: 'הוא חם על הבטן, כמו משהו חי. לירון — ברחוב.', tone: 'plain' }] },
          { id: 'leave', text: 'לכבות. מספיק.', then: [{ e: 'flag', flag: 'a6:gave-up' }] },
        ],
      },
    ],
  },
  {
    /** the torch: a repair that works — and a decision to go on listening, made on purpose */
    id: 'a6-torch',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'שתי סוללות מהפנס של אבא, בכוח, עם הציפורן. אתה מכניס אותן הפוך, ואז נכון.' },
          { who: null, text: 'רעש. ואז — הקול. חלש, רחוק, מבעד לגשם. אבל חוזר.' },
        ],
        // (a branch with choices runs only the chosen answer's effects — the repair is in both)
        choices: [
          { id: 'listen-on', text: 'להצמיד אותו לאוזן. עד השריקה.', then: [...TORCH_A6, { e: 'flag', flag: 'a6:listen-on' }, { e: 'redheart', key: 'footballLove', delta: 2 }] },
          { id: 'enough', text: 'לשמוע שהוא חי — ולכבות.', then: [...TORCH_A6, { e: 'flag', flag: 'a6:gave-up' }] },
        ],
      },
    ],
  },
  {
    /** "…ו—" — the match in half-sentences, between the noise (`ride:radio-86`) */
    id: 'a6-half',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: '"...בדקה ה..." ורעש. "...מהצד השמאלי, ו..." ורעש. השדר נבלע וחוזר באמצע מילה אחרת.' },
          { who: null, text: 'אתה בונה את המשחק מהחצאים, כמו פאזל שחסרים לו החלקים של השמיים.' },
        ],
        then: [{ e: 'flag', flag: 'a6:half' }, { e: 'personality', key: 'curiosity', delta: 1 }],
      },
    ],
  },
  {
    id: 'rachel-a6',
    nameHe: 'רחל',
    branches: [
      { when: { flag: 'a6:radio-dead' }, lines: [{ who: 'רחל', text: 'מת? לירון ברחוב, קח מטרייה. ואם לא — יש עוד שבת.' }] },
      { lines: [{ who: 'רחל', text: 'תוריד את הקול. אני שומעת אותו עד המקלחת, והוא צועק יותר מהמשחק.' }] },
    ],
  },
  {
    id: 'liron-a6',
    nameHe: 'לירון',
    branches: [
      { when: { flag: 'a6:with-liron' }, lines: [{ who: 'לירון', text: 'תחזיק פה. לא לזוז, לא לנשום עליו.' }] },
      /** (V3 §12) the radio carried down the street in the rain: he takes it off your hands first */
      {
        when: { flag: 'a6:radio-dead', hasItem: 'transistor' },
        lines: [
          { who: 'לירון', text: 'הבאת אותו בגשם? תניח על השולחן, אני אפתח לו את הגב אחר כך.' },
          { who: 'לירון', text: 'הטרנזיסטור מת? כולם מתים בגשם. בוא, יש לי פה אחד פתוח. תחזיק את החוט האדום.' },
        ],
        choices: [
          { id: 'hold', text: 'להחזיק את החוט.', then: [...LIRON_HOLD_A6, { e: 'rel', who: 'liron', axis: 'trust', delta: 3 }, { e: 'remember', who: 'liron', eventId: 'brought-the-radio-1986', significance: 'notable' }] },
          { id: 'no', text: '"לא, אני אלך הביתה."', then: [{ e: 'wellbeing', key: 'loneliness', delta: 2 }] },
        ],
      },
      {
        when: { flag: 'a6:radio-dead' },
        lines: [{ who: 'לירון', text: 'הטרנזיסטור מת? כולם מתים בגשם. בוא, יש לי פה אחד פתוח. תחזיק את החוט האדום.' }],
        choices: [
          { id: 'hold', text: 'להחזיק את החוט.', then: LIRON_HOLD_A6 },
          { id: 'no', text: '"לא, אני אלך הביתה."', then: [{ e: 'wellbeing', key: 'loneliness', delta: 2 }] },
        ],
      },
      { lines: [{ who: 'לירון', text: 'גשם כזה אוכל את הקליטה. אם שלכם ימות — אתה יודע איפה אני, ואני לא הולך לשום מקום.' }] },
    ],
  },
  {
    id: 'a6-close',
    nameHe: null,
    branches: [
      { when: { flag: 'a6:end-liron' }, lines: [{ who: 'לירון', text: 'ככה זה.' }, { who: null, text: 'הוא אמר את זה כמו מישהו שאמר את זה כבר הרבה מאוד פעמים, ונשאר.' }], then: [{ e: 'flag', flag: 'a6:heard' }, { e: 'redheart', key: 'loyaltyReturn', delta: 2 }, { e: 'ending', id: 'liron' }] },
      { when: { flag: 'a6:end-heard' }, lines: [{ who: 'רחל', text: 'יש עוד שבת.' }, { who: null, text: 'היא לא הרימה את הראש מהעיתון. זה היה בדיוק מה שצריך.' }], then: [{ e: 'flag', flag: 'a6:heard' }, { e: 'rel', who: 'rachel', axis: 'bond', delta: 2 }, { e: 'redheart', key: 'loyaltyReturn', delta: 3 }, { e: 'ending', id: 'heard' }] },
      { lines: [{ who: null, text: 'אבא חזר רטוב עד הגרביים. מילה אחת, ואז המעיל על הכיסא.' }], then: [{ e: 'flag', flag: 'a6:heard' }, { e: 'wellbeing', key: 'loneliness', delta: 2 }, { e: 'ending', id: 'quiet' }] },
    ],
  },
]

// ------------------------------------------------------------- A7 · the week before ---

export function objectiveA7(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a7:refused']) return null
  if (!state.flags['a7:knows']) return sceneId === 'home' ? 'שבת. אבא עם הרדיו. ברחוב מדברים על שבת הבאה.' : 'שבת. ברחוב מדברים על שבת הבאה. תגלה על מה.'
  if (state.flags['a7:knows-gap'] && !state.flags['life:a7:scouted'] && sceneId !== 'home') return 'אופיר אמר: העמוד השלישי. או הביתה — לשאול את אבא.'
  if (sceneId === 'home') return 'אבא בכורסה. לשאול — או לא.'
  return 'עמית יודע. אופיר בטוח. אבא — בבית.'
}

export const ENDINGS_A7: Record<string, EndingCard> = {
  refused: {
    id: 'refused',
    titleHe: '"לא השבוע"',
    bodyHe: 'שאלת. הוא אמר לא. "זה לא משחק לילדים." ואז הוסיף שמשדרים את זה חי בטלוויזיה, פעם ראשונה שעושים דבר כזה, ושתראה מהבית — כאילו זה אותו דבר. אמא אמרה שהוא צודק, וזה היה יותר גרוע. הלכת לחדר ולא בכית. כבר ידעת מה תעשה בשבת, רק עוד לא ידעת שאתה יודע.',
    memoryHe: '"לא השבוע."',
    memoryItem: 'newspaper',
  },
  promised: {
    id: 'promised',
    titleHe: 'הבטחה',
    bodyHe: 'הוא אמר "נראה" וחזר לעיתון. אצל אבא "נראה" זה כן, בדרך כלל. הלכת לישון עם זה. בשבת בצהריים הוא יצא בלעדיך, ו"נראה" הפכה למילה שאתה לא סומך עליה. עד היום.',
    memoryHe: '"נראה."',
    memoryItem: 'newspaper',
  },
  silent: {
    id: 'silent',
    titleHe: 'לא שאלת',
    bodyHe: 'לא שאלת. ידעת מה יגיד, וחסכת לעצמכם את זה. שכבת על המיטה עם העיתון וקראת את הכותרת עשרים פעם, עד שהאותיות הפסיקו להיות מילים. בשבת בצהריים, כשיצא, לא היה לך על מה לכעוס. זה היה יותר קשה.',
    memoryHe: 'העיתון מתחת למיטה.',
    memoryItem: 'newspaper',
  },
}

export const BEATS_A7: Beat[] = [
  {
    id: 'a7-open',
    at: 'street',
    trigger: 'enter',
    when: { none: [{ flag: A7 }] },
    delayMs: 700,
    do: [
      { a: 'flag', flag: A7 },
      { a: 'lines', lines: [{ who: null, text: 'שבת. שבוע לפני. ברחוב לא משחקים — עומדים. כולם מדברים על השבת הבאה, בקול נמוך, כמו אנשים שמפחדים להגיד דבר כזה בקול.' }] },
    ],
  },
  {
    id: 'a7-night',
    trigger: 'clock',
    when: { flag: A7, afterMinute: at(20, 30), none: [{ flag: 'a7:refused' }] },
    do: [{ a: 'lines', lines: [{ who: null, text: 'לילה. לא שאלת. העיתון מתחת למיטה, מקופל על הכותרת.' }] }, { a: 'flag', flag: 'a7:refused' }, { a: 'ending', id: 'silent' }],
  },
]

/** the three ways the week before ends at the armchair — ask, hint, or not ask (§7 A7) */
const A7_ASK: ChoiceDef[] = [
          { id: 'ask', text: '"קח אותי."', then: [{ e: 'flag', flag: 'a7:refused' }, { e: 'flag', flag: 'life:a7:refused' }, { e: 'rel', who: 'kobi', axis: 'tension', delta: 4 }, { e: 'wellbeing', key: 'stress', delta: 4 }, { e: 'remember', who: 'kobi', eventId: 'said-no-1986', significance: 'major' }, { e: 'toast', text: '"לא השבוע. זה לא משחק לילדים."', tone: 'red' }, { e: 'ending', id: 'refused' }] },
          { id: 'hint', text: '"אופיר הולך."', then: [{ e: 'flag', flag: 'a7:refused' }, { e: 'flag', flag: 'life:a7:promised' }, { e: 'rel', who: 'kobi', axis: 'familiarity', delta: 2 }, { e: 'toast', text: '"נראה." הוא חזר לעיתון.', tone: 'plain' }, { e: 'ending', id: 'promised' }] },
          { id: 'quiet', text: 'לא לשאול.', then: [{ e: 'flag', flag: 'a7:refused' }, { e: 'flag', flag: 'life:a7:silent' }, { e: 'personality', key: 'stubbornness', delta: 1 }, { e: 'wellbeing', key: 'loneliness', delta: 2 }, { e: 'remember', who: 'kobi', eventId: 'did-not-ask-1986', significance: 'notable' }, { e: 'ending', id: 'silent' }] },
]

export const CONVERSATIONS_A7: Conversation[] = [
  {
    id: 'amit-a7',
    nameHe: 'עמית',
    branches: [
      { when: { flag: 'a7:knows' }, lines: [{ who: 'עמית', text: 'שבת הבאה. הכל תלוי בזה. תשמור את העיתון, אחר כך תראה שצדקתי.' }] },
      {
        lines: [{ who: 'עמית', text: 'אתה לא יודע? שבת הבאה. הכל תלוי במשחק הזה. וכתוב פה שמשדרים אותו חי בטלוויזיה — פעם ראשונה שעושים דבר כזה למשחק ליגה.' }, { who: null, text: 'הוא הראה לך כותרת. לא הבנת את כל המילים. הבנת את הגודל של האותיות.' }],
        then: [{ e: 'flag', flag: 'a7:knows' }, { e: 'give', item: 'newspaper' }, { e: 'rel', who: 'amit', axis: 'bond', delta: 3 }, { e: 'redheart', key: 'historyMemory', delta: 2 }, { e: 'toast', text: 'הוא קרע את העמוד ונתן לך אותו. "תשמור. לא לקפל בפנים."', tone: 'plain' }],
      },
    ],
  },
  {
    id: 'ofir-a7',
    nameHe: 'אופיר',
    branches: [
      { lines: [{ who: 'אופיר', text: 'שבת הבאה אני הולך. לא משנה מה, גם אם צריך לטפס על הגדר. אתה?' }], choices: [
        /**
         * (Director V3 §12, 25.9.2026) "route planning / sneak": the "גם אם צריך לטפס על
         * הגדר" is a place. A boy who says "גם אני" is told where, and can walk to
         * Bloomfield this Saturday and lie on his stomach at the gap (`a7-gap`) — which is a
         * way in on 24.5.1986 (`gap-1986`) for the boy who looked.
         */
        { id: 'me-too', text: '"גם אני."', then: [{ e: 'flag', flag: 'a7:knows' }, { e: 'flag', flag: 'a7:said-yes' }, { e: 'rel', who: 'ofir', axis: 'bond', delta: 3 }, { e: 'personality', key: 'courage', delta: 2 }, { e: 'toast', text: '"יאללה." הוא לחץ לך את היד כמו גדולים.', tone: 'plain' }, { e: 'goto', node: 'ofir-a7-gap' }] },
        { id: 'dad', text: '"תלוי באבא שלי."', then: [{ e: 'flag', flag: 'a7:knows' }, { e: 'personality', key: 'reliability', delta: 1 }, { e: 'toast', text: '"תלוי באבא." הוא אמר את זה בקול שלך ולא צחק.', tone: 'plain' }] },
      ] },
    ],
  },
  {
    id: 'ofir-a7-gap',
    nameHe: 'אופיר',
    branches: [
      {
        lines: [
          { who: 'אופיר', text: 'יש רווח מתחת לגדר של בלומפילד, ליד העמוד השלישי מהשער. ילד עובר בו אם הוא לא מפחד מבוץ.' },
          { who: 'אופיר', text: 'תלך תראה בעצמך. אני לא הולך להראות לך את הכל.' },
        ],
        then: [{ e: 'flag', flag: 'a7:knows-gap' }],
      },
    ],
  },
  {
    id: 'a7-gap',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הגדר, העמוד השלישי, ומתחתיו רווח של בוץ יבש — רחב בדיוק כמו ילד בן שמונה. אף אחד לא מסתכל על ילד שמסתכל על גדר.' },
          { who: null, text: 'אתה לא עובר. אתה רק שוכב על הבטן לרגע ומסתכל מתחת: מדרגות, ברזל, והשקט של שבוע לפני.' },
        ],
        then: [{ e: 'flag', flag: 'life:a7:scouted' }, { e: 'trait', trait: 'streetSmarts', delta: 4 }, { e: 'time', minutes: 30 }, { e: 'toast', text: 'עכשיו אתה יודע איפה. ובבית עוד לא שאלת.', tone: 'plain' }],
      },
    ],
  },
  {
    id: 'kobi-a7',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'a7:refused' }, lines: [{ who: 'קובי', text: 'אמרתי. לא השבוע. אל תשאל אותי עוד פעם.' }] },
      /** the radio told him, not Amit — the same question, in the room it was heard in */
      {
        when: { flag: 'a7:heard-radio' },
        lines: [{ who: 'קובי', text: 'ואל תגיד לי שאתה לא יודע מה זה.' }, { who: null, text: 'הוא חוזר לעיתון. העמוד לא זז.' }],
        choices: A7_ASK,
      },
      {
        when: { flag: 'a7:knows' },
        lines: [{ who: 'קובי', text: 'מה, עמית כבר סיפר לך. כן. שבת הבאה, ואל תגיד לי שאתה לא יודע מה זה.' }],
        choices: A7_ASK,
      },
      /**
       * (delta 90, §7 A7 "more than one believable source") — the third source is in the
       * room with him. A boy who went home first never met Amit's page or Ofir's fence, and
       * his father's radio was already talking about next Saturday behind his head.
       */
      {
        lines: [
          { who: null, text: 'ברדיו שמאחורי הראש של אבא מדברים על שבת הבאה, בקול של חדשות. הוא מנמיך — אבל לא מספיק מהר.' },
          { who: 'קובי', text: 'שמעת? אז שמעת. שבת הבאה.' },
        ],
        then: [{ e: 'flag', flag: 'a7:knows' }, { e: 'flag', flag: 'a7:heard-radio' }, { e: 'redheart', key: 'historyMemory', delta: 1 }, { e: 'goto', node: 'kobi-a7' }],
      },
    ],
  },
  {
    id: 'rachel-a7',
    nameHe: 'רחל',
    branches: [
      { when: { flag: 'a7:refused' }, lines: [{ who: 'רחל', text: 'הוא צודק. יהיו שם יותר מדי אנשים, ואתה קטן מכולם.' }, { who: null, text: 'זה היה יותר גרוע מה"לא" שלו.' }] },
      { lines: [{ who: 'רחל', text: 'שבת הבאה? אל תתחיל איתי. זה בינך לבין אבא שלך.' }] },
    ],
  },
]
