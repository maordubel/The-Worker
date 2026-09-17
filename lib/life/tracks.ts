import { flagOn, type LifeState } from './types'

/**
 * מסלולי חיים נפרדים — זוגיות, עבודה, הורות.
 *
 * מאור, 17.9.2026: *"מסלולי חיים נפרדים שמשפיעים גם כן: זוגיות, עבודה, הורות וכד'."*
 *
 * A second axis beside the supporter routes. A man is on ULTRAS or he is not; separately,
 * and at the same time, he is somebody's partner, he does something for a living, and he
 * may be somebody's father. The two axes are not a ladder and a sub-ladder — they cross,
 * and the whole reason this is a second registry rather than four more rows in
 * `LIFE_ROUTES` is that a route answers *"מי אתה יכול להיות"* in the club, and a track
 * answers what else was happening in the same years.
 *
 * ------------------------------------------------------------------------------------
 * **מה יש כאן, ומה בכוונה אין.**
 *
 * What is here is the SEAM: ids, Hebrew names, stages in order, and the flag vocabulary.
 * Deliberately absent: thresholds, ages, capabilities, audiences, proof counts and
 * rewards. Every one of those is a number, and every number in this engine is either
 * something Maor decided or something somebody made up — `routes.ts` carries the spec's
 * own tables and can point at the line each came from. Nobody has written a table for
 * these three. A `minAge: 21` on `PARENTHOOD` would look exactly as authoritative as the
 * `minAge: 21` on OWNER's practice stage, which came out of the spec, and a reader would
 * have no way to tell them apart six months from now. So the model holds the shape and
 * the content decides the substance.
 *
 * **ומה שאין כאן בכלל זה תוכן.** No conversation, no beat, no scene row, no offer. A 2007
 * scene is what plugs in here, and until one exists this file is a seam with nothing on
 * the other side of it — which is a thing the repo is allowed to ship, because it is the
 * opposite of the defect rule 66 is about: a threshold nothing can reach looks healthy in
 * the source, while a registry with no content states its own emptiness in `needsHe`.
 *
 * ------------------------------------------------------------------------------------
 * **שלושה כללים שכן מוכרעים כאן, כי שלושתם על המנוע ולא על הבדיה.**
 *
 * **1 · הדגל הוא `own:`, ולכן הוא שורד חיתוך פרק.** `personFlags` in `events.ts` keeps
 * `own:` across both `day.entered` and `year.entered`. A partnership that began in one
 * chapter has to still be true in the next decade, which is precisely what `own:` is for —
 * it is the same contract `own:route:` signed and for the same reason. Do not change the
 * prefix; `events.ts` is not this file's to edit and the prefix IS the agreement with it.
 *
 * **2 · מזהה שלב הוא מפתח שמירה מהרגע שמשהו מרים אותו.** Nothing raises one today, so
 * every id below can still be renamed for free. The moment a scene writes
 * `own:track:PARTNERSHIP:together` into a save, renaming it drops that fact out of every
 * life that holds it — the same rule chapter ids live under (`content/chapters.ts`). If the
 * words below are wrong, they are wrong NOW and cheaply.
 *
 * **3 · השלבים הם סדר, לא ציון.** `stages` is ordered and `trackAtLeast` compares
 * positions, which is what lets a condition ask "at least living together". It is not a
 * score, nothing sums it, and there is no apex: a track has no top rung the way a route
 * does, because *"הורות"* is not an achievement with a ceiling.
 */

export type TrackId = 'PARTNERSHIP' | 'WORK' | 'PARENTHOOD'

export type TrackStageDef = {
  /** a save key from the first time anything raises its flag — see rule 2 above */
  id: string
  titleHe: string
}

export type LifeTrackDef = {
  id: TrackId
  titleHe: string
  /** in order, earliest first. No ages, no thresholds — those belong to content. */
  stages: readonly TrackStageDef[]
  /** what somebody has to WRITE before this track can happen to anybody */
  needsHe: readonly string[]
}

/**
 * שלושה מסלולים, ובדיוק שלושה.
 *
 * Maor's sentence ends *"וכד'"* — and so a fourth is expected, and a fourth is not invented
 * here. Adding one is adding a row; guessing which one he meant is adding a claim.
 */
