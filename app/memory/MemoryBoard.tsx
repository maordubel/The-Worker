'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ArchiveCard } from '@/components/memory/ArchiveCard'
import { FusionPlate } from '@/components/memory/FusionPlate'
import { PairThreads } from '@/components/memory/PairThreads'
import { SouvenirShelf } from '@/components/memory/SouvenirShelf'
import { LampGrid, Mast } from '@/components/ui/LampGrid'
import { Num } from '@/components/ui/Num'
import { PlayLink } from '@/components/play/PlayLink'
import { RecordRun } from '@/components/play/RecordRun'
import { ShareRow } from '@/components/share/ShareRow'
import { artFor } from '@/lib/share/story'
import { collect, collected, readProfile } from '@/lib/profile/store'
import { t, type MessageKey } from '@/lib/i18n'
import type { MemoryPair, MemoryRound } from '@/lib/game/memory'
import type { Embedded } from '@/lib/mechanics/types'
import {
  ECHO_MS,
  ECHO_STREAK,
  FLASH_MS,
  RE_FLASH_MS,
  closeOpen,
  countdownAt,
  echoMate,
  finished,
  flip,
  morale,
  numericFace,
  spendEcho,
  spendFlash,
  startRun,
  verdict,
  wallLit,
  type MemoryVerdict,
} from '@/lib/game/memory-run'

/** the collection every closed pair is filed into, shared with the personal area */
const SHELF = 'memory'

/** the wall is four across — the grid below and the threads over it read the same number */
const COLS = 4

/**
 * The four closing lines, each written out in full.
 *
 * A key built from the verdict in a template literal would work and would be invisible to
 * `tests/i18n.test.ts`, which can only resolve a literal — rule 71's lesson, in its
 * cheapest form: a `Record` typed against the union costs one object and makes every key
 * both checkable and greppable.
 */
const VERDICT: Record<MemoryVerdict, MessageKey> = {
  flawless: 'memory.verdict.flawless',
  sharp: 'memory.verdict.sharp',
  solid: 'memory.verdict.solid',
  lit: 'memory.verdict.lit',
}

/**
 * שער 6 — קיר הזיכרון.
 *
 * The board that was here matched pairs and counted moves, and both of those are still
 * the spine. What it did not have is the thing the prototype is actually about: a wall
 * that is LIT for a moment and then goes dark, a pair that becomes a memory instead of
 * disappearing, and a shelf that fills. Four mechanics carry that, and each one is a
 * rule rather than an effect — `lib/game/memory-run.ts` owns all four and is tested on
 * its own, because "the echo fires on the third pair and only once" is not a thing a
 * screenshot can check.
 *
 *  · **MEMORY FLASH.** The wall opens for three seconds before the first move, and once
 *    more on demand. It is gameplay, so it may take time (the brief's own line: time is
 *    allowed when time is the mechanic) — and it is skippable with a tap, because a
 *    player who has already photographed it should not be made to sit through the rest.
 *  · **PAIR FUSION.** `FusionPlate` — see its own note.
 *  · **MEMORY ECHO.** Three pairs in a row arms one hint; the next card you open makes
 *    its partner blink. It never opens a card, never removes one, and is spent whether
 *    or not it helped — a hint you can bank is a hint the game is played around.
 *  · **מוראל.** Pairs closed over pairs dealt. Past half the wall is lit: the lamp grid
 *    fills, the frame takes the vermilion, and the mast under it comes on. It is a
 *    fraction of a count and nothing else, which is what makes it printable — this gate
 *    grades nobody (rule 24's line about the wings), so the only mood on screen is the
 *    board's own.
 *
 * **The shelf outlives the run.** A closed pair is filed into the profile's collections
 * under `memory`, the same store the Ussishkin cards use, so the personal area can count
 * memories without this gate inventing a second place to keep them (rule 1). Ids are
 * archive keys (`trophy:state-cup:1998/99`), so the same memory found twice is one
 * memory — `collect()` is idempotent by design.
 */
