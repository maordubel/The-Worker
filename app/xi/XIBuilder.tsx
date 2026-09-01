'use client'

import { useMemo, useState } from 'react'

import { Num } from '@/components/ui/Num'
import { ShareRow } from '@/components/share/ShareRow'
import type { Formation, PitchSlot } from '@/lib/game/lineup'
import type { RosterEntry, RosterIndex } from '@/lib/game/allTimeXI'
import { t } from '@/lib/i18n'

/**
 * הרכב כל הזמנים — pick eleven from everyone who ever wore the shirt.
 *
 * The pitch is drawn in the PRESS layer's tokens (`--p-grass`, `--p-grass-dark`,
 * `--p-halo`), which is what that layer is for — a printed pitch. They go through
 * `style` rather than a Tailwind class because the values are custom properties the
 * shell's palette deliberately does not expose as utilities.
 *
 * Free play. No clock, no lives, no score — the reward is the picture and the argument
 * it starts, which is the reward the game has always had in real life.
 *
 * The design problem is 637 names. A dropdown of 637 is a wall, so: tap a slot on the
 * pitch, and the roster opens as a sheet with a search that matches ANY part of the name
 * (a supporter types "בוזגלו", not "מאור"), plus an alphabet rail keyed on the family
 * name. Picking closes the sheet and puts the chip on the grass. Nothing is graded and
 * nothing is required — an eleven with three empty slots still shares.
 */
