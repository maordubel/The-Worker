'use client'

import { useEffect, useState } from 'react'

import { Chip, SheetHead } from '@/components/life/Plate'
import { t } from '@/lib/i18n'
import { characterName } from '@/lib/life/characters'
import {
  SETS,
  SET_ORDER,
  albumTotals,
  duplicates,
  hasSticker,
  haveOf,
  holderOf,
  missingOn,
  stickersIn,
  type StickerDef,
  type StickerSet,
  type StickerSetId,
} from '@/lib/life/stickers'
import type { LifeState } from '@/lib/life/types'

/**
 * האלבום — twenty-two rectangles, six of which are photographs.
 *
 * The object this draws is specific and it is not a card collection screen. It is a
 * 1980s Israeli sticker album: a printed page of empty frames with the names already
 * under them, and the ones you have stuck on top, crooked, with the corner lifting. So
 * the empty slot is the DESIGN and not the absence of it — a page of dashed rectangles
 * with eleven names under them is what a boy actually looked at for a whole summer, and
 * flattening that into a grey grid of question marks would be drawing a different object.
 *
 * Three things this sheet will not do:
 * · **It never draws a face.** A slot is a scan or it is a printed frame with a name.
 *   There is no illustrated stand-in for a real footballer (rule 11).
 * · **It never captions a scan with a meaning.** `sourceHe` says where the paper came
 *   from and stops. The one exception is `handHe`, which is Maor's OWN sentence off his
 *   OWN album, drawn as what it is — tape stuck under the sticker with a line on it.
 * · **It never says how rare something is.** No stars, no percentage, no "1 in 40". A
 *   child does not know the odds; he knows nobody in his class has Landau.
 */
