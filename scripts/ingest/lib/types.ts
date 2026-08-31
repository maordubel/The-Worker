/**
 * Canonical staging shapes. Every parser emits these; the loader only ever sees these.
 * No provider field name appears past this file (football-data house rule).
 */

import type { PositionCode } from './normalize'

/** 0 unverified · 1 single source · 2 cross-checked · 3 human-verified. */
export type Confidence = 0 | 1 | 2 | 3

/** Only facts at or above this level may feed question generation. */
export const TRIVIA_CONFIDENCE_FLOOR: Confidence = 2

/** Football and basketball never mix. Every sport-bearing record declares one. */
export type Sport = 'football' | 'basketball'

export type SourceKind =
  | 'wiki'
  | 'book'
  | 'newspaper'
  | 'video'
  | 'official'
  | 'manual'
  | 'other'

export type SourceRef = {
  /** Stable dedupe key, e.g. `wiki:<title>@<revision>` or `manual:<file>#<row>`. */
  naturalKey: string
  kind: SourceKind
  title: string
  url: string | null
  pageTitle: string | null
  revisionId: number | null
  retrievedAt: string | null
  note: string | null
}

type Fact = { source: SourceRef; confidence: Confidence }

/* ------------------------------------------------------------- core entities */

export type StagedClub = Fact & {
  slug: string
  nameHe: string
  nameEn: string | null
  city: string | null
  sport: Sport
  isUs: boolean
  /** True only for the club whose fixture against us is the derby. */
  isDerbyRival: boolean
  aliases: string[]
}

export type StagedVenue = Fact & {
  slug: string
  nameHe: string
  city: string | null
  sport: Sport
  aliases: string[]
}

export type StagedCompetition = Fact & {
  slug: string
  nameHe: string
  type: 'league' | 'national_cup' | 'league_cup' | 'europe' | 'friendly' | 'other'
  sport: Sport
  tier: number | null
  aliases: string[]
}

export type StagedEra = Fact & {
  slug: string
  nameHe: string
  startYear: number
  endYear: number | null
  sortOrder: number
}

export type StagedSeason = Fact & {
  label: string
  startYear: number
  endYear: number
  eraSlug: string | null
  aliases: string[]
}

export type StagedPerson = Fact & {
  slug: string
  fullNameHe: string
  fullNameEn: string | null
  birthDate: string | null
  nationalities: string[]
  isYouthProduct: boolean | null
  wikiPage: string | null
  aliases: string[]
}

export type StagedSquadMembership = Fact & {
  personSlug: string
  seasonLabel: string
  clubSlug: string
  shirtNumber: number | null
  position: PositionCode
  onLoan: boolean
  appearances: number | null
  goals: number | null
}

export type StagedMatch = Fact & {
  /** `season|competition|home|away|stage` — the loader's idempotency key. */
  naturalKey: string
  seasonLabel: string
  competitionSlug: string
  stage: string | null
  playedOn: string | null
  kickoffConfirmed: boolean
  homeClubSlug: string
  awayClubSlug: string
  venueSlug: string | null
  homeScore: number | null
  awayScore: number | null
  status: 'played' | 'abandoned' | 'postponed' | 'awarded' | 'unknown'
  wikiPage: string | null
}

export type StagedMatchEvent = Fact & {
  matchNaturalKey: string
  seq: number
  minute: number | null
  minuteExtra: number | null
  type:
    | 'goal'
    | 'own_goal'
    | 'penalty_goal'
    | 'penalty_miss'
    | 'assist'
    | 'yellow'
    | 'second_yellow'
    | 'red'
    | 'sub'
    | 'var_review'
  clubSlug: string | null
  personSlug: string | null
  relatedPersonSlug: string | null
}

export type StagedTrophy = Fact & {
  naturalKey: string
  competitionSlug: string
  seasonLabel: string
  clubSlug: string
  sport: Sport
  result: 'won' | 'runner_up' | 'semi_final' | 'promoted' | 'relegated'
  noteHe: string | null
}

