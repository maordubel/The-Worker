import { useId, type ReactNode } from 'react'

import { MakerMark } from '@/components/kit/MakerMark'
import {
  resolveKitRender,
  type KitLook,
  type KitMarkPlan,
  type KitMarksRegime,
  type KitRenderPlan,
  type RenderBox,
} from '@/lib/kit/engine'
import type { KitBodyTemplate } from '@/lib/kit/body-templates'
import type { CollarId, KitSpec, NamesetId, PatternId, SleeveId } from '@/lib/kit/spec'

/**
 * The canonical shirt renderer — one engine, two looks (`lib/kit/engine.ts`).
 *
 * `look="photo"` prints the spec on the template's photographed garment where the template has
 * geometry for it, and falls back to the drawn cloth where it does not; `marks="granted"` prints
 * the real maker/sponsor logos Maor granted to gates 4–5 (rule 25 stands everywhere else).
 * `crop="top"` frames the shoulders and collar, for a construction card.
 *
 * Every layer, marks included, is inside ONE svg in the board's own units, so a caller can give
 * the shirt any box and nothing on it moves.
 */
export function KitEngineShirt({
  spec,
  className = '',
  title,
  look = 'vector',
  marks = 'rule25',
  crop = 'full',
  density = 'full',
}: {
  spec: KitSpec
  className?: string
  title?: string
  look?: KitLook
  marks?: KitMarksRegime
  crop?: 'full' | 'top'
  /**
   * `mini` — the same engine plan at thumbnail density (a roster row, a pitch chip, a
   * poster). The weave, the fold light, the dashed seams and the maker/sponsor marks are
   * noise at 28px and cost a pattern, a gradient and an image each, per row; the cloth,
   * the construction, the collar and the printed crest stay, and the outline is solid
   * ink so a red shirt never meets grass edge-on (docs/16). Always the drawn look.
   */
  density?: 'full' | 'mini'
}) {
  const uid = useId().replace(/:/g, '')
  const mini = density === 'mini'
  const plan = resolveKitRender(spec, { look: mini ? 'vector' : look, marks })
  const h = crop === 'top' ? Math.round(plan.height * (plan.photo ? 0.5 : 0.55)) : plan.height
  const viewBox = `0 0 ${plan.width} ${h}`
  return (
    <span className={`relative inline-block ${className}`} style={{ aspectRatio: `${plan.width} / ${h}` }} data-kit-look={plan.look}>
      <svg viewBox={viewBox} className="absolute inset-0 h-full w-full" role="img" aria-label={title ?? spec.seasonLabel}>
        {title && <title>{title}</title>}
        {plan.photo ? (
          <PhotoGarment plan={plan} spec={spec} uid={uid} />
        ) : (
          <VectorGarment plan={plan} spec={spec} uid={uid} mini={mini} />
        )}
      </svg>
    </span>
  )
}

/* ------------------------------------------------------------------ the marks, in board units */
function Marks({ plan, uid }: { plan: KitRenderPlan; uid: string }) {
  const { crest, maker, sponsor } = plan.marks
  return (
    <g aria-hidden="true">
      {crest && <image href={crest.src} x={crest.box.x} y={crest.box.y} width={crest.box.w} height={crest.box.h} preserveAspectRatio="xMidYMid meet" />}
      {maker && <Mark mark={maker} uid={`${uid}-mk`} />}
      {sponsor && <Mark mark={sponsor} uid={`${uid}-sp`} />}
    </g>
  )
}

function Mark({ mark, uid }: { mark: KitMarkPlan; uid: string }) {
  const { box } = mark
  if (mark.kind === 'alt') {
    // the alternative mark is drawn on a 24×28 board; fit it into the slot without distortion
    const scale = Math.min(box.w / 24, box.h / 28)
    const x = box.x + (box.w - 24 * scale) / 2
    const y = box.y + (box.h - 28 * scale) / 2
    return <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})`}><MakerMark id={mark.id} ink={mark.ink} /></g>
  }
  if (mark.kind === 'lettered') return <Lettered text={mark.text} box={box} ink={mark.ink} />
  if (mark.print === 'colour') {
    return <image href={mark.src} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid meet" />
  }
  // a one-colour mark is a white SHAPE printed through a mask in the cloth's contrast ink
  return (
    <g>
      <defs>
        <mask id={uid} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
          <image href={mark.src} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid meet" />
        </mask>
      </defs>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={mark.ink} mask={`url(#${uid})`} />
    </g>
  )
}

