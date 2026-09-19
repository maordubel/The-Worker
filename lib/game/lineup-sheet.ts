/**
 * דף ההרכב — the half of gate 3 that both sides of the wire are allowed to hold.
 *
 * `lib/game/lineup.ts` is `server-only` because it reads the verified XI, and the XI is
 * the answer: rule 4's shape applied to a lineup quiz. But the locker room, the LOCK,
 * the tunnel and the per-position reveal are all SCREEN work, and a screen cannot import
 * a `server-only` module for anything but a type. Before this file, the only thing the
 * board could do with a verdict was print it.
 *
 * So the verdict's vocabulary lives here — the statuses, the rows, the tallies, the
 * coach's note, and the line a slot belongs to — and `lineup.ts` imports it rather than
 * declaring a second copy (rule 59). Nothing in this file can reach the archive; it
 * takes a verdict that has already been graded on the server and turns it into the
 * sequence a player walks through.
 */

export type SlotId = string

/**
 * GK · D · M · F — the band a slot belongs to.
 *
 * Every record in `lineups.json` carries `positionsInferred: true`, because the sources
 * list the eleven in the conventional order without stating positions. Grading therefore
 * falls back to this, and so does everything the room shows: the counters over the pitch
 * count LINES, because a line is the strongest claim the archive supports.
 */
export function lineOf(slotId: SlotId): string {
  return slotId.replace(/\d+$/, '')
}

export type SlotStatus = 'exact' | 'wrong_slot' | 'not_in_xi' | 'empty'

export type SlotVerdict = {
  slotId: SlotId
  name: string | null
  status: SlotStatus
  /** where the player actually belonged, revealed after grading */
  belongsToSlotId: SlotId | null
  /**
   * מלכודת ספסל — the source names this man among the substitutes for THIS match.
   *
   * It is a strictly different mistake from picking somebody who was not on the sheet at
   * all: he was in the room, he wore the kit, he came on. The prototype called it the
   * Bench Trap and it is the one piece of its scoring that says something about the
   * player's memory rather than about his luck. It is `false` wherever the source does
   * not name a bench, which is not the same as "there were no substitutes" — see
   * `benchKnown` below.
   */
  bench: boolean
}

export type LineupVerdict = {
  exact: number
  total: number
  slots: SlotVerdict[]
  /** the real XI, revealed only after a submission */
  solution: Array<{ slotId: SlotId; name: string }>
  /**
   * Whether the source names who came on in this match.
   *
   * Four of the six playable records do; two do not. A report that printed "0 מלכודות"
   * for a record with no bench on file would be stating something the archive never
   * said, so the screen says the count is not available instead (rule 11).
   */
  benchKnown: boolean
  sourceTitle: string
  sourceUrl: string | null
}

/* ------------------------------------------------------------------ the coach */

/**
 * פתק מהמאמן — a hint that counts, and never names anybody.
 *
 * Each note is a COUNT over the board as it stands. That is the whole design constraint:
 * a hint that named a player would hand over one eleventh of the answer for free, and a
 * hint that said nothing would not be worth a cost. Counting is the middle — it tells
 * you that you are three men short without telling you which three.
 *
 * The count is computed on the server against the verified XI, exactly like the grade,
 * and only the number crosses.
 */
export type CoachNoteKind = 'stillOut' | 'benchOn' | 'lineRight'

export type CoachNote = {
  kind: CoachNoteKind
  n: number
  /** the denominator, where the sentence has one */
  of: number
}

/** How many notes a round hands out. Two, as the prototype's coach has. */
export const COACH_NOTES = 2

/** How many names a player may stake a LOCK on. */
export const MAX_LOCKS = 3

/* ------------------------------------------------------------------ the reveal */

export type RevealStatus = 'exact' | 'wrong_slot' | 'not_in_xi'

export type RevealRow = {
  slotId: SlotId
  roleHe: string
  name: string
  status: RevealStatus
  bench: boolean
  locked: boolean
}

/**
 * The eleven, in the order the reveal walks them: keeper, defence, midfield, attack.
 *
 * It walks the FORMATION's own slot order rather than sorting, because that order is
 * already the order the pitch draws — so the marker moving down the list and the marker
 * moving up the pitch are the same movement. Empty slots are left out: there is nothing
 * to reveal about a slot nobody filled, and the men who were missed are named together
 * at the end by `missingStarters`.
 */
export function buildReveal(
  verdict: LineupVerdict,
  slots: ReadonlyArray<{ slotId: SlotId; roleHe: string }>,
  locks: readonly string[],
): RevealRow[] {
  const byId = new Map(verdict.slots.map((slot) => [slot.slotId, slot]))
  const locked = new Set(locks)
  const rows: RevealRow[] = []
  for (const slot of slots) {
    const graded = byId.get(slot.slotId)
    if (!graded || graded.name === null || graded.status === 'empty') continue
    rows.push({
      slotId: slot.slotId,
      roleHe: slot.roleHe,
      name: graded.name,
      status: graded.status,
      bench: graded.bench,
      locked: locked.has(graded.name),
    })
  }
  return rows
}

export type RevealTally = {
  exact: number
  wrongSlot: number
  bench: number
  /** locks that landed on a man who really started */
  locksRight: number
  /** locks spent, whatever they landed on */
  locksUsed: number
}

/**
 * The running score, up to and including `index`.
 *
 * `index` of −1 is the state before the first card is turned, which is what the reveal
 * opens on; `rows.length - 1` is the final figure. **Both ends are the same function**,
 * and that is what makes the skip cheap rather than a second code path: pressing
 * "הצג הכול" is `tallyUpTo(rows, rows.length - 1)`, which is exactly what stepping
 * through every card would have arrived at. A skip that computed its own totals is a
 * skip that can disagree with the walk.
 */
export function tallyUpTo(rows: readonly RevealRow[], index: number): RevealTally {
  const seen = rows.slice(0, Math.max(0, Math.min(index + 1, rows.length)))
  return {
    exact: seen.filter((row) => row.status === 'exact').length,
    wrongSlot: seen.filter((row) => row.status === 'wrong_slot').length,
    bench: seen.filter((row) => row.bench).length,
    locksRight: seen.filter((row) => row.locked && row.status !== 'not_in_xi').length,
    locksUsed: seen.filter((row) => row.locked).length,
  }
}

/** The starters left hanging in the locker room — named only after the sheet is in. */
export function missingStarters(verdict: LineupVerdict): string[] {
  const picked = new Set(
    verdict.slots.map((slot) => slot.name).filter((name): name is string => name !== null),
  )
  return verdict.solution.map((row) => row.name).filter((name) => !picked.has(name))
}

/* ------------------------------------------------------------------ the memory */

/**
 * "אפשר לדלג" is not a button, it is a promise that has to hold on the second run.
 *
 * The brief is explicit that eleven automatic scans is the wrong shape — *"waiting
 * 850ms × 11 players just to see Gate 3 results"* is on its list of what not to build.
 * The reveal here therefore runs on taps and holds no timer at all, so every step is
 * already skippable by construction.
 *
 * This is the second half of it, and the half a button cannot give: **a device that has
 * chosen to skip once opens on the report from then on**, with the walk offered rather
 * than imposed. It is one id in `lib/profile/store.ts`'s collections — the same store
 * every other gate writes to, never a private `localStorage` key — because "I have seen
 * this" is a thing the profile already knows how to remember.
 */
export const REVEAL_SET = 'lineup.reveal'
export const REVEAL_SKIPPED = 'skipped'

export function opensAtSummary(collectedIds: readonly string[]): boolean {
  return collectedIds.includes(REVEAL_SKIPPED)
}
