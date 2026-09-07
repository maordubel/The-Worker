'use client'

import { type MutableRefObject } from 'react'

import { t } from '@/lib/i18n'
import { bookPageFlag } from '@/lib/life/books'
import type { loadLife } from '@/lib/life/engine'
import { GIGS } from '@/lib/life/gigs'
import type { LifeBusEvents } from '@/lib/life/runtime/bus'
import { onSale, ownedShirts, SHIRT_FIRST_HE, SHIRT_MORE_HE, type Shirt } from '@/lib/life/shirts'
import { stickerFlag, tornFlag } from '@/lib/life/stickers'
import { COIN_WHY_HE, HOOPS_WHY_HE, PENALTY_WHY_HE, TOTO_WHY_HE } from '@/lib/life/toto'
import type { LifeState } from '@/lib/life/types'
import { landingMinute } from '@/lib/life/world/flow'

/**
 * הפנקס — the handful of places where the SHELL writes into the life.
 *
 * Almost nothing in this game does that. The rule the whole architecture rests on is that
 * the world owns the log: a scene decides what happened, the engine records it, the bus
 * tells React, and React draws a sentence. React proposes nothing. But there are eight
 * screens that break the rule on purpose, because the thing that happens on them happens in
 * the DOM and nowhere else — the Toto slip, the coin in the alley, the penalty run, the free
 * throws, the shop till, the sticker somebody tears out, the clock somebody chooses to skip,
 * and the page a booklet is left open on. There is no scene under any of them to know.
 *
 * Those eight were written inline, inside the JSX, in eight different `onDone` closures, and
 * that is exactly where a game grows a second economy. A price typed into a card is a price
 * nobody can grep for; a `clock.advanced` buried in a render tree is a rule nobody can audit.
 * Gathering them here does not change one agora — it makes the list of ways the shell can
 * spend the child's afternoon a list you can read in one screen.
 *
 * The seam is drawn at the dispatch, not at the overlay. Every function below writes to the
 * engine and saves, and hands back whatever the caller needs to re-render or announce; the
 * `setState` that closes the card and the `pause(false)` that starts the world again stay in
 * `LifeStage`, where the overlay lives. Nothing here touches React state, and nothing here
 * knows what is on screen.
 *
 * Deliberately NOT `useCallback`: these are recreated every render exactly as the inline
 * closures they replace were, so no card can accidentally start depending on the identity of
 * a handler that used to change on every line of dialogue.
 */
