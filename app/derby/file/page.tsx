import { Screen } from '@/components/ui/Screen'
import { ReportLink } from '@/components/ui/ReportLink'
import { ROUND_SIZE, dealFile, dealPairs, fileSize } from '@/lib/game/blackfile'
import { t } from '@/lib/i18n'
import { BlackFile } from './BlackFile'

/**
 * שער 11, מערכה שנייה — התיק השחור.
 *
 * The hate bracket is the gate's front room and this is what is behind it: once you
 * have named your number one, the file asks whether you actually know the record. Two
 * acts in one gate is the answer to "it's finished after one game" — the second act is
 * only worth playing BECAUSE the first one got you angry.
 *
 * Navy only. No vermilion on this screen: whoever walks in is standing in somebody
 * else's end.
 */
export default function BlackFilePage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 11
  return (
    <Screen title={t('screen.file.title')} sub={t('screen.file.sub')}>
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
