'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { KitAssemblyShirt } from '@/components/kit/KitAssemblyShirt'
import { KitEngineShirt } from '@/components/kit/KitEngineShirt'
import {
  KIT_HINT_PENALTY,
  PART_LABEL,
  PART_ORDER,
  type KitHintAnswer,
  type KitPart,
  type KitPuzzle,
  type KitVerdict,
  type PartKind,
} from '@/lib/game/kit-build-run'
import { t } from '@/lib/i18n'
import { activeCollection } from '@/lib/kit/collection'
import type { KitSpec } from '@/lib/kit/spec'
import { askKitHint, submitKit } from './actions'

type Placed = Partial<Record<PartKind, string>>

function specFrom(puzzle: KitPuzzle, placed: Placed): KitSpec {
  let spec = { ...puzzle.blank }
  for (const drawer of puzzle.drawers) {
    const id = placed[drawer.kind]
    const part = drawer.parts.find((option) => option.id === id)
    if (part) spec = { ...spec, ...part.patch }
  }
  return spec
}

function previewSpec(puzzle: KitPuzzle, placed: Placed, part: KitPart): KitSpec {
  return { ...specFrom(puzzle, placed), ...part.patch }
}

export function KitGameRunV5({ puzzles, seed, cursor = 0 }: { puzzles: KitPuzzle[]; seed: number; cursor?: number }) {
  const [index, setIndex] = useState(0)
  const [placed, setPlaced] = useState<Placed>({})
  const [active, setActive] = useState<PartKind>('base')
  const [history, setHistory] = useState<Placed[]>([])
  const [hints, setHints] = useState<KitHintAnswer[]>([])
  const [verdict, setVerdict] = useState<KitVerdict | null>(null)
  const [busy, setBusy] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const timer = useRef<number | null>(null)
  const store = useMemo(() => activeCollection(), [])
  const puzzle = puzzles[index]

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])

  if (!puzzle) return <RunDone />

  const spec = specFrom(puzzle, placed)
  const complete = PART_ORDER.every((kind) => Boolean(placed[kind]))
  const drawer = (puzzle.drawers.find((row) => row.kind === active) ?? puzzle.drawers[0])!
  const step = PART_ORDER.indexOf(active)

  function pick(part: KitPart) {
    if (verdict || busy) return
    setHistory((rows) => [...rows.slice(-15), placed])
    const next = { ...placed, [part.kind]: part.id }
    setPlaced(next)
    try { navigator.vibrate?.(8) } catch {}
    if (!autoAdvance) return
    const nextMissing = PART_ORDER.slice(step + 1).find((kind) => !next[kind]) ?? PART_ORDER.find((kind) => !next[kind])
    if (nextMissing) timer.current = window.setTimeout(() => setActive(nextMissing), 140)
  }

  function undo() {
    const previous = history.at(-1)
    if (!previous || verdict) return
    setPlaced(previous)
    setHistory((rows) => rows.slice(0, -1))
  }

  function reset() {
    if (verdict) return
    setHistory((rows) => [...rows.slice(-15), placed])
    setPlaced({})
    setActive('base')
  }

  async function hint(kind: 'whisper' | 'detail' | 'front') {
    if (busy || verdict || hints.some((row) => row.kind === kind)) return
    setBusy(true)
    try {
      const answer = await askKitHint(seed, index, kind, cursor)
      if (answer) setHints((rows) => [...rows, answer])
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    if (!complete || busy || verdict) return
    setBusy(true)
    try {
      const result = await submitKit(seed, index, placed, cursor, hints.length)
      if (!result) return
      setVerdict(result)
      await store.record({
        seasonLabel: result.seasonLabel,
        variant: result.variant,
        parts: result.right,
        score: result.score,
        hintsUsed: result.hintsUsed,
      })
    } finally {
      setBusy(false)
    }
  }

  function nextShirt() {
    setIndex((value) => value + 1)
    setPlaced({})
    setHistory([])
    setHints([])
    setVerdict(null)
    setActive('base')
  }

  if (verdict) return <Reveal verdict={verdict} built={spec} onNext={nextShirt} last={index >= puzzles.length - 1} />

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-118px)] max-w-6xl flex-col overflow-hidden pb-2">
      <header className="flex shrink-0 items-end justify-between gap-3 border-b-rule border-ink pb-1.5">
        <div>
          <p className="font-body text-[9px] font-black tracking-[.15em] text-red">{t('gate.4')} · {difficultyLabel(puzzle.difficulty)}</p>
          <h2 className="font-display text-[clamp(26px,7vw,44px)] leading-none">{puzzle.seasonLabel}</h2>
        </div>
        <div className="text-end">
          <p className="font-mono tabular-nums text-[10px]">{index + 1}/{puzzles.length}</p>
          <p className="font-mono tabular-nums text-[9px] text-muted">{Object.keys(placed).length}/8 · {puzzle.optionCount}</p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(260px,48dvh)_minmax(0,1fr)] gap-2 pt-2 lg:grid-cols-[minmax(300px,430px)_minmax(0,1fr)] lg:grid-rows-1">
        <section className="flex min-h-0 flex-col border-rule border-ink bg-sheet">
          <div className="min-h-0 flex-1 p-1.5">
            <KitEngineShirt spec={spec} className="mx-auto block h-full max-h-[540px] w-full" title={t('kit.preview')} />
          </div>
          <div className="grid shrink-0 grid-cols-3 border-t-hair border-ink">
            <button type="button" onClick={undo} disabled={!history.length} aria-label="Undo" className="min-h-tap border-e-hair border-ink font-body text-[10px] font-extrabold disabled:opacity-30">↶</button>
            <button type="button" onClick={reset} disabled={!Object.keys(placed).length} className="min-h-tap border-e-hair border-ink font-body text-[10px] font-extrabold disabled:opacity-30">{t('kitgame.reset')}</button>
            <button type="button" onClick={() => setAutoAdvance((value) => !value)} className={`min-h-tap font-body text-[9px] font-extrabold ${autoAdvance ? 'bg-ink text-paper' : 'bg-paper text-ink'}`}>AUTO {autoAdvance ? '✓' : '—'}</button>
          </div>
        </section>

        <section className="flex min-h-0 flex-col">
          <div className="shrink-0 overflow-x-auto">
            <div className="flex min-w-max gap-1">
              {PART_ORDER.map((kind, number) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setActive(kind)}
                  className={`min-h-[42px] border-hair px-2.5 text-start ${active === kind ? 'border-red bg-red text-paper' : placed[kind] ? 'border-ink bg-ink text-paper' : 'border-ink/35 bg-paper text-ink'}`}
                >
                  <span className="block font-mono tabular-nums text-[8px] opacity-70">0{number + 1}</span>
                  <span className="block font-body text-[10px] font-black">{PART_LABEL[kind]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 flex min-h-0 flex-1 flex-col border-rule border-ink bg-paper">
            <div className="flex shrink-0 items-baseline justify-between border-b-hair border-ink px-2 py-1.5">
              <h3 className="font-display text-[22px] leading-none">{PART_LABEL[drawer.kind]}</h3>
              <span className="font-body text-[9px] text-muted">{t('kitgame.hintPick')}</span>
            </div>
            <div className={`grid min-h-0 flex-1 gap-1.5 overflow-y-auto p-1.5 ${drawer.parts.length >= 5 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {drawer.parts.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => pick(part)}
                  aria-pressed={placed[drawer.kind] === part.id}
                  className={`flex min-h-[132px] flex-col border-rule p-1 ${placed[drawer.kind] === part.id ? 'border-red bg-red/5' : 'border-ink/35 bg-sheet'}`}
                >
                  <span className="min-h-0 flex-1">
                    <KitEngineShirt spec={previewSpec(puzzle, placed, part)} className="mx-auto block h-full min-h-[92px] w-full" />
                  </span>
                  <span className="shrink-0 border-t-hair border-ink/20 px-1 py-1 font-body text-[9px] font-black leading-tight">{part.labelHe}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-1.5 grid shrink-0 grid-cols-3 gap-1">
            <HintButton label="? 1" used={hints.some((h) => h.kind === 'whisper')} onClick={() => hint('whisper')} />
            <HintButton label="? 2" used={hints.some((h) => h.kind === 'detail')} onClick={() => hint('detail')} />
            <HintButton label="? 3" used={hints.some((h) => h.kind === 'front')} onClick={() => hint('front')} />
          </div>

          {hints.length > 0 && (
            <div className="mt-1 shrink-0 border-hair border-ink/35 bg-sheet px-2 py-1 font-body text-[9px] leading-snug">
              {hints.map((row) => <span key={row.kind} className="me-2">{row.textHe}</span>)}
              <span className="font-mono tabular-nums text-red">−{hints.length * KIT_HINT_PENALTY}</span>
            </div>
          )}

          <button type="button" onClick={submit} disabled={!complete || busy} className="mt-1.5 min-h-[50px] shrink-0 border-rule border-ink bg-red px-4 font-display text-[20px] text-paper disabled:bg-concrete disabled:text-muted">
            {complete ? t('kitgame.check') : t('kitgame.hintPick')}
          </button>
        </section>
      </div>
    </div>
  )
}

function difficultyLabel(value: KitPuzzle['difficulty']) {
  if (value === 'warmup') return t('run.stage.1')
  if (value === 'expert') return t('run.stage.3')
  return t('run.stage.2')
}

function HintButton({ label, used, onClick }: { label: string; used: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} disabled={used} className="min-h-[42px] border-hair border-ink bg-paper px-2 font-body text-[10px] font-black disabled:opacity-35">{used ? '✓ ' : ''}{label}</button>
}

function Reveal({ verdict, built, onNext, last }: { verdict: KitVerdict; built: KitSpec; onNext: () => void; last: boolean }) {
  return (
    <div className="mx-auto max-w-5xl pb-8">
      <div className="border-rule border-ink bg-red px-4 py-3 text-paper">
        <p className="font-body text-[9px] font-black tracking-[.16em]">REVEAL · {verdict.seasonLabel} · {difficultyLabel(verdict.difficulty)}</p>
        <p className="mt-1 font-display text-[36px] leading-none">{verdict.right}/8 · {verdict.score} · {t('run.score')}</p>
      </div>
      <div className="grid grid-cols-2 border-x-rule border-b-rule border-ink bg-paper">
        <figure className="border-e-hair border-ink p-2">
          <figcaption className="mb-1 font-body text-[10px] font-black">{t('kitgame.mine')}</figcaption>
          <KitEngineShirt spec={built} className="mx-auto h-[min(36vh,300px)] w-full" />
        </figure>
        <figure className="p-2">
          <figcaption className="mb-1 font-body text-[10px] font-black">{t('kitgame.truth')}</figcaption>
          {verdict.realSrc ? <img src={verdict.realSrc} alt={t('xi.shirt.alt', { season: verdict.seasonLabel })} className="mx-auto h-[min(36vh,300px)] w-full object-contain" /> : <KitAssemblyShirt spec={verdict.answer} historical className="mx-auto h-[min(36vh,300px)] w-full" />}
        </figure>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
        {verdict.parts.map((part) => (
          <div key={part.kind} className={`border-hair px-2 py-2 ${part.correct ? 'border-ink bg-ink text-paper' : 'border-red bg-paper text-red'}`}>
            <p className="font-body text-[10px] font-black">{part.correct ? '✓' : '×'} {PART_LABEL[part.kind]}</p>
            <p className="font-mono tabular-nums text-[8px]">{part.points}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 border-hair border-ink/35 bg-sheet px-3 py-2">
        <p className="font-body text-[11px] leading-relaxed">{verdict.noteHe}</p>
        <p className="mt-1 font-mono tabular-nums text-[8px] text-muted">{t('kits.source')}: {verdict.sourceTitle}</p>
      </div>
      {!last ? <button type="button" onClick={onNext} className="mt-2 min-h-[50px] w-full border-rule border-ink bg-ink font-display text-[20px] text-paper">{t('kitgame.next')} ←</button> : <RunDone />}
    </div>
  )
}

function RunDone() {
  return <div className="border-rule border-ink bg-sheet p-6 text-center"><p className="font-display text-[30px]">{t('kitgame.roundDone')}</p><a href="/kits" className="mt-3 inline-flex min-h-tap items-center border-rule border-ink bg-red px-5 font-body text-[12px] font-extrabold text-paper">{t('kit.designer')} ←</a></div>
}
