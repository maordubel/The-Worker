import type { LifeState, LocationId } from './types'

/**
 * המפה — תל אביב, and the places in it this life reaches.
 *
 * Maor's ask (5.9.2026): a map that LOOKS like Tel Aviv — the real one, with Bloomfield
 * in Jaffa and Ussishkin on the Yarkon — where a tap on the house, the pitch, the street
 * takes you there; and where a place is not on the map until the life has reached it,
 * so that the first sight of the ground is a moment the map itself plays.
 *
 * Coordinates are real (WGS84) and the projection is a plain plate carrée over one box
 * of the city, which at this latitude is near enough to true that the coast, the river
 * and the stadium sit where a person who lives here expects them. Every place carries a
 * `confidence` because two of them are gone: the hall on Ussishkin street was demolished
 * in 2007 and the boardwalk stands there now, and its pin is placed from that.
 *
 * A place is REVEALED by a flag — a scene entered, or a thing seen (`saw:road`: the
 * floodlight pylons over the rooftops are the first sight of Bloomfield, and that is the
 * moment the ground goes on the map, not the moment the boy stands under it). The reveal
 * is persisted as `life:reveal:<id>`, a person-flag that survives every year, and the
 * runtime plays the moment once. Quiet places (the house, the street) reveal without one.
 */

export type MapPlaceId =
  | 'home'
  | 'street'
  | 'kiosk'
  | 'pitch'
  | 'school'
  | 'route'
  | 'bloomfield'
  | 'ussishkin'
  | 'yad-eliyahu'
  | 'bus-station'
  | 'hatikva'
  | 'ramat-gan'
  | 'base'

export type MapPlaceDef = {
  id: MapPlaceId
  labelHe: string
  /** what the map says under the name — a neighbourhood, a street */
  subHe: string
  lat: number
  lon: number
  /** the scene a tap goes to, and the scenes that count as being here */
  scene: LocationId | null
  scenes: readonly LocationId[]
  /** the flag whose first rise reveals it; `null` = revealed from the first minute */
  revealFlag: string | null
  /** the moment — the line the reveal card says; null for a quiet reveal */
  revealHe: string | null
  /** how sure the pin is: real coordinates, or placed from what stood there */
  confidence: 'exact' | 'placed'
  /** the earliest chapter it can exist in — a pin from 1996 has no business in 1986 */
  fromYear: number
  /** drawn at the edge with an arrow: not in the city */
  offMap?: boolean
}