export function MemoryBoard({
  round,
  seed,
  cursor = 0,
  embedded,
}: {
  round: MemoryRound
  seed: number
  cursor?: number
  /**
   * Opened from inside THE WORKER LIFE — the old fan at the bus stop remembers. The same wall
   * and the same four verdicts; nothing is filed on the shelf, nothing is recorded or shared,
   * and the verdict goes back to the room.
   */
  embedded?: Omit<Embedded<MemoryVerdict>, 'window'>
}) {
  const { cards, pairs } = round
  const total = pairs.length

  const [run, setRun] = useState(startRun)
  /** 'idle' before the wall has ever been lit, then the two flashes and play */
  const [phase, setPhase] = useState<'idle' | 'flash' | 'play'>('idle')
  const [wrong, setWrong] = useState<string[]>([])
  const [echoOn, setEchoOn] = useState<string | null>(null)
  const [fused, setFused] = useState<{ pair: MemoryPair; perfect: boolean } | null>(null)
  const [hint, setHint] = useState<MessageKey>('memory.hint.start')
  const [streakShown, setStreakShown] = useState(0)
  const [kept, setKept] = useState<number | null>(null)
  /** the pair just locked — the v3 "MEMORY LOCKED" panel, folded into the hint line */
  const [lockedPair, setLockedPair] = useState<MemoryPair | null>(null)
  /** 3·2·1 on the flash strip; null when no flash is running */
  const [count, setCount] = useState<number | null>(null)

  const byId = useMemo(() => new Map(pairs.map((pair) => [pair.id, pair] as const)), [pairs])
  const timers = useRef<number[]>([])

  /** every timer this screen starts is parked here, so leaving mid-beat cancels all of them */
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(
    () => () => {
      for (const id of timers.current) {
        window.clearTimeout(id)
        window.clearInterval(id)
      }
      timers.current = []
    },
    [],
  )

  // The shelf's across-runs count is read after mount, never during render: the server
  // has no browser storage and reading it in a render is how a hydration mismatch is born.
  useEffect(() => {
    if (embedded) return
    setKept(collected(readProfile(), SHELF).length)
  }, [embedded])

  const done = finished(run, total)
  const lit = wallLit(run, total)
  const flashing = phase === 'flash'

  /** the countdown ticks with the beat and stops with it, however the beat ends */
  function countDown(ms: number) {
    const opened = Date.now()
    setCount(countdownAt(0, ms))
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - opened
      if (elapsed >= ms) {
        window.clearInterval(tick)
        return
      }
      setCount(countdownAt(elapsed, ms))
    }, 200)
    timers.current.push(tick)
  }

  function lightTheWall() {
    setPhase('flash')
    setHint('memory.hint.photograph')
    countDown(FLASH_MS)
    later(() => {
      setPhase('play')
      setCount(null)
      setHint('memory.hint.find')
    }, FLASH_MS)
  }

  function endFlash() {
    if (phase !== 'flash') return
    for (const id of timers.current) {
      window.clearTimeout(id)
      window.clearInterval(id)
    }
    timers.current = []
    setPhase('play')
    setCount(null)
    setHint('memory.hint.find')
  }

  function extraFlash() {
    if (run.flashUsed || phase !== 'play' || done) return
    setRun(spendFlash)
    setPhase('flash')
    setHint('memory.hint.photograph')
    countDown(RE_FLASH_MS)
    later(() => {
      setPhase('play')
      setCount(null)
      setHint('memory.hint.find')
    }, RE_FLASH_MS)
  }

  function onFlip(id: string) {
    if (phase !== 'play' || fused !== null) return

    // The echo is read against the run BEFORE the flip, because the card being opened is
    // the one that points at its partner — and it is spent whether or not the partner
    // turned out to be useful.
    const mate = echoMate(run, cards, id)

    const outcome = flip(run, cards, id)
    if (outcome.kind === 'ignored') return
    setRun(mate === null ? outcome.run : spendEcho(outcome.run))

    if (mate !== null) {
      setEchoOn(mate)
      setHint('memory.hint.echo')
      later(() => setEchoOn(null), ECHO_MS)
    }

    if (outcome.kind === 'pair') {
      const pair = byId.get(outcome.pair)
      if (pair) setFused({ pair, perfect: outcome.perfect })
      setLockedPair(pair ?? null)
      setStreakShown(outcome.run.streak)
      setHint(outcome.run.streak >= 2 ? 'memory.hint.hot' : 'memory.hint.locked')
      if (!embedded) {
        collect(SHELF, [outcome.pair])
        setKept(collected(readProfile(), SHELF).length)
      }
      return
    }

    if (outcome.kind === 'miss') {
      setLockedPair(null)
      setWrong(outcome.run.open)
      setHint('memory.hint.wrong')
      later(() => {
        setWrong([])
        setRun(closeOpen)
        setHint('memory.hint.remember')
      }, 820)
    }
  }

  const found = run.done.length
  const percent = Math.round(morale(run, total) * 100)

  return (
    <>
      {/* the scoreboard — what you have found, what it cost, and how hot the wall is */}
      <div className="mt-stack border-rule border-sheet/45 bg-sheet/[.06] p-3">
        <div className="flex items-end justify-between gap-3">
          <dl className="flex items-end gap-4">
            <div>
              <dt className="font-body text-[8.5px] font-extrabold tracking-[0.18em] text-concrete">
                {t('memory.pairs')}
              </dt>
              <dd className="font-poster text-[30px] leading-none text-sheet">
                <Num>{`${found}/${total}`}</Num>
              </dd>
            </div>
            <div>
              <dt className="font-body text-[8.5px] font-extrabold tracking-[0.18em] text-concrete">
                {t('memory.moves')}
              </dt>
              <dd className="font-poster text-[22px] leading-none text-sheet">
                <Num>{String(run.moves)}</Num>
              </dd>
            </div>
            <div>
              <dt className="font-body text-[8.5px] font-extrabold tracking-[0.18em] text-concrete">
                {t('memory.misses')}
              </dt>
              <dd className="font-poster text-[22px] leading-none text-sheet">
                <Num>{String(run.misses)}</Num>
              </dd>
            </div>
          </dl>

          {/* מוראל — every number that can be shown as lamps is shown as lamps */}
          <div className="w-[112px] shrink-0 text-end">
            <LampGrid
              total={total}
              on={found}
              cols={total}
              night
              glow={lit}
              label={t('memory.morale.aria', { n: String(percent) })}
            />
            <p className="mt-1 font-mono text-[10px] tabular-nums text-concrete">
              <Num>{`${percent}%`}</Num>
            </p>
          </div>
        </div>
      </div>

      {phase === 'idle' && (
        <ul className="mt-2 grid gap-1.5 min-[480px]:grid-cols-3" aria-label={t('memory.intro.aria')}>
          {(
            [
              ['MEMORY FLASH', 'memory.intro.flash'],
              ['ARCHIVE OBJECTS', 'memory.intro.objects'],
              ['MEMORY ECHO', 'memory.intro.echo'],
            ] as const
          ).map(([latin, key]) => (
            <li key={key} className="border-hair border-sheet/35 bg-sheet/[.06] px-2.5 py-2">
              <p className="font-latin text-[9px] font-bold tracking-[0.18em] text-red" dir="ltr">
                {latin}
              </p>
              <p className="mt-0.5 font-body text-[12px] leading-snug text-concrete">{t(key)}</p>
            </li>
          ))}
        </ul>
      )}

      <p aria-live="polite" className="mt-2 font-body text-step--1 text-concrete">
        {hint === 'memory.hint.hot' ? t('memory.hint.hot', { n: String(streakShown) }) : t(hint)}
        {lockedPair && (hint === 'memory.hint.locked' || hint === 'memory.hint.hot') && (
          <span className="block font-sign text-[13px] font-bold text-sheet">
            {t('memory.hint.lockedFact')}{' '}
            {numericFace(lockedPair.a) ? <Num>{lockedPair.a}</Num> : lockedPair.a}
            {' · '}
            {numericFace(lockedPair.b) ? <Num>{lockedPair.b}</Num> : lockedPair.b}
          </span>
        )}
      </p>

      <div className="mt-2 flex justify-center">
        <div className="w-full max-w-[420px]">
          <div
            className={`relative grid grid-cols-4 gap-1.5 border-plate p-1.5 transition-colors duration-plate motion-reduce:transition-none ${
              lit ? 'border-red bg-red/10' : 'border-sheet/50'
            }`}
            style={{ transform: 'rotate(-1.5deg)' }}
          >
            {cards.map((card) => (
              <ArchiveCard
                key={card.id}
                card={card}
                open={run.open.includes(card.id)}
                done={run.done.includes(card.pair)}
                wrong={wrong.includes(card.id)}
                echo={echoOn === card.id}
                flashing={flashing}
                onFlip={onFlip}
              />
            ))}
            <PairThreads cards={cards} done={run.done} cols={COLS} />
          </div>
          <Mast height={56} night />
        </div>
      </div>

      {/* the two run tools: the second flash, and the echo's own state */}
      <div className="mt-stack grid gap-2 sm:grid-cols-2">
        {phase === 'idle' ? (
          <button
            type="button"
            onClick={lightTheWall}
            className="flex min-h-tap items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-paper transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none"
          >
            {t('memory.flash.cta')}
          </button>
        ) : (
          <button
            type="button"
            onClick={extraFlash}
            disabled={run.flashUsed || flashing || done}
            className={`flex min-h-tap items-center justify-center border-rule px-4 font-body text-[15px] font-extrabold transition-transform duration-press ease-stamp active:scale-[.98] disabled:active:scale-100 motion-reduce:transition-none ${
              run.flashUsed || flashing || done
                ? 'border-sheet/30 text-sheet/40'
                : 'border-sheet bg-sheet/[.08] text-sheet'
            }`}
          >
            {run.flashUsed ? t('memory.flash.spent') : t('memory.flash.again')}
          </button>
        )}

        <div
          className={`border-hair p-2.5 ${
            run.echo === 'armed' ? 'border-red bg-red/15' : 'border-sheet/30'
          }`}
        >
          <p className="font-body text-[9px] font-extrabold tracking-[0.18em] text-red">
            {t('memory.echo.title')}
          </p>
          <p className="mt-0.5 font-body text-[11.5px] leading-snug text-concrete">
            {run.echo === 'armed'
              ? t('memory.echo.armed')
              : run.echo === 'spent'
                ? t('memory.echo.spent')
                : t('memory.echo.idle', { n: String(ECHO_STREAK) })}
          </p>
        </div>
      </div>

      {!embedded && <SouvenirShelf pairs={pairs} done={run.done} kept={kept} />}

      {fused && (
        <FusionPlate
          pair={fused.pair}
          perfect={fused.perfect}
          onDone={() => setFused(null)}
        />
      )}

      {done && (
        <section className="mt-stack border-rule border-sheet bg-sheet p-4">
          <p className="font-body text-[9px] font-extrabold tracking-[0.2em] text-red">
            {t('memory.mural')}
          </p>
          <h2 className="mt-1 font-display text-step-2 leading-tight text-ink">
            {t(VERDICT[verdict(run, total)])}
          </h2>
          {embedded && (
            <button
              type="button"
              onClick={() => embedded.onResult(verdict(run, total))}
              data-memory="back"
              className="mt-3 flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-0 font-extrabold text-paper"
            >
              {embedded.doneLabel}
            </button>
          )}

          <dl className="mt-3 flex items-end gap-5 border-y-hair border-ink/25 py-2">
            {(
              [
                ['memory.moves', String(run.moves)],
                ['memory.misses', String(run.misses)],
                ['memory.bestStreak', String(run.bestStreak)],
              ] as const
            ).map(([key, value]) => (
              <div key={key}>
                <dt className="font-body text-[8.5px] font-extrabold tracking-[0.16em] text-muted">
                  {t(key)}
                </dt>
                <dd className="font-poster text-[26px] leading-none text-ink">
                  <Num>{value}</Num>
                </dd>
              </div>
            ))}
          </dl>

          {/* the mural — every memory the board held, printed together */}
          <ol className="mt-3">
            {pairs.map((pair) => (
              <li
                key={pair.id}
                className="flex flex-wrap items-baseline gap-x-2 border-b-hair border-ink/20 py-1.5"
              >
                <span className="min-w-0 flex-1 truncate font-sign text-[14px] font-bold text-ink">
                  {numericFace(pair.a) ? <Num>{pair.a}</Num> : pair.a}
                </span>
                <span
                  aria-hidden="true"
                  className="-translate-y-[3px] min-w-[10px] flex-1 border-b border-dotted border-ink/30"
                />
                <span className="shrink-0 font-sign text-[13px] font-bold text-red">
                  {numericFace(pair.b) ? <Num>{pair.b}</Num> : pair.b}
                </span>
                {/* v3: the mural says what KIND of memory each one is */}
                <span className="w-full basis-full font-body text-[11px] leading-tight text-muted">{pair.kind}</span>
              </li>
            ))}
          </ol>

          {!embedded && (
            <>
          <RecordRun gate="/memory" score={run.bestStreak} correct={total} asked={run.moves} />
          <ShareRow
            kind="memory"
            params={{ s: String(seed), r: String(cursor) }}
            headline={String(run.moves)}
            card={{
              template: 'ink' as const,
              art: artFor('memory', run.misses === 0 ? 1 : 0),
              kicker: 'GATE 6 · MEMORY WALL',
              label: t('screen.memory.title'),
              eyebrow: t('memory.pairs'),
              hero: `${total}/${total}`,
              bigStat: { v: String(run.moves), k: t('memory.moves') },
              stats: [
                { k: t('memory.misses'), v: String(run.misses) },
                { k: t('memory.bestStreak'), v: String(run.bestStreak) },
              ],
              cta: t('share.challenge'),
              challenge: t('share.sameRound'),
            }}
          />
          <PlayLink
            gate="/memory"
            className="mt-3 flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-paper"
          >
            {t('run.again')}
          </PlayLink>
            </>
          )}
        </section>
      )}

      {/*
        MEMORY FLASH — the wall is lit and the strip says so.

        Deliberately NOT a full-screen scrim, which is what the reference uses: the whole
        content of this beat is the twelve faces, and an overlay over them would hide the
        one thing the player is here to photograph. So the strip sits at the foot, above
        the tab bar, and is itself the skip control — one tap ends the beat now.
      */}
      {flashing && (
        <button
          type="button"
          onClick={endFlash}
          className="fixed inset-x-0 bottom-0 z-[60] flex min-h-tap animate-slam items-center justify-between gap-3 border-t-plate border-red bg-ink px-gutter pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 text-start"
        >
          <span className="min-w-0">
            <span className="block font-display text-step-1 leading-none text-sheet">
              {t('memory.flash.title')}
              {count !== null && (
                <span className="ms-2 font-poster text-[26px] leading-none text-red" aria-live="polite">
                  {t('memory.flash.count', { n: String(count) })}
                </span>
              )}
            </span>
            <span className="mt-0.5 block font-body text-[11px] leading-snug text-concrete">
              {t('memory.flash.skip')}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 border-rule border-sheet px-2.5 py-1 font-latin text-[9px] font-bold tracking-[0.16em] text-sheet"
          >
            FLASH
          </span>
        </button>
      )}
    </>
  )
}
