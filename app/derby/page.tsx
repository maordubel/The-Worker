import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealBracket, rosterSize } from '@/lib/game/hate'
import { t } from '@/lib/i18n'
import { HateBracket } from './HateBracket'

/**
 * שער 11 — משחק השנאה.
 *
 * Maor asked for a hatred game and this is a hatred game: eight enemies, a knockout, no
 * right answers. What the app supplies is not a judgement about people — it is the
 * terrace's own charge sheet, every line of it sourced, and a verdict that belongs to
 * whoever played it.
 */
export default function HatePage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 11
  const { enemies, duels } = dealBracket(seed)
  return (
    <Screen title={t('screen.derby.title')} sub={t('screen.derby.sub')}>
      <p className="mt-stack max-w-prose font-body text-step-0 leading-relaxed text-ink">
        {t('hate.lede')}
      </p>
      <HateBracket enemies={enemies} opening={duels} seed={seed} rosterSize={rosterSize()} />
      <ReportLink />
    </Screen>
  )
}
