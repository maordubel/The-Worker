import type { Metadata } from 'next'

import { Num } from '@/components/ui/Num'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import {
  DEFAULT_FORMATION,
  FORMATIONS,
  dealChallenge,
  freeBuildBank,
  hasVerifiedLineup,
} from '@/lib/game/lineup'
import { roundFrom } from '@/lib/rotation/round'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'
import { LineupBoard } from './LineupBoard'

/**
 * Screen 5 — the pitch.
 *
 * With a verified XI in `content/manual/lineups.json` this is a graded challenge.
 * Without one it is still a working board: the empty state says why, and no invented
 * lineup is ever shown as history.
 */
export const metadata: Metadata = gateMetadata('lineup')

export default function LineupPage({
  searchParams,
}: {
  searchParams: { seed?: string; r?: string }
}) {
  const round = roundFrom(searchParams)
  const challenge = dealChallenge(round.seed, round.cursor)
  const graded = hasVerifiedLineup()
  const formation = challenge?.formation ?? (FORMATIONS[DEFAULT_FORMATION] as (typeof FORMATIONS)[string])

  return (
    <Screen title={t('screen.lineup.title')} sub={t('screen.lineup.sub')}>
      <p className="mt-stack font-sign text-step-1 leading-tight text-ink">
        {challenge?.titleHe ?? t('lineup.freeBuild')}
      </p>
      {challenge?.subtitleHe && (
        <p className="mt-1 font-mono text-[11px] text-sign">
          <Num>{challenge.subtitleHe}</Num>
        </p>
      )}

      {challenge?.positionsInferred && (
        <p className="mt-2 font-body text-step--1 text-muted">{t('lineup.inferred')}</p>
      )}

      <LineupBoard
        slots={formation.slots}
        bank={challenge?.bank ?? freeBuildBank()}
        seed={round.seed}
        cursor={round.cursor}
        graded={graded}
        formationName={formation.name}
      />

      <ReportLink />
    </Screen>
  )
}
