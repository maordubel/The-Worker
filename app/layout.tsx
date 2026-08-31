import type { Metadata, Viewport } from 'next'
import { Courier_Prime, Frank_Ruhl_Libre, Heebo, Miriam_Libre } from 'next/font/google'
import { BRAND } from '@/lib/brand'
import { DIRECTION, LOCALE, t } from '@/lib/i18n'
import './globals.css'

/** Four faces, fixed roles. See brand/THE-WORKER-BRAND-SPEC.md §3. */
const frank = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['700', '900'],
  variable: '--font-frank',
  display: 'swap',
})
const miriam = Miriam_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '700'],
  variable: '--font-miriam',
  display: 'swap',
})
const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '800'],
  variable: '--font-heebo',
  display: 'swap',
})
const courier = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-courier',
  display: 'swap',
})

export const viewport: Viewport = {
  // Required for env(safe-area-inset-*) to report anything on a notched iPhone.
  viewportFit: 'cover',
  themeColor: BRAND.ink,
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  // The product is called The Worker. The tab said "הפועל · אוסישקין", which is the
  // brand system, not the name.
  title: {
    default: `The Worker · ${t('brand.name')}`,
    template: `%s · The Worker`,
  },
  description: t('app.description'),
  applicationName: 'The Worker',
  icons: { icon: '/icon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={LOCALE}
      dir={DIRECTION}
      className={`${frank.variable} ${miriam.variable} ${heebo.variable} ${courier.variable}`}
    >
      <body className="font-body antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:bg-red focus:px-4 focus:py-2 focus:text-sheet"
        >
          {t('nav.skipToContent')}
        </a>
        {children}
      </body>
    </html>
  )
}
