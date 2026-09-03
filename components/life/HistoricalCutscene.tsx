'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { t } from '@/lib/i18n'
import { embedUrl, type CutsceneCard, type CutsceneOutcome, type HistoricalCutscene as Def } from '@/lib/life/cutscenes'

/**
 * הסרט — real footage, inside the game, on a television that is not there.
 *
 * The brief for this screen was one sentence long and worth quoting: it must never feel
 * like the player suddenly opened an external webpage. Everything below follows from that.
 *
 * **The card first, the film second.** Three lines on black — what this is, who played,
 * when and where — held long enough to read, because the cut from a painted terrace
 * straight into 1986 videotape is a cut between two centuries and it needs a breath. The
 * three lines are built from the archive by `cutsceneCard`, so they say only what the
 * archive holds.
 *
 * **A 4:3 frame in a dark room.** The footage is 4:3 and it is shown 4:3 — pillarboxed on
 * a phone in landscape, never stretched — inside a border that reads as a set rather than
 * as a page: a slight inward vignette, a scanline wash at low opacity, and warm bloom at
 * the edges. Not a filter over the video (that would be defacing a document): a frame
 * AROUND it. The film itself is untouched.
 *
 * **Two buttons and no more.** `הפעל את רגע האליפות` appears when the browser refuses to
 * autoplay with sound, which it will on nearly every phone — that is not an error and it
 * is not presented as one, it is the moment the player chooses to start. `דלג` is small,
 * bottom corner, always there.
 *
 * ## Failing well
 *
 * The one requirement above every other: this screen may never trap anybody. Four things
 * end it — the video ends, the player skips, YouTube reports an error, or nothing at all
 * happens for long enough to mean something is wrong — and all four call `onDone`, which
 * hands the chapter back to the runtime with the reason. There is no path out of this
 * component that does not go through `onDone`, including unmount.
 *
 * `youtube-nocookie.com` rather than `youtube.com`: the player is a child in a game, and
 * an embed does not need to set an advertising cookie on them to show two minutes of 1986.
 */

type Phase = 'card' | 'gate' | 'playing' | 'failed'

/** How long the black card holds before the film starts. Long enough to read three lines. */
const CARD_MS = 3400
/** If the API has said nothing at all by now, something is wrong and the game moves on. */
const STALL_MS = 12_000

type YTPlayer = {
  destroy(): void
  playVideo(): void
  getCurrentTime(): number
  getDuration(): number
}

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      events?: {
        onReady?: (event: { target: YTPlayer }) => void
        onStateChange?: (event: { data: number }) => void
        onError?: (event: { data: number }) => void
      }
    },
  ) => YTPlayer
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

/**
 * Load the iframe API once per document, and resolve null rather than throwing when it
 * cannot be had. A blocked script tag is a normal outcome on a locked-down network, and
 * the caller treats it exactly like a pulled video.
 */
let apiPromise: Promise<YTNamespace | null> | null = null

function loadYouTubeApi(): Promise<YTNamespace | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YTNamespace | null>((resolve) => {
    let settled = false
    const finish = (value: YTNamespace | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      finish(window.YT ?? null)
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    tag.onerror = () => finish(null)
    document.head.appendChild(tag)

    // The script can load and the callback still never fire behind some proxies.
    window.setTimeout(() => finish(window.YT ?? null), 8000)
  })
  return apiPromise
}

