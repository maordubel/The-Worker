'use server'

import {
  gradeKitPuzzle,
  kitHint,
  type KitHintAnswer,
  type KitHintKind,
  type KitVerdict,
  type PartKind,
} from '@/lib/game/kitBuild'

export async function submitKit(
  seed: number,
  index: number,
  placed: Partial<Record<PartKind, string>>,
  cursor = 0,
  hintsUsed = 0,
): Promise<KitVerdict | null> {
  return gradeKitPuzzle(seed, index, placed, cursor, hintsUsed)
}

export async function askKitHint(
  seed: number,
  index: number,
  kind: KitHintKind,
  cursor = 0,
): Promise<KitHintAnswer | null> {
  return kitHint(seed, index, kind, cursor)
}
