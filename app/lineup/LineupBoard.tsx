'use client'

import { useState, useTransition } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { Num } from '@/components/ui/Num'
import { GK_KIT, NamePlate, OUTFIELD_KIT, PlayerFigure } from '@/components/press/PlayerFigure'
import { Pitch } from '@/components/ui/Pitch'
import { t, type MessageKey } from '@/lib/i18n'
import type { PitchSlot } from '@/lib/game/lineup'
import {
  COACH_NOTES,
  MAX_LOCKS,
  lineOf,
  type CoachNote,
  type LineupVerdict,
} from '@/lib/game/lineup-sheet'
import { splitName } from '@/lib/game/roster-search'
import { askCoach, submitLineup } from './actions'
import { LockerRack } from './LockerRack'
import { TeamSheet } from './TeamSheet'
import { TunnelGate } from './TunnelGate'
import { PlayLink } from '@/components/play/PlayLink'
import { RecordRun } from '@/components/play/RecordRun'
import { ShareRow } from '@/components/share/ShareRow'

/**
 * שער 3 — חדר ההלבשה.
 *
 * The board used to be a bank of name chips under a pitch: tap a slot, tap a name, press
 * שלח לאימות. Everything the prototype adds is about turning that into an evening — the
 * room the shirts hang in, the three names you are willing to stake something on, the
 * coach who will tell you a number but not a name, and the mouth of the tunnel where the
 * sheet stops being changeable. The data underneath is unchanged: the same six verified
 * records, the same server-side grade.
 *
 * Four things worth knowing before changing anything here.
 *
 * **The prototype's XI is not in this file and must never be.** Its 14.3.2002 eleven
 * contains a man called `קשר נוסף` — "another midfielder" — and another it calls
 * `אבי תקוה` in the slot the archive gives to גאבור הלמאי. `content/manual/lineups.json`
 * holds the verified reading of that same match, and that is the one that plays
 * (rule 11, and `docs/16-gates-upgrade.md` names this exact row).
 *
 * **Placing works from either end.** Tap a slot then a locker, or a locker then a slot.
 * Rule 24 says a tap PLACES — it was written about gate 4, where a part has exactly one
 * home so the second tap carries no decision. Here the second tap carries the whole
 * decision, which is why two taps are right and why neither of them may be the only
 * order that works.
 *
 * **A LOCK costs nothing and is worth something.** Up to three names carry "I am sure he
 * started". They change no score: the sheet reports how many held, which is a statement
 * about how well you know what you know, and that is a different measurement from the
 * eleven itself.
 *
 * **Nothing here waits.** The tunnel is a decision, not a countdown, and the reveal
 * (`TeamSheet.tsx`) holds no timer at all.
 */

/** The four bands, in the order they stand on the pitch. */
const LINES = ['GK', 'D', 'M', 'F'] as const
const LINE_LABEL: Record<(typeof LINES)[number], MessageKey> = {
  GK: 'lineup.line.GK',
  D: 'lineup.line.D',
  M: 'lineup.line.M',
  F: 'lineup.line.F',
}

const COACH_LINE: Record<CoachNote['kind'], MessageKey> = {
  stillOut: 'lineup.coach.stillOut',
  benchOn: 'lineup.coach.benchOn',
  lineRight: 'lineup.coach.lineRight',
}

function coachSentence(note: CoachNote): string {
  // The one sentence that changes shape rather than number: "0 bench traps" reads as an
  // accusation with a zero in it, and the room would rather say nothing happened.
  if (note.kind === 'benchOn' && note.n === 0) return t('lineup.coach.benchOn.none')
  return t(COACH_LINE[note.kind], { n: String(note.n), of: String(note.of) })
}

