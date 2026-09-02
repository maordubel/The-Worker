import type { LIFE_PALETTE } from './palette'

/**
 * הדמויות — placeholder figures, drawn rather than loaded.
 *
 * **These are placeholders and they are marked as such** (`ART-PLACEHOLDER` below and in
 * the handoff). They exist so the gameplay can be built, played and judged before a
 * single production sprite is cut, and so that the day the real transparent PNGs arrive,
 * nothing in a scene changes: `figureTexture()` returns a texture key either way, and
 * `registerFigure` will load a sheet instead of drawing one.
 *
 * What they are NOT is a licence to invent visual canon. Brief §29 lists the decisions
 * that are already made, and they are encoded here as data rather than left to whoever
 * draws next:
 *
 *   · **Ofir has a buzz cut.** `hair: 'buzz'`, and it is the only figure that has it.
 *   · **Amit wears no glasses.** No figure carries a glasses layer at all, so one cannot
 *     be added by accident.
 *   · **Kobi keeps his approved direction** — moustache, work shirt, jeans, boots.
 *   · **No core character wears yellow.** There is no yellow in the palette to reach
 *     for; `tests/life.test.ts` asserts every figure's colours come out of it.
 *
 * Three directions, three frames. The side view is drawn facing east and mirrored for
 * west, which halves the draw code and is what a real sheet would do anyway.
 */

export type HairStyle = 'curly' | 'buzz' | 'short' | 'long' | 'thin'

export type FigureSpec = {
  id: string
  /** total height in world pixels — a child is 34, an adult 46 */
  height: number
  skin: number
  hair: number
  hairStyle: HairStyle
  shirt: number
  /** a second shirt colour paints a band, a stripe or a jacket panel */
  shirtTrim?: number
  legs: number
  shoes: number
  moustache?: boolean
  /** Rachel's apron, a coach's tracksuit panel — one extra rectangle, no new layer type */
  apron?: number
  /** flat cap, headband */
  cap?: number
}

export type Direction = 'down' | 'up' | 'side'
export const DIRECTIONS: readonly Direction[] = ['down', 'up', 'side']
export const FRAMES = [0, 1, 2] as const

export function figureTexture(id: string, direction: Direction, frame: number): string {
  return `fig-${id}-${direction}-${frame}`
}

type Pen = {
  fillStyle(colour: number, alpha?: number): unknown
  fillRect(x: number, y: number, w: number, h: number): unknown
  fillEllipse(x: number, y: number, w: number, h: number): unknown
  fillTriangle(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): unknown
}

/**
 * One frame of one figure, drawn into a graphics pen at the origin.
 *
 * The proportions are a child's: a big head, short legs, a body that reads at 34 pixels
 * on a phone. Everything is derived from `height`, so an adult is the same routine with
 * a different number and the two can never drift into different characters.
 */
