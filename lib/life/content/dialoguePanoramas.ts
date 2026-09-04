import type { Conversation } from './script'

/**
 * מה רואים — the lines behind the marks in the panoramas. All narration, all
 * about the thing looked at, none of it a fact the archive does not hold.
 */
const look = (id: string, lines: string[], flag?: string): Conversation => ({
  id,
  branches: [
    {
      lines: lines.map((text) => ({ who: null, text })),
      ...(flag ? { then: [{ e: 'flag' as const, flag }] } : {}),
    },
  ],
})

export const CONVERSATIONS_PANORAMAS: Conversation[] = [
  // ---- 1986: the mouth of the tunnel --------------------------------------------
  look('look-reveal-pitch', ['ירוק. יותר ירוק ממה שהטלוויזיה בבית יודעת להראות.', 'שם, למטה, זה יקרה. עוד לא יודעים מה.'], 'looked:pitch'),
  look('look-reveal-terrace', ['אדום ולבן עד שאי אפשר לספור. מישהו שם צועק את השם שלך — לא, של מישהו אחר.', 'אבא איפשהו שם. או לא.'], 'looked:terrace'),
  look('look-reveal-lights', ['ארבעה עמודים גבוהים מהבניין שלכם. כבויים עכשיו. בערב הם ידליקו את הכול.']),
  look('look-reveal-tunnel', ['החושך שממנו יצאת. משם באת, ולשם לא חוזרים לפני השריקה.']),
  // ---- 1986: on the terrace -----------------------------------------------------
  look('look-terrace-pitch', ['בין הגבים אפשר לראות רצועה של דשא, ובה, לפעמים, כדור.']),
  look('look-terrace-radio', ['מישהו מחזיק טרנזיסטור לאוזן. מה שהוא שומע — כולם סביבו יודעים חצי שנייה אחריו.']),
  look('look-terrace-scarves', ['צעיפים מעל הראשים כמו כביסה ברוח. אף אחד לא קר. זה לא בשביל הקור.']),
  // ---- Ussishkin ------------------------------------------------------------------
  look('look-uss-cream', ['היציע ממול בהיר יותר, ובאמצע גוש של כיסאות כהים. ביום משחק גם הוא מלא.']),
  look('look-derby-stand', ['הקיר האדום זז. לא אנשים — קיר. כשהוא נושם, הגג נושם איתו.']),
  look('look-derby-court', ['על הפרקט עשרה אנשים, ורק חמישה מהם לובשים את הצבע הנכון.']),
  look('look-derby-cream', ['גם ממול מלא. הם לא שרים. הם מחכים.']),
  // ---- 1990: the kitchen table --------------------------------------------------
  look('look-kitchen-chair', ['הכיסא של אבא, זז אחורה. הוא קם לרגע. העיפרון נשאר על הטבלה.']),
  look('look-kitchen-window', ['התריס חצי פתוח. מהרחוב עולה קול של רדיו אחר, שמדבר על אותו דבר.']),
  // ---- 1990: the morning after --------------------------------------------------
  look('look-morning-bag', ['התיק. מתוכו מציץ קצה אדום-לבן. אתה דוחף אותו פנימה ומכסה בספר החשבון.']),
  look('look-morning-shutter', ['אור אפור. יום ראשון נראה בדיוק כמו יום ראשון.']),
  look('look-morning-wall', ['הקיר מלא. אתמול הוספת משהו. אתה לא זוכר מתי הספקת.']),
  // ---- 1990: gate seven ---------------------------------------------------------
  look('look-gate-turnstile', ['ברזל שמסתובב לכל אחד בנפרד. מעבר לו — חושך, ומעבר לחושך — הרעש.']),
  look('look-gate-tickets', ['יד של מישהו מרימה שני כרטיסים מעל הראשים, כאילו זה עונה על שאלה.']),
  look('look-gate-road', ['הדרך שבאת ממנה. עוד אנשים מגיעים. אף אחד לא הולך לכיוון ההפוך.']),
  // ---- 1991: the classroom ------------------------------------------------------
  look('look-class-board', ['גיר על לוח ירוק. המורה כותבת משהו שיהיה במבחן. אתה כותב משהו אחר.']),
  look('look-class-notebook', ['מחברת חשבון. בעמוד — לא חשבון. מישהו הניח עליה פתק מקופל.']),
  look('look-class-windows', ['האור נכנס בפסים. בחוץ, מישהו מכדרר. אפשר לשמוע את זה מכאן.']),
]
