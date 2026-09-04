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
const PROLOGUE_SEASON = '1982/83'
const CUP = 'גביע-המדינה'

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
  const decider = findDecider(SEASON, LEAGUE)

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
 * Deliberately narrow: the LAST played fixture of that season and competition that the
 * club was in, with a score on it, at confidence 2 or better. It is found by the shape of
 * the data — season, competition, status — rather than by a hard-coded date, which is why
 * one function answers for the 1985/86 league AND for the 1982/83 cup, where "the last
 * fixture in the competition" happens to mean the final. Later chapters get it free.
 *
 * The goal comes from `match-events.json` by natural key. If the events file says nothing,
 * `decidedBy` is null and the scene shows a match with a result and no scorer, which is
 * the truthful shape of "we know who won and not who scored".
 */
function findDecider(season: string, competitionSlug: string): HistoricalAnchor['match'] {
  const played = archive.matches
    .filter(
      (row) =>
        row.seasonLabel === season &&
        row.competitionSlug === competitionSlug &&
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
 * **This placeholder retired itself too, and by the same route.**
 *
 * Until 3.9.2026 this function ended with `match: null` and a comment saying the 1986
 * anchor had earned its match row and 1983's had not. `content/manual/matches.json` now
 * holds 1.6.1983, Hapoel Tel Aviv 3 Maccabi Tel Aviv 2 — the Tel Aviv derby final — and
 * `match-events.json` holds Gili Landau's 67th-minute winner, put in with his hand three
 * years before Maradona did the same thing in the same decade. Both rows at confidence 2,
 * sourced to ynet.
 *
 * The venue stays null on purpose: a cup final is played somewhere neutral and the archive
 * does not say where. `findDecider` copies that null through instead of guessing, so the
 * prologue names a date, an opponent and a score, and no stadium.
 */
export function resolvePrologueAnchor(): HistoricalAnchor {
  const trophy = archive.trophies.find(
    (row) =>
      row.seasonLabel === PROLOGUE_SEASON &&
      row.competitionSlug === CUP &&
      row.result === 'won' &&
      row.sport === 'football',
  )

  if (!trophy) {
    return {
      ...DEVELOPMENT_ANCHOR,
      id: 'DEV-PLACEHOLDER-PROLOGUE',
      seasonLabel: PROLOGUE_SEASON,
      year: 1983,
      competitionSlug: CUP,
      venueSlug: null,
      placeholder: {
        what: 'אין עוגן היסטורי מאושר מהארכיון לפרולוג; המסך מציג ממלא מקום מסומן.',
        needs: `שורת גביע עונת ${PROLOGUE_SEASON} בארכיון הקנוני, ברמת ודאות 2 ומעלה.`,
      },
    }
  }

  const decider = findDecider(PROLOGUE_SEASON, CUP)

  return {
    id: `trophy:${CUP}:${PROLOGUE_SEASON}`,
    sport: 'football',
    seasonLabel: trophy.seasonLabel,
    year: 1983,
    competitionSlug: trophy.competitionSlug,
    headlineHe: `גביע המדינה ${trophy.seasonLabel}`,
    // Null, and it stays null: a cup final is neutral ground and the archive does not
    // record which. The prologue is written to work without a stadium name.
    venueSlug: null,
    sourceTitle: trophy.sourceTitle,
    sourceUrl: trophy.sourceUrl,
    confidence: trophy.confidence,
    titlesSoFar: countTitles(PROLOGUE_SEASON, CUP),
    match: decider,
    placeholder: decider
      ? null
      : {
          what: 'הגמר עצמו — יריבה, תאריך ותוצאה — אינו מוצג, ואינו קיים בארכיון.',
          needs: `שורת משחק גמר גביע ${PROLOGUE_SEASON} בארכיון הקנוני ברמת ודאות 2 ומעלה.`,
        },
  }
}

/**
 * שלב ב׳ — 12.5.1990, the promotion. Not a trophy, so it does not come from
 * `trophies.json`: it is the last played match of the 1989/90 second-division season in
 * `matches.json`, at confidence 2, with its source — and the headline is built from the
 * competition name and the season, nothing else. The parallel match that decided the
 * race is in the same file with NO score, at confidence 1, and `findDecider` skips it
 * for exactly that reason: a row with no score is a row the game may not read a number
 * from. If the row is ever removed, the placeholder comes back and says what is missing.
 */
const STAGE_B_SEASON = '1989/90'
const SECOND_TIER = 'ליגה-ארצית'

export function resolveStageBAnchor(): HistoricalAnchor {
  const competition = archive.competitions.find((row) => row.slug === SECOND_TIER && row.sport === 'football')
  const venue = archive.venues.find((row) => row.slug === 'בלומפילד' && row.sport === 'football')
  const decider = findDecider(STAGE_B_SEASON, SECOND_TIER)
  return {
    id: `promotion:${SECOND_TIER}:${STAGE_B_SEASON}`,
    sport: 'football',
    seasonLabel: STAGE_B_SEASON,
    year: 1990,
    competitionSlug: SECOND_TIER,
    headlineHe: `העלייה מ${competition?.nameHe ?? 'הליגה הארצית'}, ${STAGE_B_SEASON}`,
    venueSlug: venue?.slug ?? null,
    sourceTitle: decider?.sourceTitle ?? 'content/manual/matches.json',
    sourceUrl: decider?.sourceUrl ?? null,
    confidence: decider ? 2 : 0,
    titlesSoFar: null,
    match: decider,
    placeholder: decider
      ? null
      : {
          what: 'משחק העלייה של 1989/90 — יריבה, תאריך ותוצאה — אינו בארכיון.',
          needs: 'שורת משחק מעונת 1989/90 בליגה הארצית ב-content/manual/matches.json ברמת ודאות 2 ומעלה.',
        },
  }
}
