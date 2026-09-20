#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(process.argv[2] ?? process.cwd())
const TOOL = path.dirname(fileURLToPath(import.meta.url))
const OVERLAY = path.join(TOOL, 'overlay')

function die(message) { console.error(`Royal Rumble V2: ${message}`); process.exit(1) }
function read(rel) { const p = path.join(ROOT, rel); if (!fs.existsSync(p)) die(`missing ${rel}`); return fs.readFileSync(p, 'utf8') }
function write(rel, content) { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content) }
function replaceOnce(rel, before, after, label) {
  const current = read(rel)
  const hits = current.split(before).length - 1
  if (hits !== 1) die(`${label}: expected one anchor in ${rel}, found ${hits}`)
  write(rel, current.replace(before, after))
}
function copy(rel) {
  const src = path.join(OVERLAY, rel)
  if (!fs.existsSync(src)) die(`overlay missing ${rel}`)
  write(rel, fs.readFileSync(src, 'utf8'))
}

for (const rel of [
  'app/royal-rumble/RoyalRumbleLiveRun.tsx',
  'app/royal-rumble/RoyalRumbleMode.tsx',
  'app/royal-rumble/RoyalRumbleSlotReveal.tsx',
  'app/royal-rumble/live-actions.ts',
  'app/royal-rumble/page.tsx',
  'lib/game/royal-rumble-seeds.ts',
  'lib/royal-rumble/i18n.ts',
  'supabase/migrations/20260920090000_royal_rumble_live.sql',
]) copy(rel)

replaceOnce(
  'lib/game/royal-rumble.ts',
  "import { facetsFor, type Position } from './roster-facets'\n",
  "import { facetsFor, type Position } from './roster-facets'\nimport { royalRumbleMatchSeed } from './royal-rumble-seeds'\n",
  'engine seed import',
)

replaceOnce(
  'lib/game/royal-rumble.ts',
  `/** The only function a server action needs. Ratings never cross this boundary. */\nexport function playRoyalRumble(seed: number, slugs: readonly string[]): RoyalRumbleResult | null {\n  const selected = validateSelection(seed, slugs)\n  if (!selected) return null\n  const opponent = dealOpponent(seed)\n  if (opponent.length !== ROYAL_RUMBLE_LINEUP_SIZE) return null\n  return simulate(seed, selected, opponent)\n}\n`,
  `function mirrorPitchPlayer(player: RoyalRumblePitchPlayer): RoyalRumblePitchPlayer {\n  return { ...player, x: 100 - player.x }\n}\n\nfunction awayPerspective(result: RoyalRumbleResult, home: RatedPlayer[]): RoyalRumbleResult {\n  return {\n    opponent: home.map(publicPlayer),\n    scoreFor: result.scoreAgainst,\n    scoreAgainst: result.scoreFor,\n    winner: result.winner === 'draw' ? 'draw' : result.winner === 'us' ? 'them' : 'us',\n    frames: result.frames.map((frame) => ({\n      ...frame,\n      scoreFor: frame.scoreAgainst,\n      scoreAgainst: frame.scoreFor,\n      ball: { x: 100 - frame.ball.x, y: frame.ball.y },\n      us: frame.them.map(mirrorPitchPlayer),\n      them: frame.us.map(mirrorPitchPlayer),\n    })),\n  }\n}\n\nexport function playRoyalRumbleHeadToHead(\n  matchSeed: number,\n  homeOfferSeed: number,\n  homeSlugs: readonly string[],\n  guestOfferSeed: number,\n  guestSlugs: readonly string[],\n): { home: RoyalRumbleResult; away: RoyalRumbleResult } | null {\n  const home = validateSelection(homeOfferSeed, homeSlugs)\n  const away = validateSelection(guestOfferSeed, guestSlugs)\n  if (!home || !away) return null\n  const resolved = simulate(matchSeed >>> 0, home, away)\n  return { home: resolved, away: awayPerspective(resolved, home) }\n}\n\n/** The only solo function a server action needs. Ratings never cross this boundary. */\nexport function playRoyalRumble(seed: number, slugs: readonly string[]): RoyalRumbleResult | null {\n  const selected = validateSelection(seed, slugs)\n  if (!selected) return null\n  const matchSeed = royalRumbleMatchSeed(seed)\n  const opponent = dealOpponent(matchSeed)\n  if (opponent.length !== ROYAL_RUMBLE_LINEUP_SIZE) return null\n  return simulate(matchSeed, selected, opponent)\n}\n`,
  'engine resolver',
)

replaceOnce(
  'app/royal-rumble/RoyalRumbleRun.tsx',
  "import { submitRoyalRumble } from './actions'\n",
  "import { submitRoyalRumble } from './actions'\nimport { RoyalRumbleSlotReveal } from './RoyalRumbleSlotReveal'\n",
  'solo reveal import',
)

const patches = [
  ["${selected ? 'border-paper/15 bg-paper/95' : 'border-ink/10 bg-sheet'}", "${selected ? 'border-paper/15 bg-transparent' : 'border-ink/10 bg-transparent'}"],
  ['mx-auto mt-1 hidden h-12 items-center justify-center bg-paper sm:flex', 'mx-auto mt-1 hidden h-12 items-center justify-center bg-transparent sm:flex'],
  ["${ours ? 'border-red bg-paper' : 'border-ink bg-paper'}", "${ours ? 'border-red bg-transparent' : 'border-ink bg-transparent'}"],
  ['flex h-10 items-center justify-center bg-paper', 'flex h-10 items-center justify-center bg-transparent'],
  ['border-y-hair border-ink/10 bg-sheet py-2', 'border-y-hair border-ink/10 bg-transparent py-2'],
]
for (const [before, after] of patches) {
  const current = read('app/royal-rumble/RoyalRumbleRun.tsx')
  if (current.includes(before)) write('app/royal-rumble/RoyalRumbleRun.tsx', current.replace(before, after))
}

replaceOnce(
  'app/royal-rumble/RoyalRumbleRun.tsx',
  `        <div className="grid grid-cols-3 gap-2 sm:gap-3">\n          {currentSlot.offers.map((player, index) => (\n            <DraftCard`,
  `        <div className="relative">\n          <RoyalRumbleSlotReveal offers={currentSlot.offers} signature={\`${'${activeDraft.seed}-${activeSlot}'}\`} />\n          <div className="grid grid-cols-3 gap-2 sm:gap-3">\n          {currentSlot.offers.map((player, index) => (\n            <DraftCard`,
  'solo slot open',
)
replaceOnce(
  'app/royal-rumble/RoyalRumbleRun.tsx',
  `          ))}\n        </div>\n        <p className="mt-3 text-center font-body text-[9px] text-concrete">{t('fadedNote')}</p>`,
  `          ))}\n          </div>\n        </div>\n        <p className="mt-3 text-center font-body text-[9px] text-concrete">{t('fadedNote')}</p>`,
  'solo slot close',
)

console.log('Royal Rumble V2 applied')
