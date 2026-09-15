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

  it('reaches every name, and places only some of them', () => {
    expect(roster.total).toBeGreaterThan(600)
    expect(roster.withPosition).toBeGreaterThan(0)
    // This is the assertion that matters, and it is meant to look wrong: the archive
    // holds 637 names and a position for a few dozen. Rule 24 already recorded why a
    // guessed shortlist is worse than no shortlist. The day somebody "fills in" the
    // rest from a shirt number or a name, this fails.
    expect(roster.withPosition).toBeLessThan(roster.total / 2)
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