export const MAP_PLACES: readonly MapPlaceDef[] = [
  {
    id: 'home',
    labelHe: 'הבית',
    subHe: 'יפו, ליד סלמה',
    lat: 32.053,
    lon: 34.753,
    scene: 'home',
    scenes: ['bedroom', 'home', 'kitchen'],
    revealFlag: null,
    revealHe: null,
    confidence: 'placed',
    fromYear: 1978,
  },
  {
    id: 'street',
    labelHe: 'הרחוב',
    subHe: 'השכונה',
    lat: 32.0548,
    lon: 34.7552,
    scene: 'street',
    scenes: ['street'],
    revealFlag: null,
    revealHe: null,
    confidence: 'placed',
    fromYear: 1978,
  },
  {
    id: 'kiosk',
    labelHe: 'הקיוסק של רפי',
    subHe: 'בפינה',
    lat: 32.0563,
    lon: 34.7537,
    scene: 'kiosk',
    scenes: ['kiosk'],
    revealFlag: 'life:been:kiosk',
    revealHe: null,
    confidence: 'placed',
    fromYear: 1978,
  },
  {
    id: 'pitch',
    labelHe: 'המגרש',
    subHe: 'מגרש העפר של השכונה',
    lat: 32.0514,
    lon: 34.7554,
    scene: 'pitch',
    scenes: ['pitch'],
    revealFlag: 'life:been:pitch',
    revealHe: null,
    confidence: 'placed',
    fromYear: 1978,
  },
  {
    id: 'school',
    labelHe: 'בית הספר',
    subHe: 'הכיתה והחצר',
    lat: 32.0571,
    lon: 34.7519,
    scene: 'schoolyard',
    scenes: ['classroom', 'schoolyard'],
    revealFlag: 'life:been:classroom',
    revealHe: 'גם פה יש לך מקום.',
    confidence: 'placed',
    fromYear: 1990,
  },
  {
    id: 'route',
    labelHe: 'הדרך מזרחה',
    subHe: 'לבלומפילד',
    lat: 32.0531,
    lon: 34.7569,
    scene: 'route',
    scenes: ['route'],
    revealFlag: 'life:been:route',
    revealHe: null,
    confidence: 'placed',
    fromYear: 1978,
  },
  {
    id: 'bloomfield',
    labelHe: 'בלומפילד',
    subHe: 'יפו · 1962',
    lat: 32.0517,
    lon: 34.7583,
    scene: 'bloomfield-outside',
    scenes: ['bloomfield-outside', 'bloomfield-tunnel', 'bloomfield-inside'],
    // the floodlight pylons over the rooftops — seen before it is reached
    revealFlag: 'saw:road',
    revealHe: 'ראית את עמודי התאורה מעל הגגות. עכשיו אתה יודע את הדרך.',
    confidence: 'exact',
    fromYear: 1978,
  },
  {
    id: 'ussishkin',
    labelHe: 'אולם אוסישקין',
    subHe: 'על הירקון · רחוב אוסישקין',
    lat: 32.0965,
    lon: 34.7885,
    scene: 'ussishkin-outside',
    scenes: ['ussishkin-outside', 'ussishkin-hall', 'ussishkin-end'],
    revealFlag: 'life:been:ussishkin-outside',
    revealHe: 'הבית השני. מהיום הוא על המפה שלך.',
    confidence: 'placed',
    fromYear: 1990,
  },
  {
    id: 'yad-eliyahu',
    labelHe: 'יד אליהו',
    subHe: 'ההיכל',
    lat: 32.0563,
    lon: 34.7873,
    scene: null,
    scenes: [],
    revealFlag: 'life:been:yad-eliyahu',
    revealHe: 'היכל גדול. הפעם זה גמר.',
    confidence: 'exact',
    fromYear: 1993,
  },
  {
    id: 'bus-station',
    labelHe: 'התחנה המרכזית',
    subHe: 'החדשה',
    lat: 32.0556,
    lon: 34.7796,
    scene: null,
    scenes: [],
    revealFlag: 'life:been:bus-station',
    revealHe: null,
    confidence: 'exact',
    fromYear: 1996,
  },
  {
    id: 'hatikva',
    labelHe: 'שכונת התקווה',
    subHe: 'המגרש של בני יהודה',
    lat: 32.0538,
    lon: 34.7942,
    scene: null,
    scenes: [],
    revealFlag: 'life:been:hatikva',
    revealHe: 'לא הבית שלך. היום זה לא משנה.',
    confidence: 'exact',
    fromYear: 2000,
  },
  {
    id: 'ramat-gan',
    labelHe: 'אצטדיון רמת גן',
    subHe: 'הגמר',
    lat: 32.0803,
    lon: 34.8238,
    scene: null,
    scenes: [],
    revealFlag: 'life:been:ramat-gan',
    revealHe: 'האצטדיון הלאומי. גמר גביע.',
    confidence: 'exact',
    fromYear: 1999,
  },
  {
    id: 'base',
    labelHe: 'הבסיס',
    subHe: 'מחוץ לעיר',
    lat: 32.03,
    lon: 34.835,
    scene: null,
    scenes: [],
    revealFlag: 'life:been:base',
    revealHe: null,
    confidence: 'placed',
    fromYear: 1996,
    offMap: true,
  },
]

export const MAP_PLACE: Record<string, MapPlaceDef> = Object.fromEntries(MAP_PLACES.map((p) => [p.id, p]))

/** the box of the city the map draws — lon west/east, lat south/north */
export const MAP_BOX = { west: 34.735, east: 34.835, south: 32.03, north: 32.115 }
/** the drawing's own size; one unit of lon is stretched by cos(32°) so a block is square */
export const MAP_SIZE = { w: 1000, h: 1000 }

/** WGS84 → map units. Plate carrée over the box, latitude-corrected. */
export function project(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon - MAP_BOX.west) / (MAP_BOX.east - MAP_BOX.west)) * MAP_SIZE.w
  const y = ((MAP_BOX.north - lat) / (MAP_BOX.north - MAP_BOX.south)) * MAP_SIZE.h
  return { x, y }
}

export const revealFlagOf = (id: MapPlaceId) => `life:reveal:${id}`

/** Is this place on the player's map — revealed, and of this life's time. */
export function isRevealed(state: LifeState, place: MapPlaceDef): boolean {
  if (state.year < place.fromYear) return false
  if (place.revealFlag === null) return true
  return Boolean(state.flags[revealFlagOf(place.id)])
}

/** The place a scene belongs to, or null for a scene that is nowhere on the city map. */
export function placeOfScene(scene: LocationId): MapPlaceDef | null {
  return MAP_PLACES.find((p) => p.scenes.includes(scene)) ?? null
}

/**
 * מה נחשף עכשיו — the places whose reveal flag rose between two states and that are not
 * yet on the map. The runtime calls this on every dispatch, writes the persisted reveal,
 * and plays the moment for the ones that have a line.
 */
export function newlyRevealed(before: LifeState, after: LifeState): MapPlaceDef[] {
  const out: MapPlaceDef[] = []
  for (const place of MAP_PLACES) {
    if (!place.revealFlag) continue
    if (after.year < place.fromYear) continue
    if (after.flags[revealFlagOf(place.id)]) continue
    const was = Boolean(before.flags[place.revealFlag])
    const now = Boolean(after.flags[place.revealFlag])
    if (!was && now) out.push(place)
  }
  return out
}