export function HistoricalCutscene({
  scene,
  card,
  onDone,
}: {
  scene: Def
  card: CutsceneCard
  onDone: (outcome: CutsceneOutcome) => void
}) {
  const [phase, setPhase] = useState<Phase>('card')
  const frame = useRef<HTMLIFrameElement | null>(null)
  const player = useRef<YTPlayer | null>(null)
  /** `onDone` exactly once, from wherever it is reached, including unmount. */
  const done = useRef(false)

  /**
   * `onDone` can be a new function on every render of the shell, and two effects below
   * depend on being able to call it. Holding it in a ref instead of in a dependency array
   * is not a style choice here: an effect that lists `finish` as a dependency would tear
   * down and re-run on any parent re-render, which for the cleanup effect means reporting
   * `skipped` in the middle of a video the player is watching, and for the API effect
   * means a second YouTube player inside the same iframe.
   */
  const latest = useRef(onDone)
  latest.current = onDone

  const finish = useCallback((outcome: CutsceneOutcome) => {
    if (done.current) return
    done.current = true
    latest.current(outcome)
  }, [])

  const src = useMemo(() => {
    const origin = typeof window === 'undefined' ? '' : window.location.origin
    return embedUrl(scene, origin)
  }, [scene])

  // --- the card, then the film ------------------------------------------------------
  useEffect(() => {
    if (phase !== 'card') return
    const timer = window.setTimeout(() => setPhase('playing'), CARD_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

  // --- wire the API to the iframe that is already loading ---------------------------
  useEffect(() => {
    if (phase !== 'playing') return
    // Once, ever. `phase` goes playing → gate → playing when the browser blocks autoplay
    // and the player presses the button, and without this guard that second pass builds a
    // SECOND YouTube player on the same iframe — two state machines, two ENDED events, and
    // a video that cannot be paused.
    if (player.current) return
    let cancelled = false
    let stall: number | undefined

    void (async () => {
      const api = await loadYouTubeApi()
      if (cancelled) return
      if (!api || !frame.current) {
        setPhase('failed')
        return
      }
      try {
        player.current = new api.Player(frame.current, {
          events: {
            onReady: (event) => {
              // Autoplay with sound is blocked on most phones and on Safari everywhere.
              // Calling play and watching for a state change is how we find out; if the
              // state never changes, `stall` offers the player the button instead.
              try {
                event.target.playVideo()
              } catch {
                /* the gate below covers it */
              }
            },
            onStateChange: (event) => {
              if (event.data === api.PlayerState.PLAYING) {
                window.clearTimeout(stall)
                setPhase('playing')
              }
              if (event.data === api.PlayerState.ENDED) finish('watched')
            },
            // 2 bad id · 5 html5 error · 100 gone · 101/150 embedding disabled
            onError: () => setPhase('failed'),
          },
        })
      } catch {
        setPhase('failed')
        return
      }
      stall = window.setTimeout(() => {
        if (!cancelled) setPhase('gate')
      }, STALL_MS)
    })()

    return () => {
      cancelled = true
      window.clearTimeout(stall)
    }
    // `finish` is stable by construction (see the ref above), so this effect runs once per
    // phase change and never because the shell re-rendered.
  }, [phase, finish])

  // --- nothing leaves this component without telling the runtime --------------------
  useEffect(() => {
    return () => {
      try {
        player.current?.destroy()
      } catch {
        /* the iframe is already gone */
      }
      finish('skipped')
    }
  }, [finish])

  // --- Escape skips, like every other card in this game -----------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish('skipped')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  const start = () => {
    try {
      player.current?.playVideo()
    } catch {
      setPhase('failed')
      return
    }
    setPhase('playing')
  }

  return (
    <div
      dir="rtl"
      role="dialog"
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-ink"
      aria-modal="true"
      aria-label={scene.titleHe}
    >
      {/* ---------- the card ---------- */}
      {phase === 'card' ? (
        <div className="px-gutter text-center">
          <p className="font-mono text-[10px] tracking-[0.32em] tabular-nums text-concrete/55">
            {[card.placeHe, card.dateHe].filter(Boolean).join(' · ')}
          </p>
          {card.fixtureHe ? (
            <p className="mt-5 font-display text-[22px] leading-tight text-sheet sm:text-[28px]">
              {card.fixtureHe}
            </p>
          ) : null}
          <p className="mt-2 font-body text-[14px] text-red sm:text-[16px]">{card.titleHe}</p>
          {card.subtitleHe ? (
            <p className="mt-4 font-body text-[11px] text-concrete/45">{card.subtitleHe}</p>
          ) : null}
        </div>
      ) : null}

      {/* ---------- the set ---------- */}
      {phase !== 'card' ? (
        <div className="relative flex h-full w-full flex-col items-center justify-center">
          <div className="relative aspect-[4/3] max-h-[78vh] w-full max-w-[min(96vw,calc(78vh*4/3))] overflow-hidden border-hair border-concrete/25 bg-ink">
            {phase !== 'failed' ? (
              <iframe
                ref={frame}
                src={src}
                title={scene.titleHe}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen={false}
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-gutter text-center">
                <p className="font-body text-[13px] leading-relaxed text-concrete">{scene.fallbackHe}</p>
                <button
                  type="button"
                  onClick={() => finish('unavailable')}
                  className="flex min-h-tap items-center border-hair border-concrete/40 px-5 font-body text-[13px] text-sheet"
                >
                  {t('life.cutscene.continue')}
                </button>
              </div>
            )}

            {/* The set dressing, and never enough of it to alter the film's own pixels: a
                scanline wash at 5% and an inward vignette. A historical document is not
                something to put a filter on. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                background:
                  'repeating-linear-gradient(to bottom, rgb(var(--ink) / 0.28) 0px, rgb(var(--ink) / 0.28) 1px, transparent 1px, transparent 3px)',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ boxShadow: 'inset 0 0 120px 24px rgb(var(--ink) / 0.72)' }}
            />
          </div>

          {/* ---------- attribution, always ---------- */}
          <p className="mt-3 px-gutter text-center font-body text-[10px] text-concrete/45">
            {scene.sourceTitle}
          </p>

          {/* ---------- the gate ---------- */}
          {phase === 'gate' ? (
            <button
              type="button"
              onClick={start}
              className="absolute inset-0 flex min-h-tap items-center justify-center bg-ink/75"
            >
              <span className="border-hair border-red px-6 py-3 font-display text-[15px] tracking-wide text-sheet">
                {t('life.cutscene.play')}
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      {/* ---------- skip, small, always ---------- */}
      <button
        type="button"
        onClick={() => finish('skipped')}
        className="absolute bottom-4 flex min-h-tap items-center px-3 font-body text-[11px] text-concrete/45"
        style={{ insetInlineStart: 12 }}
      >
        {t('life.cutscene.skip')}
      </button>
    </div>
  )
}
