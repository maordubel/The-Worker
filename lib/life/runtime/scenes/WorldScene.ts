import Phaser from 'phaser'

import { clockLabel } from '../../clock'
import { ENDINGS, OBJECTIVES } from '../../content/chapter1980'
import type { LifeState, LocationId } from '../../types'
import { FULL_TIME, KICKOFF, KOBI_LEAVES, sceneFor } from '../../world/scenes'
import type { ActorDef, ExitDef, HotspotDef, SceneDef, Verb } from '../../world/scenes'
import { meets } from '../../world/types'
import { artUrl, KID_POSE, KID_WALK } from '../art'
import { frameCamera } from '../camera'
import { CONTEXT_KEY, type LifeContext } from '../context'
import { LIFE_PALETTE } from '../palette'

/**
 * הסצנה — one painted place, the strip of floor you may stand on, and the rule that you
 * are never allowed to wonder how to leave it.
 *
 * The first version of this scene could be played by the person who wrote it. A playtest
 * found the real problem in ninety seconds: the player stayed inside the house because
 * leaving was not obvious, and the clock took his father to the match while he was still
 * working out the controls. That is not difficulty, it is a broken interface charging
 * the player for its own faults. Five things here exist to make sure it cannot happen
 * again, and they are the substance of this file:
 *
 *  · **Every door has a light on it.** Not a trigger volume — a warm glow painted over
 *    the doorway in the picture, visible from anywhere in the room, breathing slowly.
 *    The way out of the flat gets DAYLIGHT, which no interior door has, so the front
 *    door does not look like the bedroom door.
 *  · **Everything interactive says what it is and what will happen.** `לגעת` told the
 *    player nothing. `דבר עם קובי`, `צא לרחוב`, `קח את הבקבוקים` tell them everything,
 *    and the same button does all of it.
 *  · **Walking into a door works, and so does the button.** A player who has just
 *    learned to walk should not also have to learn which doors need a keypress. A short
 *    dwell stops a passing step from throwing you into another room.
 *  · **The clock does not start until the child is in the street.** Time is the
 *    chapter's antagonist and it stays that way — but it may not bill the player for
 *    learning which key moves. There is no "tutorial paused" sign; the day simply
 *    begins when the day begins.
 *  · **The room notices when you are lost.** Thirty seconds without progress brightens
 *    the doors; fifty puts a sentence in somebody's mouth; seventy points at the way
 *    out. It backs off the moment you move.
 */

type Actor = {
  def: ActorDef
  image: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Ellipse
  baseX: number
  phase: number
}

type Hotspot = { def: HotspotDef; x: number; y: number; w: number; prop?: Phaser.GameObjects.Image }

type Target =
  | { kind: 'act'; act: string; verb: Verb; label: string; x: number; y: number; priority: number }
  | { kind: 'exit'; exit: ExitDef; verb: Verb; label: string; x: number; y: number; priority: number }

const WALK = 1.5
const RUN = 2.5
const STUCK_HINT = 30000
const STUCK_VOICE = 50000
const STUCK_POINT = 70000

export class WorldScene extends Phaser.Scene {
  static readonly KEY = 'life-world'

  private ctx!: LifeContext
  private def!: SceneDef
  private spawnName = 'start'

  private W = 1
  private H = 1

  private player!: Phaser.GameObjects.Image
  private shadow!: Phaser.GameObjects.Ellipse
  private vx = 0
  private vy = 0
  private facing = 1
  private lastDir: 'down' | 'up' | 'side' = 'down'
  private stride = 0

  private actors: Actor[] = []
  private hotspots: Hotspot[] = []
  private doorLights: Array<{ exit: ExitDef; image: Phaser.GameObjects.Image; base: number }> = []
  private mark!: Phaser.GameObjects.Triangle
  private pointer!: Phaser.GameObjects.Triangle
  private target: Target | null = null
  private focused: Phaser.GameObjects.Image | null = null

  private paused = false
  private minuteAcc = 0
  private timeScale = 1
  private flagCount = 0
  private matchPhase: 'none' | 'watching' | 'over' = 'none'

  private dwell = 0
  private dwellExit: ExitDef | null = null
  /** where we came from, and whether the child has stepped clear of that doorway yet */
  private cameFrom: LocationId | null = null
  private clearedReturn = false
  /** ms since the room was entered — no door may swallow the player on arrival */
  private since = 0
  private travelled = 0
  private idleFor = 0
  private stuckLevel = 0
  private breathe = 0

