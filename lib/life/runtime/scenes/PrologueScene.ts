import Phaser from 'phaser'

import { t } from '@/lib/i18n'

import { PROLOGUE } from '../../content/chapter1986'
import { artUrl } from '../art'
import { CONTEXT_KEY, type LifeContext } from '../context'
import { LIFE_PALETTE } from '../palette'

import { CHAPTERS } from '../../content/chapters'
import { WorldScene } from './WorldScene'

/**
 * 1 ביוני 1983 — the first minute of this life the player actually owns.
 *
 * The new opening film tells the family story first. Then this scene gives the player one
 * tiny thing only film cannot give them: agency inside the memory. When that memory closes,
 * the supplied `cup83` film becomes the first archive reveal — history after experience,
 * never history instead of experience — and the first playable childhood day loads behind it.
 */
export class PrologueScene extends Phaser.Scene {
  static readonly KEY = 'life-prologue'

  private ctx!: LifeContext
  private done = false

  constructor() {
    super(PrologueScene.KEY)
  }

  preload() {
    if (!this.textures.exists('art-cup83')) this.load.image('art-cup83', artUrl('cup83'))
  }

  create() {
    this.ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    this.cameras.main.setBackgroundColor(LIFE_PALETTE.night)

    const cam = this.cameras.main
    const image = this.add.image(0, 0, 'art-cup83').setOrigin(0.5, 0.5).setScrollFactor(0)
    const source = this.textures.get('art-cup83').getSourceImage()

    const place = () => {
      const scale = Math.max(cam.width / source.width, cam.height / source.height) * 1.18
      image.setPosition(cam.width / 2, cam.height / 2)
      image.setScale(scale)
      return scale
    }
    const scale = place()

    this.tweens.add({
      targets: image,
      x: { from: cam.width / 2 + cam.width * 0.06, to: cam.width / 2 - cam.width * 0.06 },
      scale: { from: scale, to: scale * 1.08 },
      duration: 30000,
      ease: 'Sine.easeInOut',
    })

    const dark = this.add.rectangle(0, 0, cam.width, cam.height, LIFE_PALETTE.night, 0.42).setOrigin(0, 0).setScrollFactor(0).setDepth(10)
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

    this.ctx.bus.emit('place', { id: 'prologue', title: t('life.place.prologue') })
    this.ctx.bus.emit('controls', { visible: false })
    if (!this.ctx.dialogue.start('a1-1983', () => this.finish())) {
      this.ctx.dialogue.startLines(PROLOGUE, () => this.finish())
    }
  }

  skip() {
    this.ctx.dialogue.close()
    this.finish()
  }

  private finish() {
    if (this.done) return
    this.done = true

    const first = CHAPTERS.find((c) => c.playable) ?? CHAPTERS[0]!
    const state = this.ctx.engine.state
    this.ctx.engine.dispatch(
      { t: 'flag.raised', flag: 'prologue:done' },
      { t: 'flag.raised', flag: 'life:archive:cup83-offered' },
      { t: 'year.entered', year: first.year, weekday: first.weekday, minute: first.minute },
      { t: 'chapter.entered', chapter: first.id },
      { t: 'flag.raised', flag: `life:bridge-${first.id}` },
      ...(first.entry?.(state) ?? []),
    )

    // The first documentary reveal: Kobi's story became the player's memory first; only
    // now do we open the archive. WorldScene may load behind it — FilmCut is the curtain.
    this.ctx.bus.emit('film', {
      clip: 'cup83-archive',
      captionHe: 'קובי סיפר את הערב הזה במשך שנים. עכשיו הזיכרון נפתח אל הארכיון — ואז החיים של פוגי מתחילים באמת.',
    })

    this.ctx.bus.emit('controls', { visible: true })
    this.cameras.main.fadeOut(900, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(WorldScene.KEY, { mapId: first.start.location, spawn: first.start.spawn })
    })
  }
}
