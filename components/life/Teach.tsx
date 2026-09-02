'use client'

import { t, type MessageKey } from '@/lib/i18n'

/**
 * השורה היחידה שהמשחק מלמד — and it leaves for good once the player has obeyed it.
 *
 * Two sentences, in this order: how to move, then how to act. Each one disappears the
 * moment the player does the thing, and neither ever comes back — the flags live in the
 * save, so a returning player is not taught to walk again. After the front door there is
 * no teaching at all: the world is the teacher from there on.
 */
export function Teach({ id, touch }: { id: 'move' | 'act'; touch: boolean }) {
  const key = `life.teach.${id}.${touch ? 'touch' : 'desktop'}` as MessageKey
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[62px] z-20 flex justify-center px-gutter">
      <span className="border-hair border-ink bg-ink/85 px-3 py-1.5 font-body text-[11px] leading-none text-sheet">
        <bdi>{t(key)}</bdi>
      </span>
    </div>
  )
}
