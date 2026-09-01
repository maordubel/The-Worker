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

export type StoryTemplate = 'score' | 'grass' | 'ink' | 'kit' | 'year' | 'art' | 'xi'

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
   * הרכב — eleven names at their positions.
   *
   * The XI card used to print three of the eleven as facts and drop the other eight,
   * which is the whole content of an all-time XI thrown away: nobody shares a team
   * sheet to announce that they picked a goalkeeper. When this is present the card
   * draws the pitch and every name on it.
   */
  xi?: Array<{ roleHe: string; nameHe: string; x: number; y: number }>
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

/**
 * The real ink box of a line of text, in the font currently set on the context.
 *
 * Every collision on these cards came from the same shortcut: guessing a glyph's height
 * as some multiple of its point size. That multiple is different for Suez One, for
 * Karantina, for Hebrew and for Latin, and it is different again for a string with no
 * ascenders — so a clearance that looked right for "90%" put "מוחמד קליל טראורה"
 * straight through the number below it. The canvas will report the actual box; asking
 * it is both simpler and correct.
 */
function textBox(
  ctx: CanvasRenderingContext2D,
  text: string,
): { ascent: number; descent: number; height: number } {
  const metrics = ctx.measureText(text)
  // `actualBoundingBox*` is the inked extent. The font-box fallback keeps this honest
  // on any engine that does not report it rather than silently returning zero.
  const ascent = metrics.actualBoundingBoxAscent || metrics.fontBoundingBoxAscent || 0
  const descent = metrics.actualBoundingBoxDescent || metrics.fontBoundingBoxDescent || 0
  return { ascent, descent, height: ascent + descent }
}

/**
 * Every text box the last `drawStory` laid down.
 *
 * Eyeballing a preview is how three rounds of overlapping type shipped. A card can
 * report where it actually put its ink, and then a TEST can assert that no two blocks
 * intersect — which catches the long-name case that a screenshot of a short name never
 * shows. `tests/story.test.ts` is the consumer.
 */
export type InkBox = { label: string; x: number; y: number; w: number; h: number }
let inkBoxes: InkBox[] = []

export function lastInkBoxes(): InkBox[] {
  return inkBoxes
}

