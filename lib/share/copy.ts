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
export type ShareKind =
  | 'hate'
  | 'file'
  | 'trivia'
  | 'kit'
  | 'xi'
  | 'member'
  | 'lineup'
  | 'memory'
  | 'goal'
  | 'timeline'
  | 'polls'

const ROUTE: Record<ShareKind, string> = {
  hate: '/derby',
  file: '/derby/file',
  trivia: '/trivia',
  kit: '/kits/build',
  xi: '/xi',
  member: '/tik',
  lineup: '/lineup',
  memory: '/memory',
  goal: '/goal',
  timeline: '/timeline',
  polls: '/polls',
}

/** The link a share sends people to — the same round, not the front door. */
/**
 * A gate with no round has no seed to hand over.
 *
 * Every other share here is a dare — the link reproduces the identical round. The polls
 * wing has no round: there is nothing to reproduce and nothing to beat, and a `?seed=1`
 * stapled to it would be a parameter the page ignores, which is the kind of small lie
 * that makes a URL untrustworthy to read.
 */
const SEEDLESS: ReadonlySet<ShareKind> = new Set<ShareKind>(['polls', 'xi', 'member'])

/*
 * Two more joined `polls` on 17.9.2026, and both were live defects rather than tidying.
 *
 * · **`xi`** did not exist. The all-time XI shared as `kind="lineup"` with a hand-written
 *   `params={{ s: '1' }}`, so every card in the world handed its reader
 *   `/xi?seed=1&from=share` — a parameter `/xi` does not read, on a screen that deals no
 *   round. The recipient got an empty pitch and a promise of a round that was never there.
 * · **`member`** replaces `crest`, which pointed at `/crest` — a TOMBSTONE that
 *   `redirect('/')`s. The member card is the one artefact in this app that is purely
 *   somebody's own, and its share button sent every reader to the front door.
 *
 * Neither route reads a seed, so neither gets one. That is the same sentence the polls
 * wing earned: a parameter the page ignores is a small lie in a URL people read.
 */

/**
 * Two things a challenge link has to carry that it did not.
 *
 *   · **The topic.** `trivia` points at `/trivia`, which is the PICKER — a route that
 *     reads no seed. A trivia challenge therefore dropped the recipient on a wall of
 *     five topics with the round it was bragging about nowhere in sight. The topic is a
 *     route segment (`/trivia/europe`), so `route` overrides the gate's own path for
 *     exactly that case. `/xi` needs it for the same reason in reverse: its card shares
 *     as `kind="lineup"`, which would send an all-time XI to the graded match quiz.
 *   · **The cursor.** With rotation on, a round is addressed by seed AND cursor
 *     (`lib/rotation/deck.ts`); a link carrying only the seed reproduces the first
 *     round of that deck rather than the one that was played.
 *
 * This is the one link in the app that is deliberately NOT re-rolled on arrival
 * (`lib/rotation/round.ts`) — the point of a duel is that both people get the same
 * questions.
 */
export function challengeUrl(
  kind: ShareKind,
  seed: string | number,
  cursor: string | number = 0,
  route?: string,
): string {
  const path = route ?? ROUTE[kind]
  if (SEEDLESS.has(kind)) return `${SITE_URL}${path}?from=share`
  const r = Number(cursor) > 0 ? `&r=${cursor}` : ''
  return `${SITE_URL}${path}?seed=${seed}${r}&from=share`
}

/**
 * The WhatsApp body. Hebrew, three short lines, then the link on its own line so the
 * client renders a preview card rather than burying it mid-sentence.
 */
export function whatsappText(
  kind: ShareKind,
  vars: Record<string, string>,
  seed: string | number,
  cursor: string | number = 0,
  route?: string,
) {
  const key = `share.msg.${kind}` as MessageKey
  return `${t(key, vars)}\n\n${challengeUrl(kind, seed, cursor, route)}`
}

export function whatsappHref(
  kind: ShareKind,
  vars: Record<string, string>,
  seed: string | number,
  cursor: string | number = 0,
  route?: string,
) {
  return `https://wa.me/?text=${encodeURIComponent(whatsappText(kind, vars, seed, cursor, route))}`
}

export function telegramHref(
  kind: ShareKind,
  vars: Record<string, string>,
  seed: string | number,
  cursor: string | number = 0,
  route?: string,
) {
  const url = challengeUrl(kind, seed, cursor, route)
  const key = `share.msg.${kind}` as MessageKey
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(t(key, vars))}`
}
