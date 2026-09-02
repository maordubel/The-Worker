import type { HistoricalAnchor } from '../anchors'
import type { LocationId } from '../types'

/**
 * הגשר — the one channel between the canvas and the DOM.
 *
 * Every word the player reads is rendered by React, not by Phaser. That is a deliberate
 * decision and not a shortcut: Hebrew in a WebGL canvas needs a loaded webfont, gets no
 * bidi handling, cannot be selected, cannot be read by a screen reader, and reflows
 * badly on a narrow phone. Text belongs to the DOM. The canvas draws the world.
 *
 * So the runtime speaks in intents — "show this dialogue", "the clock says this" — and
 * the shell decides what that looks like. It also means the shell can be restyled to
 * the brand without touching a scene, and that a scene can be tested without a browser.
 *
 * Deliberately tiny: a typed map of listener sets. A dependency to notify four
 * listeners is a dependency to maintain forever.
 */

export type DialogueLine = {
  /** speaker's display name, or null for narration */
  who: string | null
  text: string
}

export type DialogueChoice = {
  id: string
  text: string
  /** false renders it visibly unavailable — a choice you can see you cannot take */
  enabled?: boolean
  /** why it is unavailable, shown quietly next to it */
  noteHe?: string
}

export type HudState = {
  clock: string
  agorot: number
  /** shown for a moment when it changes, then it goes away again (brief §15) */
  showMoney: boolean
  place: string
  objective: string | null
}

export type LifeBusEvents = {
  hud: HudState
  dialogue: { lines: DialogueLine[]; choices?: DialogueChoice[]; portrait?: string | null } | null
  /**
   * What the button will do, and to what.
   *
   * The old prompt said `לגעת`, which is not information. A verb plus a name — `דבר עם
   * קובי`, `צא לרחוב` — is the whole of the interaction language, and it is the same
   * string on a desktop key cap and on a phone's action button.
   */
  prompt: { verb: string; label: string; locked?: boolean } | null
  /** the one line of onboarding the game shows, or null once it is done */
  teach: { id: 'move' | 'act' } | null
  toast: { text: string; tone: 'plain' | 'red' } | null
  place: { id: LocationId; title: string }
  anchor: { anchor: HistoricalAnchor; showing: boolean }
  /** the runtime asking the shell to show the closing card */
  ending: {
    titleHe: string
    bodyHe: string
    memoryHe: string
    after?: { fromArt: string; toArt: string; lineHe: string }
  } | null
  /** touch controls only matter on a touch device; the runtime says when they help */
  controls: { visible: boolean }
  saved: number
  /**
   * How tall the painting actually is on screen, in CSS pixels.
   *
   * On a phone held upright a room cannot fill the glass without losing its composition,
   * so the camera frames it and the rest of the canvas is empty. The shell needs to know
   * where the picture ends, because that is where the dialogue box belongs — not floating
   * over the painting, and not stranded at the bottom of a black field.
   */
  frame: { picture: number }
}

type Handler<K extends keyof LifeBusEvents> = (payload: LifeBusEvents[K]) => void

export class LifeBus {
  private handlers: { [K in keyof LifeBusEvents]?: Set<Handler<K>> } = {}
  /** last value per channel, so a component that mounts late is not blank */
  private last: { [K in keyof LifeBusEvents]?: LifeBusEvents[K] } = {}

  on<K extends keyof LifeBusEvents>(key: K, handler: Handler<K>): () => void {
    // The store is keyed by channel and each channel has its own payload type, which a
    // generic index cannot prove to the compiler. The cast is confined to these two
    // lines; every caller of `on`/`emit` stays fully typed.
    const store = this.handlers as Record<string, Set<Handler<K>>>
    const set = (store[key] ??= new Set<Handler<K>>())
    set.add(handler)
    if (key in this.last) handler(this.last[key] as LifeBusEvents[K])
    return () => {
      set.delete(handler)
    }
  }

  emit<K extends keyof LifeBusEvents>(key: K, payload: LifeBusEvents[K]): void {
    this.last[key] = payload
    const set = this.handlers[key] as Set<Handler<K>> | undefined
    if (!set) return
    for (const handler of set) handler(payload)
  }

  clear() {
    this.handlers = {}
    this.last = {}
  }
}
