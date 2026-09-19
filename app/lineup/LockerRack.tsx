'use client'

import { OUTFIELD_KIT, PlayerFigure } from '@/components/press/PlayerFigure'
import { t } from '@/lib/i18n'

/**
 * חדר ההלבשה — the bank of names, as a wall of lockers.
 *
 * The prototype's whole idea for gate 3 is that the eleven are not picked off a list,
 * they are taken off a peg: the room is already dressed when you walk in and every shirt
 * in it belongs to somebody who could plausibly have played. That reframing costs
 * nothing in data — it is the same `bank` the board has always had — and it is the
 * difference between a quiz and a team sheet.
 *
 * **A locker says a name and nothing else, and that is a decision.** The prototype draws
 * a `roleTag` on every locker, taken from its own `zone` field — which in the prototype
 * IS the answer, because its zones are the truth it grades against. Every record in
 * `lineups.json` carries `positionsInferred: true`, so gate 3 grades by LINE; a locker
 * that printed "הגנה" would therefore hand over the grade for that man outright, and a
 * wall of them would hand over the whole sheet. The archive does hold a sourced career
 * position for 633 of the 653 players (`lib/game/roster-facets.ts`), so this is not a
 * gap being hidden — it is a fact being withheld because printing it here would answer
 * the question the screen is asking.
 *
 * A locker whose man is already on the pitch is dimmed and disabled rather than removed:
 * a rack that reflows every time you place somebody is a rack you have to re-read every
 * time you place somebody.
 */
export function LockerRack({
  bank,
  used,
  selected,
  onSelect,
}: {
  bank: readonly string[]
  /** names already standing on the pitch */
  used: ReadonlySet<string>
  selected: string | null
  onSelect: (name: string) => void
}) {
  return (
    <section>
      <h2 className="font-body text-[11px] font-extrabold tracking-widest text-muted">
        {t('lineup.rack.title')}
      </h2>
      <p className="mt-1 font-body text-step--1 leading-snug text-muted">{t('lineup.rack.note')}</p>

      {/*
        The rack SCROLLS inside its own box rather than growing the page. Sixteen
        lockers at full height is a screen and a half on a phone, and a room you have to
        scroll the whole document to see is a room that pushes the pitch off the glass
        every time you reach for a shirt. `overscroll-contain` keeps the page still
        while a thumb is in the rack.
      */}
      <ul className="mt-2 grid max-h-[62vh] grid-cols-2 gap-2 overflow-y-auto overscroll-contain sm:grid-cols-3 md:grid-cols-2">
        {bank.map((name) => {
          const taken = used.has(name)
          const isSelected = selected === name
          return (
            <li key={name}>
              <button
                type="button"
                disabled={taken}
                onClick={() => onSelect(name)}
                aria-pressed={isSelected}
                aria-label={t('lineup.locker.aria', { name })}
                className={`flex min-h-tap w-full flex-col items-center gap-1 border-hair bg-press-paper px-2 pb-2 pt-1 transition-transform duration-press ease-stamp active:scale-[.96] disabled:opacity-30 motion-reduce:transition-none ${
                  isSelected ? 'border-plate border-press-red' : 'border-press-ink/40'
                }`}
              >
                {/* the rail the shirts hang from — one hairline across the top of the box */}
                <span aria-hidden="true" className="h-[3px] w-3/4 bg-press-ink/30" />
                <PlayerFigure
                  kit={OUTFIELD_KIT}
                  ghost={taken}
                  number={null}
                  size={40}
                  title={name}
                />
                <span className="w-full truncate text-center font-body text-[11px] leading-tight text-press-ink">
                  {name}
                </span>
                {taken && (
                  <span className="font-body text-[9px] tracking-widest text-press-ink/60">
                    {t('lineup.rack.taken')}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
