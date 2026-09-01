import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { buildKitBuildRound } from '@/lib/game/kitBuild'
import { RUN_LENGTH } from '@/lib/game/session'
import { t } from '@/lib/i18n'
import { KitBuildRun } from './KitBuildRun'

/**
 * שער 4 — חידון מדים לפי עונה.
 *
 * The season is the QUESTION and the kit is the answer, so the shirt leaves the server
 * with the asked layers already stripped out and the grading happens in a server action
 * from the seed. What the client gets is a half-dressed shirt and a year.
 */
export default function KitBuildPage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 1
  const questions = buildKitBuildRound(seed)

  return (
    <Screen
      title={t('screen.kitChallenge.title')}
      sub={t('screen.kitChallenge.sub')}
      chrome={false}
    >
      {questions.length >= RUN_LENGTH ? (
        <>
          <KitBuildRun questions={questions} seed={seed} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />
      )}
    </Screen>
  )
}