export type StagedMoment = Fact & {
  slug: string
  titleHe: string
  happenedOn: string | null
  seasonLabel: string | null
  matchNaturalKey: string | null
  sport: Sport
  category: string | null
  bodyHe: string
}

/* ------------------------------------------------- commercial / visual identity */

export type StagedSponsor = Fact & {
  slug: string
  nameHe: string
  nameEn: string | null
  industry: string | null
}

export type StagedSponsorDeal = Fact & {
  naturalKey: string
  clubSlug: string
  sponsorSlug: string
  sport: Sport
  placement: 'front' | 'back' | 'shorts' | 'sleeve' | 'other'
  /** null = every competition that season */
  competitionSlug: string | null
  fromLabel: string | null
  toLabel: string | null
  endedEarly: boolean
  noteHe: string | null
}

export type StagedManufacturer = Fact & {
  slug: string
  nameHe: string
  nameEn: string | null
}

export type StagedKitSupplySpell = Fact & {
  naturalKey: string
  clubSlug: string
  manufacturerSlug: string
  sport: Sport
  fromLabel: string | null
  toLabel: string | null
  isCurrent: boolean
}

export type StagedCrestVersion = Fact & {
  naturalKey: string
  clubSlug: string
  fromYear: number
  toYear: number | null
  nameHe: string
  changeHe: string | null
}

/* ------------------------------------------------------------- fan culture */

export type StagedFanGroup = Fact & {
  slug: string
  nameHe: string
  formerNameHe: string | null
  foundedYear: number | null
  standHe: string | null
  clubSlug: string | null
  sport: Sport
  noteHe: string | null
}

export type StagedSong = Fact & {
  slug: string
  titleHe: string
  sport: Sport
  fanGroupSlug: string | null
  seasonLabel: string | null
  lyricsAuthorHe: string | null
  originalTitle: string | null
  originalArtist: string | null
  personSlug: string | null
  backgroundHe: string | null
}

export type StagedQuote = Fact & {
  naturalKey: string
  textHe: string
  personSlug: string | null
  personNameHe: string | null
  saidOn: string | null
  contextHe: string | null
}

/* --------------------------------------------------------- fan ownership */

export type StagedAssociation = Fact & {
  slug: string
  nameHe: string
  registryId: string | null
  foundedYear: number | null
  clubSlug: string | null
  sport: Sport
  purposeHe: string | null
}

export type StagedAssociationEvent = Fact & {
  naturalKey: string
  associationSlug: string
  kind:
    | 'founding'
    | 'meeting'
    | 'election'
    | 'vote'
    | 'promotion'
    | 'name_change'
    | 'resignation'
    | 'ceremony'
    | 'other'
  happenedOn: string | null
  dateConfirmed: boolean
  titleHe: string
  bodyHe: string | null
  votesFor: number | null
  votesAgainst: number | null
  abstentions: number | null
  turnout: number | null
}

export type StagedElection = Fact & {
  slug: string
  associationSlug: string
  titleHe: string
  /** which body was being elected — הנהלה · ועדת ביקורת */
  bodyHe: string
  heldOn: string | null
  dateConfirmed: boolean
  methodHe: string | null
  eligibleVoters: number | null
  votesCast: number | null
  invalidVotes: number | null
  /** null when the source does not state how many seats were filled */
  seats: number | null
  /** true when the source itself qualifies its figures with "approximately" */
  figuresApproximate: boolean
  noteHe: string | null
}

export type StagedElectionCandidate = Fact & {
  naturalKey: string
  electionSlug: string
  personSlug: string
  personNameHe: string
  votes: number | null
  elected: boolean
  /** position in the published results table, 1 = most votes */
  rank: number | null
  /** the occupation the candidate declared in their own manifesto */
  occupationHe: string | null
  priorRoleHe: string | null
}

