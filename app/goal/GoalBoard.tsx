'use client'

import { useRef, useState, useTransition } from 'react'

import { Num } from '@/components/ui/Num'
import { Stamp } from '@/components/ui/Stamp'
import { t, type MessageKey } from '@/lib/i18n'
import type { GoalChallenge, GoalVerdict } from '@/lib/game/goal'
import { submitPath } from './actions'

/**
 * Tap the pitch to say where the ball went next. One tap per step, then submit.
 *
 * The pitch is an SVG in a fixed viewBox, so a tap maps to a percentage coordinate
 * identically at every screen size, and the whole board is direction-agnostic — no
 * left/right anywhere.
 */

const ACTION_LABEL: Record<string, MessageKey> = {
  pass: 'goal.action.pass',
  cross: 'goal.action.cross',
  dribble: 'goal.action.dribble',
  shot: 'goal.action.shot',
}

type Point = { x: number; y: number }

export function GoalBoard({ challenge, seed }: { challenge: GoalChallenge; seed: number }) {
  const [placed, setPlaced] = useState<Point[]>([])
  const [verdict, setVerdict] = useState<GoalVerdict | null>(null)
  const [pending, startTransition] = useTransition()
  const surface = useRef<SVGSVGElement>(null)

  const index = placed.length
  const step = challenge.steps[index] ?? null
  const done = index >= challenge.steps.length

  function place(event: React.MouseEvent<SVGSVGElement>) {
    if (done || verdict) return
    const box = surface.current?.getBoundingClientRect()
    if (!box) return
    const x = ((event.clientX - box.left) / box.width) * 100
    const y = ((event.clientY - box.top) / box.height) * 100
    setPlaced((current) => [...current, { x: Math.round(x), y: Math.round(y) }])
  }

  function submit() {
    startTransition(async () => setVerdict(await submitPath(seed, placed)))
  }

  return (
    <>
      <p className="mt-stack font-body text-step-0 text-muted">
        {verdict ? verdict.narrativeHe : t('goal.instruction')}
      </p>

      {!verdict && step && (
        <p className="mt-2 border-rule border-ink bg-sheet p-3 font-sign text-step-1 leading-tight text-ink">
          <Num className="me-2 font-mono text-red">{step.step}</Num>
          {step.actorHe} — {t(ACTION_LABEL[step.action] as MessageKey)}
          {step.targetHe ? ` ← ${step.targetHe}` : ''}
        </p>
      )}

      <div className="mt-3 border-plate border-ink bg-sheet">
        <svg
          ref={surface}
          viewBox="0 0 100 133"
          onClick={place}
          role="application"
          aria-label={t('goal.pitchAria')}
          className="block w-full touch-manipulation"
        >
          <g fill="none" stroke="rgb(var(--ink) / 0.4)" strokeWidth="0.4">
            <line x1="0" y1="66.5" x2="100" y2="66.5" />
            <circle cx="50" cy="66.5" r="14" />
            <rect x="22" y="0" width="56" height="21" />
            <rect x="34" y="0" width="32" height="9" />
            <rect x="22" y="112" width="56" height="21" />
          </g>

          {/* the real path, revealed only after grading */}
          {verdict && (
            <g>
              <polyline
                points={verdict.steps.map((s) => `${s.actual.x},${s.actual.y}`).join(' ')}
                fill="none"
                stroke="rgb(var(--red))"
                strokeWidth="1"
                strokeDasharray="2 1.5"
              />
              {verdict.steps.map((s) => (
                <circle key={s.step} cx={s.actual.x} cy={s.actual.y} r="2.2" fill="rgb(var(--red))" />
              ))}
            </g>
          )}

          {/* where the ball starts each step */}
          {challenge.steps.slice(0, index + 1).map((s) => (
            <circle
              key={`from-${s.step}`}
              cx={s.from.x}
              cy={s.from.y}
              r="1.6"
              fill="rgb(var(--ink))"
            />
          ))}

          {/* the player's own placements */}
          {placed.map((point, position) => (
            <g key={`placed-${position}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="2.4"
                fill="none"
                stroke="rgb(var(--ink))"
                strokeWidth="0.9"
              />
              <text
                x={point.x}
                y={point.y + 1.2}
                textAnchor="middle"
                className="font-mono tabular-nums"
                style={{ fontSize: 3, fill: 'rgb(var(--ink))' }}
              >
                {position + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="mt-2 font-mono text-[11px] text-sign">
        <Num>
          {placed.length}/{challenge.steps.length}
        </Num>{' '}
        · <bdi>{t('goal.approximate')}</bdi>
      </p>

      {!verdict && (
        <div className="mt-stack flex gap-3">
          <button
            type="button"
            onClick={() => setPlaced((current) => current.slice(0, -1))}
            disabled={placed.length === 0}
            className="flex min-h-tap flex-1 items-center justify-center border-rule border-ink px-4 font-body text-step-1 font-extrabold text-ink transition-transform duration-press ease-stamp active:scale-[.96] disabled:opacity-40 motion-reduce:transition-none"
          >
            {t('goal.undo')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!done || pending}
            className="flex min-h-tap flex-[2] items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] disabled:opacity-40 motion-reduce:transition-none"
          >
            {pending ? t('state.loading') : t('goal.submit')}
          </button>
        </div>
      )}

      {verdict && (
        <>
          <div className="mt-stack flex items-center gap-3">
            <Stamp
              label={verdict.hits === verdict.total ? 'verified' : 'rejected'}
              ring={false}
              size={56}
              animate
            />
            <p className="font-display text-step-3 text-ink">
              <Num>
                {verdict.hits}/{verdict.total}
              </Num>{' '}
              {t('goal.hits')}
            </p>
          </div>
          <ol className="mt-stack border-t-rule border-ink">
            {verdict.steps.map((s) => (
              <li key={s.step} className="border-b-hair border-ink/30 py-3">
                <p className="font-sign text-step-1 leading-tight text-ink">
                  <Num className="me-2 font-mono text-red">{s.step}</Num>
                  {s.noteHe}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {s.hit ? t('goal.hit') : t('goal.miss')} · <Num>{s.distance}</Num>
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  )
}
