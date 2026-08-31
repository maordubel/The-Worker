import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealTimeline, timelineAvailable } from '@/lib/game/timeline'
import { t } from '@/lib/i18n'
import { TimelineBoard } from './TimelineBoard'

export default function TimelinePage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 4
  const cards = dealTimeline(seed)

  return (
    <Screen title={t('screen.timeline.title')} sub={t('screen.timeline.sub')}>
      {timelineAvailable() ? (
        <>
          <TimelineBoard cards={cards} seed={seed} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.timeline')} body={t('empty.timeline.body')} />
      )}
    </Screen>
  )
}
