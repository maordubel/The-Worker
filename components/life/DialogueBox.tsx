'use client'

import { useEffect, useRef, useState } from 'react'

import type { DialogueChoice, DialogueLine } from '@/lib/life/runtime/bus'
import { artUrl } from '@/lib/life/runtime/art'
import { t } from '@/lib/i18n'

/**
 * תיבת הדיבור — DOM, not canvas, and that is the whole reason it is a component.
 *
 * Hebrew inside a WebGL canvas has no bidi handling, no selection, no screen reader and
 * no reflow. Here it is real text in the brand's own body face, it wraps properly on a
 * 390px phone, and a person using a screen reader hears the conversation.
 *
 * **The 4.9.2026 pass gave it a character.** Three decisions:
 *
 * · **Speech is printed as it is said.** The line types itself onto the sheet at the pace
 *   of a person talking (the caret is a red square, the brand's full stop). A tap while
 *   it is typing prints the rest; a tap after it has finished turns the page. Nobody is
 *   made to wait — a reader who is faster than the caret just taps twice — and the box
 *   stops feeling like a subtitle file and starts feeling like somebody speaking. The
 *   complete line is always in the DOM for a screen reader and for the probes.
 * · **The speaker is pasted onto the sheet, not framed by it.** The portrait is a bigger
 *   plate now, tilted the way a photo is when a hand puts it down, and it stands over the
 *   box's top edge with the name on a sign plate beside it. Every new line from the same
 *   mouth gives the plate a small bump — the head moving when it talks.
 * · **Narration is the room talking**, so it is set differently: no plate, no name, the
 *   sentence on ink instead of on the sheet, in the same face. You can tell without
 *   reading whether a line is being SAID or is simply true.
 *
 * And there is always an X. A conversation you cannot leave is a softlock, and this build
 * had one: speak to somebody a second time, land on a branch you no longer qualify for,
 * and there was nothing left to press. It is in the same corner on every line and applies
 * nothing — walking off mid-sentence earns a child exactly nothing.
 *
 * No rounded corners, no shadows, tokens only.
 */

/** characters per second — the pace of somebody talking, not of a modem */
const TYPE_CPS = 42

