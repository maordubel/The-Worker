'use client'

import { useState, useTransition } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { Num } from '@/components/ui/Num'
import { Pitch } from '@/components/ui/Pitch'
import { t, type MessageKey } from '@/lib/i18n'
import type { PitchSlot, SlotStatus, LineupVerdict } from '@/lib/game/lineup'
import { submitLineup } from './actions'

/**
 * Tap a slot, pick from the bank, submit. Feedback is per slot in three states.
 *
 * The states never rely on colour: each carries a mark and a word as well, because a
 * red/green pair is unreadable for a large share of players — and yellow, the usual
 * third state, is forbidden outright in this system.
 */

const STATUS_MARK: Record<SlotStatus, string> = {
  exact: '✓',
  wrong_slot: '↔',
  not_in_xi: '✗',
  empty: '',
}

const STATUS_LABEL: Record<SlotStatus, MessageKey | null> = {
  exact: 'lineup.exact',
  wrong_slot: 'lineup.wrongSlot',
  not_in_xi: 'lineup.notInXi',
  empty: null,
}

const STATUS_STYLE: Record<SlotStatus, string> = {
  exact: 'border-red bg-red text-sheet',
  wrong_slot: 'border-red bg-sheet text-red',
  not_in_xi: 'border-ink bg-sheet text-ink line-through',
  empty: 'border-ink bg-sheet text-ink',
}

export function LineupBoard({
  slots,
  bank,
  seed,
  graded,
  formationName,
}: {
  slots: PitchSlot[]
  bank: string[]
  seed: number
  /** false when no verified XI exists — the board is then a free build */
  graded: boolean
  formationName: string
}) {
  const [picks, setPicks] = useState<Record<string, string | null>>({})
  const [active, setActive] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<LineupVerdict | null>(null)
  const [pending, startTransition] = useTransition()

  const filled = Object.values(picks).filter(Boolean).length
  const used = new Set(Object.values(picks).filter(Boolean) as string[])
  const statusOf = (slotId: string): SlotStatus =>
    verdict?.slots.find((slot) => slot.slotId === slotId)?.status ?? 'empty'

  function choose(name: string) {
    if (active === null || verdict) return
    setPicks((current) => {
      const next: Record<string, string | null> = { ...current }
      for (const [slot, value] of Object.entries(next)) if (value === name) next[slot] = null
      next[active] = name
      return next
    })
    setActive(null)
  }

  function submit() {
    startTransition(async () => setVerdict(await submitLineup(seed, picks)))
  }

  return (
    <>
      {!graded && !verdict && (
        <EmptyState title={t('empty.lineup')} body={t('empty.lineup.body')} />
      )}

      <div className="mt-stack flex items-baseline justify-between">
        <p className="font-mono text-step--1 text-muted">
          <Num>{formationName}</Num>
        </p>
        <p className="font-mono text-step-1 text-ink">
          <Num>
            {String(filled).padStart(2, '0')}/{slots.length}
          </Num>
        </p>
      </div>

      <div className="mt-3">
        <Pitch
          slots={slots}
          renderSlot={(slot) => {
            const name = picks[slot.slotId] ?? null
            const status = statusOf(slot.slotId)
            const isActive = active === slot.slotId
            return (
              <button
                type="button"
                onClick={() => setActive(isActive ? null : slot.slotId)}
                aria-pressed={isActive}
                aria-label={`${slot.roleHe}${name ? ` — ${name}` : ''}`}
                className={`flex min-h-tap w-full flex-col items-center justify-center border-rule px-1 py-1 text-center transition-transform duration-press ease-stamp active:scale-[.94] motion-reduce:transition-none ${
                  verdict ? STATUS_STYLE[status] : 'border-ink bg-sheet text-ink'
                } ${isActive ? 'outline outline-[3px] outline-red' : ''}`}
              >
                {verdict && status !== 'empty' && (
                  <span aria-hidden="true" className="font-sign text-[13px] leading-none">
                    {STATUS_MARK[status]}
                  </span>
                )}
                <span className="mt-0.5 block w-full truncate font-sign text-[11px] leading-tight">
                  {name ?? slot.roleHe}
                </span>
              </button>
            )
          }}
        />
      </div>

      {!verdict && (
        <>
          <h2 className="mt-stack font-body text-[11px] font-extrabold tracking-widest text-muted">
            {active ? t('lineup.pickFor') : t('lineup.tapSlot')}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {bank.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  disabled={active === null}
                  onClick={() => choose(name)}
                  className={`min-h-tap border-rule px-3 font-body text-[13px] transition-transform duration-press ease-stamp active:scale-[.96] disabled:opacity-40 motion-reduce:transition-none ${
                    used.has(name) ? 'border-red text-red' : 'border-ink text-ink'
                  }`}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="mt-stack flex min-h-tap w-full items-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
          >
            {pending ? t('state.loading') : t('lineup.submit')}
          </button>
        </>
      )}

      {verdict && (
        <>
          <p className="mt-stack font-display text-step-3 text-ink">
            <Num>
              {verdict.exact}/{verdict.total}
            </Num>{' '}
            {t('lineup.exact')}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {(['exact', 'wrong_slot', 'not_in_xi'] as const).map((status) => (
              <li
                key={status}
                className={`flex min-h-[32px] items-center gap-2 border-rule px-2 font-body text-[12px] ${STATUS_STYLE[status]}`}
              >
                <span aria-hidden="true" className="font-sign">
                  {STATUS_MARK[status]}
                </span>
                {t(STATUS_LABEL[status] as MessageKey)}
              </li>
            ))}
          </ul>
          <p className="mt-stack font-mono text-[11px] text-sign">
            <bdi>{verdict.sourceTitle}</bdi>
          </p>
        </>
      )}
    </>
  )
}
