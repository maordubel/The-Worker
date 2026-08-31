import type { Config } from 'tailwindcss'

/**
 * Every value maps to a token in app/globals.css.
 * Spec: brand/THE-WORKER-BRAND-SPEC.md — no yellow, radius 0, no shadows
 * except the single night lamp glow.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sheet: 'rgb(var(--sheet) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        red: 'rgb(var(--red) / <alpha-value>)',
        concrete: 'rgb(var(--concrete) / <alpha-value>)',
        sign: 'rgb(var(--sign) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'lamp-off': 'rgb(var(--lamp-off) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-frank)', 'Georgia', 'serif'],
        sign: ['var(--font-miriam)', 'system-ui', 'sans-serif'],
        body: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-courier)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'step--1': ['0.833rem', { lineHeight: '1.5' }],
        'step-0': ['1rem', { lineHeight: '1.6' }],
        'step-1': ['1.2rem', { lineHeight: '1.45' }],
        'step-2': ['1.44rem', { lineHeight: '1.35' }],
        'step-3': ['1.728rem', { lineHeight: '1.25' }],
        'step-4': ['2.074rem', { lineHeight: '1.15' }],
        'step-5': ['2.986rem', { lineHeight: '1.02' }],
      },
      borderRadius: { none: '0', DEFAULT: '0', full: '9999px' },
      borderWidth: { hair: '1px', rule: '2px', plate: '3px', stamp: '5px' },
      spacing: { gutter: 'var(--gutter)', stack: 'var(--stack)', tap: 'var(--tap)' },
      transitionTimingFunction: { stamp: 'var(--ease-stamp)', peel: 'var(--ease-peel)' },
      transitionDuration: {
        press: '90ms',
        plate: '160ms',
        stamp: '240ms',
        peel: '260ms',
        paste: '320ms',
      },
      boxShadow: { lamp: '0 0 42px rgba(247,245,240,.35)' },
      animation: {
        'stamp-in': 'stamp-in 240ms var(--ease-stamp) both',
        'lamp-on': 'lamp-on 90ms linear both',
        'paste-in': 'paste-in 320ms var(--ease-stamp) both',
        crawl: 'crawl 22s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
