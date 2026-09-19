'use client'

import { useState } from 'react'

import { t } from '@/lib/royal-rumble/i18n'

export function RoyalRumbleChallenge({ seed }: { seed: number }) {
  const [state, setState] = useState<'idle' | 'copied' | 'shared'>('idle')
  const code = String(seed >>> 0).padStart(8, '0').slice(-8)

  async function share() {
    const url = new URL('/royal-rumble', window.location.origin)
    url.searchParams.set('seed', String(seed >>> 0))
    const text = t('challengeText', { code })

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

  const action =
    state === 'copied'
      ? t('challengeCopied')
      : state === 'shared'
        ? t('challengeShared')
        : t('challengeShare')

  return (
    <aside className="relative mx-auto mt-3 max-w-5xl overflow-hidden border-rule border-ink bg-paper text-ink">
      <div className="absolute inset-y-0 start-0 w-2 bg-red" />
      <div className="absolute -start-3 -top-9 font-display text-[120px] leading-none text-ink/5" dir="ltr">09</div>
      <div className="relative grid gap-3 p-3 ps-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-4 sm:ps-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono tabular-nums text-[8px] font-black tracking-[0.22em] text-red" dir="ltr">SAME RUMBLE · SAME ENEMY</span>
            <span className="border-hair border-ink/20 px-2 py-0.5 font-mono tabular-nums text-[9px] font-black tracking-[0.12em]" dir="ltr">#{code}</span>
          </div>
          <h2 className="mt-1 font-display text-[24px] leading-none sm:text-[29px]">{t('challengeTitle')}</h2>
          <p className="mt-1 max-w-2xl font-body text-[9px] leading-relaxed text-concrete sm:text-[10px]">
            {t('challengeBody')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void share()}
          className="group flex min-h-tap min-w-[190px] items-center justify-between border-rule border-red bg-red px-4 text-paper transition hover:bg-ink"
        >
          <span>
            <span className="block font-mono tabular-nums text-[7px] font-black tracking-[0.18em] text-paper/60" dir="ltr">CHALLENGE A FRIEND</span>
            <span className="font-display text-[20px]">{action}</span>
          </span>
          <span className="font-display text-[30px] transition group-hover:-translate-x-1">←</span>
        </button>
      </div>
    </aside>
  )
}
