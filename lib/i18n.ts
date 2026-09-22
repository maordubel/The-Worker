import he from '@/messages/he.json'
import heLife from '@/messages/he.life.json'
import heArchive from '@/messages/he.gates.archive.json'
import heCard from '@/messages/he.gates.card.json'
import heChallenge from '@/messages/he.gates.challenge.json'
import heCore from '@/messages/he.gates.core.json'
import heKits from '@/messages/he.gates.kits.json'
import hePlayers from '@/messages/he.gates.players.json'
import heReplay from '@/messages/he.gates.replay.json'

/**
 * Minimal i18n. No dependency: one locale ships today, the shape is ready for more.
 * Swap for next-intl only when a second locale is actually required.
 *
 * **Two files, one catalogue, and the split is about people rather than about code.**
 * Every `life.*` key — the whole of THE WORKER LIFE, 476 strings — lives in
 * `messages/he.life.json`; everything the gates say lives in `messages/he.json`. The
 * merge here is the catalogue, so nothing downstream can tell the difference: `t()` and
 * `MessageKey` cover both files, and a key is still a key wherever it sits.
 *
 * The reason is that this repository is written in two chats at once — the gates in one,
 * LIFE in the other — and a single catalogue file made the one file both of them had to
 * touch. Two deliveries that append a line each to the same tail of the same JSON is a
 * merge conflict every single time, on work that never actually disagreed.
 *
 * **A key belongs to the file that owns its screen, and a duplicate is a build error
 * rather than a silent winner** (`tests/i18n.test.ts`) — because "merged last wins" is
 * exactly the kind of quiet rule that decides a sentence on a screen months later.
 */

/**
 * **ושבעה קבצי שערים — אותה סיבה, בקנה מידה של סבב אחד (21.9.2026).** שדרוג השערים של
 * 21.9 נכתב בכמה ידיים במקביל — אשכול שחקנים, חולצות, אתגרים, שחזור, ארכיון, כרטיס,
 * והשכבה המשותפת — וכל אחד מהם היה מוסיף שורות לאותו זנב של `he.json`. מפתח חדש של
 * שער שודרג נכתב בקובץ של האשכול שלו; מפתח ישן נשאר איפה שהוא (כלל 32 — לא מזיזים,
 * לא ממיינים). הכפילות עדיין שגיאת בנייה, בכל זוג קבצים.
 */
export const CATALOGUE_FILES = {
  he,
  heLife,
  heCore,
  hePlayers,
  heKits,
  heChallenge,
  heReplay,
  heArchive,
  heCard,
} as const

const catalogue = {
  ...he,
  ...heLife,
  ...heCore,
  ...hePlayers,
  ...heKits,
  ...heChallenge,
  ...heReplay,
  ...heArchive,
  ...heCard,
}

export type MessageKey = keyof typeof catalogue

const messages = catalogue as Record<MessageKey, string>

/** The merged catalogue, for the tests that read the catalogue itself. */
export const MESSAGES: Record<string, string> = catalogue

export function t(key: MessageKey, vars?: Record<string, string>): string {
  const raw = messages[key]
  if (!vars) return raw
  return Object.entries(vars).reduce(
    (out, [name, value]) => out.replaceAll(`{${name}}`, value),
    raw,
  )
}

export const LOCALE = 'he' as const
export const DIRECTION = 'rtl' as const
