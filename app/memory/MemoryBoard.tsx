'use client'

import { useState } from 'react'

import { Mast } from '@/components/ui/LampGrid'
import { t } from '@/lib/i18n'
import type { MemoryCard } from '@/lib/game/memory'

/**
 * Screen 6 — always night. Twelve lamps in a 4×3 grid, tilted -1.5°.
 * Closed = 12% white. Open = white with the value. A completed pair = red.
 */
export function MemoryBoard({ cards }: { cards: MemoryCard[] }) {
  const [open, setOpen] = useState<string[]>([])
  const [done, setDone] = useState<string[]>([])

  const pairs = cards.length / 2

  function flip(card: MemoryCard) {
    if (done.includes(card.pair) || open.includes(card.id) || open.length === 2) return
    const next = [...open, card.id]
    setOpen(next)
    if (next.length < 2) return

    const [first, second] = next
    const a = cards.find((item) => item.id === first)
    const b = cards.find((item) => item.id === second)
    if (a && b && a.pair === b.pair) {
      setDone((current) => [...current, a.pair])
      setOpen([])
      return
    }
    window.setTimeout(() => setOpen([]), 700)
  }

  return (
    <>
      <div className="mt-stack flex justify-center">
        <div className="w-full max-w-[420px]">
          <div
            className="grid grid-cols-4 gap-2 border-plate border-sheet p-2"
            style={{ transform: 'rotate(-1.5deg)' }}
          >
            {cards.map((card) => {
              const isDone = done.includes(card.pair)
              const isOpen = isDone || open.includes(card.id)
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => flip(card)}
                  aria-pressed={isOpen}
                  aria-label={isOpen ? card.face : t('memory.closed')}
                  className={`grid min-h-tap place-items-center border-hair p-1 text-center transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                    isDone
                      ? 'border-red bg-red text-sheet'
                      : isOpen
                        ? 'border-sheet bg-sheet text-ink'
                        : 'border-sheet/45 bg-sheet/[.12] text-sheet/0'
                  }`}
                >
                  <span className="font-sign text-[12px] leading-tight">
                    {isOpen ? card.face : '·'}
                  </span>
                </button>
              )
            })}
          </div>
          <Mast height={56} night />
        </div>
      </div>

      <p className="mt-stack text-center font-mono text-step-0 tabular-nums text-sheet">
        <bdi>
          {done.length} / {pairs}
        </bdi>{' '}
        {t('memory.pairs')}
      </p>
    </>
  )
}
