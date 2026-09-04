import Phaser from 'phaser'

import { clockLabel } from '../../clock'
import type { AmbientActor } from '../../content/ambient1986'
import { SCHOOL_MORNING_1990, TABLE_1990 } from '../../content/chapter1990'
import { CLASSROOM_1991, closing1991, HOME_NIGHT_1991, SCHOOL_STARTS, TIP_OFF } from '../../content/chapter1991'
import { anchorFor, ERA_1991, eraFor, type Era } from '../../content/era'
import type { ConversationShot } from '../../content/script'
import { crowdSpeaker } from '../../crowd'
import { encounterEvents, rollEncounter } from '../../encounters'
import { tickOpportunities } from '../../opportunities'
import { placementsAt } from '../../schedules'
import type { LifeState, LocationId } from '../../types'
import { cutsceneCard, cutsceneFor, longDateHe, type CutsceneOutcome, type HistoricalCutscene } from '../../cutscenes'
import { decidingMinute, matchClock, matchPace, scoreboardAt } from '../../match'
import { ALL_SCENES, arrivalFor, artFor, blockedFor, needsFor, exitInEra, FULL_TIME, inEra, KICKOFF, KOBI_LEAVES, sceneFor, stuckFor } from '../../world/scenes'
import type { ActorDef, ExitDef, HotspotDef, LayerDef, SceneDef, Verb } from '../../world/scenes'
import type { PanoSpot } from '../bus'
import { PANO_SPOTS } from '../../content/panoramas'
import { KOBI_LEAVES_LATE, KOBI_SAYS_LEAVING } from '../../content/schedules1990'
import type { HistoricalAnchor } from '../../anchors'
import { buildFinale } from '../../finale'
import { retryFor } from '../../content/retry1986'
import { TransistorNet } from '../match1990'
import { DerbyFromAfar, DerbyNight, derbyMarginHe, type DerbyMood } from '../derby1991'
import { PassageScene } from './PassageScene'
import { meets } from '../../world/types'
import { artUrl, extensionKeys, PARALLAX, parallaxKeys } from '../art'
import { fillCamera } from '../camera'
import { CONTEXT_KEY, type LifeContext } from '../context'
import type { MapPlace } from '../game'
import { LIFE_PALETTE } from '../palette'
import {
  arrivalEase,
  clampToBand,
  DEPTH,
  groundDistance,
  nextWaypoint,
  strideAdvance,
  type Blocker,
  type Bounds,
} from '../walk'

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

/** Somebody crossing the picture who is not there for the player. */
type Ambient = {
  def: AmbientActor
  image: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Ellipse
  /** ms into this actor's own cycle */
  clock: number
}

type Target =
  | { kind: 'act'; act: string; verb: Verb; label: string; x: number; y: number; priority: number }
  | {
      kind: 'exit'
      exit: ExitDef
      verb: Verb
      label: string
      /** shown, named and refused — never silent */
      locked: boolean
      x: number
      y: number
      priority: number
    }

const WALK = 1.5
const RUN = 2.5
const STUCK_HINT = 30000
const STUCK_VOICE = 50000
const STUCK_POINT = 70000

/**
 * How fast the afternoon runs while the child is simply walking.
 *
 * One game minute per real second made the whole day five real minutes long, which meant
 * the opportunity windows closed faster than a player could read the street they were
 * standing in. Slowing the base rate does not make the chapter longer by making walking
 * slower (brief §41 forbids exactly that) — it makes the CHOICES legible, because every
 * real cost in this chapter is paid in explicit minutes by conversations and journeys,
 * and those are what should dominate the clock rather than the walk between them.
 */
const BASE_TIME = 0.72

/** How often the world offers to surprise you, and how likely it is when it does. */
/**
 * הסרט של הפרק — comes from the era now (`Era.cutscene`); `cutsceneFor` returning null is
 * still a legitimate state, and 1990 has no film by design (media not rights-cleared).
 */

const ENCOUNTER_EVERY = 22000
const ENCOUNTER_CHANCE: Partial<Record<LocationId, number>> = {
  street: 0.42,
  route: 0.5,
  kiosk: 0.3,
  pitch: 0.28,
  'bloomfield-outside': 0.45,
}

export class WorldScene extends Phaser.Scene {
  static readonly KEY = 'life-world'

  private ctx!: LifeContext
  private def!: SceneDef
  /** the chapter this room is being played in — every 1986/1990 difference reads from here */
  private era!: Era
  /** the doors that exist in this era; `def.exits` filtered once, used everywhere */
  private exits: ExitDef[] = []
  /** the painting under this room in this era — `bedroom` in 1986, `bedroom90` in 1990 */
  private art = ''
  /** the walk frame last drawn, so a footstep sounds once per contact */
  private lastFrame = -1
  private spawnName = 'start'
  /** 1990: the match as an information game, or null in any other year */
  private net: TransistorNet | null = null
  /** 11.3.1991: the hall, and the same evening heard from a living-room floor */
  private derby: DerbyNight | null = null
  private afar: DerbyFromAfar | null = null

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
  private ambient: Ambient[] = []
  /** dressing that can appear mid-scene, and the two that bounce */
  private layers: Array<{ def: LayerDef; image: Phaser.GameObjects.Image; baseY: number }> = []
  private hotspots: Hotspot[] = []
  private doorLights: Array<{ exit: ExitDef; image: Phaser.GameObjects.Image; base: number }> = []
  private mark!: Phaser.GameObjects.Triangle
  private pointer!: Phaser.GameObjects.Triangle
  private target: Target | null = null
  private focused: Phaser.GameObjects.Image | null = null

  /**
   * המקום שהצבעת עליו — where the player pointed, and what to do on arrival.
   *
   * This is the whole point-and-click layer in one field. `then` is null for "just walk
   * over there" and carries a `Target` for "walk over there and talk to him", which is the
   * grammar every LucasArts adventure used and the only grammar that works with a thumb.
   */
  private goal: { x: number; y: number; then: Target | null; run: boolean } | null = null
  /** the best ground distance this walk has managed, and how long since it improved */
  private goalBest = Infinity
  private goalStalled = 0
  /** timestamp of the last tap, for the double-tap-to-run every game of this era had */
  private lastTapAt = 0
  private goalMark!: Phaser.GameObjects.Ellipse
  /** the interactable the pointer is currently over, for the hover ring */
  private hovering: Target | null = null
  private hoverRing!: Phaser.GameObjects.Ellipse

  private paused = false
  private minuteAcc = 0
  private timeScale = 1
  private flagCount = 0
  private matchPhase: 'none' | 'archive' | 'watching' | 'goal' | 'celebrating' | 'over' = 'none'
  /** the film currently on screen, and the reason the world is stopped */
  private cutscene: HistoricalCutscene | null = null
  private goalMinute: number | null = null
  /** the one line before the goal, said once — its OWN latch, never `flagCount` */
  private saidTense = false
  private lastMatchLabel = ''
  private streamers: Phaser.GameObjects.Rectangle[] = []

