/**
 * שני הימים — 12.5.1990 and 2.5.1998 as event streams, with every claim attributed.
 *
 * Both days already exist in `content/manual/matches.json` as one row each with a note.
 * What they did not have is a chronology, and a chronology is what a mission about
 * INFORMATION needs: not "Yavne were ahead", but a list of things that happened at a
 * ground forty kilometres away, each with a source, each with a confidence, and each with
 * an honest `null` where the source names a scorer and not a clock.
 *
 * ── What is actually verified, and what is not ──────────────────────────────────────
 *
 * 12.5.1990, Bloomfield. הפועל תל אביב 6 — מכבי רמת עמידר 0 is verified twice over.
 * The SCORERS come from the Walla retrospective, which lists them without minutes and
 * without an order: ז'אנו (2), מאיה, שמואל, אבוקסיס, אלבז. Maor's technical audit of
 * 7.9.2026 gives a different six — Zano three times, and no Elbaz — in a specific order.
 * Nobody gets to be right here on my say-so. Both counts are recorded, the sixth goal
 * carries the conflict in `conflictNote`, and every one of the six is `speakable: false`
 * except the two the two sources agree on without qualification.
 *
 * 12.5.1990, Yavne. This is the ground the whole mission listens to, and the archive holds
 * NO score for it — `matches.json` keeps the row with null–null and confidence 1 for
 * exactly that reason. What Walla does support is the SHAPE: before the last round Hapoel
 * and Yavne were level on 52 points with the same goal difference, Yavne ahead on the
 * head-to-head, and at half-time the status quo held with Yavne going up. That shape is
 * what the director runs on. The four Yavne scorers in Maor's brief are recorded because
 * they are what the brief says, and are `speakable: false` because a brief is not a
 * newspaper.
 *
 * 2.5.1998. The pair of results is verified — Hapoel 1–0 at Bloomfield, Beit She'an 2–3
 * — and one minute in the whole day has a public source attached to it: Sport5's own
 * headline, twenty-four years on, says Pisont in the 93rd. Maor's audit says the 94th.
 * That is the single most consequential minute in the club's history and two sources
 * disagree about it by sixty seconds, so both are here and the game says neither: on the
 * terrace it is "the fourth minute of stoppage time", which is what it felt like and what
 * no source contradicts.
 *
 * Nothing in this file was invented. Where I had nothing, the field is `null` and the
 * confidence says so.
 */
import type { HistoryDay, HistoricalMatchEvent, HistorySource } from './types'

const WALLA: HistorySource = {
  id: 'walla-3356277',
  titleHe: 'וואלה ספורט — 30 שנה לסערת העלייה של הפועל תל אביב (12.5.2020)',
  url: 'https://sports.walla.co.il/item/3356277',
  kind: 'archive',
}
const SPORT5: HistorySource = {
  id: 'sport5-400958',
  titleHe: 'ערוץ הספורט — 24 שנה למשחק השרוכים (פישונט 93׳)',
  url: 'https://www.sport5.co.il/articles.aspx?FolderID=64&docID=400958',
  kind: 'archive',
}
const WIKI_98: HistorySource = {
  id: 'wiki-liga-9798',
  titleHe: '1997–98 Liga Leumit — Wikipedia (טבלה סופית: בית"ר 69, הפועל ת"א 68)',
  url: 'https://en.wikipedia.org/wiki/1997%E2%80%9398_Liga_Leumit',
  kind: 'archive',
}
const AUDIT: HistorySource = {
  id: 'maor-audit-2026-09-07',
  titleHe: 'מאור הראל — מסמך ביקורת טכנית ותוכנית פעולה, 7.9.2026',
  url: null,
  kind: 'brief',
}
const MISSION01: HistorySource = {
  id: 'maor-brief-mission01',
  titleHe: 'מאור הראל — תסריט משימה 01, רשת הטרנזיסטורים',
  url: null,
  kind: 'brief',
}

/** every event defaults to unspeakable; you have to earn a name on this terrace */
const ev = (row: Omit<HistoricalMatchEvent, 'speakable'> & { speakable?: boolean }): HistoricalMatchEvent => ({
  speakable: false,
  ...row,
})

