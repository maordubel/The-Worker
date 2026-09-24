'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'

import { KitShirt } from '@/components/kit/KitShirt'
import { RecordRun } from '@/components/play/RecordRun'
import { FitBox } from '@/components/stage/FitBox'
import { firePickFx, firePickFxAt } from '@/components/stage/PickFx'
import { SlideSheet } from '@/components/stage/SlideSheet'
import type {
  RoyalRumbleDraft,
  RoyalRumblePitchPlayer,
  RoyalRumblePublicPlayer,
  RoyalRumbleResult,
} from '@/lib/game/royal-rumble'
import type { KitSpec } from '@/lib/kit/spec'
import type { Embedded } from '@/lib/mechanics/types'
import { t } from '@/lib/royal-rumble/i18n'
import { submitRoyalRumble } from './actions'
import { RoyalRumbleSlotReveal } from './RoyalRumbleSlotReveal'

type Phase = 'draft' | 'reveal' | 'match' | 'result'
type EraKit = { seasonLabel: string; spec: KitSpec }

const POSITION_SHORT: Record<string, string> = {
  GK: 'GK',
  DF: 'DEF',
  MF: 'MID',
  FW: 'ATT',
}

function positionHe(position: string): string {
  if (position === 'GK') return t('goalkeeper')
  if (position === 'DF') return t('defence')
  if (position === 'MF') return t('midfield')
  return t('attack')
}

function money(value: number): string {
  return `€${value}M`
}

function yearRange(player: RoyalRumblePublicPlayer): string {
  if (player.fromYear === null && player.toYear === null) return t('activeYears')
  if (player.fromYear === player.toYear) return String(player.fromYear ?? '—')
  return `${player.fromYear ?? '—'}–${player.toYear ?? '—'}`
}

function seasonYear(label: string): number | null {
  const match = label.match(/(\d{4})/)
  return match ? Number(match[1]) : null
}

function kitForPlayer(player: RoyalRumblePublicPlayer, kits: EraKit[]): EraKit | null {
  if (kits.length === 0) return null
  const from = player.fromYear
  const to = player.toYear
  if (from === null && to === null) return null

  const start = from ?? to ?? 0
  const end = to ?? from ?? start
  const midpoint = (start + end) / 2
  const dated = kits
    .map((kit) => ({ kit, year: seasonYear(kit.seasonLabel) }))
    .filter((row): row is { kit: EraKit; year: number } => row.year !== null)

  const inside = dated.filter(({ year }) => year >= start && year <= end)
  const pool = inside.length > 0 ? inside : dated
  pool.sort((a, b) => Math.abs(a.year - midpoint) - Math.abs(b.year - midpoint))
  return pool[0]?.kit ?? null
}

