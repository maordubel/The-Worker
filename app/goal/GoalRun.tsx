'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Burst } from '@/components/play/Burst'
import { Confetti } from '@/components/play/Confetti'
import { GoalPitch } from '@/components/press/GoalPitch'
import { Num } from '@/components/ui/Num'
import { Punch } from '@/components/play/Punch'
import { ShareRow } from '@/components/share/ShareRow'
import { GOAL_SECONDS, GOALS_PER_RUN, type Grade, type ZoneId } from '@/lib/game/goal-zones'
import { LIVES, MAX_MULTIPLIER, rankFor } from '@/lib/game/session'
import { t, type MessageKey } from '@/lib/i18n'
import type { GoalChallenge, GoalVerdict } from '@/lib/game/goal'
import { submitGoal } from './actions'

/**
 * שחזור השער — three goals, one screen, no navigation and no submit button.
 *
 * What was wrong with the old version was not the idea, it was the shape. It dealt ONE
 * goal, asked for pixel-perfect taps, and finished with a "שלח לאימות" button — which
 * is the "next" button rule 21 exists to forbid, wearing a different hat. The whistle
 * now blows ITSELF the moment the last touch lands: the navy path draws, the verdict
 * prints, and the next goal is already on the way.
 *
 * The run is the same loop as every other gate — three stages, three lives, a combo, a
 * clock that tightens — with one thing borrowed from the pitch itself: a stage is a
 * whole GOAL, not four loose questions. You rebuild a move, you are told what you got
 * wrong about it, you rebuild the next one.
 *
 * A near miss is a real outcome here. One zone out is not knowing the move and it is not
 * ignorance either, so it scores half, keeps the combo and costs no life, and the
 * verdict says which half you had — the depth or the side.
 */

const ACTION_LABEL: Record<string, MessageKey> = {
  pass: 'goal.action.pass',
  cross: 'goal.action.cross',
  dribble: 'goal.action.dribble',
  shot: 'goal.action.shot',
}

const SHORT_ACT: Record<string, MessageKey> = {
  pass: 'goal.act.pass',
  cross: 'goal.act.cross',
  dribble: 'goal.act.dribble',
  shot: 'goal.act.shot',
}

type Run = {
  goal: number
  lives: number
  score: number
  combo: number
  bestCombo: number
  hits: number
  nears: number
  touches: number
  over: boolean
}

const NEW_RUN: Run = {
  goal: 0,
  lives: LIVES,
  score: 0,
  combo: 0,
  bestCombo: 0,
  hits: 0,
  nears: 0,
  touches: 0,
  over: false,
}

function pointsFor(grade: Grade, combo: number, secondsLeft: number, total: number): number {
  if (grade === 'miss') return 0
  const speed = total > 0 ? Math.max(0, Math.min(1, secondsLeft / total)) : 0
  const base = grade === 'hit' ? 140 : 60
  const multiplier = Math.min(MAX_MULTIPLIER, Math.max(1, combo))
  return Math.round((base + 90 * speed) * multiplier)
}

