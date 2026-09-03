import { Screen } from '@/components/ui/Screen'
import { ReportLink } from '@/components/ui/ReportLink'
import { rosterIndex } from '@/lib/game/allTimeXI'
import { t } from '@/lib/i18n'

import { BallotSheet } from './BallotSheet'

/**
 * שער 7 — אגף הסקרים.
 *
 * The roster is built on the server, where the archive lives, and handed down as names
 * only — the same payload the all-time XI takes. Nothing about a ballot needs grading,
 * so there is no server action here and no seed: this gate has no right answer, which
 * is the entire point of it.
 */
export default function PollsPage() {
  return (
    <Screen title={t('screen.polls.title')} sub={t('screen.polls.sub')}>
      <BallotSheet roster={rosterIndex()} />
      <ReportLink />
    </Screen>
  )
}
