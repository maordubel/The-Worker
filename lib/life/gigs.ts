/**
 * ג׳ובים — the ways a boy with no money gets money.
 *
 * The economy of this game had exactly three: bottles once, crates at Rafi once, and
 * whatever a father took out of his pocket. Everything else was a chapter handing you a
 * sum at the door. So a shirt that costs thirty shekels was not a goal, it was a wall —
 * and Maor said what was missing in one line: "צריך לתת לפוגי יותר הזדמנויות להרוויח כסף…
 * כמו איסוף בקבוקים, כמו ניקיון באוסישקין, כמו עזרה לדמויות".
 *
 * Each gig is a piece of work somebody in this world actually needed doing in that decade,
 * priced off `prices.ts` rather than typed: `hours × WAGE[decade]`, so an hour of a boy's
 * afternoon is worth five shekels in 1985 and eighteen in 2000, and the shirt in the
 * window is always about six afternoons away. The clock and the energy are the cost —
 * this is a game about a Saturday, and an hour spent carrying crates is an hour not spent
 * at the ground.
 *
 * `once` gigs raise a plain flag, which `day.entered` clears — so "once" means once a
 * day, and tomorrow the crates need carrying again. That is what a job is.
 */
import { BOTTLE, WAGE, decadeOf } from './prices'
import type { Conversation } from './content/script'
import type { Condition } from './world/types'

/** the chapters, in the order the life plays them (mirrors `shirts.ts`) */
const ORDER = [
  'a2-alley', 'a3-hall', 'a4-shirt', 'a5-first', 'a6-radio', 'a7-week', '1986',
  '1990', '1991', '1993-cup', '1993-galil', '1995-sinai', '1996-army',
  '1997-basket', '1998-laces', '1999-basket', '1999-cup', '2000-title', '2000-double',
]

export type Gig = {
  id: string
  /** the room it is offered in */
  where: string
  /** who offers it, on the card */
  nameHe: string
  labelHe: string
  /** first and last chapter it exists in */
  from: string
  until?: string
  /** hours of work — the pay is this times the decade's wage */
  hours: number
  minutes: number
  energy: number
  /** the line that opens it, the line that closes it */
  askHe: string
  openHe: string
  doneHe: string
  /** a person it changes something with */
  rel?: { who: string; axis: 'bond' | 'trust' | 'sharedHistory'; delta: number }
  trait?: { key: 'reliability' | 'responsibility' | 'empathy' | 'independence' | 'courage'; delta: number }
  /** where it sits in the painting */
  at: { x: number; y: number; w: number }
  /**
   * שני משחקי הכסף — a gig that opens a CARD instead of the chore scene.
   *
   * `toto` is the slip: five questions from the site's own trivia bank, two shekels a
   * right answer. `coin` is עץ או פלי in the alley: a shekel in, five out. Both were
   * Maor's, on 5.9.2026, and both are here rather than in their own system because they
   * are jobs — they sit in a room, they cost the afternoon, and they are once a day.
   *
   * `penalty` and `hoops` are the two skill contests Maor asked for on 6.9.2026, played
   * in three dimensions rather than painted: five penalty kicks against a keeper on the
   * neighbourhood pitch, five free throws at the schoolyard hoop. Same reasoning as the
   * two above — a real thing to be good or bad at is worth more than a number.
   */
  opens?: 'toto' | 'coin' | 'penalty' | 'hoops'
  /**
   * האם זו עבודה — or is it just a thing boys do.
   *
   * Maor, 6.9.2026: *"זריקה לסל ובעיטת פנדלים לא צריכים להיות רווח כספי, זה להנאה בלבד."*
   * He is right, and it was a design smell: the moment a penalty shoot-out pays a wage,
   * the pitch stops being the pitch and becomes a cash machine with a ball in it, and
   * every kick is arithmetic instead of nerve. Unpaid gigs cost the same afternoon and the
   * same energy, pay nothing, and are worth playing for the only thing they were ever
   * about — being the one who scored.
   *
   * Unpaid work is also outside the one-job-per-chapter rule below, because a rule that
   * stops a boy kicking a ball because he already carried crates is a rule about a
   * spreadsheet, not about a childhood.
   */
  paid?: boolean
}

