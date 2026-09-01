import Link from 'next/link'

import { Num } from '@/components/ui/Num'
import { t } from '@/lib/i18n'
import type { Gate } from '@/lib/gates'

/**
 * לוחית השער — one gate, printed.
 *
 * Anatomy, top to bottom, straight off the design:
 *   1. a bilingual header strip — GATE on one side, שער on the other, same weight,
 *      because neither language is the translation of the other here
 *   2. the number well, where the gate number is the largest thing on the plate
 *   3. an ink foot carrying the Hebrew name and the Latin line
 *
 * The number is printed TWICE: the navy plate first, shifted 3px right and down, then
 * the vermilion plate on top, both multiplying. The dark edge you see is not a shadow
 * and not a third colour — it is the two inks overlapping, which is the one thing that
 * makes a two-plate print look printed.
 */
export function GatePlate({ gate }: { gate: Gate }) {
  const away = gate.plate === 'away'
  const curva = gate.plate === 'curva'

  return (
    <Link
      href={gate.href}
      aria-label={`${t('gate.aria')} ${gate.number} — ${t(gate.title)}`}
      className={`group relative block overflow-hidden border-hair border-ink transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none ${
        away ? 'bg-sign/[.07]' : 'bg-sheet'
      } ${curva ? 'sm:col-span-2' : ''}`}
    >
      <div className={`pointer-events-none absolute inset-0 stain-${gate.stain}`} aria-hidden="true" />

      {/* 1 · the bilingual plate. It sits on solid paper so the sunburst behind the
          number cannot run up under the lettering — a plate is printed over the field,
          not through it. */}
      <div className={`relative flex items-baseline justify-between border-b-hair border-ink px-3 py-1.5 ${
        away ? 'bg-sign/[.04]' : 'bg-sheet'
      }`}>
        <span className="font-latin text-[9px] font-bold tracking-[0.2em] text-sign" dir="ltr">
          {curva ? 'GATE · THE CURVA' : 'GATE'}
        </span>
        <span className="font-display text-[13px] text-sign">{t('gate.word')}</span>
      </div>

      {/* 2 · the number well */}
      <div
        className={`relative flex items-center justify-center ${curva ? 'h-[168px]' : 'h-[126px]'}`}
      >
        {/* rays — gates 2, 5 and 8 only, never on the away end */}
        {(gate.plate === 'rays' || curva) && (
          <div
            aria-hidden="true"
            // Centred with inset-x-0 + mx-auto rather than a physical half-offset: a
            // sunburst has no start and no end, and this codebase forbids physical
            // direction utilities outright — including inside a comment, it turns out.
            className={`rays pointer-events-none absolute inset-x-0 top-1/2 mx-auto -translate-y-1/2 ${
              curva ? 'h-[420px] w-[420px] opacity-25' : 'h-[240px] w-[240px] opacity-[.22]'
            }`}
          />
        )}

        {/* the ranks marching away — they recede upward and shrink, which is
            perspective and not decoration */}
        <Ranks away={away} />

        <span
          aria-hidden="true"
          className={`plate-shift absolute font-poster leading-none text-sign ${
            curva ? 'text-[130px]' : 'text-[96px]'
          }`}
        >
          <Num>{gate.number}</Num>
        </span>
        <span
          className={`plate-top relative font-poster leading-none ${
            away ? 'text-sign' : 'text-red'
          } ${curva ? 'text-[130px]' : 'text-[96px]'}`}
        >
          <Num>{gate.number}</Num>
        </span>
      </div>

      {/* gate 5 gets the flag; nobody else does */}
      {curva && gate.callHe && (
        <div className="relative mx-3 mb-2 flex h-8 items-center justify-center">
          <div aria-hidden="true" className="flag absolute inset-0" />
          <span className="relative font-poster text-[19px] tracking-[0.28em] text-paper">
            {t(gate.callHe)}
          </span>
        </div>
      )}

      {/* 3 · the ink foot */}
      <div className="relative bg-ink px-3 pb-3 pt-2">
        <div className="font-display text-[17px] leading-tight text-paper">{t(gate.title)}</div>
        <div
          className="mt-1 font-latin text-[8.5px] font-semibold tracking-[0.16em] text-concrete"
          dir="ltr"
        >
          {gate.latin}
        </div>
      </div>
    </Link>
  )
}

/**
 * שורות הצועדים — ranks of marchers, drawn as a repeating silhouette.
 *
 * A row further back is shorter, tighter and fainter. That is the only reason the
 * rows exist: they put the crowd behind the number without a photograph.
 */
function Ranks({ away = false }: { away?: boolean }) {
  const ink = away ? 'var(--sign)' : 'var(--ink)'
  // One marcher: head, shoulders, body. Repeated along the row by background-repeat.
  const figure = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='46' viewBox='0 0 30 46'>
       <g fill='rgb(${ink.replace('var(--sign)', '30,44,90').replace('var(--ink)', '21,18,14')})'>
         <circle cx='15' cy='9' r='6'/>
         <path d='M6 46 V22 q0-6 9-6 t9 6 v24 z'/>
       </g>
     </svg>`.replace(/\s+/g, ' '),
  )}")`

  // Each rank further back is shorter, tighter, fainter — and offset by half a
  // figure, so the rows read as a crowd rather than as a picket fence.
  const rows = [
    { bottom: 0, height: 44, size: '30px 46px', opacity: away ? 0.42 : 0.3, shift: '0' },
    { bottom: 30, height: 30, size: '21px 32px', opacity: away ? 0.26 : 0.19, shift: '10px' },
    { bottom: 52, height: 20, size: '15px 22px', opacity: away ? 0.17 : 0.12, shift: '4px' },
  ]

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0">
      {rows.map((row) => (
        <div
          key={row.bottom}
          className="absolute inset-x-0"
          style={{
            bottom: row.bottom,
            height: row.height,
            opacity: row.opacity,
            backgroundImage: figure,
            backgroundRepeat: 'repeat-x',
            backgroundSize: row.size,
            backgroundPosition: `${row.shift} bottom`,
          }}
        />
      ))}
    </div>
  )
}
