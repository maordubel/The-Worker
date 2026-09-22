'use server'

import { crestLabel } from '@/lib/game/kitBuild'
import { kitByLegacyKey, kitRecord, specOf } from '@/lib/kit/kit-master'
import { COLOUR_NAME, PATTERNS, type KitSpec } from '@/lib/kit/spec'
import { signKitUnlock, verifyKitUnlock } from '@/lib/kit/unlock'

/**
 * שער 5 — the shirts a device proved it built, and nothing else.
 *
 * The /kits page ships every kit as a season and a variant; the spec — the sponsor, the maker, the
 * crest, the whole answer to that shirt's Gate 4 puzzle — comes from here, and only for a token
 * Gate 4 signed (`lib/kit/unlock.ts`). A collection written before tokens existed sends its keys
 * once as `legacy`; they are accepted and handed back tokens, which the device then keeps.
 * That is exactly as strong as the device store it came from — written down, not hidden.
 */

export type UnlockedKit = {
  key: string
  seasonLabel: string
  variant: KitSpec['variant']
  spec: KitSpec
  dna: boolean
  makerHe: string | null
  sponsorHe: string | null
  crestHe: string | null
  patternHe: string
  baseHe: string
  noteHe: string
  sourceTitle: string
  confidence: number
  look: 'photo' | 'vector'
}

const MAX = 60

function unlocked(kitId: string, dna: boolean): UnlockedKit | null {
  const kit = kitRecord(kitId)
  if (!kit) return null
  const spec = specOf(kit)
  return {
    key: kit.legacyKey,
    seasonLabel: kit.seasonLabel,
    variant: kit.variant,
    spec,
    dna,
    makerHe: spec.makerHe,
    sponsorHe: spec.sponsorHe,
    crestHe: spec.crestKey ? crestLabel(spec.crestKey) : null,
    patternHe: PATTERNS.find((row) => row.id === spec.pattern)?.he ?? spec.pattern,
    baseHe: COLOUR_NAME[spec.base],
    noteHe: kit.noteHe,
    sourceTitle: kit.sourceTitle,
    confidence: kit.confidence,
    look: kit.render.photo.available && kit.render.photo.complete ? 'photo' : 'vector',
  }
}

export async function kitDnaFor(
  tokens: string[],
  legacy: { key: string; dna: boolean }[] = [],
): Promise<{ rows: UnlockedKit[]; minted: Record<string, { token: string; dna: boolean }> }> {
  const rows = new Map<string, UnlockedKit>()
  for (const token of (Array.isArray(tokens) ? tokens : []).slice(0, MAX)) {
    const proof = verifyKitUnlock(token)
    if (!proof) continue
    const row = unlocked(proof.kitId, proof.dna)
    if (row && (!rows.get(row.key)?.dna || proof.dna)) rows.set(row.key, row)
  }
  const minted: Record<string, { token: string; dna: boolean }> = {}
  for (const entry of (Array.isArray(legacy) ? legacy : []).slice(0, MAX)) {
    if (typeof entry?.key !== 'string' || rows.has(entry.key)) continue
    const kit = kitByLegacyKey(entry.key)
    if (!kit) continue
    const dna = entry.dna === true
    const row = unlocked(kit.id, dna)
    if (!row) continue
    rows.set(row.key, row)
    minted[row.key] = { token: signKitUnlock(kit.id, dna), dna }
  }
  return { rows: [...rows.values()], minted }
}
