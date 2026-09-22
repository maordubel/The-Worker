/**
 * אתגרים — six ways to build the eleven under a rule, and the rule is enforced.
 *
 * The prototype's challenge picker was a filter: it narrowed the drawer and then let the
 * poster say nothing about whether the sheet obeyed it. Here a challenge is a CONSTRAINT
 * (players.md §2, Gate 1 "A — 6 challenges"):
 *
 *  · **it is checked against the chosen spell, not the whole career.** "לפני 2000" asks
 *    about the man you put on the pitch — the version whose years and shirt you picked —
 *    so a player whose second spell ran into the 2000s is admitted as his first self and
 *    refused as his second;
 *  · **ישראלי / זר reads the club's foreign-slot record** (`Searchable.foreignSlot`,
 *    ויקיפועל's `שחקנים זרים (כדורגל)` category) and never nationality. A man with no
 *    record is EXCLUDED — the challenge cannot vouch for him — and the drawer counts him
 *    on screen rather than hiding him silently;
 *  · **"אחד מכל עשור" means no two spells starting in the same decade.** One man, one
 *    decade — the decade his chosen spell BEGAN in, which is the same partition the DNA
 *    counts (`lib/xi/dna.ts`). An undated spell cannot be placed in any decade, so it
 *    cannot satisfy the rule and is refused;
 *  · **the poster says met / not met, and that is not a score.** There is no number, no
 *    percentage and no grade here (rule 74) — a sheet either obeys the rule its builder
 *    chose or it names which slots do not.
 *
 * Pure and client-safe. `lib/xi/board.ts` is server-only, so the spell shape is restated
 * here as the three fields a rule needs.
 */

export type ChallengeId = 'free' | 'decades' | 'pre2000' | 'modern' | 'israeli' | 'foreign'

export const CHALLENGES: readonly ChallengeId[] = ['free', 'decades', 'pre2000', 'modern', 'israeli', 'foreign']

export function isChallenge(value: unknown): value is ChallengeId {
  return typeof value === 'string' && (CHALLENGES as readonly string[]).includes(value)
}

/** The first season a "2000 and after" spell may start in, and the last "before 2000" one. */
export const MODERN_FROM = 2000

/**
 * One spell of one man. `id` is the version id `lib/xi/board.ts` spells (`1979-1988`), or
 * `''` for a man with a single spell — who has no version to store (rule 59).
 */
export type Spell = { id: string; fromYear: number | null; toYear: number | null }

export type SlotStatus = 'israeli' | 'foreign' | 'unknown'

/**
 * His spells as the chooser knows them: the versions where the squad table gives him more
 * than one, else one spell spanning the years the archive places him in.
 */
export function spellsFor(
  entry: { fromYear?: number | null; toYear?: number | null },
  versions?: ReadonlyArray<{ id: string; fromYear: number; toYear: number }> | null,
): Spell[] {
  if (versions && versions.length > 1) {
    return versions.map((version) => ({ id: version.id, fromYear: version.fromYear, toYear: version.toYear }))
  }
  return [{ id: '', fromYear: entry.fromYear ?? null, toYear: entry.toYear ?? entry.fromYear ?? null }]
}

/** The decade a spell BEGAN in — one man, one decade. `null` for an undated spell. */
export function decadeOf(spell: Spell): number | null {
  return spell.fromYear === null ? null : Math.floor(spell.fromYear / 10) * 10
}

/** Why a man cannot stand in this eleven under this rule. Every one is said on screen. */
export type Refusal =
  /** ישראלי/זר asked, and the club's foreign-slot record says nothing about him */
  | 'no-record'
  /** ישראלי/זר asked, and the record puts him on the other side */
  | 'other-side'
  /** no spell of his falls on the asked side of 2000 */
  | 'era'
  /** "one per decade", and no spell of his can be dated */
  | 'undated'
  /** "one per decade", and every decade his spells began in is already taken */
  | 'decade-taken'

/** Does this ONE spell satisfy the era rules? The decade rule needs the rest of the sheet. */
function eraPasses(challenge: ChallengeId, spell: Spell): boolean {
  if (challenge === 'pre2000') return spell.fromYear !== null && spell.fromYear < MODERN_FROM
  if (challenge === 'modern') return spell.toYear !== null && spell.toYear >= MODERN_FROM
  return true
}

