import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealRun, hasGoals, pinnedGoal } from '@/lib/game/goal'
import { roundFrom } from '@/lib/rotation/round'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'
import { GoalRun } from './GoalRun'

/**
 * שער 8 — שחזור השער.
 *
 * Three sourced goals a run, dealt here WITHOUT their zones: `dealRun()` strips the
 * truth and the narrative, and `submitGoal` re-reads the record from the seed to grade.
 * The player never receives an answer they have not earned.
 *
 * `?g=<goalId>` pins one goal as goal 1 of an otherwise normal run — the archive's
 * "rebuild this goal". An unknown or held id is ignored rather than refused: the link
 * still opens a run, just not a pinned one.
 */
export const metadata: Metadata = gateMetadata('goal')

export default function GoalPage({
  searchParams,
}: {
  searchParams: { seed?: string; r?: string; g?: string | string[] }
}) {
  const round = roundFrom(searchParams)
  const pin = pinnedGoal(Array.isArray(searchParams.g) ? searchParams.g[0] : searchParams.g)
  const goals = hasGoals() ? dealRun(round.seed, round.cursor, pin) : []

  return (
    <Screen title={t('screen.goal.title')} sub={t('screen.goal.sub')} chrome={false}>
      {goals.length > 0 ? (
        <>
          <GoalRun goals={goals} seed={round.seed} cursor={round.cursor} pin={pin} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.goal')} body={t('empty.goal.body')} />
      )}
    </Screen>
  )
}
