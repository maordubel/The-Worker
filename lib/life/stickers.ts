/**
 * סופרגול — האלבום.
 *
 * Maor sent a folder called "סופרגול כללי" in September 2026: five stickers photographed
 * out of an album with the ruled notebook paper still showing behind them, one modern
 * card, and a squad spread from 1992/93 with the Hertz board behind the players. Two of
 * the stickers have his own handwriting on the tape underneath — "אב כל הנשמות. האחד
 * והיחיד." under Eli Cohen, "אין מלים. הוויינר הגדול אי פעם" under Gili Landau. That
 * handwriting is the design brief. An album is not a checklist; it is a place a child
 * wrote down what he thought of a man.
 *
 * Three rules hold this file together, and all three are the archive's rather than the
 * game's:
 *
 * · **A sticker with a face is a scan or it does not exist.** Nothing here draws a
 *   player. The six scans are shown as scans, with `sourceHe` under them, and every other
 *   slot in the album is what an album slot actually is — a printed rectangle with a name
 *   under it and nothing stuck on top.
 * · **Every name is sourced.** The 1985/86 page is the squad `content/manual/people.json`
 *   carries against the ynet piece on Landau's 86th minute; the 1992/93 page is the three
 *   men whose names are printed large enough on the scans to be certain of. Names that
 *   would have to be read off a blurred caption are not in the album — a misread name is
 *   a fabricated one (rule 11).
 * · **The numbers are the album's, not the printer's.** `slot` is a position on a page.
 *   `printedN` exists only where a number is legible on the scan itself — 5 on Bezredno,
 *   231 on Shalom Tikva — and nothing else claims to know what a sticker was numbered.
 *
 * The economy is the child's: a packet costs one bottle deposit, so an afternoon of
 * collecting bottles is an afternoon of packets, and the shirt in the shop gets further
 * away every time you buy one. That is the decision the feature exists to force.
 */
import type { CharacterId, LifeState } from './types'
import { relationshipOf } from './types'
import { Roller } from './rng'
import { decadeOf, type Decade } from './prices'

export type StickerSetId =
  | '8081'
  | '8586'
  | 'sg80a'
  | 'sgcup'
  | 'sg80b'
  | '9293'
  | 'sg978'
  | '96'
  | 'box'

export type StickerRarity = 'common' | 'uncommon' | 'rare' | 'kept'

export type StickerSet = {
  id: StickerSetId
  titleHe: string
  /** the season the page is, said the way a page of an album says it */
  seasonHe: string
  /** the same season on a tab 60px wide — a phone has four of these in a row */
  shortHe: string
  /** the frame the stickers of this year were printed in — the sheet draws it */
  frame: '80' | '86' | '93' | '96' | '98'
  /** the decade a kiosk sells this packet in; `null` means it was never sold, only kept */
  soldIn: Decade | null
  /** the poster that opens the page, when the archive has one */
  posterArt?: string
  posterSourceHe?: string
}

export type StickerDef = {
  id: string
  set: StickerSetId
  /** where it sits on the page — the album's own numbering */
  slot: number
  nameHe: string
  /** מגן, קשר, חלוץ, שוער, מאמן — only where the card itself prints it */
  roleHe?: string
  /** the number printed on the sticker itself, where a scan makes it legible */
  printedN?: number
  /** the scan, when the archive holds this one */
  scan?: string
  /** where the NAME came from — a source, never a meaning */
  sourceHe: string
  /** what Maor wrote under it in his own album, in his own hand */
  handHe?: string
  rarity: StickerRarity
  /**
   * לא נמכר במעטפה — the sticker a packet will never contain.
   *
   * One per page, and the whole design of the feature. The last slot is the one you have
   * to ask somebody for, and who has it is decided by how you have treated people
   * (`holderOf`). A collection you can finish alone is not a collection, it is a shop.
   */
  neverInPacket?: boolean
}

