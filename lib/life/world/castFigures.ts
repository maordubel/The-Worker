/**
 * ------------------------------------------------ מי שמדבר — יש לו גוף ----
 *
 * מאור, 21.9.2026: *"שיהיה באמת ריקוד וסנכרון מלא בין הסיפור לבין הנראה על המסך."*
 *
 * סריקה של החדרים ב-2000–2026 מצאה שכמעט אף אחד מהאנשים שמדברים בהם לא עומד בהם: שני
 * קובי של 2000 בסלון, שני אנשים באלנבי, והשחקנים באוסישקין — וזהו. בכל שאר הפרקים שיחה
 * של ארבעה אנשים נפתחה בחדר ריק, והזנב של הבועה חיפש בין הקירות את מי שמדבר.
 *
 * הטבלה הזאת היא התשובה לשאלה *"איך נראה X בשנים האלה"*, פעם אחת לכל אדם. היא משרתת שני
 * דברים: אנשים שהוצבו בחדר (`rooms2000.ts`), ו**מלווים** — מי שמדבר בשיחה שנפתחה בלי שהוא
 * עומד בחדר, ונכנס אליו לצד פוגי לאורך השיחה (`WorldScene.summonSpeakers`).
 *
 * **תחליפים מסומנים.** לרבים מהאנשים של העשורים האלה אין עדיין גוף מצויר משלהם. הם עומדים
 * על גוף מגיליונות הקהל, תמיד אותו גוף לאותו אדם — כמו שלירון עומד על `adultB2` מאז 1996 —
 * ו-`standIn` אומר את זה, כדי שרשימת הגופים החסרים ב-ART-PROMPTS (§16) תיגזר מכאן ולא
 * תיכתב מהזיכרון.
 */

export type CastFigure = {
  /** the figure a person stands on in these years */
  figure: string
  /** a crowd-sheet body standing in for a person nobody has drawn yet */
  standIn?: boolean
  /** a person who grows up on screen: the body from this year on */
  fromYear?: Readonly<Record<number, string>>
}

/**
 * Keyed by the name a line is spoken under (`Say.who`), after `PARTNER` resolves. Aliases
 * a writer uses (`אבא`) are keyed too, because the lookup is by what the box prints.
 */
export const CAST_2000: Readonly<Record<string, CastFigure>> = {
  // ---- המשפחה
  'קובי': { figure: 'kobi90-stand' },
  'אבא': { figure: 'kobi90-stand' },
  'רחל': { figure: 'rachel90-3q' },
  'אמא': { figure: 'rachel90-3q' },
  // the child exists only when `life:child` does. Until 21.9.2026 he stood on his FATHER at
  // the same age — `pogi`, then `hero80` — and spoke with `facePogi`: the player looked at
  // the boy he had been playing for forty chapters and was told it was his son. Maor: "אתה
  // מציג את פוגי כילד — זו טעות." There is no photographed boy of eight in the art who is
  // not one of the named children of 1986, so until the son is drawn (ART-PROMPTS §16) he
  // is a child seen from behind — red shirt, jeans, no face — and speaks with a face that
  // is not Pogi's (`FACES_2000`)
  'הילד': { figure: 'pogi-back', standIn: true },

  // ---- החבורה
  'אופיר': { figure: 'ofir90-3q' },
  'עמית': { figure: 'amit90-3q' },
  'אפי': { figure: 'efi96-3q' },
  // Keren's 1990s sheet is cut at the hip; a woman standing in a room needs legs
  'קרן': { figure: 'adultB3', standIn: true },
  // the crowd sheets' `young*` bodies are boys of thirteen with the de-yellow pass in their
  // skin; a grown friend stands on a grown body, even a borrowed one
  'מתוקי': { figure: 'adultA4', standIn: true },
  // A2 went to Freddy (below), whose own sheet is cut at the knee; Roma never meets him
  'רומא': { figure: 'adultA6', standIn: true },

  // ---- אוסישקין והיציע
  'שחור': { figure: 'shachor' },
  'יוסף': { figure: 'yosef' },
  'אסף': { figure: 'asaf' },
  // `melamed*` are the same 2.4× upscale of a small ILLUSTRATED sheet as Freddy's: a drawn
  // man, posterised, in photographed rooms (21.9.2026). A clean stand-in until his sheet
  // is drawn whole (ART-PROMPTS-2000-2026, appendix ה׳), and his darbuka beside him
  'מלמד': { figure: 'adultA1', standIn: true },
  // `freddy` is a 2.4× upscale of a small ILLUSTRATED sheet cut at the knee: in a 2025 office
  // he floated, green, with no legs — a drawing in a photograph. From 1995 on he stands on a
  // clean adult until his sheet is drawn whole, and the box shows that adult's face
  'פרדי': { figure: 'adultA2', standIn: true },
  'בארי': { figure: 'barry96-3q' },
  // the 1999 Michel — the red tracksuit his plate (`faceMichel`) was cut from — not the
  // 1996 walk cycle, which is a man crossing a street
  'מישל': { figure: 'michel99-3q' },
  'סוקו': { figure: 'soko' },
  'עומר': { figure: 'hermesh' },
  'חרמש': { figure: 'hermesh' },
  'ענבל': { figure: 'adultB7', standIn: true },
  'יבגני': { figure: 'adultB4', standIn: true },

  // ---- השכונה והעבודה
  'רפי': { figure: 'oldMan' },
  'רפי מהקיוסק': { figure: 'oldMan' },
  'לירון': { figure: 'adultB2', standIn: true },
  // Yaron served with him; he has stood on A4 since the kiosk of 1996 — the same body ten
  // years on, not the old man with the shopping bag (A7) this table first gave him
  'ירון': { figure: 'adultA4', standIn: true },
  'אילן': { figure: 'adultB1', standIn: true },
  'אילן השכן': { figure: 'adultB1', standIn: true },
  'בתיה': { figure: 'adultB6', standIn: true },
  'אולי': { figure: 'adultA6', standIn: true },

  // ---- אנשים שהחיים פוגשים
  'לינה': { figure: 'adultB5', standIn: true },
  'ניקו': { figure: 'adultA1', standIn: true },
  // the editor: glasses and a cardigan. The only drawn woman left once the three partners
  // and Keren each have a body of their own (see the note on PARTNER, below)
  'שני': { figure: 'teacher-3q', standIn: true },
  'מאיה': { figure: 'teacher', standIn: true },
  // Michal meets the partner in 2025-owner; `rooms2000.ts` swaps her body when the partner is Melanie
  'מיכל': { figure: 'adultB7', standIn: true },
  'אדם': { figure: 'adultA1', standIn: true },
  'מראיינת': { figure: 'teacher-3q', standIn: true },
  'גור': { figure: 'adultB4', standIn: true },
  'יונתן': { figure: 'adultA6', standIn: true },
  // `girlTeen` is a girl of twelve. Neta plays bass in a band in 2012; she stands on a woman
  'נטע': { figure: 'adultB7', standIn: true },
  'אלכס': { figure: 'adultB2', standIn: true },

  // ---- PARTNER — שלוש האפשרויות (`lib/life/partner.ts`), בשם שהתיבה מדפיסה
  //
  // 21.9.2026: דור עמדה על `girlTeen` — ילדה בת שתים-עשרה — כבת זוג. ותמר על הגוף של המורה
  // מ-1991. שלוש נשים שנפגשות באותו ערב (2011-people) חייבות שלושה גופים, ואף אחד מהם לא
  // של קרן, שחוזרת בכל חיים שבהם אין בן/בת זוג. יש בדיוק חמש נשים מצוירות בגיל הזה —
  // B3, B5, B6, B7 והמורה — וזה כל התקציב: קרן, מלאני, דור, תמר ושני. מי שנשאר (לינה,
  // בתיה, ענבל, נטע, מיכל) חולק גוף עם מישהי שלא נפגשת איתה באותו פרק.
  'מלאני': { figure: 'adultB7', standIn: true },
  'דור': { figure: 'adultB6', standIn: true },
  'תמר': { figure: 'adultB5', standIn: true },
}

