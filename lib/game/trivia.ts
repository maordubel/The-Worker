import 'server-only'

import {
  archive,
  footballPeople,
  nameOf,
  opponentOf,
  rng,
  shuffle,
  type Sourced,
} from './archive'

/**
 * Question generation.
 *
 * Templates, not hand-written questions: ten SQL-shaped rules over the archive yield
 * every question in the game, and every one of them arrives with the source that backs
 * it. Only facts at or above the confidence floor reach here — the floor is applied in
 * `archive.ts`, so a template cannot accidentally bypass it.
 *
 * The correct answer NEVER leaves this module toward the client. `deal()` returns a
 * public shape with the options shuffled and no `isCorrect`; `grade()` re-derives the
 * answer from the same seed on the server.
 */

export type TriviaQuestion = {
  id: string
  template: string
  prompt: string
  options: string[]
  source: { title: string; url: string | null; confidence: number }
  /** the archive row this came from, for the explanation after grading */
  explanation: string
}

type Built = TriviaQuestion & { correct: string }

type Template = {
  slug: string
  /** at most one question per round may come from a capped template */
  cap?: number
  build: (random: () => number) => Built[]
}

function pick<T>(items: readonly T[], random: () => number): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(random() * items.length)]
}

/** Distractors are always real values of the same kind — never invented, never absurd. */
function withDistractors(correct: string, pool: readonly string[], random: () => number): string[] {
  const others = shuffle(
    [...new Set(pool)].filter((value) => value !== correct),
    random,
  ).slice(0, 3)
  return shuffle([correct, ...others], random)
}

function sourceOf(row: Sourced) {
  return { title: row.sourceTitle, url: row.sourceUrl, confidence: row.confidence }
}

const SEASON_POOL = () => archive.trophies.map((row) => row.seasonLabel)

const TEMPLATES: Template[] = [
  {
    slug: 'scorer',
    build: (random) =>
      archive.matchEvents
        .filter((event) => event.type === 'goal' && event.personSlug !== null)
        .map((event) => {
          const match = archive.matches.find(
            (row) =>
              [
                row.seasonLabel,
                row.competitionSlug,
                row.homeClubSlug,
                row.awayClubSlug,
                row.stage ?? '',
              ].join('|') === event.matchNaturalKey,
          )
          if (!match) return null
          const correct = nameOf.person(event.personSlug as string)
          return {
            id: `scorer:${event.matchNaturalKey}:${event.minute}`,
            template: 'scorer',
            prompt: `מי הבקיע בדקה ה־${event.minute} מול ${nameOf.club(opponentOf(match))} בעונת ${match.seasonLabel}?`,
            // Football distractors only — never an Ussishkin name in a football question.
            options: withDistractors(
              correct,
              footballPeople.map((person) => person.fullNameHe),
              random,
            ),
            correct,
            source: sourceOf(event),
            explanation: `${correct} · ${nameOf.competition(match.competitionSlug)} · ${match.playedOn ?? match.seasonLabel}`,
          }
        })
        .filter((question): question is Built => question !== null),
  },
  {
    slug: 'trophy-season',
    build: (random) =>
      archive.trophies
        .filter((row) => row.result === 'won')
        .map((row) => ({
          id: `trophy:${row.competitionSlug}:${row.seasonLabel}`,
          template: 'trophy-season',
          prompt: `באיזו עונה זכתה הפועל תל אביב ב${nameOf.competition(row.competitionSlug)}?`,
          options: withDistractors(row.seasonLabel, SEASON_POOL(), random),
          correct: row.seasonLabel,
          source: sourceOf(row),
          explanation: `${nameOf.competition(row.competitionSlug)} · ${row.seasonLabel}`,
        })),
  },
  {
    slug: 'kit-maker',
    build: (random) =>
      archive.kitSupply
        .filter((row) => row.fromLabel !== null)
        .map((row) => {
          const correct = nameOf.manufacturer(row.manufacturerSlug)
          return {
            id: `kit:${row.manufacturerSlug}:${row.fromLabel}`,
            template: 'kit-maker',
            prompt: `מי סיפק את המדים של הפועל תל אביב בעונת ${row.fromLabel}?`,
            options: withDistractors(
              correct,
              archive.manufacturers.map((maker) => maker.nameHe),
              random,
            ),
            correct,
            source: sourceOf(row),
            explanation: `${correct} · ${row.fromLabel}${row.toLabel ? `–${row.toLabel}` : ''}`,
          }
        }),
  },
  {
    slug: 'sponsor',
    build: (random) =>
      archive.sponsorDeals
        .filter((row) => row.fromLabel !== null)
        .map((row) => {
          const correct = nameOf.sponsor(row.sponsorSlug)
          return {
            id: `sponsor:${row.sponsorSlug}:${row.fromLabel}`,
            template: 'sponsor',
            prompt: `מי היה נותן החסות על החולצה בעונת ${row.fromLabel}?`,
            options: withDistractors(
              correct,
              archive.sponsors.map((sponsor) => sponsor.nameHe),
              random,
            ),
            correct,
            source: sourceOf(row),
            explanation: `${correct} · ${row.fromLabel}${row.toLabel ? `–${row.toLabel}` : ''}`,
          }
        }),
  },
  {
    slug: 'score',
    build: (random) =>
      archive.matches
        .filter((row) => row.homeScore !== null && row.awayScore !== null)
        .map((row) => {
          const correct = `${row.homeScore}:${row.awayScore}`
          const pool = archive.matches
            .filter((other) => other.homeScore !== null)
            .map((other) => `${other.homeScore}:${other.awayScore}`)
          return {
            id: `score:${row.seasonLabel}:${row.homeClubSlug}:${row.awayClubSlug}`,
            template: 'score',
            prompt: `מה הייתה התוצאה ב${nameOf.club(row.homeClubSlug)} מול ${nameOf.club(row.awayClubSlug)}, ${row.stage ?? row.seasonLabel}?`,
            options: withDistractors(correct, pool, random),
            correct,
            source: sourceOf(row),
            explanation: `${row.playedOn ?? row.seasonLabel} · ${nameOf.competition(row.competitionSlug)}`,
          }
        }),
  },
  {
    slug: 'crest',
    build: (random) =>
      archive.crests
        .filter((row) => row.changeHe !== null)
        .map((row) => ({
          id: `crest:${row.fromYear}`,
          template: 'crest',
          prompt: `באיזו שנה ${row.changeHe}?`,
          options: withDistractors(
            String(row.fromYear),
            archive.crests.map((crest) => String(crest.fromYear)),
            random,
          ),
          correct: String(row.fromYear),
          source: sourceOf(row),
          explanation: `${row.nameHe} · ${row.fromYear}${row.toYear ? `–${row.toYear}` : ''}`,
        })),
  },
  {
    slug: 'venue',
    build: (random) =>
      archive.matches
        .filter((row) => row.venueSlug !== null)
        .map((row) => {
          const correct = nameOf.venue(row.venueSlug as string)
          return {
            id: `venue:${row.seasonLabel}:${row.awayClubSlug}`,
            template: 'venue',
            prompt: `היכן נערך ${nameOf.club(row.homeClubSlug)} מול ${nameOf.club(row.awayClubSlug)}, ${row.stage ?? row.seasonLabel}?`,
            options: withDistractors(
              correct,
              archive.venues.map((venue) => venue.nameHe),
              random,
            ),
            correct,
            source: sourceOf(row),
            explanation: `${correct} · ${row.playedOn ?? row.seasonLabel}`,
          }
        }),
  },
  {
    slug: 'ussishkin',
    // CLAUDE.md rule 16: at most one per round, only where a source names him,
    // never as a distractor. The Ussishkin story does not need help.
    cap: 1,
    build: (random) =>
      archive.associationRoles
        .filter((row) => row.roleHe === 'מייסד')
        .map((row) => ({
          id: `ussishkin:${row.personNameHe}`,
          template: 'ussishkin',
          prompt: 'מי רשם את הפועל אוסישקין בליגה עם הקמת העמותה ב־2007?',
          options: shuffle(
            [
              row.personNameHe,
              ...archive.associationRoles
                .filter((other) => other.personNameHe !== row.personNameHe)
                .map((other) => other.personNameHe)
                .slice(0, 3),
            ],
            random,
          ),
          correct: row.personNameHe,
          source: sourceOf(row),
          explanation: `${row.personNameHe} · חבר הנהלה 2007–2012`,
        })),
  },
]

