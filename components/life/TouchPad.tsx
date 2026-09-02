'use client'

import { useCallback, useRef, useState } from 'react'

import { t, type MessageKey } from '@/lib/i18n'

/**
 * הבקרים — a thumb that lands anywhere, and one button.
 *
 * Brief §27 puts mobile first, and a fixed joystick in a corner is the most common way a
 * browser game fails on a phone: the thumb never lands exactly on it, and every correction
 * costs the player a step. So the whole start half of the glass is the stick's zone — press
 * anywhere in it and the pad appears under your thumb, at your origin.
 *
 * The pad is SQUARE. Radius 0 is a brand rule with one exception and a joystick is not a
 * floodlight lamp; a square pad in the press language is also simply more legible against
 * a drawn world than a translucent circle.
 *
 * One action button, because the game has one verb (see the football scene's note). It is
 * 72px, which is half again the 48px minimum, because it is pressed hundreds of times.
 */

const RADIUS = 46

export function TouchPad({
  onAxis,
  onAction,
  verb,
}: {
  onAxis: (x: number, y: number) => void
  onAction: (down: boolean) => void
  /** the verb of whatever is in reach — the button SAYS what it will do, or waits */
  verb?: string | null
}) {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const [nub, setNub] = useState({ x: 0, y: 0 })
  const pointer = useRef<number | null>(null)

  const move = useCallback(
    (clientX: number, clientY: number, from: { x: number; y: number }) => {
      const dx = clientX - from.x
      const dy = clientY - from.y
      const length = Math.hypot(dx, dy)
      const scale = length > RADIUS ? RADIUS / length : 1
      setNub({ x: dx * scale, y: dy * scale })
      onAxis(dx / RADIUS, dy / RADIUS)
    },
    [onAxis],
  )

  const release = useCallback(() => {
    pointer.current = null
    setOrigin(null)
    setNub({ x: 0, y: 0 })
    onAxis(0, 0)
  }, [onAxis])

  return (
    // `dir="ltr"` is not a language decision, it is a HAND decision. The stick belongs
    // under the left thumb and the button under the right one on every phone on earth,
    // and a control layer that mirrors itself with the text direction puts the button
    // where the player's other hand is. Logical properties still do the work; the
    // direction they resolve against is simply the body's, not the page's.
    <div className="pointer-events-none absolute inset-0 z-10" dir="ltr">
      {/* the stick zone — everything on the start half, below the HUD */}
      <div
        className="pointer-events-auto absolute bottom-0 start-0 top-16 w-1/2 touch-none"
        onPointerDown={(event) => {
          if (pointer.current !== null) return
          pointer.current = event.pointerId
          event.currentTarget.setPointerCapture(event.pointerId)
          const from = { x: event.clientX, y: event.clientY }
          setOrigin(from)
          move(event.clientX, event.clientY, from)
        }}
        onPointerMove={(event) => {
          if (pointer.current !== event.pointerId || !origin) return
          move(event.clientX, event.clientY, origin)
        }}
        onPointerUp={release}
        onPointerCancel={release}
        aria-hidden="true"
      />

      {origin && (
        <div
          className="pointer-events-none fixed z-20 border-rule border-sheet/70 bg-ink/30"
          style={{
            width: RADIUS * 2,
            height: RADIUS * 2,
            insetInlineStart: 0,
            top: 0,
            transform: `translate3d(${origin.x - RADIUS}px, ${origin.y - RADIUS}px, 0)`,
          }}
        >
          <div
            className="absolute bg-sheet/85"
            style={{
              width: 34,
              height: 34,
              insetInlineStart: RADIUS - 17,
              top: RADIUS - 17,
              transform: `translate3d(${nub.x}px, ${nub.y}px, 0)`,
            }}
          />
        </div>
      )}

      {/*
        One button, and it tells you what it is for.

        Idle it is quiet and half-present; the moment something is in reach it fills with
        vermilion and takes the verb — דבר, קח, צא — so a player on a phone never has to
        work out whether pressing it will do anything. 72px, half again the 48px minimum,
        because it is pressed hundreds of times.
      */}
      <button
        type="button"
        aria-label={verb ? t(`life.verb.short.${verb}` as MessageKey) : t('life.action')}
        className={`pointer-events-auto absolute bottom-5 end-5 flex h-[76px] min-h-tap w-[76px] touch-none items-center justify-center border-rule transition-all duration-plate ease-stamp active:scale-95 motion-reduce:transition-none ${
          verb ? 'border-ink bg-red' : 'border-sheet/50 bg-ink/40'
        }`}
        onPointerDown={(event) => {
          event.preventDefault()
          onAction(true)
        }}
        onPointerUp={() => onAction(false)}
        onPointerCancel={() => onAction(false)}
      >
        {verb ? (
          <span className="font-display text-[15px] leading-none text-sheet">
            <bdi>{t(`life.verb.short.${verb}` as MessageKey)}</bdi>
          </span>
        ) : (
          <span className="h-4 w-4 bg-sheet/60" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