export function drawFigure(pen: Pen, spec: FigureSpec, direction: Direction, frame: number): void {
  const h = spec.height
  const w = Math.round(h * 0.62)
  const cx = w / 2

  const headH = Math.round(h * 0.3)
  const bodyH = Math.round(h * 0.34)
  const legH = h - headH - bodyH - 2
  const headY = 1
  const bodyY = headY + headH - 1
  const legY = bodyY + bodyH

  // The walk: one leg forward on frame 1, the other on frame 2, and a one-pixel bob on
  // both. A two-frame walk with a bob reads as walking; a four-frame one without does not.
  const step = frame === 0 ? 0 : frame === 1 ? 1 : -1
  const bob = frame === 0 ? 0 : 1

  const legW = Math.round(w * 0.28)
  const armW = Math.max(2, Math.round(w * 0.18))

  // --- legs -----------------------------------------------------------------------
  pen.fillStyle(spec.legs)
  if (direction === 'side') {
    pen.fillRect(cx - legW / 2 + step * 2, legY, legW, legH)
    pen.fillRect(cx - legW / 2 - step * 2, legY, legW, legH)
  } else {
    pen.fillRect(cx - legW - 1, legY, legW, legH - Math.abs(step))
    pen.fillRect(cx + 1, legY, legW, legH - Math.abs(step) * (step > 0 ? 0 : 1))
  }

  // --- shoes ----------------------------------------------------------------------
  pen.fillStyle(spec.shoes)
  const shoeH = Math.max(2, Math.round(h * 0.07))
  if (direction === 'side') {
    pen.fillRect(cx - legW / 2 + step * 2 - 1, legY + legH - shoeH, legW + 2, shoeH)
    pen.fillRect(cx - legW / 2 - step * 2 - 1, legY + legH - shoeH, legW + 2, shoeH)
  } else {
    pen.fillRect(cx - legW - 1, legY + legH - shoeH - Math.abs(step), legW, shoeH)
    pen.fillRect(cx + 1, legY + legH - shoeH, legW, shoeH)
  }

  // --- torso ----------------------------------------------------------------------
  const bodyW = Math.round(w * 0.72)
  pen.fillStyle(spec.shirt)
  pen.fillRect(cx - bodyW / 2, bodyY + bob, bodyW, bodyH - bob)

  if (spec.shirtTrim !== undefined) {
    pen.fillStyle(spec.shirtTrim)
    // A trim band across the chest — a tracksuit panel, a collar, a stripe. One shape.
    pen.fillRect(cx - bodyW / 2, bodyY + bob + 1, bodyW, Math.max(1, Math.round(bodyH * 0.18)))
  }

  if (spec.apron !== undefined && direction !== 'up') {
    pen.fillStyle(spec.apron)
    pen.fillRect(cx - bodyW * 0.34, bodyY + bob + Math.round(bodyH * 0.35), bodyW * 0.68, bodyH * 0.75)
  }

  // --- arms -----------------------------------------------------------------------
  pen.fillStyle(spec.shirt)
  if (direction === 'side') {
    pen.fillRect(cx - armW / 2 + step * 2, bodyY + bob + 1, armW, Math.round(bodyH * 0.7))
  } else {
    pen.fillRect(cx - bodyW / 2 - armW + 1, bodyY + bob + 1 + step, armW, Math.round(bodyH * 0.66))
    pen.fillRect(cx + bodyW / 2 - 1, bodyY + bob + 1 - step, armW, Math.round(bodyH * 0.66))
  }
  pen.fillStyle(spec.skin)
  const handH = Math.max(2, Math.round(h * 0.05))
  if (direction === 'side') {
    pen.fillRect(cx - armW / 2 + step * 2, bodyY + bob + Math.round(bodyH * 0.7), armW, handH)
  } else {
    pen.fillRect(cx - bodyW / 2 - armW + 1, bodyY + bob + 1 + step + Math.round(bodyH * 0.66), armW, handH)
    pen.fillRect(cx + bodyW / 2 - 1, bodyY + bob + 1 - step + Math.round(bodyH * 0.66), armW, handH)
  }

  // --- head -----------------------------------------------------------------------
  const headW = Math.round(w * 0.72)
  pen.fillStyle(spec.skin)
  pen.fillEllipse(cx, headY + headH / 2 + bob, headW, headH)

  // --- hair -----------------------------------------------------------------------
  pen.fillStyle(spec.hair)
  const top = headY + bob
  switch (spec.hairStyle) {
    case 'buzz':
      // Ofir. Close to the skull, no volume, a straight line across the forehead.
      pen.fillEllipse(cx, top + headH * 0.34, headW * 0.98, headH * 0.62)
      pen.fillStyle(spec.skin)
      pen.fillRect(cx - headW / 2, top + headH * 0.5, headW, headH * 0.5)
      break
    case 'curly':
      pen.fillEllipse(cx, top + headH * 0.3, headW * 1.12, headH * 0.8)
      pen.fillEllipse(cx - headW * 0.38, top + headH * 0.4, headW * 0.5, headH * 0.5)
      pen.fillEllipse(cx + headW * 0.38, top + headH * 0.4, headW * 0.5, headH * 0.5)
      pen.fillStyle(spec.skin)
      if (direction !== 'up') pen.fillRect(cx - headW * 0.34, top + headH * 0.52, headW * 0.68, headH * 0.45)
      break
    case 'long':
      pen.fillEllipse(cx, top + headH * 0.36, headW * 1.1, headH * 0.86)
      pen.fillRect(cx - headW * 0.56, top + headH * 0.3, headW * 0.2, headH * 1.05)
      pen.fillRect(cx + headW * 0.36, top + headH * 0.3, headW * 0.2, headH * 1.05)
      pen.fillStyle(spec.skin)
      if (direction !== 'up') pen.fillRect(cx - headW * 0.3, top + headH * 0.5, headW * 0.6, headH * 0.48)
      break
    case 'thin':
      pen.fillEllipse(cx, top + headH * 0.26, headW * 0.94, headH * 0.44)
      pen.fillStyle(spec.skin)
      pen.fillRect(cx - headW * 0.26, top + headH * 0.14, headW * 0.52, headH * 0.2)
      break
    default:
      pen.fillEllipse(cx, top + headH * 0.32, headW * 1.02, headH * 0.66)
      pen.fillStyle(spec.skin)
      if (direction !== 'up') pen.fillRect(cx - headW * 0.36, top + headH * 0.52, headW * 0.72, headH * 0.45)
      break
  }

  if (spec.cap !== undefined) {
    pen.fillStyle(spec.cap)
    pen.fillRect(cx - headW * 0.56, top + headH * 0.24, headW * 1.12, headH * 0.18)
    pen.fillEllipse(cx, top + headH * 0.2, headW * 1.0, headH * 0.36)
  }

  // --- face -----------------------------------------------------------------------
  // Only ever on the front and side views. A back of a head with eyes on it is the
  // single most common tell that a figure sheet was generated rather than drawn.
  if (direction === 'down') {
    pen.fillStyle(0x000000, 0.72)
    pen.fillRect(cx - headW * 0.24, top + headH * 0.58, 2, 2)
    pen.fillRect(cx + headW * 0.24 - 2, top + headH * 0.58, 2, 2)
    if (spec.moustache) {
      pen.fillStyle(spec.hair)
      pen.fillRect(cx - headW * 0.26, top + headH * 0.76, headW * 0.52, 2)
    }
  } else if (direction === 'side') {
    pen.fillStyle(0x000000, 0.72)
    pen.fillRect(cx + headW * 0.16, top + headH * 0.58, 2, 2)
    if (spec.moustache) {
      pen.fillStyle(spec.hair)
      pen.fillRect(cx + headW * 0.06, top + headH * 0.76, headW * 0.34, 2)
    }
  }
}

