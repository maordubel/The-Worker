import type { Metadata } from 'next'

import { Screen } from '@/components/ui/Screen'
import {
  dealRoyalRumbleDraft,
  royalRumblePlayerCount,
  type RoyalRumbleDraft,
} from '@/lib/game/royal-rumble'
import { t } from '@/lib/royal-rumble/i18n'
import { roundFrom } from '@/lib/rotation/round'
import { RoyalRumbleChallenge } from './RoyalRumbleChallenge'
import { RoyalRumbleRun } from './RoyalRumbleRun'

export const metadata: Metadata = {
  title: t('title'),
  description: t('description'),
}

function minimumDraftCost(draft: RoyalRumbleDraft): number {
  return draft.slots.reduce((sum, slot) => {
    const cheapest = Math.min(...slot.offers.map((player) => player.price))
    return sum + cheapest
  }, 0)
}

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
    <Screen title={t('title')} sub={t('sub')} chrome={false}>
      <RoyalRumbleRun draft={draft} cursor={round.cursor} playerCount={count} />
      <RoyalRumbleChallenge seed={draft.seed} />
    </Screen>
  )
}
