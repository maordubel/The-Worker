import { BannerCloth } from '@/components/ui/BannerCloth'
import { Screen } from '@/components/ui/Screen'
import { GatePlate } from '@/components/gates/GatePlate'
import { Intro } from '@/components/ui/Intro'
import { GATES, wallOrder } from '@/lib/gates'
import { t } from '@/lib/i18n'

/**
 * בלומפילד — the ground.
 *
 * The screen is the gate plan and nothing else. A player does not pick a mode from a
 * list; they walk in by a gate, and each gate carries its own printed bill.
 *
 * Three things used to sit here and have been taken out rather than explained, because
 * none of them could say what it was for: a "lighting streak" tower that counted
 * nothing, a "today's sheet" that was placeholder copy, and a "paste a new sheet"
 * button that went to trivia. A screen that has to be explained is a screen that is
 * wrong.
 */
export default function BloomfieldPage() {
  return (
    <Screen title={t('screen.home.title')} sub={t('screen.home.sub')}>
      {/* An overlay, not a route: the wall below is already rendered and complete, so
          the opening never stands between a shared link and the gates. */}
      <Intro />
      <section aria-label={t('wall.chooseGate')} className="mt-stack">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-[15px] text-ink">{t('wall.chooseGate')}</p>
          <h2 className="font-latin text-[10px] font-bold tracking-[0.24em] text-sign" dir="ltr">
            CHOOSE YOUR GATE
          </h2>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
          {wallOrder(GATES).map((gate) => (
            // The curva takes the full width of the wall. The span has to sit on the
            // grid ITEM — a col-span on the link inside it spans nothing at all.
            <li key={gate.number} className={gate.plate === 'curva' ? 'col-span-2 lg:col-span-3' : ''}>
              <GatePlate gate={gate} />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-stack">
        <BannerCloth>{t('wall.ranks')}</BannerCloth>
      </div>
    </Screen>
  )
}
