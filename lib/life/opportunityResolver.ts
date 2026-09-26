import type { MechanicCatalog } from '../mechanics/types'
import { ACTIVITY, pickContent, type ActivityId } from './activities'
import { callbacksForChapter } from './callbacks'
import { eraFor } from './content/era'
import { missionDoneFlag, missionForActivity, missionKind, type PerformedMissionDef } from './content/performedMissions'
import { offersNow, startable, type Offer } from './offers'
import { statusOf } from './opportunities'
import { routeAtLeast } from './routes'
import type { CharacterId, LifeState, LocationId } from './types'

/**
 * פותר ההזדמנויות (MASTER §5–§6, §47, §51) — one small, pure, deterministic resolver.
 *
 * It invents nothing. It CHOOSES, from authored content that already stands in the world:
 *
 *  · `offers.ts` — what is on offer in the rooms of this chapter right now (a mission's ask,
 *    a job, a bet, a game); it is the same reading Help and the map use, so the resolver can
 *    never rank a thing the street does not have;
 *  · `opportunities.ts` — the chapter's authored WINDOWS (several people, one afternoon, a
 *    clock), read through `statusOf` so an open window is a strong reason to move;
 *  · `content/performedMissions.ts` — which offers are SITUATIONS, with a route hint, a
 *    proof, a callback owed;
 *  · `callbacks.ts` — what is due to be seen again in this chapter.
 *
 * So there is no second "opportunity" concept: a window stays a window, an offer stays an
 * offer, and this file only says which of them deserve the player's attention NOW, in the
 * priority order of MASTER §3, under the fatigue window of §47, and never more than two
 * "good" ones (§5: *"0–2 opportunities טובות. לא 6–8."*).
 *
 * Tiers: MUST (never a mission — the main story belongs to the world's beats and is not
 * this resolver's to hand out; reserved for a window the chapter authored as a must),
 * STRONG (a callback due, a mission on a route he holds, an open window), OPTIONAL (a
 * mission standing where he is), AMBIENT (jobs, bets, games, a mission elsewhere), HIDDEN
 * (done this chapter, nothing to deal, or the same mechanic three times running).
 */

export type OpportunityTier = 'must' | 'strong' | 'optional' | 'ambient' | 'hidden'

export type LifeOpportunities = {
  mandatory?: string
  strong?: string[]
  optional?: string[]
  ambient?: string[]
  /** every id considered, with the tier it landed in — what `sideActions` sorts by */
  tiers: Readonly<Record<string, OpportunityTier>>
}

export type ResolveInput = {
  state: LifeState
  chapter?: string
  /** the room he stands in; defaults to the state's */
  scene?: LocationId
  location?: LocationId
  /** the people nearby — a mission whose host is not among them steps back a tier */
  characters?: readonly CharacterId[]
  mechanicCatalog?: MechanicCatalog
}

/** the tier order, for sorting */
export const TIER_RANK: Record<OpportunityTier, number> = { must: 0, strong: 1, optional: 2, ambient: 3, hidden: 4 }

const demote = (tier: OpportunityTier): OpportunityTier =>
  tier === 'must' ? 'must' : tier === 'strong' ? 'optional' : tier === 'optional' ? 'ambient' : 'hidden'

/** the same mechanic in the last three plays, or the same mission kind in the last two (MASTER §47) */
export function fatigued(state: LifeState, mission: PerformedMissionDef): boolean {
  const recentMechanics = (state.recentMechanics ?? []).slice(-3)
  const recentKinds = (state.recentMissionKinds ?? []).slice(-2)
  return recentMechanics.includes(mission.mechanic.kind) || recentKinds.includes(missionKind(mission))
}

