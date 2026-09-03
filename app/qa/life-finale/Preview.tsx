'use client'

import { StageFinale } from '@/components/life/StageFinale'
import type { LifeBusEvents } from '@/lib/life/runtime/bus'

/** The client half: the finale needs a handler, and a server component may not pass one. */
export function Preview({ finale }: { finale: NonNullable<LifeBusEvents['finale']> }) {
  return <StageFinale finale={finale} onContinue={() => {}} />
}
