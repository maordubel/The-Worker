'use client'

import type { MapPlace } from '@/lib/life/runtime/game'
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
  onGo,
  onClose,
}: {
  places: MapPlace[]
  onGo: (id: string) => void
  onClose: () => void
}) {
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
        <div className="flex items-center justify-between border-b-hair border-ink bg-ink px-3 py-2">
          <p className="font-display text-[15px] leading-none text-sheet">{t('life.map.title')}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-tap min-w-tap items-center justify-center font-mono text-[16px] tabular-nums text-sheet"
            aria-label={t('life.map.close')}
          >
            ✕
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
                className={`flex min-h-tap w-full items-center justify-between gap-3 border-b-hair border-ink/30 px-3 text-start font-body text-[14px] transition-colors duration-press motion-reduce:transition-none ${
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