export const SETS: Record<StickerSetId, StickerSet> = {
  '8081': {
    id: '8081',
    titleHe: 'סופרגול · 1980/81',
    seasonHe: 'עונת 1980/81',
    shortHe: '80/81',
    frame: '80',
    soldIn: null,
  },
  '8586': {
    id: '8586',
    titleHe: 'סופרגול · 1985/86',
    seasonHe: 'עונת 1985/86',
    shortHe: '85/86',
    frame: '86',
    soldIn: '80s',
  },
  sg80a: {
    id: 'sg80a',
    titleHe: 'סופרגול · הסגל',
    seasonHe: 'הסגל, שנות השמונים',
    shortHe: 'הסגל',
    frame: '86',
    soldIn: '80s',
  },
  sgcup: {
    id: 'sgcup',
    titleHe: 'הגביע הוא שלנו',
    seasonHe: 'עונת הגביע, שנות השמונים',
    shortHe: 'הגביע',
    frame: '86',
    soldIn: '80s',
  },
  sg80b: {
    id: 'sg80b',
    titleHe: 'הפועל תל־אביב · במספרים',
    seasonHe: 'הסגל לפי מספרים, שנות השמונים',
    shortHe: 'מספרים',
    frame: '86',
    soldIn: '80s',
  },
  '9293': {
    id: '9293',
    titleHe: 'סופרגול · 1992/93',
    seasonHe: 'עונת 1992/93',
    shortHe: '92/93',
    frame: '93',
    soldIn: '90s',
    posterArt: '/life/docs/sg-squad-93.jpg',
    posterSourceHe: 'תצלום הסגל, עונת 1992/93 — מהחומרים של מאור הראל.',
  },
  sg978: {
    id: 'sg978',
    titleHe: 'הפועל · 1997/8',
    seasonHe: 'עונת 1997/98',
    shortHe: '97/98',
    frame: '98',
    soldIn: '90s',
  },
  '96': {
    id: '96',
    titleHe: 'סופרגול · 1996',
    seasonHe: '1996',
    shortHe: '1996',
    frame: '96',
    soldIn: null,
  },
  box: {
    id: 'box',
    titleHe: 'הקופסה של אבא',
    seasonHe: 'מה שנשמר בקופסה האדומה',
    shortHe: 'הקופסה',
    frame: '80',
    soldIn: null,
  },
}

/** the line that goes under every scan on this page, and says only where it came from */
const FROM_ALBUM = 'מדבקת סופרגול מהאלבום של מאור הראל.'
const FROM_YNET = 'ynet — הדרמה של 1986, גילי לנדאו בדקה ה-86.'
/** the four printed sheets that arrived on 7.9.2026, each named by what it prints */
const FROM_SHEET_A = 'גיליון קלפים — הסגל, שנות השמונים; מהחומרים של מאור הראל.'
const FROM_SHEET_CUP = 'גיליון קלפים — "הגביע הוא שלנו"; מהחומרים של מאור הראל.'
const FROM_SHEET_B = 'גיליון קלפים ממוספר, שנות השמונים; מהחומרים של מאור הראל.'
const FROM_SHEET_98 = 'גיליון קלפים — 1997/8; מהחומרים של מאור הראל.'

/**
 * הדף של אבא — one sticker, and the rest of the album gone.
 *
 * It is not collectible and there is nothing to complete. It is in the box because
 * somebody kept it for forty-five years, which is the only reason anything is in the box.
 */
const S8081: StickerDef[] = [
  {
    id: 'bezredno',
    set: '8081',
    slot: 1,
    nameHe: 'אריה בזדרנו',
    roleHe: 'שוער',
    printedN: 5,
    scan: '/life/docs/sg-bezredno-80.jpg',
    sourceHe: FROM_ALBUM,
    rarity: 'kept',
    neverInPacket: true,
  },
]

/** הדף של 86 — the squad the archive names, in the order a page would print them */
const NAMES_86: ReadonlyArray<[string, string, string?]> = [
  ['landau', 'גילי לנדאו'],
  ['sinai', 'משה סיני'],
  ['eli-cohen', 'אלי "קוקוס" כהן'],
  ['talias', 'יום טוב טליאס'],
  ['amar', 'יהודה עמר'],
  ['ekhoiz', 'יעקב אקהויז'],
  ['zana', 'יוסי זאנה'],
  ['hershkovitz', 'דוד הרשליקוביץ׳'],
  ['yaakov-cohen', 'יעקב כהן'],
  ['barnes', 'אליאור ברנס'],
  ['zano', 'מוריס ז׳אנו'],
  ['shabtai-levi', 'שבתאי לוי'],
  ['yani', 'אלי יאני'],
  ['schweitzer', 'דוד שוויצר'],
  ['sharir', 'צבי שריר'],
  ['avi-ran', 'אבי רן'],
  ['sharf', 'שלמה שרף', 'מאמן'],
]

