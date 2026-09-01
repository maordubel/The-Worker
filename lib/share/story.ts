import { BRAND, SITE_LABEL } from '@/lib/brand'
import { COLOUR_VAR, type KitSpec } from '@/lib/kit/spec'

/**
 * תבניות הסטורי — six templates at 1080×1920, drawn on a canvas.
 *
 * Straight off `The Worker - Story Templates.dc.html`, including its one structural
 * rule: **a 260px safe zone top and bottom**, because that is where Instagram puts its
 * own interface and anything important there is covered. Every template is the same
 * three parts — a newspaper headline, ONE graphic, a credit strip — and they differ
 * only in ground and in which graphic they carry.
 *
 * A screenshot could not do any of this. The card is composed for a thumbnail moving
 * past at speed: one line of type the size of a fist, one image, one address.
 *
 * Type here is set the way the press sets it: skewed a few degrees, and printed twice —
 * ink first at a hard offset, colour over it. That offset is not a drop shadow, it is
 * the second plate.
 */

export const STORY_W = 1080
export const STORY_H = 1920
/** Instagram's own furniture lives here. Nothing important may enter it. */
export const SAFE = 260

export type StoryTemplate = 'score' | 'grass' | 'ink' | 'kit' | 'year' | 'art'

/**
 * הציורים — Maor's own artwork, and the only images this card system carries.
 *
 * Each one is a palette PNG whose colour table is provably free of yellow
 * (`scripts/brand/art.py`). They are not decoration: a card with a painting of the
 * terrace on it is a card somebody screenshots, and a card that is only type is a card
 * that announces a score. The rule for choosing is in `artFor()` — a result gets the
 * painting that matches what it is ABOUT, and gets the print card when nothing matches.
 */
export const ART = {
  celebration: '/art/celebration.png',
  numberSeven: '/art/number-seven.png',
  dribble: '/art/dribble.png',
} as const
export type ArtKey = keyof typeof ART

export type StoryCard = {
  template?: StoryTemplate
  /** the small Latin caps line — GATE 2 · TRIVIA */
  kicker: string
  /** the Hebrew title at the head */
  label: string
  /** the line printed above the hero */
  eyebrow: string
  /** the hero, as big as it will go */
  hero: string
  /** the one number the card is really about */
  bigStat?: { v: string; k: string }
  /** up to three stamped facts */
  stats: { k: string; v: string }[]
  /** the dare, on the foot */
  cta: string
  /** the line that says the link hands over the identical round */
  challenge: string
  /** every answer in the run — drives the punch grid on the score template */
  marks?: boolean[]
  /** the kit template draws this instead of a hero line */
  kit?: KitSpec
  /**
   * Which painting backs the card. Present means the `art` template is used and the
   * whole top of the plate is the picture; absent means the print card, which has to
   * stand on type alone and is drawn harder for exactly that reason.
   */
  art?: ArtKey
}

/**
 * Which painting a result earns.
 *
 * Not random and not decorative. A strong result gets the celebration — the terrace
 * photograph is the reward, and handing it out for four correct answers would spend it.
 * A shirt-number round gets the number seven. Everything else that mentions the pitch
 * gets the dribble, and anything left over gets no painting at all and prints instead.
 */
export function artFor(kind: string, fraction: number): ArtKey | undefined {
  if (fraction >= 0.75) return 'celebration'
  if (kind === 'numbers' || kind === 'kit') return 'numberSeven'
  if (kind === 'goal' || kind === 'lineup' || kind === 'xi' || kind === 'europe') return 'dribble'
  return undefined
}

/* ------------------------------------------------------------------ press helpers */

/**
 * החיתוך — the diagonal that separates the picture from the type.
 *
 * A straight horizontal edge between an image and a block of colour reads as a
 * PowerPoint slide. A hard diagonal reads as something that was cut with a blade and
 * pasted down, which is the whole language this brand is written in. The angle is
 * constant across every card for the same reason the misregistration is constant: a
 * varying one reads as a bug, a fixed one reads as a press.
 */
const CUT_DROP = 118

function cutPath(ctx: CanvasRenderingContext2D, bottom: number): void {
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(STORY_W, 0)
  ctx.lineTo(STORY_W, bottom - CUT_DROP)
  ctx.lineTo(0, bottom)
  ctx.closePath()
}

