import type { Metadata } from 'next'
import { Frank_Ruhl_Libre, Heebo } from 'next/font/google'
import { DIRECTION, LOCALE, t } from '@/lib/i18n'
import './globals.css'

const display = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['700', '900'],
  variable: '--font-display',
  display: 'swap',
})

const body = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${t('app.name')} — ${t('app.tagline')}`,
  description: t('app.description'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={LOCALE} dir={DIRECTION} className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:bg-red focus:px-4 focus:py-2 focus:text-on-red"
        >
          {t('nav.skipToContent')}
        </a>
        {children}
      </body>
    </html>
  )
}
