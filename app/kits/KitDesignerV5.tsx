'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { KitEngineShirt } from '@/components/kit/KitEngineShirt'
import { MarkArtwork } from '@/components/kit/MarkArtwork'
import { BODY_TEMPLATES, bodyTemplateForSeason, type KitBodyTemplateId } from '@/lib/kit/body-templates'
import { activeCollection, kitKey } from '@/lib/kit/collection'
import { CREST_MARKS, crestArt } from '@/lib/kit/crestMarks'
import { makerAssetForName, sponsorAssetForName } from '@/lib/kit/mark-library'
import { COLLARS, COLOUR_NAME, COLOUR_VAR, DEFAULT_SPEC, NAMESETS, PATTERNS, SLEEVES, type KitColour, type KitSpec } from '@/lib/kit/spec'
import { activeStudioStore, type SavedKitDesign } from '@/lib/kit/studio-store'
import { KIT_BRIEFS, scoreStudioDesign, supporterFeedback, type KitBriefId, type StudioMetrics } from '@/lib/kit/studio'

type RackKit = { seasonLabel: string; noteHe: string; spec: KitSpec }
type TabId = 'dna' | 'body' | 'colour' | 'pattern' | 'collar' | 'sleeves' | 'maker' | 'sponsor' | 'crest' | 'number'
const TABS: readonly { id: TabId; label: string }[] = [
  { id: 'dna', label: 'DNA' },
  { id: 'body', label: 'גוף' },
  { id: 'colour', label: 'צבע' },
  { id: 'pattern', label: 'עיצוב' },
  { id: 'collar', label: 'צווארון' },
  { id: 'sleeves', label: 'שרוולים' },
  { id: 'maker', label: 'מלבישה' },
  { id: 'sponsor', label: 'ספונסר' },
  { id: 'crest', label: 'סמל' },
  { id: 'number', label: 'מספר' },
]
const COLOURS: KitColour[] = ['red', 'cream', 'paper', 'ink', 'navy', 'deep', 'concrete']
const NUMBERS = [5, 7, 8, 9, 10, 11, 12, 14, 15, 17, 20, 23]
const CREATIVE_SPONSORS: Array<string | null> = [null, 'THE WORKER', 'HAPOEL', '1923']

function pulse() {
  try { navigator.vibrate?.(8) } catch {}
}

function withBody(spec: KitSpec, bodyTemplateId: KitBodyTemplateId): KitSpec {
  return { ...spec, bodyTemplateId } as KitSpec
}