// ---------------------------------------------------------------------------------
// THE CITY — the lines the map is drawn from. Real geography, simplified to what a hand
// would draw: the coast from Tel Baruch to Bat Yam with the hook of Jaffa's port, the
// Yarkon, the Ayalon, the streets a person names when giving directions.
// ---------------------------------------------------------------------------------

export type MapLine = { id: string; kind: 'coast' | 'river' | 'highway' | 'road'; points: readonly [number, number][]; labelHe?: string }

export const CITY_LINES: readonly MapLine[] = [
  {
    id: 'coast',
    kind: 'coast',
    points: [
      [32.115, 34.783],
      [32.105, 34.778],
      [32.1, 34.775],
      [32.097, 34.772],
      [32.09, 34.769],
      [32.083, 34.766],
      [32.075, 34.763],
      [32.068, 34.760],
      [32.062, 34.757],
      [32.057, 34.753],
      [32.053, 34.750],
      [32.05, 34.748],
      [32.046, 34.746],
      [32.04, 34.744],
      [32.034, 34.742],
      [32.03, 34.741],
    ],
  },
  {
    id: 'yarkon',
    kind: 'river',
    labelHe: 'הירקון',
    points: [
      [32.1, 34.775],
      [32.099, 34.783],
      [32.1, 34.792],
      [32.102, 34.803],
      [32.104, 34.814],
      [32.103, 34.824],
      [32.1, 34.835],
    ],
  },
  {
    id: 'ayalon',
    kind: 'highway',
    labelHe: 'איילון',
    points: [
      [32.115, 34.808],
      [32.1, 34.802],
      [32.09, 34.797],
      [32.075, 34.793],
      [32.06, 34.79],
      [32.048, 34.787],
      [32.036, 34.784],
      [32.03, 34.782],
    ],
  },
  { id: 'dizengoff', kind: 'road', labelHe: 'דיזנגוף', points: [[32.097, 34.777], [32.085, 34.774], [32.075, 34.772], [32.069, 34.772]] },
  { id: 'ibngvirol', kind: 'road', labelHe: 'אבן גבירול', points: [[32.101, 34.784], [32.088, 34.782], [32.078, 34.781], [32.07, 34.78]] },
  { id: 'allenby', kind: 'road', labelHe: 'אלנבי', points: [[32.077, 34.767], [32.07, 34.769], [32.064, 34.771], [32.06, 34.772]] },
  { id: 'rothschild', kind: 'road', points: [[32.06, 34.77], [32.066, 34.777], [32.07, 34.783]] },
  { id: 'yafo', kind: 'road', labelHe: 'דרך יפו', points: [[32.057, 34.752], [32.06, 34.762], [32.062, 34.771]] },
  { id: 'salame', kind: 'road', labelHe: 'סלמה', points: [[32.054, 34.751], [32.055, 34.762], [32.056, 34.774], [32.058, 34.786]] },
  { id: 'kibbutz', kind: 'road', labelHe: 'קיבוץ גלויות', points: [[32.05, 34.756], [32.052, 34.768], [32.053, 34.781]] },
  { id: 'yefet', kind: 'road', labelHe: 'יפת', points: [[32.055, 34.752], [32.048, 34.751], [32.04, 34.752]] },
  { id: 'lahagana', kind: 'road', points: [[32.053, 34.781], [32.056, 34.79], [32.058, 34.798]] },
  { id: 'rokach', kind: 'road', labelHe: 'רוקח', points: [[32.098, 34.78], [32.097, 34.79], [32.097, 34.802], [32.096, 34.815]] },
  { id: 'jabotinsky', kind: 'road', points: [[32.084, 34.792], [32.084, 34.805], [32.083, 34.82]] },
  { id: 'begin', kind: 'road', points: [[32.07, 34.788], [32.078, 34.795], [32.086, 34.8]] },
]

export const CITY_LABELS: readonly { labelHe: string; lat: number; lon: number; size: 'town' | 'hood' }[] = [
  { labelHe: 'תל אביב', lat: 32.078, lon: 34.775, size: 'town' },
  { labelHe: 'יפו', lat: 32.047, lon: 34.753, size: 'town' },
  { labelHe: 'רמת גן', lat: 32.082, lon: 34.815, size: 'town' },
  { labelHe: 'בת ים', lat: 32.033, lon: 34.75, size: 'town' },
  { labelHe: 'פלורנטין', lat: 32.058, lon: 34.767, size: 'hood' },
  { labelHe: 'שכונת התקווה', lat: 32.05, lon: 34.796, size: 'hood' },
  { labelHe: 'יד אליהו', lat: 32.06, lon: 34.789, size: 'hood' },
  { labelHe: 'הצפון הישן', lat: 32.09, lon: 34.776, size: 'hood' },
  { labelHe: 'הים', lat: 32.075, lon: 34.745, size: 'hood' },
]
