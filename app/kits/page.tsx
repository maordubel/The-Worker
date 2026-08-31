import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import {
  DEFAULT_KIT,
  DEFAULT_KIT_COLOUR,
  KIT_COLOURS,
  KIT_COLOUR_NAMES,
  verifiedKitSeasons,
} from '@/lib/game/kits'
import { t } from '@/lib/i18n'
import { KitDesigner } from './KitDesigner'

/** Screen 7 — the verified maker/sponsor strip, then the designer. */
export default function KitsPage() {
  const seasons = verifiedKitSeasons()

  return (
    <Screen title={t('screen.kits.title')} sub={t('screen.kits.sub')}>
      <section aria-label={t('kit.seasons')} className="mt-stack">
        <h2 className="font-body text-[11px] font-extrabold tracking-widest text-muted">
          {t('kit.seasons')}
        </h2>
        {seasons.length > 0 ? (
          <ul className="mt-2 overflow-x-auto">
            <li className="flex gap-2">
              {seasons.map((row) => (
                <span
                  key={row.season}
                  className="flex min-h-tap min-w-[150px] flex-col justify-center border-rule border-ink bg-sheet px-3 py-2"
                >
                  <span className="font-mono text-[11px] tabular-nums text-red">{row.season}</span>
                  <span className="font-sign text-[14px] leading-tight text-ink">{row.maker}</span>
                  {row.sponsors.map((sponsor) => (
                    <span
                      key={`${sponsor.name}-${sponsor.competition ?? 'all'}`}
                      className="font-body text-[11px] leading-tight text-sign"
                    >
                      {sponsor.name}
                      {sponsor.competition ? ` · ${sponsor.competition}` : ''}
                    </span>
                  ))}
                </span>
              ))}
            </li>
          </ul>
        ) : (
          <EmptyState title={t('empty.kits')} body={t('empty.kits.body')} />
        )}
      </section>

      <p className="mt-stack font-body text-step-0 text-muted">{t('kit.note')}</p>

      <KitDesigner
        colours={KIT_COLOURS}
        colourNames={KIT_COLOUR_NAMES}
        fallback={DEFAULT_KIT_COLOUR}
        initial={DEFAULT_KIT}
      />

      <ReportLink />
    </Screen>
  )
}
