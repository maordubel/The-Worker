import { at } from '../clock'
import { shirtAgorot } from '../prices'
import type { LifeState, LocationId } from '../types'
import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'

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
}

// ------------------------------------------------------------------- A2 · the alley ---

export function objectiveA2(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a2:played'] || state.flags['a2:late']) return null
  if (state.flags['a2:errand'] && !state.flags['a2:bread']) return 'לחם מהקיוסק. ואז — הסמטה, לפני שהקבוצות מלאות.'
  if (sceneId === 'home') return 'אחר הצהריים. בסמטה משחקים. אמא רוצה משהו.'
  return 'הסמטה. לפני שהקבוצות מלאות.'
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
          { who: 'רחל', text: 'פוגי. לפני שאתה נעלם — לחם מרפי. שמתי לך 3 שקל בכיס, ותגיד לו על החשבון. אני עוברת מחר.' },
        ],
      },
    ],
  },
  {
    id: 'a2-teams-full',
    trigger: 'clock',
    waitingHe: 'ממתין: הילדים מתחלקים לקבוצות',
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
    trigger: 'clock',
    /**
     * `played:football` used to be required here as well. It is raised by the street-
     * football minigame, and a boy who joined the game in the alley has not necessarily
     * played THAT — so the one beat that ends the day was waiting on a flag the day does
     * not have to produce. Joining is the beat; the kickabout is a bonus.
     */
    when: { flag: 'a2:played', afterMinute: at(17, 30), none: [{ flag: 'a2:done' }] },
    delayMs: 900,
    do: [{ a: 'flag', flag: 'a2:done' }, { a: 'talk', conversation: 'a2-after-game' }],
  },
  {
    id: 'a2-night',
    trigger: 'clock',
    waitingHe: 'ממתין: הסמטה מתרוקנת',
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
  return state.savings + state.agorot >= SHIRT_PRICE ? 'kiosk' : null
}

export const goalA5 = (state: LifeState): LocationId | null => {
  if (state.flags['a5:there']) return null
  if (!state.flags['a5:dressed']) return null
  return 'bloomfield-outside'
}

export const goalA6 = (state: LifeState): LocationId | null => {
  if (state.flags['a6:heard']) return null
  if (state.flags['a6:radio-dead'] && !state.flags['a6:with-liron']) return 'street'
  return null
}

export const goalA7 = (state: LifeState): LocationId | null => {
  if (state.flags['a7:refused']) return null
  return state.flags['a7:knows'] ? 'home' : 'street'
}

