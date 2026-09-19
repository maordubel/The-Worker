'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { AdSlot } from '@/components/ads/AdSlot'
import { Burst } from '@/components/play/Burst'
import { Confetti, NO_RED_TONES } from '@/components/play/Confetti'
import { PlayLink } from '@/components/play/PlayLink'
import { Punch } from '@/components/play/Punch'
import { RecordRun } from '@/components/play/RecordRun'
import { GoalPitch } from '@/components/press/GoalPitch'
import { ACTION_SHORT, ReplayBuilder, type Draft } from '@/components/replay/ReplayBuilder'
import { ReplayVerdict } from '@/components/replay/ReplayVerdict'
import { ShareRow } from '@/components/share/ShareRow'
import { Num } from '@/components/ui/Num'
import { GOAL_SECONDS, GOALS_PER_RUN, MAX_TOUCHES, MIN_TOUCHES } from '@/lib/game/goal-zones'
import type { ReplayPoint, UserTouch } from '@/lib/game/replay/envelope'
import type { ReplayAction } from '@/lib/game/replay/vocab'
import { LIVES, rankFor } from '@/lib/game/session'
import { t, type MessageKey } from '@/lib/i18n'
import { artFor } from '@/lib/share/story'
import type { GoalChallenge, GoalVerdict } from '@/lib/game/goal'
import { askGoalHint, submitGoal } from './actions'

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
 */

type Played = { overall: number; continuity: number; touches: number; matched: number }

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

function pointsFor(overall: number, continuity: number): number {
  return Math.round(overall * 12 + continuity * 2)
}

const EMPTY_DRAFT: Draft = { actorHe: null, action: null, origin: null, target: null }

