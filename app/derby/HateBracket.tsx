'use client'

import { useMemo, useState } from 'react'

import { EnemyPlate } from '@/components/hate/EnemyPlate'
import { Num } from '@/components/ui/Num'
import { ShareRow } from '@/components/share/ShareRow'
import {
  DUEL_COUNT,
  type Duel,
  type Enemy,
  judgeRun,
  nextRound,
  standingKey,
} from '@/lib/game/hate-run'
import { t, type MessageKey } from '@/lib/i18n'

type Pick = { aSlug: string; bSlug: string; winner: string }

/**
 * משחק השנאה — a straight knockout of eight.
 *
 * Seven taps, and the seventh is the one that matters. There is no scoring and no
 * grading, because a feeling cannot be marked wrong; what comes back is a verdict — the
 * bill of the one you carried to the end, and how far your bracket ran with the house
 * terrace's.
 *
 * The loser of each duel is stamped נפסל for a beat before the next pair prints. That
 * beat is not decoration: it is the only moment the player sees their own decision
 * take effect, and without it a knockout feels like a form.
 */
export function HateBracket({
  enemies,
  opening,
  seed,
  rosterSize,
}: {
  enemies: Enemy[]
  opening: Duel[]
  seed: number
  rosterSize: number
}) {
  const [picks, setPicks] = useState<Pick[]>([])
  const [stamped, setStamped] = useState<{ won: string; out: string } | null>(null)

  const bySlug = useMemo(() => new Map(enemies.map((enemy) => [enemy.slug, enemy])), [enemies])

  // The whole bracket is a pure function of the picks so far — no bracket state to
  // drift out of sync with the picks that produced it.
  const rounds = useMemo(() => {
    const all: Duel[][] = [opening]
    for (const round of [1, 2] as const) {
      const previous = all[round - 1]
      if (!previous) break
      const winners = previous
        .map((duel) => picks.find((pick) => pick.aSlug === duel.aSlug && pick.bSlug === duel.bSlug))
        .filter((pick): pick is Pick => pick !== undefined)
        .map((pick) => pick.winner)
      if (winners.length !== previous.length) break
      all.push(nextRound(winners, round))
    }
    return all
  }, [opening, picks])

  const flat = rounds.flat()
  const current = flat[picks.length]
  const verdict = picks.length === DUEL_COUNT ? judgeRun(enemies, picks) : null

  function choose(duel: Duel, winner: string) {
    if (stamped) return
    const out = winner === duel.aSlug ? duel.bSlug : duel.aSlug
    setStamped({ won: winner, out })
    window.setTimeout(() => {
      setPicks((previous) => [...previous, { aSlug: duel.aSlug, bSlug: duel.bSlug, winner }])
      setStamped(null)
    }, 560)
  }

  if (verdict) return <Verdict verdict={verdict} seed={seed} rosterSize={rosterSize} />

  if (!current) return null
  const a = bySlug.get(current.aSlug)
  const b = bySlug.get(current.bSlug)
  if (!a || !b) return null
  const roundKey = `hate.round.${current.round}` as MessageKey

  return (
    <div className="mt-stack">
      <div className="flex items-end justify-between gap-3 border-b-rule border-ink pb-2">
        <div>
          <p className="font-latin text-[9px] font-bold tracking-[0.2em] text-red" dir="ltr">
            GATE 11 · KNOCKOUT
          </p>
          <p className="font-display text-step-1 leading-tight text-ink">{t(roundKey)}</p>
        </div>
        {/* seven pips, one per decision */}
        <ol className="flex items-center gap-1.5" aria-label={t('hate.duel')}>
          {Array.from({ length: DUEL_COUNT }, (_, index) => (
            <li
              key={index}
              className={`h-2.5 w-2.5 border-hair border-ink ${
                index < picks.length ? 'bg-red' : 'bg-transparent'
              }`}
            />
          ))}
        </ol>
      </div>

      <p className="mt-stack font-display text-step-2 leading-tight text-ink">{t('hate.pick')}</p>

      <div className="mt-3 grid gap-2.5">
        <EnemyPlate
          enemy={a}
          state={stamped ? (stamped.won === a.slug ? 'won' : 'out') : 'live'}
          onPick={() => choose(current, a.slug)}
        />
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-ink/30" />
          <span className="font-poster text-[20px] leading-none text-red">×</span>
          <span className="h-px flex-1 bg-ink/30" />
        </div>
        <EnemyPlate
          enemy={b}
          state={stamped ? (stamped.won === b.slug ? 'won' : 'out') : 'live'}
          onPick={() => choose(current, b.slug)}
        />
      </div>

      <p className="mt-4 font-body text-[11px] text-muted">
        {t('hate.rosterNote', { count: String(rosterSize) })}
      </p>
    </div>
  )
}

