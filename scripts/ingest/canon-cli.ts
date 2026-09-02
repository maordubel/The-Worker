/**
 * npm run wiki:canon — turn a corpus already on disk into canonical rows.
 *
 * Reads `data/wiki-corpus/pages/*.json`, routes every page to its parser, and writes a
 * staged bundle plus a coverage report. **It never touches the network**, so it can be
 * re-run after any parser change for free.
 *
 * ```
 * npm run wiki:canon                                  # every season in the corpus
 * npm run wiki:canon -- --seasons 1980/81,1981/82,1982/83
 * npm run wiki:canon -- --out data/canon             # where the bundle lands
 * npm run wiki:canon -- --write-ids                  # persist newly minted match ids
 * ```
 *
 * `--write-ids` is opt-in on purpose. Minting an id is a one-way act: once a life stores
 * `m_9f2c0a41b7d3`, that id has to keep meaning the same match forever. A dry run shows
 * what WOULD be minted; only an explicit flag commits it.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { canonFromCorpus, readCorpus } from './sources/redfans-canon'
import { loadRegistry, saveRegistry } from './lib/matchIds'

function flag(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`)
  return at === -1 ? undefined : process.argv[at + 1]
}

function has(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

async function main(): Promise<void> {
  const root = process.cwd()
  const out = flag('out') ?? 'data/canon'
  const seasons = (flag('seasons') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const pages = readCorpus(root)
  if (pages.length === 0) {
    console.error(
      'No corpus on disk. Fetch it first:\n' +
        '  npm run wiki:corpus -- --dry-run\n' +
        'Nothing was written.',
    )
    process.exitCode = 1
    return
  }

  const registry = loadRegistry(root)
  const result = canonFromCorpus(pages, { seasons, root, registry })

  const dir = join(root, out)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'bundle.json'),
    `${JSON.stringify(result.bundle, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(dir, 'match-ids.json'),
    `${JSON.stringify(Object.fromEntries(result.matchIds), null, 2)}\n`,
    'utf8',
  )
  writeFileSync(join(dir, 'report.md'), result.report.toMarkdown(), 'utf8')

  if (has('write-ids')) {
    saveRegistry(root, result.registry)
    console.log(`registry written · ${result.minted} newly minted`)
  } else if (result.minted > 0) {
    console.log(`${result.minted} ids WOULD be minted — re-run with --write-ids to commit`)
  }

  console.log(
    [
      `corpus pages read: ${pages.length}`,
      `shapes: ${Object.entries(result.shapes)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${k}=${n}`)
        .join(' · ')}`,
      `matches: ${result.bundle.matches.length}`,
      `goals: ${result.bundle.matchEvents.length}`,
      `squad rows: ${result.bundle.squadMemberships.length}`,
      `people: ${result.bundle.people.length}`,
      `seasons: ${result.bundle.seasons.length}`,
      `skipped: ${result.report.skipped.length} · rejected: ${result.report.rejected.length}`,
      `written to ${out}/`,
    ].join('\n'),
  )
}

void main()
