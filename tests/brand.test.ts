import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { PNG } from 'pngjs'

import { isYellow, isYellowHex } from '@/lib/isYellow'
import { YELLOW_EXEMPTIONS, yellowAllowed } from '@/lib/brand/yellowExemptions'

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

/**
 * החומרה — the one place in the product that is a physical object rather than a printed
 * one, and the second named exemption in this file.
 *
 * `ControlDeck.tsx` draws THE WORKER LIFE's console: a ball-top arcade stick and two
 * moulded buttons. Maor's direction for it is explicit — old arcade hardware, never a
 * generic translucent HTML circle — and a ball top cannot be square. So radius 0 does
 * not reach it, and neither does the file-level `min-h-tap` heuristic: the console is
 * sized from the band left under the painting, in pixels, and `npm run life:play`
 * MEASURES every target on four viewports and fails under 44px. A measured control is a
 * stronger guarantee than a class name, which is the only reason this exemption is safe.
 *
 * Shaped like the yellow exemption on purpose (rule 8): one named file, a stated reason,
 * and a test that still covers every other file in the codebase.
 */
const ARCADE_FILES = ['ControlDeck.tsx']

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
    // ABSOLUTE, and it applies to the press layer and the gate posters too. The
    // definition lives in lib/isYellow.ts so this test and the screenshot scanner
    // cannot drift apart; see that file for why hue beats channel inequalities.
    const css = readFileSync(TOKENS_FILE, 'utf8')
    const hexes = [...css.matchAll(/#([0-9a-fA-F]{6})/g)].map((match) => match[1] as string)
    for (const hex of hexes) {
      expect(isYellowHex(hex), `#${hex} is yellow`).toBe(false)
    }

    const rgbs = [...css.matchAll(/(\d{1,3})\s+(\d{1,3})\s+(\d{1,3});/g)]
    for (const match of rgbs) {
      const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])]
      expect(isYellow(r as number, g as number, b as number), `rgb(${r} ${g} ${b}) is yellow`).toBe(
        false,
      )
    }
  })

  it('knows what yellow is', () => {
    // The guard is only worth as much as its definition, so the definition is tested.
    for (const hex of ['#F5C518', '#D8B25C', '#F0D693', '#A9822F', '#FFD700', '#FFFF00']) {
      expect(isYellowHex(hex), `${hex} should be yellow`).toBe(true)
    }
    for (const hex of [
      '#E0401C', // vermilion ink
      '#1E2C5A', // navy ink
      '#E9DFC7', // ageing paper — a yellow hue, but 15% saturation is paper
      '#8FBE63', // printed grass
      '#B07A5A', // the drawn figure's skin
      '#C09B71', // the badge's skin
      '#EAA990', // vermilion antialiased into cream
      '#CE1410', // the old club red
    ]) {
      expect(isYellowHex(hex), `${hex} should not be yellow`).toBe(false)
    }
  })

  it('never lets a press colour leak into a shell component', () => {
    // The two palettes are separate systems, not a pool to pick from. The press tokens
    // dress the pitch, the figure and the share cards; a screen chrome element reaching
    // for --n-gold is the two languages starting to blur.
    // `app/xi/` draws a printed pitch, which is a press surface by definition — the
    // all-time XI builder is the same drawing as the lineup quiz, one gate over.
    const PRESS_SURFACES = [
      'components/press/',
      'app/kits/',
      'app/lineup/',
      'app/xi/',
      'app/goal/',
      'app/share/',
    ]
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
        // A lamp is round. So is a ball top, and so are the moulded corners of the deck
        // plate it is bolted to — an arcade console is the one physical object in a
        // printed product, and every other file in the codebase is still radius 0.
        const allowed = ARCADE_FILES.some((file) => path.endsWith(file))
          ? true
          : hit === 'rounded-full' && LAMP_FILES.some((file) => path.endsWith(file))
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

/**
 * המתקן — the one file the brand guards do not apply to, and why.
 *
 * `app/qa/story` renders every share card with the WORST strings the archive can
 * produce, so it necessarily holds Hebrew literals and un-tokenised type: it is a
 * fixture, not a screen. Exempting it is only safe because it can never be served —
 * the test below asserts the route returns `notFound()` in production, so the exemption
 * cannot quietly become a hole somebody ships a real screen through.
 */
const QA_HARNESS = 'app/qa/'

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
      if (path.includes(QA_HARNESS)) continue
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
      if (ARCADE_FILES.some((file) => path.endsWith(file))) continue
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
      if (path.includes(QA_HARNESS)) continue // fixtures, and unreachable in production
      for (const line of withoutComments(text).split('\n')) {
        if (!hebrew.test(line)) continue
        const isTranslated = /\bt\(/.test(line) || /aria-label=\{/.test(line)
        expect(isTranslated, `${path}: ${line.trim()}`).toBe(true)
      }
    }
  })
})