/**
 * הפנים בתיבה — אותו אדם שעומד על הרצפה (21.9.2026, כלל 67).
 *
 * `ownFace` ב-`era.ts` מלביש את המפה הזאת על כל פרק מ-2000, כך שמי שמדבר בתיבה נראה
 * כמו מי שעומד בחדר. ללוחות של התחליפים — חיתוך מהגוף שבטבלה למעלה
 * (`scripts/life/cast-faces-2026-09-21.py`). מי שיש לו פנים משלו (רחל, אופיר, עמית, שחור,
 * יוסף, אסף, מלמד, פרדי, מישל...) לא מופיע כאן: הפרקים שלו כבר נושאים את הלוח שלו,
 * ו-`ownFace` מגדל את הפנים של 1986 (`GROWN_PLATE` — קובי, אופיר, עמית, קרן). אפי כאן כי
 * הגוף של 1996 שלו חדש יותר מכל מפה.
 */
export const FACES_2000: Readonly<Record<string, string>> = {
  // a boy who is not Pogi (the classroom sheet of 1991); see `CAST_2000`
  'הילד': 'faceKid',
  'אפי': 'faceEfi96',
  'קרן': 'faceStandB3',
  'מתוקי': 'faceStandA4',
  'רומא': 'faceStandA6',
  'פרדי': 'faceStandA2',
  'מלמד': 'faceStandA1',
  'ירון': 'faceStandA4',
  'אולי': 'faceStandA6',
  'יונתן': 'faceStandA6',
  'ניקו': 'faceStandA1',
  'אדם': 'faceStandA1',
  'אילן': 'faceStandB1',
  'אילן השכן': 'faceStandB1',
  'לירון': 'faceLiron',
  'אלכס': 'faceStandB2',
  'גור': 'faceStandB4',
  'יבגני': 'faceStandB4',
  'תמר': 'faceStandB5',
  'לינה': 'faceStandB5',
  'דור': 'faceStandB6',
  'בתיה': 'faceStandB6',
  'מלאני': 'faceStandB7',
  'ענבל': 'faceStandB7',
  'נטע': 'faceStandB7',
  'מיכל': 'faceStandB7',
  // the teacher's own plate, because the body is hers
  'שני': 'faceTeacher',
  'מאיה': 'faceTeacher',
  'מראיינת': 'faceTeacher',
}

/** the two people of the nineties whose own sheets are illustrations (see `CAST_2000`) */
export const STANDIN_FACES: Readonly<Record<string, string>> = {
  'פרדי': 'faceStandA2',
  'מלמד': 'faceStandA1',
}

/** the body this person has in the adult life, or null — narration, the player, a voice */
export function castFigure(who: string | null | undefined, year?: number): CastFigure | null {
  if (!who) return null
  const body = CAST_2000[who]
  if (!body) return null
  if (year === undefined || !body.fromYear) return body
  let figure = body.figure
  for (const [from, key] of Object.entries(body.fromYear)) if (year >= Number(from)) figure = key
  return { ...body, figure }
}
