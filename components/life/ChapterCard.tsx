'use client'

import { Grain, Leak, Letterbox, YearRoll } from '@/components/life/FilmFx'
import { artUrl } from '@/lib/life/runtime/art'

/**
 * כרטיס פרק — a documentary cut naming the years that just passed over a real place.
 *
 * The graded key painting of the chapter about to start pushes in slowly under two black
 * bars and film grain; the year rolls from the life the player just left to the one they
 * are entering. The cut now says the GAP too. That small line matters in a forty-year life:
 * 2002 → 2006 should feel like four years happened, not like the next mission loaded.
 *
 * This remains intentionally state-light. Personal consequences are already carried by
 * the life and surface in the room/dialogue that follows; the chapter card's job is the
 * documentary seam — time, place, chapter — without inventing history or a second story
 * system inside a transition component.
 */
export function ChapterCard({
  titleHe,
  subHe,
  nameHe,
  art,
  fromYear,
}: {
  titleHe: string
  subHe: string | null
  nameHe?: string
  art: string
  fromYear?: number | null
}) {
  const year = /^\d{4}$/.test(titleHe) ? Number(titleHe) : null
  const elapsed = year !== null && fromYear !== null && fromYear !== undefined ? Math.max(0, year - fromYear) : 0
  const elapsedHe =
    elapsed <= 0 ? null : elapsed === 1 ? 'שנה עברה' : elapsed === 2 ? 'שנתיים עברו' : `${elapsed} שנים עברו`

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden bg-ink" data-life="chapter-card">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center motion-reduce:animate-none"
        style={{ backgroundImage: `url(${artUrl(art)})`, animation: 'plate-push 3600ms ease-out both' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgb(var(--ink) / .92) 0%, rgb(var(--ink) / .35) 45%, rgb(var(--ink) / .15) 100%)' }}
      />
      <Leak index={((Math.abs(year ?? 1) % 3) + 1) as 1 | 2 | 3} />
      <Grain opacity={0.22} />
      <Letterbox />

      <div className="absolute inset-x-0 bottom-[22%] flex flex-col items-center px-gutter text-center">
        {elapsedHe && (
          <p className="mb-2 animate-title-sub font-body text-[12px] leading-none text-sheet/65" data-life="chapter-elapsed">
            <bdi>{elapsedHe}</bdi>
          </p>
        )}
        <p className="animate-title-rise font-poster text-[72px] leading-none text-sheet sm:text-[96px]" style={{ textShadow: '0 2px 24px rgb(var(--ink) / .9)' }}>
          {year !== null ? <YearRoll from={fromYear ?? null} to={year} /> : <bdi>{titleHe}</bdi>}
        </p>
        <span className="mt-3 block h-[3px] w-16 origin-center animate-rule-draw bg-red" aria-hidden="true" />
        {nameHe && (
          <p className="mt-3 animate-title-sub font-display text-[20px] leading-tight text-sheet">
            <bdi>{nameHe}</bdi>
          </p>
        )}
        {subHe && (
          <p className="mt-2 animate-title-sub font-sign text-[13px] leading-snug text-sheet/75">
            <bdi>{subHe}</bdi>
          </p>
        )}
      </div>
    </div>
  )
}
