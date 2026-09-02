import Phaser from 'phaser'

import { clockLabel } from '../../clock'
import { ENDINGS, OBJECTIVES } from '../../content/chapter1980'
import type { LifeState, LocationId } from '../../types'
import { FULL_TIME, KICKOFF, KOBI_LEAVES, sceneFor } from '../../world/scenes'
import type { ActorDef, HotspotDef, SceneDef } from '../../world/scenes'
import { meets } from '../../world/types'
import { artUrl } from '../art'
import { frameCamera } from '../camera'
import { CONTEXT_KEY, type LifeContext } from '../context'
import { LIFE_PALETTE } from '../palette'

/**
 * הסצנה — one painted place, and the strip of floor you may stand on.
 *
 * The rewrite that matters: a location is no longer a set of rectangles drawn at runtime,
 * it is one of Maor's paintings with a WALK BAND across it. The child moves anywhere in
 * that band, gets bigger as they come toward the camera, and sorts in front of or behind
 * the people standing in it. That is the whole illusion of depth every hand-painted 2D
 * adventure runs on, and it costs one image per room.
 *
 * Everything a scene needs is a fraction of the backdrop (`world/scenes.ts`), so a better
 * cut of the same painting — or a final, larger one — moves nothing.
 *
 * Three things here exist purely for feel, and they are the difference between a demo and
 * a game:
 *  · **Acceleration.** The child eases up to speed and coasts to a stop over ~120ms.
 *    Instant start/stop is the single loudest tell that a character is a rectangle.
 *  · **A camera dead zone.** The camera ignores small movements and only starts to follow
 *    once you leave the middle third. A camera welded to the player makes the world feel
 *    like it is sliding rather than the player moving through it.
 *  · **Air.** Dust in the light indoors, haze on the street, paper in the stadium — a few
 *    dozen particles, always, so a room is never completely still.
 */

type Actor = {
  def: ActorDef
  image: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Ellipse
  baseX: number
  phase: number
}

type Hotspot = {
  def: HotspotDef
  x: number
  y: number
  w: number
  prop?: Phaser.GameObjects.Image
}

/**
 * Speed is measured in the CHILD, not in the room.
 *
 * The first version used a fraction of the backdrop height, which made the same walk feel
 * brisk in a wide street and glacial in a tall bedroom — the child crossed a 552px room at
 * 26 pixels a second. A person covers something like one and a half of their own heights
 * per second at a walk, so that is the unit: whatever the painting's dimensions turn out
 * to be, the child moves at a believable pace through it.
 */
