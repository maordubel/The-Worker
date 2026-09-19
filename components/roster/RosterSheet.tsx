'use client'

import { useMemo, useState } from 'react'

import { Num } from '@/components/ui/Num'
import { RosterFilters } from '@/components/roster/RosterFilters'
import {
  byInitial,
  filterRoster,
  isFiltered,
  NO_FILTER,
  searchRoster,
  type RosterFilter,
  type Searchable,
} from '@/lib/game/roster-search'
import type { RosterIndex } from '@/lib/game/allTimeXI'
import type { SlotRole } from '@/lib/xi/roles'
import { scoutGroups, SCOUT_ORDERS, type ScoutOrder } from '@/lib/xi/scout'
import { useDialog } from '@/components/ui/useDialog'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * גיליון השמות — the way into 661 names, owned in one place.
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
 *
 * ## `scout` — the drawer gate 1 opens once a position has been chosen (19.9.2026)
 *
 * One optional prop, and the sheet is the same sheet without it — which is why this is
 * an extension rather than a second component. Gate 7 passes nothing and gets exactly
 * what it got before.
 *
 * With it, three things change and nothing else does:
 *  · the names are grouped by FIT against the open slot instead of by initial, because
 *    once a position is chosen the initial is no longer the question being asked;
 *  · a sort control and a "fit only" toggle appear, both of which act on the groups and
 *    neither of which ranks a player (see `lib/xi/scout.ts`);
 *  · every row carries a ★ that puts the man on the shortlist without picking him,
 *    which is the whole mechanic of an argument you have not settled yet.
 *
 * **The letter rail is replaced, not lost.** It anchors to letter headings, and there
 * are none while scouting; what takes its place — position, origin, decade, season, fit
 * and sort — is strictly more ways in, not fewer.
 */
export type ScoutProps = {
  /** the open slot's detailed role. Mapped down to the four canonical positions in `lib/xi/roles.ts` */
  role: SlotRole
  /** what the slot is called on the pitch, for the drawer's own heading */
  roleHe: string
  order: ScoutOrder
  onOrder: (next: ScoutOrder) => void
  fitOnly: boolean
  onFitOnly: (next: boolean) => void
  shortlist: ReadonlySet<string>
  onShortlist: (slug: string) => void
}

