'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Burst } from '@/components/play/Burst'
import { HUD } from '@/components/play/HUD'
import { KitStrip } from '@/components/kit/KitStrip'
import { Num } from '@/components/ui/Num'
import { Punch } from '@/components/play/Punch'
import { ShareRow } from '@/components/share/ShareRow'
import { StageCard } from '@/components/play/StageCard'
import { Confetti } from '@/components/play/Confetti'
import {
  NEW_SESSION,
  RUN_LENGTH,
  advance,
  endReason,
  isStageBreak,
  pointsFor,
  rankFor,
  secondsFor,
  stageOf,
  type Session,
} from '@/lib/game/session'
import { PATTERNS } from '@/lib/kit/spec'
import { t, type MessageKey } from '@/lib/i18n'
import type { KitBuildLayer, KitBuildQuestion, KitBuildVerdict } from '@/lib/game/kitBuild'
import { submitKitBuild } from './actions'

/**
 * חידון מדים לפי עונה — dress the shirt for the year on the plate.
 *
 * The shirt on screen is the REAL kit with the asked layers taken out of it, and it
 * redraws as you choose: pick "פסים רחבים" and the stripes appear on the shirt in front
 * of you before you commit. That feedback loop is the game — you are not answering a
 * question about a kit, you are building one and watching it become right or wrong.
 */
