'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'

import { Num } from '@/components/ui/Num'
import { haptic } from '@/lib/play/haptics'
import { pendingRevenge, readMarks, seen as seenIds } from '@/lib/profile/marks'
import { advanceRotation, rotationFor } from '@/lib/profile/store'
import { syncMarks } from '@/lib/portal/marks-sync'
import { mintSeed, withRound } from '@/lib/rotation/deck'
import { revengeSplit } from '@/lib/game/trivia-report'
import { Q_TOPICS, TOPIC_SPECS, type QTopic, type Topic } from '@/lib/game/topics'
import { t, type MessageKey } from '@/lib/i18n'
import { planPersonal } from './actions'

/**
 * Quick Pick — the lobby of gate 2 (prototype v5).
 *
 * The default path is one tap: הכול מהכול is already selected and יאללה is under the
 * thumb. Everything else is optional and one tap each — a topic, an era, Hard, Practice,
 * תפתיע אותי, Revenge — and the ticket at the bottom says, in words, exactly what the
 * next twelve will be.
 *
 * What changed from the prototype, and why:
 *  · **Era chips come from the data**, with their counts, and a chip that cannot fill a
 *    run is shown disabled rather than dealt short.
 *  · **Revenge is honest.** When fewer than twelve questions are waiting, the ticket says
 *    "5 נקמות + 7 קשות" — the prototype topped up in silence (brief §13).
 *  · **A seeded run is a link.** הכול מהכול, a topic, an era and Hard are dealt on the
 *    server from the device's deck (`lib/rotation`), so the URL is the round. Revenge and
 *    Surprise are built from THIS device's ledger, so they become a `?q=` link of twelve
 *    ids — just as shareable, and the ledger itself never leaves the device except as ids.
 */

type Mode = 'mix' | 'surprise' | 'revenge'

export type EraChip = { decade: number; count: number }

const NEED = 12

