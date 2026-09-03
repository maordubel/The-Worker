import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { facetCounts, kitCatalog } from '@/lib/kit/catalog'
import { homeKits } from '@/lib/kit/seasons'
import { t } from '@/lib/i18n'

import { KitDesigner } from './KitDesigner'
import { KitWing } from './KitWing'

/**
 * שער 5 — אגף המדים: האוסף, הכרטיס והמעצב.
 *
 * The catalog is built on the SERVER, from the same 33 archive rows gate 4 deals from
 * (rule 1 — a mode is a read-model, never its own dataset). What crosses to the client
 * is a projection with the labels a card needs; `lib/game/archive.ts` stays where it is.
 *
 * The designer is passed down as a slot rather than imported by the wing, so the wing —
 * which owns the collection and the card — does not have to know that a third view
 * exists or what renders it.
 */
export default function KitsPage() {
  const catalog = kitCatalog()

  return (
    <Screen title={t('screen.kits.title')} sub={t('screen.kits.sub')}>
      {catalog.length > 0 ? (
        <KitWing
          catalog={catalog}
          counts={facetCounts(catalog)}
          designer={<KitDesigner rack={homeKits()} />}
        />
      ) : (
        <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />
      )}
      <ReportLink />
    </Screen>
  )
}
