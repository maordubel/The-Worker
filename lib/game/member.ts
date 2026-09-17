/**
 * פנקס חבר — the member book, from `The Worker - Gate 10 and States.dc.html`.
 *
 * The design brief for gate 10 is the sharpest thing in the whole handoff and it is a
 * product decision, not a layout: **the profile is not a scoreboard.** It shows days
 * you turned up and facts you corrected, and the one big number on the page is the
 * number of corrections the archive accepted from you. Nothing on it can be bought.
 *
 * That is why this module holds no score. A run's points live and die inside the run;
 * what persists is a punch — one per day you played — and the corrections you filed.
 *
 * It all lives in `localStorage`, which is the honest shape for it today: there is no
 * account system, so the book belongs to the device the way a paper one belongs to a
 * pocket. A correction is recorded as PENDING when you file it, and only the archive
 * can move it to approved — the card says so rather than pretending.
 */

const KEY = 'worker.member.v1'

export type Correction = {
  id: string
  /** which gate it came from — GATE 7 · KIT */
  tagHe: string
  /** the ISO date it was filed */
  filedOn: string
  bodyHe: string
  status: 'pending' | 'approved'
}

export type MemberBook = {
  /** the file number, printed vertically on the stub. Fixed for the life of the book. */
  tik: string
  nameHe: string
  /** the number on the back of your shirt */
  number: number
  since: number
  /** ISO dates, one per day of activity. Punched, never erased. */
  punches: string[]
  corrections: Correction[]
}

export const QUARTER_SLOTS = 90

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** A file number that looks issued rather than generated. Stable once written. */
function mintTik(): string {
  const n = 1 + Math.floor(Math.random() * 8999)
  return `TIK-${String(n).padStart(4, '0')}`
}

export function emptyBook(): MemberBook {
  return {
    tik: mintTik(),
    nameHe: '',
    number: 17,
    since: new Date().getFullYear(),
    punches: [],
    corrections: [],
  }
}

/**
 * The book as it is actually stored, or `null` when this device has never had one.
 *
 * `readBook()` answers "what does the card look like", and for that an unsaved book is
 * the right answer. The sync seam (`lib/portal/sync.ts`) is asking something else —
 * *does this device already hold a file number?* — and a freshly minted one is the wrong
 * answer to that question, because a number nobody has seen yet must never be carried up
 * into an account that already has one.
 */
export function storedBook(): MemberBook | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<MemberBook>
    return { ...emptyBook(), ...parsed, punches: parsed.punches ?? [], corrections: parsed.corrections ?? [] }
  } catch {
    return null
  }
}

/**
 * **A file number is issued once.** Until 17.9.2026 this function minted a fresh `TIK-…`
 * on every call for a device that had never saved anything — so the card printed a
 * different number on every visit, and the one field on it the product describes as
 * unearnable was the one field that changed most. The first read now WRITES the book it
 * mints, which is the only way the number can mean what the card says it means, and it
 * is what makes `app_profile.member_no` a real key rather than a snapshot of whatever
 * the last page load happened to roll.
 */
export function readBook(): MemberBook {
  if (typeof window === 'undefined') return emptyBook()
  const saved = storedBook()
  if (saved !== null) return saved
  const fresh = emptyBook()
  writeBook(fresh)
  return fresh
}

export function writeBook(book: MemberBook): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(book))
  } catch {
    // private mode, blocked storage — the app keeps working, the book just does not persist
  }
}

/** Stamp today's slot. Idempotent: a day is punched once however much you play. */
export function punchToday(book: MemberBook): MemberBook {
  const date = today()
  if (book.punches.includes(date)) return book
  return { ...book, punches: [...book.punches, date] }
}

export function fileCorrection(book: MemberBook, tagHe: string, bodyHe: string): MemberBook {
  return {
    ...book,
    corrections: [
      { id: `${Date.now()}`, tagHe, filedOn: today(), bodyHe, status: 'pending' },
      ...book.corrections,
    ],
  }
}

export function approvedCount(book: MemberBook): number {
  return book.corrections.filter((row) => row.status === 'approved').length
}

/** The last ninety days, newest last — the grid the card prints. */
export function quarterGrid(book: MemberBook): boolean[] {
  const punched = new Set(book.punches)
  const out: boolean[] = []
  const now = new Date()
  for (let back = QUARTER_SLOTS - 1; back >= 0; back -= 1) {
    const day = new Date(now)
    day.setDate(now.getDate() - back)
    out.push(punched.has(day.toISOString().slice(0, 10)))
  }
  return out
}
