'use client'

import { useState } from 'react'

import { KitPreview } from '@/components/ui/KitPreview'
import { t, type MessageKey } from '@/lib/i18n'
import type { KitCollar, KitComponent, KitPattern, KitSpec } from '@/lib/game/kits'

/**
 * עיצוב החולצות — jersey, shorts and socks, each with its own base, secondary,
 * accent and pattern, following the KitDesign schema. The output is the same spec the
 * archive stores a historical kit in, so a design made here is directly comparable to
 * a reconstructed one.
 */

type Piece = 'jersey' | 'shorts' | 'socks'

const PIECES: Array<{ key: Piece; label: MessageKey }> = [
  { key: 'jersey', label: 'kit.piece.jersey' },
  { key: 'shorts', label: 'kit.piece.shorts' },
  { key: 'socks', label: 'kit.piece.socks' },
]

const PATTERNS: Array<{ value: KitPattern; label: MessageKey }> = [
  { value: 'solid', label: 'kit.pattern.solid' },
  { value: 'stripes_vertical', label: 'kit.pattern.stripesV' },
  { value: 'stripes_horizontal', label: 'kit.pattern.stripesH' },
  { value: 'chevron', label: 'kit.pattern.chevron' },
  { value: 'checkered', label: 'kit.pattern.checkered' },
  { value: 'sash', label: 'kit.pattern.sash' },
]

const COLLARS: Array<{ value: KitCollar; label: MessageKey }> = [
  { value: 'crew', label: 'kit.collar.crew' },
  { value: 'v', label: 'kit.collar.v' },
  { value: 'polo', label: 'kit.collar.polo' },
]

const LAYERS: Array<{ key: keyof KitComponent; label: MessageKey }> = [
  { key: 'base', label: 'kit.base' },
  { key: 'secondary', label: 'kit.secondary' },
  { key: 'accent', label: 'kit.accent' },
]

export function KitDesigner({
  colours,
  colourNames,
  fallback,
  initial,
}: {
  colours: Record<string, string>
  colourNames: string[]
  fallback: string
  initial: KitSpec
}) {
  const [spec, setSpec] = useState<KitSpec>(initial)
  const [piece, setPiece] = useState<Piece>('jersey')

  const resolve = (name: string) => colours[name] ?? colours[fallback] ?? ''
  const current = spec[piece]

  const setLayer = (layer: keyof KitComponent, value: string) =>
    setSpec((s) => ({ ...s, [piece]: { ...s[piece], [layer]: value } }))

  const resolved = (component: KitComponent) => ({
    base: resolve(component.base),
    secondary: resolve(component.secondary),
    accent: resolve(component.accent),
    pattern: component.pattern,
  })

  return (
    <div className="mt-stack grid grid-cols-1 gap-stack md:grid-cols-[260px_1fr]">
      <div className="flex justify-center border-rule border-ink bg-sheet p-3">
        <KitPreview
          jersey={resolved(spec.jersey)}
          shorts={resolved(spec.shorts)}
          socks={resolved(spec.socks)}
          collar={spec.collar}
          longSleeve={spec.longSleeve}
          number={spec.number}
          numberColour={resolve(spec.numberColour)}
          label={t('kit.preview')}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div role="tablist" aria-label={t('kit.piece')} className="grid grid-cols-3 gap-2">
          {PIECES.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={piece === option.key}
              onClick={() => setPiece(option.key)}
              className={`min-h-tap border-rule px-2 font-sign text-[14px] transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                piece === option.key ? 'border-red bg-red text-sheet' : 'border-ink text-ink'
              }`}
            >
              {t(option.label)}
            </button>
          ))}
        </div>

        {LAYERS.map((layer) => (
          <fieldset key={layer.key} className="border-rule border-ink p-3">
            <legend className="px-1 font-body text-[11px] font-extrabold tracking-widest text-muted">
              {t(layer.label)}
            </legend>
            <div className="flex flex-wrap gap-2">
              {colourNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setLayer(layer.key, name)}
                  aria-pressed={current[layer.key] === name}
                  aria-label={`${t(layer.label)} ${name}`}
                  className={`flex min-h-tap items-center gap-2 border-rule px-3 font-body text-[13px] transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                    current[layer.key] === name ? 'border-red text-red' : 'border-ink text-ink'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="block h-5 w-5 border-hair border-ink"
                    style={{ background: colours[name] }}
                  />
                  {name}
                </button>
              ))}
            </div>
          </fieldset>
        ))}

        <fieldset className="border-rule border-ink p-3">
          <legend className="px-1 font-body text-[11px] font-extrabold tracking-widest text-muted">
            {t('kit.pattern')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {PATTERNS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSpec((s) => ({ ...s, [piece]: { ...s[piece], pattern: option.value } }))}
                aria-pressed={current.pattern === option.value}
                className={`min-h-tap border-rule px-3 font-body text-[13px] transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                  current.pattern === option.value ? 'border-red text-red' : 'border-ink text-ink'
                }`}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="border-rule border-ink p-3">
          <legend className="px-1 font-body text-[11px] font-extrabold tracking-widest text-muted">
            {t('kit.collar')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {COLLARS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSpec((s) => ({ ...s, collar: option.value }))}
                aria-pressed={spec.collar === option.value}
                className={`min-h-tap border-rule px-3 font-body text-[13px] transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                  spec.collar === option.value ? 'border-red text-red' : 'border-ink text-ink'
                }`}
              >
                {t(option.label)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSpec((s) => ({ ...s, longSleeve: !s.longSleeve }))}
              aria-pressed={spec.longSleeve}
              className={`min-h-tap border-rule px-3 font-body text-[13px] transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                spec.longSleeve ? 'border-red text-red' : 'border-ink text-ink'
              }`}
            >
              {t('kit.longSleeve')}
            </button>
          </div>
        </fieldset>

        <label className="flex min-h-tap items-center gap-3 border-rule border-ink px-3">
          <span className="font-body text-[11px] font-extrabold tracking-widest text-muted">
            {t('kit.number')}
          </span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={spec.number}
            onChange={(event) =>
              setSpec((s) => ({ ...s, number: event.target.value.replace(/\D/g, '').slice(0, 2) }))
            }
            className="w-16 border-none bg-transparent font-mono text-step-1 tabular-nums text-ink outline-none"
          />
        </label>
      </div>
    </div>
  )
}
