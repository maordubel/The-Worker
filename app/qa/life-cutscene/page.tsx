import { notFound } from 'next/navigation'

import { Preview } from './Preview'
import { resolveChapterAnchor } from '@/lib/life/anchor-server'
import { CUTSCENES, cutsceneCard } from '@/lib/life/cutscenes'

/**
 * QA only — the archival cutscene, without playing an afternoon to reach it.
 *
 * Same discipline as `/qa/life-finale` and `/qa/story` (rule 19): a screen that exists so
 * a thing can be LOOKED at during development, `notFound()` in production, and built from
 * the real component and the real config rather than from a mock. The card around the
 * film is resolved from the archive by `cutsceneCard`, exactly as the game resolves it,
 * so a page that prints the wrong date here is printing the wrong date in the game too.
 *
 * `?id=` picks a cutscene once there is more than one. There is one.
 *
 * **What this page cannot tell you.** Whether the video is embeddable. YouTube reports
 * that only to a real browser on a real network, and the honest answer to "does the 1986
 * film play" is: open this page and look. What the page CAN tell you is that every way it
 * can fail lands somewhere sensible, which is the part that is this repository's problem.
 */
export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { id } = await searchParams
  const scene = (id ? CUTSCENES[id] : null) ?? Object.values(CUTSCENES)[0]
  if (!scene) notFound()

  return (
    <div className="relative h-dvh w-full">
      <Preview scene={scene} card={cutsceneCard(scene, resolveChapterAnchor())} />
    </div>
  )
}
