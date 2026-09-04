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

  /**
   * ספטמבר 2026, המסירה השנייה — the frames that answered the prompt pack.
   *
   * Eight of the keys above were REPLACED rather than added, and nothing in this list
   * records that, which is correct: a scene asks for `kitchen` and gets whatever
   * `kitchen.png` currently is. What changed is that `kitchen`, `living`, `kiosk`,
   * `pitch`, `stand`, `ussExt` and `ussHall` stopped being rectangles of a concept board
   * — the kitchen was a 4.3× upscale of a panel and the terrace was an ILLUSTRATED AERIAL
   * of the whole bowl, which is a map and not a place to stand — and `corridor` stopped
   * being a dim interior standing in for a tunnel. All eight are now purpose-drawn frames
   * with an empty floor to walk on.
   *
   * These two are the only genuinely new names. Neither has a scene yet, and that is on
   * purpose (rule 43): the art lands first so the 1983–2000 plan can name a place instead
   * of describing one.
   */
  'undercroft',
  'ussHallPre',

  /**
   * 4.9.2026, המסירה השלישית — the answers to `ART-BRIEF-COMPLETE.md`.
   *
   * `bedroom`, `living` and `reveal` were replaced under their own names (the bedroom
   * had been a 3× upscale of a panel since the first build — the first room of the game
   * and the worst painting in it). The rest are new rooms: the same bedroom and street
   * four years on, and the school the second movement of Stage B opens in.
   */
  'bedroom90',
  'street90',
  'classroom',
  'schoolyard',

  /**
   * אוסישקין — five angles of ONE hall, reconstructed from the weinstocka footage
   * (`USSISHKIN-RECONSTRUCTION-V2`): the red-and-charcoal stand, the cream stand
   * opposite, the end wall with the basket, the high corner, and the floor at a child's
   * eye. The roof, the beams, the window strip and the basket never move between them —
   * that is the rule the package was built on, and it is what makes them one place.
   */
  'ussMain',
  'ussCream',
  'ussEnd',
  'ussHigh',
  'ussLow',
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

  /**
   * ---------------------------------------------------------------------------------
   * המסירה השנייה — forty-nine figures that were names in `PLANNED_FIGURE` yesterday.
   *
   * `PLANNED_FIGURE` existed because forty-six names in this list resolved to files that
   * were sliced locally and never reached the repository, and a name that 404s in front
   * of a player is worse than a name that is written down as missing. `ART-PROMPTS.md`
   * asked for the sheets they needed. They arrived, and the list below is what came back.
   *
   * Four of those names are NOT here and never will be. `soldier-rifle` and `soldier-aim`
   * were poses nobody drew, because the prompt that asked for this sheet said `no weapons
   * in any frame` — this game is about a child growing up in a neighbourhood, and its own
   * brief forbids offering him anything dangerous. `soldier-salute` and `soldier-sit` are
   * gone for the duller reason: the sheet holds standing-to-attention, sitting on a crate
   * and sitting exhausted, and naming a pose that was not drawn is how a name ends up
   * pointing at a file somebody cut to fill the gap.
   */

  // פוגי, שמונה פריימים של הליכה — indexed by `KID_WALK`, never named by a scene
  'pogi-w1', 'pogi-w2', 'pogi-w3', 'pogi-w4',
  'pogi-w5', 'pogi-w6', 'pogi-w7', 'pogi-w8',

  /**
   * פוגי נער — the same boy at thirteen, and the reason he ships before he is needed.
   *
   * Nothing in Stage A walks around as this. He exists so the chapter after 1986 opens on
   * a face the player already knows rather than on a stranger with the protagonist's
   * name, and so the life-line can put eight and thirteen in the same frame.
   */
  'teen', 'teen-3q', 'teen-side', 'teen-back', 'teen-walk', 'teen-pockets', 'teen-cross',
  'teen-sit', 'teen-lean', 'teen-crouch', 'teen-cheer', 'teen-scarf', 'teen-look', 'teen-away',

  /**
   * משה סיני ושלום תקוה — two footballers, each drawn twice.
   *
   * Sinai gets a kit and a second row in a shirt and slacks, because in a life simulation
   * a footballer is not only somebody on a pitch: he is a poster on a wall, a man in a
   * queue, a face on a newspaper page. Tikva gets home red and away white instead, and
   * the last away frame wears the captain's armband — which is the one detail that makes
   * a second kit worth drawing rather than a recolour.
   */
  'sinai', 'sinai-3q', 'sinai-side', 'sinai-back', 'sinai-ball', 'sinai-kick', 'sinai-cheer',
  'sinai-civA', 'sinai-civB', 'sinai-civC', 'sinai-civD', 'sinai-point', 'sinai-civE', 'sinai-civF',
  'tikva', 'tikva-3q', 'tikva-side', 'tikva-back', 'tikva-ball', 'tikva-kick', 'tikva-cheer',
  'tikva-away', 'tikva-away-smile', 'tikva-away-side', 'tikva-away-back',
  'tikva-away-ball', 'tikva-point', 'tikva-captain',

  // פוגי חייל, 1996 — fourteen poses and not one weapon in any of them
  'soldier', 'soldier-stand', 'soldier-side', 'soldier-back',
  'soldier-march', 'soldier-pack', 'soldier-crate',
  'soldier-tired', 'soldier-shout', 'soldier-tie', 'soldier-away',
  'soldier-lean', 'soldier-look', 'soldier-beret',

  /**
   * אופיר בן העשרים — seven poses that REPLACE six plates of a different-looking man.
   *
   * The six `ofir90-*` files that were already here came off an older concept board. The
   * seven below are one sheet of one person, drawn from the 1986 Ofir with the buzz cut he
   * is not allowed to lose. Keeping both would have put two faces under one name, which is
   * the exact failure the Pogi rewrite was for. `ofir90-smoke`, `-crouch`, `-point`,
   * `-sitB` and `-scarf` are still the older man and are the next thing to redraw.
   */
  'ofir90',

  // ---- 4.9.2026 — the third delivery: the sheets ART-BRIEF-COMPLETE.md asked for -------
  // Keren (1986), Efi and the kiosk owner, redrawn in the photoreal style at last: the
  // three chibi cut-outs that stood beside the painted children are gone from the stage.
  'keren-3q', 'keren-side', 'keren-back', 'keren-sit', 'keren-cross', 'keren-point',
  'keren-w1', 'keren-w2', 'keren-w3', 'keren-w4', 'keren-laugh', 'keren-shout', 'keren-hips',
  'efi-3q', 'efi-side', 'efi-back', 'efi-crouch', 'efi-kick', 'efi-arms',
  'efi-w1', 'efi-w2', 'efi-w3', 'efi-w4', 'efi-dribble', 'efi-cheer', 'efi-sulk',
  'oldMan-3q', 'oldMan-side', 'oldMan-back', 'oldMan-lean', 'oldMan-hand', 'oldMan-paper',
  'oldMan-point', 'oldMan-arms', 'oldMan-laugh', 'oldMan-shrug', 'oldMan-coins', 'oldMan-wipe', 'oldMan-stool',
  // Rachel, four years on — the mother of 12.5.1990 and of the derby night.
  'rachel90', 'rachel90-3q', 'rachel90-side', 'rachel90-back', 'rachel90-arms', 'rachel90-hips', 'rachel90-note',
  'rachel90-apron', 'rachel90-point', 'rachel90-watch', 'rachel90-hug', 'rachel90-sit', 'rachel90-door', 'rachel90-call',
  // The school, March 1991.
  'teacher', 'teacher-3q', 'teacher-side', 'teacher-back', 'teacher-arms', 'teacher-note', 'teacher-look',
  'teacher-point', 'teacher-hand', 'teacher-sit', 'teacher-lean', 'teacher-walk', 'teacher-watch', 'teacher-turn',
  'pupil-back1', 'pupil-back2', 'pupil-back3', 'pupil-back4', 'pupil-sideA', 'pupil-sideB', 'pupil-turn', 'pupil-pass',
  // Ussishkin: nameless players in plain red, an usher, a vendor with a tray.
  'hooperRed-ball', 'hooperRed-dribble', 'hooperRed-shoot', 'hooperRed-stretch', 'hooperRed-away', 'hooperRed-bent',
  'usher', 'usher-block', 'usher-up', 'usher-wave',
  'hallVendor', 'hallVendor-hand', 'hallVendor-change', 'hallVendor-shout',
  // The twelve-year-old's eight-frame walk (the eight-year-old's is `KID_WALK`).
  'hero80-w1', 'hero80-w2', 'hero80-w3', 'hero80-w4', 'hero80-w5', 'hero80-w6', 'hero80-w7', 'hero80-w8',
] as const

