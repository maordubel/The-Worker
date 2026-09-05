import type { HistoricalAnchor } from '../anchors'
import type { RandomEncounter } from '../encounters'
import type { LifeOpportunity } from '../opportunities'
import type { NPCScheduleEntry } from '../schedules'
import type { LifeState } from '../types'
import type { Beat } from './beats'

import { AMBIENT_1986, type AmbientActor } from './ambient1986'
import { ENDINGS, OBJECTIVES, PORTRAIT, type EndingCard } from './chapter1986'
import { ENDINGS_1990, OBJECTIVES_1990, PORTRAIT_1990 } from './chapter1990'
import { ENDINGS_1991, OBJECTIVES_1991, PORTRAIT_1991, TIP_OFF } from './chapter1991'
import { BEATS_1993, ENCOUNTERS_1993, ENDINGS_1993, objective1993, PORTRAIT_1993, TIP_OFF_93 } from './chapter1993cup'
import { BEATS_GALIL, ENDINGS_GALIL, objectiveGalil, PORTRAIT_GALIL } from './chapter1993galil'
import { BEATS_SINAI, ENDINGS_SINAI, objectiveSinai, PORTRAIT_SINAI } from './chapter1995sinai'
import { BEATS_ARMY, ENDINGS_ARMY, objectiveArmy, PORTRAIT_ARMY } from './chapter1996army'
import { BEATS_HALL, ENDINGS_HALL, objectiveHall, PORTRAIT_HALL } from './chapter1997basket'
import {
  BEATS_A2, BEATS_A3, BEATS_A4, BEATS_A5, BEATS_A6, BEATS_A7,
  ENDINGS_A2, ENDINGS_A3, ENDINGS_A4, ENDINGS_A5, ENDINGS_A6, ENDINGS_A7,
  objectiveA2, objectiveA3, objectiveA4, objectiveA5, objectiveA6, objectiveA7,
  PORTRAIT_STAGE_A,
} from './chapterStageA'
import { BEATS_LACES, ENDINGS_LACES, objectiveLaces, PORTRAIT_LACES } from './chapter1998laces'
import { BEATS_SEED, ENDINGS_SEED, objectiveSeed, PORTRAIT_SEED } from './chapter1999basket'
import { BEATS_CUP99, ENDINGS_CUP99, objectiveCup99, PORTRAIT_CUP99 } from './chapter1999cup'
import { BEATS_DOUBLE, BEATS_TITLE, ENDINGS_DOUBLE, ENDINGS_TITLE, objectiveDouble, objectiveTitle, PORTRAIT_2000 } from './chapter2000double'
import { HERO80_WALK, KID_WALK } from '../runtime/art'
import { ENCOUNTERS_1986 } from './encounters1986'
import { ENCOUNTERS_1990 } from './encounters1990'
import { ENCOUNTERS_1991 } from './encounters1991'
import { OPPORTUNITIES_1986 } from './opportunities1986'
import { OPPORTUNITIES_1990 } from './opportunities1990'
import { OPPORTUNITIES_1991 } from './opportunities1991'
import { SCHEDULE_1986 } from './schedules1986'
import { SCHEDULE_1990 } from './schedules1990'
import { SCHEDULE_1991 } from './schedules1991'

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
  /**
   * הביטים — what the chapter does by itself, as rows (`beats.ts`). Chapters after 1991
   * have no branch in `WorldScene`; everything they play unprompted is here.
   */
  beats?: readonly Beat[]
  /**
   * The clock the chapter's history happens on, for the HUD's second clock and the
   * objective: minute of the anchor's start, or null for a chapter with no fixed hour.
   */
  eventMinute?: number | null
}

/**
 * הגוף לפי גיל — the four figures the September sheets drew for him, as player records.
 * Each walks on two frames (side + walk) the way 1990 does; only the eight-year-old and
 * the twelve-year-old have an eight-frame cycle.
 */
