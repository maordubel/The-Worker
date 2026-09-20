'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { KitAssemblyShirt } from '@/components/kit/KitAssemblyShirt'
import { KitPhotoPart } from '@/components/kit/KitPhotoPart'
import { MakerMark, markFor } from '@/components/kit/MakerMark'
import { MarkArtwork } from '@/components/kit/MarkArtwork'
import { activeCollection } from '@/lib/kit/collection'
import { crestArt } from '@/lib/kit/crestMarks'
import { makerAssetForName, sponsorAssetForName } from '@/lib/kit/mark-library'
import type { KitSpec } from '@/lib/kit/spec'
import {
  KIT_HINT_PENALTY,
  PART_ORDER,
  type KitHintAnswer,
  type KitPart,
  type KitPuzzle,
  type KitVerdict,
  type PartKind,
} from '@/lib/game/kitBuild'
import { PART_LABEL } from '@/lib/game/kit-build-run'
import { askKitHint, submitKit } from './actions'

type Placed = Partial<Record<PartKind, string>>
const KIND_TO_PHOTO: Record<PartKind, 'base' | 'secondary' | 'pattern' | 'collar' | 'sleeve' | 'maker' | 'sponsor' | 'crest'> = {
  base: 'base', secondary: 'secondary', pattern: 'pattern', collar: 'collar', sleeve: 'sleeve', maker: 'maker', sponsor: 'sponsor', crest: 'crest',
}

function specFrom(puzzle: KitPuzzle, placed: Placed): KitSpec {
  let spec = { ...puzzle.blank }
  for (const drawer of puzzle.drawers) {
    const id = placed[drawer.kind]
    const part = drawer.parts.find((option) => option.id === id)
    if (part) spec = { ...spec, ...part.patch }
  }
  return spec
}

