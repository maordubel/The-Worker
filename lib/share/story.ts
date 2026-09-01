import { BRAND, SITE_LABEL } from '@/lib/brand'

/**
 * כרטיס הסטורי — the 1080×1920 card, drawn on a canvas rather than screenshotted.
 *
 * A screenshot of a phone screen is a bad story: it is the wrong aspect ratio, it
 * carries the status bar and the tab bar, and the type is sized for a hand rather than
 * for a thumbnail scrolling past at speed. So the card is DRAWN at true story size,
 * with its own composition — one number the size of a fist, one line of Hebrew, the
 * badge, and the address. It comes back as a real PNG, which is what
 * `navigator.share({ files })` needs to put it straight into Instagram or WhatsApp.
 *
 * Everything here is press language: cream ground, ink screen, vermilion plate,
 * misregistration of a constant 3px right-and-down. No yellow, at any step —
 * `tests/brand.test.ts` scans this file's palette along with everything else.
 */

export const STORY_W = 1080
export const STORY_H = 1920

export type StoryCard = {
  /** the small caps line at the head — GATE 11 · THE HATRED GAME */
  kicker: string
  /** the Hebrew title at the head */
  label: string
  /** the line printed above the plate */
  eyebrow: string
  /** the plate: a name, reversed out of vermilion, as big as it will go */
  hero: string
  /** the one number the card is really about, and what it counts */
  bigStat?: { v: string; k: string }
  /** up to three stamped facts down the sheet */
  stats: { k: string; v: string }[]
  /** the dare, on the ink foot */
  cta: string
  /** the line above the foot that says the link hands over the identical round */
  challenge: string
}

