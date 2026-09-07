/**
 * האם אפשר בכלל להגיע לשם — סמכות אחת, במקום שש בדיקות מפוזרות.
 *
 * המשחק כבר יודע הרבה על עצמו: `route.ts` יודע איזו דלת הבאה בדרך, `flow.ts` יודע מתי היום
 * מחכה רק לשעון, `lastResort.ts` יודע לזהות יום שנעצר, ו-`milestones.ts` יודע להשלים דגל
 * שהעולם כבר הוכיח. מה שאף אחד מהם לא יודע לענות עליו הוא השאלה שמאור שאל ב-7.9.2026 במשפט
 * אחד:
 *
 *   > אפי מזמין את פוגי לאוסישקין. האם המשחק בדק שאפשר להגיע לשם?
 *
 * לא. שום דבר לא בדק. משימה נפתחה כי דיאלוג נורה, וזאת לא אותה שאלה.
 *
 * ── ארבעה דברים שאסור לבלבל ──────────────────────────────────────────────────────
 *
 * המסמך מנסח את זה טוב יותר משהצלחתי בעצמי, אז זה מיושם בדיוק ככה:
 *
 *   1. **אפשרי פיזית** — יש דרך בעיר. זה מה ש-`route.ts` עונה עליו.
 *   2. **פוגי יודע** — הוא יודע איך מגיעים. דגל `route:<אזור>`.
 *   3. **חקירה חופשית** — מותר לו ללכת לבד. יודע ולא נעול.
 *   4. **נסיעה מודרכת** — דמות יכולה לקחת אותו בדרך שהוא לא יודע. דגל `guided:<מי>`.
 *
 * ילד בן שש לא יודע להגיע לדרום תל אביב, וזה לא באג — זאת האמת של הפרק. הפתרון הנכון הוא
 * **לא** לפתוח את כל דרום תל אביב כי אפי אמר משפט. הפתרון הוא שאפי הוא הסיבה שפוגי לומד
 * את הדרך: הוא לוקח אותו, ואחרי זה `route:ussishkin` נשאר בחיים. גיאוגרפיה הופכת לחלק
 * ממערכת יחסים במקום לתפריט של פתיחות שרירותיות.
 *
 * ── מה מוחזר ─────────────────────────────────────────────────────────────────────
 *
 * לא `true/false`. מי ששואל צריך לדעת **למה לא** ו**מה כן יעזור**, אחרת הוא ימציא לעצמו
 * תשובה — וזה בדיוק איך נולדות שש בדיקות מפוזרות. לכן כל תשובה נושאת סיבה, דרך התאוששות,
 * מה בדיוק חוסם, והמסלול עצמו.
 */
import type { LifeState, LocationId } from '../types'
import { ALL_SCENES, exitInEra, needsFor, whenFor } from './scenes'
import { meets, type Condition } from './types'
import { unmet } from './why'

// ------------------------------------------------------------------ ידע ומדריכים ---

export const ROUTE_PREFIX = 'route:'

/**
 * הדגל שכבר קיים מנצח — כלל 59, במקרה קטן ומאלף.
 *
 * כשכתבתי את הקובץ הזה הנחתי שאצטרך דגל חדש, `route:ussishkin`. הרצתי probe ומצאתי
 * שהמשחק כבר מחזיק אחד: הדלת מאלנבי לאוסישקין דורשת `life:knows:hall` מאז שהפרק נכתב.
 * המושג היה שם; מה שחסר היה מי שיודע לקרוא לו בשם ולהציע התאוששות במקום להגיד "נעול".
 *
 * אז אזור עם דגל קיים משתמש בו, ואזור בלי דגל מקבל `route:<אזור>`. שני שמות לאותו מושג
 * זה בדיוק מה שהכלל אוסר.
 */
export const AREA_KNOWLEDGE: Record<string, string> = {
  ussishkin: 'life:knows:hall',
}

/** הדגל הקנוני שאומר שפוגי יודע להגיע לאזור */
export const routeFlag = (area: string) => AREA_KNOWLEDGE[area] ?? `${ROUTE_PREFIX}${area}`
export const knowsRoute = (state: LifeState, area: string) => Boolean(state.flags[routeFlag(area)])
/** הדגל הזה הוא ידע־דרך של אזור כלשהו? */
export const areaOfKnowledgeFlag = (flag: string): string | null => {
  const named = Object.entries(AREA_KNOWLEDGE).find(([, value]) => value === flag)
  if (named) return named[0]
  return flag.startsWith(ROUTE_PREFIX) ? flag.slice(ROUTE_PREFIX.length) : null
}

