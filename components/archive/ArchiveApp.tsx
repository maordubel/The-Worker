'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

import { RecordRun } from '@/components/play/RecordRun'
import { Num } from '@/components/ui/Num'
import { describeIds, digBox, openEntity, rabbit, searchArchive, seasonDeck } from '@/app/archive/actions'
import { reactionSetOf, REACTIONS, type ArchiveCard, type EntityDetail, type EntityType } from '@/lib/archive/graph-types'
import { haptic } from '@/lib/play/haptics'
import { emit, telemetry } from '@/lib/profile/events'
import { isOn, onIds } from '@/lib/profile/store'
import { t, type MessageKey } from '@/lib/i18n'
import { ArchiveBox } from './ArchiveBox'
import { ArchiveDrawer } from './ArchiveDrawer'
import { MineSheet, SearchSheet, TimeMachine } from './ArchiveSheets'
import { ArtifactMark, CardHeadline, Eyebrow, LATIN, cardTitle } from './EntityCard'

/**
 * שער 12 — הארכיון החי, on one screen (brief §22, prototype v10).
 *
 * A dock above the tab bar — **היום · זמן · חפירה · חיפוש · שלי** — over one deck of
 * cards you swipe. Five Today chips deal the deck; the time machine deals a season; the
 * box is a table you dig through; search is ONE server search over the graph; Mine is a
 * parity set on the device (`archive.mine`, `toggleIn/isOn` semantics through `emit`),
 * so an un-save survives a sync.
 *
 * **Depth** is how far the visit went: a related item, the rabbit hole, the box, the
 * trail — each open from inside the archive is a step down. Five steps in one visit is a
 * finished round (`RecordRun "/archive"`, once per visit); every open is also filed into
 * the `archive` collection (the deed of the day, and gate 10's discovery count).
 */

export type TodayChip = 'today' | 'know' | 'shelf' | 'forgotten' | 'discover'
const CHIPS: readonly TodayChip[] = ['today', 'know', 'shelf', 'forgotten', 'discover']
type Layer = 'box' | 'time' | 'search' | 'mine' | null
type Via = 'deck' | 'related' | 'around' | 'box' | 'trail' | 'rabbit' | 'search' | 'mine' | 'at'
const DEEP: ReadonlySet<Via> = new Set<Via>(['related', 'around', 'box', 'trail', 'rabbit'])
const DEPTH_ROUND = 5
const TRAIL_MAX = 6

/** A quiet tint per era — tokens only, in fives (brand guard). */
function eraTint(decade: number | null): string {
  if (decade === null) return 'bg-sheet'
  if (decade < 1950) return 'bg-concrete/40'
  if (decade < 1980) return 'bg-concrete/20'
  if (decade < 1990) return 'bg-sign/10'
  if (decade < 2000) return 'bg-red/10'
  if (decade < 2010) return 'bg-sign/5'
  if (decade < 2020) return 'bg-red/5'
  return 'bg-sheet'
}

