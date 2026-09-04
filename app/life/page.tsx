import type { Metadata } from 'next'

import { Screen } from '@/components/ui/Screen'
import { t } from '@/lib/i18n'
import { resolveChapterAnchor, resolvePrologueAnchor, resolveStageBAnchor, resolveUssishkinAnchor } from '@/lib/life/anchor-server'

import { LifeStage } from './LifeStage'

/**
 * THE WORKER LIFE — the vertical slice.
 *
 * The route is a server component for one reason and it is the important one: the
 * canonical archive is `server-only`, so the anchors are resolved HERE and handed down as
 * plain objects. The game therefore never reads `content/manual/*`, never parses anything
 * and never touches Red-Fans data — the module boundary enforces brief §4 rather than a
 * convention doing it.
 *
 * `chrome={false}` because a game screen belongs to the game (rule 21).
 */
export const metadata: Metadata = {
  title: 'THE WORKER LIFE',
  description: t('life.sub'),
}

export default function LifePage() {
  const anchor = resolveChapterAnchor()
  const prologueAnchor = resolvePrologueAnchor()
  const anchors = { '1986': anchor, '1990': resolveStageBAnchor(), '1991': resolveUssishkinAnchor() }

  return (
    <Screen title={t('life.title')} sub={t('life.sub')} chrome={false} fullBleed night>
      <LifeStage anchor={anchor} prologueAnchor={prologueAnchor} anchors={anchors} />
    </Screen>
  )
}
