import { Screen } from '@/components/ui/Screen'
import { ReportLink } from '@/components/ui/ReportLink'
import { ROUND_SIZE, dealFile, dealPairs, fileSize } from '@/lib/game/blackfile'
import { t } from '@/lib/i18n'
import { BlackFile } from './BlackFile'

/**
 * שער 11 — התיק השחור.
 *
 * The away end. The one screen in the product printed in navy with no vermilion in it,
 * because whoever walks in is standing in somebody else's end.
 */
export default function DerbyPage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 11
  return (
    <Screen title={t('screen.derby.title')} sub={t('screen.derby.sub')}>
      <BlackFile
        cards={dealFile(seed)}
        pairs={dealPairs(seed)}
        seed={seed}
        total={ROUND_SIZE}
        fileSize={fileSize()}
      />
      <ReportLink />
    </Screen>
  )
}