const S8586: StickerDef[] = NAMES_86.map(([id, nameHe, roleHe], index) => ({
  id,
  set: '8586' as const,
  slot: index + 1,
  nameHe,
  ...(roleHe ? { roleHe } : {}),
  sourceHe: FROM_YNET,
  rarity: (index < 3 ? 'rare' : index < 8 ? 'uncommon' : 'common') as StickerRarity,
}))

// the two the archive actually holds a scan of, and the two Maor wrote under
S8586[0] = {
  ...(S8586[0] as StickerDef),
  scan: '/life/docs/sg-landau-86.jpg',
  sourceHe: FROM_ALBUM,
  handHe: 'אין מלים. הוויינר הגדול אי פעם',
}
S8586[2] = {
  ...(S8586[2] as StickerDef),
  scan: '/life/docs/sg-elicohen-86.jpg',
  sourceHe: FROM_ALBUM,
  handHe: 'אב כל הנשמות. האחד והיחיד.',
}
// two more out of his own album, and his own file names date them: "יעקב אקהויז 86",
// "מוריס זאנו 86". A page named after a season takes a card that says that season.
S8586[5] = {
  ...(S8586[5] as StickerDef),
  scan: '/life/docs/hand-ekhoiz.jpg',
  sourceHe: FROM_ALBUM,
}
S8586[10] = {
  ...(S8586[10] as StickerDef),
  scan: '/life/docs/hand-zano.jpg',
  sourceHe: FROM_ALBUM,
}
// שלמה שרף closes the page, and no packet has ever had him in it
S8586[S8586.length - 1] = { ...(S8586[S8586.length - 1] as StickerDef), rarity: 'rare', neverInPacket: true }

/**
 * שלושה גיליונות שלמים — every card below is a cut from a printed sheet.
 *
 * `cut-cards.py` measures the sheet and writes one file per card; the name, the role and
 * the number here are read off THAT file at four times its printed size and nowhere else.
 * Where a number sits under the crop line it is simply absent — the album says less
 * rather than guessing, the same rule the 1992/93 page has always obeyed.
 */
type Row = [file: string, nameHe: string, roleHe?: string, printedN?: number]

const page = (
  set: StickerSetId,
  prefix: string,
  source: string,
  rows: readonly Row[],
): StickerDef[] =>
  rows.map(([file, nameHe, roleHe, printedN], index) => ({
    // a file carries its extension only when it is not a JPEG: three of the cup cards
    // are PNG because the encoder kept ringing one pixel back into the yellow band
    id: `${prefix}-${file.replace(/\.\w+$/, '')}`,
    set,
    slot: index + 1,
    nameHe,
    ...(roleHe ? { roleHe } : {}),
    ...(printedN ? { printedN } : {}),
    scan: `/life/docs/${file.includes('.') ? file : `${file}.jpg`}`,
    sourceHe: source,
    rarity: (index < 2 ? 'rare' : index < 7 ? 'uncommon' : 'common') as StickerRarity,
    ...(index === rows.length - 1 ? { neverInPacket: true, rarity: 'rare' as StickerRarity } : {}),
  }))

const SG80A: StickerDef[] = page('sg80a', 'a', FROM_SHEET_A, [
  ['sg80a-00', 'יעקב אקהויז', 'מגן', 4],
  ['sg80a-01', 'נמרוד דרייפוס', 'מגן', 2],
  ['sg80a-02', 'אריה בז׳רנו', 'שוער', 1],
  ['sg80a-04', 'יוסי זאנה', 'מגן', 5],
  ['sg80a-05', 'אלי כהן', 'קשר', 3],
  ['sg80a-06', 'מוריס ז׳אנו', 'קשר'],
  ['sg80a-07', 'ג׳ימי טורק', 'קשר', 17],
  ['sg80a-08', 'מאיר נחמיאס', 'קשר', 16],
  ['sg80a-09', 'שבתאי יחבס', 'קשר', 8],
  ['sg80a-10', 'משה סיני', 'קשר', 7],
  ['sg80a-11', 'אייל אקשטיין', 'קשר', 14],
  ['sg80a-13', 'גיל לנדאו', 'חלוץ', 9],
  ['sg80a-14', 'שבתאי לוי', 'חלוץ', 11],
  ['sg80a-12', 'דוד שווייצר', 'מאמן'],
  ['sg80a-03', 'סמל הקבוצה'],
])

