import 'server-only'

import { createHash } from 'node:crypto'

import { rng, shuffle } from './archive'
import { crestMark } from '@/lib/kit/crestMarks'
import { seasonKits, type SeasonKit } from '@/lib/kit/seasons'
import { KIT_ROUND, PART_ORDER, PART_POINTS, PERFECT_BONUS, type PartKind } from './kit-build-run'
import { COLOUR_NAME, PATTERNS, type KitColour, type KitSpec, type PatternId } from '@/lib/kit/spec'

/**
 * שער 4 — משחק המדים. Assemble a season's kit from its five parts.
 *
 * The version this replaces asked three multiple-choice questions in sequence: pick the
 * cut, then the sponsor, then the maker. It graded correctly and it was still the wrong
 * game, for the reason Maor's mockup makes obvious the moment you look at it — **a quiz
 * about a shirt is not the same thing as building one.** Answering "chest band" from a
 * list of four is recognition; dragging the chest band onto a red body, seeing it land,
 * and then realising the sleeves are wrong is the thing supporters actually do in their
 * heads when they argue about which season a photograph is from.
 *
 * So: one shirt, five parts, all of them open at once, and a single **בדוק את החולצה**
 * at the end. Five decisions held simultaneously is a different cognitive task from five
 * decisions taken one at a time — you can change your mind about the sleeves after the
 * sponsor tells you which era you are in, and that reconsideration IS the game.
 *
 * The five parts are the mockup's own categories, mapped onto fields the archive really
 * has:
 *
 *   1 · **גוף** — base colour and cut together, because they are one visual decision
 *   2 · **שרוולים** — the sleeve ink
 *   3 · **ספונסר** — the chest sponsor
 *   4 · **יצרן** — the maker's mark
 *   5 · **סמל** — the crest of the era (rule 25)
 *
 * Every option in every drawer is a part some real Hapoel shirt actually wore. Nothing
 * here invents a sponsor or a cut to pad a row out (rule 11): where the archive cannot
 * field enough real alternatives for a part, that part is dropped from the round rather
 * than filled with something plausible.
 */

/* ------------------------------------------------------------------ the parts */

// The shapes and the constants live in the client half, so a component can import them
// without dragging the archive and `node:crypto` into the browser bundle.
export {
  KIT_ROUND,
  PART_ORDER,
  PART_POINTS,
  PERFECT_BONUS,
  type PartKind,
} from './kit-build-run'

/** Three real alternatives per part: enough to be a choice, few enough to fit a phone. */
const OPTIONS = 3

export type KitPart = {
  /** stable and carries no answer — see `partId` */
  id: string
  kind: PartKind
  /** what the drawer prints on the card */
  labelHe: string
  /** the fields this part contributes to the shirt when it is placed */
  patch: Partial<KitSpec>
}

export type KitPuzzle = {
  id: string
  seasonLabel: string
  variant: 'home' | 'away' | 'third'
  /** the shirt with all five parts stripped out — what the table opens on */
  blank: KitSpec
  /** the drawers, in `PART_ORDER` */
  drawers: { kind: PartKind; parts: KitPart[] }[]
}

export type PartVerdict = { kind: PartKind; correct: boolean; chosen: string | null; truth: string }

export type KitVerdict = {
  parts: PartVerdict[]
  right: number
  perfect: boolean
  score: number
  /** the finished shirt, so the reveal can show what it should have been */
  answer: KitSpec
  seasonLabel: string
  noteHe: string
}

/**
 * A part's public id is a hash of what it IS, not of the season it came from.
 *
 * Two things depend on this. It must be stable, because the puzzle is re-derived from
 * the seed on every grade and an id that moved would break the match. And it must not
 * name its season — `body:2004/05` in the DOM would hand over the answer to a player
 * who opened the inspector, which is the same leak the timeline shipped with (rule 31).
 */
function partId(kind: string, signature: string): string {
  return `${kind}-${createHash('sha256').update(`${kind}:${signature}`).digest('hex').slice(0, 10)}`
}

/* ------------------------------------------------------------------ extraction */

function bodyPart(spec: KitSpec): KitPart {
  const patternHe = PATTERNS.find((row) => row.id === spec.pattern)?.he ?? 'חלק'
  const signature = `${spec.base}|${spec.pattern}|${spec.patternInk}`
  return {
    id: partId('body', signature),
    kind: 'body',
    labelHe: spec.pattern === 'solid'
      ? `${COLOUR_NAME[spec.base]} חלק`
      : `${COLOUR_NAME[spec.base]} · ${patternHe}`,
    patch: { base: spec.base, pattern: spec.pattern, patternInk: spec.patternInk },
  }
}

function sleevePart(spec: KitSpec): KitPart {
  return {
    id: partId('sleeve', `${spec.sleeveInk}|${spec.collarInk}`),
    kind: 'sleeve',
    labelHe: `שרוול ${COLOUR_NAME[spec.sleeveInk]}`,
    patch: { sleeveInk: spec.sleeveInk, collarInk: spec.collarInk, sleeves: spec.sleeves, collar: spec.collar },
  }
}

