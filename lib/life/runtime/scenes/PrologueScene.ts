import Phaser from 'phaser'

import { PROLOGUE } from '../../content/chapter1980'
import { fillZoom } from '../camera'
import { CONTEXT_KEY, type LifeContext } from '../context'
import { LIFE_PALETTE } from '../palette'
import { paint, type PaintOp } from '../painter'

import { WorldScene } from './WorldScene'

/**
 * 1972 — the prologue, and the only non-interactive minute in the chapter.
 *
 * It is a memory of a crowd, drawn wide and dark, with the camera drifting across it
 * while the lines come up in the same box every other line in the game uses. It ends
 * itself, it can be skipped, and it never asks the player to press anything but the
 * button they will press for the next fifteen minutes.
 *
 * The one fact in it is the canonical anchor's headline, substituted into `{anchor}` by
 * the dialogue runner. Everything else is a child imagining his father young.
 */

const LAYERS: PaintOp[] = [
  { k: 'fill', x: 0, y: 0, w: 1000, h: 500, c: 'night' },
  { k: 'terrace', x: 0, y: 60, w: 1000, h: 240, rows: 11, full: true },
  { k: 'fill', x: 0, y: 296, w: 1000, h: 12, c: 'redDeep' },
  { k: 'fence', x: 0, y: 308, w: 1000, h: 26 },
  { k: 'pitch', x: 0, y: 340, w: 1000, h: 160, lines: false },
  { k: 'shade', x: 0, y: 0, w: 1000, h: 500, a: 0.55 },
  { k: 'glow', x: 180, y: 40, r: 150, c: 'lamp', a: 0.14 },
  { k: 'glow', x: 820, y: 40, r: 150, c: 'lamp', a: 0.14 },
  { k: 'crowd', x: 40, y: 250, w: 920, h: 46, n: 60 },
]

export class PrologueScene extends Phaser.Scene {
  static readonly KEY = 'life-prologue'

  private ctx!: LifeContext
  private done = false

  constructor() {
    super(PrologueScene.KEY)
  }

  create() {
    this.ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    this.cameras.main.setBackgroundColor(LIFE_PALETTE.night)

    const key = 'life-bg-prologue'
    if (!this.textures.exists(key)) {
      const brush = this.add.graphics()
      paint(brush, LAYERS, LIFE_PALETTE)
      brush.generateTexture(key, 1000, 500)
      brush.destroy()
    }
    const image = this.add.image(0, 0, key).setOrigin(0, 0)

    this.cameras.main.setBounds(0, 0, 1000, 500)
    const zoom = fillZoom(this.cameras.main, 1000, 500, 1.1)
    this.cameras.main.setZoom(zoom)
    this.cameras.main.centerOn(200, 250)
    this.cameras.main.fadeIn(900, 0, 0, 0)

    // A slow drift across the terrace for the whole prologue. Nothing cuts.
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: Math.max(0, 1000 - this.cameras.main.width / zoom),
      duration: 26000,
      ease: 'Sine.easeInOut',
    })
    this.tweens.add({ targets: image, alpha: { from: 0.7, to: 1 }, duration: 3000 })

    this.ctx.dialogue.setHooks({
      travel: () => this.finish(),
      minigame: () => undefined,
      ending: () => undefined,
      onOpen: () => undefined,
    })

    this.ctx.bus.emit('place', { id: 'prologue-1972', title: 'תל אביב · 1972' })
    this.ctx.bus.emit('controls', { visible: false })
    this.ctx.dialogue.startLines(PROLOGUE, () => this.finish())
  }

  skip() {
    this.ctx.dialogue.close()
    this.finish()
  }

  private finish() {
    if (this.done) return
    this.done = true
    this.ctx.engine.dispatch(
      { t: 'flag.raised', flag: 'prologue:done' },
      { t: 'chapter.entered', chapter: '1980' },
    )
    this.ctx.bus.emit('controls', { visible: true })
    this.cameras.main.fadeOut(700, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(WorldScene.KEY, { mapId: 'bedroom', spawn: 'start' })
    })
  }
}
