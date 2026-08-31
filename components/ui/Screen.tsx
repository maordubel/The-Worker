import type { ReactNode } from 'react'

import { BuiltByDubel } from '@/components/ui/BuiltByDubel'
import { Floodlights } from '@/components/ui/Floodlights'
import { Num } from '@/components/ui/Num'
import { SignPlate } from '@/components/ui/SignPlate'
import { TabBar } from '@/components/ui/TabBar'
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
  children,
}: {
  title: string
  sub: string
  night?: boolean
  children: ReactNode
}) {
  return (
    <div className={`min-h-dvh ${night ? 'bg-ink' : ''}`}>
      <div
        className={`mx-auto flex min-h-dvh max-w-5xl flex-col md:border-x-rule md:border-ink ${
          night ? 'bg-ink' : ''
        }`}
      >
        <main id="main" className="relative flex-1 px-gutter pb-stack pt-5 md:pt-10">
          {/* The lights come on over a night screen. On a paper screen the sun is
              already up and there is nothing to switch on. */}
          {night && <Floodlights />}
          <SignPlate title={title} sub={sub} />
          {children}
        </main>

        <footer className="bg-ink px-gutter py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="font-mono text-[11px] text-concrete">
              <bdi>{t('brand.sub')}</bdi> · <Num>1923</Num>
            </p>
            <BuiltByDubel />
          </div>
        </footer>

        {/* Space for the fixed bar + the iOS home indicator. */}
        <div
          aria-hidden="true"
          className="h-[calc(var(--tap)+1.25rem+env(safe-area-inset-bottom))]"
        />
      </div>

      <TabBar />
    </div>
  )
}
