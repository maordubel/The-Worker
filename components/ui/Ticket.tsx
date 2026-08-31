import type { ReactNode } from 'react'

/**
 * The project's signature surface: a printed programme card.
 * Square corners, ink rule, perforated foot, halftone stock. No shadows anywhere
 * in this system — separation comes from paper tone and rules.
 */
export function Ticket({
  serial,
  title,
  children,
}: {
  serial: string
  title: string
  children?: ReactNode
}) {
  return (
    <article className="border-rule border-ink bg-paper-2">
      <header className="perforated-b flex items-baseline justify-between gap-3 px-4 py-3">
        <h3 className="font-display text-step-2 font-bold">{title}</h3>
        <span
          aria-hidden="true"
          className="font-display text-step--1 tabular-nums text-red"
        >
          {serial}
        </span>
      </header>
      {children ? <div className="px-4 py-3 text-step-0 text-muted">{children}</div> : null}
    </article>
  )
}
