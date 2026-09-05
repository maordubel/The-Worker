'use client'

import { useEffect, useRef, useState } from 'react'

import { isPlaceholder } from '@/lib/life/anchors'
import { artUrl } from '@/lib/life/runtime/art'
import { chapterFor } from '@/lib/life/content/chapters'
import { Grain, Letterbox } from '@/components/life/FilmFx'
import type { LifeBusEvents } from '@/lib/life/runtime/bus'
import { t } from '@/lib/i18n'

type Finale = NonNullable<LifeBusEvents['finale']>

/**
 * סוף שלב א' — the one screen in this game a player is meant to sit with.
 *
 * Everything else in THE WORKER LIFE is something you walk through. This is a stop: the
 * afternoon is over, the chapter is over, and the game owes the person who played it an
 * answer to three separate questions, in this order, because answering them out of order
 * is what makes an end-of-chapter screen feel like a receipt.
 *
 *   1. **What happened?** — and the answer is not written by this game. It is 24.5.1986,
 *      Bloomfield, Hapoel Tel Aviv against Maccabi Haifa, Gili Landau in the eighty-sixth
 *      minute from Moshe Sinai's chip. Every one of those is a row in `content/manual`,
 *      resolved through the anchor, printed with its source underneath. Rule 11 is not a
 *      constraint on this screen; it is the reason the screen lands.
 *   2. **Were you there?** — the ticket. A real one, kept for forty years: match 15, a
 *      child's price, seven shekels, number 053. It is shown at the size a thing you kept
 *      deserves, and it is the single most convincing object in the game precisely because
 *      nobody drew it.
 *   3. **What did it make of you?** — the Red Heart, in words, never in bars, and the one
 *      line about who this child now is. Then the door to Stage B, which is the only
 *      button on the screen.
 *
 * The morning's papers sit between two and three, and they are the celebration. A game
 * does not have to describe what winning felt like in 1986 if it can hand you the front
 * page and let מעריב ספורט say it: **אדומים**.
 */