/** הפסק — the verdict, printed as the bill of your number one. */
function Verdict({
  verdict,
  seed,
  rosterSize,
}: {
  verdict: NonNullable<ReturnType<typeof judgeRun>>
  seed: number
  rosterSize: number
}) {
  const standing = standingKey(verdict.agreement) as MessageKey

  return (
    <div className="mt-stack">
      <div className="border-b-rule border-ink pb-2">
        <p className="font-latin text-[9px] font-bold tracking-[0.2em] text-red" dir="ltr">
          THE VERDICT
        </p>
        <h2 className="font-display text-step-2 leading-tight text-ink">{t('hate.verdict')}</h2>
      </div>

      <p className="mt-stack font-body text-[11px] tracking-widest text-muted">
        {t('hate.champion')}
      </p>
      <div className="mt-2">
        <EnemyPlate enemy={verdict.champion} state="won" />
      </div>

      <div className="mt-2 border-rule border-ink bg-sheet p-4">
        <p className="font-body text-[10px] tracking-widest text-muted">{t('hate.record')}</p>
        <p className="mt-1 font-body text-step--1 leading-relaxed text-ink">
          {verdict.champion.detailHe}
        </p>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <div className="border-rule border-ink bg-ink p-4 text-center">
          <p className="font-poster text-[52px] leading-none text-red">
            <Num>{`${verdict.agreement}%`}</Num>
          </p>
          <p className="mt-1 font-body text-[10px] tracking-widest text-concrete">
            {t('hate.agreement')}
          </p>
          <p className="mt-2 font-display text-step-0 leading-tight text-paper">{t(standing)}</p>
        </div>
        <div className="border-rule border-ink bg-sheet p-4">
          <p className="font-body text-[10px] tracking-widest text-muted">{t('hate.terrace')}</p>
          <p className="mt-1 font-poster text-[28px] leading-[0.85] text-ink">
            {verdict.terraceChampion.nameHe}
          </p>
          <p className="mt-2 font-body text-[11px] leading-snug text-muted">
            {verdict.terraceChampion.keyFactHe}
          </p>
        </div>
      </div>

      <p className="mt-stack font-body text-[11px] tracking-widest text-muted">
        {t('hate.standings')}
      </p>
      <ol className="mt-2 border-t-hair border-ink/25">
        {verdict.standings.map((row, index) => (
          <li
            key={row.enemy.slug}
            className="flex items-baseline gap-2.5 border-b-hair border-ink/25 py-2"
          >
            <span className="w-5 shrink-0 font-poster text-[19px] leading-none text-red">
              <Num>{index + 1}</Num>
            </span>
            <span className="min-w-0 flex-1 font-body text-step-0 text-ink">
              {row.enemy.nameHe}
              <span className="block font-body text-[10.5px] leading-snug text-muted">
                {row.enemy.keyFactHe}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
              <Num>{row.wins}</Num>
            </span>
          </li>
        ))}
      </ol>

      <ShareRow
        kind="hate"
        params={{ a: String(verdict.agreement), s: String(seed) }}
        headline={verdict.champion.nameHe}
        card={{
          template: 'ink' as const,
          kicker: 'GATE 11 · THE HATRED GAME',
          label: t('screen.derby.title'),
          eyebrow: t('hate.champion'),
          hero: verdict.champion.nameHe,
          bigStat: { v: `${verdict.agreement}%`, k: t('hate.agreement') },
          stats: [
            { k: t('hate.charge'), v: verdict.champion.keyFactHe },
            { k: t('hate.terrace'), v: verdict.terraceChampion.nameHe },
          ],
          cta: t('hate.cta'),
          challenge: t('share.sameRound'),
        }}
      />

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a
          href={`/derby?seed=${seed + 1}`}
          className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink"
        >
          {t('hate.again')}
        </a>
        <a
          href={`/derby/file?seed=${seed}`}
          className="flex min-h-tap items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper"
        >
          {t('hate.blackfile')}
        </a>
      </div>

      <p className="mt-3 font-body text-[11px] text-muted">
        {t('hate.rosterNote', { count: String(rosterSize) })}
      </p>
    </div>
  )
}
