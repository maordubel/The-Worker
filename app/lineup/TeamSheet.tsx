'use client'

import { useState, type ReactNode } from 'react'

import { GK_KIT, NamePlate, OUTFIELD_KIT, PlayerFigure } from '@/components/press/PlayerFigure'
import { Num } from '@/components/ui/Num'
import { Pitch } from '@/components/ui/Pitch'
import { t, type MessageKey } from '@/lib/i18n'
import type { PitchSlot } from '@/lib/game/lineup'
import {
  REVEAL_SET,
  REVEAL_SKIPPED,
  buildReveal,
  missingStarters,
  opensAtSummary,
  tallyUpTo,
  type LineupVerdict,
  type RevealRow,
  type RevealStatus,
  type SlotStatus,
} from '@/lib/game/lineup-sheet'
import { collect, collected, readProfile } from '@/lib/profile/store'

/**
 * הבדיקה ודף ההרכב — the per-position reveal, and the sheet it ends on.
 *
 * ## The reveal, and the one thing it may not do
 *
 * The prototype walks the eleven on an 820ms timer and the master brief puts that on its
 * list of what not to build by name: *"waiting 850ms × 11 players just to see Gate 3
 * results"*. Nine seconds of animation is not drama, it is a queue.
 *
 * So there is **no timer in this file at all**. The walk moves when the player moves it,
 * and "להציג הכול" is on screen at every single step — before the first card, between
 * any two, and on the last one. That is the whole of the skip: it cannot be missed on
 * the first run and it cannot go away on the tenth, because it is not a state, it is a
 * button that is always rendered.
 *
 * And then the half a button cannot give. **A device that has skipped once opens on the
 * sheet from then on**, with the walk offered as "לעבור שוב עמדה עמדה" rather than
 * imposed. It is one id in `lib/profile/store.ts`'s collections — the same record gate 5
 * keeps its shirts in — never a private `localStorage` key of this screen's own
 * (rule 59, and the reason `lib/profile/store.ts` exists at all).
 *
 * ## The sheet
 *
 * Four separate numbers, because the brief asks for four and they measure four different
 * things: the men you got right, the men you had but put in the wrong line, the men the
 * source records as substitutes that night, and the LOCKs that held. A single score
 * folds all of that into one figure and throws away the only part of it a player can
 * learn anything from.
 *
 * `benchKnown` is why the trap count can be absent rather than zero: two of the six
 * playable records name no bench, and printing "0" for them would be stating something
 * the archive never said.
 */

const STATUS_MARK: Record<SlotStatus, string> = {
  exact: '✓',
  wrong_slot: '↔',
  not_in_xi: '✗',
  empty: '',
}

const STATUS_LABEL: Record<SlotStatus, MessageKey | null> = {
  exact: 'lineup.exact',
  wrong_slot: 'lineup.wrongSlot',
  not_in_xi: 'lineup.notInXi',
  empty: null,
}

/**
 * The three states never rely on colour: each carries a mark and a word as well, because
 * a red/green pair is unreadable for a large share of players — and yellow, the usual
 * third state, is forbidden outright in this system (rule 8).
 */
const STATUS_STYLE: Record<SlotStatus, string> = {
  exact: 'border-red bg-red text-sheet',
  wrong_slot: 'border-red bg-sheet text-red',
  not_in_xi: 'border-ink bg-sheet text-ink line-through',
  empty: 'border-ink bg-sheet text-ink',
}

/**
 * The same three states, drawn ON THE GRASS.
 *
 * The keyline is INK rather than red for one reason and it is measurable: a red edge
 * antialiased against printed green averages to olive at hue 57°, which is inside
 * `lib/isYellow.ts`'s band. Red may not touch grass in this system; ink goes between
 * them. Off the pitch — the list below, the legend — red on cream is fine and the
 * shared `STATUS_STYLE` is used unchanged.
 */
const PITCH_MARK: Record<RevealStatus, string> = {
  exact: 'border-press-ink bg-press-red text-press-line',
  wrong_slot: 'border-press-ink bg-press-paper text-press-red',
  not_in_xi: 'border-press-ink bg-press-paper text-press-ink line-through',
}

const VERDICT_WORD: Record<RevealStatus, MessageKey> = {
  exact: 'lineup.reveal.ok',
  wrong_slot: 'lineup.reveal.mid',
  not_in_xi: 'lineup.reveal.no',
}

