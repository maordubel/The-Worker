/**
 * כרטיסי היכרות — the short film every person in this life gets, once.
 *
 * Maor, 5.9.2026: "אני רוצה שעל כל דמות שנכנסת לחיי פוגי יהיה סרטון הכרות קצר ואודות
 * הדמות. הומוריסטי, קליל, משעשע, מחבר לסיפור."
 *
 * There is no film in this project and there should not be one: a card that reveals its
 * three lines one tap at a time, over the figure at full height, IS a title sequence — it
 * has a beat, it has an edit, and it costs nothing but writing. What it must never be is a
 * biography. Three lines, each of which could be said by a neighbour about another
 * neighbour, and the third one turns.
 *
 * The rules the lines are written to:
 *   1. **A joke that is also a fact.** "רפי פותח בשש. רפי סוגר בשבע. מה שביניהם — רפי."
 *      is funny because it is true about the man and about the shop.
 *   2. **Nothing that spoils.** A card plays the first time you meet somebody, so it may
 *      not know what they will do to you later.
 *   3. **Nobody real gets one.** Sinai, Elimelech, Tikva and the owners are in the
 *      registry as `historical`/`seen-only` and this game does not write comedy about a
 *      living person it has not asked. Only the invented and composite cast.
 *   4. **Keyed by the name a conversation actually says.** The runtime matches on the
 *      conversation's `nameHe`, because that is the only handle a line carries.
 */

export type CastCard = {
  /** the id in `characters.ts`, so a card cannot drift from the registry */
  id: string
  /** every spelling a conversation might carry for this person */
  namesHe: readonly string[]
  /** what they are to Pogi, in three words */
  roleHe: string
  /** the figure the card holds up, at full height */
  art: string
  /** three lines, revealed one tap at a time. The third one turns. */
  linesHe: readonly [string, string, string]
  /** the stamp in the corner: when they entered his life */
  sinceHe: string
}

