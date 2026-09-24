'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  COLS,
  LANDMARKS,
  PITCH,
  ROWS,
  zoneCenter,
  zoneRect,
  type ZoneId,
} from '@/lib/game/goal-zones'
import { normalise, type Envelope, type ReplayPoint, type TruthTouch, type UserTouch } from '@/lib/game/replay/envelope'
import type { TouchGrade } from '@/lib/game/replay/judge'
import { dropZone, useDragActive, useDragSource } from '@/components/stage/useDrag'
import { firePickFxAt } from '@/components/stage/PickFx'
import { t } from '@/lib/i18n'

/**
 * הדשא — the pitch שחזור השער is played on, off the Goal Rebuild handoff.
 *
 * The drawing is unchanged from the version that shipped: mown stripes, a halftone screen
 * over the green, chalk that is cream rather than white, drawn players printed twice — ink
 * under at a constant 3px offset and colour over, which is the second plate and not a drop
 * shadow. What changed is what a touch IS.
 *
 * A touch used to be a zone. It is now an ORIGIN and a DESTINATION: a drawn player where
 * he stood and a ball where he sent it, with the route between them. That is the whole of
 * why continuity can be measured at all — the question "does your touch N join your touch
 * N+1" has no meaning until the ball has somewhere to be.
 *
 * **And after the whistle the board admits what it does not know.** The archive's route
 * prints in navy, its anchors as small crosses, and around each anchor a DASHED ELLIPSE —
 * the uncertainty envelope, sized from the reporter's own words. A player who put the ball
 * inside that ellipse was right, and can see that he was right, and can see how much room
 * the sentence left him. A single point on this board was always a claim nobody could
 * support; the ellipse is the same knowledge, honestly drawn.
 *
 * Two boards were drawn side by side in the prototype, one for the player and one for the
 * archive. At 390px that is two illegible boards, so both routes print on the ONE board
 * the player just worked on — which is also the board that can answer "why" (rule 59: the
 * pitch is one concept and it has one file).
 *
 * **Reachability, and the one place the finger may be more precise than the archive.**
 * A pointer places the exact point it touched; the keyboard places the CENTRE of a zone,
 * and that is not a lesser path — a zone centre is exactly the precision this archive
 * holds, so a keyboard player is placing the anchor itself. Twenty zone buttons plus the
 * goal make twenty-one real, focusable, labelled controls over the drawing; the picture
 * never moves, only who can reach it. `touch-action: none` on the overlay is what stops a
 * placement dragging the page out from under the thumb.
 *
 * **What the board says after the whistle, and why it is not vermilion (21.9.2026).**
 * The prototype defined a `.userTruthBridge` and never drew it; it is the missing "why
 * this score". For every touch the judge PAIRED, a dashed line now runs from where the
 * player stood to the archive's anchor for that touch — ink under, chalk over, the same
 * keyline idiom as the figures, because vermilion over printed grass is the one blend in
 * this product that passes through yellow (rule 8). A touch the player invented gets a
 * `+` beside his figure; a touch he missed gets a ring around the archive's anchor. The
 * verdict list prints the same two marks, so the board and the list speak one language.
 *
 * **And the board carries its own caption.** On a phone the builder is below the pitch
 * while the thumb is on it, so the question being asked ("tap where he stood") was off
 * screen at the exact moment it mattered. A strip along the foot of the board repeats it;
 * it is `pointer-events: none`, so it can never swallow a placement.
 */

const POSES = ['#figRun', '#figRun', '#figKick', '#figVolley', '#figRun'] as const

/**
 * קו מפתח — the ink line under every coloured figure, and the reason rule 8 needs it here.
 *
 * Vermilion over printed grass is the one blend in this product that CANNOT be made safe
 * by choosing a better red. Red and green sit on opposite sides of the wheel, so every
 * partial-coverage pixel between them — every antialiased glyph edge, every fading
 * overlay — passes through the yellow hues on its way across. A drawn figure at
 * `--p-red` on `--p-grass` measured 210 yellow pixels on a phone and 538 on a desktop,
 * and it had been doing that since the board was drawn: `npm run qa:sweep` only ever
 * loads `/goal` with nothing placed on it, so there was never a figure on the grass when
 * anybody measured. Rule 29's script, found by rule 33's playthrough.
 *
 * The fix is the press's own answer and it was already written in this file's header:
 * every mark is closed with an ink line. The figure prints three times — the offset ink
 * shadow that is the second plate, then a WIDER ink keyline at the colour's own position,
 * then the colour. The vermilion's edge now dissolves into ink instead of into grass, and
 * the keyline's own edge is ink into grass, which is a blue-green and safe.
 */
