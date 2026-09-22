import type { Metadata } from 'next'

import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { creditsIndex, type CreditEntry, type CreditGroup } from '@/lib/credits'
import { t, type MessageKey } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'

/**
 * המקורות — every source and every credit the product uses, and the only page that prints them.
 *
 * Spec §0.3 (22.9.2026). Until that day each screen carried its own citations — a photographer
 * under the kit grid, an outlet under a verdict, a bibliography at the foot of a LIFE report —
 * and the same source was spelled five ways on five screens. Now a screen says `מקור מתועד`
 * (`components/ui/SourceNote.tsx`) and links here, to the shelf it cites.
 *
 * **Nothing on this page is typed.** `lib/credits` reads the `sourceTitle` / `sourceUrl` /
 * `source` / `credit` fields of every file in `content/manual`, the asset provenance and LIFE's
 * historical sources at build time, deduplicates them by title and counts them. A new source
 * is on the page the day its first fact is; one nobody cites any more leaves with it.
 *
 * Static: the list is read once, at build, and `content/manual` never reaches a browser (rule 1).
 * Every outbound link opens in a new tab with `rel="noopener noreferrer"`.
 */
export const metadata: Metadata = gateMetadata('credits')
export const dynamic = 'force-static'

export default function CreditsPage() {
  const { groups, totals } = creditsIndex()

  return (
    <Screen title={t('screen.credits.title')} sub={t('screen.credits.sub')}>
      <p className="mt-stack max-w-prose font-body text-step--1 leading-relaxed text-muted">
        {t('credits.lede', {
          entries: String(totals.entries),
          citations: String(totals.citations),
          files: String(totals.files),
        })}
      </p>

      <nav aria-label={t('credits.nav')} className="mt-4">
        <ul className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <li key={group.key}>
              <a
                href={`#${group.key}`}
                className="inline-flex min-h-tap items-center border-rule border-ink bg-sheet px-3 font-body text-step--1 font-bold text-ink"
              >
                {t(`credits.group.${group.key}.title` as MessageKey)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {groups.map((group) => (
        <Shelf key={group.key} group={group} />
      ))}

      <ReportLink />
    </Screen>
  )
}

function Shelf({ group }: { group: CreditGroup }) {
  const titleId = `${group.key}-title`
  return (
    <section id={group.key} aria-labelledby={titleId} className="mt-stack scroll-mt-4 border-rule border-ink bg-sheet" data-credits-group={group.key}>
      <header className="border-b-hair border-ink/30 px-3 py-2.5">
        <h2 id={titleId} className="font-display text-step-1 text-ink">
          {t(`credits.group.${group.key}.title` as MessageKey)}
        </h2>
        <p className="mt-0.5 max-w-prose font-body text-[12.5px] leading-snug text-muted">
          {t(`credits.group.${group.key}.desc` as MessageKey)}
        </p>
        <p className="mt-1 font-body text-[11.5px] font-bold text-sign">
          {t('credits.group.count', { entries: String(group.entries.length), citations: String(group.count) })}
        </p>
      </header>
      <ul>
        {group.entries.map((entry) => (
          <Entry key={entry.id} entry={entry} />
        ))}
      </ul>
    </section>
  )
}

function Entry({ entry }: { entry: CreditEntry }) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-b-hair border-ink/15 px-3 py-2 last:border-b-0" data-credit-entry="">
      <span className="min-w-0 break-words font-body text-[13px] leading-snug text-ink">
        {entry.url ? (
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('credits.entry.open', { title: entry.title })}
            className="underline decoration-sign/40 underline-offset-2"
          >
            <bdi>{entry.title}</bdi>
          </a>
        ) : (
          <bdi>{entry.title}</bdi>
        )}
        {entry.host && (
          <span className="mt-0.5 block font-latin text-[10px] tracking-wide text-muted">
            <bdi dir="ltr">{entry.host}</bdi>
          </span>
        )}
      </span>
      <span className="shrink-0 font-body text-[11px] text-muted">
        {entry.count === 1 ? t('credits.entry.one') : t('credits.entry.count', { n: String(entry.count) })}
      </span>
    </li>
  )
}
