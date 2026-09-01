import { EmptyState } from '@/components/ui/EmptyState'
import { Num } from '@/components/ui/Num'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { DERBY_RIVAL, archive, nameOf } from '@/lib/game/archive'
import { matchLine } from '@/components/ui/Num'
import { t } from '@/lib/i18n'

/**
 * שער 11 — משחק השנאה. The away end.
 *
 * The one gate in the system whose poster is not ours: navy only, no vermilion, no
 * flag, no rays. Whoever walks in is standing in somebody else's end, and the screen
 * is printed that way on purpose.
 *
 * A derby means Maccabi Tel Aviv and nothing else (rule 13) — it is a database flag,
 * not a word in a component. Right now the archive holds one derby fixture, so the
 * screen shows what it has and says plainly that the gate is not fully open yet,
 * rather than padding it with fixtures nobody sourced.
 */
export default function DerbyPage() {
  const derbies = archive.matches.filter(
    (match) =>
      match.homeClubSlug === DERBY_RIVAL || match.awayClubSlug === DERBY_RIVAL,
  )

  return (
    <Screen title={t('screen.derby.title')} sub={t('screen.derby.sub')}>
      {/* The away end's plate: navy, and nothing warm in it. */}
      <section className="mt-stack border-rule border-sign bg-sign/[.07] p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-latin text-[9px] font-bold tracking-[0.2em] text-sign" dir="ltr">
            GATE · AWAY END
          </span>
          <span className="font-poster text-[52px] leading-none text-sign">
            <Num>11</Num>
          </span>
        </div>
        <p className="mt-2 font-body text-step-0 leading-relaxed text-muted">{t('derby.note')}</p>
      </section>

      {derbies.length > 0 ? (
        <ul className="mt-stack border-t-rule border-ink">
          {derbies.map((match) => (
            <li
              key={`${match.seasonLabel}-${match.stage}-${match.homeClubSlug}`}
              className="border-b-hair border-ink/30 py-3"
            >
              <p className="font-display text-step-1 leading-tight text-ink">
                {matchLine(
                  nameOf.club(match.homeClubSlug),
                  match.homeScore,
                  nameOf.club(match.awayClubSlug),
                  match.awayScore,
                )}
              </p>
              <p className="mt-1 font-body text-[11px] text-muted">
                {match.stage ?? match.seasonLabel} ·{' '}
                {nameOf.competition(match.competitionSlug)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t('derby.empty')} body={t('derby.empty.body')} />
      )}

      <p className="mt-stack font-body text-step--1 leading-relaxed text-muted">
        {t('derby.empty.body')}
      </p>

      <ReportLink />
    </Screen>
  )
}
