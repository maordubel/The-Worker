import type { Metadata } from 'next'

import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { archiveFigures, dealFacts, longDateHe, onThisDay } from '@/lib/archive/wing'
import { t } from '@/lib/i18n'
import { roundFrom } from '@/lib/rotation/round'
import { gateMetadata } from '@/lib/seo'
import { ArchiveWing } from './ArchiveWing'

/**
 * שער 12 — אגף הארכיון.
 *
 * Gate 12 stood empty on the wall until 17.9.2026, for the reason `lib/gates.ts` gives
 * about gate 7: a gate that points at a 404 is worse than a gap. What filled it is the
 * "בשער" corpus — 1,385 press columns, every one with a full ISO date — beside the
 * 3,068 dated matches the archive already held.
 *
 * Two corners, both read-models over the canon (rule 1):
 *   · **היום לפני** — what the archive holds for today's date, or, honestly, nothing.
 *   · **הידעת** — a fact with its source printed beside it (rule 16).
 *
 * The DATE is resolved here, in the route, and handed down — a read-model that reads the
 * clock cannot be tested, and the state this corner most has to get right is the empty
 * one. The deal is resolved here too, from `?seed=` and `?r=`, so the wing deals
 * something different on every entry (rule 24) and the same two numbers always produce
 * the same cards.
 */
export const metadata: Metadata = gateMetadata('archive')

export default function ArchivePage({
  searchParams,
}: {
  searchParams: { seed?: string; r?: string }
}) {
  const round = roundFrom(searchParams)
  const today = new Date().toISOString().slice(0, 10)
  const deal = dealFacts(round.seed, round.cursor)

  return (
    <Screen title={t('screen.archive.title')} sub={t('screen.archive.sub')}>
      <p className="mt-stack max-w-prose font-body text-step-0 leading-relaxed text-ink">
        {t('archive.lede')}
      </p>
      <ArchiveWing
        todayHe={longDateHe(today)}
        day={onThisDay(today)}
        cards={deal.cards}
        cycle={deal.cycle}
        figures={archiveFigures()}
        seed={round.seed}
        cursor={round.cursor}
      />
      <ReportLink />
    </Screen>
  )
}