export function LineupBoard({
  slots,
  bank,
  seed,
  cursor = 0,
  graded,
  formationName,
}: {
  slots: PitchSlot[]
  bank: string[]
  seed: number
  cursor?: number
  /** false when no verified XI exists — the board is then a free build */
  graded: boolean
  formationName: string
}) {
  const [picks, setPicks] = useState<Record<string, string | null>>({})
  const [active, setActive] = useState<string | null>(null)
  const [held, setHeld] = useState<string | null>(null)
  const [locks, setLocks] = useState<string[]>([])
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [lockNote, setLockNote] = useState<MessageKey | null>(null)
  const [tunnel, setTunnel] = useState(false)
  const [lastCall, setLastCall] = useState(false)
  const [verdict, setVerdict] = useState<LineupVerdict | null>(null)
  const [pending, startTransition] = useTransition()

  const filled = Object.values(picks).filter(Boolean).length
  const used = new Set(Object.values(picks).filter(Boolean) as string[])
  const complete = filled === slots.length
  const activeName = active === null ? null : (picks[active] ?? null)

  /**
   * Put a name in a slot.
   *
   * A name can stand in exactly one place, so placing him somewhere else vacates the old
   * slot; and whoever he displaces walks back to the locker room, which means his LOCK
   * goes with him. A LOCK on a man who is no longer on the pitch would still be counted
   * at the end — a stake on somebody you did not pick.
   */
  function place(slotId: string, name: string) {
    setPicks((current) => {
      const next: Record<string, string | null> = { ...current }
      const displaced = next[slotId] ?? null
      for (const [slot, value] of Object.entries(next)) if (value === name) next[slot] = null
      next[slotId] = name
      if (displaced !== null && displaced !== name) {
        setLocks((held) => held.filter((locked) => locked !== displaced))
      }
      return next
    })
    setActive(slotId)
    setHeld(null)
    setLockNote(null)
  }

  function tapSlot(slotId: string) {
    if (verdict) return
    if (held !== null) {
      place(slotId, held)
      return
    }
    setActive(active === slotId ? null : slotId)
    setLockNote(null)
  }

  function tapLocker(name: string) {
    if (verdict) return
    if (active !== null) {
      place(active, name)
      return
    }
    setHeld(held === name ? null : name)
    setLockNote(null)
  }

  function toggleLock() {
    if (activeName === null) return
    if (locks.includes(activeName)) {
      setLocks(locks.filter((name) => name !== activeName))
      setLockNote(null)
      return
    }
    if (locks.length >= MAX_LOCKS) {
      setLockNote('lineup.lock.full')
      return
    }
    setLocks([...locks, activeName])
    setLockNote(null)
  }

  function coach() {
    if (notes.length >= COACH_NOTES) return
    const index = notes.length
    startTransition(async () => {
      const note = await askCoach(seed, picks, cursor, index)
      if (note) setNotes((current) => [...current, note])
    })
  }

  function send() {
    setTunnel(false)
    startTransition(async () => setVerdict(await submitLineup(seed, picks, cursor)))
  }

  const prompt: MessageKey = held
    ? 'lineup.prompt.locker'
    : active !== null
      ? 'lineup.pickFor'
      : complete
        ? 'lineup.prompt.full'
        : 'lineup.tapSlot'

  return (
    <>
      {!graded && !verdict && (
        <EmptyState title={t('empty.lineup')} body={t('empty.lineup.body')} />
      )}

      {!verdict && (
        <>
          <p className="mt-stack font-body text-[11px] font-extrabold tracking-widest text-muted">
            {t('lineup.room.eyebrow')}
          </p>
          <p className="mt-1 font-body text-step--1 leading-snug text-muted">
            {t('lineup.room.lede')}
          </p>
        </>
      )}

      {/* the line counters — what the room can honestly tell you about your own board:
          how many men are standing in each band, never who they are */}
      {!verdict && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {LINES.map((line) => (
            <li
              key={line}
              className="flex min-h-[34px] items-center gap-2 border-hair border-ink px-2 font-body text-[12px] text-ink"
            >
              <span className="font-mono text-step-0 tabular-nums">
                <Num>
                  {String(
                    slots.filter(
                      (slot) => lineOf(slot.slotId) === line && (picks[slot.slotId] ?? null) !== null,
                    ).length,
                  )}
                  /
                  {String(slots.filter((slot) => lineOf(slot.slotId) === line).length)}
                </Num>
              </span>
              {t(LINE_LABEL[line])}
            </li>
          ))}
        </ul>
      )}

      {!verdict && (
        <div className="mt-stack flex items-baseline justify-between">
          <p className="font-mono text-step--1 tabular-nums text-muted">
            <Num>{formationName}</Num>
          </p>
          <p className="font-mono text-step-1 tabular-nums text-ink">
            <Num>
              {String(filled).padStart(2, '0')}/{slots.length}
            </Num>
          </p>
        </div>
      )}

      {!verdict && (
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_20rem]">
          <div>
            <Pitch
              slots={slots}
              renderSlot={(slot) => {
                const name = picks[slot.slotId] ?? null
                const isActive = active === slot.slotId
                return (
                  <button
                    type="button"
                    onClick={() => tapSlot(slot.slotId)}
                    /* the acceptance probe addresses a slot by name; a harness that has
                       to guess which button it found is a harness that agrees with
                       itself (rule 73) */
                    data-slot={slot.slotId}
                    aria-pressed={isActive}
                    aria-label={`${slot.roleHe}${name ? ` — ${name}` : ''}`}
                    /*
                      The selected chip is ringed in INK, not in red, and its name plate
                      turns red instead. A red ring here is a red edge against printed
                      grass, and that edge averages to olive inside the yellow band —
                      seventy-four pixels of it on one phone screen, on a board the
                      sweep can only ever photograph empty. See `NamePlate`'s `tone`.
                    */
                    className={`flex min-h-tap w-full flex-col items-center justify-end transition-transform duration-press ease-stamp active:scale-[.94] motion-reduce:transition-none ${
                      isActive ? 'outline outline-[3px] outline-press-ink' : ''
                    }`}
                  >
                    {/* A filled slot is a drawn player in the club's kit; an empty one is a
                        dashed ghost. The pitch reads as a team sheet at a glance instead of
                        as a grid of labelled boxes. */}
                    <PlayerFigure
                      kit={name ? (slot.slotId === 'GK' ? GK_KIT : OUTFIELD_KIT) : undefined}
                      ghost={!name}
                      number={null}
                      size={54}
                      title={slot.roleHe}
                    />
                    {name !== null && locks.includes(name) && (
                      <span
                        aria-hidden="true"
                        className="-mt-1 border-rule border-press-ink bg-press-red px-1 font-mono text-[9px] tabular-nums leading-tight text-press-line"
                      >
                        LOCK
                      </span>
                    )}
                    <NamePlate name={name ?? slot.roleHe} tone={isActive ? 'red' : 'ink'} />
                  </button>
                )
              }}
            />

            <p className="mt-2 font-body text-step--1 leading-snug text-muted">{t(prompt)}</p>
            {lastCall && (
              <p className="mt-1 border-s-rule border-red ps-2 font-body text-step--1 leading-snug text-red">
                {t('lineup.lastCall')}
              </p>
            )}

            {/* the coach's table: the LOCK, and the notes */}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={toggleLock}
                disabled={activeName === null}
                aria-pressed={activeName !== null && locks.includes(activeName)}
                className={`flex min-h-tap items-center justify-center border-rule px-3 font-body text-[13px] font-extrabold transition-transform duration-press ease-stamp active:scale-[.96] disabled:opacity-40 motion-reduce:transition-none ${
                  activeName !== null && locks.includes(activeName)
                    ? 'border-red bg-red text-sheet'
                    : 'border-ink bg-sheet text-ink'
                }`}
              >
                {activeName !== null && locks.includes(activeName)
                  ? t('lineup.lock.drop')
                  : t('lineup.lock')}
              </button>
              <button
                type="button"
                onClick={coach}
                disabled={notes.length >= COACH_NOTES || pending}
                className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-3 font-body text-[13px] font-extrabold text-ink transition-transform duration-press ease-stamp active:scale-[.96] disabled:opacity-40 motion-reduce:transition-none"
              >
                {t('lineup.coach')}
              </button>
            </div>

            <ul className="mt-2 flex flex-wrap gap-2">
              <li className="flex min-h-[34px] items-center gap-2 border-hair border-ink px-2 font-body text-[12px] text-ink">
                <span className="font-mono text-step-0 tabular-nums">
                  <Num>{`${locks.length}/${MAX_LOCKS}`}</Num>
                </span>
                {t('lineup.lock.left')}
              </li>
              <li className="flex min-h-[34px] items-center gap-2 border-hair border-ink px-2 font-body text-[12px] text-ink">
                <span className="font-mono text-step-0 tabular-nums">
                  <Num>{`${COACH_NOTES - notes.length}/${COACH_NOTES}`}</Num>
                </span>
                {t('lineup.coach.left')}
              </li>
            </ul>

            {lockNote !== null && (
              <p className="mt-2 font-body text-step--1 leading-snug text-red">{t(lockNote)}</p>
            )}
            {activeName === null && locks.length === 0 && (
              <p className="mt-2 font-body text-step--1 leading-snug text-muted">
                {t('lineup.lock.hint')}
              </p>
            )}

            {notes.length > 0 && (
              <ul className="mt-2 border-s-rule border-ink ps-2">
                {notes.map((note, index) => (
                  <li
                    key={`${note.kind}-${index}`}
                    className="font-body text-step--1 leading-relaxed text-ink"
                  >
                    {coachSentence(note)}
                  </li>
                ))}
              </ul>
            )}
            {notes.length >= COACH_NOTES && (
              <p className="mt-1 font-body text-step--1 leading-snug text-muted">
                {t('lineup.coach.spent')}
              </p>
            )}

            {/*
              The way out sits directly under the board, in the same column, on both
              viewports. It used to be the last thing on the page — below sixteen
              lockers, which on a 390px phone is another screen and a half of scrolling
              between the eleven you just finished and the button that sends them out.
              The brief asks for exactly this: no important control below an excessive
              scroll.
            */}
            <button
              type="button"
              onClick={() => setTunnel(true)}
              disabled={!complete || pending}
              className="mt-stack flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] disabled:opacity-40 motion-reduce:transition-none"
            >
              {pending ? t('state.loading') : t('lineup.tunnel')}
            </button>
          </div>

          <LockerRack bank={bank} used={used} selected={held} onSelect={tapLocker} />
        </div>
      )}

      {tunnel && (
        <TunnelGate
          pending={pending}
          onSend={send}
          onLastSwitch={() => {
            setTunnel(false)
            setLastCall(true)
          }}
        />
      )}

      {verdict && (
        <TeamSheet
          verdict={verdict}
          slots={slots}
          locks={locks}
          notesTaken={notes.length}
          formationName={formationName}
          onBack={() => {
            setVerdict(null)
            setLastCall(true)
          }}
        >
          <RecordRun
            gate="/lineup"
            correct={verdict.exact}
            asked={verdict.total}
            score={verdict.exact}
          />
          {/*
            The card is the SHEET, not the score. Rule 19: a card whose content is a list
            gets the list template — gate 3 was sharing eleven names as the single line
            "7/11" on a grass ground, which is the same defect the all-time XI card was
            fixed for. `xi` draws every row it is given, so what travels is the team the
            player actually sent out, with the score beside the title.
          */}
          <ShareRow
            kind="lineup"
            params={{ s: String(seed), r: String(cursor) }}
            headline={`${verdict.exact}/${verdict.total}`}
            card={{
              template: 'xi' as const,
              kicker: 'GATE 3 · THE LINE-UP',
              label: t('screen.lineup.title'),
              eyebrow: `${verdict.exact}/${verdict.total}`,
              hero: t('screen.lineup.title'),
              xi: slots
                .map((slot) => {
                  const name = picks[slot.slotId] ?? null
                  return name === null
                    ? null
                    : {
                        roleHe: slot.roleHe,
                        nameHe: splitName(name).familyHe,
                        x: slot.x,
                        y: slot.y,
                      }
                })
                .filter((row): row is NonNullable<typeof row> => row !== null),
              stats: [],
              cta: t('share.challenge'),
              challenge: t('share.sameRound'),
            }}
          />
          {/* The mode had no replay link at all: the only way to a different match was
              to edit the URL. Six recorded XIs, one to a round — this walks them. */}
          <PlayLink
            gate="/lineup"
            className="mt-3 flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-paper"
          >
            {t('run.again')}
          </PlayLink>
        </TeamSheet>
      )}
    </>
  )
}
