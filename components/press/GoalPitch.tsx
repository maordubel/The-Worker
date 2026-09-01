'use client'

import { COLS, PITCH, ROWS, zoneCenter, zoneRect, type Grade, type ZoneId } from '@/lib/game/goal-zones'
import { t } from '@/lib/i18n'

/**
 * הדשא — the pitch שחזור השער is played on, off the Goal Rebuild handoff.
 *
 * The old board was a cream sheet with four thin strokes on it: correct as a diagram,
 * dead as a game. This one is the press layer doing what the press layer is for —
 * mown stripes, a halftone screen over the green, chalk that is cream rather than white,
 * and every mark closed with an ink line.
 *
 * The figures are the part that matters. A placement used to be a circle with a number
 * in it; here it is a drawn player in one of three postures — running, striking, on the
 * volley — so the board reads as a move rather than as a set of pins. Each figure prints
 * twice, ink under at a constant 3px offset and colour over: that is the second plate,
 * not a drop shadow, and this brand has no shadows.
 *
 * The opposition is already on the grass in chalk. They are scenery, not targets: a
 * pitch with nobody else on it is a diagram, and the move you are rebuilding happened
 * against eleven men.
 */

const POSES = ['#figRun', '#figRun', '#figKick', '#figVolley'] as const

export function GoalPitch({
  picks,
  truth,
  grades,
  labels,
  onPick,
  disabled = false,
}: {
  picks: ZoneId[]
  /** the real path, drawn in navy only once the player has committed */
  truth?: ZoneId[]
  grades?: Grade[]
  /** name · number · act under each placed figure */
  labels: Array<{ nameHe: string; actHe: string; num: string }>
  onPick: (zone: ZoneId) => void
  disabled?: boolean
}) {
  const points = picks.map((zone) => zoneCenter(zone)).filter((p): p is { x: number; y: number } => p !== null)
  const truthPoints = (truth ?? [])
    .map((zone) => zoneCenter(zone))
    .filter((p): p is { x: number; y: number } => p !== null)

  const path = (pts: { x: number; y: number }[]) =>
    pts.length > 1 ? `M${pts.map((p) => `${p.x} ${p.y}`).join(' L')}` : ''

  return (
    <div className="relative border-plate border-ink">
      <svg
        viewBox={`0 0 ${PITCH.w} ${PITCH.h}`}
        className="block w-full touch-manipulation"
        role="application"
        aria-label={t('goal.pitchAria')}
      >
        <defs>
          <symbol id="figRun" viewBox="0 0 70 80">
            <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="36" cy="12" r="8" />
              <path d="M31 20 L42 21 L45 42 L29 41 Z" />
              <path d="M43 25 L56 20" />
              <path d="M31 25 L19 33" />
              <path d="M40 42 L49 55 L46 67" />
              <path d="M32 42 L24 53 L29 65" />
              <path d="M46 67 L55 69" />
              <path d="M29 65 L20 67" />
            </g>
          </symbol>
          <symbol id="figKick" viewBox="0 0 70 80">
            <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="28" cy="12" r="8" />
              <path d="M23 20 L34 20 L37 41 L22 40 Z" />
              <path d="M35 24 L50 17" />
              <path d="M23 25 L11 21" />
              <path d="M26 41 L24 56 L24 68" />
              <path d="M35 41 L48 49 L59 58" />
              <path d="M24 68 L15 70" />
              <path d="M59 58 L64 63" />
            </g>
          </symbol>
          <symbol id="figVolley" viewBox="0 0 70 80">
            <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="44" cy="24" r="8" />
              <path d="M38 32 L49 30 L53 48 L38 50 Z" />
              <path d="M49 32 L61 22" />
              <path d="M38 34 L23 32" />
              <path d="M42 48 L31 38 L18 35" />
              <path d="M50 50 L57 62 L52 72" />
              <path d="M18 35 L12 39" />
              <path d="M52 72 L44 75" />
            </g>
          </symbol>
          <symbol id="figGuard" viewBox="0 0 70 80">
            <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="34" cy="12" r="8" />
              <path d="M28 20 L40 20 L42 42 L26 42 Z" />
              <path d="M41 24 L54 30" />
              <path d="M27 24 L14 30" />
              <path d="M30 42 L25 60 L26 70" />
              <path d="M39 42 L45 60 L44 70" />
              <path d="M26 70 L17 72" />
              <path d="M44 70 L53 72" />
            </g>
          </symbol>
          <pattern id="pitchDots" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="1.4" cy="1.4" r="1" fill="rgb(var(--p-dot))" opacity=".5" />
          </pattern>
        </defs>

        <rect width={PITCH.w} height={PITCH.h} fill="rgb(var(--p-grass))" />
        <g fill="rgb(var(--p-grass-dark))">
          {[0, 80, 160, 240, 320].map((y) => (
            <rect key={y} y={y} width={PITCH.w} height="40" />
          ))}
        </g>
        <rect width={PITCH.w} height={PITCH.h} fill="url(#pitchDots)" opacity=".18" />

        {/* chalk — cream, because pure white does not exist in print */}
        <g stroke="rgb(var(--p-line))" fill="none" strokeWidth="2.4">
          <path d="M12 12 H288 M12 12 V388 M288 12 V388 M12 388 H288" />
          <rect x="68" y="12" width="164" height="67" />
          <rect x="113" y="12" width="74" height="22" />
          <path d="M120.3 79 A 37 37 0 0 0 179.7 79" />
          <path d="M113 388 A 37 37 0 0 1 187 388" />
        </g>
        <g stroke="rgb(var(--p-line))" fill="none" strokeWidth="1.8">
          <path d="M20 12 A 8 8 0 0 1 12 20" />
          <path d="M280 12 A 8 8 0 0 0 288 20" />
        </g>
        <g fill="rgb(var(--p-line))">
          <circle cx="150" cy="57" r="2.6" />
          <circle cx="150" cy="388" r="2.6" />
        </g>
        <g>
          <rect x="129" y="0" width="42" height="12" fill="rgb(var(--p-net))" opacity=".72" stroke="rgb(var(--p-line))" strokeWidth="2.4" />
          <path
            d="M136 0 V12 M143 0 V12 M150 0 V12 M157 0 V12 M164 0 V12 M129 4 H171 M129 8 H171"
            stroke="rgb(var(--p-net-line))"
            strokeWidth=".7"
            fill="none"
          />
        </g>

        {/* the zone rules — dashed, so the grid reads as guidance and not as a table */}
        <g stroke="rgb(var(--p-line))" strokeWidth=".8" opacity=".26" strokeDasharray="3 4" fill="none">
          <path d="M68 12 V340 M123 12 V340 M178 12 V340 M233 12 V340" />
          <path d="M13 94 H288 M13 176 H288 M13 258 H288" />
        </g>

        {/* the opposition — chalk figures already on the grass, plus a navy keeper */}
        <g pointerEvents="none">
          {[
            { href: '#figGuard', x: 84, y: 26 },
            { href: '#figGuard', x: 188, y: 96 },
            { href: '#figRun', x: 40, y: 182 },
            { href: '#figGuard', x: 206, y: 252 },
          ].map((guard) => (
            <g key={`${guard.x}-${guard.y}`}>
              <use
                href={guard.href}
                x={guard.x + 3}
                y={guard.y + 3}
                width="44"
                height="50"
                style={{ color: 'rgb(var(--p-ink))' }}
                opacity=".28"
              />
              <use href={guard.href} x={guard.x} y={guard.y} width="44" height="50" style={{ color: 'rgb(var(--p-line))' }} />
            </g>
          ))}
          <use href="#figGuard" x="128" y="-6" width="46" height="52" style={{ color: 'rgb(var(--p-tekhelet))' }} />
        </g>

        {/* your path — dashed cream, rolling */}
        {points.length > 1 && (
          <>
            <path d={path(points)} fill="none" stroke="rgb(var(--p-ink))" strokeWidth="5" strokeLinecap="round" opacity=".35" transform="translate(2,3)" />
            <path d={path(points)} fill="none" stroke="rgb(var(--p-line))" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="9 6" className="ball-roll" />
          </>
        )}

        {/* the real path — navy, and only after the whistle */}
        {truthPoints.length > 1 && (
          <>
            <path d={path(truthPoints)} fill="none" stroke="rgb(var(--p-ink))" strokeWidth="5" strokeLinecap="round" opacity=".4" transform="translate(2,3)" />
            <path d={path(truthPoints)} fill="none" stroke="rgb(var(--p-tekhelet))" strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        {/* the tap targets, and the ring on a chosen zone */}
        {ROWS.flatMap((row) =>
          COLS.map((col) => {
            const id = `${col}${row}`
            const rect = zoneRect(id)
            if (!rect) return null
            const chosen = picks.includes(id)
            return (
              <rect
                key={id}
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                fill={chosen ? 'rgb(var(--p-line) / 0.2)' : 'transparent'}
                stroke={chosen ? 'rgb(var(--p-line))' : 'transparent'}
                strokeWidth={chosen ? 2 : 0}
                onClick={disabled ? undefined : () => onPick(id)}
                style={{ cursor: disabled ? 'default' : 'pointer' }}
                aria-label={id}
              />
            )
          }),
        )}

        <g fill="rgb(var(--p-line))" opacity=".42" pointerEvents="none" className="font-latin text-[8px] font-extrabold">
          {ROWS.flatMap((row) =>
            COLS.map((col) => {
              const rect = zoneRect(`${col}${row}`)
              if (!rect) return null
              return (
                <text key={`${col}${row}`} x={rect.x + rect.w / 2} y={rect.y + rect.h - 6} textAnchor="middle" style={{ fontSize: 8 }}>
                  {col}
                  {row}
                </text>
              )
            }),
          )}
        </g>

        {/* your touches, drawn as people */}
        <g pointerEvents="none">
          {points.map((point, index) => {
            const href = POSES[Math.min(index, POSES.length - 1)] ?? '#figRun'
            const grade = grades?.[index]
            const colour =
              grade === 'hit'
                ? 'rgb(var(--p-red))'
                : grade === 'near'
                  ? 'rgb(var(--p-tekhelet))'
                  : grade === 'miss'
                    ? 'rgb(var(--p-ink))'
                    : 'rgb(var(--p-red))'
            return (
              <g key={index} className="fig-pop">
                <use href={href} x={point.x - 20} y={point.y - 39} width="46" height="52" style={{ color: 'rgb(var(--p-ink))' }} opacity=".3" />
                <use href={href} x={point.x - 23} y={point.y - 42} width="46" height="52" style={{ color: colour }} />
              </g>
            )
          })}
        </g>
      </svg>

      {/* the name cards — cream tickets with an ink shadow, exactly as the handoff draws them */}
      {points.map((point, index) => {
        const label = labels[index]
        if (!label) return null
        return (
          <div
            key={index}
            /* The pitch is GEOMETRY, not text: its x axis is fixed whatever the
               document direction. Positioning these with a logical property put every
               name card on the opposite touchline. The wrapper is therefore ltr and the
               ticket inside it is rtl — the one place in this app where that is right. */
            dir="ltr"
            className="fig-pop pointer-events-none absolute"
            style={{
              insetInlineStart: `${(point.x / PITCH.w) * 100}%`,
              top: `${((point.y + 12) / PITCH.h) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div dir="rtl" className="whitespace-nowrap border-rule border-ink bg-sheet px-2 py-0.5 plate-card">
              <span className="font-body text-[11px] font-extrabold leading-tight text-ink">{label.nameHe}</span>
            </div>
            <div dir="rtl" className="mt-0.5 flex justify-center gap-[3px]">
              <span className="bg-ink px-1.5 py-[1px] font-latin text-[9px] font-extrabold text-paper" dir="ltr">
                {label.num}
              </span>
              <span className="bg-red px-1.5 py-[1px] font-body text-[9px] font-extrabold text-paper">{label.actHe}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
