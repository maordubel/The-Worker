import { useId } from 'react'

import {
  COLOUR_VAR,
  type CollarId,
  type KitColour,
  type KitSpec,
  type PatternId,
  type SleeveId,
} from '@/lib/kit/spec'

/**
 * החולצה — the eight-layer shirt, rendered as SVG from one spec object.
 *
 * Straight off the Kit Builder handoff, including its exact outline and clip paths.
 * There is not one image file in here: every season, real or invented, is the same
 * geometry with different fills, which is the only way 102 seasons can be drawn at all.
 *
 * The ids are scoped with `useId` because a page shows a dozen of these at once and
 * SVG ids are global to the document — two racks sharing a `#kBody` is how a gallery
 * silently renders eleven identical shirts.
 */

const OUTLINE =
  'M78 20 L62 24 L18 48 L6 96 L46 110 L54 92 L54 214 L146 214 L146 92 L154 110 L194 96 L182 48 L138 24 L122 20 C116 34 84 34 78 20 Z'
const BODY = 'M62 24 L54 92 L54 214 L146 214 L146 92 L138 24 L122 20 C116 34 84 34 78 20 Z'
const SLEEVE_L = 'M62 24 L18 48 L6 96 L46 110 L54 92 Z'
const SLEEVE_R = 'M138 24 L182 48 L194 96 L154 110 L146 92 Z'

export function KitShirt({
  spec,
  className = '',
  /** slots the player has to fill in, drawn as a navy dashed box instead of content */
  missing = [],
  title,
}: {
  spec: KitSpec
  className?: string
  missing?: ('sponsor' | 'maker' | 'crest')[]
  title?: string
}) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${name}-${uid}`
  const base = COLOUR_VAR[spec.base]
  const ink = COLOUR_VAR[spec.patternInk]
  const sleeve = COLOUR_VAR[spec.sleeveInk]
  const collar = COLOUR_VAR[spec.collarInk]

  return (
    <svg viewBox="0 0 200 240" className={className} role="img" aria-label={title ?? spec.seasonLabel}>
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={id('all')}>
          <path d={OUTLINE} />
        </clipPath>
        <clipPath id={id('body')}>
          <path d={BODY} />
        </clipPath>
        <clipPath id={id('sl')}>
          <path d={SLEEVE_L} />
        </clipPath>
        <clipPath id={id('sr')}>
          <path d={SLEEVE_R} />
        </clipPath>
        <Pattern id={id('pat')} pattern={spec.pattern} base={base} ink={ink} />
      </defs>

      {/* 1 · base */}
      <g clipPath={`url(#${id('all')})`}>
        <rect width="200" height="240" fill={base} />
      </g>

      {/* 2 · the cut, on the body only — a pattern that runs into the sleeve reads as
              wallpaper rather than as a shirt */}
      <g clipPath={`url(#${id('body')})`}>
        <PatternFill id={id('pat')} pattern={spec.pattern} base={base} ink={ink} />
      </g>

      {/* 3 · sleeves */}
      <g clipPath={`url(#${id('sl')})`}>
        <SleeveFill treatment={spec.sleeves} ink={sleeve} base={base} side="l" />
      </g>
      <g clipPath={`url(#${id('sr')})`}>
        <SleeveFill treatment={spec.sleeves} ink={sleeve} base={base} side="r" />
      </g>

      {/* 4 · collar */}
      <Collar type={spec.collar} ink={collar} base={base} />

      {/* 5 · crest, chest right — the real one, from the era the shirt belongs to.
             The old slot drew a circle and two strokes that were meant to suggest the
             worker figure and did not look like anything. A club crest is not a thing to
             approximate: either print the crest or leave the slot empty. */}
      {missing.includes('crest') ? (
        <DashBox x={112} y={32} w={28} h={28} />
      ) : spec.crestKey ? (
        <image
          href={`/brand/crests/${spec.crestKey}.png`}
          x="110"
          y="30"
          width="32"
          height="34"
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}

      {/* 6 · maker, chest left */}
      {missing.includes('maker') ? (
        <DashBox x={58} y={42} w={30} h={13} />
      ) : (
        spec.makerHe && (
          <text
            x="73"
            y="53"
            textAnchor="middle"
            fill={COLOUR_VAR.ink}
            className="font-latin"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}
          >
            {spec.makerHe}
          </text>
        )
      )}

      {/* 7 · sponsor, centre chest */}
      {missing.includes('sponsor') ? (
        <DashBox x={58} y={112} w={84} h={36} mark="?" />
      ) : (
        spec.sponsorHe && (
          // Lettered straight onto the shirt, not stamped inside a black plate. Every
          // reference shows the sponsor printed on the fabric — אתא is white letters on
          // red, not a box — and the black slab made every shirt in the rack look like
          // the same shirt with a different label stuck on it.
          <text
            x="100"
            y="140"
            textAnchor="middle"
            fill={
              spec.base === 'cream' || spec.base === 'paper' ? COLOUR_VAR.red : COLOUR_VAR.cream
            }
            className="font-poster"
            style={{ fontSize: sponsorSize(spec.sponsorHe) }}
          >
            {spec.sponsorHe}
          </text>
        )
      )}

      {/* 8 · the number */}
      {spec.number !== null && (
        <Number value={spec.number} nameset={spec.nameset} base={spec.base} />
      )}

      <path d={OUTLINE} fill="none" stroke={COLOUR_VAR.ink} strokeWidth="2.4" />
    </svg>
  )
}