export function KitDesignerV5({ rack }: { rack: RackKit[]; seed?: number }) {
  const collection = useMemo(() => activeCollection(), [])
  const studioStore = useMemo(() => activeStudioStore(), [])
  const [owned, setOwned] = useState<Record<string, { bestCategories: number }>>({})
  const [saved, setSaved] = useState<SavedKitDesign[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [spec, setSpec] = useState<KitSpec>({ ...DEFAULT_SPEC, seasonLabel: 'STUDIO' })
  const [bodyTemplateId, setBodyTemplateId] = useState<KitBodyTemplateId>('modern-athletic')
  const [tab, setTab] = useState<TabId>('dna')
  const [briefId, setBriefId] = useState<KitBriefId>('free')
  const [dnaKeys, setDnaKeys] = useState<string[]>([])
  const [result, setResult] = useState<{ metrics: StudioMetrics; feedback: string } | null>(null)
  const [history, setHistory] = useState<Array<{ spec: KitSpec; bodyTemplateId: KitBodyTemplateId }>>([])
  const [future, setFuture] = useState<Array<{ spec: KitSpec; bodyTemplateId: KitBodyTemplateId }>>([])
  const didLoad = useRef(false)

  useEffect(() => {
    if (didLoad.current) return
    didLoad.current = true
    void collection.read().then((rows) => setOwned(rows))
    void studioStore.read().then(setSaved)
  }, [collection, studioStore])

  const unlocked = useMemo(
    () => rack.filter((row) => (owned[kitKey(row.seasonLabel, row.spec.variant)]?.bestCategories ?? 0) >= 6),
    [owned, rack],
  )
  const dnaSpecs = useMemo(
    () => dnaKeys
      .map((key) => unlocked.find((row) => kitKey(row.seasonLabel, row.spec.variant) === key)?.spec)
      .filter((row): row is KitSpec => Boolean(row)),
    [dnaKeys, unlocked],
  )
  const makerOptions = useMemo(
    () => [...new Set(unlocked.map((row) => row.spec.makerHe).filter((value): value is string => Boolean(value)))],
    [unlocked],
  )
  const sponsorOptions = useMemo(
    () => [...new Set([...CREATIVE_SPONSORS, ...unlocked.map((row) => row.spec.sponsorHe)])],
    [unlocked],
  )
  const crestOptions = useMemo(
    () => [...new Set(unlocked.map((row) => row.spec.crestKey).filter((value): value is string => Boolean(value)))],
    [unlocked],
  )
  const brief = KIT_BRIEFS.find((row) => row.id === briefId) ?? KIT_BRIEFS[0]!

  function snapshot() {
    setHistory((rows) => [...rows.slice(-19), { spec, bodyTemplateId }])
    setFuture([])
  }
  function mutate(patch: Partial<KitSpec>) {
    snapshot()
    setSpec((current) => ({ ...current, ...patch, seasonLabel: 'STUDIO' }))
    setResult(null)
    pulse()
  }
  function pickBody(id: KitBodyTemplateId) {
    snapshot()
    setBodyTemplateId(id)
    setResult(null)
    pulse()
  }
  function undo() {
    const previous = history.at(-1)
    if (!previous) return
    setFuture((rows) => [{ spec, bodyTemplateId }, ...rows].slice(0, 20))
    setHistory((rows) => rows.slice(0, -1))
    setSpec(previous.spec)
    setBodyTemplateId(previous.bodyTemplateId)
    setResult(null)
  }
  function redo() {
    const next = future[0]
    if (!next) return
    setHistory((rows) => [...rows, { spec, bodyTemplateId }].slice(-20))
    setFuture((rows) => rows.slice(1))
    setSpec(next.spec)
    setBodyTemplateId(next.bodyTemplateId)
    setResult(null)
  }
  function reset() {
    snapshot()
    setSpec({ ...DEFAULT_SPEC, seasonLabel: 'STUDIO' })
    setBodyTemplateId('modern-athletic')
    setDnaKeys([])
    setResult(null)
  }
  function applyDna(row: RackKit) {
    snapshot()
    setSpec({ ...row.spec, seasonLabel: 'STUDIO' })
    setBodyTemplateId(bodyTemplateForSeason(row.seasonLabel).id)
    const key = kitKey(row.seasonLabel, row.spec.variant)
    setDnaKeys((keys) => keys.includes(key) ? keys : [...keys, key].slice(-3))
    setResult(null)
    pulse()
  }
  function toggleDna(row: RackKit) {
    const key = kitKey(row.seasonLabel, row.spec.variant)
    setDnaKeys((keys) => keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key].slice(-3))
    pulse()
  }
  function judge() {
    const metrics = scoreStudioDesign(spec, briefId, dnaSpecs)
    setResult({ metrics, feedback: supporterFeedback(metrics) })
    pulse()
  }
  async function save() {
    const metrics = result?.metrics ?? scoreStudioDesign(spec, briefId, dnaSpecs)
    const row = await studioStore.save({
      id: editingId ?? undefined,
      briefId,
      spec,
      dnaKeys,
      metrics,
      stamp: metrics.overall >= 75,
      bodyTemplateId,
    })
    setEditingId(row.id)
    setSaved(await studioStore.read())
    setResult({ metrics, feedback: supporterFeedback(metrics) })
    pulse()
  }
  function reopen(row: SavedKitDesign) {
    setEditingId(row.id)
    setBriefId(row.briefId)
    setSpec(row.spec)
    setDnaKeys(row.dnaKeys)
    setBodyTemplateId(row.bodyTemplateId ?? 'modern-athletic')
    setResult({ metrics: row.metrics, feedback: supporterFeedback(row.metrics) })
  }

  return (
    <section className="border-rule border-ink bg-sheet">
      <header className="flex items-end justify-between gap-3 border-b-rule border-ink bg-ink px-3 py-2 text-paper">
        <div>
          <p className="font-mono text-[8px] font-bold tracking-[.18em] text-red" dir="ltr">GATE 05 · KIT DNA STUDIO V5</p>
          <h2 className="font-display text-[24px] leading-none">החולצה היא המשחק</h2>
        </div>
        <div className="flex gap-1">
          <ToolButton disabled={!history.length} onClick={undo}>↶</ToolButton>
          <ToolButton disabled={!future.length} onClick={redo}>↷</ToolButton>
          <ToolButton onClick={reset}>איפוס</ToolButton>
        </div>
      </header>

      <div className="grid min-h-[min(760px,calc(100dvh-155px))] grid-rows-[minmax(300px,54dvh)_minmax(0,1fr)] gap-2 p-2 lg:grid-cols-[minmax(310px,420px)_minmax(0,1fr)] lg:grid-rows-1">
        <div className="flex min-h-0 flex-col border-rule border-ink bg-paper">
          <div className="min-h-0 flex-1 p-2">
            <KitEngineShirt spec={withBody(spec, bodyTemplateId)} className="mx-auto block h-full max-h-[510px] w-full" title="עיצוב החולצה" />
          </div>
          <div className="grid grid-cols-2 border-t-hair border-ink">
            <button type="button" onClick={judge} className="min-h-tap border-e-hair border-ink font-body text-[11px] font-extrabold">בדוק את הבריף</button>
            <button type="button" onClick={() => void save()} className="min-h-tap bg-red font-body text-[11px] font-extrabold text-paper">שמור עיצוב</button>
          </div>
          {result && <div className="border-t-hair border-ink px-3 py-2"><p className="font-display text-[22px]">{result.metrics.overall}/100</p><p className="font-body text-[10px] text-muted">{result.feedback}</p></div>}
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex shrink-0 gap-1 overflow-x-auto border-rule border-ink bg-paper p-1">
            {TABS.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`min-h-tap shrink-0 border-hair px-3 font-body text-[10px] font-extrabold ${tab === item.id ? 'border-red bg-red text-paper' : 'border-ink bg-sheet text-ink'}`}>{item.label}</button>)}
          </div>
          <div className="mt-2 min-h-0 flex-1 overflow-y-auto border-rule border-ink bg-paper p-2">
            {tab === 'dna' && <DnaPanel unlocked={unlocked} dnaKeys={dnaKeys} onApply={applyDna} onToggle={toggleDna} />}
            {tab === 'body' && <BodyPanel selected={bodyTemplateId} spec={spec} onPick={pickBody} />}
            {tab === 'colour' && <ColourPanel spec={spec} mutate={mutate} />}
            {tab === 'pattern' && <ShirtChoiceGrid items={PATTERNS.map((row) => ({ id: row.id, label: row.he }))} selected={spec.pattern} spec={withBody(spec, bodyTemplateId)} patch={(id) => ({ pattern: id as KitSpec['pattern'] })} onPick={(id) => mutate({ pattern: id as KitSpec['pattern'] })} />}
            {tab === 'collar' && <ShirtChoiceGrid items={COLLARS.map((row) => ({ id: row.id, label: row.he }))} selected={spec.collar} spec={withBody(spec, bodyTemplateId)} patch={(id) => ({ collar: id as KitSpec['collar'] })} onPick={(id) => mutate({ collar: id as KitSpec['collar'] })} />}
            {tab === 'sleeves' && <ShirtChoiceGrid items={SLEEVES.map((row) => ({ id: row.id, label: row.he }))} selected={spec.sleeves} spec={withBody(spec, bodyTemplateId)} patch={(id) => ({ sleeves: id as KitSpec['sleeves'] })} onPick={(id) => mutate({ sleeves: id as KitSpec['sleeves'] })} />}
            {tab === 'maker' && <MarkPanel kind="maker" values={makerOptions} selected={spec.makerHe} seasonLabel={spec.seasonLabel} onPick={(value) => mutate({ makerHe: value })} />}
            {tab === 'sponsor' && <MarkPanel kind="sponsor" values={sponsorOptions} selected={spec.sponsorHe} seasonLabel={spec.seasonLabel} onPick={(value) => mutate({ sponsorHe: value })} />}
            {tab === 'crest' && <CrestPanel values={crestOptions} selected={spec.crestKey} onPick={(value) => mutate({ crestKey: value })} />}
            {tab === 'number' && <NumberPanel spec={spec} mutate={mutate} />}
          </div>
          <div className="mt-2 flex shrink-0 gap-1 overflow-x-auto">
            {KIT_BRIEFS.map((row) => <button key={row.id} type="button" onClick={() => { setBriefId(row.id); setResult(null) }} className={`min-h-[42px] shrink-0 border-hair px-3 font-body text-[9px] font-bold ${briefId === row.id ? 'border-ink bg-ink text-paper' : 'border-ink bg-paper'}`}>{row.titleHe}</button>)}
          </div>
          <p className="mt-1 shrink-0 font-body text-[9px] text-muted">{brief.bodyHe}</p>
          {saved.length > 0 && <button type="button" onClick={() => reopen(saved[0]!)} className="mt-1 min-h-[38px] shrink-0 border-hair border-ink bg-paper px-2 font-body text-[9px] font-bold">פתח עיצוב אחרון</button>}
        </div>
      </div>
    </section>
  )
}

