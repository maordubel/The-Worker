'use client'

import { useEffect, useState } from 'react'

import { Plate } from '@/components/life/Plate'
import { t } from '@/lib/i18n'
import { SETS, stickerFor, type StickerDef } from '@/lib/life/stickers'

/**
 * המעטפה — the four seconds that are the whole reason anybody buys one.
 *
 * A packet is not a reward screen. It is a small paper envelope that you tear along the
 * top, and the thing that makes it worth a shekel is that for one second you do not know.
 * So this card has exactly two states — SHUT and TORN — and the shut one is the point:
 * it sits there, closed, with the year printed on it, until a thumb touches it.
 *
 * Then the three come out ONE AT A TIME, four hundred milliseconds apart, and each one
 * says only whether it is new. `כבר יש` on a duplicate rather than a red cross, because a
 * duplicate is not a failure — it is the currency you go and trade with, and the game
 * should not teach the player to be sad about the thing it wants them to use.
 */
export function PacketCard({
  ids,
  before,
  onClose,
}: {
  /** what came out, in the order it comes out */
  ids: readonly string[]
  /** how many of each one was already stuck in, BEFORE this packet — so `חדש` is true */
  before: Readonly<Record<string, number>>
  onClose: () => void
}) {
  const [torn, setTorn] = useState(false)
  const [shown, setShown] = useState(0)
  const cards = ids.map((id) => stickerFor(id)).filter((one): one is StickerDef => one !== null)
  const set = cards[0] ? SETS[cards[0].set] : null

  useEffect(() => {
    if (!torn || shown >= cards.length) return
    const timer = window.setTimeout(() => setShown((n) => n + 1), 420)
    return () => window.clearTimeout(timer)
  }, [torn, shown, cards.length])

  const done = torn && shown >= cards.length

  return (
    <div
      dir="rtl"
      data-life="packet"
      data-torn={torn ? '1' : '0'}
      className="pointer-events-auto absolute inset-0 z-[62] flex flex-col items-center justify-center bg-ink/95 px-5"
    >
      {!torn ? (
        <button type="button" onClick={() => setTorn(true)} data-life="packet-open" className="min-h-tap">
          <Plate
            tone="red"
            className="flex aspect-[3/4] w-[62vw] max-w-[15rem] items-center justify-center shadow-lamp sm:w-[18rem]"
          >
            <span className="flex flex-col items-center px-3 py-6">
              <span className="font-poster text-[34px] leading-none tracking-[0.04em]">{t('life.packet.name')}</span>
              <span className="pt-2 font-sign text-[13px] opacity-90">{set?.seasonHe ?? ''}</span>
              <span className="pt-6 font-body text-[12px] opacity-80">{t('life.packet.open')}</span>
            </span>
          </Plate>
        </button>
      ) : (
        <div className="flex w-full max-w-[26rem] flex-col items-center">
          <div className="grid w-full grid-cols-3 gap-2">
            {cards.map((sticker, index) => {
              const isNew = (before[sticker.id] ?? 0) === 0
              const out = index < shown
              return (
                <div
                  key={`${sticker.id}-${index}`}
                  data-life="packet-card"
                  data-new={isNew ? '1' : '0'}
                  className={`sticker flex aspect-[3/4] flex-col overflow-hidden bg-sheet transition-opacity duration-200 ${
                    out ? 'packet-in opacity-100' : 'opacity-0'
                  }`}
                  style={{ ['--tilt' as string]: `${(index - 1) * 1.6}deg` }}
                >
                  {sticker.scan ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sticker.scan} alt={sticker.nameHe} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-paper p-1">
                      <span className="font-poster text-[22px] leading-none text-concrete" aria-hidden>
                        {sticker.printedN ?? sticker.slot}
                      </span>
                      <span className="pt-1 text-center font-sign text-[11px] leading-tight text-ink">
                        <bdi>{sticker.nameHe}</bdi>
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="grid w-full grid-cols-3 gap-2 pt-1">
            {cards.map((sticker, index) => (
              <span
                key={`${sticker.id}-label-${index}`}
                className={`text-center font-sign text-[10px] tracking-[0.14em] transition-opacity duration-200 ${
                  index < shown ? 'opacity-100' : 'opacity-0'
                } ${(before[sticker.id] ?? 0) === 0 ? 'text-sheet' : 'text-concrete/70'}`}
              >
                {t((before[sticker.id] ?? 0) === 0 ? 'life.packet.new' : 'life.packet.dup')}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            data-life="packet-close"
            className={`min-h-tap mt-5 border-rule border-sheet px-6 font-sign text-[13px] text-sheet transition-opacity duration-200 active:bg-red motion-reduce:transition-none ${
              done ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {t('life.packet.toAlbum')}
          </button>
        </div>
      )}
    </div>
  )
}
