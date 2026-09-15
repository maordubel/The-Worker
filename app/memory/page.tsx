import type { Metadata } from 'next'

import { BannerCloth } from '@/components/ui/BannerCloth'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { buildBoard } from '@/lib/game/memory'
import { roundFrom } from '@/lib/rotation/round'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'
import { MemoryBoard } from './MemoryBoard'

/** שער 6 — משחק הזיכרון: כל צמד הוא שתי פנים לעובדה אחת מהארכיון. */
export const metadata: Metadata = gateMetadata('memory')

export default function MemoryPage({
  searchParams,
}: {
  searchParams: { seed?: string; r?: string }
}) {
  const round = roundFrom(searchParams)
  const cards = buildBoard(round.seed, 6, round.cursor)

  return (
    <Screen title={t('screen.memory.title')} sub={t('screen.memory.sub')} night>
      {cards.length >= 4 ? (
        <>
          <MemoryBoard cards={cards} seed={round.seed} cursor={round.cursor} />
          <div className="mt-stack">
            <BannerCloth>{t('slogan.collective')}</BannerCloth>
          </div>
        </>
      ) : (
        <EmptyState title={t('empty.memory')} body={t('empty.memory.body')} />
      )}
    </Screen>
  )
}