export function GoalRun({
  goals,
  seed,
  cursor = 0,
}: {
  goals: GoalChallenge[]
  seed: number
  cursor?: number
}) {
  const [run, setRun] = useState<Run>(NEW_RUN)
  const [touches, setTouches] = useState<UserTouch[]>([])
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [editing, setEditing] = useState<number | null>(null)
  const [verdict, setVerdict] = useState<GoalVerdict | null>(null)
  const [burst, setBurst] = useState<{ points: number; combo: number } | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(GOAL_SECONDS[0] as number)
  const [hintStart, setHintStart] = useState<string | null>(null)
  const [hintCount, setHintCount] = useState<string | null>(null)
  const settled = useRef(false)
  const live = useRef<UserTouch[]>([])

  const challenge = goals[run.goal]
  const total = GOAL_SECONDS[Math.min(run.goal, GOAL_SECONDS.length - 1)] ?? 60
  const stageLabel = `run.stage.${run.goal + 1}` as MessageKey

  live.current = touches

  /** the whistle: grade the whole move at once, then move on by itself */
  const whistle = useCallback(
    async (placed: UserTouch[], spent: number) => {
      if (settled.current || !challenge) return
      settled.current = true
      const result = await submitGoal(seed, run.goal, placed, cursor)
      if (!result) return
      setVerdict(result)

      const gained = Math.max(0, pointsFor(result.metrics.overall, result.metrics.continuity) - spent * HINT_COST)
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

      if (gained > 0) setBurst({ points: gained, combo: Math.max(1, matched) })
      if (result.metrics.overall >= 90) setCelebrate(true)

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
          },
        ],
        over: previous.over,
      }))
    },
    [challenge, cursor, run.goal, seed],
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
        setDraft({ ...draft, origin: point })
        return
      }
      const touch: UserTouch = {
        actorHe: draft.actorHe,
        action: draft.action,
        origin: draft.origin,
        target: point,
      }
      setTouches((current) => {
        if (editing !== null) {
          return current.map((item, index) => (index === editing ? touch : item))
        }
        return current.length >= MAX_TOUCHES ? current : [...current, touch]
      })
      setDraft(EMPTY_DRAFT)
      setEditing(null)
    },
    [draft, editing],
  )

  function edit(index: number) {
    const touch = touches[index]
    if (!touch || verdict) return
    setEditing(index)
    setDraft({ ...touch })
  }

  async function ask(which: 'start' | 'count') {
    if (verdict) return
    const answer = await askGoalHint(seed, run.goal, which, cursor)
    if (answer === null) return
    if (which === 'start') setHintStart(answer)
    else setHintCount(answer)
    setRun((previous) => ({ ...previous, hints: previous.hints + 1 }))
  }

  const spent = (hintStart ? 1 : 0) + (hintCount ? 1 : 0)

  /** the clock — running out whistles on whatever is on the pitch */
  useEffect(() => {
    if (verdict || run.over || !challenge) return
    setSecondsLeft(total)
    settled.current = false
    const started = Date.now()
    const tick = window.setInterval(() => {
      const left = total - Math.floor((Date.now() - started) / 1000)
      setSecondsLeft(Math.max(0, left))
      if (left <= 0) {
        window.clearInterval(tick)
        void whistle(live.current, spent)
      }
    }, 250)
    return () => window.clearInterval(tick)
    // the clock belongs to the GOAL, so it restarts on the goal index and nothing else
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.goal, challenge, run.over])

  /** and after the verdict has been read, the next goal walks on by itself */
  useEffect(() => {
    if (!verdict) return
    const wait = window.setTimeout(() => {
      setBurst(null)
      setCelebrate(false)
      setVerdict(null)
      setTouches([])
      setDraft(EMPTY_DRAFT)
      setEditing(null)
      setHintStart(null)
      setHintCount(null)
      settled.current = false
      setRun((previous) => {
        const goal = previous.goal + 1
        return { ...previous, goal, over: previous.lives <= 0 || goal >= GOALS_PER_RUN }
      })
    }, 9000)
    return () => window.clearTimeout(wait)
  }, [verdict])

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

  return (
    <div className="relative">
      {/* the one gate whose glass is printed GRASS, so the paper it celebrates with
          carries no vermilion — see NO_RED_TONES. */}
      {celebrate && <Confetti tones={NO_RED_TONES} />}
      {burst && <Burst points={burst.points} combo={burst.combo} />}

      {/* the bar — lives, score, which goal, and a clock you read without looking */}
      <div className="sticky top-0 z-20 -mx-gutter bg-sheet/95 px-gutter pb-2 pt-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
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
            {t(stageLabel)}
          </span>
          <span className="font-latin text-[9px] font-bold tracking-[0.2em] text-paper" dir="ltr">
            MATCHDAY SPECIAL · No. 08
          </span>
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
            onPlace={place}
            disabled={verdict !== null}
          />
        </div>

        <div className="min-w-0">
      {verdict ? (
        <>
          <ul className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[10.5px] text-muted">
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
          </ul>
          <ReplayVerdict
            metrics={verdict.metrics}
            touches={verdict.touches}
            narrativeHe={verdict.narrativeHe}
            sourceTitle={verdict.sourceTitle}
          />
        </>
      ) : (
        <>
          <ReplayBuilder
            pool={challenge.pool}
            draft={draft}
            touches={touches}
            editing={editing}
            full={touches.length >= MAX_TOUCHES}
            canFinish={touches.length >= MIN_TOUCHES}
            onPickPlayer={(name) => setDraft((current) => ({ ...current, actorHe: name }))}
            onPickAction={(action: ReplayAction) =>
              setDraft((current) => ({ ...current, action }))
            }
            onClear={() => {
              setDraft(EMPTY_DRAFT)
              setEditing(null)
            }}
            onUndo={() => {
              setTouches((current) => current.slice(0, -1))
              setEditing(null)
              setDraft(EMPTY_DRAFT)
            }}
            onEdit={edit}
            onFinish={() => void whistle(touches, spent)}
          />

          {/* the two hints, each a piece of the answer and each paid for */}
          <div className="mt-2 border-rule border-ink bg-sheet p-3">
            <p className="font-body text-[10px] font-extrabold tracking-widest text-muted">
              {t('goal.hints')} · {t('goal.hint.cost', { n: String(HINT_COST) })}
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => void ask('start')}
                disabled={hintStart !== null}
                className="flex min-h-tap items-center justify-center border-rule border-ink bg-paper px-2 font-body text-[11.5px] font-extrabold text-ink disabled:opacity-40"
              >
                {t('goal.hint.start')}
              </button>
              <button
                type="button"
                onClick={() => void ask('count')}
                disabled={hintCount !== null}
                className="flex min-h-tap items-center justify-center border-rule border-ink bg-paper px-2 font-body text-[11.5px] font-extrabold text-ink disabled:opacity-40"
              >
                {t('goal.hint.count')}
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
  const asked = played.reduce((sum, item) => sum + item.touches, 0)

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
