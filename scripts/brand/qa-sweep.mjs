/**
 * סריקת קבלה — every route, every width, in one pass.
 *
 * The three claims each delta makes — no horizontal overflow, no console errors, no
 * yellow pixels — were being made from memory and a handful of screenshots. This is the
 * script that actually establishes them, so the claim and the check are the same thing.
 *
 * On yellow: the hue band is duplicated from `lib/isYellow.ts` because a browser script
 * cannot import TypeScript, and duplication is how "no yellow" quietly became "no yellow
 * according to whichever check ran last". `tests/brand.test.ts` reads the numbers back
 * out of this file and fails if they drift from the module.
 *
 * The opening animation is a NAMED exemption (`lib/brand/yellowExemptions.ts`, approved
 * by Maor on 1.9.2026 for the opposition shirt). The sweep dismisses it before measuring
 * rather than allowing yellow on the wall: the exemption covers one file, not one route,
 * and a scanner that looked away from a whole screen would hide the next real defect.
 *
 *   node scripts/brand/qa-sweep.mjs [http://127.0.0.1:3000]
 */
import { chromium } from 'playwright'
// A missing canvas must fail the run, not silently skip the yellow count: a scanner
// that reports nothing and exits 0 is worse than no scanner, because it is believed.
import { createCanvas, loadImage } from 'canvas'

const BASE = process.argv[2] ?? 'http://127.0.0.1:3000'
const EXECUTABLE = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

// Kept in step with lib/isYellow.ts by tests/brand.test.ts — change both or neither.
const HUE_MIN = 38
const HUE_MAX = 70
const SAT_MIN = 0.35
const VAL_MIN = 0.35

const ROUTES = [
  '/', '/xi', '/trivia', '/trivia/general', '/lineup', '/kits', '/kits/build',
  '/memory', '/polls', '/goal', '/tik', '/derby', '/timeline', '/ussishkin',
]
const WIDTHS = [320, 390, 768, 1440]

function yellowPixels(data) {
  let count = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    if (delta === 0) continue
    if (delta / max < SAT_MIN || max / 255 < VAL_MIN) continue
    let hue
    if (max === r) hue = 60 * (((g - b) / delta + 6) % 6)
    else if (max === g) hue = 60 * ((b - r) / delta + 2)
    else hue = 60 * ((r - g) / delta + 4)
    if (hue >= HUE_MIN && hue <= HUE_MAX) count += 1
  }
  return count
}

const browser = await chromium.launch({
  executablePath: EXECUTABLE,
  // Subpixel antialiasing invents colour at every glyph edge and produced 23,643 false
  // yellow pixels the first time this ran. Off, or the scan measures the renderer.
  args: ['--disable-lcd-text', '--disable-font-subpixel-positioning', '--font-render-hinting=none'],
})

let faults = 0
for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } })
  for (const route of ROUTES) {
    const page = await context.newPage()
    const errors = []
    const blocked = []

    /**
     * Two different things arrive as "console error", and conflating them is how a
     * checker gets ignored.
     *
     * A page that throws is a defect. A page whose AdSense or GA script was refused by
     * the sandbox's egress proxy is this ENVIRONMENT, not the product — and it happens
     * on all 56 screens, so counting it as a fault meant every screen failed and the
     * real signal was buried. The two are told apart by the request, not by the text:
     * a failed load of an OFF-ORIGIN url is reported as blocked; anything else, and
     * every uncaught exception, is a fault.
     */
    const origin = new URL(BASE).origin
    page.on('requestfailed', (request) => {
      if (request.url().startsWith(origin)) errors.push(`request failed: ${request.url()}`)
      else blocked.push(new URL(request.url()).host)
    })
    page.on('console', (message) => {
      if (message.type() !== 'error') return
      // A resource that failed is already accounted for by `requestfailed`; this is the
      // browser narrating the same event, so it is not counted twice.
      if (message.text().startsWith('Failed to load resource')) return
      errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(String(error)))
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })

    // The opening animation is exempt as a file, not as a screen — see the header.
    await page.evaluate(() => {
      try { window.sessionStorage.setItem('worker.intro.v1', '1') } catch { /* blocked */ }
    })
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    const shot = await page.screenshot({ fullPage: true })
    const image = await loadImage(shot)
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const yellow = yellowPixels(ctx.getImageData(0, 0, image.width, image.height).data)

    const bad = overflow > 0 || errors.length > 0 || yellow > 0
    if (bad) faults += 1
    const ext = [...new Set(blocked)]
    const line =
      `${String(width).padStart(4)}  ${route.padEnd(18)} overflow ${String(overflow).padStart(3)}` +
      `  errors ${String(errors.length).padStart(2)}  yellow ${String(yellow).padStart(6)}` +
      (ext.length > 0 ? `  (blocked by this environment: ${ext.join(', ')})` : '')
    console.log(bad ? `${line}   ← FAULT` : line)
    for (const error of errors.slice(0, 3)) console.log(`        ${error}`)
    await page.close()
  }
  await context.close()
}
await browser.close()

if (faults > 0) {
  console.error(`\n${faults} screen(s) with a fault. Fix before the delta goes out.`)
  process.exit(1)
}
console.log('\nclean: no overflow, no console errors, no yellow.')
console.log('Hosts marked "blocked by this environment" are the sandbox egress proxy')
console.log('refusing Google\'s ad and analytics scripts — not a defect in the app.')
