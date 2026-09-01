import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const MANUAL = join(process.cwd(), 'content/manual')

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

  it('ships only songs whose melody or season a source states', () => {
    // This used to assert the song file was EMPTY, because the first research pass
    // could not source a single melody attribution. The research master now sources
    // nine of them, so the rule it was standing in for is asserted directly instead:
    // a song at or above the floor carries something a question can be built on.
    const { bundle } = seed()
    const usable = bundle.songs.filter((song) => song.confidence >= TRIVIA_CONFIDENCE_FLOOR)
    expect(usable.length).toBeGreaterThan(5)
    for (const song of usable) {
      const anchored =
        song.originalTitle !== null || song.seasonLabel !== null || song.personSlug !== null
      expect(anchored, `${song.titleHe} is above the floor with nothing to anchor it`).toBe(true)
    }

    // A bare title with no melody, no season and no player stays below the floor.
    const bare = bundle.songs.filter((song) => song.confidence < TRIVIA_CONFIDENCE_FLOOR)
    expect(bare.length).toBeGreaterThan(0)
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

  it('keeps disagreements as open conflicts unless a named person settled them', () => {
    const { bundle } = seed()
    expect(bundle.factConflicts.length).toBeGreaterThanOrEqual(5)

    // Nothing resolves itself. A conflict leaves the open state only when a person
    // is named as having settled it — an anonymous verdict is indistinguishable
    // from the pipeline quietly picking a winner, which rule 11 forbids.
    const open = bundle.factConflicts.filter((conflict) => conflict.resolution === null)
    expect(open.length).toBeGreaterThanOrEqual(5)
    for (const conflict of bundle.factConflicts) {
      if (conflict.resolution === null) {
        expect(conflict.resolvedBy, `${conflict.field} has a resolver but no verdict`).toBeNull()
      } else {
        expect(conflict.resolvedBy, `${conflict.field} was resolved anonymously`).toBeTruthy()
      }
    }

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

describe('no bare scoreline survives in Hebrew content', () => {
  it('never writes a score as "0:3" between or beside team names', () => {
    // A separator score cannot say whose number is whose once it sits in an RTL line
    // (see components/ui/Num.tsx). Every score in prose is written team-adjacent:
    // "הפועל תל אביב 3 — בנפיקה 0". A clock time (06:39) is not a score.
    // The message catalogue is user-facing text too — that is where the wall's Milan
    // headline was still printing a bare "0:1".
    const messages = JSON.parse(
      readFileSync(join(process.cwd(), 'messages/he.json'), 'utf8'),
    ) as Record<string, string>
    for (const [key, value] of Object.entries(messages)) {
      const found = /(?<!\d)(\d):(\d)(?!\d)/.exec(value)
      if (found && found[1] === found[2]) continue
      // A clock time is written HH:MM and is not a score.
      if (/\d\d:\d\d/.test(value)) continue
      expect(found, `messages/he.json · ${key}: "${value}"`).toBeNull()
    }

    const files = readdirSync(MANUAL).filter((name) => name.endsWith('.json'))
    for (const name of files) {
      const raw = readFileSync(join(MANUAL, name), 'utf8')
      const parsed = JSON.parse(raw) as { records?: unknown[] }
      for (const record of parsed.records ?? []) {
        for (const [field, value] of Object.entries(record as Record<string, unknown>)) {
          if (typeof value !== 'string') continue
          // Only prose the player reads. Claims quoted from a conflicting source keep
          // the wording that source used.
          if (!/^(titleHe|bodyHe|subtitleHe|noteHe)$/.test(field)) continue
          // A chant that literally shouts a scoreline is folklore quoted verbatim.
          // Rewriting it would falsify the thing being recorded.
          if ((record as { verbatimQuote?: boolean }).verbatimQuote) continue
          // A draw cannot be reversed — 1:1 reads the same from either side — so only
          // a decisive score is a problem.
          const bare = /(?<!\d)(\d):(\d)(?!\d)/.exec(value)
          if (bare && bare[1] === bare[2]) continue
          expect(bare, `${name} · ${field}: "${bare?.[0]}" in "${value.slice(0, 60)}"`).toBeNull()
        }
      }
    }
  })
})