export function QuickPick({
  counts,
  eras,
  initial,
}: {
  counts: Record<Topic, number>
  eras: Record<Topic, EraChip[]>
  /** a suggestion carried from the Match Report (`?pick=`) */
  initial?: { mode?: Mode; hard?: boolean }
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initial?.mode ?? 'mix')
  const [topic, setTopic] = useState<QTopic | null>(null)
  const [decade, setDecade] = useState<number | null>(null)
  const [hard, setHard] = useState(initial?.hard ?? false)
  const [practice, setPractice] = useState(false)
  const [pending, setPending] = useState(0)
  const [busy, startBusy] = useTransition()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setPending(pendingRevenge(readMarks()).length)
    // the account's ledger, when there is one — silent when there is not
    void syncMarks().then((state) => {
      if (state === 'synced') setPending(pendingRevenge(readMarks()).length)
    })
  }, [])

  const topicSlug: Topic = topic ?? 'general'
  const chips = eras[topicSlug] ?? []
  const depth = counts[topicSlug] ?? 0
  const split = revengeSplit(pending, NEED)
  const canStart = mode === 'revenge' ? pending > 0 : mode === 'surprise' ? true : depth >= NEED

  const ticket = useMemo(() => {
    const bits: string[] = [t('trivia.lobby.ticket.base')]
    if (decade !== null) bits.unshift(t('trivia.lobby.era', { decade: eraLabel(decade) }))
    if (hard && mode === 'mix') bits.push(t('trivia.mode.hard'))
    if (practice) bits.push(t('trivia.mode.practice'))
    return bits.join(' · ')
  }, [decade, hard, practice, mode])

  const title =
    mode === 'revenge'
      ? split.filler > 0
        ? t('trivia.lobby.revengeSplit', { n: String(split.revenge), m: String(split.filler) })
        : t('trivia.mode.revenge')
      : mode === 'surprise'
        ? t('trivia.mode.surprise')
        : topic
          ? t(`trivia.lobby.topic.${topic}` as MessageKey)
          : t('trivia.lobby.all')

  function choose(next: Mode) {
    haptic('tap')
    setMode(next)
    setFailed(false)
    if (next !== 'mix') {
      setTopic(null)
      setDecade(null)
    }
  }

  function pickTopic(next: QTopic) {
    haptic('tap')
    setMode('mix')
    setTopic(topic === next ? null : next)
    setDecade(null)
  }

  function start() {
    if (!canStart || busy) return
    haptic('lock')
    const extras = (href: string) => {
      const params = new URLSearchParams()
      if (practice) params.set('practice', '1')
      const query = params.toString()
      return query ? `${href}${href.includes('?') ? '&' : '?'}${query}` : href
    }
    if (mode === 'mix') {
      const gate = `/trivia/${topicSlug}`
      const rotation = rotationFor(gate, mintSeed)
      advanceRotation(gate, mintSeed)
      const params = new URLSearchParams()
      if (decade !== null) params.set('era', String(decade))
      if (hard) params.set('hard', '1')
      const base = params.toString() ? `${gate}?${params.toString()}` : gate
      router.push(extras(withRound(base, rotation.seed, rotation.cursor)))
      return
    }
    startBusy(async () => {
      const marks = readMarks()
      const seed = mintSeed()
      try {
        const plan = await planPersonal(mode, { wrong: pendingRevenge(marks), seen: seenIds(marks) }, seed)
        if (plan.ids.length < NEED) {
          setFailed(true)
          return
        }
        const params = new URLSearchParams({ q: plan.ids.join('.'), mode, seed: String(seed) })
        if (mode === 'revenge') params.set('rv', String(plan.revenge ?? 0))
        router.push(extras(`/trivia/general?${params.toString()}`))
      } catch {
        setFailed(true)
      }
    })
  }

  return (
    <div className="mt-stack border-rule border-ink bg-sheet">
      <div className="border-b-rule border-ink bg-ink px-4 py-4 text-paper">
        <p className="font-latin text-[10px] font-bold tracking-[0.28em] text-red" dir="ltr">
          GATE 02 · QUICK PICK
        </p>
        <h2 className="mt-1 font-display text-step-3 leading-tight">{t('trivia.lobby.title')}</h2>
        <p className="mt-1 font-body text-step--1 leading-relaxed text-concrete">{t('trivia.lobby.lede')}</p>
      </div>

      <div className="grid gap-4 px-3 py-4 sm:px-4">
        <div className="grid grid-cols-2 gap-2">
          <BigChoice
            active={mode === 'mix' && topic === null}
            mark="∞"
            title={t('trivia.lobby.all')}
            sub={t('trivia.lobby.all.sub')}
            onClick={() => {
              choose('mix')
              setTopic(null)
            }}
          />
          <BigChoice
            active={mode === 'surprise'}
            mark="?"
            title={t('trivia.mode.surprise')}
            sub={t('trivia.lobby.surprise.sub')}
            onClick={() => choose('surprise')}
          />
        </div>

        <section aria-labelledby="qp-topics">
          <p id="qp-topics" className="mb-1.5 font-body text-[12px] font-bold text-muted">
            {t('trivia.lobby.pickTopic')}
          </p>
          <ul className="grid grid-cols-4 gap-1.5 min-[480px]:grid-cols-7">
            {Q_TOPICS.map((slug) => {
              const count = counts[slug] ?? 0
              const thin = count < NEED
              const active = mode === 'mix' && topic === slug
              return (
                <li key={slug}>
                  <button
                    type="button"
                    onClick={() => pickTopic(slug)}
                    disabled={thin}
                    aria-pressed={active}
                    className={`flex min-h-[64px] w-full flex-col items-center justify-center gap-0.5 border-rule px-1 py-1.5 transition-transform duration-press active:scale-[.96] disabled:opacity-40 motion-reduce:transition-none ${
                      active ? 'border-red bg-red text-sheet' : 'border-ink bg-paper text-ink'
                    }`}
                  >
                    <span aria-hidden="true" className="font-poster text-[18px] leading-none">
                      {TOPIC_SPECS[slug].mark}
                    </span>
                    <span className="font-body text-[12px] font-bold leading-tight">
                      {t(`trivia.lobby.topic.${slug}` as MessageKey)}
                    </span>
                    <span className={`font-mono text-[11px] tabular-nums ${active ? 'text-sheet' : 'text-muted'}`}>
                      <Num>{count}</Num>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="qp-eras">
          <p id="qp-eras" className="mb-1.5 font-body text-[12px] font-bold text-muted">
            {t('trivia.lobby.pickEra')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={decade === null} onClick={() => setDecade(null)} disabled={mode !== 'mix'}>
              {t('trivia.lobby.allEras')}
            </Chip>
            {chips.map((chip) => (
              <Chip
                key={chip.decade}
                active={decade === chip.decade}
                disabled={mode !== 'mix' || chip.count < NEED}
                onClick={() => {
                  haptic('tap')
                  setMode('mix')
                  setDecade(decade === chip.decade ? null : chip.decade)
                }}
                label={t('trivia.lobby.eraChip', { decade: eraLabel(chip.decade), n: String(chip.count) })}
              >
                <bdi dir="ltr">{chip.decade}s</bdi>
                <span className="ms-1 font-mono text-[10px] tabular-nums opacity-70">
                  <Num>{chip.count}</Num>
                </span>
              </Chip>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 border-rule border-ink bg-paper px-3 py-2.5">
          <p className="font-body text-step--1 font-bold text-ink" aria-live="polite">
            {pending > 0 ? t('trivia.lobby.revengeWaiting', { n: String(pending) }) : t('trivia.lobby.revengeNone')}
          </p>
          <button
            type="button"
            onClick={() => choose('revenge')}
            disabled={pending === 0}
            aria-pressed={mode === 'revenge'}
            className={`min-h-tap border-rule px-3 font-body text-step--1 font-extrabold transition-transform duration-press active:scale-[.96] disabled:opacity-40 motion-reduce:transition-none ${
              mode === 'revenge' ? 'border-red bg-red text-sheet' : 'border-ink bg-sheet text-ink'
            }`}
          >
            {t('trivia.lobby.revengeGo')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Toggle
            on={practice}
            onClick={() => {
              haptic('tap')
              setPractice(!practice)
            }}
          >
            {t('trivia.lobby.practice')}
          </Toggle>
          <Toggle
            on={hard && mode === 'mix'}
            disabled={mode !== 'mix'}
            onClick={() => {
              haptic('tap')
              setHard(!hard)
            }}
          >
            {t('trivia.lobby.hard')}
          </Toggle>
        </div>
      </div>

      <div className="sticky bottom-[calc(var(--tap)+1.25rem+env(safe-area-inset-bottom))] z-10 flex items-center gap-3 border-t-rule border-ink bg-ink px-3 py-3 text-paper sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-step-1 leading-tight">{title}</p>
          <p className="truncate font-body text-[12px] text-concrete">{ticket}</p>
          {failed && <p className="font-body text-[12px] text-red">{t('trivia.lobby.failed')}</p>}
        </div>
        <button
          type="button"
          onClick={start}
          disabled={!canStart || busy}
          className="min-h-tap shrink-0 bg-red px-6 font-display text-step-2 text-sheet transition-transform duration-press ease-stamp active:scale-[.95] disabled:opacity-50 motion-reduce:transition-none"
        >
          {busy ? t('trivia.lobby.building') : t('trivia.lobby.go')}
        </button>
      </div>
    </div>
  )
}

export function eraLabel(decade: number): string {
  return decade >= 2000 ? `${decade}` : `${String(decade).slice(2)}'`
}

function BigChoice({
  active,
  mark,
  title,
  sub,
  onClick,
}: {
  active: boolean
  mark: string
  title: string
  sub: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-[92px] flex-col items-start justify-between gap-1 border-rule px-3 py-2.5 text-start transition-transform duration-press active:scale-[.97] motion-reduce:transition-none ${
        active ? 'border-red bg-red text-sheet' : 'border-ink bg-paper text-ink'
      }`}
    >
      <span aria-hidden="true" className="font-poster text-[30px] leading-none">
        {mark}
      </span>
      <span className="font-display text-step-1 leading-none">{title}</span>
      <span className={`font-body text-[12px] leading-snug ${active ? 'text-sheet' : 'text-muted'}`}>{sub}</span>
    </button>
  )
}

function Chip({
  active,
  disabled = false,
  onClick,
  label,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  label?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      className={`min-h-[40px] border-rule px-2.5 font-body text-[13px] font-bold transition-transform duration-press active:scale-[.96] disabled:opacity-35 motion-reduce:transition-none ${
        active ? 'border-red bg-red text-sheet' : 'border-ink bg-sheet text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function Toggle({
  on,
  disabled = false,
  onClick,
  children,
}: {
  on: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`flex min-h-tap items-center justify-center gap-2 border-rule px-3 font-body text-step--1 font-extrabold transition-transform duration-press active:scale-[.97] disabled:opacity-40 motion-reduce:transition-none ${
        on ? 'border-ink bg-ink text-paper' : 'border-ink bg-sheet text-ink'
      }`}
    >
      <span aria-hidden="true" className="font-sign">
        {on ? '✓' : '○'}
      </span>
      {children}
    </button>
  )
}
