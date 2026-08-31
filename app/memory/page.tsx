import { BannerCloth } from '@/components/ui/BannerCloth'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { buildBoard } from '@/lib/game/memory'
import { t } from '@/lib/i18n'
import { MemoryBoard } from './MemoryBoard'

export default function MemoryPage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 7
  const cards = buildBoard(seed)

  return (
    <Screen title={t('screen.memory.title')} sub={t('screen.memory.sub')} night>
      {cards.length >= 4 ? (
        <>
          <MemoryBoard cards={cards} />
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
