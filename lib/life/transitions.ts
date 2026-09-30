/**
 * סרטוני מעבר — the eight short clips Maor supplied on 30.9.2026.
 *
 * A clip is a CUT, not a fact: it says nothing about the match it leads into. Each one is
 * de-yellowed frame by frame and encoded lossless VP9 (rule 61 — the yellow is measured on
 * the DECODED frames, and is zero), 270×480 at 24fps so eight of them weigh 29MB together.
 * A clip that cannot play is simply skipped: the card underneath is complete without it.
 */
export type TransitionKey =
  | 'enter-stadium-a'
  | 'enter-stadium-b'
  | 'enter-stand'
  | 'take-ticket'
  | 'generic'
  | 'kobi-friends-road'
  | 'kobi-confetti'
  | 'player-celebrates'

export const TRANSITIONS: Record<TransitionKey, { src: string; ms: number }> = {
  'enter-stadium-a': { src: '/life/transitions/enter-stadium-a.webm', ms: 2917 },
  'enter-stadium-b': { src: '/life/transitions/enter-stadium-b.webm', ms: 1959 },
  'enter-stand': { src: '/life/transitions/enter-stand.webm', ms: 2417 },
  'take-ticket': { src: '/life/transitions/take-ticket.webm', ms: 1750 },
  generic: { src: '/life/transitions/generic.webm', ms: 1417 },
  'kobi-friends-road': { src: '/life/transitions/kobi-friends-road.webm', ms: 2084 },
  'kobi-confetti': { src: '/life/transitions/kobi-confetti.webm', ms: 2292 },
  'player-celebrates': { src: '/life/transitions/player-celebrates.webm', ms: 1834 },
}
