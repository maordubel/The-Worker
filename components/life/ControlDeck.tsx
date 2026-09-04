'use client'

import { useCallback, useRef, useState } from 'react'

import { t, type MessageKey } from '@/lib/i18n'

/**
 * לוח ההפעלה — a controller, not a circle.
 *
 * The directive is specific about this and it is right: the mobile control is a MAJOR
 * GRAPHICAL OBJECT, in the language of the hardware these people actually held — an
 * arcade cabinet, an 80s ball-top stick, two moulded buttons, a brushed deck plate with
 * some wear on it. A translucent grey disc floating over the art is what every browser
 * game does, and it reads as a debug overlay rather than as part of the world. So this
 * is built as a physical object: a ball-top with a real highlight and a shaft that
 * shortens as you push, a dust washer under it, buttons with a rim, a bezel and a press
 * that actually travels.
 *
 * The mental model is one arcade controller everywhere, so the scheme never changes:
 *  · **stick** — walk. On the deck, or anywhere on the start half of the picture.
 *  · **A** — do the thing the label names: talk, take, buy, enter, go. `E` on a keyboard.
 *  · **B** — the opposite: run while you walk, and leave a conversation without finishing
 *    it. `Shift` / `Esc` on a keyboard.
 * No mechanic gets a third button. Complexity belongs in the world and in the decisions,
 * not in the number of things a thumb has to learn.
 *
 * Everything sizes off the band left under the painting, so a 360×640 Android gets a
 * smaller but complete console rather than a clipped one, and it pads for the home
 * indicator. Desktop gets a different object entirely — a keycap legend, lit exactly
 * when the game is listening — because a keyboard player's problem was never where to
 * put a thumb, it was which key does anything.
 */

const PAD = { min: 92, max: 128 }
const BTN = { min: 62, max: 84 }

function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(high, value))
}

function Cap({ children, live }: { children: React.ReactNode; live?: boolean }) {
  return (
    <span
      dir="ltr"
      className={`flex h-6 min-w-6 items-center justify-center border-hair px-1 font-mono text-[11px] leading-none tabular-nums transition-colors duration-plate motion-reduce:transition-none ${
        live ? 'border-red bg-red text-sheet' : 'border-ink/50 bg-sheet text-ink'
      }`}
    >
      {children}
    </span>
  )
}

