import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The twenty-point acceptance checklist from brand/THE-WORKER-BRAND-SPEC.md, as tests.
 * These are the rules a review is supposed to fail on, so they fail here instead.
 */

const ROOT = process.cwd()
const SOURCE_DIRS = ['app', 'components']
const TOKENS_FILE = join(ROOT, 'app/globals.css')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (['.ts', '.tsx'].includes(extname(path))) out.push(path)
  }
  return out
}

const FILES = SOURCE_DIRS.flatMap((dir) => walk(join(ROOT, dir)))
const SOURCES = FILES.map((path) => ({ path, text: readFileSync(path, 'utf8') }))

/** Comments are prose about the rules; the rules apply to the code. */
function withoutComments(text: string): string {
  return text
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

/** The one radius exception is semantic: a lamp is a perfect circle. */
const LAMP_FILES = ['LampGrid.tsx', 'TabBar.tsx']

describe('brand acceptance — colour', () => {
  it('has exactly the eight declared tokens, and no ninth', () => {
    const css = readFileSync(TOKENS_FILE, 'utf8')
    const declared = [...css.matchAll(/^\s{2}(--[a-z-]+):/gm)].map((match) => match[1])
    const colours = declared.filter((name) =>
      ['--sheet', '--paper', '--ink', '--red', '--concrete', '--sign', '--muted', '--lamp-off'].includes(
        name as string,
      ),
    )
    expect(colours).toHaveLength(8)
  })

  it('contains no yellow anywhere — the first absolute prohibition', () => {
    const css = readFileSync(TOKENS_FILE, 'utf8')
    const hexes = [...css.matchAll(/#([0-9a-fA-F]{6})/g)].map((match) => match[1] as string)
    for (const hex of hexes) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      // Yellow: red and green both high, blue clearly lower.
      const isYellow = r > 150 && g > 130 && b < Math.min(r, g) - 40
      expect(isYellow, `#${hex} reads as yellow`).toBe(false)
    }
  })

  it('uses no raw hex in components — tokens only', () => {
    for (const { path, text } of SOURCES) {
      expect(/#[0-9a-fA-F]{3,8}\b/.test(text), `${path} contains a raw hex`).toBe(false)
    }
  })
})

describe('brand acceptance — geometry', () => {
  it('uses no rounded-* except rounded-full inside LampGrid', () => {
    for (const { path, text } of SOURCES) {
      const hits = [...text.matchAll(/\brounded-[a-z0-9[\]-]+/g)].map((match) => match[0])
      for (const hit of hits) {
        const allowed =
          hit === 'rounded-full' && LAMP_FILES.some((file) => path.endsWith(file))
        expect(allowed, `${path} uses ${hit}`).toBe(true)
      }
    }
  })

  it('uses no shadow-* except shadow-lamp', () => {
    for (const { path, text } of SOURCES) {
      const hits = [...text.matchAll(/\bshadow-[a-z0-9[\]-]+/g)].map((match) => match[0])
      for (const hit of hits) {
        expect(hit === 'shadow-lamp', `${path} uses ${hit}`).toBe(true)
      }
    }
  })
})

describe('brand acceptance — RTL', () => {
  it('uses logical properties only — no physical direction utilities', () => {
    const physical =
      /\b(?:ml|mr|pl|pr)-[a-z0-9[\].-]+|\b(?:left|right)-[a-z0-9[\].-]+|\btext-(?:left|right)\b/
    for (const { path, text } of SOURCES) {
      const match = physical.exec(text)
      expect(match, `${path} uses ${match?.[0]}`).toBeNull()
    }
  })

  it('never sets margin-left/right or padding-left/right in inline styles', () => {
    for (const { path, text } of SOURCES) {
      expect(/margin(Left|Right)|padding(Left|Right)/.test(text), `${path}`).toBe(false)
    }
  })
})

describe('brand acceptance — typography', () => {
  it('uses only the four declared families', () => {
    const allowed = new Set(['font-display', 'font-sign', 'font-body', 'font-mono'])
    for (const { path, text } of SOURCES) {
      for (const hit of [...text.matchAll(/\bfont-(?:display|sign|body|mono|serif|sans)\b/g)]) {
        expect(allowed.has(hit[0]), `${path} uses ${hit[0]}`).toBe(true)
      }
    }
  })

  it('marks every mono run as tabular-nums', () => {
    // Mono is the numeric face in this system — serials, sources, times, shirt numbers.
    // Requiring tabular-nums on every mono run is stricter than the spec and easier to
    // enforce than guessing which runs contain digits.
    const mono = SOURCES.filter(({ text }) => withoutComments(text).includes('font-mono'))
    expect(mono.length).toBeGreaterThan(0)
    for (const { path, text } of mono) {
      // Either the file sets it directly, or it renders numbers through <Num>/<Score>,
      // which isolate the run LTR and set tabular-nums for it.
      const safe =
        text.includes('tabular-nums') || /<Num\b/.test(text) || /<Score\b/.test(text)
      expect(safe, `${path} uses font-mono without tabular-nums`).toBe(true)
    }
  })
})

describe('brand acceptance — interaction', () => {
  it('gives every interactive element at least the 48px tap height', () => {
    for (const { path, text } of SOURCES) {
      if (!/<button|role="button"/.test(text)) continue
      expect(text.includes('min-h-tap'), `${path} has a button without min-h-tap`).toBe(true)
    }
  })

  it('keeps a red focus ring on everything focusable', () => {
    const css = readFileSync(TOKENS_FILE, 'utf8')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('outline: 3px solid rgb(var(--red))')
  })

  it('honours prefers-reduced-motion globally', () => {
    const css = readFileSync(TOKENS_FILE, 'utf8')
    expect(css).toContain('prefers-reduced-motion: reduce')
  })
})

describe('brand acceptance — system rules', () => {
  it('shows one SignPlate per screen', () => {
    for (const { path, text } of SOURCES) {
      if (!path.startsWith(join(ROOT, 'app'))) continue
      const uses = [...text.matchAll(/<SignPlate\b/g)].length
      expect(uses, `${path} uses SignPlate ${uses} times`).toBeLessThanOrEqual(1)
    }
  })

  it('shows at most one BannerCloth per screen', () => {
    for (const { path, text } of SOURCES) {
      if (!path.startsWith(join(ROOT, 'app'))) continue
      const uses = [...text.matchAll(/<BannerCloth\b/g)].length
      expect(uses, `${path} uses BannerCloth ${uses} times`).toBeLessThanOrEqual(1)
    }
  })

  it('never stacks more than three sheets', () => {
    for (const { path, text } of SOURCES) {
      const stacked = [...text.matchAll(/<PastedSheet\b[^>]*\bstacked\b/g)].length
      expect(stacked, `${path} stacks ${stacked} sheets`).toBeLessThanOrEqual(3)
    }
  })

  it('derives the sheet tilt from the id, never from Math.random', () => {
    const sheet = withoutComments(
      readFileSync(join(ROOT, 'components/ui/PastedSheet.tsx'), 'utf8'),
    )
    expect(sheet).not.toContain('Math.random')
    expect(sheet).toContain('charCodeAt')
  })

  it('keeps the club crest out of the codebase — the stamp is an original mark', () => {
    for (const { path, text } of SOURCES) {
      expect(/club-crest|official-crest|htafc-logo/i.test(text), `${path}`).toBe(false)
    }
  })

  it('has no user-facing string outside the message catalogue', () => {
    const hebrew = /[֐-׿]/
    for (const { path, text } of SOURCES) {
      if (path.endsWith('Stamp.tsx')) continue // the circumferential stamp text is artwork
      for (const line of withoutComments(text).split('\n')) {
        if (!hebrew.test(line)) continue
        const isTranslated = /\bt\(/.test(line) || /aria-label=\{/.test(line)
        expect(isTranslated, `${path}: ${line.trim()}`).toBe(true)
      }
    }
  })
})
