'use client'

import { useState } from 'react'

import { CityMap } from '@/components/life/CityMap'
import type { MapPlace } from '@/lib/life/runtime/game'
import type { LifeState, LocationId } from '@/lib/life/types'
import { SheetHead } from '@/components/life/Plate'
import { t } from '@/lib/i18n'

/**
 * המפה — the rooms the doors lead to, as a list you can walk from.
 *
 * Not a drawn map. A drawn neighbourhood invites the player to read the world off a
 * diagram instead of off the street, and "going somewhere is the choice" is a rule of
 * this game. What Maor asked for is the ability to get BETWEEN screens without pushing a
 * thumb down a corridor for the fifth time, and a list does that: every place the doors
 * connect to from here, what the walk costs, and — for a place behind a shut door — the
 * name of the door, so the map tells the truth about why. Choosing a place charges the
 * minutes and plays the same fade every door plays.
 */
export function LifeMap({
  places,
  state,
  here,
  onGo,
  onClose,
}: {
  places: MapPlace[]
  state: LifeState
  here: LocationId
  onGo: (id: string) => void
  onClose: () => void
}) {
  const [wide, setWide] = useState(false)
  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-ink/70 p-2.5 pb-[max(10px,env(safe-area-inset-bottom))] sm:items-center"
      data-life="map"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-[420px] flex-col border-rule border-ink bg-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={t('life.map.title')}
      >
        <SheetHead title={t('life.map.title')} onClose={onClose} closeLabel={t('life.map.close')} />
        {/* the city, printed — the drawn map Maor asked for; the list under it is the same
            doors as text, for a screen reader and for a thumb that wants a row */}
        <div className="relative aspect-square w-full shrink-0 overflow-hidden border-b-rule border-ink bg-sheet">
          <CityMap state={state} places={places} here={here} onGo={onGo} wide={wide} className="h-full w-full" />
          <button
            type="button"
            onClick={() => setWide((w) => !w)}
            data-life="map-wide"
            className="absolute bottom-2 flex min-h-[36px] items-center border-hair border-ink bg-sheet/95 px-2.5 font-body text-[11px] text-ink active:bg-red active:text-sheet"
            style={{ insetInlineStart: 8 }}
          >
            {wide ? t('life.map.near') : t('life.map.city')}
          </button>
        </div>
        <div className="overflow-y-auto">
          {places.length === 0 && (
            <p className="px-3 py-4 font-body text-[13px] text-muted">
              <bdi>{t('life.map.empty')}</bdi>
            </p>
          )}
          {places.map((place) => {
            const shut = Boolean(place.lockedHe)
            return (
              <button
                key={place.id}
                type="button"
                disabled={place.here || shut}
                onClick={() => onGo(place.id)}
                data-life="map-place"
                data-place={place.id}
                className={`flex min-h-tap w-full items-center justify-between gap-3 border-b-hair border-ink/30 px-3 text-start font-sign text-[15px] transition-colors duration-press motion-reduce:transition-none ${
                  place.here
                    ? 'bg-ink text-sheet'
                    : shut
                      ? 'text-muted'
                      : 'text-ink active:bg-red active:text-sheet'
                }`}
              >
                <span>
                  <bdi>{place.titleHe}</bdi>
                </span>
                <span className="shrink-0 font-body text-[11px]">
                  {place.here ? (
                    t('life.map.here')
                  ) : shut ? (
                    <bdi>
                      {t('life.map.locked')} {place.lockedHe}
                    </bdi>
                  ) : (
                    <span dir="rtl">
                      <span className="font-mono tabular-nums">{place.minutes}</span> {t('life.map.minutes')}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
