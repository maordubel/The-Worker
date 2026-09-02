/**
 * הנכסים — the approved concept art, as game assets.
 *
 * Every backdrop and every person in the game is a rectangle of one of Maor's boards,
 * cut by `scripts/life/build-art.py` (paintings, props, portraits) and
 * `scripts/life/slice-sheets.py` (character sheets, sliced automatically on the gaps
 * between figures). This file is the only place the game names a file: a scene asks for
 * a key, so re-cutting an asset — or dropping in a final production painting — is a
 * change to the manifest and to nothing else.
 */

export const ART_ROOT = '/life/art'

/** Painted rooms and places. */
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

/**
 * Painted furniture separated from its room, so the child can walk BEHIND something.
 * A flat painting can only ever be behind the player; one separated object is the whole
 * difference between a backdrop and a room.
 */
export const LAYER = ['livingTable'] as const

/** Cut-out people. */
export const FIGURE = [
  'kid',
  'ofir',
  'amit',
  'efi',
  'keren',
  'kobi',
  'rachel',
  'rachel-tray',
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

/**
 * The child's own frames — a turnaround and an eight-frame walk, from the green-screen
 * sheet. Everybody else has one pose; the player has an animation, because the player is
 * the thing you look at for fifteen minutes.
 */
export const KID_POSE = {
  down: 'kid',
  downSide: 'kid-3q',
  side: 'kid-side',
  up: 'kid-back',
} as const

export const KID_WALK = [
  'kid-walk2',
  'kid-walk3',
  'kid-walk4',
  'kid-walk5',
  'kid-walk6',
  'kid-walk7',
  'kid-walk8',
] as const

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

/** Loading is per scene. Boot warms only what the child is made of. */
export const BOOT_FIGURES: string[] = [...Object.values(KID_POSE), ...KID_WALK]