export const CAST_CARDS: readonly CastCard[] = [
  {
    id: 'kobi',
    namesHe: ['קובי'],
    roleHe: 'אבא',
    art: 'kobi',
    linesHe: [
      'עובד בדפוס. חוזר עם ידיים שחורות ומדיח אותן שלוש פעמים לפני שהוא נוגע בלחם.',
      'לא אומר "אני אוהב אותך". אומר "תלבש נעליים סגורות", וזה אותו דבר בדיוק.',
      'בשער 7 הוא מדבר. בבית הוא לא. מישהו צריך להסביר לו שזה אותו אדם.',
    ],
    sinceHe: 'מאז שאתה זוכר',
  },
  {
    id: 'rachel',
    namesHe: ['רחל'],
    roleHe: 'אמא',
    art: 'rachel',
    linesHe: [
      'יודעת בדיוק כמה כסף יש בבית, תמיד, בלי לפתוח את הארנק.',
      'אומרת "לא" ואז נותנת שטר מקופל לארבע. שני הדברים אמיתיים.',
      'לא הלכה לבלומפילד אף פעם. שואלת על התוצאה לפני שאתה חולץ נעליים.',
    ],
    sinceHe: 'מאז שאתה זוכר',
  },
  {
    id: 'ofir',
    namesHe: ['אופיר'],
    roleHe: 'החבר מהשכונה',
    art: 'ofir',
    linesHe: [
      'לכל דבר יש לו בן דוד שעובד שם. לפעמים זה אפילו נכון.',
      'יושב על מעקה כאילו הוא גר עליו. אולי הוא גר עליו.',
      'ילך איתך לכל מקום, ותמיד יגיע חמש דקות אחרייך ויגיד שחיכה.',
    ],
    sinceHe: 'הסמטה, 1984',
  },
  {
    id: 'amit',
    namesHe: ['עמית'],
    roleHe: 'זה שקורא עיתון',
    art: 'amit',
    linesHe: [
      'קונה עיתון בכל בוקר ומחזיק אותו כמו שמחזיקים תעודה.',
      'יודע מספרים. כל המספרים. גם אלה שאף אחד לא ביקש.',
      'טועה בערך פעם בשבוע, בביטחון מלא, וזה חלק מהקסם.',
    ],
    sinceHe: 'הסמטה, 1984',
  },
  {
    id: 'efi',
    namesHe: ['אפי'],
    roleHe: 'הגדול שלקח אותך',
    art: 'efi',
    linesHe: [
      'גדול ממך בארבע שנים, כלומר בכל הידע שקיים בעולם.',
      'הוא זה שאמר "בוא", ומאז יש לך אולם.',
      'לא יסביר לך כלום. פשוט ילך, ואתה תלך אחריו, וזה יעבוד.',
    ],
    sinceHe: 'אוסישקין, סתיו 1984',
  },
  {
    id: 'shopkeeper',
    namesHe: ['רפי', 'רפי מהקיוסק'],
    roleHe: 'הקיוסק',
    art: 'oldMan',
    linesHe: [
      'פותח בשש. סוגר בשבע. מה שביניהם — רפי.',
      'סופר כסף של ילדים פעם אחת. של מבוגרים — פעמיים.',
      'אם הוא אמר "בשבוע הבא היא עוד פה", היא עוד שם. הוא לא מבטיח סתם.',
    ],
    sinceHe: 'הפינה, מאז 1971',
  },
  {
    id: 'usher',
    namesHe: ['סדרן', 'הסדרן'],
    roleHe: 'בדלת של אוסישקין',
    art: 'oldMan',
    linesHe: [
      'מכיר את כולם בשם. את מי שלא — הוא ילמד בערב אחד.',
      'אומר "אל תשב מתחת לחור בגג" ומתכוון לזה.',
      'פעם אחת אמר את השם שלך בקול, וזה נשאר איתך יותר מכל משחק.',
    ],
    sinceHe: 'אוסישקין, סתיו 1984',
  },
  {
    id: 'keren',
    namesHe: ['קרן'],
    roleHe: 'מהבניין ממול',
    art: 'keren',
    linesHe: [
      'יודעת את התוצאה לפני כולם ולא מספרת, כי מצחיק אותה שאתם רצים.',
      'לא אוהדת. באה. יש הבדל, והיא לא תסביר אותו.',
      'שרה חזק יותר מכל מי שהסביר לה למה היא לא צריכה לבוא.',
    ],
    sinceHe: 'הרחוב, 1986',
  },
  {
    id: 'teacher',
    namesHe: ['המורה'],
    roleHe: 'כיתה ז׳',
    art: 'teacher',
    linesHe: [
      'רואה פתק עובר מהשולחן השני. תמיד. אין דרך אחרת להסביר את זה.',
      'שונאת כדורגל בערך כמו שהיא שונאת שקט — כלומר בכלל לא.',
      'תיתן לך לצאת מוקדם פעם אחת בחיים, ולא תגיד למה.',
    ],
    sinceHe: 'בית הספר, 1991',
  },
  {
    id: 'barry',
    namesHe: ['בארי'],
    roleHe: 'שער 7',
    art: 'barry96',
    linesHe: [
      'עומד באותו מקום עשרים שנה. שני צעדים ימינה מהמדרגה השלישית.',
      'אם מישהו תפס לו את המקום, הוא לא אומר כלום. הוא רק עומד לידו עד שמבינים.',
      'זוכר משחקים לפי מה אכל לפניהם. זה עובד לו.',
    ],
    sinceHe: 'שער 7',
  },
  {
    id: 'liron',
    namesHe: ['לירון'],
    roleHe: 'מתקן רדיו',
    art: 'adultB2',
    linesHe: [
      'מתקן רדיו של אנשים ולא לוקח כסף על רדיו של אוהד.',
      'מכיר כל תדר בארץ ולא מוצא את המפתחות של האוטו.',
      'יסיע אותך ארבע שעות ויתעקש שזה "היה לו בכיוון".',
    ],
    sinceHe: 'הצבא, 1996',
  },
  {
    id: 'freddy',
    namesHe: ['פרדי'],
    roleHe: 'חבר מהבסיס',
    art: 'freddy',
    linesHe: [
      'מדבר שלוש שפות ומקלל בארבע.',
      'שואל שאלה אחת בדיוק, ואז שותק עד שאתה עונה באמת.',
      'אומר שהוא לא אוהד. יודע את ההרכב.',
    ],
    sinceHe: 'הצבא, 1996',
  },
  {
    id: 'shachor',
    namesHe: ['שחור'],
    roleHe: 'מארגן את הנסיעות',
    art: 'adultA5',
    linesHe: [
      'יש לו רשימה. תמיד יש לו רשימה. אתה בשורה 14.',
      'מדבר בקול של מי שכבר צעק כל מה שהיה לו לצעוק.',
      'אם הוא אמר "יוצאים בחמש", בחמש ואחת אתה מסתכל על אחורי האוטובוס.',
    ],
    sinceHe: 'הנסיעות, 1993',
  },
  {
    id: 'crowd-limor',
    namesHe: ['לימור'],
    roleHe: 'בדלת של האוטובוס',
    art: 'keren90',
    linesHe: [
      'גובה כסף באוטובוס ומחזירה עודף לפני שספרת.',
      'יודעת מי לא שילם ולא אומרת. רושמת.',
      'הדבר היחיד שמפחיד אותה הוא נסיעה שיוצאת חסרה שני אנשים.',
    ],
    sinceHe: 'האולם, 1993',
  },
  {
    id: 'melamed',
    namesHe: ['מלמד'],
    roleHe: 'האיש עם הפתקים',
    art: 'melamed',
    linesHe: [
      'רושם כל משחק במחברת. גם משחקי חורף. גם משחקי הפסד.',
      'שואל אותך מה היה בדקה 63 ומחכה שתדע.',
      'המחברות שלו הן היום הדבר הכי קרוב לארכיון שיש למועדון הזה.',
    ],
    sinceHe: 'שער 5, 1999',
  },
  {
    id: 'michel',
    namesHe: ['מישל'],
    roleHe: 'מהאולם',
    art: 'michel96-walk1',
    linesHe: [
      'בא לכדורסל מאז שהפרקט היה חדש, ומאז הפרקט זקן ממנו.',
      'מדבר עם השופט בשקט מוחלט, כל המשחק, בלי שהשופט שומע מילה.',
      'קורא לכולם "חביבי" חוץ ממי שהוא באמת אוהב.',
    ],
    sinceHe: 'אוסישקין, 1996',
  },
  {
    id: 'asaf',
    namesHe: ['אסף'],
    roleHe: 'שער 5',
    art: 'asaf-back',
    linesHe: [
      'מארגן. תמיד מארגן. גם כשאין מה לארגן.',
      'יודע מה עשו לשלום תקוה ולא ימצא לך את זה בעיתון.',
      'אומר "אנחנו" על אנשים שהוא לא מכיר, ומתכוון לזה.',
    ],
    sinceHe: 'שער 5, 1999',
  },
  {
    id: 'soko',
    namesHe: ['סוקו'],
    roleHe: 'הוותיק',
    art: 'oldMan',
    linesHe: [
      'ראה את האליפות של 68׳. יזכיר לך.',
      'סופר שנים בין תארים כמו שאחרים סופרים ימי הולדת.',
      'עומד. תמיד עומד. יש לו כיסא ואף אחד לא ראה אותו יושב עליו.',
    ],
    sinceHe: 'לפני שנולדת',
  },
  {
    id: 'yaron',
    namesHe: ['ירון'],
    roleHe: 'חבר מהבסיס',
    art: 'adultA4',
    linesHe: [
      'ישן בכל מקום ובכל תנוחה, כולל עמידה.',
      'אין לו קבוצה, ובגלל זה הוא מקשיב לך יותר טוב מכולם.',
      'שאל אותך פעם אחת למה, ואתה עדיין חושב על התשובה.',
    ],
    sinceHe: 'הצבא, 1996',
  },
  {
    id: 'crowd-dudu',
    namesHe: ['דודו'],
    roleHe: 'מהיציע',
    art: 'adultA5',
    linesHe: [
      'מגיע שעה לפני. תמיד. גם למשחק שנדחה.',
      'לא שר. מוחא כפיים בקצב אחר משל כולם ובטוח שכולם טועים.',
      'שומר מקומות לחמישה אנשים ומקבל בדיוק שניים.',
    ],
    sinceHe: 'היציע',
  },
]

/** the flag that says this card has already played — `own:` so a new day cannot replay it */
export const metFlag = (id: string) => `own:met:${id}`

/** the card for whoever a conversation says is speaking, or nothing */
export function cardForName(nameHe: string | null | undefined): CastCard | null {
  if (!nameHe) return null
  return CAST_CARDS.find((card) => card.namesHe.includes(nameHe)) ?? null
}
