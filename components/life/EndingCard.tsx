'use client'

import { LifeLine, ageReached } from '@/components/life/LifeLine'
import { artUrl } from '@/lib/life/runtime/art'
import { keepsakeFor } from '@/lib/life/finale'
import { t } from '@/lib/i18n'

/**
 * סוף היום — not a score screen.
 *
 * Brief §25 is explicit that the reward is INDEPENDENCE and that reducing it to a stat
 * popup is the failure mode. So this card says what happened and what is now in the red
 * box, and it counts nothing. The numbers the day moved stay where they belong: inside
 * the life, invisible, changing what people do next time.
 */
export function EndingCard({
  titleHe,
  bodyHe,
  memoryHe,
  after,
  chapter = '1986',
  presence = null,
  onClose,
}: {
  titleHe: string
  bodyHe: string
  memoryHe: string
  /** two plates of one person, one from today and one from a decade away */
  after?: { fromArt: string; toArt: string; lineHe: string } | null
  /** which Saturday this card closes — it decides which slot of the life lights up */
  chapter?: string
  /** where he was for the thing that happened — only somebody who was there kept a stub */
  presence?: string | null
  onClose: () => void
}) {
  // 1986's second plate is the man fifteen years on; 1990's is the same man tomorrow.
  const nowKey = chapter === '1990' ? 'life.after.next' : 'life.after.now'
  /**
   * מה שיש לו ביד — the real object from the night this card is closing, or nothing.
   *
   * The memory line above it has always said what stayed in his pocket; from 16.9.2026 the
   * days the archive holds paper for can SHOW it. It is a scan of a thing that exists,
   * shown whole, with the document's own printed words under it — never a caption in the
   * game's voice, because rule 49 does not allow this game to write on one of these.
   *
   * `keepsakeFor` refuses it to anybody whose night was spent somewhere else. That gate is
   * the point of the feature, not a safety rail around it: a stub shown to the man who
   * listened on a base would be the game telling him he was there.
   */
  const keepsake = keepsakeFor(chapter, presence)
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-ink/85 p-gutter" data-life="ending">
      <div className="max-h-full w-full max-w-md animate-paste-in overflow-y-auto border-rule border-sheet bg-ink">
        <div className="px-5 pb-5 pt-6">
          <div className="h-[6px] w-16 bg-red" aria-hidden="true" />
          <h2 className="mt-3 font-display text-step-3 leading-tight text-sheet">
            <bdi>{titleHe}</bdi>
          </h2>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-concrete">
            <bdi>{bodyHe}</bdi>
          </p>
          <p className="mt-4 border-t-hair border-concrete/30 pt-3 font-body text-[13px] leading-relaxed text-sheet">
            <bdi>{memoryHe}</bdi>
          </p>

          {keepsake && (
            <figure className="mt-4 border-t-hair border-concrete/30 pt-4" data-life="ending-keepsake">
              <div className="border-hair border-concrete/40 bg-ink/60 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artUrl(keepsake.art)} alt={keepsake.titleHe} className="mx-auto max-h-[30vh] w-full object-contain" />
              </div>
              <figcaption className="mt-2 font-body text-[11px] leading-relaxed text-concrete">
                <span className="text-sheet">{t('life.report.prints')} </span>
                <bdi>{keepsake.printsHe}</bdi>
              </figcaption>
            </figure>
          )}

          {/* כעבור חמש־עשרה שנה. Two plates, one caption, and no claim about what happened
              in between — the picture does the work a paragraph would do worse. */}
          {after && (
            <div className="mt-4 border-t-hair border-concrete/30 pt-4" data-life="after">
              <div className="grid grid-cols-2 gap-px bg-concrete/30">
                {[
                  { art: after.fromArt, label: t('life.after.then') },
                  { art: after.toArt, label: t(nowKey) },
                ].map((plate) => (
                  <figure key={plate.art} className="bg-ink">
                    <div className="flex h-[132px] items-end justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={artUrl(plate.art)}
                        alt=""
                        aria-hidden="true"
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                    <figcaption className="border-t-hair border-concrete/30 px-2 py-1.5 text-center font-body text-[10px] leading-none text-concrete">
                      <bdi>{plate.label}</bdi>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="mt-3 font-body text-[13px] leading-relaxed text-concrete">
                <bdi>{after.lineHe}</bdi>
              </p>
            </div>
          )}

          <div className="mt-4">
            <LifeLine reached={ageReached(chapter)} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 flex min-h-tap w-full items-center justify-center border-rule border-sheet bg-red px-4 transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none"
          >
            <span className="font-display text-[15px] text-sheet">{t('life.ending.home')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
