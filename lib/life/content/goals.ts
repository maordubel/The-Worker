import type { LifeState, LocationId } from '../types'

/**
 * לאן הפרק שולח אותך — every chapter, in one file, so nobody has to guess again.
 *
 * Maor, 6.9.2026, standing in the street in the autumn of 1984 with Efi telling him to go
 * "after the wall, right": *"אין לי מושג מה הכוונה במשפט הזה."* He was right and the line
 * was not the bug. A game with rooms and doors already knows the way; it simply had no
 * place to write down where a chapter wants the player, so it could not say so — not in
 * the hint, not with the arrow, and not on the map.
 *
 * That is what this file is. One function per chapter, returning the ROOM the day
 * currently wants, or null when the day genuinely has no opinion. `world/route.ts` turns
 * that into the next door and reads the label painted on it, so what reaches the player is
 * «בדרך: למרכז תל אביב» rather than a wall a six-year-old remembers.
 *
 * The rules these all obey:
 *
 *   - Return null once the day's want is satisfied. A chapter that keeps pointing after
 *     you have arrived is nagging.
 *   - Return null when the want is a JOB rather than a place ("collect thirty shekels").
 *     Pointing at a door for that would be the game inventing an errand it did not write.
 *   - Never point at something the player has not been told exists. A3 waits for Efi to
 *     name the hall; before that the arrow would be spoiling a scene.
 *   - These mirror each chapter's own `objective`, because the objective already encodes
 *     the chain. Where the two ever disagree, the objective is the text and this is the
 *     geography, and the geography is what a thumb needs.
 */

const flag = (state: LifeState, name: string) => Boolean(state.flags[name])

/** 24.5.1986 — the key, the father, the road east, the gate, and finding him after. */
export const goal1986 = (state: LifeState): LocationId | null => {
  if (flag(state, 'found:kobi')) return null
  if (flag(state, 'entry:granted')) return 'bloomfield-inside'
  if (flag(state, 'knows:match')) return 'bloomfield-outside'
  // before he knows there is a match the day is about a key in a drawer, which is a job
  // and not a journey
  return (state.inventory['house-key'] ?? 0) > 0 ? 'home' : 'bedroom'
}

/** 12.5.1990 — the arithmetic at the table, then the ground, then the man in the crowd. */
export const goal1990 = (state: LifeState): LocationId | null => {
  if (flag(state, 'walked:home')) return null
  if (flag(state, 'found:kobi')) return 'home'
  if (flag(state, 'entry:granted')) return 'bloomfield-inside'
  if (flag(state, 'knows:math') || flag(state, 'kobi:left')) return 'bloomfield-outside'
  return 'kitchen'
}

/** 11.3.1991 — school, the notebook, the permission, and a hall at eight in the evening. */
export const goal1991 = (state: LifeState): LocationId | null => {
  if (flag(state, 'walked:home')) return null
  if (flag(state, 'derby:over')) return 'home'
  if (flag(state, 'permission:yes') || flag(state, 'sneak:ready')) return 'ussishkin-hall'
  if (flag(state, 'hw:done') || flag(state, 'hw:half') || flag(state, 'hw:faked')) return 'home'
  if (flag(state, 'school:done')) return 'home'
  return 'classroom'
}

/** 19.4.1993 — the money, the route, the hall, and the walk home. */
export const goal1993Cup = (state: LifeState): LocationId | null => {
  if (flag(state, 'walked:home')) return null
  if (flag(state, 'final:over')) return 'home'
  if (flag(state, 'route:tv')) return 'home'
  if (flag(state, 'route:efi') || flag(state, 'route:ofir')) return 'ussishkin-outside'
  // the money is a job, not a place
  return null
}

