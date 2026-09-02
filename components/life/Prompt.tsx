'use client'

import { t, type MessageKey } from '@/lib/i18n'

/**
 * מה יקרה אם תלחץ — the whole interaction language, in one chip.
 *
 * The first build showed `לגעת`, which tells a player nothing: not what the thing is,
 * not what will happen, not which button. This says the verb and the name — `דבר עם
 * קובי`, `לך לרחוב`, `קח את הבקבוקים` — with the key cap beside it on a desktop, and it
 * is the same chip everywhere in the game, so learning it once is learning it for good.
 */
export function Prompt({ verb, label, touch }: { verb: string; label: string; touch: boolean }) {
  const key = `life.verb.${verb}` as MessageKey
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-gutter"
      data-life="prompt"
    >
      <span className="flex items-center gap-2 border-hair border-ink bg-sheet/95 px-2 py-1">
        {!touch && (
          <span
            className="flex h-5 w-5 items-center justify-center border-hair border-ink bg-ink font-mono text-[11px] leading-none tabular-nums text-sheet"
            dir="ltr"
          >
            {t('life.key.action')}
          </span>
        )}
        <span className="font-body text-[12px] leading-none text-ink">
          <bdi>
            {t(key)} {label}
          </bdi>
        </span>
      </span>
    </div>
  )
}
