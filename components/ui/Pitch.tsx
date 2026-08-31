import type { ReactNode } from 'react'

import type { PitchSlot } from '@/lib/game/lineup'

/**
 * The pitch as a paper diagram — ink lines on sheet, no grass, no gradient.
 * "FIFA aesthetics: neon cards, grass" is on the rejected list, and a green field
 * would be the one place this product looked like every other football app.
 *
 * Slots are positioned by percentage, so one component serves every formation.
 */
export function Pitch({
  slots,
  renderSlot,
}: {
  slots: readonly PitchSlot[]
  renderSlot: (slot: PitchSlot) => ReactNode
}) {
  return (
    <div
      className="relative w-full overflow-hidden border-plate border-ink bg-sheet"
      style={{ aspectRatio: '3 / 4' }}
    >
      {/*
        Markings are drawn in SVG rather than positioned divs: an SVG circle is not a
        border-radius (radius 0 holds), and a viewBox needs no physical left/right
        utilities, so the diagram is direction-agnostic by construction.
      */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 133"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <g fill="none" stroke="rgb(var(--ink) / 0.4)" strokeWidth="0.4">
          <line x1="0" y1="66.5" x2="100" y2="66.5" />
          <circle cx="50" cy="66.5" r="14" />
          <rect x="22" y="0" width="56" height="21" />
          <rect x="22" y="112" width="56" height="21" />
          <rect x="34" y="0" width="32" height="9" />
          <rect x="34" y="124" width="32" height="9" />
        </g>
      </svg>

      {/*
        Slots live inside an inset area so a chip centred at x=8% or x=92% cannot hang
        over the touchline. Their x is remapped into that area rather than clamped, so
        the shape of a formation is preserved.
      */}
      <div className="absolute inset-[3%]">
        {slots.map((slot) => (
          <div
            key={slot.slotId}
            className="absolute w-[22%] max-w-[86px] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2"
            style={{ insetInlineStart: `${slot.x}%`, top: `${slot.y}%` }}
          >
            {renderSlot(slot)}
          </div>
        ))}
      </div>
    </div>
  )
}
