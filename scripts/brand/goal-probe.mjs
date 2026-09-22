/**
 * שער 8 — ריצה שלמה, בדפדפן, ולא צילום מסך אחד.
 *
 * `npm run qa:sweep` opens `/goal` and measures the screen it lands on. That screen is now
 * the FIRST of four: pick a man, pick a verb, put him somewhere, send the ball somewhere,
 * add the touch, do it again, blow the whistle, read the reveal. Rule 33 is explicit about
 * what that means — the kit game's defect was found by playing a round end to end, and
 * nothing else would have found it.
 *
 * So this plays a whole move at two widths and asserts, at every step:
 *   · no horizontal overflow
 *   · no page error and no console error from our own code
 *   · zero yellow pixels, on the same hue band `lib/isYellow.ts` defines
 *   · the document is still RTL and every control still clears 44px
 * and finally that the REVEAL actually arrived, because a probe that can pass without the
 * thing under test ever appearing is not a probe (rule 73).
 *
 * Since 21.9.2026 it also plays the parts the upgrade added, and asserts each one exists:
 *   · the caption on the board never takes a tap (`elementFromPoint` under it is a zone)
 *   · undo from an empty draft REOPENS the last touch, and one tap recommits it
 *   · the reception hint draws exactly one envelope before the whistle
 *   · the reveal draws bridges, and is left by its own button — never by waiting
 *   · the result prints the good-touches figure
 *
 *   npm run goal:probe [-- http://127.0.0.1:3000]
 *   GOAL_SHOTS=<dir>  where the pictures go (default docs/goal-shots, git-ignored)
 *   GOAL_PIN=<goalId> play a pinned run (/goal?g=…) — e.g. the title goal, whose pool
 *                     carries an opponent keeper
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'

const BASE = process.argv[2] ?? 'http://127.0.0.1:3000'
const EXECUTABLE = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const OUT = process.env.GOAL_SHOTS ?? 'docs/goal-shots'
const PIN = process.env.GOAL_PIN ?? ''

// Kept in step with lib/isYellow.ts and scripts/brand/qa-sweep.mjs — all three or none.
const HUE_MIN = 38
const HUE_MAX = 70
const SAT_MIN = 0.35
const VAL_MIN = 0.35

const WIDTHS = [
  { w: 390, h: 844, name: 'phone' },
  { w: 320, h: 568, name: 'narrow' },
  { w: 1280, h: 800, name: 'desktop' },
]

function yellowPixels(png) {
  let count = 0
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i] / 255
    const g = png.data[i + 1] / 255
    const b = png.data[i + 2] / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max < VAL_MIN) continue
    const delta = max - min
    if (max === 0 || delta / max < SAT_MIN) continue
    let hue
    if (delta === 0) hue = 0
    else if (max === r) hue = 60 * (((g - b) / delta) % 6)
    else if (max === g) hue = 60 * ((b - r) / delta + 2)
    else hue = 60 * ((r - g) / delta + 4)
    if (hue < 0) hue += 360
    if (hue >= HUE_MIN && hue <= HUE_MAX) count += 1
  }
  return count
}

const problems = []

async function shoot(page, label) {
  mkdirSync(OUT, { recursive: true })
  const buffer = await page.screenshot({ fullPage: true })
  writeFileSync(`${OUT}/${label}.png`, buffer)
  const yellow = yellowPixels(PNG.sync.read(buffer))
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('button:not([disabled]), a[href]')]
      .map((el) => {
        const box = el.getBoundingClientRect()
        return { text: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 24), h: Math.round(box.height), w: Math.round(box.width) }
      })
      // the skip link is 1×1 until it takes focus, which is what a skip link is
      .filter((row) => row.h > 0 && row.w > 0 && row.text !== 'דילוג לתוכן')
      .filter((row) => row.h < 44 || row.w < 20),
  )
  const line = `${label}: yellow=${yellow} overflow=${overflow} tiny=${small.length}`
  if (yellow > 0) problems.push(`${label} — ${yellow} yellow pixels`)
  if (overflow > 1) problems.push(`${label} — ${overflow}px of horizontal overflow`)
  if (small.length > 0) problems.push(`${label} — ${small.length} controls under 44px: ${JSON.stringify(small.slice(0, 4))}`)
  console.log(line)
}

async function tap(page, selector, label) {
  const target = page.locator(selector).first()
  await target.waitFor({ state: 'visible', timeout: 10000 })
  await target.click()
  await page.waitForTimeout(120)
  if (label) console.log(`   · ${label}`)
}

/**
 * The caption strip is `pointer-events: none`: a tap anywhere on it must land on whatever
 * is UNDER it — a zone, or the drawing — and never on the strip itself.
 */
