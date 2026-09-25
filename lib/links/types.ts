/**
 * קישורים בין שערים — the client-safe half (delta 89, 25.9.2026).
 *
 * One player, one match, many gates: the archive holds its card, AWAY DAYS its stop when
 * it was played abroad, gate 8 its goal when the move is sourced, gate 10 its clues. A
 * `CrossLink` is one of those doors, resolved ON THE SERVER by `lib/links/index.ts` only
 * after the target was checked to exist — the screen never builds a link on a guess.
 *
 * Types only: safe to import from any component.
 */

export type CrossLinkKind = 'archive' | 'away' | 'goal'

export type CrossLink = {
  kind: CrossLinkKind
  /** a same-site path — `/archive?at=m_…`, `/away-days?visit=m_…`, `/goal?g=…` */
  href: string
  /** what the door opens on, already in Hebrew ("צ'לסי 2001", "ערן זהבי") — null = the kind alone */
  subject: string | null
  /** the id the link points at, for the measurement layer (`cross_link_click`) */
  target: string
}

export const CROSS_LINK_KINDS: readonly CrossLinkKind[] = ['archive', 'away', 'goal']
