import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { rosterIndex } from '@/lib/game/allTimeXI'
import { facetIndex } from '@/lib/game/roster-facets'
import {
  facetCounts,
  filterRoster,
  isFiltered,
  NO_FILTER,
  type RosterFilter,
  type Searchable,
} from '@/lib/game/roster-search'
import { cardFigures, gateId, rankOf, standingScore, stillToDo } from '@/lib/profile/standing'
import {
  emptyProfile,
  emptyStat,
  gatesTouched,
  historyGrid,
  HISTORY_DAYS,
  streak,
  totalCorrect,
  totalPlays,
  type Profile,
} from '@/lib/profile/store'

/**
 * המנוי — the card's numbers, and the one thing the roster is not allowed to do.
 *
 * Two subjects in one file because they are the same promise from two ends: the
 * personal area may only print what somebody actually did, and the roster may only
 * filter on what a source actually said. Both are places where an invented number
 * would look completely at home.
 */

function withDays(days: string[]): Profile {
  return { ...emptyProfile(), days }
}

function back(from: Date, days: number): string {
  const day = new Date(from)
  day.setDate(from.getDate() - days)
  return day.toISOString().slice(0, 10)
}

describe('רצף — the streak', () => {
  const NOW = new Date('2026-09-15T10:00:00Z')

  it('counts consecutive days up to today', () => {
    expect(streak(withDays([back(NOW, 0), back(NOW, 1), back(NOW, 2)]), NOW)).toBe(3)
  })

  it('survives the night — yesterday still counts as alive', () => {
    // Somebody who played last night and opens the app at nine in the morning has not
    // broken anything, and telling them they have is the kind of pressure this project
    // bans by name.
    expect(streak(withDays([back(NOW, 1), back(NOW, 2)]), NOW)).toBe(2)
  })

  it('breaks on a real gap, and does not count a gap as a day', () => {
    expect(streak(withDays([back(NOW, 0), back(NOW, 2), back(NOW, 3)]), NOW)).toBe(1)
    expect(streak(withDays([]), NOW)).toBe(0)
    expect(streak(withDays([back(NOW, 5)]), NOW)).toBe(0)
  })

  it('prints ninety slots however long the history is', () => {
    const grid = historyGrid(withDays([back(NOW, 0), back(NOW, 200)]), NOW)
    expect(grid).toHaveLength(HISTORY_DAYS)
    expect(grid.filter(Boolean)).toHaveLength(1)
    expect(grid[HISTORY_DAYS - 1]).toBe(true)
  })
})

describe('המעמד — nothing on the card is bought', () => {
  it('starts everybody at the bottom with nothing to show', () => {
    const fresh = emptyProfile()
    expect(standingScore(fresh)).toBe(0)
    expect(rankOf(fresh).now.id).toBe('visitor')
    expect(cardFigures(fresh)).toMatchObject({ correct: 0, plays: 0, days: 0, gates: 0 })
  })

  it('weights turning up above volume, so one gate cannot be ground', () => {
    const grinder: Profile = {
      ...emptyProfile(),
      days: ['2026-09-15'],
      gates: { '/trivia': { ...emptyStat(), plays: 10 } },
    }
    const regular: Profile = {
      ...emptyProfile(),
      days: ['2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15'],
      gates: {
        '/trivia': { ...emptyStat(), plays: 2 },
        '/goal': { ...emptyStat(), plays: 2 },
        '/timeline': { ...emptyStat(), plays: 2 },
      },
    }
    expect(standingScore(regular)).toBeGreaterThan(standingScore(grinder))
  })

  it('always names the next rung, until there is none', () => {
    const fresh = rankOf(emptyProfile())
    expect(fresh.next?.id).toBe('single')
    expect(fresh.toGo).toBe(1)

    const top = rankOf({ ...emptyProfile(), days: Array.from({ length: 200 }, (_, i) => `d${i}`) })
    expect(top.now.id).toBe('terrace')
    expect(top.next).toBeNull()
  })

  it('totals what the gates reported and nothing else', () => {
    const profile: Profile = {
      ...emptyProfile(),
      gates: {
        '/trivia': { ...emptyStat(), plays: 3, correct: 21, asked: 36 },
        '/goal': { ...emptyStat(), plays: 1, correct: 2, asked: 9 },
        '/memory': emptyStat(),
      },
    }
    expect(totalPlays(profile)).toBe(4)
    expect(totalCorrect(profile)).toBe(23)
    // a gate with a row but no rounds is not a gate you have been through
    expect(gatesTouched(profile)).toBe(2)
  })

  it('reads a gate id off its route, so one gate cannot be filed twice', () => {
    expect(gateId('/lineup?seed=1')).toBe('/lineup')
    expect(gateId('/kits/build')).toBe('/kits/build')
    expect(gateId('/')).toBe('/')
  })

  it('offers what has not been played, never what has', () => {
    const profile: Profile = {
      ...emptyProfile(),
      gates: { '/xi': { ...emptyStat(), plays: 1 } },
    }
    const todo = stillToDo(profile, 3)
    expect(todo).toHaveLength(3)
    expect(todo.map((gate) => gate.href)).not.toContain('/xi')
  })
})