async function captionPassesTaps(page, tag) {
  const verdict = await page.evaluate(() => {
    const caption = document.querySelector('[data-goal="caption"]')
    if (!caption) return 'no-caption'
    caption.scrollIntoView({ block: 'center' })
    const box = caption.getBoundingClientRect()
    for (const fx of [0.1, 0.5, 0.9]) {
      const el = document.elementFromPoint(box.left + box.width * fx, box.top + box.height / 2)
      if (!el) return 'nothing under the caption'
      if (caption.contains(el)) return 'the caption takes the tap'
    }
    return 'ok'
  })
  if (verdict !== 'ok') problems.push(`${tag} — ${verdict}`)
  else console.log('   · the caption lets the tap through')
}

async function playOne(page, view) {
  const tag = `${view.name}`
  await page.setViewportSize({ width: view.w, height: view.h })
  await page.goto(`${BASE}/goal?seed=1${PIN ? `&g=${PIN}` : ''}`, { waitUntil: 'networkidle' })
  await page.locator('[data-goal="player"]').first().waitFor({ timeout: 15000 })

  const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'))
  if (dir !== 'rtl') problems.push(`${tag} — document dir is ${dir}`)

  await shoot(page, `${tag}-01-empty`)
  const steps = await page.locator('[data-goal="steps"] li').count()
  if (steps !== 4) problems.push(`${tag} — the step bar has ${steps} steps, not 4`)
  const current = await page.locator('[data-goal="steps"] li[aria-current="step"]').count()
  if (current !== 1) problems.push(`${tag} — ${current} steps are marked current`)

  const zones = ['C3', 'C2', 'C1']
  for (let touch = 0; touch < 2; touch += 1) {
    await tap(page, `[data-goal="player"] >> nth=${touch}`, `player ${touch + 1}`)
    await tap(page, `[data-goal="action"] >> nth=${touch === 0 ? 0 : 4}`, 'action')
    if (touch === 0) await captionPassesTaps(page, tag)
    await tap(page, `[data-goal="zone"][data-zone="${zones[touch]}"]`, 'origin')
    if (touch === 0) await shoot(page, `${tag}-02-draft-origin`)
    // the second pitch tap IS the commit — there is no add button (rule 24)
    await tap(page, `[data-goal="zone"][data-zone="${zones[touch + 1]}"]`, 'target · committed')
  }
  await shoot(page, `${tag}-03-two-touches`)

  const list = await page.locator('[data-goal="touch"]').count()
  if (list !== 2) problems.push(`${tag} — the touch list shows ${list}, not 2`)

  // undo from an empty draft reopens the last touch, ball un-sent; one tap sends it again
  await tap(page, '[data-goal="undo"]', 'undo → reopen touch 2')
  const reopened = await page.locator('[data-goal="touch"]').count()
  if (reopened !== 1) problems.push(`${tag} — undo left ${reopened} touches, not 1`)
  await shoot(page, `${tag}-04-undo-reopened`)
  await tap(page, `[data-goal="zone"][data-zone="${zones[2]}"]`, 'target · recommitted')
  const back = await page.locator('[data-goal="touch"]').count()
  if (back !== 2) problems.push(`${tag} — recommitting left ${back} touches, not 2`)

  // the reception hint — one envelope, drawn before the whistle
  await tap(page, '[data-goal="hint-reception"]', 'reception hint')
  await page.locator('[data-goal="reception"]').waitFor({ state: 'attached', timeout: 10000 })
  const hints = await page.locator('[data-goal="reception"]').count()
  if (hints !== 1) problems.push(`${tag} — the reception hint drew ${hints} envelopes`)
  await shoot(page, `${tag}-05-reception-hint`)

  await tap(page, '[data-goal="finish"]', 'finish move')
  await page.locator('[data-goal="verdict"]').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(400)
  await shoot(page, `${tag}-06-reveal`)
  await page.locator('[data-goal="bridges"]').screenshot({ path: `${OUT}/${tag}-06b-bridges.png` }).catch(() => {})
  const board = page.locator('[data-goal="bridges"]').locator('xpath=ancestor::div[1]')
  await board.screenshot({ path: `${OUT}/${tag}-06c-board.png` }).catch(() => {})

  const ellipses = await page.locator('svg ellipse[stroke-dasharray]').count()
  if (ellipses === 0) problems.push(`${tag} — the reveal drew no uncertainty envelope`)
  else console.log(`   · ${ellipses} envelopes drawn`)
  const marks = await page.locator('[data-goal="bridge"], [data-goal="extra"], [data-goal="missing"]').count()
  if (marks === 0) problems.push(`${tag} — the reveal drew no bridge, extra or missing mark`)
  else console.log(`   · ${marks} bridges / marks drawn`)
  // the reveal is left by its own button — a probe that waited would hide a hold
  await tap(page, '[data-goal="continue"]', 'continue')

  // …and then the other two, because a run that cannot be FINISHED is the worst failure
  // a mode has (rule 31), and the only way that is ever found is by playing to the end
  // (rule 33). The old gate 8 was where "the fifth shirt skipped its reveal" would have
  // hidden too.
  for (let goal = 2; goal <= 3; goal += 1) {
    // A run may end early — three lives, and a move rebuilt badly costs them. The probe
    // has to allow BOTH endings or it reports a working game as a hung one.
    const next = await Promise.race([
      page
        .locator('[data-goal="player"]')
        .first()
        .waitFor({ timeout: 20000 })
        .then(() => 'builder'),
      page
        .locator('text=FULL TIME')
        .waitFor({ state: 'visible', timeout: 20000 })
        .then(() => 'full-time'),
    ])
    if (next === 'full-time') {
      console.log(`   · the run ended after goal ${goal - 1}`)
      break
    }
    for (let touch = 0; touch < 2; touch += 1) {
      await tap(page, `[data-goal="player"] >> nth=${touch}`)
      await tap(page, `[data-goal="action"] >> nth=${touch}`)
      await tap(page, `[data-goal="zone"][data-zone="${zones[touch]}"]`)
      await tap(page, `[data-goal="zone"][data-zone="${zones[touch + 1]}"]`)
    }
    await tap(page, '[data-goal="finish"]', `goal ${goal} whistled`)
    await page.locator('[data-goal="verdict"]').waitFor({ state: 'visible', timeout: 15000 })
    await tap(page, '[data-goal="continue"]')
  }

  // FULL TIME — the result screen, its share row and the way back in
  await page.locator('text=FULL TIME').waitFor({ state: 'visible', timeout: 25000 })
  await page.waitForTimeout(500)
  await shoot(page, `${tag}-07-fulltime`)
  const again = await page.locator('a[href*="/goal"]').count()
  if (again === 0) problems.push(`${tag} — full time offers no way back into the gate`)
  const good = await page.locator('[data-goal="good-touches"]').count()
  if (good !== 1) problems.push(`${tag} — full time does not print the good-touches figure`)
}