/** Long names shrink so the whole word stays on the chest. */
function sponsorSize(text: string): number {
  if (text.length <= 4) return 30
  if (text.length <= 7) return 24
  if (text.length <= 10) return 18
  return 15
}

function DashBox({
  x,
  y,
  w,
  h,
  mark,
}: {
  x: number
  y: number
  w: number
  h: number
  mark?: string
}) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke={COLOUR_VAR.navy}
        strokeWidth="2.4"
        strokeDasharray="5 4"
      />
      {mark && (
        <text
          x={x + w / 2}
          y={y + h * 0.72}
          textAnchor="middle"
          fill={COLOUR_VAR.navy}
          className="font-poster"
          style={{ fontSize: 26 }}
        >
          {mark}
        </text>
      )}
    </>
  )
}

/** The pattern library, as `<pattern>` defs. One def per cut, exactly as specified. */
function Pattern({
  id,
  pattern,
  base,
  ink,
}: {
  id: string
  pattern: PatternId
  base: string
  ink: string
}) {
  switch (pattern) {
    case 'stripe-wide':
      return (
        <pattern id={id} width="26" height="10" patternUnits="userSpaceOnUse">
          <rect width="26" height="10" fill={base} />
          <rect width="13" height="10" fill={ink} />
        </pattern>
      )
    case 'pinstripe':
      return (
        <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill={base} />
          <rect width="3" height="10" fill={ink} />
        </pattern>
      )
    case 'hoop-tonal':
      return (
        <pattern id={id} width="10" height="20" patternUnits="userSpaceOnUse">
          <rect width="10" height="20" fill={base} />
          <rect width="10" height="9" fill={ink} />
        </pattern>
      )
    case 'jacquard':
      return (
        <pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill={base} />
          <path d="M10 2 L18 10 L10 18 L2 10 Z" fill="none" stroke={ink} strokeWidth="2.4" />
        </pattern>
      )
    case 'chevron':
      return (
        <pattern id={id} width="18" height="12" patternUnits="userSpaceOnUse">
          <rect width="18" height="12" fill={base} />
          <path
            d="M0 10 L4.5 3 L9 10 L13.5 3 L18 10"
            fill="none"
            stroke={ink}
            strokeWidth="2.2"
          />
        </pattern>
      )
    case 'grid-tonal':
      return (
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill={base} />
          <path
            d="M0 0 H16 M0 8 H16 M0 0 V16 M8 0 V16"
            stroke={ink}
            strokeWidth="1.6"
            fill="none"
          />
        </pattern>
      )
    case 'gradient':
      return (
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ink} />
          <stop offset=".55" stopColor={ink} />
          <stop offset="1" stopColor={base} />
        </linearGradient>
      )
    default:
      return null
  }
}