describe('סינון השחקנים — no position is ever guessed', () => {
  const roster = rosterIndex()

  it('places a real share of the roster, and still admits the gap', () => {
    expect(roster.total).toBeGreaterThan(600)
    // The research pass of 15.9.2026 took this from 66 to well over three hundred by
    // reading 73 season squads and bridging them to the Hebrew roster. The floor is a
    // regression guard: if a future change silently drops `player-facts.json`, the
    // filters quietly become decorative again and this is what says so.
    expect(roster.withPosition).toBeGreaterThan(300)
    expect(roster.withOrigin).toBeGreaterThan(300)
    // And the gap is still real. A day when every one of 645 names has a position is a
    // day somebody guessed, unless the same commit also brought the source that knows.
    expect(roster.withPosition).toBeLessThan(roster.total)
  })

  it('carries a source for every facet it states', () => {
    const unsourced = roster.all.filter(
      (entry) =>
        (entry.position !== null && !entry.positionFrom) ||
        (entry.origin !== null && !entry.originFrom),
    )
    expect(unsourced.map((entry) => entry.nameHe)).toEqual([])
  })

  it('never invents a facet for somebody no file mentions', () => {
    const facts = facetIndex()
    const invented = roster.all.filter(
      (entry) => entry.position !== null && facts.size > 0 && entry.positionFrom === null,
    )
    expect(invented).toEqual([])
  })

  it('counts the undocumented as their own bucket rather than hiding them', () => {
    const counts = facetCounts(roster.all)
    expect(counts.position.unknown).toBeGreaterThan(0)
    const placed = ['GK', 'DF', 'MF', 'FW'].reduce(
      (sum, key) => sum + (counts.position[key] ?? 0),
      0,
    )
    expect(placed + (counts.position.unknown ?? 0)).toBe(roster.total)
  })

  it('narrows to exactly what was asked for', () => {
    const keepers = filterRoster(roster.all, { ...NO_FILTER, position: 'GK' })
    expect(keepers.length).toBeGreaterThan(0)
    expect(keepers.every((entry) => entry.position === 'GK')).toBe(true)

    const unplaced = filterRoster(roster.all, { ...NO_FILTER, position: 'unknown' })
    expect(unplaced.every((entry) => !entry.position)).toBe(true)
    expect(keepers.length + unplaced.length).toBeLessThanOrEqual(roster.total)
  })

  it('composes — a filter is not a radio button in disguise', () => {
    const filter: RosterFilter = { ...NO_FILTER, origin: 'foreign', decade: 1990 }
    const rows = filterRoster(roster.all, filter)
    expect(isFiltered(filter)).toBe(true)
    for (const row of rows) {
      expect(row.origin).toBe('foreign')
      expect(row.fromYear).not.toBeNull()
    }
  })

  it('leaves the list alone when nothing is asked', () => {
    const untouched: Searchable[] = filterRoster(roster.all, NO_FILTER)
    expect(untouched).toBe(roster.all)
    expect(isFiltered(NO_FILTER)).toBe(false)
  })
})

describe('player-facts — the research pass, and what it is not allowed to do', () => {
  const file = JSON.parse(
    readFileSync(join(__dirname, '..', 'content', 'manual', 'player-facts.json'), 'utf8'),
  ) as {
    records: Array<{
      personNameHe: string
      personNameLatin: string
      position: string
      origin: string
      fromYear: number
      toYear: number
      matchedBy: string
      confidence: number
      alsoSpelled?: string[]
    }>
    unknown: string[]
    ambiguous: Record<string, string[]>
  }

  it('states all three fields on every row it states anything on', () => {
    for (const row of file.records) {
      expect(['GK', 'DF', 'MF', 'FW'], row.personNameHe).toContain(row.position)
      expect(['israeli', 'foreign'], row.personNameHe).toContain(row.origin)
      expect(row.fromYear, row.personNameHe).toBeGreaterThan(1900)
      expect(row.toYear, row.personNameHe).toBeGreaterThanOrEqual(row.fromYear)
    }
  })

  it('says how every row was arrived at', () => {
    // `matchedBy` is the audit trail. `alias` means our own Latin spelling agreed with
    // the source; `transliteration` means the two were aligned consonant by consonant
    // and the result was unique. A row with neither is a row nobody can check.
    for (const row of file.records) {
      expect(['alias', 'transliteration'], row.personNameHe).toContain(row.matchedBy)
    }
  })

  it('claims one man once, and declares it when the roster spells him twice', () => {
    const he = file.records.map((row) => row.personNameHe)
    expect(new Set(he).size).toBe(he.length)

    // Four men are in the roster under two Hebrew spellings (אישטוואן/אישטוון פישונט
    // and friends). Both rows stay, because somebody searching either spelling should
    // find him — but each one has to SAY so, or a row count reads as a player count.
    const byLatin = new Map<string, string[]>()
    for (const row of file.records) {
      byLatin.set(row.personNameLatin, [...(byLatin.get(row.personNameLatin) ?? []), row.personNameHe])
    }
    for (const [latin, names] of byLatin) {
      if (names.length === 1) continue
      for (const name of names) {
        const row = file.records.find((candidate) => candidate.personNameHe === name)
        expect(row?.alsoSpelled, `${latin} is claimed by ${names.join(' / ')} undeclared`).toEqual(
          names.filter((other) => other !== name).sort(),
        )
      }
    }
  })

  it('keeps the gap on the page instead of filling it in', () => {
    // The 328 the source does not cover, and the handful it contradicts itself about,
    // are LISTED. That is the difference between a record and a decoration: deleting
    // these two arrays would make the file look complete and be less true.
    expect(file.unknown.length).toBeGreaterThan(0)
    for (const name of file.unknown) {
      expect(file.records.find((row) => row.personNameHe === name)).toBeUndefined()
    }
    for (const name of Object.keys(file.ambiguous)) {
      expect(file.records.find((row) => row.personNameHe === name)).toBeUndefined()
    }
  })
})
