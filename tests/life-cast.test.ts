import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ALL_CHARACTERS } from '@/lib/life/characters'

/**
 * כל שם שנאמר על המסך הוא אדם שקיים.
 *
 * On 15.9.2026 Barry told the boy, in 1990, *"tell him Yossi asked after you."* There is
 * no Yossi. `characters.ts` has a יוסף — a different person, locked to a later chapter —
 * and nothing else. A name thrown into the air and never answered for is a debt the
 * fiction cannot pay: the attentive player asks "who is that", and the game has no answer
 * because there is nobody there.
 *
 * Rule 58 is the principle — *"a character is a row before it is a face"* — and the
 * registry exists so that nobody re-invents a person who already has a row. This suite is
 * the other half of that: nobody may invent a person who has no row at all.
 *
 * It reads SPEAKERS, because a speaker is a person by definition. A name mentioned inside
 * a line is not checked: a boy can talk about a referee, a bus driver or a cousin in Haifa
 * without the game owing that person a portrait.
 */

const CONTENT = join(process.cwd(), 'lib/life/content')

/** Every name the registry answers to — id and Hebrew alike. */
const KNOWN: ReadonlySet<string> = new Set(
  ALL_CHARACTERS.flatMap((character) => [
    character.id as string,
    character.displayNameHe,
    ...(character.aliases ?? []),
  ]),
)

/**
 * Speakers that are a ROLE rather than a person: the usher on the gate, the man behind the
 * counter, a voice in the crowd. They are legitimately nameless and legitimately recurring,
 * and giving each one a registry row would be inventing people to satisfy a test.
 */
const ROLES: ReadonlySet<string> = new Set([
  'אוהד', 'אוהדת', 'אוהד ותיק', 'סדרן', 'הסדרן', 'הקופאי', 'קופאית', 'המורה',
  'רפי מהקיוסק', 'מוכר הגרעינים', 'המוכר', 'הגבר', 'אבא עם ילד', 'ילד מהשכונה',
  'קריין', 'הרמקול', 'שוטר', 'נהג', 'חייל', 'מפקד', '@crowd',
  'המפקד', 'אוהד צעיר', 'אוהד עם רדיו', 'קול מהרדיו', 'הבוס', 'ילד',
])

function speakers(): Map<string, string[]> {
  const found = new Map<string, string[]>()
  for (const name of readdirSync(CONTENT)) {
    if (!name.endsWith('.ts')) continue
    const text = readFileSync(join(CONTENT, name), 'utf8')
    for (const match of text.matchAll(/who:\s*'([^']+)'/g)) {
      const who = match[1] as string
      const where = found.get(who) ?? []
      if (!where.includes(name)) where.push(name)
      found.set(who, where)
    }
  }
  return found
}

describe('הקאסט — כל דובר הוא אדם שקיים', () => {
  it('אף שיחה לא שמה שם בפה של מי שאינו ברישום', () => {
    const strangers: string[] = []
    for (const [who, files] of speakers()) {
      if (KNOWN.has(who) || ROLES.has(who)) continue
      strangers.push(`${who} — מדבר ב-${files.join(', ')} ואינו ב-characters.ts`)
    }
    expect(
      strangers,
      `a speaker with no row in the registry:\n${strangers.join('\n')}`,
    ).toEqual([])
  })

  it('בארי נכנס בשמו ב-1986 ולא לפני כן', () => {
    // His canonical entry is Gate 7, 1986 — `chapter1986.ts` and `dialogue.ts` both say so
    // in as many words. A5 is September 1985, and he spoke there under his own name in a
    // beat while the conversation beside it had already been corrected to an unnamed
    // veteran. Half a fix is how a canon starts disagreeing with itself.
    const a5 = readFileSync(join(CONTENT, 'chapterStageA.ts'), 'utf8')
    const beats = a5.slice(a5.indexOf('BEATS_A5'), a5.indexOf('ENDINGS_A6'))
    expect(beats, "Barry is named in A5, a year before his canonical entry").not.toContain("who: 'בארי'")
  })

  it('הפנקס של ההסעה הוא של מישל בכל מקום שהוא מוזכר', () => {
    // Michel Bar-Khalifa ran the supporters' transport in the eighties and nineties
    // (Maor Harel, personal knowledge, 15.9.2026). The ledger — who travelled, who was
    // late, what it cost — is that job. It had drifted onto Limor, was given back, and
    // then reappeared on her forty lines below the comment that moved it.
    for (const file of ['chapter1993galil.ts', 'chapter1993cup.ts']) {
      const text = readFileSync(join(CONTENT, file), 'utf8')
      for (const line of text.split('\n')) {
        if (!line.includes('פנקס')) continue
        if (line.trimStart().startsWith('*') || line.trimStart().startsWith('//')) continue
        expect(line, `${file}: the transport ledger is Michel's, not Limor's`).not.toContain('לימור')
      }
    }
  })
})