function missionTier(input: ResolveInput, offer: Offer, mission: PerformedMissionDef, here: LocationId): OpportunityTier {
  const { state } = input
  if (state.flags[missionDoneFlag(mission.id)]) return 'hidden'
  // a mechanic with nothing to deal is not on offer (the room would say why)
  if (input.mechanicCatalog && !pickContent(state, mission.activity, input.mechanicCatalog)) return 'hidden'
  let tier: OpportunityTier = offer.where === here ? 'optional' : 'ambient'
  // a route he already holds makes its missions the thing people expect of him (priority 5)
  if (mission.routeHint && routeAtLeast(state, mission.routeHint, mission.minRouteStage ?? 'entry')) tier = 'strong'
  // a proof-shaped mission is a route beat, not a pastime
  if (mission.proofKind && tier !== 'strong') tier = offer.where === here ? 'strong' : 'optional'
  // the host is not around: it can wait
  if (input.characters && mission.hostId && !input.characters.includes(mission.hostId) && offer.where !== here) tier = demote(tier)
  if (fatigued(state, mission)) tier = demote(tier)
  return tier
}

/**
 * The resolver. Pure over its input: the same save, the same room, the same answer.
 */
export function resolveLifeOpportunities(input: ResolveInput): LifeOpportunities {
  const { state } = input
  const chapter = input.chapter ?? state.chapter
  const here = input.scene ?? input.location ?? state.location
  const tiers: Record<string, OpportunityTier> = {}
  const strong: string[] = []
  const optional: string[] = []
  const ambient: string[] = []

  // 3 · PENDING CONSEQUENCE / CALLBACK — due, and in a room of this chapter
  for (const due of callbacksForChapter(state, chapter)) {
    const id = `callback:${due.flag}`
    tiers[id] = 'strong'
    strong.push(id)
  }

  // 4 · LIFE COLLISION — the chapter's authored windows, while they are open
  for (const window of eraFor(chapter).opportunities) {
    const status = statusOf(state, window)
    if (status !== 'open') continue
    const id = `window:${window.id}`
    tiers[id] = 'strong'
    strong.push(id)
  }

  // 7 · OPTIONAL PERFORMED MISSION, 8 · LIGHT ROUTINE — what stands in the rooms right now
  for (const offer of offersNow(state)) {
    if (!startable(offer)) {
      tiers[offer.id] = 'hidden'
      continue
    }
    const mission = offer.activity ? missionForActivity(offer.activity, chapter) : null
    if (mission) {
      const tier = missionTier(input, offer, mission, here)
      tiers[offer.id] = tier
      if (tier === 'strong') strong.push(offer.id)
      else if (tier === 'optional') optional.push(offer.id)
      else if (tier === 'ambient') ambient.push(offer.id)
      continue
    }
    // a job, a bet, a game: the light routine, never more than ambient
    const def = offer.activity ? ACTIVITY[offer.activity as ActivityId] : null
    const tier: OpportunityTier = def && (state.recentMechanics ?? []).slice(-3).includes(def.kind) ? 'hidden' : 'ambient'
    tiers[offer.id] = tier
    if (tier === 'ambient') ambient.push(offer.id)
  }

  // 0–2 good ones: what does not fit in two steps down to ambient — the world stays quiet
  const good = [...strong, ...optional]
  for (const id of good.slice(2)) {
    if (id.startsWith('callback:') || id.startsWith('window:')) continue
    tiers[id] = 'ambient'
    ambient.push(id)
  }
  const kept = new Set(good.slice(0, 2))
  const keptStrong = strong.filter((id) => kept.has(id) || id.startsWith('callback:') || id.startsWith('window:'))
  const keptOptional = optional.filter((id) => kept.has(id))

  // `mandatory` is reserved for a window the chapter authors as a must; nothing today writes it
  const out: LifeOpportunities = { tiers }
  if (keptStrong.length) out.strong = keptStrong
  if (keptOptional.length) out.optional = keptOptional
  if (ambient.length) out.ambient = ambient
  return out
}

/** the tier of one offer id (`act:<id>` / `gig:<id>`) — `hidden` for one the resolver never saw */
export function opportunityTier(resolved: LifeOpportunities, id: string): OpportunityTier {
  return resolved.tiers[id] ?? 'hidden'
}
