import { notFound } from 'next/navigation'

import { Preview } from './Preview'
import { resolveChapterAnchor } from '@/lib/life/anchor-server'
import { buildFinale } from '@/lib/life/finale'
import { apply, emptyState } from '@/lib/life/events'
import { DEFAULT_IDENTITY } from '@/lib/life/content/chapter1986'

/**
 * QA only — the end of Stage A, without playing ninety minutes to reach it.
 *
 * Same idea as `/qa/story` (rule 19): a screen that exists so a thing can be LOOKED at
 * during development, `notFound()` in production, and built from the real component with
 * real data rather than from a mock. The three afternoons below are the three the finale
 * distinguishes — saw the goal, got in late, never got in — so a change that flattens
 * them into one is visible here in one screen.
 */
export const dynamic = 'force-dynamic'

const RUNS: Array<{ id: string; flags: string[] }> = [
  { id: 'saw-the-goal', flags: ['entry:granted', 'entry:ticket', 'saw:goal', 'went:alone'] },
  { id: 'got-in-late', flags: ['entry:granted', 'arrived:late'] },
  { id: 'never-got-in', flags: [] },
]

export default async function Page({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { run } = await searchParams
  const picked = RUNS.find((entry) => entry.id === run) ?? RUNS[0]!

  let state = emptyState(DEFAULT_IDENTITY, 1986)
  for (const flag of picked.flags) state = apply(state, { t: 'flag.raised', flag })
  const card = buildFinale(state, [])

  return (
    <div className="relative h-dvh w-full">
      <Preview
        finale={{
          anchor: resolveChapterAnchor(),
          titleHe: card.titleHe,
          bodyHe: card.bodyHe,
          becameHe: card.becameHe,
          keptTicket: card.keptTicket,
        }}
      />
    </div>
  )
}
