export type KitVariant = 'home' | 'away' | 'third'
export type ArchiveVariant = KitVariant | 'fourth' | 'gk' | 'special'
export type VerificationStatus = 'verified' | 'supported' | 'conflict' | 'ambiguous' | 'unverified'
export type AssetRole = 'construction' | 'reveal' | 'evidence' | 'reference'
export type KitAssetKind =
  | 'shirt-master'
  | 'archive-photo'
  | 'parts-sheet'
  | 'collar'
  | 'sleeve'
  | 'cuff'
  | 'pattern'
  | 'maker-mark'
  | 'sponsor-mark'
  | 'crest'
  | 'badge'
  | 'nameset'
  | 'other'

export function seasonId(label: string): string {
  return label.trim().replace(/\s+/g, '').replace('/', '-')
}

export function kitId(seasonLabel: string, variant: string): string {
  return `football:${seasonId(seasonLabel)}:${variant}`
}

export function assetId(...parts: Array<string | number | null | undefined>): string {
  return parts
    .filter((part): part is string | number => part !== null && part !== undefined && String(part).length > 0)
    .map((part) => String(part).normalize('NFKD').toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g, '-').replace(/^-|-$/g, ''))
    .join(':')
}

export function openingYear(seasonLabel: string): number | null {
  const year = Number(seasonLabel.slice(0, 4))
  return Number.isFinite(year) ? year : null
}

export function decadeOf(seasonLabel: string): number | null {
  const year = openingYear(seasonLabel)
  return year === null ? null : Math.floor(year / 10) * 10
}

export function eraOf(seasonLabel: string): string {
  const year = openingYear(seasonLabel)
  if (year === null) return 'unknown'
  if (year < 1970) return 'pre-1970'
  if (year < 1980) return '1970s'
  if (year < 1990) return '1980s'
  if (year < 2000) return '1990s'
  if (year < 2010) return '2000s'
  if (year < 2020) return '2010s'
  return '2020s'
}

export function normalizeEntity(value: string | null | undefined): string | null {
  if (!value) return null
  return value.normalize('NFKD').toLowerCase().replace(/[׳״'"’`\-_.()\s]/g, '')
}