const SGCUP: StickerDef[] = page('sgcup', 'c', FROM_SHEET_CUP, [
  ['sgcup-00', 'יוסי זאנה'],
  ['sgcup-01.png', 'יעקב אקהויז'],
  ['sgcup-02', 'אריה בז׳רנו'],
  ['sgcup-03', 'צביקה רוזן'],
  ['sgcup-04', 'ג׳ימי טורק'],
  ['sgcup-05', 'אלי כהן'],
  ['sgcup-06', 'מוריס ז׳אנו'],
  ['sgcup-07.png', 'שבתאי יחבס'],
  ['sgcup-08', 'שבתאי לוי'],
  ['sgcup-09', 'משה סיני'],
  ['sgcup-10', 'גילי לנדאו'],
  ['sgcup-11.png', 'דב רמלר'],
  ['sgcup-13', 'גדי מכנס ורמי ארמה'],
  ['sgcup-12', '"יאשין"'],
])

// the sheet prints 16 twice — on רמי ארמה and on אילן שוקרון. Both are written down as
// they are printed; the album is a record of a sheet, not a correction of one.
const SG80B: StickerDef[] = page('sg80b', 'b', FROM_SHEET_B, [
  ['sg80b-03', 'יום טוב טליאס', undefined, 1],
  ['sg80b-04', 'אריה אלטר', undefined, 1],
  ['sg80b-02', 'יהודה עמר', undefined, 2],
  ['sg80b-01', 'אלי כהן', undefined, 3],
  ['sg80b-00', 'יעקב אקהויז', undefined, 4],
  ['sg80b-09', 'יוסי זאנה', undefined, 5],
  ['sg80b-08', 'קובי סגל', undefined, 6],
  ['sg80b-07', 'משה סיני', undefined, 7],
  ['sg80b-06', 'מיקי בן־שיטרית', undefined, 8],
  ['sg80b-05', 'אליאור ברנס', undefined, 9],
  ['sg80b-14', 'מוריס ז׳אנו', undefined, 10],
  ['sg80b-13', 'שבתאי לוי', undefined, 11],
  ['sg80b-12', 'רפי שמואל', undefined, 12],
  ['sg80b-11', 'דוד הרשליקוביץ׳', undefined, 13],
  ['sg80b-10', 'אחמד מוסה', undefined, 14],
  ['sg80b-16', 'רמי ארמה', undefined, 16],
  ['sg80b-17', 'אילן שוקרון', undefined, 16],
  ['sg80b-15', 'גל הרשליקוביץ׳', undefined, 18],
  ['sg80b-18', 'יצחק שניאור', 'מאמן'],
])

const SG978: StickerDef[] = page('sg978', 'd', FROM_SHEET_98, [
  ['sg978-00', 'פליקס חלפון'],
  ['sg978-01', 'שביט אלימלך'],
  ['sg978-02', 'אלי כהן'],
  ['sg978-04', 'אסי דומב'],
  ['sg978-05', 'יניב ירון'],
  ['sg978-06', 'יעקב הילל'],
  ['sg978-07', 'שמעון גרשון'],
  ['sg978-08', 'ישראל כהן'],
  ['sg978-09', 'שחר כהן'],
  ['sg978-10', 'מירו מסטרוביץ׳'],
  ['sg978-11', 'דמיאן גייזר'],
  ['sg978-12', 'גילי רגב'],
  ['sg978-14', 'אבי אזולאי'],
  ['sg978-15', 'אייל בן־עמי'],
  ['sg978-17', 'אודי כפיר'],
  ['kt-dreslia', 'גיורגי דרסליה'],
  ['kt-moskal', 'קאז׳ימיש מוסקאל'],
  ['hand-shitrit', 'עופר שיטרית'],
  ['kt-simrotic', 'סבסטיאן סימרוטיץ׳'],
  ['kt-tikva', 'שלום תקוה'],
  ['sg978-03', 'סמל הקבוצה'],
])

