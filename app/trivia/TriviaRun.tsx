'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { AnswerRow } from '@/components/ui/AnswerRow'
import { Burst } from '@/components/play/Burst'
import { HUD } from '@/components/play/HUD'
import { StageCard } from '@/components/play/StageCard'
import { Num } from '@/components/ui/Num'
import { ShareRow } from '@/components/share/ShareRow'
import { artFor } from '@/lib/share/story'
import { Punch } from '@/components/play/Punch'
import {
  NEW_SESSION,
  RUN_LENGTH,
  advance,
  encodeSession,
  endReason,
  isStageBreak,
  pointsFor,
  rankFor,
  secondsFor,
  stageOf,
  type Session,
} from '@/lib/game/session'
import { DEFAULT_TOPIC, type Topic } from '@/lib/game/topics'
import { t, type MessageKey } from '@/lib/i18n'
import type { TriviaQuestion, Verdict } from '@/lib/game/trivia'
import { submitAnswer } from './actions'

/**
 * הריצה — twelve questions, one screen, no navigation.
 *
 * The old round pushed a route per question. That is why it never felt like a game: a
 * page transition is a full stop, and a game is a run-on sentence. Everything now lives
 * in one component — the clock ticks between questions, the combo carries, the score
 * climbs in place, and a correct answer advances ITSELF after 900ms of feedback. The
 * only button on the screen is an answer.
 *
 * Server authority is untouched. The questions arrive without their answers (`deal()`
 * strips them), every answer is graded by the server action from the seed, and this
 * component never learns a correct answer before it is earned. Dealing all twelve up
 * front costs one payload and buys the whole feel.
 */
