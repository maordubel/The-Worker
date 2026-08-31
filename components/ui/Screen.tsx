import type { ReactNode } from 'react'

import { BuiltByDubel } from '@/components/ui/BuiltByDubel'
import { SignPlate } from '@/components/ui/SignPlate'
import { TabBar } from '@/components/ui/TabBar'
import { t } from '@/lib/i18n'

/**
 * The fixed screen shell from the spec: SignPlate at the head, content, then the
 * bottom bar. One SignPlate per screen — this is what guarantees it.
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
    <div
      className={`mx-auto flex min-h-dvh max-w-5xl flex-col border-x-rule border-ink ${
        night ? 'bg-ink' : ''
      }`}
    >
      <main id="main" className="flex-1 px-gutter pb-10 pt-6 md:pt-10">
        <SignPlate title={title} sub={sub} />
        {children}
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
