import type { LifeEvent } from '../events'
import type { LifeState, LocationId } from '../types'

/**
 * מרשם הפרקים — the life as a list of chapters, keyed by ids that are never renamed.
 *
 * Until this pass the order of the chapters lived in three places: a `PassageScene` that
 * knew 1986 goes to 1990, a bedroom beat that knew 1990 goes to 1991, and a card at the
 * end of 1991 that said "סוף שלב ב׳" and went nowhere. The Stage B brief (§13) asks for
 * the opposite: a registry keyed by stable ids, transitions driven by data, and no
 * chapter that pretends to be playable when it is not.
 *
 * Two rules, both persisted:
 *
 *  · **The id is a save key.** `chapter.entered` writes it and `redbox.ts` files objects
 *    under it. `1986`, `1990` and `1991` are the ids the game already wrote and they stay
 *    exactly as they are; every chapter after them is `year-unit`, because 1993 holds two
 *    chapters and 2000 holds two, and a calendar year alone cannot name them (§13).
 *  · **`playable` is the truth.** The runtime advances only to a chapter that has rooms
 *    behind it. A chapter declared here and not yet built is skipped by `nextPlayable`,
 *    and the last playable chapter ends on a coda instead of a "coming soon" card — so
 *    the game is always complete up to where it is complete, and never past it.
 */
export type ChapterStage = 'A' | 'B'

export type Bridge = {
  /** the big word on the card — a month, a year, a place */
  titleHe: string
  subHe: string | null
  ms: number
}

export type ChapterDef = {
  id: string
  stage: ChapterStage
  /** the unit in the brief — `A8`, `B3` */
  unit: string
  titleHe: string
  /** what a card would say — never a scoreline */
  dateHe: string
  year: number
  /** 0 = Sunday … 6 = Saturday */
  weekday: number
  /** minutes since midnight the chapter opens on */
  minute: number
  start: { location: LocationId; spawn: string }
  /** the chapter after this one, or null at the end of the life as built */
  next: string | null
  /** the cut INTO this chapter — played by whoever advances to it */
  bridge: Bridge
  /** the anchor resolver key this chapter's history hangs on */
  anchorKey: string
  /** what the HUD calls the chapter's first day when `dateHe` is a span ('1996 – אביב 1997') */
  hudDateHe?: string
  /** events the chapter opens with — pocket money, a thing in a pocket. Never history. */
  entry?: (state: LifeState) => LifeEvent[]
  playable: boolean
}

const MIN = (h: number, m = 0) => h * 60 + m