/**
 * מה שעוד לא הועלה — figures the project has drawn and the repository does not have.
 *
 * **It is empty, and that was always the plan.**
 *
 * `FIGURE` is a promise: every key in it resolves to a real PNG in `public/life/art`, and
 * `tests/life.test.ts` holds the runtime to it. Forty-six names were failing that promise
 * — the whole soldier set, Sinai, Tikva and one Ofir plate — because the sheets were
 * sliced locally and the delta that carried them never reached GitHub. Deleting the names
 * would have lost the record of what exists; leaving them in `FIGURE` would have let a
 * scene ask for a file that 404s in front of a player. So they lived here, still written
 * down, still ordered, and unreachable by `artUrl`.
 *
 * The note ended `The list is expected to shrink to nothing. It is not a design.` On
 * 3.9.2026 it shrank to nothing: the sheets were drawn to `docs/life/ART-PROMPTS.md`, cut
 * by `scripts/life/ingest-2026-09b.py`, and thirty of the names moved up into `FIGURE`.
 * The other sixteen were deleted rather than moved, for the reasons written beside them
 * there — two of them because the pose is a weapon and this game does not draw one.
 *
 * The export stays, and stays empty, because the next delivery will want it again: a name
 * that is written down as missing is a name somebody supplies.
 */
