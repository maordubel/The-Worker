import { t } from '@/lib/i18n'

/**
 * ה־standfirst — the one line on the whole ground that says what this is.
 *
 * The problem this fixes: `app/page.tsx` renders the gate wall and nothing else. A
 * first-time visitor sees thirteen numbered plates and has to guess, from the numbers
 * alone, that this is a game at all — Bloomfield's own gate plan (rule 9) is the right
 * navigation for someone who already knows what's behind it, and the wrong first thing
 * to show someone who does not.
 *
 * So this is a masthead line, not a paragraph of marketing: one sentence on what The
 * Worker is, one on who it's for, in the same dry, declarative register as
 * `brand.tagline` and the rest of the printed-sign copy — no adjectives doing the
 * selling, because nothing else in this interface sells either.
 *
 * Self-contained on purpose: `app/page.tsx` is owned by another agent, so this reads
 * its own string and asks nothing of its caller beyond `<Standfirst />` sitting under
 * the sign plate, above the wall.
 */
export function Standfirst() {
  return (
    <p className="mt-3 max-w-prose font-body text-step-0 leading-relaxed text-ink">
      <bdi>{t('home.standfirst')}</bdi>
    </p>
  )
}
