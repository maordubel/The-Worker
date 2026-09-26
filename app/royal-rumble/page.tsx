import type { Metadata } from 'next'

import { Screen } from '@/components/ui/Screen'
import { pairedRoyalRumbleDrafts, royalRumblePlayerCount } from '@/lib/game/royal-rumble'
import { royalRumbleMatchSeed } from '@/lib/game/royal-rumble-seeds'
import { allPlayers } from '@/lib/archive/player-master'
import { homeKits } from '@/lib/kit/seasons'
import { wardrobe } from '@/lib/kit/playerShirt'
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
  // every man's REAL shirt, by any slug he answers to (delta 88 — "אסור שיהיה שחקן ללא חולצה")
  // V2 wraps every card as `{ player, offeredAs }` (spec §5) — the wardrobe wants the man
  const dealt = [...draft.slots, ...shuffleDraft.slots].flatMap((slot) => slot.offers.map((offer) => offer.player))
  const rows = new Map<string, { key: string; player: string | ReturnType<typeof allPlayers>[number] }>()
  for (const player of allPlayers()) for (const key of [player.slug, ...player.slugAliases]) rows.set(key, { key, player })
  for (const player of dealt) if (!rows.has(player.slug)) rows.set(player.slug, { key: player.slug, player: player.nameHe })
  const looks = wardrobe(rows.values())
  return (
    <Screen title={t('title')} sub={t('sub')} chrome={false} stage>
      <RoyalRumbleMatchFX />
      <RoyalRumbleMode draft={draft} shuffleDraft={shuffleDraft} matchSeed={matchSeed} cursor={round.cursor} playerCount={count} kits={kits} looks={looks} initialRoomCode={searchParams.room} />
      <RoyalRumbleChallenge seed={draft.seed} />
    </Screen>
  )
}
