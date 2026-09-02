import type { HistoricalAnchor } from '../anchors'
import { PORTRAIT } from '../content/chapter1986'
import { DIALOGUE } from '../content/dialogue'
import { OPPORTUNITY } from '../content/opportunities1986'
import type { ChoiceDef, Conversation, ConversationShot, Effect, Say } from '../content/script'
import type { LifeEngine } from '../engine'
import type { LifeEvent } from '../events'
import { acceptEvents, isAvailable, resolveOutcome } from '../opportunities'
import { keepEvents, pickRedBoxItem } from '../redbox'
import { meets } from '../world/types'

import type { DialogueChoice, LifeBus } from './bus'

/**
 * מנהל השיחה — reads the content, writes to the life, and stops there.
 *
 * A conversation is data (`content/dialogue.ts`); this walks it. The separation is what
 * keeps rule 7 of the brief enforceable: dialogue can hand out money, an item, a flag or
 * twenty minutes, and it CANNOT do anything else — there is no effect in the vocabulary
 * that moves the player, opens a door or wins the chapter without the world agreeing.
 *
 * Effects that leave the conversation (`travel`, `minigame`, `ending`) are not applied
 * here at all: they are handed to the scene through hooks, because a text box has no
 * business changing scene and a runtime that lets it will eventually do it mid-line.
 */

export type DialogueHooks = {
  travel(to: string, spawn: string): void
  minigame(id: 'football'): void
  ending(id: string): void
  /** the scene stops the world while this is true */
  onOpen(open: boolean): void
  /** how this beat is framed; the scene owns the camera, the content owns the shot */
  shot?(shot: ConversationShot | null): void
}

export class DialogueRunner {
  private conversation: Conversation | null = null
  private lines: Say[] = []
  private index = 0
  private pendingChoices: ChoiceDef[] | null = null
  private pendingThen: Effect[] = []
  private onDone: (() => void) | null = null

  constructor(
    private readonly engine: LifeEngine,
    private readonly bus: LifeBus,
    private hooks: DialogueHooks,
    private anchor: HistoricalAnchor,
  ) {}

  setHooks(hooks: DialogueHooks) {
    this.hooks = hooks
  }

  get open(): boolean {
    return this.conversation !== null
  }

  /**
   * An ad-hoc sequence with no conversation behind it — the prologue, and one day a
   * cutscene. It shares the box, the pacing and the advance button with everything else,
   * because a second way to show a line is a second way for a line to look wrong.
   */
  startLines(lines: readonly Say[], done?: () => void): void {
    this.conversation = { id: '__lines__', branches: [] }
    this.lines = lines.map((line) => ({ ...line, text: this.fill(line.text) }))
    this.index = 0
    this.pendingChoices = null
    this.pendingThen = []
    this.onDone = done ?? null
    this.hooks.onOpen(true)
    this.show()
  }

  /** Returns false when the conversation id does not exist — a missing prop talks about nothing. */
  start(id: string): boolean {
    const conversation = DIALOGUE[id]
    if (!conversation) return false
    const branch = conversation.branches.find((candidate) => meets(this.engine.state, candidate.when))
    if (!branch) return false

    this.conversation = conversation
    this.lines = branch.lines.map((line) => ({ ...line, text: this.fill(line.text) }))
    this.index = 0
    this.pendingChoices = branch.choices ?? null
    this.pendingThen = branch.then ?? []
    this.hooks.onOpen(true)
    this.hooks.shot?.(branch.shot ?? null)
    this.show()
    return true
  }

  /** The only substitution the content layer gets, and it is a canonical fact. */
  private fill(text: string): string {
    return text.replaceAll('{anchor}', this.anchor.headlineHe)
  }

  advance() {
    if (!this.conversation) return
    if (this.index < this.lines.length - 1) {
      this.index += 1
      this.show()
      return
    }
    if (this.pendingChoices) {
      this.showChoices()
      return
    }
    this.finish(this.pendingThen)
  }

  choose(id: string) {
    const choice = this.pendingChoices?.find((candidate) => candidate.id === id)
    if (!choice) return
    if (!meets(this.engine.state, choice.when)) return
    this.pendingChoices = null
    // The log is a biography, so what was CHOSEN is a row in it — separately from what
    // the choice did. Nothing derives state from this; it is what makes a second
    // playthrough legible in the debug panel and to any future telemetry.
    this.engine.dispatch({
      t: 'dialogue.choice_made',
      conversation: this.conversation?.id ?? '',
      choice: choice.id,
    })
    this.finish(choice.then)
  }