export function AlbumSheet({
  state,
  onClose,
}: {
  state: LifeState
  onClose: () => void
}) {
  const first = SET_ORDER.find((id) => stickersIn(id).some((sticker) => hasSticker(state, sticker.id))) ?? '8586'
  const [page, setPage] = useState<StickerSetId>(first)
  const [open, setOpen] = useState<StickerDef | null>(null)
  const set = SETS[page]
  const slots = stickersIn(page)
  const totals = albumTotals(state)
  const spare = duplicates(state)
  /*
   * מי מחזיק את מה שחסר — the whole point of the feature, said out loud.
   *
   * The rule is that the card you are missing is with whoever you have treated worst
   * (`holderOf`), and a rule the player cannot see is not a rule, it is a coincidence. So
   * the page names the child who has the next hole on it — only once you have a spare to
   * offer him, because before that the information is just a taunt.
   */
  const wanted = missingOn(state, page)
  const holder = spare.length > 0 && wanted ? holderOf(state, wanted.id) : null

  /**
   * Escape puts down whatever is in your hand: a held-up sticker first, the album after.
   * Two objects, one key, in the order somebody actually holds them — the same rule the
   * booklet reader follows.
   */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (open) setOpen(null)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /* nine pages do not fit across a phone, so the tab of the page you are on brings itself
     into view rather than leaving you to find it by dragging */
  useEffect(() => {
    const tab = document.querySelector<HTMLElement>('[data-life="album-tab"][data-on="1"]')
    tab?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [page])

  return (
    <div
      dir="rtl"
      data-life="album"
      data-page={page}
      className="pointer-events-auto absolute inset-0 z-[60] flex flex-col bg-paper"
    >
      {/* the same header every sheet in this game has: a sign plate on its arm, ✕ at the end */}
      <SheetHead
        title={t('life.album.title')}
        kicker={`${totals.have}/${totals.total}`}
        onClose={onClose}
        closeLabel={t('life.album.close')}
      />

      {/* the pages, as the tabs down the side of a real album's contents */}
      <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b-rule border-ink bg-paper px-2.5 pb-1.5">
        {SET_ORDER.map((id) => {
          const on = id === page
          const held = stickersIn(id).filter((sticker) => hasSticker(state, sticker.id)).length
          return (
            <Chip
              key={id}
              live={on}
              onClick={() => {
                setPage(id)
                setOpen(null)
              }}
              data-life="album-tab"
              data-on={on ? '1' : '0'}
              className="shrink-0"
            >
              <span dir="ltr">{SETS[id].shortHe}</span>
              <span className="font-mono text-[10px] tabular-nums opacity-75">
                {t('life.album.page', { have: String(held), total: String(stickersIn(id).length) })}
              </span>
            </Chip>
          )
        })}
      </div>

      <div className="paper min-h-0 flex-1 overflow-y-auto px-3 pt-2.5 pb-[max(16px,env(safe-area-inset-bottom))]">
        {set.posterArt && (
          <figure className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={set.posterArt} alt={set.titleHe} className="w-full object-contain shadow-lamp" />
            {set.posterSourceHe && (
              <figcaption className="pt-1 text-center font-body text-[10px] leading-snug text-muted">
                <bdi>{set.posterSourceHe}</bdi>
              </figcaption>
            )}
          </figure>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {slots.map((sticker) => (
            <Slot
              key={sticker.id}
              sticker={sticker}
              have={haveOf(state, sticker.id)}
              frame={set.frame}
              onOpen={() => setOpen(sticker)}
            />
          ))}
        </div>

        {spare.length > 0 && (
          <div className="mt-4 border-t-hair border-ink/30 pt-2" data-life="album-spares">
            <p className="font-sign text-[12px] text-ink">{t('life.album.spares', { n: String(spare.length) })}</p>
            <p className="pt-0.5 font-body text-[11px] leading-snug text-muted">
              {spare.map((one) => one.nameHe).join(' · ')}
            </p>
            <p className="pt-1 font-body text-[11px] leading-snug text-muted">
              {holder && wanted
                ? t('life.album.holder', { name: characterName(holder), card: wanted.nameHe })
                : t('life.album.trade')}
            </p>
          </div>
        )}
      </div>

      {open && (
        <button
          type="button"
          aria-label={t('life.album.close')}
          data-life="album-held"
          onClick={() => setOpen(null)}
          className="min-h-tap absolute inset-0 z-10 flex cursor-default flex-col items-center justify-center bg-ink/95 px-5"
        >
          {open.scan ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={open.scan} alt={open.nameHe} className="sticker sticker-held max-h-[62vh] max-w-full object-contain" />
          ) : (
            <span className="sticker sticker-held block">
              <Printed sticker={open} frame={SETS[open.set].frame} big />
            </span>
          )}
          {open.handHe && (
            <span className="mt-2 max-w-[26rem] bg-red px-3 py-1.5 text-center font-body text-[13px] leading-snug text-sheet">
              <bdi>{open.handHe}</bdi>
            </span>
          )}
          <p className="max-w-prose pt-2 text-center font-body text-[11px] leading-snug text-concrete">
            <bdi>{open.sourceHe}</bdi>
          </p>
        </button>
      )}
    </div>
  )
}

/**
 * הזווית — how crooked this one went in, decided once and never again.
 *
 * Nobody has ever stuck a sticker in straight, and a page of perfectly aligned rectangles
 * is a spreadsheet. The angle comes off the sticker's own id so it survives every
 * re-render and every reload: the same sticker is always crooked the same way, which is
 * what makes it read as a thing somebody stuck down rather than an animation.
 */
function tiltOf(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 1000
  return `${(hash % 9) / 2 - 2}deg`
}

/** one rectangle on the page: a lit card on its slot, or the printed slot on its own */
function Slot({
  sticker,
  have,
  frame,
  onOpen,
}: {
  sticker: StickerDef
  have: number
  frame: StickerSet['frame']
  onOpen: () => void
}) {
  if (have === 0) {
    return (
      <div
        data-life="album-slot"
        data-have="0"
        className="slot-marks relative flex aspect-[3/4] flex-col items-center justify-end border-hair border-dashed border-ink/35 bg-sheet/40 p-1.5"
      >
        <span className="absolute start-1.5 top-1 font-mono text-[10px] tabular-nums text-muted/60">
          {sticker.printedN ?? sticker.slot}
        </span>
        <span className="text-center font-body text-[11px] leading-tight text-muted">
          <bdi>{sticker.nameHe}</bdi>
        </span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      data-life="album-slot"
      data-have={String(have)}
      className="min-h-tap slot-marks relative flex aspect-[3/4] w-full items-center justify-center p-[6%]"
    >
      {/* the bloom lives on the OUTER span: `overflow-hidden` on the same element clips
          its own ::before, which is how the first pass shipped a halo nobody could see */}
      <span className="sticker block h-full w-full" style={{ ['--tilt' as string]: tiltOf(sticker.id) }}>
        <span className="relative block h-full w-full overflow-hidden bg-sheet/0">
          {sticker.scan ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sticker.scan}
              alt={sticker.nameHe}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
            />
          ) : (
            <Printed sticker={sticker} frame={frame} />
          )}
        </span>
      </span>
      {have > 1 && (
        <span className="absolute end-0 top-0 z-[2] bg-ink px-1 font-mono text-[10px] tabular-nums text-sheet">
          ×{have}
        </span>
      )}
    </button>
  )
}

/**
 * מדבקה בלי סריקה — the frame the year printed, with a name in it and nothing else.
 *
 * This is the honest half of the album. The archive holds six photographs; the other
 * sixteen men in it were on the page too, and the game knows their names from a source it
 * can cite. So the slot is filled the way a slot with no picture is filled: the border
 * the year used, the name, the role if the source gave one. Nobody's face is guessed.
 */
function Printed({
  sticker,
  frame,
  big = false,
}: {
  sticker: StickerDef
  frame: StickerSet['frame']
  big?: boolean
}) {
  /*
   * A sticker with no photograph must read as a CARD and still lose to one that has a
   * photograph. The first pass made it a solid vermilion block, which won every page it
   * was on — sixteen red rectangles shouting over the two real scans. So the ground is
   * paper and the year is carried by the RULE around it: a black rule in 1980, a
   * vermilion one after. Same information, a quarter of the volume.
   */
  const rule = frame === '80' || frame === '98' ? 'border-ink' : 'border-red'
  return (
    <div
      data-life="album-printed"
      data-frame={frame}
      className={`flex h-full w-full flex-col border-rule ${rule} bg-sheet p-[5%] ${big ? 'aspect-[3/4] h-[52vh] w-auto max-w-full' : ''}`}
    >
      <div className="relative flex flex-1 flex-col items-center justify-center bg-paper/70">
        {/* the wordmark, small, where the printer put it — this is a card, not a gap */}
        <span
          aria-hidden
          className="absolute start-1 top-1 font-poster text-[8px] leading-none tracking-[0.06em] text-red/80"
        >
          {t('life.packet.name')}
        </span>
        <span className="font-poster text-[26px] leading-none text-red/45" aria-hidden>
          {sticker.printedN ?? sticker.slot}
        </span>
        <span className="px-1 pt-1 text-center font-body text-[9px] leading-tight text-muted">
          <bdi>{sticker.roleHe ?? t('life.album.club')}</bdi>
        </span>
      </div>
      <span
        className={`mt-[4%] block px-1 text-center font-sign text-[11px] leading-tight ${
          frame === '80' || frame === '98' ? 'bg-ink text-sheet' : 'bg-red text-sheet'
        }`}
      >
        <bdi>{sticker.nameHe}</bdi>
      </span>
    </div>
  )
}
