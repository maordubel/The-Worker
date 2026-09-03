import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealRun, hasGoals } from '@/lib/game/goal'
import { t } from '@/lib/i18n'
import { GoalRun } from './GoalRun'

/**
 * שער 8 — שחזור השער.
 *
 * Three sourced goals a run, dealt here WITHOUT their zones: `dealRun()` strips the
 * truth and the narrative, and `submitGoal` re-reads the record from the seed to grade.
 * The player never receives an answer they have not earned.
 */
export default function GoalPage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 1
  const goals = hasGoals() ? dealRun(seed) : []

  return (
    <Screen title={t('screen.goal.title')} sub={t('screen.goal.sub')} chrome={false}>
      {goals.length > 0 ? (
        <>
          <GoalRun goals={goals} seed={seed} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.goal')} body={t('empty.goal.body')} />
      )}
    </Screen>
  )
}
