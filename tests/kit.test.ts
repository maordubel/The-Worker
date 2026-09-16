import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { dealKitRound, gradeKitPuzzle, kitPuzzleCount } from '@/lib/game/kitBuild'
import { KIT_ROUND, PART_ORDER, PART_POINTS, PERFECT_BONUS } from '@/lib/game/kit-build-run'
import {
  archiveDecades,
  archiveShirts,
  archiveSources,
  archiveVariants,
} from '@/lib/kit/archive'
import { facetCounts, kitCatalog } from '@/lib/kit/catalog'
import { CREST_FILES, CREST_MARKS, crestArt, crestMark } from '@/lib/kit/crestMarks'
import { seasonKits } from '@/lib/kit/seasons'
import { markFor } from '@/components/kit/MakerMark'

const ROOT = join(__dirname, '..')
const SEEDS = Array.from({ length: 120 }, (_, index) => index + 1)

describe('שער 4 — משחק המדים', () => {
  it('has more shirts than one round, so two players do not get the same five', () => {
    expect(kitPuzzleCount()).toBeGreaterThan(KIT_ROUND * 2)
  })

  it('deals five shirts, five drawers each, three real options a drawer', () => {
    for (const seed of SEEDS) {
      const round = dealKitRound(seed)
      expect(round, `seed ${seed}`).toHaveLength(KIT_ROUND)
      for (const puzzle of round) {
        expect(puzzle.drawers.map((drawer) => drawer.kind)).toEqual([...PART_ORDER])
        for (const drawer of puzzle.drawers) {
          expect(drawer.parts.length, `seed ${seed} ${drawer.kind}`).toBe(3)
          // A drawer with the same part twice is two identical buttons, one of which
          // scores as wrong — the class of bug the timeline shipped with (rule 31).
          const ids = drawer.parts.map((part) => part.id)
          expect(new Set(ids).size, `seed ${seed} ${drawer.kind} duplicates`).toBe(ids.length)
          for (const part of drawer.parts) expect(part.kind).toBe(drawer.kind)
        }
      }
    }
  })

  it('never deals the same shirt twice in one round', () => {
    for (const seed of SEEDS) {
      const seasons = dealKitRound(seed).map((puzzle) => `${puzzle.seasonLabel}:${puzzle.variant}`)
      expect(new Set(seasons).size, `seed ${seed}`).toBe(seasons.length)
    }
  })

  it('hands the client a blank shirt — no graded field survives the deal', () => {
    for (const seed of SEEDS.slice(0, 40)) {
      for (const puzzle of dealKitRound(seed)) {
        expect(puzzle.blank.sponsorHe, `seed ${seed}`).toBeNull()
        expect(puzzle.blank.makerHe, `seed ${seed}`).toBeNull()
        expect(puzzle.blank.crestKey, `seed ${seed}`).toBeNull()
        expect(puzzle.blank.pattern, `seed ${seed}`).toBe('solid')
      }
    }
  })

  it('leaks no season through a part id or label', () => {
    // Every id and label travels to the browser. A key like `body:2004/05` in the DOM
    // would hand the answer to anyone who opened the inspector — which is exactly the
    // leak the timeline shipped with (rule 31), so it is checked here from the start.
    //
    // The founding year INSIDE a crest key (`circle-1927`) is deliberately not a leak:
    // that badge was worn for years and it identifies an era, not a season. The test is
    // about the puzzle's own season, not about any four digits.
    for (const seed of SEEDS.slice(0, 40)) {
      for (const puzzle of dealKitRound(seed)) {
        const blob = JSON.stringify(puzzle.drawers)
        expect(blob, `seed ${seed}`).not.toContain(puzzle.seasonLabel)
        expect(blob, `seed ${seed}`).not.toMatch(/\d{4}\/\d{2}/)
        // and the year the season starts in, on its own
        expect(blob, `seed ${seed}`).not.toContain(puzzle.seasonLabel.slice(0, 4))
      }
    }
  })

  it('can be assembled perfectly, and pays what the screen says it pays', () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < KIT_ROUND; index += 1) {
        const blind = gradeKitPuzzle(seed, index, {})
        expect(blind, `seed ${seed} #${index}`).not.toBeNull()
        expect(blind!.right).toBe(0)
        expect(blind!.score).toBe(0)

        // The truth is the id in `truth` on each part verdict — playing it back must be
        // a perfect shirt, or some seed deals a puzzle that cannot be solved.
        const perfect = Object.fromEntries(blind!.parts.map((part) => [part.kind, part.truth]))
        const graded = gradeKitPuzzle(seed, index, perfect)
        expect(graded!.perfect, `seed ${seed} #${index} is unsolvable`).toBe(true)
        expect(graded!.right).toBe(PART_ORDER.length)
        expect(graded!.score).toBe(PART_ORDER.length * PART_POINTS + PERFECT_BONUS)
        // and the right answer is always in the drawer the player is shown
        const puzzle = dealKitRound(seed)[index]!
        for (const part of graded!.parts) {
          const drawer = puzzle.drawers.find((row) => row.kind === part.kind)!
          expect(
            drawer.parts.some((option) => option.id === part.truth),
            `seed ${seed} #${index}: the right ${part.kind} is not in its drawer`,
          ).toBe(true)
        }
      }
      expect(gradeKitPuzzle(seed, KIT_ROUND, {}), `seed ${seed}`).toBeNull()
    }
  })

  it('only deals shirts the archive knows all five parts of', () => {
    // A puzzle missing a sponsor would silently be worth 160 instead of 200, and the
    // score on screen would stop meaning what the rule under it says.
    for (const seed of SEEDS.slice(0, 40)) {
      for (const puzzle of dealKitRound(seed)) {
        const kit = seasonKits().find(
          (row) => row.seasonLabel === puzzle.seasonLabel && row.variant === puzzle.variant,
        )
        expect(kit, `seed ${seed} ${puzzle.seasonLabel}`).toBeDefined()
        expect(kit!.spec.sponsorHe).not.toBeNull()
        expect(kit!.spec.makerHe).not.toBeNull()
        expect(kit!.spec.crestKey).not.toBeNull()
      }
    }
  })
})

