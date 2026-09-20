import { PHOTO_CROP, type VisualPartKind } from '@/lib/kit/visual-dna'

/** A crop of a real archive shirt, not a second illustration of it. */
export function KitPhotoPart({
  src,
  kind,
  label,
  className = '',
}: {
  src: string
  kind: VisualPartKind
  label: string
  className?: string
}) {
  const crop = PHOTO_CROP[kind]
  return (
    <span
      role="img"
      aria-label={label}
      className={`block overflow-hidden bg-paper bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: crop.size,
        backgroundPosition: crop.position,
      }}
    />
  )
}
