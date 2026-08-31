import Link from 'next/link'

import { BannerCloth } from '@/components/ui/BannerCloth'
import { BuiltByDubel } from '@/components/ui/BuiltByDubel'
import { LampGrid, Mast } from '@/components/ui/LampGrid'
import { PastedSheet } from '@/components/ui/PastedSheet'
import { SignPlate } from '@/components/ui/SignPlate'
import { Stamp } from '@/components/ui/Stamp'
import { TabBar } from '@/components/ui/TabBar'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * Screen 1 — הקיר. SignPlate → mode plates → streak → sheet stack → cloth → tab bar.
 * The sheets carry verified archive facts, not placeholder copy: docs/04-verified-research.md
 */

const MODES: Array<{ serial: string; href: string; title: MessageKey; sub: MessageKey }> = [
  { serial: '01', href: '/trivia?seed=3&i=0&score=0', title: 'mode.trivia', sub: 'mode.trivia.sub' },
  { serial: '02', href: '/lineup', title: 'mode.lineup', sub: 'mode.lineup.sub' },
  { serial: '03', href: '/memory?seed=7', title: 'mode.memory', sub: 'mode.memory.sub' },
  { serial: '04', href: '/kits', title: 'mode.kits', sub: 'mode.kits.sub' },
  { serial: '05', href: '/timeline?seed=4', title: 'mode.timeline', sub: 'mode.timeline.sub' },
]

const STREAK_ON = 13
const STREAK_TOTAL = 20

export default function WallPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col border-x-rule border-ink">
      <main id="main" className="flex-1 px-gutter pb-10 pt-6 md:pt-10">
        {/* כותרת המסך + החותמת */}
        <header className="flex items-start justify-between gap-4">
          <SignPlate title={t('screen.home.title')} sub={t('screen.home.sub')} />
          <div className="shrink-0">
            <Stamp size={56} />
          </div>
        </header>

        <p className="mt-stack max-w-prose font-body text-step-0 text-muted">
          {t('build.status')}
        </p>

        {/* ארבע לוחיות מצב — 2×2 בנייד, ארבע בשורה בדסקטופ */}
        <section aria-label={t('tab.game')} className="mt-stack">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {MODES.map((mode) => (
              <li key={mode.serial}>
                <Link
                  href={mode.href}
                  className="flex min-h-tap flex-col justify-between border-rule border-ink bg-sheet p-3 transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
                >
                  <span className="font-mono text-[10px] tabular-nums text-red">{mode.serial}</span>
                  <span className="mt-3 font-sign text-step-1 leading-none text-ink">
                    {t(mode.title)}
                  </span>
                  <span className="mt-1 font-body text-[10.5px] leading-relaxed text-sign">
                    {t(mode.sub)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* פס הרצף — המגדל */}
        <section aria-label={t('streak.label')} className="mt-stack flex items-end gap-4">
          <div className="w-16 shrink-0">
            <LampGrid total={20} on={STREAK_ON} cols={5} tilt />
            <Mast height={44} />
          </div>
          <div className="flex-1">
            <div className="font-body text-[11px] font-extrabold tracking-widest text-muted">
              {t('streak.label')}
            </div>
            <div className="mt-2 max-w-[340px]">
              <LampGrid
                total={STREAK_TOTAL}
                on={STREAK_ON}
                cols={STREAK_TOTAL}
                label={`${STREAK_ON} מתוך ${STREAK_TOTAL} ${t('wall.streak.of')}`}
              />
            </div>
            <div className="mt-2 font-mono text-step--1 tabular-nums text-ink">
              <bdi>
                {STREAK_ON} / {STREAK_TOTAL}
              </bdi>{' '}
              {t('wall.streak.of')}
            </div>
          </div>
        </section>

        {/* ערימת הגיליונות — שלושה מקסימום */}
        {/* Two sheets behind, absolutely placed; the top one is in flow and sets the height. */}
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
            {/* Placeholder copy until the wall reads from the archive. The fact is
                real and sourced: docs/04-verified-research.md */}
            <h2 className="mt-2 font-display text-step-3 leading-tight tabular-nums text-ink">
              {t('wall.sheet.milan.title')}
            </h2>
            <p className="mt-2 font-body text-step-0 text-muted">{t('wall.sheet.milan.body')}</p>
            <p className="mt-3 font-mono text-[10px] tabular-nums text-sign">
              {t('wall.sheet.milan.source')}
            </p>
          </PastedSheet>
        </section>

        <button
          type="button"
          className="mt-stack flex min-h-tap w-full items-center border-none bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none"
        >
          {t('wall.paste')}
        </button>

        <div className="mt-stack">
          <BannerCloth>{t('slogan.remember')}</BannerCloth>
        </div>
      </main>

      <footer className="bg-ink px-gutter py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[11px] tabular-nums text-concrete">
            <bdi>{t('brand.sub')}</bdi> · <bdi>1923</bdi>
          </p>
          <BuiltByDubel />
        </div>
      </footer>

      <TabBar />
    </div>
  )
}
