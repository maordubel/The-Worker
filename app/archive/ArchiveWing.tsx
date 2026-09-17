'use client'

import { useEffect, useRef, useState } from 'react'

import { PlayLink } from '@/components/play/PlayLink'
import { MatchLine, Num } from '@/components/ui/Num'
import type { FactCard, OnThisDay } from '@/lib/archive/wing'
import { collect, recordDeed } from '@/lib/profile/store'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * אגף הארכיון — the two corners, drawn.
 *
 * **היום לפני is allowed to be empty, and says so in a full sentence.** Three hundred
 * and sixty-five days, an archive of 1,385 columns and 3,068 dated matches: there are
 * days it holds nothing for, and on those days this corner prints that the archive holds
 * nothing for today. A wing that reached for the nearest date instead would be inventing
 * an anniversary, which is worse than a gap (rule 11).
 *
 * **הידעת turns over.** A card face-down is a card you decided to read; it is also what
 * makes the corner a place you DO something rather than a list you scroll past, which is
 * what lets gate 12 light its plate honestly. Turning one over records the deed and adds
 * it to the collection — the same shape the Ussishkin cards use, so `/tik` can print how
 * much of the archive this device has actually turned over.
 *
 * **A press column is somebody else's writing.** The card carries the headline, the
 * date, the byline and the one short quotation the ingest cut, and the length of the
 * piece beside it so nobody mistakes the quotation for the column. There is no "read
 * more": the app does not hold more (see `scripts/ingest/sources/vikipoel-turim.ts`).
 */