  /**
   * ללכת באמצע — the player walked away, and the game let them.
   *
   * A conversation you cannot leave is the oldest trap in the genre, and this build had
   * it: talk to somebody twice, land on a branch whose choices you no longer qualify for,
   * and the box stays on screen with nothing you can press. It was reported by the person
   * who owns this game, in those words, and the fix is not a better branch — it is that
   * leaving is always allowed, on every line, in every conversation.
   *
   * Leaving applies NOTHING. No `then`, no chained node, no time. Nobody gives a child
   * anything for walking off mid-sentence, so the state after this call is exactly the
   * state before the box opened — which also means the conversation can simply be started
   * again, from its first line, by pressing the button once more.
   */
  leave() {
    if (!this.conversation) return
    this.close()
  }

  close() {
    const done = this.onDone
    this.onDone = null
    this.conversation = null
    this.lines = []
    this.pendingChoices = null
    this.pendingThen = []
    this.bus.emit('dialogue', null)
    this.hooks.shot?.(null)
    this.hooks.onOpen(false)
    if (done) done()
  }

  private show() {
    const line = this.lines[this.index]
    if (!line) {
      this.finish(this.pendingThen)
      return
    }
    const last = this.index === this.lines.length - 1
    this.bus.emit('dialogue', {
      lines: [line],
      portrait: line.who ? (PORTRAIT[line.who] ?? null) : null,
      choices: last && this.pendingChoices ? this.renderChoices(this.pendingChoices) : undefined,
    })
  }

  private showChoices() {
    const line = this.lines[this.lines.length - 1]
    this.bus.emit('dialogue', {
      lines: line ? [line] : [],
      portrait: line?.who ? (PORTRAIT[line.who] ?? null) : null,
      choices: this.renderChoices(this.pendingChoices ?? []),
    })
  }

  private renderChoices(choices: readonly ChoiceDef[]): DialogueChoice[] {
    return choices.map((choice) => {
      const enabled = meets(this.engine.state, choice.when)
      return {
        id: choice.id,
        text: choice.text,
        enabled,
        ...(enabled ? {} : { noteHe: choice.noteHe ?? '' }),
      }
    })
  }

  /** Apply, then either chain into another node or shut the box. */
  private finish(effects: readonly Effect[]) {
    const events: LifeEvent[] = []
    let goto: string | null = null
    const after: Array<() => void> = []
    /** effects an opportunity's own outcome contributed, applied in the same pass */
    const extra: Effect[] = []

    for (const effect of effects) {
      switch (effect.e) {
        case 'flag':
          events.push({ t: 'flag.raised', flag: effect.flag })
          break
        case 'money':
          events.push({ t: 'money.changed', agorot: effect.agorot, why: effect.why })
          break
        case 'give':
          events.push({ t: 'item.gained', item: effect.item, count: effect.count ?? 1 })
          break
        case 'take':
          events.push({ t: 'item.lost', item: effect.item, count: effect.count ?? 1 })
          break
        case 'bond':
          events.push({ t: 'bond.shifted', who: effect.who, delta: effect.delta })
          break
        case 'trait':
          events.push({ t: 'trait.shifted', trait: effect.trait, delta: effect.delta })
          break
        case 'time':
          events.push({ t: 'clock.advanced', minutes: effect.minutes })
          break
        case 'memory':
          events.push({
            t: 'memory.kept',
            memory: {
              id: effect.id,
              item: effect.item,
              atMinute: this.engine.state.minute,
              year: this.engine.state.year,
              anchorId: this.anchor.id,
            },
          })
          events.push({ t: 'flag.raised', flag: 'memory:first' })
          break
        case 'attend':
          events.push({ t: 'anchor.attended', anchorId: this.anchor.id })
          break
        case 'missed':
          events.push({ t: 'anchor.missed', anchorId: this.anchor.id })
          break
        case 'toast':
          after.push(() => this.bus.emit('toast', { text: effect.text, tone: effect.tone ?? 'plain' }))
          break
        case 'goto':
          goto = effect.node
          break
        case 'travel':
          after.push(() => this.hooks.travel(effect.to, effect.spawn))
          break
        case 'minigame':
          after.push(() => this.hooks.minigame(effect.id))
          break
        case 'ending':
          after.push(() => this.hooks.ending(effect.id))
          break

        // --- the systems pass ---------------------------------------------------
        case 'wellbeing':
          events.push({ t: 'wellbeing.changed', key: effect.key, delta: effect.delta })
          break
        case 'personality':
          events.push({ t: 'personality.shifted', key: effect.key, delta: effect.delta })
          break
        case 'redheart':
          events.push({ t: 'redheart.changed', key: effect.key, delta: effect.delta })
          break
        case 'rel':
          events.push({ t: 'relationship.changed', who: effect.who, axis: effect.axis, delta: effect.delta })
          break
        case 'remember':
          events.push({
            t: 'relationship.memory_added',
            memory: {
              characterId: effect.who,
              eventId: effect.eventId,
              significance: effect.significance ?? 'notable',
              year: this.engine.state.year,
              atMinute: this.engine.state.minute,
            },
          })
          break
        case 'flagValue':
          events.push({ t: 'flag.set', flag: effect.flag, value: effect.value })
          break

        /**
         * לקחת הזדמנות — a conversation may CLOSE a window, and only that.
         *
         * The window itself is defined in the opportunity file with its cost and its
         * outcomes; the line of dialogue names it. That is what stops the same afternoon
         * being balanced in two places, and it is why a choice cannot quietly give
         * itself a cheaper price than the window it belongs to.
         */
        case 'seize': {
          const opportunity = OPPORTUNITY[effect.opportunity]
          if (!opportunity) break
          if (!isAvailable(this.engine.state, opportunity)) break
          for (const event of acceptEvents(opportunity)) events.push(event)
          const outcome = resolveOutcome(this.engine.state, opportunity)
          if (outcome) extra.push(...outcome.effects)
          break
        }

        /**
         * מה נשאר — the red box roll, off the seed, out of what the day actually gave
         * the player. Two saves that ended the same way can still keep different things.
         */
        case 'keep': {
          const { item, consumed } = pickRedBoxItem(this.engine.state)
          for (const event of keepEvents(item, consumed)) events.push(event)
          break
        }

        default:
          break
      }
    }

    if (events.length > 0) this.engine.dispatch(...events)
    // An outcome cannot itself open a window, so one level of recursion is the whole
    // depth this can ever reach — and a cycle is therefore impossible by construction.
    if (extra.length > 0) this.finishOutcome(extra)

    if (goto) {
      this.conversation = null
      const started = this.start(goto)
      if (!started) this.close()
    } else {
      this.close()
    }

    for (const run of after) run()
  }

