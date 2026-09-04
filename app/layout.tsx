import type { Metadata, Viewport } from 'next'
import Script from 'next/script'

import { Analytics } from '@/components/ads/Analytics'
import { ADSENSE_CLIENT } from '@/lib/ads'
import { BRAND } from '@/lib/brand'
import { DIRECTION, LOCALE, t } from '@/lib/i18n'
import './globals.css'

/**
 * The faces live in `globals.css` as self-hosted @font-face rules (brand spec §3) —
 * `next/font/google` needs the network at build time, and the one time it did not have
 * it the stub that replaced it shipped, and the whole site fell back to Georgia.
 */
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
    <html lang={LOCALE} dir={DIRECTION}>
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
