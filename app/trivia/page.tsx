import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { ROUND_LENGTH, topicCounts } from '@/lib/game/trivia'
import { t } from '@/lib/i18n'
import { TopicWall } from './TopicWall'

/**
 * שער 2 — אגף הטריוויות.
 *
 * The gate used to open straight into a round. Maor asked for a WING: five ways in, one
 * of them general and mixing both sports, four of them narrow. So the gate is now a
 * choice, and each topic is its own route.
 *
 * The counts are read from the real bank at request time, not written down — a topic
 * that grows because new data landed shows a bigger number without anyone editing this
 * file, and a topic that is too thin to fill a round says so instead of dealing short.
 */
export default function TriviaWingPage() {
  return (
    <Screen title={t('screen.trivia.title')} sub={t('screen.trivia.sub')}>
      <p className="mt-stack max-w-prose font-body text-step-0 leading-relaxed text-ink">
        {t('topic.lede')}
      </p>
      <TopicWall counts={topicCounts()} roundLength={ROUND_LENGTH} />
      <ReportLink />
    </Screen>
  )
}