export const GUIDED_PREFIX = 'guided:'
/** מישהו לוקח אותו עכשיו — בזמן הזה מותר לו לעבור גם במה שהוא לא יודע */
export const guidedFlag = (who: string) => `${GUIDED_PREFIX}${who}`
export const guidedBy = (state: LifeState): string | null => {
  const key = Object.keys(state.flags).find((flag) => flag.startsWith(GUIDED_PREFIX) && state.flags[flag])
  return key ? key.slice(GUIDED_PREFIX.length) : null
}

/**
 * איזה אזור כל חדר שייך לו, מבחינת ידע.
 *
 * רק חדרים שילד לא אמור לדעת להגיע אליהם לבד מופיעים כאן. הרחוב, המטבח והמגרש של השכונה
 * אינם אזורים — הם הבית. אוסישקין הוא בדרום תל אביב, ובלומפילד ביפו, ואת שניהם לומדים
 * מאיזשהו מבוגר.
 */
export const AREA_OF: Partial<Record<LocationId, string>> = {
  'ussishkin-outside': 'ussishkin',
  'ussishkin-hall': 'ussishkin',
  'ussishkin-end': 'ussishkin',
}

/** מי יכול ללמד איזה אזור — הבסיס ל"אפי מלמד את הדרך לאוסישקין" */
export const TEACHES: Record<string, string> = {
  efi: 'ussishkin',
}

// ------------------------------------------------------------------- התשובה ---

export type ReachVerdict =
  /** הוא כבר שם */
  | 'AT_DESTINATION'
  /** יש דרך, היא פתוחה, והוא יודע אותה */
  | 'ROUTE_OPEN'
  /** הוא לא יודע את הדרך, אבל מישהו לוקח אותו עכשיו */
  | 'GUIDED_ONLY'
  /** הדרך קיימת ופתוחה — הוא פשוט לא יודע אותה */
  | 'AREA_NOT_KNOWN'
  /** דלת בדרך סגורה במצב הנוכחי */
  | 'DOOR_LOCKED'
  /** אין דרך בכלל בפרק הזה */
  | 'NO_ROUTE'

export type Recovery = 'NONE' | 'GUIDED_TRAVEL' | 'LEARN_ROUTE' | 'WAIT_FOR_TIME' | 'MEET_NPC'

export type Reachability = {
  reachable: boolean
  reason: ReachVerdict
  recovery: Recovery
  /** מה בדיוק חוסם — מזהה דלת, שם אזור, או null */
  blockingRequirement: string | null
  /** החדרים בדרך, מהמקום שהוא עומד בו ועד היעד */
  path: LocationId[]
  /** משפט אחד לשחקן, כשיש מה לומר */
  whyHe: string | null
}

const sceneById = new Map(ALL_SCENES.map((scene) => [scene.id, scene]))

/** every flag a condition positively insists on — `none` clauses are not requirements */
function flagsOf(condition: Condition | undefined, out: string[] = []): string[] {
  if (!condition) return out
  if (condition.flag) out.push(condition.flag)
  for (const part of condition.all ?? []) flagsOf(part, out)
  for (const part of condition.any ?? []) flagsOf(part, out)
  return out
}

type Leg = { to: LocationId; exitId: string; labelHe: string; shut: Condition | undefined; open: boolean }

/** כל הדרך, ולא רק הצעד הראשון — `route.ts` עונה על הצעד, כאן צריך את השרשרת */
function walk(state: LifeState, chapter: string, from: LocationId, to: LocationId): Leg[] | null {
  if (from === to) return []
  const seen = new Set<LocationId>([from])
  const queue: Array<{ at: LocationId; legs: Leg[] }> = [{ at: from, legs: [] }]
  while (queue.length) {
    const node = queue.shift() as { at: LocationId; legs: Leg[] }
    const scene = sceneById.get(node.at)
    if (!scene) continue
    for (const exit of scene.exits) {
      if (!exitInEra(exit, chapter)) continue
      const target = exit.to as LocationId
      if (seen.has(target)) continue
      seen.add(target)
      const when = whenFor(exit, chapter)
      const needs = needsFor(exit, chapter)
      const open = meets(state, when) && meets(state, needs)
      const leg: Leg = { to: target, exitId: exit.id, labelHe: exit.labelHe ?? exit.id, shut: open ? undefined : (needs ?? when), open }
      const legs = [...node.legs, leg]
      if (target === to) return legs
      queue.push({ at: target, legs })
    }
  }
  return null
}

