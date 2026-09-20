import 'server-only'

import lineupsFile from '@/content/manual/lineups.json'
import { positionOf, takeFrom } from '@/lib/rotation/deck'
import type { SlotRole } from '@/lib/xi/roles'
import { footballPeople, nameOf, rng, shuffle } from './archive'
import { nameCore } from './roster-search'
import {
  COACH_NOTES,
  lineOf,
  type CoachNote,
  type CoachNoteKind,
  type LineupVerdict,
  type SlotId,
  type SlotVerdict,
} from './lineup-sheet'

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

export type PitchSlot = {
  slotId: SlotId
  /** GK · CB · LB · RB · CM · LW · ST … shown under the slot */
  roleHe: string
  /**
   * The slot's detailed role, as a code.
   *
   * It says what the FORMATION asks of this position and nothing about any player: gate
   * 1's scouting drawer maps it DOWN to the four canonical positions the archive
   * actually states, and never back. `lib/xi/roles.ts` is where that reasoning lives and
   * is worth reading before anybody adds a role here.
   *
   * Gate 3 ignores it — it grades by line, from `slotId` — so this is additive to the
   * quiz and load-bearing only for gate 1.
   */
  role: SlotRole
  /** percentages, origin at the defensive end */
  x: number
  y: number
}

export type Formation = { name: string; slots: PitchSlot[] }

const gk = (y = 94): PitchSlot => ({ slotId: 'GK', roleHe: 'שוער', role: 'GK', x: 50, y })

/**
 * Spread a row around the centre with a fixed gap, narrowing only when a wide row
 * would push a chip past the touchline. Two forwards then sit like two forwards
 * instead of hugging the flanks, and a five-man midfield still fits on a 320px screen.
 */
const MAX_GAP = 19
const USABLE = 70

/**
 * One position in a row: the Hebrew label the pitch prints, and the role code the
 * scouting drawer reads. They are written as a pair so that adding a position without
 * deciding what it accepts is a type error rather than a silent `undefined`.
 */
type RowSlot = [roleHe: string, role: SlotRole]

function row(prefix: string, roles: RowSlot[], y: number): PitchSlot[] {
  const count = roles.length
  const gap = count === 1 ? 0 : Math.min(MAX_GAP, USABLE / (count - 1))
  const start = 50 - (gap * (count - 1)) / 2
  return roles.map(([roleHe, role], index) => ({
    slotId: `${prefix}${index + 1}`,
    roleHe,
    role,
    x: Math.round(start + gap * index),
    y,
  }))
}

/*
 * The row order is the pitch's own: index 0 sits at the lowest inline-start, which in
 * an RTL layout is the RIGHT of the screen — so `מגן ימני` leads a back four and the
 * codes follow the same order. Changing one without the other would put a right back on
 * the left wing of every formation at once.
 */
