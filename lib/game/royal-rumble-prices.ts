import type { RoyalRumblePrice } from './royal-rumble-public'

export { ROYAL_RUMBLE_BALANCE_VERSION } from './royal-rumble-public'

/**
 * Canonical price overrides — the LAST step of the price pipeline (spec §12–§13):
 *
 *     historicalRating → suggested price → position calibration → canonical override
 *
 * The automated price is a percentile of documented evidence, and evidence is uneven
 * across a century: a 1930s man has a handful of squad rows, a 2010s squad man has a
 * season of scorer tables. These are the men the formula is allowed to be wrong about,
 * reviewed by hand against the audit's ladder (`npm run rumble:audit`, §67–§68) and
 * priced by one question only — *does this price make a fun, sensible choice?* — never
 * "who is bigger historically". Keys are Player Master slugs; the pricing test fails on a
 * slug the master does not know and on the list growing past sixty (§13: overrides are
 * for icons, sparse data, short peaks and automated mispricing — not for hand-pricing the
 * archive).
 *
 * Three groups, 25.9.2026:
 *  · ICONS pinned at €5, so a future rebalance of the evidence weights cannot quietly
 *    make Sinai a €4 — the men a supporter names first, across the eras.
 *  · EVIDENCE-INFLATED €5 → €4: founding-era rows where longevity is the only fact on
 *    file, one-spell peaks the scorer table over-rewards, and current-squad men with no
 *    honours yet. A "major Hapoel player" price is the honest one, and it is what makes
 *    €5 rare (§10: 8–12%).
 *  · CULT PICKS priced as bargains: the men the terrace sings about (`songs.json`) who
 *    played two or three seasons. A €2 card with a song behind it is exactly the
 *    "רגע — הוא רק €2M? אני לוקח" the spec is after.
 */
export const ROYAL_RUMBLE_PRICE_OVERRIDES: Readonly<Record<string, RoyalRumblePrice>> = {
  // icons — pinned
  'משה-סיני': 5,
  'ריפעת-טורק': 5,
  'שייע-פייגנבוים': 5,
  'יעקב-חודורוב': 5,
  'גילי-לנדאו': 5,
  'שבתאי-לוי': 5,
  'יוסי-אבוקסיס': 5,
  'סלים-טועמה': 5,
  'וואליד-באדיר': 5,
  'שמעון-גרשון': 5,
  'ערן-זהבי': 5,
  'וינסנט-אניימה': 5,
  'יחזקאל-חזום': 5,
  'רחביה-רוזנבוים': 5,
  'אריה-בזרנו': 5,
  'שביט-אלימלך': 5,
  // evidence-inflated — founding era, longevity only
  'וילי-ברגר': 4,
  'משה-פוליאקוב': 4,
  'שלמה-פוליאקוב': 4,
  'אברהם-נודלמן': 4,
  'זלמן-פרידמן': 4,
  'אשר-בלוט': 4,
  'חיים-נוריאלי': 4,
  'דני-בורסוק': 4,
  // evidence-inflated — one spell, or no honours yet
  'אייל-בן-עמי': 4,
  'יהודה-עמר': 4,
  'אישטוואן-פישונט': 4,
  'שלום-תקוה': 4,
  'מהראן-לאלה': 4,
  'עומרי-אלטמן': 4,
  'סתיו-טוריאל': 4,
  // cult picks — a song, a short spell, a bargain
  'יניב-מזרחי': 2,
  'גיא-צרפתי': 2,
  'עומר-פדידה': 2,
  'יורגן-קולין': 3,
  'דניאל-דה-רידר': 3,
  'חזי-שירזי': 3,
}
