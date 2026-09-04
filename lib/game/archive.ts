import 'server-only'

import clubsFile from '@/content/manual/clubs.json'
import fanCultureFile from '@/content/manual/fan-culture.json'
import callsFile from '@/content/manual/calls.json'
import kitDesignsFile from '@/content/manual/kit-designs.json'
import enemiesFile from '@/content/manual/enemies.json'
import grievancesFile from '@/content/manual/grievances.json'
import shirtNumbersFile from '@/content/manual/shirt-numbers.json'
import songsFile from '@/content/manual/songs.json'
import sponsorYearsFile from '@/content/manual/sponsor-years.json'
import conflictsFile from '@/content/manual/fact-conflicts.json'
import competitionsFile from '@/content/manual/competitions.json'
import crestsFile from '@/content/manual/crest-versions.json'
import candidatesFile from '@/content/manual/election-candidates.json'
import electionsFile from '@/content/manual/elections.json'
import euroTiesFile from '@/content/manual/euro-ties.json'
import goalsFile from '@/content/manual/goals.json'
import ussishkinFile from '@/content/manual/ussishkin.json'
import eventsFile from '@/content/manual/match-events.json'
import kitSupplyFile from '@/content/manual/kit-supply.json'
import manufacturersFile from '@/content/manual/manufacturers.json'
import matchesFile from '@/content/manual/matches.json'
import basketballMatchesFile from '@/content/manual/basketball-matches.json'
import momentsFile from '@/content/manual/moments.json'
import peopleFile from '@/content/manual/people.json'
import rosterFile from '@/content/manual/players-roster.json'
import rolesFile from '@/content/manual/association-roles.json'
import sponsorDealsFile from '@/content/manual/sponsor-deals.json'
import sponsorsFile from '@/content/manual/sponsors.json'
import trophiesFile from '@/content/manual/trophies.json'
import venuesFile from '@/content/manual/venues.json'

/**
 * The archive the games read.
 *
 * Server-only, and built from the same curated files the importer loads — so a fact
 * shown in a game is the same row, with the same source and the same confidence, that
 * the ingest report accounts for. When Supabase is live this module keeps its shape and
 * swaps its body for queries; nothing above it changes.
 *
 * The confidence floor is enforced HERE, once. Nothing below level 2 can reach a game.
 */

export const CONFIDENCE_FLOOR = 2

type RawFile = {
  confidence: number
  source: { title: string; url?: string | null }
  records: Array<Record<string, unknown>>
}

export type Sourced = {
  /** e.g. "UEFA" — shown to the player, because showing the source is the product */
  sourceTitle: string
  sourceUrl: string | null
  confidence: number
}

/**
 * Read one curated file, resolve each row's source and confidence (a row may override
 * the file's), and drop everything below the floor. The JSON shapes are validated by
 * the importer's tests, so the cast here is a shape assertion, not a guess.
 */
function load<T>(file: unknown): Array<T & Sourced> {
  const raw = file as RawFile
  return raw.records
    .map((record) => ({
      ...record,
      confidence: typeof record.confidence === 'number' ? record.confidence : raw.confidence,
      sourceTitle: typeof record.sourceTitle === 'string' ? record.sourceTitle : raw.source.title,
      sourceUrl:
        typeof record.sourceUrl === 'string' ? record.sourceUrl : (raw.source.url ?? null),
    }))
    .filter((record) => record.confidence >= CONFIDENCE_FLOOR) as Array<T & Sourced>
}

/** First list wins a slug; the second fills the gaps. */
function mergeBySlug<T extends { slug: string }>(primary: T[], secondary: T[]): T[] {
  const seen = new Set(primary.map((row) => row.slug))
  return [...primary, ...secondary.filter((row) => !seen.has(row.slug))]
}

function plain<T>(file: unknown): T[] {
  return (file as RawFile).records as unknown as T[]
}

