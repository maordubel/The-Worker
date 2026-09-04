import type { HistoricalAnchor } from '../anchors'
import type { RandomEncounter } from '../encounters'
import type { LifeOpportunity } from '../opportunities'
import type { NPCScheduleEntry } from '../schedules'
import type { LifeState } from '../types'

import { AMBIENT_1986, type AmbientActor } from './ambient1986'
import { ENDINGS, OBJECTIVES, PORTRAIT, type EndingCard } from './chapter1986'
import { ENDINGS_1990, OBJECTIVES_1990, PORTRAIT_1990 } from './chapter1990'
import { ENCOUNTERS_1986 } from './encounters1986'
import { ENCOUNTERS_1990 } from './encounters1990'
import { OPPORTUNITIES_1986 } from './opportunities1986'
import { OPPORTUNITIES_1990 } from './opportunities1990'
import { SCHEDULE_1986 } from './schedules1986'
import { SCHEDULE_1990 } from './schedules1990'

/**
 * העידן — everything about a chapter that the runtime used to import by name.
 *
 * `WorldScene` was written for one Saturday and imported that Saturday's timetable, its
 * opportunities, its encounters, its endings and its objectives at the top of the file,
 * by their 1986 names. That was correct for a game with one chapter and it is the one
 * thing that made a second chapter impossible without a second scene — which brief §52
 * forbids in so many words. So the chapter is data: one record per era, looked up from
 * `state.chapter`, and the scene asks the record instead of the import.
 *
 * What is NOT here is deliberate. The rooms (`world/scenes.ts`) are shared — 1990 walks
 * the same street, redressed — and so is the dialogue registry, keyed by conversation id.
 * An era owns the PEOPLE in the rooms (`era` on actors and layers), the timetable, and the
 * shape of its day; it does not own the geography.
 */
export type PlayerFigure = {
  pose: { down: string; downSide: string; side: string; up: string }
  walk: readonly string[]
  /**
   * How tall this year's boy stands against the room's band, which was measured for the
   * eight-year-old. Twelve is a head taller than eight; the rooms do not know that.
   */
  scale?: number
}

export type Era = {
  chapter: string
  year: number
  /** the anchor this chapter's history hangs on — resolved server-side, keyed by chapter */
  anchorKey: string
  schedule: readonly NPCScheduleEntry[]
  opportunities: readonly LifeOpportunity[]
  encounters: readonly RandomEncounter[]
  ambient: readonly AmbientActor[]
  endings: Record<string, EndingCard>
  /** the one vague line under the clock — see `chapter1986.ts` OBJECTIVES */
  objective: (state: LifeState, sceneId: string, matchOver: boolean) => string | null
  /** the archival film this chapter may open onto, by registry id; null when there is none */
  cutscene: string | null
  player: PlayerFigure
  /** prefix for memory ids this chapter writes — `1986-the-goal` */
  memoryPrefix: string
  /** speaker → portrait plate, for this chapter's faces */
  portraits: Record<string, string>
}

export const ERA_1986: Era = {
  chapter: '1986',
  year: 1986,
  anchorKey: '1986',
  schedule: SCHEDULE_1986,
  opportunities: OPPORTUNITIES_1986,
  encounters: ENCOUNTERS_1986,
  ambient: AMBIENT_1986,
  endings: ENDINGS,
  objective: (state, sceneId, matchOver) => {
    if (state.flags['found:kobi']) return null
    if (sceneId === 'bloomfield-inside' && matchOver) return OBJECTIVES.findKobi
    if (state.flags['entry:granted']) return null
    if (sceneId === 'bloomfield-outside') return OBJECTIVES.atGround
    if (state.flags['kobi:left']) return OBJECTIVES.onTheWay
    if (state.flags['knows:match']) return OBJECTIVES.matchToday
    if ((state.inventory['house-key'] ?? 0) > 0) return OBJECTIVES.askDad
    return OBJECTIVES.findKey
  },
  cutscene: '1986-championship',
  player: {
    pose: { down: 'pogi', downSide: 'pogi-3q', side: 'pogi-side', up: 'pogi-back' },
    walk: ['pogi-side', 'pogi-walk'],
  },
  memoryPrefix: '1986',
  portraits: PORTRAIT,
}

/**
 * 1990 — twelve, and the same boy. `hero80` is the turnaround Maor drew of Pogi grown out
 * of the first chapter: the tracksuit top, the same face four years on. Two walk frames,
 * for the same reason as 1986 — a matching sheet or nothing.
 */
export const ERA_1990: Era = {
  chapter: '1990',
  year: 1990,
  anchorKey: '1990',
  schedule: SCHEDULE_1990,
  opportunities: OPPORTUNITIES_1990,
  encounters: ENCOUNTERS_1990,
  // The same neighbourhood traffic: the ambient list is location-keyed and nameless, and
  // the people crossing a street in 1990 are the same shapes as in 1986.
  ambient: AMBIENT_1986,
  endings: ENDINGS_1990,
  objective: (state, sceneId, matchOver) => {
    if (state.flags['found:kobi']) return state.flags['walked:home'] ? null : OBJECTIVES_1990.walkHome
    if (sceneId === 'bloomfield-inside' && matchOver) return OBJECTIVES_1990.findKobi
    if (sceneId === 'bloomfield-inside') return OBJECTIVES_1990.promoted
    if (state.flags['entry:granted']) return null
    if (sceneId === 'bloomfield-outside' || sceneId === 'route') return OBJECTIVES_1990.gate7
    if (state.flags['kobi:left']) return OBJECTIVES_1990.leftWithout
    if (state.flags['knows:math']) return OBJECTIVES_1990.leaving
    return OBJECTIVES_1990.howMany
  },
  cutscene: null,
  player: {
    pose: { down: 'hero80', downSide: 'hero80-3q', side: 'hero80-side', up: 'hero80-back' },
    walk: ['hero80-side', 'hero80-walk'],
    scale: 1.12,
  },
  memoryPrefix: '1990',
  portraits: PORTRAIT_1990,
}

const ERAS: Record<string, Era> = { '1986': ERA_1986, '1990': ERA_1990 }

/** The prologue and any unknown chapter fall through to 1986 — the chapter the game started as. */
export function eraFor(chapter: string): Era {
  return ERAS[chapter] ?? ERA_1986
}

export const ERA_KEYS = Object.keys(ERAS)

export type AnchorSet = Record<string, HistoricalAnchor>

export function anchorFor(anchors: AnchorSet, era: Era, fallback: HistoricalAnchor): HistoricalAnchor {
  return anchors[era.anchorKey] ?? fallback
}
