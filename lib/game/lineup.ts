import 'server-only'

import lineupsFile from '@/content/manual/lineups.json'
import { footballPeople, nameOf, rng, shuffle } from './archive'

/**
 * Match XI — place eleven players on the pitch and have the placement graded per slot.
 *
 * Follows the schema Maor supplied: percentage coordinates, a formation, a player bank
 * of the eleven plus distractors, and three-state per-slot feedback.
 *
 * Two deliberate departures from that schema, both required by the brand spec:
 *   1. The states are NOT green / yellow / red. Yellow is forbidden outright, and no
 *      state may be carried by colour alone — each one has a mark and a word as well.
 *   2. The pitch is a paper diagram in ink on sheet, not a green field. "FIFA
 *      aesthetics: neon cards, grass" is on the explicitly-rejected list.
 */

export type SlotId = string

export type PitchSlot = {
  slotId: SlotId
  /** GK · CB · LB · RB · CM · LW · ST … shown under the slot */
  roleHe: string
  /** percentages, origin at the defensive end */
  x: number
  y: number
}

export type Formation = { name: string; slots: PitchSlot[] }

const gk = (y = 94): PitchSlot => ({ slotId: 'GK', roleHe: 'שוער', x: 50, y })

/**
 * Spread a row around the centre with a fixed gap, narrowing only when a wide row
 * would push a chip past the touchline. Two forwards then sit like two forwards
 * instead of hugging the flanks, and a five-man midfield still fits on a 320px screen.
 */
const MAX_GAP = 19
const USABLE = 70

function row(prefix: string, roles: string[], y: number): PitchSlot[] {
  const count = roles.length
  const gap = count === 1 ? 0 : Math.min(MAX_GAP, USABLE / (count - 1))
  const start = 50 - (gap * (count - 1)) / 2
  return roles.map((roleHe, index) => ({
    slotId: `${prefix}${index + 1}`,
    roleHe,
    x: Math.round(start + gap * index),
    y,
  }))
}

export const FORMATIONS: Record<string, Formation> = {
  '4-4-2': {
    name: '4-4-2',
    slots: [
      gk(),
      ...row('D', ['מגן ימני', 'בלם', 'בלם', 'מגן שמאלי'], 72),
      ...row('M', ['כנף ימני', 'קשר', 'קשר', 'כנף שמאלי'], 45),
      ...row('F', ['חלוץ', 'חלוץ'], 18),
    ],
  },
  '4-3-3': {
    name: '4-3-3',
    slots: [
      gk(),
      ...row('D', ['מגן ימני', 'בלם', 'בלם', 'מגן שמאלי'], 72),
      ...row('M', ['קשר', 'קשר', 'קשר'], 47),
      ...row('F', ['כנף ימני', 'חלוץ מרכזי', 'כנף שמאלי'], 18),
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      gk(),
      ...row('D', ['מגן ימני', 'בלם', 'בלם', 'מגן שמאלי'], 74),
      ...row('H', ['קשר הגנתי', 'קשר הגנתי'], 55),
      ...row('M', ['כנף ימני', 'קשר התקפי', 'כנף שמאלי'], 34),
      ...row('F', ['חלוץ'], 14),
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      gk(),
      ...row('D', ['בלם', 'בלם', 'בלם'], 74),
      ...row('M', ['מגן כנף', 'קשר', 'קשר', 'קשר', 'מגן כנף'], 46),
      ...row('F', ['חלוץ', 'חלוץ'], 16),
    ],
  },
}

export const DEFAULT_FORMATION = '4-4-2'

/* ------------------------------------------------------------------ content */

type LineupRecord = {
  matchId: string
  titleHe: string
  subtitleHe?: string
  formation: string
  /** slotId -> player display name */
  xi: Record<string, string>
  /** extra names offered alongside the eleven */
  distractors?: string[]
  sourceTitle?: string
  sourceUrl?: string
  confidence?: number
}

type LineupFile = {
  confidence: number
  source: { title: string; url?: string | null }
  records: LineupRecord[]
}

