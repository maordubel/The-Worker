'use client'

import type { Enemy } from '@/lib/game/hate-run'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * שטר האויב — one enemy, printed as a wanted bill.
 *
 * The bill is the whole game. A name in a list is an administrative record; a name
 * screen-printed at 40px over a halftone with the charge under it and a fact stamped
 * across the foot is an accusation, and an accusation is something you can have a
 * feeling about. Every plate carries a real charge from a real source — the terrace's
 * anger is old and specific, and specificity is what makes it land.
 *
 * `state` drives the press: `live` waits to be picked, `won` takes the vermilion
 * over-print, `out` is cancelled with a stamp and drained of colour.
 */
export function EnemyPlate({
  enemy,
  state = 'live',
  onPick,
  compact = false,
  dense = false,
}: {
  enemy: Enemy
  state?: 'live' | 'won' | 'out'
  onPick?: () => void
  compact?: boolean
  /**
   * The run variant. Two full plates plus the arena furniture came to ~950px on a
   * 390×844 phone, which means the second name is below the fold — and a head to head
   * you have to scroll to see is not a head to head. `dense` keeps every element,
   * including the charge, and only takes the air out.
   */
  dense?: boolean
}) {
  const out = state === 'out'
  const won = state === 'won'
  const category = `hate.cat.${enemy.category}` as MessageKey
  const sport = `hate.sport.${enemy.sport}` as MessageKey

  return (
    <button
      type="button"
      disabled={state !== 'live' || !onPick}
      onClick={onPick}
      aria-label={`${t('hate.tap')} ${enemy.nameHe}`}
      className={`group relative block min-h-tap w-full overflow-hidden border-rule text-start transition-all duration-press ease-stamp motion-reduce:transition-none ${
        out
          ? 'border-ink/30 bg-paper opacity-45 grayscale'
          : won
            ? 'border-ink bg-red'
            : 'border-ink bg-sheet active:scale-[.985]'
      }`}
    >
      <div aria-hidden="true" className="screen-dots pointer-events-none absolute inset-0" />

      <div
        className={`relative flex items-baseline justify-between gap-2 border-b-hair border-ink bg-ink px-3 py-1.5 text-paper`}
      >
        <span className="font-display text-[12px] leading-none">{t(category)}</span>
        <span className="font-latin text-[8px] font-bold tracking-[0.18em] text-concrete" dir="ltr">
          {enemy.latin}
        </span>
      </div>

      <div className={`relative ${dense ? 'px-2.5 pb-2.5 pt-2' : 'px-3 pb-3 pt-2.5'}`}>
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className={`font-poster leading-[0.82] ${compact ? 'text-[30px]' : dense ? 'text-[31px] sm:text-[40px]' : 'text-[38px] sm:text-[46px]'} ${
              won ? 'text-paper' : 'text-ink'
            }`}
          >
            {enemy.nameHe}
          </h3>
          <span
            className={`shrink-0 font-body text-[10px] tracking-wide ${
              won ? 'text-paper/80' : 'text-muted'
            }`}
          >
            {t(sport)}
          </span>
        </div>

        <p
          className={`mt-0.5 font-mono text-[10.5px] tabular-nums ${
            won ? 'text-paper/75' : 'text-muted'
          }`}
        >
          <bdi>{enemy.eraHe}</bdi>
        </p>

        {!compact && (
          <p
            className={`max-w-[46ch] font-body leading-snug ${
              dense ? 'mt-1.5 text-[12px]' : 'mt-2 text-step--1 leading-relaxed'
            } ${
              won ? 'text-paper' : 'text-ink'
            }`}
          >
            {enemy.chargeHe}
          </p>
        )}

        <div
          className={`inline-block border-hair px-2 py-1 font-body font-extrabold ${
            dense ? 'mt-1.5 text-[10px]' : 'mt-2.5 text-[10.5px]'
          } ${
            won ? 'border-paper/50 text-paper' : 'border-red text-red'
          }`}
        >
          {enemy.keyFactHe}
        </div>
      </div>

      {out && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="rotate-[-9deg] border-[3px] border-ink/70 px-4 py-1 font-poster text-[30px] leading-none text-ink/70">
            {t('hate.out')}
          </span>
        </span>
      )}
    </button>
  )
}
