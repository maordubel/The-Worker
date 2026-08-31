import { EmptyState } from '@/components/ui/EmptyState'
import { Num } from '@/components/ui/Num'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealGoal } from '@/lib/game/goal'
import { t } from '@/lib/i18n'
import { GoalBoard } from './GoalBoard'

/** שחזור השער — replay a real, sourced goal on the pitch. */
export default function GoalPage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 1
  const challenge = dealGoal(seed)

  return (
    <Screen title={t('screen.goal.title')} sub={t('screen.goal.sub')}>
      {challenge ? (
        <>
          <p className="mt-stack font-sign text-step-1 leading-tight text-ink">
            {challenge.titleHe}
          </p>
          <p className="mt-1 font-mono text-[11px] text-sign">
            <Num>{challenge.subtitleHe}</Num>
          </p>
          <GoalBoard challenge={challenge} seed={seed} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.goal')} body={t('empty.goal.body')} />
      )}
    </Screen>
  )
}
