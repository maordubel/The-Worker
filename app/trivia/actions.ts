'use server'

import { DEFAULT_TOPIC, type Topic } from '@/lib/game/topics'
import { grade, type Verdict } from '@/lib/game/trivia'

/**
 * Server authority. The correct answer is derived here from the round seed and never
 * travels to the client before it is earned. A tampered answer simply grades false.
 */
export async function submitAnswer(
  seed: number,
  index: number,
  answer: string | string[],
  topic: Topic = DEFAULT_TOPIC,
): Promise<Verdict | null> {
  // The topic travels with the answer. A round is (seed, topic) — grading a europe
  // round against the general bank would mark every answer wrong, and the client is
  // not trusted to send the answer, only to say which round it is playing.
  return grade(seed, index, answer, topic)
}
