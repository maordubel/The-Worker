/**
 * הקהל כמכונת מצבים — the crowd is one loop and one state, whatever the director asks.
 *
 * A fake Web Audio: every node records what was asked of it, `decodeAudioData` answers
 * at once, `fetch` hands back an empty buffer. What is checked is the SHAPE of the
 * machine — one murmur loop however many states pass, one cut per entry, the loop
 * dropped on OFF, a dark tab suspending the clock — not what it sounds like.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CROWD_PLAN, CROWD_STATES, LifeAudio } from '@/lib/life/runtime/audio'

type Call = { target: string; value: number; at: number }

class FakeParam {
  value = 0
  calls: Call[] = []
  constructor(private name: string) {}
  setTargetAtTime(value: number, at: number) {
    this.calls.push({ target: this.name, value, at })
    this.value = value
  }
  setValueAtTime(value: number) {
    this.value = value
  }
  exponentialRampToValueAtTime() {}
}

class FakeNode {
  connect(node: FakeNode) {
    return node
  }
  disconnect() {}
}
class FakeGain extends FakeNode {
  gain = new FakeParam('gain')
}
class FakeFilter extends FakeNode {
  type = 'lowpass'
  Q = new FakeParam('Q')
  frequency = new FakeParam('frequency')
}
class FakeOsc extends FakeNode {
  type = 'sine'
  frequency = new FakeParam('frequency')
  start() {}
  stop() {}
}
class FakeSource extends FakeNode {
  buffer: unknown = null
  loop = false
  playbackRate = new FakeParam('rate')
  started = 0
  stopped = 0
  start() {
    this.started += 1
    FakeContext.last.started.push(this)
  }
  stop() {
    this.stopped += 1
  }
}
class FakeBuffer {
  constructor(public duration: number) {}
  getChannelData() {
    return new Float32Array(10)
  }
}

class FakeContext {
  static last: FakeContext
  state: 'running' | 'suspended' = 'running'
  currentTime = 0
  sampleRate = 22050
  destination = new FakeNode()
  started: FakeSource[] = []
  constructor() {
    FakeContext.last = this
  }
  createGain() {
    return new FakeGain()
  }
  createBiquadFilter() {
    return new FakeFilter()
  }
  createOscillator() {
    return new FakeOsc()
  }
  createBufferSource() {
    return new FakeSource()
  }
  createBuffer(_c: number, length: number, rate: number) {
    return new FakeBuffer(length / rate)
  }
  decodeAudioData() {
    return Promise.resolve(new FakeBuffer(23.5))
  }
  suspend() {
    this.state = 'suspended'
    return Promise.resolve()
  }
  resume() {
    this.state = 'running'
    return Promise.resolve()
  }
}

const listeners: Record<string, Array<() => void>> = {}
let visibility = 'visible'

function install() {
  const storage = new Map<string, string>()
  Object.assign(globalThis, {
    window: {
      AudioContext: FakeContext,
      localStorage: {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => storage.set(k, v),
      },
      setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
      clearTimeout: (id: number) => clearTimeout(id),
    },
    document: {
      get visibilityState() {
        return visibility
      },
      addEventListener: (name: string, fn: () => void) => {
        ;(listeners[name] ??= []).push(fn)
      },
      createElement: () => ({ canPlayType: () => 'probably' }),
    },
    fetch: () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }),
  })
}

const tick = async () => {
  // fetch → arrayBuffer → decode → then: microtasks only, timers are faked
  for (let i = 0; i < 12; i += 1) await Promise.resolve()
}

/** the sources started on the crowd bus that loop — there must only ever be one alive */
const loops = () => FakeContext.last.started.filter((s) => s.loop && (s.buffer as FakeBuffer)?.duration === 23.5)
const oneShots = () => FakeContext.last.started.filter((s) => !s.loop)