export function useLifeLedger({
  engineRef,
}: {
  engineRef: MutableRefObject<Awaited<ReturnType<typeof loadLife>> | null>
}) {
  return {
    /** the booklet remembers the page it was put down on, in the save and not in the browser */
    writeBookPage(id: string, page: number) {
      const engine = engineRef.current
      if (!engine) return
      engine.dispatch({ t: 'flag.set', flag: bookPageFlag(id), value: page })
      void engine.save()
    },

    /**
     * הקנייה — money out, a flag raised, and the card the world is stopped for.
     *
     * The card is composed here and RETURNED rather than emitted, so the caller keeps the
     * order it has always had: the shop's own state refreshes first, then the shirt card
     * goes up over it.
     */
    buyShirt(shirt: Shirt, chapter: string): { state: LifeState; card: NonNullable<LifeBusEvents['shirt']> } | null {
      const engine = engineRef.current
      if (!engine) return null
      engine.dispatch(
        { t: 'money.changed', agorot: -shirt.price * 100, why: shirt.nameHe },
        { t: 'flag.raised', flag: `own:shirt:${shirt.id}` },
      )
      void engine.save()
      return {
        state: engine.state,
        // the card that stops the world — the same one a shirt has always got
        card: {
          kind: 'bought' as const,
          art: shirt.art,
          titleHe: ownedShirts(engine.state).length > 1 ? SHIRT_MORE_HE : SHIRT_FIRST_HE,
          nameHe: shirt.nameHe,
          sponsorHe: shirt.sponsorHe,
          yearsHe: shirt.yearsHe,
          noteHe: shirt.noteHe,
          have: ownedShirts(engine.state).length,
          total: onSale(chapter).length,
          spec: shirt.spec ?? null,
          seasonHe: shirt.seasonLabel ?? null,
          sourceHe: shirt.sourceHe ?? null,
        },
      }
    },

    /**
     * קורע — the one destructive thing the album can do, and it is the player's to do.
     * The sticker leaves the album and the slot keeps the decision.
     */
    tearSticker(id: string, nameHe: string): { state: LifeState; toast: NonNullable<LifeBusEvents['toast']> } | null {
      const engine = engineRef.current
      if (!engine) return null
      engine.dispatch({ t: 'flag.set', flag: stickerFlag(id), value: 0 })
      engine.dispatch({ t: 'flag.raised', flag: tornFlag(id) })
      void engine.save()
      return { state: engine.state, toast: { text: t('life.album.tore', { name: nameHe }), tone: 'red' } }
    },

    /** the afternoon skipped forward to the minute the next beat is waiting for */
    passTime(pass: NonNullable<LifeBusEvents['pass']>): NonNullable<LifeBusEvents['toast']> | null {
      const engine = engineRef.current
      if (!engine) return null
      const jump = landingMinute(pass) - engine.state.minute
      if (jump > 0) engine.dispatch({ t: 'clock.advanced', minutes: jump })
      void engine.save()
      return { text: t('life.pass.passed'), tone: 'plain' }
    },

    /** the slip: paid per correct answer, and it costs twenty minutes whatever it pays */
    settleToto(shekels: number) {
      if (shekels > 0) {
        engineRef.current?.dispatch({ t: 'money.changed', agorot: shekels * 100, why: TOTO_WHY_HE })
      }
      engineRef.current?.dispatch({ t: 'clock.advanced', minutes: 20 })
      void engineRef.current?.save()
    },

    /** whether the child has the stake in his pocket at all — the alley never takes credit */
    canAfford(stake: number) {
      return (engineRef.current?.state.agorot ?? 0) >= stake * 100
    },

    /** the coin: a net swing either way, and ten minutes gone regardless */
    settleCoin(coin: NonNullable<LifeBusEvents['coin']>, { played, won }: { played: boolean; won: boolean }) {
      if (!played) return
      const net = won ? coin.prize - coin.stake : -coin.stake
      engineRef.current?.dispatch(
        { t: 'money.changed', agorot: net * 100, why: COIN_WHY_HE },
        { t: 'clock.advanced', minutes: 10 },
        { t: 'flag.raised', flag: 'gig:coin' },
      )
      void engineRef.current?.save()
    },

    /**
     * The two contests are gigs like any other, and their price is read off `GIGS` rather
     * than typed here: the minutes, the energy and the trait a boy picks up for standing in
     * a queue to take penalties all belong to the same table every other job in this life
     * is priced from. The fallbacks are the numbers that table shipped with.
     */
    settlePenalty({ played, earned }: { played: boolean; earned: number }) {
      if (!played) return
      const gig = GIGS.find((row) => row.id === 'penalty-contest')
      engineRef.current?.dispatch(
        { t: 'money.changed', agorot: earned * 100, why: PENALTY_WHY_HE },
        { t: 'clock.advanced', minutes: gig?.minutes ?? 25 },
        { t: 'energy.changed', delta: -(gig?.energy ?? 10) },
        { t: 'flag.raised', flag: 'gig:penalty-contest' },
      )
      if (gig?.trait) engineRef.current?.dispatch({ t: 'personality.shifted', key: gig.trait.key, delta: gig.trait.delta })
      void engineRef.current?.save()
    },

    settleHoops({ played, earned }: { played: boolean; earned: number }) {
      if (!played) return
      const gig = GIGS.find((row) => row.id === 'hoops-contest')
      engineRef.current?.dispatch(
        { t: 'money.changed', agorot: earned * 100, why: HOOPS_WHY_HE },
        { t: 'clock.advanced', minutes: gig?.minutes ?? 20 },
        { t: 'energy.changed', delta: -(gig?.energy ?? 8) },
        { t: 'flag.raised', flag: 'gig:hoops-contest' },
      )
      if (gig?.trait) engineRef.current?.dispatch({ t: 'personality.shifted', key: gig.trait.key, delta: gig.trait.delta })
      void engineRef.current?.save()
    },
  }
}
