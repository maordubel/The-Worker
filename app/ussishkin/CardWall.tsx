'use client'

import { useState } from 'react'

import { Num } from '@/components/ui/Num'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * קיר הקלפים — the memorial wall.
 *
 * The Ussishkin handoff draws a tifo: a grid of cards, each one held by one person, and
 * the picture only exists from the far side of the hall. That mechanic is exactly right
 * for a memorial and exactly wrong to fake — a live counter of "1,208 cards raised"
 * needs a hall full of people, and inventing one would be a lie printed on a memorial.
 *
 * So the cards hold the RECORD instead. Every card is a sourced fact about the hall,
 * the club, the nights or the fans' own club; turning one over is what raises it, and
 * the counter counts what the reader has actually read. The mosaic still assembles, and
 * every line in it is true.
 *
 * Colour carries the section: vermilion for the building, ink for the nights, cream for
 * the club, navy for what the terrace built afterwards. No yellow, here least of all.
 */

export type Fact = {
  slug: string
  cat: 'building' | 'nights' | 'club' | 'players' | 'ussishkin-club'
  periodHe: string
  factHe: string
  sourceTitle: string
  sourceUrl: string
}

const FACE: Record<Fact['cat'], string> = {
  building: 'bg-red text-paper',
  nights: 'bg-ink text-paper',
  // concrete, not sheet: sheet and paper are one step apart on the same cream, so a
  // club card read as an un-raised one and half the wall looked untouched.
  club: 'bg-concrete text-ink',
  players: 'bg-concrete text-ink',
  'ussishkin-club': 'bg-sign text-paper',
}

export function CardWall({ facts }: { facts: Fact[] }) {
  const [open, setOpen] = useState<string | null>(null)
  const [seen, setSeen] = useState<Set<string>>(new Set())

  function raise(slug: string) {
    setOpen((current) => (current === slug ? null : slug))
    setSeen((current) => new Set(current).add(slug))
  }

  const card = facts.find((fact) => fact.slug === open) ?? null

  return (
    <>
      <div className="mt-3 flex items-baseline justify-between gap-3 border-b-rule border-ink pb-1.5">
        <p className="font-display text-step-1 leading-tight text-ink">{t('uss.wall')}</p>
        <p className="font-mono text-[11px] tabular-nums text-muted">
          <Num>{`${seen.size}/${facts.length}`}</Num> {t('uss.raised')}
        </p>
      </div>

      <ul className="mt-2 grid grid-cols-6 gap-1 sm:grid-cols-10">
        {facts.map((fact) => {
          const raised = seen.has(fact.slug)
          const active = open === fact.slug
          return (
            <li key={fact.slug}>
              <button
                type="button"
                onClick={() => raise(fact.slug)}
                aria-label={fact.factHe.slice(0, 40)}
                aria-pressed={active}
                className={`block aspect-square min-h-tap w-full border-hair border-ink transition-transform duration-press ease-stamp active:scale-90 motion-reduce:transition-none ${
                  raised ? FACE[fact.cat] : 'bg-paper'
                } ${active ? 'outline outline-2 outline-offset-1 outline-ink' : ''}`}
              />
            </li>
          )
        })}
      </ul>

      {/* the card the reader turned over, printed at full size under the wall */}
      <div className="mt-2 min-h-[132px] border-rule border-ink bg-sheet p-4">
        {card ? (
          <>
            <p className="font-body text-[10px] tracking-widest text-red">
              {t(`uss.cat.${card.cat}` as MessageKey)}
              {card.periodHe !== '' && (
                <>
                  {' · '}
                  <Num className="font-mono text-muted">{card.periodHe}</Num>
                </>
              )}
            </p>
            <p className="mt-1.5 font-body text-step-0 leading-relaxed text-ink">{card.factHe}</p>
            <p className="mt-2 font-mono text-[10.5px] text-muted">
              <a href={card.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                <bdi>{card.sourceTitle}</bdi>
              </a>
            </p>
          </>
        ) : (
          <p className="font-body text-step-0 leading-relaxed text-muted">{t('uss.wallHint')}</p>
        )}
      </div>
    </>
  )
}
