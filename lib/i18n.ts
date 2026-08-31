import he from '@/messages/he.json'

/**
 * Minimal i18n. No dependency: one locale ships today, the shape is ready for more.
 * Swap for next-intl only when a second locale is actually required.
 */
export type MessageKey = keyof typeof he

const messages: Record<MessageKey, string> = he

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
