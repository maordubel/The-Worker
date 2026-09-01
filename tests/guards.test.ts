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

  it('no tombstone imports anything that could break', () => {
    // The whole point is that these compile forever. A tombstone may re-export a live
    // module or redirect; it may not pull a server action, a deleted lib, or a type.
    for (const path of TOMBSTONES) {
      const text = readFileSync(join(ROOT, path), 'utf8')
      const imports = [...text.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1] as string)
      for (const source of imports) {
        expect(
          source === 'next/navigation' || source.startsWith('./'),
          `${path} imports ${source}`,
        ).toBe(true)
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
