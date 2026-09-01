import { Num } from '@/components/ui/Num'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { archive } from '@/lib/game/archive'
import { t } from '@/lib/i18n'

/**
 * אגף אוסישקין — the basketball wing.
 *
 * A separate wing, not a section of the football product. Rule 14 says the two sports
 * never mix, and the cleanest way to hold that is architectural: this screen reads the
 * association tables — elections, roles, milestones — and touches no football table at
 * all. Nothing here can leak into a football question, because there is nothing here a
 * football question knows how to read.
 *
 * It is a record, not a game. The association archive is the best-sourced material in
 * the whole project — every candidate, every vote count — and that deserves to be
 * readable rather than only quizzable.
 */
export default function UssishkinPage() {
  const elections = archive.elections
  const candidates = archive.electionCandidates

  return (
    <Screen title={t('screen.ussishkin.title')} sub={t('screen.ussishkin.sub')}>
      <p className="mt-stack max-w-prose font-body text-step-0 leading-relaxed text-ink">
        {t('ussishkin.lede')}
      </p>
      <p className="mt-2 max-w-prose font-body text-step--1 leading-relaxed text-muted">
        {t('ussishkin.separate')}
      </p>

      {elections.map((election) => {
        const runners = candidates
          .filter((row) => row.electionSlug === election.slug)
          .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))

        return (
          <section key={election.slug} className="mt-stack">
            <div className="border-b-rule border-ink pb-1">
              <h2 className="font-display text-step-2 leading-tight text-ink">
                {election.titleHe}
              </h2>
              {election.eligibleVoters !== null && election.votesCast !== null && (
                <p className="mt-1 font-body text-[11px] text-muted">
                  {t('ussishkin.turnout', {
                    cast: String(election.votesCast),
                    eligible: String(election.eligibleVoters),
                    invalid: String(election.invalidVotes ?? 0),
                  })}
                </p>
              )}
            </div>

            <ol className="mt-2">
              {runners.map((runner) => (
                <li
                  key={runner.personNameHe}
                  className="flex items-baseline gap-2 border-b-hair border-ink/25 py-2"
                >
                  <span className="w-6 shrink-0 font-poster text-[19px] leading-none text-sign">
                    <Num>{runner.rank}</Num>
                  </span>
                  <span
                    className={`min-w-0 flex-1 font-body text-step-0 ${
                      runner.elected ? 'font-extrabold text-ink' : 'text-muted'
                    }`}
                  >
                    {runner.personNameHe}
                    {runner.occupationHe && (
                      <span className="block font-body text-[10.5px] leading-snug text-muted">
                        {runner.occupationHe}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="block font-poster text-[19px] leading-none text-red">
                      <Num>{runner.votes}</Num>
                    </span>
                    <span className="block font-latin text-[8px] tracking-[0.16em] text-muted" dir="ltr">
                      {runner.elected ? 'ELECTED' : 'RAN'}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            {election.noteHe && (
              <p className="mt-2 font-body text-[11px] leading-relaxed text-muted">
                {election.noteHe}
              </p>
            )}
          </section>
        )
      })}

      <ReportLink />
    </Screen>
  )
}