export function ArchiveApp({
  decks,
  todayHe,
  decades,
  seed,
  cursor,
  initial,
  atMissing,
  figures,
}: {
  decks: Record<TodayChip, ArchiveCard[]>
  todayHe: string
  decades: { decade: number; seasons: string[] }[]
  seed: number
  cursor: number
  initial: EntityDetail | null
  atMissing: boolean
  figures: string
}) {
  const firstChip = decks.today.length ? 'today' : 'know'
  const [chip, setChip] = useState<TodayChip | null>(firstChip)
  const [deck, setDeck] = useState<ArchiveCard[]>(decks[firstChip])
  const [context, setContext] = useState<string>(t('archive.context.today'))
  const [season, setSeason] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [more, setMore] = useState(false)

  const [detail, setDetail] = useState<EntityDetail | null>(initial)
  const [layer, setLayer] = useState<Layer>(null)
  const [trail, setTrail] = useState<{ id: string; title: string }[]>(initial ? [{ id: initial.card.id, title: cardTitle(initial.card) }] : [])
  const [depth, setDepth] = useState(0)
  const [rabbitEmpty, setRabbitEmpty] = useState(false)
  const [flash, setFlash] = useState<{ big: string; small?: string } | null>(null)

  const [mine, setMine] = useState<string[]>([])
  const [mineCards, setMineCards] = useState<ArchiveCard[]>([])
  const [reactions, setReactions] = useState<string[]>([])

  const [box, setBox] = useState<{ items: ArchiveCard[]; decade: number | null; round: number }>({ items: [], decade: null, round: 0 })
  const [busy, startBusy] = useTransition()

  // the device's own sets, read after mount — the server never knows them
  useEffect(() => {
    setMine(onIds('archive.mine'))
    setReactions(onIds('archive.react'))
  }, [])

  // an entry through `?at=` still counts as having looked at it
  const filed = useRef(false)
  useEffect(() => {
    if (!initial || filed.current) return
    filed.current = true
    emit({ type: 'collected', set: 'archive', ids: [initial.card.id], gate: '/archive' })
  }, [initial])

  const flashTimer = useRef<number | null>(null)
  const say = useCallback((big: string, small?: string) => {
    setFlash({ big, small })
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 1100)
  }, [])

  /* ------------------------------------------------------------ opening */

  const show = useCallback(
    (next: EntityDetail, via: Via) => {
      setDetail(next)
      setRabbitEmpty(false)
      setTrail((old) => {
        const without = old.filter((row) => row.id !== next.card.id)
        return [...without, { id: next.card.id, title: cardTitle(next.card) }].slice(-TRAIL_MAX)
      })
      if (DEEP.has(via)) setDepth((d) => d + 1)
      emit({ type: 'collected', set: 'archive', ids: [next.card.id], gate: '/archive' })
      telemetry('archive_item_opened', { type: next.card.type, via })
    },
    [],
  )

  const open = useCallback(
    (id: string, via: Via) => {
      haptic('tap')
      startBusy(async () => {
        const next = await openEntity(id)
        if (next) show(next, via)
      })
    },
    [show],
  )

  function dig() {
    if (!detail) return
    const from = detail.card.id
    startBusy(async () => {
      const next = await rabbit(from, seed, depth, trail.map((row) => row.id))
      telemetry('rabbit_hole_used', { found: next !== null })
      if (!next) {
        setRabbitEmpty(true)
        return
      }
      haptic('lock')
      say(t('archive.flash.rabbit'), cardTitle(next.card))
      show(next, 'rabbit')
    })
  }

  /* ------------------------------------------------------------ Mine and reactions */

  function toggleSave(card: ArchiveCard) {
    const on = !isOn('archive.mine', card.id)
    emit({ type: 'archive_saved', entityId: card.id, on })
    setMine(onIds('archive.mine'))
    haptic(on ? 'lock' : 'tap')
    say(on ? t('archive.flash.saved') : t('archive.flash.unsaved'), cardTitle(card))
  }

  function react(card: ArchiveCard, code: string) {
    const codes = REACTIONS[reactionSetOf(card.type)]
    const current = codes.find((c) => isOn('archive.react', `${c}:${card.id}`)) ?? null
    if (current) emit({ type: 'toggled', set: 'archive.react', id: `${current}:${card.id}`, on: false })
    if (current !== code) emit({ type: 'toggled', set: 'archive.react', id: `${code}:${card.id}`, on: true })
    setReactions(onIds('archive.react'))
    haptic('tap')
  }

  const reactionOf = (card: ArchiveCard) => REACTIONS[reactionSetOf(card.type)].find((c) => reactions.includes(`${c}:${card.id}`)) ?? null

  /* ------------------------------------------------------------ the deck */

  function pickChip(next: TodayChip) {
    setChip(next)
    setSeason(null)
    setDeck(decks[next])
    setIndex(0)
    setMore(false)
    setContext(t(`archive.chip.${next}` as MessageKey))
  }

  function step(dir: 1 | -1) {
    if (deck.length === 0) return
    setIndex((i) => (i + dir + deck.length) % deck.length)
    setMore(false)
  }

  const swipe = useRef<{ x: number; y: number } | null>(null)
  const trailRef = useRef<HTMLOListElement | null>(null)
  useEffect(() => {
    const list = trailRef.current
    const last = list?.lastElementChild
    // the newest stop in view — horizontally only, so the page never jumps
    if (list && last instanceof HTMLElement) {
      const box = list.getBoundingClientRect()
      const item = last.getBoundingClientRect()
      list.scrollBy({ left: item.left - box.left - 4 })
    }
  }, [trail])
  const current = deck.length ? deck[index % deck.length] ?? null : null

  /* ------------------------------------------------------------ the dock */

  function openBox(decade: number | null = box.decade, round = box.round) {
    setLayer('box')
    startBusy(async () => {
      const items = await digBox(seed, decade, round)
      setBox({ items, decade, round })
    })
  }

  function openMine() {
    setLayer('mine')
    const ids = onIds('archive.mine')
    setMine(ids)
    startBusy(async () => setMineCards(await describeIds(ids)))
  }

  function pickSeason(label: string) {
    setLayer(null)
    startBusy(async () => {
      const cards = await seasonDeck(label)
      setChip(null)
      setSeason(label)
      setDeck(cards)
      setIndex(0)
      setContext(t('archive.context.season', { label }))
      say(label, t('archive.flash.season'))
    })
  }

  const runSearch = useCallback((q: string, type: EntityType | null) => searchArchive(q, type), [])

  const tint = eraTint(current?.decade ?? null)
  const dockButtons: { id: Exclude<Layer, null> | 'today'; key: MessageKey; latin: string }[] = [
    { id: 'today', key: 'archive.dock.today', latin: 'TODAY' },
    { id: 'time', key: 'archive.dock.time', latin: 'TIME' },
    { id: 'box', key: 'archive.dock.dig', latin: 'DIG' },
    { id: 'search', key: 'archive.dock.search', latin: 'SEARCH' },
    { id: 'mine', key: 'archive.dock.mine', latin: 'MINE' },
  ]

  return (
    <div className="mt-3">
      {depth >= DEPTH_ROUND && <RecordRun gate="/archive" score={depth} />}

      {/* context line: where the deck came from, and Mine at a glance */}
      <div className="flex items-center justify-between gap-2 border-b-rule border-ink pb-1.5">
        <div className="min-w-0">
          <p className="font-latin text-[9px] font-bold tracking-[0.22em] text-sign" dir="ltr">
            LIVING ARCHIVE
          </p>
          <p className="truncate font-sign text-[15px] leading-tight text-ink">
            {context}
            {chip === 'today' && <span className="font-body text-[12px] text-muted"> · {todayHe}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={openMine}
          aria-label={t('archive.mine.count', { n: String(mine.length) })}
          className="flex min-h-tap shrink-0 items-center gap-1.5 border-rule border-ink bg-sheet px-3 font-body text-[13px] font-extrabold text-ink"
        >
          {t('archive.dock.mine')}
          <span className="bg-red px-1.5 font-mono text-[12px] tabular-nums text-paper">
            <Num>{mine.length}</Num>
          </span>
        </button>
      </div>

      {atMissing && <p className="mt-2 border-s-rule border-red ps-2 font-body text-[12.5px] text-ink">{t('archive.at.missing')}</p>}

      {/* the Today chips */}
      <div className="-mx-gutter mt-2 flex gap-1.5 overflow-x-auto px-gutter pb-1" role="group" aria-label={t('archive.chip.aria')}>
        {CHIPS.map((row) => (
          <button
            key={row}
            type="button"
            onClick={() => pickChip(row)}
            aria-pressed={chip === row}
            className={`min-h-tap shrink-0 border-rule px-3 font-body text-[13px] font-bold transition-transform duration-press active:scale-[.96] motion-reduce:transition-none ${
              chip === row ? 'border-red bg-red text-paper' : 'border-ink/40 bg-sheet text-ink'
            }`}
          >
            {t(`archive.chip.${row}` as MessageKey)}
          </button>
        ))}
        {season && (
          <button type="button" onClick={() => setLayer('time')} aria-pressed className="min-h-tap shrink-0 border-rule border-sign bg-sign px-3 font-mono text-[13px] tabular-nums text-paper">
            <Num>{season}</Num>
          </button>
        )}
      </div>

      {/* the trail and the depth */}
      <div className="mt-1.5 flex items-center gap-2">
        <ol ref={trailRef} className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1" aria-label={t('archive.trail.aria')}>
          {trail.map((row, i) => (
            <li key={row.id} className="flex shrink-0 items-center gap-1">
              {i > 0 && <span aria-hidden="true" className="text-red">‹</span>}
              <button
                type="button"
                onClick={() => open(row.id, 'trail')}
                className="min-h-tap max-w-[9.5rem] truncate border-hair border-ink/40 bg-paper px-2 font-body text-[12px] text-ink"
              >
                {row.title}
              </button>
            </li>
          ))}
          {trail.length === 0 && <li className="font-body text-[11.5px] text-muted">{t('archive.trail.title')}</li>}
        </ol>
        <p className="shrink-0 border-rule border-ink bg-ink px-2 py-1 font-body text-[11px] font-bold text-paper" aria-label={t('archive.depth.aria', { n: String(depth) })}>
          {t('archive.depth')} <span className="font-mono tabular-nums text-red"><Num>{depth}</Num></span>
        </p>
      </div>

      {/* the deck */}
      <section
        aria-roledescription="carousel"
        aria-label={t('archive.deck.aria')}
        className={`relative mt-2 border-rule border-ink px-3 pb-3 pt-3 transition-colors duration-peel motion-reduce:transition-none ${tint}`}
      >
        {flash && (
          <div aria-live="polite" className="pointer-events-none absolute inset-x-3 top-3 z-10 animate-stamp-in border-plate border-ink bg-ink px-3 py-2 text-center motion-reduce:animate-none">
            <p className="font-display text-step-1 leading-tight text-paper">{flash.big}</p>
            {flash.small && <p className="truncate font-body text-[12px] text-concrete">{flash.small}</p>}
          </div>
        )}

        {current ? (
          <>
            <article
              key={current.id}
              aria-label={t('archive.deck.position', { n: String((index % deck.length) + 1), total: String(deck.length) })}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') step(1)
                if (event.key === 'ArrowRight') step(-1)
              }}
              onPointerDown={(event) => {
                swipe.current = { x: event.clientX, y: event.clientY }
              }}
              onPointerUp={(event) => {
                const start = swipe.current
                swipe.current = null
                if (!start) return
                const dx = event.clientX - start.x
                if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(event.clientY - start.y)) step(dx < 0 ? 1 : -1)
              }}
              className="relative touch-pan-y select-none border-plate border-ink bg-sheet animate-paste-in motion-reduce:animate-none"
            >
              <div className="flex items-start gap-3 border-b-hair border-ink/30 px-3 pb-2 pt-3">
                <ArtifactMark card={current} className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-latin text-[9px] font-bold tracking-[0.22em] text-sign" dir="ltr">
                    {LATIN[current.type]}
                  </p>
                  <h2 className="mt-0.5 font-display text-step-2 leading-tight text-ink">
                    <CardHeadline card={current} />
                  </h2>
                  <Eyebrow card={current} className="mt-1" />
                </div>
              </div>
              <div className="px-3 py-2">
                {current.subHe && (
                  <button
                    type="button"
                    onClick={() => setMore((v) => !v)}
                    aria-expanded={more}
                    className="min-h-tap border-hair border-dashed border-ink/60 px-3 font-body text-[12.5px] font-bold text-ink"
                  >
                    {more ? t('archive.card.less') : t('archive.card.more')}
                  </button>
                )}
                {more && current.subHe && (
                  <p className="mt-1.5 border-s-rule border-red ps-2 font-body text-[13.5px] leading-snug text-ink">
                    <bdi>{current.subHe}</bdi>
                  </p>
                )}
                {current.disputed && <p className="mt-1.5 font-body text-[11.5px] text-muted">{t('archive.card.disputed')}</p>}
                <p className="mt-1.5 font-body text-[11.5px] text-muted">{t('archive.card.links', { n: String(current.degree) })}</p>
              </div>
              <div className="grid grid-cols-[1.4fr_1fr] gap-1.5 border-t-hair border-ink/30 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => open(current.id, 'deck')}
                  className="min-h-tap border-rule border-red bg-red px-2 font-body text-[14px] font-extrabold text-paper"
                >
                  {t('archive.card.open')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSave(current)}
                  aria-pressed={mine.includes(current.id)}
                  className={`min-h-tap border-rule px-2 font-body text-[14px] font-extrabold ${
                    mine.includes(current.id) ? 'border-ink bg-ink text-paper' : 'border-ink bg-paper text-ink'
                  }`}
                >
                  {mine.includes(current.id) ? `✓ ${t('archive.card.saved')}` : t('archive.card.save')}
                </button>
              </div>
            </article>

            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t('archive.deck.prev')}
                className="flex min-h-tap min-w-tap items-center justify-center border-rule border-ink bg-sheet font-poster text-[24px] leading-none text-ink"
              >
                ›
              </button>
              <p className="font-mono text-[12px] tabular-nums text-muted" aria-hidden="true">
                <Num>{`${(index % deck.length) + 1}/${deck.length}`}</Num>
              </p>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t('archive.deck.next')}
                className="flex min-h-tap min-w-tap items-center justify-center border-rule border-ink bg-sheet font-poster text-[24px] leading-none text-ink"
              >
                ‹
              </button>
            </div>
            <p className="sr-only">{t('archive.deck.swipe')}</p>
          </>
        ) : (
          <p className="border-hair border-ink/40 bg-paper px-3 py-3 font-body text-[13.5px] leading-relaxed text-ink">
            {chip === 'today' ? t('archive.today.none') : season ? t('archive.time.empty') : t('archive.chip.empty')}
          </p>
        )}
      </section>

      <p className="mt-stack border-t-hair border-ink/30 pt-2 font-body text-[11px] leading-relaxed text-muted">{figures}</p>
      <p className="mt-1 font-mono text-[10px] tabular-nums text-muted">
        <Num>{`#${seed}·${cursor}`}</Num>
      </p>

      {/* room for the dock */}
      <div aria-hidden="true" className="h-[76px]" />

      {/* the dock — above the tab bar, below every dialog */}
      <nav
        aria-label={t('archive.dock.aria')}
        className="fixed inset-x-0 bottom-[calc(var(--tap)+1.25rem+3px+env(safe-area-inset-bottom))] z-40 border-t-rule border-ink bg-sheet"
      >
        <ul className="mx-auto grid max-w-5xl grid-cols-5">
          {dockButtons.map((row) => {
            const active = row.id === 'today' ? layer === null && chip !== null : layer === row.id
            return (
              <li key={row.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (row.id === 'today') {
                      setLayer(null)
                      pickChip(chip ?? firstChip)
                    } else if (row.id === 'box') openBox()
                    else if (row.id === 'mine') openMine()
                    else setLayer(row.id)
                  }}
                  className={`flex min-h-tap w-full flex-col items-center justify-center gap-0.5 px-1 py-1.5 ${
                    row.id === 'box' ? 'bg-red text-paper' : active ? 'bg-ink text-paper' : 'text-ink'
                  }`}
                >
                  <span className="font-body text-[13px] font-extrabold leading-none">{t(row.key)}</span>
                  <span className={`font-latin text-[7px] font-bold leading-none tracking-[0.2em] ${row.id === 'box' || active ? 'text-paper' : 'text-sign'}`} dir="ltr">
                    {row.latin}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {layer === 'box' && (
        <ArchiveBox
          items={box.items}
          decades={decades.map((row) => row.decade)}
          decade={box.decade}
          busy={busy}
          onDecade={(d) => openBox(d, 0)}
          onShuffle={() => {
            say(t('archive.flash.shuffled'))
            openBox(box.decade, box.round + 1)
          }}
          onOpen={(id) => open(id, 'box')}
          onSearch={() => setLayer('search')}
          onClose={() => setLayer(null)}
        />
      )}
      {layer === 'time' && <TimeMachine decades={decades} current={season} onPick={pickSeason} onClose={() => setLayer(null)} />}
      {layer === 'search' && <SearchSheet run={runSearch} onOpen={(id) => open(id, 'search')} onClose={() => setLayer(null)} />}
      {layer === 'mine' && <MineSheet cards={mineCards} loading={busy && mineCards.length === 0 && mine.length > 0} onOpen={(id) => open(id, 'mine')} onClose={() => setLayer(null)} />}

      {detail && (
        <ArchiveDrawer
          detail={detail}
          saved={mine.includes(detail.card.id)}
          reaction={reactionOf(detail.card)}
          busy={busy}
          rabbitEmpty={rabbitEmpty}
          onClose={() => setDetail(null)}
          onOpen={(id, via) => open(id, via)}
          onSave={() => toggleSave(detail.card)}
          onReact={(code) => react(detail.card, code)}
          onRabbit={dig}
          onSearch={() => {
            setDetail(null)
            setLayer('search')
          }}
        />
      )}
    </div>
  )
}
