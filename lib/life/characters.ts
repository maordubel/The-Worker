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

export type CharacterCategory = 'family' | 'friend' | 'supporter' | 'historical' | 'rival' | 'other'

/**
 * How much of a person is real (bible §9, §15).
 *
 * `fiction` — invented, free to talk. `composite` — fictionalized from a real person
 * (Yosef, Melamed, Asaf, Yevgeny): the real name is provenance in a comment, never on
 * screen. `real` — a real, named person: appears only in public, dated settings, never in
 * an invented private meeting, never as a "boss", every claim sourced. `open-history` —
 * real AND still unfolding (Ofer Yannay): no redemption arc, no downfall, every figure
 * dated, re-checked before publishing.
 */
export type CharacterProvenance = 'fiction' | 'composite' | 'real' | 'open-history'

export type CharacterDefinition = {
  id: CharacterId
  displayNameHe: string
  category: CharacterCategory
  /** chapter keys, e.g. '1983' | '1986' | '1990'. '*' means every era. */
  activeEras: string[]
  /** the art key prefix the runtime uses for this person's plates */
  portraitSet?: string
  tags?: string[]
  /** defaults to 'fiction' */
  provenance?: CharacterProvenance
}

/**
 * Ids the bible (5.9.2026, §15) forbids outright. They were provisional names in earlier
 * drafts, or the real people behind composites; a script that reaches for one of them is
 * a script that has re-invented a person who already has a row.
 */
