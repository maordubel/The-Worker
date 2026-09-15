import type { Metadata } from 'next'

import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { homeKits } from '@/lib/kit/seasons'
import { DEFAULT_SPEC } from '@/lib/kit/spec'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'
import { MemberBook } from './MemberBook'
import { Standing } from './Standing'

/**
 * שער 10 — המנוי שלך.
 *
 * The card is unchanged and stays first among equals: a member book, deliberately not a
 * scoreboard, with the file number, the punches and the corrections. What sits above it
 * now is the thing that was missing — the STANDING, which reads every gate's finished
 * rounds out of `lib/profile/store.ts` and is the reason this screen is a personal area
 * rather than one gate's souvenir.
 *
 * The tab that points here is labelled המנוי שלך for the same reason: a card is a thing,
 * a membership is a relationship, and this page is now the second one. `screen.tik.title`
 * carries that name, so the tab, the header and the SEO title cannot drift apart.
 */
export const metadata: Metadata = gateMetadata('tik')

export default function TikPage() {
  const shirt = homeKits()[0]?.spec ?? DEFAULT_SPEC
  return (
    <Screen title={t('screen.tik.title')} sub={t('screen.tik.sub')}>
      <p className="mt-stack max-w-prose font-body text-step-0 leading-relaxed text-ink">
        {t('tik.lede')}
      </p>
      <Standing />
      <MemberBook shirt={shirt} />
      <ReportLink />
    </Screen>
  )
}
