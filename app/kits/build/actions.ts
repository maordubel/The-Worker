'use server'

import { gradeKitBuild, type KitBuildVerdict } from '@/lib/game/kitBuild'

/** Server authority: the season's real kit is derived here from the seed. */
export async function submitKitBuild(
  seed: number,
  index: number,
  picked: Record<string, string>,
): Promise<KitBuildVerdict | null> {
  return gradeKitBuild(seed, index, picked)
}