export function KitGameRunV3({ puzzles, seed, cursor = 0 }: { puzzles: KitPuzzle[]; seed: number; cursor?: number }) {
  const [index, setIndex] = useState(0)
  const [placed, setPlaced] = useState<Placed>({})
  const [active, setActive] = useState<PartKind>('base')
  const [history, setHistory] = useState<Placed[]>([])
  const [hints, setHints] = useState<KitHintAnswer[]>([])
  const [verdict, setVerdict] = useState<KitVerdict | null>(null)
  const [busy, setBusy] = useState(false)
  const timer = useRef<number | null>(null)
  const store = useMemo(() => activeCollection(), [])
  const puzzle = puzzles[index]

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])
  if (!puzzle) return <RunDone />

  const spec = specFrom(puzzle, placed)
  const complete = PART_ORDER.every((kind) => Boolean(placed[kind]))
  const drawer = puzzle.drawers.find((row) => row.kind === active) ?? puzzle.drawers[0]
  const step = PART_ORDER.indexOf(active)

  function pick(part: KitPart) {
    if (verdict || busy) return
    setHistory((rows) => [...rows.slice(-11), placed])
    const next = { ...placed, [part.kind]: part.id }
    setPlaced(next)
    const nextMissing = PART_ORDER.slice(step + 1).find((kind) => !next[kind]) ?? PART_ORDER.find((kind) => !next[kind])
    if (nextMissing) {
      timer.current = window.setTimeout(() => setActive(nextMissing), 180)
    }
    try { navigator.vibrate?.(8) } catch {}
  }

  function undo() {
    const previous = history.at(-1)
    if (!previous || verdict) return
    setPlaced(previous)
    setHistory((rows) => rows.slice(0, -1))
  }

  function reset() {
    if (verdict) return
    setHistory((rows) => [...rows.slice(-11), placed])
    setPlaced({})
    setActive('base')
  }

  async function hint(kind: 'whisper' | 'detail' | 'front') {
    if (busy || verdict || hints.some((row) => row.kind === kind)) return
    setBusy(true)
    try {
      const answer = await askKitHint(seed, index, kind, cursor)
      if (answer) setHints((rows) => [...rows, answer])
    } finally { setBusy(false) }
  }

  async function submit() {
    if (!complete || busy || verdict) return
    setBusy(true)
    try {
      const result = await submitKit(seed, index, placed, cursor, hints.length)
      if (!result) return
      setVerdict(result)
      await store.record({ seasonLabel: result.seasonLabel, variant: result.variant, parts: result.right, score: result.score, hintsUsed: result.hintsUsed })
    } finally { setBusy(false) }
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
    <div className="mx-auto max-w-5xl pb-8">
      <header className="mb-2 flex items-end justify-between gap-3 border-b-rule border-ink pb-2">
        <div>
          <p className="font-body text-[10px] font-black tracking-[.16em] text-red">שער 4 · זיכרון חולצה</p>
          <h2 className="font-display text-[clamp(26px,7vw,48px)] leading-none text-ink">{puzzle.seasonLabel}</h2>
        </div>
        <p className="font-mono text-[10px] text-muted">{index + 1}/{puzzles.length} · {Object.keys(placed).length}/{PART_ORDER.length}</p>
      </header>

      <div className="grid gap-2 lg:grid-cols-[minmax(260px,390px)_1fr] lg:items-start lg:gap-4">
        <section className="border-rule border-ink bg-sheet p-2 lg:sticky lg:top-16">
          <div className="relative mx-auto h-[min(49vh,430px)] min-h-[285px] w-full">
            <KitAssemblyShirt spec={spec} className="h-full w-full" title={`חולצה ${puzzle.seasonLabel}`} />
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <button type="button" onClick={undo} disabled={!history.length} className="min-h-tap border-hair border-ink bg-paper px-3 font-body text-[12px] font-black disabled:opacity-30">↶ בטל</button>
            <button type="button" onClick={reset} disabled={!Object.keys(placed).length} className="min-h-tap border-hair border-ink bg-paper px-3 font-body text-[12px] font-black disabled:opacity-30">איפוס</button>
          </div>
        </section>

        <section className="min-w-0">
          <div className="-mx-gutter overflow-x-auto px-gutter pb-1 lg:mx-0 lg:px-0">
            <div className="flex min-w-max gap-1">
              {PART_ORDER.map((kind, number) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setActive(kind)}
                  className={`min-h-[42px] border-hair px-2.5 text-start ${active === kind ? 'border-red bg-red text-paper' : placed[kind] ? 'border-ink bg-ink text-paper' : 'border-ink/35 bg-paper text-ink'}`}
                >
                  <span className="block font-mono text-[8px] opacity-70">0{number + 1}</span>
                  <span className="block font-body text-[11px] font-black">{PART_LABEL[kind]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 border-rule border-ink bg-paper p-2.5">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="font-display text-[24px] leading-none text-ink">{PART_LABEL[drawer.kind]}</h3>
              <span className="font-body text-[10px] text-muted">בחר פרט · עוברים אוטומטית</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {drawer.parts.map((part) => (
                <PartCard key={part.id} part={part} selected={placed[drawer.kind] === part.id} onPick={() => pick(part)} />
              ))}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1">
            <HintButton label="לחישה" used={hints.some((h) => h.kind === 'whisper')} onClick={() => hint('whisper')} />
            <HintButton label="פרט" used={hints.some((h) => h.kind === 'detail')} onClick={() => hint('detail')} />
            <HintButton label="חזית" used={hints.some((h) => h.kind === 'front')} onClick={() => hint('front')} />
          </div>
          {hints.length > 0 && (
            <div className="mt-1.5 border-hair border-ink/35 bg-sheet px-3 py-2 font-body text-[11px] leading-snug text-ink">
              {hints.map((hint) => <p key={hint.kind}>{hint.textHe}</p>)}
              <p className="mt-1 font-mono text-[9px] text-red">−{hints.length * KIT_HINT_PENALTY} נק׳</p>
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!complete || busy}
            className="mt-2 min-h-[52px] w-full border-rule border-ink bg-red px-4 font-display text-[22px] text-paper disabled:bg-concrete disabled:text-muted"
          >
            {complete ? 'בדוק את החולצה' : `נשארו ${PART_ORDER.length - Object.keys(placed).length} פרטים`}
          </button>
        </section>
      </div>
    </div>
  )
}

function PartCard({ part, selected, onPick }: { part: KitPart; selected: boolean; onPick: () => void }) {
  const maker = part.kind === 'maker' ? makerAssetForName(part.patch.makerHe ?? null) : null
  const sponsor = part.kind === 'sponsor' ? sponsorAssetForName(part.patch.sponsorHe ?? null) : null
  const crest = part.kind === 'crest' ? crestArt(part.patch.crestKey ?? null, false) : null
  const fallbackMaker = part.kind === 'maker' ? markFor(part.patch.makerHe ?? null) : null

  return (
    <button type="button" onClick={onPick} aria-pressed={selected} className={`min-h-[116px] overflow-hidden border-rule text-start ${selected ? 'border-red bg-red text-paper' : 'border-ink bg-sheet text-ink'}`}>
      <span className={`flex h-[78px] items-center justify-center overflow-hidden ${selected ? 'bg-paper' : 'bg-paper'}`}>
        {maker ? <MarkArtwork asset={maker} className="h-[46px] w-[78%]" />
          : sponsor ? <MarkArtwork asset={sponsor} className="h-[50px] w-[84%]" />
          : crest ? <img src={crest} alt="" className="max-h-[58px] max-w-[65%] object-contain" />
          : fallbackMaker ? <svg viewBox="0 0 24 28" className="h-12 w-12"><MakerMark id={fallbackMaker} ink="#171717" /></svg>
          : part.hasReference ? <KitPhotoPart src={`/api/kits/reference/${part.id}`} kind={KIND_TO_PHOTO[part.kind]} label={part.labelHe} className="h-full w-full" />
          : <MiniPatch part={part} />}
      </span>
      <span className="block px-2 py-1.5 font-body text-[10.5px] font-black leading-tight">{part.labelHe}</span>
    </button>
  )
}

function MiniPatch({ part }: { part: KitPart }) {
  if (part.kind === 'base' || part.kind === 'secondary') {
    const colour = part.patch.base ?? part.patch.patternInk
    const css: Record<string, string> = { red: '#d52b1e', deep: '#b81c14', cream: '#f2eadb', paper: '#fff', ink: '#171717', navy: '#183153', concrete: '#aaa' }
    return <span className="h-12 w-12 rounded-full border-hair border-ink" style={{ background: css[String(colour)] ?? '#ddd' }} />
  }
  return <span className="font-display text-[28px] text-ink">{part.kind === 'pattern' ? '▥' : part.kind === 'collar' ? '⌄' : '⌁'}</span>
}

function HintButton({ label, used, onClick }: { label: string; used: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} disabled={used} className="min-h-tap border-hair border-ink bg-paper px-2 font-body text-[11px] font-black disabled:opacity-35">{used ? '✓ ' : '? '}{label}</button>
}

function Reveal({ verdict, built, onNext, last }: { verdict: KitVerdict; built: KitSpec; onNext: () => void; last: boolean }) {
  return (
    <div className="mx-auto max-w-4xl pb-8">
      <div className="border-rule border-ink bg-red px-4 py-3 text-paper">
        <p className="font-body text-[10px] font-black tracking-[.16em]">REVEAL · {verdict.seasonLabel}</p>
        <p className="mt-1 font-display text-[36px] leading-none">{verdict.right}/{PART_ORDER.length} · {verdict.score} נק׳</p>
      </div>
      <div className="grid grid-cols-2 border-x-rule border-b-rule border-ink bg-paper">
        <figure className="border-e-hair border-ink p-2">
          <figcaption className="mb-1 font-body text-[10px] font-black">שלך</figcaption>
          <KitAssemblyShirt spec={built} className="mx-auto h-[230px] w-full" />
        </figure>
        <figure className="p-2">
          <figcaption className="mb-1 font-body text-[10px] font-black">המקור</figcaption>
          {verdict.realSrc ? <img src={verdict.realSrc} alt={`חולצת ${verdict.seasonLabel}`} className="mx-auto h-[230px] w-full object-contain" /> : <KitAssemblyShirt spec={verdict.answer} historical className="mx-auto h-[230px] w-full" />}
        </figure>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
        {verdict.parts.map((part) => <div key={part.kind} className={`border-hair px-2 py-2 font-body text-[11px] font-black ${part.correct ? 'border-ink bg-ink text-paper' : 'border-red bg-paper text-red'}`}>{part.correct ? '✓' : '×'} {PART_LABEL[part.kind]}</div>)}
      </div>
      <p className="mt-2 font-body text-[11px] leading-relaxed text-muted">{verdict.noteHe}</p>
      <p className="mt-1 font-body text-[10px] text-muted">מקור: {verdict.sourceTitle}</p>
      {!last && <button type="button" onClick={onNext} className="mt-3 min-h-[50px] w-full border-rule border-ink bg-ink font-display text-[20px] text-paper">לחולצה הבאה ←</button>}
      {last && <RunDone />}
    </div>
  )
}

function RunDone() {
  return <div className="mt-3 border-rule border-ink bg-sheet p-5 text-center"><p className="font-display text-[30px] text-ink">הריצה הושלמה</p><a href="/kits" className="mt-2 inline-block font-body text-[12px] font-black text-red underline">לאוסף ולסטודיו ←</a></div>
}
