import { ARCHIVE_SHIRTS } from './generated/kitShirts'
import { SHIRT as SHIRT_BY_DECADE, decadeOf, decadeOfYear, SHIRT as SHIRT_TABLE } from './prices'
import type { KitSpec } from '../kit/spec'
import type { Conversation } from './content/script'
import type { Condition } from './world/types'
import type { LifeState } from './types'

/**
 * האוסף — the shirts, and the one thing in this game a person keeps for life.
 *
 * Everything else the child owns is cleared at midnight: `day.entered` and `year.entered`
 * empty the pockets and the inventory, because an afternoon is not a bank. A shirt is not
 * an afternoon. It goes in the wardrobe under an `own:` flag, which is one of the six
 * prefixes that survive a new day and a new decade — so the VISA he counts out for on a
 * Sunday in 1985 is still folded in the drawer in 2000, and the collection is the only
 * object in the game that measures the whole life.
 *
 * Each row is a real shirt Maor photographed, dated the way he dates them, and priced in
 * whole shekels of its own decade. `from` is the chapter the shirt first hangs anywhere —
 * a kit cannot be bought before it existed, and the shop is how the years show that they
 * are passing.
 */
export type Shirt = {
  id: string
  /**
   * The PNG this shirt is drawn from — a photograph Maor took of a shirt he owns.
   *
   * Empty for a shirt that comes out of the club's own kit archive: those are DRAWN, from
   * a `KitSpec`, by the same component the kits screen uses. A photograph is a shirt
   * somebody kept; a spec is a shirt the club wore. The collection holds both, and the
   * card knows which it is looking at.
   */
  art: string
  nameHe: string
  sponsorHe: string
  yearsHe: string
  /**
   * whole shekels, in the money of its own decade — and NOT typed here.
   *
   * Maor set the table on 5.9.2026 (30 · 60 · 110 · 160) and a shirt now takes its price
   * from the decade of the chapter it first hangs in, so a row cannot drift from the
   * table and a new shirt cannot invent a price. `SHIRTS` fills this in below.
   */
  price: number
  /** the chapter it first appears on a rail */
  from: string
  noteHe: string
  kind: 'football' | 'basketball'
  /** drawn rather than photographed: the archive's own spec (`lib/kit/spec.ts`) */
  spec?: KitSpec
  /** the season it belongs to, when it came out of the archive */
  seasonLabel?: string
  /** where the row came from, printed on the card — rule 16 */
  sourceHe?: string
}

/** chapters in the order the life plays them, so `from` can mean "this year or later" */
const ORDER = [
  'a2-alley', 'a3-hall', 'a4-shirt', 'a5-first', 'a6-radio', 'a7-week', '1986',
  '1990', '1991', '1993-cup', '1993-galil', '1995-sinai', '1996-army',
  '1997-basket', '1998-laces', '1999-basket', '1999-cup', '2000-title', '2000-double',
]

