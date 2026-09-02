import { characterName } from './characters'
import { resolvePureLove, type PureLoveResolution } from './pure-love'
import type { LifeEvent } from './events'
import {
  RED_HEART_IDS,
  relationshipOf,
  type CharacterId,
  type LifeState,
  type PersonalityId,
  type RedHeartId,
  type WellbeingId,
} from './types'

/**
 * הפרופיל — a person, described. Never a row of progress bars.
 *
 * Rule 15 of the brief and §33 of the systems pass agree: the numbers exist, and the
 * player must never be given them. A bar invites optimisation; optimisation is the death
 * of a life simulation, because the moment `courage: 62` is on screen the player stops
 * asking what they would do and starts asking what raises the number.
 *
 * So this module is a translator, and it is the ONLY translator. Every screen that wants
 * to describe the protagonist asks here and gets Hebrew back. Nothing renders a value.
 *
 * The bands are deliberately coarse — four steps, not ten — because a fifth step is a
 * number wearing a word, and a player who can feel the difference between "a bit" and
 * "quite" is a player counting again.
 */

export type Band = 0 | 1 | 2 | 3

export function band(value: number): Band {
  if (value >= 75) return 3
  if (value >= 45) return 2
  if (value >= 20) return 1
  return 0
}

// --- wellbeing --------------------------------------------------------------------
// Written as sentences about a child on a specific afternoon, not as adjectives about a
// personality. "Tired" is a state; "he has been running since noon" is a life.

const WELLBEING_WORDS: Record<WellbeingId, [string, string, string, string]> = {
  happiness: ['שקט מדי', 'בסדר', 'במצב רוח טוב', 'לא מפסיק לחייך'],
  stress: ['רגוע', 'קצת דרוך', 'לחוץ', 'לא מצליח להירגע'],
  loneliness: ['מוקף אנשים', 'לא לבד', 'קצת לבד', 'לבד'],
  belonging: ['זר במקום הזה', 'מתחיל להכיר', 'שייך', 'זה הרחוב שלו'],
  exhaustion: ['רענן', 'התחיל להתעייף', 'עייף', 'גמור'],
  regret: ['בלי חרטות', 'משהו קטן מציק', 'חושב על מה שלא עשה', 'היה עושה את זה אחרת'],
}

export function wellbeingWord(state: LifeState, key: WellbeingId): string {
  return WELLBEING_WORDS[key][band(state.wellbeing[key])]
}

/** The two or three things worth saying about how the child is, right now. */
export function wellbeingReading(state: LifeState): string[] {
  const ranked: WellbeingId[] = ['exhaustion', 'stress', 'belonging', 'loneliness', 'regret', 'happiness']
  return ranked
    .filter((key) => band(state.wellbeing[key]) >= (key === 'happiness' ? 2 : 1))
    .slice(0, 3)
    .map((key) => wellbeingWord(state, key))
}

// --- personality ------------------------------------------------------------------
// One line per axis, and only the axes that have actually moved. A child with nothing
// to say about him yet gets the honest answer: nothing yet.

const PERSONALITY_WORDS: Record<PersonalityId, string> = {
  independence: 'הולך לבד',
  courage: 'לא מפחד לשאול',
  responsibility: 'זוכר מה ביקשו ממנו',
  reliability: 'מגיע כשאמר שיגיע',
  empathy: 'שם לב לאנשים',
  streetSmarts: 'מכיר את השכונה',
  curiosity: 'רוצה לדעת',
  impulsiveness: 'לא חושב פעמיים',
  stubbornness: 'לא מוותר',
  sociability: 'מדבר עם כולם',
  riskTolerance: 'לוקח סיכון',
}

export function personalityReading(state: LifeState): string[] {
  return (Object.keys(PERSONALITY_WORDS) as PersonalityId[])
    .map((key) => ({ key, value: state.personality[key] }))
    .filter((entry) => entry.value >= 35)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
    .map((entry) => PERSONALITY_WORDS[entry.key])
}

// --- the Red Heart ----------------------------------------------------------------

export const RED_HEART_WORDS: Record<RedHeartId, string> = {
  footballLove: 'כדורגל',
  basketballLove: 'כדורסל',
  troubleAffinity: 'צרות',
  professionalFootball: 'לשחק באמת',
  community: 'אנשים',
  terraceCulture: 'היציע',
  travelDrive: 'לנסוע',
  historyMemory: 'לזכור',
  familyTradition: 'הבית',
  loyaltyReturn: 'להחזיר',
}

export type RedHeartReading = { key: RedHeartId; labelHe: string; band: Band }

/**
 * The Red Heart as it should be drawn: an ordered set of named pulls with a coarse
 * weight, so a screen can compose a shape out of them and never a percentage.
 */
export function redHeartReading(state: LifeState): RedHeartReading[] {
  return RED_HEART_IDS.map((key) => ({
    key,
    labelHe: RED_HEART_WORDS[key],
    band: band(state.redHeart[key]),
  })).filter((entry) => entry.band > 0)
}

// --- relationships ----------------------------------------------------------------

export type RelationshipReading = {
  who: CharacterId
  nameHe: string
  /** the one sentence that is true about the two of you right now */
  lineHe: string
  /** for the drawing: how close, and how much friction */
  close: Band
  friction: Band
}

/**
 * Two axes, one sentence. This is where Relationship 2.0 earns its keep: a bond that is
 * high and a trust that is low is a real thing that a single number could not say, and
 * it is exactly the state a child is in after lying to his father.
 */
export function relationshipReading(state: LifeState, who: CharacterId): RelationshipReading {
  const rel = relationshipOf(state, who)
  const lineHe = (() => {
    if (rel.tension >= 45 && rel.bond >= 55) return 'קרוב, וכועס'
    if (rel.trust <= 25 && rel.familiarity >= 50) return 'מכיר אותך טוב מדי כדי להאמין לך'
    if (rel.bond >= 70) return 'שלך'
    if (rel.distance >= 55) return 'רחוק'
    if (rel.bond >= 40) return 'חבר'
    if (rel.familiarity >= 40) return 'מוכר מהרחוב'
    return 'עוד לא ממש מכיר אותך'
  })()
  return {
    who,
    nameHe: characterName(who),
    lineHe,
    close: band(rel.bond),
    friction: band(rel.tension),
  }
}

// --- the whole card ---------------------------------------------------------------

export type LifeProfile = {
  nameHe: string
  age: number
  placeHe: string
  wellbeing: string[]
  personality: string[]
  redHeart: RedHeartReading[]
  relationships: RelationshipReading[]
  pureLove: PureLoveResolution
  memories: number
  redBox: number
}

export function buildProfile(
  state: LifeState,
  events: readonly LifeEvent[],
  cast: readonly CharacterId[],
  placeHe: string,
): LifeProfile {
  return {
    nameHe: state.identity.name,
    age: state.age,
    placeHe,
    wellbeing: wellbeingReading(state),
    personality: personalityReading(state),
    redHeart: redHeartReading(state),
    relationships: cast
      .map((who) => relationshipReading(state, who))
      .filter((entry) => entry.close > 0 || entry.friction > 0),
    pureLove: resolvePureLove(state, events),
    memories: state.memories.length,
    redBox: state.redBox.length,
  }
}
