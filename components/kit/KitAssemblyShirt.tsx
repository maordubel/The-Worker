import { KitEngineShirt } from '@/components/kit/KitEngineShirt'
import { historicalMasterFor } from '@/lib/kit/assembly'
import type { KitSpec } from '@/lib/kit/spec'

/**
 * One entry point for every shirt in the product.
 * Historical truth may show the supplied master; every editable state goes through
 * KitEngineShirt so Gate 4, Gate 5, archive and Rumble share garment anatomy.
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
  if (master) return <img src={master} alt={title ?? spec.seasonLabel} className={`${className} object-contain`} />
  return <KitEngineShirt spec={spec} className={className} title={title} />
}
