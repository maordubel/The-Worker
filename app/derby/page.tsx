import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { dealQueue, rosterSize } from '@/lib/game/hate'
import { t } from '@/lib/i18n'
import { HateHill } from './HateHill'

/**
 * שער 11 — משחק השנאה.
 *
 * Maor asked for a hatred game and this is a hatred game: king of the hill, ten head to
 * heads, whoever you pick stays on. No right answers and no score. What the app supplies
 * is not a judgement about people — it is the terrace's own charge sheet, every line of
 * it sourced, and a verdict that belongs to whoever played it.
 *
 * The server deals the QUEUE, not the duels: who holds the hill at duel seven depends on
 * what the player did at duel six, so only the order of arrival can be deterministic —
 * and it must be, for a `?seed=` link to hand over the identical run.
 */
export default function HatePage({ searchParams }: { searchParams: { seed?: string } }) {
  const seed = Number(searchParams.seed) || 11
  const { enemies, order } = dealQueue(seed)
  return (
    <Screen title={t('screen.derby.title')} sub={t('screen.derby.sub')} chrome={false}>
      <HateHill enemies={enemies} order={order} seed={seed} rosterSize={rosterSize()} />
      <ReportLink />
    </Screen>
  )
}