export type StagedAssociationRole = Fact & {
  naturalKey: string
  associationSlug: string
  personSlug: string | null
  personNameHe: string
  roleHe: string
  fromDate: string | null
  toDate: string | null
  endReasonHe: string | null
  replacedByNameHe: string | null
  votes: number | null
}

export type StagedMembershipMilestone = Fact & {
  naturalKey: string
  associationSlug: string
  number: number
  personNameHe: string
  personSlug: string | null
  happenedOn: string | null
  dateConfirmed: boolean
  contextHe: string | null
}

/* ------------------------------------------------------------- conflicts */

export type StagedFactConflict = {
  naturalKey: string
  resolvedBy?: string | null
  entityTable: string
  entityKey: string | null
  field: string
  claimA: string
  claimB: string
  sourceAUrl: string | null
  sourceBUrl: string | null
  noteHe: string | null
  /** A conflict is unresolved by default. Resolution is a human act. */
  resolution: string | null
  confidence: Confidence
  source: SourceRef
}

/* ------------------------------------------------------------------ bundle */

export type StagedBundle = {
  eras: StagedEra[]
  clubs: StagedClub[]
  venues: StagedVenue[]
  competitions: StagedCompetition[]
  seasons: StagedSeason[]
  people: StagedPerson[]
  squadMemberships: StagedSquadMembership[]
  matches: StagedMatch[]
  matchEvents: StagedMatchEvent[]
  trophies: StagedTrophy[]
  moments: StagedMoment[]
  sponsors: StagedSponsor[]
  sponsorDeals: StagedSponsorDeal[]
  manufacturers: StagedManufacturer[]
  kitSupplySpells: StagedKitSupplySpell[]
  crestVersions: StagedCrestVersion[]
  fanGroups: StagedFanGroup[]
  songs: StagedSong[]
  quotes: StagedQuote[]
  associations: StagedAssociation[]
  associationEvents: StagedAssociationEvent[]
  associationRoles: StagedAssociationRole[]
  elections: StagedElection[]
  electionCandidates: StagedElectionCandidate[]
  membershipMilestones: StagedMembershipMilestone[]
  factConflicts: StagedFactConflict[]
}

export const BUNDLE_KEYS = [
  'eras',
  'clubs',
  'venues',
  'competitions',
  'seasons',
  'people',
  'squadMemberships',
  'matches',
  'matchEvents',
  'trophies',
  'moments',
  'sponsors',
  'sponsorDeals',
  'manufacturers',
  'kitSupplySpells',
  'crestVersions',
  'fanGroups',
  'songs',
  'quotes',
  'associations',
  'associationEvents',
  'associationRoles',
  'elections',
  'electionCandidates',
  'membershipMilestones',
  'factConflicts',
] as const satisfies ReadonlyArray<keyof StagedBundle>

export type BundleKey = (typeof BUNDLE_KEYS)[number]

export function emptyBundle(): StagedBundle {
  return {
    eras: [],
    clubs: [],
    venues: [],
    competitions: [],
    seasons: [],
    people: [],
    squadMemberships: [],
    matches: [],
    matchEvents: [],
    trophies: [],
    moments: [],
    sponsors: [],
    sponsorDeals: [],
    manufacturers: [],
    kitSupplySpells: [],
    crestVersions: [],
    fanGroups: [],
    songs: [],
    quotes: [],
    associations: [],
    associationEvents: [],
    associationRoles: [],
    elections: [],
    electionCandidates: [],
    membershipMilestones: [],
    factConflicts: [],
  }
}

/** A raw source document, stored before anything is parsed out of it. */
export type RawPage = {
  pageId: number | null
  title: string
  namespace: number
  revisionId: number | null
  /** Raw source text of the document, in the format named below. */
  sourceText: string
  format: 'wikitext'
  contentHash: string
  fetchedAt: string
  url: string
}
