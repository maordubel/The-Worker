import Phaser from 'phaser'

import type { LocationId } from '../../types'
import { fillZoom } from '../camera'
import { CONTEXT_KEY, type LifeContext } from '../context'
import { figureTexture } from '../figures'
import { LIFE_PALETTE } from '../palette'
import { paint, type PaintOp } from '../painter'
import { BALL, SHADOW } from '../textures'

import { WorldScene } from './WorldScene'

/**
 * שלושה על שלושה — the neighbourhood game.
 *
 * Brief §19 asks for one small football minigame that proves the life simulation can
 * contain real play. The scope is deliberately one screen, six players and four verbs,
 * and the design rule is that it must be winnable and losable by a thumb on a phone.
 *
 *  · **One button, three meanings.** Near the ball without it: a lunge that takes it.
 *    With it and near the goal: a shot. With it anywhere else: a pass to the teammate
 *    furthest forward. A second button on a touchscreen is a button nobody presses.
 *  · **Possession is proximity.** Whoever is closest to the ball inside a small radius
 *    owns it and drags it along in front of them. No dribble state machine, no ball
 *    physics to fight — which is what keeps it readable at 34 pixels tall.
 *  · **The AI is three lines.** The nearest opponent chases the ball, the others hold a
 *    band of the pitch. That is enough to make space feel like something you find.
 *
 * The result matters to the life (it moves an affinity and a friendship) and is never
 * shown as a number.
 */

const PITCH = { x: 40, y: 60, w: 640, h: 320 }
const TO_WIN = 3
const LENGTH_MS = 105000

type Player = {
  sprite: Phaser.Physics.Arcade.Sprite
  shadow: Phaser.GameObjects.Image
  team: 'red' | 'grey'
  human: boolean
  band: number
  frame: number
  timer: number
}

const LAYERS: PaintOp[] = [
  { k: 'fill', x: 0, y: 0, w: 720, h: 440, c: 'dirt' },
  { k: 'speckle', x: 0, y: 0, w: 720, h: 440, c: 'dirtDark', n: 260 },
  { k: 'wall', x: 0, y: 0, w: 720, h: 52 },
  { k: 'graffiti', x: 220, y: 10, w: 200, h: 34 },
  { k: 'fill', x: PITCH.x, y: PITCH.y, w: PITCH.w, h: 3, c: 'concreteDark' },
  { k: 'fill', x: PITCH.x, y: PITCH.y + PITCH.h, w: PITCH.w, h: 3, c: 'concreteDark' },
  { k: 'fill', x: PITCH.x - 6, y: PITCH.y + 110, w: 10, h: 14, c: 'stone' },
  { k: 'fill', x: PITCH.x - 6, y: PITCH.y + 200, w: 10, h: 14, c: 'stone' },
  { k: 'fill', x: PITCH.x + PITCH.w - 4, y: PITCH.y + 110, w: 10, h: 14, c: 'stone' },
  { k: 'fill', x: PITCH.x + PITCH.w - 4, y: PITCH.y + 200, w: 12, h: 14, c: 'redDeep' },
]

export class FootballScene extends Phaser.Scene {
  static readonly KEY = 'life-football'

  private ctx!: LifeContext
  private returnTo: LocationId = 'pitch'
  private returnSpawn = 'fromStreet'

  private ball!: Phaser.Physics.Arcade.Image
  private ballShadow!: Phaser.GameObjects.Image
  private players: Player[] = []
  private me!: Player
  private score = { red: 0, grey: 0 }
  private endsAt = 0
  private finished = false
  private lockUntil = 0
  private keys!: Record<string, Phaser.Input.Keyboard.Key>

  constructor() {
    super(FootballScene.KEY)
  }

  /** Same instance, second match — see the note on `WorldScene.init`. */
  init(data: { returnTo?: LocationId; spawn?: string }) {
    this.returnTo = data.returnTo ?? 'pitch'
    this.returnSpawn = data.spawn ?? 'fromStreet'

    this.players = []
    this.score = { red: 0, grey: 0 }
    this.finished = false
    this.lockUntil = 0
    this.endsAt = 0
  }

