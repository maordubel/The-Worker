import Phaser from 'phaser'

import type { HistoricalAnchor } from '../anchors'
import { castFor } from '../characters'
import { OPPORTUNITIES_1986 } from '../content/opportunities1986'
import type { LifeEngine } from '../engine'
import { missedIn, takenIn } from '../opportunities'
import { buildProfile, type LifeProfile } from '../profile'
import type { LifeState } from '../types'

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

/**
 * מה שמסך יכול לשאול — the shell's whole view of the life.
 *
 * Deliberately a snapshot rather than a live object: React must never hold the engine,
 * or the day arrives when a re-render writes to it. Everything a card needs is already
 * translated into words by `lib/life/profile.ts`; the raw state comes along only for the
 * developer panel, which is the one screen allowed to see numbers.
 */
export type LifeSnapshot = {
  profile: LifeProfile
  /** what the afternoon actually offered, and what it took away again */
  taken: string[]
  missed: string[]
  /** developer-only: the whole truth, never rendered in production */
  state: LifeState
  events: number
}

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
  /** the profile screen: everything the shell may know, as words */
  snapshot(): LifeSnapshot
  /** the world stops while a card is open over it */
  pause(on: boolean): void
  /**
   * לוח הפיתוח — the only door into the life that is not a decision.
   *
   * Every one of these writes a real event through the engine, so a debugged life is
   * still a valid log and still reloads. It is exposed on the runtime rather than reached
   * for through a global, and the shell only renders the panel outside production
   * (`NODE_ENV`), which is what keeps rule 44 — never in production — a build fact rather
   * than a promise.
   */
  debug: {
    jump(minutes: number): void
    money(agorot: number): void
    energy(delta: number): void
    goTo(location: string): void
    bond(who: string, delta: number): void
    raise(flag: string): void
    reseed(seed: string): void
  }
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

  const snapshot = (): LifeSnapshot => {
    const state = options.engine.state
    const cast = castFor(String(state.year)).map((entry) => entry.id)
    return {
      profile: buildProfile(state, options.engine.log(), cast, ''),
      taken: takenIn(state, OPPORTUNITIES_1986).map((entry) => entry.titleHe),
      missed: missedIn(state, OPPORTUNITIES_1986).map((entry) => entry.titleHe),
      state,
      events: options.engine.log().length,
    }
  }

  return {
    input,
    resize: (width: number, height: number) => {
      if (width > 0 && height > 0) game.scale.resize(width, height)
    },
    advance: () => dialogue.advance(),
    choose: (id: string) => dialogue.choose(id),
    leave: () => dialogue.leave(),
    dismissEnding: () => worldScene()?.goHome(),
    snapshot,
    pause: (on: boolean) => worldScene()?.setPaused(on),
    debug: {
      jump: (minutes: number) => options.engine.dispatch({ t: 'clock.advanced', minutes }),
      money: (agorot: number) => options.engine.dispatch({ t: 'money.changed', agorot, why: 'debug' }),
      energy: (delta: number) => options.engine.dispatch({ t: 'energy.changed', delta }),
      goTo: (location: string) => worldScene()?.debugTravel(location),
      bond: (who: string, delta: number) => options.engine.dispatch({ t: 'bond.shifted', who, delta }),
      raise: (flag: string) => options.engine.dispatch({ t: 'flag.raised', flag }),
      reseed: (seed: string) => options.engine.dispatch({ t: 'rng.seeded', seed }),
    },
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