function sponsorPart(spec: KitSpec): KitPart | null {
  if (!spec.sponsorHe) return null
  return {
    id: partId('sponsor', spec.sponsorHe),
    kind: 'sponsor',
    labelHe: spec.sponsorHe,
    patch: { sponsorHe: spec.sponsorHe },
  }
}

function makerPart(spec: KitSpec): KitPart | null {
  if (!spec.makerHe) return null
  return {
    id: partId('maker', spec.makerHe),
    kind: 'maker',
    labelHe: spec.makerHe,
    patch: { makerHe: spec.makerHe },
  }
}

function crestPart(spec: KitSpec, labelHe: string): KitPart | null {
  if (!spec.crestKey) return null
  return {
    id: partId('crest', spec.crestKey),
    kind: 'crest',
    labelHe,
    patch: { crestKey: spec.crestKey },
  }
}

/** The crest's own name, from the timeline, so a drawer card says what the mark IS. */
function crestLabel(kit: SeasonKit): string {
  // The era's own name plus what a supporter recognises it BY. Both are true of several
  // seasons at once, so a drawer card can name the mark without naming its season.
  const mark = crestMark(kit.spec.crestKey)
  return mark ? mark.nameHe : 'סמל המועדון'
}

function partsOf(kit: SeasonKit): Partial<Record<PartKind, KitPart>> {
  return {
    body: bodyPart(kit.spec),
    sleeve: sleevePart(kit.spec),
    sponsor: sponsorPart(kit.spec) ?? undefined,
    maker: makerPart(kit.spec) ?? undefined,
    crest: crestPart(kit.spec, crestLabel(kit)) ?? undefined,
  }
}

/* ------------------------------------------------------------------ the deal */

/**
 * The blank shirt: every graded field removed, nothing invented in its place.
 *
 * A blank is drawn in the paper's own cream with no pattern and no marks, so the table
 * opens on an unprinted shirt rather than on a shirt that is already wrong. The parts
 * the game does NOT grade — shorts, socks, nameset — are kept, because they are context
 * the player is allowed to have.
 */
function blankOf(spec: KitSpec): KitSpec {
  return {
    ...spec,
    base: 'paper' as KitColour,
    pattern: 'solid' as PatternId,
    patternInk: 'ink' as KitColour,
    sleeveInk: 'paper' as KitColour,
    collarInk: 'paper' as KitColour,
    sponsorHe: null,
    makerHe: null,
    crestKey: null,
  }
}

function eligible(): SeasonKit[] {
  // A shirt is only playable if the archive knows all five of its parts. A puzzle with
  // a missing sponsor would silently become a four-part puzzle worth 160, and the score
  // a player sees would stop meaning what the screen says it means.
  return seasonKits().filter(
    (kit) => kit.spec.sponsorHe !== null && kit.spec.makerHe !== null && kit.spec.crestKey !== null,
  )
}

export function kitPuzzleCount(): number {
  return eligible().length
}

function puzzles(seed: number): { puzzle: KitPuzzle; truth: Record<PartKind, string>; kit: SeasonKit }[] {
  const all = eligible()
  const random = rng(seed)

  // Every distinct part in the archive, by kind — the pool the distractors come from.
  const pool = new Map<PartKind, Map<string, KitPart>>()
  for (const kind of PART_ORDER) pool.set(kind, new Map())
  for (const kit of all) {
    const parts = partsOf(kit)
    for (const kind of PART_ORDER) {
      const part = parts[kind]
      if (part) pool.get(kind)?.set(part.id, part)
    }
  }

  return shuffle([...all], random)
    .slice(0, KIT_ROUND)
    .map((kit) => {
      const parts = partsOf(kit)
      const truth = {} as Record<PartKind, string>
      const drawers: KitPuzzle['drawers'] = []

      for (const kind of PART_ORDER) {
        const right = parts[kind] as KitPart
        truth[kind] = right.id
        const others = shuffle(
          [...(pool.get(kind)?.values() ?? [])].filter((part) => part.id !== right.id),
          random,
        ).slice(0, OPTIONS - 1)
        drawers.push({ kind, parts: shuffle([right, ...others], random) })
      }

      return {
        kit,
        truth,
        puzzle: {
          id: partId('kit', `${kit.seasonLabel}:${kit.variant}`),
          seasonLabel: kit.seasonLabel,
          variant: kit.variant,
          blank: blankOf(kit.spec),
          drawers,
        },
      }
    })
}

export function dealKitRound(seed: number): KitPuzzle[] {
  return puzzles(seed).map((row) => row.puzzle)
}

export function gradeKitPuzzle(
  seed: number,
  index: number,
  placed: Partial<Record<PartKind, string>>,
): KitVerdict | null {
  const row = puzzles(seed)[index]
  if (!row) return null

  const parts: PartVerdict[] = PART_ORDER.map((kind) => ({
    kind,
    correct: placed[kind] === row.truth[kind],
    chosen: placed[kind] ?? null,
    truth: row.truth[kind],
  }))
  const right = parts.filter((part) => part.correct).length
  const perfect = right === PART_ORDER.length

  return {
    parts,
    right,
    perfect,
    score: right * PART_POINTS + (perfect ? PERFECT_BONUS : 0),
    answer: row.kit.spec,
    seasonLabel: row.kit.seasonLabel,
    noteHe: row.kit.noteHe,
  }
}