export function KitBuildRun({
  questions,
  seed,
}: {
  questions: KitBuildQuestion[]
  seed: number
}) {
  const [session, setSession] = useState<Session>(NEW_SESSION)
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [verdict, setVerdict] = useState<KitBuildVerdict | null>(null)
  const [burst, setBurst] = useState<{ points: number; combo: number } | null>(null)
  const [showStage, setShowStage] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(secondsFor(0))
  const [started, setStarted] = useState(false)
  const locked = useRef(false)

  const index = session.index
  const question = questions[index]
  const total = secondsFor(index)
  const ready = question ? question.layers.every((layer) => picked[layer] !== undefined) : false

  const settle = useCallback(
    (result: KitBuildVerdict | null, left: number) => {
      if (!question) return
      const correct = result?.correct ?? false
      if (correct) {
        setBurst({
          points: pointsFor(result?.difficulty ?? question.difficulty, session.combo + 1, left, total),
          combo: session.combo + 1,
        })
      }
      window.setTimeout(
        () => {
          setBurst(null)
          setVerdict(null)
          setPicked({})
          locked.current = false
          setSession((current) =>
            advance(current, {
              correct,
              difficulty: result?.difficulty ?? question.difficulty,
              secondsLeft: left,
              total,
            }),
          )
        },
        correct ? 1000 : 2400,
      )
    },
    [question, session.combo, total],
  )

  useEffect(() => {
    if (!started || session.over || showStage || locked.current || !question) return
    setSecondsLeft(total)
    const startedAt = Date.now()
    const tick = window.setInterval(() => {
      const left = total - (Date.now() - startedAt) / 1000
      if (left <= 0) {
        window.clearInterval(tick)
        setSecondsLeft(0)
        if (locked.current) return
        locked.current = true
        void submitKitBuild(seed, index, {}).then((result) => {
          setVerdict(result)
          settle(result, 0)
        })
        return
      }
      setSecondsLeft(left)
    }, 100)
    return () => window.clearInterval(tick)
  }, [index, started, session.over, showStage, question, total, seed, settle])

  useEffect(() => {
    if (!started || session.over) return
    if (isStageBreak(index)) setShowStage(true)
  }, [index, started, session.over])

  function pick(layer: KitBuildLayer, value: string) {
    if (locked.current || verdict) return
    setPicked((current) => ({ ...current, [layer]: value }))
  }

  function commit() {
    if (locked.current || !question || !ready) return
    locked.current = true
    const left = secondsLeft
    void submitKitBuild(seed, index, picked).then((result) => {
      setVerdict(result)
      settle(result, left)
    })
  }

  if (!started)
    return (
      <div className="mt-stack border-rule border-ink bg-ink p-6 text-center">
        <p className="font-latin text-[10px] font-bold tracking-[0.28em] text-red" dir="ltr">
          GATE 4 · BUILD THE KIT
        </p>
        <p className="mt-3 font-poster text-[64px] leading-none text-paper">
          <Num>{questions.length}</Num>
        </p>
        <p className="font-body text-step-0 text-concrete">{t('kitBuild.lede')}</p>
        <p className="mx-auto mt-3 max-w-[32ch] font-body text-step--1 leading-relaxed text-concrete">
          {t('kitBuild.rules')}
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-5 flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-paper transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
        >
          {t('run.start')}
        </button>
      </div>
    )

  if (session.over) {
    const rank = t(rankFor(session.score) as MessageKey)
    return (
      <div className="mt-stack animate-slam">
        <Punch />
        {session.correct >= RUN_LENGTH - 2 && <Confetti />}
        <div className="border-rule border-ink bg-ink p-6 text-center">
          <p className="font-latin text-[10px] font-bold tracking-[0.28em] text-red" dir="ltr">
            {endReason(session) === 'out' ? 'OUT OF LAMPS' : 'RUN COMPLETE'}
          </p>
          <p className="mt-2 font-poster text-[88px] leading-none text-red">
            <Num>{session.score}</Num>
          </p>
          <p className="font-body text-[11px] tracking-widest text-concrete">{t('run.score')}</p>
          <p className="mt-3 font-display text-step-3 leading-tight text-paper">{rank}</p>
          <p className="mt-1 font-body text-step--1 text-concrete">
            <Num>{session.correct}</Num>/<Num>{RUN_LENGTH}</Num> {t('run.right')}
          </p>
        </div>
        <ShareRow
          kind="kit"
          params={{ s: String(seed), total: String(RUN_LENGTH) }}
          headline={String(session.correct)}
          card={{
            template: 'kit',
            kicker: 'GATE 4 · BUILD THE KIT',
            label: t('screen.kitChallenge.title'),
            eyebrow: t('run.right'),
            hero: `${session.correct}/${RUN_LENGTH}`,
            stats: [
              { k: t('run.score'), v: String(session.score) },
              { k: t('rank.label'), v: rank },
            ],
            cta: t('kitBuild.cta'),
            challenge: t('share.sameRound'),
            kit: questions[0]?.base,
          }}
        />
        <a
          href={`/kits/build?seed=${seed + 1}`}
          className="mt-3 flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-paper"
        >
          {t('run.again')}
        </a>
      </div>
    )
  }

  if (!question) return null

  // the shirt as it currently stands, with whatever the player has chosen so far
  const preview = {
    ...question.base,
    pattern:
      (PATTERNS.find((row) => row.he === picked.pattern)?.id ?? question.base.pattern),
    sponsorHe: question.layers.includes('sponsor')
      ? (picked.sponsor ?? null) === '—'
        ? null
        : (picked.sponsor ?? null)
      : question.base.sponsorHe,
    makerHe: question.layers.includes('maker')
      ? (picked.maker ?? null) === '—'
        ? null
        : (picked.maker ?? null)
      : question.base.makerHe,
  }

  return (
    <>
      {showStage && <StageCard stage={stageOf(index)} onDone={() => setShowStage(false)} />}
      <HUD session={session} secondsLeft={secondsLeft} total={total} />

      <div
        key={index}
        className={`relative mt-3 animate-slam ${verdict && !verdict.correct ? 'animate-shake' : ''}`}
      >
        {burst && <Burst points={burst.points} combo={burst.combo} />}
        {verdict?.correct && <Confetti />}

        <div className="flex items-center justify-between border-rule border-ink bg-ink px-4 py-2">
          <span className="font-body text-[11px] tracking-widest text-concrete">
            {t('kitBuild.dress')}
          </span>
          <span className="font-poster text-[30px] leading-none text-red" dir="ltr">
            {question.seasonLabel}
          </span>
        </div>

        <div
          className={`border-x-rule border-b-rule border-ink bg-paper p-4 ${
            verdict?.correct ? 'animate-flash' : ''
          }`}
        >
          <div className="mx-auto max-w-[180px]">
            <KitStrip spec={preview} />
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          {question.layers.map((layer) => (
            <fieldset key={layer} disabled={verdict !== null}>
              <legend className="mb-1.5 font-body text-[10px] tracking-widest text-muted">
                {t(`kitBuild.layer.${layer}` as MessageKey)}
                {verdict && (
                  <span className={verdict.byLayer[layer] ? 'text-red' : 'text-muted'}>
                    {' '}
                    {verdict.byLayer[layer] ? '✓' : `✗ ${verdict.answers[layer]}`}
                  </span>
                )}
              </legend>
              <div className="grid grid-cols-2 gap-1.5">
                {question.options[layer].map((option) => {
                  const chosen = picked[layer] === option
                  const right = verdict ? option === verdict.answers[layer] : false
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => pick(layer, option)}
                      aria-pressed={chosen}
                      className={`min-h-tap border-hair px-2 font-body text-step--1 leading-snug transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                        right
                          ? 'border-red bg-red text-paper'
                          : chosen
                            ? 'border-red bg-red/[.12] text-ink'
                            : 'border-ink/40 text-ink'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {!verdict && (
          <button
            type="button"
            onClick={commit}
            disabled={!ready}
            className="mt-3 flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] disabled:bg-concrete disabled:text-muted motion-reduce:transition-none"
          >
            {t('kitBuild.lock')}
          </button>
        )}

        {verdict && verdict.noteHe && (
          <p className="mt-2 font-body text-step--1 leading-relaxed text-muted">{verdict.noteHe}</p>
        )}
      </div>
    </>
  )
}
