'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

import { EnemyPlate } from '@/components/hate/EnemyPlate'
import { Punch } from '@/components/play/Punch'
import { Num } from '@/components/ui/Num'
import { AdSlot } from '@/components/ads/AdSlot'
import { ShareRow } from '@/components/share/ShareRow'
import { artFor } from '@/lib/share/story'
import { DUEL_COUNT, duelAt, type Enemy, judgeRun, standingKey } from '@/lib/game/hate-run'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * משחק השנאה — מלך הגבעה.
 *
 * Maor's brief, verbatim: head to head, allow a swipe left or right, no stages, and
 * whoever you pick STAYS for the next one — ten different head-to-heads per run.
 *
 * So the screen holds exactly two plates and never more. The one you kept is pinned at
 * the top with his streak stamped on him; the next challenger prints underneath. Drag
 * the arena toward a side and that side grows while the other drains — direction maps
 * to a PERSON, not to a yes/no, which is the only version of this a Hebrew reader does
 * not have to learn. A tap still works, because a swipe you have to discover is a
 * swipe that costs you the first duel.
 *
 * The drag runs on pointer events, so it is one code path for finger, trackpad and
 * mouse. Nothing here is graded — a feeling cannot be wrong. What comes back is who
 * survived ten and how far the run tracked the terrace's own ranking.
 */

const THRESHOLD = 68
/** how far the finger must travel before the arena claims the gesture from the plate */
const SLOP = 6
const STAMP_MS = 520

type Side = 'holder' | 'challenger'

