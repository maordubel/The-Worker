'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Burst } from '@/components/play/Burst'
import { HUD } from '@/components/play/HUD'
import { KitStrip } from '@/components/kit/KitStrip'
import { Num } from '@/components/ui/Num'
import { ShareRow } from '@/components/share/ShareRow'
import { StageCard } from '@/components/play/StageCard'
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
import { t, type MessageKey } from '@/lib/i18n'
import type { KitQuestion, KitVerdictRun } from '@/lib/game/kitRun'
import { submitKitGuess } from './actions'

/**
 * אתגר החולצה — twelve shirts, four seasons each, one screen.
 *
 * The same loop as trivia, because the loop is the product: lives, a clock, combos,
 * three escalating stages and no "next" button. What changes is the question — here it
 * is a drawn kit, and the whole read is visual, which makes it the fastest gate in the
 * app to play and the easiest to be smug about.
 */
export function KitRun({ questions, seed }: { questions: KitQuestion[]; seed: number }) {
  const [session, setSession] = useState<Session>(NEW_SESSION)
  const [picked, setPicked] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<KitVerdictRun | null>(null)
  const [burst, setBurst] = useState<{ points: number; combo: number } | null>(null)
  const [showStage, setShowStage] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(secondsFor(0))
  const [started, setStarted] = useState(false)
  const locked = useRef(false)

  const index = session.index
  const question = questions[index]
  const total = secondsFor(index)

  const settle = useCallback(
    (result: KitVerdictRun | null, left: number) => {
      if (!question) return
      const correct = result?.correct ?? false
      const points = correct
        ? pointsFor(result?.difficulty ?? question.difficulty, session.combo + 1, left, total)
        : 0
      if (correct) setBurst({ points, combo: session.combo + 1 })
      window.setTimeout(
        () => {
          setBurst(null)
          setVerdict(null)
          setPicked(null)
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
        correct ? 900 : 2100,
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
        void submitKitGuess(seed, index, '__timeout__').then((result) => {
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

  function choose(option: string) {
    if (locked.current || !question || session.over) return
    locked.current = true
    const left = secondsLeft
    setPicked(option)
    void submitKitGuess(seed, index, option).then((result) => {
      setVerdict(result)
      settle(result, left)
    })
  }

  if (!started)
    return (
      <div className="mt-stack border-rule border-ink bg-ink p-6 text-center">
        <p className="font-latin text-[10px] font-bold tracking-[0.28em] text-red" dir="ltr">
          GATE 4 · GUESS THE KIT
        </p>
        <p className="mt-3 font-poster text-[64px] leading-none text-paper">
          <Num>{questions.length}</Num>
        </p>
        <p className="font-body text-step-0 text-concrete">{t('kitRun.lede')}</p>
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
            kicker: 'GATE 4 · GUESS THE KIT',
            label: t('screen.kitChallenge.title'),
            eyebrow: t('run.right'),
            hero: `${session.correct}/${RUN_LENGTH}`,
            stats: [
              { k: t('run.score'), v: String(session.score) },
              { k: t('rank.label'), v: rank },
            ],
            cta: t('share.challenge'),
            challenge: t('share.sameRound'),
            kit: questions[0] ? { ...questions[0].spec, seasonLabel: '' } : undefined,
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

  return (
    <>
      {showStage && <StageCard stage={stageOf(index)} onDone={() => setShowStage(false)} />}
      <HUD session={session} secondsLeft={secondsLeft} total={total} />

      <div key={index} className={`relative mt-3 animate-slam ${verdict && !verdict.correct ? 'animate-shake' : ''}`}>
        {burst && <Burst points={burst.points} combo={burst.combo} />}

        <div className={`border-rule border-ink bg-paper p-4 ${verdict?.correct ? 'animate-flash' : ''}`}>
          <div className="mx-auto max-w-[200px]">
            <KitStrip spec={{ ...question.spec, seasonLabel: '' }} />
          </div>
        </div>

        <p className="mt-3 text-center font-display text-step-2 leading-tight text-ink">
          {t('kitRun.which')}
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2">
          {question.options.map((option) => {
            const right = verdict ? option === verdict.answer : false
            const wrongPick = verdict ? picked === option && !right : false
            return (
              <button
                key={option}
                type="button"
                disabled={verdict !== null}
                onClick={() => choose(option)}
                className={`min-h-tap border-rule px-3 font-mono text-step-1 tabular-nums transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                  right
                    ? 'border-red bg-red text-paper'
                    : wrongPick
                      ? 'border-ink/40 text-muted line-through'
                      : 'border-ink text-ink'
                }`}
              >
                <bdi dir="ltr">{option}</bdi>
              </button>
            )
          })}
        </div>

        {verdict && (
          <p className="mt-2 font-body text-step--1 leading-relaxed text-muted">{verdict.noteHe}</p>
        )}
      </div>
    </>
  )
}
