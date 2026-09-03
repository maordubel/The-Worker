import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { homeKits } from '@/lib/kit/seasons'
import { DEFAULT_SPEC } from '@/lib/kit/spec'
import { t } from '@/lib/i18n'
import { MemberBook } from './MemberBook'

/** שער 10 — התיק שלי. A member book, deliberately not a scoreboard. */
export default function TikPage() {
  const shirt = homeKits()[0]?.spec ?? DEFAULT_SPEC
  return (
    <Screen title={t('screen.tik.title')} sub={t('screen.tik.sub')}>
      <p className="mt-stack max-w-prose font-body text-step-0 leading-relaxed text-ink">
        {t('tik.lede')}
      </p>
      <MemberBook shirt={shirt} />
      <ReportLink />
    </Screen>
  )
}
