import type { Metadata } from 'next'

import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { pickerRoster } from '@/lib/archive/player-master'
import { formationList, rosterIndex } from '@/lib/game/allTimeXI'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'
import { shirtBoard } from '@/lib/xi/board'
import type { XITab } from '@/lib/xi/store'
import { XIBuilder } from './XIBuilder'

/**
 * שער 1 — הרכב כל הזמנים, free play.
 *
 * The quiz version — assemble the exact XI that started a given match — lives at
 * `/lineup`. This one has no right answer at all, which is the point: it is the
 * argument, not the exam.
 *
 * **`?tab=worst` is read here**, and it is the only parameter this route accepts. A
 * shared worst eleven has to open on the sheet it is about; a link that lands on the
 * other tab is the same small lie as a `?seed=` on a page that deals no round
 * (rule 19). There is still no seed: gate 1 deals nothing.
 */
export const metadata: Metadata = gateMetadata('xi')

export default function XIPage({
  searchParams,
}: {
  searchParams?: { tab?: string | string[] }
}) {
  const asked = Array.isArray(searchParams?.tab) ? searchParams?.tab[0] : searchParams?.tab
  const tab: XITab = asked === 'worst' ? 'worst' : 'best'
  const roster = rosterIndex()

  return (
    <Screen title={t('screen.xi.title')} sub={t('screen.xi.sub')}>
      <p className="mt-stack max-w-prose font-body text-step-0 leading-relaxed text-ink">
        {t('xi.lede')}
      </p>
      <XIBuilder
        formations={formationList()}
        roster={roster}
        shirts={shirtBoard(roster)}
        // the six slugs a reviewed merge retired (21.9.2026): a sheet saved under one of
        // them still opens, on the id it now belongs to
        slugAliases={pickerRoster().slugAliases}
        tab={tab}
      />
      <ReportLink />
    </Screen>
  )
}