/** Cuts that are shapes rather than repeats are drawn directly. */
function PatternFill({
  id,
  pattern,
  base,
  ink,
}: {
  id: string
  pattern: PatternId
  base: string
  ink: string
}) {
  switch (pattern) {
    case 'solid':
      return null
    case 'sash':
      return <path d="M40 240 L150 0 L196 0 L86 240 Z" fill={ink} />
    case 'yoke-v':
      return <path d="M54 20 L100 96 L146 20 L146 44 L100 118 L54 44 Z" fill={ink} />
    case 'side-panel':
      return (
        <>
          <rect x="54" width="16" height="240" fill={ink} />
          <rect x="130" width="16" height="240" fill={ink} />
        </>
      )
    case 'halves':
      return <rect x="100" width="100" height="240" fill={ink} />
    // — the four cuts read off the season photographs —
    case 'chest-band':
      // 2002/03: one band across the chest with the sponsor inside it
      return (
        <>
          <rect y="56" width="200" height="34" fill={ink} />
          <rect y="52" width="200" height="4" fill={COLOUR_VAR.ink} opacity=".25" />
        </>
      )
    case 'quarters':
      // the Diadora shirt: red panels on a white ground, quartered
      return (
        <>
          <rect x="0" y="0" width="72" height="86" fill={ink} />
          <rect x="128" y="0" width="72" height="86" fill={ink} />
          <rect x="0" y="150" width="72" height="90" fill={ink} />
          <rect x="128" y="150" width="72" height="90" fill={ink} />
        </>
      )
    case 'diagonal':
      // the adidas shirt: fine diagonals across the whole body
      return (
        <g stroke={ink} strokeWidth="1.6" fill="none">
          {Array.from({ length: 16 }, (_, index) => (
            <path key={index} d={`M${-120 + index * 26} 240 L${60 + index * 26} 0`} />
          ))}
        </g>
      )
    case 'twin-stripe':
      // 1999/2000: two stripes down the front, nothing else
      return (
        <>
          <rect x="72" width="11" height="240" fill={ink} />
          <rect x="117" width="11" height="240" fill={ink} />
        </>
      )
    case 'shoulder-panel':
      // 2011/12 and 2020/21: a panel across both shoulders
      return <path d="M54 20 H146 L146 62 Q100 78 54 62 Z" fill={ink} />
    default:
      return <rect width="200" height="240" fill={`url(#${id})`} />
  }
}

function SleeveFill({
  treatment,
  ink,
  base,
  side,
}: {
  treatment: SleeveId
  ink: string
  base: string
  side: 'l' | 'r'
}) {
  const flip = side === 'r' ? 'translate(200 0) scale(-1 1)' : undefined
  switch (treatment) {
    case 'raglan':
      return <rect width="200" height="240" fill={ink} transform={flip} />
    case 'cuff':
      return (
        <g transform={flip}>
          <rect width="200" height="240" fill={base} />
          <path d="M6 96 L46 110 L42 124 L2 110 Z" fill={ink} />
        </g>
      )
    case 'shoulder-stripe':
      return (
        <g transform={flip}>
          <rect width="200" height="240" fill={base} />
          <path d="M56 20 L64 48 L28 66 L20 38 Z" fill={ink} />
          <path d="M44 30 L50 50 L22 64 L16 44 Z" fill={base} />
        </g>
      )
    case 'arc':
      return (
        <g transform={flip}>
          <rect width="200" height="240" fill={base} />
          <path d="M16 40 A 20 20 0 0 1 36 20" fill="none" stroke={ink} strokeWidth="4" />
        </g>
      )
    default:
      return <rect width="200" height="240" fill={base} transform={flip} />
  }
}

function Collar({ type, ink, base }: { type: CollarId; ink: string; base: string }) {
  switch (type) {
    case 'ringer':
      return <path d="M78 20 C84 34 116 34 122 20 L129 24 C121 45 79 45 71 24 Z" fill={ink} />
    case 'v-neck':
      return (
        <>
          <path d="M78 20 L100 48 L122 20 L128 23 L100 58 L72 23 Z" fill={ink} />
        </>
      )
    case 'polo':
      return (
        <>
          <path
            d="M76 18 L100 32 L124 18 L136 26 L108 46 L92 46 L64 26 Z"
            fill={ink}
            stroke={COLOUR_VAR.ink}
            strokeWidth="1.6"
          />
          <rect
            x="96"
            y="32"
            width="8"
            height="26"
            fill={ink}
            stroke={COLOUR_VAR.ink}
            strokeWidth="1.4"
          />
        </>
      )
    case 'laced':
      return (
        <>
          <path d="M78 20 C84 34 116 34 122 20 L127 23 C120 41 80 41 73 23 Z" fill={ink} />
          <path
            d="M92 36 L108 36 M92 44 L108 44 M92 52 L108 52"
            stroke={base}
            strokeWidth="1.8"
          />
        </>
      )
    default:
      return <path d="M78 20 C84 34 116 34 122 20 L128 24 C120 42 80 42 72 24 Z" fill={ink} />
  }
}

function Number({
  value,
  nameset,
  base,
}: {
  value: number
  nameset: KitSpec['nameset']
  base: KitColour
}) {
  const solid = base === 'cream' || base === 'paper' ? COLOUR_VAR.ink : COLOUR_VAR.cream
  const common = { x: 100, y: 202, textAnchor: 'middle' as const, className: 'font-poster' }
  if (nameset === 'block-hollow') {
    return (
      <text
        {...common}
        fill="none"
        stroke={solid}
        strokeWidth="2"
        style={{ fontSize: 46 }}
      >
        {value}
      </text>
    )
  }
  return (
    <text {...common} fill={solid} style={{ fontSize: nameset === 'condensed' ? 40 : 46 }}>
      {value}
    </text>
  )
}
