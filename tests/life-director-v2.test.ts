import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const file = (path: string) => readFileSync(join(root, path), 'utf8')

describe('Director v2 — documentary / encounters / 1996', () => {
  it('routes the 1996 era through the Director Cut', () => {
    const era = file('lib/life/content/era.ts')
    const dialogue = file('lib/life/content/dialogue.ts')
    expect(era).toContain("from './chapter1996director'")
    expect(dialogue).toContain("from './chapter1996director'")
  })

  it('makes Gate 5 a physical choice, not a dead objective', () => {
    const army = file('lib/life/content/chapter1996director.ts')
    expect(army).toContain("e: 'travel', to: 'gate5'")
    expect(army).toContain("e: 'gate', to: 'gate5', reason: 'culture'")
    expect(army).toContain("23 בנובמבר 1996")
    expect(army).not.toContain("16 בנובמבר 1996")
  })

  it('restores seeded random encounters across late Stage B', () => {
    const era = file('lib/life/content/era.ts')
    const pool = file('lib/life/content/encountersStageB.ts')
    expect(era).toContain('encountersForStageB(chapter)')
    expect(pool).toContain("era: '1996-army'")
    expect(pool).toContain("era: '1998-laces'")
    expect(pool).toContain("era: '2000-double'")
  })

  it('plays the supplied Cup 83 archive after the interactive memory', () => {
    const prologue = file('lib/life/runtime/scenes/PrologueScene.ts')
    const film = file('components/life/FilmCut.tsx')
    expect(prologue).toContain("clip: 'cup83-archive'")
    expect(film).toContain("archive ? 38_000 : 6_200")
  })

  it('uses documentary transitions that explicitly connect world and Pugi', () => {
    const card = file('components/life/ChapterCard.tsx')
    expect(card).toContain('TIME → WORLD → PUGI')
    expect(card).toContain('העולם')
    expect(card).toContain('פוגי')
  })
})
