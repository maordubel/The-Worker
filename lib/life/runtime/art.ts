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
  'kobi-chair',
  'kobi-cheer',
  'kobi-side',
  'kobi-bag',
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

  /**
   * שנות ה-90 — the same three people, fifteen years on.
   *
   * They are on disk alongside their 1980 selves rather than replacing them, because a
   * life simulation that spans decades needs both ages loadable at once: the chapter you
   * are playing and the chapter you are remembering can then sit in the same frame, and
   * the years land on a face instead of in a caption. Nothing in Stage A walks around as
   * one of these yet — the epilogue is where they are first seen.
   */
  'kobi90',
  'kobi90-arms',
  'kobi90-side',
  'kobi90-back',
  'kobi90-stand',
  'kobi90-cheer',
  'kobi90-bag',
  'kobi90-lean',
  'kobi90-sitA',
  'kobi90-point',
  'kobi90-paper',
  'kobi90-sitB',
  'ofir90-arms',
  'ofir90-side',
  'ofir90-back',
  'ofir90-3q',
  'ofir90-smoke',
  'ofir90-walk',
  'ofir90-crouch',
  'ofir90-point',
  'ofir90-sitA',
  'ofir90-sitB',
  'ofir90-scarf',
  'amit90',
  'amit90-3q',
  'amit90-side',
  'amit90-back',
  'amit90-turn',
  'amit90-cheer',
  'amit90-walk',
  'amit90-scarf',
  'amit90-cross',
  'amit90-sitA',
  'amit90-sitB',
  'amit90-point',
  'amit90-drum',

  /**
   * הדמות הראשית, בשלושה גילים — the boy the player is, later.
   *
   * `hero80` is him grown out of this chapter, `hero90` is the young man, and `soldier`
   * is the conscript of the early nineties that the script sends to the army. Stage A
   * never walks around as any of them: they exist so the day you just played can be shown
   * as one point on a life instead of the whole of it, and so the chapters after this one
   * have a face waiting for them rather than a placeholder.
   */
  'hero80',
  'hero80-3q',
  'hero80-side',
  'hero80-back',
  'hero80-pack',
  'hero80-walk',
  'hero80-ball',
  'hero80-kick',
  'hero80-scarf',
  'hero80-cheer',
  'hero80-point',
  'hero80-crouch',
  'hero80-tie',
  'hero80-sit',
  'hero80-away',
  'hero80-leave',
  'hero90',
  'hero90-3q',
  'hero90-side',
  'hero90-back',
  'hero90-pack',
  'hero90-walk',
  'hero90-ball',
  'hero90-kick',
  'hero90-scarf',
  'hero90-cheer',
  'hero90-think',
  'hero90-crouch',
  'hero90-tie',
  'hero90-sit',
  'hero90-away',
  'hero90-leave',

  /**
   * השחקנים — four footballers and the supporter who joins the story in the nineties.
   *
   * Every one of them ships in a kit AND in ordinary clothes, because in a life
   * simulation a footballer is not only somebody on a pitch: he is a poster on a wall, a
   * man in a queue, a face on a newspaper page. `-civ*` is the second life, `-bust*` and
   * `face*` are the plates a conversation can use.
   *
   * `gershon-rival-*` is the centre-half in the other club's kit — the story's whole
   * reason for him. Those five files went through the same de-yellow as everything else
   * (rule 8), so they are amber-and-black rather than yellow-and-black. Nothing in this
   * repo is allowed to be yellow, including the enemy.
   */
  'elimelech-back',
  'elimelech-catch',
  'elimelech-civA',
  'elimelech-civB',
  'elimelech-civC',
  'elimelech-civD',
  'elimelech-civE',
  'elimelech-civF',
  'elimelech-civG',
  'elimelech-claim',
  'elimelech-point',
  'elimelech-ready',
  'elimelech-shout',
  'gershon',
  'gershon-back',
  'gershon-bust',
  'gershon-civA',
  'gershon-civB',
  'gershon-civC',
  'gershon-civD',
  'gershon-civE',
  'gershon-head',
  'gershon-rival',
  'gershon-rival-back',
  'gershon-rival-captain',
  'gershon-rival-look',
  'gershon-rival-shout',
  'gershon-run',
  'gershon-side',
  'keren90',
  'keren90-arms',
  'keren90-band',
  'keren90-look',
  'keren90-scarf',
  'keren90-shout',
  'keren90-side',
  'keren90-sit',
  'keren90-smile',
] as const

/**
 * מה שעוד לא הועלה — figures the project has drawn and the repository does not have.
 *
 * `FIGURE` is a promise: every key in it resolves to a real PNG in `public/life/art`,
 * and `tests/life.test.ts` holds the runtime to it. Forty-seven names were failing that
 * promise — the whole soldier set, Sinai, Tikva and one Ofir plate — because the sheets
 * were sliced locally and the delta that carried them never reached GitHub.
 *
 * Deleting the names would lose the record of what exists; leaving them in `FIGURE`
 * would let a scene ask for a file that 404s in front of a player. So they live here:
 * still written down, still ordered, and unreachable by `artUrl` until the file lands.
 * Moving one back up is a single line, the moment its PNG is uploaded.
 *
 * The list is expected to shrink to nothing. It is not a design.
 */
export const PLANNED_FIGURE = [
  'ofir90',
  'soldier',
  'soldier-rifle',
  'soldier-march',
  'soldier-back',
  'soldier-pack',
  'soldier-side',
  'soldier-aim',
  'soldier-tired',
  'soldier-shout',
  'soldier-salute',
  'soldier-sit',
  'soldier-crate',
  'soldier-tie',
  'soldier-away',
  'sinai',
  'sinai-back',
  'sinai-ball',
  'sinai-bustA',
  'sinai-bustB',
  'sinai-cheer',
  'sinai-civA',
  'sinai-civB',
  'sinai-civC',
  'sinai-civD',
  'sinai-kick',
  'sinai-point',
  'sinai-run',
  'tikva',
  'tikva-away',
  'tikva-away-back',
  'tikva-away-side',
  'tikva-away-smile',
  'tikva-back',
  'tikva-ball',
  'tikva-captain',
  'tikva-civA',
  'tikva-civB',
  'tikva-civC',
  'tikva-civD',
  'tikva-home',
  'tikva-run',
  'tikva-shout',
  'tikva-side',
  'tikva-third',
  'tikva-third-back',
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
  // the player, later — used by the life-line, never by a speaker plate in this chapter
  'faceHero80',
  'faceHero90',
  'faceSoldier',
  'faceElimelech',
  'faceElimelech-ball',
  'faceElimelech-calm',
  'faceElimelech-look',
  'faceElimelech-shout',
  'faceElimelech-side',
  'faceElimelech-smile',
  'faceKeren90',
  'faceKeren90-b',
  'faceKeren90-profile',
  'faceKeren90-side',
  'faceKeren90-smile',
  'faceSinai',
  'faceSinai-b',
  'faceSinai-kit',
  'faceSinai-look',
  'faceSinai-point',
  'faceSinai-shout',
  'faceSinai-side',
] as const

export function artUrl(key: string): string {
  return `${ART_ROOT}/${key}.png`
}

/** Loading is per scene. Boot warms only what the child is made of. */
export const BOOT_FIGURES: string[] = [...Object.values(KID_POSE), ...KID_WALK]
