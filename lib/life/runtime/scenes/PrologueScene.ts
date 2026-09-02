import Phaser from 'phaser'

import { PROLOGUE } from '../../content/chapter1980'
import { artUrl } from '../art'
import { CONTEXT_KEY, type LifeContext } from '../context'
import { LIFE_PALETTE } from '../palette'

import { WorldScene } from './WorldScene'

/**
 * 1972 — the prologue, and the only minute of the chapter you do not control.
 *
 * It is one painting — a full terrace, seen from inside it — held for half a minute while
 * the camera drifts across the crowd and the lines come up in the same box every other
 * line in the game uses. The image is dark, warm and slightly overscanned, so the drift
 * never reaches an edge and the memory never has a frame around it.
 *
 * The one fact in it is the canonical anchor's headline, substituted into `{anchor}` by
 * the dialogue runner. Everything else is a child imagining his father young.
 */
export class PrologueScene extends Phaser.Scene {
  static readonly KEY = 'life-prologue'

  private ctx!: LifeContext
  private done = false

  constructor() {
    super(PrologueScene.KEY)
  }

  preload() {
    if (!this.textures.exists('art-stand')) this.load.image('art-stand', artUrl('stand'))
  }

  create() {
    this.ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    this.cameras.main.setBackgroundColor(LIFE_PALETTE.night)

    const cam = this.cameras.main
    const image = this.add.image(0, 0, 'art-stand').setOrigin(0.5, 0.5).setScrollFactor(0)
    const source = this.textures.get('art-stand').getSourceImage()

    const place = () => {
      const scale = Math.max(cam.width / source.width, cam.height / source.height) * 1.18
      image.setPosition(cam.width / 2, cam.height / 2)
      image.setScale(scale)
      return scale
    }
    const scale = place()

    // A slow drift across the crowd and a slow push in. Nothing cuts, and the frame never
    // reaches the edge of the painting.
    this.tweens.add({
      targets: image,
      x: { from: cam.width / 2 + cam.width * 0.06, to: cam.width / 2 - cam.width * 0.06 },
      scale: { from: scale, to: scale * 1.08 },
      duration: 30000,
      ease: 'Sine.easeInOut',
    })

    const dark = this.add
      .rectangle(0, 0, cam.width, cam.height, LIFE_PALETTE.night, 0.42)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(10)
    const resize = () => {
      place()
      dark.setSize(cam.width, cam.height)
    }
    this.scale.on('resize', resize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', resize, this))

    this.add
      .particles(0, 0, 'life-dot', {
        x: { min: 0, max: cam.width },
        y: { min: 0, max: cam.height },
        quantity: 1,
        frequency: 90,
        lifespan: 8000,
        speedY: { min: -14, max: -3 },
        speedX: { min: -6, max: 6 },
        scale: { start: 1.1, end: 0.2 },
        alpha: { start: 0.22, end: 0 },
        tint: LIFE_PALETTE.lamp,
        blendMode: 'NORMAL',
      })
      .setScrollFactor(0)
      .setDepth(20)

    cam.fadeIn(1400, 0, 0, 0)

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
    this.cameras.main.fadeOut(900, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(WorldScene.KEY, { mapId: 'bedroom', spawn: 'start' })
    })
  }
}