export function HateHill({
  enemies,
  order,
  seed,
  rosterSize,
}: {
  enemies: Enemy[]
  order: string[]
  seed: number
  rosterSize: number
}) {
  const [picks, setPicks] = useState<string[]>([])
  const [stamped, setStamped] = useState<{ won: string; out: string } | null>(null)
  const [drag, setDrag] = useState(0)
  const start = useRef<number | null>(null)
  const captured = useRef(false)

  const bySlug = useMemo(() => new Map(enemies.map((enemy) => [enemy.slug, enemy])), [enemies])
  const duel = duelAt(order, picks, picks.length)
  const verdict = picks.length >= DUEL_COUNT ? judgeRun(enemies, order, picks) : null

  const holder = duel ? bySlug.get(duel.holderSlug) : undefined
  const challenger = duel ? bySlug.get(duel.challengerSlug) : undefined

  // how long the current holder has been standing, so the pinned plate carries a stake
  const streak = useMemo(() => {
    let run = 0
    for (let index = picks.length - 1; index >= 0; index -= 1) {
      if (picks[index] === picks[picks.length - 1]) run += 1
      else break
    }
    return run
  }, [picks])

  const choose = useCallback(
    (winner: string, loser: string) => {
      if (stamped) return
      setDrag(0)
      start.current = null
      captured.current = false
      setStamped({ won: winner, out: loser })
      window.setTimeout(() => {
        setPicks((previous) => [...previous, winner])
        setStamped(null)
      }, STAMP_MS)
    },
    [stamped],
  )

  function pick(side: Side) {
    if (!holder || !challenger) return
    if (side === 'holder') choose(holder.slug, challenger.slug)
    else choose(challenger.slug, holder.slug)
  }

  function onDown(event: React.PointerEvent<HTMLDivElement>) {
    if (stamped) return
    start.current = event.clientX
    captured.current = false
  }

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (start.current === null) return
    const dx = event.clientX - start.current
    // Capture only once the finger has actually travelled. Capturing on pointerdown
    // swallows the click the plate needs, so every TAP was silently doing nothing —
    // and a tap that does nothing is worse than no swipe at all.
    if (!captured.current) {
      if (Math.abs(dx) < SLOP) return
      captured.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    // resist past the threshold so the card never flies off the glass
    setDrag(Math.sign(dx) * Math.min(Math.abs(dx), THRESHOLD * 1.6))
  }

  function onUp() {
    if (start.current === null) return
    const dx = captured.current ? drag : 0
    start.current = null
    captured.current = false
    if (Math.abs(dx) >= THRESHOLD) pick(dx > 0 ? 'holder' : 'challenger')
    else setDrag(0)
  }

  if (verdict) return <Verdict verdict={verdict} seed={seed} rosterSize={rosterSize} />
  if (!duel || !holder || !challenger) return null

  const lean = Math.max(-1, Math.min(1, drag / THRESHOLD))
  const opening = picks.length === 0

  return (
    <div className="mt-stack select-none">
      <div className="flex items-end justify-between gap-3 border-b-rule border-ink pb-2">
        <div>
          <p className="font-latin text-[9px] font-bold tracking-[0.2em] text-red" dir="ltr">
            GATE 11 · KING OF THE HILL
          </p>
          <p className="font-display text-step-1 leading-tight text-ink">
            {t('hate.duelOf', { n: String(picks.length + 1), of: String(DUEL_COUNT) })}
          </p>
        </div>
        <ol className="flex items-center gap-1.5" aria-label={t('hate.duel')}>
          {Array.from({ length: DUEL_COUNT }, (_, index) => (
            <li
              key={index}
              className={`h-2.5 w-2.5 border-hair border-ink ${
                index < picks.length ? 'bg-red' : 'bg-transparent'
              }`}
            />
          ))}
        </ol>
      </div>

      {opening && (
        <p className="mt-2.5 max-w-prose font-body text-step--1 leading-relaxed text-muted">
          {t('hate.lede')}
        </p>
      )}

      <p className="mt-2.5 font-display text-step-2 leading-tight text-ink">{t('hate.pick')}</p>

      {/* the arena — one drag surface, two plates, direction points at a person.
          The clip is load-bearing: a translated child widens the document and the whole
          page slides with the finger, which reads as the app breaking. */}
      <div className="overflow-x-clip">
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="mt-2.5 touch-pan-y"
        style={{ transform: `translateX(${drag * 0.35}px)` }}
      >
        {/* the edges name a PERSON, and the first child sits on the RTL right — which
            is the side a positive drag goes to. Direction maps to a name, never to a
            yes/no the reader has to memorise. */}
        <div className="flex items-stretch justify-between gap-2 pb-1.5">
          <SideTag
            label={holder.nameHe}
            arrow="→"
            active={lean >= 0.55}
            hint={opening ? t('hate.hill.opens') : t('hate.hill.holder')}
          />
          <SideTag
            label={challenger.nameHe}
            arrow="←"
            active={lean <= -0.55}
            hint={t('hate.hill.challenger')}
            end
          />
        </div>

        <div
          style={{
            transform: `scale(${1 + Math.max(0, lean) * 0.03})`,
            opacity: 1 + Math.min(0, lean) * 0.4,
          }}
          className="transition-[opacity] duration-100 motion-reduce:!transform-none motion-reduce:!opacity-100"
        >
          <div className="relative">
            <EnemyPlate
              enemy={holder}
              state={stamped ? (stamped.won === holder.slug ? 'won' : 'out') : 'live'}
              onPick={() => pick('holder')}
              dense
            />
            {!opening && !stamped && (
              <span className="pointer-events-none absolute -top-2 end-2 border-hair border-ink bg-ink px-2 py-0.5 font-body text-[10px] font-extrabold tracking-wide text-paper">
                {t('hate.streak', { n: String(streak) })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 py-1.5" aria-hidden="true">
          <span className="h-px flex-1 bg-ink/30" />
          <span className="font-poster text-[20px] leading-none text-red">×</span>
          <span className="h-px flex-1 bg-ink/30" />
        </div>

        <div
          style={{
            transform: `scale(${1 + Math.max(0, -lean) * 0.03})`,
            opacity: 1 - Math.max(0, lean) * 0.4,
          }}
          className="transition-[opacity] duration-100 motion-reduce:!transform-none motion-reduce:!opacity-100"
        >
          <EnemyPlate
            enemy={challenger}
            state={stamped ? (stamped.won === challenger.slug ? 'won' : 'out') : 'live'}
            onPick={() => pick('challenger')}
            dense
          />
        </div>
      </div>
      </div>

      <p className="mt-3 font-body text-[11px] leading-snug text-muted">{t('hate.swipeHint')}</p>
      <p className="mt-1 font-body text-[11px] text-muted">
        {t('hate.rosterNote', { count: String(rosterSize) })}
      </p>
    </div>
  )
}

/** the edge label — the name on that side, lit when the drag has committed to it */
function SideTag({
  label,
  arrow,
  active,
  hint,
  end = false,
}: {
  label: string
  arrow: string
  active: boolean
  hint: string
  end?: boolean
}) {
  return (
    <span
      className={`flex min-w-0 flex-1 basis-0 items-baseline gap-1.5 border-hair px-2 py-1 ${
        end ? 'text-end' : 'text-start'
      } ${active ? 'border-red bg-red text-paper' : 'border-ink/35 text-muted'}`}
    >
      <span className="font-mono text-[11px] leading-none" aria-hidden="true">
        {arrow}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-body text-[11.5px] font-extrabold leading-tight">
          {label}
        </span>
        <span className="block font-body text-[9.5px] leading-tight opacity-80">{hint}</span>
      </span>
    </span>
  )
}

/** הפסק — who was left standing, and what the terrace would have done instead. */
function Verdict({
  verdict,
  seed,
  rosterSize,
}: {
  verdict: NonNullable<ReturnType<typeof judgeRun>>
  seed: number
  rosterSize: number
}) {
  const standing = standingKey(verdict.agreement) as MessageKey

  return (
    <div className="mt-stack">
      <Punch />
      <div className="border-b-rule border-ink pb-2">
        <p className="font-latin text-[9px] font-bold tracking-[0.2em] text-red" dir="ltr">
          THE VERDICT
        </p>
        <h2 className="font-display text-step-2 leading-tight text-ink">{t('hate.verdict')}</h2>
      </div>

      <p className="mt-stack font-body text-[11px] tracking-widest text-muted">
        {t('hate.champion')}
      </p>
      <div className="mt-2">
        <EnemyPlate enemy={verdict.champion} state="won" />
      </div>

      {verdict.champion.detailHe !== '' && (
        <div className="mt-2 border-rule border-ink bg-sheet p-4">
          <p className="font-body text-[10px] tracking-widest text-muted">{t('hate.record')}</p>
          <p className="mt-1 font-body text-step--1 leading-relaxed text-ink">
            {verdict.champion.detailHe}
          </p>
        </div>
      )}

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <div className="border-rule border-ink bg-ink p-4 text-center">
          <p className="font-poster text-[52px] leading-none text-red">
            <Num>{`${verdict.agreement}%`}</Num>
          </p>
          <p className="mt-1 font-body text-[10px] tracking-widest text-concrete">
            {t('hate.agreement')}
          </p>
          <p className="mt-2 font-display text-step-0 leading-tight text-paper">{t(standing)}</p>
        </div>
        <div className="border-rule border-ink bg-sheet p-4">
          <p className="font-body text-[10px] tracking-widest text-muted">{t('hate.terrace')}</p>
          <p className="mt-1 font-poster text-[28px] leading-[0.85] text-ink">
            {verdict.terraceChampion.nameHe}
          </p>
          <p className="mt-2 font-body text-[11px] leading-snug text-muted">
            {verdict.terraceChampion.keyFactHe}
          </p>
        </div>
      </div>

      <p className="mt-2.5 border-rule border-ink bg-sheet px-4 py-3 font-body text-step--1 leading-relaxed text-ink">
        {t('hate.heldTheHill', {
          name: verdict.champion.nameHe,
          n: String(verdict.streak),
        })}
      </p>

      <p className="mt-stack font-body text-[11px] tracking-widest text-muted">
        {t('hate.standings')}
      </p>
      <ol className="mt-2 border-t-hair border-ink/25">
        {verdict.standings.map((row, index) => (
          <li
            key={row.enemy.slug}
            className="flex items-baseline gap-2.5 border-b-hair border-ink/25 py-2"
          >
            <span className="w-5 shrink-0 font-poster text-[19px] leading-none text-red">
              <Num>{index + 1}</Num>
            </span>
            <span className="min-w-0 flex-1 font-body text-step-0 text-ink">
              {row.enemy.nameHe}
              <span className="block font-body text-[10.5px] leading-snug text-muted">
                {row.enemy.keyFactHe}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
              <Num>{row.held}</Num>
            </span>
          </li>
        ))}
      </ol>

      {/* the whistle has gone — a stopping point, not a run */}

      <ShareRow
        kind="hate"
        params={{ a: String(verdict.agreement), s: String(seed) }}
        headline={verdict.champion.nameHe}
        card={{
          template: 'ink' as const,
              art: artFor('hate', verdict.agreement / 100),
          kicker: 'GATE 11 · THE HATRED GAME',
          label: t('screen.derby.title'),
          eyebrow: t('hate.champion'),
          hero: verdict.champion.nameHe,
          bigStat: { v: `${verdict.agreement}%`, k: t('hate.agreement') },
          stats: [
            { k: t('hate.charge'), v: verdict.champion.keyFactHe },
            { k: t('hate.terrace'), v: verdict.terraceChampion.nameHe },
          ],
          cta: t('hate.cta'),
          challenge: t('share.sameRound'),
        }}
      />

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a
          href={`/derby?seed=${seed + 1}`}
          className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink"
        >
          {t('hate.again')}
        </a>
        <a
          href={`/derby/file?seed=${seed}`}
          className="flex min-h-tap items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper"
        >
          {t('hate.blackfile')}
        </a>
      </div>

      <p className="mt-3 font-body text-[11px] text-muted">
        {t('hate.rosterNote', { count: String(rosterSize) })}
      </p>

      <AdSlot placement="result" />
    </div>
  )
}
