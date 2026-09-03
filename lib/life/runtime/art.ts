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
  /**
   * ספטמבר 2026 — the purpose-drawn deliveries.
   *
   * Every backdrop above is a RECTANGLE of a concept board. These four arrived as
   * finished frames, drawn to the layout specs in `docs/life/*-spec.png`: an empty
   * street with no painted people in it, the road east with Bloomfield's floodlight
   * pylons over the rooftops, and the ground itself at gate seven. `streetEast` is the
   * same street from further east and is not a location — it is the arrival card the
   * road plays the first time the child leaves his own neighbourhood.
   */
  'streetEast',
] as const
export type BackdropKey = (typeof BACKDROP)[number]

/**
 * Painted furniture separated from its room, so the child can walk BEHIND something.
 * A flat painting can only ever be behind the player; one separated object is the whole
 * difference between a backdrop and a room.
 */
export const LAYER = ['livingTable', 'streetFore', 'streetGround'] as const

/** Cut-out people. */
export const FIGURE = [
  /**
   * פוגי — the protagonist, and the reason this list changed shape.
   *
   * The game shipped with an ILLUSTRATED child standing in painted photographic
   * streets. No grade fixes a mismatch of medium: he read as a sticker on somebody
   * else's photograph, and it was the loudest remaining flaw in the build. Pogi is the
   * same boy the rest of the world is drawn in, at three ages — eight here, then the
   * conscript and the young man, who ship now so the chapters after this one have a
   * face waiting for them rather than a placeholder (rule 43).
   *
   * The walk is TWO frames, not eight. That is what the sheet contains, and two honest
   * side-on strides with a bob read as walking; borrowing the old child's eight-frame
   * cycle would have put a different boy's legs under this boy's shirt.
   */
  'pogi',
  'pogi-3q',
  'pogi-side',
  'pogi-back',
  'pogi-walk',
  'pogi-scarf',
  'pogi-arms',
  'pogi-sit',
  'pogi-cross',
  'pogi-cheer',
  'pogi-kneel',
  'pogi-hold',

  /**
   * השכונה — twenty-eight people who are not the cast.
   *
   * The ambient system had seven `fan*` cut-outs to work with, so a busy street was the
   * same four strangers walking past on a loop — which is the exact opposite of what an
   * ambient system is for. These are fourteen young people and fourteen adults, period
   * dressed, keyed off green: enough that a player never sees the same face twice on
   * one screen, and enough that the road east can fill up without repeating.
   */
  'youngA1', 'youngA2', 'youngA3', 'youngA4', 'youngA5', 'youngA6', 'youngA7',
  'youngB1', 'youngB2', 'youngB3', 'youngB4', 'youngB5', 'youngB6', 'youngB7',
  'adultA1', 'adultA2', 'adultA3', 'adultA4', 'adultA5', 'adultA6', 'adultA7',
  'adultB1', 'adultB2', 'adultB3', 'adultB4', 'adultB5', 'adultB6', 'adultB7',

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
  down: 'pogi',
  downSide: 'pogi-3q',
  side: 'pogi-side',
  up: 'pogi-back',
} as const

/**
 * Two frames, and the scene adds the bob.
 *
 * The sheet holds two side-on strides. A two-frame cycle is a real and old solution —
 * it is what a walking figure reads as when the frames are a full stride apart — and it
 * is honest about what was drawn. What it must NOT be is the previous child's
 * eight-frame cycle under this child's shirt, which is a different person from the
 * knees down. When a proper Pogi walk sheet is drawn, this list grows and nothing else
 * changes.
 */
export const KID_WALK = ['pogi-side', 'pogi-walk'] as const

export const PROP = [
  'propNewspaper',
  'propRadio',
  'propScarf',
  'propHat',
  'propTicket',
  'propCoffee',
  'propBall',
  /**
   * הדברים עצמם — supporter goods and street furniture, cut from the September sheets.
   *
   * The red box used to be a list of Hebrew nouns on a card. These are the objects: a
   * striped scarf somebody put round a child's neck, a pennant, a sticker, a matchbox,
   * a stack of newspapers. An object you can look at is a memory; a noun is a receipt.
   */
  'propScarfRed',
  'propPennant',
  'propFlag',
  'propSticker',
  'propBadges',
  'propMatchbox',
  'propColumn',
  'propBallReal',
  'propPapers',
  'propCoins',
  /**
   * ריהוט הרחוב — the things a street holds rather than the things a hand holds.
   *
   * A backdrop is a photograph of a place with nobody in it. These are the objects that
   * make it somewhere people were this morning: a car left at the kerb, a bin by the
   * kiosk, a coach parked on the road to the ground, pennants strung over the road on
   * the one day of the year they go up. They are placed as scene DRESSING (`LayerDef`),
   * at fractions of the backdrop, so they hold their spot at any framing, and several of
   * them are conditional — the street a player crosses at four o'clock is not the street
   * they crossed at noon, and it should not look like it either.
   */
  'propCar',
  'propBus',
  'propBin',
  'propPlanter',
  'propBunting',
  'propBarrier',
  'propBarriers',
  'propPosters',
  'propBanner',
  'propSign',
] as const
export type PropKey = (typeof PROP)[number]

/**
 * הנייר האמיתי — the documents, which are not art at all.
 *
 * Everything else in this file was DRAWN for the game. These five were printed in 1986:
 * a child's ticket to משחק 15 — הפועל תל-אביב / מכבי חיפה, seven shekels, number 053 —
 * and four pages of מעריב ספורט from the two days either side of it. They are separated
 * from `PROP` because they obey a different rule. A prop can be redrawn; a document
 * cannot, and nothing in this game may put a word in one of them.
 *
 * They exist because rule 11 says the game may not invent a fact, and because the honest
 * way to end Stage A is not to describe what winning felt like. It is to hand the player
 * the front page and let 1986 say it: אדומים.
 */
export const DOC = ['docTicket', 'paperBefore', 'paperAdumim', 'paperFive', 'paperCollector'] as const
export type DocKey = (typeof DOC)[number]

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