function ToolButton({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="min-h-tap border-hair border-paper/40 px-2 font-body text-[10px] font-bold disabled:opacity-30">{children}</button>
}

function DnaPanel({ unlocked, dnaKeys, onApply, onToggle }: { unlocked: RackKit[]; dnaKeys: string[]; onApply: (row: RackKit) => void; onToggle: (row: RackKit) => void }) {
  if (!unlocked.length) return <a href="/kits/build" className="flex min-h-[120px] items-center justify-center border-rule border-red bg-red px-4 text-center font-body text-[12px] font-extrabold text-paper">פתח DNA דרך שער 4</a>
  return <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">{unlocked.map((row) => {
    const key = kitKey(row.seasonLabel, row.spec.variant)
    const used = dnaKeys.includes(key)
    return <div key={key} className={`border-rule p-1 ${used ? 'border-red' : 'border-ink/30'}`}><button type="button" onClick={() => onApply(row)} className="w-full"><KitEngineShirt spec={row.spec} className="mx-auto block h-[94px] w-full" /><span className="block font-mono text-[9px] font-bold">{row.seasonLabel}</span></button><button type="button" onClick={() => onToggle(row)} className={`mt-1 min-h-[34px] w-full border-hair px-1 font-body text-[8px] font-bold ${used ? 'border-red bg-red text-paper' : 'border-ink'}`}>{used ? 'DNA בשימוש ✓' : 'הוסף DNA'}</button></div>
  })}</div>
}

