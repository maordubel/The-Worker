'use server'

import { grade, type Verdict } from '@/lib/game/trivia'

/**
 * Server authority. The correct answer is derived here from the round seed and never
 * travels to the client before it is earned. A tampered answer simply grades false.
 */
export async function submitAnswer(
  seed: number,
  index: number,
  answer: string | string[],
): Promise<Verdict | null> {
  return grade(seed, index, answer)
}
