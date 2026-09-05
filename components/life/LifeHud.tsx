'use client'

import { Cloth, Plate } from '@/components/life/Plate'
import { Num } from '@/components/ui/Num'
import type { HudState } from '@/lib/life/runtime/bus'
import { t } from '@/lib/i18n'

/**
 * הממשק — a sign plate, a cloth, and nothing else (brief §15).
 *
 * The clock and the place are one enamel plate on a concrete arm, the way every screen
 * title on the site is: Courier for the time, the sign face for the room, Heebo for the
 * date. The objective — the one short phrase describing the SHAPE of the day, never an
 * instruction — is a strip of red cloth cut on the bias. Money is a small plate that
 * appears only when there is any. Nothing here is a bar and nothing here is a score:
 * the numbers live on the love meter and behind it.
 */
export function LifeHud({ hud }: { hud: HudState }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-2.5 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="flex items-stretch">
        <span aria-hidden="true" className="block w-[7px] self-stretch bg-concrete" />
        <Plate className="ms-1 mt-1" data-life="hud-plate">
          <span className="flex items-baseline gap-2 px-2.5 pt-1.5">
            <span className="font-mono text-[15px] font-bold leading-none tabular-nums text-ink" data-life="clock" dir="ltr">
              {hud.clock}
            </span>
            <span className="font-body text-[10px] leading-none text-muted">
              <bdi data-life="date">{hud.date}</bdi>
            </span>
          </span>
          {/* `data-life="place"` stays on the place ALONE: the playthrough harness reads it
              by name, and a date in front of the room made every room "lost". */}
          <span className="block px-2.5 pb-1.5 pt-1 font-sign text-[13px] leading-none text-ink">
            <bdi data-life="place">{hud.place}</bdi>
          </span>
        </Plate>
      </div>

      <div className="flex max-w-[58%] flex-col items-end gap-1.5">
        {hud.showMoney && (
          <Plate className="mt-1">
            <span className="flex items-center gap-1.5 px-2 py-1">
              <span className="font-sign text-[10px] leading-none text-muted">{t('life.money')}</span>
              <Num className="font-mono text-[13px] font-bold leading-none text-ink">{hud.agorot}</Num>
            </span>
          </Plate>
        )}
      </div>

      {/* The cloth hangs UNDER the chip row, on the reading side, never across the
          buttons: a long objective used to lie over "מפה" on a 390px phone. */}
      {hud.objective && (
        <div className="absolute inset-x-2.5 flex justify-end" style={{ top: 'calc(104px + env(safe-area-inset-top))' }}>
          <Cloth className="max-w-[78%]" data-life="objective-cloth">
            <span data-life="objective">
              <bdi>{hud.objective}</bdi>
            </span>
          </Cloth>
        </div>
      )}
    </div>
  )
}
