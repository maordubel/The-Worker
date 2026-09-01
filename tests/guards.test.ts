import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { classifySport, isFootball } from '@/scripts/ingest/lib/guards'

describe('sport guard', () => {
  it('accepts a football page', () => {
    expect(
      classifySport({
        title: 'הפועל תל אביב (כדורגל)',
        categories: ['שחקני הפועל תל אביב (כדורגל)'],
      }).sport,
    ).toBe('football')
  })

  it('rejects a basketball page', () => {
    const verdict = classifySport({
      title: 'סגל הפועל תל אביב (כדורסל)',
      categories: ['שחקני כדורסל'],
    })
    expect(verdict.sport).toBe('basketball')
    expect(isFootball({ title: 'סגל הפועל תל אביב (כדורסל)' })).toBe(false)
  })

  it('refuses to guess when both sports appear on one page', () => {
    const verdict = classifySport({
      title: 'הפועל תל אביב',
      body: 'המועדון מפעיל מחלקת כדורגל ומחלקת כדורסל',
    })
    expect(verdict.sport).toBe('unknown')
    expect(verdict.reason).toContain('both sports')
  })

  it('refuses a page with no sport marker', () => {
    expect(classifySport({ title: 'רשימת קפטנים' }).sport).toBe('unknown')
  })

  it('is the import gate: only proven football passes', () => {
    expect(isFootball({ title: 'עונת 2001/02 (כדורגל)' })).toBe(true)
    expect(isFootball({ title: 'עונת 2001/02 (כדורסל)' })).toBe(false)
    expect(isFootball({ title: 'משהו אחר' })).toBe(false)
  })
})

/**
 * מצבות — retired files that must always COMPILE.
 *
 * Deltas reach the repo through GitHub's web upload, which adds and overwrites files
 * but never deletes them. A retired file that still contains a broken import therefore
 * keeps failing `next build` on the deploy long after the local tree is clean — which
 * is exactly what happened with `KitChallengeBoard.tsx`, twice. Asking for a delete
 * command was the wrong fix. The right one: **a retired file is replaced by an inert
 * tombstone, never left broken and never merely deleted.**
 *
 * This test is what stops a tombstone being quietly revived with real code again.
 */
describe('retired files are tombstones', () => {
  const ROOT = process.cwd()
  const TOMBSTONES = [
    'app/kits/build/KitChallengeBoard.tsx', // → KitRun.tsx
    'app/trivia/summary/page.tsx', // → the run ends in place; this redirects
    'app/trivia/summary/ShareCard.tsx', // → components/share/ShareRow.tsx
    'components/press/StoryCard.tsx', // → lib/share/story.ts
    'app/derby/BlackFile.tsx', // → app/derby/file/BlackFile.tsx
    'app/derby/actions.ts', // → app/derby/file/actions.ts
    'app/kits/build/KitRun.tsx', // → KitBuildRun.tsx
    'app/derby/HateBracket.tsx', // → HateHill.tsx
    'app/goal/GoalBoard.tsx', // → GoalRun.tsx
    'app/crest/CrestRun.tsx', // → cut by Maor; the crest DATA still dresses the kits
    'app/crest/actions.ts',
  ]

  it('every retired path still exists and says it is retired', () => {
    for (const path of TOMBSTONES) {
      const full = join(ROOT, path)
      expect(existsSync(full), `${path} is missing — a deleted tombstone is a red deploy`).toBe(
        true,
      )
      expect(readFileSync(full, 'utf8'), path).toContain('TOMBSTONE')
    }
  })

  it('no tombstone imports a local module', () => {
    // The whole point is that these compile FOREVER. An earlier version of the gate 4
    // tombstone re-exported the file that replaced it — and broke the moment that file
    // was itself renamed. A tombstone that depends on a living module is not a
    // tombstone. The only import any of them may carry is Next's own redirect.
    for (const path of TOMBSTONES) {
      const text = readFileSync(join(ROOT, path), 'utf8')
      const imports = [...text.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1] as string)
      for (const source of imports) {
        expect(source, `${path} imports ${source}`).toBe('next/navigation')
      }
      expect(text, `${path} must not declare a server action`).not.toContain("'use server'")
    }
  })

  it('is short — a tombstone that grows is a file somebody revived', () => {
    for (const path of TOMBSTONES) {
      const lines = readFileSync(join(ROOT, path), 'utf8').split('\n').length
      expect(lines, path).toBeLessThan(30)
    }
  })
})

/**
 * המניפסט — every path this project has ever shipped, and none of them may vanish.
 *
 * The tombstone rule only works if someone remembers to write the tombstone, and on
 * 1.9.2026 nobody did: gate 4's component was renamed, the old file was deleted, and
 * any tree still carrying it would import a server action that no longer existed. Third
 * time for the same class of bug.
 *
 * So remembering is a file now. `docs/shipped-paths.txt` is append-only, and this test
 * fails the moment a listed path is gone. The fix for a failure is a tombstone at that
 * path — never a shorter list.
 */
describe('shipped paths', () => {
  const ROOT = process.cwd()
  const listed = readFileSync(join(ROOT, 'docs/shipped-paths.txt'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))

  it('remembers a real number of paths', () => {
    expect(listed.length).toBeGreaterThan(80)
  })

  it('every path it remembers still exists — tombstone it, do not delete it', () => {
    const missing = listed.filter((path) => !existsSync(join(ROOT, path)))
    expect(
      missing,
      `deleted without a tombstone — put an inert file back at each path:\n  ${missing.join('\n  ')}`,
    ).toEqual([])
  })

  it('has no duplicates and stays sorted, so a diff on it is readable', () => {
    expect(new Set(listed).size).toBe(listed.length)
    expect([...listed].sort()).toEqual(listed)
  })
})
