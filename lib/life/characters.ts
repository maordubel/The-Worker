import type { CharacterId } from './types'

/**
 * מרשם הדמויות — everybody the life can know, as data.
 *
 * The engine used to depend on the union `'kobi' | 'rachel' | 'ofir'`, which meant the
 * day 1996 introduces a squadmate is the day a type at the bottom of the stack changes
 * and every switch statement over it has to be revisited. A character is now a row.
 *
 * `activeEras` is the honest way to say that people arrive and leave. Nobody is deleted
 * from a life — Ofir at eight and Ofir at twenty-two are one person with two portrait
 * sets — so the registry carries the whole cast and the era decides who is on screen.
 */

export type CharacterCategory = 'family' | 'friend' | 'supporter' | 'historical' | 'other'

export type CharacterDefinition = {
  id: CharacterId
  displayNameHe: string
  category: CharacterCategory
  /** chapter keys, e.g. '1983' | '1986' | '1990'. '*' means every era. */
  activeEras: string[]
  /** the art key prefix the runtime uses for this person's plates */
  portraitSet?: string
  tags?: string[]
}

const REGISTRY: CharacterDefinition[] = [
  {
    id: 'kobi',
    displayNameHe: 'קובי',
    category: 'family',
    activeEras: ['*'],
    portraitSet: 'faceKobi',
    tags: ['father', 'gate7'],
  },
  {
    id: 'rachel',
    displayNameHe: 'רחל',
    category: 'family',
    activeEras: ['*'],
    portraitSet: 'faceRachel',
    tags: ['mother'],
  },
  {
    id: 'ofir',
    displayNameHe: 'אופיר',
    category: 'friend',
    activeEras: ['1986', '1990', '1996', '2000'],
    portraitSet: 'faceOfir',
    tags: ['neighbourhood', 'street'],
  },
  {
    id: 'amit',
    displayNameHe: 'עמית',
    category: 'friend',
    activeEras: ['1986', '1990', '1996', '2000'],
    portraitSet: 'faceAmit',
    tags: ['information', 'newspaper'],
  },
  {
    id: 'efi',
    displayNameHe: 'אפי',
    category: 'friend',
    activeEras: ['1986', '1990'],
    portraitSet: 'faceEfi',
    tags: ['basketball', 'ussishkin'],
  },
  {
    id: 'keren',
    displayNameHe: 'קרן',
    category: 'friend',
    activeEras: ['1986', '1990'],
    portraitSet: 'faceKeren',
    tags: ['neighbourhood'],
  },
  {
    id: 'neighbour',
    displayNameHe: 'שכן',
    category: 'other',
    activeEras: ['1986'],
    portraitSet: 'faceOldMan',
  },
  {
    id: 'shopkeeper',
    displayNameHe: 'בעל הקיוסק',
    category: 'other',
    activeEras: ['1986'],
    portraitSet: 'faceOldMan',
    tags: ['kiosk'],
  },
  {
    id: 'veteran',
    displayNameHe: 'אוהד ותיק',
    category: 'supporter',
    activeEras: ['1986', '1990'],
    portraitSet: 'faceFan',
    tags: ['terrace', 'gate7'],
  },
]

export const CHARACTERS: Record<CharacterId, CharacterDefinition> = Object.fromEntries(
  REGISTRY.map((entry) => [entry.id, entry]),
)

export const ALL_CHARACTERS: readonly CharacterDefinition[] = REGISTRY

export function characterName(id: CharacterId): string {
  return CHARACTERS[id]?.displayNameHe ?? id
}

export function isActiveIn(id: CharacterId, era: string): boolean {
  const definition = CHARACTERS[id]
  if (!definition) return false
  return definition.activeEras.includes('*') || definition.activeEras.includes(era)
}

/** The people a chapter should be tracking, so a profile screen does not list a stranger. */
export function castFor(era: string): readonly CharacterDefinition[] {
  return REGISTRY.filter((entry) => entry.activeEras.includes('*') || entry.activeEras.includes(era))
}
