import { describe, expect, it } from 'vitest'

import { CHECKLISTS, CHECKLIST_CHAPTERS } from '@/lib/life/checklist'
import { playableChapters } from '@/lib/life/content/chapters'

/**
 * A playable chapter may be quiet, optional or branch-specific. It may not be illegible.
 *
 * `checklist.ts` is not a quest engine; it is the authored, progressively revealed spine
 * behind "?". Requiring an entry here means every chapter has at least one vocabulary for
 * explaining what it wants without exposing hidden flags or relying on the player to wait.
 */
describe('LIFE action contract', () => {
  it('gives every playable chapter a discoverable action spine', () => {
    const known = new Set(CHECKLIST_CHAPTERS)
    const missing = playableChapters().map((chapter) => chapter.id).filter((id) => !known.has(id))
    expect(missing).toEqual([])
  })

  it('gives every playable chapter a first move the player can know immediately', () => {
    const hiddenAtEntry: string[] = []
    for (const chapter of playableChapters()) {
      const steps = CHECKLISTS[chapter.id] ?? []
      if (steps.length === 0 || steps[0]?.revealWhen) hiddenAtEntry.push(chapter.id)
    }
    expect(hiddenAtEntry).toEqual([])
  })
})