export const TEEN: PlayerFigure = {
  pose: { down: 'teen', downSide: 'teen-3q', side: 'teen-side', up: 'teen-back' },
  walk: ['teen-side', 'teen-walk'],
  scale: 1.22,
}
export const SOLDIER: PlayerFigure = {
  pose: { down: 'soldier', downSide: 'soldier-stand', side: 'soldier-side', up: 'soldier-back' },
  walk: ['soldier-side', 'soldier-march'],
  scale: 1.26,
}
export const YOUNG_MAN: PlayerFigure = {
  pose: { down: 'hero90', downSide: 'hero90-3q', side: 'hero90-side', up: 'hero90-back' },
  walk: ['hero90-side', 'hero90-walk'],
  scale: 1.26,
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
    walk: KID_WALK,
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
    if (matchOver && !state.flags['entry:granted']) return OBJECTIVES_1990.heardIt
    if (state.flags['entry:granted']) return null
    if (sceneId === 'bloomfield-outside' && state.minute >= 16 * 60 + 48 && !matchOver) return OBJECTIVES_1990.halfGate
    if (sceneId === 'bloomfield-outside' || sceneId === 'route') return OBJECTIVES_1990.gate7
    if (state.flags['kobi:left']) return OBJECTIVES_1990.leftWithout
    if (state.flags['knows:math']) return OBJECTIVES_1990.leaving
    return OBJECTIVES_1990.howMany
  },
  cutscene: null,
  player: {
    pose: { down: 'hero80', downSide: 'hero80-3q', side: 'hero80-side', up: 'hero80-back' },
    walk: HERO80_WALK,
    scale: 1.12,
  },
  memoryPrefix: '1990',
  portraits: PORTRAIT_1990,
}

/**
 * 1991 — the same boy, ten months later, on a Monday.
 *
 * Everything about this record is a small edit to 1990 and one large idea: the day is
 * not built around a match the father is taking him to. The timetable belongs to a
 * school; the windows compete with each other rather than with a kickoff; the objective
 * chain runs note → homework → permission → the road → the step → a clock on a wall.
 * `cutscene` is null and will stay null until the archive holds film of 11.3.1991 that
 * anybody has the right to play (rule 11): the derby is a row, and a row is enough.
 */
export const ERA_1991: Era = {
  chapter: '1991',
  year: 1991,
  anchorKey: '1991',
  schedule: SCHEDULE_1991,
  opportunities: OPPORTUNITIES_1991,
  encounters: ENCOUNTERS_1991,
  ambient: AMBIENT_1986,
  endings: ENDINGS_1991,
  objective: (state, sceneId) => {
    if (state.chapterDone) return OBJECTIVES_1991.morning
    if (state.flags['derby:over']) return state.flags['walked:home'] ? null : OBJECTIVES_1991.home
    if (sceneId === 'ussishkin-hall') {
      if (state.flags['curfew:now']) return OBJECTIVES_1991.curfew
      if (state.flags['spot:asked'] && !state.flags['spot:held'] && !state.flags['spot:lost']) {
        return OBJECTIVES_1991.spot
      }
      return state.minute < TIP_OFF ? OBJECTIVES_1991.tipoff : null
    }
    if (sceneId === 'classroom' && !state.flags['school:done']) return OBJECTIVES_1991.note
    if (state.flags['permission:yes'] || state.flags['sneak:ready']) return OBJECTIVES_1991.onTheWay
    if (state.flags['hw:done'] || state.flags['hw:half'] || state.flags['hw:faked']) {
      return OBJECTIVES_1991.permission
    }
    if (state.flags['hw:given'] && state.flags['school:done']) return OBJECTIVES_1991.homework
    return OBJECTIVES_1991.school
  },
  cutscene: null,
  player: {
    pose: { down: 'hero80', downSide: 'hero80-3q', side: 'hero80-side', up: 'hero80-back' },
    walk: HERO80_WALK,
    // A centimetre on 1990. He is not a new person; he is the same one, in March.
    scale: 1.14,
  },
  memoryPrefix: '1991',
  portraits: PORTRAIT_1991,
}

/**
 * 1993 — fifteen, and the day is not built around a father at all.
 *
 * The first chapter written as DATA: no branch in `WorldScene`, everything the day does
 * by itself is a row in `BEATS_1993`, and the chapter file holds its people, its ends and
 * its objective. `teen` is the figure the September sheets drew for him at this age.
 */
