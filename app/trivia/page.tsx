import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { ROUND_LENGTH, deal } from '@/lib/game/trivia'
import { t } from '@/lib/i18n'
import { TriviaRun } from './TriviaRun'

/**
 * שער 2 — טריוויה, as one run.
 *
 * The whole round is dealt here, server-side, WITHOUT its answers: `deal()` strips
 * `correct` and `correctSet` before the payload leaves the server, and every answer is
 * still graded by the server action from the seed. Dealing all twelve at once is what
 * lets the run play on one screen with no navigation — the thing that separates a game
 * from a form.
 */
export default function TriviaPage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 1
  const questions = Array.from({ length: ROUND_LENGTH }, (_, index) => deal(seed, index)).filter(
    (question): question is NonNullable<typeof question> => question !== null,
  )

  return (
    <Screen title={t('screen.trivia.title')} sub={t('screen.trivia.sub')} chrome={false}>
      {questions.length >= ROUND_LENGTH ? (
        <>
          <TriviaRun questions={questions} seed={seed} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.trivia')} body={t('empty.trivia.body')} />
      )}
    </Screen>
  )
}
