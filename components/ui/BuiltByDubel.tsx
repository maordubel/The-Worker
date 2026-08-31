import { t } from '@/lib/i18n'

/**
 * Mandatory Dubel Team build credit.
 * Text only on this project: the emblem's red would read as a second stamp beside
 * the club's own mark. Register matches the archive's — dry, no adjectives.
 * Contrast: muted on ink is 7.5:1.
 */
export function BuiltByDubel() {
  const label = t('credit.built')
  return (
    <a
      href="https://DubelTeam.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('credit.aria', { label })}
      className="inline-flex min-h-tap items-center font-mono text-[11px] tabular-nums tracking-wider text-concrete underline decoration-red decoration-2 underline-offset-4 transition-colors duration-press ease-stamp hover:text-sheet motion-reduce:transition-none"
    >
      {label}
    </a>
  )
}
