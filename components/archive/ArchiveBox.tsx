'use client'

import { useState } from 'react'

import { useDialog } from '@/components/ui/useDialog'
import type { ArchiveCard } from '@/lib/archive/graph-types'
import { t } from '@/lib/i18n'
import { ArtifactMark, CardHeadline, CloseMark, Eyebrow, LATIN } from './EntityCard'

/**
 * קופסת הארכיון — "פשוט תחפור" (brief §22 "Archive Box / Dig").
 *
 * The physical interaction is kept exactly: the first tap LIFTS an item off the table
 * (it rises, turns straight and shows one more line); a second tap on the same item
 * OPENS it. Eight things at a time, seeded by the visit and the number of shuffles
 * (rule 24), optionally from one decade — and the decades are the archive's own.
 *
 * Each item is dressed by what it is — a ticket, a clipping, a file, a pennant, a photo
 * strip — in tokens; nothing is a photograph and nothing pretends to be a real ticket
 * (spec §2: `usable_in_app` is false for props).
 */

const TILT = [-2, 1.5, -1, 2, -1.5, 1, 2, -2] as const

const SKIN: Record<ArchiveCard['type'], string> = {
  match: 'border-dashed border-ink bg-sheet',
  press: 'border-ink/60 bg-paper',
  person: 'border-ink bg-sheet',
  season: 'border-red bg-sheet',
  kit: 'border-ink bg-paper',
  trophy: 'border-sign bg-sheet',
  moment: 'border-ink bg-sheet',
  object: 'border-sign bg-paper',
  song: 'border-ink/60 bg-sheet',
  fans: 'border-red bg-paper',
  place: 'border-ink bg-paper',
  team: 'border-ink/60 bg-sheet',
}

export function ArchiveBox({
  items,
  decades,
  decade,
  busy,
  onDecade,
  onShuffle,
  onOpen,
  onSearch,
  onClose,
}: {
  items: ArchiveCard[]
  decades: number[]
  decade: number | null
  busy: boolean
  onDecade: (decade: number | null) => void
  onShuffle: () => void
  onOpen: (id: string) => void
  onSearch: () => void
  onClose: () => void
}) {
  const ref = useDialog<HTMLDivElement>(onClose)
  const [lifted, setLifted] = useState<string | null>(null)

  function tap(id: string) {
    if (lifted !== id) {
      setLifted(id)
      return
    }
    onOpen(id)
  }

  const label = (d: number) => t('archive.box.decade', { d: d >= 2000 ? String(d) : String(d % 100).padStart(2, '0') })

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={t('archive.box.aria')}
      className="fixed inset-0 z-[60] flex flex-col bg-ink outline-none"
    >
      <div className="flex items-start justify-between gap-3 border-b-plate border-red px-gutter pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="font-latin text-[10px] font-bold tracking-[0.24em] text-red" dir="ltr">
            OPEN THE ARCHIVE BOX
          </p>
          <h2 className="font-display text-step-3 leading-tight text-paper">{t('archive.box.title')}</h2>
          <p className="font-body text-[12.5px] leading-snug text-concrete">{t('archive.box.lede')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('archive.drawer.close')}
          className="flex min-h-tap min-w-tap shrink-0 items-center justify-center border-rule border-concrete font-poster text-[22px] leading-none text-paper"
        >
          <CloseMark className="stroke-paper" />
        </button>
      </div>

      {/*
        השולחן — the dig table itself (delta 87, 23.9.2026).

        `public/archive/dig-table-desktop.webp` (1600×900, art-directed from the
        owner's 1672×941 original) and `dig-table-phone.webp` (900×1200, from his
        1086×1448 original) — the box/drawer surface the brief's "קופסה" section asked
        for. Both generated 21.9.2026, supplied by the owner; processed for this delta
        (center-cropped to these exact ratios, re-encoded to webp) by
        `/tmp/process_gate12.py`'s pipeline, the same de-yellow pass
        `scripts/brand/badge.py` uses (hue band 37–76°, rotated to a warm brown at the
        same saturation/value) — a scan of both source files found zero pixels in the
        band, so no pixel needed rotating, and the scan itself is the record of that.
        `bg-sign/20` stays UNDER the art as the legibility wash the cards already relied
        on, not as a replacement for it.
      */}
      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-sign/20 px-gutter py-4">
        <picture aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 block h-full w-full">
          <source media="(min-width: 768px)" srcSet="/archive/dig-table-desktop.webp" />
          <img
            src="/archive/dig-table-phone.webp"
            alt=""
            className="h-full w-full object-cover opacity-35"
          />
        </picture>
        {items.length === 0 ? (
          <p className="mx-auto max-w-sm border-hair border-concrete/40 px-3 py-3 font-body text-[13px] text-concrete">{t('archive.box.empty')}</p>
        ) : (
          <ul className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4" aria-busy={busy}>
            {items.map((card, index) => {
              const up = lifted === card.id
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => tap(card.id)}
                    aria-pressed={up}
                    aria-describedby={up ? `lift-${index}` : undefined}
                    style={{ transform: up ? 'translateY(-10px) rotate(0deg) scale(1.04)' : `rotate(${TILT[index % TILT.length]}deg)` }}
                    className={`flex min-h-[148px] w-full flex-col items-start border-rule p-2.5 text-start transition-transform duration-stamp ease-stamp motion-reduce:transition-none ${SKIN[card.type]} ${
                      up ? 'outline outline-4 outline-red' : ''
                    }`}
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className="font-latin text-[9px] font-bold tracking-[0.2em] text-sign" dir="ltr">
                        {LATIN[card.type]}
                      </span>
                      <ArtifactMark card={card} className="h-8 w-8 shrink-0" />
                    </span>
                    <CardHeadline card={card} className="mt-1 line-clamp-3 font-sign text-[14px] leading-tight text-ink" />
                    <Eyebrow card={card} className="mt-auto pt-1" />
                    {up && (
                      <span id={`lift-${index}`} className="mt-1 block border-t-hair border-ink/30 pt-1 font-body text-[11.5px] font-bold leading-snug text-red">
                        {card.subHe ? <bdi>{card.subHe} · </bdi> : null}
                        {t('archive.box.lifted')}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t-rule border-concrete/40 px-gutter pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
        <div className="-mx-gutter flex gap-1.5 overflow-x-auto px-gutter pb-2" role="group" aria-label={t('archive.time.decade')}>
          <button
            type="button"
            onClick={() => onDecade(null)}
            aria-pressed={decade === null}
            className={`min-h-tap shrink-0 border-rule px-3 font-body text-[13px] font-bold ${decade === null ? 'border-red bg-red text-paper' : 'border-concrete/60 text-paper'}`}
          >
            {t('archive.box.all')}
          </button>
          {decades.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDecade(d)}
              aria-pressed={decade === d}
              className={`min-h-tap shrink-0 border-rule px-3 font-body text-[13px] font-bold ${decade === d ? 'border-red bg-red text-paper' : 'border-concrete/60 text-paper'}`}
            >
              {label(d)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setLifted(null); onShuffle() }} disabled={busy} className="min-h-tap border-rule border-paper bg-paper font-body text-[14px] font-extrabold text-ink disabled:opacity-60">
            {t('archive.box.shuffle')}
          </button>
          <button type="button" onClick={onSearch} className="min-h-tap border-rule border-concrete font-body text-[14px] font-bold text-paper">
            {t('archive.drawer.deep')}
          </button>
        </div>
      </div>
    </div>
  )
}
