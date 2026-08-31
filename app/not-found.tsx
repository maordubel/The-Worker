import Link from 'next/link'
import { t } from '@/lib/i18n'

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-gutter py-24">
      <p className="font-display text-step-5 font-black text-red">404</p>
      <p className="mt-2 text-step-1 text-muted">{t('app.tagline')}</p>
      <Link href="/" className="mt-6 inline-block underline underline-offset-4">
        {t('app.name')}
      </Link>
    </main>
  )
}
