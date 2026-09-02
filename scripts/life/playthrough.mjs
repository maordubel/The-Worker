/**
 * מסלול הבדיקה — THE WORKER LIFE, played by a script.
 *
 * Rule 29 in this repo says the acceptance claims are a script and not a memory. A game
 * makes claims a static sweep cannot check — "the prologue ends", "the child moves",
 * "the world has no yellow in it once it is RENDERED" — so this drives the actual build:
 * it opens the route at three widths, presses the buttons a player presses, screenshots
 * every beat, and scans the pixels that came out of the canvas.
 *
 * The yellow band is the same band as `lib/isYellow.ts` and `scripts/brand/qa-sweep.mjs`.
 * Antialiasing is off for the same reason it is off there: subpixel rendering invents
 * colour at glyph edges and the scan would be measuring the renderer.
 *
 *   node scripts/life/playthrough.mjs [http://127.0.0.1:3000]
 */
import { mkdirSync, writeFileSync } from 'node:fs'

import { chromium } from 'playwright'
import { PNG } from 'pngjs'

const BASE = process.argv[2] ?? 'http://127.0.0.1:3000'
const EXECUTABLE = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const OUT = 'data/life-shots'

const HUE_MIN = 38
const HUE_MAX = 70
const SAT_MIN = 0.35
const VAL_MIN = 0.35

const SIZES = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

function yellowPixels(buffer) {
  const png = PNG.sync.read(buffer)
  let count = 0
  let sample = ''
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3] < 8) continue
    const r = png.data[i]
    const g = png.data[i + 1]
    const b = png.data[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    if (delta === 0) continue
    if (delta / max < SAT_MIN || max / 255 < VAL_MIN) continue
    let hue
    if (max === r) hue = 60 * (((g - b) / delta + 6) % 6)
    else if (max === g) hue = 60 * ((b - r) / delta + 2)
    else hue = 60 * ((r - g) / delta + 4)
    if (hue >= HUE_MIN && hue <= HUE_MAX) {
      count += 1
      if (!sample) sample = `rgb(${r} ${g} ${b})`
    }
  }
  return { count, sample }
}

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({
  executablePath: EXECUTABLE,
  args: ['--disable-lcd-text', '--disable-font-subpixel-positioning', '--font-render-hinting=none'],
})

let faults = 0
const report = []