/* ------------------------------------------------------------------- rounds */

export const ROUND_LENGTH = 10

function buildRound(seed: number): Built[] {
  const random = rng(seed)
  const pool: Built[] = []
  const capped: Built[] = []

  for (const template of TEMPLATES) {
    const built = template.build(random)
    if (template.cap !== undefined) {
      const one = pick(built, random)
      if (one) capped.push(one)
      continue
    }
    pool.push(...built)
  }

  // Deduplicate by id, then spread across templates so a round is not all one kind.
  const unique = [...new Map(pool.map((question) => [question.id, question])).values()]
  const byTemplate = new Map<string, Built[]>()
  for (const question of shuffle(unique, random)) {
    const list = byTemplate.get(question.template) ?? []
    list.push(question)
    byTemplate.set(question.template, list)
  }

  const round: Built[] = []
  let exhausted = false
  while (round.length < ROUND_LENGTH - capped.length && !exhausted) {
    exhausted = true
    for (const list of byTemplate.values()) {
      const next = list.shift()
      if (!next) continue
      exhausted = false
      round.push(next)
      if (round.length >= ROUND_LENGTH - capped.length) break
    }
  }

  return shuffle([...round, ...capped.slice(0, 1)], random).slice(0, ROUND_LENGTH)
}

/** How many questions the archive can currently produce. Shown honestly in the UI. */
export function availableQuestionCount(): number {
  const random = rng(1)
  const all = TEMPLATES.flatMap((template) => template.build(random))
  return new Set(all.map((question) => question.id)).size
}

/** Public shape — no correct answer, ever. */
export function deal(seed: number, index: number): TriviaQuestion | null {
  const question = buildRound(seed)[index]
  if (!question) return null
  const { correct: _correct, ...rest } = question
  return rest
}

export type Verdict = {
  correct: boolean
  correctAnswer: string
  explanation: string
  source: { title: string; url: string | null; confidence: number }
}

/** Grading happens here, on the server, from the seed. The client is never trusted. */
export function grade(seed: number, index: number, answer: string): Verdict | null {
  const question = buildRound(seed)[index]
  if (!question) return null
  return {
    correct: question.correct === answer,
    correctAnswer: question.correct,
    explanation: question.explanation,
    source: question.source,
  }
}
