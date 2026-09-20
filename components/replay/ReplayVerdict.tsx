'use client'

import { Num } from '@/components/ui/Num'
import { ACTION_SHORT, ActionGlyph } from './ReplayBuilder'
import type { ReplayMetrics, TouchVerdict } from '@/lib/game/replay/judge'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * החשיפה — what the score was, and why it was that.
 *
 * "63%" on its own is a number somebody made up as far as the player can tell. So the
 * reveal prints the five things the judge actually weighed, and then one line per touch
 * saying which of them that touch got: the man, the verb, the place he stood, the place
 * he sent it, the shape of the route. A touch the player invented and a touch they missed
 * each get their own row too, named as what they are — because "you were one touch long"
 * is a different sentence from "you had it wrong", and the old verdict could say neither.
 *
 * Under every matched row sits the reporter's own words. That is the part that makes this
 * a history game rather than a scoring screen: the envelope on the pitch is a shape, and
 * this is the sentence the shape was read from.
 */

const METRICS: Array<{ key: keyof ReplayMetrics; label: MessageKey }> = [
  { key: 'sequence', label: 'goal.metric.sequence' },
  { key: 'players', label: 'goal.metric.players' },
  { key: 'actions', label: 'goal.metric.actions' },
  { key: 'routes', label: 'goal.metric.routes' },
  { key: 'continuity', label: 'goal.metric.continuity' },
]

function mark(verdict: TouchVerdict): string {
  if (verdict.kind === 'missing') return '✕'
  if (verdict.kind === 'extra') return '+'
  return verdict.grade === 'good' ? '✓' : verdict.grade === 'near' ? '≈' : '✕'
}

export function ReplayVerdict({
  metrics,
  touches,
  narrativeHe,
  sourceTitle,
}: {
  metrics: ReplayMetrics
  touches: TouchVerdict[]
  narrativeHe: string
  sourceTitle: string
}) {
  return (
    <div data-goal="verdict" className="mt-2.5 border-rule border-ink bg-sheet p-3">
      <div className="flex items-baseline justify-between gap-2 border-b-hair border-ink/25 pb-2">
        <p className="font-body text-[10px] font-extrabold tracking-widest text-muted">
          {t('goal.overall')}
        </p>
        <p className="font-poster text-[38px] leading-none text-red">
          <Num>{`${metrics.overall}%`}</Num>
        </p>
      </div>

      <ul className="mt-2 grid grid-cols-5 gap-1">
        {METRICS.map(({ key, label }) => {
          const value = metrics[key]
          return (
            <li key={key} className="border-hair border-ink/30 px-1 py-1.5 text-center">
              <p className="font-poster text-[15px] leading-none text-ink">
                {value === null ? (
                  t('goal.metric.none')
                ) : (
                  <Num>{`${value as number}%`}</Num>
                )}
              </p>
              <p className="mt-0.5 font-body text-[8.5px] leading-none text-muted">{t(label)}</p>
            </li>
          )
        })}
      </ul>

      <ol className="mt-2.5 border-t-hair border-ink/25">
        {touches.map((verdict, index) => (
          <li key={index} className="flex items-baseline gap-2 border-b-hair border-ink/25 py-1.5">
            <span
              className={`w-4 shrink-0 font-poster text-[16px] leading-none ${
                verdict.kind === 'matched' && verdict.grade === 'good'
                  ? 'text-red'
                  : verdict.kind === 'missing'
                    ? 'text-muted'
                    : 'text-sign'
              }`}
            >
              {mark(verdict)}
            </span>
            <span className="min-w-0 flex-1">
              {verdict.kind === 'extra' ? (
                <span className="font-body text-[12px] font-extrabold leading-snug text-ink">
                  {t('goal.verdict.extra')} — <bdi>{verdict.userActorHe}</bdi>
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 font-body text-[12px] font-extrabold leading-snug text-ink">
                    {verdict.truthAction && (
                      <span className="shrink-0">
                        <ActionGlyph action={verdict.truthAction} />
                      </span>
                    )}
                    <bdi>{verdict.truthActorHe}</bdi>
                    <span className="font-body text-[10.5px] font-normal text-muted">
                      {verdict.truthAction ? t(ACTION_SHORT[verdict.truthAction]) : ''}
                    </span>
                  </span>
                  {verdict.kind === 'missing' ? (
                    <span className="block font-body text-[10.5px] leading-snug text-muted">
                      {t('goal.verdict.missing')}
                    </span>
                  ) : (
                    <span className="block font-body text-[10.5px] leading-snug text-muted">
                      {t('goal.verdict.player')} {verdict.playerRight ? '✓' : '✕'} ·{' '}
                      {t('goal.verdict.action')} {verdict.actionRight ? '✓' : '✕'} ·{' '}
                      {t('goal.verdict.origin')}{' '}
                      <Num>{Math.round(verdict.originScore)}</Num> ·{' '}
                      {t('goal.verdict.target')} <Num>{Math.round(verdict.targetScore)}</Num>
                      {verdict.routeScore !== null && (
                        <>
                          {' · '}
                          {t('goal.verdict.route')}{' '}
                          <Num>{Math.round(verdict.routeScore)}</Num>
                        </>
                      )}
                    </span>
                  )}
                  {verdict.positionHe && (
                    <span className="block font-mono text-[10px] leading-snug text-muted">
                      <bdi>
                        {t('goal.sourceWords')} {verdict.positionHe} — {verdict.noteHe}
                      </bdi>
                    </span>
                  )}
                </>
              )}
            </span>
            {verdict.kind === 'matched' && (
              <span className="shrink-0 font-poster text-[14px] leading-none text-muted">
                <Num>{`${Math.round(verdict.score)}%`}</Num>
              </span>
            )}
          </li>
        ))}
      </ol>

      <p className="mt-2 font-body text-step--1 leading-relaxed text-ink">{narrativeHe}</p>
      <p className="mt-1.5 font-body text-[10.5px] leading-snug text-muted">
        {t('goal.envelopeNote')}
      </p>
      <p className="mt-1 font-mono text-[10.5px] tabular-nums text-muted">
        <bdi>{sourceTitle}</bdi>
      </p>
    </div>
  )
}
