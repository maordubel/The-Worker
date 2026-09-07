'use client'

import { useCallback, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'

import { checklistFor, type ChecklistItem } from '@/lib/life/checklist'
import type { LifeAudio } from '@/lib/life/runtime/audio'
import type { LifeRuntime, LifeSnapshot, MapPlace } from '@/lib/life/runtime/game'
import { lifeStore } from '@/lib/life/save'
import type { LifeState } from '@/lib/life/types'

/**
 * הדפים שהשחקן פותח — every screen the PLAYER opens, as opposed to every screen the game
 * raises in front of him.
 *
 * That is the whole reason this seam is where it is, and it is not a filing decision. The
 * overlays that arrive on the bus — a shirt card, a film, a coda, a stamp — are things that
 * happened; the child has no say in them and neither does React. The five below are the
 * opposite: the profile, the meters, the help sheet, the menu and the map are opened by a
 * thumb on a chip in the corner, and the game learns about it afterwards. Nothing on the bus
 * ever raises one.
 *
 * They share one choreography, and it is the reason they belong in one file rather than five:
 *
 *   · the world PAUSES. Reading about yourself may not cost you the afternoon — a clock that
 *     kept running under an open profile would make the help sheet a punishment.
 *   · what they draw is a SNAPSHOT, taken at the moment they open, never a subscription.
 *     React must not hold the life. A card that re-rendered on every clock tick is a card
 *     that animates while you are reading it.
 *   · they open with `ui-open` and close with `ui-close`. Paper sounds belong to paper (the
 *     booklet, the album, the red box); these are panels and they say so.
 *
 * Three rules, five screens, and every one of them was a separate closure two hundred lines
 * apart in the shell, which is how the map sheet ended up as the only one of the five that
 * forgot to unpause on one of its exits for a while.
 *
 * The `runtime` and `audio` boxes and the `setMapState` setter are all stable identities, so
 * naming them in the dependency arrays keeps every callback below as stable as it was inline.
 *
 * `mapState` is the one thing here it does NOT own: the reveal moment raises the same map
 * from the bus, so the state that both draw from lives with the bus and the setter is handed
 * in. One canonical copy of the world's snapshot, whoever asked for it.
 */
export function useLifeSheets({
  runtime,
  audio,
  setMapState,
}: {
  runtime: MutableRefObject<LifeRuntime | null>
  audio: MutableRefObject<LifeAudio | null>
  /** owned by `useLifeRuntime`, because `reveal` on the bus draws the same map */
  setMapState: Dispatch<SetStateAction<LifeState | null>>
}) {
  /**
   * התיק — the profile, opened by the player and never by the game.
   *
   * It is a SNAPSHOT taken at the moment it opens, not a subscription: React must never
   * hold the life, and a card that re-rendered on every clock tick would be a card that
   * animates while you read it. The world is paused underneath — reading about yourself
   * may not cost you the afternoon.
   */
  const [snapshot, setSnapshot] = useState<LifeSnapshot | null>(null)
  const [debug, setDebug] = useState(false)

  const openProfile = useCallback((withDebug: boolean) => {
    const current = runtime.current
    if (!current) return
    current.pause(true)
    setSnapshot(current.snapshot())
    setDebug(withDebug)
    audio.current?.play('ui-open', { bus: 'ui', level: 0.5 })
  }, [audio, runtime])

  const closeProfile = useCallback(() => {
    setSnapshot(null)
    setDebug(false)
    runtime.current?.pause(false)
    audio.current?.play('ui-close', { bus: 'ui', level: 0.45 })
  }, [audio, runtime])

  const [gauges, setGauges] = useState<LifeState | null>(null)

  const openGauges = useCallback(() => {
    const current = runtime.current
    if (!current) return
    current.pause(true)
    setGauges(current.snapshot().state)
    audio.current?.play('ui-open', { bus: 'ui', level: 0.5 })
    audio.current?.play('heart', { bus: 'ui', level: 0.5, delayMs: 80 })
  }, [audio, runtime])

  const closeGauges = useCallback(() => {
    setGauges(null)
    runtime.current?.pause(false)
    audio.current?.play('ui-close', { bus: 'ui', level: 0.45 })
  }, [audio, runtime])

  const [help, setHelp] = useState(false)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const openHelp = useCallback(() => {
    runtime.current?.pause(true)
    const state = runtime.current?.snapshot().state
    setChecklist(state ? checklistFor(state) : [])
    setHelp(true)
    audio.current?.play('ui-open', { bus: 'ui', level: 0.5 })
  }, [audio, runtime])
  const closeHelp = useCallback(() => {
    setHelp(false)
    runtime.current?.pause(false)
    audio.current?.play('ui-close', { bus: 'ui', level: 0.45 })
  }, [audio, runtime])

  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDay, setConfirmDay] = useState(false)
  const [menu, setMenu] = useState(false)

  const openMenu = useCallback(() => {
    runtime.current?.pause(true)
    setConfirmReset(false)
    setConfirmDay(false)
    setMenu(true)
    audio.current?.play('ui-open', { bus: 'ui', level: 0.5 })
  }, [audio, runtime])

  const closeMenu = useCallback(() => {
    setMenu(false)
    setConfirmReset(false)
    setConfirmDay(false)
    runtime.current?.pause(false)
    audio.current?.play('ui-close', { bus: 'ui', level: 0.45 })
  }, [audio, runtime])

  const reset = useCallback(() => {
    void (async () => {
      await lifeStore.clear()
      window.location.reload()
    })()
  }, [])

  /**
   * היום מחדש — the log is cut, then the page reloads so every scene, timer and texture
   * starts from the cut log rather than from whatever was on screen. Reload is the honest
   * restart; a scene restart over a rewritten engine is a second save system in disguise.
   */
  const restartDay = useCallback(() => {
    const current = runtime.current
    if (!current) return
    if (current.restartDay()) window.location.reload()
    else setConfirmDay(false)
  }, [runtime])

  /** the map sheet: a snapshot of the places, taken when it opens, like the profile */
  const [places, setPlaces] = useState<MapPlace[] | null>(null)

  const openMap = useCallback(() => {
    const current = runtime.current
    if (!current) return
    current.pause(true)
    setMapState(current.snapshot().state)
    setPlaces(current.places())
    audio.current?.play('ui-open', { bus: 'ui', level: 0.5 })
    audio.current?.play('page', { bus: 'ui', level: 0.5, delayMs: 90 })
  }, [audio, runtime, setMapState])

  const closeMap = useCallback(() => {
    setPlaces(null)
    runtime.current?.pause(false)
    audio.current?.play('ui-close', { bus: 'ui', level: 0.45 })
  }, [audio, runtime])

  const goTo = useCallback((id: string) => {
    const current = runtime.current
    if (!current) return
    setPlaces(null)
    if (!current.goTo(id)) current.pause(false)
  }, [runtime])

  return {
    snapshot,
    debug,
    openProfile,
    closeProfile,
    gauges,
    openGauges,
    closeGauges,
    help,
    checklist,
    openHelp,
    closeHelp,
    menu,
    setMenu,
    openMenu,
    closeMenu,
    confirmReset,
    setConfirmReset,
    reset,
    confirmDay,
    setConfirmDay,
    restartDay,
    places,
    setPlaces,
    openMap,
    closeMap,
    goTo,
  }
}
