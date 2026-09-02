import type PhaserNS from 'phaser'

import { cast, DIRECTIONS, drawFigure, figureTexture, FRAMES, type FigureSpec } from './figures'
import { LIFE_PALETTE } from './palette'

/**
 * הטקסטורות — every drawable thing, made once at boot.
 *
 * ART-PLACEHOLDER, and the whole file exists to make that reversible. A scene never
 * draws a character: it asks for `figureTexture('kobi', 'down', 1)` and gets a key. Today
 * that key is filled by `drawFigure`; tomorrow `registerSheet()` fills the same keys from
 * a loaded transparent PNG and not one line of gameplay changes. That is brief §29's
 * requirement expressed as an indirection rather than as a promise.
 *
 * Generating at boot rather than shipping PNGs also means the placeholder art costs zero
 * bytes of download and can never be mistaken for final artwork in a review.
 */

export const BALL = 'life-ball'
export const SHADOW = 'life-shadow'
export const MARK = 'life-mark'

export function buildTextures(scene: PhaserNS.Scene): void {
  const graphics = scene.add.graphics()
  const figures = cast(LIFE_PALETTE)

  for (const spec of Object.values(figures)) {
    buildFigure(scene, graphics, spec)
  }

  // the ball — plastic, chalked, the one round object in a world with radius 0
  graphics.clear()
  graphics.fillStyle(LIFE_PALETTE.sheet)
  graphics.fillCircle(7, 7, 7)
  graphics.fillStyle(LIFE_PALETTE.ink, 0.7)
  graphics.fillCircle(5, 5, 2)
  graphics.fillCircle(10, 8, 2)
  graphics.fillCircle(6, 11, 2)
  graphics.generateTexture(BALL, 14, 14)

  // one shared soft shadow, so a figure sits on the ground instead of floating over it
  graphics.clear()
  graphics.fillStyle(LIFE_PALETTE.ink, 0.22)
  graphics.fillEllipse(12, 4, 22, 8)
  graphics.generateTexture(SHADOW, 24, 8)

  // the only piece of HUD drawn in the world: a small red mark over what you can reach
  graphics.clear()
  graphics.fillStyle(LIFE_PALETTE.red)
  graphics.fillTriangle(0, 0, 10, 0, 5, 8)
  graphics.generateTexture(MARK, 10, 8)

  graphics.destroy()
}

function buildFigure(scene: PhaserNS.Scene, graphics: PhaserNS.GameObjects.Graphics, spec: FigureSpec) {
  const width = Math.round(spec.height * 0.62) + 8
  const height = spec.height + 2
  for (const direction of DIRECTIONS) {
    for (const frame of FRAMES) {
      const key = figureTexture(spec.id, direction, frame)
      if (scene.textures.exists(key)) continue
      graphics.clear()
      drawFigure(graphics, spec, direction, frame)
      graphics.generateTexture(key, width, height)
    }
  }
}

/**
 * The seam for real artwork.
 *
 * When the production sheets exist, a preload calls `scene.load.spritesheet(...)` and then
 * this maps its frames onto the same keys the scenes already use. Nothing else moves.
 * It is written now, unused, on purpose: an indirection nobody can see is an indirection
 * somebody removes.
 */
export function registerSheet(
  scene: PhaserNS.Scene,
  id: string,
  sheetKey: string,
  frameFor: (direction: string, frame: number) => number,
): void {
  const texture = scene.textures.get(sheetKey)
  if (!texture) return
  for (const direction of DIRECTIONS) {
    for (const frame of FRAMES) {
      const source = frameFor(direction, frame)
      if (!texture.has(String(source))) continue
      scene.textures.addSpriteSheetFromAtlas(figureTexture(id, direction, frame), {
        atlas: sheetKey,
        frame: String(source),
        frameWidth: 1,
        frameHeight: 1,
      })
    }
  }
}
