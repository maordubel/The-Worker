'use client'

import { useEffect, useMemo, useState } from 'react'

import { BallotSlip } from '@/components/ballot/BallotSlip'
import { VoteReaction } from '@/components/ballot/VoteReaction'
import { RosterSheet } from '@/components/roster/RosterSheet'
import { Num } from '@/components/ui/Num'
import type { RosterIndex } from '@/lib/game/allTimeXI'
import type { ShirtBoard } from '@/lib/xi/board'
import type { KitSpec } from '@/lib/kit/spec'
import {
  BALLOT,
  NUMBERS,
  POSITIONS,
  ballotComplete,
  ballotFilled,
  type Ballot,
  type PollQuestion,
} from '@/lib/polls/ballot'
import { pickFact } from '@/lib/polls/pickFact'
import type { Reasons } from '@/lib/polls/reasons'
import { shirtNumber, supporterId } from '@/lib/polls/supporter'
import { activeStore } from '@/lib/polls/store'
import { useDialog } from '@/components/ui/useDialog'
import { readBook, writeBook, type MemberBook } from '@/lib/game/member'
import { recordDeed } from '@/lib/profile/store'
import { t, type MessageKey } from '@/lib/i18n'

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
 *
 * ## הקצב — what happens between a pick and the next question (19.9.2026)
 *
 * The document was silent between taps: you chose a name, the sheet closed, and nothing
 * said the vote had landed or asked you anything about it. Three things fill that now,
 * and all three are the same beat (`VoteReaction`):
 *
 *  · **the pick is confirmed** — stamped, with the row count;
 *  · **the archive says what it holds on him** — seasons, position, the shirt he is
 *    identified with, each with its source, and one honest sentence where it holds
 *    nothing (`lib/polls/pickFact.ts`). Never a terrace quote: a line about what
 *    supporters think, with no count behind it, is the fabricated number with the
 *    digits removed (rules 11 and 18);
 *  · **"למה דווקא זה"** — one optional chip, kept on this device and never counted
 *    (`lib/polls/reasons.ts`).
 *
 * Then it advances to the next EMPTY row by itself, and stops at the slip when there is
 * none. Every part of that is escapable: a tap goes now, "שיניתי את דעתי" cancels the
 * advance and reopens the picker on the same question, and any row on the slip is still
 * one tap away for as long as the slip is unsealed.
 *
 * ## הזהות — and the one place it is kept
 *
 * The name on the shirt and the number on the back are the member book's fields
 * (`lib/game/member.ts`), not new ones: this screen reads and writes the same record
 * gate 10 prints, which is why answering "איזה מספר" here changes the shirt there, and
 * why signing in carries one name rather than two (rule 59, and the brief's own
 * instruction not to duplicate a field the profile already stores).
 */