/**
 * שבעה ג׳ובים — and every one of them is a thing somebody in south Tel Aviv did for money
 * at eight, at twelve, at fifteen.
 */
export const GIGS: readonly Gig[] = [
  {
    id: 'bottles-round',
    where: 'street',
    nameHe: 'הפח בפינה',
    labelHe: 'הבקבוקים ליד הפח',
    from: 'a2-alley',
    until: '1993-cup',
    hours: 0.5,
    minutes: 25,
    energy: 6,
    askHe: 'לעבור על הפחים. בקבוקים.',
    openHe: 'ארבעה ריקים מאחורי הפח, אחד מתגלגל. אתה מכיר את הצליל הזה.',
    doneHe: 'רפי סופר אותם בלי להסתכל עליך. הפיקדון בכיס.',
    trait: { key: 'independence', delta: 2 },
    at: { x: 0.72, y: 0.86, w: 0.09 },
  },
  {
    id: 'crates-kiosk',
    where: 'kiosk',
    nameHe: 'רפי',
    labelHe: 'הארגזים מאחורי הדלפק',
    // A4 has its own crates, in Rafi's own voice, and two offers of the same work in one
    // room reads as a bug. The generated one takes over the chapter after.
    from: 'a5-first',
    hours: 1,
    minutes: 50,
    energy: 15,
    askHe: '"יש משהו לסדר? לסחוב?"',
    openHe: 'רפי מצביע עם הסנטר על שמונה ארגזים ליד הקיר. "לשם. אחד־אחד, לא שניים."',
    doneHe: 'שעה של ארגזים, וקולה פתוח על הדלפק שלא ביקשת.',
    rel: { who: 'rafi', axis: 'trust', delta: 3 },
    trait: { key: 'reliability', delta: 2 },
    at: { x: 0.62, y: 0.9, w: 0.1 },
  },
  {
    id: 'sweep-hall',
    where: 'ussishkin-hall',
    nameHe: 'השוער',
    labelHe: 'המטאטא ליד היציע',
    from: 'a3-hall',
    hours: 1.5,
    minutes: 70,
    energy: 18,
    askHe: '"אני יכול לנקות? אחרי המשחק."',
    openHe: 'הוא נותן לך מטאטא גבוה ממך ואומר: "מהשורה העליונה למטה. לא הפוך."',
    doneHe: 'האולם ריק ונקי, והפרקט מחזיר את האור של נורה אחת. הוא ספר לך את הכסף ביד.',
    rel: { who: 'usher', axis: 'trust', delta: 4 },
    trait: { key: 'responsibility', delta: 3 },
    at: { x: 0.24, y: 0.88, w: 0.1 },
  },
  {
    id: 'papers-round',
    where: 'street',
    nameHe: 'הדוכן',
    labelHe: 'חבילת העיתונים',
    from: 'a4-shirt',
    until: '1996-army',
    hours: 1,
    minutes: 45,
    energy: 12,
    askHe: '"אני יכול לחלק? אני מכיר את כל הבניינים."',
    openHe: 'חבילה קשורה בחוט, שלוש קומות בלי מעלית, וכלב אחד שאתה כבר יודע לדלג מעליו.',
    doneHe: 'שתים־עשרה תיבות דואר, אצבעות שחורות מדיו. הוא שילם בלי לספור פעמיים.',
    trait: { key: 'reliability', delta: 2 },
    at: { x: 0.33, y: 0.86, w: 0.08 },
  },
  {
    id: 'shopping-neighbour',
    where: 'street',
    nameHe: 'השכנה מהקומה השלישית',
    labelHe: 'השקיות של השכנה',
    from: 'a2-alley',
    hours: 0.5,
    minutes: 20,
    energy: 8,
    askHe: '"לעזור? זה כבד."',
    openHe: 'שתי שקיות בד, אחת עם אבטיח. היא לא אמרה תודה בהתחלה, היא אמרה "תחזיק מלמטה".',
    doneHe: 'היא הכניסה לך מטבע לכיס ודחפה את היד בחזרה כשניסית להחזיר.',
    trait: { key: 'empathy', delta: 3 },
    at: { x: 0.46, y: 0.87, w: 0.08 },
  },
  {
    id: 'drinks-hall',
    where: 'ussishkin-outside',
    nameHe: 'הקיוסק של האולם',
    labelHe: 'ארגזי השתייה',
    from: '1990',
    hours: 1,
    minutes: 45,
    energy: 14,
    askHe: '"צריך עזרה לפני שהם נכנסים?"',
    openHe: 'ארבעים בקבוקים בארגזים ירוקים, מהמדרכה לדלת הצדדית, לפני שהתור מתחיל.',
    doneHe: 'הכול בפנים לפני שנפתחו השערים, ואתה בפנים איתם.',
    trait: { key: 'responsibility', delta: 2 },
    at: { x: 0.68, y: 0.9, w: 0.1 },
  },
  /**
   * שלושת הג׳ובים שמאור ביקש (5.9.2026) — שליחויות לרפי, צעיפים ודגלים לפני משחק,
   * ועבודה באולם.
   */
  {
    id: 'errands-rafi',
    where: 'street',
    nameHe: 'רפי',
    labelHe: 'ההזמנות של רפי',
    from: 'a4-shirt',
    hours: 1,
    minutes: 45,
    energy: 12,
    askHe: '"אני מכיר את כל הבניינים. תן לי."',
    openHe: 'חמש הזמנות על פתק אחד: חלב לשלישית, סיגריות לשנייה, ולמעלה — מה שהיא מבקשת כל יום.',
    doneHe: 'כל ההזמנות בבתים, והפתק חזר לרפי מקופל.',
    rel: { who: 'rafi', axis: 'trust', delta: 4 },
    trait: { key: 'reliability', delta: 3 },
    at: { x: 0.4, y: 0.86, w: 0.08 },
  },
  /**
   * שני ג׳ובים באלנבי — 6.9.2026, with the corner itself.
   *
   * A junction is a junction a boy can earn on, and these are the two things somebody on
   * this pavement actually needed doing: the crates outside the record shop have to come
   * in before he pulls the shutter, and the pavement in front has to be swept before he
   * opens it. They are also why the door into town is worth walking through on an ordinary
   * Tuesday, which a door that only leads to a stadium never is.
   */
  {
    id: 'crates-allenby',
    where: 'allenby',
    nameHe: 'המוכר בפינה',
    labelHe: 'הארגזים על המדרכה',
    from: 'a4-shirt',
    hours: 1,
    minutes: 45,
    energy: 15,
    askHe: '"להכניס? אני חזק."',
    openHe: 'שני ארגזי עץ מלאים על המדרכה, ארגז בקבוקים אדום מתחתם, והוא רוצה לסגור בעוד רבע שעה.',
    doneHe: 'הכול בפנים לפני שהוא הוריד את התריס, והוא נתן לך מטבע ותקליט שרוט "כי ממילא אף אחד לא ייקח".',
    trait: { key: 'responsibility', delta: 3 },
    at: { x: 0.15, y: 0.77, w: 0.09 },
  },
  {
    id: 'sweep-allenby',
    where: 'allenby',
    nameHe: 'המלצר',
    labelHe: 'המדרכה לפני בית הקפה',
    from: '1990',
    hours: 0.5,
    minutes: 25,
    energy: 7,
    askHe: '"לטאטא לפני שהם מגיעים?"',
    openHe: 'מטאטא מאחורי הדלת, וכל מה שהעיר הפילה כאן מאתמול.',
    doneHe: 'המדרכה נקייה עד אבן השפה. הוא הביא לך לימונדה ולא לקח עליה כסף.',
    trait: { key: 'reliability', delta: 2 },
    at: { x: 0.78, y: 0.778, w: 0.09 },
  },
  {
    id: 'sell-scarves',
    where: 'bloomfield-outside',
    nameHe: 'הארגז עם הצעיפים',
    labelHe: 'צעיפים ודגלים',
    from: '1990',
    hours: 1,
    minutes: 40,
    energy: 10,
    askHe: 'לעמוד עם הארגז לפני שהם נכנסים.',
    openHe: 'ארגז קרטון, צעיפים מקופלים בשלוש שורות, ודגל אחד על מקל. הם באים בגלים.',
    doneHe: 'הארגז ריק לפני השריקה, והידיים מלאות מטבעות.',
    trait: { key: 'courage', delta: 3 },
    at: { x: 0.36, y: 0.88, w: 0.09 },
  },
  {
    id: 'balls-hall',
    where: 'ussishkin-hall',
    nameHe: 'המאמן',
    labelHe: 'הכדורים והמים',
    from: 'a3-hall',
    hours: 1,
    minutes: 40,
    energy: 12,
    askHe: '"אני יכול לאסוף כדורים לפני האימון?"',
    openHe: 'תשעה כדורים על כל הפרקט ועגלה אחת בפינה. הוא מסתכל על השעון, לא עליך.',
    doneHe: 'כל הכדורים בעגלה והמים בקו אחד ליד הספסל. הוא אמר "מחר גם".',
    rel: { who: 'usher', axis: 'bond', delta: 3 },
    trait: { key: 'responsibility', delta: 3 },
    at: { x: 0.72, y: 0.86, w: 0.09 },
  },
  {
    id: 'toto-slip',
    where: 'kiosk',
    nameHe: 'הטופס אצל רפי',
    labelHe: 'שליחת טוטו',
    from: 'a4-shirt',
    hours: 0.5,
    minutes: 20,
    energy: 4,
    askHe: 'למלא טופס. חמש שאלות.',
    openHe: 'רפי דוחף לך טופס וקצה של עיפרון. "אם אתה כזה חכם על הפועל — תמלא."',
    doneHe: 'הטופס על הדלפק, והוא ספר לך את מה שהגיע.',
    trait: { key: 'independence', delta: 2 },
    at: { x: 0.52, y: 0.87, w: 0.08 },
    opens: 'toto',
  },
  {
    id: 'alley-coin',
    where: 'pitch',
    nameHe: 'הגדולים בסמטה',
    labelHe: 'הימורים בשכונה',
    from: 'a4-shirt',
    hours: 0.2,
    minutes: 10,
    energy: 3,
    askHe: 'שקל להיכנס.',
    openHe: 'שניים גדולים ממך, מטבע של חצי שקל על הציפורן. "עץ או פלי. שקל להיכנס, חמישה אם קלעת."',
    doneHe: 'המטבע נפל.',
    trait: { key: 'courage', delta: 2 },
    at: { x: 0.66, y: 0.9, w: 0.08 },
    opens: 'coin',
  },
  /**
   * שני קרבות — 6.9.2026, בתלת מימד. "משחק פנדלים, בעיטות לשער במגרש השכונתי" ו"תחרות
   * חיובים, זריקה לסל בחצר הבית ספר": the two contests Maor asked for by name, each its
   * own real ball flying through a real depth rather than a painted one. The wage is the
   * same table as every other job — `hours` here is what a determined afternoon of it is
   * worth, split five ways, one shekel amount per kick or throw that actually goes in.
   */
  {
    id: 'penalty-contest',
    where: 'pitch',
    nameHe: 'הגדולים במגרש',
    labelHe: 'פנדלים עד חמש',
    from: 'a2-alley',
    hours: 0.5,
    minutes: 25,
    energy: 10,
    askHe: 'חמש בעיטות. בלי כסף — בשביל השם.',
    openHe: 'הם מעמידים שני מוטות עץ לרוחב, ואחד מהגדולים עומד בשער. "חמש בעיטות. תראה מה יש לך."',
    doneHe: 'הם סופרים בקול, גם כשאתה לא רוצה שיספרו. אף אחד לא מוציא כסף.',
    trait: { key: 'courage', delta: 2 },
    at: { x: 0.9, y: 0.87, w: 0.08 },
    opens: 'penalty',
    paid: false,
  },
  {
    id: 'hoops-contest',
    where: 'schoolyard',
    nameHe: 'קו העונשין',
    labelHe: 'תחרות חיובים',
    from: '1991',
    until: '1991',
    hours: 0.5,
    minutes: 20,
    energy: 8,
    askHe: 'חמש זריקות מהקו. מי שקולע — מלך ההפסקה.',
    openHe: 'קו לבן מצויר על האספלט, כבר דהוי. "חמש זריקות. מי שקולע יותר משלוש הוא המלך של ההפסקה."',
    doneHe: 'הכדור מקפץ על החישוק בלי רשת, ואף אחד לא מסכים על הספירה.',
    trait: { key: 'independence', delta: 2 },
    at: { x: 0.5, y: 0.84, w: 0.09 },
    opens: 'hoops',
    paid: false,
  },
  {
    id: 'wash-cars',
    where: 'street',
    nameHe: 'החניה מתחת לבניין',
    labelHe: 'הדלי והספוג',
    from: '1990',
    hours: 1.5,
    minutes: 60,
    energy: 20,
    askHe: 'לשטוף שתי מכוניות. דלי, ספוג, וכסף.',
    openHe: 'דלי מהמרפסת, ספוג ישן, ומים שנגמרים באמצע השנייה.',
    doneHe: 'שתי מכוניות נקיות, נעליים רטובות, וכסף שהרווחת ולא ביקשת.',
    trait: { key: 'independence', delta: 3 },
    at: { x: 0.58, y: 0.87, w: 0.09 },
  },

  /**
   * שש עבודות בשישה מקומות אחרים — 6.9.2026.
   *
   * *"צריך לחלק את נקודות ה'עבודה' האלו ביותר מקומות במפה וביותר מגוון מסכים, עם היגיון."*
   * Eleven of the sixteen jobs stood in three rooms, and five of them in the street alone,
   * so a boy who needed money went to the same corner every chapter and the rest of the
   * city had nothing to offer him. These six are placed where that decade actually paid a
   * child: the road to the ground on a matchday, the platform, the kitchen table at home,
   * the classroom after the bell, the end wall of the hall, and Gate 5 in the years the
   * terrace was building itself. Every one of them is in a room the player already walks
   * through for another reason, so the work is on the way rather than a detour.
   */
  {
    id: 'seeds-route',
    where: 'route',
    nameHe: 'הדוכן על הדרך',
    labelHe: 'שקיות גרעינים',
    from: 'a5-first',
    hours: 0.8,
    minutes: 30,
    energy: 12,
    askHe: 'למכור גרעינים לאנשים שהולכים למשחק.',
    openHe: 'ארגז על שרפרף, שקיות נייר חומות, ורחוב שלם שהולך לכיוון אחד. "תעמוד פה ותצעק. אני חוזר."',
    doneHe: 'הארגז ריק, הידיים מלוחות, והרחוב עוד הולך.',
    trait: { key: 'courage', delta: 2 },
    at: { x: 0.3, y: 0.83, w: 0.09 },
  },
  {
    id: 'kitchen-help',
    where: 'kitchen',
    nameHe: 'אמא',
    labelHe: 'לעזור לאמא במטבח',
    from: 'a3-hall',
    hours: 0.6,
    minutes: 25,
    energy: 8,
    askHe: 'לקלף, לשטוף, לסדר. זה לא משכורת — זה תודה.',
    openHe: 'היא לא מבקשת פעמיים. היא רק מזיזה את הקערה לכיוון שלך ומחכה.',
    doneHe: 'היא נותנת לך משהו קטן מהארנק ואומרת "זה לא משכורת".',
    rel: { who: 'rachel', axis: 'trust', delta: 3 },
    trait: { key: 'responsibility', delta: 3 },
    at: { x: 0.62, y: 0.9, w: 0.1 },
  },
  {
    id: 'chairs-end',
    where: 'ussishkin-end',
    nameHe: 'הכיסאות בקצה',
    labelHe: 'לסדר כיסאות',
    from: '1991',
    hours: 1,
    minutes: 35,
    energy: 16,
    askHe: 'לסדר את הכיסאות מתחת לסל.',
    openHe: 'ערימה של כיסאות פלסטיק אדומים, חצי מהם שבורים, וכל אחד שסוחב שניים סוחב פחות.',
    doneHe: 'שורה ישרה של כיסאות, וכתפיים שכואבות מחר.',
    rel: { who: 'shachor', axis: 'bond', delta: 3 },
    trait: { key: 'reliability', delta: 3 },
    at: { x: 0.3, y: 0.88, w: 0.1 },
  },
  {
    id: 'board-classroom',
    where: 'classroom',
    nameHe: 'המורה',
    labelHe: 'למחוק את הלוח',
    from: '1991',
    hours: 0.4,
    minutes: 15,
    energy: 5,
    askHe: 'למחוק לוח, לסדר כיסאות, לנקות מטליות.',
    openHe: 'הכיתה ריקה, האבק מהמטלית עולה בקו של האור, והמורה כותב משהו בפנקס.',
    doneHe: 'לוח נקי, ידיים לבנות, ומטבע שהוא מוציא בלי לספור.',
    rel: { who: 'teacher', axis: 'trust', delta: 3 },
    trait: { key: 'reliability', delta: 2 },
    at: { x: 0.42, y: 0.9, w: 0.1 },
  },
  {
    id: 'platform-bags',
    where: 'bus-station',
    nameHe: 'הרציף',
    labelHe: 'לעזור עם תיקים',
    from: '1996-army',
    hours: 0.7,
    minutes: 25,
    energy: 12,
    askHe: 'לעזור לאנשים עם תיקים אל האוטובוס.',
    openHe: 'רציף, שמונה בבוקר, ומזוודה אחת שאף אחד לא מצליח להרים לבד.',
    doneHe: 'שלושה תיקים, שתי תודות, ומטבע אחד ביד.',
    trait: { key: 'empathy', delta: 3 },
    at: { x: 0.7, y: 0.82, w: 0.1 },
  },
  {
    id: 'banner-gate5',
    where: 'gate5',
    nameHe: 'אסף',
    labelHe: 'להרים את הבד',
    from: '1998-laces',
    hours: 1,
    minutes: 35,
    energy: 18,
    askHe: 'לפרוש בד, לקשור, להחזיק. אף אחד לא מדבר על כסף.',
    openHe: 'הוא לא מציג את עצמו. הוא רק אומר "תרים", ומראה על הקצה השני של הבד.',
    doneHe: 'הבד פרוש, הידיים שחורות מהחבל, ומישהו קורא לך בשם.',
    rel: { who: 'asaf', axis: 'trust', delta: 4 },
    trait: { key: 'reliability', delta: 4 },
    at: { x: 0.36, y: 0.88, w: 0.1 },
  },
]