export const CONVERSATIONS_A1: Conversation[] = [
  {
    id: 'a1-1983',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'דרום תל אביב. 1 ביוני 1983.' },
          { who: null, text: 'אתה בן חמש, ואתה על הכתפיים של מישהו. אתה לא רואה כלום חוץ מראשים.' },
          { who: null, text: 'ריח של סיגריה, של זיעה, של גראס יבש. רדיו טרנזיסטור צורח באוזן של מישהו אחר.' },
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
              { e: 'personality', key: 'curiosity', delta: 2 },
              { e: 'goto', node: 'a1-red' },
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
          { who: null, text: 'בין הנעליים, על הבטון, משהו אדום. מישהו הפיל אותו וכבר לא יחפש.' },
          { who: null, text: 'אתה מושיט יד למטה. הכתפיים זזות ואתה כמעט נופל.' },
        ],
        choices: [
          {
            id: 'take',
            text: 'להרים אותו בכל זאת.',
            then: [
              { e: 'give', item: 'scarf' },
              /**
               * `own:` and `life:`, not `a1:` — a year change empties the inventory and
               * every flag that is not one of those prefixes (`personFlags`). A scrap of
               * cloth picked up at five that vanished at the turn of 1984 would be a
               * memory the game forgot, which is the one thing this object is for.
               */
              { e: 'flag', flag: 'own:red-scrap' },
              { e: 'flag', flag: 'life:a1:red' },
              { e: 'personality', key: 'impulsiveness', delta: 2 },
              { e: 'redheart', key: 'historyMemory', delta: 3 },
              { e: 'goto', node: 'a1-crowd' },
            ],
          },
          {
            id: 'hold',
            text: 'להיאחז חזק ולא לזוז.',
            then: [
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 2 },
              { e: 'personality', key: 'reliability', delta: 2 },
              { e: 'goto', node: 'a1-crowd' },
            ],
          },
        ],
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
              { e: 'sfx', key: 'crowd-claps', level: 0.6 },
              { e: 'redheart', key: 'community', delta: 4 },
              { e: 'wellbeing', key: 'belonging', delta: 4 },
              { e: 'goto', node: 'a1-goal' },
            ],
          },
          {
            id: 'reach',
            text: 'להרים ידיים אל הרעש.',
            then: [
              { e: 'sfx', key: 'crowd-swell', level: 0.6 },
              { e: 'redheart', key: 'terraceCulture', delta: 4 },
              { e: 'personality', key: 'courage', delta: 3 },
              { e: 'goto', node: 'a1-goal' },
            ],
          },
          {
            id: 'ears',
            text: 'לכסות את האוזניים.',
            then: [
              // §6: covering your ears costs nothing. A frightened five-year-old is not a
              // worse supporter, and the brief says so in as many words.
              { e: 'personality', key: 'streetSmarts', delta: 3 },
              { e: 'wellbeing', key: 'stress', delta: 3 },
              { e: 'goto', node: 'a1-goal' },
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
          { e: 'goto', node: 'a1-home' },
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
          { who: null, text: 'זה הזיכרון הראשון שלך. לא בחרת בו.' },
        ],
        then: [{ e: 'flag', flag: 'life:a1:done' }, { e: 'travel', to: 'home', spawn: 'start' }],
      },
      {
        lines: [
          { who: null, text: 'אתה לא זוכר את הדרך הביתה. אתה זוכר את היד סביב הרגל שלך שלא הרפתה.' },
          { who: null, text: 'זה הזיכרון הראשון שלך. לא בחרת בו.' },
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
        choices: [
          { id: 'ok', text: '"טוב."', then: [{ e: 'flag', flag: 'a2:errand' }, { e: 'rel', who: 'rachel', axis: 'bond', delta: 2 }, { e: 'personality', key: 'reliability', delta: 2 }] },
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
      {
        when: { flag: 'a2:errand' },
        lines: [{ who: 'רפי מהקיוסק', text: 'לחם לרחל. על החשבון — תשאיר את המטבעות בכיס. ותגיד לה שהחשבון כבר לא זוכר את עצמו.' }],
        then: [{ e: 'flag', flag: 'a2:bread' }, { e: 'time', minutes: 6 }, { e: 'sfx', key: 'bell-shop', level: 0.5 }, { e: 'toast', text: 'לחם חם. הנייר נרטב מהחום.', tone: 'plain' }],
      },
      { lines: [{ who: 'רפי מהקיוסק', text: 'ילד. אתה קונה, או שאתה עומד לי בשמש?' }] },
    ],
  },
  {
    id: 'alley-a2',
    nameHe: null,
    branches: [
      { when: { flag: 'a2:played' }, lines: [{ who: null, text: 'שיחקת. הברך שרוטה והרגליים עוד זוכרות.' }] },
      {
        when: { flag: 'a2:full' },
        lines: [{ who: 'אופיר', text: 'מלא. שניים־שניים ואחד בשער. תעמוד בצד, תספור, מי שמפסיד יוצא.' }, { who: 'עמית', text: 'ספירה זה גם תפקיד. שאלה מי נותן אותו לך.' }],
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
      { when: { flag: 'a2:after' }, lines: [{ who: null, text: 'חושך כמעט. התריס של רפי כבר למטה. הלחם יחכה למחר, והיא לא תגיד כלום.' }], then: [{ e: 'time', minutes: 30 }, { e: 'ending', id: 'played' }] },
      { lines: [{ who: null, text: 'חושך כמעט. הלחם בבית, הרגליים כואבות, וזה הרגיש כמו משהו שתרצה שוב מחר.' }], then: [{ e: 'time', minutes: 30 }, { e: 'ending', id: 'played' }] },
    ],
  },
]

// -------------------------------------------------------------- A3 · the second house ---

export function objectiveA3(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags['a3:done']) return null
  if (state.flags['a3:inside']) {
    // inside, and the day is no longer about getting in — it is about being here
    if (!state.flags['saw:parquet']) return 'אתה בפנים. תסתכל על הרצפה הזאת.'
    if (!state.flags['saw:stand']) return 'הפרקט, היציע, החלונות. ואפי איפשהו.'
    return 'תמצא את אפי כשתראה מספיק.'
  }
  if (sceneId === 'ussishkin-outside') return 'הדלת. אפי מכיר את הסדרן, והסדרן אוהב שמות.'
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
    id: 'a3-seen',
    trigger: 'clock',
    when: {
      flag: 'a3:inside',
      all: [{ flag: 'saw:parquet' }, { flag: 'saw:stand' }],
      none: [{ flag: 'a3:done' }],
    },
    delayMs: 1200,
    do: [{ a: 'flag', flag: 'a3:done' }, { a: 'talk', conversation: 'a3-leaving' }],
  },
  {
    /** and if he stands there until they turn the lights off, that is also an evening */
    id: 'a3-late',
    trigger: 'clock',
    waitingHe: 'ממתין: המשחק נגמר',
    when: { flag: 'a3:inside', afterMinute: at(20, 40), none: [{ flag: 'a3:done' }] },
    do: [{ a: 'flag', flag: 'a3:done' }, { a: 'talk', conversation: 'a3-leaving' }],
  },
  {
    id: 'a3-night',
    trigger: 'clock',
    waitingHe: 'ממתין: אפי יוצא מהדלת',
    when: { flag: A3, afterMinute: at(20, 0), none: [{ flag: 'a3:inside' }, { flag: 'a3:done' }] },
    do: [{ a: 'lines', lines: [{ who: null, text: 'חושך. אפי יצא מהדלת מזיע ולא שאל למה חיכית בחוץ.' }] }, { a: 'ending', id: 'door' }],
  },
]

