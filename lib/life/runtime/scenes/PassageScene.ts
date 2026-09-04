import Phaser from 'phaser'

import { PASSAGE_1990, PASSAGE_CARD_HE } from '../../content/chapter1990'
import { ERA_1986, ERA_1990 } from '../../content/era'
import { sceneFor } from '../../world/scenes'
import { artUrl, extensionKeys } from '../art'
import { fillCamera } from '../camera'
import { CONTEXT_KEY, type LifeContext } from '../context'
import { LIFE_PALETTE } from '../palette'
import { strideAdvance } from '../walk'

import { WorldScene } from './WorldScene'

/**
 * ארבע שנים בלי תפריט — the passage from 1986 to 1990, played, not loaded.
 *
 * Brief §4 is exact about what this must not be: a button labelled "1990", or a loading
 * screen counting years. The Red Box has just closed on a Saturday in 1986; the latch is
 * still in the player's ear. The same bedroom comes back and the boy is still in it, and
 * he can still be walked. Four things in the room can be looked at, and each look moves
 * time: the light goes, the school bag grows, the football goes, the wall fills up with
 * Hapoel, and — between the second and third look — he is drawn older. When the last
 * object has been seen the room goes dark, the kitchen radio starts talking before the
 * picture changes, and a small card says the month. Then the kitchen table, and control.
 *
 * It is its own scene rather than a WorldScene mode because it is the one place in the
 * game where the clock does not run, no schedule applies, no door works and nobody can
 * be spoken to — a WorldScene with all of that switched off is a scene pretending.
 */

const ROOM = sceneFor('bedroom')

type Spot = { def: (typeof PASSAGE_1990)[number]; x: number; y: number; seen: boolean; mark: Phaser.GameObjects.Ellipse }

export class PassageScene extends Phaser.Scene {
  static readonly KEY = 'life-passage'

  private ctx!: LifeContext
  private W = 1
  private H = 1
  private player!: Phaser.GameObjects.Image
  private spots: Spot[] = []
  private seen = 0
  private busy = false
  private done = false
  private goal: { x: number; then: Spot | null } | null = null
  private facing = -1
  private stride = 0
  private dressing: Phaser.GameObjects.Image[] = []

  constructor() {
    super(PassageScene.KEY)
  }

  preload() {
    const ext = extensionKeys(ROOM.art)
    const need = [
      ROOM.art,
      ext.sky,
      ext.ground,
      ...Object.values(ERA_1986.player.pose),
      ...ERA_1986.player.walk,
      ...Object.values(ERA_1990.player.pose),
      ...ERA_1990.player.walk,
      'propPack80',
      'propBall80',
      'propPosters',
      'propSticker',
      'propScarfRed',
      'propPapers',
    ]
    for (const key of need) if (!this.textures.exists(`art-${key}`)) this.load.image(`art-${key}`, artUrl(key))
  }

  create() {
    this.ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    this.spots = []
    this.seen = 0
    this.busy = false
    this.done = false
    this.goal = null
    this.dressing = []

    this.cameras.main.setBackgroundColor(LIFE_PALETTE.night)
    const backdrop = this.add.image(0, 0, `art-${ROOM.art}`).setOrigin(0, 0).setDepth(-1000)
    this.W = backdrop.width
    this.H = backdrop.height
    const ext = extensionKeys(ROOM.art)
    let extra = 0
    if (this.textures.exists(`art-${ext.sky}`) && this.textures.exists(`art-${ext.ground}`)) {
      const sky = this.add.image(0, 0, `art-${ext.sky}`).setOrigin(0, 1).setDepth(-1001)
      const ground = this.add.image(0, this.H, `art-${ext.ground}`).setOrigin(0, 0).setDepth(-1001)
      sky.setDisplaySize(this.W, sky.height * (this.W / sky.width))
      ground.setDisplaySize(this.W, ground.height * (this.W / ground.width))
      extra = Math.min(sky.displayHeight, ground.displayHeight)
    }

    // The room as it was left in 1986: the ball in the corner, the bag by the bed, small.
    this.dress('propBall80', 0.62, 0.95, 0.06, 'ball')
    this.dress('propPack80', 0.12, 0.83, 0.05, 'bag')

    // The child, where the chapter always starts him.
    const y = 0.93 * this.H
    this.player = this.add.image(0.3 * this.W, y, `art-${ERA_1986.player.pose.down}`).setOrigin(0.5, 1).setDepth(y)
    this.sizePlayer(ROOM.size.near)

    for (const def of PASSAGE_1990) {
      const at = { clipping: 0.72, notebook: 0.17, scarf: 0.89, photo: 0.47 }[def.id] ?? 0.5
      const mark = this.add
        .ellipse(at * this.W, 0.905 * this.H, 26, 26 * 0.32, LIFE_PALETTE.red, 0)
        .setStrokeStyle(2, LIFE_PALETTE.red, 0.7)
        .setDepth(1)
      this.tweens.add({ targets: mark, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 })
      this.spots.push({ def, x: at * this.W, y: 0.92 * this.H, seen: false, mark })
    }

    const cam = this.cameras.main
    const view = this.scale.gameSize
    fillCamera(this, cam, this.W, this.H + 2 * extra, view.height > view.width ? 1 : 1.03)
    cam.setBounds(0, -extra, this.W, this.H + 2 * extra)
    cam.startFollow(this.player, true, 0.08, 0.08)
    cam.setFollowOffset(0, (0.68 - 0.5) * (cam.height / cam.zoom))
    cam.fadeIn(1200, 0, 0, 0)
    const onResize = () => {
      const v = this.scale.gameSize
      fillCamera(this, cam, this.W, this.H + 2 * extra, v.height > v.width ? 1 : 1.03)
      cam.setFollowOffset(0, (0.68 - 0.5) * (cam.height / cam.zoom))
    }
    this.scale.on('resize', onResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', onResize, this))

    this.ctx.bus.emit('frame', { picture: 0 })
    this.ctx.bus.emit('place', { id: 'bedroom', title: ROOM.titleHe, ambience: 'interior' })
    this.ctx.bus.emit('controls', { visible: true })
    this.ctx.bus.emit('match', null)
    this.ctx.bus.emit('hud', {
      clock: '',
      date: '1986',
      agorot: 0,
      showMoney: false,
      place: ROOM.titleHe,
      objective: 'החדר שלך. תסתכל מסביב.',
    })

    this.ctx.dialogue.setHooks({
      travel: () => undefined,
      minigame: () => undefined,
      ending: () => undefined,
      onOpen: (open) => {
        this.busy = open
      },
    })

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.pointAt(pointer.worldX))
  }

