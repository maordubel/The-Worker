/**
 * The builder's inputs, read the same way by `build-bank.ts`, `validate-bank.ts` and the
 * tests — so "the file is what a fresh build makes" is a comparison of like with like.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { BuildInput } from '@/lib/game/blind-cow/build'
import type { BlindCowBank } from '@/lib/game/blind-cow/types'

export const ROOT = join(__dirname, '..', '..')
export const BANK_PATH = join(ROOT, 'content/generated/blind-cow-bank.json')
export const SQL_PATH = join(ROOT, 'supabase/migrations/20260924090000_worker_blind_cow.sql')

const sha = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16)

export function readInputs(previous: BlindCowBank | null = readBank()): BuildInput {
  const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')
  const pmText = read('content/generated/player-master.json')
  const mmText = read('content/generated/match-master.json')
  const pm = JSON.parse(pmText)
  const mm = JSON.parse(mmText)
  const graph = JSON.parse(read('content/generated/entity-graph.json'))
  const comps = JSON.parse(read('content/manual/competitions.json'))
  const teamNames = new Map<string, string>()
  for (const e of graph.entities as { id: string; type: string; titleHe: string; confidence: number }[]) {
    if (e.type === 'team' && e.id.startsWith('team:football:') && e.confidence >= 2) {
      teamNames.set(e.id.slice('team:football:'.length), e.titleHe)
    }
  }
  return {
    players: pm.players,
    matches: mm.matches,
    moments: mm.moments,
    teamNames,
    competitionNames: new Map((comps.records as { slug: string; nameHe: string }[]).map((r) => [r.slug, r.nameHe])),
    playerMasterSha: sha(pmText),
    matchMasterSha: sha(mmText),
    previous,
  }
}

export function readBank(): BlindCowBank | null {
  return existsSync(BANK_PATH) ? (JSON.parse(readFileSync(BANK_PATH, 'utf8')) as BlindCowBank) : null
}