export const CHAPTERS: readonly ChapterDef[] = [
  /**
   * שלב א׳ — ששת הימים שלפני השבת. Played as data (`chapterStageA.ts`), in the rooms
   * that exist, with the eight-year-old standing in for the smaller boys until their
   * sheets arrive. A day is short and ends on its card, not on a finale: the finale is
   * for the Saturday. `1986` stays the id it always was — a save that finished it keeps
   * its Red Box row.
   */
  {
    id: 'a2-alley',
    stage: 'A',
    unit: 'A2',
    titleHe: 'הסמטה',
    dateHe: 'אביב 1984',
    year: 1984,
    weekday: 2,
    minute: MIN(15, 40),
    start: { location: 'home', spawn: 'start' },
    next: 'a3-hall',
    bridge: { titleHe: '1984', subHe: 'השכונה נהיית משחק', ms: 2600 },
    anchorKey: '1986',
    hudDateHe: 'אביב 1984',
    playable: true,
  },
  {
    id: 'a3-hall',
    stage: 'A',
    unit: 'A3',
    titleHe: 'הבית האדום השני',
    dateHe: 'סתיו 1984',
    year: 1984,
    weekday: 4,
    minute: MIN(17, 0),
    start: { location: 'street', spawn: 'fromHome' },
    next: 'a4-shirt',
    bridge: { titleHe: 'סתיו 1984', subHe: 'אחרי הקיר, ימינה', ms: 2600 },
    anchorKey: '1986',
    hudDateHe: 'סתיו 1984',
    playable: true,
  },
  {
    id: 'a4-shirt',
    stage: 'A',
    unit: 'A4',
    titleHe: 'החולצה',
    dateHe: 'קיץ 1985',
    year: 1985,
    weekday: 0,
    minute: MIN(9, 30),
    start: { location: 'bedroom', spawn: 'start' },
    next: 'a5-first',
    bridge: { titleHe: 'קיץ 1985', subHe: 'פחית עם חריץ', ms: 2600 },
    anchorKey: '1986',
    hudDateHe: 'קיץ 1985',
    playable: true,
  },
  {
    id: 'a5-first',
    stage: 'A',
    unit: 'A5',
    titleHe: 'בחולצה שלך',
    dateHe: '28 בספטמבר 1985',
    year: 1985,
    weekday: 6,
    minute: MIN(13, 0),
    start: { location: 'bedroom', spawn: 'start' },
    next: 'a6-radio',
    bridge: { titleHe: '28.9.1985', subHe: 'שבת', ms: 2600 },
    anchorKey: '1986',
    hudDateHe: '28 בספטמבר 1985',
    playable: true,
  },
  {
    id: 'a6-radio',
    stage: 'A',
    unit: 'A6',
    titleHe: 'אכזבה רגילה',
    dateHe: 'חורף 1985/86',
    year: 1986,
    weekday: 6,
    minute: MIN(14, 0),
    start: { location: 'home', spawn: 'start' },
    next: 'a7-week',
    bridge: { titleHe: 'חורף', subHe: 'גשם על התריס', ms: 2600 },
    anchorKey: '1986',
    hudDateHe: 'חורף 1986',
    playable: true,
  },
  {
    id: 'a7-week',
    stage: 'A',
    unit: 'A7',
    titleHe: 'השבוע שלפני',
    dateHe: '17 במאי 1986',
    year: 1986,
    weekday: 6,
    minute: MIN(16, 0),
    start: { location: 'street', spawn: 'fromHome' },
    next: '1986',
    bridge: { titleHe: 'שבוע לפני', subHe: '17.5.1986', ms: 2600 },
    anchorKey: '1986',
    hudDateHe: '17 במאי 1986',
    playable: true,
  },
  {
    id: '1986',
    stage: 'A',
    unit: 'A8',
    titleHe: 'להגיע לבלומפילד',
    dateHe: '24 במאי 1986',
    year: 1986,
    weekday: 6,
    minute: MIN(12, 35),
    start: { location: 'bedroom', spawn: 'start' },
    next: '1990',
    bridge: { titleHe: '1986', subHe: 'שבת', ms: 2400 },
    anchorKey: '1986',
    playable: true,
  },
  {
    id: '1990',
    stage: 'B',
    unit: 'B1',
    titleHe: 'כמה צריך?',
    dateHe: '12 במאי 1990',
    year: 1990,
    weekday: 6,
    minute: MIN(13, 10),
    start: { location: 'kitchen', spawn: 'start' },
    next: '1991',
    bridge: { titleHe: '1990', subHe: 'ארבע שנים', ms: 2400 },
    anchorKey: '1990',
    playable: true,
  },
  {
    id: '1991',
    stage: 'B',
    unit: 'B2',
    titleHe: 'יש עוד בית',
    dateHe: '11 במרץ 1991',
    year: 1991,
    weekday: 1,
    minute: MIN(8, 10),
    start: { location: 'classroom', spawn: 'start' },
    next: '1993-cup',
    bridge: { titleHe: 'מרץ', subHe: 'אוסישקין', ms: 2400 },
    anchorKey: '1991',
    playable: true,
  },
  {
    id: '1993-cup',
    stage: 'B',
    unit: 'B3',
    titleHe: 'הגביע אדום',
    dateHe: '19 באפריל 1993',
    year: 1993,
    weekday: 1,
    minute: MIN(15, 30),
    start: { location: 'home', spawn: 'start' },
    next: '1993-galil',
    bridge: { titleHe: '1993', subHe: 'שנתיים. הוא כבר לא מבקש רשות.', ms: 3000 },
    anchorKey: '1993-cup',
    entry: () => [{ t: 'money.changed', agorot: 2200, why: 'מה שנשאר מהחודש' }],
    playable: true,
  },
  {
    id: '1993-galil',
    stage: 'B',
    unit: 'B4',
    titleHe: 'הבית נשבר',
    dateHe: '9–19 במאי 1993',
    year: 1993,
    weekday: 0,
    minute: MIN(18, 0),
    start: { location: 'ussishkin-outside', spawn: 'start' },
    next: '1995-sinai',
    bridge: { titleHe: 'שלושה שבועות', subHe: 'הגמר', ms: 2600 },
    anchorKey: '1993-galil',
    hudDateHe: '9 במאי 1993',
    playable: true,
  },
  {
    id: '1995-sinai',
    stage: 'B',
    unit: 'B5',
    titleHe: 'המספר שבע על הקיר',
    dateHe: '1994–1995',
    year: 1994,
    weekday: 2,
    minute: MIN(18, 40),
    start: { location: 'kiosk', spawn: 'start' },
    next: '1996-army',
    bridge: { titleHe: '1994', subHe: 'שנים רעות', ms: 2600 },
    anchorKey: '1994-cup',
    hudDateHe: 'סתיו 1994',
    playable: true,
  },
  {
    id: '1996-army',
    stage: 'B',
    unit: 'B6',
    titleHe: 'אין מקום אחד לעמוד בו',
    dateHe: '1996 – אביב 1997',
    year: 1996,
    weekday: 4,
    minute: MIN(16, 0),
    start: { location: 'street', spawn: 'fromHome' },
    entry: () => [{ t: 'money.changed', agorot: 2500, why: 'הערב האחרון בבית' }],
    next: '1997-basket',
    bridge: { titleHe: '1996', subHe: 'שמונה־עשרה', ms: 2600 },
    anchorKey: '1997-sale',
    hudDateHe: 'נובמבר 1996',
    playable: true,
  },
  {
    id: '1997-basket',
    stage: 'B',
    unit: 'B7',
    titleHe: 'גם האולם יכול לרדת',
    dateHe: '1996/97 – 1997/98',
    year: 1997,
    weekday: 2,
    minute: MIN(19, 0),
    start: { location: 'ussishkin-outside', spawn: 'start' },
    next: '1998-laces',
    bridge: { titleHe: '1997', subHe: 'אוסישקין', ms: 2600 },
    anchorKey: '1997-relegation',
    hudDateHe: 'אביב 1997',
    playable: true,
  },
  {
    id: '1998-laces',
    stage: 'B',
    unit: 'B8',
    titleHe: 'השרוכים',
    dateHe: '2 במאי 1998',
    year: 1998,
    weekday: 6,
    minute: MIN(13, 0),
    start: { location: 'home', spawn: 'start' },
    next: '1999-basket',
    bridge: { titleHe: '2.5.1998', subHe: 'המחזור האחרון', ms: 3000 },
    anchorKey: '1998',
    playable: true,
  },
  {
    id: '1999-basket',
    stage: 'B',
    unit: 'B9',
    titleHe: 'זה לא נגמר כשעולים',
    dateHe: '1998/99',
    year: 1999,
    weekday: 3,
    minute: MIN(18, 30),
    start: { location: 'ussishkin-outside', spawn: 'start' },
    next: '1999-cup',
    bridge: { titleHe: '1999', subHe: 'שוב', ms: 2600 },
    anchorKey: '1999-relegation',
    hudDateHe: 'אביב 1999',
    playable: true,
  },
  {
    id: '1999-cup',
    stage: 'B',
    unit: 'B10',
    titleHe: 'שש־עשרה שנה',
    dateHe: '26 במאי 1999',
    year: 1999,
    weekday: 3,
    minute: MIN(14, 0),
    start: { location: 'home', spawn: 'start' },
    next: '2000-title',
    bridge: { titleHe: '26.5.1999', subHe: 'רמת גן', ms: 3000 },
    anchorKey: '1999-cup',
    playable: true,
  },
  {
    id: '2000-title',
    stage: 'B',
    unit: 'B11a',
    titleHe: 'ארבעה ימים',
    dateHe: '13 במאי 2000',
    year: 2000,
    weekday: 6,
    minute: MIN(14, 30),
    start: { location: 'home', spawn: 'start' },
    next: '2000-double',
    bridge: { titleHe: '2000', subHe: 'שכונת התקווה', ms: 3000 },
    anchorKey: '2000-title',
    playable: true,
  },
  {
    id: '2000-double',
    stage: 'B',
    unit: 'B11b',
    titleHe: 'הדאבל',
    dateHe: '17 במאי 2000',
    year: 2000,
    weekday: 3,
    minute: MIN(15, 0),
    start: { location: 'home', spawn: 'start' },
    next: null,
    bridge: { titleHe: 'ארבעה ימים אחר כך', subHe: 'רמת גן', ms: 3000 },
    anchorKey: '2000-cup',
    playable: true,
  },
]

export const CHAPTER: Record<string, ChapterDef> = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]))

export function chapterFor(id: string): ChapterDef | null {
  return CHAPTER[id] ?? null
}

/** The next chapter that has rooms behind it, or null when the life as built is over. */
export function nextPlayable(id: string): ChapterDef | null {
  let cursor = chapterFor(id)?.next ?? null
  while (cursor) {
    const def = CHAPTER[cursor]
    if (!def) return null
    if (def.playable) return def
    cursor = def.next
  }
  return null
}

/** Every chapter that can be played today, in order. */
export function playableChapters(): readonly ChapterDef[] {
  return CHAPTERS.filter((c) => c.playable)
}

/** The last playable chapter — the one whose ending is the coda of the game as built. */
export function lastPlayable(): ChapterDef {
  const all = playableChapters()
  return all[all.length - 1]!
}
