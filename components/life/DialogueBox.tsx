'use client'

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
 * The box takes the whole width at the foot of the glass, and the tap target for
 * "continue" is the box itself — a 16px chevron is not a control on a phone.
 */
export function DialogueBox({
  lines,
  choices,
  portrait,
  offsetTop,
  onAdvance,
  onChoose,
}: {
  lines: DialogueLine[]
  choices?: DialogueChoice[]
  portrait?: string | null
  /** where the painting ends — the box sits directly under it, never on top of it */
  offsetTop?: number
  onAdvance: () => void
  onChoose: (id: string) => void
}) {
  const line = lines[0]
  if (!line) return null

  return (
    // `data-life` hooks are for `scripts/life/playthrough.mjs`, which plays the real
    // build in a browser. Asserting on rendered Hebrew would tie the harness to the
    // wording of a line, and the wording is content — it is meant to change.
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex items-end p-2.5"
      style={offsetTop ? { top: offsetTop, alignItems: 'flex-start' } : undefined}
      data-life="dialogue"
    >
      <div className="w-full border-rule border-ink bg-sheet">
        {line.who && (
          <div className="flex items-stretch gap-2.5 border-b-hair border-ink bg-ink">
            {/* The speaker's printed plate, cut from the cast board. It is square and
                borderless on the start side because it is pasted onto the ink strip, not
                framed by it — the brand has no rounded corners and no shadows. */}
            {portrait && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artUrl(portrait)}
                alt=""
                aria-hidden="true"
                className="h-[54px] w-[62px] shrink-0 border-e-hair border-ink object-cover"
              />
            )}
            <p className="self-center px-3 py-1.5 font-display text-[13px] leading-none text-sheet">
              <bdi>{line.who}</bdi>
            </p>
          </div>
        )}

        {choices && choices.length > 0 ? (
          <>
            <p className="px-3 pb-2 pt-3 font-body text-[15px] leading-relaxed text-ink" data-life="line">
              <bdi>{line.text}</bdi>
            </p>
            <ul className="border-t-hair border-ink">
              {choices.map((choice) => (
                <li key={choice.id} className="border-b-hair border-ink/20 last:border-b-0" data-life="choice">
                  <button
                    type="button"
                    disabled={choice.enabled === false}
                    onClick={() => onChoose(choice.id)}
                    className="flex min-h-tap w-full items-center justify-between gap-3 px-3 py-2 text-start transition-colors duration-press active:bg-red/10 disabled:opacity-45 motion-reduce:transition-none"
                  >
                    <span className="font-body text-[15px] leading-snug text-ink">
                      <bdi>{choice.text}</bdi>
                    </span>
                    {choice.enabled === false && choice.noteHe ? (
                      <span className="shrink-0 font-body text-[10px] leading-none text-muted">
                        <bdi>{choice.noteHe}</bdi>
                      </span>
                    ) : (
                      <span className="h-2.5 w-2.5 shrink-0 bg-red" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <button
            type="button"
            onClick={onAdvance}
            aria-label={t('life.continue')}
            className="flex min-h-tap w-full items-start gap-3 px-3 py-3 text-start"
          >
            <span className="flex-1 font-body text-[15px] leading-relaxed text-ink" data-life="line">
              <bdi>{line.text}</bdi>
            </span>
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-red" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
