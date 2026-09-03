import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { formationList, rosterIndex } from '@/lib/game/allTimeXI'
import { t } from '@/lib/i18n'
import { XIBuilder } from './XIBuilder'

/**
 * שער 1 — הרכב כל הזמנים, free play.
 *
 * The quiz version — assemble the exact XI that started a given match — lives at
 * `/lineup`. This one has no right answer at all, which is the point: it is the
 * argument, not the exam.
 */
export default function XIPage() {
  return (
    <Screen title={t('screen.xi.title')} sub={t('screen.xi.sub')}>
      <p className="mt-stack max-w-prose font-body text-step-0 leading-relaxed text-ink">
        {t('xi.lede')}
      </p>
      <XIBuilder formations={formationList()} roster={rosterIndex()} />
      <ReportLink />
    </Screen>
  )
}
