import type { Metadata } from 'next'

import { SITE_URL } from '@/lib/brand'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * מטא־דאטה — one source of truth.
 *
 * Every gate's browser-tab title, share preview and canonical URL are built here, from
 * the same message keys the screen itself renders — never a second copy of the Hebrew.
 * Rule 23: a page's `title` is just its own name (`screen.<gate>.title`, the exact
 * string the `<Screen>` header prints); the root template in `app/layout.tsx`
 * (`'%s · The Worker'`) is what appends the product name, so nothing here may repeat it.
 *
 * `description` prefers an existing lede/blade key over a new one — `xi.lede`,
 * `topic.lede`, `tik.lede` and `uss.lede` already say what the gate IS in the terrace
 * voice, so duplicating them into a `seo.*` key would be a second copy of the same
 * sentence rather than a source of truth. Where no such key existed one was added
 * (`seo.<slug>.desc`, flat, appended to `/tmp/keys-seo.json` — `messages/he.json`
 * itself is owned by another agent right now).
 *
 * Every OG image lives at `/og/<image>.png`, rendered by `scripts/brand/og-cards.mjs`.
 */

export type GateSeoSlug =
  | 'xi'
  | 'trivia'
  | 'lineup'
  | 'kits'
  | 'kits-build'
  | 'memory'
  | 'polls'
  | 'goal'
  | 'tik'
  | 'derby'
  | 'derby-file'
  | 'timeline'
  | 'ussishkin'
  | 'hapoel'
  | 'life'

type GateSeoEntry = {
  path: string
  titleKey: MessageKey
  descriptionKey: MessageKey
  /** filename under `public/og/`, without the extension */
  image: string
}

const GATE_SEO: Record<GateSeoSlug, GateSeoEntry> = {
  // The club's own wing — the third tab. It has no gate number because it is not a
  // game; it is the archive with a front door on it.
  hapoel: {
    path: '/hapoel',
    titleKey: 'screen.hapoel.title',
    descriptionKey: 'hapoel.lede',
    image: 'default',
  },
  xi: { path: '/xi', titleKey: 'screen.xi.title', descriptionKey: 'xi.lede', image: 'xi' },
  trivia: {
    path: '/trivia',
    titleKey: 'screen.trivia.title',
    descriptionKey: 'topic.lede',
    image: 'trivia',
  },
  lineup: {
    path: '/lineup',
    titleKey: 'screen.lineup.title',
    descriptionKey: 'seo.lineup.desc',
    image: 'lineup',
  },
  kits: {
    path: '/kits',
    titleKey: 'screen.kits.title',
    descriptionKey: 'seo.kits.desc',
    image: 'kits',
  },
  'kits-build': {
    path: '/kits/build',
    titleKey: 'screen.kitgame.title',
    // "חמישה חלקים. חולצה אחת. עונה אחת נכונה." — already a real sentence, on voice.
    descriptionKey: 'screen.kitgame.sub',
    image: 'kits-build',
  },
  memory: {
    path: '/memory',
    titleKey: 'screen.memory.title',
    descriptionKey: 'seo.memory.desc',
    image: 'memory',
  },
  polls: {
    path: '/polls',
    titleKey: 'screen.polls.title',
    // "שמונה ויכוחים. פתק אחד. הקול שלך." — already a real sentence, on voice.
    descriptionKey: 'screen.polls.sub',
    image: 'polls',
  },
  goal: {
    path: '/goal',
    titleKey: 'screen.goal.title',
    descriptionKey: 'seo.goal.desc',
    image: 'goal',
  },
  tik: { path: '/tik', titleKey: 'screen.tik.title', descriptionKey: 'tik.lede', image: 'tik' },
  derby: {
    path: '/derby',
    titleKey: 'screen.derby.title',
    descriptionKey: 'hate.lede',
    image: 'derby',
  },
  'derby-file': {
    path: '/derby/file',
    titleKey: 'screen.file.title',
    descriptionKey: 'seo.derbyFile.desc',
    image: 'derby-file',
  },
  timeline: {
    path: '/timeline',
    titleKey: 'screen.timeline.title',
    descriptionKey: 'seo.timeline.desc',
    image: 'timeline',
  },
  ussishkin: {
    path: '/ussishkin',
    titleKey: 'screen.ussishkin.title',
    descriptionKey: 'uss.lede',
    image: 'ussishkin',
  },
  life: {
    path: '/life',
    titleKey: 'life.title',
    descriptionKey: 'life.sub',
    image: 'life',
  },
}

function buildMetadata(title: string, description: string, path: string, image: string): Metadata {
  const url = `${SITE_URL}${path}`
  const imageUrl = `${SITE_URL}/og/${image}.png`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'The Worker',
      locale: 'he_IL',
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

/**
 * One gate, one call: `export const metadata = gateMetadata('xi')`.
 *
 * Covers every gate, including the three this agent may not edit directly
 * (`polls`, `derby`, `derby-file`) and `life` — their entries are here so the file
 * that owns each route only has to import and call this, never re-type the copy.
 */
export function gateMetadata(slug: GateSeoSlug): Metadata {
  const entry = GATE_SEO[slug]
  return buildMetadata(t(entry.titleKey), t(entry.descriptionKey), entry.path, entry.image)
}

/**
 * `/trivia/[topic]` is dynamic — same shape, built from the topic's own spec
 * (`lib/game/topics.ts`) rather than a fixed slug, so a new topic needs no change here.
 */
export function topicMetadata(titleKey: MessageKey, descriptionKey: MessageKey, topic: string): Metadata {
  return buildMetadata(t(titleKey), t(descriptionKey), `/trivia/${topic}`, 'trivia')
}
