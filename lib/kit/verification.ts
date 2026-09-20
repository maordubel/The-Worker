import verificationFile from '@/content/manual/kit-verification.json'
import type { KitVariant, VerificationStatus } from './identity'

type Source = { title: string; url: string | null }
export type KitVerification = {
  seasonLabel: string
  variant: KitVariant
  status: VerificationStatus
  claims: Record<string, string | null>
  sources: Source[]
  noteHe: string
  checkedOn: string
}

type FileShape = {
  checkedOn: string
  records: Array<Omit<KitVerification, 'checkedOn'>>
}

const data = verificationFile as unknown as FileShape

export function verificationFor(seasonLabel: string, variant: KitVariant): KitVerification | null {
  const row = data.records.find((item) => item.seasonLabel === seasonLabel && item.variant === variant)
  return row ? { ...row, checkedOn: data.checkedOn } : null
}

export function verificationRows(): KitVerification[] {
  return data.records.map((row) => ({ ...row, checkedOn: data.checkedOn }))
}
