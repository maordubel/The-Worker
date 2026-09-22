'use client'

import { ObjectMark } from '@/components/memory/ObjectMark'
import { Num } from '@/components/ui/Num'
import { numericFace } from '@/lib/game/memory-run'
import type { MemoryCard } from '@/lib/game/memory'
import { t } from '@/lib/i18n'

/**
 * לוח על הקיר — one card, in the four states it can be in.
 *
 * The board is a night screen, so the card is drawn as a plate under floodlight rather
 * than as a playing card: closed it is a faint frame with the archive object on it, open
 * it is enamel with the fact printed, matched it is vermilion and stamped.
 *
 * Two states exist only for a moment and both of them are feedback rather than
 * decoration — `wrong` shakes the two cards that did not belong together, `echo` blinks
 * the mate the run's one hint has pointed at. Both animations are the house ones from
 * `app/globals.css`, so both stop under `prefers-reduced-motion` (rule 21) while the
 * state they describe stays legible: the echo also gets a vermilion frame, which is not
 * an animation and is therefore what a reader who asked for stillness actually sees.
 */
export function ArchiveCard({
  card,
  open,
  done,
  wrong,
  echo,
  flashing,
  onFlip,
}: {
  card: MemoryCard
  open: boolean
  done: boolean
  wrong: boolean
  echo: boolean
  /** the whole wall is lit — every card is face up and none of them is tappable */
  flashing: boolean
  onFlip: (id: string) => void
}) {
  const face = open || done || flashing

  return (
    <button
      type="button"
      onClick={() => onFlip(card.id)}
      disabled={done || flashing}
      aria-pressed={face}
      aria-label={face ? `${card.face} — ${card.kind}` : `${t('memory.closed')} — ${card.kind}`}
      className={`relative flex min-h-tap w-full flex-col items-center justify-center gap-1 overflow-hidden border-hair p-1 text-center transition-transform duration-press ease-stamp active:scale-[.95] disabled:active:scale-100 motion-reduce:transition-none ${
        wrong ? 'animate-shake' : ''
      } ${echo ? 'animate-flash' : ''} ${
        done
          ? 'border-red bg-red text-sheet'
          : face
            ? 'border-sheet bg-sheet text-ink'
            : echo
              ? 'border-rule border-red bg-sheet/20 text-sheet'
              : 'border-sheet/45 bg-sheet/[.12] text-sheet/70'
      } aspect-[3/4]`}
    >
      {face ? (
        <span className="flex w-full flex-col items-center gap-0.5 leading-tight">
          <span className="line-clamp-3 w-full break-words px-0.5 font-sign text-[12px] font-bold">
            {/* a season, a year or a span is isolated LTR, or the bidi algorithm puts
                the dash of `2017/18–2021/22` on the wrong side of it — see `numericFace` */}
            {numericFace(card.face) ? <Num>{card.face}</Num> : card.face}
          </span>
          {/* The category is what makes this a memory game rather than a guessing game:
              it tells the player which four cards can possibly go together. */}
          <span className="w-full truncate font-body text-[8px] tracking-wide opacity-70">
            {card.kind}
          </span>
        </span>
      ) : (
        <>
          <ObjectMark object={card.object} className="h-7 w-7" />
          {/* v3: the category TAB on the closed card — which four cards can possibly go
              together is what makes this a memory game, and it has to be readable before
              anything is turned over, not only after */}
          <span className="absolute inset-x-0 bottom-0 truncate bg-sheet/[.14] px-0.5 py-[1px] font-body text-[8px] leading-tight text-sheet/80">
            {card.kind}
          </span>
        </>
      )}

      {done && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 end-0 animate-stamp-in border-hair border-sheet/70 px-1 font-body text-[7px] font-extrabold leading-none text-sheet/90"
        >
          {t('memory.locked')}
        </span>
      )}
    </button>
  )
}
