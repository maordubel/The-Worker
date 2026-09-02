import type PhaserNS from 'phaser'

import type { LIFE_PALETTE } from './palette'

/**
 * הצַבָּע — the world's drawing vocabulary.
 *
 * A location is DATA: a list of paint operations, a list of solids, a list of things you
 * can talk to. This file is the only place that knows what "a building" or "a terrace"
 * looks like, which is what makes brief §8 possible — the same street can be repainted
 * for 1990 by handing the same geometry a different op list, and the player walks the
 * street they remember.
 *
 * Everything is deterministic. Where a wall needs speckle or a terrace needs a crowd,
 * the scatter comes from a seeded generator keyed on the op, never from `Math.random` —
 * art that reshuffles on every entry reads as a rendering bug, and the repo has already
 * learned that lesson once in `PastedSheet`.
 *
 * ART-PLACEHOLDER: every op here draws flat shapes in the period palette. They are
 * composition and scale, not final art. Replacing one with a loaded PNG is replacing one
 * case in `paint()`; no map, scene or gameplay rule changes.
 */

type Palette = typeof LIFE_PALETTE
type Graphics = PhaserNS.GameObjects.Graphics

export type PaintOp =
  | { k: 'fill'; x: number; y: number; w: number; h: number; c: keyof Palette; a?: number }
  | { k: 'speckle'; x: number; y: number; w: number; h: number; c: keyof Palette; n: number }
  | {
      k: 'building'
      x: number
      y: number
      w: number
      h: number
      c?: keyof Palette
      floors?: number
      bays?: number
      roof?: boolean
      balcony?: boolean
    }
  | { k: 'wall'; x: number; y: number; w: number; h: number; c?: keyof Palette }
  | { k: 'graffiti'; x: number; y: number; w: number; h: number; c?: keyof Palette }
  | { k: 'poster'; x: number; y: number; w: number; h: number; c?: keyof Palette }
  | { k: 'tree'; x: number; y: number; r: number }
  | { k: 'road'; x: number; y: number; w: number; h: number; vertical?: boolean }
  | { k: 'tiles'; x: number; y: number; w: number; h: number; size?: number; c?: keyof Palette }
  | { k: 'rug'; x: number; y: number; w: number; h: number }
  | { k: 'furniture'; x: number; y: number; w: number; h: number; c?: keyof Palette; top?: keyof Palette }
  | { k: 'car'; x: number; y: number; w: number; h: number; c?: keyof Palette }
  | { k: 'pylon'; x: number; y: number; h: number }
  | { k: 'terrace'; x: number; y: number; w: number; h: number; rows?: number; full?: boolean }
  | { k: 'sign'; x: number; y: number; w: number; h: number; c?: keyof Palette; words?: number }
  | { k: 'pitch'; x: number; y: number; w: number; h: number; lines?: boolean }
  | { k: 'goal'; x: number; y: number; w: number; h: number }
  | { k: 'fence'; x: number; y: number; w: number; h: number }
  | { k: 'crowd'; x: number; y: number; w: number; h: number; n: number }
  | { k: 'glow'; x: number; y: number; r: number; c?: keyof Palette; a?: number }
  | { k: 'shade'; x: number; y: number; w: number; h: number; a?: number }

/** A small deterministic generator — the same op always paints the same speckle. */
function rng(seed: number) {
  let state = (seed | 0) || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 100000) / 100000
  }
}

function seedOf(op: PaintOp): number {
  return Math.round(op.x * 73 + op.y * 31 + ('w' in op ? op.w * 17 : 11) + op.k.length * 101)
}

const CROWD: (keyof Palette)[] = ['crowdA', 'crowdB', 'crowdC', 'crowdD', 'crowdE', 'crowdF']

export function paint(g: Graphics, ops: readonly PaintOp[], p: Palette): void {
  for (const op of ops) paintOne(g, op, p)
}

