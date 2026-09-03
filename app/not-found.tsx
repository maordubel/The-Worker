import Link from 'next/link'
import { SignPlate } from '@/components/ui/SignPlate'
import { t } from '@/lib/i18n'

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-gutter py-16">
      <SignPlate title={t('screen.home.title')} sub={t('screen.home.sub')} />
      <p className="mt-stack font-mono text-step-5 tabular-nums text-red">404</p>
      <p className="mt-2 font-body text-step-0 text-muted">{t('wall.empty')}</p>
      <Link
        href="/"
        className="mt-stack inline-flex min-h-tap items-center bg-ink px-4 font-body text-step-1 font-extrabold text-sheet"
      >
        {t('tab.ground')}
      </Link>
    </main>
  )
}
