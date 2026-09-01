import { SITE_URL } from '@/lib/brand'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * מה כתוב בשיתוף — the text that travels with a share, and where it lands.
 *
 * A share is not a screenshot with a link stapled to it. The message has to work when
 * it arrives cold in a group chat between two other conversations: it has to say what
 * happened, dare the reader to beat it, and hand them the exact same round rather than
 * a homepage. That last part is the whole engine — `?seed=` makes a result
 * CHALLENGEABLE instead of merely announced, and a challenge is the only kind of link a
 * football supporter forwards.
 */
export type ShareKind = 'hate' | 'trivia' | 'kit' | 'lineup' | 'memory' | 'goal' | 'timeline'

const ROUTE: Record<ShareKind, string> = {
  hate: '/derby',
  trivia: '/trivia',
  kit: '/kits/build',
  lineup: '/lineup',
  memory: '/memory',
  goal: '/goal',
  timeline: '/timeline',
}

/** The link a share sends people to — the same round, not the front door. */
export function challengeUrl(kind: ShareKind, seed: string | number): string {
  return `${SITE_URL}${ROUTE[kind]}?seed=${seed}&from=share`
}

/**
 * The WhatsApp body. Hebrew, three short lines, then the link on its own line so the
 * client renders a preview card rather than burying it mid-sentence.
 */
export function whatsappText(kind: ShareKind, vars: Record<string, string>, seed: string | number) {
  const key = `share.msg.${kind}` as MessageKey
  return `${t(key, vars)}\n\n${challengeUrl(kind, seed)}`
}

export function whatsappHref(kind: ShareKind, vars: Record<string, string>, seed: string | number) {
  return `https://wa.me/?text=${encodeURIComponent(whatsappText(kind, vars, seed))}`
}

export function telegramHref(kind: ShareKind, vars: Record<string, string>, seed: string | number) {
  const url = challengeUrl(kind, seed)
  const key = `share.msg.${kind}` as MessageKey
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(t(key, vars))}`
}
