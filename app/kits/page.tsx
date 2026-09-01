import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import {
  DEFAULT_KIT,
  DEFAULT_KIT_COLOUR,
  KIT_COLOURS,
  KIT_COLOUR_NAMES,
  drawnKitSeasons,
} from '@/lib/game/kits'
import { t } from '@/lib/i18n'
import { KitDesigner } from './KitDesigner'
import { KitGallery } from './KitGallery'

/** Screen 7 — the verified maker/sponsor strip, then the designer. */
export default function KitsPage() {
  const kits = drawnKitSeasons()

  return (
    <Screen title={t('screen.kits.title')} sub={t('screen.kits.sub')}>
      {kits.length > 0 ? (
        <KitGallery kits={kits} />
      ) : (
        <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />
      )}

      <p className="mt-stack font-body text-step-0 text-muted">{t('kit.note')}</p>

      <KitDesigner
        colours={KIT_COLOURS}
        colourNames={KIT_COLOUR_NAMES}
        fallback={DEFAULT_KIT_COLOUR}
        initial={DEFAULT_KIT}
      />

      <ReportLink />
    </Screen>
  )
}