/**
 * הדף של 93 — three names and a squad photograph.
 *
 * The spread carries a printed caption naming eleven men. Nine of them are legible only
 * as shapes at this scan resolution, and a name guessed off a blurred caption is a name
 * this project invented. So the page holds the three that are certain — Halfon's own card
 * prints his name across it, Sinai and Abuksis are in the archive — and the photograph
 * itself sits at the top of the page with everybody in it, uncaptioned, which is the
 * honest way to show eleven men whose names you cannot all read.
 */
const S9293: StickerDef[] = [
  {
    id: 'halfon',
    set: '9293',
    slot: 1,
    nameHe: 'פליקס חלפון',
    scan: '/life/docs/sg-halfon-93.jpg',
    sourceHe: 'כרטיס סופרגול, עונת 1992/93 — מהחומרים של מאור הראל.',
    rarity: 'rare',
  },
  {
    id: 'sinai-93',
    set: '9293',
    slot: 2,
    nameHe: 'משה סיני',
    roleHe: 'מנהל',
    sourceHe: 'תצלום הסגל, עונת 1992/93 — מהחומרים של מאור הראל.',
    rarity: 'uncommon',
  },
  {
    id: 'abuksis',
    set: '9293',
    slot: 3,
    nameHe: 'יוסי אבוקסיס',
    sourceHe: 'תצלום הסגל, עונת 1992/93 — מהחומרים של מאור הראל.',
    rarity: 'common',
    neverInPacket: true,
  },
]

/** הדף של 96 — one sticker, given rather than bought */
const S96: StickerDef[] = [
  {
    id: 'tikva',
    set: '96',
    slot: 1,
    nameHe: 'שלום תקוה',
    printedN: 231,
    scan: '/life/docs/sg-tikva-96.jpg',
    sourceHe: FROM_ALBUM,
    rarity: 'kept',
    neverInPacket: true,
  },
]

/**
 * הקופסה של אבא — the page no kiosk sells.
 *
 * Five men who played before the boy was born, and five cards out of Maor's own album
 * with the tape and his handwriting still on them. None of it is in a packet. One card
 * comes out of the box each time a page of the album is finished, which is the only
 * honest way a child ever got a card like this: somebody older decided he had earned it.
 */
const BOX_ROWS: ReadonlyArray<[string, string, string?]> = [
  ['ace-chodorov', 'יעקב חודורוב', 'שוער'],
  ['ace-levkovich', 'אמצייה לבקוביץ׳'],
  ['ace-tish', 'גדעון טיש'],
  ['ace-primo', 'דוד פרימו'],
  ['ace-feingboim', 'שייע פייגנבוים'],
  ['hand-hershkovitz', 'דוד (צ׳ילה) הרשליקוביץ׳'],
  ['hand-rufnik', 'דבור רופניק'],
]

const SBOX: StickerDef[] = BOX_ROWS.map(([file, nameHe, roleHe], index) => ({
  id: `box-${file}`,
  set: 'box' as const,
  slot: index + 1,
  nameHe,
  ...(roleHe ? { roleHe } : {}),
  scan: `/life/docs/${file.includes('.') ? file : `${file}.jpg`}`,
  sourceHe: file.startsWith('ace-')
    ? 'קלף אס — מהחומרים של מאור הראל.'
    : FROM_ALBUM,
  rarity: 'kept' as StickerRarity,
  neverInPacket: true,
}))

export const STICKERS: readonly StickerDef[] = [
  ...S8081,
  ...S8586,
  ...SG80A,
  ...SGCUP,
  ...SG80B,
  ...S9293,
  ...SG978,
  ...S96,
  ...SBOX,
]

export const stickerFor = (id: string): StickerDef | null =>
  STICKERS.find((sticker) => sticker.id === id) ?? null

export const stickersIn = (set: StickerSetId): StickerDef[] =>
  STICKERS.filter((sticker) => sticker.set === set).sort((a, b) => a.slot - b.slot)

export const SET_ORDER: readonly StickerSetId[] = [
  '8081',
  '8586',
  'sg80a',
  'sgcup',
  'sg80b',
  '9293',
  'sg978',
  '96',
  'box',
]