export function BallotSheet({
  roster,
  shirts,
  shirt,
}: {
  roster: RosterIndex
  /** the shirt join gate 1 already receives — used here for the men on the slip */
  shirts: ShirtBoard
  /** the club's own home kit, for the supporter's own shirt */
  shirt: KitSpec
}) {
  const store = useMemo(() => activeStore(), [])
  const [ballot, setBallot] = useState<Ballot>({})
  const [reasons, setReasons] = useState<Reasons>({})
  const [sealed, setSealed] = useState(false)
  const [ready, setReady] = useState(false)
  const [book, setBook] = useState<MemberBook | null>(null)
  const [open, setOpen] = useState<PollQuestion | null>(null)
  const [reacting, setReacting] = useState<{ question: PollQuestion; pick: string } | null>(null)

  // The saved slip is read AFTER mount, never during render: the server has no browser
  // storage, and reading it in a render is how a hydration mismatch is born. Which side
  // of the seam the picks and the seal come from is the store's business, not this
  // screen's.
  useEffect(() => {
    let live = true
    void Promise.all([store.read(), store.sealed(), store.reasons()]).then(
      ([saved, isSealed, savedReasons]) => {
        if (!live) return
        setBallot(saved)
        setSealed(isSealed)
        setReasons(savedReasons)
        setBook(readBook())
        setReady(true)
      },
    )
    return () => {
      live = false
    }
  }, [store])

  function cast(question: PollQuestion, pick: string) {
    const next: Ballot = { ...ballot, [question.id]: pick }
    setBallot(next)
    void store.save(question.id, pick)

    // The shirt number is the member book's own field, so answering it here answers it
    // there. Everything else on the slip is an opinion and belongs to the slip.
    if (question.kind === 'number') {
      const value = shirtNumber(next)
      if (value !== null && book !== null && book.number !== value) {
        const updated = { ...book, number: value }
        setBook(updated)
        writeBook(updated)
      }
    }

    setOpen(null)
    setReacting({ question, pick })
  }

  function markReason(questionId: string, reason: MessageKey) {
    setReasons((current) => {
      const draft = { ...current }
      if (draft[questionId] === reason) delete draft[questionId]
      else draft[questionId] = reason
      return draft
    })
    void store.saveReason(questionId, reason)
  }

  function saveName(value: string) {
    if (book === null) return
    const updated = { ...book, nameHe: value.slice(0, 18) }
    setBook(updated)
    writeBook(updated)
  }

  /**
   * The next row with nothing in it, starting after the one just answered and wrapping.
   *
   * Wrapping is what makes the rhythm survive editing: a supporter who comes back to fix
   * row two should be carried on to whatever is still empty, which may well be row
   * seven. `null` means the slip is full and the beat returns to the document.
   */
  function nextEmpty(after: PollQuestion, filled: Ballot): PollQuestion | null {
    const from = BALLOT.findIndex((question) => question.id === after.id)
    for (let step = 1; step <= BALLOT.length; step += 1) {
      const candidate = BALLOT[(from + step) % BALLOT.length]
      if (candidate && (filled[candidate.id] ?? '') === '') return candidate
    }
    return null
  }

  function advance() {
    if (reacting === null) return
    const next = nextEmpty(reacting.question, ballot)
    setReacting(null)
    setOpen(next)
  }

  function seal() {
    if (!ballotComplete(ballot)) return
    setSealed(true)
    void store.seal()
    // Sealing is the wing's finished round: eight picks, one artefact, and the moment
    // gate 7 can honestly say this device did something here (17.9.2026).
    recordDeed('/polls')
  }

  function fresh() {
    setBallot({})
    setReasons({})
    setSealed(false)
    void store.clear()
  }

  const filled = ballotFilled(ballot)
  const complete = ballotComplete(ballot)
  const supporter = useMemo(
    () => supporterId(ballot, reasons, book ?? {}),
    [ballot, reasons, book],
  )
  const favourite = useMemo(
    () => pickFact(supporter.favourite, roster.all, shirts),
    [supporter.favourite, roster.all, shirts],
  )
  const reactingFact = useMemo(
    () =>
      reacting === null || reacting.question.kind !== 'roster'
        ? null
        : pickFact(reacting.pick, roster.all, shirts),
    [reacting, roster.all, shirts],
  )

  return (
    <div className="mt-stack">
      {ready && (
        <BallotSlip
          ballot={ballot}
          filled={filled}
          complete={complete}
          sealed={sealed}
          nameHe={book?.nameHe ?? ''}
          supporter={supporter}
          shirt={shirt}
          favourite={favourite}
          onRowTap={(question) => setOpen(question)}
          onName={saveName}
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

      {reacting !== null && (
        <VoteReaction
          question={reacting.question}
          pick={reacting.pick}
          fact={reactingFact}
          chosen={reasons[reacting.question.id]}
          filled={filled}
          last={nextEmpty(reacting.question, ballot) === null}
          onReason={(reason) => markReason(reacting.question.id, reason)}
          onRethink={() => {
            const question = reacting.question
            setReacting(null)
            setOpen(question)
          }}
          onClose={() => setReacting(null)}
          onDone={advance}
        />
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
