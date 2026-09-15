'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Ranks } from '@/components/gates/GatePlate'
import { lifeStore } from '@/lib/life/save'
import { t } from '@/lib/i18n'

/**
 * לוחית המנהרה — THE WORKER LIFE, inside the wall.
 *
 * `LifeEntry` used to hang above the gate wall as its own thing. It is now the first
 * item in the wall's own grid, full width, sitting above gate 5 — same plate anatomy as
 * a gate (a bilingual strip, a well, an ink foot), so the wall reads as one family. What
 * keeps it from being mistaken for gate 9 or gate 12 — numbers Bloomfield never had
 * (rule 24) — is the strip itself: it says "מנהרה", not "שער", and the Latin line under
 * it says so in English too. There is no number well: the wordmark prints where a
 * number would, in the same two-plate print (`.plate-shift` / `.plate-top`) every gate
 * uses. And there are no rays — a tunnel is roofed, not lit from behind a sunburst.
 *
 * The action strip has two honest states and the rule that picks between them is the
 * same one the polls wing lives by (rule 11): a resume line is only printed when there
 * is a real local save to read it from. No save, or a browser that blocks storage
 * altogether, prints the same "never played" strip — never a guessed day or place.
 * That read can only happen in the browser, so it runs once after mount, the same
 * pattern `BallotSheet` reads its slip with: render the honest default first, then
 * upgrade it if a save turns up, rather than blocking on it or guessing during SSR.
 */

/** the well's own crowd — a tunnel is taller and lit from the mouth, so its rows are
 *  brighter and spaced differently than a gate's; see `Ranks` in GatePlate.tsx. */
const TUNNEL_RANKS = [
  { bottom: 0, height: 46, size: '30px 46px', opacity: 0.5, shift: '0' },
  { bottom: 28, height: 32, size: '21px 32px', opacity: 0.24, shift: '11px' },
  { bottom: 48, height: 22, size: '15px 22px', opacity: 0.14, shift: '4px' },
] as const

export function TunnelPlate() {
  const [resumable, setResumable] = useState(false)

  useEffect(() => {
    let live = true
    // A missing save and a browser that refuses storage both resolve to `null` here —
    // `lifeStore.read()` already treats them the same way, which is exactly the one
    // fallback this plate needs (rule 11: never print a day or a place it does not have).
    void lifeStore.read().then((file) => {
      if (live && file) setResumable(true)
    })
    return () => {
      live = false
    }
  }, [])

  const kicker = resumable ? t('life.resume.kicker') : t('life.entry.kicker')
  // The resume line is composed from two keys that already exist rather than a new
  // one: the generic "where you left off" caption LifeLine also uses, plus the
  // prologue's own place and year — the only chapter this build can honestly name.
  const line = resumable
    ? `${t('life.line.lead2')} · ${t('life.place.prologue')}`
    : t('life.entry.line')
  const cta = resumable ? t('life.resume.cta') : t('life.entry.cta')

  return (
    <Link
      href="/life"
      aria-label={`${t('life.tunnel.word')} — ${t('life.entry.kicker')}`}
      className="group relative block overflow-hidden border-rule border-ink bg-ink transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none"
    >
      {/* 1 · the bilingual strip — "מנהרה", never "שער". This line is the whole reason
          the plate cannot be read as gate 9 or gate 12. */}
      <div className="flex items-baseline justify-between gap-2.5 border-b-hair border-concrete/30 px-2.5 py-1.5">
        <span className="font-display text-[13px] leading-none text-paper">{t('life.tunnel.word')}</span>
        <span className="font-latin text-[8.5px] font-bold tracking-[0.18em] text-red" dir="ltr">
          TUNNEL · NOT A GATE
        </span>
      </div>

      {/* 2 · the well — the wordmark prints where a gate number would, no rays */}
      <div className="relative flex h-[126px] items-center justify-center sm:h-[168px]">
        <div aria-hidden="true" className="tunnel-mouth pointer-events-none absolute inset-0" />
        <Ranks tone="paper" rows={TUNNEL_RANKS} />
        <p
          aria-hidden="true"
          dir="ltr"
          className="plate-shift absolute text-center font-poster text-[44px] leading-[.86] text-sign sm:text-[58px]"
        >
          THE WORKER
          <br />
          LIFE
        </p>
        <p
          dir="ltr"
          className="plate-top relative text-center font-poster text-[44px] leading-[.86] text-red sm:text-[58px]"
        >
          THE WORKER
          <br />
          LIFE
        </p>
      </div>

      {/* 3 · the ink foot — same hierarchy as every gate, so the wall reads as one family */}
      <div className="relative border-t-hair border-concrete/30 bg-ink px-2.5 pb-2.5 pt-2">
        <p className="font-display text-[17px] leading-tight text-sheet">{t('life.entry.kicker')}</p>
        <p
          className="mt-1 font-latin text-[8.5px] font-semibold leading-snug tracking-[0.12em] text-concrete"
          dir="ltr"
        >
          THE WORKER LIFE · {t('life.entry.slice')}
        </p>
      </div>

      {/* 4 · the action strip — the one thing a gate plate does not need: where you
          stopped, or an invitation in when there is nothing to resume */}
      <div className="flex items-center gap-2.5 bg-red px-2.5 py-[7px]">
        <div className="min-w-0 flex-1">
          <p className="font-body text-[9px] font-extrabold leading-none tracking-[0.16em] text-ink/80">
            {kicker}
          </p>
          <p className="mt-[3px] truncate font-display text-[13.5px] font-bold leading-tight text-sheet">
            <bdi>{line}</bdi>
          </p>
        </div>
        <span className="flex min-h-[40px] flex-none items-center gap-[7px] bg-ink px-[13px]">
          <span className="font-body text-[14px] font-extrabold leading-none text-sheet">{cta}</span>
          <span aria-hidden="true" className="block h-[7px] w-[7px] bg-red" />
        </span>
      </div>
    </Link>
  )
}