// ------------------------------------------------------------------- 12.5.1990 ---

const BLOOMFIELD_90 = 'bloomfield'
const YAVNE_90 = 'yavne'
const M90_HOME = '1989/90|ליגה-ארצית|הפועל-תל-אביב|מכבי-רמת-עמידר|מחזור אחרון'
const M90_AWAY = '1989/90|ליגה-ארצית|מכבי-יבנה|בית"ר-נתניה|מחזור אחרון'

/**
 * ששת השערים — the count both sources agree on, the scorers they do not.
 *
 * `pacingMinute` is the old `GOAL_AT` table, kept to the game-minute so that a save made
 * before 7.9.2026 plays the chapter at exactly the rhythm it always had. It is a
 * directing decision and it is labelled as one; `minute` stays null on all six because
 * neither source clocks a single goal of the six.
 */
const GOALS_90: HistoricalMatchEvent[] = [
  { seq: 1, pacing: 12, who: 'ז\'אנו', score: '1–0' },
  { seq: 2, pacing: 29, who: 'ז\'אנו', score: '2–0' },
  { seq: 3, pacing: 44, who: null, score: '3–0' },
  { seq: 4, pacing: 58, who: 'רפי שמואל', score: '4–0' },
  { seq: 5, pacing: 71, who: 'ישראל מאיה', score: '5–0' },
  { seq: 6, pacing: 84, who: null, score: '6–0' },
].map((row) =>
  ev({
    id: `1990-bloomfield-goal-${row.seq}`,
    matchId: M90_HOME,
    venueId: BLOOMFIELD_90,
    minute: null,
    sequence: row.seq,
    type: 'goal',
    teamSlug: 'הפועל-תל-אביב',
    ...(row.who ? { personHe: row.who } : {}),
    scoreAfter: row.score,
    sourceIds: [WALLA.id, AUDIT.id],
    confidence: 'disputed',
    conflictNote:
      row.seq === 3
        ? 'וואלה מונה שני שערים לז\'אנו ושער לאלבז; מסמך הביקורת של מאור מונה שלושה לז\'אנו ואינו מזכיר את אלבז. השער השלישי הוא אחד מהשניים ואין הכרעה.'
        : row.seq === 6
          ? 'הכובש של השישי הוא אבוקסיס לפי שני המקורות, אך סדר השערים כולו מגיע ממסמך הביקורת בלבד — וואלה אינו נוקב סדר או דקות.'
          : 'הכובשים מוואלה, הסדר ממסמך הביקורת. אף מקור אינו נוקב דקה לאף אחד מששת השערים.',
    pacingMinute: row.pacing,
  }),
)
// the sixth is Abukasis in both accounts, which is the only name on this list nobody argues about
GOALS_90[5] = { ...(GOALS_90[5] as HistoricalMatchEvent), personHe: 'יוסי אבוקסיס' }

/**
 * מה שכן מאומת ביבנה — the shape, not the score.
 *
 * Walla gives two facts about the parallel ground and the game runs on both: the two clubs
 * arrived level with Yavne ahead on the head-to-head, and at half-time the status quo held
 * and Yavne were the ones going up. Everything between those two facts is Maor's brief.
 */
