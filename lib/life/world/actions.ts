import { checklistFor } from '../checklist'
import type { Era } from '../content/era'
import { view as opportunityView } from '../opportunities'
import { eligibleFor, offeredFlag } from '../routes'
import type { LifeState } from '../types'

/**
 * מה אפשר לעשות עכשיו — one semantic reading over systems that already exist.
 *
 * This is deliberately NOT another quest engine. The story remains in `checklist.ts`,
 * timed side opportunities remain in `opportunities.ts`, and life-route eligibility stays
 * in `routes.ts`. This file only gives flow/UI/tests one answer instead of asking three
 * registries independently.
 *
 * An action is visible only after its own system says the player can know about it. The
 * resolver therefore never spoils a hidden checklist step and never advertises a route
 * title that has already been offered in this chapter.
 */

export type LifeActionKind = 'story' | 'opportunity' | 'route'

export type LifeAction = {
  id: string
  kind: LifeActionKind
  titleHe: string
  /** story actions can be the spine; side/route actions are choices around it */
  primary: boolean
}

export function actionsNow(state: LifeState, era: Era): readonly LifeAction[] {
  const actions: LifeAction[] = []

  const story = checklistFor(state).filter((item) => !item.done)
  story.forEach((item, index) => {
    actions.push({ id: `story:${item.id}`, kind: 'story', titleHe: item.textHe, primary: index === 0 })
  })

  for (const opportunity of opportunityView(state, era.opportunities ?? [])) {
    if (opportunity.status !== 'open') continue
    actions.push({
      id: `opportunity:${opportunity.def.id}`,
      kind: 'opportunity',
      titleHe: opportunity.def.titleHe,
      primary: false,
    })
  }

  for (const invitation of eligibleFor(state)) {
    if (state.flags[offeredFlag(invitation.route.id, invitation.stage)]) continue
    actions.push({
      id: `route:${invitation.route.id}:${invitation.stage}`,
      kind: 'route',
      titleHe: invitation.titleHe,
      primary: false,
    })
  }

  return actions
}

export const primaryAction = (state: LifeState, era: Era): LifeAction | null =>
  actionsNow(state, era).find((action) => action.primary) ?? null

export const optionalActions = (state: LifeState, era: Era): readonly LifeAction[] =>
  actionsNow(state, era).filter((action) => !action.primary)
