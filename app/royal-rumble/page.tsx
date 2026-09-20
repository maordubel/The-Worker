import type { Metadata } from 'next'

import { Screen } from '@/components/ui/Screen'
import { dealRoyalRumbleDraft, royalRumblePlayerCount, type RoyalRumbleDraft } from '@/lib/game/royal-rumble'
import { alternateRoyalRumbleOfferSeed, royalRumbleMatchSeed } from '@/lib/game/royal-rumble-seeds'
import { homeKits } from '@/lib/kit/seasons'
import { t } from '@/lib/royal-rumble/i18n'
import { roundFrom } from '@/lib/rotation/round'
import { RoyalRumbleChallenge } from './RoyalRumbleChallenge'
import { RoyalRumbleMatchFX } from './RoyalRumbleMatchFX'
import { RoyalRumbleMode } from './RoyalRumbleMode'

export const metadata: Metadata = { title: t('title'), description: t('description') }

function minimumDraftCost(draft: RoyalRumbleDraft): number {
  return draft.slots.reduce((sum, slot) => sum + Math.min(...slot.offers.map((player) => player.price)), 0)
}
function usableDraft(draft: RoyalRumbleDraft): boolean {
  return draft.slots.every((slot) => slot.offers.length > 0) && minimumDraftCost(draft) <= draft.budget
}
function pairedDrafts(seed: number): { draft: RoyalRumbleDraft; shuffleDraft: RoyalRumbleDraft } {
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const offerSeed = (seed + attempt * 7919) >>> 0
    const shuffleSeed = alternateRoyalRumbleOfferSeed(offerSeed)
    const draft = dealRoyalRumbleDraft(offerSeed)
    const shuffleDraft = dealRoyalRumbleDraft(shuffleSeed)
    if (usableDraft(draft) && usableDraft(shuffleDraft)) return { draft, shuffleDraft }
  }
  const draft = dealRoyalRumbleDraft(seed >>> 0)
  return { draft, shuffleDraft: dealRoyalRumbleDraft(alternateRoyalRumbleOfferSeed(draft.seed)) }
}

export default function RoyalRumblePage({ searchParams }: { searchParams: { seed?: string; r?: string; room?: string } }) {
  const round = roundFrom(searchParams)
  const { draft, shuffleDraft } = pairedDrafts(round.seed)
  const matchSeed = royalRumbleMatchSeed(draft.seed)
  const count = royalRumblePlayerCount()
  const kits = homeKits().map(({ seasonLabel, spec }) => ({ seasonLabel, spec }))
  return (
    <Screen title={t('title')} sub={t('sub')} chrome={false}>
      <RoyalRumbleMatchFX />
      <RoyalRumbleMode draft={draft} shuffleDraft={shuffleDraft} matchSeed={matchSeed} cursor={round.cursor} playerCount={count} kits={kits} initialRoomCode={searchParams.room} />
      <RoyalRumbleChallenge seed={draft.seed} />
    </Screen>
  )
}
