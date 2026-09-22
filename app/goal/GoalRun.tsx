'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { AdSlot } from '@/components/ads/AdSlot'
import { Burst } from '@/components/play/Burst'
import { Confetti, NO_RED_TONES } from '@/components/play/Confetti'
import { PlayLink } from '@/components/play/PlayLink'
import { Punch } from '@/components/play/Punch'
import { RecordRun } from '@/components/play/RecordRun'
import { RevealBar, useReveal } from '@/components/play/Reveal'
import { GoalPitch } from '@/components/press/GoalPitch'
import { ACTION_SHORT, ReplayBuilder } from '@/components/replay/ReplayBuilder'
import { ReplayVerdict } from '@/components/replay/ReplayVerdict'
import { ShareRow } from '@/components/share/ShareRow'
import { Num } from '@/components/ui/Num'
import { GOAL_SECONDS, GOALS_PER_RUN, MAX_TOUCHES, MIN_TOUCHES } from '@/lib/game/goal-zones'
import {
  EMPTY_BUILD,
  EMPTY_DRAFT,
  canUndo,
  phaseOf,
  undoStep,
  type BuildState,
  type DraftPhase,
} from '@/lib/game/replay/draft'
import type { Envelope, ReplayPoint, UserTouch } from '@/lib/game/replay/envelope'
import { GOOD_SCORE } from '@/lib/game/replay/judge'
import type { ReplayAction } from '@/lib/game/replay/vocab'
import { LIVES, rankFor } from '@/lib/game/session'
import { t, type MessageKey } from '@/lib/i18n'
import { haptic } from '@/lib/play/haptics'
import { collect } from '@/lib/profile/store'
import { artFor } from '@/lib/share/story'
import type { GoalChallenge, GoalVerdict } from '@/lib/game/goal'
import type { Embedded } from '@/lib/mechanics/types'
import { askGoalHint, askReceptionHint, submitGoal } from './actions'

/**
 * שחזור השער — three moves, one screen, and the count is part of the question.
 *
 * What the gate asked until now was where. It handed over the cast, the verbs and the
 * order, drew twenty squares, and graded the taps. That is a quiz about a diagram, and
 * the diagram was the lie: a zone is a claim about a position no match report ever made.
 *
 * Three things changed and they are one change. The move is BUILT — who, what, from
 * where, to where, as many touches as you think there were. The archive's own move is an
 * ELLIPSE per touch rather than a point, sized from the reporter's own words, so a player
 * who puts the ball anywhere the sentence admits is right and can see that he is right.
 * And the two moves are compared by ALIGNMENT rather than by position, so one touch too
 * many costs one touch's worth of credit instead of everything after it.
 *
 * **There is a submit button now, and it is not the one rule 21 forbids.** That rule bans
 * a "next" — a button whose only job is to let the game continue, charged to the player
 * for nothing. `סיום המהלך` is the opposite: it is the answer to the hardest part of the
 * question, because nobody told you how long the move was. The whistle still blows itself
 * when the clock runs out, on whatever is on the pitch.
 *
 * The clock is a whole MOVE's clock and it is generous, because the thing being rushed is
 * no longer one tap. A round of reconstruction that punishes deliberation is a round that
 * punishes the only skill it is testing.
 *
 * **The reveal is a beat, not a hold (21.9.2026).** It used to sit for a fixed nine
 * seconds and walk on whether or not the player had finished reading — brief §10's
 * "passive waiting" exactly. It is now the shared `useReveal`: a bar drains, a real
 * button walks on NOW, and the moment the player starts reading (a scroll, a touch on
 * the verdict, a key) the beat is called off and the button waits for them.
 *
 * **Hints are paid on the whistle, whoever blows it.** The clock effect is set up once
 * per goal, so the hint count it closed over was the count at kick-off — zero — and a
 * move that ran out of time was graded as if every hint had been free. The count lives
 * in a ref now, read at the moment of grading.
 */

type Played = {
  overall: number
  continuity: number
  touches: number
  /** matched and not bad — what RecordRun counts as right */
  matched: number
  /** matched at GOOD_SCORE or better — the Result's "good touches" */
  good: number
}