  create() {
    this.ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    this.cameras.main.setBackgroundColor(LIFE_PALETTE.dirt)

    const key = 'life-bg-football'
    if (!this.textures.exists(key)) {
      const brush = this.add.graphics()
      paint(brush, LAYERS, LIFE_PALETTE)
      brush.generateTexture(key, 720, 440)
      brush.destroy()
    }
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(-100)

    this.cameras.main.setBounds(0, 0, 720, 440)
    this.cameras.main.setZoom(fillZoom(this.cameras.main, 720, 440, 1.05))
    // The camera follows the BALL, not the child. On a portrait phone the pitch is wider
    // than the glass, and a camera locked to the player loses the ball exactly when it
    // matters — which is every time somebody passes.
    this.cameras.main.startFollow(this.ball, true, 0.08, 0.08)

    this.ballShadow = this.add.image(360, 226, SHADOW).setDepth(0).setScale(0.6)
    this.ball = this.physics.add.image(360, 220, BALL).setDepth(400)
    this.ball.setCircle(7).setBounce(0.62).setDrag(160).setMaxVelocity(430)
    this.ball.setCollideWorldBounds(false)

    this.players = []
    this.me = this.spawnPlayer(220, 220, 'red', true, 1)
    this.spawnPlayer(180, 140, 'red', false, 0)
    this.spawnPlayer(180, 300, 'red', false, 2)
    this.spawnPlayer(500, 150, 'grey', false, 0)
    this.spawnPlayer(520, 220, 'grey', false, 1)
    this.spawnPlayer(500, 300, 'grey', false, 2)

    this.endsAt = this.time.now + LENGTH_MS
    this.ctx.bus.emit('place', { id: 'pitch', title: 'שלושה על שלושה' })
    this.pushScore()
    this.cameras.main.fadeIn(300, 0, 0, 0)

    const keyboard = this.input.keyboard
    if (keyboard) {
      this.keys = keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT,SPACE,ENTER') as Record<
        string,
        Phaser.Input.Keyboard.Key
      >
    }
  }

  private spawnPlayer(x: number, y: number, team: 'red' | 'grey', human: boolean, band: number): Player {
    const figure = human ? 'kid' : team === 'red' ? 'kidRed' : 'kidGrey'
    const shadow = this.add.image(x, y, SHADOW).setDepth(1).setScale(0.8)
    const sprite = this.physics.add.sprite(x, y, figureTexture(figure, 'down', 0))
    sprite.setOrigin(0.5, 1)
    sprite.setData('figure', figure)
    const body = sprite.body as Phaser.Physics.Arcade.Body
    body.setSize(12, 8)
    body.setOffset((sprite.width - 12) / 2, sprite.height - 8)
    const entry: Player = { sprite, shadow, team, human, band, frame: 0, timer: 0 }
    this.players.push(entry)
    return entry
  }

  private pushScore() {
    const left = Math.max(0, Math.ceil((this.endsAt - this.time.now) / 1000))
    this.ctx.bus.emit('hud', {
      clock: `${this.score.red} — ${this.score.grey}`,
      agorot: left,
      showMoney: false,
      place: 'שלושה על שלושה',
      objective: null,
    })
  }

  override update(time: number, delta: number) {
    if (this.finished) return
    const ctx = this.ctx
    ctx.input.beginFrame()
    this.readKeyboard()

    const holder = this.holder()

    // --- the human ------------------------------------------------------------------
    const speed = 96
    this.me.sprite.setVelocity(ctx.input.x * speed, ctx.input.y * speed)
    this.animate(this.me, delta, ctx.input.x, ctx.input.y)

    if (ctx.input.actionPressed && time > this.lockUntil) {
      this.lockUntil = time + 220
      if (holder === this.me) this.kick()
      else this.lunge()
    }

    // --- the other five --------------------------------------------------------------
    for (const player of this.players) {
      if (player.human) continue
      this.think(player, holder, delta)
    }

    // --- the ball --------------------------------------------------------------------
    if (holder) {
      const facing = new Phaser.Math.Vector2(
        holder.sprite.x - (holder.sprite.getData('lastX') ?? holder.sprite.x - 1),
        holder.sprite.y - (holder.sprite.getData('lastY') ?? holder.sprite.y),
      )
      const push = facing.lengthSq() > 0.01 ? facing.normalize() : new Phaser.Math.Vector2(holder.team === 'red' ? 1 : -1, 0)
      const goalX = holder.sprite.x + push.x * 13
      const goalY = holder.sprite.y - 6 + push.y * 13
      this.ball.setVelocity((goalX - this.ball.x) * 8, (goalY - this.ball.y) * 8)
    }
    for (const player of this.players) {
      player.sprite.setData('lastX', player.sprite.x)
      player.sprite.setData('lastY', player.sprite.y)
      player.shadow.setPosition(player.sprite.x, player.sprite.y + 1)
      player.sprite.setDepth(player.sprite.y)
    }
    this.ballShadow.setPosition(this.ball.x, this.ball.y + 8)

    this.keepInside()
    this.checkGoal()
    this.pushScore()

    if (time > this.endsAt) this.finish()
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
  }

