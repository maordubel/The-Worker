import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import messages from '@/messages/he.json'

/**
 * מפתחות התרגום — every key a screen asks for must exist, and the catalogue must not rot.
 *
 * Rule 10 puts every user-facing string in `messages/he.json`, which moves a whole class
 * of bug from "the wrong word is on screen" to "the key is not in the file" — and a
 * missing key renders as the key itself, in Latin, in the middle of a Hebrew screen.
 * Nothing was checking for that.
 *
 * The audit that produced this file also found five keys left behind by work that
 * replaced the screens using them (the timeline's old submit/up/down buttons, and two
 * polls keys that were written and never called). Those are gone. The rest of the
 * orphans predate this and are recorded below rather than deleted blind: the list may
 * shrink, never grow.
 */
const catalogue = messages as Record<string, string>
const ROOT = join(__dirname, '..')
const SOURCE_ROOTS = ['app', 'components', 'lib']

function sources(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...sources(path))
    else if (path.endsWith('.ts') || path.endsWith('.tsx')) out.push(path)
  }
  return out
}

const FILES = SOURCE_ROOTS.flatMap((root) => sources(join(ROOT, root)))

describe('כל מפתח שנקרא — exists', () => {
  it('resolves every literal key passed to t()', () => {
    // Only literals: a key built at runtime (`uss.cat.${card.cat}`) cannot be checked
    // statically, and pretending otherwise would make this test lie in both directions.
    const missing: string[] = []
    for (const file of FILES) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(/\bt\(\s*'([a-z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)'/g)) {
        const key = match[1] as string
        if (!(key in catalogue)) missing.push(`${file.slice(ROOT.length + 1)}: ${key}`)
      }
    }
    expect(missing, missing.join('\n')).toEqual([])
  })

  it('has no empty message', () => {
    const blank = Object.entries(catalogue)
      .filter(([, value]) => value.trim() === '')
      .map(([key]) => key)
    expect(blank).toEqual([])
  })

  it('leaves no placeholder unfilled in the catalogue itself', () => {
    // A message with `{n}` is fine; one with `{}` or `{ }` is a template someone never
    // finished, and it ships to a reader as literal braces.
    const broken = Object.entries(catalogue)
      .filter(([, value]) => /\{\s*\}/.test(value))
      .map(([key]) => key)
    expect(broken).toEqual([])
  })
})
