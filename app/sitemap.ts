import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/brand'
import { GATES } from '@/lib/gates'

/**
 * מפת האתר — every public gate, derived from `lib/gates.ts` so it can never drift from
 * the wall itself: a gate added or removed there is added or removed here on the next
 * build, with nothing to remember to update by hand.
 *
 * A gate's own `href` sometimes carries the wall's `?seed=` (so the plate always hands
 * out a playable link); the sitemap strips it; a canonical URL does not commit to one
 * seed over every other. `/ussishkin` is added by hand because it is a memorial wing,
 * not a gate (rule 24) and so is not in `GATES` at all.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const gateEntries: MetadataRoute.Sitemap = GATES.map((gate) => ({
    url: `${SITE_URL}${gate.href.split('?')[0]}`,
    lastModified: now,
  }))

  return [
    { url: SITE_URL, lastModified: now },
    ...gateEntries,
    { url: `${SITE_URL}/ussishkin`, lastModified: now },
  ]
}