type Run = {
  goal: number
  lives: number
  score: number
  hints: number
  played: Played[]
  over: boolean
}

const NEW_RUN: Run = { goal: 0, lives: LIVES, score: 0, hints: 0, played: [], over: false }

/** What a rebuilt move is worth. Three perfect moves reach the top rank and no further. */
const HINT_COST = 120

/** How long the verdict holds before the next goal walks on by itself — unless read. */
const REVEAL_MS = 10000

function pointsFor(overall: number, continuity: number): number {
  return Math.round(overall * 12 + continuity * 2)
}

const PHASE_CAPTION: Record<DraftPhase, MessageKey> = {
  player: 'goal.phase.player',
  action: 'goal.phase.action',
  origin: 'goal.phase.origin',
  target: 'goal.phase.target',
}

export function GoalRun({
  goals,
  seed,
  cursor = 0,
  pin = null,
  embedded,
}: {
  goals: GoalChallenge[]
  seed: number
  cursor?: number
  /** `/goal?g=<goalId>` — the goal dealt first; every server call re-derives with it */
  pin?: string | null
  /**
   * Opened from inside THE WORKER LIFE (`lib/mechanics/types.ts`): one goal, the same judge,
   * and the verdict handed back — no collection, no record, no share, no masthead number.
   * Absent, the gate is exactly the gate.
   */
  embedded?: Omit<Embedded<GoalVerdict>, 'window'>
}) {
  const [run, setRun] = useState<Run>(NEW_RUN)
  const [build, setBuild] = useState<BuildState>(EMPTY_BUILD)
  const [verdict, setVerdict] = useState<GoalVerdict | null>(null)
  const [grading, setGrading] = useState(false)
  const [burst, setBurst] = useState<{ points: number; combo: number } | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(GOAL_SECONDS[0] as number)
  const [hintStart, setHintStart] = useState<string | null>(null)
  const [hintCount, setHintCount] = useState<string | null>(null)
  const [reception, setReception] = useState<{ envelope: Envelope; touch: number } | null>(null)
  const [asking, setAsking] = useState(false)
  const settled = useRef(false)
  const live = useRef<UserTouch[]>([])
  /** hints bought for THIS goal — a ref, so a whistle from the clock reads today's count */
  const spent = useRef(0)

  const { touches, draft, editing } = build
  const challenge = goals[run.goal]
  const total = GOAL_SECONDS[Math.min(run.goal, GOAL_SECONDS.length - 1)] ?? 60
  const stageLabel = `run.stage.${run.goal + 1}` as MessageKey

  live.current = touches

  /** the whistle: grade the whole move at once, and roll it on the pitch while we wait */
  const whistle = useCallback(
    async (placed: UserTouch[]) => {
      if (settled.current || !challenge) return
      settled.current = true
      setGrading(true)
      let result: GoalVerdict | null = null
      try {
        result = await submitGoal(seed, run.goal, placed, cursor, pin)
      } catch {
        result = null
      }
      setGrading(false)
      if (!result) {
        // The server did not answer. The move is still on the pitch and סיום works again:
        // a failed round trip must never leave a run with no way forward (rule 42).
        settled.current = false
        return
      }
      setVerdict(result)

      const gained = Math.max(
        0,
        pointsFor(result.metrics.overall, result.metrics.continuity) - spent.current * HINT_COST,
      )
      /**
       * A life is lost for a touch you PLACED and got wrong — never for one you did not
       * place at all.
       *
       * The first version charged for a missing touch too, and that is the gate billing
       * the player for the one thing it deliberately refuses to tell them: a four-touch
       * move rebuilt as two took four lives before the second goal was dealt. A hidden
       * count already costs the alignment, the touch-count penalty and the sequence
       * share; charging a life on top of that is charging twice for a secret.
       */
      const lost = result.touches.filter(
        (line) => line.kind === 'matched' && line.grade === 'bad',
      ).length
      const matched = result.touches.filter((line) => line.kind === 'matched' && line.grade !== 'bad').length
      const good = result.touches.filter((line) => line.kind === 'matched' && line.grade === 'good').length

      if (gained > 0) setBurst({ points: gained, combo: Math.max(1, matched) })
      if (result.metrics.overall >= 90) setCelebrate(true)
      // A move rebuilt well enough is KEPT — under its own goal id, in the one profile
      // store, which is what the worker card (gate 10) reads. Never keyed by article:
      // two goals from one report are two moves.
      if (result.metrics.overall >= GOOD_SCORE && !embedded) collect('goal', [result.goalId])
      haptic(lost > 0 ? 'miss' : result.metrics.overall >= GOOD_SCORE ? 'lock' : 'tap')

      setRun((previous) => ({
        goal: previous.goal,
        lives: Math.max(0, previous.lives - lost),
        score: previous.score + gained,
        hints: previous.hints,
        played: [
          ...previous.played,
          {
            overall: result.metrics.overall,
            continuity: result.metrics.continuity,
            touches: result.truth.length,
            matched,
            good,
          },
        ],
        over: previous.over,
      }))
    },
    [challenge, cursor, embedded, pin, run.goal, seed],
  )

  /**
   * A touch is who, what, from where, to where. The moment the fourth is answered there
   * is nothing left to decide, so the second pitch tap COMMITS it — gate 4's rule, in
   * gate 8's shape (rule 24: a tap places; a second tap that carries no decision is a
   * dexterity step charged for nothing, and on a phone it doubles every action).
   */
  const place = useCallback(
    (point: ReplayPoint) => {
      if (!draft.actorHe || !draft.action) return
      if (!draft.origin) {
        setBuild({ touches, editing, draft: { ...draft, origin: point } })
        haptic('tap')
        return
      }
      const touch: UserTouch = {
        actorHe: draft.actorHe,
        action: draft.action,
        origin: draft.origin,
        target: point,
      }
      if (editing !== null) {
        setBuild({
          touches: touches.map((item, index) => (index === editing ? touch : item)),
          draft: EMPTY_DRAFT,
          editing: null,
        })
      } else {
        if (touches.length >= MAX_TOUCHES) return
        setBuild({ touches: [...touches, touch], draft: EMPTY_DRAFT, editing: null })
      }
      haptic('lock')
    },
    [draft, editing, touches],
  )

  function edit(index: number) {
    const touch = touches[index]
    if (!touch || verdict || grading) return
    setBuild({ touches, editing: index, draft: { ...touch } })
    haptic('tap')
  }

  /** A hint that lands after the whistle is dropped: it would be paid for a goal gone. */
  async function ask(which: 'start' | 'count') {
    if (verdict || grading || asking) return
    const goal = run.goal
    setAsking(true)
    try {
      const answer = await askGoalHint(seed, goal, which, cursor, pin)
      if (answer === null || settled.current) return
      if (which === 'start') setHintStart(answer)
      else setHintCount(answer)
      spent.current += 1
      setRun((previous) => ({ ...previous, hints: previous.hints + 1 }))
      haptic('tap')
    } catch {
      // no answer, no charge
    } finally {
      setAsking(false)
    }
  }

  /** The reception hint: ONE envelope, for the touch being built now, fetched once. */
  async function askReception() {
    if (verdict || grading || asking || reception) return
    const touch = editing ?? touches.length
    setAsking(true)
    try {
      const envelope = await askReceptionHint(seed, run.goal, touch, cursor, pin)
      if (envelope === null || settled.current) return
      setReception({ envelope, touch })
      spent.current += 1
      setRun((previous) => ({ ...previous, hints: previous.hints + 1 }))
      haptic('tap')
    } catch {
      // no answer, no charge
    } finally {
      setAsking(false)
    }
  }

  /** the clock — running out whistles on whatever is on the pitch */
  useEffect(() => {
    if (verdict || run.over || !challenge) return
    setSecondsLeft(total)
    settled.current = false
    const started = Date.now()
    const tick = window.setInterval(() => {
      // once the whistle has gone the clock has nothing left to say
      if (settled.current) {
        window.clearInterval(tick)
        return
      }
      const left = total - Math.floor((Date.now() - started) / 1000)
      setSecondsLeft(Math.max(0, left))
      if (left <= 0) {
        window.clearInterval(tick)
        void whistle(live.current)
      }
    }, 250)
    return () => window.clearInterval(tick)
    // the clock belongs to the GOAL, so it restarts on the goal index and nothing else
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.goal, challenge, run.over])

  /** the next goal — from the button, or from the beat running out unread */
  const advance = useCallback(() => {
    setBurst(null)
    setCelebrate(false)
    setVerdict(null)
    setBuild(EMPTY_BUILD)
    setHintStart(null)
    setHintCount(null)
    setReception(null)
    spent.current = 0
    settled.current = false
    setRun((previous) => {
      const goal = previous.goal + 1
      return { ...previous, goal, over: previous.lives <= 0 || goal >= GOALS_PER_RUN }
    })
  }, [])

  // inside the life the verdict waits for the player: the room answers only when he walks back
  const reveal = useReveal({ ms: REVEAL_MS, onDone: advance, active: verdict !== null && !embedded })
  const { running: revealRunning, cancel: cancelReveal } = reveal

  /** reading the verdict calls the beat off — the button is then the only way on */
  useEffect(() => {
    if (!verdict || !revealRunning) return
    const stop = () => cancelReveal()
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchmove', stop, { passive: true })
    window.addEventListener('keydown', stop)
    return () => {
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchmove', stop)
      window.removeEventListener('keydown', stop)
    }
  }, [verdict, revealRunning, cancelReveal])

  if (run.over || !challenge) return <Result run={run} seed={seed} cursor={cursor} />

  const labels = touches.map((touch, index) => ({
    nameHe: touch.actorHe,
    actHe: t(ACTION_SHORT[touch.action]),
    num: String(index + 1),
  }))

  const fraction = total > 0 ? Math.max(0, secondsLeft / total) : 0
  const grades = verdict
    ? touches.map((_, index) => {
        const line = verdict.touches.find((item) => item.userIndex === index)
        return line?.kind === 'matched' ? line.grade : line ? ('bad' as const) : undefined
      })
    : undefined
  const pairs = verdict?.touches.map((line) => ({ user: line.userIndex, truth: line.truthIndex }))
  const full = touches.length >= MAX_TOUCHES
  const caption = verdict
    ? null
    : grading
      ? { lead: t('goal.whistleWait'), text: t('goal.phase.rolling') }
      : full && editing === null
        ? { lead: `${MAX_TOUCHES}/${MAX_TOUCHES}`, text: t('goal.tooMany') }
        : {
            lead: t('goal.phase.touch', { n: String((editing ?? touches.length) + 1) }),
            text: t(PHASE_CAPTION[phaseOf(draft)]),
          }
  const finalBeat = run.goal + 1 >= GOALS_PER_RUN || run.lives <= 0

  return (
    <div className="relative">
      {/* the one gate whose glass is printed GRASS, so the paper it celebrates with
          carries no vermilion — see NO_RED_TONES. */}
      {celebrate && <Confetti tones={NO_RED_TONES} />}
      {burst && <Burst points={burst.points} combo={burst.combo} />}

      {/* the bar — lives, score, which goal, and a clock you read without looking */}
      <div className="sticky top-0 z-20 -mx-gutter bg-sheet/95 px-gutter pb-2 pt-2 backdrop-blur">
        <div className={embedded ? 'hidden' : 'flex items-center justify-between gap-3'}>
          <ol className="flex items-center gap-1.5" aria-label={t('run.lives')}>
            {Array.from({ length: LIVES }, (_, index) => (
              <li
                key={index}
                className={`h-3.5 w-3.5 border-hair border-ink transition-all duration-press ${
                  index < run.lives ? 'bg-red' : 'bg-transparent opacity-40'
                }`}
              />
            ))}
          </ol>
          <p className="font-poster text-[26px] leading-none text-ink">
            <Num>{run.score}</Num>
          </p>
          <p className="font-mono text-[11px] tabular-nums text-muted">
            <Num>{`${run.goal + 1}/${GOALS_PER_RUN}`}</Num>
          </p>
        </div>
        <div className="mt-1.5 h-1.5 w-full bg-ink/15">
          <div
            className={`h-full transition-[width] duration-200 ease-linear ${
              fraction <= 0.28 ? 'bg-red' : 'bg-ink'
            }`}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      </div>

      {/* the masthead — one goal, named, with the fixture under it */}
      <div className="mt-2.5 border-rule border-ink bg-red px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2 border-b-hair border-ink pb-1.5">
          <span className="font-body text-[10px] font-extrabold tracking-widest text-ink">
            {embedded ? challenge.seasonLabel : t(stageLabel)}
          </span>
          {!embedded && (
            <span className="font-latin text-[9px] font-bold tracking-[0.2em] text-paper" dir="ltr">
              MATCHDAY SPECIAL · No. 08
            </span>
          )}
        </div>
        <p className="mt-2 font-display text-step-2 leading-[0.95] text-paper">
          {challenge.titleHe}
        </p>
        <p className="mt-1 font-mono text-[11px] tabular-nums text-ink">
          <Num>{challenge.subtitleHe}</Num>
        </p>
        <p className="mt-0.5 font-body text-[11px] leading-snug text-ink">
          <bdi>{challenge.competitionHe}</bdi> · <bdi>{challenge.opponentHe}</bdi> ·{' '}
          <Num>{challenge.scoreHe}</Num>
        </p>
      </div>

      {/*
        One compact working screen.
        The board is a 300×440 picture, so `w-full` on a 950px desktop column drew a pitch
        fourteen hundred pixels tall and put every control below the fold — the exact
        opposite of what a wide screen is for. It is capped at 430 and centred everywhere,
        and from `lg` up it takes a 400px column with the builder beside it. On a phone the
        cap never binds, so the zone still measures its proven 48px at 320 (tests/brand).
      */}
      <div className="mt-2 lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start lg:gap-4">
        {/* The board is sticky only where it has its OWN COLUMN.
            Making it sticky on a phone as well looked obviously right — keep the primary
            object visible while the racks scroll — and it is a softlock: a sticky element
            is still in flow, so the builder underneath scrolls UP AND UNDER it, and the
            pinned pitch's twenty-one invisible tap targets swallow every tap meant for a
            player's name. `npm run goal:probe` failed on the first chip with `E4 …
            intercepts pointer events`, which is the same family as the kit game's reveal
            landing inside the tab bar (rule 33) and was found the same way: by playing it.
            From `lg` up the board sits in a column of its own and cannot cover anything. */}
        <div className="mx-auto w-full max-w-[430px] lg:sticky lg:top-16">
          <GoalPitch
            touches={touches}
            draftOrigin={draft.origin && !draft.target ? draft.origin : null}
            labels={labels}
            truth={verdict?.truth}
            grades={grades}
            pairs={pairs}
            onPlace={place}
            disabled={verdict !== null || grading}
            caption={caption}
            hintEnvelope={reception?.envelope ?? null}
            rolling={grading}
          />
        </div>

        <div className="min-w-0">
      {verdict ? (
        <>
          {/* the way on — first thing under the board, and a real button */}
          <div className="mt-2 border-rule border-ink bg-ink">
            {revealRunning && <RevealBar progress={reveal.progress} tone="sheet" />}
            <button
              type="button"
              onClick={embedded ? () => embedded.onResult(verdict) : reveal.skip}
              data-goal="continue"
              className="flex min-h-tap w-full items-center justify-center gap-2 px-4 font-body text-step-0 font-extrabold text-paper"
            >
              {embedded ? embedded.doneLabel : finalBeat ? t('goal.reveal.final') : t('goal.reveal.continue')}
              <span aria-hidden="true">←</span>
            </button>
          </div>
          <ul className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11px] text-muted">
            <li className="flex items-center gap-1">
              <span className="inline-block h-2 w-4 bg-red" aria-hidden="true" />
              {t('goal.legend.mine')}
            </li>
            <li className="flex items-center gap-1">
              <span className="inline-block h-2 w-4 bg-sign" aria-hidden="true" />
              {t('goal.legend.truth')}
            </li>
            <li className="flex items-center gap-1">
              <span className="inline-block h-2 w-4 border-hair border-dashed border-sign" aria-hidden="true" />
              {t('goal.legend.envelope')}
            </li>
            <li className="flex items-center gap-1">
              <span className="inline-block h-0 w-4 border-t-2 border-dashed border-ink" aria-hidden="true" />
              {t('goal.legend.bridge')}
            </li>
            <li className="flex items-center gap-1">
              <span className="font-latin text-[13px] font-extrabold leading-none text-ink" aria-hidden="true">+</span>
              {t('goal.verdict.extra')}
            </li>
            <li className="flex items-center gap-1">
              <span className="font-latin text-[13px] font-extrabold leading-none text-ink" aria-hidden="true">○</span>
              {t('goal.verdict.missing')}
            </li>
          </ul>
          {/* touching the verdict is reading it — the beat stops and waits */}
          <div onPointerDown={cancelReveal} onFocus={cancelReveal}>
            <ReplayVerdict
              metrics={verdict.metrics}
              touches={verdict.touches}
              narrativeHe={verdict.narrativeHe}
              sourceTitle={verdict.sourceTitle}
            />
          </div>
        </>
      ) : (
        <>
          <ReplayBuilder
            pool={challenge.pool}
            opponents={challenge.opponents}
            draft={draft}
            touches={touches}
            editing={editing}
            full={full}
            canFinish={touches.length >= MIN_TOUCHES}
            canUndo={canUndo(build)}
            busy={grading}
            onPickPlayer={(name) => {
              setBuild((current) => ({ ...current, draft: { ...current.draft, actorHe: name } }))
              haptic('tap')
            }}
            onPickAction={(action: ReplayAction) => {
              setBuild((current) => ({ ...current, draft: { ...current.draft, action } }))
              haptic('tap')
            }}
            onClear={() => setBuild((current) => ({ ...current, draft: EMPTY_DRAFT, editing: null }))}
            onUndo={() => {
              setBuild((current) => undoStep(current))
              haptic('tap')
            }}
            onEdit={edit}
            onFinish={() => void whistle(touches)}
          />

          {/* the three hints, each a piece of the answer and each paid for */}
          <div className="mt-2 border-rule border-ink bg-sheet p-3">
            <p className="font-body text-[11px] font-extrabold tracking-widest text-muted">
              {t('goal.hints')} · {t('goal.hint.cost', { n: String(HINT_COST) })}
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => void ask('start')}
                disabled={hintStart !== null || asking || grading}
                data-goal="hint-start"
                className="flex min-h-tap items-center justify-center border-rule border-ink bg-paper px-1.5 text-center font-body text-[11.5px] font-extrabold leading-tight text-ink disabled:opacity-40"
              >
                {t('goal.hint.start')}
              </button>
              <button
                type="button"
                onClick={() => void ask('count')}
                disabled={hintCount !== null || asking || grading}
                data-goal="hint-count"
                className="flex min-h-tap items-center justify-center border-rule border-ink bg-paper px-1.5 text-center font-body text-[11.5px] font-extrabold leading-tight text-ink disabled:opacity-40"
              >
                {t('goal.hint.count')}
              </button>
              <button
                type="button"
                onClick={() => void askReception()}
                disabled={reception !== null || asking || grading}
                data-goal="hint-reception"
                className="flex min-h-tap items-center justify-center border-rule border-ink bg-paper px-1.5 text-center font-body text-[11.5px] font-extrabold leading-tight text-ink disabled:opacity-40"
              >
                {t('goal.hint.reception')}
              </button>
            </div>
            {hintStart && (
              <p className="mt-1.5 font-body text-[11.5px] leading-snug text-ink">
                {t('goal.sourceWords')} <bdi className="font-extrabold">{hintStart}</bdi>
              </p>
            )}
            {hintCount && (
              <p className="mt-1 font-body text-[11.5px] leading-snug text-ink">
                <Num>{t('goal.hint.countAnswer', { n: hintCount })}</Num>
              </p>
            )}
            {reception && (
              <p className="mt-1 font-body text-[11.5px] leading-snug text-ink">
                {t('goal.hint.receptionFor', { n: String(reception.touch + 1) })}
              </p>
            )}
          </div>
        </>
      )}
        </div>
      </div>

      <p className="mt-2 font-body text-[11px] leading-snug text-muted">{t('goal.approximate')}</p>
    </div>
  )
}

