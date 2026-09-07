'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

import { KitShirt } from '@/components/kit/KitShirt'
import { t } from '@/lib/i18n'
import { formatMoney } from '@/lib/life/money'
import type { LifeBusEvents } from '@/lib/life/runtime/bus'
import { chapterFor } from '@/lib/life/content/chapters'
import { onSale, owns, shirtFlag, wornIn, type Shirt } from '@/lib/life/shirts'
import type { LifeState } from '@/lib/life/types'

/**
 * חנות האוהדים — the rail, not the room.
 *
 * The shop was a location for exactly one delta: a 360° panorama Maor sent, reprojected
 * into a room, with a shirt hung on the wall. His verdict on the screenshot settled it —
 * "נראית נורא ואיום… שווה לעשות חנות כפיצ׳ר פנימי, ולא כחלל" — and he was right on both
 * counts. An empty room with one object in it is worse than no room; and buying a shirt is
 * not a thing you walk about doing, it is a thing you do at a rail with your money in your
 * hand.
 *
 * So the door on the street opens this. Everything the club had made BY THIS CHAPTER,
 * drawn: the seven Maor photographed as photographs, the club's own season kits drawn from
 * their archive specs by the same component the kits screen uses. What you own is stamped.
 * What you cannot afford says what it costs rather than going grey and silent. And the
 * count at the top is of shirts that EXIST now, so a collection in 1985 is three deep and
 * not forty.
 *
 * Two shelves, in the order a supporter thinks in: what is new to you first, then what is
 * already yours. Nobody wants to scroll past their own wardrobe to find the new kit.
 */
