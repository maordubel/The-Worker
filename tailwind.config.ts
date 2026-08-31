import type { Config } from 'tailwindcss'

/**
 * Every value here maps to a CSS custom property defined in app/globals.css.
 * Components never use raw hex or magic px — only these token names.
 * Visual system: "Archival letterpress — red ink on newsprint". See docs/01-brand-concept.md
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        'paper-2': 'rgb(var(--paper-2) / <alpha-value>)',
        'paper-3': 'rgb(var(--paper-3) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        red: {
          DEFAULT: 'rgb(var(--red) / <alpha-value>)',
          deep: 'rgb(var(--red-deep) / <alpha-value>)',
        },
        ochre: 'rgb(var(--ochre) / <alpha-value>)',
        verified: 'rgb(var(--verified) / <alpha-value>)',
        'on-red': 'rgb(var(--on-red) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'step--1': ['0.833rem', { lineHeight: '1.5' }],
        'step-0': ['1rem', { lineHeight: '1.6' }],
        'step-1': ['1.2rem', { lineHeight: '1.45' }],
        'step-2': ['1.44rem', { lineHeight: '1.35' }],
        'step-3': ['1.728rem', { lineHeight: '1.25' }],
        'step-4': ['2.074rem', { lineHeight: '1.15' }],
        'step-5': ['2.986rem', { lineHeight: '1.05' }],
      },
      borderRadius: { none: '0', chip: '2px' },
      borderWidth: { hairline: '1px', rule: '1.5px', plate: '3px' },
      spacing: {
        gutter: 'var(--gutter)',
        stack: 'var(--stack)',
      },
      transitionTimingFunction: { stamp: 'cubic-bezier(0.2, 0, 0, 1)' },
      transitionDuration: { stamp: '90ms', plate: '160ms' },
      backgroundImage: {
        // Signature motif: halftone paper grain + ticket perforation.
        halftone: 'radial-gradient(rgb(var(--ink) / 0.14) 1px, transparent 1px)',
        perforation:
          'radial-gradient(circle at 50% 0, transparent 4px, rgb(var(--rule)) 4px, rgb(var(--rule)) 5px, transparent 5px)',
      },
      backgroundSize: { halftone: '4px 4px', perforation: '14px 100%' },
      keyframes: {
        misregister: {
          '0%': { transform: 'translate(0,0)' },
          '100%': { transform: 'translate(-1.5px, 1.5px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
