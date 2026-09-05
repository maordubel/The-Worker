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

/**
 * שלב ב׳, המערכה השנייה — 11.3.1991, אוסישקין. הכדורסל, ורק הכדורסל.
 *
 * The football resolvers above read `matches.json`; this one may not, and the separation
 * is enforced by the file it reads rather than by a comment: `basketball-matches.json` is
 * its own store, its rows carry `sport: 'basketball'`, and nothing in the football canon
 * can reach them. That is the rule the research pass turned into schema — a Ussishkin
 * night is stored as basketball throughout, and a basketball record never leaks into a
 * football one.
 *
 * The row is the league administration's own archive of the 1990/91 season: round 15,
 * 11.3.1991, Hapoel Tel Aviv 97 Maccabi Tel Aviv 87, at the club's listed home hall. The
 * chapter states none of that in a line of dialogue — the director reads the final off
 * this anchor at the horn, and the one number anybody says out loud (the margin, whispered
 * across a classroom the next morning) is computed from it.
 *
 * If the row ever goes away, the placeholder comes back by itself and says exactly what
 * the archive would have to hold, which is the shape every anchor in this file has.
 */
const USSISHKIN_SEASON = '1990/91'
const BASKETBALL_LEAGUE = 'ליגה-לאומית-כדורסל'

export function resolveUssishkinAnchor(): HistoricalAnchor {
  const derby = archive.basketballMatches
    .filter(
      (row) =>
        row.sport === 'basketball' &&
        row.seasonLabel === USSISHKIN_SEASON &&
        row.homeScore !== null &&
        row.awayScore !== null &&
        (row.confidence ?? 0) >= 2,
    )
    .sort((a, b) => String(a.playedOn ?? '').localeCompare(String(b.playedOn ?? '')))
    .at(-1)

  const atHome = derby?.homeClubSlug === US
  const match = derby
    ? {
        playedOn: derby.playedOn ?? '',
        opponentHe: atHome ? derby.awayClubHe : derby.homeClubHe,
        scoredFor: (atHome ? derby.homeScore : derby.awayScore) ?? 0,
        scoredAgainst: (atHome ? derby.awayScore : derby.homeScore) ?? 0,
        atHome,
        venueHe: derby.venueHe,
        // A basketball row holds no minute-by-minute events in this archive and the game
        // is written so that it never needs one: `decidedBy` stays null on purpose, and
        // the hall's mood is authored rather than derived from a scoring run nobody
        // recorded (brief §38).
        decidedBy: null,
        sourceTitle: derby.sourceTitle,
        sourceUrl: derby.sourceUrl,
      }
    : null

  return {
    id: `derby:${BASKETBALL_LEAGUE}:${USSISHKIN_SEASON}`,
    sport: 'basketball',
    seasonLabel: USSISHKIN_SEASON,
    year: 1991,
    competitionSlug: BASKETBALL_LEAGUE,
    headlineHe: `הדרבי באוסישקין, ${USSISHKIN_SEASON}`,
    venueSlug: derby?.venueSlug ?? null,
    sourceTitle: derby?.sourceTitle ?? 'content/manual/basketball-matches.json',
    sourceUrl: derby?.sourceUrl ?? null,
    confidence: derby?.confidence ?? 0,
    titlesSoFar: null,
    match,
    placeholder: match
      ? null
      : {
          what: 'הדרבי של 11.3.1991 באוסישקין — יריבה, תאריך ותוצאה — אינו בארכיון.',
          needs: `שורת משחק כדורסל מעונת ${USSISHKIN_SEASON} ב-content/manual/basketball-matches.json ברמת ודאות 2 ומעלה.`,
        },
  }
}

