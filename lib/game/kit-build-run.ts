/**
 * משחק המדים — the client half.
 *
 * `lib/game/kitBuild.ts` reads the archive and hashes ids, so it is `server-only` and
 * imports `node:crypto`. A client component that pulls a single VALUE out of it — the
 * part order, the points — drags the whole archive into the browser bundle and the build
 * fails. Types erase at compile time and are safe; constants are not.
 *
 * Same split as `hate`/`hate-run`, `goal`/`goal-zones` and `timeline`/`timeline-run`.
 */

export type PartKind = 'body' | 'sleeve' | 'sponsor' | 'maker' | 'crest'

export const PART_ORDER: readonly PartKind[] = [
  'body',
  'sleeve',
  'sponsor',
  'maker',
  'crest',
] as const

/** 40 a part, and a shirt assembled perfectly is worth more than five right answers. */
export const PART_POINTS = 40
export const PERFECT_BONUS = 100
/** Five shirts to a round — twenty-five parts, the number the summary counts. */
export const KIT_ROUND = 5
