'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { KitAssemblyShirt } from '@/components/kit/KitAssemblyShirt'
import { KitShirt } from '@/components/kit/KitShirt'
import { ShareRow } from '@/components/share/ShareRow'
import { makerAssetFor, sponsorAssetFor } from '@/lib/kit/assembly'
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
import { recordDeed } from '@/lib/profile/store'
import { t, type MessageKey } from '@/lib/i18n'

const TABS = [
  { key: 'rack', he: 'kit.tab.rack' },
  { key: 'base', he: 'kit.tab.base' },
  { key: 'pattern', he: 'kit.tab.pattern' },
  { key: 'sleeves', he: 'kit.tab.sleeves' },
  { key: 'collar', he: 'kit.tab.collar' },
  { key: 'marks', he: 'kits.spec' },
  { key: 'nameset', he: 'kit.tab.nameset' },
] as const

const COLOURS: KitColour[] = ['red', 'cream', 'ink', 'paper', 'navy', 'deep']

function randomOf<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}

export function KitDesigner({
  rack,
}: {
  rack: { seasonLabel: string; noteHe: string; spec: KitSpec }[]
  seed?: number
}) {
  const first = rack[0]?.spec ?? DEFAULT_SPEC
  const [spec, setSpec] = useState<KitSpec>(first)
  const [historicalPreset, setHistoricalPreset] = useState(first.seasonLabel)
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('rack')
  const [flash, setFlash] = useState(0)
  const deeded = useRef(false)

  const sponsors = useMemo(
    () => [...new Set(rack.map((kit) => kit.spec.sponsorHe).filter((value): value is string => Boolean(value)))],
    [rack],
  )
  const makers = useMemo(
    () => [...new Set(rack.map((kit) => kit.spec.makerHe).filter((value): value is string => Boolean(value)))],
    [rack],
  )
  const crests = useMemo(
    () => [...new Set(rack.map((kit) => kit.spec.crestKey).filter((value): value is string => Boolean(value)))],
    [rack],
  )

  useEffect(() => {
    if (deeded.current || flash === 0) return
    deeded.current = true
    recordDeed('/kits')
  }, [flash])

  function touch(next: KitSpec) {
    setSpec(next)
    setHistoricalPreset('')
    setFlash((n) => n + 1)
  }

  function set<K extends keyof KitSpec>(key: K, value: KitSpec[K]) {
    touch({ ...spec, [key]: value })
  }

  function applyPreset(kit: { seasonLabel: string; spec: KitSpec }) {
    setSpec(kit.spec)
    setHistoricalPreset(kit.seasonLabel)
    setFlash((n) => n + 1)
  }

  function roll() {
    touch({
      ...spec,
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
      sponsorHe: randomOf([null, ...sponsors]),
      makerHe: randomOf([null, ...makers]),
      crestKey: randomOf([null, ...crests]),
    })
  }

  return (
    <section className="mt-stack border-rule border-ink bg-sheet">
      <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink bg-ink px-4 py-2.5">
        <p className="font-display text-step-1 leading-none text-paper">{t('kit.designer')}</p>
        <p className="font-latin text-[9px] font-bold tracking-[0.2em] text-red" dir="ltr">8 LAYERS</p>
      </div>

      <div className="border-b-hair border-ink/30 bg-paper p-4">
        <div key={flash} className="mx-auto flex min-h-[250px] max-w-[260px] items-center justify-center animate-slam">
          {historicalPreset === spec.seasonLabel ? (
            <KitAssemblyShirt
              spec={spec}
              historical
              className="block max-h-[250px] w-full"
              title={spec.seasonLabel}
            />
          ) : (
            <KitAssemblyShirt
              spec={spec}
              className="block max-h-[250px] w-full"
              title={spec.seasonLabel}
            />
          )}
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
                  onClick={() => applyPreset(kit)}
                  className={`min-h-tap border-hair bg-paper p-1.5 transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                    historicalPreset === kit.seasonLabel ? 'border-red bg-red/[.08]' : 'border-ink/40'
                  }`}
                >
                  <KitAssemblyShirt
                    spec={{ ...kit.spec, number: null }}
                    historical
                    className="mx-auto block h-[86px] w-full max-w-[72px]"
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
                  <span className="mt-1 block font-body text-[10px] leading-tight text-ink">{item.he}</span>
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

          {tab === 'marks' && (
            <>
              <Label>{t('kits.spec.sponsor')}</Label>
              <MarkGrid
                kind="sponsor"
                items={sponsors}
                value={spec.sponsorHe}
                onPick={(value) => set('sponsorHe', value)}
              />
              <Label>{t('kits.spec.maker')}</Label>
              <MarkGrid
                kind="maker"
                items={makers}
                value={spec.makerHe}
                onPick={(value) => set('makerHe', value)}
              />
              <Label>{t('kits.spec.crest')}</Label>
              <MarkGrid
                kind="crest"
                items={crests}
                value={spec.crestKey}
                onPick={(value) => set('crestKey', value)}
              />
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
                      spec.number === number ? 'border-red bg-red text-paper' : 'border-ink/40 text-ink'
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
          route="/kits"
          params={{ total: '8' }}
          headline={t('kit.designer')}
          card={{
            template: 'kit' as const,
            kicker: 'GATE 5 · KIT DESIGNER',
            label: t('screen.kits.title'),
            eyebrow: t('kit.designer'),
            hero: spec.seasonLabel,
            stats: [
              { k: t('kit.tab.pattern'), v: PATTERNS.find((p) => p.id === spec.pattern)?.he ?? '' },
              { k: t('kits.spec.sponsor'), v: spec.sponsorHe ?? t('kits.spec.none') },
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
  return <p className="mb-1.5 mt-3 font-body text-[10px] tracking-widest text-muted first:mt-0">{children}</p>
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

function MarkGrid({
  kind,
  items,
  value,
  onPick,
}: {
  kind: 'sponsor' | 'maker' | 'crest'
  items: string[]
  value: string | null
  onPick: (value: string | null) => void
}) {
  const choices: Array<string | null> = [null, ...items]
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {choices.map((item) => {
        const asset = kind === 'sponsor' ? sponsorAssetFor(item) : kind === 'maker' ? makerAssetFor(item) : null
        const src = asset?.src ?? (kind === 'crest' && item ? `/brand/crests/${item}.png` : null)
        const selected = value === item
        return (
          <button
            key={item ?? 'none'}
            type="button"
            onClick={() => onPick(item)}
            aria-pressed={selected}
            className={`flex min-h-[70px] flex-col items-center justify-center gap-1 border-hair bg-paper p-2 transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
              selected ? 'border-red bg-red/[.08]' : 'border-ink/40'
            }`}
          >
            {src ? <img src={src} alt="" aria-hidden="true" className="h-8 max-w-full object-contain" /> : null}
            <span className="block max-w-full truncate font-body text-[10px] font-bold text-ink">
              {item ?? t('kits.spec.none')}
            </span>
          </button>
        )
      })}
    </div>
  )
}
