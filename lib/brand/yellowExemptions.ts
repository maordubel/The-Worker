/**
 * החריג היחיד לחוק הצהוב.
 *
 * Rule 8 forbids yellow absolutely, and the reason is not aesthetic: yellow is the
 * other club's colour, and a Hapoel product that prints it has said something. That is
 * why the rule survived four attempts to smuggle it back in through JPEG chroma, h.264
 * decode and Next's WebP re-encode (rules 8, 27).
 *
 * On 1.9.2026 Maor approved one, in writing, when the exact yellow was put to him with
 * the frame it appears in: **"הצהוב הזה מאושר"**. It is the opposition's shirt in the
 * opening animation — `#f2c500` on the player Hapoel goes past. The yellow is the point
 * of the shot. It is on the OTHER team, and it is losing.
 *
 * The rule is not relaxed; a single asset is named. That distinction is the whole file:
 *
 *  · **The exemption is a path, not a colour.** `#f2c500` anywhere else — a component,
 *    a token, another asset — still fails. Nothing here whitelists a hue.
 *  · **It carries who approved it and when**, because the next person to read the
 *    scanner's output will ask, and "somebody decided this once" is not an answer.
 *  · **The list is asserted to be exactly this long.** `tests/brand.test.ts` fails if
 *    an entry is added, so widening it is a decision somebody has to make out loud
 *    rather than a line that slips into a delta.
 *
 * Owner-granted, asset-scoped, and never a precedent.
 */
export type YellowExemption = {
  /** the file, relative to the repo root — matched exactly, never as a prefix */
  path: string
  /** who allowed it, in their own words, and when */
  approvedBy: string
  approvedOn: string
  why: string
}

export const YELLOW_EXEMPTIONS: readonly YellowExemption[] = [
  {
    path: 'public/video/intro.mp4',
    approvedBy: 'מאור הראל — "הצהוב הזה מאושר"',
    approvedOn: '2026-09-01',
    why: 'חולצת היריבה באנימציית הפתיחה — הצהוב הוא על הקבוצה השנייה, והיא מפסידה',
  },
] as const

/** Is this file allowed to contain yellow? Exact path match only — no prefixes. */
export function yellowAllowed(path: string): boolean {
  return YELLOW_EXEMPTIONS.some((exemption) => exemption.path === path)
}