export function ArchiveWing({
  todayHe,
  day,
  cards,
  cycle,
  figures,
  seed,
  cursor,
}: {
  /**
   * Today's date, already spelled out.
   *
   * Formatted on the SERVER and handed down: `lib/archive/wing.ts` is `server-only`, and
   * a client component that imported it would pull the whole archive into the browser
   * bundle to print one line.
   */
  todayHe: string
  day: OnThisDay
  cards: FactCard[]
  cycle: number
  figures: {
    columns: number
    datedMatches: number
    moments: number
    trophies: number
    earliest: string | null
    latest: string | null
  }
  seed: number
  cursor: number
}) {
  const [turned, setTurned] = useState<string[]>([])
  const deeded = useRef(false)

  useEffect(() => {
    if (deeded.current || turned.length === 0) return
    deeded.current = true
    // מעשה — the wing's equivalent of a finished round (see `recordDeed`). Turning a card
    // over is the thing this gate is for; opening the page is not.
    recordDeed('/archive')
  }, [turned])

  function turn(card: FactCard) {
    if (turned.includes(card.id)) return
    setTurned((open) => [...open, card.id])
    collect('archive', [card.id])
  }

  return (
    <div className="mt-stack">
      {/* ------------------------------------------------------------ היום לפני */}
      <section aria-labelledby="archive-today">
        <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink pb-1">
          <h2 id="archive-today" className="font-display text-step-2 leading-tight text-ink">
            {t('archive.today.title')}
          </h2>
          <p className="font-latin text-[10px] font-bold tracking-[0.2em] text-sign" dir="ltr">
            ON THIS DAY
          </p>
        </div>
        {/* No `<Num>` around this: the isolate is for a FIGURE, and forcing LTR on a
            Hebrew sentence moves what is inside it (rule 69 §7 — "1994 בערך" printed
            backwards). The date is a sentence with numbers in it. */}
        <p className="mt-1 font-body text-[11px] text-muted">{todayHe}</p>

        {day.empty ? (
          <p className="mt-3 border-hair border-ink/40 bg-sheet px-3 py-3 font-body text-step--1 leading-relaxed text-ink">
            {t('archive.today.none')}
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {day.matches.map((match) => (
              <li
                key={`${match.playedOn}-${match.homeHe}-${match.awayHe}`}
                className="border-hair border-ink/40 bg-sheet px-3 py-2"
              >
                <p className="font-mono text-[10.5px] tabular-nums text-muted">
                  <Num>{match.year}</Num> · {match.competitionHe}
                </p>
                {/*
                  `MatchLine`, never `2:1`. A separator score cannot say whose number is
                  whose once it sits in an RTL line — the archive forbids one in Hebrew
                  prose and `tests/seed.test.ts` enforces it on content. Writing one by
                  hand in a component is the same lie in a place the guard does not
                  read, which is exactly how it would have shipped.
                */}
                <MatchLine
                  className="mt-0.5 font-sign text-step-0 leading-tight text-ink"
                  homeName={match.homeHe}
                  homeScore={match.homeScore}
                  awayName={match.awayHe}
                  awayScore={match.awayScore}
                />
                <p className="mt-0.5 font-body text-[10.5px] leading-snug text-muted">
                  {match.sourceTitle}
                </p>
              </li>
            ))}
            {day.columns.map((column) => (
              <li key={column.slug} className="border-hair border-ink/40 bg-sheet px-3 py-2">
                <p className="font-mono text-[10.5px] tabular-nums text-muted">
                  <Num>{column.year}</Num> · {column.bylineHe}
                </p>
                <p className="mt-0.5 font-sign text-step-0 leading-tight text-ink">
                  {column.titleHe}
                </p>
                {column.quoteHe && (
                  <blockquote className="mt-1 border-s-rule border-red ps-2 font-body text-[12px] leading-relaxed text-ink">
                    {column.quoteHe}
                  </blockquote>
                )}
                <p className="mt-1 font-body text-[10.5px] leading-snug text-muted">
                  {t('archive.excerpt', { words: String(column.words) })} · {column.sourceTitle}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --------------------------------------------------------------- הידעת */}
      <section aria-labelledby="archive-know" className="mt-stack">
        <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink pb-1">
          <h2 id="archive-know" className="font-display text-step-2 leading-tight text-ink">
            {t('archive.know.title')}
          </h2>
          <p className="font-latin text-[10px] font-bold tracking-[0.2em] text-sign" dir="ltr">
            DID YOU KNOW
          </p>
        </div>
        <p className="mt-1 font-body text-[11px] leading-snug text-muted">
          {t('archive.know.lede')}
        </p>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {cards.map((card) => {
            const open = turned.includes(card.id)
            return (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => turn(card)}
                  aria-expanded={open}
                  className={`flex min-h-tap w-full flex-col items-start border-hair px-3 py-2 text-start transition-transform duration-press ease-stamp active:scale-[.985] motion-reduce:transition-none ${
                    open ? 'border-ink bg-sheet' : 'border-ink/40 bg-paper'
                  }`}
                >
                  <span className="font-latin text-[9px] font-bold tracking-[0.18em] text-sign" dir="ltr">
                    {card.kind.toUpperCase()}
                  </span>
                  {open ? (
                    <>
                      <span className="mt-0.5 block font-sign text-step-0 leading-tight text-ink">
                        {card.titleHe}
                      </span>
                      <span className="mt-0.5 block font-body text-[10.5px] text-muted">
                        {card.whenHe}
                        {card.bylineHe !== null && ` · ${card.bylineHe}`}
                      </span>
                      {card.quoteHe && (
                        <blockquote className="mt-1 border-s-rule border-red ps-2 font-body text-[12px] leading-relaxed text-ink">
                          {card.quoteHe}
                        </blockquote>
                      )}
                      {card.bodyHe && (
                        <span className="mt-1 block font-body text-[12px] leading-relaxed text-ink">
                          {card.bodyHe}
                        </span>
                      )}
                      {/* rule 16 — the source is on the card, not in a footnote */}
                      <span className="mt-1 block font-body text-[10.5px] leading-snug text-muted">
                        {card.sourceTitle}
                      </span>
                    </>
                  ) : (
                    <span className="mt-0.5 block font-display text-step-1 leading-tight text-ink">
                      {t(`archive.kind.${card.kind}` as MessageKey)}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {/*
            עוד — the same deck, one slice on. `PlayLink` is the only thing in the app
            that steps a device's cursor, so the wing gets a different deal on the next
            entry and a different one again the same day (rule 24) without a second
            rotation engine.
          */}
          <PlayLink
            gate="/archive"
            className="min-h-tap border-hair border-red bg-red px-4 font-sign text-step--1 leading-[var(--tap)] text-paper"
          >
            {t('archive.more')}
          </PlayLink>
          <p className="font-body text-[10.5px] text-muted">
            {t('archive.round')} <Num>{cycle + 1}</Num>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ what is here */}
      <p className="mt-stack border-t-hair border-ink/30 pt-2 font-body text-[11px] leading-relaxed text-muted">
        {t('archive.figures', {
          columns: String(figures.columns),
          matches: String(figures.datedMatches),
          from: figures.earliest ? figures.earliest.slice(0, 4) : '—',
          to: figures.latest ? figures.latest.slice(0, 4) : '—',
        })}
      </p>
      {/*
        The seed is printed for the same reason every other gate prints one: a round that
        cannot be named cannot be reported as wrong.
      */}
      <p className="mt-1 font-mono text-[10px] tabular-nums text-muted">
        <Num>{`#${seed}·${cursor}`}</Num>
      </p>
    </div>
  )
}
