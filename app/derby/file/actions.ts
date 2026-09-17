'use server'

import { judge, judgePair, type CardVerdict, type PairVerdict, type Verdict } from '@/lib/game/blackfile'

/** Server authority. The truth of a card never travels to the client before it is earned. */
export async function submitCard(id: string, answer: Verdict): Promise<CardVerdict | null> {
  return judge(id, answer)
}

export async function submitPair(
  aId: string,
  bId: string,
  pickedId: string,
): Promise<PairVerdict | null> {
  return judgePair(aId, bId, pickedId)
}