/** One moulded button: a bezel, a rim, and a top that travels when you press it. */
function ArcadeButton({
  size,
  letter,
  caption,
  live,
  warn,
  onDown,
  onUp,
}: {
  size: number
  letter: string
  caption: string
  live: boolean
  warn?: boolean
  onDown: () => void
  onUp: () => void
}) {
  const [held, setHeld] = useState(false)
  const press = () => {
    setHeld(true)
    onDown()
  }
  const release = () => {
    setHeld(false)
    onUp()
  }
  return (
    <button
      type="button"
      aria-label={caption}
      style={{ width: size, height: size }}
      onPointerDown={(event) => {
        event.preventDefault()
        press()
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={() => held && release()}
      className="pointer-events-auto relative shrink-0 touch-none rounded-full"
    >
      {/* the bezel the button is seated in */}
      <span
        className="absolute inset-0 rounded-full border-hair border-ink/80"
        style={{
          background: 'linear-gradient(160deg, rgb(255 255 255 / 0.16), rgb(0 0 0 / 0.5))',
        }}
        aria-hidden="true"
      />
      {/* the moulded top */}
      <span
        className="absolute rounded-full transition-transform duration-press ease-stamp motion-reduce:transition-none"
        style={{
          inset: 5,
          transform: held ? 'translateY(3px) scale(0.965)' : 'translateY(0) scale(1)',
          background: live
            ? 'radial-gradient(120% 100% at 32% 24%, rgb(255 255 255 / 0.55), rgb(224 64 28) 46%, rgb(150 30 10) 100%)'
            : warn
              ? 'radial-gradient(120% 100% at 32% 24%, rgb(255 255 255 / 0.3), rgb(70 66 62) 48%, rgb(24 22 21) 100%)'
              : 'radial-gradient(120% 100% at 32% 24%, rgb(255 255 255 / 0.24), rgb(58 55 52) 48%, rgb(20 19 18) 100%)',
          boxShadow: held
            ? 'inset 0 2px 5px rgb(0 0 0 / 0.55)'
            : '0 3px 0 rgb(0 0 0 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.22)',
        }}
        aria-hidden="true"
      />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="font-display text-[15px] leading-none text-sheet drop-shadow">
          <bdi>{caption}</bdi>
        </span>
        <span className="font-mono text-[9px] leading-none tabular-nums text-sheet/70" dir="ltr">
          {letter}
        </span>
      </span>
    </button>
  )
}

export function ControlDeck({
  top,
  height,
  touch,
  verb,
  label,
  locked,
  onAxis,
  onAction,
  onCancel,
}: {
  /** where the painting ends, in CSS pixels */
  top: number
  /** how much room is left under it */
  height: number
  /** a phone or a tablet — the controller, rather than the legend */
  touch: boolean
  verb?: string | null
  label?: string | null
  locked?: boolean
  onAxis: (x: number, y: number) => void
  onAction: (down: boolean) => void
  /** B — run while walking, leave while talking */
  onCancel: (down: boolean) => void
}) {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const [nub, setNub] = useState({ x: 0, y: 0 })
  const pointer = useRef<number | null>(null)

  const band = Math.max(0, height)
  const floating = touch ? band < PAD.min + 20 : band < 56
  const pad = clamp(band - 22, PAD.min, PAD.max)
  const btn = clamp((band - 34) / 1.6, BTN.min, BTN.max)
  const radius = Math.round(pad * 0.42)
  const ball = Math.round(pad * 0.36)

  const move = useCallback(
    (clientX: number, clientY: number, from: { x: number; y: number }) => {
      const dx = clientX - from.x
      const dy = clientY - from.y
      const length = Math.hypot(dx, dy)
      const scale = length > radius ? radius / length : 1
      setNub({ x: dx * scale, y: dy * scale })
      onAxis(dx / radius, dy / radius)
    },
    [onAxis, radius],
  )

  const release = useCallback(() => {
    pointer.current = null
    setOrigin(null)
    setNub({ x: 0, y: 0 })
    onAxis(0, 0)
  }, [onAxis])

  const shell = floating
    ? 'pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-2 bg-gradient-to-t from-ink/85 to-transparent px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-6'
    : 'pointer-events-none absolute inset-x-0 z-30 flex items-center justify-between gap-2 px-3 pb-[max(4px,env(safe-area-inset-bottom))]'
  const shellStyle = floating ? undefined : { top, bottom: 0 }

  /**
   * On a phone the name of the thing in reach gets its OWN full-width line, above the
   * hardware. Squeezed between a 120px stick and two buttons on a 360px screen it had
   * about a hundred pixels and truncated `לך לקיוסק` to `לך …`, which is worse than
   * saying nothing: the one job of that chip is to name what the red button will do.
   */
  const stripStyle = floating
    ? { bottom: `calc(${Math.round(btn)}px + max(20px, env(safe-area-inset-bottom)))` }
    : { top: Math.max(0, top + 4) }

  const centre = (
    <div className="pointer-events-none flex min-w-0 flex-1 flex-col items-center gap-1.5" dir="rtl">
      {label ? (
        <span
          data-life="prompt"
          className={`max-w-full truncate border-hair px-2.5 py-1.5 text-center font-body text-[13px] leading-none ${
            locked ? 'border-red bg-ink text-red' : 'border-ink bg-sheet text-ink'
          }`}
        >
          <bdi>{label}</bdi>
          {locked ? <bdi> · {t('life.deck.locked')}</bdi> : null}
        </span>
      ) : (
        <span
          className={`font-body text-[11px] leading-none ${
            floating ? 'text-sheet/70' : 'text-concrete'
          }`}
        >
          <bdi>{t('life.deck.nothing')}</bdi>
        </span>
      )}
    </div>
  )

  // --- desktop: a legend, lit where the game is listening --------------------------
  if (!touch) {
    const muted = floating ? 'text-sheet/80' : 'text-muted'
    return (
      <div className={shell} style={shellStyle} dir="ltr" data-life="deck">
        <div className="pointer-events-none flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1">
            <Cap>↑</Cap>
            <Cap>←</Cap>
            <Cap>↓</Cap>
            <Cap>→</Cap>
          </span>
          <span className={`font-body text-[11px] leading-none ${muted}`} dir="rtl">
            <bdi>{t('life.deck.move')}</bdi>
          </span>
        </div>

        {centre}

        <div className="pointer-events-none flex shrink-0 items-center gap-2">
          <span className={`font-body text-[11px] leading-none ${muted}`} dir="rtl">
            <bdi>{t('life.deck.bRun')}</bdi>
          </span>
          <Cap>Shift</Cap>
          <span className={`font-body text-[11px] leading-none ${muted}`} dir="rtl">
            <bdi>{verb ? t(`life.verb.short.${verb}` as MessageKey) : t('life.deck.act')}</bdi>
          </span>
          <Cap live={Boolean(verb) && !locked}>E</Cap>
        </div>
      </div>
    )
  }

  // --- touch: the cabinet ----------------------------------------------------------
  return (
    <>
      {/*
          התמונה היא לא ג'ויסטיק.

          Half the lower painting used to be an invisible drag pad: a thumb that landed on
          a person standing there steered instead of pointing, and on a phone that is most
          of the screen. Telling a tap from a drag made it *work*, but it did not make it
          right — none of the games Maor named have a stick over the picture, because in a
          point-and-click the painting means one thing and it means it everywhere. The
          stick is hardware and lives on the deck below, where a player who wants to steer
          can find it and where it can never eat a tap on the world. */}

      {/* the name of what is in reach — its own line, full width, above the hardware */}
      <div
        className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-3"
        style={stripStyle}
      >
        {centre}
      </div>

      <div className={shell} style={shellStyle} dir="ltr" data-life="deck">
        {/* ---- the stick: deck plate, dust washer, shaft, ball top ---- */}
        <div
          role="application"
          aria-label={t('life.deck.stick')}
          className="pointer-events-auto relative shrink-0 touch-none rounded-[10px] border-hair border-ink/70"
          style={{
            width: pad,
            height: pad,
            background:
              'linear-gradient(155deg, rgb(72 70 68) 0%, rgb(44 42 41) 42%, rgb(28 27 26) 100%)',
            boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.14), inset 0 -3px 8px rgb(0 0 0 / 0.5)',
          }}
          onPointerDown={(event) => {
            if (pointer.current !== null) return
            pointer.current = event.pointerId
            event.currentTarget.setPointerCapture(event.pointerId)
            const box = event.currentTarget.getBoundingClientRect()
            const from = { x: box.left + box.width / 2, y: box.top + box.height / 2 }
            setOrigin(from)
            move(event.clientX, event.clientY, from)
          }}
          onPointerMove={(event) => {
            if (pointer.current !== event.pointerId || !origin) return
            move(event.clientX, event.clientY, origin)
          }}
          onPointerUp={release}
          onPointerCancel={release}
        >
          {/* the dust washer the shaft comes through */}
          <span
            className="absolute rounded-full"
            style={{
              left: '50%',
              top: '50%',
              width: pad * 0.62,
              height: pad * 0.62,
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(circle at 50% 45%, rgb(14 13 13) 0%, rgb(30 29 28) 62%, rgb(58 56 54) 100%)',
              boxShadow: 'inset 0 2px 6px rgb(0 0 0 / 0.7)',
            }}
            aria-hidden="true"
          />
          {/* the ball top, riding the shaft */}
          <span
            className="absolute rounded-full"
            style={{
              left: '50%',
              top: '50%',
              width: ball,
              height: ball,
              transform: `translate(-50%, -50%) translate3d(${nub.x}px, ${nub.y}px, 0)`,
              background:
                'radial-gradient(circle at 34% 26%, rgb(255 255 255 / 0.75) 0%, rgb(224 64 28) 34%, rgb(139 26 10) 100%)',
              boxShadow: '0 4px 8px rgb(0 0 0 / 0.55), inset 0 -3px 6px rgb(0 0 0 / 0.35)',
              transition: origin ? 'none' : 'transform 120ms var(--ease-stamp)',
            }}
            aria-hidden="true"
          />
        </div>

        <div className="flex-1" aria-hidden="true" />

        {/* ---- A and B ---- */}
        <div className="pointer-events-none flex shrink-0 items-end gap-2">
          <ArcadeButton
            size={Math.round(btn * 0.86)}
            letter="B"
            caption={t('life.deck.b')}
            live={false}
            warn
            onDown={() => onCancel(true)}
            onUp={() => onCancel(false)}
          />
          <ArcadeButton
            size={btn}
            letter="A"
            caption={verb ? t(`life.verb.short.${verb}` as MessageKey) : t('life.deck.act')}
            live={Boolean(verb) && !locked}
            onDown={() => onAction(true)}
            onUp={() => onAction(false)}
          />
        </div>
      </div>
    </>
  )
}

/**
 * הצ׳יפ — the deck folded down to the one thing a tap-first player still needs.
 *
 * On a phone the default is now no stick and no buttons: you touch the world and the boy
 * goes (Very Little Nightmares, which Maor named as the bar, has no controls at all). But
 * the deck did two jobs the picture cannot do on its own — it NAMED what the red button
 * would do, and it gave a big forgiving target for doing it. This is those two jobs and
 * nothing else: one strip at the foot of the glass, the verb and the name, and the strip
 * itself is the button. It only exists while something is in reach, so most of the time
 * the glass is just the painting.
 */
export function TapChip({
  verb,
  label,
  locked,
  onAction,
}: {
  verb: string | null
  label: string | null
  locked: boolean
  onAction: (down: boolean) => void
}) {
  const [held, setHeld] = useState(false)
  if (!verb || !label) return null
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(14px,env(safe-area-inset-bottom))]"
      data-life="deck"
    >
      <button
        type="button"
        data-life="prompt"
        aria-label={label}
        onPointerDown={(event) => {
          event.preventDefault()
          setHeld(true)
          onAction(true)
        }}
        onPointerUp={() => {
          setHeld(false)
          onAction(false)
        }}
        onPointerCancel={() => {
          setHeld(false)
          onAction(false)
        }}
        className={`pointer-events-auto flex min-h-tap max-w-full items-center gap-2.5 border-rule px-4 py-2 font-body text-[14px] leading-none transition-colors duration-press motion-reduce:transition-none ${
          locked
            ? 'border-red bg-ink text-red'
            : held
              ? 'border-red bg-red text-sheet'
              : 'border-ink bg-sheet/95 text-ink'
        }`}
        dir="rtl"
      >
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[9px] tabular-nums ${
            locked ? 'bg-red/30 text-red' : 'bg-red text-sheet'
          }`}
          dir="ltr"
        >
          A
        </span>
        <span className="truncate">
          <bdi>{label}</bdi>
          {locked ? <bdi> · {t('life.deck.locked')}</bdi> : null}
        </span>
      </button>
    </div>
  )
}
