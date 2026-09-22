'use server'

import {
  gradeKitPuzzle,
  kitHint,
  STEP_ORDER,
  type KitHintAnswer,
  type KitHintKind,
  type KitStep,
  type KitVerdict,
  type KitWindow,
} from '@/lib/game/kitBuild'

/**
 * שער 4 — the two calls the run makes. The server deals again from the seed and grades against
 * its own deal; the client sends option ids and hint receipts, never a value (rule 4).
 */

function clean(placed: unknown): Partial<Record<KitStep, string>> {
  const out: Partial<Record<KitStep, string>> = {}
  if (typeof placed !== 'object' || placed === null) return out
  for (const step of STEP_ORDER) {
    const id = (placed as Record<string, unknown>)[step]
    if (typeof id === 'string' && /^[0-9a-f]{12}$/.test(id)) out[step] = id
  }
  return out
}

export async function submitKit(
  seed: number,
  index: number,
  placed: Partial<Record<KitStep, string>>,
  cursor = 0,
  receipts: string[] = [],
  claimedHints = 0,
  window?: KitWindow,
): Promise<KitVerdict | null> {
  if (!Number.isInteger(seed) || !Number.isInteger(index) || !Number.isInteger(cursor)) return null
  const proofs = Array.isArray(receipts) ? receipts.filter((r): r is string => typeof r === 'string').slice(0, 6) : []
  return gradeKitPuzzle(seed, index, clean(placed), cursor, proofs, Number(claimedHints) || 0, cleanWindow(window))
}

/**
 * THE WORKER LIFE's window (`lib/mechanics/types.ts`): a year, a kit id and an option count,
 * nothing else — the same grade over the one shirt the life ordered.
 */
function cleanWindow(window?: KitWindow): KitWindow | undefined {
  if (!window || !Number.isFinite(window.before)) return undefined
  const pin = typeof window.pin === 'string' && /^kit-[0-9a-z-]{4,40}$/.test(window.pin) ? window.pin : null
  const options = Number.isInteger(window.options) ? Math.max(2, Math.min(5, window.options as number)) : undefined
  return { before: Math.round(window.before), pin, ...(options ? { options } : {}) }
}

export async function askKitHint(
  seed: number,
  index: number,
  kind: KitHintKind,
  cursor = 0,
  window?: KitWindow,
): Promise<KitHintAnswer | null> {
  if (!Number.isInteger(seed) || !Number.isInteger(index) || !Number.isInteger(cursor)) return null
  return kitHint(seed, index, kind, cursor, cleanWindow(window))
}
