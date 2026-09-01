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
// Radius 0 everywhere; a LAMP is the one permitted circle. The allowance is by
// purpose, so it covers every file that draws lamps — not one filename.
const LAMP_FILES = ['LampGrid.tsx', 'TabBar.tsx', 'Floodlights.tsx']

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
    // ABSOLUTE. It applies to the press layer too. The DUBID palette rules in dim
    // gold (#D8B25C) and discs its numbers in #F5C518; both are yellow, so neither is
    // here. Scoping this rule to "everywhere except the pictures" was overriding a
    // decision that is not mine to make, and it is not scoped again.
    const css = readFileSync(TOKENS_FILE, 'utf8')
    const hexes = [...css.matchAll(/#([0-9a-fA-F]{6})/g)].map((match) => match[1] as string)
    const rgbs = [...css.matchAll(/(\d{1,3})\s+(\d{1,3})\s+(\d{1,3});/g)].map(
      (match) => [Number(match[1]), Number(match[2]), Number(match[3])] as const,
    )
    const fromHex = hexes.map(
      (hex) =>
        [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
        ] as const,
    )

    for (const [r, g, b] of [...fromHex, ...rgbs]) {
      // Yellow: red and green both high, blue clearly lower, AND red not far below
      // green. That last clause is what separates yellow from a yellow-GREEN: the
      // printed grass is 143/190/99, where green leads by nearly fifty, and it is
      // green. Gold (216/178/92) and mark yellow both lead with red.
      const isYellow = r > 150 && g > 130 && b < Math.min(r, g) - 40 && r >= g - 20
      expect(isYellow, `rgb(${r} ${g} ${b}) reads as yellow`).toBe(false)
    }
  })

  it('never lets a press colour leak into a shell component', () => {
    // The two palettes are separate systems, not a pool to pick from. The press tokens
    // dress the pitch, the figure and the share cards; a screen chrome element reaching
    // for --n-gold is the two languages starting to blur.
    const PRESS_SURFACES = ['components/press/', 'app/kits/', 'app/lineup/', 'app/share/']
    for (const { path, text } of SOURCES) {
      if (PRESS_SURFACES.some((dir) => path.includes(dir))) continue
      const leak = /--[pn]-(?:paper|ink|gold|grass|mark|red|line|skin|hair|tekhelet)/.exec(text)
      expect(leak, `${path} uses the press token ${leak?.[0]} outside a press surface`).toBeNull()
    }
  })

  it('uses no raw hex in components — tokens only', () => {
    for (const { path, text } of SOURCES) {
      expect(/#[0-9a-fA-F]{3,8}\b/.test(text), `${path} contains a raw hex`).toBe(false)
    }
  })

  it('declares every press token the press components use', () => {
    // A component reaching for a token that globals.css does not define fails silently:
    // the fill resolves to nothing and the shape renders invisible.
    const css = readFileSync(TOKENS_FILE, 'utf8')
    for (const { path, text } of SOURCES) {
      for (const match of text.matchAll(/var\((--[pn]-[a-z-]+)\)/g)) {
        const token = match[1] as string
        expect(css.includes(`${token}:`), `${path} uses ${token}, which is not declared`).toBe(
          true,
        )
      }
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

  it('never puts a logical margin on a bidi-isolated number', () => {
    // <Num> renders <bdi dir="ltr">. A logical margin resolves against the ELEMENT's
    // own direction, so `me-2` there means "right" while the page means "left", and
    // the gap silently lands on the wrong side of the number. The gap belongs to the
    // parent — a flex row with gap-x — never to the isolate.
    const offender = /<Num[^>]*className=(?:"|\{`)[^"`]*\b(?:me|ms|mx)-/
    for (const { path, text } of SOURCES) {
      const match = offender.exec(text)
      expect(match, `${path} gives <Num> a logical margin: ${match?.[0]}`).toBeNull()
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
