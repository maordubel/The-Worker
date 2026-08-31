import { t } from '@/lib/i18n'

type Variant =
  | 'credit.builtBy'
  | 'credit.engineered'
  | 'credit.designedDev'
  | 'credit.built'
  | 'credit.developedBy'
  | 'credit.madeWithLove'

/**
 * Mandatory Dubel Team build credit.
 * Text-only on this project: the emblem's red would sit beside the club's own red
 * and read as a second badge. Wording is the archival/editorial register of the site.
 */
export function BuiltByDubel({ variant = 'credit.built' }: { variant?: Variant }) {
  const label = t(variant)
  return (
    <a
      href="https://DubelTeam.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('credit.aria', { label })}
      className="inline-flex min-h-[44px] items-center text-step--1 text-muted underline decoration-rule/40 underline-offset-4 transition-colors duration-stamp ease-stamp hover:text-red motion-reduce:transition-none"
    >
      {label}
    </a>
  )
}
