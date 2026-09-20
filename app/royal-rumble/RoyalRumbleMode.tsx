'use client'

import { useState } from 'react'

import type { RoyalRumbleDraft } from '@/lib/game/royal-rumble'
import type { KitSpec } from '@/lib/kit/spec'
import { t } from '@/lib/royal-rumble/i18n'
import { RoyalRumbleLiveRun } from './RoyalRumbleLiveRun'
import { RoyalRumbleRun } from './RoyalRumbleRun'

type EraKit = { seasonLabel: string; spec: KitSpec }

export function RoyalRumbleMode({
  draft,
  shuffleDraft,
  matchSeed,
  cursor,
  playerCount,
  kits,
  initialRoomCode,
}: {
  draft: RoyalRumbleDraft
  shuffleDraft: RoyalRumbleDraft
  matchSeed: number
  cursor: number
  playerCount: number
  kits: EraKit[]
  initialRoomCode?: string
}) {
  const [mode, setMode] = useState<'solo' | 'live'>(initialRoomCode ? 'live' : 'solo')

  return (
    <div>
      <nav className="mx-auto mb-2 grid max-w-5xl grid-cols-2 border-rule border-ink bg-paper" aria-label={t('modeTitle')}>
        <button
          type="button"
          onClick={() => setMode('solo')}
          aria-pressed={mode === 'solo'}
          className={`min-h-tap border-e-hair border-ink px-3 py-1 text-start transition ${mode === 'solo' ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-sheet'}`}
        >
          <span className="block font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-red" dir="ltr">SOLO</span>
          <span className="font-display text-[18px] sm:text-[23px]">{t('soloMode')}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('live')}
          aria-pressed={mode === 'live'}
          className={`min-h-tap px-3 py-1 text-start transition ${mode === 'live' ? 'bg-red text-paper' : 'bg-paper text-ink hover:bg-sheet'}`}
        >
          <span className={`block font-mono tabular-nums text-[8px] font-black tracking-[0.18em] ${mode === 'live' ? 'text-paper/65' : 'text-red'}`} dir="ltr">LIVE H2H</span>
          <span className="font-display text-[18px] sm:text-[23px]">{t('liveMode')}</span>
        </button>
      </nav>

      {mode === 'solo' ? (
        <RoyalRumbleRun
          draft={draft}
          shuffleDraft={shuffleDraft}
          cursor={cursor}
          playerCount={playerCount}
          kits={kits}
        />
      ) : (
        <div className="mx-auto max-w-5xl pb-8">
          <RoyalRumbleLiveRun
            draft={draft}
            shuffleDraft={shuffleDraft}
            matchSeed={matchSeed}
            kits={kits}
            initialRoomCode={initialRoomCode}
          />
        </div>
      )}
    </div>
  )
}
