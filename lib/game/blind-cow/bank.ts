import 'server-only'

import { createHash, randomInt } from 'node:crypto'

import bankJson from '@/content/generated/blind-cow-bank.json'
import { allPlayers, playerById } from '@/lib/archive/player-master'
import { splitName } from '@/lib/game/roster-search'

import type { SearchEntry } from './search'
import type { BlindCowBank, BlindCowQuestion, OpenClue } from './types'

/**
 * הבנק בצד השרת — the only module that holds answers. Nothing here is ever imported by
 * a client component; the page and the actions hand the browser projections of it.
 */
export const BANK = bankJson as unknown as BlindCowBank

const BY_ID = new Map(BANK.questions.map((q) => [q.id, q]))

export function questionById(id: string | null | undefined): BlindCowQuestion | null {
  return id ? (BY_ID.get(id) ?? null) : null
}

/** The lobby's filters (spec §3 State 1) — few, and each one a real facet of the bank. */
export const FILTERS = ['all', 'israeli', 'foreign', 'legend', 'hardcore', '1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020'] as const
export type Filter = (typeof FILTERS)[number]

export function cleanFilter(value: unknown): Filter {
  return (FILTERS as readonly string[]).includes(String(value)) ? (value as Filter) : 'all'
}

function matches(q: BlindCowQuestion, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'israeli':
    case 'foreign':
      return q.tags.origin === filter
    case 'legend':
      return q.tags.legend
    case 'hardcore':
      return q.eligibleModes.includes('hardcore')
    default: {
      const decade = Number(filter)
      // the 1950 chip also takes the thirties and forties: three thin decades, one door
      return decade === 1950 ? q.tags.decades.some((d) => d <= 1950) : q.tags.decades.includes(decade)
    }
  }
}

export function soloPool(filter: Filter): BlindCowQuestion[] {
  return BANK.questions.filter((q) => q.eligibleModes.includes('solo') && matches(q, filter))
}

/** A fresh solo question — server randomness, and not one of the last ones he saw. */
export function pickSolo(filter: Filter, recent: readonly string[]): BlindCowQuestion | null {
  const pool = soloPool(filter)
  if (!pool.length) return null
  const fresh = pool.filter((q) => !recent.includes(q.id))
  const from = fresh.length ? fresh : pool
  return from[randomInt(from.length)] ?? null
}

/** היומי — one question for everybody on a date, from a fixed seed on the server (§2.2). */
export function dailyQuestion(day: string): BlindCowQuestion | null {
  const pool = BANK.questions.filter((q) => q.eligibleModes.includes('daily'))
  if (!pool.length) return null
  const h = createHash('sha256').update(`worker-blind-cow-daily|${day}`).digest()
  return pool[h.readUInt32BE(0) % pool.length] ?? null
}

/** The Israel date — the daily turns over at midnight in Tel Aviv, not in UTC. */
export function todayInIsrael(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function openClues(q: BlindCowQuestion, count: number): OpenClue[] {
  return q.clueIds.slice(0, Math.max(0, count)).map((id, i) => {
    const c = BANK.clues[id]
    return { n: i + 1, labelHe: c?.labelHe ?? '', valueHe: c?.valueHe ?? '', type: c?.type ?? 'stat' }
  })
}

export function yearsHe(playerId: string): string {
  const p = playerById(playerId)
  if (!p) return ''
  const seasons = [...new Set(p.spells.flatMap((s) => s.seasons))].sort()
  const from = seasons.length ? Number(seasons[0]?.slice(0, 4)) : p.years.from
  const to = seasons.length ? Number(seasons[seasons.length - 1]?.slice(0, 4)) + 1 : p.years.to
  if (!from) return ''
  return to && to !== from ? `${from}–${to}` : String(from)
}

/**
 * The guess drawer's list: every man of the pool, Hebrew + Latin + aliases, by id.
 * The answer is one of 653 names and the list says nothing about which — shipping it
 * lets the search answer at the speed of typing, with no round trip per letter.
 */
export function searchEntries(): SearchEntry[] {
  return allPlayers()
    .filter((p) => p.kind === 'player')
    .map((p) => {
      const parts = splitName(p.displayName)
      return {
        id: p.id,
        nameHe: p.displayName,
        givenHe: parts.givenHe,
        familyHe: parts.familyHe,
        aliasesHe: [...p.aliases.he, ...p.slugAliases.map((s) => s.replace(/-/g, ' '))].filter((a) => a && a !== p.displayName),
        latin: p.aliases.latin,
        years: yearsHe(p.id),
      }
    })
    .sort((a, b) => a.familyHe.localeCompare(b.familyHe, 'he'))
}
