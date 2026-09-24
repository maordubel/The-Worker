import type { MessageKey } from '@/lib/i18n'

/**
 * שערי הפועל — the nine gates.
 *
 * The navigation is not a list of game modes. It is Bloomfield's gate plan, and a
 * player picks a mode by walking through a gate. That is the whole idea in Maor's
 * design: "אתה לא בוחר מצב משחק מרשימה. אתה נכנס בשער."
 *
 * The gate numbers are the ground's real ones, which is why they do not run 1..13.
 * Inventing one to tidy the grid would be exactly the kind of small lie this project
 * does not tell — and so is hanging a plate over a route that does not exist.
 *
 * **Gate 12 opened on 17.9.2026** as `/archive`, the archive wing, once the corpus
 * behind it existed: 1,385 press columns, every one with a full ISO date, beside the
 * 3,068 dated matches the archive already held.
 *
 * **Gate 9 is on the wall and is not a door.** Maor: *"תפתח גם את שער 9 ותרשום
 * 'בשיפוצים' ונחליט בהמשך למה הוא יהיה."* So it is a plate with no `href` at all —
 * `href: null` rather than a route that 404s, which is the case this file has always
 * argued about gate 7: a gate that points at nothing is worse than a gap. The type
 * forces every consumer to decide what to do with a gate that goes nowhere, which is
 * the point of writing it as `null` instead of an empty string.
 *
 * Gate 7 is the polls wing, which is what Maor replaced the crest game with. It stood
 * empty on the wall for one delta rather than pointing at a route that did not exist —
 * a gate that goes nowhere is worse than a gap, and these numbers are the ground's own
 * anyway, so they were never going to run 1..13.
 *
 * Two gates are special and the rest follow one template:
 *   · **Gate 5** is the ultras' gate. It gets the full bill — rays, the flag, the
 *     marching ranks — because on a real fence that is the poster that got printed
 *     big. Every other gate gets a small plate.
 *   · **Gate 11** is the away end. It carries NO vermilion at all: navy only, no
 *     flag, no rays. Whoever walks in sees somebody else's poster, which is the
 *     point of the game behind it.
 */

export type Gate = {
  /** the ground's own number — not an index */
  number: number
  /**
   * Where the plate goes — or `null` for a gate the ground has and the app does not.
   *
   * A null href is NOT a link: `GatePlate` draws it as a closed plate that says what it
   * is, and every list that walks the gates (the sitemap, the personal area, the help
   * sheet) has to answer for it rather than quietly linking to a 404.
   */
  href: string | null
  /** Hebrew name, Suez One, on the ink foot */
  title: MessageKey
  /** the Latin line under it, Archivo, letterspaced */
  latin: string
  /** which press treatment this plate gets */
  plate: 'plain' | 'rays' | 'curva' | 'away'
  /** which ink blotch, so no two plates print identically */
  stain: 'a' | 'b' | 'c'
  /**
   * האם השער מחלק סבב — does the route behind this plate READ `?seed=`?
   *
   * Six of them do. The other five are wings and a personal area: `/xi` is free play
   * over the whole roster, `/kits` is a collection, `/polls` is a ballot, `/tik` is
   * your own card, and `/trivia` is the TOPIC PICKER — the seeded route is
   * `/trivia/<topic>`, one deck each, which is why the picker itself must not carry one.
   *
   * Until 17.9.2026 the wall and the personal area stapled `?seed=…&r=…` onto all
   * eleven. Four of those parameters were read by nobody, and the fifth — `/trivia` —
   * pointed at a phantom deck that the plate advanced on every click and no round ever
   * consulted. A parameter a page ignores is a small lie in a URL people read
   * (rule 19), and a deck nothing deals from is a counter that only ever lies.
   */
  seeded: boolean
  /**
   * האם משחקים בו — gate 10 is the personal area, and you cannot finish a round of it.
   *
   * It is on the wall because it is a place in the ground, not because it is a game. It
   * is excluded from "how many gates have you been through", which otherwise printed a
   * denominator nobody could ever reach.
   */
  playable: boolean
  /** gate 5 only — the line on the flag */
  callHe?: MessageKey
  /**
   * בקרוב — a closed plate that is ANNOUNCED rather than under refurbishment. Drawn with
   * the "בקרוב" band instead of "בשיפוצים". Only meaningful with `href: null`.
   */
  soon?: true
}

/**
 * סדר הקיר — the order the plates are hung in, which is not the same thing as the gate
 * numbers. The curva is full-width, so anywhere but the head of the wall it wraps and
 * leaves a hole in the row above it. Hanging it first fills the grid exactly at two and
 * three columns AND puts the ultras' gate at the top of the ground, which is where it
 * belongs. The numbers themselves are untouched — they are Bloomfield's.
 */
export function wallOrder(gates: readonly Gate[]): readonly Gate[] {
  const curva = gates.filter((gate) => gate.plate === 'curva')
  return [...curva, ...gates.filter((gate) => gate.plate !== 'curva')]
}