const SHIRT_ROWS: readonly Omit<Shirt, 'price'>[] = [
  {
    /**
     * החולצה של קיץ 1985 — the one the archive actually holds for that season.
     *
     * A4 is set in the summer of 1985 and it was handing the boy `visa86`: adidas, VISA,
     * white bands. `content/manual/kit-designs.json` files that combination as **1988/89**,
     * three years later, and Stage A §9 forbids inventing a sponsor, a manufacturer or a
     * number. So the shirt in Rafi's window is the archive's 1984/85 home row, at
     * confidence 3, from photographs Maor supplied on 1.9.2026 — adidas, גלאב הוטל טבריה,
     * thin cream and blue diagonals on red, cream v-neck. Maor chose this over keeping the
     * VISA one, on 6.9.2026.
     *
     * The art is a stand-in drawn from that row (`scripts/life/make-shirt-8485.py`) and
     * carries no lettering; the sponsor's name is printed by `ShirtCard` off the archive
     * row, where it has a source attached. `GRAPHICS-REQUESTS` asks for the photograph.
     */
    id: 'tveria85',
    art: 'shirtTveria85',
    nameHe: 'החולצה האדומה, אלכסונים',
    sponsorHe: 'גלאב הוטל טבריה',
    yearsHe: '1984/85',
    from: 'a4-shirt',
    noteHe: 'אדידס. אלכסונים דקים, קרם וכחול, על אדום. צווארון וי קרם. זו החולצה בחלון של רפי.',
    kind: 'football',
  },
  {
    id: 'visa86',
    art: 'shirtVisa86',
    nameHe: 'החולצה האדומה, פסים',
    sponsorHe: 'VISA',
    yearsHe: 'אמצע שנות ה־80',
    from: '1986',
    noteHe: 'אדידס, פסי רוחב לבנים על השרוול, וסמל הפועל מעל הלב.',
    kind: 'football',
  },
  {
    id: 'diadoraRed',
    art: 'shirtDiadoraRed',
    nameHe: 'דיאדורה, אדומה',
    sponsorHe: 'diadora',
    yearsHe: 'תחילת שנות ה־90',
    from: '1990',
    noteHe: 'צווארון, אלכסונים בשני אדומים, והלוגו הלבן על כל החזה. החולצה של הילדות שאחרי.',
    kind: 'football',
  },
  {
    id: 'diadoraWhite',
    art: 'shirtDiadoraWhite',
    nameHe: 'דיאדורה, לבנה',
    sponsorHe: 'DIADORA',
    yearsHe: 'שנות ה־90, חוץ',
    from: '1993-cup',
    noteHe: 'החולצה שנוסעים בה. אפור־לבן עם פסים דקים, ואדום רק על השרוול ועל הצווארון.',
    kind: 'football',
  },
  {
    id: 'basket90',
    art: 'shirtBasket90',
    nameHe: 'גופיית הכדורסל',
    sponsorHe: 'בירה מכבי',
    yearsHe: 'שנות ה־90',
    from: '1993-galil',
    noteHe: 'מספר 8. שם של בירה על החזה של הפועל — ככה זה היה, ואף אחד לא צחק.',
    kind: 'basketball',
  },
  {
    id: 'shikun',
    art: 'shirtShikun',
    nameHe: 'שיכון עובדים',
    sponsorHe: 'שיכון עובדים',
    yearsHe: 'אמצע שנות ה־90',
    from: '1996-army',
    noteHe: 'שתי מילים על החזה שאומרות מאיפה המועדון הזה בא. אין עליהן ויכוח.',
    kind: 'football',
  },
  {
    id: 'king',
    art: 'shirtKing',
    nameHe: 'king מוצרי חשמל',
    sponsorHe: 'king',
    yearsHe: 'סוף שנות ה־90',
    from: '1998-laces',
    noteHe: 'העונה של 2.5.98. אם אתה זוכר את החולצה הזאת, אתה זוכר גם איפה עמדת באותו ערב.',
    kind: 'football',
  },
  {
    id: 'crt',
    art: 'shirtCrt',
    nameHe: 'נייקי, crt',
    sponsorHe: 'crt',
    yearsHe: 'שנות ה־2000',
    from: '2000-title',
    noteHe: 'צווארון לבן, שרוולים לבנים, והסמל העגול. החולצה של השנה שהכול קרה בה.',
    kind: 'football',
  },
]

/**
 * המחירון — every shirt priced off `prices.ts`, by the decade it first hangs in.
 *
 * 18 · 95 · 95 · 80 · 110 · 130 · 160 was what these rows said, which is not a price list,
 * it is seven separate opinions. The table is 30 in the eighties, 60 in the nineties, 110
 * in the two-thousands, and the shirt in the window costs what a shirt cost that year.
 */
/** the year a chapter happens in, for placing a season against the life */
const CHAPTER_YEAR: Record<string, number> = {
  'a2-alley': 1984, 'a3-hall': 1984, 'a4-shirt': 1985, 'a5-first': 1985, 'a6-radio': 1985,
  'a7-week': 1986, '1986': 1986, '1990': 1990, '1991': 1991, '1993-cup': 1993,
  '1993-galil': 1993, '1995-sinai': 1995, '1996-army': 1996, '1997-basket': 1997,
  '1998-laces': 1998, '1999-basket': 1999, '1999-cup': 1999, '2000-title': 2000,
  '2000-double': 2000,
}

