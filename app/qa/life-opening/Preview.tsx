'use client'

import { useState } from 'react'

import { OpeningSequence } from '@/components/life/OpeningSequence'
import type { HistoricalAnchor } from '@/lib/life/anchors'

/** The client half: the sequence needs a handler, and a server component may not pass one. */
export function Preview({ anchor }: { anchor: HistoricalAnchor }) {
  const [run, setRun] = useState(0)
  const [over, setOver] = useState(false)
  if (over) {
    return (
      <div dir="rtl" className="flex h-full flex-col items-center justify-center gap-5 bg-ink text-center">
        <p className="font-body text-[13px] text-concrete/60">הפתיח נגמר. במשחק, מכאן מתחיל הפרולוג.</p>
        <button
          type="button"
          onClick={() => {
            setOver(false)
            setRun((n) => n + 1)
          }}
          className="flex min-h-tap items-center border-hair border-concrete/40 px-5 font-body text-[13px] text-sheet"
        >
          שוב
        </button>
      </div>
    )
  }
  return <OpeningSequence key={run} anchor={anchor} onDone={() => setOver(true)} />
}
