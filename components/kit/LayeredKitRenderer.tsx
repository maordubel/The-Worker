import type { CSSProperties } from 'react'
import { V13_2009_10, type LayeredKitStep } from '@/lib/kit/layered-assets'

type Selected = Partial<Record<LayeredKitStep, string>>

export function LayeredKitRenderer({ selected, showBadge = false, className = '' }: { selected: Selected; showBadge?: boolean; className?: string }) {
  const kit = V13_2009_10
  const body = kit.steps.body.find((x) => x.id === selected.body)
  const construction = kit.steps.construction.find((x) => x.id === selected.construction)
  const crest = kit.steps.crest.find((x) => x.id === selected.crest)
  const maker = kit.steps.maker.find((x) => x.id === selected.maker)
  const sponsor = kit.steps.sponsor.find((x) => x.id === selected.sponsor)
  return (
    <span className={`relative inline-block ${className}`} style={{ aspectRatio: '1122 / 1402' }}>
      <img src={kit.baseSrc} alt="" className="absolute inset-0 h-full w-full object-contain" />
      {body?.src ? <img src={body.src} alt="" className="absolute inset-0 h-full w-full object-contain" /> : null}
      {construction?.src ? <img src={construction.src} alt="" className="absolute inset-0 h-full w-full object-contain" /> : null}
      {crest?.src ? <Placed src={crest.src} p={crest.placement!} /> : null}
      {maker?.src ? <Placed src={maker.src} p={maker.placement!} filter={maker.filter} /> : null}
      {sponsor?.src ? <Placed src={sponsor.src} p={sponsor.placement!} /> : null}
      {showBadge ? <Placed src={kit.badgeSrc} p={kit.badgePlacement} /> : null}
    </span>
  )
}

function Placed({ src, p, filter }: { src: string; p: { x: number; y: number; w: number; h: number }; filter?: string }) {
  const style: CSSProperties = { left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%`, filter }
  return <img src={src} alt="" className="pointer-events-none absolute object-contain" style={style} />
}
