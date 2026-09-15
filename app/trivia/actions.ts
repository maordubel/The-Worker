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
  cursor = 0,
): Promise<Verdict | null> {
  // The topic travels with the answer. A round is (seed, topic) — grading a europe
  // round against the general bank would mark every answer wrong, and the client is
  // not trusted to send the answer, only to say which round it is playing.
  // The cursor travels for the same reason the topic does: a round is addressed by
  // (seed, topic, cursor), and grading the second round of a deck against the first
  // would mark a correct answer wrong.
  return grade(seed, index, answer, topic, cursor)
}