/** הפסק — what the run came to, and the link that hands over the identical three goals. */
function Result({ run, seed, cursor }: { run: Run; seed: number; cursor: number }) {
  const rank = rankFor(run.score) as MessageKey
  const played = run.played
  const average =
    played.length > 0
      ? Math.round(played.reduce((sum, item) => sum + item.overall, 0) / played.length)
      : 0
  const best = played.reduce((top, item) => Math.max(top, item.overall), 0)
  const continuity =
    played.length > 0
      ? Math.round(played.reduce((sum, item) => sum + item.continuity, 0) / played.length)
      : 0
  const matched = played.reduce((sum, item) => sum + item.matched, 0)
  const good = played.reduce((sum, item) => sum + item.good, 0)
  const asked = played.reduce((sum, item) => sum + item.touches, 0)
  // of every touch the archive described, how many the player rebuilt WELL — the
  // prototype's full-time figure, counted on the judge's own "good" line
  const goodPct = asked > 0 ? Math.round((good / asked) * 100) : 0

  return (
    <div className="mt-stack">
      <Punch />
      <RecordRun gate="/goal" score={run.score} correct={matched} asked={asked} />
      <div className="border-b-rule border-ink pb-2">
        <p className="font-latin text-[9px] font-bold tracking-[0.2em] text-red" dir="ltr">
          FULL TIME
        </p>
        <h2 className="font-display text-step-2 leading-tight text-ink">
          {run.lives <= 0 ? t('run.over') : t('run.survived')}
        </h2>
      </div>

      <div className="mt-stack grid grid-cols-2 gap-2.5">
        <div className="border-rule border-ink bg-ink p-4 text-center">
          <p className="font-poster text-[52px] leading-none text-red">
            <Num>{run.score}</Num>
          </p>
          <p className="mt-1 font-body text-[10px] tracking-widest text-concrete">
            {t('run.score')}
          </p>
          <p className="mt-2 font-display text-step-0 leading-tight text-paper">{t(rank)}</p>
        </div>
        <div className="border-rule border-ink bg-sheet p-4">
          <p className="font-poster text-[34px] leading-none text-ink">
            <Num>{`${average}%`}</Num>
          </p>
          <p className="mt-1 font-body text-[10px] tracking-widest text-muted">
            {t('goal.runAverage')}
          </p>
          <p className="mt-2 font-body text-[11.5px] leading-snug text-muted">
            {t('goal.bestMove')}: <Num>{`${best}%`}</Num>
          </p>
          <p className="mt-1 font-body text-[11.5px] leading-snug text-muted">
            {t('goal.continuityAvg')}: <Num>{`${continuity}%`}</Num>
          </p>
          <p className="mt-1 font-body text-[11.5px] leading-snug text-muted" data-goal="good-touches">
            {t('goal.goodTouches')}: <Num>{`${goodPct}%`}</Num>
          </p>
          {run.hints > 0 && (
            <p className="mt-1 font-body text-[11.5px] leading-snug text-muted">
              <Num>{t('goal.hint.used', { n: String(run.hints) })}</Num>
            </p>
          )}
        </div>
      </div>

      <ShareRow
        kind="goal"
        params={{ h: String(average), s: String(seed), r: String(cursor) }}
        headline={t('goal.shareHeadMove', { pct: String(average) })}
        card={{
          template: 'grass' as const,
          art: artFor('goal', average / 100),
          kicker: 'GATE 8 · REBUILD THE GOAL',
          label: t('screen.goal.title'),
          eyebrow: t('goal.overall'),
          hero: `${average}%`,
          bigStat: { v: `${best}%`, k: t('goal.bestMove') },
          stats: [
            { k: t('run.score'), v: String(run.score) },
            { k: t('goal.continuityAvg'), v: `${continuity}%` },
          ],
          cta: t('goal.cta'),
          challenge: t('share.sameRound'),
        }}
      />

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <PlayLink
          gate="/goal"
          className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink"
        >
          {t('run.again')}
        </PlayLink>
        <a
          href="/"
          className="flex min-h-tap items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper"
        >
          {t('nav.gates')}
        </a>
      </div>

      <AdSlot placement="result" />
    </div>
  )
}
