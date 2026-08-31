import Link from 'next/link'

import { BannerCloth } from '@/components/ui/BannerCloth'
import { LampGrid } from '@/components/ui/LampGrid'
import { PastedSheet } from '@/components/ui/PastedSheet'
import { Screen } from '@/components/ui/Screen'
import { Stamp } from '@/components/ui/Stamp'
import { ROUND_LENGTH } from '@/lib/game/trivia'
import { t } from '@/lib/i18n'

/** Screen 4 — the round summary. One big number, one grid, one insight. */
export default function SummaryPage({
  searchParams,
}: {
  searchParams: { score?: string; total?: string; seed?: string }
}) {
  const total = Number(searchParams.total) || ROUND_LENGTH
  const score = Math.min(Number(searchParams.score) || 0, total)
  const seed = Number(searchParams.seed) || 1

  return (
    <Screen title={t('screen.summary.title')} sub={t('screen.summary.sub')}>
      <div className="mt-stack flex items-end gap-4">
        <span className="font-display text-step-5 leading-none tabular-nums text-ink">{score}</span>
        <span className="pb-2 font-mono text-step-2 tabular-nums text-muted">/{total}</span>
      </div>

      <div className="mt-stack max-w-[240px]">
        <LampGrid total={total} on={score} cols={5} stagger label={`${score} / ${total}`} />
      </div>

      <div className="relative mt-stack">
        <PastedSheet id={`summary-${seed}`} animate kicker={t('screen.summary.title')} serial={`TIK-${String(seed).padStart(4, '0')}`}>
          <p className="mt-2 font-display text-step-2 leading-tight text-ink">
            {score >= total * 0.7 ? t('summary.good') : t('summary.thin')}
          </p>
          <p className="mt-2 font-body text-step-0 text-muted">{t('summary.note')}</p>
        </PastedSheet>
        <div className="pointer-events-none absolute -top-3 start-2">
          <Stamp size={64} />
        </div>
      </div>

      <div className="mt-stack">
        <BannerCloth>{t('slogan.remember')}</BannerCloth>
      </div>

      <div className="mt-stack flex flex-col gap-3 md:flex-row">
        <Link
          href={`/trivia?seed=${seed + 1}&i=0&score=0`}
          className="flex min-h-tap flex-1 items-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet"
        >
          {t('summary.again')}
        </Link>
        <Link
          href="/lineup"
          className="flex min-h-tap flex-1 items-center bg-ink px-4 font-body text-step-1 font-extrabold text-sheet"
        >
          {t('summary.lineup')}
        </Link>
      </div>
    </Screen>
  )
}