/**
 * The first chapter a shirt from this season could hang in — or `LATER`, for a season
 * this life has not reached.
 *
 * Twenty-six of the archive's thirty-three kits are from seasons after 2000, and the
 * first version of this function fell back to the FIRST chapter for them: a 2025 Macron
 * shirt on Rafi's rail in 1985. `LATER` is not a chapter, `onSale` refuses anything that
 * is not a chapter, and the collection still counts them — they are shirts of this club
 * that the boy has not lived yet.
 */
export const LATER = 'later'

function chapterForSeason(seasonLabel: string): string {
  const year = Number(seasonLabel.slice(0, 4))
  const found = ORDER.find((chapter) => (CHAPTER_YEAR[chapter] ?? 1984) >= year)
  return found ?? LATER
}

/**
 * הארון של המועדון — the archive's thirty-three season kits, as shirts on a rail.
 *
 * Maor, 5.9.2026: "אל תזכור שהאתר הוא מקור המידע שלנו בסוף. אפשר לעשות ממש קולקציה מלאה
 * וכך אני רוצה." So the collection is not seven photographs any more, it is the club's
 * own kit history — season, sponsor, cut, and the note read off the photograph — drawn
 * from the same specs the kits screen draws, priced by the decade of its season.
 *
 * Seven of the thirty-three fall inside the years this life is played in and can actually
 * be bought; the rest are seasons that have not happened yet in 1986, which is exactly
 * what a collection with gaps in it should feel like.
 */
const ARCHIVE_ROWS: readonly Omit<Shirt, 'price'>[] = ARCHIVE_SHIRTS.map((kit) => ({
  id: kit.id,
  art: '',
  nameHe: `${kit.seasonLabel} · ${kit.variantHe}`,
  sponsorHe: kit.sponsorHe ?? '—',
  yearsHe: `עונת ${kit.seasonLabel}`,
  from: chapterForSeason(kit.seasonLabel),
  noteHe: kit.noteHe,
  kind: 'football' as const,
  spec: kit.spec as KitSpec,
  seasonLabel: kit.seasonLabel,
  sourceHe: kit.sourceTitle ?? undefined,
}))

export const SHIRTS: readonly Shirt[] = [...SHIRT_ROWS, ...ARCHIVE_ROWS].map((row) => ({
  ...row,
  price: row.seasonLabel
    ? SHIRT_TABLE[decadeOfYear(Number(row.seasonLabel.slice(0, 4)))]
    : SHIRT_BY_DECADE[decadeOf(row.from)],
}))

export const shirtFlag = (id: string) => `own:shirt:${id}`

export function shirtById(id: string): Shirt | null {
  return SHIRTS.find((shirt) => shirt.id === id) ?? null
}

export function owns(state: LifeState, id: string): boolean {
  return Boolean(state.flags[shirtFlag(id)])
}

export function ownedShirts(state: LifeState): Shirt[] {
  return SHIRTS.filter((shirt) => owns(state, shirt.id))
}

/** Everything a rail can hold in this chapter — earlier kits stay on sale, later ones do not exist. */
export function onSale(chapter: string): Shirt[] {
  const now = ORDER.indexOf(chapter)
  if (now < 0) return []
  return SHIRTS.filter((shirt) => {
    const at = ORDER.indexOf(shirt.from)
    return at >= 0 && at <= now
  })
}

/**
 * כמה יש בכלל — how many shirts exist by this chapter, which is what a collection count
 * should be measured against. "3 / 40" in 1985 is a promise about 2025; "3 / 9" is the
 * rail the boy can actually see.
 */
export function knownBy(chapter: string): Shirt[] {
  return onSale(chapter)
}

/** what the shop says when it has nothing new for you */
export const SHOP_EMPTY_HE = 'הכול כבר אצלך. תחזור כשיצא דגם חדש.'

/**
 * A shirt costs what it costs, and the game already refuses a purchase you cannot afford
 * — so the condition on a shop choice is the price, in agorot, the way every other price
 * in this game is written.
 */
export function affordable(shirt: Shirt): Condition {
  return { minAgorot: shirt.price * 100 }
}


