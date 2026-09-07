/**
 * שני הימים כתצורה — 1990 and 1998 as configuration of one director, which is the whole
 * point of having extracted it.
 *
 * Every number in the 1990 preset is lifted unchanged from `runtime/match1990.ts` as it
 * stood on 7.9.2026 — the four bands of dramatic density, the five-minute interval, the
 * radio lags of one and three minutes, the kids at even odds of being wrong. A save made
 * before the extraction plays the chapter at exactly the rhythm it always had, and that is
 * a requirement, not a coincidence: the audit's instruction was *"do not lose the existing
 * 1990 gameplay while refactoring."*
 *
 * The 1998 preset is the same machine with three differences, and all three are the day:
 * the other ground kicked off a quarter of an hour later, so it is still playing when ours
 * has finished; the ending policy says so out loud; and there is a crowd, standing in
 * rows, at measurable distances from the one small speaker that knows.
 */
import { DAY_1990, DAY_1998 } from './days'
import type { DirectorConfig } from './director'

/**
 * צפיפות דרמטית — a match is not felt at one speed (Mission 01 §25). The first half in
 * about sixty-five seconds, the quarter of an hour nobody remembers thrown away, and the
 * last five minutes given nearly as long as the first forty-five.
 */
export const BANDS_1990 = [
  { until: 45, pace: 0.69 },
  { until: 70, pace: 0.56 },
  { until: 84, pace: 1.4 },
  { until: 999, pace: 0.14 },
]

export const PRESET_1990: DirectorConfig = {
  day: DAY_1990,
  bands: BANDS_1990,
  fallbackPace: 0.85,
  interval: { at: 45, length: 5 },
  fullTime: 90,
  ending: {},
  channels: [
    /** אבא — his own radio, one minute behind the ground it is describing */
    { id: 'kobi', nameHe: 'הרדיו של אבא', venues: ['yavne'], latency: 1 },
    /** אבא, כשהרדיו ניצל — held to the ear, and there is no lag left in it at all */
    { id: 'kobi-held', nameHe: 'הרדיו שניצל', venues: ['yavne'], latency: 0 },
    /** הרדיו של ההוא — three rows away and three minutes behind */
    { id: 'radio', nameHe: 'הרדיו של ההוא', venues: ['yavne'], latency: 3 },
    /** האיש שיודע — certain, always; he is repeating the slow radio and does not know it */
    { id: 'brain', nameHe: 'אוהד שיודע', venues: ['yavne'], latency: 0, repeats: 'radio' },
    /** הילדים — instant, and wrong half the time */
    { id: 'kids', nameHe: 'ילדים', venues: ['yavne'], latency: 0, garble: 0.5 },
  ],
}

/**
 * 2.5.1998 — the same engine, and the reason the engine had to be general.
 *
 * The clock keeps running after our whistle because the other ground started later, and
 * `pace` collapses to almost nothing in the minutes after it: at that point a terrace is
 * singing at full volume about something that has not happened yet, and the game should
 * take its time about that.
 */
export const PRESET_1998: DirectorConfig = {
  day: DAY_1998,
  bands: [
    { until: 45, pace: 0.75 },
    { until: 80, pace: 0.6 },
    { until: 90, pace: 0.22 },
    { until: 999, pace: 0.12 },
  ],
  fallbackPace: 0.6,
  interval: { at: 45, length: 5 },
  fullTime: 90,
  ending: {
    primaryFullTimeIsNotCompletion: true,
    requiredParallelMatchesFinished: true,
    requirePlayerKnowledgeOfFinalState: true,
  },
  crowd: {
    /** hops from the one transistor that knows, outward through the stand */
    hopMinutes: 1,
    groups: [
      { id: 'row', nameHe: 'השורה שלך', hops: 0 },
      { id: 'block', nameHe: 'הגוש', hops: 1 },
      { id: 'stand', nameHe: 'היציע', hops: 2 },
      { id: 'far', nameHe: 'העבר השני', hops: 3 },
    ],
  },
  channels: [
    { id: 'transistor', nameHe: 'הטרנזיסטור מאחוריך', venues: ['beit-shean'], latency: 2 },
    { id: 'pager', nameHe: 'פייג׳ר', venues: ['beit-shean'], latency: 4 },
    { id: 'heard', nameHe: 'מישהו ששמע ממישהו', venues: ['beit-shean'], latency: 3, repeats: 'transistor', garble: 0.4 },
  ],
}

export const PRESETS: Record<string, DirectorConfig> = {
  '1990': PRESET_1990,
  '1998-laces': PRESET_1998,
}

export const presetFor = (chapterId: string): DirectorConfig | null => PRESETS[chapterId] ?? null
