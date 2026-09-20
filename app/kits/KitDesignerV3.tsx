'use client'

import { useEffect, useMemo, useState } from 'react'

import { KitAssemblyShirt } from '@/components/kit/KitAssemblyShirt'
import { KitPhotoPart } from '@/components/kit/KitPhotoPart'
import { MarkArtwork } from '@/components/kit/MarkArtwork'
import { activeCollection, kitKey, type Collection } from '@/lib/kit/collection'
import { crestArt, crestMark } from '@/lib/kit/crestMarks'
import type { DnaRackItem } from '@/lib/kit/archive-dna'
import { makerAssetForName, sponsorAssetForName } from '@/lib/kit/mark-library'
import { activeStudioStore, type SavedKitDesign } from '@/lib/kit/studio-store'
import { KIT_BRIEFS, scoreStudioDesign, supporterFeedback, type KitBriefId } from '@/lib/kit/studio'
import {
  COLLARS,
  COLOUR_NAME,
  NAMESETS,
  PATTERNS,
  SLEEVES,
  type CollarId,
  type KitColour,
  type KitSpec,
  type NamesetId,
  type PatternId,
  type SleeveId,
} from '@/lib/kit/spec'

type Tab = 'rack' | 'colors' | 'pattern' | 'sleeves' | 'collar' | 'maker' | 'sponsor' | 'crest' | 'nameset'
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'rack', label: 'DNA' },
  { id: 'colors', label: 'צבעים' },
  { id: 'pattern', label: 'עיצוב' },
  { id: 'sleeves', label: 'שרוולים' },
  { id: 'collar', label: 'צווארון' },
  { id: 'maker', label: 'מלבישה' },
  { id: 'sponsor', label: 'ספונסר' },
  { id: 'crest', label: 'סמל' },
  { id: 'nameset', label: 'מספרים' },
]

const CORE_COLOURS: KitColour[] = ['red', 'deep', 'cream', 'paper', 'ink', 'navy', 'concrete']
const CREATIVE_SPONSORS: Array<string | null> = [null, 'THE WORKER', 'HAPOEL', '1923']

function unique<T>(rows: T[]): T[] { return [...new Set(rows)] }
function cssColour(value: KitColour): string {
  return { red: '#d52b1e', deep: '#b81c14', cream: '#eee4d2', paper: '#fff', ink: '#171717', navy: '#183153', concrete: '#aaa' }[value]
}

