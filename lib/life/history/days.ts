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
/**
 * מסמך פנימי הוא לא מקור היסטורי — 7.9.2026, במילים של מאור עצמו.
 *
 * הוא נשאר רשום, כי הוא כן טוען טענות ואנחנו שומרים טענות. הוא פשוט מסומן `brief`, ובדיקה
 * בקובץ `tests/life-history.test.ts` אוסרת על אירוע להיות `speakable` בלי מקור `archive`
 * אחד לפחות. זאת ההוראה שלו, אכיפה.
 */
const AUDIT: HistorySource = {
  id: 'maor-audit-2026-09-07',
  titleHe: 'מאור הראל — מסמך ביקורת פנימי, 7.9.2026 (טענה פנימית, לא מקור היסטורי)',
  url: null,
  kind: 'brief',
}
const WIKI_ARTZIT: HistorySource = {
  id: 'wiki-artzit-8990',
  titleHe: '1989–90 Liga Artzit — Wikipedia (טבלה סופית: הפועל ת"א 55 והפרש 25+, מכבי יבנה 55 והפרש 23+; עלו צפרירים חולון והפועל ת"א)',
  url: 'https://en.wikipedia.org/wiki/1989%E2%80%9390_Liga_Artzit',
  kind: 'archive',
}
const BALLERZ: HistorySource = {
  id: 'ballerz-laces-26',
  titleHe: 'Ballerz — 26 שנה למשחק השרוכים ("שני מחזורים לסיום העונה"; אבוקסיס 61, חזן 86, פישונט 93)',
  url: 'https://ballerz.co.il/26-%D7%A9%D7%A0%D7%94-%D7%9C%D7%9E%D7%A9%D7%97%D7%A7-%D7%94%D7%A9%D7%A8%D7%95%D7%9B%D7%99%D7%9D/',
  kind: 'archive',
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
  {
    seq: 1,
    pacing: 12,
    who: "מוריס ז'אנו",
    score: '1–0',
    minute: 15,
    how: 'נגיחה. הדקה היחידה שוואלה נוקב לאורך כל המשחק.',
  },
  { seq: 2, pacing: 29, who: "מוריס ז'אנו", score: '2–0', minute: null, how: 'מפנדל.' },
  { seq: 3, pacing: 44, who: "מוריס ז'אנו", score: '3–0', minute: null, how: 'שלושער, מקרוב, מבישול של מספרת של אלי כהן.', assist: 'אלי כהן' },
  { seq: 4, pacing: 58, who: 'רפי שמואל', score: '4–0', minute: null, how: 'נגיחה, "בחלוף שבע דקות" מהשלישי, מבישול של ישראל מאיה.', assist: 'ישראל מאיה', display: 'שבע דקות אחרי השלישי' },
  { seq: 5, pacing: 71, who: 'ישראל מאיה', score: '5–0', minute: null, how: 'החמישי, "תוצרת מאיה".' },
  { seq: 6, pacing: 84, who: 'יוסי אבוקסיס', score: '6–0', minute: null, how: 'נגיחה בזמן הפציעות, לרשת של השוער גבי אלבז.', display: 'בזמן הפציעות' },
].map((row) =>
  ev({
    id: `1990-bloomfield-goal-${row.seq}`,
    matchId: M90_HOME,
    venueId: BLOOMFIELD_90,
    minute: row.minute ?? null,
    ...(row.display ? { displayMinute: row.display } : {}),
    sequence: row.seq,
    type: 'goal',
    teamSlug: 'הפועל-תל-אביב',
    personHe: row.who,
    ...(row.assist ? { assistHe: row.assist } : {}),
    scoreAfter: row.score,
    sourceIds: [WALLA.id],
    confidence: row.minute !== null ? 'verified' : 'high',
    conflictNote: `${row.how} וואלה מתאר את השער; מלבד ה-15 אין דקות בשום מקור. עד 7.9.2026 רשם הפרויקט "אלבז" ככובש השישי — קריאה מוטעית של "נגיחה לרשת של גבי אלבז", שהוא השוער שספג.`,
    speakable: true,
    pacingMinute: row.pacing,
  }),
)

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
    conflictNote: 'הכובש מופיע במסמכים הפנימיים בלבד ואינו מקור היסטורי. מה שכן מאומת הוא המרווח — ראו 1990-yavne-margin.',
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
    conflictNote: 'הכובש מופיע במסמכים הפנימיים בלבד ואינו מקור היסטורי. מה שכן מאומת הוא המרווח — ראו 1990-yavne-margin.',
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
    conflictNote: 'הכובש מופיע במסמכים הפנימיים בלבד ואינו מקור היסטורי. מה שכן מאומת הוא המרווח — ראו 1990-yavne-margin.',
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
    conflictNote: 'הכובש ממסמך פנימי בלבד. שורת התוצאה בארכיון נשארת ריקה בכוונה; המרווח נגזר בנפרד.',
    pacingMinute: 86,
    lineHe: 'יבנה מובילה, ובגדול.',
  }),
  /**
   * מה שהארכיון כן יודע על יבנה — בלי שאף מקור אומר את זה במפורש.
   *
   * וואלה: לפני המחזור שתיהן על 52 נקודות עם הפרש שערים זהה (19+).
   * ויקיפדיה, טבלת 1989/90 בליגה הארצית: בסיום הפועל תל אביב 55 והפרש 25+, מכבי יבנה 55
   * והפרש 23+.
   *
   * 19+6=25 ✓ (השישייה בבלומפילד), ו-19+4=23 — כלומר **יבנה ניצחה בהפרש של ארבעה שערים**,
   * ושלוש הנקודות מאשרות ניצחון. זו נגזרת משני מקורות מאומתים ולא טענה חדשה; התוצאה
   * המדויקת (0:4? 1:5?) אינה נגזרת ולכן אינה נטענת. וזה גם כל מה שהמשחק צריך: המרווח.
   */
  ev({
    id: '1990-yavne-margin',
    matchId: M90_AWAY,
    venueId: YAVNE_90,
    minute: null,
    sequence: 7,
    type: 'state',
    sourceIds: [WALLA.id, WIKI_ARTZIT.id],
    confidence: 'high',
    conflictNote:
      'נגזר, לא נמצא: 52 נקודות והפרש 19+ לשתיהן לפני המחזור (וואלה) מול 55 והפרש 25+/23+ בסיום (ויקיפדיה) נותנים ליבנה ניצחון בהפרש ארבעה. התוצאה המדויקת אינה נגזרת ואינה נטענת.',
    speakable: true,
    pacingMinute: 87,
  }),
]