export const archive = {
  clubs: load<{
    slug: string
    nameHe: string
    sport?: string
    isUs?: boolean
    isDerbyRival?: boolean
  }>(clubsFile),
  competitions: plain<{ slug: string; nameHe: string; sport?: string }>(competitionsFile),
  venues: load<{ slug: string; nameHe: string; sport?: string }>(venuesFile),
  /**
   * The curated people plus the all-time roster, merged by slug the same way the
   * importer merges them: a curated record wins, and the roster only ever contributes
   * someone who was otherwise missing. Without this the game archive knew 20 players
   * while the database knew 637.
   */
  people: mergeBySlug(
    load<{ slug: string; fullNameHe: string }>(peopleFile),
    load<{ slug: string; fullNameHe: string }>(rosterFile),
  ),
  matches: load<{
    seasonLabel: string
    competitionSlug: string
    stage: string | null
    playedOn: string | null
    homeClubSlug: string
    awayClubSlug: string
    homeScore: number | null
    awayScore: number | null
    attendance?: number | null
    attendanceDisputed?: boolean
    travellingSupporters?: number | null
    noteHe?: string | null
    venueSlug: string | null
  }>(matchesFile),
  /**
   * כדורסל, בנפרד — and the separation is the point (rule 6, and the research pass that
   * turned it into schema): football and basketball never share a table, an alias or a
   * canonical store. THE WORKER LIFE's 1991 chapter resolves its anchor from here and
   * from nowhere else, and nothing in the football canon can see these rows.
   *
   * Club and venue NAMES travel with the row rather than being looked up, because the
   * basketball club rows in `clubs.json` sit at confidence 1 and the archive's floor —
   * correctly — drops them. A name in a row carries that row's own source with it.
   */
  basketballMatches: load<{
    sport: string
    seasonLabel: string
    competitionSlug: string
    stage: string | null
    playedOn: string | null
    homeClubSlug: string
    homeClubHe: string
    awayClubSlug: string
    awayClubHe: string
    homeScore: number | null
    awayScore: number | null
    venueSlug: string | null
    venueHe: string | null
    noteHe?: string | null
  }>(basketballMatchesFile),
  matchEvents: load<{
    matchNaturalKey: string
    minute: number | null
    minuteExtra?: number | null
    type: string
    /* Present on every row in the file. A consumer that has to know WHOSE goal it was —
       THE WORKER LIFE's anchor resolver — cannot filter on a field the type hides. */
    clubSlug?: string | null
    personSlug: string | null
    relatedPersonSlug?: string | null
  }>(eventsFile),
  trophies: load<{
    competitionSlug: string
    seasonLabel: string
    result: string
    noteHe?: string | null
    /* Present on every row in the file and required by rule 6 — a consumer that has to
       stay sport-scoped (THE WORKER LIFE) cannot filter on a field the type hides. */
    sport?: string
    clubSlug?: string
  }>(trophiesFile),
  moments: load<{
    slug: string
    titleHe: string
    happenedOn: string | null
    bodyHe: string
    category?: string | null
  }>(momentsFile),
  manufacturers: plain<{ slug: string; nameHe: string }>(manufacturersFile),
  kitSupply: load<{
    manufacturerSlug: string
    fromLabel: string | null
    toLabel: string | null
    isCurrent?: boolean
  }>(kitSupplyFile),
  sponsors: plain<{ slug: string; nameHe: string }>(sponsorsFile),
  sponsorDeals: load<{
    sponsorSlug: string
    /** null = every competition that season */
    competitionSlug?: string | null
    fromLabel: string | null
    toLabel: string | null
    noteHe?: string | null
  }>(sponsorDealsFile),
  crests: load<{
    fromYear: number
    toYear: number | null
    nameHe: string
    changeHe: string | null
    /** which cut-out variant in /public/brand/crests illustrates this stage, if any */
    imageKey: string | null
    /** the founding year printed on the badge — 1927 until 2015, 1923 after */
    yearOnBadge: number | null
    /** the sponsor's name sat INSIDE the crest, 2001—2007 only */
    hasKeter: boolean
    stars: number
    noteHe: string
  }>(crestsFile),
  associationRoles: load<{
    personNameHe: string
    roleHe: string
    toDate?: string | null
    replacedByNameHe?: string | null
  }>(rolesFile),
  grievances: load<{
    slug: string
    kind: 'crossing' | 'myth' | 'event'
    titleHe: string
    happenedOn: string | null
    dateConfirmed?: boolean
    personNameHe?: string | null
    bodyHe: string
    feeEur?: number | null
    toClubHe?: string | null
  }>(grievancesFile),
  kitDesigns: load<{
    seasonLabel: string
    variant: 'home' | 'away' | 'third'
    makerHe: string | null
    sponsorHe: string | null
    base: string
    pattern: string
    patternInk: string
    sleeves: string
    sleeveInk: string
    collar: string
    collarInk: string
    shorts: string
    socks: string
    noteHe: string
  }>(kitDesignsFile),
  calls: load<{
    slug: string
    shape: 'match' | 'person'
    textHe: string
    speakerHe: string
    roleHe: string
    answerHe: string
    distractorsHe: string[]
    contextHe: string
  }>(callsFile),
  enemies: load<{
    slug: string
    nameHe: string
    latin: string
    category: 'owner' | 'crossed' | 'rival' | 'official'
    sport: 'football' | 'basketball'
    eraHe: string
    terraceRank: number
    chargeHe: string
    detailHe: string
    keyFactHe: string
    happenedOn: string | null
  }>(enemiesFile),
  shirtNumbers: load<{
    shirtNumber: number
    seasonLabel: string
    personNameHe: string
    /** the source spells the name in Latin and the Hebrew is ours */
    hebrewIsTransliteration?: boolean
    /** two official line-ups from the same season disagree — never a question (rule 15) */
    disputed?: boolean
  }>(shirtNumbersFile),
  sponsorYears: load<{
    yearLabelRaw: string
    seasonAmbiguous: boolean
    mainSponsorHe: string
    additionalSponsorsHe: string[]
    manufacturerHe: string | null
    noteHe?: string | null
  }>(sponsorYearsFile),
  songs: load<{
    slug: string
    titleHe: string
    songType: string
    personNameHe?: string | null
    originalTitle?: string | null
    originalArtist?: string | null
    seasonLabel?: string | null
    lyricsAuthorHe?: string | null
    backgroundHe?: string | null
  }>(songsFile),
  fanCulture: load<{
    slug: string
    titleHe: string
    category: string
    descriptionHe: string
    periodHe?: string | null
    locationHe?: string | null
  }>(fanCultureFile),
  elections: load<{
    slug: string
    titleHe: string
    bodyHe: string
    eligibleVoters: number | null
    votesCast: number | null
    invalidVotes: number | null
    seats: number | null
    figuresApproximate?: boolean
    noteHe?: string | null
  }>(electionsFile),
  /** Recorded disagreements. A contested fact never becomes a question. */
  factConflicts: load<{
    entityTable: string
    entityKey: string | null
    field: string
    claimA: string
    claimB: string
    resolution?: string | null
  }>(conflictsFile),
  /**
   * הפועל תל אביב באירופה — every UEFA tie the club has played, plus the Intertoto groups.
   *
   * The European record is the part of this club's history a supporter can recite, and
   * until now the archive held nineteen loose fixtures with no tie structure. A tie is
   * the unit that matters: two legs, an aggregate, and whether it took you through.
   *
   * `homeAbroadHe` is not decoration. Ten of these "home" legs were played in Nicosia,
   * Sofia, Florence, Rotterdam, Tilburg, Larnaca or Miskolc, and that is most of what
   * the terrace remembers about European nights.
   */
  euroTies: load<{
    slug: string
    seasonLabel: string
    competitionHe: string
    stageHe: string
    opponentHe: string
    opponentLatin: string
    opponentCountryHe: string
    opponentIsTransliteration: boolean
    legs: Array<{
      playedOn: string
      home: boolean
      forHapoel: number
      against: number
      venueHe: string | null
    }>
    aggregateHe: string
    advanced: boolean
    scorersHe?: string
    homeAbroadHe?: string
    notableHe?: string
  }>(euroTiesFile),
  /**
   * שערים משוחזרים — the goal archive gate 8 plays and the trivia bank asks about.
   *
   * Twenty moves whose build-up a published report actually DESCRIBES. Twelve more were
   * checked and dropped because no source described how they were scored: a famous goal
   * with no reported build-up is a goal this project does not hold (rule 11).
   */
  goals: load<{
    goalId: string
    titleHe: string
    subtitleHe: string
    competitionHe: string
    opponentHe: string
    scoreHe: string
    narrativeHe: string
    sequence: Array<{
      step: number
      actorHe: string
      action: 'pass' | 'dribble' | 'cross' | 'shot'
      zone: string
      positionHe: string
      noteHe: string
    }>
  }>(goalsFile),
  /**
   * אגף אוסישקין — the basketball wing's own record.
   *
   * Held apart on purpose. Rule 14 keeps the sports from mixing, and the cleanest way
   * to hold that is architectural: nothing that reads a football table reads this, and
   * the file carries its own `sport` at the top rather than relying on omission.
   */
  ussishkin: load<{
    slug: string
    cat: 'building' | 'nights' | 'club' | 'players' | 'ussishkin-club'
    periodHe: string
    factHe: string
    sourceTitle: string
    sourceUrl: string
    confidence: number
  }>(ussishkinFile),
  electionCandidates: load<{
    electionSlug: string
    personNameHe: string
    personSlug: string
    votes: number | null
    elected: boolean
    rank: number | null
    occupationHe?: string | null
    priorRoleHe?: string | null
  }>(candidatesFile),
}

