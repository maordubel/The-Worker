import Phaser from 'phaser'

import { CONTEXT_KEY, type LifeContext } from '../context'
import { buildTextures } from '../textures'

import { PrologueScene } from './PrologueScene'
import { WorldScene } from './WorldScene'

/**
 * Boot: draw every placeholder texture once, then hand over to wherever the saved life
 * actually is. A resumed save that reopens on the prologue would be a save that does not
 * work, and brief §30 point 22 is explicit that it has to.
 */
export class BootScene extends Phaser.Scene {
  static readonly KEY = 'life-boot'

  constructor() {
    super(BootScene.KEY)
  }

  create() {
    buildTextures(this)
    const ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    const state = ctx.engine.state

    if (!state.flags['prologue:done']) {
      this.scene.start(PrologueScene.KEY)
      return
    }

    const location = state.location === 'prologue-1972' ? 'bedroom' : state.location
    this.scene.start(WorldScene.KEY, { mapId: location, spawn: 'start' })
  }
}
