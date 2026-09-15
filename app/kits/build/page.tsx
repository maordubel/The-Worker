import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealKitRound, kitPuzzleCount } from '@/lib/game/kitBuild'
import { KIT_ROUND } from '@/lib/game/kit-build-run'
import { t } from '@/lib/i18n'

import { KitGameRun } from './KitGameRun'

/**
 * שער 4 — משחק המדים.
 *
 * The season is the question and the kit is the answer, so the shirt leaves the server
 * already stripped of all five graded parts and the grading happens in a server action
 * from the seed (rule 4). What the client gets is a blank shirt, a year, and fifteen
 * parts with hashed ids — none of which says which one is right.
 */
export default function KitGamePage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 1
  const puzzles = dealKitRound(seed)

  return (
    <Screen title={t('screen.kitgame.title')} sub={t('screen.kitgame.sub')} chrome={false}>
      {kitPuzzleCount() >= KIT_ROUND ? (
        <>
          <KitGameRun puzzles={puzzles} seed={seed} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />
      )}
    </Screen>
  )
}
