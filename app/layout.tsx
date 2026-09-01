import type { Metadata, Viewport } from 'next'
import { Archivo, Courier_Prime, Heebo, Karantina, Miriam_Libre, Suez_One } from 'next/font/google'
import { BRAND } from '@/lib/brand'
import { DIRECTION, LOCALE, t } from '@/lib/i18n'
import './globals.css'

/** Four faces, fixed roles. See brand/THE-WORKER-BRAND-SPEC.md §3. */
const frank = Suez_One({
  subsets: ['hebrew', 'latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-frank',
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

/**
 * Karantina 700 is the gate face. It carries the big figures — gate numbers, shirt
 * numbers, scores — and it is the ONE face allowed to be larger than anything else on
 * a poster. It replaces Anton, which had no Hebrew.
 */
const anton = Karantina({
  subsets: ['hebrew', 'latin'],
  weight: '700',
  display: 'swap',
  variable: '--font-poster',
})

/** Archivo carries the Latin caps lines — GATE, BLOOMFIELD · JAFFA · EST. 1923. */
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-latin',
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
  icons: { icon: [{ url: '/brand/logo-192.png', type: 'image/png' }], apple: '/brand/logo-192.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={LOCALE}
      dir={DIRECTION}
      className={`${frank.variable} ${miriam.variable} ${heebo.variable} ${courier.variable} ${anton.variable} ${archivo.variable}`}
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
