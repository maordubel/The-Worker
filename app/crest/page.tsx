import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { buildCrestRound } from '@/lib/game/crestRun'
import { RUN_LENGTH } from '@/lib/game/session'
import { t } from '@/lib/i18n'
import { CrestRun } from './CrestRun'

/** שער 7 — הסמל לאורך השנים. Gate 7 used to duplicate gate 5; now it has its own room. */
export default function CrestPage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 7
  const questions = buildCrestRound(seed)

  return (
    <Screen title={t('screen.crest.title')} sub={t('screen.crest.sub')} chrome={false}>
      {questions.length >= RUN_LENGTH ? (
        <>
          <CrestRun questions={questions} seed={seed} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.crest')} body={t('empty.crest.body')} />
      )}
    </Screen>
  )
}
