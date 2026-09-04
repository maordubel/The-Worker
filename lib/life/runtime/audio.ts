/**
 * הקול — the game's sound, synthesised. No files.
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

export type AmbienceKey = 'interior' | 'kitchen' | 'day' | 'dusk' | 'tunnel' | 'stadium' | 'hall' | 'none'

const STORE = 'the-worker:life:sound'

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
  private crowd: { gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null
  private current: AmbienceKey = 'none'
  private wanted: AmbienceKey = 'none'
  private _muted = false
  private ducked = false
  private noise: AudioBuffer | null = null

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
    this.noise = this.makeNoise()
    if (this.wanted !== 'none') this.setAmbience(this.wanted, true)
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
    if (this.crowd) {
      this.crowd.gain.gain.setTargetAtTime(0, t, 0.6)
      this.crowd.lfo.stop(t + 2.5)
      this.crowd = null
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
        this.crowd = { gain: body, lfo, lfoGain }
        break
      }
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
    const p: Record<typeof surface, [number, number, number]> = { floor: [900, 0.05, 0.045], street: [1400, 0.06, 0.05], terrace: [600, 0.07, 0.05] }
    const [freq, seconds, level] = p[surface]
    this.burst(jitter(freq, 0.25), jitter(seconds, 0.3), level, 'bandpass', this.sfx)
  }

  /** a page turned: a soft sweep of noise */
  page() {
    this.burst(2400, 0.09, 0.05, 'highpass', this.ui, 0.5)
  }

  /** the prompt found something: a very small tick */
  tick() {
    this.burst(3200, 0.02, 0.025, 'bandpass', this.ui)
  }

  /** a stamp landing / a thing put down */
  thud() {
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
    this.burst(500, 0.32, 0.06, 'lowpass', this.sfx, 0.6)
    window.setTimeout(() => this.burst(2200, 0.03, 0.05, 'bandpass', this.sfx), 260)
  }

  /** the referee: one, two or three blasts */
  whistle(blasts = 1) {
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
    if (this.crowd) {
      this.crowd.gain.gain.setTargetAtTime(0.28, t, 0.3)
      this.crowd.gain.gain.setTargetAtTime(0.16, t + 4, 2)
    }
  }

  /** AM radio: a thin band of static with a voice-shaped murmur under it */
  radioOn(on: boolean) {
    if (!this.ctx || !this.ambient || !this.noise) return
    const key = 'radio'
    const existing = this.layers.find((layer) => layer.tag === key)
    if (on && !existing) {
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
      existing.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4)
      existing.stop(this.ctx.currentTime + 1.5)
      this.layers = this.layers.filter((layer) => layer !== existing)
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
