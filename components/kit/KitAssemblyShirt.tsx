import { KitShirt } from '@/components/kit/KitShirt'
import { MakerMark, markFor } from '@/components/kit/MakerMark'
import { MarkArtwork } from '@/components/kit/MarkArtwork'
import { historicalMasterFor, placementFor, type KitPlacement } from '@/lib/kit/assembly'
import { crestArt } from '@/lib/kit/crestMarks'
import { makerAssetForName, sponsorAssetForName } from '@/lib/kit/mark-library'
import type { KitSpec } from '@/lib/kit/spec'
import { darkCloth, defaultMarkPlacement } from '@/lib/kit/visual-dna'

/**
 * The high-fidelity shirt renderer shared by Royal Rumble, Gate 4 and Gate 5.
 * The cloth is vector/editable; marks are separate layers with historically meaningful
 * placement. A historical master is used only when the shirt has not been edited.
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
    return <img src={master} alt={title ?? spec.seasonLabel} className={`${className} object-contain`} />
  }

  const dark = darkCloth(spec)
  const sponsor = sponsorAssetForName(spec.sponsorHe)
  const maker = makerAssetForName(spec.makerHe, spec.seasonLabel)
  const crest = crestArt(spec.crestKey, dark)

  const sponsorPlacement = placementFor(spec, 'sponsor', defaultMarkPlacement(spec, 'sponsor'))
  const makerPlacement = placementFor(spec, 'maker', defaultMarkPlacement(spec, 'maker'))
  const crestPlacement = placementFor(spec, 'crest', defaultMarkPlacement(spec, 'crest'))

  // All three marks are rendered OUTSIDE KitShirt. That gives one placement system and
  // prevents the vector fallback from drawing a second crest or a giant text sponsor.
  const plateSpec: KitSpec = { ...spec, sponsorHe: null, makerHe: null, crestKey: null }
  const fallbackMaker = maker ? null : markFor(spec.makerHe, spec.seasonLabel)

  return (
    <span className={`relative inline-block ${className}`} style={{ aspectRatio: '236 / 274' }}>
      <KitShirt spec={plateSpec} className="absolute inset-0 block h-full w-full" title={title ?? spec.seasonLabel} />

      {crest && (
        <img
          src={crest}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute object-contain"
          style={{ left: `${crestPlacement.x}%`, top: `${crestPlacement.y}%`, width: `${crestPlacement.w}%`, height: `${crestPlacement.h}%` }}
        />
      )}

      {maker ? (
        <MarkImage
          asset={maker}
          placement={makerPlacement}
          invert={dark}
        />
      ) : fallbackMaker ? (
        <MakerFallback id={fallbackMaker} placement={makerPlacement} dark={dark} />
      ) : null}

      {sponsor ? (
        <MarkImage asset={sponsor} placement={sponsorPlacement} />
      ) : spec.sponsorHe ? (
        <SponsorFallback text={spec.sponsorHe} placement={sponsorPlacement} dark={dark} />
      ) : null}
    </span>
  )
}

function MarkImage({
  asset,
  placement,
  invert = false,
}: {
  asset: NonNullable<ReturnType<typeof makerAssetForName>>
  placement: KitPlacement
  invert?: boolean
}) {
  return (
    <span
      className="pointer-events-none absolute"
      style={{ left: `${placement.x}%`, top: `${placement.y}%`, width: `${placement.w}%`, height: `${placement.h}%` }}
    >
      <MarkArtwork asset={asset} invert={invert} className="h-full w-full" />
    </span>
  )
}

function MakerFallback({ id, placement, dark }: { id: NonNullable<ReturnType<typeof markFor>>; placement: KitPlacement; dark: boolean }) {
  return (
    <svg
      viewBox="0 0 24 28"
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{ left: `${placement.x}%`, top: `${placement.y}%`, width: `${placement.w}%`, height: `${placement.h}%` }}
    >
      <MakerMark id={id} ink={dark ? '#fff' : '#171717'} />
    </svg>
  )
}

function SponsorFallback({ text, placement, dark }: { text: string; placement: KitPlacement; dark: boolean }) {
  const latin = !/[\u0590-\u05FF]/.test(text)
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute flex items-center justify-center overflow-hidden whitespace-nowrap text-center font-extrabold ${latin ? 'font-latin' : 'font-body'}`}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.w}%`,
        height: `${placement.h}%`,
        color: dark ? '#fff' : '#171717',
        fontSize: 'clamp(7px, 2.7cqw, 16px)',
        lineHeight: 1,
      }}
    >
      {text}
    </span>
  )
}
