'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

import { SheetHead } from '@/components/life/Plate'
import { useDialog } from '@/components/ui/useDialog'
import { t, type MessageKey } from '@/lib/i18n'
import type { ActivityKind, MechanicRequest } from '@/lib/life/activities'
import type { ActivityResult } from '@/lib/mechanics/types'

/**
 * המשחק, בתוך החדר — the gate's own board, over a paused room (21.9.2026).
 *
 * Maor: *"השחקן לא ירגיש שהוא יוצא מ־LIFE כדי לשחק Gate."* So nothing navigates. The room
 * stops (`runtime.pause`), this sheet rises over it in the life's own chrome — the sign
 * plate, the host's name, the one sentence of why — and the body is the gate's board with
 * its `embedded` prop: the same deal, the same grade, the same pieces, and none of the
 * site's furniture (no share row, no "again", nothing written to the gate's records). When
 * the board hands its verdict back, the shell settles it (`useLifeLedger.settleActivity`)
 * and the room answers in a person's voice. ✕ is walking away: nothing paid, a third of the
 * time gone, and the person says so too.
 *
 * Each board is loaded when it is opened (`next/dynamic`): a boy who never goes to the
 * café never downloads the locker room.
 */

export type ActivityBoardProps = {
  request: MechanicRequest
  onResult: (result: ActivityResult) => void
}

/** a board, loaded when first opened — never in the bundle of a life that never asks for it */
function lazyBoard(load: () => Promise<{ default: ComponentType<ActivityBoardProps> }>) {
  return dynamic(load, {
    ssr: false,
    loading: () => <p className="mt-6 font-body text-[13px] text-muted">{t('life.act.loading')}</p>,
  })
}

/** the life's wrapper for each mechanic — each deals through `app/life/mechanicActions.ts` and embeds the gate's board */
const BOARDS: Partial<Record<ActivityKind, ComponentType<ActivityBoardProps>>> = {
  goalReconstruction: lazyBoard(() => import('./mechanics/LifeGoal')),
  shirtDesigner: lazyBoard(() => import('./mechanics/LifeKit')),
  memoryChallenge: lazyBoard(() => import('./mechanics/LifeMemory')),
  hateHistory: lazyBoard(() => import('./mechanics/LifeWall')),
  royalRumble: lazyBoard(() => import('./mechanics/LifeRumble')),
  route: lazyBoard(() => import('./mechanics/LifePapers')),
  lineupQuiz: lazyBoard(() => import('./mechanics/LifeLineup')),
  poll: lazyBoard(() => import('./mechanics/LifePoll')),
  allTimeXI: lazyBoard(() => import('./mechanics/LifeXI')),
  archive: lazyBoard(() => import('./mechanics/LifeArchive')),
}

export function MechanicSheet({
  request,
  onDone,
}: {
  request: MechanicRequest
  onDone: (result: ActivityResult) => void
}) {
  const leave = () => onDone({ completed: false, score: 0 })
  const ref = useDialog<HTMLDivElement>(leave)
  const Board = BOARDS[request.kind] ?? null
  const ask = `life.act.${request.activity}.ask` as MessageKey

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={request.titleHe}
      tabIndex={-1}
      dir="rtl"
      className="fixed inset-0 z-[60] flex flex-col bg-paper text-ink outline-none"
      data-life="mechanic"
      data-activity={request.activity}
    >
      <SheetHead title={request.titleHe} kicker={request.hostHe} onClose={leave} closeLabel={t('life.act.leave')} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-gutter pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        <div className="mx-auto w-full max-w-[960px]">
        <p className="mt-3 border-s-rule border-red ps-3 font-body text-[14px] leading-snug text-ink" data-life="mechanic-ask">
          {t(ask, { crowd1: request.crowd[0] ?? '', crowd2: request.crowd[1] ?? request.crowd[0] ?? '' })}
        </p>
        {Board ? (
          <Board request={request} onResult={onDone} />
        ) : (
          <button
            type="button"
            onClick={leave}
            className="mt-6 flex min-h-tap w-full items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink"
          >
            {t('life.act.leave')}
          </button>
        )}
        </div>
      </div>
    </div>
  )
}
