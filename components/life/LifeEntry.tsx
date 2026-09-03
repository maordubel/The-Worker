import Link from 'next/link'

import { t } from '@/lib/i18n'

/**
 * הכניסה ל-THE WORKER LIFE — a way in, not a gate.
 *
 * The gate plan is Maor's and its numbers are Bloomfield's (rule 24). THE WORKER LIFE is
 * not one of the thirteen and must not quietly become gate 9 or 12, so it hangs above the
 * wall as its own thing: a full-width plate in the poster face, marked as the vertical
 * slice it currently is.
 */
export function LifeEntry() {
  return (
    <Link
      href="/life"
      className="group relative block border-rule border-ink bg-ink transition-transform duration-press ease-stamp active:scale-[.99] motion-reduce:transition-none"
    >
      <div className="flex items-center justify-between gap-3 border-b-hair border-concrete/30 px-3 py-1.5">
        <span className="font-display text-[13px] leading-none text-sheet">{t('life.entry.kicker')}</span>
        <span className="font-latin text-[8.5px] font-bold tracking-[0.2em] text-red" dir="ltr">
          {t('life.entry.slice')}
        </span>
      </div>

      <div className="px-3 pb-4 pt-4">
        <p className="font-poster text-[38px] leading-none text-sheet sm:text-[52px]" dir="ltr">
          THE WORKER LIFE
        </p>
        <p className="mt-2 max-w-prose font-body text-[12px] leading-snug text-concrete">
          <bdi>{t('life.entry.line')}</bdi>
        </p>
        <span className="mt-3 inline-flex items-center gap-2 bg-red px-3 py-1.5">
          <span className="font-display text-[13px] leading-none text-sheet">{t('life.entry.cta')}</span>
          <span className="h-2 w-2 bg-sheet" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
