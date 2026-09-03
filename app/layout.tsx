import type { Metadata, Viewport } from 'next'
const _f = (o: { variable: string; [k: string]: unknown }) => ({ variable: o.variable, className: '' })
const Suez_One = _f, Miriam_Libre = _f, Heebo = _f, Courier_Prime = _f, Karantina = _f, Archivo = _f
import Script from 'next/script'

import { Analytics } from '@/components/ads/Analytics'
import { ADSENSE_CLIENT } from '@/lib/ads'
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
  // The product is called The Worker. Full stop — no suffix, no bilingual pair, no
  // brand-system tagline. A name with something appended to it is not a name.
  title: {
    default: 'The Worker',
    template: '%s · The Worker',
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

        {/*
          AdSense's loader, and Google's measurement tag.

          `afterInteractive` for both. Neither has any business blocking the first paint
          of a game screen, and both are designed to arrive late — AdSense fills any
          `<ins>` already on the page when it lands, and gtag queues into `dataLayer`.
          Loading them `beforeInteractive` would trade the thing the app is for against
          the things that pay for it.

          The loader is global; WHERE a unit may appear is decided in `lib/ads.ts`, and
          never inside a run.
        */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Analytics />
      </body>
    </html>
  )
}