/**
 * הצוות — Stage 1's cast, as data.
 *
 * Adding 1990's versions of these people is adding entries with a different shirt and a
 * greater height, not writing new drawing code — which is the point of keeping the
 * figure a spec instead of a function per character.
 */
export function cast(p: typeof LIFE_PALETTE): Record<string, FigureSpec> {
  return {
    // The child. Hapoel red on a boy of eight is the whole opening image of the game.
    kid: {
      id: 'kid',
      height: 34,
      skin: p.skin,
      hair: p.hair,
      hairStyle: 'curly',
      shirt: p.red,
      legs: p.denim,
      shoes: p.shoe,
    },
    // Ofir — ten, buzz cut, black tracksuit with a red panel. Brief §9.
    ofir: {
      id: 'ofir',
      height: 37,
      skin: p.skinShade,
      hair: p.hair,
      hairStyle: 'buzz',
      shirt: p.trackBlack,
      shirtTrim: p.red,
      legs: p.trackBlack,
      shoes: p.shoe,
    },
    // Kobi — the approved direction: moustache, blue work shirt, jeans, work boots.
    kobi: {
      id: 'kobi',
      height: 47,
      skin: p.skinShade,
      hair: p.hair,
      hairStyle: 'short',
      shirt: p.workShirt,
      legs: p.denimDark,
      shoes: p.shoeDark,
      moustache: true,
    },
    // Rachel — housedress and apron, long hair.
    rachel: {
      id: 'rachel',
      height: 45,
      skin: p.skin,
      hair: p.hair,
      hairStyle: 'long',
      shirt: p.rug,
      apron: p.cloth,
      legs: p.rug,
      shoes: p.shoeDark,
    },
    // The kiosk man — apron, flat cap, thinning hair.
    kiosk: {
      id: 'kiosk',
      height: 46,
      skin: p.skinShade,
      hair: p.hairLight,
      hairStyle: 'thin',
      shirt: p.cloth,
      apron: p.plasterShade,
      legs: p.furnitureDark,
      shoes: p.shoeDark,
      cap: p.furnitureDark,
    },
    // Neighbourhood kids for the 3v3 — reds and a neutral side, never yellow.
    kidRed: {
      id: 'kidRed',
      height: 33,
      skin: p.skinShade,
      hair: p.hair,
      hairStyle: 'short',
      shirt: p.red,
      legs: p.shorts,
      shoes: p.shoe,
    },
    kidGrey: {
      id: 'kidGrey',
      height: 33,
      skin: p.skin,
      hair: p.hairLight,
      hairStyle: 'short',
      shirt: p.crowdB,
      legs: p.shorts,
      shoes: p.shoe,
    },
    // A supporter on the way to the ground — scarf red, coat muted.
    fan: {
      id: 'fan',
      height: 46,
      skin: p.skinShade,
      hair: p.hair,
      hairStyle: 'short',
      shirt: p.crowdA,
      shirtTrim: p.red,
      legs: p.denimDark,
      shoes: p.shoeDark,
    },
    fanTall: {
      id: 'fanTall',
      height: 48,
      skin: p.skin,
      hair: p.hairLight,
      hairStyle: 'short',
      shirt: p.crowdF,
      shirtTrim: p.red,
      legs: p.denim,
      shoes: p.shoeDark,
    },
  }
}
