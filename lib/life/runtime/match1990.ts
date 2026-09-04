import type Phaser from 'phaser'

import type { HistoricalAnchor } from '../anchors'
import { rollerFor } from '../rng'
import { US_HE } from '../match'
import type { Say } from '../content/script'

import type { LifeContext } from './context'

/**
 * רשת הטרנזיסטורים — the match of 12.5.1990 as an information game (brief §15–§20).
 *
 * The child does not control Hapoel. The historical match is fixed, and the only number
 * this file ever puts on a scoreboard is read off the anchor — six for us, none for
 * them, from `content/manual/matches.json` with its source attached. What the child
 * controls is what he KNOWS, and when: there is a second match forty kilometres away,
 * and whether we are going up at any given moment depends on it. The archive holds no
 * score for that match (rule 11), so this director never states one. It holds the race
 * in words the source uses — "they scored more", "at half-time the status quo held and
 * Yavne were going up" — and every specific number about Yavne that anybody says on this
 * terrace is a RUMOUR, generated off the save's seed and recorded as `rumor:*`.
 *
 * Three states, kept apart on purpose (brief §15):
 *   · canonical — what is true. Hapoel's goals, and Yavne "level / ahead / further ahead"
 *     in the shape the source describes. Never shown directly.
 *   · known — what the child has actually heard, from whom, and how stale it is.
 *   · rumour — what the kids are saying, which may be right by accident.
 *
 * Sources have LATENCY: Kobi's radio hears Yavne a minute late; the other radio, three;
 * the man who "knows" repeats the other radio; the kids repeat whatever. A child who walks
 * from the far radio back to his father can arrive with news the father's radio has not
 * played yet — and that inversion (`net:toldKobi`) is the whole point of the chapter.
 *
 * Time is compressed: about one game-minute per two real seconds, so the ninety minutes
 * and the interval take a little over three real minutes, with room to walk.
 */

export type NetBoard = {
  homeHe: string
  awayHe: string
  homeScore: number
  awayScore: number
  labelHe: string
  scored: boolean
  over?: boolean
}

export type NetHooks = {
  onBoard: (board: NetBoard | null) => void
  onOver: () => void
  onDrop: (dropped: boolean) => void
  radioAt: () => { x: number; y: number } | null
}

/** Yavne's canonical state, in the source's own shape — never a number. */
type YavneState = 'level' | 'ahead' | 'further'

type Known = {
  hapoel: number
  yavne: YavneState | 'unknown'
  /** the game-minute the Yavne news was last refreshed, for staleness */
  yavneAt: number
  /** which source told him last */
  from: string | null
}

const YAVNE_LABEL: Record<YavneState | 'unknown', string> = {
  unknown: 'לא יודעים כלום על יבנה.',
  level: 'ביבנה עוד אין שערים.',
  ahead: 'יבנה מובילה.',
  further: 'יבנה מובילה, ובגדול.',
}

/** the six, spread over the ninety — internal pacing, NEVER shown as minutes */
const GOAL_AT = [12, 29, 44, 58, 71, 84] as const
/** the parallel match, in the source's shape: level, then Yavne ahead by half-time, then more */
const YAVNE_AT: Array<{ minute: number; state: YavneState }> = [
  { minute: 0, state: 'level' },
  { minute: 21, state: 'ahead' },
  { minute: 63, state: 'further' },
]
const HALF = 45
const INTERVAL = 15
const FULL = 90
/** game-minutes per real second */
const PACE = 0.5
/** real seconds the dropped radio waits on the concrete */
const DROP_WINDOW_MS = 42000

