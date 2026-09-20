import type { KitSpec } from './spec'

export type KitBriefId = 'free' | 'derby' | 'europe' | 'memory2010' | 'supporters'
export type KitBrief = { id: KitBriefId; titleHe: string; bodyHe: string; requirementsHe: string[] }
export const KIT_BRIEFS: KitBrief[] = [
  { id: 'free', titleHe: 'חופשי', bodyHe: 'בלי בריף. רק חולצה שאתה באמת רוצה לראות על הפועל.', requirementsHe: ['זהות ברורה', 'עיצוב שלא נלחם בעצמו'] },
  { id: 'derby', titleHe: 'דרבי בלילה', bodyHe: 'חולצה שקוראים ממנה הפועל גם מהיציע השני.', requirementsHe: ['אדום דומיננטי', 'ניגוד ברור', 'לא חלקה לגמרי'] },
  { id: 'europe', titleHe: 'אירופה בחוץ', bodyHe: 'לילה קר בחוץ, בסיס לא אדום — ועדיין הפועל.', requirementsHe: ['בסיס לא אדום', 'פרט אדום מזוהה', 'עד שלושה צבעים'] },
  { id: 'memory2010', titleHe: 'זיכרון 2010', bodyHe: 'לקחת DNA מ-2010 ולבנות ממנו משהו חדש, לא העתק.', requirementsHe: ['לפחות פרט אחד מה-DNA', 'לפחות פרט אחד חדש'] },
  { id: 'supporters', titleHe: 'חולצת אוהדים', bodyHe: 'משהו שאוהד באמת יקנה, ילבש ויישאר איתו.', requirementsHe: ['זהות חזקה', 'מעט צבעים', 'חזית מאוזנת'] },
]

export type StudioMetrics = { identity: number; briefFit: number; originality: number; coherence: number; dnaUse: number; overall: number }
const TRAITS: Array<keyof KitSpec> = ['base','patternInk','pattern','collar','collarInk','sleeves','sleeveInk','makerHe','sponsorHe','crestKey','nameset']
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
const differences = (a: KitSpec, b: KitSpec) => TRAITS.filter((key) => a[key] !== b[key]).length
const likeness = (a: KitSpec, b: KitSpec) => TRAITS.length - differences(a, b)
const uniqueColours = (spec: KitSpec) => new Set([spec.base, spec.patternInk, spec.sleeveInk, spec.collarInk]).size
const redDetail = (spec: KitSpec) => [spec.base, spec.patternInk, spec.sleeveInk, spec.collarInk].some((colour) => colour === 'red' || colour === 'deep')

export function scoreStudioDesign(spec: KitSpec, briefId: KitBriefId, dna: KitSpec[]): StudioMetrics {
  let identity = 30
  if (spec.base === 'red' || spec.base === 'deep') identity += 25
  if (redDetail(spec)) identity += 12
  if (spec.crestKey) identity += 23 // the badge is now a first-class design decision
  if (spec.sponsorHe === 'HAPOEL' || spec.sponsorHe === 'THE WORKER' || spec.sponsorHe === '1923') identity += 10

  const colours = uniqueColours(spec)
  let coherence = colours <= 2 ? 94 : colours === 3 ? 82 : 62
  if (spec.pattern === 'solid' && spec.base === spec.patternInk) coherence += 4
  if (!spec.sponsorHe) coherence += 2

  const nearest = dna.length ? [...dna].sort((a, b) => differences(spec, a) - differences(spec, b))[0] : null
  const originality = nearest ? clamp(28 + differences(spec, nearest) * 7) : 78
  const maxLike = dna.length ? Math.max(...dna.map((row) => likeness(spec, row))) : 0
  const dnaUse = dna.length ? clamp((maxLike / TRAITS.length) * 100) : 0

  let briefFit = 78
  if (briefId === 'derby') {
    briefFit = 20
    if (spec.base === 'red' || spec.base === 'deep') briefFit += 35
    if (spec.base !== spec.patternInk) briefFit += 20
    if (spec.pattern !== 'solid') briefFit += 15
    if (spec.crestKey) briefFit += 10
  } else if (briefId === 'europe') {
    briefFit = 20
    if (spec.base !== 'red' && spec.base !== 'deep') briefFit += 35
    if (redDetail(spec)) briefFit += 30
    if (colours <= 3) briefFit += 15
  } else if (briefId === 'memory2010') {
    const memory = dna.filter((row) => row.seasonLabel.startsWith('2009') || row.seasonLabel.startsWith('2010'))
    if (memory.length === 0) briefFit = 0
    else {
      const best = [...memory].sort((a, b) => differences(spec, a) - differences(spec, b))[0]!
      briefFit = clamp((likeness(spec, best) >= 2 ? 50 : 0) + (differences(spec, best) >= 2 ? 50 : 0))
    }
  } else if (briefId === 'supporters') briefFit = clamp(identity * .45 + coherence * .45 + (colours <= 3 ? 10 : 0))
  else briefFit = clamp((identity + coherence) / 2)

  const overall = clamp(identity * .27 + briefFit * .28 + originality * .18 + coherence * .22 + dnaUse * .05)
  return { identity: clamp(identity), briefFit: clamp(briefFit), originality, coherence: clamp(coherence), dnaUse, overall }
}

export function supporterFeedback(metrics: StudioMetrics): string {
  if (metrics.overall >= 88 && metrics.identity >= 85) return 'רואים הפועל לפני שקוראים את הסמל. הייתי קונה.'
  if (metrics.briefFit >= 88) return 'הבריף יושב טוב. יש פה חולצה שאפשר לדמיין על הדשא.'
  if (metrics.coherence < 65) return 'יש פה רעיון טוב, אבל כרגע שתי תקופות נלחמות על אותה חולצה.'
  if (metrics.identity < 65) return 'יפה, אבל צריך עוד פרט אחד שיצעק הפועל גם מרחוק.'
  if (metrics.originality < 55) return 'הזיכרון חזק מדי. תזיז עוד פרט אחד כדי שזה יהיה שלך.'
  return 'זה עובד. עוד ליטוש קטן בחזית וזה מרגיש כמו חולצה אמיתית.'
}