export function RosterSheet({
  title,
  roster,
  taken,
  onPick,
  onClose,
  scout,
  footer,
}: {
  title: string
  roster: RosterIndex
  taken?: ReadonlySet<string>
  onPick: (entry: Searchable) => void
  onClose: () => void
  /** gate 1's scouting drawer. Omit it and this is the sheet gate 7 has always had. */
  scout?: ScoutProps
  /** anything the caller wants under the list — gate 1 puts the slot's own controls there */
  footer?: React.ReactNode
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<RosterFilter>(NO_FILTER)
  /**
   * The facet rows, folded away while scouting.
   *
   * On a 390px screen the sticky header is search + five filter rows + the fit and sort
   * controls, which left four names visible under it — a drawer whose chrome is taller
   * than its content is a drawer nobody scrolls. Gate 7 has no slot to narrow by, so it
   * opens them as it always did; gate 1 has already narrowed by position before the
   * sheet appeared, so they start folded and one tap brings them back.
   */
  const [facetsOpen, setFacetsOpen] = useState(false)

  // Filter first, search second. The other order works and is wrong: a ranked list
  // re-filtered loses nothing, but filtering after ranking means the counts printed on
  // the chips describe a set the reader is not looking at.
  const narrowed = useMemo(() => filterRoster(roster.all, filter), [roster.all, filter])
  const results = useMemo(() => searchRoster(narrowed, query), [query, narrowed])
  const grouped = useMemo(
    () =>
      scout || query.trim() !== ''
        ? null
        : isFiltered(filter)
          ? byInitial(narrowed)
          : roster.letters,
    [scout, query, filter, narrowed, roster.letters],
  )
  const buckets = useMemo(
    () => (scout ? scoutGroups(results, scout.role, scout.order, scout.fitOnly) : null),
    [scout, results],
  )
  const dialogRef = useDialog<HTMLDivElement>(onClose)

  const shown = buckets
    ? buckets.fit.length + buckets.other.length + buckets.unknown.length
    : results.length

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex flex-col bg-ink/70 outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button type="button" aria-label={t('xi.close')} className="flex-1" onClick={onClose} />
      <div className="max-h-[80vh] animate-slam overflow-y-auto border-t-rule border-ink bg-sheet">
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
          {scout && (
            <p className="mt-0.5 font-body text-[11px] leading-snug text-muted">
              {t('scout.lede', { role: scout.roleHe })}
            </p>
          )}
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
            {query === '' && !isFiltered(filter) && !scout
              ? t('xi.count', { n: String(roster.total) })
              : t('roster.count', { shown: String(shown), total: String(roster.total) })}
          </p>

          {scout && (
            <button
              type="button"
              onClick={() => setFacetsOpen(!facetsOpen)}
              aria-expanded={facetsOpen}
              className={`mt-1.5 flex min-h-tap w-full items-center justify-between gap-2 border-hair px-2.5 font-body text-[11.5px] font-extrabold leading-none ${
                isFiltered(filter) ? 'border-red text-red' : 'border-ink/40 text-ink'
              }`}
            >
              <span>{t('roster.find')}</span>
              <span aria-hidden="true" className="font-mono text-[13px]">
                {facetsOpen ? '−' : '+'}
              </span>
            </button>
          )}

          {(!scout || facetsOpen) && (
            <RosterFilters
              all={roster.all}
              filter={filter}
              onChange={setFilter}
              showYear={scout !== undefined}
            />
          )}

          {scout && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => scout.onFitOnly(!scout.fitOnly)}
                aria-pressed={scout.fitOnly}
                className={`min-h-tap border-hair px-2.5 font-body text-[11.5px] font-extrabold leading-none transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                  scout.fitOnly ? 'border-ink bg-ink text-paper' : 'border-ink/40 bg-paper text-ink'
                }`}
              >
                {t('scout.fitOnly')}
              </button>
              <div className="-mx-0.5 flex flex-1 gap-1 overflow-x-auto px-0.5">
                {SCOUT_ORDERS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => scout.onOrder(option)}
                    aria-pressed={scout.order === option}
                    className={`flex min-h-tap shrink-0 items-center border-hair px-2.5 font-body text-[11.5px] font-extrabold leading-none transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                      scout.order === option
                        ? 'border-ink bg-ink text-paper'
                        : 'border-ink/40 bg-paper text-ink'
                    }`}
                  >
                    {t(`scout.order.${option}` as MessageKey)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* the letter rail — family-name initials. 661 names need a way in that is
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
          {buckets ? (
            (
              [
                ['fit', buckets.fit],
                ['other', buckets.other],
                ['unknown', buckets.unknown],
              ] as const
            ).map(([group, names]) =>
              names.length === 0 ? null : (
                <section key={group}>
                  <h4 className="sticky top-0 z-[5] flex items-baseline justify-between gap-2 border-b-hair border-ink bg-ink px-2 py-1 text-paper">
                    <span className="font-sign text-[13px] leading-tight">
                      {t(`scout.group.${group}` as MessageKey)}
                    </span>
                    <span className="font-mono text-[10px]">
                      <Num>{names.length}</Num>
                    </span>
                  </h4>
                  {/*
                    The unknown bucket says what it is, every time it appears. A reader
                    who sees twenty names under a heading has to be told the archive is
                    silent about them rather than that they were judged and placed last.
                  */}
                  {group === 'unknown' && (
                    <p className="px-2 py-1.5 font-body text-[10.5px] leading-snug text-muted">
                      {t('scout.group.unknown.note')}
                    </p>
                  )}
                  <ol>
                    {names.map((entry) => (
                      <NameRow
                        key={entry.slug}
                        entry={entry}
                        taken={taken?.has(entry.slug) ?? false}
                        onPick={() => onPick(entry)}
                        starred={scout?.shortlist.has(entry.slug) ?? false}
                        onStar={scout ? () => scout.onShortlist(entry.slug) : undefined}
                      />
                    ))}
                  </ol>
                </section>
              ),
            )
          ) : grouped ? (
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
          {shown === 0 && (
            <p className="px-2 py-6 text-center font-body text-step--1 text-muted">
              {t('xi.none')}
            </p>
          )}
          {footer}
        </div>
      </div>
    </div>
  )
}

/**
 * שורת שם — the family name first, in the display face, the given name after it.
 *
 * A roster row used to print the full name in one weight, which makes 661 of them a
 * grey wall you have to read rather than scan. Leading with the family name at a heavier
 * weight is what a squad list, a teamsheet and a phone book all do, and for the same
 * reason: it is the part you are looking for.
 *
 * The ★ is a SIBLING of the name button, never inside it: a button inside a button is
 * invalid markup and, on a phone, a tap that lands in the ambiguity picks a man you were
 * only marking.
 */
function NameRow({
  entry,
  taken,
  onPick,
  starred = false,
  onStar,
}: {
  entry: Searchable
  taken: boolean
  onPick: () => void
  starred?: boolean
  onStar?: () => void
}) {
  return (
    <li className="flex items-stretch gap-1 border-b-hair border-ink/20">
      <button
        type="button"
        onClick={onPick}
        disabled={taken}
        className="flex min-h-tap flex-1 items-baseline gap-2 px-2 text-start disabled:opacity-35"
      >
        <span className="font-sign text-step-0 leading-tight text-ink">{entry.familyHe}</span>
        {entry.givenHe !== '' && (
          <span className="min-w-0 truncate font-body text-[12px] leading-tight text-muted">
            {entry.givenHe}
          </span>
        )}
        {/*
          The position, only when a source states one, and never as colour alone.
          An inferred position (a man's slot in ONE recorded XI) is marked with a
          degree sign rather than dropped: it is real evidence and it is weaker
          evidence, and a row that flattens the two teaches the reader the archive
          knows more than it does.
        */}
        {entry.position && (
          <span className="ms-auto shrink-0 border-hair border-ink/30 px-1.5 py-[2px] font-body text-[9.5px] font-extrabold leading-none text-muted">
            {t(`roster.pos.${entry.position}` as MessageKey)}
            {entry.positionFrom === 'lineup' && <span aria-hidden="true">°</span>}
          </span>
        )}
      </button>
      {onStar && (
        <button
          type="button"
          onClick={onStar}
          aria-pressed={starred}
          aria-label={t('scout.star', { name: entry.nameHe })}
          className={`min-h-tap w-tap shrink-0 border-s-hair border-ink/20 font-body text-[15px] leading-none ${
            starred ? 'bg-ink text-paper' : 'text-muted'
          }`}
        >
          ★
        </button>
      )}
    </li>
  )
}
