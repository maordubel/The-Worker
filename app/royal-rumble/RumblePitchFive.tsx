'use client'

import type { KitSpec } from '@/lib/kit/spec'
import { compactName } from '@/lib/game/roster-search'
import type { RumbleSide, RumbleVisualPlayer } from '@/lib/game/royal-rumble-presentation'

import { RumbleShirt } from './RumbleShirt'

type EraKit = { seasonLabel: string; spec: KitSpec }

/** a slot on the vertical pitch: ours attack UP from the bottom half, theirs DOWN from the top */
export function screenPos(player: Pick<RumbleVisualPlayer, 'x' | 'y' | 'side'>): { x: number; y: number } {
  return player.side === 'us' ? { x: player.x, y: 50 + player.y / 2 } : { x: 100 - player.x, y: 50 - player.y / 2 }
}

/** where the ball ends up when a side scores: the goal it attacks */
export function goalPos(side: RumbleSide): { x: number; y: number } {
  return side === 'us' ? { x: 50, y: 1 } : { x: 50, y: 99 }
}

function Token({
  player,
  kits,
  shown,
  active,
  pulse,
}: {
  player: RumbleVisualPlayer
  kits: EraKit[]
  shown: boolean
  active: boolean
  pulse: boolean
}) {
  const at = screenPos(player)
  const ours = player.side === 'us'
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ insetInlineStart: `${at.x}%`, top: `${at.y}%` }}
      data-rumble-token={`${player.side}:${player.slug}`}
    >
      {/* transform-only: the man is drawn, then scaled in — no opacity, no layout */}
      <div className={`flex flex-col items-center transition-transform duration-300 ease-out motion-reduce:transition-none ${shown ? 'scale-100' : 'scale-0'}`}>
        <div
          className={`flex h-[46px] w-[42px] items-center justify-center border-2 sm:h-[54px] sm:w-[50px] ${
            ours ? 'border-red bg-ink/40' : 'border-paper/70 bg-ink'
          } ${active ? 'scale-110' : ''} ${pulse ? 'rr-pulse' : ''}`}
        >
          <RumbleShirt player={player.player} kits={kits} className="h-9 w-8 sm:h-11 sm:w-10" />
        </div>
        <div className={`mt-0.5 max-w-[68px] truncate border-hair px-1 text-center font-body text-[9px] font-bold leading-[1.35] text-paper sm:max-w-[88px] sm:text-[11px] ${ours ? 'border-red bg-red' : 'border-paper/30 bg-ink'}`}>
          {compactName(player.nameHe)}
        </div>
        <span className="font-mono tabular-nums text-[7px] font-black tracking-[0.14em] text-paper/70" dir="ltr">{player.position}</span>
      </div>
    </div>
  )
}

/**
 * The pitch both fives stand on (delta 99). Entrance, head-to-head and the match itself
 * all draw THIS — one pitch, so a man stands in the same place the whole show.
 */
export function RumblePitchFive({
  us,
  them,
  usCount,
  themCount,
  kits,
  activeSlug,
  ball,
  pulse = false,
  className = '',
  children,
}: {
  us: RumbleVisualPlayer[]
  them: RumbleVisualPlayer[]
  usCount: number
  themCount: number
  kits: EraKit[]
  activeSlug?: { side: RumbleSide; slug: string } | null
  ball?: { x: number; y: number } | null
  /** the fifth man is in: the whole five breathes once */
  pulse?: boolean
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`relative mx-auto aspect-[4/5] w-full max-w-[460px] overflow-hidden border-2 border-paper/65 bg-sign ${className}`} data-rumble="pitch">
      <div className="absolute inset-x-0 top-1/2 h-px bg-paper/55" />
      <div className="absolute start-1/2 top-1/2 aspect-square h-[22%] -translate-x-1/2 -translate-y-1/2 border border-paper/55" />
      <div className="absolute inset-x-[24%] top-0 h-[16%] border-x border-b border-paper/55" />
      <div className="absolute inset-x-[24%] bottom-0 h-[16%] border-x border-t border-paper/55" />
      {us.map((player, index) => (
        <Token
          key={`us-${player.slug}`}
          player={player}
          kits={kits}
          shown={index < usCount}
          active={activeSlug?.side === 'us' && activeSlug.slug === player.slug}
          pulse={pulse}
        />
      ))}
      {them.map((player, index) => (
        <Token
          key={`them-${player.slug}`}
          player={player}
          kits={kits}
          shown={index < themCount}
          active={activeSlug?.side === 'them' && activeSlug.slug === player.slug}
          pulse={false}
        />
      ))}
      {ball && (
        <div
          className="absolute z-30 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-ink bg-paper transition-[inset-inline-start,top] duration-500 ease-out motion-reduce:transition-none"
          style={{ insetInlineStart: `${ball.x}%`, top: `${ball.y}%` }}
          aria-hidden="true"
        />
      )}
      {children}
      <style>{`@keyframes rrPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}.rr-pulse{animation:rrPulse .7s ease-in-out 1}@media (prefers-reduced-motion:reduce){.rr-pulse{animation:none}}`}</style>
    </div>
  )
}
