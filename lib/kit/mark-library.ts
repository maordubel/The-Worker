import type { KitPlacement } from './assembly'

export type MarkKind = 'maker' | 'sponsor'
export type MarkAsset = { src: string; label: string; defaultPlacement: KitPlacement; monochrome?: boolean }

/**
 * Cut artwork that already lives in the repository. The broader archive still supplies
 * visual evidence for every other mark; we never pretend a text fallback is a supplied logo.
 */
const VISA: MarkAsset = { src: '/kits/assembly/1985-86/parts/sponsor-visa.svg', label: 'VISA', defaultPlacement: { x: 26, y: 45, w: 48, h: 13 } }
const SUBARU: MarkAsset = { src: '/kits/assembly/2009-10/parts/sponsor-subaru.svg', label: 'SUBARU', defaultPlacement: { x: 29, y: 44, w: 42, h: 15 } }
const ADIDAS_CLASSIC: MarkAsset = { src: '/kits/assembly/1985-86/parts/maker-adidas.svg', label: 'adidas', monochrome: true, defaultPlacement: { x: 30, y: 22, w: 11, h: 9 } }
const UMBRO: MarkAsset = { src: '/kits/assembly/2009-10/parts/maker-umbro.svg', label: 'umbro', monochrome: true, defaultPlacement: { x: 30, y: 22, w: 11, h: 9 } }

function normalized(value: string): string { return value.normalize('NFKD').toLowerCase().replace(/[׳״'"’`\-_.()\s]/g, '') }

export function makerAssetForName(maker: string | null, seasonLabel?: string): MarkAsset | null {
  if (!maker) return null
  const key = normalized(maker)
  if (key === 'adidas' && seasonLabel && Number(seasonLabel.slice(0, 4)) < 1992) return ADIDAS_CLASSIC
  if (key === 'umbro') return UMBRO
  return null
}
export function sponsorAssetForName(sponsor: string | null): MarkAsset | null {
  if (!sponsor) return null
  const key = normalized(sponsor)
  if (key === 'visa') return VISA
  if (key === 'subaru') return SUBARU
  return null
}
export function markAsset(kind: MarkKind, value: string | null, seasonLabel?: string): MarkAsset | null {
  return kind === 'maker' ? makerAssetForName(value, seasonLabel) : sponsorAssetForName(value)
}