  private dwell = 0
  private dwellExit: ExitDef | null = null
  /** where we came from, and whether the child has stepped clear of that doorway yet */
  private cameFrom: LocationId | null = null
  private clearedReturn = false
  /** ms since the room was entered — no door may swallow the player on arrival */
  private since = 0
  /**
   * Where the feet actually are. The drawn sprite bobs above this while walking, and for
   * one pass the bob was written back into `player.y` and read out again next frame as
   * the ground — so every side-on walk crept toward the horizon, a third of a per cent a
   * frame, until the child stood on the far edge of the band with every door he walked
   * through missing him by a hair. The ground is a number the bob never touches.
   */
  private groundY = 0
  private travelled = 0
  private idleFor = 0
  private stuckLevel = 0
  private breathe = 0
  private bobbing = 0
  private lastMinute = -1
  private sinceEncounter = 0
  /** who from the reusable pool has already spoken in this room, this visit */
  private metCrowd: string[] = []
  private baseZoom = 1
  private shotting = false
  /** how far the painted world continues above and below the painting (see `buildExtensions`) */
  private ext = 0

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
    this.derby = null
    this.afar = null
    this.cutscene = null
    this.goalMinute = null
    this.saidTense = false
    this.lastMatchLabel = ''
    this.streamers = []
    this.actors = []
    this.ambient = []
    this.layers = []
    this.hotspots = []
    this.doorLights = []
    this.target = null
    this.focused = null
    this.goal = null
    this.goalBest = Infinity
    this.goalStalled = 0
    this.hovering = null
    this.lastTapAt = 0
    this.dwell = 0
    this.dwellExit = null
    this.travelled = 0
    this.idleFor = 0
    this.stuckLevel = 0
    this.breathe = 0
    this.bobbing = 0
    this.lastMinute = -1
    this.sinceEncounter = 0
    this.metCrowd = []
    this.baseZoom = 1
    this.shotting = false
    this.ext = 0
    this.repaintGrade = null
  }

  preload() {
    const ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    const era = eraFor(ctx.engine.state.chapter)
    this.art = artFor(this.def, era.chapter)
    const need = new Set<string>([this.art, ...Object.values(era.player.pose), ...era.player.walk])
    const ext = extensionKeys(this.art)
    need.add(ext.sky)
    need.add(ext.ground)
    if ((PARALLAX as readonly string[]).includes(this.art)) {
      const planes = parallaxKeys(this.art)
      need.add(planes.far)
      need.add(planes.mid)
      need.add(planes.near)
    }
    const arrival = arrivalFor(this.def, era.chapter)
    if (arrival) need.add(arrival.art)
    for (const actor of this.def.actors) if (inEra(actor, era.chapter)) need.add(actor.figure)
    for (const actor of era.ambient) if (actor.location === this.def.id) need.add(actor.figure)
    for (const spot of this.def.hotspots) if (inEra(spot, era.chapter) && spot.prop) need.add(spot.prop.key)
    for (const layer of this.def.layers ?? []) if (inEra(layer, era.chapter)) need.add(layer.art)
    for (const key of need) {
      if (!this.textures.exists(`art-${key}`)) this.load.image(`art-${key}`, artUrl(key))
    }
  }

  /** the anchor of the chapter being played — never the 1986 one by habit */
  private get anchor(): HistoricalAnchor {
    return anchorFor(this.ctx.anchors, this.era, this.ctx.anchor)
  }

  private get chapter(): string {
    return this.era.chapter
  }

  create() {
    this.ctx = this.registry.get(CONTEXT_KEY) as LifeContext
    const state = this.ctx.engine.state
    this.era = eraFor(state.chapter)
    this.exits = this.def.exits.filter((exit) => exitInEra(exit, this.era.chapter))
    this.net = null
    this.derby = null
    this.afar = null

    this.cameras.main.setBackgroundColor(LIFE_PALETTE.night)
    const backdrop = this.add.image(0, 0, `art-${this.art}`).setOrigin(0, 0).setDepth(-1000)
    this.W = backdrop.width
    this.H = backdrop.height
    this.buildExtensions()
    this.buildParallax(backdrop)

    this.buildLights()
    this.buildLayers()
    this.buildActors(state)
    this.buildAmbient(state)
    this.buildHotspots(state)
    this.buildPlayer()
    this.buildAir()
    this.buildGrade()

    /**
     * המקום שהצבעת עליו — a ring on the floor, and it is not decoration.
     *
     * Every point-and-click game of the era drew one, because a click that produces no
     * visible acknowledgement for the third of a second before the character starts moving
     * reads as a click that did not register — and the player clicks again, and again.
     * It sits at the destination, at the destination's own scale, and fades as he arrives.
     */
    this.goalMark = this.add
      .ellipse(0, 0, 26, 26 * DEPTH, LIFE_PALETTE.red, 0)
      .setStrokeStyle(2, LIFE_PALETTE.red, 0.85)
      .setDepth(1)
      .setVisible(false)

    /** …and the same ring under whatever the pointer is hovering, which is the sentence line's other half. */
    this.hoverRing = this.add
      .ellipse(0, 0, 30, 30 * DEPTH, LIFE_PALETTE.sheet, 0)
      .setStrokeStyle(2, LIFE_PALETTE.sheet, 0.5)
      .setDepth(2)
      .setVisible(false)

    this.mark = this.add
      .triangle(0, 0, 0, 0, 14, 0, 7, 11, LIFE_PALETTE.red)
      .setDepth(9500)
      .setVisible(false)
    this.pointer = this.add
      .triangle(0, 0, 0, 0, 22, 9, 0, 18, LIFE_PALETTE.red)
      .setScrollFactor(0)
      .setDepth(9600)
      .setVisible(false)

    this.frameWorld()
    // The grade is built BEFORE the camera is framed, so it sized its wash and its
    // vignette to a viewport that does not exist yet — which on a tall phone painted a
    // pale rectangle across two thirds of the picture and left the rest ungraded. One
    // repaint, once the viewport is real. (It was invisible on the older, softer art and
    // obvious the moment a clean sky arrived.)
    this.repaintGrade?.()
    this.cameras.main.setBounds(0, -this.ext, this.W, this.H + 2 * this.ext)
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09)
    this.followPlayer()
    /**
     * הכניסה — a settle, not a cut.
     *
     * Every door used to land on a still frame. The camera now arrives a hair tighter
     * than it will rest and eases out over the fade-in: the room is entered in movement,
     * which is the fourth of the five tricks in the roadmap's grammar of entering a scene
     * (establish → cross the threshold → settle). Small — 4% — so it is felt, not watched.
     */
    this.cameras.main.setZoom(this.baseZoom * 1.04)
    this.tweens.add({ targets: this.cameras.main, zoom: this.baseZoom, duration: 760, ease: 'Sine.easeOut' })
    this.cameras.main.fadeIn(300, 0, 0, 0)
    this.scale.on('resize', this.onResize, this)

    /**
     * הצבעה — the control scheme this game should always have had.
     *
     * Phaser gives world coordinates on the pointer, so a tap is a place: the same handler
     * serves a mouse, a trackpad and a thumb, and no code below this line knows which one
     * it was. Movement keys still work and still win — `movePlayer` drops the goal the
     * instant an axis moves — because the two schemes are not rivals. Full Throttle shipped
     * both as well.
     */
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.paused || this.matchPhase === 'archive') return
      if (!this.onPicture(pointer.x, pointer.y)) return
      this.pointAt(pointer.worldX, pointer.worldY)
    })
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.paused) return
      // Hover is a mouse idea. A finger dragging across the glass is a drag, not a hover,
      // and lighting up every object it passes over is noise.
      if (pointer.isDown || pointer.wasTouch) return
      this.hovering = this.onPicture(pointer.x, pointer.y) ? this.pickAt(pointer.worldX, pointer.worldY) : null
    })

    this.ctx.dialogue.setHooks({
      travel: (to, spawn) => this.travel(to as LocationId, spawn),
      minigame: () => this.startMinigame(),
      ending: (id) => this.finishChapter(id),
      shot: (shot) => this.frameShot(shot),
      onOpen: (open) => {
        this.paused = open
        if (open) {
          this.vx = 0
          this.vy = 0
          this.clearGoal()
          this.ctx.bus.emit('prompt', null)
        } else {
          this.progress()
        }
      },
    })

    this.ctx.engine.dispatch({ t: 'moved', to: this.def.id })
    // The timetable applies the MOMENT the room is drawn, not on the next minute tick.
    // Building the scene from the definition and then correcting it a second later is
    // how a player sees somebody who is not supposed to be there — and it is how the
    // playthrough harness found Amit standing in the kiosk doorway twenty minutes
    // before he arrives.
    this.applySchedule()
    this.ctx.bus.emit('place', { id: this.def.id, title: this.def.titleHe, ambience: this.def.ambience })
    this.flagCount = Object.keys(this.ctx.engine.state.flags).length
    this.pushHud()
    // The board belongs to the terrace. Walk out through the tunnel after the whistle and
    // the strip used to follow the boy into the street, over the HUD, all the way home.
    if (this.def.id !== 'bloomfield-inside') this.ctx.bus.emit('match', null)
    this.teach()

    const arrival = arrivalFor(this.def, this.chapter)
    if (arrival && !state.flags[arrival.flag]) this.playArrival()
    else {
      this.beginMatch()
      this.beginNight()
    }

    this.openChapterBeat(state)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.onResize, this))
  }

  // ---------------------------------------------------------------------- build ---

  /**
   * שמיים ומדרכה — the painting continued, so a tall screen has something to show.
   *
   * Both strips are the same width as the painting and sit flush against it, sky above
   * (bottom edge at y = 0) and ground below (top edge at y = H). If either failed to load
   * the world simply ends at the painting, as it always did, and the camera bounds say so.
   */
  /**
   * עומק — three planes where the painter gave us three (4.9.2026).
   *
   * The flat painting stays exactly where it was — it is what the extension strips,
   * the doors and every fraction in the scene file are measured against — and it is
   * hidden under the planes. FAR scrolls at 0.86 of the camera, so the sky and the far
   * facades slide slower than the wall; MID is the wall and the ground at 1.0, pixel-
   * aligned with the flat painting, so nothing the player touches has moved; NEAR is a
   * lamp post, a car bonnet, a branch at 1.16, drawn OVER the child and scaled up by
   * the same amount so it reads as nearer, with a breath of blur where the renderer
   * can afford one. That last plane is the whole reason a phone can feel like a
   * diorama: something passes between you and the boy.
   *
   * Only X scrolls. Vertically the camera roams the extension strips, and a far plane
   * that lagged vertically would peel off the strips; a near plane is mostly empty and
   * needs no vertical coverage at all.
   */
  private buildParallax(flat: Phaser.GameObjects.Image) {
    if (!(PARALLAX as readonly string[]).includes(this.art)) return
    const keys = parallaxKeys(this.art)
    if (!this.textures.exists(`art-${keys.far}`) || !this.textures.exists(`art-${keys.mid}`)) return
    flat.setVisible(false)
    const far = this.add.image(0, 0, `art-${keys.far}`).setOrigin(0, 0).setDepth(-999)
    far.setScrollFactor(0.86, 1)
    const mid = this.add.image(0, 0, `art-${keys.mid}`).setOrigin(0, 0).setDepth(-998)
    mid.setScrollFactor(1, 1)
    if (this.textures.exists(`art-${keys.near}`)) {
      // Pulled a twelfth of the room to the left, so the object painted at the left edge
      // sits mostly off the glass when the boy starts by the front door — a foreground
      // that covers the first door of the game is a wall, not depth.
      const near = this.add.image(-0.075 * this.W, this.H, `art-${keys.near}`).setOrigin(0, 1).setDepth(7000)
      near.setScale(1.16)
      near.setScrollFactor(1.16, 1)
      // No blur: a post-FX pass on a full-screen plane halved the frame rate on the
      // software renderer and would do the same on a 2019 phone. The scale and the
      // speed are the depth; the alpha is the air between.
      near.setAlpha(0.9)
    }
  }

  private buildExtensions() {
    const keys = extensionKeys(this.art)
    if (!this.textures.exists(`art-${keys.sky}`) || !this.textures.exists(`art-${keys.ground}`)) return
    const sky = this.add.image(0, 0, `art-${keys.sky}`).setOrigin(0, 1).setDepth(-1001)
    const ground = this.add.image(0, this.H, `art-${keys.ground}`).setOrigin(0, 0).setDepth(-1001)
    sky.setDisplaySize(this.W, sky.height * (this.W / sky.width))
    ground.setDisplaySize(this.W, ground.height * (this.W / ground.width))
    this.ext = Math.min(sky.displayHeight, ground.displayHeight)
  }

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
    for (const exit of this.exits) {
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

  /**
   * הרחוב מתלבש — layers, which since the living pass means dressing as well as occlusion.
   *
   * Two things happen here that did not before. A layer may be CONDITIONAL, so the road
   * to the ground can be empty at noon and have a supporters' coach parked on it at four
   * without a second scene or a line of code; and a layer may be anchored by its FOOT,
   * which is the only honest way to stand a car on a pavement that recedes — the top-left
   * of a car plate is a point in the sky and means nothing.
   *
   * Conditions are read once, at `create`, against the state the player walked in with.
   * That is deliberate: dressing that pops in while you are looking at it reads as a bug,
   * and every condition used here turns over on a door, not on a tick.
   */
  /**
   * Every layer is BUILT, and `when` decides whether it is visible rather than whether it
   * exists.
   *
   * It used to `continue` past a layer whose condition was unmet, which was correct for
   * every piece of dressing this game had: a car that is gone by four o'clock is gone
   * because the player crossed the street again and the scene was rebuilt. The terrace is
   * the first dressing whose condition turns TRUE while the player is standing in the
   * room — the crowd appears at full time, in a scene nobody leaves — and a layer that was
   * skipped at `create` can never come back. So they are all built, hidden, and toggled by
   * `refresh` exactly as the actors are.
   */
  private buildLayers() {
    const state = this.ctx.engine.state
    for (const layer of this.def.layers ?? []) {
      if (!inEra(layer, this.chapter)) continue
      const image = this.add.image(layer.x * this.W, layer.y * this.H, `art-${layer.art}`)
      const source = this.textures.get(image.texture.key).getSourceImage()
      const width = layer.w * this.W
      const height = width * ((source.height || 1) / (source.width || 1))
      image.setOrigin(layer.foot ? 0.5 : 0, layer.foot ? 1 : 0)
      image.setDisplaySize(width, height)
      image.setDepth(layer.depth * this.H)
      if (layer.flip) image.setFlipX(true)
      if (layer.alpha !== undefined) image.setAlpha(layer.alpha)
      if (layer.tint !== undefined) image.setTint(layer.tint)
      image.setVisible(meets(state, layer.when))
      this.layers.push({ def: layer, image, baseY: image.y })
    }
  }

  /**
   * היציע קופץ — the only moving dressing in the game, and it costs one sine.
   *
   * Phase comes from the layer's own x, so thirty people on a terrace are never in step
   * with each other; `Math.abs` makes it a bounce rather than a float, because a crowd
   * that celebrates by hovering is a crowd of ghosts.
   */
  private bobLayers(delta: number) {
    // Its OWN accumulator. `this.breathe` is in seconds and drives the pointer, the door
    // lights and the player's own bob; borrowing a clock is how a fix to one of those
    // silently changes the speed of a crowd.
    this.bobbing += delta / 1000
    for (const entry of this.layers) {
      const amount = entry.def.bob
      if (!amount || !entry.image.visible) continue
      const phase = entry.def.x * 37
      entry.image.y = entry.baseY - Math.abs(Math.sin(this.bobbing * 5.2 + phase)) * amount * this.H
    }
  }

  private buildPlayer() {
    const spawn = this.def.spawns[this.spawnName] ?? Object.values(this.def.spawns)[0] ?? { x: 0.5, y: 0.9 }
    const x = spawn.x * this.W
    const y = Phaser.Math.Clamp(spawn.y, this.def.band.far, this.def.band.near) * this.H
    this.facing = spawn.facing === 'left' ? -1 : 1
    this.shadow = this.add.ellipse(x, y, 40, 12, LIFE_PALETTE.ink, 0.3).setDepth(y - 1)
    this.player = this.add.image(x, y, `art-${this.era.player.pose.down}`).setOrigin(0.5, 1).setDepth(y)
    this.groundY = y
    this.applyScale(this.player, this.shadow, y, this.playerSize())
  }

  /** the band's child size, grown for the year — see `PlayerFigure.scale` */
  private playerSize(): { far: number; near: number } {
    const k = this.era.player.scale ?? 1
    return { far: this.def.size.far * k, near: this.def.size.near * k }
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
      if (!inEra(def, this.chapter)) continue
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

  /**
   * הרקע החי — people crossing the picture, on their own clocks, for nobody.
   *
   * Each one is a single image that walks its own line, waits, and starts again. There is
   * no pathfinding and no schedule to keep: an ambient actor is not a person, it is the
   * evidence that people exist. They are drawn WITHOUT interaction — no name, no prompt,
   * no reach — so a player never walks up to one and finds out the street is scenery.
   *
   * The one thing they carry is the chapter's argument. Before ten past three the street
   * has two people going about a Saturday; after it, the same street has supporters, all
   * walking east, more of them every twenty minutes. Nobody says which way Bloomfield is.
   */
  private buildAmbient(state: LifeState) {
    for (const def of this.era.ambient) {
      if (def.location !== this.def.id) continue
      const y = def.y * this.H
      const shadow = this.add.ellipse(0, y, 40, 12, LIFE_PALETTE.ink, 0.2)
      const image = this.add.image(def.from * this.W, y, `art-${def.figure}`).setOrigin(0.5, 1)
      this.fit(image, def.size * this.H)
      image.setFlipX(def.to < def.from)
      shadow.setSize(image.displayWidth * 0.55, image.displayWidth * 0.16)
      const visible = meets(state, def.when)
      image.setVisible(visible)
      shadow.setVisible(visible)
      this.ambient.push({ def, image, shadow, clock: def.offsetMs ?? 0 })
    }
  }

  private moveAmbient(delta: number) {
    const state = this.ctx.engine.state
    for (const entry of this.ambient) {
      const { def } = entry
      const on = meets(state, def.when)
      entry.clock += delta
      const cycle = def.ms + def.everyMs + (def.pauseMs ?? 0)
      if (entry.clock > cycle) entry.clock -= cycle
      if (!on || entry.clock < 0 || entry.clock > def.ms + (def.pauseMs ?? 0)) {
        entry.image.setVisible(false)
        entry.shadow.setVisible(false)
        continue
      }

      // A pause partway across, because nobody walks a street at a constant speed and a
      // figure that does reads as a sprite on a conveyor belt.
      let progress: number
      const pauseStart = (def.pauseAt ?? 2) * def.ms
      if (def.pauseMs && entry.clock > pauseStart && entry.clock <= pauseStart + def.pauseMs) {
        progress = pauseStart / def.ms
      } else if (def.pauseMs && entry.clock > pauseStart + def.pauseMs) {
        progress = (entry.clock - def.pauseMs) / def.ms
      } else {
        progress = entry.clock / def.ms
      }

      const x = Phaser.Math.Linear(def.from, def.to, Phaser.Math.Clamp(progress, 0, 1)) * this.W
      const bob = Math.abs(Math.sin((entry.clock / 1000) * 5)) * this.H * 0.004
      entry.image.setPosition(x, def.y * this.H - bob)
      entry.shadow.setPosition(x, def.y * this.H + 1)
      entry.image.setDepth(def.y * this.H)
      entry.shadow.setDepth(def.y * this.H - 1)
      entry.image.setVisible(true)
      entry.shadow.setVisible(true)
    }
  }

  private buildHotspots(state: LifeState) {
    for (const def of this.def.hotspots) {
      if (!inEra(def, this.chapter)) continue
      const x = def.x * this.W
      const y = def.y * this.H
      const spot: Hotspot = { def, x, y, w: (def.w ?? 0.06) * this.W }
      if (def.prop) {
        const at = def.prop.at ?? def
        const image = this.add.image(at.x * this.W, at.y * this.H, `art-${def.prop.key}`).setOrigin(0.5, 1)
        this.fit(image, def.prop.size * this.H)
        // Drawn above the floor (on a table, a shelf): it sits behind whoever stands in
        // front of it, so its depth is the stand-point's, not the tabletop's.
        image.setDepth(Math.min(y, at.y * this.H) - 2)
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
      // a low hall under a tin roof: warm dust in the window light, slower than a terrace
      hall: { n: 30, tint: LIFE_PALETTE.lamp, speed: 9, alpha: 0.3, scale: 1.1 },
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

  /** the grade's own repaint, kept so it can be re-run once the camera is framed */
  private repaintGrade: (() => void) | null = null

  private buildGrade() {
    // Lighter than it was, on every outdoor state.
    //
    // The grade was tuned against paintings that were soft, warm and already low in
    // contrast. The September frames arrive with their own depth — real shadow on the
    // paving, a sky that goes somewhere — and the old wash sat on top of that like a
    // dirty window. Interiors keep their weight, because a room genuinely is darker
    // than a street at three in the afternoon.
    const grade: Record<string, { tint: number; alpha: number; vignette: number }> = {
      interior: { tint: LIFE_PALETTE.roof, alpha: 0.08, vignette: 0.42 },
      kitchen: { tint: LIFE_PALETTE.shutter, alpha: 0.07, vignette: 0.4 },
      day: { tint: LIFE_PALETTE.sky, alpha: 0.035, vignette: 0.22 },
      dusk: { tint: LIFE_PALETTE.redDeep, alpha: 0.06, vignette: 0.28 },
      tunnel: { tint: LIFE_PALETTE.night, alpha: 0.2, vignette: 0.72 },
      stadium: { tint: LIFE_PALETTE.red, alpha: 0.05, vignette: 0.3 },
      hall: { tint: LIFE_PALETTE.redDeep, alpha: 0.07, vignette: 0.46 },
    }
    const cfg = grade[this.def.ambience] ?? grade['day']
    if (!cfg) return
    const wash = this.add.rectangle(0, 0, 10, 10, cfg.tint, cfg.alpha).setOrigin(0, 0).setScrollFactor(0).setDepth(6000)
    const vignette = this.add.graphics().setScrollFactor(0).setDepth(6001)
    /**
     * `setScrollFactor(0)` pins a thing to the camera. It does NOT exempt it from zoom.
     *
     * Phaser places a scroll-locked object at `(p − half) × zoom + half`, so a rectangle
     * of `cam.width × cam.height` drawn at (0, 0) covers the glass only when the zoom is
     * exactly 1 — above it the wash overhangs harmlessly, and BELOW it the wash lands
     * inset on all four sides and the eye reads a pale rectangle sitting on the picture.
     * The street zooms past 1 on every viewport and looked perfect; gate seven zooms to
     * 0.9 and wore a visible box around two thirds of Bloomfield.
     *
     * So the overlay is sized in world units — `cam.width / zoom` — and offset by half
     * the difference, which is the exact inverse of the transform above. It now covers
     * the glass, edge to edge, at any zoom.
     */
    const paint = () => {
      const cam = this.cameras.main
      const zoom = cam.zoom || 1
      const w = cam.width / zoom
      const h = cam.height / zoom
      const left = (cam.width - w) / 2
      const top = (cam.height - h) / 2
      wash.setPosition(left, top)
      wash.setSize(w, h)
      vignette.clear()
      vignette.setPosition(left, top)
      const steps = 24
      const band = Math.max(w, h) * 0.4
      for (let i = 0; i < steps; i += 1) {
        const a = (cfg.vignette * (i + 1)) / steps / steps
        const inset = (band * (steps - i)) / steps
        vignette.fillStyle(LIFE_PALETTE.ink, a)
        vignette.fillRect(0, 0, w, inset * 0.5)
        vignette.fillRect(0, h - inset * 0.6, w, inset * 0.6)
        vignette.fillRect(0, 0, inset * 0.5, h)
        vignette.fillRect(w - inset * 0.5, 0, inset * 0.5, h)
      }
    }
    this.repaintGrade = paint
    paint()
    this.scale.on('resize', paint, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', paint, this))
  }

  /**
   * המסגור — full-bleed, camera-framed. The rule of the whole mobile pass, in one place.
   *
   * The painting covers the glass (see `fillCamera`); on a phone held upright that means
   * a tall slice of the room and the camera travelling along it with the child. `lift`
   * magnifies a touch past cover so a portrait screen has some vertical travel too —
   * enough for `followPlayer` to hold the floor band above a thumb resting on the bottom
   * of the glass, not enough to turn a room into a close-up.
   *
   * The shell is told `picture: 0` — "there is no frame; the picture is the glass" — and
   * lays its dialogue, deck and hairline out over the painting instead of under it.
   */
  private frameWorld() {
    const cam = this.cameras.main
    const view = this.scale.gameSize
    const portrait = view.height > view.width
    // The world is the painting plus its sky and ground strips; that is what must cover
    // the glass. In portrait the zoom is chosen so that about 42% of a 16:9 room's width is
    // on screen at once — a street you can read, a child a fifth of the screen tall —
    // unless even that would expose the top or bottom of the world, in which case cover
    // wins. Landscape is simply cover, with a hair of magnification so no edge ever shows.
    const tall = this.H + 2 * this.ext
    const { zoom: cover } = fillCamera(this, cam, this.W, tall, portrait ? 1 : 1.03)
    if (portrait) {
      // 42% of a 16:9 room; a squarer room shows proportionally more of itself, a wider
      // one proportionally less (and then cover usually wins anyway).
      const share = Math.min(0.8, 0.42 * (16 / 9) / (this.W / this.H))
      const wanted = Number(Math.max(cover, view.width / (this.W * share)).toFixed(3))
      cam.setZoom(Math.min(wanted, 7))
    }
    this.baseZoom = cam.zoom
    this.ctx.bus.emit('frame', { picture: 0 })
  }

  /**
   * איפה הילד עומד על הזכוכית — low, but never under the thumb.
   *
   * With the picture covering the screen there is no band under it for the controls, so
   * they float over the floor. The camera therefore aims to keep the child's feet around
   * 68% of the way down the glass rather than at its centre: he stands in the lower third
   * where a walker belongs, and the strip of floor beneath him is the strip the deck
   * covers. The bounds clamp wins at the edges of the painting, which is fine — at the top
   * of a room there is nothing to lift.
   *
   * The deadzone is narrow on purpose. A wide one let him walk a third of the screen
   * before the camera moved, which on a phone is most of the visible street.
   */
  private followPlayer() {
    const cam = this.cameras.main
    cam.setDeadzone(cam.width * 0.14, cam.height * 0.1)
    this.aimCamera()
  }

  /**
   * המבט קדימה — the camera leans the way the child is facing.
   *
   * A camera locked to the character's spine shows as much of the street behind him as in
   * front, and on a phone that is half the screen spent on where he has already been.
   * Leaning a twelfth of the view toward his facing is what every side-scroller since the
   * 16-bit era did; the follow lerp turns the change of heading into a slow pan rather
   * than a snap. Vertical: feet at 68% of the glass (see `followPlayer`).
   */
  private aimCamera() {
    const cam = this.cameras.main
    const view = cam.height / cam.zoom
    const lead = (this.lastDir === 'side' ? this.facing : 0) * (cam.width / cam.zoom) * 0.08
    cam.setFollowOffset(-lead, (0.68 - 0.5) * view)
  }

  private onResize() {
    this.frameWorld()
    this.followPlayer()
  }

  // --------------------------------------------------------------------- update ---

  override update(_time: number, delta: number) {
    this.ctx.input.beginFrame()
    this.breathe += delta / 1000
    this.pulseLights()
    // BEFORE the pause check. A crowd that freezes the moment a dialogue box opens is a
    // painted crowd, and the one place this runs is the terrace at full time — which is
    // exactly where the player stops to talk to somebody.
    this.bobLayers(delta)
    if (this.paused) return

    this.since += delta
    this.movePlayer(delta)
    if (!this.shotting) this.aimCamera()
    this.moveActors(delta)
    this.moveAmbient(delta)
    this.tickClock(delta)
    this.net?.tick(delta)
    this.derby?.tick(delta)
    this.tickEncounters(delta)
    // `aim` picks what the ACTION BUTTON would do, from proximity. It must not overwrite a
    // target the player pointed at and is still walking towards, or the sentence line
    // flickers between "talk to Kobi" and whatever he happens to be passing.
    if (!this.goal?.then) this.aim()
    this.paintHover()
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

  // ------------------------------------------------------------- point and click ---

  /**
   * הרצפה — the rectangle the child may stand on, in pixels.
   *
   * Two percent of the width is kept at each edge because a figure is drawn from its feet
   * and a walker pressed flat against the frame has half of himself off it.
   */
  private bounds(): Bounds {
    return {
      left: this.W * 0.02,
      right: this.W * 0.98,
      top: this.def.band.far * this.H,
      bottom: this.def.band.near * this.H,
    }
  }

  /**
   * מה עומד בדרך — everything standing on the floor that a walker has to go round.
   *
   * People and dressing, and nothing else: the backdrop has no collision because a painted
   * wall is above the band by construction. Radii come from the drawn object rather than
   * from a number in a scene file, so re-cutting a bin at a different size moves its
   * footprint with it. The vertical radius is squashed by `DEPTH` for the same reason the
   * whole band is: an object as deep as it is wide occupies about a third as much screen
   * height as screen width.
   */
  private blockers(): Blocker[] {
    const out: Blocker[] = []
    for (const actor of this.actors) {
      if (!actor.image.visible) continue
      const rx = actor.image.displayWidth * 0.34
      out.push({ x: actor.image.x, y: actor.image.y, rx, ry: rx * DEPTH })
    }
    for (const entry of this.layers) {
      const layer = entry.def
      if (!layer.foot || !entry.image.visible) continue
      if (layer.depth < this.def.band.far) continue
      const rx = entry.image.displayWidth * 0.36
      out.push({ x: entry.image.x, y: entry.baseY, rx, ry: rx * DEPTH })
    }
    return out
  }

  /**
   * מה יש שם — what is under a point on the painting, if anything.
   *
   * Hit boxes are DELIBERATELY bigger than the art. `docs` and the mobile directive both
   * say the same thing and it is the difference between a game and a test of finger
   * accuracy: the visible object stays small, the thing you have to hit does not. A person
   * is hit anywhere in their own silhouette plus a third; a hotspot gets a generous
   * ellipse; a door gets its whole declared rectangle. Priority breaks ties, so tapping
   * Kobi never opens the door behind him.
   */
  private pickAt(x: number, y: number): Target | null {
    const state = this.ctx.engine.state
    let best: Target | null = null
    let bestScore = -Infinity
    const take = (candidate: Target, near: number) => {
      const score = candidate.priority * 1000 - near
      if (score > bestScore) {
        bestScore = score
        best = candidate
      }
    }

    for (const actor of this.actors) {
      if (!actor.image.visible || !actor.def.talk) continue
      const rx = Math.max(actor.image.displayWidth * 0.7, this.W * 0.022)
      const ry = Math.max(actor.image.displayHeight * 0.55, this.H * 0.05)
      const dx = (x - actor.image.x) / rx
      const dy = (y - (actor.image.y - actor.image.displayHeight * 0.45)) / ry
      if (dx * dx + dy * dy > 1) continue
      take(
        {
          kind: 'act',
          act: actor.def.talk,
          verb: 'talk',
          label: actor.def.nameHe,
          x: actor.image.x,
          y: actor.image.y,
          priority: 4,
        },
        Math.hypot(dx, dy),
      )
    }

    for (const spot of this.hotspots) {
      if (!meets(state, spot.def.when)) continue
      const rx = Math.max(spot.w, this.W * 0.03)
      const ry = Math.max(this.H * 0.09, rx * 0.5)
      const dx = (x - spot.x) / rx
      const dy = (y - spot.y) / ry
      if (dx * dx + dy * dy > 1) continue
      take(
        {
          kind: 'act',
          act: spot.def.act,
          verb: spot.def.verb,
          label: spot.def.labelHe,
          x: spot.x,
          y: spot.y,
          priority: spot.def.priority ?? 1,
        },
        Math.hypot(dx, dy),
      )
    }

    for (const exit of this.exits) {
      if (!meets(state, exit.when)) continue
      const left = exit.x * this.W
      const right = (exit.x + exit.w) * this.W
      const top = exit.y * this.H
      const bottom = (exit.y + exit.h) * this.H
      // A door is worth reaching for from a little outside itself, because its art is
      // usually a dark rectangle at the edge of the frame.
      const pad = this.W * 0.02
      if (x < left - pad || x > right + pad || y < top - pad || y > bottom + pad) continue
      take(
        {
          kind: 'exit',
          exit,
          verb: 'exit',
          label: exit.labelHe,
          locked: !meets(state, needsFor(exit, this.chapter)),
          x: (left + right) / 2,
          y: (top + bottom) / 2,
          priority: exit.priority ?? 2,
        },
        0,
      )
    }
    return best
  }

  /**
   * איפה עומדים כדי לעשות את זה — the spot a walker has to reach to use a thing.
   *
   * Never the thing's own position: standing inside a person is not talking to them, and
   * standing in the middle of a doorway is how the auto-exit swallows you before the
   * conversation opens. So the stand-point is on the walker's side of the target, one
   * body-width out, clamped into the band — which is exactly what those games did and why
   * their characters always stopped in a natural place.
   */
  private standPoint(target: Target): { x: number; y: number } {
    const bounds = this.bounds()
    const y = Math.min(bounds.bottom, Math.max(bounds.top, target.y))
    if (target.kind === 'exit') {
      // Doors are entered from the room, not from the frame edge.
      const inward = target.x < this.W * 0.5 ? 1 : -1
      return clampToBand({ x: target.x + inward * this.W * 0.03, y }, bounds)
    }
    // Wide enough to be BESIDE them rather than on top of them: the walker's own width
    // and the target's, so a conversation with a seated man in an armchair does not end
    // with a child standing in the armchair.
    const theirs = target.kind === 'act' ? this.actorWidth(target.act) : 0
    const gap = Math.max(this.player.displayWidth * 0.75 + theirs * 0.5, this.W * 0.03)
    const side = this.player.x <= target.x ? -1 : 1
    return clampToBand({ x: target.x + side * gap, y }, bounds)
  }

  /** How wide the person behind this conversation is drawn, or 0 if it is not a person. */
  private actorWidth(act: string): number {
    const actor = this.actors.find((entry) => entry.def.talk === act && entry.image.visible)
    return actor ? actor.image.displayWidth : 0
  }

  /**
   * הצבעת. עכשיו הוא הולך.
   *
   * The one thing this must never do is teleport him, and the second thing is refuse. A tap
   * on a wall is not an error — it is a player saying "over there", and the honest answer
   * is to walk as far in that direction as the floor allows.
   */
  private pointAt(x: number, y: number) {
    // Double-tap to run, which is what every game on Maor's list did and what makes a long
    // walk across the yard a decision rather than a wait. The second tap does not have to
    // land in the same place — a player who taps twice is a player saying "hurry".
    const now = this.time.now
    const run = now - this.lastTapAt < 420
    this.lastTapAt = now

    const target = this.pickAt(x, y)
    const bounds = this.bounds()
    if (target) {
      const stand = this.standPoint(target)
      this.goal = { x: stand.x, y: stand.y, then: target, run }
      this.goalBest = Infinity
      this.goalStalled = 0
      this.showGoalMark(target.x, target.y)
      // Show what is about to happen before it happens, which is the sentence line.
      this.target = target
      this.pushPrompt(target)
      return
    }
    const spot = clampToBand({ x, y }, bounds)
    this.goal = { x: spot.x, y: spot.y, then: null, run }
    this.goalBest = Infinity
    this.goalStalled = 0
    this.showGoalMark(spot.x, spot.y)
  }

  /** True when this walk has stopped getting closer for long enough to call it stuck. */
  private stalled(left: number, delta: number, reach: number): boolean {
    if (left < this.goalBest - reach * 0.12) {
      this.goalBest = left
      this.goalStalled = 0
      return false
    }
    this.goalStalled += delta
    return this.goalStalled > 1500
  }

  /**
   * Is this canvas point ON THE PAINTING?
   *
   * הקנבס גדול מהתמונה. On a phone held upright the camera's viewport shrinks to the
   * picture and keeps its composition (rule 40) — but the CANVAS is still the whole box,
   * so there is a strip of live canvas under the picture where the dialogue box and the
   * console live. Phaser computes `worldX` from the main camera for a pointer anywhere on
   * that canvas, so a thumb landing on the console band came back as a perfectly
   * plausible place in the room and the child walked to it. A tap on a button is not a
   * tap on the floor, and this is the line that says so.
   */
  private onPicture(canvasX: number, canvasY: number): boolean {
    const cam = this.cameras.main
    return (
      canvasX >= cam.x &&
      canvasY >= cam.y &&
      canvasX <= cam.x + cam.width &&
      canvasY <= cam.y + cam.height
    )
  }

  /**
   * A tap the shell caught, in CLIENT pixels, turned into a place in the painting.
   *
   * The obvious version of this — scale the client offset by `cam.width / rect.width` —
   * is right on a desktop and WRONG ON EVERY PHONE, which is exactly where it was needed.
   * `rect` is the canvas; `cam.width × cam.height` is the framed picture inside it, and
   * on a tall screen those are different rectangles. Scaling one onto the other squashed
   * the whole world into the top of the glass: a thumb on the boy's feet arrived at his
   * chest, a thumb near the bottom of the picture arrived in the middle of the room, and
   * the further down you touched the wronger it got.
   *
   * So the conversion goes through the canvas's own coordinate space — `scale.width`,
   * which is what `rect` actually maps to — and only then subtracts the camera's viewport
   * origin. A point outside the picture is not a place, and is refused rather than
   * clamped: clamping would walk the child to the nearest floor tile every time somebody
   * pressed a button.
   */
  pointAtScreen(clientX: number, clientY: number) {
    if (this.paused || this.matchPhase === 'archive') return
    const canvas = this.game.canvas
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const canvasX = ((clientX - rect.left) / rect.width) * this.scale.width
    const canvasY = ((clientY - rect.top) / rect.height) * this.scale.height
    if (!this.onPicture(canvasX, canvasY)) return
    const cam = this.cameras.main
    this.pointAt(cam.scrollX + (canvasX - cam.x) / cam.zoom, cam.scrollY + (canvasY - cam.y) / cam.zoom)
  }

  private showGoalMark(x: number, y: number) {
    const size = Math.max(18, this.player.displayHeight * 0.34)
    this.goalMark.setPosition(x, y).setSize(size, size * DEPTH).setVisible(true).setAlpha(1)
    this.goalMark.setDisplaySize(size, size * DEPTH)
    this.tweens.killTweensOf(this.goalMark)
    this.tweens.add({ targets: this.goalMark, alpha: 0.15, duration: 620, yoyo: true, repeat: -1 })
  }

  private clearGoal() {
    this.goal = null
    this.goalBest = Infinity
    this.goalStalled = 0
    this.tweens.killTweensOf(this.goalMark)
    this.goalMark.setVisible(false)
  }

  /** The ring under whatever the mouse is over, sized to it. Touch never sees this. */
  private paintHover() {
    const target = this.hovering
    if (!target) {
      this.hoverRing.setVisible(false)
      return
    }
    const size = Math.max(22, this.player.displayHeight * 0.4)
    this.hoverRing.setPosition(target.x, target.y).setDisplaySize(size, size * DEPTH).setVisible(true)
  }

  private pushPrompt(target: Target | null) {
    if (!target) {
      this.ctx.bus.emit('prompt', null)
      return
    }
    this.ctx.bus.emit('prompt', {
      verb: target.verb,
      label: target.label,
      locked: target.kind === 'exit' && target.locked,
    })
  }

  private movePlayer(delta: number) {
    const input = this.ctx.input
    const bounds = this.bounds()

    /**
     * שני מקורות תנועה, ואחד מהם תמיד מנצח.
     *
     * A stick or an arrow key is a person taking the wheel, so it cancels wherever they had
     * pointed — instantly, before any of the arithmetic below. Anything else and the child
     * fights the player for the last half-second of a walk, which is the single most
     * irritating bug a point-and-click game can have.
     */
    const manual = Math.abs(input.x) + Math.abs(input.y) > 0.08
    if (manual && this.goal) this.clearGoal()

    let ax = input.x
    let ay = input.y
    let arrived: Target | null | undefined

    if (!manual && this.goal) {
      const here = { x: this.player.x, y: this.player.y }
      const way = nextWaypoint(here, this.goal, this.blockers(), this.player.displayWidth * 0.28)
      const left = groundDistance(here, this.goal)
      // Close enough is a body-width, measured on the GROUND — the same tolerance at both
      // ends of a band, where a pixel radius would be generous up close and impossible far
      // away.
      const reach = Math.max(this.player.displayWidth * 0.5, this.W * 0.012)
      if (left <= reach) {
        arrived = this.goal.then
        this.clearGoal()
      } else if (this.stalled(left, delta, reach)) {
        /**
         * הליכה שלא מתקדמת נעצרת. תמיד.
         *
         * Nothing in a point-and-click game may leave the player watching a character
         * shuffle against something forever, and a steering behaviour CAN — a destination
         * in a corner behind two obstacles, an actor who moved into the last gap. So the
         * walk is watched: if a second and a half passes without getting meaningfully
         * closer, it ends. If we got close enough to be useful the thing still happens;
         * otherwise control simply comes back, and the player can point again.
         */
        arrived = left <= reach * 2.6 ? this.goal.then : null
        this.clearGoal()
      } else {
        const dx = way.x - here.x
        const dy = (way.y - here.y) / DEPTH
        const len = Math.hypot(dx, dy) || 1
        const ease = arrivalEase(left, reach * 3.2)
        ax = (dx / len) * ease
        ay = (dy / len) * ease
      }
    }

    const running = (input.run || this.goal?.run === true) && this.ctx.engine.state.energy > 6
    const speed = (running ? RUN : WALK) * this.player.displayHeight
    const ease = 1 - Math.pow(0.0015, delta / 1000)

    this.vx = Phaser.Math.Linear(this.vx, ax * speed, ease)
    this.vy = Phaser.Math.Linear(this.vy, ay * speed * DEPTH, ease)

    const step = delta / 1000
    const nx = Phaser.Math.Clamp(this.player.x + this.vx * step, bounds.left, bounds.right)
    const ny = Phaser.Math.Clamp(this.groundY + this.vy * step, bounds.top, bounds.bottom)
    const movedX = nx - this.player.x
    const movedY = ny - this.groundY
    this.travelled += Math.abs(movedX) + Math.abs(movedY)
    this.groundY = ny
    this.player.setPosition(nx, ny)

    const moving = Math.abs(ax) + Math.abs(ay) > 0.08
    if (moving) {
      if (Math.abs(ax) > Math.abs(ay) * 0.8) {
        this.lastDir = 'side'
        this.facing = ax < 0 ? -1 : 1
      } else {
        this.lastDir = ay < 0 ? 'up' : 'down'
      }
      /**
       * הרגליים לא מחליקות יותר.
       *
       * This was `(delta / 1000) * 7.5` — frames per second, regardless of speed, size or
       * distance — and it is why Maor said the movement fakes it. A walk cycle belongs to
       * the FLOOR: the planted foot must stay planted, so the cycle advances by ground
       * covered divided by the length of a stride, and a stride is a fraction of a body.
       * At the far end of the pitch the child is half the size and covers half the ground,
       * and his legs now move half as fast to match, which is the whole illusion.
       */
      this.stride += strideAdvance(
        Math.hypot(movedX, movedY / DEPTH),
        this.player.displayHeight,
        this.era.player.walk.length,
      )
      this.idleFor = 0
    }

    // The child is the one character with a real walk cycle — eight frames from the
    // green-screen sheet — and it only exists side-on, which is where the walking mostly
    // happens. Facing the camera or away, a bob does the work.
    if (moving && this.lastDir === 'side') {
      const walk = this.era.player.walk
      const index = Math.floor(this.stride) % walk.length
      const frame = walk[index] ?? walk[0]
      this.player.setTexture(`art-${frame}`)
      // A foot lands on the contact frames (the first of each half of the cycle) — and
      // on a two-frame stand-in, on every frame change.
      if (index !== this.lastFrame) {
        this.lastFrame = index
        if (walk.length < 6 || index % Math.floor(walk.length / 2) === 0) {
          const surface = this.def.ambience === 'stadium' ? 'terrace' : this.def.ambience === 'day' || this.def.ambience === 'dusk' ? 'street' : 'floor'
          this.ctx.bus.emit('sound', { kind: 'step', surface })
        }
      }
    } else {
      const poses = this.era.player.pose
      const pose = this.lastDir === 'up' ? poses.up : this.lastDir === 'side' ? poses.side : poses.down
      this.player.setTexture(`art-${pose}`)
    }
    this.player.setFlipX(this.facing < 0)

    this.applyScale(this.player, this.shadow, ny, this.playerSize())
    if (moving) {
      // The bob runs on EVERY heading now, side-on included.
      //
      // It used to be the substitute for an animation and was therefore suppressed
      // exactly where the animation existed. Pogi's sheet holds two strides rather than
      // eight, so the bob is no longer a substitute — it is half the walk, and the two
      // frames read as steps because the body rises between them. It is smaller
      // side-on, because there a real leg is already moving.
      const lift = this.lastDir === 'side' ? 0.0032 : 0.005
      this.player.y = ny - Math.abs(Math.sin(this.stride)) * this.H * lift
    }

    if (running) this.ctx.engine.dispatch({ t: 'energy.changed', delta: -delta / 2400 })
    if (this.travelled > this.W * 0.06) this.progress()

    // …and if this frame ended a walk that was going somewhere for a reason, do the thing.
    // After the move, so the child is standing where he will be seen to be standing.
    if (arrived) {
      this.turnTo(arrived)
      this.target = arrived
      this.act()
    }
  }

  /**
   * מסתובבים אל מי שבאת לדבר איתו.
   *
   * A child who walks across the room to his father and then delivers the conversation
   * with his back to him is the tell that the arrival was a distance check rather than a
   * meeting — and it is the single frame the player looks at for the whole conversation,
   * because the box that opens next freezes the world. Every game on Maor's list turns the
   * character before the first line. Side-on gets the flip; a target that is mostly above
   * or below gets the matching standing pose, so a hotspot on the floor is looked DOWN at.
   */
  private turnTo(target: Target) {
    const dx = target.x - this.player.x
    const dy = (target.y - this.player.y) / DEPTH
    if (Math.abs(dx) > Math.abs(dy) * 0.8) {
      this.lastDir = 'side'
      this.facing = dx < 0 ? -1 : 1
      this.player.setTexture(`art-${this.era.player.pose.side}`)
    } else {
      this.lastDir = dy < 0 ? 'up' : 'down'
      this.player.setTexture(`art-${this.lastDir === 'up' ? this.era.player.pose.up : this.era.player.pose.down}`)
    }
    this.player.setFlipX(this.facing < 0)
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
    this.minuteAcc += (delta / 1000) * this.timeScale * BASE_TIME
    if (this.minuteAcc < 1) return
    const minutes = Math.floor(this.minuteAcc)
    this.minuteAcc -= minutes
    this.ctx.engine.dispatch({ t: 'clock.advanced', minutes })
    this.timeTriggers()
    this.onMinute()
    this.pushHud()
  }

  /**
   * הדקה — everything that is allowed to notice that time passed.
   *
   * One place, once a minute, in a fixed order: the timetable moves people, then the
   * windows open and close. Spreading either of those through the update loop is how a
   * scene ends up with two clocks that disagree.
   */
  /**
   * Everything that is allowed to notice a minute passed — and nothing during a fast-
   * forward, which is what made the fast-forward slow.
   *
   * At twenty-six times speed the clock produces about twenty game minutes a second, and
   * each one was folding the whole event log, re-running the NPC timetable and ticking
   * every opportunity window. The frame budget went, Phaser clamped `delta` to stop the
   * loop spiralling, and the "time-lapse" then ran at roughly ONE times speed — a
   * ninety-minute match at real speed, from a number that says 26.
   *
   * Neither job means anything inside a stadium: no scheduled NPC stands in this scene
   * and no window is open in it. So during the match the minute is just a number, which
   * is exactly what a scoreboard wants.
   */
  private onMinute() {
    const state = this.ctx.engine.state
    if (state.minute === this.lastMinute) return
    this.lastMinute = state.minute
    if (this.matchPhase === 'watching' || this.matchPhase === 'goal') return
    this.applySchedule()
    this.tickWindows()
  }

  /**
   * מי פה עכשיו — the timetable, applied to the people standing in this painting.
   *
   * A scheduled actor is moved and shown or hidden; an actor nobody scheduled keeps
   * exactly the position the scene gave them. The scene's own `when` still applies on
   * top, so "Ofir is at the ground after twenty to four" and "and only if he likes you"
   * are two separate statements that compose instead of one that has to be rewritten.
   */
  private applySchedule() {
    const state = this.ctx.engine.state
    const placements = placementsAt(state, this.era.schedule, this.def.id)
    for (const actor of this.actors) {
      const placement = placements.get(actor.def.id)
      if (!placement) continue
      const visible = placement.visible && meets(state, actor.def.when)
      actor.image.setVisible(visible)
      actor.shadow.setVisible(visible)
      if (!visible) continue
      if (placement.x !== undefined) {
        actor.baseX = placement.x * this.W
        actor.image.x = actor.baseX
        actor.shadow.x = actor.baseX
      }
      if (placement.y !== undefined) {
        const y = placement.y * this.H
        this.applyScale(actor.image, actor.shadow, y, { far: actor.def.size, near: actor.def.size })
        actor.image.y = y
      }
      if (placement.facing) actor.image.setFlipX(placement.facing === 'left')
    }
  }

  /**
   * החלונות — an opportunity that has just become real, and one the afternoon just took.
   *
   * The notice is one quiet sentence about the WORLD ("somebody is kicking a ball down
   * the alley"), never an objective and never a name with a marker on it. A window that
   * closes says nothing at all: the player finds out by going to look and finding an
   * empty step, which is the only version of that information worth having.
   */
  private tickWindows() {
    const { events, opened, closed } = tickOpportunities(this.ctx.engine.state, this.era.opportunities)
    if (events.length === 0) return
    this.ctx.engine.dispatch(...events)
    // A window that CLOSES speaks first, because that is the one the player paid for.
    const gone = closed.find((entry) => entry.goneHe)
    if (gone?.goneHe) {
      this.ctx.bus.emit('toast', { text: gone.goneHe, tone: 'plain' })
      this.refresh()
      return
    }
    const notice = opened.find((entry) => entry.noticeHe)
    if (notice?.noticeHe) this.ctx.bus.emit('toast', { text: notice.noticeHe, tone: 'plain' })
  }

  /**
   * המקריות — rolled off the save's own seed, on a timer, only where a place is busy.
   *
   * It never fires while a conversation is open, never in the first seconds of a room,
   * and never indoors: a coin in the gutter of your own kitchen is not a surprise, it is
   * a slot machine. Everything it can produce is in `content/encounters1986.ts`, so the
   * question "what can happen to me on this street" has a file for an answer.
   */
  private tickEncounters(delta: number) {
    const chance = ENCOUNTER_CHANCE[this.def.id]
    if (!chance) return
    if (!this.ctx.engine.state.flags['onboard:street']) return
    if (this.since < 2500) return
    this.sinceEncounter += delta
    if (this.sinceEncounter < ENCOUNTER_EVERY) return
    this.sinceEncounter = 0

    const state = this.ctx.engine.state
    const { picked, consumed } = rollEncounter(state, this.era.encounters, this.chapter, this.def.id, chance)
    this.ctx.engine.dispatch(...encounterEvents(picked, consumed))
    if (!picked) return
    /**
     * `@crowd` — the reusable ensemble, speaking (character bible §10, §13).
     *
     * An encounter may name its speaker or leave it to the neighbourhood. When it asks
     * for the crowd, one person is drawn off the save's own seed from the twelve
     * supporters the production table marks as reusable, filtered to this chapter, and
     * the same person cannot be drawn twice in one visit to a room. Nobody the story owns
     * is in that hat — a memorial character may not be set dressing.
     */
    let who = picked.who ?? null
    if (who === '@crowd') {
      const { people, consumed: used } = crowdSpeaker(state, this.chapter, this.metCrowd)
      const person = people[0] ?? null
      this.ctx.engine.dispatch({ t: 'rng.consumed', count: used })
      if (person) this.metCrowd.push(person.id)
      who = person?.displayNameHe ?? null
    }
    this.ctx.dialogue.startLines([{ who, text: picked.lineHe }], () => this.applyEncounter(picked.id))
  }

  private applyEncounter(id: string) {
    const found = this.era.encounters.find((entry) => entry.id === id)
    if (!found) return
    this.ctx.dialogue.applyEffects(found.effects)
    this.refresh()
  }

  private timeTriggers() {
    const engine = this.ctx.engine
    const state = engine.state

    /**
     * 1991 has one time trigger and it is the whole evening: eight o'clock happens
     * whether or not the boy is in the building (§14, and §36's "history does not wait").
     * Everything else this method does belongs to two Saturdays with a father in them.
     */
    if (this.chapter === '1991') {
      if (state.minute >= TIP_OFF && !state.flags['tipoff:1991']) {
        engine.dispatch({ t: 'flag.raised', flag: 'tipoff:1991' })
        if (this.def.id === 'ussishkin-hall') {
          this.startDerby()
        } else {
          if (state.flags['uss:arrived']) engine.dispatch({ t: 'flag.raised', flag: 'missed:tipoff' })
          this.ctx.bus.emit('toast', {
            text: state.flags['uss:arrived']
              ? 'מהאולם, דרך הקיר: רעש אחד גדול. התחילו.'
              : 'איפשהו מזרחה מכאן, אולם קטן מתחיל לרעוד.',
            tone: 'plain',
          })
          this.beginNight()
        }
        this.refresh()
      }
      return
    }

    if (this.chapter === '1990') {
      // 1990: he says he is leaving, and then he waits — for a while.
      if (state.minute >= KOBI_SAYS_LEAVING && !state.flags['kobi:leaving'] && !state.flags['kobi:left']) {
        engine.dispatch({ t: 'flag.raised', flag: 'kobi:leaving' })
        this.ctx.bus.emit('toast', {
          text: this.def.id === 'kitchen' ? 'אבא מקפל את העיתון. "יוצאים."' : 'מהמטבח: "יוצאים!"',
          tone: 'red',
        })
        this.refresh()
      }
      const leavesAt = state.flags['asked:five'] ? KOBI_LEAVES_LATE : KOBI_LEAVES
      if (state.minute >= leavesAt && !state.flags['kobi:left']) {
        engine.dispatch({ t: 'flag.raised', flag: 'kobi:left' })
        this.ctx.bus.emit('toast', { text: 'הדלת נסגרת. אבא הלך. אמר שער 7.', tone: 'red' })
        this.refresh()
      }
    } else if (state.minute >= KOBI_LEAVES && !state.flags['kobi:left']) {
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
    if (state.minute >= FULL_TIME && !state.flags['match:over'] && !this.net) {
      engine.dispatch({ t: 'flag.raised', flag: 'match:over' })
      if (this.def.id !== 'bloomfield-inside') engine.dispatch({ t: 'flag.raised', flag: 'arrived:late' })
      this.refresh()
    }
  }

  private refresh() {
    const state = this.ctx.engine.state
    for (const entry of this.layers) {
      entry.image.setVisible(meets(state, entry.def.when))
    }
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
      // A locked door still shows, dimmer: you can see where it goes and you can see it
      // is not for you yet.
      light.base = meets(state, needsFor(light.exit, this.chapter))
        ? light.exit.light?.tone === 'daylight'
          ? 0.4
          : 0.24
        : 0.1
    }
    this.flagCount = Object.keys(state.flags).length
    this.pushHud()
  }

  private pushHud() {
    const state = this.ctx.engine.state
    this.ctx.bus.emit('hud', {
      clock: clockLabel(state.weekday, state.minute),
      date: longDateHe(this.anchor.match?.playedOn) ?? String(state.year),
      agorot: state.agorot,
      showMoney: state.agorot > 0,
      place: this.def.titleHe,
      objective: this.objective(state),
    })
  }

  /**
   * המטרה — one short line that follows the actual chain of locks.
   *
   * It never says where to click. It says what the day is about right now, and it changes
   * only when the state that produced it changes: find the key, talk to your father, then
   * the door east means something, then get in, then find him.
   */
  private objective(state: LifeState): string | null {
    return this.era.objective(state, this.def.id, this.matchPhase === 'over' || Boolean(state.flags['match:over']))
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
    const stuck = stuckFor(this.def, this.chapter)
    if (level === 2 && stuck) {
      this.ctx.bus.emit('toast', { text: stuck, tone: 'plain' })
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
    const open = this.exits.filter((exit) => meets(state, exit.when))
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
    for (const exit of this.exits) {
      if (!meets(state, exit.when)) continue
      const cx = (exit.x + exit.w / 2) * this.W
      const cy = (exit.y + exit.h / 2) * this.H
      consider(cx, cy, (exit.w / 2 + 0.035) * this.W, () => ({
        kind: 'exit',
        exit,
        verb: 'exit',
        label: exit.labelHe,
        locked: !meets(state, needsFor(exit, this.chapter)),
        x: cx,
        y: cy,
        priority: exit.priority ?? 2,
      }))
    }

    this.target = best
    this.focus(best)
    this.pushPrompt(best as Target | null)
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
    // Whatever the player pointed at, this is it happening. A goal that survives its own
    // arrival sends the child walking again the moment the dialogue closes.
    if (this.goal) this.clearGoal()
    if (!this.ctx.engine.state.flags['onboard:acted']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'onboard:acted' })
      this.teach()
    }
    this.progress()
    if (target.kind === 'exit') {
      if (target.locked) {
        this.ctx.bus.emit('toast', {
          text: blockedFor(target.exit, this.chapter) ?? 'עוד לא.',
          tone: 'plain',
        })
        return
      }
      this.travel(target.exit.to, target.exit.spawn)
      return
    }
    if (target.act.startsWith('net:') && this.net) {
      this.net.talk(target.act)
      return
    }
    if (target.act.startsWith('pano:')) {
      const key = target.act.slice(5)
      const look = PANO_SPOTS[key]
      if (look) this.openPano(key, look.titleHe, look.spots, undefined, look.startYaw ?? 0)
      return
    }
    if (!this.ctx.dialogue.start(target.act)) this.ctx.bus.emit('prompt', null)
  }

  /**
   * הפתיחה של הפרק — the one beat a room plays by itself, once.
   *
   * 1990 opens at the kitchen table with the exchange from the brief (§6): the age is
   * established by a father saying "you are twelve" and nothing else. And it closes, after
   * the finale, with a school morning in the bedroom — history made small again (§25).
   */
  private openChapterBeat(state: LifeState) {
    if (this.chapter === '1991') {
      this.openBeat1991(state)
      return
    }
    if (this.chapter !== '1990') return
    if (this.def.id === 'kitchen' && !state.flags['saw:table']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'saw:table' })
      this.time.delayedCall(700, () => {
        this.ctx.dialogue.startLines(TABLE_1990, () => this.refresh())
      })
      return
    }
    if (this.def.id === 'bedroom' && state.chapterDone && !state.flags['saw:morning']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'saw:morning' })
      this.time.delayedCall(900, () => {
        this.ctx.dialogue.startLines(SCHOOL_MORNING_1990, () => {
          // Sitting up in bed: the morning after, from his own eyes — then the card.
          const look = PANO_SPOTS['panoBedroomMorning90']
          /**
           * הגשר — ten months, in the length of one card (brief §26).
           *
           * The brief is explicit that the road from May 1990 to March 1991 must NOT be a
           * montage or a second historical finale: a few compact fragments and a world
           * that has moved. The fragment is the one already playing — a school morning
           * with a scarf hidden in a bag and a friend asking about Ussishkin — and this
           * is the cut at the end of it. `year.entered` clears the afternoon (its flags,
           * its pockets) and keeps what belongs to the person; `chapter.entered` puts the
           * boy in 1991 and clears `chapterDone`, and the save is written before the room
           * changes, so the bridge cannot be crossed twice.
           */
          const card = () => {
            this.ctx.bus.emit('card', { titleHe: 'מרץ', subHe: 'אוסישקין', ms: 2400 })
            this.time.delayedCall(2500, () => {
              this.ctx.engine.dispatch(
                { t: 'year.entered', year: ERA_1991.year, weekday: 1, minute: SCHOOL_STARTS },
                { t: 'chapter.entered', chapter: ERA_1991.chapter },
                { t: 'flag.raised', flag: 'life:bridge-1991' },
              )
              void this.ctx.engine.save()
              this.cameras.main.fadeOut(500, 0, 0, 0)
              this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.restart({ mapId: 'classroom', spawn: 'start', from: 'bedroom' })
              })
            })
          }
          if (look) this.openPano('panoBedroomMorning90', look.titleHe, look.spots, card, look.startYaw ?? 0)
          else card()
        })
      })
    }
  }

  /**
   * 11.3.1991 — the beats the rooms of this chapter play by themselves.
   *
   * Two of them, at the two ends of the same classroom. The morning one is the whole
   * conflict in nine lines and a folded piece of paper (§27); the other is the last thing
   * that happens in Stage B, and it is a whisper, a question from a teacher, and a boy
   * failing to keep a straight face (§46). Between them is everything the player did.
   */
  private openBeat1991(state: LifeState) {
    if (this.def.id !== 'classroom') return

    if (!state.chapterDone && !state.flags['saw:class1991']) {
      this.ctx.engine.dispatch(
        { t: 'flag.raised', flag: 'saw:class1991' },
        // The beat IS him opening it under the desk, so the note is read and in his hand
        // when it ends: walking up to the desk afterwards offers the answer, not the
        // discovery. (A player who somehow never sees the beat still finds it there.)
        { t: 'flag.raised', flag: 'note:read' },
        { t: 'item.gained', item: 'school-note' },
        // Pocket money, because `year.entered` empties the pockets and a thirteen-year-old
        // with nothing in them cannot buy anything at a hall kiosk. One coin, once.
        { t: 'money.changed', agorot: 150, why: 'דמי כיס' },
      )
      this.time.delayedCall(700, () => {
        this.ctx.dialogue.startLines(CLASSROOM_1991, () => this.refresh())
      })
      return
    }

    if (state.chapterDone && !state.flags['saw:closing1991']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'saw:closing1991' })
      this.time.delayedCall(900, () => {
        this.ctx.dialogue.startLines(closing1991(derbyMarginHe(this.anchor)), () => {
          this.ctx.bus.emit('card', {
            titleHe: 'סוף שלב ב׳',
            subHe: '1991–1993 — גיבורים, חברים, שירים',
            ms: 3200,
          })
          this.refresh()
        })
      })
    }
  }

  /**
   * הערב — one method, three places it can happen, and the same history in all of them.
   *
   * In the hall it starts the director. At home it starts the radio. Outside, with the
   * boy who left when he said he would, it plays the wall. Nothing here decides anything
   * about the night: it only asks WHERE the player is when it arrives, which is the only
   * question this chapter has ever been asking.
   */
  private beginNight() {
    if (this.chapter !== '1991') return
    const state = this.ctx.engine.state
    if (state.chapterDone) return

    if (this.def.id === 'ussishkin-hall') {
      if (!state.flags['uss:arrived']) this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'uss:arrived' })
      if (state.flags['derby:over']) return
      if (state.minute >= TIP_OFF) this.startDerby()
      return
    }

    // He walked out at half past nine and the wall finished the game for him (§41).
    if (state.flags['heard:wall'] && !state.flags['derby:over']) {
      this.wallBeat()
      return
    }

    // §31 — the route that must exist: the evening from a living-room floor.
    const atHome = this.def.id === 'home' || this.def.id === 'kitchen' || this.def.id === 'bedroom'
    if (atHome && !state.flags['derby:over'] && !this.afar && state.minute >= TIP_OFF) {
      this.paused = true
      this.ctx.dialogue.startLines(HOME_NIGHT_1991, () => {
        this.paused = false
        this.afar = new DerbyFromAfar(this, this.ctx, this.anchor, () => {
          this.afar = null
          this.ctx.bus.emit('toast', { text: 'נגמר. הבית שקט, והרחוב בחוץ — לא.', tone: 'plain' })
          this.refresh()
        })
        this.afar.start()
      })
    }
  }

  /** the horn heard through concrete, and then the night is over for him too */
  private wallBeat() {
    this.paused = true
    this.ctx.bus.emit('controls', { visible: false })
    this.time.delayedCall(600, () => {
      this.ctx.dialogue.startLines(DerbyNight.wallLines(), () => {
        this.ctx.engine.dispatch(
          { t: 'flag.raised', flag: 'derby:over' },
          { t: 'anchor.attended', anchorId: this.anchor.id },
          { t: 'redheart.changed', key: 'basketballLove', delta: 8 },
          { t: 'redheart.changed', key: 'loyaltyReturn', delta: 6 },
        )
        this.paused = false
        this.ctx.bus.emit('controls', { visible: true })
        this.refresh()
      })
    })
  }

  /**
   * הטיפ-אוף — and from here the director owns the clock, exactly as 1990's does.
   *
   * `timeScale = 0` for the same reason: the day clock cannot be allowed to run past the
   * curfew on its own while forty minutes of basketball are being played in real seconds.
   * The director moves the HUD clock itself, in steps, so half past nine ARRIVES rather
   * than being announced.
   */
  private startDerby() {
    if (this.derby || this.def.id !== 'ussishkin-hall') return
    if (this.ctx.engine.state.flags['derby:over']) return
    this.timeScale = 0
    this.derby = new DerbyNight(this, this.ctx, this.anchor, {
      onBoard: (board) => this.ctx.bus.emit('match', board),
      onMood: (mood) => this.moodShift(mood),
      onOver: () => this.endDerby(),
      onCurfew: () => {
        this.refresh()
        this.pushHud()
      },
      playerAt: () => ({ x: this.player.x / this.W, y: this.groundY / this.H }),
      spotAt: () => {
        const spot = this.hotspots.find((entry) => entry.def.id === 'the-spot')
        return spot ? { x: spot.x / this.W, y: spot.y / this.H } : null
      },
    })
    this.derby.start()
  }

  /** what the room does when eight hundred people do something at once */
  private moodShift(mood: DerbyMood) {
    const cam = this.cameras.main
    if (mood === 'eruption' || mood === 'chaos') {
      this.tweens.add({ targets: cam, zoom: this.baseZoom * 1.03, duration: 260, yoyo: true, ease: 'Sine.easeOut' })
      return
    }
    if (mood === 'nervous') {
      this.tweens.add({ targets: cam, zoom: this.baseZoom * 0.99, duration: 900, yoyo: true, ease: 'Sine.easeInOut' })
    }
  }

  /** הצופר — the world comes back, with paper in the air and somewhere to be */
  private endDerby() {
    this.derby = null
    this.timeScale = 1
    this.paused = false
    this.startCarnival()
    this.cameras.main.shake(900, 0.006)
    this.ctx.bus.emit('controls', { visible: true })
    this.refresh()
    this.time.delayedCall(1800, () => this.ctx.bus.emit('anchor', { anchor: this.anchor, showing: true }))
    this.time.delayedCall(4200, () => {
      if (this.ctx.engine.state.flags['walked:home']) return
      this.ctx.bus.emit('toast', { text: 'הרחוב בחוץ מלא. וגם השעה מלאה. הביתה.', tone: 'plain' })
    })
  }

  /** 1990: the whistle. The director has already written the score; this hands the terrace back. */
  private endNet() {
    this.net = null
    this.timeScale = 1
    this.paused = false
    this.matchPhase = 'over'
    const state = this.ctx.engine.state
    // The afternoon catches up with the match: an EVENT, like 1986's `returnFromArchive`.
    if (state.minute < FULL_TIME) this.ctx.engine.dispatch({ t: 'clock.advanced', minutes: FULL_TIME - state.minute })
    if (!state.flags['match:over']) {
      this.ctx.engine.dispatch(
        { t: 'flag.raised', flag: 'match:over' },
        { t: 'flag.raised', flag: 'saw:goal' },
        { t: 'anchor.attended', anchorId: this.anchor.id },
        { t: 'redheart.changed', key: 'footballLove', delta: 12 },
        { t: 'redheart.changed', key: 'community', delta: 8 },
        {
          t: 'memory.kept',
          memory: {
            id: `${this.era.memoryPrefix}-promotion`,
            item: 'promotion-table',
            atMinute: state.minute,
            year: state.year,
            anchorId: this.anchor.id,
          },
        },
      )
    }
    this.startCarnival()
    this.cameras.main.shake(900, 0.006)
    this.ctx.bus.emit('controls', { visible: true })
    this.refresh()
    this.pushMatch()
    this.time.delayedCall(2600, () => {
      if (this.ctx.engine.state.flags['found:kobi']) return
      this.ctx.bus.emit('toast', { text: 'הוא איפשהו כאן. ליד העמוד, אמרו. תמצא אותו.', tone: 'plain' })
    })
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
    const y = this.groundY / this.H
    // A hair of tolerance on every edge: a zone drawn to the band's far line and feet
    // clamped to that same line are the same number twice, rounded two different ways.
    const eps = 0.004
    const within = (exit: ExitDef) =>
      x >= exit.x - eps && x <= exit.x + exit.w + eps && y >= exit.y - eps && y <= exit.y + exit.h + eps

    if (!this.clearedReturn) {
      const back = this.exits.filter((exit) => exit.to === this.cameFrom)
      if (back.length === 0 || !back.some(within)) this.clearedReturn = true
    }

    let inside: ExitDef | null = null
    for (const exit of this.exits) {
      if (!meets(state, exit.when)) continue
      if (!within(exit)) continue
      if (!meets(state, needsFor(exit, this.chapter))) continue
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

    /**
     * A door pulls you in while you are WALKING, and lets go when you stop.
     *
     * Standing still inside a doorway used to count, and that is the difference between
     * a door and a drain: stop beside the kiosk to read who is in front of you and, nine
     * hundred milliseconds later, you are inside the kiosk with the clock still running.
     *
     * The dwell therefore counts WALKING time inside the zone, and stopping PAUSES it
     * rather than clearing it. Both halves matter, and each was a separate bug on the
     * way here: clearing it on every pause meant one unbroken hold was required, so a
     * player who taps a direction rather than leaning on it could never leave the
     * bedroom; counting while stationary meant a player who stopped to read got pulled
     * through the nearest door. Leaving the zone still clears it, which is what makes
     * "walk past a shop" and "walk into a shop" different actions.
     */
    const input = this.ctx.input
    if (Math.abs(input.x) + Math.abs(input.y) < 0.08) return

    this.dwell += delta
    if (this.dwell >= (inside.dwellMs ?? 320)) this.travel(inside.to, inside.spawn)
  }

  /** where the tunnel walk is taking him, while it plays */
  private tunnelTo: { to: LocationId; spawn: string } | null = null

  private travel(to: LocationId, spawn: string) {
    if (this.paused) return
    /**
     * לצאת באמצע — the curfew, made with the legs and not with a menu (§41).
     *
     * There is no dialogue here and no confirmation. Half past nine has arrived, the
     * door is where it always was, and walking through it IS the answer: the director is
     * told the boy left, the rest of the night happens without him, and the street
     * outside plays what a concrete wall lets through.
     */
    if (this.derby && this.def.id === 'ussishkin-hall' && !this.ctx.engine.state.flags['derby:over']) {
      this.derby.leaveEarly()
      this.derby = null
      this.timeScale = 1
      this.ctx.bus.emit('match', null)
    }
    // 1986, the first time under the stand: the corridor is walked in first person
    // (`TunnelWalk`), and the tunnel room itself is skipped — the walk IS the tunnel.
    if (to === 'bloomfield-tunnel' && this.chapter === '1986' && !this.ctx.engine.state.flags['saw:tunnelWalk']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'saw:tunnelWalk' })
      this.paused = true
      this.tunnelTo = { to: 'bloomfield-inside', spawn: 'start' }
      this.ctx.bus.emit('prompt', null)
      this.ctx.bus.emit('controls', { visible: false })
      this.ctx.bus.emit('sound', { kind: 'door' })
      this.ctx.bus.emit('tunnel', { ...this.tunnelTo, variant: 'bloomfield' })
      return
    }

    /**
     * 11.3.1991 — הכניסה לאוסישקין, ובגוף ראשון (§34).
     *
     * The brief asks for the opposite of the Bloomfield reveal in every particular: not a
     * wide shot of a bowl but a narrow door, a squeeze, a wall of backs and a sound that
     * arrives before the picture. That is the same corridor renderer with a shorter map,
     * slower people and a warmer light at the end — so the boy spends fifteen seconds
     * stuck behind somebody's shoulders, and the hall opens on him rather than under him.
     * Once, on the way in, on the night of the derby.
     */
    if (
      to === 'ussishkin-hall' &&
      this.chapter === '1991' &&
      this.def.id === 'ussishkin-outside' &&
      !this.ctx.engine.state.flags['saw:ussTunnel']
    ) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'saw:ussTunnel' })
      this.paused = true
      this.tunnelTo = { to: 'ussishkin-hall', spawn }
      this.ctx.bus.emit('prompt', null)
      this.ctx.bus.emit('controls', { visible: false })
      this.ctx.bus.emit('sound', { kind: 'door' })
      this.ctx.bus.emit('tunnel', { ...this.tunnelTo, variant: 'ussishkin' })
      return
    }
    this.paused = true
    this.ctx.bus.emit('prompt', null)
    if (to === 'street' && !this.ctx.engine.state.flags['onboard:street']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'onboard:street' })
      this.ctx.bus.emit('teach', null)
    }
    this.ctx.bus.emit('sound', { kind: 'door' })
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

  // -------------------------------------------------------------- the camera ------

  /**
   * הבמאי — one controller, every conversation in the game.
   *
   * The content says who the camera is on and how close (`ConversationShot`); this
   * executes it and, crucially, puts the camera back. Writing this per conversation
   * would mean eleven implementations of "return to the world camera", and the tenth one
   * would be the one that forgets.
   *
   * It is restrained on purpose. A push-in of a few per cent and a slow pan onto a face
   * reads as attention; a hard cut to a close-up in a game with no facial animation reads
   * as a bug. On a phone the picture is already framed to a band, so the zoom is scaled
   * down again — a big push on a small viewport just loses the speaker off the edge.
   */
  private frameShot(shot: ConversationShot | null) {
    const cam = this.cameras.main
    if (!shot) {
      if (!this.shotting) return
      this.shotting = false
      cam.stopFollow()
      this.tweens.add({ targets: cam, zoom: this.baseZoom, duration: 420, ease: 'Sine.easeInOut' })
      cam.startFollow(this.player, true, 0.09, 0.09)
      this.followPlayer()
      return
    }

    const subject =
      shot.focus === 'player'
        ? this.player
        : (this.actors.find((actor) => actor.def.id === shot.focus || actor.def.nameHe === shot.focus)
            ?.image ?? null)

    const push = { close: 1.16, ots: 1.1, medium: 1.05, wide: 0.96 }[shot.framing]
    const narrow = cam.width < 520 ? 0.55 : 1
    this.shotting = true
    cam.stopFollow()

    const targetX = subject ? (subject.x + this.player.x) / 2 : this.player.x
    const targetY = subject ? (subject.y + this.player.y) / 2 - this.H * 0.06 : this.player.y

    this.tweens.add({
      targets: cam,
      zoom: this.baseZoom * (1 + (push - 1) * narrow),
      duration: shot.duration ?? 520,
      ease: 'Sine.easeInOut',
    })
    cam.pan(targetX, targetY, shot.duration ?? 520, 'Sine.easeInOut')
  }

  // ------------------------------------------------------------------- the wow ----

  private playArrival() {
    const arrival = arrivalFor(this.def, this.chapter)
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
            /**
             * רק בפנים. An arrival card used to exist for one room — the terrace — and
             * everything below was written as if that were the only place a card could
             * play. Then the street outside the ground and the Ussishkin hall got cards
             * of their own, and every one of them raised `went:alone`, opened the 1986
             * anchor card and started the match. Walking up to the OUTSIDE of Bloomfield
             * is not arriving at the final. The card is direction; these are consequences,
             * and they belong to the one room whose consequences they are.
             */
            // 11.3.1991: the card is `ussLow`, the floor at a child's height, and what
            // follows it is a hall that is already full and a night that has a clock in it.
            if (this.chapter === '1991') {
              this.beginNight()
              return
            }
            if (this.def.id !== 'bloomfield-inside') return
            // 1986, the first time: before the day goes on, the boy is allowed to LOOK.
            // The panorama is his eyes at the mouth of the tunnel; the consequences of
            // arriving wait until he has turned round in it.
            const look = PANO_SPOTS['panoReveal']
            if (this.chapter === '1986' && look && !this.ctx.engine.state.flags['saw:panoReveal']) {
              this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'saw:panoReveal' })
              this.openPano('panoReveal', look.titleHe, look.spots, () => this.arrivedInside(), look.startYaw ?? 0)
              return
            }
            this.arrivedInside()
          },
        })
      },
    })
  }

  /** the consequences of being inside the ground — after the card, after the look */
  private arrivedInside() {
    this.time.delayedCall(2200, () => this.ctx.bus.emit('anchor', { anchor: this.anchor, showing: true }))
    // הגעת לבד — the single fact Stage A is really about, recorded once, at the only
    // moment it is unambiguously true: the child is inside the ground and his father
    // did not bring him.
    if (!this.ctx.engine.state.flags['went:alone']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'went:alone' })
    }
    if (this.ctx.engine.state.flags['match:over']) {
      this.matchPhase = 'over'
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'arrived:late' })
      this.refresh()
    } else {
      this.beginMatch()
    }
  }

  /**
   * The final starts when the child is INSIDE, not when a transition finishes playing.
   *
   * `watchMatch` used to be called from one place: the completion of the reveal card. A
   * player who had already seen that card — a second run, a save reloaded inside the
   * ground, the QA tour — walked into Bloomfield and stood in a stadium where no match
   * ever kicked off. It did not show while the match was a time-lapse the clock drove by
   * itself; the moment the ninety minutes became a scene, it became the whole chapter
   * silently not happening.
   *
   * So the condition is a fact about the world — this is the ground, the match is not
   * over, and nothing is already running — and both entry paths ask it.
   */
  private beginMatch() {
    if (this.def.id !== 'bloomfield-inside') return
    if (this.matchPhase !== 'none') return
    if (this.ctx.engine.state.flags['match:over']) {
      this.matchPhase = 'over'
      // Walking in after the whistle, in 1990, is its own ending ("אחרי השריקה"): the
      // fact is recorded the moment he is inside, so the walk home can read it.
      if (this.chapter === '1990' && !this.ctx.engine.state.flags['saw:goal'] && !this.ctx.engine.state.flags['entry:late']) {
        this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'entry:late' })
      }
      this.pushMatch()
      return
    }
    if (this.chapter === '1990') {
      this.matchPhase = 'watching'
      // The director owns time now: the day clock stops, so the old full-time trigger
      // cannot end a match that is being played minute by minute in real seconds.
      this.timeScale = 0
      this.net = new TransistorNet(this, this.ctx, this.anchor, {
        onBoard: (board) => this.ctx.bus.emit('match', board),
        onOver: () => this.endNet(),
        onDrop: (dropped) => {
          this.ctx.engine.dispatch(dropped ? { t: 'flag.raised', flag: 'radio:dropped' } : { t: 'flag.set', flag: 'radio:dropped', value: false })
          this.refresh()
        },
        radioAt: () => {
          const kobi = this.actors.find((entry) => entry.def.id === 'net-kobi')
          return kobi ? { x: kobi.image.x / this.W, y: kobi.image.y / this.H } : null
        },
      })
      this.net.start(this.ctx.engine.state.minute, KICKOFF)
      return
    }
    // The archive first, and the simulation as its fallback — see `playCutscene`.
    const film = this.era.cutscene ? cutsceneFor(this.era.cutscene) : null
    if (film && !this.ctx.engine.state.flags[film.completionFlag]) {
      this.playCutscene(film)
      return
    }
    this.watchMatch()
  }

  /**
   * הזיכרון נפתח אל מה שבאמת קרה — the film, and everything the game stops doing for it.
   *
   * Up to here the chapter has been a child's afternoon reconstructed from an archive of
   * rows. This is the archive itself: the broadcast summary of 24.5.1986, played inside
   * the game because an eight-year-old on that terrace did not watch a clip of the
   * eighty-sixth minute — he watched an afternoon, and so does the player.
   *
   * Everything stops. Not paused-with-a-card-over-it, which is what `doc` and the profile
   * do: the clock stops, the schedule stops, the thumb pad goes, the prompt goes, no
   * dialogue can start, and the world does not tick. For these minutes the player is not
   * IN 1986 as a child; they are watching what a child watched, and the game has nothing
   * to say over it.
   *
   * The shell owns the screen from here and reports back through `endCutscene`.
   */
  private playCutscene(film: HistoricalCutscene) {
    this.matchPhase = 'archive'
    this.cutscene = film
    this.paused = true
    this.timeScale = 0
    this.ctx.bus.emit('controls', { visible: false })
    this.ctx.bus.emit('prompt', null)
    this.ctx.bus.emit('toast', null)
    this.ctx.bus.emit('cutscene', { scene: film, card: cutsceneCard(film, this.anchor) })
  }

  /**
   * הסרט נגמר — and the chapter continues, whichever of the three ways it ended.
   *
   * The completion flag is raised in ALL of them, because the flag records that this
   * cutscene is behind the player and not that they enjoyed it; a player who skipped is
   * not shown the same film again on the next visit. Only `watched` raises the second
   * flag, and the only thing that turns on is which memory the Red Box keeps.
   *
   * The fallback for `unavailable` is the best one this game will ever have, and it is
   * not a card apologising: it is the ninety minutes the engine was already able to play
   * by itself, scoreboard, held breath, eighty-sixth minute and all. YouTube being down
   * costs the player the footage and nothing else. A player who chose `דלג`, on the other
   * hand, has said they do not want to sit through the match — dropping them into a
   * simulated one would be answering "skip" with "here is a longer version".
   */
  endCutscene(outcome: CutsceneOutcome) {
    const film = this.cutscene
    if (this.matchPhase !== 'archive' || !film) return
    this.cutscene = null
    this.ctx.bus.emit('cutscene', null)
    this.matchPhase = 'none'
    this.paused = false
    this.timeScale = 1
    this.ctx.engine.dispatch({ t: 'flag.raised', flag: film.completionFlag })

    if (outcome === 'unavailable') {
      this.ctx.bus.emit('toast', { text: film.fallbackHe, tone: 'plain' })
      this.watchMatch()
      return
    }
    if (outcome === 'watched') {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: film.watchedFlag })
    }
    this.returnFromArchive()
  }

  /**
   * חזרה אל היציע — out of the film and into the celebration, at full time.
   *
   * The dramatic principle Maor set for this ending is that the historical climax and the
   * emotional one must stay apart: the goal is something the player WATCHES, and finding
   * his father is something the player has to do. So this method does the first half
   * completely and the second half not at all. It jumps the clock, records the goal, sets
   * paper falling and hands the controls back — and then the chapter's objective is one
   * line, `למצוא את אבא`, and Kobi is somewhere on a terrace of eight thousand people.
   * Nothing teleports anybody.
   *
   * The clock jump is an EVENT, not an assignment. `clock.advanced` goes in the log like
   * every other minute of this afternoon, so a save written here folds back to a life in
   * which the match happened, rather than to one that skipped an hour (rule 45).
   *
   * The goal's own events are the same three the simulated path dispatches, deliberately:
   * a player who watched the film and a player who watched the simulation must end the
   * chapter holding the same object in the same box, or the Red Box is a record of which
   * code path ran.
   */
  private returnFromArchive() {
    const state = this.ctx.engine.state
    if (state.minute < FULL_TIME) {
      this.ctx.engine.dispatch({ t: 'clock.advanced', minutes: FULL_TIME - state.minute })
    }
    this.goalMinute = decidingMinute(this.anchor)
    this.matchPhase = 'celebrating'
    if (!state.flags['saw:goal']) {
      this.ctx.engine.dispatch(
        { t: 'flag.raised', flag: 'saw:goal' },
        { t: 'redheart.changed', key: 'footballLove', delta: 14 },
        { t: 'redheart.changed', key: 'community', delta: 10 },
        {
          t: 'memory.kept',
          memory: {
            id: `${this.era.memoryPrefix}-the-goal`,
            item: 'ticket-stub',
            atMinute: this.ctx.engine.state.minute,
            year: this.ctx.engine.state.year,
            anchorId: this.anchor.id,
          },
        },
      )
    }
    this.startCarnival()
    this.cameras.main.flash(700, 255, 252, 246)
    this.endMatch(false)
    const goal = this.anchor.match?.decidedBy ?? null
    if (goal) {
      this.ctx.bus.emit('toast', { text: `${goal.scorerHe}. דקה ${goal.minute}.`, tone: 'red' })
    }
    // …and then the only thing left in Stage A that is his to do.
    this.time.delayedCall(2600, () => {
      if (this.ctx.engine.state.flags['found:kobi']) return
      this.ctx.bus.emit('toast', { text: 'הוא איפשהו כאן. תמצא אותו.', tone: 'plain' })
    })
  }

  /**
   * תשעים דקות — the final, and the only scene in this game that takes the controls away.
   *
   * Everything before this point in the chapter is a child deciding things. This is the
   * one stretch where he decides nothing, because that is what being eight in a crowd at
   * a title decider actually is: you are carried. So the match runs itself, and the whole
   * design problem is PACING — eighty minutes of nothing, six minutes of held breath, and
   * one minute that the entire chapter has been walking towards.
   *
   * `matchPace` in `lib/life/match.ts` owns the four numbers that do that, and this
   * method owns none of them. It asks what minute it is, sets the speed it is told, and
   * watches for one number: the minute the archive says the goal went in. Not a constant
   * — the eighty-sixth minute is a sourced row in `content/manual/match-events.json`, and
   * if that row ever changed the scene would hold its breath somewhere else without a
   * line here changing.
   */
  private watchMatch() {
    this.matchPhase = 'watching'
    this.goalMinute = decidingMinute(this.anchor)
    this.timeScale = 26
    this.ctx.bus.emit('toast', { text: 'המשחק מתחיל.', tone: 'red' })
    this.ctx.bus.emit('sound', { kind: 'whistle', blasts: 1 })
    this.pushMatch()

    const check = this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        if (this.matchPhase !== 'watching') return
        const clock = matchClock(this.ctx.engine.state.minute, KICKOFF)
        this.timeScale = this.goalMinute === null ? 26 : matchPace(clock.minute, this.goalMinute)
        this.pushMatch()

        // …the six minutes before it. One line, once, and then nothing until the ball.
        if (this.goalMinute !== null && clock.minute >= this.goalMinute - 5 && !this.saidTense) {
          this.saidTense = true
          this.ctx.bus.emit('toast', { text: 'היציע כבר לא שר. כולם רק מסתכלים.', tone: 'plain' })
        }

        if (this.goalMinute !== null && clock.minute >= this.goalMinute) {
          check.remove()
          this.scoreGoal()
          return
        }
        if (this.ctx.engine.state.minute >= FULL_TIME) {
          check.remove()
          this.endMatch()
        }
      },
    })
  }

  /**
   * דקה 86 — a chip, a lob, and a stadium.
   *
   * The one moment in the chapter that is authored frame by frame rather than simulated,
   * because it is the one moment every person who was there can still describe. The clock
   * stops. The picture pushes in and everything drains out of it but the pitch. Then a
   * beat of nothing — long enough to be uncomfortable, which is the point — and then the
   * whole thing comes back at once: white, a shake, the terrace, and paper in the air.
   *
   * The names are read off the anchor. `משה סיני` and `גילי לנדאו` are not written in this
   * file and could not be: they are two `personSlug` fields in the archive, resolved by
   * `anchor-server.ts`. A game that may not invent a fact (rule 11) can still stop time
   * for one, and this is what that looks like.
   */
  private scoreGoal() {
    this.matchPhase = 'goal'
    this.timeScale = 0
    this.paused = true
    const goal = this.anchor.match?.decidedBy ?? null
    this.ctx.bus.emit('controls', { visible: false })
    this.ctx.bus.emit('prompt', null)

    const camera = this.cameras.main
    const holdZoom = Math.min(7, this.baseZoom * 1.16)
    this.tweens.add({ targets: camera, zoom: holdZoom, duration: 1400, ease: 'Sine.easeInOut' })
    if (goal?.assistHe) {
      this.ctx.bus.emit('toast', { text: `${goal.assistHe} מרים את הראש.`, tone: 'plain' })
    }

    this.time.delayedCall(1500, () => {
      // the beat of nothing
      this.ctx.bus.emit('toast', null)
    })

    this.time.delayedCall(2600, () => {
      const flash = this.add
        .rectangle(0, 0, camera.width * 3, camera.height * 3, LIFE_PALETTE.sheet, 0.92)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(9800)
      this.tweens.add({ targets: flash, alpha: 0, duration: 900, onComplete: () => flash.destroy() })
      camera.shake(1200, 0.009)
      this.tweens.add({ targets: camera, zoom: this.baseZoom, duration: 1600, ease: 'Back.easeOut' })

      this.ctx.engine.dispatch(
        { t: 'flag.raised', flag: 'saw:goal' },
        { t: 'redheart.changed', key: 'footballLove', delta: 14 },
        { t: 'redheart.changed', key: 'community', delta: 10 },
        {
          t: 'memory.kept',
          memory: {
            id: `${this.era.memoryPrefix}-the-goal`,
            item: 'ticket-stub',
            atMinute: this.ctx.engine.state.minute,
            year: this.ctx.engine.state.year,
            anchorId: this.anchor.id,
          },
        },
      )
      if (goal) {
        this.ctx.bus.emit('toast', { text: `${goal.scorerHe}. דקה ${goal.minute}.`, tone: 'red' })
      }
      this.ctx.bus.emit('sound', { kind: 'roar', big: 1.5 })
      this.matchPhase = 'celebrating'
      this.pushMatch()
      this.startCarnival()
      this.refresh()
    })

    // …and then the last few minutes, which nobody who was there remembers.
    this.time.delayedCall(7200, () => {
      if (this.matchPhase !== 'celebrating') return
      this.paused = false
      this.timeScale = 8
      this.ctx.bus.emit('controls', { visible: true })
      const rest = this.time.addEvent({
        delay: 250,
        loop: true,
        callback: () => {
          this.pushMatch()
          if (this.ctx.engine.state.minute < FULL_TIME) return
          rest.remove()
          this.endMatch()
        },
      })
    })
  }

  /**
   * נייר באוויר — the carnival, which is thirty rectangles and a lot of gravity.
   *
   * Real streamers were in the props delivery and were deliberately not used: a photograph
   * of a paper roll lying on a floor is an object, and what a terrace needs is MOTION —
   * hundreds of strips of red and white coming down through the light for a minute and a
   * half. Thirty tumbling rectangles in the club's own two colours read as that at a
   * fraction of the cost, and they are the only thing in this game drawn as a primitive
   * rather than as art, because they are the only thing that is not a thing.
   */
  private startCarnival() {
    const camera = this.cameras.main
    for (let i = 0; i < 34; i += 1) {
      const red = i % 3 !== 0
      const strip = this.add
        .rectangle(
          Phaser.Math.Between(0, Math.round(camera.width)),
          Phaser.Math.Between(-260, -20),
          Phaser.Math.Between(3, 6),
          Phaser.Math.Between(14, 30),
          red ? LIFE_PALETTE.red : LIFE_PALETTE.sheet,
          0.92,
        )
        .setScrollFactor(0)
        .setDepth(7200)
      this.streamers.push(strip)
      this.tweens.add({
        targets: strip,
        y: camera.height + 60,
        duration: Phaser.Math.Between(3200, 7000),
        delay: Phaser.Math.Between(0, 2600),
        repeat: -1,
        ease: 'Sine.easeIn',
        onRepeat: () => strip.setX(Phaser.Math.Between(0, Math.round(camera.width))),
      })
      this.tweens.add({
        targets: strip,
        angle: Phaser.Math.Between(-220, 220),
        duration: Phaser.Math.Between(1400, 3000),
        repeat: -1,
        yoyo: true,
      })
    }
  }

  /**
   * `showCard` is false on the way back from the archival film, and only there.
   *
   * The anchor card is this game's way of saying "that was real, here is where it is
   * written down". After two minutes of the actual broadcast it would be a footnote to a
   * primary source — so the film gets the last word, and the card is what the simulated
   * path shows instead.
   */
  private endMatch(showCard = true) {
    this.timeScale = 1
    this.paused = false
    this.matchPhase = 'over'
    if (!this.ctx.engine.state.flags['match:over']) {
      this.ctx.engine.dispatch(
        { t: 'flag.raised', flag: 'match:over' },
        { t: 'anchor.attended', anchorId: this.anchor.id },
      )
    }
    this.ctx.bus.emit('controls', { visible: true })
    this.pushMatch()
    this.refresh()
    if (showCard) this.ctx.bus.emit('anchor', { anchor: this.anchor, showing: true })
    this.cameras.main.shake(700, 0.004)
  }

  /** The scoreboard, pushed only when it changes — a strip that rerenders is a strip. */
  private pushMatch() {
    if (this.def.id !== 'bloomfield-inside' || this.matchPhase === 'none') {
      this.ctx.bus.emit('match', null)
      return
    }
    if (this.chapter === '1990') {
      if (this.net) this.net.pushBoard()
      else this.ctx.bus.emit('match', TransistorNet.finalBoard(this.anchor))
      return
    }
    const scored = this.matchPhase === 'goal' || this.matchPhase === 'celebrating' || this.matchPhase === 'over'
    const board = scoreboardAt(this.anchor, scored)
    if (!board) return
    const clock = matchClock(this.ctx.engine.state.minute, KICKOFF)
    // Once it goes in, the board holds the minute it went in — the archive's minute, not
    // whichever tick the loop happened to be on when the check fired. A scoreboard that
    // says 87 for a goal history records at 86 is a small lie in the one place this
    // chapter has spent three passes earning the right not to tell one.
    const scoredLabel = this.goalMinute !== null ? `${this.goalMinute}'` : clock.labelHe
    const label =
      this.matchPhase === 'over'
        ? 'סיום'
        : this.matchPhase === 'goal' || this.matchPhase === 'celebrating'
          ? scoredLabel
          : clock.labelHe
    const signature = `${label}|${board.homeScore}|${board.awayScore}`
    if (signature === this.lastMatchLabel) return
    this.lastMatchLabel = signature
    this.ctx.bus.emit('match', { ...board, labelHe: label, scored, over: this.matchPhase === 'over' })
  }

  private finishChapter(endingId: string) {
    const state = this.ctx.engine.state
    const key = state.flags['arrived:late'] && endingId === 'home' ? 'late' : endingId

    /**
     * 24.5.1986 is not optional any more (Stage A brief §14).
     *
     * A 1986 Saturday that ends without the boy ever getting inside used to close the
     * chapter and hand the player 1990 — a life in which the day this whole game is built
     * on simply did not happen to him. It now gives the morning back instead: the failure
     * is told in the shape it had, the joke is played once, and the log is cut to the
     * start of the chapter, keeping the life before it. Nothing is completed and nothing
     * is written to the Red Box, because nothing happened.
     *
     * Only 1986, and only `missed`. 1990's "you heard it from the street" and 1991's "you
     * were not at the derby" are endings the briefs ask for by name — history happening
     * without you is that game's whole thesis. It is this ONE day that is the spine.
     */
    if (this.chapter === '1986' && key === 'missed') {
      this.paused = true
      this.ctx.bus.emit('controls', { visible: false })
      this.ctx.bus.emit('prompt', null)
      this.ctx.bus.emit('retry', retryFor(state, this.def.id))
      return
    }

    const card = this.era.endings[key] ?? this.era.endings['missed']
    if (!card) return
    this.ctx.engine.dispatch(
      {
        t: 'memory.kept',
        // Same prefix as the goal memory above, and the year the chapter is actually set
        // in. This is FORWARD-ONLY and deliberately not migrated: the prefix is part of a
        // PERSISTED id, and a readable save (version 2 or 3) written before this fix can
        // hold `1980-home`. Memories are idempotent on id, so such a save keeps its old
        // row and a replay adds the correctly-named one beside it — one duplicated ending
        // memory in a save that has already finished the chapter. Rewriting an id inside
        // somebody's log to tidy that up would be editing a record of what happened,
        // which is the one thing an append-only save may never do (rule 45, rule 35).
        memory: {
          id: `${this.era.memoryPrefix}-${card.id}`,
          item: card.memoryItem,
          atMinute: state.minute,
          year: state.year,
          anchorId: this.anchor.id,
        },
      },
      { t: 'flag.raised', flag: 'memory:first' },
      state.flags['match:started'] && state.flags['entry:granted']
        ? { t: 'anchor.attended', anchorId: this.anchor.id }
        : { t: 'anchor.missed', anchorId: this.anchor.id },
      // The chapter's own year, and it is not cosmetic: `chapter.entered` and this event
      // are the only things that set `state.chapter`, and `lib/life/redbox.ts` stamps
      // every kept object `sourceEventId: chapter:${state.chapter}`. While this said the
      // pre-rebase year, every object in a 1986 player's Red Box was filed under a
      // chapter that does not exist.
      { t: 'chapter.completed', chapter: this.chapter },
    )
    void this.ctx.engine.save()
    this.paused = true
    this.ctx.bus.emit('ending', {
      titleHe: card.titleHe,
      bodyHe: card.bodyHe,
      memoryHe: card.memoryHe,
      chapter: this.chapter,
      ...(card.after ? { after: card.after } : {}),
    })
  }

  /**
   * A card is open over the world, so the world stops — and the clock with it.
   *
   * Reading your own profile may not cost you the afternoon. That is not generosity: a
   * screen that charges the player for looking at it is a screen they stop opening, and
   * a life simulation whose life screen is a trap has built the wrong thing.
   */
  // ------------------------------------------------------------------- the map ----

  /** a room crossed on foot costs about this much of the afternoon */
  private static readonly MINUTES_PER_ROOM = 4

  /**
   * המפה — every room the doors lead to from here, by the shortest way through them.
   *
   * Breadth-first over the scene graph, through doors that EXIST right now (`when`) —
   * a door that `needs` something the child does not have is still on the map, and the
   * place behind it is listed with that door's name as the reason it is shut, because
   * "the ground is there, you need a ticket" is information and a missing entry is not.
   * Nothing is teleported: choosing a place charges the walk's minutes and plays the same
   * fade every door plays. The rule "going somewhere IS the choice" survives, it just
   * stops charging the player's thumb for the corridor between two decisions.
   */
  places(): MapPlace[] {
    const state = this.ctx.engine.state
    const known = new Set(ALL_SCENES.map((scene) => scene.id))
    type Step = { id: LocationId; hops: number; lockedHe: string | null; spawn: string }
    const seen = new Map<LocationId, Step>()
    const queue: Step[] = [{ id: this.def.id, hops: 0, lockedHe: null, spawn: this.spawnName }]
    seen.set(this.def.id, queue[0]!)
    while (queue.length) {
      const here = queue.shift()!
      const scene = sceneFor(here.id)
      for (const exit of scene.exits) {
        if (!exitInEra(exit, this.chapter)) continue
        if (!known.has(exit.to) || !meets(state, exit.when)) continue
        if (seen.has(exit.to)) continue
        const lockedHe = here.lockedHe ?? (meets(state, needsFor(exit, this.chapter)) ? null : exit.labelHe)
        const step: Step = { id: exit.to, hops: here.hops + 1, lockedHe, spawn: exit.spawn }
        seen.set(exit.to, step)
        queue.push(step)
      }
    }
    return [...seen.values()].map((step) => ({
      id: step.id,
      titleHe: sceneFor(step.id).titleHe,
      here: step.id === this.def.id,
      minutes: step.hops * WorldScene.MINUTES_PER_ROOM,
      lockedHe: step.lockedHe,
    }))
  }

  goTo(id: string): boolean {
    const place = this.places().find((entry) => entry.id === id)
    if (!place || place.here || place.lockedHe) return false
    // Re-walk the graph for the spawn the last door lands on — the list above does not
    // carry it, because the shell has no business knowing spawn names.
    const state = this.ctx.engine.state
    const prev = new Map<LocationId, { from: LocationId; spawn: string }>()
    const queue: LocationId[] = [this.def.id]
    const seen = new Set<LocationId>([this.def.id])
    while (queue.length) {
      const here = queue.shift()!
      for (const exit of sceneFor(here).exits) {
        if (!exitInEra(exit, this.chapter)) continue
        if (seen.has(exit.to) || !meets(state, exit.when)) continue
        seen.add(exit.to)
        prev.set(exit.to, { from: here, spawn: exit.spawn })
        queue.push(exit.to)
      }
    }
    const last = prev.get(id as LocationId)
    if (!last) return false
    this.paused = false
    this.ctx.engine.dispatch({ t: 'clock.advanced', minutes: place.minutes })
    this.travel(id as LocationId, last.spawn)
    return true
  }

  setPaused(on: boolean) {
    this.paused = on
    if (on) {
      this.vx = 0
      this.vy = 0
      this.ctx.bus.emit('prompt', null)
    } else {
      this.idleFor = 0
    }
  }

  // ------------------------------------------------------------------- the look ---

  /** what to do when the player closes the panorama */
  private afterPano: (() => void) | null = null

  /**
   * מבט — hand the glass to the boy's eyes. The world pauses; the shell draws the
   * panorama; the marks in it start conversations through `talk`; `closePano` gives
   * the world back and runs whatever was waiting (the anchor card, the kickoff).
   */
  openPano(key: string, titleHe: string, hotspots: PanoSpot[], after?: () => void, startYaw = 0) {
    this.paused = true
    this.afterPano = after ?? null
    this.ctx.bus.emit('prompt', null)
    this.ctx.bus.emit('controls', { visible: false })
    this.ctx.bus.emit('pano', { key, titleHe, startYaw, hotspots })
  }

  /** out of the corridor and into the light: the terrace, with its card and its look */
  finishTunnel() {
    const target = this.tunnelTo
    this.tunnelTo = null
    this.ctx.bus.emit('tunnel', null)
    if (!target) {
      this.paused = false
      return
    }
    // Out of a corridor and into whatever it opened onto: a sky over Jaffa, or the lamps
    // under a tin roof. The flash is the light of the room the boy just walked into.
    const hall = target.to === 'ussishkin-hall'
    this.cameras.main.fadeOut(200, hall ? 226 : 237, hall ? 196 : 230, hall ? 168 : 216)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      void this.ctx.engine.save()
      this.scene.restart({
        mapId: target.to,
        spawn: target.spawn,
        from: hall ? 'ussishkin-outside' : 'bloomfield-tunnel',
      })
    })
  }

  closePano() {
    this.ctx.bus.emit('pano', null)
    this.ctx.bus.emit('controls', { visible: true })
    this.paused = false
    const after = this.afterPano
    this.afterPano = null
    after?.()
  }

  /** a conversation by id, from anywhere the shell can point — the panorama's marks */
  talk(id: string) {
    if (id.startsWith('net:') && this.net) {
      this.net.talk(id)
      return
    }
    this.ctx.dialogue.start(id)
  }

  /** Developer-only: where the child is, as the doors see him — for the probes. */
  where() {
    const state = this.ctx.engine.state
    return {
      scene: this.def.id,
      x: Number((this.player.x / this.W).toFixed(3)),
      y: Number((this.groundY / this.H).toFixed(3)),
      paused: this.paused,
      exits: this.exits.map((exit) => `${exit.id}${meets(state, exit.when) ? '' : '(shut)'}`),
      // 11.3.1991: how far into the night the hall is, for the derby probe
      derby: this.derby?.debugState() ?? null,
    }
  }

  /** Developer-only: put the child somewhere, with no door in between. */
  debugTravel(location: string) {
    this.paused = false
    this.travel(location as LocationId, 'start')
  }

  /**
   * Closing the ending card does not go home any more. It opens the end of the STAGE.
   *
   * Two screens, in this order, because they answer different questions. `EndingCard`
   * closes a Saturday: what happened when you walked back through your own front door.
   * `StageFinale` closes a chapter of a life: what happened in the world, whether you
   * were there for it, what it made of you, and where the next one starts.
   *
   * Collapsing them into one card was tried and it does not work — the private ending and
   * the public celebration undercut each other, and the player ends up reading a
   * scoreline over a sentence about their father's hand.
   */
  goHome() {
    this.ctx.bus.emit('ending', null)
    const card = buildFinale(this.ctx.engine.state, this.ctx.engine.log(), this.chapter)
    this.ctx.bus.emit('finale', {
      anchor: this.anchor,
      titleHe: card.titleHe,
      bodyHe: card.bodyHe,
      becameHe: card.becameHe,
      keptTicket: card.keptTicket,
    })
  }

  /** …and the finale's own button is what actually goes home. */
  /**
   * …and the finale's own button is what actually goes on. In 1986 that is the passage —
   * four years, played (`PassageScene`) — which is the bug the roadmap named: this used to
   * `travel('bedroom')` and put the player back in the Saturday he had just finished. In
   * 1990 the day ends in the bedroom the next morning, and the school line plays there.
   */
  dismissFinale() {
    this.paused = false
    this.ctx.bus.emit('finale', null)
    this.ctx.bus.emit('match', null)
    if (this.chapter === '1986') {
      this.cameras.main.fadeOut(600, 0, 0, 0)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        void this.ctx.engine.save()
        this.scene.start(PassageScene.KEY)
      })
      return
    }
    // 1991 ends where it started, the next morning, in the same classroom (§46).
    if (this.chapter === '1991') {
      this.travel('classroom', 'start')
      return
    }
    this.travel('bedroom', 'start')
  }
}