export function GoalRun({ goals, seed }: { goals: GoalChallenge[]; seed: number }) {
  const [run, setRun] = useState<Run>(NEW_RUN)
  const [picks, setPicks] = useState<ZoneId[]>([])
  const [verdict, setVerdict] = useState<GoalVerdict | null>(null)
  const [burst, setBurst] = useState<{ points: number; combo: number } | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(GOAL_SECONDS[0] as number)
  const settled = useRef(false)

  const challenge = goals[run.goal]
  const total = GOAL_SECONDS[Math.min(run.goal, GOAL_SECONDS.length - 1)] ?? 21
  const step = challenge?.steps[picks.length] ?? null
  const stageLabel = `run.stage.${run.goal + 1}` as MessageKey

  /** the whistle: grade the whole move at once, then move on by itself */
  const whistle = useCallback(
    async (placed: ZoneId[]) => {
      if (settled.current || !challenge) return
      settled.current = true
      const result = await submitGoal(seed, run.goal, placed)
      if (!result) return
      setVerdict(result)

      let combo = run.combo
      let lives = run.lives
      let gained = 0
      for (const line of result.steps) {
        if (line.grade === 'miss') {
          combo = 0
          lives -= 1
        } else {
          combo += 1
          gained += pointsFor(line.grade, combo, secondsLeft, total)
        }
      }
      if (gained > 0) setBurst({ points: gained, combo })
      if (result.hits === result.total) setCelebrate(true)

      setRun((previous) => ({
        goal: previous.goal,
        lives: Math.max(0, lives),
        score: previous.score + gained,
        combo,
        bestCombo: Math.max(previous.bestCombo, combo),
        hits: previous.hits + result.hits,
        nears: previous.nears + result.nears,
        touches: previous.touches + result.total,
        over: previous.over,
      }))
    },
    [challenge, run.combo, run.goal, run.lives, secondsLeft, seed, total],
  )

  function place(zone: ZoneId) {
    if (verdict || !challenge || settled.current) return
    const next = [...picks, zone]
    setPicks(next)
    if (next.length >= challenge.steps.length) void whistle(next)
  }

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
        void whistle(picks)
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
      setPicks([])
      settled.current = false
      setRun((previous) => {
        const goal = previous.goal + 1
        return { ...previous, goal, over: previous.lives <= 0 || goal >= GOALS_PER_RUN }
      })
    }, 4200)
    return () => window.clearTimeout(wait)
  }, [verdict])

  if (run.over || !challenge) return <Result run={run} seed={seed} />

  const labels = picks.map((_, index) => {
    const line = challenge.steps[index]
    return {
      nameHe: line?.actorHe ?? '',
      actHe: line ? t(SHORT_ACT[line.action] as MessageKey) : '',
      num: String(index + 1),
    }
  })

  const fraction = total > 0 ? Math.max(0, secondsLeft / total) : 0

  return (
    <div className="relative">
      {celebrate && <Confetti />}
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
        <p className="mt-1 font-mono text-[11px] text-ink">
          <Num>{challenge.subtitleHe}</Num>
        </p>
        <p className="mt-0.5 font-body text-[11px] leading-snug text-ink">
          <bdi>{challenge.competitionHe}</bdi> · <bdi>{challenge.opponentHe}</bdi> ·{' '}
          <Num>{challenge.scoreHe}</Num>
        </p>
      </div>

      {/* the ask — who has the ball and what he is about to do */}
      <div className="mt-2 flex items-center justify-between gap-2 border-x-rule border-t-rule border-ink bg-ink px-3 py-2">
        {step ? (
          <p className="min-w-0 font-display text-step-0 leading-tight text-paper">
            <span className="text-red">
              <Num>{picks.length + 1}</Num>
            </span>{' '}
            {step.actorHe} — {t(ACTION_LABEL[step.action] as MessageKey)}
          </p>
        ) : (
          <p className="font-display text-step-0 text-paper">{t('goal.whistled')}</p>
        )}
        <span className="shrink-0 font-latin text-[10px] font-extrabold tracking-[0.12em] text-concrete" dir="ltr">
          {picks.length} / {challenge.steps.length}
        </span>
      </div>

      <GoalPitch
        picks={picks}
        truth={verdict?.truthZones}
        grades={verdict?.steps.map((line) => line.grade)}
        labels={labels}
        onPick={place}
        disabled={verdict !== null}
      />

      {!verdict && step && (
        <p className="mt-2 font-body text-[11.5px] leading-snug text-muted">
          {t('goal.hintPosition')} <bdi className="font-extrabold text-ink">{step.positionHe}</bdi>
        </p>
      )}

      {verdict && (
        <div className="mt-2.5 border-rule border-ink bg-sheet p-3">
          <p className="font-display text-step-1 leading-tight text-ink">
            {t('goal.verdictLine', {
              hits: String(verdict.hits),
              total: String(verdict.total),
            })}
          </p>
          <p className="mt-1 font-body text-step--1 leading-relaxed text-ink">
            {verdict.narrativeHe}
          </p>
          <ol className="mt-2.5 border-t-hair border-ink/25">
            {verdict.steps.map((line) => (
              <li key={line.step} className="flex items-baseline gap-2 border-b-hair border-ink/25 py-1.5">
                <span
                  className={`w-4 shrink-0 font-poster text-[16px] leading-none ${
                    line.grade === 'hit'
                      ? 'text-red'
                      : line.grade === 'near'
                        ? 'text-sign'
                        : 'text-muted'
                  }`}
                >
                  {line.grade === 'hit' ? '✓' : line.grade === 'near' ? '≈' : '✕'}
                </span>
                <span className="min-w-0 flex-1 font-body text-[12px] leading-snug text-ink">
                  {line.noteHe}
                  <span className="block font-mono text-[10.5px] text-muted" dir="ltr">
                    {line.picked ?? '—'} → {line.truth}
                  </span>
                </span>
                <span className="shrink-0 font-body text-[10.5px] text-muted">
                  {t(line.reasonKey as MessageKey)}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 font-mono text-[10.5px] text-muted">
            <bdi>{verdict.sourceTitle}</bdi>
          </p>
        </div>
      )}

      <p className="mt-2 font-body text-[11px] leading-snug text-muted">{t('goal.approximate')}</p>
    </div>
  )
}

/** הפסק — what the run came to, and the link that hands over the identical three goals. */
function Result({ run, seed }: { run: Run; seed: number }) {
  const rank = rankFor(run.score) as MessageKey
  const accuracy = run.touches > 0 ? Math.round((run.hits / run.touches) * 100) : 0

  return (
    <div className="mt-stack">
      <Punch />
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
            <Num>{`${run.hits}/${run.touches}`}</Num>
          </p>
          <p className="mt-1 font-body text-[10px] tracking-widest text-muted">{t('goal.hits')}</p>
          <p className="mt-2 font-body text-[11.5px] leading-snug text-muted">
            {t('goal.nears', { n: String(run.nears) })}
          </p>
          <p className="mt-1 font-body text-[11.5px] leading-snug text-muted">
            {t('run.best')}: <Num>{run.bestCombo}</Num>
          </p>
        </div>
      </div>

      <ShareRow
        kind="goal"
        params={{ h: String(run.hits), s: String(seed) }}
        headline={t('goal.shareHead', { hits: String(run.hits), total: String(run.touches) })}
        card={{
          template: 'grass' as const,
          kicker: 'GATE 8 · REBUILD THE GOAL',
          label: t('screen.goal.title'),
          eyebrow: t('goal.hits'),
          hero: `${run.hits}/${run.touches}`,
          bigStat: { v: `${accuracy}%`, k: t('goal.accuracy') },
          stats: [
            { k: t('run.score'), v: String(run.score) },
            { k: t('run.best'), v: String(run.bestCombo) },
          ],
          cta: t('goal.cta'),
          challenge: t('share.sameRound'),
        }}
      />

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a
          href={`/goal?seed=${seed + 1}`}
          className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink"
        >
          {t('run.again')}
        </a>
        <a
          href="/"
          className="flex min-h-tap items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper"
        >
          {t('nav.gates')}
        </a>
      </div>
    </div>
  )
}
