/**
 * A kit rendered as flat SVG — no gradient, no shadow, no photograph.
 * Colours arrive as resolved values from the kit archive; this component never
 * chooses a colour of its own.
 */

export type ShirtProps = {
  primary: string
  secondary: string
  detail: string
  pattern: 'solid' | 'stripes' | 'hoops' | 'sash'
  collar: 'crew' | 'v' | 'polo'
  longSleeve: boolean
  number: string
  size?: number
  label: string
}

const BODY = 'M60 34 L100 20 L140 34 L152 30 L176 66 L150 84 L146 180 L54 180 L50 84 L24 66 L48 30 Z'
const BODY_LONG =
  'M60 34 L100 20 L140 34 L156 28 L188 96 L160 108 L150 84 L146 180 L54 180 L50 84 L40 108 L12 96 L44 28 Z'

export function Shirt({
  primary,
  secondary,
  detail,
  pattern,
  collar,
  longSleeve,
  number,
  size = 200,
  label,
}: ShirtProps) {
  const clipId = `shirt-clip-${pattern}-${collar}`

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label}>
      <defs>
        <clipPath id={clipId}>
          <path d={longSleeve ? BODY_LONG : BODY} />
        </clipPath>
      </defs>

      <path d={longSleeve ? BODY_LONG : BODY} fill={primary} stroke={detail} strokeWidth="3" />

      <g clipPath={`url(#${clipId})`}>
        {pattern === 'stripes' &&
          Array.from({ length: 5 }, (_, index) => (
            <rect key={index} x={38 + index * 26} y="0" width="13" height="200" fill={secondary} />
          ))}
        {pattern === 'hoops' &&
          Array.from({ length: 5 }, (_, index) => (
            <rect key={index} x="0" y={40 + index * 30} width="200" height="14" fill={secondary} />
          ))}
        {pattern === 'sash' && (
          <path d="M20 40 L70 0 L190 130 L140 170 Z" fill={secondary} />
        )}
      </g>

      {collar === 'crew' && (
        <path d="M78 26 A 24 18 0 0 0 122 26" fill="none" stroke={detail} strokeWidth="7" />
      )}
      {collar === 'v' && (
        <path d="M80 24 L100 48 L120 24" fill="none" stroke={detail} strokeWidth="7" />
      )}
      {collar === 'polo' && (
        <>
          <path d="M80 24 L100 46 L120 24" fill="none" stroke={detail} strokeWidth="7" />
          <path d="M88 22 L100 44 L112 22" fill="none" stroke={primary} strokeWidth="3" />
        </>
      )}

      <text
        x="100"
        y="132"
        textAnchor="middle"
        className="font-mono tabular-nums"
        style={{ fontWeight: 700, fontSize: 54, fill: detail }}
      >
        {number}
      </text>
    </svg>
  )
}
