import Link from 'next/link'

import { BannerCloth } from '@/components/ui/BannerCloth'
import { LampGrid } from '@/components/ui/LampGrid'
import { Num } from '@/components/ui/Num'
import { Screen } from '@/components/ui/Screen'
import { EMPTY_RUN, decodeRun, rankFor } from '@/lib/game/score'
import { ROUND_LENGTH } from '@/lib/game/trivia'
import { t, type MessageKey } from '@/lib/i18n'
import { ShareRow } from '@/components/share/ShareRow'

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

      <ShareRow
        kind="trivia"
        params={{ s: String(seed), total: String(ROUND_LENGTH) }}
        headline={String(run.correct)}
        card={{
          kicker: 'GATE 2 · TRIVIA',
          label: t('screen.trivia.title'),
          eyebrow: t('summary.correctOf'),
          hero: `${run.correct}/${ROUND_LENGTH}`,
          bigStat: { v: String(run.lamps), k: t('score.lamps') },
          stats: [
            { k: t('rank.label'), v: rankHe },
            { k: t('score.best'), v: String(run.bestStreak) },
          ],
          cta: t('share.challenge'),
          challenge: t('share.sameRound'),
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