describe('the crowd state machine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    install()
    visibility = 'visible'
    for (const k of Object.keys(listeners)) delete listeners[k]
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('names the seven states the brief asked for', () => {
    expect(CROWD_STATES).toEqual(['LOW_MURMUR', 'BUILDING_TENSION', 'CHANT', 'NEAR_MISS', 'GOAL_BURST', 'AFTERMATH', 'FINAL_WHISTLE'])
    for (const state of CROWD_STATES) expect(CROWD_PLAN[state as keyof typeof CROWD_PLAN]).toBeDefined()
    // a goal is louder than a murmur, and the end goes to nothing
    expect(CROWD_PLAN.GOAL_BURST.level).toBeGreaterThan(CROWD_PLAN.LOW_MURMUR.level)
    expect(CROWD_PLAN.FINAL_WHISTLE.level).toBe(0)
  })

  it('starts one murmur loop and keeps it through every state', async () => {
    const audio = new LifeAudio()
    audio.wake()
    audio.crowd('LOW_MURMUR')
    await tick()
    await tick()
    expect(loops()).toHaveLength(1)
    for (const state of ['BUILDING_TENSION', 'CHANT', 'NEAR_MISS', 'GOAL_BURST', 'AFTERMATH'] as const) {
      audio.crowd(state)
      await tick()
    }
    expect(loops()).toHaveLength(1)
    expect(audio.crowdState).toBe('AFTERMATH')
    expect(audio.crowdHistory.map((h) => h.state)).toEqual(['LOW_MURMUR', 'BUILDING_TENSION', 'CHANT', 'NEAR_MISS', 'GOAL_BURST', 'AFTERMATH'])
  })

  it('fires the entry cut once per state, not once per call', async () => {
    const audio = new LifeAudio()
    audio.wake()
    audio.crowd('LOW_MURMUR')
    await tick()
    await tick()
    const before = oneShots().length
    audio.crowd('GOAL_BURST')
    audio.crowd('GOAL_BURST')
    audio.crowd('GOAL_BURST')
    await tick()
    await tick()
    expect(oneShots().length - before).toBe(1)
  })

  it('drops the loop on OFF and after the final whistle', async () => {
    const audio = new LifeAudio()
    audio.wake()
    audio.crowd('LOW_MURMUR')
    await tick()
    await tick()
    const [loop] = loops()
    audio.crowd('OFF')
    expect(loop!.stopped).toBe(1)
    expect(audio.crowdState).toBe('OFF')
    audio.crowd('LOW_MURMUR')
    await tick()
    await tick()
    expect(loops()).toHaveLength(2)
    audio.crowd('FINAL_WHISTLE')
    vi.advanceTimersByTime(9500)
    expect(audio.crowdState).toBe('OFF')
    expect(loops()[1]!.stopped).toBe(1)
  })

  it('cancels the old state’s timers when the state moves on', async () => {
    const audio = new LifeAudio()
    audio.wake()
    audio.crowd('LOW_MURMUR')
    await tick()
    await tick()
    audio.crowd('BUILDING_TENSION')
    await tick()
    const before = oneShots().length
    audio.crowd('LOW_MURMUR')
    vi.advanceTimersByTime(20000)
    await tick()
    // no second "build" rise fired under the murmur
    expect(oneShots().length).toBe(before)
  })

  it('suspends the clock when the tab goes dark and resumes it once, without a second loop', async () => {
    const audio = new LifeAudio()
    audio.wake()
    audio.crowd('CHANT')
    await tick()
    await tick()
    visibility = 'hidden'
    for (const fn of listeners.visibilitychange ?? []) fn()
    expect(FakeContext.last.state).toBe('suspended')
    vi.advanceTimersByTime(30000)
    visibility = 'visible'
    for (const fn of listeners.visibilitychange ?? []) fn()
    await tick()
    expect(FakeContext.last.state).toBe('running')
    expect(loops()).toHaveLength(1)
  })

  it('keeps the mute preference across engines', () => {
    const a = new LifeAudio()
    a.setMuted(true)
    const b = new LifeAudio()
    expect(b.muted).toBe(true)
    b.setMuted(false)
    expect(new LifeAudio().muted).toBe(false)
  })

  it('the room ambience "park" is the owner’s recording and the crowd has real cuts', () => {
    const manifest = JSON.parse(require('node:fs').readFileSync('public/life/sfx/manifest.json', 'utf8')) as Record<string, { loop: boolean; seconds: number; source?: string }>
    for (const key of ['amb-park', 'park-wave', 'crowd-real-goal', 'crowd-real-murmur', 'crowd-real-build', 'crowd-real-miss', 'crowd-real-after', 'crowd-real-final']) {
      expect(manifest[key], key).toBeDefined()
      expect(manifest[key]!.source).toBe('maor-2026-09-05')
      for (const ext of ['ogg', 'm4a']) expect(require('node:fs').existsSync(`public/life/sfx/${key}.${ext}`), `${key}.${ext}`).toBe(true)
    }
    expect(manifest['amb-park']!.loop).toBe(true)
    expect(manifest['crowd-real-murmur']!.loop).toBe(true)
    expect(manifest['crowd-real-goal']!.loop).toBe(false)
  })
})