/** the chapters the fan shop is open in — Stage A buys its one shirt off Rafi's rail */
export const SHOP_CHAPTERS = ORDER.slice(ORDER.indexOf('1990'))

export const shopId = (chapter: string) => `fan-shop-${chapter}`

/**
 * חנות האוהדים — built out of the collection rather than typed twice.
 *
 * A shop written by hand goes out of date the first time a shirt is added, so this one is
 * generated: one conversation per chapter, holding the kits that exist by then, priced in
 * the money of their decade, with the ones already in the wardrobe simply not offered
 * again. `when` carries the price — the same condition every other purchase in this game
 * is guarded by, because you cannot buy what you cannot count out on the counter.
 *
 * The rail is therefore also a calendar: two shirts on it in 1990, seven after the double,
 * and the gaps in between are the years you were somewhere else.
 */
export function fanShops(): Conversation[] {
  return SHOP_CHAPTERS.map((chapter) => ({
    id: shopId(chapter),
    nameHe: 'חנות האוהדים',
    branches: [
      {
        lines: [
          { who: 'המוכר', text: onSale(chapter).length > 6 ? 'תסתכל טוב. מה שאין פה, אין באף מקום.' : 'מה שיש על הקולב, יש. תבחר.' },
        ],
        then: [{ e: 'shop' as const }],
      },
    ],
  }))
}

/** what the card says the first time, and after — kept out of the app folder (rule: no strings there) */
export const SHIRT_FIRST_HE = 'קנית את חולצת הפועל הראשונה שלך!'
export const SHIRT_MORE_HE = 'עוד אחת לארון.'
/** the card that opens when a season's kit reaches the rail for the first time */
export const SHIRT_NEW_HE = 'חולצה חדשה בחנות האוהדים'

/**
 * מה נכנס לחנות מאז — the kits that exist in this chapter and did not in the last one.
 *
 * A rail that fills up silently is a rail nobody looks at twice. This is what the game
 * holds up when a season turns: the kit the club actually started wearing that year, once,
 * the first time it could be bought.
 */
export function arrivedBetween(previous: string | null, chapter: string): Shirt[] {
  const now = onSale(chapter)
  if (!previous) return []
  const had = new Set(onSale(previous).map((shirt) => shirt.id))
  return now.filter((shirt) => !had.has(shirt.id))
}

// --------------------------------------------------------------- הזיכרון של החולצה ---

/**
 * מה לבשת ומתי — the flag that turns a wardrobe into a biography.
 *
 * A collection of forty shirts is a list. A shirt that says "you wore this one on
 * 26.5.1999" is a life. The flag carries the `own:` prefix, so like the shirt itself it
 * survives a new day, a new year and a new decade — a thing you wore to a cup final is not
 * cleared at midnight.
 */
export const wornFlag = (id: string, chapter: string) => `own:worn:${id}:${chapter}`

/**
 * איזו חולצה היית לובש — the newest one you own that already existed by this chapter.
 *
 * Nobody in 1999 puts on the shirt he queued for in 1985 to go to a cup final; he puts on
 * the newest one he has. So: the most recently BOUGHT shirt, read off the event log in
 * order, restricted to the ones that exist by now. A player who owns nothing wore nothing,
 * and the chapter records nothing — which is also true, and is its own kind of memory.
 */
export function wearingAt(state: LifeState, log: readonly { t: string; flag?: string }[], chapter: string): Shirt | null {
  const available = new Set(onSale(chapter).map((shirt) => shirt.id))
  let latest: Shirt | null = null
  for (const event of log) {
    if (event.t !== 'flag.raised' || !event.flag?.startsWith('own:shirt:')) continue
    const id = event.flag.slice('own:shirt:'.length)
    if (!available.has(id)) continue
    const shirt = SHIRTS.find((row) => row.id === id)
    if (shirt) latest = shirt
  }
  return latest && owns(state, latest.id) ? latest : null
}

/** every chapter this shirt was worn to, in the order they were lived */
export function wornIn(state: LifeState, id: string): string[] {
  const prefix = `own:worn:${id}:`
  return Object.keys(state.flags)
    .filter((flag) => flag.startsWith(prefix) && state.flags[flag])
    .map((flag) => flag.slice(prefix.length))
}
