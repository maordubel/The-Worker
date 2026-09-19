'use client'

import { useEffect, useMemo, useState } from 'react'

import { RecordRun } from '@/components/play/RecordRun'
import type {
  RoyalRumbleDraft,
  RoyalRumblePitchPlayer,
  RoyalRumblePublicPlayer,
  RoyalRumbleResult,
} from '@/lib/game/royal-rumble'
import { submitRoyalRumble } from './actions'

type Phase = 'draft' | 'reveal' | 'match' | 'result'

const POSITION_HE: Record<string, string> = {
  GK: 'שוער',
  DF: 'הגנה',
  MF: 'קישור',
  FW: 'התקפה',
}

const POSITION_SHORT: Record<string, string> = {
  GK: 'GK',
  DF: 'DEF',
  MF: 'MID',
  FW: 'ATT',
}

function money(value: number): string {
  return `€${value}M`
}

function yearRange(player: RoyalRumblePublicPlayer): string {
  if (player.fromYear === null && player.toYear === null) return 'שנות הפעילות בארכיון'
  if (player.fromYear === player.toYear) return String(player.fromYear ?? '—')
  return `${player.fromYear ?? '—'}–${player.toYear ?? '—'}`
}

function PriceBars({ price, inverted = false }: { price: number; inverted?: boolean }) {
  return (
    <div className="flex gap-1" aria-label={`מחיר ${money(price)}`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 flex-1 ${index < price ? 'bg-red' : inverted ? 'bg-paper/15' : 'bg-ink/10'}`}
        />
      ))}
    </div>
  )
}

function DraftCard({
  player,
  selected,
  disabled,
  onPick,
  index,
}: {
  player: RoyalRumblePublicPlayer
  selected: boolean
  disabled: boolean
  onPick: () => void
  index: number
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className={`group relative min-h-[225px] overflow-hidden border-rule p-0 text-right transition duration-200 active:scale-[0.985] sm:min-h-[275px] ${
        selected
          ? 'border-red bg-red text-paper shadow-[0_12px_0_#171717]'
          : 'border-ink bg-paper text-ink hover:-translate-y-1 hover:shadow-[0_12px_0_#171717]'
      } ${disabled ? 'cursor-not-allowed opacity-30 grayscale' : ''}`}
      aria-pressed={selected}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 ${selected ? 'bg-paper' : 'bg-red'}`} />
      <div className="absolute -left-3 -top-5 font-poster text-[110px] leading-none opacity-[0.045] sm:text-[145px]" dir="ltr">
        {index + 1}
      </div>

      <div className="relative flex min-h-[225px] flex-col p-3 sm:min-h-[275px] sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`font-latin text-[9px] font-black tracking-[0.22em] ${selected ? 'text-paper/70' : 'text-red'}`} dir="ltr">
              ENTRY {String(index + 1).padStart(2, '0')}
            </p>
            <p className="mt-1 font-latin text-[10px] font-black tracking-[0.12em]" dir="ltr">
              {POSITION_SHORT[player.position]}
            </p>
          </div>
          <div className="text-left">
            <p className={`font-poster text-[34px] leading-none sm:text-[42px] ${selected ? 'text-paper' : 'text-red'}`} dir="ltr">
              {money(player.price)}
            </p>
            <p className={`mt-1 font-body text-[8px] ${selected ? 'text-paper/55' : 'text-concrete'}`}>מחיר כניסה</p>
          </div>
        </div>

        <div className="mt-auto">
          <div className={`mb-3 h-px ${selected ? 'bg-paper/25' : 'bg-ink/15'}`} />
          <p className="font-poster text-[27px] leading-[0.92] sm:text-[36px]">{player.nameHe}</p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className={`font-body text-[9px] ${selected ? 'text-paper/55' : 'text-concrete'}`}>בהפועל</p>
              <p className="font-latin text-[10px] font-black" dir="ltr">{yearRange(player)}</p>
            </div>
            <span className={`border-hair px-2 py-1 font-body text-[9px] font-black ${selected ? 'border-paper/35' : 'border-ink/25'}`}>
              {POSITION_HE[player.position]}
            </span>
          </div>
          <div className="mt-4"><PriceBars price={player.price} inverted={selected} /></div>
        </div>
      </div>

      {selected && (
        <div className="absolute inset-x-0 bottom-0 bg-ink py-1 text-center font-latin text-[9px] font-black tracking-[0.2em] text-paper" dir="ltr">
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
}: {
  draft: RoyalRumbleDraft
  picks: Array<RoyalRumblePublicPlayer | null>
  activeSlot: number
  onEdit: (index: number) => void
}) {
  return (
    <section className="relative overflow-hidden border-rule border-ink bg-ink p-3 text-paper sm:p-4">
      <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:20%_100%]" />
      <div className="relative mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-latin text-[9px] font-black tracking-[0.2em] text-red" dir="ltr">YOUR FIVE</p>
          <h3 className="font-poster text-[24px] leading-none">החמישייה על הקיר</h3>
        </div>
        <p className="font-body text-[9px] text-paper/45">לחץ על מקום כדי לחזור ולשנות</p>
      </div>

      <div className="relative grid grid-cols-5 gap-1 sm:gap-2">
        {draft.slots.map((slot, index) => {
          const player = picks[index]
          const active = activeSlot === index
          return (
            <button
              type="button"
              onClick={() => onEdit(index)}
              key={`${slot.position}-${index}`}
              className={`min-w-0 border-hair p-2 text-center transition ${
                active ? 'border-red bg-red text-paper' : player ? 'border-paper/25 bg-paper/5' : 'border-paper/10 bg-transparent'
              }`}
            >
              <span className={`font-latin text-[8px] font-black tracking-[0.12em] ${active ? 'text-paper/75' : 'text-red'}`} dir="ltr">
                {POSITION_SHORT[slot.position]}
              </span>
              {player ? (
                <>
                  <p className="mt-2 truncate font-poster text-[14px] leading-none sm:text-[18px]">{player.nameHe}</p>
                  <p className="mt-2 font-poster text-[16px] text-paper/75 sm:text-[20px]" dir="ltr">{money(player.price)}</p>
                </>
              ) : (
                <>
                  <p className="mt-2 font-poster text-[24px] leading-none text-paper/15">?</p>
                  <p className="mt-1 font-body text-[8px] text-paper/35">פנוי</p>
                </>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function FighterToken({ player, ours }: { player: RoyalRumblePitchPlayer; ours: boolean }) {
  const first = player.nameHe.split(' ')[0] ?? player.nameHe
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
      style={{ left: `${player.x}%`, top: `${player.y}%` }}
      title={player.nameHe}
    >
      <div className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 border-paper text-[9px] font-black shadow-[0_3px_0_rgba(0,0,0,.45)] sm:h-11 sm:w-11 ${ours ? 'bg-red text-paper' : 'bg-ink text-paper'}`}>
        {first.slice(0, 2)}
        <span className={`absolute -bottom-1 h-1.5 w-5 ${ours ? 'bg-red' : 'bg-ink'}`} />
      </div>
      <div className="mt-1 max-w-[72px] truncate bg-ink/85 px-1 py-0.5 text-center font-body text-[7px] font-bold text-paper sm:text-[8px]">
        {first}
      </div>
    </div>
  )
}

function MatchPitch({ result, frameIndex }: { result: RoyalRumbleResult; frameIndex: number }) {
  const frame = result.frames[Math.min(frameIndex, result.frames.length - 1)] ?? result.frames[0]
  if (!frame) return null

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden border-rule border-ink bg-ink text-paper shadow-[0_18px_0_rgba(0,0,0,.18)]">
      <div className="relative overflow-hidden border-b-rule border-paper/15 px-3 py-3 sm:px-5">
        <div className="absolute inset-0 opacity-25 [background:repeating-linear-gradient(110deg,#B02D10_0,#B02D10_14px,transparent_14px,transparent_28px)]" />
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div>
            <p className="font-latin text-[8px] font-black tracking-[0.2em] text-red" dir="ltr">THE WORKER · GATE 09</p>
            <p className="font-poster text-[20px] leading-none sm:text-[26px]">רויאל ראמבל</p>
          </div>
          <div className="border-x-hair border-paper/20 px-4 text-center sm:px-8">
            <p className="font-poster text-[42px] leading-none sm:text-[56px]" dir="ltr">{frame.scoreFor}–{frame.scoreAgainst}</p>
          </div>
          <div className="text-left">
            <p className="font-latin text-[8px] font-black tracking-[0.16em] text-paper/45" dir="ltr">MATCH CLOCK</p>
            <p className="font-poster text-[24px] leading-none text-red sm:text-[30px]" dir="ltr">{String(frame.at).padStart(2, '0')}:00</p>
          </div>
        </div>
      </div>

      <div className="relative bg-[#123d25] p-2 sm:p-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-9 opacity-45 [background:repeating-linear-gradient(90deg,#171717_0,#171717_12px,#B02D10_12px,#B02D10_18px)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 opacity-45 [background:repeating-linear-gradient(90deg,#B02D10_0,#B02D10_10px,#171717_10px,#171717_22px)]" />

        <div className="relative mt-7 aspect-[1.52/1] overflow-hidden border-2 border-paper/65 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.025)_0,rgba(255,255,255,.025)_12.5%,rgba(0,0,0,.035)_12.5%,rgba(0,0,0,.035)_25%)] shadow-[inset_0_0_90px_rgba(0,0,0,.32)] sm:mt-8">
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-paper/55" />
          <div className="absolute left-1/2 top-1/2 h-[28%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper/55" />
          <div className="absolute left-0 top-1/2 h-[45%] w-[13%] -translate-y-1/2 border-y border-r border-paper/55" />
          <div className="absolute right-0 top-1/2 h-[45%] w-[13%] -translate-y-1/2 border-y border-l border-paper/55" />
          <div className="absolute left-0 top-1/2 h-[20%] w-[4%] -translate-y-1/2 border-y border-r border-paper/45" />
          <div className="absolute right-0 top-1/2 h-[20%] w-[4%] -translate-y-1/2 border-y border-l border-paper/45" />

          {frame.us.map((player) => <FighterToken key={`us-${player.slug}`} player={player} ours />)}
          {frame.them.map((player) => <FighterToken key={`them-${player.slug}`} player={player} ours={false} />)}

          <div
            className="absolute z-30 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-paper shadow-[0_2px_8px_rgba(0,0,0,.6)] transition-all duration-700 sm:h-4 sm:w-4"
            style={{ left: `${frame.ball.x}%`, top: `${frame.ball.y}%` }}
          />
        </div>

        <div className="relative mb-7 mt-2 grid grid-cols-[auto_1fr] items-center gap-3 border-rule border-paper/15 bg-ink/95 px-3 py-3 sm:mb-8 sm:px-4">
          <div className="flex items-center gap-2 font-latin text-[8px] font-black tracking-[0.18em] text-red" dir="ltr">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red" /> LIVE
          </div>
          <p className="font-body text-[12px] font-bold leading-snug sm:text-[14px]">{frame.commentaryHe}</p>
        </div>
      </div>
    </div>
  )
}

function CompactPlayer({ player, dark = false }: { player: RoyalRumblePublicPlayer; dark?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] items-center gap-2 border-b-hair py-2 ${dark ? 'border-paper/15' : 'border-ink/15'}`}>
      <div className="min-w-0">
        <p className="truncate font-body text-[11px] font-black">{player.nameHe}</p>
        <p className={`mt-0.5 font-latin text-[8px] font-black tracking-[0.12em] ${dark ? 'text-paper/40' : 'text-concrete'}`} dir="ltr">
          {POSITION_SHORT[player.position]} · {yearRange(player)}
        </p>
      </div>
      <span className="font-poster text-[21px] text-red" dir="ltr">{money(player.price)}</span>
    </div>
  )
}

export function RoyalRumbleRun({
  draft,
  cursor,
  playerCount,
}: {
  draft: RoyalRumbleDraft
  cursor: number
  playerCount: number
}) {
  const [phase, setPhase] = useState<Phase>('draft')
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
  const remaining = draft.budget - spent
  const complete = picks.every(Boolean)
  const currentSlot = draft.slots[activeSlot] ?? draft.slots[0]
  const selectedSlugs = useMemo(() => picks.map((player) => player?.slug ?? ''), [picks])

  function minimumRequiredAfter(slotIndex: number): number {
    return draft.slots.reduce((sum, slot, index) => {
      if (index === slotIndex) return sum
      const picked = picks[index]
      if (picked) return sum + picked.price
      const min = Math.min(...slot.offers.map((offer) => offer.price))
      return sum + min
    }, 0)
  }

  function canPick(slotIndex: number, player: RoyalRumblePublicPlayer): boolean {
    return minimumRequiredAfter(slotIndex) + player.price <= draft.budget
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

  async function lockFive() {
    if (!complete || remaining < 0 || busy) return
    setBusy(true)
    setError(null)
    const resolved = await submitRoyalRumble(draft.seed, selectedSlugs)
    setBusy(false)
    if (!resolved) {
      setError('החמישייה לא עברה אימות. בחר חמישה שחקנים מתוך ההגרלה ובתקציב.')
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
      <div className="relative mx-auto max-w-5xl overflow-hidden bg-ink px-3 py-6 text-paper sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background:repeating-linear-gradient(115deg,#B02D10_0,#B02D10_18px,transparent_18px,transparent_42px)]" />
        <div className="relative text-center">
          <p className="font-latin text-[9px] font-black tracking-[0.32em] text-red" dir="ltr">OPPONENT ENTRANCE</p>
          <h2 className="mt-2 font-poster text-[48px] leading-[0.85] sm:text-[70px]">חמש דלתות.<br />חמישה יריבים.</h2>
          <p className="mx-auto mt-4 max-w-lg font-body text-[11px] text-paper/50">החמישייה שמולך כבר נקבעה לפני הבחירה הראשונה שלך. אין התאמות, אין רחמים.</p>
        </div>

        <div className="relative mt-7 grid grid-cols-5 gap-1 sm:mt-10 sm:gap-2">
          {result.opponent.map((player, index) => {
            const open = index < revealCount
            return (
              <div key={player.slug} className={`relative min-h-[180px] overflow-hidden border-rule sm:min-h-[260px] ${open ? 'border-red bg-paper text-ink' : 'border-paper/15 bg-black/25 text-paper'}`}>
                {!open ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center [background:repeating-linear-gradient(180deg,#111_0,#111_12px,#1c1c1c_12px,#1c1c1c_24px)]">
                    <span className="font-poster text-[54px] leading-none text-paper/10 sm:text-[80px]">?</span>
                    <span className="mt-4 font-latin text-[7px] font-black tracking-[0.2em] text-red sm:text-[9px]" dir="ltr">
                      {index === revealCount ? 'SPINNING' : 'LOCKED'}
                    </span>
                  </div>
                ) : (
                  <div className="relative flex h-full min-h-[180px] animate-[rrDrop_.32s_ease-out] flex-col p-2 sm:min-h-[260px] sm:p-3">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-red" />
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-latin text-[7px] font-black tracking-[0.14em] text-red sm:text-[9px]" dir="ltr">ENTRY {index + 1}</span>
                      <span className="font-poster text-[22px] text-red sm:text-[30px]" dir="ltr">{money(player.price)}</span>
                    </div>
                    <div className="mt-auto">
                      <p className="font-poster text-[17px] leading-[0.9] sm:text-[26px]">{player.nameHe}</p>
                      <p className="mt-2 font-latin text-[7px] font-black tracking-[0.1em] text-concrete sm:text-[9px]" dir="ltr">{POSITION_SHORT[player.position]}</p>
                      <div className="mt-3"><PriceBars price={player.price} /></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="relative mt-6 text-center">
          <span className="inline-block border-x-rule border-red px-5 py-2 font-poster text-[30px] text-red sm:text-[42px]" dir="ltr">VS</span>
          <p className="mt-2 font-latin text-[8px] font-black tracking-[0.24em] text-paper/40" dir="ltr">ROYAL RUMBLE · GATE 09</p>
        </div>
        <style>{`@keyframes rrDrop{0%{opacity:0;transform:translateY(-18px) scale(.96)}100%{opacity:1;transform:none}}`}</style>
      </div>
    )
  }

  if (phase === 'match' && result) {
    return <div className="mx-auto max-w-5xl py-2"><MatchPitch result={result} frameIndex={frameIndex} /></div>
  }

  if (phase === 'result' && result) {
    const won = result.winner === 'us'
    const draw = result.winner === 'draw'
    return (
      <div className="mx-auto max-w-5xl pb-8 pt-2">
        <RecordRun gate="royal-rumble" score={won ? 3 : draw ? 1 : 0} correct={won ? 1 : 0} asked={1} />
        <section className="relative overflow-hidden border-rule border-ink bg-ink px-4 py-7 text-center text-paper sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -left-8 top-1/2 -translate-y-1/2 font-poster text-[190px] leading-none text-paper/[0.025]" dir="ltr">09</div>
          <p className="relative font-latin text-[9px] font-black tracking-[0.3em] text-red" dir="ltr">FULL TIME · ROYAL RUMBLE</p>
          <p className="relative mt-3 font-poster text-[92px] leading-[0.8] sm:text-[132px]" dir="ltr">{result.scoreFor}–{result.scoreAgainst}</p>
          <div className="relative mx-auto mt-5 h-1 w-20 bg-red" />
          <h2 className="relative mt-5 font-poster text-[34px] leading-none sm:text-[46px]">
            {won ? 'נשארת אחרון בזירה.' : draw ? 'אף חמישייה לא נפלה.' : 'הפעם זרקו אותך מהזירה.'}
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg font-body text-[11px] leading-relaxed text-paper/50">
            המספרים האמיתיים נשארים בחדר הסגור. המחיר מספר רק באיזה אזור איכות השחקן נמצא — לא כמה הוא באמת חזק.
          </p>
        </section>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <section className="border-rule border-ink bg-paper p-4 text-ink">
            <div className="mb-2 flex items-end justify-between">
              <div><p className="font-latin text-[8px] font-black tracking-[0.18em] text-red" dir="ltr">YOUR FIVE</p><h3 className="font-poster text-[24px]">החמישייה שלך</h3></div>
              <span className="font-poster text-[24px] text-red" dir="ltr">{money(spent)}</span>
            </div>
            {picks.filter(Boolean).map((player) => <CompactPlayer key={player!.slug} player={player!} />)}
          </section>
          <section className="border-rule border-ink bg-ink p-4 text-paper">
            <div className="mb-2"><p className="font-latin text-[8px] font-black tracking-[0.18em] text-red" dir="ltr">THEIR FIVE</p><h3 className="font-poster text-[24px]">החמישייה שנכנסה מולך</h3></div>
            {result.opponent.map((player) => <CompactPlayer key={player.slug} player={player} dark />)}
          </section>
        </div>

        <a href="/royal-rumble" className="group mt-3 flex min-h-[64px] items-center justify-between border-rule border-red bg-red px-5 text-paper transition hover:bg-ink">
          <span><span className="block font-latin text-[8px] font-black tracking-[0.18em] text-paper/60" dir="ltr">RUN IT BACK</span><span className="font-poster text-[27px]">עוד רויאל ראמבל</span></span>
          <span className="font-poster text-[38px] transition group-hover:-translate-x-1">←</span>
        </a>
      </div>
    )
  }

  if (!currentSlot) return null

  const pickedCount = picks.filter(Boolean).length
  const progress = (pickedCount / draft.slots.length) * 100

  return (
    <div className="mx-auto max-w-5xl pb-8 pt-1">
      <header className="relative overflow-hidden border-rule border-ink bg-ink text-paper">
        <div className="pointer-events-none absolute -left-5 -top-10 font-poster text-[220px] leading-none text-paper/[0.035] sm:text-[300px]" dir="ltr">09</div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[36%] opacity-20 [background:repeating-linear-gradient(120deg,#B02D10_0,#B02D10_12px,transparent_12px,transparent_30px)]" />

        <div className="relative grid gap-5 px-4 py-5 sm:grid-cols-[1fr_auto] sm:px-6 sm:py-7">
          <div>
            <div className="flex items-center gap-3">
              <span className="border-hair border-red px-2 py-1 font-latin text-[8px] font-black tracking-[0.2em] text-red" dir="ltr">GATE 09</span>
              <span className="font-latin text-[8px] font-black tracking-[0.18em] text-paper/35" dir="ltr">5V5 · HAPOEL ALL-TIME</span>
            </div>
            <h1 className="mt-3 font-poster text-[54px] leading-[0.78] sm:text-[78px]">רויאל<br /><span className="text-red">ראמבל</span></h1>
            <p className="mt-4 max-w-md font-body text-[11px] leading-relaxed text-paper/55 sm:text-[12px]">
              שלושה שמות נכנסים בכל סיבוב. אחד נשאר. בנה חמישייה ב־15 מיליון — בלי לראות לעולם את הציון האמיתי של אף שחקן.
            </p>
          </div>

          <div className="flex min-w-[180px] flex-col justify-end border-t-hair border-paper/15 pt-3 sm:border-r-hair sm:border-t-0 sm:pr-5 sm:pt-0">
            <p className="font-latin text-[8px] font-black tracking-[0.18em] text-paper/35" dir="ltr">MONEY LEFT</p>
            <div className="mt-1 flex items-end gap-2">
              <p className={`font-poster text-[52px] leading-none ${remaining < 0 ? 'text-red' : 'text-paper'}`} dir="ltr">{money(remaining)}</p>
              <span className="mb-1 font-body text-[9px] text-paper/35">מתוך {money(draft.budget)}</span>
            </div>
            <div className="mt-3 h-2 bg-paper/10"><div className="h-full bg-red transition-all duration-300" style={{ width: `${Math.min(100, progress)}%` }} /></div>
            <div className="mt-2 flex justify-between font-body text-[8px] text-paper/35"><span>{pickedCount}/5 נעולים</span><span>{playerCount} במאגר</span></div>
          </div>
        </div>
      </header>

      <div className="mt-3"><LineupRail draft={draft} picks={picks} activeSlot={activeSlot} onEdit={setActiveSlot} /></div>

      <section className="mt-3 border-rule border-ink bg-paper p-3 sm:p-5">
        <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-end gap-3">
          <div className="font-poster text-[54px] leading-none text-red sm:text-[68px]" dir="ltr">{String(activeSlot + 1).padStart(2, '0')}</div>
          <div className="border-r-rule border-ink pr-3">
            <p className="font-latin text-[8px] font-black tracking-[0.2em] text-red" dir="ltr">ENTRY DRAW · PICK {activeSlot + 1}/5</p>
            <h2 className="font-poster text-[28px] leading-none sm:text-[36px]">שלושה נכנסים. מי נשאר?</h2>
            <p className="mt-1 font-body text-[9px] text-concrete">עמדה: {POSITION_HE[currentSlot.position]} · המחיר גלוי, האיכות המדויקת לא.</p>
          </div>
          <div className="hidden text-left sm:block">
            <p className="font-latin text-[8px] font-black tracking-[0.16em] text-concrete" dir="ltr">SECRET RATING</p>
            <p className="font-poster text-[26px] leading-none" dir="ltr">09–99</p>
            <p className="font-body text-[8px] text-concrete">לעולם לא נחשף</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {currentSlot.offers.map((player, index) => (
            <DraftCard
              key={player.slug}
              player={player}
              index={index}
              selected={picks[activeSlot]?.slug === player.slug}
              disabled={!canPick(activeSlot, player)}
              onPick={() => pick(activeSlot, player)}
            />
          ))}
        </div>
        <p className="mt-3 text-center font-body text-[9px] text-concrete">כרטיס דהוי = הבחירה הזאת לא משאירה מספיק כסף להשלים חמישייה חוקית.</p>
      </section>

      {error && <p className="mt-3 border-rule border-red bg-red/10 p-3 font-body text-[11px] font-black text-red">{error}</p>}

      <button
        type="button"
        disabled={!complete || remaining < 0 || busy}
        onClick={() => void lockFive()}
        className="group mt-3 grid min-h-[68px] w-full grid-cols-[1fr_auto] items-center border-rule border-red bg-red px-5 text-right text-paper transition hover:bg-ink disabled:cursor-not-allowed disabled:border-concrete disabled:bg-concrete disabled:text-ink/55"
      >
        <span>
          <span className="block font-latin text-[8px] font-black tracking-[0.2em] opacity-60" dir="ltr">LOCK THE FIVE</span>
          <span className="font-poster text-[27px] sm:text-[31px]">{busy ? 'נועל את הזירה…' : complete ? 'נעל חמישייה · פתח את דלתות היריבה' : `חסרים עוד ${5 - pickedCount} שחקנים`}</span>
        </span>
        <span className="font-poster text-[42px] transition group-hover:-translate-x-1">←</span>
      </button>

      <div className="mt-3 grid gap-2 border-y-hair border-ink/15 py-3 text-center font-body text-[9px] leading-relaxed text-concrete sm:grid-cols-3">
        <span>€1M–€5M הוא מחיר, לא Rating.</span>
        <span>שני שחקני €5M יכולים להיות רחוקים מאוד בכוח.</span>
        <span>היריבה נקבעת מראש — אין התאמה לבחירות שלך.</span>
      </div>
      <span className="sr-only">סבב {cursor + 1}</span>
    </div>
  )
}