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
 * **What the archive can answer for 1980/81, and what it cannot.**
 *
 * It holds `{ competitionSlug: 'ליגת-העל', seasonLabel: '1980/81', result: 'won',
 * sport: 'football' }` at confidence 2, sourced. That is a real, checkable fact: the
 * club were champions that season. It holds NO 1980s match, no fixture list, no date,
 * no opponent, no score, no scorer, and no attendance — `content/manual/matches.json`
 * starts at 2001/02.
 *
 * So the anchor returned here is the CHAMPIONSHIP, and the placeholder note names
 * exactly the missing piece: the deciding match. The Bloomfield scene is written around
 * that limit — a crowd, a season, a title — and states nothing the archive cannot back.
 * When a curated 1980/81 match row lands, `placeholder` goes to null and the scene gets
 * a scoreline. Nothing else changes.
 */

const SEASON = '1980/81'
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

  return {
    id: `trophy:${LEAGUE}:${SEASON}`,
    sport: 'football',
    seasonLabel: trophy.seasonLabel,
    year: 1981,
    competitionSlug: trophy.competitionSlug,
    // Built from canonical fields only. No opponent, no score, no date.
    headlineHe: `אליפות ${trophy.seasonLabel}`,
    venueSlug: venue?.slug ?? null,
    sourceTitle: trophy.sourceTitle,
    sourceUrl: trophy.sourceUrl,
    confidence: trophy.confidence,
    placeholder: {
      what: 'המשחק המכריע עצמו — יריבה, תאריך, תוצאה ומבקיעים — אינו מוצג, ואינו קיים בארכיון.',
      needs: 'שורת משחק מעונת 1980/81 ב-content/manual/matches.json ברמת ודאות 2 ומעלה.',
    },
  }
}

/**
 * The prologue's anchor — 1971/72, the State Cup.
 *
 * Same discipline as the chapter anchor and the same limit: `content/manual/trophies.json`
 * records that the club won that season's cup, at confidence 2, with a source. It records
 * nothing about the final itself. The prologue therefore shows a young man in a crowd and
 * names the trophy, and says nothing about who was beaten or by how much.
 */
export function resolvePrologueAnchor(): HistoricalAnchor {
  const trophy = archive.trophies.find(
    (row) =>
      row.seasonLabel === '1971/72' &&
      row.competitionSlug === 'גביע-המדינה' &&
      row.result === 'won' &&
      row.sport === 'football',
  )

  if (!trophy) {
    return {
      ...DEVELOPMENT_ANCHOR,
      id: 'DEV-PLACEHOLDER-PROLOGUE',
      seasonLabel: '1971/72',
      year: 1972,
      competitionSlug: 'גביע-המדינה',
    }
  }

  return {
    id: `trophy:גביע-המדינה:1971/72`,
    sport: 'football',
    seasonLabel: trophy.seasonLabel,
    year: 1972,
    competitionSlug: trophy.competitionSlug,
    headlineHe: `גביע המדינה ${trophy.seasonLabel}`,
    venueSlug: null,
    sourceTitle: trophy.sourceTitle,
    sourceUrl: trophy.sourceUrl,
    confidence: trophy.confidence,
    placeholder: {
      what: 'הגמר עצמו — יריבה, תאריך ותוצאה — אינו מוצג, ואינו קיים בארכיון.',
      needs: 'שורת משחק גמר גביע 1971/72 בארכיון הקנוני ברמת ודאות 2 ומעלה.',
    },
  }
}
