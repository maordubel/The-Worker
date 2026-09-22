/**
 * npm run matches:master — the Match / Moment Master (21.9.2026).
 *
 * Every match the archive holds, under the `m_…` id minted into
 * `content/manual/match-ids.json` (rule 35), with every key any file uses for it; and
 * every moment — `goal:<goalId>` from `goals.json`, `moment:<slug>` from `moments.json` —
 * joined to its match, its scorer's `p_…` id and its sources. What disagrees is carried
 * as `claims` and `conflictRefs` (rule 60 §3); what cannot be joined is in `unresolved`,
 * never guessed.
 *
 * **This builder never mints.** A match row whose key is not in the registry is a build
 * error: run `npm run canon:ids -- --write-ids` first (one-way; Maor's OK on 21.9.2026).
 *
 * Consumers read it through `lib/archive/match-master.ts` (server-only). Gates 2, 3, 8,
 * 9, 10, 12 and 13 are the intended readers; `usable.{replay,trivia,archive}` is the
 * contract they respect — a moment with an open conflict on a field a surface uses is
 * `false` for that surface, and says why in `usableWhy`.
 *
 * Deterministic; `inputsSha` fingerprints the inputs, and `tests/match-master.test.ts`
 * fails when the committed file is stale.
 */

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { idForNaturalKey, matchKeyResolver, type MatchIdEntry } from '@/lib/canon/matchId'
import {
  buildIdentityIndex,
  type PlayerIdEntry,
  type PlayerMasterV2File,
  type PlayerMasterV2Record,
} from '@/lib/archive/player-identity'
import type {
  ActorKind,
  CrossCheck,
  MatchMasterFile,
  MatchRecord,
  MomentRecord,
  MatchRelation,
  ResearchItem,
  ScorerEntry,
  UnresolvedItem,
} from '@/lib/archive/match-master-types'
import { fold } from '@/lib/game/roster-search'
import { keyedMatches, planMatchRegistry, US, type KeyedMatch } from '@/scripts/ingest/lib/manualMatchIds'
import { byCodePoint } from '@/scripts/ingest/lib/playerIds'

const OUT = 'content/generated/match-master.json'
const CONFIDENCE_FLOOR = 2

/** Every file the master reads. Append, never re-sort — the order is the fingerprint's. */
export const MATCH_MASTER_INPUTS = [
  'content/manual/match-ids.json',
  'content/manual/matches.json',
  'content/manual/basketball-matches.json',
  'content/manual/match-scorers.json',
  'content/manual/match-events.json',
  'content/manual/moments.json',
  'content/manual/goals.json',
  'content/manual/lineups.json',
  'content/manual/euro-ties.json',
  'content/manual/fact-conflicts.json',
  'content/manual/clubs.json',
  'content/manual/player-ids.json',
  'content/generated/player-master.json',
] as const

export function matchInputsSha(root: string, inputs: readonly string[] = MATCH_MASTER_INPUTS): string {
  const hash = createHash('sha256')
  for (const file of inputs) {
    hash.update(`${file}\n${createHash('sha256').update(readFileSync(join(root, file))).digest('hex')}\n`)
  }
  return hash.digest('hex')
}

/** Competitions that make a goal a European night for the research queue. */
const EUROPE = new Set(['גביע-אופא', 'הליגה-האירופית', 'ליגת-האלופות', 'קונפרנס-ליג', 'גביע-האינטרטוטו'])

/**
 * `goals.json` actor strings that are not a Hapoel player, read one by one (replay.md §3).
 * A thing (the ball) is `unnamed`; the other side's keeper is `opponent`. Nothing here is
 * a person in the Player Master, and nothing here gets a `p_` id.
 */
const ACTOR_KINDS: Record<string, { kind: Exclude<ActorKind, 'player'>; noteHe: string }> = {
  הכדור: { kind: 'unnamed', noteHe: 'הדיווח אינו נוקב במוסר — "הכדור עבר את ההגנה"' },
  השוער: { kind: 'opponent', noteHe: 'שוער היריבה שהדף' },
  'השוער הרוש': { kind: 'opponent', noteHe: 'שוער היריבה שהדף' },
}

/**
 * Two slugs clubs.json files for one club — a reviewed equivalence for the cross-check
 * ONLY; it is not an alias and changes no club row. `בית"ר י-ם` is the Games table's
 * abbreviation (י-ם = ירושלים) and `בית"ר ירושלים` the curated record; the 15.5.2010
 * championship row at טדי carries the first, the goal record the second.
 */
const SAME_CLUB: [string, string][] = [['בית"ר-ירושלים', 'בית"ר-י-ם']]

type Row = Record<string, any>
let ROOT = process.cwd()
const read = (file: string): any => JSON.parse(readFileSync(join(ROOT, file), 'utf8'))
const confidenceOf = (row: Row, doc: any): number =>
  typeof row.confidence === 'number' ? row.confidence : typeof doc?.confidence === 'number' ? doc.confidence : 0