export const gigId = (gig: Gig, chapter: string) => `gig-${gig.id}-${chapter}`
export const gigFlag = (gig: Gig) => `gig:${gig.id}`

/** whether this is work at all — everything is, except the two contests */
export const isPaid = (gig: Gig) => gig.paid !== false

/** whole shekels for one turn of this gig, in the money of the chapter's decade */
export function gigPay(gig: Gig, chapter: string): number {
  if (!isPaid(gig)) return 0
  if (gig.id === 'bottles-round') return Math.round(BOTTLE[decadeOf(chapter)] * 4)
  return Math.max(1, Math.round(WAGE[decadeOf(chapter)] * gig.hours))
}

/**
 * עבודה אחת לפרק — the flag that says this chapter's paid work has been done.
 *
 * Maor, 6.9.2026: *"צריך להגביל את האפשרות להרוויח כסף, פעם אחת בכל משימה."* Before this,
 * money was a tap: every job was once a DAY, and a day is short, so a determined player
 * could stand in the street doing bottles, cars, papers and crates in one afternoon and
 * buy the shirt on the first Saturday. One paid job per chapter puts the shirt back where
 * §13 of the Stage A bible wants it — several memory days away — and makes WHICH job you
 * took a decision rather than a queue.
 */
export const workDoneFlag = (chapter: string) => `work:paid:${chapter}`

