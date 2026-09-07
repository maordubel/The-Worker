/**
 * מה עוד חסר לצייר — every art key the game names, against what is on disk.
 *
 *   npx tsx scripts/life/art-audit.ts          → a table, grouped
 *   npx tsx scripts/life/art-audit.ts --md     → the Hebrew brief Maor gets
 *
 * Maor, 7.9.2026: *"תספק לי MD של כל הגרפיקות שאתה עדיין צריך ממני."* The same list was
 * written by hand once (`ART-REQUIRED.md`, delta 21) and was stale inside two days, so it
 * is generated: the tables in `art.ts` are everything the game can ask for, the files in
 * `public/life/art` are what exists, and the difference is the brief. It imports the real
 * module rather than reading it as text, so a key renamed in code cannot go unnoticed.
 *
 * Shelved names (`RETIRED_FIGURE`, `KID_WALK_SHELVED`, `PLANNED_FIGURE`) are excluded:
 * the game cannot reach them, so nobody has to draw them.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import {
  BACKDROP,
  CLOSE_UP,
  DOC,
  FIGURE,
  KID_POSE,
  KID_WALK,
  KID_WALK_SHELVED,
  LAYER,
  PANORAMA,
  PARALLAX,
  PLANNED_FIGURE,
  PORTRAIT_ART,
  PROP,
  RETIRED_FIGURE,
  SHIRT,
  TUNNEL_TEXTURE,
} from '../../lib/life/runtime/art'

const ART = join(process.cwd(), 'public/life/art')

const parallax: string[] = []
for (const base of PARALLAX) for (const suffix of ['--far', '--mid', '--near']) parallax.push(`${base}${suffix}`)

const GROUPS: ReadonlyArray<[string, readonly string[]]> = [
  ['רקעים', BACKDROP],
  ['חולצות', SHIRT],
  ['שכבות', LAYER],
  ['דמויות', FIGURE],
  ['פוגי — פוזות', Object.values(KID_POSE)],
  ['פוגי — הליכה', KID_WALK],
  ['חפצים', PROP],
  ['מסמכים', DOC],
  ['פורטרטים', PORTRAIT_ART],
  ['קלוז־אפים', CLOSE_UP],
  ['פנורמות', PANORAMA],
  ['טקסטורות מנהרה', TUNNEL_TEXTURE],
  ['פרלקסה', parallax],
]

const shelved = new Set<string>([...RETIRED_FIGURE, ...KID_WALK_SHELVED, ...PLANNED_FIGURE])

const rows: Array<[string, number, string[]]> = []
let declared = 0
let missing = 0
for (const [label, keys] of GROUPS) {
  const live = [...new Set(keys)].filter((key) => !shelved.has(key))
  const gone = live.filter((key) => !existsSync(join(ART, `${key}.png`)))
  declared += live.length
  missing += gone.length
  rows.push([label, live.length, gone])
}

if (process.argv.includes('--md')) {
  const lines: string[] = ['| קבוצה | קיים | חסר |', '|---|---|---|']
  for (const [label, total, gone] of rows) lines.push(`| ${label} | ${total - gone.length}/${total} | ${gone.length} |`)
  lines.push('')
  for (const [label, , gone] of rows) {
    if (gone.length === 0) continue
    lines.push(`### ${label} — ${gone.length}`, '', gone.map((key) => `\`${key}\``).join(' · '), '')
  }
  console.log(lines.join('\n'))
} else {
  for (const [label, total, gone] of rows) {
    console.log(`${label.padEnd(16)} ${String(total - gone.length).padStart(3)}/${String(total).padEnd(4)} missing ${gone.length}`)
    if (gone.length) console.log('   ' + gone.join(' '))
  }
  console.log(`\n${declared - missing}/${declared} present · ${missing} still to draw`)
}
