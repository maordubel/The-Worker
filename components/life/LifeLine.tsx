'use client'

import { artUrl } from '@/lib/life/runtime/art'
import { t } from '@/lib/i18n'

/**
 * קו החיים — the same person, four times, in one row.
 *
 * This is the thing the whole architecture is for, and it is worth showing before any of
 * it is playable. A Saturday in 1986 is not a level; it is the first entry in a life that
 * runs through a bedroom, a terrace, a uniform and a man, and the cheapest honest way to
 * say so is to stand the four of him side by side and let the player do the arithmetic.
 *
 * Two rules keep it honest. The age you have actually played is lit and named `כאן אתה
 * עכשיו`; every later age is dimmed, captioned `פרק שעוד ייכתב`, and claims nothing about
 * what happens in it. And nothing here carries a year — the captions are ages, not dates,
 * because the archive has no 1990s match on file and a caption is not the place to invent
 * one.
 */

/**
 * Three ages, not four, and all three are PoGi.
 *
 * The row used to mix him with two other figures and one — `soldier` — that had no file
 * on disk at all, so the strip rendered a broken image between a boy and a stranger. It
 * is the same person now: eight, the conscript, the young man. The fourth slot comes
 * back the day a teenage Pogi is drawn, and not before: a life-line whose point is "this
 * is you, later" cannot contain somebody else.
 */
const AGES = [
  { art: 'pogi', labelKey: 'life.line.age1' },
  { art: 'pogiIDF-1', labelKey: 'life.line.age3' },
  { art: 'pogi90-1', labelKey: 'life.line.age4' },
] as const

export function LifeLine({ reached = 0 }: { reached?: number }) {
  return (
    <section className="border-hair border-concrete/40 bg-ink" data-life="lifeline">
      <header className="flex items-baseline justify-between gap-3 border-b-hair border-concrete/30 px-3 py-2">
        <h3 className="font-display text-[13px] leading-none text-sheet">
          <bdi>{t('life.line.title')}</bdi>
        </h3>
        <p className="truncate font-body text-[10px] leading-none text-concrete">
          <bdi>{t('life.line.lead')}</bdi>
        </p>
      </header>

      <ol className="grid grid-cols-3 gap-px bg-concrete/25">
        {AGES.map((age, index) => {
          const here = index === reached
          const later = index > reached
          return (
            <li key={age.art} className="relative bg-ink">
              <div className="flex h-[124px] items-end justify-center overflow-hidden px-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artUrl(age.art)}
                  alt=""
                  aria-hidden="true"
                  className={`max-h-full w-auto object-contain transition-opacity duration-stamp motion-reduce:transition-none ${
                    later ? 'opacity-25 grayscale' : 'opacity-100'
                  }`}
                />
              </div>
              {here && (
                <span
                  className="absolute inset-x-0 bottom-0 h-[3px] bg-red"
                  aria-hidden="true"
                />
              )}
              <p
                className={`border-t-hair border-concrete/30 px-1 py-1.5 text-center font-body text-[10px] leading-none ${
                  here ? 'text-sheet' : 'text-concrete/70'
                }`}
              >
                <bdi>{t(age.labelKey)}</bdi>
              </p>
            </li>
          )
        })}
      </ol>

      <p className="px-3 py-2 text-center font-body text-[10px] leading-none text-concrete/80">
        <bdi>{t(reached === AGES.length - 1 ? 'life.line.now' : 'life.line.soon')}</bdi>
      </p>
    </section>
  )
}
