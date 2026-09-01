import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { buildKitRound } from '@/lib/game/kitRun'
import { RUN_LENGTH } from '@/lib/game/session'
import { t } from '@/lib/i18n'
import { KitRun } from './KitRun'

/**
 * שער 4 — אתגר החולצה, as a run.
 *
 * The season label is stripped from every spec before it leaves the server, and the
 * answer is graded from the seed. What the client gets is a drawing and four years.
 */
export default function KitChallengePage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 1
  const questions = buildKitRound(seed)

  return (
    <Screen
      title={t('screen.kitChallenge.title')}
      sub={t('screen.kitChallenge.sub')}
      chrome={false}
    >
      {questions.length >= RUN_LENGTH ? (
        <>
          <KitRun questions={questions} seed={seed} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />
      )}
    </Screen>
  )
}
