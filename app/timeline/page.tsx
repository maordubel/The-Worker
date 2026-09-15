import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealTimelineRun, timelineAvailable } from '@/lib/game/timeline'
import { roundFrom } from '@/lib/rotation/round'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'
import { TimelineBoard } from './TimelineBoard'

/**
 * שער 13 — ציר הזמן.
 *
 * The anchor is dealt WITH its date, because it is the board's first card and there is
 * nothing to place it against. Everything else arrives blind; `gradeInsert` derives the
 * dates from the seed on the server, so a card's date never reaches the client before
 * it has been played.
 */
export const metadata: Metadata = gateMetadata('timeline')

export default function TimelinePage({
  searchParams,
}: {
  searchParams: { seed?: string; r?: string }
}) {
  const round = roundFrom(searchParams)
  const available = timelineAvailable()
  const deal = available ? dealTimelineRun(round.seed, round.cursor) : null

  return (
    <Screen
      title={t('screen.timeline.title')}
      sub={t('screen.timeline.sub')}
      chrome={!available}
    >
      {deal ? (
        <>
          <TimelineBoard
            anchor={deal.anchor}
            queue={deal.queue}
            seed={round.seed}
            cursor={round.cursor}
          />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.timeline')} body={t('empty.timeline.body')} />
      )}
    </Screen>
  )
}
