'use client'

import { useState } from 'react'

import { PlayerFigure } from '@/components/press/PlayerFigure'
import { Num } from '@/components/ui/Num'
import { t } from '@/lib/i18n'
import type { DrawnKit } from '@/lib/game/kits'

/**
 * ארון המדים — the kit rack.
 *
 * Maor's note was that you could not actually SEE the kits. A colour swatch and a name
 * are data about a shirt; a drawn player wearing it, with the sponsor lettered across
 * the chest, is the shirt. Every season the archive verifies gets a hanger.
 *
 * What is drawn is only what is verified: the club's colours, the maker's mark and the
 * sponsor. The cut is not sourced anywhere, and the screen says so rather than
 * inventing a collar.
 */
export function KitGallery({ kits }: { kits: DrawnKit[] }) {
  const [openSeason, setOpenSeason] = useState<string | null>(kits[0]?.season ?? null)
  const open = kits.find((kit) => kit.season === openSeason) ?? kits[0]

  if (!open) return null

  // A season with competition-scoped sponsors is worn once per competition — 2010/11
  // is genuinely two different shirts.
  const shirts =
    open.sponsors.length > 0
      ? open.sponsors
      : [{ name: '', competition: null, noteHe: null }]

  return (
    <div className="mt-stack">
      {/* the rack */}
      <div className="tex-paper-night press-box relative overflow-hidden p-4">
        <div className="tex-spot pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative flex flex-wrap items-start justify-center gap-5">
          {shirts.map((shirt) => (
            <figure
              key={`${shirt.name}-${shirt.competition ?? 'all'}`}
              className="flex w-[128px] flex-col items-center"
            >
              <PlayerFigure
                kit={{
                  primary: open.primary,
                  secondary: open.secondary,
                  trim: open.trim,
                  pattern: 'solid',
                  collar: 'crew',
                  longSleeve: false,
                  shorts: open.shorts,
                  socks: open.socks,
                  ink: open.ink,
                }}
                maker={open.maker}
                sponsor={shirt.name || null}
                number={10}
                size={128}
                title={t('kit.wornAria')}
              />
              <figcaption className="mt-1 text-center">
                <span className="block font-poster text-[15px] text-night-accent">
                  <Num>{open.season}</Num>
                </span>
                <span className="block font-body text-[11px] leading-tight text-night-ink">
                  {open.maker}
                </span>
                {shirt.competition && (
                  <span className="block font-body text-[10px] leading-tight text-night-inkDim">
                    {shirt.competition}
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>

        {open.sponsors.some((sponsor) => sponsor.noteHe) && (
          <p className="relative mt-3 text-center font-body text-[11px] leading-relaxed text-night-inkDim">
            {open.sponsors.find((sponsor) => sponsor.noteHe)?.noteHe}
          </p>
        )}

        <p className="press-rule-hair relative mt-4 pt-2 text-center font-body text-[10px] leading-relaxed text-night-inkFaint">
          {t('kit.cutUnverified')}
        </p>
      </div>

      {/* the hanger rail — every verified season */}
      <div
        className="mt-3 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label={t('kit.seasons')}
      >
        {kits.map((kit) => {
          const isOpen = kit.season === open.season
          return (
            <button
              key={kit.season}
              type="button"
              role="tab"
              aria-selected={isOpen}
              onClick={() => setOpenSeason(kit.season)}
              className={`flex min-h-tap shrink-0 flex-col justify-center border-rule px-3 transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                isOpen
                  ? 'border-red bg-red text-sheet'
                  : 'border-ink bg-sheet text-ink'
              }`}
            >
              <span className="font-poster text-[13px]">
                <Num>{kit.season}</Num>
              </span>
              <span className="font-body text-[10px] leading-none opacity-80">{kit.maker}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
