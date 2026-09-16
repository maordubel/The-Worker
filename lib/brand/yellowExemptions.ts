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

/**
 * החריג השני — הצהוב על היריבה, ורק עליה.
 *
 * A file exemption cannot cover a 3D scene, because a 3D scene has no file: it builds its
 * colour at runtime and the pixel scanner never sees a PNG to count. So the football
 * engine needed a second kind of entry, and it needed to be the same shape as the first —
 * a NAMED SURFACE, an approver, a date, and a reason — rather than a relaxed rule.
 *
 * On 7.9.2026 Maor granted exactly that, in writing and with the limit inside the grant:
 * **"במשחק הזה יש אישור להשתמש בצהוב על מנת לסמן יריבים בצהוב. אך על יריבים בלבד."**
 *
 * So: one surface, the away side's kit, and the code that produces it refuses to produce
 * it for the player's own side — `awayMarkColour` throws rather than returns. A yellow
 * Hapoel shirt is not a bug to be caught in review; it is not reachable.
 *
 *  · **The colour lives HERE, not in the runtime palette.** `tests/life.test.ts` asserts
 *    that no value in `LIFE_PALETTE` is yellow and that no six-digit hex literal appears
 *    anywhere under `lib/life/`. Both of those stay true, and the one approved yellow in
 *    the product sits in the file that explains why it exists.
 *  · **The list is asserted to be exactly this long**, like the file list above, so
 *    widening it stays a decision somebody makes out loud.
 */
export type RuntimeYellowSurface = {
  /** the surface id, matched exactly — never a prefix, never a folder */
  surface: string
  /** `#RRGGBB`; a string rather than a numeric literal so the runtime guard stays absolute */
  colour: string
  approvedBy: string
  approvedOn: string
  why: string
}

export const RUNTIME_YELLOW_SURFACES: readonly RuntimeYellowSurface[] = [
  {
    surface: 'football/away-kit',
    colour: '#f2c500',
    approvedBy: 'מאור הראל — "יש אישור להשתמש בצהוב על מנת לסמן יריבים בצהוב. אך על יריבים בלבד."',
    approvedOn: '2026-09-07',
    why: 'חולצת היריבה בשחזור התלת-מימד — הצהוב מסמן את הקבוצה השנייה בלבד, ולעולם לא את הפועל',
  },
] as const

/** Is this named runtime surface allowed to be yellow? Exact match only. */
export function yellowSurfaceAllowed(surface: string): boolean {
  return RUNTIME_YELLOW_SURFACES.some((entry) => entry.surface === surface)
}

/**
 * The one approved yellow, for the one approved surface.
 *
 * Throws for anything else — including, deliberately, for the player's own side. The
 * grant was "on opponents only", and a function that can only be called correctly is a
 * better guardrail than a rule somebody has to remember.
 */
export function runtimeYellow(surface: string): string {
  const entry = RUNTIME_YELLOW_SURFACES.find((row) => row.surface === surface)
  if (!entry) throw new Error(`runtimeYellow: "${surface}" is not an approved yellow surface`)
  return entry.colour
}


/**
 * החריג השלישי — צהוב שהוא עובדה על החפץ, לא בחירה של מעצב.
 *
 * The first two entries are about something we DREW: a frame of an animation, a kit in a
 * 3D scene. Both are choices, and both were granted as a single named thing. Archive
 * photographs are a third kind, and the difference is not a matter of degree:
 *
 *   **nobody chose this yellow.** It is the Europa League badge stitched on the sleeve,
 *   the gold band Visa printed across the 1985 away shirt, an orange goalkeeper jersey.
 *   The shirt is what it is. Editing the yellow out of a photograph of a real garment
 *   does not enforce rule 8 — it falsifies the archive, which is the worse failure of
 *   the two.
 *
 * On 16.9.2026 the measurement was put to Maor before the ask, and it was remeasured on
 * the finished folder: **71 of 168 photographs carry pixels in `lib/isYellow.ts`'s band,
 * the largest 5.214% on the 1985 away shirt with Visa's gold band across it, most under
 * 0.3% and all of them a badge, a trim or an orange keeper's jersey.** He chose this over
 * removing it and over dropping the photographs.
 *
 * The shape of the grant is deliberately NOT "photographs may be yellow":
 *
 *  · **It is a folder, and the folder has exactly one kind of thing in it.** Only
 *    `public/kits/` — cut-out archive shirts, one garment per file, nothing drawn.
 *    Anything we design still fails, including in the same page.
 *  · **Every file carries its own measurement.** `content/manual/kit-photos.json` stores
 *    `yellowPx` and `yellowPct` per shirt, counted on the DECODED bytes (rule 61). The
 *    exemption is not a place yellow goes unmeasured; it is a place it goes RECORDED.
 *  · **The page is still scanned.** `qa:sweep` visits `/kits/archive` like any other
 *    route and counts yellow with the photographs hidden, so the chrome, the type and
 *    the background are held to rule 8 exactly as before.
 */
export type YellowPhotoFolder = {
  /** repo-relative folder, matched as a prefix — the ONLY prefix match in this file */
  folder: string
  approvedBy: string
  approvedOn: string
  why: string
  /** what was measured when it was granted, so the next reader is not asked to trust */
  measuredOn: string
  filesWithYellow: number
  filesTotal: number
  maxPercent: number
}

export const YELLOW_PHOTO_FOLDERS: readonly YellowPhotoFolder[] = [
  {
    folder: 'public/kits/',
    approvedBy: 'מאור הראל — בחר "חריג שלישי — תצלומים תיעודיים" כשהמדידה הוצגה לו',
    approvedOn: '2026-09-16',
    why: 'תצלומי ארכיון של חולצות אמיתיות — סמל היורופה ליג על השרוול, פס הזהב של ויזה 1985, וחולצות שוער כתומות. הצהוב הוא תכונה של החפץ, וניקוי שלו מזייף את הארכיון',
    measuredOn: '2026-09-16',
    // Counted on pixels, not on the rounded percentage — four of the 71 carry a single
    // yellow pixel and round to 0.000%. Both numbers are re-derived from
    // content/manual/kit-photos.json by tests/brand.test.ts, so they cannot drift.
    filesWithYellow: 71,
    filesTotal: 168,
    maxPercent: 5.214,
  },
] as const

/** Is this file inside a folder where photographed yellow is allowed? */
export function yellowPhotoAllowed(path: string): boolean {
  return YELLOW_PHOTO_FOLDERS.some((entry) => path.startsWith(entry.folder))
}
