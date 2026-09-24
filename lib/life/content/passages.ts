import type { Say } from './script'

/**
 * הדרך עצמה — a passage you ride, not a paragraph you read (Director V3 §9, 24.9.2026).
 *
 * `PassageScene` was written for the four years between 1986 and 1990: a bedroom, four
 * things to look at, the boy drawn older under a flash. V3 asked the same scene for the
 * winter of 1997, when Liron's old car takes a soldier to an away match with a curfew in
 * the passenger seat, and until today that night was a chain of four dialogue boxes.
 *
 * A ride is the car's own interior (`lironCar`), moving: the picture breathes the way a
 * car does at eighty, and things on the dashboard and through the windscreen come up one
 * at a time — a radio to tune by hand, the fuel needle, a junction, the ground. Each is a
 * STOP: it lights up, says what it is, and waits for the player's hand (a tap, or the
 * button). The decisions are the chapter's own conversations (`road-1`, `road-2`,
 * `road-3`), in the words they were written in; the ride only decides WHEN each one is
 * asked. A stop that is ignored plays by itself after `autoMs`, so a player who does
 * nothing still arrives: the road does not wait for you, and it does not strand you.
 *
 * Content only — `PassageScene` reads this row and nothing about 1997 lives in the scene.
 */
export type RideStop = {
  id: string
  /** where the stop lights up, as fractions of the painting */
  spot: { x: number; y: number }
  verb: 'look' | 'play' | 'watch'
  labelHe: string
  /** how long after the previous stop resolved this one comes up */
  gapMs: number
  /** a stop left alone plays by itself after this long */
  autoMs: number
  /** a hand on it this many times first — tuning a radio is not one press */
  taps?: number
  /** what each press before the last one sounds like */
  tapHe?: readonly string[]
  /** what it says once it is done (lines), or which conversation it opens */
  lines?: readonly Say[]
  conversation?: string
}

export type Ride = {
  id: string
  art: string
  titleHe: string
  hintHe: string
  stops: readonly RideStop[]
  /** where the world picks up again, and what the arrival writes into the log */
  land: { mapId: string; spawn: string }
  flags: readonly string[]
}

export const RIDE_PREFIX = 'ride:'

/** 1997 — Liron's car, to an away match, and back before the base notices */
export const RIDE_1997: Ride = {
  id: '1997',
  art: 'lironCar',
  titleHe: 'האוטו של לירון',
  hintHe: 'כביש, לילה, רדיו. מה שנדלק — לגעת בו.',
  stops: [
    {
      id: 'radio',
      spot: { x: 0.49, y: 0.61 },
      verb: 'play',
      labelHe: 'לכוון את הרדיו',
      gapMs: 1800,
      autoMs: 9000,
      taps: 3,
      tapHe: ['רעש.', 'חצי מילה של שדר, ושוב רעש.'],
      lines: [
        { who: null, text: 'האוטו של לירון: ישן, נקי, עם שקית סוכריות בדלת ומברג בתא הכפפות. הרדיו תופס תחנה, מאבד, תופס.' },
        { who: 'לירון', text: 'פעם, בשער 7, ידיעה עברה מאיש לאיש. אחד עם טרנזיסטור, אחד שמעביר הלאה. היום יש פייג׳ר. יודעים מהר, לא יודעים יותר טוב.' },
        { who: 'לירון', text: 'אתה מסתכל כל הדרך על השעון. זה לא גורם לנו להגיע מהר יותר.' },
      ],
    },
    { id: 'fuel', spot: { x: 0.3, y: 0.52 }, verb: 'look', labelHe: 'מחוג הדלק', gapMs: 3200, autoMs: 8000, conversation: 'road-1' },
    { id: 'junction', spot: { x: 0.52, y: 0.34 }, verb: 'watch', labelHe: 'הצומת בחלון', gapMs: 3600, autoMs: 8000, conversation: 'road-2' },
    { id: 'ground', spot: { x: 0.5, y: 0.3 }, verb: 'watch', labelHe: 'האורות של המגרש', gapMs: 3600, autoMs: 7000, conversation: 'road-3' },
  ],
  land: { mapId: 'kiosk', spawn: 'start' },
  flags: ['a4:arrived', 'a4:done'],
}

export const RIDES: Record<string, Ride> = { [RIDE_1997.id]: RIDE_1997 }