export class TransistorNet {
  private minute = 0
  private acc = 0
  private phase: 'first' | 'half' | 'second' | 'over' = 'first'
  private goals = 0
  private known: Known = { hapoel: 0, yavne: 'unknown', yavneAt: -1, from: null }
  private lastBoard = ''
  private dropAt: number | null = null
  private dropClock = 0
  private saidSix = false
  private halfSaid = false

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly ctx: LifeContext,
    private readonly anchor: HistoricalAnchor,
    private readonly hooks: NetHooks,
  ) {}

  static finalBoard(anchor: HistoricalAnchor): NetBoard | null {
    const match = anchor.match
    if (!match) return null
    return {
      homeHe: match.atHome ? US_HE : match.opponentHe,
      awayHe: match.atHome ? match.opponentHe : US_HE,
      homeScore: match.atHome ? match.scoredFor : match.scoredAgainst,
      awayScore: match.atHome ? match.scoredAgainst : match.scoredFor,
      labelHe: 'סיום',
      scored: true,
      over: true,
    }
  }

  /**
   * `dayMinute` is the day clock at the moment the boy reaches the terrace. Before
   * kickoff the match starts from nothing; after it, the network picks up mid-match —
   * the goals already scored are on the board, the phase is where the clock says — so a
   * boy the stewards let in at half-time (the old Israeli mercy: the gates open for the
   * second half) walks into a match that has been happening without him, which is the
   * brief's whole point about history not waiting.
   */
  start(dayMinute = 0, kickoff = 0) {
    const elapsed = Math.max(0, Math.min(HALF + INTERVAL + HALF - 1, dayMinute - kickoff))
    if (elapsed > 0) {
      this.minute = elapsed
      const played = this.playedMinute()
      const total = this.anchor.match?.scoredFor ?? 0
      this.goals = Math.min(total, GOAL_AT.filter((at) => at <= played).length)
      this.phase = this.minute >= HALF + INTERVAL ? 'second' : this.minute >= HALF ? 'half' : 'first'
      this.halfSaid = this.phase !== 'first'
      // What he knows is what he heard on the way in: the score, from nobody in particular.
      this.known = { ...this.known, hapoel: this.goals, from: this.goals ? 'הרחוב' : null }
      this.ctx.bus.emit('toast', { text: this.phase === 'half' ? 'מחצית. באת באמצע.' : 'באת באמצע. הרעש אמר לך את הרוב.', tone: 'red' })
    } else {
      this.ctx.bus.emit('toast', { text: 'המשחק מתחיל. הרדיו של אבא מדבר.', tone: 'red' })
      this.ctx.bus.emit('sound', { kind: 'whistle', blasts: 1 })
    }
    this.ctx.bus.emit('sound', { kind: 'radio', on: true })
    this.pushBoard()
  }

  /** Called every frame by the scene, with real milliseconds. */
  tick(delta: number) {
    if (this.phase === 'over') return
    this.acc += (delta / 1000) * PACE
    while (this.acc >= 1) {
      this.acc -= 1
      this.advance()
    }
    if (this.dropAt !== null) {
      this.dropClock += delta
      if (this.dropClock > DROP_WINDOW_MS) this.loseRadio()
    }
  }

  private advance() {
    this.minute += 1
    const played = this.playedMinute()
    if (this.phase === 'first' && this.minute >= HALF) {
      this.phase = 'half'
      this.ctx.bus.emit('sound', { kind: 'whistle', blasts: 2 })
      this.halftime()
    } else if (this.phase === 'half' && this.minute >= HALF + INTERVAL) {
      this.phase = 'second'
      this.ctx.bus.emit('sound', { kind: 'whistle', blasts: 1 })
      this.ctx.bus.emit('toast', { text: 'מחצית שנייה.', tone: 'plain' })
    } else if (this.phase === 'second' && played >= FULL) {
      this.phase = 'over'
      this.ctx.bus.emit('sound', { kind: 'whistle', blasts: 3 })
      this.ctx.bus.emit('sound', { kind: 'roar', big: 1.4 })
      this.ctx.bus.emit('sound', { kind: 'radio', on: false })
      this.hooks.onBoard(TransistorNet.finalBoard(this.anchor))
      this.hooks.onOver()
      return
    }
    const total = this.anchor.match?.scoredFor ?? 0
    const nextGoal = GOAL_AT[this.goals]
    if (nextGoal !== undefined && this.goals < total && played >= nextGoal && this.phase !== 'half') {
      this.goals += 1
      this.ctx.bus.emit('sound', { kind: 'roar' })
      this.goal()
    }
    this.pushBoard()
  }

  /** match minute with the interval taken out */
  private playedMinute(): number {
    return this.minute > HALF ? Math.max(HALF, this.minute - INTERVAL) : this.minute
  }

  private yavneNow(): YavneState {
    const played = this.playedMinute()
    let state: YavneState = 'level'
    for (const step of YAVNE_AT) if (played >= step.minute) state = step.state
    return state
  }

  /** what a radio with `delay` minutes of lag would say about Yavne right now */
  private yavneHeard(delay: number): YavneState {
    const played = Math.max(0, this.playedMinute() - delay)
    let state: YavneState = 'level'
    for (const step of YAVNE_AT) if (played >= step.minute) state = step.state
    return state
  }

  /** the one question, answered from CANONICAL state — the child never sees this directly */
  private promotedNow(): boolean {
    const margin = { level: 0, ahead: 1, further: 2 }[this.yavneNow()]
    return this.goals > margin
  }

  /** …and from what he KNOWS, which is what he shouts */
  private promotedKnown(): boolean | null {
    if (this.known.yavne === 'unknown') return null
    const margin = { level: 0, ahead: 1, further: 2 }[this.known.yavne]
    return this.known.hapoel > margin
  }

  private goal() {
    const state = this.ctx.engine.state
    this.known.hapoel = this.goals
    this.scene.cameras.main.flash(420, 255, 252, 246)
    this.scene.cameras.main.shake(500, 0.006)
    this.ctx.bus.emit('toast', { text: this.goals === 1 ? 'שער! היציע קופץ.' : 'עוד אחד!', tone: 'red' })
    this.ctx.engine.dispatch({ t: 'redheart.changed', key: 'footballLove', delta: 2 })

    // The child who did the arithmetic wrong celebrates too early (brief §16).
    if (this.goals === 1 && state.flags['math:wrong'] && !state.flags['net:tooEarly']) {
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'net:tooEarly' })
      this.say([
        { who: 'פוגי', text: 'עלינו!' },
        { who: 'אוהד', text: 'עוד לא!' },
        { who: null, text: 'הוא לא מסתכל עליך. הוא מסתכל על הרדיו של מישהו אחר.' },
      ])
    }
    // The fourth is the one the radio does not survive (brief §19).
    if (this.goals === 4 && !state.flags['radio:lost'] && !state.flags['radio:saved']) {
      this.dropRadio()
    }
    // The sixth is the release — and the callback (brief §20).
    if (this.goals === 6 && state.flags['math:six'] && !this.saidSix) {
      this.saidSix = true
      this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'net:six' })
      this.scene.time.delayedCall(1400, () =>
        this.say([
          { who: null, text: 'שש. הוא מסתובב אליך לאט.' },
          { who: 'קובי', text: 'אל תגיד כלום.' },
          { who: null, text: 'אתה מחייך. לא אומר כלום.' },
        ]),
      )
    }
  }

  private halftime() {
    if (this.halfSaid) return
    this.halfSaid = true
    this.ctx.bus.emit('toast', { text: 'מחצית. כולם מחשבים. אף אחד לא מסכים.', tone: 'plain' })
  }

  private dropRadio() {
    if (!this.hooks.radioAt()) return
    this.dropAt = this.minute
    this.dropClock = 0
    this.hooks.onDrop(true)
    this.say([
      { who: null, text: 'בקפיצה של השער הרביעי משהו נופל. שחור, קטן. הרדיו של אבא, בין הרגליים, בין הניירות.' },
      { who: 'קובי', text: 'הרדיו! פוגי — הרדיו!' },
    ])
  }

  private loseRadio() {
    this.dropAt = null
    this.hooks.onDrop(false)
    this.ctx.engine.dispatch(
      { t: 'flag.raised', flag: 'radio:lost' },
      { t: 'relationship.changed', who: 'kobi', axis: 'tension', delta: 2 },
    )
    this.say([
      { who: null, text: 'מישהו דרך עליו. ואז עוד מישהו. כשהגעת, נשארה רק האנטנה.' },
      { who: 'קובי', text: 'עזוב. תשאל אנשים. היום כולם רדיו.' },
    ])
  }

  /** the hotspot on the concrete was tapped */
  private saveRadio() {
    if (this.dropAt === null) return
    const quick = this.dropClock < DROP_WINDOW_MS * 0.45
    this.dropAt = null
    this.hooks.onDrop(false)
    this.ctx.engine.dispatch(
      { t: 'flag.raised', flag: 'radio:saved' },
      { t: 'item.gained', item: 'transistor' },
      { t: 'redheart.changed', key: 'familyTradition', delta: 4 },
    )
    this.say(
      quick
        ? [
            { who: null, text: 'האנטנה עוד יותר מכופפת. הוא עובד.' },
            { who: 'קובי', text: 'יופי. תחזיק אותו אתה. יש לך ידיים יותר טובות.' },
          ]
        : [
            { who: null, text: 'מצאת אותו מתחת לנעל של מישהו. הוא עובד. בערך. בין רעש לרעש.' },
            { who: 'קובי', text: 'תחזיק חזק. ותקרב לאוזן.' },
          ],
    )
  }

  /**
   * מה הוא אמר? — a source, spoken to. Everything here is generated from the three
   * states above and from the source's latency; nothing is a line about a number the
   * archive does not hold.
   */
  talk(id: string) {
    const state = this.ctx.engine.state
    const roll = rollerFor(state)
    if (id === 'net:floor') {
      this.saveRadio()
      return
    }
    if (this.phase === 'over') return

    if (id === 'net:kobi') {
      const lost = Boolean(state.flags['radio:lost'])
      const held = Boolean(state.flags['radio:saved'])
      const fresh = this.known.from === 'radio' && this.known.yavneAt > this.minute - 4 && this.known.yavne !== this.yavneHeard(1)
      if (fresh && !state.flags['net:toldKobi']) {
        // He knows something his father's radio has not played yet (brief §17).
        this.ctx.engine.dispatch({ t: 'flag.raised', flag: 'net:toldKobi' })
        this.say([
          { who: 'פוגי', text: `אבא — ${YAVNE_LABEL[this.known.yavne]}` },
          { who: 'קובי', text: 'מאיפה אתה יודע?' },
          { who: 'פוגי', text: 'הרדיו של ההוא.' },
          { who: null, text: 'הוא מסתכל עליך שנייה יותר מדי. ואז מקרב את הרדיו שלו לאוזן, לבדוק.' },
        ])
        return
      }
      if (lost) {
        this.say([{ who: 'קובי', text: 'אין רדיו. תלך תשמע ותחזור. אתה הרדיו שלי עכשיו.' }])
        return
      }
      const heard = this.yavneHeard(held ? 0 : 1)
      this.learn(heard, 'kobi')
      const answer = this.promotedKnown()
      this.say([
        { who: 'קובי', text: YAVNE_LABEL[heard] },
        { who: 'קובי', text: answer === null ? 'אז עוד לא יודעים.' : answer ? 'אז כרגע — עולים. כרגע.' : 'אז כרגע — לא. צריך עוד.' },
      ])
      return
    }
    if (id === 'net:radio') {
      // Crowd noise: sometimes you hear nothing, and you stand closer and try again.
      if (roll.chance(0.25)) {
        this.ctx.engine.dispatch({ t: 'rng.consumed', count: roll.consumed })
        this.say([{ who: null, text: 'הרדיו שלו מתחת לרעש. שומעים "…יבנה…" ולא יותר. תתקרב, תנסה שוב.' }])
        return
      }
      this.ctx.engine.dispatch({ t: 'rng.consumed', count: roll.consumed })
      const heard = this.yavneHeard(3)
      this.learn(heard, 'radio')
      this.say([
        { who: null, text: 'אתה מקרב את הראש לרדיו שלו. הוא לא זז. ככה זה היום.' },
        { who: 'אוהד עם רדיו', text: YAVNE_LABEL[heard] },
      ])
      return
    }
    if (id === 'net:brain') {
      const heard = this.yavneHeard(3)
      const margin = { level: 0, ahead: 1, further: 2 }[heard]
      const up = this.goals > margin
      this.say([
        { who: 'אוהד שיודע', text: up ? 'לפי החשבון שלי — עולים. אבל החשבון שלי לפי הרדיו של ההוא, והרדיו של ההוא איטי.' : 'לפי החשבון שלי — עוד לא. צריך עוד אחד לפחות. אולי שניים.' },
        { who: null, text: 'הוא בטוח. הוא תמיד בטוח. זה לא אומר שהוא צודק.' },
      ])
      return
    }
    if (id === 'net:kids' || id === 'net:ofir') {
      const truth = this.yavneNow()
      const wrong = roll.chance(0.5)
      this.ctx.engine.dispatch({ t: 'rng.consumed', count: roll.consumed })
      const text = wrong
        ? roll.pick(['יבנה מפסידה! שמעתי!', 'נתניה השוותה, אח שלי אמר!', 'ביבנה עצרו את המשחק!']) ?? 'יבנה מפסידה!'
        : YAVNE_LABEL[truth]
      this.ctx.engine.dispatch({ t: 'flag.set', flag: 'rumor:last', value: text })
      const who = id === 'net:ofir' ? 'אופיר' : 'ילד'
      this.say([
        { who, text },
        { who: null, text: wrong ? 'הוא שמע את זה ממישהו ששמע את זה ממישהו.' : 'הוא צודק, במקרה. גם הוא לא יודע את זה.' },
      ])
      return
    }
  }

  private learn(state: YavneState, from: string) {
    this.known.yavne = state
    this.known.yavneAt = this.minute
    this.known.from = from
    this.ctx.engine.dispatch({ t: 'flag.set', flag: 'net:known', value: state })
  }

  private say(lines: Say[]) {
    this.ctx.dialogue.startLines(lines)
  }

  pushBoard() {
    const match = this.anchor.match
    if (!match) return
    const label =
      this.phase === 'first' ? 'מחצית ראשונה' : this.phase === 'half' ? 'מחצית' : this.phase === 'second' ? 'מחצית שנייה' : 'סיום'
    const board: NetBoard = {
      homeHe: match.atHome ? US_HE : match.opponentHe,
      awayHe: match.atHome ? match.opponentHe : US_HE,
      homeScore: match.atHome ? this.goals : 0,
      awayScore: match.atHome ? 0 : this.goals,
      labelHe: label,
      scored: this.goals > 0,
      over: this.phase === 'over',
    }
    const signature = `${label}|${this.goals}`
    if (signature === this.lastBoard) return
    this.lastBoard = signature
    this.hooks.onBoard(board)
  }

  /** the truth, for the tests and for nobody on the terrace */
  debugState() {
    return { minute: this.minute, phase: this.phase, goals: this.goals, yavne: this.yavneNow(), promoted: this.promotedNow(), known: { ...this.known } }
  }
}
