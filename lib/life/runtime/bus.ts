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

export type PanoSpot = { yaw: number; pitch: number; labelHe: string; act: string }

export type DialogueLine = {
  /** speaker's display name, or null for narration */
  who: string | null
  text: string
  /** the face that fills the glass for this line — see `Say.closeUp` */
  closeUp?: string
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
  /** `24 במאי 1986` — the day this chapter is, written out; the year alone when the archive has no date */
  date: string
  agorot: number
  /** shown for a moment when it changes, then it goes away again (brief §15) */
  showMoney: boolean
  place: string
  objective: string | null
  /** the year the life is in — the shell keys its type and texture off the decade */
  year: number
  /** the room, by id — the help sheet picks its sentence off it */
  scene: string
  /** "מה עליי לעשות?" — one plain sentence for the help sheet, never on the glass itself */
  hint: string
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
  /**
   * A toast is a sentence — and since 4.9.2026 it can carry a thing: the art of the
   * object that just changed hands (`art`) and a one-word kicker over it ("לקופסה
   * האדומה", "קיבלת"). The shell draws a plain sentence as a strip and a sentence with
   * a thing as a ticket.
   */
  toast: { text: string; tone: 'plain' | 'red'; art?: string; kickerHe?: string } | null
  place: { id: LocationId; title: string; ambience?: string }
  /**
   * מבט — the world seen from the boy's eyes, for a moment. The shell draws
   * `Panorama`; the scene under it is paused until `closePano`.
   */
  pano: { key: string; titleHe: string; startYaw?: number; hotspots: PanoSpot[] } | null
  /** the tunnel, first person: the shell draws `TunnelWalk`; `finishTunnel` arrives */
  tunnel: { to: LocationId; spawn: string; variant?: 'bloomfield' | 'ussishkin' } | null
  /** the sound of the world — one-shots the shell's synthesiser plays; see `audio.ts` */
  sound:
    | { kind: 'step'; surface: 'floor' | 'street' | 'terrace' }
    | { kind: 'door' }
    | { kind: 'whistle'; blasts: number }
    | { kind: 'roar'; big?: number }
    | { kind: 'radio'; on: boolean }
    /** one rendered sound by name — see `SampleKey` in audio.ts */
    | { kind: 'sample'; key: import('./audio').SampleKey; level?: number; delayMs?: number }
    /** the crowd moves to a state — see `CrowdState` in audio.ts; the match director's voice */
    | { kind: 'crowd'; state: import('./audio').CrowdState }
  anchor: { anchor: HistoricalAnchor; showing: boolean }
  /**
   * הלוח — the scoreboard, while a match is actually happening in front of the child.
   *
   * The HUD has a clock on it and that clock says `שבת • 17:41`, which is the time of day
   * and not the thing anybody in the ground is looking at. During the final the shell
   * shows a second, different clock — two club names, a score, a minute — and it is the
   * only moment in the chapter that a number on screen means what a number on a
   * scoreboard means. `null` the rest of the time, which is most of the game.
   */
  match: {
    homeHe: string
    awayHe: string
    /** null when the archive holds the night as a season and not a score: the strip prints a dash */
    homeScore: number | null
    awayScore: number | null
    labelHe: string
    /** true from the goal until the whistle, so the strip can carry the moment */
    scored: boolean
    /** the whistle has gone: the board is now a fact, and the boy has somewhere to be */
    over?: boolean
  } | null
  /**
   * סוף שלב א' — the end of the stage, which is not the end of a scene.
   *
   * `ending` closes a Saturday. This closes a CHAPTER OF A LIFE: it carries the archive's
   * own record of the match, the ticket that got the child in, the next morning's front
   * pages, and the one sentence that says what he became. It exists as its own channel
   * because it is the only screen in the game a player is meant to sit with.
   */
  finale: {
    anchor: import('../anchors').HistoricalAnchor
    /** the chapter that ended — its plate is the hero of the card */
    chapter: string
    titleHe: string
    bodyHe: string
    becameHe: string
    keptTicket: boolean
  } | null
  /**
   * סרט מהארכיון — the illustrated memory opening onto real film.
   *
   * Its own channel, and not a `doc` with a video in it, because it obeys a rule neither
   * of them does: while it is on screen the WORLD IS STOPPED. No clock, no schedule, no
   * dialogue, no thumb pad, no objective — the player is not in 1986 as a child for these
   * two minutes, they are watching what a child watched. `doc` holds a page up over a
   * world that is still running underneath.
   *
   * The payload is the configuration plus the card built from the anchor, so the shell
   * renders it without importing the archive. `null` closes it, and closing it is the
   * runtime's job: the shell reports how it ended and the scene decides what that means.
   */
  cutscene: {
    scene: import('../cutscenes').HistoricalCutscene
    card: import('../cutscenes').CutsceneCard
  } | null
  /**
   * מסמך — a real printed thing, held up over the world until the player puts it down.
   *
   * Not a dialogue portrait and not a prop: a scan of something that exists. It gets its
   * own channel because it obeys a different rule from every other picture in the game —
   * nothing may be written on it, nothing may be cropped out of it to make a point, and
   * the caption underneath says where it came from rather than what to think about it.
   */
  doc: { art: string; captionHe: string | null } | null
  /**
   * כרטיס-ביסוס — a title over black, held for `ms`, then gone: `מאי 1990`,
   * `בלומפילד · 12 במאי 1990`. The first of the five tricks in the roadmap's grammar of
   * entering a scene. It says one thing and is never a menu.
   */
  card: {
    titleHe: string
    subHe: string | null
    ms: number
    /**
     * הלוח — a chapter cut is a title over a PICTURE (5.9.2026). `art` is a plate key
     * (`plate-1993-cup`) from `make-plates.py`; with it the card becomes the graded key
     * painting of the next chapter under bars and grain, and the title is a year that
     * rolls from `fromYear`. Without it the card is the word over black it always was.
     */
    art?: string
    fromYear?: number | null
    /** a wider sub line under the rule — the chapter's name */
    nameHe?: string
  } | null
  /**
   * החיים האחרים — the championship was missed, so the chapter does NOT end (Stage A §14).
   *
   * A separate channel from `ending` on purpose: an ending closes a Saturday and opens the
   * next thing, and this closes nothing. It shows what happened, shows the life Pogi would
   * have had if that were really the end of it, and hands back the morning.
   */
  retry: import('../content/retry1986').RetryScene | null
  /**
   * הקודה — the life as BUILT is over, and the game says so instead of promising.
   *
   * Emitted by the runtime when a chapter ends and the registry has no playable chapter
   * after it. The shell shows the frame of 2026 — the man in front of the new ground —
   * and the one honest line: this is as far as the life goes today. `null` closes it.
   */
  coda: { chapter: string } | null
  /**
   * המדדים זזים — what moved in the life on the last dispatch, for the pops.
   *
   * A batch, not a value: one dispatch of five events is one beat on screen, and the
   * shell decides how many of them to show. Computed by the runtime from the state
   * before and after (`lib/life/gauges.ts`), never authored by a scene — a scene cannot
   * announce a rise it did not cause.
   */
  gauge: import('../gauges').GaugeChange[]
  /** the love meter on the glass — the one number always visible */
  love: { value: number; bump: number }
  /**
   * מקום נחשף — a place went on the city map for the first time, and it is a moment.
   * The map zooms to it, the fog lifts, a red stamp lands. `null` closes it.
   */
  reveal: { place: import('../map').MapPlaceDef } | null
  /** the runtime asking the shell to show the closing card */
  ending: {
    titleHe: string
    bodyHe: string
    memoryHe: string
    after?: { fromArt: string; toArt: string; lineHe: string }
    chapter?: string
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