describe('הסמלים — printed, never approximated (rule 25)', () => {
  it('has an entry for every crest era the archive resolves to', () => {
    const used = new Set(
      seasonKits()
        .map((kit) => kit.spec.crestKey)
        .filter((key): key is string => key !== null),
    )
    for (const key of used) {
      expect(crestMark(key), `no CREST_MARKS entry for ${key}`).not.toBeNull()
    }
  })

  it('has the artwork on disk for every entry, light and dark', () => {
    for (const file of CREST_FILES) {
      expect(existsSync(join(ROOT, 'public/brand/crests', `${file}.png`)), file).toBe(true)
    }
    for (const mark of CREST_MARKS) {
      expect(crestArt(mark.key, false)).toContain(mark.file)
      expect(crestArt(mark.key, true)).toContain(mark.onRed ?? mark.file)
    }
  })

  it('draws nothing rather than approximating an unknown crest', () => {
    expect(crestArt('not-a-crest', false)).toBeNull()
    expect(crestArt(null, false)).toBeNull()
  })

  it('prints the crest as an image, and never re-draws one in the plate', () => {
    // The first version of the kit plate drew a shield with a stroke for the hammer.
    // Rule 25 exists because Maor supplied the club's own marks.
    const plate = readFileSync(join(ROOT, 'components/kit/KitPlate.tsx'), 'utf8')
    expect(plate).toContain('<image')
    expect(plate).toContain('crestArt')
  })
})

describe('סימני היצרנים — the alternative set', () => {
  it('gives every maker in the archive a mark', () => {
    const makers = new Set(
      seasonKits()
        .map((kit) => kit.spec.makerHe)
        .filter((name): name is string => name !== null),
    )
    for (const maker of makers) {
      expect(markFor(maker, '2010/11'), `no mark for ${maker}`).not.toBeNull()
    }
  })

  it('gives adidas the trefoil in the eighties and the bars after', () => {
    expect(markFor('adidas', '1984/85')).toBe('classic')
    expect(markFor('adidas', '2021/22')).toBe('adio')
  })

  it('draws them rather than reproducing a trademark', () => {
    const marks = readFileSync(join(ROOT, 'components/kit/MakerMark.tsx'), 'utf8')
    // No image, no href, no file: eight paths and nothing fetched.
    expect(marks).not.toContain('<image')
    expect(marks).not.toContain('href')
  })
})

