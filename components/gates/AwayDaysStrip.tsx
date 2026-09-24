import { t } from '@/lib/i18n'

/**
 * AWAY DAYS — the strip at the foot of the wall (owner decision, 23.9.2026).
 *
 * It replaces the "מקומכם בשורותינו" cloth as the way into a feature that is announced
 * and not yet open, so it is drawn as a destination board that has not been lit yet:
 * the away end's navy (gate 11's ink — the away end carries no vermilion field), the
 * road running under the name as a dashed centre line, a departures column of real
 * away grounds' directions (compass words, no fixtures — nothing here claims a match),
 * and the vermilion "בקרוב" stamp over the corner. Not a link: a strip that leads
 * nowhere yet must not look pressable (rule 19), so it is an image with a label.
 */
export function AwayDaysStrip() {
  return (
    <div role="img" aria-label={t('away.aria')} className="relative overflow-hidden border-rule border-ink bg-sign">
      {/* the road — a dashed centre line running the length of the strip */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[14px] h-[4px]"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgb(var(--sheet)) 0 22px, transparent 22px 40px)' }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[6px] bg-red" />

      <div className="relative flex items-stretch gap-3 px-4 pb-8 pt-3">
        <div className="min-w-0 flex-1">
          <p dir="ltr" className="text-end font-latin text-[9px] font-bold tracking-[0.3em] text-concrete">
            ON THE ROAD WITH HAPOEL
          </p>
          <p dir="ltr" className="relative mt-1 text-end font-latin text-[40px] font-black leading-[0.9] tracking-[-0.01em] sm:text-[56px]">
            <span className="plate-shift absolute inset-0 text-ink">AWAY DAYS</span>
            <span className="plate-top relative text-sheet">AWAY DAYS</span>
          </p>
          <p className="mt-4 font-display text-[16px] leading-tight text-sheet sm:text-[19px]">{t('away.title')}</p>
          <p className="mt-0.5 font-body text-[11.5px] leading-snug text-concrete">{t('away.lede')}</p>
        </div>
        {/* the departures column — the directions an away day goes, printed like a board */}
        <ul aria-hidden="true" className="hidden shrink-0 flex-col justify-center gap-1 border-s-hair border-concrete/40 ps-3 sm:flex" dir="ltr">
          {['NORTH', 'SOUTH', 'EAST', 'JERUSALEM', 'EUROPE'].map((to) => (
            <li key={to} className="flex items-center gap-2 font-mono text-[11px] font-bold tabular-nums tracking-[0.12em] text-sheet">
              <span className="block h-[7px] w-[7px] bg-red" />
              {to}
            </li>
          ))}
        </ul>
      </div>

      <p
        aria-hidden="true"
        className="absolute end-3 top-3 -rotate-[8deg] border-plate border-red bg-sheet px-2.5 py-0.5 font-poster text-[20px] leading-none tracking-[0.14em] text-red sm:text-[24px]"
      >
        {t('stage.soon')}
      </p>
    </div>
  )
}
