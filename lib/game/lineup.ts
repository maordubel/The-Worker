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
  /**
   * True when the source lists the XI in the conventional order but does not state
   * each player's position. Grading then falls back to the LINE (keeper / defence /
   * midfield / attack) rather than the exact slot — inferring a right-back from list
   * order would be a claim the source does not make.
   */
  positionsInferred?: boolean
  /**
   * False when the SOURCE itself marks the XI unverified. The Chelsea away eleven has
   * one slot the wiki stamps VERIFY, so the record is kept for the archive and withheld
   * from the game: an XI with a guessed slot grades a player wrong for being right.
   */
  playable?: boolean
  /**
   * The bench and the manager, where the source names them.
   *
   * Held in the archive and not offered in the bank: a substitute is not in the XI, and
   * putting one in the pool of names to place would grade a player wrong for knowing
   * that he came on. They belong in the record because the source says them, and the
   * moment a screen wants to print "who came on, and who sent him" they are there.
   */
  benchHe?: string[]
  coachHe?: string
  noteHe?: string
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

/**
 * An XI with no spare names is not a puzzle, it is a sorting exercise.
 *
 * Eleven correct names for eleven slots can be finished by elimination without knowing
 * a single one of them, so a record like that grades everybody as an expert. Every
 * curated record in the file carries five to seven extra names; the 1985/86 decider
 * arrived with none and was dealt anyway, which is the defect this floor exists to make
 * impossible. A record that cannot field five real spare names is kept in the archive
 * and withheld from the game, exactly like one the source marks unverified.
 *
 * Five, not "some": it is what the corpus already does, so the number is the house's
 * own practice rather than a threshold somebody picked today.
 */
const DISTRACTOR_FLOOR = 5

function verified(): LineupRecord[] {
  const file = lineupsFile as unknown as LineupFile
  return file.records.filter(
    (record) =>
      (record.confidence ?? file.confidence) >= CONFIDENCE_FLOOR &&
      record.playable !== false &&
      (record.distractors?.length ?? 0) >= DISTRACTOR_FLOOR,
  )
}

export type Challenge = {
  matchId: string
  titleHe: string
  subtitleHe: string | null
  formation: Formation
  bank: string[]
  positionsInferred: boolean
  sourceTitle: string
  sourceUrl: string | null
}

/** GK · D · M · F — the band a slot belongs to. */
export function lineOf(slotId: SlotId): string {
  return slotId.replace(/\d+$/, '')
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
    positionsInferred: record.positionsInferred ?? false,
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
    if (belongsTo === null) {
      return { slotId: slot.slotId, name, status: 'not_in_xi', belongsToSlotId: null }
    }
    // Exact means the exact slot, unless the source only supports the line.
    const matched = record.positionsInferred
      ? lineOf(belongsTo) === lineOf(slot.slotId)
      : belongsTo === slot.slotId
    return {
      slotId: slot.slotId,
      name,
      status: matched ? 'exact' : 'wrong_slot',
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
