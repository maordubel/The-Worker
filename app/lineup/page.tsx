import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { archive } from '@/lib/game/archive'
import { t } from '@/lib/i18n'
import { LineupBoard } from './LineupBoard'

/**
 * There is no verified starting XI in the archive yet — the squad and lineup files
 * ship empty by design (docs/04-verified-research.md). The board is fully playable as
 * a free build; verification switches on the moment a verified XI is imported.
 */
export default function LineupPage() {
  const players = archive.people.map((person) => person.fullNameHe)
  const verifiable = false

  return (
    <Screen title={t('screen.lineup.title')} sub={t('screen.lineup.sub')}>
      {players.length > 0 ? (
        <>
          <p className="mt-stack font-body text-step-0 text-muted">{t('lineup.note')}</p>
          <LineupBoard players={players} verifiable={verifiable} />
          <ReportLink />
        </>
      ) : (
        <EmptyState title={t('empty.lineup')} body={t('empty.lineup.body')} />
      )}
    </Screen>
  )
}