export function StageFinale({ finale, onContinue }: { finale: Finale; onContinue: () => void }) {
  const [zoom, setZoom] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const match = finale.anchor.match
  const verified = !isPlaceholder(finale.anchor)
  /**
   * Which stage this closes. The 1986 card is a champions' card with the real ticket and
   * the next morning's papers; the 1990 one is a promotion, and the archive holds no
   * ticket and no paper for it yet — so those sections do not pretend.
   */
  const stageB = finale.anchor.year >= 1990
  // 1986 and 1990 have their own cards (champions, promoted); every later chapter is
  // named by its registry row — the unit, the date, the title.
  const chapter = chapterFor(finale.chapter)
  const later = stageB && finale.chapter !== '1990'

  // A card that opens halfway down is a card somebody scrolled by accident.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    if (!zoom) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoom(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom])

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 bg-ink" data-life="finale">
      <Confetti />

      <div ref={scroller} className="relative h-full overflow-y-auto overscroll-contain">
        {/* ------------------------------------------------- the hero: a slow push-in -- */}
        {/* The finale used to open on a red box of type. A film ends on a PICTURE: the
            chapter's graded key plate pushing in under bars and grain, the year in the
            poster face, and only then the sheet of what happened. */}
        <div className="relative h-[38vh] min-h-[200px] w-full overflow-hidden" data-life="finale-hero">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center motion-reduce:animate-none"
            style={{ backgroundImage: `url(${artUrl(`plate-${finale.chapter}`)})`, animation: 'plate-push 9000ms ease-out both' }}
          />
          <div aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgb(var(--ink)) 0%, rgb(var(--ink) / .2) 50%, rgb(var(--ink) / .3) 100%)' }} />
          <Grain opacity={0.2} />
          <Letterbox height={0.09} ms={700} />
          <p
            aria-hidden="true"
            className="absolute bottom-4 font-poster text-[64px] leading-none text-sheet sm:text-[88px]"
            style={{ insetInlineEnd: 20, textShadow: '0 2px 24px rgb(var(--ink) / .9)' }}
            dir="ltr"
          >
            {finale.anchor.year}
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl px-gutter pb-8 pt-3">
          {/* ---------------------------------------------------------- the title -- */}
          <div className="border-rule border-red bg-red px-4 py-5 text-center">
            <p className="font-latin text-[10px] font-bold tracking-[0.28em] text-sheet" dir="ltr">
              {later && chapter ? `${t('life.finale.stageB')} · ${chapter.unit} · ${finale.anchor.year}` : stageB ? t('life.finale.kicker1990') : t('life.finale.kicker')}
            </p>
            <p className="mt-2 font-poster text-[46px] leading-[0.92] text-sheet sm:text-[68px]">
              <bdi>{later && chapter ? chapter.titleHe : stageB ? t('life.finale.promoted') : t('life.finale.champions')}</bdi>
            </p>
            <p className="mt-2 font-mono text-[13px] leading-none tabular-nums text-sheet/90" dir="ltr">
              {later && chapter ? chapter.dateHe : finale.anchor.seasonLabel}
            </p>
            {/* Counted out of `trophies.json`, never typed in — see `countTitles`. */}
            {finale.anchor.titlesSoFar !== null && (
              <p className="mt-3 border-t-hair border-sheet/40 pt-3 font-display text-[14px] leading-none text-sheet">
                <bdi>{t('life.finale.titleCount', { n: String(finale.anchor.titlesSoFar) })}</bdi>
              </p>
            )}
          </div>

          {/* --------------------------------------------------- what actually happened -- */}
          {match && (
            <section className="mt-3 border-rule border-sheet/25 bg-sheet px-4 py-4">
              <h2 className="font-display text-step-1 leading-tight text-ink">
                <bdi>{t('life.finale.matchTitle')}</bdi>
              </h2>

              <div className="mt-3 flex items-stretch border-rule border-ink">
                <TeamCell nameHe={match.atHome ? t('life.finale.us') : match.opponentHe} score={match.atHome ? match.scoredFor : match.scoredAgainst} won={match.atHome} />
                <div className="flex items-center border-x-hair border-ink/25 px-2">
                  <span className="font-latin text-[9px] font-bold tracking-[0.16em] text-muted" dir="ltr">
                    FT
                  </span>
                </div>
                <TeamCell nameHe={match.atHome ? match.opponentHe : t('life.finale.us')} score={match.atHome ? match.scoredAgainst : match.scoredFor} won={!match.atHome} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t-hair border-ink/20 pt-3">
                <Row label={t('life.finale.when')} value={hebrewDate(match.playedOn)} ltr />
                {match.venueHe && <Row label={t('life.finale.where')} value={match.venueHe} />}
                {match.decidedBy && (
                  <Row label={t('life.finale.scorer')} value={`${match.decidedBy.scorerHe} · ${match.decidedBy.minute}'`} />
                )}
                {match.decidedBy?.assistHe && <Row label={t('life.finale.assist')} value={match.decidedBy.assistHe} />}
              </dl>

              <p className="mt-3 border-t-hair border-ink/20 pt-3 font-body text-[11px] leading-snug text-muted">
                <span className="text-ink">{t('life.anchor.source')}</span> <bdi>{match.sourceTitle}</bdi>
                {!verified && <span className="ms-1 text-red"> · {t('life.anchor.unverified')}</span>}
              </p>
            </section>
          )}

          {/* ------------------------------------------ a season that is a fact, not a match -- */}
          {!match && finale.anchor.summaryHe && (
            <section className="mt-3 border-rule border-sheet/25 bg-sheet px-4 py-4" data-life="finale-summary">
              <h2 className="font-display text-step-1 leading-tight text-ink">
                <bdi>{t('life.finale.matchTitle')}</bdi>
              </h2>
              <p className="mt-2 font-body text-[15px] leading-relaxed text-ink">
                <bdi>{finale.anchor.summaryHe}</bdi>
              </p>
              <p className="mt-3 border-t-hair border-ink/20 pt-2 font-body text-[11px] leading-snug text-muted">
                <bdi>
                  {t('life.finale.source')}: {finale.anchor.sourceTitle}
                </bdi>
              </p>
            </section>
          )}

          {/* --------------------------------------------------------- the ticket -- */}
          {finale.keptTicket && !stageB && (
            <section className="mt-3 border-rule border-sheet/25 bg-ink px-4 py-4">
              <h2 className="font-display text-step-1 leading-tight text-sheet">
                <bdi>{t('life.finale.ticketTitle')}</bdi>
              </h2>
              <button
                type="button"
                onClick={() => setZoom('docTicket')}
                className="mt-3 block min-h-tap w-full border-hair border-concrete/40 bg-ink/60 p-2 transition-transform duration-press ease-stamp active:scale-[.99] motion-reduce:transition-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artUrl('docTicket')} alt={t('life.finale.ticketAlt')} className="w-full" />
              </button>
              <p className="mt-2 font-body text-[11px] leading-snug text-concrete">
                <bdi>{t('life.finale.ticketNote')}</bdi>
              </p>
            </section>
          )}

          {/* ------------------------------------------------- the morning after -- */}
          {!stageB && (
          <section className="mt-3 border-rule border-sheet/25 bg-ink px-4 py-4">
            <h2 className="font-display text-step-1 leading-tight text-sheet">
              <bdi>{t('life.finale.papersTitle')}</bdi>
            </h2>
            <p className="mt-1 font-body text-[11px] leading-snug text-concrete">
              <bdi>{t('life.finale.papersNote')}</bdi>
            </p>
            {/* The front page is not one of three thumbnails. אדומים ran across the top of
                מעריב ספורט the next morning at the size of a front page, and shrinking it
                to a third of a row to keep a grid tidy throws away the only thing on this
                screen that says what the city felt like. */}
            <div className="mt-3 grid grid-cols-5 gap-2">
              <PaperPlate art="paperAdumim" onOpen={setZoom} className="col-span-3" />
              <div className="col-span-2 flex flex-col gap-2">
                <PaperPlate art="paperFive" onOpen={setZoom} />
                <PaperPlate art="paperCollector" onOpen={setZoom} />
              </div>
            </div>
          </section>
          )}

          {/* ------------------------------------------------------ what you became -- */}
          <section className="mt-3 border-rule border-red bg-sheet px-4 py-4">
            <h2 className="font-display text-step-1 leading-tight text-ink">
              <bdi>{finale.titleHe}</bdi>
            </h2>
            <p className="mt-2 font-body text-step--1 leading-relaxed text-ink">
              <bdi>{finale.bodyHe}</bdi>
            </p>
            <p className="mt-3 border-t-hair border-ink/20 pt-3 font-display text-step-1 leading-snug text-red">
              <bdi>{finale.becameHe}</bdi>
            </p>
          </section>

          {/* -------------------------------------------------------- stage b -- */}
          <section className="mt-3 border-rule border-sheet/25 bg-ink px-4 py-5">
            <div className="flex items-center gap-2">
              <Pip done label="A" />
              <div className="h-[2px] flex-1 bg-red" />
              <Pip done={stageB} label="B" />
              <div className={`h-[2px] flex-1 ${stageB ? 'bg-red' : 'bg-concrete/30'}`} />
              <Pip label="C" />
            </div>
            <p className="mt-3 font-display text-step-2 leading-tight text-sheet">
              <bdi>{stageB ? t('life.finale.stageDone1990') : t('life.finale.stageDone')}</bdi>
            </p>
            <p className="mt-1 font-body text-[12px] leading-snug text-concrete">
              <bdi>{stageB ? t('life.finale.stageNext1990') : t('life.finale.stageNext')}</bdi>
            </p>

            <button
              type="button"
              onClick={onContinue}
              className="mt-4 flex min-h-tap w-full items-center justify-between gap-3 border-rule border-red bg-red px-4 py-3 transition-transform duration-press ease-stamp active:scale-[.99] motion-reduce:transition-none"
              data-life="finale-continue"
            >
              <span className="font-display text-step-1 leading-none text-sheet">
                <bdi>{stageB ? t('life.finale.cta1990') : t('life.finale.cta')}</bdi>
              </span>
              <span className="font-latin text-[10px] font-bold tracking-[0.2em] text-sheet/80" dir="ltr">
                1990
              </span>
            </button>
          </section>
        </div>
      </div>

      {zoom && (
        <button
          type="button"
          onClick={() => setZoom(null)}
          className="absolute inset-0 z-[60] flex min-h-tap items-center justify-center bg-ink/95 p-3"
          aria-label={t('life.finale.close')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artUrl(zoom)} alt="" className="max-h-full max-w-full object-contain" />
        </button>
      )}
    </div>
  )
}

