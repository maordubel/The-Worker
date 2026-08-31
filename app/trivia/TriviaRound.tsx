'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { AnswerRow } from '@/components/ui/AnswerRow'
import { LampGrid } from '@/components/ui/LampGrid'
import { PastedSheet } from '@/components/ui/PastedSheet'
import { Stamp } from '@/components/ui/Stamp'
import { t } from '@/lib/i18n'
import type { TriviaQuestion, Verdict } from '@/lib/game/trivia'
import { submitAnswer } from './actions'

export function TriviaRound({
  question,
  seed,
  index,
  score,
  total,
}: {
  question: TriviaQuestion
  seed: number
  index: number
  score: number
  total: number
}) {
  const router = useRouter()
  const [picked, setPicked] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [pending, startTransition] = useTransition()
  const letters = t('trivia.letters').split(',')

  function choose(option: string) {
    if (verdict) return
    setPicked(option)
    startTransition(async () => {
      setVerdict(await submitAnswer(seed, index, option))
    })
  }

  function next() {
    const nextScore = score + (verdict?.correct ? 1 : 0)
    const nextIndex = index + 1
    router.push(
      nextIndex >= total
        ? `/trivia/summary?seed=${seed}&score=${nextScore}&total=${total}`
        : `/trivia?seed=${seed}&i=${nextIndex}&score=${nextScore}`,
    )
  }

  return (
    <>
      <div className="mt-stack flex items-center justify-between">
        <LampGrid
          total={total}
          on={index + (verdict ? 1 : 0)}
          cols={total}
          stagger
          label={`${index + 1} ${t('trivia.of')} ${total}`}
        />
        <span className="font-mono text-step--1 tabular-nums text-muted">
          <bdi>
            {String(index + 1).padStart(2, '0')}/{total}
          </bdi>
        </span>
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
