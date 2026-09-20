'use client'

import { useMemo, useState } from 'react'
import { KitAssemblyShirt } from '@/components/kit/KitAssemblyShirt'
import type { KitSpec } from '@/lib/kit/spec'

const bases = [
  { id: 'red', he: 'אדום' },
  { id: 'cream', he: 'שמנת' },
  { id: 'paper', he: 'לבן' },
  { id: 'ink', he: 'שחור' },
] as const
const patterns = [
  { id: 'solid', he: 'חלק' },
  { id: 'stripe-wide', he: 'פסים רחבים' },
  { id: 'pinstripe', he: 'פסי שיער' },
  { id: 'sash', he: 'סאש' },
  { id: 'side-panel', he: 'פאנלים' },
] as const
const collars = [
  { id: 'crew', he: 'עגול' },
  { id: 'v-neck', he: 'וי' },
  { id: 'polo', he: 'פולו' },
  { id: 'ringer', he: 'רינגר' },
] as const
const sleeves = [
  { id: 'plain', he: 'אחיד' },
  { id: 'raglan', he: 'רגלן' },
  { id: 'cuff', he: 'חפת' },
  { id: 'shoulder-stripe', he: 'פסי כתף' },
] as const
const makers = ['adidas', 'umbro', 'PUMA', 'DIADORA', 'MACRON', 'LE COQ SPORTIF'] as const
const sponsors = ['VISA', 'SUBARU', 'FUJICOM', 'ARKIA', 'בזק', 'דיסקונט', 'CARLSBERG', 'KETER'] as const
const crests = [
  { id: 'worker-hapoel', he: 'הפועל הקלאסי' },
  { id: 'circle-1923', he: 'עגול 1923' },
  { id: 'circle-1927', he: 'עגול 1927' },
  { id: 'keter-ball', he: 'כדור כתר' },
] as const

const categories = ['צבע', 'עיצוב', 'צווארון', 'שרוול', 'מלבישה', 'ספונסר', 'סמל'] as const

function initialSpec(): KitSpec {
  return {
    seasonLabel: 'LAB',
    variant: 'home',
    base: 'red',
    pattern: 'solid',
    patternInk: 'cream',
    sleeves: 'plain',
    sleeveInk: 'red',
    collar: 'crew',
    collarInk: 'cream',
    sponsorHe: 'SUBARU',
    makerHe: 'umbro',
    nameset: 'block-solid',
    number: 10,
    shorts: 'red',
    socks: 'red',
    crestKey: 'circle-1923',
  }
}

