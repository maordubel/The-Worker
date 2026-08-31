'use client'

import { useState, useTransition } from 'react'

import { Stamp } from '@/components/ui/Stamp'
import { t } from '@/lib/i18n'
import type { TimelineCard, TimelineVerdict } from '@/lib/game/timeline'
import { submitOrder } from './actions'

/**
 * Ordering by move-up / move-down rather than drag: dragging is not keyboard
 * operable, and every interaction in this product has to be.
 */
export function TimelineBoard({ cards, seed }: { cards: TimelineCard[]; seed: number }) {
  const [order, setOrder] = useState(cards)
  const [verdict, setVerdict] = useState<TimelineVerdict | null>(null)
  const [pending, startTransition] = useTransition()

  function move(index: number, direction: -1 | 1) {
    if (verdict) return
    const target = index + direction
    if (target < 0 || target >= order.length) return
    setOrder((current) => {
      const next = [...current]
      const a = next[index] as TimelineCard
      const b = next[target] as TimelineCard
      next[index] = b
      next[target] = a
      return next
    })
  }

  function submit() {
    startTransition(async () => {
      setVerdict(await submitOrder(seed, order.map((card) => card.id)))
    })
  }

  return (
    <>
      <p className="mt-stack font-body text-step-0 text-muted">{t('timeline.note')}</p>

      <ol className="mt-stack border-t-rule border-ink">
        {order.map((card, index) => (
          <li key={card.id} className="flex items-center gap-3 border-b-hair border-ink/30 py-3">
            <span className="font-mono text-step-1 tabular-nums text-red">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="flex-1">
              <span className="block font-sign text-step-1 leading-tight text-ink">
                {card.title}
              </span>
              <span className="mt-1 block truncate font-mono text-[10px] tabular-nums text-sign">
                <bdi>{card.hint}</bdi>
              </span>
            </span>
            <span className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                aria-label={`${t('timeline.up')} ${index + 1}`}
                className="grid min-h-tap w-10 place-items-center border-rule border-ink font-sign text-ink"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                aria-label={`${t('timeline.down')} ${index + 1}`}
                className="grid min-h-tap w-10 place-items-center border-rule border-ink font-sign text-ink"
              >
                ▼
              </button>
            </span>
          </li>
        ))}
      </ol>

      {!verdict && (
        <button
          type="button"
          onClick={submit}
          className="mt-stack flex min-h-tap w-full items-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
        >
          {pending ? t('state.loading') : t('timeline.submit')}
        </button>
      )}

      {verdict && (
        <>
          <div className="mt-stack flex items-center gap-3">
            <Stamp
              label={verdict.correct ? 'verified' : 'rejected'}
              ring={false}
              size={56}
              animate
            />
            <p className="font-body text-step-0 text-ink">
              {verdict.correct ? t('trivia.correct') : t('trivia.wrong')}
            </p>
          </div>
          <ol className="mt-stack border-t-rule border-ink">
            {verdict.solution.map((item, index) => (
              <li
                key={item.id}
                className="flex items-baseline gap-3 border-b-hair border-ink/30 py-2.5"
              >
                <span className="font-mono text-step--1 tabular-nums text-red">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 font-body text-step-0 text-ink">{item.title}</span>
                <span className="font-mono text-step--1 tabular-nums text-muted">
                  <bdi>{item.on}</bdi>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  )
}
