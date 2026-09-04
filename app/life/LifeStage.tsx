'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { AnchorCard } from '@/components/life/AnchorCard'
import { DocSheet } from '@/components/life/DocSheet'
import { ScoreStrip } from '@/components/life/ScoreStrip'
import { StageFinale } from '@/components/life/StageFinale'
import { ControlDeck, TapChip } from '@/components/life/ControlDeck'
import { DebugPanel } from '@/components/life/DebugPanel'
import { DialogueBox } from '@/components/life/DialogueBox'
import { EndingCard } from '@/components/life/EndingCard'
import { PlaceCard, Stamp, TitleCard } from '@/components/life/Stamp'
import { CloseUp } from '@/components/life/CloseUp'
import { Panorama } from '@/components/life/Panorama'
import { TunnelWalk } from '@/components/life/TunnelWalk'
import { LifeAudio, type AmbienceKey } from '@/lib/life/runtime/audio'
import { HistoricalCutscene } from '@/components/life/HistoricalCutscene'
import { LifeHud } from '@/components/life/LifeHud'
import { LifeMap } from '@/components/life/LifeMap'
import { LifeMenu } from '@/components/life/LifeMenu'
import { OpeningSequence } from '@/components/life/OpeningSequence'
import { ProfileCard } from '@/components/life/ProfileCard'
import { Teach } from '@/components/life/Teach'
import { t, type MessageKey } from '@/lib/i18n'
import type { HistoricalAnchor } from '@/lib/life/anchors'
import type { CutsceneOutcome } from '@/lib/life/cutscenes'
import { OPENING_SEEN } from '@/lib/life/opening'
import { DEFAULT_IDENTITY } from '@/lib/life/content/chapter1986'
import { loadLife } from '@/lib/life/engine'
import { lifeStore } from '@/lib/life/save'
import { LifeBus, type HudState, type LifeBusEvents } from '@/lib/life/runtime/bus'
import type { LifeRuntime, LifeSnapshot, MapPlace } from '@/lib/life/runtime/game'

/**
 * הבמה — React mounts the game and then gets out of its way.
 *
 * Everything below the canvas is one Phaser instance created in an effect and destroyed
 * with the component. Everything above it is DOM: the clock, the dialogue, the thumb pad,
 * the two cards. They talk through the bus and nothing else — no shared object, no ref
 * into a scene, no game state in React except what the bus has published.
 *
 * That boundary is what brief §28 asks for, and it pays for itself immediately: the shell
 * re-renders on every line of dialogue and the game never drops a frame for it.
 *
 * Phaser is imported dynamically. It is a large library that touches `window` at module
 * scope, so it must never reach the server bundle or any route but this one.
 */

const EMPTY_HUD: HudState = { clock: '', date: '', agorot: 0, showMoney: false, place: '', objective: null }
/** a preference about the glass, not about the life — so it is not in the save */
const DECK_PREF = 'the-worker:life:deck'

