import Phaser from 'phaser'

import { artUrl, BOOT_FIGURES } from '../art'
import { CONTEXT_KEY, type LifeContext } from '../context'
import { LIFE_PALETTE } from '../palette'

import { PassageScene } from './PassageScene'
import { PrologueScene } from './PrologueScene'
import { WorldScene } from './WorldScene'

/**
 * Boot: make the one texture the runtime draws itself, warm the figures the chapter uses
 * everywhere, then hand over to wherever the saved life actually is. A resumed save that
 * reopened on the prologue would be a save that does not work.
 */
export class BootScene extends Phaser.Scene {
  static readonly KEY = 'life-boot'

  constructor() {
    super(BootScene.KEY)
  }

  preload() {
    for (const key of BOOT_FIGURES) {
      if (!this.textures.exists(`art-${key}`)) this.load.image(`art-${key}`, artUrl(key))
    }
  }

  create() {
    // The single drawn asset left in the game: one soft dot, which becomes every mote of
    // dust indoors, every particle of haze on the street and every scrap of paper in the
    // stadium. Everything else on screen is Maor's artwork.
    if (!this.textures.exists('life-dot')) {
      const g = this.add.graphics()
      g.fillStyle(LIFE_PALETTE.sheet, 1)
      g.fillCircle(4, 4, 2.4)
      g.fillStyle(LIFE_PALETTE.sheet, 0.4)
      g.fillCircle(4, 4, 4)
      g.generateTexture('life-dot', 8, 8)
      g.destroy()
    }

    // The door glow: one soft radial falloff, tinted warm for an inside door and pale
    // for daylight. Every exit in the game is lit with this and nothing else.
    if (!this.textures.exists('life-glow')) {
      const g = this.add.graphics()
      const size = 96
      for (let i = 24; i > 0; i -= 1) {
        g.fillStyle(LIFE_PALETTE.glow, 0.05)
        g.fillEllipse(size / 2, size / 2, (size * i) / 24, (size * i) / 24)
      }
      g.generateTexture('life-glow', size, size)
      g.destroy()
    }

    const ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    const state = ctx.engine.state

    if (!state.flags['prologue:done']) {
      this.scene.start(PrologueScene.KEY)
      return
    }
    // A life that finished 1986 and has not yet crossed into 1990 reopens in the passage —
    // the four years are a scene, and a reload in the middle of it lands in it, not back
    // in the Saturday that already ended.
    if (state.chapter === '1986' && state.chapterDone) {
      this.scene.start(PassageScene.KEY)
      return
    }
    const location = state.location === 'prologue' || state.location === 'prologue-1972' ? 'bedroom' : state.location
    this.scene.start(WorldScene.KEY, { mapId: location, spawn: 'start' })
  }
}
