'use client'

import { useMemo, useState } from 'react'

import { searchRoster, type Searchable } from '@/lib/game/roster-search'
import type { RosterIndex } from '@/lib/game/allTimeXI'
import { t } from '@/lib/i18n'

/**
 * גיליון השמות — the way into 637 names, owned in one place.
 *
 * This was written inside the all-time XI and then wanted a second time by the polls
 * wing, which asks six questions whose answer is "one of everybody who ever wore the
 * shirt". Copying it would have been the start of two rosters that drift: the search
 * ranking was tuned once, against Maor's complaint that it could not find a man by his
 * family name, and a second copy would have been tuned again or — much likelier — not
 * tuned at all.
 *
 * The two callers differ only in what they call the thing being filled. So the sheet
 * takes a `title` and a `taken` set and knows nothing else: no slot, no ballot, no
 * pitch.
 *
 * The design decisions inside it are the ones the XI arrived at and are not
 * negotiable per caller:
 *  · an empty query shows the WHOLE roster bucketed by family-name initial, because a
 *    truncated alphabetical list neither answers a search nor lets you browse;
 *  · with a term, the grouping is dropped — re-sorting a ranked list into buckets
 *    throws the ranking away;
 *  · the list reserves the fixed tab bar's height plus the home indicator, or the last
 *    name on the sheet cannot be reached.
 */
export function RosterSheet({
  title,
  roster,
  taken,
  onPick,
  onClose,
}: {
  title: string
  roster: RosterIndex
  taken?: ReadonlySet<string>
  onPick: (entry: Searchable) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => searchRoster(roster.all, query), [query, roster.all])
  const grouped = useMemo(
    () => (query.trim() === '' ? roster.letters : null),
    [query, roster.letters],
  )

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink/70" role="dialog" aria-modal="true">
      <button type="button" aria-label={t('xi.close')} className="flex-1" onClick={onClose} />
      <div className="max-h-[76vh] animate-slam overflow-y-auto border-t-rule border-ink bg-sheet">
        <div className="sticky top-0 z-10 border-b-hair border-ink bg-sheet px-4 pb-2 pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-step-1 text-ink">{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="min-h-tap px-2 font-body text-[12px] font-extrabold text-red"
            >
              {t('xi.close')}
            </button>
          </div>
          <div className="mt-2 flex items-stretch gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('xi.search')}
              aria-label={t('xi.search')}
              inputMode="search"
              className="min-h-tap w-full border-hair border-ink bg-paper px-3 font-body text-step-0 text-ink outline-none placeholder:text-muted"
            />
            {query !== '' && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('xi.clear')}
                className="min-h-tap shrink-0 border-hair border-ink bg-paper px-3 font-body text-step-0 font-extrabold text-muted"
              >
                ×
              </button>
            )}
          </div>
          <p className="mt-1 font-mono text-[10.5px] tabular-nums text-muted">
            {query === ''
              ? t('xi.count', { n: String(roster.total) })
              : t('xi.found', { n: String(results.length) })}
          </p>

          {/* the letter rail — family-name initials. 637 names need a way in that is
              not typing, and the initial a supporter reaches for is the family's */}
          {grouped && (
            <ol className="-mx-1 mt-1.5 flex gap-1 overflow-x-auto pb-1">
              {grouped.map((bucket) => (
                <li key={bucket.letter}>
                  <a
                    href={`#roster-letter-${bucket.letter}`}
                    className="flex h-8 min-w-8 items-center justify-center border-hair border-ink/40 px-1.5 font-poster text-[17px] leading-none text-ink"
                  >
                    {bucket.letter}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="px-2 pb-[calc(var(--tap)+2rem+env(safe-area-inset-bottom))]">
          {grouped ? (
            grouped.map((bucket) => (
              <section key={bucket.letter}>
                <h4
                  id={`roster-letter-${bucket.letter}`}
                  className="sticky top-0 z-[5] scroll-mt-24 border-b-hair border-ink bg-ink px-2 py-1 font-poster text-[18px] leading-none text-paper"
                >
                  {bucket.letter}
                </h4>
                <ol>
                  {bucket.names.map((entry) => (
                    <NameRow
                      key={entry.slug}
                      entry={entry}
                      taken={taken?.has(entry.slug) ?? false}
                      onPick={() => onPick(entry)}
                    />
                  ))}
                </ol>
              </section>
            ))
          ) : (
            <ol>
              {results.map((entry) => (
                <NameRow
                  key={entry.slug}
                  entry={entry}
                  taken={taken?.has(entry.slug) ?? false}
                  onPick={() => onPick(entry)}
                />
              ))}
            </ol>
          )}
          {results.length === 0 && (
            <p className="px-2 py-6 text-center font-body text-step--1 text-muted">
              {t('xi.none')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * שורת שם — the family name first, in the display face, the given name after it.
 *
 * A roster row used to print the full name in one weight, which makes 637 of them a
 * grey wall you have to read rather than scan. Leading with the family name at a heavier
 * weight is what a squad list, a teamsheet and a phone book all do, and for the same
 * reason: it is the part you are looking for.
 */
function NameRow({
  entry,
  taken,
  onPick,
}: {
  entry: Searchable
  taken: boolean
  onPick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        disabled={taken}
        className="flex min-h-tap w-full items-baseline gap-2 border-b-hair border-ink/20 px-2 text-start disabled:opacity-35"
      >
        <span className="font-sign text-step-0 leading-tight text-ink">{entry.familyHe}</span>
        {entry.givenHe !== '' && (
          <span className="min-w-0 truncate font-body text-[12px] leading-tight text-muted">
            {entry.givenHe}
          </span>
        )}
      </button>
    </li>
  )
}
