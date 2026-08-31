'use client'

/**
 * שורת תשובה. Picking marks the row with red at 9% — never green/red on the answer.
 * The feedback is the stamp.
 */
export function AnswerRow({
  letter,
  text,
  picked,
  onPick,
}: {
  letter: string
  text: string
  picked: boolean
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={picked}
      className={`flex min-h-tap w-full items-center gap-3 border-b-hair border-ink/30 px-1 py-3.5 text-start transition-transform duration-press active:scale-[.96] motion-reduce:transition-none ${
        picked ? 'bg-red/[.09]' : ''
      }`}
    >
      <span
        className="grid h-6 w-6 place-items-center border-rule border-ink font-sign text-red"
        aria-hidden="true"
      >
        {picked ? '✗' : ''}
      </span>
      <span className="w-4 font-body text-[11px] text-muted">{letter}</span>
      {/* Answers are Hebrew prose, not figures. They were set in the mono face at
          step-1 — a typewriter face at heading size, which is why they read badly and
          overflowed on a phone. Body face, one step down, normal weight. */}
      <span className="font-body text-step-0 leading-snug text-ink">{text}</span>
    </button>
  )
}
