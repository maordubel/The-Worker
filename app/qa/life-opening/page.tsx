import { notFound } from 'next/navigation'

import { Preview } from './Preview'
import { resolvePrologueAnchor } from '@/lib/life/anchor-server'

/**
 * QA only — the opening sequence, without clearing session storage to see it again.
 *
 * Same discipline as the other harnesses (rule 19): `notFound()` in production, built from
 * the real component and the real anchor. Beat three prints the 1983 cup final by resolving
 * that anchor, so if this page shows a date, the game shows the same date; if the archive
 * loses the row, this page loses the line and so does the game.
 */
export const dynamic = 'force-dynamic'

export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <div className="relative h-dvh w-full">
      <Preview anchor={resolvePrologueAnchor()} />
    </div>
  )
}
