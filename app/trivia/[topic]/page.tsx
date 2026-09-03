import { notFound } from 'next/navigation'

import { EmptyState } from '@/components/ui/EmptyState'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { isTopic, topicSpec } from '@/lib/game/topics'
import { ROUND_LENGTH, deal } from '@/lib/game/trivia'
import { t, type MessageKey } from '@/lib/i18n'
import { TriviaRun } from '../TriviaRun'

/**
 * שער 2 — one topic's round.
 *
 * The topic is a route segment rather than a query string, because a topic is a place
 * in this app and not a setting: `/trivia/europe` is a thing to send someone, and it is
 * what the share link carries. An unknown segment 404s rather than quietly falling back
 * to the general bank — a link that silently plays a different game than it names is
 * worse than a link that does not work.
 *
 * The whole round is dealt here, server-side, WITHOUT its answers, exactly as the
 * general round is. `grade()` re-derives them from (seed, topic).
 */
export default function TopicRoundPage({
  params,
  searchParams,
}: {
  params: { topic: string }
  searchParams: { seed?: string }
}) {
  if (!isTopic(params.topic)) notFound()
  const topic = params.topic
  const seed = Number(searchParams.seed) || 1
  const spec = topicSpec(topic)

  const questions = Array.from({ length: ROUND_LENGTH }, (_, index) =>
    deal(seed, index, topic),
  ).filter((question): question is NonNullable<typeof question> => question !== null)

  return (
    <Screen
      title={t(spec.titleKey as MessageKey)}
      sub={t('screen.trivia.sub')}
      chrome={questions.length < ROUND_LENGTH}
    >
      {questions.length >= ROUND_LENGTH ? (
        <>
          <TriviaRun questions={questions} seed={seed} topic={topic} />
          <ReportLink />
        </>
      ) : (
        <EmptyState
          title={t(spec.titleKey as MessageKey)}
          body={t('topic.thin', { n: String(questions.length), need: String(ROUND_LENGTH) })}
        />
      )}
    </Screen>
  )
}