export const ERA_1993_CUP: Era = {
  chapter: '1993-cup',
  year: 1993,
  anchorKey: '1993-cup',
  schedule: [],
  opportunities: [],
  encounters: ENCOUNTERS_1993,
  ambient: AMBIENT_1986,
  endings: ENDINGS_1993,
  objective: (state, sceneId) => objective1993(state, sceneId),
  cutscene: null,
  player: TEEN,
  memoryPrefix: '1993-cup',
  portraits: PORTRAIT_1993,
  beats: BEATS_1993,
  eventMinute: TIP_OFF_93,
}

export const ERA_1993_GALIL: Era = {
  chapter: '1993-galil',
  year: 1993,
  anchorKey: '1993-galil',
  schedule: [],
  opportunities: [],
  encounters: [],
  ambient: AMBIENT_1986,
  endings: ENDINGS_GALIL,
  objective: (state, sceneId) => objectiveGalil(state, sceneId),
  cutscene: null,
  player: TEEN,
  memoryPrefix: '1993-galil',
  portraits: PORTRAIT_GALIL,
  beats: BEATS_GALIL,
  eventMinute: null,
}

export const ERA_1995_SINAI: Era = {
  chapter: '1995-sinai',
  year: 1994,
  anchorKey: '1994-cup',
  schedule: [],
  opportunities: [],
  encounters: [],
  ambient: AMBIENT_1986,
  endings: ENDINGS_SINAI,
  objective: (state) => objectiveSinai(state),
  cutscene: null,
  player: TEEN,
  memoryPrefix: '1995-sinai',
  portraits: PORTRAIT_SINAI,
  beats: BEATS_SINAI,
  eventMinute: null,
}

export const ERA_1996_ARMY: Era = {
  chapter: '1996-army',
  year: 1996,
  anchorKey: '1997-sale',
  schedule: [],
  opportunities: [],
  encounters: [],
  ambient: AMBIENT_1986,
  endings: ENDINGS_ARMY,
  objective: (state, sceneId) => objectiveArmy(state, sceneId),
  cutscene: null,
  player: SOLDIER,
  memoryPrefix: '1996-army',
  portraits: PORTRAIT_ARMY,
  beats: BEATS_ARMY,
  eventMinute: null,
}

/**
 * B7–B11 — the second half of the decade, one record each.
 *
 * They share a shape on purpose: no timetable (the beats ARE the timetable), no
 * opportunities, no random encounters. A chapter that is a single evening does not need
 * a neighbourhood that goes on without you; it needs the four people who matter placed
 * where the beat says, and a clock that only moves when the story does.
 */
function stageB(chapter: string, year: number, anchorKey: string, extra: Pick<Era, 'endings' | 'objective' | 'portraits' | 'beats' | 'player'>): Era {
  return {
    chapter,
    year,
    anchorKey,
    schedule: [],
    opportunities: [],
    encounters: [],
    ambient: AMBIENT_1986,
    cutscene: null,
    memoryPrefix: chapter,
    eventMinute: null,
    ...extra,
  }
}

export const ERA_1997_BASKET = stageB('1997-basket', 1997, '1997-relegation', {
  endings: ENDINGS_HALL,
  objective: (state) => objectiveHall(state),
  portraits: PORTRAIT_HALL,
  beats: BEATS_HALL,
  player: YOUNG_MAN,
})

export const ERA_1998_LACES = stageB('1998-laces', 1998, '1998', {
  endings: ENDINGS_LACES,
  objective: (state, sceneId) => objectiveLaces(state, sceneId),
  portraits: PORTRAIT_LACES,
  beats: BEATS_LACES,
  player: YOUNG_MAN,
})

export const ERA_1999_BASKET = stageB('1999-basket', 1999, '1999-relegation', {
  endings: ENDINGS_SEED,
  objective: (state, sceneId) => objectiveSeed(state, sceneId),
  portraits: PORTRAIT_SEED,
  beats: BEATS_SEED,
  player: YOUNG_MAN,
})