function PaperPlate({
  art,
  onOpen,
  className = '',
}: {
  art: 'paperAdumim' | 'paperFive' | 'paperCollector'
  onOpen: (art: string) => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(art)}
      className={`min-h-tap border-hair border-concrete/40 bg-sheet p-1 transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={artUrl(art)} alt={t(`life.finale.paper.${art}`)} className="w-full" />
    </button>
  )
}

function TeamCell({ nameHe, score, won }: { nameHe: string; score: number; won: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-between gap-2 px-3 py-2">
      <span className={`font-display text-[14px] leading-none ${won ? 'text-ink' : 'text-muted'}`}>
        <bdi>{nameHe}</bdi>
      </span>
      <span
        className={`min-w-[26px] px-1.5 py-0.5 text-center font-mono text-[18px] leading-none tabular-nums ${
          won ? 'bg-red text-sheet' : 'text-muted'
        }`}
        dir="ltr"
      >
        {score}
      </span>
    </div>
  )
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[10px] leading-none text-muted">{label}</dt>
      <dd
        className={`mt-1 font-body text-[12px] leading-snug text-ink ${ltr ? 'font-mono tabular-nums' : ''}`}
        dir={ltr ? 'ltr' : undefined}
      >
        <bdi>{value}</bdi>
      </dd>
    </div>
  )
}

function Pip({ label, done }: { label: string; done?: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center font-latin text-[11px] font-bold leading-none ${
        done ? 'bg-red text-sheet' : 'border-hair border-concrete/50 text-concrete'
      }`}
      dir="ltr"
    >
      {label}
    </span>
  )
}

