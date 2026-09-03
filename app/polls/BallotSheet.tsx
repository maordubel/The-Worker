'use client'

import { useEffect, useMemo, useState } from 'react'

import { RosterSheet } from '@/components/roster/RosterSheet'
import { ShareRow } from '@/components/share/ShareRow'
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
import { t } from '@/lib/i18n'

/**
 * פתק ההצבעה — the polls wing, as a ballot paper.
 *
 * A poll screen usually opens on a bar chart, and this one cannot: there is one voter
 * behind it today and drawing bars off a sample of one — or seeding a baseline so they
 * look busy — would be inventing the only thing a poll is made of. So the screen is
 * built around the artefact instead of the statistic: a printed slip with your eight
 * answers on it, which is a thing worth having on its own and is also exactly what
 * fills the box when the count goes live.
 *
 * Two decisions in the interaction:
 *
 *  · **Every row is the button.** A row with a separate "בחר" control at the end makes
 *    a 44px target out of a 300px line and asks the thumb to aim. The whole plate is
 *    the tap target, and a filled row re-opens on the pick it already has.
 *  · **Nothing is required and nothing is ordered.** You can answer the striker and
 *    leave the keeper blank, and the slip prints what you gave it. A ballot that
 *    refuses to be shared until it is full is a form, and this project has a rule about
 *    that (rule 21).
 */
export function BallotSheet({ roster }: { roster: RosterIndex }) {
  const store = useMemo(() => activeStore(), [])
  const [ballot, setBallot] = useState<Ballot>({})
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState<PollQuestion | null>(null)

  // The saved slip is read AFTER mount, never during render: the server has no browser
  // storage, and reading it in a render is how a hydration mismatch is born. Which side
  // of the seam the picks come from is the store's business, not this screen's.
  useEffect(() => {
    let live = true
    void store.read().then((saved) => {
      if (!live) return
      setBallot(saved)
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

  function fresh() {
    setBallot({})
    void store.clear()
  }

  const filled = ballotFilled(ballot)
  const complete = ballotComplete(ballot)

  return (
    <div className="mt-stack">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="min-w-0 font-body text-step--1 leading-snug text-muted">{t('poll.intro')}</p>
        {/* One isolate around the whole ratio. A Hebrew sentence with a number at each
            end ("0 מתוך 8") reorders under bidi and prints as "0 8 מתוך" — the same
            class of bug the all-time XI's counter hit. A ratio has no such trouble. */}
        <p className="shrink-0 font-mono text-[11px] tabular-nums tracking-widest text-red">
          <Num>{`${filled}/${BALLOT.length}`}</Num>
        </p>
      </div>

      {/* the progress rule — eight ticks, one per question, so the slip's length is
          visible before you start filling it in */}
      <ol aria-hidden="true" className="mt-2 flex gap-1">
        {BALLOT.map((question) => (
          <li
            key={question.id}
            className={`h-1.5 flex-1 ${
              (ballot[question.id] ?? '') !== '' ? 'bg-red' : 'bg-ink/20'
            }`}
          />
        ))}
      </ol>

      <ol className="mt-3">
        {BALLOT.map((question) => {
          const pick = ballot[question.id] ?? ''
          return (
            <li key={question.id} className="mt-2">
              <button
                type="button"
                onClick={() => setOpen(question)}
                className="flex w-full items-center gap-3 border-rule border-ink bg-sheet px-3 py-2.5 text-start transition-transform duration-press ease-stamp active:scale-[.985] motion-reduce:transition-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-body text-[10px] tracking-widest text-muted">
                    <bdi dir="ltr">{question.latin}</bdi>
                  </span>
                  <span className="mt-0.5 block font-display text-step-0 leading-tight text-ink">
                    {t(question.ask)}
                  </span>
                  {/* An unanswered row prints nothing where the answer goes. Eight
                      identical plates each carrying a grey "טרם נבחר" is a wall you
                      have to read to find the gaps in; a row that grows an answer line
                      only once it HAS one makes the filled ones visible at a glance and
                      makes the slip look like it is being written. */}
                  {pick !== '' && (
                    <span className="mt-1 block truncate font-sign text-step-1 leading-tight text-red">
                      {pick}
                    </span>
                  )}
                </span>
                <span className="shrink-0 self-stretch border-s-hair border-ink/25 ps-3 font-body text-[11px] font-extrabold text-ink">
                  {pick === '' ? t('poll.choose') : t('poll.change')}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* the honest bit. A poll wing with no count has to say why, in the same voice
          the rest of the app documents a blocked source in. */}
      <div className="mt-stack border-rule border-ink bg-ink p-4">
        <p className="font-body text-[10px] tracking-widest text-red">{t('poll.noCount')}</p>
        <p className="mt-1.5 font-body text-step--1 leading-snug text-concrete">
          {t('poll.noCountBody')}
        </p>
      </div>

      {ready && filled > 0 && (
        <>
          <p className="mt-stack font-body text-[11px] tracking-widest text-muted">
            {complete ? t('poll.done') : t('poll.slip')}
          </p>
          <p className="mt-1 font-body text-step--1 leading-snug text-muted">
            {t('poll.slipNote')}
          </p>

          <ShareRow
            kind="polls"
            params={{ n: String(filled) }}
            headline={t('poll.slip')}
            card={{
              template: 'ballot' as const,
              kicker: 'GATE 7 · THE BALLOT',
              label: t('screen.polls.title'),
              eyebrow: t('poll.slip'),
              hero: t('poll.slip'),
              stats: [],
              ballot: BALLOT.filter((question) => (ballot[question.id] ?? '') !== '').map(
                (question) => ({
                  ask: t(question.ask),
                  latin: question.latin,
                  pick: ballot[question.id] as string,
                }),
              ),
              cta: t('poll.cta'),
              challenge: t('poll.challenge'),
            }}
          />

          <button
            type="button"
            onClick={fresh}
            className="mt-3 flex min-h-tap w-full items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink"
          >
            {t('poll.clear')}
          </button>
        </>
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
                  className="flex min-h-tap w-full items-center justify-center border-hair border-ink/40 bg-paper font-poster text-[24px] leading-none text-ink"
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
                  <span className="font-mono text-[12px] tracking-widest text-red">
                    <bdi dir="ltr">{position.id}</bdi>
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
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/70" role="dialog" aria-modal="true">
      <button type="button" aria-label={t('xi.close')} className="flex-1" onClick={onClose} />
      <div className="max-h-[76vh] animate-slam overflow-y-auto border-t-rule border-ink bg-sheet">
        <div className="sticky top-0 z-10 flex items-baseline justify-between gap-3 border-b-hair border-ink bg-sheet px-4 pb-2 pt-3">
          <p className="font-display text-step-1 text-ink">{title}</p>
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
