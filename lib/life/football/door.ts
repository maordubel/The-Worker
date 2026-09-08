/**
 * הדלת — where a boy on a dirt pitch says who he is, and the game takes him at his word.
 *
 * Maor asked for the entrance to the 3D match to be an option on the neighbourhood pitch:
 * **"אני הפועל"**, and then you are in it. That is a better door than a menu item, and it
 * is the same device the historical windows will use in Δ51–52 — a boy imagining he is on
 * the grass, and the picture agreeing with him. The neighbourhood pitch is exactly where a
 * child pretends; this makes the pretence real for ninety seconds and then hands him back
 * to the afternoon.
 *
 * **Why this file exists at all.** Wiring a room into this game touches four shared content
 * tables — `gigs.ts`, `content/script.ts`, `runtime/dialogue.ts`, `stage/useLifeLedger.ts` —
 * and those are the files two parallel sessions collide in. So everything that CAN live in
 * the football module lives here: the gig row, the effect payload, the bus intent and the
 * settlement numbers. Each shared table then needs one line that points at this file, and
 * the football engine stays a thing you can open rather than a thing you have to
 * understand. `lib/life/football/door.ts` is the contract; the four lines are the plumbing.
 *
 * Nothing here imports three, React or the DOM: it is the same pure layer as the rest of
 * `lib/life/football/`, so the tables can import it without dragging a renderer with them.
 */
import type { LifeBusEvents } from '../runtime/bus'

export type PitchIntent = NonNullable<LifeBusEvents['pitch']>

/** The gig's id, and the flag it raises. Written once so nothing has to spell it twice. */
export const PITCH_GIG_ID = 'street-match'

/**
 * The row `GIGS` needs.
 *
 * Typed structurally rather than importing `Gig`, because `gigs.ts` imports this file and a
 * cycle between the two would be a real one. `gigs.ts` spreads it into the array, where the
 * `Gig` type checks it for real.
 */
export const PITCH_GIG = {
  id: PITCH_GIG_ID,
  where: 'pitch',
  nameHe: 'הילדים במגרש',
  labelHe: 'משחק על המגרש',
  from: 'a2-alley',
  hours: 0.5,
  minutes: 30,
  energy: 12,
  askHe: 'אני הפועל.',
  /**
   * The line the pitch says before the choice.
   *
   * It is the sentence that makes the door work: they are picking sides, and the name you
   * choose is the name you are playing as. Nobody explains that the next thing is a
   * football match — the boy says who he is and the game agrees.
   */
  openHe: 'הם מחלקים קבוצות. אחד מהם מסתובב אליך: "אז מי אתה?"',
  doneHe: 'הידיים על הברכיים, האוויר נגמר, והשמש כבר על הגגות.',
  trait: { key: 'courage' as const, delta: 1 },
  at: { x: 0.42, y: 0.86, w: 0.09 },
  opens: 'pitch' as const,
  /** play, not work — so it is outside the one-paid-job-a-chapter rule, like the two contests */
  paid: false,
}

/**
 * What the boy is actually playing.
 *
 * A kickabout, not a reconstruction: `mode: 'replay'` because the result is free and
 * nothing here is a claim about anything that happened. The historical windows come
 * through the SAME channel with `mode: 'documentary'`, a real `matchId` from
 * `lib/life/history/` and a `startMinute` — which is the whole point of putting the door on
 * a data payload rather than on a component.
 *
 * `showScore` is true and the score starts 0–0, and that is honest here precisely because
 * it is invented football rather than remembered football.
 */
export function streetMatch(era: string): PitchIntent {
  return {
    matchId: 'street',
    windowId: 'kickabout',
    mode: 'replay',
    homeHe: 'הפועל',
    awayHe: 'הם',
    showScore: true,
    score: { home: 0, away: 0 },
    startMinute: 0,
    era,
    /** the one approved yellow: it marks the other team, and only the other team */
    awayYellow: true,
  }
}

/**
 * Which era's pitch he is imagining.
 *
 * The kit cut, the grass and the light all come off this, and a boy in 1986 does not
 * picture a 1999 pitch. Derived from the chapter id rather than passed in, so the door does
 * not need the caller to know anything.
 */
export function eraForChapter(chapter: string): string {
  const year = Number(chapter.match(/(19|20)\d{2}/)?.[0] ?? 0)
  if (year >= 2000) return '2000'
  if (year >= 1997) return 'late-1990s'
  if (year >= 1990) return 'early-1990s'
  return 'mid-1980s'
}

/** What the afternoon costs when the match closes. The ledger reads these; nothing is typed twice. */
export const PITCH_SETTLEMENT = {
  gigId: PITCH_GIG_ID,
  flag: `gig:${PITCH_GIG_ID}`,
  minutes: PITCH_GIG.minutes,
  energy: PITCH_GIG.energy,
  trait: PITCH_GIG.trait,
  /**
   * אהבה להפועל — one point, and only for winning as them.
   *
   * Deliberately small and deliberately conditional. The meter measures a life, not an
   * afternoon, and a kickabout that pays the same as being at Bloomfield would cheapen
   * both. Losing costs nothing: this game does not punish a boy for losing a game.
   */
  loveOnWin: 1,
}
