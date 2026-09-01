'use client'

import { useState } from 'react'

import { KitShirt } from '@/components/kit/KitShirt'
import { KitStrip } from '@/components/kit/KitStrip'
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
 * בית החולצות — the rack first, the controls second.
 *
 * The previous version opened on a blank red shirt and five tabs of vocabulary, and
 * Maor's verdict was the right one: not fun, doesn't flow. A designer that opens empty
 * makes you do the work of imagining before you get to play. This one opens on a rack
 * of eight real Hapoel kits from the references he sent — one tap puts אתא 1978 on the
 * screen, white sleeves and all, and from there every control is a nudge on something
 * that already looks like something.
 *
 * Two other things do most of the "flow": the strip redraws on every single tap with no
 * commit step, and הגרל pulls a whole random kit out of the stack, which is the button
 * people actually press first.
 */

const TABS = [
  { key: 'rack', he: 'kit.tab.rack' },
  { key: 'base', he: 'kit.tab.base' },
  { key: 'pattern', he: 'kit.tab.pattern' },
  { key: 'sleeves', he: 'kit.tab.sleeves' },
  { key: 'collar', he: 'kit.tab.collar' },
  { key: 'nameset', he: 'kit.tab.nameset' },
] as const

const COLOURS: KitColour[] = ['red', 'cream', 'ink', 'paper', 'navy', 'deep']

function randomOf<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}

