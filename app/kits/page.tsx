import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { archiveShirts } from '@/lib/kit/archive'
import { lockedCatalog, facetCounts } from '@/lib/kit/catalog'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'

import { KitWing } from './KitWing'

export const metadata: Metadata = gateMetadata('kits')

/**
 * שער 5 — אגף המדים.
 *
 * What this page sends is a SEASON AND A VARIANT per kit — nothing a Gate 4 puzzle asks for. The
 * shirts the device built are drawn after it proves it built them (`app/kits/actions.ts`); the DNA
 * rack of the studio is the same rows, filtered to the ones whose DNA opened (brief §15–16).
 */
export default function KitsPage() {
  const catalog = lockedCatalog()
  return (
    <Screen title={t('screen.kits.title')} sub={t('screen.kits.sub')}>
      {catalog.length > 0 ? (
        <KitWing catalog={catalog} counts={facetCounts(catalog)} archiveCount={archiveShirts().length} />
      ) : (
        <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />
      )}
      <ReportLink />
    </Screen>
  )
}
