/**
 * חיפוש שחקנים — finding one man among 637.
 *
 * The first version was `name.includes(term)` capped at eighty rows. Maor's verdict was
 * that it is not usable and that it has to find a man by his FAMILY name, and both halves
 * of that are right for reasons a substring match cannot reach:
 *
 *  · **A supporter looks up "בוזגלו", not "מאור".** A raw substring ranks every man with
 *    those letters anywhere in his name equally, so the one you meant lands wherever the
 *    alphabet put him. Here a family-name prefix outranks a given-name prefix, which
 *    outranks a hit anywhere else — three tiers, and the top of the list is the answer.
 *  · **Hebrew types back at you.** A final letter is a different codepoint from its
 *    medial form, and quotation marks in a name arrive as ׳ ״ ' or " depending on the
 *    keyboard. "אמסלם" typed with a medial mem, or "מ׳ דובל" typed with an apostrophe,
 *    used to find nothing. Everything is folded before it is compared.
 *
 * Pure and client-safe; `lib/game/allTimeXI.ts` reads the archive and is server-only.
 */

const FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }

/** Fold a Hebrew name to the form a search compares: no nikud, no quotes, no finals. */
export function fold(text: string): string {
  return text
    .replace(/[֑-ׇ]/g, '')
    .replace(/[׳״'"`]/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/[ךםןףץ]/g, (letter) => FINALS[letter] ?? letter)
    .replace(/\s+/g, ' ')
    .trim()
}

/** Drop the article and any bracketed qualifier, so the index is not swallowed by "ה". */
export function nameCore(name: string): string {
  return name.replace(/[("].*$/, '').trim()
}

export type NameParts = { givenHe: string; familyHe: string; initial: string }

/**
 * Split a name into given and family.
 *
 * The last word is the family name, which is right for every name in this roster —
 * including the two-word family names, where the first of the two reads as a middle name
 * and costs nothing. Where there is only one word it IS the family name; a mononym is
 * looked up by the only thing it has.
 */
export function splitName(name: string): NameParts {
  const parts = nameCore(name).split(/\s+/).filter(Boolean)
  const familyHe = parts.length > 1 ? (parts[parts.length - 1] as string) : (parts[0] ?? name)
  const givenHe = parts.length > 1 ? parts.slice(0, -1).join(' ') : ''
  return { givenHe, familyHe, initial: fold(familyHe)[0] ?? '·' }
}

export type Searchable = {
  slug: string
  nameHe: string
  givenHe: string
  familyHe: string
  initial: string
}

/** 0 = no match. Higher is better: family prefix > given prefix > anywhere. */
export function score(entry: Searchable, folded: string): number {
  if (folded === '') return 1
  const family = fold(entry.familyHe)
  const given = fold(entry.givenHe)
  const whole = fold(entry.nameHe)
  if (family === folded) return 100
  if (family.startsWith(folded)) return 90
  if (given.startsWith(folded)) return 70
  if (family.includes(folded)) return 50
  // any word in the name starting with the term — catches a two-word family name
  if (whole.split(' ').some((word) => word.startsWith(folded))) return 40
  if (whole.includes(folded)) return 20
  return 0
}

export function searchRoster(entries: Searchable[], term: string): Searchable[] {
  const folded = fold(term)
  if (folded === '') return entries
  return entries
    .map((entry) => ({ entry, rank: score(entry, folded) }))
    .filter((row) => row.rank > 0)
    .sort(
      (a, b) =>
        b.rank - a.rank ||
        fold(a.entry.familyHe).localeCompare(fold(b.entry.familyHe), 'he'),
    )
    .map((row) => row.entry)
}

/** Group a result list under its family-name initials, in Hebrew order. */
export function byInitial(entries: Searchable[]): { letter: string; names: Searchable[] }[] {
  const buckets = new Map<string, Searchable[]>()
  for (const entry of entries) {
    const bucket = buckets.get(entry.initial) ?? []
    bucket.push(entry)
    buckets.set(entry.initial, bucket)
  }
  return [...buckets.entries()]
    .map(([letter, names]) => ({
      letter,
      names: names.sort((a, b) => fold(a.familyHe).localeCompare(fold(b.familyHe), 'he')),
    }))
    .sort((a, b) => a.letter.localeCompare(b.letter, 'he'))
}
