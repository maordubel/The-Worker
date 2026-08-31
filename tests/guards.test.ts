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
