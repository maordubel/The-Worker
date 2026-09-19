import type { MessageKey } from '@/lib/i18n'

/**
 * שערי הפועל — the wall is the navigation. Real gate numbers are preserved even when
 * the routes are not sequential. A gate with href:null is a visible closed plate, never
 * a link to a route that does not exist.
 *
 * Gate 9 was reserved as "under refurbishment" on 17.9.2026. It opened as Royal
 * Rumble on 19.9.2026: a seeded, playable historical 5v5 draft.
 */
export type Gate = {
  number: number
  href: string | null
  title: MessageKey
  latin: string
  plate: 'plain' | 'rays' | 'curva' | 'away'
  stain: 'a' | 'b' | 'c'
  /** True only when the route actually reads ?seed=. */
  seeded: boolean
  /** True only for gates that can record a completed play run. */
  playable: boolean
  callHe?: MessageKey
}

/** The curva is full-width and therefore leads the wall layout. */
export function wallOrder(gates: readonly Gate[]): readonly Gate[] {
  const curva = gates.filter((gate) => gate.plate === 'curva')
  return [...curva, ...gates.filter((gate) => gate.plate !== 'curva')]
}

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
    // Keep the existing translation key so older clients remain compatible; the Royal
    // Rumble route carries its own explicit title until the next message-catalog pass.
    title: 'gate.9',
    latin: 'ROYAL RUMBLE · HISTORICAL 5V5',
    plate: 'rays',
    stain: 'b',
    seeded: true,
    playable: true,
  },
  {
    number: 10,
    href: '/tik',
    title: 'gate.10',
    latin: 'MEMBER BOOK · WEST',
    plate: 'plain',
    stain: 'b',
    seeded: false,
    playable: false,
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
    number: 12,
    href: '/archive',
    title: 'gate.12',
    latin: 'THE ARCHIVE WING · NORTH-WEST',
    plate: 'plain',
    stain: 'a',
    seeded: true,
    playable: true,
  },
  {
    number: 13,
    href: '/timeline',
    title: 'gate.13',
    latin: 'TIMELINE · NORTH-WEST',
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

/** The gates that actually lead somewhere. */
export function isOpen(gate: Gate): gate is Gate & { href: string } {
  return gate.href !== null
}

/** The gates a supporter can actually finish a round of. */
export const PLAYABLE_GATES: ReadonlyArray<Gate & { href: string }> = GATES.filter(
  (gate): gate is Gate & { href: string } => gate.playable && isOpen(gate),
)

/** True when this route reads ?seed=. */
export function gateSeeded(href: string): boolean {
  const path = href.split('?')[0] ?? href
  return GATES.find((gate) => gate.href === path)?.seeded ?? false
}