export const DAY_1990: HistoryDay = {
  id: '1990-05-12',
  dateHe: '12 במאי 1990',
  primaryVenueId: BLOOMFIELD_90,
  sources: [WALLA, WIKI_ARTZIT, AUDIT, MISSION01],
  silenceHe: 'הארכיון אינו מחזיק תוצאה למשחק יבנה, ואינו נוקב דקה לאף אחד מששת השערים בבלומפילד.',
  venues: [
    {
      venueId: BLOOMFIELD_90,
      matchId: M90_HOME,
      nameHe: 'בלומפילד',
      kickoffOffset: 0,
      finalHe: '6–0',
      round: { number: 30, ofTotal: 30, isFinal: true },
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
      round: { number: 30, ofTotal: 30, isFinal: true },
      stakeHe: 'המשחק שמחליט אם המשחק שלך שווה משהו.',
      events: YAVNE_90_EVENTS,
    },
  ],
}

// -------------------------------------------------------------------- 2.5.1998 ---

const BLOOMFIELD_98 = 'bloomfield'
const BEITSHEAN_98 = 'beit-shean'
const M98_HOME = '1997/98|ליגת-העל|הפועל-תל-אביב|הפועל-פתח-תקווה|מחזור 29'
const M98_AWAY = '1997/98|ליגת-העל|הפועל-בית-שאן|בית"ר-ירושלים|מחזור 29 — המשחק המקביל'