/** 9–19.5.1993 — five games; the ones you can reach are the hall and, at the end, north. */
export const goalGalil = (state: LifeState): LocationId | null => {
  if (flag(state, 'life:galil:d5')) return flag(state, 'after:done') ? null : 'ussishkin-outside'
  /**
   * Game four is decided at the CORNER, where Limor has the list for the organised bus —
   * not at the central bus station, which has no door into it in 1993 and which the boy
   * has no reason to walk to. `goalGalil` pointed there for one afternoon on 6.9.2026 and
   * `tests/life-goals.test.ts` caught it before anybody played it, which is exactly what
   * that test is for: a destination nothing can reach is a dead end with a signpost.
   */
  if (flag(state, 'life:galil:d4')) return flag(state, 'g4:decided') ? null : 'ussishkin-outside'
  if (flag(state, 'life:galil:d3')) return 'ussishkin-hall'
  if (flag(state, 'life:galil:d2')) return 'kitchen'
  return 'ussishkin-hall'
}

/** 1995 — a radio at Rafi's, an argument, a poster on a wall. */
export const goalSinai = (state: LifeState): LocationId | null => {
  // the third day is a room, not an errand: the rupture happens alone (§7 B5)
  if (flag(state, 'life:sinai:d3')) return null
  if (flag(state, 's2:done')) return 'bedroom'
  if (flag(state, 'life:sinai:d2')) return 'kiosk'
  if (flag(state, 's1:argued')) return 'bedroom'
  if (flag(state, 's1:heard')) return 'kiosk'
  return 'kiosk'
}

/** 1996–97 — the last evening at home, the gates, the bus at half six, Liron's car. */
export const goalArmy = (state: LifeState): LocationId | null => {
  // the fifth day: two journeys and one afternoon, both offered at the counter (§19)
  if (flag(state, 'life:army:d5')) return flag(state, 'a5:done') ? null : 'kiosk'
  if (flag(state, 'life:army:d4')) return flag(state, 'a4:road') ? null : 'kiosk'
  if (flag(state, 'life:army:d3')) return flag(state, 'a3:decided') ? null : 'bus-station'
  if (flag(state, 'life:army:d2')) {
    if (state.gate.identity !== 'gate7' || flag(state, 'a2:chose')) return null
    return 'bloomfield-outside'
  }
  return 'home'
}

/** 1997–98 — the hall the night it went down, or Bloomfield with his father. */
export const goalHall = (state: LifeState): LocationId | null => {
  if (flag(state, 'life:hall:h2')) return flag(state, 'h2:done') ? null : 'ussishkin-hall'
  if (flag(state, 'h1:decided')) return null
  // the whole beat is the choice between two rooms; pointing at one would answer it
  return null
}

/** 2.5.1998 — Bloomfield at five, and an Arabic lesson the morning after. */
export const goalLaces = (state: LifeState): LocationId | null => {
  if (flag(state, 'life:laces:l2')) return flag(state, 'l2:done') ? null : 'classroom'
  if (flag(state, 'l1:after') || flag(state, 'l1:inside')) return null
  return 'bloomfield-outside'
}

/** 1999 — the hall the second time it went down, and a kiosk with a sheet of paper on it. */
export const goalSeed = (state: LifeState): LocationId | null => {
  if (flag(state, 'seed:list')) return null
  if (flag(state, 'seed:hall')) return 'kiosk'
  return 'ussishkin-hall'
}

/** 26.5.1999 — Ramat Gan at eight, and who you go with. */
export const goalCup99 = (state: LifeState): LocationId | null => {
  if (flag(state, 'c99:over')) return null
  return flag(state, 'c99:route') ? 'ramat-gan' : null
}

/** 13.5.2000 — Hatikva at three. */
export const goalTitle = (state: LifeState): LocationId | null => {
  if (flag(state, 't:over')) return null
  return flag(state, 't:route') ? 'hatikva' : null
}

/** 17.5.2000 — Ramat Gan, the second time, and the Double. */
export const goalDouble = (state: LifeState): LocationId | null => {
  if (flag(state, 'd:over')) return null
  return flag(state, 'd:final') ? 'ramat-gan' : null
}
