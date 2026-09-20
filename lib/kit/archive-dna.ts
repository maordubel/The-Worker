import 'server-only'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { archiveShirts, type ArchiveShirt } from './archive'
import { seasonKits } from './seasons'
import type { KitSpec } from './spec'

export type DnaRackItem = {
  key: string
  seasonLabel: string
  variant: 'home' | 'away' | 'third'
  spec: KitSpec
  photoSrc: string | null
  photoSourceTitle: string | null
}

/** Exact-season evidence only. A bare-year Vikipoel row is never silently promoted. */
export function exactArchivePhoto(seasonLabel: string, variant: string): ArchiveShirt | null {
  return archiveShirts().find(
    (shirt) => !shirt.seasonAmbiguous && shirt.seasonLabel === seasonLabel && shirt.variant === variant,
  ) ?? null
}

export function kitDnaRack(): DnaRackItem[] {
  return seasonKits()
    .map((kit) => {
      const photo = exactArchivePhoto(kit.seasonLabel, kit.variant)
      return {
        key: `${kit.seasonLabel}|${kit.variant}`,
        seasonLabel: kit.seasonLabel,
        variant: kit.variant,
        spec: kit.spec,
        photoSrc: photo?.src ?? null,
        photoSourceTitle: photo?.sourceTitle ?? null,
      }
    })
    .sort((a, b) => b.seasonLabel.localeCompare(a.seasonLabel) || a.variant.localeCompare(b.variant))
}

/** Reads only paths that came out of archiveShirts(), never a caller-provided path. */
export function archivePhotoBytes(src: string): Buffer | null {
  const known = archiveShirts().some((shirt) => shirt.src === src)
  if (!known || !src.startsWith('/kits/')) return null
  try {
    return readFileSync(join(process.cwd(), 'public', src))
  } catch {
    return null
  }
}
