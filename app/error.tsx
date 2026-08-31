'use client'

import { t } from '@/lib/i18n'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-5xl px-gutter py-24">
      <h1 className="font-display text-step-4 font-black text-red">{t('app.name')}</h1>
      <p className="mt-2 text-step-0 text-muted">{t('home.status.body')}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-[44px] border-rule border-ink bg-paper-2 px-5 text-step-0 transition-colors duration-stamp ease-stamp hover:bg-paper-3 motion-reduce:transition-none"
      >
        {t('nav.skipToContent')}
      </button>
    </main>
  )
}
