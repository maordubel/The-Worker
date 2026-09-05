'use client'

import { useEffect, useRef, useState } from 'react'

import type { DialogueChoice, DialogueLine } from '@/lib/life/runtime/bus'
import { artUrl } from '@/lib/life/runtime/art'
import { DEFAULT_IDENTITY } from '@/lib/life/content/chapter1986'
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
 * **5.9.2026 — comic grammar.** Speech is a balloon now: it has a tail, it is 92% of the
 * glass and sits on its speaker's side, it pops from the tail with a hair of a lean, and
 * two people talking face each other across the screen (`useSides`). Narration is still
 * the room talking — full width, on ink, no tail.
 *
 * No rounded corners, no shadows, tokens only.
 */

/** characters per second — the pace of somebody talking, not of a modem */
// 5.9.2026: faster — a ninety-character line in a second and a half; a tap completes it at once
const TYPE_CPS = 60

/**
 * צדדים — comic grammar (5.9.2026).
 *
 * Every speaker owns a side of the glass for the length of a conversation. The player
 * is always on the START side (the right, in Hebrew), the first other person to speak
 * takes the END side, the next takes start, and so on; a face that has already been
 * given a side keeps it. Two people in a row on the same side is what makes a dialogue
 * read like subtitles — and this box is a page of a comic, so the balloons face each
 * other, lean a hair toward the person, and pop from their tail.
 */
type Side = 'start' | 'end'
const PLAYER = DEFAULT_IDENTITY.name

function useSides(who: string | null, serial: number): Side {
  const sides = useRef<Map<string, Side>>(new Map())
  // a new conversation (serial reset to 1) forgets the seating
  const last = useRef(0)
  if (serial < last.current) sides.current.clear()
  last.current = serial
  if (!who) return 'start'
  if (who === PLAYER) return 'start'
  const known = sides.current.get(who)
  if (known) return known
  const others = [...sides.current.keys()].filter((k) => k !== PLAYER).length
  const side: Side = others % 2 === 0 ? 'end' : 'start'
  sides.current.set(who, side)
  return side
}

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
  const side = useSides(line?.who ?? null, serial.current)

  if (!line) return null
  const spoken = Boolean(line.who)
  const hasChoices = Boolean(choices && choices.length > 0)
  const visible = text.slice(0, shown)
  const atEnd = side === 'end'

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
      <div className={`relative flex w-full flex-col ${spoken ? (atEnd ? 'items-start' : 'items-end') : 'items-stretch'}`} data-side={spoken ? side : 'wide'}>
        {/* ---- the speaker, standing over the top edge, on their side ------------------- */}
        {spoken && (
          <div
            className={`pointer-events-none relative z-10 flex items-end gap-2 ${atEnd ? 'me-auto ms-3 flex-row' : 'me-3 ms-auto flex-row-reverse'}`}
            data-life="speaker"
          >
            {portrait && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${portrait}-${serial.current}`}
                src={artUrl(portrait)}
                alt=""
                aria-hidden="true"
                className={`-mb-2 h-[84px] w-[84px] animate-face-in border-rule border-ink bg-sheet object-cover ${atEnd ? 'origin-bottom-left' : 'origin-bottom-right'}`}
              />
            )}
            <span className="mb-2 bg-ink px-2.5 py-1.5 font-sign text-[13px] font-bold leading-none text-sheet">
              <bdi>{line.who}</bdi>
            </span>
          </div>
        )}

        {/* ---- the balloon --------------------------------------------------------------- */}
        <div
          key={`sheet-${serial.current}`}
          className={`relative border-rule border-ink ${
            spoken
              ? `w-[92%] bg-sheet ${atEnd ? 'animate-balloon-pop-end origin-bottom-left' : 'animate-balloon-pop origin-bottom-right'}`
              : 'w-full animate-sheet-in bg-ink'
          }`}
        >
          {/* a second, inner hairline: the sheet is printed, not drawn */}
          <span
            className={`pointer-events-none absolute inset-[3px] border-hair ${spoken ? 'border-ink/25' : 'border-sheet/20'}`}
            aria-hidden="true"
          />
          {/* the tail — a balloon points at the mouth it came from */}
          {spoken && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute -top-[9px] z-10 h-4 w-4 rotate-45 border-s-rule border-t-rule border-ink bg-sheet ${atEnd ? 'start-9' : 'end-9'}`}
            />
          )}
          {/* the red tab on the speaker's edge: this is a page of the same book, every time */}
          <span className={`pointer-events-none absolute inset-y-0 w-[4px] bg-red ${atEnd ? 'start-0' : spoken ? 'end-0' : 'start-0'}`} aria-hidden="true" />

          {/* היציאה — the same corner, every line, every conversation. */}
          <button
            type="button"
            onClick={onLeave}
            aria-label={t('life.leave')}
            title={t('life.leave')}
            data-life="leave"
            className={`absolute top-0 z-10 flex h-10 w-10 items-center justify-center font-display text-[15px] leading-none transition-colors duration-press active:bg-red active:text-sheet motion-reduce:transition-none ${
              spoken ? 'text-ink/45' : 'text-sheet/55'
            } ${spoken && !atEnd ? 'start-0' : 'end-0'}`}
          >
            <span aria-hidden="true">✕</span>
          </button>

          {/* the line — typed for the eye, complete for the reader */}
          <button
            type="button"
            onClick={hasChoices ? finish : advance}
            aria-label={hasChoices ? undefined : t('life.continue')}
            data-life="continue"
            className={`flex min-h-tap w-full items-start gap-3 pb-3 pt-3.5 text-start ${spoken && !atEnd ? 'pe-4 ps-11' : 'pe-11 ps-4'}`}
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

          {/* the choices — a ballot, one row each, the red square filling on press. A phone on
              its side has 390px of height: the ballot scrolls rather than losing its last row. */}
          {hasChoices && done && (
            <ul className={`max-h-[46vh] overflow-y-auto border-t-hair ${spoken ? 'border-ink' : 'border-sheet/30'}`} data-life="choices">
              {choices!.map((choice, index) => (
                <li
                  key={choice.id}
                  className={`animate-sheet-in border-b-hair last:border-b-0 ${spoken ? 'border-ink/20' : 'border-sheet/15'}`}
                  style={{ animationDelay: `${90 + index * 70}ms` }}
                  data-life="choice"
                  data-choice={choice.id}
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