function slotRefusal(challenge: ChallengeId, status: SlotStatus): Refusal | null {
  if (challenge !== 'israeli' && challenge !== 'foreign') return null
  if (status === 'unknown') return 'no-record'
  return status === challenge ? null : 'other-side'
}

/**
 * What the drawer's filters ask for, so the version follows them (the prototype's
 * `bestVersionIndexForFilters`): a four-digit season, or a decade chip.
 */
export type SpellWish = {
  year?: number | null
  decade?: number | 'any' | null
  /** the version the pick would open on with no filter at all */
  fallbackId?: string | null
}

function contains(spell: Spell, year: number): boolean {
  if (spell.fromYear === null) return false
  return spell.fromYear <= year && (spell.toYear ?? spell.fromYear) >= year
}

function overlaps(spell: Spell, decade: number): boolean {
  if (spell.fromYear === null) return false
  return spell.fromYear <= decade + 9 && (spell.toYear ?? spell.fromYear) >= decade
}

/**
 * Choose the spell a pick stands for.
 *
 * Only spells the challenge admits are candidates. Among them the one containing the
 * asked season wins, then one overlapping the asked decade, then the default version,
 * then the first admitted — so an active "2010" filter picks a man as his 2010 self, and
 * a "before 2000" challenge picks him as his first spell even when his default is his
 * second.
 */
export function chooseSpell(
  challenge: ChallengeId,
  spells: readonly Spell[],
  status: SlotStatus,
  wish: SpellWish = {},
  /** decades already begun in by the OTHER slots of the sheet */
  taken: ReadonlySet<number> = new Set(),
): { ok: true; spell: Spell } | { ok: false; why: Refusal } {
  const slot = slotRefusal(challenge, status)
  if (slot) return { ok: false, why: slot }

  let candidates = spells.filter((spell) => eraPasses(challenge, spell))
  if (candidates.length === 0) return { ok: false, why: 'era' }

  if (challenge === 'decades') {
    const dated = candidates.filter((spell) => decadeOf(spell) !== null)
    if (dated.length === 0) return { ok: false, why: 'undated' }
    candidates = dated.filter((spell) => !taken.has(decadeOf(spell) as number))
    if (candidates.length === 0) return { ok: false, why: 'decade-taken' }
  }

  const year = wish.year ?? null
  const decade = typeof wish.decade === 'number' ? wish.decade : null
  const spell =
    (year !== null ? candidates.find((row) => contains(row, year)) : undefined) ??
    (decade !== null ? candidates.find((row) => overlaps(row, decade)) : undefined) ??
    candidates.find((row) => row.id === (wish.fallbackId ?? '')) ??
    (candidates[0] as Spell)
  return { ok: true, spell }
}

/** One occupied slot of the sheet, as a rule sees it. */
export type SheetRow = { slotId: string; spell: Spell; status: SlotStatus }

export type ChallengeStatus = {
  challenge: ChallengeId
  /** all eleven are picked */
  complete: boolean
  /** the slots whose man breaks the rule, in pitch order — named, never scored */
  broken: string[]
  /** complete AND nothing broken. Never a number. */
  met: boolean
}

/**
 * Does the sheet obey its challenge? `free` is always met once eleven are picked.
 *
 * The decade rule flags the LATER slot of a clash (pitch order), so the report names one
 * man per extra decade rather than accusing both.
 */
export function challengeStatus(challenge: ChallengeId, rows: readonly SheetRow[], size = 11): ChallengeStatus {
  const broken: string[] = []
  const seen = new Set<number>()
  for (const row of rows) {
    if (slotRefusal(challenge, row.status) !== null) {
      broken.push(row.slotId)
      continue
    }
    if (!eraPasses(challenge, row.spell)) {
      broken.push(row.slotId)
      continue
    }
    if (challenge === 'decades') {
      const decade = decadeOf(row.spell)
      if (decade === null || seen.has(decade)) {
        broken.push(row.slotId)
        continue
      }
      seen.add(decade)
    }
  }
  const complete = rows.length >= size
  return { challenge, complete, broken, met: complete && broken.length === 0 }
}

/** The decades begun in by every occupied slot except one — what the next pick may not reuse. */
export function takenDecades(rows: readonly SheetRow[], except: string | null): Set<number> {
  const out = new Set<number>()
  for (const row of rows) {
    if (row.slotId === except) continue
    const decade = decadeOf(row.spell)
    if (decade !== null) out.add(decade)
  }
  return out
}
