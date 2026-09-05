'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Grain, Letterbox } from '@/components/life/FilmFx'
import { t } from '@/lib/i18n'
import type { HistoricalAnchor } from '@/lib/life/anchors'
import { OPENING, openingLines } from '@/lib/life/opening'

/**
 * הפתיח — five pictures, and then the game.
 *
 * It plays before the child exists as something you can move, and it exists to answer one
 * question the vision document asks in §4: why does this club already have a place in this
 * boy's life before he is old enough to choose it? A cot with a scarf on the rail. A bus
 * to the ground. A man lifting a five-year-old above a crowd. The crest, drawn again and
 * again at a kitchen table. A window with a floodlight in it.
 *
 * ## How it is built
 *
 * Every beat is mounted at once and only one is opaque. That is not a micro-optimisation:
 * a crossfade between two `<img>` tags where the incoming one has not decoded yet is a
 * flash of black, and on a phone over a slow connection that is most of the sequence. Each
 * still gets a slow drift — a Ken Burns push, four seconds of it, six pixels of movement —
 * because a completely static frame under a caption reads as a loading screen; each clip
 * gets its own poster so the same crossfade lands on a picture rather than on a video
 * element that has not buffered.
 *
 * ## What it never does
 *
 * Trap anybody, and never require sound. `דלג` is on screen from the first frame and
 * Escape does the same thing. The clips are muted, `playsInline` and `autoPlay`, which is
 * the one combination every mobile browser allows without a gesture — so a phone that
 * refuses autoplay with audio still plays this, and a phone that refuses video altogether
 * shows the poster for the same number of seconds and the sequence carries on.
 *
 * `prefers-reduced-motion` turns off the drift and the crossfade and holds each beat as a
 * plain cut, which is the honest version of this sequence for somebody who needs it.
 */
export function OpeningSequence({
  anchor,
  onDone,
}: {
  /** the prologue's anchor — beat three reads the 1983 final off it, or says less */
  anchor: HistoricalAnchor
  onDone: () => void
}) {
  const [index, setIndex] = useState(0)
  const [showing, setShowing] = useState(false)
  const done = useRef(false)
  const latest = useRef(onDone)
  latest.current = onDone

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    latest.current()
  }, [])

  const beat = OPENING[index]

  // --- the clock -------------------------------------------------------------------
  useEffect(() => {
    if (!beat) {
      finish()
      return
    }
    setShowing(false)
    const fadeIn = window.setTimeout(() => setShowing(true), 40)
    const next = window.setTimeout(() => {
      setIndex((n) => n + 1)
    }, beat.ms)
    return () => {
      window.clearTimeout(fadeIn)
      window.clearTimeout(next)
    }
  }, [beat, finish])

  // --- Escape skips, like every other card in this game -----------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  if (!beat) return null
  const lines = openingLines(beat, anchor)

  return (
    <div
      dir="rtl"
      role="dialog"
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-ink"
      aria-modal="true"
      aria-label={lines.captionHe}
    >
      {OPENING.map((entry, i) => {
        const active = i === index
        return (
          <div
            key={entry.id}
            aria-hidden={!active}
            className="absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none"
            style={{ opacity: active && showing ? 1 : 0 }}
          >
            {entry.kind === 'clip' ? (
              <video
                // `key` on `active` so the clip restarts from its first frame each time it
                // becomes the beat, rather than resuming wherever it was left.
                key={`${entry.id}-${active}`}
                src={active ? `/life/opening/${entry.art}.mp4` : undefined}
                poster={`/life/opening/${entry.art}-poster.png`}
                muted
                playsInline
                autoPlay
                preload="auto"
                className="opening-frame h-full w-full"
              />
            ) : (
              <div
                className="opening-frame h-full w-full bg-center bg-no-repeat motion-safe:animate-[openingDrift_7s_ease-out_forwards]"
                style={{ backgroundImage: `url(/life/${entry.from === 'art' ? 'art' : 'opening'}/${entry.art}.png)` }}
              />
            )}
          </div>
        )
      })}

      <Grain opacity={0.16} />
      {beat.from === 'art' && <Letterbox height={0.1} ms={600} />}

      {/* The picture is a photograph and the caption is print. The wash is what stops the
          second from disappearing into the first — a band of ink at the foot of the frame,
          not a scrim over the whole picture. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
        style={{ background: 'linear-gradient(to top, rgb(var(--ink)) 8%, rgb(var(--ink) / 0) 100%)' }}
      />

      {/* The year, stamped on the frame the way a film names its time — big, poster
          face, top corner, gone with the cut. */}
      {beat.stampHe && (
        <p
          key={`stamp-${beat.id}`}
          aria-hidden="true"
          className="absolute top-[max(14px,env(safe-area-inset-top))] z-[4] font-poster text-[44px] leading-none text-sheet/90 transition-opacity duration-500 sm:text-[64px] motion-reduce:transition-none"
          style={{ insetInlineEnd: 16, opacity: showing ? 1 : 0, textShadow: '0 2px 18px rgb(var(--ink) / .9)' }}
          dir="ltr"
        >
          {beat.stampHe}
        </p>
      )}

      <div className="absolute inset-x-0 bottom-[16%] px-gutter text-center">
        <p
          key={beat.id}
          className="mx-auto max-w-[28rem] font-display text-[17px] leading-relaxed text-sheet transition-opacity duration-500 sm:text-[20px] motion-reduce:transition-none"
          style={{ opacity: showing ? 1 : 0 }}
        >
          {lines.captionHe}
        </p>
        {lines.archiveHe ? (
          <p
            className="mx-auto mt-3 max-w-[28rem] font-mono text-[11px] tabular-nums text-concrete/60 transition-opacity duration-500 motion-reduce:transition-none"
            style={{ opacity: showing ? 1 : 0 }}
          >
            {lines.archiveHe}
          </p>
        ) : null}
      </div>

      {/* Where you are in it. Five marks, and the one you are on is red. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-8 flex justify-center gap-2">
        {OPENING.map((entry, i) => (
          <span
            key={entry.id}
            className={`h-[2px] w-6 transition-colors duration-500 motion-reduce:transition-none ${
              i === index ? 'bg-red' : i < index ? 'bg-concrete/50' : 'bg-concrete/20'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={finish}
        data-life="opening-skip"
        className="absolute bottom-4 flex min-h-tap items-center px-3 font-body text-[11px] text-concrete/55"
        style={{ insetInlineStart: 12 }}
      >
        {t('life.cutscene.skip')}
      </button>
    </div>
  )
}
