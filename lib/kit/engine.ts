import { kitAssemblyForSeason, type KitPlacement } from './assembly'
import { BODY_TEMPLATES, bodyTemplateForSeason, type KitBodyTemplate, type KitBodyTemplateId } from './body-templates'
import { makerAssetForName, sponsorAssetForName } from './mark-library'
import type { KitSpec } from './spec'

export type KitConstruction = {
  bodyTemplateId: KitBodyTemplateId
  template: KitBodyTemplate
  placements: Record<'maker' | 'crest' | 'sponsor', KitPlacement>
  exactArtwork: { maker: boolean; sponsor: boolean }
  referenceLevel: 'mastered' | 'modeled'
}

function bodyOverride(spec: KitSpec): KitBodyTemplateId | null {
  const value = (spec as KitSpec & { bodyTemplateId?: KitBodyTemplateId }).bodyTemplateId
  return value && BODY_TEMPLATES[value] ? value : null
}

export function resolveKitConstruction(spec: KitSpec): KitConstruction {
  const override = bodyOverride(spec)
  const template = override ? BODY_TEMPLATES[override] : bodyTemplateForSeason(spec.seasonLabel)
  const assembly = kitAssemblyForSeason(spec.seasonLabel, spec.variant)
  return {
    bodyTemplateId: template.id,
    template,
    placements: {
      maker: assembly?.placements.maker ?? template.anchors.maker,
      crest: assembly?.placements.crest ?? template.anchors.crest,
      sponsor: assembly?.placements.sponsor ?? template.anchors.sponsor,
    },
    exactArtwork: {
      maker: Boolean(makerAssetForName(spec.makerHe, spec.seasonLabel)),
      sponsor: Boolean(sponsorAssetForName(spec.sponsorHe)),
    },
    referenceLevel: assembly ? 'mastered' : 'modeled',
  }
}

export function constructionFingerprint(spec: KitSpec): string {
  const c = resolveKitConstruction(spec)
  return [c.bodyTemplateId, spec.pattern, spec.sleeves, spec.collar, spec.makerHe ?? '-', spec.sponsorHe ?? '-', spec.crestKey ?? '-'].join('|')
}