function dots(ctx: CanvasRenderingContext2D, from: number, to: number, alpha: number) {
  ctx.save()
  ctx.fillStyle = BRAND.ink
  ctx.globalAlpha = alpha
  for (let y = from; y < to; y += 14) {
    for (let x = (y / 14) % 2 === 0 ? 0 : 7; x < STORY_W; x += 14) {
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

/** Shrink a line until it fits the width it was given. Never wraps — a story headline
 *  that wraps has stopped being a headline. */
function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  size: number,
  maxWidth: number,
  face = 'Karantina, sans-serif',
  weight = '700',
): number {
  let current = size
  ctx.font = `${weight} ${current}px ${face}`
  while (ctx.measureText(text).width > maxWidth && current > 24) {
    current -= 4
    ctx.font = `${weight} ${current}px ${face}`
  }
  return current
}

/** קרני השמש, in a box. The same sunburst the curva's gate plate is printed with. */
function rays(ctx: CanvasRenderingContext2D, height: number) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, STORY_W, height)
  ctx.clip()
  ctx.globalAlpha = 0.26
  ctx.fillStyle = BRAND.red
  for (let angle = 0; angle < 360; angle += 11) {
    ctx.beginPath()
    ctx.moveTo(150, 30)
    const a1 = ((angle - 2.6) * Math.PI) / 180
    const a2 = ((angle + 2.6) * Math.PI) / 180
    ctx.lineTo(150 + Math.cos(a1) * 1600, 30 + Math.sin(a1) * 1600)
    ctx.lineTo(150 + Math.cos(a2) * 1600, 30 + Math.sin(a2) * 1600)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

/**
 * Draw the card. `badge` is the already-loaded logo; pass null and the card still
 * prints — the address line alone carries the attribution.
 *
 * The composition is five fixed bands, and they are fixed on purpose: a story is read
 * at arm's length in about a second and a half, so the eye has to land in the same
 * place every time — plate, number, facts, dare. Nothing here reflows.
 */
export function drawStory(
  ctx: CanvasRenderingContext2D,
  card: StoryCard,
  badge: CanvasImageSource | null,
): void {
  ctx.save()
  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
  const pad = 72
  const right = STORY_W - pad
  const width = STORY_W - pad * 2

  // 1 · the ground
  ctx.fillStyle = BRAND.sheet
  ctx.fillRect(0, 0, STORY_W, STORY_H)

  // 2 · the ink head, 0—318
  const head = 318
  ctx.fillStyle = BRAND.ink
  ctx.fillRect(0, 0, STORY_W, head)
  rays(ctx, head)
  if (badge) ctx.drawImage(badge, right - 158, 54, 158, 158)

  ctx.direction = 'ltr'
  ctx.fillStyle = BRAND.red
  ctx.font = '700 27px Archivo, sans-serif'
  ctx.fillText(card.kicker, right - 190, 104)
  ctx.direction = 'rtl'
  ctx.fillStyle = BRAND.sheet
  ctx.font = '400 52px "Suez One", serif'
  ctx.fillText(card.label, right - 190, 176)
  ctx.fillStyle = BRAND.concrete
  ctx.font = '400 28px Heebo, sans-serif'
  ctx.fillText('הפועל תל אביב · בלומפילד · 1923', right - 190, 226)

  // 3 · the plate, 400—700. Two inks: navy laid first, vermilion over it, offset a
  //     constant 6px right-and-down at this scale — the shell's 3px, doubled for 2×.
  const plateTop = 396
  const heroSize = fit(ctx, card.hero, 172, width - 72)
  // the plate hugs the name rather than sitting in a fixed box — a poster is cut to
  // what is printed on it
  const plateH = Math.round(heroSize * 1.34)
  ctx.fillStyle = BRAND.muted
  ctx.font = '400 30px Heebo, sans-serif'
  ctx.fillText(card.eyebrow, right, plateTop - 26)

  ctx.fillStyle = BRAND.sign
  ctx.fillRect(pad + 6, plateTop + 6, width, plateH)
  ctx.fillStyle = BRAND.red
  ctx.fillRect(pad, plateTop, width, plateH)
  ctx.font = `700 ${heroSize}px Karantina, sans-serif`
  ctx.fillStyle = BRAND.sheet
  ctx.fillText(card.hero, right - 36, plateTop + plateH / 2 + heroSize * 0.33)

  // 4 · the big number, 760—1060
  let y = plateTop + plateH + 120
  if (card.bigStat) {
    const size = fit(ctx, card.bigStat.v, 250, width - 40)
    ctx.fillStyle = BRAND.sign
    ctx.fillText(card.bigStat.v, right - 6, y + size * 0.74 + 6)
    ctx.fillStyle = BRAND.red
    ctx.fillText(card.bigStat.v, right, y + size * 0.74)
    y += size * 0.74 + 22
    ctx.fillStyle = BRAND.muted
    ctx.font = '400 32px Heebo, sans-serif'
    ctx.fillText(card.bigStat.k, right, y + 30)
    y += 96
  }

  // 5 · the facts, each on its own rule
  ctx.fillStyle = BRAND.ink
  ctx.fillRect(pad, y, width, 5)
  y += 58
  for (const stat of card.stats.slice(0, 3)) {
    ctx.fillStyle = BRAND.muted
    ctx.font = '400 27px Heebo, sans-serif'
    ctx.fillText(stat.k, right, y)
    const size = fit(ctx, stat.v, 56, width, '"Suez One", serif', '400')
    ctx.fillStyle = BRAND.ink
    ctx.fillText(stat.v, right, y + size + 12)
    y += size + 74
    ctx.fillStyle = BRAND.ink
    ctx.globalAlpha = 0.2
    ctx.fillRect(pad, y - 32, width, 2)
    ctx.globalAlpha = 1
  }

  // the line that turns a boast into a dare
  ctx.fillStyle = BRAND.sign
  ctx.font = '400 30px Heebo, sans-serif'
  ctx.fillText(card.challenge, right, STORY_H - 452)

  dots(ctx, head, STORY_H - 400, 0.09)

  // 6 · the ink foot, and the address
  const footTop = STORY_H - 400
  ctx.fillStyle = BRAND.ink
  ctx.fillRect(0, footTop, STORY_W, 400)
  ctx.fillStyle = BRAND.red
  ctx.fillRect(pad, footTop + 54, width, 9)

  const ctaSize = fit(ctx, card.cta, 76, width)
  ctx.fillStyle = BRAND.sheet
  ctx.fillText(card.cta, right, footTop + 62 + ctaSize)

  ctx.fillStyle = BRAND.concrete
  ctx.font = '400 30px Heebo, sans-serif'
  ctx.fillText('שערי הפועל · THE WORKER', right, footTop + 250)

  ctx.direction = 'ltr'
  ctx.fillStyle = BRAND.red
  ctx.font = '700 44px Archivo, sans-serif'
  ctx.fillText(SITE_LABEL, right, footTop + 330)
  ctx.restore()
}

/** Render the card to a PNG blob at true story size. */
export async function renderStory(
  card: StoryCard,
  badgeSrc = '/brand/logo-512.png',
): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = STORY_W
  canvas.height = STORY_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // The faces must be resident before the first fillText, or the canvas silently
  // falls back to a system font and the card ships in the wrong voice.
  if (document.fonts?.ready) {
    try {
      await Promise.all([
        document.fonts.load('700 200px Karantina'),
        document.fonts.load('400 44px "Suez One"'),
        document.fonts.load('400 30px Heebo'),
        document.fonts.load('700 40px Archivo'),
      ])
      await document.fonts.ready
    } catch {
      // a missing face is a worse-looking card, not a failed share
    }
  }

  const badge = await loadImage(badgeSrc).catch(() => null)
  drawStory(ctx, card, badge)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}
