'use client'

import { useMemo, useState } from 'react'

import { Num } from '@/components/ui/Num'
import { RosterSheet } from '@/components/roster/RosterSheet'
import { ShareRow } from '@/components/share/ShareRow'
import { artFor } from '@/lib/share/story'
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

  const chosen = Object.keys(picked).length
  const takenSlugs = useMemo(
    () => new Set(Object.values(picked).map((entry) => entry.slug)),
    [picked],
  )

  function choose(entry: RosterEntry) {
    if (!openSlot) return
    setPicked((current) => ({ ...current, [openSlot.slotId]: entry }))
    setOpenSlot(null)
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
          // The team sheet draws itself. Three names as "facts" threw eight of the
          // eleven away, which is the entire content of an all-time XI.
          template: 'xi' as const,
          kicker: 'GATE 1 · ALL-TIME XI',
          label: t('screen.xi.title'),
          eyebrow: formation.name,
          hero: t('screen.xi.title'),
          xi: formation.slots
            .map((slot) => {
              const entry = picked[slot.slotId]
              return entry
                ? { roleHe: slot.roleHe, nameHe: entry.familyHe, x: slot.x, y: slot.y }
                : null
            })
            .filter((slot): slot is NonNullable<typeof slot> => slot !== null),
          stats: [],
          cta: t('xi.cta'),
          challenge: t('share.sameRound'),
        }}
      />

      {/* the roster sheet — shared with the polls wing, see components/roster */}
      {openSlot && (
        <RosterSheet
          title={openSlot.roleHe}
          roster={roster}
          taken={takenSlugs}
          onPick={(entry) => choose(entry)}
          onClose={() => setOpenSlot(null)}
        />
      )}
    </div>
  )
}
