'use server'

import { dealPersonalRun, gradeAnswer, hintFor, type Hint, type RunPlan } from '@/lib/game/trivia'
import type { AnswerValue, Verdict } from '@/lib/game/questions/types'

/**
 * Server authority for gate 2 (rule 4). The client holds question ids and options, never
 * an answer; these three calls are the only way anything about the truth crosses over,
 * and each crosses only AFTER the player has committed (or paid, for a hint).
 */

const ID = /^q_[0-9a-f]{12}$/

function clean(answer: unknown): AnswerValue | null {
  if (typeof answer === 'string') return answer.slice(0, 200)
  if (Array.isArray(answer) && answer.length <= 6 && answer.every((value) => typeof value === 'string')) {
    return answer.map((value) => value.slice(0, 200))
  }
  return null
}

/** grade one answer, by question id — a personal run needs no seed rebuild */
export async function submitAnswer(id: string, answer: AnswerValue): Promise<Verdict | null> {
  const value = clean(answer)
  if (typeof id !== 'string' || !ID.test(id) || value === null) return null
  return gradeAnswer(id, value)
}

/** the paid hint — derived on the server from the same options the client was dealt */
export async function requestHint(id: string, seed: number): Promise<Hint | null> {
  if (typeof id !== 'string' || !ID.test(id) || !Number.isFinite(seed)) return null
  return hintFor(id, Math.trunc(seed))
}

/**
 * Revenge and Surprise are built from the DEVICE's ledger, which only the device has. It
 * sends ids — never answers — and gets twelve ids back, which the lobby turns into a
 * `?q=` link: the run is then as shareable as any seeded one.
 */
export async function planPersonal(
  kind: 'revenge' | 'surprise',
  ledger: { wrong: string[]; seen: string[] },
  seed: number,
): Promise<RunPlan> {
  const ids = (list: unknown, cap: number) =>
    Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string' && ID.test(id)).slice(0, cap) : []
  return dealPersonalRun(
    kind === 'revenge' ? 'revenge' : 'surprise',
    { wrong: ids(ledger?.wrong, 200), seen: ids(ledger?.seen, 2000) },
    Number.isFinite(seed) ? Math.trunc(seed) : 1,
  )
}