  constructor() {
    super(WorldScene.KEY)
  }

  /** `scene.restart()` reuses the instance; every mutable field is reset by hand. */
  init(data: { mapId?: LocationId; spawn?: string; from?: LocationId }) {
    this.def = sceneFor(data.mapId ?? 'bedroom')
    this.spawnName = data.spawn ?? 'start'
    this.cameFrom = data.from ?? null
    this.clearedReturn = false
    this.since = 0
    this.vx = 0
    this.vy = 0
    this.facing = 1
    this.lastDir = 'down'
    this.stride = 0
    this.paused = false
    this.minuteAcc = 0
    this.timeScale = 1
    this.flagCount = 0
    this.matchPhase = 'none'
    this.actors = []
    this.hotspots = []
    this.doorLights = []
    this.target = null
    this.focused = null
    this.dwell = 0
    this.dwellExit = null
    this.travelled = 0
    this.idleFor = 0
    this.stuckLevel = 0
    this.breathe = 0
  }

  preload() {
    const need = new Set<string>([this.def.art, ...Object.values(KID_POSE), ...KID_WALK])
    if (this.def.arrival) need.add(this.def.arrival.art)
    for (const actor of this.def.actors) need.add(actor.figure)
    for (const spot of this.def.hotspots) if (spot.prop) need.add(spot.prop.key)
    for (const layer of this.def.layers ?? []) need.add(layer.art)
    for (const key of need) {
      if (!this.textures.exists(`art-${key}`)) this.load.image(`art-${key}`, artUrl(key))
    }
  }

  create() {
    this.ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    const state = this.ctx.engine.state

    this.cameras.main.setBackgroundColor(LIFE_PALETTE.night)
    const backdrop = this.add.image(0, 0, `art-${this.def.art}`).setOrigin(0, 0).setDepth(-1000)
    this.W = backdrop.width
    this.H = backdrop.height

    this.buildLights()
    this.buildLayers()
    this.buildActors(state)
    this.buildHotspots(state)
    this.buildPlayer()
    this.buildAir()
    this.buildGrade()

    this.mark = this.add
      .triangle(0, 0, 0, 0, 14, 0, 7, 11, LIFE_PALETTE.red)
      .setDepth(9500)
      .setVisible(false)
    this.pointer = this.add
      .triangle(0, 0, 0, 0, 22, 9, 0, 18, LIFE_PALETTE.red)
      .setScrollFactor(0)
      .setDepth(9600)
      .setVisible(false)

    frameCamera(this, this.cameras.main, this.W, this.H, 0.74)
    this.cameras.main.setBounds(0, 0, this.W, this.H)
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09)
    this.cameras.main.setDeadzone(this.cameras.main.width * 0.3, this.cameras.main.height * 0.42)
    this.cameras.main.fadeIn(300, 0, 0, 0)
    this.ctx.bus.emit('frame', { picture: this.cameras.main.height })
    this.scale.on('resize', this.onResize, this)


    this.ctx.dialogue.setHooks({
      travel: (to, spawn) => this.travel(to as LocationId, spawn),
      minigame: () => this.startMinigame(),
      ending: (id) => this.finishChapter(id),
      onOpen: (open) => {
        this.paused = open
        if (open) {
          this.vx = 0
          this.vy = 0
          this.ctx.bus.emit('prompt', null)
        } else {
          this.progress()
        }
      },
    })

    this.ctx.engine.dispatch({ t: 'moved', to: this.def.id })
    this.ctx.bus.emit('place', { id: this.def.id, title: this.def.titleHe })
    this.flagCount = Object.keys(this.ctx.engine.state.flags).length
    this.pushHud()
    this.teach()

