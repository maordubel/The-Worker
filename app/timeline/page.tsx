import type { Metadata } from 'next'

import { ThreadBoard } from '@/components/archive/ThreadBoard'
import { ThreadTabs } from '@/components/archive/ThreadTabs'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealThreadRun, publicLevel } from '@/lib/game/thread'
import type { PublicLevel } from '@/lib/game/thread-run'
import { roundFrom } from '@/lib/rotation/round'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'

/**
 * שער 13 — החוט האדום (brief §23; prototype v7; owner decision 21.9.2026).
 *
 * Five routes to a run: the curated ones first, then routes generated from the graph.
 * The board is dealt CARDS and RULES for each (`publicLevel`) — never an edge — and asks
 * the server about every link it tries (`linkThread`, rule 4). The chronology game is the
 * gate's second mode, one tab away at `/timeline/order`.
 */
export const metadata: Metadata = gateMetadata('timeline')

export default function TimelinePage({
  searchParams,
}: {
  searchParams: { seed?: string; r?: string }
}) {
  const round = roundFrom(searchParams)
  const refs = dealThreadRun(round.seed, round.cursor)
  const levels = refs
    .map((ref, index) => publicLevel(ref, index, refs.length))
    .filter((level): level is PublicLevel => level !== null)

  return (
    <Screen title={t('screen.thread.title')} sub={t('screen.thread.sub')} chrome={levels.length === 0}>
      <div className="pt-1">
        <ThreadTabs active="thread" />
      </div>
      {levels.length ? (
        <>
          <ThreadBoard levels={levels} seed={round.seed} cursor={round.cursor} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('thread.empty')} body={t('help.thread.what')} />
      )}
    </Screen>
  )
}