export function ShopCard({
  shop,
  state,
  onBuy,
  onClose,
}: {
  shop: NonNullable<LifeBusEvents['shop']>
  state: LifeState
  onBuy: (shirt: Shirt) => void
  onClose: () => void
}) {
  const [look, setLook] = useState<Shirt | null>(null)
  const rail = useMemo(() => onSale(shop.chapter), [shop.chapter])
  const mine = rail.filter((shirt) => owns(state, shirt.id))
  const theirs = rail.filter((shirt) => !owns(state, shirt.id))

  return (
    <div
      dir="rtl"
      className="absolute inset-0 z-[95] flex flex-col bg-ink"
      data-life="shop-card"
    >
      {/* ---------------------------------------------------------------- the sign -- */}
      {/**
       * המוט על הקיר — Maor's photograph of the rail, 6.9.2026, behind the shop's name.
       *
       * A shop that is a SCREEN and not a room has one problem: it has no walls, so it has
       * nowhere to be. This is the wall. The empty hangers are the point — the rail below
       * fills them in — and the ink wash over it is heavy enough that the name and the
       * money read as type rather than as something photographed.
       */}
      <header
        className="relative flex items-end justify-between gap-3 overflow-hidden border-b-rule border-red px-4 pb-3 pt-5"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(17,17,17,0.62), rgba(17,17,17,0.88)), url(/life/art/shopHanger.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 38%',
        }}
      >
        <div>
          <p className="font-display text-[12px] uppercase tracking-[0.24em] text-red">
            {t('life.shop.kicker')}
          </p>
          <h2 className="mt-0.5 font-display text-[22px] leading-none text-sheet">{t('life.shop.title')}</h2>
        </div>
        <div className="text-end">
          <p className="font-mono text-[16px] leading-none tabular-nums text-sheet">{formatMoney(state.agorot)}</p>
          <p className="mt-1 font-mono text-[11px] leading-none tabular-nums text-concrete">
            {mine.length} / {rail.length} {t('life.shirt.collection')}
          </p>
        </div>
      </header>

      {/* ---------------------------------------------------------------- the rail -- */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {theirs.length > 0 && (
          <>
            <p className="px-1 pb-2 font-display text-[12px] uppercase tracking-[0.2em] text-concrete">
              {t('life.shop.forSale')}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {theirs.map((shirt) => (
                <Hanger
                  key={shirt.id}
                  shirt={shirt}
                  owned={false}
                  affordable={state.agorot >= shirt.price * 100}
                  onPick={() => setLook(shirt)}
                />
              ))}
            </div>
          </>
        )}

        {mine.length > 0 && (
          <>
            <p className="px-1 pb-2 pt-4 font-display text-[12px] uppercase tracking-[0.2em] text-concrete">
              {t('life.shop.yours')}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {mine.map((shirt) => (
                <Hanger
                  key={shirt.id}
                  shirt={shirt}
                  owned
                  affordable
                  days={wornIn(state, shirt.id).length}
                  onPick={() => setLook(shirt)}
                />
              ))}
            </div>
          </>
        )}

        {rail.length === 0 && <p className="px-1 py-8 font-body text-[14px] text-concrete">{t('life.shop.empty')}</p>}
      </div>

      {/* --------------------------------------------------------------- the door -- */}
      <button
        type="button"
        onClick={onClose}
        className="min-h-tap w-full border-t-rule border-concrete/30 bg-ink px-4 py-3 font-display text-[15px] leading-none text-sheet"
      >
        {t('life.shop.leave')}
      </button>

      {/* -------------------------------------------------- one shirt, held up -- */}
      {look && (
        <div className="absolute inset-0 z-[10] flex flex-col bg-ink/95 px-5 py-6">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
            <div className="flex aspect-square w-[min(58vw,300px)] items-center justify-center">
              <Draw shirt={look} />
            </div>
            <p className="mt-3 font-display text-[19px] leading-tight text-sheet">{look.nameHe}</p>
            <p className="mt-1 font-mono text-[12px] tracking-wide text-concrete">
              <bdi>{look.sponsorHe}</bdi>
              <span className="px-2 text-red">·</span>
              <bdi>{look.yearsHe}</bdi>
            </p>
            <p className="mt-3 max-w-[34ch] font-body text-[13px] leading-relaxed text-concrete">{look.noteHe}</p>
            {look.sourceHe && (
              <p className="mt-2 max-w-[34ch] font-body text-[11px] leading-snug text-concrete/70">
                <bdi>{look.sourceHe}</bdi>
              </p>
            )}

            {/*
              איפה היית איתה — the line that turns a wardrobe into a biography.

              A price makes a shirt an object. "לבשת אותה ב־26.5.1999 · שש־עשרה שנה" makes
              it the day itself, and it is printed here for as long as the save lives.
            */}
            <Worn state={state} shirt={look} />
          </div>

          <div className="flex gap-3">
            {owns(state, look.id) ? (
              <p className="min-h-tap flex flex-1 items-center justify-center border-rule border-red px-4 font-display text-[15px] text-red">
                {t('life.shop.owned')}
              </p>
            ) : (
              <button
                type="button"
                disabled={state.agorot < look.price * 100}
                onClick={() => {
                  onBuy(look)
                  setLook(null)
                }}
                className="min-h-tap flex-1 border-rule border-red bg-red px-4 py-3 font-display text-[15px] leading-none text-sheet disabled:border-concrete/40 disabled:bg-transparent disabled:text-concrete"
              >
                {state.agorot < look.price * 100
                  ? t('life.shop.short', { n: String(look.price) })
                  : t('life.shop.buy', { n: String(look.price) })}
              </button>
            )}
            <button
              type="button"
              onClick={() => setLook(null)}
              className="min-h-tap px-4 py-3 font-body text-[13px] text-concrete underline underline-offset-4"
            >
              {t('life.shop.back')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** every day this shirt was worn to, with the date the archive gives that day */
function Worn({ state, shirt }: { state: LifeState; shirt: Shirt }) {
  const days = wornIn(state, shirt.id)
    .map((chapter) => chapterFor(chapter))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => a.year - b.year)
  if (days.length === 0) return null
  return (
    <div className="mt-4 w-full max-w-[34ch] border-t-hair border-red/40 pt-3">
      <p className="font-display text-[11px] uppercase tracking-[0.2em] text-red">{t('life.shop.worn')}</p>
      {days.map((day) => (
        <p key={day.id} className="mt-1 font-body text-[12px] leading-snug text-sheet">
          <bdi>{day.dateHe}</bdi>
          <span className="px-2 text-concrete">·</span>
          <bdi className="text-concrete">{day.titleHe}</bdi>
        </p>
      ))}
    </div>
  )
}

/** one shirt on a hanger: drawn or photographed, with what it costs under it */
function Hanger({
  shirt,
  owned,
  affordable,
  days = 0,
  onPick,
}: {
  shirt: Shirt
  owned: boolean
  affordable: boolean
  /** how many days you wore it to — a shirt with a history is marked in the grid */
  days?: number
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`min-h-tap flex flex-col items-center border-hair px-2 pb-2 pt-3 text-center transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none ${
        owned ? 'border-red/60 bg-red/10' : 'border-concrete/30 bg-sheet/[0.04]'
      }`}
      data-shirt={shirt.id}
    >
      <div className="flex aspect-square w-full items-center justify-center">
        <Draw shirt={shirt} />
      </div>
      <p className="mt-1 line-clamp-2 font-body text-[11px] leading-tight text-sheet">{shirt.nameHe}</p>
      <p
        className={`mt-1 font-mono text-[11px] leading-none tabular-nums ${
          owned ? 'text-red' : affordable ? 'text-sheet' : 'text-concrete'
        }`}
      >
        {owned ? t('life.shop.have') : `${shirt.price} ₪`}
      </p>
      {days > 0 && (
        <p className="mt-0.5 flex items-center justify-center gap-1 font-mono text-[10px] leading-none text-red">
          {Array.from({ length: Math.min(days, 5) }, (_, i) => (
            <span key={i} aria-hidden className="inline-block h-1 w-1 bg-red" />
          ))}
          <span className="ps-1">{t('life.shop.days', { n: String(days) })}</span>
        </p>
      )}
    </button>
  )
}

/** the two ways a shirt exists in this project: a photograph, or the club's own spec */
function Draw({ shirt }: { shirt: Shirt }) {
  if (shirt.spec) return <KitShirt spec={shirt.spec} className="h-full w-full" title={shirt.nameHe} />
  return (
    <div className="relative h-full w-full">
      <Image src={`/life/art/${shirt.art}.png`} alt={shirt.nameHe} fill sizes="180px" className="object-contain" />
    </div>
  )
}

export { shirtFlag }