const CONFIDENCE_FLOOR = 2

function verified(): LineupRecord[] {
  const file = lineupsFile as unknown as LineupFile
  return file.records.filter(
    (record) => (record.confidence ?? file.confidence) >= CONFIDENCE_FLOOR,
  )
}

export type Challenge = {
  matchId: string
  titleHe: string
  subtitleHe: string | null
  formation: Formation
  bank: string[]
  sourceTitle: string
  sourceUrl: string | null
}

/** Null when no verified XI exists — the screen then says exactly that. */
export function dealChallenge(seed: number): Challenge | null {
  const records = verified()
  const record = records[Math.floor(rng(seed)() * records.length)]
  if (!record) return null

  const file = lineupsFile as unknown as LineupFile
  const formation = FORMATIONS[record.formation] ?? FORMATIONS[DEFAULT_FORMATION]
  const eleven = Object.values(record.xi)
  const extras = record.distractors ?? []

  return {
    matchId: record.matchId,
    titleHe: record.titleHe,
    subtitleHe: record.subtitleHe ?? null,
    formation: formation as Formation,
    bank: shuffle([...new Set([...eleven, ...extras])], rng(seed * 3 + 7)),
    sourceTitle: record.sourceTitle ?? file.source.title,
    sourceUrl: record.sourceUrl ?? file.source.url ?? null,
  }
}

/* ------------------------------------------------------------------ grading */

export type SlotStatus = 'exact' | 'wrong_slot' | 'not_in_xi' | 'empty'

export type SlotVerdict = {
  slotId: SlotId
  name: string | null
  status: SlotStatus
  /** where the player actually belonged, revealed after grading */
  belongsToSlotId: SlotId | null
}

export type LineupVerdict = {
  exact: number
  total: number
  slots: SlotVerdict[]
  /** the real XI, revealed only after a submission */
  solution: Array<{ slotId: SlotId; name: string }>
  sourceTitle: string
  sourceUrl: string | null
}

/** Graded on the server against the verified XI. The answer is never in the payload. */
export function gradeLineup(
  seed: number,
  picks: Record<SlotId, string | null>,
): LineupVerdict | null {
  const records = verified()
  const record = records[Math.floor(rng(seed)() * records.length)]
  if (!record) return null

  const file = lineupsFile as unknown as LineupFile
  const formation = (FORMATIONS[record.formation] ?? FORMATIONS[DEFAULT_FORMATION]) as Formation
  const slotOfName = new Map(Object.entries(record.xi).map(([slot, name]) => [name, slot]))

  const slots: SlotVerdict[] = formation.slots.map((slot) => {
    const name = picks[slot.slotId] ?? null
    if (name === null) {
      return { slotId: slot.slotId, name: null, status: 'empty', belongsToSlotId: null }
    }
    const belongsTo = slotOfName.get(name) ?? null
    if (belongsTo === slot.slotId) {
      return { slotId: slot.slotId, name, status: 'exact', belongsToSlotId: belongsTo }
    }
    return {
      slotId: slot.slotId,
      name,
      status: belongsTo === null ? 'not_in_xi' : 'wrong_slot',
      belongsToSlotId: belongsTo,
    }
  })

  return {
    exact: slots.filter((slot) => slot.status === 'exact').length,
    total: formation.slots.length,
    slots,
    solution: Object.entries(record.xi).map(([slotId, name]) => ({ slotId, name })),
    sourceTitle: record.sourceTitle ?? file.source.title,
    sourceUrl: record.sourceUrl ?? file.source.url ?? null,
  }
}

/**
 * With no verified XI, the pitch still runs as a free build using the people the
 * archive does hold — so the screen is never a dead end.
 */
export function freeBuildBank(): string[] {
  // Football only. The Ussishkin names are basketball and must never appear on a
  // football pitch (CLAUDE.md rules 14 and 16).
  return footballPeople.map((person) => person.fullNameHe)
}

export function hasVerifiedLineup(): boolean {
  return verified().length > 0
}

export { nameOf }
