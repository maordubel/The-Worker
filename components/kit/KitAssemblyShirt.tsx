import { KitShirt } from '@/components/kit/KitShirt'
import {
  historicalMasterFor,
  makerAssetFor,
  placementFor,
  sponsorAssetFor,
  type KitPlacement,
} from '@/lib/kit/assembly'
import type { KitSpec } from '@/lib/kit/spec'

const DEFAULT_SPONSOR: KitPlacement = { x: 28, y: 48, w: 44, h: 13 }
const DEFAULT_MAKER: KitPlacement = { x: 30, y: 23, w: 12, h: 9 }

/**
 * One shirt renderer for the places where fidelity matters.
 *
 * - Historical mode uses the supplied master when one exists.
 * - Builder mode keeps the editable vector cloth but replaces known chest/maker marks
 *   with the actual cut assets supplied for the kit library.
 * - Unknown seasons fall back to KitShirt, so adding fidelity never makes older archive
 *   rows disappear.
 */
export function KitAssemblyShirt({
  spec,
  className = '',
  historical = false,
  title,
}: {
  spec: KitSpec
  className?: string
  historical?: boolean
  title?: string
}) {
  const master = historical ? historicalMasterFor(spec.seasonLabel, spec.variant) : null
  if (master) {
    return (
      <img
        src={master}
        alt={title ?? spec.seasonLabel}
        className={`${className} object-contain`}
      />
    )
  }

  const sponsor = sponsorAssetFor(spec.sponsorHe)
  const maker = makerAssetFor(spec.makerHe)
  const plateSpec: KitSpec = {
    ...spec,
    sponsorHe: sponsor ? null : spec.sponsorHe,
    makerHe: maker ? null : spec.makerHe,
  }
  const sponsorPlacement = placementFor(spec, 'sponsor', sponsor?.defaultPlacement ?? DEFAULT_SPONSOR)
  const makerPlacement = placementFor(spec, 'maker', maker?.defaultPlacement ?? DEFAULT_MAKER)

  return (
    <span className={`relative inline-block ${className}`} style={{ aspectRatio: '236 / 274' }}>
      <KitShirt
        spec={plateSpec}
        className="absolute inset-0 block h-full w-full"
        title={title ?? spec.seasonLabel}
      />
      {sponsor && <MarkImage src={sponsor.src} label={sponsor.label} placement={sponsorPlacement} />}
      {maker && <MarkImage src={maker.src} label={maker.label} placement={makerPlacement} />}
    </span>
  )
}

function MarkImage({
  src,
  label,
  placement,
}: {
  src: string
  label: string
  placement: KitPlacement
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      title={label}
      className="pointer-events-none absolute object-contain"
      style={{
        insetInlineStart: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.w}%`,
        height: `${placement.h}%`,
      }}
    />
  )
}