  /**
   * Apply a list of effects with no conversation around them — a random encounter's
   * consequence, after its line has been read. It deliberately cannot travel, chain or
   * end the chapter: those belong to the scene, and an encounter that could end a
   * chapter would be a lottery rather than a life.
   */
  applyEffects(effects: readonly Effect[]) {
    this.finishOutcome(effects)
  }

  /** An opportunity outcome's effects: the same vocabulary, minus the ones that leave. */
  private finishOutcome(effects: readonly Effect[]) {
    const safe = effects.filter(
      (effect) => effect.e !== 'goto' && effect.e !== 'travel' && effect.e !== 'ending' && effect.e !== 'seize',
    )
    const events: LifeEvent[] = []
    for (const effect of safe) {
      switch (effect.e) {
        case 'flag':
          events.push({ t: 'flag.raised', flag: effect.flag })
          break
        case 'money':
          events.push({ t: 'money.changed', agorot: effect.agorot, why: effect.why })
          break
        case 'give':
          events.push({ t: 'item.gained', item: effect.item, count: effect.count ?? 1 })
          break
        case 'take':
          events.push({ t: 'item.lost', item: effect.item, count: effect.count ?? 1 })
          break
        case 'bond':
          events.push({ t: 'bond.shifted', who: effect.who, delta: effect.delta })
          break
        case 'trait':
          events.push({ t: 'trait.shifted', trait: effect.trait, delta: effect.delta })
          break
        case 'time':
          events.push({ t: 'clock.advanced', minutes: effect.minutes })
          break
        case 'wellbeing':
          events.push({ t: 'wellbeing.changed', key: effect.key, delta: effect.delta })
          break
        case 'personality':
          events.push({ t: 'personality.shifted', key: effect.key, delta: effect.delta })
          break
        case 'redheart':
          events.push({ t: 'redheart.changed', key: effect.key, delta: effect.delta })
          break
        case 'rel':
          events.push({ t: 'relationship.changed', who: effect.who, axis: effect.axis, delta: effect.delta })
          break
        case 'remember':
          events.push({
            t: 'relationship.memory_added',
            memory: {
              characterId: effect.who,
              eventId: effect.eventId,
              significance: effect.significance ?? 'notable',
              year: this.engine.state.year,
              atMinute: this.engine.state.minute,
            },
          })
          break
        default:
          break
      }
    }
    if (events.length > 0) this.engine.dispatch(...events)
  }
}
