'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { KitShirt } from '@/components/kit/KitShirt'
import { RecordRun } from '@/components/play/RecordRun'
import type { RoyalRumbleDraft, RoyalRumblePublicPlayer, RoyalRumbleResult } from '@/lib/game/royal-rumble'
import type { KitSpec } from '@/lib/kit/spec'
import { currentAccount, signInWithGoogle, type Account } from '@/lib/portal/sync'
import { t } from '@/lib/royal-rumble/i18n'
import {
  createRoyalRumbleRoom,
  getRoyalRumbleLiveState,
  joinRoyalRumbleRoom,
  lockRoyalRumbleLive,
  resolveRoyalRumbleLive,
  type RoyalRumbleLiveRoom,
  type RoyalRumbleLiveState,
} from './live-actions'
import { RoyalRumbleSlotReveal } from './RoyalRumbleSlotReveal'

type EraKit = { seasonLabel: string; spec: KitSpec }
type Phase = 'lobby' | 'draft' | 'waiting' | 'countdown' | 'result'

function money(value: number) { return `€${value}M` }
function seasonYear(label: string): number | null { const m = label.match(/(\d{4})/); return m ? Number(m[1]) : null }
function kitForPlayer(player: RoyalRumblePublicPlayer, kits: EraKit[]): EraKit | null {
  if (!kits.length || (player.fromYear === null && player.toYear === null)) return null
  const start = player.fromYear ?? player.toYear ?? 0
  const end = player.toYear ?? player.fromYear ?? start
  const mid = (start + end) / 2
  const dated = kits.map((kit) => ({ kit, year: seasonYear(kit.seasonLabel) })).filter((x): x is { kit: EraKit; year: number } => x.year !== null)
  const inside = dated.filter(({ year }) => year >= start && year <= end)
  return [...(inside.length ? inside : dated)].sort((a, b) => Math.abs(a.year - mid) - Math.abs(b.year - mid))[0]?.kit ?? null
}
function Shirt({ player, kits }: { player: RoyalRumblePublicPlayer; kits: EraKit[] }) {
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
        <img src={specialSeason.src} alt={t('kitSeason', { season: specialSeason.season })} className="h-[116px] w-[102px] scale-[1.07] object-contain" />
        <span className="absolute bottom-0 end-0 bg-ink px-1.5 py-0.5 font-mono tabular-nums text-[6px] font-black tracking-[0.12em] text-paper" dir="ltr">{specialSeason.season}</span>
      </div>
    )
  }
  const kit = kitForPlayer(player, kits)
  return kit ? <KitShirt spec={kit.spec} className="h-[116px] w-[102px] scale-[1.04]" title={t('kitSeason', { season: kit.seasonLabel })} /> : <div className="h-[106px]" />
}
function Lamp({ on }: { on: boolean }) { return <span className={`inline-block h-2.5 w-2.5 ${on ? 'bg-red' : 'border border-paper/40'}`} /> }