// ---------------------------------------------------------------------------------
// המצב — how many of each one you have. `album:` survives a year change (`personFlags`),
// because an album is the one object in this game that is explicitly about outliving the
// afternoon it was filled in.
// ---------------------------------------------------------------------------------

export const stickerFlag = (id: string) => `album:sg:${id}`

/** the flag that says this album has been opened at least once — the world can notice */
export const ALBUM_SEEN = 'album:seen'

export function haveOf(state: LifeState, id: string): number {
  const value = state.flags[stickerFlag(id)]
  return typeof value === 'number' ? value : value === true ? 1 : 0
}

export const hasSticker = (state: LifeState, id: string) => haveOf(state, id) > 0

/** how many DIFFERENT stickers of a page are stuck in */
export function stuckIn(state: LifeState, set: StickerSetId): number {
  return stickersIn(set).filter((sticker) => hasSticker(state, sticker.id)).length
}

/** every duplicate you are holding, one entry per spare copy */
export function duplicates(state: LifeState): StickerDef[] {
  const out: StickerDef[] = []
  for (const sticker of STICKERS) {
    const spare = haveOf(state, sticker.id) - 1
    for (let i = 0; i < spare; i += 1) out.push(sticker)
  }
  return out
}

/** the pages that are finished, and the ones that never can be */
export function pageDone(state: LifeState, set: StickerSetId): boolean {
  const page = stickersIn(set)
  return page.length > 0 && page.every((sticker) => hasSticker(state, sticker.id))
}

/**
 * הדף נסגר — is this page finished once these arrive?
 *
 * Asked BEFORE the events are applied, because the toast has to be queued in the same
 * turn as the sticker that closed the page. `extra` is what is about to be counted in.
 */
export function closesPage(state: LifeState, set: StickerSetId, extra: Iterable<string>): boolean {
  const arriving = new Set(extra)
  const page = stickersIn(set)
  if (page.length === 0) return false
  const already = page.filter((sticker) => hasSticker(state, sticker.id)).length
  if (already === page.length) return false
  return page.every((sticker) => hasSticker(state, sticker.id) || arriving.has(sticker.id))
}

export function albumTotals(state: LifeState): { have: number; total: number } {
  return {
    have: STICKERS.filter((sticker) => hasSticker(state, sticker.id)).length,
    total: STICKERS.length,
  }
}

// ---------------------------------------------------------------------------------
// המעטפה — what a packet costs, what is in it, and what it will never contain.
// ---------------------------------------------------------------------------------

/** what the money line says when a packet is paid for */
export const PACKET_WHY_HE = 'מעטפת סופרגול'

/** how many stickers come out of one — three, the way they did */
export const PACKET_SIZE = 3

/** which page a kiosk is selling in this chapter, or null where nobody sells any */
/**
 * מה מוכרים בקיוסק עכשיו — the album the kiosk still has packets for.
 *
 * A decade prints more than one album, and a kiosk does not sell four at once: it sells
 * the current one until it is finished and then the next. So this returns the first page
 * of that decade the boy has not completed, and only when every page of the decade is
 * full does it fall back to the last of them — a kiosk with nothing left to sell you is
 * a kiosk that stops the feature dead, and a duplicate is still worth trading.
 */
export function setSoldIn(state: LifeState): StickerSetId | null {
  const decade = decadeOf(state.chapter)
  const inDecade = SET_ORDER.filter((id) => SETS[id].soldIn === decade)
  if (inDecade.length === 0) return null
  return inDecade.find((id) => !pageDone(state, id)) ?? (inDecade[inDecade.length - 1] as StickerSetId)
}

/**
 * מה אבא מוציא מהקופסה — the next card out of the red box.
 *
 * The box page is never sold and never in a packet. One card leaves it each time a page
 * of the album is finished, in the order the box happens to be in, which is the order
 * somebody older put it in.
 */
export function nextKept(state: LifeState): StickerDef | null {
  return stickersIn('box').find((sticker) => !hasSticker(state, sticker.id)) ?? null
}

