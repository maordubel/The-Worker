import { describe, expect, it } from 'vitest'

import { InputState } from '@/lib/life/runtime/input'

/**
 * הכפתור — one press is one action, however short, and never more than one.
 */
describe('the action button', () => {
  it('reports a held press once, on the frame it began', () => {
    const input = new InputState()
    input.setKeyAction(true)
    input.beginFrame()
    expect(input.actionPressed).toBe(true)
    input.beginFrame()
    expect(input.actionPressed).toBe(false)
    input.setKeyAction(false)
    input.beginFrame()
    expect(input.actionPressed).toBe(false)
  })

  it('does not lose a press shorter than a frame (5.9.2026 — the drawer never opened)', () => {
    const input = new InputState()
    // down and up between two frames: a fast E, a quick thumb on the chip
    input.setKeyAction(true)
    input.setKeyAction(false)
    input.beginFrame()
    expect(input.actionPressed).toBe(true)
    input.beginFrame()
    expect(input.actionPressed).toBe(false)
  })

  it('the same for the touch chip', () => {
    const input = new InputState()
    input.setAction(true)
    input.setAction(false)
    input.beginFrame()
    expect(input.actionPressed).toBe(true)
  })

  it('a swallowed press stays swallowed, even a short one', () => {
    const input = new InputState()
    // the E that closed a line: the shell swallows the edge after the keydown
    input.setKeyAction(true)
    input.swallow()
    input.setKeyAction(false)
    input.beginFrame()
    expect(input.actionPressed).toBe(false)
    input.beginFrame()
    expect(input.actionPressed).toBe(false)
    // and the next real press works again
    input.setKeyAction(true)
    input.beginFrame()
    expect(input.actionPressed).toBe(true)
  })

  it('two short presses in two frames are two actions, and one in one frame is one', () => {
    const input = new InputState()
    input.setKeyAction(true)
    input.setKeyAction(false)
    input.beginFrame()
    expect(input.actionPressed).toBe(true)
    input.setKeyAction(true)
    input.setKeyAction(false)
    input.beginFrame()
    expect(input.actionPressed).toBe(true)
    // a bounce inside one frame is still one press
    input.setKeyAction(true)
    input.setKeyAction(false)
    input.setKeyAction(true)
    input.setKeyAction(false)
    input.beginFrame()
    expect(input.actionPressed).toBe(true)
    input.beginFrame()
    expect(input.actionPressed).toBe(false)
  })
})
