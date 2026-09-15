'use client'

import { useEffect, useMemo, useState } from 'react'

import { BallotSlip } from '@/components/ballot/BallotSlip'
import { RosterSheet } from '@/components/roster/RosterSheet'
import { Num } from '@/components/ui/Num'
import type { RosterIndex } from '@/lib/game/allTimeXI'
import {
  BALLOT,
  NUMBERS,
  POSITIONS,
  ballotComplete,
  ballotFilled,
  type Ballot,
  type PollQuestion,
} from '@/lib/polls/ballot'
import { activeStore } from '@/lib/polls/store'
import { useDialog } from '@/components/ui/useDialog'
import { t } from '@/lib/i18n'

/**
 * פתק ההצבעה — the polls wing, as a committee sheet.
 *
 * A poll screen usually opens on a bar chart, and this one cannot: there is one voter
 * behind it today and drawing bars off a sample of one — or seeding a baseline so they
 * look busy — would be inventing the only thing a poll is made of. So the screen is
 * built around the artefact instead of the statistic: one printed document with your
 * eight answers and a stamp cell each, sealed by a single action at 8/8. `BallotSlip`
 * is the document; this component is everything around it — the store, the three
 * pickers, and the state machine `0/8 → partial → 8/8 → sealed`.
 *
 * Sealing is deliberately a SEPARATE fact from the picks. `store.seal()` only ever
 * fires from the button `BallotSlip` renders once `complete` is true, and once sealed
 * every row turns from a button into plain text — there is nothing left to tap, because
 * a sealed document is read, not edited. "פתק חדש" is the only way back, and it clears
 * both the picks and the seal in one call.
 */
export function BallotSheet({ roster }: { roster: RosterIndex }) {
  const store = useMemo(() => activeStore(), [])
  const [ballot, setBallot] = useState<Ballot>({})
  const [sealed, setSealed] = useState(false)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState<PollQuestion | null>(null)

  // The saved slip is read AFTER mount, never during render: the server has no browser
  // storage, and reading it in a render is how a hydration mismatch is born. Which side
  // of the seam the picks and the seal come from is the store's business, not this
  // screen's.
  useEffect(() => {
    let live = true
    void Promise.all([store.read(), store.sealed()]).then(([saved, isSealed]) => {
      if (!live) return
      setBallot(saved)
      setSealed(isSealed)
      setReady(true)
    })
    return () => {
      live = false
    }
  }, [store])

  function cast(question: PollQuestion, pick: string) {
    setBallot((current) => ({ ...current, [question.id]: pick }))
    void store.save(question.id, pick)
    setOpen(null)
  }

  function seal() {
    if (!ballotComplete(ballot)) return
    setSealed(true)
    void store.seal()
  }

  function fresh() {
    setBallot({})
    setSealed(false)
    void store.clear()
  }

  const filled = ballotFilled(ballot)
  const complete = ballotComplete(ballot)

  return (
    <div className="mt-stack">
      {ready && (
        <BallotSlip
          ballot={ballot}
          filled={filled}
          complete={complete}
          sealed={sealed}
          onRowTap={(question) => setOpen(question)}
          onSeal={seal}
          onNewSlip={fresh}
        />
      )}

      {open?.kind === 'roster' && (
        <RosterSheet
          title={t(open.ask)}
          roster={roster}
          onPick={(entry) => cast(open, entry.nameHe)}
          onClose={() => setOpen(null)}
        />
      )}

      {open?.kind === 'number' && (
        <PickSheet title={t('poll.pickNumber')} onClose={() => setOpen(null)}>
          <ol className="grid grid-cols-6 gap-1.5 px-3 sm:grid-cols-10">
            {NUMBERS.map((number) => (
              <li key={number}>
                <button
                  type="button"
                  onClick={() => cast(open, String(number))}
                  className="flex min-h-tap w-full items-center justify-center border-hair border-ink/40 bg-paper font-poster text-[24px] leading-none text-ink transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
                >
                  <Num>{String(number)}</Num>
                </button>
              </li>
            ))}
          </ol>
        </PickSheet>
      )}

      {open?.kind === 'position' && (
        <PickSheet title={t('poll.pickPosition')} onClose={() => setOpen(null)}>
          <ol className="px-3">
            {POSITIONS.map((position) => (
              <li key={position.id}>
                <button
                  type="button"
                  onClick={() => cast(open, t(position.he))}
                  className="flex min-h-tap w-full items-baseline gap-3 border-b-hair border-ink/20 text-start"
                >
                  <span dir="ltr" className="font-mono text-[12px] tracking-widest text-red">
                    {position.id}
                  </span>
                  <span className="font-sign text-step-0 text-ink">{t(position.he)}</span>
                </button>
              </li>
            ))}
          </ol>
        </PickSheet>
      )}
    </div>
  )
}

/**
 * The sheet the number and position pickers share.
 *
 * Same furniture as the roster sheet — scrim, slam, the tab bar's height reserved at the
 * foot — without the search, which two dozen options do not need and which would put a
 * keyboard over the grid on a phone.
 */
function PickSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const dialogRef = useDialog<HTMLDivElement>(onClose)
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex flex-col bg-ink/70 outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button type="button" aria-label={t('xi.close')} className="flex-1" onClick={onClose} />
      <div className="max-h-[76vh] animate-slam overflow-y-auto border-t-rule border-ink bg-sheet">
        <div className="sticky top-0 z-10 flex items-baseline justify-between gap-3 border-b-hair border-ink bg-sheet px-4 pb-2 pt-3">
          <p className="font-sign text-step-1 text-ink">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-tap px-2 font-body text-[12px] font-extrabold text-red"
          >
            {t('xi.close')}
          </button>
        </div>
        <div className="py-3 pb-[calc(var(--tap)+2rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  )
}