/** the probes read whole lines; a browser under `the-worker:life:probe` prints at once */
function instant(): boolean {
  try {
    return window.localStorage.getItem('the-worker:life:probe') === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function useTypewriter(text: string, key: string) {
  const [shown, setShown] = useState(0)
  const done = shown >= text.length
  useEffect(() => {
    if (instant()) {
      setShown(text.length)
      return
    }
    setShown(0)
    let raf = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const n = Math.min(text.length, Math.floor(((now - t0) / 1000) * TYPE_CPS))
      setShown(n)
      if (n < text.length) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // `key` changes when the line changes, even when two lines share the same text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return { shown, done, finish: () => setShown(text.length) }
}

export function DialogueBox({
  lines,
  choices,
  portrait,
  offsetTop,
  onAdvance,
  onChoose,
  onLeave,
}: {
  lines: DialogueLine[]
  choices?: DialogueChoice[]
  portrait?: string | null
  /** where the painting ends — the box sits directly under it, never on top of it */
  offsetTop?: number
  onAdvance: () => void
  onChoose: (id: string) => void
  /** walk away without finishing — always available, on every line */
  onLeave: () => void
}) {
  const line = lines[0]
  // One counter per line shown, so the typewriter restarts on every new line — including
  // two consecutive lines with identical text, which a text-keyed effect would merge.
  const serial = useRef(0)
  const lastLine = useRef<DialogueLine | null>(null)
  if (line && line !== lastLine.current) {
    lastLine.current = line
    serial.current += 1
  }
  const text = line?.text ?? ''
  const { shown, done, finish } = useTypewriter(text, `${serial.current}`)

  if (!line) return null
  const spoken = Boolean(line.who)
  const hasChoices = Boolean(choices && choices.length > 0)
  const visible = text.slice(0, shown)

  const advance = () => {
    if (!done) finish()
    else onAdvance()
  }

  return (
    // `data-life` hooks are for `scripts/life/playthrough.mjs`, which plays the real
    // build in a browser. Asserting on rendered Hebrew would tie the harness to the
    // wording of a line, and the wording is content — it is meant to change.
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex items-end px-2.5 pb-2.5 pt-10"
      style={offsetTop ? { top: offsetTop, alignItems: 'flex-start' } : undefined}
      data-life="dialogue"
    >
      <div className="relative w-full">
        {/* ---- the speaker, standing over the top edge ------------------------------- */}
        {spoken && (
          <div className="pointer-events-none relative z-10 ms-3 flex items-end gap-2" data-life="speaker">
            {portrait && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${portrait}-${serial.current}`}
                src={artUrl(portrait)}
                alt=""
                aria-hidden="true"
                className="-mb-2 h-[78px] w-[78px] origin-bottom-left animate-plate-bump border-rule border-ink bg-sheet object-cover"
              />
            )}
            <span className="mb-2 bg-ink px-2.5 py-1.5 font-sign text-[13px] font-bold leading-none text-sheet">
              <bdi>{line.who}</bdi>
            </span>
          </div>
        )}

        {/* ---- the sheet ----------------------------------------------------------------- */}
        <div
          key={`sheet-${serial.current}`}
          className={`relative animate-sheet-in border-rule border-ink ${spoken ? 'bg-sheet' : 'bg-ink'}`}
        >
          {/* a second, inner hairline: the sheet is printed, not drawn */}
          <span
            className={`pointer-events-none absolute inset-[3px] border-hair ${spoken ? 'border-ink/25' : 'border-sheet/20'}`}
            aria-hidden="true"
          />
          {/* the red tab on the start edge: this is a page of the same book, every time */}
          <span className="pointer-events-none absolute inset-y-0 start-0 w-[4px] bg-red" aria-hidden="true" />

          {/* היציאה — the same corner, every line, every conversation. */}
          <button
            type="button"
            onClick={onLeave}
            aria-label={t('life.leave')}
            title={t('life.leave')}
            data-life="leave"
            className={`absolute end-0 top-0 z-10 flex h-10 w-10 items-center justify-center font-display text-[15px] leading-none transition-colors duration-press active:bg-red active:text-sheet motion-reduce:transition-none ${
              spoken ? 'text-ink/45' : 'text-sheet/55'
            }`}
          >
            <span aria-hidden="true">✕</span>
          </button>

          {/* the line — typed for the eye, complete for the reader */}
          <button
            type="button"
            onClick={hasChoices ? finish : advance}
            aria-label={hasChoices ? undefined : t('life.continue')}
            data-life="continue"
            className="flex min-h-tap w-full items-start gap-3 ps-4 pe-11 pb-3 pt-3.5 text-start"
          >
            <span className="sr-only" data-life="line">
              {text}
            </span>
            <span
              aria-hidden="true"
              className={`flex-1 font-body text-[16px] leading-relaxed ${spoken ? 'text-ink' : 'text-sheet/90'}`}
            >
              <bdi>{visible}</bdi>
              {!done && <span className="ms-0.5 inline-block h-[0.7em] w-[0.42em] translate-y-[0.08em] animate-caret-blink bg-red" />}
            </span>
            {!hasChoices && done && (
              <span className="mt-2 h-2.5 w-2.5 shrink-0 animate-caret-blink bg-red" aria-hidden="true" />
            )}
          </button>

          {/* the choices — a ballot, one row each, the red square filling on press */}
          {hasChoices && done && (
            <ul className={`border-t-hair ${spoken ? 'border-ink' : 'border-sheet/30'}`}>
              {choices!.map((choice, index) => (
                <li
                  key={choice.id}
                  className={`animate-sheet-in border-b-hair last:border-b-0 ${spoken ? 'border-ink/20' : 'border-sheet/15'}`}
                  style={{ animationDelay: `${90 + index * 70}ms` }}
                  data-life="choice"
                >
                  <button
                    type="button"
                    disabled={choice.enabled === false}
                    onClick={() => onChoose(choice.id)}
                    className={`group flex min-h-tap w-full items-center gap-3 py-2 pe-3 ps-4 text-start transition-colors duration-press disabled:opacity-45 motion-reduce:transition-none ${
                      spoken ? 'active:bg-red/10' : 'active:bg-sheet/10'
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 border-hair border-red transition-colors duration-press group-active:bg-red motion-reduce:transition-none ${
                        spoken ? 'bg-sheet' : 'bg-ink'
                      }`}
                      aria-hidden="true"
                    />
                    <span className={`flex-1 font-body text-[15px] leading-snug ${spoken ? 'text-ink' : 'text-sheet'}`}>
                      <bdi>{choice.text}</bdi>
                    </span>
                    {choice.enabled === false && choice.noteHe && (
                      <span className="shrink-0 font-body text-[10px] leading-none text-muted">
                        <bdi>{choice.noteHe}</bdi>
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
