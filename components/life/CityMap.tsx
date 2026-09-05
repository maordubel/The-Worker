'use client'

import { useMemo } from 'react'

import { t } from '@/lib/i18n'
import { CITY_LABELS, CITY_LINES, isRevealed, MAP_PLACES, MAP_SIZE, placeOfScene, project, type MapPlaceDef } from '@/lib/life/map'
import type { MapPlace } from '@/lib/life/runtime/game'
import type { LifeState, LocationId } from '@/lib/life/types'

/**
 * מפת העיר — Tel Aviv, printed.
 *
 * Ink on paper: the coast as a heavy line with the sea hatched behind it, the Yarkon and
 * the Ayalon, the streets a person names when giving directions, the towns in the sign
 * face. On it, the places this life has reached — red discs with a white ring, the one
 * you are in pulsing — and nothing at all where the life has not been yet. A tap on a
 * pin walks there through the doors (`onGo`), charging the minutes the door list charged;
 * a pin behind a shut door is grey with the door's name under it.
 *
 * The same drawing serves the reveal moment: `focus` scales the map onto one place and
 * `dropping` plays the pin landing.
 */
export function CityMap({
  state,
  places,
  here,
  onGo,
  focus,
  dropping,
  wide,
  className,
}: {
  state: LifeState
  /** the runtime's door list — reachability and cost, by scene id */
  places: readonly MapPlace[]
  here: LocationId
  onGo?: (scene: string) => void
  focus?: MapPlaceDef | null
  dropping?: boolean
  /** show the whole city rather than the window around the revealed pins */
  wide?: boolean
  className?: string
}) {
  const reachable = useMemo(() => new Map(places.map((p) => [p.id, p])), [places])
  const herePlace = placeOfScene(here)
  const coast = CITY_LINES.find((l) => l.id === 'coast')!
  const coastPts = coast.points.map(([lat, lon]) => project(lat, lon))
  const seaPath = `M ${coastPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} L 0 ${MAP_SIZE.h} L 0 0 Z`

  /**
   * The window onto the city. Whole city when asked (`wide`) or when there is nothing to
   * zoom to; otherwise the box around the revealed pins, padded, never smaller than a
   * neighbourhood — so six pins around one house do not sit on top of each other.
   */
  const view = useMemo(() => {
    if (wide) return `0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`
    const pins = (focus ? [focus] : MAP_PLACES.filter((p) => !p.offMap && isRevealed(state, p))).map((p) => project(p.lat, p.lon))
    if (pins.length === 0) return `0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`
    let minX = Math.min(...pins.map((p) => p.x))
    let maxX = Math.max(...pins.map((p) => p.x))
    let minY = Math.min(...pins.map((p) => p.y))
    let maxY = Math.max(...pins.map((p) => p.y))
    const MIN = 220
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const side = Math.max(MIN, (maxX - minX) * 1.9, (maxY - minY) * 1.9)
    minX = Math.max(0, Math.min(MAP_SIZE.w - side, cx - side / 2))
    minY = Math.max(0, Math.min(MAP_SIZE.h - side, cy - side / 2))
    return `${minX.toFixed(0)} ${minY.toFixed(0)} ${side.toFixed(0)} ${side.toFixed(0)}`
  }, [state, focus, wide])
  // the pin scale: labels and discs are drawn in map units, so a tight window makes them
  // huge — scale them back by the window's size against the whole city
  const k = useMemo(() => {
    const side = Number(view.split(' ')[2])
    return Math.max(0.28, Math.min(1, side / MAP_SIZE.w))
  }, [view])

  return (
    <svg
      viewBox={view}
      className={className}
      style={{ transition: 'all 900ms var(--ease-stamp)' }}
      role="img"
      aria-label={t('life.map.city')}
      data-life="city-map"
    >
      <defs>
        <pattern id="sea-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
          <line x1="0" y1="7" x2="14" y2="7" stroke="rgb(var(--ink))" strokeOpacity="0.16" strokeWidth="1.5" />
        </pattern>
        <pattern id="paper-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgb(var(--ink))" strokeOpacity="0.05" strokeWidth="1" />
        </pattern>
      </defs>

      <g>
        <rect x="0" y="0" width={MAP_SIZE.w} height={MAP_SIZE.h} fill="rgb(var(--sheet))" />
        <rect x="0" y="0" width={MAP_SIZE.w} height={MAP_SIZE.h} fill="url(#paper-grid)" />
        <path d={seaPath} fill="rgb(var(--ink))" fillOpacity="0.06" />
        <path d={seaPath} fill="url(#sea-hatch)" />

        {CITY_LINES.map((line) => {
          const pts = line.points.map(([lat, lon]) => project(lat, lon))
          const d = `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`
          const stroke =
            line.kind === 'coast' ? 4 : line.kind === 'highway' ? 5 : line.kind === 'river' ? 6 : 2
          const opacity = line.kind === 'coast' ? 0.9 : line.kind === 'highway' ? 0.55 : line.kind === 'river' ? 0.28 : 0.35
          const dash = line.kind === 'highway' ? '12 6' : undefined
          return (
            <g key={line.id}>
              <path d={d} fill="none" stroke="rgb(var(--ink))" strokeOpacity={opacity} strokeWidth={stroke} strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round" />
              {line.labelHe && (
                <text
                  x={pts[Math.floor(pts.length / 2)]!.x}
                  y={pts[Math.floor(pts.length / 2)]!.y - 8}
                  fontSize={17 * Math.max(k, 0.6)}
                  fill="rgb(var(--ink))"
                  fillOpacity="0.55"
                  fontFamily="var(--font-heebo)"
                  textAnchor="middle"
                  direction="rtl"
                >
                  {line.labelHe}
                </text>
              )}
            </g>
          )
        })}

        {CITY_LABELS.map((label) => {
          const p = project(label.lat, label.lon)
          return (
            <text
              key={label.labelHe}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              direction="rtl"
              fontFamily={label.size === 'town' ? 'var(--font-miriam)' : 'var(--font-heebo)'}
              fontSize={(label.size === 'town' ? 34 : 18) * Math.max(k, 0.6)}
              fontWeight={label.size === 'town' ? 700 : 400}
              fill="rgb(var(--ink))"
              fillOpacity={label.size === 'town' ? 0.75 : 0.5}
              letterSpacing={label.size === 'town' ? 2 : 0}
            >
              {label.labelHe}
            </text>
          )
        })}

        {/* the pins — only what the life has reached */}
        {MAP_PLACES.map((place) => {
          const shown = isRevealed(state, place) || focus?.id === place.id
          if (!shown) return null
          const p = project(place.lat, place.lon)
          const isHere = herePlace?.id === place.id
          const door = place.scene ? reachable.get(place.scene) : undefined
          const open = Boolean(door && !door.here && !door.lockedHe)
          const dim = !open && !isHere
          const dropped = dropping && focus?.id === place.id
          return (
            <g
              key={place.id}
              data-life="map-pin"
              data-place={place.id}
              className={open ? 'cursor-pointer' : undefined}
              onClick={open && onGo && place.scene ? () => onGo(place.scene as string) : undefined}
              transform={`translate(${p.x} ${p.y}) scale(${k}) translate(${-p.x} ${-p.y})`}
              style={dropped ? { animation: 'land 520ms var(--ease-stamp) 900ms both', transformOrigin: `${p.x}px ${p.y}px` } : undefined}
            >
              {isHere && (
                <circle cx={p.x} cy={p.y} r="26" fill="none" stroke="rgb(var(--red))" strokeWidth="3">
                  <animate attributeName="r" values="18;34;18" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values=".9;0;.9" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              {/* a big tap target, invisible */}
              <circle cx={p.x} cy={p.y} r="34" fill="transparent" />
              <circle cx={p.x} cy={p.y} r="13" fill={dim ? 'rgb(var(--concrete))' : 'rgb(var(--red))'} stroke="rgb(var(--sheet))" strokeWidth="4" />
              <circle cx={p.x} cy={p.y} r="13" fill="none" stroke="rgb(var(--ink))" strokeWidth="1.5" />
              <text
                x={p.x}
                y={p.y - 22}
                textAnchor="middle"
                direction="rtl"
                fontFamily="var(--font-frank)"
                fontWeight="700"
                fontSize="22"
                fill="rgb(var(--ink))"
                stroke="rgb(var(--sheet))"
                strokeWidth="5"
                paintOrder="stroke"
              >
                {place.labelHe}
              </text>
              {(door?.lockedHe || (door && !door.here)) && (
                <text x={p.x} y={p.y + 34} textAnchor="middle" direction="rtl" fontFamily="var(--font-courier)" fontSize="15" fill={dim ? 'rgb(var(--muted))' : 'rgb(var(--red))'} stroke="rgb(var(--sheet))" strokeWidth="4" paintOrder="stroke">
                  {door?.lockedHe ?? t('life.map.minutesAt', { n: String(door?.minutes ?? 0) })}
                </text>
              )}
              {isHere && (
                <text x={p.x} y={p.y + 34} textAnchor="middle" direction="rtl" fontFamily="var(--font-courier)" fontSize="15" fill="rgb(var(--red))" stroke="rgb(var(--sheet))" strokeWidth="4" paintOrder="stroke">
                  {t('life.map.here')}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
