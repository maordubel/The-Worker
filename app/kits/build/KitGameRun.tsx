'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { RealShirtAsk, RealShirtPending } from '@/components/collector/RealShirtAsk'
import { KitMarkArt } from '@/components/kit/KitEngineShirt'
import { KitShirt } from '@/components/kit/KitShirt'
import { PlayLink } from '@/components/play/PlayLink'
import { RecordRun } from '@/components/play/RecordRun'
import { ShareRow } from '@/components/share/ShareRow'
import { FitBox } from '@/components/stage/FitBox'
import { firePickFxAt } from '@/components/stage/PickFx'
import { SlideSheet } from '@/components/stage/SlideSheet'
import { dropZone, useDragSource } from '@/components/stage/useDrag'
import { Num } from '@/components/ui/Num'
import { SourceNote } from '@/components/ui/SourceNote'
import { useDialog } from '@/components/ui/useDialog'
import {
  HINT_KINDS,
  KIT_HINT_PENALTY,
  KIT_ROUND,
  STEP_ORDER,
  type KitHintAnswer,
  type KitHintKind,
  type KitOption,
  type KitPuzzle,
  type KitStep,
  type KitVerdict,
  type StepVerdict,
} from '@/lib/game/kit-build-run'
import { t, type MessageKey } from '@/lib/i18n'
import { activeCollection } from '@/lib/kit/collection'
import type { KitMarksRegime } from '@/lib/kit/engine'
import type { KitSpec } from '@/lib/kit/spec'
import type { Embedded } from '@/lib/mechanics/types'
import { haptic } from '@/lib/play/haptics'

import { askKitHint, submitKit } from './actions'

/**
 * שער 4 — חידון המדים. Maor's V14 layout on the one engine and the server deal.
 *
 * ONE SCREEN THE HEIGHT OF THE PHONE: the season, the five steps, the question, a big shirt and a
 * row of cards. A tap places a part and — with the automatic advance on — moves to the next step
 * after 150ms; the advance is one tap to switch off, and every step stays tappable. After the
 * fifth part the round does NOT reveal itself: it lands on a review of the whole shirt with
 * **בדוק את החולצה**, because changing your mind about the sleeves after the sponsor told you the
 * era IS the game (rule 24). Nothing on this screen knows which card is right (rule 4).
 *
 * Every card has a visible ⓘ and a long-press for the same sheet: a keyboard user and a thumb both
 * reach the information, and it never names a year.
 */

type Placed = Partial<Record<KitStep, string>>
const REVIEW = STEP_ORDER.length
const LONG_PRESS_MS = 480
const ADVANCE_MS = 150

function variantLabel(variant: KitSpec['variant']): string {
  return t(`kits.facet.${variant}` as MessageKey)
}

function stepLabel(step: KitStep): string {
  return t(`kitgame.step.${step}` as MessageKey)
}

function optionsOf(puzzle: KitPuzzle, step: KitStep): KitOption[] {
  return puzzle.steps.find((row) => row.step === step)?.options ?? []
}

function chosenOf(puzzle: KitPuzzle, placed: Placed, step: KitStep): KitOption | null {
  const id = placed[step]
  return id ? optionsOf(puzzle, step).find((option) => option.id === id) ?? null : null
}

function shirtOf(puzzle: KitPuzzle, placed: Placed, extra?: Partial<KitSpec>): KitSpec {
  let spec: KitSpec = { ...puzzle.blank }
  for (const step of STEP_ORDER) {
    const option = chosenOf(puzzle, placed, step)
    if (option) spec = { ...spec, ...option.patch }
  }
  if (extra) spec = { ...spec, ...extra }
  // Until the construction is chosen the cloth is ONE cloth: the sleeves and the collar take the
  // body's colour. A white collar on a red body would be a construction answer nobody gave.
  if (!placed.construction && !extra?.sleeveInk) spec = { ...spec, sleeveInk: spec.base, collarInk: spec.base }
  return spec
}

