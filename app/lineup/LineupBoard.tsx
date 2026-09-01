'use client'

import { useState, useTransition } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { Num } from '@/components/ui/Num'
import { GK_KIT, NamePlate, PlayerFigure } from '@/components/press/PlayerFigure'
import { Pitch } from '@/components/ui/Pitch'

/** The club's colours. Every outfield figure on this pitch wears them. */
const OUTFIELD = {
  primary: 'rgb(var(--p-red))',
  secondary: 'rgb(var(--p-line))',
  trim: 'rgb(var(--p-line))',
  pattern: 'solid' as const,
  collar: 'crew' as const,
  longSleeve: false,
  shorts: 'rgb(var(--p-line))',
  socks: 'rgb(var(--p-red))',
  ink: 'rgb(var(--p-line))',
}
import { t, type MessageKey } from '@/lib/i18n'
import type { PitchSlot, SlotStatus, LineupVerdict } from '@/lib/game/lineup'
import { submitLineup } from './actions'
import { ShareRow } from '@/components/share/ShareRow'

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
                className={`flex w-full flex-col items-center justify-end transition-transform duration-press ease-stamp active:scale-[.94] motion-reduce:transition-none ${
                  isActive ? 'outline outline-[3px] outline-press-red' : ''
                }`}
              >
                {/* A filled slot is a drawn player in the club's kit; an empty one is a
                    dashed ghost. The pitch reads as a team sheet at a glance instead of
                    as a grid of labelled boxes. */}
                <PlayerFigure
                  kit={name ? (slot.slotId === 'GK' ? GK_KIT : OUTFIELD) : undefined}
                  ghost={!name}
                  number={null}
                  size={54}
                  title={slot.roleHe}
                />
                {verdict && status !== 'empty' && (
                  <span
                    aria-hidden="true"
                    className={`-mt-1 grid h-4 w-4 place-items-center border-hair font-sign text-[10px] leading-none ${STATUS_STYLE[status]}`}
                  >
                    {STATUS_MARK[status]}
                  </span>
                )}
                <NamePlate name={name ?? slot.roleHe} />
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
          <ShareRow
            kind="lineup"
            params={{ s: String(seed) }}
            headline={`${verdict.exact}/${verdict.total}`}
            card={{
              kicker: 'GATE 1 · ALL-TIME XI',
              label: t('screen.lineup.title'),
              eyebrow: t('lineup.exact'),
              hero: `${verdict.exact}/${verdict.total}`,
              stats: [{ k: t('lineup.exact'), v: `${verdict.exact}` }],
              cta: t('share.challenge'),
              challenge: t('share.sameRound'),
            }}
          />
        </>
      )}
    </>
  )
}
