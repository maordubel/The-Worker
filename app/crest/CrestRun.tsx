'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Burst } from '@/components/play/Burst'
import { HUD } from '@/components/play/HUD'
import { Num } from '@/components/ui/Num'
import { ShareRow } from '@/components/share/ShareRow'
import { Punch } from '@/components/play/Punch'
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
import type { CrestQuestion, CrestVerdict } from '@/lib/game/crestRun'
import { submitCrest } from './actions'

/**
 * הסמל לאורך השנים — the crest run.
 *
 * The crest images are Maor's own, cut out of their backgrounds by
 * `scripts/brand/crests.py`. They are rendered `unoptimized` for the same reason the
 * badge is: Next's WebP re-encode subsamples chroma, and on artwork this saturated that
 * is exactly how a forbidden hue creeps back into a file that scanned clean.
 */
export function CrestRun({ questions, seed }: { questions: CrestQuestion[]; seed: number }) {
  const [session, setSession] = useState<Session>(NEW_SESSION)
  const [picked, setPicked] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<CrestVerdict | null>(null)
  const [burst, setBurst] = useState<{ points: number; combo: number } | null>(null)
  const [showStage, setShowStage] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(secondsFor(0))
  const [started, setStarted] = useState(false)
  const locked = useRef(false)

  const index = session.index
  const question = questions[index]
  const total = secondsFor(index)

  const settle = useCallback(
    (result: CrestVerdict | null, left: number) => {
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
        correct ? 900 : 2400,
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
        void submitCrest(seed, index, '__timeout__').then((result) => {
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
    void submitCrest(seed, index, option).then((result) => {
      setVerdict(result)
      settle(result, left)
    })
  }

  if (!started)
    return (
      <div className="mt-stack border-rule border-ink bg-ink p-6 text-center">
        <p className="font-latin text-[10px] font-bold tracking-[0.28em] text-red" dir="ltr">
          GATE 7 · THE CREST
        </p>
        <div className="mt-4 flex justify-center">
          <Image
            src="/brand/crests/circle-1923.png"
            alt=""
            width={110}
            height={126}
            unoptimized
            priority
          />
        </div>
        <p className="mt-3 font-body text-step-0 text-concrete">{t('crest.lede')}</p>
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
          kind="crest"
          params={{ s: String(seed), total: String(RUN_LENGTH) }}
          headline={String(session.correct)}
          card={{
            template: 'year',
            kicker: 'GATE 7 · THE CREST',
            label: t('screen.crest.title'),
            eyebrow: t('run.right'),
            hero: `${session.correct}/${RUN_LENGTH}`,
            stats: [
              { k: t('run.score'), v: String(session.score) },
              { k: t('rank.label'), v: rank },
            ],
            cta: t('crest.cta'),
            challenge: t('share.sameRound'),
          }}
        />
        <a
          href={`/crest?seed=${seed + 1}`}
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

      <div
        key={index}
        className={`relative mt-3 animate-slam ${verdict && !verdict.correct ? 'animate-shake' : ''}`}
      >
        {burst && <Burst points={burst.points} combo={burst.combo} />}

        {/* Two stages of the nine have no photographed variant in the material
            supplied, and borrowing another stage's picture would be a lie about the
            crest. Those questions print the era instead — the years set big, which is
            what the question is actually about anyway. */}
        <div
          className={`flex min-h-[186px] items-center justify-center border-rule border-ink bg-paper p-5 ${
            verdict?.correct ? 'animate-flash' : ''
          }`}
        >
          {question.imageKey ? (
            <Image
              src={`/brand/crests/${question.imageKey}.png`}
              alt=""
              width={150}
              height={172}
              unoptimized
              className="h-[150px] w-auto"
            />
          ) : (
            <span className="font-poster text-[68px] leading-none text-red" dir="ltr">
              <span className="plate-shift absolute text-sign">{question.eraHe}</span>
              <span className="plate-top relative">{question.eraHe}</span>
            </span>
          )}
        </div>

        <p
          className={`font-display text-step-2 leading-tight text-ink ${
            question.imageKey ? 'mt-3 text-center' : 'border-rule border-ink bg-sheet p-4'
          }`}
        >
          {question.promptHe}
        </p>

        <div className="mt-2 grid gap-2">
          {question.options.map((option) => {
            const right = verdict ? option === verdict.answer : false
            const wrongPick = verdict ? picked === option && !right : false
            return (
              <button
                key={option}
                type="button"
                disabled={verdict !== null}
                onClick={() => choose(option)}
                className={`min-h-tap border-rule px-3 py-2.5 text-start font-body text-step-0 leading-snug transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none ${
                  right
                    ? 'border-red bg-red text-paper'
                    : wrongPick
                      ? 'border-ink/40 text-muted line-through'
                      : 'border-ink text-ink'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {verdict && verdict.noteHe && (
          <p className="mt-2 font-body text-step--1 leading-relaxed text-muted">{verdict.noteHe}</p>
        )}
      </div>
    </>
  )
}
