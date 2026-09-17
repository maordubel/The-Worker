'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { SignUpPlate } from './SignUpPlate'
import { Num } from '@/components/ui/Num'
import { GATES } from '@/lib/gates'
import { cardFigures, gateId, rankOf, standingScore, stillToDo } from '@/lib/profile/standing'
import { readDevice, type DeviceSummary } from '@/lib/profile/summary'
import {
  HISTORY_DAYS,
  collected,
  emptyProfile,
  historyGrid,
  readProfile,
  type Profile,
} from '@/lib/profile/store'
import { mintSeed, withRound } from '@/lib/rotation/deck'
import { rotationFor } from '@/lib/profile/store'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * המנוי שלך — the one screen that knows everything you did.
 *
 * Maor: *"האזור האישי צריך להיות קשור לכל מיני המשחקים שיש לנו באפליקציה, שהכל ידבר עם
 * הכל, שהכל יישמר שם. מה שידחוף אנשים לבצע הרשמה."*
 *
 * The first half of that is a plumbing job and it is done in `lib/profile/store.ts`:
 * every gate now reports its finished rounds into one record, so this screen can show a
 * wall of thirteen gates with your own history printed on each one — including the ones
 * still dark, which is the part that makes it a wall rather than a list.
 *
 * The second half is a product decision and it is worth being precise about, because
 * the obvious way to push registration is the wrong one. A sign-up gate in front of
 * content, a rank that unlocks a mode, a streak that punishes a missed day — those all
 * work, and every one of them is on this project's banned list for good reasons. The
 * pull here is the honest one: **you have built something, and it lives in one
 * browser.** The plate says exactly what would be lost and exactly what an account adds.
 * Nothing is withheld to create the need; the need is already true.
 *
 * Each gate's link carries the DEVICE's place in that gate's deck (`lib/rotation/deck.ts`),
 * so "שוב" from here deals the next round rather than the one you already played.
 */