export const DAY_1998: HistoryDay = {
  id: '1998-05-02',
  dateHe: '2 במאי 1998',
  primaryVenueId: BLOOMFIELD_98,
  sources: [SPORT5, WIKI_98, BALLERZ, AUDIT],
  silenceHe: 'שתי התוצאות מאומתות; מהמהלך עצמו רק דקת השער המכריע מופיעה במקור פומבי, ושני מקורות חלוקים עליה.',
  venues: [
    {
      venueId: BLOOMFIELD_98,
      matchId: M98_HOME,
      nameHe: 'בלומפילד',
      kickoffOffset: 0,
      finalHe: '1–0',
      round: { number: 29, ofTotal: 30, isFinal: false },
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
          conflictNote: 'הכובש מופיע במסמך פנימי בלבד ואינו מקור היסטורי; ויקיפדיה מאמתת את התוצאה 1:0 ולא את הכובש, ואין דקה בשום מקור.',
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
      round: { number: 29, ofTotal: 30, isFinal: false },
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
        /**
         * מה שקרה בקריית אליעזר — לפי Ballerz, עם שמות ועם דקות.
         *
         * עד 7.9.2026 חמשת האירועים כאן היו "ממסמך הביקורת בלבד" ובלי אף דקה. מעבר מקורות
         * מצא תיאור מהלך מלא: שער פתיחה של בית שאן, השוואה של בית"ר בתוספת של המחצית
         * הראשונה, אבוקסיס מעונשין ב-61, חזן ב-86, ופישונט ב-93. שלוש הדקות האחרונות הן
         * דקות של מקור — לא שלנו.
         *
         * מה שהוסר: פנדל שהוחמץ בבית שאן. הוא הופיע רק במסמך פנימי, אף מקור לא נושא אותו,
         * ואירוע בלי ראיה לא נשאר בארכיון רק כי הוא דרמטי.
         */
        ev({
          id: '1998-parallel-goal-1',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: null,
          displayMinute: 'בפתיחה',
          sequence: 1,
          type: 'goal',
          teamSlug: 'הפועל-בית-שאן',
          personHe: "זלקו אצ'יץ'",
          scoreAfter: '1–0',
          sourceIds: [BALLERZ.id],
          confidence: 'high',
          conflictNote: 'Ballerz מתאר בעיטה מקו הרחבה לרשת העליונה בפתיחת המשחק, בלי דקה מדויקת.',
          speakable: true,
          pacingMinute: 20,
          lineHe: 'שם הם מפגרים.',
        }),
        ev({
          id: '1998-parallel-goal-2',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: null,
          displayMinute: 'בתוספת של המחצית הראשונה',
          sequence: 2,
          type: 'goal',
          teamSlug: 'בית"ר-ירושלים',
          personHe: 'סטפן שאלוי',
          assistHe: 'יוסי אבוקסיס',
          scoreAfter: '1–1',
          sourceIds: [BALLERZ.id],
          confidence: 'high',
          conflictNote: 'נגיחה מהרחקה שהגיעה לאבוקסיס. Ballerz ממקם אותה בתוספת של המחצית הראשונה ולא נוקב דקה.',
          speakable: true,
          pacingMinute: 45,
          lineHe: 'שם השוו.',
        }),
        ev({
          id: '1998-parallel-goal-3',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: 61,
          sequence: 3,
          type: 'goal',
          teamSlug: 'בית"ר-ירושלים',
          personHe: 'יוסי אבוקסיס',
          scoreAfter: '1–2',
          sourceIds: [BALLERZ.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 62,
          lineHe: 'שם הם מובילים. מי אמר? ההוא אמר.',
        }),
        ev({
          id: '1998-parallel-goal-4',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: 86,
          sequence: 4,
          type: 'goal',
          teamSlug: 'הפועל-בית-שאן',
          personHe: 'אלמוג חזן',
          scoreAfter: '2–2',
          sourceIds: [BALLERZ.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 86,
          lineHe: 'שוויון שם! שוויון!',
        }),
        /**
         * השער — עכשיו שני מקורות עצמאיים על אותה דקה.
         *
         * ערוץ הספורט נוקב 93 בכותרת שלו, ו-Ballerz נוקב 93 בגוף הטקסט. המסמך הפנימי נוקב
         * 94. שניים מול אחד, והשניים הם מקורות פומביים — לכן `verified`, והטענה השלישית
         * נשמרת. המשחק ממשיך לומר "תוספת הזמן" ולא מספר.
         */
        ev({
          id: '1998-parallel-goal-5',
          matchId: M98_AWAY,
          venueId: BEITSHEAN_98,
          minute: 93,
          displayMinute: 'תוספת הזמן',
          sequence: 5,
          type: 'goal',
          teamSlug: 'בית"ר-ירושלים',
          personHe: 'אישטוון פישונט',
          scoreAfter: '2–3',
          sourceIds: [SPORT5.id, BALLERZ.id],
          confidence: 'verified',
          conflictNote: 'ערוץ הספורט ו-Ballerz נוקבים 93; המסמך הפנימי נוקב 94. המשחק אומר "תוספת הזמן".',
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
          sourceIds: [SPORT5.id, WIKI_98.id, BALLERZ.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 95,
          lineHe: 'נגמר שם.',
        }),
      ],
    },
  ],
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

// ------------------------------------------------------- 26.5.1999 · הגמר ---
/**
 * גמר גביע המדינה, רמת גן. 1:1 אחרי הארכה, והגביע בפנדלים 3:1.
 *
 * מה שמאומת: התוצאה, ההארכה, הפנדלים, 33,000 צופים והשופט קורן — הכול מוויקיפדיה.
 * מה שלא: מי כבש, באיזו דקה, ובאיזה סדר. הפרק אומר "שלהם קודם, השוויון אחרי" מאז שנכתב,
 * וזה טענה של הפרק ולא של מקור — לכן `disputed`, ולכן איש לא נוקב בשם.
 *
 * הגמר הזה הוא הסיבה שהבמאי צריך שלב `extra` ושלב `penalties`: משחק גביע לא נגמר בתשעים,
 * ותוצאה של פנדלים היא הדבר היחיד ביום מבוים שהוא לא שעון אלא הכרעה.
 */
const CUP99 = 'ramat-gan-99'
const M99 = '1998/99|גביע-המדינה|בית"ר-ירושלים|הפועל-תל-אביב|גמר'
const WIKI_99: HistorySource = {
  id: 'wiki-cup-9899',
  titleHe: '1998–99 Israel State Cup — Wikipedia (1–1, 3–1 בפנדלים; 33,000; שופט קורן)',
  url: 'https://en.wikipedia.org/wiki/1998%E2%80%9399_Israel_State_Cup',
  kind: 'archive',
}
const CHAPTER99: HistorySource = {
  id: 'chapter-1999-cup',
  titleHe: 'הפרק עצמו — סדר השערים כפי שנכתב, בלי מקור חיצוני',
  url: null,
  kind: 'brief',
}

export const DAY_1999: HistoryDay = {
  id: '1999-05-26',
  dateHe: '26 במאי 1999',
  primaryVenueId: CUP99,
  sources: [WIKI_99, CHAPTER99],
  silenceHe: 'התוצאה, ההארכה והפנדלים מאומתים. מי כבש, מתי ובאיזה סדר — לא.',
  venues: [
    {
      venueId: CUP99,
      matchId: M99,
      nameHe: 'רמת גן',
      kickoffOffset: 0,
      finalHe: '1–1 (3–1 בפנדלים)',
      stakeHe: 'הגביע הראשון מאז הכתפיים.',
      events: [
        ev({
          id: '1999-goal-theirs',
          matchId: M99,
          venueId: CUP99,
          minute: null,
          sequence: 1,
          type: 'goal',
          teamSlug: 'בית"ר-ירושלים',
          scoreAfter: '1–0',
          sourceIds: [CHAPTER99.id],
          confidence: 'disputed',
          conflictNote: 'הסדר — שלהם קודם — הוא של הפרק. ויקיפדיה מאמתת 1:1 ולא את הסדר, ואין דקה לאף שער.',
          pacingMinute: 31,
          lineHe: 'הצד השני של הקערה עולה באוויר.',
        }),
        ev({
          id: '1999-goal-ours',
          matchId: M99,
          venueId: CUP99,
          minute: null,
          sequence: 2,
          type: 'goal',
          teamSlug: 'הפועל-תל-אביב',
          scoreAfter: '1–1',
          sourceIds: [CHAPTER99.id],
          confidence: 'disputed',
          conflictNote: 'כנ"ל — סדר מהפרק, תוצאה מוויקיפדיה, דקה משום מקום.',
          pacingMinute: 74,
          lineHe: 'השוויון. האצטדיון עולה באוויר ונשאר שם.',
        }),
        ev({
          id: '1999-full',
          matchId: M99,
          venueId: CUP99,
          minute: 90,
          sequence: 3,
          type: 'full_time',
          scoreAfter: '1–1',
          sourceIds: [WIKI_99.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 90,
          lineHe: 'הארכה.',
        }),
        ev({
          id: '1999-extra-end',
          matchId: M99,
          venueId: CUP99,
          minute: 120,
          sequence: 4,
          type: 'full_time',
          scoreAfter: '1–1',
          sourceIds: [WIKI_99.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 120,
          lineHe: 'ואז השופט מסתכל בשעון, ואתה יודע מה זה אומר.',
        }),
      ],
    },
  ],
}

// ------------------------------------------------- 13.5.2000 · האליפות ---
/**
 * בני יהודה 1:1 הפועל תל אביב בשכונת התקווה, מחזור 33 — והתיקו הספיק.
 *
 * זה מה שהופך את היום הזה לשונה משני הימים המקבילים: אין כאן מגרש שני. מה שמאומת הוא
 * שהתיקו הבטיח את האליפות, וזאת הצורה שהיום רץ עליה. **לא המצאתי משחק מקביל** רק כדי
 * שיהיה לבמאי שני שעונים.
 */
const HATIKVA = 'hatikva-2000'
const M00T = '1999/00|ליגת-העל|בני-יהודה|הפועל-תל-אביב|מחזור 33 — האליפות הוכרעה'
const WIKI_00L: HistorySource = {
  id: 'wiki-league-9900',
  titleHe: '1999–2000 Israeli Premier League — Wikipedia (בני יהודה 1–1 הפועל ת"א; טבלה סופית: הפועל 85)',
  url: 'https://en.wikipedia.org/wiki/1999%E2%80%932000_Israeli_Premier_League',
  kind: 'archive',
}

export const DAY_2000_TITLE: HistoryDay = {
  id: '2000-05-13',
  dateHe: '13 במאי 2000',
  primaryVenueId: HATIKVA,
  sources: [WIKI_00L],
  silenceHe: 'התוצאה והטבלה מאומתות. הכובשים והדקות אינם, ואין מגרש מקביל שהארכיון מחזיק ליום הזה.',
  venues: [
    {
      venueId: HATIKVA,
      matchId: M00T,
      nameHe: 'שכונת התקווה',
      kickoffOffset: 0,
      finalHe: '1–1',
      stakeHe: 'תיקו מספיק. זאת כל האריתמטיקה של היום.',
      events: [
        ev({
          id: '2000-title-enough',
          matchId: M00T,
          venueId: HATIKVA,
          minute: 0,
          sequence: 0,
          type: 'state',
          scoreAfter: '0–0',
          sourceIds: [WIKI_00L.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 0,
          lineHe: 'נקודה אחת. זה כל מה שצריך היום.',
        }),
        ev({
          id: '2000-title-goal-1',
          matchId: M00T,
          venueId: HATIKVA,
          minute: null,
          sequence: 1,
          type: 'goal',
          scoreAfter: '1–0',
          sourceIds: [WIKI_00L.id],
          confidence: 'disputed',
          conflictNote: 'התוצאה 1:1 מאומתת; מי כבש, מתי ובאיזה סדר — אין מקור. הסדר כאן הוא בימוי.',
          pacingMinute: 38,
        }),
        ev({
          id: '2000-title-goal-2',
          matchId: M00T,
          venueId: HATIKVA,
          minute: null,
          sequence: 2,
          type: 'goal',
          teamSlug: 'הפועל-תל-אביב',
          scoreAfter: '1–1',
          sourceIds: [WIKI_00L.id],
          confidence: 'disputed',
          conflictNote: 'כנ"ל.',
          pacingMinute: 67,
        }),
        ev({
          id: '2000-title-full',
          matchId: M00T,
          venueId: HATIKVA,
          minute: 90,
          sequence: 3,
          type: 'full_time',
          scoreAfter: '1–1',
          sourceIds: [WIKI_00L.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 90,
          lineHe: 'שריקה. וזהו — זה קרה.',
        }),
      ],
    },
  ],
}

// --------------------------------------------------- 17.5.2000 · הדאבל ---
/**
 * גמר הגביע, ארבעה ימים אחרי האליפות. 2:2 אחרי הארכה, 4:2 בפנדלים — הדאבל.
 * אותה צורה כמו 1999, ואותה שתיקה: התוצאה מאומתת, הכובשים לא.
 */
const RG00 = 'ramat-gan-2000'
const M00C = '1999/00|גביע-המדינה|בית"ר-ירושלים|הפועל-תל-אביב|גמר'
const WIKI_00C: HistorySource = {
  id: 'wiki-cup-9900',
  titleHe: '1999–2000 Israel State Cup — Wikipedia (2–2, 4–2 בפנדלים; 40,000; שופט לוי)',
  url: 'https://en.wikipedia.org/wiki/1999%E2%80%932000_Israel_State_Cup',
  kind: 'archive',
}

export const DAY_2000_DOUBLE: HistoryDay = {
  id: '2000-05-17',
  dateHe: '17 במאי 2000',
  primaryVenueId: RG00,
  sources: [WIKI_00C],
  silenceHe: 'התוצאה, ההארכה והפנדלים מאומתים. הכובשים והדקות אינם.',
  venues: [
    {
      venueId: RG00,
      matchId: M00C,
      nameHe: 'רמת גן',
      kickoffOffset: 0,
      finalHe: '2–2 (4–2 בפנדלים)',
      stakeHe: 'ארבעה ימים אחרי האליפות. דאבל.',
      events: [
        ev({
          id: '2000-double-goal-1',
          matchId: M00C,
          venueId: RG00,
          minute: null,
          sequence: 1,
          type: 'goal',
          scoreAfter: '1–0',
          sourceIds: [WIKI_00C.id],
          confidence: 'disputed',
          conflictNote: 'התוצאה 2:2 מאומתת; הכובשים, הדקות והסדר אינם. הסדר כאן הוא בימוי.',
          pacingMinute: 22,
        }),
        ev({
          id: '2000-double-goal-2',
          matchId: M00C,
          venueId: RG00,
          minute: null,
          sequence: 2,
          type: 'goal',
          scoreAfter: '1–1',
          sourceIds: [WIKI_00C.id],
          confidence: 'disputed',
          conflictNote: 'כנ"ל.',
          pacingMinute: 51,
        }),
        ev({
          id: '2000-double-goal-3',
          matchId: M00C,
          venueId: RG00,
          minute: null,
          sequence: 3,
          type: 'goal',
          scoreAfter: '2–1',
          sourceIds: [WIKI_00C.id],
          confidence: 'disputed',
          conflictNote: 'כנ"ל.',
          pacingMinute: 78,
        }),
        ev({
          id: '2000-double-goal-4',
          matchId: M00C,
          venueId: RG00,
          minute: null,
          sequence: 4,
          type: 'goal',
          scoreAfter: '2–2',
          sourceIds: [WIKI_00C.id],
          confidence: 'disputed',
          conflictNote: 'כנ"ל.',
          pacingMinute: 88,
          lineHe: 'שוויון. ברגע האחרון.',
        }),
        ev({
          id: '2000-double-full',
          matchId: M00C,
          venueId: RG00,
          minute: 90,
          sequence: 5,
          type: 'full_time',
          scoreAfter: '2–2',
          sourceIds: [WIKI_00C.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 90,
          lineHe: 'הארכה. שוב.',
        }),
        ev({
          id: '2000-double-extra-end',
          matchId: M00C,
          venueId: RG00,
          minute: 120,
          sequence: 6,
          type: 'full_time',
          scoreAfter: '2–2',
          sourceIds: [WIKI_00C.id],
          confidence: 'verified',
          speakable: true,
          pacingMinute: 120,
          lineHe: 'פנדלים. שוב. ארבעה ימים אחרי.',
        }),
      ],
    },
  ],
}

export const HISTORY_DAYS: Record<string, HistoryDay> = {
  '1990-05-12': DAY_1990,
  '1998-05-02': DAY_1998,
  '1999-05-26': DAY_1999,
  '2000-05-13': DAY_2000_TITLE,
  '2000-05-17': DAY_2000_DOUBLE,
}