export function LifeStage({
  anchor,
  prologueAnchor,
  anchors,
}: {
  anchor: HistoricalAnchor
  prologueAnchor: HistoricalAnchor
  /** every chapter's anchor, by era key — resolved on the server like the two above */
  anchors: Record<string, HistoricalAnchor>
}) {
  const holder = useRef<HTMLDivElement | null>(null)
  const runtime = useRef<LifeRuntime | null>(null)

  const [ready, setReady] = useState(false)
  const [hud, setHud] = useState<HudState>(EMPTY_HUD)
  const [dialogue, setDialogue] = useState<LifeBusEvents['dialogue']>(null)
  const [prompt, setPrompt] = useState<LifeBusEvents['prompt']>(null)
  const [teach, setTeach] = useState<LifeBusEvents['teach']>(null)
  const [toast, setToast] = useState<LifeBusEvents['toast']>(null)
  /** the synthesiser — made on the first gesture, remembered muted or not per browser */
  const audio = useRef<LifeAudio | null>(null)
  const [sound, setSound] = useState(true)
  const [ending, setEnding] = useState<LifeBusEvents['ending']>(null)
  const [match, setMatch] = useState<LifeBusEvents['match']>(null)
  const [doc, setDoc] = useState<LifeBusEvents['doc']>(null)
  const [cutscene, setCutscene] = useState<LifeBusEvents['cutscene']>(null)
  const [finale, setFinale] = useState<LifeBusEvents['finale']>(null)
  const [titleCard, setTitleCard] = useState<LifeBusEvents['card']>(null)
  const [pano, setPano] = useState<LifeBusEvents['pano']>(null)
  const [tunnel, setTunnel] = useState<LifeBusEvents['tunnel']>(null)
  /** the plate that names a room as you step into it — not on the first room of a session */
  const [placeCard, setPlaceCard] = useState<{ titleHe: string; subHe: string | null } | null>(null)
  const lastPlace = useRef<string | null>(null)
  const [card, setCard] = useState<HistoricalAnchor | null>(null)
  const [controls, setControls] = useState(true)
  const [touch, setTouch] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [persisted, setPersisted] = useState(true)
  /**
   * המסגרת — where the painting ends, in CSS pixels; 0 means "it does not end".
   *
   * The world scene fills the glass and reports 0; the street-ball minigame still frames
   * its pitch and reports the height of the strip it occupies. Everything below lays out
   * from this one number: a framed picture gets its dialogue and deck UNDER it, a full-bleed
   * one gets them floating OVER it.
   */
  const [frame, setFrame] = useState(0)
  const [stage, setStage] = useState(0)
  const [menu, setMenu] = useState(false)
  /** the map sheet: a snapshot of the places, taken when it opens, like the profile */
  const [places, setPlaces] = useState<MapPlace[] | null>(null)
  const [confirmDay, setConfirmDay] = useState(false)
  /**
   * the arcade deck on a phone — OFF by default. The picture is the controller: you touch
   * a place and the boy walks, touch a person and he goes and talks. The stick is there in
   * the menu for whoever wants it, and the choice is remembered on the device.
   */
  const [deck, setDeck] = useState(false)
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
  /**
   * הפתיח — five pictures before the game, once per sitting.
   *
   * `null` while we have not yet asked (the server render, and the first paint), so the
   * sequence never flashes on for a frame before being told it has already played.
   * `sessionStorage` rather than the save file: a reload during one sitting has already
   * seen it, and a player who comes back next week is opening this game again. It also
   * keeps the opening out of the append-only life log, which records what the CHILD did.
   */
  const [opening, setOpening] = useState<boolean | null>(null)

  // --- boot -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    const bus = new LifeBus()
    const unsubscribe: Array<() => void> = []

    setPersisted(lifeStore.usable())
    try {
      setOpening(window.sessionStorage.getItem(OPENING_SEEN) !== '1')
    } catch {
      // A browser that refuses session storage gets the opening every time, which is a
      // better failure than a browser that never gets it at all.
      setOpening(true)
    }
    setTouch(
      typeof window !== 'undefined' &&
        (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window),
    )
    try {
      setDeck(window.localStorage.getItem(DECK_PREF) === '0')
    } catch {
      /* the deck simply shows */
    }

    // --- the sound -------------------------------------------------------------------
    const sfx = new LifeAudio()
    audio.current = sfx
    setSound(!sfx.muted)
    const wake = () => sfx.wake()
    window.addEventListener('pointerdown', wake, { passive: true })
    window.addEventListener('keydown', wake)
    unsubscribe.push(() => {
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
    })
    unsubscribe.push(
      bus.on('sound', (event) => {
        if (event.kind === 'step') sfx.step(event.surface)
        else if (event.kind === 'door') sfx.door()
        else if (event.kind === 'whistle') sfx.whistle(event.blasts)
        else if (event.kind === 'roar') sfx.roar(event.big ?? 1)
        else if (event.kind === 'radio') sfx.radioOn(event.on)
      }),
    )

    unsubscribe.push(bus.on('hud', setHud))
    unsubscribe.push(
      bus.on('dialogue', (value) => {
        setDialogue(value)
        sfx.duck(Boolean(value))
        if (value) sfx.page()
      }),
    )
    unsubscribe.push(
      bus.on('prompt', (value) => {
        setPrompt(value)
        if (value) sfx.tick()
      }),
    )
    unsubscribe.push(bus.on('teach', setTeach))
    unsubscribe.push(
      bus.on('toast', (value) => {
        setToast(value)
        if (value?.art) sfx.thud()
      }),
    )
    unsubscribe.push(bus.on('ending', setEnding))
    unsubscribe.push(bus.on('match', setMatch))
    unsubscribe.push(bus.on('doc', setDoc))
    unsubscribe.push(bus.on('cutscene', setCutscene))
    unsubscribe.push(bus.on('finale', setFinale))
    unsubscribe.push(bus.on('card', setTitleCard))
    unsubscribe.push(bus.on('pano', setPano))
    unsubscribe.push(
      bus.on('tunnel', (value) => {
        setTunnel(value)
        if (value) sfx.setAmbience('tunnel')
      }),
    )
    unsubscribe.push(
      bus.on('place', (place) => {
        // The first room of a session is named by the HUD alone; every door after it gets
        // the plate. Same room twice in a row (a scene restart) is not a door.
        if (lastPlace.current && lastPlace.current !== place.id) {
          setPlaceCard({ titleHe: place.title, subHe: null })
        }
        lastPlace.current = place.id
        sfx.setAmbience((place.ambience as AmbienceKey | undefined) ?? (place.id === 'prologue' ? 'stadium' : 'interior'))
      }),
    )
    unsubscribe.push(bus.on('controls', (value) => setControls(value.visible)))
    unsubscribe.push(bus.on('anchor', (value) => setCard(value.showing ? value.anchor : null)))
    unsubscribe.push(bus.on('frame', (value) => setFrame(value.picture)))

    void (async () => {
      const [engine, module] = await Promise.all([
        loadLife(DEFAULT_IDENTITY, 1986),
        import('@/lib/life/runtime/game'),
      ])
      if (cancelled || !holder.current) return
      runtime.current = module.createLifeGame({
        parent: holder.current,
        engine,
        bus,
        anchor,
        prologueAnchor,
        anchors,
      })
      const box = holder.current.getBoundingClientRect()
      runtime.current.resize(box.width, box.height)
      setStage(box.height)
      setReady(true)
    })()

    return () => {
      cancelled = true
      for (const off of unsubscribe) off()
      bus.clear()
      runtime.current?.destroy()
      runtime.current = null
    }
  }, [anchor, prologueAnchor, anchors])

  // --- the shell owns the box -------------------------------------------------------
  useEffect(() => {
    const node = holder.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      runtime.current?.resize(entry.contentRect.width, entry.contentRect.height)
      setStage(entry.contentRect.height)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ready])

  /**
   * המקלדת — held in the shell, because a scene restart forgets what is held.
   *
   * Phaser rebuilds its Key objects when a scene restarts, and the browser never re-sends
   * a keydown for a key that never came up — so crossing a doorway with an arrow held
   * left the child frozen in the next room until the player let go and pressed again. The
   * document's own key state survives every scene change, so it is the source of truth
   * and the runtime is simply told what it says.
   */
  useEffect(() => {
    if (!ready) return
    const held = new Set<string>()
    const send = () => {
      const input = runtime.current?.input
      if (!input) return
      let x = 0
      let y = 0
      if (held.has('arrowleft') || held.has('a')) x -= 1
      if (held.has('arrowright') || held.has('d')) x += 1
      if (held.has('arrowup') || held.has('w')) y -= 1
      if (held.has('arrowdown') || held.has('s')) y += 1
      input.setKeys(x, y)
      input.setKeyAction(held.has('e') || held.has(' ') || held.has('enter'))
      input.setRun(held.has('shift'))
    }
    const onDown = (event: KeyboardEvent) => {
      held.add(event.key.toLowerCase())
      send()
    }
    const onUp = (event: KeyboardEvent) => {
      held.delete(event.key.toLowerCase())
      send()
    }
    const clear = () => {
      held.clear()
      send()
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', clear)
      clear()
    }
  }, [ready])

  /**
   * The game owns the arrow keys and the space bar for as long as it is on screen.
   *
   * Without this the browser scrolls the page on every step and every "continue", the
   * canvas drifts out of the viewport, and the player is fighting the document instead of
   * walking. Space also advances a line — but only when there is a line and no choice to
   * make, because a choice is a decision and a space bar is not one.
   */
  useEffect(() => {
    if (!ready) return
    const owned = new Set([' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (owned.has(event.key)) event.preventDefault()
      // E is the game's action key everywhere — including inside the dialogue box, so a
      // player never has to change hands to read a line.
      // Escape always leaves the conversation, on every line — the keyboard twin of the X.
      if (event.key === 'Escape') {
        if (!dialogue) return
        event.preventDefault()
        runtime.current?.leave()
        runtime.current?.input.swallow()
        return
      }
      const advances = event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'e'
      if (!advances) return
      if (!dialogue) return
      event.preventDefault()
      if (!dialogue.choices || dialogue.choices.length === 0) {
        // Through the box, not past it: a line still typing itself prints first, and the
        // second press turns the page — the same two beats a thumb gets.
        const button = document.querySelector<HTMLButtonElement>('[data-life="dialogue"] [data-life="continue"]')
        if (button) button.click()
        else runtime.current?.advance()
        // the same key is the action key — see `InputState.swallow`
        runtime.current?.input.swallow()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogue, ready])

  // --- a toast is a sentence, not a notification centre ------------------------------
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.art ? 3600 : 2600)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!placeCard) return
    const timer = setTimeout(() => setPlaceCard(null), 1700)
    return () => clearTimeout(timer)
  }, [placeCard])

  // A title card holds for as long as it was told to, and then it is simply gone.
  useEffect(() => {
    if (!titleCard) return
    const timer = setTimeout(() => setTitleCard(null), titleCard.ms)
    return () => clearTimeout(timer)
  }, [titleCard])

  const onAxis = useCallback((x: number, y: number) => {
    runtime.current?.input.setAxis(x, y)
  }, [])

  const onAction = useCallback((down: boolean) => {
    runtime.current?.input.setAction(down)
  }, [])

  /**
   * B — the other half of the arcade pair, and it does what B has always done.
   *
   * While you are walking it is RUN. While somebody is talking it is LEAVE, which is the
   * same thing the X in the corner does and the same thing Escape does on a keyboard. One
   * button, one idea — "not this" — rather than a third button for a third mechanic.
   */
  const onCancel = useCallback(
    (down: boolean) => {
      if (dialogue) {
        if (down) runtime.current?.leave()
        return
      }
      runtime.current?.input.setRun(down)
    },
    [dialogue],
  )

  const openProfile = useCallback((withDebug: boolean) => {
    const current = runtime.current
    if (!current) return
    current.pause(true)
    setSnapshot(current.snapshot())
    setDebug(withDebug)
  }, [])

  const closeProfile = useCallback(() => {
    setSnapshot(null)
    setDebug(false)
    runtime.current?.pause(false)
  }, [])

  /**
   * The film reporting back. Stable, and it must be: `HistoricalCutscene` calls it from
   * its own unmount, so a callback that changed identity would end the cutscene every
   * time this shell re-rendered — which it does on every line of dialogue.
   */
  const endCutscene = useCallback((outcome: CutsceneOutcome) => {
    setCutscene(null)
    runtime.current?.endCutscene(outcome)
  }, [])

  const closeOpening = useCallback(() => {
    setOpening(false)
    try {
      window.sessionStorage.setItem(OPENING_SEEN, '1')
    } catch {
      /* it will simply play again */
    }
  }, [])

  const reset = useCallback(() => {
    void (async () => {
      await lifeStore.clear()
      window.location.reload()
    })()
  }, [])

  const openMenu = useCallback(() => {
    runtime.current?.pause(true)
    setConfirmReset(false)
    setConfirmDay(false)
    setMenu(true)
  }, [])

  const closeMenu = useCallback(() => {
    setMenu(false)
    setConfirmReset(false)
    setConfirmDay(false)
    runtime.current?.pause(false)
  }, [])

  const finishTunnel = useCallback(() => {
    runtime.current?.finishTunnel()
  }, [])
  const tunnelHeard = useRef(false)
  const tunnelProgress = useCallback((p: number) => {
    // the crowd comes through the concrete halfway down; the terrace takes over at the end
    if (p > 0.45 && !tunnelHeard.current) {
      tunnelHeard.current = true
      audio.current?.setAmbience('stadium')
    }
    if (p < 0.1) tunnelHeard.current = false
  }, [])

  const openMap = useCallback(() => {
    const current = runtime.current
    if (!current) return
    current.pause(true)
    setPlaces(current.places())
  }, [])

  const closeMap = useCallback(() => {
    setPlaces(null)
    runtime.current?.pause(false)
  }, [])

  const goTo = useCallback((id: string) => {
    const current = runtime.current
    if (!current) return
    setPlaces(null)
    if (!current.goTo(id)) current.pause(false)
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
  }, [])

  const toggleDeck = useCallback((on: boolean) => {
    setDeck(on)
    try {
      window.localStorage.setItem(DECK_PREF, on ? '0' : '1')
    } catch {
      /* it simply does not persist */
    }
  }, [])

  /** the painting fills the glass; the shell floats over it */
  const fullBleed = frame <= 0
  /** every overlay that must hide the in-world controls */
  const covered = Boolean(dialogue || ending || card || cutscene || snapshot || menu || places || pano || tunnel)

  return (
    <div className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-ink">
      <div className="relative h-full w-full overflow-hidden border-y-hair border-ink bg-ink">
        <div ref={holder} className="absolute inset-0" />

        {/* Where the painting ends. A vermilion hairline turns the empty band under a
            framed picture into the foot of a printed sheet instead of dead space. */}
        {ready && !fullBleed && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 z-10 h-[2px] bg-red/70"
            style={{ top: frame - 1 }}
          />
        )}

        {!ready && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink">
            <p className="font-display text-[15px] text-sheet">{t('life.loading')}</p>
          </div>
        )}

        {/* Two clocks, never both. During the ninety minutes the board replaces the HUD:
            the time of day stops being the thing anybody in the ground is looking at. */}
        {/* No plate before there is a place: during the prologue the HUD has nothing to
            say, and an empty plate with a lone "·" in it sat in the corner of the 1983
            terrace like a bug. */}
        {ready && !cutscene && !match && hud.place && <LifeHud hud={hud} />}
        {ready && !cutscene && match && (
          <ScoreStrip match={match} objective={match.over ? hud.objective : null} />
        )}

        {/* התיק — one small plate under the clock. It is the only permanent control on
            the glass that is not the console: everything else about the player's state
            is learned by looking at people. */}
        {ready && !covered && (
          <div
            className="absolute z-30 flex items-start gap-1.5"
            style={{ insetInlineStart: 10, top: 'calc(54px + env(safe-area-inset-top))' }}
          >
            {/* ☰ — the one door to everything that is not the world. The visible chips are
                small because the HUD is small; the TARGET is the full 48px the brand
                requires, and it is the transparent button around each. On a phone that
                difference is the whole difference between a control and a decoration you
                keep missing. */}
            <button
              type="button"
              onClick={openMenu}
              data-life="menu-open"
              aria-label={t('life.menu.title')}
              className="group flex min-h-tap min-w-tap items-start"
            >
              <span className="mt-2 border-hair border-ink bg-sheet/95 px-2.5 py-1 font-mono text-[13px] leading-none tabular-nums text-ink transition-colors duration-press group-active:bg-red group-active:text-sheet motion-reduce:transition-none">
                ☰
              </span>
            </button>
            <button
              type="button"
              onClick={() => openProfile(false)}
              data-life="profile-open"
              className="group flex min-h-tap items-start"
            >
              <span className="mt-2 border-hair border-ink bg-sheet/95 px-2.5 py-1.5 font-body text-[10px] leading-none text-ink transition-colors duration-press group-active:bg-red group-active:text-sheet motion-reduce:transition-none">
                {t('life.profile')}
              </span>
            </button>
            <button
              type="button"
              onClick={openMap}
              data-life="map-open"
              className="group flex min-h-tap items-start"
            >
              <span className="mt-2 border-hair border-ink bg-sheet/95 px-2.5 py-1.5 font-body text-[10px] leading-none text-ink transition-colors duration-press group-active:bg-red group-active:text-sheet motion-reduce:transition-none">
                {t('life.map')}
              </span>
            </button>
          </div>
        )}

        {ready && !covered && controls && (touch ? deck : true) && (
          <ControlDeck
            top={fullBleed ? stage : frame}
            height={fullBleed ? 0 : Math.max(0, stage - frame)}
            touch={touch}
            verb={prompt?.verb ?? null}
            label={prompt ? `${t(`life.verb.${prompt.verb}` as MessageKey)} ${prompt.label}` : null}
            locked={prompt?.locked ?? false}
            onAxis={onAxis}
            onAction={onAction}
            onCancel={onCancel}
          />
        )}

        {ready && !covered && controls && touch && !deck && (
          <TapChip
            verb={prompt?.verb ?? null}
            label={prompt ? `${t(`life.verb.${prompt.verb}` as MessageKey)} ${prompt.label}` : null}
            locked={prompt?.locked ?? false}
            onAction={onAction}
          />
        )}

        {ready && teach && !covered && <Teach id={teach.id} touch={touch} />}

        {toast && !cutscene && <Stamp toast={toast} />}
        {placeCard && !cutscene && !titleCard && !toast && <PlaceCard titleHe={placeCard.titleHe} subHe={placeCard.subHe} />}

        {tunnel && !cutscene && (
          <TunnelWalk
            onDone={finishTunnel}
            onProgress={tunnelProgress}
          />
        )}
        {pano && !cutscene && (
          <Panorama pano={pano} onTalk={(id) => runtime.current?.talk(id)} onClose={() => runtime.current?.closePano()} />
        )}
        {dialogue?.lines[0]?.closeUp && !cutscene && !pano && <CloseUp art={dialogue.lines[0].closeUp} />}
        {dialogue && (
          <DialogueBox
            lines={dialogue.lines}
            portrait={dialogue.portrait ?? null}
            {...(!fullBleed ? { offsetTop: frame + 8 } : {})}
            {...(dialogue.choices ? { choices: dialogue.choices } : {})}
            onAdvance={() => runtime.current?.advance()}
            onChoose={(id) => runtime.current?.choose(id)}
            onLeave={() => runtime.current?.leave()}
          />
        )}

        {doc && <DocSheet art={doc.art} captionHe={doc.captionHe} onClose={() => setDoc(null)} />}

        {/* הארכיון — the one screen in this game that is not this game.
            It renders over everything, and every other overlay above is suppressed while
            it does, because the point of it is that for two minutes the player is not
            playing. `key` on the cutscene id so a second film later in the life mounts a
            clean component rather than reusing this one's YouTube player. */}
        {/* הפתיח — over everything, including the loading plate, because it IS the
            loading plate: the game boots underneath it while the player watches a cot,
            a bus and a man lifting a five-year-old over a crowd. */}
        {opening && (
          <OpeningSequence anchor={prologueAnchor} onDone={closeOpening} />
        )}

        {cutscene && (
          <HistoricalCutscene
            key={cutscene.scene.id}
            scene={cutscene.scene}
            card={cutscene.card}
            onDone={endCutscene}
          />
        )}

        {card && <AnchorCard anchor={card} onClose={() => setCard(null)} />}

        {/* כרטיס-ביסוס — over black, one line, then the scene. */}
        {titleCard && <TitleCard titleHe={titleCard.titleHe} subHe={titleCard.subHe} />}

        {finale && (
          <StageFinale
            finale={finale}
            onContinue={() => {
              setFinale(null)
              runtime.current?.dismissFinale()
            }}
          />
        )}

        {menu && (
          <LifeMenu
            touch={touch}
            deck={deck}
            persisted={persisted}
            debug={process.env.NODE_ENV !== 'production'}
            onClose={closeMenu}
            onProfile={() => {
              setMenu(false)
              openProfile(false)
            }}
            onDeck={toggleDeck}
            sound={sound}
            onSound={(on) => {
              setSound(on)
              audio.current?.setMuted(!on)
            }}
            onDebug={() => {
              setMenu(false)
              openProfile(true)
            }}
            onReset={() => (confirmReset ? reset() : setConfirmReset(true))}
            confirmReset={confirmReset}
            onRestartDay={() => (confirmDay ? restartDay() : setConfirmDay(true))}
            confirmDay={confirmDay}
            onMap={() => {
              setMenu(false)
              setPlaces(runtime.current?.places() ?? [])
            }}
          />
        )}

        {places && <LifeMap places={places} onGo={goTo} onClose={closeMap} />}

        {snapshot && !debug && <ProfileCard snapshot={snapshot} onClose={closeProfile} />}
        {snapshot && debug && (
          <DebugPanel snapshot={snapshot} runtime={runtime.current} onClose={closeProfile} />
        )}

        {ending && (
          <EndingCard
            titleHe={ending.titleHe}
            bodyHe={ending.bodyHe}
            memoryHe={ending.memoryHe}
            after={ending.after ?? null}
            chapter={ending.chapter ?? '1986'}
            onClose={() => {
              setEnding(null)
              runtime.current?.dismissEnding()
            }}
          />
        )}
      </div>

    </div>
  )
}
