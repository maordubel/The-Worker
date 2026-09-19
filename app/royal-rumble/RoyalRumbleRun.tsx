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

function money(value: number): string {
  return `€${value}M`
}

function PlayerCard({
  player,
  selected,
  disabled,
  onPick,
}: {
  player: RoyalRumblePublicPlayer
  selected?: boolean
  disabled?: boolean
  onPick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className={`relative min-h-[142px] border-rule p-3 text-right transition-transform active:scale-[0.98] ${
        selected ? 'border-red bg-red text-paper' : 'border-ink bg-paper text-ink'
      } ${disabled ? 'opacity-35' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`font-latin text-[11px] font-black tracking-[0.16em] ${selected ? 'text-paper/80' : 'text-red'}`}>
          {POSITION_HE[player.position]}
        </span>
        <span className={`font-poster text-[28px] leading-none ${selected ? 'text-paper' : 'text-red'}`} dir="ltr">
          {money(player.price)}
        </span>
      </div>
      <p className="mt-6 font-poster text-[25px] leading-[0.95]">{player.nameHe}</p>
      <p className={`mt-2 font-body text-[11px] ${selected ? 'text-paper/70' : 'text-concrete'}`}>
        {player.fromYear ?? '—'}–{player.toYear ?? '—'}
      </p>
      {selected && (
        <span className="absolute bottom-2 left-2 font-latin text-[10px] font-black tracking-[0.16em]" dir="ltr">
          LOCKED
        </span>
      )}
    </button>
  )
}

function TinyPlayer({ player, dark = false }: { player: RoyalRumblePublicPlayer; dark?: boolean }) {
  return (
    <div className={`border-hair px-2 py-2 ${dark ? 'border-paper/25 bg-paper/5 text-paper' : 'border-ink/20 bg-paper text-ink'}`}>
      <p className="truncate font-body text-[11px] font-bold">{player.nameHe}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="font-latin text-[9px] font-black tracking-[0.12em]">{POSITION_HE[player.position]}</span>
        <span className="font-poster text-[17px] text-red" dir="ltr">{money(player.price)}</span>
      </div>
    </div>
  )
}

function Dot({ player, ours }: { player: RoyalRumblePitchPlayer; ours: boolean }) {
  return (
    <div
      className={`absolute z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[8px] font-black transition-all duration-700 ${
        ours ? 'border-paper bg-red text-paper' : 'border-paper bg-ink text-paper'
      }`}
      style={{ left: `${player.x}%`, top: `${player.y}%` }}
      title={player.nameHe}
    >
      {player.nameHe.split(' ')[0]?.slice(0, 2)}
    </div>
  )
}

function MatchPitch({ result, frameIndex }: { result: RoyalRumbleResult; frameIndex: number }) {
  const frame = result.frames[Math.min(frameIndex, result.frames.length - 1)] ?? result.frames[0]
  if (!frame) return null

  return (
    <section className="overflow-hidden border-rule border-paper/30 bg-[#174f2b] text-paper shadow-[inset_0_0_80px_rgba(0,0,0,.35)]">
      <div className="flex items-center justify-between border-b-hair border-paper/25 bg-ink px-3 py-2">
        <span className="font-latin text-[11px] font-black tracking-[0.16em]" dir="ltr">ROYAL RUMBLE · 5V5</span>
        <div className="font-poster text-[30px] leading-none" dir="ltr">
          {frame.scoreFor}–{frame.scoreAgainst}
        </div>
        <span className="font-latin text-[11px] font-black" dir="ltr">{String(frame.at).padStart(2, '0')}:00</span>
      </div>

      <div className="relative aspect-[1.45/1] overflow-hidden">
        <div className="absolute inset-3 border-2 border-paper/50" />
        <div className="absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 bg-paper/50" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper/50" />
        <div className="absolute left-3 top-1/2 h-32 w-16 -translate-y-1/2 border-2 border-l-0 border-paper/50" />
        <div className="absolute right-3 top-1/2 h-32 w-16 -translate-y-1/2 border-2 border-r-0 border-paper/50" />

        {frame.us.map((player) => <Dot key={`us-${player.slug}`} player={player} ours />)}
        {frame.them.map((player) => <Dot key={`them-${player.slug}`} player={player} ours={false} />)}

        <div
          className="absolute z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink bg-paper shadow transition-all duration-700"
          style={{ left: `${frame.ball.x}%`, top: `${frame.ball.y}%` }}
        />
      </div>

      <p className="min-h-[44px] border-t-hair border-paper/25 bg-ink px-3 py-3 font-body text-[13px] font-bold">
        {frame.commentaryHe}
      </p>
    </section>
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
  const [result, setResult] = useState<RoyalRumbleResult | null>(null)
  const [revealCount, setRevealCount] = useState(0)
  const [frameIndex, setFrameIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const spent = picks.reduce((sum, player) => sum + (player?.price ?? 0), 0)
  const remaining = draft.budget - spent
  const complete = picks.every(Boolean)

  const selectedSlugs = useMemo(() => picks.map((player) => player?.slug ?? ''), [picks])

  function pick(slotIndex: number, player: RoyalRumblePublicPlayer) {
    if (phase !== 'draft') return
    setError(null)
    setPicks((previous) => {
      const next = [...previous]
      next[slotIndex] = player
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
      const launch = window.setTimeout(() => setPhase('match'), 900)
      return () => window.clearTimeout(launch)
    }
    const timer = window.setTimeout(() => setRevealCount((value) => value + 1), 720)
    return () => window.clearTimeout(timer)
  }, [phase, result, revealCount])

  useEffect(() => {
    if (phase !== 'match' || !result) return
    if (frameIndex >= result.frames.length - 1) {
      const finish = window.setTimeout(() => setPhase('result'), 1500)
      return () => window.clearTimeout(finish)
    }
    const timer = window.setTimeout(() => setFrameIndex((value) => value + 1), 1200)
    return () => window.clearTimeout(timer)
  }, [phase, result, frameIndex])

  if (phase === 'reveal' && result) {
    return (
      <div className="mx-auto max-w-3xl py-4">
        <div className="mb-5 border-rule border-ink bg-ink p-4 text-paper">
          <p className="font-latin text-[11px] font-black tracking-[0.2em] text-red" dir="ltr">OPPONENT DRAW</p>
          <h2 className="mt-1 font-poster text-[42px] leading-none">מי נכנס לזירה?</h2>
          <p className="mt-2 font-body text-[12px] text-paper/65">היריבה כבר נקבעה לפני שבחרת. עכשיו היא נחשפת.</p>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {result.opponent.map((player, index) => (
            <div key={player.slug} className="relative min-h-[126px] overflow-hidden border-rule border-ink bg-ink text-paper">
              {index < revealCount ? (
                <div className="animate-[fadeIn_.25s_ease-out] p-2">
                  <p className="font-latin text-[9px] font-black tracking-[0.12em] text-red">{POSITION_HE[player.position]}</p>
                  <p className="mt-5 font-poster text-[18px] leading-none">{player.nameHe}</p>
                  <p className="mt-3 font-poster text-[22px] text-red" dir="ltr">{money(player.price)}</p>
                </div>
              ) : (
                <div className="flex h-full min-h-[126px] flex-col items-center justify-center bg-[repeating-linear-gradient(180deg,#171717_0,#171717_10px,#262626_10px,#262626_20px)]">
                  <span className="font-poster text-[34px] text-paper/20">?</span>
                  <span className="mt-2 font-latin text-[8px] font-black tracking-[0.18em] text-red" dir="ltr">SPINNING</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'match' && result) {
    return (
      <div className="mx-auto max-w-3xl py-3">
        <MatchPitch result={result} frameIndex={frameIndex} />
      </div>
    )
  }

  if (phase === 'result' && result) {
    const won = result.winner === 'us'
    const draw = result.winner === 'draw'
    return (
      <div className="mx-auto max-w-3xl py-5">
        <RecordRun gate="royal-rumble" score={won ? 3 : draw ? 1 : 0} correct={won ? 1 : 0} asked={1} />
        <div className="border-rule border-ink bg-ink p-5 text-center text-paper">
          <p className="font-latin text-[11px] font-black tracking-[0.2em] text-red" dir="ltr">FULL TIME</p>
          <p className="mt-3 font-poster text-[76px] leading-none" dir="ltr">{result.scoreFor}–{result.scoreAgainst}</p>
          <h2 className="mt-3 font-poster text-[34px] leading-none">
            {won ? 'החמישייה שלך ניצחה.' : draw ? 'אף אחד לא נפל.' : 'הפעם היריבה לקחה את זה.'}
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-[12px] leading-relaxed text-paper/65">
            הציונים נשארים סודיים. המחיר הוא רק טווח — גם שני שחקנים של €5M יכולים להיות רחוקים מאוד זה מזה.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="border-rule border-ink p-3">
            <p className="mb-2 font-poster text-[20px]">החמישייה שלך</p>
            <div className="space-y-1.5">{picks.filter(Boolean).map((player) => <TinyPlayer key={player!.slug} player={player!} />)}</div>
          </div>
          <div className="border-rule border-ink bg-ink p-3 text-paper">
            <p className="mb-2 font-poster text-[20px]">החמישייה שלהם</p>
            <div className="space-y-1.5">{result.opponent.map((player) => <TinyPlayer key={player.slug} player={player} dark />)}</div>
          </div>
        </div>

        <a
          href="/royal-rumble"
          className="mt-4 flex min-h-[52px] items-center justify-center border-rule border-red bg-red px-4 font-poster text-[24px] text-paper"
        >
          עוד ראמבל
        </a>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl pb-6 pt-2">
      <header className="border-rule border-ink bg-ink px-4 pb-4 pt-3 text-paper">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-latin text-[10px] font-black tracking-[0.2em] text-red" dir="ltr">GATE 9 · ROYAL RUMBLE</p>
            <h1 className="mt-1 font-poster text-[42px] leading-none">רויאל ראמבל</h1>
          </div>
          <div className="text-left">
            <p className="font-body text-[10px] text-paper/55">נשאר</p>
            <p className={`font-poster text-[34px] leading-none ${remaining < 0 ? 'text-red' : 'text-paper'}`} dir="ltr">{money(remaining)}</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-paper/15">
          <div className="h-full bg-red transition-all" style={{ width: `${Math.min(100, (spent / draft.budget) * 100)}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between font-body text-[10px] text-paper/60">
          <span>{playerCount} שחקנים במאגר הפעיל</span>
          <span dir="ltr">{money(spent)} / {money(draft.budget)}</span>
        </div>
      </header>

      <div className="mt-4 space-y-5">
        {draft.slots.map((slot, slotIndex) => (
          <section key={`${slot.position}-${slotIndex}`}>
            <div className="mb-2 flex items-end justify-between gap-3 border-b-rule border-ink pb-1">
              <div>
                <span className="font-latin text-[9px] font-black tracking-[0.18em] text-red" dir="ltr">PICK {slotIndex + 1}/5</span>
                <h2 className="font-poster text-[26px] leading-none">{POSITION_HE[slot.position]}</h2>
              </div>
              {picks[slotIndex] && <span className="font-body text-[10px] text-concrete">נבחר: {picks[slotIndex]?.nameHe}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {slot.offers.map((player) => (
                <PlayerCard
                  key={player.slug}
                  player={player}
                  selected={picks[slotIndex]?.slug === player.slug}
                  onPick={() => pick(slotIndex, player)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {error && <p className="mt-4 border-rule border-red bg-red/10 p-3 font-body text-[12px] font-bold text-red">{error}</p>}
      {remaining < 0 && (
        <p className="mt-4 border-rule border-red p-3 font-body text-[12px] font-bold text-red">
          חריגה של {money(Math.abs(remaining))}. אפשר להחליף כל בחירה לפני הנעילה.
        </p>
      )}

      <button
        type="button"
        disabled={!complete || remaining < 0 || busy}
        onClick={() => void lockFive()}
        className="mt-5 min-h-[56px] w-full border-rule border-red bg-red px-5 font-poster text-[25px] text-paper disabled:border-concrete disabled:bg-concrete disabled:text-ink/60"
      >
        {busy ? 'נועל את הזירה…' : complete ? 'נעל חמישייה · חשוף יריבה' : 'בחר חמישה כדי להיכנס לזירה'}
      </button>

      <p className="mt-3 text-center font-body text-[10px] leading-relaxed text-concrete">
        הציון האמיתי של כל שחקן הוא 9–99 ונשאר חסוי תמיד. €5M פירושו רק שהשחקן בטווח העליון — לא מה המספר שלו.
      </p>
      <span className="sr-only">סבב {cursor + 1}</span>
    </div>
  )
}
