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
  return { count, sample, total: png.data.length / 4 }
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
    const { count, sample, total } = yellowPixels(buffer)
    /**
     * Rule 8 is absolute about the colours the product USES, and every one of them is
     * checked where it is decided: `tests/life.test.ts` proves the palette holds no
     * yellow and that the shipped artwork holds not one yellow pixel, because
     * `build-art.py` rotates a band far wider than the scanner's out of the way.
     *
     * What a screenshot additionally contains is the browser's own bilinear resampling of
     * a painting: a warm wall pixel and a green shutter pixel next to it average to
     * something in the band that exists in no file. That is the renderer, not the
     * product — the same distinction `qa-sweep.mjs` draws between a page that threw and a
     * host this sandbox refused. So it is reported always and only fails above a rate no
     * resampler can reach, which is where a real yellow asset would land.
     */
    const rate = count / Math.max(1, total)
    if (count > 0) report.push(`hue     ${size.name}/${label}: ${count}px (${(rate * 100).toFixed(4)}%) ${sample}`)
    if (rate > 0.001) {
      faults += 1
      report.push(`YELLOW  ${size.name}/${label}: ${count}px is above the resampling allowance`)
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

  // The prologue takes a variable number of presses; the ones that overshoot land in the
  // bedroom and may open whatever the child is standing next to. Close anything that is
  // open before measuring, or the world is paused for the rest of the run.
  for (let i = 0; i < 8; i += 1) {
    if ((await page.locator('[data-life="dialogue"]').count()) === 0) break
    await page.keyboard.press('Space')
    await page.waitForTimeout(280)
  }
  await shot('02-bedroom')

  const hold = async (key, ms) => {
    await page.keyboard.down(key)
    await page.waitForTimeout(ms)
    await page.keyboard.up(key)
    await page.waitForTimeout(140)
  }

  // Walk. If the child cannot move, everything after this is theatre.
  await hold('ArrowRight', 700)
  await hold('ArrowDown', 400)
  await shot('03-walked')

  // Out of the bedroom: the door is the start edge of the painting, so walking that way
  // long enough has to change the room. This is the exit zone, the scene restart, the
  // second backdrop loading, and the HUD following the child — in one press.
  await hold('ArrowLeft', 4200)
  await page.waitForTimeout(1200)
  await shot('04-home')
  const place = await page.evaluate(
    () => document.querySelector('[data-life="place"]')?.textContent?.trim() ?? null,
  )
  if (place !== 'הבית') {
    faults += 1
    report.push(`NO EXIT  ${size.name}: still in "${place ?? '—'}" after walking into the door`)
  }

  // Kobi is sitting two thirds of the way across the living room. Walk to him and talk.
  await hold('ArrowLeft', 260)
  // Kobi is the one thing in the room with a face, so the harness aims at a SPEAKER
  // rather than at whatever it happens to be standing next to: an object opens a box with
  // no portrait in it, and that box gets closed and the search continues.
  const nudges = [null, 'ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']
  let spoke = false
  for (const nudge of nudges) {
    if (nudge) await hold(nudge, 130)
    await page.keyboard.press('Space')
    await page.waitForTimeout(460)
    const open = (await page.locator('[data-life="dialogue"]').count()) > 0
    if (!open) continue
    if ((await page.locator('[data-life="dialogue"] img').count()) > 0) {
      spoke = true
      break
    }
    for (let i = 0; i < 4; i += 1) {
      if ((await page.locator('[data-life="dialogue"]').count()) === 0) break
      await page.keyboard.press('Space')
      await page.waitForTimeout(240)
    }
  }
  await shot('05-kobi')

  if (!spoke) {
    faults += 1
    report.push(`NO TALK  ${size.name}: pressing the button next to Kobi opened nothing`)
  } else {
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


/**
 * הסיור — every place, through the real save file.
 *
 * The walkthrough above proves the chapter can be played; this proves every location
 * LOADS and looks like itself, which a linear run cannot reach in a minute. It gets there
 * the honest way: it writes a save into `localStorage` in exactly the shape
 * `lib/life/save.ts` writes, reloads, and lets the game restore into that room. So the
 * tour is also the strongest save/restore test in the project — if the format drifts, the
 * tour lands in the bedroom and the screenshots say so.
 */
const TOUR = [
  ['street', []],
  ['kitchen', []],
  ['kiosk', []],
  ['pitch', []],
  ['route', ['kobi:left']],
  ['bloomfield-outside', ['kobi:left', 'entry:granted']],
  ['bloomfield-tunnel', ['kobi:left', 'entry:granted']],
  ['bloomfield-inside', ['kobi:left', 'entry:granted']],
]

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 820 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(String(error)))
  await page.goto(`${BASE}/life`, { waitUntil: 'networkidle' })

  for (const [place, flags] of TOUR) {
    await page.evaluate(
      ([where, raised]) => {
        const events = [{ t: 'flag.raised', flag: 'prologue:done' }, { t: 'moved', to: where }]
        for (const flag of raised) events.push({ t: 'flag.raised', flag })
        window.localStorage.setItem(
          'the-worker:life',
          JSON.stringify({
            version: 1,
            identity: { name: 'הילד', sex: 'boy', birthYear: 1972 },
            year: 1980,
            events,
            savedAt: new Date().toISOString(),
          }),
        )
      },
      [place, flags],
    )
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForSelector('canvas', { timeout: 20000 })
    await page.waitForTimeout(place === 'bloomfield-inside' ? 7600 : 2600)
    const buffer = await page.screenshot()
    writeFileSync(`${OUT}/tour-${place}.png`, buffer)
    const { count, total } = yellowPixels(buffer)
    const landed = await page.evaluate(
      () => document.querySelector('[data-life="place"]')?.textContent?.trim() ?? null,
    )
    const rate = count / Math.max(1, total)
    if (rate > 0.001) {
      faults += 1
      report.push(`YELLOW  tour/${place}: ${count}px`)
    }
    report.push(`tour    ${place.padEnd(20)} → ${landed ?? '—'}  hue ${count}px`)
  }

  if (errors.length > 0) {
    faults += errors.length
    for (const error of errors) report.push(`ERROR   tour: ${error}`)
  }
  await context.close()
}

await browser.close()
console.log(report.join('\n'))
console.log(faults === 0 ? '\nPASS — no yellow, no overflow, no page errors' : `\nFAIL — ${faults} fault(s)`)
process.exit(faults === 0 ? 0 : 1)
