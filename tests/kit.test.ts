import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { dealKitRound, gradeKitPuzzle, kitPuzzleCount } from '@/lib/game/kitBuild'
import { KIT_ROUND, PART_ORDER, PART_POINTS, PERFECT_BONUS } from '@/lib/game/kit-build-run'
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