/**
 * מה יוצא מהקופסה כשדף נסגר — one card, or the whole box.
 *
 * There is one card in the box for every page a kiosk sells, so finishing the albums
 * empties it exactly. The last page is the exception: when nothing sellable is left
 * unfinished the box is turned over and whatever is still in it comes out, because an
 * album with a slot that no longer has any way of being filled is a broken promise, and
 * this game has spent a year not making those.
 */
export function keptOnClose(state: LifeState, closing: StickerSetId, extra: Iterable<string>): StickerDef[] {
  const arriving = new Set(extra)
  const done = (set: StickerSetId) =>
    stickersIn(set).every((sticker) => hasSticker(state, sticker.id) || (set === closing && arriving.has(sticker.id)))
  const sellable = SET_ORDER.filter((id) => SETS[id].soldIn !== null)
  const last = sellable.every((id) => done(id))
  const left = stickersIn('box').filter((sticker) => !hasSticker(state, sticker.id))
  if (last) return left
  return left.slice(0, 1)
}

const WEIGHT: Record<StickerRarity, number> = { common: 10, uncommon: 6, rare: 2, kept: 0 }

/**
 * מה יש במעטפה — three stickers, weighted, and never the one that closes the page.
 *
 * A packet leans slightly towards what is missing — 2× on a sticker you do not have —
 * because a real packet does not and a game that does not is unplayable past the tenth
 * one. The lean is small enough that duplicates still happen, which is the entire social
 * mechanic: a duplicate is the only currency you can trade with.
 */
export function openPacket(state: LifeState, set: StickerSetId, at = 0): string[] {
  const pool = stickersIn(set).filter((sticker) => !sticker.neverInPacket && WEIGHT[sticker.rarity] > 0)
  if (pool.length === 0) return []
  const roller = new Roller({ seed: state.rng.seed, cursor: state.rng.cursor + at })
  const out: string[] = []
  for (let i = 0; i < PACKET_SIZE; i += 1) {
    const weights = pool.map(
      (sticker) => WEIGHT[sticker.rarity] * (hasSticker(state, sticker.id) || out.includes(sticker.id) ? 1 : 2),
    )
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    let pick = roller.next() * total
    let chosen = pool[pool.length - 1] as StickerDef
    for (let n = 0; n < pool.length; n += 1) {
      pick -= weights[n] as number
      if (pick <= 0) {
        chosen = pool[n] as StickerDef
        break
      }
    }
    out.push(chosen.id)
  }
  return out
}

// ---------------------------------------------------------------------------------
// ההחלפה — who has the one you are missing.
// ---------------------------------------------------------------------------------

/** the three children in this game who collect, in the order a page would ask them */
export const TRADERS: readonly CharacterId[] = ['ofir', 'amit', 'efi']

/**
 * מי מחזיק אותה — the missing sticker is with whoever you have been worst to.
 *
 * Maor's own line for this feature: *"הקלף שחסר לך תמיד אצל מי שהכי פחות נחמד לך."* It
 * is a joke and it is also the truest thing anybody has said about collecting as a
 * child. Implemented literally: lowest bond holds it, ties broken by the fixed order, so
 * the answer is stable within an afternoon and moves when the friendship does.
 */
export function holderOf(state: LifeState, id: string): CharacterId | null {
  const sticker = stickerFor(id)
  if (!sticker || hasSticker(state, id)) return null
  let worst: CharacterId | null = null
  let lowest = Number.POSITIVE_INFINITY
  for (const who of TRADERS) {
    const bond = relationshipOf(state, who).bond
    if (bond < lowest) {
      lowest = bond
      worst = who
    }
  }
  return worst
}

/** what he wants for it: one of your duplicates, and he will name the one he is short of */
export function tradeAsk(state: LifeState, id: string): StickerDef | null {
  const spare = duplicates(state)
  if (spare.length === 0) return null
  const sticker = stickerFor(id)
  const samePage = spare.filter((one) => one.set === sticker?.set)
  return (samePage[0] ?? spare[0]) as StickerDef
}

/** the sticker to go asking for: the rarest one still missing on the page being collected */
export function missingOn(state: LifeState, set: StickerSetId): StickerDef | null {
  const order: StickerRarity[] = ['rare', 'uncommon', 'common', 'kept']
  const missing = stickersIn(set).filter((sticker) => !hasSticker(state, sticker.id))
  missing.sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity) || a.slot - b.slot)
  return missing[0] ?? null
}
