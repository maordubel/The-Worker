import type {
  BondId,
  CharacterId,
  ItemId,
  LocationId,
  PersonalityId,
  RedHeartId,
  RelationshipAxis,
  RelationshipMemory,
  TraitId,
  WellbeingId,
} from '../types'
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
  /**
   * Hold up a real document.
   *
   * The only verb in this vocabulary that shows the player something nobody in this
   * project drew: a ticket somebody kept, or a page of מעריב ספורט printed the morning
   * before the match. `art` is a key in `DOC` and the runtime will not accept anything
   * else, which is what stops this becoming a general-purpose image popup.
   */
  | { e: 'doc'; art: string; captionHe?: string }
  | { e: 'goto'; node: string }
  | { e: 'travel'; to: LocationId; spawn: string }
  | { e: 'minigame'; id: 'football' }
  | { e: 'memory'; item: ItemId; id: string }
  | { e: 'attend' }
  | { e: 'missed' }
  | { e: 'ending'; id: string }
  // --- the systems pass -------------------------------------------------------------
  // Everything below writes to a model that did not exist when this chapter was first
  // authored. The old verbs still work and still mean what they meant — `trait` routes
  // itself into personality or the Red Heart — so nothing had to be rewritten. These
  // exist for the lines that want to be precise: a father losing trust while the bond
  // holds, a supporter putting the terrace into a child's head, a promise somebody will
  // remember two hours later.
  | { e: 'wellbeing'; key: WellbeingId; delta: number }
  | { e: 'personality'; key: PersonalityId; delta: number }
  | { e: 'redheart'; key: RedHeartId; delta: number }
  | { e: 'rel'; who: CharacterId; axis: RelationshipAxis; delta: number }
  | { e: 'remember'; who: CharacterId; eventId: string; significance?: RelationshipMemory['significance'] }
  /** seize a window that is currently open; the engine applies its cost and its outcome */
  | { e: 'seize'; opportunity: string }
  /** roll what this Saturday leaves in the red box, out of what actually happened */
  | { e: 'keep' }
  | { e: 'flagValue'; flag: string; value: boolean | string | number }

export type ChoiceDef = {
  id: string
  text: string
  /** when this fails the choice is shown greyed with `noteHe`, never hidden — a door you
      can see you cannot open is information; a door that is not drawn is a dead end */
  when?: Condition
  noteHe?: string
  then: Effect[]
}

/**
 * הבמאי כנתונים — how a conversation is SHOT, described beside what is said.
 *
 * Every conversation used to be framed the same way, which is why every conversation
 * felt the same. Cinematography written per scene would be worse: eleven places to fix
 * one mistake. So a beat is data — who the camera is on, how close, and for how long —
 * and one controller in the runtime executes it for every conversation in the game.
 */
export type ConversationShot = {
  focus: CharacterId | 'player' | 'both'
  framing: 'close' | 'medium' | 'ots' | 'wide'
  duration?: number
  gesture?: string
  /** how far the world's own sound steps back, 0..1 — never to silence */
  ambienceDuck?: number
}

export type Branch = {
  when?: Condition
  lines: Say[]
  /** the framing this branch is played in; absent means the world's default two-shot */
  shot?: ConversationShot
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
