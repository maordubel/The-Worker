import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealKitRound, kitPuzzleCount } from '@/lib/game/kitBuild'
import { KIT_ROUND } from '@/lib/game/kit-build-run'
import { roundFrom } from '@/lib/rotation/round'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'

import { KitGameRunV3 } from './KitGameRunV3'

export const metadata: Metadata = gateMetadata('kits-build')

export default function KitGamePage({ searchParams }: { searchParams: { seed?: string; r?: string } }) {
  const round = roundFrom(searchParams)
  const puzzles = dealKitRound(round.seed, round.cursor)
  return (
    <Screen title={t('screen.kitgame.title')} sub={t('screen.kitgame.sub')} chrome={false}>
      {kitPuzzleCount() >= KIT_ROUND ? <><KitGameRunV3 puzzles={puzzles} seed={round.seed} cursor={round.cursor} /><ReportLink /></> : <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />}
    </Screen>
  )
}