  pointAtScreen(clientX: number, clientY: number) {
    const canvas = this.game.canvas
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0) return
    const canvasX = ((clientX - rect.left) / rect.width) * this.scale.width
    const cam = this.cameras.main
    void clientY
    this.pointAt(cam.scrollX + canvasX / cam.zoom)
  }

  private pointAt(worldX: number) {
    if (this.busy || this.done) return
    const near = this.spots.find((spot) => !spot.seen && Math.abs(spot.x - worldX) < this.W * 0.09)
    const x = Phaser.Math.Clamp(near ? near.x + (this.player.x < near.x ? -1 : 1) * this.W * 0.06 : worldX, this.W * 0.04, this.W * 0.96)
    this.goal = { x, then: near ?? null }
  }

  private dress(key: string, x: number, y: number, w: number, name: string) {
    const image = this.add.image(x * this.W, y * this.H, `art-${key}`).setOrigin(0.5, 1).setDepth(y * this.H)
    const source = this.textures.get(`art-${key}`).getSourceImage()
    const width = w * this.W
    image.setDisplaySize(width, width * ((source.height || 1) / (source.width || 1)))
    image.setName(name)
    this.dressing.push(image)
    return image
  }

  private sizePlayer(fraction: number) {
    const source = this.textures.get(this.player.texture.key).getSourceImage()
    const height = fraction * this.H
    this.player.setDisplaySize(height * ((source.width || 1) / (source.height || 1)), height)
  }

  override update(_time: number, delta: number) {
    this.ctx.input.beginFrame()
    if (this.busy || this.done) return
    const era = this.seen >= 2 ? ERA_1990 : ERA_1986
    const input = this.ctx.input
    let ax = input.x
    if (Math.abs(ax) > 0.08 && this.goal) this.goal = null
    let arrived: Spot | null = null
    if (this.goal && Math.abs(ax) <= 0.08) {
      const dx = this.goal.x - this.player.x
      if (Math.abs(dx) < this.W * 0.008) {
        arrived = this.goal.then
        this.goal = null
        ax = 0
      } else ax = Math.sign(dx) * Math.min(1, Math.abs(dx) / (this.W * 0.05))
    }
    const speed = 1.5 * this.player.displayHeight
    const moved = ax * speed * (delta / 1000)
    this.player.x = Phaser.Math.Clamp(this.player.x + moved, this.W * 0.04, this.W * 0.96)
    if (Math.abs(ax) > 0.08) {
      this.facing = ax < 0 ? -1 : 1
      this.stride += strideAdvance(Math.abs(moved), this.player.displayHeight, era.player.walk.length)
      const frame = era.player.walk[Math.floor(this.stride) % era.player.walk.length] ?? era.player.walk[0]
      this.player.setTexture(`art-${frame}`)
    } else {
      this.player.setTexture(`art-${era.player.pose.down}`)
    }
    this.player.setFlipX(this.facing < 0)
    this.sizePlayer(ROOM.size.near * (era.player.scale ?? 1))

    if (arrived) this.look(arrived)
    else if (input.actionPressed) {
      const near = this.spots.find((spot) => !spot.seen && Math.abs(spot.x - this.player.x) < this.W * 0.1)
      if (near) this.look(near)
    }

    const near = this.spots.find((spot) => !spot.seen && Math.abs(spot.x - this.player.x) < this.W * 0.1)
    this.ctx.bus.emit('prompt', near ? { verb: 'look', label: near.def.labelHe, locked: false } : null)
  }

  /** Developer-only: the boy and the four things left to look at, for the probes. */
  where() {
    return {
      scene: 'passage',
      x: Number((this.player.x / this.W).toFixed(3)),
      y: 0,
      paused: this.busy,
      spots: this.spots.filter((spot) => !spot.seen).map((spot) => Number((spot.x / this.W).toFixed(3))),
    }
  }

  /** One look: what he sees, what changed — and the room moving on a year. */
  private look(spot: Spot) {
    if (spot.seen || this.busy) return
    spot.seen = true
    spot.mark.destroy()
    this.seen += 1
    this.ctx.bus.emit('prompt', null)
    const n = this.seen
    this.ctx.dialogue.startLines([{ who: null, text: spot.def.lookHe }], () => {
      this.passYear(n)
      this.time.delayedCall(900, () => {
        this.ctx.dialogue.startLines([{ who: null, text: spot.def.afterHe }], () => {
          if (this.seen >= PASSAGE_1990.length) this.finish()
        })
      })
    })
  }

  /**
   * A year, visibly. The light warms and drops, the football goes, the bag grows, the
   * wall gains Hapoel; between the second and third look the boy is drawn older. None of
   * it is a card with a number on it.
   */
  private passYear(n: number) {
    const cam = this.cameras.main
    cam.flash(260, 21, 18, 14)
    // The one number this scene allows itself: the year in the corner, ticking over under
    // the flash. 1987, 1988, 1989 — and the fourth look is the cut to May 1990 itself.
    this.ctx.bus.emit('hud', {
      clock: '',
      date: String(1986 + Math.min(n, 3)),
      agorot: 0,
      showMoney: false,
      place: ROOM.titleHe,
      objective: n >= PASSAGE_1990.length ? '' : 'החדר שלך. תסתכל מסביב.',
    })
    const dark = 1 - n * 0.09
    for (const child of this.children.list) {
      if (child instanceof Phaser.GameObjects.Image && child.depth <= -1000) {
        this.tweens.add({ targets: child, alpha: dark, duration: 700 })
      }
    }
    if (n === 1) {
      const ball = this.dressing.find((image) => image.name === 'ball')
      if (ball) this.tweens.add({ targets: ball, alpha: 0, duration: 600, onComplete: () => ball.destroy() })
      this.dress('propSticker', 0.78, 0.6, 0.035, 'wall1')
    }
    if (n === 2) {
      const bag = this.dressing.find((image) => image.name === 'bag')
      if (bag) this.tweens.add({ targets: bag, displayWidth: bag.displayWidth * 1.5, displayHeight: bag.displayHeight * 1.5, duration: 700 })
      this.dress('propPapers', 0.66, 0.66, 0.05, 'wall2')
      // …and he is older. The swap happens under the flash, which is where a cut belongs.
      this.player.setTexture(`art-${ERA_1990.player.pose.down}`)
      this.sizePlayer(ROOM.size.near * (ERA_1990.player.scale ?? 1))
    }
    if (n === 3) this.dress('propScarfRed', 0.9, 0.72, 0.06, 'wall3')
    if (n === 4) this.dress('propPosters', 0.36, 0.56, 0.06, 'wall4')
  }

  /**
   * The cut to 1990: sound first, then dark, then the month, then the kitchen. The
   * `year.entered` event is written HERE, once, and the chapter opens on the table.
   */
  private finish() {
    if (this.done) return
    this.done = true
    this.ctx.bus.emit('prompt', null)
    this.ctx.bus.emit('controls', { visible: false })
    this.ctx.bus.emit('toast', { text: 'מהמטבח: רדיו. מישהו מסובב את הכפתור.', tone: 'plain' })
    this.time.delayedCall(1600, () => {
      this.cameras.main.fadeOut(900, 0, 0, 0)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.ctx.bus.emit('card', { titleHe: PASSAGE_CARD_HE, subHe: null, ms: 2200 })
        this.time.delayedCall(2400, () => {
          this.ctx.engine.dispatch(
            { t: 'year.entered', year: ERA_1990.year, weekday: 6, minute: 12 * 60 + 35 },
            { t: 'chapter.entered', chapter: ERA_1990.chapter },
            { t: 'flag.raised', flag: 'life:passage-1990' },
          )
          void this.ctx.engine.save()
          this.ctx.bus.emit('controls', { visible: true })
          this.scene.start(WorldScene.KEY, { mapId: 'kitchen', spawn: 'fromHome' })
        })
      })
    })
  }
}
