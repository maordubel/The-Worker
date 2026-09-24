'use client'

import { useState } from 'react'

import { firePickFxAt } from '@/components/stage/PickFx'
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
    <aside className="relative mx-auto mt-1.5 max-w-5xl shrink-0 overflow-hidden border-rule border-ink bg-paper text-ink md:mt-2">
      <div className="absolute inset-y-0 start-0 w-2 bg-red" />
      <div className="absolute -start-3 -top-9 hidden font-display text-[120px] leading-none text-ink/5 sm:block" dir="ltr">09</div>
      <div className="relative grid grid-cols-[1fr_auto] items-center gap-2 p-1.5 ps-3 sm:gap-3 sm:p-4 sm:ps-6">
        <div className="min-w-0">
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <span className="font-mono tabular-nums text-[8px] font-black tracking-[0.22em] text-red" dir="ltr">SAME RUMBLE · SAME ENEMY</span>
            <span className="border-hair border-ink/20 px-2 py-0.5 font-mono tabular-nums text-[9px] font-black tracking-[0.12em]" dir="ltr">#{code}</span>
          </div>
          <h2 className="truncate font-display text-[15px] leading-none sm:mt-1 sm:text-[29px]">{t('challengeTitle')}</h2>
          <p className="mt-1 hidden max-w-2xl font-body text-[9px] leading-relaxed text-concrete sm:block sm:text-[10px]">
            {t('challengeBody')}
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            void share()
            firePickFxAt(event.currentTarget, { tone: 'ink', haptic: 'tap' })
          }}
          className="group flex min-h-tap min-w-0 items-center justify-between border-rule border-red bg-red px-3 text-paper transition hover:bg-ink sm:px-4"
        >
          <span>
            <span className="hidden font-mono tabular-nums text-[7px] sm:block font-black tracking-[0.18em] text-paper/60" dir="ltr">CHALLENGE A FRIEND</span>
            <span className="font-display text-[14px] sm:text-[20px]">{action}</span>
          </span>
          <span className="font-display text-[20px] transition group-hover:-translate-x-1 sm:text-[26px]">←</span>
        </button>
      </div>
    </aside>
  )
}
