'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { AdSlot } from '@/components/ads/AdSlot'
import { Punch } from '@/components/play/Punch'
import { RecordRun } from '@/components/play/RecordRun'
import { ShareRow } from '@/components/share/ShareRow'
import { Num } from '@/components/ui/Num'
import { Q_TYPES } from '@/lib/game/questions/types'
import { LIVES, RUN_LENGTH, type Session } from '@/lib/game/session'
import { nextChallenges, reportOf, tierFor, type AnswerLog } from '@/lib/game/trivia-report'
import type { Topic } from '@/lib/game/topics'
import { pendingRevenge, readMarks } from '@/lib/profile/marks'
import { pushMarks } from '@/lib/portal/marks-sync'
import { artFor } from '@/lib/share/story'
import { t, type MessageKey } from '@/lib/i18n'
import type { RunMode } from './TriviaRun'

/**
 * דוח משחק — Quick Pick's Match Report.
 *
 * The headline says how the night went in the terrace's words; under it the four figures
 * (score, x/12, best combo, lamps left), the six types one by one, and the four lines a
 * supporter actually repeats: the best streak, the hardest question cracked, the sharpest
 * topic, and how many questions are now waiting for revenge. Then two suggestions, the
 * same twelve again IN PLACE, and the way back to the lobby.
 *
 * The share link is the run: a seeded run shares `?seed=&r=` on its own route; a
 * personal run (Revenge, Surprise) shares its twelve ids as `?q=`, because the message
 * promises "אותן שאלות בדיוק" and a seed alone could not keep that promise.
 */