/* ------------------------------------------------------------------ lookups */

const clubName = new Map(archive.clubs.map((club) => [club.slug, club.nameHe]))
const competitionName = new Map(archive.competitions.map((row) => [row.slug, row.nameHe]))
const personName = new Map(archive.people.map((person) => [person.slug, person.fullNameHe]))
const manufacturerName = new Map(archive.manufacturers.map((row) => [row.slug, row.nameHe]))
const sponsorName = new Map(archive.sponsors.map((row) => [row.slug, row.nameHe]))
const venueName = new Map(archive.venues.map((row) => [row.slug, row.nameHe]))

export const nameOf = {
  club: (slug: string) => clubName.get(slug) ?? slug,
  competition: (slug: string) => competitionName.get(slug) ?? slug,
  person: (slug: string) => personName.get(slug) ?? slug,
  manufacturer: (slug: string) => manufacturerName.get(slug) ?? slug,
  sponsor: (slug: string) => sponsorName.get(slug) ?? slug,
  venue: (slug: string) => venueName.get(slug) ?? slug,
}

/**
 * People are split by sport before anything draws on them. Two rules meet here:
 * football and basketball never mix, and the Ussishkin founders never appear as
 * distractors in football questions (CLAUDE.md rules 14 and 16).
 */
const ussishkinNames = new Set([
  ...archive.associationRoles.map((role) => role.personNameHe),
  // Everyone who stood in the association elections is an Ussishkin name too. Rule 14
  // is about the sport, not about how the person got into the archive.
  ...archive.electionCandidates.map((candidate) => candidate.personNameHe),
])

export const footballPeople = archive.people.filter(
  (person) => !ussishkinNames.has(person.fullNameHe),
)

/** Our club, for phrasing questions from its point of view. */
export const US = archive.clubs.find((club) => club.isUs)?.slug ?? 'הפועל-תל-אביב'

/** The one declared derby rival. Nothing else counts. */
export const DERBY_RIVAL = archive.clubs.find((club) => club.isDerbyRival)?.slug ?? null

export function opponentOf(match: { homeClubSlug: string; awayClubSlug: string }): string {
  return match.homeClubSlug === US ? match.awayClubSlug : match.homeClubSlug
}

/** Seeded PRNG — a round is reproducible from its seed, so grading can be re-derived. */
export function rng(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 100000) / 100000
  }
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items]
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const a = out[index] as T
    const b = out[swap] as T
    out[index] = b
    out[swap] = a
  }
  return out
}
