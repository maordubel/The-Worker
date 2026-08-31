import type { ReactNode } from 'react'

/**
 * Numbers inside RTL text.
 *
 * A bare "2:1" in an RTL paragraph is reordered by the bidi algorithm and reads
 * "1:2" — the scoreline is literally reversed on screen. Every number that contains a
 * separator (score, date, ratio, range) must be isolated LTR. `<bdi dir="ltr">` does
 * both: it isolates the run and fixes its direction.
 *
 * Use Score for anything with a colon, Num for plain figures.
 */

export function Num({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={`tabular-nums ${className ?? ''}`}>
      {children}
    </bdi>
  )
}

export function Score({
  home,
  away,
  className,
}: {
  home: number | null
  away: number | null
  className?: string
}) {
  if (home === null || away === null) return null
  return (
    <bdi dir="ltr" className={`tabular-nums ${className ?? ''}`}>
      {home}:{away}
    </bdi>
  )
}

/** Formats a score for a plain string context (page titles, aria-labels). */
export function scoreText(home: number | null, away: number | null): string {
  if (home === null || away === null) return ''
  // U+2066 LRI … U+2069 PDI — isolates the run wherever the string lands.
  return `⁦${home}:${away}⁩`
}