export const LIFE_TRACKS = [
  {
    id: 'PARTNERSHIP',
    titleHe: 'זוגיות',
    stages: [
      { id: 'first', titleHe: 'מישהי' },
      { id: 'together', titleHe: 'ביחד' },
      { id: 'home', titleHe: 'בית משותף' },
    ],
    needsHe: [
      'סצנה שבה השלב נלקח, עם אדם שאפשר היה לומר לו לא',
      'דמות ב-characters.ts, כי מסלול בלי אדם הוא מונה',
      'מה זה עושה ליום — זמן, כסף, ולמי אין כוח בערב',
    ],
  },
  {
    id: 'WORK',
    titleHe: 'עבודה',
    stages: [
      { id: 'first-job', titleHe: 'עבודה ראשונה' },
      { id: 'trade', titleHe: 'מקצוע' },
      { id: 'living', titleHe: 'פרנסה' },
    ],
    needsHe: [
      'סצנה שבה השלב נלקח, וההבדל בינה לבין ג׳וב של אחר צהריים',
      'מה קורה לשעות של שבת — זו כל השאלה של המסלול הזה מול היציע',
      'החיבור ל-gigs.ts: מה ממשיך להיות ג׳וב אחרי שיש פרנסה',
    ],
  },
  {
    id: 'PARENTHOOD',
    titleHe: 'הורות',
    stages: [
      { id: 'expecting', titleHe: 'בדרך' },
      { id: 'born', titleHe: 'נולד' },
      { id: 'raising', titleHe: 'מגדל' },
    ],
    needsHe: [
      'סצנה שבה השלב נלקח, ופרק שבו הוא מבוגר מספיק',
      'מה זה עושה ליום — ומה קורה כשיש משחק והילד חולה',
      'ההמשך של כלל 39: ילד הוא דמות, לא מונה',
    ],
  },
  /**
   * `as const satisfies` ולא הערה רגילה: `satisfies` בודק את הצורה מול `LifeTrackDef`,
   * ו-`as const` משאיר את מזהי השלבים כמילים ולא כ-`string` — וזה מה שמאפשר ל-`TrackStageId`
   * להיות איחוד אמיתי, כך שתנאי שמבקש שלב שלא קיים לא מתקמפל.
   */
] as const satisfies readonly LifeTrackDef[]

export const trackById = (id: TrackId): LifeTrackDef | null => LIFE_TRACKS.find((track) => track.id === id) ?? null

/** every stage id any track declares, so a condition can be typed against the real words */
export type TrackStageId = (typeof LIFE_TRACKS)[number]['stages'][number]['id']

/**
 * `own:track:<TRACK>:<stage>` — ואותה תחילית בדיוק כמו במסלולים, מאותה סיבה בדיוק.
 *
 * `personFlags` keeps `own:` across a day cut and a year cut. A track written as an
 * ordinary flag would be forgotten at the first chapter boundary, which for an axis whose
 * whole subject is the decade between chapters would mean it could never be true of
 * anybody for longer than one afternoon.
 */
export const trackStageFlag = (id: TrackId, stage: string): string => `own:track:${id}:${stage}`

export const hasTrackStage = (state: LifeState, id: TrackId, stage: string): boolean =>
  flagOn(state, trackStageFlag(id, stage))

/** the furthest stage reached on this track — history, in the registry's own order */
export function trackStageOf(state: LifeState, id: TrackId): TrackStageDef | null {
  const track = trackById(id)
  if (!track) return null
  let reached: TrackStageDef | null = null
  for (const stage of track.stages) if (hasTrackStage(state, id, stage.id)) reached = stage
  return reached
}

/**
 * האם הוא לפחות כאן — the question a `Condition` asks.
 *
 * `minStage` defaults to the track's first stage, so `{ track: { id: 'PARENTHOOD' } }`
 * means "he is a father at all". An unknown stage id answers false rather than throwing,
 * because a mistyped stage in a content file should hide a line, not take the game down —
 * and `tests/life-tiers.test.ts` is what catches the typo.
 */
export function trackAtLeast(state: LifeState, id: TrackId, minStage?: string): boolean {
  const track = trackById(id)
  if (!track) return false
  const wanted = minStage ?? track.stages[0]?.id
  const wantedIndex = track.stages.findIndex((stage) => stage.id === wanted)
  if (wantedIndex < 0) return false
  const reached = trackStageOf(state, id)
  if (!reached) return false
  return track.stages.findIndex((stage) => stage.id === reached.id) >= wantedIndex
}

/** every track he is on at all — for a card, a report, or a scene that wants to know */
export const tracksOn = (state: LifeState): readonly TrackId[] =>
  LIFE_TRACKS.filter((track) => trackStageOf(state, track.id) !== null).map((track) => track.id)
