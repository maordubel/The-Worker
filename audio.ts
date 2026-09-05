/**
 * הקול — the game's sound. Synthesised files, and since 5.9.2026 two real recordings.
 *
 * Every sound here is made from noise and sine waves in the browser at the moment it is
 * needed: a room tone, a street, a terrace that breathes; the boy's footsteps; a page
 * turning; a stamp landing; a whistle; six thousand people finding out. Nothing is
 * downloaded and nothing is licensed, which for a game about a club whose songs are
 * still sung is the only honest position until the songs are cleared (rule: no invented
 * media). What a synthesised crowd can do is carry the SHAPE of the day — the swell before
 * a goal, the drop after a whistle, the hush of a kitchen — and shape is most of what
 * audio does for a game.
 *
 * Three rules, from the audio brief:
 * · **Categories, not tracks.** Ambient (looping, low), SFX (one-shot), UI (immediate),
 *   and the music slot left EMPTY on purpose. Ambient ducks under dialogue.
 * · **Never the same sound twice.** Every one-shot is re-synthesised with a little
 *   jitter in pitch and length, so a hundred footsteps are a hundred footsteps.
 * · **Silence is a level.** Muted is remembered per browser (`the-worker:life:sound`),
 *   the menu says so in one word, and the engine does not exist until a finger has
 *   touched the glass — autoplay policy, and manners.
 */

export type AmbienceKey = 'interior' | 'kitchen' | 'day' | 'park' | 'dusk' | 'tunnel' | 'stadium' | 'hall' | 'station' | 'base' | 'classroom' | 'none'

/**
 * הקהל — 5.9.2026: the crowd is a STATE, not a loop.
 *
 * Seven states the match director moves through. Each one is a level and a colour on
 * the real murmur (the owner's recording, cut in `ingest-audio-2026-09-05.py`) plus at
 * most one cut fired on entry. Moving between states is a crossfade on one gain node —
 * there is never a second loop, on pause, on resume, on a tab that went dark and came
 * back. `OFF` empties the ground.
 */
export type CrowdState = 'OFF' | 'LOW_MURMUR' | 'BUILDING_TENSION' | 'CHANT' | 'NEAR_MISS' | 'GOAL_BURST' | 'AFTERMATH' | 'FINAL_WHISTLE'

export const CROWD_STATES: readonly CrowdState[] = ['LOW_MURMUR', 'BUILDING_TENSION', 'CHANT', 'NEAR_MISS', 'GOAL_BURST', 'AFTERMATH', 'FINAL_WHISTLE']

/**
 * הספרייה — 5.9.2026: the sounds are FILES now, still synthesised, never recorded.
 *
 * `scripts/life/make-sfx.py` renders sixty-odd sounds offline — forty-voice crowds, a
 * darbuka with a skin, a buzzer with the right harmonics, a bus that idles — into
 * `public/life/sfx` as Vorbis and AAC. This class plays them through the same three
 * buses, with the same jitter so no two plays match, and falls back to the in-browser
 * synth below for any file that has not arrived yet. The synth is the understudy, not
 * the act.
 */
export type SampleKey =
  | 'crowd-goal' | 'crowd-swell' | 'crowd-groan' | 'crowd-hush' | 'crowd-claps'
  | 'whistle-1' | 'whistle-2' | 'whistle-3' | 'buzzer' | 'ball-bounce' | 'ball-kick'
  | 'darbuka-dum' | 'darbuka-tek' | 'darbuka-ka' | 'darbuka-three-two'
  | 'door' | 'page' | 'stamp' | 'tick' | 'coins' | 'bell-shop' | 'bell-school' | 'radio-tune'
  | 'bus-door' | 'car-pass' | 'car-door'
  | 'year-turn' | 'finale-hit' | 'stage-sting' | 'reveal' | 'gauge-up' | 'gauge-down' | 'heart'
  | 'ui-open' | 'ui-close' | 'ui-click' | 'choice' | 'ending' | 'box-item'
  // real recordings (5.9.2026)
  | 'crowd-real-goal' | 'crowd-real-murmur' | 'crowd-real-build' | 'crowd-real-miss' | 'crowd-real-after' | 'crowd-real-final'
  | 'amb-park' | 'park-wave'

