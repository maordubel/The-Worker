import { describe, expect, it } from 'vitest'

import { isDerbyFixture } from '@/scripts/ingest/lib/guards'
import { IngestReport } from '@/scripts/ingest/lib/report'
import { concatBundles, runPipeline } from '@/scripts/ingest/pipeline'
import { loadManualBundle } from '@/scripts/ingest/sources/manual'
import { TRIVIA_CONFIDENCE_FLOOR, type StagedBundle } from '@/scripts/ingest/lib/types'

const ROOT = process.cwd()

function seed(): { bundle: StagedBundle; report: IngestReport } {
  const report = new IngestReport('seed-test')
  const { bundle } = runPipeline(concatBundles([loadManualBundle(ROOT, report)]), report)
  return { bundle, report }
}

describe('curated seed', () => {
  it('loads without a single rejected or unresolved record', () => {
    const { report } = seed()
    expect(report.rejected).toEqual([])
    expect(report.unresolved).toEqual([])
  })

  it('every fact at or above the trivia floor carries a source', () => {
    const { bundle } = seed()
    const facts = [
      ...bundle.clubs,
      ...bundle.venues,
      ...bundle.people,
      ...bundle.matches,
      ...bundle.matchEvents,
      ...bundle.trophies,
      ...bundle.moments,
      ...bundle.sponsorDeals,
      ...bundle.kitSupplySpells,
      ...bundle.crestVersions,
      ...bundle.associationEvents,
    ].filter((row) => row.confidence >= TRIVIA_CONFIDENCE_FLOOR)

    expect(facts.length).toBeGreaterThan(50)
    for (const fact of facts) {
      const traceable = fact.source.url !== null || fact.source.kind === 'manual'
      expect(traceable, `${fact.source.naturalKey} has no traceable source`).toBe(true)
    }
  })
})

describe('derby — Maccabi Tel Aviv only', () => {
  it('declares exactly one derby rival', () => {
    const { bundle } = seed()
    const rivals = bundle.clubs.filter((club) => club.isDerbyRival)
    expect(rivals.map((club) => club.nameHe)).toEqual(['מכבי תל אביב'])
  })

  it('marks the Maccabi fixture as a derby and a European tie as not', () => {
    const { bundle } = seed()
    const derby = bundle.matches.find((match) => match.awayClubSlug.includes('הפועל') && match.homeClubSlug.includes('מכבי'))
    const europe = bundle.matches.find((match) => match.competitionSlug === 'גביע-אופא')

    expect(derby).toBeDefined()
    expect(isDerbyFixture(bundle.clubs, derby!)).toBe(true)
    expect(europe).toBeDefined()
    expect(isDerbyFixture(bundle.clubs, europe!)).toBe(false)
  })

  it('does not treat any other club as a rival', () => {
    const { bundle } = seed()
    for (const club of bundle.clubs) {
      if (club.nameHe === 'מכבי תל אביב') continue
      expect(club.isDerbyRival).toBe(false)
    }
  })
})

describe('football and basketball never mix', () => {
  it('gives every match a competition and two clubs of one sport', () => {
    const { bundle } = seed()
    const sportOfClub = new Map(bundle.clubs.map((club) => [club.slug, club.sport]))
    const sportOfCompetition = new Map(
      bundle.competitions.map((competition) => [competition.slug, competition.sport]),
    )

    expect(bundle.matches.length).toBeGreaterThan(0)
    for (const match of bundle.matches) {
      const sport = sportOfCompetition.get(match.competitionSlug)
      expect(sportOfClub.get(match.homeClubSlug)).toBe(sport)
      expect(sportOfClub.get(match.awayClubSlug)).toBe(sport)
    }
  })

  it('keeps the basketball club, its association and its arena on the basketball side', () => {
    const { bundle } = seed()
    const association = bundle.associations[0]
    expect(association?.sport).toBe('basketball')

    const basketballClub = bundle.clubs.find((club) => club.slug === association?.clubSlug)
    expect(basketballClub?.sport).toBe('basketball')

    const ussishkin = bundle.venues.find((venue) => venue.nameHe.includes('אוסישקין'))
    expect(ussishkin?.sport).toBe('basketball')
  })

  it('keeps every football trophy out of the basketball sport', () => {
    const { bundle } = seed()
    expect(bundle.trophies.every((trophy) => trophy.sport === 'football')).toBe(true)
  })
})

describe('what the research pass could not verify stays out', () => {
  it('records no Toto Cup win for 2025 — that final was lost', () => {
    const { bundle } = seed()
    const toto2025 = bundle.trophies.find(
      (trophy) => trophy.competitionSlug === 'גביע-הטוטו' && trophy.seasonLabel === '2025/26',
    )
    expect(toto2025?.result).toBe('runner_up')
  })

  it('ships no songs, because no melody attribution could be sourced', () => {
    const { bundle } = seed()
    expect(bundle.songs).toEqual([])
  })

  it('leaves the 1,000th-member date unconfirmed rather than picking one', () => {
    const { bundle } = seed()
    const milestone = bundle.membershipMilestones.find((row) => row.number === 1000)
    expect(milestone?.personNameHe).toBe('אריק איינשטיין')
    expect(milestone?.dateConfirmed).toBe(false)
    expect(milestone?.happenedOn).toBeNull()
  })

  it('leaves the association founding date unconfirmed', () => {
    const { bundle } = seed()
    const founding = bundle.associationEvents.find((event) => event.kind === 'founding')
    expect(founding?.dateConfirmed).toBe(false)
  })

  it('keeps disagreements as open conflicts instead of choosing a winner', () => {
    const { bundle } = seed()
    expect(bundle.factConflicts.length).toBeGreaterThanOrEqual(5)
    expect(bundle.factConflicts.every((conflict) => conflict.resolution === null)).toBe(true)

    const titles = bundle.factConflicts.find((c) => c.field === 'championship_count')
    expect(titles?.claimA).toContain('13')
    expect(titles?.claimB).toContain('12')
  })
})

describe('Maor Harel appears only where a source puts him', () => {
  it('is documented through roles and a dated quote, not through prose', () => {
    const { bundle } = seed()
    const roles = bundle.associationRoles.filter((role) => role.personSlug === 'מאור-הראל')
    expect(roles.map((role) => role.roleHe).sort()).toEqual(['חבר הנהלה', 'מייסד'])

    const board = roles.find((role) => role.roleHe === 'חבר הנהלה')
    expect(board?.toDate).toBe('2012-10-17')
    expect(board?.replacedByNameHe).toBe("ארז זייצ'יק")
    expect(board?.source.url).toContain('ynet')
  })

  it('never appears in football records — the Ussishkin story is basketball', () => {
    const { bundle } = seed()
    expect(bundle.squadMemberships.some((row) => row.personSlug === 'מאור-הראל')).toBe(false)
    expect(bundle.matchEvents.some((row) => row.personSlug === 'מאור-הראל')).toBe(false)
  })
})

describe('kit supply spells', () => {
  it('records Nike as three separate spells — the fact the kit game turns on', () => {
    const { bundle } = seed()
    const nike = bundle.kitSupplySpells.filter((spell) => spell.manufacturerSlug === 'nike')
    expect(nike).toHaveLength(3)
    expect(nike.filter((spell) => spell.isCurrent)).toHaveLength(1)
  })

  it('leaves the seasons the archive does not cover as gaps', () => {
    const { bundle } = seed()
    const covered = new Set(bundle.kitSupplySpells.map((spell) => spell.fromLabel))
    expect(covered.has('1981/82')).toBe(false)
    expect(covered.has('2003/04')).toBe(false)
  })
})
