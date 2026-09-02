import type { BondId, ItemId, LocationId, TraitId } from '../types'
import type { Condition } from '../world/types'

/**
 * הטקסט — the authored fiction, and the line it must not cross.
 *
 * Everything in `lib/life/content/` is INVENTED: a family, a friend, a kiosk, a
 * Saturday. None of it is history and none of it may pretend to be. The rule the whole
 * project runs on (rule 11, brief §24) applies here in its sharpest form, because
 * dialogue is exactly where a fabricated fact would slip in unnoticed — a scoreline in
 * a father's mouth reads as research.
 *
 * So the content layer states no date, no opponent, no result, no scorer and no
 * attendance. Where the game needs a fact it asks for the `HistoricalAnchor`, which came
 * from the canonical archive with its source attached. Kobi says there is a match. He
 * does not say who against, because nobody has told this project who against.
 *
 * A conversation and an interaction are the same structure on purpose: examining a
 * cupboard is a conversation with a cupboard, and building two systems for that would
 * be two systems to keep in step.
 */

export type Say = {
  /** null is narration — the child's own eyes, not a speaker */
  who: string | null
  text: string
}

export type Effect =
  | { e: 'flag'; flag: string }
  | { e: 'money'; agorot: number; why: string }
  | { e: 'give'; item: ItemId; count?: number }
  | { e: 'take'; item: ItemId; count?: number }
  | { e: 'bond'; who: BondId; delta: number }
  | { e: 'trait'; trait: TraitId; delta: number }
  | { e: 'time'; minutes: number }
  | { e: 'toast'; text: string; tone?: 'plain' | 'red' }
  | { e: 'goto'; node: string }
  | { e: 'travel'; to: LocationId; spawn: string }
  | { e: 'minigame'; id: 'football' }
  | { e: 'memory'; item: ItemId; id: string }
  | { e: 'attend' }
  | { e: 'missed' }
  | { e: 'ending'; id: string }

export type ChoiceDef = {
  id: string
  text: string
  /** when this fails the choice is shown greyed with `noteHe`, never hidden — a door you
      can see you cannot open is information; a door that is not drawn is a dead end */
  when?: Condition
  noteHe?: string
  then: Effect[]
}

export type Branch = {
  when?: Condition
  lines: Say[]
  choices?: ChoiceDef[]
  /** applied when the branch's lines finish and there are no choices */
  then?: Effect[]
}

export type Conversation = {
  id: string
  /** the name in the box; a prop has none */
  nameHe?: string | null
  /** first matching branch wins, so order is the priority order */
  branches: Branch[]
}
