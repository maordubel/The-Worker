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
 * A delta that REPLACES a screen ships the new file — but the old one stays in git
 * until somebody deletes it, and a stale import is a red build on the deploy even
 * though everything local is green. That happened twice with
 * `app/kits/build/KitChallengeBoard.tsx`, which kept importing a server action that no
 * longer exists.
 *
 * So the list of retired paths is a TEST. `npm run test` now fails on a machine that
 * still has one, before it can fail on Vercel, and `bash scripts/cleanup-retired.sh`
 * fixes it in one command. The two lists are checked against each other, so a path
 * added to the script is automatically enforced here.
 */
describe('retired files', () => {
  const ROOT = process.cwd()
  const script = readFileSync(join(ROOT, 'scripts/cleanup-retired.sh'), 'utf8')
  const retired = [...script.matchAll(/^\s*"([^"]+)"\s*(?:#.*)?$/gm)].map((match) => match[1] as string)

  it('lists the paths the cleanup script knows about', () => {
    expect(retired.length).toBeGreaterThan(5)
    expect(retired).toContain('app/kits/build/KitChallengeBoard.tsx')
  })

  it('none of them are still in the tree', () => {
    const left = retired.filter((path) => existsSync(join(ROOT, path)))
    expect(
      left,
      `still present — run: bash scripts/cleanup-retired.sh\n  ${left.join('\n  ')}`,
    ).toEqual([])
  })
})
