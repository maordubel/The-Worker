import type { KitPlacement } from './assembly'
import { normalizeEntity } from './identity'

export type MarkKind = 'maker' | 'sponsor'
export type AtlasCell = { col: number; row: number; cols: number; rows: number }
export type MarkAsset = {
  id: string
  src: string
  label: string
  aliases: string[]
  defaultPlacement: KitPlacement
  monochrome?: boolean
  atlas?: AtlasCell
  sourceTitle: string
  verification: 'supplied' | 'derived'
}

const ATLAS = '/kits/assets/marks-atlas.png'
const cell = (col: number, row: number): AtlasCell => ({ col, row, cols: 5, rows: 4 })
const makerPlacement: KitPlacement = { x: 30, y: 22, w: 11, h: 9 }
const sponsorPlacement: KitPlacement = { x: 24, y: 43, w: 52, h: 16 }

/**
 * The visual mark library is deliberately independent from the historical fact table.
 * A season stores "umbro" because that is a fact; this file only says which supplied
 * artwork may represent that fact. Replacing artwork can therefore never rewrite history.
 */
export const MARK_ASSETS: MarkAsset[] = [
  { id: 'maker:adidas-classic', src: ATLAS, label: 'adidas', aliases: ['adidas','אדידס'], defaultPlacement: makerPlacement, monochrome: true, atlas: cell(0,0), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'maker:adidas-modern', src: ATLAS, label: 'adidas', aliases: ['adidas','אדידס'], defaultPlacement: makerPlacement, monochrome: true, atlas: cell(1,0), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'maker:macron', src: ATLAS, label: 'MACRON', aliases: ['macron','מקרון'], defaultPlacement: makerPlacement, monochrome: true, atlas: cell(2,0), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'maker:le-coq-sportif', src: ATLAS, label: 'Le Coq Sportif', aliases: ['lecoqsportif','le coq sportif'], defaultPlacement: makerPlacement, monochrome: true, atlas: cell(3,0), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'maker:puma', src: ATLAS, label: 'PUMA', aliases: ['puma','פומה'], defaultPlacement: makerPlacement, monochrome: true, atlas: cell(0,1), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'maker:umbro', src: ATLAS, label: 'umbro', aliases: ['umbro','אמברו'], defaultPlacement: makerPlacement, monochrome: true, atlas: cell(1,1), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'maker:diadora', src: ATLAS, label: 'diadora', aliases: ['diadora','דיאדורה'], defaultPlacement: makerPlacement, monochrome: true, atlas: cell(0,2), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'sponsor:arkia', src: ATLAS, label: 'Arkia', aliases: ['arkia','ארקיע'], defaultPlacement: sponsorPlacement, atlas: cell(2,1), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'sponsor:bezeq', src: ATLAS, label: 'בזק', aliases: ['bezeq','בזק'], defaultPlacement: sponsorPlacement, atlas: cell(3,1), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'sponsor:carlsberg', src: ATLAS, label: 'Carlsberg', aliases: ['carlsberg','קרלסברג'], defaultPlacement: sponsorPlacement, atlas: cell(4,1), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'sponsor:discount', src: ATLAS, label: 'דיסקונט', aliases: ['discount','דיסקונט'], defaultPlacement: sponsorPlacement, atlas: cell(1,2), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'sponsor:fujicom', src: ATLAS, label: 'FUJICOM', aliases: ['fujicom','פוגיקום'], defaultPlacement: sponsorPlacement, atlas: cell(2,2), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'sponsor:hachshara', src: ATLAS, label: 'הכשרה', aliases: ['hachshara','hachshara insurance company','הכשרה','הכשרהחברהלביטוח'], defaultPlacement: sponsorPlacement, atlas: cell(3,2), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'sponsor:keter', src: ATLAS, label: 'KETER', aliases: ['keter','keter group','כתר'], defaultPlacement: sponsorPlacement, atlas: cell(4,2), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'sponsor:subaru', src: ATLAS, label: 'SUBARU', aliases: ['subaru','סובארו'], defaultPlacement: sponsorPlacement, atlas: cell(1,3), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'sponsor:tambour', src: ATLAS, label: 'טמבור', aliases: ['tambour','טמבור'], defaultPlacement: sponsorPlacement, atlas: cell(2,3), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
  { id: 'sponsor:visa', src: ATLAS, label: 'VISA', aliases: ['visa','ויזה'], defaultPlacement: { x: 26, y: 43, w: 48, h: 16 }, atlas: cell(3,3), sourceTitle: 'Kit V4 supplied marks atlas, 20.9.2026', verification: 'supplied' },
]

function lookup(kind: MarkKind, value: string | null): MarkAsset | null {
  const key = normalizeEntity(value)
  if (!key) return null
  return MARK_ASSETS.find((asset) => asset.id.startsWith(`${kind}:`) && asset.aliases.some((alias) => normalizeEntity(alias) === key)) ?? null
}

export function makerAssetForName(maker: string | null, seasonLabel?: string): MarkAsset | null {
  if (!maker) return null
  const key = normalizeEntity(maker)
  if (key === 'adidas') {
    const year = seasonLabel ? Number(seasonLabel.slice(0,4)) : NaN
    return MARK_ASSETS.find((asset) => asset.id === (Number.isFinite(year) && year < 1992 ? 'maker:adidas-classic' : 'maker:adidas-modern')) ?? null
  }
  return lookup('maker', maker)
}

export function sponsorAssetForName(sponsor: string | null): MarkAsset | null { return lookup('sponsor', sponsor) }
export function markAsset(kind: MarkKind, value: string | null, seasonLabel?: string): MarkAsset | null { return kind === 'maker' ? makerAssetForName(value, seasonLabel) : sponsorAssetForName(value) }
