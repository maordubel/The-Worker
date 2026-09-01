/**
 * נושאי הטריוויה — the five ways in.
 *
 * One bank behind five doors. Maor asked for a general round that mixes everything
 * INCLUDING basketball, and four narrow rounds: terrace songs, European nights, shirt
 * numbers, player chants. A supporter who only wants to argue about Europe should not
 * have to sit through kit questions to get there.
 *
 * **On rule 14.** The house rule is that football and basketball never mix, and this
 * does not break it — it makes explicit what the rule was always protecting. The danger
 * was never that the two sports appear in one SESSION; it was that a football question
 * gets a basketball distractor, or that "how many championships" silently answers with
 * the wrong sport's count. So every question carries a `sport`, every question is
 * internally single-sport, and a TOPIC decides which sports are in scope. `general`
 * admits both because the owner of the club's basketball wing asked for it; every other
 * topic is football, and `mixed` never means mixed WITHIN a question.
 *
 * Pure and client-safe — the picker screen imports this, and `lib/game/trivia.ts` is
 * server-only.
 */

export const TOPICS = ['general', 'terrace-songs', 'europe', 'numbers', 'player-songs'] as const
export type Topic = (typeof TOPICS)[number]
export const DEFAULT_TOPIC: Topic = 'general'

export function isTopic(value: string | undefined): value is Topic {
  return value !== undefined && (TOPICS as readonly string[]).includes(value)
}

export type TopicSpec = {
  slug: Topic
  /** message keys — no user-facing string lives in code (rule 10) */
  titleKey: string
  bladeKey: string
  /** which sports may appear in the round. Never mixed inside one question. */
  sports: Array<'football' | 'basketball'>
  /**
   * Which templates feed this topic. `null` means "everything" — only `general` gets
   * that, and it is why general is the widest bank rather than a leftovers bin.
   */
  templates: string[] | null
}

/**
 * The templates each narrow topic draws on.
 *
 * A narrow topic that cannot fill a round is worse than no topic at all, so the picker
 * reads the real count per topic and says so — see `topicCounts()` in `trivia.ts`. Where
 * a bank is thin the screen prints the number rather than pretending.
 */
export const TOPIC_SPECS: Record<Topic, TopicSpec> = {
  general: {
    slug: 'general',
    titleKey: 'topic.general',
    bladeKey: 'topic.general.blade',
    sports: ['football', 'basketball'],
    templates: null,
  },
  'terrace-songs': {
    slug: 'terrace-songs',
    titleKey: 'topic.terraceSongs',
    bladeKey: 'topic.terraceSongs.blade',
    sports: ['football'],
    templates: ['song-origin', 'song-tune', 'song-era', 'song-about', 'fan-culture'],
  },
  europe: {
    slug: 'europe',
    titleKey: 'topic.europe',
    bladeKey: 'topic.europe.blade',
    sports: ['football'],
    templates: [
      'euro-opponent',
      'euro-round',
      'euro-season',
      'euro-aggregate',
      'euro-venue',
      'euro-milestone',
      'goal-opponent',
      'goal-competition',
      'goal-scorer',
      'goal-assist',
      'goal-title',
      'opponent',
      'score',
      'venue',
      'travelling',
    ],
  },
  numbers: {
    slug: 'numbers',
    titleKey: 'topic.numbers',
    bladeKey: 'topic.numbers.blade',
    sports: ['football'],
    templates: ['shirt-number', 'which-number', 'shirt-multi', 'number-season', 'number-era'],
  },
  'player-songs': {
    slug: 'player-songs',
    titleKey: 'topic.playerSongs',
    bladeKey: 'topic.playerSongs.blade',
    sports: ['football'],
    templates: ['player-song', 'song-tune-player', 'song-artist'],
  },
}

export function topicSpec(topic: Topic): TopicSpec {
  return TOPIC_SPECS[topic]
}