/* ---------------------------------------------------------------------- sources */

/** A short, stable, readable id for a source — `ynet:L-1216728`, `walla:1723442`, … */
function sourceIdOf(url: string | null | undefined, title: string | null | undefined): string {
  const u = url ?? ''
  let m: RegExpMatchArray | null
  if ((m = u.match(/ynet\.co\.il\/articles\/[\d,]+,L-(\d+)/))) return `ynet:L-${m[1]}`
  if ((m = u.match(/walla\.co\.il\/item\/(\d+)/))) return `walla:${m[1]}`
  if ((m = u.match(/one\.co\.il\/Article\/(\d+)/))) return `one:${m[1]}`
  if (u === 'https://wiki.red-fans.com/index.php?title=Special:CargoTables/Games') return 'vikipoel:games'
  const host = u.match(/^https?:\/\/(?:www\.)?([^/]+)/)?.[1] ?? 'src'
  const label = host.includes('red-fans') ? 'vikipoel' : (host.split('.').slice(0, -1).join('.') || host)
  return `${label}:${createHash('sha1').update(`${title ?? ''}|${u}`).digest('hex').slice(0, 8)}`
}

/* ---------------------------------------------------------------------- build */

export function buildMatchMaster(root = process.cwd()): { out: MatchMasterFile; problems: string[] } {
  ROOT = root
  const problems: string[] = []
  const registry = (read('content/manual/match-ids.json') as { records: MatchIdEntry[] }).records
  const resolveMatch = matchKeyResolver(registry)

  // The registry must already hold every match — this builder never mints.
  const plan = planMatchRegistry(root, registry, '0000-00-00')
  if (plan.minted > 0 || plan.dialectsAdded > 0) {
    problems.push(`match-ids.json is behind the archive (${plan.minted} unminted, ${plan.dialectsAdded} dialect keys) — run npm run canon:ids -- --write-ids`)
  }

  const sources = new Map<string, { title: string; url: string | null }>()
  const cite = (url: string | null | undefined, title: string | null | undefined): string => {
    const id = sourceIdOf(url, title)
    const found = sources.get(id)
    const next = { title: title ?? '', url: url ?? null }
    if (!found || (next.title && next.title < found.title) || (!found.title && next.title)) sources.set(id, next)
    return id
  }

  /* ---- people */
  const players = read('content/generated/player-master.json') as PlayerMasterV2File
  const personById = new Map(players.players.map((p) => [p.id, p]))
  const identity = buildIdentityIndex((read('content/manual/player-ids.json') as { records: PlayerIdEntry[] }).records)
  const personOf = (q: string | null | undefined): PlayerMasterV2Record | null => {
    const hit = identity.resolve(q)
    return hit ? (personById.get(hit.id) ?? null) : null
  }

  /* ---- clubs */
  const clubs = read('content/manual/clubs.json').records as Row[]
  const clubName = new Map<string, string>()
  const clubIndex = new Map<string, Set<string>>()
  for (const club of clubs) {
    if (club.sport && club.sport !== 'football') continue
    if (!clubName.has(club.slug)) clubName.set(club.slug, club.nameHe)
    for (const name of [club.slug, club.nameHe, ...(club.aliases ?? [])]) {
      const set = clubIndex.get(fold(name)) ?? new Set<string>()
      set.add(club.slug)
      clubIndex.set(fold(name), set)
    }
  }
  const clubOf = (name: string): string | null => {
    const set = clubIndex.get(fold(name))
    return set && set.size === 1 ? ([...set][0] as string) : null
  }
  const sameClub = (a: string | null, b: string | null): boolean =>
    a !== null && b !== null && (a === b || SAME_CLUB.some(([x, y]) => (a === x && b === y) || (a === y && b === x)))

  /* ---- conflicts, by what they are about */
  const conflictRows = read('content/manual/fact-conflicts.json').records as Row[]
  const conflictKey = (row: Row) => [row.entityTable, row.entityKey ?? '', row.field].join('|')
  const conflictsByMatch = new Map<string, Row[]>()
  const conflictsByGoal = new Map<string, Row[]>()
  for (const row of conflictRows) {
    if (row.resolution !== null && row.resolution !== undefined) continue // settled by a named person
    if (row.entityTable === 'match' && row.entityKey) {
      const id = resolveMatch(row.entityKey)
      if (id) conflictsByMatch.set(id, [...(conflictsByMatch.get(id) ?? []), row])
    }
    if (row.entityTable === 'goal' && row.entityKey) {
      conflictsByGoal.set(row.entityKey, [...(conflictsByGoal.get(row.entityKey) ?? []), row])
    }
  }

  /* ---- matches */
  const rows = keyedMatches(root)
  const rowsById = new Map<string, KeyedMatch[]>()
  for (const row of rows) {
    const id = idForNaturalKey(registry, row.naturalKey)
    if (!id) {
      problems.push(`no registry id for ${row.naturalKey}`)
      continue
    }
    rowsById.set(id, [...(rowsById.get(id) ?? []), row])
  }

  // scorer rows, by match id
  const scorerDoc = read('content/manual/match-scorers.json')
  const scorersById = new Map<string, Row[]>()
  const unresolvedScorerNames = new Map<string, number>()
  for (const row of scorerDoc.records as Row[]) {
    const id = row.matchKey ? resolveMatch(row.matchKey) : null
    if (!id) continue
    scorersById.set(id, [...(scorersById.get(id) ?? []), row])
  }
  // events, by match id
  const eventsById = new Map<string, Row[]>()
  for (const row of read('content/manual/match-events.json').records as Row[]) {
    const id = resolveMatch(row.matchNaturalKey)
    if (id) eventsById.set(id, [...(eventsById.get(id) ?? []), row])
  }
  // lineups, by match id
  const lineupDoc = read('content/manual/lineups.json')
  const lineupById = new Map<string, Row>()
  for (const lineup of lineupDoc.records as Row[]) {
    const id = resolveMatch(lineup.matchId)
    if (id) lineupById.set(id, lineup)
  }

  const matches: MatchRecord[] = []
  const matchById = new Map<string, MatchRecord>()
  for (const entry of [...registry].sort((a, b) => byCodePoint(a.id, b.id))) {
    const group = rowsById.get(entry.id) ?? []
    if (group.length === 0) {
      problems.push(`registry id ${entry.id} has no match row`)
      continue
    }
    const first = group[0] as KeyedMatch
    const distinct = <T,>(pick: (row: KeyedMatch) => T) => [...new Set(group.map((row) => JSON.stringify(pick(row))))]
    const claims: MatchRecord['claims'] = []
    const claim = (field: string, pick: (row: KeyedMatch) => unknown) => {
      if (distinct(pick).length < 2) return false
      claims.push({
        field,
        values: group.map((row) => ({
          value: pick(row) as string | number | null,
          sourceId: cite(row.sourceUrl, row.sourceTitle),
          file: row.file,
        })),
      })
      return true
    }
    const datesDisputed = claim('playedOn', (row) => row.playedOn)
    const homeDisputed = claim('home', (row) => row.homeClubSlug)
    claim('venue', (row) => (row as Row).venueSlug ?? null)
    const ours = (row: KeyedMatch) => (row.homeClubSlug === US ? 'home' : row.awayClubSlug === US ? 'away' : null)
    const result = (row: KeyedMatch) => {
      const side = ours(row)
      if (side === null || row.homeScore === null || row.awayScore === null) return null
      return side === 'home' ? { hapoel: row.homeScore, opponent: row.awayScore } : { hapoel: row.awayScore, opponent: row.homeScore }
    }
    claim('result', (row) => result(row))
    const side = homeDisputed ? null : ours(first)
    const opponentSlug = ours(first) === null ? null : ours(first) === 'home' ? first.awayClubSlug : first.homeClubSlug
    const res = distinct((row) => result(row)).length === 1 ? result(first) : null

    const scorerRows = scorersById.get(entry.id) ?? []
    const scorers: ScorerEntry[] = []
    for (const row of scorerRows) {
      const sourceId = cite(row.sourceUrl, row.sourceTitle)
      for (const goal of (row.goals ?? []) as Row[]) {
        const person = personOf(goal.playerSlug) ?? personOf(goal.scorerNameHe)
        if (!person && goal.scorerNameHe) {
          unresolvedScorerNames.set(goal.scorerNameHe, (unresolvedScorerNames.get(goal.scorerNameHe) ?? 0) + 1)
        }
        scorers.push({
          playerId: person?.id ?? null,
          nameHe: goal.scorerNameHe ?? null,
          minute: goal.minute ?? null,
          stoppage: goal.stoppage ?? null,
          penalty: goal.penalty === true,
          ownGoal: goal.ownGoal === true,
          sourceId,
          confidence: confidenceOf(row, scorerDoc),
        })
      }
    }
    const events = (eventsById.get(entry.id) ?? []).map((row) => ({
      seq: row.seq ?? null,
      type: row.type,
      minute: row.minute ?? null,
      minuteExtra: row.minuteExtra ?? null,
      clubSlug: row.clubSlug ?? null,
      playerId: personOf(row.personSlug)?.id ?? null,
      relatedPlayerId: personOf(row.relatedPersonSlug)?.id ?? null,
      sourceId: cite(row.sourceUrl, row.sourceTitle),
    }))
    const conflictRefs = (conflictsByMatch.get(entry.id) ?? []).map(conflictKey).sort(byCodePoint)

    const record: MatchRecord = {
      matchId: entry.id,
      sport: entry.sport,
      aliases: [
        ...new Set([entry.naturalKey, ...entry.aliases, ...(entry.dialects ?? []).map((d) => d.key)]),
      ],
      playedOn: datesDisputed
        ? { value: null, precision: 'disputed' }
        : first.playedOn
          ? { value: first.playedOn, precision: 'day' }
          : { value: null, precision: 'unknown' },
      season: first.seasonLabel,
      competition: first.competitionSlug,
      stage: first.stage,
      clubs: [first.homeClubSlug, first.awayClubSlug].sort(byCodePoint) as [string, string],
      home: homeDisputed ? null : first.homeClubSlug,
      away: homeDisputed ? null : first.awayClubSlug,
      hapoelSide: side,
      opponent: opponentSlug,
      score:
        homeDisputed || first.homeScore === null || first.awayScore === null || distinct((r) => [r.homeScore, r.awayScore]).length > 1
          ? null
          : { home: first.homeScore, away: first.awayScore },
      result: res,
      neutralGround: group.some((row) => (row as Row).neutralGround === true),
      venue: distinct((row) => (row as Row).venueSlug ?? null).length === 1 ? ((first as Row).venueSlug ?? null) : null,
      claims,
      conflictRefs,
      scorers,
      scorersDisputed: scorerRows.some((row) => confidenceOf(row, scorerDoc) < CONFIDENCE_FLOOR),
      events,
      lineupRef: lineupById.get(entry.id)?.matchId ?? null,
      momentIds: [],
      sourceIds: [...new Set(group.map((row) => cite(row.sourceUrl, row.sourceTitle)))].sort(byCodePoint),
      confidence: Math.max(...group.map((row) => row.confidence ?? 0)),
      mergeNote: entry.mergeNote ?? null,
    }
    matches.push(record)
    matchById.set(record.matchId, record)
  }

  /* ---- moments */
  const hapoelOn = new Map<string, MatchRecord[]>()
  for (const match of matches) {
    if (match.sport !== 'football') continue
    const dates = match.claims.find((c) => c.field === 'playedOn')?.values.map((v) => v.value as string) ?? [match.playedOn.value]
    if (!match.clubs.includes(US)) continue
    for (const date of dates) if (date) hapoelOn.set(date, [...(hapoelOn.get(date) ?? []), match])
  }
  const datesOf = (match: MatchRecord): string[] =>
    (match.claims.find((c) => c.field === 'playedOn')?.values.map((v) => v.value as string) ?? [match.playedOn.value]).filter(
      (d): d is string => Boolean(d),
    )
  const shiftDay = (date: string, days: number) => {
    const d = new Date(`${date}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
  }

  const moments: MomentRecord[] = []
  const crossChecks: CrossCheck[] = []
  const unresolved: UnresolvedItem[] = []
  const goalsDoc = read('content/manual/goals.json')

  for (const goal of goalsDoc.records as Row[]) {
    const momentId = `goal:${goal.goalId}`
    const sourceId = cite(goal.sourceUrl, goal.sourceTitle)
    const confidence = confidenceOf(goal, goalsDoc)
    const opponentSlug = clubOf(goal.opponentHe)

    // the match: our match on that date; otherwise the adjacent day against the same club
    let match: MatchRecord | null = null
    let matchLink: MomentRecord['matchLink'] = null
    const onDay = hapoelOn.get(goal.playedOn) ?? []
    if (onDay.length === 1) {
      match = onDay[0] as MatchRecord
      matchLink = 'date'
    } else if (onDay.length === 0) {
      const near = [...(hapoelOn.get(shiftDay(goal.playedOn, -1)) ?? []), ...(hapoelOn.get(shiftDay(goal.playedOn, 1)) ?? [])].filter(
        (m) => sameClub(m.opponent, opponentSlug),
      )
      if (near.length === 1) {
        match = near[0] as MatchRecord
        matchLink = 'date±1'
      }
    }
    const matchUnresolved: MomentRecord['matchUnresolved'] = match ? null : onDay.length > 1 ? 'ambiguous' : 'not-in-archive'
    if (!match) unresolved.push({ kind: 'moment-match', momentId, reason: matchUnresolved as string })

    // the minute the record states
    const mm = String(goal.subtitleHe ?? '').match(/דקה (\d+)(?:\+(\d+))?/)
    const minute = mm ? Number(mm[1]) : null
    const stoppage = mm?.[2] ? Number(mm[2]) : null
    const total = minute === null ? null : minute + (stoppage ?? 0)

    // touches — actors resolved exactly, or said to be something else, or reported
    const season = match?.season ?? null
    const touches = (goal.sequence as Row[]).map((touch) => {
      const special = ACTOR_KINDS[touch.actorHe]
      const person = special ? null : personOf(touch.actorHe)
      let kind: ActorKind = special ? special.kind : 'player'
      let resolution: 'exact' | 'unresolved' | 'not-a-person' = special ? 'not-a-person' : person ? 'exact' : 'unresolved'
      if (person && person.kind !== 'player') {
        kind = 'opponent'
        resolution = 'exact'
      }
      if (!special && !person) {
        // A family name alone — one word, or the tail of somebody's full name (`דה רידר`).
        const tail = ` ${fold(touch.actorHe)}`
        const bearers = players.players.filter((p) => p.kind === 'player' && ` ${fold(p.displayName)}`.endsWith(tail))
        const surnameOnly = fold(touch.actorHe).split(' ').length === 1 || bearers.length > 0
        const candidates = bearers
          .filter((p) => season !== null && p.spells.some((s) => s.seasons.includes(season)))
          .map((p) => {
            const scored = match?.scorers.some((s) => s.playerId === p.id && (s.minute ?? 0) + (s.stoppage ?? 0) === total)
            return {
              playerId: p.id,
              evidence:
                `family name '${touch.actorHe}' · squads.json places ${p.displayName} in ${season}` +
                (scored ? ` · the archive's scorer row for this match names him at the same minute` : ''),
            }
          })
        unresolved.push({
          kind: 'actor',
          momentId,
          step: touch.step,
          nameHe: touch.actorHe,
          reason: surnameOnly ? 'surname-only (rule 64 §5 — a person decides, per occurrence)' : 'no person',
          ...(candidates.length ? { candidates } : {}),
        })
      }
      return {
        step: touch.step,
        actor: { kind, playerId: person?.id ?? null, nameHe: touch.actorHe, resolution },
        action: touch.action,
        zone: touch.zone,
        positionHe: touch.positionHe,
        noteHe: touch.noteHe ?? null,
      }
    })
    const last = touches[touches.length - 1]
    const scorerActor = last?.actor ?? null
    const scorer = scorerActor
      ? {
          playerId: scorerActor.playerId,
          nameHe: scorerActor.nameHe,
          resolution: scorerActor.playerId ? ('exact' as const) : ('unresolved' as const),
        }
      : null

    // what the rest of the archive says about the same goal
    // Per source, the one reading nearest to this goal — a man who scored twice in the
    // match has two rows, and the other goal is not a claim about this one.
    const minuteClaims: MomentRecord['minuteClaims'] = []
    if (match && scorer?.playerId && total !== null) {
      const readings = [
        ...match.scorers
          .filter((s) => s.playerId === scorer.playerId && s.minute !== null && !s.ownGoal)
          .map((s) => ({ minute: s.minute as number, stoppage: s.stoppage, sourceId: s.sourceId })),
        ...match.events
          .filter((e) => String(e.type).includes('goal') && e.playerId === scorer.playerId && e.minute !== null)
          .map((e) => ({ minute: e.minute as number, stoppage: e.minuteExtra, sourceId: e.sourceId })),
      ]
      const bySource = new Map<string, (typeof readings)[number]>()
      for (const reading of readings) {
        const held = bySource.get(reading.sourceId)
        const distance = (r: (typeof readings)[number]) => Math.abs(r.minute + (r.stoppage ?? 0) - total)
        if (!held || distance(reading) < distance(held)) bySource.set(reading.sourceId, reading)
      }
      minuteClaims.push(...[...bySource.values()].sort((a, b) => byCodePoint(a.sourceId, b.sourceId)))
    }

    // cross-checks against the match record
    const goalConflicts = conflictsByGoal.get(goal.goalId) ?? []
    const matchConflicts = match ? (conflictsByMatch.get(match.matchId) ?? []) : []
    const refFor = (rowsIn: Row[], fields: string[]) =>
      rowsIn.filter((row) => fields.includes(row.field)).map(conflictKey)[0] ?? null
    if (match) {
      const dates = datesOf(match)
      const dateOk = dates.includes(goal.playedOn)
      crossChecks.push({
        momentId,
        field: 'playedOn',
        record: goal.playedOn,
        archive: dates.join(' | '),
        status: dateOk ? 'agree' : 'disagree',
        conflictRef: dateOk ? null : refFor(matchConflicts, ['played_on', 'played_on_and_home_away']),
      })
      const oppOk = opponentSlug !== null ? sameClub(opponentSlug, match.opponent) : false
      crossChecks.push({
        momentId,
        field: 'opponent',
        record: goal.opponentHe,
        archive: match.opponent ? (clubName.get(match.opponent) ?? match.opponent) : '',
        status: oppOk ? 'agree' : 'disagree',
        conflictRef: oppOk ? null : refFor(matchConflicts, ['opponent_club']),
      })
      const sm = String(goal.scoreHe ?? '').match(/(\d+):(\d+)(?:\s+(ל\S+))?/)
      if (sm && match.result) {
        const a = Number(sm[1])
        const b = Number(sm[2])
        const forUs = sm[3] === 'להפועל'
        const recordResult = a === b ? { hapoel: a, opponent: b } : forUs ? { hapoel: Math.max(a, b), opponent: Math.min(a, b) } : { hapoel: Math.min(a, b), opponent: Math.max(a, b) }
        const scoreOk = recordResult.hapoel === match.result.hapoel && recordResult.opponent === match.result.opponent
        crossChecks.push({
          momentId,
          field: 'result',
          record: `${recordResult.hapoel}:${recordResult.opponent}`,
          archive: `${match.result.hapoel}:${match.result.opponent}`,
          status: scoreOk ? 'agree' : 'disagree',
          conflictRef: scoreOk ? null : refFor(matchConflicts, ['score']),
        })
      }
      if (total !== null && minuteClaims.length) {
        crossChecks.push({
          momentId,
          field: 'minute',
          record: `${minute}${stoppage ? `+${stoppage}` : ''}`,
          archive: minuteClaims.map((c) => `${c.minute}${c.stoppage ? `+${c.stoppage}` : ''}`).join(' | '),
          status: minuteClaims.every((c) => c.minute + (c.stoppage ?? 0) === total) ? 'agree' : 'disagree',
          conflictRef: minuteClaims.every((c) => c.minute + (c.stoppage ?? 0) === total) ? null : refFor(goalConflicts, ['minute']),
        })
      }
    }

    // what each surface may use (replay.md §3)
    const allConflicts = [...goalConflicts, ...matchConflicts]
    const why: string[] = []
    if (confidence < CONFIDENCE_FLOOR) why.push(`confidence ${confidence}`)
    // Replay is blocked only where THIS record and the archive disagree on which match the
    // move belongs to — the goal names another opponent. A naming conflict inside the
    // archive (בנפיקה / בנפיקה ליסבון, ליגת העל / הליגה הלאומית in 1986) does not move the
    // goal to another match; trivia, which would ask about the name, stays off for it.
    const identityBreaks = crossChecks.filter((c) => c.momentId === momentId && c.field === 'opponent' && c.status === 'disagree')
    const replayWhy = [
      ...why,
      ...identityBreaks.map((c) => `conflict ${c.conflictRef ?? 'unlisted'} (record: ${c.record}; archive: ${c.archive})`),
      ...(match ? [] : ['no match']),
    ]
    const triviaWhy = [
      ...why,
      ...allConflicts.map((row) => `conflict ${conflictKey(row)}`),
      ...(scorer?.playerId ? [] : ['scorer unresolved']),
      ...(match ? [] : ['no match']),
      ...(matchLink === 'date±1' ? ['match linked across a disputed date'] : []),
    ]

    const moment: MomentRecord = {
      momentId,
      kind: 'goal',
      category: 'goal',
      titleHe: goal.titleHe,
      matchId: match?.matchId ?? null,
      matchUnresolved,
      matchLink,
      playedOn: goal.playedOn,
      season,
      minute,
      stoppage,
      minuteClaims,
      scorer,
      move: { touches },
      text: { he: goal.narrativeHe ?? null, kind: 'paraphrase' },
      sourceId,
      sourceUrl: goal.sourceUrl ?? null,
      confidence,
      conflictRefs: [...new Set(allConflicts.map(conflictKey))].sort(byCodePoint),
      usable: { replay: replayWhy.length === 0, trivia: triviaWhy.length === 0, archive: confidence >= CONFIDENCE_FLOOR },
      usableWhy: { replay: replayWhy, trivia: [...new Set(triviaWhy)] },
    }
    moments.push(moment)
    if (match) match.momentIds.push(momentId)
  }

  const momentsDoc = read('content/manual/moments.json')
  for (const row of momentsDoc.records as Row[]) {
    const momentId = `moment:${row.slug}`
    const confidence = confidenceOf(row, momentsDoc)
    const id = row.matchNaturalKey ? resolveMatch(row.matchNaturalKey) : null
    const match = id ? (matchById.get(id) ?? null) : null
    if (row.matchNaturalKey && !match) unresolved.push({ kind: 'moment-match', momentId, reason: 'key not in the registry' })
    const matchConflicts = match ? (conflictsByMatch.get(match.matchId) ?? []) : []
    if (match && row.happenedOn) {
      const dates = datesOf(match)
      const ok = dates.includes(row.happenedOn)
      crossChecks.push({
        momentId,
        field: 'playedOn',
        record: row.happenedOn,
        archive: dates.join(' | '),
        status: ok ? 'agree' : 'disagree',
        conflictRef: ok ? null : (matchConflicts.filter((c) => c.field.startsWith('played_on')).map(conflictKey)[0] ?? null),
      })
    }
    const triviaWhy = [
      ...(confidence < CONFIDENCE_FLOOR ? [`confidence ${confidence}`] : []),
      ...matchConflicts.map((c) => `conflict ${conflictKey(c)}`),
    ]
    moments.push({
      momentId,
      kind: 'moment',
      category: row.category ?? null,
      titleHe: row.titleHe,
      matchId: match?.matchId ?? null,
      matchUnresolved: match ? null : 'no-match-named',
      matchLink: match ? 'key' : null,
      playedOn: row.happenedOn ?? null,
      season: row.seasonLabel ?? match?.season ?? null,
      minute: null,
      stoppage: null,
      minuteClaims: [],
      scorer: null,
      move: null,
      text: { he: row.bodyHe ?? null, kind: 'summary' },
      sourceId: cite(row.sourceUrl, row.sourceTitle),
      sourceUrl: row.sourceUrl ?? null,
      confidence,
      conflictRefs: matchConflicts.map(conflictKey).sort(byCodePoint),
      usable: { replay: false, trivia: triviaWhy.length === 0, archive: confidence >= CONFIDENCE_FLOOR },
      usableWhy: { replay: ['no move on record'], trivia: triviaWhy },
    })
    if (match) match.momentIds.push(momentId)
  }
  moments.sort((a, b) => byCodePoint(a.momentId, b.momentId))
  for (const match of matches) match.momentIds.sort(byCodePoint)

  /* ---- relations (the graph's edges that are not already a field) */
  const relations: MatchRelation[] = []
  for (const moment of moments) {
    if (moment.matchId) relations.push({ type: 'happened_in', from: moment.momentId, to: moment.matchId, sourceIds: [moment.sourceId], confidence: moment.confidence })
    if (moment.season) relations.push({ type: 'in_season', from: moment.momentId, to: `season:${moment.season}`, sourceIds: [moment.sourceId], confidence: moment.confidence })
    if (moment.scorer?.playerId) relations.push({ type: 'scored', from: moment.scorer.playerId, to: moment.momentId, sourceIds: [moment.sourceId], confidence: moment.confidence })
  }
  for (const match of matches) {
    const byPlayer = new Map<string, { count: number; sourceIds: Set<string>; confidence: number }>()
    for (const s of match.scorers) {
      if (!s.playerId || s.ownGoal) continue
      const found = byPlayer.get(s.playerId) ?? { count: 0, sourceIds: new Set<string>(), confidence: 0 }
      found.count += 1
      found.sourceIds.add(s.sourceId)
      found.confidence = Math.max(found.confidence, s.confidence)
      byPlayer.set(s.playerId, found)
    }
    for (const [playerId, v] of byPlayer) {
      relations.push({ type: 'scored', from: playerId, to: match.matchId, sourceIds: [...v.sourceIds].sort(byCodePoint), confidence: v.confidence, count: v.count })
    }
    for (const e of match.events) {
      if (String(e.type).includes('goal') && e.relatedPlayerId) {
        relations.push({ type: 'assisted', from: e.relatedPlayerId, to: match.matchId, sourceIds: [e.sourceId], confidence: 2 })
      }
    }
    for (const alias of match.aliases) {
      const m = alias.match(/^euro:(.+):\d{4}-\d{2}-\d{2}$/)
      if (m) relations.push({ type: 'leg_of', from: match.matchId, to: `tie:${m[1]}`, sourceIds: match.sourceIds, confidence: match.confidence })
    }
  }
  for (const lineup of lineupDoc.records as Row[]) {
    const id = resolveMatch(lineup.matchId)
    if (!id || confidenceOf(lineup, lineupDoc) < CONFIDENCE_FLOOR) continue
    const sourceId = cite(lineup.sourceUrl, lineup.sourceTitle)
    for (const name of Object.values(lineup.xi as Record<string, string>)) {
      const p = personOf(name)
      if (p) relations.push({ type: 'started_in', from: p.id, to: id, sourceIds: [sourceId], confidence: confidenceOf(lineup, lineupDoc) })
    }
    for (const raw of (lineup.benchHe ?? []) as string[]) {
      const p = personOf(raw.replace(/\s*\(.*$/, ''))
      if (p) relations.push({ type: 'came_on_in', from: p.id, to: id, sourceIds: [sourceId], confidence: confidenceOf(lineup, lineupDoc) })
    }
  }
  const seenRel = new Set<string>()
  const uniqueRelations = relations
    .filter((r) => {
      const key = `${r.type}|${r.from}|${r.to}`
      if (seenRel.has(key)) return false
      seenRel.add(key)
      return true
    })
    .sort((a, b) => byCodePoint(a.type, b.type) || byCodePoint(a.from, b.from) || byCodePoint(a.to, b.to))

  /* ---- the research queue: goals worth sourcing as moves, never coordinates */
  const researchQueue: ResearchItem[] = []
  const covered = new Set(
    moments.filter((m) => m.kind === 'goal' && m.matchId && m.scorer?.playerId).map((m) => `${m.matchId}|${m.scorer?.playerId}|${(m.minute ?? 0) + (m.stoppage ?? 0)}`),
  )
  const derbyRival = new Set(clubs.filter((c) => c.isDerbyRival && (!c.sport || c.sport === 'football')).map((c) => c.slug as string))
  for (const match of matches) {
    if (match.sport !== 'football' || match.season < '2000/01' || !match.clubs.includes(US)) continue
    const why: ResearchItem['why'][] = []
    if (EUROPE.has(match.competition)) why.push('europe')
    if (match.competition === 'גביע-המדינה' && match.stage === 'גמר') why.push('cup-final')
    if (match.opponent && derbyRival.has(match.opponent)) why.push('derby')
    if (why.length === 0) continue
    for (const s of match.scorers) {
      if (s.ownGoal || s.minute === null || s.confidence < CONFIDENCE_FLOOR) continue
      const key = `${match.matchId}|${s.playerId}|${s.minute + (s.stoppage ?? 0)}`
      if (s.playerId && covered.has(key)) continue
      researchQueue.push({
        matchId: match.matchId,
        playedOn: match.playedOn.value,
        season: match.season,
        why: why[0] as ResearchItem['why'],
        scorer: { playerId: s.playerId, nameHe: s.nameHe },
        minute: s.minute,
        stoppage: s.stoppage,
        status: 'needs-a-sourced-move',
      })
    }
  }
  researchQueue.sort((a, b) => byCodePoint(a.playedOn ?? '', b.playedOn ?? '') || (a.minute ?? 0) - (b.minute ?? 0))

  /* ---- what could not be joined */
  for (const d of plan.unresolvedDialects) unresolved.push({ kind: 'dialect', dialect: d.dialect, key: d.key, reason: d.reason })
  for (const pair of plan.suspectedDuplicates) unresolved.push({ kind: 'suspected-duplicate', a: pair.a, b: pair.b, reason: pair.why })
  for (const lineup of lineupDoc.records as Row[]) {
    if (!resolveMatch(lineup.matchId)) unresolved.push({ kind: 'lineup', key: lineup.matchId, reason: 'the record names a season, not a match' })
  }
  for (const [nameHe, count] of [...unresolvedScorerNames].sort((a, b) => b[1] - a[1] || byCodePoint(a[0], b[0]))) {
    unresolved.push({ kind: 'scorer-name', nameHe, count, reason: 'no person answers to this spelling (see match-scorers.json unknown)' })
  }
  for (const check of crossChecks) {
    if (check.status === 'disagree' && !check.conflictRef) problems.push(`unlisted disagreement: ${check.momentId} ${check.field} (${check.record} ≠ ${check.archive})`)
  }

  const inputs = [...MATCH_MASTER_INPUTS]
  const out: MatchMasterFile = {
    schemaVersion: 1,
    inputsSha: matchInputsSha(root, inputs),
    inputs,
    counts: {
      matches: matches.length,
      football: matches.filter((m) => m.sport === 'football').length,
      basketball: matches.filter((m) => m.sport === 'basketball').length,
      withClaims: matches.filter((m) => m.claims.length > 0).length,
      withConflicts: matches.filter((m) => m.conflictRefs.length > 0).length,
      withScorers: matches.filter((m) => m.scorers.length > 0).length,
      scorerEntries: matches.reduce((sum, m) => sum + m.scorers.length, 0),
      scorerEntriesResolved: matches.reduce((sum, m) => sum + m.scorers.filter((s) => s.playerId).length, 0),
      moments: moments.length,
      goals: moments.filter((m) => m.kind === 'goal').length,
      momentsWithMatch: moments.filter((m) => m.matchId).length,
      usableReplay: moments.filter((m) => m.usable.replay).length,
      usableTrivia: moments.filter((m) => m.usable.trivia).length,
      relations: uniqueRelations.length,
      researchQueue: researchQueue.length,
      unresolved: unresolved.length,
      crossChecks: crossChecks.length,
      crossCheckDisagreements: crossChecks.filter((c) => c.status === 'disagree').length,
    },
    sources: Object.fromEntries([...sources].sort((a, b) => byCodePoint(a[0], b[0]))),
    matches,
    moments,
    relations: uniqueRelations,
    crossChecks,
    researchQueue,
    unresolved,
  }
  return { out, problems }
}