function PriceBars({ price, inverted = false }: { price: number; inverted?: boolean }) {
  return (
    <div className="flex gap-1" aria-label={money(price)}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 flex-1 ${
            index < price
              ? inverted
                ? 'bg-paper'
                : 'bg-red'
              : inverted
                ? 'bg-ink/20'
                : 'bg-ink/10'
          }`}
        />
      ))}
    </div>
  )
}

function Shirt({
  player,
  kits,
  className,
}: {
  player: RoyalRumblePublicPlayer
  kits: EraKit[]
  className: string
}) {
  const specialSeason = (() => {
    const start = player.fromYear ?? player.toYear
    const end = player.toYear ?? player.fromYear
    if (start === null || start === undefined || end === null || end === undefined) return null
    if (start <= 1985 && end >= 1985) return { season: '1985/86', src: '/kits/assembly/1985-86/home-master.svg' }
    if (start <= 2009 && end >= 2009) return { season: '2009/10', src: '/kits/assembly/2009-10/home-master-a.svg' }
    return null
  })()
  if (specialSeason) {
    return (
      <div className="relative flex items-center justify-center overflow-visible">
        <img
          src={specialSeason.src}
          alt={t('kitSeason', { season: specialSeason.season })}
          className={`${className} scale-[1.08] object-contain`}
        />
        <span className="absolute bottom-0 end-0 border border-paper/20 bg-ink px-1.5 py-0.5 font-mono tabular-nums text-[6px] font-black tracking-[0.12em] text-paper" dir="ltr">
          {specialSeason.season}
        </span>
      </div>
    )
  }
  const kit = kitForPlayer(player, kits)
  if (!kit) return <div className={className} />
  return (
    <div className="relative flex items-center justify-center overflow-visible">
      <KitShirt
        spec={kit.spec}
        className={`${className} scale-[1.04]`}
        title={t('kitSeason', { season: kit.seasonLabel })}
      />
      <span className="absolute bottom-0 end-0 border border-ink/15 bg-paper px-1.5 py-0.5 font-mono tabular-nums text-[6px] font-black tracking-[0.12em] text-ink" dir="ltr">
        {kit.seasonLabel}
      </span>
    </div>
  )
}

function DraftCard({
  player,
  selected,
  disabled,
  onPick,
  index,
  kits,
}: {
  player: RoyalRumblePublicPlayer
  selected: boolean
  disabled: boolean
  onPick: (event: MouseEvent<HTMLButtonElement>) => void
  index: number
  kits: EraKit[]
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      aria-pressed={selected}
      className={`group relative h-full overflow-hidden border-rule p-0 text-start transition duration-200 active:translate-y-1 sm:min-h-[280px] ${
        selected
          ? 'translate-y-1 border-red bg-red text-paper'
          : 'border-ink bg-paper text-ink hover:-translate-y-1'
      } ${disabled ? 'cursor-not-allowed opacity-30 grayscale' : ''}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 ${selected ? 'bg-paper' : 'bg-red'}`} />
      <div className="absolute -start-3 -top-4 font-display text-[82px] leading-none text-ink/5 sm:text-[132px]" dir="ltr">
        {index + 1}
      </div>

      <div className="relative flex h-full flex-col p-2 sm:min-h-[280px] sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`font-mono tabular-nums text-[7px] font-black tracking-[0.18em] sm:text-[9px] ${selected ? 'text-paper/70' : 'text-red'}`} dir="ltr">
              ENTRY {String(index + 1).padStart(2, '0')}
            </p>
            <p className="mt-0.5 font-mono tabular-nums text-[8px] sm:text-[10px] font-black tracking-[0.12em]" dir="ltr">
              {POSITION_SHORT[player.position]}
            </p>
          </div>
          <div className="text-end">
            <p className={`font-display text-[21px] leading-none sm:text-[40px] ${selected ? 'text-paper' : 'text-red'}`} dir="ltr">
              {money(player.price)}
            </p>
            <p className={`mt-1 hidden font-body text-[8px] sm:block ${selected ? 'text-paper/55' : 'text-concrete'}`}>{t('priceEntry')}</p>
          </div>
        </div>

        <div className={`mx-auto mt-1 flex min-h-0 w-full flex-1 justify-center overflow-hidden border-y-hair py-1 ${selected ? 'border-paper/15 bg-transparent' : 'border-ink/10 bg-transparent'}`}>
          <Shirt player={player} kits={kits} className="h-full max-h-[108px] w-auto max-w-[94px] sm:h-[132px] sm:w-[116px]" />
        </div>

        <div className="mt-auto pt-1.5">
          <p className="truncate font-display text-[15px] leading-[0.92] sm:text-[29px]">{player.nameHe}</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <div>
              <p className={`hidden font-body text-[8px] sm:block ${selected ? 'text-paper/55' : 'text-concrete'}`}>{t('hapoelYears')}</p>
              <p className="font-mono tabular-nums text-[8px] font-black sm:text-[9px]" dir="ltr">{yearRange(player)}</p>
            </div>
            <span className={`hidden border-hair px-2 py-1 font-body text-[8px] font-black sm:inline-block ${selected ? 'border-paper/35' : 'border-ink/25'}`}>
              {positionHe(player.position)}
            </span>
          </div>
          <div className="mt-1.5"><PriceBars price={player.price} inverted={selected} /></div>
        </div>
      </div>

      {selected && (
        <div className="absolute inset-x-0 bottom-0 bg-ink py-1 text-center font-mono tabular-nums text-[9px] font-black tracking-[0.2em] text-paper" dir="ltr">
          IN THE FIVE
        </div>
      )}
    </button>
  )
}

function LineupRail({
  draft,
  picks,
  activeSlot,
  onEdit,
  kits,
}: {
  draft: RoyalRumbleDraft
  picks: Array<RoyalRumblePublicPlayer | null>
  activeSlot: number
  onEdit: (index: number) => void
  kits: EraKit[]
}) {
  return (
    <section className="relative overflow-hidden border-rule border-ink bg-ink p-1.5 text-paper sm:p-4">
      <div className="absolute inset-y-0 start-0 w-2 bg-red" />
      <div className="relative mb-1 flex items-end justify-between gap-3 ps-2 sm:mb-1.5">
        <div>
          <p className="font-mono tabular-nums text-[8px] font-black tracking-[0.2em] text-red sm:text-[9px]" dir="ltr">YOUR FIVE</p>
          <h3 className="hidden font-display text-[24px] leading-none sm:block">{t('lineupWall')}</h3>
        </div>
        <p className="hidden font-body text-[9px] text-paper/45 sm:block">{t('lineupEdit')}</p>
      </div>

      <div className="relative grid grid-cols-5 gap-1 ps-2 sm:gap-2">
        {draft.slots.map((slot, index) => {
          const player = picks[index]
          const active = activeSlot === index
          return (
            <button
              type="button"
              onClick={() => onEdit(index)}
              key={`${slot.position}-${index}`}
              className={`min-h-[44px] min-w-0 border-hair p-1 text-center transition ${
                active ? 'border-red bg-red text-paper' : player ? 'border-paper/25 bg-paper/5' : 'border-paper/10 bg-ink'
              }`}
            >
              <span className={`font-mono tabular-nums text-[7px] font-black tracking-[0.12em] ${active ? 'text-paper/75' : 'text-red'}`} dir="ltr">
                {POSITION_SHORT[slot.position]}
              </span>
              {player ? (
                <>
                  <div className="mx-auto mt-1 hidden h-12 items-center justify-center bg-transparent sm:flex">
                    <Shirt player={player} kits={kits} className="h-10 w-9" />
                  </div>
                  <p className="mt-1 truncate font-display text-[11px] leading-none sm:text-[16px]">{player.nameHe}</p>
                  <p className="hidden font-display text-[12px] text-paper/75 sm:mt-1 sm:block sm:text-[18px]" dir="ltr">{money(player.price)}</p>
                </>
              ) : (
                <p className="mt-1 font-display text-[16px] leading-none text-paper/15 sm:mt-2 sm:text-[24px]">?</p>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function FighterToken({
  player,
  publicPlayer,
  ours,
  kits,
}: {
  player: RoyalRumblePitchPlayer
  publicPlayer: RoyalRumblePublicPlayer | undefined
  ours: boolean
  kits: EraKit[]
}) {
  const first = player.nameHe.split(' ')[0] ?? player.nameHe
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
      style={{ insetInlineStart: `${player.x}%`, top: `${player.y}%` }}
      title={player.nameHe}
    >
      <div className={`mx-auto flex h-12 w-12 items-center justify-center border-2 sm:h-14 sm:w-14 ${ours ? 'border-red bg-transparent' : 'border-ink bg-transparent'}`}>
        {publicPlayer ? (
          <Shirt player={publicPlayer} kits={kits} className="h-10 w-9 sm:h-12 sm:w-11" />
        ) : (
          <span className="font-mono tabular-nums text-[8px] font-black text-ink">{first.slice(0, 2)}</span>
        )}
      </div>
      <div className={`mt-1 max-w-[76px] truncate border-hair px-1 py-0.5 text-center font-body text-[7px] font-bold text-paper sm:text-[8px] ${ours ? 'border-red bg-red' : 'border-paper/20 bg-ink'}`}>
        {first}
      </div>
    </div>
  )
}

function MatchPitch({
  result,
  frameIndex,
  ours,
  kits,
  bare = false,
}: {
  result: RoyalRumbleResult
  frameIndex: number
  ours: RoyalRumblePublicPlayer[]
  kits: EraKit[]
  /** inside the life: the pitch without the site's plate */
  bare?: boolean
}) {
  const frame = result.frames[Math.min(frameIndex, result.frames.length - 1)] ?? result.frames[0]
  if (!frame) return null
  const ourMap = new Map(ours.map((player) => [player.slug, player]))
  const theirMap = new Map(result.opponent.map((player) => [player.slug, player]))

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden border-rule border-ink bg-ink text-paper">
      <div className="relative border-b-rule border-paper/15 px-3 py-3 sm:px-5">
        <div className="absolute inset-y-0 start-0 w-2 bg-red" />
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 ps-2">
          <div>
            {!bare && <p className="font-mono tabular-nums text-[8px] font-black tracking-[0.2em] text-red" dir="ltr">THE WORKER · GATE 09</p>}
            <p className="font-display text-[20px] leading-none sm:text-[26px]">{t('title')}</p>
          </div>
          <div className="border-x-hair border-paper/20 px-4 text-center sm:px-8">
            <p className="font-display text-[42px] leading-none sm:text-[56px]" dir="ltr">{frame.scoreFor}–{frame.scoreAgainst}</p>
          </div>
          <div className="text-end">
            <p className="font-mono tabular-nums text-[8px] font-black tracking-[0.16em] text-paper/45" dir="ltr">MATCH CLOCK</p>
            <p className="font-display text-[24px] leading-none text-red sm:text-[30px]" dir="ltr">{String(frame.at).padStart(2, '0')}:00</p>
          </div>
        </div>
      </div>

      <div className="relative bg-sign p-2 sm:p-4">
        <div className="absolute inset-x-0 top-0 grid h-6 grid-cols-12 opacity-45">
          {Array.from({ length: 12 }, (_, index) => <span key={index} className={index % 2 === 0 ? 'bg-red' : 'bg-ink'} />)}
        </div>
        <div className="absolute inset-x-0 bottom-0 grid h-6 grid-cols-12 opacity-45">
          {Array.from({ length: 12 }, (_, index) => <span key={index} className={index % 2 === 0 ? 'bg-ink' : 'bg-red'} />)}
        </div>

        <div className="relative mb-7 mt-7 aspect-[1.52/1] overflow-hidden border-2 border-paper/65 bg-sign sm:mb-8 sm:mt-8">
          <div className="absolute inset-y-0 start-1/2 w-px -translate-x-1/2 bg-paper/55" />
          <div className="absolute start-1/2 top-1/2 aspect-square h-[28%] -translate-x-1/2 -translate-y-1/2 border border-paper/55" />
          <div className="absolute start-0 top-[28%] h-[44%] w-[13%] border-y border-e border-paper/55" />
          <div className="absolute end-0 top-[28%] h-[44%] w-[13%] border-y border-s border-paper/55" />
          <div className="absolute start-0 top-[40%] h-[20%] w-[4%] border-y border-e border-paper/45" />
          <div className="absolute end-0 top-[40%] h-[20%] w-[4%] border-y border-s border-paper/45" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-paper/10" />

          {frame.us.map((player) => (
            <FighterToken key={`us-${player.slug}`} player={player} publicPlayer={ourMap.get(player.slug)} ours kits={kits} />
          ))}
          {frame.them.map((player) => (
            <FighterToken key={`them-${player.slug}`} player={player} publicPlayer={theirMap.get(player.slug)} ours={false} kits={kits} />
          ))}

          <div
            className="absolute z-30 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-ink bg-paper transition-all duration-700 sm:h-4 sm:w-4"
            style={{ insetInlineStart: `${frame.ball.x}%`, top: `${frame.ball.y}%` }}
          />
        </div>

        <div className="relative mb-7 grid grid-cols-[auto_1fr] items-center gap-3 border-rule border-paper/15 bg-ink px-3 py-3 sm:mb-8 sm:px-4">
          <div className="flex items-center gap-2 font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-red" dir="ltr">
            <span className="h-2 w-2 bg-red" /> LIVE
          </div>
          <p className="font-body text-[12px] font-bold leading-snug sm:text-[14px]">{frame.commentaryHe}</p>
        </div>
      </div>
    </div>
  )
}

function CompactPlayer({ player, dark = false, kits }: { player: RoyalRumblePublicPlayer; dark?: boolean; kits: EraKit[] }) {
  return (
    <div className={`grid grid-cols-[42px_1fr_auto] items-center gap-2 border-b-hair py-2 ${dark ? 'border-paper/15' : 'border-ink/15'}`}>
      <div className="flex h-10 items-center justify-center bg-transparent">
        <Shirt player={player} kits={kits} className="h-9 w-8" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-body text-[11px] font-black">{player.nameHe}</p>
        <p className={`mt-0.5 font-mono tabular-nums text-[8px] font-black tracking-[0.12em] ${dark ? 'text-paper/40' : 'text-concrete'}`} dir="ltr">
          {POSITION_SHORT[player.position]} · {yearRange(player)}
        </p>
      </div>
      <span className="font-display text-[21px] text-red" dir="ltr">{money(player.price)}</span>
    </div>
  )
}

function isPlayer(player: RoyalRumblePublicPlayer | null): player is RoyalRumblePublicPlayer {
  return player !== null
}

export function RoyalRumbleRun({
  draft,
  shuffleDraft,
  cursor,
  playerCount,
  kits,
  embedded,
}: {
  draft: RoyalRumbleDraft
  shuffleDraft: RoyalRumbleDraft
  cursor: number
  playerCount: number
  kits: EraKit[]
  /**
   * Opened from inside THE WORKER LIFE — Ofir's cards on the asphalt. The same draft and the
   * same match over the men who had worn the shirt before the life's year (the server plays
   * it with that window); when the whistle goes the result goes back to the pitch, where the
   * friends settle the bet. No record, no "again", no plate with a gate's number on it.
   */
  embedded?: Omit<Embedded<RoyalRumbleResult>, 'window'> & { window: { before: number } }
}) {
  const [phase, setPhase] = useState<Phase>('draft')
  const [activeDraft, setActiveDraft] = useState(draft)
  const [shuffleUsed, setShuffleUsed] = useState(false)
  const [shuffleNotice, setShuffleNotice] = useState(false)
  const [picks, setPicks] = useState<Array<RoyalRumblePublicPlayer | null>>(
    () => Array.from({ length: draft.slots.length }, () => null),
  )
  const [activeSlot, setActiveSlot] = useState(0)
  const [result, setResult] = useState<RoyalRumbleResult | null>(null)
  const [revealCount, setRevealCount] = useState(0)
  const [frameIndex, setFrameIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** the stage's one sheet for what used to be desktop-only fine print (delta 87) */
  const [rulesOpen, setRulesOpen] = useState(false)

  const spent = picks.reduce((sum, player) => sum + (player?.price ?? 0), 0)
  const remaining = activeDraft.budget - spent
  const complete = picks.every(Boolean)
  const currentSlot = activeDraft.slots[activeSlot] ?? activeDraft.slots[0]
  const selectedSlugs = useMemo(() => picks.map((player) => player?.slug ?? ''), [picks])
  const selectedPlayers = picks.filter(isPlayer)

  function minimumRequiredAfter(slotIndex: number): number {
    return activeDraft.slots.reduce((sum, slot, index) => {
      if (index === slotIndex) return sum
      const picked = picks[index]
      if (picked) return sum + picked.price
      return sum + Math.min(...slot.offers.map((offer) => offer.price))
    }, 0)
  }

  function canPick(slotIndex: number, player: RoyalRumblePublicPlayer): boolean {
    return minimumRequiredAfter(slotIndex) + player.price <= activeDraft.budget
  }

  function pick(slotIndex: number, player: RoyalRumblePublicPlayer) {
    if (phase !== 'draft' || !canPick(slotIndex, player)) return
    setError(null)
    setPicks((previous) => {
      const next = [...previous]
      next[slotIndex] = player
      const nextEmpty = next.findIndex((item, index) => index > slotIndex && item === null)
      const anyEmpty = next.findIndex((item) => item === null)
      if (nextEmpty >= 0) setActiveSlot(nextEmpty)
      else if (anyEmpty >= 0) setActiveSlot(anyEmpty)
      return next
    })
  }

  function shuffleOnce() {
    if (shuffleUsed || phase !== 'draft' || busy) return
    setActiveDraft(shuffleDraft)
    setPicks(Array.from({ length: shuffleDraft.slots.length }, () => null))
    setActiveSlot(0)
    setShuffleUsed(true)
    setShuffleNotice(true)
    setError(null)
    window.setTimeout(() => setShuffleNotice(false), 2200)
  }

  async function lockFive() {
    if (!complete || remaining < 0 || busy) return
    setBusy(true)
    setError(null)
    const resolved = await submitRoyalRumble(activeDraft.seed, selectedSlugs, embedded?.window)
    setBusy(false)
    if (!resolved) {
      setError(t('invalidFive'))
      return
    }
    setResult(resolved)
    setPhase('reveal')
    setRevealCount(0)
  }

  useEffect(() => {
    if (phase !== 'reveal' || !result) return
    if (revealCount >= result.opponent.length) {
      const launch = window.setTimeout(() => setPhase('match'), 1100)
      return () => window.clearTimeout(launch)
    }
    const timer = window.setTimeout(() => setRevealCount((value) => value + 1), 820)
    return () => window.clearTimeout(timer)
  }, [phase, result, revealCount])

  // inside the life the full-time whistle ends in the room, not on a result page
  useEffect(() => {
    if (!embedded || phase !== 'result' || !result) return
    embedded.onResult(result)
  }, [embedded, phase, result])

  useEffect(() => {
    if (phase !== 'match' || !result) return
    if (frameIndex >= result.frames.length - 1) {
      const finish = window.setTimeout(() => setPhase('result'), 1700)
      return () => window.clearTimeout(finish)
    }
    const timer = window.setTimeout(() => setFrameIndex((value) => value + 1), 1250)
    return () => window.clearTimeout(timer)
  }, [phase, result, frameIndex])

  if (phase === 'reveal' && result) {
    return (
      <div className="relative mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain border-rule border-ink bg-ink px-3 py-4 text-paper max-w-5xl sm:px-6 sm:py-8 md:block md:flex-none md:overflow-visible">
        <div className="absolute inset-y-0 start-0 w-2 bg-red" />
        <div className="relative text-center">
          <p className="font-mono tabular-nums text-[9px] font-black tracking-[0.32em] text-red" dir="ltr">OPPONENT ENTRANCE</p>
          <h2 className="mt-2 font-display text-[38px] leading-[0.85] sm:text-[66px]">{t('opponentTitle')}</h2>
          <p className="mx-auto mt-4 hidden max-w-lg font-body text-[11px] text-paper/50 sm:block">{t('opponentBody')}</p>
        </div>

        <div className="relative mt-4 grid grid-cols-5 gap-1 sm:mt-8 sm:gap-2">
          {result.opponent.map((player, index) => {
            const open = index < revealCount
            return (
              <div key={player.slug} className={`relative min-h-[176px] overflow-hidden border-rule sm:min-h-[280px] ${open ? 'border-red bg-paper text-ink' : 'border-paper/15 bg-ink text-paper'}`}>
                {!open ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink">
                    <span className="font-display text-[54px] leading-none text-paper/10 sm:text-[80px]">?</span>
                    <span className="mt-4 border-t-hair border-red pt-2 font-mono tabular-nums text-[7px] font-black tracking-[0.2em] text-red sm:text-[9px]" dir="ltr">
                      {index === revealCount ? 'SPINNING' : 'LOCKED'}
                    </span>
                  </div>
                ) : (
                  <div className="relative flex h-full min-h-[176px] animate-[rrDrop_.32s_ease-out] flex-col p-2 sm:min-h-[280px] sm:p-3">
                    <div className="absolute inset-x-0 top-0 h-2 bg-red" />
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-mono tabular-nums text-[7px] font-black tracking-[0.14em] text-red sm:text-[9px]" dir="ltr">ENTRY {index + 1}</span>
                      <span className="font-display text-[22px] text-red sm:text-[30px]" dir="ltr">{money(player.price)}</span>
                    </div>
                    <div className="mx-auto mt-2 flex w-full justify-center border-y-hair border-ink/10 bg-transparent py-2">
                      <Shirt player={player} kits={kits} className="h-[96px] w-[84px] sm:h-[126px] sm:w-[112px]" />
                    </div>
                    <div className="mt-auto pt-2">
                      <p className="font-display text-[17px] leading-[0.9] sm:text-[25px]">{player.nameHe}</p>
                      <p className="mt-2 font-mono tabular-nums text-[7px] font-black tracking-[0.1em] text-concrete sm:text-[9px]" dir="ltr">{POSITION_SHORT[player.position]}</p>
                      <div className="mt-3"><PriceBars price={player.price} /></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="relative mt-4 text-center sm:mt-6">
          <span className="inline-block border-x-rule border-red px-5 py-2 font-display text-[30px] text-red sm:text-[42px]" dir="ltr">VS</span>
          {!embedded && <p className="mt-2 font-mono tabular-nums text-[8px] font-black tracking-[0.24em] text-paper/40" dir="ltr">ROYAL RUMBLE · GATE 09</p>}
        </div>
        <style>{`@keyframes rrDrop{0%{opacity:0;transform:translateY(-18px) scale(.96)}100%{opacity:1;transform:none}}`}</style>
      </div>
    )
  }

  if (phase === 'match' && result) {
    return (
      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain max-w-5xl py-2 md:block md:flex-none md:overflow-visible">
        <MatchPitch result={result} frameIndex={frameIndex} ours={selectedPlayers} kits={kits} bare={Boolean(embedded)} />
      </div>
    )
  }

  if (phase === 'result' && result) {
    if (embedded) return null
    const won = result.winner === 'us'
    const draw = result.winner === 'draw'
    return (
      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain max-w-5xl pb-3 pt-1 md:block md:flex-none md:overflow-visible">
        <RecordRun gate="royal-rumble" score={won ? 3 : draw ? 1 : 0} correct={won ? 1 : 0} asked={1} />
        <section className="relative overflow-hidden border-rule border-ink bg-ink px-4 py-5 text-center text-paper sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -start-8 top-1/2 -translate-y-1/2 font-display text-[190px] leading-none text-paper/5" dir="ltr">09</div>
          <p className="relative font-mono tabular-nums text-[9px] font-black tracking-[0.3em] text-red" dir="ltr">FULL TIME · ROYAL RUMBLE</p>
          <p className="relative mt-3 font-display text-[92px] leading-[0.8] sm:text-[132px]" dir="ltr">{result.scoreFor}–{result.scoreAgainst}</p>
          <div className="relative mx-auto mt-5 h-1 w-20 bg-red" />
          <h2 className="relative mt-5 font-display text-[34px] leading-none sm:text-[46px]">
            {won ? t('won') : draw ? t('draw') : t('lost')}
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg font-body text-[11px] leading-relaxed text-paper/50">{t('resultSecret')}</p>
        </section>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <section className="border-rule border-ink bg-paper p-4 text-ink">
            <div className="mb-2 flex items-end justify-between">
              <div><p className="font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-red" dir="ltr">YOUR FIVE</p><h3 className="font-display text-[24px]">{t('yourFive')}</h3></div>
              <span className="font-display text-[24px] text-red" dir="ltr">{money(spent)}</span>
            </div>
            {selectedPlayers.map((player) => <CompactPlayer key={player.slug} player={player} kits={kits} />)}
          </section>
          <section className="border-rule border-ink bg-ink p-4 text-paper">
            <div className="mb-2"><p className="font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-red" dir="ltr">THEIR FIVE</p><h3 className="font-display text-[24px]">{t('theirFive')}</h3></div>
            {result.opponent.map((player) => <CompactPlayer key={player.slug} player={player} dark kits={kits} />)}
          </section>
        </div>

        <a href="/royal-rumble" className="group mt-3 flex min-h-tap items-center justify-between border-rule border-red bg-red px-5 text-paper transition hover:bg-ink">
          <span><span className="block font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-paper/60" dir="ltr">RUN IT BACK</span><span className="font-display text-[27px]">{t('again')}</span></span>
          <span className="font-display text-[38px] transition group-hover:-translate-x-1">←</span>
        </a>
      </div>
    )
  }

  if (!currentSlot) return null

  const pickedCount = picks.filter(Boolean).length
  const progress = (pickedCount / activeDraft.slots.length) * 100

  return (
    <div className="flex min-h-0 flex-1 flex-col md:block md:flex-none md:pb-3">
      <header className="relative shrink-0 overflow-hidden border-rule border-ink bg-ink text-paper">
        {!embedded && <div className="pointer-events-none absolute -start-5 -top-10 font-display text-[220px] leading-none text-paper/5 sm:text-[300px]" dir="ltr">09</div>}
        <div className="absolute inset-y-0 end-0 w-2 bg-red" />

        <div className="relative grid grid-cols-[1fr_auto] items-end gap-3 px-3 py-1.5 sm:gap-5 sm:px-6 sm:py-6">
          <div>
            <div className="flex items-center gap-3">
              {!embedded && <span className="hidden border-hair border-red px-2 py-1 font-mono tabular-nums text-[8px] font-black tracking-[0.2em] text-red sm:inline-block" dir="ltr">GATE 09</span>}
              <span className="hidden font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-paper/35 sm:inline" dir="ltr">5V5 · HAPOEL ALL-TIME</span>
            </div>
            <h1 className="mt-1 font-display text-[22px] leading-[0.82] sm:mt-3 sm:text-[76px]">{t('title')}</h1>
            <div className="mt-1 hidden h-1.5 w-16 bg-red sm:mt-3 sm:block sm:h-2 sm:w-24" />
            <p className="mt-4 hidden max-w-md font-body text-[11px] leading-relaxed text-paper/55 sm:block sm:text-[12px]">{t('heroBody')}</p>
          </div>

          <div className="flex min-w-[90px] flex-col justify-end border-s-hair border-paper/15 ps-3 sm:min-w-[180px] sm:ps-5">
            <p className="font-mono tabular-nums text-[7px] font-black tracking-[0.15em] text-paper/35 sm:text-[8px]" dir="ltr">MONEY LEFT</p>
            <div className="mt-0.5 flex items-end gap-2">
              <p className={`font-display text-[22px] leading-none sm:text-[52px] ${remaining < 0 ? 'text-red' : 'text-paper'}`} dir="ltr">{money(remaining)}</p>
              <span className="mb-1 hidden font-body text-[9px] text-paper/35 sm:inline">{t('budgetOf', { budget: money(activeDraft.budget) })}</span>
            </div>
            <div className="mt-1 h-1 bg-paper/10 sm:mt-3 sm:h-2"><div className="h-full bg-red transition-all duration-300" style={{ width: `${Math.min(100, progress)}%` }} /></div>
            <div className="mt-1 hidden justify-between font-body text-[7px] text-paper/35 sm:mt-2 sm:flex sm:text-[8px]">
              <span>{t('lockedCount', { count: String(pickedCount) })}</span>
              <span>{t('archiveCount', { count: String(playerCount) })}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-1.5 shrink-0 md:mt-2"><LineupRail draft={activeDraft} picks={picks} activeSlot={activeSlot} onEdit={setActiveSlot} kits={kits} /></div>

      {/* SHUFFLE and RULES — a compact chip rail instead of a full-width desktop bar */}
      <div className="mt-1.5 flex shrink-0 gap-1.5 md:mt-2">
        <button
          type="button"
          disabled={shuffleUsed || busy}
          onClick={(event) => {
            shuffleOnce()
            firePickFxAt(event.currentTarget, { tone: 'sign', haptic: 'tap' })
          }}
          className={`flex min-h-tap flex-1 items-center justify-between gap-2 border-hair px-2.5 font-body text-[11.5px] font-extrabold transition ${
            shuffleUsed || busy ? 'border-ink/15 text-ink/35' : 'border-ink bg-paper text-ink'
          }`}
        >
          <span className="truncate">{shuffleNotice ? t('shuffleFresh') : shuffleUsed ? t('shuffleUsed') : t('shuffleAction')}</span>
          <span className="shrink-0 font-mono tabular-nums text-[9px] font-black tracking-[0.16em] text-red" dir="ltr">×1</span>
        </button>
        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          className="flex min-h-tap shrink-0 items-center border-hair border-ink/35 px-2.5 font-body text-[11.5px] font-extrabold text-ink"
        >
          {t('stageRulesChip')}
        </button>
      </div>

      <section className="mt-1.5 flex min-h-0 flex-1 flex-col border-rule border-ink bg-paper p-1.5 md:mt-2 md:flex-none md:p-4">
        <div className="mb-1 flex shrink-0 items-end gap-2 sm:gap-3">
          <div className="font-display text-[20px] leading-none text-red sm:text-[62px]" dir="ltr">{String(activeSlot + 1).padStart(2, '0')}</div>
          <div className="min-w-0 border-s-rule border-ink ps-2">
            <p className="font-mono tabular-nums text-[7px] font-black tracking-[0.2em] text-red sm:text-[8px]" dir="ltr">PICK {activeSlot + 1}/5</p>
            <h2 className="truncate font-display text-[15px] leading-none sm:text-[34px]">{t('draftQuestion')}</h2>
            <p className="mt-0.5 hidden truncate font-body text-[9px] text-concrete sm:block">{t('draftPosition', { position: positionHe(currentSlot.position) })}</p>
          </div>
        </div>

        <FitBox ratio={1.5} className="min-h-0 flex-1" innerClassName="flex items-stretch">
          <div className="relative flex w-full">
            <RoyalRumbleSlotReveal offers={currentSlot.offers} signature={`${activeDraft.seed}-${activeSlot}`} />
            <div className="grid w-full grid-cols-3 gap-1.5 sm:gap-3">
              {currentSlot.offers.map((player, index) => (
                <DraftCard
                  key={player.slug}
                  player={player}
                  index={index}
                  selected={picks[activeSlot]?.slug === player.slug}
                  disabled={!canPick(activeSlot, player)}
                  onPick={(event) => {
                    pick(activeSlot, player)
                    firePickFxAt(event.currentTarget, { label: money(player.price), tone: 'red', haptic: 'lock' })
                  }}
                  kits={kits}
                />
              ))}
            </div>
          </div>
        </FitBox>
      </section>

      {error && <p className="mt-1.5 shrink-0 border-rule border-red bg-red/10 p-2.5 font-body text-[11px] font-black text-red md:mt-2 md:p-3">{error}</p>}

      <button
        type="button"
        disabled={!complete || remaining < 0 || busy}
        onClick={(event) => {
          if (!complete || remaining < 0 || busy) return
          firePickFx(event.clientX, event.clientY, { label: t('lockReady'), tone: 'red', big: true, haptic: 'lock' })
          void lockFive()
        }}
        className="group mt-1.5 grid min-h-tap w-full shrink-0 grid-cols-[1fr_auto] items-center border-rule border-red bg-red px-5 text-start text-paper transition hover:bg-ink disabled:cursor-not-allowed disabled:border-concrete disabled:bg-concrete disabled:text-ink/55 md:mt-2"
      >
        <span>
          <span className="block font-mono tabular-nums text-[8px] font-black tracking-[0.2em] opacity-60" dir="ltr">LOCK THE FIVE</span>
          <span className="font-display text-[23px] sm:text-[31px]">
            {busy ? t('locking') : complete ? t('lockReady') : t('missingPlayers', { count: String(5 - pickedCount) })}
          </span>
        </span>
        <span className="font-display text-[34px] transition sm:text-[42px] group-hover:-translate-x-1">←</span>
      </button>

      <SlideSheet open={rulesOpen} onClose={() => setRulesOpen(false)} title={t('stageRulesTitle')} latin="RULES">
        <div className="flex flex-col gap-3">
          <p className="font-body text-[13px] leading-relaxed text-ink">{t('heroBody')}</p>
          <div className="grid gap-2">
            <p className="border-s-rule border-red ps-2.5 font-body text-[12px] leading-relaxed text-ink/85">{t('rulePrice')}</p>
            <p className="border-s-rule border-red ps-2.5 font-body text-[12px] leading-relaxed text-ink/85">{t('ruleRange')}</p>
            <p className="border-s-rule border-red ps-2.5 font-body text-[12px] leading-relaxed text-ink/85">{t('ruleOpponent')}</p>
          </div>
          <div className="border-hair border-ink/20 p-2.5">
            <p className="font-mono tabular-nums text-[8px] font-black tracking-[0.16em] text-concrete" dir="ltr">SECRET RATING</p>
            <p className="mt-1 font-body text-[12px] text-ink/85">{t('ratingNever')}</p>
          </div>
          <p className="font-body text-[11px] text-concrete">{t('fadedNote')}</p>
          <p className="font-body text-[11px] text-concrete">{t('kitNearest')}</p>
          <p className="font-body text-[11px] text-concrete">{t('budgetOf', { budget: money(activeDraft.budget) })}</p>
        </div>
      </SlideSheet>

      <span className="sr-only">{cursor + 1}</span>
    </div>
  )
}
