'use server'

import { judge, judgePair, type CardVerdict, type PairVerdict, type Verdict } from '@/lib/game/blackfile'

/** Server authority. The truth of a card never travels to the client before it is earned. */
export async function submitCard(slug: string, answer: Verdict): Promise<CardVerdict | null> {
  return judge(slug, answer)
}

export async function submitPair(id: string, pickedSlug: string): Promise<PairVerdict | null> {
  return judgePair(id, pickedSlug)
}