const WALK = 1.55
const RUN = 2.55

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
  private bob = 0

  private actors: Actor[] = []
  private hotspots: Hotspot[] = []
  private target: { kind: 'act' | 'exit'; act?: string; exit?: SceneDef['exits'][number]; x: number; y: number } | null =
    null

  private paused = false
  private minuteAcc = 0
  private timeScale = 1
  private flagCount = 0
  private matchPhase: 'none' | 'watching' | 'over' = 'none'
  private keys?: Record<string, Phaser.Input.Keyboard.Key>

  constructor() {
    super(WorldScene.KEY)
  }

  /**
   * `scene.restart()` reuses the instance and never re-runs a field initialiser, so every
   * mutable value is reset by hand. Without this the pause set during a fade-out leaks
   * into the next room and the child can never move again.
   */
  init(data: { mapId?: LocationId; spawn?: string }) {
    this.def = sceneFor(data.mapId ?? 'bedroom')
    this.spawnName = data.spawn ?? 'start'
    this.vx = 0
    this.vy = 0
    this.facing = 1
    this.bob = 0
    this.paused = false
    this.minuteAcc = 0
    this.timeScale = 1
    this.flagCount = 0
    this.matchPhase = 'none'
    this.actors = []
    this.hotspots = []
    this.target = null
  }

  preload() {
    const need = new Set<string>([this.def.art])
    if (this.def.arrival) need.add(this.def.arrival.art)
    for (const actor of this.def.actors) need.add(actor.figure)
    for (const spot of this.def.hotspots) if (spot.prop) need.add(spot.prop.key)
    need.add('kid')
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

    this.buildActors(state)
    this.buildHotspots(state)
    this.buildPlayer()
    this.buildAir()
    this.buildGrade()

    this.cameras.main.setBounds(0, 0, this.W, this.H)
    frameCamera(this, this.cameras.main, this.W, this.H, 0.74)
    this.ctx.bus.emit('frame', { picture: this.cameras.main.height })
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09)
    this.cameras.main.setDeadzone(this.cameras.main.width * 0.28, this.cameras.main.height * 0.4)
    this.cameras.main.fadeIn(320, 0, 0, 0)
    this.ctx.bus.emit('frame', { picture: this.cameras.main.height })
    this.scale.on('resize', this.onResize, this)

    const keyboard = this.input.keyboard
    if (keyboard) {
      this.keys = keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT,SPACE,ENTER,SHIFT') as Record<
        string,
        Phaser.Input.Keyboard.Key
      >
    }

    this.ctx.dialogue.setHooks({
      travel: (to, spawn) => this.travel(to as LocationId, spawn),
      minigame: () => this.startMinigame(),
      ending: (id) => this.finishChapter(id),
      onOpen: (open) => {
        this.paused = open
        if (open) {
          this.vx = 0
          this.vy = 0
        }
      },
    })

    this.ctx.engine.dispatch({ t: 'moved', to: this.def.id })
    this.ctx.bus.emit('place', { id: this.def.id, title: this.def.titleHe })
    this.flagCount = Object.keys(this.ctx.engine.state.flags).length
    this.pushHud()

    if (this.def.arrival && !state.flags[this.def.arrival.flag]) this.playArrival()

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.onResize, this)
    })
  }

  // ---------------------------------------------------------------------- build ---

  private fit(image: Phaser.GameObjects.Image, height: number) {
    const source = this.textures.get(image.texture.key).getSourceImage()
    const ratio = (source.width || 1) / (source.height || 1)
    image.setDisplaySize(height * ratio, height)
  }

  private buildPlayer() {
    const spawn = this.def.spawns[this.spawnName] ?? Object.values(this.def.spawns)[0] ?? { x: 0.5, y: 0.9 }
    const x = spawn.x * this.W
    const y = Phaser.Math.Clamp(spawn.y, this.def.band.far, this.def.band.near) * this.H
    this.shadow = this.add.ellipse(x, y, 40, 12, LIFE_PALETTE.ink, 0.28).setDepth(y - 1)
    this.player = this.add.image(x, y, 'art-kid').setOrigin(0.5, 1).setDepth(y)
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
    shadow.setSize(image.displayWidth * 0.62, image.displayWidth * 0.2)
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

  /**
   * אוויר — the cheapest thing that separates a painting from a place.
   *
   * A few dozen particles drifting across the frame, tinted for the room, at a depth in
   * front of the world and behind the interface. Nothing simulates anything; it just
   * means the screen is never completely still, which is what the eye reads as "alive".
   */
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
        // NORMAL, not ADD. Adding a warm mote to warm 1980 paint makes a pixel the
        // scanner reads as yellow — the whole rule, defeated by a dust particle.
        blendMode: 'NORMAL',
      })
      .setDepth(4000)
  }

  /**
   * הדירוג — a screen-space vignette and one warm or cold wash per place.
   *
   * The boards were painted at different times of day and by different prompts; a single
   * grade per scene is what makes them read as one game rather than a folder. It is two
   * rectangles and it is the highest ratio of look to cost in the whole runtime.
   */
  private buildGrade() {
    const grade: Record<string, { tint: number; alpha: number; vignette: number }> = {
      interior: { tint: LIFE_PALETTE.roof, alpha: 0.1, vignette: 0.5 },
      kitchen: { tint: LIFE_PALETTE.shutter, alpha: 0.08, vignette: 0.45 },
      day: { tint: LIFE_PALETTE.sky, alpha: 0.05, vignette: 0.34 },
      dusk: { tint: LIFE_PALETTE.redDeep, alpha: 0.1, vignette: 0.44 },
      tunnel: { tint: LIFE_PALETTE.night, alpha: 0.22, vignette: 0.76 },
      stadium: { tint: LIFE_PALETTE.red, alpha: 0.07, vignette: 0.36 },
    }
    const cfg = grade[this.def.ambience] ?? grade['day']
    if (!cfg) return

    const wash = this.add
      .rectangle(0, 0, 10, 10, cfg.tint, cfg.alpha)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(6000)
    const vignette = this.add.graphics().setScrollFactor(0).setDepth(6001)

    const paint = () => {
      const cam = this.cameras.main
      wash.setSize(cam.width, cam.height)
      vignette.clear()
      const steps = 26
      const band = Math.max(cam.width, cam.height) * 0.42
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
    this.ctx.bus.emit('frame', { picture: this.cameras.main.height })
    this.cameras.main.setDeadzone(this.cameras.main.width * 0.28, this.cameras.main.height * 0.4)
  }

  // --------------------------------------------------------------------- update ---

  override update(_time: number, delta: number) {
    this.ctx.input.beginFrame()
    this.readKeyboard()
    if (this.paused) return

    this.movePlayer(delta)
    this.moveActors(delta)
    this.tickClock(delta)
    this.aim()
    if (this.ctx.input.actionPressed) this.act()
    this.autoExits()

    if (Object.keys(this.ctx.engine.state.flags).length !== this.flagCount) this.refresh()
  }

  private readKeyboard() {
    if (!this.keys) return
    const down = (name: string) => this.keys?.[name]?.isDown === true
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
    const running = input.run && this.ctx.engine.state.energy > 6
    const speed = (running ? RUN : WALK) * this.player.displayHeight
    const ease = 1 - Math.pow(0.0015, delta / 1000)

    this.vx = Phaser.Math.Linear(this.vx, input.x * speed, ease)
    // Depth movement is slower than lateral movement, which is what a receding floor
    // does in perspective and what stops the band feeling like a lift shaft.
    this.vy = Phaser.Math.Linear(this.vy, input.y * speed * 0.52, ease)

    const moving = Math.abs(input.x) + Math.abs(input.y) > 0.06
    const nx = Phaser.Math.Clamp(this.player.x + (this.vx * delta) / 1000, this.W * 0.02, this.W * 0.98)
    const ny = Phaser.Math.Clamp(
      this.player.y + (this.vy * delta) / 1000,
      this.def.band.far * this.H,
      this.def.band.near * this.H,
    )
    this.player.setPosition(nx, ny)

    if (Math.abs(input.x) > 0.08) this.facing = input.x < 0 ? -1 : 1
    this.player.setFlipX(this.facing < 0)

    // A two-pixel bob at walking pace. There is one drawn pose per character, so the
    // walk has to come from motion rather than from frames — and a bob plus a lean
    // reads as walking far better than a static sprite sliding does.
    this.bob = moving ? this.bob + (delta / 1000) * (running ? 15 : 10) : 0
    const lift = moving ? Math.abs(Math.sin(this.bob)) * this.H * 0.006 : 0
    this.applyScale(this.player, this.shadow, ny, this.def.size)
    this.player.y = ny - lift
    this.player.setRotation(moving ? Math.sin(this.bob * 0.5) * 0.014 * this.facing : 0)

    if (running) this.ctx.engine.dispatch({ t: 'energy.changed', delta: -delta / 2400 })
  }

  private moveActors(delta: number) {
    for (const actor of this.actors) {
      if (!actor.def.sway || !actor.image.visible) continue
      actor.phase += (delta / 1000) * 1.1
      const drift = Math.sin(actor.phase) * actor.def.sway * this.W
      actor.image.x = actor.baseX + drift
      actor.shadow.x = actor.image.x
    }
  }

  private tickClock(delta: number) {
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

  // ---------------------------------------------------------------- interaction ---

  private aim() {
    const state = this.ctx.engine.state
    const px = this.player.x
    const py = this.player.y
    let best: WorldScene['target'] = null
    let bestDistance = Infinity

    const consider = (x: number, y: number, reach: number, make: () => NonNullable<WorldScene['target']>) => {
      const dx = Math.abs(px - x)
      const dy = Math.abs(py - y)
      if (dx > reach || dy > this.H * 0.16) return
      const distance = dx + dy * 0.4
      if (distance < bestDistance) {
        bestDistance = distance
        best = make()
      }
    }

    for (const spot of this.hotspots) {
      if (!meets(state, spot.def.when)) continue
      consider(spot.x, spot.y, spot.w + this.W * 0.02, () => ({
        kind: 'act' as const,
        act: spot.def.act,
        x: spot.x,
        y: spot.y,
      }))
    }
    for (const actor of this.actors) {
      if (!actor.image.visible || !actor.def.talk) continue
      consider(actor.image.x, actor.image.y, actor.image.displayWidth * 0.75, () => ({
        kind: 'act' as const,
        act: actor.def.talk as string,
        x: actor.image.x,
        y: actor.image.y,
      }))
    }
    for (const exit of this.def.exits) {
      if (!exit.manual || !meets(state, exit.when)) continue
      const cx = (exit.x + exit.w / 2) * this.W
      const cy = (exit.y + exit.h / 2) * this.H
      consider(cx, cy, (exit.w / 2 + 0.03) * this.W, () => ({ kind: 'exit' as const, exit, x: cx, y: cy }))
    }

    this.target = best
    this.ctx.bus.emit('prompt', best ? ((best as NonNullable<WorldScene['target']>).kind === 'exit' ? 'ללכת' : 'לגעת') : null)
  }

  private act() {
    const target = this.target
    if (!target) return
    if (target.kind === 'exit' && target.exit) {
      this.travel(target.exit.to, target.exit.spawn)
      return
    }
    if (!target.act) return
    if (!this.ctx.dialogue.start(target.act)) this.ctx.bus.emit('prompt', null)
  }

  private autoExits() {
    const state = this.ctx.engine.state
    for (const exit of this.def.exits) {
      if (exit.manual || !meets(state, exit.when)) continue
      const x = this.player.x / this.W
      const y = this.player.y / this.H
      if (x < exit.x || x > exit.x + exit.w || y < exit.y || y > exit.y + exit.h) continue
      this.travel(exit.to, exit.spawn)
      return
    }
  }

  private travel(to: LocationId, spawn: string) {
    if (this.paused) return
    this.paused = true
    this.ctx.bus.emit('prompt', null)
    this.cameras.main.fadeOut(260, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      void this.ctx.engine.save()
      this.scene.restart({ mapId: to, spawn })
    })
  }

  private startMinigame() {
    this.paused = true
    this.cameras.main.fadeOut(260, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('life-football', { returnTo: this.def.id, spawn: 'fromStreet' })
    })
  }

  // ------------------------------------------------------------------- the wow ----

  /**
   * החשיפה — the one moment that gets a cinematic.
   *
   * The child walks out of a two-metre corridor into a bowl. So the reveal painting comes
   * up full-screen, oversized and slowly settling, while the terrace behind it is already
   * built and waiting; then it fades and control is handed back with the crowd around
   * you. No interface is allowed on top of it — brief §15 — so the shell is told to clear
   * itself for the duration.
   */
  private playArrival() {
    const arrival = this.def.arrival
    if (!arrival) return
    this.paused = true
    this.ctx.bus.emit('controls', { visible: false })
    this.ctx.bus.emit('prompt', null)

    const cam = this.cameras.main
    const card = this.add.image(0, 0, `art-${arrival.art}`).setScrollFactor(0).setDepth(8000).setOrigin(0.5, 0.5)
    const place = () => {
      const source = this.textures.get(card.texture.key).getSourceImage()
      const scale = Math.max(cam.width / source.width, cam.height / source.height)
      card.setPosition(cam.width / 2, cam.height / 2)
      card.setScale(scale)
      return scale
    }
    const scale = place()
    card.setScale(scale * 1.22)
    card.setAlpha(0)

    this.tweens.add({ targets: card, alpha: 1, duration: 700, ease: 'Sine.easeOut' })
    this.tweens.add({
      targets: card,
      scale: scale * 1.0,
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
            this.ctx.bus.emit('controls', { visible: true })
            this.ctx.engine.dispatch({ t: 'flag.raised', flag: arrival.flag })
            // Brief §15: do not cover the reveal with interface. The crowd gets a couple
            // of seconds to itself before the record card is allowed on top of it.
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

  /**
   * The match is not simulated and must not be: the archive does not know what happened
   * in it (`lib/life/anchor-server.ts`). The child stands on a terrace among people, the
   * clock runs at match pace, and the whistle goes.
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

  /** Called by the shell when the closing card is dismissed. */
  goHome() {
    this.paused = false
    this.ctx.bus.emit('ending', null)
    this.travel('bedroom', 'start')
  }
}
