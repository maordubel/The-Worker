'use client'

import type { HistoricalAnchor } from '@/lib/life/anchors'
import { isPlaceholder } from '@/lib/life/anchors'
import { t } from '@/lib/i18n'

/**
 * הכרטיס ההיסטורי — the one moment the game states a fact, and it shows its source.
 *
 * `lib/life/anchor-server.ts` resolved this from the canonical archive; the headline is
 * built from canonical fields only. What the archive does NOT hold — the deciding match,
 * its opponent, its score — is printed here as a placeholder note rather than quietly
 * filled in, which is rule 11 in the one place a player can see it.
 *
 * Making the gap visible is not an apology. The repo's own upgrade note is that showing
 * provenance turns the project's biggest risk into its differentiator; this is that idea
 * inside a game.
 */
export function AnchorCard({ anchor, onClose }: { anchor: HistoricalAnchor; onClose: () => void }) {
  const provisional = isPlaceholder(anchor)

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-ink/70 p-gutter">
      <div className="w-full max-w-md border-rule border-ink bg-sheet">
        <div className="bg-red px-4 py-2">
          <p className="font-latin text-[10px] font-bold tracking-[0.22em] text-sheet" dir="ltr">
            HISTORICAL RECORD
          </p>
        </div>

        <div className="px-4 pb-4 pt-4">
          <p className="font-display text-step-2 leading-tight text-ink">
            <bdi>{anchor.headlineHe}</bdi>
          </p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-muted" dir="ltr">
            {anchor.seasonLabel}
          </p>

          <p className="mt-4 border-t-hair border-ink/25 pt-3 font-body text-[11px] leading-snug text-muted">
            <span className="text-ink">{t('life.anchor.source')}</span>{' '}
            <bdi>{anchor.sourceTitle}</bdi>
          </p>

          {anchor.placeholder && (
            <div className="mt-3 border-hair border-red bg-red/10 px-3 py-2">
              <p className="font-latin text-[9px] font-bold tracking-[0.18em] text-red" dir="ltr">
                DEVELOPMENT PLACEHOLDER
              </p>
              <p className="mt-1 font-body text-[11px] leading-snug text-ink">
                <bdi>{anchor.placeholder.what}</bdi>
              </p>
              <p className="mt-1 font-body text-[10px] leading-snug text-muted">
                <bdi>{anchor.placeholder.needs}</bdi>
              </p>
            </div>
          )}

          {provisional && !anchor.placeholder && (
            <p className="mt-3 font-body text-[11px] text-red">{t('life.anchor.unverified')}</p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-4 flex min-h-tap w-full items-center justify-center border-rule border-ink bg-ink px-4 transition-colors duration-press active:bg-red motion-reduce:transition-none"
          >
            <span className="font-display text-[15px] text-sheet">{t('life.continue')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