/** the sponsor, lettered on the cloth — sized to the slot, squeezed only when it must be */
function Lettered({ text, box, ink }: { text: string; box: RenderBox; ink: string }) {
  // a chest sponsor reads at about half the slot's height; the estimate is generous (Heebo 800 is
  // wide), and past it the word is squeezed to the slot rather than printed off the cloth
  const size = Math.min(box.h * 0.5, (box.w / Math.max(1, text.length)) * 1.45)
  const estimate = text.length * size * 0.72
  return (
    <text
      x={box.x + box.w / 2}
      y={box.y + box.h / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fill={ink}
      className="font-body"
      style={{ fontSize: size, fontWeight: 800 }}
      {...(estimate > box.w ? { textLength: box.w, lengthAdjust: 'spacingAndGlyphs' as const } : {})}
    >
      {text}
    </text>
  )
}

/* ------------------------------------------------------------------ photo */
function PhotoGarment({ plan, spec, uid }: { plan: KitRenderPlan; spec: KitSpec; uid: string }) {
  const photo = plan.photo!
  const g = photo.geometry
  const { base, secondary, sleeve, collar } = plan.colours
  const sil = `sil-${uid}`
  const torso = `torso-${uid}`
  const sleeves = spec.sleeves === 'raglan' ? g.raglan : g.sleeves
  // delta 87 (23.9.2026): retro-90s-boxy / retro-80s-long deliver a polo mask too — a cut whose
  // supports gate excludes 'polo'/'v-neck' never reaches here for that value (photoMissing already
  // fell back to vector), so an absent mask on a supported value cannot happen
  const collarPath =
    spec.collar === 'v-neck' ? g.masks.collarV : spec.collar === 'polo' && g.masks.collarPolo ? g.masks.collarPolo : g.masks.collarCrew
  const W = g.canvas.w
  const H = g.canvas.h
  return (
    <>
      <defs>
        <clipPath id={sil}><path d={g.silhouette} clipRule="evenodd" /></clipPath>
        <clipPath id={torso}><path d={g.torso} clipRule="evenodd" /></clipPath>
      </defs>
      <g style={{ isolation: 'isolate' }}>
        <path d={g.silhouette} fill={base} fillRule="evenodd" />
        <g fill={sleeve}>
          <path d={sleeves[0]} fillRule="evenodd" />
          <path d={sleeves[1]} fillRule="evenodd" />
        </g>
        <g clipPath={`url(#${torso})`}>
          {spec.pattern === 'side-panel' ? (
            <g fill={secondary}>
              <path d={g.masks.sidePanels} fillRule="evenodd" />
              <path d={g.masks.hem} fillRule="evenodd" />
            </g>
          ) : (
            <g transform={photo.patternTransform}>
              <PatternLayer id={spec.pattern} ink={secondary} />
            </g>
          )}
        </g>
        <g clipPath={`url(#${sil})`}>
          <path d={collarPath} fill={collar} fillRule="evenodd" />
          {spec.sleeves === 'cuff' && <path d={g.masks.cuffs} fill={collar} fillRule="evenodd" />}
          {spec.sleeves === 'shoulder-stripe' && g.masks.sleeveStripe && <path d={g.masks.sleeveStripe} fill={secondary} fillRule="evenodd" />}
          {spec.number !== null && (
            <g transform={photo.patternTransform}><FrontNumber value={spec.number} nameset={spec.nameset} dark={plan.dark} /></g>
          )}
          <Marks plan={plan} uid={uid} />
        </g>
        {/* the cloth's light: folds multiply, sheen screens — over the print, so a fold runs through it */}
        <image href={g.shading} x="0" y="0" width={W} height={H} clipPath={`url(#${sil})`} style={{ mixBlendMode: 'multiply' }} />
        <image href={g.highlight} x="0" y="0" width={W} height={H} clipPath={`url(#${sil})`} style={{ mixBlendMode: 'screen' }} />
      </g>
    </>
  )
}

/* ------------------------------------------------------------------ vector */
function VectorGarment({ plan, spec, uid, mini = false }: { plan: KitRenderPlan; spec: KitSpec; uid: string; mini?: boolean }) {
  const t = plan.template
  const { base, secondary, sleeve, collar } = plan.colours
  const clipBody = `body-${uid}`
  const clipAll = `all-${uid}`
  if (mini) {
    const crest = plan.marks.crest
    return (
      <>
        <defs>
          <clipPath id={clipBody}><path d={t.bodyPath} /></clipPath>
        </defs>
        <path d={t.leftSleevePath} fill={sleeve} stroke="rgb(var(--ink))" strokeWidth="14" strokeLinejoin="round" />
        <path d={t.rightSleevePath} fill={sleeve} stroke="rgb(var(--ink))" strokeWidth="14" strokeLinejoin="round" />
        <path d={t.bodyPath} fill={base} stroke="rgb(var(--ink))" strokeWidth="14" strokeLinejoin="round" />
        <g clipPath={`url(#${clipBody})`}>
          <PatternLayer id={spec.pattern} ink={secondary} />
        </g>
        <SleeveConstruction id={spec.sleeves} template={t} sleeve={sleeve} ink={secondary} />
        <CollarLayer id={spec.collar} cx={t.neck.cx} cy={t.neck.cy} width={t.neck.width} depth={t.neck.depth} ink={collar} base={base} />
        <CuffLayer id={spec.sleeves} left={t.cuffLeftPath} right={t.cuffRightPath} ink={collar} />
        {crest && (
          <image href={crest.src} x={crest.box.x} y={crest.box.y} width={crest.box.w} height={crest.box.h} preserveAspectRatio="xMidYMid meet" aria-hidden="true" />
        )}
      </>
    )
  }
  return (
    <>
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
        <PatternLayer id={spec.pattern} ink={secondary} />
      </g>

      <SleeveConstruction id={spec.sleeves} template={t} sleeve={sleeve} ink={secondary} />

      <g clipPath={`url(#${clipAll})`}>
        <rect x="0" y="0" width="360" height="420" fill={`url(#knit-${uid})`} />
        <rect x="0" y="0" width="360" height="420" fill={`url(#fold-${uid})`} />
      </g>

      <CollarLayer id={spec.collar} cx={t.neck.cx} cy={t.neck.cy} width={t.neck.width} depth={t.neck.depth} ink={collar} base={base} />
      <CuffLayer id={spec.sleeves} left={t.cuffLeftPath} right={t.cuffRightPath} ink={collar} />
      {spec.number !== null && <FrontNumber value={spec.number} nameset={spec.nameset} dark={plan.dark} />}

      <g fill="none" stroke="rgb(var(--ink))" strokeOpacity=".26" strokeWidth="1.1" strokeDasharray="3 3">
        <path d={t.leftSleeveSeam} /><path d={t.rightSleeveSeam} /><path d={t.hemPath} />
      </g>
      <Marks plan={plan} uid={uid} />
    </>
  )
}

function FrontNumber({ value, nameset, dark }: { value: number; nameset: NamesetId; dark: boolean }) {
  const ink = dark ? 'rgb(var(--sheet))' : 'rgb(var(--ink))'
  const common = { x: 180, y: 330, textAnchor: 'middle' as const, className: 'font-poster' }
  if (nameset === 'block-hollow') {
    return <text {...common} fill="none" stroke={ink} strokeWidth="2.4" style={{ fontSize: 54 }}>{value}</text>
  }
  return <text {...common} fill={ink} style={{ fontSize: nameset === 'condensed' ? 48 : 54 }}>{value}</text>
}

/**
 * A contrasting raglan is the SLEEVE colour carried up to the neck — the photo look fills the
 * raglan panel with the sleeve ink, and the drawn look does the same, so one spec reads one way.
 */
function SleeveConstruction({ id, template, sleeve, ink }: { id: SleeveId; template: KitBodyTemplate; sleeve: string; ink: string }) {
  if (id === 'raglan') return <g fill={sleeve}><path d={template.shoulderPanelLeft} /><path d={template.shoulderPanelRight} /></g>
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

/** Surface patterns in the 360×420 board. Photo maps the same shapes onto its torso. */
function PatternLayer({ id, ink }: { id: PatternId; ink: string }): ReactNode {
  if (id === 'solid') return null
  if (id === 'stripe-wide') return <g fill={ink}>{[92, 132, 172, 212, 252].map((x) => <rect key={x} x={x} y="35" width="20" height="360" />)}</g>
  if (id === 'pinstripe') return <g fill={ink}>{[104, 126, 148, 170, 192, 214, 236].map((x) => <rect key={x} x={x} y="35" width="3" height="360" />)}</g>
  if (id === 'twin-stripe') return <g fill={ink}><rect x="164" y="35" width="8" height="360" /><rect x="188" y="35" width="8" height="360" /></g>
  if (id === 'hoop-tonal') return <g fill={ink}>{[132, 198, 264].map((y) => <rect key={y} x="70" y={y} width="220" height="24" />)}</g>
  if (id === 'chest-band') return <g fill={ink}><rect x="65" y="160" width="230" height="48" /><rect x="65" y="151" width="230" height="4" /><rect x="65" y="214" width="230" height="4" /></g>
  if (id === 'sash') return <polygon points="100,72 132,58 262,354 229,365" fill={ink} />
  if (id === 'halves') return <rect x="180" y="35" width="130" height="360" fill={ink} />
  if (id === 'quarters') return <g fill={ink}><rect x="180" y="35" width="130" height="175" /><rect x="60" y="210" width="120" height="185" /></g>
  if (id === 'diagonal') return <g stroke={ink} strokeWidth="7" opacity=".8">{[-40, 10, 60, 110, 160, 210, 260].map((x) => <path key={x} d={`M${x} 390L${x + 165} 40`} />)}</g>
  if (id === 'side-panel') return <g fill={ink}><path d="M98 88L128 106L119 368L95 377Z" /><path d="M262 88L232 106L241 368L265 377Z" /></g>
  if (id === 'shoulder-panel' || id === 'yoke-v') return <path d="M92 68L180 145L268 68L250 55L180 116L110 55Z" fill={ink} />
  if (id === 'chevron') return <g fill="none" stroke={ink} strokeWidth="12"><path d="M82 164L180 226L278 164" /><path d="M82 210L180 272L278 210" /></g>
  if (id === 'grid-tonal') return <g stroke={ink} strokeWidth="3" opacity=".65">{[112, 144, 176, 208, 240].map((x) => <path key={`v${x}`} d={`M${x} 70V380`} />)}{[130, 168, 206, 244, 282, 320].map((y) => <path key={`h${y}`} d={`M80 ${y}H280`} />)}</g>
  if (id === 'jacquard') return <g fill={ink} opacity=".72">{[120, 160, 200, 240, 280, 320].flatMap((y) => [120, 160, 200, 240].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="13" height="13" transform={`rotate(45 ${x + 6.5} ${y + 6.5})`} />))}</g>
  if (id === 'gradient') return <rect x="70" y="70" width="220" height="310" fill={ink} opacity=".28" />
  return null
}

/**
 * One mark on its own — a Gate 4 drawer card for the crest, the maker or the sponsor. The same plan
 * and the same `Mark` as the shirt, framed on the mark's own slot, printed in ink on paper.
 */
export function KitMarkArt({
  spec,
  which,
  className = '',
  marks = 'granted',
}: {
  spec: KitSpec
  which: 'crest' | 'maker' | 'sponsor'
  className?: string
  marks?: KitMarksRegime
}) {
  const uid = useId().replace(/:/g, '')
  // on the cloth it will print on: a white SUBARU on a paper card is invisible, and the
  // contrast ink of a mono mark is the shirt's, not the card's
  const plan = resolveKitRender(spec, { look: 'vector', marks })
  const crest = plan.marks.crest
  const mark = which === 'crest' ? null : plan.marks[which]
  const box = which === 'crest' ? crest?.box : mark?.box
  if (!box || (which === 'crest' ? !crest : !mark)) return null
  const pad = Math.max(box.w, box.h) * 0.06
  return (
    <svg viewBox={`${box.x - pad} ${box.y - pad} ${box.w + pad * 2} ${box.h + pad * 2}`} className={className} aria-hidden="true">
      <rect x={box.x - pad} y={box.y - pad} width={box.w + pad * 2} height={box.h + pad * 2} fill={plan.colours.base} />
      {which === 'crest' && crest ? (
        <image href={crest.src} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid meet" />
      ) : mark ? (
        <Mark mark={mark} uid={`${uid}-card`} />
      ) : null}
    </svg>
  )
}
