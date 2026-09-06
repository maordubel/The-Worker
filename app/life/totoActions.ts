'use server'

import { DEFAULT_TOPIC } from '@/lib/game/topics'
import { deal, grade, type TriviaQuestion, type Verdict } from '@/lib/game/trivia'
import { TOTO_LENGTH } from '@/lib/life/toto'

/**
 * הטוטו של פוגי — the same bank, the same authority, five questions.
 *
 * Maor's line was "בפועל — קופץ שאלון טרוויה שקיים לנו גם ככה באתר", and the point of
 * that sentence is that the questions must be the REAL ones. So this deals from the
 * site's own bank with the site's own rules: the answers never travel to the client, and
 * grading happens here against the seed. A Toto slip a child could read the results off
 * is not a Toto slip.
 *
 * Five, not twelve. A round inside a Saturday afternoon has to fit inside an afternoon.
 */
export async function dealToto(seed: number): Promise<TriviaQuestion[]> {
  const out: TriviaQuestion[] = []
  for (let index = 0; index < TOTO_LENGTH; index += 1) {
    const question = deal(seed, index, DEFAULT_TOPIC)
    if (question) out.push(question)
  }
  return out
}

export async function gradeToto(seed: number, index: number, answer: string | string[]): Promise<Verdict | null> {
  return grade(seed, index, answer, DEFAULT_TOPIC)
}
