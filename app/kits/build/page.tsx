import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { dealKitRound, kitPuzzleCount, KIT_ROUND } from '@/lib/game/kitBuild'
import { t } from '@/lib/i18n'
import { roundFrom } from '@/lib/rotation/round'
import { gateMetadata } from '@/lib/seo'

import { KitGameRun } from './KitGameRun'

export const metadata: Metadata = gateMetadata('kits-build')

/**
 * שער 4 — חידון המדים. The whole glass belongs to the run (rule 21): no masthead, no tab bar,
 * one full-bleed screen the height of the phone (Maor's V14 layout). The round is dealt here, on
 * the server, and nothing the client receives says which option is right (rule 4).
 */
export default function KitGamePage({ searchParams }: { searchParams: { seed?: string; r?: string } }) {
  const round = roundFrom(searchParams)
  if (kitPuzzleCount() < KIT_ROUND) {
    return (
      <Screen title={t('screen.kitgame.title')} sub={t('screen.kitgame.sub')} chrome={false}>
        <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />
      </Screen>
    )
  }
  const puzzles = dealKitRound(round.seed, round.cursor)
  return (
    <Screen title={t('screen.kitgame.title')} sub={t('screen.kitgame.sub')} chrome={false} fullBleed>
      <KitGameRun puzzles={puzzles} seed={round.seed} cursor={round.cursor} />
    </Screen>
  )
}
