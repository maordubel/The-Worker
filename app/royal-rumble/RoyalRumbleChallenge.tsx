'use client'

import { useState } from 'react'

export function RoyalRumbleChallenge({ seed }: { seed: number }) {
  const [state, setState] = useState<'idle' | 'copied' | 'shared'>('idle')
  const code = String(seed >>> 0).padStart(8, '0').slice(-8)

  async function share() {
    const url = new URL('/royal-rumble', window.location.origin)
    url.searchParams.set('seed', String(seed >>> 0))
    const text = `רויאל ראמבל #${code} — אותם שחקנים, אותה יריבה. בוא נראה איזו חמישיית הפועל אתה בונה ב־€15M.`

    try {
      if (navigator.share) {
        await navigator.share({ title: 'The Worker · Royal Rumble', text, url: url.toString() })
        setState('shared')
      } else {
        await navigator.clipboard.writeText(`${text}\n${url.toString()}`)
        setState('copied')
      }
    } catch {
      // Cancelling a native share sheet is not an error state worth showing.
    }
  }

  return (
    <aside className="relative mx-auto mt-3 max-w-5xl overflow-hidden border-rule border-ink bg-paper text-ink">
      <div className="absolute inset-y-0 left-0 w-2 bg-red" />
      <div className="absolute -left-3 -top-9 font-poster text-[120px] leading-none text-ink/[0.035]" dir="ltr">09</div>
      <div className="relative grid gap-3 p-3 pl-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-4 sm:pl-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-latin text-[8px] font-black tracking-[0.22em] text-red" dir="ltr">SAME RUMBLE · SAME ENEMY</span>
            <span className="border-hair border-ink/20 px-2 py-0.5 font-latin text-[9px] font-black tracking-[0.12em]" dir="ltr">#{code}</span>
          </div>
          <h2 className="mt-1 font-poster text-[24px] leading-none sm:text-[29px]">תן לחבר בדיוק את אותו ראמבל.</h2>
          <p className="mt-1 max-w-2xl font-body text-[9px] leading-relaxed text-concrete sm:text-[10px]">
            אותם 15 מועמדים, אותה יריבה, אותו תקציב. רק ההחלטות משתנות. עכשיו אפשר להתווכח על החמישייה — לא על ההגרלה.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void share()}
          className="group flex min-h-[48px] min-w-[190px] items-center justify-between border-rule border-red bg-red px-4 text-paper transition hover:bg-ink"
        >
          <span>
            <span className="block font-latin text-[7px] font-black tracking-[0.18em] text-paper/60" dir="ltr">CHALLENGE A FRIEND</span>
            <span className="font-poster text-[20px]">
              {state === 'copied' ? 'הלינק הועתק' : state === 'shared' ? 'נשלח. עכשיו שיבנה.' : 'שלח את הראמבל'}
            </span>
          </span>
          <span className="font-poster text-[30px] transition group-hover:-translate-x-1">←</span>
        </button>
      </div>
    </aside>
  )
}
