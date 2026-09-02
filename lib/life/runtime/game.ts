import Phaser from 'phaser'

import type { HistoricalAnchor } from '../anchors'
import type { LifeEngine } from '../engine'

import type { LifeBus } from './bus'
import { CONTEXT_KEY, type LifeContext } from './context'
import { DialogueRunner } from './dialogue'
import { InputState } from './input'
import { LIFE_PALETTE } from './palette'
import { BootScene } from './scenes/BootScene'
import { FootballScene } from './scenes/FootballScene'
import { PrologueScene } from './scenes/PrologueScene'
import { WorldScene } from './scenes/WorldScene'

/**
 * ההרכבה — the only file that both React and Phaser touch, and the reason neither knows
 * about the other.
 *
 * The shell mounts this and gets back four methods. It never imports a scene, never sees
 * a game object, and never reads game state except through the bus. That boundary is what
 * brief §28 is protecting: the React tree can be rebuilt, and the game keeps playing.
 *
 * `Scale.RESIZE` rather than `FIT` on purpose. `FIT` letterboxes a 16:9 design into a
 * portrait phone and wastes a third of the screen; `RESIZE` gives the canvas whatever
 * box the layout hands it and the scenes pick a camera zoom from the width. That is how
 * the same world is playable on a 390px phone and a laptop without a second layout.
 */

export type LifeRuntime = {
  input: InputState
  /** the shell owns the box; Phaser's own listener only fires on a window resize */
  resize(width: number, height: number): void
  advance(): void
  choose(id: string): void
  /** walk away mid-conversation: nothing is applied, the box just closes */
  leave(): void
  dismissEnding(): void
  skipIntro(): void
  destroy(): void
}

export type LifeGameOptions = {
  parent: HTMLElement
  engine: LifeEngine
  bus: LifeBus
  anchor: HistoricalAnchor
  prologueAnchor: HistoricalAnchor
}

export function createLifeGame(options: LifeGameOptions): LifeRuntime {
  const input = new InputState()

  const noop = {
    travel: () => undefined,
    minigame: () => undefined,
    ending: () => undefined,
    onOpen: () => undefined,
  }

  const dialogue = new DialogueRunner(options.engine, options.bus, noop, options.anchor)

  const context: LifeContext = {
    engine: options.engine,
    bus: options.bus,
    input,
    dialogue,
    anchor: options.anchor,
    prologueAnchor: options.prologueAnchor,
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.parent,
    backgroundColor: LIFE_PALETTE.ink,
    // Flat colour, hard edges, no filtering: the art is drawn at world scale and any
    // smoothing turns a 34px child into a smudge.
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    // The canvas must never eat a two-finger page gesture on a phone.
    input: { activePointers: 3 },
    scene: [BootScene, PrologueScene, WorldScene, FootballScene],
  })

  game.registry.set(CONTEXT_KEY, context)

  const worldScene = () => game.scene.getScene(WorldScene.KEY) as unknown as WorldScene | null

  return {
    input,
    resize: (width: number, height: number) => {
      if (width > 0 && height > 0) game.scale.resize(width, height)
    },
    advance: () => dialogue.advance(),
    choose: (id: string) => dialogue.choose(id),
    leave: () => dialogue.leave(),
    dismissEnding: () => worldScene()?.goHome(),
    skipIntro: () => {
      const prologue = game.scene.getScene(PrologueScene.KEY) as unknown as PrologueScene | null
      if (prologue && game.scene.isActive(PrologueScene.KEY)) prologue.skip()
    },
    destroy: () => {
      void options.engine.save()
      game.destroy(true)
    },
  }
}
