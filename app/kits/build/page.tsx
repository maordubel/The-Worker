import type { Metadata } from 'next'

import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'

import { KitGameRunV13 } from './KitGameRunV13'

export const metadata: Metadata = gateMetadata('kits-build')

export default function KitGamePage() {
  return (
    <Screen title={t('screen.kitgame.title')} sub={t('screen.kitgame.sub')} chrome={false}>
      <KitGameRunV13 />
      <ReportLink />
    </Screen>
  )
}