export const CONVERSATIONS_A3: Conversation[] = [
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
        when: { all: [{ flag: 'saw:parquet' }, { flag: 'saw:stand' }] },
        lines: [{ who: 'אפי', text: 'נו? אמרתי לך.' }],
        choices: [
          {
            id: 'stay',
            text: '"עוד קצת."',
            then: [{ e: 'redheart', key: 'basketballLove', delta: 2 }, { e: 'rel', who: 'efi', axis: 'bond', delta: 2 }],
          },
          {
            id: 'go',
            text: '"בוא נלך."',
            then: [{ e: 'flag', flag: 'a3:done' }, { e: 'goto', node: 'a3-leaving' }],
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
        then: [{ e: 'flag', flag: 'life:knows:hall' }, { e: 'rel', who: 'efi', axis: 'bond', delta: 3 }, { e: 'ending', id: 'hall' }],
      },
      {
        lines: [
          { who: null, text: 'יצאתם כשעוד שמעו את הכדור מבפנים. ברחוב היה קר, ולא היה אכפת לך.' },
          { who: 'אפי', text: 'בשבוע הבא יש עוד.' },
        ],
        then: [{ e: 'flag', flag: 'life:knows:hall' }, { e: 'rel', who: 'efi', axis: 'bond', delta: 2 }, { e: 'ending', id: 'hall' }],
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
  if (state.savings + state.agorot >= SHIRT_PRICE) return 'יש את ה־30. לרפי, לפני שבע.'
  if (sceneId === 'bedroom') return 'קיץ. החולצה בחלון של רפי, 30 שקל. הפחית מתחת למיטה.'
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
    ],
  },
  {
    id: 'a4-close',
    trigger: 'clock',
    waitingHe: 'ממתין: רפי סוגר את הקיוסק',
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
      { when: { flag: 'a4:bottles' }, lines: [{ who: null, text: 'הסמטה נקייה. אספת הכל, ועוד אף אחד לא שתה מאז.' }] },
      {
        lines: [{ who: null, text: 'שלושה בקבוקי פיקדון ליד הפח. מישהו לא רצה ללכת לרפי.' }],
        choices: [
          { id: 'collect', text: 'לאסוף.', then: [{ e: 'flag', flag: 'a4:bottles' }, { e: 'give', item: 'bottle', count: 3 }, { e: 'time', minutes: 8 }, { e: 'toast', text: 'שלושה בקבוקים. מלוכלכים. שווים.', tone: 'plain' }] },
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
        when: { hasItem: 'bottle' },
        lines: [{ who: 'רפי מהקיוסק', text: 'בקבוקים? תביא. שקל לבקבוק. ואל תביא לי את המלוכלכים של הסמטה — טוב, תביא.' }],
        then: [{ e: 'take', item: 'bottle', count: 3 }, { e: 'money', agorot: 300, why: 'פיקדון' }, { e: 'sfx', key: 'coins', level: 0.6 }, { e: 'toast', text: '3 ₪. הכיס מצלצל.', tone: 'plain' }],
      },
      {
        when: { minAgorot: SHIRT_PRICE },
        lines: [{ who: 'רפי מהקיוסק', text: 'החולצה? 30 שקל. יש לך? תספור על הדלפק, לא בכיס.' }],
        choices: [
          { id: 'buy', text: 'לספור על הדלפק. הכל.', then: [{ e: 'money', agorot: -SHIRT_PRICE, why: 'החולצה' }, { e: 'own', item: 'shirt85' }, { e: 'shirt', id: 'tveria85' }, { e: 'redheart', key: 'footballLove', delta: 5 }, { e: 'personality', key: 'reliability', delta: 3 }, { e: 'remember', who: 'shopkeeper', eventId: 'bought-shirt-1985', significance: 'major' }, { e: 'sfx', key: 'coins', level: 0.7 }, { e: 'toast', text: 'הוא קיפל אותה פעמיים והכניס לשקית של לחם.', tone: 'red' }, { e: 'goto', node: 'rafi-a4-bought' }] },
          { id: 'wait', text: '"עוד לא. בשבוע הבא."', then: [{ e: 'toast', text: '"בשבוע הבא היא עוד פה." הוא לא היה בטוח.', tone: 'plain' }] },
        ],
      },
      {
        lines: [{ who: 'רפי מהקיוסק', text: 'החולצה? 30 שקל. אין לך 30. יש לך פנים של ילד שסופר בראש.' }],
        choices: [
          { id: 'work', text: '"יש משהו לעשות? לסדר, לסחוב?"', when: { none: [{ flag: 'a4:worked' }] }, noteHe: 'כבר סידרת לו את הארגזים היום.', then: [{ e: 'flag', flag: 'a4:worked' }, { e: 'time', minutes: 50 }, { e: 'energy', delta: -15 }, { e: 'money', agorot: 500, why: 'ארגזים' }, { e: 'personality', key: 'reliability', delta: 2 }, { e: 'toast', text: 'שעה של ארגזים, אחד־אחד. 5 ₪ ובקבוק קולה שלא ביקשת.', tone: 'plain' }] },
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
    id: 'kobi-a4',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'a4:kobi' }, lines: [{ who: 'קובי', text: 'דיברנו על זה. השאר — שלך.' }] },
      {
        lines: [{ who: 'קובי', text: 'החולצה מהחלון של רפי? יפה. כמה חסר לך?' }],
        choices: [
          { id: 'ask', text: '"הרבה."', then: [{ e: 'flag', flag: 'a4:kobi' }, { e: 'money', agorot: 500, why: 'מאבא' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'toast', text: 'הוא הוציא 5 שקל מהכיס בלי לספור. "השאר שלך."', tone: 'plain' }] },
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
          { id: 'give', text: 'לשים את הכל על השולחן.', then: [{ e: 'flag', flag: 'a4:gave' }, { e: 'money', agorot: -1200, why: 'לאמא' }, { e: 'rel', who: 'rachel', axis: 'bond', delta: 8 }, { e: 'remember', who: 'rachel', eventId: 'gave-the-tin-1985', significance: 'major' }, { e: 'personality', key: 'empathy', delta: 4 }, { e: 'ending', id: 'gave' }] },
          { id: 'keep', text: 'להחזיק את הכיס ולשתוק.', then: [{ e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'personality', key: 'stubbornness', delta: 1 }] },
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
  if (sceneId === 'bloomfield-outside') return 'שער 7. אבא.'
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
      { a: 'lines', lines: [{ who: null, text: 'שער 7. ברזל, ריח של גרעינים, וגברים שעומדים בדיוק איפה שהם עומדים כל שבת.' }, { who: 'בארי', text: 'הנה עוד אחד.' }] },
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
    when: { flag: 'a5:there' },
    delayMs: 400,
    do: [{ a: 'talk', conversation: 'a5-close' }],
  },
  {
    /** …ואם הוא נשאר בחוץ עד השריקה, הפרק נסגר בלעדיו */
    id: 'a5-outside',
    trigger: 'clock',
    waitingHe: 'ממתין: השריקה הראשונה',
    when: { flag: 'a5:there', afterMinute: at(16, 5) },
    do: [{ a: 'flag', flag: 'a5:late' }, { a: 'talk', conversation: 'a5-close' }],
  },
  {
    id: 'a5-gone',
    trigger: 'clock',
    waitingHe: 'ממתין: אבא מפסיק לחכות',
    when: { flag: A5, afterMinute: at(15, 0), none: [{ flag: 'a5:kobi-left' }, { flag: 'a5:there' }] },
    do: [{ a: 'flag', flag: 'a5:kobi-left' }, { a: 'flag', flag: 'kobi:left' }, { a: 'sfx', key: 'car-door', level: 0.6 }, { a: 'toast', text: 'צפירה ארוכה. ואז מנוע. הוא לא חיכה יותר.', tone: 'red' }],
  },
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
  if (state.flags['a6:radio-dead']) return 'הרדיו מת. לירון ברחוב מתקן רדיו.'
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
    ],
  },
  {
    id: 'a6-dies',
    trigger: 'clock',
    waitingHe: 'ממתין: הסוללות נגמרות',
    when: { flag: 'a6:on', afterMinute: at(15, 35), none: [{ flag: 'a6:radio-dead' }, { flag: 'a6:heard' }] },
    do: [{ a: 'flag', flag: 'a6:radio-dead' }, { a: 'sound', kind: 'radio', on: false }, { a: 'toast', text: 'רעש. ואז כלום. הוא מת באמצע משפט, במילה "ו".', tone: 'red' }],
  },
  {
    id: 'a6-end',
    trigger: 'clock',
    waitingHe: 'ממתין: המשחק נגמר',
    when: { flag: A6, afterMinute: at(16, 50), none: [{ flag: 'a6:heard' }] },
    do: [
      { a: 'derive', events: (state) => [{ t: 'flag.raised', flag: state.flags['a6:with-liron'] ? 'a6:end-liron' : state.flags['a6:on'] && !state.flags['a6:radio-dead'] ? 'a6:end-heard' : 'a6:end-quiet' }] },
      { a: 'talk', conversation: 'a6-close' },
    ],
  },
]

export const CONVERSATIONS_A6: Conversation[] = [
  {
    id: 'radio-a6',
    nameHe: null,
    branches: [
      { when: { flag: 'a6:radio-dead' }, lines: [{ who: null, text: 'מת. מנערים — כלום. הסוללות חמות ומריחות.' }] },
      { when: { flag: 'a6:on' }, lines: [{ who: null, text: 'השדר צועק לפני שקורה משהו, וזה בכל פעם עובד עליך. אתה מחזיק את הטרנזיסטור בשתי ידיים.' }] },
      {
        lines: [{ who: null, text: 'הטרנזיסטור. האנטנה עקומה, מישהו הדביק אותה בסלוטייפ, ובגשם צריך להחזיק אותה לכיוון החלון.' }],
        choices: [
          { id: 'on', text: 'להדליק.', then: [{ e: 'flag', flag: 'a6:on' }, { e: 'sfx', key: 'radio-tune', level: 0.6 }, { e: 'toast', text: 'רעש. ואז קול. ואז רעש. תחזיק את האנטנה.', tone: 'plain' }] },
        ],
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
      {
        when: { flag: 'a6:radio-dead' },
        lines: [{ who: 'לירון', text: 'הטרנזיסטור מת? כולם מתים בגשם. בוא, יש לי פה אחד פתוח. תחזיק את החוט האדום.' }],
        choices: [
          { id: 'hold', text: 'להחזיק את החוט.', then: [{ e: 'flag', flag: 'a6:with-liron' }, { e: 'rel', who: 'liron', axis: 'bond', delta: 5 }, { e: 'remember', who: 'liron', eventId: 'held-the-wire-1986', significance: 'major' }, { e: 'sfx', key: 'radio-tune', level: 0.6 }, { e: 'redheart', key: 'community', delta: 3 }, { e: 'time', minutes: 40 }, { e: 'toast', text: 'בין החוטים — קול. הוא חייך בלי להרים את העיניים מהמברג.', tone: 'plain' }] },
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
  if (!state.flags['a7:knows']) return 'שבת. ברחוב מדברים על שבת הבאה. תבין על מה.'
  if (sceneId === 'home') return 'אבא. לשאול.'
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
    waitingHe: 'ממתין: אבא מכבה את האור',
    when: { flag: A7, afterMinute: at(20, 30), none: [{ flag: 'a7:refused' }] },
    do: [{ a: 'lines', lines: [{ who: null, text: 'לילה. לא שאלת. העיתון מתחת למיטה, מקופל על הכותרת.' }] }, { a: 'flag', flag: 'a7:refused' }, { a: 'ending', id: 'silent' }],
  },
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
        { id: 'me-too', text: '"גם אני."', then: [{ e: 'flag', flag: 'a7:said-yes' }, { e: 'rel', who: 'ofir', axis: 'bond', delta: 3 }, { e: 'personality', key: 'courage', delta: 2 }, { e: 'toast', text: '"יאללה." הוא לחץ לך את היד כמו גדולים.', tone: 'plain' }] },
        { id: 'dad', text: '"תלוי באבא שלי."', then: [{ e: 'personality', key: 'reliability', delta: 1 }, { e: 'toast', text: '"תלוי באבא." הוא אמר את זה בקול שלך ולא צחק.', tone: 'plain' }] },
      ] },
    ],
  },
  {
    id: 'kobi-a7',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'a7:refused' }, lines: [{ who: 'קובי', text: 'אמרתי. לא השבוע. אל תשאל אותי עוד פעם.' }] },
      {
        when: { flag: 'a7:knows' },
        lines: [{ who: 'קובי', text: 'מה, עמית כבר סיפר לך. כן. שבת הבאה, ואל תגיד לי שאתה לא יודע מה זה.' }],
        choices: [
          { id: 'ask', text: '"קח אותי."', then: [{ e: 'flag', flag: 'a7:refused' }, { e: 'flag', flag: 'life:a7:refused' }, { e: 'rel', who: 'kobi', axis: 'tension', delta: 4 }, { e: 'wellbeing', key: 'stress', delta: 4 }, { e: 'remember', who: 'kobi', eventId: 'said-no-1986', significance: 'major' }, { e: 'toast', text: '"לא השבוע. זה לא משחק לילדים."', tone: 'red' }, { e: 'ending', id: 'refused' }] },
          { id: 'hint', text: '"אופיר הולך."', then: [{ e: 'flag', flag: 'a7:refused' }, { e: 'flag', flag: 'life:a7:promised' }, { e: 'rel', who: 'kobi', axis: 'familiarity', delta: 2 }, { e: 'toast', text: '"נראה." הוא חזר לעיתון.', tone: 'plain' }, { e: 'ending', id: 'promised' }] },
          { id: 'quiet', text: 'לא לשאול.', then: [{ e: 'personality', key: 'stubbornness', delta: 1 }, { e: 'wellbeing', key: 'loneliness', delta: 2 }] },
        ],
      },
      { lines: [{ who: 'קובי', text: 'מה אתה עומד עלי? לך לשחק, עוד אור בחוץ.' }] },
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