/**
 * הנייר באוויר, בדפדפן — the same carnival as on the terrace, in CSS.
 *
 * Twenty-eight strips, red and cream, on staggered falls. Positions come from an index
 * rather than from `Math.random()` so the server and the client agree on the first paint;
 * a hydration mismatch on a celebration screen is a flash of the wrong thing at the exact
 * moment the game has asked for the player's whole attention. It is decoration, it is
 * `aria-hidden`, and it stops entirely under `prefers-reduced-motion`.
 */
function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {Array.from({ length: 44 }, (_, i) => {
        const left = ((i * 37) % 100) + (i % 3)
        const delay = (i % 9) * 0.45
        const duration = 5.5 + ((i * 13) % 40) / 10
        const red = i % 3 !== 0
        return (
          <span
            key={i}
            className="absolute top-[-8%] block w-[4px] opacity-80"
            style={{
              left: `${left}%`,
              height: `${14 + (i % 5) * 4}px`,
              background: red ? 'rgb(var(--red))' : 'rgb(var(--sheet))',
              animation: `life-fall ${duration}s linear ${delay}s infinite`,
            }}
          />
        )
      })}
      <style>{`@keyframes life-fall{0%{transform:translateY(-10vh) rotate(0)}100%{transform:translateY(115vh) rotate(540deg)}}`}</style>
    </div>
  )
}

/** `1986-05-24` → `24.5.1986`. The archive stores ISO; a person reads a date. */
function hebrewDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${Number(d)}.${Number(m)}.${y}`
}
