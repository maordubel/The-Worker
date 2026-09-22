import type { Metadata } from 'next'

import { Screen } from '@/components/ui/Screen'
import { pairedRoyalRumbleDrafts, royalRumblePlayerCount } from '@/lib/game/royal-rumble'
import { royalRumbleMatchSeed } from '@/lib/game/royal-rumble-seeds'
import { homeKits } from '@/lib/kit/seasons'
import { t } from '@/lib/royal-rumble/i18n'
import { roundFrom } from '@/lib/rotation/round'
import { RoyalRumbleChallenge } from './RoyalRumbleChallenge'
import { RoyalRumbleMatchFX } from './RoyalRumbleMatchFX'
import { RoyalRumbleMode } from './RoyalRumbleMode'

export const metadata: Metadata = { title: t('title'), description: t('description') }

export default function RoyalRumblePage({ searchParams }: { searchParams: { seed?: string; r?: string; room?: string } }) {
  const round = roundFrom(searchParams)
  const { draft, shuffleDraft } = pairedRoyalRumbleDrafts(round.seed)
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
