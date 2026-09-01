/**
 * מערכת השכבות — a shirt is not a picture, it is a magazine of eight layers.
 *
 * Straight off the Kit Builder handoff. The same stack produces אתא 1978, the red-black
 * stripes of 1989, the 1992 sash and whatever a player invents this afternoon; the
 * renderer takes one JSON object and returns SVG, with no image files anywhere. That
 * matters for two reasons beyond weight: an SVG shirt can be recoloured per season
 * without a new asset, and the archive can state which LAYER a season got wrong, which
 * is what makes "rebuild the 1989 shirt" a gradeable game instead of a vibe check.
 *
 * The order is fixed and the z-index is the order of this file:
 *   1 base · 2 pattern · 3 sleeves · 4 collar · 5 crest · 6 maker · 7 sponsor · 8 nameset
 */

export type KitColour = 'red' | 'cream' | 'ink' | 'paper' | 'navy' | 'deep'

/** The palette, as CSS custom properties, so the tokens stay the single source. */
export const COLOUR_VAR: Record<KitColour, string> = {
  red: 'rgb(var(--red))',
  cream: 'rgb(var(--sheet))',
  ink: 'rgb(var(--ink))',
  paper: 'rgb(var(--paper))',
  navy: 'rgb(var(--sign))',
  /** a darker red for tonal work — the one value with no shell token, since it exists
   *  only inside the shirt */
  deep: '#B81C14',
}

export const COLOUR_NAME: Record<KitColour, string> = {
  red: 'אדום',
  cream: 'שמנת',
  ink: 'שחור',
  paper: 'לבן',
  navy: 'נייבי',
  deep: 'אדום כהה',
}

export type PatternId =
  | 'solid'
  | 'stripe-wide'
  | 'pinstripe'
  | 'hoop-tonal'
  | 'jacquard'
  | 'chevron'
  | 'grid-tonal'
  | 'sash'
  | 'yoke-v'
  | 'gradient'
  | 'side-panel'
  | 'halves'

export const PATTERNS: { id: PatternId; he: string; latin: string }[] = [
  { id: 'solid', he: 'חלק', latin: 'SOLID · 1978' },
  { id: 'stripe-wide', he: 'פסים רחבים', latin: 'STRIPE-WIDE · 1989' },
  { id: 'pinstripe', he: 'פסי שיער', latin: 'PINSTRIPE · 1989 A' },
  { id: 'hoop-tonal', he: 'חישוקים', latin: 'HOOP-TONAL · 2007' },
  { id: 'jacquard', he: 'מעוינים', latin: 'JACQUARD · 1991' },
  { id: 'chevron', he: 'זיגזג', latin: 'CHEVRON · 1991 A' },
  { id: 'grid-tonal', he: 'רשת טונלית', latin: 'GRID-TONAL · 1991' },
  { id: 'sash', he: 'סאש', latin: 'SASH · 1992' },
  { id: 'yoke-v', he: 'וי כתפיים', latin: 'YOKE-V · 1988 A' },
  { id: 'gradient', he: 'מעבר', latin: 'GRADIENT' },
  { id: 'side-panel', he: 'פאנלים צדדיים', latin: 'SIDE-PANEL · 2007 A' },
  { id: 'halves', he: 'חצאים', latin: 'HALVES' },
]

export type CollarId = 'crew' | 'ringer' | 'v-neck' | 'polo' | 'laced'

export const COLLARS: { id: CollarId; he: string }[] = [
  { id: 'crew', he: 'עגול' },
  { id: 'ringer', he: 'רינגר' },
  { id: 'v-neck', he: 'וי' },
  { id: 'polo', he: 'פולו' },
  { id: 'laced', he: 'שרוכים' },
]

export type SleeveId = 'plain' | 'raglan' | 'cuff' | 'shoulder-stripe' | 'arc'

export const SLEEVES: { id: SleeveId; he: string }[] = [
  { id: 'plain', he: 'אחיד' },
  { id: 'raglan', he: 'רגלן ניגודי' },
  { id: 'cuff', he: 'חפת' },
  { id: 'shoulder-stripe', he: 'פסי כתף' },
  { id: 'arc', he: 'קשת' },
]

export type NamesetId = 'block-solid' | 'block-hollow' | 'condensed'

export const NAMESETS: { id: NamesetId; he: string }[] = [
  { id: 'block-solid', he: 'מלא' },
  { id: 'block-hollow', he: 'חלול' },
  { id: 'condensed', he: 'קונדנסד' },
]

export type KitSpec = {
  seasonLabel: string
  variant: 'home' | 'away'
  base: KitColour
  pattern: PatternId
  /** the second ink the pattern is drawn in */
  patternInk: KitColour
  sleeves: SleeveId
  sleeveInk: KitColour
  collar: CollarId
  collarInk: KitColour
  /** lettered on the chest — the archive knows these per season */
  sponsorHe: string | null
  makerHe: string | null
  nameset: NamesetId
  number: number | null
}

export const DEFAULT_SPEC: KitSpec = {
  seasonLabel: '1989/90',
  variant: 'home',
  base: 'red',
  pattern: 'solid',
  patternInk: 'ink',
  sleeves: 'plain',
  sleeveInk: 'cream',
  collar: 'crew',
  collarInk: 'ink',
  sponsorHe: null,
  makerHe: null,
  nameset: 'block-solid',
  number: 10,
}

/** The eight layers, in order, for the rebuild game's scorecard. */
export const LAYERS = [
  { key: 'base', he: 'גוף' },
  { key: 'pattern', he: 'גזרה' },
  { key: 'sleeves', he: 'שרוולים' },
  { key: 'collar', he: 'צווארון' },
  { key: 'crest', he: 'סמל' },
  { key: 'maker', he: 'יצרן' },
  { key: 'sponsor', he: 'ספונסר' },
  { key: 'nameset', he: 'ערכת מספרים' },
] as const

export type LayerKey = (typeof LAYERS)[number]['key']

/** How many of the eight layers two specs agree on — the rebuild game's whole score. */
export function compareSpecs(a: KitSpec, b: KitSpec): Record<LayerKey, boolean> {
  return {
    base: a.base === b.base,
    pattern: a.pattern === b.pattern,
    sleeves: a.sleeves === b.sleeves,
    collar: a.collar === b.collar,
    crest: true,
    maker: a.makerHe === b.makerHe,
    sponsor: a.sponsorHe === b.sponsorHe,
    nameset: a.nameset === b.nameset,
  }
}
