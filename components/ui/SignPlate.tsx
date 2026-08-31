/**
 * לוחית אוסישקין — the screen title, and only the screen title.
 * One per screen. Never on a button or a card.
 */
export function SignPlate({
  title,
  sub,
  arm = true,
}: {
  title: string
  /** always `عربية · ENGLISH`, in the signage blue */
  sub?: string
  arm?: boolean
}) {
  return (
    <div className="flex items-start">
      {arm && <div className="min-h-[66px] w-[10px] self-stretch bg-concrete" aria-hidden="true" />}
      <div className="relative mt-[6px] border-plate border-ink bg-sheet px-3.5 pb-2 pt-1.5">
        <div className="pointer-events-none absolute inset-[3px] border-hair border-ink/45" />
        <h1 className="relative font-sign text-step-2 leading-none text-ink">{title}</h1>
        {sub && <p className="relative font-body text-[10.5px] leading-relaxed text-sign">{sub}</p>}
      </div>
    </div>
  )
}