/** the flag that says this particular job is on offer in this life, this chapter */
export const offerFlag = (gig: Gig) => `work:offer:${gig.id}`

/**
 * מה מוצע היום — the rotation, and the reason two players never have the same week.
 *
 * *"וכל פעם הצעות רנדומליות, לא תמיד כל האופציות קיימות. ליצור רוטציות חכמות, ליצור שוני
 * ביום יום של פוגי."* Every eligible paid job in a room used to be on offer, always, which
 * made the street a menu. Now a chapter offers a SUBSET, chosen from the save's own seed:
 * the same save sees the same jobs every time it loads that chapter (so it is a world, not
 * a slot machine), and two saves see different ones (so it is a life, not a script).
 *
 * Two rules keep it from being merely random:
 *   · at least one paid job is always reachable somewhere in the chapter, because a
 *     chapter that offers no way to earn is a chapter that cannot be played by a boy who
 *     needs money;
 *   · the unpaid contests are never rotated out — the ball is always there.
 */
export function offeredIn(chapter: string, seed: string): Set<string> {
  const eligible = GIGS.filter((gig) => isPaid(gig) && gigChapters(gig).includes(chapter))
  if (eligible.length === 0) return new Set()
  const scored = eligible
    .map((gig) => ({ id: gig.id, score: hash(`${seed}|${chapter}|${gig.id}`) }))
    .sort((a, b) => a.score - b.score)
  // between a third and two thirds of what exists, never fewer than one, never all of it
  const take = Math.max(1, Math.min(eligible.length - (eligible.length > 2 ? 1 : 0), Math.round(eligible.length * 0.45)))
  return new Set(scored.slice(0, take).map((entry) => entry.id))
}

