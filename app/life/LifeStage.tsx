'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { AnchorCard } from '@/components/life/AnchorCard'
import { DocSheet } from '@/components/life/DocSheet'
import { ScoreStrip } from '@/components/life/ScoreStrip'
import { StageFinale } from '@/components/life/StageFinale'
import { ControlDeck } from '@/components/life/ControlDeck'
import { DebugPanel } from '@/components/life/DebugPanel'
import { DialogueBox } from '@/components/life/DialogueBox'
import { EndingCard } from '@/components/life/EndingCard'
import { LifeHud } from '@/components/life/LifeHud'
import { ProfileCard } from '@/components/life/ProfileCard'
import { Teach } from '@/components/life/Teach'
import { t, type MessageKey } from '@/lib/i18n'
import type { HistoricalAnchor } from '@/lib/life/anchors'
import { DEFAULT_IDENTITY } from '@/lib/life/content/chapter1986'
import { loadLife } from '@/lib/life/engine'
import { lifeStore } from '@/lib/life/save'
import { LifeBus, type HudState, type LifeBusEvents } from '@/lib/life/runtime/bus'
import type { LifeRuntime, LifeSnapshot } from '@/lib/life/runtime/game'

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

const EMPTY_HUD: HudState = { clock: '', agorot: 0, showMoney: false, place: '', objective: null }

