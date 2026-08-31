import { BuiltByDubel } from '@/components/ui/BuiltByDubel'
import { Ticket } from '@/components/ui/Ticket'
import { t } from '@/lib/i18n'

const MODES = [
  { serial: '01', title: 'home.modes.trivia', desc: 'home.modes.trivia.desc' },
  { serial: '02', title: 'home.modes.lineup', desc: 'home.modes.lineup.desc' },
  { serial: '03', title: 'home.modes.memory', desc: 'home.modes.memory.desc' },
  { serial: '04', title: 'home.modes.kit', desc: 'home.modes.kit.desc' },
] as const

const COUNTERS = [
  { label: 'home.data.seasons', value: '—' },
  { label: 'home.data.players', value: '—' },
  { label: 'home.data.matches', value: '—' },
  { label: 'home.data.questions', value: '—' },
] as const

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <main id="main" className="mx-auto max-w-5xl px-gutter py-10 md:py-20">
        {/* Masthead — mobile stacks, desktop sets the title against a rule */}
        <header className="perforated-b pb-6 md:pb-10">
          <p className="font-display text-step--1 tracking-[0.2em] text-red">
            <bdi>{t('home.masthead.eyebrow')}</bdi>
          </p>
          <h1 className="plate-offset mt-2 font-display text-step-5 font-black leading-none md:text-[4.5rem]">
            {t('app.name')}
          </h1>
          <p className="mt-3 max-w-prose text-step-1 text-muted md:mt-4">
            {t('app.tagline')}
          </p>
        </header>

        <section aria-labelledby="status" className="mt-stack">
          <h2 id="status" className="font-display text-step-2 font-bold">
            {t('home.status.title')}
          </h2>
          <p className="mt-2 max-w-prose text-step-0 text-muted">{t('home.status.body')}</p>
        </section>

        <section aria-labelledby="modes" className="mt-10">
          <h2 id="modes" className="font-display text-step-3 font-bold">
            {t('home.modes.title')}
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {MODES.map((mode) => (
              <li key={mode.serial}>
                <Ticket serial={mode.serial} title={t(mode.title)}>
                  {t(mode.desc)}
                </Ticket>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="data" className="mt-10">
          <h2 id="data" className="font-display text-step-3 font-bold">
            {t('home.data.title')}
          </h2>
          <dl className="mt-4 grid grid-cols-2 border-hairline border-ink md:grid-cols-4">
            {COUNTERS.map((counter) => (
              <div
                key={counter.label}
                className="border-hairline border-ink/30 px-4 py-5 text-center"
              >
                <dt className="text-step--1 text-muted">{t(counter.label)}</dt>
                <dd className="mt-1 font-display text-step-4 font-black tabular-nums text-red">
                  {counter.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-step--1 text-muted">{t('home.data.note')}</p>
        </section>
      </main>

      <footer className="border-t-plate border-red">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-gutter py-6 text-step--1 md:flex-row md:items-center md:justify-between">
          <p className="text-muted">
            <bdi>{t('footer.rights')}</bdi> © <bdi>{new Date().getFullYear()}</bdi>
          </p>
          <BuiltByDubel variant="credit.built" />
        </div>
      </footer>
    </div>
  )
}
