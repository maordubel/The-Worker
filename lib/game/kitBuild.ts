import 'server-only'

import { rng, shuffle } from './archive'
import { homeKits, seasonKits, type SeasonKit } from '@/lib/kit/seasons'
import { PATTERNS } from '@/lib/kit/spec'
import { RUN_LENGTH, stageOf } from './session'

/**
 * חידון מדים לפי עונה — you are given a season, and you have to BUILD its kit.
 *
 * This is the reverse of the old gate 4, and Maor is right that it is the better game.
 * "Which season is this shirt" is recognition; "assemble the 1993/94 kit" is knowledge,
 * because you have to hold the cut, the sponsor and the maker in your head at once and
 * they are three independent facts.
 *
 * The escalation is built into the ASK, not just the clock:
 *
 *   · **stage 1** — the cut only. One decision, four options.
 *   · **stage 2** — the cut and the sponsor.
 *   · **stage 3** — the cut, the sponsor AND the maker. Three right or nothing.
 *
 * A round therefore gets genuinely harder rather than merely faster, which is what
 * "the difficulty rises stage to stage" has to mean to be worth saying.
 */

export type KitBuildLayer = 'pattern' | 'sponsor' | 'maker'

export type KitBuildQuestion = {
  id: string
  seasonLabel: string
  /** which layers this question asks for — grows with the stage */
  layers: KitBuildLayer[]
  options: Record<KitBuildLayer, string[]>
  /** the shirt with the asked-for layers stripped out, so the player fills them in */
  base: SeasonKit['spec']
  difficulty: 1 | 2 | 3 | 4 | 5
}

export type KitBuildVerdict = {
  /** every asked layer right, and nothing wrong */
  correct: boolean
  /** per layer, so the reveal can say "the cut was right, the collar was not" */
  byLayer: Record<string, boolean>
  answers: Record<string, string>
  noteHe: string
  difficulty: number
}

const NONE = '—'

function layersForStage(stage: number): KitBuildLayer[] {
  if (stage === 0) return ['pattern']
  if (stage === 1) return ['pattern', 'sponsor']
  return ['pattern', 'sponsor', 'maker']
}

function truthFor(kit: SeasonKit, layer: KitBuildLayer): string {
  if (layer === 'pattern') return PATTERNS.find((row) => row.id === kit.spec.pattern)?.he ?? NONE
  if (layer === 'sponsor') return kit.spec.sponsorHe ?? NONE
  return kit.spec.makerHe ?? NONE
}

function poolFor(layer: KitBuildLayer, all: SeasonKit[]): string[] {
  if (layer === 'pattern') return PATTERNS.map((row) => row.he)
  if (layer === 'sponsor') return all.map((kit) => kit.spec.sponsorHe ?? NONE)
  return all.map((kit) => kit.spec.makerHe ?? NONE)
}

function withOthers(correct: string, pool: string[], random: () => number): string[] {
  const others = shuffle(
    [...new Set(pool)].filter((value) => value !== correct),
    random,
  ).slice(0, 3)
  return shuffle([correct, ...others], random)
}

function round(seed: number): { question: KitBuildQuestion; truth: Record<string, string> }[] {
  const all = homeKits()
  const pool = seasonKits()
  const random = rng(seed)

  return shuffle([...all], random)
    .slice(0, RUN_LENGTH)
    .map((kit, index) => {
      const layers = layersForStage(stageOf(index))
      const truth: Record<string, string> = {}
      const options = {} as Record<KitBuildLayer, string[]>
      for (const layer of layers) {
        truth[layer] = truthFor(kit, layer)
        options[layer] = withOthers(truth[layer] as string, poolFor(layer, pool), random)
      }
      return {
        question: {
          id: `kitbuild:${kit.seasonLabel}`,
          seasonLabel: kit.seasonLabel,
          layers,
          options,
          // the shirt is shown with the asked layers blanked, so the player is dressing
          // a real shirt rather than picking from a list next to a picture of the answer
          base: {
            ...kit.spec,
            pattern: layers.includes('pattern') ? 'solid' : kit.spec.pattern,
            sponsorHe: layers.includes('sponsor') ? null : kit.spec.sponsorHe,
            makerHe: layers.includes('maker') ? null : kit.spec.makerHe,
          },
          difficulty: (layers.length + 1) as 2 | 3 | 4,
        },
        truth,
      }
    })
}

export function buildKitBuildRound(seed: number): KitBuildQuestion[] {
  return round(seed).map((item) => item.question)
}

export function gradeKitBuild(
  seed: number,
  index: number,
  picked: Record<string, string>,
): KitBuildVerdict | null {
  const item = round(seed)[index]
  if (!item) return null
  const kit = homeKits().find((row) => row.seasonLabel === item.question.seasonLabel)
  const byLayer: Record<string, boolean> = {}
  for (const layer of item.question.layers) {
    byLayer[layer] = picked[layer] === item.truth[layer]
  }
  return {
    correct: Object.values(byLayer).every(Boolean),
    byLayer,
    answers: item.truth,
    noteHe: kit?.noteHe ?? '',
    difficulty: item.question.difficulty,
  }
}