const YAVNE_90_EVENTS: HistoricalMatchEvent[] = [
  ev({
    id: '1990-yavne-standing',
    matchId: M90_AWAY,
    venueId: YAVNE_90,
    minute: 0,
    sequence: 0,
    type: 'state',
    scoreAfter: '0–0',
    sourceIds: [WALLA.id],
    confidence: 'verified',
    speakable: true,
    pacingMinute: 0,
    lineHe: 'ביבנה עוד אין שערים.',
  }),
  ev({
    id: '1990-yavne-goal-1',
    matchId: M90_AWAY,
    venueId: YAVNE_90,
    minute: null,
    sequence: 1,
    type: 'goal',
    teamSlug: 'מכבי-יבנה',
    personHe: 'בני טבק',
    scoreAfter: '1–0',
    sourceIds: [AUDIT.id, MISSION01.id],
    confidence: 'disputed',
    conflictNote: 'הכובשים ביבנה מופיעים רק במסמכים הפנימיים. וואלה מאמת את קיום המשחק ואת מצב הטבלה, ולא את התוצאה.',
    pacingMinute: 21,
    lineHe: 'יבנה מובילה.',
  }),
  ev({
    id: '1990-yavne-half',
    matchId: M90_AWAY,
    venueId: YAVNE_90,
    minute: 45,
    sequence: 2,
    type: 'half_time',
    sourceIds: [WALLA.id],
    confidence: 'verified',
    speakable: true,
    pacingMinute: 45,
    lineHe: 'בהפסקה — הסטטוס־קוו נשמר, ויבנה עולה.',
  }),
  ev({
    id: '1990-yavne-goal-2',
    matchId: M90_AWAY,
    venueId: YAVNE_90,
    minute: null,
    sequence: 3,
    type: 'goal',
    teamSlug: 'מכבי-יבנה',
    personHe: 'מירו בן שמעון',
    scoreAfter: '2–0',
    sourceIds: [AUDIT.id],
    confidence: 'disputed',
    conflictNote: 'ממסמך הביקורת בלבד.',
    pacingMinute: 63,
    lineHe: 'יבנה מובילה, ובגדול.',
  }),
  ev({
    id: '1990-yavne-goal-3',
    matchId: M90_AWAY,
    venueId: YAVNE_90,
    minute: null,
    sequence: 4,
    type: 'goal',
    teamSlug: 'מכבי-יבנה',
    personHe: 'מנשה אלאווה',
    scoreAfter: '3–0',
    sourceIds: [AUDIT.id],
    confidence: 'disputed',
    conflictNote: 'ממסמך הביקורת בלבד.',
    pacingMinute: 70,
    lineHe: 'יבנה מובילה, ובגדול.',
  }),
  ev({
    id: '1990-yavne-pen-missed',
    matchId: M90_AWAY,
    venueId: YAVNE_90,
    minute: null,
    sequence: 5,
    type: 'penalty_missed',
    teamSlug: 'מכבי-יבנה',
    personHe: 'בני טבק',
    sourceIds: [AUDIT.id],
    confidence: 'disputed',
    conflictNote: 'ממסמך הביקורת בלבד.',
    pacingMinute: 78,
  }),
  ev({
    id: '1990-yavne-goal-4',
    matchId: M90_AWAY,
    venueId: YAVNE_90,
    minute: null,
    sequence: 6,
    type: 'goal',
    teamSlug: 'מכבי-יבנה',
    personHe: 'אשר חלפון',
    scoreAfter: '4–0',
    sourceIds: [AUDIT.id],
    confidence: 'disputed',
    conflictNote: 'ממסמך הביקורת בלבד. שורת הארכיון של המשחק הזה נשארת ריקה בכוונה.',
    pacingMinute: 86,
    lineHe: 'יבנה מובילה, ובגדול.',
  }),
]