/**
 * `canPlayerReach` — השאלה, ותשובה שאפשר לפעול לפיה.
 *
 * הסדר חשוב: קודם "יש דרך בכלל", אחר כך "היא פתוחה", ורק בסוף "הוא יודע אותה". דלת נעולה
 * וידע חסר הם שתי בעיות שונות עם שני פתרונות שונים, ולערבב ביניהן זה איך נגמרים במשחק
 * שפותח חצי עיר כדי לפתור משפט של דמות אחת.
 */
export function canPlayerReach(
  state: LifeState,
  chapter: string,
  from: LocationId,
  to: LocationId,
  options: { guide?: string | null } = {},
): Reachability {
  if (from === to) {
    return { reachable: true, reason: 'AT_DESTINATION', recovery: 'NONE', blockingRequirement: null, path: [], whyHe: null }
  }
  const legs = walk(state, chapter, from, to)
  if (!legs) {
    return { reachable: false, reason: 'NO_ROUTE', recovery: 'NONE', blockingRequirement: null, path: [], whyHe: 'אין דרך לשם בפרק הזה.' }
  }
  const path = legs.map((leg) => leg.to)
  const shut = legs.find((leg) => !leg.open)
  if (shut) {
    /**
     * דלת שנעולה רק כי הוא לא יודע — לא נעולה, פשוט לא ידועה.
     *
     * הדלת לאוסישקין דורשת `life:knows:hall`, וזה לא מנעול: זה ידע. ההבחנה הזאת היא כל
     * ההבדל בין "צריך לחכות למישהו" לבין "צריך שמישהו ייקח אותך", ולכן היא נבדקת לפני
     * שמכריזים על הדלת כסגורה.
     */
    const clauses = flagsOf(shut.shut)
    const areas = clauses.map(areaOfKnowledgeFlag)
    if (clauses.length > 0 && areas.every((area): area is string => area !== null)) {
      const area = areas[0] as string
      const guide = options.guide ?? guidedBy(state)
      if (guide) {
        return { reachable: true, reason: 'GUIDED_ONLY', recovery: 'GUIDED_TRAVEL', blockingRequirement: area, path, whyHe: null }
      }
      return {
        reachable: false,
        reason: 'AREA_NOT_KNOWN',
        recovery: 'GUIDED_TRAVEL',
        blockingRequirement: area,
        path,
        whyHe: 'אתה לא יודע איך מגיעים לשם. מישהו צריך לקחת אותך.',
      }
    }
    const reasons = unmet(state, shut.shut)
    const timed = reasons.length > 0 && reasons.every((reason) => reason.startsWith('אחרי '))
    return {
      reachable: false,
      reason: 'DOOR_LOCKED',
      recovery: timed ? 'WAIT_FOR_TIME' : 'MEET_NPC',
      blockingRequirement: shut.exitId,
      path,
      whyHe: `${shut.labelHe} — ${reasons[0] ?? 'עדיין סגור'}.`,
    }
  }
  const area = AREA_OF[to]
  if (area && !knowsRoute(state, area)) {
    const guide = options.guide ?? guidedBy(state)
    if (guide) {
      return { reachable: true, reason: 'GUIDED_ONLY', recovery: 'GUIDED_TRAVEL', blockingRequirement: area, path, whyHe: null }
    }
    return {
      reachable: false,
      reason: 'AREA_NOT_KNOWN',
      recovery: 'GUIDED_TRAVEL',
      blockingRequirement: area,
      path,
      whyHe: 'אתה לא יודע איך מגיעים לשם. מישהו צריך לקחת אותך.',
    }
  }
  return { reachable: true, reason: 'ROUTE_OPEN', recovery: 'NONE', blockingRequirement: null, path, whyHe: null }
}

// ------------------------------------------------------------------ משימות ---

/**
 * שלוש מחלקות של מטרה, ולמה זה לא קישוט.
 *
 * `FLAVOR` — להסתכל על פרקט, לקרוא כרזה — לעולם לא רשאי להיות התנאי היחיד להתקדמות בעלילה.
 * זה הכלל שהפיל את a3 פעם אחת כבר, ולכן הוא כתוב כאן ונבדק, ולא נזכר.
 */
export type MissionClass = 'CRITICAL' | 'CONTEXTUAL' | 'FLAVOR'