export default function KitLabPage() {
  const [spec, setSpec] = useState<KitSpec>(() => initialSpec())
  const [active, setActive] = useState(0)
  const [history, setHistory] = useState<KitSpec[]>([])
  const [future, setFuture] = useState<KitSpec[]>([])

  const selectedLabel = useMemo(() => categories[active], [active])

  function change(patch: Partial<KitSpec>) {
    setHistory((rows) => [...rows.slice(-19), spec])
    setFuture([])
    setSpec((current) => ({ ...current, ...patch }))
  }

  function undo() {
    const previous = history.at(-1)
    if (!previous) return
    setFuture((rows) => [spec, ...rows].slice(0, 20))
    setHistory((rows) => rows.slice(0, -1))
    setSpec(previous)
  }

  function redo() {
    const next = future[0]
    if (!next) return
    setHistory((rows) => [...rows, spec].slice(-20))
    setFuture((rows) => rows.slice(1))
    setSpec(next)
  }

  function reset() {
    setHistory((rows) => [...rows.slice(-19), spec])
    setFuture([])
    setSpec(initialSpec())
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col overflow-hidden bg-paper px-2 pb-2 pt-2 text-ink sm:px-4" dir="rtl">
      <header className="flex shrink-0 items-end justify-between gap-3 border-b-rule border-ink pb-1.5">
        <div>
          <p className="font-body text-[9px] font-black tracking-[.16em] text-red">THE WORKER · KIT LAB V4 PREVIEW</p>
          <h1 className="font-display text-[clamp(28px,8vw,52px)] leading-none">מעבדת חולצות</h1>
        </div>
        <div className="flex gap-1">
          <button onClick={undo} disabled={!history.length} className="min-h-tap border-hair border-ink bg-sheet px-3 font-body text-xs font-black disabled:opacity-25">↶</button>
          <button onClick={redo} disabled={!future.length} className="min-h-tap border-hair border-ink bg-sheet px-3 font-body text-xs font-black disabled:opacity-25">↷</button>
          <button onClick={reset} className="min-h-tap border-hair border-ink bg-sheet px-3 font-body text-xs font-black">איפוס</button>
        </div>
      </header>

      <section className="grid min-h-0 flex-1 grid-rows-[42vh_minmax(0,1fr)] gap-2 pt-2 lg:grid-cols-[420px_minmax(0,1fr)] lg:grid-rows-1">
        <div className="flex min-h-0 items-center justify-center overflow-hidden border-rule border-ink bg-sheet p-1.5 lg:sticky lg:top-2">
          <KitAssemblyShirt spec={spec} className="h-full max-h-[430px] w-full max-w-[370px]" title="Kit Lab preview" />
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden border-rule border-ink bg-sheet">
          <div className="shrink-0 overflow-x-auto border-b-hair border-ink bg-paper p-1">
            <div className="flex min-w-max gap-1">
              {categories.map((label, index) => (
                <button key={label} onClick={() => setActive(index)} className={`min-h-[40px] border-hair px-3 font-body text-[11px] font-black ${active === index ? 'border-red bg-red text-paper' : 'border-ink bg-paper text-ink'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-display text-[26px] leading-none">{selectedLabel}</h2>
              <span className="font-mono text-[9px] text-muted">V4 · LIVE BUILD</span>
            </div>

            {active === 0 && <OptionGrid rows={bases.map((row) => ({ label: row.he, active: spec.base === row.id, onClick: () => change({ base: row.id, sleeveInk: row.id }) }))} />}
            {active === 1 && <OptionGrid rows={patterns.map((row) => ({ label: row.he, active: spec.pattern === row.id, onClick: () => change({ pattern: row.id }) }))} />}
            {active === 2 && <OptionGrid rows={collars.map((row) => ({ label: row.he, active: spec.collar === row.id, onClick: () => change({ collar: row.id }) }))} />}
            {active === 3 && <OptionGrid rows={sleeves.map((row) => ({ label: row.he, active: spec.sleeves === row.id, onClick: () => change({ sleeves: row.id }) }))} />}
            {active === 4 && <OptionGrid rows={makers.map((row) => ({ label: row, active: spec.makerHe === row, onClick: () => change({ makerHe: row }) }))} />}
            {active === 5 && <OptionGrid rows={sponsors.map((row) => ({ label: row, active: spec.sponsorHe === row, onClick: () => change({ sponsorHe: row }) }))} />}
            {active === 6 && <OptionGrid rows={crests.map((row) => ({ label: row.he, active: spec.crestKey === row.id, onClick: () => change({ crestKey: row.id }) }))} />}
          </div>

          <footer className="shrink-0 border-t-hair border-ink bg-paper px-2 py-1.5">
            <p className="font-body text-[10px] leading-tight text-muted">זו גרסת Preview אינטראקטיבית: אותו renderer של המשחק, עם בחירה נפרדת לצבע, עיצוב, צווארון, שרוול, מלבישה, ספונסר וסמל. עדיין לא מוזג ל־main.</p>
          </footer>
        </div>
      </section>
    </main>
  )
}

function OptionGrid({ rows }: { rows: { label: string; active: boolean; onClick: () => void }[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {rows.map((row) => (
        <button key={row.label} onClick={row.onClick} aria-pressed={row.active} className={`min-h-[54px] border-rule px-2 font-body text-[12px] font-black ${row.active ? 'border-red bg-red text-paper' : 'border-ink bg-paper text-ink'}`}>
          {row.label}
        </button>
      ))}
    </div>
  )
}