function BodyPanel({ selected, spec, onPick }: { selected: KitBodyTemplateId; spec: KitSpec; onPick: (id: KitBodyTemplateId) => void }) {
  return <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">{Object.values(BODY_TEMPLATES).map((row) => <button key={row.id} type="button" onClick={() => onPick(row.id)} className={`border-rule p-1.5 ${selected === row.id ? 'border-red bg-red/5' : 'border-ink/30'}`}><KitEngineShirt spec={withBody(spec, row.id)} className="mx-auto block h-[118px] w-full" /><span className="mt-1 block font-body text-[9px] font-extrabold">{row.labelHe}</span><span className="font-mono text-[8px] text-muted">{row.yearFrom}–{row.yearTo}</span></button>)}</div>
}

function ColourPanel({ spec, mutate }: { spec: KitSpec; mutate: (patch: Partial<KitSpec>) => void }) {
  return <div className="space-y-3"><ColourRow title="צבע בסיס" value={spec.base} onPick={(base) => mutate({ base })} /><ColourRow title="צבע משני" value={spec.patternInk} onPick={(patternInk) => mutate({ patternInk })} /><ColourRow title="שרוול" value={spec.sleeveInk} onPick={(sleeveInk) => mutate({ sleeveInk })} /><ColourRow title="צווארון" value={spec.collarInk} onPick={(collarInk) => mutate({ collarInk })} /></div>
}