export function MatchReport({
  session,
  log,
  seed,
  cursor,
  topic,
  era,
  hard,
  practice,
  mode,
  personal,
  ids,
  revengeCount,
  onAgain,
}: {
  session: Session
  log: AnswerLog[]
  seed: number
  cursor: number
  topic: Topic
  era: number | null
  hard: boolean
  practice: boolean
  mode: RunMode
  personal: boolean
  ids: string[]
  revengeCount: number | null
  onAgain: () => void
}) {
  const [pending, setPending] = useState(0)
  useEffect(() => {
    const marks = readMarks()
    setPending(pendingRevenge(marks).length)
    // this run's answers up to the account, when there is one — silent otherwise
    const mine = Object.fromEntries(log.map((entry) => [entry.id, marks[entry.id]]).filter(([, mark]) => mark))
    const topics = new Map(log.map((entry) => [entry.id, entry.topic]))
    void pushMarks(mine, (id) => topics.get(id) ?? null)
  }, [log])

  const asked = log.length
  const tier = tierFor(session.correct, RUN_LENGTH, session.lives)
  const report = reportOf(log)
  const share = asked > 0 ? session.correct / RUN_LENGTH : 0
  const suggestions = nextChallenges({ pending, share, mode, hard })

  // the link that hands over THIS run
  const query = new URLSearchParams()
  if (personal) query.set('q', ids.join('.'))
  if (era !== null) query.set('era', String(era))
  if (hard) query.set('hard', '1')
  const route = `/trivia/${personal ? 'general' : topic}${query.toString() ? `?${query.toString()}` : ''}`

  const strongest = report.strongest ? t(`trivia.lobby.topic.${report.strongest}` as MessageKey) : '—'

  return (
    <div className="mt-stack animate-slam">
      <Punch />
      {!practice && <RecordRun gate="/trivia" score={session.score} correct={session.correct} asked={RUN_LENGTH} />}

      <div className="border-rule border-ink bg-ink p-5 text-center text-paper">
        <p className="font-latin text-[10px] font-bold tracking-[0.28em] text-red" dir="ltr">
          FULL TIME · GATE 2{practice ? ' · PRACTICE' : ''}
        </p>
        <h2 className="mt-2 font-display text-step-4 leading-tight">{t(`trivia.report.tier.${tier}` as MessageKey)}</h2>
        <p className="mx-auto mt-2 max-w-[36ch] font-body text-step--1 leading-relaxed text-concrete">
          {t(`trivia.report.strap.${tier}` as MessageKey, {
            n: String(session.correct),
            combo: String(session.bestCombo),
          })}
        </p>
        {revengeCount !== null && (
          <p className="mt-2 font-body text-[12px] text-concrete">
            {t('trivia.report.revengeRun', { n: String(revengeCount), m: String(Math.max(0, RUN_LENGTH - revengeCount)) })}
          </p>
        )}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        <Tile label={t('run.score')} value={practice ? '—' : String(session.score)} />
        <Tile label={t('run.right')} value={`${session.correct}/${RUN_LENGTH}`} />
        <Tile label={t('trivia.report.combo')} value={`×${session.bestCombo}`} />
        <Tile label={t('trivia.report.lamps')} value={`${Math.max(0, session.lives)}/${LIVES}`} />
      </div>

      <ul className="mt-2 grid grid-cols-2 gap-1.5 min-[480px]:grid-cols-3">
        {Q_TYPES.map((type) => {
          const row = report.byType.find((entry) => entry.type === type)
          return (
            <li key={type} className="flex items-baseline justify-between gap-2 border-rule border-ink/40 bg-sheet px-2.5 py-2">
              <span className="font-body text-[12px] font-bold text-ink">{t(`trivia.type.${type}` as MessageKey)}</span>
              <span className="font-mono text-[12px] tabular-nums text-muted">
                <Num>{row ? `${row.right}/${row.asked}` : '—'}</Num>
              </span>
            </li>
          )
        })}
      </ul>

      <dl className="mt-2 border-rule border-ink bg-sheet px-3 py-1">
        <Line k={t('trivia.report.streak')} v={String(report.bestStreak)} />
        <Line k={t('trivia.report.hardest')} v={report.hardest ? t('trivia.pill.difficulty', { d: String(report.hardest) }) : t('trivia.report.none')} />
        <Line k={t('trivia.report.topic')} v={strongest} />
        <Line k={t('trivia.report.revenge')} v={String(pending)} />
      </dl>

      {suggestions.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {suggestions.map((kind) => (
            <Link
              key={kind}
              href={kind === 'hard' ? '/trivia?pick=hard' : kind === 'mix' ? '/trivia' : `/trivia?pick=${kind}`}
              className="flex min-h-[64px] flex-col justify-center border-rule border-ink bg-paper px-3 py-2"
            >
              <span className="font-display text-step-1 leading-tight text-ink">{t(`trivia.next.${kind}` as MessageKey)}</span>
              <span className="font-body text-[12px] text-muted">
                {t(`trivia.next.${kind}.sub` as MessageKey, { n: String(pending) })}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onAgain}
          className="flex min-h-tap items-center justify-center bg-red px-3 font-body text-step-0 font-extrabold text-paper transition-transform duration-press active:scale-[.97] motion-reduce:transition-none"
        >
          {t('trivia.report.again')}
        </button>
        <Link
          href="/trivia"
          className="flex min-h-tap items-center justify-center border-rule border-ink bg-ink px-3 font-body text-step-0 font-extrabold text-paper"
        >
          {t('trivia.report.lobby')}
        </Link>
      </div>

      {!practice && (
        <ShareRow
          kind="trivia"
          params={{ s: String(seed), r: personal ? '0' : String(cursor), total: String(RUN_LENGTH) }}
          route={route}
          headline={String(session.correct)}
          card={{
            template: 'score' as const,
            art: artFor('trivia', session.correct / RUN_LENGTH),
            kicker: 'GATE 2 · QUICK PICK',
            label: t('screen.trivia.title'),
            eyebrow: t('run.score'),
            hero: String(session.score),
            bigStat: { v: `${session.correct}/${RUN_LENGTH}`, k: t('run.right') },
            stats: [
              { k: t('trivia.report.combo'), v: `×${session.bestCombo}` },
              { k: t('trivia.report.topic'), v: strongest },
            ],
            cta: t('share.challenge'),
            challenge: t('share.sameRound'),
            marks: session.history,
          }}
        />
      )}

      <p className="mt-2 text-center font-mono text-[11px] tabular-nums text-muted">
        <bdi dir="ltr">
          seed {seed}
          {cursor > 0 && !personal ? `·${cursor}` : ''}
          {personal ? ' · q' : ''}
        </bdi>
      </p>

      <AdSlot placement="result" />
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-rule border-ink bg-sheet px-1.5 py-2.5 text-center">
      <p className="font-poster text-[24px] leading-none text-ink">
        <Num>{value}</Num>
      </p>
      <p className="mt-1 font-body text-[11px] leading-tight text-muted">{label}</p>
    </div>
  )
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b-hair border-ink/20 py-2 last:border-b-0">
      <dt className="font-body text-step--1 text-ink">{k}</dt>
      <dd className="font-display text-step-1 leading-none text-ink">
        <Num>{v}</Num>
      </dd>
    </div>
  )
}