export function KitDesigner({
  rack,
  seed = 1,
}: {
  /** the club's real kits, newest first — the rack the screen opens on */
  rack: { seasonLabel: string; noteHe: string; spec: KitSpec }[]
  seed?: number
}) {
  const [spec, setSpec] = useState<KitSpec>(rack[0]?.spec ?? DEFAULT_SPEC)
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('rack')
  const [flash, setFlash] = useState(0)

  function set<K extends keyof KitSpec>(key: K, value: KitSpec[K]) {
    setSpec((current) => ({ ...current, [key]: value }))
    setFlash((n) => n + 1)
  }

  function apply(patch: Partial<KitSpec>) {
    setSpec((current) => ({ ...current, ...patch }))
    setFlash((n) => n + 1)
  }

  function roll() {
    apply({
      base: randomOf(COLOURS),
      pattern: randomOf(PATTERNS).id,
      patternInk: randomOf(COLOURS),
      sleeves: randomOf(SLEEVES).id,
      sleeveInk: randomOf(COLOURS),
      collar: randomOf(COLLARS).id,
      collarInk: randomOf(COLOURS),
      nameset: randomOf(NAMESETS).id,
      shorts: randomOf(COLOURS),
      socks: randomOf(COLOURS),
      number: randomOf([7, 9, 10, 11, 12, 14]),
    })
  }

  return (
    <section className="mt-stack border-rule border-ink bg-sheet">
      <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink bg-ink px-4 py-2.5">
        <p className="font-display text-step-1 leading-none text-paper">{t('kit.designer')}</p>
        <p className="font-latin text-[9px] font-bold tracking-[0.2em] text-red" dir="ltr">
          8 LAYERS
        </p>
      </div>

      {/* the strip, on its own sheet, redrawing on every tap */}
      <div className="border-b-hair border-ink/30 bg-paper p-4">
        <div key={flash} className="mx-auto max-w-[230px] animate-slam">
          <KitStrip spec={spec} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="min-w-0 flex-1 font-mono text-[11px] tabular-nums text-muted">
            <bdi dir="ltr">{spec.seasonLabel}</bdi>
          </p>
          <button
            type="button"
            onClick={roll}
            className="min-h-tap border-hair border-ink px-3 font-body text-step--1 font-extrabold text-ink transition-transform duration-press ease-stamp active:scale-[.95] motion-reduce:transition-none"
          >
            {t('kit.roll')}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div
          role="tablist"
          aria-label={t('kit.designer')}
          className="-mx-1 flex gap-1 overflow-x-auto border-b-hair border-ink/40 px-1 pb-2"
        >
          {TABS.map((item) => (
            <button
              key={item.key}
              role="tab"
              type="button"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`min-h-tap shrink-0 px-3 font-body text-step--1 font-extrabold transition-colors duration-press ${
                tab === item.key ? 'bg-red text-paper' : 'text-ink'
              }`}
            >
              {t(item.he as MessageKey)}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {tab === 'rack' && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {rack.map((kit) => (
                <button
                  key={kit.seasonLabel}
                  type="button"
                  onClick={() => apply(kit.spec)}
                  className={`min-h-tap border-hair bg-paper p-1.5 transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                    spec.seasonLabel === kit.seasonLabel ? 'border-red bg-red/[.08]' : 'border-ink/40'
                  }`}
                >
                  <KitShirt
                    spec={{ ...kit.spec, number: null }}
                    className="mx-auto block w-full max-w-[62px]"
                    title={kit.seasonLabel}
                  />
                  <span className="mt-1 block font-mono text-[10px] tabular-nums leading-tight text-ink">
                    <bdi dir="ltr">{kit.seasonLabel}</bdi>
                  </span>
                </button>
              ))}
            </div>
          )}

          {tab === 'base' && (
            <>
              <Label>{t('kit.tab.base')}</Label>
              <Swatches value={spec.base} onPick={(colour) => set('base', colour)} />
              <Label>{t('kit.secondInk')}</Label>
              <Swatches value={spec.patternInk} onPick={(colour) => set('patternInk', colour)} />
              <Label>{t('kit.shorts')}</Label>
              <Swatches value={spec.shorts} onPick={(colour) => set('shorts', colour)} />
              <Label>{t('kit.socks')}</Label>
              <Swatches value={spec.socks} onPick={(colour) => set('socks', colour)} />
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
                  className={`min-h-tap border-hair p-1.5 transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
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
              <Chips items={SLEEVES} value={spec.sleeves} onPick={(value) => set('sleeves', value)} />
              <Label>{t('kit.sleeveInk')}</Label>
              <Swatches value={spec.sleeveInk} onPick={(colour) => set('sleeveInk', colour)} />
            </>
          )}

          {tab === 'collar' && (
            <>
              <Chips items={COLLARS} value={spec.collar} onPick={(value) => set('collar', value)} />
              <Label>{t('kit.collarInk')}</Label>
              <Swatches value={spec.collarInk} onPick={(colour) => set('collarInk', colour)} />
            </>
          )}

          {tab === 'nameset' && (
            <>
              <Chips items={NAMESETS} value={spec.nameset} onPick={(value) => set('nameset', value)} />
              <Label>{t('kit.number')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {[7, 9, 10, 11, 12, 14].map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => set('number', number)}
                    aria-pressed={spec.number === number}
                    className={`min-h-tap w-12 border-hair font-poster text-[22px] transition-transform duration-press ease-stamp active:scale-[.94] motion-reduce:transition-none ${
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

        <ShareRow
          kind="kit"
          params={{ s: String(seed), total: '8' }}
          headline={t('kit.designer')}
          card={{
            template: 'kit' as const,
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
            kit: spec,
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

function Swatches({ value, onPick }: { value: KitColour; onPick: (colour: KitColour) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOURS.map((colour) => (
        <button
          key={colour}
          type="button"
          onClick={() => onPick(colour)}
          aria-label={COLOUR_NAME[colour]}
          aria-pressed={value === colour}
          className={`min-h-tap w-12 border-rule transition-transform duration-press ease-stamp active:scale-[.94] motion-reduce:transition-none ${
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
          className={`min-h-tap border-hair px-3 font-body text-step--1 transition-transform duration-press ease-stamp active:scale-[.95] motion-reduce:transition-none ${
            value === item.id ? 'border-red bg-red text-paper' : 'border-ink/40 text-ink'
          }`}
        >
          {item.he}
        </button>
      ))}
    </div>
  )
}
