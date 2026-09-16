import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CLOSE_UP, CLOSE_UP_FALLBACK, CLOSE_UP_PAINTED } from '@/lib/life/runtime/art'

/**
 * פלייט שמצייר שני אנשים, וחור שהסתיר שישים וחמישה קבצים.
 *
 * `faceTeacher` is 172×260 and holds TWO half-teachers, cut across the gutter of an
 * expression sheet — and `chapter1991.ts`, `chapter1998laces.ts` and `characters.ts` all
 * pointed `'המורה'` at it, so every line she has ever spoken drew two half-faces in the
 * dialogue box. Eleven plates in two families are cut the same way.
 *
 * **Nothing caught it because nothing knew the files existed.** Sixty-five face plates
 * were on disk and none was in `manifest.json`: the yellow proof counts the registry and
 * the art audit walks the registry, so both reported clean while these sat outside. When
 * they were finally registered, forty-three of them were carrying yellow —
 * `faceSinai-point` alone had 2,531 pixels inside the band, shipping, against rule 8.
 *
 * So this suite holds the registry closed. A file nothing knows about is a file nothing
 * can check, and that is the defect underneath both of the others.
 */
const ART = join(process.cwd(), 'public/life/art')
const MANIFEST = JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8')) as {
  portraits: Record<string, { w: number; h: number; yellowLeft?: number }>
}
const PLATES = readdirSync(ART).filter((name) => name.startsWith('face') && name.endsWith('.webp')).map((name) => name.slice(0, -5))

describe('פלייטים של פנים', () => {
  it('כל פלייט רשום, ומוכח נקי מצהוב', () => {
    const unregistered = PLATES.filter((key) => !MANIFEST.portraits[key])
    expect(unregistered, `face plates on disk and not in the manifest:\n${unregistered.join('\n')}`).toEqual([])
    const dirty = PLATES.filter((key) => (MANIFEST.portraits[key]?.yellowLeft ?? 0) > 0)
    expect(dirty, `face plates the manifest records as carrying yellow:\n${dirty.join('\n')}`).toEqual([])
  })

  /**
   * ומה שהמשחק מצביע עליו מצייר אדם אחד.
   *
   * **The list is eyeballed, and it has to be.** The script's detector counts runs of
   * figure across a line at face height, and a raised arm is a run: it called
   * `faceSinai-point` — one man pointing — two people, and `faceTeacher-tired` the same
   * for a cardigan sleeve. It also called five whole plates broken until it learned to
   * read ALPHA rather than the colour of pixel (1,1), because Keren's keyed corner is
   * black and her hair then reads as background.
   *
   * So the script narrows sixty-five plates to a handful and a person looks at the
   * handful. Seven survived that look, in two families, both from the same delivery —
   * which is what a single wrong column offset looks like. Anything automatic here would
   * either put names on a re-cut list that do not belong there, costing an afternoon of
   * drawing that was never needed, or miss the one that is wired.
   */
  const TWO_FACED: ReadonlySet<string> = new Set([
    // Seven names left this list on 16.9.2026 — the five Rachels and the two teachers —
    // because the delivery re-cut them one whole column at a time and they now arrive at
    // a uniform 130×260. The uniform width is the tell: a set of cuts that respects the
    // gutter has one width, and the widths these replaced ran 102 to 202.
    //
    // `faceTeacher-angry` REPLACES them. It was never suspected, because the detector
    // narrows by runs of figure and it does not fail on this one — but with `faceTeacher`
    // beside it as a known-good 130-wide cut, its 117 is narrow in the same family, and
    // the right-hand edge strip shows a second woman's hair, earring and cardigan. Found
    // by eye, the same way the other seven were.
    'faceTeacher-angry',
  ])

  it('שום קלוז־אפ לא נופל על פלייט עם שני אנשים', () => {
    const bad = CLOSE_UP.filter((key) => TWO_FACED.has(CLOSE_UP_FALLBACK[key]))
    expect(bad, `a close-up falls back to a plate that draws two people:\n${bad.join('\n')}`).toEqual([])
  })

  it('לכל קלוז־אפ יש פלייט קיים לעמוד במקומו', () => {
    const onDisk = new Set(readdirSync(ART).map((name) => name.replace(/\.webp$/, '')))
    const missing = CLOSE_UP.filter((key) => !CLOSE_UP_PAINTED.includes(key) && !onDisk.has(CLOSE_UP_FALLBACK[key]))
    expect(missing, `a close-up has neither a painted plate nor a fallback on disk:\n${missing.join('\n')}`).toEqual([])
  })

  it('פלייט של דמות עם שם לא מצביע על אחד מהשבורים', () => {
    const content = join(process.cwd(), 'lib/life/content')
    const wired: string[] = []
    for (const name of readdirSync(content).filter((file) => file.endsWith('.ts'))) {
      const text = readFileSync(join(content, name), 'utf8')
      for (const match of text.matchAll(/'([^']+)'\s*:\s*'(face[\w-]+)'/g)) {
        if (TWO_FACED.has(match[2] as string)) wired.push(`${name}: ${match[1]} → ${match[2]}`)
      }
    }
    expect(wired, `a portrait map points at a plate that draws two people:\n${wired.join('\n')}`).toEqual([])
  })
})