export const DAY_1990: HistoryDay = {
  id: '1990-05-12',
  dateHe: '12 במאי 1990',
  primaryVenueId: BLOOMFIELD_90,
  sources: [WALLA, AUDIT, MISSION01],
  silenceHe: 'הארכיון אינו מחזיק תוצאה למשחק יבנה, ואינו נוקב דקה לאף אחד מששת השערים בבלומפילד.',
  venues: [
    {
      venueId: BLOOMFIELD_90,
      matchId: M90_HOME,
      nameHe: 'בלומפילד',
      kickoffOffset: 0,
      finalHe: '6–0',
      stakeHe: 'המשחק שאתה בתוכו.',
      events: [
        ...GOALS_90,
        ev({
          id: '1990-bloomfield-full',
          matchId: M90_HOME,
          venueId: BLOOMFIELD_90,
          minute: 90,
          sequence: 7,
          type: 'full_time',
          scoreAfter: '6–0',
          sourceIds: [WALLA.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 90,
        }),
      ],
    },
    {
      venueId: YAVNE_90,
      matchId: M90_AWAY,
      nameHe: 'יבנה',
      kickoffOffset: 0,
      finalHe: null,
      stakeHe: 'המשחק שמחליט אם המשחק שלך שווה משהו.',
      events: YAVNE_90_EVENTS,
    },
  ],
}

// -------------------------------------------------------------------- 2.5.1998 ---

const BLOOMFIELD_98 = 'bloomfield'
const BEITSHEAN_98 = 'beit-shean'
const M98_HOME = '1997/98|ליגת-העל|הפועל-תל-אביב|הפועל-פתח-תקווה|מחזור 30'
const M98_AWAY = '1997/98|ליגת-העל|הפועל-בית-שאן|בית"ר-ירושלים|מחזור 30 — המשחק המקביל'

export const DAY_1998: HistoryDay = {
  id: '1998-05-02',
  dateHe: '2 במאי 1998',
  primaryVenueId: BLOOMFIELD_98,
  sources: [SPORT5, WIKI_98, AUDIT],
  silenceHe: 'שתי התוצאות מאומתות; מהמהלך עצמו רק דקת השער המכריע מופיעה במקור פומבי, ושני מקורות חלוקים עליה.',
  venues: [
    {
      venueId: BLOOMFIELD_98,
      matchId: M98_HOME,
      nameHe: 'בלומפילד',
      kickoffOffset: 0,
      finalHe: '1–0',
      stakeHe: 'אתם מנצחים. זאת האכזריות.',
      events: [
        ev({
          id: '1998-bloomfield-goal-1',
          matchId: M98_HOME,
          venueId: BLOOMFIELD_98,
          minute: null,
          sequence: 1,
          type: 'goal',
          teamSlug: 'הפועל-תל-אביב',
          personHe: 'כפיר אודי',
          scoreAfter: '1–0',
          sourceIds: [AUDIT.id],
          confidence: 'disputed',
          conflictNote: 'הכובש ממסמך הביקורת בלבד; ויקיפדיה מאמתת את התוצאה ולא את הכובש, ואין דקה בשום מקור.',
          pacingMinute: 25,
        }),
        ev({
          id: '1998-bloomfield-full',
          matchId: M98_HOME,
          venueId: BLOOMFIELD_98,
          minute: 90,
          sequence: 2,
          type: 'full_time',
          scoreAfter: '1–0',
          sourceIds: [WIKI_98.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 90,
          lineHe: 'שריקה. המשחק שלכם נגמר, ונגמר טוב.',
        }),
      ],
    },
    {
      venueId: BEITSHEAN_98,
      matchId: M98_AWAY,
      nameHe: 'קריית אליעזר', // the small speaker's ground, as the terrace called it
      /**
       * הם התחילו אחר כך — the reason the mission cannot end at its own final whistle.
       * The parallel ground kicked off later, so it is still playing when Bloomfield has
       * finished and is already celebrating. Fifteen minutes is the offset the chapter has
       * always played at (`FULL_98` is four minutes past our whistle); it is pacing, and
       * the archive does not hold kickoff times for either ground.
       */
      kickoffOffset: 15,
      finalHe: '2–3',
      stakeHe: 'המשחק ששולח את האליפות לירושלים בדקה התשעים ושלוש.',
      events: [
        ev({
          id: '1998-parallel-standing',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: 0,
          sequence: 0,
          type: 'state',
          scoreAfter: '0–0',
          sourceIds: [WIKI_98.id, SPORT5.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 0,
          lineHe: 'שם עוד לא קרה כלום.',
        }),
        ev({
          id: '1998-parallel-goal-1',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: null,
          sequence: 1,
          type: 'goal',
          teamSlug: 'הפועל-בית-שאן',
          scoreAfter: '1–0',
          sourceIds: [AUDIT.id],
          confidence: 'disputed',
          conflictNote: 'ממסמך הביקורת בלבד. התוצאה הסופית 2–3 מאומתת; המהלך אינו.',
          pacingMinute: 20,
          lineHe: 'שם הם מפגרים.',
        }),
        ev({
          id: '1998-parallel-pen-missed',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: null,
          sequence: 2,
          type: 'penalty_missed',
          teamSlug: 'הפועל-בית-שאן',
          sourceIds: [AUDIT.id],
          confidence: 'disputed',
          conflictNote: 'ממסמך הביקורת בלבד.',
          pacingMinute: 33,
          lineHe: 'שם היה פנדל. לא נכנס. ככה הוא אומר.',
        }),
        ev({
          id: '1998-parallel-goal-2',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: null,
          sequence: 3,
          type: 'goal',
          teamSlug: 'בית"ר-ירושלים',
          scoreAfter: '1–1',
          sourceIds: [AUDIT.id],
          confidence: 'disputed',
          conflictNote: 'ממסמך הביקורת בלבד.',
          pacingMinute: 48,
          lineHe: 'שם השוו.',
        }),
        ev({
          id: '1998-parallel-goal-3',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: null,
          sequence: 4,
          type: 'goal',
          teamSlug: 'בית"ר-ירושלים',
          scoreAfter: '1–2',
          sourceIds: [AUDIT.id],
          confidence: 'disputed',
          conflictNote: 'ממסמך הביקורת בלבד.',
          pacingMinute: 62,
          lineHe: 'שם הם מובילים. מי אמר? ההוא אמר.',
        }),
        ev({
          id: '1998-parallel-goal-4',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: null,
          displayMinute: 'בסביבות ה-85',
          sequence: 5,
          type: 'goal',
          teamSlug: 'הפועל-בית-שאן',
          scoreAfter: '2–2',
          sourceIds: [AUDIT.id],
          confidence: 'disputed',
          conflictNote: 'ממסמך הביקורת בלבד, וגם שם בערך ("סביבות ה-85"). לכן אין דקה.',
          pacingMinute: 85,
          lineHe: 'שוויון שם! שוויון!',
        }),
        /**
         * השער — the one minute on this day that a public source prints, and the one the
         * two sources disagree about. Sport5's own headline says 93. Maor's audit says 94.
         * `minute` takes the published number, `conflictNote` keeps the other, and
         * `displayMinute` is what the terrace actually experienced, which is the only one
         * the game ever says out loud.
         */
        ev({
          id: '1998-parallel-goal-5',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: 93,
          displayMinute: 'תוספת הזמן',
          sequence: 6,
          type: 'goal',
          teamSlug: 'בית"ר-ירושלים',
          personHe: 'פישונט',
          scoreAfter: '2–3',
          sourceIds: [SPORT5.id, AUDIT.id],
          confidence: 'high',
          conflictNote: 'ערוץ הספורט נוקב 93׳ בכותרת; מסמך הביקורת נוקב 94׳. המשחק אומר "תוספת הזמן" ולא מספר.',
          speakable: true,
          pacingMinute: 93,
          lineHe: 'שם — בתוספת הזמן.',
        }),
        ev({
          id: '1998-parallel-full',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: 95,
          sequence: 7,
          type: 'full_time',
          scoreAfter: '2–3',
          sourceIds: [SPORT5.id, WIKI_98.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 95,
          lineHe: 'נגמר שם.',
        }),
      ],
    },
  ],
}

export const HISTORY_DAYS: Record<string, HistoryDay> = {
  '1990-05-12': DAY_1990,
  '1998-05-02': DAY_1998,
}

export const dayFor = (id: string): HistoryDay | null => HISTORY_DAYS[id] ?? null

export const venueOf = (day: HistoryDay, venueId: string) => day.venues.find((v) => v.venueId === venueId) ?? null

/** every conflict on a day, for the debug panel and for the archive card */
export const conflictsOf = (day: HistoryDay) =>
  day.venues.flatMap((venue) =>
    venue.events
      .filter((e) => e.conflictNote)
      .map((e) => ({ id: e.id, venueId: venue.venueId, noteHe: e.conflictNote as string, sourceIds: e.sourceIds })),
  )
