import { KitEngineShirt } from '@/components/kit/KitEngineShirt'
import { KitShirt as KitLegacyShirt } from '@/components/kit/KitLegacyShirt'
import type { KitSpec } from '@/lib/kit/spec'

type MissingMark = 'sponsor' | 'maker' | 'crest'

/**
 * Compatibility gateway for older callers.
 *
 * Every complete shirt now uses Kit Engine V5. The legacy renderer survives only for
 * the old "missing mark" teaching state, whose dashed empty slots are not part of the
 * canonical garment renderer. This lets Rumble and older screens inherit the same
 * period anatomy without changing their public component API in one risky sweep.
 */
export function KitShirt({
  spec,
  className = '',
  missing = [],
  title,
}: {
  spec: KitSpec
  className?: string
  missing?: MissingMark[]
  title?: string
}) {
  if (missing.length > 0) {
    return <KitLegacyShirt spec={spec} className={className} missing={missing} title={title} />
  }
  return <KitEngineShirt spec={spec} className={className} title={title} />
}
