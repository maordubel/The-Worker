'use client'

import { useRef, useState } from 'react'
import { LayeredKitRenderer } from '@/components/kit/LayeredKitRenderer'
import { V13_2009_10, type LayerAsset, type LayeredKitStep } from '@/lib/kit/layered-assets'

type Selected = Partial<Record<LayeredKitStep, string>>
const ORDER: readonly LayeredKitStep[] = ['body', 'construction', 'crest', 'maker', 'sponsor']
const LABEL: Record<LayeredKitStep, string> = { body: 'גוף', construction: 'גזרה', crest: 'סמל', maker: 'מלבישה', sponsor: 'ספונסר' }
const PROMPT: Record<LayeredKitStep, string> = {
  body: 'איך נראה גוף החולצה?', construction: 'איזו גזרה הייתה לה?', crest: 'איזה סמל היה על החזה?', maker: 'מי הלבישה את הפועל?', sponsor: 'מי היה על החזה?',
}

export function KitGameRunV13() {
  const kit = V13_2009_10
  const [stepIndex, setStepIndex] = useState(0)
  const [selected, setSelected] = useState<Selected>({})
  const [reveal, setReveal] = useState(false)
  const [info, setInfo] = useState<LayerAsset | null>(null)
  const hold = useRef<number | null>(null)
  const step = ORDER[stepIndex]
  const options = kit.steps[step] as readonly LayerAsset[]

  function pick(option: LayerAsset) {
    const next = { ...selected, [step]: option.id }
    setSelected(next)
    if (stepIndex === ORDER.length - 1) window.setTimeout(() => setReveal(true), 220)
    else window.setTimeout(() => setStepIndex((i) => i + 1), 160)
  }

  function startHold(option: LayerAsset) {
    hold.current = window.setTimeout(() => setInfo(option), 520)
  }
  function cancelHold() { if (hold.current) window.clearTimeout(hold.current) }

  if (reveal) {
    const right = ORDER.filter((key) => selected[key] === kit.truth[key]).length
    return (
      <div className="mx-auto flex h-[100dvh] max-w-[430px] flex-col overflow-hidden bg-paper px-gutter pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(10px,env(safe-area-inset-top))]">
        <Header />
        <h2 className="mt-2 text-center font-display text-[34px] leading-none text-red">יפה! זאת החולצה</h2>
        <p className="mb-2 mt-1 text-center font-body text-[12px] font-extrabold">התמונה האמיתית נחשפת רק עכשיו</p>
        <div className="grid min-h-0 flex-1 grid-cols-2 border-y-rule border-ink">
          <figure className="m-0 flex min-w-0 flex-col border-e-hair border-ink"><figcaption className="bg-sheet py-1.5 text-center font-body text-[11px] font-black">שלך</figcaption><div className="min-h-0 flex-1 p-1"><LayeredKitRenderer selected={selected} showBadge className="h-full w-full" /></div></figure>
          <figure className="m-0 flex min-w-0 flex-col"><figcaption className="bg-sheet py-1.5 text-center font-body text-[11px] font-black">המקור</figcaption><div className="min-h-0 flex-1 p-1"><img src={kit.revealSrc} alt="החולצה המקורית" className="h-full w-full object-contain" /></div></figure>
        </div>
        <div className="flex items-baseline justify-center gap-2 py-2"><b className="font-display text-[48px] leading-none text-red" dir="ltr">{right}/5</b><span className="font-body text-[18px] font-black">{right === 5 ? 'כל הכבוד!' : 'כמעט!'}</span></div>
        <div className="grid grid-cols-5 border-hair border-ink/40">{ORDER.map((key) => <div key={key} className="border-e-hair border-ink/30 py-1 text-center font-body text-[8px] font-black last:border-e-0"><b className={selected[key] === kit.truth[key] ? 'block text-[18px] text-[#276d38]' : 'block text-[18px] text-red'}>{selected[key] === kit.truth[key] ? '✓' : '×'}</b>{LABEL[key]}</div>)}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto grid h-[100dvh] max-w-[430px] grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] gap-2 overflow-hidden bg-paper px-gutter pb-[max(10px,env(safe-area-inset-bottom))] pt-[max(8px,env(safe-area-inset-top))]">
      <Header />
      <div className="grid grid-cols-[44px_1fr_50px] items-center gap-2"><span className="font-display text-[28px] font-black text-red" dir="ltr">{stepIndex + 1}/5</span><div className="grid grid-cols-5 gap-1">{ORDER.map((_, i) => <i key={i} className={`h-2 ${i <= stepIndex ? 'bg-red' : 'bg-ink/15'}`} />)}</div><b className="text-left font-body text-[11px] text-muted">{LABEL[step]}</b></div>
      <main className="relative flex min-h-0 flex-col items-center justify-center border-b-rule border-ink"><div className="absolute inset-x-0 top-0 z-10 text-center"><h1 className="m-0 font-display text-[28px] leading-none text-red">{PROMPT[step]}</h1><p className="mt-1 font-body text-[11px] font-bold">בחר לפי הזיכרון. לא נגלה עד הסוף.</p></div><LayeredKitRenderer selected={selected} className="mt-8 h-[min(55dvh,470px)] w-auto max-w-full" /></main>
      <section><div className="mb-1 flex items-center justify-between"><strong className="font-display text-[20px]">בחר {LABEL[step]}</strong><span className="font-body text-[9px] text-muted">לחיצה ארוכה = מידע</span></div><div className="grid h-[144px] grid-cols-3 gap-2">{options.map((option) => <button key={option.id} type="button" onPointerDown={() => startHold(option)} onPointerUp={() => { cancelHold(); if (!info) pick(option) }} onPointerLeave={cancelHold} className="relative overflow-hidden border-hair border-ink/40 bg-sheet p-1 active:border-plate active:border-red"><ChoiceVisual step={step} selected={selected} option={option} /><span className="absolute inset-x-1 bottom-1 bg-sheet/90 px-1 py-0.5 font-body text-[9px] font-black">{option.labelHe}</span></button>)}</div></section>
      <footer className="flex items-center justify-between font-body text-[9px] text-muted"><span>הפועל תל־אביב · מאגר חולצות</span><b className="text-ink">{Object.keys(selected).length} חלקים הורכבו</b></footer>
      {info ? <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] border-t-plate border-red bg-sheet px-gutter pb-[calc(18px+env(safe-area-inset-bottom))] pt-4"><h2 className="font-display text-[24px]">{info.labelHe}</h2><p className="font-body text-[12px] leading-relaxed">הפריט נשמר במאגר כשכבה עצמאית: קובץ חתוך, תקופה, מקור ומיקום מדויק על החולצה.</p><button onClick={() => setInfo(null)} className="min-h-tap w-full border-rule border-ink font-body text-[12px] font-black">חזרה למשחק</button></div> : null}
    </div>
  )
}

function ChoiceVisual({ step, selected, option }: { step: LayeredKitStep; selected: Selected; option: LayerAsset }) {
  if (step === 'body' || step === 'construction') return <LayeredKitRenderer selected={{ ...selected, [step]: option.id }} className="h-full w-full" />
  return <img src={option.previewSrc ?? option.src} alt="" className="h-full w-full object-contain" />
}

function Header() { return <header className="flex items-end justify-between border-b-rule border-ink pb-1.5"><div><b className="font-display text-[28px] leading-none">2009/10 · בית</b><small className="block font-body text-[9px] text-muted">שער 4 · זוכרים חולצות</small></div><div dir="ltr" className="text-left"><b className="font-latin text-[19px] font-black">THE WORKER</b><small className="block text-right font-body text-[9px]">הבית של האדומים</small></div></header> }
