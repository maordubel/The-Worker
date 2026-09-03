import { CardWall, type Fact } from './CardWall'
import { Num } from '@/components/ui/Num'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { archive } from '@/lib/game/archive'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * אגף אוסישקין — a memorial, not a section of the football product.
 *
 * Maor asked for an honour page for the hall with information bubbles about the
 * basketball we hold, and that is what this is: 25 July 2007, 6:39 in the morning, the
 * bulldozers, the torn shirts — then forty-five sourced cards a reader turns over one at
 * a time, then the association archive that only exists because the hall came down.
 *
 * The wing is architecturally separate, which is how rule 14 is actually held: this
 * screen reads `archive.ussishkin` and the association tables and touches no football
 * table at all. Nothing here can leak into a football question, because there is nothing
 * here a football question knows how to read.
 *
 * What is NOT on the page matters as much. There is no architect, no attendance record
 * and no result for the last derby, because no source gave them — the file lists them
 * as open rather than filling them in. A memorial that invents details is not a
 * memorial, it is decoration.
 */

const SECTIONS: Array<{ cat: Fact['cat']; key: MessageKey }> = [
  { cat: 'building', key: 'uss.cat.building' },
  { cat: 'nights', key: 'uss.cat.nights' },
  { cat: 'club', key: 'uss.cat.club' },
  { cat: 'ussishkin-club', key: 'uss.cat.ussishkin-club' },
]

export default function UssishkinPage() {
  const facts = archive.ussishkin as unknown as Fact[]
  const elections = archive.elections
  const candidates = archive.electionCandidates

  return (
    <Screen title={t('screen.ussishkin.title')} sub={t('screen.ussishkin.sub')}>
      {/* the plaque */}
      <section className="mt-stack border-rule border-ink bg-ink px-4 py-5">
        <p className="font-latin text-[9px] font-bold tracking-[0.28em] text-red" dir="ltr">
          USSISHKIN HALL · TEL AVIV · 1980—2007
        </p>
        <h2 className="mt-2 font-display text-step-4 leading-[0.9] text-paper">
          {t('uss.hall')}
        </h2>
        <p className="mt-3 max-w-prose border-s-rule border-red ps-3 font-body text-step-0 leading-relaxed text-concrete">
          {t('uss.epitaph')}
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t-hair border-concrete/40 pt-3">
          {[
            { k: 'uss.stat.opened', v: '29.9.1980' },
            { k: 'uss.stat.seats', v: '2,000' },
            { k: 'uss.stat.fell', v: '25.7.2007' },
          ].map((stat) => (
            <div key={stat.k}>
              <dd className="font-poster text-[21px] leading-none text-paper">
                <Num>{stat.v}</Num>
              </dd>
              <dt className="mt-1 font-body text-[10px] tracking-wide text-concrete">
                {t(stat.k as MessageKey)}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-stack max-w-prose font-body text-step-0 leading-relaxed text-ink">
        {t('uss.lede')}
      </p>

      <CardWall facts={facts} />

      {/* the same record, read as sections, for anyone who would rather read than tap */}
      {SECTIONS.map((section) => {
        const rows = facts.filter(
          (fact) =>
            fact.cat === section.cat || (section.cat === 'club' && fact.cat === 'players'),
        )
        if (rows.length === 0) return null
        return (
          <section key={section.cat} className="mt-stack">
            <h3 className="border-b-rule border-ink pb-1 font-display text-step-2 leading-tight text-ink">
              {t(section.key)}
            </h3>
            <ul className="mt-2">
              {rows.map((fact) => (
                <li key={fact.slug} className="border-b-hair border-ink/25 py-2.5">
                  <p className="font-body text-step-0 leading-relaxed text-ink">{fact.factHe}</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-2 font-mono text-[10.5px] text-muted">
                    {fact.periodHe !== '' && <Num>{fact.periodHe}</Num>}
                    <a href={fact.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                      <bdi>{fact.sourceTitle}</bdi>
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {/* the association archive — the best-sourced material in the project */}
      <h3 className="mt-stack border-b-rule border-ink pb-1 font-display text-step-2 leading-tight text-ink">
        {t('uss.elections')}
      </h3>
      <p className="mt-2 max-w-prose font-body text-step--1 leading-relaxed text-muted">
        {t('ussishkin.separate')}
      </p>

      {elections.map((election) => {
        const runners = candidates
          .filter((row) => row.electionSlug === election.slug)
          .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))

        return (
          <section key={election.slug} className="mt-stack">
            <div className="border-b-hair border-ink/40 pb-1">
              <h4 className="font-sign text-step-1 leading-tight text-ink">{election.titleHe}</h4>
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
                  <span className="w-5 shrink-0 font-poster text-[17px] leading-none text-red">
                    <Num>{runner.rank ?? '—'}</Num>
                  </span>
                  <span className="min-w-0 flex-1 font-body text-step-0 text-ink">
                    {runner.personNameHe}
                    {runner.occupationHe && (
                      <span className="block font-body text-[10.5px] leading-snug text-muted">
                        {runner.occupationHe}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
                    {runner.votes !== null ? <Num>{runner.votes}</Num> : '—'}
                    {runner.elected && <span className="ms-1.5 text-red">✓</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )
      })}

      <p className="mt-stack max-w-prose border-rule border-ink bg-sheet p-4 font-body text-step--1 leading-relaxed text-muted">
        {t('uss.openNote')}
      </p>

      <ReportLink />
    </Screen>
  )
}