/**
 * העשור — the anchors of Stage B after 1991, one resolver for all of them.
 *
 * Every chapter from 1993 to 2000 hangs on ONE row the archive holds, found by its
 * natural key — season, competition, the day it was played — in `matches.json` or, for a
 * hall, `basketball-matches.json`. The chapter's text never states the row; it reads the
 * anchor at the moment it needs a number, and if the row is ever removed the placeholder
 * comes back and says what the archive would have to hold.
 *
 * `ANCHOR_SPECS` is the whole map from a chapter's `anchorKey` to its row. A chapter that
 * hangs on an EVENT rather than a match (the sale of the club in 1997, a relegation) is
 * given the last match the archive holds for that season, and a headline of its own —
 * the fact the chapter is about is in `noteHe` of the trophies and seasons files and in
 * the chapter's own honest lines, never in a score.
 */
type AnchorSpec = {
  sport: 'football' | 'basketball'
  seasonLabel: string
  competitionSlug: string
  playedOn: string
  year: number
  headlineHe: string
  /** count titles of this competition up to this season, for a card that celebrates one */
  countTitles?: boolean
  placeholderHe: string
  /** a season anchor: no match row is looked up, this sentence and source are the fact */
  summaryHe?: string
  summarySourceTitle?: string
  summarySourceUrl?: string
}

const ANCHOR_SPECS: Record<string, AnchorSpec> = {
  '1993-cup': {
    sport: 'basketball',
    seasonLabel: '1992/93',
    competitionSlug: 'גביע-המדינה-כדורסל',
    playedOn: '1993-04-19',
    year: 1993,
    headlineHe: 'גמר גביע המדינה בכדורסל, 1992/93',
    placeholderHe: 'גמר גביע המדינה בכדורסל של 19.4.1993',
  },
  '1993-galil': {
    sport: 'basketball',
    seasonLabel: '1992/93',
    competitionSlug: 'ליגה-לאומית-כדורסל',
    playedOn: '1993-05-19',
    year: 1993,
    headlineHe: 'סדרת הגמר, 1992/93 — המשחק המכריע',
    placeholderHe: 'המשחק המכריע של סדרת הגמר מול גליל עליון, 19.5.1993',
  },
  '1994-cup': {
    sport: 'football',
    seasonLabel: '1993/94',
    competitionSlug: 'גביע-המדינה',
    playedOn: '1994-06-07',
    year: 1994,
    headlineHe: 'גמר גביע המדינה, 1993/94',
    placeholderHe: 'גמר גביע המדינה של 7.6.1994',
  },
  '1995-europe': {
    sport: 'football',
    seasonLabel: '1995/96',
    competitionSlug: 'גביע-אופא',
    playedOn: '1995-08-22',
    year: 1995,
    headlineHe: 'הסיבוב המוקדם של גביע אופ"א, 1995/96',
    placeholderHe: 'משחק הגומלין מול זימברו קישינב, אוגוסט 1995',
  },
  /**
   * Three SEASON anchors. They used to borrow another season's match row so the card
   * would have a scoreline — which put a 1995 European tie on the 1996/97 finale. A
   * season that is a fact and not a match gets a sentence and a source instead.
   */
  '1997-sale': {
    sport: 'football',
    seasonLabel: '1996/97',
    competitionSlug: 'ליגת-העל',
    playedOn: '1997-06-01',
    year: 1997,
    headlineHe: 'החורף של 1996/97 — הישרדות ומכירה',
    placeholderHe: 'שורת ההקשר של עונת 1996/97',
    summaryHe: 'עונת 1996/97: הפועל תל אביב נאבקה בתחתית הליגה ושרדה. באותה עונה נמכרה קבוצת הכדורגל מידי ההסתדרות לקבוצת בעלים פרטית — סוף העידן ההסתדרותי.',
    summarySourceTitle: 'ynet — הפועל תל אביב, 1989–2017 (רטרוספקטיבה)',
    summarySourceUrl: 'https://www.ynet.co.il/articles/0,7340,L-4958060,00.html',
  },
  '1997-relegation': {
    sport: 'basketball',
    seasonLabel: '1996/97',
    competitionSlug: 'ליגה-לאומית-כדורסל',
    playedOn: '1997-06-01',
    year: 1997,
    headlineHe: 'הירידה של הכדורסל, 1996/97',
    placeholderHe: 'שורת הקשר לעונת 1996/97 בכדורסל',
    summaryHe: 'עונת 1996/97: קבוצת הכדורסל של הפועל תל אביב ירדה מהליגה הבכירה — הירידה הראשונה בתולדותיה. בעונה שאחריה עלתה חזרה.',
    summarySourceTitle: 'basket.co.il — דף הקבוצה, עונות',
    summarySourceUrl: 'https://basket.co.il/team.asp?TeamId=399&sType=p2',
  },
  '1998': {
    sport: 'football',
    seasonLabel: '1997/98',
    competitionSlug: 'ליגת-העל',
    playedOn: '1998-05-02',
    year: 1998,
    headlineHe: 'המחזור האחרון, 1997/98',
    placeholderHe: 'המשחק של 2.5.1998 בבלומפילד',
  },
  '1999-relegation': {
    sport: 'basketball',
    seasonLabel: '1998/99',
    competitionSlug: 'ליגה-לאומית-כדורסל',
    playedOn: '1999-06-01',
    year: 1999,
    headlineHe: 'הירידה השנייה של הכדורסל, 1998/99',
    placeholderHe: 'שורת הקשר לעונת 1998/99 בכדורסל',
    summaryHe: 'עונת 1998/99: שנה אחת אחרי העלייה חזרה, קבוצת הכדורסל של הפועל תל אביב ירדה שוב. המשבר לא נגמר בעלייה — הוא רק חיכה.',
    summarySourceTitle: 'basket.co.il — דף הקבוצה, עונות',
    summarySourceUrl: 'https://basket.co.il/team.asp?TeamId=399&sType=p2',
  },
  '1999-cup': {
    sport: 'football',
    seasonLabel: '1998/99',
    competitionSlug: 'גביע-המדינה',
    playedOn: '1999-05-26',
    year: 1999,
    headlineHe: 'גמר גביע המדינה, 1998/99',
    countTitles: true,
    placeholderHe: 'גמר גביע המדינה של 26.5.1999 ברמת גן',
  },
  '2000-title': {
    sport: 'football',
    seasonLabel: '1999/00',
    competitionSlug: 'ליגת-העל',
    playedOn: '2000-05-13',
    year: 2000,
    headlineHe: 'האליפות הוכרעה, 1999/00',
    countTitles: true,
    placeholderHe: 'המשחק של 13.5.2000 בשכונת התקווה',
  },
  '2000-cup': {
    sport: 'football',
    seasonLabel: '1999/00',
    competitionSlug: 'גביע-המדינה',
    playedOn: '2000-05-17',
    year: 2000,
    headlineHe: 'גמר גביע המדינה, 1999/00 — הדאבל',
    countTitles: true,
    placeholderHe: 'גמר גביע המדינה של 17.5.2000 ברמת גן',
  },
}