describe('הסמל — the badge ships without a yellow pixel in it', () => {
  // Rule 8 has no exemption for artwork, so the drawing itself is scanned, not just
  // the tokens. `scripts/brand/badge.py` rebuilds these from Maor's original and
  // rotates the few dark edge pixels that land in the band onto a warm brown at the
  // same saturation and value; if someone re-exports the badge without that pass, this
  // fails before it reaches a screen.
  const BADGES = ['logo.png', 'logo-512.png', 'logo-192.png', 'logo-96.png', 'logo-48.png', 'logo-32.png']

  for (const name of BADGES) {
    it(`${name} has no yellow pixel`, () => {
      const png = PNG.sync.read(readFileSync(join(process.cwd(), 'public/brand', name)))
      let hits = 0
      let sample = ''
      for (let i = 0; i < png.data.length; i += 4) {
        const alpha = png.data[i + 3] as number
        if (alpha < 8) continue
        const r = png.data[i] as number
        const g = png.data[i + 1] as number
        const b = png.data[i + 2] as number
        if (!isYellow(r, g, b)) continue
        hits += 1
        if (!sample) sample = `rgb(${r} ${g} ${b}) at index ${i / 4}`
      }
      expect(hits, `${name}: ${sample}`).toBe(0)
    })
  }

  it('renders the badge unoptimized, so no re-encoder can invent one', () => {
    // Next re-encodes to WebP/AVIF, both of which subsample chroma. On a 62px render
    // that pushed edge pixels back into the band — a clean file is not enough on its
    // own, the pipeline has to leave it alone.
    const badge = readFileSync(join(process.cwd(), 'components/ui/Badge.tsx'), 'utf8')
    expect(badge).toMatch(/\bunoptimized\b/)
    // The favicon in layout.tsx points at the same PNG and is fine — metadata icons
    // are served straight off /public. What must not exist is a second <Image> of it.
    for (const { path, text } of SOURCES) {
      if (path.endsWith('Badge.tsx')) continue
      expect(
        /src=\{?['"`]\/brand\/logo-\d+\.png/.test(text),
        `${path} renders the badge outside Badge.tsx`,
      ).toBe(false)
    }
  })
})

describe('מתקן הבדיקה — the QA harness is exempt only because it cannot ship', () => {
  it('returns notFound() in production, so the brand exemption cannot leak', () => {
    // Every harness under app/qa/, not just the story one: the exemption is scoped to
    // the directory, so anything that lands in it has to be unreachable in production.
    for (const page of ['app/qa/story/page.tsx', 'app/qa/marks/page.tsx']) {
      const text = readFileSync(join(ROOT, page), 'utf8')
      expect(text, page).toContain('notFound()')
      expect(text, page).toContain("process.env.NODE_ENV === 'production'")
    }
  })

  it('draws every template the share system can produce', () => {
    const proof = readFileSync(join(ROOT, 'app/qa/story/StoryProof.tsx'), 'utf8')
    const story = readFileSync(join(ROOT, 'lib/share/story.ts'), 'utf8')
    const declared =
      story.match(/export type StoryTemplate =([^\n]+)/)?.[1] ?? ''
    // `art` and `grass` are template variants of cards already covered here — the ones
    // that must be listed are the templates with their OWN layout code, because those
    // are the ones an overlap can hide in.
    for (const template of ['score', 'ink', 'year', 'xi', 'ballot']) {
      expect(declared, `${template} is not a declared template`).toContain(template)
      expect(proof, `${template} is not in the overlap harness`).toContain(`'${template}'`)
    }
  })
})

describe('חוק הצהוב — the one exemption, and the fence around it', () => {
  it('names exactly one exempt asset', () => {
    // Widening this list is a decision somebody has to make out loud. If this test
    // fails, an exemption was added — go and read who approved it and why, and if the
    // answer is not an owner quoting themselves, take it back out.
    expect(YELLOW_EXEMPTIONS).toHaveLength(1)
    expect(YELLOW_EXEMPTIONS[0]?.path).toBe('public/video/intro.mp4')
  })

  it('records who approved it and when, for every entry', () => {
    for (const exemption of YELLOW_EXEMPTIONS) {
      expect(exemption.approvedBy, exemption.path).toMatch(/\S/)
      expect(exemption.approvedOn, exemption.path).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(exemption.why.length, exemption.path).toBeGreaterThan(20)
    }
  })

  it('exempts a FILE, never a colour', () => {
    // The approved yellow is the opposition shirt in one clip. The same hex anywhere
    // else is still a defect, and the definition in lib/isYellow.ts is untouched.
    expect(isYellowHex('#f2c500')).toBe(true)
    expect(yellowAllowed('public/video/intro.mp4')).toBe(true)
    expect(yellowAllowed('public/art/celebration.png')).toBe(false)
    expect(yellowAllowed('public/brand/logo-512.png')).toBe(false)
  })

  it('matches the path exactly, so a folder can never be exempted by accident', () => {
    expect(yellowAllowed('public/video')).toBe(false)
    expect(yellowAllowed('public/video/intro.mp4.bak')).toBe(false)
    expect(yellowAllowed('public/video/other.mp4')).toBe(false)
  })

  it('keeps the exempt asset out of every screen but the opening', () => {
    const sources = SOURCES.filter(({ text }) => text.includes('/video/intro.mp4'))
    expect(sources.map(({ path }) => path.split('/').pop())).toEqual(['Intro.tsx'])
  })
})

describe('סורק הפיקסלים — the sweep and the module agree on what yellow is', () => {
  it('carries the same hue band as lib/isYellow.ts', () => {
    // The scanner cannot import TypeScript, so the band is duplicated. Duplication is
    // exactly how "no yellow" became "no yellow according to whichever check ran last",
    // so the numbers are read back out and compared rather than trusted.
    const sweep = readFileSync(join(ROOT, 'scripts/brand/qa-sweep.mjs'), 'utf8')
    const module_ = readFileSync(join(ROOT, 'lib/isYellow.ts'), 'utf8')

    const band = {
      HUE_MIN: Number(sweep.match(/const HUE_MIN = ([\d.]+)/)?.[1]),
      HUE_MAX: Number(sweep.match(/const HUE_MAX = ([\d.]+)/)?.[1]),
      SAT_MIN: Number(sweep.match(/const SAT_MIN = ([\d.]+)/)?.[1]),
      VAL_MIN: Number(sweep.match(/const VAL_MIN = ([\d.]+)/)?.[1]),
    }
    expect(band).toEqual({ HUE_MIN: 38, HUE_MAX: 70, SAT_MIN: 0.35, VAL_MIN: 0.35 })
    expect(module_).toContain('hue >= 38 && hue <= 70')
    expect(module_).toContain('saturation < 0.35 || value < 0.35')
  })

  it('turns antialiasing off, or it measures the renderer instead of the design', () => {
    const sweep = readFileSync(join(ROOT, 'scripts/brand/qa-sweep.mjs'), 'utf8')
    expect(sweep).toContain('--disable-lcd-text')
  })

  it('dismisses the opening rather than skipping the wall', () => {
    // The exemption is one FILE. A sweep that excluded the whole home route to avoid
    // the intro's yellow would hide the next real defect on the most important screen.
    const sweep = readFileSync(join(ROOT, 'scripts/brand/qa-sweep.mjs'), 'utf8')
    expect(sweep).toContain('worker.intro.v1')
    expect(sweep).toMatch(/ROUTES = \[\s*'\/'/)
  })
})
