import type { Metadata } from 'next'

import { Screen } from '@/components/ui/Screen'
import { dealRoyalRumbleDraft, royalRumblePlayerCount } from '@/lib/game/royal-rumble'
import { roundFrom } from '@/lib/rotation/round'
import { RoyalRumbleRun } from './RoyalRumbleRun'

export const metadata: Metadata = {
  title: 'רויאל ראמבל',
  description: 'בנה חמישיית הפועל בתקציב מוגבל, חשוף את היריבה וצא לקרב 5 על 5.',
}

export default function RoyalRumblePage({
  searchParams,
}: {
  searchParams: { seed?: string; r?: string }
}) {
  const round = roundFrom(searchParams)
  const draft = dealRoyalRumbleDraft(round.seed)
  const count = royalRumblePlayerCount()

  return (
    <Screen title="רויאל ראמבל" sub="5 נגד 5 · תקציב 15 מיליון · הציון האמיתי נשאר סודי" chrome={false}>
      <RoyalRumbleRun draft={draft} cursor={round.cursor} playerCount={count} />
    </Screen>
  )
}
