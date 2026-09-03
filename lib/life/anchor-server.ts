import 'server-only'

import { archive } from '@/lib/game/archive'

import { DEVELOPMENT_ANCHOR, type HistoricalAnchor } from './anchors'

/**
 * The resolver, and the only bridge between the canonical archive and the game.
 *
 * It runs on the server — `lib/game/archive.ts` is `server-only`, and it should stay
 * that way — and the route hands the resulting plain object to the client. THE WORKER
 * LIFE therefore never reads Red-Fans data, never reads `content/manual/*` and never
 * parses anything: it receives one typed object per anchor. That is the flow the brief
 * draws, enforced by the module boundary rather than by a convention.
 *
 * **The placeholder retired itself, exactly as it said it would.**
 *
 * For three passes this resolver returned the CHAMPIONSHIP and a note saying the match
 * that decided it was not in the archive: no date, no opponent, no score, no scorer. The
 * scene was written around that limit and the note was printed on screen rather than
 * hidden, because a placeholder you can see is one somebody replaces.
 *
 * On 3.9.2026 somebody did. `content/manual/matches.json` now holds 24.5.1986, Hapoel Tel
 * Aviv v Maccabi Haifa at Bloomfield, and `match-events.json` holds the goal: minute 86,
 * Gili Landau, from Moshe Sinai. Both at confidence 2, sourced, entered from a ticket
 * kept for forty years and two dated pages of מעריב ספורט.
 *
 * So this function does now what its own comment promised: it looks the match up, fills
 * `anchor.match`, and sets `placeholder` to null. Nothing else changed — which was the
 * point of writing it this way. If the row ever goes away the note comes back by itself.
 */

const SEASON = '1985/86'
const LEAGUE = 'ליגת-העל'

export function resolveChapterAnchor(): HistoricalAnchor {
  const trophy = archive.trophies.find(
    (row) =>
      row.seasonLabel === SEASON &&
      row.competitionSlug === LEAGUE &&
      row.result === 'won' &&
      // Rule 6: sport scope is asserted at the point of use, never assumed from context.
      row.sport === 'football',
  )

  if (!trophy) return DEVELOPMENT_ANCHOR

  const venue = archive.venues.find((row) => row.slug === 'בלומפילד' && row.sport === 'football')
  const decider = findDecider()

  return {
    id: `trophy:${LEAGUE}:${SEASON}`,
    sport: 'football',
    seasonLabel: trophy.seasonLabel,
    year: 1986,
    competitionSlug: trophy.competitionSlug,
    // Built from canonical fields only. No opponent, no score, no date.
    headlineHe: `אליפות ${trophy.seasonLabel}`,
    venueSlug: venue?.slug ?? null,
    sourceTitle: trophy.sourceTitle,
    sourceUrl: trophy.sourceUrl,
    confidence: trophy.confidence,
    titlesSoFar: countTitles(SEASON, LEAGUE),
    match: decider,
    // The note survives for exactly as long as the archive cannot answer, and no longer.
    placeholder: decider
      ? null
      : {
          what: 'המשחק המכריע עצמו — יריבה, תאריך, תוצאה ומבקיעים — אינו מוצג, ואינו קיים בארכיון.',
          needs: 'שורת משחק מעונת 1985/86 ב-content/manual/matches.json ברמת ודאות 2 ומעלה.',
        },
  }
}

const US = 'הפועל-תל-אביב'

/**
 * How many of this competition the club had won by the end of this season.
 *
 * A season label sorts lexicographically in the right order (`1968/69` < `1980/81`), which
 * is the one thing that makes this two lines instead of a date parser. It counts rows and
 * says so; if a title is missing from the archive the number is smaller, which is the
 * failure mode a count of rows should have.
 */
function countTitles(season: string, competitionSlug: string): number | null {
  const won = archive.trophies.filter(
    (row) =>
      row.competitionSlug === competitionSlug &&
      row.result === 'won' &&
      row.sport === 'football' &&
      (row.clubSlug ?? US) === US &&
      row.seasonLabel <= season,
  )
  return won.length > 0 ? won.length : null
}

/**
 * The deciding match of the season, read out of the archive and nowhere else.
 *
 * Deliberately narrow: the LAST played league fixture of the season that the club was in,
 * with a score on it, at confidence 2 or better. It is found by the shape of the data —
 * season, competition, status — rather than by a hard-coded date, so the same function
 * answers for 1985/86 and for whatever season a later chapter is set in.
 *
 * The goal comes from `match-events.json` by natural key. If the events file says nothing,
 * `decidedBy` is null and the scene shows a match with a result and no scorer, which is
 * the truthful shape of "we know who won and not who scored".
 */
