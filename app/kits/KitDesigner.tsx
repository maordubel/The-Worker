'use client'

import { useState } from 'react'

import { Shirt } from '@/components/ui/Shirt'
import { t, type MessageKey } from '@/lib/i18n'
import type { KitCollar, KitPattern, KitSpec } from '@/lib/game/kits'

/**
 * עיצוב החולצות — the player builds a kit from the same spec the archive stores,
 * so a design made here is the shape a historical kit is reconstructed in.
 */

const PATTERNS: Array<{ value: KitPattern; label: MessageKey }> = [
  { value: 'solid', label: 'kit.pattern.solid' },
  { value: 'stripes', label: 'kit.pattern.stripes' },
  { value: 'hoops', label: 'kit.pattern.hoops' },
  { value: 'sash', label: 'kit.pattern.sash' },
]

const COLLARS: Array<{ value: KitCollar; label: MessageKey }> = [
  { value: 'crew', label: 'kit.collar.crew' },
  { value: 'v', label: 'kit.collar.v' },
  { value: 'polo', label: 'kit.collar.polo' },
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

  const set = <K extends keyof KitSpec>(key: K, value: KitSpec[K]) =>
    setSpec((current) => ({ ...current, [key]: value }))

  const resolve = (name: string) => colours[name] ?? colours[fallback] ?? ''

  return (
    <div className="mt-stack grid grid-cols-1 gap-stack md:grid-cols-[220px_1fr]">
      <div className="flex justify-center border-rule border-ink bg-sheet p-3">
        <Shirt
          primary={resolve(spec.primary)}
          secondary={resolve(spec.secondary)}
          detail={resolve(spec.detail)}
          pattern={spec.pattern}
          collar={spec.collar}
          longSleeve={spec.longSleeve}
          number={spec.number}
          label={t('kit.preview')}
        />
      </div>

      <div className="flex flex-col gap-3">
        {(['primary', 'secondary', 'detail'] as const).map((slot) => (
          <fieldset key={slot} className="border-rule border-ink p-3">
            <legend className="px-1 font-body text-[11px] font-extrabold tracking-widest text-muted">
              {t(`kit.${slot}` as MessageKey)}
            </legend>
            <div className="flex flex-wrap gap-2">
              {colourNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => set(slot, name)}
                  aria-pressed={spec[slot] === name}
                  className={`flex min-h-tap items-center gap-2 border-rule px-3 font-body text-[12px] ${
                    spec[slot] === name ? 'border-red text-red' : 'border-ink text-ink'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="block h-4 w-4 border-hair border-ink"
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
                onClick={() => set('pattern', option.value)}
                aria-pressed={spec.pattern === option.value}
                className={`min-h-tap border-rule px-3 font-body text-[12px] ${
                  spec.pattern === option.value ? 'border-red text-red' : 'border-ink text-ink'
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
                onClick={() => set('collar', option.value)}
                aria-pressed={spec.collar === option.value}
                className={`min-h-tap border-rule px-3 font-body text-[12px] ${
                  spec.collar === option.value ? 'border-red text-red' : 'border-ink text-ink'
                }`}
              >
                {t(option.label)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => set('longSleeve', !spec.longSleeve)}
              aria-pressed={spec.longSleeve}
              className={`min-h-tap border-rule px-3 font-body text-[12px] ${
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
            maxLength={2}
            value={spec.number}
            onChange={(event) => set('number', event.target.value.replace(/\D/g, '').slice(0, 2))}
            className="w-16 border-none bg-transparent font-mono text-step-1 tabular-nums text-ink outline-none"
          />
        </label>
      </div>
    </div>
  )
}
