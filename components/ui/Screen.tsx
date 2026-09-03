import type { ReactNode } from 'react'

import { AdSlot } from '@/components/ads/AdSlot'
import { BuiltByDubel } from '@/components/ui/BuiltByDubel'
import { adsAllowed } from '@/lib/ads'
import { Floodlights } from '@/components/ui/Floodlights'
import { SignPlate } from '@/components/ui/SignPlate'
import { TabBar } from '@/components/ui/TabBar'
import { SITE_LABEL } from '@/lib/brand'
import { t } from '@/lib/i18n'

/**
 * The screen shell.
 *
 * Mobile is full-bleed — no max-width, no side rules — because a bordered card inside a
 * phone viewport reads as a floating panel rather than as the wall. The framed sheet
 * appears from `md` up, where there is room around it.
 *
 * The bottom of the page reserves exactly the height of the fixed tab bar plus the home
 * indicator, so nothing ever sits underneath it.
 */
export function Screen({
  title,
  sub,
  night = false,
  /**
   * A game screen runs `chrome={false}`: no sign plate, no badge, no footer.
   * A masthead is for a page you are reading. During a run the screen belongs to the
   * run — on a 390×844 phone the header and footer were eating a third of the glass,
   * and a third of the glass is the difference between a game and a document with
   * buttons on it.
   */
  chrome = true,
  fullBleed = false,
  children,
}: {
  title: string
  sub: string
  night?: boolean
  chrome?: boolean
  fullBleed?: boolean
  children: ReactNode
}) {
  return (
    <div className={`min-h-dvh ${night ? 'bg-ink' : ''}`}>
      <div
        className={`mx-auto flex min-h-dvh max-w-5xl flex-col md:border-x-rule md:border-ink ${
          night ? 'bg-ink' : ''
        }`}
      >
        <main
          id="main"
          className={`relative flex-1 ${
            fullBleed ? 'p-0' : `px-gutter pb-stack ${chrome ? 'pt-5 md:pt-10' : 'pt-2'}`
          }`}
        >
          {/* The lights come on over a night screen. On a paper screen the sun is
              already up and there is nothing to switch on. */}
          {night && <Floodlights />}
          {chrome ? (
            <SignPlate title={title} sub={sub} />
          ) : (
            <h1 className="sr-only">{title}</h1>
          )}
          {children}
        </main>

        {/*
          Ads appear only where `chrome` is on — that is, on the pages a person reads
          rather than plays. `adsAllowed()` is the single place that decision lives, so
          a screen cannot quietly opt itself in.
        */}
        {adsAllowed(chrome) && (
          <div className="px-gutter">
            <AdSlot placement="reading" />
          </div>
        )}

        {/*
          פס הקרדיט — the strip at the foot of the ground.

          It used to be one grey line of metadata with the build credit beside it at the
          same weight, which said nothing about what this is or who made it. It is now
          the colophon of a printed sheet: the name in the poster face, the club and the
          address under it, a vermilion rule across the top, and the build credit on its
          own line at the bottom with the emblem. Three tiers instead of one.
        */}
        {chrome && (
        <footer className="mt-stack bg-ink px-gutter pb-6 pt-5">
          <div className="h-[6px] w-full bg-red" aria-hidden="true" />
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="font-poster text-[30px] leading-none text-paper" dir="ltr">
                THE WORKER
              </p>
              <p className="mt-1.5 font-body text-[12px] leading-snug text-concrete">
                <bdi>{t('brand.sub')}</bdi>
              </p>
              <p className="mt-0.5 font-latin text-[10px] font-bold tracking-[0.16em] text-red" dir="ltr">
                {SITE_LABEL.toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-3 border-t-hair border-concrete/30 pt-3 md:border-t-0 md:pt-0">
              <BuiltByDubel />
            </div>
          </div>
        </footer>
        )}

        {!fullBleed && (
          /* Space for the fixed bar + the iOS home indicator. */
          <div
            aria-hidden="true"
            className="h-[calc(var(--tap)+1.25rem+env(safe-area-inset-bottom))]"
          />
        )}
      </div>

      {!fullBleed && <TabBar />}
    </div>
  )
}
