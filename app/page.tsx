import Image from 'next/image'
import Link from 'next/link'

import { BannerCloth } from '@/components/ui/BannerCloth'
import { LampGrid, Mast } from '@/components/ui/LampGrid'
import { Num } from '@/components/ui/Num'
import { PastedSheet } from '@/components/ui/PastedSheet'
import { Floodlights } from '@/components/ui/Floodlights'
import { Screen } from '@/components/ui/Screen'
import { Stamp } from '@/components/ui/Stamp'
import { GatePlate } from '@/components/gates/GatePlate'
import { GATES } from '@/lib/gates'
import { t } from '@/lib/i18n'

/**
 * Screen 1 — קיר המודעות.
 *
 * The wall is now the gate plan. A player does not pick a mode from a list; they walk
 * in by a gate, and each gate carries its own printed bill.
 */


const STREAK_ON = 13
const STREAK_TOTAL = 20

export default function WallPage() {
  return (
    <Screen title={t('screen.home.title')} sub={t('screen.home.sub')}>
      <div className="pointer-events-none -mt-14 flex justify-end pe-1">
        <Stamp size={56} />
      </div>

      {/* המאסטהד — the masthead of the notice wall. The badge is Maor's own artwork
          and it is the identity everywhere; nothing here re-draws it. */}
      <section
        aria-label="The Worker"
        className="relative mt-stack overflow-hidden border-rule border-ink bg-ink"
      >
        <Floodlights height={104} />
        <div
          aria-hidden="true"
          className="rays pointer-events-none absolute -top-24 h-[420px] w-[420px] opacity-[.14]"
          style={{ insetInlineEnd: -120 }}
        />
        <div className="relative flex items-center gap-4 px-4 pb-4 pt-[74px]">
          <Image
            src="/brand/logo-192.png"
            alt="The Worker"
            width={78}
            height={78}
            priority
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="font-latin text-[9px] font-bold tracking-[0.22em] text-red" dir="ltr">
              BLOOMFIELD · JAFFA · EST. 1923
            </p>
            <h2 className="mt-1 font-poster text-[38px] leading-[0.82] text-paper">
              {t('wall.gatesTitle')}
            </h2>
            <p className="font-latin text-[11px] font-extrabold tracking-[0.36em] text-sign" dir="ltr">
              T H E · G A T E S
            </p>
          </div>
        </div>
        <div className="relative bg-ink px-4 pb-3">
          <p className="font-display text-[14px] text-paper">{t('wall.ranks')}</p>
        </div>
      </section>

      <p className="mt-stack max-w-prose font-body text-step-0 text-muted">{t('build.status')}</p>

      {/* קיר המודעות — nine gates, nine posters. Choosing a game is walking in. */}
      <section aria-label={t('wall.chooseGate')} className="mt-stack">
        <div className="flex items-baseline justify-between">
          <h2 className="font-latin text-[10px] font-bold tracking-[0.24em] text-sign" dir="ltr">
            CHOOSE YOUR GATE
          </h2>
          <p className="font-display text-[15px] text-ink">{t('wall.chooseGate')}</p>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GATES.map((gate) => (
            <li key={gate.number}>
              <GatePlate gate={gate} />
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
