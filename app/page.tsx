import Link from 'next/link'

import { BannerCloth } from '@/components/ui/BannerCloth'
import { LampGrid, Mast } from '@/components/ui/LampGrid'
import { Num } from '@/components/ui/Num'
import { PastedSheet } from '@/components/ui/PastedSheet'
import { Screen } from '@/components/ui/Screen'
import { Stamp } from '@/components/ui/Stamp'
import { t, type MessageKey } from '@/lib/i18n'

/** Screen 1 — הקיר. Mode plates → streak → sheet stack → cloth. */

const MODES: Array<{ serial: string; href: string; title: MessageKey; sub: MessageKey }> = [
  { serial: '01', href: '/trivia?seed=3&i=0&score=0', title: 'mode.trivia', sub: 'mode.trivia.sub' },
  { serial: '02', href: '/lineup', title: 'mode.lineup', sub: 'mode.lineup.sub' },
  { serial: '03', href: '/memory?seed=7', title: 'mode.memory', sub: 'mode.memory.sub' },
  { serial: '04', href: '/kits', title: 'mode.kits', sub: 'mode.kits.sub' },
  { serial: '05', href: '/timeline?seed=4', title: 'mode.timeline', sub: 'mode.timeline.sub' },
  { serial: '06', href: '/goal?seed=1', title: 'mode.goal', sub: 'mode.goal.sub' },
]

const STREAK_ON = 13
const STREAK_TOTAL = 20

export default function WallPage() {
  return (
    <Screen title={t('screen.home.title')} sub={t('screen.home.sub')}>
      <div className="pointer-events-none -mt-14 flex justify-end pe-1">
        <Stamp size={56} />
      </div>

      <p className="mt-stack max-w-prose font-body text-step-0 text-muted">{t('build.status')}</p>

      <section aria-label={t('tab.game')} className="mt-stack">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {MODES.map((mode) => (
            <li key={mode.serial}>
              <Link
                href={mode.href}
                className="flex min-h-[92px] flex-col justify-between border-rule border-ink bg-sheet p-3 transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
              >
                <Num className="font-mono text-[11px] text-red">{mode.serial}</Num>
                <span className="mt-3 font-sign text-step-1 leading-tight text-ink">
                  {t(mode.title)}
                </span>
                <span className="mt-1 font-body text-[11px] leading-relaxed text-sign">
                  {t(mode.sub)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={t('streak.label')} className="mt-stack flex items-end gap-4">
        <div className="w-16 shrink-0">
          <LampGrid total={20} on={STREAK_ON} cols={5} tilt />
          <Mast height={44} />
        </div>
        <div className="flex-1">
          <h2 className="font-body text-[11px] font-extrabold tracking-widest text-muted">
            {t('streak.label')}
          </h2>
          <div className="mt-2 max-w-[340px]">
            <LampGrid
              total={STREAK_TOTAL}
              on={STREAK_ON}
              cols={STREAK_TOTAL}
              label={`${STREAK_ON} / ${STREAK_TOTAL}`}
            />
          </div>
          <p className="mt-2 font-mono text-step--1 text-ink">
            <Num>
              {STREAK_ON} / {STREAK_TOTAL}
            </Num>{' '}
            {t('wall.streak.of')}
          </p>
        </div>
      </section>

      <section aria-label={t('wall.sheet.today')} className="relative mt-stack pb-6">
        <PastedSheet
          id="committee-2026-08-31"
          stacked
          depth={2}
          tone="red"
          kicker={t('wall.sheet.committee')}
          serial="TIK-0003"
        >
          <p className="mt-2 font-sign text-step-1 leading-tight">{t('slogan.collective')}</p>
        </PastedSheet>

        <PastedSheet
          id="sheet-yesterday-0417"
          stacked
          depth={1}
          kicker={t('wall.sheet.yesterday')}
          serial="TIK-0417"
        >
          <p className="mt-2 font-display text-step-2 leading-tight">{t('slogan.source')}</p>
        </PastedSheet>

        <PastedSheet
          id="sheet-today-0418"
          depth={0}
          animate
          kicker={`${t('wall.sheet.today')} · 31.08`}
          serial="TIK-0418"
        >
          {/* Placeholder copy until the wall reads from the archive. The fact is real
              and sourced: docs/04-verified-research.md */}
          <h2 className="mt-2 font-display text-step-3 leading-tight text-ink">
            {t('wall.sheet.milan.title')}
          </h2>
          <p className="mt-2 font-body text-step-0 text-muted">{t('wall.sheet.milan.body')}</p>
          <p className="mt-3 font-mono text-[11px] text-sign">
            <bdi>{t('wall.sheet.milan.source')}</bdi>
          </p>
        </PastedSheet>
      </section>

      <Link
        href="/trivia?seed=3&i=0&score=0"
        className="mt-stack flex min-h-tap w-full items-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
      >
        {t('wall.paste')}
      </Link>

      <div className="mt-stack">
        <BannerCloth>{t('slogan.remember')}</BannerCloth>
      </div>
    </Screen>
  )
}