/**
 * Draw an image to COVER a box, never stretched.
 *
 * The three paintings have three different aspect ratios and one of them is nearly
 * square; fitting them to the box would letterbox two of the three, and stretching them
 * would be worse than either.
 */
function cover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  focusY = 0.42,
): void {
  const iw = (image as HTMLImageElement).naturalWidth || (image as HTMLCanvasElement).width
  const ih = (image as HTMLImageElement).naturalHeight || (image as HTMLCanvasElement).height
  if (!iw || !ih) return
  const scale = Math.max(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) * focusY, dw, dh)
}

/**
 * The picture, printed rather than photographed.
 *
 * A flat photograph on a screenprinted card is the wrong material. Two passes fix it:
 * a vermilion wash at low alpha in `multiply`, which pulls every hue toward the plate,
 * and the halftone screen over the top. The painting keeps its drawing and loses its
 * photographic surface — which is exactly what a press does to a photograph.
 */
function pressImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  bottom: number,
): void {
  ctx.save()
  cutPath(ctx, bottom)
  ctx.clip()
  ctx.fillStyle = BRAND.ink
  ctx.fillRect(0, 0, STORY_W, bottom)
  cover(ctx, image, 0, 0, STORY_W, bottom)

  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 0.22
  ctx.fillStyle = BRAND.red
  ctx.fillRect(0, 0, STORY_W, bottom)

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  dots(ctx, BRAND.ink, 0.16, 16)

  // the ink line that closes every printed surface in this system
  ctx.globalAlpha = 1
  ctx.strokeStyle = BRAND.ink
  ctx.lineWidth = 14
  cutPath(ctx, bottom)
  ctx.stroke()
  ctx.restore()
}

