'use client'

import { useEffect, useMemo, useState } from 'react'

import { KitShirt } from '@/components/kit/KitShirt'
import { RecordRun } from '@/components/play/RecordRun'
import type {
  RoyalRumbleDraft,
  RoyalRumblePitchPlayer,
  RoyalRumblePublicPlayer,
  RoyalRumbleResult,
} from '@/lib/game/royal-rumble'
import type { KitSpec } from '@/lib/kit/spec'
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
      <div className="relative">
        <img src={specialSeason.src} alt={t('kitSeason', { season: specialSeason.season })} className={className} />
        <p className="mt-1 text-center font-mono tabular-nums text-[7px] font-black tracking-[0.12em] text-concrete" dir="ltr">{specialSeason.season}</p>
      </div>
    )
  }
  const kit = kitForPlayer(player, kits)
  if (!kit) return <div className={className} />
  return (
    <div className="relative">
      <KitShirt
        spec={kit.spec}
        className={className}
        title={t('kitSeason', { season: kit.seasonLabel })}
      />
      <p className="mt-1 text-center font-mono tabular-nums text-[7px] font-black tracking-[0.12em] text-concrete" dir="ltr">
        {kit.seasonLabel}
      </p>
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
  onPick: () => void
  index: number
  kits: EraKit[]
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      aria-pressed={selected}
      className={`group relative min-h-tap overflow-hidden border-rule p-0 text-start transition duration-200 active:translate-y-1 sm:min-h-[330px] ${
        selected
          ? 'translate-y-1 border-red bg-red text-paper'
          : 'border-ink bg-paper text-ink hover:-translate-y-1'
      } ${disabled ? 'cursor-not-allowed opacity-30 grayscale' : ''}`}
    >
      <div className={`absolute inset-x-0 top-0 h-2 ${selected ? 'bg-paper' : 'bg-red'}`} />
      <div className="absolute -start-4 -top-5 font-display text-[112px] leading-none text-ink/5 sm:text-[150px]" dir="ltr">
        {index + 1}
      </div>

      <div className="relative flex min-h-[295px] flex-col p-3 sm:min-h-[330px] sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`font-mono tabular-nums text-[9px] font-black tracking-[0.22em] ${selected ? 'text-paper/70' : 'text-red'}`} dir="ltr">
              ENTRY {String(index + 1).padStart(2, '0')}
            </p>
            <p className="mt-1 font-mono tabular-nums text-[10px] font-black tracking-[0.12em]" dir="ltr">
              {POSITION_SHORT[player.position]}
            </p>
          </div>
          <div className="text-end">
            <p className={`font-display text-[34px] leading-none sm:text-[42px] ${selected ? 'text-paper' : 'text-red'}`} dir="ltr">
              {money(player.price)}
            </p>
            <p className={`mt-1 font-body text-[8px] ${selected ? 'text-paper/55' : 'text-concrete'}`}>{t('priceEntry')}</p>
          </div>
        </div>

        <div className={`mx-auto mt-2 flex w-full justify-center border-y-hair py-2 ${selected ? 'border-paper/15 bg-transparent' : 'border-ink/10 bg-transparent'}`}>
          <Shirt player={player} kits={kits} className="h-[92px] w-[82px] sm:h-[118px] sm:w-[104px]" />
        </div>

        <div className="mt-auto pt-3">
          <p className="font-display text-[24px] leading-[0.92] sm:text-[31px]">{player.nameHe}</p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className={`font-body text-[8px] ${selected ? 'text-paper/55' : 'text-concrete'}`}>{t('hapoelYears')}</p>
              <p className="font-mono tabular-nums text-[9px] font-black" dir="ltr">{yearRange(player)}</p>
            </div>
            <span className={`border-hair px-2 py-1 font-body text-[8px] font-black ${selected ? 'border-paper/35' : 'border-ink/25'}`}>
              {positionHe(player.position)}
            </span>
          </div>
          <div className="mt-3"><PriceBars price={player.price} inverted={selected} /></div>
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
    <section className="relative overflow-hidden border-rule border-ink bg-ink p-3 text-paper sm:p-4">
      <div className="absolute inset-y-0 start-0 w-2 bg-red" />
      <div className="relative mb-3 flex items-end justify-between gap-3 ps-2">
        <div>
          <p className="font-mono tabular-nums text-[9px] font-black tracking-[0.2em] text-red" dir="ltr">YOUR FIVE</p>
          <h3 className="font-display text-[24px] leading-none">{t('lineupWall')}</h3>
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
              className={`min-h-tap min-w-0 border-hair p-1.5 text-center transition ${
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
                  <p className="mt-1 truncate font-display text-[13px] leading-none sm:text-[16px]">{player.nameHe}</p>
                  <p className="mt-1 font-display text-[14px] text-paper/75 sm:text-[18px]" dir="ltr">{money(player.price)}</p>
                </>
              ) : (
                <>
                  <p className="mt-2 font-display text-[24px] leading-none text-paper/15">?</p>
                  <p className="mt-1 font-body text-[8px] text-paper/35">{t('vacant')}</p>
                </>
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
}: {
  result: RoyalRumbleResult
  frameIndex: number
  ours: RoyalRumblePublicPlayer[]
  kits: EraKit[]
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
            <p className="font-mono tabular-nums text-[8px] font-black tracking-[0.2em] text-red" dir="ltr">THE WORKER · GATE 09</p>
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
}: {
  draft: RoyalRumbleDraft
  shuffleDraft: RoyalRumbleDraft
  cursor: number
  playerCount: number
  kits: EraKit[]
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
    const resolved = await submitRoyalRumble(activeDraft.seed, selectedSlugs)
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
      <div className="relative mx-auto max-w-5xl overflow-hidden border-rule border-ink bg-ink px-3 py-6 text-paper sm:px-6 sm:py-10">
        <div className="absolute inset-y-0 start-0 w-2 bg-red" />
        <div className="relative text-center">
          <p className="font-mono tabular-nums text-[9px] font-black tracking-[0.32em] text-red" dir="ltr">OPPONENT ENTRANCE</p>
          <h2 className="mt-2 font-display text-[48px] leading-[0.85] sm:text-[70px]">{t('opponentTitle')}</h2>
          <p className="mx-auto mt-4 max-w-lg font-body text-[11px] text-paper/50">{t('opponentBody')}</p>
        </div>

        <div className="relative mt-7 grid grid-cols-5 gap-1 sm:mt-10 sm:gap-2">
          {result.opponent.map((player, index) => {
            const open = index < revealCount
            return (
              <div key={player.slug} className={`relative min-h-[210px] overflow-hidden border-rule sm:min-h-[300px] ${open ? 'border-red bg-paper text-ink' : 'border-paper/15 bg-ink text-paper'}`}>
                {!open ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink">
                    <span className="font-display text-[54px] leading-none text-paper/10 sm:text-[80px]">?</span>
                    <span className="mt-4 border-t-hair border-red pt-2 font-mono tabular-nums text-[7px] font-black tracking-[0.2em] text-red sm:text-[9px]" dir="ltr">
                      {index === revealCount ? 'SPINNING' : 'LOCKED'}
                    </span>
                  </div>
                ) : (
                  <div className="relative flex h-full min-h-[210px] animate-[rrDrop_.32s_ease-out] flex-col p-2 sm:min-h-[300px] sm:p-3">
                    <div className="absolute inset-x-0 top-0 h-2 bg-red" />
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-mono tabular-nums text-[7px] font-black tracking-[0.14em] text-red sm:text-[9px]" dir="ltr">ENTRY {index + 1}</span>
                      <span className="font-display text-[22px] text-red sm:text-[30px]" dir="ltr">{money(player.price)}</span>
                    </div>
                    <div className="mx-auto mt-2 flex w-full justify-center border-y-hair border-ink/10 bg-transparent py-2">
                      <Shirt player={player} kits={kits} className="h-[86px] w-[76px] sm:h-[120px] sm:w-[106px]" />
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

        <div className="relative mt-6 text-center">
          <span className="inline-block border-x-rule border-red px-5 py-2 font-display text-[30px] text-red sm:text-[42px]" dir="ltr">VS</span>
          <p className="mt-2 font-mono tabular-nums text-[8px] font-black tracking-[0.24em] text-paper/40" dir="ltr">ROYAL RUMBLE · GATE 09</p>
        </div>
        <style>{`@keyframes rrDrop{0%{opacity:0;transform:translateY(-18px) scale(.96)}100%{opacity:1;transform:none}}`}</style>
      </div>
    )
  }

  if (phase === 'match' && result) {
    return (
      <div className="mx-auto max-w-5xl py-2">
        <MatchPitch result={result} frameIndex={frameIndex} ours={selectedPlayers} kits={kits} />
      </div>
    )
  }

  if (phase === 'result' && result) {
    const won = result.winner === 'us'
    const draw = result.winner === 'draw'
    return (
      <div className="mx-auto max-w-5xl pb-8 pt-2">
        <RecordRun gate="royal-rumble" score={won ? 3 : draw ? 1 : 0} correct={won ? 1 : 0} asked={1} />
        <section className="relative overflow-hidden border-rule border-ink bg-ink px-4 py-7 text-center text-paper sm:px-8 sm:py-10">
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
    <div className="mx-auto max-w-5xl pb-8 pt-1">
      <header className="relative overflow-hidden border-rule border-ink bg-ink text-paper">
        <div className="pointer-events-none absolute -start-5 -top-10 font-display text-[220px] leading-none text-paper/5 sm:text-[300px]" dir="ltr">09</div>
        <div className="absolute inset-y-0 end-0 w-2 bg-red" />

        <div className="relative grid gap-5 px-4 py-5 sm:grid-cols-[1fr_auto] sm:px-6 sm:py-7">
          <div>
            <div className="flex items-center gap-3">
              <span className="border-hair border-red px-2 py-1 font-mono tabular-nums text-[8px] font-black tracking-[0.2em] text-red" dir="ltr">GATE 09</span>
              <span className="font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-paper/35" dir="ltr">5V5 · HAPOEL ALL-TIME</span>
            </div>
            <h1 className="mt-3 font-display text-[54px] leading-[0.82] sm:text-[78px]">{t('title')}</h1>
            <div className="mt-3 h-2 w-24 bg-red" />
            <p className="mt-4 max-w-md font-body text-[11px] leading-relaxed text-paper/55 sm:text-[12px]">{t('heroBody')}</p>
          </div>

          <div className="flex min-w-[180px] flex-col justify-end border-t-hair border-paper/15 pt-3 sm:border-s-hair sm:border-t-0 sm:ps-5 sm:pt-0">
            <p className="font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-paper/35" dir="ltr">MONEY LEFT</p>
            <div className="mt-1 flex items-end gap-2">
              <p className={`font-display text-[52px] leading-none ${remaining < 0 ? 'text-red' : 'text-paper'}`} dir="ltr">{money(remaining)}</p>
              <span className="mb-1 font-body text-[9px] text-paper/35">{t('budgetOf', { budget: money(activeDraft.budget) })}</span>
            </div>
            <div className="mt-3 h-2 bg-paper/10"><div className="h-full bg-red transition-all duration-300" style={{ width: `${Math.min(100, progress)}%` }} /></div>
            <div className="mt-2 flex justify-between font-body text-[8px] text-paper/35">
              <span>{t('lockedCount', { count: String(pickedCount) })}</span>
              <span>{t('archiveCount', { count: String(playerCount) })}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-3"><LineupRail draft={activeDraft} picks={picks} activeSlot={activeSlot} onEdit={setActiveSlot} kits={kits} /></div>

      <section className="mt-3 grid border-rule border-ink bg-paper sm:grid-cols-[1fr_auto]">
        <div className="p-3 sm:p-4">
          <p className="font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-red" dir="ltr">ONE SHUFFLE · ONE CHANCE</p>
          <h2 className="mt-1 font-display text-[25px] leading-none">{t('shuffleTitle')}</h2>
          <p className="mt-2 max-w-xl font-body text-[9px] leading-relaxed text-concrete">{t('shuffleBody')}</p>
          {shuffleNotice && <p className="mt-2 border-s-rule border-red ps-2 font-body text-[9px] font-black text-red">{t('shuffleFresh')}</p>}
        </div>
        <button
          type="button"
          disabled={shuffleUsed || busy}
          onClick={shuffleOnce}
          className="group min-h-tap border-t-rule border-ink bg-ink px-5 py-3 text-start text-paper transition hover:bg-red disabled:cursor-not-allowed disabled:bg-concrete disabled:text-ink/60 sm:min-w-[220px] sm:border-s-rule sm:border-t-0"
        >
          <span className="block font-display text-[28px] leading-none">{shuffleUsed ? t('shuffleUsed') : t('shuffleAction')}</span>
          <span className="mt-2 block font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-red" dir="ltr">SHUFFLE ×1</span>
        </button>
      </section>

      <section className="mt-3 border-rule border-ink bg-paper p-3 sm:p-5">
        <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-end gap-3">
          <div className="font-display text-[54px] leading-none text-red sm:text-[68px]" dir="ltr">{String(activeSlot + 1).padStart(2, '0')}</div>
          <div className="border-s-rule border-ink ps-3">
            <p className="font-mono tabular-nums text-[8px] font-black tracking-[0.2em] text-red" dir="ltr">ENTRY DRAW · PICK {activeSlot + 1}/5</p>
            <h2 className="font-display text-[28px] leading-none sm:text-[36px]">{t('draftQuestion')}</h2>
            <p className="mt-1 font-body text-[9px] text-concrete">{t('draftPosition', { position: positionHe(currentSlot.position) })}</p>
          </div>
          <div className="hidden text-end sm:block">
            <p className="font-mono tabular-nums text-[8px] font-black tracking-[0.16em] text-concrete" dir="ltr">SECRET RATING</p>
            <p className="font-display text-[26px] leading-none" dir="ltr">09–99</p>
            <p className="font-body text-[8px] text-concrete">{t('ratingNever')}</p>
          </div>
        </div>

        <div className="relative">
          <RoyalRumbleSlotReveal offers={currentSlot.offers} signature={`${activeDraft.seed}-${activeSlot}`} />
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {currentSlot.offers.map((player, index) => (
            <DraftCard
              key={player.slug}
              player={player}
              index={index}
              selected={picks[activeSlot]?.slug === player.slug}
              disabled={!canPick(activeSlot, player)}
              onPick={() => pick(activeSlot, player)}
              kits={kits}
            />
          ))}
          </div>
        </div>
        <p className="mt-3 text-center font-body text-[9px] text-concrete">{t('fadedNote')}</p>
      </section>

      {error && <p className="mt-3 border-rule border-red bg-red/10 p-3 font-body text-[11px] font-black text-red">{error}</p>}

      <button
        type="button"
        disabled={!complete || remaining < 0 || busy}
        onClick={() => void lockFive()}
        className="group mt-3 grid min-h-tap w-full grid-cols-[1fr_auto] items-center border-rule border-red bg-red px-5 text-start text-paper transition hover:bg-ink disabled:cursor-not-allowed disabled:border-concrete disabled:bg-concrete disabled:text-ink/55"
      >
        <span>
          <span className="block font-mono tabular-nums text-[8px] font-black tracking-[0.2em] opacity-60" dir="ltr">LOCK THE FIVE</span>
          <span className="font-display text-[27px] sm:text-[31px]">
            {busy ? t('locking') : complete ? t('lockReady') : t('missingPlayers', { count: String(5 - pickedCount) })}
          </span>
        </span>
        <span className="font-display text-[42px] transition group-hover:-translate-x-1">←</span>
      </button>

      <div className="mt-3 grid gap-2 border-y-hair border-ink/15 py-3 text-center font-body text-[9px] leading-relaxed text-concrete sm:grid-cols-3">
        <span>{t('rulePrice')}</span>
        <span>{t('ruleRange')}</span>
        <span>{t('ruleOpponent')}</span>
      </div>
      <p className="mt-2 text-center font-body text-[8px] text-concrete">{t('kitNearest')}</p>
      <span className="sr-only">{cursor + 1}</span>
    </div>
  )
}