for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    hasTouch: size.name === 'phone',
    isMobile: size.name === 'phone',
  })
  const page = await context.newPage()
  const errors = []
  const origin = new URL(BASE).origin
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(origin)) errors.push(`request failed: ${request.url()}`)
  })
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (message.text().startsWith('Failed to load resource')) return
    errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(String(error)))

  const shot = async (label) => {
    const buffer = await page.screenshot()
    writeFileSync(`${OUT}/${size.name}-${label}.png`, buffer)
    const { count, sample } = yellowPixels(buffer)
    if (count > 0) {
      faults += 1
      report.push(`YELLOW  ${size.name}/${label}: ${count}px ${sample}`)
    }
    return count
  }

  // A fresh life every run, or the second run opens a save and tests nothing.
  await page.goto(`${BASE}/life`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    try {
      window.localStorage.removeItem('the-worker:life')
    } catch {
      /* blocked */
    }
  })
  await page.reload({ waitUntil: 'networkidle' })

  await page.waitForSelector('canvas', { timeout: 20000 })
  await page.waitForTimeout(2500)
  await shot('01-prologue')

  // The prologue is nine lines; press through them and out the other side.
  for (let i = 0; i < 14; i += 1) {
    await page.keyboard.press('Space')
    await page.waitForTimeout(320)
  }
  await page.waitForTimeout(2200)
  await shot('02-bedroom')

  // Walk. If the child cannot move, everything after this is theatre.
  await page.keyboard.down('ArrowDown')
  await page.waitForTimeout(700)
  await page.keyboard.up('ArrowDown')
  await page.keyboard.down('ArrowLeft')
  await page.waitForTimeout(600)
  await page.keyboard.up('ArrowLeft')
  await page.waitForTimeout(400)
  await shot('03-walked')

  // Leaving the room proves the parts a screenshot cannot: an exit zone fires, the scene
  // restarts on a different map, the second map paints, and the HUD follows the child.
  // Line up with the doorway first. The gap in the bedroom's bottom wall is 66px wide
  // and beat 03 deliberately walks away from it, so this walks back.
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(800)
  await page.keyboard.up('ArrowRight')
  await page.keyboard.down('ArrowDown')
  await page.waitForTimeout(2200)
  await page.keyboard.up('ArrowDown')
  await page.waitForTimeout(1400)
  await shot('04-home')
  const place = await page.evaluate(
    () => document.querySelector('[data-life="place"]')?.textContent?.trim() ?? null,
  )
  if (place !== 'הבית') {
    faults += 1
    report.push(`NO EXIT  ${size.name}: still in "${place ?? '—'}" after walking into the door`)
  }

  /**
   * Talk to Kobi — the one beat that exercises the whole chain in a real browser: reach
   * detection in the scene, the runner picking a branch, the bus, the React box, and a
   * choice going back the other way.
   *
   * Getting to him is done by PINNING, not by dead reckoning. Timed presses accumulate
   * error across a scene change and the first version of this walked the child into a
   * corner of the wrong room; holding a direction until the walls stop you is exact, and
   * then two short moves from a known corner land on him every time.
   */
  const hold = async (key, ms) => {
    await page.keyboard.down(key)
    await page.waitForTimeout(ms)
    await page.keyboard.up(key)
    await page.waitForTimeout(120)
  }

  // Clear of the bedroom door first — pinning upwards from the spawn walks straight back
  // through it — then two pins to a known corner and two short moves to Kobi.
  await hold('ArrowDown', 2800) // away from the bedroom door, onto the bottom wall
  await hold('ArrowLeft', 4400) // pinned against the far wall
  await hold('ArrowUp', 4400) // up that wall, under the ceiling
  await hold('ArrowRight', 1350)
  await hold('ArrowDown', 1000)
  await page.waitForTimeout(300)
  // A pin route lands within a few pixels, and "a few pixels" is the whole reach radius.
  // So: press, and if nothing opened, take one step and press again. A player does the
  // same thing without noticing they are doing it.
  const nudges = [null, 'ArrowDown', 'ArrowUp', 'ArrowUp', 'ArrowRight']
  let spoke = false
  for (const nudge of nudges) {
    if (nudge) await hold(nudge, 220)
    await page.keyboard.press('Space')
    await page.waitForTimeout(500)
    if ((await page.locator('[data-life="dialogue"]').count()) > 0) {
      spoke = true
      break
    }
  }
  await shot('05-kobi')
  if (!spoke) {
    faults += 1
    report.push(`NO TALK  ${size.name}: pressing the button next to Kobi opened nothing`)
  } else {
    // Walk the conversation to its choices and take one.
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Space')
      await page.waitForTimeout(320)
    }
    const choice = page.getByRole('button', { name: 'יש היום משחק?' })
    if ((await choice.count()) > 0) {
      await choice.first().click()
      await page.waitForTimeout(500)
      await shot('06-choice')
    } else {
      faults += 1
      report.push(`NO CHOICE ${size.name}: the conversation never offered its choices`)
    }
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  if (overflow > 0) {
    faults += 1
    report.push(`OVERFLOW ${size.name}: ${overflow}px`)
  }

  const clock = await page.evaluate(
    () => document.querySelector('[data-life="clock"]')?.textContent?.trim() ?? null,
  )
  if (!clock) {
    faults += 1
    report.push(`NO CLOCK ${size.name}: the HUD never rendered a time`)
  }

  if (errors.length > 0) {
    faults += errors.length
    for (const error of errors) report.push(`ERROR   ${size.name}: ${error}`)
  }

  report.push(
    `ok      ${size.name}: clock ${clock ?? '—'}, place ${place ?? '—'}, overflow ${overflow}px, errors ${errors.length}`,
  )
  await context.close()
}

await browser.close()
console.log(report.join('\n'))
console.log(faults === 0 ? '\nPASS — no yellow, no overflow, no page errors' : `\nFAIL — ${faults} fault(s)`)
process.exit(faults === 0 ? 0 : 1)