export function XIBuilder({
  formations,
  roster,
}: {
  formations: Formation[]
  roster: RosterIndex
}) {
  const [formation, setFormation] = useState<Formation>(formations[0] as Formation)
  const [picked, setPicked] = useState<Record<string, RosterEntry>>({})
  const [openSlot, setOpenSlot] = useState<PitchSlot | null>(null)
  const [query, setQuery] = useState('')

  const chosen = Object.keys(picked).length
  const takenSlugs = useMemo(
    () => new Set(Object.values(picked).map((entry) => entry.slug)),
    [picked],
  )

  const results = useMemo(() => {
    const term = query.trim()
    if (!term) return roster.all.slice(0, 60)
    return roster.all.filter((entry) => entry.nameHe.includes(term)).slice(0, 80)
  }, [query, roster.all])

  function choose(entry: RosterEntry) {
    if (!openSlot) return
    setPicked((current) => ({ ...current, [openSlot.slotId]: entry }))
    setOpenSlot(null)
    setQuery('')
  }

  function clear(slotId: string) {
    setPicked((current) => {
      const next = { ...current }
      delete next[slotId]
      return next
    })
  }

  const namesForCard = formation.slots
    .map((slot) => picked[slot.slotId]?.nameHe)
    .filter((name): name is string => name !== undefined)

  return (
    <div className="mt-stack">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {formations.map((option) => (
            <button
              key={option.name}
              type="button"
              onClick={() => setFormation(option)}
              aria-pressed={formation.name === option.name}
              className={`min-h-tap border-hair px-3 font-mono text-step--1 tabular-nums transition-transform duration-press ease-stamp active:scale-[.95] motion-reduce:transition-none ${
                formation.name === option.name
                  ? 'border-red bg-red text-paper'
                  : 'border-ink/40 text-ink'
              }`}
            >
              <bdi dir="ltr">{option.name}</bdi>
            </button>
          ))}
        </div>
        {/* One isolate around the whole ratio, not two around each half: two adjacent
            <bdi> runs reorder against each other in RTL and "3/11" came out "11/3". */}
        <p className="font-body text-[11px] tracking-widest text-muted">
          <Num>{`${chosen}/11`}</Num>
        </p>
      </div>

      {/* the pitch */}
      <div className="relative mt-3 aspect-[3/4] w-full overflow-hidden border-rule border-ink"
        style={{ background: 'rgb(var(--p-grass))' }}>
        <div aria-hidden="true" className="absolute inset-0">
          {[0, 1, 2, 3, 4, 5].map((band) => (
            <div
              key={band}
              className="absolute inset-x-0"
              style={{
                top: `${band * 16.6}%`,
                height: '8.3%',
                background: 'rgb(var(--p-grass-dark))',
              }}
            />
          ))}
        </div>
        {/* chalk */}
        <svg
          viewBox="0 0 100 133"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <g fill="none" stroke="rgb(var(--p-halo) / .8)" strokeWidth="0.6">
            <rect x="3" y="3" width="94" height="127" />
            <path d="M3 66.5 H97" />
            <circle cx="50" cy="66.5" r="12" />
            <rect x="27" y="3" width="46" height="18" />
            <rect x="27" y="112" width="46" height="18" />
          </g>
        </svg>

        {formation.slots.map((slot) => {
          const entry = picked[slot.slotId]
          return (
            <button
              key={slot.slotId}
              type="button"
              onClick={() => (entry ? clear(slot.slotId) : setOpenSlot(slot))}
              style={{ insetInlineStart: `${slot.x}%`, top: `${slot.y}%` }}
              className="absolute min-h-tap -translate-x-1/2 -translate-y-1/2 transition-transform duration-press ease-stamp active:scale-[.94] motion-reduce:transition-none rtl:translate-x-1/2"
            >
              {entry ? (
                <span className="block max-w-[104px] animate-slam border-hair border-ink bg-sheet px-2 py-1 font-body text-[11px] font-extrabold leading-tight text-ink">
                  {entry.nameHe}
                </span>
              ) : (
                <span className="block border-hair border-dashed border-sheet/80 bg-ink/25 px-2 py-1 font-body text-[10px] leading-tight text-sheet">
                  {slot.roleHe}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-2 font-body text-[11px] text-muted">
        {t('xi.help', { total: String(roster.total) })}
      </p>

      <ShareRow
        kind="lineup"
        params={{ s: '1' }}
        headline={`${chosen}/11`}
        card={{
          template: 'grass',
          kicker: 'GATE 1 · ALL-TIME XI',
          label: t('screen.xi.title'),
          eyebrow: formation.name,
          hero: t('screen.xi.title'),
          stats: namesForCard.slice(0, 3).map((name, index) => ({
            k: formation.slots[index]?.roleHe ?? '',
            v: name,
          })),
          cta: t('xi.cta'),
          challenge: t('share.sameRound'),
        }}
      />

      {/* the roster sheet */}
      {openSlot && (
        <div className="fixed inset-0 z-40 flex flex-col bg-ink/70" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t('xi.close')}
            className="flex-1"
            onClick={() => setOpenSlot(null)}
          />
          <div className="max-h-[76vh] animate-slam overflow-y-auto border-t-rule border-ink bg-sheet">
            <div className="sticky top-0 z-10 border-b-hair border-ink bg-sheet px-4 pb-2 pt-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-step-1 text-ink">{openSlot.roleHe}</p>
                <button
                  type="button"
                  onClick={() => setOpenSlot(null)}
                  className="min-h-tap px-2 font-body text-[12px] font-extrabold text-red"
                >
                  {t('xi.close')}
                </button>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('xi.search')}
                aria-label={t('xi.search')}
                className="mt-2 w-full border-hair border-ink bg-paper px-3 py-2 font-body text-step-0 text-ink outline-none placeholder:text-muted"
              />
            </div>

            <ol className="px-2 pb-6">
              {results.map((entry) => (
                <li key={entry.slug}>
                  <button
                    type="button"
                    onClick={() => choose(entry)}
                    disabled={takenSlugs.has(entry.slug)}
                    className="flex min-h-tap w-full items-center border-b-hair border-ink/20 px-2 text-start font-body text-step-0 text-ink disabled:opacity-35"
                  >
                    {entry.nameHe}
                  </button>
                </li>
              ))}
              {results.length === 0 && (
                <li className="px-2 py-6 text-center font-body text-step--1 text-muted">
                  {t('xi.none')}
                </li>
              )}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
