import type { Metadata } from 'next'

import { Screen } from '@/components/ui/Screen'
import {
  dealRoyalRumbleDraft,
  royalRumblePlayerCount,
  type RoyalRumbleDraft,
} from '@/lib/game/royal-rumble'
import { roundFrom } from '@/lib/rotation/round'
import { RoyalRumbleChallenge } from './RoyalRumbleChallenge'
import { RoyalRumbleRun } from './RoyalRumbleRun'

export const metadata: Metadata = {
  title: 'רויאל ראמבל',
  description: 'בנה חמישיית הפועל בתקציב מוגבל, חשוף את היריבה וצא לקרב 5 על 5.',
}

function minimumDraftCost(draft: RoyalRumbleDraft): number {
  return draft.slots.reduce((sum, slot) => {
    const cheapest = Math.min(...slot.offers.map((player) => player.price))
    return sum + cheapest
  }, 0)
}

/**
 * A random draft is fun only when it can actually be completed. If a seed happens to
 * deal five expensive groups whose cheapest legal five exceed €15M, advance through a
 * deterministic sequence of seeds until a solvable board is found. The resolved seed
 * travels with the draft, so server validation and the pre-dealt opponent stay exact.
 */
function solvableDraft(seed: number): RoyalRumbleDraft {
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const candidate = dealRoyalRumbleDraft((seed + attempt * 7919) >>> 0)
    if (
      candidate.slots.every((slot) => slot.offers.length > 0) &&
      minimumDraftCost(candidate) <= candidate.budget
    ) {
      return candidate
    }
  }

  // With the archive's price distribution this should never be reached, but returning a
  // deterministic final board is safer than throwing a production page during a data
  // migration. CI/tests can flag the archive distribution separately.
  return dealRoyalRumbleDraft(seed)
}

export default function RoyalRumblePage({
  searchParams,
}: {
  searchParams: { seed?: string; r?: string }
}) {
  const round = roundFrom(searchParams)
  const draft = solvableDraft(round.seed)
  const count = royalRumblePlayerCount()

  return (
    <Screen title="רויאל ראמבל" sub="5 נגד 5 · תקציב 15 מיליון · הציון האמיתי נשאר סודי" chrome={false}>
      <RoyalRumbleRun draft={draft} cursor={round.cursor} playerCount={count} />
      <RoyalRumbleChallenge seed={draft.seed} />
    </Screen>
  )
}