export const PLANNED_FIGURE = [] as const

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
 * שמונה פריימים — the walk, at last.
 *
 * This list held TWO frames for three passes, and the comment that used to sit here was
 * an apology for it: the sheet held two side-on strides, two honest strides read as
 * walking, and borrowing the previous child's eight-frame cycle would have put a
 * different boy's legs under this boy's shirt. It ended by promising that when a proper
 * Pogi walk sheet was drawn this list would grow and nothing else would change.
 *
 * `docs/life/ART-PROMPTS.md` §2.1 asked for the sheet — contact, down, pass, up, twice,
 * arms opposite the legs, a child's walk rather than a march — and it arrived on
 * 3.9.2026. So the list grew, and nothing else changed. `WorldScene` indexes it modulo
 * its own length and was always right; the bob it adds on top is now decoration on a real
 * cycle rather than half the animation.
 */
/**
 * …and then it was looked at in motion, on 3.9.2026, and rolled back the same day.
 *
 * `pogi-w1…w8` is a clean eight-frame walk — of a DIFFERENT BOY. Shorts, white socks, no
 * badge on the shirt, a rounder head: put beside `pogi` and `pogi-side` (jeans, the club
 * badge, the older face) he is visibly not the same child, and the game swapped between
 * the two every time the player started or stopped walking. That is worse than the
 * two-frame stride it replaced, because a walk with two frames looks like a cheap walk,
 * and a walk that changes the boy looks like a bug. So the list is back to the frames
 * that are HIM — standing side-on and mid-stride — until a sheet arrives that matches
 * the turnaround (ART-PROMPTS §2.1 now says so in those words). The eight frames stay
 * sliced and on disk; the day the right sheet lands, this list grows again.
 */
/**
 * 4.9.2026: the eight frames that ARE him. The third delivery drew the walk from
 * `pogi.png` / `pogi-side.png` — dark curls, the badge, long jeans — and the two-frame
 * stand-in retires. The sheet was drawn walking left and was mirrored on ingest, so
 * every side-on frame in the folder faces right and `setFlipX` does the rest.
 */
