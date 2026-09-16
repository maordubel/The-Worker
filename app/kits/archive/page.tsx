import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import {
  archiveDecades,
  archiveShirts,
  archiveSources,
  archiveSummary,
  archiveVariants,
} from '@/lib/kit/archive'
import { t } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'

import { ArchiveWing } from './ArchiveWing'

/**
 * שער 5 — ארכיון החולצות.
 *
 * A route of its own rather than a third tab inside `/kits`, for two reasons that are
 * both about honesty rather than navigation:
 *
 *   · **It is the only screen in the product that shows photographs of real objects.**
 *     `public/kits/` is the third yellow exemption, and the sweep visits this URL to
 *     measure the chrome around the photographs with the photographs hidden. A tab
 *     inside another screen has no URL, so it could not be swept at all.
 *   · **It is linkable.** "The 1985 away shirt" is a thing a person sends to another
 *     person, and a tab state is not.
 *
 * Everything is read on the SERVER — 168 rows, three facet lists and a summary — and
 * what crosses to the client is the projection the grid needs. `content/manual` never
 * reaches a browser (rule 1).
 */
export const metadata: Metadata = gateMetadata('kits-archive')

export default function KitArchivePage() {
  const shirts = archiveShirts()
  const summary = archiveSummary(shirts)

  return (
    <Screen title={t('screen.kitarchive.title')} sub={t('screen.kitarchive.sub')}>
      {shirts.length > 0 ? (
        <>
          <p className="mt-stack font-body text-step--1 leading-relaxed text-muted">
            {t('kits.archive.lede', {
              n: String(summary.total),
              from: String(summary.firstYear),
              to: String(summary.lastYear),
              approx: String(summary.approximate),
            })}
          </p>
          <ArchiveWing
            shirts={shirts}
            variants={archiveVariants(shirts)}
            decades={archiveDecades(shirts)}
            sources={archiveSources(shirts)}
          />
        </>
      ) : (
        <EmptyState title={t('kits.archive.empty')} body={t('kits.archive.note')} />
      )}
      <ReportLink />
    </Screen>
  )
}
