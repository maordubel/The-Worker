import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealTimelineRun, timelineAvailable } from '@/lib/game/timeline'
import { t } from '@/lib/i18n'
import { TimelineBoard } from './TimelineBoard'

/**
 * שער 13 — ציר הזמן.
 *
 * The anchor is dealt WITH its date, because it is the board's first card and there is
 * nothing to place it against. Everything else arrives blind; `gradeInsert` derives the
 * dates from the seed on the server, so a card's date never reaches the client before
 * it has been played.
 */
export default function TimelinePage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 1
  const available = timelineAvailable()
  const deal = available ? dealTimelineRun(seed) : null

  return (
    <Screen
      title={t('screen.timeline.title')}
      sub={t('screen.timeline.sub')}
      chrome={!available}
    >
      {deal ? (
        <>
          <TimelineBoard anchor={deal.anchor} queue={deal.queue} seed={seed} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.timeline')} body={t('empty.timeline.body')} />
      )}
    </Screen>
  )
}