export const ERA_1999_CUP = stageB('1999-cup', 1999, '1999-cup', {
  endings: ENDINGS_CUP99,
  objective: (state, sceneId) => objectiveCup99(state, sceneId),
  portraits: PORTRAIT_CUP99,
  beats: BEATS_CUP99,
  player: YOUNG_MAN,
})

export const ERA_2000_TITLE = stageB('2000-title', 2000, '2000-title', {
  endings: ENDINGS_TITLE,
  objective: (state, sceneId) => objectiveTitle(state, sceneId),
  portraits: PORTRAIT_2000,
  beats: BEATS_TITLE,
  player: YOUNG_MAN,
})

export const ERA_2000_DOUBLE = stageB('2000-double', 2000, '2000-cup', {
  endings: ENDINGS_DOUBLE,
  objective: (state, sceneId) => objectiveDouble(state, sceneId),
  portraits: PORTRAIT_2000,
  beats: BEATS_DOUBLE,
  player: YOUNG_MAN,
})

/** the six days before the Saturday — the same boy, the same rooms, a beat each */
function stageA(chapter: string, year: number, extra: Pick<Era, 'endings' | 'objective' | 'beats'>): Era {
  return {
    chapter,
    year,
    anchorKey: '1986',
    schedule: [],
    opportunities: [],
    encounters: [],
    ambient: AMBIENT_1986,
    cutscene: null,
    player: ERA_1986.player,
    memoryPrefix: chapter,
    portraits: PORTRAIT_STAGE_A,
    eventMinute: null,
    ...extra,
  }
}

export const ERA_A2 = stageA('a2-alley', 1984, { endings: ENDINGS_A2, objective: (state, sceneId) => objectiveA2(state, sceneId), beats: BEATS_A2 })
export const ERA_A3 = stageA('a3-hall', 1984, { endings: ENDINGS_A3, objective: (state, sceneId) => objectiveA3(state, sceneId), beats: BEATS_A3 })
export const ERA_A4 = stageA('a4-shirt', 1985, { endings: ENDINGS_A4, objective: (state, sceneId) => objectiveA4(state, sceneId), beats: BEATS_A4 })
export const ERA_A5 = stageA('a5-first', 1985, { endings: ENDINGS_A5, objective: (state, sceneId) => objectiveA5(state, sceneId), beats: BEATS_A5 })
export const ERA_A6 = stageA('a6-radio', 1986, { endings: ENDINGS_A6, objective: (state, sceneId) => objectiveA6(state, sceneId), beats: BEATS_A6 })
export const ERA_A7 = stageA('a7-week', 1986, { endings: ENDINGS_A7, objective: (state, sceneId) => objectiveA7(state, sceneId), beats: BEATS_A7 })

const ERAS: Record<string, Era> = {
  'a2-alley': ERA_A2,
  'a3-hall': ERA_A3,
  'a4-shirt': ERA_A4,
  'a5-first': ERA_A5,
  'a6-radio': ERA_A6,
  'a7-week': ERA_A7,
  '1986': ERA_1986,
  '1990': ERA_1990,
  '1991': ERA_1991,
  '1993-cup': ERA_1993_CUP,
  '1993-galil': ERA_1993_GALIL,
  '1995-sinai': ERA_1995_SINAI,
  '1996-army': ERA_1996_ARMY,
  '1997-basket': ERA_1997_BASKET,
  '1998-laces': ERA_1998_LACES,
  '1999-basket': ERA_1999_BASKET,
  '1999-cup': ERA_1999_CUP,
  '2000-title': ERA_2000_TITLE,
  '2000-double': ERA_2000_DOUBLE,
}

/** The prologue and any unknown chapter fall through to 1986 — the chapter the game started as. */
export function eraFor(chapter: string): Era {
  return ERAS[chapter] ?? ERA_1986
}

export const ERA_KEYS = Object.keys(ERAS)

export type AnchorSet = Record<string, HistoricalAnchor>

export function anchorFor(anchors: AnchorSet, era: Era, fallback: HistoricalAnchor): HistoricalAnchor {
  return anchors[era.anchorKey] ?? fallback
}