export function KitDesignerV3({ rack }: { rack: DnaRackItem[] }) {
  const collectionStore = useMemo(() => activeCollection(), [])
  const studioStore = useMemo(() => activeStudioStore(), [])
  const [collection, setCollection] = useState<Collection>({})
  const [saved, setSaved] = useState<SavedKitDesign[]>([])
  const [tab, setTab] = useState<Tab>('rack')
  const [briefId, setBriefId] = useState<KitBriefId>('free')
  const [spec, setSpec] = useState<KitSpec>(() => ({ ...(rack[0]?.spec ?? fallbackSpec()), seasonLabel: 'STUDIO', number: 10 }))
  const [dnaKeys, setDnaKeys] = useState<string[]>([])
  const [savedId, setSavedId] = useState<string | undefined>()
  const [referenceKey, setReferenceKey] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    let live = true
    void collectionStore.read().then((rows) => { if (live) setCollection(rows) })
    void studioStore.read().then((rows) => { if (live) setSaved(rows) })
    return () => { live = false }
  }, [collectionStore, studioStore])

  const unlocked = rack.filter((item) => Boolean(collection[kitKey(item.seasonLabel, item.variant)]))
  const dnaSpecs = unlocked.filter((item) => dnaKeys.includes(item.key)).map((item) => item.spec)
  const scoringDna = dnaSpecs.length ? dnaSpecs : unlocked.map((item) => item.spec)
  const metrics = scoreStudioDesign(spec, briefId, scoringDna)
  const currentReference = referenceKey ? rack.find((item) => item.key === referenceKey) ?? null : null

  const values = useMemo(() => ({
    patterns: unique(unlocked.map((item) => item.spec.pattern)),
    sleeves: unique(unlocked.map((item) => item.spec.sleeves)),
    collars: unique(unlocked.map((item) => item.spec.collar)),
    makers: unique(unlocked.map((item) => item.spec.makerHe).filter((v): v is string => Boolean(v))),
    sponsors: unique(unlocked.map((item) => item.spec.sponsorHe).filter((v): v is string => Boolean(v))),
    crests: unique(unlocked.map((item) => item.spec.crestKey).filter((v): v is string => Boolean(v))),
    namesets: unique(unlocked.map((item) => item.spec.nameset)),
  }), [unlocked])

  function update(patch: Partial<KitSpec>, sourceKey?: string) {
    setSpec((row) => ({ ...row, ...patch, seasonLabel: 'STUDIO' }))
    setSavedId(undefined)
    if (sourceKey) {
      setReferenceKey(sourceKey)
      setDnaKeys((keys) => unique([...keys, sourceKey]))
    }
    try { navigator.vibrate?.(7) } catch {}
  }

  function sourceFor(predicate: (row: DnaRackItem) => boolean): DnaRackItem | null {
    return unlocked.find((row) => predicate(row) && row.photoSrc) ?? unlocked.find(predicate) ?? null
  }

  async function save() {
    const savedDesign = await studioStore.save({ id: savedId, briefId, spec, dnaKeys, metrics, stamp: metrics.overall >= 82 })
    setSavedId(savedDesign.id)
    setSaved(await studioStore.read())
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1300)
  }

  function load(row: SavedKitDesign) {
    setSpec(row.spec)
    setBriefId(row.briefId)
    setDnaKeys(row.dnaKeys)
    setSavedId(row.id)
    setTab('colors')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-2 flex items-start justify-between gap-3 border-b-rule border-ink pb-2">
        <div>
          <p className="font-body text-[10px] font-black tracking-[.16em] text-red">שער 5 · DNA STUDIO</p>
          <h2 className="font-display text-[clamp(28px,7vw,52px)] leading-none text-ink">בנה חולצה מההיסטוריה</h2>
        </div>
        <div className="text-end">
          <p className="font-poster text-[26px] leading-none text-ink">{metrics.overall}</p>
          <p className="font-body text-[9px] text-muted">STUDIO SCORE</p>
        </div>
      </div>

      <div className="-mx-gutter overflow-x-auto px-gutter pb-1 lg:mx-0 lg:px-0">
        <div className="flex min-w-max gap-1">
          {TABS.map((row) => <button key={row.id} type="button" onClick={() => setTab(row.id)} className={`min-h-[42px] border-hair px-3 font-body text-[11px] font-black ${tab === row.id ? 'border-red bg-red text-paper' : 'border-ink/35 bg-paper text-ink'}`}>{row.label}</button>)}
        </div>
      </div>

      <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(280px,410px)_1fr] lg:items-start">
        <section className="border-rule border-ink bg-sheet p-2 lg:sticky lg:top-16">
          <div className="relative mx-auto h-[min(48vh,440px)] min-h-[300px] w-full">
            <KitAssemblyShirt spec={spec} className="h-full w-full" title="החולצה שלי" />
          </div>
          {currentReference?.photoSrc && (
            <div className="mt-1.5 flex items-center gap-2 border-hair border-ink/30 bg-paper p-1.5">
              <img src={currentReference.photoSrc} alt="" className="h-16 w-14 object-contain" />
              <p className="min-w-0 font-body text-[10px] leading-tight text-muted">DNA אחרון: <bdi className="font-black text-ink">{currentReference.seasonLabel}</bdi><br />{currentReference.photoSourceTitle ?? 'ארכיון החולצות'}</p>
            </div>
          )}
          <MetricStrip metrics={metrics} />
          <p className="mt-2 border-t-hair border-ink/20 pt-2 font-body text-[11px] font-bold leading-snug text-ink">“{supporterFeedback(metrics)}”</p>
          <button type="button" onClick={save} className="mt-2 min-h-[50px] w-full border-rule border-ink bg-ink font-display text-[19px] text-paper">{savedFlash ? 'נשמר ✓' : savedId ? 'עדכן עיצוב' : 'שמור עיצוב'}</button>
        </section>

        <section className="min-w-0 border-rule border-ink bg-paper p-2.5">
          {tab === 'rack' && <RackPanel rack={rack} unlocked={unlocked} collection={collection} dnaKeys={dnaKeys} onChoose={(item) => { setSpec({ ...item.spec, seasonLabel: 'STUDIO', number: 10 }); setReferenceKey(item.key); setDnaKeys((keys) => unique([...keys, item.key])); setTab('colors') }} />}
          {tab === 'colors' && <ColorsPanel spec={spec} onBase={(value) => update({ base: value }, sourceFor((row) => row.spec.base === value)?.key)} onSecondary={(value) => update({ patternInk: value }, sourceFor((row) => row.spec.patternInk === value)?.key)} />}
          {tab === 'pattern' && <VisualHistoryPanel title="עיצוב" rows={(values.patterns.length ? values.patterns : ['solid', 'stripe-wide', 'pinstripe'] as PatternId[]).map((value) => ({ value, label: PATTERNS.find((p) => p.id === value)?.he ?? value, source: sourceFor((row) => row.spec.pattern === value) }))} active={spec.pattern} kind="pattern" onChoose={(value, source) => update({ pattern: value as PatternId }, source?.key)} />}
          {tab === 'sleeves' && <VisualHistoryPanel title="שרוולים" rows={(values.sleeves.length ? values.sleeves : ['plain', 'cuff'] as SleeveId[]).map((value) => ({ value, label: SLEEVES.find((p) => p.id === value)?.he ?? value, source: sourceFor((row) => row.spec.sleeves === value) }))} active={spec.sleeves} kind="sleeve" onChoose={(value, source) => update({ sleeves: value as SleeveId, sleeveInk: spec.patternInk }, source?.key)} />}
          {tab === 'collar' && <VisualHistoryPanel title="צווארון" rows={(values.collars.length ? values.collars : ['crew', 'v-neck'] as CollarId[]).map((value) => ({ value, label: COLLARS.find((p) => p.id === value)?.he ?? value, source: sourceFor((row) => row.spec.collar === value) }))} active={spec.collar} kind="collar" onChoose={(value, source) => update({ collar: value as CollarId, collarInk: spec.patternInk }, source?.key)} />}
          {tab === 'maker' && <MakerPanel rows={values.makers.map((value) => ({ value, source: sourceFor((row) => row.spec.makerHe === value) }))} active={spec.makerHe} onChoose={(value, source) => update({ makerHe: value }, source?.key)} />}
          {tab === 'sponsor' && <SponsorPanel rows={unique([...values.sponsors, ...CREATIVE_SPONSORS]).map((value) => ({ value, source: value ? sourceFor((row) => row.spec.sponsorHe === value) : null }))} active={spec.sponsorHe} onChoose={(value, source) => update({ sponsorHe: value }, source?.key)} />}
          {tab === 'crest' && <CrestPanel values={values.crests.length ? values.crests : ['worker-hapoel']} active={spec.crestKey} onChoose={(value) => update({ crestKey: value }, sourceFor((row) => row.spec.crestKey === value)?.key)} />}
          {tab === 'nameset' && <SimplePanel title="ערכת מספרים" rows={(values.namesets.length ? values.namesets : NAMESETS.map((row) => row.id)).map((value) => ({ value, label: NAMESETS.find((row) => row.id === value)?.he ?? value }))} active={spec.nameset} onChoose={(value) => update({ nameset: value as NamesetId })} />}

          <div className="mt-3 border-t-rule border-ink pt-3">
            <p className="font-body text-[10px] font-black tracking-[.14em] text-red">BRIEF</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {KIT_BRIEFS.map((brief) => <button key={brief.id} type="button" onClick={() => setBriefId(brief.id)} className={`min-h-tap border-hair px-2.5 font-body text-[10px] font-black ${briefId === brief.id ? 'border-ink bg-ink text-paper' : 'border-ink/30 bg-sheet text-ink'}`}>{brief.titleHe}</button>)}
            </div>
            <p className="mt-1.5 font-body text-[11px] leading-snug text-muted">{KIT_BRIEFS.find((row) => row.id === briefId)?.bodyHe}</p>
          </div>

          {saved.length > 0 && (
            <div className="mt-3 border-t-rule border-ink pt-3">
              <p className="font-body text-[10px] font-black tracking-[.14em] text-red">העיצובים שלי</p>
              <div className="mt-1 grid grid-cols-3 gap-1">
                {saved.slice(0, 6).map((row) => <button key={row.id} type="button" onClick={() => load(row)} className="border-hair border-ink/35 bg-sheet p-1"><KitAssemblyShirt spec={row.spec} className="mx-auto h-20 w-full" /><span className="block font-mono text-[9px] text-ink">{row.metrics.overall}</span></button>)}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function RackPanel({ rack, unlocked, collection, dnaKeys, onChoose }: { rack: DnaRackItem[]; unlocked: DnaRackItem[]; collection: Collection; dnaKeys: string[]; onChoose: (item: DnaRackItem) => void }) {
  return <div><PanelTitle title="ה־DNA שפתחת" sub={`${unlocked.length} מתוך ${rack.length} חולצות זמינות ליצירה`} />
    {unlocked.length === 0 ? <div className="border-rule border-ink bg-sheet p-4"><p className="font-display text-[22px] text-ink">עוד לא פתחת DNA</p><p className="mt-1 font-body text-[11px] text-muted">בנה חולצה בשער 4. ברגע שתשחזר אותה, הצבעים, הגזרה, הסמל, היצרן והספונסר שלה נפתחים כאן.</p><a href="/kits/build" className="mt-3 inline-block font-body text-[12px] font-black text-red underline">לשער 4 ←</a></div>
      : <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">{unlocked.map((item) => <button key={item.key} type="button" onClick={() => onChoose(item)} className={`border-rule p-1.5 text-start ${dnaKeys.includes(item.key) ? 'border-red bg-red text-paper' : 'border-ink bg-sheet text-ink'}`}>{item.photoSrc ? <img src={item.photoSrc} alt="" className="h-28 w-full bg-paper object-contain" /> : <KitAssemblyShirt spec={item.spec} historical className="h-28 w-full bg-paper" />}<span className="mt-1 block font-poster text-[14px] leading-none">{item.seasonLabel}</span><span className="block font-body text-[9px] opacity-70">{collection[item.key]?.bestCategories ?? 0}/8 בשחזור</span></button>)}</div>}
  </div>
}

function ColorsPanel({ spec, onBase, onSecondary }: { spec: KitSpec; onBase: (v: KitColour) => void; onSecondary: (v: KitColour) => void }) {
  return <div><PanelTitle title="צבעים" sub="בסיס + צבע משני. שניהם נפרדים כדי שהדגם יישאר בשליטתך." /><p className="mt-2 font-body text-[11px] font-black">צבע בסיס</p><div className="mt-1 grid grid-cols-4 gap-1.5 sm:grid-cols-7">{CORE_COLOURS.map((colour) => <ColourButton key={colour} colour={colour} active={spec.base === colour} onClick={() => onBase(colour)} />)}</div><p className="mt-3 font-body text-[11px] font-black">צבע משני</p><div className="mt-1 grid grid-cols-4 gap-1.5 sm:grid-cols-7">{CORE_COLOURS.map((colour) => <ColourButton key={colour} colour={colour} active={spec.patternInk === colour} onClick={() => onSecondary(colour)} />)}</div></div>
}
function ColourButton({ colour, active, onClick }: { colour: KitColour; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`min-h-[70px] border-rule p-1.5 text-start ${active ? 'border-red bg-red text-paper' : 'border-ink bg-sheet text-ink'}`}><span className="block h-9 border-hair border-ink/40" style={{ background: cssColour(colour) }} /><span className="mt-1 block font-body text-[9px] font-black">{COLOUR_NAME[colour]}</span></button> }

type VisualRow = { value: string; label: string; source: DnaRackItem | null }
function VisualHistoryPanel({ title, rows, active, kind, onChoose }: { title: string; rows: VisualRow[]; active: string; kind: 'pattern' | 'sleeve' | 'collar'; onChoose: (value: string, source: DnaRackItem | null) => void }) {
  return <div><PanelTitle title={title} sub="כשיש תצלום אמיתי, זו החתיכה שממנה הבחירה נלמדת." /><div className="mt-2 grid grid-cols-3 gap-1.5">{rows.map((row) => <button key={row.value} type="button" onClick={() => onChoose(row.value, row.source)} className={`overflow-hidden border-rule text-start ${active === row.value ? 'border-red bg-red text-paper' : 'border-ink bg-sheet text-ink'}`}>{row.source?.photoSrc ? <KitPhotoPart src={row.source.photoSrc} kind={kind} label={row.label} className="h-[92px] w-full" /> : <span className="flex h-[92px] items-center justify-center bg-paper font-display text-[30px] text-ink">{kind === 'pattern' ? '▥' : kind === 'collar' ? '⌄' : '⌁'}</span>}<span className="block px-2 py-1.5 font-body text-[10px] font-black">{row.label}</span>{row.source && <span className="block px-2 pb-1 font-mono text-[8px] opacity-65">DNA {row.source.seasonLabel}</span>}</button>)}</div></div>
}

function MakerPanel({ rows, active, onChoose }: { rows: Array<{ value: string; source: DnaRackItem | null }>; active: string | null; onChoose: (v: string, source: DnaRackItem | null) => void }) { return <div><PanelTitle title="לוגו מלבישה" sub="בחירה נפרדת. אם אין לנו cut נקי, הכרטיס משתמש ישירות בחיתוך מהחולצה האמיתית — לא ממציא לוגו." /><div className="mt-2 grid grid-cols-3 gap-1.5">{rows.map(({ value, source }) => { const asset = makerAssetForName(value, source?.seasonLabel); return <button key={value} type="button" onClick={() => onChoose(value, source)} className={`min-h-[112px] border-rule p-2 ${active === value ? 'border-red bg-red text-paper' : 'border-ink bg-sheet text-ink'}`}><span className="flex h-16 items-center justify-center bg-paper">{asset ? <MarkArtwork asset={asset} className="h-11 w-[80%]" /> : source?.photoSrc ? <KitPhotoPart src={source.photoSrc} kind="maker" label={value} className="h-full w-full" /> : <span className="font-latin text-[13px] font-black text-ink">{value}</span>}</span><span className="mt-1 block font-body text-[10px] font-black">{value}</span>{source && <span className="block font-mono text-[8px] opacity-65">DNA {source.seasonLabel}</span>}</button> })}</div>{rows.length === 0 && <LockedNotice />}</div> }

function SponsorPanel({ rows, active, onChoose }: { rows: Array<{ value: string | null; source: DnaRackItem | null }>; active: string | null; onChoose: (v: string | null, source: DnaRackItem | null) => void }) { return <div><PanelTitle title="ספונסר" sub="הספונסר נשמר בפרופורציה שלו. כשאין cut נקי, רואים את אזור החזה מהמקור ההיסטורי עצמו." /><div className="mt-2 grid grid-cols-3 gap-1.5">{rows.map(({ value, source }) => { const asset = sponsorAssetForName(value); const key = value ?? 'none'; return <button key={key} type="button" onClick={() => onChoose(value, source)} className={`min-h-[112px] border-rule p-2 ${active === value ? 'border-red bg-red text-paper' : 'border-ink bg-sheet text-ink'}`}><span className="flex h-16 items-center justify-center bg-paper">{asset ? <MarkArtwork asset={asset} className="h-12 w-[88%]" /> : source?.photoSrc ? <KitPhotoPart src={source.photoSrc} kind="sponsor" label={value ?? 'ללא'} className="h-full w-full" /> : <span className="font-latin text-[12px] font-black text-ink">{value ?? 'NO SPONSOR'}</span>}</span><span className="mt-1 block truncate font-body text-[9.5px] font-black">{value ?? 'ללא ספונסר'}</span>{source && <span className="block font-mono text-[8px] opacity-65">DNA {source.seasonLabel}</span>}</button> })}</div></div> }

function CrestPanel({ values, active, onChoose }: { values: string[]; active: string | null; onChoose: (v: string) => void }) { return <div><PanelTitle title="סמל" sub="רק סמלים אמיתיים מהארכיון. אותו asset משמש במשחק ובחולצה." /><div className="mt-2 grid grid-cols-3 gap-1.5">{values.map((value) => { const art = crestArt(value, false); const mark = crestMark(value); return <button key={value} type="button" onClick={() => onChoose(value)} className={`min-h-[116px] border-rule p-2 ${active === value ? 'border-red bg-red text-paper' : 'border-ink bg-sheet text-ink'}`}><span className="flex h-16 items-center justify-center bg-paper">{art && <img src={art} alt="" className="max-h-14 max-w-[70%] object-contain" />}</span><span className="mt-1 block font-body text-[9.5px] font-black">{mark?.nameHe ?? 'סמל'}</span><span className="block font-body text-[8px] opacity-65">{mark?.tellHe}</span></button> })}</div></div> }

function SimplePanel({ title, rows, active, onChoose }: { title: string; rows: Array<{ value: string; label: string }>; active: string; onChoose: (v: string) => void }) { return <div><PanelTitle title={title} sub="הפרט האחרון לפני ששומרים את החולצה." /><div className="mt-2 grid grid-cols-3 gap-1.5">{rows.map((row) => <button key={row.value} type="button" onClick={() => onChoose(row.value)} className={`min-h-[80px] border-rule px-2 ${active === row.value ? 'border-red bg-red text-paper' : 'border-ink bg-sheet text-ink'}`}><span className="font-poster text-[26px]">10</span><span className="block font-body text-[10px] font-black">{row.label}</span></button>)}</div></div> }
function PanelTitle({ title, sub }: { title: string; sub: string }) { return <div className="border-b-hair border-ink/25 pb-2"><h3 className="font-display text-[26px] leading-none text-ink">{title}</h3><p className="mt-1 font-body text-[10.5px] leading-snug text-muted">{sub}</p></div> }
function LockedNotice() { return <div className="mt-2 border-hair border-ink/35 bg-sheet p-3 font-body text-[11px] text-muted">צריך לפתוח חולצות בשער 4 כדי לקבל את ה־DNA הזה.</div> }
function MetricStrip({ metrics }: { metrics: ReturnType<typeof scoreStudioDesign> }) { const rows = [['זהות', metrics.identity], ['בריף', metrics.briefFit], ['מקוריות', metrics.originality], ['איזון', metrics.coherence], ['DNA', metrics.dnaUse]] as const; return <div className="mt-2 grid grid-cols-5 gap-px bg-ink">{rows.map(([label, value]) => <div key={label} className="bg-paper px-1 py-1.5 text-center"><span className="block font-poster text-[15px] leading-none text-ink">{value}</span><span className="block font-body text-[7.5px] text-muted">{label}</span></div>)}</div> }
function fallbackSpec(): KitSpec { return { seasonLabel: 'STUDIO', variant: 'home', base: 'red', pattern: 'solid', patternInk: 'cream', sleeves: 'plain', sleeveInk: 'red', collar: 'crew', collarInk: 'cream', sponsorHe: null, makerHe: null, nameset: 'block-solid', number: 10, shorts: 'red', socks: 'red', crestKey: 'worker-hapoel' } }
