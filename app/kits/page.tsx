import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { archiveShirts } from '@/lib/kit/archive'
import { kitDnaRack } from '@/lib/kit/archive-dna'
import { facetCounts, kitCatalog } from '@/lib/kit/catalog'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'

import { KitDesignerV3 } from './KitDesignerV3'
import { KitWing } from './KitWing'

export const metadata: Metadata = gateMetadata('kits')

export default function KitsPage() {
  const catalog = kitCatalog()
  const rack = kitDnaRack()
  return (
    <Screen title={t('screen.kits.title')} sub={t('screen.kits.sub')}>
      {catalog.length > 0 ? <KitWing catalog={catalog} counts={facetCounts(catalog)} archiveCount={archiveShirts().length} designer={<KitDesignerV3 rack={rack} />} /> : <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />}
      <ReportLink />
    </Screen>
  )
}