export const KID_WALK = [
  'pogi-w1', 'pogi-w2', 'pogi-w3', 'pogi-w4',
  'pogi-w5', 'pogi-w6', 'pogi-w7', 'pogi-w8',
] as const

/** the two frames the game walked on for a week — still a valid pose pair */
export const KID_WALK_SHELVED = ['pogi-side', 'pogi-walk'] as const

export const HERO80_WALK = [
  'hero80-w1', 'hero80-w2', 'hero80-w3', 'hero80-w4',
  'hero80-w5', 'hero80-w6', 'hero80-w7', 'hero80-w8',
] as const

export const PROP = [
  /**
   * שבעה שמות שאינם כאן — the seven props this game shipped with, and why they are gone.
   *
   * `propNewspaper`, `propRadio`, `propScarf`, `propHat`, `propTicket`, `propCoffee` and
   * `propBall` were rectangles of a concept board, and every one of them was cut a little
   * wrong: each arrived with a fragment of the neighbouring drawing still in the frame —
   * half a person beside the radio, a red sleeve beside the scarf, a coin where the ticket
   * should be. The worst of them was `propBall`, which was not a ball at all but a
   * 126×100 mis-cut of a CHILD with his arm raised, and it had been standing on the dirt
   * pitch at seven percent of the frame since the scene was written. Nobody had looked at
   * the file; the game only ever drew it 40 pixels tall.
   *
   * The September sheets drew the objects themselves, which is why the ten below replace
   * them one for one where a use existed: `propBallReal` on the pitch and in the minigame,
   * `propScarfRed` in the red box, `propPapers` and `propCoins` and `propSticker` already
   * in `ITEM_ART`. The ticket went further and became the real thing — `docTicket`, the
   * scan of the ticket a person kept for forty years.
   *
   * Their PNGs are still in `public/life/art` and are now referenced by nothing. They can
   * be deleted; leaving them costs 90KB and loses nothing.
   */
  /**
   * הדברים עצמם — supporter goods and street furniture, cut from the September sheets.
   *
   * The red box used to be a list of Hebrew nouns on a card. These are the objects: a
   * striped scarf somebody put round a child's neck, a pennant, a sticker, a matchbox,
   * a stack of newspapers. An object you can look at is a memory; a noun is a receipt.
   */
  'propScarfRed',
  'propPennant',
  /**
   * …and one of the seven came back, re-cut. Stage B is a chapter about a transistor
   * radio, and the board's boombox is the only radio drawn in this project. On 3.9.2026
   * it was cropped at the first empty column past the body, which is where the neighbour
   * began, and it now ends where the radio ends.
   */
  'propRadio',
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
  // 4.9.2026 — the objects of the second movement, and two more for the box.
  'propNote', 'propNoteOpen', 'propBasketball', 'propTicket91', 'propScorePaper',
  'propWrapper', 'propClipping90', 'propCassette', 'propChalk', 'propBagStrap90',
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
  /**
   * פוגי — five plates painted as portraits, not cropped out of a body.
   *
   * Every other name in this list is a bust lifted off a figure sheet, which is why they
   * are soft: the top 30% of a 400-pixel man is a 120-pixel head. `docs/life/ART-PROMPTS.md`
   * §2.3 asked for the protagonist's face to be drawn at portrait size instead, six
   * expressions on a warm cream ground, and five of the six came back usable — the sixth
   * ran off the right edge of the delivered frame and is not faked from a crop.
   *
   * They are also the only files in this project written without a colour table. A plate
   * is 60% flat cream and 15% face; both quantisers spend their budget on the cream and
   * map the lit side of a cheek onto it, which is five portraits with holes punched in
   * them. `scripts/life/ingest-2026-09.py` carries the arithmetic.
   */
  'facePogi',
  'facePogi-smile',
  'facePogi-wide',
  'facePogi-shout',
  'facePogi-down',

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
  // 4.9.2026
  'faceRachel90', 'faceRachel90-smile', 'faceRachel90-worried', 'faceRachel90-nu', 'faceRachel90-angry', 'faceRachel90-side',
  'faceTeacher', 'faceTeacher-glasses', 'faceTeacher-share', 'faceTeacher-tired', 'faceTeacher-smile', 'faceTeacher-angry',
  'faceOldMan-smile', 'faceOldMan-what', 'faceOldMan-story', 'faceOldMan-over', 'faceOldMan-laugh',
] as const