function ColourRow({ title, value, onPick }: { title: string; value: KitColour; onPick: (value: KitColour) => void }) {
  return <div><p className="mb-1 font-body text-[10px] font-extrabold">{title}</p><div className="grid grid-cols-7 gap-1">{COLOURS.map((colour) => <button key={colour} type="button" onClick={() => onPick(colour)} aria-label={COLOUR_NAME[colour]} className={`aspect-square min-h-[42px] border-rule ${value === colour ? 'border-red' : 'border-ink/30'}`} style={{ background: COLOUR_VAR[colour] }} />)}</div></div>
}

function ShirtChoiceGrid({ items, selected, spec, patch, onPick }: { items: { id: string; label: string }[]; selected: string; spec: KitSpec; patch: (id: string) => Partial<KitSpec>; onPick: (id: string) => void }) {
  return <div className="grid grid-cols-3 gap-1.5">{items.map((item) => <button key={item.id} type="button" onClick={() => onPick(item.id)} className={`min-h-[128px] border-rule p-1 ${selected === item.id ? 'border-red bg-red/5' : 'border-ink/30'}`}><KitEngineShirt spec={{ ...spec, ...patch(item.id) }} className="mx-auto block h-[94px] w-full" /><span className="block font-body text-[9px] font-bold">{item.label}</span></button>)}</div>
}

function MarkPanel({ kind, values, selected, seasonLabel, onPick }: { kind: 'maker' | 'sponsor'; values: Array<string | null>; selected: string | null; seasonLabel: string; onPick: (value: string | null) => void }) {
  return <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">{values.map((value) => {
    const asset = kind === 'maker' ? makerAssetForName(value, seasonLabel) : sponsorAssetForName(value)
    return <button key={value ?? 'none'} type="button" onClick={() => onPick(value)} className={`flex min-h-[82px] flex-col items-center justify-center border-rule p-2 ${selected === value ? 'border-red bg-red/5' : 'border-ink/30'}`}>{asset ? <MarkArtwork asset={asset} className="h-10 w-[86%]" /> : <span className="font-body text-[11px] font-extrabold">{value ?? 'ללא'}</span>}<span className="mt-1 font-body text-[8px] text-muted">{value ?? 'ללא סימון'}</span></button>
  })}</div>
}

function CrestPanel({ values, selected, onPick }: { values: string[]; selected: string | null; onPick: (value: string) => void }) {
  return <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">{values.map((value) => {
    const src = crestArt(value, false)
    const mark = CREST_MARKS.find((row) => row.key === value)
    return <button key={value} type="button" onClick={() => onPick(value)} className={`min-h-[100px] border-rule p-2 ${selected === value ? 'border-red bg-red/5' : 'border-ink/30'}`}>{src ? <img src={src} alt="" className="mx-auto h-14 w-14 object-contain" /> : null}<span className="mt-1 block font-body text-[8px] font-bold">{mark?.nameHe ?? value}</span></button>
  })}</div>
}

function NumberPanel({ spec, mutate }: { spec: KitSpec; mutate: (patch: Partial<KitSpec>) => void }) {
  return <div className="space-y-3"><div className="grid grid-cols-6 gap-1">{NUMBERS.map((number) => <button key={number} type="button" onClick={() => mutate({ number })} className={`min-h-tap border-rule font-poster text-[20px] ${spec.number === number ? 'border-red bg-red text-paper' : 'border-ink/30'}`}>{number}</button>)}</div><div className="flex gap-1">{NAMESETS.map((row) => <button key={row.id} type="button" onClick={() => mutate({ nameset: row.id })} className={`min-h-tap flex-1 border-hair px-2 font-body text-[9px] font-bold ${spec.nameset === row.id ? 'border-ink bg-ink text-paper' : 'border-ink'}`}>{row.he}</button>)}</div></div>
}
