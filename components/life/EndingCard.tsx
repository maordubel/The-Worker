'use client'

import { t } from '@/lib/i18n'

/**
 * סוף היום — not a score screen.
 *
 * Brief §25 is explicit that the reward is INDEPENDENCE and that reducing it to a stat
 * popup is the failure mode. So this card says what happened and what is now in the red
 * box, and it counts nothing. The numbers the day moved stay where they belong: inside
 * the life, invisible, changing what people do next time.
 */
export function EndingCard({
  titleHe,
  bodyHe,
  memoryHe,
  onClose,
}: {
  titleHe: string
  bodyHe: string
  memoryHe: string
  onClose: () => void
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-ink/85 p-gutter">
      <div className="w-full max-w-md border-rule border-sheet bg-ink">
        <div className="px-5 pb-5 pt-6">
          <div className="h-[6px] w-16 bg-red" aria-hidden="true" />
          <h2 className="mt-3 font-display text-step-3 leading-tight text-sheet">
            <bdi>{titleHe}</bdi>
          </h2>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-concrete">
            <bdi>{bodyHe}</bdi>
          </p>
          <p className="mt-4 border-t-hair border-concrete/30 pt-3 font-body text-[13px] leading-relaxed text-sheet">
            <bdi>{memoryHe}</bdi>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 flex min-h-tap w-full items-center justify-center border-rule border-sheet bg-red px-4 transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none"
          >
            <span className="font-display text-[15px] text-sheet">{t('life.ending.home')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