export function TriviaRun({
  questions,
  seed,
  topic = DEFAULT_TOPIC,
}: {
  questions: TriviaQuestion[]
  seed: number
  topic?: Topic
}) {
  const [session, setSession] = useState<Session>(NEW_SESSION)
  const [picked, setPicked] = useState<string[]>([])
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [burst, setBurst] = useState<{ points: number; combo: number } | null>(null)
  const [showStage, setShowStage] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(secondsFor(0))
  const [started, setStarted] = useState(false)
  const locked = useRef(false)

  const index = session.index
  const question = questions[index]
  const total = secondsFor(index)
  const multi = question?.kind === 'multi'

  /** One place where a question ends, whatever ended it. */
  const settle = useCallback(
    (result: Verdict | null, left: number) => {
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
          setPicked([])
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
        correct ? 900 : 1900,
      )
    },
    [question, session.combo, total],
  )

  /** The clock. It runs only while a question is live and the run is going. */
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
        // running out is a miss, and it shows the answer like any other miss
        void submitAnswer(seed, index, '__timeout__', topic).then((result) => {
          setVerdict(result)
          settle(result, 0)
        })
        return
      }
      setSecondsLeft(left)
    }, 100)
    return () => window.clearInterval(tick)
  }, [index, started, session.over, showStage, question, total, seed, settle])

  /** The stage card, at the top of stages 2 and 3. */
  useEffect(() => {
    if (!started || session.over) return
    if (isStageBreak(index)) setShowStage(true)
  }, [index, started, session.over])

  function choose(option: string) {
    if (locked.current || !question || session.over) return
    if (multi) {
      setPicked((current) =>
        current.includes(option)
          ? current.filter((value) => value !== option)
          : current.length >= question.pickCount
            ? current
            : [...current, option],
      )
      return
    }
    locked.current = true
    const left = secondsLeft
    setPicked([option])
    void submitAnswer(seed, index, option, topic).then((result) => {
      setVerdict(result)
      settle(result, left)
    })
  }

  function commit() {
    if (locked.current || !question || picked.length !== question.pickCount) return
    locked.current = true
    const left = secondsLeft
    void submitAnswer(seed, index, picked, topic).then((result) => {
      setVerdict(result)
      settle(result, left)
    })
  }

  if (!started) return <Ready onStart={() => setStarted(true)} count={questions.length} />
  if (session.over) return <Result session={session} seed={seed} />
  if (!question) return null

  const stage = stageOf(index)

  return (
    <>
      {showStage && <StageCard stage={stage} onDone={() => setShowStage(false)} />}

      <HUD session={session} secondsLeft={secondsLeft} total={total} />

      <div
        key={index}
        className={`relative mt-3 animate-slam ${verdict && !verdict.correct ? 'animate-shake' : ''}`}
      >
        {burst && <Burst points={burst.points} combo={burst.combo} />}

        <div
          className={`relative border-rule border-ink bg-sheet p-4 ${
            verdict?.correct ? 'animate-flash' : ''
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-latin text-[9px] font-bold tracking-[0.2em] text-red" dir="ltr">
              {String(index + 1).padStart(2, '0')} / {RUN_LENGTH}
            </span>
            <span aria-label={`${question.difficulty}`} className="font-sign text-[11px] text-muted">
              {'●'.repeat(question.difficulty)}
              {'○'.repeat(5 - question.difficulty)}
            </span>
          </div>

          {question.quoteHe && (
            <blockquote className="mt-2 border-s-[4px] border-red ps-3">
              <p className="font-display text-step-3 leading-tight text-ink">
                {`”${question.quoteHe}“`}
              </p>
              {question.quoteByHe && (
                <footer className="mt-1 font-body text-[11px] tracking-wide text-muted">
                  {question.quoteByHe}
                </footer>
              )}
            </blockquote>
          )}

          <h2
            className={`mt-2 font-display leading-snug text-ink ${
              question.quoteHe ? 'text-step-1' : 'text-step-2'
            }`}
          >
            {question.prompt}
          </h2>
        </div>

        <div className="mt-2 border-t-rule border-ink">
          {question.options.map((option) => (
            <AnswerRow
              key={option}
              letter=""
              text={option}
              picked={picked.includes(option)}
              correct={verdict ? verdict.correctAnswers.includes(option) : undefined}
              onPick={() => choose(option)}
            />
          ))}
        </div>

        {multi && !verdict && (
          <button
            type="button"
            onClick={commit}
            disabled={picked.length !== question.pickCount}
            className="mt-3 flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] disabled:bg-concrete disabled:text-muted motion-reduce:transition-none"
          >
            {t('trivia.commit', {
              picked: String(picked.length),
              of: String(question.pickCount),
            })}
          </button>
        )}

        {verdict && !verdict.correct && (
          <p className="mt-2 font-body text-step--1 leading-relaxed text-muted">
            {secondsLeft <= 0 ? `${t('run.timeup')} · ` : ''}
            {verdict.explanation}
          </p>
        )}
      </div>
    </>
  )
}

/** One tap before the clock starts, so a run never begins while the page is loading. */
function Ready({ onStart, count }: { onStart: () => void; count: number }) {
  return (
    <div className="mt-stack border-rule border-ink bg-ink p-6 text-center">
      <p className="font-latin text-[10px] font-bold tracking-[0.28em] text-red" dir="ltr">
        GATE 2 · TRIVIA
      </p>
      <p className="mt-3 font-poster text-[64px] leading-none text-paper">
        <Num>{Math.min(count, RUN_LENGTH)}</Num>
      </p>
      <p className="font-body text-step-0 text-concrete">{t('run.ready')}</p>
      <p className="mx-auto mt-3 max-w-[30ch] font-body text-step--1 leading-relaxed text-concrete">
        {t('run.stage.1.rule')}
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-5 flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-paper transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
      >
        {t('run.start')}
      </button>
    </div>
  )
}

function Result({ session, seed }: { session: Session; seed: number }) {
  const rank = t(rankFor(session.score) as MessageKey)
  const out = endReason(session) === 'out'

  return (
    <div className="mt-stack animate-slam">
      <Punch />
        <div className="border-rule border-ink bg-ink p-6 text-center">
        <p className="font-latin text-[10px] font-bold tracking-[0.28em] text-red" dir="ltr">
          {out ? 'OUT OF LAMPS' : 'RUN COMPLETE'}
        </p>
        <p className="mt-2 font-poster text-[88px] leading-none text-red">
          <Num>{session.score}</Num>
        </p>
        <p className="font-body text-[11px] tracking-widest text-concrete">{t('run.score')}</p>
        <p className="mt-3 font-display text-step-3 leading-tight text-paper">{rank}</p>
        <p className="mt-1 font-body text-step--1 text-concrete">
          {out ? t('run.over') : t('run.survived')}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Tile label={t('run.right')} value={`${session.correct}/${RUN_LENGTH}`} />
        <Tile label={t('run.best')} value={`×${session.bestCombo}`} />
        <Tile label={t('run.lives')} value={String(session.lives)} />
      </div>

      <ShareRow
        kind="trivia"
        params={{ s: String(seed), total: String(RUN_LENGTH) }}
        headline={String(session.score)}
        card={{
          template: 'score' as const,
              art: artFor('trivia', session.correct / RUN_LENGTH),
          kicker: 'GATE 2 · TRIVIA',
          label: t('screen.trivia.title'),
          eyebrow: t('run.score'),
          hero: String(session.score),
          bigStat: { v: `${session.correct}/${RUN_LENGTH}`, k: t('run.right') },
          stats: [
            { k: t('rank.label'), v: rank },
            { k: t('run.best'), v: `×${session.bestCombo}` },
          ],
          cta: t('share.challenge'),
          challenge: t('share.sameRound'),
          marks: session.history,
        }}
      />

      <a
        href={`/trivia?seed=${seed + 1}`}
        className="mt-3 flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-paper"
      >
        {t('run.again')}
      </a>
      <p className="mt-2 text-center font-mono text-[11px] tabular-nums text-muted">
        <bdi dir="ltr">seed {seed}</bdi>
      </p>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-rule border-ink bg-sheet p-3 text-center">
      <p className="font-poster text-[28px] leading-none text-ink">
        <Num>{value}</Num>
      </p>
      <p className="mt-1 font-body text-[10px] tracking-widest text-muted">{label}</p>
    </div>
  )
}
