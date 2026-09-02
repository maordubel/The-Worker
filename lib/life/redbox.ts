import type { LifeEvent } from './events'
import { Roller } from './rng'
import type { ItemId, LifeState, RedBoxItem, RedBoxRarity } from './types'
import { meets, type Condition } from './world/types'

/**
 * הקופסה האדומה — where a life keeps what it decided to keep.
 *
 * Not an inventory. An inventory holds what you are carrying; this holds what you chose
 * not to throw away, and the difference is the whole point of the object. It is the
 * spine of the forty-year game: the ticket stub from the Saturday you were eight is
 * still in there in 2026, and the reason it is there is that YOU put it there.
 *
 * So the chapter must not hand everybody the same thing. What ends up in the box depends
 * on how the afternoon actually went — what you bought, who helped you, whether you got
 * in — and the candidate list below is filtered by that before anything is rolled.
 */

export type RedBoxCandidate = {
  id: string
  titleHe: string
  noteHe: string
  item: ItemId
  rarity: RedBoxRarity
  weight: number
  when?: Condition
}

export const RARITY_LABEL: Record<RedBoxRarity, string> = {
  common: 'רגיל',
  uncommon: 'לא מובן מאליו',
  rare: 'נדיר',
  legendary: 'משהו אחר',
  unique_memory: 'רק שלך',
}

/**
 * What this Saturday could leave behind. Every one of them requires something to have
 * actually happened — you cannot keep a ticket stub you never had.
 */
export const CANDIDATES_1986: RedBoxCandidate[] = [
  {
    id: 'stub',
    titleHe: 'ספח כרטיס',
    noteHe: 'קרטון קטן, נקרע בכניסה. הצד עם המספר עוד קריא.',
    item: 'ticket-stub',
    rarity: 'rare',
    weight: 5,
    when: { hasItem: 'ticket-stub' },
  },
  {
    id: 'scarf',
    titleHe: 'צעיף',
    noteHe: 'מישהו שם לך אותו על הצוואר ולא ביקש אותו בחזרה.',
    item: 'scarf',
    rarity: 'legendary',
    weight: 5,
    when: { hasItem: 'scarf' },
  },
  {
    id: 'card',
    titleHe: 'קלף שחקן',
    noteHe: 'שחקן באדום. הפינות כבר מקופלות.',
    item: 'football-card',
    rarity: 'uncommon',
    weight: 4,
    when: { hasItem: 'football-card' },
  },
  {
    id: 'paper',
    titleHe: 'עמוד ספורט',
    noteHe: 'קרעת רק את העמוד. השאר הלך לפח.',
    item: 'newspaper',
    rarity: 'uncommon',
    weight: 4,
    when: { hasItem: 'newspaper' },
  },
  {
    id: 'coin',
    titleHe: 'מטבע',
    noteHe: 'מצאת אותו בביוב ולא הוצאת אותו על כלום.',
    item: 'coin',
    rarity: 'common',
    weight: 2,
    when: { hasItem: 'coin' },
  },
  {
    id: 'folded',
    titleHe: 'נייר מקופל',
    noteHe: 'הרמת את זה מהרצפה בדרך הביתה. אתה כבר לא זוכר למה.',
    item: 'folded-paper',
    rarity: 'common',
    weight: 1,
  },
]

/**
 * One object, chosen off the seed from what the day actually produced.
 *
 * The weight table exists so the rare thing stays rare without ever being impossible,
 * and the `when` filter is what stops the box from lying: nothing goes in that the
 * player did not get their hands on.
 */
export function pickRedBoxItem(
  state: LifeState,
  candidates: readonly RedBoxCandidate[] = CANDIDATES_1986,
): { item: RedBoxItem | null; consumed: number } {
  const roller = new Roller(state.rng)
  const eligible = candidates.filter((candidate) => meets(state, candidate.when))
  const picked = roller.weighted(eligible, (candidate) => candidate.weight)
  if (!picked) return { item: null, consumed: roller.consumed }
  return {
    item: {
      id: `${state.year}-${picked.id}`,
      year: state.year,
      atMinute: state.minute,
      sourceEventId: `chapter:${state.chapter}`,
      titleHe: picked.titleHe,
      noteHe: picked.noteHe,
      item: picked.item,
      rarity: picked.rarity,
    },
    consumed: roller.consumed,
  }
}

export function keepEvents(item: RedBoxItem | null, consumed: number): LifeEvent[] {
  const events: LifeEvent[] = [{ t: 'rng.consumed', count: consumed }]
  if (item) events.push({ t: 'redbox.item_added', item })
  return events
}
