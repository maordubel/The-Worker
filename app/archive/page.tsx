import type { Metadata } from 'next'

import { ArchiveApp } from '@/components/archive/ArchiveApp'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { decades } from '@/lib/archive/graph'
import { archiveFigures, detailOf, longDateHe, todayDecks } from '@/lib/archive/wing'
import { t } from '@/lib/i18n'
import { roundFrom } from '@/lib/rotation/round'
import { gateMetadata } from '@/lib/seo'

/**
 * שער 12 — הארכיון החי (brief §22; prototype v10, 21.9.2026).
 *
 * The wing is one screen over the Entity Graph: five Today chips, a swipe deck, a dock
 * (היום · זמן · חפירה · חיפוש · שלי), a box to dig in, one search, a drawer that prints
 * only what the archive holds, a deterministic rabbit hole and a trail.
 *
 * Resolved HERE, on the server, and handed down as card projections: the date (a
 * read-model that reads the clock cannot be tested), the five deals (from `?seed=` and
 * `?r=`, rule 24), and `?at=<id>` — a deep link from `/hapoel`, gate 13 or gate 10 that
 * opens one entity's drawer, legacy ids resolved (`euro:`, `kit:<maker>:<from>`, a
 * roster slug). The graph itself never reaches the browser.
 */
export const metadata: Metadata = gateMetadata('archive')

export default function ArchivePage({
  searchParams,
}: {
  searchParams: { seed?: string; r?: string; at?: string }
}) {
  const round = roundFrom(searchParams)
  const today = new Date().toISOString().slice(0, 10)
  const at = typeof searchParams.at === 'string' ? searchParams.at.slice(0, 160) : null
  const initial = at ? detailOf(at) : null
  const figures = archiveFigures()

  return (
    <Screen title={t('screen.archive.title')} sub={t('screen.archive.sub')}>
      <ArchiveApp
        decks={todayDecks(today, round.seed, round.cursor)}
        todayHe={longDateHe(today)}
        decades={decades()}
        seed={round.seed}
        cursor={round.cursor}
        initial={initial}
        atMissing={at !== null && initial === null}
        figures={t('archive.figures', {
          columns: String(figures.columns),
          matches: String(figures.datedMatches),
          from: figures.earliest ? figures.earliest.slice(0, 4) : '—',
          to: figures.latest ? figures.latest.slice(0, 4) : '—',
        })}
      />
      <ReportLink />
    </Screen>
  )
}