const AMBIENCE_FILE: Record<AmbienceKey, string | null> = {
  interior: 'amb-room',
  kitchen: 'amb-kitchen',
  day: 'amb-park',
  park: 'amb-park',
  dusk: 'amb-street-dusk',
  tunnel: 'amb-tunnel',
  stadium: 'amb-stadium',
  hall: 'amb-hall',
  station: 'amb-station',
  base: 'amb-base',
  classroom: 'amb-classroom',
  none: null,
}

const STORE = 'the-worker:life:sound'

/** per state: the loop's level, its lowpass colour, the cut fired on entry and its level */
export const CROWD_PLAN: Record<Exclude<CrowdState, 'OFF'>, { level: number; colour: number; cut?: SampleKey; cutLevel?: number }> = {
  LOW_MURMUR: { level: 0.42, colour: 1600 },
  BUILDING_TENSION: { level: 0.6, colour: 3200, cut: 'crowd-real-build', cutLevel: 0.55 },
  CHANT: { level: 0.55, colour: 2600 },
  NEAR_MISS: { level: 0.5, colour: 3600, cut: 'crowd-real-miss', cutLevel: 0.85 },
  GOAL_BURST: { level: 0.85, colour: 5200, cut: 'crowd-real-goal', cutLevel: 1.0 },
  AFTERMATH: { level: 0.34, colour: 1200, cut: 'crowd-real-after', cutLevel: 0.55 },
  FINAL_WHISTLE: { level: 0.0, colour: 2200, cut: 'crowd-real-final', cutLevel: 0.9 },
}

type Layer = { gain: GainNode; stop: (when: number) => void; tag?: string }

function jitter(v: number, pct: number) {
  return v * (1 + (Math.random() * 2 - 1) * pct)
}