const KEYLINE = 8

function toBoard(point: ReplayPoint): { x: number; y: number } {
  return { x: point.x * PITCH.w, y: point.y * PITCH.h }
}

function colourFor(grade: TouchGrade | undefined): string {
  if (grade === 'good') return 'rgb(var(--p-red))'
  if (grade === 'near') return 'rgb(var(--p-red-deep))'
  if (grade === 'bad') return 'rgb(var(--p-ink))'
  return 'rgb(var(--p-red))'
}

/**
 * Whether the player asked the operating system for less motion. Read once on mount —
 * SVG animation elements do not listen to CSS media queries, so the rolling ball has to
 * be left out rather than paused.
 */
function usePrefersStill(): boolean {
  const [still, setStill] = useState(true)
  useEffect(() => {
    const query = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
    setStill(query?.matches ?? false)
  }, [])
  return still
}

/** How long the rolling ball spends on each leg of the player's move, in seconds. */
const ROLL_LEG = 0.42

export function GoalPitch({
  touches,
  draftOrigin = null,
  labels,
  truth,
  grades,
  onPlace,
  disabled = false,
  caption = null,
  hintEnvelope = null,
  rolling = false,
  pairs,
}: {
  /** every finished touch: where he stood, where he sent it */
  touches: UserTouch[]
  /** the touch being built — his position is down, the ball is not */
  draftOrigin?: ReplayPoint | null
  /** name · number · act under each placed figure */
  labels: Array<{ nameHe: string; actHe: string; num: string }>
  /** the archive's own move, drawn in navy with its envelopes — only after the whistle */
  truth?: TruthTouch[]
  grades?: Array<TouchGrade | undefined>
  onPlace: (point: ReplayPoint) => void
  disabled?: boolean
  /** the builder's current step, printed on the board itself */
  caption?: { lead: string; text: string } | null
  /** the one envelope the reception hint bought — chalk, dashed, before the whistle only */
  hintEnvelope?: Envelope | null
  /** the move is with the server: a ball runs the player's own route while it is graded */
  rolling?: boolean
  /** after the whistle: which of the player's touches the judge paired with which */
  pairs?: Array<{ user: number | null; truth: number | null }>
}) {
  const board = useRef<HTMLDivElement>(null)
  const byPointer = useRef(false)
  const still = usePrefersStill()
  /**
   * The live dashed line, following the finger while the standing figure is being
   * dragged to its target (round 2, Maor 23.9.2026: "the characters must be dragged").
   * Board-space coordinates, tracked outside `useDragSource` (which only follows a
   * ghost copy of the element itself) — see `ZoneButton`'s own pointer listeners below.
   */
  const [dragLine, setDragLine] = useState<{ x: number; y: number } | null>(null)
  /** whether a compatible drag (the origin figure, or a rail token) is in the air. */
  const dragState = useDragActive()
  const dragTargeting =
    dragState.active && (dragState.payload?.startsWith('zone:') || dragState.payload?.startsWith('player:'))

  /**
   * The zone the touch being built already stands in, if any — so THAT zone's own
   * button (already a real 44px control, already tap-to-place) can also be picked up
   * and dragged, rather than a second overlay competing with it for the same few
   * pixels (delta 87, Maor 23.9.2026: "the characters must be dragged on the screen").
   * A drag lands on the same `onPlace` the second TAP already calls.
   */
  const originZone: ZoneId | null = draftOrigin
    ? (ROWS.flatMap((row) => COLS.map((col) => `${col}${row}`)).find((id) => {
        const rect = zoneRect(id)
        if (!rect) return false
        const b = toBoard(draftOrigin)
        return b.x >= rect.x && b.x <= rect.x + rect.w && b.y >= rect.y && b.y <= rect.y + rect.h
      }) ?? null)
    : null

  /**
   * A pointer answers with the exact place it landed; the click that follows it is the
   * same placement arriving twice, so it is swallowed. A click with no pointer before it
   * is a keyboard, and that one places the zone's own centre.
   */
  const fromPointer = useCallback(
    (event: React.PointerEvent) => {
      if (disabled) return
      const rect = board.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return
      byPointer.current = true
      const across = (event.clientX - rect.left) / rect.width
      const down = (event.clientY - rect.top) / rect.height
      const boardY = PITCH.top + down * (PITCH.h - PITCH.top)
      onPlace({ x: Math.max(0, Math.min(1, across)), y: boardY / PITCH.h })
    },
    [disabled, onPlace],
  )

  const fromKeyboard = useCallback(
    (point: { x: number; y: number }) => {
      if (byPointer.current) {
        byPointer.current = false
        return
      }
      if (disabled) return
      onPlace(normalise(point))
    },
    [disabled, onPlace],
  )

  const route = (from: ReplayPoint, to: ReplayPoint) => {
    const a = toBoard(from)
    const b = toBoard(to)
    return `M${a.x} ${a.y} L${b.x} ${b.y}`
  }

  return (
    <div ref={board} className="relative h-full w-full border-plate border-ink" data-goal="board">
      <svg
        viewBox={`0 ${PITCH.top} ${PITCH.w} ${PITCH.h - PITCH.top}`}
        className="block h-full w-full touch-manipulation"
        aria-hidden="true"
      >
        <defs>
          <symbol id="figRun" viewBox="0 0 70 80">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
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
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
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
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
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
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
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
          <marker id="ballHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9 z" fill="rgb(var(--p-line))" />
          </marker>
          <marker id="truthHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9 z" fill="rgb(var(--p-tekhelet))" />
          </marker>
        </defs>

        {/* behind the goal — the air a shot ends in, and the one place a ball may land
            that is not grass. Ink, so the net reads against it. */}
        <rect x="0" y={PITCH.top} width={PITCH.w} height={-PITCH.top} fill="rgb(var(--p-ink))" />
        <rect x="0" y={PITCH.top} width={PITCH.w} height={-PITCH.top} fill="url(#pitchDots)" opacity=".2" />

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
          <circle cx={LANDMARKS.penaltySpot.x} cy={LANDMARKS.penaltySpot.y} r="2.6" />
          <circle cx="150" cy="388" r="2.6" />
        </g>
        <g>
          <rect x="129" y="-24" width="42" height="36" fill="rgb(var(--p-net))" opacity=".72" stroke="rgb(var(--p-line))" strokeWidth="2.4" />
          <path
            d="M136 -24 V12 M143 -24 V12 M150 -24 V12 M157 -24 V12 M164 -24 V12 M129 -16 H171 M129 -8 H171 M129 0 H171 M129 6 H171"
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
                strokeWidth={3}
                style={{ color: 'rgb(var(--p-ink))' }}
                opacity=".28"
              />
              <use
                href={guard.href}
                x={guard.x}
                y={guard.y}
                width="44"
                height="50"
                strokeWidth={3}
                style={{ color: 'rgb(var(--p-line))' }}
              />
            </g>
          ))}
          <use
            href="#figGuard"
            x="128"
            y="14"
            width="46"
            height="52"
            strokeWidth={3}
            style={{ color: 'rgb(var(--p-tekhelet))' }}
          />
        </g>

        {/* the archive's own move — navy, and only after the whistle. Anchors as crosses,
            envelopes as dashed ellipses: the anchor is the best reading, the ellipse is
            how much room the sentence left. */}
        {truth && truth.length > 0 && (
          <g pointerEvents="none">
            {truth.map((touch, index) => (
              <g key={`env-${index}`}>
                <TruthEllipse envelope={touch.origin} />
                {index === truth.length - 1 && <TruthEllipse envelope={touch.target} />}
              </g>
            ))}
            {truth.map((touch, index) => {
              const a = toBoard(touch.origin)
              const b = toBoard(touch.target)
              return (
                <g key={`route-${index}`}>
                  <path
                    d={`M${a.x} ${a.y} L${b.x} ${b.y}`}
                    fill="none"
                    stroke="rgb(var(--p-tekhelet))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    markerEnd="url(#truthHead)"
                  />
                  <path
                    d={`M${a.x - 5} ${a.y} H${a.x + 5} M${a.x} ${a.y - 5} V${a.y + 5}`}
                    stroke="rgb(var(--p-tekhelet))"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </g>
              )
            })}
          </g>
        )}

        {/* the reception hint — ONE envelope, bought, for the touch being built. Chalk on
            an ink keyline and never filled: it says where the source admits, not where. */}
        {hintEnvelope && !truth && (
          <g pointerEvents="none" data-goal="reception">
            <ellipse
              cx={hintEnvelope.x * PITCH.w}
              cy={hintEnvelope.y * PITCH.h}
              rx={Math.max(4, hintEnvelope.rx * PITCH.w)}
              ry={Math.max(4, hintEnvelope.ry * PITCH.h)}
              fill="none"
              stroke="rgb(var(--p-ink))"
              strokeWidth="4"
              opacity=".55"
            />
            <ellipse
              cx={hintEnvelope.x * PITCH.w}
              cy={hintEnvelope.y * PITCH.h}
              rx={Math.max(4, hintEnvelope.rx * PITCH.w)}
              ry={Math.max(4, hintEnvelope.ry * PITCH.h)}
              fill="none"
              stroke="rgb(var(--p-line))"
              strokeWidth="2.2"
              strokeDasharray="6 5"
            />
          </g>
        )}

        {/* the bridges — for every PAIRED touch, from where you stood to where the archive
            puts him. Ink under, chalk over: never vermilion on grass. */}
        {truth && pairs && (
          <g pointerEvents="none" data-goal="bridges">
            {pairs.map((pair, index) => {
              if (pair.user === null || pair.truth === null) return null
              const mine = touches[pair.user]
              const theirs = truth[pair.truth]
              if (!mine || !theirs) return null
              const a = toBoard(mine.origin)
              const b = toBoard(theirs.origin)
              if (Math.hypot(a.x - b.x, a.y - b.y) < 4) return null
              const d = `M${a.x} ${a.y} L${b.x} ${b.y}`
              return (
                <g key={`bridge-${index}`} data-goal="bridge">
                  <path d={d} fill="none" stroke="rgb(var(--p-ink))" strokeWidth="4.4" strokeLinecap="round" opacity=".85" />
                  <path d={d} fill="none" stroke="rgb(var(--p-line))" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 5" />
                </g>
              )
            })}
          </g>
        )}

        {/* the ball rolling between one touch and the next — your own reconstruction */}
        <g pointerEvents="none">
          {touches.map((touch, index) => {
            const a = toBoard(touch.origin)
            const b = toBoard(touch.target)
            return (
              <g key={`mine-${index}`}>
                <path
                  d={route(touch.origin, touch.target)}
                  fill="none"
                  stroke="rgb(var(--p-ink))"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity=".3"
                  transform="translate(2,3)"
                />
                <path
                  d={route(touch.origin, touch.target)}
                  fill="none"
                  stroke="rgb(var(--p-line))"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeDasharray="9 6"
                  markerEnd="url(#ballHead)"
                  className="ball-roll"
                />
                <circle cx={b.x + 2} cy={b.y + 3} r="5" fill="rgb(var(--p-ink))" opacity=".3" />
                <circle cx={b.x} cy={b.y} r="5" fill="rgb(var(--p-line))" stroke="rgb(var(--p-ink))" strokeWidth="1.6" />
                <circle cx={a.x} cy={a.y} r="2.2" fill="rgb(var(--p-ink))" opacity=".55" />
              </g>
            )
          })}
        </g>

        {/* the touch being built: he is standing there, the ball has not gone yet — drawn
            as the same running figure a committed touch gets, dashed, so it reads as a
            CHARACTER waiting to be dragged rather than a bare ring. */}
        {draftOrigin && (
          <g pointerEvents="none" className="fig-pop">
            <use
              href="#figRun"
              x={toBoard(draftOrigin).x - 16}
              y={toBoard(draftOrigin).y - 32}
              width="38"
              height="42"
              strokeWidth={2.4}
              strokeDasharray="3 3"
              style={{ color: 'rgb(var(--p-line))' }}
            />
            <circle
              cx={toBoard(draftOrigin).x}
              cy={toBoard(draftOrigin).y}
              r="11"
              fill="none"
              stroke="rgb(var(--p-line))"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              opacity=".7"
            />
          </g>
        )}

        {/* the live line — follows the finger while that figure is being dragged to a
            target zone or the goal mouth. */}
        {draftOrigin && dragLine && (
          <line
            pointerEvents="none"
            x1={toBoard(draftOrigin).x}
            y1={toBoard(draftOrigin).y}
            x2={dragLine.x}
            y2={dragLine.y}
            stroke="rgb(var(--p-line))"
            strokeWidth="2.6"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
        )}

        {/* while the server grades: one ball runs the player's whole move, leg by leg, and
            round again until the verdict lands — no fixed wait, and none at all under
            reduced motion, where it is simply not drawn. */}
        {rolling && !still && touches.length > 0 && (
          <g pointerEvents="none" data-goal="rolling">
            <circle r="6" cx="0" cy="0" fill="rgb(var(--p-line))" stroke="rgb(var(--p-ink))" strokeWidth="2">
              <animateMotion
                dur={`${touches.length * ROLL_LEG * 2}s`}
                repeatCount="indefinite"
                path={touches
                  .map((touch, index) => {
                    const a = toBoard(touch.origin)
                    const b = toBoard(touch.target)
                    return `${index === 0 ? 'M' : 'L'}${a.x} ${a.y} L${b.x} ${b.y}`
                  })
                  .join(' ')}
              />
            </circle>
          </g>
        )}

        {/* the zone rings — decorative only. The real target is the HTML button laid over
            the same rect, below the SVG. */}
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
          {touches.map((touch, index) => {
            const point = toBoard(touch.origin)
            const href = POSES[Math.min(index, POSES.length - 1)] ?? '#figRun'
            const colour = colourFor(grades?.[index])
            return (
              <g key={index} className="fig-pop">
                <use
                  href={href}
                  x={point.x - 20}
                  y={point.y - 39}
                  width="46"
                  height="52"
                  strokeWidth={3}
                  style={{ color: 'rgb(var(--p-ink))' }}
                  opacity=".3"
                />
                {/* the keyline, and it is not decoration — see KEYLINE below */}
                <use
                  href={href}
                  x={point.x - 23}
                  y={point.y - 42}
                  width="46"
                  height="52"
                  strokeWidth={KEYLINE}
                  style={{ color: 'rgb(var(--p-ink))' }}
                />
                <use
                  href={href}
                  x={point.x - 23}
                  y={point.y - 42}
                  width="46"
                  height="52"
                  strokeWidth={3}
                  style={{ color: colour }}
                />
              </g>
            )
          })}
        </g>

        {/* after the whistle: `+` beside a touch the archive does not have, and a ring
            around an archive touch nobody placed */}
        {truth && pairs && (
          <g pointerEvents="none">
            {pairs.map((pair, index) => {
              if (pair.user !== null && pair.truth === null) {
                const touch = touches[pair.user]
                if (!touch) return null
                const p = toBoard(touch.origin)
                const x = Math.min(PITCH.w - 9, p.x + 13)
                const y = p.y - 44
                return (
                  <g key={`extra-${index}`} data-goal="extra">
                    <rect x={x - 7} y={y - 7} width="14" height="14" fill="rgb(var(--p-ink))" />
                    <path
                      d={`M${x - 4} ${y} H${x + 4} M${x} ${y - 4} V${y + 4}`}
                      stroke="rgb(var(--p-line))"
                      strokeWidth="2.2"
                      strokeLinecap="square"
                    />
                  </g>
                )
              }
              if (pair.user === null && pair.truth !== null) {
                const touch = truth[pair.truth]
                if (!touch) return null
                const p = toBoard(touch.origin)
                return (
                  <g key={`missing-${index}`} data-goal="missing">
                    <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="rgb(var(--p-ink))" strokeWidth="5" />
                    <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="rgb(var(--p-line))" strokeWidth="2.2" />
                  </g>
                )
              }
              return null
            })}
          </g>
        )}
      </svg>

      {/* the real tap targets — twenty-one focusable, labelled controls over the drawing.
          `dir="ltr"` because these coordinates are the pitch's own fixed geometry, not a
          reading order. A pointer places where it landed; a keyboard places the centre of
          the place it chose, which is the precision the archive itself holds. */}
      <div
        dir="ltr"
        role="group"
        aria-label={t('goal.pitchAria')}
        className="pointer-events-none absolute inset-0"
        style={{ touchAction: 'none' }}
      >
        <button
          type="button"
          disabled={disabled}
          onPointerDown={fromPointer}
          onClick={() => fromKeyboard(LANDMARKS.goalMouth)}
          aria-label={t('goal.goalAria')}
          data-goal="mouth"
          {...dropZone('mouth')}
          className={`pointer-events-auto absolute transition-colors duration-press disabled:cursor-default ${
            dragTargeting ? 'bg-red/15 data-[drop-over=true]:bg-red/35' : ''
          }`}
          style={{
            insetInlineStart: `${(100 / PITCH.w) * 100}%`,
            top: 0,
            width: `${(100 / PITCH.w) * 100}%`,
            // down to the goal line, not just to the top of the picture: at 320px — the
            // narrowest screen this product supports — the air alone measures 39px and
            // the air plus the mouth measures 51. The drawn net is 42 units wide; the
            // TARGET is a hundred, because a button is not a drawing.
            height: `${((PITCH.goalY - PITCH.top) / (PITCH.h - PITCH.top)) * 100}%`,
          }}
        />
        {ROWS.flatMap((row) =>
          COLS.map((col) => {
            const id: ZoneId = `${col}${row}`
            const rect = zoneRect(id)
            const centre = zoneCenter(id)
            if (!rect || !centre) return null
            return (
              <ZoneButton
                key={id}
                id={id}
                col={col}
                row={row}
                rect={rect}
                disabled={disabled}
                draggable={id === originZone}
                highlight={dragTargeting}
                boardRef={board}
                onPointerDown={fromPointer}
                onClick={() => fromKeyboard(centre)}
                onDragTrack={id === originZone ? setDragLine : undefined}
                onDragEnd={id === originZone ? () => setDragLine(null) : undefined}
                onDrop={(zone) => {
                  const point = zone === 'mouth' ? LANDMARKS.goalMouth : zoneCenter(zone)
                  if (!point) return
                  onPlace(normalise(point))
                  firePickFxAt(document.querySelector(`[data-drop="${zone}"]`), { tone: 'red' })
                }}
              />
            )
          }),
        )}
      </div>

      {/* the name cards — cream tickets with an ink shadow, exactly as the handoff draws them */}
      {touches.map((touch, index) => {
        const label = labels[index]
        if (!label) return null
        const point = toBoard(touch.origin)
        return (
          <div
            key={index}
            /* The pitch is GEOMETRY, not text: its x axis is fixed whatever the document
               direction. Positioning these with a logical property put every name card on
               the opposite touchline. The wrapper is therefore ltr and the ticket inside
               it is rtl — the one place in this app where that is right. */
            dir="ltr"
            className="fig-pop pointer-events-none absolute"
            style={{
              insetInlineStart: `${(point.x / PITCH.w) * 100}%`,
              top: `${((point.y + 12 - PITCH.top) / (PITCH.h - PITCH.top)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div dir="rtl" className="whitespace-nowrap border-rule border-ink bg-sheet px-2 py-0.5 plate-card">
              <span className="font-body text-[11px] font-extrabold leading-tight text-ink">{label.nameHe}</span>
            </div>
            {/* The KEYLINE again, in HTML, and it took three goes to get right: a
                vermilion chip whose edge antialiases straight into printed grass prints
                yellow at about a third coverage, and rule 8 has no allowance for an edge.
                A hairline let eighteen pixels through down one side; two pixels let a
                single ROW through under the bottom, because the ticket is placed at a
                percentage and lands on a fractional pixel in both axes. So the vermilion
                is not bordered, it is INSET — the whole strip is an ink plate and the
                chips sit inside its padding, which is four solid pixels of ink on every
                side of the red and cannot be rounded away. */}
            <div dir="rtl" className="mt-0.5 flex justify-center">
              <span className="flex gap-[3px] border-rule border-ink bg-ink p-[2px]">
                <span className="px-1 font-latin text-[9px] font-extrabold leading-[1.4] text-paper" dir="ltr">
                  {label.num}
                </span>
                <span className="bg-red px-1.5 font-body text-[9px] font-extrabold leading-[1.4] text-paper">
                  {label.actHe}
                </span>
              </span>
            </div>
          </div>
        )
      })}

      {/* the caption — the builder's question, on the board where the thumb is. Never a
          tap target: `pointer-events-none`, so a placement under it lands on the zone. */}
      {caption && (
        <div
          data-goal="caption"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-ink/85 px-2 py-1"
        >
          <span className="shrink-0 bg-paper px-1.5 font-body text-[11px] font-extrabold leading-[1.5] text-ink">
            {caption.lead}
          </span>
          <span className="min-w-0 truncate font-body text-[12px] font-extrabold leading-snug text-paper">
            {caption.text}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * A zone button — the real 44px tap target it always was, plus (when `draggable`) a
 * drag source: the finger can pick this exact spot up and carry it to another zone,
 * which fires the caller's `onDrop` with the RELEASED zone's id (or `mouth`), the same
 * `onPlace` a second tap already reaches.
 */
function ZoneButton({
  id,
  col,
  row,
  rect,
  disabled,
  draggable,
  highlight = false,
  boardRef,
  onPointerDown,
  onClick,
  onDrop,
  onDragTrack,
  onDragEnd,
}: {
  id: ZoneId
  col: string
  row: number
  rect: { x: number; y: number; w: number; h: number }
  disabled: boolean
  draggable: boolean
  /** a compatible drag (this figure, or a rail token) is in the air — light every zone up */
  highlight?: boolean
  boardRef?: React.RefObject<HTMLDivElement>
  onPointerDown: (event: React.PointerEvent) => void
  onClick: () => void
  onDrop: (zone: string) => void
  /** board-space coordinates, while THIS zone's own figure is being dragged (live line) */
  onDragTrack?: (point: { x: number; y: number } | null) => void
  onDragEnd?: () => void
}) {
  const drag = useDragSource({ payload: `zone:${id}`, disabled: !draggable, onDrop })

  /**
   * A second, independent pointer listener, alongside `useDragSource`'s own — that one
   * moves a ghost copy of the button; this one only reads the pointer to draw the live
   * dashed line in board space, which the shared drag engine has no hook for.
   */
  function onDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!draggable) {
      onPointerDown(event)
      return
    }
    drag.onPointerDown(event)
    if (!onDragTrack) return
    const id = event.pointerId
    function toBoardPoint(clientX: number, clientY: number) {
      const box = boardRef?.current?.getBoundingClientRect()
      if (!box || box.width === 0 || box.height === 0) return null
      return {
        x: ((clientX - box.left) / box.width) * PITCH.w,
        y: PITCH.top + ((clientY - box.top) / box.height) * (PITCH.h - PITCH.top),
      }
    }
    function move(ev: PointerEvent) {
      if (ev.pointerId !== id) return
      onDragTrack?.(toBoardPoint(ev.clientX, ev.clientY))
    }
    function up(ev: PointerEvent) {
      if (ev.pointerId !== id) return
      cleanup()
    }
    function cleanup() {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      onDragTrack?.(null)
      onDragEnd?.()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={onDown}
      onClick={onClick}
      onClickCapture={draggable ? drag.onClickCapture : undefined}
      data-draggable={draggable ? drag['data-draggable'] : undefined}
      aria-label={t('goal.zoneAria', { zone: id, col, row: String(row) })}
      data-goal="zone"
      data-zone={id}
      {...dropZone(id)}
      className={`pointer-events-auto absolute transition-colors duration-press disabled:cursor-default ${
        highlight ? 'bg-red/15 data-[drop-over=true]:bg-red/35' : ''
      }`}
      style={{
        ...(draggable ? drag.style : undefined),
        insetInlineStart: `${(rect.x / PITCH.w) * 100}%`,
        top: `${((rect.y - PITCH.top) / (PITCH.h - PITCH.top)) * 100}%`,
        width: `${(rect.w / PITCH.w) * 100}%`,
        height: `${(rect.h / (PITCH.h - PITCH.top)) * 100}%`,
      }}
    />
  )
}

/** What the source does not pin down, drawn as the shape it actually is. */
function TruthEllipse({ envelope }: { envelope: Envelope }) {
  return (
    <ellipse
      cx={envelope.x * PITCH.w}
      cy={envelope.y * PITCH.h}
      rx={envelope.rx * PITCH.w}
      ry={envelope.ry * PITCH.h}
      fill="rgb(var(--p-tekhelet) / 0.12)"
      stroke="rgb(var(--p-tekhelet))"
      strokeWidth="1.6"
      strokeDasharray="5 5"
    />
  )
}
