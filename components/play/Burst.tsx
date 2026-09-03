'use client'

/**
 * הפיצוץ — the points that fly off a right answer.
 *
 * Pure feedback and entirely disposable: a number that leaps up and fades, plus a
 * vermilion flash across the plate. It is the cheapest possible thing to build and it
 * is most of what separates "a form graded correctly" from "a game you just scored in".
 * Respects `prefers-reduced-motion` — the number still appears, it just stops moving.
 */
export function Burst({ points, combo }: { points: number; combo: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      {/* Printed twice, navy under and vermilion over, misregistered by the house 3px.
          A drop-shadow would have been one line — and a shadow, which this brand does
          not have. The two-plate version is also simply more correct: the dark edge is
          two inks overlapping, not a light source. */}
      <span className="relative animate-burst font-poster text-[86px] leading-none motion-reduce:animate-none">
        <span className="plate-shift absolute inset-0 text-sign">+{points}</span>
        <span className="plate-top relative text-red">+{points}</span>
      </span>
      {combo > 1 && (
        <span className="absolute top-[58%] animate-burst font-poster text-[30px] leading-none text-ink motion-reduce:animate-none">
          ×{combo}
        </span>
      )}
    </div>
  )
}
