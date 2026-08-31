'use server'

import { gradeKitChallenge, type KitVerdict } from '@/lib/game/kitChallenge'

export async function submitKit(
  seed: number,
  answer: { maker: string | null; sponsor: string | null },
): Promise<KitVerdict | null> {
  return gradeKitChallenge(seed, answer)
}
