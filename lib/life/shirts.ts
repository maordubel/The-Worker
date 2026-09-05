import { SHIRT as SHIRT_BY_DECADE, decadeOf } from './prices'
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
}

/** chapters in the order the life plays them, so `from` can mean "this year or later" */
const ORDER = [
  'a2-alley', 'a3-hall', 'a4-shirt', 'a5-first', 'a6-radio', 'a7-week', '1986',
  '1990', '1991', '1993-cup', '1993-galil', '1995-sinai', '1996-army',
  '1997-basket', '1998-laces', '1999-basket', '1999-cup', '2000-title', '2000-double',
]

const SHIRT_ROWS: readonly Omit<Shirt, 'price'>[] = [
  {
    id: 'visa86',
    art: 'shirtVisa86',
    nameHe: 'החולצה האדומה, פסים',
    sponsorHe: 'VISA',
    yearsHe: 'אמצע שנות ה־80',
    from: 'a4-shirt',
    noteHe: 'אדידס, פסי רוחב לבנים על השרוול, וסמל הפועל מעל הלב. זו החולצה בחלון של רפי.',
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
export const SHIRTS: readonly Shirt[] = SHIRT_ROWS.map((row) => ({
  ...row,
  price: SHIRT_BY_DECADE[decadeOf(row.from)],
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
  return SHIRTS.filter((shirt) => ORDER.indexOf(shirt.from) <= now)
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
  return SHOP_CHAPTERS.map((chapter) => {
    const rail = onSale(chapter)
    return {
      id: shopId(chapter),
      nameHe: 'חנות האוהדים',
      branches: [
        {
          lines: [
            { who: 'המוכר', text: rail.length > 3 ? 'תסתכל טוב. מה שאין פה, אין באף מקום.' : 'מה שיש על הקולב, יש. תבחר.' },
          ],
          choices: [
            ...rail.map((shirt) => ({
              id: shirt.id,
              text: `${shirt.nameHe} — ${shirt.price} ₪`,
              when: { all: [affordable(shirt), { notFlag: shirtFlag(shirt.id) }] } as Condition,
              noteHe: `${shirt.price} ₪. עוד לא.`,
              then: [
                { e: 'money' as const, agorot: -shirt.price * 100, why: shirt.nameHe },
                { e: 'shirt' as const, id: shirt.id },
                { e: 'sfx' as const, key: 'coins' as const, level: 0.7 },
                { e: 'redheart' as const, key: 'footballLove' as const, delta: 3 },
              ],
            })),
            { id: 'leave', text: 'רק מסתכל.', then: [] },
          ],
        },
      ],
    } as Conversation
  })
}