export const FORMATIONS: Record<string, Formation> = {
  '4-4-2': {
    name: '4-4-2',
    slots: [
      gk(),
      ...row('D', [['מגן ימני', 'RB'], ['בלם', 'CB'], ['בלם', 'CB'], ['מגן שמאלי', 'LB']], 72),
      ...row('M', [['כנף ימני', 'RM'], ['קשר', 'CM'], ['קשר', 'CM'], ['כנף שמאלי', 'LM']], 45),
      ...row('F', [['חלוץ', 'ST'], ['חלוץ', 'ST']], 18),
    ],
  },
  '4-3-3': {
    name: '4-3-3',
    slots: [
      gk(),
      ...row('D', [['מגן ימני', 'RB'], ['בלם', 'CB'], ['בלם', 'CB'], ['מגן שמאלי', 'LB']], 72),
      ...row('M', [['קשר', 'CM'], ['קשר', 'CM'], ['קשר', 'CM']], 47),
      ...row('F', [['כנף ימני', 'RW'], ['חלוץ מרכזי', 'ST'], ['כנף שמאלי', 'LW']], 18),
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      gk(),
      ...row('D', [['מגן ימני', 'RB'], ['בלם', 'CB'], ['בלם', 'CB'], ['מגן שמאלי', 'LB']], 74),
      ...row('H', [['קשר הגנתי', 'DM'], ['קשר הגנתי', 'DM']], 55),
      ...row('M', [['כנף ימני', 'RW'], ['קשר התקפי', 'AM'], ['כנף שמאלי', 'LW']], 34),
      ...row('F', [['חלוץ', 'ST']], 14),
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      gk(),
      ...row('D', [['בלם', 'CB'], ['בלם', 'CB'], ['בלם', 'CB']], 74),
      ...row(
        'M',
        [['מגן כנף', 'RWB'], ['קשר', 'CM'], ['קשר', 'CM'], ['קשר', 'CM'], ['מגן כנף', 'LWB']],
        46,
      ),
      ...row('F', [['חלוץ', 'ST'], ['חלוץ', 'ST']], 16),
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

/**
 * מי ישב על הספסל — the substitutes the source names for THIS match, as plain names.
 *
 * `benchHe` is the record's own field and it is written the way a match report writes a
 * bench: `גילי לנדאו (נכנס בדקה 48)`. The minute belongs on the archive row and gets in
 * the way of a comparison, so the parenthetical is stripped with `nameCore` — the
 * archive's existing convention for a qualified name (rule 59), not a second one
 * invented here.
 *
 * Where the record names no bench this is empty, and `benchKnown` is what tells the
 * screen the difference between "nobody" and "the source does not say". Nothing is
 * inferred from a squad list, an era or a shirt number: a substitute is a claim about
 * one evening.
 */
function benchNames(record: LineupRecord): string[] {
  return (record.benchHe ?? []).map((entry) => nameCore(entry)).filter((name) => name !== '')
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

/*
 * The verdict's vocabulary now lives in `lib/game/lineup-sheet.ts`, which the board can
 * import at runtime — this file cannot, because it reads the answer. Re-exported here so
 * that every existing importer of `@/lib/game/lineup` keeps working and there is still
 * exactly one declaration of each (rule 59).
 */
export { lineOf, COACH_NOTES, MAX_LOCKS } from './lineup-sheet'
export type {
  SlotId,
  SlotStatus,
  SlotVerdict,
  LineupVerdict,
  CoachNote,
  CoachNoteKind,
} from './lineup-sheet'

/**
 * The match this round asks about.
 *
 * It used to be `records[Math.floor(rng(seed)() * records.length)]`, and that is worse
 * than it looks. `rng()`'s FIRST output is very nearly linear in the seed — for small
 * seeds the three xorshifts carry no bits between the shifted copies, so `rng(s)()`
 * works out to `(270369 × s mod 100000) / 100000`, a fixed −0.29631 ramp. With six
 * playable records, "play again with seed + 1" therefore walked a short fixed cycle
 * instead of drawing: seeds 1..10 give records 4, 2, 0, 4, 3, 1, 5, 3, 1, 0.
 *
 * A deck fixes both problems at once. Shuffling consumes the stream past its first
 * output, and the cursor walks the deck one match at a time, so six rounds use all six
 * records before any of them comes back.
 */
function chosen(seed: number, cursor: number) {
  const records = verified()
  const at = positionOf(seed, cursor, records.length, 1)
  return takeFrom(shuffle(records, rng(at.seed)), at.slot, 1)[0]
}

/** Null when no verified XI exists — the screen then says exactly that. */
export function dealChallenge(seed: number, cursor = 0): Challenge | null {
  const record = chosen(seed, cursor)
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

/** Graded on the server against the verified XI. The answer is never in the payload. */
export function gradeLineup(
  seed: number,
  picks: Record<SlotId, string | null>,
  cursor = 0,
): LineupVerdict | null {
  const record = chosen(seed, cursor)
  if (!record) return null

  const file = lineupsFile as unknown as LineupFile
  const formation = (FORMATIONS[record.formation] ?? FORMATIONS[DEFAULT_FORMATION]) as Formation
  const slotOfName = new Map(Object.entries(record.xi).map(([slot, name]) => [name, slot]))
  const bench = new Set(benchNames(record))

  const slots: SlotVerdict[] = formation.slots.map((slot) => {
    const name = picks[slot.slotId] ?? null
    if (name === null) {
      return {
        slotId: slot.slotId,
        name: null,
        status: 'empty',
        belongsToSlotId: null,
        bench: false,
      }
    }
    const belongsTo = slotOfName.get(name) ?? null
    if (belongsTo === null) {
      return {
        slotId: slot.slotId,
        name,
        status: 'not_in_xi',
        belongsToSlotId: null,
        bench: bench.has(name),
      }
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
      // A man who started cannot be a bench trap, whatever any other record says about
      // him. The flag is about THIS sheet.
      bench: false,
    }
  })

  return {
    exact: slots.filter((slot) => slot.status === 'exact').length,
    total: formation.slots.length,
    slots,
    solution: Object.entries(record.xi).map(([slotId, name]) => ({ slotId, name })),
    benchKnown: bench.size > 0,
    sourceTitle: record.sourceTitle ?? file.source.title,
    sourceUrl: record.sourceUrl ?? file.source.url ?? null,
  }
}

/* ------------------------------------------------------------------ the coach */

/**
 * אילו פתקים יש למאמן הזה — which notes this match can honestly hand out.
 *
 * Three kinds exist and only two of them are always available. `benchOn` counts the
 * substitutes a player has walked into, and four of the six playable records name a
 * bench while two do not — so for those two the note is not "0", it is a note that
 * cannot be written. Offering it anyway would print a zero that reads as a fact about
 * the match instead of a gap in the source (rule 11).
 *
 * The order is fixed, not drawn. The prototype picks a clue at random, which makes the
 * same board give different help on two runs of the same seed and makes the whole thing
 * untestable; a fixed ladder gives the cheap note first — how many starters are still
 * hanging up — and the sharper one second.
 */
function coachKindsFor(record: LineupRecord): CoachNoteKind[] {
  const kinds: CoachNoteKind[] = ['stillOut']
  if (benchNames(record).length > 0) kinds.push('benchOn')
  kinds.push('lineRight')
  return kinds
}

/**
 * פתק מהמאמן — computed against the verified XI, on the server, and only a NUMBER
 * crosses back.
 *
 * This is the same contract the grade has and it exists for the same reason: the note is
 * derived from the answer, so deriving it in the browser would put the answer in the
 * browser. A player asking for help twice gets notes 0 and 1 of `coachKindsFor`; asking
 * a third time gets nothing, and the screen says the notes are gone rather than dealing
 * a fourth one quietly.
 */
export function coachNote(
  seed: number,
  picks: Record<SlotId, string | null>,
  cursor = 0,
  index = 0,
): CoachNote | null {
  const record = chosen(seed, cursor)
  if (!record) return null
  if (index < 0 || index >= COACH_NOTES) return null

  const kinds = coachKindsFor(record)
  const kind = kinds[index % kinds.length] as CoachNoteKind

  const xi = new Set(Object.values(record.xi))
  const slotOfName = new Map(Object.entries(record.xi).map(([slot, name]) => [name, slot]))
  const bench = new Set(benchNames(record))
  const placed = Object.entries(picks).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '',
  )

  if (kind === 'stillOut') {
    const found = placed.filter(([, name]) => xi.has(name)).length
    return { kind, n: Object.keys(record.xi).length - found, of: Object.keys(record.xi).length }
  }
  if (kind === 'benchOn') {
    return { kind, n: placed.filter(([, name]) => bench.has(name)).length, of: placed.length }
  }
  const right = placed.filter(([slotId, name]) => {
    const belongsTo = slotOfName.get(name)
    if (belongsTo === undefined) return false
    return record.positionsInferred ? lineOf(belongsTo) === lineOf(slotId) : belongsTo === slotId
  }).length
  return { kind, n: right, of: placed.length }
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