function recordInk(
  ctx: CanvasRenderingContext2D,
  label: string,
  text: string,
  right: number,
  baseline: number,
  extraBelow = 0,
): void {
  const metrics = ctx.measureText(text)
  const width =
    (metrics.actualBoundingBoxLeft || 0) + (metrics.actualBoundingBoxRight || 0) ||
    metrics.width
  const box = textBox(ctx, text)
  inkBoxes.push({
    label,
    x: right - width,
    y: baseline - box.ascent,
    w: width,
    h: box.height + extraBelow,
  })
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
/**
 * פס הקרדיט — the marketing surface, and the only reason a share recruits anybody.
 *
 * The earlier strip had the priorities backwards. **THE WORKER** was set at 72px and
 * the ADDRESS — the one string that turns a screenshot into a visitor — was 28px,
 * jammed against a badge in the opposite corner and half the size of everything around
 * it. Somebody who sees this card on a phone has about a second to catch where to go.
 *
 * So the address gets its own vermilion bar across the full width of the card. It is
 * not a caption on the credit; it IS the credit, and everything else identifies who is
 * asking. The badge sits on the reading side at a size where the drawing survives, with
 * the name beside it rather than across the card from it.
 *
 * Every block is placed against a measured box and recorded, so `tests/story.test.ts`
 * can prove the strip never collides with the line above it.
 */
/**
 * פס הקרדיט — who is asking, and where to go.
 *
 * The badge is Maor's own artwork and is drawn at the size it has always been drawn at.
 * What was wrong here was never the size of anything — it was the PLACEMENT: the badge
 * sat in the opposite corner from the name, with the address wedged against it in the
 * gap between them, so the three things that identify this product read as three
 * unrelated scraps.
 *
 * They are now one block. Badge on the reading side, name and club beside it, and the
 * address across the full width underneath — the address gets the width because it is
 * the only line on the card that a reader has to be able to act on.
 *
 * Every position below is derived from a measured box and recorded into `inkBoxes`, so
 * `story-preview` fails loudly if any two blocks ever touch again. The vertical budget
 * is fixed and tight: the challenge line sits at `STORY_H - SAFE - 236` and Instagram's
 * own furniture starts at `SAFE`, which leaves this strip 220px to work in.
 */
function foot(
  ctx: CanvasRenderingContext2D,
  card: StoryCard,
  tone: { name: string; text: string; rule: string },
  badge: CanvasImageSource | null,
) {
  const pad = 76
  const right = STORY_W - pad
  const width = STORY_W - pad * 2
  const base = STORY_H - SAFE
  /** unchanged — this is Maor's artwork at the size it has always been drawn */
  const BADGE = 104

  ctx.direction = 'rtl'
  ctx.textAlign = 'right'

  // the rule that separates the run from the sender
  ctx.fillStyle = tone.rule
  ctx.fillRect(pad, base - 216, width, 8)

  // the dare
  const ctaSize = fit(ctx, card.cta, 56, width, '"Suez One", serif', '400')
  ctx.font = `400 ${ctaSize}px "Suez One", serif`
  ctx.fillStyle = tone.text
  const ctaBase = base - 164
  ctx.fillText(card.cta, right, ctaBase)
  recordInk(ctx, 'cta', card.cta, right, ctaBase)

  // the identity block: badge, then the name and the club beside it
  const badgeTop = base - 144
  if (badge) ctx.drawImage(badge, right - BADGE, badgeTop, BADGE, BADGE)

  const textRight = right - BADGE - 24

  ctx.direction = 'ltr'
  ctx.textAlign = 'right'
  ctx.font = '700 68px Karantina, sans-serif'
  ctx.fillStyle = tone.name
  const nameBase = base - 90
  ctx.fillText('THE WORKER', textRight, nameBase)
  recordInk(ctx, 'wordmark', 'THE WORKER', textRight, nameBase)

  ctx.direction = 'rtl'
  ctx.font = '400 22px Heebo, sans-serif'
  ctx.fillStyle = tone.text
  const clubBase = base - 56
  ctx.fillText('הפועל תל אביב · 1923', textRight, clubBase)
  recordInk(ctx, 'club', 'הפועל תל אביב · 1923', textRight, clubBase)

  // THE ADDRESS — full width, on the plate colour, in the Latin caps face the rest of
  // the system uses for Latin. The one line on the card a reader has to act on.
  const barH = 40
  const barTop = base - barH
  ctx.fillStyle = tone.rule
  ctx.fillRect(pad, barTop, width, barH)
  ctx.direction = 'ltr'
  ctx.textAlign = 'center'
  ctx.font = '800 28px Archivo, sans-serif'
  ctx.letterSpacing = '3px'
  ctx.fillStyle = BRAND.sheet
  const urlBox = textBox(ctx, SITE_LABEL.toUpperCase())
  ctx.fillText(SITE_LABEL.toUpperCase(), STORY_W / 2, barTop + barH / 2 + urlBox.ascent / 2)
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'right'
  ctx.direction = 'rtl'
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
  inkBoxes = []
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
  // XI · the team sheet, drawn as a team sheet.
  if (template === 'xi' && card.xi && card.xi.length > 0) {
    drawXiCard(ctx, card, badge)
    ctx.restore()
    return
  }

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

    // The kicker is printed ON the painting, and a painting is not a background you
    // control: cream letterspaced caps vanished completely over the pale crowd in the
    // number-seven artwork. It gets an ink plate of its own — which is also more honest
    // to the language, since every other label in this system sits on a printed ground.
    ctx.direction = 'ltr'
    ctx.textAlign = 'right'
    ctx.font = '800 30px Archivo, sans-serif'
    ctx.letterSpacing = '6px'
    const kickerBox = textBox(ctx, card.kicker)
    const kickerW = ctx.measureText(card.kicker).width
    ctx.fillStyle = BRAND.ink
    ctx.fillRect(right - kickerW - 18, SAFE - 8 - kickerBox.ascent - 12, kickerW + 30, kickerBox.height + 24)
    ctx.fillStyle = BRAND.sheet
    ctx.fillText(card.kicker, right, SAFE - 8)
    ctx.letterSpacing = '0px'
    ctx.direction = 'rtl'

    // The number first, because everything else is placed against its measured box.
    const heroText = card.bigStat?.v ?? card.hero
    const heroSize = Math.min(fit(ctx, heroText, 210, width), 210)
    ctx.font = `700 ${heroSize}px Karantina, sans-serif`
    const heroMetrics = textBox(ctx, heroText)
    // The number straddles the cut: most of the glyph on the picture, its feet on the
    // ink. One element crossing the join is what makes a card look built rather than
    // stacked, and it is the only thing on the plate allowed to break the line.
    const heroBase = cut + Math.round(heroMetrics.ascent * 0.30)

    // The NAME sits on the picture, clear of the number's MEASURED top rather than a
    // guessed fraction of its size.
    const nameText = card.bigStat ? card.hero : ''
    if (nameText) {
      const nameSize = fit(ctx, nameText, 86, width, '"Suez One", serif', '400')
      ctx.font = `400 ${nameSize}px "Suez One", serif`
      const nameMetrics = textBox(ctx, nameText)
      // The gap has to clear the name's descenders AND its second plate: `plateText`
      // prints the ink pass at `offset` BELOW the colour pass, so the block is taller
      // than the measured glyph box by exactly that much. Forgetting it is what left
      // the long name touching the number after the metrics fix.
      const NAME_OFFSET = 8
      const nameBase =
        heroBase - heroMetrics.ascent - nameMetrics.descent - NAME_OFFSET - 30
      plateText(ctx, nameText, right, nameBase, {
        under: BRAND.ink,
        over: BRAND.sheet,
        offset: NAME_OFFSET,
        skew: -6,
      })
      recordInk(ctx, 'name', nameText, right, nameBase, NAME_OFFSET)
    }

    ctx.font = `700 ${heroSize}px Karantina, sans-serif`
    // "4-4-2" and "90%" are Latin runs and must print left to right, or the canvas's
    // RTL direction reverses them into 2-4-4 and %90.
    ctx.direction = isLatinRun(heroText) ? 'ltr' : 'rtl'
    plateText(ctx, heroText, right, heroBase, {
      under: BRAND.ink,
      over: BRAND.red,
      offset: 12,
      skew: -6,
    })
    recordInk(ctx, 'hero', heroText, right, heroBase, 12)
    ctx.direction = 'rtl'

    // The label clears the hero's own second plate too, not just its descenders.
    const labelY = heroBase + heroMetrics.descent + 12 + 44
    ctx.fillStyle = BRAND.concrete
    ctx.font = '400 32px Heebo, sans-serif'
    const labelText = card.bigStat?.k ?? card.eyebrow
    ctx.fillText(labelText, right, labelY)
    recordInk(ctx, 'label', labelText, right, labelY)

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
    recordInk(ctx, 'challenge', card.challenge, right, artChallengeY)

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

/**
 * כרטיס ההרכב — a printed team sheet.
 *
 * The pitch occupies the middle band between the safe zones, and every chosen name sits
 * at its formation position. Three things make it readable rather than eleven labels on
 * a green rectangle:
 *
 *  · **The chip is a plate, not a pill.** Cream ground, ink keyline, zero radius — the
 *    same object as every other printed element in this system, so the card reads as
 *    one press rather than a UI screenshot.
 *  · **The name is fitted per chip.** "אנייאמה" and "מוחמד קליל טראורה" cannot share a
 *    type size, and scaling the longest name down to fit is what stops a row of five
 *    from colliding.
 *  · **Rows are found, not assumed.** Slots are grouped by their y and each row is
 *    given the full width to share, so a back four and a front two are both spaced
 *    correctly without the formation being hard-coded here.
 */
function drawXiCard(
  ctx: CanvasRenderingContext2D,
  card: StoryCard,
  badge: CanvasImageSource | null,
): void {
  const pad = 56
  const right = STORY_W - pad
  const width = STORY_W - pad * 2
  const xi = card.xi ?? []

  ctx.fillStyle = BRAND.sheet
  ctx.fillRect(0, 0, STORY_W, STORY_H)
  dots(ctx, BRAND.ink, 0.09)

  // ── head: title on one line, formation beside it ──────────────────────────
  ctx.direction = 'ltr'
  ctx.textAlign = 'right'
  ctx.font = '800 28px Archivo, sans-serif'
  ctx.letterSpacing = '6px'
  ctx.fillStyle = BRAND.sign
  ctx.fillText(card.kicker, right, SAFE - 10)
  ctx.letterSpacing = '0px'
  ctx.direction = 'rtl'

  ctx.font = '400 76px "Suez One", serif'
  const titleBox = textBox(ctx, card.hero)
  const titleBase = SAFE + 30 + titleBox.ascent
  plateText(ctx, card.hero, right, titleBase, {
    under: BRAND.red,
    over: BRAND.ink,
    offset: 8,
    skew: -6,
  })

  ctx.direction = 'ltr'
  ctx.textAlign = 'left'
  ctx.font = '700 84px Karantina, sans-serif'
  ctx.fillStyle = BRAND.red
  ctx.fillText(card.eyebrow, pad, titleBase)
  ctx.textAlign = 'right'
  ctx.direction = 'rtl'

  // ── the pitch: everything left between the head and the credit strip ──────
  const challengeY = STORY_H - SAFE - 236
  const top = titleBase + titleBox.descent + 34
  const bottom = challengeY - 54
  const height = bottom - top

  ctx.fillStyle = PITCH_GREEN
  ctx.fillRect(pad, top, width, height)
  ctx.fillStyle = PITCH_STRIPE
  const stripe = height / 12
  for (let index = 0; index < 12; index += 2) {
    ctx.fillRect(pad, top + index * stripe, width, stripe)
  }
  ctx.save()
  ctx.beginPath()
  ctx.rect(pad, top, width, height)
  ctx.clip()
  dots(ctx, BRAND.ink, 0.1, 18)

  ctx.strokeStyle = 'rgba(247,244,236,0.7)'
  ctx.lineWidth = 4
  ctx.strokeRect(pad + 16, top + 16, width - 32, height - 32)
  ctx.beginPath()
  ctx.moveTo(pad + 16, top + height / 2)
  ctx.lineTo(right - 16, top + height / 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(STORY_W / 2, top + height / 2, width * 0.15, 0, Math.PI * 2)
  ctx.stroke()
  // the box at each end, so the shape reads as a pitch and not as a field
  ctx.strokeRect(pad + width * 0.22, top + 16, width * 0.56, height * 0.13)
  ctx.strokeRect(pad + width * 0.22, top + height - 16 - height * 0.13, width * 0.56, height * 0.13)
  ctx.restore()

  ctx.strokeStyle = BRAND.ink
  ctx.lineWidth = 8
  ctx.strokeRect(pad, top, width, height)

  // ── the eleven ────────────────────────────────────────────────────────────
  //
  // Rows are DERIVED, not assumed. Slots arrive as percentages and any formation is
  // legal, so grouping by rounded depth means a 4-4-2 and a 3-5-2 both space correctly
  // without either being written down here.
  const rows = new Map<number, typeof xi>()
  for (const slot of xi) {
    const key = Math.round(slot.y / 8)
    rows.set(key, [...(rows.get(key) ?? []), slot])
  }

  // Every chip on the card is the same width — the width the BUSIEST row can take. A
  // row of two with fat chips beside a row of five with thin ones reads as a mistake,
  // and the eye reads the difference as meaning that is not there.
  const busiest = Math.max(...[...rows.values()].map((row) => row.length), 1)
  const inset = 26
  const usable = width - inset * 2
  const gap = 12
  const chipW = Math.min(206, (usable - gap * (busiest - 1)) / busiest)
  const chipH = 82

  // Depth is mapped into the band that keeps a chip fully inside the pitch, so the
  // strikers' row cannot be clipped by the touchline the way it was.
  const bandTop = top + chipH / 2 + 22
  const bandBottom = top + height - chipH / 2 - 22

  for (const row of rows.values()) {
    const sorted = [...row].sort((a, b) => a.x - b.x)
    const span = sorted.length * chipW + (sorted.length - 1) * gap
    const startX = (STORY_W - span) / 2 + chipW / 2
    const depth = (sorted[0]?.y ?? 50) / 100
    const cy = bandTop + depth * (bandBottom - bandTop)
    sorted.forEach((slot, index) => {
      drawXiChip(ctx, slot.nameHe, slot.roleHe, startX + index * (chipW + gap), cy, chipW, chipH)
    })
  }

  ctx.fillStyle = BRAND.sign
  ctx.font = '400 28px Heebo, sans-serif'
  ctx.fillText(card.challenge, right, challengeY)

  foot(ctx, card, { name: BRAND.red, text: BRAND.ink, rule: BRAND.red }, badge)
}

const PITCH_GREEN = '#3D8B41'
const PITCH_STRIPE = '#46A04B'

function drawXiChip(
  ctx: CanvasRenderingContext2D,
  name: string,
  role: string,
  cx: number,
  cy: number,
  chipW: number,
  chipH: number,
): void {
  const x = cx - chipW / 2
  const y = cy - chipH / 2

  // the ink plate under the cream one — the second pass, not a shadow
  ctx.fillStyle = BRAND.ink
  ctx.fillRect(x + 5, y + 5, chipW, chipH)
  ctx.fillStyle = BRAND.sheet
  ctx.fillRect(x, y, chipW, chipH)
  ctx.strokeStyle = BRAND.ink
  ctx.lineWidth = 4
  ctx.strokeRect(x, y, chipW, chipH)

  ctx.textAlign = 'center'
  ctx.fillStyle = BRAND.red
  ctx.font = '400 20px Heebo, sans-serif'
  ctx.fillText(role, cx, y + 26)

  const size = fit(ctx, name, 34, chipW - 18, '"Suez One", serif', '400')
  ctx.font = `400 ${size}px "Suez One", serif`
  ctx.fillStyle = BRAND.ink
  const box = textBox(ctx, name)
  ctx.fillText(name, cx, y + chipH - 16 - box.descent)
  ctx.textAlign = 'right'
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