function findDecider(): HistoricalAnchor['match'] {
  const played = archive.matches
    .filter(
      (row) =>
        row.seasonLabel === SEASON &&
        row.competitionSlug === LEAGUE &&
        (row.homeClubSlug === US || row.awayClubSlug === US) &&
        row.homeScore !== null &&
        row.awayScore !== null &&
        (row.confidence ?? 0) >= 2,
    )
    .sort((a, b) => String(a.playedOn ?? '').localeCompare(String(b.playedOn ?? '')))

  const match = played[played.length - 1]
  if (!match || !match.playedOn) return null

  const atHome = match.homeClubSlug === US
  const opponentSlug = atHome ? match.awayClubSlug : match.homeClubSlug
  const opponent = archive.clubs.find((row) => row.slug === opponentSlug && row.sport === 'football')
  const venue = match.venueSlug
    ? archive.venues.find((row) => row.slug === match.venueSlug && row.sport === 'football')
    : null

  const key = [match.seasonLabel, match.competitionSlug, match.homeClubSlug, match.awayClubSlug, match.stage].join('|')
  const goals = archive.matchEvents
    .filter((row) => row.matchNaturalKey === key && row.type === 'goal' && row.clubSlug === US)
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
  const last = goals[goals.length - 1]

  return {
    playedOn: match.playedOn,
    opponentHe: opponent?.nameHe ?? opponentSlug.replace(/-/g, ' '),
    scoredFor: (atHome ? match.homeScore : match.awayScore) ?? 0,
    scoredAgainst: (atHome ? match.awayScore : match.homeScore) ?? 0,
    atHome,
    venueHe: venue?.nameHe ?? null,
    decidedBy:
      last && last.minute !== null
        ? {
            minute: last.minute,
            scorerHe: nameOf(last.personSlug),
            assistHe: last.relatedPersonSlug ? nameOf(last.relatedPersonSlug) : null,
          }
        : null,
    sourceTitle: match.sourceTitle ?? trophySource(),
    sourceUrl: match.sourceUrl ?? null,
  }
}

function nameOf(slug: string | null): string {
  if (!slug) return ''
  return archive.people.find((row) => row.slug === slug)?.fullNameHe ?? slug.replace(/-/g, ' ')
}

function trophySource(): string {
  return 'ארכיון הפרויקט'
}

/**
 * The prologue's anchor — 1982/83, the State Cup.
 *
 * Rebased with everything else. The prologue used to be 1971/72 and used to belong to
 * the father; now the protagonist is born in 1978, so the earliest thing he can possibly
 * remember is the cup of 1982/83, when he was five and on somebody's shoulders. That is
 * a better prologue than the old one for a reason that has nothing to do with dates: the
 * first line of this game is now something that happened TO him, and the last line of the
 * chapter is something he does himself.
 *
 * Same discipline as the chapter anchor and the same limit: `content/manual/trophies.json`
 * records that the club won that season's cup, at confidence 2, with a source. It records
 * nothing about the final itself. The prologue therefore shows a crowd and names the
 * trophy, and says nothing about who was beaten or by how much.
 */
export function resolvePrologueAnchor(): HistoricalAnchor {
  const trophy = archive.trophies.find(
    (row) =>
      row.seasonLabel === '1982/83' &&
      row.competitionSlug === 'גביע-המדינה' &&
      row.result === 'won' &&
      row.sport === 'football',
  )

  if (!trophy) {
    return {
      ...DEVELOPMENT_ANCHOR,
      id: 'DEV-PLACEHOLDER-PROLOGUE',
      seasonLabel: '1982/83',
      year: 1983,
      competitionSlug: 'גביע-המדינה',
    }
  }

  return {
    id: `trophy:גביע-המדינה:1982/83`,
    sport: 'football',
    seasonLabel: trophy.seasonLabel,
    year: 1983,
    competitionSlug: trophy.competitionSlug,
    headlineHe: `גביע המדינה ${trophy.seasonLabel}`,
    venueSlug: null,
    sourceTitle: trophy.sourceTitle,
    sourceUrl: trophy.sourceUrl,
    confidence: trophy.confidence,
    titlesSoFar: countTitles('1982/83', 'גביע-המדינה'),
    // The prologue's final is not in the archive and this one is honest about it: the
    // 1986 anchor earned its match row, and 1983's has not.
    match: null,
    placeholder: {
      what: 'הגמר עצמו — יריבה, תאריך ותוצאה — אינו מוצג, ואינו קיים בארכיון.',
      needs: 'שורת משחק גמר גביע 1982/83 בארכיון הקנוני ברמת ודאות 2 ומעלה.',
    },
  }
}