const browser = await chromium.launch({
  executablePath: EXECUTABLE,
  // Subpixel antialiasing invents colour at every glyph edge — 23,643 false yellow
  // pixels the first time `qa:sweep` ran, and 638 the first time this did. Off, or the
  // scan measures the renderer instead of the product (rule 29).
  args: ['--disable-lcd-text', '--disable-font-subpixel-positioning', '--font-render-hinting=none'],
})
const page = await browser.newPage()
page.on('pageerror', (error) => problems.push(`page error: ${error.message}`))
page.on('console', (message) => {
  if (message.type() !== 'error') return
  const url = message.location()?.url ?? ''
  // The ad and analytics hosts do not resolve in this sandbox; the test is the REQUEST's
  // origin, never the message text (rule 29).
  if (url.includes(BASE)) problems.push(`console error: ${message.text().slice(0, 120)}`)
})

for (const view of WIDTHS) {
  console.log(`\n— ${view.name} ${view.w}×${view.h}`)
  await playOne(page, view)
}

await browser.close()

if (problems.length > 0) {
  console.error('\ngoal:probe — נפל:')
  for (const problem of problems) console.error(`  · ${problem}`)
  process.exit(1)
}
console.log('\ngoal:probe — נקי. מהלך שלם, שלושה רוחבים, בלי צהוב ובלי גלישה.')