export function RoyalRumbleLiveRun({ draft, shuffleDraft, matchSeed, kits, initialRoomCode }: {
  draft: RoyalRumbleDraft
  shuffleDraft: RoyalRumbleDraft
  matchSeed: number
  kits: EraKit[]
  initialRoomCode?: string
}) {
  const [account, setAccount] = useState<Account | null | undefined>(undefined)
  const [room, setRoom] = useState<RoyalRumbleLiveRoom | null>(null)
  const [state, setState] = useState<RoyalRumbleLiveState | null>(null)
  const [code, setCode] = useState(initialRoomCode?.toUpperCase() ?? '')
  const [phase, setPhase] = useState<Phase>('lobby')
  const [activeDraft, setActiveDraft] = useState(draft)
  const [shuffleUsed, setShuffleUsed] = useState(false)
  const [picks, setPicks] = useState<Array<RoyalRumblePublicPlayer | null>>(() => Array(5).fill(null))
  const [slot, setSlot] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(4)
  const [result, setResult] = useState<RoyalRumbleResult | null>(null)
  const autoJoin = useRef(false)
  const resolved = useRef(false)

  const selected = picks.filter((p): p is RoyalRumblePublicPlayer => p !== null)
  const spent = selected.reduce((sum, p) => sum + p.price, 0)
  const remaining = activeDraft.budget - spent
  const complete = picks.every(Boolean)
  const currentSlot = activeDraft.slots[slot] ?? activeDraft.slots[0]

  const refresh = useCallback(async (target: RoyalRumbleLiveRoom | null) => {
    if (!target) return
    const next = await getRoyalRumbleLiveState(target.id)
    if (!next) return
    setState(next)
    if (next.status === 'countdown') setPhase('countdown')
    else if (next.youReady) setPhase('waiting')
    else if (next.opponentJoined) setPhase('draft')
  }, [])

  const updateUrl = useCallback((roomCode: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('seed', String(draft.seed >>> 0))
    url.searchParams.set('room', roomCode)
    window.history.replaceState({}, '', url.toString())
  }, [draft.seed])

  const join = useCallback(async (roomCode: string) => {
    if (!account || !roomCode.trim()) return
    setBusy(true); setError(false)
    const next = await joinRoyalRumbleRoom(roomCode, matchSeed, draft.seed)
    setBusy(false)
    if (!next) { setError(true); return }
    setRoom(next); setCode(next.code); updateUrl(next.code)
    await refresh(next)
    setPhase('draft')
  }, [account, draft.seed, matchSeed, refresh, updateUrl])

  useEffect(() => { void currentAccount().then(setAccount) }, [])
  useEffect(() => {
    if (!account || !initialRoomCode || autoJoin.current) return
    autoJoin.current = true
    void join(initialRoomCode)
  }, [account, initialRoomCode, join])
  useEffect(() => {
    if (!room) return
    void refresh(room)
    const timer = window.setInterval(() => void refresh(room), 1200)
    return () => window.clearInterval(timer)
  }, [room, refresh])

  useEffect(() => {
    if (phase !== 'countdown' || !state?.startsAt || !room || resolved.current) return
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((new Date(state.startsAt!).getTime() - Date.now()) / 1000))
      setCountdown(left)
      if (left === 0 && !resolved.current) {
        resolved.current = true
        setBusy(true)
        void resolveRoyalRumbleLive(room.id).then((next) => {
          setBusy(false)
          if (!next) { resolved.current = false; setError(true); return }
          setResult(next); setPhase('result')
        })
      }
    }, 120)
    return () => window.clearInterval(timer)
  }, [phase, room, state?.startsAt])

  function cheapestOther(except: number): number {
    return activeDraft.slots.reduce((sum, s, index) => {
      if (index === except) return sum
      const picked = picks[index]
      return sum + (picked?.price ?? Math.min(...s.offers.map((o) => o.price)))
    }, 0)
  }
  function canPick(index: number, player: RoyalRumblePublicPlayer) {
    const othersSpent = picks.reduce((sum, p, i) => sum + (i === index ? 0 : p?.price ?? 0), 0)
    return othersSpent + player.price + Math.max(0, cheapestOther(index) - othersSpent) <= activeDraft.budget
  }
  function pick(player: RoyalRumblePublicPlayer) {
    if (!canPick(slot, player)) return
    setPicks((current) => current.map((item, index) => index === slot ? player : item))
    setSlot((value) => Math.min(4, value + 1))
  }
  function shuffle() {
    if (shuffleUsed) return
    setActiveDraft(shuffleDraft); setShuffleUsed(true); setPicks(Array(5).fill(null)); setSlot(0)
  }
  async function create() {
    setBusy(true); setError(false)
    const next = await createRoyalRumbleRoom(matchSeed, draft.seed)
    setBusy(false)
    if (!next) { setError(true); return }
    setRoom(next); setCode(next.code); updateUrl(next.code); setPhase('draft'); await refresh(next)
  }
  async function lock() {
    if (!room || !complete || remaining < 0) return
    setBusy(true); setError(false)
    const next = await lockRoyalRumbleLive(room.id, activeDraft.seed, picks.map((p) => p!.slug))
    setBusy(false)
    if (!next) { setError(true); return }
    setState(next); setPhase(next.status === 'countdown' ? 'countdown' : 'waiting')
  }
  async function copyRoom() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true); window.setTimeout(() => setCopied(false), 1400)
  }

  if (account === undefined) return <div className="border-rule border-ink bg-ink p-6 font-display text-[28px] text-paper">LIVE…</div>
  if (!account) return (
    <section className="border-rule border-ink bg-ink p-5 text-paper">
      <p className="font-mono tabular-nums text-[9px] font-black tracking-[.22em] text-red" dir="ltr">ROYAL RUMBLE · LIVE</p>
      <h2 className="mt-2 font-display text-[36px] leading-none">{t('liveTitle')}</h2>
      <p className="mt-3 max-w-xl font-body text-[11px] text-paper/55">{t('liveSignInBody')}</p>
      <button type="button" onClick={() => void signInWithGoogle(`${window.location.pathname}${window.location.search}`)} className="mt-5 min-h-tap border-rule border-red bg-red px-5 font-display text-[24px] text-paper">{t('liveSignIn')}</button>
    </section>
  )

  if (!room) return (
    <section className="grid gap-3 border-rule border-ink bg-paper p-4 sm:grid-cols-2">
      <div className="border-rule border-ink bg-ink p-4 text-paper">
        <p className="font-mono tabular-nums text-[8px] font-black tracking-[.2em] text-red" dir="ltr">HOST</p>
        <h2 className="mt-1 font-display text-[30px]">{t('liveCreateTitle')}</h2>
        <p className="mt-2 font-body text-[10px] text-paper/50">{t('liveCreateBody')}</p>
        <button type="button" disabled={busy} onClick={() => void create()} className="mt-4 min-h-tap w-full border-rule border-red bg-red px-4 font-display text-[24px] text-paper disabled:opacity-40">{t('liveCreate')}</button>
      </div>
      <div className="border-rule border-ink bg-paper p-4 text-ink">
        <p className="font-mono tabular-nums text-[8px] font-black tracking-[.2em] text-red" dir="ltr">JOIN</p>
        <h2 className="mt-1 font-display text-[30px]">{t('liveJoinTitle')}</h2>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t('liveCodePlaceholder')} className="mt-3 min-h-tap w-full border-rule border-ink bg-paper px-3 font-mono tabular-nums text-[18px] font-black uppercase tracking-[.18em]" dir="ltr" />
        <button type="button" disabled={busy || !code.trim()} onClick={() => void join(code)} className="mt-3 min-h-tap w-full border-rule border-ink bg-ink px-4 font-display text-[24px] text-paper disabled:opacity-40">{t('liveJoin')}</button>
      </div>
      {error && <p className="sm:col-span-2 border-rule border-red bg-red/10 p-3 font-body text-[10px] font-black text-red">{t('liveError')}</p>}
    </section>
  )

  if (phase === 'result' && result) {
    const won = result.winner === 'us'; const draw = result.winner === 'draw'
    return <div><RecordRun gate="royal-rumble-live" score={won ? 3 : draw ? 1 : 0} correct={won ? 1 : 0} asked={1} />
      <section className="border-rule border-ink bg-ink p-6 text-center text-paper"><p className="font-mono tabular-nums text-[9px] font-black tracking-[.24em] text-red" dir="ltr">LIVE · FULL TIME</p><p className="mt-3 font-display text-[104px] leading-none" dir="ltr">{result.scoreFor}–{result.scoreAgainst}</p><h2 className="mt-3 font-display text-[36px]">{won ? t('liveWon') : draw ? t('liveDraw') : t('liveLost')}</h2></section></div>
  }
  if (phase === 'countdown') return <section className="border-rule border-ink bg-ink p-7 text-center text-paper"><p className="font-mono tabular-nums text-[9px] font-black tracking-[.26em] text-red" dir="ltr">SYNCED START</p><p className="mt-2 font-body text-[11px] text-paper/50">{t('liveCountdown')}</p><p className="mt-4 font-display text-[140px] leading-none text-red" dir="ltr">{countdown || 'GO'}</p>{busy && <p className="font-body text-[10px] text-paper/45">{t('liveResolving')}</p>}</section>
  if (phase === 'waiting') return <section className="border-rule border-ink bg-ink p-5 text-paper"><div className="flex items-center justify-between gap-3"><div><p className="font-mono tabular-nums text-[8px] font-black tracking-[.2em] text-red" dir="ltr">ROOM {room.code}</p><h2 className="mt-1 font-display text-[32px]">{t('liveLocked')}</h2></div><div className="flex gap-4 font-body text-[9px]"><span className="flex items-center gap-2"><Lamp on />{t('liveYouReady')}</span><span className="flex items-center gap-2"><Lamp on={Boolean(state?.opponentReady)} />{t('liveOpponentReady')}</span></div></div><p className="mt-4 border-t border-paper/15 pt-4 font-body text-[11px] text-paper/50">{t('liveWaiting')}</p></section>
  if (!currentSlot) return null

  return <div className="space-y-3">
    <section className="border-rule border-ink bg-ink p-4 text-paper"><div className="flex items-center justify-between gap-3"><div><p className="font-mono tabular-nums text-[8px] font-black tracking-[.2em] text-red" dir="ltr">LIVE ROOM · {room.code}</p><h2 className="mt-1 font-display text-[31px]">{t('liveDraftTitle')}</h2></div><button type="button" onClick={() => void copyRoom()} className="min-h-tap border border-paper/25 px-3 font-body text-[10px] font-black">{copied ? t('liveCopied') : t('liveCopy')}</button></div><div className="mt-3 grid grid-cols-2 gap-2 border-t border-paper/15 pt-3 font-body text-[9px]"><span className="flex items-center gap-2"><Lamp on />{t('liveYou')}</span><span className="flex items-center gap-2"><Lamp on={Boolean(state?.opponentJoined)} />{state?.opponentJoined ? t('liveOpponentJoined') : t('liveOpponentMissing')}</span></div></section>
    <section className="border-rule border-ink bg-paper p-3 text-ink sm:p-5"><div className="flex items-end justify-between gap-3"><div><p className="font-mono tabular-nums text-[8px] font-black tracking-[.18em] text-red" dir="ltr">PICK {slot + 1}/5</p><h3 className="font-display text-[28px]">{t('draftQuestion')}</h3></div><p className="font-display text-[34px] text-red" dir="ltr">{money(remaining)}</p></div>
      <div className="relative mt-4"><RoyalRumbleSlotReveal offers={currentSlot.offers} signature={`${activeDraft.seed}-${slot}`} /><div className="grid grid-cols-3 gap-2 sm:gap-3">{currentSlot.offers.map((player) => { const active = picks[slot]?.slug === player.slug; const disabled = !canPick(slot, player); return <button key={player.slug} type="button" disabled={disabled} onClick={() => pick(player)} className={`min-h-[245px] border-rule p-2 text-start ${active ? 'border-red bg-red text-paper' : 'border-ink bg-paper text-ink'} ${disabled ? 'opacity-25 grayscale' : ''}`}><div className="flex items-start justify-between"><span className="font-mono tabular-nums text-[8px] font-black text-red" dir="ltr">{player.position}</span><span className={`font-display text-[28px] ${active ? 'text-paper' : 'text-red'}`} dir="ltr">{money(player.price)}</span></div><div className="mt-2 flex h-[112px] items-center justify-center"><Shirt player={player} kits={kits} /></div><p className="mt-3 font-display text-[22px] leading-[.9]">{player.nameHe}</p></button> })}</div></div>
    </section>
    <section className="grid grid-cols-5 gap-1 border-rule border-ink bg-ink p-2 text-paper">{activeDraft.slots.map((s, i) => <button key={`${s.position}-${i}`} type="button" onClick={() => setSlot(i)} className={`min-h-tap border p-1 text-center ${slot === i ? 'border-red bg-red' : 'border-paper/15'}`}><span className="font-mono tabular-nums text-[7px] font-black" dir="ltr">{s.position}</span><span className="mt-1 block truncate font-body text-[8px] font-black">{picks[i]?.nameHe ?? '—'}</span></button>)}</section>
    <div className="grid gap-2 sm:grid-cols-2"><button type="button" disabled={shuffleUsed || busy} onClick={shuffle} className="min-h-tap border-rule border-ink bg-paper px-4 text-start font-display text-[22px] text-ink disabled:opacity-35">{shuffleUsed ? t('shuffleUsed') : t('shuffleAction')}</button><button type="button" disabled={!complete || remaining < 0 || busy || !state?.opponentJoined} onClick={() => void lock()} className="min-h-tap border-rule border-red bg-red px-4 text-start font-display text-[24px] text-paper disabled:opacity-35">{busy ? t('locking') : t('liveLock')}</button></div>
    {error && <p className="border-rule border-red bg-red/10 p-3 font-body text-[10px] font-black text-red">{t('liveError')}</p>}
  </div>
}
