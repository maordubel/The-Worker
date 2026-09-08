'use client'

import { useRef } from 'react'

import { AnchorCard } from '@/components/life/AnchorCard'
import { DocSheet } from '@/components/life/DocSheet'
import { BookSheet } from '@/components/life/BookSheet'
import { ScoreStrip } from '@/components/life/ScoreStrip'
import { ShirtCard } from '@/components/life/ShirtCard'
import { CastCard } from '@/components/life/CastCard'
import { FilmCut } from '@/components/life/FilmCut'
import { CoinCard } from '@/components/life/CoinCard'
import dynamic from 'next/dynamic'
// Three.js is real weight (~150KB+ gz) that nine players in ten never touch this
// session — these two are the only 3D rooms in the game, so they load on demand,
// the moment the bus actually opens one, rather than riding in on every /life visit.
const PenaltyCard = dynamic(() => import('@/components/life/PenaltyCard').then((m) => m.PenaltyCard), { ssr: false })
const HoopsCard = dynamic(() => import('@/components/life/HoopsCard').then((m) => m.HoopsCard), { ssr: false })
// The football engine is the heaviest room in the game — three.js plus a stadium, a crowd
// and twenty-two figures. It is reachable from here and from nowhere else, and
// `tests/life-football.test.ts` fails the build if any other module imports the renderer.
const PitchCard = dynamic(() => import('@/components/life/PitchCard').then((m) => m.PitchCard), { ssr: false })
import { AlbumSheet } from '@/components/life/AlbumSheet'
import { PassTime } from '@/components/life/PassTime'
import { landingMinute } from '@/lib/life/world/flow'
import { timeLabel } from '@/lib/life/clock'
import { PacketCard } from '@/components/life/PacketCard'
import { ShopCard } from '@/components/life/ShopCard'
import { StageFinale } from '@/components/life/StageFinale'
import { TotoCard } from '@/components/life/TotoCard'
import { ControlDeck, TapChip } from '@/components/life/ControlDeck'
import { DebugPanel } from '@/components/life/DebugPanel'
import { DialogueBox } from '@/components/life/DialogueBox'
import { RetryCard } from '@/components/life/RetryCard'
import { EndingCard } from '@/components/life/EndingCard'
import { PlaceCard, Stamp, TitleCard } from '@/components/life/Stamp'
import { CloseUp } from '@/components/life/CloseUp'
import { Panorama } from '@/components/life/Panorama'
import { TunnelWalk } from '@/components/life/TunnelWalk'
import type { LifeAudio } from '@/lib/life/runtime/audio'
import { HistoricalCutscene } from '@/components/life/HistoricalCutscene'
import { LifeHud } from '@/components/life/LifeHud'
import { LifeMap } from '@/components/life/LifeMap'
import { LifeMenu } from '@/components/life/LifeMenu'
import { OpeningSequence } from '@/components/life/OpeningSequence'
import { CodaCard } from '@/components/life/CodaCard'
import { MapReveal } from '@/components/life/MapReveal'
import { ChapterCard } from '@/components/life/ChapterCard'
import { Flash, Grain, Letterbox } from '@/components/life/FilmFx'
import { GaugePops, GaugesSheet, HeartBadge } from '@/components/life/Gauges'
import { HelpSheet } from '@/components/life/HelpSheet'
import { Chip } from '@/components/life/Plate'
import { ProfileCard } from '@/components/life/ProfileCard'
import { Teach } from '@/components/life/Teach'
import { t, type MessageKey } from '@/lib/i18n'
import type { HistoricalAnchor } from '@/lib/life/anchors'
import { loadLife } from '@/lib/life/engine'
import type { LifeBus } from '@/lib/life/runtime/bus'
import type { LifeRuntime } from '@/lib/life/runtime/game'
import { bookFor } from '@/lib/life/books'
import { SETS, SET_ORDER, albumTotals, hasSticker, stickersIn } from '@/lib/life/stickers'
import { TOTO_PER_ANSWER } from '@/lib/life/toto'