    if (this.def.arrival && !state.flags[this.def.arrival.flag]) this.playArrival()

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.onResize, this))
  }

  // ---------------------------------------------------------------------- build ---

  private fit(image: Phaser.GameObjects.Image, height: number) {
    const source = this.textures.get(image.texture.key).getSourceImage()
    image.setDisplaySize(height * ((source.width || 1) / (source.height || 1)), height)
  }

  /**
   * אור בפתח — the single highest-value thing in this pass.
   *
   * A doorway painted into a picture is not a door until something says so. Each exit
   * gets a soft glow over its own opening, always on, breathing at a rate slow enough to
   * be felt rather than watched. `daylight` is warmer and stronger and is reserved for
   * the way OUT of a building — it is how a front door stops looking like a bedroom door.
   */
  private buildLights() {
    for (const exit of this.def.exits) {
      if (!exit.light) continue
      const image = this.add
        .image(exit.light.x * this.W, exit.light.y * this.H, 'life-glow')
        .setOrigin(0, 0)
        .setDisplaySize(exit.light.w * this.W, exit.light.h * this.H)
        .setDepth(-900)
      const daylight = exit.light.tone === 'daylight'
      image.setTint(daylight ? LIFE_PALETTE.sheet : LIFE_PALETTE.lamp)
      const base = daylight ? 0.4 : 0.24
      image.setAlpha(base)
      this.doorLights.push({ exit, image, base })
    }
  }

  private buildLayers() {
    for (const layer of this.def.layers ?? []) {
      const image = this.add.image(layer.x * this.W, layer.y * this.H, `art-${layer.art}`).setOrigin(0, 0)
      const source = this.textures.get(image.texture.key).getSourceImage()
      const width = layer.w * this.W
      image.setDisplaySize(width, width * ((source.height || 1) / (source.width || 1)))
      image.setDepth(layer.depth * this.H)
    }
  }

  private buildPlayer() {
    const spawn = this.def.spawns[this.spawnName] ?? Object.values(this.def.spawns)[0] ?? { x: 0.5, y: 0.9 }
    const x = spawn.x * this.W
    const y = Phaser.Math.Clamp(spawn.y, this.def.band.far, this.def.band.near) * this.H
    this.facing = spawn.facing === 'left' ? -1 : 1
    this.shadow = this.add.ellipse(x, y, 40, 12, LIFE_PALETTE.ink, 0.3).setDepth(y - 1)
    this.player = this.add.image(x, y, `art-${KID_POSE.down}`).setOrigin(0.5, 1).setDepth(y)
    this.applyScale(this.player, this.shadow, y, this.def.size)
  }

  private applyScale(
    image: Phaser.GameObjects.Image,
    shadow: Phaser.GameObjects.Ellipse,
    y: number,
    size: { far: number; near: number },
  ) {
    const band = this.def.band
    const t = Phaser.Math.Clamp((y / this.H - band.far) / Math.max(0.0001, band.near - band.far), 0, 1)
    const height = Phaser.Math.Linear(size.far, size.near, t) * this.H
    this.fit(image, height)
    shadow.setSize(image.displayWidth * 0.6, image.displayWidth * 0.19)
    shadow.setPosition(image.x, y + 1)
    shadow.setDepth(y - 1)
    image.setDepth(y)
  }

  private buildActors(state: LifeState) {
    for (const def of this.def.actors) {
      const x = def.x * this.W
      const y = def.y * this.H
      const shadow = this.add.ellipse(x, y, 40, 12, LIFE_PALETTE.ink, 0.26)
      const image = this.add.image(x, y, `art-${def.figure}`).setOrigin(0.5, 1)
      image.setFlipX(def.flip === true)
      this.applyScale(image, shadow, y, { far: def.size, near: def.size })
      const visible = meets(state, def.when)
      image.setVisible(visible)
      shadow.setVisible(visible)
      this.actors.push({ def, image, shadow, baseX: x, phase: Math.random() * Math.PI * 2 })
    }
  }

  private buildHotspots(state: LifeState) {
    for (const def of this.def.hotspots) {
      const x = def.x * this.W
      const y = def.y * this.H
      const spot: Hotspot = { def, x, y, w: (def.w ?? 0.06) * this.W }
      if (def.prop) {
        const image = this.add.image(x, y, `art-${def.prop.key}`).setOrigin(0.5, 1)
        this.fit(image, def.prop.size * this.H)
        image.setDepth(y)
        image.setVisible(meets(state, def.when))
        spot.prop = image
      }
      this.hotspots.push(spot)
    }
  }

  private buildAir() {
    const air: Record<string, { n: number; tint: number; speed: number; alpha: number; scale: number }> = {
      interior: { n: 26, tint: LIFE_PALETTE.lamp, speed: 7, alpha: 0.22, scale: 0.8 },
      kitchen: { n: 20, tint: LIFE_PALETTE.lamp, speed: 6, alpha: 0.2, scale: 0.7 },
      day: { n: 22, tint: LIFE_PALETTE.sheet, speed: 14, alpha: 0.16, scale: 1.0 },
      dusk: { n: 34, tint: LIFE_PALETTE.sheet, speed: 18, alpha: 0.2, scale: 1.2 },
      tunnel: { n: 14, tint: LIFE_PALETTE.lamp, speed: 5, alpha: 0.16, scale: 0.7 },
      stadium: { n: 46, tint: LIFE_PALETTE.sheet, speed: 26, alpha: 0.5, scale: 1.6 },
    }
    const cfg = air[this.def.ambience] ?? air['day']
    if (!cfg) return
    this.add
      .particles(0, 0, 'life-dot', {
        x: { min: 0, max: this.W },
        y: { min: 0, max: this.H * 0.95 },
        quantity: 1,
        frequency: Math.max(40, 1600 / cfg.n),
        lifespan: 9000,
        speedX: { min: -cfg.speed, max: cfg.speed },
        speedY: { min: -cfg.speed * 0.6, max: cfg.speed * 0.35 },
        scale: { start: cfg.scale, end: cfg.scale * 0.4 },
        alpha: { start: cfg.alpha, end: 0 },
        tint: cfg.tint,
        blendMode: 'NORMAL',
      })
      .setDepth(4000)
  }

  private buildGrade() {
    const grade: Record<string, { tint: number; alpha: number; vignette: number }> = {
      interior: { tint: LIFE_PALETTE.roof, alpha: 0.08, vignette: 0.42 },
      kitchen: { tint: LIFE_PALETTE.shutter, alpha: 0.07, vignette: 0.4 },
      day: { tint: LIFE_PALETTE.sky, alpha: 0.05, vignette: 0.32 },
      dusk: { tint: LIFE_PALETTE.redDeep, alpha: 0.09, vignette: 0.42 },
      tunnel: { tint: LIFE_PALETTE.night, alpha: 0.2, vignette: 0.72 },
      stadium: { tint: LIFE_PALETTE.red, alpha: 0.06, vignette: 0.34 },
    }
    const cfg = grade[this.def.ambience] ?? grade['day']
    if (!cfg) return
    const wash = this.add.rectangle(0, 0, 10, 10, cfg.tint, cfg.alpha).setOrigin(0, 0).setScrollFactor(0).setDepth(6000)
    const vignette = this.add.graphics().setScrollFactor(0).setDepth(6001)
    const paint = () => {
      const cam = this.cameras.main
      wash.setSize(cam.width, cam.height)
      vignette.clear()
      const steps = 24
      const band = Math.max(cam.width, cam.height) * 0.4
      for (let i = 0; i < steps; i += 1) {
        const a = (cfg.vignette * (i + 1)) / steps / steps
        const inset = (band * (steps - i)) / steps
        vignette.fillStyle(LIFE_PALETTE.ink, a)
        vignette.fillRect(0, 0, cam.width, inset * 0.5)
        vignette.fillRect(0, cam.height - inset * 0.6, cam.width, inset * 0.6)
        vignette.fillRect(0, 0, inset * 0.5, cam.height)
        vignette.fillRect(cam.width - inset * 0.5, 0, inset * 0.5, cam.height)
      }
    }
    paint()
    this.scale.on('resize', paint, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', paint, this))
  }

  private onResize() {
    frameCamera(this, this.cameras.main, this.W, this.H, 0.74)
    this.cameras.main.setDeadzone(this.cameras.main.width * 0.3, this.cameras.main.height * 0.42)
    this.ctx.bus.emit('frame', { picture: this.cameras.main.height })
  }

  // --------------------------------------------------------------------- update ---

  override update(_time: number, delta: number) {
    this.ctx.input.beginFrame()
    this.breathe += delta / 1000
    this.pulseLights()
    if (this.paused) return

    this.since += delta
    this.movePlayer(delta)
    this.moveActors(delta)
    this.tickClock(delta)
    this.aim()
    if (this.ctx.input.actionPressed) this.act()
    this.autoExits(delta)
    this.tickStuck(delta)

    if (Object.keys(this.ctx.engine.state.flags).length !== this.flagCount) this.refresh()
  }

  /**
   * The keyboard is read by the shell (`app/life/LifeStage.tsx`) and written into
   * `ctx.input`, because a scene restart forgets which keys are held and the document
   * does not. The scene only ever reads.
   */

  private movePlayer(delta: number) {
    const input = this.ctx.input
    const running = input.run && this.ctx.engine.state.energy > 6
    const speed = (running ? RUN : WALK) * this.player.displayHeight
    const ease = 1 - Math.pow(0.0015, delta / 1000)

    this.vx = Phaser.Math.Linear(this.vx, input.x * speed, ease)
    this.vy = Phaser.Math.Linear(this.vy, input.y * speed * 0.52, ease)

    const step = delta / 1000
    const nx = Phaser.Math.Clamp(this.player.x + this.vx * step, this.W * 0.02, this.W * 0.98)
    const ny = Phaser.Math.Clamp(
      this.player.y + this.vy * step,
      this.def.band.far * this.H,
      this.def.band.near * this.H,
    )
    this.travelled += Math.abs(nx - this.player.x) + Math.abs(ny - this.player.y)
    this.player.setPosition(nx, ny)

    const moving = Math.abs(input.x) + Math.abs(input.y) > 0.08
    if (moving) {
      if (Math.abs(input.x) > Math.abs(input.y) * 0.8) {
        this.lastDir = 'side'
        this.facing = input.x < 0 ? -1 : 1
      } else {
        this.lastDir = input.y < 0 ? 'up' : 'down'
      }
      this.stride += (delta / 1000) * (running ? 11 : 7.5)
      this.idleFor = 0
    }

    // The child is the one character with a real walk cycle — eight frames from the
    // green-screen sheet — and it only exists side-on, which is where the walking mostly
    // happens. Facing the camera or away, a bob does the work.
    if (moving && this.lastDir === 'side') {
      const frame = KID_WALK[Math.floor(this.stride) % KID_WALK.length] ?? KID_WALK[0]
      this.player.setTexture(`art-${frame}`)
    } else {
      const pose = this.lastDir === 'up' ? KID_POSE.up : this.lastDir === 'side' ? KID_POSE.side : KID_POSE.down
      this.player.setTexture(`art-${pose}`)
    }
    this.player.setFlipX(this.facing < 0)

    this.applyScale(this.player, this.shadow, ny, this.def.size)
    if (moving && this.lastDir !== 'side') {
      this.player.y = ny - Math.abs(Math.sin(this.stride)) * this.H * 0.005
    }

    if (running) this.ctx.engine.dispatch({ t: 'energy.changed', delta: -delta / 2400 })
    if (this.travelled > this.W * 0.06) this.progress()
  }

  private moveActors(delta: number) {
    for (const actor of this.actors) {
      if (!actor.def.sway || !actor.image.visible) continue
      actor.phase += (delta / 1000) * 1.1
      actor.image.x = actor.baseX + Math.sin(actor.phase) * actor.def.sway * this.W
      actor.shadow.x = actor.image.x
    }
  }

  /**
   * הזמן — real, and not charged to the player while they are still learning to walk.
   *
   * The clock is the chapter's antagonist (brief §17) and nothing about that changes.
   * What changes is when it starts: not when the game loads, but when the child is out of
   * the front door. Missing the newspaper because you stayed with Ofir is a life; missing
   * your father because you could not find a door is a bug with a stopwatch.
   */
  private tickClock(delta: number) {
    if (!this.ctx.engine.state.flags['onboard:street']) return
    this.minuteAcc += (delta / 1000) * this.timeScale
    if (this.minuteAcc < 1) return
    const minutes = Math.floor(this.minuteAcc)
    this.minuteAcc -= minutes
    this.ctx.engine.dispatch({ t: 'clock.advanced', minutes })
    this.timeTriggers()
    this.pushHud()
  }

  private timeTriggers() {
    const engine = this.ctx.engine
    const state = engine.state
    if (state.minute >= KOBI_LEAVES && !state.flags['kobi:left']) {
      engine.dispatch({ t: 'flag.raised', flag: 'kobi:left' })
      this.ctx.bus.emit('toast', { text: 'הדלת נטרקת. אבא יצא.', tone: 'red' })
      this.refresh()
    }
    if (state.minute >= KICKOFF && !state.flags['match:started']) {
      engine.dispatch({ t: 'flag.raised', flag: 'match:started' })
      if (this.def.id !== 'bloomfield-inside') {
        this.ctx.bus.emit('toast', { text: 'רעש רחוק, מכיוון מזרח.', tone: 'plain' })
      }
    }
    if (state.minute >= FULL_TIME && !state.flags['match:over']) {
      engine.dispatch({ t: 'flag.raised', flag: 'match:over' })
      if (this.def.id !== 'bloomfield-inside') engine.dispatch({ t: 'flag.raised', flag: 'arrived:late' })
      this.refresh()
    }
  }

  private refresh() {
    const state = this.ctx.engine.state
    for (const actor of this.actors) {
      const visible = meets(state, actor.def.when)
      actor.image.setVisible(visible)
      actor.shadow.setVisible(visible)
    }
    for (const spot of this.hotspots) {
      if (spot.prop) spot.prop.setVisible(meets(state, spot.def.when))
    }
    for (const light of this.doorLights) {
      light.image.setVisible(meets(state, light.exit.when))
    }
    this.flagCount = Object.keys(state.flags).length
    this.pushHud()
  }

  private pushHud() {
    const state = this.ctx.engine.state
    this.ctx.bus.emit('hud', {
      clock: clockLabel(state.weekday, state.minute),
      agorot: state.agorot,
      showMoney: state.agorot > 0,
      place: this.def.titleHe,
      objective: this.objective(state),
    })
  }

  private objective(state: LifeState): string | null {
    if (state.flags['found:kobi']) return null
    if (this.def.id === 'bloomfield-inside' && this.matchPhase === 'over') return OBJECTIVES.findKobi
    if (state.flags['entry:granted']) return null
    if (this.def.id === 'bloomfield-outside') return OBJECTIVES.atGround
    if (state.flags['kobi:left'] && (this.def.id === 'route' || this.def.id === 'street'))
      return OBJECTIVES.onTheWay
    if (state.flags['kobi:left']) return OBJECTIVES.afterKobi
    return OBJECTIVES.morning
  }

  // ------------------------------------------------------------------ onboarding --

  /** The one line of teaching the game does, and it goes away for good once obeyed. */
  private teach() {
    const state = this.ctx.engine.state
    if (!state.flags['onboard:moved']) {
      this.ctx.bus.emit('teach', { id: 'move' })
      return
    }
    if (!state.flags['onboard:acted']) {
      this.ctx.bus.emit('teach', { id: 'act' })
      return
    }
    this.ctx.bus.emit('teach', null)
  }

  private progress() {
    this.idleFor = 0
    if (this.stuckLevel !== 0) {
      this.stuckLevel = 0
      this.pointer.setVisible(false)
    }
    if (this.travelled > this.W * 0.06 && !this.ctx.engine.state.flags['onboard:moved']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'onboard:moved' })
      this.teach()
    }
  }

  /**
   * תקוע — escalation, and it starts with the world rather than with an arrow.
   */
  private tickStuck(delta: number) {
    this.idleFor += delta
    const level = this.idleFor > STUCK_POINT ? 3 : this.idleFor > STUCK_VOICE ? 2 : this.idleFor > STUCK_HINT ? 1 : 0
    if (level === this.stuckLevel) {
      if (level >= 3) this.aimPointer()
      return
    }
    this.stuckLevel = level
    if (level === 2 && this.def.stuckHe) {
      this.ctx.bus.emit('toast', { text: this.def.stuckHe, tone: 'plain' })
    }
    if (level < 3) this.pointer.setVisible(false)
    else this.aimPointer()
  }

  /** Level three: a small mark at the edge of the glass, pointing at the best way out. */
  private aimPointer() {
    const exit = this.bestExit()
    if (!exit) {
      this.pointer.setVisible(false)
      return
    }
    const cam = this.cameras.main
    const worldX = (exit.x + exit.w / 2) * this.W
    const screenX = (worldX - cam.scrollX) * cam.zoom
    const edge = screenX < cam.width / 2 ? 18 : cam.width - 18
    this.pointer.setVisible(true)
    this.pointer.setPosition(edge, cam.height * 0.5 + Math.sin(this.breathe * 3) * 6)
    this.pointer.setRotation(screenX < cam.width / 2 ? Math.PI : 0)
  }

  private bestExit(): ExitDef | null {
    const state = this.ctx.engine.state
    const open = this.def.exits.filter((exit) => meets(state, exit.when))
    if (open.length === 0) return null
    return open.sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1))[0] ?? null
  }

  private pulseLights() {
    const boost = this.stuckLevel > 0 ? 0.22 : 0
    for (const light of this.doorLights) {
      const near =
        this.target?.kind === 'exit' && this.target.exit.id === light.exit.id ? 0.26 : 0
      const wave = 0.06 * Math.sin(this.breathe * 1.5 + light.exit.x * 8)
      light.image.setAlpha(light.base + wave + boost + near)
    }
  }

  // ---------------------------------------------------------------- interaction ---

  private aim() {
    const state = this.ctx.engine.state
    const px = this.player.x
    const py = this.player.y
    let best: Target | null = null
    let bestScore = -Infinity

    const consider = (x: number, y: number, reach: number, make: () => Target) => {
      const dx = Math.abs(px - x)
      const dy = Math.abs(py - y)
      if (dx > reach || dy > this.H * 0.18) return
      const candidate = make()
      const score = candidate.priority * 1000 - (dx + dy * 0.5)
      if (score > bestScore) {
        bestScore = score
        best = candidate
      }
    }

    for (const spot of this.hotspots) {
      if (!meets(state, spot.def.when)) continue
      consider(spot.x, spot.y, spot.w + this.W * 0.025, () => ({
        kind: 'act',
        act: spot.def.act,
        verb: spot.def.verb,
        label: spot.def.labelHe,
        x: spot.x,
        y: spot.y,
        priority: spot.def.priority ?? 1,
      }))
    }
    for (const actor of this.actors) {
      if (!actor.image.visible || !actor.def.talk) continue
      // People are easier to address than objects: a person you can see should be a
      // person you can talk to, without hunting for a pixel.
      consider(actor.image.x, actor.image.y, Math.max(actor.image.displayWidth * 1.1, this.W * 0.03), () => ({
        kind: 'act',
        act: actor.def.talk as string,
        verb: 'talk',
        label: actor.def.nameHe,
        x: actor.image.x,
        y: actor.image.y,
        priority: 4,
      }))
    }
    for (const exit of this.def.exits) {
      if (!meets(state, exit.when)) continue
      const cx = (exit.x + exit.w / 2) * this.W
      const cy = (exit.y + exit.h / 2) * this.H
      consider(cx, cy, (exit.w / 2 + 0.035) * this.W, () => ({
        kind: 'exit',
        exit,
        verb: 'exit',
        label: exit.labelHe,
        x: cx,
        y: cy,
        priority: exit.priority ?? 2,
      }))
    }

    this.target = best
    this.focus(best)
    this.ctx.bus.emit(
      'prompt',
      best ? { verb: (best as Target).verb, label: (best as Target).label } : null,
    )
  }

  /** The mark over what you are about to touch, and a lift on the thing itself. */
  private focus(target: Target | null) {
    if (this.focused) {
      this.focused.clearTint()
      this.focused = null
    }
    if (!target) {
      this.mark.setVisible(false)
      return
    }
    this.mark.setVisible(true)
    const lift = Math.sin(this.breathe * 4) * this.H * 0.006
    this.mark.setPosition(target.x - 7, target.y - this.H * 0.06 + lift)
    if (target.kind === 'act') {
      const actor = this.actors.find((entry) => entry.def.talk === target.act && entry.image.visible)
      if (actor) {
        actor.image.setTint(LIFE_PALETTE.lamp)
        this.focused = actor.image
      }
    }
  }

  private act() {
    const target = this.target
    if (!target) return
    if (!this.ctx.engine.state.flags['onboard:acted']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'onboard:acted' })
      this.teach()
    }
    this.progress()
    if (target.kind === 'exit') {
      this.travel(target.exit.to, target.exit.spawn)
      return
    }
    if (!this.ctx.dialogue.start(target.act)) this.ctx.bus.emit('prompt', null)
  }

  /**
   * Walking into a door works too — after a beat, so passing through does not fire it.
   *
   * And the door you just came through does not take you back until you have stepped off
   * it. Holding a direction through a doorway leaves the key down while the next scene
   * builds, so without this the child walks in the front door, keeps walking, and is
   * returned to the room they just left — which reads as the game refusing to let them
   * out. The block lifts the moment they are clear of the zone.
   */
  private autoExits(delta: number) {
    // Nothing swallows the player in the first moments of a room. Arriving somewhere and
    // being taken straight out again is the worst thing a door can do.
    if (this.since < 700) return
    const state = this.ctx.engine.state
    const x = this.player.x / this.W
    const y = this.player.y / this.H
    const within = (exit: ExitDef) =>
      x >= exit.x && x <= exit.x + exit.w && y >= exit.y && y <= exit.y + exit.h

    if (!this.clearedReturn) {
      const back = this.def.exits.filter((exit) => exit.to === this.cameFrom)
      if (back.length === 0 || !back.some(within)) this.clearedReturn = true
    }

    let inside: ExitDef | null = null
    for (const exit of this.def.exits) {
      if (!meets(state, exit.when)) continue
      if (!within(exit)) continue
      if (!this.clearedReturn && exit.to === this.cameFrom) continue
      inside = exit
      break
    }
    if (!inside) {
      this.dwellExit = null
      this.dwell = 0
      return
    }
    if (this.dwellExit !== inside) {
      this.dwellExit = inside
      this.dwell = 0
    }
    this.dwell += delta
    if (this.dwell >= (inside.dwellMs ?? 320)) this.travel(inside.to, inside.spawn)
  }

  private travel(to: LocationId, spawn: string) {
    if (this.paused) return
    this.paused = true
    this.ctx.bus.emit('prompt', null)
    if (to === 'street' && !this.ctx.engine.state.flags['onboard:street']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'onboard:street' })
      this.ctx.bus.emit('teach', null)
    }
    this.cameras.main.fadeOut(240, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      void this.ctx.engine.save()
      this.scene.restart({ mapId: to, spawn, from: this.def.id })
    })
  }

  private startMinigame() {
    this.paused = true
    this.cameras.main.fadeOut(240, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('life-football', { returnTo: this.def.id, spawn: 'fromStreet' })
    })
  }

  // ------------------------------------------------------------------- the wow ----

  private playArrival() {
    const arrival = this.def.arrival
    if (!arrival) return
    this.paused = true
    this.ctx.bus.emit('controls', { visible: false })
    this.ctx.bus.emit('prompt', null)

    const cam = this.cameras.main
    const card = this.add.image(0, 0, `art-${arrival.art}`).setScrollFactor(0).setDepth(8000)
    const source = this.textures.get(card.texture.key).getSourceImage()
    const scale = Math.max(cam.width / source.width, cam.height / source.height)
    card.setPosition(cam.width / 2, cam.height / 2)
    card.setScale(scale * 1.22).setAlpha(0)

    this.tweens.add({ targets: card, alpha: 1, duration: 700, ease: 'Sine.easeOut' })
    this.tweens.add({
      targets: card,
      scale,
      duration: arrival.ms,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.tweens.add({
          targets: card,
          alpha: 0,
          duration: 900,
          onComplete: () => {
            card.destroy()
            this.paused = false
            this.idleFor = 0
            this.ctx.bus.emit('controls', { visible: true })
            this.ctx.engine.dispatch({ t: 'flag.raised', flag: arrival.flag })
            this.time.delayedCall(2200, () =>
              this.ctx.bus.emit('anchor', { anchor: this.ctx.anchor, showing: true }),
            )
            if (this.ctx.engine.state.flags['match:over']) {
              this.matchPhase = 'over'
              this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'arrived:late' })
              this.refresh()
            } else {
              this.watchMatch()
            }
          },
        })
      },
    })
  }

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
        this.ctx.engine.dispatch(
          { t: 'flag.raised', flag: 'match:over' },
          { t: 'anchor.attended', anchorId: this.ctx.anchor.id },
        )
        this.refresh()
        this.ctx.bus.emit('anchor', { anchor: this.ctx.anchor, showing: true })
        this.cameras.main.shake(700, 0.004)
      },
    })
  }

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
    this.ctx.bus.emit('ending', { titleHe: card.titleHe, bodyHe: card.bodyHe, memoryHe: card.memoryHe })
  }

  goHome() {
    this.paused = false
    this.ctx.bus.emit('ending', null)
    this.travel('bedroom', 'start')
  }
}
