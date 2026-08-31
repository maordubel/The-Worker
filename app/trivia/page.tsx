import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { ROUND_LENGTH, deal } from '@/lib/game/trivia'
import { t } from '@/lib/i18n'
import { TriviaRound } from './TriviaRound'

/** Screen 2/3 — the question, and the same screen once the stamp has landed. */
export default function TriviaPage({
  searchParams,
}: {
  searchParams: { seed?: string; i?: string; score?: string }
}) {
  const seed = Number(searchParams.seed) || 1
  const index = Number(searchParams.i) || 0
  const score = Number(searchParams.score) || 0
  const question = deal(seed, index)

  return (
    <Screen title={t('screen.trivia.title')} sub={t('screen.trivia.sub')}>
      {question ? (
        <>
          {/* The key is the fix for "from question 2 you cannot answer".
              router.push to ?i=2 keeps the same element in the same slot, so React
              REUSES the component and its state: the previous question's verdict is
              still set, choose() early-returns, and every row is inert while looking
              fresh. Keying on the question index forces a remount. */}
          <TriviaRound
            key={`${seed}:${index}`}
            question={question}
            seed={seed}
            index={index}
            score={score}
            total={ROUND_LENGTH}
          />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.trivia')} body={t('empty.trivia.body')} />
      )}
    </Screen>
  )
}
