import type { MessageKey } from '@/lib/i18n'

/**
 * שערי הפועל — the nine gates.
 *
 * The navigation is not a list of game modes. It is Bloomfield's gate plan, and a
 * player picks a mode by walking through a gate. That is the whole idea in Maor's
 * design: "אתה לא בוחר מצב משחק מרשימה. אתה נכנס בשער."
 *
 * The gate numbers are the ground's real ones, which is why they are not 1..9 —
 * there is no gate 3, 9 or 12 in the plan, and inventing one to tidy the grid would
 * be exactly the kind of small lie this project does not tell.
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
  href: string
  /** Hebrew name, Suez One, on the ink foot */
  title: MessageKey
  /** the Latin line under it, Archivo, letterspaced */
  latin: string
  /** which press treatment this plate gets */
  plate: 'plain' | 'rays' | 'curva' | 'away'
  /** which ink blotch, so no two plates print identically */
  stain: 'a' | 'b' | 'c'
  /** gate 5 only — the line on the flag */
  callHe?: MessageKey
}

export const GATES: readonly Gate[] = [
  {
    number: 1,
    href: '/lineup?seed=1',
    title: 'gate.1',
    latin: 'ALL-TIME XI · NORTH STAND',
    plate: 'plain',
    stain: 'a',
  },
  {
    number: 2,
    href: '/trivia?seed=1',
    title: 'gate.2',
    latin: 'TRIVIA · NORTH-EAST',
    plate: 'rays',
    stain: 'b',
  },
  {
    number: 4,
    href: '/kits/build?seed=1',
    title: 'gate.4',
    latin: 'GUESS THE KIT · EAST',
    plate: 'plain',
    stain: 'c',
  },
  {
    number: 5,
    href: '/kits',
    title: 'gate.5',
    latin: 'KIT DESIGNER · SOUTH-EAST · ULTRAS',
    plate: 'curva',
    stain: 'a',
    callHe: 'gate.5.call',
  },
  {
    number: 6,
    href: '/memory?seed=7',
    title: 'gate.6',
    latin: 'MEMORY · SOUTH-EAST',
    plate: 'plain',
    stain: 'b',
  },
  {
    number: 7,
    href: '/kits',
    title: 'gate.7',
    latin: 'ALL-TIME KITS · SOUTH',
    plate: 'plain',
    stain: 'c',
  },
  {
    number: 8,
    href: '/goal?seed=1',
    title: 'gate.8',
    latin: 'REBUILD THE GOAL · SOUTH-WEST',
    plate: 'rays',
    stain: 'a',
  },
  {
    number: 11,
    href: '/derby',
    title: 'gate.11',
    latin: 'THE HATRED GAME · AWAY END',
    plate: 'away',
    stain: 'b',
  },
  {
    number: 13,
    href: '/timeline?seed=1',
    title: 'gate.13',
    latin: 'TIMELINE · NORTH-WEST',
    plate: 'plain',
    stain: 'c',
  },
] as const

/** The gate a route belongs to, so a screen can show which gate you came in by. */
export function gateFor(pathname: string): Gate | undefined {
  return GATES.find((gate) => gate.href.split('?')[0] === pathname)
}
