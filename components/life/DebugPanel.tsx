'use client'

import { t } from '@/lib/i18n'
import type { LifeRuntime, LifeSnapshot } from '@/lib/life/runtime/game'

/**
 * לוח הפיתוח — the one screen allowed to show numbers, and it never ships.
 *
 * Rule 44 of the systems pass: developer-only, never in production. That is enforced by
 * the CALLER (`app/life/LifeStage.tsx` renders it only outside a production build), not
 * by a flag somebody can flip, because a debug panel behind a runtime toggle is a debug
 * panel that eventually gets toggled on by a query string.
 *
 * Everything it can DO goes through `runtime.debug`, which dispatches real events — so a
 * life that has been poked at is still a valid log, still reloads, and a bug reproduced
 * by jumping the clock is a bug that can be saved and sent to somebody.
 *
 * It is deliberately ugly. This is not a screen anybody should be tempted to keep.
 */

const PLACES = [
  'bedroom',
  'home',
  'kitchen',
  'street',
  'kiosk',
  'pitch',
  'route',
  'bloomfield-outside',
  'bloomfield-inside',
]

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t-hair border-concrete/20 py-1.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-concrete">{label}</p>
      <div className="mt-1 font-mono text-[10px] leading-snug tabular-nums text-sheet">{children}</div>
    </div>
  )
}

function numbers(record: Record<string, number>): string {
  return Object.entries(record)
    .map(([key, value]) => `${key}=${Math.round(value)}`)
    .join('  ')
}

export function DebugPanel({
  snapshot,
  runtime,
  onClose,
}: {
  snapshot: LifeSnapshot
  runtime: LifeRuntime | null
  onClose: () => void
}) {
  const { state } = snapshot

  return (
    <div role="dialog" className="pointer-events-auto absolute inset-0 z-[60] flex items-stretch justify-center bg-ink/95 p-gutter" aria-modal="true">
      <div className="max-h-full w-full max-w-lg overflow-y-auto border-rule border-red bg-ink p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-red">
            {t('life.debug.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-tap items-center border-hair border-concrete/50 px-3 font-body text-[11px] text-sheet"
          >
            {t('life.debug.close')}
          </button>
        </div>

        <Row label={t('life.debug.clock')}>
          {state.weekday} · {String(Math.floor(state.minute / 60)).padStart(2, '0')}:
          {String(state.minute % 60).padStart(2, '0')} · {state.location} · {state.chapter}
        </Row>
        <Row label={t('life.debug.seed')}>
          {state.rng.seed} @ {state.rng.cursor} · {t('life.debug.events')} {snapshot.events}
        </Row>
        <Row label={t('life.debug.resources')}>
          money={state.agorot} energy={Math.round(state.energy)}{' '}
          {Object.entries(state.inventory)
            .map(([key, value]) => `${key}×${value}`)
            .join(' ')}
        </Row>
        <Row label={t('life.debug.wellbeing')}>{numbers(state.wellbeing)}</Row>
        <Row label={t('life.debug.personality')}>{numbers(state.personality)}</Row>
        <Row label={t('life.debug.heart')}>{numbers(state.redHeart)}</Row>
        <Row label={t('life.debug.relationships')}>
          {Object.entries(state.relationships)
            .map(
              ([who, rel]) =>
                `${who}: b${Math.round(rel.bond)} t${Math.round(rel.trust)} x${Math.round(rel.tension)} d${Math.round(rel.distance)}`,
            )
            .join('   ')}
        </Row>
        <Row label={t('life.debug.memories')}>
          {state.relationshipMemory.map((entry) => `${entry.characterId}/${entry.eventId}`).join('  ') || '—'}
        </Row>
        <Row label={t('life.debug.windows')}>
          {state.opportunities.map((entry) => `${entry.id}:${entry.status}`).join('  ') || '—'}
        </Row>
        <Row label={t('life.debug.flags')}>
          {Object.keys(state.flags).join('  ') || '—'}
        </Row>

        <div className="mt-3 flex flex-wrap gap-1.5 border-t-hair border-red/40 pt-3">
          {[15, 60, 180].map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => runtime?.debug.jump(minutes)}
              className="border-hair border-concrete/50 px-2 py-1 font-mono text-[10px] text-sheet"
            >
              +{minutes}m
            </button>
          ))}
          <button
            type="button"
            onClick={() => runtime?.debug.money(200)}
            className="border-hair border-concrete/50 px-2 py-1 font-mono text-[10px] text-sheet"
          >
            +200a
          </button>
          <button
            type="button"
            onClick={() => runtime?.debug.energy(50)}
            className="border-hair border-concrete/50 px-2 py-1 font-mono text-[10px] text-sheet"
          >
            +50e
          </button>
          <button
            type="button"
            onClick={() => runtime?.debug.reseed(`dev-${Math.floor(Math.random() * 9999)}`)}
            className="border-hair border-concrete/50 px-2 py-1 font-mono text-[10px] text-sheet"
          >
            reseed
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {PLACES.map((place) => (
            <button
              key={place}
              type="button"
              onClick={() => {
                runtime?.debug.goTo(place)
                onClose()
              }}
              className="border-hair border-concrete/50 px-2 py-1 font-mono text-[10px] text-sheet"
            >
              {place}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