export const FORBIDDEN_CHARACTER_IDS: readonly string[] = [
  'maor',
  'assi',
  'eyal-melamed',
  'gabi',
  'meir',
  'tiki',
  'yuri',
]

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
    activeEras: ['1986+'],
    portraitSet: 'faceOfir',
    tags: ['neighbourhood', 'street'],
  },
  {
    id: 'amit',
    displayNameHe: 'עמית',
    category: 'friend',
    activeEras: ['1986+'],
    portraitSet: 'faceAmit',
    tags: ['information', 'newspaper'],
  },
  {
    id: 'efi',
    displayNameHe: 'אפי',
    category: 'friend',
    activeEras: ['1986+'],
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
  /**
   * המורה, הסדרן והמוכר — 1991, and the first people in this life who are a ROLE.
   *
   * They have no first names on purpose. A twelve-year-old does not know his teacher's
   * first name and has never asked the usher's; what he knows is what they do, which is
   * exactly how the chapter addresses them. They are registered all the same, because a
   * schedule may only drive somebody the cast knows about, and because the usher is
   * going to remember him for another fifteen years of this game.
   */
  {
    id: 'teacher',
    displayNameHe: 'המורה',
    category: 'other',
    activeEras: ['1991', '1998-laces'],
    portraitSet: 'faceTeacher',
    tags: ['school'],
  },
  {
    id: 'usher',
    displayNameHe: 'סדרן',
    category: 'other',
    activeEras: ['1980', '1990'],
    portraitSet: 'faceFan',
    tags: ['ussishkin'],
  },
  {
    id: 'vendor',
    displayNameHe: 'מוכר',
    category: 'other',
    activeEras: ['1991'],
    portraitSet: 'faceFan',
    tags: ['ussishkin'],
  },
  /**
   * יוסף — the neighbour, and the reason he has a name at all.
   *
   * He was written as "שלום", which collides head-on with שלום תקווה, a real Hapoel
   * footballer who appears in the canonical archive and in the kit and squad data. One
   * of the two had to move, and it is never the historical person: a fictional character
   * borrowing a real player's name is exactly the class of confusion rule 11 exists to
   * prevent, and it would eventually put an invented sentence in a real man's mouth.
   * Maor renamed the fiction on 2.9.2026. שלום תקווה stays שלום תקווה, in the archive,
   * where he belongs.
   */
  {
    /**
     * יוסף — 2000s, and not a day earlier.
     *
     * Two of Maor's own documents disagreed about him: the character bible put him in the
     * neighbourhood of 1986–1990, the production table said he enters at the beginning of
     * the 2000s. Maor settled it on 5.9.2026 — he is fictionalized from the founder of
     * Hapoel Ussishkin and a senior figure in Ultras Hapoel, and that man's story starts
     * in the 2000s. So the adult on the 1986 stairwell is אילן השכן, who was always the
     * neighbour in the bible, and Yosef waits for his own decade. His figure (`yosef`,
     * `yosef-back`) is the one the September sheet labelled שלום — "שלום בתמונות הישנות
     * → יוסף" — and it is not placed in any chapter before 2000.
     */
    id: 'yosef',
    displayNameHe: 'יוסף',
    category: 'supporter',
    activeEras: ['2000', '2010', '2020'],
    tags: ['ussishkin', 'ultras', 'neighbourhood', 'katamin', 'voice'],
    provenance: 'composite',
  },
  {
    id: 'neighbour',
    displayNameHe: 'אילן השכן',
    category: 'other',
    activeEras: ['1986'],
    portraitSet: 'faceOldMan',
  },
  {
    id: 'shopkeeper',
    displayNameHe: 'רפי מהקיוסק',
    category: 'other',
    activeEras: ['1986'],
    portraitSet: 'faceOldMan',
    tags: ['kiosk'],
  },
  /**
   * ---------------------------------------------------------------------------------
   * הקאסט של ה-Character Bible (4.9.2026) — registered before their art exists.
   *
   * The bible is explicit about the order of operations (§13): a character is a ROW
   * first — stable id, display name, eras, tags — so that relationships, encounters and
   * placements can be written against them, and `portraitSet` is added only in the same
   * change that adds every file it names. So nobody below has a portrait set: pointing
   * runtime code at a PNG that does not exist is the one thing the bible forbids twice.
   *
   * Eras are written the way the bible writes them: a chapter id ('1993-cup'), a decade
   * ('1990' = every 199x chapter), or a start year with a plus ('1996+' = from the army
   * chapter on, for the rest of the life). `eraCovers` below does the matching.
   *
   * Provenance stays in comments and never on screen: מאור הראל → יוסף, אסי והבה → אסף,
   * אייל מלמד → מלמד. The real names are production history, not characters.
   */
  {
    id: 'barry',
    displayNameHe: 'בארי',
    category: 'supporter',
    activeEras: ['1986+'],
    tags: ['gate7', 'terrace', 'continuity'],
  },
  {
    // The production table renames the 1980s radio man גבי → לירון and says so in those
    // words ("formerly listed as גבי"); the character bible still calls him Gabi. One
    // person, one id, and the newer name wins — flagged for Maor in the delivery notes.
    id: 'liron',
    displayNameHe: 'לירון',
    category: 'supporter',
    activeEras: ['1980', '1990'],
    tags: ['radio', 'gate7', 'repairs', 'car'],
  },
  {
    id: 'crowd-aliza',
    displayNameHe: 'עליזה',
    category: 'supporter',
    activeEras: ['1980', '1990'],
    tags: ['tickets', 'memory', 'neighbourhood'],
  },
  {
    id: 'melamed',
    displayNameHe: 'מלמד',
    category: 'supporter',
    activeEras: ['1990'],
    tags: ['songs', 'darbuka'],
    provenance: 'composite',
  },
  {
    id: 'michel',
    displayNameHe: 'מישל בר־כליפא',
    category: 'supporter',
    activeEras: ['1990'],
    tags: ['transport', 'network', 'memorial'],
    provenance: 'real',
  },
  {
    id: 'soko',
    displayNameHe: 'סוקו',
    category: 'supporter',
    activeEras: ['1990'],
    tags: ['archive', 'records'],
  },
  {
    id: 'shachor',
    displayNameHe: 'שחור',
    category: 'supporter',
    activeEras: ['1990'],
    tags: ['ussishkin', 'organiser'],
    provenance: 'real',
  },
  {
    id: 'freddy',
    displayNameHe: 'פרדי',
    category: 'supporter',
    activeEras: ['1990'],
    tags: ['law', 'politics', 'argument'],
  },
  {
    id: 'crowd-dudu',
    displayNameHe: 'דודו',
    category: 'supporter',
    activeEras: ['1990'],
    tags: ['away', 'bus', 'noise'],
  },
  {
    id: 'crowd-limor',
    displayNameHe: 'לימור',
    category: 'supporter',
    activeEras: ['1990'],
    tags: ['ussishkin', 'queues', 'routes'],
  },
  /**
   * ...and the people whose chapters do not exist yet.
   *
   * They are here for one reason and it is worth stating: an id that is not registered is
   * an id somebody re-invents. The provisional names in earlier drafts — מאיר for ירון,
   * תיקי for בתיה — are exactly what this prevents, and so is a second row for a person
   * who already has one. `castFor` never returns them until their chapter exists, and no
   * scene may place them before their entry era.
   */
  { id: 'yaron', displayNameHe: 'ירון', category: 'friend', activeEras: ['1996+'], tags: ['army', 'peer'] },
  { id: 'asaf', displayNameHe: 'אסף', category: 'supporter', activeEras: ['1996+'], provenance: 'composite', tags: ['gate5', 'organiser'] },
  { id: 'omer-hermesh', displayNameHe: 'עומר חרמש', category: 'friend', activeEras: ['1997+'], provenance: 'real', tags: ['records', 'travel', 'memorial'] },
  { id: 'uli', displayNameHe: 'אולי', category: 'friend', activeEras: ['2000', '2010'], tags: ['away', 'risk'] },
  { id: 'batya', displayNameHe: 'בתיה', category: 'supporter', activeEras: ['2000', '2010', '2020'], tags: ['neighbourhood', 'comedy', 'memory'] },
  { id: 'yonatan', displayNameHe: 'יונתן', category: 'friend', activeEras: ['2010', '2020'], tags: ['music', 'rival-friend'] },
  { id: 'melanie', displayNameHe: 'מלאני', category: 'other', activeEras: ['2010', '2020'], tags: ['relationship'] },
  { id: 'dor', displayNameHe: 'דור', category: 'other', activeEras: ['2010', '2020'], tags: ['relationship', 'protest'] },
  { id: 'crowd-erez', displayNameHe: 'ארז', category: 'supporter', activeEras: ['2000', '2010'], tags: ['tifo', 'work'] },
  { id: 'crowd-inbal', displayNameHe: 'ענבל', category: 'supporter', activeEras: ['2000', '2010'], tags: ['ussishkin', 'volunteer'] },
  { id: 'crowd-lior', displayNameHe: 'ליאור', category: 'supporter', activeEras: ['2010', '2020'], tags: ['protest', 'phones'] },
  { id: 'crowd-shani', displayNameHe: 'שני', category: 'supporter', activeEras: ['2010', '2020'], tags: ['photography', 'away'] },
  { id: 'crowd-noam', displayNameHe: 'נועם', category: 'supporter', activeEras: ['2020'], tags: ['songs', 'archive'] },
  { id: 'crowd-maya', displayNameHe: 'מאיה', category: 'supporter', activeEras: ['2020'], tags: ['mutual-aid'] },
  /**
   * ---------------------------------------------------------------------------------
   * The bible of 5.9.2026 — forty-five locked ids.
   *
   * Eleven rows were missing from this registry. They divide into three kinds and the
   * kind decides what a script may do with them:
   *
   * The FOOTBALLERS (שלום תקוה, שביט אלימלך) are historical. They are seen from the stand
   * and talked ABOUT; the player never chats with them and no line is put in their mouth.
   * The spelling שלום תקוה — one vav — is the bible's and is final.
   *
   * The OWNERS (אייזנברג, טביב, ינאי) are real and named. §15: not bosses, not free for
   * invented dialogue, never a private meeting with Pogi; the game shows the supporters'
   * version, their own version, and the historical outcome. Yannay is `open-history`.
   *
   * The 2000s CAST (אזולאי, ארז מחיפה, שלומי קעקוע, יבגני, נטע, גור) are fiction or
   * composites. Two people are named ארז and the bible forbids merging them: `crowd-erez`
   * builds tifo at night for Hapoel; `fan-erez-haifa` is the dry half of a Maccabi Haifa
   * friendship. Yevgeny is fictionalized from יורי סדלצקי — the name stays in this
   * comment — and the 2015 attack on him is never shown graphically.
   */
  { id: 'shalom-tikva', displayNameHe: 'שלום תקוה', category: 'historical', activeEras: ['1997+'], tags: ['footballer', 'seen-only'], provenance: 'real' },
  { id: 'shavit-elimelech', displayNameHe: 'שביט אלימלך', category: 'historical', activeEras: ['1996+'], tags: ['footballer', 'goalkeeper', 'seen-only'], provenance: 'real' },
  { id: 'shaul-eisenberg', displayNameHe: 'שאול אייזנברג', category: 'historical', activeEras: ['1995+'], tags: ['owner', 'basketball', 'ussishkin', 'public-only'], provenance: 'real' },
  { id: 'eli-tabib', displayNameHe: 'אלי טביב', category: 'historical', activeEras: ['2010'], tags: ['owner', 'football', 'protest', 'public-only'], provenance: 'real' },
  { id: 'ofer-yannay', displayNameHe: 'עופר ינאי', category: 'historical', activeEras: ['2020'], tags: ['owner', 'basketball', 'yad-eliyahu', 'public-only', 'open-history'], provenance: 'open-history' },
  { id: 'fan-azoulay', displayNameHe: 'אזולאי', category: 'rival', activeEras: ['2000', '2010'], tags: ['maccabi-haifa', 'kiryat-eliezer', 'warm'] },
  { id: 'fan-erez-haifa', displayNameHe: 'ארז מחיפה', category: 'rival', activeEras: ['2000', '2010'], tags: ['maccabi-haifa', 'kiryat-eliezer', 'dry'] },
  { id: 'shlomi-tattoo', displayNameHe: 'שלומי קעקוע', category: 'rival', activeEras: ['2000'], tags: ['beitar', 'confrontation', 'off-screen-death'] },
  { id: 'yevgeny', displayNameHe: 'יבגני', category: 'supporter', activeEras: ['2000', '2010'], tags: ['ultras', 'leader'], provenance: 'composite' },
  { id: 'neta-katamin', displayNameHe: 'נטע גופן', category: 'friend', activeEras: ['2010', '2020'], tags: ['katamin', 'bass', 'producer'], provenance: 'composite' },
  { id: 'gur-katamin', displayNameHe: 'גור שפיגל', category: 'friend', activeEras: ['2010', '2020'], tags: ['katamin', 'drums'], provenance: 'composite' },
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

/**
 * A registered era matches a chapter three ways: exactly ('1993-cup'), by decade start
 * ('1990' covers every 199x chapter — the bible writes "שנות ה־90"), or by decade key
 * ('1990s'). So `ofir` registered for '1990' is on the 1993 stairs without a row edit
 * every time a chapter is added.
 */
function eraCovers(era: string, chapter: string): boolean {
  if (era === '*' || era === chapter) return true
  const year = Number(chapter.slice(0, 4))
  if (!Number.isFinite(year)) return false
  if (era.endsWith('+')) return year >= Number(era.slice(0, -1))
  const decade = Math.floor(year / 10) * 10
  return era === String(decade) || era === `${decade}s`
}

export function isActiveIn(id: CharacterId, era: string): boolean {
  const definition = CHARACTERS[id]
  if (!definition) return false
  return definition.activeEras.some((e) => eraCovers(e, era))
}

/** The people a chapter should be tracking, so a profile screen does not list a stranger. */
export function castFor(era: string): readonly CharacterDefinition[] {
  return REGISTRY.filter((entry) => entry.activeEras.some((e) => eraCovers(e, era)))
}

/** Real, named people — every line about them is sourced and they are never "bosses". */
export function isRealPerson(id: CharacterId): boolean {
  const p = CHARACTERS[id]?.provenance
  return p === 'real' || p === 'open-history'
}