export function Standing() {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [device, setDevice] = useState<DeviceSummary>({ kits: 0, ballot: 0, life: null })
  const [ready, setReady] = useState(false)
  /**
   * The wall's links, worked out ONCE after mount.
   *
   * `nextRoundHref` used to be called from inside the JSX map. It reads the device's
   * place in a deck, and `rotationFor` MINTS AND WRITES a seed for a gate that has none —
   * so drawing this screen silently created a deck for every gate the device had never
   * played, on every render, during the render. React may call a render twice and may
   * throw one away; storage writes in that phase are exactly the bug the LIFE intro's
   * seen-flag was (rule 30). It also returned `cursor + 1` without committing the step,
   * so the next `PlayLink` re-served the round this card had just handed out.
   */
  const [links, setLinks] = useState<Record<string, string>>({})

  useEffect(() => {
    setProfile(readProfile())
    setDevice(readDevice())
    setLinks(wallLinks())
    setReady(true)
  }, [])

  const figures = cardFigures(profile)
  const rank = rankOf(profile)
  const grid = historyGrid(profile)
  const todo = stillToDo(profile)
  const ussCards = collected(profile, 'ussishkin').length

  return (
    <div className="mt-stack">
      {/* ---------------------------------------------------------------- the standing */}
      <section className="border-plate border-ink bg-ink p-4" aria-labelledby="member-standing">
        <div className="flex items-baseline justify-between gap-3">
          <p
            id="member-standing"
            className="font-latin text-[9px] font-bold tracking-[0.28em] text-red"
            dir="ltr"
          >
            STANDING
          </p>
          {/* The raw figure is context for a number that is already moving, not a
              score in its own right — a bare 0 on an empty card reads like a mark. */}
          {standingScore(profile) > 0 && (
            <p className="font-mono text-[10px] tabular-nums text-concrete">
              <Num>{standingScore(profile)}</Num>
            </p>
          )}
        </div>
        <p className="mt-1 font-display text-step-4 leading-[0.95] text-paper">
          {t(rank.now.key)}
        </p>
        <p className="mt-1.5 font-body text-[11.5px] leading-snug text-concrete">
          {rank.next
            ? t('member.rankNext', { n: String(rank.toGo), name: t(rank.next.key) })
            : t('member.rankTop')}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-y-3 border-t-hair border-concrete/30 pt-3 sm:grid-cols-5">
          {[
            { k: 'member.correct' as MessageKey, v: figures.correct },
            { k: 'member.plays' as MessageKey, v: figures.plays },
            { k: 'member.streak' as MessageKey, v: figures.streak },
            { k: 'member.days' as MessageKey, v: figures.days },
            { k: 'member.gatesTouched' as MessageKey, v: figures.gates },
          ].map((stat) => (
            <div key={stat.k}>
              <dd className="font-poster text-[26px] leading-none text-red">
                <Num>{stat.v}</Num>
              </dd>
              <dt className="mt-1 font-body text-[10px] leading-tight text-concrete">
                {t(stat.k)}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------------- the ninety */}
      <section className="mt-3 border-rule border-ink bg-sheet p-3" aria-labelledby="member-days">
        <h2
          id="member-days"
          className="font-body text-[11px] font-extrabold tracking-widest text-muted"
        >
          {t('member.quarter')}
        </h2>
        <ol className="mt-2 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[2px]">
          {grid.map((punched, index) => (
            <li
              key={index}
              aria-hidden="true"
              className={`aspect-square border-hair ${
                punched ? 'border-red bg-red' : 'border-ink/20 bg-paper'
              }`}
            />
          ))}
        </ol>
        <p className="sr-only">
          {t('member.days')}: {grid.filter(Boolean).length} / {HISTORY_DAYS}
        </p>
      </section>

      {/* ------------------------------------------------------------------- your wall */}
      <section className="mt-stack" aria-labelledby="member-wall">
        <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink pb-1.5">
          <h2 id="member-wall" className="font-display text-step-2 leading-tight text-ink">
            {t('member.wall')}
          </h2>
          <p className="font-mono text-[11px] tabular-nums text-muted">
            <Num>{`${figures.gates}/${figures.ofGates}`}</Num>
          </p>
        </div>
        <p className="mt-2 max-w-prose font-body text-step--1 leading-relaxed text-muted">
          {t('member.wallLede')}
        </p>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {GATES.map((gate) => {
            const id = gateId(gate.href)
            const stat = profile.gates[id]
            const played = (stat?.plays ?? 0) > 0
            return (
              <li key={gate.number}>
                <Link
                  href={(ready && links[gate.href]) || gate.href}
                  className={`flex min-h-tap items-stretch gap-3 border-rule transition-transform duration-press ease-stamp active:scale-[.985] motion-reduce:transition-none ${
                    played ? 'border-ink bg-sheet' : 'border-ink/35 bg-paper'
                  }`}
                >
                  <span
                    className={`flex w-[52px] shrink-0 items-center justify-center font-poster text-[26px] leading-none ${
                      played ? 'bg-red text-paper' : 'bg-ink/10 text-ink/40'
                    }`}
                  >
                    <Num>{gate.number}</Num>
                  </span>
                  <span className="min-w-0 flex-1 py-2 pe-3">
                    <span className="block font-sign text-step-0 leading-tight text-ink">
                      {t(gate.title)}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10.5px] leading-snug text-muted">
                      {played ? (
                        <>
                          <Num>{stat?.plays ?? 0}</Num> {t('member.plays')}
                          {(stat?.best ?? 0) > 0 && (
                            <>
                              {' · '}
                              {t('member.best')} <Num>{stat?.best ?? 0}</Num>
                            </>
                          )}
                        </>
                      ) : (
                        t('member.never')
                      )}
                    </span>
                  </span>
                  <span className="flex items-center pe-3 font-body text-[11px] font-extrabold text-red">
                    {played ? t('member.again') : t('member.enter')}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ----------------------------------------------------------------- collections */}
      <section className="mt-stack" aria-labelledby="member-collections">
        <h2
          id="member-collections"
          className="border-b-rule border-ink pb-1 font-display text-step-2 leading-tight text-ink"
        >
          {t('member.collections')}
        </h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          <Collection href="/kits" label={t('screen.kits.title')} have={device.kits} of={33} />
          <Collection
            href="/ussishkin"
            label={t('screen.ussishkin.title')}
            have={ussCards}
            of={45}
          />
          <Collection href="/polls" label={t('screen.polls.title')} have={device.ballot} of={8} />
          {device.life && (
            <Collection
              href="/life"
              label={t('life.title')}
              have={device.life.events}
              of={null}
              note={device.life.year !== null ? String(device.life.year) : undefined}
            />
          )}
        </ul>
      </section>

      {/* ------------------------------------------------------------------ what's left */}
      {todo.length > 0 && (
        <section className="mt-stack" aria-labelledby="member-next">
          <h2
            id="member-next"
            className="border-b-rule border-ink pb-1 font-display text-step-2 leading-tight text-ink"
          >
            {t('member.nextUp')}
          </h2>
          <p className="mt-2 max-w-prose font-body text-step--1 leading-relaxed text-muted">
            {t('member.nextUpLede')}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {todo.map((gate) => (
              <li key={gate.number}>
                <Link
                  href={gate.href}
                  className="flex min-h-tap items-center gap-2 border-rule border-red bg-sheet px-3 font-body text-step--1 font-extrabold text-ink"
                >
                  <span className="font-poster text-[17px] leading-none text-red">
                    <Num>{gate.number}</Num>
                  </span>
                  {t(gate.title)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SignUpPlate figures={figures} collections={device.kits + ussCards + device.ballot} />
    </div>
  )
}

/**
 * The link every gate on this wall gets, built once in an effect.
 *
 * A gate that READS a seed gets the device's own place in its deck. A gate that does not
 * — `/xi`, `/kits`, `/polls`, `/tik`, and the trivia PICKER — gets its bare route, because
 * a `?seed=` on a page that never looks at one is a parameter that lies (rule 19), and
 * asking `rotationFor` for it would mint a deck nothing ever deals from.
 *
 * The cursor is NOT stepped here. Stepping belongs to the click (`PlayLink`), and doing it
 * on render burned a round for anybody who merely opened their own card.
 */
function wallLinks(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const gate of GATES) {
    if (!gate.seeded) {
      out[gate.href] = gate.href
      continue
    }
    const rotation = rotationFor(gateId(gate.href), mintSeed)
    out[gate.href] = withRound(gate.href, rotation.seed, rotation.cursor)
  }
  return out
}

function Collection({
  href,
  label,
  have,
  of,
  note,
}: {
  href: string
  label: string
  have: number
  of: number | null
  note?: string
}) {
  const share = of === null ? 0 : Math.min(1, have / of)
  return (
    <li>
      <Link
        href={href}
        className="block border-rule border-ink bg-sheet p-3 transition-transform duration-press ease-stamp active:scale-[.985] motion-reduce:transition-none"
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-sign text-step-0 leading-tight text-ink">{label}</span>
          <span className="font-mono text-[11px] tabular-nums text-muted">
            <Num>{of === null ? String(have) : `${have}/${of}`}</Num>
            {note && (
              <>
                {' · '}
                <Num>{note}</Num>
              </>
            )}
          </span>
        </div>
        {of !== null && (
          // A rule that fills, not a rounded progress bar: radius 0, two plates.
          <div aria-hidden="true" className="mt-2 h-[6px] w-full bg-ink/15">
            <div className="h-full bg-red" style={{ inlineSize: `${Math.round(share * 100)}%` }} />
          </div>
        )}
      </Link>
    </li>
  )
}
