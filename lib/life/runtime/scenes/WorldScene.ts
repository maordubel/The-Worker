import Phaser from 'phaser'

import { ENDINGS, OBJECTIVES } from '../../content/chapter1980'
import { clockLabel } from '../../clock'
import type { LifeState, LocationId } from '../../types'
import { KICKOFF, KOBI_LEAVES, FULL_TIME, mapFor } from '../../world/maps'
import { meets, type ExitDef, type MapDef, type NpcDef, type PropDef } from '../../world/types'
import { fillZoom } from '../camera'
import { CONTEXT_KEY, type LifeContext } from '../context'
import { figureTexture, type Direction } from '../figures'
import { LIFE_PALETTE, paletteFor } from '../palette'
import { paint } from '../painter'
import { BALL, MARK, SHADOW } from '../textures'

/**
 * הסצנה — one scene class, every location.
 *
 * `WorldScene` is the game: walking, bumping into things, being near enough to something
 * to touch it, doors, people who move on their own, and a clock that does not wait. It
 * reads a `MapDef` and knows nothing about which map it is — with three named exceptions,
 * all of them the Bloomfield sequence, because brief §13 asks for a moment and a moment
 * is by definition not generic.
 *
 * Two decisions worth stating because they are easy to get wrong later:
 *
 *  · **The body is the feet.** A physics body the size of the sprite makes a child
 *    collide with a table at head height, which feels like glue. The body is a short box
 *    at the bottom of the figure and the rest of the drawing overhangs it, which is what
 *    makes a top-down world feel like a floor.
 *  · **Depth is Y.** Everything that moves sorts on its own baseline, so you walk behind
 *    a wall and in front of a car without a single manual layer number.
 */

type Interactable = {
  kind: 'prop' | 'npc' | 'exit'
  rect: Phaser.Geom.Rectangle
  act?: string
  exit?: ExitDef
  when?: PropDef['when']
  visible: boolean
}

const SPEED = 74
const RUN = 118
const REACH = 16

export class WorldScene extends Phaser.Scene {
  static readonly KEY = 'life-world'

  private ctx!: LifeContext
  private map!: MapDef
  private spawnName = 'start'

  private player!: Phaser.Physics.Arcade.Sprite
  private playerShadow!: Phaser.GameObjects.Image
  private facing: Direction = 'down'
  private flip = false
  private stepTimer = 0
  private stepFrame = 0

  private npcs: Array<{ def: NpcDef; sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image; leg: number; wait: number }> = []
  private extras!: Phaser.GameObjects.Graphics
  private interactables: Interactable[] = []
  private mark!: Phaser.GameObjects.Image
  private target: Interactable | null = null

  private paused = false
  private minuteAcc = 0
  private timeScale = 1
  private lastFlagCount = 0
  private matchPhase: 'none' | 'watching' | 'over' = 'none'
  private keys!: Record<string, Phaser.Input.Keyboard.Key>

  constructor() {
    super(WorldScene.KEY)
  }

  /**
   * `scene.restart()` REUSES the instance.
   *
   * Class fields are initialised once, at construction, and never again — so every piece
   * of mutable state here has to be reset by hand or it leaks from the last room into the
   * next one. This was not a theory: `travel()` sets `paused = true` before fading out,
   * and without the reset below the child walked out of the bedroom and could never move
   * again, because the new scene inherited the old one's pause. The clock stopped with it.
   *
   * Anything that is not derived from the map in `create()` belongs in this list.
   */
  init(data: { mapId?: LocationId; spawn?: string }) {
    this.map = mapFor(data.mapId ?? 'bedroom')
    this.spawnName = data.spawn ?? 'start'

    this.paused = false
    this.minuteAcc = 0
    this.timeScale = 1
    this.matchPhase = 'none'
    this.target = null
    this.facing = 'down'
    this.flip = false
    this.stepTimer = 0
    this.stepFrame = 0
    this.lastFlagCount = 0
    this.npcs = []
    this.interactables = []
  }

