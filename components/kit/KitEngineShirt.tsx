import { useId } from 'react'

import { MarkArtwork } from '@/components/kit/MarkArtwork'
import { kitAssemblyForSeason } from '@/lib/kit/assembly'
import { crestArt } from '@/lib/kit/crestMarks'
import { resolveKitConstruction } from '@/lib/kit/engine'
import { makerAssetForName, sponsorAssetForName } from '@/lib/kit/mark-library'
import { COLOUR_VAR, type CollarId, type KitSpec, type PatternId, type SleeveId } from '@/lib/kit/spec'

/**
 * The canonical editable shirt renderer.
 * Anatomy comes from a period body template; surface design never changes the garment
 * silhouette. This is intentionally shared by archive, Gate 4, Gate 5 and Rumble.
 */
export function KitEngineShirt({ spec, className = '', title }: { spec: KitSpec; className?: string; title?: string }) {
  const uid = useId().replace(/:/g, '')
  const construction = resolveKitConstruction(spec)
  const t = construction.template
  const base = COLOUR_VAR[spec.base]
  const secondary = COLOUR_VAR[spec.patternInk]
  const sleeve = COLOUR_VAR[spec.sleeveInk]
  const collar = COLOUR_VAR[spec.collarInk]
  const dark = !['paper', 'cream'].includes(spec.base)
  const maker = makerAssetForName(spec.makerHe, spec.seasonLabel)
  const sponsor = sponsorAssetForName(spec.sponsorHe)
  const assembly = kitAssemblyForSeason(spec.seasonLabel, spec.variant)
  const exactCrest = assembly && assembly.spec.crestKey === spec.crestKey ? assembly.parts.crest : null
  const crest = exactCrest ?? crestArt(spec.crestKey, dark)
  const clipBody = `body-${uid}`
  const clipAll = `all-${uid}`

  return (
    <span className={`relative inline-block ${className}`} style={{ aspectRatio: '360 / 420' }}>
      <svg viewBox={t.viewBox} className="absolute inset-0 h-full w-full" role="img" aria-label={title ?? spec.seasonLabel}>
        {title && <title>{title}</title>}
        <defs>
          <clipPath id={clipBody}><path d={t.bodyPath} /></clipPath>
          <clipPath id={clipAll}><path d={t.bodyPath} /><path d={t.leftSleevePath} /><path d={t.rightSleevePath} /></clipPath>
          <pattern id={`knit-${uid}`} width="7" height="7" patternUnits="userSpaceOnUse">
            <path d="M0 7L7 0M-2 2L2-2M5 9L9 5" stroke="rgb(var(--ink))" strokeWidth=".8" opacity=".055" />
          </pattern>
          <linearGradient id={`fold-${uid}`} x1="0" x2="1">
            <stop offset="0" stopColor="rgb(var(--ink))" stopOpacity=".12" />
            <stop offset=".17" stopColor="rgb(var(--ink))" stopOpacity="0" />
            <stop offset=".48" stopColor="rgb(var(--sheet))" stopOpacity=".08" />
            <stop offset=".82" stopColor="rgb(var(--ink))" stopOpacity="0" />
            <stop offset="1" stopColor="rgb(var(--ink))" stopOpacity=".1" />
          </linearGradient>
        </defs>

        <path d={t.leftSleevePath} fill={sleeve} stroke="rgb(var(--ink))" strokeOpacity=".48" strokeWidth="1.5" />
        <path d={t.rightSleevePath} fill={sleeve} stroke="rgb(var(--ink))" strokeOpacity=".48" strokeWidth="1.5" />
        <path d={t.bodyPath} fill={base} stroke="rgb(var(--ink))" strokeOpacity=".56" strokeWidth="1.7" />

        <g clipPath={`url(#${clipBody})`}>
          <PatternLayer id={spec.pattern} base={base} ink={secondary} />
        </g>

        <SleeveConstruction id={spec.sleeves} template={t} base={sleeve} ink={secondary} />

        <g clipPath={`url(#${clipAll})`}>
          <rect x="0" y="0" width="360" height="420" fill={`url(#knit-${uid})`} />
          <rect x="0" y="0" width="360" height="420" fill={`url(#fold-${uid})`} />
        </g>

        <CollarLayer id={spec.collar} cx={t.neck.cx} cy={t.neck.cy} width={t.neck.width} depth={t.neck.depth} ink={collar} base={base} />
        <CuffLayer id={spec.sleeves} left={t.cuffLeftPath} right={t.cuffRightPath} ink={collar} />
        {spec.number !== null && <FrontNumber value={spec.number} nameset={spec.nameset} dark={dark} />}

        <g fill="none" stroke="rgb(var(--ink))" strokeOpacity=".26" strokeWidth="1.1" strokeDasharray="3 3">
          <path d={t.leftSleeveSeam} /><path d={t.rightSleeveSeam} /><path d={t.hemPath} />
        </g>
      </svg>

      {crest && <img src={crest} alt="" aria-hidden="true" className="pointer-events-none absolute object-contain" style={placementStyle(construction.placements.crest)} />}
      {maker ? <span className="pointer-events-none absolute" style={placementStyle(construction.placements.maker)}><MarkArtwork asset={maker} invert={dark} className="h-full w-full" /></span> : null}
      {sponsor ? <span className="pointer-events-none absolute" style={placementStyle(construction.placements.sponsor)}><MarkArtwork asset={sponsor} className="h-full w-full" /></span> : spec.sponsorHe ? <TextMark text={spec.sponsorHe} dark={dark} style={placementStyle(construction.placements.sponsor)} /> : null}
    </span>
  )
}