export type MissionSpec = {
  id: string
  classification: MissionClass
  destination: LocationId
  /** מתי בכלל להציע אותה */
  start?: Condition
  /** מי חייב לעמוד שם כדי שאפשר יהיה לבצע */
  needsActor?: string
  /** מה מוכיח שהיא נגמרה */
  completion?: Condition
  /** מי יכול לקחת אותו לשם גם בלי שהוא יודע את הדרך */
  guideBy?: string
}

export type MissionStage = 'CanStart' | 'CanReach' | 'CanPerform' | 'CanComplete' | 'CanExit'

/** הקודים שהמסמך מבקש מהשומר לזהות, בשמם */
export type WatchdogCode =
  | 'MISSION_AVAILABLE_DESTINATION_UNREACHABLE'
  | 'NPC_INVITATION_ROUTE_LOCKED'
  | 'OBJECTIVE_REQUIRED_NPC_ABSENT'
  | 'MISSION_COMPLETE_NO_EXIT'
  | 'FLAVOR_BLOCKS_MAIN_STORY'

export type MissionReachability = {
  ok: boolean
  failedAt: MissionStage | null
  reach: Reachability
  watchdog: WatchdogCode | null
  whyHe: string | null
}

export type MissionContext = {
  chapter: string
  from: LocationId
  /** מי עומד ביעד ברגע הזה, לפי לוחות הזמנים */
  actorsAt: (where: LocationId) => readonly string[]
}

/**
 * `CanStart → CanReach → CanPerform → CanComplete → CanExit`.
 *
 * משימה איננה תקפה רק כי הטריגר שלה נורה. אם שלב נכשל — היא לא הופכת למטרה חוסמת; היא
 * מקבלת מצב מכוון (מודרכת, ממתינה, לא זמינה) והשומר מקבל קוד שאומר בדיוק מה נשבר.
 */
export function evaluateMissionReachability(
  mission: MissionSpec,
  state: LifeState,
  ctx: MissionContext,
): MissionReachability {
  const none: Reachability = { reachable: false, reason: 'NO_ROUTE', recovery: 'NONE', blockingRequirement: null, path: [], whyHe: null }

  if (mission.start && !meets(state, mission.start)) {
    return { ok: false, failedAt: 'CanStart', reach: none, watchdog: null, whyHe: unmet(state, mission.start)[0] ?? null }
  }

  const reach = canPlayerReach(state, ctx.chapter, ctx.from, mission.destination, {
    guide: mission.guideBy && state.flags[guidedFlag(mission.guideBy)] ? mission.guideBy : null,
  })
  if (!reach.reachable) {
    const watchdog: WatchdogCode =
      reach.reason === 'AREA_NOT_KNOWN' && mission.guideBy ? 'NPC_INVITATION_ROUTE_LOCKED' : 'MISSION_AVAILABLE_DESTINATION_UNREACHABLE'
    return { ok: false, failedAt: 'CanReach', reach, watchdog, whyHe: reach.whyHe }
  }

  if (mission.needsActor && !ctx.actorsAt(mission.destination).includes(mission.needsActor)) {
    return {
      ok: false,
      failedAt: 'CanPerform',
      reach,
      watchdog: 'OBJECTIVE_REQUIRED_NPC_ABSENT',
      whyHe: 'מי שאתה אמור לפגוש שם לא שם עכשיו.',
    }
  }

  // CanComplete — a completion nothing in the world can ever satisfy is a designed dead end
  if (mission.completion && meets(state, mission.completion)) {
    return { ok: true, failedAt: null, reach, watchdog: null, whyHe: null }
  }

  const exits = sceneById.get(mission.destination)?.exits.filter((exit) => exitInEra(exit, ctx.chapter)) ?? []
  if (exits.length === 0) {
    return { ok: false, failedAt: 'CanExit', reach, watchdog: 'MISSION_COMPLETE_NO_EXIT', whyHe: 'אין דרך החוצה משם.' }
  }

  return { ok: true, failedAt: null, reach, watchdog: null, whyHe: null }
}

/**
 * מה שנלמד בסוף הדרך — הצד השני של הנסיעה המודרכת.
 *
 * אחרי שאפי לקח אותו פעם אחת, פוגי יודע את הדרך. זה מוחזר כדגל ולא מופעל כאן, כי המנוע הוא
 * היחיד שכותב ליומן — וזה גם מה שמאפשר לבדיקה לשאול "מה היה נלמד" בלי לרוץ משחק.
 */
export function learnedOnArrival(where: LocationId): string | null {
  const area = AREA_OF[where]
  return area ? routeFlag(area) : null
}