/** a small, stable string hash — the rotation has to survive a reload, not a cryptanalyst */
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

/** the gigs that exist in this chapter, in this room */
export function gigsIn(chapter: string, where: string): Gig[] {
  const now = ORDER.indexOf(chapter)
  if (now < 0) return []
  return GIGS.filter((gig) => {
    if (gig.where !== where) return false
    if (ORDER.indexOf(gig.from) > now) return false
    if (gig.until && ORDER.indexOf(gig.until) < now) return false
    return true
  })
}

/** every chapter a gig is offered in, so a hotspot can be generated per era */
export function gigChapters(gig: Gig): string[] {
  const from = ORDER.indexOf(gig.from)
  const until = gig.until ? ORDER.indexOf(gig.until) : ORDER.length - 1
  return ORDER.slice(from, until + 1)
}

/**
 * One conversation per gig per chapter — generated, for the same reason the fan shop is:
 * a wage that is typed in nineteen places is nineteen chances to be wrong about a decade.
 *
 * The refusal is not a locked door. A gig you have already done today says so in the
 * person's own voice, because "כבר סידרת לי היום" is a sentence a shopkeeper says and
 * "לא זמין" is a sentence a menu says.
 */
export function gigConversations(): Conversation[] {
  const out: Conversation[] = []
  for (const gig of GIGS) {
    for (const chapter of gigChapters(gig)) {
      const pay = gigPay(gig, chapter)
      out.push({
        id: gigId(gig, chapter),
        nameHe: gig.nameHe,
        branches: [
          {
            when: { flag: gigFlag(gig) } as Condition,
            lines: [{ who: null, text: 'עשית את זה היום כבר. מחר יש עוד.' }],
          },
          /**
           * כבר עבדת — the refusal that enforces one paid job per chapter, in a person's
           * voice rather than a greyed-out button. The work still exists; today it is
           * somebody else's turn, which is exactly how a street with four kids in it and
           * one crate to carry actually behaves.
           */
          ...(isPaid(gig)
            ? [
                {
                  when: { flag: workDoneFlag(chapter) } as Condition,
                  lines: [{ who: null, text: 'היום כבר יש מי שעושה את זה. תבוא בפעם הבאה.' }],
                },
              ]
            : []),
          {
            lines: [{ who: null, text: gig.openHe }],
            choices: [
              {
                id: 'do',
                text: gig.opens === 'coin' ? gig.askHe : `${gig.askHe} — עד ${pay} ₪`,
                /**
                 * The conversation agrees to the work; `ChoreScene` is the work. Nothing is
                 * paid here on purpose — the pay depends on how it went, and a gig that
                 * paid on the handshake would make the minigame decoration.
                 */
                then: [
                  ...(gig.rel ? [{ e: 'rel' as const, who: gig.rel.who, axis: gig.rel.axis, delta: gig.rel.delta }] : []),
                  ...(gig.opens === 'toto'
                    ? [
                        { e: 'flag' as const, flag: gigFlag(gig) },
                        { e: 'flag' as const, flag: workDoneFlag(chapter) },
                        { e: 'toto' as const },
                      ]
                    : gig.opens === 'coin'
                      ? [{ e: 'flag' as const, flag: workDoneFlag(chapter) }, { e: 'coin' as const }]
                      : gig.opens === 'penalty'
                        ? // no money: five kicks, and whatever the big boys say afterwards
                          [{ e: 'penalty' as const, attempts: 5, perGoal: 0 }]
                        : gig.opens === 'hoops'
                          ? [{ e: 'hoops' as const, attempts: 5, perBasket: 0 }]
                          : [{ e: 'minigame' as const, id: `chore:${gig.id}` }]),
                ],
              },
              { id: 'later', text: 'לא עכשיו.', then: [] },
            ],
          },
        ],
      })
    }
  }
  return out
}
