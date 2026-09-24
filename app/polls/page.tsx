import type { Metadata } from 'next'

import { Screen } from '@/components/ui/Screen'
import { ReportLink } from '@/components/ui/ReportLink'
import { pickerRoster } from '@/lib/archive/player-master'
import { rosterIndex } from '@/lib/game/allTimeXI'
import { homeKits } from '@/lib/kit/seasons'
import { DEFAULT_SPEC } from '@/lib/kit/spec'
import { shirtBoard } from '@/lib/xi/board'
import { numberBoard } from '@/lib/polls/wore-server'
import { gateMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'

import { BallotSheet } from './BallotSheet'

export const metadata: Metadata = gateMetadata('polls')

/**
 * שער 7 — אגף הסקרים.
 *
 * The roster is built on the server, where the archive lives, and handed down as names
 * only — the same payload the all-time XI takes. Nothing about a ballot needs grading,
 * so there is no server action here and no seed: this gate has no right answer, which
 * is the entire point of it.
 *
 * Two more payloads go down with it, and neither is new work: `shirtBoard` is the join
 * gate 1 already receives (`lib/xi/board.ts` — the seasons sent once, a player as two
 * fields), which is what lets the slip print the shirt a man is actually identified
 * with rather than a guess; and the club's own home kit, which is the garment the
 * supporter's own name and number are lettered onto. Both are reads of
 * `lib/kit/playerKit.ts` and `lib/kit/seasons.ts` — this gate builds no shirt of its own
 * and keeps no second roster (rule 1).
 *
 * And two since 21.9.2026: who wore each number, season-bound and sourced (the number
 * question's reaction — `lib/polls/wore-server.ts`), and the retired-slug map, so the
 * voter's own gate 1 eleven can be offered as shortcuts whatever key it was saved under.
 */
export default function PollsPage() {
  const roster = rosterIndex()
  return (
    <Screen title={t('screen.polls.title')} sub={t('screen.polls.sub')} stage>
      <BallotSheet
        roster={roster}
        shirts={shirtBoard(roster)}
        shirt={homeKits()[0]?.spec ?? DEFAULT_SPEC}
        numbers={numberBoard()}
        slugAliases={pickerRoster().slugAliases}
      />
      <div className="mt-2 hidden shrink-0 md:block">
        <ReportLink />
      </div>
    </Screen>
  )
}