  private holder(): Player | null {
    let best: Player | null = null
    let bestDistance = 17
    for (const player of this.players) {
      const distance = Phaser.Math.Distance.Between(
        player.sprite.x,
        player.sprite.y - 8,
        this.ball.x,
        this.ball.y,
      )
      if (distance < bestDistance) {
        bestDistance = distance
        best = player
      }
    }
    return best
  }

  private kick() {
    const toGoal = 700 - this.me.sprite.x
    if (toGoal < 210) {
      // a shot — aimed between the stones, with the error a plastic ball deserves
      const targetY = 220 + Phaser.Math.Between(-34, 34)
      const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, 690, targetY)
      this.ball.setVelocity(Math.cos(angle) * 340, Math.sin(angle) * 340)
      return
    }
    const mate = this.players
      .filter((player) => player.team === 'red' && !player.human)
      .sort((a, b) => b.sprite.x - a.sprite.x)[0]
    const targetX = mate ? mate.sprite.x : this.me.sprite.x + 120
    const targetY = mate ? mate.sprite.y - 8 : this.me.sprite.y - 8
    const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, targetX, targetY)
    this.ball.setVelocity(Math.cos(angle) * 230, Math.sin(angle) * 230)
  }

  private lunge() {
    const angle = Phaser.Math.Angle.Between(
      this.me.sprite.x,
      this.me.sprite.y,
      this.ball.x,
      this.ball.y,
    )
    const distance = Phaser.Math.Distance.Between(this.me.sprite.x, this.me.sprite.y, this.ball.x, this.ball.y)
    if (distance > 46) return
    this.me.sprite.setVelocity(Math.cos(angle) * 210, Math.sin(angle) * 210)
  }

  private think(player: Player, holder: Player | null, delta: number) {
    const chase = holder === null || holder.team !== player.team
    const closest =
      chase &&
      this.players
        .filter((other) => other.team === player.team)
        .sort(
          (a, b) =>
            Phaser.Math.Distance.Between(a.sprite.x, a.sprite.y, this.ball.x, this.ball.y) -
            Phaser.Math.Distance.Between(b.sprite.x, b.sprite.y, this.ball.x, this.ball.y),
        )[0] === player

    let targetX: number
    let targetY: number
    if (chase && closest) {
      targetX = this.ball.x
      targetY = this.ball.y + 8
    } else if (holder === player) {
      targetX = player.team === 'red' ? 690 : 50
      targetY = 220
    } else {
      // hold a band of the pitch, ahead of the ball if your side has it
      const forward = holder?.team === player.team ? (player.team === 'red' ? 120 : -120) : 0
      targetX = Phaser.Math.Clamp(this.ball.x + forward, 90, 630)
      targetY = PITCH.y + 60 + player.band * 100
    }

    const angle = Phaser.Math.Angle.Between(player.sprite.x, player.sprite.y, targetX, targetY)
    const distance = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, targetX, targetY)
    const speed = distance < 8 ? 0 : player.team === 'grey' ? 74 : 78
    player.sprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
    this.animate(player, delta, Math.cos(angle) * (speed > 0 ? 1 : 0), Math.sin(angle) * (speed > 0 ? 1 : 0))

    if (holder === player && Phaser.Math.Between(0, 100) > 97) {
      const goalX = player.team === 'red' ? 700 : 20
      const shoot = Math.abs(goalX - player.sprite.x) < 220
      const angleToGoal = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, goalX, 220 + Phaser.Math.Between(-30, 30))
      this.ball.setVelocity(Math.cos(angleToGoal) * (shoot ? 320 : 210), Math.sin(angleToGoal) * (shoot ? 320 : 210))
    }
  }

  private animate(player: Player, delta: number, vx: number, vy: number) {
    const figure = String(player.sprite.getData('figure') ?? 'kid')
    const moving = Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05
    if (!moving) {
      player.frame = 0
      player.sprite.setTexture(figureTexture(figure, 'down', 0))
      return
    }
    player.timer += delta
    if (player.timer > 160) {
      player.timer = 0
      player.frame = player.frame === 1 ? 2 : 1
    }
    const direction = Math.abs(vx) > Math.abs(vy) ? 'side' : vy < 0 ? 'up' : 'down'
    player.sprite.setTexture(figureTexture(figure, direction, player.frame))
    player.sprite.setFlipX(direction === 'side' && vx < 0)
  }

  private keepInside() {
    for (const player of this.players) {
      player.sprite.x = Phaser.Math.Clamp(player.sprite.x, PITCH.x + 6, PITCH.x + PITCH.w - 6)
      player.sprite.y = Phaser.Math.Clamp(player.sprite.y, PITCH.y + 14, PITCH.y + PITCH.h - 4)
    }
    if (this.ball.y < PITCH.y + 6 || this.ball.y > PITCH.y + PITCH.h - 4) {
      this.ball.y = Phaser.Math.Clamp(this.ball.y, PITCH.y + 6, PITCH.y + PITCH.h - 4)
      this.ball.setVelocityY(-(this.ball.body?.velocity.y ?? 0) * 0.6)
    }
  }

  private checkGoal() {
    const inMouth = this.ball.y > PITCH.y + 104 && this.ball.y < PITCH.y + 216
    if (this.ball.x > PITCH.x + PITCH.w - 4 && inMouth) {
      this.score.red += 1
      this.restart()
      return
    }
    if (this.ball.x < PITCH.x + 4 && inMouth) {
      this.score.grey += 1
      this.restart()
      return
    }
    this.ball.x = Phaser.Math.Clamp(this.ball.x, PITCH.x + 6, PITCH.x + PITCH.w - 6)
  }

  private restart() {
    this.ctx.bus.emit('toast', {
      text: `${this.score.red} — ${this.score.grey}`,
      tone: this.score.red > this.score.grey ? 'red' : 'plain',
    })
    this.cameras.main.shake(180, 0.006)
    this.ball.setPosition(360, 220)
    this.ball.setVelocity(0, 0)
    this.me.sprite.setPosition(240, 220)
    if (this.score.red >= TO_WIN || this.score.grey >= TO_WIN) this.finish()
  }

  /**
   * What a street game leaves behind. Twenty-five minutes of the afternoon are gone
   * whatever the score — that is the trade brief §17 is about — and the rest of it goes
   * into numbers the player never sees.
   */
  private finish() {
    if (this.finished) return
    this.finished = true
    const won = this.score.red > this.score.grey
    this.ctx.engine.dispatch(
      { t: 'clock.advanced', minutes: 25 },
      { t: 'energy.changed', delta: -16 },
      { t: 'flag.raised', flag: 'played:football' },
      { t: 'trait.shifted', trait: 'footballAffinity', delta: won ? 8 : 5 },
      { t: 'trait.shifted', trait: 'streetSmarts', delta: 3 },
      { t: 'bond.shifted', who: 'ofir', delta: won ? 6 : 3 },
    )
    if (won) this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'won:football' })
    void this.ctx.engine.save()

    this.ctx.bus.emit('toast', {
      text: won ? 'ניצחתם.' : 'הפסדתם. יהיה מחר.',
      tone: won ? 'red' : 'plain',
    })
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(WorldScene.KEY, { mapId: this.returnTo, spawn: this.returnSpawn })
    })
  }
}