function nextOpen(placed: Placed, from: number): number {
  for (let i = from + 1; i < STEP_ORDER.length; i += 1) if (!placed[STEP_ORDER[i]!]) return i
  for (let i = 0; i <= from && i < STEP_ORDER.length; i += 1) if (!placed[STEP_ORDER[i]!]) return i
  return REVIEW
}

/**
 * `embedded` — the same round opened from inside THE WORKER LIFE (the shop on Allenby wants a
 * shirt of a season before the life's year). The server deals and grades with the life's
 * window; the board keeps no collection, prints the rule-25 marks (the real-logo grant is
 * this gate's and the wing's only — owner, 21.9.2026) and hands the verdict back.
 */
export type KitEmbedded = Omit<Embedded<KitVerdict>, 'window'> & {
  window: { before: number; pin?: string | null; options?: number }
}

export function KitGameRun({
  puzzles,
  seed,
  cursor = 0,
  embedded,
  exactKits,
}: {
  puzzles: KitPuzzle[]
  seed: number
  cursor?: number
  embedded?: KitEmbedded
  /**
   * archive slug → Kit Master id for the shirts with an exact photograph, for the closet question on
   * the reveal (spec §42). Real ownership only — it never writes, or reads, the game's collection.
   */
  exactKits?: Record<string, string>
}) {
  const store = useMemo(() => activeCollection(), [])
  const marks: KitMarksRegime = embedded ? 'rule25' : 'granted'
  const lifeWindow = embedded?.window
  const [index, setIndex] = useState(0)
  const [placed, setPlaced] = useState<Placed>({})
  const [active, setActive] = useState(0)
  const [history, setHistory] = useState<{ placed: Placed; active: number }[]>([])
  const [auto, setAuto] = useState(true)
  const [hints, setHints] = useState<KitHintAnswer[]>([])
  const [hintsOpen, setHintsOpen] = useState(false)
  const [info, setInfo] = useState<KitOption | null>(null)
  const [busy, setBusy] = useState(false)
  const [verdict, setVerdict] = useState<KitVerdict | null>(null)
  const [log, setLog] = useState<KitVerdict[]>([])
  const [finished, setFinished] = useState(false)
  const timer = useRef<number | null>(null)
  const shirtRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])

  const puzzle = puzzles[index]
  if (finished || !puzzle) return <RoundSummary log={log} seed={seed} cursor={cursor} />

  const complete = STEP_ORDER.every((step) => Boolean(placed[step]))
  const reviewing = active === REVIEW
  const step = STEP_ORDER[Math.min(active, STEP_ORDER.length - 1)]!
  const options = optionsOf(puzzle, step)
  const shirt = shirtOf(puzzle, placed)
  const total = log.reduce((sum, row) => sum + row.score, 0)

  function remember() {
    setHistory((rows) => [...rows.slice(-19), { placed, active }])
  }

  function pick(option: KitOption) {
    if (busy || verdict) return
    remember()
    const next = { ...placed, [step]: option.id }
    setPlaced(next)
    firePickFxAt(shirtRef.current, { label: option.labelHe, tone: 'red' })
    if (timer.current) window.clearTimeout(timer.current)
    if (!auto) return
    const target = nextOpen(next, active)
    timer.current = window.setTimeout(() => setActive(target), ADVANCE_MS)
  }

  function goTo(target: number) {
    if (timer.current) window.clearTimeout(timer.current)
    setActive(target)
  }

  function undo() {
    const previous = history.at(-1)
    if (!previous || verdict) return
    if (timer.current) window.clearTimeout(timer.current)
    setPlaced(previous.placed)
    setActive(previous.active)
    setHistory((rows) => rows.slice(0, -1))
    haptic('tap')
  }

  function reset() {
    if (verdict) return
    if (timer.current) window.clearTimeout(timer.current)
    remember()
    setPlaced({})
    setActive(0)
    haptic('tap')
  }

  async function hint(kind: KitHintKind) {
    if (busy || hints.some((row) => row.kind === kind)) return
    setBusy(true)
    const answer = await askKitHint(seed, index, kind, cursor, lifeWindow)
    setBusy(false)
    if (answer) {
      setHints((rows) => [...rows, answer])
      haptic('lock')
    }
  }

  async function check() {
    if (!complete || busy || !puzzle) return
    setBusy(true)
    const answer = await submitKit(seed, index, placed, cursor, hints.map((row) => row.receipt), hints.length, lifeWindow)
    setBusy(false)
    if (!answer) return
    setVerdict(answer)
    setLog((rows) => [...rows, answer])
    haptic(answer.perfect ? 'lock' : answer.right >= 3 ? 'tap' : 'miss')
    // a shirt built for the shop is the shop's — the collection is the gate's own record
    if (embedded) return
    void store.record({
      seasonLabel: answer.seasonLabel,
      variant: answer.variant,
      parts: answer.right,
      score: answer.score,
      hintsUsed: answer.hintsUsed,
      token: answer.unlock.token,
      dna: answer.unlock.dna,
    })
  }

  function next() {
    if (embedded && verdict) {
      embedded.onResult(verdict)
      return
    }
    if (index + 1 >= puzzles.length) {
      setVerdict(null)
      setFinished(true)
      return
    }
    setIndex((value) => value + 1)
    setPlaced({})
    setActive(0)
    setHistory([])
    setHints([])
    setVerdict(null)
  }

  return (
    <div
      data-kit-run=""
      className={`mx-auto flex ${embedded ? 'h-[calc(100dvh-8.5rem)] min-h-[520px]' : 'min-h-0 flex-1'} w-full max-w-[460px] flex-col gap-1 overflow-hidden bg-paper px-3 pb-[max(6px,env(safe-area-inset-bottom))] pt-[max(4px,env(safe-area-inset-top))] md:h-auto md:flex-none md:py-3`}
    >
      {/* HUD strip — season, the five steps, the score, one thin line (delta 87) */}
      <div className="flex shrink-0 items-center gap-2 border-b-rule border-ink pb-1">
        {!embedded && (
          <a
            href="/"
            aria-label={t('kitgame.exit')}
            className="flex min-h-tap min-w-tap shrink-0 items-center justify-center font-body text-[18px] font-black text-ink"
          >
            <span aria-hidden="true">✕</span>
          </a>
        )}
        <p className="min-w-0 flex-1 truncate font-display text-[clamp(14px,4.4vw,18px)] leading-none text-ink">
          <Num>{puzzle.seasonLabel}</Num> · {variantLabel(puzzle.variant)}
        </p>
        <ol className="flex shrink-0 items-center gap-[3px]" aria-label={t('kitgame.kicker')}>
          {STEP_ORDER.map((row, i) => {
            const done = Boolean(placed[row])
            const current = i === active
            return (
              <li key={row}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  disabled={Boolean(verdict)}
                  aria-current={current ? 'step' : undefined}
                  aria-label={t('kitgame.stepAria', { n: String(i + 1), step: stepLabel(row) })}
                  className="block h-[10px] min-h-0 w-[10px] p-0"
                >
                  <span className={`block h-full w-full ${current ? 'bg-red' : done ? 'bg-ink' : 'bg-ink/20'}`} />
                </button>
              </li>
            )
          })}
        </ol>
        {log.length > 0 && (
          <p className="shrink-0 font-poster text-[18px] leading-none text-red" dir="ltr">
            <Num>{String(total)}</Num>
          </p>
        )}
      </div>
      <p className="shrink-0 text-center font-body text-[10.5px] font-bold text-muted">
        {embedded ? null : <Num>{t('kitgame.shirtOf', { n: String(index + 1), total: String(puzzles.length) })}</Num>}
        {embedded ? null : ' · '}
        <Num>{`${Math.min(active + 1, STEP_ORDER.length)}/${STEP_ORDER.length}`}</Num>
      </p>

      <h2 className="shrink-0 text-center font-display text-[clamp(16px,4.8vw,22px)] leading-none text-red">
        {reviewing ? t('kitgame.ask.review') : t(`kitgame.ask.${step}` as MessageKey)}
      </h2>

      {/* the shirt — as big as the glass allows, and the drop zone every rail item targets */}
      <FitBox ratio={0.84} className="min-h-0">
        <div ref={shirtRef} {...dropZone('shirt')} className="relative flex h-full w-full items-center justify-center">
          <span
            key={JSON.stringify(shirt)}
            className="flex h-full w-full animate-fx-pop items-center justify-center motion-reduce:animate-none"
          >
            <KitShirt spec={shirt} look={puzzle.look} marks={marks} className="h-full max-w-full" title={puzzle.seasonLabel} />
          </span>
        </div>
      </FitBox>

      {reviewing ? (
        <ReviewPanel puzzle={puzzle} placed={placed} onEdit={goTo} onCheck={() => void check()} busy={busy} complete={complete} />
      ) : (
        <section aria-label={t('kitgame.pick', { step: stepLabel(step) })} className="shrink-0">
          <p className="mb-1 text-center font-body text-[10.5px] font-bold text-muted">{t('stage.dragHint')}</p>
          <ul className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {options.map((option) => (
              <li key={option.id} className="w-[74px] shrink-0">
                <RailOption
                  step={step}
                  option={option}
                  preview={shirtOf(puzzle, placed, option.patch)}
                  look={puzzle.look}
                  marks={marks}
                  selected={placed[step] === option.id}
                  onDrop={() => pick(option)}
                  onInfo={() => setInfo(option)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer data-kit-footer="" className="grid grid-cols-4 border-t-hair border-ink/30">
        <button type="button" onClick={undo} disabled={history.length === 0 || Boolean(verdict)} className="min-h-tap font-body text-[12px] font-extrabold text-ink disabled:opacity-35">
          ↶ {t('kitgame.undo')}
        </button>
        <button type="button" onClick={reset} disabled={Boolean(verdict)} className="min-h-tap font-body text-[12px] font-extrabold text-ink disabled:opacity-35">
          {t('kitgame.reset')}
        </button>
        <button
          type="button"
          onClick={() => setAuto((value) => !value)}
          aria-pressed={auto}
          className={`min-h-tap font-body text-[12px] font-extrabold ${auto ? 'bg-ink text-paper' : 'text-ink'}`}
        >
          {t('kitgame.auto')}
        </button>
        <button type="button" onClick={() => setHintsOpen(true)} className="min-h-tap font-body text-[12px] font-extrabold text-ink">
          {t('kitgame.hint.open')}
          {hints.length > 0 && <span className="ms-1 text-red"><Num>{`−${hints.length * KIT_HINT_PENALTY}`}</Num></span>}
        </button>
      </footer>

      {info && <InfoSheet option={info} onClose={() => setInfo(null)} />}
      {hintsOpen && <HintSheet hints={hints} busy={busy} onAsk={(kind) => void hint(kind)} onClose={() => setHintsOpen(false)} />}
      {verdict && (
        <RevealSheet
          verdict={verdict}
          mine={shirt}
          onNext={next}
          last={index + 1 >= puzzles.length}
          marks={marks}
          doneLabel={embedded?.doneLabel}
          real={embedded ? null : realShirtOf(verdict, exactKits)}
        />
      )}
    </div>
  )
}

/**
 * The archive shirt behind a checked verdict: its exact photograph's slug and the Kit Master id.
 * Only an EXACT photograph — a candidate is a guess at a season, and a closet does not file guesses.
 */
function realShirtOf(verdict: KitVerdict, exactKits: Record<string, string> | undefined): { slug: string; kitId: string } | null {
  if (verdict.evidence.kind !== 'exact' || !exactKits) return null
  const file = verdict.evidence.photos[0]?.src.split('/').pop() ?? ''
  const slug = file.replace(/\.webp$/, '')
  const kitId = exactKits[slug]
  return kitId ? { slug, kitId } : null
}

/* ------------------------------------------------------------------ one rail item — drag it onto the shirt, or tap it */
function RailOption({
  step,
  option,
  preview,
  look,
  marks,
  selected,
  onDrop,
  onInfo,
}: {
  step: KitStep
  option: KitOption
  preview: KitSpec
  look: KitPuzzle['look']
  marks: KitMarksRegime
  selected: boolean
  onDrop: () => void
  onInfo: () => void
}) {
  const hold = useRef<number | null>(null)
  const held = useRef(false)
  const drag = useDragSource({ payload: option.id, axis: 'up', onDrop })

  function start() {
    held.current = false
    if (hold.current) window.clearTimeout(hold.current)
    hold.current = window.setTimeout(() => {
      held.current = true
      haptic('tap')
      onInfo()
    }, LONG_PRESS_MS)
  }
  function stop() {
    if (hold.current) window.clearTimeout(hold.current)
    hold.current = null
  }

  return (
    <div className={`relative h-[92px] border-hair ${selected ? 'border-plate border-red bg-sheet' : 'border-ink/35 bg-sheet'}`}>
      <button
        type="button"
        {...drag}
        onPointerDown={(event) => {
          start()
          drag.onPointerDown(event)
        }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => {
          if (event.defaultPrevented || held.current) {
            held.current = false
            return
          }
          onDrop()
        }}
        aria-pressed={selected}
        aria-label={t('kitgame.pick', { step: option.labelHe })}
        data-kit-option=""
        className="grid h-full w-full select-none grid-rows-[minmax(0,1fr)_auto] p-1 transition-transform duration-press active:scale-[.97] motion-reduce:transition-none"
        style={{ ...drag.style, WebkitTouchCallout: 'none' }}
      >
        <span className="flex min-h-0 items-center justify-center overflow-hidden">
          {step === 'body' ? (
            <KitShirt spec={preview} look={look} marks={marks} className="h-full max-w-full" />
          ) : step === 'construction' ? (
            <KitShirt spec={preview} look={look} marks={marks} crop="top" className="h-full max-w-full" />
          ) : (
            <KitMarkArt spec={preview} which={step} marks={marks} className="h-[80%] w-[86%]" />
          )}
        </span>
        <span className="block truncate border-t-hair border-ink/20 pt-0.5 text-center font-body text-[10px] font-black leading-tight text-ink">
          {option.labelHe}
        </span>
      </button>
      <button
        type="button"
        onClick={onInfo}
        aria-label={t('kitgame.info.open', { label: option.labelHe })}
        className="absolute end-0 top-0 flex h-8 w-8 items-start justify-end p-1 font-body text-[12px] font-black leading-none text-muted"
      >
        <span aria-hidden="true" className="flex h-[15px] w-[15px] items-center justify-center border-hair border-ink/40 bg-paper">i</span>
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ review */
function ReviewPanel({
  puzzle,
  placed,
  onEdit,
  onCheck,
  busy,
  complete,
}: {
  puzzle: KitPuzzle
  placed: Placed
  onEdit: (i: number) => void
  onCheck: () => void
  busy: boolean
  complete: boolean
}) {
  return (
    <section className="grid gap-1.5">
      <ul className="grid grid-cols-5 gap-1">
        {STEP_ORDER.map((step, i) => {
          const option = chosenOf(puzzle, placed, step)
          return (
            <li key={step} className="min-w-0">
              <button
                type="button"
                onClick={() => onEdit(i)}
                className="flex min-h-tap w-full flex-col items-center justify-center border-hair border-ink/35 bg-sheet px-0.5"
              >
                <span className="block w-full truncate text-center font-body text-[11px] font-extrabold leading-tight text-muted">{t(`kitgame.step.${step}` as MessageKey)}</span>
                <span className="block w-full truncate text-center font-body text-[11px] font-black leading-tight text-ink">{option?.labelHe ?? '—'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={onCheck}
        disabled={!complete || busy}
        data-kit-check=""
        className="flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-0 font-extrabold text-paper disabled:opacity-40"
      >
        {busy ? t('kitgame.checking') : t('kitgame.check')}
      </button>
    </section>
  )
}

/* ------------------------------------------------------------------ the sheets */
function InfoSheet({ option, onClose }: { option: KitOption; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(onClose)
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={option.labelHe}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="z-[60] w-full max-w-[460px] border-t-plate border-red bg-sheet px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3"
      >
        <h3 className="font-display text-[22px] leading-none text-ink">{option.labelHe}</h3>
        <p className="mt-2 font-body text-[13px] leading-relaxed text-ink">{option.infoHe}</p>
        <button type="button" onClick={onClose} className="mt-3 min-h-tap w-full border-rule border-ink font-body text-[13px] font-black text-ink">
          {t('kitgame.info.close')}
        </button>
      </div>
    </div>
  )
}

function HintSheet({
  hints,
  busy,
  onAsk,
  onClose,
}: {
  hints: KitHintAnswer[]
  busy: boolean
  onAsk: (kind: KitHintKind) => void
  onClose: () => void
}) {
  const ref = useDialog<HTMLDivElement>(onClose)
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t('kitgame.hint.open')}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="z-[60] w-full max-w-[460px] border-t-plate border-ink bg-sheet px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3"
      >
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-[22px] leading-none text-ink">{t('kitgame.hint.open')}</h3>
          <p className="font-body text-[11px] font-bold text-red">
            <Num>{t('kitgame.hint.title', { n: String(KIT_HINT_PENALTY) })}</Num>
          </p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {HINT_KINDS.map((kind) => {
            const used = hints.some((row) => row.kind === kind)
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onAsk(kind)}
                disabled={busy || used}
                className="min-h-tap border-hair border-ink/40 bg-paper px-2 font-body text-[12px] font-extrabold text-ink disabled:opacity-40"
              >
                {t(`kitgame.hint.${kind}` as MessageKey)}
              </button>
            )
          })}
        </div>
        {hints.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-s-plate border-red ps-2">
            {hints.map((row) => (
              <li key={row.kind} className="font-body text-[13px] leading-snug text-ink">
                {row.textHe}
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={onClose} className="mt-3 min-h-tap w-full border-rule border-ink font-body text-[13px] font-black text-ink">
          {t('kitgame.hint.close')}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the reveal */
function RevealSheet({
  verdict,
  mine,
  onNext,
  last,
  marks,
  doneLabel,
  real = null,
}: {
  verdict: KitVerdict
  mine: KitSpec
  onNext: () => void
  last: boolean
  marks: KitMarksRegime
  /** set inside the life: the way back into the room, and no photograph of the real marks */
  doneLabel?: string
  /** the archive shirt behind this kit, when there is an exact photograph of it */
  real?: { slug: string; kitId: string } | null
}) {
  const ref = useDialog<HTMLDivElement>(onNext)
  const photo = doneLabel ? null : (verdict.evidence.photos[0] ?? null)
  const evidenceLabel =
    verdict.evidence.kind === 'exact'
      ? t('kitgame.evidence.exact')
      : verdict.evidence.kind === 'candidate' && photo?.yearRaw
        ? t('kitgame.evidence.candidate', { year: String(photo.yearRaw) })
        : t('kitgame.evidence.reconstruction')
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={t('kitgame.reveal.kicker')}
      tabIndex={-1}
      data-kit-reveal=""
      className="fixed inset-0 z-[60] mx-auto grid max-w-[460px] grid-rows-[auto_minmax(0,1fr)_auto] bg-paper"
    >
      <div className={`px-3 pb-2 pt-[max(8px,env(safe-area-inset-top))] ${verdict.perfect ? 'bg-red' : 'bg-ink'} text-paper`}>
        <p className="font-body text-[11px] font-bold tracking-widest text-paper/80">{t('kitgame.reveal.kicker')}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h2 className="font-display text-[clamp(22px,6.6vw,30px)] leading-none">
            {verdict.perfect ? t('kitgame.reveal.perfect') : <Num>{t('kitgame.reveal.score', { right: String(verdict.right) })}</Num>}
          </h2>
          <p className="font-poster text-[36px] leading-none" dir="ltr">
            <Num>{String(verdict.score)}</Num>
          </p>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto px-3 pb-3 pt-2">
        {photo ? (
          // a real photograph always beats the graphics we generate (Maor, 23.9.2026): it fills the
          // screen as the hero, our reconstruction rides along as a small corner comparison
          <figure className="relative m-0 border-rule border-red bg-sheet p-1.5">
            <figcaption className="pb-1 text-center font-body text-[11px] font-black text-red">{t('kitgame.reveal.history')}</figcaption>
            <div className="flex h-[min(50dvh,440px)] items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- the archive ships the bytes it measured (rule 69) */}
              <img
                data-archive-photo=""
                src={photo.src}
                alt={t('kitgame.evidence.alt', { season: verdict.seasonLabel })}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <p className="mt-1 text-center font-body text-[11px] font-bold leading-tight text-ink">
              <Num>{evidenceLabel}</Num>
            </p>
            <div className="absolute bottom-3 start-3 w-[34%] max-w-[128px] border-hair border-ink bg-paper p-1">
              <p className="truncate text-center font-body text-[9px] font-black leading-tight text-ink">{t('kitgame.reveal.mine')}</p>
              <div className="flex h-[19cqw] max-h-[92px] items-center justify-center">
                <KitShirt spec={mine} look={verdict.look} marks={marks} className="h-full max-w-full" />
              </div>
            </div>
          </figure>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <figure className="m-0 border-rule border-red bg-sheet p-1.5">
              <figcaption className="pb-1 text-center font-body text-[11px] font-black text-red">{t('kitgame.reveal.history')}</figcaption>
              <div className="flex h-[min(38dvh,300px)] items-center justify-center">
                <KitShirt spec={verdict.answer} look={verdict.look} marks={marks} className="h-full max-w-full" title={verdict.seasonLabel} />
              </div>
              <p className="mt-1 text-center font-body text-[11px] font-bold leading-tight text-ink">
                <Num>{evidenceLabel}</Num>
              </p>
            </figure>
            <figure className="m-0 border-rule border-ink bg-sheet p-1.5">
              <figcaption className="pb-1 text-center font-body text-[11px] font-black text-ink">{t('kitgame.reveal.mine')}</figcaption>
              <div className="flex h-[min(38dvh,300px)] items-center justify-center">
                <KitShirt spec={mine} look={verdict.look} marks={marks} className="h-full max-w-full" />
              </div>
            </figure>
          </div>
        )}

        {verdict.evidence.kind === 'candidate' && (
          <p className="mt-1.5 font-body text-[11px] leading-snug text-muted">{t('kitgame.evidence.candidateNote')}</p>
        )}
        {verdict.evidence.kind === 'reconstruction' && (
          <p className="mt-1.5 font-body text-[11px] leading-snug text-muted">{t('kitgame.evidence.reconstructionNote')}</p>
        )}

        {/* the closet's question — on the reveal, after the check, never in the way of the next shirt */}
        {real && !doneLabel ? <RealShirtAsk key={real.slug} slug={real.slug} kitId={real.kitId} /> : null}

        <ul className="mt-2 border-t-rule border-ink">
          {verdict.steps.map((row) => (
            <StepRow key={row.step} row={row} />
          ))}
        </ul>

        <div className="mt-2 space-y-1 font-body text-[11px] leading-snug text-muted">
          {verdict.perfect && <p className="font-bold text-red"><Num>{t('kitgame.reveal.bonus', { n: '15' })}</Num></p>}
          {verdict.hintsUsed > 0 && (
            <p><Num>{t('kitgame.reveal.hints', { n: String(verdict.hintsUsed), p: String(verdict.hintsUsed * KIT_HINT_PENALTY) })}</Num></p>
          )}
          {!doneLabel && <p>{t('kitgame.reveal.collected')}{verdict.unlock.dna ? ` ${t('kitgame.reveal.dna')}` : ''}</p>}
          {/* which photograph, and whose, is on /credits (spec §0.3); a verdict opens it in a new tab */}
          {verdict.sourceTitle !== '' && <SourceNote newTab />}
        </div>
      </div>

      <div className="border-t-rule border-ink bg-paper px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
        <button type="button" onClick={onNext} data-kit-next="" className="flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-0 font-extrabold text-paper">
          {doneLabel ?? (last ? t('kitgame.finish') : t('kitgame.next'))}
        </button>
      </div>
    </div>
  )
}

function StepRow({ row }: { row: StepVerdict }) {
  const partial = !row.correct && row.points > 0
  const wrong = row.fields.filter((f) => !f.ok)
  return (
    <li className="border-b-hair border-ink/20 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-body text-[13px] font-extrabold text-ink">{t(`kitgame.step.${row.step}` as MessageKey)}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono tabular-nums text-[11px] text-muted" dir="ltr">
            <Num>{t('kitgame.reveal.partial', { points: String(row.points), max: String(row.max) })}</Num>
          </span>
          <span
            className={`font-body text-[12px] font-black ${row.correct ? 'text-ink' : partial ? 'text-sign' : 'text-red'}`}
            aria-label={row.correct ? t('kitgame.reveal.stepRight') : partial ? t('kitgame.reveal.stepPartial') : t('kitgame.reveal.stepWrong')}
          >
            {row.correct ? '✓' : partial ? '◐' : '✕'}
          </span>
        </span>
      </div>
      {wrong.length > 0 && (
        <p className="mt-0.5 font-body text-[11px] leading-snug text-muted">
          {t('kitgame.reveal.truthWas', { truth: [...new Set(wrong.map((f) => f.truthHe))].join(' · ') })}
        </p>
      )}
      {row.tolerant && <p className="mt-0.5 font-body text-[11px] leading-snug text-sign">{t('kitgame.reveal.tolerant')}</p>}
    </li>
  )
}

/* ------------------------------------------------------------------ the round */
function RoundSummary({ log, seed, cursor }: { log: KitVerdict[]; seed: number; cursor: number }) {
  const score = log.reduce((sum, row) => sum + row.score, 0)
  const right = log.reduce((sum, row) => sum + row.right, 0)
  const asked = KIT_ROUND * STEP_ORDER.length
  const marks = log.flatMap((row) => row.steps.map((s) => s.correct))
  return (
    <div
      data-kit-summary=""
      className="mx-auto min-h-0 w-full max-w-[460px] flex-1 overflow-y-auto overscroll-contain bg-paper px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(8px,env(safe-area-inset-top))] md:min-h-[100dvh] md:flex-none md:overflow-visible"
    >
      <div className="bg-red px-4 py-4 text-paper">
        <p className="font-body text-[11px] font-bold tracking-widest">{t('kitgame.round.kicker')}</p>
        <p className="mt-2 font-poster text-[56px] leading-none" dir="ltr">
          <Num>{String(score)}</Num>
        </p>
        <p className="font-body text-[12px]">{t('kitgame.round.points')}</p>
        <p className="mt-2 font-display text-step-1 leading-none">
          <Num>{t('kitgame.round.steps', { n: String(right), total: String(asked) })}</Num>
        </p>
      </div>
      <ul className="mt-2 grid grid-cols-5 gap-1">
        {log.map((row) => (
          <li key={row.puzzleId} className="border-rule border-ink bg-sheet p-1.5 text-center">
            <p className="font-mono tabular-nums text-[11px] font-black text-ink">
              <Num>{row.seasonLabel}</Num>
            </p>
            <p className="mt-1 font-poster text-[20px] leading-none text-red" dir="ltr">
              <Num>{`${row.right}/5`}</Num>
            </p>
          </li>
        ))}
      </ul>
      <RecordRun gate="/kits/build" score={score} correct={right} asked={asked} />
      <RealShirtPending />
      <div className="mt-3">
        <ShareRow
          kind="kit"
          params={{ total: String(asked), s: String(seed), r: String(cursor) }}
          headline={String(right)}
          card={{
            template: 'score' as const,
            kicker: 'GATE 04 · KITS',
            label: t('kitgame.round.cardLabel'),
            eyebrow: t('kitgame.round.cardEyebrow'),
            hero: `${right}/${asked}`,
            bigStat: { v: String(score), k: t('kitgame.round.points') },
            stats: log.map((row) => ({ k: row.seasonLabel, v: `${row.right}/5` })).slice(0, 3),
            cta: t('kitgame.round.cardCta'),
            challenge: t('kitgame.round.cardChallenge'),
            marks,
          }}
        />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <PlayLink gate="/kits/build" className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink">
          {t('kitgame.round.again')}
        </PlayLink>
        <a href="/kits" className="flex min-h-tap items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper">
          {t('kitgame.round.studio')}
        </a>
      </div>
    </div>
  )
}
