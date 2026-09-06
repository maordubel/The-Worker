'use client'

import { useEffect, useRef, useState } from 'react'

import { t } from '@/lib/i18n'
import type { LifeBusEvents } from '@/lib/life/runtime/bus'

/**
 * מעברון — four seconds of Tel Aviv, 1989, over the black between two rooms.
 *
 * Maor found the film, found the promenade in it at minute sixteen, and said what it was:
 * the road between Bloomfield and Ussishkin. Nine clips were cut from it on 5.9.2026 and
 * then sat in `public/life/film` unplayed, which is the worst state a thing can be in.
 *
 * The whole design is in what it does NOT do. It has no skip button, because it is shorter
 * than the decision to press one. It has no controls, no sound (the game's own ambience
 * keeps running underneath), and it never waits for anything: the room behind it is
 * rebuilding while it plays, so when the picture goes the game is already there.
 *
 * It fades in over 400ms and out over 600ms and removes itself when the clip ends. If the
 * file will not play — an old browser, a blocked codec, a missing file — `onError` closes
 * it immediately and the player sees the ordinary cut, which is what they would have seen
 * anyway.
 */
export function FilmCut({ film, onDone }: { film: NonNullable<LifeBusEvents['film']>; onDone: () => void }) {
  const [gone, setGone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // A hard ceiling, so a clip that never fires `ended` cannot hold the game.
    timer.current = setTimeout(() => setGone(true), 6200)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [film.clip])

  useEffect(() => {
    if (!gone) return
    const out = setTimeout(onDone, 620)
    return () => clearTimeout(out)
  }, [gone, onDone])

  return (
    <div
      dir="rtl"
      className={`pointer-events-none absolute inset-0 z-[97] flex items-center justify-center bg-ink transition-opacity duration-500 ${
        gone ? 'opacity-0' : 'opacity-100'
      }`}
      data-life="film-cut"
      aria-hidden
      /**
       * הפריים הראשון, מתחת לכל השאר.
       *
       * The still sits BEHIND the video as a background, not only as the video's poster.
       * A poster is shown until playback starts and then discarded; a browser that cannot
       * decode the clip at all — an old build, a locked-down codec set — would otherwise
       * show four seconds of black, which is worse than no transition. This way the worst
       * case is a photograph of Tel Aviv in 1989 held for four seconds, which is fine.
       */
      style={{
        backgroundImage: `url(/life/film/${film.clip}.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        key={film.clip}
        src={`/life/film/${film.clip}.mp4`}
        poster={`/life/film/${film.clip}.jpg`}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => setGone(true)}
        onError={onDone}
        className="h-full w-full bg-transparent object-cover motion-safe:animate-[film-in_500ms_ease-out_both]"
      />

      <p className="absolute inset-x-0 bottom-[12%] text-center font-body text-[13px] leading-snug text-sheet/85 motion-safe:animate-[film-in_900ms_ease-out_both]">
        <bdi>{film.captionHe}</bdi>
        <span className="block pt-1 font-mono text-[10px] tabular-nums tracking-[0.18em] text-concrete/70">
          {t('life.film.source')}
        </span>
      </p>
    </div>
  )
}
