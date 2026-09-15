import { Screen } from '@/components/ui/Screen'
import { ReportLink } from '@/components/ui/ReportLink'
import { t } from '@/lib/i18n'

import { CountBoard } from './CountBoard'

/**
 * שער 7, לוח הספירה — reachable only from a sealed slip.
 *
 * There is no server work here and no seed in the URL: the count board reads the same
 * local store the ballot does, entirely client-side, and this file exists only to give
 * that client component the screen shell — the one `<SignPlate>` (rule: "one per
 * screen"), the reading-page ad slot `<Screen>` already reserves, and the footer.
 *
 * Not listed in `lib/gates.ts` — it is a room behind gate 7, reached by the "לוח
 * הספירה" link on a sealed slip, the same way `/derby/file` sits behind gate 11
 * without a gate of its own.
 */
export default function CountBoardPage() {
  return (
    <Screen title={t('screen.board.title')} sub={t('screen.board.sub')}>
      <CountBoard />
      <ReportLink />
    </Screen>
  )
}
