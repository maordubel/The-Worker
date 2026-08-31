'use server'

import { gradeTimeline, type TimelineVerdict } from '@/lib/game/timeline'

/** Server authority: the dates live here, not in the payload. */
export async function submitOrder(seed: number, order: string[]): Promise<TimelineVerdict> {
  return gradeTimeline(seed, order)
}