function dots(ctx: CanvasRenderingContext2D, colour: string, alpha: number, step = 22) {
  ctx.save()
  ctx.fillStyle = colour
  ctx.globalAlpha = alpha
  for (let y = 0; y < STORY_H; y += step) {
    for (let x = 0; x < STORY_W; x += step) {
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

/** Shrink a line until it fits. A story headline that wraps has stopped being one. */
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
  while (ctx.measureText(text).width > maxWidth && current > 22) {
    current -= 4
    ctx.font = `${weight} ${current}px ${face}`
  }
  return current
}

/**
 * Set a line the way the press sets it: skewed, and printed twice — the under-plate at
 * a hard offset, the colour over it. `skew` is in degrees, negative leans forward.
 */
/** True for a run that is only digits, punctuation and Latin — 4-4-2, 90%, 2:1. */
function isLatinRun(text: string): boolean {
  return /^[\u0000-\u024F\s]+$/.test(text)
}

function plateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { under: string; over: string; offset?: number; skew?: number },
) {
  const offset = opts.offset ?? 8
  const skew = ((opts.skew ?? -6) * Math.PI) / 180
  ctx.save()
  ctx.transform(1, 0, Math.tan(skew), 1, 0, 0)
  ctx.fillStyle = opts.under
  ctx.fillText(text, x + offset, y + offset)
  ctx.fillStyle = opts.over
  ctx.fillText(text, x, y)
  ctx.restore()
}

function rays(ctx: CanvasRenderingContext2D, cx: number, cy: number, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = BRAND.red
  for (let angle = 0; angle < 360; angle += 11) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    const a1 = ((angle - 2.6) * Math.PI) / 180
    const a2 = ((angle + 2.6) * Math.PI) / 180
    ctx.lineTo(cx + Math.cos(a1) * 2200, cy + Math.sin(a1) * 2200)
    ctx.lineTo(cx + Math.cos(a2) * 2200, cy + Math.sin(a2) * 2200)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

/** The credit strip every template ends with: the name, the badge, and the address. */
function foot(
  ctx: CanvasRenderingContext2D,
  card: StoryCard,
  tone: { name: string; text: string; rule: string },
  badge: CanvasImageSource | null,
) {
  const pad = 76
  const right = STORY_W - pad
  const base = STORY_H - SAFE

  ctx.textAlign = 'start'
  ctx.direction = 'rtl'
  ctx.fillStyle = tone.rule
  ctx.fillRect(pad, base - 210, STORY_W - pad * 2, 8)

  ctx.textAlign = 'right'
  const ctaSize = fit(ctx, card.cta, 62, STORY_W - pad * 2 - 150, '"Suez One", serif', '400')
  ctx.font = `400 ${ctaSize}px "Suez One", serif`
  ctx.fillStyle = tone.text
  ctx.fillText(card.cta, right, base - 130)

  // The credit strip carries the NAME and the ADDRESS, and nothing else. It used to
  // print הפועל in the poster face with the name relegated to a grey subtitle — which
  // put the brand system where the name belongs. The product is called The Worker.
  ctx.direction = 'ltr'
  ctx.textAlign = 'right'
  ctx.font = '700 72px Karantina, sans-serif'
  ctx.fillStyle = tone.name
  ctx.fillText('THE WORKER', right, base - 30)

  if (badge) ctx.drawImage(badge, pad, base - 118, 104, 104)

  ctx.textAlign = 'left'
  ctx.font = '800 28px Archivo, sans-serif'
  ctx.fillStyle = tone.text
  ctx.fillText(SITE_LABEL.toUpperCase(), pad + 122, base - 64)
  ctx.font = '800 20px Archivo, sans-serif'
  ctx.fillStyle = tone.rule
  ctx.fillText('הפועל תל אביב · 1923', pad + 122, base - 30)
  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
}

/* ------------------------------------------------------------------ the kit, drawn */

const KIT_OUTLINE =
  'M78 20 L62 24 L18 48 L6 96 L46 110 L54 92 L54 214 L146 214 L146 92 L154 110 L194 96 L182 48 L138 24 L122 20 C116 34 84 34 78 20 Z'
const KIT_BODY = 'M62 24 L54 92 L54 214 L146 214 L146 92 L138 24 L122 20 C116 34 84 34 78 20 Z'
const KIT_SLEEVE_L = 'M62 24 L18 48 L6 96 L46 110 L54 92 Z'
const KIT_SLEEVE_R = 'M138 24 L182 48 L194 96 L154 110 L146 92 Z'

/** The tokens are CSS vars in the app; on a canvas they have to be real values. */
const KIT_HEX: Record<string, string> = {
  red: BRAND.red,
  cream: BRAND.sheet,
  ink: BRAND.ink,
  paper: BRAND.paper,
  navy: BRAND.sign,
  deep: '#B81C14',
}
const hex = (name: string) => KIT_HEX[name] ?? BRAND.red

/**
 * Draw the shirt at (x, y) scaled to `width`. Reuses the SAME path data as
 * `KitShirt.tsx` through `Path2D`, so the shirt on the card and the shirt on the screen
 * cannot drift into two different drawings.
 */
function drawKit(ctx: CanvasRenderingContext2D, spec: KitSpec, x: number, y: number, width: number) {
  const scale = width / 200
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  const all = new Path2D(KIT_OUTLINE)
  const body = new Path2D(KIT_BODY)
  const base = hex(spec.base)
  const ink = hex(spec.patternInk)

  ctx.save()
  ctx.clip(all)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 200, 240)
  ctx.restore()

  ctx.save()
  ctx.clip(body)
  ctx.fillStyle = ink
  switch (spec.pattern) {
    case 'stripe-wide':
      for (let sx = 0; sx < 200; sx += 26) ctx.fillRect(sx, 0, 13, 240)
      break
    case 'pinstripe':
      for (let sx = 0; sx < 200; sx += 10) ctx.fillRect(sx, 0, 3, 240)
      break
    case 'hoop-tonal':
      for (let sy = 0; sy < 240; sy += 20) ctx.fillRect(0, sy, 200, 9)
      break
    case 'side-panel':
      ctx.fillRect(54, 0, 16, 240)
      ctx.fillRect(130, 0, 16, 240)
      break
    case 'halves':
      ctx.fillRect(100, 0, 100, 240)
      break
    case 'sash':
      ctx.fill(new Path2D('M40 240 L150 0 L196 0 L86 240 Z'))
      break
    case 'yoke-v':
      ctx.fill(new Path2D('M54 20 L100 96 L146 20 L146 44 L100 118 L54 44 Z'))
      break
    default:
      break
  }
  ctx.restore()

  // sleeves
  ctx.save()
  ctx.clip(new Path2D(KIT_SLEEVE_L))
  ctx.fillStyle = spec.sleeves === 'raglan' ? hex(spec.sleeveInk) : base
  ctx.fillRect(0, 0, 200, 240)
  ctx.restore()
  ctx.save()
  ctx.clip(new Path2D(KIT_SLEEVE_R))
  ctx.fillStyle = spec.sleeves === 'raglan' ? hex(spec.sleeveInk) : base
  ctx.fillRect(0, 0, 200, 240)
  ctx.restore()

  // collar
  ctx.fillStyle = hex(spec.collarInk)
  ctx.fill(new Path2D('M78 20 C84 34 116 34 122 20 L128 24 C120 42 80 42 72 24 Z'))

  // sponsor
  if (spec.sponsorHe) {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.fillStyle = hex(spec.base) === BRAND.sheet ? BRAND.red : BRAND.sheet
    ctx.font = '700 40px Karantina, sans-serif'
    ctx.fillText(spec.sponsorHe, 100, 142)
    ctx.restore()
  }

  ctx.strokeStyle = BRAND.ink
  ctx.lineWidth = 2.6
  ctx.stroke(all)
  ctx.restore()
}

/* ------------------------------------------------------------------ the templates */

export function drawStory(
  ctx: CanvasRenderingContext2D,
  card: StoryCard,
  badge: CanvasImageSource | null,
  art: CanvasImageSource | null = null,
): void {
  ctx.save()
  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
  // A card with a painting behind it is a different card, not a variant — so the art
  // template takes over the whole plate rather than being a background option on
  // another one. Without the image loaded it falls back to print, which is why a
  // failed fetch degrades to a good card instead of an empty one.
  const template: StoryTemplate = art && card.art ? 'art' : card.template ?? 'score'
  const pad = 76
  const right = STORY_W - pad
  const width = STORY_W - pad * 2

  if (template === 'art') {
    ctx.fillStyle = BRAND.ink
    ctx.fillRect(0, 0, STORY_W, STORY_H)
  } else if (template === 'grass') grass(ctx)
  else if (template === 'ink') {
    ctx.fillStyle = BRAND.ink
    ctx.fillRect(0, 0, STORY_W, STORY_H)
  } else if (template === 'year') {
    ctx.fillStyle = BRAND.red
    ctx.fillRect(0, 0, STORY_W, STORY_H)
    dots(ctx, BRAND.ink, 0.14)
  } else if (template === 'kit') {
    ctx.fillStyle = BRAND.paper
    ctx.fillRect(0, 0, STORY_W, STORY_H)
    rays(ctx, STORY_W + 120, -180, 0.3)
  } else {
    ctx.fillStyle = BRAND.sheet
    ctx.fillRect(0, 0, STORY_W, STORY_H)
    dots(ctx, BRAND.ink, 0.09)
  }

  // the red bands, on the templates the design gives them to
  if (template === 'score' || template === 'ink') {
    ctx.fillStyle = BRAND.red
    ctx.fillRect(0, 0, STORY_W, 96)
    ctx.fillRect(0, STORY_H - 96, STORY_W, 96)
  }

  const dark = template === 'ink' || template === 'grass' || template === 'art'
  const headline = dark ? BRAND.sheet : BRAND.ink
  const kickerColour =
    template === 'kit'
      ? BRAND.sign
      : template === 'ink' || template === 'art'
        ? BRAND.red
        : template === 'year'
          ? BRAND.ink
          : BRAND.sign

  // ART · the picture takes the top two thirds, the type is slammed over the cut, and
  //       the facts and the credit sit on the ink below it. This branch returns early
  //       because it is a whole card, not a variation on the print one.
  if (template === 'art' && art) {
    // The card is laid out from the FOOT upward, not from the top down. Everything
    // below the picture is anchored — challenge line, facts panel, credit strip — so
    // flowing the type downward from the cut is what produced the first version's
    // collisions and its second version's hole. Anchoring means the picture takes
    // whatever room is left over, which is also the right answer aesthetically: the
    // painting should be as big as the type allows.
    const artChallengeY = STORY_H - SAFE - 236
    const bandH = card.stats.length > 0 ? 134 : 0
    const bandTop = artChallengeY - 40 - bandH
    const cut = Math.round(STORY_H * 0.56)

    pressImage(ctx, art, cut)

    // the kicker, printed ON the picture at the top safe line
    ctx.direction = 'ltr'
    ctx.textAlign = 'right'
    ctx.font = '800 30px Archivo, sans-serif'
    ctx.letterSpacing = '6px'
    ctx.fillStyle = BRAND.sheet
    ctx.fillText(card.kicker, right, SAFE - 8)
    ctx.letterSpacing = '0px'
    ctx.direction = 'rtl'

    // The NAME sits on the picture, just above the cut. It is the half of the card a
    // reader recognises, and on the ink below it was competing with the number for the
    // same 70 pixels; over the painting it has the whole width and reads as a caption
    // stamped on a photograph.
    //
    // The clearance is not a guess. The number below is set in Karantina at `heroSize`
    // with its baseline at `cut + heroSize * 0.30`, and that face's caps reach about
    // 0.72em above the baseline — so its glyph tops land near `cut - heroSize * 0.42`.
    // The name's baseline has to clear THAT, not the cut, which is what the first
    // version got wrong: the two printed straight through each other.
    const heroSizePlanned = Math.min(fit(ctx, card.bigStat?.v ?? card.hero, 210, width), 210)
    const nameText = card.bigStat ? card.hero : ''
    if (nameText) {
      const nameSize = fit(ctx, nameText, 86, width, '"Suez One", serif', '400')
      ctx.font = `400 ${nameSize}px "Suez One", serif`
      plateText(ctx, nameText, right, cut - heroSizePlanned * 0.42 - 26, {
        under: BRAND.ink,
        over: BRAND.sheet,
        offset: 8,
        skew: -6,
      })
    }

    // The number straddles the cut: most of the glyph on the picture, its feet on the
    // ink. One element crossing the join is what makes a card look built rather than
    // stacked, and it is the only thing on the plate allowed to break the line.
    const heroText = card.bigStat?.v ?? card.hero
    const heroSize = heroSizePlanned
    ctx.font = `700 ${heroSize}px Karantina, sans-serif`
    // "4-4-2" and "90%" are Latin runs and must print left to right, or the canvas's
    // RTL direction reverses them into 2-4-4 and %90.
    ctx.direction = isLatinRun(heroText) ? 'ltr' : 'rtl'
    plateText(ctx, heroText, right, cut + heroSize * 0.30, {
      under: BRAND.ink,
      over: BRAND.red,
      offset: 12,
      skew: -6,
    })
    ctx.direction = 'rtl'

    const labelY = cut + heroSize * 0.30 + 48
    ctx.fillStyle = BRAND.concrete
    ctx.font = '400 32px Heebo, sans-serif'
    ctx.fillText(card.bigStat?.k ?? card.eyebrow, right, labelY)

    ctx.fillStyle = BRAND.red
    ctx.fillRect(pad, Math.min(labelY + 30, bandTop - 24), width, 10)

    if (card.stats.length > 0) {
      // a real ink panel with a vermilion keyline, not two floating labels: on a
      // picture card the facts need a ground of their own or the painting reads
      // straight through them
      ctx.fillStyle = BRAND.ink
      ctx.fillRect(pad, bandTop, width, bandH)
      ctx.strokeStyle = BRAND.red
      ctx.lineWidth = 6
      ctx.strokeRect(pad + 3, bandTop + 3, width - 6, bandH - 6)

      const rows = card.stats.slice(0, 2)
      const cell = (width - 56) / rows.length
      rows.forEach((stat, index) => {
        const cellRight = right - 28 - index * cell
        ctx.fillStyle = BRAND.red
        ctx.font = '400 23px Heebo, sans-serif'
        ctx.fillText(stat.k, cellRight, bandTop + 44)
        const size = fit(ctx, stat.v, 44, cell - 24, '"Suez One", serif', '400')
        ctx.font = `400 ${size}px "Suez One", serif`
        ctx.fillStyle = BRAND.sheet
        ctx.fillText(stat.v, cellRight, bandTop + 52 + size)
      })
    }

    ctx.fillStyle = BRAND.concrete
    ctx.font = '400 28px Heebo, sans-serif'
    ctx.fillText(card.challenge, right, artChallengeY)

    foot(ctx, card, { name: BRAND.red, text: BRAND.sheet, rule: BRAND.red }, badge)
    ctx.restore()
    return
  }

  // 1 · the kicker
  ctx.direction = 'ltr'
  ctx.textAlign = 'right'
  ctx.font = '800 30px Archivo, sans-serif'
  ctx.fillStyle = kickerColour
  ctx.letterSpacing = '6px'
  ctx.fillText(card.kicker, right, SAFE + 18)
  ctx.letterSpacing = '0px'
  ctx.direction = 'rtl'

  // 2 · the headline. The eyebrow gets its own line under the kicker — stacking it on
  //     the same baseline put two different sizes of type on one line, which read as a
  //     collision rather than as a hierarchy.
  let y = SAFE + 62
  if (template === 'year') {
    const size = fit(ctx, card.hero, 280, width)
    ctx.font = `700 ${size}px Karantina, sans-serif`
    plateText(ctx, card.hero, right, y + size * 0.78, {
      under: BRAND.ink,
      over: BRAND.sheet,
      offset: 12,
      skew: 0,
    })
    y += size * 0.78 + 70
  } else if (template === 'kit') {
    const size = fit(ctx, card.hero, 132, width)
    ctx.font = `700 ${size}px Karantina, sans-serif`
    plateText(ctx, card.hero, right, y + size * 0.8, {
      under: BRAND.sign,
      over: BRAND.red,
      offset: 7,
      skew: 0,
    })
    y += size * 0.8 + 40
  } else {
    ctx.fillStyle = dark ? BRAND.concrete : BRAND.muted
    ctx.font = '400 30px Heebo, sans-serif'
    ctx.fillText(card.eyebrow, right, y)
    const size = fit(ctx, card.hero, 118, width, '"Suez One", serif', '400')
    ctx.font = `400 ${size}px "Suez One", serif`
    plateText(ctx, card.hero, right, y + 54 + size * 0.82, {
      under: BRAND.red,
      over: headline,
      offset: 9,
      skew: -6,
    })
    y += 54 + size * 0.82 + 56
    ctx.fillStyle = headline
    ctx.fillRect(pad, y, width, 10)
    y += 70
  }

  // 3 · the graphic
  if (template === 'kit' && card.kit) {
    // sized to the room actually left between the headline and the facts box, so the
    // shirt is as big as the card can make it instead of a fixed thumbnail
    const room = STORY_H - SAFE - 236 - 56 - (42 + Math.min(card.stats.length, 3) * 96) - y - 30
    const kitWidth = Math.max(260, Math.min(width - 180, room / 1.2))
    drawKit(ctx, card.kit, (STORY_W - kitWidth) / 2, y, kitWidth)
    y += kitWidth * 1.2 + 30
  } else if (card.marks && card.marks.length > 0 && template === 'score') {
    const cols = 6
    const cell = (width - 18 * (cols - 1)) / cols
    card.marks.slice(0, 12).forEach((mark, index) => {
      const cx = right - (index % cols) * (cell + 18) - cell
      const cy = y + Math.floor(index / cols) * (cell + 18)
      ctx.fillStyle = mark ? BRAND.red : BRAND.sheet
      ctx.fillRect(cx, cy, cell, cell)
      ctx.strokeStyle = BRAND.ink
      ctx.lineWidth = 6
      ctx.strokeRect(cx, cy, cell, cell)
      ctx.fillStyle = mark ? BRAND.sheet : BRAND.ink
      ctx.font = '700 60px Karantina, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(mark ? '✓' : '✗', cx + cell / 2, cy + cell * 0.72)
      ctx.textAlign = 'right'
    })
    y += Math.ceil(Math.min(card.marks.length, 12) / cols) * (cell + 18) + 40
  } else if (card.bigStat) {
    const size = fit(ctx, card.bigStat.v, 220, width)
    ctx.font = `700 ${size}px Karantina, sans-serif`
    plateText(ctx, card.bigStat.v, right, y + size * 0.76, {
      under: BRAND.sign,
      over: BRAND.red,
      offset: 8,
      skew: 0,
    })
    y += size * 0.76 + 26
    ctx.fillStyle = dark ? BRAND.concrete : BRAND.muted
    ctx.font = '400 32px Heebo, sans-serif'
    ctx.fillText(card.bigStat.k, right, y + 26)
    y += 92
  }

  // 4 · the facts, in an ink box ANCHORED to the foot rather than flowed after the
  //     graphic. Flowing it let a tall graphic push the box down over the challenge
  //     line; anchoring it means the two can never collide whatever the hero does.
  const challengeY = STORY_H - SAFE - 236
  if (card.stats.length > 0) {
    const rows = card.stats.slice(0, 3)
    // Two or three SHORT facts sit side by side, the way PATTERN / COLLAR / ERA does in
    // the handoff. Stacking them left most of the plate empty, and an ink box that is
    // mostly empty reads as a mistake rather than as a panel.
    const across = rows.length > 1 && rows.every((row) => row.v.length <= 16)
    const boxH = across ? 150 : 42 + rows.length * 96
    const boxTop = Math.max(y, challengeY - 56 - boxH)
    ctx.fillStyle = BRAND.ink
    ctx.fillRect(pad, boxTop, width, boxH)

    if (across) {
      const cell = (width - 52) / rows.length
      rows.forEach((stat, index) => {
        const cellRight = right - 26 - index * cell
        ctx.fillStyle = BRAND.red
        ctx.font = '400 24px Heebo, sans-serif'
        ctx.fillText(stat.k, cellRight, boxTop + 56)
        const size = fit(ctx, stat.v, 44, cell - 20, '"Suez One", serif', '400')
        ctx.font = `400 ${size}px "Suez One", serif`
        ctx.fillStyle = BRAND.sheet
        ctx.fillText(stat.v, cellRight, boxTop + 62 + size)
      })
    } else {
      let ly = boxTop + 66
      for (const stat of rows) {
        ctx.fillStyle = BRAND.red
        ctx.font = '400 24px Heebo, sans-serif'
        ctx.fillText(stat.k, right - 26, ly)
        const size = fit(ctx, stat.v, 46, width - 60, '"Suez One", serif', '400')
        ctx.font = `400 ${size}px "Suez One", serif`
        ctx.fillStyle = BRAND.sheet
        ctx.fillText(stat.v, right - 26, ly + size + 6)
        ly += 96
      }
    }
  }

  // 5 · the challenge line, just above the credit strip
  ctx.fillStyle = dark ? BRAND.concrete : template === 'year' ? BRAND.ink : BRAND.sign
  ctx.font = '400 28px Heebo, sans-serif'
  ctx.fillText(card.challenge, right, challengeY)

  foot(
    ctx,
    card,
    dark || template === 'year'
      ? { name: template === 'year' ? BRAND.ink : BRAND.red, text: BRAND.sheet, rule: BRAND.red }
      : { name: BRAND.red, text: BRAND.ink, rule: BRAND.red },
    badge,
  )
  ctx.restore()
}

/** The mown pitch, for the grass template. */
function grass(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#3D8B41'
  ctx.fillRect(0, 0, STORY_W, STORY_H)
  ctx.fillStyle = '#46A04B'
  for (let y = 0; y < STORY_H; y += 320) ctx.fillRect(0, y, STORY_W, 160)
  dots(ctx, BRAND.ink, 0.1, 18)
}

/* ------------------------------------------------------------------ the PNG */

export async function renderStory(
  card: StoryCard,
  badgeSrc = '/brand/logo-512.png',
): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = STORY_W
  canvas.height = STORY_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // The faces must be resident before the first fillText, or the canvas silently falls
  // back to a system font and the card ships in the wrong voice.
  if (document.fonts?.ready) {
    try {
      await Promise.all([
        document.fonts.load('700 200px Karantina'),
        document.fonts.load('400 118px "Suez One"'),
        document.fonts.load('400 30px Heebo'),
        document.fonts.load('800 30px Archivo'),
      ])
      await document.fonts.ready
    } catch {
      // a missing face is a worse-looking card, not a failed share
    }
  }

  const badge = await loadImage(badgeSrc).catch(() => null)
  // A failed painting fetch must not fail the share: `drawStory` falls back to the
  // print card when the image is null, which is a good card rather than an empty one.
  const art = card.art ? await loadImage(ART[card.art]).catch(() => null) : null
  drawStory(ctx, card, badge, art)
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

/** Kept so a component importing the palette does not reach for the CSS var map. */
export const KIT_TOKEN_VARS = COLOUR_VAR
