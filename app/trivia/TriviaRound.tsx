'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { AnswerRow } from '@/components/ui/AnswerRow'
import { LampGrid } from '@/components/ui/LampGrid'
import { PastedSheet } from '@/components/ui/PastedSheet'
import { Stamp } from '@/components/ui/Stamp'
import { Num } from '@/components/ui/Num'
import { t } from '@/lib/i18n'
import { applyAnswer, encodeRun, lampsFor, perfectScore, type RunState } from '@/lib/game/score'
import type { Difficulty } from '@/lib/game/score'
import type { TriviaQuestion, Verdict } from '@/lib/game/trivia'
import { submitAnswer } from './actions'

export function TriviaRound({
  question,
  seed,
  index,
  run,
  difficulties,
  total,
}: {
  question: TriviaQuestion
  seed: number
  index: number
  /** the run so far, carried through the URL so a refresh cannot rewrite history */
  run: RunState
  difficulties: Difficulty[]
  total: number
}) {
  const router = useRouter()
  const [picked, setPicked] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [pending, startTransition] = useTransition()
  const letters = t('trivia.letters').split(',')
  const perfect = perfectScore(difficulties)

  function choose(option: string) {
    if (verdict) return
    setPicked(option)
    startTransition(async () => {
      setVerdict(await submitAnswer(seed, index, option))
    })
  }

  const nextRun = verdict
    ? applyAnswer(run, verdict.correct, verdict.difficulty)
    : run

  function next() {
    const nextIndex = index + 1
    const code = encodeRun(nextRun, perfect, seed)
    router.push(
      nextIndex >= total ? `/trivia/summary?r=${code}` : `/trivia?seed=${seed}&i=${nextIndex}&r=${code}`,
    )
  }

  return (
    <>
      <div className="mt-stack flex items-end justify-between gap-3">
        <div className="min-w-0">
          <LampGrid
            total={total}
            on={index + (verdict ? 1 : 0)}
            cols={total}
            stagger
            label={`${index + 1} ${t('trivia.of')} ${total}`}
          />
          <p className="mt-1 font-body text-[10px] tracking-widest text-muted">
            <bdi dir="ltr">
              {String(index + 1).padStart(2, '0')}/{total}
            </bdi>{' '}
            {/* Filled and empty are different GLYPHS, not the same glyph at two
                opacities: a dimmed dot is hard to count at 10px and identical to a
                screen reader. */}
            · {t('trivia.difficulty')}{' '}
            <span aria-label={`${question.difficulty} ${t('trivia.outOfFive')}`}>
              {'●'.repeat(question.difficulty)}
              {'○'.repeat(5 - question.difficulty)}
            </span>
          </p>
        </div>

        {/* The run, always visible. A score you cannot see while playing is not a stake. */}
        <div className="shrink-0 text-end">
          <p className="font-poster text-step-3 leading-none text-red">
            <Num>{nextRun.lamps}</Num>
          </p>
          <p className="font-body text-[10px] tracking-widest text-muted">{t('score.lamps')}</p>
          {nextRun.streak > 1 && (
            <p className="mt-0.5 font-body text-[11px] font-extrabold text-ink">
              {t('score.streak')} <Num>{nextRun.streak}</Num>
            </p>
          )}
        </div>
      </div>

      <div className="relative mt-stack">
        <PastedSheet
          id={question.id}
          animate
          kicker={t('screen.trivia.title')}
          serial={`TIK-${String(index + 1).padStart(4, '0')}`}
        >
          {/* No source line. Provenance gates which facts become questions; it is not
              furniture on the card. */}
          <h2 className="mt-2 font-display text-step-2 leading-snug text-ink">{question.prompt}</h2>
        </PastedSheet>

        {verdict && (
          <div className="pointer-events-none absolute -top-2 start-2">
            <Stamp
              label={verdict.correct ? 'verified' : 'rejected'}
              tone={verdict.correct ? 'red' : 'ink'}
              ring={false}
              size={64}
              animate
            />
          </div>
        )}
      </div>

      <div className="mt-stack border-t-rule border-ink">
        {question.options.map((option, position) => (
          <AnswerRow
            key={option}
            letter={letters[position] ?? ''}
            text={option}
            picked={picked === option}
            onPick={() => choose(option)}
          />
        ))}
      </div>

      {!verdict && (
        <p className="mt-stack font-body text-step--1 text-muted">
          {pending ? t('state.loading') : t('trivia.prompt')}
        </p>
      )}

      {verdict && (
        <>
          <p className="mt-stack font-body text-step-0 text-ink">
            {verdict.correct ? t('trivia.correct') : t('trivia.wrong')}
          </p>
          <p className="mt-1 font-mono text-step--1 tabular-nums text-muted">
            {verdict.explanation}
          </p>
          {verdict.correct ? (
            <p className="mt-1 font-body text-step--1 text-red">
              +<Num>{lampsFor(verdict.difficulty, run.streak)}</Num> {t('score.lamps')}
              {run.streak > 0 && ` · ${t('score.streakBonus')}`}
            </p>
          ) : (
            run.streak > 0 && (
              <p className="mt-1 font-body text-step--1 text-muted">{t('score.streakLost')}</p>
            )
          )}
          <button
            type="button"
            onClick={next}
            className="mt-stack flex min-h-tap w-full items-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
          >
            {index + 1 >= total ? t('trivia.finish') : t('trivia.next')}
          </button>
        </>
      )}
    </>
  )
}