import { useLifeInput } from './stage/useLifeInput'
import { useLifeLedger } from './stage/useLifeLedger'
import { decadeOf, useLifeRuntime } from './stage/useLifeRuntime'
import { useLifeSheets } from './stage/useLifeSheets'
import { useUiScale } from './stage/useUiScale'

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
 *
 * מה נשאר כאן — since 7.9.2026 this file is a list of the concerns it composes and then the
 * picture they draw, and nothing else. The audit's complaint was never that the boundary was
 * in the wrong place; it was that one file had become the implementation site for all of it
 * at once. So the five mechanisms moved into `./stage/`, one per file, and each of them is
 * named for the DIRECTION it runs in rather than for a feature:
 *
 *   · `useLifeRuntime`  — the game talking to React: the bus, the synthesiser, the Phaser
 *                          instance, the box it fills, and every overlay it can raise.
 *   · `useLifeInput`     — the keyboard and the thumb talking to the game.
 *   · `useLifeSheets`    — the five screens the PLAYER opens, and the pause they all take.
 *   · `useLifeLedger`    — the eight places where the shell writes into the life.
 *   · `useUiScale`       — the only thing in the shell that asks about the screen, not the life.
 *
 * The five handles below stay here, in the one component that holds them, because the JSX
 * borrows all of them: a dialogue box advances the runtime, a shop till dispatches to the
 * engine, an album emits on the bus. One canonical handle each, lent out rather than copied.
 */

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
  /** the synthesiser — made on the first gesture, remembered muted or not per browser */
  const audio = useRef<LifeAudio | null>(null)
  /** the engine itself, so the two money cards can pay out what they earned */
  const engineRef = useRef<Awaited<ReturnType<typeof loadLife>> | null>(null)
  /** the bus itself, so a screen the shell owns can raise a card the scene usually raises */
  const busRef = useRef<LifeBus | null>(null)

  const uiScale = useUiScale()

  const {
    ready,
    hud,
    dialogue,
    prompt,
    teach,
    toast,
    sound,
    setSound,
    ending,
    setEnding,
    retry,
    setRetry,
    match,
    doc,
    setDoc,
    book,
    setBook,
    cutscene,
    endCutscene,
    finale,
    setFinale,
    coda,
    setCoda,
    gaugeBeat,
    love,
    flash,
    titleCard,
    shirt,
    setShirt,
    toto,
    setToto,
    coin,
    setCoin,
    penalty,
    setPenalty,
    hoops,
    setHoops,
    pitch,
    setPitch,
    shop,
    setShop,
    shopState,
    setShopState,
    album,
    setAlbum,
    albumState,
    setAlbumState,
    packet,
    setPacket,
    kept,
    setKept,
    pass,
    setPass,
    cast,
    setCast,
    film,
    setFilm,
    pano,
    tunnel,
    finishTunnel,
    tunnelProgress,
    placeCard,
    card,
    setCard,
    controls,
    touch,
    persisted,
    frame,
    stage,
    mapState,
    setMapState,
    reveal,
    setReveal,
    deck,
    toggleDeck,
    opening,
    closeOpening,
  } = useLifeRuntime({ holder, runtime, engineRef, busRef, audio, anchor, prologueAnchor, anchors })

  const {
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
  } = useLifeSheets({ runtime, audio, setMapState })

  const { onAxis, onAction, onCancel } = useLifeInput({ runtime, ready, dialogue })

  const ledger = useLifeLedger({ engineRef })

  /** the painting fills the glass; the shell floats over it */
  const fullBleed = frame <= 0
  /** every overlay that must hide the in-world controls */
  const covered = Boolean(cast || shirt || dialogue || ending || retry || card || cutscene || snapshot || menu || places || pano || tunnel || gauges || coda || reveal)

  return (
    <div className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-ink">
      <div
        className="life-glass relative h-full w-full overflow-hidden border-y-hair border-ink bg-ink"
        data-decade={decadeOf(hud.year)}
        data-controls={controls ? '1' : '0'}
        style={{ '--ui-scale': uiScale } as React.CSSProperties}
      >
        <div ref={holder} className="absolute inset-0" data-life="holder" />

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

        {/* מד האהבה — always on the glass, under the HUD, on the reading side. The one
            number the game is allowed to show; tapping it opens all of them. */}
        {ready && !cutscene && !opening && hud.place && (
          <div className="absolute z-30" style={{ insetInlineEnd: 10, top: 'calc(58px + env(safe-area-inset-top))' }}>
            <HeartBadge value={love.value} bump={love.bump} onOpen={openGauges} />
          </div>
        )}
        {ready && !cutscene && !opening && (
          <GaugePops changes={gaugeBeat} top="calc(150px + env(safe-area-inset-top))" />
        )}
        {gauges && <GaugesSheet state={gauges} onClose={closeGauges} />}
        <Flash tone={flash.tone} nonce={flash.nonce} />
        {ready && !cutscene && match && (
          <ScoreStrip match={match} objective={match.over ? hud.objective : null} />
        )}

        {/* התיק — one small plate under the clock. It is the only permanent control on
            the glass that is not the console: everything else about the player's state
            is learned by looking at people. */}
        {ready && !covered && (
          <div
            className="absolute z-30 flex items-start gap-1"
            style={{ insetInlineStart: 10, top: 'calc(58px + env(safe-area-inset-top))' }}
          >
            {/* ☰ — the one door to everything that is not the world. Sign-plate chips, the
                same object as every button on the site; the TARGET is the full 48px the
                brand requires, and it is the transparent button around each. */}
            <Chip onClick={openMenu} data-life="menu-open" aria-label={t('life.menu.title')}>
              <span className="font-mono tabular-nums text-[13px] leading-none">☰</span>
            </Chip>
            <Chip onClick={() => openProfile(false)} data-life="profile-open">
              {t('life.profile')}
            </Chip>
            <Chip onClick={openMap} data-life="map-open">
              {t('life.map')}
            </Chip>
            {/* ? — almost transparent until it is needed. "מה עליי לעשות?" lives behind
                it: the day's shape, one plain sentence, and — folded — the story, the
                rules and the disclaimer. */}
            <Chip onClick={openHelp} data-life="help-open" aria-label={t('life.help.title')} className="opacity-45 transition-opacity duration-press active:opacity-100 motion-reduce:transition-none">
              <span className="font-mono tabular-nums text-[13px] font-bold leading-none">?</span>
            </Chip>
          </div>
        )}
        {help && <HelpSheet objective={hud.objective} hint={hud.hint} waitingOn={hud.waitingOn ?? null} checklist={checklist} onClose={closeHelp} />}

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
            variant={tunnel.variant ?? 'bloomfield'}
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
            onChoose={(id) => {
              audio.current?.play('choice', { bus: 'ui', level: 0.6 })
              runtime.current?.choose(id)
            }}
            onLeave={() => runtime.current?.leave()}
          />
        )}

        {doc && <DocSheet art={doc.art} captionHe={doc.captionHe} onClose={() => setDoc(null)} />}

        {/* החוברת — a real object with pages, remembered where it was put down */}
        {book && bookFor(book.id) && (
          <BookSheet
            book={bookFor(book.id)!}
            page={book.page}
            onPage={(page) => {
              setBook({ id: book.id, page })
              ledger.writeBookPage(book.id, page)
            }}
            onClose={() => {
              audio.current?.play('ui-close', { bus: 'ui', level: 0.5 })
              setBook(null)
            }}
          />
        )}

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
        {shirt && <ShirtCard shirt={shirt} onClose={() => setShirt(null)} />}

        {/* ------------------------------------------------ שני משחקי הכסף -- */}
        {film && <FilmCut film={film} onDone={() => setFilm(null)} />}

        {cast && <CastCard cast={cast} onClose={() => setCast(null)} />}

        {shop && shopState && (
          <ShopCard
            shop={shop}
            state={shopState}
            onBuy={(bought) => {
              const paid = ledger.buyShirt(bought, shop.chapter)
              if (!paid) return
              setShopState(paid.state)
              // the card that stops the world — the same one a shirt has always got
              busRef.current?.emit('shirt', paid.card)
            }}
            onClose={() => {
              setShop(null)
              runtime.current?.pause(false)
            }}
          />
        )}

        {album?.open && albumState && (
          <AlbumSheet
            state={albumState}
            onTear={(id, nameHe) => {
              const torn = ledger.tearSticker(id, nameHe)
              if (!torn) return
              setAlbumState(torn.state)
              busRef.current?.emit('toast', torn.toast)
            }}
            onClose={() => {
              busRef.current?.emit('album', null)
              setAlbum(null)
              setAlbumState(null)
              runtime.current?.pause(false)
            }}
          />
        )}

        {packet && (
          <PacketCard
            ids={packet.ids}
            before={packet.before}
            onClose={() => {
              setPacket(null)
              // a card out of the box waits for the packet to be put down, and goes first:
              // the album can wait, an ace cannot be missed
              if (!kept) busRef.current?.emit('album', { open: true })
            }}
          />
        )}

        {pass && !packet && !kept && (
          <PassTime
            waitingHe={pass.waitingHe}
            untilHe={timeLabel(landingMinute(pass))}
            onStay={() => setPass(null)}
            onPass={() => {
              setPass(null)
              const passed = ledger.passTime(pass)
              if (passed) busRef.current?.emit('toast', passed)
            }}
          />
        )}

        {!packet && kept && (
          <PacketCard
            ids={kept.ids}
            before={{}}
            fromBox
            onClose={() => {
              setKept(null)
              busRef.current?.emit('album', { open: true })
            }}
          />
        )}

        {toto && (
          <TotoCard
            toto={toto}
            perAnswer={TOTO_PER_ANSWER}
            onDone={(shekels) => {
              ledger.settleToto(shekels)
              setToto(null)
              runtime.current?.pause(false)
            }}
          />
        )}

        {coin && (
          <CoinCard
            coin={coin}
            canAfford={ledger.canAfford(coin.stake)}
            onDone={(result) => {
              ledger.settleCoin(coin, result)
              setCoin(null)
              runtime.current?.pause(false)
            }}
          />
        )}

        {penalty && (
          <PenaltyCard
            penalty={penalty}
            onDone={(result) => {
              ledger.settlePenalty(result)
              setPenalty(null)
              runtime.current?.pause(false)
            }}
          />
        )}

        {pitch && (
          <PitchCard
            pitch={pitch}
            onDone={(result) => {
              ledger.settlePitch(result)
              setPitch(null)
              runtime.current?.pause(false)
            }}
          />
        )}

        {hoops && (
          <HoopsCard
            hoops={hoops}
            onDone={(result) => {
              ledger.settleHoops(result)
              setHoops(null)
              runtime.current?.pause(false)
            }}
          />
        )}
        {titleCard &&
          (titleCard.art ? (
            <ChapterCard
              titleHe={titleCard.titleHe}
              subHe={titleCard.subHe}
              nameHe={titleCard.nameHe}
              art={titleCard.art}
              fromYear={titleCard.fromYear}
            />
          ) : (
            <TitleCard titleHe={titleCard.titleHe} subHe={titleCard.subHe} />
          ))}

        {coda && (
          <CodaCard
            chapter={coda.chapter}
            lived={runtime.current?.livedChapters() ?? []}
            onBack={() => {
              setCoda(null)
              runtime.current?.dismissCoda()
            }}
          />
        )}

        {finale && (
          <StageFinale
            finale={finale}
            album={(() => {
              const live = engineRef.current?.state
              if (!live) return null
              const totals = albumTotals(live)
              return {
                have: totals.have,
                total: totals.total,
                torn: totals.torn,
                pages: SET_ORDER.map((id) => ({
                  titleHe: SETS[id].titleHe,
                  have: stickersIn(id).filter((sticker) => hasSticker(live, sticker.id)).length,
                  total: stickersIn(id).length,
                })),
              }
            })()}
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
            hasAlbum={engineRef.current ? albumTotals(engineRef.current.state).have > 0 : false}
            onAlbum={() => {
              setMenu(false)
              setAlbumState(engineRef.current?.state ?? null)
              setAlbum({ open: true })
              runtime.current?.pause(true)
            }}
            onMap={() => {
              setMenu(false)
              setMapState(runtime.current?.snapshot().state ?? null)
              setPlaces(runtime.current?.places() ?? [])
            }}
          />
        )}

        {places && mapState && <LifeMap places={places} state={mapState} here={mapState.location} onGo={goTo} onClose={closeMap} />}

        {reveal && mapState && (
          <MapReveal
            place={reveal.place}
            state={mapState}
            places={runtime.current?.places() ?? []}
            here={mapState.location}
            onClose={() => {
              setReveal(null)
              runtime.current?.closeReveal()
            }}
          />
        )}

        {snapshot && !debug && <ProfileCard snapshot={snapshot} onClose={closeProfile} />}
        {snapshot && debug && (
          <DebugPanel snapshot={snapshot} runtime={runtime.current} onClose={closeProfile} />
        )}

        {retry && (
          <RetryCard
            titleHe={retry.titleHe}
            bodyHe={retry.bodyHe}
            otherLifeHe={retry.otherLifeHe}
            closeHe={retry.closeHe}
            onRetry={() => {
              setRetry(null)
              restartDay()
            }}
          />
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
