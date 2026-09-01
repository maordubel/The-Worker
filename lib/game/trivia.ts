import 'server-only'

import { matchLine } from '@/components/ui/Num'

import { currentSeasonStartYear, seasonsInSpell, spellCoversSeason } from './seasons'
import type { Difficulty } from './score'

import {
  US,
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

/**
 * What the client receives. Deliberately WITHOUT the source: provenance governs which
 * facts may become questions, and it lives in the archive, the ingest report and the
 * data-quality views — it is not furniture on a game screen. Maor asked for the source
 * and confidence lines to come off the UI; the gate they enforce is untouched.
 */
export type TriviaQuestion = {
  id: string
  template: string
  prompt: string
  /** exactly four, always — see OPTION_COUNT */
  options: string[]
  /** 1 (a casual fan knows this) to 5 (only the archive knows this) */
  difficulty: Difficulty
  /** the archive row this came from, for the explanation after grading */
  explanation: string
}

type SourceRef = { title: string; url: string | null; confidence: number }

type Built = TriviaQuestion & { correct: string; source: SourceRef }

/**
 * How hard each template is. This is a judgement about the QUESTION, not a claim about
 * history, so it is set here rather than carried on the data: "who supplies the kit
 * this season" is a different kind of ask from "who declared himself a doctor of
 * physics in his election manifesto", even though both facts are equally verified.
 */
const DIFFICULTY: Record<string, Difficulty> = {
  'kit-maker': 2,
  sponsor: 3,
  'trophy-season': 2,
  double: 2,
  'trophy-count': 3,
  score: 3,
  venue: 2,
  opponent: 2,
  'moment-year': 3,
  crest: 4,
  'crest-era': 4,
  scorer: 4,
  'election-top': 4,
  'election-turnout': 4,
  'election-votes': 5,
  'election-manifesto': 5,
  'ussishkin-replacement': 5,
  'founder-rank': 4,
  ussishkin: 3,
  'shirt-number': 4,
  'which-number': 3,
  'player-song': 5,
  'song-origin': 4,
  attendance: 4,
  travelling: 5,
  'sponsor-year': 3,
  'maker-year': 2,
  'fan-culture': 5,
}

type Template = {
  slug: string
  /**
   * Templates in a capped group contribute at most ONE question per round between
   * them. The capped group is `founder`: rule 16 allows the founder to be the ANSWER
   * only where a source names him, once per round, and never a distractor. Questions
   * about the association that he is not the answer to are ordinary questions.
   */
  cappedGroup?: string
  /**
   * A template does not set its own difficulty — `buildRound` stamps it from
   * DIFFICULTY, so a new template cannot ship without one.
   */
  build: (random: () => number) => Unrated[]
}

type Unrated = Omit<Built, 'difficulty'>

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

/** "ב" + "הבחירות" is one ה too many. Drop the article when a preposition supplies it. */
function stripThe(title: string): string {
  return title.startsWith('ה') ? title.slice(1) : title
}

function sourceOf(row: Sourced) {
  return { title: row.sourceTitle, url: row.sourceUrl, confidence: row.confidence }
}

const SEASON_POOL = () => archive.trophies.map((row) => row.seasonLabel)

/**
 * The founder's name is never a distractor (CLAUDE.md rule 16). It may only appear as
 * the answer to a question a source supports, so every pool filters it out and the
 * template that needs it puts it in deliberately.
 */
const FOUNDER =
  archive.associationRoles.find((role) => role.roleHe === 'מייסד')?.personNameHe ?? null

/**
 * Everyone the association's own records name — role holders and every election
 * candidate, winners and losers alike. The founder is filtered out of every pool:
 * he is an answer where a source names him, never a decoy (rule 16).
 */
const ASSOCIATION_NAMES = () =>
  [
    ...new Set([
      ...archive.associationRoles.map((role) => role.personNameHe),
      ...archive.electionCandidates.map((candidate) => candidate.personNameHe),
    ]),
  ].filter((name) => name !== FOUNDER)

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
    // Only a competition the club won ONCE can be asked this way. Sixteen State Cups
    // means sixteen right answers, and the ambiguity guard drops the lot — this filter
    // says so out loud instead of relying on it.
    slug: 'trophy-season',
    build: (random) => {
      const won = archive.trophies.filter((row) => row.result === 'won')
      const timesWon = new Map<string, number>()
      for (const row of won) {
        timesWon.set(row.competitionSlug, (timesWon.get(row.competitionSlug) ?? 0) + 1)
      }
      return won
        .filter((row) => timesWon.get(row.competitionSlug) === 1)
        .map((row) => ({
          id: `trophy:${row.competitionSlug}:${row.seasonLabel}`,
          template: 'trophy-season',
          prompt: `הפועל תל אביב זכתה ב${nameOf.competition(row.competitionSlug)} פעם אחת בלבד. באיזו עונה?`,
          options: withDistractors(row.seasonLabel, SEASON_POOL(), random),
          correct: row.seasonLabel,
          source: sourceOf(row),
          explanation: `${nameOf.competition(row.competitionSlug)} · ${row.seasonLabel}`,
        }))
    },
  },
  {
    // The double seasons, from the other direction: the season is given, the second
    // trophy is the question. One answer, and it teaches the pairing.
    slug: 'double',
    build: (random) => {
      const won = archive.trophies.filter((row) => row.result === 'won')
      const bySeason = new Map<string, typeof won>()
      for (const row of won) {
        bySeason.set(row.seasonLabel, [...(bySeason.get(row.seasonLabel) ?? []), row])
      }
      const out: Unrated[] = []
      for (const [season, rows] of bySeason) {
        if (rows.length !== 2) continue
        const league = rows.find((row) => row.competitionSlug === 'ליגת-העל')
        const other = rows.find((row) => row.competitionSlug !== 'ליגת-העל')
        if (!league || !other) continue
        const correct = nameOf.competition(other.competitionSlug)
        out.push({
          id: `double:${season}`,
          template: 'double',
          prompt: `בעונת ${season} עשתה הפועל תל אביב דאבל. באיזה תואר זכתה מלבד האליפות?`,
          options: withDistractors(
            correct,
            archive.competitions.filter((row) => row.sport !== 'basketball').map((row) => row.nameHe),
            random,
          ),
          correct,
          source: sourceOf(other),
          explanation: `${season} · אליפות ו${correct}`,
        })
      }
      return out
    },
  },
  {
    // How many, for competitions whose count is not itself disputed. The championship
    // count is (13 · 12 · 14 depending on the counter) and is therefore never asked.
    slug: 'trophy-count',
    build: (random) => {
      const won = archive.trophies.filter((row) => row.result === 'won')
      const timesWon = new Map<string, number>()
      for (const row of won) {
        timesWon.set(row.competitionSlug, (timesWon.get(row.competitionSlug) ?? 0) + 1)
      }
      // The league title count is the one the sources fight over (13 · 12 · 14). The
      // conflict is recorded, so the question is not asked — for that competition only.
      const CONTESTED_COUNT: Record<string, string> = { 'ליגת-העל': 'championship_count' }

      const out: Unrated[] = []
      for (const [slug, count] of timesWon) {
        if (count < 5) continue
        const conflictField = CONTESTED_COUNT[slug]
        if (conflictField !== undefined && isContested('club', conflictField)) continue
        const row = won.find((trophy) => trophy.competitionSlug === slug)
        if (!row) continue
        const correct = String(count)
        out.push({
          id: `trophy-count:${slug}`,
          template: 'trophy-count',
          prompt: `בכמה פעמים זכתה הפועל תל אביב ב${nameOf.competition(slug)}?`,
          options: withDistractors(
            correct,
            [count - 2, count - 1, count + 1, count + 2, count + 4].map(String),
            random,
          ),
          correct,
          source: sourceOf(row),
          explanation: `${nameOf.competition(slug)} · ${count}`,
        })
      }
      return out
    },
  },
  {
    // Every season a spell covers, not only the one it starts in — a supply spell is a
    // range, and the seasons inside it are exactly as verified as its first.
    slug: 'kit-maker',
    build: (random) => {
      const openThrough = currentSeasonStartYear()
      const out: Unrated[] = []
      for (const spell of archive.kitSupply) {
        const correct = nameOf.manufacturer(spell.manufacturerSlug)
        for (const season of seasonsInSpell(spell, openThrough)) {
          out.push({
            id: `kit:${spell.manufacturerSlug}:${season}`,
            template: 'kit-maker',
            prompt: `איזה יצרן חתום על מדי הפועל תל אביב בעונת ${season}?`,
            options: withDistractors(
              correct,
              archive.manufacturers.map((maker) => maker.nameHe),
              random,
            ),
            correct,
            source: sourceOf(spell),
            explanation: `${correct} · ${spell.fromLabel}${spell.toLabel ? `–${spell.toLabel}` : ' ואילך'}`,
          })
        }
      }
      return out
    },
  },
  {
    // Competition-scoped, because 2010/11 carried Keter in the Champions League and
    // Bonei HaTichon in the league. A season with two unscoped sponsors — 2019/20, where
    // Arkia ended early and Hachshara came in mid-season — produces two questions with
    // the same prompt and different answers, and the ambiguity guard removes both.
    slug: 'sponsor',
    build: (random) => {
      const openThrough = currentSeasonStartYear()
      const seasons = new Set(
        archive.kitSupply.flatMap((spell) => seasonsInSpell(spell, openThrough)),
      )
      const out: Unrated[] = []
      for (const deal of archive.sponsorDeals) {
        const correct = nameOf.sponsor(deal.sponsorSlug)
        const where = deal.competitionSlug
          ? `ב${nameOf.competition(deal.competitionSlug)} `
          : ''
        for (const season of seasons) {
          if (!spellCoversSeason(deal, season)) continue
          out.push({
            id: `sponsor:${deal.sponsorSlug}:${season}:${deal.competitionSlug ?? 'all'}`,
            template: 'sponsor',
            prompt: `איזו חברה התנוססה על חזה החולצה ${where}בעונת ${season}?`,
            options: withDistractors(
              correct,
              archive.sponsors.map((sponsor) => sponsor.nameHe),
              random,
            ),
            correct,
            source: sourceOf(deal),
            explanation: deal.noteHe ?? `${correct} · ${season}`,
          })
        }
      }
      return out
    },
  },
  {
    slug: 'score',
    build: (random) =>
      archive.matches
        .filter((row) => row.homeScore !== null && row.awayScore !== null)
        .map((row) => {
          // NOT "what was the score" — a bare "2:1" between two Hebrew names cannot say
          // whose two it is (see matchLine). Asking for one side's goals is unambiguous
          // in any direction, and it is the same fact.
          const us = row.homeClubSlug === US ? 'home' : 'away'
          const ours = us === 'home' ? row.homeScore : row.awayScore
          const correct = String(ours)
          const homeAway = us === 'home' ? 'בבית' : 'בחוץ'
          return {
            id: `score:${row.seasonLabel}:${row.homeClubSlug}:${row.awayClubSlug}`,
            template: 'score',
            prompt: `כמה שערים הבקיעה הפועל תל אביב ${homeAway} מול ${nameOf.club(opponentOf(row))}, ${row.stage ?? row.seasonLabel}?`,
            options: withDistractors(correct, ['0', '1', '2', '3', '4', '5'], random),
            correct,
            source: sourceOf(row),
            explanation: `${matchLine(nameOf.club(row.homeClubSlug), row.homeScore, nameOf.club(row.awayClubSlug), row.awayScore)} · ${nameOf.competition(row.competitionSlug)} · ${row.playedOn ?? row.seasonLabel}`,
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
    slug: 'moment-year',
    build: (random) =>
      archive.moments
        .filter((row) => row.happenedOn !== null && row.category !== 'club')
        .map((row) => {
          const correct = (row.happenedOn as string).slice(0, 4)
          return {
            id: `moment:${row.slug}`,
            template: 'moment-year',
            prompt: `באיזו שנה קרה זה — ${row.titleHe}?`,
            options: withDistractors(
              correct,
              archive.moments
                .filter((other) => other.happenedOn !== null)
                .map((other) => (other.happenedOn as string).slice(0, 4)),
              random,
            ),
            correct,
            source: sourceOf(row),
            explanation: row.bodyHe.slice(0, 160),
          }
        }),
  },
  {
    slug: 'opponent',
    build: (random) =>
      archive.matches
        .filter((row) => row.stage !== null)
        .map((row) => {
          const correct = nameOf.club(opponentOf(row))
          return {
            id: `opponent:${row.seasonLabel}:${row.stage}`,
            template: 'opponent',
            prompt: `מי הייתה היריבה ב${row.stage}, ${nameOf.competition(row.competitionSlug)} ${row.seasonLabel}?`,
            options: withDistractors(
              correct,
              archive.clubs
                .filter((club) => !club.isUs && club.sport !== 'basketball')
                .map((club) => club.nameHe),
              random,
            ),
            correct,
            source: sourceOf(row),
            explanation: `${matchLine(nameOf.club(row.homeClubSlug), row.homeScore, nameOf.club(row.awayClubSlug), row.awayScore)} · ${row.playedOn ?? row.seasonLabel}`,
          }
        }),
  },
  {
    slug: 'crest-era',
    build: (random) =>
      archive.crests
        .filter((row) => row.toYear !== null)
        .map((row) => {
          const correct = row.nameHe
          return {
            id: `crest-era:${row.fromYear}`,
            template: 'crest-era',
            prompt: `איזה שלב בסמל המועדון נמשך מ־${row.fromYear} עד ${row.toYear}?`,
            options: withDistractors(
              correct,
              archive.crests.map((crest) => crest.nameHe),
              random,
            ),
            correct,
            source: sourceOf(row),
            explanation: row.changeHe ?? `${row.fromYear}–${row.toYear}`,
          }
        }),
  },
  /* -------------------------------------------------------- the shirt archive
   *
   * "Who wore 11 in 2019/20" is the question the corpus was always going to be best
   * at, and it only works because the season is part of the key. A season with two
   * holders — a mid-season transfer — is a real fact and a broken question, so those
   * pairs are dropped here rather than resolved.
   */
  {
    slug: 'shirt-number',
    build: (random) => {
      const byPair = new Map<string, string[]>()
      for (const row of archive.shirtNumbers) {
        const key = `${row.shirtNumber}|${row.seasonLabel}`
        byPair.set(key, [...(byPair.get(key) ?? []), row.personNameHe])
      }
      const out: Unrated[] = []
      for (const row of archive.shirtNumbers) {
        const holders = byPair.get(`${row.shirtNumber}|${row.seasonLabel}`) ?? []
        if (holders.length !== 1) continue
        out.push({
          id: `shirt:${row.shirtNumber}:${row.seasonLabel}`,
          template: 'shirt-number',
          prompt: `מי לבש את חולצה מספר ${row.shirtNumber} בעונת ${row.seasonLabel}?`,
          options: withDistractors(
            row.personNameHe,
            archive.shirtNumbers.map((other) => other.personNameHe),
            random,
          ),
          correct: row.personNameHe,
          source: sourceOf(row),
          explanation: `${row.personNameHe} · מספר ${row.shirtNumber} · ${row.seasonLabel}`,
        })
      }
      return out
    },
  },
  {
    // The same fact from the other end: the player is given, the number is the answer.
    slug: 'which-number',
    build: (random) => {
      const numbers = [...new Set(archive.shirtNumbers.map((row) => String(row.shirtNumber)))]
      const byPerson = new Map<string, Set<number>>()
      for (const row of archive.shirtNumbers) {
        const seen = byPerson.get(row.personNameHe) ?? new Set<number>()
        seen.add(row.shirtNumber)
        byPerson.set(row.personNameHe, seen)
      }
      return archive.shirtNumbers
        // Only a player who wore ONE number in the archive: someone who changed shirts
        // has two right answers.
        .filter((row) => byPerson.get(row.personNameHe)?.size === 1)
        .map((row) => ({
          id: `which-number:${row.personNameHe}:${row.seasonLabel}`,
          template: 'which-number',
          prompt: `איזה מספר לבש ${row.personNameHe} בעונת ${row.seasonLabel}?`,
          options: withDistractors(String(row.shirtNumber), numbers, random),
          correct: String(row.shirtNumber),
          source: sourceOf(row),
          explanation: `${row.personNameHe} · מספר ${row.shirtNumber}`,
        }))
    },
  },

  /* ----------------------------------------------------------------- the songs */
  {
    // A player song and the melody it borrows. The best kind of question in the whole
    // corpus: it is deep lore, it is verifiable, and it starts an argument.
    slug: 'player-song',
    build: (random) =>
      archive.songs
        .filter((row) => row.songType === 'player_song' && row.personNameHe && row.originalTitle)
        .map((row) => ({
          id: `player-song:${row.slug}`,
          template: 'player-song',
          prompt: `לאיזה שחקן הוקדש השיר על הלחן של "${row.originalTitle}"?`,
          options: withDistractors(
            row.personNameHe as string,
            archive.songs
              .filter((other) => other.personNameHe)
              .map((other) => other.personNameHe as string),
            random,
          ),
          correct: row.personNameHe as string,
          source: sourceOf(row),
          explanation: `${row.titleHe}${row.originalArtist ? ` · ${row.originalArtist}` : ''}`,
        })),
  },
  {
    slug: 'song-origin',
    build: (random) =>
      archive.songs
        .filter((row) => row.originalTitle && row.songType !== 'player_song')
        .map((row) => ({
          id: `song-origin:${row.slug}`,
          template: 'song-origin',
          prompt: `על איזה לחן מבוסס "${row.titleHe}"?`,
          options: withDistractors(
            row.originalTitle as string,
            archive.songs
              .filter((other) => other.originalTitle)
              .map((other) => other.originalTitle as string),
            random,
          ),
          correct: row.originalTitle as string,
          source: sourceOf(row),
          explanation: `${row.originalTitle}${row.originalArtist ? ` — ${row.originalArtist}` : ''}${row.seasonLabel ? ` · נכנס ליציע ב-${row.seasonLabel}` : ''}`,
        })),
  },

  /* ------------------------------------------------------- gates and attendance */
  {
    slug: 'attendance',
    build: (random) => {
      const gates = archive.matches
        .map((row) => row.attendance)
        .filter((value): value is number => typeof value === 'number')
        .map(String)
      return archive.matches
        // A disputed gate has two right answers in the sources, so it is not asked.
        .filter((row) => typeof row.attendance === 'number' && row.attendanceDisputed !== true)
        .map((row) => ({
          id: `attendance:${row.seasonLabel}:${row.stage}`,
          template: 'attendance',
          prompt: `כמה צופים היו ב${nameOf.club(row.homeClubSlug)} מול ${nameOf.club(row.awayClubSlug)}, ${row.stage ?? row.seasonLabel}?`,
          options: withDistractors(String(row.attendance), gates, random),
          correct: String(row.attendance),
          source: sourceOf(row),
          explanation: `${matchLine(nameOf.club(row.homeClubSlug), row.homeScore, nameOf.club(row.awayClubSlug), row.awayScore)} · ${row.playedOn ?? row.seasonLabel}`,
        }))
    },
  },
  {
    // The San Siro number. A statistic about the SUPPORTERS, which is the whole point
    // of a fan-owned club's archive.
    slug: 'travelling',
    build: (random) =>
      archive.matches
        .filter((row) => typeof row.travellingSupporters === 'number')
        .map((row) => ({
          id: `travelling:${row.seasonLabel}:${row.stage}`,
          template: 'travelling',
          prompt: `כמה אוהדי הפועל נסעו ל${nameOf.club(row.homeClubSlug)} ב${row.stage ?? row.seasonLabel}?`,
          options: withDistractors(
            String(row.travellingSupporters),
            ['1500', '3000', '5000', '7000', '10000', '12000'],
            random,
          ),
          correct: String(row.travellingSupporters),
          source: sourceOf(row),
          explanation: row.noteHe ?? `${row.playedOn ?? row.seasonLabel}`,
        })),
  },

  /* --------------------------------------------------- the sponsor chronology */
  {
    // Keyed on the raw year label, exactly as the source writes it — these rows are
    // never joined to a season, so the question says "בשנת" and not "בעונת".
    slug: 'sponsor-year',
    build: (random) =>
      archive.sponsorYears.map((row) => ({
        id: `sponsor-year:${row.yearLabelRaw}`,
        template: 'sponsor-year',
        prompt: `מי היה נותן החסות הראשי על חולצת הפועל תל אביב בשנת ${row.yearLabelRaw}?`,
        options: withDistractors(
          row.mainSponsorHe,
          archive.sponsorYears.map((other) => other.mainSponsorHe),
          random,
        ),
        correct: row.mainSponsorHe,
        source: sourceOf(row),
        explanation: row.noteHe ?? `${row.mainSponsorHe} · ${row.yearLabelRaw}`,
      })),
  },
  {
    slug: 'maker-year',
    build: (random) =>
      archive.sponsorYears
        .filter((row) => row.manufacturerHe)
        .map((row) => ({
          id: `maker-year:${row.yearLabelRaw}`,
          template: 'maker-year',
          prompt: `איזה מותג ייצר את מדי הפועל תל אביב בשנת ${row.yearLabelRaw}?`,
          options: withDistractors(
            row.manufacturerHe as string,
            archive.sponsorYears
              .filter((other) => other.manufacturerHe)
              .map((other) => other.manufacturerHe as string),
            random,
          ),
          correct: row.manufacturerHe as string,
          source: sourceOf(row),
          explanation: `${row.manufacturerHe} · ${row.yearLabelRaw}`,
        })),
  },

  /* --------------------------------------------------------- supporter culture */
  {
    slug: 'fan-culture',
    build: (random) =>
      archive.fanCulture
        .filter((row) => row.category === 'gate' || row.category === 'fence')
        .map((row) => ({
          id: `fan-culture:${row.slug}`,
          template: 'fan-culture',
          prompt: `במה מדובר — "${row.titleHe}"?`,
          options: withDistractors(
            row.descriptionHe.slice(0, 80),
            archive.fanCulture.map((other) => other.descriptionHe.slice(0, 80)),
            random,
          ),
          correct: row.descriptionHe.slice(0, 80),
          source: sourceOf(row),
          explanation: row.descriptionHe,
        })),
  },

  /* ------------------------------------------------- the association elections
   *
   * The first Hapoel Ussishkin elections, from the association's own site: every
   * candidate, the occupation each one declared in their own manifesto, and the vote
   * count for all twenty-one of them. Losers included — "who came second" only exists
   * as a question because the archive keeps the people who did not win.
   *
   * These are NOT in the founder's capped group. Rule 16 caps questions whose ANSWER is
   * Maor Harel; a question about who chaired the audit committee is an ordinary
   * Ussishkin question, and the story has earned the room.
   */
  {
    slug: 'election-top',
    build: (random) =>
      archive.elections.flatMap((election) => {
        const candidates = archive.electionCandidates.filter(
          (row) => row.electionSlug === election.slug,
        )
        const top = candidates.find((row) => row.rank === 1)
        if (!top || top.personNameHe === FOUNDER) return []
        return [
          {
            id: `election-top:${election.slug}`,
            template: 'election-top',
            prompt: `מי קיבל את מספר הקולות הגדול ביותר ב${stripThe(election.titleHe)} של הפועל אוסישקין?`,
            options: withDistractors(
              top.personNameHe,
              candidates.map((row) => row.personNameHe).filter((name) => name !== FOUNDER),
              random,
            ),
            correct: top.personNameHe,
            source: sourceOf(top),
            explanation: `${top.personNameHe} · ${top.votes} קולות`,
          },
        ]
      }),
  },
  {
    slug: 'election-votes',
    build: (random) =>
      archive.electionCandidates
        .filter((row) => row.votes !== null && row.personNameHe !== FOUNDER)
        .map((row) => {
          const election = archive.elections.find((item) => item.slug === row.electionSlug)
          const correct = String(row.votes)
          return {
            id: `election-votes:${row.electionSlug}:${row.personNameHe}`,
            template: 'election-votes',
            prompt: `כמה קולות קיבל ${row.personNameHe} ב${stripThe(election?.titleHe ?? 'בחירות העמותה')}?`,
            options: withDistractors(
              correct,
              archive.electionCandidates
                .filter((other) => other.electionSlug === row.electionSlug)
                .map((other) => String(other.votes)),
              random,
            ),
            correct,
            source: sourceOf(row),
            explanation: `${row.personNameHe} · מקום ${row.rank} · ${row.votes} קולות`,
          }
        }),
  },
  {
    // The best question in the set: the manifesto in the candidate's own words, and the
    // player has to know who wrote it.
    slug: 'election-manifesto',
    build: (random) =>
      archive.electionCandidates
        .filter((row) => row.occupationHe !== null && row.personNameHe !== FOUNDER)
        .map((row) => ({
          id: `election-manifesto:${row.electionSlug}:${row.personNameHe}`,
          template: 'election-manifesto',
          prompt: `מי הציג את עצמו במצע לבחירות הראשונות של הפועל אוסישקין כך: "${row.occupationHe}"?`,
          options: withDistractors(
            row.personNameHe,
            archive.electionCandidates
              .map((other) => other.personNameHe)
              .filter((name) => name !== FOUNDER),
            random,
          ),
          correct: row.personNameHe,
          source: sourceOf(row),
          explanation: `${row.personNameHe} · ${row.elected ? 'נבחר' : 'לא נבחר'} · ${row.votes} קולות`,
        })),
  },
  {
    slug: 'election-turnout',
    build: (random) =>
      archive.elections
        .filter((row) => row.eligibleVoters !== null && row.votesCast !== null)
        .flatMap((row) => {
          const numbers = archive.elections
            .flatMap((other) => [other.eligibleVoters, other.votesCast, other.invalidVotes])
            .filter((value): value is number => value !== null)
            .map(String)
          return [
            {
              id: `election-eligible:${row.slug}`,
              template: 'election-turnout',
              prompt: `כמה חברי עמותה היו בעלי זכות הצבעה בבחירות הראשונות של הפועל אוסישקין?`,
              options: withDistractors(String(row.eligibleVoters), numbers, random),
              correct: String(row.eligibleVoters),
              source: sourceOf(row),
              explanation: `${row.votesCast} מתוך ${row.eligibleVoters} הצביעו, ${row.invalidVotes} קולות נפסלו`,
            },
          ]
        }),
  },
  {
    // Not capped: the answer is Erez Zeitshik, not the founder. Rule 16 caps questions
    // whose ANSWER is Maor Harel — this one is about the seat, not the man.
    slug: 'ussishkin-replacement',
    build: (random) =>
      archive.associationRoles
        .filter((row) => row.replacedByNameHe)
        .map((row) => {
          const correct = row.replacedByNameHe as string
          return {
            id: `ussishkin-replacement:${correct}`,
            template: 'ussishkin-replacement',
            prompt: `מי נבחר להנהלת הפועל אוסישקין למקום שהתפנה ב־2012?`,
            options: withDistractors(correct, ASSOCIATION_NAMES(), random),
            correct,
            source: sourceOf(row),
            explanation: `${correct} · נבחר בפברואר 2013`,
          }
        }),
  },
  {
    // Capped with the founder's other question: he came second, and the archive can
    // now prove it — 229 votes to Noa Skali's 232.
    slug: 'founder-rank',
    cappedGroup: 'founder',
    build: (random) =>
      archive.electionCandidates
        .filter((row) => row.personNameHe === FOUNDER && row.rank === 2)
        .map((row) => ({
          id: `founder-rank:${row.electionSlug}`,
          template: 'founder-rank',
          prompt: 'מי סיים במקום השני בבחירות הראשונות להנהלת עמותת הפועל אוסישקין?',
          options: withDistractors(row.personNameHe, ASSOCIATION_NAMES(), random),
          correct: row.personNameHe,
          source: sourceOf(row),
          explanation: `${row.personNameHe} · ${row.votes} קולות, אחרי נועה סקלי`,
        })),
  },
  {
    slug: 'ussishkin',
    // CLAUDE.md rule 16: at most one per round, only where a source names him,
    // never as a distractor. The Ussishkin story does not need help.
    cappedGroup: 'founder',
    build: (random) =>
      archive.associationRoles
        .filter((row) => row.roleHe === 'מייסד')
        .map((row) => ({
          id: `ussishkin:${row.personNameHe}`,
          template: 'ussishkin',
          prompt: 'מי רשם את הפועל אוסישקין בליגה עם הקמת העמותה ב־2007?',
          // The founder is the ANSWER here, so the pool is everyone else.
          options: withDistractors(row.personNameHe, ASSOCIATION_NAMES(), random),
          correct: row.personNameHe,
          source: sourceOf(row),
          explanation: `${row.personNameHe} · חבר הנהלה 2007–2012`,
        })),
  },
]

/* ------------------------------------------------------------------- rounds */

export const ROUND_LENGTH = 10

/**
 * Every question offers four choices. A template that cannot field three REAL
 * distractors from the archive produces a question with two or three, and the honest
 * response is to drop it — padding it with an invented value would put a fact in front
 * of the player that no source supports (rule 11).
 */
export const OPTION_COUNT = 4

function hasFourOptions(question: { options: string[] }): boolean {
  return new Set(question.options).size === OPTION_COUNT
}

/**
 * A question with more than one right answer is not a question.
 *
 * "באיזו עונה זכתה הפועל תל אביב בגביע המדינה?" had sixteen correct answers, and
 * because the distractors came from the same pool of winning seasons, several of the
 * WRONG options were also right. Rather than special-case that template, group the
 * built questions by their prompt: if one prompt maps to more than one correct answer,
 * every question in that group is ill-formed and all of them go.
 */
function dropAmbiguousPrompts<T extends { prompt: string; correct: string }>(
  questions: T[],
): T[] {
  const answers = new Map<string, Set<string>>()
  for (const question of questions) {
    const seen = answers.get(question.prompt) ?? new Set<string>()
    seen.add(question.correct)
    answers.set(question.prompt, seen)
  }
  return questions.filter((question) => (answers.get(question.prompt)?.size ?? 0) === 1)
}

/**
 * A fact the archive records as disputed cannot be the answer to anything. The
 * championship count is 13, or 12, or 14 depending on who is counting — the conflict is
 * recorded honestly in `fact-conflicts.json`, and honesty means not then asking a
 * player to pick one.
 */
const CONTESTED = new Set(
  archive.factConflicts
    .filter((row) => row.resolution === null)
    .map((row) => `${row.entityTable}.${row.field}`),
)

export function isContested(entityTable: string, field: string): boolean {
  return CONTESTED.has(`${entityTable}.${field}`)
}

function buildRound(seed: number): Built[] {
  const random = rng(seed)
  const pool: Built[] = []
  const byGroup = new Map<string, Built[]>()

  for (const template of TEMPLATES) {
    // The template owns the difficulty, so a new template cannot forget to set one.
    const built = dropAmbiguousPrompts(
      template
        .build(random)
        .filter(hasFourOptions)
        .map((question) => ({ ...question, difficulty: DIFFICULTY[template.slug] ?? 3 })),
    )
    if (template.cappedGroup !== undefined) {
      const group = byGroup.get(template.cappedGroup) ?? []
      group.push(...built)
      byGroup.set(template.cappedGroup, group)
      continue
    }
    pool.push(...built)
  }

  // One question per capped group, at most.
  const capped: Built[] = []
  for (const group of byGroup.values()) {
    const one = pick(group, random)
    if (one) capped.push(one)
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

  // A round RAMPS. It opens on facts a casual fan knows and closes on the ones only the
  // archive knows, so ten questions have a shape instead of being ten interchangeable
  // prompts. Ties keep the shuffled order, which is what stops the same easy question
  // opening every round.
  return shuffle([...round, ...capped], random)
    .slice(0, ROUND_LENGTH)
    .sort((a, b) => a.difficulty - b.difficulty)
}

/** How many questions the archive can currently produce. Shown honestly in the UI. */
export function availableQuestionCount(): number {
  const random = rng(1)
  const all = dropAmbiguousPrompts(
    TEMPLATES.flatMap((template) =>
      template
        .build(random)
        .map((question) => ({ ...question, difficulty: DIFFICULTY[template.slug] ?? 3 })),
    ).filter(hasFourOptions),
  )
  return new Set(all.map((question) => question.id)).size
}

/** The difficulties of a round, in order — what a perfect run would be worth. */
export function roundDifficulties(seed: number): Difficulty[] {
  return buildRound(seed).map((question) => question.difficulty)
}

/** Public shape — no correct answer, and no source line, ever. */
export function deal(seed: number, index: number): TriviaQuestion | null {
  const question = buildRound(seed)[index]
  if (!question) return null
  const { correct: _correct, source: _source, ...rest } = question
  return rest
}

/**
 * Server-side provenance audit for a round. The source is off the screen, not out of
 * the system: this is how the confidence gate stays testable and how the data-quality
 * report can name what backed a question. Never call it from a client component.
 */
export function auditRound(seed: number): Array<{ id: string; source: SourceRef }> {
  return buildRound(seed).map((question) => ({ id: question.id, source: question.source }))
}

export type Verdict = {
  correct: boolean
  correctAnswer: string
  explanation: string
  /** echoed back so the client can score without being trusted to know it */
  difficulty: Difficulty
}

/** Grading happens here, on the server, from the seed. The client is never trusted. */
export function grade(seed: number, index: number, answer: string): Verdict | null {
  const question = buildRound(seed)[index]
  if (!question) return null
  return {
    correct: question.correct === answer,
    correctAnswer: question.correct,
    explanation: question.explanation,
    difficulty: question.difficulty,
  }
}