function paintOne(g: Graphics, op: PaintOp, p: Palette): void {
  const random = rng(seedOf(op))

  switch (op.k) {
    case 'fill':
      g.fillStyle(p[op.c], op.a ?? 1)
      g.fillRect(op.x, op.y, op.w, op.h)
      return

    case 'shade':
      g.fillStyle(p.ink, op.a ?? 0.18)
      g.fillRect(op.x, op.y, op.w, op.h)
      return

    case 'speckle': {
      g.fillStyle(p[op.c], 0.5)
      for (let i = 0; i < op.n; i += 1) {
        g.fillRect(op.x + random() * op.w, op.y + random() * op.h, 2, 2)
      }
      return
    }

    case 'wall': {
      const body = p[op.c ?? 'plaster']
      g.fillStyle(body)
      g.fillRect(op.x, op.y, op.w, op.h)
      g.fillStyle(p.plasterShade, 0.55)
      g.fillRect(op.x, op.y + op.h - Math.max(3, op.h * 0.14), op.w, Math.max(3, op.h * 0.14))
      g.fillStyle(p.concrete)
      g.fillRect(op.x, op.y, op.w, 3)
      // Plaster is never flat. A handful of patches at fixed positions is what stops a
      // long wall reading as a coloured rectangle.
      g.fillStyle(p.plasterShade, 0.3)
      for (let i = 0; i < Math.round(op.w / 40); i += 1) {
        g.fillRect(op.x + random() * op.w, op.y + 4 + random() * (op.h - 10), 8 + random() * 22, 5 + random() * 9)
      }
      return
    }

    case 'building': {
      const body = p[op.c ?? 'plaster']
      const floors = op.floors ?? Math.max(1, Math.round(op.h / 46))
      const bays = op.bays ?? Math.max(1, Math.round(op.w / 44))
      g.fillStyle(body)
      g.fillRect(op.x, op.y, op.w, op.h)
      g.fillStyle(p.plasterShade, 0.5)
      g.fillRect(op.x + op.w - 8, op.y, 8, op.h)
      if (op.roof !== false) {
        g.fillStyle(p.roof)
        g.fillRect(op.x - 3, op.y - 6, op.w + 6, 7)
        g.fillStyle(p.ink, 0.25)
        g.fillRect(op.x - 3, op.y + 1, op.w + 6, 2)
      }
      const floorH = op.h / floors
      const bayW = op.w / bays
      for (let f = 0; f < floors; f += 1) {
        for (let b = 0; b < bays; b += 1) {
          const wx = op.x + bayW * b + bayW * 0.28
          const wy = op.y + floorH * f + floorH * 0.24
          const ww = bayW * 0.44
          const wh = floorH * 0.4
          g.fillStyle(p.ink, 0.75)
          g.fillRect(wx - 1, wy - 1, ww + 2, wh + 2)
          // Half the shutters are closed, and which half is fixed by the seed rather
          // than rolled every frame.
          const closed = random() > 0.45
          g.fillStyle(closed ? p.shutter : p.windowGlass)
          g.fillRect(wx, wy, ww, wh)
          if (closed) {
            g.fillStyle(p.shutterOpen, 0.5)
            for (let s = 2; s < wh; s += 3) g.fillRect(wx, wy + s, ww, 1)
          } else {
            g.fillStyle(p.lamp, 0.22)
            g.fillRect(wx, wy, ww, wh * 0.4)
          }
          if (op.balcony && f > 0 && b % 2 === 0) {
            g.fillStyle(p.rail)
            g.fillRect(wx - bayW * 0.1, wy + wh + 2, ww + bayW * 0.2, 3)
            for (let r = 0; r < 5; r += 1) {
              g.fillRect(wx - bayW * 0.1 + r * ((ww + bayW * 0.2) / 5), wy + wh + 2, 1, 6)
            }
          }
        }
      }
      return
    }

    case 'graffiti': {
      // הפועל on a wall, as strokes rather than letters: the runtime draws no text, and
      // a fake alphabet is worse than an honest scrawl. The real artwork replaces it.
      const c = p[op.c ?? 'red']
      g.fillStyle(c, 0.9)
      const strokes = Math.max(3, Math.round(op.w / 26))
      for (let i = 0; i < strokes; i += 1) {
        const sx = op.x + (op.w / strokes) * i + 2
        const sh = op.h * (0.45 + random() * 0.5)
        g.fillRect(sx, op.y + (op.h - sh) / 2, Math.max(3, op.w / strokes - 6), sh)
      }
      g.fillStyle(c, 0.9)
      g.fillRect(op.x, op.y + op.h * 0.5, op.w, 3)
      return
    }

    case 'poster': {
      g.fillStyle(p.paperCream)
      g.fillRect(op.x, op.y, op.w, op.h)
      g.fillStyle(p[op.c ?? 'red'])
      g.fillRect(op.x + 2, op.y + 2, op.w - 4, op.h * 0.34)
      g.fillStyle(p.ink, 0.7)
      for (let i = 0; i < 4; i += 1) {
        g.fillRect(op.x + 3, op.y + op.h * 0.45 + i * 4, (op.w - 6) * (0.5 + random() * 0.5), 2)
      }
      return
    }

    case 'tree': {
      g.fillStyle(p.furnitureDark)
      g.fillRect(op.x - 3, op.y - op.r * 0.3, 6, op.r * 1.1)
      g.fillStyle(p.shutterOpen)
      g.fillEllipse(op.x, op.y - op.r * 0.6, op.r * 2.1, op.r * 1.7)
      g.fillStyle(p.shutter)
      g.fillEllipse(op.x - op.r * 0.3, op.y - op.r * 0.8, op.r * 1.4, op.r * 1.1)
      return
    }

    case 'road': {
      g.fillStyle(p.asphalt)
      g.fillRect(op.x, op.y, op.w, op.h)
      g.fillStyle(p.asphaltLine, 0.7)
      if (op.vertical) {
        for (let y = op.y + 8; y < op.y + op.h - 8; y += 26) g.fillRect(op.x + op.w / 2 - 1, y, 2, 12)
      } else {
        for (let x = op.x + 8; x < op.x + op.w - 8; x += 26) g.fillRect(x, op.y + op.h / 2 - 1, 12, 2)
      }
      return
    }

    case 'tiles': {
      const size = op.size ?? 24
      g.fillStyle(p[op.c ?? 'tile'])
      g.fillRect(op.x, op.y, op.w, op.h)
      g.fillStyle(p.tileLine, 0.5)
      for (let x = op.x; x <= op.x + op.w; x += size) g.fillRect(x, op.y, 1, op.h)
      for (let y = op.y; y <= op.y + op.h; y += size) g.fillRect(op.x, y, op.w, 1)
      return
    }

    case 'rug': {
      g.fillStyle(p.rug)
      g.fillRect(op.x, op.y, op.w, op.h)
      g.fillStyle(p.redInk, 0.55)
      g.fillRect(op.x + 5, op.y + 5, op.w - 10, op.h - 10)
      g.fillStyle(p.cloth, 0.4)
      g.fillRect(op.x + 11, op.y + 11, op.w - 22, op.h - 22)
      return
    }

    case 'furniture': {
      g.fillStyle(p[op.c ?? 'furniture'])
      g.fillRect(op.x, op.y, op.w, op.h)
      g.fillStyle(p[op.top ?? 'furnitureDark'])
      g.fillRect(op.x, op.y, op.w, Math.max(3, op.h * 0.22))
      g.fillStyle(p.ink, 0.22)
      g.fillRect(op.x, op.y + op.h - 3, op.w, 3)
      return
    }

    case 'car': {
      const body = p[op.c ?? 'carCream']
      g.fillStyle(p.ink, 0.2)
      g.fillRect(op.x + 2, op.y + op.h - 3, op.w, 4)
      g.fillStyle(body)
      g.fillRect(op.x, op.y + op.h * 0.3, op.w, op.h * 0.62)
      g.fillRect(op.x + op.w * 0.2, op.y, op.w * 0.6, op.h * 0.42)
      g.fillStyle(p.glass)
      g.fillRect(op.x + op.w * 0.24, op.y + 3, op.w * 0.52, op.h * 0.3)
      g.fillStyle(p.tyre)
      g.fillRect(op.x + op.w * 0.12, op.y + op.h * 0.82, op.w * 0.16, op.h * 0.2)
      g.fillRect(op.x + op.w * 0.72, op.y + op.h * 0.82, op.w * 0.16, op.h * 0.2)
      return
    }

    case 'pylon': {
      // The lattice floodlight towers. They are the silhouette that says Bloomfield
      // from three streets away, so they are drawn as a truss and not as a pole.
      const w = 16
      g.fillStyle(p.rail)
      g.fillRect(op.x - w / 2, op.y - op.h, 4, op.h)
      g.fillRect(op.x + w / 2 - 4, op.y - op.h, 4, op.h)
      for (let y = op.y - op.h + 8; y < op.y; y += 18) {
        g.fillRect(op.x - w / 2, y, w, 3)
        g.fillTriangle(op.x - w / 2, y, op.x + w / 2, y + 16, op.x + w / 2 - 3, y + 16)
      }
      g.fillStyle(p.concrete)
      g.fillRect(op.x - 20, op.y - op.h - 26, 40, 26)
      g.fillStyle(p.lamp, 0.85)
      for (let i = 0; i < 4; i += 1) {
        for (let j = 0; j < 2; j += 1) g.fillRect(op.x - 17 + i * 9, op.y - op.h - 22 + j * 11, 7, 8)
      }
      return
    }

    case 'terrace': {
      const rows = op.rows ?? 8
      const rowH = op.h / rows
      for (let r = 0; r < rows; r += 1) {
        const y = op.y + rowH * r
        g.fillStyle(r % 2 === 0 ? p.concrete : p.concreteDark)
        g.fillRect(op.x, y, op.w, rowH)
        if (!op.full) continue
        const n = Math.round(op.w / 7)
        for (let i = 0; i < n; i += 1) {
          const shade = CROWD[Math.floor(random() * CROWD.length)] ?? 'crowdA'
          g.fillStyle(random() > 0.62 ? p.red : p[shade])
          g.fillRect(op.x + i * 7 + random() * 2, y + rowH * 0.2, 5, rowH * 0.62)
        }
      }
      g.fillStyle(p.ink, 0.3)
      g.fillRect(op.x, op.y + op.h - 3, op.w, 3)
      return
    }

    case 'sign': {
      // A red board with white blocks where the lettering goes. The runtime draws no
      // glyphs — see the note on `graffiti`.
      g.fillStyle(p.ink, 0.5)
      g.fillRect(op.x + 2, op.y + 2, op.w, op.h)
      g.fillStyle(p[op.c ?? 'red'])
      g.fillRect(op.x, op.y, op.w, op.h)
      g.fillStyle(p.sheet, 0.92)
      const words = op.words ?? 3
      let cursor = op.x + op.w * 0.08
      for (let i = 0; i < words; i += 1) {
        const width = (op.w * 0.84) / words - 6
        g.fillRect(cursor, op.y + op.h * 0.3, width, op.h * 0.4)
        cursor += width + 6
      }
      return
    }

    case 'pitch': {
      g.fillStyle(p.grass)
      g.fillRect(op.x, op.y, op.w, op.h)
      g.fillStyle(p.grassDark, 0.5)
      for (let x = op.x; x < op.x + op.w; x += 46) g.fillRect(x, op.y, 23, op.h)
      if (op.lines === false) return
      g.fillStyle(p.chalk, 0.85)
      g.fillRect(op.x + 6, op.y + 6, op.w - 12, 2)
      g.fillRect(op.x + 6, op.y + op.h - 8, op.w - 12, 2)
      g.fillRect(op.x + 6, op.y + 6, 2, op.h - 14)
      g.fillRect(op.x + op.w - 8, op.y + 6, 2, op.h - 14)
      g.fillRect(op.x + op.w / 2 - 1, op.y + 6, 2, op.h - 14)
      g.lineStyle(2, p.chalk, 0.85)
      g.strokeCircle(op.x + op.w / 2, op.y + op.h / 2, Math.min(op.w, op.h) * 0.16)
      return
    }

    case 'goal': {
      g.fillStyle(p.sheet, 0.2)
      g.fillRect(op.x, op.y, op.w, op.h)
      g.fillStyle(p.sheet, 0.85)
      g.fillRect(op.x, op.y, 3, op.h)
      g.fillRect(op.x + op.w - 3, op.y, 3, op.h)
      g.fillRect(op.x, op.y, op.w, 3)
      g.fillStyle(p.sheet, 0.35)
      for (let x = op.x + 6; x < op.x + op.w; x += 6) g.fillRect(x, op.y, 1, op.h)
      for (let y = op.y + 6; y < op.y + op.h; y += 6) g.fillRect(op.x, y, op.w, 1)
      return
    }

    case 'fence': {
      g.fillStyle(p.rail)
      g.fillRect(op.x, op.y, op.w, 3)
      g.fillRect(op.x, op.y + op.h - 3, op.w, 3)
      for (let x = op.x; x < op.x + op.w; x += 9) g.fillRect(x, op.y, 2, op.h)
      return
    }

    case 'crowd': {
      for (let i = 0; i < op.n; i += 1) {
        const x = op.x + random() * op.w
        const y = op.y + random() * op.h
        const shade = CROWD[Math.floor(random() * CROWD.length)] ?? 'crowdA'
        g.fillStyle(p.ink, 0.18)
        g.fillEllipse(x, y + 14, 14, 5)
        g.fillStyle(random() > 0.55 ? p.red : p[shade])
        g.fillRect(x - 4, y - 2, 8, 15)
        g.fillStyle(p.skinShade)
        g.fillEllipse(x, y - 6, 9, 9)
        g.fillStyle(p.hair)
        g.fillEllipse(x, y - 9, 9, 5)
      }
      return
    }

    case 'glow': {
      const c = p[op.c ?? 'lamp']
      for (let i = 4; i > 0; i -= 1) {
        g.fillStyle(c, (op.a ?? 0.18) / i)
        g.fillCircle(op.x, op.y, op.r * (i / 4))
      }
      return
    }

    default:
      return
  }
}
