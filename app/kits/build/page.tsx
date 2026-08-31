import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealKitChallenge } from '@/lib/game/kitChallenge'
import { t } from '@/lib/i18n'
import { KitChallengeBoard } from './KitChallengeBoard'

/** אתגר החולצה — name the maker and the sponsor for a season. */
export default function KitChallengePage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 1
  const challenge = dealKitChallenge(seed)

  return (
    <Screen title={t('screen.kitChallenge.title')} sub={t('screen.kitChallenge.sub')}>
      {challenge ? (
        <>
          <p className="mt-stack font-body text-step-0 text-muted">{t('kitChallenge.note')}</p>
          <KitChallengeBoard challenge={challenge} seed={seed} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />
      )}
    </Screen>
  )
}