export class LifeAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambient: GainNode | null = null
  private sfx: GainNode | null = null
  private ui: GainNode | null = null
  private layers: Layer[] = []
  private swell: { gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null
  private current: AmbienceKey = 'none'
  private wanted: AmbienceKey = 'none'
  private _muted = false
  private ducked = false
  private noise: AudioBuffer | null = null
  private samples = new Map<string, Promise<AudioBuffer | null>>()
  private ext: 'ogg' | 'm4a' = 'ogg'
  private ambientFile: { source: AudioBufferSourceNode; gain: GainNode } | null = null
  private waveTimer = 0
  // the crowd: one bus, one loop, one state
  private crowdBus: GainNode | null = null
  private crowdLoop: { source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null
  private crowdLoopStarting = false
  private _crowdState: CrowdState = 'OFF'
  private crowdWanted: CrowdState = 'OFF'
  private crowdTimers: number[] = []
  private crowdLog: { state: CrowdState; at: number }[] = []

  constructor() {
    try {
      this._muted = window.localStorage.getItem(STORE) === 'off'
    } catch {
      this._muted = false
    }
  }

  get muted() {
    return this._muted
  }

  /** the engine exists only after a gesture; call from a pointer/key handler */
  wake() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    this.ctx = new Ctor()
    this.master = this.ctx.createGain()
    this.master.gain.value = this._muted ? 0 : 1
    this.master.connect(this.ctx.destination)
    this.ambient = this.ctx.createGain()
    this.ambient.gain.value = 0.55
    this.ambient.connect(this.master)
    this.sfx = this.ctx.createGain()
    this.sfx.gain.value = 0.7
    this.sfx.connect(this.master)
    this.ui = this.ctx.createGain()
    this.ui.gain.value = 0.5
    this.ui.connect(this.master)
    this.crowdBus = this.ctx.createGain()
    this.crowdBus.gain.value = 0.8
    this.crowdBus.connect(this.master)
    this.noise = this.makeNoise()
    // a tab that goes dark freezes the clock; nothing is started twice when it comes back
    try {
      document.addEventListener('visibilitychange', () => {
        const ctx = this.ctx
        if (!ctx) return
        if (document.visibilityState === 'hidden') void ctx.suspend()
        else if (ctx.state === 'suspended') void ctx.resume()
      })
    } catch {
      /* no document */
    }
    // Safari has no Vorbis; everything else prefers it (half the bytes of AAC at this quality)
    try {
      const probe = document.createElement('audio')
      this.ext = probe.canPlayType('audio/ogg; codecs=vorbis') ? 'ogg' : 'm4a'
    } catch {
      this.ext = 'm4a'
    }
    for (const key of ['page', 'tick', 'stamp', 'ui-open', 'ui-close', 'choice', 'gauge-up', 'gauge-down'] as SampleKey[]) void this.sample(key)
    if (this.wanted !== 'none') this.setAmbience(this.wanted, true)
    if (this.crowdWanted !== 'OFF') this.crowd(this.crowdWanted, true)
  }

  // ---------------------------------------------------------------------- crowd ---

  get crowdState(): CrowdState {
    return this._crowdState
  }

  /** every state the crowd has been through since the engine woke, with the audio clock */
  get crowdHistory(): readonly { state: CrowdState; at: number }[] {
    return this.crowdLog
  }

  /**
   * Move the crowd to `state`. Idempotent: the same state twice is nothing; a state that
   * fires a cut fires it once, on entry. All timers belonging to the old state are
   * cancelled so a tension that was still breathing does not fire under a goal.
   */
  crowd(state: CrowdState, force = false) {
    this.crowdWanted = state
    if (!this.ctx || !this.crowdBus) return
    if (!force && state === this._crowdState) return
    const previous = this._crowdState
    this._crowdState = state
    this.crowdLog.push({ state, at: this.ctx.currentTime })
    if (this.crowdLog.length > 64) this.crowdLog.shift()
    for (const timer of this.crowdTimers) window.clearTimeout(timer)
    this.crowdTimers = []
    const ctx = this.ctx
    const t = ctx.currentTime
    if (state === 'OFF') {
      if (this.crowdLoop) {
        const old = this.crowdLoop
        old.gain.gain.setTargetAtTime(0, t, 1.2)
        old.source.stop(t + 5)
        this.crowdLoop = null
      }
      // the synthesised bed comes back up to carry the room alone
      if (this.ambientFile) this.ambientFile.gain.gain.setTargetAtTime(this.current === 'stadium' || this.current === 'hall' ? 0.5 : 0.32, t, 1.5)
      return
    }
    // the ground has a voice now; the synth bed under it steps back
    if (this.ambientFile) this.ambientFile.gain.gain.setTargetAtTime(0.16, t, 1.0)
    this.ensureCrowdLoop()
    if (previous === 'OFF') this.warm(['crowd-real-goal', 'crowd-real-build', 'crowd-real-miss', 'crowd-real-after', 'crowd-real-final', 'crowd-claps', 'darbuka-three-two', 'whistle-3'])
    const p = CROWD_PLAN[state]
    this.shapeCrowd(p.level, p.colour, state === 'GOAL_BURST' || state === 'NEAR_MISS' ? 0.25 : 1.1)
    // the entry cut waits for its bytes if it must (a goal is not a click), but only while the state holds
    if (p.cut) this.playWhenReady(p.cut, p.cutLevel ?? 0.8, () => this._crowdState === state)
    const later = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        // the state moved on, or the tab is dark: the timer belongs to nobody
        if (this._crowdState !== state || ctx.state !== 'running') return
        fn()
      }, ms)
      this.crowdTimers.push(id)
    }
    switch (state) {
      case 'BUILDING_TENSION': {
        // it keeps building: every few seconds another rise, a little higher
        const again = (n: number) => later(4800 + Math.random() * 1800, () => {
          this.play('crowd-real-build', { bus: 'crowd', level: Math.min(0.8, 0.55 + n * 0.08), jitter: 0.05 })
          again(n + 1)
        })
        again(1)
        break
      }
      case 'CHANT': {
        // the terrace claps in time; the darbuka answers every second bar
        const bar = (n: number) => {
          this.play('crowd-claps', { bus: 'crowd', level: 0.7, jitter: 0.03 })
          if (n % 2 === 1) this.play('darbuka-three-two', { bus: 'crowd', level: 0.45, delayMs: 120 })
          later(3900, () => bar(n + 1))
        }
        bar(0)
        break
      }
      case 'NEAR_MISS':
        // the "ohhh" falls back into the murmur on its own
        later(2600, () => this.shapeCrowd(0.46, 2400, 1.4))
        break
      case 'GOAL_BURST':
        // eight seconds up, then the ground settles but stays higher than before
        later(5000, () => this.shapeCrowd(0.55, 2800, 2.5))
        break
      case 'FINAL_WHISTLE':
        // the cut carries the burst; the loop goes to nothing and is dropped
        later(9000, () => this.crowd('OFF'))
        break
      default:
        break
    }
  }

  /** a cut that must be heard: loads first if it has to, plays if `still()` holds when it can */
  private playWhenReady(key: SampleKey, level: number, still: () => boolean) {
    const ctx = this.ctx
    const bus = this.crowdBus
    if (!ctx || !bus) return
    void this.sample(key).then((buffer) => {
      if (!buffer || !still()) return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.playbackRate.value = jitter(1, 0.04)
      const gain = ctx.createGain()
      gain.gain.value = jitter(level, 0.04)
      source.connect(gain).connect(bus)
      source.start(ctx.currentTime)
    })
  }

  private ensureCrowdLoop() {
    if (this.crowdLoop || this.crowdLoopStarting || !this.ctx || !this.crowdBus) return
    const ctx = this.ctx
    const bus = this.crowdBus
    this.crowdLoopStarting = true
    void this.sample('crowd-real-murmur').then((buffer) => {
      this.crowdLoopStarting = false
      if (!buffer || this.crowdLoop || this._crowdState === 'OFF') return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.playbackRate.value = jitter(1, 0.015)
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1600
      filter.Q.value = 0.5
      const gain = ctx.createGain()
      gain.gain.value = 0
      source.connect(filter).connect(gain).connect(bus)
      source.start(ctx.currentTime, Math.random() * Math.max(0.1, buffer.duration - 2))
      this.crowdLoop = { source, gain, filter }
      // the state that asked for the loop sets its level now that it exists (no second cut)
      const p = CROWD_PLAN[this._crowdState as Exclude<CrowdState, 'OFF'>]
      if (p) this.shapeCrowd(p.level, p.colour, 0.8)
    })
  }

  private shapeCrowd(level: number, colour: number, seconds: number) {
    if (!this.ctx || !this.crowdLoop) return
    const t = this.ctx.currentTime
    this.crowdLoop.gain.gain.setTargetAtTime(level, t, seconds)
    this.crowdLoop.filter.frequency.setTargetAtTime(colour, t, seconds)
  }

  // ------------------------------------------------------------------- samples ---

  private sample(key: string): Promise<AudioBuffer | null> {
    const known = this.samples.get(key)
    if (known) return known
    const ctx = this.ctx
    if (!ctx) return Promise.resolve(null)
    const loading = fetch(`/life/sfx/${key}.${this.ext}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((bytes) => ctx.decodeAudioData(bytes))
      .catch(() => null)
    this.samples.set(key, loading)
    return loading
  }

  /**
   * One sound, once. `rate` and `level` are jittered a little so a hundred footsteps are
   * a hundred footsteps; a sample that has not loaded yet plays nothing this time and
   * is ready the next — a game never waits for a click.
   */
  play(key: SampleKey, opts: { level?: number; rate?: number; bus?: 'sfx' | 'ui' | 'ambient' | 'crowd'; jitter?: number; delayMs?: number } = {}): boolean {
    if (!this.ctx) return false
    const bus = opts.bus === 'ui' ? this.ui : opts.bus === 'ambient' ? this.ambient : opts.bus === 'crowd' ? this.crowdBus : this.sfx
    if (!bus) return false
    const cached = this.samples.get(key)
    // not yet decoded: start it loading, and let the caller fall back to the synth
    if (!cached) {
      void this.sample(key)
      return false
    }
    const ctx = this.ctx
    const j = opts.jitter ?? 0.06
    void cached.then((buffer) => {
      if (!buffer) return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.playbackRate.value = jitter(opts.rate ?? 1, j)
      const gain = ctx.createGain()
      gain.gain.value = jitter(opts.level ?? 1, j)
      source.connect(gain).connect(bus)
      source.start(ctx.currentTime + (opts.delayMs ?? 0) / 1000)
    })
    return true
  }

  /** the sounds a chapter is about to need — the darbuka before the kiosk, the buzzer before the hall */
  warm(keys: SampleKey[]) {
    for (const key of keys) void this.sample(key)
  }

  setMuted(on: boolean) {
    this._muted = on
    try {
      window.localStorage.setItem(STORE, on ? 'off' : 'on')
    } catch {
      /* private mode */
    }
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(on ? 0 : 1, this.ctx.currentTime, 0.05)
  }

  /** dialogue open: the room steps back */
  duck(on: boolean) {
    if (this.ducked === on) return
    this.ducked = on
    if (this.ambient && this.ctx) this.ambient.gain.setTargetAtTime(on ? 0.28 : 0.55, this.ctx.currentTime, 0.25)
    // the crowd steps back less than the room: a terrace does not go quiet for a sentence
    if (this.crowdBus && this.ctx) this.crowdBus.gain.setTargetAtTime(on ? 0.5 : 0.8, this.ctx.currentTime, 0.3)
  }

  // ---------------------------------------------------------------- ambience ---

  setAmbience(key: AmbienceKey, force = false) {
    this.wanted = key
    if (!this.ctx || !this.ambient || !this.noise) return
    if (!force && key === this.current) return
    this.current = key
    const t = this.ctx.currentTime
    for (const layer of this.layers) {
      layer.gain.gain.setTargetAtTime(0, t, 0.6)
      layer.stop(t + 2.5)
    }
    this.layers = []
    if (this.swell) {
      this.swell.gain.gain.setTargetAtTime(0, t, 0.6)
      this.swell.lfo.stop(t + 2.5)
      this.swell = null
    }
    if (this.waveTimer) {
      window.clearTimeout(this.waveTimer)
      this.waveTimer = 0
    }
    // leaving the ground empties it; the director sets the state again on the next match
    if (key !== 'stadium' && key !== 'hall' && this._crowdState !== 'OFF') this.crowd('OFF')
    if (this.ambientFile) {
      const old = this.ambientFile
      old.gain.gain.setTargetAtTime(0, t, 0.8)
      old.source.stop(t + 3)
      this.ambientFile = null
    }
    // the rendered bed, when it is there: a real room, a real street, a crowd of forty
    const file = AMBIENCE_FILE[key]
    if (file) {
      const ctx = this.ctx
      const ambient = this.ambient
      void this.sample(file).then((buffer) => {
        if (!buffer || this.current !== key || this.ambientFile) return
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.loop = true
        source.playbackRate.value = jitter(1, 0.02)
        const gain = ctx.createGain()
        gain.gain.value = 0
        source.connect(gain).connect(ambient)
        source.start(ctx.currentTime, Math.random() * Math.max(0.1, buffer.duration - 1))
        const under = this._crowdState !== 'OFF' ? 0.16 : key === 'stadium' || key === 'hall' ? 0.5 : key === 'park' ? 0.4 : 0.32
        gain.gain.setTargetAtTime(under, ctx.currentTime, 1.4)
        this.ambientFile = { source, gain }
        // the synth bed under it steps back to a third: texture, not a second room
        for (const layer of this.layers) layer.gain.gain.setTargetAtTime(layer.gain.gain.value * 0.35, ctx.currentTime, 1.0)
      })
    }
    const add = (type: BiquadFilterType, freq: number, q: number, level: number, rate = 1) => {
      const source = this.ctx!.createBufferSource()
      source.buffer = this.noise
      source.loop = true
      source.playbackRate.value = rate
      const filter = this.ctx!.createBiquadFilter()
      filter.type = type
      filter.frequency.value = freq
      filter.Q.value = q
      const gain = this.ctx!.createGain()
      gain.gain.value = 0
      source.connect(filter).connect(gain).connect(this.ambient!)
      source.start()
      gain.gain.setTargetAtTime(level, t, 1.2)
      this.layers.push({ gain, stop: (when) => source.stop(when) })
      return gain
    }
    switch (key) {
      case 'interior':
        add('lowpass', 240, 0.7, 0.05, 0.5)
        break
      case 'kitchen':
        add('lowpass', 320, 0.7, 0.06, 0.5)
        this.hum(50, 0.012)
        break
      case 'day':
        add('bandpass', 700, 0.5, 0.07, 0.8)
        add('lowpass', 180, 0.7, 0.05, 0.4)
        break
      case 'dusk':
        add('bandpass', 900, 0.6, 0.05, 0.9)
        add('lowpass', 160, 0.7, 0.06, 0.4)
        break
      case 'park': {
        // the recording alone, and now and then the wave that is in it — a loop that is not a loop
        const wave = () => {
          this.waveTimer = window.setTimeout(() => {
            if (this.current !== 'park' || !this.ctx || this.ctx.state !== 'running') return
            this.play('park-wave', { bus: 'ambient', level: 0.35, jitter: 0.1 })
            wave()
          }, 28000 + Math.random() * 30000)
        }
        wave()
        break
      }
      case 'tunnel':
        add('lowpass', 140, 1.2, 0.12, 0.35)
        break
      case 'stadium':
      case 'hall': {
        const body = add('bandpass', key === 'hall' ? 1100 : 800, 0.4, key === 'hall' ? 0.12 : 0.16, 1)
        add('lowpass', 200, 0.8, 0.08, 0.5)
        // the crowd breathes: a slow, uneven swell on the body layer
        const lfo = this.ctx.createOscillator()
        lfo.type = 'sine'
        lfo.frequency.value = 0.09
        const lfoGain = this.ctx.createGain()
        lfoGain.gain.value = 0.05
        lfo.connect(lfoGain).connect(body.gain)
        lfo.start()
        this.swell = { gain: body, lfo, lfoGain }
        break
      }
      case 'station':
        add('lowpass', 200, 0.8, 0.08, 0.5)
        add('bandpass', 600, 0.5, 0.05, 0.9)
        break
      case 'base':
        add('bandpass', 500, 0.5, 0.05, 0.7)
        break
      case 'classroom':
        add('lowpass', 260, 0.7, 0.05, 0.5)
        break
      case 'none':
        break
    }
  }

  private hum(freq: number, level: number) {
    if (!this.ctx || !this.ambient) return
    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const gain = this.ctx.createGain()
    gain.gain.value = 0
    osc.connect(gain).connect(this.ambient)
    osc.start()
    gain.gain.setTargetAtTime(level, this.ctx.currentTime, 1.5)
    this.layers.push({ gain, stop: (when) => osc.stop(when) })
  }

  // ------------------------------------------------------------------- one-shots ---

  /** a footstep: a click of noise, darker on stone, lighter on a terrace */
  step(surface: 'floor' | 'street' | 'terrace' = 'floor') {
    if (this.play(`step-${surface}-${1 + Math.floor(Math.random() * 3)}` as SampleKey, { level: 0.55, jitter: 0.12 })) return
    const p: Record<typeof surface, [number, number, number]> = { floor: [900, 0.05, 0.045], street: [1400, 0.06, 0.05], terrace: [600, 0.07, 0.05] }
    const [freq, seconds, level] = p[surface]
    this.burst(jitter(freq, 0.25), jitter(seconds, 0.3), level, 'bandpass', this.sfx)
  }

  /** a page turned: a soft sweep of noise */
  page() {
    if (this.play('page', { bus: 'ui', level: 0.5 })) return
    this.burst(2400, 0.09, 0.05, 'highpass', this.ui, 0.5)
  }

  /** the prompt found something: a very small tick */
  tick() {
    if (this.play('tick', { bus: 'ui', level: 0.35 })) return
    this.burst(3200, 0.02, 0.025, 'bandpass', this.ui)
  }

  /** a stamp landing / a thing put down */
  thud() {
    if (this.play('stamp', { bus: 'ui', level: 0.7 })) return
    if (!this.ctx || !this.ui) return
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    const t = this.ctx.currentTime
    osc.frequency.setValueAtTime(jitter(160, 0.1), t)
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.12)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    osc.connect(gain).connect(this.ui)
    osc.start(t)
    osc.stop(t + 0.2)
    this.burst(700, 0.05, 0.03, 'lowpass', this.ui)
  }

  /** a door: a breath of the next room and a latch */
  door() {
    if (this.play('door', { level: 0.6 })) return
    this.burst(500, 0.32, 0.06, 'lowpass', this.sfx, 0.6)
    window.setTimeout(() => this.burst(2200, 0.03, 0.05, 'bandpass', this.sfx), 260)
  }

  /** the referee: one, two or three blasts */
  whistle(blasts = 1) {
    if (this.play((`whistle-${Math.min(3, Math.max(1, blasts))}`) as SampleKey, { level: 0.55, jitter: 0.03 })) return
    if (!this.ctx || !this.sfx) return
    const t0 = this.ctx.currentTime
    for (let i = 0; i < blasts; i += 1) {
      const t = t0 + i * 0.32
      const osc = this.ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(jitter(2350, 0.02), t)
      const vib = this.ctx.createOscillator()
      vib.frequency.value = 28
      const vibGain = this.ctx.createGain()
      vibGain.gain.value = 60
      vib.connect(vibGain).connect(osc.frequency)
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 2400
      filter.Q.value = 4
      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02)
      gain.gain.setValueAtTime(0.12, t + (i === blasts - 1 ? 0.5 : 0.18))
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (i === blasts - 1 ? 0.62 : 0.26))
      osc.connect(filter).connect(gain).connect(this.sfx)
      vib.start(t)
      osc.start(t)
      osc.stop(t + 0.7)
      vib.stop(t + 0.7)
    }
  }

  /** a goal: the terrace goes up and takes eight seconds to come down */
  roar(big = 1) {
    // a directed match owns the crowd: a roar there is the state machine's burst
    if (this._crowdState !== 'OFF') {
      this.crowd(big >= 2 ? 'GOAL_BURST' : 'NEAR_MISS', true)
      return
    }
    if (this.play('crowd-goal', { level: Math.min(1, 0.55 * big), jitter: 0.05 })) {
      if (this.ambientFile && this.ctx) {
        const g = this.ambientFile.gain.gain
        g.setTargetAtTime(0.75, this.ctx.currentTime, 0.3)
        g.setTargetAtTime(0.5, this.ctx.currentTime + 4, 2)
      }
      return
    }
    if (!this.ctx || !this.sfx || !this.noise) return
    const t = this.ctx.currentTime
    const source = this.ctx.createBufferSource()
    source.buffer = this.noise
    source.loop = true
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(600, t)
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.6)
    filter.frequency.exponentialRampToValueAtTime(700, t + 6)
    filter.Q.value = 0.5
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.5 * big, t + 0.35)
    gain.gain.setValueAtTime(0.5 * big, t + 1.6)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 8)
    source.connect(filter).connect(gain).connect(this.sfx)
    source.start(t)
    source.stop(t + 8.2)
    if (this.swell) {
      this.swell.gain.gain.setTargetAtTime(0.28, t, 0.3)
      this.swell.gain.gain.setTargetAtTime(0.16, t + 4, 2)
    }
  }

  /** AM radio: a thin band of static with a voice-shaped murmur under it */
  radioOn(on: boolean) {
    if (!this.ctx || !this.ambient || !this.noise) return
    const key = 'radio'
    const existing = this.layers.find((layer) => layer.tag === key)
    if (on && !existing) {
      this.play('radio-tune', { bus: 'ambient', level: 0.5 })
      const ctx = this.ctx
      const ambient = this.ambient
      void this.sample('amb-radio').then((buffer) => {
        if (!buffer || this.layers.some((layer) => layer.tag === key + ':file')) return
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.loop = true
        const gain = ctx.createGain()
        gain.gain.value = 0
        source.connect(gain).connect(ambient)
        source.start(ctx.currentTime + 0.9)
        gain.gain.setTargetAtTime(0.22, ctx.currentTime + 0.9, 0.6)
        this.layers.push({ gain, stop: (when) => source.stop(when), tag: key + ':file' })
      })
      const source = this.ctx.createBufferSource()
      source.buffer = this.noise
      source.loop = true
      source.playbackRate.value = 1.6
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 2600
      filter.Q.value = 2.5
      const gain = this.ctx.createGain()
      gain.gain.value = 0
      source.connect(filter).connect(gain).connect(this.ambient)
      source.start()
      gain.gain.setTargetAtTime(0.035, this.ctx.currentTime, 0.8)
      this.layers.push({ gain, stop: (when) => source.stop(when), tag: key })
    } else if (!on && existing) {
      for (const layer of this.layers.filter((l) => l.tag === key || l.tag === key + ':file')) {
        layer.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4)
        layer.stop(this.ctx.currentTime + 1.5)
      }
      this.layers = this.layers.filter((layer) => layer.tag !== key && layer.tag !== key + ':file')
    }
  }

  // ---------------------------------------------------------------------- guts ---

  private burst(freq: number, seconds: number, level: number, type: BiquadFilterType, bus: GainNode | null, q = 1.2) {
    if (!this.ctx || !bus || !this.noise) return
    const t = this.ctx.currentTime
    const source = this.ctx.createBufferSource()
    source.buffer = this.noise
    source.playbackRate.value = jitter(1, 0.1)
    const filter = this.ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = freq
    filter.Q.value = q
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(level, t + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
    source.connect(filter).connect(gain).connect(bus)
    source.start(t, Math.random() * 1.5)
    source.stop(t + seconds + 0.05)
  }

  private makeNoise(): AudioBuffer {
    const ctx = this.ctx!
    const seconds = 2
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    // brown-ish: integrated white, leaky — a room, not a hiss
    let last = 0
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
    return buffer
  }
}
