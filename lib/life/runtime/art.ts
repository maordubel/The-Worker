/**
 * הנכסים — the approved concept art, as game assets.
 *
 * Every backdrop and every figure in the game is a rectangle of one of Maor's concept
 * boards, cut by `scripts/life/build-art.py` and written to `public/life/art/`. This
 * file is the only place the game names a file: a scene asks for `ART.bedroom` and a
 * character asks for `FIGURE.kobi`, so re-cutting an asset, or replacing a temporary cut
 * with a final production PNG, is a change to the build script and to nothing else.
 *
 * The art is TEMPORARY in exactly one sense: it is cut from presentation boards rather
 * than drawn as sprites, so a figure has one pose and a room has one camera. It is NOT
 * temporary in look — this IS the approved direction, at the resolution the boards hold.
 */

export const ART_ROOT = '/life/art'

/** Painted rooms and places. The key is the file name. */
export const BACKDROP = [
  'living',
  'bedroom',
  'kitchen',
  'kiosk',
  'street',
  'pitch',
  'approach',
  'gate7',
  'ground',
  'corridor',
  'reveal',
  'stand',
  'ussExt',
  'ussHall',
] as const
export type BackdropKey = (typeof BACKDROP)[number]

/** Cut-out people. Kobi and Rachel are half-figures — see the note in `scenes.ts`. */
export const FIGURE = [
  'kid',
  'ofir',
  'amit',
  'efi',
  'keren',
  'kobi',
  'rachel',
  'fanA',
  'fanB',
  'fanC',
  'fanD',
  'fanE',
  'fanF',
  'fanG',
  'oldMan',
] as const
export type FigureKey = (typeof FIGURE)[number]

export const PROP = [
  'propNewspaper',
  'propRadio',
  'propScarf',
  'propHat',
  'propTicket',
  'propCoffee',
  'propBall',
] as const
export type PropKey = (typeof PROP)[number]

/** Printed portrait plates for the dialogue box — cream ground kept, not cut out. */
export const PORTRAIT_ART = [
  'faceKid',
  'faceOfir',
  'faceAmit',
  'faceEfi',
  'faceKeren',
  'faceKobi',
  'faceRachel',
  'faceFan',
  'faceOldMan',
] as const

export function artUrl(key: string): string {
  return `${ART_ROOT}/${key}.png`
}

/**
 * Loading is per scene, not up front.
 *
 * The whole folder is a little under six megabytes; a bedroom is a hundred and thirty
 * kilobytes. Boot loads the figures the chapter uses and each scene loads its own
 * backdrop, so opening the game costs a room rather than a stadium.
 */
export const BOOT_FIGURES: FigureKey[] = ['kid', 'ofir', 'kobi', 'rachel']
