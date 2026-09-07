import type { HistoricalAnchor } from '../anchors'
import type { LocationId } from '../types'
import type { KitSpec } from '../../kit/spec'

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
  /** what the DAY is waiting for, when the room itself has nothing left — `world/why.ts` */
  waitingOn?: string | null
  /**
   * ממתין — the one thing on the glass that says "nothing is broken".
   *
   * Maor, 5.9.2026: "במידה והמתמודד עשה הכל נכון עד כה וכעת נותר לו להמתין למשהו הבא באותו
   * מקום נא לציין את זה קבוע על המסך בזמן ההמתנה. למנוע חשד של המתמודד שמשהו נתקע במשחק."
   *
   * That is a real fault and it has a real cause: this game has stretches where the
   * correct move is to stand still — a match running, a father who has not come back yet,
   * a clock that has to reach a number. Every other game signals that with a spinner. This
   * one says it in words, permanently, for as long as it is true, and names WHAT is being
   * waited for. Null the rest of the time; a banner that is always there is wallpaper.
   */
  waitingHe: string | null
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
    /**
     * דרבי או לא — said once, before the first minute, by the director running the match.
     *
     * The constant match bed plays at every fixture; the chant Maor sent is layered over
     * it only when this is true (6.9.2026). The audio never guesses which night it is.
     */
    | { kind: 'derby'; on: boolean }
    /**
     * כמה מהאצטדיון להשאיר — the mix inverts while somebody is listening to a radio in the
     * middle of a crowd (Mission 01 §24). 1 = an ordinary match, 0.3 = news from the other
     * ground, 0.05 = a penalty nobody in this stadium can see.
     */
    | { kind: 'listen'; weight: number }
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
    /**
     * The year the NEXT chapter is set in, resolved by the runtime rather than by the
     * card. Since 6.9.2026 a chapter can be conditional on the life (`chapterOpen`), so
     * "what comes next" depends on flags the card has no business holding.
     */
    nextYear: number | null
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
   * חוברת פתוחה — which booklet is being read, and on which page.
   *
   * Its own channel rather than a `doc` with a page number, because it obeys different
   * rules: it does not stop the world for a beat and then go away, it stays open for as
   * long as somebody is reading, and where they stopped is remembered.
   */
  book: { id: string; page: number } | null
  /**
   * כרטיס-ביסוס — a title over black, held for `ms`, then gone: `מאי 1990`,
   * `בלומפילד · 12 במאי 1990`. The first of the five tricks in the roadmap's grammar of
   * entering a scene. It says one thing and is never a menu.
   */
  /**
   * החולצה שקנית — held up big, with the year it was worn and where the collection
   * stands. A shirt is the only purchase in this game that gets a card of its own.
   */
  /**
   * מעברון — four seconds of Tel Aviv, 1989, over the black between two rooms.
   *
   * Not the archive film channel (`cutscene`), which stops the world and is a document.
   * This is a breath: it plays over a scene change that is happening anyway, cannot be
   * interacted with, and is gone before anybody decides whether to skip it.
   */
  film: { clip: string; captionHe: string } | null

  /**
   * כרטיס היכרות — the first time somebody walks into this life.
   *
   * Maor asked for "סרטון הכרות קצר" for every character, humorous and light. There is no
   * film here and there should not be: three lines revealed a tap at a time over the
   * figure at full height IS a title sequence — it has a beat and an edit — and it costs
   * writing instead of a shoot. It plays once per person, ever (`own:met:*`).
   */
  cast: {
    nameHe: string
    roleHe: string
    art: string
    linesHe: readonly string[]
    sinceHe: string
  } | null

  /**
   * חנות האוהדים — not a room, a counter.
   *
   * It WAS a room for one delta, cut out of a 360° panorama Maor sent, and his verdict on
   * the screenshot was the right one: "החנות שאתה מעלה בתמונות נראית נורא ואיום… אולי שווה
   * לעשות חנות כפיצ׳ר פנימי, ולא כחלל". He is right twice over. An empty room with one
   * shirt floating on a wall is worse than no room, and a shop is not a place you walk
   * about in — it is a rail you look along. So the door on the street opens THIS: the
   * whole collection, drawn, with what it costs and what you already own.
   */
  shop: { chapter: string } | null

  /**
   * הטוטו — a Toto slip is, in this game, five questions about the club.
   *
   * Maor asked for it in the shape it already exists in: the site's own trivia bank, five
   * questions a round, two shekels a correct answer. The questions arrive from the server
   * WITHOUT their answers and are graded there, exactly the way גשר 2 does it, so a boy
   * filling in a Toto slip cannot read the results off the page.
   */
  toto: { seed: number; perAnswerHe: string } | null

  /**
   * עץ או פלי — a half shekel, in the air, in the alley.
   *
   * A shekel in, five out. That is the bet the street offered and it is Maor's number.
   * The coin is his photograph of a half shekel: the lyre is עץ and the numeral is פלי.
   */
  coin: { stake: number; prize: number } | null

  /**
   * פנדלים — five real penalty kicks against a keeper, on the neighbourhood pitch,
   * played in three dimensions rather than painted (Maor, 6.9.2026).
   */
  penalty: { attempts: number; perGoal: number } | null

  /**
   * תחרות חיובים — five free throws at the schoolyard hoop, from the painted-on line,
   * played in three dimensions rather than painted (Maor, 6.9.2026).
   */
  hoops: { attempts: number; perBasket: number } | null

  /**
   * האלבום — the Supergoal album, open over a stopped world.
   *
   * Its own channel rather than a `doc`, for the same reason `book` has one: it is not
   * held up for a beat and put down, it is a thing the player goes into and comes out of,
   * and what is stuck in it is state rather than a picture.
   */
  album: { open: boolean } | null

  /**
   * מעטפה — three stickers coming out of a paper envelope.
   *
   * `before` is how many of each one was already in the album at the moment the packet
   * was bought, so the card can say `חדש` truthfully after the engine has already
   * counted them in.
   */
  packet: { ids: readonly string[]; before: Readonly<Record<string, number>> } | null

  shirt: {
    /**
     * למה הכרטיס הזה פתוח — a purchase, or a new kit arriving on the rail.
     *
     * Maor, 5.9.2026: "בחנות אוהדים חולצות צריכות להתגלות רק מתי שמגיעים לעונה בה שיחקו
     * עם החולצה ולא לפני. גם המתמודד מקבל על זה פופ אפ שנכנסה חולצה חדשה לחנות." The
     * first half was already true (`onSale` gates on the season); the second half is this.
     */
    kind: 'bought' | 'arrived'
    /** a photograph — empty when the shirt is drawn from the archive's spec instead */
    art: string
    titleHe: string
    nameHe: string
    sponsorHe: string
    yearsHe: string
    noteHe: string
    have: number
    total: number
    /** the club's own kit spec, when this shirt came out of the archive */
    spec: KitSpec | null
    seasonHe: string | null
    sourceHe: string | null
  } | null

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
