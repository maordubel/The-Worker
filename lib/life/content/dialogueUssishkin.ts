import type { Conversation } from './script'

/**
 * אוסישקין — the empty hall, spoken.
 *
 * Before there is a derby night here (11.3.1991, the second movement of Stage B) there is
 * a place, and a child can walk into it on any Saturday and find it empty, warm, and
 * used. Every line here is about the ROOM — the parquet, the window strip under the tin
 * roof, the old basket bolted to the end wall, the stand of red and charcoal seats — and
 * not one of them states a result, a name, or a season. What the club's hall means is
 * for the player to feel from the floor up; the archive says the rest, later.
 *
 * Both chapters share these: an eight-year-old and a twelve-year-old see the same
 * hall, and the usher knows both of them by the second visit.
 */
export const CONVERSATIONS_USSISHKIN: Conversation[] = [
  {
    id: 'usher-hall',
    nameHe: 'סדרן',
    branches: [
      // 11.3.1991. The same man, the same chair, and a room that has stopped being empty.
      {
        when: { flag: 'uss:arrived' },
        lines: [
          { who: 'סדרן', text: 'לא לעמוד על המדרגה. לעמוד ליד המדרגה.' },
          { who: null, text: 'הוא אומר את זה בלי להסתכל עליך, ומיד אחר כך אומר את זה בדיוק לעוד שני ילדים.' },
        ],
      },
      {
        when: { flag: 'uss:met' },
        lines: [
          { who: 'סדרן', text: 'שוב אתה. בסדר, רק לא על הפרקט עם הנעליים האלה.' },
          { who: null, text: 'הוא לא מסתכל אם באמת ירדת מהפרקט. ככה זה כשמכירים אותך.' },
        ],
      },
      {
        lines: [
          { who: 'סדרן', text: 'אין היום כלום, ילד. ביום שיש — תשמע את זה מהרחוב.' },
          { who: 'סדרן', text: 'רוצה להסתכל? תסתכל. רק לא על הפרקט עם הנעליים.' },
          { who: null, text: 'הוא חוזר לכיסא שלו ליד הדלת. גם כשאין משחק, יש לו כיסא.' },
        ],
        then: [{ e: 'flag', flag: 'uss:met' }],
      },
    ],
  },
  {
    id: 'uss-parquet',
    branches: [
      {
        when: { flag: 'uss:arrived' },
        lines: [
          { who: null, text: 'הפרקט לא מבריק הערב. הוא מלא סימני נעליים, וכל חריקה נשמעת עד למעלה.' },
          { who: null, text: 'אתה עומד מספיק קרוב כדי לשמוע אנשים נושמים בתוך משחק.' },
        ],
      },
      {
        lines: [
          { who: null, text: 'הפרקט מבריק כמו מים. רואים בו את פס החלונות הפוך.' },
          { who: null, text: 'אלפי סוליות עברו כאן, וכולן השאירו את אותו צליל.' },
        ],
        then: [{ e: 'flag', flag: 'uss:floor' }],
      },
    ],
  },
  {
    id: 'uss-stand',
    branches: [
      {
        when: { flag: 'uss:arrived' },
        lines: [
          { who: null, text: 'היציע מלא מלמעלה עד למטה. אין אוויר, ואף אחד לא יושב.' },
          { who: null, text: 'הכיסאות האדומים בכלל לא נראים. רק אנשים.' },
        ],
      },
      {
        lines: [
          { who: null, text: 'יציע אחד, אדום ופחם, קרוב כל כך למגרש שאפשר לגעת בשחקן.' },
          { who: null, text: 'ביום משחק אין כאן אוויר. עכשיו יש רק כיסאות, ומישהו שכח כובע.' },
        ],
      },
    ],
  },
  {
    id: 'uss-windows',
    branches: [
      {
        when: { flag: 'uss:arrived' },
        lines: [
          { who: null, text: 'פס החלונות שחור. כל האור הערב בא מהמנורות שמתחת לגג, והן רועדות.' },
          { who: null, text: 'הן באמת רועדות. אתה מסתכל למעלה ורואה את זה.' },
        ],
      },
      {
        lines: [
          { who: null, text: 'פס חלונות צמוד לגג הפח. האור שנכנס קר, והכול מתחתיו חם.' },
          { who: null, text: 'כשהגג יתחיל לרעוד מהקהל, זה יהיה מהקורות האדומות האלה.' },
        ],
      },
    ],
  },
  {
    id: 'uss-basket',
    branches: [
      {
        lines: [
          { who: null, text: 'סל ישן, צמוד לקיר. הרשת קרועה בשני מקומות ואף אחד לא מחליף.' },
          { who: null, text: 'מישהו זורק. הכדור נכנס בלי לגעת בברזל. הוא לא מסתכל אם ראית.' },
        ],
        then: [{ e: 'flag', flag: 'uss:basket' }],
      },
    ],
  },
  {
    id: 'uss-board',
    branches: [
      {
        lines: [
          { who: null, text: 'לוח תוצאות כהה, כבוי. שני צדדים, ואף מספר.' },
          { who: null, text: 'כשהוא נדלק — כל האולם מסתכל למעלה באותה שנייה.' },
        ],
      },
    ],
  },
]