/**
 * One element of every top-level list per line: readable diffs, a third of the bytes of
 * an indented file.
 */
export function serialiseMatchMaster(out: MatchMasterFile): string {
  const lines: string[] = ['{']
  const entries = Object.entries(out)
  entries.forEach(([key, value], index) => {
    const comma = index < entries.length - 1 ? ',' : ''
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${JSON.stringify(key)}:[]${comma}`)
        return
      }
      lines.push(`${JSON.stringify(key)}:[`)
      value.forEach((item, i) => lines.push(`${JSON.stringify(item)}${i < value.length - 1 ? ',' : ''}`))
      lines.push(`]${comma}`)
    } else {
      lines.push(`${JSON.stringify(key)}:${JSON.stringify(value)}${comma}`)
    }
  })
  lines.push('}')
  return `${lines.join('\n')}\n`
}

function main(): void {
  const { out, problems } = buildMatchMaster(process.cwd())
  if (problems.length > 0) {
    for (const problem of problems) console.error(`PROBLEM: ${problem}`)
    process.exitCode = 1
    return
  }
  const path = join(process.cwd(), OUT)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, serialiseMatchMaster(out), 'utf8')
  console.log(JSON.stringify(out.counts))
}

if (process.argv[1] && /build-match-master\.ts$/.test(process.argv[1])) main()