export const STAGE_B_ANCHOR_KEYS = Object.keys(ANCHOR_SPECS)

export function resolveStageBAnchors(): Record<string, HistoricalAnchor> {
  return Object.fromEntries(Object.entries(ANCHOR_SPECS).map(([key, spec]) => [key, resolveSpec(key, spec)]))
}

function resolveSpec(key: string, spec: AnchorSpec): HistoricalAnchor {
  if (spec.summaryHe) {
    return {
      id: `${key}:${spec.competitionSlug}:${spec.seasonLabel}`,
      sport: spec.sport,
      seasonLabel: spec.seasonLabel,
      year: spec.year,
      competitionSlug: spec.competitionSlug,
      headlineHe: spec.headlineHe,
      venueSlug: null,
      sourceTitle: spec.summarySourceTitle ?? 'content/manual',
      sourceUrl: spec.summarySourceUrl ?? null,
      confidence: 2,
      titlesSoFar: null,
      match: null,
      placeholder: null,
      summaryHe: spec.summaryHe,
    }
  }
  if (spec.sport === 'basketball') {
    const row = archive.basketballMatches.find(
      (r) => r.sport === 'basketball' && r.seasonLabel === spec.seasonLabel && r.competitionSlug === spec.competitionSlug && r.playedOn === spec.playedOn,
    )
    const atHome = row?.homeClubSlug === US
    const match =
      row && row.homeScore !== null && row.awayScore !== null
        ? {
            playedOn: row.playedOn ?? '',
            opponentHe: atHome ? row.awayClubHe : row.homeClubHe,
            scoredFor: (atHome ? row.homeScore : row.awayScore) ?? 0,
            scoredAgainst: (atHome ? row.awayScore : row.homeScore) ?? 0,
            atHome,
            venueHe: row.venueHe,
            decidedBy: null,
            sourceTitle: (row as { sourceTitle?: string }).sourceTitle ?? 'content/manual/basketball-matches.json',
            sourceUrl: (row as { sourceUrl?: string | null }).sourceUrl ?? null,
          }
        : null
    return {
      id: `${key}:${spec.competitionSlug}:${spec.seasonLabel}`,
      sport: 'basketball',
      seasonLabel: spec.seasonLabel,
      year: spec.year,
      competitionSlug: spec.competitionSlug,
      headlineHe: spec.headlineHe,
      venueSlug: row?.venueSlug ?? null,
      sourceTitle: match?.sourceTitle ?? 'content/manual/basketball-matches.json',
      sourceUrl: match?.sourceUrl ?? null,
      confidence: (row as { confidence?: number } | undefined)?.confidence ?? 0,
      titlesSoFar: null,
      match,
      placeholder: match
        ? null
        : { what: `${spec.placeholderHe} — אינו בארכיון.`, needs: `שורת כדורסל מעונת ${spec.seasonLabel} ב-content/manual/basketball-matches.json.` },
    }
  }

  const row = archive.matches.find(
    (r) =>
      r.seasonLabel === spec.seasonLabel &&
      r.competitionSlug === spec.competitionSlug &&
      r.playedOn === spec.playedOn &&
      (r.homeClubSlug === US || r.awayClubSlug === US),
  )
  let match: HistoricalAnchor['match'] = null
  if (row && row.playedOn && row.homeScore !== null && row.awayScore !== null) {
    const atHome = row.homeClubSlug === US
    const opponentSlug = atHome ? row.awayClubSlug : row.homeClubSlug
    const opponent = archive.clubs.find((r) => r.slug === opponentSlug && r.sport === 'football')
    const venue = row.venueSlug ? archive.venues.find((r) => r.slug === row.venueSlug && r.sport === 'football') : null
    match = {
      playedOn: row.playedOn,
      opponentHe: opponent?.nameHe ?? opponentSlug.replace(/-/g, ' '),
      scoredFor: (atHome ? row.homeScore : row.awayScore) ?? 0,
      scoredAgainst: (atHome ? row.awayScore : row.homeScore) ?? 0,
      atHome,
      venueHe: venue?.nameHe ?? null,
      decidedBy: null,
      sourceTitle: row.sourceTitle ?? trophySource(),
      sourceUrl: row.sourceUrl ?? null,
    }
  }
  const venue = row?.venueSlug ? archive.venues.find((r) => r.slug === row.venueSlug) : null
  return {
    id: `${key}:${spec.competitionSlug}:${spec.seasonLabel}`,
    sport: 'football',
    seasonLabel: spec.seasonLabel,
    year: spec.year,
    competitionSlug: spec.competitionSlug,
    headlineHe: spec.headlineHe,
    venueSlug: venue?.slug ?? null,
    sourceTitle: match?.sourceTitle ?? 'content/manual/matches.json',
    sourceUrl: match?.sourceUrl ?? null,
    confidence: (row as { confidence?: number } | undefined)?.confidence ?? 0,
    titlesSoFar: spec.countTitles ? countTitles(spec.seasonLabel, spec.competitionSlug) : null,
    match,
    placeholder: match
      ? null
      : { what: `${spec.placeholderHe} — אינו בארכיון.`, needs: `שורת משחק מעונת ${spec.seasonLabel} ב-content/manual/matches.json ברמת ודאות 2 ומעלה.` },
  }
}