export function LifeStage({
  anchor,
  prologueAnchor,
}: {
  anchor: HistoricalAnchor
  prologueAnchor: HistoricalAnchor
}) {
  const holder = useRef<HTMLDivElement | null>(null)
  const runtime = useRef<LifeRuntime | null>(null)

  const [ready, setReady] = useState(false)
  const [hud, setHud] = useState<HudState>(EMPTY_HUD)
  const [dialogue, setDialogue] = useState<LifeBusEvents['dialogue']>(null)
  const [prompt, setPrompt] = useState<LifeBusEvents['prompt']>(null)
  const [teach, setTeach] = useState<LifeBusEvents['teach']>(null)
  const [toast, setToast] = useState<LifeBusEvents['toast']>(null)
  const [ending, setEnding] = useState<LifeBusEvents['ending']>(null)
  const [match, setMatch] = useState<LifeBusEvents['match']>(null)
  const [doc, setDoc] = useState<LifeBusEvents['doc']>(null)
  const [finale, setFinale] = useState<LifeBusEvents['finale']>(null)
  const [card, setCard] = useState<HistoricalAnchor | null>(null)
  const [controls, setControls] = useState(true)
  const [touch, setTouch] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [persisted, setPersisted] = useState(true)
  const [frame, setFrame] = useState(0)
  const [stage, setStage] = useState(0)
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

  // --- boot -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    const bus = new LifeBus()
    const unsubscribe: Array<() => void> = []

    setPersisted(lifeStore.usable())
    setTouch(
      typeof window !== 'undefined' &&
        (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window),
    )

    unsubscribe.push(bus.on('hud', setHud))
    unsubscribe.push(bus.on('dialogue', setDialogue))
    unsubscribe.push(bus.on('prompt', setPrompt))
    unsubscribe.push(bus.on('teach', setTeach))
    unsubscribe.push(bus.on('toast', setToast))
    unsubscribe.push(bus.on('ending', setEnding))
    unsubscribe.push(bus.on('match', setMatch))
    unsubscribe.push(bus.on('doc', setDoc))
    unsubscribe.push(bus.on('finale', setFinale))
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
  }, [anchor, prologueAnchor])

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
        return
      }
      const advances = event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'e'
      if (!advances) return
      if (!dialogue) return
      event.preventDefault()
      if (!dialogue.choices || dialogue.choices.length === 0) runtime.current?.advance()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogue, ready])

  // --- a toast is a sentence, not a notification centre ------------------------------
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

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

  const reset = useCallback(() => {
    void (async () => {
      await lifeStore.clear()
      window.location.reload()
    })()
  }, [])

  return (
    <div className="relative -mx-gutter">
      <div className="relative h-[calc(100dvh-var(--tap)-3.25rem-env(safe-area-inset-bottom))] w-full overflow-hidden border-y-hair border-ink bg-ink">
        <div ref={holder} className="absolute inset-0" />

        {/* Where the painting ends. A vermilion hairline turns the empty band under a
            framed picture into the foot of a printed sheet instead of dead space. */}
        {ready && frame > 0 && (
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
        {ready && !match && <LifeHud hud={hud} />}
        {ready && match && <ScoreStrip match={match} />}

        {/* התיק — one small plate under the clock. It is the only permanent control on
            the glass that is not the console: everything else about the player's state
            is learned by looking at people. */}
        {ready && !dialogue && !ending && !card && !snapshot && (
          <button
            type="button"
            onClick={() => openProfile(false)}
            data-life="profile-open"
            className="group absolute z-30 flex min-h-tap items-start"
            style={{ insetInlineStart: 10, top: 54 }}
          >
            {/* The visible chip is small because the HUD is small; the TARGET is the full
                48px the brand requires, and it is the transparent button around it. On a
                phone that difference is the whole difference between a control and a
                decoration you keep missing. */}
            <span className="mt-2 border-hair border-ink bg-sheet/95 px-2.5 py-1.5 font-body text-[10px] leading-none text-ink transition-colors duration-press group-active:bg-red group-active:text-sheet motion-reduce:transition-none">
              {t('life.profile')}
            </span>
          </button>
        )}

        {ready && !dialogue && !ending && !card && controls && (
          <ControlDeck
            top={frame > 0 ? frame : Math.max(0, stage - 132)}
            height={frame > 0 ? Math.max(0, stage - frame) : 132}
            touch={touch}
            verb={prompt?.verb ?? null}
            label={prompt ? `${t(`life.verb.${prompt.verb}` as MessageKey)} ${prompt.label}` : null}
            locked={prompt?.locked ?? false}
            onAxis={onAxis}
            onAction={onAction}
            onCancel={onCancel}
          />
        )}

        {ready && teach && !dialogue && !ending && !card && <Teach id={teach.id} touch={touch} />}

        {toast && (
          <div className="pointer-events-none absolute inset-x-0 top-[68px] z-30 flex justify-center px-gutter">
            <div
              className={`border-hair px-3 py-1.5 ${
                toast.tone === 'red' ? 'border-red bg-red' : 'border-ink bg-sheet'
              }`}
            >
              <p
                className={`font-body text-[12px] leading-none ${
                  toast.tone === 'red' ? 'text-sheet' : 'text-ink'
                }`}
              >
                <bdi>{toast.text}</bdi>
              </p>
            </div>
          </div>
        )}

        {dialogue && (
          <DialogueBox
            lines={dialogue.lines}
            portrait={dialogue.portrait ?? null}
            {...(frame > 0 ? { offsetTop: frame + 8 } : {})}
            {...(dialogue.choices ? { choices: dialogue.choices } : {})}
            onAdvance={() => runtime.current?.advance()}
            onChoose={(id) => runtime.current?.choose(id)}
            onLeave={() => runtime.current?.leave()}
          />
        )}

        {doc && <DocSheet art={doc.art} captionHe={doc.captionHe} onClose={() => setDoc(null)} />}

        {card && <AnchorCard anchor={card} onClose={() => setCard(null)} />}

        {finale && (
          <StageFinale
            finale={finale}
            onContinue={() => {
              setFinale(null)
              runtime.current?.dismissFinale()
            }}
          />
        )}

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
            onClose={() => {
              setEnding(null)
              runtime.current?.dismissEnding()
            }}
          />
        )}
      </div>

      {/* Under the glass: the two controls that are not part of the world. */}
      <div className="flex items-center justify-between gap-3 px-gutter pt-2">
        <p className="font-body text-[10px] leading-snug text-muted">
          {persisted ? t('life.autosave') : t('life.storageOff')}
        </p>
        {/* Never in production (rule 44): the panel is not behind a flag, it is behind a
            build. A debug door that can be opened by a query string is a debug door that
            will be opened by a player. */}
        {process.env.NODE_ENV !== 'production' && (
          <button
            type="button"
            onClick={() => openProfile(true)}
            className="flex min-h-tap items-center border-hair border-red px-3 font-body text-[11px] text-red"
          >
            {t('life.debug')}
          </button>
        )}
        <button
          type="button"
          onClick={() => (confirmReset ? reset() : setConfirmReset(true))}
          onBlur={() => setConfirmReset(false)}
          className="flex min-h-tap items-center border-hair border-ink px-3 font-body text-[11px] text-ink transition-colors duration-press active:bg-red active:text-sheet motion-reduce:transition-none"
        >
          {confirmReset ? t('life.reset.confirm') : t('life.reset')}
        </button>
      </div>
    </div>
  )
}
