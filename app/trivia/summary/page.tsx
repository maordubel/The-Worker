import Link from 'next/link'

import { BannerCloth } from '@/components/ui/BannerCloth'
import { LampGrid } from '@/components/ui/LampGrid'
import { Num } from '@/components/ui/Num'
import { Screen } from '@/components/ui/Screen'
import { EMPTY_RUN, decodeRun, rankFor } from '@/lib/game/score'
import { ROUND_LENGTH } from '@/lib/game/trivia'
import { t, type MessageKey } from '@/lib/i18n'
import { ShareCard } from './ShareCard'

/**
 * Screen 4 — the end of a run.
 *
 * The old summary was a number out of ten. This one is the thing the round was for: a
 * rank, a best streak, and a card built to be posted. The whole result lives in the
 * `r` parameter, so the URL IS the result — a friend who opens it plays the same ten
 * questions and can compare like for like.
 */
export default function SummaryPage({
  searchParams,
}: {
  searchParams: { r?: string; seed?: string }
}) {
  const decoded = decodeRun(searchParams.r ?? '')
  const seed = decoded?.seed ?? Number(searchParams.seed) ?? 1
  const run = decoded?.run ?? EMPTY_RUN
  const perfect = decoded?.perfect ?? 0
  const rank = rankFor(run.lamps, perfect)
  const rankHe = t(rank.key as MessageKey)

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'the-worker.vercel.app'
  const url = `${base}/trivia?seed=${seed}`

  return (
    <Screen title={t('screen.summary.title')} sub={t('screen.summary.sub')}>
      <div className="mt-stack flex items-end justify-between gap-4">
        <div>
          <p className="font-body text-[11px] tracking-widest text-muted">{t('score.lamps')}</p>
          <p className="font-poster text-step-5 leading-none text-red">
            <Num>{run.lamps}</Num>
          </p>
          <p className="font-body text-step--1 text-muted">
            {t('score.perfect')} <Num>{perfect}</Num>
          </p>
        </div>
        <div className="text-end">
          <p className="font-body text-[11px] tracking-widest text-muted">{t('rank.label')}</p>
          <p className="font-display text-step-3 font-black leading-tight text-ink">{rankHe}</p>
          <p className="font-body text-step--1 text-muted">
            {t('score.best')} <Num>{run.bestStreak}</Num>
          </p>
        </div>
      </div>

      <div className="mt-stack max-w-[260px]">
        <LampGrid
          total={ROUND_LENGTH}
          on={run.correct}
          cols={5}
          stagger
          label={`${run.correct} / ${ROUND_LENGTH}`}
        />
      </div>

      <h2 className="mt-stack font-body text-[11px] font-extrabold tracking-widest text-muted">
        {t('share.title')}
      </h2>

      <ShareCard
        data={{
          lamps: run.lamps,
          perfect,
          correct: run.correct,
          answered: run.answered,
          bestStreak: run.bestStreak,
          rankHe,
          seed,
          url,
          headlineHe: t('summary.correctOf'),
          kickerHe: t('brand.name'),
          ctaHe: t('share.challenge'),
          labels: {
            lamps: t('score.lamps'),
            streak: t('score.best'),
            of: t('score.perfect'),
            rank: t('summary.share.pct'),
          },
        }}
      />

      <div className="mt-stack">
        <BannerCloth>{t('slogan.remember')}</BannerCloth>
      </div>

      <div className="mt-stack flex flex-col gap-3 md:flex-row">
        <Link
          href={`/trivia?seed=${seed + 1}&i=0`}
          className="flex min-h-tap flex-1 items-center justify-center bg-ink px-4 font-body text-step-1 font-extrabold text-sheet"
        >
          {t('summary.again')}
        </Link>
        <Link
          href="/kits"
          className="flex min-h-tap flex-1 items-center justify-center border-rule border-ink px-4 font-body text-step-1 font-extrabold text-ink"
        >
          {t('summary.kits')}
        </Link>
      </div>
    </Screen>
  )
}