function verdictNote(row: RevealRow): MessageKey {
  if (row.status === 'exact') return 'lineup.reveal.ok.note'
  if (row.status === 'wrong_slot') return 'lineup.reveal.mid.note'
  return row.bench ? 'lineup.reveal.bench.note' : 'lineup.reveal.no.note'
}

export function TeamSheet({
  verdict,
  slots,
  locks,
  notesTaken,
  formationName,
  onBack,
  children,
}: {
  verdict: LineupVerdict
  slots: readonly PitchSlot[]
  locks: readonly string[]
  notesTaken: number
  formationName: string
  /** back into the locker room with the same eleven still standing */
  onBack: () => void
  /** the share row and the replay link, which belong to the board that owns the round */
  children?: ReactNode
}) {
  const rows = buildReveal(verdict, slots, locks)
  const missing = missingStarters(verdict)

  /*
   * The starting mode is read once, on the first client render, from the profile. This
   * component only ever mounts after a submission — there is no server render of it to
   * disagree with — and `readProfile()` answers an empty profile off a browser anyway,
   * so the lazy initialiser is safe in both directions.
   */
  const [stage, setStage] = useState<'reveal' | 'sheet'>(() =>
    opensAtSummary(collected(readProfile(), REVEAL_SET)) ? 'sheet' : 'reveal',
  )
  const [index, setIndex] = useState(-1)

  function showAll() {
    // Remembered for next time, and only ever on the deliberate press: a player who
    // walked the whole eleven has not asked to be sent past it in future.
    collect(REVEAL_SET, [REVEAL_SKIPPED])
    setIndex(rows.length - 1)
    setStage('sheet')
  }

  function next() {
    if (index >= rows.length - 1) {
      setStage('sheet')
      return
    }
    setIndex(index + 1)
  }

  const running = tallyUpTo(rows, stage === 'sheet' ? rows.length - 1 : index)
  const current = index >= 0 ? rows[index] : undefined

  return (
    <>
      {stage === 'reveal' && (
        <section className="mt-stack">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-step-2 leading-tight text-ink">
              {t('lineup.reveal.title')}
            </h2>
            <p className="font-mono text-step-1 tabular-nums text-red">
              <Num>
                {String(index + 1).padStart(2, '0')}/{rows.length}
              </Num>
            </p>
          </div>

          <div className="mt-3">
            <Pitch
              slots={slots}
              renderSlot={(slot) => {
                const at = rows.findIndex((row) => row.slotId === slot.slotId)
                const row = at >= 0 ? (rows[at] as RevealRow) : undefined
                const shown = row !== undefined && at <= index
                return (
                  <div
                    className={`flex w-full flex-col items-center justify-end ${
                      row && at === index ? 'outline outline-[3px] outline-press-ink' : ''
                    }`}
                  >
                    <PlayerFigure
                      kit={row ? (slot.slotId === 'GK' ? GK_KIT : OUTFIELD_KIT) : undefined}
                      ghost={!row}
                      number={null}
                      size={54}
                      title={slot.roleHe}
                    />
                    {shown && row && (
                      <span
                        aria-hidden="true"
                        className={`-mt-1 grid h-5 w-5 place-items-center border-rule font-sign text-[10px] leading-none ${
                          PITCH_MARK[row.status]
                        }`}
                      >
                        {STATUS_MARK[row.status]}
                      </span>
                    )}
                    <NamePlate
                      name={row?.name ?? slot.roleHe}
                      tone={row && at === index ? 'red' : 'ink'}
                    />
                  </div>
                )
              }}
            />
          </div>

          <div className="mt-3 border-rule border-ink bg-sheet p-3">
            {current === undefined ? (
              <p className="font-body text-step-0 leading-relaxed text-ink">
                {t('lineup.reveal.lede')}
              </p>
            ) : (
              <>
                <p className="font-body text-[11px] font-extrabold tracking-widest text-muted">
                  {t('lineup.reveal.step', {
                    n: String(index + 1),
                    of: String(rows.length),
                  })}{' '}
                  · {current.roleHe}
                </p>
                <p className="mt-1 font-display text-step-3 leading-tight text-ink">
                  {current.name}
                  {current.locked && (
                    <span className="ms-2 border-hair border-ink px-1 font-mono text-[10px] tabular-nums text-ink">
                      LOCK
                    </span>
                  )}
                </p>
                <p
                  className={`mt-1 font-display text-step-2 leading-tight ${
                    current.status === 'exact' ? 'text-red' : 'text-ink'
                  }`}
                >
                  {t(VERDICT_WORD[current.status])}
                </p>
                <p className="mt-1 font-body text-step--1 leading-relaxed text-muted">
                  {t(verdictNote(current))}
                </p>
              </>
            )}

            <ul className="mt-3 flex flex-wrap gap-2">
              <Tally label={t('lineup.exact')} value={running.exact} />
              <Tally label={t('lineup.wrongSlot')} value={running.wrongSlot} />
              {verdict.benchKnown && (
                <Tally label={t('lineup.benchTrap')} value={running.bench} />
              )}
            </ul>
          </div>

          {/*
            Both controls, at every step, always enabled. The skip is not a mode and not
            a preference — it is a button that never leaves the screen, which is the only
            version of "you can get past it" that survives the eleventh run.
          */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={next}
              className="flex min-h-tap items-center justify-center bg-red px-4 font-body text-step-0 font-extrabold text-paper transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
            >
              {index < 0 ? t('lineup.reveal.begin') : t('lineup.reveal.next')}
            </button>
            <button
              type="button"
              onClick={showAll}
              className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
            >
              {t('lineup.reveal.all')}
            </button>
          </div>
        </section>
      )}

      {stage === 'sheet' && (
        <section className="mt-stack">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-step-2 leading-tight text-ink">
              {t('lineup.report.title')}
            </h2>
            <p className="font-mono text-step-1 tabular-nums text-muted">
              <Num>{formationName}</Num>
            </p>
          </div>
          <p className="mt-1 font-body text-step--1 leading-snug text-muted">
            {t('lineup.report.lede')}
          </p>

          <p className="mt-stack font-display text-step-4 leading-none text-ink">
            <Num>
              {verdict.exact}/{verdict.total}
            </Num>{' '}
            <span className="font-body text-step-0">{t('lineup.exact')}</span>
          </p>

          <ul className="mt-3 flex flex-wrap gap-2">
            <Tally label={t('lineup.wrongSlot')} value={running.wrongSlot} />
            {verdict.benchKnown && <Tally label={t('lineup.benchTrap')} value={running.bench} />}
            <Tally
              label={t('lineup.locksRight')}
              value={running.locksRight}
              of={running.locksUsed}
            />
            <Tally label={t('lineup.notesTaken')} value={notesTaken} />
          </ul>

          {!verdict.benchKnown && (
            <p className="mt-2 font-body text-step--1 leading-relaxed text-muted">
              {t('lineup.benchTrap.unknown')}
            </p>
          )}

          <ul className="mt-stack border-t-hair border-ink/20">
            {rows.map((row) => (
              <li
                key={row.slotId}
                className="flex items-center justify-between gap-3 border-b-hair border-ink/20 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate font-body text-[13px] text-ink">
                    {row.name}
                    {row.locked && (
                      <span className="ms-2 border-hair border-ink px-1 font-mono text-[9px] tabular-nums text-ink">
                        LOCK
                      </span>
                    )}
                  </span>
                  <span className="block font-body text-[11px] text-muted">
                    {row.roleHe} ·{' '}
                    {row.bench && row.status === 'not_in_xi'
                      ? t('lineup.reveal.bench.note')
                      : t(STATUS_LABEL[row.status] as MessageKey)}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`grid h-6 w-6 shrink-0 place-items-center border-hair font-sign text-[12px] leading-none ${
                    STATUS_STYLE[row.status]
                  }`}
                >
                  {STATUS_MARK[row.status]}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-stack border-rule border-ink bg-sheet p-3">
            <p className="font-body text-[11px] font-extrabold tracking-widest text-muted">
              {t('lineup.left.title')}
            </p>
            <p className="mt-1 font-body text-step--1 leading-relaxed text-ink">
              {missing.length === 0 ? t('lineup.left.none') : missing.join(' · ')}
            </p>
          </div>

          <p className="mt-3 font-mono text-[11px] tabular-nums leading-relaxed text-muted">
            {t('lineup.source')} · {verdict.sourceTitle}
          </p>

          <div className="mt-stack grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onBack}
              className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
            >
              {t('lineup.back')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIndex(-1)
                setStage('reveal')
              }}
              className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
            >
              {t('lineup.reveal.again')}
            </button>
          </div>

          {children}
        </section>
      )}
    </>
  )
}

function Tally({ label, value, of }: { label: string; value: number; of?: number }) {
  return (
    <li className="flex min-h-[38px] items-center gap-2 border-hair border-ink px-2 font-body text-[12px] text-ink">
      <span className="font-mono text-step-0 tabular-nums">
        <Num>{of === undefined ? String(value) : `${value}/${of}`}</Num>
      </span>
      {label}
    </li>
  )
}
