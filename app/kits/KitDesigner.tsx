'use client'

import { useState } from 'react'

import { KitShirt } from '@/components/kit/KitShirt'
import { ShareRow } from '@/components/share/ShareRow'
import {
  COLLARS,
  COLOUR_NAME,
  COLOUR_VAR,
  DEFAULT_SPEC,
  NAMESETS,
  PATTERNS,
  SLEEVES,
  type KitColour,
  type KitSpec,
} from '@/lib/kit/spec'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * בית החולצות — the layer system, driven.
 *
 * Five tabs, one per layer the player actually cares about, and the shirt redraws on
 * every tap. The old designer asked for a base, a secondary and an accent on three
 * garments and produced something nobody could recognise as a season; this one is
 * built on the handoff's stack, so choosing "פסים רחבים · אדום · שחור" produces the
 * 1989 shirt, and the player can SEE that it does.
 *
 * The shirt is 200×240 of SVG, so the preview on screen and the 1080×1920 story are
 * the same drawing at two sizes — nothing is screenshotted and nothing drifts.
 */

const TABS = [
  { key: 'base', he: 'kit.tab.base' },
  { key: 'pattern', he: 'kit.tab.pattern' },
  { key: 'sleeves', he: 'kit.tab.sleeves' },
  { key: 'collar', he: 'kit.tab.collar' },
  { key: 'nameset', he: 'kit.tab.nameset' },
] as const

const COLOURS: KitColour[] = ['red', 'cream', 'ink', 'paper', 'navy', 'deep']

export function KitDesigner({ seed = 1 }: { seed?: number }) {
  const [spec, setSpec] = useState<KitSpec>(DEFAULT_SPEC)
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('base')

  function set<K extends keyof KitSpec>(key: K, value: KitSpec[K]) {
    setSpec((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="mt-stack border-rule border-ink bg-sheet">
      <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink bg-ink px-4 py-2.5">
        <p className="font-display text-step-1 leading-none text-paper">{t('kit.designer')}</p>
        <p className="font-latin text-[9px] font-bold tracking-[0.2em] text-red" dir="ltr">
          8 LAYERS
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,200px)_1fr] sm:items-start">
        {/* the shirt, on its own sheet of paper */}
        <div className="border-hair border-ink bg-paper p-3">
          <KitShirt spec={spec} className="mx-auto block w-full max-w-[200px]" title={t('kit.designer')} />
          <p className="mt-2 text-center font-mono text-[11px] tabular-nums text-muted">
            <bdi dir="ltr">{spec.seasonLabel}</bdi>
          </p>
        </div>

        <div>
          {/* tabs */}
          <div
            role="tablist"
            aria-label={t('kit.designer')}
            className="flex flex-wrap gap-1 border-b-hair border-ink/40 pb-2"
          >
            {TABS.map((item) => (
              <button
                key={item.key}
                role="tab"
                type="button"
                aria-selected={tab === item.key}
                onClick={() => setTab(item.key)}
                className={`min-h-tap px-3 font-body text-step--1 font-extrabold transition-colors duration-press ${
                  tab === item.key ? 'bg-red text-paper' : 'text-ink'
                }`}
              >
                {t(item.he as MessageKey)}
              </button>
            ))}
          </div>

          <div className="mt-3">
            {tab === 'base' && (
              <>
                <Label>{t('kit.tab.base')}</Label>
                <Swatches
                  value={spec.base}
                  onPick={(colour) => set('base', colour)}
                />
                <Label>{t('kit.secondInk')}</Label>
                <Swatches
                  value={spec.patternInk}
                  onPick={(colour) => set('patternInk', colour)}
                />
              </>
            )}

            {tab === 'pattern' && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {PATTERNS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => set('pattern', item.id)}
                    aria-pressed={spec.pattern === item.id}
                    className={`min-h-tap border-hair p-1.5 ${
                      spec.pattern === item.id ? 'border-red bg-red/[.1]' : 'border-ink/40'
                    }`}
                  >
                    <KitShirt
                      spec={{ ...spec, pattern: item.id, sponsorHe: null, makerHe: null, number: null }}
                      className="mx-auto block w-full max-w-[54px]"
                      title={item.he}
                    />
                    <span className="mt-1 block font-body text-[10px] leading-tight text-ink">
                      {item.he}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {tab === 'sleeves' && (
              <>
                <Chips
                  items={SLEEVES}
                  value={spec.sleeves}
                  onPick={(value) => set('sleeves', value)}
                />
                <Label>{t('kit.sleeveInk')}</Label>
                <Swatches value={spec.sleeveInk} onPick={(colour) => set('sleeveInk', colour)} />
              </>
            )}

            {tab === 'collar' && (
              <>
                <Chips
                  items={COLLARS}
                  value={spec.collar}
                  onPick={(value) => set('collar', value)}
                />
                <Label>{t('kit.collarInk')}</Label>
                <Swatches value={spec.collarInk} onPick={(colour) => set('collarInk', colour)} />
              </>
            )}

            {tab === 'nameset' && (
              <>
                <Chips
                  items={NAMESETS}
                  value={spec.nameset}
                  onPick={(value) => set('nameset', value)}
                />
                <Label>{t('kit.number')}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[7, 9, 10, 11, 12, 14].map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => set('number', number)}
                      aria-pressed={spec.number === number}
                      className={`min-h-tap w-12 border-hair font-poster text-[22px] ${
                        spec.number === number
                          ? 'border-red bg-red text-paper'
                          : 'border-ink/40 text-ink'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-t-hair border-ink/30 p-4 pt-0">
        <ShareRow
          kind="kit"
          params={{ s: String(seed), total: '8' }}
          headline={t('kit.designer')}
          card={{
            kicker: 'GATE 5 · KIT DESIGNER',
            label: t('screen.kits.title'),
            eyebrow: t('kit.designer'),
            hero: spec.seasonLabel,
            stats: [
              { k: t('kit.tab.pattern'), v: PATTERNS.find((p) => p.id === spec.pattern)?.he ?? '' },
              { k: t('kit.tab.collar'), v: COLLARS.find((c) => c.id === spec.collar)?.he ?? '' },
            ],
            cta: t('kit.cta'),
            challenge: t('share.sameRound'),
          }}
        />
      </div>
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 mt-3 font-body text-[10px] tracking-widest text-muted first:mt-0">
      {children}
    </p>
  )
}

function Swatches({
  value,
  onPick,
}: {
  value: KitColour
  onPick: (colour: KitColour) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOURS.map((colour) => (
        <button
          key={colour}
          type="button"
          onClick={() => onPick(colour)}
          aria-label={COLOUR_NAME[colour]}
          aria-pressed={value === colour}
          className={`min-h-tap w-12 border-rule ${
            value === colour ? 'border-red' : 'border-ink/50'
          }`}
          style={{ background: COLOUR_VAR[colour] }}
        />
      ))}
    </div>
  )
}

function Chips<T extends string>({
  items,
  value,
  onPick,
}: {
  items: readonly { id: T; he: string }[]
  value: T
  onPick: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item.id)}
          aria-pressed={value === item.id}
          className={`min-h-tap border-hair px-3 font-body text-step--1 ${
            value === item.id ? 'border-red bg-red text-paper' : 'border-ink/40 text-ink'
          }`}
        >
          {item.he}
        </button>
      ))}
    </div>
  )
}
