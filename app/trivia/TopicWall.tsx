import Link from 'next/link'

import { Num } from '@/components/ui/Num'
import { TOPICS, topicSpec, type Topic } from '@/lib/game/topics'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * אגף הטריוויות — five doors, one bank.
 *
 * Maor asked for five ways in rather than one round that mixes everything: a general
 * round that includes the basketball, and four narrow ones. The narrow topics are the
 * point — a supporter who wants to argue about Europe should not have to sit through
 * kit questions to get there.
 *
 * **The count is printed, and it is not decoration.** A topic with seven hundred
 * questions and a topic with eight are not the same offer, and a player choosing
 * between them deserves to know which is which. A topic that cannot fill a round is
 * shown greyed with the reason, because dealing a five-question round and calling it
 * twelve would be the kind of small lie this project does not tell.
 */
export function TopicWall({
  counts,
  roundLength,
}: {
  counts: Record<Topic, number>
  roundLength: number
}) {
  return (
    <ul className="mt-stack grid gap-2.5 sm:grid-cols-2">
      {TOPICS.map((topic) => {
        const spec = topicSpec(topic)
        const count = counts[topic]
        const ready = count >= roundLength
        const mixed = spec.sports.length > 1

        const body = (
          <>
            <div className="flex items-baseline justify-between gap-2 border-b-hair border-ink bg-ink px-3 py-1.5">
              <span className="font-display text-[13px] leading-none text-paper">
                {t(spec.titleKey as MessageKey)}
              </span>
              {mixed && (
                <span className="shrink-0 font-body text-[9.5px] font-extrabold tracking-wide text-red">
                  {t('topic.bothSports')}
                </span>
              )}
            </div>
            <div className="px-3 pb-3 pt-2.5">
              <p className="font-body text-step--1 leading-snug text-ink">
                {t(spec.bladeKey as MessageKey)}
              </p>
              <p className="mt-2 font-mono text-[11px] tabular-nums text-muted">
                {ready ? (
                  <>
                    <Num>{count}</Num> {t('topic.questions')}
                  </>
                ) : (
                  <span className="text-red">
                    {t('topic.thin', { n: String(count), need: String(roundLength) })}
                  </span>
                )}
              </p>
            </div>
          </>
        )

        if (!ready) {
          return (
            // Not a link and not a button: there is nothing to press. `aria-disabled`
            // is not a property a list item supports, and faking a disabled control
            // here would announce something interactive that is not.
            <li key={topic} className="overflow-hidden border-rule border-ink/40 bg-paper opacity-60">
              {body}
            </li>
          )
        }

        return (
          <li key={topic} className="overflow-hidden border-rule border-ink bg-sheet">
            <Link
              href={`/trivia/${topic}?seed=1`}
              className="block min-h-tap transition-transform duration-press ease-stamp active:scale-[.985] motion-reduce:transition-none"
            >
              {body}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
