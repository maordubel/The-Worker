/**
 * Brand values needed outside CSS.
 *
 * Components read colour from tokens, never from a literal — but a few platform
 * surfaces (the browser theme colour, an OG image) take a real value and cannot read a
 * CSS custom property. Those values live here, once, next to the token they mirror.
 * If a token changes, this file changes with it.
 */
export const BRAND = {
  /** mirrors --ink */
  ink: '#121110',
  /** mirrors --sheet */
  sheet: '#F7F5F0',
  /** mirrors --red */
  red: '#CE1410',
} as const
