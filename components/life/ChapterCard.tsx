'use client'

import { Grain, Leak, Letterbox, YearRoll } from '@/components/life/FilmFx'
import { artUrl } from '@/lib/life/runtime/art'

/**
 * כרטיס פרק — a film naming its time over a picture.
 *
 * The graded key painting of the chapter about to start pushes in slowly under two
 * black bars and a jitter of grain; a light leak sweeps once; the year rolls from the one
 * the player just left to the one they are entering, digit by digit; a red rule draws
 * itself; the chapter's name arrives a beat later in the sign face. Two and a half
 * seconds, and then the room. It replaces the word-over-black `TitleCard` for chapter
 * cuts only — a room's name plate stays a plate.
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
