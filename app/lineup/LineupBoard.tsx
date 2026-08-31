'use client'

import { useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { t } from '@/lib/i18n'

/**
 * Screen 5 — eleven slots in 1·4·4·2, start at the bottom of the pitch reading up.
 * Each slot is at least one tap tall, 2px framed, number in mono.
 *
 * Grading is deliberately NOT done here: it belongs on the server, against a verified
 * `match_lineup`. Until a verified XI exists in the archive, submitting says so.
 */

const ROWS: Array<{ label: string; count: number; from: number }> = [
  { label: 'GK', count: 1, from: 1 },
  { label: 'DF', count: 4, from: 2 },
  { label: 'MF', count: 4, from: 6 },
  { label: 'FW', count: 2, from: 10 },
]

export function LineupBoard({ players, verifiable }: { players: string[]; verifiable: boolean }) {
  const [slots, setSlots] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const filled = Object.keys(slots).length

  function assign(slot: number, name: string) {
    setSlots((current) => {
      const next = { ...current }
      if (name === '') delete next[slot]
      else next[slot] = name
      return next
    })
  }

  return (
    <>
      <div className="mt-stack flex flex-col gap-3">
        {ROWS.map((row) => (
          <div
            key={row.label}
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${row.count}, minmax(0,1fr))` }}
          >
            {Array.from({ length: row.count }, (_, offset) => {
              const slot = row.from + offset
              return (
                <label
                  key={slot}
                  className={`flex min-h-tap flex-col justify-between border-rule border-ink p-2 ${
                    slots[slot] ? 'bg-sheet' : ''
                  }`}
                >
                  <span className="font-mono text-[10px] tabular-nums text-red">
                    {String(slot).padStart(2, '0')}
                  </span>
                  <span className="sr-only">{`${t('lineup.slot')} ${slot}`}</span>
                  <select
                    value={slots[slot] ?? ''}
                    onChange={(event) => assign(slot, event.target.value)}
                    className="mt-1 w-full border-none bg-transparent font-body text-[12px] text-ink outline-none"
                  >
                    <option value="">—</option>
                    {players.map((player) => (
                      <option key={player} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>
                </label>
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-stack flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="flex min-h-tap flex-1 items-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
        >
          {t('lineup.submit')}
        </button>
        <span className="font-mono text-step-1 tabular-nums text-ink">
          <bdi>
            {String(filled).padStart(2, '0')}/11
          </bdi>
        </span>
      </div>

      {submitted && !verifiable && (
        <EmptyState title={t('empty.lineup')} body={t('empty.lineup.body')} tone="red" />
      )}
    </>
  )
}
