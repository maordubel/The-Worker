'use client'

import { useEffect, useRef } from 'react'

import { ADSENSE_CLIENT, type AdPlacement } from '@/lib/ads'
import { t } from '@/lib/i18n'

/**
 * יחידת פרסום — one AdSense unit, and the furniture that stops it doing damage.
 *
 * Three things this does that a pasted AdSense snippet does not:
 *
 * 1. **It reserves its height before the script answers.** An ad that arrives late into
 *    a zero-height box shoves everything under it down — and on a phone that means the
 *    button a thumb was already moving toward is somewhere else by the time it lands.
 *    The box is the ad's height from the first paint, empty or full.
 *
 * 2. **It is labelled.** A block of unmarked commercial content inside a page about a
 *    football club's history is the kind of thing that makes a reader distrust the page
 *    around it. One small line in the press voice, and the unit is honest furniture.
 *
 * 3. **It is framed like everything else here.** An ad in a default browser box on a
 *    screenprinted sheet reads as damage. It gets the same ink rule, the same cream
 *    ground and the same zero radius as every other plate, so it sits inside the design
 *    instead of on top of it.
 *
 * The `useRef` guard matters in development: React 18 runs effects twice under Strict
 * Mode, and pushing the same slot to AdSense twice throws "already have ads in them".
 */
export function AdSlot({ placement }: { placement: AdPlacement }) {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] }
      w.adsbygoogle = w.adsbygoogle || []
      w.adsbygoogle.push({})
    } catch {
      // a blocked or failed ad is a smaller problem than a thrown render
    }
  }, [])

  const height = placement === 'result' ? 'min-h-[280px]' : 'min-h-[130px]'

  return (
    <aside
      aria-label={t('ad.label')}
      className={`mt-stack border-rule border-ink bg-sheet ${height}`}
    >
      <p className="border-b-hair border-ink/30 px-3 py-1 font-body text-[10px] tracking-widest text-muted">
        {t('ad.label')}
      </p>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  )
}
