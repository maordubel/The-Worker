import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { dealKitRound, kitPartReference } from '@/lib/game/kitBuild'
import { PART_ORDER } from '@/lib/game/kit-build-run'
import { makerAssetForName, sponsorAssetForName } from '@/lib/kit/mark-library'
import { exactArchivePhoto } from '@/lib/kit/archive-dna'

const ROOT = join(__dirname, '..')

describe('Kit System V3 — archive DNA', () => {
  it('makes crest a real eighth Gate 4 decision', () => {
    expect(PART_ORDER).toEqual(['base','secondary','pattern','collar','sleeve','maker','sponsor','crest'])
    const puzzle = dealKitRound(17)[0]!
    expect(puzzle.blank.crestKey).toBeNull()
    expect(puzzle.drawers.map((row) => row.kind)).toEqual([...PART_ORDER])
  })

  it('never sends a real archive filename or season in a visual reference', () => {
    for (const puzzle of dealKitRound(23)) {
      const payload = JSON.stringify(puzzle.drawers)
      expect(payload).not.toContain('/kits/')
      expect(payload).not.toContain(puzzle.seasonLabel)
      for (const drawer of puzzle.drawers) {
        for (const part of drawer.parts) {
          if (!part.hasReference) continue
          expect(part.id).toMatch(/^[a-z]+-[a-f0-9]{10}$/)
          expect(kitPartReference(part.id)).toMatch(/^\/kits\/.+\.webp$/)
        }
      }
    }
  })

  it('uses only exact-season photographs as reconstruction evidence', () => {
    const photo = exactArchivePhoto('2009/10', 'home')
    if (photo) {
      expect(photo.seasonAmbiguous).toBe(false)
      expect(photo.seasonLabel).toBe('2009/10')
    }
  })

  it('ships the supplied maker and sponsor cuts used by the studio', () => {
    const assets = [
      makerAssetForName('adidas', '1985/86'),
      makerAssetForName('umbro', '2009/10'),
      sponsorAssetForName('VISA'),
      sponsorAssetForName('SUBARU'),
    ]
    for (const asset of assets) {
      expect(asset).not.toBeNull()
      expect(existsSync(join(ROOT, 'public', asset!.src))).toBe(true)
    }
  })
})