/**
 * עומק — the three planes a purpose-drawn exterior was split into (4.9.2026), aligned
 * pixel-for-pixel to the flat painting under the same key. FAR is opaque; MID and NEAR
 * carry alpha. A room without planes is drawn flat, as before; a room with them scrolls
 * its sky slower than its wall and its lamp post faster, which is the whole of depth.
 */
export const PARALLAX = ['street', 'approach', 'gate7', 'stand'] as const

/**
 * קלוז-אפ — a face filling the glass for one line (`Say.closeUp`). 1080×1350, the
 * place blurred behind the person, painted in the moment's own light. Until the
 * cinematic plates land, each key falls back to the speaker's portrait plate
 * (`CLOSE_UP_FALLBACK`), drawn large — a stand-in, and an honest one.
 */
export const CLOSE_UP = [
  'cuKobiWhere', 'cuKobiTable', 'cuRachelNu', 'cuRachelWatch',
  'cuPogiReveal', 'cuOfir90', 'cuTeacherShare', 'cuUsherNight',
] as const
/** the plates that have actually been painted and ingested — the rest show the portrait */
export const CLOSE_UP_PAINTED: readonly string[] = []
export const CLOSE_UP_FALLBACK: Record<(typeof CLOSE_UP)[number], string> = {
  cuKobiWhere: 'faceKobi',
  cuKobiTable: 'faceKobi',
  cuRachelNu: 'faceRachel90',
  cuRachelWatch: 'faceRachel90',
  cuPogiReveal: 'facePogi-wide',
  cuOfir90: 'faceOfir',
  cuTeacherShare: 'faceTeacher-glasses',
  cuUsherNight: 'faceFan',
}

/**
 * פנורמות — 360° cylindrical, 4096×1024, horizon at 48%. The moments the game turns
 * into the boy's own eyes. Until the painted panoramas land, `make-panoramas.py`
 * builds a stand-in for each from the room's flat painting (mirrored to wrap).
 */
export const PANORAMA = [
  'panoReveal', 'panoTerrace1986', 'panoUssHall', 'panoUssDerby',
  'panoKitchen90', 'panoBedroomMorning90', 'panoGate7', 'panoClassroom',
] as const

/** the tunnel, first person: six tiling textures and two sprites */
export const TUNNEL_TEXTURE = [
  'texTunnelWall', 'texTunnelWallPoster', 'texTunnelFloor', 'texTunnelCeiling', 'texTunnelSteps', 'texTunnelDoor',
] as const
export function parallaxKeys(art: string): { far: string; mid: string; near: string } {
  return { far: `${art}--far`, mid: `${art}--mid`, near: `${art}--near` }
}

export function artUrl(key: string): string {
  return `${ART_ROOT}/${key}.png`
}

/**
 * ההמשך של הציור — the two strips `scripts/life/finish-backdrops.py` writes for every
 * backdrop: the sky continued above it and the ground continued below it.
 *
 * They exist for one reason. A phone held upright is much taller than any room we own,
 * and the only ways to fill it were to crop the room to a slot or to leave black bands.
 * With the strips, the camera can frame a tall slice of the WORLD — sky, room, pavement —
 * and the room itself keeps every coordinate it had: the strips hang off the painting at
 * y < 0 and y > H and nothing in a scene file knows they are there.
 */
export function extensionKeys(art: string): { sky: string; ground: string } {
  return { sky: `${art}--sky`, ground: `${art}--ground` }
}

/** Loading is per scene. Boot warms only what the child is made of. */
export const BOOT_FIGURES: string[] = [...Object.values(KID_POSE), ...KID_WALK]
