import { eraFor, type Era } from './content/era'
import { outfitChosen, ritualFor } from './matchRitual'
import type { LifeState, LocationId } from './types'
import { sceneAlive } from './world/placeLifecycle'

/**
 * במאי הסיפור הראשי — Main Story Director (תוכנית השדרוג 27.9.2026, §0–§1).
 *
 * הקוד כבר ידע הרבה: `objective()` לכל פרק, `goal()` למקום הבא, ביטים, פותר הזדמנויות,
 * שערי זמן. מה שחסר היה **שכבה אחת** שאומרת מה הסיפור הראשי צריך עכשיו — ושמנצחת את
 * הרעש של תוכן הצד. לא Tutorial Manager, לא Shirt Manager, לא Ussishkin Manager: קובץ
 * אחד, טהור, שקורא את מה שהפרק כבר אומר ומחזיר הוראה אחת.
 *
 * ── ארבעה מצבים ──────────────────────────────────────────────────────────────
 *
 *  · **MUST** — יש דבר אחד שהיום רוצה. זה מה שהיה תמיד (`objective` + `goal`), עכשיו עם שם.
 *  · **DILEMMA** — שני מקומות מתחרים על אותה שעה. אין חץ אחד, אין "נכון": שתי המטרות
 *    באותה היררכיה, ושתיהן מסומנות בעולם (A2: הלחם של אמא מול הקבוצות בסמטה).
 *  · **PRE_MATCH** — לפני משחק: הארון. שום טקס אחר עדיין.
 *  · **TRANSITION** — נשמר לפרקים שמעבר הוא חלק מהם; אף פרק עוד לא כותב אותו.
 *
 * ── מה הוא לא עושה ───────────────────────────────────────────────────────────
 *
 * הוא לא ממציא יעדים. יעד שמגיע ממנו תמיד בא מהפרק (`goal`) או מהדילמה שהפרק רשם כאן,
 * ותמיד עובר את `sceneAlive` — אחרי 2007 הבמאי **לא מסוגל** לכוון לאולם שנהרס.
 */

export type DirectiveMode = 'MUST' | 'DILEMMA' | 'PRE_MATCH' | 'TRANSITION'

export type StoryDestination = {
  to: LocationId
  /** the short name the card and the door say — "לקיוסק" */
  labelHe: string
  /** why it matters, in the day's own words — "אמא ביקשה לחם." */
  reasonHe: string
}

export type StoryBlocker = { kind: 'ritual'; ritual: 'shirt'; eventId: string }

export type TutorialCue = 'move' | 'act'

export type StoryRitual = { kind: 'shirt'; eventId: string; titleHe: string; bodyHe: string; allowPlain: boolean }

export type StoryFallback = { to: LocationId; reasonHe: string }

export type MainStoryDirective = {
  id: string
  mode: DirectiveMode
  objectiveHe: string
  reasonHe?: string
  destinations?: StoryDestination[]
  blocker?: StoryBlocker
  tutorialCue?: TutorialCue
  ritual?: StoryRitual
  fallback?: StoryFallback
}

// ---------------------------------------------------------------- dilemmas ---

type DilemmaDef = {
  id: string
  titleHe: string
  footHe: string
  /** the destinations that are still live — empty or one means it is not a dilemma now */
  open: (state: LifeState) => StoryDestination[]
  /** the dilemma is on the table at all */
  when: (state: LifeState) => boolean
}

/**
 * A2 · אביב 1984 — the first dilemma of the life (plan §2.2, Cue 3).
 *
 * Two reasons to leave the flat, shown at the same weight, with no arrow and no right
 * answer. Each one leaves the card the moment it stops being possible: the bread once it is
 * on the counter (or the kiosk has nothing to give), the alley once the teams are full.
 */
const A2_DILEMMA: DilemmaDef = {
  id: 'a2:bread-or-alley',
  titleHe: 'יש לך שתי סיבות לצאת עכשיו',
  footHe: 'אפשר לנסות להספיק הכול. הזמן ממשיך.',
  when: (state) =>
    Boolean(state.flags['life:a:d2']) && !state.chapterDone && !state.flags['a2:played'] && !state.flags['a2:late'] && !state.flags['a2:done'],
  open: (state) => {
    const out: StoryDestination[] = []
    if (!state.flags['a2:bread']) out.push({ to: 'kiosk', labelHe: 'לקיוסק', reasonHe: 'אמא ביקשה לחם.' })
    if (!state.flags['a2:full']) out.push({ to: 'pitch', labelHe: 'למגרש השכונתי', reasonHe: 'אופיר ועמית כבר בוחרים קבוצות.' })
    return out
  },
}

export const DILEMMAS: Readonly<Record<string, DilemmaDef>> = {
  'a2-alley': A2_DILEMMA,
}

// ---------------------------------------------------------------- the director ---

export type DirectorInput = {
  state: LifeState
  /** the room he is in */
  scene: LocationId
  era?: Era
  matchOver?: boolean
}

/**
 * The one directive for this life, in this room, now. Pure: same save, same room, same
 * answer. `null` when the chapter wants nothing (its objective is null and it has no ritual
 * and no dilemma) — the world is free.
 */
export function directiveFor(input: DirectorInput): MainStoryDirective | null {
  const { state, scene } = input
  const chapter = state.chapter
  const era = input.era ?? eraFor(chapter)

  // 1 · PRE_MATCH — before the match, the wardrobe. Nothing outranks getting dressed.
  const ritual = ritualFor(state, chapter)
  if (ritual && !outfitChosen(state, chapter)) {
    return {
      id: `pre-match:${ritual.eventId}`,
      mode: 'PRE_MATCH',
      objectiveHe: 'לפני שיוצאים — מה לובשים היום?',
      blocker: { kind: 'ritual', ritual: 'shirt', eventId: ritual.eventId },
      ritual: { kind: 'shirt', eventId: ritual.eventId, titleHe: 'לפני שיוצאים', bodyHe: 'מה לובשים היום?', allowPlain: ritual.allowPlain },
    }
  }

  // 2 · DILEMMA — two places, one afternoon
  const dilemma = DILEMMAS[chapter]
  if (dilemma && dilemma.when(state)) {
    const open = dilemma.open(state).filter((d) => sceneAlive(state, d.to))
    if (open.length >= 2) {
      return {
        id: dilemma.id,
        mode: 'DILEMMA',
        objectiveHe: dilemma.titleHe,
        reasonHe: dilemma.footHe,
        destinations: open,
      }
    }
  }

  // 3 · MUST — the chapter's own line and its own room, with the room checked against the world
  const objectiveHe = era.objective(state, scene, Boolean(input.matchOver))
  if (!objectiveHe) return null
  const want = era.goal?.(state) ?? null
  const to = want && sceneAlive(state, want) && want !== scene ? want : null
  return {
    id: `must:${chapter}:${to ?? 'here'}`,
    mode: 'MUST',
    objectiveHe,
    ...(to ? { destinations: [{ to, labelHe: '', reasonHe: objectiveHe }] } : {}),
  }
}

/** the rooms the directive sends him to — what the door lights and the free-time planner read */
export function directiveDestinations(directive: MainStoryDirective | null): LocationId[] {
  return (directive?.destinations ?? []).map((d) => d.to)
}