describe('שער 5 — האוסף', () => {
  const catalog = kitCatalog()

  it('holds every kit the archive draws, not the mockup\'s 24', () => {
    expect(catalog).toHaveLength(seasonKits().length)
    expect(catalog.length).toBeGreaterThanOrEqual(33)
  })

  it('keys every kit uniquely on season and variant', () => {
    const keys = catalog.map((kit) => kit.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('carries the source through from the archive row', () => {
    // Rule 16: showing the source is the product. A shirt drawn from a photograph has
    // to be able to say which photograph — the card prints this line.
    for (const kit of catalog) {
      expect(kit.sourceTitle, kit.key).not.toBe('')
      expect(kit.confidence, kit.key).toBeGreaterThanOrEqual(2)
    }
  })

  it('marks a kit playable only when gate 4 can actually deal it', () => {
    for (const kit of catalog) {
      const complete =
        kit.spec.sponsorHe !== null && kit.spec.makerHe !== null && kit.spec.crestKey !== null
      expect(kit.playable, kit.key).toBe(complete)
    }
  })

  it('counts the facets against the catalogue itself', () => {
    const counts = facetCounts(catalog)
    expect(counts.all).toBe(catalog.length)
    expect(counts.home + counts.away + counts.third).toBe(catalog.length)
  })

  it('never prints a locked shirt\'s answers', () => {
    // The grid hid the drawing behind an outline and printed the sponsor underneath it,
    // and the card of an unbuilt shirt drew the whole shirt plus its full spec — the
    // complete answer sheet to that shirt\'s puzzle in gate 4, one tap from the grid.
    const wing = readFileSync(join(ROOT, 'app/kits/KitWing.tsx'), 'utf8')
    // the sponsor on a grid card is gated on `built`
    expect(wing).toContain('built && kit.sponsorHe')
    // an unbuilt shirt routes to the locked card, which draws no KitPlate
    expect(wing).toContain('if (open) return <LockedCard')
    const locked = wing.slice(wing.indexOf('function LockedCard'))
    expect(locked).not.toContain('<KitPlate')
  })

  it('keeps the collection store behind its interface', () => {
    const wing = readFileSync(join(ROOT, 'app/kits/KitWing.tsx'), 'utf8')
    const store = readFileSync(join(ROOT, 'lib/kit/collection.ts'), 'utf8')
    expect(wing).not.toContain('localStorage')
    expect(store).toContain('localStorage')
    expect(store).toContain('readonly remote = false')
  })
})

/**
 * ארכיון החולצות — 168 photographs, and the two things that can rot.
 *
 * A photograph archive has exactly two failure modes worth a test, and neither of them
 * is "does the grid render". The first is a file on disk that no row describes, or a
 * row that describes a file that is not there — an archive that lists a shirt it cannot
 * show is worse than one that admits it has 168. The second is a date the archive was
 * never told: 114 of these are dated by a single year in the source, and the day
 * somebody "tidies" that into a season is the day the archive starts lying quietly.
 */
describe('ארכיון החולצות — התצלומים, והתאריכים שלא ידועים', () => {
  const shirts = archiveShirts()
  const messages = JSON.parse(readFileSync(join(ROOT, 'messages/he.json'), 'utf8')) as Record<
    string,
    string
  >

  it('shows every file it has, and has every file it shows', () => {
    const onDisk = new Set(
      readdirSync(join(ROOT, 'public/kits')).filter((name) => name.endsWith('.webp')),
    )
    for (const shirt of shirts) {
      const file = shirt.src.replace('/kits/', '')
      expect(onDisk.has(file), `${shirt.slug} is in the archive but not on disk`).toBe(true)
      onDisk.delete(file)
    }
    // A file with no row is a photograph nobody can say anything about — and it would
    // ship, because it is in `public/`. The provenance audit fails on it too.
    expect([...onDisk], 'files in public/kits that no archive row covers').toEqual([])
  })

  it('carries the size of the file that is actually there', () => {
    // The yellow count cannot be re-derived in a test — nothing here decodes WebP — so
    // the byte length stands in for it. A shirt re-exported, re-cropped or re-encoded
    // without re-running `scripts/kits/build-archive.py` changes its size, and the
    // measurement the third yellow exemption rests on would be describing a file that
    // no longer exists. This is the cheap check that catches that.
    for (const shirt of shirts) {
      const size = statSync(join(ROOT, 'public', shirt.src)).size
      expect(size, `${shirt.slug}: re-measure with scripts/kits/build-archive.py`).toBe(
        shirt.bytes,
      )
    }
  })

  it('never turns a year into a season', () => {
    for (const shirt of shirts) {
      if (shirt.seasonAmbiguous) {
        expect(shirt.seasonLabel, shirt.slug).toBeNull()
        expect(shirt.yearRaw, shirt.slug).toBeGreaterThan(1900)
      } else {
        expect(shirt.seasonLabel, shirt.slug).toMatch(/^\d{4}\/\d{2}$/)
      }
    }
  })

  it('says "בערך" on screen rather than inventing a season', () => {
    // The uncertainty has to reach the reader, in the same type as a certain date — the
    // read-model can only refuse to guess, and refusing silently would look identical.
    const wing = readFileSync(join(ROOT, 'app/kits/archive/ArchiveWing.tsx'), 'utf8')
    expect(wing).toContain('seasonAmbiguous')
    expect(wing).toContain('kits.archive.approx')
    expect(messages['kits.archive.approx']).toBe('בערך')
    expect(messages['kits.archive.approxOf']).toContain('בערך')
    // and the note that explains WHY is on the card of every such shirt
    expect(wing).toContain('kits.archive.approxNote')
  })

  it('joins the maker only where the season is certain', () => {
    // "The 2016 shirt" straddles two supply spells often enough to matter, so an
    // ambiguous row gets no maker rather than the likelier of two.
    for (const shirt of shirts) {
      if (shirt.seasonAmbiguous) expect(shirt.makerHe, shirt.slug).toBeNull()
    }
    // and the join actually resolves for the seasons the supply timeline covers
    expect(shirts.filter((shirt) => shirt.makerHe !== null).length).toBeGreaterThan(30)
  })

  it('reads newest first, and every shirt carries a source', () => {
    const years = shirts.map((shirt) => shirt.year)
    expect([...years].sort((a, b) => b - a)).toEqual(years)
    for (const shirt of shirts) {
      expect(shirt.sourceTitle, shirt.slug).toMatch(/\S/)
      expect(shirt.sourceUrl, shirt.slug).toMatch(/^https:\/\//)
      expect(['vikipoel', 'fka']).toContain(shirt.source)
    }
  })

  it('counts its facets against the archive itself', () => {
    const decades = archiveDecades(shirts)
    const variants = archiveVariants(shirts)
    expect(decades.reduce((sum, row) => sum + row.count, 0)).toBe(shirts.length)
    expect(variants.reduce((sum, row) => sum + row.count, 0)).toBe(shirts.length)
    // an empty decade is not a filter — every rail entry has something behind it
    for (const row of decades) expect(row.count, String(row.decade)).toBeGreaterThan(0)
    for (const row of variants) expect(row.count, row.variant).toBeGreaterThan(0)
    expect(archiveSources(shirts).reduce((sum, row) => sum + row.count, 0)).toBe(shirts.length)
  })

  it('credits the photographer, because a photographer is a source with a name', () => {
    const vikipoel = archiveSources(shirts).find((row) => row.key === 'vikipoel')
    expect(vikipoel?.creditHe).toContain('ישי צבי')
    const wing = readFileSync(join(ROOT, 'app/kits/archive/ArchiveWing.tsx'), 'utf8')
    expect(wing).toContain('creditHe')
  })

  it('serves the bytes it measured', () => {
    // Next's optimiser re-encodes, and a re-encode invents chroma (rules 27, 61) — which
    // would make the yellow number printed on the card untrue. The archive uses a plain
    // <img>, and the marker the sweep hides is on every one of them.
    const wing = readFileSync(join(ROOT, 'app/kits/archive/ArchiveWing.tsx'), 'utf8')
    expect(wing).not.toContain('next/image')
    // `<img` followed by a newline — the elements, not the `<img>` in the doc comment
    const photos = wing.match(/<img\n/g) ?? []
    const marks = wing.match(/data-archive-photo/g) ?? []
    expect(photos.length).toBeGreaterThan(0)
    expect(marks.length).toBe(photos.length)
  })
})