function placementStyle(p: { x: number; y: number; w: number; h: number }) {
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%` }
}

function TextMark({ text, dark, style }: { text: string; dark: boolean; style: React.CSSProperties }) {
  return <span aria-hidden="true" className="pointer-events-none absolute flex items-center justify-center overflow-hidden whitespace-nowrap font-body text-[clamp(7px,2.2cqw,15px)] font-extrabold" style={{ ...style, color: dark ? 'rgb(var(--sheet))' : 'rgb(var(--ink))' }}>{text}</span>
}

function FrontNumber({ value, nameset, dark }: { value: number; nameset: KitSpec['nameset']; dark: boolean }) {
  const ink = dark ? 'rgb(var(--sheet))' : 'rgb(var(--ink))'
  const common = { x: 180, y: 330, textAnchor: 'middle' as const, className: 'font-poster' }
  if (nameset === 'block-hollow') {
    return <text {...common} fill="none" stroke={ink} strokeWidth="2.4" style={{ fontSize: 54 }}>{value}</text>
  }
  return <text {...common} fill={ink} style={{ fontSize: nameset === 'condensed' ? 48 : 54 }}>{value}</text>
}

function SleeveConstruction({ id, template, base, ink }: { id: SleeveId; template: ReturnType<typeof resolveKitConstruction>['template']; base: string; ink: string }) {
  if (id === 'raglan') return <g fill={ink}><path d={template.shoulderPanelLeft} /><path d={template.shoulderPanelRight} /></g>
  if (id === 'shoulder-stripe') return <g fill="none" stroke={ink} strokeWidth="4.5">{[0, 8, 16].flatMap((n) => [<path key={`l${n}`} d={template.leftSleeveSeam} transform={`translate(${-n * .25},${n * .55})`} />, <path key={`r${n}`} d={template.rightSleeveSeam} transform={`translate(${n * .25},${n * .55})`} />])}</g>
  if (id === 'arc') return <g fill="none" stroke={ink} strokeWidth="8" opacity=".9"><path d={template.cuffLeftPath} transform="translate(0,-18)" /><path d={template.cuffRightPath} transform="translate(0,-18)" /></g>
  return null
}

function CuffLayer({ id, left, right, ink }: { id: SleeveId; left: string; right: string; ink: string }) {
  if (id !== 'cuff' && id !== 'shoulder-stripe') return null
  return <g fill="none" stroke={ink} strokeWidth="8"><path d={left} /><path d={right} /></g>
}

function CollarLayer({ id, cx, cy, width, depth, ink, base }: { id: CollarId; cx: number; cy: number; width: number; depth: number; ink: string; base: string }) {
  const x0 = cx - width / 2
  const x1 = cx + width / 2
  if (id === 'v-neck') return <path d={`M${x0} ${cy} Q${cx} ${cy + depth * .75} ${x1} ${cy} L${x1 - 8} ${cy + 4} L${cx} ${cy + depth} L${x0 + 8} ${cy + 4}Z`} fill={ink} stroke="rgb(var(--ink))" strokeOpacity=".45" strokeWidth="1" />
  if (id === 'polo') return <g><path d={`M${x0 - 4} ${cy - 2} Q${cx} ${cy + depth * .75} ${x1 + 4} ${cy - 2} L${x1 - 3} ${cy + 18} L${cx} ${cy + depth + 7} L${x0 + 3} ${cy + 18}Z`} fill={ink} stroke="rgb(var(--ink))" strokeOpacity=".5" strokeWidth="1" /><path d={`M${cx} ${cy + depth * .65}V${cy + depth + 24}`} stroke="rgb(var(--ink))" strokeOpacity=".45" strokeWidth="1.4" /></g>
  if (id === 'laced') return <g><path d={`M${x0} ${cy} Q${cx} ${cy + depth * .7} ${x1} ${cy}`} fill="none" stroke={ink} strokeWidth="10" /><path d={`M${cx - 9} ${cy + 16}L${cx + 9} ${cy + 29}M${cx + 9} ${cy + 16}L${cx - 9} ${cy + 29}`} stroke={ink} strokeWidth="2.5" /></g>
  if (id === 'ringer') return <g><ellipse cx={cx} cy={cy + 3} rx={width / 2} ry={depth / 2} fill={ink} /><ellipse cx={cx} cy={cy + 4} rx={width / 2 - 8} ry={Math.max(5, depth / 2 - 7)} fill={base} /></g>
  return <g><ellipse cx={cx} cy={cy + 3} rx={width / 2} ry={depth / 2} fill={ink} /><ellipse cx={cx} cy={cy + 5} rx={width / 2 - 9} ry={Math.max(5, depth / 2 - 8)} fill={base} /></g>
}

function PatternLayer({ id, base, ink }: { id: PatternId; base: string; ink: string }) {
  if (id === 'solid') return null
  if (id === 'stripe-wide') return <g fill={ink}>{[92, 132, 172, 212, 252].map((x) => <rect key={x} x={x} y="35" width="20" height="360" />)}</g>
  if (id === 'pinstripe') return <g fill={ink}>{[104, 126, 148, 170, 192, 214, 236].map((x) => <rect key={x} x={x} y="35" width="3" height="360" />)}</g>
  if (id === 'twin-stripe') return <g fill={ink}><rect x="164" y="35" width="8" height="360" /><rect x="188" y="35" width="8" height="360" /></g>
  if (id === 'hoop-tonal') return <g fill={ink}>{[132, 198, 264].map((y) => <rect key={y} x="70" y={y} width="220" height="24" />)}</g>
  if (id === 'chest-band') return <g fill={ink}><rect x="65" y="160" width="230" height="48" /><rect x="65" y="151" width="230" height="4" /><rect x="65" y="214" width="230" height="4" /></g>
  if (id === 'sash') return <polygon points="100,72 132,58 262,354 229,365" fill={ink} />
  if (id === 'halves') return <rect x="180" y="35" width="130" height="360" fill={ink} />
  if (id === 'quarters') return <g fill={ink}><rect x="180" y="35" width="130" height="175" /><rect x="60" y="210" width="120" height="185" /></g>
  if (id === 'diagonal') return <g stroke={ink} strokeWidth="7" opacity=".8">{[-40,10,60,110,160,210,260].map((x) => <path key={x} d={`M${x} 390L${x + 165} 40`} />)}</g>
  if (id === 'side-panel') return <g fill={ink}><path d="M98 88L128 106L119 368L95 377Z" /><path d="M262 88L232 106L241 368L265 377Z" /></g>
  if (id === 'shoulder-panel' || id === 'yoke-v') return <path d="M92 68L180 145L268 68L250 55L180 116L110 55Z" fill={ink} />
  if (id === 'chevron') return <g fill="none" stroke={ink} strokeWidth="12"><path d="M82 164L180 226L278 164" /><path d="M82 210L180 272L278 210" /></g>
  if (id === 'grid-tonal') return <g stroke={ink} strokeWidth="3" opacity=".65">{[112,144,176,208,240].map((x) => <path key={`v${x}`} d={`M${x} 70V380`} />)}{[130,168,206,244,282,320].map((y) => <path key={`h${y}`} d={`M80 ${y}H280`} />)}</g>
  if (id === 'jacquard') return <g fill={ink} opacity=".72">{[120,160,200,240,280,320].flatMap((y) => [120,160,200,240].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="13" height="13" transform={`rotate(45 ${x + 6.5} ${y + 6.5})`} />))}</g>
  if (id === 'gradient') return <rect x="70" y="70" width="220" height="310" fill={ink} opacity=".28" />
  return null
}
