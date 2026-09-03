'use client'

import { Num } from '@/components/ui/Num'
import type { HudState } from '@/lib/life/runtime/bus'
import { t } from '@/lib/i18n'

/**
 * הממשק — a day, a time, and nothing else (brief §15).
 *
 * There is no relationship bar, no passion meter and no independence score, because the
 * game's whole claim is that you read those off people rather than off a dashboard. If
 * Kobi is angry, Kobi is angry on screen.
 *
 * Money appears only when there is any and fades back out of the way. The objective line
 * is one short phrase describing the SHAPE of the day — "אבא יצא" — never an instruction.
 */
export function LifeHud({ hud }: { hud: HudState }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-2.5 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
      <div className="border-hair border-ink bg-sheet/95 px-2.5 py-1.5">
        <p className="font-mono text-[12px] leading-none tabular-nums text-ink" data-life="clock">
          {hud.clock}
        </p>
        <p className="mt-1 font-body text-[10px] leading-none text-muted" data-life="place">
          <bdi>{hud.place}</bdi>
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        {hud.showMoney && (
          <div className="flex items-center gap-1.5 border-hair border-ink bg-sheet/95 px-2.5 py-1.5">
            <span className="font-body text-[10px] leading-none text-muted">{t('life.money')}</span>
            <Num className="font-mono text-[12px] leading-none text-ink">{hud.agorot}</Num>
          </div>
        )}
        {hud.objective && (
          <div className="border-hair border-red bg-red px-2.5 py-1.5">
            <p className="font-body text-[10px] leading-none text-sheet">
              <bdi>{hud.objective}</bdi>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