  create() {
    this.ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    const palette = paletteFor(this.ctx.engine.state.year)

    this.cameras.main.setBackgroundColor(
      this.map.base === 'night' ? LIFE_PALETTE.night : this.map.base === 'interior' ? LIFE_PALETTE.plasterShade : LIFE_PALETTE.sky,
    )

    // --- the painted world ---------------------------------------------------------
    const backgroundKey = `life-bg-${this.map.id}`
    if (!this.textures.exists(backgroundKey)) {
      const brush = this.add.graphics()
      paint(brush, this.map.layers, palette)
      brush.generateTexture(backgroundKey, this.map.width, this.map.height)
      brush.destroy()
    }
    this.add.image(0, 0, backgroundKey).setOrigin(0, 0).setDepth(-1000)

    // Conditional paint lives in a live Graphics rather than a baked texture: the red
    // box filling up and the terrace emptying out are state, and state changes.
    this.extras = this.add.graphics().setDepth(-900)

    if (this.map.overlay) {
      const over = this.add.graphics().setDepth(9000)
      paint(over, this.map.overlay, palette)
    }

    // --- solids --------------------------------------------------------------------
    const solids = this.physics.add.staticGroup()
    for (const rect of this.map.solids) {
      const body = this.add.rectangle(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h)
      body.setVisible(false)
      solids.add(body)
    }

    // --- the child -----------------------------------------------------------------
    const spawn = this.map.spawns[this.spawnName] ?? Object.values(this.map.spawns)[0] ?? { x: 40, y: 40 }
    this.playerShadow = this.add.image(spawn.x, spawn.y, SHADOW).setDepth(1)
    this.player = this.physics.add.sprite(spawn.x, spawn.y, figureTexture('kid', 'down', 0))
    this.player.setOrigin(0.5, 1)
    this.player.setDepth(spawn.y)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setSize(14, 9)
    body.setOffset((this.player.width - 14) / 2, this.player.height - 9)
    this.physics.add.collider(this.player, solids)

    // --- people --------------------------------------------------------------------
    this.npcs = []
    for (const def of this.map.npcs) {
      const shadow = this.add.image(def.x, def.y, SHADOW).setDepth(1)
      const sprite = this.add
        .sprite(def.x, def.y, figureTexture(def.figure, 'down', 0))
        .setOrigin(0.5, 1)
        .setDepth(def.y)
      if (def.facing === 'up') sprite.setTexture(figureTexture(def.figure, 'up', 0))
      if (def.facing === 'left' || def.facing === 'right') {
        sprite.setTexture(figureTexture(def.figure, 'side', 0))
        sprite.setFlipX(def.facing === 'left')
      }
      this.npcs.push({ def, sprite, shadow, leg: 0, wait: 600 + Math.random() * 900 })
    }

    // --- what you can reach --------------------------------------------------------
    this.mark = this.add.image(0, 0, MARK).setDepth(9500).setVisible(false)
    this.rebuildInteractables()

    // --- camera --------------------------------------------------------------------
    this.cameras.main.setBounds(0, 0, this.map.width, this.map.height)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.applyZoom()
    this.scale.on('resize', this.applyZoom, this)

    // --- keyboard ------------------------------------------------------------------
    const keyboard = this.input.keyboard
    if (keyboard) {
      this.keys = keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT,SPACE,ENTER,SHIFT') as Record<
        string,
        Phaser.Input.Keyboard.Key
      >
    }

    // --- hooks and state -----------------------------------------------------------
    this.ctx.dialogue.setHooks({
      travel: (to, spawnName) => this.travel(to as LocationId, spawnName),
      minigame: () => this.startMinigame(),
      ending: (id) => this.finishChapter(id),
      onOpen: (open) => {
        this.paused = open
        if (open) this.player.setVelocity(0, 0)
      },
    })

    this.ctx.engine.dispatch({ t: 'moved', to: this.map.id })
    this.ctx.bus.emit('place', { id: this.map.id, title: this.map.titleHe })
    this.refresh(this.ctx.engine.state)
    this.pushHud()

    // The one place that is not a room.
    if (this.map.id === 'bloomfield-inside') this.openBloomfield()

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.applyZoom, this)
    })
  }

  // ---------------------------------------------------------------------------------

  private applyZoom() {
    const base = this.map.zoom ?? 2.2
    this.cameras.main.setZoom(
      fillZoom(this.cameras.main, this.map.width, this.map.height, base * 0.75),
    )
  }

  private rebuildInteractables() {
    const state = this.ctx.engine.state
    this.interactables = []
    for (const prop of this.map.props) {
      this.interactables.push({
        kind: 'prop',
        rect: new Phaser.Geom.Rectangle(prop.x, prop.y, prop.w, prop.h),
        ...(prop.act ? { act: prop.act } : {}),
        ...(prop.when ? { when: prop.when } : {}),
        visible: meets(state, prop.when),
      })
    }
    for (const npc of this.npcs) {
      const visible = meets(state, npc.def.when)
      npc.sprite.setVisible(visible)
      npc.shadow.setVisible(visible)
      this.interactables.push({
        kind: 'npc',
        rect: new Phaser.Geom.Rectangle(npc.sprite.x - 14, npc.sprite.y - 16, 28, 20),
        ...(npc.def.talk ? { act: npc.def.talk } : {}),
        ...(npc.def.when ? { when: npc.def.when } : {}),
        visible,
      })
    }
    for (const exit of this.map.exits) {
      this.interactables.push({
        kind: 'exit',
        rect: new Phaser.Geom.Rectangle(exit.x, exit.y, exit.w, exit.h),
        exit,
        ...(exit.when ? { when: exit.when } : {}),
        visible: meets(state, exit.when),
      })
    }
  }

  /** Re-evaluate everything that a flag or the clock can change. */
  private refresh(state: LifeState) {
    const palette = paletteFor(state.year)
    this.extras.clear()
    for (const block of this.map.extra ?? []) {
      if (meets(state, block.when)) paint(this.extras, block.layers, palette)
    }
    this.rebuildInteractables()
    this.lastFlagCount = Object.keys(state.flags).length
  }

  private pushHud() {
    const state = this.ctx.engine.state
    this.ctx.bus.emit('hud', {
      clock: clockLabel(state.weekday, state.minute),
      agorot: state.agorot,
      showMoney: state.agorot > 0,
      place: this.map.titleHe,
      objective: this.objective(state),
    })
  }

  private objective(state: LifeState): string | null {
    if (state.flags['found:kobi']) return null
    if (this.map.id === 'bloomfield-inside' && this.matchPhase === 'over') return OBJECTIVES.findKobi
    if (state.flags['entry:granted']) return null
    if (this.map.id === 'bloomfield-outside') return OBJECTIVES.atGround
    if (state.flags['kobi:left'] && (this.map.id === 'route' || this.map.id === 'street'))
      return OBJECTIVES.onTheWay
    if (state.flags['kobi:left']) return OBJECTIVES.afterKobi
    return OBJECTIVES.morning
  }

  // ---------------------------------------------------------------------------------

  override update(_time: number, delta: number) {
    const ctx = this.ctx
    ctx.input.beginFrame()
    this.readKeyboard()

    if (this.paused) {
      this.player.setVelocity(0, 0)
      return
    }

    this.moveNpcs(delta)
    this.movePlayer(delta)
    this.tickClock(delta)
    this.aim()

    if (ctx.input.actionPressed) this.act()
    this.checkAutoExits()

    if (Object.keys(ctx.engine.state.flags).length !== this.lastFlagCount) {
      this.refresh(ctx.engine.state)
    }
  }

  private readKeyboard() {
    if (!this.keys) return
    const down = (name: string) => this.keys[name]?.isDown === true
    let x = 0
    let y = 0
    if (down('A') || down('LEFT')) x -= 1
    if (down('D') || down('RIGHT')) x += 1
    if (down('W') || down('UP')) y -= 1
    if (down('S') || down('DOWN')) y += 1
    this.ctx.input.setKeys(x, y)
    this.ctx.input.setKeyAction(down('SPACE') || down('ENTER'))
    this.ctx.input.setRun(down('SHIFT'))
  }

  private movePlayer(delta: number) {
    const input = this.ctx.input
    const canRun = input.run && this.ctx.engine.state.energy > 6
    const speed = canRun ? RUN : SPEED
    this.player.setVelocity(input.x * speed, input.y * speed)

    const moving = Math.abs(input.x) > 0.06 || Math.abs(input.y) > 0.06
    if (moving) {
      if (Math.abs(input.x) > Math.abs(input.y)) {
        this.facing = 'side'
        this.flip = input.x < 0
      } else {
        this.facing = input.y < 0 ? 'up' : 'down'
      }
      this.stepTimer += delta * (canRun ? 1.5 : 1)
      if (this.stepTimer > 170) {
        this.stepTimer = 0
        this.stepFrame = this.stepFrame === 1 ? 2 : 1
      }
      if (canRun) {
        this.ctx.engine.dispatch({ t: 'energy.changed', delta: -delta / 2400 })
      }
    } else {
      this.stepFrame = 0
      this.stepTimer = 0
    }

    this.player.setTexture(figureTexture('kid', this.facing, this.stepFrame))
    this.player.setFlipX(this.facing === 'side' && this.flip)
    this.player.setDepth(this.player.y)
    this.playerShadow.setPosition(this.player.x, this.player.y + 1)
  }

  private moveNpcs(delta: number) {
    for (const npc of this.npcs) {
      if (!npc.sprite.visible) continue
      const route = npc.def.route
      if (!route || route.length === 0) continue
      const point = route[npc.leg % route.length]
      if (!point) continue
      npc.wait -= delta
      if (npc.wait > 0) {
        npc.sprite.setTexture(figureTexture(npc.def.figure, 'down', 0))
        continue
      }
      const dx = point.x - npc.sprite.x
      const dy = point.y - npc.sprite.y
      const distance = Math.hypot(dx, dy)
      if (distance < 3) {
        npc.leg += 1
        npc.wait = point.wait ?? 1600
        continue
      }
      const step = (delta / 1000) * 26
      npc.sprite.x += (dx / distance) * step
      npc.sprite.y += (dy / distance) * step
      npc.shadow.setPosition(npc.sprite.x, npc.sprite.y + 1)
      npc.sprite.setDepth(npc.sprite.y)
      const facing: Direction = Math.abs(dx) > Math.abs(dy) ? 'side' : dy < 0 ? 'up' : 'down'
      npc.sprite.setTexture(figureTexture(npc.def.figure, facing, Math.floor(Date.now() / 190) % 2 === 0 ? 1 : 2))
      npc.sprite.setFlipX(facing === 'side' && dx < 0)
    }
  }

  private tickClock(delta: number) {
    this.minuteAcc += (delta / 1000) * this.timeScale
    if (this.minuteAcc < 1) return
    const minutes = Math.floor(this.minuteAcc)
    this.minuteAcc -= minutes
    this.ctx.engine.dispatch({ t: 'clock.advanced', minutes })
    this.runTimeTriggers()
    this.pushHud()
  }

  /**
   * The world does not wait (brief §17). These are the only three moments the clock owns,
   * and each of them changes what is in the world rather than telling the player anything.
   */
  private runTimeTriggers() {
    const engine = this.ctx.engine
    const state = engine.state

    if (state.minute >= KOBI_LEAVES && !state.flags['kobi:left']) {
      engine.dispatch({ t: 'flag.raised', flag: 'kobi:left' })
      this.ctx.bus.emit('toast', { text: 'הדלת נטרקת. אבא יצא.', tone: 'red' })
      this.refresh(engine.state)
    }

    if (state.minute >= KICKOFF && !state.flags['match:started']) {
      engine.dispatch({ t: 'flag.raised', flag: 'match:started' })
      if (this.map.id !== 'bloomfield-inside') {
        this.ctx.bus.emit('toast', { text: 'רעש רחוק, מכיוון מזרח.', tone: 'plain' })
      }
    }

    if (state.minute >= FULL_TIME && !state.flags['match:over']) {
      engine.dispatch({ t: 'flag.raised', flag: 'match:over' })
      if (this.map.id !== 'bloomfield-inside') {
        engine.dispatch({ t: 'flag.raised', flag: 'arrived:late' })
      }
      this.refresh(engine.state)
    }
  }

  // ---------------------------------------------------------------------------------

  private aim() {
    const reach = new Phaser.Geom.Rectangle(
      this.player.x - REACH,
      this.player.y - REACH - 6,
      REACH * 2,
      REACH * 2,
    )
    let best: Interactable | null = null
    let bestDistance = Infinity
    for (const item of this.interactables) {
      if (!item.visible) continue
      if (item.kind === 'exit' && item.exit && !item.exit.manual) continue
      if (!Phaser.Geom.Intersects.RectangleToRectangle(reach, item.rect)) continue
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        item.rect.centerX,
        item.rect.centerY,
      )
      if (distance < bestDistance) {
        bestDistance = distance
        best = item
      }
    }

    this.target = best
    if (best) {
      this.mark.setVisible(true)
      this.mark.setPosition(best.rect.centerX, best.rect.top - 8)
    } else {
      this.mark.setVisible(false)
    }
    this.ctx.bus.emit('prompt', best ? (best.kind === 'exit' ? 'ללכת' : 'לגעת') : null)
  }

  private act() {
    const target = this.target
    if (!target) return
    if (target.kind === 'exit' && target.exit) {
      this.travel(target.exit.to, target.exit.spawn)
      return
    }
    if (!target.act) return
    const started = this.ctx.dialogue.start(target.act)
    if (!started) this.ctx.bus.emit('prompt', null)
  }

  private checkAutoExits() {
    const state = this.ctx.engine.state
    for (const exit of this.map.exits) {
      if (exit.manual) continue
      if (!meets(state, exit.when)) continue
      const rect = new Phaser.Geom.Rectangle(exit.x, exit.y, exit.w, exit.h)
      if (!rect.contains(this.player.x, this.player.y)) continue
      this.travel(exit.to, exit.spawn)
      return
    }
  }

  private travel(to: LocationId, spawn: string) {
    if (this.paused) return
    this.paused = true
    this.ctx.bus.emit('prompt', null)
    this.cameras.main.fadeOut(220, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      void this.ctx.engine.save()
      this.scene.restart({ mapId: to, spawn })
    })
  }

  private startMinigame() {
    this.paused = true
    this.cameras.main.fadeOut(220, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('life-football', { returnTo: this.map.id, spawn: 'fromStreet' })
    })
  }

  // ---------------------------------------------------------------------------------

  /**
   * בלומפילד — the reveal (brief §13).
   *
   * The child comes out of a dark corridor two metres wide into a bowl. The camera is
   * what says that: it starts pressed against him at four times the map's zoom and opens
   * out over two and a half seconds while the terraces come up the screen. Nothing else
   * in the game does this, which is the point.
   */
  private openBloomfield() {
    const camera = this.cameras.main
    const target = camera.zoom
    const state = this.ctx.engine.state

    camera.setZoom(target * 3.2)
    camera.fadeIn(400, 0, 0, 0)
    this.paused = true
    this.ctx.bus.emit('prompt', null)

    this.tweens.add({
      targets: camera,
      zoom: target,
      duration: 2600,
      delay: 500,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.paused = false
        this.ctx.bus.emit('anchor', { anchor: this.ctx.anchor, showing: true })
        if (state.flags['match:over']) {
          this.matchPhase = 'over'
          this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'arrived:late' })
          this.refresh(this.ctx.engine.state)
          this.pushHud()
          return
        }
        this.watchMatch()
      },
    })
  }

  /**
   * The match itself is not simulated and must not be: the archive does not know what
   * happened in it (see `lib/life/anchor-server.ts`). So the player stands on a terrace
   * among people, the clock runs at match pace, and the whistle goes. The game states
   * the season and the title — both canonical — and nothing else.
   */
  private watchMatch() {
    this.matchPhase = 'watching'
    this.timeScale = 26
    this.ctx.bus.emit('toast', { text: 'המשחק מתחיל.', tone: 'red' })

    const check = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.ctx.engine.state.minute < FULL_TIME) return
        check.remove()
        this.timeScale = 1
        this.matchPhase = 'over'
        this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'match:over' }, { t: 'anchor.attended', anchorId: this.ctx.anchor.id })
        this.refresh(this.ctx.engine.state)
        this.pushHud()
        this.ctx.bus.emit('anchor', { anchor: this.ctx.anchor, showing: true })
        this.cameras.main.shake(700, 0.004)
      },
    })
  }

  /** The closing card. There is no score screen, because there is no score. */
  private finishChapter(endingId: string) {
    const state = this.ctx.engine.state
    const key = state.flags['arrived:late'] && endingId === 'home' ? 'late' : endingId
    const card = ENDINGS[key] ?? ENDINGS['missed']
    if (!card) return

    this.ctx.engine.dispatch(
      {
        t: 'memory.kept',
        memory: {
          id: `1980-${card.id}`,
          item: card.memoryItem,
          atMinute: state.minute,
          year: state.year,
          anchorId: this.ctx.anchor.id,
        },
      },
      { t: 'flag.raised', flag: 'memory:first' },
      state.flags['match:started'] && state.flags['entry:granted']
        ? { t: 'anchor.attended', anchorId: this.ctx.anchor.id }
        : { t: 'anchor.missed', anchorId: this.ctx.anchor.id },
      { t: 'chapter.completed', chapter: '1980' },
    )
    void this.ctx.engine.save()

    this.paused = true
    this.ctx.bus.emit('ending', {
      titleHe: card.titleHe,
      bodyHe: card.bodyHe,
      memoryHe: card.memoryHe,
    })
  }

  /** Called by the shell when the closing card is dismissed: back to the bedroom. */
  goHome() {
    this.paused = false
    this.ctx.bus.emit('ending', null)
    this.travel('bedroom', 'start')
  }

  /** The ball texture is referenced here so the minigame and the world share one asset. */
  static get ballTexture() {
    return BALL
  }
}
