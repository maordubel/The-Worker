'use client'

import { Plate } from '@/components/life/Plate'
import { t } from '@/lib/i18n'

/**
 * יש לך עוד קצת זמן — the card that exists so nobody walks in circles.
 *
 * Maor, 7.9.2026: *"Do not make the player walk in circles for 80 virtual minutes."* The
 * flow layer decides WHEN this may appear (`world/flow.ts`): the day's next beat is
 * waiting for a clock and nothing else, and the room has been quiet for twenty-five game
 * minutes. This is only the offer.
 *
 * Two things it deliberately is not. It is not a skip button: it is worded as time
 * passing, it names what is being waited for when the beat says, and it lands a few
 * minutes short so the beat still plays where it was written to. And it is not modal in
 * spirit — «להסתובב» puts it away and the afternoon stays exactly as it was, because
 * optional content is content and a player who wants to look in the kiosk first is not
 * doing anything wrong.
 */
export function PassTime({
  waitingHe,
  untilHe,
  onStay,
  onPass,
}: {
  /** what the beat calls itself while it waits, when it says */
  waitingHe?: string
  /** the time the jump lands on, already formatted */
  untilHe: string
  onStay: () => void
  onPass: () => void
}) {
  return (
    <div
      dir="rtl"
      data-life="pass"
      className="pointer-events-auto absolute inset-x-0 bottom-[max(18px,env(safe-area-inset-bottom))] z-[58] flex justify-center px-4"
    >
      <Plate tone="sheet" className="flex w-full max-w-[22rem] flex-col gap-2 px-4 py-3 shadow-lamp">
        <span className="font-sign text-[14px] leading-tight text-ink">{t('life.pass.title')}</span>
        <span className="font-body text-[12px] leading-snug text-muted">
          <bdi>{waitingHe ?? t('life.pass.plain')}</bdi>
          {' · '}
          <span dir="ltr" className="font-mono tabular-nums">
            {untilHe}
          </span>
        </span>
        <span className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={onStay}
            data-life="pass-stay"
            className="min-h-tap flex-1 border-rule border-ink px-3 font-sign text-[13px] text-ink active:bg-ink active:text-sheet"
          >
            {t('life.pass.stay')}
          </button>
          <button
            type="button"
            onClick={onPass}
            data-life="pass-go"
            className="min-h-tap flex-1 bg-red px-3 font-sign text-[13px] text-sheet active:bg-ink"
          >
            {t('life.pass.go')}
          </button>
        </span>
      </Plate>
    </div>
  )
}
