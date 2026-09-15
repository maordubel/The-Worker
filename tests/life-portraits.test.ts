import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ALL_CHARACTERS, portraitFor, speakerKeys } from '@/lib/life/characters'

/**
 * לכל דמות הפנים שלה — every speaker resolves to a plate, or is named here as one that
 * does not have one yet.
 *
 * `Say.who` is free text, and that is fine: a writer types `who: 'קובי'` in one scene and
 * `who: 'kobi'` in the next. What was NOT fine is that the portrait maps are keyed by the
 * Hebrew name only and the dialogue box looked the speaker up with a plain
 * `portraits[who]`. Every line spelled by id resolved to `undefined`, and the box drew a
 * nameplate with no face.
 *
 * Measured on 15.9.2026: **363 of 953 lines — 38% of the dialogue in the game** — had no
 * portrait, 109 of them Kobi. Nothing threw, because a missing plate is a `?? null` and
 * `null` is what a narration line legitimately passes. The defect had exactly the shape
 * of a deliberate choice, which is why it lasted.
 *
 * `portraitFor()` resolves through the registry, so both spellings find the same face.
 * This suite holds that, and makes the remaining gaps a list somebody chose rather than
 * a silence nobody noticed.
 */

const CONTENT = join(process.cwd(), 'lib/life/content')

/** Every key any era's plate map answers to. */
const PLATE_KEYS: ReadonlySet<string> = (() => {
  const keys = new Set<string>()
  for (const name of readdirSync(CONTENT)) {
    if (!name.endsWith('.ts')) continue
    const text = readFileSync(join(CONTENT, name), 'utf8')
    for (const block of text.matchAll(
      /export const PORTRAIT[A-Z0-9_]*\s*:\s*Record<string, string>\s*=\s*\{([\s\S]*?)\n\}/g,
    )) {
      for (const entry of (block[1] as string).matchAll(/'([^']+)'\s*:/g)) keys.add(entry[1] as string)
    }
  }
  return keys
})()

function speakers(): Map<string, number> {
  const found = new Map<string, number>()
  for (const name of readdirSync(CONTENT)) {
    if (!name.endsWith('.ts')) continue
    const text = readFileSync(join(CONTENT, name), 'utf8')
    for (const match of text.matchAll(/who:\s*'([^']+)'/g)) {
      const who = match[1] as string
      found.set(who, (found.get(who) ?? 0) + 1)
    }
  }
  return found
}

function resolves(who: string): boolean {
  return speakerKeys(who).some((key) => PLATE_KEYS.has(key))
}

/**
 * Speakers with no plate anywhere, as of 15.9.2026. Each is a real gap, not a licence:
 *
 *  · `asaf` — 17 lines across 1998-laces, 1996-army and 1999-cup and NO plate in any era.
 *    The largest hole in the cast; he carries a chapter and speaks without a face.
 *  · `michel` — מישל בר־כליפא has commissioned artwork on disk (`michel99`, `michel96-*`)
 *    and no portrait entry, so the one line that names him by id draws nothing.
 *  · the rest are one-scene extras (a vendor, a cashier, a man in a queue). An extra with
 *    no face is a legitimate choice; an extra that grows lines is not, which is what the
 *    line-count ceiling below is for.
 */
const NO_PLATE_YET: ReadonlySet<string> = new Set([
  'asaf',
  'michel',
  'yaron',
  '@crowd',
  'הסדרן',
  'מוכר הגרעינים',
  'המוכר',
  'אבא עם ילד',
  'הגבר',
  'קופאית',
])

describe('לכל דמות הפנים שלה', () => {
  it('שני האיותים של אותו אדם מגיעים לאותו פלייט', () => {
    const kobi = ALL_CHARACTERS.find((character) => character.id === 'kobi')
    expect(kobi?.displayNameHe).toBe('קובי')

    const plates = { 'קובי': 'faceKobi' }
    expect(portraitFor('קובי', plates)).toBe('faceKobi')
    expect(portraitFor('kobi', plates), 'the id spelling must find the same face').toBe('faceKobi')
  })

  it('איות גולמי גובר על הרישום — עידן רשאי להחליף פלייט לפרק אחד', () => {
    const plates = { kobi: 'faceKobi90', 'קובי': 'faceKobi' }
    expect(portraitFor('kobi', plates)).toBe('faceKobi90')
  })

  it('לא ממציא פנים למי שאינו ברישום', () => {
    expect(portraitFor('מישהו שלא קיים', { 'קובי': 'faceKobi' })).toBeNull()
  })

  it('כל דובר במשחק מגיע לפלייט, או רשום כאן כחסר', () => {
    const orphans: string[] = []
    for (const [who, lines] of speakers()) {
      if (resolves(who) || NO_PLATE_YET.has(who)) continue
      orphans.push(`${who} (${lines} שורות)`)
    }
    expect(
      orphans,
      `speakers with no portrait and no entry in NO_PLATE_YET:\n${orphans.join('\n')}`,
    ).toEqual([])
  })

  it('פחות מ-6% מהשורות במשחק בלי פנים', () => {
    // It was 38.1%. This ceiling is what keeps it from drifting back.
    let withFace = 0
    let faceless = 0
    for (const [who, lines] of speakers()) {
      if (resolves(who)) withFace += lines
      else faceless += lines
    }
    const share = faceless / (withFace + faceless)
    expect(share, `${(share * 100).toFixed(1)}% of lines render with no portrait`).toBeLessThan(0.06)
  })

  it('דמות שאין לה פלייט לא צוברת תפקיד בשקט', () => {
    // An extra with no face is fine. An extra with thirty lines is a character somebody
    // forgot to commission art for — which is exactly how `asaf` got to seventeen.
    const loud: string[] = []
    for (const [who, lines] of speakers()) {
      if (resolves(who)) continue
      if (lines > 20) loud.push(`${who}: ${lines} שורות ואין לו פנים`)
    }
    expect(loud, loud.join('\n')).toEqual([])
  })
})
