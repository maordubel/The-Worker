'use client'

import { useState } from 'react'

import { Mast } from '@/components/ui/LampGrid'
import { t } from '@/lib/i18n'
import type { MemoryCard } from '@/lib/game/memory'
import { PlayLink } from '@/components/play/PlayLink'
import { RecordRun } from '@/components/play/RecordRun'
import { ShareRow } from '@/components/share/ShareRow'
import { artFor } from '@/lib/share/story'

/**
 * Screen 6 — always night. Twelve lamps in a 4×3 grid, tilted -1.5°.
 * Closed = 12% white. Open = white with the value. A completed pair = red.
 */
export function MemoryBoard({
  cards,
  seed,
  cursor = 0,
}: {
  cards: MemoryCard[]
  seed: number
  cursor?: number
}) {
  const [open, setOpen] = useState<string[]>([])
  const [done, setDone] = useState<string[]>([])
  // every flip of a second card is a move — the only number worth boasting about here
  const [moves, setMoves] = useState(0)

  const pairs = cards.length / 2

  function flip(card: MemoryCard) {
    if (done.includes(card.pair) || open.includes(card.id) || open.length === 2) return
    const next = [...open, card.id]
    setOpen(next)
    if (next.length < 2) return
    setMoves((count) => count + 1)

    const [first, second] = next
    const a = cards.find((item) => item.id === first)
    const b = cards.find((item) => item.id === second)
    if (a && b && a.pair === b.pair) {
      setDone((current) => [...current, a.pair])
      setOpen([])
      return
    }
    window.setTimeout(() => setOpen([]), 1100)
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
                  {isOpen ? (
                    <span className="flex flex-col items-center gap-0.5 leading-tight">
                      <span className="font-sign text-[12px]">{card.face}</span>
                      {/* The category is what makes this a memory game rather than a
                          guessing game: it tells the player which four cards can
                          possibly go together. */}
                      <span className="font-body text-[8px] tracking-wide opacity-70">
                        {card.kind}
                      </span>
                    </span>
                  ) : (
                    <span className="font-sign text-[12px] leading-tight">·</span>
                  )}
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

      {done.length === pairs && (
        <>
        <RecordRun gate="/memory" correct={pairs} asked={pairs} />
        <ShareRow
          kind="memory"
          params={{ s: String(seed), r: String(cursor) }}
          headline={String(pairs)}
          card={{
            template: 'ink' as const,
              art: artFor('memory', 0),
            kicker: 'GATE 6 · MEMORY',
            label: t('screen.memory.title'),
            eyebrow: t('memory.pairs'),
            hero: `${pairs}/${pairs}`,
            bigStat: { v: String(moves), k: t('memory.moves') },
            stats: [{ k: t('memory.pairs'), v: String(pairs) }],
            cta: t('share.challenge'),
            challenge: t('share.sameRound'),
          }}
        />
        <PlayLink
          gate="/memory"
          className="mt-3 flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-paper"
        >
          {t('run.again')}
        </PlayLink>
        </>
      )}
    </>
  )
}