/**
 * **A gate's href carries no seed.** Every one of these used to end in `?seed=1`
 * (`?seed=7` for the memory board), which meant the wall itself was the thing pinning
 * the app to one round per gate: the plate handed the route a constant, the route read
 * the constant, and every player in the world got the same deal for ever. The round is
 * now decided by the device's own place in that gate's deck (`components/play/PlayLink.tsx`),
 * or minted fresh on the server when there is no device to ask.
 */
export const GATES: readonly Gate[] = [
  {
    number: 1,
    href: '/xi',
    title: 'gate.1',
    latin: 'ALL-TIME XI · NORTH STAND',
    plate: 'plain',
    stain: 'a',
    seeded: false,
    playable: true,
  },
  {
    number: 2,
    href: '/trivia',
    title: 'gate.2',
    latin: 'TRIVIA WING · NORTH-EAST',
    plate: 'rays',
    stain: 'b',
    seeded: false,
    playable: true,
  },
  {
    number: 3,
    href: '/lineup',
    title: 'gate.3',
    latin: 'THE LINE-UP · NORTH',
    plate: 'plain',
    stain: 'c',
    seeded: true,
    playable: true,
  },
  {
    number: 4,
    href: '/kits/build',
    title: 'gate.4',
    latin: 'GUESS THE KIT · EAST',
    plate: 'plain',
    stain: 'c',
    seeded: true,
    playable: true,
  },
  {
    number: 5,
    href: '/kits',
    title: 'gate.5',
    latin: 'KIT DESIGNER · SOUTH-EAST · ULTRAS',
    plate: 'curva',
    stain: 'a',
    seeded: false,
    playable: true,
    callHe: 'gate.5.call',
  },
  {
    number: 6,
    href: '/memory',
    title: 'gate.6',
    latin: 'MEMORY · SOUTH-EAST',
    plate: 'plain',
    stain: 'b',
    seeded: true,
    playable: true,
  },
  {
    number: 7,
    href: '/polls',
    title: 'gate.7',
    latin: 'THE BALLOT · SOUTH',
    plate: 'plain',
    stain: 'a',
    seeded: false,
    playable: true,
  },
  {
    number: 8,
    href: '/goal',
    title: 'gate.8',
    latin: 'REBUILD THE GOAL · SOUTH-WEST',
    plate: 'rays',
    stain: 'a',
    seeded: true,
    playable: true,
  },
  {
    number: 9,
    href: '/royal-rumble',
    title: 'gate.9',
    latin: 'ROYAL RUMBLE · HISTORICAL 5V5',
    plate: 'rays',
    stain: 'b',
    seeded: true,
    playable: true,
  },
  {
    /**
     * שער 10 — פרה עיוורת (owner decision, 23.9.2026): a new game, announced and not yet
     * open. The member book that stood here (`/tik`) is NOT gone — it is the personal
     * area, reached from the tab bar as "המנוי שלי", which is where Maor wants it. So the
     * plate is a `null` href with `soon`, and nothing on the wall links to a route the
     * gate no longer owns.
     */
    number: 10,
    href: null,
    title: 'gate.10',
    latin: 'BLIND COW · WEST',
    plate: 'plain',
    stain: 'b',
    seeded: false,
    playable: false,
    soon: true,
  },
  {
    number: 11,
    href: '/derby',
    title: 'gate.11',
    latin: 'THE HATRED GAME · AWAY END',
    plate: 'away',
    stain: 'b',
    seeded: true,
    playable: true,
  },
  {
    /** שער 12 — אגף הארכיון: היום לפני, הידעת, ומה שהארכיון באמת מחזיק. */
    number: 12,
    href: '/archive',
    title: 'gate.12',
    latin: 'THE ARCHIVE WING · NORTH-WEST',
    plate: 'plain',
    stain: 'a',
    // It reads `?seed=` and `?r=`: the deal rotates, so the wing hands out something
    // different on every entry and the same two numbers reproduce it (rule 24).
    seeded: true,
    playable: true,
  },
  {
    /**
     * שער 13 — החוט האדום (owner decision, 21.9.2026): a route between two moments of the
     * club's history, every stop a real edge of the Entity Graph. The chronology game that
     * stood here is the gate's second mode, `/timeline/order`, one tab away.
     */
    number: 13,
    href: '/timeline',
    title: 'gate.13.thread',
    latin: 'THE RED THREAD · NORTH-WEST',
    plate: 'plain',
    stain: 'c',
    seeded: true,
    playable: true,
  },
] as const

/** The gate a route belongs to, so a screen can show which gate you came in by. */
export function gateFor(pathname: string): Gate | undefined {
  return GATES.find((gate) => gate.href !== null && gate.href.split('?')[0] === pathname)
}

/** The gates that actually lead somewhere — everything but a plate under refurbishment. */
export function isOpen(gate: Gate): gate is Gate & { href: string } {
  return gate.href !== null
}

/** The gates a supporter can actually finish a round of — everything but the personal area. */
export const PLAYABLE_GATES: ReadonlyArray<Gate & { href: string }> = GATES.filter(
  (gate): gate is Gate & { href: string } => gate.playable && isOpen(gate),
)

/** True when this route reads `?seed=`, so nothing staples one onto a route that does not. */
export function gateSeeded(href: string): boolean {
  const path = href.split('?')[0] ?? href
  return GATES.find((gate) => gate.href === path)?.seeded ?? false
}
